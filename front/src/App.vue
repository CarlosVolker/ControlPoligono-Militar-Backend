<script setup lang="ts">
// Integración única F2 (plan frontend-access-session-f2 p2r2, §5#8): App es la
// superficie de composición. SessionStore es la fuente única de contexto/T/U/
// identidad/busy/logoutOutcome; DashboardStore sólo aporta datos y proyecciones.
// Sin meta nueva: la clasificación de layout vive aquí, por ROUTE_NAMES.
import { computed, nextTick, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppShell from './components/shell/AppShell.vue'
import AppTopbar from './components/shell/AppTopbar.vue'
import UnitSwitcher from './components/shell/UnitSwitcher.vue'
import FormFeedback from './components/ds/FormFeedback.vue'
import StateMessage from './components/StateMessage.vue'
import AppearanceEffects from './components/personalizer/AppearanceEffects.vue'
import { getAccessErrorMessages } from './api/auth'
import { ROUTE_NAMES, ROUTE_TITLES, type RouteName } from './router/routes'
import {
  buildVisibilitySnapshot,
  canViewSurface,
  isPrivilegedVisibility,
  ROUTE_VISIBILITY_KIND,
  visibilityOfMeta,
} from './router/visibility'
import type { RouteVisibility } from './router/visibility'
import { useDashboardStore } from './stores/dashboard'
import { useAppearanceStore } from './stores/appearance'
import { useSessionStore } from './stores/session'
import PersonalizerView from './views/appearance/PersonalizerView.vue'
import { ACCESS_ACTION_RESULT, type AccessOperationError } from './types/auth'
import { ACCESS_FEEDBACK_TONE, type AccessFeedback } from './types/access-ui'
import { SESSION_STATUS } from './types/session'
import type { SessionBusyState } from './types/session'
import { SHELL_THEME } from './types/shell'
import type { ShellTheme } from './types/shell'

// Login/recuperar/forzado usan el layout de autenticación sin sidebar: sus
// vistas renderizan su propio <main class="account-pages ..."> y App aplica la
// clase de fondo al body. App no anida otro main en AppShell. Dashboard/contexto/
// contexto-perdido y SCREEN-NOT-FOUND usan el shell de dashboard; el 404 aporta
// dentro de él la anatomía pages-404-alt.html:197-220.
const AUTH_LAYOUT_ROUTE_NAMES: readonly string[] = [
  ROUTE_NAMES.LOGIN,
  ROUTE_NAMES.RECOVERY,
  ROUTE_NAMES.PASSWORD_REQUIRED,
]

// Clases de <body> que exige el CSS real: `body.authentication-bg`
// (auth-signin.html:22) y la variante `.authentication-bg.auth-reset`
// (auth-password.html:22, que las vistas de recuperación/forzado declaran
// también en su main). Se activan por ruta y se retiran al cambiar de ruta o
// desmontar App: sin fuga global.
const AUTH_BODY_BASE_CLASS = 'authentication-bg'
const AUTH_BODY_RESET_CLASS = 'auth-reset'
let ownsAuthBodyBaseClass = false
let ownsAuthBodyResetClass = false

const dashboard = useDashboardStore()
const session = useSessionStore()
const appearance = useAppearanceStore()
const route = useRoute()
const router = useRouter()

const contextFormOpen = shallowRef(true)
const sidebarCollapsed = shallowRef(false)
const mobileSidebarOpen = shallowRef(false)
const theme = shallowRef<ShellTheme>(
  document.documentElement.dataset.theme === SHELL_THEME.LIGHT
    ? SHELL_THEME.LIGHT
    : SHELL_THEME.DARK,
)
theme.value = appearance.snapshot.theme

// Feedback del flujo contexto (resultados vigentes de captureTenant→
// ensureContext, selectUnit y retry). Ningún POST/GET se duplica desde App: los
// handlers aguardan la acción del store y leen el estado actual sólo después.
const contextFeedback = shallowRef<AccessFeedback | null>(null)

const routeName = computed<string>(() => String(route.name ?? ''))
// Anuncio de la vista vigente para lectores de pantalla (región viva persistente).
const routeAnnouncement = shallowRef('')
const isAuthLayout = computed<boolean>(() => AUTH_LAYOUT_ROUTE_NAMES.includes(routeName.value))
const isContextRoute = computed<boolean>(() => routeName.value === ROUTE_NAMES.CONTEXT)
const isDashboardRoute = computed<boolean>(() => routeName.value === ROUTE_NAMES.DASHBOARD)
const isNotFoundRoute = computed<boolean>(() => routeName.value === ROUTE_NAMES.NOT_FOUND)
const isTenantContentRoute = computed<boolean>(
  () => route.meta.requiresTenant === true || isDashboardRoute.value,
)
const appearanceBarrierActive = computed<boolean>(
  () => isTenantContentRoute.value && !appearance.isTenantContentReady,
)

// Resolución compartida de visibilidad (plan frontend-permission-navigation,
// F3): el MISMO criterio y el mismo helper que consume el sidebar. Una
// superficie privilegiada denegada/unknown/stale/sin-criterio no monta la vista
// protegida ni sus loaders; conserva la URL, sin redirect, sin bucles y sin
// requests para averiguar permisos (AC-1/AC-2/AC-3). El gate de sesión/tenant
// sigue siendo del guard, intacto; la autoridad sigue siendo del backend: un
// 403 de negocio posterior sobre superficie permitida conserva ST-07 literal
// y no cierra sesión (AC-5, maquinaria vigente de SessionStore).
const visibilitySnapshot = computed(() => buildVisibilitySnapshot({
  status: session.status,
  context: session.context,
  principalId: session.identity?.id_usuario ?? null,
  tenantCode: session.tenantCode,
  logoutBusy: session.logoutBusy,
}))

const currentVisibility = computed<RouteVisibility>(() => visibilityOfMeta(route.meta))

const privilegedSurfaceDenied = computed<boolean>(
  () => isPrivilegedVisibility(currentVisibility.value)
    && !canViewSurface(currentVisibility.value, visibilitySnapshot.value),
)

// Motivo de denegación/limitación: reutiliza literales existentes del cliente
// (patrones de ShootingView, LoginView y IdentityView) adaptados sólo donde
// AC-2 exige presentar el motivo; el microcopy general pertenece a la spec UX
// hermana y no se rediseña aquí.
function deniedSurfaceReason(): string {
  const visibility = currentVisibility.value
  if (visibility.kind === ROUTE_VISIBILITY_KIND.CLOSED) {
    return 'El criterio de esta superficie no es verificable en el cliente. El backend conserva la autoridad final.'
  }
  if (!visibilitySnapshot.value.valid) {
    return 'No se pudo confirmar el contexto. El acceso permanece bloqueado.'
  }
  if (visibility.kind === ROUTE_VISIBILITY_KIND.PERMISSION) {
    return `La sesión actual no incluye ${visibility.code}. El backend conserva la autoridad final.`
  }
  if (visibility.kind === ROUTE_VISIBILITY_KIND.ROLE_CONTRACT) {
    return `La sesión actual no incluye ${visibility.roles.join(', ')}. El backend conserva la autoridad final.`
  }
  return 'Acceso denegado por el servidor o por el contexto actual.'
}

// Opciones de unidad: sólo códigos deduplicados realmente devueltos por el
// backend en assignments.organization_unit / unit_membership.unit_code
// (plan §5#6). No se infieren pertenencias.
const unitCodes = computed<string[]>(() => {
  const context = session.context
  if (!context) return []
  const codes = new Set<string>()
  for (const assignment of context.assignments) {
    const code = assignment.organization_unit?.trim()
    if (code) codes.add(code)
  }
  const membershipCode = context.unit_membership?.unit_code.trim()
  if (membershipCode) codes.add(membershipCode)
  return [...codes]
})

const activeUnitCode = computed<string | null>(() => session.unitCode.trim() || null)

// Sólo las rutas de auth presentan su propio <main> y activan las clases de
// body de authentication-bg. SCREEN-NOT-FOUND usa AppShell y no altera esas
// clases globales.
function syncBodyStandaloneClasses(): void {
  const name = routeName.value
  const isAuth = AUTH_LAYOUT_ROUTE_NAMES.includes(name)
  const isReset = name === ROUTE_NAMES.RECOVERY || name === ROUTE_NAMES.PASSWORD_REQUIRED
  const body = document.body

  if (isAuth) {
    if (!body.classList.contains(AUTH_BODY_BASE_CLASS)) {
      body.classList.add(AUTH_BODY_BASE_CLASS)
      ownsAuthBodyBaseClass = true
    }
  } else if (ownsAuthBodyBaseClass) {
    body.classList.remove(AUTH_BODY_BASE_CLASS)
    ownsAuthBodyBaseClass = false
  }

  if (isReset) {
    if (!body.classList.contains(AUTH_BODY_RESET_CLASS)) {
      body.classList.add(AUTH_BODY_RESET_CLASS)
      ownsAuthBodyResetClass = true
    }
  } else if (ownsAuthBodyResetClass) {
    body.classList.remove(AUTH_BODY_RESET_CLASS)
    ownsAuthBodyResetClass = false
  }
}

function toggleTheme(): void {
  const nextTheme = theme.value === SHELL_THEME.DARK
    ? SHELL_THEME.LIGHT
    : SHELL_THEME.DARK

  if (appearance.isAuthenticatedContentReady) {
    if (appearance.previewAxis('theme', nextTheme)) theme.value = nextTheme
    return
  }

  theme.value = nextTheme
}

function toggleSidebar(): void {
  if (window.matchMedia('(max-width: 767px)').matches) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
    return
  }

  sidebarCollapsed.value = !sidebarCollapsed.value
}

function closeMobileSidebarOnEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') mobileSidebarOpen.value = false
}

function setContextFormOpen(value: boolean): void {
  contextFormOpen.value = value
}

function handleTenantNavigationAttempt(event: MouseEvent): void {
  if (!isContextRoute.value || session.tenantCode.trim()) return
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
  ) return

  const target = event.target
  if (!(target instanceof Element)) return

  const link = target.closest('a[href]')
  if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== '_self')) return

  const destination = router.resolve(link.getAttribute('href') ?? '')
  if (destination.meta.requiresTenant !== true) return

  contextFeedback.value = {
    message: 'Esta ruta requiere una institución. Captura su código real en el formulario y pulsa «Consultar institución». Si el contexto habilita la ruta, se retomará la navegación solicitada.',
    tone: ACCESS_FEEDBACK_TONE.WARNING,
  }

  void nextTick(() => {
    const tenantCodeInput = document.getElementById('tenant-code')
    if (tenantCodeInput instanceof HTMLInputElement) tenantCodeInput.focus()
  })
}

async function navigateTo(name: string): Promise<void> {
  try {
    await router.push({ name })
  } catch {
    // Navegación interrumpida por una posterior: el guard resuelve la ruta
    // final; App no reintenta ni elige un destino manual alternativo.
  }
}

function messagesFor(error: AccessOperationError): string {
  const collected = getAccessErrorMessages(error).join('\n')
  if (collected) return collected
  return error.detail?.trim() ?? ''
}

// Feedback literal del backend. Sin mensaje real: null, para que la vista
// conserve su StateMessage de fallo sin texto inventado (plan §5#4/#6).
function rejectFeedback(error: AccessOperationError): AccessFeedback | null {
  const base = messagesFor(error)

  if (error.status === 429) {
    const waitMessage = error.retryAfter
      ? `El servidor limitó las consultas. Tiempo indicado para volver a consultar: ${error.retryAfter}.`
      : 'El servidor limitó las consultas. Vuelve a intentar más tarde.'
    return {
      message: base ? `${base} ${waitMessage}` : waitMessage,
      tone: ACCESS_FEEDBACK_TONE.WARNING,
    }
  }

  if (base) return { message: base, tone: ACCESS_FEEDBACK_TONE.DANGER }
  return null
}

// Cooldown select-unit (plan §5#6, fila 429): espera/Retry-After con envío
// deshabilitado durante la espera, sin retry automático ni replay al acabar
// —la expiración sólo libera el lock y la siguiente acción es explícita del
// usuario—. Estado transitorio de App: nada global, sin storage. El lock lo
// comparten ambas superficies desde aquí: UnitSwitcher por la shell prop
// unitSwitchBusy y ContextSelector por ContextView.busy.selectUnit derivado.
// busy de UI bloquea botones; no afirma requests en vuelo ni los cuenta.
const unitCooldownUntil = shallowRef<number | null>(null)
// Segundos restantes del enfriamiento, para el mensaje «Disponible en N s».
const unitCooldownSeconds = shallowRef(0)
let unitCooldownTimer: ReturnType<typeof setTimeout> | null = null
let unitCooldownTicker: ReturnType<typeof setInterval> | null = null

const unitCooldownActive = computed<boolean>(() => unitCooldownUntil.value !== null)

// Nombres de unidad disponibles en el contexto. El payload sólo trae el nombre
// de la membresía orgánica; las demás unidades de `assignments` llegan con
// código y no se inventa su nombre.
const unitNames = computed<Record<string, string>>(() => {
  const membership = session.context?.unit_membership
  const code = membership?.unit_code?.trim()
  const name = membership?.unit_name?.trim()
  return code && name ? { [code]: name } : {}
})

const unitSwitchBusy = computed<boolean>(
  () => session.busy.selectUnit || unitCooldownActive.value,
)

const contextBusy = computed<SessionBusyState>(() => (
  unitCooldownActive.value
    ? { ...session.busy, selectUnit: true }
    : session.busy
))

function stopUnitCooldownTicker(): void {
  if (unitCooldownTicker !== null) {
    clearInterval(unitCooldownTicker)
    unitCooldownTicker = null
  }
  unitCooldownSeconds.value = 0
}

function startUnitCooldownTicker(remainingMs: number): void {
  stopUnitCooldownTicker()
  const until = Date.now() + remainingMs
  unitCooldownSeconds.value = Math.ceil(remainingMs / 1000)
  unitCooldownTicker = setInterval(() => {
    const left = Math.ceil((until - Date.now()) / 1000)
    if (left <= 0) {
      stopUnitCooldownTicker()
      return
    }
    unitCooldownSeconds.value = left
  }, 1000)
}

function clearUnitCooldown(): void {
  if (unitCooldownTimer !== null) {
    clearTimeout(unitCooldownTimer)
    unitCooldownTimer = null
  }
  stopUnitCooldownTicker()
  unitCooldownUntil.value = null
}

// Retry-After llega crudo desde el header (api/http.ts:159). Sólo se aceptan
// las dos formas del contrato HTTP (RFC 9110 §10.2.3): delta-seconds entera
// no negativa o fecha. Ausente o inválido: no se inventa cantidad —el 429 se
// muestra y sólo continúa una acción explícita—.
function startUnitCooldown(retryAfter: string | null): void {
  clearUnitCooldown()
  const raw = retryAfter?.trim()
  if (!raw) return
  const now = Date.now()
  let remainingMs: number
  if (/^\d{1,9}$/.test(raw)) {
    remainingMs = Number(raw) * 1000
  } else {
    const asDate = Date.parse(raw)
    if (Number.isNaN(asDate)) return
    remainingMs = asDate - now
  }
  if (remainingMs <= 0) return
  unitCooldownUntil.value = now + remainingMs
  startUnitCooldownTicker(remainingMs)
  unitCooldownTimer = setTimeout(clearUnitCooldown, remainingMs)
}

// Sólo con el estado actual del store (no desde un resultado viejo): contexto
// vigente flag false + unidad consolidada, o flag true para que el guard
// resuelva el forzado. Unidad faltante: permanece en /contexto. El destino
// pendiente lo consume el único consumidor del guard, no App.
function navigateToDashboardIfConsolidated(): void {
  if (!isContextRoute.value) return
  if (session.status !== SESSION_STATUS.READY) return
  if (session.identity?.must_change_password === true) {
    void navigateTo(ROUTE_NAMES.DASHBOARD)
    return
  }
  if (session.identity?.must_change_password !== false) return
  if (!session.unitCode.trim() || !session.tenantCode.trim()) return
  void navigateTo(ROUTE_NAMES.DASHBOARD)
}

async function resolveContext(): Promise<void> {
  const result = await session.ensureContext()
  if (result.kind === ACCESS_ACTION_RESULT.SUCCESS) {
    contextFeedback.value = null
    navigateToDashboardIfConsolidated()
    return
  }
  if (
    result.kind === ACCESS_ACTION_RESULT.REJECTED
    || result.kind === ACCESS_ACTION_RESULT.UNCERTAIN
  ) {
    contextFeedback.value = rejectFeedback(result.error)
  }
  // BLOCKED (busy/estado inválido): descartar sin repaint de otro intento.
}

async function handleCaptureTenant(tenantCode: string): Promise<void> {
  if (session.logoutBusy) return
  const captured = tenantCode.trim()
  if (!captured) return
  contextFeedback.value = null
  session.captureTenant(captured)
  await resolveContext()
}

async function handleRetryContext(): Promise<void> {
  if (session.logoutBusy) return
  if (!session.tenantCode.trim()) return
  contextFeedback.value = null
  await resolveContext()
}

// Misma acción de sesión para UnitSwitcher (topbar) y ContextSelector
// (/contexto). El store ya adopta la unidad y reconsulta su contexto antes de
// resolver; App no emite un segundo POST/GET.
async function handleSelectUnit(organizationUnitCode: string): Promise<void> {
  if (session.logoutBusy) return
  // Ningún POST select-unit mientras rija un cooldown de 429 vigente.
  if (unitCooldownActive.value) return
  const code = organizationUnitCode.trim()
  if (!code) return
  contextFeedback.value = null
  const generationAtRequest = session.generation
  const result = await session.selectUnit({ organization_unit_code: code })
  if (result.kind === ACCESS_ACTION_RESULT.SUCCESS) {
    navigateToDashboardIfConsolidated()
    return
  }
  if (
    result.kind === ACCESS_ACTION_RESULT.REJECTED
    || result.kind === ACCESS_ACTION_RESULT.UNCERTAIN
  ) {
    contextFeedback.value = rejectFeedback(result.error)
    // El wait sólo aplica a la generación que sufrió el 429: si otra acción
    // avanzó la generación en vuelo, el cooldown sería un lock fantasma.
    if (
      result.error.status === 429
      && session.generation === generationAtRequest
    ) {
      startUnitCooldown(result.error.retryAfter)
    }
  }
  // BLOCKED: segunda activación compartida/inválida; sin otro POST, sin repaint.
}

// Cierre inmediato (plan §5#8): el store purga y adquiere logoutBusy antes de
// cualquier await. La única apariencia existente (data-theme gestionado por el
// shell) se resetea al default del DS (dark, index.html) sin crear
// personalizador ni persistencia. /login se presenta sin esperar el POST; un
// fallo posterior sólo acredita purga local (logoutOutcome en el store).
async function handleLogout(): Promise<void> {
  if (session.logoutBusy) return
  clearUnitCooldown()
  theme.value = SHELL_THEME.DARK
  contextFeedback.value = null

  const closing = session.logout()
  try {
    await router.replace({ name: ROUTE_NAMES.LOGIN })
  } catch {
    // Cierre en vuelo tras navegación más nueva: la purga local ya rigió.
  }
  await closing
}

// La navegación del sidebar es RouterLink (única fuente, plan
// frontend-ux-corrections F4); el arbitraje legacy de secciones fue retirado.

watch(routeName, () => {
  syncBodyStandaloneClasses()
  applyRouteTitle()
  void nextTick(focusRouteHeading)
})

// Título por ruta (WCAG 2.4.2) + anuncio en región viva + foco al encabezado de
// la vista (WCAG 2.4.3): una sola mecánica para todas las superficies.
function applyRouteTitle(): void {
  const name = routeName.value as RouteName
  const title = ROUTE_TITLES[name] ?? ''
  document.title = title ? `${title} | PoligonoTiro` : 'PoligonoTiro'
  routeAnnouncement.value = title
}

function focusRouteHeading(): void {
  const main = document.getElementById('main')
  if (!main) return

  const heading = main.querySelector<HTMLElement>('h1')
  const target = heading ?? main
  if (target === heading && !target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1')
  }
  target.focus()
}

onMounted(() => {
  applyRouteTitle()
})

watch(() => appearance.snapshot.theme, (value) => {
  theme.value = value
})

watch(
  () => session.identity?.id_usuario ?? null,
  () => {
    theme.value = appearance.snapshot.theme
  },
  { flush: 'sync' },
)

// El cooldown es transitorio de la generación vigente: cualquier avance (logout,
// recaptura de tenant, éxito de selección) retira el lock y su timer.
watch(() => session.generation, clearUnitCooldown)

onMounted(() => {
  syncBodyStandaloneClasses()
  window.addEventListener('keydown', closeMobileSidebarOnEscape)
})

onUnmounted(() => {
  clearUnitCooldown()
  if (ownsAuthBodyBaseClass) document.body.classList.remove(AUTH_BODY_BASE_CLASS)
  if (ownsAuthBodyResetClass) document.body.classList.remove(AUTH_BODY_RESET_CLASS)
  window.removeEventListener('keydown', closeMobileSidebarOnEscape)
})
</script>

<template>
  <AppearanceEffects />

  <!-- Región viva persistente: anuncia la vista tras cada navegación. -->
  <p class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
    {{ routeAnnouncement }}
  </p>

  <!-- Layout de autenticación sin sidebar: la vista es el <main> del DS. -->
  <RouterView v-if="isAuthLayout" />

  <!-- Shell DS para dashboard, contexto, contexto-perdido y 404-alt. -->
  <AppShell
    v-else
    :theme="theme"
    :user-name="dashboard.userDisplayName ?? 'Usuario no disponible'"
    :context="session.context"
    :tenant-code="session.tenantCode"
    :context-form-open="contextFormOpen"
    :sidebar-collapsed="sidebarCollapsed"
    :mobile-sidebar-open="mobileSidebarOpen"
    :unit-codes="unitCodes"
    :active-unit-code="activeUnitCode"
    :unit-switch-busy="unitSwitchBusy"
    :logout-busy="session.logoutBusy"
    @close="mobileSidebarOpen = false"
    @toggle-collapse="toggleSidebar"
    @click.capture="handleTenantNavigationAttempt"
  >
    <template #topbar>
      <AppTopbar
        :theme="theme"
        :user-name="dashboard.userDisplayName ?? 'Usuario no disponible'"
        :context="session.context"
        :context-form-open="contextFormOpen"
        :context-toggle-visible="isDashboardRoute"
        :logout-busy="session.logoutBusy"
        @toggle-sidebar="toggleSidebar"
        @toggle-theme="toggleTheme"
        @toggle-context="contextFormOpen = !contextFormOpen"
        @logout="handleLogout"
      >
        <UnitSwitcher
          v-if="unitCodes.length && !isNotFoundRoute"
          :unit-codes="unitCodes"
          :active-unit-code="activeUnitCode"
          :busy="unitSwitchBusy"
          :unit-names="unitNames"
          :cooldown-seconds="unitCooldownSeconds"
          @select-unit="handleSelectUnit"
        />
      </AppTopbar>
    </template>

    <!-- El aviso de contexto dejó la topbar (una alerta de varias líneas no
         cabe en 70px) y vive al inicio del área de contenido, junto al
         encabezado de la página que se está consultando. -->
    <FormFeedback
      v-if="!isContextRoute && !isNotFoundRoute"
      :feedback="contextFeedback"
      :busy="false"
    />

    <!-- Apariencia es una barrera adicional de presentación: impide pintar
         contenido tenant hasta que el store restauró para la identidad real.
         La misma superficie permite reintentar sin cerrar la ruta Personalizer.
         Acoplamiento registrado (plan frontend-ux-corrections F5): un fallo de
         restauración bloquea el contenido tenant por diseño (R-APAR-015);
         cambiar esa política o aplicar defaults está fuera de scope y es
         decisión separada del operador. -->
    <PersonalizerView v-if="appearanceBarrierActive" />

    <!-- Superficie privilegiada denegada (F3, AC-2): contenedor neutral de
         estado en lugar del RouterView protegido. La vista no se monta, no
         corre loaders ni mutaciones; la URL se conserva y el backend sigue
         siendo la autoridad. Precedente literal: la barrera de apariencia. -->
    <StateMessage
      v-else-if="privilegedSurfaceDenied"
      title="Acceso denegado"
      :message="deniedSurfaceReason()"
      tone="danger"
    />

    <!-- ContextView exige sus 8 props del contrato (access-ui.ts) y sus 4
         emits, cableados a las acciones explícitas de SessionStore. -->
    <RouterView
      v-else-if="isContextRoute"
      :context="session.context"
      :status="session.status"
      :tenant-code="session.tenantCode"
      :unit-codes="unitCodes"
      :active-unit-code="activeUnitCode"
      :busy="contextBusy"
      :logout-busy="session.logoutBusy"
      :feedback="contextFeedback"
      @capture-tenant="handleCaptureTenant"
      @select-unit="handleSelectUnit"
      @retry-context="handleRetryContext"
      @logout="handleLogout"
    />
    <RouterView
      v-else
      :context-form-open="isDashboardRoute ? contextFormOpen : undefined"
      @update:context-form-open="setContextFormOpen"
    />
    <footer v-if="isNotFoundRoute" class="footer">
      <div class="footer-inner">© {{ new Date().getFullYear() }} PoligonoTiro</div>
    </footer>
  </AppShell>
</template>
