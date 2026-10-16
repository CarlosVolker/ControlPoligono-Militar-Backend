import { createApp, defineComponent, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardTopbar from '../../src/components/DashboardTopbar.vue'
import { routes, ROUTE_NAMES } from '../../src/router/routes'
import { registerDashboardGuards } from '../../src/router/guards'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import type { AuthContext } from '../../src/types/contexto'
import type { ApiConnection } from '../../src/types/dashboard'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'
import {
  ACCESS_ACTION_RESULT,
  type AccessActionResult,
  type LoginRequest,
  type LoginResponse,
} from '../../src/types/auth'

const authApiDoubles = vi.hoisted(() => ({
  getAuthContext: vi.fn<(connection: ApiConnection) => Promise<AuthContext>>(),
  login: vi.fn<(
    request: LoginRequest,
    signal?: AbortSignal,
  ) => Promise<AccessActionResult<LoginResponse>>>(),
}))

vi.mock('../../src/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/auth')>()
  return {
    ...actual,
    getAuthContext: authApiDoubles.getAuthContext,
    login: authApiDoubles.login,
  }
})

const TEST_LOGIN: LoginRequest = {
  rut: 'test-only-identity',
  password: 'test-only-credential',
}

const STUB_COMPONENT = defineComponent({
  name: 'AccountNavStub',
  render: () => null,
})

const TEST_ROUTES: RouteRecordRaw[] = routes.map((route) => ({
  path: route.path,
  name: route.name,
  meta: route.meta,
  component: STUB_COMPONENT,
}))

interface RouterHarness {
  pinia: Pinia
  router: Router
  session: ReturnType<typeof useSessionStore>
}

const routerHarnesses: RouterHarness[] = []

function createRouterHarness(): RouterHarness {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  registerDashboardGuards(router)
  const session = useSessionStore(pinia)
  const harness = { pinia, router, session }
  routerHarnesses.push(harness)
  return harness
}

function makeContextFixture(): unknown {
  return {
    user: { id_usuario: 701, rut: null, must_change_password: false },
    tenant: { code: 'tenant-fixture', context: 'context-fixture' },
    active_organization_unit: 'unit-fixture',
    unit_membership: { id: 801, unit_code: 'unit-fixture', unit_name: 'Unidad de prueba' },
    scopes: [],
    permissions: [],
    assignments: [],
  }
}

async function loginThroughStore(
  session: ReturnType<typeof useSessionStore>,
  mustChangePassword = false,
): Promise<void> {
  authApiDoubles.login.mockResolvedValue({
    kind: ACCESS_ACTION_RESULT.SUCCESS,
    response: { id_usuario: 701, must_change_password: mustChangePassword },
  })
  const result = await session.login(TEST_LOGIN, 'tenant-fixture')
  expect(result.kind).toBe(ACCESS_ACTION_RESULT.SUCCESS)
}

beforeEach(() => {
  authApiDoubles.getAuthContext.mockReset()
  authApiDoubles.login.mockReset()
})

afterEach(() => {
  for (const harness of routerHarnesses.splice(0)) {
    harness.router.options.history.destroy()
    for (const route of harness.router.getRoutes()) {
      if (route.name !== undefined) harness.router.removeRoute(route.name)
    }
    disposePinia(harness.pinia)
  }
  for (const ui of topbarHarnesses.splice(0)) {
    ui.app.unmount()
    ui.host.remove()
    ui.router.options.history.destroy()
    disposePinia(ui.pinia)
  }
  setActivePinia(undefined)
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('/cuenta: clasificación principal-only (F2)', () => {
  it('la ruta declara requiresTenant:false y visibilidad de sesión compatible con plan1', () => {
    const accountRoute = routes.find((route) => route.name === ROUTE_NAMES.ACCOUNT)
    expect(accountRoute?.path).toBe('/cuenta')
    expect(accountRoute?.meta?.requiresTenant).toBe(false)
    expect(accountRoute?.meta?.visibility).toEqual({
      kind: 'session',
      requiresActiveTenant: false,
    })
  })

  it('sesión anónima: /cuenta va a login y retiene el destino sin GET', async () => {
    const harness = createRouterHarness()
    harness.session.purge()

    await harness.router.push('/cuenta?tab=credencial')

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(harness.session.pendingRedirect?.destination).toBe('/cuenta?tab=credencial')
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
  })

  it('identidad de login sin contexto: /cuenta resuelve sin exigir tenant/contexto y sin GET (degradación AC-1/AC-2)', async () => {
    const harness = createRouterHarness()
    await loginThroughStore(harness.session)

    await harness.router.push('/cuenta')

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.ACCOUNT)
    expect(harness.session.context).toBeNull()
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
  })

  it('must_change_password:true: el forzado gobierna, /cuenta no lo salta (AC-4)', async () => {
    const harness = createRouterHarness()
    await loginThroughStore(harness.session, true)

    await harness.router.push('/cuenta')

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.PASSWORD_REQUIRED)
  })

  it('/cuenta es destino de retorno válido y se consume tras consolidar (deep-link preservado)', async () => {
    const harness = createRouterHarness()
    harness.session.purge()
    await harness.router.push('/cuenta?tab=credencial')
    expect(harness.session.pendingRedirect?.destination).toBe('/cuenta?tab=credencial')

    await loginThroughStore(harness.session)
    authApiDoubles.getAuthContext.mockResolvedValue(validateAuthContext(makeContextFixture()))
    await harness.router.push('/')

    expect(harness.router.currentRoute.value.fullPath).toBe('/cuenta?tab=credencial')
    expect(harness.session.pendingRedirect).toBeNull()
  })
})

interface TopbarHarness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
  session: ReturnType<typeof useSessionStore>
}

const topbarHarnesses: TopbarHarness[] = []

async function mountTopbar(overrides: Partial<SessionState> = {}): Promise<TopbarHarness> {
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
    context: validateAuthContext(makeContextFixture()),
    ...overrides,
  } as Partial<SessionState>)

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(DashboardTopbar)
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await nextTick()

  const harness: TopbarHarness = { pinia, router, app, host, session }
  topbarHarnesses.push(harness)
  return harness
}

function openActorMenu(harness: TopbarHarness): void {
  const trigger = harness.host.querySelector<HTMLButtonElement>('#actor-menu-trigger')
  expect(trigger).not.toBeNull()
  trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

function menuItems(harness: TopbarHarness): { label: string; href: string | null }[] {
  return [...harness.host.querySelectorAll<HTMLElement>('[role="menuitem"]')].map((item) => ({
    label: item.textContent?.trim() ?? '',
    href: item.getAttribute('href'),
  }))
}

describe('menú de usuario: «Mi cuenta» (F4, AC-6)', () => {
  it('principal acreditado: «Mi cuenta» visible hacia /cuenta y «Mi ficha» conserva su destino', async () => {
    const harness = await mountTopbar()
    openActorMenu(harness)

    const items = menuItems(harness)
    const account = items.find((item) => item.label === 'Mi cuenta')
    const ficha = items.find((item) => item.label === 'Mi ficha')
    expect(account?.href).toBe('/cuenta')
    expect(ficha?.href).toBe('/personas/701')
  })

  it('sin principal: «Mi cuenta» no se renderiza y «Iniciar sesión» permanece', async () => {
    const harness = await mountTopbar({
      status: SESSION_STATUS.ANONYMOUS,
      identity: null,
      context: null,
    })
    openActorMenu(harness)

    const items = menuItems(harness)
    expect(items.some((item) => item.label === 'Mi cuenta')).toBe(false)
    expect(items.some((item) => item.label === 'Iniciar sesión')).toBe(true)
  })
})
