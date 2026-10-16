import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DashboardSidebar from '../../src/components/DashboardSidebar.vue'
import ExercisesView from '../../src/views/exercises/ExercisesView.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import type { AuthContext } from '../../src/types/contexto'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'

// Dobles de aislamiento de tests: sustituyen las llamadas de red por dobles
// locales para probar lógica de presentación. NO simulan funcionalidad de
// producto ni certifican runtime; las clases de error reales se conservan.
async function stubModuleApi(
  importOriginal: () => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  const actual = await importOriginal()
  const stubbed: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(actual)) {
    const isErrorClass = typeof value === 'function'
      && (value as { prototype?: unknown }).prototype instanceof Error
    stubbed[key] = typeof value === 'function' && !isErrorClass
      ? async () => []
      : value
  }
  return stubbed
}

vi.mock('../../src/features/exercises/api', async (importOriginal) => stubModuleApi(importOriginal))
vi.mock('../../src/features/armory/api', async (importOriginal) => stubModuleApi(importOriginal))
vi.mock('../../src/features/organization/api', async (importOriginal) => stubModuleApi(importOriginal))

const STUB_COMPONENT = defineComponent({
  name: 'DenialNavStub',
  render: () => null,
})

const TEST_ROUTES: RouteRecordRaw[] = routes.map((route) => ({
  path: route.path,
  name: route.name,
  meta: route.meta,
  component: STUB_COMPONENT,
}))

function makeContextFixture(permissions: readonly string[]): AuthContext {
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

interface Harness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
  session: ReturnType<typeof useSessionStore>
  closeSpy: ReturnType<typeof vi.fn>
}

const harnesses: Harness[] = []

async function flushRound(): Promise<void> {
  for (let index = 0; index < 16; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function mountSurface(
  component: object,
  path: string,
  permissions: readonly string[],
): Promise<Harness> {
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
    context: makeContextFixture(permissions),
  } as Partial<SessionState>)

  const closeSpy = vi.fn()
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent({
    render: () => h(component as never, { onClose: closeSpy }),
  }))
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await flushRound()

  const harness: Harness = { pinia, router, app, host, session, closeSpy }
  harnesses.push(harness)
  return harness
}

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

describe('navegación única por RouterLink (F4)', () => {
  it('el click del enlace navega una sola vez (única fuente) y conserva el cierre móvil', async () => {
    const harness = await mountSurface(DashboardSidebar, '/contexto', ['view_unit'])
    const link = harness.host.querySelector<HTMLAnchorElement>('a.menu-link[href="/organizacion/unidades"]')
    expect(link).not.toBeNull()

    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    await flushRound()

    // RouterLink es la única fuente de navegación (mecanismo legacy retirado)
    // y el emit `close` del drawer móvil se conservó.
    expect(harness.router.currentRoute.value.fullPath).toBe('/organizacion/unidades')
    expect(harness.closeSpy).toHaveBeenCalledTimes(1)
  })

  it('la marca navega al dashboard con principal+tenant y sin doble arbitraje', async () => {
    const harness = await mountSurface(DashboardSidebar, '/contexto', [])
    const brand = harness.host.querySelector<HTMLAnchorElement>('.sidebar-brand')
    brand?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    await flushRound()
    expect(harness.router.currentRoute.value.fullPath).toBe('/')
    expect(harness.closeSpy).toHaveBeenCalledTimes(1)
  })
})

describe('denegación accesible visible + aria-describedby (F2)', () => {
  it('sin create_exercises: botón deshabilitado con motivo visible en lenguaje de usuario', async () => {
    const harness = await mountSurface(ExercisesView, '/tiro/ejercicios', [])

    const hint = harness.host.querySelector<HTMLElement>('#exercises-create-hint')
    expect(hint?.textContent ?? '').toContain('Se requiere permiso para crear ejercicios y consumos')
    expect(hint?.textContent ?? '').toContain('El backend conserva la autoridad final')
    expect(hint?.getAttribute('role')).toBe('status')

    const create = harness.host.querySelector<HTMLButtonElement>('button[aria-describedby="exercises-create-hint"]')
    expect(create).not.toBeNull()
    expect(create?.disabled).toBe(true)
    // El patrón title-only con código de permiso fue retirado de este control.
    expect(create?.hasAttribute('title')).toBe(false)
  })

  it('con create_exercises acreditado: sin motivo visible y control habilitado', async () => {
    const harness = await mountSurface(ExercisesView, '/tiro/ejercicios', ['view_exercises', 'create_exercises'])
    expect(harness.host.querySelector('#exercises-create-hint')).toBeNull()
    const create = harness.host.querySelector<HTMLButtonElement>('button[aria-describedby="exercises-create-hint"]')
    expect(create).toBeNull()
    // El gating no cambió: con permiso, el botón existe y no está inhabilitado.
    const createButton = [...harness.host.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => (button.textContent ?? '').includes('Crear ejercicio'))
    expect(createButton?.disabled).toBe(false)
  })
})
