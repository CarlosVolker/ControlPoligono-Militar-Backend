<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { HttpRequestError } from '../../api/http'
import {
  getAssignableUnits,
  getOrganizationUnitsLookup,
} from '../../api/shared/domain'
import DsModal from '../../components/shared/DsModal.vue'
import {
  OrganizationApiResponseError,
  addUnitToRecinto,
  createOrganizationUnit,
  createRecinto,
  deleteOrganizationUnit,
  deleteOrganizationUnitWithMigration,
  deleteRecinto,
  getOrganizationUnit,
  getOrganizationUnits,
  getRecinto,
  getRecintos,
  patchOrganizationUnit,
  patchRecinto,
  previewOrganizationUnitDeletion,
  removeUnitFromRecinto,
  replaceOrganizationUnit,
  replaceRecinto,
  type CreateOrganizationUnitBody,
  type CreateRecintoBody,
  type DeleteOrganizationUnitWithMigrationResponseDTO,
  type OrganizationUnitDeletionPreviewDTO,
  type OrganizationUnitMigrationCountsDTO,
  type OrganizationUnitRecord,
  type PatchOrganizationUnitBody,
  type PatchRecintoBody,
  type RecintoDTO,
  type ReplaceOrganizationUnitBody,
} from '../../features/organization/api'
import { SESSION_STATUS } from '../../types/session'
import type { ApiConnection } from '../../types/dashboard'
import { ORGANIZATION_UNIT_TYPE, type OrganizationUnitType } from '../../types/shared/domain'
import { useSessionStore } from '../../stores/session'
import { PERMISSION_CODE } from '../../permissions/catalog'

const VIEW = {
  UNIT_LIST: 'unit-list',
  UNIT_DETAIL: 'unit-detail',
  PRECINCT_LIST: 'precinct-list',
  PRECINCT_DETAIL: 'precinct-detail',
} as const

type View = (typeof VIEW)[keyof typeof VIEW]

const LOAD_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  EMPTY: 'empty',
  DENIED: 'denied',
  ERROR: 'error',
} as const

type LoadState = (typeof LOAD_STATE)[keyof typeof LOAD_STATE]

const MESSAGE_KIND = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const

type MessageKind = (typeof MESSAGE_KIND)[keyof typeof MESSAGE_KIND]

const MODAL = {
  UNIT_CREATE: 'unit-create',
  UNIT_EDIT: 'unit-edit',
  UNIT_DELETE: 'unit-delete',
  UNIT_MIGRATION: 'unit-migration',
  UNIT_MIGRATION_RESULT: 'unit-migration-result',
  PRECINCT_CREATE: 'precinct-create',
  PRECINCT_EDIT: 'precinct-edit',
  PRECINCT_DELETE: 'precinct-delete',
  PRECINCT_ADD_UNIT: 'precinct-add-unit',
  PRECINCT_REMOVE_UNIT: 'precinct-remove-unit',
} as const

type ModalKind = (typeof MODAL)[keyof typeof MODAL] | null

const UNIT_TYPE_EMPTY = { VALUE: '' } as const
type UnitTypeDraft = OrganizationUnitType | (typeof UNIT_TYPE_EMPTY)['VALUE']

const UNIT_TYPE_OPTIONS = [
  { value: ORGANIZATION_UNIT_TYPE.COMMAND, label: ORGANIZATION_UNIT_TYPE.COMMAND },
  { value: ORGANIZATION_UNIT_TYPE.DIVISION, label: ORGANIZATION_UNIT_TYPE.DIVISION },
  { value: ORGANIZATION_UNIT_TYPE.REGIMENT, label: ORGANIZATION_UNIT_TYPE.REGIMENT },
  { value: ORGANIZATION_UNIT_TYPE.BATTALION, label: ORGANIZATION_UNIT_TYPE.BATTALION },
  { value: ORGANIZATION_UNIT_TYPE.COMPANY, label: ORGANIZATION_UNIT_TYPE.COMPANY },
  { value: ORGANIZATION_UNIT_TYPE.SECTION, label: ORGANIZATION_UNIT_TYPE.SECTION },
  { value: ORGANIZATION_UNIT_TYPE.SQUAD, label: ORGANIZATION_UNIT_TYPE.SQUAD },
  { value: ORGANIZATION_UNIT_TYPE.STAFF, label: ORGANIZATION_UNIT_TYPE.STAFF },
  { value: ORGANIZATION_UNIT_TYPE.RANGE, label: ORGANIZATION_UNIT_TYPE.RANGE },
  { value: ORGANIZATION_UNIT_TYPE.OTHER, label: ORGANIZATION_UNIT_TYPE.OTHER },
] as const

const MIGRATION_COUNT_FIELDS: readonly {
  key: keyof OrganizationUnitMigrationCountsDTO
  label: string
}[] = [
  { key: 'assignments', label: 'Puestos' },
  { key: 'weapons', label: 'Armas' },
  { key: 'ranges', label: 'Recintos' },
  { key: 'lessons', label: 'Lecciones' },
  { key: 'fractions', label: 'Fracciones' },
  { key: 'results', label: 'Resultados' },
  { key: 'child_units', label: 'Unidades hijas' },
  { key: 'lessons_as_participant', label: 'Lecciones como participante' },
]

// Claves locales conservadas 1:1 (AC-7); los códigos provienen del catálogo
// compartido (única fuente, plan frontend-permission-navigation F5).
const PERMISSION = {
  VIEW_UNIT: PERMISSION_CODE.VIEW_UNIT,
  CREATE_UNIT: PERMISSION_CODE.CREATE_UNIT,
  UPDATE_UNIT: PERMISSION_CODE.UPDATE_UNIT,
  DELETE_UNIT: PERMISSION_CODE.DELETE_UNIT,
  VIEW_RECINTO: PERMISSION_CODE.VIEW_RECINTO,
  MANAGE_RECINTO: PERMISSION_CODE.MANAGE_RECINTO,
} as const

// Una sola cadena humana por recurso: el código de permiso vive en la lógica
// (PERMISSION) y nunca en el texto que lee la persona.
const PERMISSION_MESSAGE = {
  UNITS: 'No tienes permiso para ver unidades organizacionales. Solicítalo a quien administra tu rol.',
  RECINTOS: 'No tienes permiso para ver recintos. Solicítalo a quien administra tu rol.',
} as const

const STATE_FILTER = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

type StateFilter = (typeof STATE_FILTER)[keyof typeof STATE_FILTER]

interface UiMessage {
  kind: MessageKind
  text: string
}

interface FormFieldMetadata {
  label: string
  inputId: string
}

interface ModalFieldError extends FormFieldMetadata {
  key: string
  message: string
}

const UNIT_FORM_FIELDS: Readonly<Record<string, FormFieldMetadata>> = {
  code: { label: 'Código', inputId: 'organization-unit-code' },
  name: { label: 'Nombre', inputId: 'organization-unit-name' },
  parent: { label: 'Unidad padre', inputId: 'organization-unit-parent' },
  unit_type: { label: 'Tipo de unidad', inputId: 'organization-unit-type' },
  is_active: { label: 'Unidad activa', inputId: 'organization-unit-active' },
}

const RECINTO_FORM_FIELDS: Readonly<Record<string, FormFieldMetadata>> = {
  code: { label: 'Código', inputId: 'organization-recinto-code' },
  name: { label: 'Nombre', inputId: 'organization-recinto-name' },
  description: { label: 'Descripción', inputId: 'organization-recinto-description' },
  units: { label: 'Unidades', inputId: 'organization-recinto-units' },
  is_active: { label: 'Recinto activo', inputId: 'organization-recinto-active' },
}

const MIGRATION_FORM_FIELDS: Readonly<Record<string, FormFieldMetadata>> = {
  target_unit_code: { label: 'Destino de migración', inputId: 'organization-migration-target' },
}

const RELATION_FORM_FIELDS: Readonly<Record<string, FormFieldMetadata>> = {
  unit_code: { label: 'Unidad', inputId: 'organization-unit-lookup-select' },
}

interface UnitDraft {
  code: string
  name: string
  parentId: string
  unitType: UnitTypeDraft
  isActive: boolean
}

interface RecintoDraft {
  code: string
  name: string
  description: string
  isActive: boolean
  unitIds: number[]
  unitsTouched: boolean
}

interface UnitTreeRow {
  unit: OrganizationUnitRecord
  depth: number
  ancestors: readonly string[]
  hasChildren: boolean
  unresolvedParentCode: string | null
}

interface OperationTicket {
  key: string
  routeKey: string
  sessionKey: string
  resourceKey: string
  operation: string
  principalId: number
  generation: number
  tenantCode: string
  unitCode: string
  attempt: number
  modalToken: number | null
  controller: AbortController
}

const OPERATION_RESULT = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  STALE: 'stale',
  BLOCKED: 'blocked',
} as const

type OperationResult<T> =
  | { kind: typeof OPERATION_RESULT.SUCCESS; value: T }
  | { kind: typeof OPERATION_RESULT.FAILURE; status: number | null }
  | { kind: typeof OPERATION_RESULT.STALE }
  | { kind: typeof OPERATION_RESULT.BLOCKED }

interface UncertainMutation {
  routeKey: string
  sessionKey: string
  operation: string
}

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

function positiveRouteId(value: unknown): number | null {
  const candidate = Array.isArray(value) ? value[0] : value
  if (typeof candidate !== 'string' || candidate.trim() === '') return null
  const id = Number(candidate)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const currentView = computed<View | null>(() => {
  const path = route.path.replace(/\/+$/, '') || '/'
  if (path === '/organizacion/unidades') return VIEW.UNIT_LIST
  if (path === '/organizacion/recintos') return VIEW.PRECINCT_LIST
  if (path.startsWith('/organizacion/unidades/')) return VIEW.UNIT_DETAIL
  if (path.startsWith('/organizacion/recintos/')) return VIEW.PRECINCT_DETAIL
  return null
})

const currentResourceId = computed(() => {
  if (currentView.value === VIEW.UNIT_DETAIL) return positiveRouteId(route.params.idUnidad)
  if (currentView.value === VIEW.PRECINCT_DETAIL) return positiveRouteId(route.params.idRecinto)
  return null
})

const currentRouteKey = computed(() => `${currentView.value ?? 'outside'}:${currentResourceId.value ?? ''}`)

const permissionCodes = computed(() => session.context?.permissions ?? [])
const hasPermission = (permission: string): boolean => permissionCodes.value.includes(permission)

const canReadUnits = computed(() => hasPermission(PERMISSION.VIEW_UNIT))
const canCreateUnits = computed(() => hasPermission(PERMISSION.CREATE_UNIT))
const canUpdateUnits = computed(() => hasPermission(PERMISSION.UPDATE_UNIT))
const canDeleteUnits = computed(() => hasPermission(PERMISSION.DELETE_UNIT))
const canReadRecintos = computed(() => hasPermission(PERMISSION.VIEW_RECINTO))
const canManageRecintos = computed(() => hasPermission(PERMISSION.MANAGE_RECINTO))

const sessionFingerprint = computed(() => {
  const context = session.context
  const permissions = context?.permissions.join('\u001f') ?? ''
  return [
    session.status,
    session.generation,
    session.identity?.id_usuario ?? '',
    session.tenantCode.trim(),
    session.unitCode.trim(),
    context?.tenant.code ?? '',
    context?.tenant.context ?? '',
    context?.active_organization_unit ?? '',
    context?.unit_membership?.unit_code ?? '',
    permissions,
    session.identity?.must_change_password ? 'password-required' : '',
    session.uncertainMutation?.generation ?? '',
  ].join('|')
})

const sessionEligible = computed(() => {
  const context = session.context
  const identity = session.identity
  const tenantCode = session.tenantCode.trim()
  const unitCode = session.unitCode.trim()
  if (
    session.status !== SESSION_STATUS.READY
    || !context
    || !identity
    || identity.must_change_password
    || session.uncertainMutation
    || !tenantCode
    || !unitCode
    || context.user.id_usuario !== identity.id_usuario
    || context.tenant.code !== tenantCode
  ) return false

  return context.active_organization_unit === unitCode
    || context.unit_membership?.unit_code === unitCode
})

const unitRows = shallowRef<readonly OrganizationUnitRecord[]>([])
const unitListState = ref<LoadState>(LOAD_STATE.IDLE)
const unitListMessage = shallowRef<UiMessage | null>(null)
const unitRecord = shallowRef<OrganizationUnitRecord | null>(null)
const unitDetailState = ref<LoadState>(LOAD_STATE.IDLE)
const unitDetailMessage = shallowRef<UiMessage | null>(null)
const unitRelatedRecintos = shallowRef<readonly RecintoDTO[]>([])
const relatedRecintosState = ref<LoadState>(LOAD_STATE.IDLE)
const relatedRecintosMessage = shallowRef<UiMessage | null>(null)

const unitParentRecord = computed(() => {
  const parentCode = unitRecord.value?.parent_code
  if (!parentCode) return null
  return unitRows.value.find((unit) => unit.code === parentCode) ?? null
})

const recintoRows = shallowRef<readonly RecintoDTO[]>([])
const recintoListState = ref<LoadState>(LOAD_STATE.IDLE)
const recintoListMessage = shallowRef<UiMessage | null>(null)
const recintoRecord = shallowRef<RecintoDTO | null>(null)
const recintoDetailState = ref<LoadState>(LOAD_STATE.IDLE)
const recintoDetailMessage = shallowRef<UiMessage | null>(null)

const assignableUnits = shallowRef<readonly OrganizationUnitRecord[]>([])
const assignableState = ref<LoadState>(LOAD_STATE.IDLE)
const assignableMessage = shallowRef<UiMessage | null>(null)
const lookupUnits = shallowRef<readonly OrganizationUnitRecord[]>([])
const lookupState = ref<LoadState>(LOAD_STATE.IDLE)
const lookupMessage = shallowRef<UiMessage | null>(null)

const unitSearch = ref('')
const unitSort = ref<'name' | 'code'>('name')
const unitStateFilter = ref<StateFilter>(STATE_FILTER.ALL)
const unitDisplay = ref<'tree' | 'table'>('tree')
const expandedUnitCodes = shallowRef<ReadonlySet<string>>(new Set())
const selectedUnitId = ref<number | null>(null)
const recintoSearch = ref('')
const recintoSort = ref<'name' | 'code'>('name')
const recintoStateFilter = ref<StateFilter>(STATE_FILTER.ALL)
const unitLookupSearch = ref('')
const assignableSearch = ref('')

const unitDraft = reactive<UnitDraft>({
  code: '',
  name: '',
  parentId: '',
  unitType: UNIT_TYPE_EMPTY.VALUE,
  isActive: true,
})
const unitOriginal = shallowRef<OrganizationUnitRecord | null>(null)
const recintoDraft = reactive<RecintoDraft>({
  code: '',
  name: '',
  description: '',
  isActive: true,
  unitIds: [],
  unitsTouched: false,
})
const recintoOriginal = shallowRef<RecintoDTO | null>(null)

const modalKind = ref<ModalKind>(null)
const modalOpen = ref(false)
const modalToken = ref(0)
const modalMessage = shallowRef<UiMessage | null>(null)
const modalErrorFields = shallowRef<readonly ModalFieldError[]>([])
const replaceAllArmed = ref(false)
const migrationPreview = shallowRef<OrganizationUnitDeletionPreviewDTO | null>(null)
const migrationPreviewState = ref<LoadState>(LOAD_STATE.IDLE)
const migrationTargetSelection = ref('')
const migrationResult = shallowRef<DeleteOrganizationUnitWithMigrationResponseDTO | null>(null)
const relationUnitCode = ref('')
const pendingRelationUnitCode = ref('')
const relationReceipt = shallowRef<UiMessage | null>(null)
const operationNotice = shallowRef<UiMessage | null>(null)
const uncertainMutation = shallowRef<UncertainMutation | null>(null)
const reconciliationBusy = ref(false)

const activeRequests = new Map<string, OperationTicket>()
const requestAttempts = new Map<string, number>()
const pendingOperations = shallowRef<readonly string[]>([])
const pendingModalTokens = shallowRef<ReadonlySet<number>>(new Set())
let mounted = true

function syncPendingState(): void {
  const requests = Array.from(activeRequests.values())
  pendingOperations.value = requests.map((ticket) => ticket.operation)
  pendingModalTokens.value = new Set(
    requests.flatMap((ticket) => ticket.modalToken === null ? [] : [ticket.modalToken]),
  )
}

const anyOperationBusy = computed(() => pendingOperations.value.length > 0)
const modalBusy = computed(() => pendingModalTokens.value.has(modalToken.value))

const unitTitle = computed(() => {
  if (currentView.value === VIEW.UNIT_DETAIL) {
    return unitRecord.value?.name || unitRecord.value?.code || 'Ficha de unidad'
  }
  return 'Unidades'
})

const pageTitle = computed(() => {
  if (currentView.value === VIEW.UNIT_LIST) return 'Unidades organizacionales'
  if (currentView.value === VIEW.UNIT_DETAIL) return unitTitle.value
  if (currentView.value === VIEW.PRECINCT_LIST) return 'Recintos'
  if (currentView.value === VIEW.PRECINCT_DETAIL) {
    return recintoRecord.value?.name || recintoRecord.value?.code || 'Ficha de recinto'
  }
  return 'Organización'
})

const modalTitle = computed(() => {
  switch (modalKind.value) {
    case MODAL.UNIT_CREATE: return 'Crear unidad'
    case MODAL.UNIT_EDIT: return 'Editar unidad'
    case MODAL.UNIT_DELETE: return 'Eliminar unidad'
    case MODAL.UNIT_MIGRATION: return 'Eliminar y migrar contenido'
    case MODAL.UNIT_MIGRATION_RESULT: return 'Resultado de la eliminación'
    case MODAL.PRECINCT_CREATE: return 'Crear recinto'
    case MODAL.PRECINCT_EDIT: return 'Editar recinto'
    case MODAL.PRECINCT_DELETE: return 'Eliminar recinto'
    case MODAL.PRECINCT_ADD_UNIT: return 'Agregar unidad al recinto'
    case MODAL.PRECINCT_REMOVE_UNIT: return 'Quitar unidad del recinto'
    default: return ''
  }
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function errorStatus(error: unknown): number | null {
  return error instanceof OrganizationApiResponseError || error instanceof HttpRequestError
    ? error.status
    : null
}

function formFieldsForModal(): Readonly<Record<string, FormFieldMetadata>> | null {
  if (modalKind.value === MODAL.UNIT_CREATE || modalKind.value === MODAL.UNIT_EDIT) {
    return UNIT_FORM_FIELDS
  }
  if (modalKind.value === MODAL.PRECINCT_CREATE || modalKind.value === MODAL.PRECINCT_EDIT) {
    return RECINTO_FORM_FIELDS
  }
  if (modalKind.value === MODAL.UNIT_MIGRATION) return MIGRATION_FORM_FIELDS
  if (modalKind.value === MODAL.PRECINCT_ADD_UNIT) return RELATION_FORM_FIELDS
  return null
}

function stringErrorMessages(value: unknown): string[] {
  const candidates: readonly unknown[] = typeof value === 'string'
    ? [value]
    : Array.isArray(value) ? value : []
  return candidates.filter((candidate): candidate is string => (
    typeof candidate === 'string' && candidate.trim().length > 0
  ))
}

function fieldErrorsFromPayload(payload: unknown): ModalFieldError[] {
  if (!isRecord(payload)) return []
  const fields = formFieldsForModal()
  if (!fields) return []

  return Object.entries(fields).flatMap(([key, metadata]) => {
    const messages = stringErrorMessages(payload[key])
    return messages.length === 0
      ? []
      : [{ ...metadata, key, message: messages.join(' ') }]
  })
}

function validationFeedback(payload: unknown, error: unknown): string | null {
  const messages = isRecord(payload)
    ? [
      ...stringErrorMessages(payload.detail),
      ...stringErrorMessages(payload.non_field_errors),
    ]
    : []
  const detail = error instanceof OrganizationApiResponseError || error instanceof HttpRequestError
    ? error.detail
    : null
  if (detail && !messages.includes(detail)) messages.unshift(detail)
  return messages.length > 0 ? messages.join(' ') : null
}

function modalFieldError(field: string): ModalFieldError | null {
  return modalErrorFields.value.find((error) => error.key === field) ?? null
}

function payloadErrorText(payload: unknown): string | null {
  if (!isRecord(payload)) return null
  if (typeof payload.detail === 'string') return payload.detail

  const messages: string[] = []
  for (const [field, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      messages.push(`${field}: ${value}`)
      continue
    }
    if (Array.isArray(value)) {
      const fieldMessages = value.filter((item): item is string => typeof item === 'string')
      if (fieldMessages.length > 0) messages.push(`${field}: ${fieldMessages.join(' ')}`)
    }
  }
  return messages.length > 0 ? messages.join(' ') : null
}

function errorMessage(error: unknown): string {
  const status = errorStatus(error)
  if (error instanceof OrganizationApiResponseError) {
    const detail = error.detail ?? payloadErrorText(error.payload)
    if (detail) return detail
    if (status === 403) return 'El servidor denegó esta operación.'
    if (status === 404) return 'El recurso ya no está disponible.'
    if (status !== null && status >= 400 && status < 500) {
      return `El servidor rechazó la solicitud (${status}).`
    }
    return 'No fue posible interpretar la respuesta de Organización. Inténtalo de nuevo.'
  }
  if (error instanceof HttpRequestError) {
    const detail = error.detail ?? payloadErrorText(error.payload)
    if (detail) return detail
    if (status === 403) return 'El servidor denegó esta operación.'
    if (status !== null && status >= 400 && status < 500) {
      return `El servidor rechazó la solicitud (${status}).`
    }
  }
  return 'No fue posible completar la solicitud. Comprueba la conexión e inténtalo de nuevo.'
}

function messageForError(error: unknown): UiMessage {
  return {
    kind: errorStatus(error) === 403 ? MESSAGE_KIND.WARNING : MESSAGE_KIND.ERROR,
    text: errorMessage(error),
  }
}

function isUncertainMutationError(error: unknown): boolean {
  const status = errorStatus(error)
  return status === null || status < 400 || status >= 500
}

function connectionFor(ticket: OperationTicket): ApiConnection {
  return {
    tenantCode: ticket.tenantCode,
    unitCode: ticket.unitCode,
    signal: ticket.controller.signal,
  }
}

function beginTicket(
  operation: string,
  resourceKey: string,
  modalScoped: boolean,
): OperationTicket | null {
  if (!sessionEligible.value || !session.identity || !currentView.value) return null
  const scope = [operation, currentRouteKey.value, resourceKey, modalScoped ? modalToken.value : 'page'].join('|')
  const existing = activeRequests.get(scope)
  if (existing) {
    activeRequests.delete(scope)
    existing.controller.abort()
  }

  const attempt = (requestAttempts.get(scope) ?? 0) + 1
  requestAttempts.set(scope, attempt)
  const ticket: OperationTicket = {
    key: scope,
    routeKey: currentRouteKey.value,
    sessionKey: sessionFingerprint.value,
    resourceKey,
    operation,
    principalId: session.identity.id_usuario,
    generation: session.generation,
    tenantCode: session.tenantCode.trim(),
    unitCode: session.unitCode.trim(),
    attempt,
    modalToken: modalScoped ? modalToken.value : null,
    controller: new AbortController(),
  }
  activeRequests.set(scope, ticket)
  syncPendingState()
  return ticket
}

function ticketIsCurrent(ticket: OperationTicket): boolean {
  return mounted
    && activeRequests.get(ticket.key) === ticket
    && !ticket.controller.signal.aborted
    && sessionEligible.value
    && sessionFingerprint.value === ticket.sessionKey
    && currentRouteKey.value === ticket.routeKey
    && session.identity?.id_usuario === ticket.principalId
    && session.generation === ticket.generation
    && (ticket.modalToken === null
      || (modalOpen.value && modalToken.value === ticket.modalToken))
}

// Libera el estado pendiente del ticket. Idempotente: no toca nada si el ticket
// ya fue reemplazado, abortado o no es el vigente. Se invoca antes de los
// handlers para que `modalBusy` ya sea falso cuando `onSuccess` llama a
// `closeModal()`: con el ticket aún pendiente, su guarda anti doble-submit leía
// `modalBusy === true` y el modal no se cerraba tras una mutación exitosa.
function releaseTicket(ticket: OperationTicket): void {
  if (!ticketIsCurrent(ticket)) return
  activeRequests.delete(ticket.key)
  syncPendingState()
}

function abortAllRequests(): void {
  const pending = Array.from(activeRequests.values())
  activeRequests.clear()
  syncPendingState()
  for (const ticket of pending) ticket.controller.abort()
}

function abortModalRequests(token = modalToken.value): void {
  const modalRequests = Array.from(activeRequests.values())
    .filter((ticket) => ticket.modalToken === token)
  for (const ticket of modalRequests) {
    activeRequests.delete(ticket.key)
    ticket.controller.abort()
  }
  syncPendingState()
}

async function perform<T>(
  operation: string,
  resourceKey: string,
  request: (connection: ApiConnection) => Promise<T>,
  handlers: {
    modalScoped?: boolean
    mutation?: boolean
    onSuccess: (value: T, ticket: OperationTicket) => void
    onFailure: (error: unknown, ticket: OperationTicket) => void
  },
): Promise<OperationResult<T>> {
  if (handlers.mutation && uncertainMutation.value) {
    return { kind: OPERATION_RESULT.BLOCKED }
  }
  const ticket = beginTicket(operation, resourceKey, handlers.modalScoped ?? false)
  if (!ticket) return { kind: OPERATION_RESULT.STALE }

  try {
    const value = await request(connectionFor(ticket))
    if (!ticketIsCurrent(ticket)) return { kind: OPERATION_RESULT.STALE }
    releaseTicket(ticket)
    handlers.onSuccess(value, ticket)
    return { kind: OPERATION_RESULT.SUCCESS, value }
  } catch (error: unknown) {
    if (!ticketIsCurrent(ticket)) return { kind: OPERATION_RESULT.STALE }
    releaseTicket(ticket)
    handlers.onFailure(error, ticket)
    if (handlers.mutation && isUncertainMutationError(error)) {
      uncertainMutation.value = {
        routeKey: ticket.routeKey,
        sessionKey: ticket.sessionKey,
        operation: ticket.operation,
      }
    }
    return { kind: OPERATION_RESULT.FAILURE, status: errorStatus(error) }
  } finally {
    releaseTicket(ticket)
  }
}

function clearUnitDraft(): void {
  unitDraft.code = ''
  unitDraft.name = ''
  unitDraft.parentId = ''
  unitDraft.unitType = UNIT_TYPE_EMPTY.VALUE
  unitDraft.isActive = true
  unitOriginal.value = null
}

function clearRecintoDraft(): void {
  recintoDraft.code = ''
  recintoDraft.name = ''
  recintoDraft.description = ''
  recintoDraft.isActive = true
  recintoDraft.unitIds = []
  recintoDraft.unitsTouched = false
  recintoOriginal.value = null
}

function resetModalState(): void {
  abortModalRequests()
  modalKind.value = null
  modalMessage.value = null
  modalErrorFields.value = []
  replaceAllArmed.value = false
  migrationPreview.value = null
  migrationPreviewState.value = LOAD_STATE.IDLE
  migrationTargetSelection.value = ''
  migrationResult.value = null
  relationUnitCode.value = ''
  pendingRelationUnitCode.value = ''
  assignableUnits.value = []
  assignableState.value = LOAD_STATE.IDLE
  assignableMessage.value = null
  lookupUnits.value = []
  lookupState.value = LOAD_STATE.IDLE
  lookupMessage.value = null
  assignableSearch.value = ''
  unitLookupSearch.value = ''
  clearUnitDraft()
  clearRecintoDraft()
}

function closeModal(): void {
  if (modalBusy.value) return
  modalOpen.value = false
  resetModalState()
  modalToken.value += 1
}

function handleModalClose(): void {
  if (modalOpen.value) return
  resetModalState()
  modalToken.value += 1
}

function clearPageState(preserveSelection = false): void {
  unitRows.value = []
  unitListState.value = LOAD_STATE.IDLE
  unitListMessage.value = null
  unitRecord.value = null
  unitDetailState.value = LOAD_STATE.IDLE
  unitDetailMessage.value = null
  unitRelatedRecintos.value = []
  relatedRecintosState.value = LOAD_STATE.IDLE
  relatedRecintosMessage.value = null
  recintoRows.value = []
  recintoListState.value = LOAD_STATE.IDLE
  recintoListMessage.value = null
  recintoRecord.value = null
  recintoDetailState.value = LOAD_STATE.IDLE
  recintoDetailMessage.value = null
  relationReceipt.value = null
  operationNotice.value = null
  uncertainMutation.value = null
  reconciliationBusy.value = false
  unitSearch.value = ''
  recintoSearch.value = ''
  unitStateFilter.value = STATE_FILTER.ALL
  recintoStateFilter.value = STATE_FILTER.ALL
  unitDisplay.value = 'tree'
  expandedUnitCodes.value = new Set()
  if (!preserveSelection) selectedUnitId.value = null
  modalOpen.value = false
  resetModalState()
  modalToken.value += 1
}

function currentScopeIs(routeKey: string, sessionKey: string): boolean {
  return sessionEligible.value
    && currentRouteKey.value === routeKey
    && sessionFingerprint.value === sessionKey
}

function clearResourceMessages(): void {
  unitListMessage.value = null
  unitDetailMessage.value = null
  recintoListMessage.value = null
  recintoDetailMessage.value = null
}

function loadUnitList(resourceKey = currentRouteKey.value): Promise<OperationResult<readonly OrganizationUnitRecord[]>> {
  if (!canReadUnits.value) {
    unitListState.value = LOAD_STATE.DENIED
    unitListMessage.value = { kind: MESSAGE_KIND.WARNING, text: PERMISSION_MESSAGE.UNITS }
    return Promise.resolve({ kind: OPERATION_RESULT.BLOCKED })
  }
  unitListState.value = LOAD_STATE.LOADING
  unitListMessage.value = null
  return perform(
    'get-organization-units',
    resourceKey,
    getOrganizationUnits,
    {
      onSuccess: (records) => {
        unitRows.value = records
        unitListState.value = records.length === 0 ? LOAD_STATE.EMPTY : LOAD_STATE.READY
        unitListMessage.value = null
      },
      onFailure: (error) => {
        const message = messageForError(error)
        unitListState.value = errorStatus(error) === 403 ? LOAD_STATE.DENIED : LOAD_STATE.ERROR
        unitListMessage.value = message
      },
    },
  )
}

function loadRecintoList(resourceKey = currentRouteKey.value): Promise<OperationResult<readonly RecintoDTO[]>> {
  if (!canReadRecintos.value) {
    recintoListState.value = LOAD_STATE.DENIED
    recintoListMessage.value = { kind: MESSAGE_KIND.WARNING, text: PERMISSION_MESSAGE.RECINTOS }
    return Promise.resolve({ kind: OPERATION_RESULT.BLOCKED })
  }
  recintoListState.value = LOAD_STATE.LOADING
  recintoListMessage.value = null
  return perform(
    'get-recintos',
    resourceKey,
    getRecintos,
    {
      onSuccess: (records) => {
        recintoRows.value = records
        recintoListState.value = records.length === 0 ? LOAD_STATE.EMPTY : LOAD_STATE.READY
        recintoListMessage.value = null
      },
      onFailure: (error) => {
        recintoListState.value = errorStatus(error) === 403 ? LOAD_STATE.DENIED : LOAD_STATE.ERROR
        recintoListMessage.value = messageForError(error)
      },
    },
  )
}

async function loadUnitDetail(reconcile = false): Promise<{ confirmed: boolean; missing: boolean }> {
  const id = currentResourceId.value
  const viewKey = currentRouteKey.value
  const sessionKey = sessionFingerprint.value
  if (id === null) {
    unitDetailState.value = LOAD_STATE.ERROR
    unitDetailMessage.value = { kind: MESSAGE_KIND.ERROR, text: 'El parámetro idUnidad no es válido.' }
    return { confirmed: false, missing: false }
  }
  if (!canReadUnits.value) {
    unitDetailState.value = LOAD_STATE.DENIED
    unitDetailMessage.value = { kind: MESSAGE_KIND.WARNING, text: PERMISSION_MESSAGE.UNITS }
    return { confirmed: false, missing: false }
  }

  unitDetailState.value = LOAD_STATE.LOADING
  unitDetailMessage.value = null
  const result = await perform(
    'get-organization-unit',
    String(id),
    (connection) => getOrganizationUnit(id, connection),
    {
      onSuccess: (record) => {
        unitRecord.value = record
        unitDetailState.value = LOAD_STATE.READY
        unitDetailMessage.value = null
      },
      onFailure: (error) => {
        unitDetailState.value = errorStatus(error) === 403 ? LOAD_STATE.DENIED : LOAD_STATE.ERROR
        unitDetailMessage.value = messageForError(error)
      },
    },
  )
  if (!currentScopeIs(viewKey, sessionKey)) return { confirmed: false, missing: false }

  if (result.kind === OPERATION_RESULT.FAILURE && reconcile && result.status === 404) {
    return { confirmed: true, missing: true }
  }
  if (result.kind !== OPERATION_RESULT.SUCCESS) return { confirmed: false, missing: false }

  if (canReadUnits.value) void loadUnitList(viewKey)
  if (canReadRecintos.value) void loadUnitRelatedRecintos(result.value.code)
  return { confirmed: true, missing: false }
}

function loadUnitRelatedRecintos(unitCode: string): void {
  relatedRecintosState.value = LOAD_STATE.LOADING
  relatedRecintosMessage.value = null
  void perform(
    'get-unit-related-recintos',
    `unit:${unitCode}`,
    getRecintos,
    {
      onSuccess: (records) => {
        unitRelatedRecintos.value = records.filter((recinto) => recinto.unit_codes.includes(unitCode))
        relatedRecintosState.value = LOAD_STATE.READY
        relatedRecintosMessage.value = null
      },
      onFailure: (error) => {
        relatedRecintosState.value = errorStatus(error) === 403 ? LOAD_STATE.DENIED : LOAD_STATE.ERROR
        relatedRecintosMessage.value = messageForError(error)
      },
    },
  )
}

async function loadRecintoDetail(reconcile = false): Promise<{ confirmed: boolean; missing: boolean }> {
  const id = currentResourceId.value
  const viewKey = currentRouteKey.value
  const sessionKey = sessionFingerprint.value
  if (id === null) {
    recintoDetailState.value = LOAD_STATE.ERROR
    recintoDetailMessage.value = { kind: MESSAGE_KIND.ERROR, text: 'El parámetro idRecinto no es válido.' }
    return { confirmed: false, missing: false }
  }
  if (!canReadRecintos.value) {
    recintoDetailState.value = LOAD_STATE.DENIED
    recintoDetailMessage.value = { kind: MESSAGE_KIND.WARNING, text: PERMISSION_MESSAGE.RECINTOS }
    return { confirmed: false, missing: false }
  }

  recintoDetailState.value = LOAD_STATE.LOADING
  recintoDetailMessage.value = null
  const result = await perform(
    'get-recinto',
    String(id),
    (connection) => getRecinto(id, connection),
    {
      onSuccess: (record) => {
        recintoRecord.value = record
        recintoDetailState.value = LOAD_STATE.READY
        recintoDetailMessage.value = null
      },
      onFailure: (error) => {
        recintoDetailState.value = errorStatus(error) === 403 ? LOAD_STATE.DENIED : LOAD_STATE.ERROR
        recintoDetailMessage.value = messageForError(error)
      },
    },
  )
  if (!currentScopeIs(viewKey, sessionKey)) return { confirmed: false, missing: false }
  if (result.kind === OPERATION_RESULT.FAILURE && reconcile && result.status === 404) {
    return { confirmed: true, missing: true }
  }
  if (result.kind !== OPERATION_RESULT.SUCCESS) return { confirmed: false, missing: false }

  if (canReadUnits.value) void loadUnitLookup(viewKey)
  return { confirmed: true, missing: false }
}

async function loadCurrentRoute(reconcile = false): Promise<{ confirmed: boolean; missing: boolean }> {
  if (!sessionEligible.value) return { confirmed: false, missing: false }
  if (currentView.value === VIEW.UNIT_LIST) {
    const result = await loadUnitList()
    return { confirmed: result.kind === OPERATION_RESULT.SUCCESS, missing: false }
  }
  if (currentView.value === VIEW.UNIT_DETAIL) return loadUnitDetail(reconcile)
  if (currentView.value === VIEW.PRECINCT_LIST) {
    const result = await loadRecintoList()
    return { confirmed: result.kind === OPERATION_RESULT.SUCCESS, missing: false }
  }
  if (currentView.value === VIEW.PRECINCT_DETAIL) return loadRecintoDetail(reconcile)
  return { confirmed: false, missing: false }
}

async function reconcileCurrentResource(): Promise<void> {
  const uncertainty = uncertainMutation.value
  if (!uncertainty || reconciliationBusy.value || !sessionEligible.value) return
  const routeKey = currentRouteKey.value
  const sessionKey = sessionFingerprint.value
  if (uncertainty.routeKey !== routeKey || uncertainty.sessionKey !== sessionKey) return
  reconciliationBusy.value = true
  const outcome = await loadCurrentRoute(true)
  if (!currentScopeIs(routeKey, sessionKey)) return
  if (outcome.confirmed) {
    uncertainMutation.value = null
    operationNotice.value = {
      kind: MESSAGE_KIND.INFO,
      text: outcome.missing
        ? 'La lectura del servidor confirma que el recurso ya no está disponible.'
        : 'Estado actualizado desde el servidor. La operación anterior no se repitió.',
    }
    if (modalOpen.value) closeModal()
    if (outcome.missing && currentView.value === VIEW.UNIT_DETAIL) navigateTo('/organizacion/unidades')
    if (outcome.missing && currentView.value === VIEW.PRECINCT_DETAIL) navigateTo('/organizacion/recintos')
  }
  reconciliationBusy.value = false
}

function resetPageForRouteChange(previousView: View | null, nextView: View | null): void {
  const keepUnitSelection = previousView === VIEW.UNIT_DETAIL && nextView === VIEW.UNIT_LIST
  clearPageState(keepUnitSelection)
  clearResourceMessages()
}

watch(
  [() => sessionFingerprint.value, () => currentRouteKey.value],
  ([nextSessionKey, nextRouteKey], [previousSessionKey, previousRouteKey]) => {
    const sessionChanged = nextSessionKey !== previousSessionKey
    const routeChanged = nextRouteKey !== previousRouteKey
    if (sessionChanged) {
      clearPageState()
      abortAllRequests()
    } else if (routeChanged) {
      const previousView = previousRouteKey?.split(':')[0] as View | undefined
      resetPageForRouteChange(previousView ?? null, currentView.value)
      abortAllRequests()
    }
    if (sessionEligible.value && (sessionChanged || routeChanged)) void loadCurrentRoute()
  },
  { immediate: true, flush: 'sync' },
)

onBeforeUnmount(() => {
  mounted = false
  clearPageState()
  abortAllRequests()
})

function unitMatches(unit: OrganizationUnitRecord, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return true
  return [unit.code, unit.name, unit.parent_code ?? '', unit.unit_type]
    .some((value) => value.toLocaleLowerCase().includes(normalized))
}

// Filtro local por estado sobre el conjunto ya cargado; no altera las consultas de
// los selectores del modal (`unitMatches` sigue siendo solo texto).
function matchesStateFilter(isActive: boolean, filter: StateFilter): boolean {
  if (filter === STATE_FILTER.ACTIVE) return isActive
  if (filter === STATE_FILTER.INACTIVE) return !isActive
  return true
}

function unitPassesListFilters(unit: OrganizationUnitRecord): boolean {
  return unitMatches(unit, unitSearch.value)
    && matchesStateFilter(unit.is_active, unitStateFilter.value)
}

function clearUnitSearch(): void {
  unitSearch.value = ''
}

function clearUnitStateFilter(): void {
  unitStateFilter.value = STATE_FILTER.ALL
}

function clearRecintoSearch(): void {
  recintoSearch.value = ''
}

function clearRecintoStateFilter(): void {
  recintoStateFilter.value = STATE_FILTER.ALL
}

function sortUnits(records: readonly OrganizationUnitRecord[]): OrganizationUnitRecord[] {
  return [...records].sort((left, right) => {
    const leftValue = unitSort.value === 'code' ? left.code : left.name
    const rightValue = unitSort.value === 'code' ? right.code : right.name
    return leftValue.localeCompare(rightValue, undefined, { sensitivity: 'base' })
      || left.code.localeCompare(right.code, undefined, { sensitivity: 'base' })
  })
}

function hasUnitCycle(parentCode: string, childCode: string, byCode: ReadonlyMap<string, OrganizationUnitRecord>): boolean {
  let cursor: string | null = parentCode
  const visited = new Set<string>()
  while (cursor && byCode.has(cursor)) {
    if (cursor === childCode || visited.has(cursor)) return true
    visited.add(cursor)
    cursor = byCode.get(cursor)?.parent_code ?? null
  }
  return false
}

const treeRows = computed<readonly UnitTreeRow[]>(() => {
  const byCode = new Map(unitRows.value.map((unit) => [unit.code, unit]))
  const children = new Map<string, OrganizationUnitRecord[]>()
  const roots: OrganizationUnitRecord[] = []
  for (const unit of unitRows.value) {
    const parentCode = unit.parent_code
    if (parentCode && byCode.has(parentCode) && !hasUnitCycle(parentCode, unit.code, byCode)) {
      const siblings = children.get(parentCode) ?? []
      siblings.push(unit)
      children.set(parentCode, siblings)
    } else {
      roots.push(unit)
    }
  }

  const result: UnitTreeRow[] = []
  const visited = new Set<string>()
  const walk = (unit: OrganizationUnitRecord, depth: number, ancestors: readonly string[]): void => {
    if (visited.has(unit.code)) return
    visited.add(unit.code)
    const childUnits = sortUnits(children.get(unit.code) ?? [])
    result.push({
      unit,
      depth,
      ancestors,
      hasChildren: childUnits.length > 0,
      unresolvedParentCode: unit.parent_code && !byCode.has(unit.parent_code) ? unit.parent_code : null,
    })
    for (const child of childUnits) walk(child, depth + 1, [...ancestors, unit.code])
  }

  for (const root of sortUnits(roots)) walk(root, 0, [])
  for (const unit of sortUnits(unitRows.value)) {
    if (!visited.has(unit.code)) walk(unit, 0, [])
  }

  const query = unitSearch.value.trim()
  return result.filter((row) => unitMatches(row.unit, query) && matchesStateFilter(row.unit.is_active, unitStateFilter.value))
})

const flatUnitRows = computed(() => sortUnits(unitRows.value.filter(unitPassesListFilters)))

const unitFilteredEmptyMessage = computed(() => (
  unitSearch.value.trim()
    ? 'Ninguna unidad coincide con la búsqueda.'
    : 'Ninguna unidad coincide con el filtro de estado.'
))

const recintoFilteredEmptyMessage = computed(() => (
  recintoSearch.value.trim()
    ? 'Ningún recinto coincide con la búsqueda.'
    : 'Ningún recinto coincide con el filtro de estado.'
))

function isTreeRowVisible(row: UnitTreeRow): boolean {
  if (unitSearch.value.trim()) return true
  return row.ancestors.every((code) => expandedUnitCodes.value.has(code))
}

function toggleUnitBranch(code: string): void {
  const next = new Set(expandedUnitCodes.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  expandedUnitCodes.value = next
}

const filteredRecintos = computed(() => {
  const query = recintoSearch.value.trim().toLocaleLowerCase()
  return [...recintoRows.value]
    .filter((recinto) => matchesStateFilter(recinto.is_active, recintoStateFilter.value)
      && (!query || [
        recinto.code,
        recinto.name,
        recinto.description,
        ...recinto.unit_codes,
      ].some((value) => value.toLocaleLowerCase().includes(query))))
    .sort((left, right) => {
      const leftValue = recintoSort.value === 'code' ? left.code : left.name
      const rightValue = recintoSort.value === 'code' ? right.code : right.name
      return leftValue.localeCompare(rightValue, undefined, { sensitivity: 'base' })
        || left.code.localeCompare(right.code, undefined, { sensitivity: 'base' })
    })
})

const filteredAssignableUnits = computed(() => {
  const query = assignableSearch.value.trim().toLocaleLowerCase()
  return sortUnits(assignableUnits.value.filter((unit) => unitMatches(unit, query)))
})

const filteredLookupUnits = computed(() => {
  const query = unitLookupSearch.value.trim().toLocaleLowerCase()
  return sortUnits(lookupUnits.value.filter((unit) => unitMatches(unit, query)))
})

const unitNamesByCode = computed(() => new Map(lookupUnits.value.map((unit) => [unit.code, unit.name])))

const migrationPreviewMatchesCurrentUnit = computed(() => (
  !!unitRecord.value
  && !!migrationPreview.value
  && migrationPreview.value.unit_code === unitRecord.value.code
  && migrationPreview.value.unit_name === unitRecord.value.name
  && currentView.value === VIEW.UNIT_DETAIL
  && currentResourceId.value === unitRecord.value.id
))

const migrationCanConfirm = computed(() => {
  if (
    modalKind.value !== MODAL.UNIT_MIGRATION
    || !migrationPreviewMatchesCurrentUnit.value
    || migrationPreviewState.value !== LOAD_STATE.READY
    || modalBusy.value
    || uncertainMutation.value
  ) return false
  if (migrationTargetSelection.value === '__parent__') {
    return migrationPreview.value?.parent_code !== null
  }
  return filteredAssignableUnits.value.some((unit) => (
    unit.code === migrationTargetSelection.value && unit.code !== unitRecord.value?.code
  ))
})

// Validación al intentar enviar (regla UI/UX §4): el botón no nace deshabilitado; el
// intento marca los campos y lleva el foco al primero. Mismo estado visual que los
// errores del servidor (`is-invalid` + `aria-invalid` vía `modalFieldError`).
function unitFormFieldErrors(): ModalFieldError[] {
  const errors: ModalFieldError[] = []
  if (!unitDraft.code.trim()) {
    errors.push({ ...UNIT_FORM_FIELDS.code, key: 'code', message: 'Indica el código de la unidad.' })
  }
  if (!unitDraft.name.trim()) {
    errors.push({ ...UNIT_FORM_FIELDS.name, key: 'name', message: 'Indica el nombre de la unidad.' })
  }
  const unitTypeKnown = unitDraft.unitType === UNIT_TYPE_EMPTY.VALUE
    || UNIT_TYPE_OPTIONS.some((option) => option.value === unitDraft.unitType)
  if (!unitTypeKnown) {
    errors.push({ ...UNIT_FORM_FIELDS.unit_type, key: 'unit_type', message: 'Selecciona un tipo de unidad válido.' })
  } else if (modalKind.value === MODAL.UNIT_EDIT && unitDraft.unitType === UNIT_TYPE_EMPTY.VALUE) {
    errors.push({ ...UNIT_FORM_FIELDS.unit_type, key: 'unit_type', message: 'Selecciona el tipo de unidad.' })
  }
  return errors
}

function recintoFormFieldErrors(): ModalFieldError[] {
  const errors: ModalFieldError[] = []
  if (!recintoDraft.code.trim()) {
    errors.push({ ...RECINTO_FORM_FIELDS.code, key: 'code', message: 'Indica el código del recinto.' })
  }
  if (!recintoDraft.name.trim()) {
    errors.push({ ...RECINTO_FORM_FIELDS.name, key: 'name', message: 'Indica el nombre del recinto.' })
  }
  return errors
}

function reportLocalFieldErrors(errors: readonly ModalFieldError[]): void {
  modalErrorFields.value = errors
  modalMessage.value = { kind: MESSAGE_KIND.ERROR, text: 'Revisa los campos marcados antes de guardar.' }
  const first = errors[0]
  if (first) document.getElementById(first.inputId)?.focus()
}

const selectedLookupUnit = computed(() => filteredLookupUnits.value
  .find((unit) => unit.code === relationUnitCode.value) ?? null)

const modalHasForm = computed(() => (
  modalKind.value === MODAL.UNIT_CREATE
  || modalKind.value === MODAL.UNIT_EDIT
  || modalKind.value === MODAL.PRECINCT_CREATE
  || modalKind.value === MODAL.PRECINCT_EDIT
))

function failureLoadState(error: unknown): LoadState {
  return errorStatus(error) === 403 ? LOAD_STATE.DENIED : LOAD_STATE.ERROR
}

function display(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

function navigateTo(path: string): void {
  const expectedSession = sessionFingerprint.value
  const expectedRoute = currentRouteKey.value
  void router.push({ path }).catch(() => {
    if (!sessionEligible.value || sessionFingerprint.value !== expectedSession) return
    if (currentRouteKey.value !== expectedRoute) return
    operationNotice.value = {
      kind: MESSAGE_KIND.ERROR,
      text: 'No fue posible abrir la ruta solicitada.',
    }
  })
}

function refreshCurrentRoute(): void {
  clearResourceMessages()
  void loadCurrentRoute()
}

function selectedUnit(unit: OrganizationUnitRecord): void {
  selectedUnitId.value = unit.id
}

function unitDetailPath(id: number): string {
  return `/organizacion/unidades/${id}`
}

function recintoDetailPath(id: number): string {
  return `/organizacion/recintos/${id}`
}

function beginModal(kind: Exclude<ModalKind, null>): void {
  if (!sessionEligible.value || modalBusy.value) return
  resetModalState()
  modalToken.value += 1
  modalKind.value = kind
  modalOpen.value = true
  modalMessage.value = null
  operationNotice.value = null
}

function openUnitCreate(): void {
  if (!canCreateUnits.value || uncertainMutation.value) return
  beginModal(MODAL.UNIT_CREATE)
  if (canReadUnits.value) void loadAssignableUnitChoices()
}

function openUnitEdit(): void {
  const unit = unitRecord.value
  if (!canUpdateUnits.value || !unit || uncertainMutation.value) return
  beginModal(MODAL.UNIT_EDIT)
  unitOriginal.value = unit
  unitDraft.code = unit.code
  unitDraft.name = unit.name
  unitDraft.parentId = unit.parent === null ? '' : String(unit.parent)
  unitDraft.unitType = unit.unit_type
  unitDraft.isActive = unit.is_active
  void loadAssignableUnitChoices()
}

function openUnitSimpleDelete(): void {
  if (!canDeleteUnits.value || !unitRecord.value || uncertainMutation.value) return
  beginModal(MODAL.UNIT_DELETE)
  migrationPreviewState.value = LOAD_STATE.LOADING
  void loadMigrationPreview()
}

function openUnitMigration(): void {
  if (!canDeleteUnits.value || !unitRecord.value || uncertainMutation.value) return
  beginModal(MODAL.UNIT_MIGRATION)
  migrationPreviewState.value = LOAD_STATE.LOADING
  void loadMigrationPreview()
  void loadAssignableUnitChoices()
}

function openRecintoCreate(): void {
  if (!canManageRecintos.value || uncertainMutation.value) return
  beginModal(MODAL.PRECINCT_CREATE)
  if (canReadUnits.value) void loadUnitLookup()
}

function openRecintoEdit(): void {
  const recinto = recintoRecord.value
  if (!canManageRecintos.value || !recinto || uncertainMutation.value) return
  beginModal(MODAL.PRECINCT_EDIT)
  recintoOriginal.value = recinto
  recintoDraft.code = recinto.code
  recintoDraft.name = recinto.name
  recintoDraft.description = recinto.description
  recintoDraft.isActive = recinto.is_active
  recintoDraft.unitIds = [...recinto.units]
  recintoDraft.unitsTouched = false
  if (canReadUnits.value) void loadUnitLookup()
}

function openRecintoDelete(): void {
  if (!canManageRecintos.value || !recintoRecord.value || uncertainMutation.value) return
  beginModal(MODAL.PRECINCT_DELETE)
}

function openAddUnitToRecinto(): void {
  if (!canManageRecintos.value || !canReadUnits.value || !recintoRecord.value || uncertainMutation.value) return
  beginModal(MODAL.PRECINCT_ADD_UNIT)
  void loadUnitLookup()
}

function openRemoveUnitFromRecinto(unitCode: string): void {
  const recinto = recintoRecord.value
  if (
    !canManageRecintos.value
    || !recinto
    || !recinto.unit_codes.includes(unitCode)
    || uncertainMutation.value
  ) return
  beginModal(MODAL.PRECINCT_REMOVE_UNIT)
  pendingRelationUnitCode.value = unitCode
}

function loadAssignableUnitChoices(): void {
  assignableState.value = LOAD_STATE.LOADING
  assignableMessage.value = null
  void perform(
    'get-assignable-organization-units',
    'assignable-units',
    getAssignableUnits,
    {
      modalScoped: true,
      onSuccess: (response) => {
        assignableUnits.value = response.results
        assignableState.value = response.results.length === 0 ? LOAD_STATE.EMPTY : LOAD_STATE.READY
        assignableMessage.value = null
      },
      onFailure: (error) => {
        assignableState.value = failureLoadState(error)
        assignableMessage.value = messageForError(error)
      },
    },
  )
}

function loadUnitLookup(resourceKey = 'unit-lookup'): void {
  if (!canReadUnits.value) {
    lookupState.value = LOAD_STATE.DENIED
    lookupMessage.value = { kind: MESSAGE_KIND.WARNING, text: PERMISSION_MESSAGE.UNITS }
    return
  }
  lookupState.value = LOAD_STATE.LOADING
  lookupMessage.value = null
  void perform(
    'lookup-organization-units',
    resourceKey,
    getOrganizationUnitsLookup,
    {
      modalScoped: resourceKey === 'unit-lookup' || resourceKey === 'form-unit-lookup',
      onSuccess: (response) => {
        lookupUnits.value = response.results
        lookupState.value = response.results.length === 0 ? LOAD_STATE.EMPTY : LOAD_STATE.READY
        lookupMessage.value = null
      },
      onFailure: (error) => {
        lookupState.value = failureLoadState(error)
        lookupMessage.value = messageForError(error)
      },
    },
  )
}

function loadMigrationPreview(): void {
  const unit = unitRecord.value
  if (!unit || currentResourceId.value !== unit.id) return
  migrationPreviewState.value = LOAD_STATE.LOADING
  migrationPreview.value = null
  void perform(
    'preview-organization-unit-deletion',
    String(unit.id),
    (connection) => previewOrganizationUnitDeletion(unit.id, connection),
    {
      modalScoped: true,
      onSuccess: (preview) => {
        migrationPreview.value = preview
        const matches = preview.unit_code === unit.code && preview.unit_name === unit.name
        migrationPreviewState.value = matches ? LOAD_STATE.READY : LOAD_STATE.ERROR
        if (!matches) {
          modalMessage.value = {
            kind: MESSAGE_KIND.ERROR,
            text: 'La previsualización no corresponde a la unidad seleccionada. No se habilitó la confirmación.',
          }
        }
      },
      onFailure: (error) => {
        migrationPreviewState.value = failureLoadState(error)
        modalMessage.value = messageForError(error)
      },
    },
  )
}

function unitParentId(): number | null {
  if (!unitDraft.parentId) return null
  const parentId = Number(unitDraft.parentId)
  return Number.isSafeInteger(parentId) && parentId > 0 ? parentId : null
}

function unitWriteValues(): CreateOrganizationUnitBody {
  return {
    code: unitDraft.code.trim(),
    name: unitDraft.name.trim(),
    parent: unitParentId(),
    is_active: unitDraft.isActive,
    ...(unitDraft.unitType === UNIT_TYPE_EMPTY.VALUE
      ? {}
      : { unit_type: unitDraft.unitType }),
  }
}

function unitReplaceValues(): ReplaceOrganizationUnitBody | null {
  const unitType = unitDraft.unitType
  if (unitType === UNIT_TYPE_EMPTY.VALUE) return null
  return {
    code: unitDraft.code.trim(),
    name: unitDraft.name.trim(),
    parent: unitParentId(),
    unit_type: unitType,
    is_active: unitDraft.isActive,
  }
}

function changedUnitFields(): PatchOrganizationUnitBody {
  const original = unitOriginal.value
  const current = unitWriteValues()
  if (!original) return current
  const changed: {
    code?: string
    name?: string
    parent?: number | null
    unit_type?: OrganizationUnitType
    is_active?: boolean
  } = {}
  if (current.code !== original.code) changed.code = current.code
  if (current.name !== original.name) changed.name = current.name
  if (current.parent !== original.parent) changed.parent = current.parent ?? null
  if (current.unit_type !== undefined && current.unit_type !== original.unit_type) changed.unit_type = current.unit_type
  if (current.is_active !== original.is_active) changed.is_active = current.is_active
  return changed
}

function reportModalFailure(error: unknown): void {
  const status = errorStatus(error)
  if (status === 400) {
    const payload = error instanceof OrganizationApiResponseError || error instanceof HttpRequestError
      ? error.payload
      : undefined
    const fieldErrors = fieldErrorsFromPayload(payload)
    const hiddenFieldErrors = fieldErrors.filter((field) => (
      field.key === 'units' && !canReadUnits.value
    ))
    modalErrorFields.value = fieldErrors
    modalMessage.value = {
      kind: MESSAGE_KIND.ERROR,
      text: validationFeedback(payload, error)
        ?? (hiddenFieldErrors.length > 0
          ? hiddenFieldErrors.map((field) => `${field.label}: ${field.message}`).join(' ')
          : fieldErrors.length > 0
            ? 'El servidor rechazó los campos indicados.'
            : 'El servidor rechazó la solicitud (400).'),
    }
    return
  }
  modalErrorFields.value = []
  modalMessage.value = messageForError(error)
}

function saveUnitForm(method: 'create' | 'put' | 'patch'): void {
  if (modalBusy.value || uncertainMutation.value) return
  if (method === 'create' && !canCreateUnits.value) return
  if (method !== 'create' && !canUpdateUnits.value) return
  modalMessage.value = null
  modalErrorFields.value = []
  const fieldErrors = unitFormFieldErrors()
  if (fieldErrors.length > 0) {
    reportLocalFieldErrors(fieldErrors)
    return
  }
  const patchBody = method === 'patch' ? changedUnitFields() : null
  if (patchBody && Object.keys(patchBody).length === 0) {
    modalMessage.value = { kind: MESSAGE_KIND.INFO, text: 'No hay campos modificados para enviar.' }
    return
  }
  const currentId = currentResourceId.value
  if (method !== 'create' && currentId === null) return

  let request: (connection: ApiConnection) => Promise<OrganizationUnitRecord>
  if (method === 'create') {
    const createBody = unitWriteValues()
    request = (connection) => createOrganizationUnit(createBody, connection)
  } else if (method === 'put') {
    if (currentId === null) return
    const replaceBody = unitReplaceValues()
    if (!replaceBody) return
    request = (connection) => replaceOrganizationUnit(currentId, replaceBody, connection)
  } else {
    if (currentId === null || !patchBody) return
    request = (connection) => patchOrganizationUnit(currentId, patchBody, connection)
  }

  void perform(
    method === 'create' ? 'create-organization-unit' : `${method}-organization-unit`,
    method === 'create' ? 'organization-units' : String(currentId),
    request,
    {
      modalScoped: true,
      mutation: true,
      onSuccess: (record) => {
        operationNotice.value = {
          kind: MESSAGE_KIND.SUCCESS,
          text: method === 'create'
            ? `Unidad creada: ${record.code} — ${record.name}.`
            : `Unidad actualizada: ${record.code} — ${record.name}.`,
        }
        if (method === 'create') {
          unitRows.value = [...unitRows.value.filter((item) => item.id !== record.id), record]
        } else {
          unitRecord.value = record
        }
        closeModal()
        void loadUnitList(currentRouteKey.value)
        if (method !== 'create') {
          void perform(
            'refresh-organization-unit-detail',
            String(record.id),
            (connection) => getOrganizationUnit(record.id, connection),
            {
              onSuccess: (freshRecord) => { unitRecord.value = freshRecord },
              onFailure: (error) => {
                unitDetailMessage.value = messageForError(error)
                unitDetailState.value = failureLoadState(error)
              },
            },
          )
        }
      },
      onFailure: reportModalFailure,
    },
  )
}

function currentRecintoBody(): CreateRecintoBody {
  return {
    code: recintoDraft.code.trim(),
    name: recintoDraft.name.trim(),
    description: recintoDraft.description,
    is_active: recintoDraft.isActive,
    ...(recintoDraft.unitsTouched || recintoOriginal.value ? { units: [...recintoDraft.unitIds] } : {}),
  }
}

function changedRecintoBody(): PatchRecintoBody {
  const original = recintoOriginal.value
  const current = currentRecintoBody()
  if (!original) return current
  const changed: {
    code?: string
    name?: string
    description?: string
    is_active?: boolean
    units?: readonly number[]
  } = {}
  if (current.code !== original.code) changed.code = current.code
  if (current.name !== original.name) changed.name = current.name
  if (current.description !== original.description) changed.description = current.description
  if (current.is_active !== original.is_active) changed.is_active = current.is_active
  const originalUnits = [...original.units].sort((left, right) => left - right)
  const currentUnits = [...recintoDraft.unitIds].sort((left, right) => left - right)
  if (JSON.stringify(originalUnits) !== JSON.stringify(currentUnits)) changed.units = currentUnits
  return changed
}

async function saveRecintoForm(method: 'create' | 'put' | 'patch'): Promise<void> {
  if (modalBusy.value || uncertainMutation.value) return
  if (method === 'create' && !canManageRecintos.value) return
  if (method !== 'create' && !canManageRecintos.value) return
  const id = currentResourceId.value
  if (method !== 'create' && id === null) return
  const routeKey = currentRouteKey.value
  const sessionKey = sessionFingerprint.value
  modalMessage.value = null
  modalErrorFields.value = []
  const fieldErrors = recintoFormFieldErrors()
  if (fieldErrors.length > 0) {
    reportLocalFieldErrors(fieldErrors)
    return
  }

  let request: (connection: ApiConnection) => Promise<RecintoDTO>
  if (method === 'create') {
    const body = currentRecintoBody()
    request = (connection) => createRecinto(body, connection)
  } else if (method === 'put') {
    if (id === null) return
    const body = currentRecintoBody()
    request = (connection) => replaceRecinto(id, body, connection)
  } else {
    if (id === null) return
    const body = changedRecintoBody()
    if (Object.keys(body).length === 0) {
      modalMessage.value = { kind: MESSAGE_KIND.INFO, text: 'No hay campos modificados para enviar.' }
      return
    }
    request = (connection) => patchRecinto(id, body, connection)
  }

  const result = await perform(
    method === 'create' ? 'create-recinto' : `${method}-recinto`,
    method === 'create' ? 'recintos' : String(id),
    request,
    {
      modalScoped: true,
      mutation: true,
      onSuccess: (record) => {
        operationNotice.value = {
          kind: MESSAGE_KIND.SUCCESS,
          text: method === 'create'
            ? `Recinto creado: ${record.code} — ${record.name}.`
            : `Recinto actualizado: ${record.code} — ${record.name}.`,
        }
        if (method === 'create') {
          recintoRows.value = [...recintoRows.value.filter((item) => item.id !== record.id), record]
        } else {
          recintoRecord.value = record
        }
        closeModal()
        if (method !== 'create') {
          void loadRecintoList(currentRouteKey.value)
          void perform(
            'refresh-recinto-detail',
            String(record.id),
            (connection) => getRecinto(record.id, connection),
            {
              onSuccess: (freshRecord) => { recintoRecord.value = freshRecord },
              onFailure: (error) => {
                recintoDetailMessage.value = messageForError(error)
                recintoDetailState.value = failureLoadState(error)
              },
            },
          )
        }
      },
      onFailure: reportModalFailure,
    },
  )

  if (method !== 'create' || result.kind !== OPERATION_RESULT.SUCCESS) return
  if (!currentScopeIs(routeKey, sessionKey)) return
  await loadRecintoList(routeKey)
  if (!currentScopeIs(routeKey, sessionKey)) return
  navigateTo(recintoDetailPath(result.value.id))
}

function confirmSimpleUnitDelete(): void {
  const unit = unitRecord.value
  if (!unit || !canDeleteUnits.value || modalBusy.value || uncertainMutation.value) return
  modalMessage.value = null
  void perform(
    'delete-organization-unit-simple',
    String(unit.id),
    (connection) => deleteOrganizationUnit(unit.id, connection),
    {
      modalScoped: true,
      mutation: true,
      onSuccess: () => {
        closeModal()
        navigateTo('/organizacion/unidades')
      },
      onFailure: reportModalFailure,
    },
  )
}

function confirmUnitMigration(): void {
  const unit = unitRecord.value
  if (!unit || !canDeleteUnits.value || !migrationCanConfirm.value) return
  const body = migrationTargetSelection.value === '__parent__'
    ? {}
    : { target_unit_code: migrationTargetSelection.value }
  modalMessage.value = null
  void perform(
    'delete-organization-unit-with-migration',
    String(unit.id),
    (connection) => deleteOrganizationUnitWithMigration(unit.id, body, connection),
    {
      modalScoped: true,
      mutation: true,
      onSuccess: (response) => {
        migrationResult.value = response
        modalKind.value = MODAL.UNIT_MIGRATION_RESULT
        operationNotice.value = { kind: MESSAGE_KIND.SUCCESS, text: response.detail }
        void loadUnitList(currentRouteKey.value)
        if (canReadRecintos.value) {
          void perform(
            'refresh-recintos-after-unit-migration',
            'recintos',
            getRecintos,
            {
              onSuccess: (records) => {
                recintoRows.value = records
                if (unitRecord.value) {
                  unitRelatedRecintos.value = records.filter((recinto) => recinto.unit_codes.includes(unitRecord.value?.code ?? ''))
                }
              },
              onFailure: (error) => { relatedRecintosMessage.value = messageForError(error) },
            },
          )
        }
      },
      onFailure: reportModalFailure,
    },
  )
}

function returnToUnitTree(): void {
  if (modalBusy.value) return
  closeModal()
  navigateTo('/organizacion/unidades')
}

function confirmRecintoDelete(): void {
  const recinto = recintoRecord.value
  if (!recinto || !canManageRecintos.value || modalBusy.value || uncertainMutation.value) return
  modalMessage.value = null
  void perform(
    'delete-recinto',
    String(recinto.id),
    (connection) => deleteRecinto(recinto.id, connection),
    {
      modalScoped: true,
      mutation: true,
      onSuccess: () => {
        closeModal()
        navigateTo('/organizacion/recintos')
      },
      onFailure: reportModalFailure,
    },
  )
}

function confirmAddUnitToRecinto(): void {
  const recinto = recintoRecord.value
  const selected = selectedLookupUnit.value
  if (!recinto || !selected || !canManageRecintos.value || modalBusy.value || uncertainMutation.value) return
  if (recinto.unit_codes.includes(selected.code)) {
    modalMessage.value = { kind: MESSAGE_KIND.INFO, text: 'Esta unidad ya aparece relacionada en la respuesta del recinto.' }
    return
  }
  void perform(
    'add-unit-to-recinto',
    `${recinto.id}:${selected.code}`,
    (connection) => addUnitToRecinto(recinto.id, selected.code, connection),
    {
      modalScoped: true,
      mutation: true,
      onSuccess: (response) => {
        relationReceipt.value = {
          kind: MESSAGE_KIND.SUCCESS,
          text: response.unit_count === undefined
            ? response.detail
            : `${response.detail} Conteo devuelto: ${response.unit_count}.`,
        }
        if (response.unit_count !== undefined && recintoRecord.value) {
          recintoRecord.value = { ...recintoRecord.value, unit_count: response.unit_count }
        }
        closeModal()
        if (canReadRecintos.value) {
          loadUnitRelatedRecintos(selected.code)
        }
        void refreshRecintoDetailAfterRelation(recinto.id)
      },
      onFailure: reportModalFailure,
    },
  )
}

function confirmRemoveUnitFromRecinto(): void {
  const recinto = recintoRecord.value
  const unitCode = pendingRelationUnitCode.value
  if (
    !recinto
    || !unitCode
    || !recinto.unit_codes.includes(unitCode)
    || !canManageRecintos.value
    || modalBusy.value
    || uncertainMutation.value
  ) return
  void perform(
    'remove-unit-from-recinto',
    `${recinto.id}:${unitCode}`,
    (connection) => removeUnitFromRecinto(recinto.id, unitCode, connection),
    {
      modalScoped: true,
      mutation: true,
      onSuccess: (response) => {
        relationReceipt.value = {
          kind: MESSAGE_KIND.SUCCESS,
          text: `${response.detail} Conteo devuelto: ${response.unit_count}.`,
        }
        recintoRecord.value = { ...recinto, unit_count: response.unit_count }
        closeModal()
        void refreshRecintoDetailAfterRelation(recinto.id)
      },
      onFailure: reportModalFailure,
    },
  )
}

function refreshRecintoDetailAfterRelation(id: number): void {
  if (currentView.value !== VIEW.PRECINCT_DETAIL || currentResourceId.value !== id) return
  recintoDetailState.value = LOAD_STATE.LOADING
  void perform(
    'refresh-recinto-after-unit-relation',
    String(id),
    (connection) => getRecinto(id, connection),
    {
      onSuccess: (record) => {
        recintoRecord.value = record
        recintoDetailState.value = LOAD_STATE.READY
        recintoDetailMessage.value = null
      },
      onFailure: (error) => {
        recintoDetailState.value = failureLoadState(error)
        recintoDetailMessage.value = messageForError(error)
      },
    },
  )
}

function unitRelatedName(code: string): string {
  return unitNamesByCode.value.get(code) ?? '—'
}

function unitLookupOptionLabel(unit: OrganizationUnitRecord): string {
  return `${unit.code} — ${unit.name}`
}

const unresolvedCurrentUnitIds = computed(() => {
  const knownIds = new Set(lookupUnits.value.map((unit) => unit.id))
  return recintoDraft.unitIds.filter((id) => !knownIds.has(id))
})

function unitTypeLabel(unitType: OrganizationUnitType): string {
  return UNIT_TYPE_OPTIONS.find((option) => option.value === unitType)?.label ?? unitType
}

function armReplaceAll(): void {
  if (modalBusy.value) return
  replaceAllArmed.value = true
}

function disarmReplaceAll(): void {
  replaceAllArmed.value = false
}

function handleUnitFormSubmit(event: SubmitEvent): void {
  event.preventDefault()
  if (modalKind.value === MODAL.UNIT_CREATE) saveUnitForm('create')
  else saveUnitForm('patch')
}

async function handleRecintoFormSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault()
  if (modalKind.value === MODAL.PRECINCT_CREATE) await saveRecintoForm('create')
  else await saveRecintoForm('patch')
}

const activePageMessage = computed(() => {
  if (!sessionEligible.value) return 'Tu sesión aún no está lista. Vuelve a iniciar sesión para consultar la organización.'
  if (currentView.value === VIEW.UNIT_LIST && !canReadUnits.value) return PERMISSION_MESSAGE.UNITS
  if (currentView.value === VIEW.UNIT_DETAIL && !canReadUnits.value) return PERMISSION_MESSAGE.UNITS
  if (currentView.value === VIEW.PRECINCT_LIST && !canReadRecintos.value) return PERMISSION_MESSAGE.RECINTOS
  if (currentView.value === VIEW.PRECINCT_DETAIL && !canReadRecintos.value) return PERMISSION_MESSAGE.RECINTOS
  return null
})
</script>

<template>
  <section class="page-content organization-view">
    <div class="organization-view__content">
      <header class="organization-view__header">
        <div>
          <h1 class="organization-view__title">{{ pageTitle }}</h1>
          <nav class="breadcrumb organization-view__breadcrumb" aria-label="Ruta de navegación">
            <RouterLink to="/">Inicio</RouterLink>
            <span aria-hidden="true">›</span>
            <span>Organización</span>
            <template v-if="currentView === VIEW.UNIT_LIST || currentView === VIEW.UNIT_DETAIL">
              <span aria-hidden="true">›</span>
              <RouterLink to="/organizacion/unidades">Unidades</RouterLink>
              <template v-if="currentView === VIEW.UNIT_DETAIL">
                <span aria-hidden="true">›</span>
                <span aria-current="page">{{ unitTitle }}</span>
              </template>
            </template>
            <template v-else-if="currentView === VIEW.PRECINCT_LIST || currentView === VIEW.PRECINCT_DETAIL">
              <span aria-hidden="true">›</span>
              <RouterLink to="/organizacion/recintos">Recintos</RouterLink>
              <template v-if="currentView === VIEW.PRECINCT_DETAIL">
                <span aria-hidden="true">›</span>
                <span aria-current="page">{{ pageTitle }}</span>
              </template>
            </template>
          </nav>
        </div>
        <nav class="organization-view__tabs" aria-label="Superficies de organización">
          <RouterLink to="/organizacion/unidades" :aria-current="currentView === VIEW.UNIT_LIST || currentView === VIEW.UNIT_DETAIL ? 'page' : undefined">
            Unidades
          </RouterLink>
          <RouterLink to="/organizacion/recintos" :aria-current="currentView === VIEW.PRECINCT_LIST || currentView === VIEW.PRECINCT_DETAIL ? 'page' : undefined">
            Recintos
          </RouterLink>
        </nav>
      </header>

      <div v-if="activePageMessage" class="alert alert-warning" role="status">
        {{ activePageMessage }}
      </div>

      <div v-if="uncertainMutation" class="alert alert-danger" role="alert">
        <p class="organization-view__alert-title">La última mutación tiene resultado incierto.</p>
        <p>No la repetiré. Consulta el recurso actual para reconciliar el estado antes de habilitar otra mutación.</p>
        <button type="button" class="btn btn-outline-danger" :disabled="reconciliationBusy" @click="reconcileCurrentResource">
          {{ reconciliationBusy ? 'Consultando…' : 'Reconciliar estado' }}
        </button>
      </div>

      <div v-if="operationNotice" class="alert" :class="operationNotice.kind === MESSAGE_KIND.SUCCESS ? 'alert-success' : 'alert-info'" role="status">
        {{ operationNotice.text }}
      </div>
      <div v-if="relationReceipt" class="alert alert-success" role="status">
        {{ relationReceipt.text }}
      </div>

      <template v-if="sessionEligible && !activePageMessage">
        <template v-if="currentView === VIEW.UNIT_LIST">
          <div class="organization-view__toolbar">
            <div class="organization-view__toolbar-controls">
              <div class="organization-view__search">
                <label class="form-label" for="organization-unit-search">Buscar unidades</label>
                <input
                  id="organization-unit-search"
                  v-model="unitSearch"
                  class="form-control"
                  type="search"
                  autocomplete="off"
                  placeholder="Código, nombre o padre"
                >
              </div>
              <div class="organization-view__control">
                <label class="organization-view__sort-label" for="organization-unit-sort">Ordenar</label>
                <select id="organization-unit-sort" v-model="unitSort" class="form-control organization-view__select">
                  <option value="name">Nombre</option>
                  <option value="code">Código</option>
                </select>
              </div>
              <div class="organization-view__control">
                <label class="organization-view__sort-label" for="organization-unit-state">Estado</label>
                <select id="organization-unit-state" v-model="unitStateFilter" class="form-control organization-view__select">
                  <option :value="STATE_FILTER.ALL">Todas</option>
                  <option :value="STATE_FILTER.ACTIVE">Activas</option>
                  <option :value="STATE_FILTER.INACTIVE">Inactivas</option>
                </select>
              </div>
            </div>
            <div class="organization-view__toolbar-actions">
              <div class="organization-view__view-toggle" role="group" aria-label="Vista de unidades">
                <button type="button" class="btn" :class="unitDisplay === 'tree' ? 'btn-primary' : 'btn-outline-primary'" :aria-pressed="unitDisplay === 'tree'" @click="unitDisplay = 'tree'">Árbol</button>
                <button type="button" class="btn" :class="unitDisplay === 'table' ? 'btn-primary' : 'btn-outline-primary'" :aria-pressed="unitDisplay === 'table'" @click="unitDisplay = 'table'">Tabla</button>
              </div>
              <button type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">
                Actualizar
              </button>
              <button v-if="canCreateUnits" type="button" class="btn btn-primary" :disabled="anyOperationBusy || !!uncertainMutation" @click="openUnitCreate">
                Crear unidad
              </button>
            </div>
          </div>

          <div v-if="unitListState === LOAD_STATE.LOADING && unitRows.length === 0" class="alert alert-info" role="status">
            Cargando unidades del contexto actual…
          </div>
          <div v-else-if="unitListState === LOAD_STATE.DENIED" class="alert alert-warning" role="alert">
            {{ unitListMessage?.text ?? 'El servidor denegó la consulta de unidades.' }}
            <button v-if="canReadUnits" type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">Reintentar</button>
          </div>
          <div v-else-if="unitListState === LOAD_STATE.ERROR" class="alert alert-danger" role="alert">
            {{ unitListMessage?.text ?? 'No fue posible cargar las unidades.' }}
            <button type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">Reintentar</button>
          </div>
          <div v-else-if="unitListState === LOAD_STATE.EMPTY" class="card">
            <div class="card-body organization-view__empty">
              <p>Aún no hay unidades registradas en tu contexto.</p>
              <p v-if="canCreateUnits" class="organization-view__empty-actions">
                <button type="button" class="btn btn-primary" :disabled="anyOperationBusy || !!uncertainMutation" @click="openUnitCreate">Crear unidad</button>
              </p>
            </div>
          </div>
          <div v-else-if="unitListState === LOAD_STATE.READY" class="card org-units-list-card">
            <div class="card-header">
              <h2 class="card-title">Unidades del contexto</h2>
              <p class="card-subtitle">Unidades de tu contexto actual.</p>
            </div>
            <div v-if="unitDisplay === 'tree'" class="card-body organization-view__tree-body">
              <div v-if="treeRows.length === 0" class="organization-view__empty" role="status">
                <p>{{ unitFilteredEmptyMessage }}</p>
                <p class="organization-view__empty-actions">
                  <button v-if="unitSearch.trim()" type="button" class="btn btn-outline-primary btn-sm" @click="clearUnitSearch">Limpiar búsqueda</button>
                  <button v-if="unitStateFilter !== STATE_FILTER.ALL" type="button" class="btn btn-outline-primary btn-sm" @click="clearUnitStateFilter">Ver todas las unidades</button>
                </p>
              </div>
              <!-- Lista jerárquica honesta: sin roles de árbol no hay flechas ni foco
                   móvil que prometer. El botón conserva aria-expanded y el enlace
                   marca la fila activa con aria-current. -->
              <ul v-else class="organization-view__tree" aria-label="Unidades organizacionales">
                <li
                  v-for="row in treeRows"
                  v-show="isTreeRowVisible(row)"
                  :key="row.unit.id"
                  class="organization-view__tree-item"
                  :class="{ 'is-selected': selectedUnitId === row.unit.id }"
                >
                  <div class="organization-view__tree-row" :style="{ paddingInlineStart: `${20 + row.depth * 20}px` }">
                    <button
                      v-if="row.hasChildren"
                      type="button"
                      class="organization-view__tree-toggle"
                      :aria-label="`${expandedUnitCodes.has(row.unit.code) ? 'Contraer' : 'Expandir'} ${row.unit.name}`"
                      :aria-expanded="expandedUnitCodes.has(row.unit.code)"
                      @click="toggleUnitBranch(row.unit.code)"
                    >{{ expandedUnitCodes.has(row.unit.code) ? '⌄' : '›' }}</button>
                    <span v-else class="organization-view__tree-spacer" aria-hidden="true" />
                    <RouterLink
                      class="organization-view__tree-link"
                      :to="unitDetailPath(row.unit.id)"
                      :aria-current="selectedUnitId === row.unit.id ? 'true' : undefined"
                      @click="selectedUnit(row.unit)"
                    >
                      <span class="organization-view__tree-name">{{ row.unit.name }}</span>
                      <span class="organization-view__tree-code">{{ row.unit.code }}</span>
                    </RouterLink>
                    <span v-if="row.unresolvedParentCode" class="organization-view__tree-parent">
                      Padre no incluido: {{ row.unresolvedParentCode }}
                    </span>
                    <span v-else-if="row.unit.parent_code === null" class="badge badge-soft-primary">Raíz</span>
                    <span class="badge badge-soft-secondary">{{ unitTypeLabel(row.unit.unit_type) }}</span>
                    <span :class="row.unit.is_active ? 'badge-success-sm' : 'badge-danger-sm'">
                      {{ row.unit.is_active ? 'Activa' : 'Inactiva' }}
                    </span>
                  </div>
                </li>
              </ul>
            </div>
            <div v-else class="card-body">
              <div v-if="flatUnitRows.length === 0" class="organization-view__empty" role="status">
                <p>{{ unitFilteredEmptyMessage }}</p>
                <p class="organization-view__empty-actions">
                  <button v-if="unitSearch.trim()" type="button" class="btn btn-outline-primary btn-sm" @click="clearUnitSearch">Limpiar búsqueda</button>
                  <button v-if="unitStateFilter !== STATE_FILTER.ALL" type="button" class="btn btn-outline-primary btn-sm" @click="clearUnitStateFilter">Ver todas las unidades</button>
                </p>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-centered organization-view__table">
                  <caption class="visually-hidden">Unidades organizacionales de tu contexto</caption>
                  <thead>
                    <tr>
                      <th scope="col">Código</th>
                      <th scope="col">Nombre</th>
                      <th scope="col">Padre</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="unit in flatUnitRows" :key="unit.id" :class="{ 'table-active': selectedUnitId === unit.id }">
                      <td><RouterLink :to="unitDetailPath(unit.id)" @click="selectedUnit(unit)">{{ unit.code }}</RouterLink></td>
                      <td><RouterLink :to="unitDetailPath(unit.id)" @click="selectedUnit(unit)">{{ unit.name }}</RouterLink></td>
                      <td>{{ display(unit.parent_code) }}</td>
                      <td>{{ unitTypeLabel(unit.unit_type) }}</td>
                      <td><span :class="unit.is_active ? 'badge-success-sm' : 'badge-danger-sm'">{{ unit.is_active ? 'Activa' : 'Inactiva' }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="currentView === VIEW.UNIT_DETAIL">
          <div class="organization-view__toolbar">
            <RouterLink class="btn btn-outline-primary" to="/organizacion/unidades">Volver al árbol</RouterLink>
            <div class="organization-view__toolbar-actions">
              <button type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">Actualizar</button>
              <button v-if="canUpdateUnits" type="button" class="btn btn-primary" :disabled="unitDetailState !== LOAD_STATE.READY || anyOperationBusy || !!uncertainMutation" @click="openUnitEdit">Editar</button>
              <button v-if="canDeleteUnits" type="button" class="btn btn-outline-danger" :disabled="unitDetailState !== LOAD_STATE.READY || anyOperationBusy || !!uncertainMutation" @click="openUnitSimpleDelete">Eliminar unidad</button>
              <button v-if="canDeleteUnits" type="button" class="btn btn-danger" :disabled="unitDetailState !== LOAD_STATE.READY || anyOperationBusy || !!uncertainMutation" @click="openUnitMigration">Eliminar y migrar contenido</button>
            </div>
          </div>
          <div v-if="unitDetailState === LOAD_STATE.LOADING" class="alert alert-info" role="status">Cargando la ficha de la unidad…</div>
          <div v-else-if="unitDetailState === LOAD_STATE.DENIED" class="alert alert-warning" role="alert">{{ unitDetailMessage?.text ?? 'El servidor denegó la consulta de la unidad.' }}</div>
          <div v-else-if="unitDetailState === LOAD_STATE.ERROR" class="alert alert-danger" role="alert">
            {{ unitDetailMessage?.text ?? 'No fue posible cargar la unidad.' }}
            <button type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">Reintentar</button>
          </div>
          <template v-else-if="unitDetailState === LOAD_STATE.READY && unitRecord">
            <div class="organization-view__detail-grid">
              <section class="card org-unit-data-card">
                <div class="card-body">
                  <h2 class="card-title">Datos de la unidad</h2>
                  <dl class="organization-view__details">
                    <div><dt>Código</dt><dd>{{ display(unitRecord.code) }}</dd></div>
                    <div><dt>Nombre</dt><dd>{{ display(unitRecord.name) }}</dd></div>
                    <div><dt>Tipo</dt><dd>{{ unitTypeLabel(unitRecord.unit_type) }}</dd></div>
                    <div><dt>Estado</dt><dd><span :class="unitRecord.is_active ? 'badge-success-sm' : 'badge-danger-sm'">{{ unitRecord.is_active ? 'Activa' : 'Inactiva' }}</span></dd></div>
                    <div>
                      <dt>Unidad padre</dt>
                      <dd v-if="unitRecord.parent_code">
                        <template v-if="unitParentRecord">
                          <RouterLink :to="unitDetailPath(unitParentRecord.id)">
                            {{ unitParentRecord.code }} — {{ unitParentRecord.name }}
                          </RouterLink>
                        </template>
                        <template v-else>{{ unitRecord.parent_code }} — sin nombre disponible</template>
                      </dd>
                      <dd v-else>Raíz</dd>
                    </div>
                  </dl>
                </div>
              </section>

              <section class="card org-rel-children-card">
                <div class="card-header">
                  <h2 class="card-title">Unidades hijas</h2>
                  <p class="card-subtitle">Unidades que dependen de esta unidad.</p>
                </div>
                <div class="card-body">
                  <div v-if="unitListState === LOAD_STATE.LOADING" class="organization-view__empty" role="status">Consultando unidades…</div>
                  <div v-else-if="unitListState === LOAD_STATE.DENIED" class="alert alert-warning" role="status">{{ unitListMessage?.text ?? 'Consulta de unidades denegada.' }}</div>
                  <div v-else-if="unitListState === LOAD_STATE.ERROR" class="alert alert-danger" role="alert">{{ unitListMessage?.text ?? 'No fue posible actualizar las relaciones de unidades.' }} <button type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">Reintentar</button></div>
                  <ul v-else-if="unitRows.some((item) => item.parent_code === unitRecord?.code)" class="organization-view__relation-list">
                    <li v-for="child in unitRows.filter((item) => item.parent_code === unitRecord?.code)" :key="child.id">
                      <RouterLink :to="unitDetailPath(child.id)">{{ child.code }} — {{ child.name }}</RouterLink>
                      <span :class="child.is_active ? 'badge-success-sm' : 'badge-danger-sm'">{{ child.is_active ? 'Activa' : 'Inactiva' }}</span>
                    </li>
                  </ul>
                  <p v-else class="organization-view__empty">Esta unidad no tiene unidades hijas.</p>
                </div>
              </section>

              <section v-if="canReadRecintos" class="card organization-view__detail-wide org-rel-recintos-card">
                <div class="card-header">
                  <h2 class="card-title">Recintos relacionados</h2>
                  <p class="card-subtitle">Recintos que incluyen esta unidad.</p>
                </div>
                <div class="card-body">
                  <div v-if="relatedRecintosState === LOAD_STATE.LOADING" class="organization-view__empty" role="status">Consultando recintos…</div>
                  <div v-else-if="relatedRecintosState === LOAD_STATE.DENIED" class="alert alert-warning" role="status">{{ relatedRecintosMessage?.text ?? 'Consulta de recintos denegada.' }}</div>
                  <div v-else-if="relatedRecintosState === LOAD_STATE.ERROR" class="alert alert-danger" role="alert">{{ relatedRecintosMessage?.text ?? 'No fue posible consultar los recintos relacionados.' }} <button type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">Reintentar</button></div>
                  <ul v-else-if="unitRelatedRecintos.length > 0" class="organization-view__relation-list">
                    <li v-for="recinto in unitRelatedRecintos" :key="recinto.id">
                      <RouterLink :to="recintoDetailPath(recinto.id)">{{ recinto.code }} — {{ recinto.name }}</RouterLink>
                      <span class="badge badge-soft-secondary">{{ recinto.unit_count }}</span>
                    </li>
                  </ul>
                  <p v-else class="organization-view__empty">Ningún recinto incluye esta unidad.</p>
                </div>
              </section>
            </div>
          </template>
        </template>

        <template v-else-if="currentView === VIEW.PRECINCT_LIST">
          <div class="organization-view__toolbar">
            <div class="organization-view__toolbar-controls">
              <div class="organization-view__search">
                <label class="form-label" for="organization-recinto-search">Buscar recintos</label>
                <input id="organization-recinto-search" v-model="recintoSearch" class="form-control" type="search" autocomplete="off" placeholder="Código, nombre o unidad">
              </div>
              <div class="organization-view__control">
                <label class="organization-view__sort-label" for="organization-recinto-sort">Ordenar</label>
                <select id="organization-recinto-sort" v-model="recintoSort" class="form-control organization-view__select">
                  <option value="name">Nombre</option>
                  <option value="code">Código</option>
                </select>
              </div>
              <div class="organization-view__control">
                <label class="organization-view__sort-label" for="organization-recinto-state">Estado</label>
                <select id="organization-recinto-state" v-model="recintoStateFilter" class="form-control organization-view__select">
                  <option :value="STATE_FILTER.ALL">Todos</option>
                  <option :value="STATE_FILTER.ACTIVE">Activos</option>
                  <option :value="STATE_FILTER.INACTIVE">Inactivos</option>
                </select>
              </div>
            </div>
            <div class="organization-view__toolbar-actions">
              <button type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">Actualizar</button>
              <button v-if="canManageRecintos" type="button" class="btn btn-primary" :disabled="anyOperationBusy || !!uncertainMutation" @click="openRecintoCreate">Crear recinto</button>
            </div>
          </div>
          <div v-if="recintoListState === LOAD_STATE.LOADING && recintoRows.length === 0" class="alert alert-info" role="status">Cargando recintos del tenant actual…</div>
          <div v-else-if="recintoListState === LOAD_STATE.DENIED" class="alert alert-warning" role="alert">
            {{ recintoListMessage?.text ?? 'El servidor denegó la consulta de recintos.' }}
            <button v-if="canReadRecintos" type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">Reintentar</button>
          </div>
          <div v-else-if="recintoListState === LOAD_STATE.ERROR" class="alert alert-danger" role="alert">
            {{ recintoListMessage?.text ?? 'No fue posible cargar los recintos.' }}
            <button type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">Reintentar</button>
          </div>
          <div v-else-if="recintoListState === LOAD_STATE.EMPTY" class="card">
            <div class="card-body organization-view__empty">
              <p>Aún no hay recintos registrados en tu tenant.</p>
              <p v-if="canManageRecintos" class="organization-view__empty-actions">
                <button type="button" class="btn btn-primary" :disabled="anyOperationBusy || !!uncertainMutation" @click="openRecintoCreate">Crear recinto</button>
              </p>
            </div>
          </div>
          <div v-else-if="recintoListState === LOAD_STATE.READY" class="card org-recintos-list-card">
            <div class="card-header">
              <h2 class="card-title">Recintos del tenant</h2>
              <p class="card-subtitle">Recintos de tu tenant actual.</p>
            </div>
            <div class="card-body">
              <div v-if="filteredRecintos.length === 0" class="organization-view__empty" role="status">
                <p>{{ recintoFilteredEmptyMessage }}</p>
                <p class="organization-view__empty-actions">
                  <button v-if="recintoSearch.trim()" type="button" class="btn btn-outline-primary btn-sm" @click="clearRecintoSearch">Limpiar búsqueda</button>
                  <button v-if="recintoStateFilter !== STATE_FILTER.ALL" type="button" class="btn btn-outline-primary btn-sm" @click="clearRecintoStateFilter">Ver todos los recintos</button>
                </p>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-centered organization-view__table">
                  <caption class="visually-hidden">Recintos de tu tenant</caption>
                  <thead>
                    <tr>
                      <th scope="col">Código</th>
                      <th scope="col">Nombre</th>
                      <th scope="col">Descripción</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Unidades</th>
                      <th scope="col">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="recinto in filteredRecintos" :key="recinto.id">
                      <td><RouterLink :to="recintoDetailPath(recinto.id)">{{ recinto.code }}</RouterLink></td>
                      <td><RouterLink :to="recintoDetailPath(recinto.id)">{{ recinto.name }}</RouterLink></td>
                      <td>{{ display(recinto.description) }}</td>
                      <td><span :class="recinto.is_active ? 'badge-success-sm' : 'badge-danger-sm'">{{ recinto.is_active ? 'Activo' : 'Inactivo' }}</span></td>
                      <td>{{ recinto.unit_codes.length ? recinto.unit_codes.join(', ') : '—' }}</td>
                      <td><span class="badge badge-soft-primary">{{ recinto.unit_count }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="currentView === VIEW.PRECINCT_DETAIL">
          <div class="organization-view__toolbar">
            <RouterLink class="btn btn-outline-primary" to="/organizacion/recintos">Volver a recintos</RouterLink>
            <div class="organization-view__toolbar-actions">
              <button type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">Actualizar</button>
              <button v-if="canManageRecintos" type="button" class="btn btn-primary" :disabled="recintoDetailState !== LOAD_STATE.READY || anyOperationBusy || !!uncertainMutation" @click="openRecintoEdit">Editar</button>
              <button v-if="canManageRecintos" type="button" class="btn btn-outline-danger" :disabled="recintoDetailState !== LOAD_STATE.READY || anyOperationBusy || !!uncertainMutation" @click="openRecintoDelete">Eliminar recinto</button>
            </div>
          </div>
          <div v-if="recintoDetailState === LOAD_STATE.LOADING" class="alert alert-info" role="status">Cargando la ficha del recinto…</div>
          <div v-else-if="recintoDetailState === LOAD_STATE.DENIED" class="alert alert-warning" role="alert">{{ recintoDetailMessage?.text ?? 'El servidor denegó la consulta del recinto.' }}</div>
          <div v-else-if="recintoDetailState === LOAD_STATE.ERROR" class="alert alert-danger" role="alert">
            {{ recintoDetailMessage?.text ?? 'No fue posible cargar el recinto.' }}
            <button type="button" class="btn btn-outline-primary" :disabled="anyOperationBusy" @click="refreshCurrentRoute">Reintentar</button>
          </div>
          <template v-else-if="recintoDetailState === LOAD_STATE.READY && recintoRecord">
            <div class="organization-view__detail-grid">
              <section class="card org-recinto-data-card">
                <div class="card-body">
                  <h2 class="card-title">Datos del recinto</h2>
                  <dl class="organization-view__details">
                    <div><dt>Código</dt><dd>{{ display(recintoRecord.code) }}</dd></div>
                    <div><dt>Nombre</dt><dd>{{ display(recintoRecord.name) }}</dd></div>
                    <div><dt>Descripción</dt><dd>{{ display(recintoRecord.description) }}</dd></div>
                    <div><dt>Estado</dt><dd><span :class="recintoRecord.is_active ? 'badge-success-sm' : 'badge-danger-sm'">{{ recintoRecord.is_active ? 'Activo' : 'Inactivo' }}</span></dd></div>
                    <div><dt>Cantidad de unidades</dt><dd><span class="badge badge-soft-primary">{{ recintoRecord.unit_count }}</span></dd></div>
                  </dl>
                </div>
              </section>
              <section class="card org-rel-units-card">
                <div class="card-header">
                  <h2 class="card-title">Unidades relacionadas</h2>
                  <p class="card-subtitle">Unidades relacionadas con este recinto.</p>
                </div>
                <div class="card-body">
                  <button v-if="canManageRecintos && canReadUnits" type="button" class="btn btn-primary" :disabled="anyOperationBusy || !!uncertainMutation" @click="openAddUnitToRecinto">Agregar unidad</button>
                  <ul v-if="recintoRecord.unit_codes.length > 0" class="organization-view__relation-list">
                    <li v-for="code in recintoRecord.unit_codes" :key="code">
                      <span class="organization-view__relation-copy">
                        <template v-if="lookupUnits.find((unit) => unit.code === code)">
                          <RouterLink :to="unitDetailPath(lookupUnits.find((unit) => unit.code === code)!.id)">{{ code }} — {{ unitRelatedName(code) }}</RouterLink>
                        </template>
                        <template v-else>{{ code }} — {{ unitRelatedName(code) }}</template>
                      </span>
                      <button v-if="canManageRecintos" type="button" class="btn btn-outline-danger btn-sm" :disabled="anyOperationBusy || !!uncertainMutation" @click="openRemoveUnitFromRecinto(code)">
                        Quitar
                      </button>
                    </li>
                  </ul>
                  <p v-else class="organization-view__empty">Este recinto aún no tiene unidades relacionadas.</p>
                  <p v-if="!canReadUnits && recintoRecord.unit_codes.length" class="organization-view__help">Solo se muestra el código: tu rol no permite consultar los nombres de las unidades.</p>
                  <p class="organization-view__help">Si eliminas este recinto, sus unidades no se trasladan a otro: solo se pierde la relación.</p>
                </div>
              </section>
            </div>
          </template>
        </template>
      </template>

      <div v-if="currentView === null" class="alert alert-warning" role="status">
        Esta dirección no corresponde a ninguna de las cuatro pantallas de Organización.
      </div>
    </div>

    <DsModal v-model="modalOpen" :title="modalTitle" :busy="modalBusy" :modal-id="`organization-modal-${modalToken}`" @close="handleModalClose">
      <template #body>
        <div v-if="modalMessage" class="alert" :class="modalMessage.kind === MESSAGE_KIND.ERROR ? 'alert-danger' : modalMessage.kind === MESSAGE_KIND.WARNING ? 'alert-warning' : modalMessage.kind === MESSAGE_KIND.SUCCESS ? 'alert-success' : 'alert-info'" role="alert">
          {{ modalMessage.text }}
        </div>
        <div v-if="replaceAllArmed" class="alert alert-warning" role="alert">
          Vas a reemplazar todos los campos del registro con los valores que ves en el formulario. Si algo existe hoy en la plataforma y no aparece aquí, se perderá.
        </div>
        <form v-if="modalKind === MODAL.UNIT_CREATE || modalKind === MODAL.UNIT_EDIT" id="organization-unit-form" class="organization-editor-form" @submit="handleUnitFormSubmit">
          <div class="mb-3 organization-editor-field">
            <label class="form-label" for="organization-unit-code">Código <span aria-hidden="true">*</span></label>
            <input id="organization-unit-code" v-model="unitDraft.code" class="form-control" :class="{ 'is-invalid': !!modalFieldError('code') }" :aria-invalid="modalFieldError('code') ? 'true' : undefined" :aria-describedby="modalFieldError('code') ? 'organization-unit-code-error' : undefined" type="text" autocomplete="off" required :disabled="modalBusy">
            <p v-if="modalFieldError('code')" id="organization-unit-code-error" class="invalid-feedback">{{ modalFieldError('code')?.message }}</p>
          </div>
          <div class="mb-3 organization-editor-field">
            <label class="form-label" for="organization-unit-name">Nombre <span aria-hidden="true">*</span></label>
            <input id="organization-unit-name" v-model="unitDraft.name" class="form-control" :class="{ 'is-invalid': !!modalFieldError('name') }" :aria-invalid="modalFieldError('name') ? 'true' : undefined" :aria-describedby="modalFieldError('name') ? 'organization-unit-name-error' : undefined" type="text" autocomplete="off" required :disabled="modalBusy">
            <p v-if="modalFieldError('name')" id="organization-unit-name-error" class="invalid-feedback">{{ modalFieldError('name')?.message }}</p>
          </div>
          <div class="mb-3 organization-editor-field">
            <label class="form-label" for="organization-unit-parent">Unidad padre</label>
            <select id="organization-unit-parent" v-model="unitDraft.parentId" class="form-select" :class="{ 'is-invalid': !!modalFieldError('parent') }" :aria-invalid="modalFieldError('parent') ? 'true' : undefined" :aria-describedby="modalFieldError('parent') ? 'organization-unit-parent-error' : undefined" :disabled="modalBusy || assignableState === LOAD_STATE.LOADING">
              <option value="">Raíz (sin padre)</option>
              <option v-for="unit in assignableUnits.filter((item) => item.id !== unitRecord?.id)" :key="unit.id" :value="String(unit.id)">
                {{ unit.code }} — {{ unit.name }}
              </option>
            </select>
            <p v-if="modalFieldError('parent')" id="organization-unit-parent-error" class="invalid-feedback">{{ modalFieldError('parent')?.message }}</p>
            <p v-if="assignableState === LOAD_STATE.LOADING" class="organization-view__help" role="status">Consultando unidades elegibles…</p>
            <p v-else-if="assignableState === LOAD_STATE.EMPTY" class="organization-view__help" role="status">No hay unidades elegibles disponibles. Elige otra unidad padre o guarda como raíz.</p>
            <p v-else-if="assignableState === LOAD_STATE.DENIED || assignableState === LOAD_STATE.ERROR" class="organization-view__help" role="alert">{{ assignableMessage?.text ?? 'No fue posible consultar las unidades elegibles.' }} <button type="button" class="btn btn-link" :disabled="modalBusy" @click="loadAssignableUnitChoices">Reintentar selector</button></p>
          </div>
          <div class="mb-3 organization-editor-field">
            <label class="form-label" for="organization-unit-type">Tipo de unidad</label>
            <select id="organization-unit-type" v-model="unitDraft.unitType" class="form-select" :class="{ 'is-invalid': !!modalFieldError('unit_type') }" :aria-invalid="modalFieldError('unit_type') ? 'true' : undefined" :aria-describedby="modalFieldError('unit_type') ? 'organization-unit-type-error' : undefined" :disabled="modalBusy">
              <option :value="UNIT_TYPE_EMPTY.VALUE">—</option>
              <option v-for="option in UNIT_TYPE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            <p v-if="modalFieldError('unit_type')" id="organization-unit-type-error" class="invalid-feedback">{{ modalFieldError('unit_type')?.message }}</p>
          </div>
          <div class="form-check organization-view__check">
            <input id="organization-unit-active" v-model="unitDraft.isActive" class="form-check-input" :class="{ 'is-invalid': !!modalFieldError('is_active') }" :aria-invalid="modalFieldError('is_active') ? 'true' : undefined" :aria-describedby="modalFieldError('is_active') ? 'organization-unit-active-error' : undefined" type="checkbox" :disabled="modalBusy">
            <label class="form-check-label" for="organization-unit-active">Unidad activa</label>
            <p v-if="modalFieldError('is_active')" id="organization-unit-active-error" class="invalid-feedback">{{ modalFieldError('is_active')?.message }}</p>
          </div>
        </form>

        <form v-else-if="modalKind === MODAL.PRECINCT_CREATE || modalKind === MODAL.PRECINCT_EDIT" id="organization-recinto-form" class="organization-editor-form" @submit="handleRecintoFormSubmit">
          <div class="mb-3 organization-editor-field">
            <label class="form-label" for="organization-recinto-code">Código <span aria-hidden="true">*</span></label>
            <input id="organization-recinto-code" v-model="recintoDraft.code" class="form-control" :class="{ 'is-invalid': !!modalFieldError('code') }" :aria-invalid="modalFieldError('code') ? 'true' : undefined" :aria-describedby="modalFieldError('code') ? 'organization-recinto-code-error' : undefined" type="text" autocomplete="off" required :disabled="modalBusy">
            <p v-if="modalFieldError('code')" id="organization-recinto-code-error" class="invalid-feedback">{{ modalFieldError('code')?.message }}</p>
          </div>
          <div class="mb-3 organization-editor-field">
            <label class="form-label" for="organization-recinto-name">Nombre <span aria-hidden="true">*</span></label>
            <input id="organization-recinto-name" v-model="recintoDraft.name" class="form-control" :class="{ 'is-invalid': !!modalFieldError('name') }" :aria-invalid="modalFieldError('name') ? 'true' : undefined" :aria-describedby="modalFieldError('name') ? 'organization-recinto-name-error' : undefined" type="text" autocomplete="off" required :disabled="modalBusy">
            <p v-if="modalFieldError('name')" id="organization-recinto-name-error" class="invalid-feedback">{{ modalFieldError('name')?.message }}</p>
          </div>
          <div class="mb-3 organization-editor-field">
            <label class="form-label" for="organization-recinto-description">Descripción</label>
            <textarea id="organization-recinto-description" v-model="recintoDraft.description" class="form-control" :class="{ 'is-invalid': !!modalFieldError('description') }" :aria-invalid="modalFieldError('description') ? 'true' : undefined" :aria-describedby="modalFieldError('description') ? 'organization-recinto-description-error' : undefined" rows="3" :disabled="modalBusy" />
            <p v-if="modalFieldError('description')" id="organization-recinto-description-error" class="invalid-feedback">{{ modalFieldError('description')?.message }}</p>
          </div>
          <div v-if="canReadUnits" class="mb-3 organization-editor-field">
            <label class="form-label" for="organization-recinto-units">Unidades (opcional)</label>
            <select
              id="organization-recinto-units"
              v-model="recintoDraft.unitIds"
              class="form-control"
              :class="{ 'is-invalid': !!modalFieldError('units') }"
              :aria-invalid="modalFieldError('units') ? 'true' : undefined"
              :aria-describedby="modalFieldError('units') ? 'organization-recinto-units-error' : undefined"
              multiple
              :disabled="modalBusy || lookupState === LOAD_STATE.LOADING"
              @change="recintoDraft.unitsTouched = true"
            >
              <option v-for="unit in lookupUnits" :key="unit.id" :value="unit.id">{{ unit.code }} — {{ unit.name }}</option>
              <option v-for="id in unresolvedCurrentUnitIds" :key="`existing-${id}`" :value="id">
                ID {{ id }} — unidad ya relacionada; no aparece en el buscador
              </option>
            </select>
            <p v-if="modalFieldError('units')" id="organization-recinto-units-error" class="invalid-feedback">{{ modalFieldError('units')?.message }}</p>
            <p v-if="lookupState === LOAD_STATE.LOADING" class="organization-view__help" role="status">Consultando unidades…</p>
            <p v-else-if="lookupState === LOAD_STATE.EMPTY" class="organization-view__help" role="status">No hay unidades disponibles para relacionar.</p>
            <p v-else-if="lookupState === LOAD_STATE.DENIED || lookupState === LOAD_STATE.ERROR" class="organization-view__help" role="alert">{{ lookupMessage?.text ?? 'No fue posible consultar unidades.' }} <button type="button" class="btn btn-link" :disabled="modalBusy" @click="loadUnitLookup('form-unit-lookup')">Reintentar</button></p>
            <p v-if="modalKind === MODAL.PRECINCT_EDIT && unresolvedCurrentUnitIds.length > 0" class="organization-view__help">
              Las unidades que aparecen con ID ya están relacionadas con este recinto; no son opciones nuevas del selector.
            </p>
          </div>
          <div class="form-check organization-view__check">
            <input id="organization-recinto-active" v-model="recintoDraft.isActive" class="form-check-input" :class="{ 'is-invalid': !!modalFieldError('is_active') }" :aria-invalid="modalFieldError('is_active') ? 'true' : undefined" :aria-describedby="modalFieldError('is_active') ? 'organization-recinto-active-error' : undefined" type="checkbox" :disabled="modalBusy">
            <label class="form-check-label" for="organization-recinto-active">Recinto activo</label>
            <p v-if="modalFieldError('is_active')" id="organization-recinto-active-error" class="invalid-feedback">{{ modalFieldError('is_active')?.message }}</p>
          </div>
        </form>

        <div v-else-if="modalKind === MODAL.UNIT_DELETE && unitRecord" class="organization-view__confirm-copy">
          <p>Eliminar esta unidad no se puede deshacer. Esto es lo que depende de ella:</p>
          <dl class="organization-view__confirm-resource"><div><dt>Unidad</dt><dd>{{ unitRecord.code }} — {{ unitRecord.name }}</dd></div></dl>
          <div v-if="migrationPreviewState === LOAD_STATE.LOADING" class="alert alert-info" role="status">Consultando qué se eliminará…</div>
          <div v-else-if="migrationPreviewState === LOAD_STATE.DENIED || migrationPreviewState === LOAD_STATE.ERROR" class="alert" :class="migrationPreviewState === LOAD_STATE.DENIED ? 'alert-warning' : 'alert-danger'" role="alert">
            {{ modalMessage?.text ?? 'No fue posible consultar el impacto de la eliminación.' }}
            <button type="button" class="btn btn-outline-primary" :disabled="modalBusy" @click="loadMigrationPreview">Reintentar</button>
          </div>
          <template v-else-if="migrationPreview && migrationPreviewMatchesCurrentUnit">
            <h3 class="organization-view__subheading">Impacto de la eliminación</h3>
            <dl class="organization-view__count-grid">
              <div v-for="field in MIGRATION_COUNT_FIELDS" :key="field.key">
                <dt>{{ field.label }}</dt>
                <dd>{{ migrationPreview.counts[field.key] }}</dd>
              </div>
            </dl>
          </template>
          <p v-else class="organization-view__help">No pudimos asociar el impacto con esta unidad. Revisa su ficha antes de continuar.</p>
        </div>

        <div v-else-if="modalKind === MODAL.UNIT_MIGRATION" class="organization-view__confirm-copy">
          <div v-if="migrationPreviewState === LOAD_STATE.LOADING" class="alert alert-info" role="status">Consultando qué se moverá…</div>
          <div v-else-if="migrationPreviewState === LOAD_STATE.DENIED || migrationPreviewState === LOAD_STATE.ERROR" class="alert" :class="migrationPreviewState === LOAD_STATE.DENIED ? 'alert-warning' : 'alert-danger'" role="alert">
            {{ modalMessage?.text ?? 'No pudimos leer el impacto. La confirmación sigue bloqueada.' }}
            <button type="button" class="btn btn-outline-primary" :disabled="modalBusy" @click="loadMigrationPreview">Reintentar</button>
          </div>
          <template v-else-if="migrationPreview && migrationPreviewMatchesCurrentUnit">
            <dl class="organization-view__confirm-resource">
              <div><dt>Unidad</dt><dd>{{ migrationPreview.unit_code }} — {{ migrationPreview.unit_name }}</dd></div>
              <div><dt>Padre</dt><dd>{{ display(migrationPreview.parent_code) }}</dd></div>
            </dl>
            <h3 class="organization-view__subheading">Qué se moverá a la unidad destino</h3>
            <dl class="organization-view__count-grid">
              <div v-for="field in MIGRATION_COUNT_FIELDS" :key="field.key">
                <dt>{{ field.label }}</dt>
                <dd>{{ migrationPreview.counts[field.key] }}</dd>
              </div>
            </dl>
            <div v-if="migrationPreview.counts.assignments > 0" class="alert alert-warning" role="note">
              Los puestos no se reasignan solos: aquí solo se cuenta cuántos hay.
            </div>
            <div class="organization-view__form-field">
              <label class="form-label" for="organization-migration-target">Destino de migración</label>
              <select id="organization-migration-target" v-model="migrationTargetSelection" class="form-select organization-view__select" :class="{ 'is-invalid': !!modalFieldError('target_unit_code') }" :aria-invalid="modalFieldError('target_unit_code') ? 'true' : undefined" :aria-describedby="modalFieldError('target_unit_code') ? 'organization-migration-target-error' : undefined" :disabled="modalBusy || assignableState === LOAD_STATE.LOADING">
                <option value="" disabled>Selecciona un destino</option>
                <option v-if="migrationPreview.parent_code" value="__parent__">Usar la unidad padre ({{ migrationPreview.parent_code }})</option>
                <option v-for="unit in assignableUnits.filter((item) => item.code !== migrationPreview?.unit_code)" :key="unit.id" :value="unit.code">
                  {{ unit.code }} — {{ unit.name }}
                </option>
              </select>
              <p v-if="modalFieldError('target_unit_code')" id="organization-migration-target-error" class="invalid-feedback">{{ modalFieldError('target_unit_code')?.message }}</p>
              <p v-if="!migrationPreview.parent_code" class="organization-view__help">La unidad no tiene padre. Indica un destino elegible antes de enviar.</p>
              <p v-if="assignableState === LOAD_STATE.LOADING" class="organization-view__help" role="status">Consultando unidades elegibles…</p>
              <p v-else-if="assignableState === LOAD_STATE.EMPTY" class="organization-view__help" role="status">No hay destinos disponibles para el contenido.</p>
              <p v-else-if="assignableState === LOAD_STATE.DENIED || assignableState === LOAD_STATE.ERROR" class="organization-view__help" role="alert">{{ assignableMessage?.text ?? 'No fue posible consultar destinos elegibles.' }} <button type="button" class="btn btn-link" :disabled="modalBusy" @click="loadAssignableUnitChoices">Reintentar selector</button></p>
            </div>
          </template>
          <p v-else class="alert alert-warning" role="status">El impacto mostrado no corresponde a esta unidad. Vuelve a intentarlo.</p>
        </div>

        <div v-else-if="modalKind === MODAL.UNIT_MIGRATION_RESULT && migrationResult" class="organization-view__confirm-copy">
          <div class="alert alert-success" role="status">{{ migrationResult.detail }}</div>
          <dl class="organization-view__confirm-resource">
            <div><dt>Unidad destino</dt><dd>{{ migrationResult.target_unit_code }}</dd></div>
          </dl>
          <h3 class="organization-view__subheading">Qué se movió</h3>
          <dl class="organization-view__count-grid">
            <div v-for="field in MIGRATION_COUNT_FIELDS" :key="field.key">
              <dt>{{ field.label }}</dt>
              <dd>{{ migrationResult.moved[field.key] }}</dd>
            </div>
          </dl>
          <p v-if="migrationPreview?.counts.assignments" class="organization-view__help">Los puestos no se reasignan: el número es solo informativo.</p>
        </div>

        <div v-else-if="modalKind === MODAL.PRECINCT_DELETE && recintoRecord" class="organization-view__confirm-copy">
          <p>Eliminar este recinto no se puede deshacer. Sus unidades no se mueven a otro recinto: solo se pierde la relación.</p>
          <dl class="organization-view__confirm-resource"><div><dt>Recinto</dt><dd>{{ recintoRecord.code }} — {{ recintoRecord.name }}</dd></div><div><dt>Unidades relacionadas</dt><dd>{{ recintoRecord.unit_codes.length ? recintoRecord.unit_codes.join(', ') : '—' }}</dd></div></dl>
        </div>

        <div v-else-if="modalKind === MODAL.PRECINCT_ADD_UNIT" class="organization-view__form">
          <div class="organization-view__form-field">
            <label class="form-label" for="organization-unit-lookup-search">Buscar en lookup</label>
            <input id="organization-unit-lookup-search" v-model="unitLookupSearch" class="form-control" type="search" autocomplete="off" placeholder="Código, nombre o padre" :disabled="modalBusy">
          </div>
          <div v-if="lookupState === LOAD_STATE.LOADING" class="alert alert-info" role="status">Consultando unidades…</div>
          <div v-else-if="lookupState === LOAD_STATE.DENIED" class="alert alert-warning" role="alert">{{ lookupMessage?.text ?? 'No tienes permiso para consultar unidades.' }}</div>
          <div v-else-if="lookupState === LOAD_STATE.ERROR" class="alert alert-danger" role="alert">{{ lookupMessage?.text ?? 'No fue posible consultar unidades.' }} <button type="button" class="btn btn-outline-primary" :disabled="modalBusy" @click="loadUnitLookup()">Reintentar</button></div>
          <div v-else-if="lookupState === LOAD_STATE.EMPTY" class="alert alert-info" role="status">No hay unidades activas para relacionar.</div>
          <template v-else-if="lookupState === LOAD_STATE.READY">
            <label class="form-label" for="organization-unit-lookup-select">Unidad disponible</label>
            <select id="organization-unit-lookup-select" v-model="relationUnitCode" class="form-select organization-view__select" :class="{ 'is-invalid': !!modalFieldError('unit_code') }" :aria-invalid="modalFieldError('unit_code') ? 'true' : undefined" :aria-describedby="modalFieldError('unit_code') ? 'organization-unit-lookup-select-error' : undefined" :disabled="modalBusy">
              <option value="">Selecciona una unidad</option>
              <option v-for="unit in filteredLookupUnits.filter((item) => !recintoRecord?.unit_codes.includes(item.code))" :key="unit.id" :value="unit.code">
                {{ unitLookupOptionLabel(unit) }}
              </option>
            </select>
            <p v-if="modalFieldError('unit_code')" id="organization-unit-lookup-select-error" class="invalid-feedback">{{ modalFieldError('unit_code')?.message }}</p>
            <p v-if="filteredLookupUnits.filter((item) => !recintoRecord?.unit_codes.includes(item.code)).length === 0" class="organization-view__help" role="status">No hay unidades disponibles para agregar. Si esperabas ver alguna, revisa la búsqueda.</p>
          </template>
        </div>

        <div v-else-if="modalKind === MODAL.PRECINCT_REMOVE_UNIT && recintoRecord" class="organization-view__confirm-copy">
          <p>Confirma quitar la relación. Si ya no existe, verás el error y la vista no la quitará de forma optimista.</p>
          <dl class="organization-view__confirm-resource">
            <div><dt>Recinto</dt><dd>{{ recintoRecord.code }} — {{ recintoRecord.name }}</dd></div>
            <div><dt>Código de unidad</dt><dd>{{ pendingRelationUnitCode }}</dd></div>
          </dl>
        </div>
      </template>

      <template #footer>
        <button v-if="modalKind === MODAL.UNIT_MIGRATION_RESULT" type="button" class="btn btn-primary" :disabled="modalBusy" @click="returnToUnitTree">Volver al árbol</button>
        <template v-else>
          <button type="button" class="btn btn-outline-primary" :disabled="modalBusy" @click="closeModal">Cancelar</button>
          <template v-if="modalHasForm">
            <button
              v-if="modalKind === MODAL.UNIT_CREATE || modalKind === MODAL.UNIT_EDIT"
              type="submit"
              form="organization-unit-form"
              class="btn btn-primary"
              :disabled="modalBusy"
            >{{ modalBusy ? 'Guardando…' : 'Guardar' }}</button>
            <template v-if="modalKind === MODAL.UNIT_EDIT">
              <button
                v-if="!replaceAllArmed"
                type="button"
                class="btn btn-outline-danger"
                :disabled="modalBusy"
                @click="armReplaceAll"
              >Reemplazar todos los campos…</button>
              <template v-else>
                <button type="button" class="btn btn-danger" :disabled="modalBusy" @click="saveUnitForm('put')">Confirmar reemplazo</button>
                <button type="button" class="btn btn-link" :disabled="modalBusy" @click="disarmReplaceAll">Descartar reemplazo</button>
              </template>
            </template>
            <button
              v-if="modalKind === MODAL.PRECINCT_CREATE || modalKind === MODAL.PRECINCT_EDIT"
              type="submit"
              form="organization-recinto-form"
              class="btn btn-primary"
              :disabled="modalBusy"
            >{{ modalBusy ? 'Guardando…' : 'Guardar' }}</button>
            <template v-if="modalKind === MODAL.PRECINCT_EDIT">
              <button
                v-if="!replaceAllArmed"
                type="button"
                class="btn btn-outline-danger"
                :disabled="modalBusy"
                @click="armReplaceAll"
              >Reemplazar todos los campos…</button>
              <template v-else>
                <button type="button" class="btn btn-danger" :disabled="modalBusy" @click="saveRecintoForm('put')">Confirmar reemplazo</button>
                <button type="button" class="btn btn-link" :disabled="modalBusy" @click="disarmReplaceAll">Descartar reemplazo</button>
              </template>
            </template>
          </template>
          <button v-else-if="modalKind === MODAL.UNIT_DELETE" type="button" class="btn btn-danger" :disabled="modalBusy || !!uncertainMutation || !canDeleteUnits" @click="confirmSimpleUnitDelete">{{ modalBusy ? 'Eliminando…' : 'Eliminar unidad' }}</button>
          <button v-else-if="modalKind === MODAL.UNIT_MIGRATION" type="button" class="btn btn-danger" :disabled="!migrationCanConfirm || !canDeleteUnits" @click="confirmUnitMigration">{{ modalBusy ? 'Procesando…' : 'Confirmar eliminación' }}</button>
          <button v-else-if="modalKind === MODAL.PRECINCT_DELETE" type="button" class="btn btn-danger" :disabled="modalBusy || !!uncertainMutation || !canManageRecintos" @click="confirmRecintoDelete">{{ modalBusy ? 'Eliminando…' : 'Eliminar recinto' }}</button>
          <button v-else-if="modalKind === MODAL.PRECINCT_ADD_UNIT" type="button" class="btn btn-primary" :disabled="modalBusy || !selectedLookupUnit || !!uncertainMutation || !canManageRecintos" @click="confirmAddUnitToRecinto">{{ modalBusy ? 'Agregando…' : 'Agregar unidad' }}</button>
          <button v-else-if="modalKind === MODAL.PRECINCT_REMOVE_UNIT" type="button" class="btn btn-danger" :disabled="modalBusy || !recintoRecord?.unit_codes.includes(pendingRelationUnitCode) || !!uncertainMutation || !canManageRecintos" @click="confirmRemoveUnitFromRecinto">{{ modalBusy ? 'Quitando…' : 'Quitar unidad' }}</button>
        </template>
      </template>
    </DsModal>
  </section>
</template>

<style scoped>
.organization-view {
  min-width: 0;
}

.organization-view__content {
  width: 100%;
  min-width: 0;
}

.organization-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 0 24px;
}

.organization-view__title {
  margin: 0;
  color: var(--heading);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.1;
}

/* La anatomía del DS (gap 6, 14px, color var(--text)) la aporta la clase portada
   `.breadcrumb` de design-system.css; el reset global `a { color: inherit;
   text-decoration: none }` (dashboard.css:161-164) ya cubre los enlaces.
   Aquí solo se separa del título de la página. */
.organization-view__breadcrumb {
  margin-top: 6px;
}

.organization-view__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.organization-view__tabs a {
  padding: 8px 16px;
  border-bottom: 1px solid transparent;
  color: var(--muted);
  font-size: 13px;
  text-decoration: none;
}

.organization-view__tabs a[aria-current="page"] {
  border-color: var(--primary);
  color: var(--primary-text);
}

.organization-view__tabs a:focus-visible,
.organization-view__tree-link:focus-visible,
.organization-view__breadcrumb a:focus-visible,
.organization-view__table a:focus-visible,
.organization-view__relation-list a:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px rgba(var(--primary-rgb), 1);
}

.organization-view__toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

/* Fila única de consulta, alineada a la izquierda: búsqueda + orden + estado. Crece
   hacia la derecha (deja los botones en su sitio) y envuelve sin apilar a lo ancho. */
.organization-view__toolbar-controls {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: end;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 8px 12px;
}

.organization-view__search {
  flex: 1 1 280px;
  max-width: 520px;
}

/* Cada selector viaja con su rótulo: al envolver, el par no se separa. */
.organization-view__control {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Ancho intrínseco en la barra: el DS declara `select.form-control { width: 100% }`
   y como ítem flex eso lo estiraba a todo el ancho de la fila. El modal no se toca. */
.organization-view__toolbar-controls .organization-view__select {
  width: auto;
  flex: 0 0 auto;
}

.organization-view__toolbar-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.organization-view__sort-label {
  color: var(--muted);
  font-size: 12px;
}

/* El DS declara la geometría del select (design-system.css:524-543, dos capas de
   fondo: chevron + control). Aquí solo se acota el ancho del selector de orden. */
.organization-view__select {
  min-width: 150px;
}

.organization-view__select:focus-visible {
  border-color: var(--input-focus);
  outline: 0;
  box-shadow: none;
}

.organization-view .btn-outline-primary {
  border-color: rgba(var(--primary-rgb), 1);
  background-color: transparent;
  color: var(--primary-text);
}

.organization-view .btn-outline-primary:hover:not(:disabled) {
  border-color: rgba(var(--primary-rgb), 1);
  background-color: rgba(var(--primary-rgb), 1);
  color: var(--primary-ink);
}

.organization-view .btn-outline-danger {
  border-color: currentColor;
  background-color: transparent;
  color: var(--danger-text);
}

.organization-view .btn-outline-danger:hover:not(:disabled) {
  border-color: rgba(var(--danger-rgb), 1);
  background-color: rgba(var(--danger-rgb), 1);
  color: var(--on-danger);
}

.organization-view .btn-danger {
  border-color: rgba(var(--danger-rgb), 1);
  background-color: rgba(var(--danger-rgb), 1);
  color: var(--on-danger);
}

.organization-view .btn-danger:hover:not(:disabled) {
  border-color: color-mix(in srgb, rgba(var(--danger-rgb), 1) 84%, #000);
  background-color: color-mix(in srgb, rgba(var(--danger-rgb), 1) 84%, #000);
  color: #fff;
}

.organization-view .btn:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px rgba(var(--primary-rgb), 1);
}

.organization-view .btn:disabled {
  pointer-events: none;
  opacity: .65;
}

.organization-view .card {
  min-width: 0;
}

.organization-view .card-head {
  flex-wrap: wrap;
}

.organization-view .card-title {
  margin: 0;
}

/* tables-basic .card-header anatomy for the two organization list cards. */
.org-units-list-card .card-header .card-title,
.org-recintos-list-card .card-header .card-title {
  margin-bottom: 12px;
  line-height: 19.8px;
}

.org-units-list-card .card-header .card-subtitle,
.org-recintos-list-card .card-header .card-subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 21px;
  color: var(--bui-text);
}

/* ui-list-group.html Basic .card-header anatomy for the three relation cards;
   scoped here to defeat the shared .organization-view .card-title { margin:0 }. */
.org-rel-children-card .card-header .card-title,
.org-rel-recintos-card .card-header .card-title,
.org-rel-units-card .card-header .card-title {
  margin-bottom: 12px;
  line-height: 19.8px;
}

.org-rel-children-card .card-header .card-subtitle,
.org-rel-recintos-card .card-header .card-subtitle,
.org-rel-units-card .card-header .card-subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 21px;
  color: var(--bui-text);
}

/* ui-card.html anatomy for the two organization data cards (unit / recinto). */
.org-unit-data-card .card-body > .card-title,
.org-recinto-data-card .card-body > .card-title {
  margin-bottom: 12px;
  line-height: 19.8px;
}

.organization-view__view-toggle {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.organization-view__empty {
  padding: 8px 0;
  color: var(--muted);
}

/* Salida del estado vacío: limpiar la búsqueda o quitar el filtro de estado. */
.organization-view__empty-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.organization-view__tree-body {
  min-width: 0;
}

/* .table-active is not declared globally in the app; ported here solely for the
   units table selection (DS baseui-tables.css:145-147). */
.org-units-list-card .table-active {
  --tbl-color-state: var(--tbl-active-color);
  --tbl-bg-state: var(--tbl-active-bg);
}

.organization-view__tree {
  padding: 0;
  margin: 0;
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  background-color: var(--surface);
  list-style: none;
  overflow: hidden;
}

.organization-view__tree-item {
  margin: 0;
  border-bottom: 1px solid var(--border);
}

.organization-view__tree-item:last-child {
  border-bottom: 0;
}

.organization-view__tree-row {
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 10px;
  padding-block: 6px;
  padding-inline-end: 20px;
  background-color: var(--surface);
  color: var(--text);
}

.organization-view__tree-row:hover {
  background-color: var(--hover);
}

/* Selección de la fila del árbol. `--tbl-active-bg` vive en el scope de `.table`
   (design-system.css) y no resuelve fuera de la tabla; se usa `--primary-soft`, la
   superficie suave del DS con la que esta vista marca selección. El estado viaja en
   `aria-current` del enlace: el atributo de selección del patrón de árbol no aplica
   fuera de él. */
.organization-view__tree-item.is-selected .organization-view__tree-row {
  background-color: var(--primary-soft);
  box-shadow: inset 2px 0 0 0 rgba(var(--primary-rgb), 1);
}

/* Área táctil 44×44 con el glifo centrado; la fila conserva sus 56 px
   (44 + 2·6 de padding). */
.organization-view__tree-toggle,
.organization-view__tree-spacer {
  display: inline-flex;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
}

.organization-view__tree-toggle {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 20px;
}

.organization-view__tree-toggle:hover {
  color: var(--primary-text);
}

.organization-view__tree-toggle:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 .15rem rgba(var(--primary-rgb), .25);
}

.organization-view__tree-link {
  display: flex;
  min-width: 150px;
  flex: 1 1 auto;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--heading);
  text-decoration: none;
}

.organization-view__tree-link:hover {
  color: var(--primary-text);
}

.organization-view__tree-name {
  font-weight: 600;
}

.organization-view__tree-code,
.organization-view__tree-parent {
  color: var(--muted);
  font-size: 12px;
}

.organization-view .badge {
  font-variant-numeric: tabular-nums;
}

.organization-view .badge-soft-primary {
  padding: 3px 6px;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  background-color: var(--primary-soft);
  color: var(--primary-text);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.organization-view .badge-soft-secondary {
  padding: 3px 6px;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  background-color: rgba(131, 145, 162, .18);
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

/* Enlaces de fila de tabla: mismo patrón ya usado en ArmoryView/AuthorizationView
   (sin subrayado en reposo, subrayado con desplazamiento al pasar el puntero). */
.organization-view__table a:hover {
  color: var(--primary-text);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.organization-view__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}

.organization-view__detail-wide {
  grid-column: 1 / -1;
}

.organization-view__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 24px;
  margin: 0;
}

.organization-view__details > div,
.organization-view__confirm-resource > div {
  min-width: 0;
}

.organization-view__details dt,
.organization-view__confirm-resource dt,
.organization-view__count-grid dt {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 12px;
}

.organization-view__details dd,
.organization-view__confirm-resource dd,
.organization-view__count-grid dd {
  margin: 0;
  color: var(--text);
  overflow-wrap: anywhere;
}

.organization-view__details a,
.organization-view__relation-list a {
  color: var(--text);
  text-decoration: none;
}

.organization-view__details a:hover,
.organization-view__relation-list a:hover {
  color: var(--primary-text);
}

.organization-view__relation-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.organization-view__relation-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.organization-view__relation-list li:first-child {
  padding-top: 0;
}

.organization-view__relation-list li:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.organization-view__relation-copy {
  min-width: 0;
  overflow-wrap: anywhere;
}

.organization-view__help {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 12px;
}

.organization-view__alert-title {
  margin-bottom: 4px;
  font-weight: 600;
}

.organization-view__form {
  display: grid;
  gap: 16px;
}

.organization-view__form-field {
  min-width: 0;
}

/* DS block editor forms for the TWO Organization editors (forms-basic field flow). */
.organization-editor-form {
  display: block;
}

.organization-editor-field {
  min-width: 0;
}

.organization-view__form-field .form-label {
  display: inline-block;
  margin-bottom: 8px;
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
}

.organization-view__check {
  display: flex;
  min-height: 21px;
  align-items: flex-start;
  gap: 8px;
  padding-left: 0;
}

.organization-view__check .form-check-input {
  width: 15.568px;
  height: 15.568px;
  flex: 0 0 15.568px;
  margin: 2px 0 0;
  border: 1px solid #8391a2;
  border-radius: 3.5px;
  background-color: var(--surface);
  appearance: none;
}

.organization-view__check .form-check-input:checked {
  border-color: rgba(var(--primary-rgb), 1);
  background-color: rgba(var(--primary-rgb), 1);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e");
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.organization-view__check .form-check-input:focus-visible {
  border-color: rgba(var(--primary-rgb), 1);
  outline: 0;
  box-shadow: 0 0 0 .15rem rgba(var(--primary-rgb), .25);
}

.organization-view__check .form-check-input:disabled {
  pointer-events: none;
  opacity: .5;
}

.organization-view__check .form-check-label {
  color: var(--text);
  cursor: pointer;
}

.organization-view__confirm-copy > p {
  margin: 0 0 16px;
}

.organization-view__confirm-resource,
.organization-view__count-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 0;
  margin: 0 0 20px;
}

.organization-view__count-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.organization-view__count-grid > div {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background-color: var(--surface-2);
}

.organization-view__count-grid dd {
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.organization-view__subheading {
  margin: 0 0 12px;
  color: var(--heading);
  font-size: 14px;
  font-weight: 600;
}

.organization-view__confirm-resource > div {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.organization-view .alert {
  padding: 12px 20px;
  margin-bottom: 20px;
  border: 0;
  border-radius: var(--card-radius);
}

.organization-view .alert p:last-child {
  margin-bottom: 0;
}

.organization-view .btn-link {
  padding: 0;
  color: var(--muted);
  text-decoration: none;
}

.organization-view .btn-link:hover {
  color: var(--primary-text);
}

@media (max-width: 767px) {
  .organization-view__detail-grid,
  .organization-view__details {
    grid-template-columns: minmax(0, 1fr);
  }

  .organization-view__detail-wide {
    grid-column: auto;
  }

  .organization-view__count-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  /* La consulta toma su propia línea y los selectores envuelven debajo, con el
     buscador a todo el ancho disponible en vez de encogerse a 280px. */
  .organization-view__toolbar-controls {
    width: 100%;
  }

  .organization-view__search {
    flex: 1 1 100%;
    min-width: 0;
    max-width: none;
  }

  .organization-view__toolbar-actions {
    width: 100%;
  }

  .organization-view__toolbar-actions .btn {
    flex: 1 1 auto;
  }
}
</style>
