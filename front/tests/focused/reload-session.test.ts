import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  RouterView,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginView from '../../src/views/auth/LoginView.vue'
import { DashboardApiError } from '../../src/api/dashboard'
import { registerDashboardGuards } from '../../src/router/guards'
import { ROUTE_NAMES, routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { ACCESS_ACTION_RESULT, type LoginRequest } from '../../src/types/auth'
import { SESSION_STATUS } from '../../src/types/session'

// Dobles de aislamiento: la reconstrucción de sesión por recarga se prueba
// contra un contexto fingido; nada de esto simula producto ni certifica
// runtime. Regresión del defecto «hard reload expulsa la sesión»: la URL
// porta el tenant (?tenant=) y la cookie de sesión se revalida contra el
// GET /api/auth/context/ del doble.
const authApiDoubles = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('../../src/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/auth')>()
  return {
    ...actual,
    getAuthContext: authApiDoubles.getAuthContext,
    login: authApiDoubles.login,
    logout: authApiDoubles.logout,
  }
})

const TENANT = 'tenant-fixture'

const TEST_LOGIN: LoginRequest = {
  rut: 'test-only-identity',
  password: 'test-only-credential',
}

const STUB_COMPONENT = { name: 'ReloadSessionStub', render: () => null }

interface Harness {
  pinia: Pinia
  router: Router
  session: ReturnType<typeof useSessionStore>
}

interface Mount {
  app: App
  host: HTMLElement
}

const harnesses: Harness[] = []
const mounts: Mount[] = []

function makeContextFixture(): unknown {
  return {
    user: { id_usuario: 701, rut: null, must_change_password: false },
    tenant: { code: TENANT, context: 'context-fixture' },
    active_organization_unit: 'unit-fixture',
    unit_membership: { id: 801, unit_code: 'unit-fixture', unit_name: 'Unidad de prueba' },
    scopes: [],
    permissions: [],
    assignments: [],
  }
}

// Montaje fresco del router/store = recarga dura: la memoria arranca vacía y
// el tenant llega sólo por la query de la navegación.
function createHarness(options: { realLoginView?: boolean } = {}): Harness {
  const pinia = createPinia()
  setActivePinia(pinia)
  const testRoutes: RouteRecordRaw[] = routes.map((route) => ({
    path: route.path,
    name: route.name,
    meta: route.meta,
    component: options.realLoginView && route.name === ROUTE_NAMES.LOGIN
      ? LoginView
      : STUB_COMPONENT,
  }))
  const router = createRouter({ history: createMemoryHistory(), routes: testRoutes })
  registerDashboardGuards(router)
  const session = useSessionStore(pinia)
  const harness = { pinia, router, session }
  harnesses.push(harness)
  return harness
}

function mountRouterView(harness: Harness): Mount {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent({
    name: 'ReloadSessionRoot',
    render: () => h(RouterView),
  }))
  app.use(harness.pinia)
  app.use(harness.router)
  app.mount(host)
  const mount = { app, host }
  mounts.push(mount)
  return mount
}

async function flushRound(): Promise<void> {
  for (let index = 0; index < 24; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

function fillInput(input: HTMLInputElement, value: string): void {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function loginThroughStore(session: ReturnType<typeof useSessionStore>): Promise<void> {
  authApiDoubles.login.mockResolvedValue({
    kind: ACCESS_ACTION_RESULT.SUCCESS,
    response: { id_usuario: 701, must_change_password: false },
  })
  const result = await session.login(TEST_LOGIN, TENANT)
  expect(result.kind).toBe(ACCESS_ACTION_RESULT.SUCCESS)
}

async function ensureReadySession(harness: Harness): Promise<void> {
  harness.session.captureTenant(TENANT)
  authApiDoubles.getAuthContext.mockResolvedValue(makeContextFixture())
  const result = await harness.session.ensureContext()
  expect(result.kind).toBe(ACCESS_ACTION_RESULT.SUCCESS)
}

beforeEach(() => {
  authApiDoubles.getAuthContext.mockReset()
  authApiDoubles.login.mockReset()
  authApiDoubles.logout.mockReset()
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  for (const mount of mounts.splice(0)) {
    mount.app.unmount()
    mount.host.remove()
  }
  for (const harness of harnesses.splice(0)) {
    harness.router.options.history.destroy()
    for (const route of harness.router.getRoutes()) {
      if (route.name !== undefined) harness.router.removeRoute(route.name)
    }
    disposePinia(harness.pinia)
  }
  setActivePinia(undefined)
})

describe('recarga dura con sesión activa (regresión F4)', () => {
  it('recarga con ?tenant= y cookie válida conserva el destino con un solo GET', async () => {
    const harness = createHarness()
    authApiDoubles.getAuthContext.mockResolvedValue(makeContextFixture())
    const destination = `/tiro/lecciones/17?tab=historial&tenant=${TENANT}`

    await harness.router.push(destination)

    expect(harness.router.currentRoute.value.fullPath).toBe(destination)
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LESSON_DETAIL)
    expect(harness.session.status).toBe(SESSION_STATUS.READY)
    expect(harness.session.identity?.id_usuario).toBe(701)
    expect(harness.session.pendingRedirect).toBeNull()
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('recarga sin query en ruta requiresTenant va a /contexto (captura manual), no a login', async () => {
    const harness = createHarness()
    const destination = '/tiro/lecciones/17?tab=historial'

    await harness.router.push(destination)

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.CONTEXT)
    expect(harness.session.pendingRedirect?.destination).toBe(destination)
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
  })

  it('recarga en /cuenta con ?tenant= restaura la identidad vía ensureContext, sin redirect', async () => {
    const harness = createHarness()
    authApiDoubles.getAuthContext.mockResolvedValue(makeContextFixture())
    const destination = `/cuenta?tab=credencial&tenant=${TENANT}`

    await harness.router.push(destination)

    expect(harness.router.currentRoute.value.fullPath).toBe(destination)
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.ACCOUNT)
    expect(harness.session.identity?.id_usuario).toBe(701)
    expect(harness.session.status).toBe(SESSION_STATUS.READY)
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('recarga en /personalizador con ?tenant= restaura la identidad vía ensureContext, sin redirect', async () => {
    const harness = createHarness()
    authApiDoubles.getAuthContext.mockResolvedValue(makeContextFixture())
    const destination = `/personalizador?panel=colores&tenant=${TENANT}`

    await harness.router.push(destination)

    expect(harness.router.currentRoute.value.fullPath).toBe(destination)
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.PERSONALIZER)
    expect(harness.session.identity?.id_usuario).toBe(701)
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('cookie inválida: recarga con ?tenant= en requiresTenant va a login sin reintento (401, GET único)', async () => {
    const harness = createHarness()
    authApiDoubles.getAuthContext.mockRejectedValue(new DashboardApiError('http', 401))

    await harness.router.push(`/tiro/lecciones/17?tab=historial&tenant=${TENANT}`)

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(harness.router.currentRoute.value.fullPath).toBe('/login')
    expect(harness.session.status).toBe(SESSION_STATUS.ANONYMOUS)
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('cookie inválida: recarga principal-only con ?tenant= va a login sin reintento', async () => {
    const harness = createHarness()
    authApiDoubles.getAuthContext.mockRejectedValue(new DashboardApiError('http', 401))

    await harness.router.push(`/cuenta?tab=credencial&tenant=${TENANT}`)

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(harness.router.currentRoute.value.fullPath).toBe('/login')
    expect(harness.session.status).toBe(SESSION_STATUS.ANONYMOUS)
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('logout navega a /login sin ?tenant= y la ausencia acreditada no se re-autentica', async () => {
    const harness = createHarness()
    await ensureReadySession(harness)
    authApiDoubles.logout.mockResolvedValue({
      kind: ACCESS_ACTION_RESULT.SUCCESS,
      response: { detail: 'Sesión cerrada.' },
    })

    await harness.session.logout()
    await harness.router.push({ name: ROUTE_NAMES.LOGIN })

    expect(harness.router.currentRoute.value.fullPath).toBe('/login')
    expect(harness.session.tenantCode).toBe('')

    // Link profundo con tenant tras el cierre: ausencia acreditada → login,
    // cero GET adicional (nada de auto-login desde cookie).
    await harness.router.push(`/tiro/lecciones/17?tenant=${TENANT}`)

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(harness.router.currentRoute.value.fullPath).toBe('/login')
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('navegación autenticada a ruta requiresTenant añade ?tenant= sin pisar otras queries', async () => {
    const harness = createHarness()
    await ensureReadySession(harness)

    await harness.router.push('/tiro/lecciones/17?tab=historial')

    expect(harness.router.currentRoute.value.fullPath)
      .toBe(`/tiro/lecciones/17?tab=historial&tenant=${TENANT}`)
    // La conservación por redirect no añade GETs: el contexto ya consolidado
    // resuelve en el segundo paso del guard.
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('las rutas públicas nunca llevan ni requieren el tenant', async () => {
    const harness = createHarness()
    await ensureReadySession(harness)

    await harness.router.push('/login')

    expect(harness.router.currentRoute.value.fullPath).toBe('/login')
  })

  it('login exitoso aterriza en el dashboard con ?tenant= en la URL', async () => {
    const harness = createHarness({ realLoginView: true })
    authApiDoubles.login.mockResolvedValue({
      kind: ACCESS_ACTION_RESULT.SUCCESS,
      response: { id_usuario: 701, must_change_password: false },
    })
    authApiDoubles.getAuthContext.mockResolvedValue(makeContextFixture())
    await harness.router.push('/login')
    const { host } = mountRouterView(harness)
    await flushRound()

    const rut = host.querySelector<HTMLInputElement>('#rut')
    const password = host.querySelector<HTMLInputElement>('#password')
    const tenant = host.querySelector<HTMLInputElement>('#tenantCode')
    expect(rut).not.toBeNull()
    expect(password).not.toBeNull()
    expect(tenant).not.toBeNull()
    fillInput(rut as HTMLInputElement, TEST_LOGIN.rut)
    fillInput(password as HTMLInputElement, TEST_LOGIN.password)
    fillInput(tenant as HTMLInputElement, TENANT)
    await flushRound()

    const form = host.querySelector('form')
    expect(form).not.toBeNull()
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushRound()
    await flushRound()

    expect(harness.router.currentRoute.value.fullPath).toBe(`/?tenant=${TENANT}`)
    expect(harness.session.identity?.id_usuario).toBe(701)
    expect(harness.session.status).toBe(SESSION_STATUS.READY)
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })
})
