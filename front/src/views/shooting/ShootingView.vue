<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, shallowRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import DsModal from '../../components/shared/DsModal.vue'
import FormFeedback from '../../components/ds/FormFeedback.vue'
import { HttpRequestError } from '../../api/http'
import { getLessonSummary } from '../../api/dashboard'
import { SharedDomainApiError, createTemporaryPerson, getOrganizationUnitsLookup } from '../../api/shared/domain'
import { useSessionStore } from '../../stores/session'
import { SESSION_STATUS } from '../../types/session'
import type { ApiConnection, LessonSummary } from '../../types/dashboard'
import type { AccessFeedback } from '../../types/access-ui'
import type { OrganizationUnitDTO, TemporaryPersonCreateRequest } from '../../types/shared/domain'
import { PERMISSION_CODE, VIEW_GATE_LITERAL } from '../../permissions/catalog'
import { shootingHttpErrorMessage, shootingPayloadErrorMessage } from '../../features/shooting/error-message'
import {
  ShootingApiError,
  createShootingFraction,
  createShootingLesson,
  createShootingPolygon,
  createShootingResult,
  deleteShootingFraction,
  deleteShootingLesson,
  deleteShootingResult,
  getEligibleShooters,
  getFractionCaptureOptions,
  getFractionResultDetails,
  getLessonDetailedResults,
  getLessonFractions,
  getLessonReport,
  getLessonShooters,
  getPolygonLessons,
  getShootingFraction,
  getShootingLesson,
  getShootingLessons,
  getShootingPolygon,
  getShootingPolygons,
  getShootingResult,
  getShootingResults,
  patchShootingFraction,
  patchShootingLesson,
  patchShootingPolygon,
  patchShootingResult,
  updateShootingFraction,
  updateShootingLesson,
  updateShootingPolygon,
  updateShootingResult,
  type FractionCaptureOptionsDto,
  type LessonDetailedResultDto,
  type LessonReportDto,
  type ShootingFractionDto,
  type ShootingFractionResultDto,
  type ShootingFractionWrite,
  type ShootingLessonDto,
  type ShootingLessonWrite,
  type ShootingPolygonDto,
  type ShootingPolygonWrite,
  type ShootingResultDto,
  type ShootingResultWrite,
  type ShootingType,
  type ShootingUserDto,
} from '../../features/shooting/api'

const SCREEN = {
  POLYGONS: 'polygons',
  POLYGON: 'polygon',
  LESSONS: 'lessons',
  LESSON: 'lesson',
  FRACTION: 'fraction',
  CAPTURE: 'capture',
  UNKNOWN: 'unknown',
} as const

// Claves locales conservadas 1:1 (AC-7); los códigos provienen del catálogo
// compartido (única fuente, plan frontend-permission-navigation F5).
// ORGANIZATION_UNIT_READ es un literal del baseline que no es permission-code
// del catálogo backend (`apps/authorization/permissions.py`): se conserva tal
// cual, defecto reportado, no reinterpretado.
const PERMISSION = {
  VIEW_UNIT: PERMISSION_CODE.VIEW_UNIT,
  VIEW_PERSONNEL_BASIC: PERMISSION_CODE.VIEW_PERSONNEL_BASIC,
  CREATE_SHOOTING: PERMISSION_CODE.CREATE_SHOOTING_LESSONS,
  UPDATE_SHOOTING: PERMISSION_CODE.UPDATE_SHOOTING_LESSONS,
  DELETE_SHOOTING: PERMISSION_CODE.DELETE_SHOOTING_LESSONS,
  SCORE_SHOOTERS: PERMISSION_CODE.SCORE_SHOOTERS,
  CREATE_USERS: PERMISSION_CODE.CREATE_USERS,
  ORGANIZATION_UNIT_READ: VIEW_GATE_LITERAL.ORGANIZATION_UNIT_READ,
} as const

const LESSON_TAB = {
  FRACTIONS: 'fractions',
  SHOOTERS: 'shooters',
  RESULTS: 'results',
  SUMMARY: 'summary',
  REPORT: 'report',
} as const

const EDITOR_ENTITY = {
  POLYGON: 'polygon',
  LESSON: 'lesson',
  FRACTION: 'fraction',
  RESULT: 'result',
  TEMPORARY_PERSON: 'temporary-person',
} as const

const EDITOR_MODE = {
  CREATE: 'create',
  EDIT: 'edit',
} as const

const EDIT_METHOD = {
  PUT: 'PUT',
  PATCH: 'PATCH',
} as const

const AREA_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  EMPTY: 'empty',
  DENIED: 'denied',
  ERROR: 'error',
} as const

type Screen = (typeof SCREEN)[keyof typeof SCREEN]
type LessonTab = (typeof LESSON_TAB)[keyof typeof LESSON_TAB]
type EditorEntity = (typeof EDITOR_ENTITY)[keyof typeof EDITOR_ENTITY]
type EditorMode = (typeof EDITOR_MODE)[keyof typeof EDITOR_MODE]
type EditMethod = (typeof EDIT_METHOD)[keyof typeof EDIT_METHOD]
type AreaStatus = (typeof AREA_STATUS)[keyof typeof AREA_STATUS]
type MutablePartial<T> = { -readonly [Key in keyof T]?: T[Key] }
type StringDraftField = {
  [Key in keyof FormDraft]: FormDraft[Key] extends string ? Key : never
}[keyof FormDraft]

interface ReadState<T> {
  status: AreaStatus
  data: T | null
  error: string | null
  serverDenied: boolean
}

interface FormDraft {
  nombre: string
  ciudad: string
  carriles_maximos: string
  distancia_maxima: string
  id_poligono: string
  fecha_tiro: string
  numero_orden: string
  fecha_orden: string
  tipo_tiro: string
  cant_tiros_cereo: string
  cant_tiros_leccion: string
  distancia: string
  tiradores_totales: string
  numero_fraccion: string
  id_usuario: string
  id_arma: string
  tiros_acertados: string
  total_tiros: string
  numero_carril: string
  unidades_participantes_codes: string[]
  rut: string
  grado: string
  apellido_paterno: string
  apellido_materno: string
  organization_unit_code: string
}

interface FormSnapshot {
  nombre: string
  ciudad: string
  carriles_maximos: string
  distancia_maxima: string
  id_poligono: string
  fecha_tiro: string
  numero_orden: string
  fecha_orden: string
  tipo_tiro: string
  cant_tiros_cereo: string
  cant_tiros_leccion: string
  distancia: string
  tiradores_totales: string
  numero_fraccion: string
  id_usuario: string
  id_arma: string
  tiros_acertados: string
  total_tiros: string
  numero_carril: string
  unidades_participantes_codes: string[]
  rut: string
  grado: string
  apellido_paterno: string
  apellido_materno: string
  organization_unit_code: string
}

interface UnitSelectionOption {
  code: string
  label: string
}

interface RequestTicket {
  scope: string
  version: number
  generation: number
  identityId: number
  tenantCode: string
  unitCode: string
  routeKey: string
  resourceKey: string
  operation: string
  controller: AbortController
}

type DeleteTarget =
  | { kind: 'lesson'; id: number; label: string }
  | { kind: 'fraction'; id: number; lessonId: number; label: string }
  | { kind: 'result'; id: number; label: string }

function idleState<T>(): ReadState<T> {
  return { status: AREA_STATUS.IDLE, data: null, error: null, serverDenied: false }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function fieldValue(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const messages = value.filter((entry): entry is string => typeof entry === 'string')
    return messages.length > 0 ? messages.join(' ') : null
  }
  return null
}

function safeInteger(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? value : null
  }
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text) return null
  const parsed = Number(text)
  return Number.isSafeInteger(parsed) ? parsed : null
}

function safeRouteId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function fullName(user: ShootingUserDto): string {
  return [user.grado, user.nombre, user.apellido_paterno, user.apellido_materno]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(' ')
}

function newDraft(): FormDraft {
  return {
    nombre: '', ciudad: '', carriles_maximos: '', distancia_maxima: '',
    id_poligono: '', fecha_tiro: '', numero_orden: '', fecha_orden: '', tipo_tiro: '',
    cant_tiros_cereo: '', cant_tiros_leccion: '', distancia: '',
    tiradores_totales: '', numero_fraccion: '', id_usuario: '', id_arma: '',
    tiros_acertados: '', total_tiros: '', numero_carril: '',
    unidades_participantes_codes: [], rut: '', grado: '', apellido_paterno: '',
    apellido_materno: '', organization_unit_code: '',
  }
}

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const routeParts = computed(() => route.path.split('/').filter(Boolean))
const screen = computed<Screen>(() => {
  const path = route.path.replace(/\/$/, '')
  if (path === '/tiro/poligonos') return SCREEN.POLYGONS
  if (/^\/tiro\/poligonos\/\d+$/.test(path)) return SCREEN.POLYGON
  if (path === '/tiro/lecciones') return SCREEN.LESSONS
  if (/^\/tiro\/lecciones\/\d+$/.test(path)) return SCREEN.LESSON
  if (/^\/tiro\/lecciones\/\d+\/fracciones\/\d+$/.test(path)) return SCREEN.FRACTION
  if (/^\/tiro\/fracciones\/\d+\/resultados$/.test(path)) return SCREEN.CAPTURE
  return SCREEN.UNKNOWN
})

const polygonId = computed(() => safeRouteId(route.params.idPoligono))
const lessonId = computed(() => safeRouteId(route.params.idLeccion))
const fractionId = computed(() => safeRouteId(route.params.idFraccion))
const routeKey = computed(() => `${route.path}|${routeParts.value.join(':')}`)

const sessionEligible = computed(() => {
  const context = session.context
  const identity = session.identity
  const tenantCode = session.tenantCode.trim()
  const unitCode = session.unitCode.trim()
  const contextUnit = context?.active_organization_unit?.trim()
    || context?.unit_membership?.unit_code.trim()
    || ''

  return session.status === SESSION_STATUS.READY
    && !session.logoutBusy
    && !session.busy.context
    && !session.busy.selectUnit
    && !session.busy.login
    && session.uncertainMutation === null
    && context !== null
    && identity !== null
    && identity.must_change_password === false
    && context.user.must_change_password === false
    && Number.isSafeInteger(identity.id_usuario)
    && identity.id_usuario > 0
    && identity.id_usuario === context.user.id_usuario
    && Boolean(tenantCode)
    && context.tenant.code === tenantCode
    && Boolean(unitCode)
    && contextUnit === unitCode
}
)

const isMutationBusy = shallowRef(false)
const busyLabel = shallowRef('')
const uncertainOwner = shallowRef<number | null>(null)
const uncertainResource = shallowRef<string | null>(null)
const canReconcileCurrentResource = computed(() => (
  uncertainOwner.value !== null
  && uncertainOwner.value === session.identity?.id_usuario
  && uncertainResource.value === routeKey.value
))
const writesBlockedByUncertainty = computed(() => (
  uncertainOwner.value !== null
  && uncertainOwner.value === session.identity?.id_usuario
))

const allowed = (permission: string): boolean => (
  session.context?.permissions.includes(permission) === true
)
const canWrite = (permission: string): boolean => (
  sessionEligible.value && allowed(permission) && !writesBlockedByUncertainty.value && !isMutationBusy.value
)
const permissionHint = (permission: string): string => allowed(permission)
  ? 'La respuesta del backend sigue siendo la autoridad de acceso.'
  : `La sesión actual no incluye ${permission}. El backend conserva la autoridad final.`

// Motivo de denegación en lenguaje de usuario, visible junto al control y
// referenciado por aria-describedby (plan frontend-ux-corrections F2). El
// gating NO cambia: sólo se sustituye el patrón title-only con código de
// permiso por texto legible. permissionHint se conserva para el bloqueo de
// mutación en el modal (mensaje visible vigente).
const PERMISSION_NOTICE: Readonly<Record<string, string>> = {
  create_shooting_lessons: 'Se requiere permiso para crear sesiones de tiro',
  update_shooting_lessons: 'Se requiere permiso para actualizar sesiones de tiro',
  delete_shooting_lessons: 'Se requiere permiso para eliminar sesiones de tiro',
  score_shooters: 'Se requiere permiso para calificar tiradores',
  create_users: 'Se requiere permiso para dar de alta tiradores temporales',
  view_personnel_basic: 'Se requiere permiso para consultar el personal',
}

function permissionNotice(permission: string): string {
  const base = PERMISSION_NOTICE[permission] ?? 'La sesión actual no acredita el permiso requerido'
  return `${base}. El backend conserva la autoridad final.`
}

const polygonsState = shallowRef<ReadState<readonly ShootingPolygonDto[]>>(idleState())
const polygonOptionsState = shallowRef<ReadState<readonly ShootingPolygonDto[]>>(idleState())
const polygonState = shallowRef<ReadState<ShootingPolygonDto>>(idleState())
const polygonLessonsState = shallowRef<ReadState<readonly ShootingLessonDto[]>>(idleState())
const lessonsState = shallowRef<ReadState<readonly ShootingLessonDto[]>>(idleState())
const lessonState = shallowRef<ReadState<ShootingLessonDto>>(idleState())
const fractionsState = shallowRef<ReadState<readonly ShootingFractionDto[]>>(idleState())
const lessonShootersState = shallowRef<ReadState<readonly ShootingUserDto[]>>(idleState())
const eligibleShootersState = shallowRef<ReadState<readonly ShootingUserDto[]>>(idleState())
const lessonResultsState = shallowRef<ReadState<readonly LessonDetailedResultDto[]>>(idleState())
const summaryState = shallowRef<ReadState<LessonSummary>>(idleState())
const reportState = shallowRef<ReadState<LessonReportDto>>(idleState())
const organizationUnitsState = shallowRef<ReadState<readonly OrganizationUnitDTO[]>>(idleState())
const fractionState = shallowRef<ReadState<ShootingFractionDto>>(idleState())
const captureOptionsState = shallowRef<ReadState<FractionCaptureOptionsDto>>(idleState())
const fractionResultsState = shallowRef<ReadState<readonly ShootingFractionResultDto[]>>(idleState())
const captureResultsState = shallowRef<ReadState<readonly ShootingResultDto[]>>(idleState())
const resultPrefillState = shallowRef<ReadState<ShootingResultDto>>(idleState())

const activeTab = shallowRef<LessonTab>(LESSON_TAB.FRACTIONS)
const polygonSearch = shallowRef('')
const lessonSearch = shallowRef('')
const draft = reactive<FormDraft>(newDraft())
const baseline = shallowRef<FormSnapshot | null>(null)
const formFields = shallowRef<Record<string, string>>({})
const modalOpen = shallowRef(false)
const modalPurpose = shallowRef<'form' | 'delete' | null>(null)
const editorEntity = shallowRef<EditorEntity | null>(null)
const editorMode = shallowRef<EditorMode | null>(null)
const editorMethod = shallowRef<EditMethod>(EDIT_METHOD.PUT)
const deleteTarget = shallowRef<DeleteTarget | null>(null)
const editorFeedback = shallowRef<AccessFeedback | null>(null)
const temporaryFeedback = shallowRef<AccessFeedback | null>(null)
const mutationScope = shallowRef<string | null>(null)
const activeMutationTicket = shallowRef<RequestTicket | null>(null)

const editorTitle = computed(() => {
  if (modalPurpose.value === 'delete') return 'Confirmar eliminación'
  if (editorMode.value === EDITOR_MODE.CREATE) {
    if (editorEntity.value === EDITOR_ENTITY.POLYGON) return 'Crear polígono'
    if (editorEntity.value === EDITOR_ENTITY.LESSON) return 'Crear lección'
    if (editorEntity.value === EDITOR_ENTITY.FRACTION) return 'Crear fracción'
    if (editorEntity.value === EDITOR_ENTITY.TEMPORARY_PERSON) return 'Alta de tirador temporal'
    return 'Capturar resultado'
  }
  if (editorEntity.value === EDITOR_ENTITY.POLYGON) return 'Editar polígono'
  if (editorEntity.value === EDITOR_ENTITY.LESSON) return 'Editar lección'
  if (editorEntity.value === EDITOR_ENTITY.FRACTION) return 'Editar fracción'
  return 'Editar resultado'
})

const visiblePolygons = computed(() => {
  const query = polygonSearch.value.trim().toLocaleLowerCase()
  const items = polygonsState.value.data ?? []
  return [...items]
    .filter((item) => `${item.nombre} ${item.ciudad} ${item.id_poligono}`.toLocaleLowerCase().includes(query))
    .sort((left, right) => left.nombre.localeCompare(right.nombre, 'es'))
})

const visibleLessons = computed(() => {
  const query = lessonSearch.value.trim().toLocaleLowerCase()
  const items = lessonsState.value.data ?? []
  return [...items]
    .filter((item) => {
      const text = [item.id_leccion, item.id_poligono, item.fecha_tiro, item.tipo_tiro,
        ...item.unidades_participantes_codes].join(' ').toLocaleLowerCase()
      return text.includes(query)
    })
    .sort((left, right) => right.fecha_tiro.localeCompare(left.fecha_tiro)
      || right.id_leccion - left.id_leccion)
})

const polygonName = (id: number): string => {
  const fromOptions = polygonOptionsState.value.data?.find((item) => item.id_poligono === id)
  const fromList = polygonsState.value.data?.find((item) => item.id_poligono === id)
  const fromDetail = polygonState.value.data?.id_poligono === id ? polygonState.value.data : null
  return fromOptions?.nombre ?? fromList?.nombre ?? fromDetail?.nombre ?? `Polígono #${id}`
}

const organizationUnitOptions = computed<UnitSelectionOption[]>(() => (
  organizationUnitsState.value.data ?? []
).map((unit) => ({ code: unit.code, label: `${unit.name} · ${unit.code}` })))

const participantUnitOptions = computed<UnitSelectionOption[]>(() => {
  const options = [...organizationUnitOptions.value]
  const knownCodes = new Set(options.map((unit) => unit.code))
  for (const code of lessonState.value.data?.unidades_participantes_codes ?? []) {
    if (!knownCodes.has(code)) {
      options.push({ code, label: `${code} · asignada actualmente, no aparece en el lookup activo` })
      knownCodes.add(code)
    }
  }
  return options
})

function sameCodes(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const leftCodes = [...left].sort()
  const rightCodes = [...right].sort()
  return leftCodes.every((code, index) => code === rightCodes[index])
}

const percentage = (hits: number, total: number): string => (
  total === 0 ? '—' : `${(hits / total * 100).toFixed(1)}%`
)

const captureRows = computed(() => (captureResultsState.value.data ?? [])
  .filter((item) => item.id_fraccion === fractionId.value))

const report = computed(() => reportState.value.data)

const tabLabels: Record<LessonTab, string> = {
  [LESSON_TAB.FRACTIONS]: 'Fracciones',
  [LESSON_TAB.SHOOTERS]: 'Tiradores',
  [LESSON_TAB.RESULTS]: 'Resultados',
  [LESSON_TAB.SUMMARY]: 'Resumen',
  [LESSON_TAB.REPORT]: 'Reporte',
}

const routeTitle = computed(() => {
  if (screen.value === SCREEN.POLYGONS) return 'Polígonos de tiro'
  if (screen.value === SCREEN.POLYGON) return 'Ficha de polígono'
  if (screen.value === SCREEN.LESSONS) return 'Lecciones de tiro'
  if (screen.value === SCREEN.LESSON) return 'Ficha de lección'
  if (screen.value === SCREEN.FRACTION) return 'Ficha de fracción'
  if (screen.value === SCREEN.CAPTURE) return 'Captura de resultados'
  return 'Ruta de tiro no reconocida'
})

const requestVersions = new Map<string, number>()
const activeTickets = new Map<string, RequestTicket>()

function connectionFor(ticket: RequestTicket): ApiConnection {
  return {
    tenantCode: ticket.tenantCode,
    unitCode: ticket.unitCode,
    signal: ticket.controller.signal,
  }
}

function startTicket(scope: string, resourceKey = routeKey.value, operation = scope): RequestTicket | null {
  if (!sessionEligible.value || !session.identity) return null
  activeTickets.get(scope)?.controller.abort()
  const version = (requestVersions.get(scope) ?? 0) + 1
  requestVersions.set(scope, version)
  const ticket: RequestTicket = {
    scope,
    version,
    generation: session.generation,
    identityId: session.identity.id_usuario,
    tenantCode: session.tenantCode.trim(),
    unitCode: session.unitCode.trim(),
    routeKey: routeKey.value,
    resourceKey,
    operation,
    controller: new AbortController(),
  }
  activeTickets.set(scope, ticket)
  return ticket
}

function ticketCurrent(ticket: RequestTicket): boolean {
  return sessionEligible.value
    && session.generation === ticket.generation
    && session.identity?.id_usuario === ticket.identityId
    && session.tenantCode.trim() === ticket.tenantCode
    && session.unitCode.trim() === ticket.unitCode
    && routeKey.value === ticket.routeKey
    && requestVersions.get(ticket.scope) === ticket.version
    && activeTickets.get(ticket.scope) === ticket
    && !ticket.controller.signal.aborted
}

function invalidateTickets(): void {
  for (const ticket of activeTickets.values()) ticket.controller.abort()
  activeTickets.clear()
  for (const [scope, version] of requestVersions) requestVersions.set(scope, version + 1)
}

function markUncertain(ticket: RequestTicket): void {
  uncertainOwner.value = ticket.identityId
  uncertainResource.value = ticket.routeKey
}

function responseStatus(error: unknown): number | null {
  return error instanceof HttpRequestError ? error.status : null
}

function isUncertainMutationError(error: unknown): boolean {
  if (error instanceof ShootingApiError) return error.kind === 'schema'
  if (error instanceof SharedDomainApiError) return error.kind === 'schema'
  if (error instanceof HttpRequestError) {
    if (error.blockReason === 'missing-csrf') return false
    return error.kind === 'network' || error.status === null || error.status >= 500
  }
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpRequestError) return shootingHttpErrorMessage(error)
  if (error instanceof ShootingApiError) {
    return shootingPayloadErrorMessage(error.payload) ?? error.message
  }
  if (error instanceof SharedDomainApiError) return error.message
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
    return 'La solicitud se interrumpió antes de confirmar su respuesta.'
  }
  return 'No se pudo completar la solicitud al backend.'
}

function fieldErrors(error: unknown): Record<string, string> {
  const payload = error instanceof HttpRequestError ? error.payload : null
  if (!isRecord(payload)) return {}
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(payload)) {
    const message = fieldValue(value)
    if (message) {
      const field = key === 'unidades_participantes_codes_write'
        ? 'unidades_participantes_codes'
        : key
      result[field] = message
    }
  }
  return result
}

async function loadArea<T>(options: {
  scope: string
  permission: string
  resourceKey?: string
  state: { value: ReadState<T> }
  loader: (connection: ApiConnection) => Promise<T>
  isEmpty?: (value: T) => boolean
  reconcile?: boolean
}): Promise<T | null> {
  const { scope, permission, state, loader, isEmpty = () => false } = options
  if (!sessionEligible.value) return null
  if (!allowed(permission)) {
    state.value = {
      status: AREA_STATUS.DENIED,
      data: null,
      error: `La sesión actual no incluye ${permission}. La autorización final corresponde al backend.`,
      serverDenied: false,
    }
    return null
  }

  const ticket = startTicket(scope, options.resourceKey ?? routeKey.value, `GET ${scope}`)
  if (!ticket) return null
  state.value = { status: AREA_STATUS.LOADING, data: null, error: null, serverDenied: false }
  try {
    const data = await loader(connectionFor(ticket))
    if (!ticketCurrent(ticket)) return null
    state.value = {
      status: isEmpty(data) ? AREA_STATUS.EMPTY : AREA_STATUS.READY,
      data,
      error: null,
      serverDenied: false,
    }
    if (
      options.reconcile
      && uncertainOwner.value === ticket.identityId
      && uncertainResource.value === ticket.routeKey
    ) {
      uncertainOwner.value = null
      uncertainResource.value = null
    }
    return data
  } catch (error: unknown) {
    if (!ticketCurrent(ticket)) return null
    const status = responseStatus(error)
    state.value = {
      status: status === 403 ? AREA_STATUS.DENIED : AREA_STATUS.ERROR,
      data: null,
      error: errorMessage(error),
      serverDenied: status === 403,
    }
    return null
  } finally {
    if (activeTickets.get(scope) === ticket) activeTickets.delete(scope)
  }
}

function resetForm(): void {
  Object.assign(draft, newDraft())
  baseline.value = null
  formFields.value = {}
  editorFeedback.value = null
  editorMethod.value = EDIT_METHOD.PUT
}

function snapshotDraft(): FormSnapshot {
  return { ...draft, unidades_participantes_codes: [...draft.unidades_participantes_codes] }
}

function closeModal(afterConfirmedMutation = false): void {
  if (isMutationBusy.value && !afterConfirmedMutation) return
  modalOpen.value = false
  modalPurpose.value = null
  editorEntity.value = null
  editorMode.value = null
  deleteTarget.value = null
  mutationScope.value = null
  resetForm()
}

function clearViewState(): void {
  if (activeMutationTicket.value) markUncertain(activeMutationTicket.value)
  invalidateTickets()
  polygonsState.value = idleState()
  polygonOptionsState.value = idleState()
  polygonState.value = idleState()
  polygonLessonsState.value = idleState()
  lessonsState.value = idleState()
  lessonState.value = idleState()
  fractionsState.value = idleState()
  lessonShootersState.value = idleState()
  eligibleShootersState.value = idleState()
  lessonResultsState.value = idleState()
  summaryState.value = idleState()
  reportState.value = idleState()
  organizationUnitsState.value = idleState()
  fractionState.value = idleState()
  captureOptionsState.value = idleState()
  fractionResultsState.value = idleState()
  captureResultsState.value = idleState()
  resultPrefillState.value = idleState()
  temporaryFeedback.value = null
  activeTab.value = LESSON_TAB.FRACTIONS
  polygonSearch.value = ''
  lessonSearch.value = ''
  isMutationBusy.value = false
  busyLabel.value = ''
  activeMutationTicket.value = null
  if (modalOpen.value) closeModal()
}

function sessionGenerationChanged(): void {
  if (activeMutationTicket.value) markUncertain(activeMutationTicket.value)
  clearViewState()
  if (uncertainOwner.value !== null && uncertainOwner.value !== session.identity?.id_usuario) {
    uncertainOwner.value = null
    uncertainResource.value = null
  }
}

async function loadPolygons(reconcile = false): Promise<ShootingPolygonDto[] | null> {
  return loadArea({
    scope: 'polygons:list',
    permission: PERMISSION.VIEW_UNIT,
    state: polygonsState,
    loader: getShootingPolygons,
    isEmpty: (items) => items.length === 0,
    reconcile,
  }) as Promise<ShootingPolygonDto[] | null>
}

async function loadPolygonOptions(reconcile = false): Promise<readonly ShootingPolygonDto[] | null> {
  return loadArea({
    scope: 'polygons:options',
    permission: PERMISSION.VIEW_UNIT,
    state: polygonOptionsState,
    loader: getShootingPolygons,
    isEmpty: (items) => items.length === 0,
    reconcile,
  })
}

async function loadOrganizationUnitOptions(): Promise<readonly OrganizationUnitDTO[] | null> {
  return loadArea({
    scope: 'organization-units:lookup',
    permission: PERMISSION.ORGANIZATION_UNIT_READ,
    state: organizationUnitsState,
    loader: async (connection) => (await getOrganizationUnitsLookup(connection)).results,
    isEmpty: (items) => items.length === 0,
  })
}

async function loadPolygonDetail(reconcile = false): Promise<ShootingPolygonDto | null> {
  const id = polygonId.value
  if (id === null) {
    polygonState.value = { status: AREA_STATUS.ERROR, data: null, error: 'El parámetro idPoligono no es un ID válido.', serverDenied: false }
    return null
  }
  return loadArea({
    scope: `polygon:${id}`,
    permission: PERMISSION.VIEW_UNIT,
    state: polygonState,
    loader: (connection) => getShootingPolygon(id, connection),
    reconcile,
  })
}

async function loadPolygonLessons(reconcile = false): Promise<readonly ShootingLessonDto[] | null> {
  const id = polygonId.value
  if (id === null) return null
  return loadArea({
    scope: `polygon-lessons:${id}`,
    permission: PERMISSION.VIEW_UNIT,
    state: polygonLessonsState,
    loader: (connection) => getPolygonLessons(id, connection),
    isEmpty: (items) => items.length === 0,
    reconcile,
  })
}

async function loadLessons(reconcile = false): Promise<readonly ShootingLessonDto[] | null> {
  return loadArea({
    scope: 'lessons:list',
    permission: PERMISSION.VIEW_UNIT,
    state: lessonsState,
    loader: getShootingLessons,
    isEmpty: (items) => items.length === 0,
    reconcile,
  })
}

async function loadLessonDetail(reconcile = false): Promise<ShootingLessonDto | null> {
  const id = lessonId.value
  if (id === null) {
    lessonState.value = { status: AREA_STATUS.ERROR, data: null, error: 'El parámetro idLeccion no es un ID válido.', serverDenied: false }
    return null
  }
  return loadArea({
    scope: `lesson:${id}`,
    permission: PERMISSION.VIEW_UNIT,
    state: lessonState,
    loader: (connection) => getShootingLesson(id, connection),
    reconcile,
  })
}

async function loadLessonTab(tab: LessonTab, reconcile = false): Promise<void> {
  const id = lessonId.value
  if (id === null || lessonState.value.data?.id_leccion !== id) return
  if (tab === LESSON_TAB.FRACTIONS) {
    await loadArea({
      scope: `lesson-fractions:${id}`,
      permission: PERMISSION.VIEW_UNIT,
      state: fractionsState,
      loader: (connection) => getLessonFractions(id, connection),
      isEmpty: (items) => items.length === 0,
      reconcile,
    })
    return
  }
  if (tab === LESSON_TAB.SHOOTERS) {
    await loadArea({
      scope: `lesson-shooters:${id}`,
      permission: PERMISSION.VIEW_PERSONNEL_BASIC,
      state: lessonShootersState,
      loader: (connection) => getLessonShooters(id, connection),
      isEmpty: (items) => items.length === 0,
      reconcile,
    })
    return
  }
  if (tab === LESSON_TAB.RESULTS) {
    await loadArea({
      scope: `lesson-results:${id}`,
      permission: PERMISSION.VIEW_PERSONNEL_BASIC,
      state: lessonResultsState,
      loader: (connection) => getLessonDetailedResults(id, connection),
      isEmpty: (items) => items.length === 0,
      reconcile,
    })
    return
  }
  if (tab === LESSON_TAB.SUMMARY) {
    await loadArea({
      scope: `lesson-summary:${id}`,
      permission: PERMISSION.VIEW_UNIT,
      state: summaryState,
      loader: (connection) => getLessonSummary(id, connection),
      reconcile,
    })
    return
  }
  await loadArea({
    scope: `lesson-report:${id}`,
    permission: PERMISSION.VIEW_UNIT,
    state: reportState,
    loader: (connection) => getLessonReport(id, connection),
    reconcile,
  })
}

async function selectTab(tab: LessonTab): Promise<void> {
  activeTab.value = tab
  const stateByTab: Record<LessonTab, ReadState<unknown>> = {
    [LESSON_TAB.FRACTIONS]: fractionsState.value as ReadState<unknown>,
    [LESSON_TAB.SHOOTERS]: lessonShootersState.value as ReadState<unknown>,
    [LESSON_TAB.RESULTS]: lessonResultsState.value as ReadState<unknown>,
    [LESSON_TAB.SUMMARY]: summaryState.value as ReadState<unknown>,
    [LESSON_TAB.REPORT]: reportState.value as ReadState<unknown>,
  }
  if (stateByTab[tab].status === AREA_STATUS.IDLE || stateByTab[tab].status === AREA_STATUS.ERROR || stateByTab[tab].status === AREA_STATUS.DENIED) {
    await loadLessonTab(tab)
  }
}

async function loadEligibleShooterList(): Promise<void> {
  const id = lessonId.value
  if (id === null || lessonState.value.data?.id_leccion !== id) return
  await loadArea({
    scope: `lesson-eligible-shooters:${id}`,
    permission: PERMISSION.VIEW_PERSONNEL_BASIC,
    state: eligibleShootersState,
    loader: (connection) => getEligibleShooters(id, connection),
    isEmpty: (items) => items.length === 0,
  })
}

async function loadFractionDetail(reconcile = false): Promise<ShootingFractionDto | null> {
  const id = fractionId.value
  if (id === null) {
    fractionState.value = { status: AREA_STATUS.ERROR, data: null, error: 'El parámetro idFraccion no es un ID válido.', serverDenied: false }
    return null
  }
  const fraction = await loadArea({
    scope: `fraction:${id}`,
    permission: PERMISSION.VIEW_UNIT,
    state: fractionState,
    loader: (connection) => getShootingFraction(id, connection),
    reconcile,
  })
  if (!fraction) return null
  await Promise.all([
    loadFractionOptions(id, reconcile),
    loadFractionResults(id, reconcile),
  ])
  return fraction
}

async function loadFractionOptions(id: number, reconcile = false): Promise<FractionCaptureOptionsDto | null> {
  return loadArea({
    scope: `fraction-options:${id}`,
    permission: PERMISSION.VIEW_UNIT,
    state: captureOptionsState,
    loader: (connection) => getFractionCaptureOptions(id, connection),
    isEmpty: (value) => value.usuarios.length === 0 && value.armas.length === 0,
    reconcile,
  })
}

async function refreshTemporaryPersonOptions(fraction: number, personId: number): Promise<void> {
  const expectedRouteKey = routeKey.value
  const expectedGeneration = session.generation
  const expectedIdentityId = session.identity?.id_usuario
  const options = await loadFractionOptions(fraction, true)
  if (
    routeKey.value !== expectedRouteKey
    || screen.value !== SCREEN.CAPTURE
    || fractionId.value !== fraction
    || session.generation !== expectedGeneration
    || session.identity?.id_usuario !== expectedIdentityId
  ) return

  if (!options) {
    temporaryFeedback.value = {
      tone: 'warning',
      message: `El alta temporal #${personId} fue confirmada y no inicia sesión. La reconsulta de OP-FRC-007 no quedó disponible; no repitas el alta.`,
    }
    return
  }

  if (options.usuarios.some((user) => user.id_usuario === personId)) {
    temporaryFeedback.value = {
      tone: 'success',
      message: `Alta temporal #${personId} confirmada. No inicia sesión; OP-FRC-007 lo devolvió para esta captura.`,
    }
    return
  }

  temporaryFeedback.value = {
    tone: 'warning',
    message: `Alta temporal #${personId} confirmada y no inicia sesión. OP-FRC-007 no lo devolvió para esta fracción; no se añade al selector local.`,
  }
}

async function loadFractionResults(id: number, reconcile = false): Promise<readonly ShootingFractionResultDto[] | null> {
  return loadArea({
    scope: `fraction-results:${id}`,
    permission: PERMISSION.VIEW_PERSONNEL_BASIC,
    state: fractionResultsState,
    loader: (connection) => getFractionResultDetails(id, connection),
    isEmpty: (items) => items.length === 0,
    reconcile,
  })
}

async function loadCaptureRoute(reconcile = false): Promise<void> {
  const id = fractionId.value
  if (id === null) {
    fractionState.value = { status: AREA_STATUS.ERROR, data: null, error: 'El parámetro idFraccion no es un ID válido.', serverDenied: false }
    return
  }
  const fraction = await loadArea({
    scope: `capture-fraction:${id}`,
    permission: PERMISSION.VIEW_UNIT,
    state: fractionState,
    loader: (connection) => getShootingFraction(id, connection),
    reconcile,
  })
  if (!fraction) return
  await Promise.all([
    loadFractionOptions(id, reconcile),
    loadCaptureResults(id, reconcile),
  ])
}

async function loadCaptureResults(id = fractionId.value, reconcile = false): Promise<readonly ShootingResultDto[] | null> {
  if (id === null) return null
  return loadArea({
    scope: `capture-results:${id}`,
    permission: PERMISSION.VIEW_PERSONNEL_BASIC,
    state: captureResultsState,
    loader: getShootingResults,
    isEmpty: (items) => !items.some((item) => item.id_fraccion === id),
    reconcile,
  })
}

async function loadCurrentScreen(reconcile = false): Promise<void> {
  if (!sessionEligible.value) return
  if (screen.value === SCREEN.POLYGONS) {
    await loadPolygons(reconcile)
    return
  }
  if (screen.value === SCREEN.POLYGON) {
    await Promise.all([loadPolygonDetail(reconcile), loadPolygonLessons()])
    return
  }
  if (screen.value === SCREEN.LESSONS) {
    await loadLessons(reconcile)
    return
  }
  if (screen.value === SCREEN.LESSON) {
    const lesson = await loadLessonDetail(reconcile)
    if (lesson && lesson.id_leccion === lessonId.value) await loadLessonTab(activeTab.value, reconcile)
    return
  }
  if (screen.value === SCREEN.FRACTION) {
    await loadFractionDetail(reconcile)
    return
  }
  if (screen.value === SCREEN.CAPTURE) await loadCaptureRoute(reconcile)
}

async function reconcileCurrentResource(): Promise<void> {
  await loadCurrentScreen(true)
}

function startForm(entity: EditorEntity, mode: EditorMode): void {
  resetForm()
  editorEntity.value = entity
  editorMode.value = mode
  modalPurpose.value = 'form'
  modalOpen.value = true
}

function openPolygonEditor(item?: ShootingPolygonDto): void {
  startForm(EDITOR_ENTITY.POLYGON, item ? EDITOR_MODE.EDIT : EDITOR_MODE.CREATE)
  if (item) {
    Object.assign(draft, {
      nombre: item.nombre,
      ciudad: item.ciudad,
      carriles_maximos: String(item.carriles_maximos),
      distancia_maxima: String(item.distancia_maxima),
    })
    baseline.value = snapshotDraft()
  }
}

function openLessonEditor(item?: ShootingLessonDto): void {
  startForm(EDITOR_ENTITY.LESSON, item ? EDITOR_MODE.EDIT : EDITOR_MODE.CREATE)
  if (item) {
    Object.assign(draft, {
      id_poligono: String(item.id_poligono),
      fecha_tiro: item.fecha_tiro,
      numero_orden: item.numero_orden ?? '',
      fecha_orden: item.fecha_orden ?? '',
      tipo_tiro: item.tipo_tiro ?? '',
      cant_tiros_cereo: String(item.cant_tiros_cereo),
      cant_tiros_leccion: String(item.cant_tiros_leccion),
      distancia: String(item.distancia),
      unidades_participantes_codes: [...item.unidades_participantes_codes],
    })
    baseline.value = snapshotDraft()
  }
  void loadPolygonOptions()
  void loadOrganizationUnitOptions()
}

function openTemporaryPersonEditor(): void {
  temporaryFeedback.value = null
  startForm(EDITOR_ENTITY.TEMPORARY_PERSON, EDITOR_MODE.CREATE)
  void loadOrganizationUnitOptions()
}

function openFractionEditor(item?: ShootingFractionDto): void {
  startForm(EDITOR_ENTITY.FRACTION, item ? EDITOR_MODE.EDIT : EDITOR_MODE.CREATE)
  if (item) {
    Object.assign(draft, {
      tiradores_totales: String(item.tiradores_totales),
      numero_fraccion: String(item.numero_fraccion),
    })
    baseline.value = snapshotDraft()
  }
}

async function openResultEditor(item?: ShootingResultDto): Promise<void> {
  startForm(EDITOR_ENTITY.RESULT, item ? EDITOR_MODE.EDIT : EDITOR_MODE.CREATE)
  if (!item) return
  const id = item.id_resultado
  const result = await loadArea({
    scope: `result-prefill:${id}`,
    permission: PERMISSION.VIEW_PERSONNEL_BASIC,
    state: resultPrefillState,
    loader: (connection) => getShootingResult(id, connection),
  })
  if (!result || !modalOpen.value || editorEntity.value !== EDITOR_ENTITY.RESULT) return
  Object.assign(draft, {
    id_usuario: String(result.id_usuario),
    id_arma: String(result.id_arma),
    tiros_acertados: String(result.tiros_acertados),
    total_tiros: String(result.total_tiros),
    numero_carril: result.numero_carril === null ? '' : String(result.numero_carril),
  })
  baseline.value = snapshotDraft()
}

function openDelete(target: DeleteTarget): void {
  deleteTarget.value = target
  editorEntity.value = null
  editorMode.value = null
  modalPurpose.value = 'delete'
  editorFeedback.value = null
  modalOpen.value = true
}

function currentRequiredPermission(): string | null {
  if (editorEntity.value === EDITOR_ENTITY.POLYGON) {
    return editorMode.value === EDITOR_MODE.CREATE ? PERMISSION.CREATE_SHOOTING : PERMISSION.UPDATE_SHOOTING
  }
  if (editorEntity.value === EDITOR_ENTITY.LESSON) {
    return editorMode.value === EDITOR_MODE.CREATE ? PERMISSION.CREATE_SHOOTING : PERMISSION.UPDATE_SHOOTING
  }
  if (editorEntity.value === EDITOR_ENTITY.FRACTION) {
    return editorMode.value === EDITOR_MODE.CREATE ? PERMISSION.CREATE_SHOOTING : PERMISSION.UPDATE_SHOOTING
  }
  if (editorEntity.value === EDITOR_ENTITY.TEMPORARY_PERSON) return PERMISSION.CREATE_USERS
  return PERMISSION.SCORE_SHOOTERS
}

function setFormError(field: string, message: string): void {
  formFields.value = { ...formFields.value, [field]: message }
}

function validateEditor(): boolean {
  formFields.value = {}
  const required = (field: StringDraftField, label: string): boolean => {
    if (draft[field].trim()) return true
    setFormError(field, `${label} es obligatorio.`)
    return false
  }
  const integer = (field: StringDraftField, label: string): number | null => {
    const parsed = safeInteger(draft[field])
    if (parsed !== null) return parsed
    setFormError(field, `${label} debe ser un número entero válido.`)
    return null
  }

  let valid = true
  if (editorEntity.value === EDITOR_ENTITY.POLYGON) {
    valid = required('nombre', 'Nombre') && valid
    valid = required('ciudad', 'Ciudad') && valid
    valid = integer('carriles_maximos', 'Carriles máximos') !== null && valid
    valid = integer('distancia_maxima', 'Distancia máxima') !== null && valid
  } else if (editorEntity.value === EDITOR_ENTITY.LESSON) {
    valid = required('id_poligono', 'Polígono') && valid
    valid = required('fecha_tiro', 'Fecha de tiro') && valid
    valid = integer('cant_tiros_cereo', 'Tiros de cereo') !== null && valid
    valid = integer('cant_tiros_leccion', 'Tiros de lección') !== null && valid
    valid = integer('distancia', 'Distancia') !== null && valid
    if (draft.tipo_tiro && draft.tipo_tiro !== 'evaluacion' && draft.tipo_tiro !== 'entrenamiento') {
      setFormError('tipo_tiro', 'El tipo de tiro no pertenece a las opciones del contrato.')
      valid = false
    }
    if (draft.fecha_orden && !/^\d{4}-\d{2}-\d{2}$/.test(draft.fecha_orden)) {
      setFormError('fecha_orden', 'La fecha de orden debe usar el formato de fecha válido.')
      valid = false
    }
    const knownCodes = new Set([
      ...(organizationUnitsState.value.data ?? []).map((unit) => unit.code),
      ...(lessonState.value.data?.unidades_participantes_codes ?? []),
    ])
    if (draft.unidades_participantes_codes.some((code) => !knownCodes.has(code))) {
      setFormError('unidades_participantes_codes', 'Selecciona sólo unidades retornadas por el backend o ya asignadas a esta lección.')
      valid = false
    }
  } else if (editorEntity.value === EDITOR_ENTITY.FRACTION) {
    valid = integer('tiradores_totales', 'Tiradores totales') !== null && valid
    valid = integer('numero_fraccion', 'Número de fracción') !== null && valid
  } else if (editorEntity.value === EDITOR_ENTITY.RESULT) {
    valid = required('id_usuario', 'Tirador') && valid
    valid = required('id_arma', 'Arma') && valid
    valid = integer('tiros_acertados', 'Tiros acertados') !== null && valid
    valid = integer('total_tiros', 'Total de tiros') !== null && valid
    if (draft.numero_carril && safeInteger(draft.numero_carril) === null) {
      setFormError('numero_carril', 'El carril debe ser un número entero válido.')
      valid = false
    }
    const options = captureOptionsState.value.data
    if (options && !options.usuarios.some((user) => String(user.id_usuario) === draft.id_usuario)) {
      setFormError('id_usuario', 'Selecciona un tirador retornado por el backend para esta fracción.')
      valid = false
    }
    if (options && !options.armas.some((weapon) => String(weapon.id_arma) === draft.id_arma)) {
      setFormError('id_arma', 'Selecciona un arma retornada por el backend para esta fracción.')
      valid = false
    }
  } else if (editorEntity.value === EDITOR_ENTITY.TEMPORARY_PERSON) {
    valid = required('rut', 'RUT') && valid
    if (draft.organization_unit_code && !organizationUnitsState.value.data?.some(
      (unit) => unit.code === draft.organization_unit_code,
    )) {
      setFormError('organization_unit_code', 'Selecciona una unidad retornada por el backend o deja el campo vacío.')
      valid = false
    }
  }

  if (editorEntity.value === EDITOR_ENTITY.LESSON && polygonOptionsState.value.data) {
    const selectedId = safeInteger(draft.id_poligono)
    const actualIds = polygonOptionsState.value.data.map((item) => item.id_poligono)
    const currentLessonId = lessonState.value.data?.id_poligono
    if (selectedId === null || (!actualIds.includes(selectedId) && selectedId !== currentLessonId)) {
      setFormError('id_poligono', 'Selecciona un polígono retornado por el backend.')
      valid = false
    }
  } else if (editorEntity.value === EDITOR_ENTITY.LESSON && polygonOptionsState.value.status !== AREA_STATUS.READY && polygonOptionsState.value.status !== AREA_STATUS.EMPTY) {
    setFormError('id_poligono', 'La lista de polígonos reales todavía no está disponible.')
    valid = false
  }

  return valid
}

function polygonBody(): ShootingPolygonWrite | null {
  const carriles = safeInteger(draft.carriles_maximos)
  const distancia = safeInteger(draft.distancia_maxima)
  if (carriles === null || distancia === null) return null
  return {
    nombre: draft.nombre.trim(),
    ciudad: draft.ciudad.trim(),
    carriles_maximos: carriles,
    distancia_maxima: distancia,
  }
}

function lessonBody(): ShootingLessonWrite | null {
  const polygon = safeInteger(draft.id_poligono)
  const zeroingShots = safeInteger(draft.cant_tiros_cereo)
  const lessonShots = safeInteger(draft.cant_tiros_leccion)
  const distance = safeInteger(draft.distancia)
  if (polygon === null || zeroingShots === null || lessonShots === null || distance === null) return null
  const type: ShootingType | null = draft.tipo_tiro === 'evaluacion' || draft.tipo_tiro === 'entrenamiento'
    ? draft.tipo_tiro
    : null
  return {
    id_poligono: polygon,
    fecha_tiro: draft.fecha_tiro,
    numero_orden: draft.numero_orden.trim() || null,
    fecha_orden: draft.fecha_orden || null,
    tipo_tiro: type,
    cant_tiros_cereo: zeroingShots,
    cant_tiros_leccion: lessonShots,
    distancia: distance,
    ...(editorMode.value === EDITOR_MODE.EDIT || draft.unidades_participantes_codes.length > 0
      ? { unidades_participantes_codes_write: [...draft.unidades_participantes_codes] }
      : {}),
  }
}

function fractionBody(): ShootingFractionWrite | null {
  const currentLesson = lessonId.value ?? lessonState.value.data?.id_leccion
  const shooters = safeInteger(draft.tiradores_totales)
  const number = safeInteger(draft.numero_fraccion)
  if (currentLesson === null || currentLesson === undefined || shooters === null || number === null) return null
  return { id_leccion: currentLesson, tiradores_totales: shooters, numero_fraccion: number }
}

function resultBody(): ShootingResultWrite | null {
  const currentFraction = fractionId.value
  const user = safeInteger(draft.id_usuario)
  const weapon = safeInteger(draft.id_arma)
  const hits = safeInteger(draft.tiros_acertados)
  const shots = safeInteger(draft.total_tiros)
  const laneProvided = typeof draft.numero_carril === 'string' ? draft.numero_carril.trim().length > 0 : true
  const lane = laneProvided ? safeInteger(draft.numero_carril) : null
  if (currentFraction === null || user === null || weapon === null || hits === null || shots === null) return null
  if (laneProvided && lane === null) return null
  return {
    id_fraccion: currentFraction,
    id_usuario: user,
    id_arma: weapon,
    tiros_acertados: hits,
    total_tiros: shots,
    numero_carril: lane,
  }
}

function temporaryPersonBody(): TemporaryPersonCreateRequest | null {
  const rut = draft.rut.trim()
  if (!rut) return null
  return {
    rut,
    ...(draft.grado.trim() ? { grado: draft.grado.trim() } : {}),
    ...(draft.nombre.trim() ? { nombre: draft.nombre.trim() } : {}),
    ...(draft.apellido_paterno.trim() ? { apellido_paterno: draft.apellido_paterno.trim() } : {}),
    ...(draft.apellido_materno.trim() ? { apellido_materno: draft.apellido_materno.trim() } : {}),
    ...(draft.organization_unit_code ? { organization_unit_code: draft.organization_unit_code } : {}),
  }
}

function polygonPatch(body: ShootingPolygonWrite): MutablePartial<ShootingPolygonWrite> {
  const before = baseline.value
  if (!before) return body
  const patch: MutablePartial<ShootingPolygonWrite> = {}
  if (draft.nombre.trim() !== before.nombre) patch.nombre = body.nombre
  if (draft.ciudad.trim() !== before.ciudad) patch.ciudad = body.ciudad
  if (draft.carriles_maximos !== before.carriles_maximos) patch.carriles_maximos = body.carriles_maximos
  if (draft.distancia_maxima !== before.distancia_maxima) patch.distancia_maxima = body.distancia_maxima
  return patch
}

function lessonPatch(body: ShootingLessonWrite): MutablePartial<ShootingLessonWrite> {
  const before = baseline.value
  if (!before) return body
  const patch: MutablePartial<ShootingLessonWrite> = {}
  if (draft.id_poligono !== before.id_poligono) patch.id_poligono = body.id_poligono
  if (draft.fecha_tiro !== before.fecha_tiro) patch.fecha_tiro = body.fecha_tiro
  if ((draft.numero_orden.trim() || '') !== before.numero_orden) patch.numero_orden = body.numero_orden
  if ((draft.fecha_orden || '') !== before.fecha_orden) patch.fecha_orden = body.fecha_orden
  if ((draft.tipo_tiro || '') !== before.tipo_tiro) patch.tipo_tiro = body.tipo_tiro
  if (draft.cant_tiros_cereo !== before.cant_tiros_cereo) patch.cant_tiros_cereo = body.cant_tiros_cereo
  if (draft.cant_tiros_leccion !== before.cant_tiros_leccion) patch.cant_tiros_leccion = body.cant_tiros_leccion
  if (draft.distancia !== before.distancia) patch.distancia = body.distancia
  if (!sameCodes(draft.unidades_participantes_codes, before.unidades_participantes_codes)) {
    patch.unidades_participantes_codes_write = body.unidades_participantes_codes_write
  }
  return patch
}

function fractionPatch(body: ShootingFractionWrite): MutablePartial<ShootingFractionWrite> {
  const before = baseline.value
  if (!before) return body
  const patch: MutablePartial<ShootingFractionWrite> = {}
  if (draft.tiradores_totales !== before.tiradores_totales) patch.tiradores_totales = body.tiradores_totales
  if (draft.numero_fraccion !== before.numero_fraccion) patch.numero_fraccion = body.numero_fraccion
  if (lessonId.value !== null) patch.id_leccion = body.id_leccion
  return patch
}

function resultPatch(body: ShootingResultWrite): MutablePartial<ShootingResultWrite> {
  const before = baseline.value
  if (!before) return body
  const patch: MutablePartial<ShootingResultWrite> = {}
  if (draft.id_usuario !== before.id_usuario) patch.id_usuario = body.id_usuario
  if (draft.id_arma !== before.id_arma) patch.id_arma = body.id_arma
  if (draft.tiros_acertados !== before.tiros_acertados) patch.tiros_acertados = body.tiros_acertados
  if (draft.total_tiros !== before.total_tiros) patch.total_tiros = body.total_tiros
  if (draft.numero_carril !== before.numero_carril) patch.numero_carril = body.numero_carril
  return patch
}

function patchHasFields(value: object): boolean {
  return Object.keys(value).length > 0
}

function updatePolygonInCollections(item: ShootingPolygonDto): void {
  if (polygonsState.value.data) {
    const items = [...polygonsState.value.data]
    const index = items.findIndex((entry) => entry.id_poligono === item.id_poligono)
    if (index < 0) items.push(item)
    else items[index] = item
    polygonsState.value = { status: AREA_STATUS.READY, data: items, error: null, serverDenied: false }
  }
  if (polygonOptionsState.value.data) {
    const items = [...polygonOptionsState.value.data]
    const index = items.findIndex((entry) => entry.id_poligono === item.id_poligono)
    if (index < 0) items.push(item)
    else items[index] = item
    polygonOptionsState.value = { status: AREA_STATUS.READY, data: items, error: null, serverDenied: false }
  }
}

function updateLessonInCollections(item: ShootingLessonDto): void {
  if (lessonsState.value.data) {
    const items = [...lessonsState.value.data]
    const index = items.findIndex((entry) => entry.id_leccion === item.id_leccion)
    if (index < 0) items.push(item)
    else items[index] = item
    lessonsState.value = { status: AREA_STATUS.READY, data: items, error: null, serverDenied: false }
  }
  if (polygonLessonsState.value.data && item.id_poligono === polygonId.value) {
    const items = [...polygonLessonsState.value.data]
    const index = items.findIndex((entry) => entry.id_leccion === item.id_leccion)
    if (index < 0) items.push(item)
    else items[index] = item
    polygonLessonsState.value = { status: AREA_STATUS.READY, data: items, error: null, serverDenied: false }
  }
}

function mutationFailure(error: unknown, ticket: RequestTicket): void {
  if (!ticketCurrent(ticket)) {
    markUncertain(ticket)
    return
  }
  if (isUncertainMutationError(error)) {
    markUncertain(ticket)
    editorFeedback.value = {
      tone: 'warning',
      message: 'No se confirmó el resultado de la escritura. No la repitas; consulta el estado real del recurso.',
    }
    return
  }
  const errors = fieldErrors(error)
  if (Object.keys(errors).length > 0) formFields.value = errors
  editorFeedback.value = { tone: 'danger', message: errorMessage(error) }
}

async function runMutation<T>(options: {
  scope: string
  permission: string
  operation: string
  request: (connection: ApiConnection) => Promise<T>
  onSuccess: (value: T) => Promise<void> | void
}): Promise<void> {
  if (!canWrite(options.permission)) {
    editorFeedback.value = {
      tone: 'warning',
      message: writesBlockedByUncertainty.value
        ? 'Las escrituras están bloqueadas hasta reconciliar la respuesta anterior con una lectura explícita.'
        : permissionHint(options.permission),
    }
    return
  }
  const ticket = startTicket(options.scope, routeKey.value, options.operation)
  if (!ticket) return
  activeMutationTicket.value = ticket
  mutationScope.value = options.scope
  isMutationBusy.value = true
  busyLabel.value = 'Enviando al backend…'
  editorFeedback.value = null
  try {
    const result = await options.request(connectionFor(ticket))
    if (!ticketCurrent(ticket)) {
      markUncertain(ticket)
      return
    }
    await options.onSuccess(result)
    editorFeedback.value = { tone: 'success', message: 'El backend confirmó la operación.' }
  } catch (error: unknown) {
    mutationFailure(error, ticket)
  } finally {
    if (activeMutationTicket.value === ticket) {
      activeMutationTicket.value = null
      isMutationBusy.value = false
      busyLabel.value = ''
      mutationScope.value = null
    }
    if (activeTickets.get(options.scope) === ticket) activeTickets.delete(options.scope)
  }
}

async function saveEditor(): Promise<void> {
  if (!validateEditor()) {
    editorFeedback.value = { tone: 'danger', message: 'Revisa los campos señalados antes de enviar.' }
    return
  }
  if (editorEntity.value === EDITOR_ENTITY.POLYGON) {
    const body = polygonBody()
    if (!body) return
    const id = polygonState.value.data?.id_poligono ?? polygonId.value
    if (editorMode.value === EDITOR_MODE.CREATE) {
      await runMutation({
        scope: 'mutation:polygon:create', permission: PERMISSION.CREATE_SHOOTING, operation: 'POST /poligonos/',
        request: (connection) => createShootingPolygon(body, connection),
        onSuccess: (value) => {
          updatePolygonInCollections(value)
          polygonState.value = { status: AREA_STATUS.READY, data: value, error: null, serverDenied: false }
          closeModal(true)
        },
      })
      return
    }
    if (id === null) return
    const patch = polygonPatch(body)
    if (editorMethod.value === EDIT_METHOD.PATCH && !patchHasFields(patch)) {
      editorFeedback.value = { tone: 'info', message: 'No hay campos modificados para enviar con PATCH.' }
      return
    }
    await runMutation({
      scope: `mutation:polygon:${id}`, permission: PERMISSION.UPDATE_SHOOTING,
      operation: `${editorMethod.value} /poligonos/${id}/`,
      request: (connection) => editorMethod.value === EDIT_METHOD.PATCH
        ? patchShootingPolygon(id, patch, connection)
        : updateShootingPolygon(id, body, connection),
      onSuccess: (value) => {
        updatePolygonInCollections(value)
        polygonState.value = { status: AREA_STATUS.READY, data: value, error: null, serverDenied: false }
        closeModal(true)
      },
    })
    return
  }

  if (editorEntity.value === EDITOR_ENTITY.LESSON) {
    const body = lessonBody()
    if (!body) return
    const id = lessonState.value.data?.id_leccion ?? lessonId.value
    if (editorMode.value === EDITOR_MODE.CREATE) {
      await runMutation({
        scope: 'mutation:lesson:create', permission: PERMISSION.CREATE_SHOOTING, operation: 'POST /lecciones/',
        request: (connection) => createShootingLesson(body, connection),
        onSuccess: (value) => {
          updateLessonInCollections(value)
          closeModal(true)
        },
      })
      return
    }
    if (id === null) return
    const patch = lessonPatch(body)
    if (editorMethod.value === EDIT_METHOD.PATCH && !patchHasFields(patch)) {
      editorFeedback.value = { tone: 'info', message: 'No hay campos modificados para enviar con PATCH.' }
      return
    }
    await runMutation({
      scope: `mutation:lesson:${id}`, permission: PERMISSION.UPDATE_SHOOTING,
      operation: `${editorMethod.value} /lecciones/${id}/`,
      request: (connection) => editorMethod.value === EDIT_METHOD.PATCH
        ? patchShootingLesson(id, patch, connection)
        : updateShootingLesson(id, body, connection),
      onSuccess: (value) => {
        lessonState.value = { status: AREA_STATUS.READY, data: value, error: null, serverDenied: false }
        updateLessonInCollections(value)
        closeModal(true)
      },
    })
    return
  }

  if (editorEntity.value === EDITOR_ENTITY.FRACTION) {
    const body = fractionBody()
    if (!body) return
    const id = fractionState.value.data?.id_fraccion ?? fractionId.value
    if (editorMode.value === EDITOR_MODE.CREATE) {
      await runMutation({
        scope: 'mutation:fraction:create', permission: PERMISSION.CREATE_SHOOTING, operation: 'POST /fracciones/',
        request: (connection) => createShootingFraction(body, connection),
        onSuccess: async (value) => {
          if (fractionsState.value.data) {
            fractionsState.value = { status: AREA_STATUS.READY, data: [...fractionsState.value.data, value], error: null, serverDenied: false }
          }
          closeModal(true)
          if (lessonId.value !== null) await loadLessonTab(LESSON_TAB.FRACTIONS, true)
        },
      })
      return
    }
    if (id === null) return
    const patch = fractionPatch(body)
    if (editorMethod.value === EDIT_METHOD.PATCH && !patchHasFields(patch)) {
      editorFeedback.value = { tone: 'info', message: 'No hay campos modificados para enviar con PATCH.' }
      return
    }
    await runMutation({
      scope: `mutation:fraction:${id}`, permission: PERMISSION.UPDATE_SHOOTING,
      operation: `${editorMethod.value} /fracciones/${id}/`,
      request: (connection) => editorMethod.value === EDIT_METHOD.PATCH
        ? patchShootingFraction(id, patch, connection)
        : updateShootingFraction(id, body, connection),
      onSuccess: async (value) => {
        fractionState.value = { status: AREA_STATUS.READY, data: value, error: null, serverDenied: false }
        closeModal(true)
        if (lessonId.value !== null) await loadLessonTab(LESSON_TAB.FRACTIONS, true)
      },
    })
    return
  }

  if (editorEntity.value === EDITOR_ENTITY.TEMPORARY_PERSON) {
    const body = temporaryPersonBody()
    const fraction = fractionId.value
    if (!body || fraction === null) return
    await runMutation({
      scope: 'mutation:temporary-person:create',
      permission: PERMISSION.CREATE_USERS,
      operation: 'POST /usuarios/crear-temporal/',
      request: (connection) => createTemporaryPerson(body, connection),
      onSuccess: (person) => {
        closeModal(true)
        temporaryFeedback.value = {
          tone: 'info',
          message: `Alta temporal #${person.id_usuario} confirmada. No inicia sesión; consultando OP-FRC-007 de nuevo.`,
        }
        void refreshTemporaryPersonOptions(fraction, person.id_usuario)
      },
    })
    return
  }

  const body = resultBody()
  if (!body) return
  const id = resultPrefillState.value.data?.id_resultado
  if (editorMode.value === EDITOR_MODE.CREATE) {
    await runMutation({
      scope: 'mutation:result:create', permission: PERMISSION.SCORE_SHOOTERS, operation: 'POST /resultados/',
      request: (connection) => createShootingResult(body, connection),
      onSuccess: async () => {
        closeModal(true)
        if (fractionId.value !== null) await loadCaptureResults(fractionId.value, true)
      },
    })
    return
  }
  if (id === undefined) return
  const patch = resultPatch(body)
  if (editorMethod.value === EDIT_METHOD.PATCH && !patchHasFields(patch)) {
    editorFeedback.value = { tone: 'info', message: 'No hay campos modificados para enviar con PATCH.' }
    return
  }
  await runMutation({
    scope: `mutation:result:${id}`, permission: PERMISSION.SCORE_SHOOTERS,
    operation: `${editorMethod.value} /resultados/${id}/`,
    request: (connection) => editorMethod.value === EDIT_METHOD.PATCH
      ? patchShootingResult(id, patch, connection)
      : updateShootingResult(id, body, connection),
    onSuccess: async (value) => {
      resultPrefillState.value = { status: AREA_STATUS.READY, data: value, error: null, serverDenied: false }
      closeModal(true)
      if (fractionId.value !== null) await loadCaptureResults(fractionId.value, true)
    },
  })
}

function requiredPermissionForDelete(target: DeleteTarget): string {
  return target.kind === 'result' ? PERMISSION.SCORE_SHOOTERS : PERMISSION.DELETE_SHOOTING
}

async function confirmDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target) return
  const permission = requiredPermissionForDelete(target)
  const scope = `mutation:${target.kind}:${target.id}:delete`
  if (target.kind === 'lesson') {
    await runMutation({
      scope, permission, operation: `DELETE /lecciones/${target.id}/`,
      request: (connection) => deleteShootingLesson(target.id, connection),
      onSuccess: async () => {
        modalOpen.value = false
        modalPurpose.value = null
        deleteTarget.value = null
        await router.push('/tiro/lecciones')
      },
    })
    return
  }
  if (target.kind === 'fraction') {
    await runMutation({
      scope, permission, operation: `DELETE /fracciones/${target.id}/`,
      request: (connection) => deleteShootingFraction(target.id, connection),
      onSuccess: async () => {
        modalOpen.value = false
        modalPurpose.value = null
        deleteTarget.value = null
        if (screen.value === SCREEN.FRACTION) await router.push(`/tiro/lecciones/${target.lessonId}`)
        else if (lessonId.value !== null) await loadLessonTab(LESSON_TAB.FRACTIONS, true)
      },
    })
    return
  }
  await runMutation({
    scope, permission, operation: `DELETE /resultados/${target.id}/`,
    request: (connection) => deleteShootingResult(target.id, connection),
    onSuccess: async () => {
      modalOpen.value = false
      modalPurpose.value = null
      deleteTarget.value = null
      if (fractionId.value !== null) await loadCaptureResults(fractionId.value, true)
    },
  })
}

function formFieldError(name: string): string | null {
  return formFields.value[name] ?? null
}

const resultUserName = (id: number): string => {
  const user = captureOptionsState.value.data?.usuarios.find((item) => item.id_usuario === id)
  return user ? fullName(user) : `Usuario #${id}`
}

const resultWeaponName = (id: number): string => {
  const weapon = captureOptionsState.value.data?.armas.find((item) => item.id_arma === id)
  return weapon ? `${weapon.tipo_arma} · ${weapon.modelo_arma} · ${weapon.numero_serie}` : `Arma #${id}`
}

// La distancia del dominio se expresa en metros; sin valor real, placeholder.
function formatDistance(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : `${value} m`
}

function fieldClass(name: string): Record<string, boolean> {
  return { 'form-control': true, 'is-invalid': Boolean(formFieldError(name)) }
}

function selectClass(name: string): Record<string, boolean> {
  return { 'form-select': true, 'is-invalid': Boolean(formFieldError(name)) }
}

function fieldFeedbackId(name: string): string {
  return `shooting-field-${name}-error`
}

function tryReload(): void {
  void loadCurrentScreen(false)
}

watch(
  () => session.generation,
  sessionGenerationChanged,
  { flush: 'sync' },
)

watch(
  [routeKey, sessionEligible],
  ([, eligible], [previousRoute]) => {
    clearViewState()
    if (eligible) void loadCurrentScreen()
    if (previousRoute !== undefined && previousRoute !== routeKey.value) {
      uncertainResource.value = uncertainOwner.value === session.identity?.id_usuario
        ? uncertainResource.value
        : null
    }
  },
  { immediate: true, flush: 'sync' },
)

watch(
  () => session.identity?.id_usuario ?? null,
  (identityId) => {
    if (uncertainOwner.value !== null && uncertainOwner.value !== identityId) {
      uncertainOwner.value = null
      uncertainResource.value = null
    }
  },
  { flush: 'sync' },
)

onBeforeUnmount(() => {
  if (activeMutationTicket.value) markUncertain(activeMutationTicket.value)
  invalidateTickets()
})
</script>

<template>
  <main class="page-content shooting-view">
    <header class="shooting-heading">
      <div>
        <h1 class="shooting-title">{{ routeTitle }}</h1>
        <nav class="breadcrumb shooting-breadcrumb" aria-label="Ruta de navegación">
          <RouterLink to="/">Inicio</RouterLink>
          <span aria-hidden="true">›</span>
          <RouterLink to="/tiro/poligonos">Tiro</RouterLink>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{{ routeTitle }}</span>
        </nav>
      </div>
      <RouterLink v-if="screen === SCREEN.POLYGONS" class="btn btn-outline-primary" to="/tiro/lecciones">
        Lecciones
      </RouterLink>
      <RouterLink v-else-if="screen === SCREEN.LESSONS" class="btn btn-outline-primary" to="/tiro/poligonos">
        Polígonos
      </RouterLink>
      <button
        v-if="canReconcileCurrentResource"
        type="button"
        class="btn btn-warning"
        :disabled="isMutationBusy"
        @click="reconcileCurrentResource"
      >
        Consultar estado real
      </button>
    </header>

    <div v-if="writesBlockedByUncertainty" class="alert alert-warning" role="alert">
      La última escritura no tuvo respuesta confirmada. No la repitas. Las escrituras quedan bloqueadas hasta consultar el recurso indicado con «Consultar estado real».
    </div>

    <div v-if="!sessionEligible" class="card">
      <div class="card-body">
        <p class="shooting-state-title">Tiro no disponible</p>
        <p class="shooting-state-copy">La vista espera una sesión READY, contexto propio y unidad activa coherentes. No consulta la API ni solicita el contexto por su cuenta.</p>
      </div>
    </div>

    <template v-else>
      <section v-if="screen === SCREEN.POLYGONS" class="card polygons-list-card" aria-labelledby="polygons-heading">
        <div class="card-header">
          <h2 id="polygons-heading" class="card-title">Polígonos del contexto</h2>
          <p class="card-subtitle">La tabla contiene únicamente polígonos devueltos por el backend.</p>
        </div>
        <div class="card-body">
          <div class="shooting-actions">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!canWrite(PERMISSION.CREATE_SHOOTING)"
              :aria-describedby="allowed(PERMISSION.CREATE_SHOOTING) ? undefined : 'shooting-polygon-create-hint'"
              @click="openPolygonEditor()"
            >Crear polígono</button>
            <p v-if="!allowed(PERMISSION.CREATE_SHOOTING)" id="shooting-polygon-create-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.CREATE_SHOOTING) }}</p>
          </div>
          <div class="shooting-toolbar">
            <label class="form-label" for="polygon-search">Buscar en esta lista</label>
            <input id="polygon-search" v-model="polygonSearch" class="form-control" type="search" autocomplete="off">
            <button type="button" class="btn btn-outline-secondary" :disabled="polygonsState.status === AREA_STATUS.LOADING" @click="tryReload">Actualizar</button>
          </div>
          <div v-if="polygonsState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando polígonos…</div>
          <div v-else-if="polygonsState.status === AREA_STATUS.ERROR || polygonsState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert">
            <p>{{ polygonsState.error }}</p><button class="btn btn-outline-primary" type="button" @click="tryReload">Reintentar lectura</button>
          </div>
          <div v-else-if="polygonsState.status === AREA_STATUS.EMPTY" class="shooting-state" role="status">No hay polígonos devueltos para este contexto.</div>
          <div v-else-if="polygonsState.data" class="table-responsive">
            <table class="table table-centered">
              <caption class="shooting-caption">Polígonos de tiro</caption>
              <thead><tr><th scope="col">ID</th><th scope="col">Nombre</th><th scope="col">Ciudad</th><th scope="col">Carriles</th><th scope="col">Distancia máxima</th><th scope="col">Acción</th></tr></thead>
              <tbody>
                <tr v-for="item in visiblePolygons" :key="item.id_poligono">
                  <td>{{ item.id_poligono }}</td><td>{{ item.nombre }}</td><td>{{ item.ciudad }}</td>
                  <td>{{ item.carriles_maximos }}</td><td>{{ formatDistance(item.distancia_maxima) }}</td>
                  <td><RouterLink class="btn btn-sm btn-outline-primary" :to="`/tiro/poligonos/${item.id_poligono}`">Ver ficha</RouterLink></td>
                </tr>
                <tr v-if="visiblePolygons.length === 0"><td colspan="6">No hay coincidencias en los datos cargados.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section v-else-if="screen === SCREEN.POLYGON" class="shooting-stack">
        <div class="card polygon-detail-card">
          <div class="card-body">
            <h2 class="card-title">Datos del polígono</h2>
            <p class="card-text text-muted">Ficha cargada desde el ID de la ruta.</p>
            <div class="shooting-actions">
              <button type="button" class="btn btn-primary" :disabled="!canWrite(PERMISSION.UPDATE_SHOOTING) || !polygonState.data" :aria-describedby="allowed(PERMISSION.UPDATE_SHOOTING) ? undefined : 'shooting-polygon-update-hint'" @click="polygonState.data && openPolygonEditor(polygonState.data)">Editar</button>
              <p v-if="!allowed(PERMISSION.UPDATE_SHOOTING)" id="shooting-polygon-update-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.UPDATE_SHOOTING) }}</p>
            </div>
            <div v-if="polygonState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando ficha…</div>
            <div v-else-if="polygonState.status === AREA_STATUS.ERROR || polygonState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ polygonState.error }}</p><button class="btn btn-outline-primary" type="button" @click="loadPolygonDetail(false)">Reintentar lectura</button></div>
            <dl v-else-if="polygonState.data" class="shooting-detail-grid">
              <div><dt>ID</dt><dd>{{ polygonState.data.id_poligono }}</dd></div>
              <div><dt>Nombre</dt><dd>{{ polygonState.data.nombre }}</dd></div>
              <div><dt>Ciudad</dt><dd>{{ polygonState.data.ciudad }}</dd></div>
              <div><dt>Carriles máximos</dt><dd>{{ polygonState.data.carriles_maximos }}</dd></div>
              <div><dt>Distancia máxima</dt><dd>{{ formatDistance(polygonState.data.distancia_maxima) }}</dd></div>
              <div><dt>Tenant</dt><dd>{{ polygonState.data.tenant ?? '—' }}</dd></div>
              <div><dt>Unidad</dt><dd>{{ polygonState.data.organization_unit ?? '—' }}</dd></div>
            </dl>
            <div v-if="polygonState.data" class="shooting-actions">
              <RouterLink class="btn btn-primary" to="/tiro/lecciones">Ir a lecciones</RouterLink>
            </div>
          </div>
        </div>
        <div class="card polygon-lessons-relation-card">
          <div class="card-header"><h2 class="card-title">Lecciones del polígono</h2><p class="card-subtitle">Consulta independiente; se muestran sólo las filas retornadas.</p></div>
          <div class="card-body"><button class="btn btn-outline-secondary" type="button" :disabled="polygonLessonsState.status === AREA_STATUS.LOADING" @click="loadPolygonLessons(false)">Actualizar</button>
            <div v-if="polygonLessonsState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando lecciones…</div>
            <div v-else-if="polygonLessonsState.status === AREA_STATUS.ERROR || polygonLessonsState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ polygonLessonsState.error }}</p><button class="btn btn-outline-primary" type="button" @click="loadPolygonLessons(false)">Reintentar lectura</button></div>
            <p v-else-if="polygonLessonsState.status === AREA_STATUS.EMPTY" class="shooting-state" role="status">No hay lecciones devueltas para este polígono.</p>
            <div v-else-if="polygonLessonsState.data" class="table-responsive">
              <table class="table table-centered"><caption class="shooting-caption">Lecciones del polígono</caption><thead><tr><th scope="col">ID</th><th scope="col">Fecha</th><th scope="col">Tipo</th><th scope="col">Tiros</th><th scope="col">Distancia</th><th scope="col">Acción</th></tr></thead><tbody>
                <tr v-for="item in polygonLessonsState.data" :key="item.id_leccion"><td>{{ item.id_leccion }}</td><td>{{ item.fecha_tiro }}</td><td>{{ item.tipo_tiro ?? '—' }}</td><td>{{ item.cant_tiros_leccion }}</td><td>{{ formatDistance(item.distancia) }}</td><td><RouterLink class="btn btn-sm btn-outline-primary" :to="`/tiro/lecciones/${item.id_leccion}`">Ver lección</RouterLink></td></tr>
              </tbody></table>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="screen === SCREEN.LESSONS" class="card lessons-list-card" aria-labelledby="lessons-heading">
        <div class="card-header">
          <h2 id="lessons-heading" class="card-title">Lecciones visibles</h2>
          <p class="card-subtitle">El listado refleja el alcance que devolvió el backend; no representa una lista institucional completa.</p>
        </div>
        <div class="card-body">
          <div class="shooting-actions">
            <button type="button" class="btn btn-primary" :disabled="!canWrite(PERMISSION.CREATE_SHOOTING)" :aria-describedby="allowed(PERMISSION.CREATE_SHOOTING) ? undefined : 'shooting-lesson-create-hint'" @click="openLessonEditor()">Crear lección</button>
            <p v-if="!allowed(PERMISSION.CREATE_SHOOTING)" id="shooting-lesson-create-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.CREATE_SHOOTING) }}</p>
          </div>
          <div class="shooting-toolbar"><label class="form-label" for="lesson-search">Buscar en esta lista</label><input id="lesson-search" v-model="lessonSearch" class="form-control" type="search" autocomplete="off"><button class="btn btn-outline-secondary" type="button" :disabled="lessonsState.status === AREA_STATUS.LOADING" @click="tryReload">Actualizar</button></div>
          <div v-if="lessonsState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando lecciones…</div>
          <div v-else-if="lessonsState.status === AREA_STATUS.ERROR || lessonsState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ lessonsState.error }}</p><button class="btn btn-outline-primary" type="button" @click="tryReload">Reintentar lectura</button></div>
          <p v-else-if="lessonsState.status === AREA_STATUS.EMPTY" class="shooting-state" role="status">No hay lecciones devueltas para este contexto.</p>
          <div v-else-if="lessonsState.data" class="table-responsive">
            <table class="table table-centered"><caption class="shooting-caption">Lecciones visibles en el contexto actual</caption><thead><tr><th scope="col">ID</th><th scope="col">Polígono</th><th scope="col">Fecha</th><th scope="col">Tipo</th><th scope="col">Tiros</th><th scope="col">Distancia</th><th scope="col">Unidades participantes</th><th scope="col">Acción</th></tr></thead><tbody>
              <tr v-for="item in visibleLessons" :key="item.id_leccion"><td>{{ item.id_leccion }}</td><td><RouterLink :to="`/tiro/poligonos/${item.id_poligono}`">{{ polygonName(item.id_poligono) }}</RouterLink></td><td>{{ item.fecha_tiro }}</td><td>{{ item.tipo_tiro ?? '—' }}</td><td>{{ item.cant_tiros_leccion }}</td><td>{{ formatDistance(item.distancia) }}</td><td>{{ item.unidades_participantes_codes.join(', ') || '—' }}</td><td><RouterLink class="btn btn-sm btn-outline-primary" :to="`/tiro/lecciones/${item.id_leccion}`">Ver ficha</RouterLink></td></tr>
              <tr v-if="visibleLessons.length === 0"><td colspan="8">No hay coincidencias en los datos cargados.</td></tr>
            </tbody></table>
          </div>
        </div>
      </section>

      <section v-else-if="screen === SCREEN.LESSON" class="shooting-stack">
        <div class="card lesson-detail-card">
          <div class="card-body">
            <h2 class="card-title">Datos de la lección</h2>
            <p class="card-text text-muted">{{ lessonState.data ? `Lección ${lessonState.data.id_leccion} · ${lessonState.data.fecha_tiro}` : 'Ficha del recurso solicitado.' }}</p>
            <div class="shooting-actions"><button class="btn btn-primary" type="button" :disabled="!canWrite(PERMISSION.UPDATE_SHOOTING) || !lessonState.data" :aria-describedby="allowed(PERMISSION.UPDATE_SHOOTING) ? undefined : 'shooting-lesson-update-hint'" @click="lessonState.data && openLessonEditor(lessonState.data)">Editar</button><button class="btn btn-danger" type="button" :disabled="!canWrite(PERMISSION.DELETE_SHOOTING) || !lessonState.data" :aria-describedby="allowed(PERMISSION.DELETE_SHOOTING) ? undefined : 'shooting-lesson-delete-hint'" @click="lessonState.data && openDelete({ kind: 'lesson', id: lessonState.data.id_leccion, label: `Lección ${lessonState.data.id_leccion} · ${lessonState.data.fecha_tiro}` })">Eliminar lección</button><p v-if="!allowed(PERMISSION.UPDATE_SHOOTING)" id="shooting-lesson-update-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.UPDATE_SHOOTING) }}</p><p v-if="!allowed(PERMISSION.DELETE_SHOOTING)" id="shooting-lesson-delete-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.DELETE_SHOOTING) }}</p></div>
            <div v-if="lessonState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando ficha…</div>
            <div v-else-if="lessonState.status === AREA_STATUS.ERROR || lessonState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ lessonState.error }}</p><button class="btn btn-outline-primary" type="button" @click="loadLessonDetail(false)">Reintentar lectura</button></div>
            <dl v-else-if="lessonState.data" class="shooting-detail-grid">
              <div><dt>ID</dt><dd>{{ lessonState.data.id_leccion }}</dd></div><div><dt>Polígono</dt><dd><RouterLink :to="`/tiro/poligonos/${lessonState.data.id_poligono}`">{{ polygonName(lessonState.data.id_poligono) }}</RouterLink></dd></div><div><dt>Fecha de tiro</dt><dd>{{ lessonState.data.fecha_tiro }}</dd></div><div><dt>Tipo de tiro</dt><dd>{{ lessonState.data.tipo_tiro ?? '—' }}</dd></div><div><dt>Número de orden</dt><dd>{{ lessonState.data.numero_orden ?? '—' }}</dd></div><div><dt>Fecha de orden</dt><dd>{{ lessonState.data.fecha_orden ?? '—' }}</dd></div><div><dt>Tiros de cereo</dt><dd>{{ lessonState.data.cant_tiros_cereo }}</dd></div><div><dt>Tiros de lección</dt><dd>{{ lessonState.data.cant_tiros_leccion }}</dd></div><div><dt>Distancia</dt><dd>{{ formatDistance(lessonState.data.distancia) }}</dd></div><div><dt>Unidades participantes</dt><dd>{{ lessonState.data.unidades_participantes_codes.join(', ') || '—' }}</dd></div>
            </dl>
          </div>
        </div>

        <div class="card">
          <div class="card-body shooting-tab-body">
            <ul class="nav nav-tabs" role="tablist" aria-label="Datos de la lección">
              <li v-for="tab in Object.values(LESSON_TAB)" :key="tab" class="nav-item" role="presentation"><button class="nav-link" :class="{ active: activeTab === tab }" :id="`lesson-tab-${tab}-tab`" type="button" role="tab" :aria-selected="activeTab === tab" :aria-controls="`lesson-tab-${tab}`" @click="selectTab(tab)">{{ tabLabels[tab] }}</button></li>
            </ul>
            <div class="tab-content text-muted">
              <div :id="`lesson-tab-${activeTab}`" class="tab-pane show active" role="tabpanel" :aria-labelledby="`lesson-tab-${activeTab}-tab`">
              <template v-if="activeTab === LESSON_TAB.FRACTIONS">
                <div class="shooting-panel-heading"><div><h3 class="card-title">Fracciones de la lección</h3><p class="card-subtitle">Esta tabla no mezcla datos de resultados.</p></div><button class="btn btn-primary" type="button" :disabled="!canWrite(PERMISSION.CREATE_SHOOTING) || !lessonState.data" :aria-describedby="allowed(PERMISSION.CREATE_SHOOTING) ? undefined : 'shooting-fraction-create-hint'" @click="openFractionEditor()">Crear fracción</button></div><p v-if="!allowed(PERMISSION.CREATE_SHOOTING)" id="shooting-fraction-create-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.CREATE_SHOOTING) }}</p><p v-if="!allowed(PERMISSION.UPDATE_SHOOTING)" id="shooting-fraction-update-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.UPDATE_SHOOTING) }}</p><p v-if="!allowed(PERMISSION.DELETE_SHOOTING)" id="shooting-fraction-delete-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.DELETE_SHOOTING) }}</p>
                <div v-if="fractionsState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando fracciones…</div>
                <div v-else-if="fractionsState.status === AREA_STATUS.ERROR || fractionsState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ fractionsState.error }}</p><button class="btn btn-outline-primary" type="button" @click="loadLessonTab(LESSON_TAB.FRACTIONS)">Reintentar pestaña</button></div>
                <p v-else-if="fractionsState.status === AREA_STATUS.EMPTY" class="shooting-state" role="status">Esta lección no tiene fracciones devueltas.</p>
                <div v-else-if="fractionsState.data" class="table-responsive"><table class="table table-centered"><caption class="shooting-caption">Fracciones de la lección</caption><thead><tr><th scope="col">Fracción</th><th scope="col">Tiradores totales</th><th scope="col">Acciones</th></tr></thead><tbody>
                  <tr v-for="item in fractionsState.data" :key="item.id_fraccion"><td><RouterLink :to="`/tiro/lecciones/${item.id_leccion}/fracciones/${item.id_fraccion}`">{{ item.numero_fraccion }}</RouterLink></td><td>{{ item.tiradores_totales }}</td><td class="shooting-actions"><RouterLink class="btn btn-sm btn-outline-primary" :to="`/tiro/lecciones/${item.id_leccion}/fracciones/${item.id_fraccion}`">Ver ficha</RouterLink><button class="btn btn-sm btn-outline-secondary" type="button" :disabled="!canWrite(PERMISSION.UPDATE_SHOOTING)" :aria-describedby="allowed(PERMISSION.UPDATE_SHOOTING) ? undefined : 'shooting-fraction-update-hint'" @click="openFractionEditor(item)">Editar</button><button class="btn btn-sm btn-outline-danger" type="button" :disabled="!canWrite(PERMISSION.DELETE_SHOOTING)" :aria-describedby="allowed(PERMISSION.DELETE_SHOOTING) ? undefined : 'shooting-fraction-delete-hint'" @click="openDelete({ kind: 'fraction', id: item.id_fraccion, lessonId: item.id_leccion, label: `Fracción ${item.numero_fraccion}` })">Eliminar</button></td></tr>
                </tbody></table></div>
              </template>

              <template v-else-if="activeTab === LESSON_TAB.SHOOTERS">
                <h3 class="card-title">Tiradores con resultados</h3>
                <div v-if="lessonShootersState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando tiradores…</div>
                <div v-else-if="lessonShootersState.status === AREA_STATUS.ERROR || lessonShootersState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ lessonShootersState.error }}</p><button class="btn btn-outline-primary" type="button" @click="loadLessonTab(LESSON_TAB.SHOOTERS)">Reintentar pestaña</button></div>
                <p v-else-if="lessonShootersState.status === AREA_STATUS.EMPTY" class="shooting-state" role="status">La consulta no devolvió tiradores con resultados.</p>
                <div v-else-if="lessonShootersState.data" class="table-responsive"><table class="table table-centered"><caption class="shooting-caption">Tiradores con resultados en esta lección</caption><thead><tr><th scope="col">RUT</th><th scope="col">Grado</th><th scope="col">Nombre</th><th scope="col">Unidad</th></tr></thead><tbody><tr v-for="user in lessonShootersState.data" :key="user.id_usuario"><td>{{ user.rut }}</td><td>{{ user.grado ?? '—' }}</td><td>{{ fullName(user) }}</td><td>{{ user.primary_assignment?.unit_code ?? '—' }}</td></tr></tbody></table></div>
                <div class="shooting-inline-action"><button class="btn btn-outline-primary" type="button" :disabled="eligibleShootersState.status === AREA_STATUS.LOADING || !allowed(PERMISSION.VIEW_PERSONNEL_BASIC)" :aria-describedby="allowed(PERMISSION.VIEW_PERSONNEL_BASIC) ? undefined : 'shooting-personnel-hint'" @click="loadEligibleShooterList">Consultar tiradores elegibles</button><span>La respuesta se presenta como lectura; no hay una API disponible para escribir unidades participantes desde esta vista.</span></div><p v-if="!allowed(PERMISSION.VIEW_PERSONNEL_BASIC)" id="shooting-personnel-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.VIEW_PERSONNEL_BASIC) }}</p>
                <div v-if="eligibleShootersState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Consultando tiradores elegibles…</div>
                <div v-else-if="eligibleShootersState.status === AREA_STATUS.ERROR || eligibleShootersState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert">{{ eligibleShootersState.error }}</div>
                <p v-else-if="eligibleShootersState.status === AREA_STATUS.EMPTY" class="shooting-state" role="status">El backend no devolvió tiradores elegibles.</p>
                <ul v-else-if="eligibleShootersState.data" class="list-group shooting-eligible-list"><li v-for="user in eligibleShootersState.data" :key="user.id_usuario" class="list-group-item">{{ fullName(user) }} · {{ user.rut }} · {{ user.primary_assignment?.unit_code ?? '—' }}</li></ul>
              </template>

              <template v-else-if="activeTab === LESSON_TAB.RESULTS">
                <h3 class="card-title">Resultados detallados</h3>
                <div v-if="lessonResultsState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando resultados detallados…</div>
                <div v-else-if="lessonResultsState.status === AREA_STATUS.DENIED && lessonResultsState.serverDenied" class="alert alert-warning" role="alert"><p>Sin permiso de detalle: {{ lessonResultsState.error }}</p><p>Resumen y reporte siguen siendo consultas independientes; no sustituyen esta tabla.</p><div class="shooting-actions"><button class="btn btn-outline-primary" type="button" @click="selectTab(LESSON_TAB.SUMMARY)">Abrir resumen</button><button class="btn btn-outline-primary" type="button" @click="selectTab(LESSON_TAB.REPORT)">Abrir reporte</button></div></div>
                <div v-else-if="lessonResultsState.status === AREA_STATUS.ERROR || lessonResultsState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ lessonResultsState.error }}</p><button class="btn btn-outline-primary" type="button" @click="loadLessonTab(LESSON_TAB.RESULTS)">Reintentar pestaña</button></div>
                <p v-else-if="lessonResultsState.status === AREA_STATUS.EMPTY" class="shooting-state" role="status">No hay resultados detallados devueltos para esta lección.</p>
                <div v-else-if="lessonResultsState.data" class="table-responsive"><table class="table table-centered"><caption class="shooting-caption">Resultados individuales de la lección</caption><thead><tr><th scope="col">RUT</th><th scope="col">Grado</th><th scope="col">Tirador</th><th scope="col">Unidad</th><th scope="col">Arma</th><th scope="col">Carril</th><th scope="col">Acertados</th><th scope="col">Total</th></tr></thead><tbody><tr v-for="(item, index) in lessonResultsState.data" :key="`${item.RUT}-${index}`"><td>{{ item.RUT }}</td><td>{{ item.Grado ?? '—' }}</td><td>{{ [item.Nombre, item.Apellido_paterno, item.Apellido_materno].filter(Boolean).join(' ') }}</td><td>{{ item.Unidad }}</td><td>{{ [item['Tipo Arma'], item['Modelo de Arma'], item['Número de Serie']].filter(Boolean).join(' · ') || '—' }}</td><td>{{ item.Carril ?? '—' }}</td><td>{{ item['Tiros Acertados'] }}</td><td>{{ item['Total Tiros'] }}</td></tr></tbody></table></div>
              </template>

              <template v-else-if="activeTab === LESSON_TAB.SUMMARY">
                <h3 class="card-title">Resumen de {{ lessonState.data?.fecha_tiro ?? `lección ${lessonId}` }}</h3>
                <div v-if="summaryState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando resumen…</div>
                <div v-else-if="summaryState.status === AREA_STATUS.ERROR || summaryState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ summaryState.error }}</p><button class="btn btn-outline-primary" type="button" @click="loadLessonTab(LESSON_TAB.SUMMARY)">Reintentar pestaña</button></div>
                <p v-else-if="summaryState.status === AREA_STATUS.EMPTY" class="shooting-state" role="status">No hay resumen devuelto.</p>
                <dl v-else-if="summaryState.data" class="shooting-metric-grid"><div class="card shooting-metric"><dt>Fracciones · lección {{ summaryState.data.id_leccion }}</dt><dd>{{ summaryState.data.fracciones }}</dd></div><div class="card shooting-metric"><dt>Tiradores únicos · lección {{ summaryState.data.id_leccion }}</dt><dd>{{ summaryState.data.tiradores_unicos }}</dd></div><div class="card shooting-metric"><dt>Tiros acertados · lección {{ summaryState.data.id_leccion }}</dt><dd>{{ summaryState.data.tiros_acertados_total }}</dd></div><div class="card shooting-metric"><dt>Tiros totales · lección {{ summaryState.data.id_leccion }}</dt><dd>{{ summaryState.data.tiros_total }}</dd></div><div class="card shooting-metric"><dt>Porcentaje de acierto · lección {{ summaryState.data.id_leccion }}</dt><dd>{{ percentage(summaryState.data.tiros_acertados_total, summaryState.data.tiros_total) }}</dd></div></dl>
              </template>

              <template v-else>
                <h3 class="card-title">Reporte de {{ report?.leccion.fecha_tiro ?? `lección ${lessonId}` }}</h3>
                <div v-if="reportState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando reporte…</div>
                <div v-else-if="reportState.status === AREA_STATUS.ERROR || reportState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ reportState.error }}</p><button class="btn btn-outline-primary" type="button" @click="loadLessonTab(LESSON_TAB.REPORT)">Reintentar pestaña</button></div>
                <template v-else-if="report">
                  <div class="shooting-report-summary"><p><strong>Lección {{ report.leccion.id_leccion }}</strong> · {{ report.leccion.fecha_tiro }} · {{ report.leccion.tipo_tiro ?? '—' }}</p><p>Tiradores: {{ report.resumen.total_tiradores }} · Disparos: {{ report.resumen.total_disparos }} · Acertados: {{ report.resumen.total_acertados }} · Acierto: {{ percentage(report.resumen.total_acertados, report.resumen.total_disparos) }}</p><p>Fracciones: {{ report.resumen.fracciones_count }} · Armas: {{ report.resumen.armas_count }} · Unidades: {{ report.resumen.unidades_count }}</p></div>
                  <div class="table-responsive"><table class="table table-centered"><caption class="shooting-caption">Resultados por fracción</caption><thead><tr><th scope="col">Fracción</th><th scope="col">Tiradores</th><th scope="col">Acertados</th><th scope="col">Total</th><th scope="col">Porcentaje</th></tr></thead><tbody><tr v-for="item in report.por_fraccion" :key="item.id_fraccion"><td>{{ item.numero_fraccion }}</td><td>{{ item.tiradores }}</td><td>{{ item.tiros_acertados }}</td><td>{{ item.tiros_total }}</td><td>{{ item.tiros_total === 0 ? '—' : `${item.porcentaje.toFixed(1)}%` }}</td></tr><tr v-if="report.por_fraccion.length === 0"><td colspan="5">Sin desglose de fracciones devuelto.</td></tr></tbody></table></div>
                  <div class="table-responsive"><table class="table table-centered"><caption class="shooting-caption">Resultados por unidad</caption><thead><tr><th scope="col">Unidad</th><th scope="col">Tiradores</th><th scope="col">Acertados</th><th scope="col">Total</th><th scope="col">Porcentaje</th></tr></thead><tbody><tr v-for="item in report.por_unidad" :key="item.unit_code"><td>{{ item.unit_name }} ({{ item.unit_code }})</td><td>{{ item.tiradores }}</td><td>{{ item.tiros_acertados }}</td><td>{{ item.tiros_total }}</td><td>{{ item.tiros_total === 0 ? '—' : `${item.porcentaje.toFixed(1)}%` }}</td></tr><tr v-if="report.por_unidad.length === 0"><td colspan="5">Sin desglose por unidad devuelto.</td></tr></tbody></table></div>
                  <template v-if="report.aggregate_only !== true">
                    <div class="table-responsive"><table class="table table-centered"><caption class="shooting-caption">Resultados por tirador</caption><thead><tr><th scope="col">RUT</th><th scope="col">Grado</th><th scope="col">Nombre</th><th scope="col">Unidad</th><th scope="col">Acertados</th><th scope="col">Total</th><th scope="col">Porcentaje</th></tr></thead><tbody><tr v-for="item in report.por_tirador" :key="item.id_usuario"><td>{{ item.rut }}</td><td>{{ item.grado }}</td><td>{{ item.nombre }}</td><td>{{ item.unit_name }} ({{ item.unit_code }})</td><td>{{ item.tiros_acertados }}</td><td>{{ item.tiros_total }}</td><td>{{ item.tiros_total === 0 ? '—' : `${item.porcentaje.toFixed(1)}%` }}</td></tr><tr v-if="report.por_tirador.length === 0"><td colspan="7">Sin desglose de tiradores devuelto.</td></tr></tbody></table></div>
                    <div class="table-responsive"><table class="table table-centered"><caption class="shooting-caption">Resultados por arma</caption><thead><tr><th scope="col">Arma</th><th scope="col">Unidad</th><th scope="col">Tiradores</th><th scope="col">Acertados</th><th scope="col">Total</th><th scope="col">Porcentaje</th></tr></thead><tbody><tr v-for="item in report.por_arma" :key="item.id_arma"><td>{{ item.tipo }} · {{ item.modelo }} · {{ item.serie }}</td><td>{{ item.unit_name }}</td><td>{{ item.tiradores }}</td><td>{{ item.tiros_acertados }}</td><td>{{ item.tiros_total }}</td><td>{{ item.tiros_total === 0 ? '—' : `${item.porcentaje.toFixed(1)}%` }}</td></tr><tr v-if="report.por_arma.length === 0"><td colspan="6">Sin desglose de armas devuelto.</td></tr></tbody></table></div>
                    <div class="table-responsive"><table class="table table-centered"><caption class="shooting-caption">Armas por unidad</caption><thead><tr><th scope="col">Unidad</th><th scope="col">Arma</th><th scope="col">Tiradores</th><th scope="col">Acertados</th><th scope="col">Total</th><th scope="col">Porcentaje</th></tr></thead><tbody><template v-for="unit in report.por_arma_unidad" :key="`${unit.unit_code ?? 'sin-codigo'}-${unit.unit_name}`"><tr v-for="weapon in unit.armas" :key="weapon.id_arma"><td>{{ unit.unit_name }}</td><td>{{ weapon.tipo }} · {{ weapon.modelo }} · {{ weapon.serie }}</td><td>{{ weapon.tiradores }}</td><td>{{ weapon.tiros_acertados }}</td><td>{{ weapon.tiros_total }}</td><td>{{ weapon.tiros_total === 0 ? '—' : `${weapon.porcentaje.toFixed(1)}%` }}</td></tr></template><tr v-if="report.por_arma_unidad.length === 0"><td colspan="6">Sin desglose de armas por unidad devuelto.</td></tr></tbody></table></div>
                  </template>
                </template>
              </template>
            </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="screen === SCREEN.FRACTION" class="shooting-stack">
        <div class="card fraction-data-card"><div class="card-body"><h2 class="card-title">Fracción {{ fractionState.data?.numero_fraccion ?? '—' }}</h2><p class="card-text text-muted">Lección {{ fractionState.data?.id_leccion ?? lessonId ?? '—' }}</p><div class="shooting-actions"><RouterLink v-if="fractionState.data" class="btn btn-primary" :to="`/tiro/fracciones/${fractionState.data.id_fraccion}/resultados`">Capturar resultados</RouterLink><button class="btn btn-outline-secondary" type="button" :disabled="!fractionState.data || !canWrite(PERMISSION.UPDATE_SHOOTING)" :aria-describedby="allowed(PERMISSION.UPDATE_SHOOTING) ? undefined : 'shooting-fractioncard-update-hint'" @click="fractionState.data && openFractionEditor(fractionState.data)">Editar</button><button class="btn btn-danger" type="button" :disabled="!fractionState.data || !canWrite(PERMISSION.DELETE_SHOOTING)" :aria-describedby="allowed(PERMISSION.DELETE_SHOOTING) ? undefined : 'shooting-fractioncard-delete-hint'" @click="fractionState.data && openDelete({ kind: 'fraction', id: fractionState.data.id_fraccion, lessonId: fractionState.data.id_leccion, label: `Fracción ${fractionState.data.numero_fraccion}` })">Eliminar</button><p v-if="!allowed(PERMISSION.UPDATE_SHOOTING)" id="shooting-fractioncard-update-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.UPDATE_SHOOTING) }}</p><p v-if="!allowed(PERMISSION.DELETE_SHOOTING)" id="shooting-fractioncard-delete-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.DELETE_SHOOTING) }}</p></div><div v-if="fractionState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Resolviendo fracción…</div><div v-else-if="fractionState.status === AREA_STATUS.ERROR || fractionState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ fractionState.error }}</p><button class="btn btn-outline-primary" type="button" @click="loadFractionDetail(false)">Reintentar lectura</button></div><dl v-else-if="fractionState.data" class="shooting-detail-grid"><div><dt>ID</dt><dd>{{ fractionState.data.id_fraccion }}</dd></div><div><dt>Lección</dt><dd><RouterLink :to="`/tiro/lecciones/${fractionState.data.id_leccion}`">{{ fractionState.data.id_leccion }}</RouterLink></dd></div><div><dt>Número</dt><dd>{{ fractionState.data.numero_fraccion }}</dd></div><div><dt>Tiradores totales</dt><dd>{{ fractionState.data.tiradores_totales }}</dd></div><div><dt>Tenant</dt><dd>{{ fractionState.data.tenant ?? '—' }}</dd></div><div><dt>Unidad</dt><dd>{{ fractionState.data.organization_unit ?? '—' }}</dd></div></dl></div></div>
        <div class="card fraction-options-card"><div class="card-header"><h2 class="card-title">Tiradores y armas elegibles</h2><p class="card-subtitle">Datos devueltos por OP-FRC-007; las listas no se completan localmente.</p></div><div class="card-body">
          <div v-if="captureOptionsState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando opciones reales…</div><div v-else-if="captureOptionsState.status === AREA_STATUS.ERROR || captureOptionsState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert">{{ captureOptionsState.error }}</div>
          <div v-else-if="captureOptionsState.data" class="shooting-option-grid"><section><h3 class="card-title">Tiradores</h3><p v-if="captureOptionsState.data.usuarios.length === 0" class="shooting-state">El backend no devolvió tiradores para esta fracción.</p><ul v-else class="list-group"><li v-for="user in captureOptionsState.data.usuarios" :key="user.id_usuario" class="list-group-item">{{ fullName(user) }} · {{ user.rut }}</li></ul></section><section><h3 class="card-title">Armas</h3><p v-if="captureOptionsState.data.armas.length === 0" class="shooting-state">El backend no devolvió armas para esta fracción.</p><ul v-else class="list-group"><li v-for="weapon in captureOptionsState.data.armas" :key="weapon.id_arma" class="list-group-item">{{ weapon.tipo_arma }} · {{ weapon.modelo_arma }} · {{ weapon.numero_serie }} · {{ weapon.calibre_code ?? '—' }}</li></ul></section></div>
        </div></div>
        <div class="card fraction-results-card"><div class="card-header"><h2 class="card-title">Resultados detallados</h2><p class="card-subtitle">La captura y la lectura de detalle son acciones independientes.</p></div><div class="card-body">
          <div v-if="fractionResultsState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando detalle…</div><div v-else-if="fractionResultsState.status === AREA_STATUS.DENIED && fractionResultsState.serverDenied" class="alert alert-warning" role="alert">Sin permiso de detalle: {{ fractionResultsState.error }} <RouterLink v-if="fractionState.data" :to="`/tiro/fracciones/${fractionState.data.id_fraccion}/resultados`">Abrir captura por separado</RouterLink></div><div v-else-if="fractionResultsState.status === AREA_STATUS.ERROR || fractionResultsState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ fractionResultsState.error }}</p><button class="btn btn-outline-primary" type="button" @click="fractionState.data && loadFractionResults(fractionState.data.id_fraccion)">Reintentar lectura</button></div><p v-else-if="fractionResultsState.status === AREA_STATUS.EMPTY" class="shooting-state" role="status">No hay resultados detallados devueltos para esta fracción.</p>
          <div v-else-if="fractionResultsState.data" class="table-responsive"><table class="table table-centered"><caption class="shooting-caption">Resultados de la fracción</caption><thead><tr><th scope="col">Tirador</th><th scope="col">RUT</th><th scope="col">Arma</th><th scope="col">Carril</th><th scope="col">Acertados</th><th scope="col">Total</th></tr></thead><tbody><tr v-for="item in fractionResultsState.data" :key="item.resultado.id_resultado"><td>{{ fullName(item.usuario) }}</td><td>{{ item.usuario.rut }}</td><td>{{ item.arma.tipo_arma }} · {{ item.arma.modelo_arma }} · {{ item.arma.numero_serie }}</td><td>{{ item.resultado.numero_carril ?? '—' }}</td><td>{{ item.resultado.tiros_acertados }}</td><td>{{ item.resultado.total_tiros }}</td></tr></tbody></table></div>
        </div></div>
      </section>

      <section v-else-if="screen === SCREEN.CAPTURE" class="shooting-stack">
         <div class="card capture-data-card"><div class="card-body"><h2 class="card-title">Fracción de captura</h2><p class="card-text text-muted">El contexto se resuelve con OP-FRC-003 antes de consultar opciones.</p><RouterLink v-if="fractionState.data" class="btn btn-outline-primary" :to="`/tiro/lecciones/${fractionState.data.id_leccion}/fracciones/${fractionState.data.id_fraccion}`">Volver a la fracción</RouterLink><div v-if="fractionState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Resolviendo fracción antes de mostrar selectores…</div><div v-else-if="fractionState.status === AREA_STATUS.ERROR || fractionState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ fractionState.error }}</p><button class="btn btn-outline-primary" type="button" @click="loadCaptureRoute(false)">Reintentar resolución</button></div><dl v-else-if="fractionState.data" class="shooting-detail-grid"><div><dt>ID fracción</dt><dd>{{ fractionState.data.id_fraccion }}</dd></div><div><dt>Lección</dt><dd><RouterLink :to="`/tiro/lecciones/${fractionState.data.id_leccion}`">{{ fractionState.data.id_leccion }}</RouterLink></dd></div><div><dt>Número</dt><dd>{{ fractionState.data.numero_fraccion }}</dd></div><div><dt>Tiradores totales</dt><dd>{{ fractionState.data.tiradores_totales }}</dd></div></dl></div></div>
        <div v-if="fractionState.data" class="card capture-form-card"><div class="card-header"><h2 class="card-title">Captura por tirador, arma y carril</h2><p class="card-subtitle">Sólo se ofrecen usuarios y armas retornados por OP-FRC-007.</p></div><div class="card-body"><div class="shooting-actions"><button class="btn btn-outline-primary" type="button" :disabled="!canWrite(PERMISSION.CREATE_USERS)" :aria-describedby="allowed(PERMISSION.CREATE_USERS) ? undefined : 'shooting-capture-temp-hint'" @click="openTemporaryPersonEditor">Alta de tirador temporal</button><button class="btn btn-primary" type="button" :disabled="!canWrite(PERMISSION.SCORE_SHOOTERS) || captureOptionsState.status !== AREA_STATUS.READY" :aria-describedby="allowed(PERMISSION.SCORE_SHOOTERS) ? undefined : 'shooting-capture-score-hint'" @click="openResultEditor()">Capturar resultado</button><p v-if="!allowed(PERMISSION.CREATE_USERS)" id="shooting-capture-temp-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.CREATE_USERS) }}</p><p v-if="!allowed(PERMISSION.SCORE_SHOOTERS)" id="shooting-capture-score-hint" class="card-text text-muted" role="status">{{ permissionNotice(PERMISSION.SCORE_SHOOTERS) }}</p></div>
          <div v-if="captureOptionsState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando selectores reales…</div><div v-else-if="captureOptionsState.status === AREA_STATUS.ERROR || captureOptionsState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ captureOptionsState.error }}</p><button class="btn btn-outline-primary" type="button" @click="fractionId !== null && loadFractionOptions(fractionId)">Reintentar opciones</button></div>
          <div v-else-if="captureOptionsState.data && (captureOptionsState.data.usuarios.length === 0 || captureOptionsState.data.armas.length === 0)" class="alert alert-warning" role="status"><p v-if="captureOptionsState.data.usuarios.length === 0">El backend no devolvió tiradores elegibles para esta fracción.</p><p v-if="captureOptionsState.data.armas.length === 0">El backend no devolvió armas elegibles para esta fracción.</p></div>
           <div v-if="temporaryFeedback" class="alert" :class="`alert-${temporaryFeedback.tone}`" role="status">{{ temporaryFeedback.message }}</div>
        </div></div>
        <div v-if="fractionState.data" class="card capture-results-card"><div class="card-header"><h2 class="card-title">Resultados existentes</h2><p class="card-subtitle">Lista de apoyo desde OP-RES-001, filtrada por el ID real de esta fracción.</p></div><div class="card-body"><button class="btn btn-outline-secondary" type="button" :disabled="captureResultsState.status === AREA_STATUS.LOADING" @click="loadCaptureResults(fractionId, canReconcileCurrentResource)">Actualizar desde el backend</button>
           <div v-if="captureResultsState.status === AREA_STATUS.LOADING" class="shooting-state" role="status">Cargando resultados…</div><div v-else-if="captureResultsState.status === AREA_STATUS.ERROR || captureResultsState.status === AREA_STATUS.DENIED" class="alert alert-danger" role="alert"><p>{{ captureResultsState.error }}</p><button class="btn btn-outline-primary" type="button" @click="loadCaptureResults(fractionId, false)">Reintentar lectura</button></div><p v-else-if="captureResultsState.status === AREA_STATUS.EMPTY" class="shooting-state" role="status">No hay resultados de esta fracción en la respuesta del backend.</p>
          <div v-else-if="captureResultsState.data" class="table-responsive"><table class="table table-centered"><caption class="shooting-caption">Resultados de la fracción {{ fractionState.data.id_fraccion }}</caption><thead><tr><th scope="col">Tirador</th><th scope="col">Arma</th><th scope="col">Carril</th><th scope="col">Acertados</th><th scope="col">Total</th><th scope="col">Acciones</th></tr></thead><tbody><tr v-for="item in captureRows" :key="item.id_resultado"><td>{{ resultUserName(item.id_usuario) }}</td><td>{{ resultWeaponName(item.id_arma) }}</td><td>{{ item.numero_carril ?? '—' }}</td><td>{{ item.tiros_acertados }}</td><td>{{ item.total_tiros }}</td><td class="shooting-actions"><button class="btn btn-sm btn-outline-secondary" type="button" :disabled="!canWrite(PERMISSION.SCORE_SHOOTERS)" :aria-describedby="allowed(PERMISSION.SCORE_SHOOTERS) ? undefined : 'shooting-capture-score-hint'" @click="openResultEditor(item)">Editar</button><button class="btn btn-sm btn-outline-danger" type="button" :disabled="!canWrite(PERMISSION.SCORE_SHOOTERS)" :aria-describedby="allowed(PERMISSION.SCORE_SHOOTERS) ? undefined : 'shooting-capture-score-hint'" @click="openDelete({ kind: 'result', id: item.id_resultado, label: `${resultUserName(item.id_usuario)} · ${resultWeaponName(item.id_arma)} · carril ${item.numero_carril ?? '—'}` })">Eliminar</button></td></tr><tr v-if="captureRows.length === 0"><td colspan="6">No hay resultados de esta fracción en la colección consultada.</td></tr></tbody></table></div>
        </div></div>
      </section>

      <div v-else class="card"><div class="card-body"><p class="shooting-state-title">No hay una pantalla F7 para esta ruta.</p><p class="shooting-state-copy">Rutas canónicas previstas: <code>/tiro/poligonos</code>, <code>/tiro/poligonos/:idPoligono</code>, <code>/tiro/lecciones</code>, <code>/tiro/lecciones/:idLeccion</code>, <code>/tiro/lecciones/:idLeccion/fracciones/:idFraccion</code> y <code>/tiro/fracciones/:idFraccion/resultados</code>.</p></div></div>
    </template>

    <DsModal v-model="modalOpen" :title="editorTitle" :busy="isMutationBusy" modal-id="shooting-editor-modal" @close="closeModal">
      <template #body>
        <template v-if="modalPurpose === 'delete' && deleteTarget">
          <p>Confirma la eliminación de <strong>{{ deleteTarget.label }}</strong>.</p>
          <p>La vista no retirará la fila antes de una respuesta exitosa del backend.</p>
        </template>
        <form v-else-if="modalPurpose === 'form'" class="access-forms" @submit.prevent="saveEditor">
          <FormFeedback :feedback="editorFeedback" :busy="isMutationBusy" :busy-message="busyLabel" />
          <div v-if="editorMode === EDITOR_MODE.EDIT" class="mb-3">
            <label class="form-label" for="shooting-edit-method">Método de edición</label>
            <select id="shooting-edit-method" v-model="editorMethod" class="form-select"><option :value="EDIT_METHOD.PUT">PUT · recurso completo</option><option :value="EDIT_METHOD.PATCH">PATCH · sólo cambios</option></select>
          </div>

          <template v-if="editorEntity === EDITOR_ENTITY.POLYGON">
            <div class="mb-3"><label class="form-label" for="shooting-polygon-name">Nombre</label><input id="shooting-polygon-name" v-model="draft.nombre" :class="fieldClass('nombre')" required :aria-invalid="Boolean(formFieldError('nombre'))" :aria-describedby="formFieldError('nombre') ? fieldFeedbackId('nombre') : undefined"><div v-if="formFieldError('nombre')" :id="fieldFeedbackId('nombre')" class="invalid-feedback">{{ formFieldError('nombre') }}</div></div>
            <div class="mb-3"><label class="form-label" for="shooting-polygon-city">Ciudad</label><input id="shooting-polygon-city" v-model="draft.ciudad" :class="fieldClass('ciudad')" required :aria-invalid="Boolean(formFieldError('ciudad'))" :aria-describedby="formFieldError('ciudad') ? fieldFeedbackId('ciudad') : undefined"><div v-if="formFieldError('ciudad')" :id="fieldFeedbackId('ciudad')" class="invalid-feedback">{{ formFieldError('ciudad') }}</div></div>
            <div class="row g-3"><div class="col-md-6"><label class="form-label" for="shooting-polygon-lanes">Carriles máximos</label><input id="shooting-polygon-lanes" v-model="draft.carriles_maximos" :class="fieldClass('carriles_maximos')" type="number" step="1" required><div v-if="formFieldError('carriles_maximos')" class="invalid-feedback">{{ formFieldError('carriles_maximos') }}</div></div><div class="col-md-6"><label class="form-label" for="shooting-polygon-distance">Distancia máxima</label><input id="shooting-polygon-distance" v-model="draft.distancia_maxima" :class="fieldClass('distancia_maxima')" type="number" step="1" required><div v-if="formFieldError('distancia_maxima')" class="invalid-feedback">{{ formFieldError('distancia_maxima') }}</div></div></div>
          </template>

          <template v-else-if="editorEntity === EDITOR_ENTITY.LESSON">
            <div class="mb-3"><label class="form-label" for="shooting-lesson-polygon">Polígono</label><select id="shooting-lesson-polygon" v-model="draft.id_poligono" :class="selectClass('id_poligono')" required><option value="" disabled>Selecciona un polígono devuelto</option><option v-for="item in polygonOptionsState.data ?? []" :key="item.id_poligono" :value="String(item.id_poligono)">{{ item.nombre }} · {{ item.ciudad }} · #{{ item.id_poligono }}</option><option v-if="lessonState.data && !polygonOptionsState.data?.some((item) => item.id_poligono === lessonState.data?.id_poligono)" :value="String(lessonState.data.id_poligono)">Polígono actual #{{ lessonState.data.id_poligono }}</option></select><div v-if="formFieldError('id_poligono')" class="invalid-feedback">{{ formFieldError('id_poligono') }}</div><p v-if="polygonOptionsState.status === AREA_STATUS.LOADING" class="shooting-help">Cargando polígonos reales…</p><p v-else-if="polygonOptionsState.error" class="shooting-help">{{ polygonOptionsState.error }}</p></div>
            <div class="row g-3"><div class="col-md-6"><label class="form-label" for="shooting-lesson-date">Fecha de tiro</label><input id="shooting-lesson-date" v-model="draft.fecha_tiro" :class="fieldClass('fecha_tiro')" type="date" required><div v-if="formFieldError('fecha_tiro')" class="invalid-feedback">{{ formFieldError('fecha_tiro') }}</div></div><div class="col-md-6"><label class="form-label" for="shooting-lesson-type">Tipo de tiro</label><select id="shooting-lesson-type" v-model="draft.tipo_tiro" :class="selectClass('tipo_tiro')"><option value="">—</option><option value="evaluacion">Evaluación</option><option value="entrenamiento">Entrenamiento</option></select><div v-if="formFieldError('tipo_tiro')" class="invalid-feedback">{{ formFieldError('tipo_tiro') }}</div></div><div class="col-md-6"><label class="form-label" for="shooting-lesson-order">Número de orden</label><input id="shooting-lesson-order" v-model="draft.numero_orden" :class="fieldClass('numero_orden')"></div><div class="col-md-6"><label class="form-label" for="shooting-lesson-order-date">Fecha de orden</label><input id="shooting-lesson-order-date" v-model="draft.fecha_orden" :class="fieldClass('fecha_orden')" type="date"><div v-if="formFieldError('fecha_orden')" class="invalid-feedback">{{ formFieldError('fecha_orden') }}</div></div><div class="col-md-4"><label class="form-label" for="shooting-lesson-zeroing">Tiros de cereo</label><input id="shooting-lesson-zeroing" v-model="draft.cant_tiros_cereo" :class="fieldClass('cant_tiros_cereo')" type="number" step="1" required><div v-if="formFieldError('cant_tiros_cereo')" class="invalid-feedback">{{ formFieldError('cant_tiros_cereo') }}</div></div><div class="col-md-4"><label class="form-label" for="shooting-lesson-shots">Tiros de lección</label><input id="shooting-lesson-shots" v-model="draft.cant_tiros_leccion" :class="fieldClass('cant_tiros_leccion')" type="number" step="1" required><div v-if="formFieldError('cant_tiros_leccion')" class="invalid-feedback">{{ formFieldError('cant_tiros_leccion') }}</div></div><div class="col-md-4"><label class="form-label" for="shooting-lesson-distance">Distancia</label><input id="shooting-lesson-distance" v-model="draft.distancia" :class="fieldClass('distancia')" type="number" step="1" required><div v-if="formFieldError('distancia')" class="invalid-feedback">{{ formFieldError('distancia') }}</div></div></div>
            <div class="mb-3"><label class="form-label" for="shooting-lesson-units">Unidades participantes</label><select id="shooting-lesson-units" v-model="draft.unidades_participantes_codes" :class="fieldClass('unidades_participantes_codes')" multiple :disabled="organizationUnitsState.status === AREA_STATUS.LOADING || organizationUnitsState.status === AREA_STATUS.IDLE" :aria-invalid="Boolean(formFieldError('unidades_participantes_codes'))" aria-describedby="shooting-lesson-units-help"><option v-for="unit in participantUnitOptions" :key="unit.code" :value="unit.code">{{ unit.label }}</option></select><div v-if="formFieldError('unidades_participantes_codes')" class="invalid-feedback">{{ formFieldError('unidades_participantes_codes') }}</div><p id="shooting-lesson-units-help" class="shooting-help">{{ organizationUnitsState.status === AREA_STATUS.LOADING ? 'Cargando unidades activas reales…' : organizationUnitsState.status === AREA_STATUS.EMPTY ? 'OP-UNT-009 no devolvió unidades activas. Si no seleccionas participantes, el backend aplica la unidad efectiva.' : organizationUnitsState.status === AREA_STATUS.ERROR || organizationUnitsState.status === AREA_STATUS.DENIED ? `${organizationUnitsState.error} Sin selección, no se envían códigos inventados.` : 'Opcional. La lista contiene unidades reales de OP-UNT-009 y las unidades actuales devueltas por esta lección.' }}</p><button v-if="organizationUnitsState.status === AREA_STATUS.ERROR || organizationUnitsState.status === AREA_STATUS.DENIED" class="btn btn-sm btn-outline-secondary" type="button" @click="loadOrganizationUnitOptions">Reintentar unidades</button></div>
          </template>

          <template v-else-if="editorEntity === EDITOR_ENTITY.FRACTION">
            <div class="mb-3"><label class="form-label" for="shooting-fraction-number">Número de fracción</label><input id="shooting-fraction-number" v-model="draft.numero_fraccion" :class="fieldClass('numero_fraccion')" type="number" step="1" required><div v-if="formFieldError('numero_fraccion')" class="invalid-feedback">{{ formFieldError('numero_fraccion') }}</div></div>
            <div class="mb-3"><label class="form-label" for="shooting-fraction-shooters">Tiradores totales</label><input id="shooting-fraction-shooters" v-model="draft.tiradores_totales" :class="fieldClass('tiradores_totales')" type="number" step="1" required><div v-if="formFieldError('tiradores_totales')" class="invalid-feedback">{{ formFieldError('tiradores_totales') }}</div></div>
            <p class="shooting-help">La lección se envía desde el ID real de la ruta o desde la fracción cargada; tenant y unidad no se escriben.</p>
          </template>

          <template v-else-if="editorEntity === EDITOR_ENTITY.TEMPORARY_PERSON">
            <div class="alert alert-info" role="status">El tirador temporal no inicia sesión. Si el RUT ya existe, el backend rechazará el alta y no se creará un duplicado.</div>
            <div class="mb-3"><label class="form-label" for="shooting-temporary-rut">RUT</label><input id="shooting-temporary-rut" v-model="draft.rut" :class="fieldClass('rut')" autocomplete="off" required :aria-invalid="Boolean(formFieldError('rut'))" :aria-describedby="formFieldError('rut') ? fieldFeedbackId('rut') : undefined"><div v-if="formFieldError('rut')" :id="fieldFeedbackId('rut')" class="invalid-feedback">{{ formFieldError('rut') }}</div></div>
            <div class="mb-3"><label class="form-label" for="shooting-temporary-grade">Grado</label><input id="shooting-temporary-grade" v-model="draft.grado" :class="fieldClass('grado')" autocomplete="off"></div>
            <div class="mb-3"><label class="form-label" for="shooting-temporary-name">Nombre</label><input id="shooting-temporary-name" v-model="draft.nombre" :class="fieldClass('nombre')" autocomplete="off"></div>
            <div class="row g-3"><div class="col-md-6"><label class="form-label" for="shooting-temporary-surname">Apellido paterno</label><input id="shooting-temporary-surname" v-model="draft.apellido_paterno" :class="fieldClass('apellido_paterno')" autocomplete="off"></div><div class="col-md-6"><label class="form-label" for="shooting-temporary-second-surname">Apellido materno</label><input id="shooting-temporary-second-surname" v-model="draft.apellido_materno" :class="fieldClass('apellido_materno')" autocomplete="off"></div></div>
            <div class="mb-3"><label class="form-label" for="shooting-temporary-unit">Unidad orgánica (opcional)</label><select id="shooting-temporary-unit" v-model="draft.organization_unit_code" :class="selectClass('organization_unit_code')" :disabled="organizationUnitsState.status !== AREA_STATUS.READY"><option value="">Sin unidad especificada</option><option v-for="unit in organizationUnitOptions" :key="unit.code" :value="unit.code">{{ unit.label }}</option></select><div v-if="formFieldError('organization_unit_code')" class="invalid-feedback">{{ formFieldError('organization_unit_code') }}</div><p v-if="organizationUnitsState.status === AREA_STATUS.LOADING" class="shooting-help">Cargando unidades reales…</p><p v-else-if="organizationUnitsState.status === AREA_STATUS.ERROR || organizationUnitsState.status === AREA_STATUS.DENIED" class="shooting-help">{{ organizationUnitsState.error }} Puedes dejar la unidad vacía.</p><p v-else-if="organizationUnitsState.status === AREA_STATUS.EMPTY" class="shooting-help">OP-UNT-009 no devolvió unidades activas; el campo queda vacío.</p><button v-if="organizationUnitsState.status === AREA_STATUS.ERROR || organizationUnitsState.status === AREA_STATUS.DENIED" class="btn btn-sm btn-outline-secondary" type="button" @click="loadOrganizationUnitOptions">Reintentar unidades</button></div>
          </template>

          <template v-else-if="editorEntity === EDITOR_ENTITY.RESULT">
            <div v-if="captureOptionsState.status !== AREA_STATUS.READY" class="alert alert-warning" role="status">La captura necesita una respuesta válida de OP-FRC-007 antes de habilitar los selectores.</div>
            <div class="mb-3"><label class="form-label" for="shooting-result-user">Tirador</label><select id="shooting-result-user" v-model="draft.id_usuario" :class="selectClass('id_usuario')" required :disabled="captureOptionsState.status !== AREA_STATUS.READY"><option value="" disabled>Selecciona un tirador del backend</option><option v-for="user in captureOptionsState.data?.usuarios ?? []" :key="user.id_usuario" :value="String(user.id_usuario)">{{ fullName(user) }} · {{ user.rut }}</option></select><div v-if="formFieldError('id_usuario')" class="invalid-feedback">{{ formFieldError('id_usuario') }}</div></div>
            <div class="mb-3"><label class="form-label" for="shooting-result-weapon">Arma</label><select id="shooting-result-weapon" v-model="draft.id_arma" :class="selectClass('id_arma')" required :disabled="captureOptionsState.status !== AREA_STATUS.READY"><option value="" disabled>Selecciona un arma del backend</option><option v-for="weapon in captureOptionsState.data?.armas ?? []" :key="weapon.id_arma" :value="String(weapon.id_arma)">{{ weapon.tipo_arma }} · {{ weapon.modelo_arma }} · {{ weapon.numero_serie }} · #{{ weapon.id_arma }}</option></select><div v-if="formFieldError('id_arma')" class="invalid-feedback">{{ formFieldError('id_arma') }}</div></div>
            <div class="row g-3"><div class="col-md-4"><label class="form-label" for="shooting-result-hits">Tiros acertados</label><input id="shooting-result-hits" v-model="draft.tiros_acertados" :class="fieldClass('tiros_acertados')" type="number" step="1" required><div v-if="formFieldError('tiros_acertados')" class="invalid-feedback">{{ formFieldError('tiros_acertados') }}</div></div><div class="col-md-4"><label class="form-label" for="shooting-result-total">Total de tiros</label><input id="shooting-result-total" v-model="draft.total_tiros" :class="fieldClass('total_tiros')" type="number" step="1" required><div v-if="formFieldError('total_tiros')" class="invalid-feedback">{{ formFieldError('total_tiros') }}</div></div><div class="col-md-4"><label class="form-label" for="shooting-result-lane">Número de carril</label><input id="shooting-result-lane" v-model="draft.numero_carril" :class="fieldClass('numero_carril')" type="number" step="1"><div v-if="formFieldError('numero_carril')" class="invalid-feedback">{{ formFieldError('numero_carril') }}</div></div></div>
            <p class="shooting-help">Los IDs de fracción, tirador y arma se envían como claves numéricas directas. El carril vacío se envía como <code>null</code>.</p>
          </template>
        </form>
      </template>
      <template #footer>
        <button class="btn btn-secondary" type="button" :disabled="isMutationBusy" @click="closeModal(false)">Cancelar</button>
        <button v-if="modalPurpose === 'delete'" class="btn btn-danger" type="button" :disabled="isMutationBusy || !deleteTarget || !canWrite(requiredPermissionForDelete(deleteTarget))" @click="confirmDelete">Eliminar</button>
        <button v-else-if="modalPurpose === 'form'" class="btn btn-primary" type="button" :disabled="isMutationBusy || !currentRequiredPermission() || !canWrite(currentRequiredPermission() ?? '')" @click="saveEditor">Guardar</button>
      </template>
    </DsModal>
  </main>
</template>

<style scoped>
.shooting-view{display:flex;flex-direction:column;gap:24px;}
.shooting-heading,.shooting-card-header,.shooting-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:24px;}
.shooting-title{margin:0;color:var(--heading);font-size:30px;line-height:1.2;font-weight:600;}
.shooting-breadcrumb{display:flex;align-items:center;gap:8px;margin-top:8px;color:var(--muted);}
.shooting-breadcrumb a{color:var(--text);}
.shooting-breadcrumb a:hover{color:var(--primary);}
.shooting-card-header .card-title,.shooting-panel-heading .card-title{margin-bottom:8px;}
/* Literal DS .card-header / ui-card anatomy for the four main polygons/lessons cards. */
.polygons-list-card .card-header .card-title,
.lessons-list-card .card-header .card-title,
.polygon-detail-card .card-body > .card-title,
.lesson-detail-card .card-body > .card-title{margin-bottom:12px;line-height:19.8px;}
.polygon-detail-card .card-body > .card-text,
.lesson-detail-card .card-body > .card-text{margin-bottom:10px;color:var(--bui-muted);}
/* Literal DS anatomy for the two data cards of SCREEN.FRACTION / SCREEN.CAPTURE
   (ui-card.html:219-227: .card > .card-body > h2.card-title + p.card-text.text-muted,
   no .card-header). */
.fraction-data-card .card-body > .card-title,
.capture-data-card .card-body > .card-title{margin-bottom:.75rem!important;line-height:19.8px;}
.fraction-data-card .card-body > .card-text,
.capture-data-card .card-body > .card-text{margin-bottom:10px;color:var(--bui-muted);}
/* Literal DS anatomy for the four header cards of SCREEN.FRACTION / SCREEN.CAPTURE
   (tables-basic.html:212-219 Basic Example: .card-header > h2.card-title +
   p.card-subtitle, block header without flex/wrapper/CTA). */
.fraction-options-card .card-header .card-title,
.fraction-results-card .card-header .card-title,
.capture-form-card .card-header .card-title,
.capture-results-card .card-header .card-title{margin-bottom:12px;line-height:19.8px;}
.fraction-options-card .card-header .card-subtitle,
.fraction-results-card .card-header .card-subtitle,
.capture-form-card .card-header .card-subtitle,
.capture-results-card .card-header .card-subtitle{margin:0;font-size:14px;line-height:21px;color:var(--bui-text);}
/* tables-basic.html:213-218 Basic Example header for the polygon lessons relation card
   (block .card-header > h2.card-title + p.card-subtitle). title line-height is the only
   value the app port omits; margin 12px and the subtitle are already effective. */
.polygon-lessons-relation-card .card-header .card-title{line-height:19.8px;}
.shooting-toolbar{display:flex;align-items:end;gap:16px;margin-bottom:24px;}
.shooting-toolbar .form-label{margin-bottom:0;white-space:nowrap;}
.shooting-toolbar .form-control{max-width:420px;}
.shooting-stack{display:flex;flex-direction:column;gap:24px;}
.shooting-detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:24px;margin:0;}
.shooting-detail-grid dt{margin-bottom:8px;color:var(--muted);font-size:12px;font-weight:600;}
.shooting-detail-grid dd{margin:0;color:var(--text);overflow-wrap:anywhere;}
.shooting-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;}
.shooting-actions .btn{margin:0;}
.shooting-state{padding:16px 0;color:var(--muted);}
.shooting-state-title{margin:0 0 8px;color:var(--heading);font-size:18px;font-weight:600;}
.shooting-state-copy{margin:0;color:var(--text);}
.shooting-caption{padding:0 0 8px;color:var(--muted);text-align:left;caption-side:top;}
.shooting-tab-body{min-width:0;}
.shooting-tab-body .tab-content{padding:20px 0 0;color:var(--bui-muted);}
/* DS baseui-content.css:62,76-92 effective contextual rules for the default tabs. */
.shooting-tab-body ul.nav-tabs{padding-left:2rem;margin-top:0;margin-bottom:1rem;}
.shooting-tab-body .nav-link:not(.active){color:#afb9cf;}
.shooting-tab-body .nav-tabs .nav-link.active{color:rgba(var(--bui-primary-rgb),1);background-color:var(--bui-surface);border-color:transparent transparent rgba(var(--bui-primary-rgb),1);}
[data-theme="light"] .shooting-tab-body .nav-link:not(.active){color:#5d6c8a;}
[data-theme="light"] .shooting-tab-body .nav-tabs .nav-link.active{color:var(--primary-text);background-color:var(--bui-surface);border-color:transparent transparent rgba(var(--bui-primary-rgb),1);}
.shooting-panel-heading{margin-bottom:16px;}
.shooting-inline-action{display:flex;align-items:center;gap:16px;margin:24px 0;color:var(--muted);}
.shooting-eligible-list{margin-bottom:24px;}
.shooting-metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:24px;margin:0;}
.shooting-metric{padding:20px 24px;}
.shooting-metric dt{color:var(--muted);font-size:13px;}
.shooting-metric dd{margin:8px 0 0;color:var(--heading);font-size:24px;font-weight:600;}
.shooting-report-summary{margin-bottom:24px;padding:16px 20px;border-left:3px solid var(--primary);background:var(--surface-2);}
.shooting-report-summary p{margin:0 0 8px;}
.shooting-report-summary p:last-child{margin-bottom:0;}
.shooting-option-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;}
.shooting-option-grid section{min-width:0;}
.shooting-option-grid .card-title{font-size:16px;}
.shooting-gap{margin-top:24px;}
.shooting-help{margin:8px 0 0;color:var(--muted);font-size:12.25px;}
.shooting-view code{color:var(--primary);}
@media (max-width:767.98px){
  .shooting-heading,.shooting-card-header,.shooting-panel-heading{align-items:flex-start;flex-direction:column;}
  .shooting-toolbar,.shooting-inline-action{align-items:stretch;flex-direction:column;}
  .shooting-toolbar .form-control{max-width:none;}
  .shooting-option-grid{grid-template-columns:1fr;}
  .shooting-title{font-size:24px;}
}
</style>
