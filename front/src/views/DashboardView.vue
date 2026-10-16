<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useDashboardStore } from '../stores/dashboard'
import { useSessionStore } from '../stores/session'
import AccuracyProgress from '../components/AccuracyProgress.vue'
import ActiveLesson from '../components/ActiveLesson.vue'
import ConnectionForm from '../components/ConnectionForm.vue'
import ContextCard from '../components/ContextCard.vue'
import LessonList from '../components/LessonList.vue'
import MetricGrid from '../components/MetricGrid.vue'
import StateMessage from '../components/StateMessage.vue'
import {
  AREA_STATUS,
  DASHBOARD_STATUS,
  SESSION_OPERATION,
  SESSION_STATUS,
  type MessageTone,
  type PolygonLookup,
} from '../types'

interface DashboardNotice {
  title: string
  message: string
  tone: MessageTone
  actionLabel?: string
}

const props = withDefaults(defineProps<{ contextFormOpen?: boolean }>(), {
  contextFormOpen: true,
})

const emit = defineEmits<{
  'update:contextFormOpen': [value: boolean]
}>()

const store = useDashboardStore()
const session = useSessionStore()
const tenantDraft = shallowRef(session.tenantCode)
const loadedTenantCode = shallowRef<string | null>(null)
const localError = shallowRef('')
const contextFormOpen = computed({
  get: () => props.contextFormOpen,
  set: (value: boolean) => emit('update:contextFormOpen', value),
})
const emptyPolygonLookup: PolygonLookup = {}

const configChanged = computed(() => (
  loadedTenantCode.value !== null
  && tenantDraft.value.trim() !== loadedTenantCode.value
))

const canShowDashboard = computed(() => (
  session.status === SESSION_STATUS.READY
  && session.identity?.must_change_password !== true
  && Boolean(session.unitCode)
  && loadedTenantCode.value === session.tenantCode
  && (store.status === DASHBOARD_STATUS.READY || store.status === DASHBOARD_STATUS.EMPTY)
))

// El tecleo en el código de institución NO borra el tablero: la consulta
// anterior sigue visible con su aviso. Los datos sólo se ocultan cuando el
// envío es efectivo (connect/captureTenant reinician `loadedTenantCode`).

const selectedSummary = computed(() => {
  if (
    !canShowDashboard.value
    || (store.summaryStatus !== AREA_STATUS.READY && store.summaryStatus !== AREA_STATUS.EMPTY)
    || !store.summary
    || store.selectedLessonId === null
  ) return null

  return store.summary.id_leccion === store.selectedLessonId ? store.summary : null
})

const summaryNotice = computed<DashboardNotice | null>(() => {
  if (!canShowDashboard.value) return null

  if (store.selectedLessonId === null) {
    return {
      title: 'Resumen sin selección',
      message: 'Selecciona una lección para consultar sus métricas.',
      tone: 'info' as const,
    }
  }

  if (store.summaryStatus === AREA_STATUS.LOADING) {
    return {
      title: 'Cargando resumen',
      message: 'Consultando los datos de la lección seleccionada.',
      tone: 'info' as const,
    }
  }

  if (store.summaryStatus === AREA_STATUS.EMPTY && selectedSummary.value) {
    const lessonId = store.selectedLessonId
    return {
      title: 'Sin resultados registrados',
      message: lessonId === null
        ? 'La consulta no devolvió resultados de tiro para esta lección.'
        : `La lección #${lessonId} no tiene resultados de tiro registrados.`,
      tone: 'info' as const,
    }
  }

  if (store.summaryStatus === AREA_STATUS.DENIED) {
    return {
      title: 'Resumen no autorizado',
      message: store.summaryError ?? 'El backend no autorizó el acceso al resumen de esta lección.',
      tone: 'warning' as const,
    }
  }

  if (store.summaryStatus === AREA_STATUS.ERROR) {
    return {
      title: 'No se pudo cargar el resumen',
      message: store.summaryError ?? 'La consulta del resumen falló.',
      tone: 'danger' as const,
      actionLabel: 'Reconsultar',
    }
  }

  if (
    (store.summaryStatus === AREA_STATUS.READY || store.summaryStatus === AREA_STATUS.EMPTY)
    && !selectedSummary.value
  ) {
    return {
      title: 'Esperando resumen actualizado',
      message: 'No se muestran métricas de otra lección mientras se actualiza la selección.',
      tone: 'info' as const,
    }
  }

  return null
})

const globalNotice = computed<DashboardNotice | null>(() => {
  if (localError.value) {
    return {
      title: 'No se pudo completar la consulta',
      message: localError.value,
      tone: 'danger' as const,
      actionLabel: 'Recargar tablero',
    }
  }

  if (session.status === SESSION_STATUS.NEEDS_TENANT) {
    return {
      title: 'Institución requerida',
      message: 'Captura manualmente un código de institución para resolver el contexto.',
      tone: 'info' as const,
    }
  }

  if (session.status === SESSION_STATUS.BOOTING || store.status === DASHBOARD_STATUS.LOADING) {
    return {
      title: 'Consultando el backend',
      message: 'Cargando las consultas disponibles para el contexto confirmado.',
      tone: 'info' as const,
    }
  }

  if (session.status === SESSION_STATUS.FAILURE) {
    return {
      title: session.failure?.operation === SESSION_OPERATION.CONTEXT
        ? 'No se pudo confirmar el contexto'
        : 'La sesión requiere atención',
      message: session.failure?.detail ?? 'La operación no se resolvió. Reintenta de forma explícita.',
      tone: 'danger' as const,
      actionLabel: session.tenantCode
        && (session.failure?.operation === SESSION_OPERATION.CONTEXT
          || session.failure?.operation === SESSION_OPERATION.SELECT_UNIT)
        ? 'Reconsultar'
        : undefined,
    }
  }

  if (session.status === SESSION_STATUS.CONTEXT_LOST) {
    return {
      title: 'Contexto perdido',
      message: 'El contexto confirmado ya no tiene una institución activa.',
      tone: 'warning' as const,
    }
  }

  if (session.status === SESSION_STATUS.ANONYMOUS || store.status === DASHBOARD_STATUS.SESSION_REQUIRED) {
    return {
      title: 'Se requiere una sesión activa',
      message: store.error ?? 'Inicia sesión para continuar.',
      tone: 'warning' as const,
    }
  }

  if (store.status === DASHBOARD_STATUS.CONTEXT_DENIED) {
    return {
      title: 'Contexto no autorizado',
      message: store.error ?? 'El backend rechazó el contexto indicado. Revisa el código de institución.',
      tone: 'warning' as const,
    }
  }

  if (store.status === DASHBOARD_STATUS.PASSWORD_REQUIRED) {
    return {
      title: 'Cambio de contraseña requerido',
      message: 'Completa el cambio de contraseña antes de consultar el dashboard. Ese flujo no está incluido aquí.',
      tone: 'warning' as const,
    }
  }

  if (session.identity?.must_change_password) {
    return {
      title: 'Cambio de contraseña requerido',
      message: 'Completa el cambio de contraseña antes de consultar el dashboard.',
      tone: 'warning' as const,
    }
  }

  if (store.status === DASHBOARD_STATUS.ERROR) {
    return {
      title: store.lessonsStatus === AREA_STATUS.DENIED
        ? 'Lecciones no autorizadas'
        : 'No se pudo cargar el dashboard',
      message: store.error ?? 'La consulta al backend falló.',
      tone: store.lessonsStatus === AREA_STATUS.DENIED ? 'warning' as const : 'danger' as const,
      actionLabel: 'Recargar tablero',
    }
  }

  if (configChanged.value) {
    return {
      title: 'Contexto modificado',
      message: 'Consulta el nuevo código de institución cuando lo tengas completo. Los datos en pantalla son del contexto vigente.',
      tone: 'info' as const,
    }
  }

  if (!session.unitCode && session.status === SESSION_STATUS.READY) {
    return {
      title: 'Unidad requerida',
      message: 'Selecciona una unidad disponible antes de consultar datos operativos.',
      tone: 'info' as const,
    }
  }

  if (store.status === DASHBOARD_STATUS.IDLE && tenantDraft.value.trim()) {
    return {
      title: 'Consulta pendiente',
      message: 'Envía el código para consultar el contexto y las lecciones reales.',
      tone: 'info' as const,
    }
  }

  return null
})

const profileNotice = computed(() => {
  if (store.profileStatus === AREA_STATUS.DENIED) {
    return {
      title: 'Perfil no autorizado',
      message: store.profileError ?? 'El backend no autorizó la lectura del perfil.',
      tone: 'warning' as const,
    }
  }
  if (store.profileStatus === AREA_STATUS.ERROR) {
    return {
      title: 'No se pudo cargar el perfil',
      message: store.profileError ?? 'La consulta del perfil falló.',
      tone: 'danger' as const,
    }
  }
  return null
})

const polygonsNotice = computed(() => {
  if (store.polygonsStatus === AREA_STATUS.DENIED) {
    return {
      title: 'Polígonos no autorizados',
      message: store.polygonsError ?? 'El backend no autorizó la lectura de polígonos.',
      tone: 'warning' as const,
    }
  }
  if (store.polygonsStatus === AREA_STATUS.ERROR) {
    return {
      title: 'No se pudieron cargar los polígonos',
      message: store.polygonsError ?? 'La consulta de polígonos falló.',
      tone: 'danger' as const,
    }
  }
  if (store.polygonsStatus === AREA_STATUS.EMPTY) {
    return {
      title: 'Sin polígonos disponibles',
      message: 'El backend no devolvió polígonos para este contexto.',
      tone: 'info' as const,
    }
  }
  return null
})

const lessonStatus = computed(() => (canShowDashboard.value ? store.lessonsStatus : AREA_STATUS.IDLE))
const visibleLessons = computed(() => (canShowDashboard.value ? store.lessons : []))
const visibleContext = computed(() => (canShowDashboard.value ? session.context : null))
const visiblePolygonsById = computed<PolygonLookup>(() => (
  canShowDashboard.value ? store.polygonsById : emptyPolygonLookup
))
const selectedLesson = computed(() => {
  const selectedId = store.selectedLessonId
  if (selectedId === null) return null

  const selectedFromStore = store.selectedLesson
  if (selectedFromStore?.id_leccion === selectedId) return selectedFromStore

  return visibleLessons.value.find((lesson) => lesson.id_leccion === selectedId) ?? null
})

watch(
  () => store.status,
  (nextStatus) => {
    if (
      (nextStatus === DASHBOARD_STATUS.READY || nextStatus === DASHBOARD_STATUS.EMPTY)
      && session.status === SESSION_STATUS.READY
    ) {
      contextFormOpen.value = false
    }
  },
)

function canReadDashboard(): boolean {
  return session.status === SESSION_STATUS.READY
    && session.identity?.must_change_password !== true
    && Boolean(session.tenantCode.trim())
    && Boolean(session.unitCode.trim())
}

async function loadDashboardForSession(): Promise<void> {
  if (!canReadDashboard()) return

  store.configureConnection({ tenantCode: session.tenantCode, unitCode: session.unitCode })
  await store.loadDashboard()
  if (store.status === DASHBOARD_STATUS.READY || store.status === DASHBOARD_STATUS.EMPTY) {
    loadedTenantCode.value = session.tenantCode
    contextFormOpen.value = false
  }
}

onMounted(() => {
  if (!canReadDashboard()) return
  loadedTenantCode.value = session.tenantCode
  void loadDashboardForSession().catch(() => {
    localError.value = 'No se pudo cargar el dashboard. Reintenta de forma explícita.'
  })
})

// Un cambio de unidad (o cualquier avance de la sesión) purga la superficie de
// datos y deja el tablero en IDLE. Al recuperar la elegibilidad se reconsulta
// con el flujo existente: la pantalla nunca queda muda sin salida visible, y
// con datos del contexto anterior no re-pinta.
watch(
  () => canReadDashboard(),
  (eligible) => {
    if (!eligible) return
    void loadDashboardForSession().catch(() => {
      localError.value = 'No se pudo cargar el dashboard. Reintenta de forma explícita.'
    })
  },
)

async function connect(): Promise<void> {
  const nextTenantCode = tenantDraft.value.trim()
  if (!nextTenantCode || session.busy.context) return

  loadedTenantCode.value = null
  localError.value = ''
  contextFormOpen.value = true

  try {
    session.captureTenant(nextTenantCode)
    await session.ensureContext()
    tenantDraft.value = session.tenantCode
    await loadDashboardForSession()
  } catch {
    localError.value = 'La conexión no pudo completarse. Revisa la conexión local y reintenta.'
  }
}

// Reconsulta explícita sólo en el estado sano del resumen: los terminales de
// carga/error/denegación ya traen su propio control en el aviso.
const summaryReloadVisible = computed<boolean>(() => (
  canShowDashboard.value
  && store.selectedLessonId !== null
  && (store.summaryStatus === AREA_STATUS.READY || store.summaryStatus === AREA_STATUS.EMPTY)
))

// Marca de tiempo de la última consulta del resumen («Consultado a las HH:MM»).
const consultedLabel = computed<string | null>(() => {
  const at = store.consultedAt
  if (!at) return null
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(at)
})

// Anuncio de la selección para lectores de pantalla (región viva local).
const lessonAnnouncement = shallowRef('')

// Seleccionar una lección lleva la vista al resumen (que está más arriba) y lo
// anuncia: el clic no debe cambiar cifras fuera de pantalla en silencio.
async function selectLesson(lessonId: number | string): Promise<void> {
  await store.selectLesson(lessonId)
  lessonAnnouncement.value = `Resumen de la lección #${lessonId} seleccionado.`
  await nextTick()
  document.getElementById('metrics-title')?.scrollIntoView({ block: 'start' })
}

// «Reconsultar» del resumen: recarga SOLO el resumen (el global es «Recargar tablero»).
function retrySummary(): void {
  void store.retrySummary()
}

async function retry(): Promise<void> {
  if (session.busy.context) return
  localError.value = ''
  loadedTenantCode.value = null

  try {
    if (
      session.status === SESSION_STATUS.FAILURE
      && session.tenantCode
      && (session.failure?.operation === SESSION_OPERATION.CONTEXT
        || session.failure?.operation === SESSION_OPERATION.SELECT_UNIT)
    ) {
      await session.ensureContext()
      if (canReadDashboard()) await loadDashboardForSession()
      return
    }

    if (session.status === SESSION_STATUS.FAILURE) return

    if (canReadDashboard()) {
      store.configureConnection({ tenantCode: session.tenantCode, unitCode: session.unitCode })
      await store.retry()
      if (store.status === DASHBOARD_STATUS.READY || store.status === DASHBOARD_STATUS.EMPTY) {
        loadedTenantCode.value = session.tenantCode
      }
    }
  } catch {
    localError.value = 'La consulta volvió a fallar. Revisa la conexión local y reintenta.'
  }
}
// Desplegable de contexto: botón + panel SIEMPRE renderizado y recortado (no
// `<details>` nativo). Así la apertura es de la misma naturaleza que el cierre:
// animación WAAPI sobre un árbol ya renderizado, con medición síncrona fiable.
const contextDisclosurePanel = shallowRef<HTMLDivElement | null>(null)
const disclosureOpen = ref(false)
const DISCLOSURE_DURATION = 300
const DISCLOSURE_EASING = 'cubic-bezier(.22,.61,.36,1)'

let disclosureAnimation: Animation | null = null
let disclosureOpenIntent = false

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function clearDisclosureStyles(panel: HTMLElement): void {
  panel.style.height = ''
}

// Apertura/cierre del panel de contexto. El contenido vive siempre renderizado
// (sólo recortado), así que la medición es síncrona y fiable: sin frames ni
// cadenas de intentos. El click del botón cubre ratón y teclado.
function toggleContextDisclosure(): void {
  const panel = contextDisclosurePanel.value
  if (!panel) return

  if (prefersReducedMotion() || typeof panel.animate !== 'function') {
    disclosureOpen.value = !disclosureOpen.value
    disclosureOpenIntent = disclosureOpen.value
    return
  }

  // Sin animación en vuelo la intención es el estado real; con animación en
  // vuelo se conserva, para que un segundo click invierta el gesto (el estado
  // sólo se apaga al terminar el cierre).
  if (disclosureAnimation === null) disclosureOpenIntent = disclosureOpen.value
  const opening = !disclosureOpenIntent
  disclosureOpenIntent = opening

  disclosureAnimation?.cancel()

  if (opening) {
    // Clamp explícito antes de revelar: nada parpadea mientras se arranca.
    panel.style.height = '0px'
    disclosureOpen.value = true

    const targetHeight = panel.scrollHeight
    if (targetHeight <= 0) {
      // Sin objetivo válido no se anima, pero el panel queda abierto y limpio.
      clearDisclosureStyles(panel)
      return
    }

    const animation = panel.animate(
      [{ height: '0px' }, { height: `${targetHeight}px` }],
      { duration: DISCLOSURE_DURATION, easing: DISCLOSURE_EASING },
    )
    disclosureAnimation = animation
    void animation.finished
      .then(() => {
        if (disclosureAnimation !== animation) return
        disclosureAnimation = null
        clearDisclosureStyles(panel)
      })
      .catch(() => undefined)
    return
  }

  const currentHeight = panel.getBoundingClientRect().height
  const animation = panel.animate(
    [{ height: `${currentHeight}px` }, { height: '0px' }],
    { duration: DISCLOSURE_DURATION, easing: DISCLOSURE_EASING },
  )
  disclosureAnimation = animation
  void animation.finished
    .then(() => {
      if (disclosureAnimation !== animation) return
      disclosureAnimation = null
      disclosureOpen.value = false
      clearDisclosureStyles(panel)
    })
    .catch(() => undefined)
}

</script>

<template>
  <div class="dashboard-view">
    <header id="overview" class="page-head">
      <div>
        <h1 class="page-title">Control operativo</h1>
        <p class="page-subtitle">Estado de la lección seleccionada y sus resultados de tiro.</p>
      </div>
    </header>

    <section
      v-show="contextFormOpen"
      id="context-setup"
      class="context-setup"
      aria-label="Configurar contexto de consulta"
    >
      <ConnectionForm
        v-model:tenant-code="tenantDraft"
        :busy="session.busy.context"
        @submit="connect"
      />
    </section>

    <StateMessage
      v-if="globalNotice"
      class="global-notice"
      :title="globalNotice.title"
      :message="globalNotice.message"
      :tone="globalNotice.tone"
      :action-label="globalNotice.actionLabel"
      @action="retry"
    />

    <template v-if="canShowDashboard">
      <StateMessage
        v-if="profileNotice"
        class="global-notice"
        :title="profileNotice.title"
        :message="profileNotice.message"
        :tone="profileNotice.tone"
      />
      <StateMessage
        v-if="polygonsNotice"
        class="global-notice"
        :title="polygonsNotice.title"
        :message="polygonsNotice.message"
        :tone="polygonsNotice.tone"
      />

      <section class="overview-section" aria-labelledby="metrics-title">
        <ActiveLesson :lesson="selectedLesson" :polygons-by-id="visiblePolygonsById" />

        <StateMessage
          v-if="summaryNotice"
          class="summary-notice"
          :title="summaryNotice.title"
          :message="summaryNotice.message"
          :tone="summaryNotice.tone"
          :action-label="summaryNotice.actionLabel"
          @action="retrySummary"
        />

        <div class="section-heading">
          <h2 id="metrics-title" class="section-title">Resumen de la lección seleccionada</h2>
          <p v-if="consultedLabel" class="section-meta">Consultado a las {{ consultedLabel }}</p>
          <button
            v-if="summaryReloadVisible"
            class="btn btn-outline-primary"
            type="button"
            @click="retrySummary"
          >
            Reconsultar
          </button>
        </div>
        <p class="visually-hidden" role="status" aria-live="polite">{{ lessonAnnouncement }}</p>
        <MetricGrid :summary="selectedSummary" :status="store.summaryStatus" />
        <AccuracyProgress :summary="selectedSummary" :status="store.summaryStatus" />
      </section>

      <section id="lessons" class="dashboard-section" aria-labelledby="lessons-title">
        <LessonList
          :lessons="visibleLessons"
          :polygons-by-id="visiblePolygonsById"
          :selected-lesson-id="store.selectedLessonId"
          :status="lessonStatus"
          :error="store.error"
          @select="selectLesson"
          @retry="retry"
        />
      </section>

      <section id="context" class="context-details-section" aria-labelledby="context-details-title">
        <div class="context-disclosure">
          <button
            id="context-details-title"
            type="button"
            class="context-disclosure-summary"
            :aria-expanded="disclosureOpen"
            aria-controls="context-disclosure-panel"
            @click="toggleContextDisclosure"
          >
            <iconify-icon class="menu-caret" icon="ph:caret-down" aria-hidden="true"></iconify-icon>
            <span>Detalles del contexto consultado</span>
          </button>
          <div
            id="context-disclosure-panel"
            ref="contextDisclosurePanel"
            class="context-disclosure-panel"
            :class="{ 'is-open': disclosureOpen }"
            :inert="disclosureOpen ? undefined : true"
          >
            <ContextCard :context="visibleContext" />
          </div>
        </div>
      </section>
    </template>

    <footer class="footer">
      <div class="footer-inner">© {{ new Date().getFullYear() }} PoligonoTiro</div>
    </footer>
  </div>
</template>
