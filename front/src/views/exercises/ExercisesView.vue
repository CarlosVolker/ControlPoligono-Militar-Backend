<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import DsModal from '../../components/shared/DsModal.vue'
import { HttpRequestError } from '../../api/http'
import { useSessionStore } from '../../stores/session'
import { SESSION_STATUS } from '../../types/session'
import { PERMISSION_CODE } from '../../permissions/catalog'
import type { ApiConnection } from '../../types/dashboard'
import {
  ArmoryApiResponseError,
  getActiveCalibres,
  getWeapons,
  TIPO_ARMA_CHOICES,
  type CalibreDTO,
  type WeaponDTO,
} from '../../features/armory/api'
import {
  getAssignableOrganizationUnits,
  type OrganizationUnitRecord,
} from '../../features/organization/api'
import {
  ExercisesApiResponseError,
  TIPO_EJERCICIO_CHOICES,
  createExercise,
  createMunitionConsumption,
  createWeaponConsumption,
  deleteExercise,
  deleteMunitionConsumption,
  deleteWeaponConsumption,
  getExercise,
  getExercises,
  getMunitionConsumption,
  getMunitionConsumptions,
  getWeaponConsumption,
  getWeaponConsumptions,
  patchExercise,
  patchMunitionConsumption,
  patchWeaponConsumption,
  replaceExercise,
  replaceMunitionConsumption,
  replaceWeaponConsumption,
  type CreateExerciseBody,
  type CreateMunitionConsumptionBody,
  type CreateWeaponConsumptionBody,
  type ExerciseDTO,
  type ExerciseTypeCode,
  type MunitionConsumptionDTO,
  type PatchExerciseBody,
  type PatchMunitionConsumptionBody,
  type PatchWeaponConsumptionBody,
  type ReplaceExerciseBody,
  type ReplaceMunitionConsumptionBody,
  type ReplaceWeaponConsumptionBody,
  type WeaponConsumptionDTO,
} from '../../features/exercises/api'

const SCREEN = {
  EXERCISES: 'exercises',
  EXERCISE_DETAIL: 'exercise-detail',
  MUNITION: 'munition',
  WEAPON: 'weapon',
  UNKNOWN: 'unknown',
} as const

type Screen = (typeof SCREEN)[keyof typeof SCREEN]

const LOAD = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  EMPTY: 'empty',
  DENIED: 'denied',
  ERROR: 'error',
} as const

type LoadState = (typeof LOAD)[keyof typeof LOAD]

const MESSAGE = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
} as const

type MessageKind = (typeof MESSAGE)[keyof typeof MESSAGE]

const MODAL = {
  EXERCISE_FORM: 'exercise-form',
  MUNITION_FORM: 'munition-form',
  WEAPON_FORM: 'weapon-form',
  EXERCISE_DELETE: 'exercise-delete',
  MUNITION_DELETE: 'munition-delete',
  WEAPON_DELETE: 'weapon-delete',
  MUNITION_DETAIL: 'munition-detail',
  WEAPON_DETAIL: 'weapon-detail',
} as const

type ModalKind = (typeof MODAL)[keyof typeof MODAL] | null
type EditorMethod = 'create' | 'put' | 'patch'
type EntityKind = 'exercise' | 'munition' | 'weapon'

// Claves locales conservadas 1:1 (AC-7); los códigos provienen del catálogo
// compartido (única fuente, plan frontend-permission-navigation F5).
const PERMISSION = {
  READ: PERMISSION_CODE.VIEW_EXERCISES,
  CREATE: PERMISSION_CODE.CREATE_EXERCISES,
  UPDATE: PERMISSION_CODE.UPDATE_EXERCISES,
  DELETE: PERMISSION_CODE.DELETE_EXERCISES,
} as const

interface UiMessage {
  kind: MessageKind
  text: string
}

interface RequestTicket {
  key: string
  routeKey: string
  routePath: string
  sessionKey: string
  resourceKey: string
  operation: string
  principalId: number
  generation: number
  tenantCode: string
  unitCode: string
  attempt: number
  modalToken: number | null
  mutation: boolean
  controller: AbortController
}

interface UncertainMutation {
  routeKey: string
  routePath: string
  sessionKey: string
  operation: string
}

type OperationResult<T> =
  | { kind: 'success'; value: T }
  | { kind: 'failure'; status: number | null }
  | { kind: 'stale' }
  | { kind: 'blocked' }

interface ExerciseDraft {
  nombre: string
  fecha: string
  zona: string
  tipo_ejercicio: string
  numero_orden: string
  fecha_orden: string
  observaciones: string
  unidades_participantes_codes: string[]
}

interface MunitionDraft {
  ejercicio: string
  tipo_arma: string
  modelo_arma: string
  calibre_code: string
  cantidad_armas: string
  cantidad_tiros: string
  es_aproximado: boolean
  observaciones: string
}

interface WeaponDraft {
  consumo: string
  arma: string
  cantidad_tiros: string
  observaciones: string
}

const uncertainMutationMemory = new WeakMap<object, Map<string, UncertainMutation>>()

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

function safeId(value: unknown): number | null {
  const candidate = Array.isArray(value) ? value[0] : value
  if (typeof candidate !== 'string' || !/^\d+$/.test(candidate)) return null
  const parsed = Number(candidate)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

const screen = computed<Screen>(() => {
  const path = route.path.replace(/\/+$/, '') || '/'
  if (path === '/tiro/ejercicios') return SCREEN.EXERCISES
  if (path.startsWith('/tiro/ejercicios/')) return SCREEN.EXERCISE_DETAIL
  if (path === '/tiro/consumos-municion') return SCREEN.MUNITION
  if (path === '/tiro/consumos-arma') return SCREEN.WEAPON
  return SCREEN.UNKNOWN
})

const exerciseId = computed(() => safeId(route.params.idEjercicio))
const routeKey = computed(() => `${screen.value}:${route.path}:${exerciseId.value ?? ''}`)
const permissions = computed(() => session.context?.permissions ?? [])
const hasPermission = (code: string): boolean => permissions.value.includes(code)
const canRead = computed(() => hasPermission(PERMISSION.READ))
const canCreate = computed(() => hasPermission(PERMISSION.CREATE))
const canUpdate = computed(() => hasPermission(PERMISSION.UPDATE))
const canDelete = computed(() => hasPermission(PERMISSION.DELETE))

// F2 denegación accesible (plan frontend-ux-corrections): motivo visible en
// lenguaje de usuario junto al control, referenciado con aria-describedby.
// La lógica de gating no cambia: mismos computeds canCreate/canUpdate/
// canDelete en las mismas condiciones de :disabled.
const DENIAL_NOTICE: Readonly<Record<string, string>> = {
  [PERMISSION.CREATE]: 'Se requiere permiso para crear ejercicios y consumos',
  [PERMISSION.UPDATE]: 'Se requiere permiso para actualizar ejercicios y consumos',
  [PERMISSION.DELETE]: 'Se requiere permiso para eliminar ejercicios y consumos',
}

function denialNotice(code: string): string {
  const base = DENIAL_NOTICE[code] ?? 'La sesión actual no acredita el permiso requerido'
  return `${base}. El backend conserva la autoridad final.`
}

const sessionEligible = computed(() => {
  const identity = session.identity
  const context = session.context
  const tenantCode = session.tenantCode.trim()
  const unitCode = session.unitCode.trim()

  return session.status === SESSION_STATUS.READY
    && !session.logoutBusy
    && !session.busy.login
    && !session.busy.context
    && !session.busy.selectUnit
    && !session.uncertainMutation
    && identity !== null
    && context !== null
    && !identity.must_change_password
    && !context.user.must_change_password
    && tenantCode.length > 0
    && unitCode.length > 0
    && context.user.id_usuario === identity.id_usuario
    && context.tenant.code === tenantCode
    && (context.active_organization_unit === unitCode
      || context.unit_membership?.unit_code === unitCode)
})

const sessionFingerprint = computed(() => [
  session.status,
  session.generation,
  session.identity?.id_usuario ?? '',
  session.tenantCode.trim(),
  session.unitCode.trim(),
  session.context?.tenant.code ?? '',
  session.context?.active_organization_unit ?? '',
  session.context?.unit_membership?.unit_code ?? '',
  permissions.value.join('\u001f'),
  session.identity?.must_change_password ? 'password-required' : '',
  session.uncertainMutation?.generation ?? '',
].join('|'))

function uncertaintyMap(): Map<string, UncertainMutation> {
  let map = uncertainMutationMemory.get(session)
  if (!map) {
    map = new Map<string, UncertainMutation>()
    uncertainMutationMemory.set(session, map)
  }
  return map
}

const uncertainMutation = shallowRef<UncertainMutation | null>(
  uncertaintyMap().get(sessionFingerprint.value) ?? null,
)

const exerciseRows = shallowRef<readonly ExerciseDTO[]>([])
const exerciseListState = ref<LoadState>(LOAD.IDLE)
const exerciseListMessage = shallowRef<UiMessage | null>(null)
const exerciseRecord = shallowRef<ExerciseDTO | null>(null)
const exerciseDetailState = ref<LoadState>(LOAD.IDLE)
const exerciseDetailMessage = shallowRef<UiMessage | null>(null)

const munitionRows = shallowRef<readonly MunitionConsumptionDTO[]>([])
const munitionListState = ref<LoadState>(LOAD.IDLE)
const munitionListMessage = shallowRef<UiMessage | null>(null)
const weaponRows = shallowRef<readonly WeaponConsumptionDTO[]>([])
const weaponListState = ref<LoadState>(LOAD.IDLE)
const weaponListMessage = shallowRef<UiMessage | null>(null)

const unitOptions = shallowRef<readonly OrganizationUnitRecord[]>([])
const unitOptionsState = ref<LoadState>(LOAD.IDLE)
const unitOptionsMessage = shallowRef<UiMessage | null>(null)
const catalogExercises = shallowRef<readonly ExerciseDTO[]>([])
const catalogExercisesState = ref<LoadState>(LOAD.IDLE)
const catalogExercisesMessage = shallowRef<UiMessage | null>(null)
const catalogCalibres = shallowRef<readonly CalibreDTO[]>([])
const catalogCalibresState = ref<LoadState>(LOAD.IDLE)
const catalogCalibresMessage = shallowRef<UiMessage | null>(null)
const catalogWeapons = shallowRef<readonly WeaponDTO[]>([])
const catalogWeaponsState = ref<LoadState>(LOAD.IDLE)
const catalogWeaponsMessage = shallowRef<UiMessage | null>(null)
const catalogMunitions = shallowRef<readonly MunitionConsumptionDTO[]>([])
const catalogMunitionsState = ref<LoadState>(LOAD.IDLE)
const catalogMunitionsMessage = shallowRef<UiMessage | null>(null)

const exerciseSearch = ref('')
const exerciseSort = ref<'nombre' | 'fecha' | 'id_ejercicio'>('fecha')
const exerciseSortDesc = ref(false)
const munitionSearch = ref('')
const munitionSort = ref<'id_consumo' | 'ejercicio' | 'cantidad_tiros'>('id_consumo')
const munitionSortDesc = ref(false)
const weaponSearch = ref('')
const weaponSort = ref<'id_consumo_arma' | 'consumo' | 'arma'>('id_consumo_arma')
const weaponSortDesc = ref(false)
const weaponParentFilter = ref<number | null>(null)
const handledMunitionNavigation = ref<string | null>(null)

const exerciseDraft = reactive<ExerciseDraft>(newExerciseDraft())
const munitionDraft = reactive<MunitionDraft>(newMunitionDraft())
const weaponDraft = reactive<WeaponDraft>(newWeaponDraft())
const originalExercise = shallowRef<ExerciseDTO | null>(null)
const originalMunition = shallowRef<MunitionConsumptionDTO | null>(null)
const originalWeapon = shallowRef<WeaponConsumptionDTO | null>(null)
const deleteExerciseTarget = shallowRef<ExerciseDTO | null>(null)
const deleteMunitionTarget = shallowRef<MunitionConsumptionDTO | null>(null)
const deleteWeaponTarget = shallowRef<WeaponConsumptionDTO | null>(null)
const detailMunition = shallowRef<MunitionConsumptionDTO | null>(null)
const detailWeapon = shallowRef<WeaponConsumptionDTO | null>(null)

const modalKind = ref<ModalKind>(null)
const modalOpen = ref(false)
const modalToken = ref(0)
const modalMessage = shallowRef<UiMessage | null>(null)
const modalFieldErrors = shallowRef<Readonly<Record<string, string>>>({})
const operationNotice = shallowRef<UiMessage | null>(null)
const activeRequests = new Map<string, RequestTicket>()
const requestAttempts = new Map<string, number>()
const pendingTickets = shallowRef<readonly RequestTicket[]>([])
let mounted = true

function newExerciseDraft(): ExerciseDraft {
  return {
    nombre: '', fecha: '', zona: '', tipo_ejercicio: '', numero_orden: '',
    fecha_orden: '', observaciones: '', unidades_participantes_codes: [],
  }
}

function newMunitionDraft(): MunitionDraft {
  return {
    ejercicio: '', tipo_arma: '', modelo_arma: '', calibre_code: '',
    cantidad_armas: '', cantidad_tiros: '', es_aproximado: false, observaciones: '',
  }
}

function newWeaponDraft(): WeaponDraft {
  return { consumo: '', arma: '', cantidad_tiros: '', observaciones: '' }
}

function syncPendingTickets(): void {
  pendingTickets.value = Array.from(activeRequests.values())
}

const modalBusy = computed(() => pendingTickets.value.some((ticket) => (
  ticket.modalToken === modalToken.value && ticket.mutation
)))
const modalLoading = computed(() => pendingTickets.value.some((ticket) => (
  ticket.modalToken === modalToken.value && !ticket.mutation
)))
const pageBusy = computed(() => pendingTickets.value.some((ticket) => ticket.modalToken === null))
const isMutationUncertain = computed(() => uncertainMutation.value !== null)
const canReconcileHere = computed(() => (
  uncertainMutation.value !== null
  && uncertainMutation.value.sessionKey === sessionFingerprint.value
  && uncertainMutation.value.routeKey === routeKey.value
  && sessionEligible.value
))
const unitByCode = computed(() => new Map<string, OrganizationUnitRecord>(
  unitOptions.value.map((unit): [string, OrganizationUnitRecord] => [unit.code, unit]),
))
const unitById = computed(() => new Map<number, OrganizationUnitRecord>(
  unitOptions.value.map((unit): [number, OrganizationUnitRecord] => [unit.id, unit]),
))
const activeCalibreOptions = computed(() => catalogCalibres.value.filter((calibre) => calibre.is_active))
const activeExerciseOptions = computed(() => catalogExercises.value)
const activeWeaponOptions = computed(() => catalogWeapons.value)
const activeMunitionOptions = computed(() => catalogMunitions.value)

const exerciseMunitionRows = computed(() => (
  exerciseRecord.value
    ? munitionRows.value.filter((item) => item.ejercicio === exerciseRecord.value?.id_ejercicio)
    : []
))

const exerciseWeaponRows = computed(() => {
  const relatedMunitionIds = new Set(exerciseMunitionRows.value.map((item) => item.id_consumo))
  return weaponRows.value.filter((item) => relatedMunitionIds.has(item.consumo))
})

const visibleExercises = computed(() => {
  const query = exerciseSearch.value.trim().toLocaleLowerCase()
  const direction = exerciseSortDesc.value ? -1 : 1
  return [...exerciseRows.value]
    .filter((item) => [
      String(item.id_ejercicio), item.nombre, item.fecha, item.zona,
      item.tipo_ejercicio, item.observaciones,
      ...item.unidades_participantes_codes,
    ].some((value) => value.toLocaleLowerCase().includes(query)))
    .sort((left, right) => {
      const first = left[exerciseSort.value]
      const second = right[exerciseSort.value]
      const comparison = typeof first === 'number' && typeof second === 'number'
        ? first - second
        : String(first).localeCompare(String(second), undefined, { sensitivity: 'base' })
      return comparison * direction
    })
})

const visibleMunitions = computed(() => {
  const query = munitionSearch.value.trim().toLocaleLowerCase()
  const direction = munitionSortDesc.value ? -1 : 1
  return [...munitionRows.value]
    .filter((item) => [
      String(item.id_consumo), String(item.ejercicio), item.tipo_arma,
      item.modelo_arma, item.calibre_code, String(item.cantidad_armas ?? ''),
      String(item.cantidad_tiros), item.observaciones,
    ].some((value) => value.toLocaleLowerCase().includes(query)))
    .sort((left, right) => (left[munitionSort.value] - right[munitionSort.value]) * direction)
})

const visibleWeapons = computed(() => {
  const query = weaponSearch.value.trim().toLocaleLowerCase()
  const direction = weaponSortDesc.value ? -1 : 1
  return [...weaponRows.value]
    .filter((item) => weaponParentFilter.value === null || item.consumo === weaponParentFilter.value)
    .filter((item) => [
      String(item.id_consumo_arma), String(item.consumo), String(item.arma),
      String(item.cantidad_tiros), item.observaciones,
    ].some((value) => value.toLocaleLowerCase().includes(query)))
    .sort((left, right) => (left[weaponSort.value] - right[weaponSort.value]) * direction)
})

// Conteo honesto: sin paginación real en el backend (TODO en
// docs/bugs/backend-todos-barrido-ux.md §1), se informa cuántos registros de
// los cargados quedan visibles tras el filtro local.
function countLabel(visible: number, total: number, noun: string): string {
  return `${visible} de ${total} ${noun} cargados`
}

const exerciseCountLabel = computed(() => countLabel(visibleExercises.value.length, exerciseRows.value.length, 'ejercicios'))
const munitionCountLabel = computed(() => countLabel(visibleMunitions.value.length, munitionRows.value.length, 'consumos'))
const weaponCountLabel = computed(() => countLabel(visibleWeapons.value.length, weaponRows.value.length, 'relaciones'))

const modalTitle = computed(() => {
  switch (modalKind.value) {
    case MODAL.EXERCISE_FORM: return originalExercise.value ? 'Editar ejercicio' : 'Crear ejercicio'
    case MODAL.MUNITION_FORM: return originalMunition.value ? 'Editar consumo de munición' : 'Crear consumo de munición'
    case MODAL.WEAPON_FORM: return originalWeapon.value ? 'Editar consumo por arma' : 'Crear consumo por arma'
    case MODAL.EXERCISE_DELETE: return 'Eliminar ejercicio'
    case MODAL.MUNITION_DELETE: return 'Eliminar consumo de munición'
    case MODAL.WEAPON_DELETE: return 'Eliminar consumo por arma'
    case MODAL.MUNITION_DETAIL: return 'Detalle del consumo de munición'
    case MODAL.WEAPON_DETAIL: return 'Detalle del consumo por arma'
    default: return ''
  }
})

const exerciseFormValid = computed(() => (
  exerciseDraft.nombre.trim().length > 0
  && isCalendarDate(exerciseDraft.fecha)
  && (exerciseDraft.tipo_ejercicio === ''
    || TIPO_EJERCICIO_CHOICES.some(([code]) => code === exerciseDraft.tipo_ejercicio))
))

const munitionFormValid = computed(() => {
  const exerciseId = positiveInteger(munitionDraft.ejercicio)
  return exerciseId !== null
    && TIPO_ARMA_CHOICES.some(([code]) => code === munitionDraft.tipo_arma)
    && nonNegativeInteger(munitionDraft.cantidad_tiros) !== null
    && (isBlankNumber(munitionDraft.cantidad_armas)
      || nonNegativeInteger(munitionDraft.cantidad_armas) !== null)
    && (munitionDraft.calibre_code === ''
      || activeCalibreOptions.value.some((calibre) => calibre.code === munitionDraft.calibre_code)
      || munitionDraft.calibre_code === originalMunition.value?.calibre_code)
    && availableExerciseId(exerciseId)
})

const weaponFormValid = computed(() => {
  const consumptionId = positiveInteger(weaponDraft.consumo)
  const weaponId = positiveInteger(weaponDraft.arma)
  return consumptionId !== null
    && weaponId !== null
    && nonNegativeInteger(weaponDraft.cantidad_tiros) !== null
    && availableMunitionId(consumptionId)
    && availableWeaponId(weaponId)
})

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

function parseSafeInteger(value: unknown, min: number): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= min ? value : null
  }
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text || !/^\d+$/.test(text)) return null
  const result = Number(text)
  return Number.isSafeInteger(result) && result >= min ? result : null
}

function positiveInteger(value: unknown): number | null {
  return parseSafeInteger(value, 1)
}

function nonNegativeInteger(value: unknown): number | null {
  return parseSafeInteger(value, 0)
}

function isBlankNumber(value: unknown): boolean {
  return value === null
    || value === undefined
    || (typeof value === 'string' && value.trim() === '')
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function errorStatus(error: unknown): number | null {
  return error instanceof ExercisesApiResponseError
    || error instanceof ArmoryApiResponseError
    || error instanceof HttpRequestError
    ? error.status
    : null
}

function errorPayload(error: unknown): unknown {
  return error instanceof ExercisesApiResponseError
    || error instanceof ArmoryApiResponseError
    || error instanceof HttpRequestError
    ? error.payload
    : undefined
}

function errorDetail(error: unknown): string | null {
  return error instanceof ExercisesApiResponseError
    || error instanceof ArmoryApiResponseError
    || error instanceof HttpRequestError
    ? error.detail
    : null
}

function payloadMessages(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value] : []
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

// Etiquetas visibles para el resumen de errores: el backend devuelve claves
// técnicas (p. ej. `unidades_participantes_codes_write`); la persona ve el
// nombre del campo del formulario, no la clave del contrato.
const FIELD_LABELS: Readonly<Record<string, string>> = {
  nombre: 'Nombre',
  fecha: 'Fecha',
  zona: 'Zona',
  tipo_ejercicio: 'Tipo de ejercicio',
  numero_orden: 'Número de orden',
  fecha_orden: 'Fecha de orden',
  observaciones: 'Observaciones',
  unidades_participantes_codes_write: 'Unidades participantes',
  unidades_participantes_codes: 'Unidades participantes',
  ejercicio: 'Ejercicio',
  tipo_arma: 'Tipo de arma',
  modelo_arma: 'Modelo de arma',
  calibre_code_write: 'Calibre',
  calibre_code: 'Calibre',
  cantidad_armas: 'Cantidad de armas',
  cantidad_tiros: 'Cantidad de tiros',
  es_aproximado: 'Cantidad aproximada',
  consumo: 'Consumo de munición',
  arma: 'Arma',
  non_field_errors: 'General',
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ')
}

function payloadErrorText(payload: unknown): string | null {
  if (!isRecord(payload)) return null
  const detail = payloadMessages(payload.detail)
  if (detail.length) return detail.join(' ')
  const messages = Object.entries(payload).flatMap(([field, value]) => {
    if (field === 'detail') return []
    const entries = payloadMessages(value)
    return entries.length ? [`${fieldLabel(field)}: ${entries.join(' ')}`] : []
  })
  return messages.length ? messages.join(' ') : null
}

function errorMessage(error: unknown): string {
  const detail = errorDetail(error) ?? payloadErrorText(errorPayload(error))
  if (detail) return detail
  const status = errorStatus(error)
  if (status === 403) return 'El servidor denegó esta operación.'
  if (status === 404) return 'El recurso solicitado ya no está disponible.'
  if (status !== null && status >= 400 && status < 500) {
    return `El servidor rechazó la solicitud (${status}).`
  }
  if (error instanceof ExercisesApiResponseError || error instanceof ArmoryApiResponseError) {
    return 'La respuesta del servidor no cumple el contrato de ejercicios, consumos o armería.'
  }
  return 'No fue posible completar la solicitud. Comprueba la conexión e inténtalo de nuevo.'
}

function messageForError(error: unknown): UiMessage {
  return {
    kind: errorStatus(error) === 403 ? MESSAGE.WARNING : MESSAGE.ERROR,
    text: errorMessage(error),
  }
}

function isUncertainMutationError(error: unknown): boolean {
  if (error instanceof HttpRequestError && error.operationKind === 'configuration') return false
  const status = errorStatus(error)
  return status === null || status < 400 || status >= 500
}

type ApiResource = EntityKind | 'units' | 'catalog' | 'weapon-catalog'

function connectionFor(ticket: RequestTicket, resource: ApiResource): ApiConnection {
  return {
    tenantCode: ticket.tenantCode,
    unitCode: resource === 'exercise' || resource === 'units' || resource === 'weapon-catalog'
      ? ticket.unitCode
      : '',
    signal: ticket.controller.signal,
  }
}

function beginTicket(
  operation: string,
  resourceKey: string,
  modalScoped: boolean,
  mutation = false,
): RequestTicket | null {
  if (!sessionEligible.value || !session.identity || screen.value === SCREEN.UNKNOWN) return null
  const key = [operation, routeKey.value, resourceKey, modalScoped ? modalToken.value : 'page'].join('|')
  const existing = activeRequests.get(key)
  if (existing) {
    if (existing.mutation) {
      markUncertain(existing)
      activeRequests.delete(key)
      existing.controller.abort()
      syncPendingTickets()
      return null
    }
    activeRequests.delete(key)
    existing.controller.abort()
  }

  const attempt = (requestAttempts.get(key) ?? 0) + 1
  requestAttempts.set(key, attempt)
  const ticket: RequestTicket = {
    key,
    routeKey: routeKey.value,
    routePath: route.path,
    sessionKey: sessionFingerprint.value,
    resourceKey,
    operation,
    principalId: session.identity.id_usuario,
    generation: session.generation,
    tenantCode: session.tenantCode.trim(),
    unitCode: session.unitCode.trim(),
    attempt,
    modalToken: modalScoped ? modalToken.value : null,
    mutation,
    controller: new AbortController(),
  }
  activeRequests.set(key, ticket)
  syncPendingTickets()
  return ticket
}

function ticketIsCurrent(ticket: RequestTicket): boolean {
  return mounted
    && activeRequests.get(ticket.key) === ticket
    && !ticket.controller.signal.aborted
    && sessionEligible.value
    && sessionFingerprint.value === ticket.sessionKey
    && routeKey.value === ticket.routeKey
    && session.identity?.id_usuario === ticket.principalId
    && session.generation === ticket.generation
    && (ticket.modalToken === null
      || (modalOpen.value && modalToken.value === ticket.modalToken))
}

function markUncertain(ticket: RequestTicket): void {
  const record: UncertainMutation = {
    routeKey: ticket.routeKey,
    routePath: ticket.routePath,
    sessionKey: ticket.sessionKey,
    operation: ticket.operation,
  }
  uncertaintyMap().set(ticket.sessionKey, record)
  if (ticket.sessionKey === sessionFingerprint.value) uncertainMutation.value = record
}

function abortAllRequests(): void {
  const pending = Array.from(activeRequests.values())
  activeRequests.clear()
  syncPendingTickets()
  for (const ticket of pending) {
    if (ticket.mutation) markUncertain(ticket)
    ticket.controller.abort()
  }
}

function abortModalRequests(token = modalToken.value): void {
  const pending = Array.from(activeRequests.values())
    .filter((ticket) => ticket.modalToken === token)
  for (const ticket of pending) {
    activeRequests.delete(ticket.key)
    if (ticket.mutation) markUncertain(ticket)
    ticket.controller.abort()
  }
  syncPendingTickets()
}

async function perform<T>(
  operation: string,
  resourceKey: string,
  requestForTicket: (connection: ApiConnection) => Promise<T>,
  options: {
    modalScoped?: boolean
    mutation?: boolean
    resource: ApiResource
    onSuccess: (value: T, ticket: RequestTicket) => void
    onFailure: (error: unknown, ticket: RequestTicket) => void
  },
): Promise<OperationResult<T>> {
  if (options.mutation && uncertainMutation.value) return { kind: 'blocked' }
  const ticket = beginTicket(operation, resourceKey, options.modalScoped ?? false, options.mutation ?? false)
  if (!ticket) return { kind: 'stale' }

  try {
    const value = await requestForTicket(connectionFor(ticket, options.resource))
    if (!ticketIsCurrent(ticket)) return { kind: 'stale' }
    activeRequests.delete(ticket.key)
    syncPendingTickets()
    options.onSuccess(value, ticket)
    return { kind: 'success', value }
  } catch (error: unknown) {
    if (!ticketIsCurrent(ticket)) return { kind: 'stale' }
    options.onFailure(error, ticket)
    if (options.mutation && isUncertainMutationError(error)) markUncertain(ticket)
    return { kind: 'failure', status: errorStatus(error) }
  } finally {
    if (activeRequests.get(ticket.key) === ticket) {
      activeRequests.delete(ticket.key)
      syncPendingTickets()
    }
  }
}

function resetExerciseDraft(): void {
  Object.assign(exerciseDraft, newExerciseDraft())
  originalExercise.value = null
}

function resetMunitionDraft(): void {
  Object.assign(munitionDraft, newMunitionDraft())
  originalMunition.value = null
}

function resetWeaponDraft(): void {
  Object.assign(weaponDraft, newWeaponDraft())
  originalWeapon.value = null
}

function resetModalState(): void {
  abortModalRequests()
  modalKind.value = null
  modalMessage.value = null
  modalFieldErrors.value = {}
  detailMunition.value = null
  detailWeapon.value = null
  deleteExerciseTarget.value = null
  deleteMunitionTarget.value = null
  deleteWeaponTarget.value = null
  resetExerciseDraft()
  resetMunitionDraft()
  resetWeaponDraft()
  unitOptionsState.value = unitOptions.value.length ? LOAD.READY : LOAD.IDLE
  unitOptionsMessage.value = null
  catalogExercises.value = []
  catalogExercisesState.value = LOAD.IDLE
  catalogExercisesMessage.value = null
  catalogCalibres.value = []
  catalogCalibresState.value = LOAD.IDLE
  catalogCalibresMessage.value = null
  catalogWeapons.value = []
  catalogWeaponsState.value = LOAD.IDLE
  catalogWeaponsMessage.value = null
  catalogMunitions.value = []
  catalogMunitionsState.value = LOAD.IDLE
  catalogMunitionsMessage.value = null
}

function beginModal(kind: Exclude<ModalKind, null>): void {
  resetModalState()
  modalToken.value += 1
  modalKind.value = kind
  modalOpen.value = true
  modalMessage.value = null
  modalFieldErrors.value = {}
  operationNotice.value = null
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

function clearPrivateViewState(): void {
  exerciseRows.value = []
  exerciseListState.value = LOAD.IDLE
  exerciseListMessage.value = null
  exerciseRecord.value = null
  exerciseDetailState.value = LOAD.IDLE
  exerciseDetailMessage.value = null
  munitionRows.value = []
  munitionListState.value = LOAD.IDLE
  munitionListMessage.value = null
  weaponRows.value = []
  weaponListState.value = LOAD.IDLE
  weaponListMessage.value = null
  unitOptions.value = []
  unitOptionsState.value = LOAD.IDLE
  unitOptionsMessage.value = null
  exerciseSearch.value = ''
  munitionSearch.value = ''
  weaponSearch.value = ''
  operationNotice.value = null
  weaponParentFilter.value = null
  handledMunitionNavigation.value = null
  modalOpen.value = false
  resetModalState()
  modalToken.value += 1
}

function assignableUnitOptions(): void {
  unitOptionsState.value = LOAD.LOADING
  unitOptionsMessage.value = null
  void perform(
    'get-assignable-units',
    'assignable-units',
    getAssignableOrganizationUnits,
    {
      modalScoped: modalKind.value === MODAL.EXERCISE_FORM,
      resource: 'units',
      onSuccess: (response) => {
        unitOptions.value = response.results
        unitOptionsState.value = response.results.length ? LOAD.READY : LOAD.EMPTY
      },
      onFailure: (error) => {
        unitOptionsState.value = errorStatus(error) === 403 ? LOAD.DENIED : LOAD.ERROR
        unitOptionsMessage.value = messageForError(error)
      },
    },
  )
}

function loadExerciseList(): Promise<OperationResult<readonly ExerciseDTO[]>> {
  if (!canRead.value) {
    exerciseListState.value = LOAD.DENIED
    exerciseListMessage.value = { kind: MESSAGE.WARNING, text: 'Tu sesión no acredita permiso para consultar ejercicios.' }
    return Promise.resolve({ kind: 'blocked' })
  }
  exerciseListState.value = LOAD.LOADING
  exerciseListMessage.value = null
  return perform('get-exercises', 'exercise-list', getExercises, {
    resource: 'exercise',
    onSuccess: (records) => {
      exerciseRows.value = records
      exerciseListState.value = records.length ? LOAD.READY : LOAD.EMPTY
      exerciseListMessage.value = null
      // El catálogo de unidades da nombre a la columna «Unidad efectiva» y a las
      // unidades participantes; sin él se conservan los códigos/ids devueltos.
      if (screen.value === SCREEN.EXERCISES) assignableUnitOptions()
    },
    onFailure: (error) => {
      exerciseListState.value = errorStatus(error) === 403 ? LOAD.DENIED : LOAD.ERROR
      exerciseListMessage.value = messageForError(error)
    },
  })
}

function loadMunitionList(): Promise<OperationResult<readonly MunitionConsumptionDTO[]>> {
  if (!canRead.value) {
    munitionListState.value = LOAD.DENIED
    munitionListMessage.value = { kind: MESSAGE.WARNING, text: 'Tu sesión no acredita permiso para consultar ejercicios y consumos.' }
    return Promise.resolve({ kind: 'blocked' })
  }
  munitionListState.value = LOAD.LOADING
  munitionListMessage.value = null
  return perform('get-munition-consumptions', 'munition-list', getMunitionConsumptions, {
    resource: 'munition',
    onSuccess: (records) => {
      munitionRows.value = records
      munitionListState.value = records.length ? LOAD.READY : LOAD.EMPTY
      munitionListMessage.value = null
      const navigationId = screen.value === SCREEN.MUNITION
        ? readNavigationStateId('munitionConsumptionId')
        : null
      const navigationKey = navigationId === null ? null : `${routeKey.value}:${navigationId}`
      if (navigationId !== null && navigationKey !== handledMunitionNavigation.value) {
        handledMunitionNavigation.value = navigationKey
        openMunitionDetailById(navigationId)
      }
    },
    onFailure: (error) => {
      munitionListState.value = errorStatus(error) === 403 ? LOAD.DENIED : LOAD.ERROR
      munitionListMessage.value = messageForError(error)
    },
  })
}

function loadWeaponList(): Promise<OperationResult<readonly WeaponConsumptionDTO[]>> {
  if (!canRead.value) {
    weaponListState.value = LOAD.DENIED
    weaponListMessage.value = { kind: MESSAGE.WARNING, text: 'Tu sesión no acredita permiso para consultar ejercicios y consumos.' }
    return Promise.resolve({ kind: 'blocked' })
  }
  weaponListState.value = LOAD.LOADING
  weaponListMessage.value = null
  return perform('get-weapon-consumptions', 'weapon-list', getWeaponConsumptions, {
    resource: 'weapon',
    onSuccess: (records) => {
      weaponRows.value = records
      weaponListState.value = records.length ? LOAD.READY : LOAD.EMPTY
      weaponListMessage.value = null
    },
    onFailure: (error) => {
      weaponListState.value = errorStatus(error) === 403 ? LOAD.DENIED : LOAD.ERROR
      weaponListMessage.value = messageForError(error)
    },
  })
}

function loadExerciseDetail(): Promise<OperationResult<ExerciseDTO>> {
  const id = exerciseId.value
  if (id === null) {
    exerciseDetailState.value = LOAD.ERROR
    exerciseDetailMessage.value = { kind: MESSAGE.ERROR, text: 'El parámetro idEjercicio no es un entero positivo.' }
    return Promise.resolve({ kind: 'failure', status: null })
  }
  if (!canRead.value) {
    exerciseDetailState.value = LOAD.DENIED
    exerciseDetailMessage.value = { kind: MESSAGE.WARNING, text: 'Tu sesión no acredita permiso para consultar esta ficha.' }
    return Promise.resolve({ kind: 'blocked' })
  }

  exerciseDetailState.value = LOAD.LOADING
  exerciseDetailMessage.value = null
  const result = perform(
    'get-exercise',
    String(id),
    (connection) => getExercise(id, connection),
    {
      resource: 'exercise',
      onSuccess: (record) => {
        exerciseRecord.value = record
        exerciseDetailState.value = LOAD.READY
        exerciseDetailMessage.value = null
        assignableUnitOptions()
        void loadMunitionList()
        void loadWeaponList()
      },
      onFailure: (error) => {
        exerciseDetailState.value = errorStatus(error) === 403 ? LOAD.DENIED : LOAD.ERROR
        exerciseDetailMessage.value = messageForError(error)
        if (errorStatus(error) === 404) {
          void loadMunitionList()
          void loadWeaponList()
        }
      },
    },
  )
  return result
}

async function loadCurrentRoute(): Promise<boolean> {
  if (!sessionEligible.value) return false
  if (screen.value === SCREEN.EXERCISES) {
    return (await loadExerciseList()).kind === 'success'
  }
  if (screen.value === SCREEN.EXERCISE_DETAIL) {
    const result = await loadExerciseDetail()
    return result.kind === 'success' || (result.kind === 'failure' && result.status === 404)
  }
  if (screen.value === SCREEN.MUNITION) {
    return (await loadMunitionList()).kind === 'success'
  }
  if (screen.value === SCREEN.WEAPON) {
    return (await loadWeaponList()).kind === 'success'
  }
  return false
}

function clearUncertainMutation(expected: UncertainMutation): void {
  if (uncertainMutation.value !== expected) return
  uncertaintyMap().delete(expected.sessionKey)
  uncertainMutation.value = null
  operationNotice.value = {
    kind: MESSAGE.INFO,
    text: 'Leí el estado actual desde el servidor. La escritura anterior no se repitió.',
  }
}

async function reconcileCurrentResource(): Promise<void> {
  const pending = uncertainMutation.value
  if (!pending || pending.sessionKey !== sessionFingerprint.value || !sessionEligible.value) return
  if (pending.routeKey !== routeKey.value) {
    try {
      await router.push({ path: pending.routePath })
    } catch {
      operationNotice.value = { kind: MESSAGE.ERROR, text: 'No fue posible volver al recurso pendiente de conciliación.' }
    }
    return
  }
  const confirmed = await loadCurrentRoute()
  if (confirmed && uncertainMutation.value === pending) clearUncertainMutation(pending)
}

function modalFieldError(field: string): string | null {
  return modalFieldErrors.value[field] ?? null
}

function fieldErrorsFromPayload(payload: unknown): Readonly<Record<string, string>> {
  if (!isRecord(payload)) return {}
  const result: Record<string, string> = {}
  for (const [field, value] of Object.entries(payload)) {
    if (field === 'detail' || field === 'non_field_errors') continue
    const messages = payloadMessages(value)
    if (messages.length) result[field] = messages.join(' ')
  }
  return result
}

function reportModalFailure(error: unknown, entity: EntityKind): void {
  const status = errorStatus(error)
  const fields = { ...fieldErrorsFromPayload(errorPayload(error)) }
  const payload = errorPayload(error)
  if (entity === 'weapon' && status === 400 && isRecord(payload)) {
    const nonFieldMessages = payloadMessages(payload.non_field_errors)
    if (nonFieldMessages.length && !fields.arma) {
      fields.arma = nonFieldMessages.join(' ')
    }
  }
  modalFieldErrors.value = fields
  modalMessage.value = messageForError(error)
  void nextTick(focusFirstInvalidField)
}

// Ids de control por campo, para llevar el foco al primer inválido. Solo hay un
// formulario montado a la vez, así que los ids son únicos en el documento.
const FIELD_ELEMENT_IDS: Readonly<Record<string, readonly string[]>> = {
  nombre: ['exercise-name'],
  fecha: ['exercise-date'],
  tipo_ejercicio: ['exercise-type'],
  numero_orden: ['exercise-order-number'],
  fecha_orden: ['exercise-order-date'],
  unidades_participantes_codes_write: ['exercise-participants'],
  unidades_participantes_codes: ['exercise-participants'],
  observaciones: ['exercise-observations', 'munition-observations', 'weapon-observations'],
  ejercicio: ['munition-exercise'],
  tipo_arma: ['munition-weapon-type'],
  modelo_arma: ['munition-model'],
  calibre_code_write: ['munition-calibre'],
  cantidad_armas: ['munition-weapons-count'],
  cantidad_tiros: ['munition-shots', 'weapon-shots'],
  consumo: ['weapon-consumption'],
  arma: ['weapon-id'],
}

function focusFirstInvalidField(): void {
  for (const field of Object.keys(modalFieldErrors.value)) {
    for (const id of FIELD_ELEMENT_IDS[field] ?? []) {
      const element = document.getElementById(id)
      if (element instanceof HTMLElement) {
        element.focus()
        return
      }
    }
  }
}

function clearModalFeedback(): void {
  modalMessage.value = null
  modalFieldErrors.value = {}
}

function openExerciseCreate(): void {
  if (!canCreate.value || isMutationUncertain.value) return
  beginModal(MODAL.EXERCISE_FORM)
  assignableUnitOptions()
}

function openExerciseEdit(): void {
  const record = exerciseRecord.value
  if (!record || !canUpdate.value || isMutationUncertain.value) return
  beginModal(MODAL.EXERCISE_FORM)
  originalExercise.value = record
  exerciseDraft.nombre = record.nombre
  exerciseDraft.fecha = record.fecha
  exerciseDraft.zona = record.zona
  exerciseDraft.tipo_ejercicio = record.tipo_ejercicio
  exerciseDraft.numero_orden = record.numero_orden ?? ''
  exerciseDraft.fecha_orden = record.fecha_orden ?? ''
  exerciseDraft.observaciones = record.observaciones
  exerciseDraft.unidades_participantes_codes = [...record.unidades_participantes_codes]
  assignableUnitOptions()
}

function openExerciseDelete(): void {
  const record = exerciseRecord.value
  if (!record || !canDelete.value || isMutationUncertain.value) return
  beginModal(MODAL.EXERCISE_DELETE)
  deleteExerciseTarget.value = record
}

function readNavigationStateId(key: 'exerciseId' | 'munitionConsumptionId'): number | null {
  const state = router.options.history.state
  return safeId(state[key] === undefined ? '' : String(state[key]))
}

function openMunitionCreate(): void {
  if (!canCreate.value || isMutationUncertain.value) return
  beginModal(MODAL.MUNITION_FORM)
  const parentId = readNavigationStateId('exerciseId')
  if (parentId !== null) munitionDraft.ejercicio = String(parentId)
  loadExerciseChoices(parentId)
  loadCalibreChoices()
}

function openMunitionEdit(record: MunitionConsumptionDTO): void {
  if (!canUpdate.value || isMutationUncertain.value) return
  beginModal(MODAL.MUNITION_DETAIL)
  loadMunitionDetail(record.id_consumo, 'edit')
}

function openMunitionDetail(record: MunitionConsumptionDTO): void {
  if (!canRead.value) return
  beginModal(MODAL.MUNITION_DETAIL)
  loadMunitionDetail(record.id_consumo, 'detail')
}

function openMunitionDetailById(id: number): void {
  if (!canRead.value) return
  beginModal(MODAL.MUNITION_DETAIL)
  loadMunitionDetail(id, 'detail')
}

function loadMunitionDetail(id: number, intent: 'detail' | 'edit'): void {
  void perform(
    'get-munition-consumption',
    String(id),
    (connection) => getMunitionConsumption(id, connection),
    {
      modalScoped: true,
      resource: 'munition',
      onSuccess: (record) => {
        if (intent === 'detail') {
          detailMunition.value = record
          modalKind.value = MODAL.MUNITION_DETAIL
          loadCalibreChoices()
          return
        }
        modalKind.value = MODAL.MUNITION_FORM
        originalMunition.value = record
        munitionDraft.ejercicio = String(record.ejercicio)
        munitionDraft.tipo_arma = record.tipo_arma
        munitionDraft.modelo_arma = record.modelo_arma
        munitionDraft.calibre_code = record.calibre_code
        munitionDraft.cantidad_armas = record.cantidad_armas === null ? '' : String(record.cantidad_armas)
        munitionDraft.cantidad_tiros = String(record.cantidad_tiros)
        munitionDraft.es_aproximado = record.es_aproximado
        munitionDraft.observaciones = record.observaciones
        loadExerciseChoices(record.ejercicio)
        loadCalibreChoices()
      },
      onFailure: (error) => {
        modalMessage.value = messageForError(error)
        modalFieldErrors.value = {}
      },
    },
  )
}

function openMunitionDelete(record: MunitionConsumptionDTO): void {
  if (!canDelete.value || isMutationUncertain.value) return
  beginModal(MODAL.MUNITION_DELETE)
  deleteMunitionTarget.value = record
}

function openWeaponCreate(): void {
  if (!canCreate.value || isMutationUncertain.value) return
  beginModal(MODAL.WEAPON_FORM)
  const parentId = readNavigationStateId('munitionConsumptionId')
  if (parentId !== null) weaponDraft.consumo = String(parentId)
  loadMunitionChoices(parentId)
  loadWeaponChoices()
}

function openWeaponEdit(record: WeaponConsumptionDTO): void {
  if (!canUpdate.value || isMutationUncertain.value) return
  beginModal(MODAL.WEAPON_DETAIL)
  loadWeaponDetail(record.id_consumo_arma, 'edit')
}

function openWeaponDetail(record: WeaponConsumptionDTO): void {
  if (!canRead.value) return
  beginModal(MODAL.WEAPON_DETAIL)
  loadWeaponDetail(record.id_consumo_arma, 'detail')
}

function loadWeaponDetail(id: number, intent: 'detail' | 'edit'): void {
  void perform(
    'get-weapon-consumption',
    String(id),
    (connection) => getWeaponConsumption(id, connection),
    {
      modalScoped: true,
      resource: 'weapon',
      onSuccess: (record) => {
        if (intent === 'detail') {
          detailWeapon.value = record
          modalKind.value = MODAL.WEAPON_DETAIL
          return
        }
        modalKind.value = MODAL.WEAPON_FORM
        originalWeapon.value = record
        weaponDraft.consumo = String(record.consumo)
        weaponDraft.arma = String(record.arma)
        weaponDraft.cantidad_tiros = String(record.cantidad_tiros)
        weaponDraft.observaciones = record.observaciones
        loadMunitionChoices(record.consumo)
        loadWeaponChoices(record.arma)
      },
      onFailure: (error) => {
        modalMessage.value = messageForError(error)
        modalFieldErrors.value = {}
      },
    },
  )
}

function openWeaponDelete(record: WeaponConsumptionDTO): void {
  if (!canDelete.value || isMutationUncertain.value) return
  beginModal(MODAL.WEAPON_DELETE)
  deleteWeaponTarget.value = record
}

function loadExerciseChoices(preselectId: number | null = null): void {
  if (!canRead.value) {
    catalogExercisesState.value = LOAD.DENIED
    catalogExercisesMessage.value = { kind: MESSAGE.WARNING, text: 'El contexto no incluye permiso para consultar ejercicios.' }
    return
  }
  catalogExercisesState.value = LOAD.LOADING
  catalogExercisesMessage.value = null
  void perform('get-exercise-choices', 'exercise-choices', getExercises, {
    modalScoped: true,
    resource: 'exercise',
    onSuccess: (records) => {
      catalogExercises.value = records
      catalogExercisesState.value = records.length ? LOAD.READY : LOAD.EMPTY
      if (preselectId !== null) {
        const found = records.some((record) => record.id_ejercicio === preselectId)
        if (found) munitionDraft.ejercicio = String(preselectId)
        else if (originalMunition.value?.ejercicio === preselectId) {
          modalMessage.value = {
            kind: MESSAGE.INFO,
            text: `El ejercicio ${preselectId} devuelto por el consumo no figura en el catálogo accesible. Conservo la relación actual.`,
          }
        } else {
          munitionDraft.ejercicio = ''
          modalMessage.value = {
            kind: MESSAGE.INFO,
            text: `El ejercicio ${preselectId} del estado de navegación no está entre los registros devueltos. El selector queda sin preselección.`,
          }
        }
      }
    },
    onFailure: (error) => {
      catalogExercisesState.value = errorStatus(error) === 403 ? LOAD.DENIED : LOAD.ERROR
      catalogExercisesMessage.value = messageForError(error)
    },
  })
}

function loadCalibreChoices(): void {
  catalogCalibresState.value = LOAD.LOADING
  catalogCalibresMessage.value = null
  void perform('get-active-calibres', 'active-calibres', getActiveCalibres, {
    modalScoped: true,
    resource: 'catalog',
    onSuccess: (records) => {
      catalogCalibres.value = records
      catalogCalibresState.value = records.length ? LOAD.READY : LOAD.EMPTY
    },
    onFailure: (error) => {
      catalogCalibresState.value = errorStatus(error) === 403 ? LOAD.DENIED : LOAD.ERROR
      catalogCalibresMessage.value = messageForError(error)
    },
  })
}

function loadMunitionChoices(preselectId: number | null = null): void {
  if (!canRead.value) {
    catalogMunitionsState.value = LOAD.DENIED
    catalogMunitionsMessage.value = { kind: MESSAGE.WARNING, text: 'El contexto no incluye permiso para consultar consumos de munición.' }
    return
  }
  catalogMunitionsState.value = LOAD.LOADING
  catalogMunitionsMessage.value = null
  void perform('get-munition-choices', 'munition-choices', getMunitionConsumptions, {
    modalScoped: true,
    resource: 'munition',
    onSuccess: (records) => {
      catalogMunitions.value = records
      catalogMunitionsState.value = records.length ? LOAD.READY : LOAD.EMPTY
      if (preselectId !== null) {
        const found = records.some((record) => record.id_consumo === preselectId)
        if (found) weaponDraft.consumo = String(preselectId)
        else if (originalWeapon.value?.consumo === preselectId) {
          modalMessage.value = {
            kind: MESSAGE.INFO,
            text: `El consumo ${preselectId} devuelto por la relación no figura en el catálogo accesible. Conservo la relación actual.`,
          }
        } else {
          weaponDraft.consumo = ''
          modalMessage.value = {
            kind: MESSAGE.INFO,
            text: `El consumo ${preselectId} del estado de navegación no está entre los registros devueltos. El selector queda sin preselección.`,
          }
        }
      }
    },
    onFailure: (error) => {
      catalogMunitionsState.value = errorStatus(error) === 403 ? LOAD.DENIED : LOAD.ERROR
      catalogMunitionsMessage.value = messageForError(error)
    },
  })
}

function loadWeaponChoices(keepId: number | null = null): void {
  catalogWeaponsState.value = LOAD.LOADING
  catalogWeaponsMessage.value = null
  void perform('get-weapon-choices', 'weapon-choices', getWeapons, {
    modalScoped: true,
    resource: 'weapon-catalog',
    onSuccess: (records) => {
      catalogWeapons.value = records
      catalogWeaponsState.value = records.length ? LOAD.READY : LOAD.EMPTY
      if (keepId !== null && !records.some((record) => record.id_arma === keepId)) {
        modalMessage.value = {
          kind: MESSAGE.INFO,
          text: `El arma ${keepId} no figura en el catálogo accesible. Su ID devuelto se conserva como opción actual.`,
        }
      }
    },
    onFailure: (error) => {
      catalogWeaponsState.value = errorStatus(error) === 403 ? LOAD.DENIED : LOAD.ERROR
      catalogWeaponsMessage.value = messageForError(error)
    },
  })
}

function availableExerciseId(id: number): boolean {
  return catalogExercises.value.some((item) => item.id_ejercicio === id)
    || originalMunition.value?.ejercicio === id
}

function availableMunitionId(id: number): boolean {
  return catalogMunitions.value.some((item) => item.id_consumo === id)
    || originalWeapon.value?.consumo === id
}

function availableWeaponId(id: number): boolean {
  return catalogWeapons.value.some((item) => item.id_arma === id)
    || originalWeapon.value?.arma === id
}

function calibreCanReplace(): boolean {
  return munitionDraft.calibre_code === ''
    || activeCalibreOptions.value.some((item) => item.code === munitionDraft.calibre_code)
}

function exerciseFullBody(includeCreateDefaults: boolean): CreateExerciseBody {
  const body: CreateExerciseBody = {
    nombre: exerciseDraft.nombre.trim(),
    fecha: exerciseDraft.fecha,
    zona: exerciseDraft.zona,
    tipo_ejercicio: exerciseDraft.tipo_ejercicio as ExerciseTypeCode,
    numero_orden: exerciseDraft.numero_orden.trim() || null,
    fecha_orden: exerciseDraft.fecha_orden || null,
    observaciones: exerciseDraft.observaciones,
  }
  if (exerciseDraft.unidades_participantes_codes.length > 0
    || (!includeCreateDefaults && (originalExercise.value?.unidades_participantes_codes.length ?? 0) > 0)) {
    body.unidades_participantes_codes_write = [...exerciseDraft.unidades_participantes_codes]
  }
  return body
}

function exercisePatchBody(): PatchExerciseBody {
  const original = originalExercise.value
  const body: PatchExerciseBody = {}
  if (!original) return body
  if (exerciseDraft.nombre.trim() !== original.nombre) body.nombre = exerciseDraft.nombre.trim()
  if (exerciseDraft.fecha !== original.fecha) body.fecha = exerciseDraft.fecha
  if (exerciseDraft.zona !== original.zona) body.zona = exerciseDraft.zona
  if (exerciseDraft.tipo_ejercicio !== original.tipo_ejercicio) {
    body.tipo_ejercicio = exerciseDraft.tipo_ejercicio as ExerciseTypeCode
  }
  const orderNumber = exerciseDraft.numero_orden.trim() || null
  if (orderNumber !== original.numero_orden) body.numero_orden = orderNumber
  const orderDate = exerciseDraft.fecha_orden || null
  if (orderDate !== original.fecha_orden) body.fecha_orden = orderDate
  if (exerciseDraft.observaciones !== original.observaciones) body.observaciones = exerciseDraft.observaciones
  if (!sameStrings(exerciseDraft.unidades_participantes_codes, original.unidades_participantes_codes)) {
    body.unidades_participantes_codes_write = [...exerciseDraft.unidades_participantes_codes]
  }
  return body
}

function munitionFullBody(includeCreateDefaults: boolean): CreateMunitionConsumptionBody | null {
  const exercise = positiveInteger(munitionDraft.ejercicio)
  const shotCount = nonNegativeInteger(munitionDraft.cantidad_tiros)
  const weaponType = TIPO_ARMA_CHOICES.find(([code]) => code === munitionDraft.tipo_arma)?.[0]
  const weaponCount = isBlankNumber(munitionDraft.cantidad_armas)
    ? null
    : nonNegativeInteger(munitionDraft.cantidad_armas)
  if (exercise === null || shotCount === null || weaponType === undefined) return null
  if (!isBlankNumber(munitionDraft.cantidad_armas) && weaponCount === null) return null
  const body: CreateMunitionConsumptionBody = {
    ejercicio: exercise,
    tipo_arma: weaponType,
    cantidad_tiros: shotCount,
    es_aproximado: munitionDraft.es_aproximado,
    observaciones: munitionDraft.observaciones,
  }
  if (!includeCreateDefaults || munitionDraft.modelo_arma !== '') {
    body.modelo_arma = munitionDraft.modelo_arma
  }
  if (munitionDraft.calibre_code !== '') body.calibre_code_write = munitionDraft.calibre_code
  else if (!includeCreateDefaults) body.calibre_code_write = null
  if (!includeCreateDefaults || weaponCount !== null) body.cantidad_armas = weaponCount
  return body
}

function munitionPatchBody(): PatchMunitionConsumptionBody {
  const original = originalMunition.value
  const body: PatchMunitionConsumptionBody = {}
  if (!original) return body
  const exercise = positiveInteger(munitionDraft.ejercicio)
  if (exercise !== null && exercise !== original.ejercicio) body.ejercicio = exercise
  if (munitionDraft.tipo_arma !== original.tipo_arma) {
    const choice = TIPO_ARMA_CHOICES.find(([code]) => code === munitionDraft.tipo_arma)?.[0]
    if (choice) body.tipo_arma = choice
  }
  if (munitionDraft.modelo_arma !== original.modelo_arma) body.modelo_arma = munitionDraft.modelo_arma
  if (munitionDraft.calibre_code !== original.calibre_code) {
    body.calibre_code_write = munitionDraft.calibre_code || null
  }
  const weaponCount = isBlankNumber(munitionDraft.cantidad_armas)
    ? null
    : nonNegativeInteger(munitionDraft.cantidad_armas)
  if (weaponCount !== original.cantidad_armas) body.cantidad_armas = weaponCount
  const shots = nonNegativeInteger(munitionDraft.cantidad_tiros)
  if (shots !== null && shots !== original.cantidad_tiros) body.cantidad_tiros = shots
  if (munitionDraft.es_aproximado !== original.es_aproximado) body.es_aproximado = munitionDraft.es_aproximado
  if (munitionDraft.observaciones !== original.observaciones) body.observaciones = munitionDraft.observaciones
  return body
}

function weaponFullBody(): CreateWeaponConsumptionBody | null {
  const consumptionId = positiveInteger(weaponDraft.consumo)
  const weaponId = positiveInteger(weaponDraft.arma)
  const shotCount = nonNegativeInteger(weaponDraft.cantidad_tiros)
  if (consumptionId === null || weaponId === null || shotCount === null) return null
  return {
    consumo: consumptionId,
    arma: weaponId,
    cantidad_tiros: shotCount,
    observaciones: weaponDraft.observaciones,
  }
}

function weaponPatchBody(): PatchWeaponConsumptionBody {
  const original = originalWeapon.value
  const body: PatchWeaponConsumptionBody = {}
  if (!original) return body
  const consumptionId = positiveInteger(weaponDraft.consumo)
  if (consumptionId !== null && consumptionId !== original.consumo) body.consumo = consumptionId
  const weaponId = positiveInteger(weaponDraft.arma)
  if (weaponId !== null && weaponId !== original.arma) body.arma = weaponId
  const shots = nonNegativeInteger(weaponDraft.cantidad_tiros)
  if (shots !== null && shots !== original.cantidad_tiros) body.cantidad_tiros = shots
  if (weaponDraft.observaciones !== original.observaciones) body.observaciones = weaponDraft.observaciones
  return body
}

// Diff vigente de cada editor: decide el contenido del primario «Guardar
// cambios» (PATCH); sin campos modificados, el aviso lo emite el guardado.

// Éxito por resultado observable: sin códigos de operación (PUT/PATCH/204) en
// el mensaje; se nombra el registro y la actualización que sigue.
function mutationSuccessText(entity: EntityKind, id: number, created: boolean): string {
  const label = entity === 'exercise' ? 'Ejercicio' : entity === 'munition' ? 'Consumo de munición' : 'Consumo por arma'
  const target = screen.value === SCREEN.EXERCISE_DETAIL ? 'la ficha' : 'la lista'
  return `${label} ${id} ${created ? 'creado' : 'guardado'}. Actualizando ${target}…`
}

function afterMutation(): void {
  closeModal()
  if (screen.value === SCREEN.EXERCISES) void loadExerciseList()
  else if (screen.value === SCREEN.EXERCISE_DETAIL) void loadExerciseDetail()
  else if (screen.value === SCREEN.MUNITION) {
    void loadMunitionList()
    void loadWeaponList()
  } else if (screen.value === SCREEN.WEAPON) void loadWeaponList()
}

function saveExercise(method: EditorMethod): void {
  const original = originalExercise.value
  if (!exerciseFormValid.value || modalBusy.value || isMutationUncertain.value) return
  if (method === 'create' ? !canCreate.value : !canUpdate.value) return
  const id = original?.id_ejercicio ?? null
  let request: (connection: ApiConnection) => Promise<ExerciseDTO>
  if (method === 'create') {
    request = (connection) => createExercise(exerciseFullBody(true), connection)
  } else if (method === 'put' && id !== null) {
    request = (connection) => replaceExercise(id, exerciseFullBody(false) as ReplaceExerciseBody, connection)
  } else if (method === 'patch' && id !== null) {
    const body = exercisePatchBody()
    if (!Object.keys(body).length) {
      modalMessage.value = { kind: MESSAGE.INFO, text: 'No hay cambios que guardar.' }
      return
    }
    request = (connection) => patchExercise(id, body, connection)
  } else return

  clearModalFeedback()
  const operation = method === 'create' ? 'create-exercise' : `${method}-exercise`
  void perform(operation, id === null ? 'new-exercise' : String(id), request, {
    modalScoped: true,
    mutation: true,
    resource: 'exercise',
    onSuccess: (record) => {
      operationNotice.value = { kind: MESSAGE.INFO, text: mutationSuccessText('exercise', record.id_ejercicio, method === 'create') }
      afterMutation()
    },
    onFailure: (error) => reportModalFailure(error, 'exercise'),
  })
}

function saveMunition(method: EditorMethod): void {
  const original = originalMunition.value
  if (!munitionFormValid.value || modalBusy.value || isMutationUncertain.value) return
  if (method === 'create' ? !canCreate.value : !canUpdate.value) return
  const id = original?.id_consumo ?? null
  let request: (connection: ApiConnection) => Promise<MunitionConsumptionDTO>
  if (method === 'create') {
    const body = munitionFullBody(true)
    if (!body) {
      modalMessage.value = { kind: MESSAGE.ERROR, text: 'Completa los campos requeridos con los valores del contrato antes de enviar.' }
      return
    }
    request = (connection) => createMunitionConsumption(body, connection)
  } else if (method === 'put' && id !== null) {
    if (!calibreCanReplace()) {
      modalMessage.value = {
        kind: MESSAGE.ERROR,
        text: 'El calibre devuelto no está en el catálogo activo. Selecciona un calibre activo o deja el campo sin calibre antes de enviar PUT.',
      }
      return
    }
    const body = munitionFullBody(false)
    if (!body) {
      modalMessage.value = { kind: MESSAGE.ERROR, text: 'Completa los campos requeridos con los valores del contrato antes de enviar.' }
      return
    }
    request = (connection) => replaceMunitionConsumption(
      id,
      body as ReplaceMunitionConsumptionBody,
      connection,
    )
  } else if (method === 'patch' && id !== null) {
    const body = munitionPatchBody()
    if (!Object.keys(body).length) {
      modalMessage.value = { kind: MESSAGE.INFO, text: 'No hay cambios que guardar.' }
      return
    }
    request = (connection) => patchMunitionConsumption(id, body, connection)
  } else return

  clearModalFeedback()
  const operation = method === 'create' ? 'create-munition-consumption' : `${method}-munition-consumption`
  void perform(operation, id === null ? 'new-munition-consumption' : String(id), request, {
    modalScoped: true,
    mutation: true,
    resource: 'munition',
    onSuccess: (record) => {
      operationNotice.value = { kind: MESSAGE.INFO, text: mutationSuccessText('munition', record.id_consumo, method === 'create') }
      afterMutation()
    },
    onFailure: (error) => reportModalFailure(error, 'munition'),
  })
}

function saveWeapon(method: EditorMethod): void {
  const original = originalWeapon.value
  if (!weaponFormValid.value || modalBusy.value || isMutationUncertain.value) return
  if (method === 'create' ? !canCreate.value : !canUpdate.value) return
  const id = original?.id_consumo_arma ?? null
  let request: (connection: ApiConnection) => Promise<WeaponConsumptionDTO>
  if (method === 'create') {
    const body = weaponFullBody()
    if (!body) {
      modalMessage.value = { kind: MESSAGE.ERROR, text: 'Completa los campos requeridos con los valores del contrato antes de enviar.' }
      return
    }
    request = (connection) => createWeaponConsumption(body, connection)
  } else if (method === 'put' && id !== null) {
    const body = weaponFullBody()
    if (!body) {
      modalMessage.value = { kind: MESSAGE.ERROR, text: 'Completa los campos requeridos con los valores del contrato antes de enviar.' }
      return
    }
    request = (connection) => replaceWeaponConsumption(id, body as ReplaceWeaponConsumptionBody, connection)
  } else if (method === 'patch' && id !== null) {
    const body = weaponPatchBody()
    if (!Object.keys(body).length) {
      modalMessage.value = { kind: MESSAGE.INFO, text: 'No hay cambios que guardar.' }
      return
    }
    request = (connection) => patchWeaponConsumption(id, body, connection)
  } else return

  clearModalFeedback()
  const operation = method === 'create' ? 'create-weapon-consumption' : `${method}-weapon-consumption`
  void perform(operation, id === null ? 'new-weapon-consumption' : String(id), request, {
    modalScoped: true,
    mutation: true,
    resource: 'weapon',
    onSuccess: (record) => {
      operationNotice.value = { kind: MESSAGE.INFO, text: mutationSuccessText('weapon', record.id_consumo_arma, method === 'create') }
      afterMutation()
    },
    onFailure: (error) => reportModalFailure(error, 'weapon'),
  })
}

function confirmExerciseDelete(): void {
  const target = deleteExerciseTarget.value
  if (!target || !canDelete.value || modalBusy.value || isMutationUncertain.value) return
  clearModalFeedback()
  void perform(
    'delete-exercise',
    String(target.id_ejercicio),
    (connection) => deleteExercise(target.id_ejercicio, connection),
    {
      modalScoped: true,
      mutation: true,
      resource: 'exercise',
      onSuccess: () => {
        operationNotice.value = { kind: MESSAGE.INFO, text: 'Ejercicio dado de baja. Actualizando la ficha…' }
        closeModal()
        void loadExerciseDetail()
      },
      onFailure: (error) => {
        modalMessage.value = messageForError(error)
        modalFieldErrors.value = {}
      },
    },
  )
}

function confirmMunitionDelete(): void {
  const target = deleteMunitionTarget.value
  if (!target || !canDelete.value || modalBusy.value || isMutationUncertain.value) return
  clearModalFeedback()
  void perform(
    'delete-munition-consumption',
    String(target.id_consumo),
    (connection) => deleteMunitionConsumption(target.id_consumo, connection),
    {
      modalScoped: true,
      mutation: true,
      resource: 'munition',
      onSuccess: () => {
        operationNotice.value = { kind: MESSAGE.INFO, text: 'Consumo de munición dado de baja. Actualizando la lista…' }
        closeModal()
        void loadMunitionList()
        void loadWeaponList()
      },
      onFailure: (error) => {
        modalMessage.value = messageForError(error)
        modalFieldErrors.value = {}
      },
    },
  )
}

function confirmWeaponDelete(): void {
  const target = deleteWeaponTarget.value
  if (!target || !canDelete.value || modalBusy.value || isMutationUncertain.value) return
  clearModalFeedback()
  void perform(
    'delete-weapon-consumption',
    String(target.id_consumo_arma),
    (connection) => deleteWeaponConsumption(target.id_consumo_arma, connection),
    {
      modalScoped: true,
      mutation: true,
      resource: 'weapon',
      onSuccess: () => {
        operationNotice.value = { kind: MESSAGE.INFO, text: 'Relación dada de baja. Actualizando la lista…' }
        closeModal()
        void loadWeaponList()
      },
      onFailure: (error) => {
        modalMessage.value = messageForError(error)
        modalFieldErrors.value = {}
      },
    },
  )
}

function refreshCurrentRoute(): void {
  operationNotice.value = null
  void loadCurrentRoute()
}

function display(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

// Fecha de calendario (YYYY-MM-DD) formateada en es-CL sin desplazamiento de
// zona: se construye en UTC y se formatea en UTC. El ISO crudo va en `title`.
const CALENDAR_DATE_FORMAT = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
})

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'short', timeStyle: 'short',
})

function formatCalendarDate(value: string | null | undefined): string {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return display(value)
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return CALENDAR_DATE_FORMAT.format(date)
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return display(value)
  return DATE_TIME_FORMAT.format(date)
}

// Nombre de unidad desde el catálogo cargado, con el código como apoyo; si el
// catálogo no la tiene, se conserva el código devuelto por el servidor.
function unitLabelFromCode(code: string): string {
  const unit = unitByCode.value.get(code)
  return unit ? `${unit.code} — ${unit.name}` : code
}

function unitLabelFromId(id: number | null): string {
  if (id === null) return '—'
  const unit = unitById.value.get(id)
  return unit ? `${unit.code} — ${unit.name}` : `Unidad ${id}`
}

const OPERATION_LABELS: Readonly<Record<string, string>> = {
  'create-exercise': 'crear un ejercicio',
  'put-exercise': 'reemplazar un ejercicio',
  'patch-exercise': 'actualizar un ejercicio',
  'delete-exercise': 'eliminar un ejercicio',
  'create-munition-consumption': 'crear un consumo de munición',
  'put-munition-consumption': 'reemplazar un consumo de munición',
  'patch-munition-consumption': 'actualizar un consumo de munición',
  'delete-munition-consumption': 'eliminar un consumo de munición',
  'create-weapon-consumption': 'crear una relación de consumo por arma',
  'put-weapon-consumption': 'reemplazar una relación de consumo por arma',
  'patch-weapon-consumption': 'actualizar una relación de consumo por arma',
  'delete-weapon-consumption': 'eliminar una relación de consumo por arma',
}

function operationLabel(operation: string): string {
  return OPERATION_LABELS[operation] ?? 'una escritura'
}

function exerciseTypeLabel(code: string): string {
  return TIPO_EJERCICIO_CHOICES.find(([value]) => value === code)?.[1] ?? display(code)
}

function weaponTypeLabel(code: string): string {
  return TIPO_ARMA_CHOICES.find(([value]) => value === code)?.[1] ?? display(code)
}

function exerciseUnitHref(code: string): string | null {
  const unit = unitByCode.value.get(code)
  return unit ? `/organizacion/unidades/${unit.id}` : null
}

function exerciseOwnerUnitHref(id: number | null): string | null {
  const unit = id === null ? undefined : unitById.value.get(id)
  return unit ? `/organizacion/unidades/${unit.id}` : null
}

function weaponHref(id: number): string {
  return `/almacen/armas/${id}`
}

function catalogMunitionLabel(record: MunitionConsumptionDTO): string {
  return `Consumo ${record.id_consumo} · ejercicio ${record.ejercicio} · ${record.cantidad_tiros} tiros`
}

function catalogWeaponLabel(record: WeaponDTO): string {
  return `Arma ${record.id_arma} · ${weaponTypeLabel(record.tipo_arma)} · ${record.modelo_arma}`
}

function catalogExerciseLabel(record: ExerciseDTO): string {
  return `${record.id_ejercicio} · ${record.nombre} · ${record.fecha}`
}

function formCanSave(method: EditorMethod): boolean {
  if (modalBusy.value || isMutationUncertain.value) return false
  if (method === 'create') return canCreate.value
  if (method === 'put' || method === 'patch') return canUpdate.value
  return false
}

function clearFieldError(field: string): void {
  if (!modalFieldErrors.value[field]) return
  const next = { ...modalFieldErrors.value }
  delete next[field]
  modalFieldErrors.value = next
}

function updateParticipants(event: Event): void {
  const select = event.target
  if (!(select instanceof HTMLSelectElement)) return
  exerciseDraft.unidades_participantes_codes = Array.from(select.selectedOptions, (option) => option.value)
  clearFieldError('unidades_participantes_codes_write')
  clearFieldError('unidades_participantes_codes')
}

function availableParticipantOptions(): readonly { code: string; name: string }[] {
  const byCode = new Map<string, string>(
    unitOptions.value.map((unit): [string, string] => [unit.code, unit.name]),
  )
  for (const code of exerciseDraft.unidades_participantes_codes) {
    if (!byCode.has(code)) byCode.set(code, '')
  }
  return Array.from(byCode, ([code, name]) => ({ code, name }))
}

function currentMunitionExerciseMissing(): boolean {
  const id = positiveInteger(munitionDraft.ejercicio)
  return id !== null
    && !catalogExercises.value.some((record) => record.id_ejercicio === id)
    && originalMunition.value?.ejercicio !== id
}

function currentMunitionChoiceMissing(): boolean {
  const id = positiveInteger(weaponDraft.consumo)
  return id !== null
    && !catalogMunitions.value.some((record) => record.id_consumo === id)
    && originalWeapon.value?.consumo !== id
}

function currentWeaponChoiceMissing(): boolean {
  const id = positiveInteger(weaponDraft.arma)
  return id !== null
    && !catalogWeapons.value.some((record) => record.id_arma === id)
    && originalWeapon.value?.arma !== id
}

function modalFormEntity(): EntityKind | null {
  if (modalKind.value === MODAL.EXERCISE_FORM) return 'exercise'
  if (modalKind.value === MODAL.MUNITION_FORM) return 'munition'
  if (modalKind.value === MODAL.WEAPON_FORM) return 'weapon'
  return null
}

function submitForm(method: EditorMethod): void {
  const entity = modalFormEntity()
  if (entity === 'exercise') saveExercise(method)
  else if (entity === 'munition') saveMunition(method)
  else if (entity === 'weapon') saveWeapon(method)
}

watch(
  [() => sessionFingerprint.value, () => routeKey.value],
  ([nextSessionKey, nextRouteKey], [previousSessionKey, previousRouteKey]) => {
    const sessionChanged = nextSessionKey !== previousSessionKey
    const routeChanged = nextRouteKey !== previousRouteKey
    if (sessionChanged || routeChanged) {
      clearPrivateViewState()
      abortAllRequests()
      weaponParentFilter.value = screen.value === SCREEN.WEAPON
        ? readNavigationStateId('munitionConsumptionId')
        : null
      if (sessionChanged) {
        uncertainMutation.value = uncertaintyMap().get(nextSessionKey) ?? null
      }
      if (sessionEligible.value) void loadCurrentRoute()
    }
  },
  { immediate: true, flush: 'sync' },
)

onBeforeUnmount(() => {
  mounted = false
  abortAllRequests()
  clearPrivateViewState()
})
</script>

<template>
  <main class="page-content exercises-view">
    <header class="exercises-heading">
      <div>
        <h1 class="exercises-title">
          {{ screen === SCREEN.EXERCISE_DETAIL ? (exerciseRecord?.nombre || `Ejercicio ${exerciseId ?? '—'}`) : screen === SCREEN.MUNITION ? 'Consumos de munición' : screen === SCREEN.WEAPON ? 'Consumos por arma' : 'Ejercicios' }}
        </h1>
        <nav class="breadcrumb exercises-breadcrumb" aria-label="Ruta de navegación">
          <RouterLink to="/">Inicio</RouterLink><span aria-hidden="true">›</span>
          <RouterLink to="/tiro/ejercicios">Ejercicios</RouterLink>
          <template v-if="screen === SCREEN.EXERCISE_DETAIL">
            <span aria-hidden="true">›</span><span aria-current="page">{{ exerciseRecord?.nombre ?? display(exerciseId) }}</span>
          </template>
          <template v-else-if="screen === SCREEN.MUNITION">
            <span aria-hidden="true">›</span><span aria-current="page">Consumos de munición</span>
          </template>
          <template v-else-if="screen === SCREEN.WEAPON">
            <span aria-hidden="true">›</span><span aria-current="page">Consumos por arma</span>
          </template>
        </nav>
      </div>
      <div class="exercises-heading-actions">
        <button v-if="screen !== SCREEN.UNKNOWN" class="btn btn-outline-secondary" type="button" :disabled="pageBusy || !sessionEligible" @click="refreshCurrentRoute">Actualizar</button>
        <button v-if="canReconcileHere" class="btn btn-warning" type="button" :disabled="pageBusy" @click="reconcileCurrentResource">Consultar estado real</button>
        <button v-else-if="isMutationUncertain && uncertainMutation?.sessionKey === sessionFingerprint" class="btn btn-warning" type="button" @click="reconcileCurrentResource">Ir al recurso pendiente</button>
      </div>
    </header>

    <nav class="exercises-tabs" aria-label="Secciones de ejercicios">
      <RouterLink to="/tiro/ejercicios" :aria-current="screen === SCREEN.EXERCISES || screen === SCREEN.EXERCISE_DETAIL ? 'page' : undefined">Ejercicios</RouterLink>
      <RouterLink to="/tiro/consumos-municion" :aria-current="screen === SCREEN.MUNITION ? 'page' : undefined">Consumos de munición</RouterLink>
      <RouterLink to="/tiro/consumos-arma" :aria-current="screen === SCREEN.WEAPON ? 'page' : undefined">Consumos por arma</RouterLink>
    </nav>

    <div v-if="isMutationUncertain" class="alert alert-warning exercises-notice" role="alert">
      <p>Una escritura no tuvo respuesta confirmada. No la repitas: queda bloqueada hasta consultar el estado actual del recurso.</p>
      <p v-if="uncertainMutation">Operación sin confirmar: {{ operationLabel(uncertainMutation.operation) }}.</p>
    </div>
    <div v-if="operationNotice" class="alert" :class="operationNotice.kind === MESSAGE.ERROR ? 'alert-danger' : operationNotice.kind === MESSAGE.WARNING ? 'alert-warning' : 'alert-info'" role="status" aria-live="polite">
      {{ operationNotice.text }}
    </div>

    <section v-if="!sessionEligible" class="card">
      <div class="card-body">
        <h2 class="card-title">Ejercicios no disponibles</h2>
        <p role="status">La vista espera una sesión confirmada, con institución y unidad activas. No consulta la API ni solicita contexto por su cuenta.</p>
      </div>
    </section>

    <template v-else-if="screen === SCREEN.EXERCISES">
      <section class="card" aria-labelledby="exercises-list-title">
        <div class="card-header exercises-card-header">
          <div>
            <h2 id="exercises-list-title" class="card-title">Ejercicios de la institución</h2>
            <p class="card-subtitle">Ejercicios registrados en el contexto activo.</p>
          </div>
          <button class="btn btn-primary" type="button" :disabled="!canCreate || isMutationUncertain" :aria-describedby="canCreate ? undefined : 'exercises-create-hint'" @click="openExerciseCreate">Crear ejercicio</button>
          <p v-if="!canCreate" id="exercises-create-hint" class="card-text muted" role="status">{{ denialNotice(PERMISSION.CREATE) }}</p>
        </div>
        <div class="card-body">
          <div class="exercises-toolbar">
            <div class="exercises-toolbar-field">
              <label class="form-label" for="exercise-search">Buscar</label>
              <input id="exercise-search" v-model="exerciseSearch" class="form-control" type="search" autocomplete="off">
            </div>
            <div class="exercises-toolbar-field">
              <label class="form-label" for="exercise-sort">Ordenar por</label>
              <select id="exercise-sort" v-model="exerciseSort" class="form-control exercises-sort">
                <option value="fecha">Fecha</option><option value="nombre">Nombre</option><option value="id_ejercicio">ID</option>
              </select>
            </div>
            <button class="btn btn-outline-secondary" type="button" :aria-pressed="exerciseSortDesc" @click="exerciseSortDesc = !exerciseSortDesc">Orden descendente</button>
          </div>
          <p v-if="exerciseListState === LOAD.READY" class="exercises-count" role="status">{{ exerciseCountLabel }}</p>
          <div v-if="exerciseListState === LOAD.LOADING" class="exercises-state" role="status">Cargando ejercicios…</div>
          <div v-else-if="exerciseListState === LOAD.DENIED || exerciseListState === LOAD.ERROR" class="alert" :class="exerciseListState === LOAD.DENIED ? 'alert-warning' : 'alert-danger'" role="alert">
            <p>{{ exerciseListMessage?.text }}</p><button class="btn btn-outline-primary" type="button" @click="refreshCurrentRoute">Reintentar lectura</button>
          </div>
          <p v-else-if="exerciseListState === LOAD.EMPTY" class="exercises-state" role="status">No hay ejercicios devueltos para este contexto.</p>
          <div v-else-if="exerciseListState === LOAD.READY" class="table-responsive">
            <table class="table table-centered">
              <caption class="exercises-caption">Ejercicios de la institución activa</caption>
              <thead><tr><th scope="col">ID</th><th scope="col">Nombre</th><th scope="col">Fecha</th><th scope="col">Zona</th><th scope="col">Tipo</th><th scope="col">Observaciones</th><th scope="col">Unidades participantes</th><th scope="col">Unidad efectiva</th><th scope="col">Creado</th><th scope="col">Acción</th></tr></thead>
              <tbody>
                <tr v-for="item in visibleExercises" :key="item.id_ejercicio">
                  <td>{{ item.id_ejercicio }}</td><td>{{ display(item.nombre) }}</td><td :title="item.fecha">{{ formatCalendarDate(item.fecha) }}</td><td>{{ display(item.zona) }}</td>
                  <td><span v-if="item.tipo_ejercicio" class="badge bg-primary">{{ exerciseTypeLabel(item.tipo_ejercicio) }}</span><span v-else>—</span></td>
                  <td>{{ display(item.observaciones) }}</td><td>{{ item.unidades_participantes_codes.map(unitLabelFromCode).join(', ') || '—' }}</td>
                  <td>{{ unitLabelFromId(item.organization_unit) }}</td><td :title="item.created_at ?? undefined">{{ formatDateTime(item.created_at) }}</td>
                  <td><RouterLink class="btn btn-sm btn-outline-primary" :to="`/tiro/ejercicios/${item.id_ejercicio}`">Ver ficha</RouterLink></td>
                </tr>
                <tr v-if="visibleExercises.length === 0"><td colspan="10">No hay coincidencias en los registros cargados.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </template>

    <template v-else-if="screen === SCREEN.EXERCISE_DETAIL">
      <section class="card" aria-labelledby="exercise-detail-title">
        <div class="card-body">
          <h2 id="exercise-detail-title" class="card-title">Ficha de ejercicio</h2>
          <p class="card-text muted">Lectura por el ID presente en la ruta.</p>
          <div class="exercises-actions">
            <RouterLink class="btn btn-outline-primary" to="/tiro/ejercicios">Volver a ejercicios</RouterLink>
            <button class="btn btn-primary" type="button" :disabled="!canUpdate || !exerciseRecord || isMutationUncertain" :aria-describedby="canUpdate ? undefined : 'exercises-detail-update-hint'" @click="openExerciseEdit">Editar</button><button class="btn btn-danger" type="button" :disabled="!canDelete || !exerciseRecord || isMutationUncertain" :aria-describedby="canDelete ? undefined : 'exercises-detail-delete-hint'" @click="openExerciseDelete">Eliminar</button><p v-if="!canUpdate" id="exercises-detail-update-hint" class="card-text muted" role="status">{{ denialNotice(PERMISSION.UPDATE) }}</p><p v-if="!canDelete" id="exercises-detail-delete-hint" class="card-text muted" role="status">{{ denialNotice(PERMISSION.DELETE) }}</p></div>
          <div v-if="exerciseDetailState === LOAD.LOADING" class="exercises-state" role="status">Cargando ficha…</div>
          <div v-else-if="exerciseDetailState === LOAD.ERROR || exerciseDetailState === LOAD.DENIED" class="alert" :class="exerciseDetailState === LOAD.DENIED ? 'alert-warning' : 'alert-danger'" role="alert">
            <p>{{ exerciseDetailMessage?.text }}</p><button class="btn btn-outline-primary" type="button" @click="loadExerciseDetail">Reintentar lectura</button>
          </div>
          <dl v-else-if="exerciseRecord" class="exercises-detail-grid">
            <div><dt>ID</dt><dd>{{ exerciseRecord.id_ejercicio }}</dd></div>
            <div><dt>Nombre</dt><dd>{{ display(exerciseRecord.nombre) }}</dd></div>
            <div><dt>Fecha</dt><dd :title="exerciseRecord.fecha">{{ formatCalendarDate(exerciseRecord.fecha) }}</dd></div>
            <div><dt>Zona</dt><dd>{{ display(exerciseRecord.zona) }}</dd></div>
            <div><dt>Tipo</dt><dd>{{ exerciseTypeLabel(exerciseRecord.tipo_ejercicio) }}</dd></div>
            <div><dt>Número de orden</dt><dd>{{ display(exerciseRecord.numero_orden) }}</dd></div>
            <div><dt>Fecha de orden</dt><dd :title="exerciseRecord.fecha_orden ?? undefined">{{ exerciseRecord.fecha_orden ? formatCalendarDate(exerciseRecord.fecha_orden) : '—' }}</dd></div>
            <div><dt>Observaciones</dt><dd>{{ display(exerciseRecord.observaciones) }}</dd></div>
            <div><dt>Institución</dt><dd>{{ display(session.context?.tenant.code) }}</dd></div>
            <div>
              <dt>Unidad efectiva</dt>
              <dd>
                <RouterLink v-if="exerciseOwnerUnitHref(exerciseRecord.organization_unit)" :to="exerciseOwnerUnitHref(exerciseRecord.organization_unit)!">{{ unitLabelFromId(exerciseRecord.organization_unit) }}</RouterLink>
                <span v-else>{{ unitLabelFromId(exerciseRecord.organization_unit) }}</span>
              </dd>
            </div>
            <div><dt>Creado</dt><dd :title="exerciseRecord.created_at ?? undefined">{{ formatDateTime(exerciseRecord.created_at) }}</dd></div>
            <div class="exercises-detail-wide">
              <dt>Unidades participantes</dt>
              <dd v-if="exerciseRecord.unidades_participantes_codes.length" class="exercises-code-list">
                <template v-for="code in exerciseRecord.unidades_participantes_codes" :key="code">
                  <RouterLink v-if="exerciseUnitHref(code)" :to="exerciseUnitHref(code)!">{{ unitLabelFromCode(code) }}</RouterLink>
                  <span v-else>{{ unitLabelFromCode(code) }}</span>
                </template>
              </dd>
              <dd v-else>—</dd>
              <p v-if="unitOptionsState === LOAD.ERROR || unitOptionsState === LOAD.DENIED" class="exercises-muted">No fue posible cargar el catálogo de unidades: se muestran los códigos devueltos por el servidor.</p>
            </div>
          </dl>
        </div>
      </section>

      <section v-if="exerciseRecord" class="card exercises-related-card" aria-labelledby="exercise-related-title">
        <div class="card-header exercises-card-header"><div><h2 id="exercise-related-title" class="card-title">Consumos relacionados</h2><p class="card-subtitle">Consumos de munición y relaciones con armas de este ejercicio.</p></div><div class="exercises-actions"><RouterLink class="btn btn-outline-primary" :to="{ path: '/tiro/consumos-municion', state: { exerciseId: exerciseRecord.id_ejercicio } }">Abrir consumos de munición</RouterLink><button class="btn btn-outline-secondary" type="button" :disabled="pageBusy" @click="loadExerciseDetail">Actualizar relaciones</button></div></div>
        <div class="card-body exercises-related-body">
          <section aria-labelledby="exercise-munitions-title">
            <h3 id="exercise-munitions-title" class="card-title">Munición</h3>
            <div v-if="munitionListState === LOAD.LOADING" class="exercises-state" role="status">Consultando consumos de munición…</div>
            <div v-else-if="munitionListState === LOAD.ERROR || munitionListState === LOAD.DENIED" class="alert" :class="munitionListState === LOAD.DENIED ? 'alert-warning' : 'alert-danger'" role="alert"><p>{{ munitionListMessage?.text }}</p><button class="btn btn-outline-primary" type="button" @click="loadMunitionList">Reintentar relación</button></div>
            <p v-else-if="munitionListState === LOAD.EMPTY || (munitionListState === LOAD.READY && exerciseMunitionRows.length === 0)" class="exercises-state" role="status">No hay consumos de munición devueltos para este ejercicio.</p>
            <div v-else-if="munitionListState === LOAD.READY" class="table-responsive"><table class="table table-centered"><caption class="exercises-caption">Consumos de munición asociados por el ID de ejercicio</caption><thead><tr><th scope="col">ID</th><th scope="col">Tipo</th><th scope="col">Modelo</th><th scope="col">Calibre</th><th scope="col">Armas</th><th scope="col">Tiros</th><th scope="col">Aproximado</th><th scope="col">Acción</th></tr></thead><tbody>
              <tr v-for="item in exerciseMunitionRows" :key="item.id_consumo"><td>{{ item.id_consumo }}</td><td>{{ weaponTypeLabel(item.tipo_arma) }}</td><td>{{ display(item.modelo_arma) }}</td><td>{{ display(item.calibre_code) }}</td><td>{{ display(item.cantidad_armas) }}</td><td>{{ item.cantidad_tiros }}</td><td><span class="badge" :class="item.es_aproximado ? 'bg-warning' : 'bg-secondary'">{{ item.es_aproximado ? 'Sí' : 'No' }}</span></td><td class="exercises-actions"><button class="btn btn-sm btn-outline-primary" type="button" @click="openMunitionDetail(item)">Ver</button><RouterLink class="btn btn-sm btn-outline-primary" :to="{ path: '/tiro/consumos-arma', state: { munitionConsumptionId: item.id_consumo } }">Consumos por arma</RouterLink></td></tr>
            </tbody></table></div>
          </section>
          <section aria-labelledby="exercise-weapons-title">
            <h3 id="exercise-weapons-title" class="card-title">Relaciones con armas</h3>
            <div v-if="weaponListState === LOAD.LOADING" class="exercises-state" role="status">Consultando consumos por arma…</div>
            <div v-else-if="weaponListState === LOAD.ERROR || weaponListState === LOAD.DENIED" class="alert" :class="weaponListState === LOAD.DENIED ? 'alert-warning' : 'alert-danger'" role="alert"><p>{{ weaponListMessage?.text }}</p><button class="btn btn-outline-primary" type="button" @click="loadWeaponList">Reintentar relación</button></div>
            <p v-else-if="weaponListState === LOAD.EMPTY || (weaponListState === LOAD.READY && exerciseWeaponRows.length === 0)" class="exercises-state" role="status">No hay relaciones con armas devueltas para los consumos de este ejercicio.</p>
            <div v-else-if="weaponListState === LOAD.READY" class="table-responsive"><table class="table table-centered"><caption class="exercises-caption">Consumos por arma asociados a los consumos de este ejercicio</caption><thead><tr><th scope="col">ID relación</th><th scope="col">Consumo</th><th scope="col">Arma</th><th scope="col">Tiros</th><th scope="col">Observaciones</th><th scope="col">Acción</th></tr></thead><tbody>
              <tr v-for="item in exerciseWeaponRows" :key="item.id_consumo_arma"><td>{{ item.id_consumo_arma }}</td><td><RouterLink class="exercises-link-button" :to="{ path: '/tiro/consumos-municion', state: { munitionConsumptionId: item.consumo } }">{{ item.consumo }}</RouterLink></td><td><RouterLink :to="weaponHref(item.arma)">{{ item.arma }}</RouterLink></td><td>{{ item.cantidad_tiros }}</td><td>{{ display(item.observaciones) }}</td><td><button class="btn btn-sm btn-outline-primary" type="button" @click="openWeaponDetail(item)">Ver relación</button></td></tr>
            </tbody></table></div>
          </section>
        </div>
      </section>
    </template>

    <template v-else-if="screen === SCREEN.MUNITION">
      <section class="card" aria-labelledby="munition-list-title">
        <div class="card-header">
          <h2 id="munition-list-title" class="card-title">Consumos de munición</h2>
          <p class="card-subtitle">Consumos registrados en la institución activa.</p>
        </div>
        <div class="card-body">
          <button class="btn btn-primary" type="button" :disabled="!canCreate || isMutationUncertain" :aria-describedby="canCreate ? undefined : 'munition-create-hint'" @click="openMunitionCreate">Crear consumo</button>
          <p v-if="!canCreate" id="munition-create-hint" class="card-text muted" role="status">{{ denialNotice(PERMISSION.CREATE) }}</p>
          <p v-if="!canUpdate" id="munition-update-hint" class="card-text muted" role="status">{{ denialNotice(PERMISSION.UPDATE) }}</p>
          <p v-if="!canDelete" id="munition-delete-hint" class="card-text muted" role="status">{{ denialNotice(PERMISSION.DELETE) }}</p>
          <div class="exercises-toolbar">
            <div class="exercises-toolbar-field">
              <label class="form-label" for="munition-search">Buscar</label>
              <input id="munition-search" v-model="munitionSearch" class="form-control" type="search" autocomplete="off">
            </div>
            <div class="exercises-toolbar-field">
              <label class="form-label" for="munition-sort">Ordenar por</label>
              <select id="munition-sort" v-model="munitionSort" class="form-control exercises-sort"><option value="id_consumo">ID</option><option value="ejercicio">Ejercicio</option><option value="cantidad_tiros">Tiros</option></select>
            </div>
            <button class="btn btn-outline-secondary" type="button" :aria-pressed="munitionSortDesc" @click="munitionSortDesc = !munitionSortDesc">Orden descendente</button>
          </div>
          <p v-if="munitionListState === LOAD.READY" class="exercises-count" role="status">{{ munitionCountLabel }}</p>
          <div v-if="munitionListState === LOAD.LOADING" class="exercises-state" role="status">Cargando consumos de munición…</div>
          <div v-else-if="munitionListState === LOAD.ERROR || munitionListState === LOAD.DENIED" class="alert" :class="munitionListState === LOAD.DENIED ? 'alert-warning' : 'alert-danger'" role="alert"><p>{{ munitionListMessage?.text }}</p><button class="btn btn-outline-primary" type="button" @click="loadMunitionList">Reintentar lectura</button></div>
          <p v-else-if="munitionListState === LOAD.EMPTY" class="exercises-state" role="status">No hay consumos de munición para este contexto.</p>
          <div v-else-if="munitionListState === LOAD.READY" class="table-responsive"><table class="table table-centered"><caption class="exercises-caption">Consumos de munición de la institución activa</caption><thead><tr><th scope="col">ID</th><th scope="col">Ejercicio</th><th scope="col">Tipo de arma</th><th scope="col">Modelo</th><th scope="col">Calibre</th><th scope="col">Armas</th><th scope="col">Tiros</th><th scope="col">Aproximado</th><th scope="col">Observaciones</th><th scope="col">Acciones</th></tr></thead><tbody>
            <tr v-for="item in visibleMunitions" :key="item.id_consumo"><td>{{ item.id_consumo }}</td><td><RouterLink :to="`/tiro/ejercicios/${item.ejercicio}`">{{ item.ejercicio }}</RouterLink></td><td>{{ weaponTypeLabel(item.tipo_arma) }}</td><td>{{ display(item.modelo_arma) }}</td><td><RouterLink v-if="item.calibre_code" to="/almacen/calibres">{{ item.calibre_code }}</RouterLink><span v-else>—</span></td><td>{{ display(item.cantidad_armas) }}</td><td>{{ item.cantidad_tiros }}</td><td><span class="badge" :class="item.es_aproximado ? 'bg-warning' : 'bg-secondary'">{{ item.es_aproximado ? 'Sí' : 'No' }}</span></td><td>{{ display(item.observaciones) }}</td><td class="exercises-actions"><button class="btn btn-sm btn-outline-primary" type="button" @click="openMunitionDetail(item)">Ver</button><button class="btn btn-sm btn-outline-secondary" type="button" :disabled="!canUpdate || isMutationUncertain" :aria-describedby="canUpdate ? undefined : 'munition-update-hint'" @click="openMunitionEdit(item)">Editar</button><button class="btn btn-sm btn-outline-danger" type="button" :disabled="!canDelete || isMutationUncertain" :aria-describedby="canDelete ? undefined : 'munition-delete-hint'" @click="openMunitionDelete(item)">Eliminar</button></td></tr>
            <tr v-if="visibleMunitions.length === 0"><td colspan="10">No hay coincidencias en los registros cargados.</td></tr>
          </tbody></table></div>
        </div>
      </section>
    </template>

    <template v-else-if="screen === SCREEN.WEAPON">
      <section class="card" aria-labelledby="weapon-list-title">
        <div class="card-header">
          <h2 id="weapon-list-title" class="card-title">Consumos por arma</h2>
          <p class="card-subtitle">Relaciones entre un consumo de munición y un arma.</p>
        </div>
        <div class="card-body">
          <button class="btn btn-primary" type="button" :disabled="!canCreate || isMutationUncertain" :aria-describedby="canCreate ? undefined : 'weapon-create-hint'" @click="openWeaponCreate">Crear relación</button>
          <p v-if="!canCreate" id="weapon-create-hint" class="card-text muted" role="status">{{ denialNotice(PERMISSION.CREATE) }}</p>
          <p v-if="!canUpdate" id="weapon-update-hint" class="card-text muted" role="status">{{ denialNotice(PERMISSION.UPDATE) }}</p>
          <p v-if="!canDelete" id="weapon-delete-hint" class="card-text muted" role="status">{{ denialNotice(PERMISSION.DELETE) }}</p>
          <div v-if="weaponParentFilter !== null" class="alert alert-info exercises-parent-filter" role="status">
            <span>Mostrando solo las relaciones del consumo {{ weaponParentFilter }}.</span>
            <button class="btn btn-sm btn-outline-primary" type="button" @click="weaponParentFilter = null">Quitar filtro</button>
          </div>
          <div class="exercises-toolbar">
            <div class="exercises-toolbar-field">
              <label class="form-label" for="weapon-search">Buscar</label>
              <input id="weapon-search" v-model="weaponSearch" class="form-control" type="search" autocomplete="off">
            </div>
            <div class="exercises-toolbar-field">
              <label class="form-label" for="weapon-sort">Ordenar por</label>
              <select id="weapon-sort" v-model="weaponSort" class="form-control exercises-sort"><option value="id_consumo_arma">ID</option><option value="consumo">Consumo</option><option value="arma">Arma</option></select>
            </div>
            <button class="btn btn-outline-secondary" type="button" :aria-pressed="weaponSortDesc" @click="weaponSortDesc = !weaponSortDesc">Orden descendente</button>
          </div>
          <p v-if="weaponListState === LOAD.READY" class="exercises-count" role="status">{{ weaponCountLabel }}</p>
          <div v-if="weaponListState === LOAD.LOADING" class="exercises-state" role="status">Cargando consumos por arma…</div>
          <div v-else-if="weaponListState === LOAD.ERROR || weaponListState === LOAD.DENIED" class="alert" :class="weaponListState === LOAD.DENIED ? 'alert-warning' : 'alert-danger'" role="alert"><p>{{ weaponListMessage?.text }}</p><button class="btn btn-outline-primary" type="button" @click="loadWeaponList">Reintentar lectura</button></div>
          <p v-else-if="weaponListState === LOAD.EMPTY" class="exercises-state" role="status">No hay relaciones de consumo por arma para este contexto.</p>
          <div v-else-if="weaponListState === LOAD.READY" class="table-responsive"><table class="table table-centered"><caption class="exercises-caption">Relaciones de consumo por arma de la institución activa</caption><thead><tr><th scope="col">ID relación</th><th scope="col">Consumo</th><th scope="col">Arma</th><th scope="col">Tiros</th><th scope="col">Observaciones</th><th scope="col">Acciones</th></tr></thead><tbody>
            <tr v-for="item in visibleWeapons" :key="item.id_consumo_arma"><td>{{ item.id_consumo_arma }}</td><td><RouterLink class="exercises-link-button" :to="{ path: '/tiro/consumos-municion', state: { munitionConsumptionId: item.consumo } }">{{ item.consumo }}</RouterLink></td><td><RouterLink :to="weaponHref(item.arma)">{{ item.arma }}</RouterLink></td><td>{{ item.cantidad_tiros }}</td><td>{{ display(item.observaciones) }}</td><td class="exercises-actions"><button class="btn btn-sm btn-outline-primary" type="button" @click="openWeaponDetail(item)">Ver</button><button class="btn btn-sm btn-outline-secondary" type="button" :disabled="!canUpdate || isMutationUncertain" :aria-describedby="canUpdate ? undefined : 'weapon-update-hint'" @click="openWeaponEdit(item)">Editar</button><button class="btn btn-sm btn-outline-danger" type="button" :disabled="!canDelete || isMutationUncertain" :aria-describedby="canDelete ? undefined : 'weapon-delete-hint'" @click="openWeaponDelete(item)">Eliminar</button></td></tr>
            <tr v-if="visibleWeapons.length === 0"><td colspan="6">No hay coincidencias en los registros cargados.</td></tr>
          </tbody></table></div>
        </div>
      </section>
    </template>

    <section v-else-if="screen === SCREEN.UNKNOWN" class="card"><div class="card-body"><h2 class="card-title">Ruta de ejercicios no reconocida</h2><p>La vista solo atiende `/tiro/ejercicios`, `/tiro/ejercicios/:idEjercicio`, `/tiro/consumos-municion` y `/tiro/consumos-arma`.</p></div></section>

    <DsModal :model-value="modalOpen" :title="modalTitle" :busy="modalBusy" modal-id="exercise-consumption-modal" @update:model-value="modalOpen = $event" @close="handleModalClose">
      <template #body>
        <div v-if="modalMessage" class="alert" :class="modalMessage.kind === MESSAGE.ERROR ? 'alert-danger' : modalMessage.kind === MESSAGE.WARNING ? 'alert-warning' : 'alert-info'" role="alert">{{ modalMessage.text }}</div>
        <div v-if="isMutationUncertain" class="alert alert-warning" role="alert">Las escrituras quedan bloqueadas hasta confirmar el estado actual del recurso.</div>

        <form v-if="modalKind === MODAL.EXERCISE_FORM" class="exercises-form" @submit.prevent="submitForm(originalExercise ? 'patch' : 'create')">
          <div class="exercises-editor-fields">
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="exercise-name">Nombre *</label><input id="exercise-name" v-model="exerciseDraft.nombre" class="form-control" required autocomplete="off" :aria-invalid="!!modalFieldError('nombre')" :aria-describedby="modalFieldError('nombre') ? 'exercise-name-error' : undefined" @input="clearFieldError('nombre')"><p v-if="modalFieldError('nombre')" id="exercise-name-error" class="invalid-feedback d-block">{{ modalFieldError('nombre') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="exercise-date">Fecha *</label><input id="exercise-date" v-model="exerciseDraft.fecha" class="form-control" type="date" required :aria-invalid="!!modalFieldError('fecha')" :aria-describedby="modalFieldError('fecha') ? 'exercise-date-error' : undefined" @input="clearFieldError('fecha')"><p v-if="modalFieldError('fecha')" id="exercise-date-error" class="invalid-feedback d-block">{{ modalFieldError('fecha') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="exercise-zone">Zona</label><input id="exercise-zone" v-model="exerciseDraft.zona" class="form-control" autocomplete="off" :aria-invalid="!!modalFieldError('zona')" :aria-describedby="modalFieldError('zona') ? 'exercise-zone-error' : undefined" @input="clearFieldError('zona')"><p v-if="modalFieldError('zona')" id="exercise-zone-error" class="invalid-feedback d-block">{{ modalFieldError('zona') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="exercise-type">Tipo de ejercicio</label><select id="exercise-type" v-model="exerciseDraft.tipo_ejercicio" class="form-select" :aria-invalid="!!modalFieldError('tipo_ejercicio')" :aria-describedby="modalFieldError('tipo_ejercicio') ? 'exercise-type-error' : undefined" @change="clearFieldError('tipo_ejercicio')"><option value="">Sin especificar</option><option v-for="[code, label] in TIPO_EJERCICIO_CHOICES" :key="code" :value="code">{{ label }}</option></select><p v-if="modalFieldError('tipo_ejercicio')" id="exercise-type-error" class="invalid-feedback d-block">{{ modalFieldError('tipo_ejercicio') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="exercise-order-number">Número de orden</label><input id="exercise-order-number" v-model="exerciseDraft.numero_orden" class="form-control" autocomplete="off" :aria-invalid="!!modalFieldError('numero_orden')" :aria-describedby="modalFieldError('numero_orden') ? 'exercise-order-number-error' : undefined" @input="clearFieldError('numero_orden')"><p v-if="modalFieldError('numero_orden')" id="exercise-order-number-error" class="invalid-feedback d-block">{{ modalFieldError('numero_orden') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="exercise-order-date">Fecha de orden</label><input id="exercise-order-date" v-model="exerciseDraft.fecha_orden" class="form-control" type="date" :aria-invalid="!!modalFieldError('fecha_orden')" :aria-describedby="modalFieldError('fecha_orden') ? 'exercise-order-date-error' : undefined" @input="clearFieldError('fecha_orden')"><p v-if="modalFieldError('fecha_orden')" id="exercise-order-date-error" class="invalid-feedback d-block">{{ modalFieldError('fecha_orden') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="exercise-participants">Unidades participantes</label><select id="exercise-participants" class="form-control" multiple :value="exerciseDraft.unidades_participantes_codes" :aria-invalid="!!modalFieldError('unidades_participantes_codes_write') || !!modalFieldError('unidades_participantes_codes')" :aria-describedby="(modalFieldError('unidades_participantes_codes_write') || modalFieldError('unidades_participantes_codes')) ? 'exercise-participants-error' : undefined" @change="updateParticipants"><option v-for="item in availableParticipantOptions()" :key="item.code" :value="item.code">{{ item.name ? `${item.code} — ${item.name}` : item.code }}</option></select><p class="form-text">El selector contiene unidades devueltas por el catálogo. Si no eliges ninguna, omito participantes y muestro únicamente la unidad efectiva devuelta por el servidor.</p><p v-if="unitOptionsState === LOAD.LOADING" class="exercises-muted" role="status">Consultando unidades asignables…</p><p v-else-if="unitOptionsMessage" class="invalid-feedback d-block" role="alert">{{ unitOptionsMessage.text }}</p><p v-if="modalFieldError('unidades_participantes_codes_write') || modalFieldError('unidades_participantes_codes')" id="exercise-participants-error" class="invalid-feedback d-block">{{ modalFieldError('unidades_participantes_codes_write') ?? modalFieldError('unidades_participantes_codes') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="exercise-observations">Observaciones</label><textarea id="exercise-observations" v-model="exerciseDraft.observaciones" class="form-control" rows="3" :aria-invalid="!!modalFieldError('observaciones')" :aria-describedby="modalFieldError('observaciones') ? 'exercise-observations-error' : undefined" @input="clearFieldError('observaciones')"></textarea><p v-if="modalFieldError('observaciones')" id="exercise-observations-error" class="invalid-feedback d-block">{{ modalFieldError('observaciones') }}</p></div>
          </div>
          <button class="exercises-submit-proxy" type="submit" aria-hidden="true" tabindex="-1">Enviar</button>
        </form>

        <form v-else-if="modalKind === MODAL.MUNITION_FORM" class="exercises-form" @submit.prevent="submitForm(originalMunition ? 'patch' : 'create')">
          <div class="exercises-editor-fields">
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="munition-exercise">Ejercicio *</label><select id="munition-exercise" v-model="munitionDraft.ejercicio" class="form-select" required :aria-invalid="!!modalFieldError('ejercicio')" :aria-describedby="modalFieldError('ejercicio') ? 'munition-exercise-error' : undefined" @change="clearFieldError('ejercicio')"><option value="">Selecciona un ejercicio devuelto</option><option v-for="item in activeExerciseOptions" :key="item.id_ejercicio" :value="String(item.id_ejercicio)">{{ catalogExerciseLabel(item) }}</option><option v-if="originalMunition && currentMunitionExerciseMissing()" :value="String(originalMunition.ejercicio)">Ejercicio {{ originalMunition.ejercicio }} · relación devuelta</option></select><p v-if="catalogExercisesState === LOAD.LOADING" class="exercises-muted" role="status">Consultando ejercicios…</p><p v-else-if="catalogExercisesMessage" class="invalid-feedback d-block" role="alert">{{ catalogExercisesMessage.text }}</p><p v-if="modalFieldError('ejercicio')" id="munition-exercise-error" class="invalid-feedback d-block">{{ modalFieldError('ejercicio') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="munition-weapon-type">Tipo de arma *</label><select id="munition-weapon-type" v-model="munitionDraft.tipo_arma" class="form-select" required :aria-invalid="!!modalFieldError('tipo_arma')" :aria-describedby="modalFieldError('tipo_arma') ? 'munition-weapon-type-error' : undefined" @change="clearFieldError('tipo_arma')"><option value="">Selecciona un tipo</option><option v-for="[code, label] in TIPO_ARMA_CHOICES" :key="code" :value="code">{{ label }}</option></select><p v-if="modalFieldError('tipo_arma')" id="munition-weapon-type-error" class="invalid-feedback d-block">{{ modalFieldError('tipo_arma') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="munition-model">Modelo de arma</label><input id="munition-model" v-model="munitionDraft.modelo_arma" class="form-control" autocomplete="off" :aria-invalid="!!modalFieldError('modelo_arma')" :aria-describedby="modalFieldError('modelo_arma') ? 'munition-model-error' : undefined" @input="clearFieldError('modelo_arma')"><p v-if="modalFieldError('modelo_arma')" id="munition-model-error" class="invalid-feedback d-block">{{ modalFieldError('modelo_arma') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="munition-calibre">Calibre</label><select id="munition-calibre" v-model="munitionDraft.calibre_code" class="form-select" :aria-invalid="!!modalFieldError('calibre_code_write')" :aria-describedby="modalFieldError('calibre_code_write') ? 'munition-calibre-error' : undefined" @change="clearFieldError('calibre_code_write')"><option value="">Sin calibre</option><option v-for="item in activeCalibreOptions" :key="item.id_calibre" :value="item.code">{{ item.code }} — {{ item.nombre }}</option><option v-if="originalMunition && originalMunition.calibre_code && !activeCalibreOptions.some((item) => item.code === originalMunition?.calibre_code)" :value="originalMunition.calibre_code" disabled>{{ originalMunition.calibre_code }} · no activo en catálogo devuelto</option></select><p v-if="catalogCalibresState === LOAD.LOADING" class="exercises-muted" role="status">Consultando calibres activos…</p><p v-else-if="catalogCalibresMessage" class="invalid-feedback d-block" role="alert">{{ catalogCalibresMessage.text }}</p><p v-if="modalFieldError('calibre_code_write')" id="munition-calibre-error" class="invalid-feedback d-block">{{ modalFieldError('calibre_code_write') }}</p><p class="form-text">El calibre solo se envía si se elige aquí; no lo deduzco del tipo ni del modelo.</p></div>
            <p v-if="!calibreCanReplace()" id="munition-replace-hint" class="form-text">El calibre devuelto no está en el catálogo activo: para reemplazar con todos los campos, elige un calibre activo o deja el campo sin calibre.</p>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="munition-weapons-count">Cantidad de armas</label><input id="munition-weapons-count" v-model="munitionDraft.cantidad_armas" class="form-control" type="number" min="0" step="1" inputmode="numeric" :aria-invalid="!!modalFieldError('cantidad_armas')" :aria-describedby="modalFieldError('cantidad_armas') ? 'munition-weapons-count-error' : undefined" @input="clearFieldError('cantidad_armas')"><p v-if="modalFieldError('cantidad_armas')" id="munition-weapons-count-error" class="invalid-feedback d-block">{{ modalFieldError('cantidad_armas') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="munition-shots">Cantidad de tiros *</label><input id="munition-shots" v-model="munitionDraft.cantidad_tiros" class="form-control" type="number" min="0" step="1" inputmode="numeric" required :aria-invalid="!!modalFieldError('cantidad_tiros')" :aria-describedby="modalFieldError('cantidad_tiros') ? 'munition-shots-error' : undefined" @input="clearFieldError('cantidad_tiros')"><p v-if="modalFieldError('cantidad_tiros')" id="munition-shots-error" class="invalid-feedback d-block">{{ modalFieldError('cantidad_tiros') }}</p></div>
            <label class="exercises-checkbox"><input v-model="munitionDraft.es_aproximado" type="checkbox" :aria-describedby="modalFieldError('es_aproximado') ? 'munition-approximate-error' : undefined" @change="clearFieldError('es_aproximado')"><span>Cantidad aproximada</span></label><p v-if="modalFieldError('es_aproximado')" id="munition-approximate-error" class="invalid-feedback d-block">{{ modalFieldError('es_aproximado') }}</p>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="munition-observations">Observaciones</label><textarea id="munition-observations" v-model="munitionDraft.observaciones" class="form-control" rows="3" :aria-invalid="!!modalFieldError('observaciones')" :aria-describedby="modalFieldError('observaciones') ? 'munition-observations-error' : undefined" @input="clearFieldError('observaciones')"></textarea><p v-if="modalFieldError('observaciones')" id="munition-observations-error" class="invalid-feedback d-block">{{ modalFieldError('observaciones') }}</p></div>
          </div>
          <button class="exercises-submit-proxy" type="submit" aria-hidden="true" tabindex="-1">Enviar</button>
        </form>

        <form v-else-if="modalKind === MODAL.WEAPON_FORM" class="exercises-form" @submit.prevent="submitForm(originalWeapon ? 'patch' : 'create')">
          <div class="exercises-editor-fields">
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="weapon-consumption">Consumo de munición *</label><select id="weapon-consumption" v-model="weaponDraft.consumo" class="form-select" required :aria-invalid="!!modalFieldError('consumo')" :aria-describedby="modalFieldError('consumo') ? 'weapon-consumption-error' : undefined" @change="clearFieldError('consumo')"><option value="">Selecciona un consumo devuelto</option><option v-for="item in activeMunitionOptions" :key="item.id_consumo" :value="String(item.id_consumo)">{{ catalogMunitionLabel(item) }}</option><option v-if="originalWeapon && currentMunitionChoiceMissing()" :value="String(originalWeapon.consumo)">Consumo {{ originalWeapon.consumo }} · relación devuelta</option></select><p v-if="catalogMunitionsState === LOAD.LOADING" class="exercises-muted" role="status">Consultando consumos accesibles…</p><p v-else-if="catalogMunitionsMessage" class="invalid-feedback d-block" role="alert">{{ catalogMunitionsMessage.text }}</p><p v-if="modalFieldError('consumo')" id="weapon-consumption-error" class="invalid-feedback d-block">{{ modalFieldError('consumo') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="weapon-id">Arma *</label><select id="weapon-id" v-model="weaponDraft.arma" class="form-select" required :aria-invalid="!!modalFieldError('arma')" :aria-describedby="modalFieldError('arma') ? 'weapon-id-error' : undefined" @change="clearFieldError('arma')"><option value="">Selecciona un arma devuelta</option><option v-for="item in activeWeaponOptions" :key="item.id_arma" :value="String(item.id_arma)">{{ catalogWeaponLabel(item) }}</option><option v-if="originalWeapon && currentWeaponChoiceMissing()" :value="String(originalWeapon.arma)">Arma {{ originalWeapon.arma }} · relación devuelta</option></select><p v-if="catalogWeaponsState === LOAD.LOADING" class="exercises-muted" role="status">Consultando armas accesibles…</p><p v-else-if="catalogWeaponsMessage" class="invalid-feedback d-block" role="alert">{{ catalogWeaponsMessage.text }}</p><p v-if="modalFieldError('arma')" id="weapon-id-error" class="invalid-feedback d-block">{{ modalFieldError('arma') }}</p><p class="form-text">La unicidad consumo+arma pertenece a esta relación. El formulario conserva sus valores si el servidor la rechaza.</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="weapon-shots">Cantidad de tiros *</label><input id="weapon-shots" v-model="weaponDraft.cantidad_tiros" class="form-control" type="number" min="0" step="1" inputmode="numeric" required :aria-invalid="!!modalFieldError('cantidad_tiros')" :aria-describedby="modalFieldError('cantidad_tiros') ? 'weapon-shots-error' : undefined" @input="clearFieldError('cantidad_tiros')"><p v-if="modalFieldError('cantidad_tiros')" id="weapon-shots-error" class="invalid-feedback d-block">{{ modalFieldError('cantidad_tiros') }}</p></div>
            <div class="mb-3 exercises-editor-field"><label class="form-label" for="weapon-observations">Observaciones</label><textarea id="weapon-observations" v-model="weaponDraft.observaciones" class="form-control" rows="3" :aria-invalid="!!modalFieldError('observaciones')" :aria-describedby="modalFieldError('observaciones') ? 'weapon-observations-error' : undefined" @input="clearFieldError('observaciones')"></textarea><p v-if="modalFieldError('observaciones')" id="weapon-observations-error" class="invalid-feedback d-block">{{ modalFieldError('observaciones') }}</p></div>
          </div>
          <button class="exercises-submit-proxy" type="submit" aria-hidden="true" tabindex="-1">Enviar</button>
        </form>

        <div v-else-if="modalKind === MODAL.EXERCISE_DELETE && deleteExerciseTarget" class="exercises-confirm-copy">
          <p>Vas a solicitar la baja del ejercicio <strong>{{ deleteExerciseTarget.nombre }}</strong>, fecha <strong>{{ deleteExerciseTarget.fecha }}</strong> e ID <strong>{{ deleteExerciseTarget.id_ejercicio }}</strong>.</p>
          <p>La confirmación no presupone que el servidor elimine consumos relacionados.</p>
        </div>
        <div v-else-if="modalKind === MODAL.MUNITION_DELETE && deleteMunitionTarget" class="exercises-confirm-copy">
          <p>Vas a solicitar la baja del consumo <strong>{{ deleteMunitionTarget.id_consumo }}</strong>, ejercicio <strong>{{ deleteMunitionTarget.ejercicio }}</strong>, tiros <strong>{{ deleteMunitionTarget.cantidad_tiros }}</strong> y cantidad de armas <strong>{{ display(deleteMunitionTarget.cantidad_armas) }}</strong>.</p>
        </div>
        <div v-else-if="modalKind === MODAL.WEAPON_DELETE && deleteWeaponTarget" class="exercises-confirm-copy">
          <p>Vas a solicitar la baja de la relación <strong>{{ deleteWeaponTarget.id_consumo_arma }}</strong>, consumo <strong>{{ deleteWeaponTarget.consumo }}</strong> y arma <strong>{{ deleteWeaponTarget.arma }}</strong>.</p>
        </div>

        <div v-else-if="modalKind === MODAL.MUNITION_DETAIL" class="exercises-detail-modal">
          <p v-if="modalLoading" class="exercises-state" role="status">Consultando el detalle del servidor…</p>
          <dl v-else-if="detailMunition" class="exercises-detail-grid">
            <div><dt>ID</dt><dd>{{ detailMunition.id_consumo }}</dd></div><div><dt>Ejercicio</dt><dd><RouterLink :to="`/tiro/ejercicios/${detailMunition.ejercicio}`">{{ detailMunition.ejercicio }}</RouterLink></dd></div>
            <div><dt>Tipo de arma</dt><dd>{{ weaponTypeLabel(detailMunition.tipo_arma) }}</dd></div><div><dt>Modelo</dt><dd>{{ display(detailMunition.modelo_arma) }}</dd></div>
            <div><dt>Calibre devuelto</dt><dd><RouterLink v-if="detailMunition.calibre_code" to="/almacen/calibres">{{ detailMunition.calibre_code }}</RouterLink><span v-else>—</span></dd></div><div><dt>Cantidad de armas</dt><dd>{{ display(detailMunition.cantidad_armas) }}</dd></div>
            <div><dt>Cantidad de tiros</dt><dd>{{ detailMunition.cantidad_tiros }}</dd></div><div><dt>Aproximado</dt><dd>{{ detailMunition.es_aproximado ? 'Sí' : 'No' }}</dd></div>
            <div class="exercises-detail-wide"><dt>Observaciones</dt><dd>{{ display(detailMunition.observaciones) }}</dd></div>
          </dl>
          <div v-if="detailMunition" class="exercises-actions"><RouterLink class="btn btn-outline-primary" :to="{ path: '/tiro/consumos-arma', state: { munitionConsumptionId: detailMunition.id_consumo } }">Abrir consumos por arma</RouterLink></div>
        </div>

        <div v-else-if="modalKind === MODAL.WEAPON_DETAIL" class="exercises-detail-modal">
          <p v-if="modalLoading" class="exercises-state" role="status">Consultando el detalle del servidor…</p>
          <dl v-else-if="detailWeapon" class="exercises-detail-grid">
            <div><dt>ID relación</dt><dd>{{ detailWeapon.id_consumo_arma }}</dd></div><div><dt>Consumo</dt><dd><RouterLink class="exercises-link-button" :to="{ path: '/tiro/consumos-municion', state: { munitionConsumptionId: detailWeapon.consumo } }">{{ detailWeapon.consumo }}</RouterLink></dd></div>
            <div><dt>Arma</dt><dd><RouterLink :to="weaponHref(detailWeapon.arma)">{{ detailWeapon.arma }}</RouterLink></dd></div><div><dt>Cantidad de tiros</dt><dd>{{ detailWeapon.cantidad_tiros }}</dd></div>
            <div class="exercises-detail-wide"><dt>Observaciones</dt><dd>{{ display(detailWeapon.observaciones) }}</dd></div>
          </dl>
        </div>
      </template>

      <template #footer>
        <button v-if="modalKind === MODAL.EXERCISE_FORM" class="btn btn-outline-secondary" type="button" :disabled="modalBusy" @click="closeModal">Cancelar</button>
        <template v-if="modalKind === MODAL.EXERCISE_FORM">
          <button v-if="!originalExercise" class="btn btn-primary" type="button" :disabled="!exerciseFormValid || !formCanSave('create')" @click="submitForm('create')">Crear</button>
          <template v-else>
            <button class="btn btn-outline-primary" type="button" :disabled="!exerciseFormValid || !formCanSave('put')" @click="submitForm('put')">Reemplazar con todos los campos</button>
            <button class="btn btn-primary" type="button" :disabled="!exerciseFormValid || !formCanSave('patch')" @click="submitForm('patch')">Guardar cambios</button>
          </template>
        </template>

        <button v-if="modalKind === MODAL.MUNITION_FORM" class="btn btn-outline-secondary" type="button" :disabled="modalBusy" @click="closeModal">Cancelar</button>
        <template v-if="modalKind === MODAL.MUNITION_FORM">
          <button v-if="!originalMunition" class="btn btn-primary" type="button" :disabled="!munitionFormValid || !formCanSave('create')" @click="submitForm('create')">Crear consumo</button>
          <template v-else>
            <button class="btn btn-outline-primary" type="button" :disabled="!munitionFormValid || !calibreCanReplace() || !formCanSave('put')" :aria-describedby="calibreCanReplace() ? undefined : 'munition-replace-hint'" @click="submitForm('put')">Reemplazar con todos los campos</button>
            <button class="btn btn-primary" type="button" :disabled="!munitionFormValid || !formCanSave('patch')" @click="submitForm('patch')">Guardar cambios</button>
          </template>
        </template>

        <button v-if="modalKind === MODAL.WEAPON_FORM" class="btn btn-outline-secondary" type="button" :disabled="modalBusy" @click="closeModal">Cancelar</button>
        <template v-if="modalKind === MODAL.WEAPON_FORM">
          <button v-if="!originalWeapon" class="btn btn-primary" type="button" :disabled="!weaponFormValid || !formCanSave('create')" @click="submitForm('create')">Crear relación</button>
          <template v-else>
            <button class="btn btn-outline-primary" type="button" :disabled="!weaponFormValid || !formCanSave('put')" @click="submitForm('put')">Reemplazar con todos los campos</button>
            <button class="btn btn-primary" type="button" :disabled="!weaponFormValid || !formCanSave('patch')" @click="submitForm('patch')">Guardar cambios</button>
          </template>
        </template>

        <button v-if="modalKind === MODAL.EXERCISE_DELETE" class="btn btn-outline-secondary" type="button" autofocus :disabled="modalBusy" @click="closeModal">Cancelar</button>
        <button v-if="modalKind === MODAL.EXERCISE_DELETE" class="btn btn-danger" type="button" :disabled="!deleteExerciseTarget || !canDelete || isMutationUncertain || modalBusy" @click="confirmExerciseDelete">Confirmar baja</button>
        <button v-if="modalKind === MODAL.MUNITION_DELETE" class="btn btn-outline-secondary" type="button" autofocus :disabled="modalBusy" @click="closeModal">Cancelar</button>
        <button v-if="modalKind === MODAL.MUNITION_DELETE" class="btn btn-danger" type="button" :disabled="!deleteMunitionTarget || !canDelete || isMutationUncertain || modalBusy" @click="confirmMunitionDelete">Confirmar baja</button>
        <button v-if="modalKind === MODAL.WEAPON_DELETE" class="btn btn-outline-secondary" type="button" autofocus :disabled="modalBusy" @click="closeModal">Cancelar</button>
        <button v-if="modalKind === MODAL.WEAPON_DELETE" class="btn btn-danger" type="button" :disabled="!deleteWeaponTarget || !canDelete || isMutationUncertain || modalBusy" @click="confirmWeaponDelete">Confirmar baja</button>
        <button v-if="modalKind === MODAL.MUNITION_DETAIL && detailMunition" class="btn btn-outline-secondary" type="button" @click="closeModal">Cerrar</button>
        <button v-if="modalKind === MODAL.WEAPON_DETAIL && detailWeapon" class="btn btn-outline-secondary" type="button" @click="closeModal">Cerrar</button>
      </template>
    </DsModal>
  </main>
</template>

<style scoped>
.exercises-view {
  min-width: 0;
}

.exercises-heading,
.exercises-card-header,
.exercises-actions,
.exercises-heading-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.exercises-heading {
  padding-bottom: 24px;
}

.exercises-title {
  color: var(--heading);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.1;
}

.exercises-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  color: var(--muted);
  font-size: 12.5px;
}

.exercises-breadcrumb a {
  color: var(--text);
}

.exercises-view .table a,
.exercises-detail-grid a {
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.exercises-breadcrumb a:hover,
.exercises-view .table a:hover,
.exercises-detail-grid a:hover {
  color: var(--primary-text);
}

.exercises-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.exercises-tabs a {
  padding: 8px 16px;
  border-bottom: 1px solid transparent;
  color: var(--muted);
  font-size: 13px;
}

.exercises-tabs a[aria-current="page"] {
  border-color: var(--primary);
  color: var(--primary-text);
}

.exercises-tabs a:focus-visible,
.exercises-view .table a:focus-visible,
.exercises-breadcrumb a:focus-visible,
.exercises-detail-grid a:focus-visible,
.exercises-link-button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px rgba(var(--primary-rgb), 1);
}

.exercises-view .card {
  min-width: 0;
  margin-bottom: 24px;
}

.exercises-view .card-title {
  margin-bottom: 12px;
  line-height: 19.8px;
}

/* ui-card.html anatomy for the exercise detail body (title + text, no .card-header). */
.exercises-view .card-body .card-text {
  margin-bottom: 10px;
  color: var(--bui-muted);
}

.exercises-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 12px;
}

.exercises-toolbar-field {
  display: flex;
  flex: 1 1 200px;
  flex-direction: column;
  min-width: 0;
}

.exercises-toolbar-field .form-label {
  margin: 0 0 6px;
}

.exercises-toolbar .btn {
  flex: 0 0 auto;
}

.exercises-sort {
  min-width: 140px;
}

.exercises-count {
  margin-bottom: 12px;
  color: var(--muted);
  font-size: 12.5px;
}

.exercises-state {
  padding: 8px 0;
  color: var(--muted);
}

.exercises-caption {
  padding: 8px 0;
  color: var(--muted);
  text-align: left;
}

.exercises-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 24px;
}

.exercises-detail-grid > div {
  min-width: 0;
}

.exercises-detail-grid dt {
  color: var(--muted);
  font-size: 12px;
}

.exercises-detail-grid dd {
  overflow-wrap: anywhere;
  color: var(--text);
}

.exercises-detail-wide {
  grid-column: 1 / -1;
}

.exercises-code-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.exercises-muted,
.exercises-view .form-text {
  color: var(--muted);
  font-size: 12px;
}

.exercises-related-body {
  display: grid;
  gap: 28px;
}

.exercises-related-body h3 {
  margin-bottom: 12px;
  font-size: 16px;
}

.exercises-view .table-responsive {
  min-width: 0;
  overflow-x: auto;
}

.exercises-actions {
  justify-content: flex-start;
}

.exercises-actions .btn {
  white-space: nowrap;
}

.exercises-link-button {
  padding: 0;
  color: var(--primary-text);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.exercises-notice p + p {
  margin-top: 6px;
}

.exercises-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: center;
  min-height: 42px;
}

.exercises-detail-modal .exercises-actions {
  margin-top: 20px;
}

.exercises-submit-proxy {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.exercises-view .btn:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px rgba(var(--primary-rgb), 1);
}

.exercises-view .btn:disabled {
  pointer-events: none;
  opacity: .65;
}

@media (max-width: 760px) {
  .exercises-detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .exercises-detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .exercises-detail-wide {
    grid-column: auto;
  }
}

/* DS block editor fields for the THREE Exercises editors (forms-basic field flow). */
.exercises-editor-fields {
  display: block;
}

.exercises-editor-field {
  min-width: 0;
}
</style>
