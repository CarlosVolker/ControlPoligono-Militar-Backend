import { createApp, defineComponent, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArmoryView from '../../src/views/armory/ArmoryView.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import type { ApiConnection } from '../../src/types/dashboard'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'

// Dobles de aislamiento de tests exclusivamente (el producto nunca ve mocks).
// Cubren las tres superficies que estas pruebas montan: armerías, calibres y
// ficha de arma.
const armoryApiDoubles = vi.hoisted(() => ({
  getArmories: vi.fn<(connection: ApiConnection) => Promise<unknown[]>>(),
  getArmory: vi.fn<(id: number, connection: ApiConnection) => Promise<unknown>>(),
  getWeapons: vi.fn<(connection: ApiConnection) => Promise<unknown[]>>(),
  getWeapon: vi.fn<(id: number, connection: ApiConnection) => Promise<unknown>>(),
  getCalibres: vi.fn<(connection: ApiConnection) => Promise<unknown[]>>(),
  getCalibre: vi.fn<(id: number, connection: ApiConnection) => Promise<unknown>>(),
  getActiveArmories: vi.fn<(connection: ApiConnection) => Promise<unknown[]>>(),
  getActiveCalibres: vi.fn<(connection: ApiConnection) => Promise<unknown[]>>(),
}))

vi.mock('../../src/features/armory/api', async (importOriginal) => {
  const actual = await importOriginal<object>()
  return { ...actual, ...armoryApiDoubles }
})

const sharedDomainDoubles = vi.hoisted(() => ({
  getOrganizationUnitsLookup: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
}))

vi.mock('../../src/api/shared/domain', async (importOriginal) => {
  const actual = await importOriginal<object>()
  return { ...actual, ...sharedDomainDoubles }
})

const STUB_COMPONENT = defineComponent({
  name: 'ArmorySurfaceStub',
  render: () => null,
})

const TEST_ROUTES: RouteRecordRaw[] = routes.map((route) => ({
  path: route.path,
  name: route.name,
  meta: route.meta,
  component: STUB_COMPONENT,
}))

function makeContext(permissions: string[] = []) {
  const raw: unknown = {
    user: { id_usuario: 701, rut: null, must_change_password: false },
    tenant: { code: 'tenant-fixture', context: 'context-fixture' },
    active_organization_unit: 'unit-fixture',
    unit_membership: null,
    scopes: [],
    permissions,
    assignments: [{
      role: 'encargado_almacen',
      scope: 'unidad_propia',
      organization_unit: 'unit-fixture',
      is_primary: true,
    }],
  }
  return validateAuthContext(raw)
}

const ARMORY_FIELDS = {
  id: 7,
  tenant: 2,
  organization_unit: 3,
  organization_unit_code: 'CIA-A',
  code: 'AR-7',
  name: 'Armería Test',
  descripcion: 'sintética',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  armas_count: 0,
}

interface Harness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
  text(): string
  reload(): Promise<void>
}

const harnesses: Harness[] = []

async function flushRound(): Promise<void> {
  for (let index = 0; index < 24; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

async function mountArmoryView(path: string): Promise<Harness> {
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
    context: makeContext(['view_warehouse', 'view_exercises']),
  } as Partial<SessionState>)

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(ArmoryView)
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await flushRound()

  const harness: Harness = {
    pinia,
    router,
    app,
    host,
    text: () => host.textContent ?? '',
    reload: async () => { await flushRound() },
  }
  harnesses.push(harness)
  return harness
}

function rowsIn(host: HTMLElement): string[] {
  return [...host.querySelectorAll('tbody tr')].map((row) => (row.textContent ?? '').trim())
}

function selectBy(id: string): HTMLSelectElement | null {
  return document.getElementById(id) as HTMLSelectElement | null
}

function chooseSelect(select: HTMLSelectElement, value: string): void {
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

beforeEach(() => {
  for (const fn of Object.values(armoryApiDoubles)) fn.mockReset()
  sharedDomainDoubles.getOrganizationUnitsLookup.mockReset()

  armoryApiDoubles.getArmories.mockResolvedValue([])
  armoryApiDoubles.getWeapons.mockResolvedValue([])
  armoryApiDoubles.getCalibres.mockResolvedValue([])
  armoryApiDoubles.getActiveArmories.mockResolvedValue([])
  armoryApiDoubles.getActiveCalibres.mockResolvedValue([])
  sharedDomainDoubles.getOrganizationUnitsLookup.mockResolvedValue({ results: [] })
})

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.app.unmount()
    harness.host.remove()
    harness.router.options.history.destroy()
    disposePinia(harness.pinia)
  }
  setActivePinia(undefined)
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('ArmoryView: filtro local por estado', () => {
  it('filtra armerías por estado, cuenta sobre la colección cargada y ofrece la vuelta a todas', async () => {
    armoryApiDoubles.getArmories.mockResolvedValue([
      { ...ARMORY_FIELDS, id: 7, code: 'AR-7', is_active: true },
      { ...ARMORY_FIELDS, id: 8, code: 'AR-8', name: 'Armería Baja', is_active: false },
    ])
    const harness = await mountArmoryView('/almacen/armerias')

    expect(harness.text()).toContain('2 de 2 armerías cargadas')
    expect(rowsIn(harness.host)).toHaveLength(2)

    const select = selectBy('armory-state')
    expect(select, 'selector de estado de armerías').not.toBeNull()
    chooseSelect(select!, 'inactive')
    await harness.reload()

    expect(harness.text()).toContain('1 de 2 armerías cargadas')
    expect(rowsIn(harness.host)).toHaveLength(1)
    expect(harness.text()).toContain('AR-8')
    expect(harness.text()).toContain('Filtro por estado:')

    const reset = [...harness.host.querySelectorAll('button')]
      .find((button) => (button.textContent ?? '').trim() === 'Ver todas las armerías')
    expect(reset, 'vuelta a todas las armerías').not.toBeNull()
    reset?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await harness.reload()

    expect(harness.text()).toContain('2 de 2 armerías cargadas')
    expect(rowsIn(harness.host)).toHaveLength(2)
    expect(harness.text()).not.toContain('Filtro por estado:')
  })

  it('sin coincidencias por estado el vacío lo dice y no lo atribuye a la búsqueda', async () => {
    armoryApiDoubles.getArmories.mockResolvedValue([
      { ...ARMORY_FIELDS, id: 8, code: 'AR-8', is_active: false },
    ])
    const harness = await mountArmoryView('/almacen/armerias')

    chooseSelect(selectBy('armory-state')!, 'active')
    await harness.reload()

    expect(harness.text()).toContain('Ninguna armería coincide con el filtro de estado.')
    expect(harness.text()).toContain('0 de 1 armerías cargadas')
  })

  it('el filtro de estado se reinicia al cambiar de ruta', async () => {
    armoryApiDoubles.getArmories.mockResolvedValue([
      { ...ARMORY_FIELDS, id: 8, code: 'AR-8', is_active: false },
    ])
    armoryApiDoubles.getCalibres.mockResolvedValue([
      { id_calibre: 1, code: '5.56X45', nombre: '5.56x45 OTAN', is_active: true },
    ])
    const harness = await mountArmoryView('/almacen/armerias')

    chooseSelect(selectBy('armory-state')!, 'inactive')
    await harness.reload()
    expect(selectBy('armory-state')?.value).toBe('inactive')

    await harness.router.push('/almacen/calibres')
    await harness.reload()

    expect(selectBy('calibre-state'), 'selector de estado de calibres').not.toBeNull()
    expect(selectBy('calibre-state')?.value).toBe('all')
    expect(harness.text()).not.toContain('Filtro por estado:')
    expect(harness.text()).toContain('1 de 1 calibres cargados')
  })

  it('filtra calibres por estado sobre el catálogo cargado', async () => {
    armoryApiDoubles.getCalibres.mockResolvedValue([
      { id_calibre: 1, code: '5.56X45', nombre: '5.56x45 OTAN', is_active: true },
      { id_calibre: 2, code: '9X19', nombre: '9x19 Para', is_active: false },
    ])
    const harness = await mountArmoryView('/almacen/calibres')

    expect(harness.text()).toContain('2 de 2 calibres cargados')

    chooseSelect(selectBy('calibre-state')!, 'active')
    await harness.reload()

    expect(harness.text()).toContain('1 de 2 calibres cargados')
    expect(rowsIn(harness.host)).toHaveLength(1)
    expect(harness.text()).toContain('5.56X45')
    expect(harness.text()).not.toContain('9X19')

    const stateNote = [...harness.host.querySelectorAll('.filter-note')]
      .find((node) => (node.textContent ?? '').includes('Filtro por estado'))
    expect(stateNote?.querySelector('strong')?.textContent?.trim()).toBe('activos')

    const reset = [...harness.host.querySelectorAll('button')]
      .find((button) => (button.textContent ?? '').trim() === 'Ver todos los calibres')
    reset?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await harness.reload()
    expect(harness.text()).toContain('2 de 2 calibres cargados')
  })
})

describe('ArmoryView: explicación del gating de calibres', () => {
  it('declara el permiso y el rol requeridos junto al subtítulo del catálogo', async () => {
    const harness = await mountArmoryView('/almacen/calibres')

    const subtitles = [...harness.host.querySelectorAll('.calibres-card .card-header .card-subtitle')]
      .map((node) => (node.textContent ?? '').trim())
    expect(subtitles).toHaveLength(2)
    expect(subtitles[1]).toContain('permiso de calibres')
    expect(subtitles[1]).toContain('super administrador (super_admin)')
    expect(subtitles[1]).toContain('el catálogo queda en modo lectura')
  })
})

describe('ArmoryView: miga de pan de la ficha de arma', () => {
  it('la ficha muestra la ruta Inicio › Almacén › Armas › arma, con la página actual marcada', async () => {
    armoryApiDoubles.getWeapon.mockResolvedValue({
      id_arma: 3,
      tenant: 2,
      organization_unit: 3,
      armory: 1,
      armory_code: 'AR-7',
      armory_name: 'Armería Test',
      organization_unit_code: 'CIA-A',
      calibre_code: '5.56X45',
      tipo_arma: 'fusil',
      modelo_arma: 'Fusil Test',
      numero_serie: 'SER-3',
    })
    const harness = await mountArmoryView('/almacen/armas/3')

    const breadcrumb = harness.host.querySelector('nav.breadcrumb')
    expect(breadcrumb, 'miga de pan de la ficha').not.toBeNull()
    expect(breadcrumb?.getAttribute('aria-label')).toBe('Ruta de navegación')

    const links = [...breadcrumb!.querySelectorAll('a')]
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/almacen/armas'])
    expect(links.map((link) => (link.textContent ?? '').trim())).toEqual(['Inicio', 'Armas'])

    const current = breadcrumb!.querySelector('[aria-current="page"]')
    expect((current?.textContent ?? '').trim()).toBe('Fusil Test')
  })

  it('las listas del almacén no muestran miga de pan', async () => {
    const harness = await mountArmoryView('/almacen/armerias')
    expect(harness.host.querySelector('nav.breadcrumb')).toBeNull()
  })
})
