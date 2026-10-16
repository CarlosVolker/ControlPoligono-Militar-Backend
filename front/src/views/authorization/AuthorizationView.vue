<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { ApiConnection } from '../../types/dashboard'
import { ACCESS_ACTION_RESULT } from '../../types/auth'
import { SESSION_STATUS } from '../../types/session'
import {
  AuthorizationApiError,
  createOverride,
  createPositionPermission,
  createRolePermission,
  createRole,
  deleteOverride,
  deletePositionPermission,
  deleteRole,
  deleteRolePermission,
  getAuditLog,
  getAuthorizationCatalog,
  getEligibleTargetUnits,
  getOverride,
  getPeopleByUnit,
  getPermission,
  getPositionPermission,
  getRole,
  getRoleCategories,
  getRolePermission,
  getScope,
  listOverrides,
  listPermissions,
  listPositionPermissions,
  listRoles,
  listRolePermissions,
  listScopes,
  patchOverride,
  patchPositionPermission,
  patchRole,
  patchRolePermission,
  replaceOverride,
  replacePositionPermission,
  replaceRole,
  replaceRolePermission,
} from '../../features/authorization/api'
import type {
  AuditLogResponseDto,
  AuthorizationCatalogDto,
  EligibleTargetUnitsResponseDto,
  PermissionDto,
  PositionPermissionDto,
  RoleCategoryDto,
  RoleDto,
  RolePermissionDto,
  ScopePolicyDto,
  UserPermissionOverrideDto,
  CreateRoleRequest,
  PatchRoleRequest,
  ReplaceRoleRequest,
  PatchRolePermissionRequest,
  ReplaceRolePermissionRequest,
  PatchPositionPermissionRequest,
  ReplacePositionPermissionRequest,
  CreateUserPermissionOverrideRequest,
  PatchUserPermissionOverrideRequest,
  ReplaceUserPermissionOverrideRequest,
} from '../../features/authorization/api'
import { getMemberships, getPosition, getPositions, getUsers } from '../../features/identity/api'
import type { IdentityUserDTO, PositionDTO, UnitMembershipDTO } from '../../features/identity/api'
import { getOrganizationUnitsLookup } from '../../api/shared/domain'
import type { OrganizationUnitDTO } from '../../types/shared/domain'
import { HttpRequestError } from '../../api/http'
import { ROLE_CODE, AUDIT_ROLE_CONTRACT } from '../../permissions/catalog'
import { buildVisibilitySnapshot, canViewSurface, visibilityOfMeta } from '../../router/visibility'
import { ROUTE_NAMES } from '../../router/routes'
import DsModal from '../../components/shared/DsModal.vue'
import { useSessionStore } from '../../stores/session'

const AUTHORIZATION_SURFACE = {
  ROLES: '/personas/roles',
  SCOPES: '/personas/scopes',
  PERMISSIONS: '/personas/permisos',
  OVERRIDES: '/personas/overrides',
  AUDIT: '/auditoria',
} as const

const PERMISSION_TAB = {
  CATALOG: 'catalogo',
  ROLE_MATRIX: 'matriz-rol',
  POSITION_MATRIX: 'matriz-puesto',
  PEOPLE_BY_UNIT: 'personas-unidad',
} as const

const EDITOR_MODE = {
  CREATE: 'create',
  EDIT: 'edit',
} as const

const AUDIT_UNIT_LINK_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  AVAILABLE: 'available',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
} as const

const RULE_KIND = {
  ROLE: 'role',
  POSITION: 'position',
} as const

const OVERRIDE_RULE_MODE = {
  PERMISSION: 'permission',
  RESOURCE_ACTION: 'resource-action',
} as const

const MODAL_KIND = {
  NONE: 'none',
  ROLE_DETAIL: 'role-detail',
  SCOPE_DETAIL: 'scope-detail',
  PERMISSION_DETAIL: 'permission-detail',
  POSITION_DETAIL: 'position-detail',
  OVERRIDE_DETAIL: 'override-detail',
  ROLE_EDITOR: 'role-editor',
  RULE_EDITOR: 'rule-editor',
  OVERRIDE_EDITOR: 'override-editor',
  DELETE_ROLE: 'delete-role',
  DELETE_RULE: 'delete-rule',
  DELETE_OVERRIDE: 'delete-override',
} as const

// Predicados role-based existentes conservados 1:1 (AC-7); los códigos
// provienen del catálogo compartido. AUDIT_ROLE_CODES es el predicado
// documentado de OP-AUT-004: única visibilidad role-based del cliente.
const ADMIN_ROLE_CODES = [ROLE_CODE.TENANT_ADMIN, ROLE_CODE.SUPER_ADMIN] as const
const AUDIT_ROLE_CODES = AUDIT_ROLE_CONTRACT

type PermissionTab = (typeof PERMISSION_TAB)[keyof typeof PERMISSION_TAB]
type EditorMode = (typeof EDITOR_MODE)[keyof typeof EDITOR_MODE]
type AuditUnitLinkState = (typeof AUDIT_UNIT_LINK_STATE)[keyof typeof AUDIT_UNIT_LINK_STATE]
type RuleKind = (typeof RULE_KIND)[keyof typeof RULE_KIND]
type OverrideRuleMode = (typeof OVERRIDE_RULE_MODE)[keyof typeof OVERRIDE_RULE_MODE]
type ModalKind = (typeof MODAL_KIND)[keyof typeof MODAL_KIND]

interface RequestTicket {
  id: number
  routeKey: string
  epoch: number
  generation: number
  tenantCode: string
  unitCode: string
  principalId: number
  controller: AbortController
}

interface RoleForm {
  code: string
  name: string
  description: string
  is_active: boolean | null
  is_system: boolean | null
}

interface RuleForm {
  targetId: string
  permissionId: string
  allowed: string
}

interface OverrideForm {
  accountId: string
  allowed: string
  ruleMode: OverrideRuleMode
  permissionId: string
  permissionCode: string
  resource: string
  action: string
  reason: string
}

interface DetailField {
  label: string
  value: string
}

interface DetailView {
  title: string
  fields: DetailField[]
  roleId?: number
}

interface OverrideAccountOption {
  accountId: number
  rut: string
}

interface MutationOptions {
  /** Acuse de éxito por operación, en español de dominio. */
  success?: string
  /**
   * Una respuesta 5xx del servidor se trata como rechazo confirmado (error en
   * el modal, datos conservados) en lugar de resultado incierto. Reservado a las
   * bajas: el clasificador general (alta/edición) queda intacto y una falla de
   * red (sin respuesta) sigue siendo incierta en todos los casos.
   */
  serverErrorIsFinal?: boolean
}

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const permissionTabs = [
  { id: PERMISSION_TAB.CATALOG, label: 'Catálogo' },
  { id: PERMISSION_TAB.ROLE_MATRIX, label: 'Matriz rol → permiso' },
  { id: PERMISSION_TAB.POSITION_MATRIX, label: 'Matriz puesto → permiso' },
  { id: PERMISSION_TAB.PEOPLE_BY_UNIT, label: 'Personas por unidad' },
] as const

const surface = computed(() => route.path as string)
const surfaceTitle = computed(() => {
  switch (surface.value) {
    case AUTHORIZATION_SURFACE.ROLES: return 'Roles'
    case AUTHORIZATION_SURFACE.SCOPES: return 'Scopes'
    case AUTHORIZATION_SURFACE.PERMISSIONS: return 'Permisos'
    case AUTHORIZATION_SURFACE.OVERRIDES: return 'Overrides'
    case AUTHORIZATION_SURFACE.AUDIT: return 'Auditoría'
    default: return 'Autorización'
  }
})

function isPermissionTab(value: unknown): value is PermissionTab {
  return typeof value === 'string'
    && Object.values(PERMISSION_TAB).some((candidate) => candidate === value)
}

const activePermissionTab = computed<PermissionTab>(() => {
  const value = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
  return isPermissionTab(value) ? value : PERMISSION_TAB.CATALOG
})

const AUDIT_LIMIT_DEFAULT = 100
const AUDIT_LIMIT_MAX = 500

/** El límite de la bitácora viaja en la URL (`?limit=`), igual que la pestaña. */
function readAuditLimitFromQuery(): number {
  const raw = Array.isArray(route.query.limit) ? route.query.limit[0] : route.query.limit
  const parsed = Number(raw)
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= AUDIT_LIMIT_MAX
    ? parsed
    : AUDIT_LIMIT_DEFAULT
}

const auditLimit = computed(() => readAuditLimitFromQuery())

/** Fila de rol resaltada cuando se llega a la matriz con `?role=<id>`. */
const highlightedRoleId = computed(() => {
  const raw = Array.isArray(route.query.role) ? route.query.role[0] : route.query.role
  return parsePositiveId(typeof raw === 'string' ? raw : '') ?? null
})

const visibilitySnapshot = computed(() => buildVisibilitySnapshot({
  status: session.status,
  context: session.context,
  principalId: session.identity?.id_usuario ?? null,
  tenantCode: session.tenantCode,
  logoutBusy: session.logoutBusy,
}))

/**
 * Mismo predicado que el sidebar: el acceso directo sólo se ofrece si la
 * superficie de destino tiene criterio declarado y se resuelve visible con el
 * snapshot vigente. La ruta de overrides está cerrada por diseño, así que el
 * chip no se pinta mientras siga así.
 */
function surfaceIsVisible(name: string, params?: Record<string, string>): boolean {
  return canViewSurface(
    visibilityOfMeta(router.resolve({ name, params }).meta),
    visibilitySnapshot.value,
  )
}

const overridesSurfaceVisible = computed(() => surfaceIsVisible(ROUTE_NAMES.OVERRIDES))
const unitDetailLinkVisible = computed(() => surfaceIsVisible(ROUTE_NAMES.UNIT_DETAIL, { idUnidad: '1' }))
const personDetailLinkVisible = computed(() => surfaceIsVisible(ROUTE_NAMES.PERSON_DETAIL, { idUsuario: '1' }))

const roles = shallowRef<RoleDto[]>([])
const roleCategories = shallowRef<RoleCategoryDto[]>([])
const scopes = shallowRef<ScopePolicyDto[]>([])
const permissions = shallowRef<PermissionDto[]>([])
const authorizationCatalog = shallowRef<AuthorizationCatalogDto | null>(null)
const rolePermissions = shallowRef<RolePermissionDto[]>([])
const positionPermissions = shallowRef<PositionPermissionDto[]>([])
const positions = shallowRef<PositionDTO[]>([])
const overrides = shallowRef<UserPermissionOverrideDto[]>([])
const memberships = shallowRef<UnitMembershipDTO[]>([])
const users = shallowRef<IdentityUserDTO[]>([])
const organizationUnits = shallowRef<OrganizationUnitDTO[]>([])
const peopleByUnit = shallowRef<Awaited<ReturnType<typeof getPeopleByUnit>>['results']>([])
const eligibleUnits = shallowRef<EligibleTargetUnitsResponseDto | null>(null)
const auditLog = shallowRef<AuditLogResponseDto | null>(null)

const loading = shallowRef(false)
const screenError = shallowRef('')
const successMessage = shallowRef('')
const needsReconcile = shallowRef(false)
const reconciling = shallowRef(false)
const mutationBusy = shallowRef(false)
const modalBusy = shallowRef(false)
const modalError = shallowRef('')
const modalKind = shallowRef<ModalKind>(MODAL_KIND.NONE)
const detailView = shallowRef<DetailView | null>(null)
const auditLimitInput = shallowRef(String(readAuditLimitFromQuery()))
const overrideSearch = shallowRef('')
const selectedUnitCode = shallowRef('')
const includeDescendants = shallowRef(false)
const selectedEligibleUserId = shallowRef('')
const peopleLoading = shallowRef(false)
const peopleError = shallowRef('')
const eligibleLoading = shallowRef(false)
const eligibleError = shallowRef('')
const auditUnitLinkState = shallowRef<AuditUnitLinkState>(AUDIT_UNIT_LINK_STATE.IDLE)

const roleEditorMode = shallowRef<EditorMode>(EDITOR_MODE.CREATE)
// `ref` (no `shallowRef`) en los formularios: los `v-model` anidados deben
// reactivar las derivaciones del editor (p. ej. la regla obligatoria de la
// excepción o el aviso de rol de sistema).
const roleForm = ref<RoleForm>(emptyRoleForm())
const originalRole = shallowRef<RoleDto | null>(null)
const ruleKind = shallowRef<RuleKind>(RULE_KIND.ROLE)
const ruleForm = ref<RuleForm>(emptyRuleForm())
const originalRoleRule = shallowRef<RolePermissionDto | null>(null)
const originalPositionRule = shallowRef<PositionPermissionDto | null>(null)
const overrideEditorMode = shallowRef<EditorMode>(EDITOR_MODE.CREATE)
const overrideForm = ref<OverrideForm>(emptyOverrideForm())
const originalOverride = shallowRef<UserPermissionOverrideDto | null>(null)
const deleteRoleTarget = shallowRef<RoleDto | null>(null)
const deleteRoleRuleTarget = shallowRef<RolePermissionDto | null>(null)
const deletePositionRuleTarget = shallowRef<PositionPermissionDto | null>(null)
const deleteOverrideTarget = shallowRef<UserPermissionOverrideDto | null>(null)

let requestSequence = 0
let scopeEpoch = 0
let isUnmounted = false
const readControllers = new Set<AbortController>()
const writeControllers = new Set<AbortController>()

function emptyRoleForm(): RoleForm {
  return {
    code: '',
    name: '',
    description: '',
    is_active: null,
    is_system: null,
  }
}

function emptyRuleForm(): RuleForm {
  return { targetId: '', permissionId: '', allowed: '' }
}

function emptyOverrideForm(): OverrideForm {
  return {
    accountId: '',
    allowed: '',
    ruleMode: OVERRIDE_RULE_MODE.PERMISSION,
    permissionId: '',
    permissionCode: '',
    resource: '',
    action: '',
    reason: '',
  }
}

function clearData(): void {
  roles.value = []
  roleCategories.value = []
  scopes.value = []
  permissions.value = []
  authorizationCatalog.value = null
  rolePermissions.value = []
  positionPermissions.value = []
  positions.value = []
  auditUnitLinkState.value = AUDIT_UNIT_LINK_STATE.IDLE
  overrides.value = []
  memberships.value = []
  users.value = []
  organizationUnits.value = []
  peopleByUnit.value = []
  eligibleUnits.value = null
  auditLog.value = null
  overrideSearch.value = ''
  selectedUnitCode.value = ''
  includeDescendants.value = false
  selectedEligibleUserId.value = ''
  peopleError.value = ''
  eligibleError.value = ''
  peopleLoading.value = false
  eligibleLoading.value = false
}

function clearForms(): void {
  roleEditorMode.value = EDITOR_MODE.CREATE
  roleForm.value = emptyRoleForm()
  originalRole.value = null
  ruleKind.value = RULE_KIND.ROLE
  ruleForm.value = emptyRuleForm()
  originalRoleRule.value = null
  originalPositionRule.value = null
  overrideEditorMode.value = EDITOR_MODE.CREATE
  overrideForm.value = emptyOverrideForm()
  originalOverride.value = null
  deleteRoleTarget.value = null
  deleteRoleRuleTarget.value = null
  deletePositionRuleTarget.value = null
  deleteOverrideTarget.value = null
  detailView.value = null
}

function invalidateScope(): void {
  scopeEpoch += 1
  requestSequence += 1
  const hadUnresolvedWrite = writeControllers.size > 0
  for (const controller of readControllers) controller.abort()
  for (const controller of writeControllers) controller.abort()
  readControllers.clear()
  writeControllers.clear()
  if (hadUnresolvedWrite) needsReconcile.value = true
  loading.value = false
  peopleLoading.value = false
  eligibleLoading.value = false
  mutationBusy.value = false
  modalBusy.value = false
  modalKind.value = MODAL_KIND.NONE
  modalError.value = ''
  screenError.value = ''
  clearData()
  clearForms()
}

function createTicket(write = false): RequestTicket | null {
  if (
    isUnmounted
    || session.status !== SESSION_STATUS.READY
    || !session.context
    || !session.identity
    || !session.tenantCode.trim()
    || needsReconcile.value
  ) return null

  const controller = new AbortController()
  const ticket: RequestTicket = {
    id: ++requestSequence,
    routeKey: route.fullPath,
    epoch: scopeEpoch,
    generation: session.generation,
    tenantCode: session.tenantCode.trim(),
    unitCode: session.unitCode,
    principalId: session.identity.id_usuario,
    controller,
  }
  ;(write ? writeControllers : readControllers).add(controller)
  return ticket
}

function releaseTicket(ticket: RequestTicket, write = false): void {
  ;(write ? writeControllers : readControllers).delete(ticket.controller)
}

function ticketIsCurrent(ticket: RequestTicket): boolean {
  return !isUnmounted
    && !ticket.controller.signal.aborted
    && ticket.id === requestSequence
    && ticket.epoch === scopeEpoch
    && ticket.routeKey === route.fullPath
    && ticket.generation === session.generation
    && ticket.tenantCode === session.tenantCode.trim()
    && ticket.unitCode === session.unitCode
    && ticket.principalId === session.identity?.id_usuario
    && session.status === SESSION_STATUS.READY
}

function connectionFor(ticket: RequestTicket): ApiConnection {
  return {
    tenantCode: ticket.tenantCode,
    unitCode: ticket.unitCode,
    signal: ticket.controller.signal,
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpRequestError) {
    if (error.status === 403) return error.detail ?? 'El servidor denegó esta operación.'
    if (error.status !== null) {
      return error.detail
        ? `El servidor rechazó la solicitud (respuesta ${error.status}): ${error.detail}`
        : `El servidor rechazó la solicitud (respuesta ${error.status}).`
    }
    if (error.operationKind === 'timeout') return 'La solicitud agotó el tiempo de espera.'
    if (error.operationKind === 'aborted') return 'La solicitud fue cancelada.'
    return error.message
  }
  if (error instanceof AuthorizationApiError) {
    return error.status === null
      ? error.message
      : `El servidor rechazó la solicitud (respuesta ${error.status}): ${error.message}`
  }
  if (error instanceof Error) return error.message
  return 'No se pudo completar la operación.'
}

function mutationOutcomeIsUncertain(error: unknown, serverErrorIsFinal = false): boolean {
  if (error instanceof HttpRequestError) {
    if (error.status === null) return true
    if (error.status >= 500) return !serverErrorIsFinal
    return false
  }
  if (error instanceof AuthorizationApiError) {
    return error.status === 200 || error.status === 201
  }
  return true
}

const contextReady = computed(() => (
  session.status === SESSION_STATUS.READY
  && session.context !== null
  && session.identity !== null
  && Boolean(session.tenantCode.trim())
))

const isTenantAdmin = computed(() => session.context?.assignments.some(
  (assignment) => ADMIN_ROLE_CODES.some((code) => code === assignment.role),
) ?? false)

const isSuperAdmin = computed(() => session.context?.assignments.some(
  (assignment) => assignment.role === ROLE_CODE.SUPER_ADMIN,
) ?? false)

const canManageAuthorization = computed(() => (
  contextReady.value && isTenantAdmin.value && !needsReconcile.value && !mutationBusy.value
))

const canShowAuditShortcut = computed(() => session.context?.assignments.some(
  (assignment) => AUDIT_ROLE_CODES.some((code) => code === assignment.role),
) ?? false)

const modalOpen = computed({
  get: () => modalKind.value !== MODAL_KIND.NONE,
  set: (open: boolean) => {
    if (!open) closeModal()
  },
})

const modalTitle = computed(() => {
  switch (modalKind.value) {
    case MODAL_KIND.ROLE_DETAIL: return detailView.value?.title ?? 'Detalle del rol'
    case MODAL_KIND.SCOPE_DETAIL: return 'Detalle del scope'
    case MODAL_KIND.PERMISSION_DETAIL: return 'Detalle del permiso'
    case MODAL_KIND.POSITION_DETAIL: return 'Detalle del puesto'
    case MODAL_KIND.OVERRIDE_DETAIL: return 'Detalle del override'
    case MODAL_KIND.ROLE_EDITOR: return roleEditorMode.value === EDITOR_MODE.CREATE ? 'Crear rol' : 'Editar rol'
    case MODAL_KIND.RULE_EDITOR: return ruleKind.value === RULE_KIND.ROLE
      ? 'Regla de rol → permiso'
      : 'Regla de puesto → permiso'
    case MODAL_KIND.OVERRIDE_EDITOR: return overrideEditorMode.value === EDITOR_MODE.CREATE
      ? 'Crear excepción individual'
      : 'Editar excepción individual'
    case MODAL_KIND.DELETE_ROLE: return 'Eliminar rol'
    case MODAL_KIND.DELETE_RULE: return 'Eliminar regla de permiso'
    case MODAL_KIND.DELETE_OVERRIDE: return 'Eliminar override'
    default: return ''
  }
})

const roleRuleIndex = computed(() => new Map(
  rolePermissions.value.map((row) => [`${row.role}:${row.permission}`, row]),
))

const positionRuleIndex = computed(() => new Map(
  positionPermissions.value.map((row) => [`${row.position}:${row.permission}`, row]),
))

const auditUnitIdByCode = computed(() => {
  const index = new Map<string, number | null>()
  for (const unit of organizationUnits.value) {
    index.set(unit.code, index.has(unit.code) ? null : unit.id)
  }
  return index
})

const filteredOverrides = computed(() => {
  const query = overrideSearch.value.trim().toLocaleLowerCase()
  if (!query) return overrides.value
  return overrides.value.filter((item) => [
    item.account_rut,
    item.permission_code ?? '',
    item.resource,
    item.action,
    item.reason,
    item.created_by_rut ?? '',
  ].some((value) => value.toLocaleLowerCase().includes(query)))
})

const overrideAccountOptions = computed<OverrideAccountOption[]>(() => {
  const unique = new Map<number, OverrideAccountOption>()
  for (const membership of memberships.value) {
    if (!unique.has(membership.account)) {
      unique.set(membership.account, { accountId: membership.account, rut: membership.rut })
    }
  }
  const current = originalOverride.value
  if (current && !unique.has(current.account)) {
    unique.set(current.account, { accountId: current.account, rut: current.account_rut })
  }
  return [...unique.values()]
})

const overrideResourceOptions = computed(() => {
  const values = new Set(authorizationCatalog.value?.resources.map((resource) => resource.code) ?? [])
  const current = originalOverride.value?.resource
  if (current) values.add(current)
  return [...values]
})

const overrideActionOptions = computed(() => {
  const values = new Set(authorizationCatalog.value?.actions.map((action) => action.code) ?? [])
  const current = originalOverride.value?.action
  if (current) values.add(current)
  return [...values]
})

const roleRuleIsSystem = computed(() => {
  if (ruleKind.value !== RULE_KIND.ROLE) return false
  const id = parsePositiveId(ruleForm.value.targetId)
  return roles.value.find((role) => role.id === id)?.is_system ?? false
})

const ruleEditorAllowed = computed(() => (
  canManageAuthorization.value
  && !(ruleKind.value === RULE_KIND.ROLE && roleRuleIsSystem.value && !isSuperAdmin.value)
))

/** El permiso original puede no estar en el catálogo activo; se conserva como válido. */
function isOriginalPermission(id: number): boolean {
  return originalOverride.value?.permission === id
}

/**
 * La excepción individual exige una regla concreta: un permiso del catálogo
 * (por ID) o el par recurso/acción. Sin regla válida no se habilita el guardado,
 * porque el backend no la evaluaría y la mutación no surtiría efecto.
 */
const overrideRuleValid = computed(() => {
  if (overrideForm.value.ruleMode === OVERRIDE_RULE_MODE.RESOURCE_ACTION) {
    return Boolean(overrideForm.value.resource)
      && overrideResourceOptions.value.includes(overrideForm.value.resource)
      && Boolean(overrideForm.value.action)
      && overrideActionOptions.value.includes(overrideForm.value.action)
  }
  const id = parsePositiveId(overrideForm.value.permissionId)
  return id !== null
    && (permissions.value.some((permission) => permission.id === id) || isOriginalPermission(id))
})

/**
 * Valor real de «Rol de sistema» que se envía al servidor. Un administrador de
 * tenant que no es super administrador no puede marcarlo: queda en el valor del
 * registro («No» al crear) y el campo se muestra deshabilitado.
 */
const roleSystemWriteValue = computed<boolean | null>(() => {
  if (isSuperAdmin.value) return roleForm.value.is_system
  return originalRole.value?.is_system ?? false
})

function parsePositiveId(value: string): number | null {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(parsed)
}

function displayValue(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

function resolvedAuditUnitId(code: string | null): number | null {
  if (!code || !code.trim()) return null
  return auditUnitIdByCode.value.get(code) ?? null
}

function resolvedAuditPersonId(userId: number | null): number | null {
  if (userId === null || !Number.isSafeInteger(userId) || userId <= 0) return null
  return userId
}

function currentSessionMessage(): string {
  if (session.failure?.detail) return session.failure.detail
  if (session.status === SESSION_STATUS.NEEDS_TENANT) {
    return 'Falta resolver el tenant. Abre la pantalla de contexto y confirma la institución antes de continuar.'
  }
  if (session.status === SESSION_STATUS.ANONYMOUS) return 'La sesión no está autenticada.'
  if (session.status === SESSION_STATUS.CONTEXT_LOST) return 'El contexto de acceso dejó de estar disponible.'
  if (session.status === SESSION_STATUS.FAILURE) return 'No se pudo confirmar el contexto actual.'
  if (session.status === SESSION_STATUS.BOOTING) return 'Esperando la confirmación del contexto actual.'
  return 'Esta vista requiere un contexto autenticado y un tenant confirmado.'
}

function accessResultMessage(result: Awaited<ReturnType<typeof session.ensureContext>>): string {
  if (result.kind === ACCESS_ACTION_RESULT.REJECTED || result.kind === ACCESS_ACTION_RESULT.UNCERTAIN) {
    return result.error.detail ?? currentSessionMessage()
  }
  if (result.kind === ACCESS_ACTION_RESULT.BLOCKED) {
    return `No se pudo reconciliar el contexto (${result.reason}).`
  }
  return currentSessionMessage()
}

function closeModal(): void {
  modalKind.value = MODAL_KIND.NONE
  modalBusy.value = false
  modalError.value = ''
  clearForms()
}

async function loadSurface(): Promise<void> {
  if (!contextReady.value || needsReconcile.value || !Object.values(AUTHORIZATION_SURFACE).includes(surface.value as never)) {
    return
  }
  const ticket = createTicket()
  if (!ticket) return
  const connection = connectionFor(ticket)
  loading.value = true
  screenError.value = ''

  try {
    switch (surface.value) {
      case AUTHORIZATION_SURFACE.ROLES: {
        const [nextRoles, nextCategories] = await Promise.all([
          listRoles(connection),
          getRoleCategories(connection),
        ])
        if (!ticketIsCurrent(ticket)) return
        roles.value = nextRoles
        roleCategories.value = nextCategories.categories
        break
      }
      case AUTHORIZATION_SURFACE.SCOPES: {
        const nextScopes = await listScopes(connection)
        if (!ticketIsCurrent(ticket)) return
        scopes.value = nextScopes
        break
      }
      case AUTHORIZATION_SURFACE.PERMISSIONS: {
        if (activePermissionTab.value === PERMISSION_TAB.CATALOG) {
          const nextPermissions = await listPermissions(connection)
          if (!ticketIsCurrent(ticket)) return
          permissions.value = nextPermissions
          break
        }
        if (activePermissionTab.value === PERMISSION_TAB.ROLE_MATRIX) {
          const [nextCatalog, nextRoles, nextPermissions, nextRules] = await Promise.all([
            getAuthorizationCatalog(connection),
            listRoles(connection),
            listPermissions(connection),
            listRolePermissions(connection),
          ])
          if (!ticketIsCurrent(ticket)) return
          authorizationCatalog.value = nextCatalog
          roles.value = nextRoles
          permissions.value = nextPermissions
          rolePermissions.value = nextRules
          break
        }
        if (activePermissionTab.value === PERMISSION_TAB.POSITION_MATRIX) {
          const [nextCatalog, nextPositions, nextPermissions, nextRules] = await Promise.all([
            getAuthorizationCatalog(connection),
            getPositions(connection),
            listPermissions(connection),
            listPositionPermissions(connection),
          ])
          if (!ticketIsCurrent(ticket)) return
          authorizationCatalog.value = nextCatalog
          positions.value = nextPositions
          permissions.value = nextPermissions
          positionPermissions.value = nextRules
          break
        }
        const [nextUnits, nextUsers] = await Promise.all([
          getOrganizationUnitsLookup(connection),
          getUsers(connection),
        ])
        if (!ticketIsCurrent(ticket)) return
        organizationUnits.value = nextUnits.results
        users.value = nextUsers
        break
      }
      case AUTHORIZATION_SURFACE.OVERRIDES: {
        const nextOverrides = await listOverrides(connection)
        if (!ticketIsCurrent(ticket)) return
        overrides.value = nextOverrides
        break
      }
      case AUTHORIZATION_SURFACE.AUDIT: {
        auditLog.value = null
        organizationUnits.value = []
        auditUnitLinkState.value = AUDIT_UNIT_LINK_STATE.IDLE
        const nextAudit = await getAuditLog(connection, auditLimit.value)
        if (!ticketIsCurrent(ticket)) return
        auditLog.value = nextAudit
        if (!nextAudit.results.some((entry) => entry.organization_unit_code?.trim())) break

        auditUnitLinkState.value = AUDIT_UNIT_LINK_STATE.LOADING
        try {
          const unitLookup = await getOrganizationUnitsLookup(connection)
          if (!ticketIsCurrent(ticket)) return
          organizationUnits.value = unitLookup.results
          auditUnitLinkState.value = AUDIT_UNIT_LINK_STATE.AVAILABLE
        } catch (error: unknown) {
          if (!ticketIsCurrent(ticket)) return
          auditUnitLinkState.value = error instanceof HttpRequestError && error.status === 403
            ? AUDIT_UNIT_LINK_STATE.DENIED
            : AUDIT_UNIT_LINK_STATE.UNAVAILABLE
        }
        break
      }
    }
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket) && !isAbortError(error)) screenError.value = errorMessage(error)
  } finally {
    releaseTicket(ticket)
    if (ticketIsCurrent(ticket)) loading.value = false
  }
}

async function reconcileContext(): Promise<void> {
  if (reconciling.value) return
  reconciling.value = true
  needsReconcile.value = true
  screenError.value = ''
  const result = await session.ensureContext()
  if (result.kind !== ACCESS_ACTION_RESULT.SUCCESS || session.status !== SESSION_STATUS.READY) {
    needsReconcile.value = true
    screenError.value = accessResultMessage(result)
  } else {
    needsReconcile.value = false
    screenError.value = ''
    if (!loading.value) await loadSurface()
  }
  reconciling.value = false
}

watch(
  () => [
    route.fullPath,
    session.status,
    session.generation,
    session.tenantCode,
    session.unitCode,
    session.identity?.id_usuario ?? null,
    session.context,
  ] as const,
  (current, previous) => {
    const routeChanged = current[0] !== previous[0]
    const sessionChanged = current.slice(1).some((value, index) => value !== previous[index + 1])
    if (!routeChanged && !sessionChanged) return

    // El acuse de éxito se limpia por superficie o por alcance; sobrevive a la
    // reconciliación de la propia mutación, que no cambia ninguno de esos tres.
    if (
      routeChanged
      || current[3] !== previous[3]
      || current[4] !== previous[4]
      || current[5] !== previous[5]
    ) {
      successMessage.value = ''
    }
    if (routeChanged) auditLimitInput.value = String(readAuditLimitFromQuery())

    invalidateScope()
    if (sessionChanged && contextReady.value) needsReconcile.value = false
    if (contextReady.value && !needsReconcile.value) void loadSurface()
  },
  { flush: 'sync' },
)

onMounted(() => {
  void loadSurface()
})

onBeforeUnmount(() => {
  isUnmounted = true
  scopeEpoch += 1
  requestSequence += 1
  for (const controller of readControllers) controller.abort()
  for (const controller of writeControllers) controller.abort()
  readControllers.clear()
  writeControllers.clear()
  clearData()
  clearForms()
})

function changePermissionTab(tab: PermissionTab): void {
  if (tab === activePermissionTab.value && surface.value === AUTHORIZATION_SURFACE.PERMISSIONS) return
  void router.replace({ path: AUTHORIZATION_SURFACE.PERMISSIONS, query: { tab } })
}

function handleTabKeydown(event: KeyboardEvent): void {
  const current = event.target
  if (!(current instanceof HTMLButtonElement)) return
  const list = current.closest('[role="tablist"]')
  if (!list) return
  const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
  const index = buttons.indexOf(current)
  if (index < 0) return

  let nextIndex = index
  if (event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length
  else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + buttons.length) % buttons.length
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = buttons.length - 1
  else return

  event.preventDefault()
  buttons[nextIndex]?.focus()
  const nextTab = permissionTabs[nextIndex]
  if (nextTab) changePermissionTab(nextTab.id)
}

async function showDetail(
  kind: ModalKind,
  title: string,
  reader: (connection: ApiConnection) => Promise<DetailView>,
): Promise<void> {
  const ticket = createTicket()
  if (!ticket) {
    screenError.value = needsReconcile.value ? 'Reconcilia el contexto antes de abrir otro registro.' : currentSessionMessage()
    return
  }
  modalKind.value = kind
  modalBusy.value = true
  modalError.value = ''
  detailView.value = { title, fields: [] }
  try {
    const result = await reader(connectionFor(ticket))
    if (!ticketIsCurrent(ticket)) return
    detailView.value = result
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket) && !isAbortError(error)) modalError.value = errorMessage(error)
  } finally {
    releaseTicket(ticket)
    if (ticketIsCurrent(ticket)) modalBusy.value = false
  }
}

function roleFields(role: RoleDto): DetailView {
  return {
    title: role.name,
    roleId: role.id,
    fields: [
      { label: 'ID', value: String(role.id) },
      { label: 'Código', value: role.code },
      { label: 'Nombre', value: role.name },
      { label: 'Descripción', value: displayValue(role.description) },
      { label: 'Activo', value: role.is_active ? 'Sí' : 'No' },
      { label: 'Rol de sistema', value: role.is_system ? 'Sí' : 'No' },
    ],
  }
}

function scopeFields(scope: ScopePolicyDto): DetailView {
  return {
    title: scope.name,
    fields: [
      { label: 'ID', value: String(scope.id) },
      { label: 'Código', value: scope.code },
      { label: 'Nombre', value: scope.name },
      { label: 'Descripción', value: displayValue(scope.description) },
    ],
  }
}

function permissionFields(permission: PermissionDto): DetailView {
  return {
    title: permission.name,
    fields: [
      { label: 'ID', value: String(permission.id) },
      { label: 'Código', value: permission.code },
      { label: 'Nombre', value: permission.name },
      { label: 'Categoría', value: permission.category },
      { label: 'Descripción', value: displayValue(permission.description) },
      { label: 'Activo', value: permission.is_active ? 'Sí' : 'No' },
    ],
  }
}

function positionFields(position: PositionDTO): DetailView {
  return {
    title: position.name,
    fields: [
      { label: 'ID', value: String(position.id) },
      { label: 'Código', value: position.code },
      { label: 'Nombre', value: position.name },
      { label: 'Unidad', value: `${position.organization_unit_code} · ${position.organization_unit_name}` },
      { label: 'Rol', value: `${position.role_code} · ${position.role_name}` },
      { label: 'Scope', value: displayValue(position.scope_code) },
      { label: 'Activo', value: position.is_active ? 'Sí' : 'No' },
    ],
  }
}

function overrideFields(override: UserPermissionOverrideDto): DetailView {
  return {
    title: `Cuenta ${override.account_rut}`,
    fields: [
      { label: 'ID', value: String(override.id) },
      { label: 'Cuenta', value: `${override.account_rut} · ${override.account}` },
      { label: 'Efecto', value: override.allowed ? 'ALLOW' : 'DENY' },
      { label: 'Permiso', value: displayValue(override.permission_code) },
      { label: 'Recurso', value: displayValue(override.resource) },
      { label: 'Acción', value: displayValue(override.action) },
      { label: 'Motivo', value: displayValue(override.reason) },
      { label: 'Creado por', value: displayValue(override.created_by_rut) },
      { label: 'Creado', value: formatDate(override.created_at) },
    ],
  }
}

function openRoleDetail(id: number): void {
  void showDetail(MODAL_KIND.ROLE_DETAIL, 'Rol', async (connection) => roleFields(await getRole(id, connection)))
}

function openScopeDetail(id: number): void {
  void showDetail(MODAL_KIND.SCOPE_DETAIL, 'Scope', async (connection) => scopeFields(await getScope(id, connection)))
}

function openPermissionDetail(id: number): void {
  void showDetail(MODAL_KIND.PERMISSION_DETAIL, 'Permiso', async (connection) => permissionFields(await getPermission(id, connection)))
}

function openPositionDetail(id: number): void {
  void showDetail(MODAL_KIND.POSITION_DETAIL, 'Puesto', async (connection) => positionFields(await getPosition(id, connection)))
}

function openOverrideDetail(id: number): void {
  void showDetail(MODAL_KIND.OVERRIDE_DETAIL, 'Override', async (connection) => overrideFields(await getOverride(id, connection)))
}

function openRoleMatrix(roleId?: number): void {
  const query: Record<string, string> = { tab: PERMISSION_TAB.ROLE_MATRIX }
  if (roleId !== undefined) query.role = String(roleId)
  void router.replace({ path: AUTHORIZATION_SURFACE.PERMISSIONS, query })
}

async function openRoleEditor(roleId?: number): Promise<void> {
  if (!canManageAuthorization.value) return
  clearForms()
  modalKind.value = MODAL_KIND.ROLE_EDITOR
  roleEditorMode.value = roleId === undefined ? EDITOR_MODE.CREATE : EDITOR_MODE.EDIT
  modalBusy.value = roleId !== undefined
  modalError.value = ''
  if (roleId === undefined) return

  const ticket = createTicket()
  if (!ticket) {
    modalBusy.value = false
    modalError.value = currentSessionMessage()
    return
  }
  try {
    const role = await getRole(roleId, connectionFor(ticket))
    if (!ticketIsCurrent(ticket)) return
    originalRole.value = role
    roleForm.value = {
      code: role.code,
      name: role.name,
      description: role.description,
      is_active: role.is_active,
      is_system: role.is_system,
    }
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket) && !isAbortError(error)) modalError.value = errorMessage(error)
  } finally {
    releaseTicket(ticket)
    if (ticketIsCurrent(ticket)) modalBusy.value = false
  }
}

function buildRolePatch(original: RoleDto, form: RoleForm, isSystem: boolean | null): PatchRoleRequest {
  const body: PatchRoleRequest = {}
  const code = form.code.trim()
  const name = form.name.trim()
  if (code !== original.code) body.code = code
  if (name !== original.name) body.name = name
  if (form.description !== original.description) body.description = form.description
  if (form.is_active !== null && form.is_active !== original.is_active) body.is_active = form.is_active
  if (isSystem !== null && isSystem !== original.is_system) body.is_system = isSystem
  return body
}

/** Cambios del rol: PATCH por defecto; el reemplazo completo es acción aparte. */
async function saveRole(): Promise<void> {
  if (!canManageAuthorization.value) return
  const code = roleForm.value.code.trim()
  const name = roleForm.value.name.trim()
  if (!code || !name) {
    modalError.value = 'Código y nombre son obligatorios.'
    return
  }
  const original = originalRole.value
  if (roleEditorMode.value === EDITOR_MODE.EDIT && !original) {
    modalError.value = 'No hay un rol confirmado para editar.'
    return
  }
  if (original) {
    const body = buildRolePatch(original, roleForm.value, roleSystemWriteValue.value)
    if (Object.keys(body).length === 0) {
      modalError.value = 'No hay cambios para enviar.'
      return
    }
    await executeMutation(
      (connection) => patchRole(original.id, body, connection),
      { success: 'Rol actualizado.' },
    )
    return
  }

  const body: CreateRoleRequest = {
    code,
    name,
    description: roleForm.value.description,
    ...(roleForm.value.is_active === null ? {} : { is_active: roleForm.value.is_active }),
    ...(roleSystemWriteValue.value === null ? {} : { is_system: roleSystemWriteValue.value }),
  }
  await executeMutation((connection) => createRole(body, connection), { success: 'Rol creado.' })
}

/** Reemplazo completo del rol (PUT): acción secundaria y explícita en edición. */
async function replaceRoleRecord(): Promise<void> {
  if (!canManageAuthorization.value) return
  const original = originalRole.value
  if (!original) {
    modalError.value = 'No hay un rol confirmado para reemplazar.'
    return
  }
  const code = roleForm.value.code.trim()
  const name = roleForm.value.name.trim()
  if (!code || !name) {
    modalError.value = 'Código y nombre son obligatorios.'
    return
  }
  const body: ReplaceRoleRequest = {
    code,
    name,
    description: roleForm.value.description,
    is_active: roleForm.value.is_active ?? original.is_active,
    is_system: roleSystemWriteValue.value ?? original.is_system,
  }
  await executeMutation(
    (connection) => replaceRole(original.id, body, connection),
    { success: 'Rol reemplazado por completo.' },
  )
}

function confirmDeleteRole(role: RoleDto): void {
  if (!canManageAuthorization.value) return
  deleteRoleTarget.value = role
  modalError.value = ''
  modalKind.value = MODAL_KIND.DELETE_ROLE
}

function confirmDeleteRule(kind: RuleKind, row: RolePermissionDto | PositionPermissionDto): void {
  if (!canManageAuthorization.value) return
  if (kind === RULE_KIND.ROLE) {
    const roleRule = row as RolePermissionDto
    if (roles.value.find((role) => role.id === roleRule.role)?.is_system && !isSuperAdmin.value) return
    deleteRoleRuleTarget.value = roleRule
    deletePositionRuleTarget.value = null
  } else {
    deletePositionRuleTarget.value = row as PositionPermissionDto
    deleteRoleRuleTarget.value = null
  }
  modalError.value = ''
  modalKind.value = MODAL_KIND.DELETE_RULE
}

function confirmDeleteOverride(override: UserPermissionOverrideDto): void {
  if (!canManageAuthorization.value) return
  deleteOverrideTarget.value = override
  modalError.value = ''
  modalKind.value = MODAL_KIND.DELETE_OVERRIDE
}

async function confirmDelete(): Promise<void> {
  if (!canManageAuthorization.value) return
  const options: MutationOptions = { serverErrorIsFinal: true }
  if (modalKind.value === MODAL_KIND.DELETE_ROLE && deleteRoleTarget.value) {
    const id = deleteRoleTarget.value.id
    await executeMutation(
      (connection) => deleteRole(id, connection),
      { ...options, success: 'Rol eliminado.' },
    )
    return
  }
  if (modalKind.value === MODAL_KIND.DELETE_RULE && deleteRoleRuleTarget.value) {
    const roleRule = deleteRoleRuleTarget.value
    if (roles.value.find((role) => role.id === roleRule.role)?.is_system && !isSuperAdmin.value) return
    await executeMutation(
      (connection) => deleteRolePermission(roleRule.id, connection),
      { ...options, success: 'Regla eliminada.' },
    )
    return
  }
  if (modalKind.value === MODAL_KIND.DELETE_RULE && deletePositionRuleTarget.value) {
    const id = deletePositionRuleTarget.value.id
    await executeMutation(
      (connection) => deletePositionPermission(id, connection),
      { ...options, success: 'Regla eliminada.' },
    )
    return
  }
  if (modalKind.value === MODAL_KIND.DELETE_OVERRIDE && deleteOverrideTarget.value) {
    const id = deleteOverrideTarget.value.id
    await executeMutation(
      (connection) => deleteOverride(id, connection),
      { ...options, success: 'Excepción eliminada.' },
    )
  }
}

async function openRuleEditor(
  kind: RuleKind,
  row?: RolePermissionDto | PositionPermissionDto,
  targetId?: number,
  permissionId?: number,
): Promise<void> {
  if (!canManageAuthorization.value) return
  clearForms()
  ruleKind.value = kind
  modalKind.value = MODAL_KIND.RULE_EDITOR
  modalBusy.value = Boolean(row)
  modalError.value = ''
  ruleForm.value = {
    targetId: targetId === undefined ? '' : String(targetId),
    permissionId: permissionId === undefined ? '' : String(permissionId),
    allowed: '',
  }
  if (!row) return

  const ticket = createTicket()
  if (!ticket) {
    modalBusy.value = false
    modalError.value = currentSessionMessage()
    return
  }
  try {
    if (kind === RULE_KIND.ROLE) {
      const loaded = await getRolePermission(row.id, connectionFor(ticket))
      if (!ticketIsCurrent(ticket)) return
      originalRoleRule.value = loaded
      ruleForm.value = {
        targetId: String(loaded.role),
        permissionId: String(loaded.permission),
        allowed: String(loaded.allowed),
      }
    } else {
      const loaded = await getPositionPermission(row.id, connectionFor(ticket))
      if (!ticketIsCurrent(ticket)) return
      originalPositionRule.value = loaded
      ruleForm.value = {
        targetId: String(loaded.position),
        permissionId: String(loaded.permission),
        allowed: String(loaded.allowed),
      }
    }
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket) && !isAbortError(error)) modalError.value = errorMessage(error)
  } finally {
    releaseTicket(ticket)
    if (ticketIsCurrent(ticket)) modalBusy.value = false
  }
}

function buildRoleRulePatch(
  original: RolePermissionDto,
  targetId: number,
  permissionId: number,
  allowed: boolean,
): PatchRolePermissionRequest {
  const body: PatchRolePermissionRequest = {}
  if (targetId !== original.role) body.role = targetId
  if (permissionId !== original.permission) body.permission = permissionId
  if (allowed !== original.allowed) body.allowed = allowed
  return body
}

function buildPositionRulePatch(
  original: PositionPermissionDto,
  targetId: number,
  permissionId: number,
  allowed: boolean,
): PatchPositionPermissionRequest {
  const body: PatchPositionPermissionRequest = {}
  if (targetId !== original.position) body.position = targetId
  if (permissionId !== original.permission) body.permission = permissionId
  if (allowed !== original.allowed) body.allowed = allowed
  return body
}

/** Cambios de la regla: PATCH en edición, POST en alta. */
async function saveRule(): Promise<void> {
  if (!ruleEditorAllowed.value) return
  const targetId = parsePositiveId(ruleForm.value.targetId)
  const permissionId = parsePositiveId(ruleForm.value.permissionId)
  if (targetId === null || permissionId === null || !['true', 'false'].includes(ruleForm.value.allowed)) {
    modalError.value = 'Selecciona el rol o puesto, un permiso del catálogo y ALLOW o DENY.'
    return
  }
  const allowed = ruleForm.value.allowed === 'true'

  if (ruleKind.value === RULE_KIND.ROLE) {
    const role = roles.value.find((candidate) => candidate.id === targetId)
    if (!role || !permissions.value.some((candidate) => candidate.id === permissionId)) {
      modalError.value = 'La selección ya no pertenece a los catálogos cargados.'
      return
    }
    if (role.is_system && !isSuperAdmin.value) {
      modalError.value = 'Las reglas de los roles de sistema las administra un super administrador.'
      return
    }
    const original = originalRoleRule.value
    if (original) {
      const body = buildRoleRulePatch(original, targetId, permissionId, allowed)
      if (Object.keys(body).length === 0) {
        modalError.value = 'No hay cambios para enviar.'
        return
      }
      await executeMutation(
        (connection) => patchRolePermission(original.id, body, connection),
        { success: 'Regla actualizada.' },
      )
      return
    }
    await executeMutation(
      (connection) => createRolePermission({ role: targetId, permission: permissionId, allowed }, connection),
      { success: 'Regla creada.' },
    )
    return
  }

  const position = positions.value.find((candidate) => candidate.id === targetId)
  if (!position || !permissions.value.some((candidate) => candidate.id === permissionId)) {
    modalError.value = 'La selección ya no pertenece a los catálogos cargados.'
    return
  }
  const original = originalPositionRule.value
  if (original) {
    const body = buildPositionRulePatch(original, targetId, permissionId, allowed)
    if (Object.keys(body).length === 0) {
      modalError.value = 'No hay cambios para enviar.'
      return
    }
    await executeMutation(
      (connection) => patchPositionPermission(original.id, body, connection),
      { success: 'Regla actualizada.' },
    )
    return
  }
  await executeMutation(
    (connection) => createPositionPermission({ position: targetId, permission: permissionId, allowed }, connection),
    { success: 'Regla creada.' },
  )
}

/** Reemplazo completo de la regla (PUT): acción secundaria y explícita en edición. */
async function replaceRule(): Promise<void> {
  if (!ruleEditorAllowed.value) return
  const targetId = parsePositiveId(ruleForm.value.targetId)
  const permissionId = parsePositiveId(ruleForm.value.permissionId)
  const allowedRaw = ruleForm.value.allowed
  if (targetId === null || permissionId === null || !['true', 'false'].includes(allowedRaw)) {
    modalError.value = 'Selecciona el rol o puesto, un permiso del catálogo y ALLOW o DENY.'
    return
  }
  const allowed = allowedRaw === 'true'

  const roleRule = originalRoleRule.value
  if (ruleKind.value === RULE_KIND.ROLE && roleRule) {
    const body: ReplaceRolePermissionRequest = { role: targetId, permission: permissionId, allowed }
    await executeMutation(
      (connection) => replaceRolePermission(roleRule.id, body, connection),
      { success: 'Regla reemplazada por completo.' },
    )
    return
  }
  const positionRule = originalPositionRule.value
  if (positionRule) {
    const body: ReplacePositionPermissionRequest = { position: targetId, permission: permissionId, allowed }
    await executeMutation(
      (connection) => replacePositionPermission(positionRule.id, body, connection),
      { success: 'Regla reemplazada por completo.' },
    )
  }
}

async function loadOverrideEditorDependencies(ticket: RequestTicket): Promise<void> {
  const connection = connectionFor(ticket)
  const [nextMemberships, nextCatalog, nextPermissions] = await Promise.all([
    getMemberships(connection),
    getAuthorizationCatalog(connection),
    listPermissions(connection),
  ])
  if (!ticketIsCurrent(ticket)) return
  memberships.value = nextMemberships
  authorizationCatalog.value = nextCatalog
  permissions.value = nextPermissions
}

async function openOverrideEditor(overrideId?: number): Promise<void> {
  if (!canManageAuthorization.value) return
  clearForms()
  modalKind.value = MODAL_KIND.OVERRIDE_EDITOR
  overrideEditorMode.value = overrideId === undefined ? EDITOR_MODE.CREATE : EDITOR_MODE.EDIT
  modalBusy.value = true
  modalError.value = ''
  const ticket = createTicket()
  if (!ticket) {
    modalBusy.value = false
    modalError.value = currentSessionMessage()
    return
  }
  try {
    await loadOverrideEditorDependencies(ticket)
    if (!ticketIsCurrent(ticket)) return
    if (overrideId === undefined) {
      modalBusy.value = false
      return
    }
    const override = await getOverride(overrideId, connectionFor(ticket))
    if (!ticketIsCurrent(ticket)) return
    originalOverride.value = override
    // La regla de la excepción es una sola: permiso del catálogo (por ID) o el
    // par recurso/acción legado. No existe una «excepción sin regla»: nunca
    // coincide en la evaluación del backend.
    const ruleMode = override.resource || override.action
      ? OVERRIDE_RULE_MODE.RESOURCE_ACTION
      : OVERRIDE_RULE_MODE.PERMISSION
    overrideForm.value = {
      accountId: String(override.account),
      allowed: String(override.allowed),
      ruleMode,
      permissionId: override.permission === null ? '' : String(override.permission),
      permissionCode: override.permission_code ?? '',
      resource: override.resource,
      action: override.action,
      reason: override.reason,
    }
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket) && !isAbortError(error)) modalError.value = errorMessage(error)
  } finally {
    releaseTicket(ticket)
    if (ticketIsCurrent(ticket)) modalBusy.value = false
  }
}

function overrideWriteBody(): CreateUserPermissionOverrideRequest {
  const account = parsePositiveId(overrideForm.value.accountId)
  if (account === null || !['true', 'false'].includes(overrideForm.value.allowed)) {
    throw new Error('Selecciona una cuenta y define ALLOW o DENY.')
  }
  const body: CreateUserPermissionOverrideRequest = {
    account,
    allowed: overrideForm.value.allowed === 'true',
    resource: '',
    action: '',
  }
  if (overrideForm.value.ruleMode === OVERRIDE_RULE_MODE.RESOURCE_ACTION) {
    const resource = overrideForm.value.resource
    const action = overrideForm.value.action
    if (!resource || !overrideResourceOptions.value.includes(resource)
      || !action || !overrideActionOptions.value.includes(action)) {
      throw new Error('Selecciona recurso y acción del catálogo recibido.')
    }
    body.permission = null
    body.resource = resource
    body.action = action
  } else {
    const permission = parsePositiveId(overrideForm.value.permissionId)
    if (permission === null
      || (!permissions.value.some((item) => item.id === permission) && !isOriginalPermission(permission))) {
      throw new Error('Selecciona un permiso del catálogo.')
    }
    body.permission = permission
  }
  const reason = overrideForm.value.reason
  if (reason !== '') body.reason = reason
  return body
}

function overridePatchBody(
  original: UserPermissionOverrideDto,
  current: CreateUserPermissionOverrideRequest,
): PatchUserPermissionOverrideRequest {
  const body: PatchUserPermissionOverrideRequest = {}
  if (current.account !== original.account) body.account = current.account
  if (current.allowed !== original.allowed) body.allowed = current.allowed
  if (current.permission !== undefined && current.permission !== original.permission) {
    body.permission = current.permission
  }
  if (current.resource !== undefined && current.resource !== original.resource) body.resource = current.resource
  if (current.action !== undefined && current.action !== original.action) body.action = current.action
  if (current.reason !== undefined && current.reason !== original.reason) body.reason = current.reason
  return body
}

/** Cambios de la excepción: PATCH en edición, POST en alta. */
async function saveOverride(): Promise<void> {
  if (!canManageAuthorization.value) return
  const original = originalOverride.value
  if (overrideEditorMode.value === EDITOR_MODE.EDIT && !original) {
    modalError.value = 'No hay una excepción confirmada para editar.'
    return
  }
  let body: CreateUserPermissionOverrideRequest
  try {
    body = overrideWriteBody()
  } catch (error: unknown) {
    modalError.value = errorMessage(error)
    return
  }
  if (original) {
    const patch = overridePatchBody(original, body)
    if (Object.keys(patch).length === 0) {
      modalError.value = 'No hay cambios para enviar.'
      return
    }
    await executeMutation(
      (connection) => patchOverride(original.id, patch, connection),
      { success: 'Excepción actualizada.' },
    )
    return
  }
  await executeMutation((connection) => createOverride(body, connection), { success: 'Excepción creada.' })
}

/** Reemplazo completo de la excepción (PUT): acción secundaria y explícita en edición. */
async function replaceOverrideRecord(): Promise<void> {
  if (!canManageAuthorization.value) return
  const original = originalOverride.value
  if (!original) {
    modalError.value = 'No hay una excepción confirmada para reemplazar.'
    return
  }
  let body: CreateUserPermissionOverrideRequest
  try {
    body = overrideWriteBody()
  } catch (error: unknown) {
    modalError.value = errorMessage(error)
    return
  }
  const replacement: ReplaceUserPermissionOverrideRequest = body
  await executeMutation(
    (connection) => replaceOverride(original.id, replacement, connection),
    { success: 'Excepción reemplazada por completo.' },
  )
}

async function executeMutation(
  operation: (connection: ApiConnection) => Promise<unknown>,
  options: MutationOptions = {},
): Promise<void> {
  if (!canManageAuthorization.value) return
  const ticket = createTicket(true)
  if (!ticket) {
    modalError.value = needsReconcile.value ? 'Reconcilia el contexto antes de volver a operar.' : currentSessionMessage()
    return
  }
  const mutationIdentity = {
    generation: ticket.generation,
    tenantCode: ticket.tenantCode,
    principalId: ticket.principalId,
  }
  mutationBusy.value = true
  modalBusy.value = true
  modalError.value = ''
  screenError.value = ''
  successMessage.value = ''
  try {
    await operation(connectionFor(ticket))
    releaseTicket(ticket, true)
    if (!ticketIsCurrent(ticket)) return
    mutationBusy.value = false
    modalBusy.value = false
    closeModal()
    if (options.success) successMessage.value = options.success
    needsReconcile.value = true
    const samePrincipal = session.status === SESSION_STATUS.READY
      && session.generation === mutationIdentity.generation
      && session.tenantCode.trim() === mutationIdentity.tenantCode
      && session.identity?.id_usuario === mutationIdentity.principalId
    if (!samePrincipal) {
      screenError.value = 'La mutación respondió, pero el principal o contexto cambió antes de reconciliar. Confirma el contexto antes de continuar.'
      return
    }
    await reconcileContext()
  } catch (error: unknown) {
    releaseTicket(ticket, true)
    if (!ticketIsCurrent(ticket) || isAbortError(error)) return
    mutationBusy.value = false
    modalBusy.value = false
    if (mutationOutcomeIsUncertain(error, options.serverErrorIsFinal === true)) {
      needsReconcile.value = true
      invalidateScope()
      needsReconcile.value = true
      screenError.value = 'No se pudo confirmar el resultado de la mutación. No se repetirá. Reconcilia el contexto y vuelve a consultar los datos antes de decidir el siguiente paso.'
      return
    }
    modalError.value = errorMessage(error)
  } finally {
    releaseTicket(ticket, true)
    if (ticketIsCurrent(ticket)) {
      mutationBusy.value = false
      modalBusy.value = false
    }
  }
}

/**
 * Invalida sólo la consulta afectada por el cambio de selección: el panel
 * hermano conserva su resultado. La invalidación es de la vista (epoch de
 * request global), así que se restablecen ambas banderas de carga; lo que no se
 * descarta es el resultado del panel que no cambió.
 */
function invalidateOperationalQuery(target: 'people' | 'eligible'): void {
  requestSequence += 1
  for (const controller of readControllers) controller.abort()
  readControllers.clear()
  peopleLoading.value = false
  eligibleLoading.value = false
  if (target === 'people') {
    peopleByUnit.value = []
    peopleError.value = ''
    return
  }
  eligibleUnits.value = null
  eligibleError.value = ''
}

async function queryPeopleByUnit(): Promise<void> {
  const unitCode = selectedUnitCode.value.trim()
  if (!unitCode) {
    peopleError.value = 'Selecciona una unidad.'
    return
  }
  const ticket = createTicket()
  if (!ticket) {
    peopleError.value = needsReconcile.value ? 'Reconcilia el contexto antes de consultar.' : currentSessionMessage()
    return
  }
  peopleLoading.value = true
  peopleError.value = ''
  peopleByUnit.value = []
  try {
    const response = await getPeopleByUnit(unitCode, connectionFor(ticket), includeDescendants.value)
    if (!ticketIsCurrent(ticket)) return
    peopleByUnit.value = response.results
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket) && !isAbortError(error)) peopleError.value = errorMessage(error)
  } finally {
    releaseTicket(ticket)
    if (ticketIsCurrent(ticket)) peopleLoading.value = false
  }
}

async function queryEligibleUnits(): Promise<void> {
  const userId = parsePositiveId(selectedEligibleUserId.value)
  if (userId === null) {
    eligibleError.value = 'Selecciona una persona.'
    return
  }
  const ticket = createTicket()
  if (!ticket) {
    eligibleError.value = needsReconcile.value ? 'Reconcilia el contexto antes de consultar.' : currentSessionMessage()
    return
  }
  eligibleLoading.value = true
  eligibleError.value = ''
  eligibleUnits.value = null
  try {
    const response = await getEligibleTargetUnits(userId, connectionFor(ticket))
    if (!ticketIsCurrent(ticket)) return
    eligibleUnits.value = response
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket) && !isAbortError(error)) eligibleError.value = errorMessage(error)
  } finally {
    releaseTicket(ticket)
    if (ticketIsCurrent(ticket)) eligibleLoading.value = false
  }
}

/**
 * La consulta de bitácora lleva su límite en la URL (`?limit=`). Si el valor
 * pedido ya está en la URL se relanza la consulta; si no, la navegación lo
 * publica y el observador de la ruta vuelve a cargar la superficie.
 */
async function refreshAudit(): Promise<void> {
  const parsed = Number(auditLimitInput.value)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > AUDIT_LIMIT_MAX) {
    screenError.value = `El límite debe ser un entero entre 1 y ${AUDIT_LIMIT_MAX}.`
    auditLog.value = null
    organizationUnits.value = []
    auditUnitLinkState.value = AUDIT_UNIT_LINK_STATE.IDLE
    return
  }
  if (surface.value === AUTHORIZATION_SURFACE.AUDIT && parsed === auditLimit.value) {
    await loadSurface()
    return
  }
  await router.replace({ path: AUTHORIZATION_SURFACE.AUDIT, query: { limit: String(parsed) } })
}

function rolePermissionFor(roleId: number, permissionId: number): RolePermissionDto | undefined {
  return roleRuleIndex.value.get(`${roleId}:${permissionId}`)
}

function positionPermissionFor(positionId: number, permissionId: number): PositionPermissionDto | undefined {
  return positionRuleIndex.value.get(`${positionId}:${permissionId}`)
}

function onUnitChange(): void {
  invalidateOperationalQuery('people')
}

function onEligibleUserChange(): void {
  invalidateOperationalQuery('eligible')
}

</script>

<template>
  <div class="authorization-view">
    <header class="page-head authorization-head">
      <div>
        <h1 class="page-title">{{ surfaceTitle }}</h1>
        <nav class="breadcrumb authorization-breadcrumb" aria-label="Ruta de navegación">
          <span>Autorización</span>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{{ surfaceTitle }}</span>
        </nav>
      </div>
      <button
        v-if="needsReconcile"
        type="button"
        class="btn btn-primary"
        :disabled="reconciling || !session.tenantCode.trim()"
        @click="reconcileContext"
      >
        {{ reconciling ? 'Reconciliando…' : 'Reconciliar contexto' }}
      </button>
      <button
        v-else-if="contextReady && !loading"
        type="button"
        class="btn btn-outline-primary"
        :disabled="mutationBusy"
        @click="loadSurface"
      >
        Actualizar
      </button>
    </header>

    <nav class="authorization-shortcuts" aria-label="Superficies de autorización">
      <RouterLink :to="AUTHORIZATION_SURFACE.ROLES" :aria-current="surface === AUTHORIZATION_SURFACE.ROLES ? 'page' : undefined">Roles</RouterLink>
      <RouterLink :to="AUTHORIZATION_SURFACE.SCOPES" :aria-current="surface === AUTHORIZATION_SURFACE.SCOPES ? 'page' : undefined">Scopes</RouterLink>
      <RouterLink :to="{ path: AUTHORIZATION_SURFACE.PERMISSIONS, query: { tab: PERMISSION_TAB.CATALOG } }" :aria-current="surface === AUTHORIZATION_SURFACE.PERMISSIONS ? 'page' : undefined">Permisos y consultas</RouterLink>
      <RouterLink v-if="overridesSurfaceVisible" :to="AUTHORIZATION_SURFACE.OVERRIDES" :aria-current="surface === AUTHORIZATION_SURFACE.OVERRIDES ? 'page' : undefined">Overrides</RouterLink>
      <RouterLink v-if="canShowAuditShortcut" :to="AUTHORIZATION_SURFACE.AUDIT" :aria-current="surface === AUTHORIZATION_SURFACE.AUDIT ? 'page' : undefined">Auditoría</RouterLink>
    </nav>

    <div v-if="!contextReady" class="alert alert-info authorization-alert" role="status">
      <strong>Contexto sin confirmar.</strong>
      <span>{{ currentSessionMessage() }}</span>
      <button
        v-if="session.tenantCode.trim() && session.status !== SESSION_STATUS.ANONYMOUS"
        type="button"
        class="btn btn-outline-primary"
        :disabled="reconciling"
        @click="reconcileContext"
      >
        {{ reconciling ? 'Consultando…' : 'Consultar contexto' }}
      </button>
    </div>
    <div v-else-if="needsReconcile" class="alert alert-warning authorization-alert" role="alert">
      <strong>Reconciliación pendiente.</strong>
      <span>No envío otra operación hasta confirmar el contexto con SessionStore.</span>
    </div>
    <div v-if="screenError" class="alert alert-danger authorization-alert" role="alert">
      <strong>La operación requiere atención.</strong>
      <span>{{ screenError }}</span>
    </div>
    <div v-if="successMessage" class="alert alert-success authorization-alert" role="status">
      <strong>Operación completada.</strong>
      <span>{{ successMessage }}</span>
    </div>
    <div v-if="loading" class="authorization-loading" role="status" aria-live="polite">
      <span class="authorization-spinner" aria-hidden="true" />
      Consultando los datos del tenant confirmado…
    </div>

    <section v-if="surface === AUTHORIZATION_SURFACE.ROLES" class="card authorization-card authorization-roles-list-card">
      <div class="card-header">
        <h2 class="card-title">Catálogo de roles</h2>
        <p class="card-subtitle">Roles devueltos por el servidor. La autorización de cada acción se decide en el servidor.</p>
      </div>
      <div class="card-body">
        <button v-if="isTenantAdmin" type="button" class="btn btn-primary" :disabled="!canManageAuthorization" @click="openRoleEditor()">
          Crear rol
        </button>
        <div class="table-responsive">
          <table class="table table-centered">
            <caption class="visually-hidden">Roles recibidos para el contexto actual</caption>
            <thead>
              <tr><th scope="col">ID</th><th scope="col">Código</th><th scope="col">Nombre</th><th scope="col">Descripción</th><th scope="col">Estado</th><th scope="col">Tipo</th><th scope="col">Acciones</th></tr>
            </thead>
            <tbody>
              <tr v-for="role in roles" :key="role.id">
                <td>{{ role.id }}</td>
                <td><code>{{ role.code }}</code></td>
                <td>{{ role.name }}</td>
                <td>{{ displayValue(role.description) }}</td>
                <td><span class="badge" :class="role.is_active ? 'badge-soft-success' : 'badge-soft-danger'">{{ role.is_active ? 'Activo' : 'Inactivo' }}</span></td>
                <td><span v-if="role.is_system" class="badge badge-soft-warning">Sistema</span><span v-else>—</span></td>
                <td class="authorization-actions">
                  <button type="button" class="btn btn-outline-primary" :disabled="mutationBusy" @click="openRoleDetail(role.id)">Detalle</button>
                  <button v-if="isTenantAdmin" type="button" class="btn btn-outline-primary" :disabled="!canManageAuthorization" @click="openRoleEditor(role.id)">Editar</button>
                  <button v-if="isTenantAdmin" type="button" class="btn btn-danger" :disabled="!canManageAuthorization" @click="confirmDeleteRole(role)">Eliminar</button>
                  <button type="button" class="btn btn-outline-primary" :disabled="mutationBusy" :aria-label="`Ver matriz del rol ${role.name}`" @click="openRoleMatrix(role.id)">Ver matriz</button>
                </td>
              </tr>
              <tr v-if="!loading && roles.length === 0"><td colspan="7" class="authorization-empty">La respuesta no contiene roles para esta consulta. Esto no acredita que no existan fuera del alcance del tenant.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-if="surface === AUTHORIZATION_SURFACE.ROLES" class="card authorization-card authorization-role-categories-card">
      <div class="card-header">
        <h2 class="card-title">Categorías de roles</h2>
        <p class="card-subtitle">Agrupación recibida del catálogo de roles; no se reconstruye en el cliente.</p>
      </div>
      <div class="card-body">
        <div v-if="roleCategories.length" class="authorization-category-grid">
          <article v-for="category in roleCategories" :key="category.code" class="authorization-category">
            <h3>{{ category.label }}</h3>
            <p class="authorization-muted"><code>{{ category.code }}</code></p>
            <ul>
              <li v-for="role in category.roles" :key="role.code" :title="role.description">
                <strong>{{ role.name }}</strong><span class="authorization-muted"> · <code>{{ role.code }}</code></span>
              </li>
            </ul>
          </article>
        </div>
        <p v-else-if="!loading" class="authorization-empty">La respuesta no contiene categorías para esta consulta.</p>
      </div>
    </section>

    <section v-if="surface === AUTHORIZATION_SURFACE.SCOPES" class="card authorization-card authorization-scopes-list-card">
      <div class="card-header">
        <h2 class="card-title">Scopes de sólo lectura</h2>
        <p class="card-subtitle">El catálogo no ofrece alta, edición ni eliminación.</p>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-centered">
            <caption class="visually-hidden">Políticas de alcance recibidas del servidor</caption>
            <thead><tr><th scope="col">ID</th><th scope="col">Código</th><th scope="col">Nombre</th><th scope="col">Descripción</th><th scope="col">Lectura</th></tr></thead>
            <tbody>
              <tr v-for="scopeItem in scopes" :key="scopeItem.id">
                <td>{{ scopeItem.id }}</td><td><code>{{ scopeItem.code }}</code></td><td>{{ scopeItem.name }}</td><td>{{ displayValue(scopeItem.description) }}</td>
                <td><button type="button" class="btn btn-outline-primary" :disabled="mutationBusy" @click="openScopeDetail(scopeItem.id)">Ver detalle</button></td>
              </tr>
              <tr v-if="!loading && scopes.length === 0"><td colspan="5" class="authorization-empty">La respuesta no contiene scopes para esta consulta.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-if="surface === AUTHORIZATION_SURFACE.PERMISSIONS" class="card authorization-card authorization-permissions-card">
      <div class="card-header">
        <h2 class="card-title">Permisos y consultas operativas</h2>
        <p class="card-subtitle">Las pestañas son presentación de la ruta, no parámetros de recurso.</p>
      </div>
      <div class="card-body authorization-tabs-body">
        <div class="nav nav-tabs authorization-tabs" role="tablist" aria-label="Secciones de permisos" @keydown="handleTabKeydown">
          <button
            v-for="tab in permissionTabs"
            :id="`authorization-tab-${tab.id}`"
            :key="tab.id"
            type="button"
            class="nav-link"
            :class="{ active: activePermissionTab === tab.id }"
            role="tab"
            :aria-selected="activePermissionTab === tab.id"
            :aria-controls="`authorization-panel-${tab.id}`"
            :tabindex="activePermissionTab === tab.id ? 0 : -1"
            @click="changePermissionTab(tab.id)"
          >{{ tab.label }}</button>
        </div>

        <details
          v-if="authorizationCatalog && (activePermissionTab === PERMISSION_TAB.ROLE_MATRIX || activePermissionTab === PERMISSION_TAB.POSITION_MATRIX)"
          class="authorization-catalog-reference"
        >
          <summary>Catálogo de recursos y acciones</summary>
          <div class="authorization-reference-grid">
            <div><h4>Recursos</h4><ul><li v-for="resource in authorizationCatalog.resources" :key="resource.code"><span>{{ resource.label }}</span><code>{{ resource.code }}</code></li></ul></div>
            <div><h4>Acciones</h4><ul><li v-for="action in authorizationCatalog.actions" :key="action.code"><span :title="action.description">{{ action.label }}</span><code>{{ action.code }}</code><small>{{ action.description }}</small></li></ul></div>
          </div>
          <p class="authorization-muted">El catálogo describe lo que el servidor evalúa al autorizar; no es la lista de permisos de tu cuenta ni acredita un endpoint disponible.</p>
        </details>

        <div class="tab-content authorization-tabs-content">
        <section v-if="activePermissionTab === PERMISSION_TAB.CATALOG" :id="`authorization-panel-${PERMISSION_TAB.CATALOG}`" class="tab-pane active authorization-tab-panel" role="tabpanel" :aria-labelledby="`authorization-tab-${PERMISSION_TAB.CATALOG}`" tabindex="0">
          <div class="authorization-section-heading"><div><h3 class="authorization-section-title">Catálogo de permisos activos</h3><p class="authorization-muted">Sólo lectura. Los códigos y descripciones son los recibidos del servidor.</p></div></div>
          <div class="table-responsive">
            <table class="table table-centered">
              <caption class="visually-hidden">Permisos activos del catálogo</caption>
              <thead><tr><th scope="col">ID</th><th scope="col">Código</th><th scope="col">Nombre</th><th scope="col">Categoría</th><th scope="col">Descripción</th><th scope="col">Lectura</th></tr></thead>
              <tbody>
                <tr v-for="permission in permissions" :key="permission.id">
                  <td>{{ permission.id }}</td><td><code>{{ permission.code }}</code></td><td>{{ permission.name }}</td>
                  <td><span class="badge badge-soft-primary">{{ permission.category }}</span></td><td>{{ displayValue(permission.description) }}</td>
                  <td><button type="button" class="btn btn-outline-primary" :disabled="mutationBusy" @click="openPermissionDetail(permission.id)">Ver detalle</button></td>
                </tr>
                <tr v-if="!loading && permissions.length === 0"><td colspan="6" class="authorization-empty">La respuesta no contiene permisos activos para esta consulta.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-else-if="activePermissionTab === PERMISSION_TAB.ROLE_MATRIX" :id="`authorization-panel-${PERMISSION_TAB.ROLE_MATRIX}`" class="tab-pane active authorization-tab-panel" role="tabpanel" :aria-labelledby="`authorization-tab-${PERMISSION_TAB.ROLE_MATRIX}`" tabindex="0">
          <div class="authorization-section-heading"><div><h3 class="authorization-section-title">Matriz rol → permiso</h3><p class="authorization-muted">Muestra las reglas rol-permiso confirmadas; no calcula los permisos efectivos de una persona.</p></div></div>
          <div class="authorization-matrix-tools">
            <button v-if="isTenantAdmin" type="button" class="btn btn-primary" :disabled="!canManageAuthorization || roles.length === 0 || permissions.length === 0" @click="openRuleEditor(RULE_KIND.ROLE)">Crear regla</button>
          </div>
          <p class="authorization-matrix-legend">
            <span class="badge badge-soft-success">ALLOW</span> concede el permiso ·
            <span class="badge badge-soft-danger">DENY</span> lo niega ·
            <span class="authorization-muted">Sin regla</span> indica que no hay fila registrada.
          </p>
          <div class="table-responsive authorization-matrix-wrap">
            <table class="table table-centered authorization-matrix-table">
              <caption class="visually-hidden">Reglas rol-permiso recibidas y opciones de configuración</caption>
              <thead><tr><th scope="col" class="authorization-matrix-axis">Rol</th><th v-for="permission in permissions" :key="permission.id" scope="col"><button type="button" class="authorization-text-button" :title="permission.description" @click="openPermissionDetail(permission.id)">{{ permission.name }}</button><code>{{ permission.code }}</code></th></tr></thead>
              <tbody>
                <tr v-for="role in roles" :key="role.id" :class="{ 'authorization-matrix-row-highlight': role.id === highlightedRoleId }">
                  <th scope="row" class="authorization-matrix-axis"><button type="button" class="authorization-text-button" @click="openRoleDetail(role.id)">{{ role.name }}</button><code>{{ role.code }}</code><span v-if="role.is_system" class="badge badge-soft-warning">Sistema</span></th>
                  <td v-for="permission in permissions" :key="`${role.id}:${permission.id}`" class="authorization-matrix-cell">
                    <template v-if="rolePermissionFor(role.id, permission.id)">
                      <span class="badge" :class="rolePermissionFor(role.id, permission.id)?.allowed ? 'badge-soft-success' : 'badge-soft-danger'">{{ rolePermissionFor(role.id, permission.id)?.allowed ? 'ALLOW' : 'DENY' }}</span>
                      <div v-if="isTenantAdmin" class="authorization-cell-actions">
                        <button type="button" class="btn btn-outline-primary" :disabled="!canManageAuthorization || (role.is_system && !isSuperAdmin)" :aria-label="`Editar regla: ${role.name} → ${permission.name}`" @click="openRuleEditor(RULE_KIND.ROLE, rolePermissionFor(role.id, permission.id))">Editar</button>
                        <button type="button" class="btn btn-danger" :disabled="!canManageAuthorization || (role.is_system && !isSuperAdmin)" :aria-label="`Quitar regla: ${role.name} → ${permission.name}`" @click="confirmDeleteRule(RULE_KIND.ROLE, rolePermissionFor(role.id, permission.id)!)">Quitar</button>
                      </div>
                    </template>
                    <template v-else>
                      <span class="authorization-muted">Sin regla</span>
                      <button v-if="isTenantAdmin" type="button" class="btn btn-outline-primary" :disabled="!canManageAuthorization || (role.is_system && !isSuperAdmin)" :aria-label="`Configurar regla: ${role.name} → ${permission.name}`" @click="openRuleEditor(RULE_KIND.ROLE, undefined, role.id, permission.id)">Configurar</button>
                    </template>
                  </td>
                </tr>
                <tr v-if="!loading && roles.length === 0"><td :colspan="permissions.length + 1" class="authorization-empty">No hay roles en el catálogo recibido.</td></tr>
                <tr v-else-if="!loading && permissions.length === 0"><td class="authorization-empty">No hay permisos activos para armar la matriz.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-else-if="activePermissionTab === PERMISSION_TAB.POSITION_MATRIX" :id="`authorization-panel-${PERMISSION_TAB.POSITION_MATRIX}`" class="tab-pane active authorization-tab-panel" role="tabpanel" :aria-labelledby="`authorization-tab-${PERMISSION_TAB.POSITION_MATRIX}`" tabindex="0">
          <div class="authorization-section-heading"><div><h3 class="authorization-section-title">Matriz puesto → permiso</h3><p class="authorization-muted">Puestos y reglas del tenant devueltos por la API. La matriz no calcula permisos efectivos.</p></div></div>
          <div class="authorization-matrix-tools">
            <button v-if="isTenantAdmin" type="button" class="btn btn-primary" :disabled="!canManageAuthorization || positions.length === 0 || permissions.length === 0" @click="openRuleEditor(RULE_KIND.POSITION)">Crear regla</button>
          </div>
          <p class="authorization-matrix-legend">
            <span class="badge badge-soft-success">ALLOW</span> concede el permiso ·
            <span class="badge badge-soft-danger">DENY</span> lo niega ·
            <span class="authorization-muted">Sin regla</span> indica que no hay fila registrada.
          </p>
          <div class="table-responsive authorization-matrix-wrap">
            <table class="table table-centered authorization-matrix-table">
              <caption class="visually-hidden">Reglas puesto-permiso recibidas y opciones de configuración</caption>
              <thead><tr><th scope="col" class="authorization-matrix-axis">Puesto</th><th v-for="permission in permissions" :key="permission.id" scope="col"><button type="button" class="authorization-text-button" :title="permission.description" @click="openPermissionDetail(permission.id)">{{ permission.name }}</button><code>{{ permission.code }}</code></th></tr></thead>
              <tbody>
                <tr v-for="position in positions" :key="position.id">
                  <th scope="row" class="authorization-matrix-axis"><button type="button" class="authorization-text-button" @click="openPositionDetail(position.id)">{{ position.name }}</button><code>{{ position.code }}</code><span>{{ position.organization_unit_code }} · {{ position.organization_unit_name }}</span><span v-if="!position.is_active" class="badge badge-soft-warning">Inactivo</span></th>
                  <td v-for="permission in permissions" :key="`${position.id}:${permission.id}`" class="authorization-matrix-cell">
                    <template v-if="positionPermissionFor(position.id, permission.id)">
                      <span class="badge" :class="positionPermissionFor(position.id, permission.id)?.allowed ? 'badge-soft-success' : 'badge-soft-danger'">{{ positionPermissionFor(position.id, permission.id)?.allowed ? 'ALLOW' : 'DENY' }}</span>
                      <div v-if="isTenantAdmin" class="authorization-cell-actions">
                        <button type="button" class="btn btn-outline-primary" :disabled="!canManageAuthorization" :aria-label="`Editar regla: ${position.name} → ${permission.name}`" @click="openRuleEditor(RULE_KIND.POSITION, positionPermissionFor(position.id, permission.id))">Editar</button>
                        <button type="button" class="btn btn-danger" :disabled="!canManageAuthorization" :aria-label="`Quitar regla: ${position.name} → ${permission.name}`" @click="confirmDeleteRule(RULE_KIND.POSITION, positionPermissionFor(position.id, permission.id)!)">Quitar</button>
                      </div>
                    </template>
                    <template v-else>
                      <span class="authorization-muted">Sin regla</span>
                      <button v-if="isTenantAdmin" type="button" class="btn btn-outline-primary" :disabled="!canManageAuthorization" :aria-label="`Configurar regla: ${position.name} → ${permission.name}`" @click="openRuleEditor(RULE_KIND.POSITION, undefined, position.id, permission.id)">Configurar</button>
                    </template>
                  </td>
                </tr>
                <tr v-if="!loading && positions.length === 0"><td :colspan="permissions.length + 1" class="authorization-empty">No hay puestos en el listado recibido del tenant.</td></tr>
                <tr v-else-if="!loading && permissions.length === 0"><td class="authorization-empty">No hay permisos activos para armar la matriz.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-else-if="activePermissionTab === PERMISSION_TAB.PEOPLE_BY_UNIT" :id="`authorization-panel-${PERMISSION_TAB.PEOPLE_BY_UNIT}`" class="tab-pane active authorization-tab-panel" role="tabpanel" :aria-labelledby="`authorization-tab-${PERMISSION_TAB.PEOPLE_BY_UNIT}`" tabindex="0">
          <div class="authorization-query-grid">
            <section class="card" aria-labelledby="people-unit-title">
              <div class="card-body">
              <h3 id="people-unit-title" class="card-title">Personas por unidad</h3>
              <p class="card-text text-muted">La lista proviene del catálogo de personas por unidad; el servidor entrega las asignaciones funcionales.</p>
              <form @submit.prevent="queryPeopleByUnit">
                <div class="mb-3">
                  <label class="form-label" for="authorization-unit">Unidad</label>
                  <select id="authorization-unit" v-model="selectedUnitCode" class="form-select" required :disabled="mutationBusy" @change="onUnitChange">
                    <option value="" disabled>Selecciona una unidad</option>
                    <option v-for="unit in organizationUnits" :key="unit.id" :value="unit.code">{{ unit.name }} · {{ unit.code }}</option>
                  </select>
                </div>
                <div class="mb-3">
                  <div class="form-check">
                    <input id="authorization-include-descendants" v-model="includeDescendants" type="checkbox" class="form-check-input" :disabled="mutationBusy" @change="onUnitChange">
                    <label class="form-check-label" for="authorization-include-descendants">Incluir descendientes</label>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary" :disabled="peopleLoading || !contextReady || needsReconcile">{{ peopleLoading ? 'Consultando…' : 'Consultar personas' }}</button>
              </form>
              <div v-if="peopleError" class="alert alert-danger" role="alert">{{ peopleError }}</div>
              <div v-if="peopleByUnit.length" class="table-responsive">
                <table class="table table-centered">
                  <caption class="visually-hidden">Personas devueltas por la unidad consultada</caption>
                  <thead><tr><th scope="col">RUT</th><th scope="col">Nombre</th><th scope="col">Unidad personal</th><th scope="col">Asignaciones</th></tr></thead>
                  <tbody><tr v-for="person in peopleByUnit" :key="person.user.id_usuario">
                    <td>{{ person.user.rut }}</td>
                    <td>{{ [person.user.grado, person.user.nombre, person.user.apellido_paterno, person.user.apellido_materno].filter(Boolean).join(' ') }}</td>
                    <td>{{ displayValue(person.unidad_personal_name) }}<template v-if="person.unidad_personal_code"> · <code>{{ person.unidad_personal_code }}</code></template></td>
                    <td><ul class="authorization-inline-list"><li v-for="assignment in person.assignments" :key="assignment.id"><span>{{ displayValue(assignment.role_name) }}</span><code>{{ displayValue(assignment.role_code) }}</code><span>{{ displayValue(assignment.unit_name) }}</span><span v-if="assignment.is_primary" class="badge badge-soft-primary">Principal</span></li></ul></td>
                  </tr></tbody>
                </table>
              </div>
              <p v-else-if="!peopleLoading && !peopleError && selectedUnitCode" class="text-muted">La consulta no devolvió personas para los parámetros enviados.</p>
              </div>
            </section>

            <section class="card" aria-labelledby="eligible-units-title">
              <div class="card-body">
              <h3 id="eligible-units-title" class="card-title">Unidades elegibles por persona</h3>
              <p class="card-text text-muted">Selector de apoyo a asignaciones: la selección usa personas del catálogo y sus identificadores.</p>
              <form @submit.prevent="queryEligibleUnits">
                <div class="mb-3">
                  <label class="form-label" for="authorization-person">Persona</label>
                  <select id="authorization-person" v-model="selectedEligibleUserId" class="form-select" required :disabled="mutationBusy" @change="onEligibleUserChange">
                    <option value="" disabled>Selecciona una persona</option>
                    <option v-for="user in users" :key="user.id_usuario" :value="String(user.id_usuario)">{{ user.rut }} · {{ [user.grado, user.nombre, user.apellido_paterno, user.apellido_materno].filter(Boolean).join(' ') }}</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary" :disabled="eligibleLoading || !contextReady || needsReconcile">{{ eligibleLoading ? 'Consultando…' : 'Consultar unidades' }}</button>
              </form>
              <div v-if="eligibleError" class="alert alert-danger" role="alert">{{ eligibleError }}</div>
              <div v-if="eligibleUnits && 'reason' in eligibleUnits" class="alert alert-warning" role="status">
                Restricción operativa devuelta por el servidor: <code>{{ eligibleUnits.reason }}</code>.
              </div>
              <div v-else-if="eligibleUnits && 'unidad_personal_code' in eligibleUnits" class="authorization-eligible-result">
                <p>Unidad personal devuelta: <code>{{ eligibleUnits.unidad_personal_code }}</code></p>
                <ul><li v-for="unit in eligibleUnits.results" :key="unit.id">{{ unit.name }} · <code>{{ unit.code }}</code></li></ul>
                <p v-if="eligibleUnits.results.length === 0" class="text-muted">La respuesta no contiene unidades elegibles.</p>
              </div>
              </div>
            </section>
          </div>
        </section>
        </div>
      </div>
    </section>

    <section v-if="surface === AUTHORIZATION_SURFACE.OVERRIDES" class="card authorization-card authorization-overrides-list-card">
      <div class="card-header">
        <h2 class="card-title">Excepciones individuales</h2>
        <p class="card-subtitle">DENY precede a ALLOW en la evaluación del servidor; esta vista no calcula permisos efectivos.</p>
      </div>
      <div class="card-body">
        <button v-if="isTenantAdmin" type="button" class="btn btn-primary" :disabled="!canManageAuthorization" @click="openOverrideEditor()">Crear excepción</button>
        <label class="form-label" for="override-search">Buscar en el listado recibido</label>
        <input id="override-search" v-model="overrideSearch" class="form-control authorization-search" type="search" autocomplete="off" placeholder="Cuenta, permiso, recurso, acción o motivo">
        <div class="table-responsive">
          <table class="table table-centered">
            <caption class="visually-hidden">Excepciones recibidas para el tenant actual</caption>
            <thead><tr><th scope="col">ID</th><th scope="col">Cuenta</th><th scope="col">Efecto</th><th scope="col">Regla</th><th scope="col">Motivo</th><th scope="col">Creado por</th><th scope="col">Fecha</th><th scope="col">Acciones</th></tr></thead>
            <tbody>
              <tr v-for="override in filteredOverrides" :key="override.id">
                <td>{{ override.id }}</td><td>{{ override.account_rut }}</td>
                <td><span class="badge" :class="override.allowed ? 'badge-soft-success' : 'badge-soft-danger'">{{ override.allowed ? 'ALLOW' : 'DENY' }}</span></td>
                <td><span v-if="override.permission_code">{{ override.permission_code }}</span><span v-if="override.resource || override.action">{{ override.resource || '—' }} : {{ override.action || '—' }}</span><span v-if="!override.permission_code && !override.resource && !override.action">—</span></td>
                <td>{{ displayValue(override.reason) }}</td><td>{{ displayValue(override.created_by_rut) }}</td><td>{{ formatDate(override.created_at) }}</td>
                <td class="authorization-actions">
                  <button type="button" class="btn btn-outline-primary" :disabled="mutationBusy" @click="openOverrideDetail(override.id)">Detalle</button>
                  <button v-if="isTenantAdmin" type="button" class="btn btn-outline-primary" :disabled="!canManageAuthorization" @click="openOverrideEditor(override.id)">Editar</button>
                  <button v-if="isTenantAdmin" type="button" class="btn btn-danger" :disabled="!canManageAuthorization" @click="confirmDeleteOverride(override)">Eliminar</button>
                </td>
              </tr>
              <tr v-if="!loading && overrides.length === 0"><td colspan="8" class="authorization-empty">La respuesta no contiene excepciones para esta consulta.</td></tr>
              <tr v-else-if="!loading && filteredOverrides.length === 0"><td colspan="8" class="authorization-empty">La búsqueda no coincide con las filas recibidas.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-if="surface === AUTHORIZATION_SURFACE.AUDIT" class="card authorization-card authorization-audit-list-card">
      <div class="card-header">
        <h2 class="card-title">Bitácora de auditoría</h2>
        <p class="card-subtitle">Consulta inmutable. La autorización definitiva corresponde al servidor.</p>
      </div>
      <div class="card-body">
        <form class="authorization-audit-controls" @submit.prevent="refreshAudit">
          <div><label class="form-label" for="audit-limit">Límite de registros</label><input id="audit-limit" v-model="auditLimitInput" class="form-control" type="number" min="1" :max="AUDIT_LIMIT_MAX" step="1" :disabled="mutationBusy"></div>
          <button type="submit" class="btn btn-primary" :disabled="loading || !contextReady || needsReconcile">{{ loading ? 'Consultando…' : 'Consultar bitácora' }}</button>
        </form>
        <p v-if="auditLog" class="authorization-audit-count">
          Se muestran los últimos <strong>{{ auditLog.results.length }}</strong> de los
          <strong>{{ auditLog.count }}</strong> informados por el servidor.
          <span class="authorization-muted">La consulta pidió un límite de {{ auditLimit }} registros; esta respuesta no informa el total disponible.</span>
        </p>
        <p v-if="auditUnitLinkState === AUDIT_UNIT_LINK_STATE.LOADING" class="authorization-muted" role="status">Resolviendo códigos de unidad con el catálogo autorizado del tenant…</p>
        <p v-else-if="auditUnitLinkState === AUDIT_UNIT_LINK_STATE.DENIED" class="alert alert-warning authorization-alert" role="status">El servidor denegó el catálogo de unidades; los códigos se conservan como texto, sin enlaces a fichas.</p>
        <p v-else-if="auditUnitLinkState === AUDIT_UNIT_LINK_STATE.UNAVAILABLE" class="alert alert-warning authorization-alert" role="status">No se pudo consultar el catálogo de unidades; los códigos se conservan como texto, sin enlaces a fichas.</p>
      </div>
      <div v-if="auditLog" class="card-body">
        <div class="table-responsive">
          <table class="table table-centered">
            <caption class="visually-hidden">Eventos de acceso devueltos por el servidor</caption>
            <thead><tr><th scope="col">Fecha</th><th scope="col">Endpoint</th><th scope="col">Acción</th><th scope="col">Resultado</th><th scope="col">Motivo</th><th scope="col">Unidad</th><th scope="col">Persona</th></tr></thead>
            <tbody>
              <tr v-for="(entry, index) in auditLog.results" :key="`${entry.created_at}:${entry.endpoint}:${index}`">
                <td>{{ formatDate(entry.created_at) }}</td><td><code>{{ entry.endpoint }}</code></td><td>{{ entry.action }}</td>
                <td><span class="badge" :class="entry.allowed ? 'badge-soft-success' : 'badge-soft-danger'">{{ entry.allowed ? 'Permitido' : 'Denegado' }}</span></td>
                <td>{{ entry.reason }}</td>
                <td>
                  <RouterLink
                    v-if="unitDetailLinkVisible && entry.organization_unit_code && resolvedAuditUnitId(entry.organization_unit_code) !== null"
                    :to="`/organizacion/unidades/${resolvedAuditUnitId(entry.organization_unit_code)}`"
                  >{{ entry.organization_unit_code }}</RouterLink>
                  <template v-else>
                    {{ displayValue(entry.organization_unit_code) }}
                    <span v-if="entry.organization_unit_code && auditUnitLinkState === AUDIT_UNIT_LINK_STATE.AVAILABLE && !unitDetailLinkVisible" class="authorization-muted"> · sin enlace: la ficha de unidades no está disponible para tu cuenta.</span>
                    <span v-else-if="entry.organization_unit_code && auditUnitLinkState === AUDIT_UNIT_LINK_STATE.AVAILABLE" class="authorization-muted"> · sin enlace: el código no tiene un ID único en el catálogo.</span>
                  </template>
                </td>
                <td>
                  <RouterLink
                    v-if="personDetailLinkVisible && resolvedAuditPersonId(entry.user_id_value) !== null"
                    :to="`/personas/${resolvedAuditPersonId(entry.user_id_value)}`"
                  >{{ displayValue(entry.user_id_value) }}</RouterLink>
                  <template v-else>
                    {{ displayValue(entry.user_id_value) }}
                    <span v-if="entry.user_id_value !== null && !personDetailLinkVisible" class="authorization-muted"> · sin enlace: la ficha de personas no está disponible para tu cuenta.</span>
                    <span v-else-if="entry.user_id_value !== null" class="authorization-muted"> · sin enlace: el identificador no corresponde a una persona.</span>
                  </template>
                </td>
              </tr>
              <tr v-if="!loading && auditLog.results.length === 0"><td colspan="7" class="authorization-empty">La bitácora está vacía para esta consulta. No se fabrican eventos.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <DsModal v-model="modalOpen" :title="modalTitle" :busy="modalBusy || mutationBusy" modal-id="authorization-operation-modal">
      <template #body>
        <div v-if="modalError" class="alert alert-danger authorization-alert" role="alert">{{ modalError }}</div>

        <dl v-if="detailView && (modalKind === MODAL_KIND.ROLE_DETAIL || modalKind === MODAL_KIND.SCOPE_DETAIL || modalKind === MODAL_KIND.PERMISSION_DETAIL || modalKind === MODAL_KIND.POSITION_DETAIL || modalKind === MODAL_KIND.OVERRIDE_DETAIL)" class="authorization-detail-grid">
          <div v-for="field in detailView.fields" :key="field.label"><dt>{{ field.label }}</dt><dd>{{ field.value }}</dd></div>
        </dl>
        <button
          v-if="modalKind === MODAL_KIND.ROLE_DETAIL && detailView?.roleId"
          type="button"
          class="btn btn-outline-primary authorization-detail-link"
          @click="openRoleMatrix(detailView?.roleId); closeModal()"
        >
          Abrir matriz de permisos
        </button>

        <form v-else-if="modalKind === MODAL_KIND.ROLE_EDITOR" id="authorization-role-form" class="authorization-editor-form" @submit.prevent="saveRole">
          <div class="mb-3">
            <label class="form-label" for="role-code">Código <span aria-hidden="true">*</span></label><input id="role-code" v-model.trim="roleForm.code" class="form-control" type="text" maxlength="64" required :disabled="modalBusy || mutationBusy">
          </div>
          <div class="mb-3">
            <label class="form-label" for="role-name">Nombre <span aria-hidden="true">*</span></label><input id="role-name" v-model.trim="roleForm.name" class="form-control" type="text" maxlength="120" required :disabled="modalBusy || mutationBusy">
          </div>
          <div class="mb-3">
            <label class="form-label" for="role-description">Descripción</label><textarea id="role-description" v-model="roleForm.description" class="form-control" rows="3" :disabled="modalBusy || mutationBusy" />
          </div>
          <div class="mb-3">
            <label class="form-label" for="role-active">Estado activo</label><select id="role-active" v-model="roleForm.is_active" class="form-select" :disabled="modalBusy || mutationBusy"><option :value="null">Sin especificar</option><option :value="true">Activo</option><option :value="false">Inactivo</option></select>
          </div>
          <div class="mb-3">
            <label class="form-label" for="role-system">Rol de sistema</label>
            <select v-if="isSuperAdmin" id="role-system" v-model="roleForm.is_system" class="form-select" :disabled="modalBusy || mutationBusy"><option :value="null">Sin especificar</option><option :value="true">Sí</option><option :value="false">No</option></select>
            <select v-else id="role-system" class="form-select" :value="roleSystemWriteValue === true ? 'true' : 'false'" disabled><option value="true">Sí</option><option value="false">No</option></select>
            <p v-if="!isSuperAdmin" class="authorization-muted">Sólo un administrador de sistema puede crear o marcar roles de sistema.</p>
          </div>
          <p v-if="roleEditorMode === EDITOR_MODE.EDIT" class="authorization-muted">«Guardar cambios» envía sólo lo modificado. «Reemplazar el registro completo» reescribe todo el rol con estos valores; los campos sin especificar conservan el valor actual del servidor.</p>
        </form>

        <form v-else-if="modalKind === MODAL_KIND.RULE_EDITOR" id="authorization-rule-form" class="authorization-editor-form" @submit.prevent="saveRule">
          <p class="authorization-muted">Define una fila de permiso para un rol o un puesto. Esta fila no representa el permiso efectivo de una persona.</p>
          <div class="mb-3">
            <label class="form-label" :for="ruleKind === RULE_KIND.ROLE ? 'rule-role' : 'rule-position'">{{ ruleKind === RULE_KIND.ROLE ? 'Rol' : 'Puesto' }}</label>
            <select v-if="ruleKind === RULE_KIND.ROLE" id="rule-role" v-model="ruleForm.targetId" class="form-select" required :disabled="modalBusy || mutationBusy || Boolean(originalRoleRule || originalPositionRule)">
              <option value="" disabled>Selecciona un rol</option><option v-for="role in roles" :key="role.id" :value="String(role.id)">{{ role.name }} · {{ role.code }}{{ role.is_system ? ' · sistema' : '' }}</option>
            </select>
            <select v-else id="rule-position" v-model="ruleForm.targetId" class="form-select" required :disabled="modalBusy || mutationBusy || Boolean(originalRoleRule || originalPositionRule)">
              <option value="" disabled>Selecciona un puesto</option><option v-for="position in positions" :key="position.id" :value="String(position.id)">{{ position.name }} · {{ position.code }} · {{ position.organization_unit_code }}</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label" for="rule-permission">Permiso activo</label><select id="rule-permission" v-model="ruleForm.permissionId" class="form-select" required :disabled="modalBusy || mutationBusy || Boolean(originalRoleRule || originalPositionRule)"><option value="" disabled>Selecciona un permiso</option><option v-for="permission in permissions" :key="permission.id" :value="String(permission.id)" :title="permission.description">{{ permission.name }} · {{ permission.code }}</option></select>
          </div>
          <div class="mb-3">
            <label class="form-label" for="rule-allowed">Decisión de la fila</label><select id="rule-allowed" v-model="ruleForm.allowed" class="form-select" required :disabled="modalBusy || mutationBusy || !ruleEditorAllowed"><option value="" disabled>Selecciona ALLOW o DENY</option><option value="true">ALLOW</option><option value="false">DENY</option></select>
          </div>
          <p v-if="ruleKind === RULE_KIND.ROLE && roleRuleIsSystem && !isSuperAdmin" class="alert alert-warning authorization-alert">Las reglas de los roles de sistema las administra un super administrador.</p>
          <p v-if="originalRoleRule || originalPositionRule" class="authorization-muted">«Guardar cambios» envía sólo lo modificado. «Reemplazar el registro completo» reescribe la fila con estos valores.</p>
        </form>

        <form v-else-if="modalKind === MODAL_KIND.OVERRIDE_EDITOR" id="authorization-override-form" class="authorization-editor-form" @submit.prevent="saveOverride">
          <p class="authorization-muted">Excepción individual a los permisos de una cuenta. La regla es obligatoria: sin ella el servidor no la evaluaría. Los metadatos de creación los fija el servidor.</p>
          <div class="mb-3">
            <label class="form-label" for="override-account">Cuenta</label><select id="override-account" v-model="overrideForm.accountId" class="form-select" required :disabled="modalBusy || mutationBusy"><option value="" disabled>Selecciona una cuenta</option><option v-for="account in overrideAccountOptions" :key="account.accountId" :value="String(account.accountId)">{{ account.rut }} · cuenta {{ account.accountId }}</option></select>
          </div>
          <p v-if="overrideAccountOptions.length === 0 && !modalBusy" class="authorization-muted">No hay cuentas en las membresías recibidas.</p>
          <div class="mb-3">
            <label class="form-label" for="override-allowed">Efecto</label><select id="override-allowed" v-model="overrideForm.allowed" class="form-select" required :disabled="modalBusy || mutationBusy"><option value="" disabled>Selecciona ALLOW o DENY</option><option value="true">ALLOW</option><option value="false">DENY</option></select>
          </div>
          <div class="mb-3">
            <label class="form-label" for="override-rule-mode">Regla de la excepción</label><select id="override-rule-mode" v-model="overrideForm.ruleMode" class="form-select" :disabled="modalBusy || mutationBusy"><option :value="OVERRIDE_RULE_MODE.PERMISSION">Permiso del catálogo</option><option :value="OVERRIDE_RULE_MODE.RESOURCE_ACTION">Par recurso / acción</option></select>
          </div>
          <template v-if="overrideForm.ruleMode === OVERRIDE_RULE_MODE.PERMISSION"><div class="mb-3"><label class="form-label" for="override-permission-id">Permiso</label><select id="override-permission-id" v-model="overrideForm.permissionId" class="form-select" required :disabled="modalBusy || mutationBusy"><option value="" disabled>Selecciona un permiso</option><option v-for="permission in permissions" :key="permission.id" :value="String(permission.id)">{{ permission.name }} · {{ permission.code }}</option><option v-if="originalOverride?.permission && !permissions.some((item) => item.id === originalOverride?.permission)" :value="String(originalOverride.permission)">{{ originalOverride.permission_code ?? `Permiso ${originalOverride.permission}` }}</option></select></div></template>
          <template v-else><div class="mb-3"><label class="form-label" for="override-resource">Recurso del catálogo</label><select id="override-resource" v-model="overrideForm.resource" class="form-select" required :disabled="modalBusy || mutationBusy"><option value="" disabled>Selecciona un recurso</option><option v-for="resource in overrideResourceOptions" :key="resource" :value="resource">{{ resource }}</option></select></div><div class="mb-3"><label class="form-label" for="override-action">Acción del catálogo</label><select id="override-action" v-model="overrideForm.action" class="form-select" required :disabled="modalBusy || mutationBusy"><option value="" disabled>Selecciona una acción</option><option v-for="action in authorizationCatalog?.actions ?? []" :key="action.code" :value="action.code" :title="action.description">{{ action.label }} · {{ action.code }}</option><option v-if="originalOverride?.action && !authorizationCatalog?.actions.some((item) => item.code === originalOverride?.action)" :value="originalOverride.action">{{ originalOverride.action }}</option></select></div></template>
          <p class="authorization-muted">Sin una regla válida la excepción no se guarda: el servidor no la aplicaría.</p>
          <div class="mb-3">
            <label class="form-label" for="override-reason">Motivo</label><textarea id="override-reason" v-model="overrideForm.reason" class="form-control" rows="3" :disabled="modalBusy || mutationBusy" />
          </div>
          <div v-if="originalOverride" class="authorization-readonly-meta"><span>Creado por: {{ displayValue(originalOverride.created_by_rut) }}</span><span>Fecha: {{ formatDate(originalOverride.created_at) }}</span></div>
          <p v-if="originalOverride" class="authorization-muted">«Guardar cambios» envía sólo lo modificado. «Reemplazar el registro completo» reescribe la excepción con estos valores.</p>
        </form>

        <div v-else-if="modalKind === MODAL_KIND.DELETE_ROLE && deleteRoleTarget" class="authorization-confirm-copy">
          <p>¿Eliminar el rol <strong>{{ deleteRoleTarget.name }}</strong> (<code>{{ deleteRoleTarget.code }}</code>)?</p>
          <p v-if="deleteRoleTarget.is_system" class="alert alert-warning authorization-alert">Es un rol de sistema. La marca se muestra como advertencia informativa; el servidor decide la operación.</p>
          <p class="alert alert-warning authorization-alert">El rol puede estar en uso por puestos. Si lo está, el servidor rechazará la baja y el rol seguirá en el listado. <button type="button" class="authorization-text-button" @click="closeModal(); openRoleMatrix(deleteRoleTarget.id)">Ver sus reglas en la matriz</button>.</p>
          <p>El listado sólo cambiará tras una respuesta confirmada del servidor.</p>
        </div>
        <div v-else-if="modalKind === MODAL_KIND.DELETE_RULE && deleteRoleRuleTarget" class="authorization-confirm-copy">
          <p>¿Quitar la regla <strong>{{ deleteRoleRuleTarget.role_code }}</strong> → <strong>{{ deleteRoleRuleTarget.permission_code }}</strong> ({{ deleteRoleRuleTarget.allowed ? 'ALLOW' : 'DENY' }})?</p>
          <p>El servidor mantiene la autoridad sobre el cambio y cualquier denegación.</p>
        </div>
        <div v-else-if="modalKind === MODAL_KIND.DELETE_RULE && deletePositionRuleTarget" class="authorization-confirm-copy">
          <p>¿Quitar la regla <strong>{{ deletePositionRuleTarget.position_code }}</strong> → <strong>{{ deletePositionRuleTarget.permission_code }}</strong> ({{ deletePositionRuleTarget.allowed ? 'ALLOW' : 'DENY' }})?</p>
          <p>El listado sólo cambiará tras una respuesta confirmada del servidor.</p>
        </div>
        <div v-else-if="modalKind === MODAL_KIND.DELETE_OVERRIDE && deleteOverrideTarget" class="authorization-confirm-copy">
          <p>¿Eliminar la excepción individual de <strong>{{ deleteOverrideTarget.account_rut }}</strong>?</p>
          <p>{{ deleteOverrideTarget.permission_code ?? `${deleteOverrideTarget.resource} : ${deleteOverrideTarget.action}` }} · {{ deleteOverrideTarget.allowed ? 'ALLOW' : 'DENY' }}</p>
          <p>El listado sólo cambiará tras una respuesta confirmada del servidor.</p>
        </div>
      </template>
      <template #footer>
        <button type="button" class="btn btn-outline-primary" :disabled="modalBusy || mutationBusy" @click="closeModal">Cerrar</button>
        <button v-if="modalKind === MODAL_KIND.ROLE_EDITOR && roleEditorMode === EDITOR_MODE.EDIT" type="button" class="btn btn-outline-primary" :disabled="modalBusy || mutationBusy || !canManageAuthorization" @click="replaceRoleRecord">Reemplazar el registro completo</button>
        <button v-else-if="modalKind === MODAL_KIND.RULE_EDITOR && (originalRoleRule || originalPositionRule)" type="button" class="btn btn-outline-primary" :disabled="modalBusy || mutationBusy || !ruleEditorAllowed" @click="replaceRule">Reemplazar el registro completo</button>
        <button v-else-if="modalKind === MODAL_KIND.OVERRIDE_EDITOR && originalOverride" type="button" class="btn btn-outline-primary" :disabled="modalBusy || mutationBusy || !canManageAuthorization" @click="replaceOverrideRecord">Reemplazar el registro completo</button>
        <button v-if="modalKind === MODAL_KIND.ROLE_EDITOR" type="submit" class="btn btn-primary" form="authorization-role-form" :disabled="modalBusy || mutationBusy || !canManageAuthorization">{{ mutationBusy ? 'Guardando…' : (roleEditorMode === EDITOR_MODE.CREATE ? 'Crear rol' : 'Guardar cambios') }}</button>
        <button v-else-if="modalKind === MODAL_KIND.RULE_EDITOR" type="submit" class="btn btn-primary" form="authorization-rule-form" :disabled="modalBusy || mutationBusy || !ruleEditorAllowed">{{ mutationBusy ? 'Guardando…' : ((originalRoleRule || originalPositionRule) ? 'Guardar cambios' : 'Crear regla') }}</button>
        <button v-else-if="modalKind === MODAL_KIND.OVERRIDE_EDITOR" type="submit" class="btn btn-primary" form="authorization-override-form" :disabled="modalBusy || mutationBusy || !canManageAuthorization || !overrideRuleValid">{{ mutationBusy ? 'Guardando…' : (originalOverride ? 'Guardar cambios' : 'Crear excepción') }}</button>
        <button v-else-if="modalKind === MODAL_KIND.DELETE_ROLE" type="button" class="btn btn-danger" :disabled="modalBusy || mutationBusy || !canManageAuthorization" @click="confirmDelete">{{ mutationBusy ? 'Eliminando…' : 'Eliminar rol' }}</button>
        <button v-else-if="modalKind === MODAL_KIND.DELETE_RULE" type="button" class="btn btn-danger" :disabled="modalBusy || mutationBusy || !canManageAuthorization" @click="confirmDelete">{{ mutationBusy ? 'Eliminando…' : 'Quitar regla' }}</button>
        <button v-else-if="modalKind === MODAL_KIND.DELETE_OVERRIDE" type="button" class="btn btn-danger" :disabled="modalBusy || mutationBusy || !canManageAuthorization" @click="confirmDelete">{{ mutationBusy ? 'Eliminando…' : 'Eliminar excepción' }}</button>
      </template>
    </DsModal>
  </div>
</template>

<style scoped>
.authorization-view {
  min-width: 0;
  color: var(--text);
}

.authorization-head {
  align-items: center;
}

.authorization-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.authorization-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 24px;
}

.authorization-shortcuts a {
  padding: 6px 10px;
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 13px;
  transition: color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out;
}

.authorization-shortcuts a:hover,
.authorization-shortcuts a[aria-current="page"] {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary-text);
}

.authorization-card {
  margin-bottom: 24px;
}

/* tables-basic.html Basic Example .card-header anatomy for the two authz list
   cards; scoped to reproduce the source literal (title line-height 19.8px). */
.authorization-roles-list-card .card-header .card-title,
.authorization-scopes-list-card .card-header .card-title {
  margin-bottom: 12px;
  line-height: 19.8px;
}

.authorization-roles-list-card .card-header .card-subtitle,
.authorization-scopes-list-card .card-header .card-subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 21px;
  color: var(--bui-text);
}

/* tables-basic.html Basic Example .card-header anatomy for the remaining three
   authz list cards; scoped to reproduce the source literal (title line-height 19.8px). */
.authorization-permissions-card .card-header .card-title,
.authorization-overrides-list-card .card-header .card-title,
.authorization-audit-list-card .card-header .card-title {
  margin-bottom: 12px;
  line-height: 19.8px;
}

.authorization-permissions-card .card-header .card-subtitle,
.authorization-overrides-list-card .card-header .card-subtitle,
.authorization-audit-list-card .card-header .card-subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 21px;
  color: var(--bui-text);
}

/* tables-basic.html Basic Example .card-header anatomy for the role-categories card. */
.authorization-role-categories-card .card-header .card-title {
  margin-bottom: 12px;
  line-height: 19.8px;
}

.authorization-role-categories-card .card-header .card-subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 21px;
  color: var(--bui-text);
}

.authorization-alert {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-bottom: 20px;
  padding: 12px 20px;
  border: 0;
  border-radius: var(--card-radius);
}

.authorization-alert.alert-info {
  background: rgba(var(--info-rgb), .15);
  color: var(--info-text);
}

.authorization-alert.alert-success {
  background: rgba(var(--success-rgb), .15);
  color: var(--success-text);
}

.authorization-alert.alert-warning {
  background: rgba(var(--warning-rgb), .15);
  color: var(--warning-text);
}

.authorization-alert.alert-danger {
  background: rgba(var(--danger-rgb), .15);
  color: var(--danger-text);
}

.authorization-alert .btn {
  margin-left: auto;
}

.authorization-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 20px;
  color: var(--muted);
}

.authorization-spinner {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  border: 2px solid var(--primary);
  border-right-color: transparent;
  border-radius: 50%;
  animation: authorization-spin .75s linear infinite;
}

@keyframes authorization-spin {
  to { transform: rotate(360deg); }
}

.authorization-view code {
  color: var(--muted);
  font-family: "Geist Mono", ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.authorization-empty {
  padding: 22px !important;
  color: var(--muted) !important;
  text-align: center !important;
}

.authorization-muted {
  color: var(--muted);
  font-size: 13px;
}

.authorization-actions,
.authorization-cell-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 170px;
}

.authorization-view .btn-danger {
  border-color: var(--danger);
  background: var(--danger);
  color: var(--on-danger);
}

.authorization-view .btn-danger:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--danger) 84%, #000);
  background: color-mix(in srgb, var(--danger) 84%, #000);
}

/* Foco de los controles propios de la vista (chips de superficies y enlaces de
   texto); los botones `.btn` usan el anillo doble del DS. */
.authorization-shortcuts a:focus-visible,
.authorization-text-button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.authorization-view .badge {
  display: inline-block;
  padding: 3px 6px;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  vertical-align: baseline;
}

.authorization-view .badge-soft-primary {
  background: rgba(var(--primary-rgb), .18);
  color: var(--primary-text);
}

.authorization-view .badge-soft-success {
  background: rgba(var(--success-rgb), .18);
  color: var(--success-text);
}

.authorization-view .badge-soft-danger {
  background: rgba(var(--danger-rgb), .18);
  color: var(--danger-text);
}

.authorization-view .badge-soft-warning {
  background: rgba(var(--warning-rgb), .18);
  color: var(--warning-text);
}

.authorization-category-grid,
.authorization-query-grid,
.authorization-reference-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.authorization-category {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--border);
  background: var(--surface);
}

.authorization-category h3,
.authorization-reference-grid h4 {
  margin: 0 0 8px;
  color: var(--heading);
  font-size: 15px;
  font-weight: 600;
}

.authorization-category ul,
.authorization-reference-grid ul,
.authorization-eligible-result ul {
  margin: 12px 0 0;
  padding-left: 20px;
}

.authorization-category li {
  margin: 6px 0;
}

.authorization-tabs-body {
  min-width: 0;
}

/* ui-tabs.html standard nav-tabs, scoped to the permissions card. Global
   .nav/.nav-tabs/.nav-link (design-system.css:316-363) supply padding/font/
   border/radius; these reproduce the DS baseui-content.css page-content literals
   that are not ported globally (inactive color, active bottom accent, tab-content
   padding, tab-pane visibility). */
.authorization-permissions-card .nav-link:not(.active) {
  color: #afb9cf;
}

.authorization-permissions-card .nav-tabs .nav-link.active {
  color: rgba(var(--bui-primary-rgb), 1);
  background-color: var(--bui-surface);
  border-color: transparent transparent rgba(var(--bui-primary-rgb), 1);
}

html[data-theme="light"] .authorization-permissions-card .nav-link:not(.active) {
  color: #5d6c8a;
}

html[data-theme="light"] .authorization-permissions-card .nav-tabs .nav-link.active {
  color: var(--primary-text);
  background-color: var(--bui-surface);
  border-color: transparent transparent rgba(var(--bui-primary-rgb), 1);
}

.authorization-permissions-card .tab-content {
  padding: 20px 0 0;
}

.authorization-permissions-card .tab-content > .tab-pane {
  display: none;
}

.authorization-permissions-card .tab-content > .active {
  display: block;
}

/* Literal provenance from the ui-tabs.html Nav Tabs sample: the nav is a <ul>
   under .page-content, so baseui-content.css:62 (.page-content ul,ol) gives it
   padding-left:2rem/margin-bottom:1rem over the .nav reset. Reproduced here on
   the target <div nav> so the effective nav box matches the source. */
.authorization-permissions-card .authorization-tabs {
  padding-left: 32px;
  margin-bottom: 16px;
}

/* Source sample puts .text-muted on the .tab-content wrapper (baseui.css:288
   .text-muted{color:var(--bui-muted)!important}); the app has no .text-muted
   utility, so the wrapper inherits the same muted color here. Interior explicit
   styles are untouched. */
.authorization-permissions-card .authorization-tabs-content {
  color: var(--bui-muted);
}

/* tables-basic.html Basic Example: the .table-responsive shell inherits the card
   base text color --bui-text (baseui.css:41 --bui-text:#aab8c5). The matrix panels
   live under the permissions tab-content wrapper that reproduces the sample's
   .text-muted (--bui-muted), so these two shells inherit the wrong tone. Restore
   the source literal color only on the two matrix wrappers; the table inherits it.
   No inner th/td/element rules are touched and no rgb is hardcoded. */
#authorization-panel-matriz-rol > .table-responsive,
#authorization-panel-matriz-puesto > .table-responsive {
  color: var(--bui-text);
}

/* ui-card.html effective CSS (that page loads styles.css + baseui.css; NOT
   baseui-content.css). Title: baseui.css:239-246 h5.card-title (18px/19.8px/600/
   heading, margin-bottom 12px) and .mb-2 (baseui.css:496 margin-bottom .75rem
   !important) => margin 0 0 0.75rem. Subtitle: baseui.css:111 .page-content p
   (margin 0 0 10px), styles.css:96-97 body (14px/1.5/400), baseui.css:288
   .text-muted (color var(--bui-muted) !important). Scoped strictly to the two
   people-query cards' direct card-body children. */
#authorization-panel-personas-unidad > .authorization-query-grid > .card > .card-body > .card-title {
  margin: 0 0 0.75rem;
  font-size: 18px;
  line-height: 19.8px;
  font-weight: 600;
  color: var(--heading);
}

#authorization-panel-personas-unidad > .authorization-query-grid > .card > .card-body > .card-text {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
  color: var(--bui-muted);
}

/* forms-basic.html controls: baseui-forms.css:245-276 + baseui-content.css:262-291 +
   theme-customizer.css:357-362 (all loaded by forms-basic.html). The app has no
   .form-check* utilities, so the source declarations are reproduced strictly under
   the people-query panel. Root-attr rules use :global(<full selector>) because the
   compiler replaces the whole selector with the :global argument. */
#authorization-panel-personas-unidad .form-check {
  display: block;
  min-height: 21px;
  padding-left: 1.612em;
  margin-bottom: 0;
}

#authorization-panel-personas-unidad .form-check-input {
  float: left;
  margin-left: -1.612em;
  margin-top: 2px;
  flex-shrink: 0;
  width: 1.112em;
  height: 1.112em;
  font-size: 14px;
  vertical-align: top;
  -webkit-appearance: none;
  appearance: none;
  background-color: var(--bui-surface);
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  border: 1px solid #8391a2;              /* baseui-content.css:273 literal */
  border-radius: 3.5px;
  print-color-adjust: exact;
}

#authorization-panel-personas-unidad .form-check-input:active {
  filter: brightness(90%);
}

#authorization-panel-personas-unidad .form-check-input:focus {
  border-color: rgba(var(--bui-primary-rgb), 1);
  outline: 0;
  box-shadow: 0 0 0 .15rem rgba(var(--bui-primary-rgb), .25);
}

:global(html[data-accent] #authorization-panel-personas-unidad #authorization-include-descendants:focus) {
  box-shadow: 0 0 0 2.4px color-mix(in srgb, var(--primary) 25%, transparent);
}

#authorization-panel-personas-unidad .form-check-input:focus-visible {
  border-color: var(--buf-input-focus);
  box-shadow: none;                        /* baseui-forms.css:259-262 */
}

#authorization-panel-personas-unidad .form-check-input:checked {
  background-color: rgba(var(--bui-primary-rgb), 1);
  border-color: rgba(var(--bui-primary-rgb), 1);
}

:global(html[data-accent] #authorization-panel-personas-unidad #authorization-include-descendants:checked) {
  background-color: var(--primary);
  border-color: var(--primary);
}

#authorization-panel-personas-unidad #authorization-include-descendants:checked[type="checkbox"] {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e");
}

#authorization-panel-personas-unidad .form-check-input:disabled {
  pointer-events: none;
  filter: none;
  opacity: .5;
}

#authorization-panel-personas-unidad .form-check-label {
  cursor: pointer;
  color: #f1f1f1;                          /* baseui-content.css:288 literal (dark) */
}

#authorization-panel-personas-unidad .form-check-input:disabled ~ .form-check-label {
  cursor: default;
  opacity: .5;
}

/* light source baseui-content.css:290-291; the checked re-assert keeps the accent
   fill (baseui-forms.css:267-270). */
:global([data-theme="light"] #authorization-panel-personas-unidad #authorization-include-descendants) {
  background-color: var(--bui-surface);
  border-color: rgba(0, 0, 0, .176);
}

:global([data-theme="light"] #authorization-panel-personas-unidad #authorization-include-descendants:checked) {
  background-color: rgba(var(--bui-primary-rgb), 1);
  border-color: rgba(var(--bui-primary-rgb), 1);
}

:global([data-theme="light"] #authorization-panel-personas-unidad #authorization-include-descendants ~ .form-check-label) {
  color: var(--bui-text);
}

/* alerts: baseui.css:718-739, scoped to the three direct feedback nodes. */
#authorization-panel-personas-unidad > .authorization-query-grid > .card > .card-body > .alert {
  position: relative;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid transparent;
  border-radius: var(--bui-radius);
  color: var(--bui-text);
}

#authorization-panel-personas-unidad > .authorization-query-grid > .card > .card-body > .alert.alert-danger {
  color: var(--danger-text);
  background-color: rgba(var(--bui-danger-rgb), .15);
  border-color: rgba(var(--bui-danger-rgb), .4);
}

#authorization-panel-personas-unidad > .authorization-query-grid > .card > .card-body > .alert.alert-warning {
  color: var(--warning-text);
  background-color: rgba(var(--bui-warning-rgb), .15);
  border-color: rgba(var(--bui-warning-rgb), .4);
}

/* baseui.css:262 .card-body > :last-child{ margin-bottom:0 } — same specificity as the
   alert base rule plus :last-child, so an alert that is the last card-body child loses
   its 16px bottom margin. Declared AFTER the alert rules. */
#authorization-panel-personas-unidad > .authorization-query-grid > .card > .card-body > .alert:last-child {
  margin-bottom: 0;
}

/* empties: ui-card.html p.text-muted + baseui.css:116-117 + styles.css:96-97. */
#authorization-panel-personas-unidad > .authorization-query-grid > .card > .card-body > p.text-muted:not(.card-text) {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
  color: var(--bui-muted);
}

#authorization-panel-personas-unidad .authorization-eligible-result > p.text-muted {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
  color: var(--bui-muted);
}

/* baseui.css:262 .card-body > :last-child{margin-bottom:0}. Declared with matching
   specificity + :last-child so it actually beats the paragraph margin rule. */
#authorization-panel-personas-unidad > .authorization-query-grid > .card > .card-body > p.text-muted:not(.card-text):last-child {
  margin-bottom: 0;
}

.authorization-section-heading,
.authorization-matrix-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.authorization-section-title {
  margin: 0 0 4px;
  color: var(--heading);
  font-size: 18px;
  font-weight: 600;
}

.authorization-catalog-reference {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border);
  background: var(--surface-2);
}

.authorization-catalog-reference summary {
  color: var(--primary-text);
  cursor: pointer;
  font-weight: 600;
}

.authorization-reference-grid {
  margin: 16px 0;
}

.authorization-reference-grid li {
  display: grid;
  grid-template-columns: minmax(110px, auto) minmax(100px, 1fr);
  gap: 4px 12px;
  margin: 8px 0;
}

.authorization-reference-grid small {
  grid-column: 1 / -1;
  color: var(--muted);
}

.authorization-matrix-wrap {
  max-height: 68vh;
  overflow-y: auto;
}

.authorization-matrix-table {
  min-width: max-content;
}

/* Cabecera fija dentro del envoltorio con scroll; el resalte de fila y la
   columna del eje mantienen su propio fondo por encima. */
.authorization-matrix-wrap thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--surface);
}

.authorization-matrix-table th:not(.authorization-matrix-axis),
.authorization-matrix-table td:not(.authorization-matrix-axis) {
  min-width: 150px;
  max-width: 220px;
}

.authorization-matrix-table thead th > span,
.authorization-matrix-table thead th > button,
.authorization-matrix-axis > span,
.authorization-matrix-axis > button {
  display: block;
  margin-bottom: 4px;
}

.authorization-matrix-axis {
  position: sticky;
  left: 0;
  z-index: 1;
  min-width: 190px;
  max-width: 280px;
  background: var(--surface);
}

.authorization-matrix-table thead .authorization-matrix-axis {
  z-index: 3;
}

.authorization-matrix-row-highlight > .authorization-matrix-axis,
.authorization-matrix-row-highlight > td {
  background: var(--primary-soft);
}

.authorization-matrix-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 13px;
}

.authorization-matrix-cell {
  min-width: 150px;
  text-align: center !important;
}

.authorization-cell-actions {
  justify-content: center;
  min-width: 0;
  margin-top: 8px;
}

.authorization-text-button {
  padding: 0;
  color: var(--primary-text);
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.authorization-inline-list {
  display: grid;
  gap: 4px;
  min-width: 180px;
  margin: 0;
  padding-left: 18px;
}

.authorization-inline-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.authorization-eligible-result {
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.authorization-search {
  max-width: 520px;
}

.authorization-audit-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 16px;
}

.authorization-audit-controls > div {
  width: min(100%, 260px);
}

.authorization-audit-count {
  margin-top: 16px;
  color: var(--muted);
}

.authorization-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.authorization-detail-link {
  margin-top: 16px;
}

.authorization-detail-grid > div {
  min-width: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.authorization-detail-grid dt {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}

.authorization-detail-grid dd {
  margin: 0;
  color: var(--text);
  overflow-wrap: anywhere;
}

.authorization-readonly-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  color: var(--muted);
}

.authorization-confirm-copy p + p {
  margin-top: 12px;
}

.authorization-confirm-copy .authorization-alert {
  margin-top: 12px;
}

@media (max-width: 900px) {
  .authorization-category-grid,
  .authorization-query-grid,
  .authorization-reference-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .authorization-shortcuts {
    gap: 6px;
  }
}

@media (max-width: 600px) {
  .authorization-detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .authorization-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .authorization-head {
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .authorization-spinner {
    animation-duration: 1.5s;
  }
}
</style>
