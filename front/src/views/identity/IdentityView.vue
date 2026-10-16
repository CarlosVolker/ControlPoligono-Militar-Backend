<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, shallowRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import DsModal from '../../components/shared/DsModal.vue'
import { getAssignableUnits, createTemporaryPerson } from '../../api/shared/domain'
import type {
  OrganizationUnitDTO,
  TemporaryPersonCreateRequest,
} from '../../types/shared/domain'
import type { ApiConnection } from '../../types/dashboard'
import { useSessionStore } from '../../stores/session'
import { SESSION_STATUS } from '../../types/session'
import { PERMISSION_CODE } from '../../permissions/catalog'
import {
  addSecondaryAssignment,
  assignPositionHolder,
  changeOtherUserPassword,
  changeOwnPassword,
  createMembership,
  createPosition,
  createUser,
  deactivatePrimaryAssignment,
  deleteMembership,
  deletePosition,
  deleteUser,
  getMembership,
  getMemberships,
  getPosition,
  getPositionHolderHistory,
  getPositions,
  getUser,
  getUserLockStatus,
  getUsers,
  patchMembership,
  patchPosition,
  patchPrimaryAssignment,
  patchUser,
  removePositionHolder,
  removeUserAssignment,
  replaceMembership,
  replacePosition,
  replacePrimaryAssignment,
  replaceUser,
  resetUserPassword,
  unlockUser,
} from '../../features/identity/api'
import type {
  AssignPositionHolderRequest,
  CreateUserRequest,
  CreatePositionRequest,
  CreateUnitMembershipRequest,
  IdentityUserDTO,
  PatchPositionRequest,
  PatchUnitMembershipRequest,
  PatchUserRequest,
  PositionDTO,
  PositionHolderDTO,
  PositionHolderHistoryDTO,
  PrimaryAssignmentRequest,
  ReplacePositionRequest,
  ReplaceUnitMembershipRequest,
  ReplaceUserRequest,
  UnitMembershipDTO,
  UserAssignmentDTO,
  UserLockStatusDTO,
} from '../../features/identity/api'
import {
  getAuthorizationCatalog,
  getEligibleTargetUnits,
  getRoleCategories,
} from '../../features/authorization/api'
import type {
  AuthorizationCatalogDto,
  EligibleTargetUnitsResponseDto,
  RoleCategoriesDto,
} from '../../features/authorization/api'
import { getArmories } from '../../features/armory/api'
import type { ArmoryDTO } from '../../features/armory/api'
import { getRecintos } from '../../features/organization/api'
import type { RecintoDTO } from '../../features/organization/api'

const VIEW_KIND = {
  USERS: 'users',
  USER_DETAIL: 'user-detail',
  POSITIONS: 'positions',
  POSITION_DETAIL: 'position-detail',
  MEMBERSHIPS: 'memberships',
  UNSUPPORTED: 'unsupported',
} as const
type ViewKind = (typeof VIEW_KIND)[keyof typeof VIEW_KIND]

const DATA_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  EMPTY: 'empty',
  DENIED: 'denied',
  ERROR: 'error',
} as const
type DataState = (typeof DATA_STATE)[keyof typeof DATA_STATE]

const MODAL = {
  NONE: 'none',
  CREATE_USER: 'create-user',
  CREATE_TEMPORARY: 'create-temporary',
  EDIT_USER: 'edit-user',
  PRIMARY_ASSIGNMENT: 'primary-assignment',
  ADD_ASSIGNMENT: 'add-assignment',
  DELETE_USER: 'delete-user',
  DEACTIVATE_PRIMARY: 'deactivate-primary',
  REMOVE_ASSIGNMENT: 'remove-assignment',
  EDIT_POSITION: 'edit-position',
  DELETE_POSITION: 'delete-position',
  ASSIGN_HOLDER: 'assign-holder',
  REMOVE_HOLDER: 'remove-holder',
  EDIT_MEMBERSHIP: 'edit-membership',
  DELETE_MEMBERSHIP: 'delete-membership',
  OWN_PASSWORD: 'own-password',
  OTHER_PASSWORD: 'other-password',
  RESET_PASSWORD: 'reset-password',
  UNLOCK_USER: 'unlock-user',
} as const
type ModalKind = (typeof MODAL)[keyof typeof MODAL]
type ActiveModalKind = Exclude<ModalKind, typeof MODAL.NONE>

const FORM_CATALOG_MODAL = {
  CREATE_USER: MODAL.CREATE_USER,
  CREATE_TEMPORARY: MODAL.CREATE_TEMPORARY,
  EDIT_USER: MODAL.EDIT_USER,
  PRIMARY_ASSIGNMENT: MODAL.PRIMARY_ASSIGNMENT,
  ADD_ASSIGNMENT: MODAL.ADD_ASSIGNMENT,
  EDIT_POSITION: MODAL.EDIT_POSITION,
  ASSIGN_HOLDER: MODAL.ASSIGN_HOLDER,
  EDIT_MEMBERSHIP: MODAL.EDIT_MEMBERSHIP,
} as const
type FormCatalogModalKind = (typeof FORM_CATALOG_MODAL)[keyof typeof FORM_CATALOG_MODAL]

const WRITE_METHOD = {
  PUT: 'PUT',
  PATCH: 'PATCH',
} as const
type WriteMethod = (typeof WRITE_METHOD)[keyof typeof WRITE_METHOD]

const TAB = {
  USER_IDENTITY: 'identity',
  USER_ASSIGNMENTS: 'assignments',
  USER_ACCESS: 'access',
  POSITION_HOLDERS: 'holders',
  POSITION_HISTORY: 'history',
  POSITION_DATA: 'position-data',
} as const
type TabKind = (typeof TAB)[keyof typeof TAB]

// Claves locales conservadas 1:1 (AC-7); los códigos provienen del catálogo
// compartido (única fuente, plan frontend-permission-navigation F5).
const PERMISSION = {
  USER_READ: PERMISSION_CODE.VIEW_PERSONNEL_BASIC,
  USER_CREATE: PERMISSION_CODE.CREATE_USERS,
  USER_UPDATE: PERMISSION_CODE.UPDATE_USERS,
  USER_DELETE: PERMISSION_CODE.DISABLE_USERS,
  POSITION_READ: PERMISSION_CODE.VIEW_UNIT,
  POSITION_CREATE: PERMISSION_CODE.ASSIGN_POSITIONS,
  POSITION_UPDATE: PERMISSION_CODE.ASSIGN_POSITIONS,
  POSITION_DELETE: PERMISSION_CODE.REVOKE_POSITIONS,
} as const

const SCOPE_SELECTION = {
  OMIT: '__scope_omit__',
  CLEAR: '__scope_clear__',
} as const

interface Ticket {
  principalId: number
  tenantCode: string
  unitCode: string
  resource: string
  operation: string
  attempt: number
  generation: number
  permissionsKey: string
  controller: AbortController
}

interface AccountOption {
  accountId: number
  rut: string
  unitName: string
}

interface UserDraft {
  rut: string
  grado: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  correo: string
  method: WriteMethod
}

interface InitialAssignmentDraft {
  unit_code: string
  role_code: string
  scope_code: string
}

interface TemporaryDraft {
  rut: string
  grado: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  organization_unit_code: string
}

interface AssignmentDraft {
  unit_code: string
  role_code: string
  scopeSelection: string
  method: WriteMethod
}

interface PositionDraft {
  id: number | null
  code: string
  name: string
  organization_unit_code_write: string
  role_code_write: string
  armory_code_write: string
  scope_code_write: string
  recinto_code_write: string
  description: string
  is_active: boolean
  is_unique_holder: boolean
  method: WriteMethod
}

interface HolderDraft {
  account_id: string
  is_primary: boolean
  starts_at: string
}

interface MembershipDraft {
  id: number | null
  account: string
  unit: string
  is_primary: boolean
  is_active: boolean
  starts_at: string
  ends_at: string
  method: WriteMethod
}

interface PasswordDraft {
  old_password: string
  new_password: string
  confirm_password: string
}

interface UncertainMutation {
  resource: string
  sessionKey: string
  operation: string
}

function initialUserDraft(): UserDraft {
  return {
    rut: '', grado: '', nombre: '', apellido_paterno: '', apellido_materno: '', correo: '',
    method: WRITE_METHOD.PUT,
  }
}

function initialAssignmentForCreate(): InitialAssignmentDraft {
  return { unit_code: '', role_code: '', scope_code: '' }
}

function initialTemporaryDraft(): TemporaryDraft {
  return {
    rut: '', grado: '', nombre: '', apellido_paterno: '', apellido_materno: '',
    organization_unit_code: '',
  }
}

function initialAssignmentDraft(): AssignmentDraft {
  return { unit_code: '', role_code: '', scopeSelection: SCOPE_SELECTION.OMIT, method: WRITE_METHOD.PUT }
}

function initialPositionDraft(): PositionDraft {
  return {
    id: null, code: '', name: '', organization_unit_code_write: '', role_code_write: '',
    armory_code_write: '', scope_code_write: '', recinto_code_write: '', description: '',
    is_active: true, is_unique_holder: false, method: WRITE_METHOD.PUT,
  }
}

function initialHolderDraft(): HolderDraft {
  return { account_id: '', is_primary: false, starts_at: '' }
}

function initialMembershipDraft(): MembershipDraft {
  return {
    id: null, account: '', unit: '', is_primary: false, is_active: true,
    starts_at: '', ends_at: '', method: WRITE_METHOD.PUT,
  }
}

function initialPasswordDraft(): PasswordDraft {
  return { old_password: '', new_password: '', confirm_password: '' }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function routeId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}

function displayValue(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

const RUT_PATTERN = /^\d{7,8}-[0-9kK]$/
const LOCAL_DATE_FORMAT = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' })
const LOCAL_DATE_TIME_FORMAT = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

// Lectura de fechas en formato local (es-CL) sin alterar el `type` del campo ni el payload.
// Las fechas sin hora (AAAA-MM-DD) se interpretan como fecha civil para no desplazar el día por zona.
function formatLocalDate(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return LOCAL_DATE_FORMAT.format(new Date(Number(year), Number(month) - 1, Number(day)))
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : LOCAL_DATE_TIME_FORMAT.format(parsed)
}

// Un solo separador: evita el «— → —» cuando faltan ambos extremos.
function formatLocalRange(start: string | null | undefined, end: string | null | undefined): string {
  const hasStart = start !== null && start !== undefined && start !== ''
  const hasEnd = end !== null && end !== undefined && end !== ''
  if (!hasStart && !hasEnd) return '—'
  return `${hasStart ? formatLocalDate(start) : '—'} → ${hasEnd ? formatLocalDate(end) : '—'}`
}

function isIsoDateOrDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?/.test(value)
}

function errorStatus(error: unknown): number | null {
  if (!isRecord(error)) return null
  const status = error.status
  return typeof status === 'number' && Number.isInteger(status) ? status : null
}

function responseText(error: unknown): string | null {
  if (!isRecord(error)) return null
  const payload = error.payload
  if (isRecord(payload)) {
    for (const key of ['detail', 'error', 'mensaje']) {
      const value = payload[key]
      if (typeof value === 'string' && value.trim()) return value
    }
  }
  if (typeof error.detail === 'string' && error.detail.trim()) return error.detail
  return null
}

function errorText(error: unknown): string {
  const status = errorStatus(error)
  const text = responseText(error)
  if (text) return text
  if (status === 403) return 'El servidor denegó esta operación.'
  if (status === 404) return 'El servidor no encontró el recurso solicitado.'
  if (status === 400) return 'El servidor rechazó los datos enviados.'
  if (status !== null) return `El servidor rechazó la operación (código ${status}).`
  if (error instanceof Error && error.name === 'AbortError') return 'La solicitud fue interrumpida.'
  return 'No se pudo confirmar la respuesta del servidor.'
}

function fieldErrorMessages(error: unknown): Record<string, string> {
  if (!isRecord(error) || !isRecord(error.payload)) return {}
  const payloadErrors = error.payload.errors
  const result: Record<string, string> = {}
  const fields = isRecord(payloadErrors) ? payloadErrors : error.payload
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string') result[key] = value
    else if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === 'string')
      if (messages.length) result[key] = messages.join(' ')
    }
  }
  return result
}

function isConfirmedClientRejection(error: unknown): boolean {
  const status = errorStatus(error)
  return status !== null && status >= 400 && status < 500
}

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const userId = computed(() => routeId(route.params.idUsuario))
const positionId = computed(() => routeId(route.params.idPosicion))
const currentPath = computed(() => route.path.replace(/\/+$/, '') || '/')

const viewKind = computed<ViewKind>(() => {
  if (currentPath.value === '/personas') return VIEW_KIND.USERS
  if (/^\/personas\/[1-9]\d*$/.test(currentPath.value)) return VIEW_KIND.USER_DETAIL
  if (currentPath.value === '/organizacion/puestos') return VIEW_KIND.POSITIONS
  if (/^\/organizacion\/puestos\/[1-9]\d*$/.test(currentPath.value)) return VIEW_KIND.POSITION_DETAIL
  if (currentPath.value === '/organizacion/membresias') return VIEW_KIND.MEMBERSHIPS
  return VIEW_KIND.UNSUPPORTED
})

const resourceKey = computed(() => {
  if (viewKind.value === VIEW_KIND.USER_DETAIL) return `user:${userId.value ?? 'invalid'}`
  if (viewKind.value === VIEW_KIND.POSITION_DETAIL) return `position:${positionId.value ?? 'invalid'}`
  return viewKind.value
})

const sessionEligible = computed(() => {
  const identity = session.identity
  const context = session.context
  return session.status === SESSION_STATUS.READY
    && identity !== null
    && context !== null
    && context.user.id_usuario === identity.id_usuario
    && session.tenantCode.trim().length > 0
    && session.unitCode.trim().length > 0
})

const sessionKey = computed(() => [
  session.identity?.id_usuario ?? '',
  session.tenantCode,
].join('|'))

const permissionSetKey = computed(() => session.context?.permissions.join('\u0000') ?? '')
const hasUserRead = computed(() => session.context?.permissions.includes(PERMISSION.USER_READ) === true)
const hasUserCreate = computed(() => session.context?.permissions.includes(PERMISSION.USER_CREATE) === true)
const hasUserUpdate = computed(() => session.context?.permissions.includes(PERMISSION.USER_UPDATE) === true)
const hasUserDelete = computed(() => session.context?.permissions.includes(PERMISSION.USER_DELETE) === true)
const hasPositionRead = computed(() => session.context?.permissions.includes(PERMISSION.POSITION_READ) === true)
const hasPositionCreate = computed(() => session.context?.permissions.includes(PERMISSION.POSITION_CREATE) === true)
const hasPositionUpdate = computed(() => session.context?.permissions.includes(PERMISSION.POSITION_UPDATE) === true)
const hasPositionDelete = computed(() => session.context?.permissions.includes(PERMISSION.POSITION_DELETE) === true)
const isOwnUserRoute = computed(() => sessionEligible.value
  && userId.value !== null
  && session.identity?.id_usuario === userId.value)
const isVoluntaryOwnPasswordAvailable = computed(() => isOwnUserRoute.value
  && session.context?.user.must_change_password === false
  && session.identity?.must_change_password === false)

const mainState = shallowRef<DataState>(DATA_STATE.IDLE)
const userState = shallowRef<DataState>(DATA_STATE.IDLE)
const lockState = shallowRef<DataState>(DATA_STATE.IDLE)
const membershipsState = shallowRef<DataState>(DATA_STATE.IDLE)
const positionsState = shallowRef<DataState>(DATA_STATE.IDLE)
const historyState = shallowRef<DataState>(DATA_STATE.IDLE)
const catalogState = shallowRef<DataState>(DATA_STATE.IDLE)
const eligibleUnitsState = shallowRef<DataState>(DATA_STATE.IDLE)
const initialUnitsState = shallowRef<DataState>(DATA_STATE.IDLE)
const viewError = shallowRef('')
const userError = shallowRef('')
const positionsError = shallowRef('')
const historyError = shallowRef('')
const lockError = shallowRef('')
const membershipsError = shallowRef('')
const catalogError = shallowRef('')
// `mutationError` es exclusivo del servidor (rechazo/denegación/resultado incierto);
// `formNotice` transporta los avisos de estado previo a la emisión (no son campo ni servidor).
const mutationError = shallowRef('')
const formNotice = shallowRef('')
const mutationFeedback = shallowRef('')
const fieldErrors = shallowRef<Record<string, string>>({})
const modal = shallowRef<ModalKind>(MODAL.NONE)
const activeTab = shallowRef<TabKind>(TAB.USER_IDENTITY)
const activeFilter = shallowRef('')
const sortKey = shallowRef('')
const sortAscending = shallowRef(true)
const modalBusy = shallowRef(false)
const reconciliationPending = shallowRef(false)
const mutationOperations = shallowRef(new Set<string>())
const activeMutationTicket = shallowRef<Ticket | null>(null)
const uncertainMutation = shallowRef<UncertainMutation | null>(null)
const selectedAssignmentId = shallowRef<number | null>(null)
const selectedHolderId = shallowRef<number | null>(null)
const selectedMembershipId = shallowRef<number | null>(null)

const users = shallowRef<IdentityUserDTO[]>([])
const currentUser = shallowRef<IdentityUserDTO | null>(null)
const positions = shallowRef<PositionDTO[]>([])
const currentPosition = shallowRef<PositionDTO | null>(null)
const holderHistory = shallowRef<PositionHolderHistoryDTO | null>(null)
const memberships = shallowRef<UnitMembershipDTO[]>([])
const originalMembership = shallowRef<UnitMembershipDTO | null>(null)
const lockStatus = shallowRef<UserLockStatusDTO | null>(null)
const organizationUnits = shallowRef<OrganizationUnitDTO[]>([])
const initialAssignableUnits = shallowRef<OrganizationUnitDTO[]>([])
const eligibleTargets = shallowRef<EligibleTargetUnitsResponseDto | null>(null)
const authorizationCatalog = shallowRef<AuthorizationCatalogDto | null>(null)
const roleCategories = shallowRef<RoleCategoriesDto | null>(null)
const armories = shallowRef<ArmoryDTO[]>([])
const recintos = shallowRef<readonly RecintoDTO[]>([])

const userDraft = reactive<UserDraft>(initialUserDraft())
const formalAssignmentDraft = reactive<InitialAssignmentDraft>(initialAssignmentForCreate())
const temporaryDraft = reactive<TemporaryDraft>(initialTemporaryDraft())
const assignmentDraft = reactive<AssignmentDraft>(initialAssignmentDraft())
const positionDraft = reactive<PositionDraft>(initialPositionDraft())
const holderDraft = reactive<HolderDraft>(initialHolderDraft())
const membershipDraft = reactive<MembershipDraft>(initialMembershipDraft())
const ownPasswordDraft = reactive<PasswordDraft>(initialPasswordDraft())
const otherPasswordDraft = reactive<PasswordDraft>(initialPasswordDraft())

const requestControllers = new Map<string, AbortController>()
const operationAttempts = new Map<string, number>()
let componentIsMounted = false
let contextRefreshInProgress = false
let privateDataGeneration = 0

const modalTitle = computed(() => {
  switch (modal.value) {
    case MODAL.CREATE_USER: return 'Alta de usuario formal'
    case MODAL.CREATE_TEMPORARY: return 'Alta de usuario temporal'
    case MODAL.EDIT_USER: return 'Editar usuario'
    case MODAL.PRIMARY_ASSIGNMENT: return 'Asignación principal'
    case MODAL.ADD_ASSIGNMENT: return 'Asignación secundaria'
    case MODAL.DELETE_USER: return 'Confirmar baja de usuario'
    case MODAL.DEACTIVATE_PRIMARY: return 'Desactivar asignación principal'
    case MODAL.REMOVE_ASSIGNMENT: return 'Quitar asignación'
    case MODAL.EDIT_POSITION: return positionDraft.id === null ? 'Crear puesto' : 'Editar puesto'
    case MODAL.DELETE_POSITION: return 'Confirmar baja de puesto'
    case MODAL.ASSIGN_HOLDER: return 'Asignar titular'
    case MODAL.REMOVE_HOLDER: return 'Quitar titular'
    case MODAL.EDIT_MEMBERSHIP: return membershipDraft.id === null ? 'Crear membresía' : 'Editar membresía'
    case MODAL.DELETE_MEMBERSHIP: return 'Confirmar baja de membresía'
    case MODAL.OWN_PASSWORD: return 'Cambiar mi contraseña'
    case MODAL.OTHER_PASSWORD: return 'Cambiar contraseña de otra persona'
    case MODAL.RESET_PASSWORD: return 'Restablecer contraseña'
    case MODAL.UNLOCK_USER: return 'Desbloquear cuenta'
    default: return ''
  }
})

const activeMutations = computed(() => mutationOperations.value.size > 0)
const isBlockedByUncertainMutation = computed(() => uncertainMutation.value !== null
  && uncertainMutation.value.resource === resourceKey.value
  && uncertainMutation.value.sessionKey === sessionKey.value)
const formsBlocked = computed(() => !sessionEligible.value
  || activeMutations.value
  || reconciliationPending.value
  || isBlockedByUncertainMutation.value)

const fullUserName = computed(() => currentUser.value
  ? [currentUser.value.grado, currentUser.value.nombre, currentUser.value.apellido_paterno, currentUser.value.apellido_materno]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
  : '')

const roleOptions = computed(() => roleCategories.value?.categories.flatMap((category) =>
  category.roles.map((role) => ({ code: role.code, name: role.name, category: category.label }))) ?? [])
const scopeOptions = computed(() => authorizationCatalog.value?.scopes ?? [])
const accountOptions = computed<AccountOption[]>(() => {
  const byAccount = new Map<number, AccountOption>()
  for (const membership of memberships.value) {
    if (!byAccount.has(membership.account)) {
      byAccount.set(membership.account, {
        accountId: membership.account,
        rut: membership.rut,
        unitName: membership.unit_name,
      })
    }
  }
  return [...byAccount.values()]
})

const filteredUsers = computed(() => {
  const query = activeFilter.value.trim().toLocaleLowerCase()
  const result = users.value.filter((item) => {
    if (!query) return true
    return [item.rut, item.grado, item.nombre, item.apellido_paterno, item.apellido_materno, item.correo]
      .some((value) => value?.toLocaleLowerCase().includes(query) === true)
  })
  if (!sortKey.value) return result
  return [...result].sort((a, b) => {
    const left = userSortValue(a, sortKey.value)
    const right = userSortValue(b, sortKey.value)
    const order = left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
    return sortAscending.value ? order : -order
  })
})

const filteredPositions = computed(() => {
  const query = activeFilter.value.trim().toLocaleLowerCase()
  const result = positions.value.filter((item) => !query
    || [item.code, item.name, item.organization_unit_code, item.organization_unit_name, item.role_code, item.role_name]
      .some((value) => value.toLocaleLowerCase().includes(query)))
  if (!sortKey.value) return result
  return [...result].sort((a, b) => {
    const order = positionSortValue(a, sortKey.value).localeCompare(positionSortValue(b, sortKey.value), undefined, {
      numeric: true,
      sensitivity: 'base',
    })
    return sortAscending.value ? order : -order
  })
})

const filteredMemberships = computed(() => {
  const query = activeFilter.value.trim().toLocaleLowerCase()
  const result = memberships.value.filter((item) => !query
    || [item.rut, item.unit_code, item.unit_name, String(item.account)]
      .some((value) => value.toLocaleLowerCase().includes(query)))
  if (!sortKey.value) return result
  return [...result].sort((a, b) => {
    const order = membershipSortValue(a, sortKey.value).localeCompare(membershipSortValue(b, sortKey.value), undefined, {
      numeric: true,
      sensitivity: 'base',
    })
    return sortAscending.value ? order : -order
  })
})

const userMemberships = computed(() => {
  const rut = currentUser.value?.rut
  return rut ? memberships.value.filter((item) => item.rut === rut) : []
})

const unitOptionsForAssignment = computed(() => {
  const response = eligibleTargets.value
  return response && 'unidad_personal_code' in response ? response.results : []
})

const eligiblePersonalUnitCode = computed(() => {
  const response = eligibleTargets.value
  return response && 'unidad_personal_code' in response ? response.unidad_personal_code : null
})

const eligibleUnitRestriction = computed(() => {
  const response = eligibleTargets.value
  if (!response || !('reason' in response)) return ''
  return response.reason
})

// Marcadores de pestaña: señalan un recurso de esa pestaña que falló al leerse,
// aunque la pestaña activa sea otra.
const userAccessTabHasError = computed(() => lockState.value === DATA_STATE.ERROR
  || lockState.value === DATA_STATE.DENIED
  || membershipsState.value === DATA_STATE.ERROR
  || membershipsState.value === DATA_STATE.DENIED)
const positionHoldersTabHasError = computed(() => historyState.value === DATA_STATE.ERROR
  || historyState.value === DATA_STATE.DENIED)

function userSortValue(user: IdentityUserDTO, key: string): string {
  if (key === 'rut') return user.rut
  if (key === 'status') return user.habilitado ? '1' : '0'
  return [user.apellido_paterno, user.apellido_materno, user.nombre].filter(Boolean).join(' ')
}

function positionSortValue(position: PositionDTO, key: string): string {
  if (key === 'unit') return position.organization_unit_code
  if (key === 'holders') return String(position.current_holders_count).padStart(12, '0')
  return key === 'state' ? (position.is_active ? '1' : '0') : position.code
}

function membershipSortValue(membership: UnitMembershipDTO, key: string): string {
  if (key === 'unit') return membership.unit_code
  if (key === 'primary') return membership.is_primary ? '1' : '0'
  return membership.rut
}

function setSort(key: string): void {
  if (sortKey.value === key) sortAscending.value = !sortAscending.value
  else {
    sortKey.value = key
    sortAscending.value = true
  }
}

function hasPermission(permission: string): boolean {
  return session.context?.permissions.includes(permission) === true
}

function connection(signal?: AbortSignal): ApiConnection | null {
  if (!sessionEligible.value) return null
  return {
    tenantCode: session.tenantCode.trim(),
    unitCode: session.unitCode.trim(),
    signal,
  }
}

function beginTicket(operation: string, requiredPermission?: string): Ticket | null {
  if (contextRefreshInProgress || reconciliationPending.value) return null
  if (!sessionEligible.value || !session.identity || !session.context) return null
  if (requiredPermission && !hasPermission(requiredPermission)) return null

  const attempt = (operationAttempts.get(operation) ?? 0) + 1
  operationAttempts.set(operation, attempt)
  const previous = requestControllers.get(operation)
  requestControllers.delete(operation)
  previous?.abort()

  const controller = new AbortController()
  requestControllers.set(operation, controller)
  return {
    principalId: session.identity.id_usuario,
    tenantCode: session.tenantCode.trim(),
    unitCode: session.unitCode.trim(),
    resource: resourceKey.value,
    operation,
    attempt,
    generation: session.generation,
    permissionsKey: permissionSetKey.value,
    controller,
  }
}

function ticketIsCurrent(ticket: Ticket): boolean {
  return sessionEligible.value
    && session.identity?.id_usuario === ticket.principalId
    && session.tenantCode.trim() === ticket.tenantCode
    && session.unitCode.trim() === ticket.unitCode
    && resourceKey.value === ticket.resource
    && session.generation === ticket.generation
    && permissionSetKey.value === ticket.permissionsKey
    && operationAttempts.get(ticket.operation) === ticket.attempt
    && requestControllers.get(ticket.operation) === ticket.controller
    && !ticket.controller.signal.aborted
}

function endTicket(ticket: Ticket): void {
  if (!ticketIsCurrent(ticket)) return
  requestControllers.delete(ticket.operation)
}

function clearSensitiveDrafts(): void {
  Object.assign(ownPasswordDraft, initialPasswordDraft())
  Object.assign(otherPasswordDraft, initialPasswordDraft())
}

function clearAllDrafts(): void {
  Object.assign(userDraft, initialUserDraft())
  Object.assign(formalAssignmentDraft, initialAssignmentForCreate())
  Object.assign(temporaryDraft, initialTemporaryDraft())
  Object.assign(assignmentDraft, initialAssignmentDraft())
  Object.assign(positionDraft, initialPositionDraft())
  Object.assign(holderDraft, initialHolderDraft())
  Object.assign(membershipDraft, initialMembershipDraft())
  clearSensitiveDrafts()
  selectedAssignmentId.value = null
  selectedHolderId.value = null
  selectedMembershipId.value = null
}

function clearPrivateData(): void {
  users.value = []
  currentUser.value = null
  positions.value = []
  currentPosition.value = null
  holderHistory.value = null
  memberships.value = []
  originalMembership.value = null
  lockStatus.value = null
  organizationUnits.value = []
  initialAssignableUnits.value = []
  eligibleTargets.value = null
  authorizationCatalog.value = null
  roleCategories.value = null
  armories.value = []
  recintos.value = []
  mainState.value = DATA_STATE.IDLE
  userState.value = DATA_STATE.IDLE
  lockState.value = DATA_STATE.IDLE
  membershipsState.value = DATA_STATE.IDLE
  positionsState.value = DATA_STATE.IDLE
  historyState.value = DATA_STATE.IDLE
  catalogState.value = DATA_STATE.IDLE
  eligibleUnitsState.value = DATA_STATE.IDLE
  initialUnitsState.value = DATA_STATE.IDLE
  viewError.value = ''
  userError.value = ''
  positionsError.value = ''
  historyError.value = ''
  lockError.value = ''
  membershipsError.value = ''
  catalogError.value = ''
  mutationError.value = ''
  formNotice.value = ''
  mutationFeedback.value = ''
  fieldErrors.value = {}
  modal.value = MODAL.NONE
  modalBusy.value = false
  reconciliationPending.value = false
  mutationOperations.value = new Set()
  activeMutationTicket.value = null
  activeFilter.value = ''
  sortKey.value = ''
  sortAscending.value = true
  clearAllDrafts()
}

function invalidateThenAbort(): void {
  const pending = activeMutationTicket.value
  const interruptedMutation = modalBusy.value
    && modal.value !== MODAL.NONE
    && pending !== null
    && mutationOperations.value.has(pending.operation)
    && requestControllers.get(pending.operation) === pending.controller
    && !pending.controller.signal.aborted
    ? {
      resource: pending.resource,
      sessionKey: [pending.principalId, pending.tenantCode].join('|'),
      operation: pending.operation,
    }
    : null
  privateDataGeneration += 1
  clearPrivateData()
  if (interruptedMutation) uncertainMutation.value = interruptedMutation
  if (isBlockedByUncertainMutation.value) {
    mutationError.value = interruptedMutation
      ? 'La operación quedó interrumpida y el servidor pudo haberla aplicado. Lee el recurso afectado antes de reintentar.'
      : 'La mutación anterior pudo haberse aplicado. Lee el recurso afectado antes de reintentar.'
  }
  for (const controller of requestControllers.values()) controller.abort()
  requestControllers.clear()
  operationAttempts.clear()
}

function currentMutationUncertain(resource: string, operation: string): void {
  uncertainMutation.value = { resource, sessionKey: sessionKey.value, operation }
  mutationError.value = 'No se puede repetir esta operación porque el servidor pudo haberla aplicado. Lee de nuevo el recurso para reconciliar antes de intentar otra mutación.'
  clearSensitiveDrafts()
  modal.value = MODAL.NONE
}

function clearUncertaintyAfterRead(resource: string): void {
  const uncertain = uncertainMutation.value
  if (uncertain?.resource === resource && uncertain.sessionKey === sessionKey.value) {
    uncertainMutation.value = null
    mutationError.value = ''
  }
}

function setDeniedOrError(error: unknown): DataState {
  return errorStatus(error) === 403 ? DATA_STATE.DENIED : DATA_STATE.ERROR
}

function reportReadError(error: unknown, target: 'main' | 'user' | 'lock' | 'memberships' | 'positions' | 'history' | 'catalog'): void {
  const state = setDeniedOrError(error)
  const message = errorText(error)
  if (target === 'main') {
    mainState.value = state
    viewError.value = message
  } else if (target === 'user') {
    userState.value = state
    userError.value = message
  } else if (target === 'lock') {
    lockState.value = state
    lockError.value = message
  } else if (target === 'memberships') {
    membershipsState.value = state
    membershipsError.value = message
  } else if (target === 'positions') {
    positionsState.value = state
    positionsError.value = message
  } else if (target === 'history') {
    historyState.value = state
    historyError.value = message
  } else {
    catalogState.value = state
    catalogError.value = message
  }
}

async function readUsers(): Promise<void> {
  if (!hasUserRead.value) {
    mainState.value = DATA_STATE.DENIED
    viewError.value = 'Tu sesión no tiene permiso para ver el listado de personas.'
    return
  }
  const ticket = beginTicket('users:list', PERMISSION.USER_READ)
  if (!ticket) return
  const apiConnection = connection(ticket.controller.signal)
  if (!apiConnection) return
  mainState.value = DATA_STATE.LOADING
  viewError.value = ''
  try {
    const response = await getUsers(apiConnection)
    if (!ticketIsCurrent(ticket)) return
    users.value = response
    mainState.value = response.length ? DATA_STATE.READY : DATA_STATE.EMPTY
    clearUncertaintyAfterRead(ticket.resource)
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket)) reportReadError(error, 'main')
  } finally {
    if (ticketIsCurrent(ticket)) {
      if (mainState.value === DATA_STATE.LOADING) mainState.value = DATA_STATE.IDLE
      endTicket(ticket)
    }
  }
}

async function readUserDetail(): Promise<void> {
  if (userId.value === null) {
    userState.value = DATA_STATE.ERROR
    userError.value = 'La dirección de la ficha no incluye un identificador de usuario válido.'
    return
  }
  if (!hasUserRead.value) {
    userState.value = DATA_STATE.DENIED
    userError.value = 'Tu sesión no tiene permiso para ver la ficha de esta persona.'
    return
  }
  const id = userId.value
  const ticket = beginTicket(`user:detail:${id}`, PERMISSION.USER_READ)
  if (!ticket) return
  const apiConnection = connection(ticket.controller.signal)
  if (!apiConnection) return
  userState.value = DATA_STATE.LOADING
  userError.value = ''
  try {
    const response = await getUser(id, apiConnection)
    if (!ticketIsCurrent(ticket)) return
    currentUser.value = response
    userState.value = DATA_STATE.READY
    clearUncertaintyAfterRead(ticket.resource)
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket)) reportReadError(error, 'user')
  } finally {
    if (ticketIsCurrent(ticket)) {
      if (userState.value === DATA_STATE.LOADING) userState.value = DATA_STATE.IDLE
      endTicket(ticket)
    }
  }
}

async function readLockStatus(): Promise<void> {
  if (userId.value === null || !hasUserRead.value) {
    lockState.value = hasUserRead.value ? DATA_STATE.ERROR : DATA_STATE.DENIED
    lockError.value = hasUserRead.value ? 'La dirección de la ficha no incluye un identificador de usuario válido.' : 'Tu sesión no tiene permiso para consultar el estado de bloqueo.'
    return
  }
  const id = userId.value
  const ticket = beginTicket(`user:lock:${id}`, PERMISSION.USER_READ)
  if (!ticket) return
  const apiConnection = connection(ticket.controller.signal)
  if (!apiConnection) return
  lockState.value = DATA_STATE.LOADING
  lockError.value = ''
  try {
    const response = await getUserLockStatus(id, apiConnection)
    if (!ticketIsCurrent(ticket)) return
    lockStatus.value = response
    lockState.value = DATA_STATE.READY
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket)) reportReadError(error, 'lock')
  } finally {
    if (ticketIsCurrent(ticket)) {
      if (lockState.value === DATA_STATE.LOADING) lockState.value = DATA_STATE.IDLE
      endTicket(ticket)
    }
  }
}

async function readMemberships(): Promise<void> {
  if (!hasPositionRead.value) {
    membershipsState.value = DATA_STATE.DENIED
    membershipsError.value = 'Tu sesión no tiene permiso para ver las membresías.'
    return
  }
  const ticket = beginTicket('memberships:list', PERMISSION.POSITION_READ)
  if (!ticket) return
  const apiConnection = connection(ticket.controller.signal)
  if (!apiConnection) return
  membershipsState.value = DATA_STATE.LOADING
  membershipsError.value = ''
  try {
    const response = await getMemberships(apiConnection)
    if (!ticketIsCurrent(ticket)) return
    memberships.value = response
    membershipsState.value = response.length ? DATA_STATE.READY : DATA_STATE.EMPTY
    clearUncertaintyAfterRead(ticket.resource)
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket)) reportReadError(error, 'memberships')
  } finally {
    if (ticketIsCurrent(ticket)) {
      if (membershipsState.value === DATA_STATE.LOADING) membershipsState.value = DATA_STATE.IDLE
      endTicket(ticket)
    }
  }
}

async function readPositions(): Promise<void> {
  if (!hasPositionRead.value) {
    positionsState.value = DATA_STATE.DENIED
    positionsError.value = 'Tu sesión no tiene permiso para ver los puestos.'
    return
  }
  const ticket = beginTicket('positions:list', PERMISSION.POSITION_READ)
  if (!ticket) return
  const apiConnection = connection(ticket.controller.signal)
  if (!apiConnection) return
  positionsState.value = DATA_STATE.LOADING
  positionsError.value = ''
  try {
    const response = await getPositions(apiConnection)
    if (!ticketIsCurrent(ticket)) return
    positions.value = response
    positionsState.value = response.length ? DATA_STATE.READY : DATA_STATE.EMPTY
    clearUncertaintyAfterRead(ticket.resource)
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket)) reportReadError(error, 'positions')
  } finally {
    if (ticketIsCurrent(ticket)) {
      if (positionsState.value === DATA_STATE.LOADING) positionsState.value = DATA_STATE.IDLE
      endTicket(ticket)
    }
  }
}

async function readPositionDetail(): Promise<void> {
  if (positionId.value === null) {
    positionsState.value = DATA_STATE.ERROR
    positionsError.value = 'La dirección del puesto no incluye un identificador válido.'
    return
  }
  if (!hasPositionRead.value) {
    positionsState.value = DATA_STATE.DENIED
    positionsError.value = 'Tu sesión no tiene permiso para ver el puesto.'
    return
  }
  const id = positionId.value
  const detailTicket = beginTicket(`position:detail:${id}`, PERMISSION.POSITION_READ)
  const historyTicket = beginTicket(`position:history:${id}`, PERMISSION.POSITION_READ)
  if (!detailTicket || !historyTicket) return
  const detailConnection = connection(detailTicket.controller.signal)
  const historyConnection = connection(historyTicket.controller.signal)
  if (!detailConnection || !historyConnection) return
  positionsState.value = DATA_STATE.LOADING
  historyState.value = DATA_STATE.LOADING
  positionsError.value = ''
  historyError.value = ''
  try {
    const response = await getPosition(id, detailConnection)
    if (!ticketIsCurrent(detailTicket)) return
    currentPosition.value = response
    positionsState.value = DATA_STATE.READY
    clearUncertaintyAfterRead(detailTicket.resource)
  } catch (error: unknown) {
    if (ticketIsCurrent(detailTicket)) reportReadError(error, 'positions')
  } finally {
    if (ticketIsCurrent(detailTicket)) {
      if (positionsState.value === DATA_STATE.LOADING) positionsState.value = DATA_STATE.IDLE
      endTicket(detailTicket)
    }
  }
  try {
    const response = await getPositionHolderHistory(id, historyConnection)
    if (!ticketIsCurrent(historyTicket)) return
    holderHistory.value = response
    historyState.value = response.holders.length ? DATA_STATE.READY : DATA_STATE.EMPTY
    clearUncertaintyAfterRead(historyTicket.resource)
  } catch (error: unknown) {
    if (ticketIsCurrent(historyTicket)) reportReadError(error, 'history')
  } finally {
    if (ticketIsCurrent(historyTicket)) {
      if (historyState.value === DATA_STATE.LOADING) historyState.value = DATA_STATE.IDLE
      endTicket(historyTicket)
    }
  }
}

async function loadRouteData(): Promise<void> {
  if (!sessionEligible.value) {
    mainState.value = DATA_STATE.DENIED
    viewError.value = 'Se requiere una sesión con tenant y unidad activos.'
    return
  }
  mutationFeedback.value = ''
  mutationError.value = ''
  if (viewKind.value === VIEW_KIND.USERS) await readUsers()
  else if (viewKind.value === VIEW_KIND.USER_DETAIL) {
    await Promise.all([readUserDetail(), readLockStatus()])
    if (hasPositionRead.value) await readMemberships()
  } else if (viewKind.value === VIEW_KIND.POSITIONS) await readPositions()
  else if (viewKind.value === VIEW_KIND.POSITION_DETAIL) await readPositionDetail()
  else if (viewKind.value === VIEW_KIND.MEMBERSHIPS) await readMemberships()
  else {
    mainState.value = DATA_STATE.ERROR
    viewError.value = 'La ruta no corresponde a una superficie de identidad implementada.'
  }
}

function onTabKeydown(event: KeyboardEvent, group: 'user' | 'position'): void {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) return
  const tablist = target.closest('[role="tablist"]')
  if (!tablist) return
  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
  const currentIndex = tabs.indexOf(target as HTMLButtonElement)
  if (currentIndex < 0 || tabs.length === 0) return
  event.preventDefault()
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? tabs.length - 1
      : (currentIndex + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length
  tabs[nextIndex]?.focus()
  tabs[nextIndex]?.click()
  if (group === 'user' && tabs[nextIndex]) activeTab.value = (tabs[nextIndex].dataset.tab as TabKind) ?? TAB.USER_IDENTITY
  if (group === 'position' && tabs[nextIndex]) activeTab.value = (tabs[nextIndex].dataset.tab as TabKind) ?? TAB.POSITION_HOLDERS
}

function setMembershipRowsFromResponse(response: UnitMembershipDTO[]): void {
  memberships.value = response
  membershipsState.value = response.length ? DATA_STATE.READY : DATA_STATE.EMPTY
}

async function loadFormCatalogs(kind: FormCatalogModalKind): Promise<void> {
  const operation = `catalogs:${kind}`
  const needsEligibleUnits = kind === MODAL.PRIMARY_ASSIGNMENT || kind === MODAL.ADD_ASSIGNMENT
  const needsInitialUnits = kind === MODAL.CREATE_USER
  if (needsInitialUnits) {
    catalogState.value = DATA_STATE.LOADING
    catalogError.value = ''
    initialAssignableUnits.value = []
    initialUnitsState.value = DATA_STATE.LOADING
    roleCategories.value = null
    authorizationCatalog.value = null
  }
  if (needsEligibleUnits) {
    eligibleTargets.value = null
    eligibleUnitsState.value = DATA_STATE.IDLE
    roleCategories.value = null
    authorizationCatalog.value = null
  }
  const permission = kind === MODAL.CREATE_USER || kind === MODAL.CREATE_TEMPORARY
    ? PERMISSION.USER_CREATE
    : kind === MODAL.PRIMARY_ASSIGNMENT || kind === MODAL.ADD_ASSIGNMENT || kind === MODAL.EDIT_USER
      ? PERMISSION.USER_UPDATE
      : kind === MODAL.EDIT_POSITION || kind === MODAL.ASSIGN_HOLDER
        ? PERMISSION.POSITION_UPDATE
        : kind === MODAL.EDIT_MEMBERSHIP
          ? PERMISSION.POSITION_UPDATE
          : undefined
  const ticket = beginTicket(operation, permission)
  if (!ticket) {
    catalogState.value = DATA_STATE.DENIED
    if (needsEligibleUnits) eligibleUnitsState.value = DATA_STATE.DENIED
    if (needsInitialUnits) initialUnitsState.value = DATA_STATE.DENIED
    catalogError.value = 'El contexto no acredita permiso para cargar estos catálogos.'
    return
  }
  const apiConnection = connection(ticket.controller.signal)
  if (!apiConnection) {
    if (needsEligibleUnits) eligibleUnitsState.value = DATA_STATE.DENIED
    if (needsInitialUnits) {
      initialUnitsState.value = DATA_STATE.DENIED
      catalogState.value = DATA_STATE.DENIED
      catalogError.value = 'No se pudo abrir una conexión válida para cargar los catálogos del alta formal.'
    }
    return
  }
  catalogState.value = DATA_STATE.LOADING
  if (needsEligibleUnits) eligibleUnitsState.value = DATA_STATE.LOADING
  catalogError.value = ''

  try {
    if (kind === MODAL.CREATE_USER) {
      const [units, categories, catalog] = await Promise.all([
        getAssignableUnits(apiConnection),
        getRoleCategories(apiConnection),
        getAuthorizationCatalog(apiConnection),
      ])
      if (!ticketIsCurrent(ticket)) return
      initialAssignableUnits.value = units.results
      initialUnitsState.value = units.results.length ? DATA_STATE.READY : DATA_STATE.EMPTY
      roleCategories.value = categories
      authorizationCatalog.value = catalog
    } else if (kind === MODAL.CREATE_TEMPORARY) {
      const units = await getAssignableUnits(apiConnection)
      if (!ticketIsCurrent(ticket)) return
      organizationUnits.value = units.results
    } else if (kind === MODAL.PRIMARY_ASSIGNMENT || kind === MODAL.ADD_ASSIGNMENT) {
      if (userId.value === null) throw new Error('El parámetro idUsuario no es válido.')
      const eligibleRequest = getEligibleTargetUnits(userId.value, apiConnection).then((response) => {
        if (!ticketIsCurrent(ticket)) return null
        eligibleTargets.value = response
        eligibleUnitsState.value = response.results.length > 0 || 'reason' in response
          ? DATA_STATE.READY
          : DATA_STATE.EMPTY
        return response
      }).catch((error: unknown) => {
        if (ticketIsCurrent(ticket)) eligibleUnitsState.value = setDeniedOrError(error)
        throw error
      })
      const [eligible, categories, catalog] = await Promise.all([
        eligibleRequest,
        getRoleCategories(apiConnection),
        getAuthorizationCatalog(apiConnection),
      ])
      if (!ticketIsCurrent(ticket) || !eligible) return
      roleCategories.value = categories
      authorizationCatalog.value = catalog
    } else if (kind === MODAL.EDIT_POSITION) {
      const [units, categories, catalog, armoryRows, recintoRows] = await Promise.all([
        getAssignableUnits(apiConnection),
        getRoleCategories(apiConnection),
        getAuthorizationCatalog(apiConnection),
        getArmories(apiConnection),
        getRecintos(apiConnection),
      ])
      if (!ticketIsCurrent(ticket)) return
      organizationUnits.value = units.results
      roleCategories.value = categories
      authorizationCatalog.value = catalog
      armories.value = armoryRows
      recintos.value = recintoRows
    } else if (kind === MODAL.EDIT_MEMBERSHIP) {
      const units = await getAssignableUnits(apiConnection)
      if (!ticketIsCurrent(ticket)) return
      organizationUnits.value = units.results
      if (membershipsState.value === DATA_STATE.IDLE || membershipsState.value === DATA_STATE.EMPTY) {
        const membershipRows = await getMemberships(apiConnection)
        if (!ticketIsCurrent(ticket)) return
        setMembershipRowsFromResponse(membershipRows)
      }
    } else if (kind === MODAL.ASSIGN_HOLDER) {
      if (membershipsState.value === DATA_STATE.IDLE || membershipsState.value === DATA_STATE.EMPTY) {
        const membershipRows = await getMemberships(apiConnection)
        if (!ticketIsCurrent(ticket)) return
        setMembershipRowsFromResponse(membershipRows)
      }
    }
    if (!ticketIsCurrent(ticket)) return
    catalogState.value = DATA_STATE.READY
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket)) {
      if (needsInitialUnits && initialUnitsState.value === DATA_STATE.LOADING) {
        initialUnitsState.value = setDeniedOrError(error)
      }
      if (needsEligibleUnits && eligibleUnitsState.value === DATA_STATE.LOADING) {
        eligibleUnitsState.value = setDeniedOrError(error)
      }
      reportReadError(error, 'catalog')
    }
  } finally {
    if (ticketIsCurrent(ticket)) {
      if (catalogState.value === DATA_STATE.LOADING) catalogState.value = DATA_STATE.IDLE
      endTicket(ticket)
    }
  }
}

function isFormCatalogModal(kind: ActiveModalKind): kind is FormCatalogModalKind {
  return kind === FORM_CATALOG_MODAL.CREATE_USER
    || kind === FORM_CATALOG_MODAL.CREATE_TEMPORARY
    || kind === FORM_CATALOG_MODAL.EDIT_USER
    || kind === FORM_CATALOG_MODAL.PRIMARY_ASSIGNMENT
    || kind === FORM_CATALOG_MODAL.ADD_ASSIGNMENT
    || kind === FORM_CATALOG_MODAL.EDIT_POSITION
    || kind === FORM_CATALOG_MODAL.ASSIGN_HOLDER
    || kind === FORM_CATALOG_MODAL.EDIT_MEMBERSHIP
}

function retryFormCatalogs(): void {
  const currentModal = modal.value
  if (currentModal === MODAL.NONE || !isFormCatalogModal(currentModal)) return
  void loadFormCatalogs(currentModal)
}

function canOpen(kind: ActiveModalKind): boolean {
  if (!sessionEligible.value || formsBlocked.value) return false
  if (kind === MODAL.CREATE_USER || kind === MODAL.CREATE_TEMPORARY) return hasUserCreate.value
  if (kind === MODAL.EDIT_USER || kind === MODAL.PRIMARY_ASSIGNMENT || kind === MODAL.ADD_ASSIGNMENT
    || kind === MODAL.DEACTIVATE_PRIMARY || kind === MODAL.REMOVE_ASSIGNMENT
    || kind === MODAL.OTHER_PASSWORD || kind === MODAL.RESET_PASSWORD || kind === MODAL.UNLOCK_USER) {
    return hasUserUpdate.value
  }
  if (kind === MODAL.DELETE_USER) return hasUserDelete.value
  if (kind === MODAL.EDIT_POSITION || kind === MODAL.ASSIGN_HOLDER || kind === MODAL.REMOVE_HOLDER) {
    return hasPositionUpdate.value
  }
  if (kind === MODAL.DELETE_POSITION) return hasPositionDelete.value
  if (kind === MODAL.EDIT_MEMBERSHIP) return hasPositionUpdate.value
  if (kind === MODAL.DELETE_MEMBERSHIP) return hasPositionDelete.value
  if (kind === MODAL.OWN_PASSWORD) return isVoluntaryOwnPasswordAvailable.value
  return true
}

function openModal(kind: ActiveModalKind): void {
  mutationError.value = ''
  formNotice.value = ''
  fieldErrors.value = {}
  if (!canOpen(kind)) {
    mutationError.value = 'La acción requiere sesión, contexto y permiso acreditados.'
    return
  }
  modal.value = kind
  if (kind === MODAL.CREATE_USER) {
    Object.assign(userDraft, initialUserDraft())
    Object.assign(formalAssignmentDraft, initialAssignmentForCreate())
  } else if (kind === MODAL.CREATE_TEMPORARY) {
    Object.assign(temporaryDraft, initialTemporaryDraft())
  } else if (kind === MODAL.PRIMARY_ASSIGNMENT || kind === MODAL.ADD_ASSIGNMENT) {
    Object.assign(assignmentDraft, initialAssignmentDraft())
    const primary = currentUser.value?.primary_assignment
    if (kind === MODAL.PRIMARY_ASSIGNMENT && primary) {
      assignmentDraft.unit_code = primary.unit_code ?? ''
      assignmentDraft.role_code = primary.role_code ?? ''
      assignmentDraft.scopeSelection = primary.scope_code ?? SCOPE_SELECTION.OMIT
    }
  } else if (kind === MODAL.EDIT_POSITION) {
    if (currentPosition.value) {
      Object.assign(positionDraft, {
        id: currentPosition.value.id,
        code: currentPosition.value.code,
        name: currentPosition.value.name,
        organization_unit_code_write: currentPosition.value.organization_unit_code,
        role_code_write: currentPosition.value.role_code,
        armory_code_write: currentPosition.value.armory_code ?? '',
        scope_code_write: currentPosition.value.scope_code ?? '',
        recinto_code_write: currentPosition.value.recinto_code ?? '',
        description: currentPosition.value.description,
        is_active: currentPosition.value.is_active,
        is_unique_holder: currentPosition.value.is_unique_holder,
        method: WRITE_METHOD.PUT,
      })
    } else Object.assign(positionDraft, initialPositionDraft())
  } else if (kind === MODAL.ASSIGN_HOLDER) {
    Object.assign(holderDraft, initialHolderDraft())
  } else if (kind === MODAL.EDIT_MEMBERSHIP) {
    Object.assign(membershipDraft, initialMembershipDraft())
  } else if (kind === MODAL.OWN_PASSWORD) {
    Object.assign(ownPasswordDraft, initialPasswordDraft())
  } else if (kind === MODAL.OTHER_PASSWORD) {
    Object.assign(otherPasswordDraft, initialPasswordDraft())
  }

  if (isFormCatalogModal(kind)) {
    void loadFormCatalogs(kind)
  }
}

function cancelFormCatalogLoad(kind: FormCatalogModalKind): void {
  const operation = `catalogs:${kind}`
  const controller = requestControllers.get(operation)
  if (!controller) return
  requestControllers.delete(operation)
  controller.abort()
}

function closeModal(): void {
  const closingModal = modal.value
  if (closingModal === MODAL.CREATE_USER) {
    cancelFormCatalogLoad(closingModal)
    initialAssignableUnits.value = []
    initialUnitsState.value = DATA_STATE.IDLE
  }
  modal.value = MODAL.NONE
  fieldErrors.value = {}
  mutationError.value = ''
  formNotice.value = ''
  clearSensitiveDrafts()
  Object.assign(userDraft, initialUserDraft())
  Object.assign(formalAssignmentDraft, initialAssignmentForCreate())
  Object.assign(temporaryDraft, initialTemporaryDraft())
  Object.assign(assignmentDraft, initialAssignmentDraft())
  Object.assign(positionDraft, initialPositionDraft())
  Object.assign(holderDraft, initialHolderDraft())
  Object.assign(membershipDraft, initialMembershipDraft())
  selectedAssignmentId.value = null
  selectedHolderId.value = null
  selectedMembershipId.value = null
  originalMembership.value = null
}

function openUserEdit(): void {
  const user = currentUser.value
  if (!user || !canOpen(MODAL.EDIT_USER)) return
  Object.assign(userDraft, {
    ...initialUserDraft(),
    rut: user.rut,
    grado: user.grado ?? '',
    nombre: user.nombre,
    apellido_paterno: user.apellido_paterno,
    apellido_materno: user.apellido_materno,
    correo: user.correo ?? '',
  })
  openModal(MODAL.EDIT_USER)
}

function openPositionEdit(position?: PositionDTO): void {
  currentPosition.value = position ?? null
  openModal(MODAL.EDIT_POSITION)
}

async function openMembershipEdit(membership?: UnitMembershipDTO): Promise<void> {
  if (!canOpen(MODAL.EDIT_MEMBERSHIP)) return
  originalMembership.value = null
  if (!membership) {
    selectedMembershipId.value = null
    openModal(MODAL.EDIT_MEMBERSHIP)
    return
  }
  selectedMembershipId.value = membership.id
  Object.assign(membershipDraft, {
    id: membership.id,
    account: String(membership.account),
    unit: String(membership.unit),
    is_primary: membership.is_primary,
    is_active: membership.is_active,
    starts_at: membership.starts_at ?? '',
    ends_at: membership.ends_at ?? '',
    method: WRITE_METHOD.PUT,
  })
  modal.value = MODAL.EDIT_MEMBERSHIP
  await loadFormCatalogs(MODAL.EDIT_MEMBERSHIP)
  if (modal.value !== MODAL.EDIT_MEMBERSHIP
    || selectedMembershipId.value !== membership.id
    || !sessionEligible.value
    || resourceKey.value !== VIEW_KIND.MEMBERSHIPS) return
  const ticket = beginTicket(`membership:detail:${membership.id}`, PERMISSION.POSITION_READ)
  if (!ticket) return
  const apiConnection = connection(ticket.controller.signal)
  if (!apiConnection) return
  try {
    const response = await getMembership(membership.id, apiConnection)
    if (!ticketIsCurrent(ticket)
      || modal.value !== MODAL.EDIT_MEMBERSHIP
      || selectedMembershipId.value !== membership.id) return
    originalMembership.value = response
    Object.assign(membershipDraft, {
      id: response.id,
      account: String(response.account),
      unit: String(response.unit),
      is_primary: response.is_primary,
      is_active: response.is_active,
      starts_at: response.starts_at ?? '',
      ends_at: response.ends_at ?? '',
    })
  } catch (error: unknown) {
    if (ticketIsCurrent(ticket)
      && modal.value === MODAL.EDIT_MEMBERSHIP
      && selectedMembershipId.value === membership.id) {
      const message = errorText(error)
      closeModal()
      mutationError.value = message
    }
  } finally {
    if (ticketIsCurrent(ticket)) endTicket(ticket)
  }
}

async function reconcileSessionAfterMembership(ticket: Ticket): Promise<boolean> {
  if (!ticketIsCurrent(ticket)) return false
  return refreshSessionContext({
    principalId: ticket.principalId,
    tenantCode: ticket.tenantCode,
    resource: ticket.resource,
  })
}

async function refreshSessionContext(expected: {
  principalId: number
  tenantCode: string
  resource: string
}): Promise<boolean> {
  if (contextRefreshInProgress || !componentIsMounted) return false

  invalidateThenAbort()
  const generation = privateDataGeneration
  reconciliationPending.value = true
  contextRefreshInProgress = true

  let result: Awaited<ReturnType<typeof session.ensureContext>>
  try {
    result = await session.ensureContext()
  } catch (error: unknown) {
    if (componentIsMounted && generation === privateDataGeneration && resourceKey.value === expected.resource) {
      mutationError.value = errorText(error)
    }
    return false
  } finally {
    contextRefreshInProgress = false
  }

  if (!componentIsMounted || generation !== privateDataGeneration || resourceKey.value !== expected.resource) {
    return false
  }
  if (result.kind !== 'success') {
    mutationError.value = result.kind === 'rejected' || result.kind === 'uncertain'
      ? result.error.detail ?? 'El contexto no se pudo reconciliar; las acciones permanecen bloqueadas.'
      : 'La sesión bloqueó la reconciliación del contexto.'
    return false
  }
  if (!sessionEligible.value
    || session.identity?.id_usuario !== expected.principalId
    || session.tenantCode.trim() !== expected.tenantCode) {
    mutationError.value = 'La reconciliación no conservó el principal y tenant capturados; las acciones permanecen bloqueadas.'
    return false
  }

  reconciliationPending.value = false
  return true
}

function addMutation(operation: string): void {
  mutationOperations.value = new Set(mutationOperations.value).add(operation)
}

function removeMutation(operation: string): void {
  const next = new Set(mutationOperations.value)
  next.delete(operation)
  mutationOperations.value = next
}

function mutationTicket(operation: string, permission?: string): Ticket | null {
  if (formsBlocked.value) {
    mutationError.value = reconciliationPending.value
      ? 'Reconciliando el contexto; no se admite otra operación.'
      : isBlockedByUncertainMutation.value
        ? 'La mutación anterior requiere lectura explícita antes de continuar.'
        : 'La operación no está disponible en el estado actual.'
    return null
  }
  return beginTicket(operation, permission)
}

function apiConnectionFor(ticket: Ticket): ApiConnection | null {
  if (!ticketIsCurrent(ticket)) return null
  return {
    tenantCode: ticket.tenantCode,
    unitCode: ticket.unitCode,
    signal: ticket.controller.signal,
  }
}

function trackMutation(ticket: Ticket): void {
  addMutation(ticket.operation)
  activeMutationTicket.value = ticket
  modalBusy.value = true
  mutationError.value = ''
  formNotice.value = ''
  mutationFeedback.value = ''
  fieldErrors.value = {}
}

function markMutationRequestSettled(ticket: Ticket): void {
  if (activeMutationTicket.value === ticket) activeMutationTicket.value = null
}

function handleMutationFailure(ticket: Ticket, error: unknown, keepModalOn400 = true): void {
  if (!ticketIsCurrent(ticket)) return
  const status = errorStatus(error)
  mutationError.value = errorText(error)
  fieldErrors.value = fieldErrorMessages(error)
  if (Object.keys(fieldErrors.value).length > 0) focusFirstFieldError()
  if (status === 403) {
    modal.value = MODAL.NONE
    clearSensitiveDrafts()
  } else if (isConfirmedClientRejection(error)) {
    if (status === 400 && keepModalOn400) return
    if (modal.value === MODAL.OWN_PASSWORD || modal.value === MODAL.OTHER_PASSWORD) clearSensitiveDrafts()
    if (status !== 400) modal.value = MODAL.NONE
  } else {
    currentMutationUncertain(ticket.resource, ticket.operation)
  }
}

async function refreshUserResource(ticket: Ticket, reconcileContext = false): Promise<boolean> {
  if (!ticketIsCurrent(ticket)) return false
  if (reconcileContext) {
    if (await reconcileSessionAfterMembership(ticket)) await loadRouteData()
    return false
  }
  if (viewKind.value === VIEW_KIND.USER_DETAIL) {
    await Promise.all([readUserDetail(), readLockStatus()])
    if (!ticketIsCurrent(ticket)) return false
    if (hasPositionRead.value) await readMemberships()
  } else if (viewKind.value === VIEW_KIND.USERS) {
    await readUsers()
  }
  return ticketIsCurrent(ticket)
}

async function refreshPositionResource(ticket: Ticket, reconcileContext = false): Promise<void> {
  if (!ticketIsCurrent(ticket)) return
  if (reconcileContext) {
    if (await reconcileSessionAfterMembership(ticket)) await loadRouteData()
    return
  }
  if (viewKind.value === VIEW_KIND.POSITION_DETAIL) await readPositionDetail()
  else if (viewKind.value === VIEW_KIND.POSITIONS) await readPositions()
}

function mutationAffectsSession(kind: ModalKind): boolean {
  if (kind === MODAL.PRIMARY_ASSIGNMENT || kind === MODAL.ADD_ASSIGNMENT
    || kind === MODAL.DEACTIVATE_PRIMARY || kind === MODAL.REMOVE_ASSIGNMENT) {
    return userId.value === session.identity?.id_usuario
  }
  const principalRut = session.context?.user.rut
  const holderMayBePrincipal = (holder: PositionHolderDTO): boolean => {
    return !principalRut || holder.rut === principalRut
  }
  if (kind === MODAL.REMOVE_HOLDER) {
    const holder = holderHistory.value?.holders.find((item) => item.id === selectedHolderId.value)
    return !holder || holderMayBePrincipal(holder)
  }
  if (kind === MODAL.EDIT_POSITION && positionDraft.id === null) return false
  if (kind === MODAL.EDIT_POSITION || kind === MODAL.DELETE_POSITION || kind === MODAL.ASSIGN_HOLDER) {
    // Sin histórico completo no puedo descartar que el puesto sostenga acceso propio.
    const positionMayAffectPrincipal = !holderHistory.value
      || (historyState.value !== DATA_STATE.READY && historyState.value !== DATA_STATE.EMPTY)
      || holderHistory.value.position_code !== currentPosition.value?.code
      || holderHistory.value.holders.filter((holder) => holder.is_active).length !== currentPosition.value?.current_holders_count
      || holderHistory.value.holders.some((holder) => holder.is_active && holderMayBePrincipal(holder))
    if (kind !== MODAL.ASSIGN_HOLDER) return positionMayAffectPrincipal
    const account = parsePositiveSelection(holderDraft.account_id)
    const membership = memberships.value.find((item) => item.account === account)
    return (currentPosition.value?.is_unique_holder !== false && positionMayAffectPrincipal)
      || !membership || !principalRut || membership.rut === principalRut
  }
  return false
}

function scopeWriteValue(selection: string): { scope_code?: string | null } {
  if (selection === SCOPE_SELECTION.CLEAR) return { scope_code: null }
  if (selection === SCOPE_SELECTION.OMIT) return {}
  return { scope_code: selection }
}

function selectedPositionScope(): { scope_code_write?: string | null } {
  if (positionDraft.scope_code_write === SCOPE_SELECTION.CLEAR) return { scope_code_write: null }
  if (!positionDraft.scope_code_write) {
    return currentPosition.value ? { scope_code_write: currentPosition.value.scope_code } : {}
  }
  return { scope_code_write: positionDraft.scope_code_write }
}

function selectedPositionArmory(): { armory_code_write?: string | null } {
  if (positionDraft.armory_code_write === SCOPE_SELECTION.CLEAR) return { armory_code_write: null }
  if (!positionDraft.armory_code_write) {
    return currentPosition.value ? { armory_code_write: currentPosition.value.armory_code } : {}
  }
  return { armory_code_write: positionDraft.armory_code_write }
}

function selectedPositionRecinto(): { recinto_code_write?: string | null } {
  if (positionDraft.recinto_code_write === SCOPE_SELECTION.CLEAR) return { recinto_code_write: null }
  if (!positionDraft.recinto_code_write) {
    return currentPosition.value ? { recinto_code_write: currentPosition.value.recinto_code } : {}
  }
  return { recinto_code_write: positionDraft.recinto_code_write }
}

function buildPatchPositionBody(): PatchPositionRequest | null {
  const original = currentPosition.value
  if (!original || original.id !== positionDraft.id) return null

  const body: PatchPositionRequest = {}
  const code = positionDraft.code.trim()
  const name = positionDraft.name.trim()
  const armoryCode = selectedPositionArmory().armory_code_write
  const scopeCode = selectedPositionScope().scope_code_write
  const recintoCode = selectedPositionRecinto().recinto_code_write

  if (code !== original.code) body.code = code
  if (name !== original.name) body.name = name
  if (positionDraft.organization_unit_code_write !== original.organization_unit_code) {
    body.organization_unit_code_write = positionDraft.organization_unit_code_write
  }
  if (positionDraft.role_code_write !== original.role_code) body.role_code_write = positionDraft.role_code_write
  if (armoryCode !== undefined && armoryCode !== original.armory_code) body.armory_code_write = armoryCode
  if (scopeCode !== undefined && scopeCode !== original.scope_code) body.scope_code_write = scopeCode
  if (recintoCode !== undefined && recintoCode !== original.recinto_code) body.recinto_code_write = recintoCode
  if (positionDraft.description !== original.description) body.description = positionDraft.description
  if (positionDraft.is_active !== original.is_active) body.is_active = positionDraft.is_active
  if (positionDraft.is_unique_holder !== original.is_unique_holder) body.is_unique_holder = positionDraft.is_unique_holder
  return body
}

function buildPatchUserBody(user: IdentityUserDTO): PatchUserRequest {
  const body: PatchUserRequest = {}
  if (userDraft.rut !== user.rut) body.rut = userDraft.rut
  if ((userDraft.grado || null) !== user.grado) body.grado = userDraft.grado || null
  if (userDraft.nombre !== user.nombre) body.nombre = userDraft.nombre
  if (userDraft.apellido_paterno !== user.apellido_paterno) body.apellido_paterno = userDraft.apellido_paterno
  if (userDraft.apellido_materno !== user.apellido_materno) body.apellido_materno = userDraft.apellido_materno
  if ((userDraft.correo || null) !== user.correo) body.correo = userDraft.correo || null
  return body
}

function parsePositiveSelection(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}

function buildPatchMembershipBody(): PatchUnitMembershipRequest | null {
  const original = originalMembership.value
  if (!original || original.id !== membershipDraft.id) return null

  const body: PatchUnitMembershipRequest = {}
  const account = parsePositiveSelection(membershipDraft.account)
  const unit = parsePositiveSelection(membershipDraft.unit)
  const startsAt = membershipDraft.starts_at.trim() || null
  const endsAt = membershipDraft.ends_at.trim() || null

  if (account !== null && account !== original.account) body.account = account
  if (unit !== null && unit !== original.unit) body.unit = unit
  if (membershipDraft.is_primary !== original.is_primary) body.is_primary = membershipDraft.is_primary
  if (membershipDraft.is_active !== original.is_active) body.is_active = membershipDraft.is_active
  if (startsAt !== original.starts_at) body.starts_at = startsAt
  if (endsAt !== original.ends_at) body.ends_at = endsAt
  return body
}

function modalFormValid(kind: ActiveModalKind): boolean {
  formNotice.value = ''
  if (kind === MODAL.CREATE_USER) {
    const okRut = validateRut('rut', userDraft.rut)
    const okPaterno = validateRequired('apellido_paterno', userDraft.apellido_paterno)
    const okMaterno = validateRequired('apellido_materno', userDraft.apellido_materno)
    if (!okRut || !okPaterno || !okMaterno) {
      focusFirstFieldError()
      return false
    }
    if (!formalAssignmentDraft.unit_code || !formalAssignmentDraft.role_code) {
      if (!formalAssignmentDraft.unit_code) setFieldError('initial_unit_code', 'Selecciona la unidad inicial.')
      if (!formalAssignmentDraft.role_code) setFieldError('initial_role_code', 'Selecciona el rol inicial.')
      focusFirstFieldError()
      return false
    }
    if (initialUnitsState.value !== DATA_STATE.READY || catalogState.value !== DATA_STATE.READY) {
      formNotice.value = 'Espera a que terminen de cargar las unidades y los roles antes de guardar.'
      return false
    }
    if (!initialAssignableUnits.value.some((unit) => unit.code === formalAssignmentDraft.unit_code)) {
      setFieldError('initial_unit_code', 'Selecciona una unidad de la lista disponible.')
      focusFirstFieldError()
      return false
    }
    if (!roleOptions.value.some((role) => role.code === formalAssignmentDraft.role_code)) {
      setFieldError('initial_role_code', 'Selecciona un rol de la lista disponible.')
      focusFirstFieldError()
      return false
    }
    if (formalAssignmentDraft.scope_code
      && !scopeOptions.value.some((scope) => scope.code === formalAssignmentDraft.scope_code)) {
      setFieldError('initial_scope_code', 'Selecciona un alcance de la lista disponible.')
      focusFirstFieldError()
      return false
    }
  }
  if (kind === MODAL.CREATE_TEMPORARY && !validateRut('rut', temporaryDraft.rut)) {
    focusFirstFieldError()
    return false
  }
  if (kind === MODAL.EDIT_USER) {
    const okRut = validateRut('rut', userDraft.rut)
    const okPaterno = validateRequired('apellido_paterno', userDraft.apellido_paterno)
    const okMaterno = validateRequired('apellido_materno', userDraft.apellido_materno)
    if (!okRut || !okPaterno || !okMaterno) {
      focusFirstFieldError()
      return false
    }
  }
  if (kind === MODAL.PRIMARY_ASSIGNMENT || kind === MODAL.ADD_ASSIGNMENT) {
    if (!assignmentDraft.unit_code || !assignmentDraft.role_code) {
      if (!assignmentDraft.unit_code) setFieldError('unit_code', 'Selecciona la unidad.')
      if (!assignmentDraft.role_code) setFieldError('role_code', 'Selecciona el rol.')
      focusFirstFieldError()
      return false
    }
    if (eligibleUnitsState.value !== DATA_STATE.READY || catalogState.value !== DATA_STATE.READY) {
      formNotice.value = 'Espera a que terminen de cargar las unidades y los roles antes de guardar.'
      return false
    }
  }
  if (kind === MODAL.EDIT_POSITION) {
    const okCode = validateRequired('code', positionDraft.code)
    const okName = validateRequired('name', positionDraft.name)
    const okUnit = validateRequired('organization_unit_code_write', positionDraft.organization_unit_code_write)
    const okRole = validateRequired('role_code_write', positionDraft.role_code_write)
    if (!okCode || !okName || !okUnit || !okRole) {
      focusFirstFieldError()
      return false
    }
    if (positionDraft.id !== null && (!currentPosition.value || currentPosition.value.id !== positionDraft.id)) {
      formNotice.value = 'La ficha del puesto aún no está disponible; espera la lectura.'
      return false
    }
    if (positionDraft.id !== null && positionDraft.method === WRITE_METHOD.PATCH) {
      const patchBody = buildPatchPositionBody()
      if (!patchBody || Object.keys(patchBody).length === 0) {
        formNotice.value = 'No hay cambios que enviar en este puesto.'
        return false
      }
    }
  }
  if (kind === MODAL.ASSIGN_HOLDER && !parsePositiveSelection(holderDraft.account_id)) {
    setFieldError('account_id', 'Selecciona una cuenta de la lista.')
    focusFirstFieldError()
    return false
  }
  if (kind === MODAL.EDIT_MEMBERSHIP) {
    if (!parsePositiveSelection(membershipDraft.account) || !parsePositiveSelection(membershipDraft.unit)) {
      if (!parsePositiveSelection(membershipDraft.account)) setFieldError('account', 'Selecciona la cuenta.')
      if (!parsePositiveSelection(membershipDraft.unit)) setFieldError('unit', 'Selecciona la unidad.')
      focusFirstFieldError()
      return false
    }
    if (catalogState.value !== DATA_STATE.READY) {
      formNotice.value = 'Espera a que terminen de cargar los catálogos antes de guardar.'
      return false
    }
    if (membershipDraft.id !== null
      && (!originalMembership.value || originalMembership.value.id !== membershipDraft.id)) {
      formNotice.value = 'La ficha de la membresía aún no está disponible; espera la lectura.'
      return false
    }
    if (membershipDraft.id !== null && membershipDraft.method === WRITE_METHOD.PATCH) {
      const patchBody = buildPatchMembershipBody()
      if (patchBody && Object.keys(patchBody).length === 0) {
        formNotice.value = 'No hay cambios que enviar en esta membresía.'
        return false
      }
    }
  }
  if (kind === MODAL.OWN_PASSWORD || kind === MODAL.OTHER_PASSWORD) {
    const draft = kind === MODAL.OWN_PASSWORD ? ownPasswordDraft : otherPasswordDraft
    if (!draft.new_password) {
      formNotice.value = 'Escribe la nueva contraseña.'
      return false
    }
    if (draft.new_password !== draft.confirm_password) {
      formNotice.value = 'La confirmación no coincide con la nueva contraseña.'
      return false
    }
    if (kind === MODAL.OWN_PASSWORD && !draft.old_password) {
      formNotice.value = 'Escribe tu contraseña actual para confirmar el cambio.'
      return false
    }
  }
  return true
}

async function submitModal(): Promise<void> {
  const currentModal = modal.value
  if (currentModal === MODAL.NONE || !modalFormValid(currentModal)) return
  const permission = currentModal === MODAL.CREATE_USER || currentModal === MODAL.CREATE_TEMPORARY
    ? PERMISSION.USER_CREATE
    : currentModal === MODAL.DELETE_USER
      ? PERMISSION.USER_DELETE
      : currentModal === MODAL.EDIT_POSITION || currentModal === MODAL.DELETE_POSITION
        || currentModal === MODAL.ASSIGN_HOLDER || currentModal === MODAL.REMOVE_HOLDER
        || currentModal === MODAL.EDIT_MEMBERSHIP || currentModal === MODAL.DELETE_MEMBERSHIP
        ? currentModal === MODAL.DELETE_POSITION || currentModal === MODAL.DELETE_MEMBERSHIP
          ? PERMISSION.POSITION_DELETE
          : PERMISSION.POSITION_UPDATE
        : currentModal === MODAL.OWN_PASSWORD
          ? undefined
          : PERMISSION.USER_UPDATE

  const operation = `mutation:${currentModal}:${resourceKey.value}`
  const ticket = mutationTicket(operation, permission)
  if (!ticket) return
  const apiConnection = apiConnectionFor(ticket)
  if (!apiConnection) return
  const affectsSession = mutationAffectsSession(currentModal)
  trackMutation(ticket)

  try {
    if (currentModal === MODAL.CREATE_USER) {
      const body: CreateUserRequest = {
        rut: userDraft.rut.trim(),
        grado: userDraft.grado.trim() || null,
        ...(userDraft.nombre.trim() ? { nombre: userDraft.nombre.trim() } : {}),
        apellido_paterno: userDraft.apellido_paterno.trim(),
        apellido_materno: userDraft.apellido_materno.trim(),
        correo: userDraft.correo.trim() || null,
        initial_unit_code: formalAssignmentDraft.unit_code,
        initial_role_code: formalAssignmentDraft.role_code,
        ...(formalAssignmentDraft.scope_code
          ? { initial_scope_code: formalAssignmentDraft.scope_code }
          : {}),
      }
      const response = await createUser(body, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      const returnedPrimary = response.primary_assignment
      const primarySummary = returnedPrimary
        ? `${returnedPrimary.unit_code ?? '—'} · ${returnedPrimary.role_code ?? '—'}`
        : 'no informada por el servidor'
      mutationFeedback.value = `Alta registrada. ${response.rut} — ${response.nombre} ${response.apellido_paterno} ${response.apellido_materno}. Asignación principal: ${primarySummary}.`
      if (viewKind.value === VIEW_KIND.USERS) {
        await refreshUserResource(ticket)
      }
    } else if (currentModal === MODAL.CREATE_TEMPORARY) {
      const body: TemporaryPersonCreateRequest = {
        rut: temporaryDraft.rut.trim(),
        ...(temporaryDraft.grado.trim() ? { grado: temporaryDraft.grado.trim() } : {}),
        ...(temporaryDraft.nombre.trim() ? { nombre: temporaryDraft.nombre.trim() } : {}),
        ...(temporaryDraft.apellido_paterno.trim() ? { apellido_paterno: temporaryDraft.apellido_paterno.trim() } : {}),
        ...(temporaryDraft.apellido_materno.trim() ? { apellido_materno: temporaryDraft.apellido_materno.trim() } : {}),
        ...(temporaryDraft.organization_unit_code ? { organization_unit_code: temporaryDraft.organization_unit_code } : {}),
      }
      const response = await createTemporaryPerson(body, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      mutationFeedback.value = `Persona temporal registrada. ${response.rut} — ${response.nombre} ${response.apellido_paterno} ${response.apellido_materno}. No inicia sesión.`
      if (viewKind.value === VIEW_KIND.USERS) await refreshUserResource(ticket)
    } else if (currentModal === MODAL.EDIT_USER) {
      if (!currentUser.value) throw new Error('No hay ficha de usuario cargada para editar.')
      const id = currentUser.value.id_usuario
      const response = userDraft.method === WRITE_METHOD.PUT
        ? await replaceUser(id, {
          rut: userDraft.rut.trim(),
          grado: userDraft.grado.trim() || null,
          nombre: userDraft.nombre,
          apellido_paterno: userDraft.apellido_paterno.trim(),
          apellido_materno: userDraft.apellido_materno.trim(),
          correo: userDraft.correo.trim() || null,
        } satisfies ReplaceUserRequest, apiConnection)
        : await patchUser(id, buildPatchUserBody(currentUser.value), apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      mutationFeedback.value = `Cambios guardados. ${response.rut} — ${response.nombre} ${response.apellido_paterno} ${response.apellido_materno}`
      await refreshUserResource(ticket)
    } else if (currentModal === MODAL.PRIMARY_ASSIGNMENT || currentModal === MODAL.ADD_ASSIGNMENT) {
      if (userId.value === null) throw new Error('El parámetro idUsuario no es válido.')
      const body: PrimaryAssignmentRequest = {
        unit_code: assignmentDraft.unit_code,
        role_code: assignmentDraft.role_code,
        ...scopeWriteValue(assignmentDraft.scopeSelection),
      }
      if (currentModal === MODAL.PRIMARY_ASSIGNMENT) {
        const response = assignmentDraft.method === WRITE_METHOD.PUT
          ? await replacePrimaryAssignment(userId.value, body, apiConnection)
          : await patchPrimaryAssignment(userId.value, {
            unit_code: body.unit_code,
            role_code: body.role_code,
            ...(Object.prototype.hasOwnProperty.call(body, 'scope_code') ? { scope_code: body.scope_code } : {}),
          }, apiConnection)
        markMutationRequestSettled(ticket)
        if (!ticketIsCurrent(ticket)) return
        closeModal()
        mutationFeedback.value = `Asignación principal actualizada. ${response.detail}`
      } else {
        const response = await addSecondaryAssignment(userId.value, body, apiConnection)
        markMutationRequestSettled(ticket)
        if (!ticketIsCurrent(ticket)) return
        closeModal()
        mutationFeedback.value = `Asignación secundaria agregada. ${response.detail}`
      }
      if (await refreshUserResource(ticket, affectsSession)) await readPositions()
    } else if (currentModal === MODAL.DEACTIVATE_PRIMARY) {
      if (userId.value === null) throw new Error('El parámetro idUsuario no es válido.')
      const response = await deactivatePrimaryAssignment(userId.value, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      mutationFeedback.value = `Asignación principal desactivada. ${response.detail}`
      if (await refreshUserResource(ticket, affectsSession)) await readPositions()
    } else if (currentModal === MODAL.REMOVE_ASSIGNMENT) {
      if (userId.value === null || selectedAssignmentId.value === null) throw new Error('No hay una asignación seleccionada.')
      const response = await removeUserAssignment(userId.value, selectedAssignmentId.value, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      mutationFeedback.value = `Asignación retirada. ${response.detail}`
      if (await refreshUserResource(ticket, affectsSession)) await readPositions()
    } else if (currentModal === MODAL.DELETE_USER) {
      if (userId.value === null) throw new Error('El parámetro idUsuario no es válido.')
      await deleteUser(userId.value, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      mutationFeedback.value = 'Baja solicitada. La ficha se retirará conforme a la respuesta del servidor.'
      await readUsers()
      if (ticketIsCurrent(ticket)) await router.push('/personas')
    } else if (currentModal === MODAL.EDIT_POSITION) {
      const isCreate = positionDraft.id === null
      const body = {
        code: positionDraft.code.trim(),
        name: positionDraft.name.trim(),
        organization_unit_code_write: positionDraft.organization_unit_code_write,
        role_code_write: positionDraft.role_code_write,
        ...selectedPositionArmory(),
        ...selectedPositionScope(),
        ...selectedPositionRecinto(),
        description: positionDraft.description,
        is_active: positionDraft.is_active,
        is_unique_holder: positionDraft.is_unique_holder,
      }
      let response: PositionDTO
      if (positionDraft.id === null) {
        response = await createPosition(body satisfies CreatePositionRequest, apiConnection)
      } else if (positionDraft.method === WRITE_METHOD.PUT) {
        const replaceBody: ReplacePositionRequest = {
          code: body.code,
          name: body.name,
          organization_unit_code_write: body.organization_unit_code_write,
          role_code_write: body.role_code_write,
          armory_code_write: body.armory_code_write ?? null,
          scope_code_write: body.scope_code_write ?? null,
          recinto_code_write: body.recinto_code_write ?? null,
          description: body.description,
          is_active: body.is_active,
          is_unique_holder: body.is_unique_holder,
        }
        response = await replacePosition(positionDraft.id, replaceBody, apiConnection)
      } else {
        const patchBody = buildPatchPositionBody()
        if (!patchBody || Object.keys(patchBody).length === 0) {
          throw new Error('El PATCH requiere el detalle y al menos un campo modificado.')
        }
        response = await patchPosition(positionDraft.id, patchBody, apiConnection)
      }
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      currentPosition.value = response
      mutationFeedback.value = `${isCreate ? 'Puesto creado' : 'Puesto actualizado'}. ${response.code} — ${response.name}`
      await refreshPositionResource(ticket, affectsSession)
    } else if (currentModal === MODAL.DELETE_POSITION) {
      const id = currentPosition.value?.id ?? positionId.value
      if (id === null) throw new Error('No hay un puesto seleccionado.')
      await deletePosition(id, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      mutationFeedback.value = 'Puesto dado de baja.'
      if (affectsSession) {
        if (await reconcileSessionAfterMembership(ticket)) {
          await router.push('/organizacion/puestos')
          await loadRouteData()
        }
        return
      }
      await readPositions()
      if (ticketIsCurrent(ticket) && viewKind.value === VIEW_KIND.POSITION_DETAIL) await router.push('/organizacion/puestos')
    } else if (currentModal === MODAL.ASSIGN_HOLDER) {
      if (positionId.value === null) throw new Error('La dirección del puesto no incluye un identificador válido.')
      const accountId = parsePositiveSelection(holderDraft.account_id)
      if (accountId === null) throw new Error('No hay una cuenta seleccionada.')
      const body: AssignPositionHolderRequest = {
        account_id: accountId,
        is_primary: holderDraft.is_primary,
        ...(holderDraft.starts_at.trim() ? { starts_at: holderDraft.starts_at.trim() } : {}),
      }
      const response = await assignPositionHolder(positionId.value, body, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      mutationFeedback.value = 'detail' in response
        ? `Asignación de titular registrada. ${response.detail}`
        : `Titular asignado. ${response.rut} — ${response.nombre}`
      await refreshPositionResource(ticket, affectsSession)
    } else if (currentModal === MODAL.REMOVE_HOLDER) {
      if (positionId.value === null || selectedHolderId.value === null) throw new Error('No hay un titular seleccionado.')
      const response = await removePositionHolder(positionId.value, selectedHolderId.value, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      mutationFeedback.value = `Titular retirado. ${response.detail}`
      await refreshPositionResource(ticket, affectsSession)
    } else if (currentModal === MODAL.EDIT_MEMBERSHIP) {
      const account = parsePositiveSelection(membershipDraft.account)
      const unit = parsePositiveSelection(membershipDraft.unit)
      if (account === null || unit === null) throw new Error('Faltan la cuenta o la unidad de la membresía.')
      const isCreate = membershipDraft.id === null
      if (membershipDraft.id === null) {
        const body: CreateUnitMembershipRequest = {
          account,
          unit,
          is_primary: membershipDraft.is_primary,
          is_active: membershipDraft.is_active,
          starts_at: membershipDraft.starts_at.trim() || null,
          ends_at: membershipDraft.ends_at.trim() || null,
        }
        await createMembership(body, apiConnection)
      } else if (membershipDraft.method === WRITE_METHOD.PUT) {
        const body: ReplaceUnitMembershipRequest = {
          account,
          unit,
          is_primary: membershipDraft.is_primary,
          is_active: membershipDraft.is_active,
          starts_at: membershipDraft.starts_at.trim() || null,
          ends_at: membershipDraft.ends_at.trim() || null,
        }
        await replaceMembership(membershipDraft.id, body, apiConnection)
      } else {
        const body = buildPatchMembershipBody()
        if (!body || Object.keys(body).length === 0) {
          throw new Error('El PATCH requiere el detalle y al menos un campo modificado.')
        }
        await patchMembership(membershipDraft.id, body, apiConnection)
      }
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      if (!await reconcileSessionAfterMembership(ticket)) return
      mutationFeedback.value = `Membresía ${isCreate ? 'creada' : 'actualizada'}; el contexto se reconcilió.`
      await readMemberships()
    } else if (currentModal === MODAL.DELETE_MEMBERSHIP) {
      if (selectedMembershipId.value === null) throw new Error('No hay una membresía seleccionada.')
      await deleteMembership(selectedMembershipId.value, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      if (!await reconcileSessionAfterMembership(ticket)) return
      mutationFeedback.value = 'Membresía dada de baja; el contexto se reconcilió.'
      await readMemberships()
    } else if (currentModal === MODAL.OWN_PASSWORD) {
      if (!isVoluntaryOwnPasswordAvailable.value || !session.identity) throw new Error('La acción propia no está disponible ahora.')
      const response = await changeOwnPassword(session.identity.id_usuario, {
        old_password: ownPasswordDraft.old_password,
        new_password: ownPasswordDraft.new_password,
      }, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      mutationFeedback.value = `Contraseña actualizada. ${response.detail}`
      closeModal()
    } else if (currentModal === MODAL.OTHER_PASSWORD) {
      if (userId.value === null || isOwnUserRoute.value) throw new Error('Esta acción no se aplica a tu propia cuenta.')
      const response = await changeOtherUserPassword(userId.value, {
        new_password: otherPasswordDraft.new_password,
      }, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      mutationFeedback.value = `Contraseña actualizada. ${response.detail}`
      closeModal()
      await refreshUserResource(ticket)
    } else if (currentModal === MODAL.RESET_PASSWORD) {
      if (userId.value === null || isOwnUserRoute.value) throw new Error('No puedes restablecer tu propia contraseña desde aquí.')
      const response = await resetUserPassword(userId.value, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      mutationFeedback.value = `Contraseña restablecida. ${response.detail}`
      await refreshUserResource(ticket)
    } else if (currentModal === MODAL.UNLOCK_USER) {
      if (userId.value === null) throw new Error('La dirección de la ficha no incluye un identificador de usuario válido.')
      const response = await unlockUser(userId.value, apiConnection)
      markMutationRequestSettled(ticket)
      if (!ticketIsCurrent(ticket)) return
      closeModal()
      mutationFeedback.value = `Cuenta desbloqueada. ${response.detail}`
      await Promise.all([readLockStatus(), readUserDetail()])
    }
  } catch (error: unknown) {
    handleMutationFailure(ticket, error)
  } finally {
    if (ticketIsCurrent(ticket)) {
      modalBusy.value = false
      removeMutation(ticket.operation)
      if (activeMutationTicket.value === ticket) activeMutationTicket.value = null
      endTicket(ticket)
    }
  }
}

async function reconcileExplicitly(): Promise<void> {
  if (!session.identity || !session.tenantCode.trim() || contextRefreshInProgress) return
  const refreshed = await refreshSessionContext({
    principalId: session.identity.id_usuario,
    tenantCode: session.tenantCode.trim(),
    resource: resourceKey.value,
  })
  if (refreshed) await loadRouteData()
}

function openDeleteUser(): void {
  openModal(MODAL.DELETE_USER)
}

function openDeletePosition(position?: PositionDTO): void {
  if (position) currentPosition.value = position
  openModal(MODAL.DELETE_POSITION)
}

function openDeactivatePrimary(): void {
  openModal(MODAL.DEACTIVATE_PRIMARY)
}

function openRemoveAssignment(assignment: UserAssignmentDTO): void {
  selectedAssignmentId.value = assignment.id
  openModal(MODAL.REMOVE_ASSIGNMENT)
}

function openRemoveHolder(holder: PositionHolderDTO): void {
  selectedHolderId.value = holder.id
  openModal(MODAL.REMOVE_HOLDER)
}

function openDeleteMembership(membership: UnitMembershipDTO): void {
  selectedMembershipId.value = membership.id
  openModal(MODAL.DELETE_MEMBERSHIP)
}

function fieldMessage(field: string): string {
  return fieldErrors.value[field] ?? ''
}

const FIELD_ELEMENT_IDS: Readonly<Record<string, string>> = {
  rut: 'identity-user-rut',
  apellido_paterno: 'identity-user-apellido-paterno',
  apellido_materno: 'identity-user-apellido-materno',
  grado: 'identity-user-grado',
  nombre: 'identity-user-nombre',
  correo: 'identity-user-correo',
  initial_unit_code: 'identity-user-unit-code',
  initial_role_code: 'identity-user-role-code',
  initial_scope_code: 'identity-user-scope-code',
  account: 'identity-membership-account',
  unit: 'identity-membership-unit',
  account_id: 'identity-holder-account-id',
  unit_code: 'identity-assignment-unit-code',
  role_code: 'identity-assignment-role-code',
  code: 'identity-position-code',
  name: 'identity-position-name',
  organization_unit_code_write: 'identity-position-organization-unit-code-write',
  role_code_write: 'identity-position-role-code-write',
  holder_starts_at: 'identity-holder-starts-at',
  membership_starts_at: 'identity-membership-starts-at',
  membership_ends_at: 'identity-membership-ends-at',
}

function feedbackId(field: string): string {
  return `identity-feedback-${field}`
}

function setFieldError(field: string, message: string): void {
  const next = { ...fieldErrors.value }
  if (message) next[field] = message
  else delete next[field]
  fieldErrors.value = next
}

// Foco al primer campo inválido: se difiere al render que monta el feedback con su id.
function focusFirstFieldError(): void {
  void nextTick(() => {
    for (const field of Object.keys(fieldErrors.value)) {
      const id = FIELD_ELEMENT_IDS[field]
      if (!id) continue
      const element = document.getElementById(id)
      if (element instanceof HTMLElement) {
        element.focus()
        return
      }
    }
  })
}

function validateRequired(field: string, value: string): boolean {
  if (value.trim()) {
    setFieldError(field, '')
    return true
  }
  setFieldError(field, 'Este campo es obligatorio.')
  return false
}

function validateRut(field: string, value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    setFieldError(field, 'El RUT es obligatorio.')
    return false
  }
  if (!RUT_PATTERN.test(trimmed)) {
    setFieldError(field, 'Usa el formato 12345678-9, sin puntos ni espacios.')
    return false
  }
  setFieldError(field, '')
  return true
}

function validateDate(field: string, value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    setFieldError(field, '')
    return true
  }
  if (!isIsoDateOrDateTime(trimmed) || Number.isNaN(new Date(trimmed).getTime())) {
    setFieldError(field, 'Usa una fecha válida con el formato AAAA-MM-DD.')
    return false
  }
  setFieldError(field, '')
  return true
}

function sortDirection(key: string): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none'
  return sortAscending.value ? 'ascending' : 'descending'
}

function sortGlyph(key: string): string {
  if (sortKey.value !== key) return ''
  return sortAscending.value ? '▲' : '▼'
}

function countLabel(filtered: number, total: number, noun: string): string {
  return activeFilter.value.trim() ? `${filtered} de ${total} ${noun}` : `${total} ${noun}`
}

function clearSearch(): void {
  activeFilter.value = ''
}

function tabAriaLabel(base: string, hasError: boolean): string | undefined {
  return hasError ? `${base}, con error de lectura` : undefined
}

function scopeLabel(code: string | null): string {
  if (!code) return '—'
  return scopeOptions.value.find((scope) => scope.code === code)?.name ?? code
}

function roleLabel(code: string | null): string {
  if (!code) return '—'
  return roleOptions.value.find((role) => role.code === code)?.name ?? code
}

function openOwnPassword(): void {
  if (isVoluntaryOwnPasswordAvailable.value) openModal(MODAL.OWN_PASSWORD)
}

function routeTitle(): string {
  if (viewKind.value === VIEW_KIND.USERS) return 'Personas'
  if (viewKind.value === VIEW_KIND.USER_DETAIL) return fullUserName.value || `Usuario ${userId.value ?? '—'}`
  if (viewKind.value === VIEW_KIND.POSITIONS) return 'Puestos'
  if (viewKind.value === VIEW_KIND.POSITION_DETAIL) return currentPosition.value?.name || currentPosition.value?.code || `Puesto ${positionId.value ?? '—'}`
  if (viewKind.value === VIEW_KIND.MEMBERSHIPS) return 'Membresías'
  return 'Identidad'
}

function focusMessage(state: DataState, label: string): string {
  if (state === DATA_STATE.LOADING) return `Cargando ${label}…`
  if (state === DATA_STATE.EMPTY) return `No hay ${label} en tu alcance de datos.`
  if (state === DATA_STATE.DENIED) return 'Acceso denegado por el servidor o por el contexto actual.'
  if (state === DATA_STATE.ERROR) return 'La lectura falló; reintenta.'
  return ''
}

function userDetailLoad(): void {
  void Promise.all([readUserDetail(), readLockStatus()])
}

watch(
  () => resourceKey.value,
  () => {
    if (!componentIsMounted) return
    invalidateThenAbort()
    activeTab.value = viewKind.value === VIEW_KIND.POSITION_DETAIL ? TAB.POSITION_HOLDERS : TAB.USER_IDENTITY
    if (sessionEligible.value) void loadRouteData()
    else {
      mainState.value = DATA_STATE.DENIED
      viewError.value = 'La vista espera una sesión con contexto elegible. Usa la acción de lectura explícita después de restablecer el contexto.'
    }
  },
  { flush: 'sync' },
)

watch(
  () => [
    session.status,
    session.context,
    session.identity?.id_usuario,
    session.tenantCode,
    session.unitCode,
    session.generation,
    permissionSetKey.value,
  ] as const,
  () => {
    if (!componentIsMounted || contextRefreshInProgress) return
    invalidateThenAbort()
    if (!sessionEligible.value) {
      mainState.value = DATA_STATE.DENIED
      viewError.value = 'La sesión o el contexto dejó de ser elegible; los datos privados se purgaron.'
    } else {
      mainState.value = DATA_STATE.IDLE
      viewError.value = 'El principal o contexto cambió. Pulsa Cargar para volver a leer con la nueva autorización.'
    }
  },
  { flush: 'sync' },
)

onMounted(() => {
  componentIsMounted = true
  if (sessionEligible.value) void loadRouteData()
  else {
    mainState.value = DATA_STATE.DENIED
    viewError.value = 'Se requiere una sesión con tenant y unidad activos.'
  }
})

onBeforeUnmount(() => {
  componentIsMounted = false
  invalidateThenAbort()
})
</script>

<template>
  <div class="identity-view page-content" tabindex="-1">
    <header class="identity-page-title page-title-box">
      <div>
        <h1 id="identity-title" class="mb-0">{{ routeTitle() }}</h1>
        <nav class="breadcrumb mb-0" aria-label="Ruta de navegación">
          <RouterLink to="/">Inicio</RouterLink>
          <span aria-hidden="true">›</span>
          <template v-if="viewKind === VIEW_KIND.USER_DETAIL">
            <RouterLink to="/personas">Personas</RouterLink>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{{ routeTitle() }}</span>
          </template>
          <template v-else-if="viewKind === VIEW_KIND.POSITION_DETAIL">
            <RouterLink to="/organizacion/puestos">Organización › Puestos</RouterLink>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{{ routeTitle() }}</span>
          </template>
          <span v-else-if="viewKind === VIEW_KIND.USERS" aria-current="page">Personas</span>
          <span v-else-if="viewKind === VIEW_KIND.POSITIONS" aria-current="page">Organización › Puestos</span>
          <span v-else-if="viewKind === VIEW_KIND.MEMBERSHIPS" aria-current="page">Organización › Membresías</span>
          <span v-else aria-current="page">Identidad</span>
        </nav>
      </div>
      <div class="identity-page-actions">
        <RouterLink v-if="viewKind === VIEW_KIND.USER_DETAIL" class="btn btn-secondary" to="/personas">Volver a personas</RouterLink>
        <RouterLink v-if="viewKind === VIEW_KIND.POSITION_DETAIL" class="btn btn-secondary" to="/organizacion/puestos">Volver a puestos</RouterLink>
        <button
          v-if="viewKind !== VIEW_KIND.UNSUPPORTED"
          type="button"
          class="btn btn-outline-primary"
          :disabled="!sessionEligible || activeMutations"
          @click="loadRouteData"
        >
          Reconciliar lectura
        </button>
      </div>
    </header>

    <div v-if="reconciliationPending" class="alert alert-warning" role="status">
      El cambio de membresía exige reconciliar el contexto antes de habilitar nuevas operaciones.
      <button class="btn btn-outline-primary btn-sm" type="button" :disabled="activeMutations || !session.identity || !session.tenantCode.trim()" @click="reconcileExplicitly">
        Reconciliar contexto
      </button>
    </div>
    <div v-else-if="isBlockedByUncertainMutation" class="alert alert-danger" role="alert">
      {{ mutationError }}
    </div>
    <div v-else-if="mutationError && modal === MODAL.NONE" class="alert alert-danger" role="alert">
      {{ mutationError }}
    </div>
    <div v-if="mutationFeedback" class="alert alert-success" role="status">
      {{ mutationFeedback }}
      <button class="btn btn-outline-primary btn-sm" type="button" @click="mutationFeedback = ''">Cerrar</button>
    </div>

    <section v-if="viewKind === VIEW_KIND.USERS" class="card identity-list-card identity-list-card--users">
      <header class="card-header">
        <h2 class="card-title">Usuarios</h2>
        <p class="card-subtitle">Identidad y estado de la cuenta; las asignaciones se muestran en la ficha de cada usuario.</p>
      </header>
      <div class="card-body">
        <div class="identity-page-actions">
          <button v-if="hasUserCreate" class="btn btn-primary" type="button" :disabled="formsBlocked" @click="openModal(MODAL.CREATE_USER)">Alta formal</button>
          <button v-if="hasUserCreate" class="btn btn-secondary" type="button" :disabled="formsBlocked" @click="openModal(MODAL.CREATE_TEMPORARY)">Alta temporal</button>
        </div>
        <div v-if="!sessionEligible" class="alert alert-warning" role="status">Elige una institución y una unidad activas para leer el listado.</div>
        <div v-else-if="!hasUserRead" class="alert alert-danger" role="alert">Tu sesión no tiene permiso para ver el listado de personas. Pide a un administrador que te asigne el permiso de lectura de personal.</div>
        <template v-else>
          <div v-if="mainState === DATA_STATE.LOADING" class="identity-state" role="status">
            <span class="spinner-border" aria-hidden="true"></span><span>{{ focusMessage(mainState, 'usuarios') }}</span>
          </div>
          <div v-else-if="mainState === DATA_STATE.ERROR || mainState === DATA_STATE.DENIED" class="alert alert-danger" role="alert">
            {{ viewError }}
            <button class="btn btn-outline-primary btn-sm" type="button" :disabled="activeMutations" @click="readUsers">Reintentar lectura</button>
          </div>
          <div v-else-if="mainState === DATA_STATE.EMPTY" class="alert alert-info" role="status">No hay personas registradas en tu alcance de datos.</div>
          <template v-else-if="mainState === DATA_STATE.READY">
            <div class="identity-toolbar">
              <label class="identity-search-field">
                <span class="form-label">Buscar</span>
                <input v-model="activeFilter" class="form-control" type="search" aria-label="Buscar usuarios" placeholder="RUT o nombre" />
              </label>
              <span class="identity-count">{{ countLabel(filteredUsers.length, users.length, 'usuarios') }}</span>
            </div>
            <p class="identity-legend">Estado del usuario: cuenta habilitada o inhabilitada. Estado de la cuenta: bloqueada, con cambio de contraseña pendiente o disponible.</p>
            <div class="table-responsive">
              <table class="table table-centered">
                <caption class="identity-visually-hidden">Usuarios con su asignación principal y estado de cuenta</caption>
                <thead><tr>
                  <th scope="col" :aria-sort="sortDirection('rut')"><button class="identity-sort" type="button" @click="setSort('rut')">RUT <span aria-hidden="true">{{ sortGlyph('rut') }}</span></button></th>
                  <th scope="col" :aria-sort="sortDirection('name')"><button class="identity-sort" type="button" @click="setSort('name')">Identidad <span aria-hidden="true">{{ sortGlyph('name') }}</span></button></th>
                  <th scope="col">Asignación principal</th>
                  <th scope="col">Estado del usuario</th>
                  <th scope="col">Estado de la cuenta</th>
                </tr></thead>
                <tbody>
                  <tr v-for="item in filteredUsers" :key="item.id_usuario">
                    <td><RouterLink :to="`/personas/${item.id_usuario}`">{{ item.rut }}</RouterLink></td>
                    <td>{{ [item.grado, item.nombre, item.apellido_paterno, item.apellido_materno].filter(Boolean).join(' ') || '—' }}</td>
                    <td>{{ item.primary_assignment ? `${displayValue(item.primary_assignment.unit_code)} · ${roleLabel(item.primary_assignment.role_code)}` : '—' }}</td>
                    <td><span class="badge" :class="item.habilitado ? 'bg-success' : 'bg-secondary'">{{ item.habilitado ? 'Habilitado' : 'Inhabilitado' }}</span></td>
                    <td>
                      <span v-if="item.is_locked" class="badge bg-danger">Bloqueado</span>
                      <span v-else-if="item.must_change_password" class="badge bg-warning">Cambio requerido</span>
                      <span v-else class="badge bg-success">Disponible</span>
                    </td>
                  </tr>
                  <tr v-if="filteredUsers.length === 0">
                    <td colspan="5" class="identity-empty-cell">
                      Ninguna persona coincide con la búsqueda.
                      <button class="btn btn-outline-primary btn-sm" type="button" @click="clearSearch">Limpiar búsqueda</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <div v-else class="identity-state" role="status">Pulsa «Reconciliar lectura» para consultar el listado.</div>
        </template>
      </div>
    </section>

    <section v-else-if="viewKind === VIEW_KIND.USER_DETAIL" class="identity-detail-stack">
      <section v-if="isVoluntaryOwnPasswordAvailable" class="card">
        <header class="card-header">
          <h2 class="card-title">Tu cuenta</h2>
        </header>
        <div class="card-body">
          <p class="text-muted">Cambia tu propia contraseña. Esta acción solo afecta a tu cuenta y no requiere permisos administrativos.</p>
          <button class="btn btn-primary" type="button" :disabled="formsBlocked" @click="openOwnPassword">Cambiar mi contraseña</button>
        </div>
      </section>

      <section v-if="!sessionEligible" class="alert alert-warning" role="status">Elige una institución y una unidad activas para ver esta ficha.</section>
      <section v-else-if="!hasUserRead" class="alert alert-danger" role="alert">
        {{ userState === DATA_STATE.ERROR || userState === DATA_STATE.DENIED ? userError : 'Tu sesión no tiene permiso para ver la ficha de esta persona.' }}
        <button v-if="hasUserRead" type="button" class="btn btn-outline-primary btn-sm" @click="userDetailLoad">Reintentar lectura</button>
      </section>
      <section v-else class="card">
        <header class="card-header identity-card-heading">
          <div>
            <h2 class="card-title">{{ fullUserName || 'Ficha de usuario' }}</h2>
            <p class="card-subtitle">Usuario {{ displayValue(currentUser?.id_usuario) }} · RUT {{ displayValue(currentUser?.rut) }}</p>
          </div>
          <div class="identity-page-actions">
            <button v-if="hasUserUpdate" class="btn btn-primary" type="button" :disabled="formsBlocked || !currentUser" @click="openUserEdit">Editar</button>
            <button v-if="hasUserDelete" class="btn btn-danger" type="button" :disabled="formsBlocked || !currentUser" @click="openDeleteUser">Dar de baja</button>
          </div>
        </header>
        <div class="card-body">
          <div v-if="userState === DATA_STATE.LOADING" class="identity-state" role="status"><span class="spinner-border" aria-hidden="true"></span><span>{{ focusMessage(userState, 'ficha') }}</span></div>
          <div v-else-if="userState === DATA_STATE.ERROR || userState === DATA_STATE.DENIED" class="alert alert-danger" role="alert">{{ userError }}<button class="btn btn-outline-primary btn-sm" type="button" @click="userDetailLoad">Reintentar lectura</button></div>
          <template v-else-if="currentUser">
            <ul class="nav nav-tabs identity-detail-tabs" role="tablist" aria-label="Secciones de usuario">
              <li class="nav-item" role="presentation"><button id="user-tab-identity" class="nav-link" :class="{ active: activeTab === TAB.USER_IDENTITY }" role="tab" :aria-selected="activeTab === TAB.USER_IDENTITY" aria-controls="user-panel-identity" :tabindex="activeTab === TAB.USER_IDENTITY ? 0 : -1" data-tab="identity" @click="activeTab = TAB.USER_IDENTITY" @keydown="onTabKeydown($event, 'user')">Identidad</button></li>
              <li class="nav-item" role="presentation"><button id="user-tab-assignments" class="nav-link" :class="{ active: activeTab === TAB.USER_ASSIGNMENTS }" role="tab" :aria-selected="activeTab === TAB.USER_ASSIGNMENTS" aria-controls="user-panel-assignments" :tabindex="activeTab === TAB.USER_ASSIGNMENTS ? 0 : -1" data-tab="assignments" @click="activeTab = TAB.USER_ASSIGNMENTS" @keydown="onTabKeydown($event, 'user')">Asignaciones</button></li>
              <li class="nav-item" role="presentation"><button id="user-tab-access" class="nav-link" :class="{ active: activeTab === TAB.USER_ACCESS, 'identity-tab-error': userAccessTabHasError }" role="tab" :aria-selected="activeTab === TAB.USER_ACCESS" :aria-label="tabAriaLabel('Credenciales y membresías', userAccessTabHasError)" aria-controls="user-panel-access" :tabindex="activeTab === TAB.USER_ACCESS ? 0 : -1" data-tab="access" @click="activeTab = TAB.USER_ACCESS" @keydown="onTabKeydown($event, 'user')">Credenciales y membresías</button></li>
            </ul>
            <div class="tab-content identity-detail-tab-content text-muted">
              <section v-if="activeTab === TAB.USER_IDENTITY" id="user-panel-identity" class="tab-pane identity-detail-pane show active" role="tabpanel" aria-labelledby="user-tab-identity">
                <ul class="list-group list-group-flush text-muted identity-facts">
                  <li class="list-group-item text-muted">RUT: {{ displayValue(currentUser.rut) }}</li>
                  <li class="list-group-item text-muted">Grado: {{ displayValue(currentUser.grado) }}</li>
                  <li class="list-group-item text-muted">Nombre: {{ displayValue(currentUser.nombre) }}</li>
                  <li class="list-group-item text-muted">Apellido paterno: {{ displayValue(currentUser.apellido_paterno) }}</li>
                  <li class="list-group-item text-muted">Apellido materno: {{ displayValue(currentUser.apellido_materno) }}</li>
                  <li class="list-group-item text-muted">Correo: {{ displayValue(currentUser.correo) }}</li>
                  <li class="list-group-item text-muted">Habilitado: {{ currentUser.habilitado ? 'Sí' : 'No' }}</li>
                  <li class="list-group-item text-muted">Bloqueado: {{ currentUser.is_locked ? 'Sí' : 'No' }}</li>
                  <li class="list-group-item text-muted">Debe cambiar contraseña: {{ currentUser.must_change_password ? 'Sí' : 'No' }}</li>
                  <li class="list-group-item text-muted">Contraseña actualizada: {{ formatLocalDate(currentUser.password_changed_at) }}</li>
                </ul>
              </section>
              <section v-else-if="activeTab === TAB.USER_ASSIGNMENTS" id="user-panel-assignments" class="tab-pane identity-detail-pane show active" role="tabpanel" aria-labelledby="user-tab-assignments">
                <div class="identity-section-heading">
                  <h3>Asignación principal</h3>
                  <div class="identity-page-actions">
                    <button v-if="hasUserUpdate" type="button" class="btn btn-primary btn-sm" :disabled="formsBlocked" @click="openModal(MODAL.PRIMARY_ASSIGNMENT)">Editar asignación principal</button>
                    <button v-if="hasUserUpdate && currentUser.primary_assignment" type="button" class="btn btn-outline-danger btn-sm" :disabled="formsBlocked" @click="openDeactivatePrimary">Desactivar</button>
                  </div>
                </div>
                <ul class="list-group identity-detail-list-group">
                  <li class="list-group-item"><strong>Unidad:</strong> {{ displayValue(currentUser.primary_assignment?.unit_code) }}</li>
                  <li class="list-group-item"><strong>Rol:</strong> {{ roleLabel(currentUser.primary_assignment?.role_code ?? null) }}</li>
                  <li class="list-group-item"><strong>Scope:</strong> {{ scopeLabel(currentUser.primary_assignment?.scope_code ?? null) }}</li>
                </ul>
                <div class="identity-section-heading identity-section-spaced">
                  <h3>Asignaciones secundarias y principal devueltas</h3>
                  <button v-if="hasUserUpdate" type="button" class="btn btn-primary btn-sm" :disabled="formsBlocked" @click="openModal(MODAL.ADD_ASSIGNMENT)">Agregar secundaria</button>
                </div>
                <div v-if="currentUser.assignments.length === 0" class="alert alert-info" role="status">Esta persona no tiene asignaciones registradas.</div>
                <div v-else class="table-responsive">
                  <table class="table table-hover">
                    <caption class="identity-visually-hidden">Asignaciones de la persona</caption>
                    <thead><tr><th scope="col">ID</th><th scope="col">Rol</th><th scope="col">Unidad</th><th scope="col">Alcance</th><th scope="col">Tipo</th><th scope="col">Acción</th></tr></thead>
                    <tbody>
                      <tr v-for="assignment in currentUser.assignments" :key="assignment.id">
                        <td>{{ assignment.id }}</td><td>{{ roleLabel(assignment.role_code) }}</td><td>{{ displayValue(assignment.unit_code) }}</td><td>{{ scopeLabel(assignment.scope_code) }}</td>
                        <td><span class="badge" :class="assignment.is_primary ? 'bg-primary' : 'bg-secondary'">{{ assignment.is_primary ? 'Principal' : 'Secundaria' }}</span></td>
                        <td><button v-if="hasUserUpdate && !assignment.is_primary" type="button" class="btn btn-outline-danger btn-sm" :disabled="formsBlocked" @click="openRemoveAssignment(assignment)">Quitar</button><span v-else>—</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="currentUser.assignments.length <= 1" class="alert alert-warning" role="note">Si quitas la última asignación, el servidor puede conservar o recrear la asignación de tirador implícita.</div>
              </section>
              <section v-else id="user-panel-access" class="tab-pane identity-detail-pane show active" role="tabpanel" aria-labelledby="user-tab-access">
                <div class="identity-section-heading">
                  <h3>Estado de bloqueo</h3>
                  <button v-if="hasUserUpdate && lockStatus?.is_locked" type="button" class="btn btn-primary btn-sm" :disabled="formsBlocked" @click="openModal(MODAL.UNLOCK_USER)">Desbloquear</button>
                </div>
                <div v-if="lockState === DATA_STATE.LOADING" class="identity-state" role="status"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Cargando estado de bloqueo.</span></div>
                <div v-else-if="lockState === DATA_STATE.ERROR || lockState === DATA_STATE.DENIED" class="alert alert-danger" role="alert">{{ lockError }}<button class="btn btn-outline-primary btn-sm" type="button" @click="readLockStatus">Reintentar lectura</button></div>
                <ul v-else-if="lockStatus" class="list-group list-group-flush text-muted identity-facts">
                  <li class="list-group-item text-muted">RUT: {{ lockStatus.rut }}</li>
                  <li class="list-group-item text-muted">Bloqueado: {{ lockStatus.is_locked ? 'Sí' : 'No' }}</li>
                  <li class="list-group-item text-muted">Fallos: {{ lockStatus.failures }}</li>
                  <li class="list-group-item text-muted">Límite: {{ lockStatus.failure_limit }}</li>
                  <li class="list-group-item text-muted">Último intento: {{ formatLocalDate(lockStatus.last_attempt) }}</li>
                </ul>
                <div v-else class="identity-state">Pulsa «Reconciliar lectura» para consultar el estado de bloqueo.</div>
                <div class="identity-section-heading identity-section-spaced">
                  <h3>Acciones de credenciales sobre otra persona</h3>
                  <div class="identity-page-actions">
                    <button v-if="hasUserUpdate && !isOwnUserRoute" type="button" class="btn btn-outline-primary btn-sm" :disabled="formsBlocked" @click="openModal(MODAL.OTHER_PASSWORD)">Cambiar contraseña</button>
                    <button v-if="hasUserUpdate && !isOwnUserRoute" type="button" class="btn btn-outline-danger btn-sm" :disabled="formsBlocked" @click="openModal(MODAL.RESET_PASSWORD)">Restablecer</button>
                  </div>
                </div>
                <p v-if="isOwnUserRoute" class="text-muted">Por seguridad, no puedes restablecer tu propia contraseña desde aquí. Usa «Cambiar mi contraseña» en tu cuenta.</p>
                <div class="identity-section-heading identity-section-spaced"><h3>Membresías relacionadas</h3></div>
                <div v-if="membershipsState === DATA_STATE.IDLE" class="identity-state" role="status">
                  <span>Las membresías no se consultaron en este contexto.</span>
                  <button class="btn btn-outline-primary btn-sm" type="button" :disabled="activeMutations" @click="readMemberships">Leer membresías</button>
                </div>
                <div v-else-if="membershipsState === DATA_STATE.LOADING" class="identity-state" role="status"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Cargando membresías.</span></div>
                <div v-else-if="membershipsState === DATA_STATE.ERROR || membershipsState === DATA_STATE.DENIED" class="alert alert-danger" role="alert">{{ membershipsError }}<button class="btn btn-outline-primary btn-sm" type="button" @click="readMemberships">Reintentar lectura</button></div>
                <ul v-else-if="userMemberships.length" class="list-group identity-detail-list-group">
                  <li v-for="membership in userMemberships" :key="membership.id" class="list-group-item">
                    <span>{{ membership.unit_code }} — {{ membership.unit_name }} <span class="badge" :class="membership.is_primary ? 'bg-primary' : 'bg-secondary'">{{ membership.is_primary ? 'Primaria' : 'Secundaria' }}</span></span>
                    <RouterLink :to="'/organizacion/membresias'">Ver todas las membresías</RouterLink>
                  </li>
                </ul>
                <div v-else class="alert alert-info" role="status">Este RUT no tiene membresías en la lectura disponible.</div>
              </section>
            </div>
          </template>
          <div v-else class="identity-state" role="status">Pulsa «Reconciliar lectura» para consultar la ficha.</div>
        </div>
      </section>
    </section>

    <section v-else-if="viewKind === VIEW_KIND.POSITIONS" class="card identity-list-card identity-list-card--positions">
      <header class="card-header">
        <h2 class="card-title">Puestos</h2>
        <p class="card-subtitle">Puesto, titular y membresía son relaciones distintas; aquí se listan los puestos de tu alcance.</p>
      </header>
      <div class="card-body">
        <button v-if="hasPositionCreate" type="button" class="btn btn-primary" :disabled="formsBlocked" @click="openPositionEdit()">Crear puesto</button>
        <div v-if="!sessionEligible" class="alert alert-warning" role="status">Elige una institución y una unidad activas para leer los puestos.</div>
        <div v-else-if="!hasPositionRead" class="alert alert-danger" role="alert">Tu sesión no tiene permiso para ver los puestos.</div>
        <template v-else>
          <div v-if="positionsState === DATA_STATE.LOADING" class="identity-state" role="status"><span class="spinner-border" aria-hidden="true"></span><span>{{ focusMessage(positionsState, 'puestos') }}</span></div>
          <div v-else-if="positionsState === DATA_STATE.ERROR || positionsState === DATA_STATE.DENIED" class="alert alert-danger" role="alert">{{ positionsError }}<button class="btn btn-outline-primary btn-sm" type="button" @click="readPositions">Reintentar lectura</button></div>
          <div v-else-if="positionsState === DATA_STATE.EMPTY" class="alert alert-info" role="status">No hay puestos en tu alcance de datos.</div>
          <template v-else-if="positionsState === DATA_STATE.READY">
            <div class="identity-toolbar">
              <label class="identity-search-field"><span class="form-label">Buscar</span><input v-model="activeFilter" class="form-control" type="search" aria-label="Buscar puestos" placeholder="Código, nombre o unidad" /></label>
              <span class="identity-count">{{ countLabel(filteredPositions.length, positions.length, 'puestos') }}</span>
            </div>
            <div class="table-responsive">
              <table class="table table-centered">
                <caption class="identity-visually-hidden">Puestos con su unidad, rol y cantidad de titulares</caption>
                <thead><tr><th scope="col" :aria-sort="sortDirection('code')"><button class="identity-sort" type="button" @click="setSort('code')">Código <span aria-hidden="true">{{ sortGlyph('code') }}</span></button></th><th scope="col">Puesto</th><th scope="col" :aria-sort="sortDirection('unit')"><button class="identity-sort" type="button" @click="setSort('unit')">Unidad <span aria-hidden="true">{{ sortGlyph('unit') }}</span></button></th><th scope="col">Rol / alcance</th><th scope="col" :aria-sort="sortDirection('holders')"><button class="identity-sort" type="button" @click="setSort('holders')">Titulares <span aria-hidden="true">{{ sortGlyph('holders') }}</span></button></th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
                <tbody>
                  <tr v-for="position in filteredPositions" :key="position.id">
                    <td><RouterLink :to="`/organizacion/puestos/${position.id}`">{{ position.code }}</RouterLink></td><td>{{ position.name }}</td><td>{{ position.organization_unit_code }} — {{ position.organization_unit_name }}</td><td>{{ position.role_code }} · {{ displayValue(position.scope_code) }}</td><td>{{ position.current_holders_count }}</td>
                    <td><span class="badge" :class="position.is_active ? 'bg-success' : 'bg-secondary'">{{ position.is_active ? 'Activo' : 'Inactivo' }}</span><span v-if="position.is_unique_holder" class="badge bg-primary">Titular único</span></td>
                    <td><button v-if="hasPositionUpdate" type="button" class="btn btn-outline-primary btn-sm" :disabled="formsBlocked" @click="openPositionEdit(position)">Editar</button> <button v-if="hasPositionDelete" type="button" class="btn btn-outline-danger btn-sm" :disabled="formsBlocked" @click="openDeletePosition(position)">Dar de baja</button></td>
                  </tr>
                  <tr v-if="filteredPositions.length === 0">
                    <td colspan="7" class="identity-empty-cell">
                      Ningún puesto coincide con la búsqueda.
                      <button class="btn btn-outline-primary btn-sm" type="button" @click="clearSearch">Limpiar búsqueda</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <div v-else class="identity-state">Pulsa «Reconciliar lectura» para consultar los puestos.</div>
        </template>
      </div>
    </section>

    <section v-else-if="viewKind === VIEW_KIND.POSITION_DETAIL" class="card">
      <header class="card-header identity-card-heading">
        <div><h2 class="card-title">{{ currentPosition?.name || 'Ficha de puesto' }}</h2><p class="card-subtitle">Código {{ displayValue(currentPosition?.code) }} · ID {{ displayValue(currentPosition?.id) }}</p></div>
        <div class="identity-page-actions">
          <button v-if="hasPositionUpdate" type="button" class="btn btn-primary" :disabled="formsBlocked || !currentPosition" @click="openPositionEdit(currentPosition ?? undefined)">Editar</button>
          <button v-if="hasPositionDelete" type="button" class="btn btn-danger" :disabled="formsBlocked || !currentPosition" @click="openDeletePosition(currentPosition ?? undefined)">Dar de baja</button>
        </div>
      </header>
      <div class="card-body">
        <div v-if="positionsState === DATA_STATE.LOADING" class="identity-state" role="status"><span class="spinner-border" aria-hidden="true"></span><span>{{ focusMessage(positionsState, 'puesto') }}</span></div>
        <div v-else-if="positionsState === DATA_STATE.ERROR || positionsState === DATA_STATE.DENIED" class="alert alert-danger" role="alert">{{ positionsError }}<button class="btn btn-outline-primary btn-sm" type="button" @click="readPositionDetail">Reintentar lectura</button></div>
        <template v-else-if="currentPosition">
          <ul class="nav nav-tabs identity-detail-tabs" role="tablist" aria-label="Secciones de puesto">
            <li class="nav-item" role="presentation"><button id="position-tab-holders" class="nav-link" :class="{ active: activeTab === TAB.POSITION_HOLDERS, 'identity-tab-error': positionHoldersTabHasError }" role="tab" :aria-selected="activeTab === TAB.POSITION_HOLDERS" :aria-label="tabAriaLabel('Titulares', positionHoldersTabHasError)" aria-controls="position-panel-holders" :tabindex="activeTab === TAB.POSITION_HOLDERS ? 0 : -1" data-tab="holders" @click="activeTab = TAB.POSITION_HOLDERS" @keydown="onTabKeydown($event, 'position')">Titulares</button></li>
            <li class="nav-item" role="presentation"><button id="position-tab-history" class="nav-link" :class="{ active: activeTab === TAB.POSITION_HISTORY, 'identity-tab-error': positionHoldersTabHasError }" role="tab" :aria-selected="activeTab === TAB.POSITION_HISTORY" :aria-label="tabAriaLabel('Histórico', positionHoldersTabHasError)" aria-controls="position-panel-history" :tabindex="activeTab === TAB.POSITION_HISTORY ? 0 : -1" data-tab="history" @click="activeTab = TAB.POSITION_HISTORY" @keydown="onTabKeydown($event, 'position')">Histórico</button></li>
            <li class="nav-item" role="presentation"><button id="position-tab-data" class="nav-link" :class="{ active: activeTab === TAB.POSITION_DATA }" role="tab" :aria-selected="activeTab === TAB.POSITION_DATA" aria-controls="position-panel-data" :tabindex="activeTab === TAB.POSITION_DATA ? 0 : -1" data-tab="position-data" @click="activeTab = TAB.POSITION_DATA" @keydown="onTabKeydown($event, 'position')">Datos</button></li>
          </ul>
          <div class="tab-content identity-detail-tab-content text-muted">
            <section v-if="activeTab === TAB.POSITION_HOLDERS" id="position-panel-holders" class="tab-pane identity-detail-pane show active" role="tabpanel" aria-labelledby="position-tab-holders">
              <div class="identity-section-heading"><h3>Titulares del puesto</h3><button v-if="hasPositionUpdate" type="button" class="btn btn-primary btn-sm" :disabled="formsBlocked" @click="openModal(MODAL.ASSIGN_HOLDER)">Asignar titular</button></div>
              <p>Un titular es una asignación de este puesto y no una membresía. Titulares actuales: {{ currentPosition.current_holders_count }}.</p>
              <div v-if="historyState === DATA_STATE.IDLE" class="identity-state" role="status">
                <span>El histórico del puesto no se consultó en este contexto.</span>
                <button class="btn btn-outline-primary btn-sm" type="button" @click="readPositionDetail">Leer titulares</button>
              </div>
              <div v-else-if="historyState === DATA_STATE.LOADING" class="identity-state" role="status"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Cargando titulares e histórico…</span></div>
              <div v-else-if="historyState === DATA_STATE.ERROR || historyState === DATA_STATE.DENIED" class="alert alert-danger" role="alert">{{ historyError }}<button class="btn btn-outline-primary btn-sm" type="button" @click="readPositionDetail">Reintentar lectura</button></div>
              <div v-else-if="holderHistory?.holders.length" class="table-responsive">
                <table class="table table-hover">
                  <caption class="identity-visually-hidden">Titulares del puesto</caption>
                  <thead><tr><th scope="col">Cuenta</th><th scope="col">RUT</th><th scope="col">Nombre</th><th scope="col">Estado</th><th scope="col">Primario</th><th scope="col">Acción</th></tr></thead><tbody>
                  <tr v-for="holder in holderHistory.holders" :key="holder.id"><td>{{ holder.account }}</td><td>{{ holder.rut }}</td><td>{{ [holder.grado, holder.nombre].filter(Boolean).join(' ') || '—' }}</td><td><span class="badge" :class="holder.is_active ? 'bg-success' : 'bg-secondary'">{{ holder.is_active ? 'Activo' : 'Histórico' }}</span></td><td>{{ holder.is_primary ? 'Sí' : 'No' }}</td><td><button v-if="holder.is_active && hasPositionUpdate" type="button" class="btn btn-outline-danger btn-sm" :disabled="formsBlocked" @click="openRemoveHolder(holder)">Quitar</button><span v-else>—</span></td></tr>
                </tbody></table>
              </div>
              <div v-else class="alert alert-info" role="status">Este puesto no tiene titulares registrados.</div>
            </section>
            <section v-else-if="activeTab === TAB.POSITION_HISTORY" id="position-panel-history" class="tab-pane identity-detail-pane show active" role="tabpanel" aria-labelledby="position-tab-history">
              <div v-if="historyState === DATA_STATE.LOADING" class="identity-state" role="status"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Cargando histórico.</span></div>
              <div v-else-if="historyState === DATA_STATE.ERROR || historyState === DATA_STATE.DENIED" class="alert alert-danger" role="alert">{{ historyError }}<button class="btn btn-outline-primary btn-sm" type="button" @click="readPositionDetail">Reintentar lectura</button></div>
              <div v-else-if="holderHistory" class="alert alert-info" role="status">{{ holderHistory.position_code }} — {{ holderHistory.position_name }}. Se muestran solo los titulares y fechas registrados.</div>
              <div v-else class="identity-state">Pulsa «Reconciliar lectura» para consultar el histórico.</div>
              <ul v-if="holderHistory?.holders.length" class="list-group identity-detail-list-group"><li v-for="holder in holderHistory.holders" :key="`history-${holder.id}`" class="list-group-item"><span>{{ holder.rut }} — {{ [holder.grado, holder.nombre].filter(Boolean).join(' ') || '—' }}</span><span>{{ formatLocalRange(holder.starts_at, holder.ends_at) }}</span></li></ul>
            </section>
            <section v-else id="position-panel-data" class="tab-pane identity-detail-pane show active" role="tabpanel" aria-labelledby="position-tab-data">
              <ul class="list-group list-group-flush text-muted identity-facts">
                <li class="list-group-item text-muted">Código: {{ currentPosition.code }}</li>
                <li class="list-group-item text-muted">Nombre: {{ currentPosition.name }}</li>
                <li class="list-group-item text-muted">Unidad: {{ currentPosition.organization_unit_code }} — {{ currentPosition.organization_unit_name }}</li>
                <li class="list-group-item text-muted">Rol: {{ currentPosition.role_code }} — {{ currentPosition.role_name }}</li>
                <li class="list-group-item text-muted">Alcance: {{ displayValue(currentPosition.scope_code) }}</li>
                <li class="list-group-item text-muted">Armería: {{ displayValue(currentPosition.armory_code) }}</li>
                <li class="list-group-item text-muted">Recinto: {{ displayValue(currentPosition.recinto_code) }}</li>
                <li class="list-group-item text-muted">Activo: {{ currentPosition.is_active ? 'Sí' : 'No' }}</li>
                <li class="list-group-item text-muted">Titular único: {{ currentPosition.is_unique_holder ? 'Sí' : 'No' }}</li>
                <li class="list-group-item text-muted">Titulares actuales: {{ currentPosition.current_holders_count }}</li>
                <li class="list-group-item text-muted">Descripción: {{ displayValue(currentPosition.description) }}</li>
                <li class="list-group-item text-muted">Creado: {{ formatLocalDate(currentPosition.created_at) }}</li>
                <li class="list-group-item text-muted">Actualizado: {{ formatLocalDate(currentPosition.updated_at) }}</li>
              </ul>
            </section>
          </div>
        </template>
        <div v-else class="identity-state">Pulsa «Reconciliar lectura» para consultar el puesto.</div>
      </div>
    </section>

    <section v-else-if="viewKind === VIEW_KIND.MEMBERSHIPS" class="card identity-list-card identity-list-card--memberships">
      <header class="card-header">
        <h2 class="card-title">Membresías</h2>
        <p class="card-subtitle">Una membresía no reemplaza asignaciones funcionales ni titulares de puestos. El contexto se reconcilia tras cada cambio.</p>
      </header>
      <div class="card-body">
        <button v-if="hasPositionUpdate" type="button" class="btn btn-primary" :disabled="formsBlocked" @click="openMembershipEdit()">Crear membresía</button>
        <div v-if="!sessionEligible" class="alert alert-warning" role="status">Elige una institución y una unidad activas para leer las membresías.</div>
        <div v-else-if="!hasPositionRead" class="alert alert-danger" role="alert">Tu sesión no tiene permiso para ver las membresías.</div>
        <template v-else>
          <div v-if="membershipsState === DATA_STATE.LOADING" class="identity-state" role="status"><span class="spinner-border" aria-hidden="true"></span><span>{{ focusMessage(membershipsState, 'membresías') }}</span></div>
          <div v-else-if="membershipsState === DATA_STATE.ERROR || membershipsState === DATA_STATE.DENIED" class="alert alert-danger" role="alert">{{ membershipsError }}<button class="btn btn-outline-primary btn-sm" type="button" @click="readMemberships">Reintentar lectura</button></div>
          <div v-else-if="membershipsState === DATA_STATE.EMPTY" class="alert alert-info" role="status">No hay membresías en tu alcance de datos.</div>
          <template v-else-if="membershipsState === DATA_STATE.READY">
            <div class="identity-toolbar"><label class="identity-search-field"><span class="form-label">Buscar</span><input v-model="activeFilter" class="form-control" type="search" aria-label="Buscar membresías" placeholder="RUT, cuenta o unidad" /></label><span class="identity-count">{{ countLabel(filteredMemberships.length, memberships.length, 'membresías') }}</span></div>
            <div class="table-responsive"><table class="table table-centered">
              <caption class="identity-visually-hidden">Membresías orgánicas por cuenta y unidad</caption>
              <thead><tr><th scope="col" :aria-sort="sortDirection('rut')"><button class="identity-sort" type="button" @click="setSort('rut')">RUT / cuenta <span aria-hidden="true">{{ sortGlyph('rut') }}</span></button></th><th scope="col" :aria-sort="sortDirection('unit')"><button class="identity-sort" type="button" @click="setSort('unit')">Unidad orgánica <span aria-hidden="true">{{ sortGlyph('unit') }}</span></button></th><th scope="col" :aria-sort="sortDirection('primary')"><button class="identity-sort" type="button" @click="setSort('primary')">Primaria <span aria-hidden="true">{{ sortGlyph('primary') }}</span></button></th><th scope="col">Activa</th><th scope="col">Vigencia</th><th scope="col">Creada</th><th scope="col">Acciones</th></tr></thead><tbody>
              <tr v-for="membership in filteredMemberships" :key="membership.id"><td>{{ membership.rut }} · {{ membership.account }}</td><td>{{ membership.unit_code }} — {{ membership.unit_name }}</td><td><span class="badge" :class="membership.is_primary ? 'bg-primary' : 'bg-secondary'">{{ membership.is_primary ? 'Sí' : 'No' }}</span></td><td>{{ membership.is_active ? 'Sí' : 'No' }}</td><td>{{ formatLocalRange(membership.starts_at, membership.ends_at) }}</td><td>{{ formatLocalDate(membership.created_at) }}</td><td><button v-if="hasPositionUpdate" type="button" class="btn btn-outline-primary btn-sm" :disabled="formsBlocked" @click="openMembershipEdit(membership)">Editar</button> <button v-if="hasPositionDelete" type="button" class="btn btn-outline-danger btn-sm" :disabled="formsBlocked" @click="openDeleteMembership(membership)">Dar de baja</button></td></tr>
              <tr v-if="filteredMemberships.length === 0">
                <td colspan="7" class="identity-empty-cell">
                  Ninguna membresía coincide con la búsqueda.
                  <button class="btn btn-outline-primary btn-sm" type="button" @click="clearSearch">Limpiar búsqueda</button>
                </td>
              </tr>
            </tbody></table></div>
          </template>
          <div v-else class="identity-state">Pulsa «Reconciliar lectura» para consultar las membresías.</div>
        </template>
      </div>
    </section>

    <section v-else class="alert alert-warning" role="status">La ruta actual no corresponde a ninguna superficie de identidad incluida.</section>

    <DsModal :model-value="modal !== MODAL.NONE" :title="modalTitle" :busy="modalBusy" modal-id="identity-operation-modal" @update:model-value="(open) => !open && closeModal()" @close="closeModal">
      <template #body>
        <div v-if="catalogState === DATA_STATE.LOADING" class="identity-state" role="status"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Cargando catálogos…</span></div>
        <div v-if="catalogState === DATA_STATE.ERROR || catalogState === DATA_STATE.DENIED" class="alert alert-danger" role="alert">{{ catalogError }}<button class="btn btn-outline-primary btn-sm" type="button" :disabled="modalBusy" @click="retryFormCatalogs">Reintentar catálogos</button></div>
        <div v-if="formNotice" class="alert alert-warning" role="status">{{ formNotice }}</div>
        <div v-if="mutationError" class="alert alert-danger" role="alert">{{ mutationError }}</div>

        <form v-if="modal === MODAL.CREATE_USER || modal === MODAL.EDIT_USER" class="identity-editor-form" novalidate @submit.prevent="submitModal">
          <div v-if="modal === MODAL.CREATE_USER" class="alert alert-info" role="note">Si el RUT coincide con una persona temporal, el alta formal puede promoverla y conservar su historial.</div>
          <fieldset class="identity-fieldset">
            <legend class="identity-fieldset-legend">Datos de la persona</legend>
            <div class="identity-form-grid">
              <div class="identity-form-field">
                <label class="form-label" for="identity-user-rut">RUT *</label>
                <input id="identity-user-rut" v-model="userDraft.rut" class="form-control" :class="{ 'is-invalid': !!fieldMessage('rut') }" :aria-invalid="fieldMessage('rut') ? 'true' : undefined" :aria-describedby="fieldMessage('rut') ? feedbackId('rut') : undefined" type="text" autocomplete="off" required @blur="validateRut('rut', userDraft.rut)" />
                <span v-if="fieldMessage('rut')" :id="feedbackId('rut')" class="invalid-feedback">{{ fieldMessage('rut') }}</span>
                <p class="identity-hint">Formato 12345678-9, sin puntos.</p>
              </div>
              <div class="identity-form-field">
                <label class="form-label" for="identity-user-grado">Grado</label>
                <input id="identity-user-grado" v-model="userDraft.grado" class="form-control" type="text" />
              </div>
              <div class="identity-form-field identity-form-span">
                <label class="form-label" for="identity-user-nombre">Nombre</label>
                <input id="identity-user-nombre" v-model="userDraft.nombre" class="form-control" type="text" />
              </div>
              <div class="identity-form-field">
                <label class="form-label" for="identity-user-apellido-paterno">Apellido paterno *</label>
                <input id="identity-user-apellido-paterno" v-model="userDraft.apellido_paterno" class="form-control" :class="{ 'is-invalid': !!fieldMessage('apellido_paterno') }" :aria-invalid="fieldMessage('apellido_paterno') ? 'true' : undefined" :aria-describedby="fieldMessage('apellido_paterno') ? feedbackId('apellido_paterno') : undefined" type="text" required @blur="validateRequired('apellido_paterno', userDraft.apellido_paterno)" />
                <span v-if="fieldMessage('apellido_paterno')" :id="feedbackId('apellido_paterno')" class="invalid-feedback">{{ fieldMessage('apellido_paterno') }}</span>
              </div>
              <div class="identity-form-field">
                <label class="form-label" for="identity-user-apellido-materno">Apellido materno *</label>
                <input id="identity-user-apellido-materno" v-model="userDraft.apellido_materno" class="form-control" :class="{ 'is-invalid': !!fieldMessage('apellido_materno') }" :aria-invalid="fieldMessage('apellido_materno') ? 'true' : undefined" :aria-describedby="fieldMessage('apellido_materno') ? feedbackId('apellido_materno') : undefined" type="text" required @blur="validateRequired('apellido_materno', userDraft.apellido_materno)" />
                <span v-if="fieldMessage('apellido_materno')" :id="feedbackId('apellido_materno')" class="invalid-feedback">{{ fieldMessage('apellido_materno') }}</span>
              </div>
              <div class="identity-form-field identity-form-span">
                <label class="form-label" for="identity-user-correo">Correo</label>
                <input id="identity-user-correo" v-model="userDraft.correo" class="form-control" type="email" autocomplete="email" />
              </div>
            </div>
          </fieldset>
          <fieldset v-if="modal === MODAL.CREATE_USER" class="identity-fieldset">
            <legend class="identity-fieldset-legend">Asignación inicial</legend>
            <div class="alert alert-info" role="note">El alta envía la asignación inicial junto con el registro. Las opciones no acreditan autorización por sí solas: el servidor valida la operación y puede denegarla.</div>
            <div v-if="initialUnitsState === DATA_STATE.LOADING" class="identity-state" role="status">Consultando las unidades asignables…</div>
            <div v-else-if="initialUnitsState === DATA_STATE.EMPTY" class="alert alert-info" role="status">No hay unidades asignables; el alta formal requiere una unidad inicial.</div>
            <div class="identity-form-grid">
              <div class="identity-form-field identity-form-span">
                <label class="form-label" for="identity-user-unit-code">Unidad inicial *</label>
                <select id="identity-user-unit-code" v-model="formalAssignmentDraft.unit_code" class="form-select" :class="{ 'is-invalid': !!fieldMessage('initial_unit_code') }" :aria-invalid="fieldMessage('initial_unit_code') ? 'true' : undefined" :aria-describedby="fieldMessage('initial_unit_code') ? feedbackId('initial_unit_code') : undefined" :disabled="initialUnitsState !== DATA_STATE.READY || initialAssignableUnits.length === 0" required><option value="">Selecciona unidad</option><option v-for="unit in initialAssignableUnits" :key="unit.id" :value="unit.code">{{ unit.code }} — {{ unit.name }}</option></select>
                <span v-if="fieldMessage('initial_unit_code')" :id="feedbackId('initial_unit_code')" class="invalid-feedback">{{ fieldMessage('initial_unit_code') }}</span>
              </div>
              <div class="identity-form-field identity-form-span">
                <label class="form-label" for="identity-user-role-code">Rol inicial *</label>
                <select id="identity-user-role-code" v-model="formalAssignmentDraft.role_code" class="form-select" :class="{ 'is-invalid': !!fieldMessage('initial_role_code') }" :aria-invalid="fieldMessage('initial_role_code') ? 'true' : undefined" :aria-describedby="fieldMessage('initial_role_code') ? feedbackId('initial_role_code') : undefined" :disabled="catalogState !== DATA_STATE.READY || roleOptions.length === 0" required><option value="">Selecciona rol</option><optgroup v-for="category in roleCategories?.categories ?? []" :key="category.code" :label="category.label"><option v-for="role in category.roles" :key="role.code" :value="role.code">{{ role.name }} ({{ role.code }})</option></optgroup></select>
                <span v-if="fieldMessage('initial_role_code')" :id="feedbackId('initial_role_code')" class="invalid-feedback">{{ fieldMessage('initial_role_code') }}</span>
              </div>
              <div class="identity-form-field identity-form-span">
                <label class="form-label" for="identity-user-scope-code">Alcance inicial (opcional)</label>
                <select id="identity-user-scope-code" v-model="formalAssignmentDraft.scope_code" class="form-select" :class="{ 'is-invalid': !!fieldMessage('initial_scope_code') }" :aria-invalid="fieldMessage('initial_scope_code') ? 'true' : undefined" :aria-describedby="fieldMessage('initial_scope_code') ? feedbackId('initial_scope_code') : undefined" :disabled="catalogState !== DATA_STATE.READY"><option value="">Omitir alcance inicial</option><option v-for="scope in scopeOptions" :key="scope.id" :value="scope.code">{{ scope.name }} ({{ scope.code }})</option></select>
                <span v-if="fieldMessage('initial_scope_code')" :id="feedbackId('initial_scope_code')" class="invalid-feedback">{{ fieldMessage('initial_scope_code') }}</span>
              </div>
            </div>
            <div v-if="catalogState === DATA_STATE.READY && roleOptions.length === 0" class="alert alert-info" role="status">No hay roles disponibles; el alta formal requiere un rol inicial.</div>
          </fieldset>
          <details v-if="modal === MODAL.EDIT_USER" class="identity-advanced">
            <summary>Opciones avanzadas</summary>
            <div class="mb-3">
              <label class="form-label" for="identity-user-method">Modo de escritura</label>
              <select id="identity-user-method" v-model="userDraft.method" class="form-select"><option :value="WRITE_METHOD.PUT">Reemplazar todos los campos</option><option :value="WRITE_METHOD.PATCH">Enviar solo los cambios</option></select>
            </div>
          </details>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="submit" class="btn btn-primary" :disabled="formsBlocked || modalBusy || (modal === MODAL.CREATE_USER && (catalogState !== DATA_STATE.READY || initialUnitsState !== DATA_STATE.READY || initialAssignableUnits.length === 0 || roleOptions.length === 0))">{{ modal === MODAL.CREATE_USER ? 'Crear usuario' : 'Guardar usuario' }}</button></div>
        </form>

        <form v-else-if="modal === MODAL.CREATE_TEMPORARY" class="identity-editor-form" novalidate @submit.prevent="submitModal">
          <div class="alert alert-warning" role="note">Alta temporal. Este registro no inicia sesión.</div>
          <div class="mb-3">
            <label class="form-label" for="identity-temporary-rut">RUT *</label>
            <input id="identity-temporary-rut" v-model="temporaryDraft.rut" class="form-control" :class="{ 'is-invalid': !!fieldMessage('rut') }" :aria-invalid="fieldMessage('rut') ? 'true' : undefined" :aria-describedby="fieldMessage('rut') ? feedbackId('rut') : undefined" type="text" autocomplete="off" required @blur="validateRut('rut', temporaryDraft.rut)" />
            <span v-if="fieldMessage('rut')" :id="feedbackId('rut')" class="invalid-feedback">{{ fieldMessage('rut') }}</span>
            <p class="identity-hint">Formato 12345678-9, sin puntos.</p>
          </div>
          <div class="mb-3"><label class="form-label" for="identity-temporary-grado">Grado</label><input id="identity-temporary-grado" v-model="temporaryDraft.grado" class="form-control" type="text" /></div>
          <div class="mb-3"><label class="form-label" for="identity-temporary-nombre">Nombre</label><input id="identity-temporary-nombre" v-model="temporaryDraft.nombre" class="form-control" type="text" /></div>
          <div class="mb-3"><label class="form-label" for="identity-temporary-apellido-paterno">Apellido paterno</label><input id="identity-temporary-apellido-paterno" v-model="temporaryDraft.apellido_paterno" class="form-control" type="text" /></div>
          <div class="mb-3"><label class="form-label" for="identity-temporary-apellido-materno">Apellido materno</label><input id="identity-temporary-apellido-materno" v-model="temporaryDraft.apellido_materno" class="form-control" type="text" /></div>
          <div class="mb-3"><label class="form-label" for="identity-temporary-organization-unit-code">Unidad orgánica (opcional)</label><select id="identity-temporary-organization-unit-code" v-model="temporaryDraft.organization_unit_code" class="form-select"><option value="">Omitir unidad</option><option v-for="unit in organizationUnits" :key="unit.id" :value="unit.code">{{ unit.code }} — {{ unit.name }}</option></select></div>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="submit" class="btn btn-primary" :disabled="formsBlocked || modalBusy">Crear temporal</button></div>
        </form>

        <form v-else-if="modal === MODAL.PRIMARY_ASSIGNMENT || modal === MODAL.ADD_ASSIGNMENT" class="identity-editor-form" novalidate @submit.prevent="submitModal">
          <div class="mb-3">
            <label class="form-label" for="identity-assignment-unit-code">Unidad elegible *</label>
            <select id="identity-assignment-unit-code" v-model="assignmentDraft.unit_code" class="form-select" :class="{ 'is-invalid': !!fieldMessage('unit_code') }" :aria-invalid="fieldMessage('unit_code') ? 'true' : undefined" :aria-describedby="fieldMessage('unit_code') ? feedbackId('unit_code') : undefined" :disabled="eligibleUnitsState !== DATA_STATE.READY || unitOptionsForAssignment.length === 0" required><option value="">Selecciona unidad</option><option v-for="unit in unitOptionsForAssignment" :key="unit.id" :value="unit.code">{{ unit.code }} — {{ unit.name }}</option></select>
            <span v-if="fieldMessage('unit_code')" :id="feedbackId('unit_code')" class="invalid-feedback">{{ fieldMessage('unit_code') }}</span>
          </div>
          <div class="mb-3">
            <label class="form-label" for="identity-assignment-role-code">Rol *</label>
            <select id="identity-assignment-role-code" v-model="assignmentDraft.role_code" class="form-select" :class="{ 'is-invalid': !!fieldMessage('role_code') }" :aria-invalid="fieldMessage('role_code') ? 'true' : undefined" :aria-describedby="fieldMessage('role_code') ? feedbackId('role_code') : undefined" :disabled="catalogState !== DATA_STATE.READY" required><option value="">Selecciona rol</option><optgroup v-for="category in roleCategories?.categories ?? []" :key="category.code" :label="category.label"><option v-for="role in category.roles" :key="role.code" :value="role.code">{{ role.name }} ({{ role.code }})</option></optgroup></select>
            <span v-if="fieldMessage('role_code')" :id="feedbackId('role_code')" class="invalid-feedback">{{ fieldMessage('role_code') }}</span>
          </div>
          <div class="mb-3"><label class="form-label" for="identity-assignment-scopeselection">Alcance (opcional)</label><select id="identity-assignment-scopeselection" v-model="assignmentDraft.scopeSelection" class="form-select" :disabled="catalogState !== DATA_STATE.READY"><option :value="SCOPE_SELECTION.OMIT">Omitir alcance</option><option :value="SCOPE_SELECTION.CLEAR">Quitar alcance (vacío)</option><option v-for="scope in scopeOptions" :key="scope.id" :value="scope.code">{{ scope.name }} ({{ scope.code }})</option></select></div>
          <details v-if="modal === MODAL.PRIMARY_ASSIGNMENT" class="identity-advanced">
            <summary>Opciones avanzadas</summary>
            <div class="mb-3">
              <label class="form-label" for="identity-assignment-method">Modo de escritura</label>
              <select id="identity-assignment-method" v-model="assignmentDraft.method" class="form-select"><option :value="WRITE_METHOD.PUT">Reemplazar la asignación completa</option><option :value="WRITE_METHOD.PATCH">Actualizar solo los campos enviados</option></select>
            </div>
          </details>
          <div v-if="eligibleUnitsState === DATA_STATE.LOADING" class="identity-state" role="status">Consultando las unidades elegibles…</div>
          <div v-else-if="eligibleUnitsState === DATA_STATE.DENIED" class="alert alert-danger" role="alert">{{ catalogError || 'El servidor denegó la consulta de unidades elegibles.' }}</div>
          <div v-else-if="eligibleUnitsState === DATA_STATE.ERROR" class="alert alert-danger" role="alert">{{ catalogError || 'No se pudo consultar las unidades elegibles.' }}</div>
          <div v-else-if="eligibleUnitsState === DATA_STATE.EMPTY" class="alert alert-info" role="status">No hay unidades elegibles para esta persona.</div>
          <div v-if="eligiblePersonalUnitCode !== null" class="alert alert-info" role="status">Unidad personal: <code>{{ eligiblePersonalUnitCode }}</code>.</div>
          <div v-if="eligibleUnitRestriction" class="alert alert-warning" role="status">No hay destinos elegibles para esta persona (<code>{{ eligibleUnitRestriction }}</code>).</div>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="submit" class="btn btn-primary" :disabled="formsBlocked || modalBusy || catalogState !== DATA_STATE.READY || eligibleUnitsState !== DATA_STATE.READY || unitOptionsForAssignment.length === 0">{{ modal === MODAL.PRIMARY_ASSIGNMENT ? 'Guardar asignación principal' : 'Agregar secundaria' }}</button></div>
        </form>

        <form v-else-if="modal === MODAL.EDIT_POSITION" class="identity-editor-form" novalidate @submit.prevent="submitModal">
          <div class="mb-3">
            <label class="form-label" for="identity-position-code">Código *</label>
            <input id="identity-position-code" v-model="positionDraft.code" class="form-control" :class="{ 'is-invalid': !!fieldMessage('code') }" :aria-invalid="fieldMessage('code') ? 'true' : undefined" :aria-describedby="fieldMessage('code') ? feedbackId('code') : undefined" type="text" required @blur="validateRequired('code', positionDraft.code)" />
            <span v-if="fieldMessage('code')" :id="feedbackId('code')" class="invalid-feedback">{{ fieldMessage('code') }}</span>
          </div>
          <div class="mb-3">
            <label class="form-label" for="identity-position-name">Nombre *</label>
            <input id="identity-position-name" v-model="positionDraft.name" class="form-control" :class="{ 'is-invalid': !!fieldMessage('name') }" :aria-invalid="fieldMessage('name') ? 'true' : undefined" :aria-describedby="fieldMessage('name') ? feedbackId('name') : undefined" type="text" required @blur="validateRequired('name', positionDraft.name)" />
            <span v-if="fieldMessage('name')" :id="feedbackId('name')" class="invalid-feedback">{{ fieldMessage('name') }}</span>
          </div>
          <div class="mb-3">
            <label class="form-label" for="identity-position-organization-unit-code-write">Unidad orgánica *</label>
            <select id="identity-position-organization-unit-code-write" v-model="positionDraft.organization_unit_code_write" class="form-select" :class="{ 'is-invalid': !!fieldMessage('organization_unit_code_write') }" :aria-invalid="fieldMessage('organization_unit_code_write') ? 'true' : undefined" :aria-describedby="fieldMessage('organization_unit_code_write') ? feedbackId('organization_unit_code_write') : undefined" required><option value="">Selecciona unidad</option><option v-for="unit in organizationUnits" :key="unit.id" :value="unit.code">{{ unit.code }} — {{ unit.name }}</option></select>
            <span v-if="fieldMessage('organization_unit_code_write')" :id="feedbackId('organization_unit_code_write')" class="invalid-feedback">{{ fieldMessage('organization_unit_code_write') }}</span>
          </div>
          <div class="mb-3">
            <label class="form-label" for="identity-position-role-code-write">Rol del puesto *</label>
            <select id="identity-position-role-code-write" v-model="positionDraft.role_code_write" class="form-select" :class="{ 'is-invalid': !!fieldMessage('role_code_write') }" :aria-invalid="fieldMessage('role_code_write') ? 'true' : undefined" :aria-describedby="fieldMessage('role_code_write') ? feedbackId('role_code_write') : undefined" required><option value="">Selecciona rol</option><optgroup v-for="category in roleCategories?.categories ?? []" :key="category.code" :label="category.label"><option v-for="role in category.roles" :key="role.code" :value="role.code">{{ role.name }} ({{ role.code }})</option></optgroup></select>
            <span v-if="fieldMessage('role_code_write')" :id="feedbackId('role_code_write')" class="invalid-feedback">{{ fieldMessage('role_code_write') }}</span>
          </div>
          <div class="mb-3">
            <label class="form-label" for="identity-position-armory-code-write">Armería (opcional)</label><select id="identity-position-armory-code-write" v-model="positionDraft.armory_code_write" class="form-select"><option value="">Omitir</option><option :value="SCOPE_SELECTION.CLEAR">Quitar (vacío)</option><option v-for="armory in armories" :key="armory.id" :value="armory.code">{{ armory.code }} — {{ armory.name }}{{ armory.is_active ? '' : ' (inactiva)' }}</option></select></div>
          <div class="mb-3"><label class="form-label" for="identity-position-scope-code-write">Alcance (opcional)</label><select id="identity-position-scope-code-write" v-model="positionDraft.scope_code_write" class="form-select"><option value="">Omitir</option><option :value="SCOPE_SELECTION.CLEAR">Quitar (vacío)</option><option v-for="scope in scopeOptions" :key="scope.id" :value="scope.code">{{ scope.name }} ({{ scope.code }})</option></select></div>
          <div class="mb-3"><label class="form-label" for="identity-position-recinto-code-write">Recinto (opcional)</label><select id="identity-position-recinto-code-write" v-model="positionDraft.recinto_code_write" class="form-select"><option value="">Omitir</option><option :value="SCOPE_SELECTION.CLEAR">Quitar (vacío)</option><option v-for="recinto in recintos" :key="recinto.id" :value="recinto.code">{{ recinto.code }} — {{ recinto.name }}{{ recinto.is_active ? '' : ' (inactivo)' }}</option></select></div>
          <p class="identity-hint">El recinto solo se aplica cuando el alcance es «todo el recinto»; con cualquier otro alcance se ignora.</p>
          <div class="mb-3"><label class="form-label" for="identity-position-description">Descripción</label><textarea id="identity-position-description" v-model="positionDraft.description" class="form-control" rows="3"></textarea></div>
          <div class="form-check"><input id="identity-position-is-active" v-model="positionDraft.is_active" class="form-check-input" type="checkbox" /><label class="form-check-label" for="identity-position-is-active">Puesto activo</label></div>
          <div class="form-check"><input id="identity-position-is-unique-holder" v-model="positionDraft.is_unique_holder" class="form-check-input" type="checkbox" /><label class="form-check-label" for="identity-position-is-unique-holder">Titular único</label></div>
          <details v-if="positionDraft.id !== null" class="identity-advanced">
            <summary>Opciones avanzadas</summary>
            <div class="mb-3">
              <label class="form-label" for="identity-position-method">Modo de escritura</label>
              <select id="identity-position-method" v-model="positionDraft.method" class="form-select"><option :value="WRITE_METHOD.PUT">Reemplazar todos los campos</option><option :value="WRITE_METHOD.PATCH">Enviar solo los cambios</option></select>
            </div>
          </details>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="submit" class="btn btn-primary" :disabled="formsBlocked || modalBusy">{{ positionDraft.id === null ? 'Crear puesto' : 'Guardar puesto' }}</button></div>
        </form>

        <form v-else-if="modal === MODAL.ASSIGN_HOLDER" class="identity-editor-form" novalidate @submit.prevent="submitModal">
          <p class="alert alert-warning" role="note" v-if="currentPosition?.is_unique_holder">Este puesto declara titular único. Al aceptar la operación, el servidor retirará al titular anterior.</p>
          <div class="mb-3">
            <label class="form-label" for="identity-holder-account-id">Cuenta *</label>
            <select id="identity-holder-account-id" v-model="holderDraft.account_id" class="form-select" :class="{ 'is-invalid': !!fieldMessage('account_id') }" :aria-invalid="fieldMessage('account_id') ? 'true' : undefined" :aria-describedby="fieldMessage('account_id') ? feedbackId('account_id') : undefined" required><option value="">Selecciona una cuenta de las membresías</option><option v-for="account in accountOptions" :key="account.accountId" :value="String(account.accountId)">{{ account.rut }} — {{ account.unitName }}</option></select>
            <span v-if="fieldMessage('account_id')" :id="feedbackId('account_id')" class="invalid-feedback">{{ fieldMessage('account_id') }}</span>
          </div>
          <p v-if="accountOptions.length === 0" class="alert alert-warning" role="status">La lectura disponible no entregó cuentas. La asignación queda bloqueada hasta que existan.</p>
          <div class="mb-3">
            <label class="form-label" for="identity-holder-starts-at">Inicio de la asignación (opcional)</label>
            <input id="identity-holder-starts-at" v-model="holderDraft.starts_at" class="form-control" :class="{ 'is-invalid': !!fieldMessage('holder_starts_at') }" :aria-invalid="fieldMessage('holder_starts_at') ? 'true' : undefined" :aria-describedby="fieldMessage('holder_starts_at') ? feedbackId('holder_starts_at') : undefined" type="text" autocomplete="off" @blur="validateDate('holder_starts_at', holderDraft.starts_at)" />
            <span v-if="fieldMessage('holder_starts_at')" :id="feedbackId('holder_starts_at')" class="invalid-feedback">{{ fieldMessage('holder_starts_at') }}</span>
            <p class="identity-hint">Formato AAAA-MM-DD. {{ holderDraft.starts_at.trim() ? `Se registrará: ${formatLocalDate(holderDraft.starts_at)}` : 'Si lo dejas vacío, el servidor decide el inicio.' }}</p>
          </div>
          <div class="form-check"><input id="identity-holder-is-primary" v-model="holderDraft.is_primary" class="form-check-input" type="checkbox" /><label class="form-check-label" for="identity-holder-is-primary">Asignación principal</label></div>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="submit" class="btn btn-primary" :disabled="formsBlocked || modalBusy || accountOptions.length === 0">Asignar titular</button></div>
        </form>

        <form v-else-if="modal === MODAL.EDIT_MEMBERSHIP" class="identity-editor-form" novalidate @submit.prevent="submitModal">
          <p class="alert alert-info" role="note">Una membresía no modifica asignaciones funcionales ni titulares de puesto.</p>
          <div class="mb-3">
            <label class="form-label" for="identity-membership-account">Cuenta *</label>
            <select id="identity-membership-account" v-model="membershipDraft.account" class="form-select" :class="{ 'is-invalid': !!fieldMessage('account') }" :aria-invalid="fieldMessage('account') ? 'true' : undefined" :aria-describedby="fieldMessage('account') ? feedbackId('account') : undefined" required><option value="">Selecciona una cuenta de las membresías</option><option v-for="account in accountOptions" :key="account.accountId" :value="String(account.accountId)">{{ account.rut }} — {{ account.unitName }}</option></select>
            <span v-if="fieldMessage('account')" :id="feedbackId('account')" class="invalid-feedback">{{ fieldMessage('account') }}</span>
          </div>
          <div class="mb-3">
            <label class="form-label" for="identity-membership-unit">Unidad *</label>
            <select id="identity-membership-unit" v-model="membershipDraft.unit" class="form-select" :class="{ 'is-invalid': !!fieldMessage('unit') }" :aria-invalid="fieldMessage('unit') ? 'true' : undefined" :aria-describedby="fieldMessage('unit') ? feedbackId('unit') : undefined" required><option value="">Selecciona unidad</option><option v-for="unit in organizationUnits" :key="unit.id" :value="String(unit.id)">{{ unit.code }} — {{ unit.name }}</option></select>
            <span v-if="fieldMessage('unit')" :id="feedbackId('unit')" class="invalid-feedback">{{ fieldMessage('unit') }}</span>
          </div>
          <div class="form-check"><input id="identity-membership-is-primary" v-model="membershipDraft.is_primary" class="form-check-input" type="checkbox" /><label class="form-check-label" for="identity-membership-is-primary">Membresía principal</label></div>
          <div class="form-check"><input id="identity-membership-is-active" v-model="membershipDraft.is_active" class="form-check-input" type="checkbox" /><label class="form-check-label" for="identity-membership-is-active">Membresía activa</label></div>
          <div class="mb-3">
            <label class="form-label" for="identity-membership-starts-at">Inicio (opcional)</label>
            <input id="identity-membership-starts-at" v-model="membershipDraft.starts_at" class="form-control" :class="{ 'is-invalid': !!fieldMessage('membership_starts_at') }" :aria-invalid="fieldMessage('membership_starts_at') ? 'true' : undefined" :aria-describedby="fieldMessage('membership_starts_at') ? feedbackId('membership_starts_at') : undefined" type="text" autocomplete="off" @blur="validateDate('membership_starts_at', membershipDraft.starts_at)" />
            <span v-if="fieldMessage('membership_starts_at')" :id="feedbackId('membership_starts_at')" class="invalid-feedback">{{ fieldMessage('membership_starts_at') }}</span>
            <p class="identity-hint">Formato AAAA-MM-DD. {{ membershipDraft.starts_at.trim() ? `Se registrará: ${formatLocalDate(membershipDraft.starts_at)}` : 'Vacío: el servidor decide el inicio.' }}</p>
          </div>
          <div class="mb-3">
            <label class="form-label" for="identity-membership-ends-at">Término (opcional)</label>
            <input id="identity-membership-ends-at" v-model="membershipDraft.ends_at" class="form-control" :class="{ 'is-invalid': !!fieldMessage('membership_ends_at') }" :aria-invalid="fieldMessage('membership_ends_at') ? 'true' : undefined" :aria-describedby="fieldMessage('membership_ends_at') ? feedbackId('membership_ends_at') : undefined" type="text" autocomplete="off" @blur="validateDate('membership_ends_at', membershipDraft.ends_at)" />
            <span v-if="fieldMessage('membership_ends_at')" :id="feedbackId('membership_ends_at')" class="invalid-feedback">{{ fieldMessage('membership_ends_at') }}</span>
            <p class="identity-hint">Formato AAAA-MM-DD. {{ membershipDraft.ends_at.trim() ? `Se registrará: ${formatLocalDate(membershipDraft.ends_at)}` : 'Vacío: la membresía permanece abierta.' }}</p>
          </div>
          <details v-if="membershipDraft.id !== null" class="identity-advanced">
            <summary>Opciones avanzadas</summary>
            <div class="mb-3">
              <label class="form-label" for="identity-membership-method">Modo de escritura</label>
              <select id="identity-membership-method" v-model="membershipDraft.method" class="form-select"><option :value="WRITE_METHOD.PUT">Reemplazar todos los campos</option><option :value="WRITE_METHOD.PATCH">Enviar solo los cambios</option></select>
            </div>
          </details>
          <p v-if="accountOptions.length === 0" class="alert alert-warning" role="status">La lectura disponible no incluye cuentas; el selector queda vacío.</p>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="submit" class="btn btn-primary" :disabled="formsBlocked || modalBusy || accountOptions.length === 0 || catalogState !== DATA_STATE.READY || (membershipDraft.id !== null && originalMembership?.id !== membershipDraft.id)">{{ membershipDraft.id === null ? 'Crear membresía' : 'Guardar membresía' }}</button></div>
        </form>

        <form v-else-if="modal === MODAL.OWN_PASSWORD" autocomplete="off" novalidate @submit.prevent="submitModal">
          <p class="alert alert-info" role="note">Cambia tu propia contraseña. Necesitas introducir la actual para confirmar el cambio.</p>
          <div class="mb-3"><label class="form-label" for="identity-own-password-old">Contraseña actual *</label><input id="identity-own-password-old" v-model="ownPasswordDraft.old_password" class="form-control" type="password" autocomplete="current-password" required /></div>
          <div class="mb-3"><label class="form-label" for="identity-own-password-new">Nueva contraseña *</label><input id="identity-own-password-new" v-model="ownPasswordDraft.new_password" class="form-control" type="password" autocomplete="new-password" required /></div>
          <div class="mb-3"><label class="form-label" for="identity-own-password-confirm">Confirmar nueva contraseña *</label><input id="identity-own-password-confirm" v-model="ownPasswordDraft.confirm_password" class="form-control" type="password" autocomplete="new-password" required /></div>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="submit" class="btn btn-primary" :disabled="modalBusy || !isVoluntaryOwnPasswordAvailable">Cambiar contraseña</button></div>
        </form>

        <form v-else-if="modal === MODAL.OTHER_PASSWORD" autocomplete="off" novalidate @submit.prevent="submitModal">
          <p class="alert alert-warning" role="note">Acción administrativa sobre otra persona. Requiere permiso para actualizar usuarios y no se aplica a tu propia cuenta.</p>
          <div class="mb-3"><label class="form-label" for="identity-other-password-new">Nueva contraseña *</label><input id="identity-other-password-new" v-model="otherPasswordDraft.new_password" class="form-control" type="password" autocomplete="new-password" required /></div>
          <div class="mb-3"><label class="form-label" for="identity-other-password-confirm">Confirmar nueva contraseña *</label><input id="identity-other-password-confirm" v-model="otherPasswordDraft.confirm_password" class="form-control" type="password" autocomplete="new-password" required /></div>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="submit" class="btn btn-primary" :disabled="formsBlocked || modalBusy">Cambiar contraseña</button></div>
        </form>

        <div v-else-if="modal === MODAL.DELETE_USER" class="identity-confirmation">
          <p>Solicitar la baja de {{ fullUserName }} (RUT {{ displayValue(currentUser?.rut) }}). La ficha permanece visible hasta que el servidor confirme.</p>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" autofocus :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="button" class="btn btn-danger" :disabled="formsBlocked || modalBusy" @click="submitModal">Confirmar baja</button></div>
        </div>
        <div v-else-if="modal === MODAL.DEACTIVATE_PRIMARY" class="identity-confirmation">
          <p>Desactivar la asignación principal. Si no queda otra asignación, el servidor puede conservar o recrear la asignación de tirador implícita.</p>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" autofocus :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="button" class="btn btn-danger" :disabled="formsBlocked || modalBusy" @click="submitModal">Confirmar desactivación</button></div>
        </div>
        <div v-else-if="modal === MODAL.REMOVE_ASSIGNMENT" class="identity-confirmation">
          <p>Quitar la asignación seleccionada. Si era la última, el servidor puede restaurar la asignación de tirador implícita.</p>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" autofocus :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="button" class="btn btn-danger" :disabled="formsBlocked || modalBusy" @click="submitModal">Quitar asignación</button></div>
        </div>
        <div v-else-if="modal === MODAL.DELETE_POSITION" class="identity-confirmation">
          <p>Dar de baja {{ currentPosition?.code }} — {{ currentPosition?.name }}. Titulares actuales: {{ displayValue(currentPosition?.current_holders_count) }}. No se reasignan automáticamente.</p>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" autofocus :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="button" class="btn btn-danger" :disabled="formsBlocked || modalBusy" @click="submitModal">Confirmar baja</button></div>
        </div>
        <div v-else-if="modal === MODAL.REMOVE_HOLDER" class="identity-confirmation">
          <p>Quitar al titular seleccionado del puesto. El histórico se vuelve a leer del servidor.</p>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" autofocus :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="button" class="btn btn-danger" :disabled="formsBlocked || modalBusy" @click="submitModal">Quitar titular</button></div>
        </div>
        <div v-else-if="modal === MODAL.DELETE_MEMBERSHIP" class="identity-confirmation">
          <p>Eliminar la membresía seleccionada. El contexto se reconciliará antes de habilitar operaciones nuevas.</p>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" autofocus :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="button" class="btn btn-danger" :disabled="formsBlocked || modalBusy" @click="submitModal">Confirmar baja</button></div>
        </div>
        <div v-else-if="modal === MODAL.RESET_PASSWORD" class="identity-confirmation">
          <p>Restablecer la contraseña de {{ fullUserName }}. No puedes restablecer tu propia contraseña desde aquí.</p>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" autofocus :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="button" class="btn btn-danger" :disabled="formsBlocked || modalBusy || isOwnUserRoute" @click="submitModal">Confirmar reseteo</button></div>
        </div>
        <div v-else-if="modal === MODAL.UNLOCK_USER" class="identity-confirmation">
          <p>Desbloquear {{ fullUserName }}. El panel se actualizará leyendo de nuevo el estado de bloqueo.</p>
          <div class="identity-modal-actions"><button type="button" class="btn btn-secondary" autofocus :disabled="modalBusy" @click="closeModal">Cancelar</button><button type="button" class="btn btn-primary" :disabled="formsBlocked || modalBusy" @click="submitModal">Confirmar desbloqueo</button></div>
        </div>
      </template>
    </DsModal>
  </div>
</template>

<style scoped>
.identity-view {
  --bui-surface: var(--surface, #1d2329);
  --bui-surface-2: var(--surface-2, #232a31);
  --bui-border: var(--border, #272f37);
  --bui-text: var(--text, #aab8c5);
  --bui-heading: var(--heading, #aab8c5);
  --bui-muted: var(--muted, #8391a2);
  --bui-primary-rgb: var(--primary-rgb, 126, 103, 254);
  --bui-success-rgb: var(--success-rgb, 104, 206, 125);
  --bui-warning-rgb: var(--warning-rgb, 231, 152, 95);
  --bui-info-rgb: var(--info-rgb, 69, 175, 235);
  --bui-danger-rgb: var(--danger-rgb, 215, 83, 65);
  --bui-radius: var(--card-radius, 5.6px);
  --bui-radius-sm: var(--r-sm, 4px);
  --bui-radius-lg: 8px;
  --buf-input-border: var(--input-border, #3a4551);
  --buf-input-focus: var(--input-focus, #4a5663);
  color: var(--bui-text);
}

.identity-view .page-title-box {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 24px;
}

.identity-view .page-title-box h1 {
  margin: 0;
  color: var(--bui-heading);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}

.identity-view .breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  margin-top: 8px;
  color: var(--bui-muted);
  font-size: 13px;
  list-style: none;
}

.identity-view .breadcrumb a { color: var(--bui-muted); text-decoration: none; }
.identity-view .breadcrumb a:hover { color: var(--bui-heading); text-decoration: underline; }
.identity-view .card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-bottom: 24px;
  background-color: var(--bui-surface);
  border: 1px solid var(--bui-border);
  border-radius: var(--bui-radius);
  box-shadow: 0 3px 4px 0 rgba(0, 0, 0, .03);
  word-wrap: break-word;
}

.identity-view .card-header {
  padding: 18px 24px;
  margin-bottom: 0;
  background-color: transparent;
  border-bottom: 1px solid var(--bui-border);
  border-radius: 4.6px 4.6px 0 0;
}

.identity-view .card-header:first-child { border-radius: 4.6px 4.6px 0 0; }
.identity-view h2.card-title,
.identity-view h5.card-title,
.identity-view .card-title {
  margin: 0 0 12px;
  color: var(--bui-heading);
  font-size: 18px;
  font-weight: 600;
  line-height: 19.8px;
}

.identity-view .card-header .card-title:last-child { margin-bottom: 0; }
.identity-view .card-subtitle { margin: 0; color: var(--bui-text); font-size: 14px; line-height: 21px; }
.identity-view .card-body { flex: 1 1 auto; padding: 24px; color: var(--bui-text); }
.identity-view .card-body > :last-child { margin-bottom: 0; }
.identity-view .identity-card-heading,
.identity-view .identity-section-heading,
.identity-view .identity-page-actions,
.identity-view .identity-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.identity-view .identity-card-heading { flex-wrap: wrap; }
.identity-view .identity-card-heading > :first-child { min-width: 0; }
.identity-view .identity-page-actions { flex-wrap: wrap; justify-content: flex-end; }
.identity-view .identity-detail-stack { display: grid; gap: 0; }
.identity-view .identity-toolbar { align-items: flex-end; flex-wrap: wrap; margin-bottom: 16px; }
.identity-view .identity-search-field { display: grid; width: min(100%, 420px); gap: 0; }
.identity-view .identity-count { color: var(--bui-muted); font-size: 13px; }
.identity-view .identity-legend { margin: 0 0 12px; color: var(--bui-muted); font-size: 13px; }
.identity-view .identity-state { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 80px; color: var(--bui-muted); }
.identity-view .identity-empty-cell { padding: 24px; color: var(--bui-muted); text-align: center; }
.identity-view .identity-section-heading { margin: 16px 0 12px; flex-wrap: wrap; }
.identity-view .identity-section-heading h3 { margin: 0; color: var(--bui-heading); font-size: 16px; font-weight: 600; }
.identity-view .identity-section-spaced { margin-top: 28px; }
/* Marca de error en la pestaña: solo señal visual (el texto no cambia; el lector lo recibe por aria-label). */
.identity-view .identity-tab-error::after { content: "!"; margin-left: 4px; color: var(--danger-text, #ea7b69); font-weight: 700; }
.identity-view .identity-visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }

/* El modal se teletransporta al body: sin ancestro .identity-view. Los grupos, la grilla
   y las ayudas de sus campos se estilan contra .ds-modal (clases propias de esta vista). */
:global(.ds-modal .identity-modal-actions) { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 12px; margin-top: 12px; }
:global(.ds-modal .identity-fieldset) { border: 0; margin: 0 0 20px; padding: 0; min-width: 0; }
:global(.ds-modal .identity-fieldset-legend) { padding: 0; margin-bottom: 12px; color: var(--bui-text); font-size: 14px; font-weight: 600; }
:global(.ds-modal .identity-form-grid) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 20px; }
:global(.ds-modal .identity-form-field) { display: block; min-width: 0; margin: 0; }
:global(.ds-modal .identity-form-span) { grid-column: 1 / -1; }
:global(.ds-modal .identity-hint) { margin: 4px 0 0; color: var(--bui-muted); font-size: 12px; }
:global(.ds-modal .identity-advanced) { margin-top: 4px; }
:global(.ds-modal .identity-confirmation p) { margin: 0 0 20px; }

.identity-view .form-label {
  display: inline-block;
  margin-bottom: 8px;
  color: var(--bui-text);
  font-size: 14px;
  font-weight: 500;
}

/* Fuera del modal teletransportado, el único `.form-control` es el buscador de las listas.
   Los campos del modal (`.form-select`, `.form-check`, `.invalid-feedback`) se estilan en
   DsModal: sus reglas `.identity-view ...` no alcanzarían al contenido teletransportado. */
.identity-view .form-control {
  display: block;
  width: 100%;
  min-height: calc(1.5em + 1rem + 2px);
  padding: 8px 24px;
  color: var(--bui-text);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  appearance: none;
  background-color: var(--bui-surface);
  background-clip: padding-box;
  border: 1px solid var(--buf-input-border);
  border-radius: var(--bui-radius);
  transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}

.identity-view .form-control:focus-visible {
  border-color: var(--buf-input-focus);
  outline: 0;
  box-shadow: none;
}

.identity-view .form-control::placeholder { color: var(--bui-muted); opacity: 1; }
.identity-view .form-control:disabled { background-color: var(--bg, #191e23); opacity: 1; }
.identity-view .btn {
  display: inline-block;
  padding: 8px 24px;
  color: var(--bui-heading);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: var(--bui-radius);
  transition: color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}

.identity-view .btn:hover { color: var(--bui-heading); }
.identity-view .btn:focus-visible { outline: 0; box-shadow: 0 0 0 2px var(--bui-surface), 0 0 0 4px rgba(var(--bui-primary-rgb), 1); }
.identity-view .btn:active:not(:disabled) { transform: translateY(1px); }
.identity-view .btn:disabled { pointer-events: none; opacity: .65; }
.identity-view .btn-primary { color: #fff; background-color: rgba(var(--bui-primary-rgb), 1); border-color: rgba(var(--bui-primary-rgb), 1); }
.identity-view .btn-primary:hover { color: #fff; background-color: color-mix(in srgb, var(--primary, #7e67fe) 84%, #000); border-color: color-mix(in srgb, var(--primary, #7e67fe) 84%, #000); }
.identity-view .btn-secondary { color: #fff; background-color: rgba(var(--bui-secondary-rgb, 131, 145, 162), 1); border-color: rgba(var(--bui-secondary-rgb, 131, 145, 162), 1); }
.identity-view .btn-danger { color: var(--on-danger, #180000); background-color: rgba(var(--bui-danger-rgb), 1); border-color: rgba(var(--bui-danger-rgb), 1); }
.identity-view .btn-outline-primary { color: rgba(var(--bui-primary-rgb), 1); background: transparent; border-color: rgba(var(--bui-primary-rgb), 1); }
.identity-view .btn-outline-primary:hover { color: #fff; background-color: rgba(var(--bui-primary-rgb), 1); }
.identity-view .btn-outline-danger { color: var(--danger-text, #ea7b69); background: transparent; border-color: currentColor; }
.identity-view .btn-outline-danger:hover { color: var(--on-danger, #180000); background-color: rgba(var(--bui-danger-rgb), 1); }
.identity-view .btn-sm { padding: 5.568px 18px; font-size: 12.6px; border-radius: var(--bui-radius-sm); }
.identity-view .btn:focus-visible,
.identity-view a:focus-visible,
.identity-view .nav-link:focus-visible,
.identity-view .identity-sort:focus-visible { outline: 0; box-shadow: 0 0 0 .15rem rgba(var(--bui-primary-rgb), .25); }

.identity-view .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.identity-view .table { width: 100%; margin-bottom: 24px; color: var(--bui-text); vertical-align: top; border-color: var(--bui-border); border-collapse: collapse; }
.identity-view .table > :not(caption) > * > * { padding: 13.6px; color: var(--bui-text); background-color: transparent; border-bottom: 1px solid var(--bui-border); }
.identity-view .table > tbody { vertical-align: inherit; }
.identity-view .table > thead { vertical-align: bottom; }
.identity-view .table > thead th { vertical-align: middle; font-weight: 500; }
.identity-view .table-hover > tbody > tr:hover > * { background-color: color-mix(in srgb, var(--bui-text) 5%, var(--bui-surface)); }
.identity-view .identity-sort { padding: 0; color: inherit; font: inherit; text-align: left; background: none; border: 0; cursor: pointer; }
.identity-view .nav { display: flex; flex-wrap: wrap; padding: 0; margin: 0; list-style: none; }
.identity-view .nav-tabs { border-bottom: 1px solid var(--bui-border); }
/* Source: .page-content ul, .page-content ol { padding-left:2rem; margin-bottom:1rem }
   (baseui-content.css:62). The DS nav-tabs is a <ul>, so these box values are effective. */
.identity-view ul.identity-detail-tabs { padding-left: 2rem; margin-bottom: 1rem; }
.identity-view .nav-link {
  display: block;
  padding: 8px 16px;
  color: #afb9cf;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--bui-radius) var(--bui-radius) 0 0;
  transition: color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out;
}

.identity-view .nav-link:hover { color: var(--bui-heading); }
.identity-view .nav-link.active { color: rgba(var(--bui-primary-rgb), 1); background-color: var(--bui-surface); border-color: transparent transparent rgba(var(--bui-primary-rgb), 1); }
/* Source .nav-link transition includes box-shadow (baseui.css:824-833). */
.identity-view .identity-detail-tabs .nav-link { transition: color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out; }
/* Source precedence: .page-content .nav-link:not(.active) (#afb9cf) outranks .nav-link:hover,
   so the INACTIVE link keeps #afb9cf even on hover. Scoped here (0,3,0) beats the historical
   .identity-view .nav-link:hover (0,2,0). Light overrides below stay more specific. */
.identity-view .identity-detail-tabs .nav-link:not(.active) { color: #afb9cf; }
/* Source tab-content carries .text-muted (var(--bui-muted)); app has no .text-muted utility,
   so the wrapper color is reproduced here; no rules on children. */
.identity-view .identity-detail-tab-content { color: var(--bui-muted); }
/* Source light overrides (baseui-content.css:85-93): inactive #5d6c8a; active --primary-text.
   :global wraps the COMPLETE selector and keeps the tab marker. */
:global([data-theme="light"] .identity-view .identity-detail-tabs .nav-link:not(.active)) { color: #5d6c8a; }
:global([data-theme="light"] .identity-view .identity-detail-tabs .nav-link.active) { color: var(--primary-text); }
.identity-view .tab-content { padding: 20px 0 0; }
/* Source tab-pane visibility (baseui.css:842-843): hide non-active, show .active. */
/* Source tab-pane visibility, LIMITED to these marked groups (not any future .tab-content). */
.identity-view .identity-detail-tab-content > .identity-detail-pane { display: none; }
.identity-view .identity-detail-tab-content > .identity-detail-pane.active { display: block; }
.identity-view .list-group { display: flex; flex-direction: column; padding: 0; margin: 0; border-radius: var(--bui-radius); list-style: none; }
/* Source .page-content ul,ol { padding-left:2rem; margin-bottom:1rem } (baseui-content.css:62)
   applies to the <ul class=list-group>; the historical .identity-view .list-group{padding:0;margin:0}
   zeroed it. Limited to the marked Identity lists. */
.identity-view ul.identity-detail-list-group { padding-left: 2rem; margin-bottom: 1rem; }
/* Source item color: dark #f1f1f1 (baseui-content.css:173), light var(--bui-text) (:188).
   The historical .identity-view .list-group-item{color:var(--bui-text)} was unconditional. */
.identity-view ul.identity-detail-list-group > .list-group-item { color: #f1f1f1; }
:global([data-theme="light"] .identity-view ul.identity-detail-list-group > .list-group-item) { color: var(--bui-text); }
.identity-view .list-group-item { position: relative; display: block; padding: 10px 16px; margin-top: -1px; color: var(--bui-text); background: var(--bui-surface); border: 1px solid var(--bui-border); }
.identity-view .list-group-item:first-child { border-top-left-radius: var(--bui-radius); border-top-right-radius: var(--bui-radius); }
.identity-view .list-group-item:last-child { border-bottom-left-radius: var(--bui-radius); border-bottom-right-radius: var(--bui-radius); }
.identity-view .badge { display: inline-block; padding: 3px 6px; color: #fff; font-size: .75em; font-weight: 600; line-height: 1; text-align: center; white-space: nowrap; vertical-align: baseline; border: 1px solid transparent; border-radius: var(--bui-radius-sm); }
.identity-view .badge.bg-primary { color: #fff; background: rgba(var(--bui-primary-rgb), 1); }
/* Source: theme-customizer.css:330-336 sets html[data-accent] .badge.bg-primary{color:var(--tcf-on-accent)}.
   The scoped .identity-view .badge.bg-primary[data-v] (0,4,0) wins over that, so the accent ink is
   restored here for the assignment/holder table badges only. */
:global(html[data-accent] .identity-view #user-panel-assignments .badge.bg-primary) { color: var(--tcf-on-accent); }
:global(html[data-accent] .identity-view #position-panel-holders .badge.bg-primary) { color: var(--tcf-on-accent); }
.identity-view .badge.bg-success { color: var(--on-success, #012209); background: rgba(var(--bui-success-rgb), 1); }
.identity-view .badge.bg-warning { color: var(--on-warning, #2f1100); background: rgba(var(--bui-warning-rgb), 1); }
.identity-view .badge.bg-danger { color: var(--on-danger, #180000); background: rgba(var(--bui-danger-rgb), 1); }
.identity-view .badge.bg-secondary { color: #fff; background: rgba(var(--bui-secondary-rgb, 131, 145, 162), 1); }
.identity-view .alert { position: relative; padding: 12px 20px; margin: 0 0 20px; color: var(--bui-text); border: 0; border-radius: var(--bui-radius); }
.identity-view .alert-success { color: var(--success-text, var(--success)); background: rgba(var(--bui-success-rgb), .15); }
.identity-view .alert-info { color: var(--info-text, var(--info)); background: rgba(var(--bui-info-rgb), .15); }
.identity-view .alert-warning { color: var(--warning-text, var(--warning)); background: rgba(var(--bui-warning-rgb), .15); }
.identity-view .alert-danger { color: var(--danger-text, var(--danger)); background: rgba(var(--bui-danger-rgb), .15); }
.identity-view .text-muted { color: var(--bui-muted); }
.identity-view .spinner-border { display: inline-block; width: 32px; height: 32px; vertical-align: -.125em; border: 3px solid currentColor; border-right-color: transparent; border-radius: 50%; color: rgba(var(--bui-primary-rgb), 1); animation: .75s linear infinite identity-spinner-border; }
.identity-view .spinner-border-sm { width: 16px; height: 16px; border-width: 2px; }
@keyframes identity-spinner-border { to { transform: rotate(360deg); } }
/* ui-card.html:237-239; baseui.css:852-864,870. Cancel the app's list reset
   only for these card lists, retaining the source's native list defaults. */
.identity-view .identity-facts.list-group { display: flex; flex-direction: column; margin: revert; margin-bottom: 0; padding: revert; padding-left: 0; border-radius: var(--bui-radius); list-style: revert; }
.identity-view .identity-facts.list-group-flush > .list-group-item { position: relative; display: block; padding: 10px 16px; margin-top: -1px; color: var(--bui-muted); text-decoration: none; background-color: var(--bui-surface); border: 1px solid var(--bui-border); border-left: 0; border-right: 0; border-radius: 0; }

@media (max-width: 767px) {
  .identity-view .page-title-box { align-items: flex-start; }
  .identity-view .identity-page-actions { justify-content: flex-start; }
  .identity-view .card-header,
  .identity-view .card-body { padding: 18px; }
  .identity-view .table { min-width: 760px; }
  .identity-view .nav { flex-wrap: nowrap; overflow-x: auto; }
  .identity-view .nav-item { flex: 0 0 auto; }
  .identity-view .identity-toolbar { align-items: stretch; }
  :global(.ds-modal .identity-form-grid) { grid-template-columns: minmax(0, 1fr); }
}

@media (prefers-reduced-motion: reduce) {
  .identity-view .spinner-border { animation-duration: 1.5s; }
  .identity-view .btn,
  .identity-view .form-control,
  .identity-view .nav-link { transition-duration: .01ms; }
}
</style>
