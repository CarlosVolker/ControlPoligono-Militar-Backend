import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardView from '../../src/views/DashboardView.vue'
import DashboardTopbar from '../../src/components/DashboardTopbar.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { useDashboardStore } from '../../src/stores/dashboard'
import { validateAuthContext } from '../../src/api/dashboard'
import { ACCESS_ACTION_RESULT } from '../../src/types/auth'
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

const authApiDoubles = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  selectUnit: vi.fn(),
}))

vi.mock('../../src/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/auth')>()
  return {
    ...actual,
    getAuthContext: authApiDoubles.getAuthContext,
    selectUnit: authApiDoubles.selectUnit,
  }
})

const LESSON_ID = 42

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

function makeContext(unitCode: string): AuthContext {
  const raw: unknown = {
    user: {
      id_usuario: 701,
      rut: null,
      must_change_password: false,
    },
    tenant: { code: 'tenant-fixture', context: 'context-fixture' },
    active_organization_unit: unitCode,
    unit_membership: { id: 801, unit_code: unitCode, unit_name: `Unidad ${unitCode}` },
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
  for (let index = 0; index < 32; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

function contextChip(host: HTMLElement, label: string): string | null {
  for (const item of host.querySelectorAll<HTMLElement>('.topbar-context-item')) {
    if (item.querySelector('span')?.textContent?.trim() === label) {
      return item.querySelector('strong')?.textContent?.trim() ?? null
    }
  }
  return null
}

function seedSession(pinia: Pinia, unitCode: string): ReturnType<typeof useSessionStore> {
  const session = useSessionStore(pinia)
  session.$patch({
    status: SESSION_STATUS.READY,
    tenantCode: 'tenant-fixture',
    unitCode,
    identity: { id_usuario: 701, must_change_password: false, source: 'context' },
    context: makeContext(unitCode),
  } as Partial<SessionState>)
  return session
}

async function mountTopbar(unitCode: string, contextUnitCode = unitCode): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  await router.push('/')
  await router.isReady()
  seedSession(pinia, unitCode)

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({
    render: () => h(DashboardTopbar, { context: makeContext(contextUnitCode), userName: 'Ana Prueba' }),
  })
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await nextTick()

  const harness = { pinia, router, app, host }
  harnesses.push(harness)
  return harness
}

async function mountDashboard(unitCode: string): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  await router.push('/')
  await router.isReady()
  seedSession(pinia, unitCode)

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

beforeEach(() => {
  for (const double of Object.values(dashboardApiDoubles)) double.mockReset()
  for (const double of Object.values(authApiDoubles)) double.mockReset()

  dashboardApiDoubles.getLessons.mockResolvedValue([makeLesson()])
  dashboardApiDoubles.getLessonSummary.mockResolvedValue(makeSummary())
  dashboardApiDoubles.getPolygons.mockResolvedValue(makePolygons())
  dashboardApiDoubles.getUserProfile.mockResolvedValue(makeProfile())

  authApiDoubles.getAuthContext.mockImplementation(
    async () => makeContext('unit-b') as unknown as AuthContext,
  )
  authApiDoubles.selectUnit.mockResolvedValue({
    kind: ACCESS_ACTION_RESULT.SUCCESS,
    response: {
      detail: 'Unidad activa actualizada.',
      organization_unit_code: 'unit-b',
      tenant_code: 'tenant-fixture',
    },
  })
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

describe('DashboardTopbar: chip duplicado retirado', () => {
  it('la barra no repite «Unidad activa»: queda el selector', async () => {
    const harness = await mountTopbar('unit-b', 'unit-a')

    expect(contextChip(harness.host, 'Institución')).toBe('tenant-fixture')
    expect(contextChip(harness.host, 'Membresía orgánica')).toBe('Unidad unit-a')
    // El chip de lectura desapareció de la barra (el selector es el vector único).
    expect(contextChip(harness.host, 'Unidad activa')).toBeNull()
  })

  it('el avatar muestra iniciales y anuncia el nombre real', async () => {
    const harness = await mountTopbar('unit-fixture')
    const trigger = harness.host.querySelector<HTMLButtonElement>('#actor-menu-trigger')

    expect(trigger?.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger?.getAttribute('aria-label')).toBe(
      'Abrir menú de identidad y contexto · Ana Prueba',
    )
    expect(trigger?.textContent?.trim()).toBe('AP')
  })
})

describe('DashboardView: cambio de unidad sin dejar el tablero mudo', () => {
  it('tras `selectUnit` exitoso el tablero reconsulta en lugar de quedar en IDLE', async () => {
    const harness = await mountDashboard('unit-fixture')
    const store = useDashboardStore(harness.pinia)
    const session = useSessionStore(harness.pinia)
    const callsAfterMount = dashboardApiDoubles.getLessons.mock.calls.length

    expect(callsAfterMount).toBe(1)
    expect(store.status).toBe('ready')

    const result = await session.selectUnit({ organization_unit_code: 'unit-b' })
    await flushRound()

    expect(result.kind).toBe(ACCESS_ACTION_RESULT.SUCCESS)
    expect(session.unitCode).toBe('unit-b')
    // La superficie se purgó con el avance de sesión y volvió a consultarse:
    // no queda en IDLE sin salida visible.
    expect(store.status).not.toBe('idle')
    expect(store.status).toBe('ready')
    expect(dashboardApiDoubles.getLessons.mock.calls.length).toBe(callsAfterMount + 1)
    expect(harness.host.textContent ?? '').toContain('Resumen de la lección seleccionada')
    // Y ninguna cifra del contexto anterior sobrevive al cambio.
    expect(harness.host.textContent ?? '')
      .toContain(`La lección #${LESSON_ID} no tiene resultados de tiro registrados.`)
  })
})
