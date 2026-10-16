import { computed, shallowRef, watch } from 'vue'
import { defineStore } from 'pinia'
import {
  DashboardApiError,
  getLessons,
  getLessonSummary,
  getPolygons,
  getUserProfile,
  TENANT_CONTEXT_DENIED_DETAIL,
} from '../api/dashboard'
import { useSessionStore } from './session'
import {
  ACCESS_ACTION_RESULT,
  ACCESS_OPERATION_ERROR_KIND,
  AREA_STATUS,
  DASHBOARD_STATUS,
  SESSION_STATUS,
  type AccessOperationError,
  type ApiConnection,
  type AreaStatus,
  type DashboardStatus,
  type Lesson,
  type LessonSummary,
  type Polygon,
  type PolygonLookup,
  type UserProfile,
} from '../types'
import type { SessionStatus } from '../types/session'

function sortLessons(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((left, right) => {
    const shootingDateOrder = right.fecha_tiro.localeCompare(left.fecha_tiro)
    if (shootingDateOrder !== 0) return shootingDateOrder

    const leftOrderDate = left.fecha_orden ?? ''
    const rightOrderDate = right.fecha_orden ?? ''
    const orderDateOrder = rightOrderDate.localeCompare(leftOrderDate)
    if (orderDateOrder !== 0) return orderDateOrder

    return left.id_leccion - right.id_leccion
  })
}

function messageFor(error: unknown, area: string): string {
  if (error instanceof DashboardApiError) {
    if (error.status === 429) {
      return error.retryAfter
        ? `El servidor limitó las consultas. Tiempo indicado para volver a consultar: ${error.retryAfter}.`
        : 'El servidor limitó las consultas. Vuelve a intentar más tarde.'
    }
    if ((error.status === 403 || error.status === 404) && error.detail !== null) return error.detail
    if (error.status === 401) return 'La sesión requiere autenticación.'
    if (error.status === 403) return `El servidor no autorizó la lectura de ${area}.`
    if (error.kind === 'network') return 'No se pudo conectar con el servidor.'
    if (error.kind === 'schema') return 'La respuesta del servidor no tiene el formato esperado.'
  }

  return `No se pudo cargar ${area}.`
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof DashboardApiError && error.status === 401
}

function isSessionOrContextLost(error: unknown): boolean {
  return isUnauthorized(error)
    || (
      error instanceof DashboardApiError
      && error.status === 403
      && error.detail === TENANT_CONTEXT_DENIED_DETAIL
    )
}

function isForbidden(error: unknown): boolean {
  return error instanceof DashboardApiError && error.status === 403
}

function isAbortError(error: unknown): boolean {
  if (error === null || typeof error !== 'object' || !('name' in error)) return false
  return error.name === 'AbortError'
}

// Proyección del error de operación de sesión para la superficie de datos del
// dashboard. Conserva los literales del baseline (429/Retry-After, red, schema)
// sin convertir un estado de sesión en éxito de datos ni expirar por status solo.
function messageForAccessError(failure: AccessOperationError): string {
  if (failure.status === 429) {
    return failure.retryAfter
      ? `El servidor limitó las consultas. Tiempo indicado para volver a consultar: ${failure.retryAfter}.`
      : 'El servidor limitó las consultas. Vuelve a intentar más tarde.'
  }
  if ((failure.status === 403 || failure.status === 404) && failure.detail !== null) {
    return failure.detail
  }
  if (failure.status === 401) return 'La sesión requiere autenticación.'
  if (failure.kind === ACCESS_OPERATION_ERROR_KIND.NETWORK) return 'No se pudo conectar con el servidor.'
  if (failure.kind === ACCESS_OPERATION_ERROR_KIND.ABORTED) {
    return 'La consulta del contexto fue cancelada.'
  }
  if (failure.kind === ACCESS_OPERATION_ERROR_KIND.INVALID_RESPONSE) {
    return 'La respuesta del servidor no tiene el formato esperado.'
  }

  return 'No se pudo cargar el contexto solicitado.'
}

// Pérdida de sesión/contexto acreditada: 401 o 403 con el literal de tenant.
// Un 403 ambiguo, de negocio, CSRF o red/429 no expira por status solo; esa
// clasificación pertenece al core de sesión, no a este store.
function isAuthExpiryError(failure: AccessOperationError): boolean {
  return failure.status === 401
    || (failure.status === 403 && failure.detail === TENANT_CONTEXT_DENIED_DETAIL)
}

interface ConnectionConfiguration {
  tenantCode?: string
  unitCode?: string
}

export const useDashboardStore = defineStore('dashboard', () => {
  // Fuente única de sesión/contexto/unidad. La lectura del store de sesión
  // ocurre tras Pinia instalado (main.ts), igual que en guards y vistas.
  const session = useSessionStore()
  const readSessionStatus = (): SessionStatus => session.status

  const status = shallowRef<DashboardStatus>(DASHBOARD_STATUS.IDLE)
  const context = computed(() => session.context)
  const userProfile = shallowRef<UserProfile | null>(null)
  const polygons = shallowRef<Polygon[]>([])
  const lessons = shallowRef<Lesson[]>([])
  const selectedLessonId = shallowRef<number | null>(null)
  const summary = shallowRef<LessonSummary | null>(null)
  const lessonsStatus = shallowRef<AreaStatus>(AREA_STATUS.IDLE)
  const summaryStatus = shallowRef<AreaStatus>(AREA_STATUS.IDLE)
  const profileStatus = shallowRef<AreaStatus>(AREA_STATUS.IDLE)
  const polygonsStatus = shallowRef<AreaStatus>(AREA_STATUS.IDLE)
  const error = shallowRef<string | null>(null)
  const summaryError = shallowRef<string | null>(null)
  // Instante de la última resolución del resumen: alimenta «Consultado a las HH:MM».
  const consultedAt = shallowRef<Date | null>(null)
  const profileError = shallowRef<string | null>(null)
  const polygonsError = shallowRef<string | null>(null)
  // Proyecciones de compatibilidad: la autoridad de T/U es SessionStore.
  const tenantCode = computed(() => session.tenantCode)
  const unitCode = computed(() => session.unitCode)

  const userDisplayName = computed(() => {
    const profile = userProfile.value
    if (profile) {
      const name = [
        profile.grado,
        profile.nombre,
        profile.apellidoPaterno,
        profile.apellidoMaterno,
      ]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ')

      if (name) return name
      return `Usuario #${profile.id}`
    }

    const userId = context.value?.user.id_usuario
    return typeof userId === 'number' && Number.isSafeInteger(userId) && userId > 0
      ? `Usuario #${userId}`
      : null
  })

  const polygonsById = computed<PolygonLookup>(() => Object.fromEntries(
    polygons.value.map((polygon) => [String(polygon.id), polygon]),
  ))

  const selectedLesson = computed(() => (
    lessons.value.find((lesson) => lesson.id_leccion === selectedLessonId.value) ?? null
  ))

  let generation = 0
  let summaryGeneration = 0
  let lessonsController: AbortController | null = null
  let summaryController: AbortController | null = null
  let profileController: AbortController | null = null
  let polygonsController: AbortController | null = null
  let ineligibleSurfacePurged = false

  function abortPendingRequests(): void {
    lessonsController?.abort()
    summaryController?.abort()
    profileController?.abort()
    polygonsController?.abort()
    lessonsController = null
    summaryController = null
    profileController = null
    polygonsController = null
  }

  // Descarta la superficie de datos del dashboard: invalida generaciones,
  // aborta requests propias y purga datos/errores anteriores. Nunca re-hace
  // fetch por sí sola; el siguiente request parte de una acción explícita.
  function invalidateDashboardSurface(): void {
    generation += 1
    summaryGeneration += 1
    abortPendingRequests()
    clearDashboardData()
    status.value = DASHBOARD_STATUS.IDLE
  }

  // Ownership de la invalidación: session.ts purga y avanza su `generation`
  // en login, captureTenant, adopción de unidad, logout y purge propio sin
  // llamar a dashboard.purge. Este watcher es la única conexión: aborta y
  // purga datos anteriores ante cualquier cambio de sesión/contexto/unidad,
  // con flush sincron para que ni una completion vieja ni un error viejo
  // repinten después de la invalidación.
  watch(
    () => session.generation,
    () => {
      invalidateDashboardSurface()
      ineligibleSurfacePurged = true
    },
    { flush: 'sync' },
  )

  function clearDashboardData(): void {
    // `context` no se purga aquí: es proyección de SessionStore y su autoridad
    // la decide la sesión (purge/logout/captureTenant), nunca este store.
    userProfile.value = null
    polygons.value = []
    lessons.value = []
    selectedLessonId.value = null
    summary.value = null
    lessonsStatus.value = AREA_STATUS.IDLE
    summaryStatus.value = AREA_STATUS.IDLE
    profileStatus.value = AREA_STATUS.IDLE
    polygonsStatus.value = AREA_STATUS.IDLE
    error.value = null
    summaryError.value = null
    profileError.value = null
    polygonsError.value = null
    consultedAt.value = null
  }

  // SessionStore is the authority. Dashboard data is operational only while
  // its current context, identity and confirmed T/U still agree.
  function isOperationallyEligible(): boolean {
    const activeContext = session.context
    const identity = session.identity
    const tenantCode = session.tenantCode.trim()
    const unitCode = session.unitCode.trim()
    const contextTenantCode = activeContext?.tenant.code?.trim() ?? ''
    const contextUnitCode = activeContext?.active_organization_unit?.trim()
      || activeContext?.unit_membership?.unit_code.trim()
      || ''

    return session.status === SESSION_STATUS.READY
      && activeContext !== null
      && identity !== null
      && identity.source === 'context'
      && Number.isSafeInteger(identity.id_usuario)
      && identity.id_usuario > 0
      && identity.id_usuario === activeContext.user.id_usuario
      && identity.must_change_password === false
      && activeContext.user.must_change_password === false
      && tenantCode.length > 0
      && tenantCode === contextTenantCode
      && unitCode.length > 0
      && unitCode === contextUnitCode
      && !session.logoutBusy
      && !session.busy.context
      && !session.busy.changeRequiredPassword
      && session.uncertainMutation === null
  }

  function purgeForIneligibleSession(): void {
    if (ineligibleSurfacePurged) return
    ineligibleSurfacePurged = true
    invalidateDashboardSurface()
  }

  function isCurrentOperationalRequest(currentGeneration: number): boolean {
    if (currentGeneration !== generation) return false
    if (isOperationallyEligible()) return true
    purgeForIneligibleSession()
    return false
  }

  // Also cover eligibility changes that do not advance SessionStore.generation.
  // Becoming eligible only unlocks future explicit actions; it never fetches.
  watch(
    isOperationallyEligible,
    (eligible) => {
      if (eligible) {
        ineligibleSurfacePurged = false
        return
      }
      purgeForIneligibleSession()
    },
    { flush: 'sync' },
  )

  function clearForSessionOrContextLost(requestError: unknown): void {
    const unauthorized = isUnauthorized(requestError)

    // 401 o 403 literal de tenant en una lectura autenticada acredita pérdida
    // de sesión/contexto: la autoridad de purga es SessionStore (método público
    // actual `purge`). Su avance de generación dispara el watcher sync de arriba
    // y descarta datos/requests antes de pintar el terminal.
    session.purge()
    generation += 1
    summaryGeneration += 1
    abortPendingRequests()
    clearDashboardData()

    // Terminal compatible con el baseline (mapeo conservado del bug F1):
    // 401 → SESSION_REQUIRED; 403 literal de tenant → CONTEXT_DENIED.
    status.value = unauthorized
      ? DASHBOARD_STATUS.SESSION_REQUIRED
      : DASHBOARD_STATUS.CONTEXT_DENIED
    error.value = unauthorized
      ? 'La sesión requiere autenticación.'
      : messageFor(requestError, 'el contexto solicitado')
  }

  function connectionFor(signal: AbortSignal): ApiConnection {
    // Cabeceras T/U siempre vigentes: se leen de la sesión en el momento del
    // request, nunca de un valor capturado por el dashboard.
    return {
      tenantCode: session.tenantCode,
      unitCode: session.unitCode,
      signal,
    }
  }

  async function loadSummaryFor(lessonId: number, currentGeneration: number): Promise<void> {
    if (!isCurrentOperationalRequest(currentGeneration)) return

    summaryController?.abort()
    const requestGeneration = ++summaryGeneration
    const controller = new AbortController()
    summaryController = controller
    summary.value = null
    summaryStatus.value = AREA_STATUS.LOADING
    summaryError.value = null

    try {
      const result = await getLessonSummary(lessonId, connectionFor(controller.signal))
      if (
        !isCurrentOperationalRequest(currentGeneration)
        || requestGeneration !== summaryGeneration
        || selectedLessonId.value !== lessonId
      ) return

      summary.value = result
      summaryStatus.value = result.tiradores_unicos === 0
        ? AREA_STATUS.EMPTY
        : AREA_STATUS.READY
      consultedAt.value = new Date()
    } catch (requestError: unknown) {
      if (
        !isCurrentOperationalRequest(currentGeneration)
        || requestGeneration !== summaryGeneration
      ) return
      if (isAbortError(requestError)) {
        summary.value = null
        summaryStatus.value = AREA_STATUS.ERROR
        summaryError.value = 'La consulta del resumen fue cancelada.'
        return
      }
      if (isSessionOrContextLost(requestError)) {
        clearForSessionOrContextLost(requestError)
        return
      }

      summary.value = null
      summaryStatus.value = isForbidden(requestError) ? AREA_STATUS.DENIED : AREA_STATUS.ERROR
      summaryError.value = messageFor(requestError, 'el resumen de la lección')
    } finally {
      if (summaryController === controller) summaryController = null
    }
  }

  async function loadUserProfileFor(userId: number, currentGeneration: number): Promise<void> {
    if (!isCurrentOperationalRequest(currentGeneration)) return

    profileController?.abort()
    const controller = new AbortController()
    profileController = controller
    userProfile.value = null
    profileStatus.value = AREA_STATUS.LOADING
    profileError.value = null

    try {
      const profile = await getUserProfile(userId, connectionFor(controller.signal))
      if (!isCurrentOperationalRequest(currentGeneration)) return

      userProfile.value = profile
      profileStatus.value = AREA_STATUS.READY
    } catch (requestError: unknown) {
      if (!isCurrentOperationalRequest(currentGeneration)) return
      if (isAbortError(requestError)) {
        userProfile.value = null
        profileStatus.value = AREA_STATUS.ERROR
        profileError.value = 'La consulta del perfil fue cancelada.'
        return
      }
      if (isSessionOrContextLost(requestError)) {
        clearForSessionOrContextLost(requestError)
        return
      }

      userProfile.value = null
      profileStatus.value = isForbidden(requestError) ? AREA_STATUS.DENIED : AREA_STATUS.ERROR
      profileError.value = messageFor(requestError, 'el perfil del usuario')
    } finally {
      if (profileController === controller) profileController = null
    }
  }

  async function loadPolygonsFor(currentGeneration: number): Promise<void> {
    if (!isCurrentOperationalRequest(currentGeneration)) return

    polygonsController?.abort()
    const controller = new AbortController()
    polygonsController = controller
    polygons.value = []
    polygonsStatus.value = AREA_STATUS.LOADING
    polygonsError.value = null

    try {
      const currentPolygons = await getPolygons(connectionFor(controller.signal))
      if (!isCurrentOperationalRequest(currentGeneration)) return

      polygons.value = currentPolygons
      polygonsStatus.value = currentPolygons.length === 0 ? AREA_STATUS.EMPTY : AREA_STATUS.READY
    } catch (requestError: unknown) {
      if (!isCurrentOperationalRequest(currentGeneration)) return
      if (isAbortError(requestError)) {
        polygons.value = []
        polygonsStatus.value = AREA_STATUS.ERROR
        polygonsError.value = 'La consulta de polígonos fue cancelada.'
        return
      }
      if (isSessionOrContextLost(requestError)) {
        clearForSessionOrContextLost(requestError)
        return
      }

      polygons.value = []
      polygonsStatus.value = isForbidden(requestError) ? AREA_STATUS.DENIED : AREA_STATUS.ERROR
      polygonsError.value = messageFor(requestError, 'los polígonos')
    } finally {
      if (polygonsController === controller) polygonsController = null
    }
  }

  function configureConnection(connection: ConnectionConfiguration = {}): void {
    const nextTenantCode = connection.tenantCode?.trim() ?? ''
    const nextUnitCode = connection.unitCode?.trim() ?? ''

    // T: la captura manual del baseline se conserva, pero ahora viaja a la
    // autoridad única. captureTenant avanza su generación ante un cambio real
    // y el watcher sync invalida y purga datos anteriores; no hay segundo
    // repository ni rehidratación desde storage.
    if (nextTenantCode !== session.tenantCode.trim()) {
      session.captureTenant(nextTenantCode)
      return
    }

    // U: la unidad vigente la decide la sesión (contexto/select-unit confirmados).
    // Un código manual distinto no se adopta — no se inventa elegibilidad —; sólo
    // descarta datos que podrían estar anclados a una unidad no consolidada.
    if (nextUnitCode && nextUnitCode !== session.unitCode.trim()) {
      invalidateDashboardSurface()
    }
  }

  // Terminal del dashboard ante un fallo de ensureContext. La autoridad del
  // error de sesión vive en SessionStore; aquí sólo se pinta la superficie de
  // datos, conservando la distinción de baseline 401 → SESSION_REQUIRED vs
  // 403 literal de tenant → CONTEXT_DENIED (mapeo del bug F1). Un 429/red/
  // schema no expira la sesión ni se clasifica como expiración por status solo.
  function applyContextFailure(contextError: AccessOperationError): void {
    if (contextError.status === 401) {
      status.value = DASHBOARD_STATUS.SESSION_REQUIRED
      error.value = 'La sesión requiere autenticación.'
      return
    }

    if (
      contextError.status === 403
      && contextError.detail === TENANT_CONTEXT_DENIED_DETAIL
    ) {
      status.value = DASHBOARD_STATUS.CONTEXT_DENIED
      error.value = contextError.detail
      return
    }

    status.value = DASHBOARD_STATUS.ERROR
    error.value = messageForAccessError(contextError)
  }

  async function loadDashboard(): Promise<void> {
    // Puerta de lectura autorizada: sin contexto coherente de sesión no hay
    // lectura operativa. booting/busy de contexto, cierre en vuelo y mutación
    // incierta se esperan; el dashboard no compite ni reintenta por su cuenta.
    if (
      session.logoutBusy
      || session.busy.context
      || session.busy.changeRequiredPassword
      || session.uncertainMutation
    ) {
      purgeForIneligibleSession()
      return
    }

    if (
      !session.tenantCode.trim()
      || session.status === SESSION_STATUS.ANONYMOUS
      || session.status === SESSION_STATUS.CONTEXT_LOST
    ) {
      purgeForIneligibleSession()
      return
    }

    // Flag true recibida del login o del contexto: bloquea datos operativos
    // sin exigir un GET previo ni fabricar contexto.
    if (
      session.identity?.must_change_password === true
      || session.context?.user.must_change_password === true
    ) {
      purgeForIneligibleSession()
      status.value = DASHBOARD_STATUS.PASSWORD_REQUIRED
      return
    }

    if (session.status === SESSION_STATUS.READY && session.context && !isOperationallyEligible()) {
      purgeForIneligibleSession()
      return
    }

    generation += 1
    let currentGeneration = generation
    ineligibleSurfacePurged = false
    summaryGeneration += 1
    abortPendingRequests()
    clearDashboardData()

    status.value = DASHBOARD_STATUS.LOADING

    // Única consulta de contexto compartida: ensureContext resuelve/cachea por
    // generación y singleflight. El dashboard jamás emite /auth/context/ propio.
    if (!session.context || session.status !== SESSION_STATUS.READY) {
      const contextDashboardGeneration = currentGeneration
      const contextSessionGeneration = session.generation
      const contextResult = await session.ensureContext()

      // Rechazo 401 / 403 literal de tenant de este mismo intento: la purga
      // de sesión ya descartó datos al avanzar su generación, y ese descarte
      // no debe perder el terminal compatible con el baseline (mapeo F1).
      if (
        (contextResult.kind === ACCESS_ACTION_RESULT.REJECTED
          || contextResult.kind === ACCESS_ACTION_RESULT.UNCERTAIN)
        && isAuthExpiryError(contextResult.error)
        && session.generation === contextSessionGeneration + 1
        && generation === contextDashboardGeneration + 1
        && readSessionStatus() === SESSION_STATUS.ANONYMOUS
        && session.context === null
        && session.identity === null
      ) {
        applyContextFailure(contextResult.error)
        return
      }

      if (
        contextResult.kind === ACCESS_ACTION_RESULT.SUCCESS
        && session.generation === contextSessionGeneration + 1
        && generation === contextDashboardGeneration + 1
        && session.status === SESSION_STATUS.READY
        && session.context?.user.id_usuario === contextResult.response.user.id_usuario
        && session.context?.tenant.code === contextResult.response.tenant.code
      ) {
        // ensureContext can advance generation while consolidating validated T/U.
        // Continue only this explicit load; the eligibility watcher never fetches.
        currentGeneration = generation
      }

      if (currentGeneration !== generation) return

      if (contextResult.kind === ACCESS_ACTION_RESULT.BLOCKED) {
        status.value = DASHBOARD_STATUS.IDLE
        return
      }
      if (
        contextResult.kind === ACCESS_ACTION_RESULT.REJECTED
        || contextResult.kind === ACCESS_ACTION_RESULT.UNCERTAIN
      ) {
        applyContextFailure(contextResult.error)
        return
      }
    }

    const activeContext = session.context
    if (activeContext === null) {
      status.value = DASHBOARD_STATUS.IDLE
      return
    }

    if (activeContext.user.must_change_password) {
      status.value = DASHBOARD_STATUS.PASSWORD_REQUIRED
      return
    }

    // Unidad consolidada en sesión: sin U confirmada no se inventa una y la
    // lectura operativa espera (G-SES-2: qué OP exigen U no está acreditado).
    if (!session.unitCode.trim()) {
      status.value = DASHBOARD_STATUS.IDLE
      return
    }

    if (!isCurrentOperationalRequest(currentGeneration)) return

    let activeLessonsController: AbortController | null = null

    try {
      const profilePromise = loadUserProfileFor(activeContext.user.id_usuario, currentGeneration)
      const polygonsPromise = loadPolygonsFor(currentGeneration)

      if (!isCurrentOperationalRequest(currentGeneration)) return
      lessonsStatus.value = AREA_STATUS.LOADING
      activeLessonsController = new AbortController()
      lessonsController = activeLessonsController
      const currentLessons = await getLessons(connectionFor(activeLessonsController.signal))
      if (!isCurrentOperationalRequest(currentGeneration)) return

      await Promise.all([profilePromise, polygonsPromise])
      if (!isCurrentOperationalRequest(currentGeneration)) return

      lessons.value = sortLessons(currentLessons)
      if (lessons.value.length === 0) {
        lessonsStatus.value = AREA_STATUS.EMPTY
        status.value = DASHBOARD_STATUS.EMPTY
        return
      }

      // El ready de sesión nunca se devuelve como éxito de datos: READY/EMPTY
      // sólo tras lecciones efectivas; un error de lecciones sigue ERROR sin
      // invalidar un contexto válido.
      lessonsStatus.value = AREA_STATUS.READY
      status.value = DASHBOARD_STATUS.READY
      selectedLessonId.value = lessons.value[0].id_leccion
      await loadSummaryFor(selectedLessonId.value, currentGeneration)
    } catch (requestError: unknown) {
      if (!isCurrentOperationalRequest(currentGeneration)) return
      if (isAbortError(requestError)) {
        lessons.value = []
        selectedLessonId.value = null
        lessonsStatus.value = AREA_STATUS.ERROR
        error.value = 'La consulta de las lecciones fue cancelada.'
        return
      }
      if (isSessionOrContextLost(requestError)) {
        clearForSessionOrContextLost(requestError)
        return
      }

      lessons.value = []
      selectedLessonId.value = null
      summary.value = null
      summaryStatus.value = AREA_STATUS.IDLE
      summaryError.value = null
      lessonsStatus.value = isForbidden(requestError) ? AREA_STATUS.DENIED : AREA_STATUS.ERROR
      status.value = DASHBOARD_STATUS.ERROR
      error.value = messageFor(requestError, 'las lecciones')
    } finally {
      if (lessonsController === activeLessonsController) lessonsController = null
    }
  }

  function selectLesson(id: number | string): Promise<void> | void {
    if (!isOperationallyEligible()) {
      purgeForIneligibleSession()
      return
    }

    ineligibleSurfacePurged = false
    const numericId = typeof id === 'number' ? id : Number(id)
    if (!Number.isSafeInteger(numericId) || numericId <= 0) return
    if (!lessons.value.some((lesson) => lesson.id_leccion === numericId)) return
    if (selectedLessonId.value === numericId) return

    summaryController?.abort()
    summaryGeneration += 1
    selectedLessonId.value = numericId
    summary.value = null
    summaryStatus.value = AREA_STATUS.IDLE
    summaryError.value = null

    if (status.value === DASHBOARD_STATUS.READY) {
      return loadSummaryFor(numericId, generation)
    }
  }

  function retry(): Promise<void> {
    return loadDashboard()
  }

  // Recarga SOLO el resumen de la lección seleccionada: es lo que promete el
  // control «Reconsultar» del bloque de métricas. El tablero completo queda en
  // la acción «Recargar tablero».
  function retrySummary(): Promise<void> {
    const lessonId = selectedLessonId.value
    if (lessonId === null) return Promise.resolve()
    if (!isOperationallyEligible()) {
      purgeForIneligibleSession()
      return Promise.resolve()
    }

    return loadSummaryFor(lessonId, generation)
  }

  // Purga de la superficie de datos del dashboard: aborta requests propios,
  // invalida generaciones y descarta datos/errores. T/U y sesión pertenecen a
  // SessionStore; un cierre de sesión completo se decide con session.purge()
  // o session.logout(), cuyo avance de generación ya dispara este descarte.
  function purge(): void {
    invalidateDashboardSurface()
    ineligibleSurfacePurged = !isOperationallyEligible()
  }

  return {
    status,
    context,
    lessons,
    selectedLessonId,
    summary,
    lessonsStatus,
    summaryStatus,
    summaryError,
    consultedAt,
    userProfile,
    polygons,
    profileStatus,
    polygonsStatus,
    profileError,
    polygonsError,
    error,
    tenantCode,
    unitCode,
    userDisplayName,
    polygonsById,
    selectedLesson,
    configureConnection,
    loadDashboard,
    selectLesson,
    retry,
    retrySummary,
    purge,
  }
})
