import { createApp, defineComponent, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardView from '../../src/views/DashboardView.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import type { AuthContext } from '../../src/types/contexto'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'
import type { Lesson, LessonSummary, Polygon, UserProfile } from '../../src/types/dashboard'

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

const LESSON_ID = 42
const DURATION = 300
const EASING = 'cubic-bezier(.22,.61,.36,1)'

interface AnimateCall {
  keyframes: unknown
  options: KeyframeAnimationOptions | number | undefined
}

const animateCalls: AnimateCall[] = []
let cancelCount = 0

const originalAnimate = Element.prototype.animate
const originalMatchMedia = window.matchMedia

function stubAnimate(
  this: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
  options?: number | KeyframeAnimationOptions,
): Animation {
  animateCalls.push({ keyframes, options })
  return {
    finished: Promise.resolve(),
    cancel: () => {
      cancelCount += 1
    },
  } as unknown as Animation
}

const STUB_COMPONENT = defineComponent({
  name: 'DashboardRouteStub',
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

function makeContext(): AuthContext {
  const raw: unknown = {
    user: { id_usuario: 701, rut: null, must_change_password: false },
    tenant: { code: 'tenant-fixture', context: 'context-fixture' },
    active_organization_unit: 'unit-fixture',
    unit_membership: { id: 801, unit_code: 'unit-fixture', unit_name: 'Unidad de prueba' },
    scopes: [],
    permissions: ['view_unit'],
    assignments: [],
  }
  return validateAuthContext(raw)
}

function makeLesson(): Lesson {
  return {
    id_leccion: LESSON_ID,
    id_poligono: 4,
    fecha_tiro: '2026-01-05',
    numero_orden: null,
    fecha_orden: null,
    tipo_tiro: 'evaluacion',
    cant_tiros_cereo: 5,
    cant_tiros_leccion: 20,
    distancia: 25,
    unidades_participantes_codes: ['unit-fixture'],
  }
}

function makeSummary(): LessonSummary {
  return {
    id_leccion: LESSON_ID,
    fracciones: 1,
    tiradores_unicos: 0,
    tiros_acertados_total: 0,
    tiros_total: 0,
  }
}

function makePolygons(): Polygon[] {
  return [{ id: 4, name: 'Polígono Norte', city: 'Santiago' }]
}

function makeProfile(): UserProfile {
  return {
    id: 701,
    grado: null,
    nombre: 'Ana',
    apellidoPaterno: 'Prueba',
    apellidoMaterno: 'Sistema',
  }
}

async function flushRound(): Promise<void> {
  for (let index = 0; index < 24; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function mountDashboard(): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  await router.push('/')
  await router.isReady()

  const session = useSessionStore(pinia)
  session.$patch({
    status: SESSION_STATUS.READY,
    tenantCode: 'tenant-fixture',
    unitCode: 'unit-fixture',
    identity: { id_usuario: 701, must_change_password: false, source: 'context' },
    context: makeContext(),
  } as Partial<SessionState>)

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(DashboardView)
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await flushRound()

  const harness = { pinia, router, app, host }
  harnesses.push(harness)
  return harness
}

function control(host: HTMLElement): HTMLButtonElement {
  const button = host.querySelector<HTMLButtonElement>('.context-disclosure-summary')
  if (!button) throw new Error('No se montó el control del desplegable.')
  return button
}

function panel(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('#context-disclosure-panel')
  if (!element) throw new Error('No se montó el panel del desplegable.')
  return element
}

/**
 * `inert` puede llegar como propiedad o como atributo según el DOM: jsdom
 * expone la propiedad sin reflejarla al atributo, los navegadores reflejan
 * ambas. Se consulta la propiedad cuando existe —que es lo que fija el binding
 * y lo que gobierna la accesibilidad— y el atributo como respaldo.
 */
function isInert(element: HTMLElement): boolean {
  const reflected = element as HTMLElement & { inert?: boolean }
  if (typeof reflected.inert === 'boolean') return reflected.inert
  return element.hasAttribute('inert')
}

/** Métricas de un elemento visible; jsdom devuelve 0 en ambos casos. */
function stubMetrics(element: HTMLElement, rectHeight: number, scrollHeight: number): void {
  element.getBoundingClientRect = () => ({ height: rectHeight }) as DOMRect
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  })
}

beforeEach(() => {
  animateCalls.length = 0
  cancelCount = 0
  Element.prototype.animate = stubAnimate as typeof Element.prototype.animate

  for (const double of Object.values(dashboardApiDoubles)) double.mockReset()
  dashboardApiDoubles.getLessons.mockResolvedValue([makeLesson()])
  dashboardApiDoubles.getLessonSummary.mockResolvedValue(makeSummary())
  dashboardApiDoubles.getPolygons.mockResolvedValue(makePolygons())
  dashboardApiDoubles.getUserProfile.mockResolvedValue(makeProfile())
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
  vi.restoreAllMocks()
})

describe('DashboardView: desplegable de contexto (botón + panel)', () => {
  it('arranca cerrado: control con aria-expanded false, panel recortado e inert', async () => {
    const harness = await mountDashboard()
    const button = control(harness.host)
    const content = panel(harness.host)

    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(button.getAttribute('aria-controls')).toBe('context-disclosure-panel')
    expect(button.textContent ?? '').toContain('Detalles del contexto consultado')
    expect(content.classList.contains('is-open')).toBe(false)
    expect(isInert(content)).toBe(true)
    // El contenido existe siempre (sólo se recorta): nada se desmonta.
    expect(content.querySelector('.context-card')).not.toBeNull()
  })

  it('abre animando en 300ms con el easing pactado y deja el panel accesible', async () => {
    const harness = await mountDashboard()
    const button = control(harness.host)
    const content = panel(harness.host)
    stubMetrics(content, 0, 240)

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    // Clamp antes de animar y medición en el mismo tick.
    expect(content.style.height).toBe('0px')
    expect(animateCalls).toHaveLength(1)
    expect(animateCalls[0]?.keyframes).toEqual([{ height: '0px' }, { height: '240px' }])
    expect((animateCalls[0]?.options as KeyframeAnimationOptions).duration).toBe(DURATION)
    expect((animateCalls[0]?.options as KeyframeAnimationOptions).easing).toBe(EASING)

    // El estado de Vue se pinta en el tick siguiente.
    await nextTick()
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(content.classList.contains('is-open')).toBe(true)
    expect(isInert(content)).toBe(false)

    await flushRound()
    // Al terminar se limpia el inline: el alto vuelve al de la clase `is-open`.
    expect(content.style.height).toBe('')
    expect(button.getAttribute('aria-expanded')).toBe('true')
  })

  it('cierra animando, apaga el estado al terminar y vuelve a inert', async () => {
    const harness = await mountDashboard()
    const button = control(harness.host)
    const content = panel(harness.host)
    stubMetrics(content, 0, 240)

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    stubMetrics(content, 180, 240)
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(animateCalls).toHaveLength(2)
    expect(animateCalls[1]?.keyframes).toEqual([{ height: '180px' }, { height: '0px' }])
    expect((animateCalls[1]?.options as KeyframeAnimationOptions).duration).toBe(DURATION)
    expect((animateCalls[1]?.options as KeyframeAnimationOptions).easing).toBe(EASING)
    // El cierre no es instantáneo: el estado sigue abierto hasta terminar.
    expect(button.getAttribute('aria-expanded')).toBe('true')

    await flushRound()
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(content.classList.contains('is-open')).toBe(false)
    expect(isInert(content)).toBe(true)
    expect(content.style.height).toBe('')
  })

  it('sin objetivo válido no anima y jamás deja el panel clampado', async () => {
    const harness = await mountDashboard()
    const button = control(harness.host)
    const content = panel(harness.host)

    // Sin métricas reales (alto 0) no hay nada que animar.
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(animateCalls).toHaveLength(0)
    expect(content.style.height).toBe('')
    await nextTick()
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(isInert(content)).toBe(false)
  })

  it('revierte el gesto: cancela la animación en vuelo y parte del alto actual', async () => {
    const harness = await mountDashboard()
    const button = control(harness.host)
    const content = panel(harness.host)
    stubMetrics(content, 0, 240)

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    // Segundo click sin dejar terminar la apertura: el cierre parte de donde iba.
    stubMetrics(content, 90, 240)
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(cancelCount).toBe(1)
    expect(animateCalls).toHaveLength(2)
    expect(animateCalls[1]?.keyframes).toEqual([{ height: '90px' }, { height: '0px' }])

    await flushRound()
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('con movimiento reducido no anima pero alterna el estado', async () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia

    const harness = await mountDashboard()
    const button = control(harness.host)
    const content = panel(harness.host)

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(animateCalls).toHaveLength(0)
    await nextTick()
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(isInert(content)).toBe(false)

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(animateCalls).toHaveLength(0)
    await nextTick()
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(isInert(content)).toBe(true)
  })

  it('sin WAAPI tampoco anima: el gesto sigue siendo operable', async () => {
    Element.prototype.animate = undefined as unknown as typeof Element.prototype.animate
    const harness = await mountDashboard()
    const button = control(harness.host)
    const content = panel(harness.host)

    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(animateCalls).toHaveLength(0)
    await nextTick()
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(isInert(content)).toBe(false)
  })
})
