import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ActiveLesson from '../../src/components/ActiveLesson.vue'
import ShootingView from '../../src/views/shooting/ShootingView.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import type { AuthContext } from '../../src/types/contexto'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'

const shootingApiDoubles = vi.hoisted(() => ({
  getShootingLesson: vi.fn(),
  getLessonFractions: vi.fn(),
  getShootingPolygon: vi.fn(),
  getShootingPolygons: vi.fn(),
  getPolygonLessons: vi.fn(),
  getShootingLessons: vi.fn(),
}))

vi.mock('../../src/features/shooting/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/features/shooting/api')>()
  return {
    ...actual,
    getShootingLesson: shootingApiDoubles.getShootingLesson,
    getLessonFractions: shootingApiDoubles.getLessonFractions,
    getShootingPolygon: shootingApiDoubles.getShootingPolygon,
    getShootingPolygons: shootingApiDoubles.getShootingPolygons,
    getPolygonLessons: shootingApiDoubles.getPolygonLessons,
    getShootingLessons: shootingApiDoubles.getShootingLessons,
  }
})

const STUB_COMPONENT = defineComponent({
  name: 'ShootingRouteStub',
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
const simpleApps: Array<{ app: App; host: HTMLElement }> = []

/** Lee el `dd` del `<dt>` pedido en la reja de detalle de la superficie montada. */
function detailValue(host: HTMLElement, label: string): string | null {
  const groups = host.querySelectorAll<HTMLElement>('.shooting-detail-grid > div, .active-lesson-detail')
  for (const group of groups) {
    if (group.querySelector('dt')?.textContent?.trim() !== label) continue
    return group.querySelector('dd')?.textContent?.trim() ?? null
  }
  return null
}

/** Lee la celda de la primera fila de la tabla identificada por su caption y columna. */
function tableCell(host: HTMLElement, caption: string, column: string): string | null {
  for (const table of host.querySelectorAll<HTMLTableElement>('table')) {
    if (table.querySelector('caption')?.textContent?.trim() !== caption) continue
    const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent?.trim() ?? '')
    const index = headers.indexOf(column)
    if (index < 0) return null
    return table.querySelectorAll('tbody tr:first-child td')[index]?.textContent?.trim() ?? null
  }
  return null
}

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
    permissions: ['view_unit', 'view_personnel_basic'],
    assignments: [],
  }
  return validateAuthContext(raw)
}

function makeLessonDto(distancia: unknown): Record<string, unknown> {
  return {
    id_leccion: 3,
    tenant: 1,
    organization_unit: null,
    id_poligono: 4,
    fecha_tiro: '2026-01-05',
    numero_orden: null,
    fecha_orden: null,
    tipo_tiro: 'evaluacion',
    cant_tiros_cereo: 5,
    cant_tiros_leccion: 20,
    distancia,
    unidades_participantes_codes: ['unit-fixture'],
  }
}

function makePolygonDto(distanciaMaxima: unknown): Record<string, unknown> {
  return {
    id_poligono: 4,
    tenant: 1,
    organization_unit: null,
    nombre: 'Polígono Norte',
    ciudad: 'Santiago',
    carriles_maximos: 12,
    distancia_maxima: distanciaMaxima,
  }
}

async function flushRound(): Promise<void> {
  for (let index = 0; index < 24; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function mountActiveLesson(lesson: Record<string, unknown>): Promise<HTMLElement> {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(ActiveLesson, { lesson }) })
  app.mount(host)
  await nextTick()
  simpleApps.push({ app, host })
  return host
}

async function mountShootingView(path: string): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  await router.push(path)
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
  const app = createApp(ShootingView)
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await flushRound()

  const harness = { pinia, router, app, host }
  harnesses.push(harness)
  return harness
}

beforeEach(() => {
  for (const double of Object.values(shootingApiDoubles)) double.mockReset()

  shootingApiDoubles.getLessonFractions.mockResolvedValue([])
  shootingApiDoubles.getShootingPolygon.mockResolvedValue(makePolygonDto(300))
  shootingApiDoubles.getShootingPolygons.mockResolvedValue([makePolygonDto(300)])
  shootingApiDoubles.getPolygonLessons.mockResolvedValue([makeLessonDto(25)])
  shootingApiDoubles.getShootingLessons.mockResolvedValue([makeLessonDto(50)])
})

afterEach(() => {
  for (const { app, host } of simpleApps.splice(0)) {
    app.unmount()
    host.remove()
  }
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

describe('ActiveLesson: Distancia con unidad', () => {
  it('muestra el valor del dominio en metros', async () => {
    const host = await mountActiveLesson({ distancia: 25 })

    expect(detailValue(host, 'Distancia')).toBe('25 m')
  })

  it('sin valor real: placeholder — y ninguna unidad colgando', async () => {
    const host = await mountActiveLesson({ distancia: null })

    expect(detailValue(host, 'Distancia')).toBe('—')
  })
})

describe('ShootingView: Distancia con unidad en el detalle de lección', () => {
  it('muestra el valor del dominio en metros', async () => {
    shootingApiDoubles.getShootingLesson.mockResolvedValue(makeLessonDto(25))
    const harness = await mountShootingView('/tiro/lecciones/3')

    expect(detailValue(harness.host, 'Distancia')).toBe('25 m')
  })

  it('sin valor real: placeholder — en la reja de detalle', async () => {
    shootingApiDoubles.getShootingLesson.mockResolvedValue(makeLessonDto(null))
    const harness = await mountShootingView('/tiro/lecciones/3')

    expect(detailValue(harness.host, 'Distancia')).toBe('—')
  })
})

describe('ShootingView: Distancia con unidad en la ficha del polígono', () => {
  it('«Distancia máxima» de la ficha y «Distancia» de la tabla de lecciones en metros', async () => {
    const harness = await mountShootingView('/tiro/poligonos/4')

    expect(detailValue(harness.host, 'Distancia máxima')).toBe('300 m')
    expect(tableCell(harness.host, 'Lecciones del polígono', 'Distancia')).toBe('25 m')
  })

  it('sin valor real: — en la ficha y en la celda de la tabla', async () => {
    shootingApiDoubles.getShootingPolygon.mockResolvedValue(makePolygonDto(null))
    shootingApiDoubles.getPolygonLessons.mockResolvedValue([makeLessonDto(null)])
    const harness = await mountShootingView('/tiro/poligonos/4')

    expect(detailValue(harness.host, 'Distancia máxima')).toBe('—')
    expect(tableCell(harness.host, 'Lecciones del polígono', 'Distancia')).toBe('—')
  })
})

describe('ShootingView: Distancia con unidad en tablas de lista', () => {
  it('«Distancia máxima» de la lista de polígonos y «Distancia» de lecciones visibles en metros', async () => {
    const polygons = await mountShootingView('/tiro/poligonos')
    expect(tableCell(polygons.host, 'Polígonos de tiro', 'Distancia máxima')).toBe('300 m')

    const lessons = await mountShootingView('/tiro/lecciones')
    expect(tableCell(lessons.host, 'Lecciones visibles en el contexto actual', 'Distancia')).toBe('50 m')
  })

  it('sin valor real: — en la celda de la lista de polígonos', async () => {
    shootingApiDoubles.getShootingPolygons.mockResolvedValue([makePolygonDto(null)])
    const harness = await mountShootingView('/tiro/poligonos')

    expect(tableCell(harness.host, 'Polígonos de tiro', 'Distancia máxima')).toBe('—')
  })
})
