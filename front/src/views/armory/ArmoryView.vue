<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, RouterLink, useRoute, useRouter } from 'vue-router'
import { HttpRequestError } from '../../api/http'
import { getOrganizationUnitsLookup } from '../../api/shared/domain'
import type { OrganizationUnitDTO } from '../../types/shared/domain'
import { useSessionStore } from '../../stores/session'
import { SESSION_STATUS } from '../../types/session'
import { PERMISSION_CODE, ROLE_CODE } from '../../permissions/catalog'
import type { ApiConnection } from '../../types/dashboard'
import DsModal from '../../components/shared/DsModal.vue'
import {
  ArmoryApiResponseError,
  TIPO_ARMA_CHOICES,
  createArmory,
  createCalibre,
  createWeapon,
  deleteArmory,
  deleteCalibre,
  deleteWeapon,
  getActiveArmories,
  getActiveCalibres,
  getArmories,
  getArmory,
  getCalibre,
  getCalibres,
  getWeapon,
  getWeapons,
  getWeaponsForArmory,
  patchArmory,
  patchCalibre,
  patchWeapon,
  replaceArmory,
  replaceCalibre,
  replaceWeapon,
  type ArmoryDTO,
  type ArmaTypeCode,
  type CalibreDTO,
  type CreateArmoryBody,
  type CreateCalibreBody,
  type CreateWeaponBody,
  type PatchArmoryBody,
  type PatchCalibreBody,
  type PatchWeaponBody,
  type ReplaceArmoryBody,
  type ReplaceCalibreBody,
  type ReplaceWeaponBody,
  type WeaponDTO,
} from '../../features/armory/api'

const VIEW = {
  ARMORIES: 'armories',
  WEAPONS: 'weapons',
  WEAPON_DETAIL: 'weapon-detail',
  CALIBRES: 'calibres',
} as const

type View = (typeof VIEW)[keyof typeof VIEW]

const LOAD_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  EMPTY: 'empty',
  DENIED: 'denied',
  ERROR: 'error',
  NOT_FOUND: 'not-found',
} as const

type LoadState = (typeof LOAD_STATE)[keyof typeof LOAD_STATE]

const STATE_FILTER = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

type StateFilter = (typeof STATE_FILTER)[keyof typeof STATE_FILTER]

const MODAL = {
  ARMORY_CREATE: 'armory-create',
  ARMORY_EDIT: 'armory-edit',
  ARMORY_DETAIL: 'armory-detail',
  ARMORY_DELETE: 'armory-delete',
  WEAPON_CREATE: 'weapon-create',
  WEAPON_EDIT: 'weapon-edit',
  WEAPON_DELETE: 'weapon-delete',
  CALIBRE_CREATE: 'calibre-create',
  CALIBRE_EDIT: 'calibre-edit',
  CALIBRE_DELETE: 'calibre-delete',
} as const

type ModalKind = (typeof MODAL)[keyof typeof MODAL] | null
type BooleanChoice = '' | 'true' | 'false'
type SortDirection = 'asc' | 'desc'
type MessageTone = 'info' | 'success' | 'warning' | 'error'

interface UiMessage {
  tone: MessageTone
  text: string
}

interface ArmoryDraft {
  code: string
  name: string
  description: string
  organizationUnitCode: string
  isActive: BooleanChoice
}

interface WeaponDraft {
  weaponType: ArmaTypeCode | ''
  model: string
  serialNumber: string
  armoryCode: string
  calibreCode: string
}

interface CalibreDraft {
  code: string
  name: string
  isActive: BooleanChoice
}

interface MutationRisk {
  entity: 'armory' | 'weapon' | 'calibre'
  id: number | null
  action: 'create' | 'update' | 'delete'
}

interface UncertainMutation extends MutationRisk {
  routeKey: string
  sessionKey: string
  operation: string
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
  mutationRisk: MutationRisk | null
  controller: AbortController
}

type RequestOutcome<T> =
  | { kind: 'success'; value: T }
  | { kind: 'failure'; error: unknown }
  | { kind: 'stale' }
  | { kind: 'blocked' }

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

function positiveId(value: unknown): number | null {
  const candidate = Array.isArray(value) ? value[0] : value
  if (typeof candidate !== 'string' || candidate.trim() === '') return null
  const id = Number(candidate)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function queryString(value: unknown): string {
  const candidate = Array.isArray(value) ? value[0] : value
  return typeof candidate === 'string' ? candidate.trim() : ''
}

const currentView = computed<View | null>(() => {
  const path = route.path.replace(/\/+$/, '') || '/'
  if (path === '/almacen/armerias') return VIEW.ARMORIES
  if (path === '/almacen/armas') return VIEW.WEAPONS
  if (path.startsWith('/almacen/armas/')) return VIEW.WEAPON_DETAIL
  if (path === '/almacen/calibres') return VIEW.CALIBRES
  return null
})

const currentWeaponId = computed(() => currentView.value === VIEW.WEAPON_DETAIL
  ? positiveId(route.params.idArma)
  : null)
const armoryFilterCode = computed(() => currentView.value === VIEW.ARMORIES || currentView.value === VIEW.WEAPONS
  ? queryString(route.query.armory)
  : '')
const calibreFilterCode = computed(() => currentView.value === VIEW.CALIBRES
  ? queryString(route.query.code)
  : '')
const currentRouteKey = computed(() => [
  currentView.value ?? 'outside',
  currentWeaponId.value ?? '',
  armoryFilterCode.value,
  calibreFilterCode.value,
].join('|'))

const permissionCodes = computed(() => session.context?.permissions ?? [])
// Gating de acción existente conservado 1:1 (AC-7); únicos literales vía el
// catálogo compartido. Mutaciones de calibre sólo `super_admin`
// (docs/specs/final-frontend/coverage.md: OP-CAL-002/004/005/006).
const canManageCalibres = computed(() => permissionCodes.value.includes(PERMISSION_CODE.MANAGE_CALIBRE)
  && (session.context?.assignments.some((assignment) => assignment.role === ROLE_CODE.SUPER_ADMIN) ?? false))

const sessionFingerprint = computed(() => {
  const context = session.context
  return [
    session.status,
    session.generation,
    session.identity?.id_usuario ?? '',
    session.identity?.must_change_password ? 'password-required' : '',
    session.tenantCode.trim(),
    session.unitCode.trim(),
    context?.user.id_usuario ?? '',
    context?.tenant.code ?? '',
    context?.tenant.context ?? '',
    context?.active_organization_unit ?? '',
    context?.unit_membership?.unit_code ?? '',
    context?.permissions.join('\u001f') ?? '',
    context?.assignments.map((assignment) => [
      assignment.role,
      assignment.scope ?? '',
      assignment.organization_unit ?? '',
      assignment.is_primary ? '1' : '0',
    ].join(':')).join('\u001e') ?? '',
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

const armoryRows = shallowRef<readonly ArmoryDTO[]>([])
const weaponRows = shallowRef<readonly WeaponDTO[]>([])
const calibreRows = shallowRef<readonly CalibreDTO[]>([])
const activeArmories = shallowRef<readonly ArmoryDTO[]>([])
const activeCalibres = shallowRef<readonly CalibreDTO[]>([])
const organizationUnits = shallowRef<readonly OrganizationUnitDTO[]>([])

const armoryListState = ref<LoadState>(LOAD_STATE.IDLE)
const weaponListState = ref<LoadState>(LOAD_STATE.IDLE)
const calibreListState = ref<LoadState>(LOAD_STATE.IDLE)
const weaponDetailState = ref<LoadState>(LOAD_STATE.IDLE)
const armoryOptionsState = ref<LoadState>(LOAD_STATE.IDLE)
const calibreOptionsState = ref<LoadState>(LOAD_STATE.IDLE)
const unitLookupState = ref<LoadState>(LOAD_STATE.IDLE)
const relatedWeaponsState = ref<LoadState>(LOAD_STATE.IDLE)

const armoryListMessage = shallowRef<UiMessage | null>(null)
const weaponListMessage = shallowRef<UiMessage | null>(null)
const calibreListMessage = shallowRef<UiMessage | null>(null)
const weaponDetailMessage = shallowRef<UiMessage | null>(null)
const armoryOptionsMessage = shallowRef<UiMessage | null>(null)
const calibreOptionsMessage = shallowRef<UiMessage | null>(null)
const unitLookupMessage = shallowRef<UiMessage | null>(null)
const relatedWeaponsMessage = shallowRef<UiMessage | null>(null)
const pageNotice = shallowRef<UiMessage | null>(null)

const armoryDetail = shallowRef<ArmoryDTO | null>(null)
const relatedWeapons = shallowRef<readonly WeaponDTO[]>([])
const weaponDetail = shallowRef<WeaponDTO | null>(null)

const searchText = ref('')
const searchQuery = ref('')
const stateFilter = ref<StateFilter>(STATE_FILTER.ALL)
const sortKey = ref('code')
const sortDirection = ref<SortDirection>('asc')

// Debounce del filtro local: el array completo se recorre tras 350 ms de pausa
// (300-500 ms), no en cada tecla. La paginación real exige contrato de backend
// (docs/bugs/backend-todos-barrido-ux.md); no se simula.
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchText, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchTimer = null
    searchQuery.value = value
  }, 350)
})

const armoryDraft = reactive<ArmoryDraft>({
  code: '',
  name: '',
  description: '',
  organizationUnitCode: '',
  isActive: '',
})
const weaponDraft = reactive<WeaponDraft>({
  weaponType: '',
  model: '',
  serialNumber: '',
  armoryCode: '',
  calibreCode: '',
})
const calibreDraft = reactive<CalibreDraft>({
  code: '',
  name: '',
  isActive: '',
})

const originalArmory = shallowRef<ArmoryDTO | null>(null)
const originalWeapon = shallowRef<WeaponDTO | null>(null)
const originalCalibre = shallowRef<CalibreDTO | null>(null)

const modalKind = ref<ModalKind>(null)
const modalOpen = ref(false)
const modalToken = ref(0)
const modalResourceId = ref<number | null>(null)
const modalLoadState = ref<LoadState>(LOAD_STATE.IDLE)
const modalMessage = shallowRef<UiMessage | null>(null)
const modalFieldErrors = shallowRef<Readonly<Record<string, string>>>({})
const deleteTarget = shallowRef<MutationRisk & { label: string; detail: string } | null>(null)
const uncertainMutation = shallowRef<UncertainMutation | null>(null)
const pendingTickets = shallowRef<readonly OperationTicket[]>([])

// PUT reemplaza todos los campos: vive como acción secundaria rotulada por
// efecto y exige confirmación. La acción primaria del editor es PATCH.
const REPLACE_TARGET = {
  ARMORY: 'armory',
  WEAPON: 'weapon',
  CALIBRE: 'calibre',
} as const

type ReplaceTarget = (typeof REPLACE_TARGET)[keyof typeof REPLACE_TARGET]

const replacePending = shallowRef<ReplaceTarget | null>(null)

const activeRequests = new Map<string, OperationTicket>()
const requestAttempts = new Map<string, number>()
let mounted = true

const modalTitle = computed(() => {
  switch (modalKind.value) {
    case MODAL.ARMORY_CREATE: return 'Crear armería'
    case MODAL.ARMORY_EDIT: return 'Editar armería'
    case MODAL.ARMORY_DETAIL: return 'Ficha de armería'
    case MODAL.ARMORY_DELETE: return 'Confirmar baja de armería'
    case MODAL.WEAPON_CREATE: return 'Registrar arma'
    case MODAL.WEAPON_EDIT: return 'Editar arma'
    case MODAL.WEAPON_DELETE: return 'Confirmar baja de arma'
    case MODAL.CALIBRE_CREATE: return 'Crear calibre'
    case MODAL.CALIBRE_EDIT: return 'Editar calibre'
    case MODAL.CALIBRE_DELETE: return 'Confirmar baja de calibre'
    default: return 'Almacén'
  }
})

// Un solo texto para el estado incierto: la región viva se elige (página o
// modal), nunca se anuncia dos veces.
const uncertainNoticeText = computed(() => uncertainMutation.value
  ? `${uncertainMutationLabel(uncertainMutation.value)} pudo aplicarse sin resultado confirmado. Reconcíliala con una lectura explícita antes de volver a enviarla.`
  : '')

const weaponDetailTitle = computed(() => weaponDetail.value?.modelo_arma?.trim() || 'Datos del arma')

const replaceConfirmText = computed(() => {
  switch (replacePending.value) {
    case REPLACE_TARGET.ARMORY: return 'Se reemplazarán todos los campos de la armería con los valores actuales del formulario.'
    case REPLACE_TARGET.WEAPON: return 'Se reemplazarán todos los campos del arma con los valores actuales del formulario.'
    case REPLACE_TARGET.CALIBRE: return 'Se reemplazarán todos los campos del calibre con los valores actuales del formulario.'
    default: return ''
  }
})

const modalBusy = computed(() => pendingTickets.value.some((ticket) => ticket.modalToken === modalToken.value))
const pageBusy = computed(() => pendingTickets.value.some((ticket) => ticket.modalToken === null))
const reconcileBusy = computed(() => pendingTickets.value.some((ticket) => ticket.operation === 'reconcile'))

const pageTitle = computed(() => {
  switch (currentView.value) {
    case VIEW.ARMORIES: return 'Armerías'
    case VIEW.WEAPONS: return 'Armas'
    case VIEW.WEAPON_DETAIL: return 'Ficha de arma'
    case VIEW.CALIBRES: return 'Calibres'
    default: return 'Almacén'
  }
})

const pageDescription = computed(() => {
  switch (currentView.value) {
    case VIEW.ARMORIES: return 'Armerías, unidades derivadas y armas asociadas del ámbito activo.'
    case VIEW.WEAPONS: return 'Armas del contexto activo, con sus relaciones de armería, unidad y calibre.'
    case VIEW.WEAPON_DETAIL: return 'Datos editables separados de las relaciones de solo lectura.'
    case VIEW.CALIBRES: return 'Catálogo global de calibres.'
    default: return 'Superficies del almacén.'
  }
})

const weaponTypeOptions = TIPO_ARMA_CHOICES.map(([value, label]) => ({ value, label }))

const unitByCode = computed(() => new Map(organizationUnits.value.map((unit) => [unit.code, unit])))

const unavailableArmoryCode = computed(() => {
  const current = originalWeapon.value?.armory_code
  return current && !activeArmories.value.some((armory) => armory.code === current) ? current : ''
})

const unavailableCalibreCode = computed(() => {
  const current = originalWeapon.value?.calibre_code
  return current && !activeCalibres.value.some((calibre) => calibre.code === current) ? current : ''
})

const unavailableUnitCode = computed(() => {
  const current = originalArmory.value?.organization_unit_code
  return current && !unitByCode.value.has(current) ? current : ''
})

// Filtro local por estado sobre la colección cargada (mismo espíritu que los
// filtros de Organización). Se reinicia al cambiar de ruta. Las armas no lo
// ofrecen: `Arma` no tiene estado activa/inactiva en el contrato.
function matchesStateFilter(isActive: boolean, filter: StateFilter): boolean {
  if (filter === STATE_FILTER.ACTIVE) return isActive
  if (filter === STATE_FILTER.INACTIVE) return !isActive
  return true
}

function clearStateFilter(): void {
  stateFilter.value = STATE_FILTER.ALL
}

const stateFilterLabel = computed(() => {
  // Concordancia con el sustantivo de la lista activa (armerías femenino,
  // calibres masculino).
  const femenine = currentView.value === VIEW.ARMORIES
  if (stateFilter.value === STATE_FILTER.ACTIVE) return femenine ? 'activas' : 'activos'
  if (stateFilter.value === STATE_FILTER.INACTIVE) return femenine ? 'inactivas' : 'inactivos'
  return femenine ? 'todas' : 'todos'
})

const armoryEmptyMessage = computed(() => {
  if (armoryFilterCode.value) return `No hay armería con código ${armoryFilterCode.value} en la colección cargada.`
  if (stateFilter.value !== STATE_FILTER.ALL) return 'Ninguna armería coincide con el filtro de estado.'
  return 'La búsqueda no coincide con ninguna armería cargada.'
})

const weaponEmptyMessage = computed(() => (armoryFilterCode.value
  ? `No hay armas de la armería ${armoryFilterCode.value} en la colección cargada.`
  : 'La búsqueda no coincide con ninguna arma cargada.'))

const calibreEmptyMessage = computed(() => {
  if (calibreFilterCode.value) return `No hay calibre con código ${calibreFilterCode.value} en el catálogo cargado.`
  if (stateFilter.value !== STATE_FILTER.ALL) return 'Ningún calibre coincide con el filtro de estado.'
  return 'La búsqueda no coincide con ningún calibre cargado.'
})

const visibleArmories = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  const filterCode = armoryFilterCode.value.toLocaleLowerCase()
  return sortedRows(armoryRows.value.filter((row) => {
    if (filterCode && row.code.toLocaleLowerCase() !== filterCode) return false
    if (!matchesStateFilter(row.is_active, stateFilter.value)) return false
    return !query || [
      row.code,
      row.name,
      row.descripcion,
      row.organization_unit_code,
      row.is_active ? 'activo' : 'inactivo',
      row.armas_count,
      row.created_at,
      row.updated_at,
    ].some((value) => String(value).toLocaleLowerCase().includes(query))
  }))
})

const visibleWeapons = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  const filterCode = armoryFilterCode.value.toLocaleLowerCase()
  return sortedRows(weaponRows.value.filter((row) => {
    if (filterCode && row.armory_code?.toLocaleLowerCase() !== filterCode) return false
    return !query || [
      row.id_arma,
      row.tipo_arma,
      weaponTypeLabel(row.tipo_arma),
      row.modelo_arma,
      row.numero_serie,
      row.armory_code,
      row.armory_name,
      row.organization_unit_code,
      row.calibre_code,
    ].some((value) => String(value ?? '').toLocaleLowerCase().includes(query))
  }))
})

const visibleCalibres = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  const filterCode = calibreFilterCode.value.toLocaleLowerCase()
  return sortedRows(calibreRows.value.filter((row) => {
    if (filterCode && row.code.toLocaleLowerCase() !== filterCode) return false
    if (!matchesStateFilter(row.is_active, stateFilter.value)) return false
    return !query || [row.id_calibre, row.code, row.nombre, row.is_active ? 'activo' : 'inactivo']
      .some((value) => String(value).toLocaleLowerCase().includes(query))
  }))
})

function sortValue(row: ArmoryDTO | WeaponDTO | CalibreDTO, key: string): string | number | boolean {
  if ('armas_count' in row) {
    if (key === 'is_active') return row.is_active
    if (key === 'armas_count') return row.armas_count
    if (key === 'created_at') return row.created_at
    if (key === 'updated_at') return row.updated_at
    if (key === 'organization_unit_code') return row.organization_unit_code
    if (key === 'name') return row.name
    return row.code
  }
  if ('id_arma' in row) {
    if (key === 'id_arma') return row.id_arma
    if (key === 'tipo_arma') return row.tipo_arma
    if (key === 'modelo_arma') return row.modelo_arma
    if (key === 'numero_serie') return row.numero_serie
    if (key === 'armory_code') return row.armory_code ?? ''
    if (key === 'organization_unit_code') return row.organization_unit_code ?? ''
    return row.calibre_code ?? ''
  }
  if (key === 'id_calibre') return row.id_calibre
  if (key === 'nombre') return row.nombre
  if (key === 'is_active') return row.is_active
  return row.code
}

function sortedRows<T extends ArmoryDTO | WeaponDTO | CalibreDTO>(rows: T[]): T[] {
  const direction = sortDirection.value === 'asc' ? 1 : -1
  return [...rows].sort((left, right) => {
    const a = sortValue(left, sortKey.value)
    const b = sortValue(right, sortKey.value)
    if (typeof a === 'number' && typeof b === 'number') return (a - b) * direction
    if (typeof a === 'boolean' && typeof b === 'boolean') return (Number(a) - Number(b)) * direction
    return String(a).localeCompare(String(b), 'es', { sensitivity: 'base', numeric: true }) * direction
  })
}

function toggleSort(key: string): void {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  sortKey.value = key
  sortDirection.value = 'asc'
}

function sortIndicator(key: string): string {
  return sortKey.value === key ? (sortDirection.value === 'asc' ? ' ▲' : ' ▼') : ''
}

function sortAria(key: string): 'ascending' | 'descending' | 'none' {
  return sortKey.value !== key ? 'none' : sortDirection.value === 'asc' ? 'ascending' : 'descending'
}

function weaponTypeLabel(code: string): string {
  return TIPO_ARMA_CHOICES.find(([value]) => value === code)?.[1] ?? code
}

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || String(value).trim() === '') return '—'
  return String(value)
}

const dateFormatter = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' })

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? displayValue(value) : dateFormatter.format(parsed)
}

function unitPath(code: string | null | undefined): string | null {
  if (!code) return null
  const unit = unitByCode.value.get(code)
  return unit ? `/organizacion/unidades/${unit.id}` : null
}

function armoryListLocation(code: string): { path: string; query: { armory: string } } {
  return { path: '/almacen/armerias', query: { armory: code } }
}

function weaponListLocation(code?: string | null): { path: string; query?: { armory: string } } {
  return code ? { path: '/almacen/armas', query: { armory: code } } : { path: '/almacen/armas' }
}

function calibreListLocation(code?: string | null): { path: string; query?: { code: string } } {
  return code ? { path: '/almacen/calibres', query: { code } } : { path: '/almacen/calibres' }
}

function errorStatus(error: unknown): number | null {
  if (error instanceof HttpRequestError || error instanceof ArmoryApiResponseError) return error.status
  if (error !== null && typeof error === 'object' && 'status' in error) {
    const status = error.status
    return typeof status === 'number' && Number.isSafeInteger(status) ? status : null
  }
  return null
}

function errorPayload(error: unknown): unknown {
  if (error instanceof HttpRequestError || error instanceof ArmoryApiResponseError) return error.payload
  if (error !== null && typeof error === 'object' && 'payload' in error) return error.payload
  return undefined
}

function errorDetail(error: unknown): string | null {
  if (error instanceof HttpRequestError || error instanceof ArmoryApiResponseError) return error.detail
  if (error !== null && typeof error === 'object' && 'detail' in error) {
    return typeof error.detail === 'string' ? error.detail : null
  }
  return null
}

function errorMessage(error: unknown): string {
  const status = errorStatus(error)
  const detail = errorDetail(error)
  if (status === 403) return detail || 'El servidor denegó esta operación (403). La sesión se mantiene activa.'
  if (status === 404) return detail || 'El recurso solicitado ya no está disponible (404).'
  if (status === 400) return detail || 'El servidor rechazó los datos enviados (400). Revisa los campos señalados.'
  if (error instanceof HttpRequestError && error.kind === 'network') {
    return 'No se pudo conectar con el servidor. No repitas una mutación sin reconciliar primero mediante lectura.'
  }
  if (error instanceof ArmoryApiResponseError) return detail || error.message
  if (error instanceof Error) return error.message
  return 'No fue posible completar la solicitud.'
}

function serverFieldErrors(error: unknown): Record<string, string> {
  const payload = errorPayload(error)
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return {}
  const supported = new Set([
    'code',
    'name',
    'descripcion',
    'is_active',
    'organization_unit_code_write',
    'tipo_arma',
    'modelo_arma',
    'numero_serie',
    'armory_code_write',
    'calibre_code_write',
    'nombre',
  ])
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (!supported.has(key)) continue
    if (typeof value === 'string' && value.trim()) result[key] = value
    else if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
      if (messages.length) result[key] = messages.join(' ')
    }
  }
  return result
}

function errorTone(error: unknown): MessageTone {
  return errorStatus(error) === 403 ? 'warning' : 'error'
}

function initialArmoryDraft(): void {
  armoryDraft.code = ''
  armoryDraft.name = ''
  armoryDraft.description = ''
  armoryDraft.organizationUnitCode = ''
  armoryDraft.isActive = ''
  originalArmory.value = null
}

function initialWeaponDraft(): void {
  weaponDraft.weaponType = ''
  weaponDraft.model = ''
  weaponDraft.serialNumber = ''
  weaponDraft.armoryCode = ''
  weaponDraft.calibreCode = ''
  originalWeapon.value = null
}

function initialCalibreDraft(): void {
  calibreDraft.code = ''
  calibreDraft.name = ''
  calibreDraft.isActive = ''
  originalCalibre.value = null
}

function clearModalPrivateState(): void {
  modalResourceId.value = null
  modalLoadState.value = LOAD_STATE.IDLE
  modalMessage.value = null
  modalFieldErrors.value = {}
  deleteTarget.value = null
  replacePending.value = null
  armoryDetail.value = null
  relatedWeapons.value = []
  relatedWeaponsState.value = LOAD_STATE.IDLE
  relatedWeaponsMessage.value = null
  initialArmoryDraft()
  initialWeaponDraft()
  initialCalibreDraft()
}

function syncPendingTickets(): void {
  pendingTickets.value = Array.from(activeRequests.values())
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
  mutationRisk: MutationRisk | null,
): OperationTicket | null {
  if (!sessionEligible.value || !session.identity || !currentView.value) return null
  const modalScope = modalScoped ? modalToken.value : 'page'
  const key = [operation, currentRouteKey.value, resourceKey, modalScope].join('|')
  const existing = activeRequests.get(key)
  if (existing) {
    activeRequests.delete(key)
    existing.controller.abort()
  }

  const attempt = (requestAttempts.get(key) ?? 0) + 1
  requestAttempts.set(key, attempt)
  const ticket: OperationTicket = {
    key,
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
    mutationRisk,
    controller: new AbortController(),
  }
  activeRequests.set(key, ticket)
  syncPendingTickets()
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

function abortAllRequests(preserveUncertainty: boolean): void {
  const pending = Array.from(activeRequests.values())
  activeRequests.clear()
  syncPendingTickets()

  if (preserveUncertainty && !uncertainMutation.value) {
    const interruptedMutation = pending.find((ticket) => ticket.mutationRisk !== null)
    if (interruptedMutation?.mutationRisk) {
      uncertainMutation.value = {
        ...interruptedMutation.mutationRisk,
        routeKey: interruptedMutation.routeKey,
        sessionKey: interruptedMutation.sessionKey,
        operation: interruptedMutation.operation,
      }
    }
  }

  for (const ticket of pending) ticket.controller.abort()
}

function abortModalRequests(token: number): void {
  const pending = Array.from(activeRequests.values()).filter((ticket) => ticket.modalToken === token)
  for (const ticket of pending) activeRequests.delete(ticket.key)
  syncPendingTickets()
  for (const ticket of pending) ticket.controller.abort()
}

function isUncertainMutationError(error: unknown): boolean {
  const status = errorStatus(error)
  return status === null || status < 400 || status >= 500
}

async function runRequest<T>(
  operation: string,
  resourceKey: string,
  request: (connection: ApiConnection) => Promise<T>,
  options: { modalScoped?: boolean; mutationRisk?: MutationRisk } = {},
): Promise<RequestOutcome<T>> {
  if (options.mutationRisk && uncertainMutation.value) return { kind: 'blocked' }
  const ticket = beginTicket(
    operation,
    resourceKey,
    options.modalScoped ?? false,
    options.mutationRisk ?? null,
  )
  if (!ticket) return { kind: 'blocked' }

  try {
    const value = await request(connectionFor(ticket))
    if (!ticketIsCurrent(ticket)) return { kind: 'stale' }
    return { kind: 'success', value }
  } catch (error: unknown) {
    if (!ticketIsCurrent(ticket)) return { kind: 'stale' }
    if (options.mutationRisk && isUncertainMutationError(error)) {
      uncertainMutation.value = {
        ...options.mutationRisk,
        routeKey: ticket.routeKey,
        sessionKey: ticket.sessionKey,
        operation: ticket.operation,
      }
    }
    return { kind: 'failure', error }
  } finally {
    if (ticketIsCurrent(ticket)) {
      activeRequests.delete(ticket.key)
      syncPendingTickets()
    }
  }
}

function setReadFailure(
  state: { value: LoadState },
  message: { value: UiMessage | null },
  error: unknown,
): void {
  const status = errorStatus(error)
  state.value = status === 403
    ? LOAD_STATE.DENIED
    : status === 404
      ? LOAD_STATE.NOT_FOUND
      : LOAD_STATE.ERROR
  message.value = { tone: errorTone(error), text: errorMessage(error) }
}

async function loadArmoryRows(): Promise<boolean> {
  armoryListState.value = LOAD_STATE.LOADING
  armoryListMessage.value = null
  const outcome = await runRequest('armory-list', 'armories', getArmories)
  if (outcome.kind === 'success') {
    armoryRows.value = outcome.value
    armoryListState.value = outcome.value.length ? LOAD_STATE.READY : LOAD_STATE.EMPTY
    return true
  }
  if (outcome.kind === 'failure') setReadFailure(armoryListState, armoryListMessage, outcome.error)
  return false
}

async function loadWeaponRows(): Promise<boolean> {
  weaponListState.value = LOAD_STATE.LOADING
  weaponListMessage.value = null
  const outcome = await runRequest('weapon-list', 'weapons', getWeapons)
  if (outcome.kind === 'success') {
    weaponRows.value = outcome.value
    weaponListState.value = outcome.value.length ? LOAD_STATE.READY : LOAD_STATE.EMPTY
    return true
  }
  if (outcome.kind === 'failure') setReadFailure(weaponListState, weaponListMessage, outcome.error)
  return false
}

async function loadCalibreRows(): Promise<boolean> {
  calibreListState.value = LOAD_STATE.LOADING
  calibreListMessage.value = null
  const outcome = await runRequest('calibre-list', 'calibres', getCalibres)
  if (outcome.kind === 'success') {
    calibreRows.value = outcome.value
    activeCalibres.value = outcome.value.filter((calibre) => calibre.is_active)
    calibreListState.value = outcome.value.length ? LOAD_STATE.READY : LOAD_STATE.EMPTY
    return true
  }
  if (outcome.kind === 'failure') setReadFailure(calibreListState, calibreListMessage, outcome.error)
  return false
}

async function loadActiveArmoryOptions(modalScoped = false): Promise<boolean> {
  armoryOptionsState.value = LOAD_STATE.LOADING
  armoryOptionsMessage.value = null
  const outcome = await runRequest(
    'armory-options',
    'active-armories',
    getActiveArmories,
    { modalScoped },
  )
  if (outcome.kind === 'success') {
    activeArmories.value = outcome.value
    armoryOptionsState.value = outcome.value.length ? LOAD_STATE.READY : LOAD_STATE.EMPTY
    return true
  }
  if (outcome.kind === 'failure') setReadFailure(armoryOptionsState, armoryOptionsMessage, outcome.error)
  return false
}

async function loadActiveCalibreOptions(modalScoped = false): Promise<boolean> {
  calibreOptionsState.value = LOAD_STATE.LOADING
  calibreOptionsMessage.value = null
  const outcome = await runRequest(
    'calibre-options',
    'active-calibres',
    getActiveCalibres,
    { modalScoped },
  )
  if (outcome.kind === 'success') {
    activeCalibres.value = outcome.value
    calibreOptionsState.value = outcome.value.length ? LOAD_STATE.READY : LOAD_STATE.EMPTY
    return true
  }
  if (outcome.kind === 'failure') setReadFailure(calibreOptionsState, calibreOptionsMessage, outcome.error)
  return false
}

async function loadUnitLookup(modalScoped = false): Promise<boolean> {
  unitLookupState.value = LOAD_STATE.LOADING
  unitLookupMessage.value = null
  const outcome = await runRequest(
    'unit-lookup',
    'organization-units-lookup',
    getOrganizationUnitsLookup,
    { modalScoped },
  )
  if (outcome.kind === 'success') {
    organizationUnits.value = outcome.value.results.filter((unit) => unit.is_active)
    unitLookupState.value = organizationUnits.value.length ? LOAD_STATE.READY : LOAD_STATE.EMPTY
    return true
  }
  if (outcome.kind === 'failure') setReadFailure(unitLookupState, unitLookupMessage, outcome.error)
  return false
}

async function loadWeaponRecord(id: number): Promise<boolean> {
  weaponDetailState.value = LOAD_STATE.LOADING
  weaponDetailMessage.value = null
  const outcome = await runRequest('weapon-detail', `weapon:${id}`, (connection) => getWeapon(id, connection))
  if (outcome.kind === 'success') {
    weaponDetail.value = outcome.value
    weaponDetailState.value = LOAD_STATE.READY
    return true
  }
  if (outcome.kind === 'failure') {
    weaponDetail.value = null
    setReadFailure(weaponDetailState, weaponDetailMessage, outcome.error)
  }
  return false
}

async function loadCurrentSurface(includeRelated = false): Promise<void> {
  if (!sessionEligible.value || !currentView.value) return

  if (currentView.value === VIEW.ARMORIES) {
    await Promise.all([
      loadArmoryRows(),
      loadUnitLookup(),
      ...(includeRelated ? [loadWeaponRows()] : []),
    ])
    if (armoryFilterCode.value) {
      const matched = armoryRows.value.find((armory) => armory.code === armoryFilterCode.value)
      if (matched) void openArmoryDetail(matched)
    }
    return
  }

  if (currentView.value === VIEW.WEAPONS) {
    await Promise.all([
      loadWeaponRows(),
      loadActiveArmoryOptions(),
      loadActiveCalibreOptions(),
      loadUnitLookup(),
      ...(includeRelated ? [loadArmoryRows()] : []),
    ])
    return
  }

  if (currentView.value === VIEW.WEAPON_DETAIL) {
    if (currentWeaponId.value === null) {
      weaponDetail.value = null
      weaponDetailState.value = LOAD_STATE.ERROR
      weaponDetailMessage.value = { tone: 'error', text: 'El identificador de arma de la ruta no es válido.' }
      return
    }
    await Promise.all([
      loadWeaponRecord(currentWeaponId.value),
      loadActiveArmoryOptions(),
      loadActiveCalibreOptions(),
      loadUnitLookup(),
      ...(includeRelated ? [loadWeaponRows(), loadArmoryRows()] : []),
    ])
    return
  }

  if (currentView.value === VIEW.CALIBRES) await loadCalibreRows()
}

function resetRouteData(clearUncertainty: boolean): void {
  const oldModalToken = modalToken.value
  modalOpen.value = false
  modalToken.value += 1
  modalKind.value = null
  clearModalPrivateState()
  abortAllRequests(!clearUncertainty)
  if (clearUncertainty) uncertainMutation.value = null

  armoryRows.value = []
  weaponRows.value = []
  calibreRows.value = []
  activeArmories.value = []
  activeCalibres.value = []
  organizationUnits.value = []
  armoryListState.value = LOAD_STATE.IDLE
  weaponListState.value = LOAD_STATE.IDLE
  calibreListState.value = LOAD_STATE.IDLE
  weaponDetailState.value = LOAD_STATE.IDLE
  armoryOptionsState.value = LOAD_STATE.IDLE
  calibreOptionsState.value = LOAD_STATE.IDLE
  unitLookupState.value = LOAD_STATE.IDLE
  relatedWeaponsState.value = LOAD_STATE.IDLE
  armoryListMessage.value = null
  weaponListMessage.value = null
  calibreListMessage.value = null
  weaponDetailMessage.value = null
  armoryOptionsMessage.value = null
  calibreOptionsMessage.value = null
  unitLookupMessage.value = null
  relatedWeaponsMessage.value = null
  pageNotice.value = null
  weaponDetail.value = null
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  searchText.value = ''
  searchQuery.value = ''
  stateFilter.value = STATE_FILTER.ALL
  sortKey.value = currentView.value === VIEW.WEAPONS || currentView.value === VIEW.WEAPON_DETAIL
    ? 'id_arma'
    : 'code'
  sortDirection.value = 'asc'
  abortModalRequests(oldModalToken)
}

watch(
  [sessionFingerprint, currentRouteKey, sessionEligible],
  (next, previous) => {
    const [nextSession, nextRoute, nextEligible] = next
    const previousSession = previous?.[0] ?? null
    const previousRoute = previous?.[1] ?? null
    const sessionChanged = previousSession === null || previousSession !== nextSession
    const routeChanged = previousRoute === null || previousRoute !== nextRoute
    if (!sessionChanged && !routeChanged) return

    resetRouteData(sessionChanged)
    if (nextEligible && currentView.value) void loadCurrentSurface()
  },
  { immediate: true, flush: 'sync' },
)

onBeforeRouteLeave(() => {
  const mutationPending = pendingTickets.value.some((ticket) => ticket.mutationRisk !== null)
  if (sessionEligible.value && (mutationPending || uncertainMutation.value)) {
    pageNotice.value = {
      tone: 'warning',
      text: 'Espera a que la operación confirme su resultado antes de salir de esta pantalla.',
    }
    return false
  }
  return true
})

onBeforeUnmount(() => {
  mounted = false
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  resetRouteData(true)
})

function openModal(kind: Exclude<ModalKind, null>): number {
  const previousToken = modalToken.value
  modalToken.value += 1
  abortModalRequests(previousToken)
  clearModalPrivateState()
  modalKind.value = kind
  modalOpen.value = true
  modalLoadState.value = LOAD_STATE.READY
  return modalToken.value
}

function closeModal(): void {
  if (!modalOpen.value && modalKind.value === null) return
  const closingToken = modalToken.value
  modalOpen.value = false
  modalToken.value += 1
  modalKind.value = null
  clearModalPrivateState()
  abortModalRequests(closingToken)
}

function handleModalVisibility(value: boolean): void {
  if (!value) closeModal()
}

function setModalFailure(error: unknown): void {
  modalMessage.value = { tone: errorTone(error), text: errorMessage(error) }
  modalFieldErrors.value = serverFieldErrors(error)
}

const REQUIRED_FIELD_MESSAGE = 'Este campo es obligatorio.'

function setFieldError(field: string, message: string): void {
  if (modalFieldErrors.value[field] === message) return
  modalFieldErrors.value = { ...modalFieldErrors.value, [field]: message }
}

function clearFieldError(field: string): void {
  if (!(field in modalFieldErrors.value)) return
  const next = { ...modalFieldErrors.value }
  delete next[field]
  modalFieldErrors.value = next
}

// La validación de obligatoriedad nace al perder el foco, no al escribir. Un
// error del servidor no se borra al editar: sólo el error de campo vacío deja
// de aplicar cuando el campo ya tiene contenido.
function validateRequired(field: string, value: string): void {
  const current = modalFieldErrors.value[field]
  if (!value.trim()) {
    setFieldError(field, REQUIRED_FIELD_MESSAGE)
    return
  }
  if (current === REQUIRED_FIELD_MESSAGE) clearFieldError(field)
}

// `@input` revalida, no limpia: el error no se borra al primer carácter.
function revalidateRequired(field: string, value: string): void {
  if (!(field in modalFieldErrors.value)) return
  validateRequired(field, value)
}

function fieldError(field: string): string {
  return modalFieldErrors.value[field] ?? ''
}

function openArmoryCreate(): void {
  openModal(MODAL.ARMORY_CREATE)
  if (unitLookupState.value === LOAD_STATE.IDLE || unitLookupState.value === LOAD_STATE.ERROR) {
    void loadUnitLookup(true)
  }
}

async function loadArmoryModalRecord(id: number): Promise<ArmoryDTO | null> {
  modalResourceId.value = id
  modalLoadState.value = LOAD_STATE.LOADING
  modalMessage.value = null
  const outcome = await runRequest(
    'armory-detail-modal',
    `armory:${id}`,
    (connection) => getArmory(id, connection),
    { modalScoped: true },
  )
  if (outcome.kind === 'success') {
    armoryDetail.value = outcome.value
    modalLoadState.value = LOAD_STATE.READY
    return outcome.value
  }
  if (outcome.kind === 'failure') {
    modalLoadState.value = errorStatus(outcome.error) === 404 ? LOAD_STATE.NOT_FOUND : LOAD_STATE.ERROR
    setModalFailure(outcome.error)
  }
  return null
}

async function loadRelatedArmoryWeapons(code: string, modalScoped = true): Promise<boolean> {
  relatedWeaponsState.value = LOAD_STATE.LOADING
  relatedWeaponsMessage.value = null
  const outcome = await runRequest(
    'armory-related-weapons',
    `armory-weapons:${code}`,
    (connection) => getWeaponsForArmory(code, connection),
    { modalScoped },
  )
  if (outcome.kind === 'success') {
    relatedWeapons.value = outcome.value
    relatedWeaponsState.value = outcome.value.length ? LOAD_STATE.READY : LOAD_STATE.EMPTY
    return true
  }
  if (outcome.kind === 'failure') setReadFailure(relatedWeaponsState, relatedWeaponsMessage, outcome.error)
  return false
}

async function openArmoryDetail(record: ArmoryDTO): Promise<void> {
  openModal(MODAL.ARMORY_DETAIL)
  const detail = await loadArmoryModalRecord(record.id)
  if (detail) await loadRelatedArmoryWeapons(detail.code)
}

async function openArmoryEdit(record: ArmoryDTO): Promise<void> {
  openModal(MODAL.ARMORY_EDIT)
  if (unitLookupState.value === LOAD_STATE.IDLE || unitLookupState.value === LOAD_STATE.ERROR) {
    void loadUnitLookup(true)
  }
  const detail = await loadArmoryModalRecord(record.id)
  if (!detail) return
  originalArmory.value = detail
  armoryDraft.code = detail.code
  armoryDraft.name = detail.name
  armoryDraft.description = detail.descripcion
  armoryDraft.organizationUnitCode = detail.organization_unit_code
  armoryDraft.isActive = String(detail.is_active) as BooleanChoice
}

async function openArmoryDelete(record: ArmoryDTO): Promise<void> {
  openModal(MODAL.ARMORY_DELETE)
  const detail = await loadArmoryModalRecord(record.id)
  if (!detail) return
  deleteTarget.value = {
    entity: 'armory',
    id: detail.id,
    action: 'delete',
    label: detail.name,
    detail: `Código ${detail.code}; armas asociadas: ${detail.armas_count}.`,
  }
  await loadRelatedArmoryWeapons(detail.code)
}

async function openWeaponCreate(): Promise<void> {
  openModal(MODAL.WEAPON_CREATE)
  await Promise.all([
    loadActiveArmoryOptions(true),
    loadActiveCalibreOptions(true),
  ])
}

async function openWeaponEdit(): Promise<void> {
  if (currentWeaponId.value === null) return
  openModal(MODAL.WEAPON_EDIT)
  const id = currentWeaponId.value
  const optionsPromise = Promise.all([
    loadActiveArmoryOptions(true),
    loadActiveCalibreOptions(true),
  ])
  modalResourceId.value = id
  modalLoadState.value = LOAD_STATE.LOADING
  const outcome = await runRequest(
    'weapon-detail-modal',
    `weapon:${id}`,
    (connection) => getWeapon(id, connection),
    { modalScoped: true },
  )
  await optionsPromise
  if (outcome.kind === 'success') {
    originalWeapon.value = outcome.value
    weaponDetail.value = outcome.value
    weaponDraft.weaponType = outcome.value.tipo_arma
    weaponDraft.model = outcome.value.modelo_arma
    weaponDraft.serialNumber = outcome.value.numero_serie
    weaponDraft.armoryCode = outcome.value.armory_code ?? ''
    weaponDraft.calibreCode = outcome.value.calibre_code ?? ''
    modalLoadState.value = LOAD_STATE.READY
  } else if (outcome.kind === 'failure') {
    modalLoadState.value = errorStatus(outcome.error) === 404 ? LOAD_STATE.NOT_FOUND : LOAD_STATE.ERROR
    setModalFailure(outcome.error)
  }
}

function openWeaponDelete(): void {
  const record = weaponDetail.value
  if (!record) return
  openModal(MODAL.WEAPON_DELETE)
  deleteTarget.value = {
    entity: 'weapon',
    id: record.id_arma,
    action: 'delete',
    label: record.modelo_arma,
    detail: `Número de serie ${displayValue(record.numero_serie)}.`,
  }
}

async function loadCalibreModalRecord(id: number): Promise<CalibreDTO | null> {
  modalResourceId.value = id
  modalLoadState.value = LOAD_STATE.LOADING
  modalMessage.value = null
  const outcome = await runRequest(
    'calibre-detail-modal',
    `calibre:${id}`,
    (connection) => getCalibre(id, connection),
    { modalScoped: true },
  )
  if (outcome.kind === 'success') {
    modalLoadState.value = LOAD_STATE.READY
    return outcome.value
  }
  if (outcome.kind === 'failure') {
    modalLoadState.value = errorStatus(outcome.error) === 404 ? LOAD_STATE.NOT_FOUND : LOAD_STATE.ERROR
    setModalFailure(outcome.error)
  }
  return null
}

async function retryModalRead(): Promise<void> {
  const kind = modalKind.value
  const id = modalResourceId.value
  if (id === null || kind === null) return

  if (kind.startsWith('armory-')) {
    const detail = await loadArmoryModalRecord(id)
    if (!detail) return
    if (kind === MODAL.ARMORY_EDIT) {
      originalArmory.value = detail
      armoryDraft.code = detail.code
      armoryDraft.name = detail.name
      armoryDraft.description = detail.descripcion
      armoryDraft.organizationUnitCode = detail.organization_unit_code
      armoryDraft.isActive = String(detail.is_active) as BooleanChoice
    }
    if (kind === MODAL.ARMORY_DELETE) {
      deleteTarget.value = {
        entity: 'armory',
        id: detail.id,
        action: 'delete',
        label: detail.name,
        detail: `Código ${detail.code}; armas asociadas: ${detail.armas_count}.`,
      }
    }
    if (kind === MODAL.ARMORY_DETAIL || kind === MODAL.ARMORY_DELETE) {
      await loadRelatedArmoryWeapons(detail.code)
    }
    return
  }

  if (kind.startsWith('calibre-')) {
    const detail = await loadCalibreModalRecord(id)
    if (!detail) return
    if (kind === MODAL.CALIBRE_EDIT) {
      originalCalibre.value = detail
      calibreDraft.code = detail.code
      calibreDraft.name = detail.nombre
      calibreDraft.isActive = String(detail.is_active) as BooleanChoice
    }
    if (kind === MODAL.CALIBRE_DELETE) {
      originalCalibre.value = detail
      deleteTarget.value = {
        entity: 'calibre',
        id: detail.id_calibre,
        action: 'delete',
        label: detail.code,
        detail: detail.nombre,
      }
    }
    return
  }

  if (kind === MODAL.WEAPON_EDIT) await openWeaponEdit()
}

function openCalibreCreate(): void {
  if (!canManageCalibres.value) return
  openModal(MODAL.CALIBRE_CREATE)
}

async function openCalibreEdit(record: CalibreDTO): Promise<void> {
  if (!canManageCalibres.value) return
  openModal(MODAL.CALIBRE_EDIT)
  const detail = await loadCalibreModalRecord(record.id_calibre)
  if (!detail) return
  originalCalibre.value = detail
  calibreDraft.code = detail.code
  calibreDraft.name = detail.nombre
  calibreDraft.isActive = String(detail.is_active) as BooleanChoice
}

async function openCalibreDelete(record: CalibreDTO): Promise<void> {
  if (!canManageCalibres.value) return
  openModal(MODAL.CALIBRE_DELETE)
  const detail = await loadCalibreModalRecord(record.id_calibre)
  if (!detail) return
  originalCalibre.value = detail
  deleteTarget.value = {
    entity: 'calibre',
    id: detail.id_calibre,
    action: 'delete',
    label: detail.code,
    detail: detail.nombre,
  }
}

function booleanChoice(value: BooleanChoice): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function requiredFieldsValid(fields: readonly { key: string; value: string }[]): boolean {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    if (!field.value.trim()) errors[field.key] = REQUIRED_FIELD_MESSAGE
  }
  if (Object.keys(errors).length) {
    modalFieldErrors.value = { ...modalFieldErrors.value, ...errors }
    modalMessage.value = { tone: 'error', text: 'Revisa los campos obligatorios.' }
    return false
  }
  return true
}

function blockedMutationMessage(): void {
  modalMessage.value = {
    tone: 'warning',
    text: 'Hay una mutación sin resultado confirmado. Reconcíliala mediante lectura antes de enviar otra.',
  }
}

async function submitArmory(mode: 'create' | 'put' | 'patch'): Promise<void> {
  modalMessage.value = null
  modalFieldErrors.value = {}
  if (!requiredFieldsValid([
    { key: 'code', value: armoryDraft.code },
    { key: 'name', value: armoryDraft.name },
  ])) return

  if (mode === 'create') {
    const body: CreateArmoryBody = {
      code: armoryDraft.code.trim(),
      name: armoryDraft.name.trim(),
      ...(armoryDraft.description.trim() ? { descripcion: armoryDraft.description.trim() } : {}),
      ...(booleanChoice(armoryDraft.isActive) === undefined
        ? {}
        : { is_active: booleanChoice(armoryDraft.isActive) as boolean }),
      ...(armoryDraft.organizationUnitCode.trim()
        ? { organization_unit_code_write: armoryDraft.organizationUnitCode.trim() }
        : {}),
    }
    const outcome = await runRequest(
      'armory-create',
      'armory:new',
      (connection) => createArmory(body, connection),
      { modalScoped: true, mutationRisk: { entity: 'armory', id: null, action: 'create' } },
    )
    if (outcome.kind === 'success') {
      pageNotice.value = { tone: 'success', text: 'El servidor respondió con la armería creada; el listado se vuelve a cargar.' }
      await showArmoryAfterWrite(outcome.value)
    } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
    else if (outcome.kind === 'blocked') blockedMutationMessage()
    return
  }

  const original = originalArmory.value
  if (!original) return
  const id = original.id
  if (mode === 'put') {
    const body: ReplaceArmoryBody = {
      code: armoryDraft.code.trim(),
      name: armoryDraft.name.trim(),
      descripcion: armoryDraft.description,
      is_active: armoryDraft.isActive === 'true',
      organization_unit_code_write: armoryDraft.organizationUnitCode.trim(),
    }
    const outcome = await runRequest(
      'armory-put',
      `armory:${id}`,
      (connection) => replaceArmory(id, body, connection),
      { modalScoped: true, mutationRisk: { entity: 'armory', id, action: 'update' } },
    )
    if (outcome.kind === 'success') {
      pageNotice.value = { tone: 'success', text: 'El servidor respondió con la armería actualizada; el listado se vuelve a cargar.' }
      await showArmoryAfterWrite(outcome.value)
    } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
    else if (outcome.kind === 'blocked') blockedMutationMessage()
    return
  }

  const body: PatchArmoryBody = {}
  if (armoryDraft.code.trim() !== original.code) body.code = armoryDraft.code.trim()
  if (armoryDraft.name.trim() !== original.name) body.name = armoryDraft.name.trim()
  if (armoryDraft.description !== original.descripcion) body.descripcion = armoryDraft.description
  if (armoryDraft.isActive && (armoryDraft.isActive === 'true') !== original.is_active) {
    body.is_active = armoryDraft.isActive === 'true'
  }
  if (armoryDraft.organizationUnitCode.trim() !== original.organization_unit_code) {
    body.organization_unit_code_write = armoryDraft.organizationUnitCode.trim()
  }
  if (!Object.keys(body).length) {
    modalMessage.value = { tone: 'info', text: 'No hay cambios para enviar.' }
    return
  }
  const outcome = await runRequest(
    'armory-patch',
    `armory:${id}`,
    (connection) => patchArmory(id, body, connection),
    { modalScoped: true, mutationRisk: { entity: 'armory', id, action: 'update' } },
  )
  if (outcome.kind === 'success') {
    pageNotice.value = { tone: 'success', text: 'El servidor respondió con la armería actualizada; el listado se vuelve a cargar.' }
    await showArmoryAfterWrite(outcome.value)
  } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
  else if (outcome.kind === 'blocked') blockedMutationMessage()
}

async function showArmoryAfterWrite(record: ArmoryDTO): Promise<void> {
  modalKind.value = MODAL.ARMORY_DETAIL
  modalResourceId.value = record.id
  modalLoadState.value = LOAD_STATE.READY
  armoryDetail.value = record
  originalArmory.value = null
  initialArmoryDraft()
  modalFieldErrors.value = {}
  modalMessage.value = { tone: 'success', text: 'Datos recibidos del servidor.' }
  relatedWeapons.value = []
  relatedWeaponsState.value = LOAD_STATE.LOADING
  relatedWeaponsMessage.value = null
  await Promise.all([
    loadArmoryRows(),
    loadRelatedArmoryWeapons(record.code),
  ])
}

async function submitWeapon(mode: 'create' | 'put' | 'patch'): Promise<void> {
  modalMessage.value = null
  modalFieldErrors.value = {}
  if (!requiredFieldsValid([
    { key: 'tipo_arma', value: weaponDraft.weaponType },
    { key: 'modelo_arma', value: weaponDraft.model },
    { key: 'numero_serie', value: weaponDraft.serialNumber },
  ])) return

  const weaponType = weaponDraft.weaponType as ArmaTypeCode
  if (mode === 'create') {
    const body: CreateWeaponBody = {
      tipo_arma: weaponType,
      modelo_arma: weaponDraft.model.trim(),
      numero_serie: weaponDraft.serialNumber.trim(),
      ...(weaponDraft.armoryCode.trim() ? { armory_code_write: weaponDraft.armoryCode.trim() } : {}),
      ...(weaponDraft.calibreCode.trim() ? { calibre_code_write: weaponDraft.calibreCode.trim() } : {}),
    }
    const outcome = await runRequest(
      'weapon-create',
      'weapon:new',
      (connection) => createWeapon(body, connection),
      { modalScoped: true, mutationRisk: { entity: 'weapon', id: null, action: 'create' } },
    )
    if (outcome.kind === 'success') {
      pageNotice.value = { tone: 'success', text: 'El servidor respondió con el arma creada; el listado se vuelve a cargar.' }
      closeModal()
      await loadCurrentSurface(true)
    } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
    else if (outcome.kind === 'blocked') blockedMutationMessage()
    return
  }

  const original = originalWeapon.value
  if (!original) return
  const id = original.id_arma
  if (mode === 'put') {
    const body: ReplaceWeaponBody = {
      tipo_arma: weaponType,
      modelo_arma: weaponDraft.model.trim(),
      numero_serie: weaponDraft.serialNumber.trim(),
      armory_code_write: weaponDraft.armoryCode.trim(),
      calibre_code_write: weaponDraft.calibreCode.trim() || null,
    }
    const outcome = await runRequest(
      'weapon-put',
      `weapon:${id}`,
      (connection) => replaceWeapon(id, body, connection),
      { modalScoped: true, mutationRisk: { entity: 'weapon', id, action: 'update' } },
    )
    if (outcome.kind === 'success') {
      pageNotice.value = { tone: 'success', text: 'El servidor respondió con el arma actualizada; ficha y colección se vuelven a cargar.' }
      closeModal()
      await loadCurrentSurface(true)
    } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
    else if (outcome.kind === 'blocked') blockedMutationMessage()
    return
  }

  const body: PatchWeaponBody = {}
  if (weaponDraft.weaponType !== original.tipo_arma) body.tipo_arma = weaponType
  if (weaponDraft.model.trim() !== original.modelo_arma) body.modelo_arma = weaponDraft.model.trim()
  if (weaponDraft.serialNumber.trim() !== original.numero_serie) body.numero_serie = weaponDraft.serialNumber.trim()
  if (weaponDraft.armoryCode.trim() !== (original.armory_code ?? '')) {
    body.armory_code_write = weaponDraft.armoryCode.trim()
  }
  if (weaponDraft.calibreCode.trim() !== (original.calibre_code ?? '')) {
    body.calibre_code_write = weaponDraft.calibreCode.trim() || null
  }
  if (!Object.keys(body).length) {
    modalMessage.value = { tone: 'info', text: 'No hay cambios para enviar.' }
    return
  }
  const outcome = await runRequest(
    'weapon-patch',
    `weapon:${id}`,
    (connection) => patchWeapon(id, body, connection),
    { modalScoped: true, mutationRisk: { entity: 'weapon', id, action: 'update' } },
  )
  if (outcome.kind === 'success') {
    pageNotice.value = { tone: 'success', text: 'El servidor respondió con el arma actualizada; ficha y colección se vuelven a cargar.' }
    closeModal()
    await loadCurrentSurface(true)
  } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
  else if (outcome.kind === 'blocked') blockedMutationMessage()
}

async function submitCalibre(mode: 'create' | 'put' | 'patch'): Promise<void> {
  if (!canManageCalibres.value) return
  modalMessage.value = null
  modalFieldErrors.value = {}
  if (!requiredFieldsValid([
    { key: 'code', value: calibreDraft.code },
    { key: 'nombre', value: calibreDraft.name },
  ])) return

  if (mode === 'create') {
    const body: CreateCalibreBody = {
      code: calibreDraft.code.trim(),
      nombre: calibreDraft.name.trim(),
      ...(booleanChoice(calibreDraft.isActive) === undefined
        ? {}
        : { is_active: booleanChoice(calibreDraft.isActive) as boolean }),
    }
    const outcome = await runRequest(
      'calibre-create',
      'calibre:new',
      (connection) => createCalibre(body, connection),
      { modalScoped: true, mutationRisk: { entity: 'calibre', id: null, action: 'create' } },
    )
    if (outcome.kind === 'success') {
      pageNotice.value = { tone: 'success', text: 'El servidor respondió con el calibre creado; el catálogo se vuelve a cargar.' }
      closeModal()
      await loadCalibreRows()
    } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
    else if (outcome.kind === 'blocked') blockedMutationMessage()
    return
  }

  const original = originalCalibre.value
  if (!original) return
  const id = original.id_calibre
  if (mode === 'put') {
    const body: ReplaceCalibreBody = {
      code: calibreDraft.code.trim(),
      nombre: calibreDraft.name.trim(),
      is_active: calibreDraft.isActive === 'true',
    }
    const outcome = await runRequest(
      'calibre-put',
      `calibre:${id}`,
      (connection) => replaceCalibre(id, body, connection),
      { modalScoped: true, mutationRisk: { entity: 'calibre', id, action: 'update' } },
    )
    if (outcome.kind === 'success') {
      pageNotice.value = { tone: 'success', text: 'El servidor respondió con el calibre actualizado; el catálogo se vuelve a cargar.' }
      closeModal()
      await loadCalibreRows()
    } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
    else if (outcome.kind === 'blocked') blockedMutationMessage()
    return
  }

  const body: PatchCalibreBody = {}
  if (calibreDraft.code.trim() !== original.code) body.code = calibreDraft.code.trim()
  if (calibreDraft.name.trim() !== original.nombre) body.nombre = calibreDraft.name.trim()
  if (calibreDraft.isActive && (calibreDraft.isActive === 'true') !== original.is_active) {
    body.is_active = calibreDraft.isActive === 'true'
  }
  if (!Object.keys(body).length) {
    modalMessage.value = { tone: 'info', text: 'No hay cambios para enviar.' }
    return
  }
  const outcome = await runRequest(
    'calibre-patch',
    `calibre:${id}`,
    (connection) => patchCalibre(id, body, connection),
    { modalScoped: true, mutationRisk: { entity: 'calibre', id, action: 'update' } },
  )
  if (outcome.kind === 'success') {
    pageNotice.value = { tone: 'success', text: 'El servidor respondió con el calibre actualizado; el catálogo se vuelve a cargar.' }
    closeModal()
    await loadCalibreRows()
  } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
  else if (outcome.kind === 'blocked') blockedMutationMessage()
}

function submitFormDefault(): void {
  switch (modalKind.value) {
    case MODAL.ARMORY_CREATE: void submitArmory('create'); break
    case MODAL.ARMORY_EDIT: void submitArmory('patch'); break
    case MODAL.WEAPON_CREATE: void submitWeapon('create'); break
    case MODAL.WEAPON_EDIT: void submitWeapon('patch'); break
    case MODAL.CALIBRE_CREATE: void submitCalibre('create'); break
    case MODAL.CALIBRE_EDIT: void submitCalibre('patch'); break
  }
}

function requestReplace(target: ReplaceTarget): void {
  replacePending.value = target
}

function cancelReplace(): void {
  replacePending.value = null
}

async function confirmReplace(): Promise<void> {
  const target = replacePending.value
  if (!target) return
  replacePending.value = null
  if (target === REPLACE_TARGET.ARMORY) await submitArmory('put')
  else if (target === REPLACE_TARGET.WEAPON) await submitWeapon('put')
  else await submitCalibre('put')
}

async function submitDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target) return
  modalMessage.value = null
  const risk: MutationRisk = { entity: target.entity, id: target.id, action: 'delete' }

  if (target.entity === 'armory' && target.id !== null) {
    const outcome = await runRequest(
      'armory-delete',
      `armory:${target.id}`,
      (connection) => deleteArmory(target.id as number, connection),
      { modalScoped: true, mutationRisk: risk },
    )
    if (outcome.kind === 'success') {
      pageNotice.value = { tone: 'success', text: 'El servidor respondió a la baja. Armerías y armas asociadas se vuelven a cargar; no se presupone una reasignación.' }
      closeModal()
      await loadCurrentSurface(true)
    } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
    else if (outcome.kind === 'blocked') blockedMutationMessage()
    return
  }

  if (target.entity === 'weapon' && target.id !== null) {
    const outcome = await runRequest(
      'weapon-delete',
      `weapon:${target.id}`,
      (connection) => deleteWeapon(target.id as number, connection),
      { modalScoped: true, mutationRisk: risk },
    )
    if (outcome.kind === 'success') {
      pageNotice.value = { tone: 'success', text: 'El servidor respondió a la baja. No se simulan transferencias ni cambios de stock.' }
      closeModal()
      weaponDetail.value = null
      weaponDetailState.value = LOAD_STATE.NOT_FOUND
      weaponDetailMessage.value = { tone: 'warning', text: 'El arma fue dada de baja según la respuesta del servidor.' }
      await Promise.all([loadWeaponRows(), loadArmoryRows()])
    } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
    else if (outcome.kind === 'blocked') blockedMutationMessage()
    return
  }

  if (target.entity === 'calibre' && target.id !== null) {
    if (!canManageCalibres.value) return
    const outcome = await runRequest(
      'calibre-delete',
      `calibre:${target.id}`,
      (connection) => deleteCalibre(target.id as number, connection),
      { modalScoped: true, mutationRisk: risk },
    )
    if (outcome.kind === 'success') {
      pageNotice.value = { tone: 'success', text: 'El servidor respondió a la baja. El catálogo se vuelve a cargar.' }
      closeModal()
      await loadCalibreRows()
    } else if (outcome.kind === 'failure') setModalFailure(outcome.error)
    else if (outcome.kind === 'blocked') blockedMutationMessage()
  }
}

function uncertainMutationLabel(value: UncertainMutation): string {
  const names = { armory: 'armería', weapon: 'arma', calibre: 'calibre' } as const
  const actions = { create: 'alta', update: 'edición', delete: 'baja' } as const
  return `${actions[value.action]} de ${names[value.entity]}`
}

function clearUncertainAfterRead(message: string): void {
  uncertainMutation.value = null
  pageNotice.value = { tone: 'info', text: `${message} La mutación no se repitió.` }
}

async function reconcileUncertainMutation(): Promise<void> {
  const pending = uncertainMutation.value
  if (!pending || !sessionEligible.value) return

  const resource = pending.id === null ? `${pending.entity}:collection` : `${pending.entity}:${pending.id}`
  const outcome = await runRequest(
    'reconcile',
    resource,
    async (connection): Promise<unknown> => {
      if (pending.entity === 'armory') {
        if (pending.id === null) {
          const rows = await getArmories(connection)
          armoryRows.value = rows
          armoryListState.value = rows.length ? LOAD_STATE.READY : LOAD_STATE.EMPTY
          return rows
        }
        const record = await getArmory(pending.id, connection)
        armoryDetail.value = record
        return record
      }
      if (pending.entity === 'weapon') {
        if (pending.id === null) {
          const rows = await getWeapons(connection)
          weaponRows.value = rows
          weaponListState.value = rows.length ? LOAD_STATE.READY : LOAD_STATE.EMPTY
          return rows
        }
        const record = await getWeapon(pending.id, connection)
        weaponDetail.value = record
        weaponDetailState.value = LOAD_STATE.READY
        return record
      }
      if (pending.id === null) {
        const rows = await getCalibres(connection)
        calibreRows.value = rows
        activeCalibres.value = rows.filter((calibre) => calibre.is_active)
        calibreListState.value = rows.length ? LOAD_STATE.READY : LOAD_STATE.EMPTY
        return rows
      }
      const record = await getCalibre(pending.id, connection)
      return record
    },
  )

  if (outcome.kind === 'success') {
    clearUncertainAfterRead(`Lectura explícita completada para ${uncertainMutationLabel(pending)}.`)
    await loadCurrentSurface(true)
    return
  }

  if (outcome.kind === 'failure' && errorStatus(outcome.error) === 404 && pending.id !== null) {
    if (pending.entity === 'weapon' && currentView.value === VIEW.WEAPON_DETAIL) {
      weaponDetail.value = null
      weaponDetailState.value = LOAD_STATE.NOT_FOUND
      weaponDetailMessage.value = { tone: 'warning', text: 'La lectura explícita confirmó que el arma ya no está disponible.' }
    }
    clearUncertainAfterRead(`La lectura explícita confirmó que el recurso de ${uncertainMutationLabel(pending)} ya no está disponible.`)
    if (pending.entity === 'weapon' && currentView.value === VIEW.WEAPON_DETAIL) {
      await Promise.all([loadWeaponRows(), loadArmoryRows()])
    } else {
      await loadCurrentSurface(true)
    }
    return
  }

  if (outcome.kind === 'failure') {
    pageNotice.value = { tone: errorTone(outcome.error), text: `La reconciliación no se completó: ${errorMessage(outcome.error)}` }
  }
}

function clearRouteFilter(): void {
  if (currentView.value === VIEW.ARMORIES) void router.replace({ path: '/almacen/armerias' })
  else if (currentView.value === VIEW.WEAPONS) void router.replace({ path: '/almacen/armas' })
  else if (currentView.value === VIEW.CALIBRES) void router.replace({ path: '/almacen/calibres' })
}
</script>

<template>
  <section class="armory-view" aria-labelledby="armory-page-title">
    <header class="page-head">
      <div>
        <h1 id="armory-page-title" class="page-title">{{ pageTitle }}</h1>
        <nav v-if="currentView === VIEW.WEAPON_DETAIL" class="breadcrumb" aria-label="Ruta de navegación">
          <RouterLink to="/">Inicio</RouterLink>
          <span aria-hidden="true">›</span>
          <span>Almacén</span>
          <span aria-hidden="true">›</span>
          <RouterLink to="/almacen/armas">Armas</RouterLink>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{{ weaponDetailTitle }}</span>
        </nav>
        <p class="page-subtitle">{{ pageDescription }}</p>
      </div>
      <div class="page-actions">
        <button
          v-if="currentView"
          type="button"
          class="btn btn-outline-primary"
          :disabled="!sessionEligible || pageBusy"
          :aria-busy="pageBusy"
          @click="loadCurrentSurface(true)"
        >
          {{ pageBusy ? 'Actualizando…' : 'Actualizar' }}
        </button>
        <button
          v-if="currentView === VIEW.ARMORIES"
          type="button"
          class="btn btn-primary"
          :disabled="!sessionEligible || Boolean(uncertainMutation)"
          @click="openArmoryCreate"
        >
          Crear armería
        </button>
        <button
          v-if="currentView === VIEW.WEAPONS"
          type="button"
          class="btn btn-primary"
          :disabled="!sessionEligible || Boolean(uncertainMutation)"
          @click="openWeaponCreate"
        >
          Registrar arma
        </button>
        <button
          v-if="currentView === VIEW.CALIBRES && canManageCalibres"
          type="button"
          class="btn btn-primary"
          :disabled="!sessionEligible || Boolean(uncertainMutation)"
          @click="openCalibreCreate"
        >
          Crear calibre
        </button>
        <RouterLink v-if="currentView === VIEW.WEAPON_DETAIL" class="btn btn-outline-primary" to="/almacen/armas">
          Volver a armas
        </RouterLink>
      </div>
    </header>

    <div v-if="!sessionEligible" class="alert alert-warning" role="status">
      Esta superficie requiere una sesión válida, institución y unidad activa. Resuelve el contexto antes de consultar el almacén.
    </div>

    <div class="page-notice" role="status" aria-live="polite">
      <div v-if="pageNotice" class="alert" :class="`alert-${pageNotice.tone}`">{{ pageNotice.text }}</div>
    </div>

    <div v-if="uncertainMutation && !modalOpen" class="alert alert-warning state-message" role="alert" aria-live="assertive">
      <div class="state-copy">
        <div class="state-title">Resultado de operación sin confirmar</div>
        <div class="state-description">{{ uncertainNoticeText }}</div>
      </div>
      <button type="button" class="btn btn-outline-primary state-action" :disabled="reconcileBusy || !sessionEligible" @click="reconcileUncertainMutation">
        {{ reconcileBusy ? 'Leyendo…' : 'Reconciliar mediante lectura' }}
      </button>
    </div>

    <div v-if="sessionEligible && currentView === null" class="alert alert-warning" role="status">
      Esta ruta no corresponde a una superficie del almacén.
    </div>

    <section v-if="sessionEligible && currentView === VIEW.ARMORIES" class="card armories-card" aria-labelledby="armories-title">
      <div class="card-header">
        <h2 id="armories-title" class="card-title">Armerías</h2>
        <p class="card-subtitle">Búsqueda y orden sobre la colección cargada.</p>
      </div>
      <div class="card-body">
        <div class="list-filters">
          <label class="search-field">
            <span class="form-label">Buscar armerías</span>
            <input v-model="searchText" class="form-control" type="search" placeholder="Código, nombre o unidad" />
          </label>
          <label class="filter-field">
            <span class="form-label">Estado</span>
            <select id="armory-state" v-model="stateFilter" class="form-select">
              <option :value="STATE_FILTER.ALL">Todas</option>
              <option :value="STATE_FILTER.ACTIVE">Activas</option>
              <option :value="STATE_FILTER.INACTIVE">Inactivas</option>
            </select>
          </label>
        </div>
      </div>
      <div class="card-body no-pad">
        <div v-if="armoryListState === LOAD_STATE.LOADING" class="surface-loading" role="status" aria-live="polite">
          <span class="loading-spinner" aria-hidden="true"></span>
          <span>Cargando armerías…</span>
        </div>
        <div v-else-if="armoryListState === LOAD_STATE.DENIED" class="alert alert-warning" role="alert">{{ armoryListMessage?.text }}</div>
        <div v-else-if="armoryListState === LOAD_STATE.ERROR || armoryListState === LOAD_STATE.NOT_FOUND" class="alert alert-danger" role="alert">
          {{ armoryListMessage?.text }}
          <button type="button" class="btn btn-outline-primary" :disabled="pageBusy" @click="loadArmoryRows">Reintentar lectura</button>
        </div>
        <div v-else-if="armoryListState === LOAD_STATE.EMPTY" class="surface-state" role="status">No hay armerías en el ámbito activo.</div>
        <div v-else class="table-responsive">
          <table class="table table-centered">
            <caption class="visually-hidden">Armerías y armas asociadas del ámbito activo</caption>
            <thead>
              <tr>
                <th scope="col" :aria-sort="sortAria('code')"><button type="button" class="sort-button" @click="toggleSort('code')">Código{{ sortIndicator('code') }}</button></th>
                <th scope="col" :aria-sort="sortAria('name')"><button type="button" class="sort-button" @click="toggleSort('name')">Nombre{{ sortIndicator('name') }}</button></th>
                <th scope="col" class="desc-cell">Descripción</th>
                <th scope="col" :aria-sort="sortAria('organization_unit_code')"><button type="button" class="sort-button" @click="toggleSort('organization_unit_code')">Unidad{{ sortIndicator('organization_unit_code') }}</button></th>
                <th scope="col" :aria-sort="sortAria('is_active')"><button type="button" class="sort-button" @click="toggleSort('is_active')">Estado{{ sortIndicator('is_active') }}</button></th>
                <th scope="col" :aria-sort="sortAria('armas_count')"><button type="button" class="sort-button" @click="toggleSort('armas_count')">Armas{{ sortIndicator('armas_count') }}</button></th>
                <th scope="col" :aria-sort="sortAria('updated_at')"><button type="button" class="sort-button" @click="toggleSort('updated_at')">Actualizada{{ sortIndicator('updated_at') }}</button></th>
                <th scope="col"><span class="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="armory in visibleArmories" :key="armory.id">
                <td><button type="button" class="text-link" @click="openArmoryDetail(armory)">{{ displayValue(armory.code) }}</button></td>
                <td>{{ displayValue(armory.name) }}</td>
                <td class="desc-cell" :title="displayValue(armory.descripcion)">{{ displayValue(armory.descripcion) }}</td>
                <td>
                  <RouterLink v-if="unitPath(armory.organization_unit_code)" :to="unitPath(armory.organization_unit_code) || '/'" class="text-link">
                    {{ armory.organization_unit_code }}
                  </RouterLink>
                  <span v-else>{{ displayValue(armory.organization_unit_code) }}</span>
                </td>
                <td><span :class="armory.is_active ? 'badge badge-success-sm' : 'badge badge-danger-sm'">{{ armory.is_active ? 'Activa' : 'Inactiva' }}</span></td>
                <td><RouterLink class="text-link" :to="weaponListLocation(armory.code)" :aria-label="`Ver ${armory.armas_count} armas de ${armory.name}`">{{ armory.armas_count }}</RouterLink></td>
                <td>{{ formatDate(armory.updated_at) }}</td>
                <td>
                  <div class="table-actions">
                    <button type="button" class="btn btn-outline-primary btn-sm" :disabled="Boolean(uncertainMutation)" @click="openArmoryEdit(armory)">Editar</button>
                    <button type="button" class="btn btn-outline-danger btn-sm" :disabled="Boolean(uncertainMutation)" @click="openArmoryDelete(armory)">Dar de baja</button>
                  </div>
                </td>
              </tr>
              <tr v-if="armoryListState === LOAD_STATE.READY && visibleArmories.length === 0">
                <td colspan="8" class="empty-cell">{{ armoryEmptyMessage }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="list-count">{{ visibleArmories.length }} de {{ armoryRows.length }} armerías cargadas</p>
        <div v-if="armoryFilterCode" class="filter-note">
          Filtro por armería: <strong>{{ armoryFilterCode }}</strong>
          <button type="button" class="text-link" @click="clearRouteFilter">Quitar filtro</button>
        </div>
        <div v-if="stateFilter !== STATE_FILTER.ALL" class="filter-note">
          Filtro por estado: <strong>{{ stateFilterLabel }}</strong>
          <button type="button" class="text-link" @click="clearStateFilter">Ver todas las armerías</button>
        </div>
        <div v-if="unitLookupMessage" class="alert" :class="`alert-${unitLookupMessage.tone}`" role="status">Unidades organizativas: {{ unitLookupMessage.text }}</div>
      </div>
    </section>

    <section v-if="sessionEligible && currentView === VIEW.WEAPONS" class="card weapons-card" aria-labelledby="weapons-title">
      <div class="card-header">
        <h2 id="weapons-title" class="card-title">Armas</h2>
        <p class="card-subtitle">Relaciones y datos del contexto activo.</p>
      </div>
      <div class="card-body">
        <label class="search-field">
          <span class="form-label">Buscar armas</span>
          <input v-model="searchText" class="form-control" type="search" placeholder="Modelo, serie, tipo o relación" />
        </label>
      </div>
      <div class="card-body no-pad">
        <div v-if="weaponListState === LOAD_STATE.LOADING" class="surface-loading" role="status" aria-live="polite">
          <span class="loading-spinner" aria-hidden="true"></span>
          <span>Cargando armas…</span>
        </div>
        <div v-else-if="weaponListState === LOAD_STATE.DENIED" class="alert alert-warning" role="alert">{{ weaponListMessage?.text }}</div>
        <div v-else-if="weaponListState === LOAD_STATE.ERROR || weaponListState === LOAD_STATE.NOT_FOUND" class="alert alert-danger" role="alert">
          {{ weaponListMessage?.text }}
          <button type="button" class="btn btn-outline-primary" :disabled="pageBusy" @click="loadWeaponRows">Reintentar lectura</button>
        </div>
        <div v-else-if="weaponListState === LOAD_STATE.EMPTY" class="surface-state" role="status">No hay armas en el contexto activo.</div>
        <div v-else class="table-responsive">
          <table class="table table-centered">
            <caption class="visually-hidden">Armas del contexto activo</caption>
            <thead>
              <tr>
                <th scope="col" :aria-sort="sortAria('id_arma')"><button type="button" class="sort-button" @click="toggleSort('id_arma')">ID{{ sortIndicator('id_arma') }}</button></th>
                <th scope="col" :aria-sort="sortAria('tipo_arma')"><button type="button" class="sort-button" @click="toggleSort('tipo_arma')">Tipo{{ sortIndicator('tipo_arma') }}</button></th>
                <th scope="col" :aria-sort="sortAria('modelo_arma')"><button type="button" class="sort-button" @click="toggleSort('modelo_arma')">Modelo{{ sortIndicator('modelo_arma') }}</button></th>
                <th scope="col" :aria-sort="sortAria('numero_serie')"><button type="button" class="sort-button" @click="toggleSort('numero_serie')">Número de serie{{ sortIndicator('numero_serie') }}</button></th>
                <th scope="col" :aria-sort="sortAria('armory_code')"><button type="button" class="sort-button" @click="toggleSort('armory_code')">Armería{{ sortIndicator('armory_code') }}</button></th>
                <th scope="col" :aria-sort="sortAria('organization_unit_code')"><button type="button" class="sort-button" @click="toggleSort('organization_unit_code')">Unidad{{ sortIndicator('organization_unit_code') }}</button></th>
                <th scope="col" :aria-sort="sortAria('calibre_code')"><button type="button" class="sort-button" @click="toggleSort('calibre_code')">Calibre{{ sortIndicator('calibre_code') }}</button></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="weapon in visibleWeapons" :key="weapon.id_arma">
                <td><RouterLink class="text-link" :to="`/almacen/armas/${weapon.id_arma}`">{{ weapon.id_arma }}</RouterLink></td>
                <td><span class="badge bg-primary">{{ weaponTypeLabel(weapon.tipo_arma) }}</span></td>
                <td>{{ displayValue(weapon.modelo_arma) }}</td>
                <td>{{ displayValue(weapon.numero_serie) }}</td>
                <td>
                  <RouterLink v-if="weapon.armory_code" class="text-link" :to="armoryListLocation(weapon.armory_code)">
                    {{ weapon.armory_code }} · {{ displayValue(weapon.armory_name) }}
                  </RouterLink>
                  <span v-else>—</span>
                </td>
                <td>
                  <RouterLink v-if="unitPath(weapon.organization_unit_code)" :to="unitPath(weapon.organization_unit_code) || '/'" class="text-link">
                    {{ weapon.organization_unit_code }}
                  </RouterLink>
                  <span v-else>{{ displayValue(weapon.organization_unit_code) }}</span>
                </td>
                <td>
                  <RouterLink v-if="weapon.calibre_code" class="text-link" :to="calibreListLocation(weapon.calibre_code)">{{ weapon.calibre_code }}</RouterLink>
                  <span v-else>—</span>
                </td>
              </tr>
              <tr v-if="weaponListState === LOAD_STATE.READY && visibleWeapons.length === 0">
                <td colspan="7" class="empty-cell">{{ weaponEmptyMessage }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="list-count">{{ visibleWeapons.length }} de {{ weaponRows.length }} armas cargadas</p>
        <div v-if="armoryFilterCode" class="filter-note">
          Filtro por armería: <strong>{{ armoryFilterCode }}</strong>
          <button type="button" class="text-link" @click="clearRouteFilter">Quitar filtro</button>
        </div>
        <div v-if="armoryOptionsMessage" class="alert" :class="`alert-${armoryOptionsMessage.tone}`" role="status">Armerías disponibles: {{ armoryOptionsMessage.text }}</div>
        <div v-if="calibreOptionsMessage" class="alert" :class="`alert-${calibreOptionsMessage.tone}`" role="status">Calibres disponibles: {{ calibreOptionsMessage.text }}</div>
        <div v-if="unitLookupMessage" class="alert" :class="`alert-${unitLookupMessage.tone}`" role="status">Unidades organizativas: {{ unitLookupMessage.text }}</div>
      </div>
    </section>

    <section v-if="sessionEligible && currentView === VIEW.WEAPON_DETAIL" class="card weapon-detail-card" aria-labelledby="weapon-detail-title">
      <div class="card-body">
        <h2 id="weapon-detail-title" class="card-title">{{ weaponDetailTitle }}</h2>
        <p class="card-text text-muted">ID {{ weaponDetail?.id_arma ?? '—' }}</p>
        <div v-if="weaponDetail" class="table-actions">
          <button type="button" class="btn btn-outline-primary" :disabled="Boolean(uncertainMutation)" @click="openWeaponEdit">Editar</button>
          <button type="button" class="btn btn-outline-danger" :disabled="Boolean(uncertainMutation)" @click="openWeaponDelete">Dar de baja</button>
        </div>
        <div v-if="weaponDetailState === LOAD_STATE.LOADING" class="surface-loading" role="status">
          <span class="loading-spinner" aria-hidden="true"></span>
          <span>Cargando ficha…</span>
        </div>
        <div v-else-if="weaponDetailState === LOAD_STATE.DENIED" class="alert alert-warning" role="alert">{{ weaponDetailMessage?.text }}</div>
        <div v-else-if="weaponDetailState === LOAD_STATE.NOT_FOUND" class="alert alert-warning" role="status">{{ weaponDetailMessage?.text }}</div>
        <div v-else-if="weaponDetailState === LOAD_STATE.ERROR" class="alert alert-danger" role="alert">
          {{ weaponDetailMessage?.text }}
          <button type="button" class="btn btn-outline-primary" :disabled="pageBusy || currentWeaponId === null" @click="currentWeaponId && loadWeaponRecord(currentWeaponId)">Reintentar lectura</button>
        </div>
        <dl v-else-if="weaponDetail" class="detail-grid">
          <div><dt>ID de arma</dt><dd>{{ weaponDetail.id_arma }}</dd></div>
          <div><dt>Tipo</dt><dd><span class="badge bg-primary">{{ weaponTypeLabel(weaponDetail.tipo_arma) }}</span></dd></div>
          <div><dt>Modelo</dt><dd>{{ displayValue(weaponDetail.modelo_arma) }}</dd></div>
          <div><dt>Número de serie</dt><dd>{{ displayValue(weaponDetail.numero_serie) }}</dd></div>
          <div><dt>Institución (solo lectura)</dt><dd>{{ displayValue(weaponDetail.tenant) }}</dd></div>
          <div><dt>Unidad derivada (solo lectura)</dt><dd>
            <RouterLink v-if="unitPath(weaponDetail.organization_unit_code)" :to="unitPath(weaponDetail.organization_unit_code) || '/'" class="text-link">{{ weaponDetail.organization_unit_code }}</RouterLink>
            <span v-else>{{ displayValue(weaponDetail.organization_unit_code) }}</span>
          </dd></div>
          <div><dt>Armería (solo lectura)</dt><dd>
            <RouterLink v-if="weaponDetail.armory_code" class="text-link" :to="armoryListLocation(weaponDetail.armory_code)">
              {{ weaponDetail.armory_code }} · {{ displayValue(weaponDetail.armory_name) }}
            </RouterLink>
            <span v-else>—</span>
          </dd></div>
          <div><dt>Calibre (solo lectura)</dt><dd>
            <RouterLink v-if="weaponDetail.calibre_code" class="text-link" :to="calibreListLocation(weaponDetail.calibre_code)">{{ weaponDetail.calibre_code }}</RouterLink>
            <span v-else>—</span>
          </dd></div>
        </dl>
      </div>
    </section>

    <section v-if="sessionEligible && currentView === VIEW.CALIBRES" class="card calibres-card" aria-labelledby="calibres-title">
      <div class="card-header">
        <h2 id="calibres-title" class="card-title">Catálogo de calibres</h2>
        <p class="card-subtitle">Lectura para todos los contextos. Las acciones de gestión solo se ofrecen a las cuentas que reúnen el permiso de calibres y el rol correspondiente.</p>
        <p class="card-subtitle">Crear, editar o dar de baja un calibre exige el permiso de calibres y el rol super administrador (super_admin). El servidor valida ambos; para el resto de las cuentas el catálogo queda en modo lectura.</p>
      </div>
      <div class="card-body">
        <div class="list-filters">
          <label class="search-field">
            <span class="form-label">Buscar calibres</span>
            <input v-model="searchText" class="form-control" type="search" placeholder="Código o nombre" />
          </label>
          <label class="filter-field">
            <span class="form-label">Estado</span>
            <select id="calibre-state" v-model="stateFilter" class="form-select">
              <option :value="STATE_FILTER.ALL">Todos</option>
              <option :value="STATE_FILTER.ACTIVE">Activos</option>
              <option :value="STATE_FILTER.INACTIVE">Inactivos</option>
            </select>
          </label>
        </div>
      </div>
      <div class="card-body no-pad">
        <div v-if="calibreListState === LOAD_STATE.LOADING" class="surface-loading" role="status" aria-live="polite">
          <span class="loading-spinner" aria-hidden="true"></span>
          <span>Cargando calibres…</span>
        </div>
        <div v-else-if="calibreListState === LOAD_STATE.DENIED" class="alert alert-warning" role="alert">{{ calibreListMessage?.text }}</div>
        <div v-else-if="calibreListState === LOAD_STATE.ERROR || calibreListState === LOAD_STATE.NOT_FOUND" class="alert alert-danger" role="alert">
          {{ calibreListMessage?.text }}
          <button type="button" class="btn btn-outline-primary" :disabled="pageBusy" @click="loadCalibreRows">Reintentar lectura</button>
        </div>
        <div v-else-if="calibreListState === LOAD_STATE.EMPTY" class="surface-state" role="status">No hay calibres en el catálogo.</div>
        <div v-else class="table-responsive">
          <table class="table table-centered">
            <caption class="visually-hidden">Catálogo global de calibres</caption>
            <thead>
              <tr>
                <th scope="col" :aria-sort="sortAria('id_calibre')"><button type="button" class="sort-button" @click="toggleSort('id_calibre')">ID{{ sortIndicator('id_calibre') }}</button></th>
                <th scope="col" :aria-sort="sortAria('code')"><button type="button" class="sort-button" @click="toggleSort('code')">Código{{ sortIndicator('code') }}</button></th>
                <th scope="col" :aria-sort="sortAria('nombre')"><button type="button" class="sort-button" @click="toggleSort('nombre')">Nombre{{ sortIndicator('nombre') }}</button></th>
                <th scope="col" :aria-sort="sortAria('is_active')"><button type="button" class="sort-button" @click="toggleSort('is_active')">Estado{{ sortIndicator('is_active') }}</button></th>
                <th v-if="canManageCalibres" scope="col"><span class="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="calibre in visibleCalibres" :key="calibre.id_calibre">
                <td>{{ calibre.id_calibre }}</td>
                <td>{{ displayValue(calibre.code) }}</td>
                <td>{{ displayValue(calibre.nombre) }}</td>
                <td><span :class="calibre.is_active ? 'badge badge-success-sm' : 'badge badge-danger-sm'">{{ calibre.is_active ? 'Activo' : 'Inactivo' }}</span></td>
                <td v-if="canManageCalibres">
                  <div class="table-actions">
                    <button type="button" class="btn btn-outline-primary btn-sm" :disabled="Boolean(uncertainMutation)" @click="openCalibreEdit(calibre)">Editar</button>
                    <button type="button" class="btn btn-outline-danger btn-sm" :disabled="Boolean(uncertainMutation)" @click="openCalibreDelete(calibre)">Dar de baja</button>
                  </div>
                </td>
              </tr>
              <tr v-if="calibreListState === LOAD_STATE.READY && visibleCalibres.length === 0">
                <td :colspan="canManageCalibres ? 5 : 4" class="empty-cell">{{ calibreEmptyMessage }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="list-count">{{ visibleCalibres.length }} de {{ calibreRows.length }} calibres cargados</p>
        <div v-if="calibreFilterCode" class="filter-note">
          Filtro por código: <strong>{{ calibreFilterCode }}</strong>
          <button type="button" class="text-link" @click="clearRouteFilter">Quitar filtro</button>
        </div>
        <div v-if="stateFilter !== STATE_FILTER.ALL" class="filter-note">
          Filtro por estado: <strong>{{ stateFilterLabel }}</strong>
          <button type="button" class="text-link" @click="clearStateFilter">Ver todos los calibres</button>
        </div>
      </div>
    </section>

    <DsModal
      :model-value="modalOpen"
      :title="modalTitle"
      :busy="modalBusy"
      modal-id="armory-operation-modal"
      @update:model-value="handleModalVisibility"
      @close="closeModal"
    >
      <template #body>
        <div v-if="modalMessage && modalLoadState !== LOAD_STATE.ERROR && modalLoadState !== LOAD_STATE.NOT_FOUND" class="alert" :class="`alert-${modalMessage.tone}`" role="status" aria-live="polite">
          {{ modalMessage.text }}
        </div>
        <div v-if="uncertainMutation" class="alert alert-warning state-message" role="alert">
          <div class="state-copy">{{ uncertainNoticeText }}</div>
          <button type="button" class="btn btn-outline-primary state-action" :disabled="reconcileBusy" @click="reconcileUncertainMutation">{{ reconcileBusy ? 'Leyendo…' : 'Reconciliar mediante lectura' }}</button>
        </div>

        <div v-if="replacePending" class="alert alert-warning state-message" role="status">
          <div class="state-copy">{{ replaceConfirmText }}</div>
        </div>

        <div v-if="modalLoadState === LOAD_STATE.LOADING" class="surface-loading" role="status" aria-live="polite">
          <span class="loading-spinner" aria-hidden="true"></span>
          <span>Leyendo el registro…</span>
        </div>
        <div v-if="modalLoadState === LOAD_STATE.ERROR || modalLoadState === LOAD_STATE.NOT_FOUND" class="alert" :class="modalLoadState === LOAD_STATE.NOT_FOUND ? 'alert-warning' : 'alert-danger'" role="alert">
          {{ modalMessage?.text }}
          <button
            v-if="modalResourceId !== null"
            type="button"
            class="btn btn-outline-primary"
            :disabled="modalBusy"
            @click="retryModalRead"
          >
            Reintentar lectura
          </button>
        </div>

        <article v-if="modalKind === MODAL.ARMORY_DETAIL && armoryDetail && modalLoadState === LOAD_STATE.READY" class="modal-record">
          <dl class="detail-grid">
            <div><dt>ID</dt><dd>{{ armoryDetail.id }}</dd></div>
            <div><dt>Código</dt><dd>{{ armoryDetail.code }}</dd></div>
            <div><dt>Nombre</dt><dd>{{ armoryDetail.name }}</dd></div>
            <div><dt>Descripción</dt><dd>{{ displayValue(armoryDetail.descripcion) }}</dd></div>
            <div><dt>Unidad derivada</dt><dd>
              <RouterLink v-if="unitPath(armoryDetail.organization_unit_code)" :to="unitPath(armoryDetail.organization_unit_code) || '/'" class="text-link">{{ armoryDetail.organization_unit_code }}</RouterLink>
              <span v-else>{{ displayValue(armoryDetail.organization_unit_code) }}</span>
            </dd></div>
            <div><dt>Estado</dt><dd><span :class="armoryDetail.is_active ? 'badge badge-success-sm' : 'badge badge-danger-sm'">{{ armoryDetail.is_active ? 'Activa' : 'Inactiva' }}</span></dd></div>
            <div><dt>Institución</dt><dd>{{ displayValue(armoryDetail.tenant) }}</dd></div>
            <div><dt>Armas asociadas</dt><dd><RouterLink class="text-link" :to="weaponListLocation(armoryDetail.code)">{{ armoryDetail.armas_count }}</RouterLink></dd></div>
            <div><dt>Creada</dt><dd>{{ formatDate(armoryDetail.created_at) }}</dd></div>
            <div><dt>Actualizada</dt><dd>{{ formatDate(armoryDetail.updated_at) }}</dd></div>
          </dl>
          <section class="related-section" aria-labelledby="related-weapons-title">
            <h3 id="related-weapons-title" class="related-title">Armas de esta armería</h3>
            <div v-if="relatedWeaponsState === LOAD_STATE.LOADING" class="surface-loading" role="status">
              <span class="loading-spinner" aria-hidden="true"></span>
              <span>Cargando armas asociadas…</span>
            </div>
            <div v-else-if="relatedWeaponsState === LOAD_STATE.DENIED || relatedWeaponsState === LOAD_STATE.ERROR" class="alert" :class="`alert-${relatedWeaponsMessage?.tone ?? 'error'}`" role="status">{{ relatedWeaponsMessage?.text }}</div>
            <p v-else-if="relatedWeaponsState === LOAD_STATE.EMPTY" class="muted-copy">La lectura no devolvió armas asociadas.</p>
            <ul v-else class="related-list">
              <li v-for="weapon in relatedWeapons" :key="weapon.id_arma">
                <RouterLink class="text-link" :to="`/almacen/armas/${weapon.id_arma}`">{{ weapon.modelo_arma }} · {{ weapon.numero_serie }}</RouterLink>
              </li>
            </ul>
          </section>
        </article>

        <form v-if="modalKind === MODAL.ARMORY_CREATE || (modalKind === MODAL.ARMORY_EDIT && modalLoadState === LOAD_STATE.READY)" id="armory-editor-form" class="editor-form" @submit.prevent="submitFormDefault">
          <div class="armory-editor-fields">
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="armory-code">Código <span aria-hidden="true">*</span></label>
              <input id="armory-code" v-model.trim="armoryDraft.code" class="form-control" :class="{ 'is-invalid': fieldError('code') }" type="text" required :aria-invalid="Boolean(fieldError('code'))" aria-describedby="armory-code-error" @input="revalidateRequired('code', armoryDraft.code)" @blur="validateRequired('code', armoryDraft.code)" />
              <div id="armory-code-error" class="invalid-feedback">{{ fieldError('code') }}</div>
            </div>
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="armory-name">Nombre <span aria-hidden="true">*</span></label>
              <input id="armory-name" v-model.trim="armoryDraft.name" class="form-control" :class="{ 'is-invalid': fieldError('name') }" type="text" required :aria-invalid="Boolean(fieldError('name'))" aria-describedby="armory-name-error" @input="revalidateRequired('name', armoryDraft.name)" @blur="validateRequired('name', armoryDraft.name)" />
              <div id="armory-name-error" class="invalid-feedback">{{ fieldError('name') }}</div>
            </div>
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="armory-description">Descripción</label>
              <textarea id="armory-description" v-model="armoryDraft.description" class="form-control" rows="3" :class="{ 'is-invalid': fieldError('descripcion') }" :aria-invalid="Boolean(fieldError('descripcion'))" aria-describedby="armory-description-error" @input="revalidateRequired('descripcion', armoryDraft.description)" />
              <div id="armory-description-error" class="invalid-feedback">{{ fieldError('descripcion') }}</div>
            </div>
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="armory-unit">Unidad organizativa</label>
              <select id="armory-unit" v-model="armoryDraft.organizationUnitCode" class="form-select" :class="{ 'is-invalid': fieldError('organization_unit_code_write') }" :aria-invalid="Boolean(fieldError('organization_unit_code_write'))" aria-describedby="armory-unit-error" @change="revalidateRequired('organization_unit_code_write', armoryDraft.organizationUnitCode)">
                <option value="">Sin código de unidad escrito</option>
                <option v-if="unavailableUnitCode" :value="unavailableUnitCode" disabled>Referencia actual no disponible: {{ unavailableUnitCode }}</option>
                <option v-for="unit in organizationUnits" :key="unit.id" :value="unit.code">{{ unit.code }} · {{ unit.name }}</option>
              </select>
              <div id="armory-unit-error" class="invalid-feedback">{{ fieldError('organization_unit_code_write') }}</div>
              <small v-if="modalKind === MODAL.ARMORY_CREATE" class="field-hint">Opcional. Si se omite, la unidad se deriva del contexto.</small>
              <small v-if="unitLookupState === LOAD_STATE.LOADING" class="field-hint">Leyendo unidades disponibles…</small>
              <small v-else-if="unitLookupState === LOAD_STATE.EMPTY" class="field-hint">No hay unidades activas disponibles.</small>
            </div>
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="armory-active">Estado</label>
              <select id="armory-active" v-model="armoryDraft.isActive" class="form-select" :class="{ 'is-invalid': fieldError('is_active') }" :required="modalKind === MODAL.ARMORY_EDIT" :aria-invalid="Boolean(fieldError('is_active'))" aria-describedby="armory-active-error" @change="revalidateRequired('is_active', armoryDraft.isActive)">
                <option value="">Usar valor predeterminado del servidor</option>
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
              <div id="armory-active-error" class="invalid-feedback">{{ fieldError('is_active') }}</div>
            </div>
          </div>
        </form>

        <form v-if="modalKind === MODAL.WEAPON_CREATE || (modalKind === MODAL.WEAPON_EDIT && modalLoadState === LOAD_STATE.READY)" id="weapon-editor-form" class="editor-form" @submit.prevent="submitFormDefault">
          <div v-if="modalKind === MODAL.WEAPON_EDIT && originalWeapon" class="read-only-context">
            <strong>Relaciones de solo lectura</strong>
            <span>Institución: {{ displayValue(originalWeapon.tenant) }}</span>
            <span>Unidad derivada: {{ displayValue(originalWeapon.organization_unit_code) }}</span>
            <span>Armería actual: {{ displayValue(originalWeapon.armory_code) }} · {{ displayValue(originalWeapon.armory_name) }}</span>
            <span>Calibre actual: {{ displayValue(originalWeapon.calibre_code) }}</span>
          </div>
          <div class="armory-editor-fields">
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="weapon-type">Tipo de arma <span aria-hidden="true">*</span></label>
              <select id="weapon-type" v-model="weaponDraft.weaponType" class="form-select" :class="{ 'is-invalid': fieldError('tipo_arma') }" required :aria-invalid="Boolean(fieldError('tipo_arma'))" aria-describedby="weapon-type-error" @change="revalidateRequired('tipo_arma', weaponDraft.weaponType)">
                <option value="" disabled>Selecciona un tipo</option>
                <option v-for="choice in weaponTypeOptions" :key="choice.value" :value="choice.value">{{ choice.label }}</option>
              </select>
              <div id="weapon-type-error" class="invalid-feedback">{{ fieldError('tipo_arma') }}</div>
            </div>
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="weapon-model">Modelo <span aria-hidden="true">*</span></label>
              <input id="weapon-model" v-model.trim="weaponDraft.model" class="form-control" :class="{ 'is-invalid': fieldError('modelo_arma') }" type="text" required :aria-invalid="Boolean(fieldError('modelo_arma'))" aria-describedby="weapon-model-error" @input="revalidateRequired('modelo_arma', weaponDraft.model)" @blur="validateRequired('modelo_arma', weaponDraft.model)" />
              <div id="weapon-model-error" class="invalid-feedback">{{ fieldError('modelo_arma') }}</div>
            </div>
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="weapon-serial">Número de serie <span aria-hidden="true">*</span></label>
              <input id="weapon-serial" v-model.trim="weaponDraft.serialNumber" class="form-control" :class="{ 'is-invalid': fieldError('numero_serie') }" type="text" required :aria-invalid="Boolean(fieldError('numero_serie'))" aria-describedby="weapon-serial-error" @input="revalidateRequired('numero_serie', weaponDraft.serialNumber)" @blur="validateRequired('numero_serie', weaponDraft.serialNumber)" />
              <div id="weapon-serial-error" class="invalid-feedback">{{ fieldError('numero_serie') }}</div>
            </div>
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="weapon-armory">Armería</label>
              <select id="weapon-armory" v-model="weaponDraft.armoryCode" class="form-select" :class="{ 'is-invalid': fieldError('armory_code_write') }" :aria-invalid="Boolean(fieldError('armory_code_write'))" aria-describedby="weapon-armory-error" @change="revalidateRequired('armory_code_write', weaponDraft.armoryCode)">
                <option value="">Sin armería</option>
                <option v-if="unavailableArmoryCode" :value="unavailableArmoryCode" disabled>Referencia actual no seleccionable: {{ unavailableArmoryCode }}</option>
                <option v-for="armory in activeArmories" :key="armory.id" :value="armory.code">{{ armory.code }} · {{ armory.name }}</option>
              </select>
              <div id="weapon-armory-error" class="invalid-feedback">{{ fieldError('armory_code_write') }}</div>
              <small v-if="armoryOptionsState === LOAD_STATE.EMPTY" class="field-hint">No hay armerías activas disponibles.</small>
              <small v-else-if="armoryOptionsState === LOAD_STATE.LOADING" class="field-hint">Leyendo armerías activas…</small>
              <small v-if="modalKind === MODAL.WEAPON_EDIT" class="field-hint">La armería es obligatoria. La unidad se deriva de la armería.</small>
            </div>
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="weapon-calibre">Calibre</label>
              <select id="weapon-calibre" v-model="weaponDraft.calibreCode" class="form-select" :class="{ 'is-invalid': fieldError('calibre_code_write') }" :aria-invalid="Boolean(fieldError('calibre_code_write'))" aria-describedby="weapon-calibre-error" @change="revalidateRequired('calibre_code_write', weaponDraft.calibreCode)">
                <option value="">Sin calibre</option>
                <option v-if="unavailableCalibreCode" :value="unavailableCalibreCode" disabled>Referencia actual no seleccionable: {{ unavailableCalibreCode }}</option>
                <option v-for="calibre in activeCalibres" :key="calibre.id_calibre" :value="calibre.code">{{ calibre.code }} · {{ calibre.nombre }}</option>
              </select>
              <div id="weapon-calibre-error" class="invalid-feedback">{{ fieldError('calibre_code_write') }}</div>
              <small v-if="calibreOptionsState === LOAD_STATE.EMPTY" class="field-hint">No hay calibres activos disponibles.</small>
              <small v-else-if="calibreOptionsState === LOAD_STATE.LOADING" class="field-hint">Leyendo calibres activos…</small>
              <small v-if="unavailableCalibreCode" class="field-hint">La referencia actual se conserva como lectura; no se modifica.</small>
            </div>
          </div>
        </form>

        <form v-if="modalKind === MODAL.CALIBRE_CREATE || (modalKind === MODAL.CALIBRE_EDIT && modalLoadState === LOAD_STATE.READY)" id="calibre-editor-form" class="editor-form" @submit.prevent="submitFormDefault">
          <div class="armory-editor-fields">
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="calibre-code">Código <span aria-hidden="true">*</span></label>
              <input id="calibre-code" v-model.trim="calibreDraft.code" class="form-control" :class="{ 'is-invalid': fieldError('code') }" type="text" required :aria-invalid="Boolean(fieldError('code'))" aria-describedby="calibre-code-error" @input="revalidateRequired('code', calibreDraft.code)" @blur="validateRequired('code', calibreDraft.code)" />
              <div id="calibre-code-error" class="invalid-feedback">{{ fieldError('code') }}</div>
            </div>
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="calibre-name">Nombre <span aria-hidden="true">*</span></label>
              <input id="calibre-name" v-model.trim="calibreDraft.name" class="form-control" :class="{ 'is-invalid': fieldError('nombre') }" type="text" required :aria-invalid="Boolean(fieldError('nombre'))" aria-describedby="calibre-name-error" @input="revalidateRequired('nombre', calibreDraft.name)" @blur="validateRequired('nombre', calibreDraft.name)" />
              <div id="calibre-name-error" class="invalid-feedback">{{ fieldError('nombre') }}</div>
            </div>
            <div class="mb-3 armory-editor-field">
              <label class="form-label" for="calibre-active">Estado</label>
              <select id="calibre-active" v-model="calibreDraft.isActive" class="form-select" :class="{ 'is-invalid': fieldError('is_active') }" :required="modalKind === MODAL.CALIBRE_EDIT" :aria-invalid="Boolean(fieldError('is_active'))" aria-describedby="calibre-active-error" @change="revalidateRequired('is_active', calibreDraft.isActive)">
                <option value="">Usar valor predeterminado del servidor</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
              <div id="calibre-active-error" class="invalid-feedback">{{ fieldError('is_active') }}</div>
            </div>
          </div>
        </form>

        <div v-if="modalKind === MODAL.ARMORY_DELETE && deleteTarget && modalLoadState === LOAD_STATE.READY" class="delete-summary">
          <p>Se solicitará la baja de <strong>{{ deleteTarget.label }}</strong>.</p>
          <p>{{ deleteTarget.detail }}</p>
          <p v-if="armoryDetail">La armería tiene {{ armoryDetail.armas_count }} armas asociadas.</p>
        </div>
        <div v-if="modalKind === MODAL.WEAPON_DELETE && deleteTarget" class="delete-summary">
          <p>Se solicitará la baja de <strong>{{ deleteTarget.label }}</strong>.</p>
          <p>{{ deleteTarget.detail }}</p>
          <p>No se transfieren ni se sustituyen existencias.</p>
        </div>
        <div v-if="modalKind === MODAL.CALIBRE_DELETE && deleteTarget && modalLoadState === LOAD_STATE.READY" class="delete-summary">
          <p>Se solicitará la baja del calibre <strong>{{ deleteTarget.label }}</strong>.</p>
          <p>{{ deleteTarget.detail }}</p>
          <p>No se modifican automáticamente las armas asociadas.</p>
        </div>
      </template>

      <template #footer>
        <button v-if="!replacePending" type="button" class="btn btn-secondary" :disabled="modalBusy" @click="closeModal">Cerrar</button>

        <template v-if="modalKind === MODAL.ARMORY_DETAIL && armoryDetail">
          <button type="button" class="btn btn-outline-primary" :disabled="Boolean(uncertainMutation)" @click="openArmoryEdit(armoryDetail)">Editar</button>
          <button type="button" class="btn btn-outline-danger" :disabled="Boolean(uncertainMutation)" @click="openArmoryDelete(armoryDetail)">Dar de baja</button>
        </template>

        <template v-if="modalKind === MODAL.ARMORY_CREATE">
          <button type="submit" form="armory-editor-form" class="btn btn-primary" :disabled="modalBusy || Boolean(uncertainMutation)">Crear armería</button>
        </template>
        <template v-if="modalKind === MODAL.ARMORY_EDIT">
          <template v-if="replacePending === REPLACE_TARGET.ARMORY">
            <button type="button" class="btn btn-secondary" :disabled="modalBusy" @click="cancelReplace">Cancelar</button>
            <button type="button" class="btn btn-primary" :disabled="modalBusy || modalLoadState !== LOAD_STATE.READY || Boolean(uncertainMutation)" @click="confirmReplace">Confirmar reemplazo</button>
          </template>
          <template v-else>
            <button type="button" class="btn btn-outline-primary" :disabled="modalBusy || modalLoadState !== LOAD_STATE.READY || Boolean(uncertainMutation)" @click="requestReplace(REPLACE_TARGET.ARMORY)">Reemplazar todos los campos</button>
            <button type="submit" form="armory-editor-form" class="btn btn-primary" :disabled="modalBusy || modalLoadState !== LOAD_STATE.READY || Boolean(uncertainMutation)">Guardar cambios</button>
          </template>
        </template>
        <template v-if="modalKind === MODAL.ARMORY_DELETE">
          <button type="button" class="btn btn-danger" :disabled="modalBusy || modalLoadState !== LOAD_STATE.READY || !deleteTarget || Boolean(uncertainMutation)" @click="submitDelete">Confirmar baja</button>
        </template>

        <template v-if="modalKind === MODAL.WEAPON_CREATE">
          <button type="submit" form="weapon-editor-form" class="btn btn-primary" :disabled="modalBusy || Boolean(uncertainMutation)">Registrar arma</button>
        </template>
        <template v-if="modalKind === MODAL.WEAPON_EDIT">
          <template v-if="replacePending === REPLACE_TARGET.WEAPON">
            <button type="button" class="btn btn-secondary" :disabled="modalBusy" @click="cancelReplace">Cancelar</button>
            <button type="button" class="btn btn-primary" :disabled="modalBusy || modalLoadState !== LOAD_STATE.READY || Boolean(uncertainMutation)" @click="confirmReplace">Confirmar reemplazo</button>
          </template>
          <template v-else>
            <button type="button" class="btn btn-outline-primary" :disabled="modalBusy || modalLoadState !== LOAD_STATE.READY || Boolean(uncertainMutation)" @click="requestReplace(REPLACE_TARGET.WEAPON)">Reemplazar todos los campos</button>
            <button type="submit" form="weapon-editor-form" class="btn btn-primary" :disabled="modalBusy || modalLoadState !== LOAD_STATE.READY || Boolean(uncertainMutation)">Guardar cambios</button>
          </template>
        </template>
        <template v-if="modalKind === MODAL.WEAPON_DELETE">
          <button type="button" class="btn btn-danger" :disabled="modalBusy || !deleteTarget || Boolean(uncertainMutation)" @click="submitDelete">Confirmar baja</button>
        </template>

        <template v-if="modalKind === MODAL.CALIBRE_CREATE && canManageCalibres">
          <button type="submit" form="calibre-editor-form" class="btn btn-primary" :disabled="modalBusy || Boolean(uncertainMutation)">Crear calibre</button>
        </template>
        <template v-if="modalKind === MODAL.CALIBRE_EDIT && canManageCalibres">
          <template v-if="replacePending === REPLACE_TARGET.CALIBRE">
            <button type="button" class="btn btn-secondary" :disabled="modalBusy" @click="cancelReplace">Cancelar</button>
            <button type="button" class="btn btn-primary" :disabled="modalBusy || modalLoadState !== LOAD_STATE.READY || Boolean(uncertainMutation)" @click="confirmReplace">Confirmar reemplazo</button>
          </template>
          <template v-else>
            <button type="button" class="btn btn-outline-primary" :disabled="modalBusy || modalLoadState !== LOAD_STATE.READY || Boolean(uncertainMutation)" @click="requestReplace(REPLACE_TARGET.CALIBRE)">Reemplazar todos los campos</button>
            <button type="submit" form="calibre-editor-form" class="btn btn-primary" :disabled="modalBusy || modalLoadState !== LOAD_STATE.READY || Boolean(uncertainMutation)">Guardar cambios</button>
          </template>
        </template>
        <template v-if="modalKind === MODAL.CALIBRE_DELETE && canManageCalibres">
          <button type="button" class="btn btn-danger" :disabled="modalBusy || modalLoadState !== LOAD_STATE.READY || !deleteTarget || Boolean(uncertainMutation)" @click="submitDelete">Confirmar baja</button>
        </template>
      </template>
    </DsModal>
  </section>
</template>

<style scoped>
.armory-view {
  min-width: 0;
}

.page-actions,
.table-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.search-field {
  display: block;
  width: min(100%, 320px);
}

.list-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}

.filter-field {
  display: block;
  width: min(100%, 200px);
}

/* La anatomía (gap 6, 14px, color) la aporta `.breadcrumb` de
   design-system.css; aquí sólo se separa del título de la página. */
.breadcrumb {
  margin-top: 6px;
}

.breadcrumb a:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px rgba(var(--primary-rgb), 1);
}

.card-head {
  align-items: center;
}

.card-title {
  margin: 0;
  line-height: 19.8px;
}

.card-subtitle {
  margin-top: 4px;
}

/* Literal DS .card-header anatomy for the warehouse listing cards; reuses
   styles/design-system.css .card-header rules and overrides the local
   .card-title/.card-subtitle scoped values that would otherwise win. */
.armories-card .card-header .card-title,
.weapons-card .card-header .card-title,
.calibres-card .card-header .card-title {
  margin-bottom: 12px;
  line-height: 19.8px;
}

.armories-card .card-header .card-title:last-child,
.weapons-card .card-header .card-title:last-child,
.calibres-card .card-header .card-title:last-child {
  margin-bottom: 0;
}

.armories-card .card-header .card-subtitle,
.weapons-card .card-header .card-subtitle,
.calibres-card .card-header .card-subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 21px;
  color: var(--bui-text);
}

/* Segunda línea descriptiva del encabezado (explicación del gating de calibres). */
.calibres-card .card-header .card-subtitle + .card-subtitle {
  margin-top: 6px;
}

/* ui-card.html anatomy for the weapon detail body: h2.card-title + p.card-text.text-muted
   as direct children of .card-body (no .card-header on this surface). */
.weapon-detail-card .card-body .card-title {
  margin-bottom: 12px;
  line-height: 19.8px;
}

.weapon-detail-card .card-body .card-text {
  margin-bottom: 10px;
  color: var(--bui-muted);
}

.armory-view .card-body.no-pad {
  padding: 0;
}

/* La tabla usa `.table` + `.table-centered` del DS (design-system.css); aquí
   sólo lo no cubierto: cabeceras sin salto de línea y ancho acotado para la
   columna Descripción, que si no estira la fila. */
.table > thead th {
  white-space: nowrap;
}

.desc-cell {
  max-width: 320px;
  overflow-wrap: anywhere;
}

.list-count {
  margin: 0;
  padding: 0 24px 16px;
  color: var(--muted);
}

/* Wait indicator with DS spinner anatomy (baseui.css:649-671) and reserved
   height so navigating between surfaces does not shift the layout. */
.surface-loading {
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: 10px;
  padding: 24px;
  color: var(--muted);
}

.loading-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  vertical-align: -.125em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  color: var(--primary);
  animation: .75s linear infinite armory-spinner;
}

@keyframes armory-spinner {
  to { transform: rotate(360deg); }
}

.sort-button,
.text-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--primary-text);
  cursor: pointer;
  font: inherit;
  text-align: left;
  text-decoration: none;
}

.sort-button {
  color: var(--heading);
  font-weight: 500;
  white-space: nowrap;
}

.sort-button:hover,
.text-link:hover {
  text-decoration: underline;
}

.sort-button:focus-visible,
.text-link:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 3px;
}

.text-link:disabled,
.sort-button:disabled {
  cursor: not-allowed;
}

.btn-outline-primary,
.btn-outline-danger,
.btn-secondary,
.btn-danger {
  border: 1px solid transparent;
}

.btn-outline-primary {
  border-color: rgba(var(--primary-rgb), 1);
  background-color: transparent;
  color: var(--primary-text);
}

.btn-outline-primary:hover:not(:disabled) {
  border-color: rgba(var(--primary-rgb), 1);
  background-color: rgba(var(--primary-rgb), 1);
  color: var(--primary-ink);
}

.btn-outline-danger {
  border-color: currentColor;
  background-color: transparent;
  color: var(--danger-text);
}

.btn-outline-danger:hover:not(:disabled) {
  border-color: rgba(var(--danger-rgb), 1);
  background-color: rgba(var(--danger-rgb), 1);
  color: var(--on-danger);
}

.btn-secondary {
  border-color: var(--border-2);
  background-color: var(--surface-2);
  color: var(--heading);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--border-2);
  background-color: var(--hover);
}

.btn-danger {
  border-color: rgba(var(--danger-rgb), 1);
  background-color: rgba(var(--danger-rgb), 1);
  color: var(--on-danger);
}

.btn-danger:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--danger) 84%, #000);
  background-color: color-mix(in srgb, var(--danger) 84%, #000);
  color: #fff;
}

.surface-state,
.empty-cell {
  padding: 24px;
  color: var(--muted);
}

.empty-cell {
  text-align: center;
}

.filter-note {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 24px 20px;
  color: var(--muted);
}

.muted-copy,
.field-hint {
  display: block;
  color: var(--muted);
  font-size: 12px;
}

.field-hint {
  margin-top: 6px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  margin: 0;
}

.detail-grid > div {
  min-width: 0;
}

.detail-grid dt {
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}

.detail-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--text);
}

.related-section {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.related-title {
  margin: 0 0 12px;
  color: var(--heading);
  font-size: 16px;
  font-weight: 600;
}

.related-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 20px;
}

.editor-form {
  width: 100%;
}

.invalid-feedback {
  display: block;
  min-height: 0;
  color: var(--danger-text);
}

.invalid-feedback:empty {
  display: none;
}

.read-only-context {
  display: grid;
  gap: 6px;
  margin-bottom: 20px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  background: var(--surface-2);
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.read-only-context strong {
  color: var(--heading);
}

.delete-summary p {
  margin: 0 0 12px;
}

.delete-summary p:last-child {
  margin-bottom: 0;
}

.alert-success {
  background-color: rgba(var(--success-rgb), .15);
  color: var(--success-text);
}

.alert-error {
  background-color: rgba(var(--danger-rgb), .15);
  color: var(--danger-text);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 720px) {
  .page-head,
  .card-head {
    align-items: stretch;
  }

  .page-actions {
    justify-content: flex-start;
  }

  .search-field {
    width: 100%;
  }

  .filter-field {
    width: 100%;
  }

  .detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .state-message {
    align-items: flex-start;
    flex-direction: column;
  }

  /* En móvil, ninguna ayuda, error, etiqueta o badge baja de 14 px (rules/ui-ux.md §6). */
  .field-hint,
  .muted-copy,
  .invalid-feedback,
  .detail-grid dt,
  .read-only-context {
    font-size: 14px;
  }
}

/* DS block editor fields for the THREE Armory editors (forms-basic field flow). */
.armory-editor-fields {
  display: block;
}

.armory-editor-field {
  min-width: 0;
}
</style>
