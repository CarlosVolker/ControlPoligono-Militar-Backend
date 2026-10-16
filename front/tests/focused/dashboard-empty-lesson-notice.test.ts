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
import { routes, ROUTE_NAMES } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import type { AuthContext } from '../../src/types/contexto'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'
import type { ApiConnection, Lesson, LessonSummary, Polygon, UserProfile } from '../../src/types/dashboard'

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

const SELECTED_LESSON_ID = 42

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
    user: {
      id_usuario: 701,
      rut: null,
      must_change_password: false,
    },
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
    id_leccion: SELECTED_LESSON_ID,
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

/** Resumen real sin resultados: `tiradores_unicos === 0` → área EMPTY. */
function makeEmptySummary(): LessonSummary {
  return {
    id_leccion: SELECTED_LESSON_ID,
    fracciones: 1,
    tiradores_unicos: 0,
    tiros_acertados_total: 0,
    tiros_total: 0,
  }
}

/** Resumen sano: la lección sí tiene resultados registrados. */
function makeHealthySummary(): LessonSummary {
  return {
    id_leccion: SELECTED_LESSON_ID,
    fracciones: 2,
    tiradores_unicos: 3,
    tiros_acertados_total: 15,
    tiros_total: 20,
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

function summaryNotice(host: HTMLElement): HTMLElement | null {
  return host.querySelector<HTMLElement>('.summary-notice')
}

function metricsHeading(host: HTMLElement): HTMLElement | null {
  return host.querySelector<HTMLElement>('#metrics-title')
}

function lessonLink(host: HTMLElement): HTMLAnchorElement | null {
  return [...host.querySelectorAll<HTMLAnchorElement>('.active-lesson-card a')]
    .find((link) => (link.textContent ?? '').trim() === 'Ver lección en Tiro') ?? null
}

function reloadControl(host: HTMLElement): HTMLButtonElement | null {
  return [...host.querySelectorAll<HTMLButtonElement>('.section-heading button')]
    .find((button) => (button.textContent ?? '').trim() === 'Reconsultar') ?? null
}

beforeEach(() => {
  for (const double of Object.values(dashboardApiDoubles)) double.mockReset()

  dashboardApiDoubles.getLessons.mockResolvedValue([makeLesson()] as Lesson[])
  dashboardApiDoubles.getLessonSummary.mockResolvedValue(makeEmptySummary())
  dashboardApiDoubles.getPolygons.mockResolvedValue(makePolygons())
  dashboardApiDoubles.getUserProfile.mockResolvedValue(makeProfile())
})

afterEach(() => {
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

describe('DashboardView: vacío «Sin resultados registrados» en orden', () => {
  it('nombra la lección, va antes de las cifras y no lleva botón', async () => {
    const harness = await mountDashboard()
    const notice = summaryNotice(harness.host)
    const heading = metricsHeading(harness.host)

    expect(notice).not.toBeNull()
    expect(notice?.textContent ?? '').toContain(
      `La lección #${SELECTED_LESSON_ID} no tiene resultados de tiro registrados.`,
    )
    expect(notice?.classList.contains('alert-info')).toBe(true)
    // La explicación precede al bloque de cifras.
    expect(heading).not.toBeNull()
    expect(
      notice!.compareDocumentPosition(heading!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    // El aviso es informativo: la acción vive en la tarjeta, no aquí.
    expect(notice?.querySelector('button')).toBeNull()
  })

  it('el subtítulo del dashboard describe la superficie, no la procedencia del dato', async () => {
    const harness = await mountDashboard()

    expect(harness.host.textContent ?? '')
      .toContain('Estado de la lección seleccionada y sus resultados de tiro.')
    expect(harness.host.textContent ?? '')
      .toContain('Selecciona una lección para consultar su resumen.')
    expect(harness.host.textContent ?? '')
      .not.toContain('Lecciones y resultados consultados desde el backend.')
  })
})

describe('DashboardView: «Ver lección en Tiro» permanente en la tarjeta', () => {
  it('está presente con datos, es un enlace y navega por nombre de ruta', async () => {
    dashboardApiDoubles.getLessonSummary.mockResolvedValue(makeHealthySummary())
    const harness = await mountDashboard()
    const link = lessonLink(harness.host)

    expect(link).not.toBeNull()
    expect(summaryNotice(harness.host)).toBeNull()

    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flushRound()

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LESSON_DETAIL)
    expect(harness.router.currentRoute.value.params.idLeccion).toBe(String(SELECTED_LESSON_ID))
    expect(harness.router.currentRoute.value.path).toBe(`/tiro/lecciones/${SELECTED_LESSON_ID}`)
  })

  it('también está con el resumen vacío (no depende del estado del área)', async () => {
    const harness = await mountDashboard()

    expect(summaryNotice(harness.host)).not.toBeNull()
    expect(lessonLink(harness.host)).not.toBeNull()
  })
})

describe('DashboardView: reconsulta en estado sano', () => {
  it('el estado sano ofrece «Reconsultar» junto al encabezado y reconsulta', async () => {
    dashboardApiDoubles.getLessonSummary.mockResolvedValue(makeHealthySummary())
    const harness = await mountDashboard()
    const callsBefore = dashboardApiDoubles.getLessons.mock.calls.length

    const control = reloadControl(harness.host)
    expect(control).not.toBeNull()
    expect(control?.type).toBe('button')

    const summaryCallsBefore = dashboardApiDoubles.getLessonSummary.mock.calls.length
    const lessonsCallsBefore = dashboardApiDoubles.getLessons.mock.calls.length

    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    // Recarga SOLO el resumen: las lecciones no se vuelven a pedir.
    expect(dashboardApiDoubles.getLessonSummary.mock.calls.length).toBe(summaryCallsBefore + 1)
    expect(dashboardApiDoubles.getLessons.mock.calls.length).toBe(lessonsCallsBefore)
    // La reconsulta recompone el estado sano del resumen.
    expect(summaryNotice(harness.host)).toBeNull()
    expect(reloadControl(harness.host)).not.toBeNull()
  })

  it('no se ofrece «Reconsultar» duplicado cuando el aviso ya trae el suyo', async () => {
    dashboardApiDoubles.getLessonSummary.mockRejectedValue(new Error('sin resumen'))
    const harness = await mountDashboard()
    const notice = summaryNotice(harness.host)

    expect(notice?.textContent ?? '').toContain('No se pudo cargar el resumen')
    expect(notice?.textContent ?? '').toContain('Reconsultar')
    // El control sano no aparece mientras el área está en error.
    expect(reloadControl(harness.host)).toBeNull()
  })
})

describe('DashboardView: el aviso de error conserva su reconsulta', () => {
  it('un fallo de resumen sigue reconsultando y no navega', async () => {
    dashboardApiDoubles.getLessonSummary.mockRejectedValue(new Error('sin resumen'))
    const harness = await mountDashboard()

    const summaryCallsBefore = dashboardApiDoubles.getLessonSummary.mock.calls.length
    const lessonsCallsBefore = dashboardApiDoubles.getLessons.mock.calls.length
    summaryNotice(harness.host)
      ?.querySelector<HTMLButtonElement>('button.state-action')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    expect(dashboardApiDoubles.getLessonSummary.mock.calls.length).toBe(summaryCallsBefore + 1)
    expect(dashboardApiDoubles.getLessons.mock.calls.length).toBe(lessonsCallsBefore)
    expect(harness.router.currentRoute.value.path).toBe('/')
  })
})
