import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface AnimateCall {
  keyframes: unknown
  options: KeyframeAnimationOptions | number | undefined
}

const animateCalls: AnimateCall[] = []
const originalAnimate = Element.prototype.animate

function stubAnimate(
  this: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
  options?: number | KeyframeAnimationOptions,
): Animation {
  animateCalls.push({ keyframes, options })
  return {
    finished: Promise.resolve(),
    cancel: () => undefined,
  } as unknown as Animation
}
import DashboardSidebar from '../../src/components/DashboardSidebar.vue'
import AppRoot from '../../src/App.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import { DEFAULT_DESIGN_SYSTEM_APPEARANCE } from '../../src/types/appearance'
import type { AuthContext } from '../../src/types/contexto'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'

const dashboardApiDoubles = vi.hoisted(() => ({
  getLessons: vi.fn(),
  getLessonSummary: vi.fn(),
  getPolygons: vi.fn(),
  getUserProfile: vi.fn(),
}))

vi.mock('../../src/api/dashboard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/dashboard')>()
  return {
    ...actual,
    getLessons: dashboardApiDoubles.getLessons,
    getLessonSummary: dashboardApiDoubles.getLessonSummary,
    getPolygons: dashboardApiDoubles.getPolygons,
    getUserProfile: dashboardApiDoubles.getUserProfile,
  }
})

const authApiDoubles = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  login: vi.fn(),
  selectUnit: vi.fn(),
}))

vi.mock('../../src/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/auth')>()
  return {
    ...actual,
    getAuthContext: authApiDoubles.getAuthContext,
    login: authApiDoubles.login,
    selectUnit: authApiDoubles.selectUnit,
  }
})

const appearanceApiDoubles = vi.hoisted(() => ({
  getDesignSystemAppearance: vi.fn(),
  putDesignSystemAppearance: vi.fn(),
  resetDesignSystemAppearance: vi.fn(),
}))

vi.mock('../../src/api/appearance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/appearance')>()
  return {
    ...actual,
    getDesignSystemAppearance: appearanceApiDoubles.getDesignSystemAppearance,
    putDesignSystemAppearance: appearanceApiDoubles.putDesignSystemAppearance,
    resetDesignSystemAppearance: appearanceApiDoubles.resetDesignSystemAppearance,
  }
})

const STUB_COMPONENT = defineComponent({
  name: 'SidebarGroupsRouteStub',
  render: () => null,
})

const TEST_ROUTES: RouteRecordRaw[] = routes.map((route) => ({
  path: route.path,
  name: route.name,
  meta: route.meta,
  component: STUB_COMPONENT,
}))

interface Harness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
}

const harnesses: Harness[] = []

const originalMatchMedia = window.matchMedia

// jsdom del entorno no trae matchMedia; el handler responsivo de App la usa.
function stubMatchMedia(matches = false): void {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('max-width') ? matches : false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

function makeContext(permissions: readonly string[] = []): AuthContext {
  const raw: unknown = {
    user: { id_usuario: 701, rut: null, must_change_password: false },
    tenant: { code: 'tenant-fixture', context: 'context-fixture' },
    active_organization_unit: 'unit-fixture',
    unit_membership: { id: 801, unit_code: 'unit-fixture', unit_name: 'Unidad de prueba' },
    scopes: [],
    permissions: [...permissions],
    assignments: [],
  }
  return validateAuthContext(raw)
}

async function flushRound(): Promise<void> {
  for (let index = 0; index < 24; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

function seedSession(pinia: Pinia, permissions: readonly string[] = []): void {
  const session = useSessionStore(pinia)
  session.$patch({
    status: SESSION_STATUS.READY,
    tenantCode: 'tenant-fixture',
    unitCode: 'unit-fixture',
    identity: { id_usuario: 701, must_change_password: false, source: 'context' },
    context: makeContext(permissions),
  } as Partial<SessionState>)
}

async function mountSidebar(
  options: { collapsed?: boolean; permissions?: readonly string[] } = {},
): Promise<Harness & { emissions: { toggleCollapse: number } }> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  await router.push('/')
  await router.isReady()
  seedSession(pinia, options.permissions)

  const host = document.createElement('div')
  document.body.appendChild(host)
  const emissions = { toggleCollapse: 0 }
  const app = createApp({
    render: () => h(DashboardSidebar, {
      collapsed: options.collapsed ?? false,
      mobileOpen: false,
      onToggleCollapse: () => {
        emissions.toggleCollapse += 1
      },
    }),
  })
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await nextTick()

  const harness = { pinia, router, app, host, emissions }
  harnesses.push(harness)
  return harness
}

async function mountApp(): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  await router.push('/')
  await router.isReady()
  seedSession(pinia, ['view_unit'])

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(AppRoot)
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await flushRound()

  const harness = { pinia, router, app, host }
  harnesses.push(harness)
  return harness
}

/** Panel de ítems del primer grupo de navegación, con su botón de título. */
function firstGroup(host: HTMLElement): { label: HTMLButtonElement; panel: HTMLElement } {
  const label = host.querySelector<HTMLButtonElement>('.sidebar-nav button.menu-label')
  const panelId = label?.getAttribute('aria-controls') ?? ''
  const panel = host.querySelector<HTMLElement>(`#${panelId}`)
  if (!label || !panel) throw new Error('No se encontró el grupo de navegación.')
  return { label, panel }
}

/** El panel se muestra por clase `is-open` (height auto); recortado = height 0. */
function isPanelOpen(element: HTMLElement): boolean {
  return element.classList.contains('is-open')
}

/** Métricas de un panel visible; jsdom devuelve 0 en ambas. */
function stubPanelMetrics(element: HTMLElement, scrollHeight: number, rectHeight: number): void {
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: scrollHeight })
  element.getBoundingClientRect = () => ({ height: rectHeight }) as DOMRect
}

/** Un elemento no oculto por `display`. */
function isVisible(element: HTMLElement): boolean {
  return element.style.display !== 'none'
}

/** Sin `is-open` el contenido está recortado: no debe quedar tabulable. */
function isInert(element: HTMLElement): boolean {
  const reflected = element as HTMLElement & { inert?: boolean }
  if (typeof reflected.inert === 'boolean') return reflected.inert
  return element.hasAttribute('inert')
}

beforeEach(() => {
  animateCalls.length = 0
  Element.prototype.animate = stubAnimate as typeof Element.prototype.animate
  stubMatchMedia(false)
  for (const double of Object.values(dashboardApiDoubles)) double.mockReset()
  for (const double of Object.values(authApiDoubles)) double.mockReset()
  for (const double of Object.values(appearanceApiDoubles)) double.mockReset()

  dashboardApiDoubles.getLessons.mockResolvedValue([])
  dashboardApiDoubles.getLessonSummary.mockResolvedValue(null)
  dashboardApiDoubles.getPolygons.mockResolvedValue([])
  dashboardApiDoubles.getUserProfile.mockResolvedValue(null)
  appearanceApiDoubles.getDesignSystemAppearance.mockResolvedValue(
    structuredClone(DEFAULT_DESIGN_SYSTEM_APPEARANCE),
  )
})

afterEach(() => {
  Element.prototype.animate = originalAnimate
  window.matchMedia = originalMatchMedia
  for (const harness of harnesses.splice(0)) {
    harness.app.unmount()
    harness.host.remove()
    harness.router.options.history.destroy()
    for (const route of harness.router.getRoutes()) {
      if (route.name !== undefined) harness.router.removeRoute(route.name)
    }
    disposePinia(harness.pinia)
  }
  setActivePinia(undefined)
  document.body.replaceChildren()
  document.body.classList.remove('sidebar-collapsed', 'sidebar-open')
  vi.restoreAllMocks()
})

describe('DashboardSidebar: grupos plegables desde el título', () => {
  it('todos parten cerrados y el título los abre y cierra libremente', async () => {
    const harness = await mountSidebar({ permissions: ['view_unit'] })
    const { label, panel } = firstGroup(harness.host)

    expect(label.tagName).toBe('BUTTON')
    expect(label.getAttribute('type')).toBe('button')
    expect(label.textContent ?? '').toContain('Organización')
    // Default del contrato nuevo: plegado, recortado y fuera de tabulación.
    expect(label.getAttribute('aria-expanded')).toBe('false')
    expect(isPanelOpen(panel)).toBe(false)
    expect(isInert(panel)).toBe(true)
    expect(panel.querySelectorAll('a.menu-link').length).toBeGreaterThan(0)

    stubPanelMetrics(panel, 240, 240)

    // Abrir: clamp previo, animación propia y limpieza al terminar.
    label.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(panel.style.height).toBe('0px')
    expect(animateCalls).toHaveLength(1)
    expect((animateCalls[0]?.options as KeyframeAnimationOptions).duration).toBe(300)
    expect((animateCalls[0]?.options as KeyframeAnimationOptions).easing)
      .toBe('cubic-bezier(.22,.61,.36,1)')
    expect(animateCalls[0]?.keyframes).toEqual([{ height: '0px' }, { height: '240px' }])
    await nextTick()
    expect(label.getAttribute('aria-expanded')).toBe('true')
    expect(isPanelOpen(panel)).toBe(true)
    expect(isInert(panel)).toBe(false)

    await flushRound()
    expect(panel.style.height).toBe('')

    // Cerrar: misma animación y estado apagado al terminar.
    label.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(animateCalls).toHaveLength(2)
    expect(animateCalls[1]?.keyframes).toEqual([{ height: '240px' }, { height: '0px' }])
    await flushRound()
    await nextTick()

    expect(label.getAttribute('aria-expanded')).toBe('false')
    expect(isPanelOpen(panel)).toBe(false)
    expect(isInert(panel)).toBe(true)
    expect(panel.style.height).toBe('')
  })

  it('sin objetivo válido no anima y jamás deja el panel clampado', async () => {
    const harness = await mountSidebar({ permissions: ['view_unit'] })
    const { label, panel } = firstGroup(harness.host)

    // Sin métricas reales (alto 0) no hay nada que animar.
    label.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    expect(animateCalls).toHaveLength(0)
    expect(panel.style.height).toBe('')
    expect(label.getAttribute('aria-expanded')).toBe('true')
    expect(isPanelOpen(panel)).toBe(true)
    expect(isInert(panel)).toBe(false)
  })

  it('los grupos de un solo ítem son entradas de primer nivel, sin acordeón', async () => {
    const harness = await mountSidebar({ permissions: ['view_unit'] })

    // Dashboard y Contexto tienen un ítem: ni rótulo-botón ni panel plegable.
    const labels = [...harness.host.querySelectorAll('.sidebar-nav button.menu-label')]
      .map((label) => label.textContent?.trim() ?? '')
    expect(labels).not.toContain('Dashboard')
    expect(labels).not.toContain('Contexto')

    const dashboardLink = harness.host.querySelector<HTMLAnchorElement>('a.menu-link[href="/"]')
    expect(dashboardLink).not.toBeNull()
    const wrapper = dashboardLink?.closest<HTMLElement>('.menu-group-items')
    // Plano: siempre abierto, sin `inert` ni animación.
    expect(wrapper?.classList.contains('is-open')).toBe(true)
    expect(isInert(wrapper!)).toBe(false)
    expect(animateCalls).toHaveLength(0)
  })

  it('el grupo de la ruta activa se pliega como cualquier otro y no se reabre al navegar', async () => {
    const harness = await mountSidebar({ permissions: ['view_unit'] })
    // Ruta activa dentro del grupo «Organización» (con acordeón).
    await harness.router.push('/organizacion/unidades')
    await nextTick()

    const active = [...harness.host.querySelectorAll<HTMLButtonElement>('.sidebar-nav button.menu-label')]
      .find((label) => label.getAttribute('data-active') === 'true')
    expect(active).toBeDefined()
    // Activo no significa expandido: el contrato nuevo no fuerza nada.
    expect(active?.getAttribute('aria-expanded')).toBe('false')

    const panelId = active?.getAttribute('aria-controls') ?? ''
    const panel = harness.host.querySelector<HTMLElement>(`#${panelId}`)!
    active?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()
    expect(active?.getAttribute('aria-expanded')).toBe('true')
    expect(isPanelOpen(panel)).toBe(true)

    active?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()
    expect(active?.getAttribute('aria-expanded')).toBe('false')

    // Navegar dentro del mismo grupo no lo reabre: manda la elección del usuario.
    await harness.router.push('/organizacion/puestos')
    await flushRound()
    expect(active?.getAttribute('aria-expanded')).toBe('false')
    expect(isPanelOpen(panel)).toBe(false)
  })

  it('con el sidebar achicado los ítems se muestran aunque el grupo esté plegado', async () => {
    const harness = await mountSidebar({ collapsed: true, permissions: ['view_unit'] })
    const { label, panel } = firstGroup(harness.host)

    // Plegado por defecto y, aun así, los ítems presentes (sólo iconos).
    expect(label.getAttribute('aria-expanded')).toBe('false')
    expect(isPanelOpen(panel)).toBe(true)
    expect(isInert(panel)).toBe(false)

    // Abrirlo tampoco los esconde y NO anima nada: el modo achicado es seco.
    label.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    expect(animateCalls).toHaveLength(0)
    expect(label.getAttribute('aria-expanded')).toBe('true')
    expect(isPanelOpen(panel)).toBe(true)
  })

  it('en colapsado cada enlace conserva su nombre accesible', async () => {
    const harness = await mountSidebar({ collapsed: true, permissions: ['view_unit'] })
    const link = harness.host.querySelector<HTMLAnchorElement>('a.menu-link')

    expect(link?.getAttribute('aria-label')).toBe('Resumen')
    expect(link?.getAttribute('title')).toBe('Resumen')
  })
})

describe('DashboardSidebar: control de colapso en el pie del sidebar', () => {
  it('el botón vive al fondo del sidebar, se anuncia y emite toggle-collapse', async () => {
    const harness = await mountSidebar()
    const button = harness.host.querySelector<HTMLButtonElement>('.sidebar-collapse-toggle')
    const footer = harness.host.querySelector<HTMLElement>('.sidebar-footer')
    const nav = harness.host.querySelector<HTMLElement>('.sidebar-nav')

    expect(button).not.toBeNull()
    expect(button?.tagName).toBe('BUTTON')
    expect(button?.getAttribute('aria-label')).toBe('Alternar menú lateral')
    expect(button?.getAttribute('aria-controls')).toBe('dashboard-sidebar')
    expect(button?.querySelector('iconify-icon')?.getAttribute('icon')).toBe('ph:sidebar-simple')
    expect(harness.host.querySelector('.topbar')).toBeNull()

    // Posición: en el pie, después del nav; la cabecera ya no tiene envoltorio.
    expect(footer).not.toBeNull()
    expect(footer?.contains(button!)).toBe(true)
    expect(harness.host.querySelector('.sidebar-header')).toBeNull()
    expect(nav?.compareDocumentPosition(footer!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // La marca vuelve a ser hija directa del aside.
    expect(harness.host.querySelector('.sidebar > .sidebar-brand')).not.toBeNull()

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(harness.emissions.toggleCollapse).toBe(1)
  })

  it('en modo achicado el botón sigue presente: es la única salida', async () => {
    const harness = await mountSidebar({ collapsed: true })
    const button = harness.host.querySelector<HTMLButtonElement>('.sidebar-collapse-toggle')
    const footer = harness.host.querySelector<HTMLElement>('.sidebar-footer')

    expect(button).not.toBeNull()
    expect(footer?.contains(button!)).toBe(true)
    expect(button?.hidden).toBe(false)
    expect(isVisible(button!)).toBe(true)
  })
})

describe('App.vue: cadena del control de colapso', () => {
  it('el botón del sidebar mueve el shell a modo achicado', async () => {
    const harness = await mountApp()
    const button = harness.host.querySelector<HTMLButtonElement>('.sidebar-collapse-toggle')

    expect(button).not.toBeNull()
    expect(document.body.classList.contains('sidebar-collapsed')).toBe(false)

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    // El binding @toggle-collapse llega al handler responsivo de App.
    expect(document.body.classList.contains('sidebar-collapsed')).toBe(true)
  })
})
