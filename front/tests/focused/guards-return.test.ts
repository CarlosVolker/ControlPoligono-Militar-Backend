import { defineComponent } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  isNavigationFailure,
  NavigationFailureType,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DashboardApiError,
  TENANT_CONTEXT_DENIED_DETAIL,
  validateAuthContext,
} from '../../src/api/dashboard'
import type { AuthContext } from '../../src/types/contexto'
import {
  ACCESS_ACTION_RESULT,
  type AccessActionResult,
  type LoginRequest,
  type LoginResponse,
} from '../../src/types/auth'
import { useSessionStore } from '../../src/stores/session'
import { registerDashboardGuards } from '../../src/router/guards'
import { ROUTE_NAMES, routes, type RouteName } from '../../src/router/routes'
import type { ApiConnection } from '../../src/types/dashboard'
import { SESSION_STATUS } from '../../src/types/session'

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

const FETCH_FREE_ROUTE_NAMES: readonly RouteName[] = [
  ROUTE_NAMES.LOGIN,
  ROUTE_NAMES.RECOVERY,
  ROUTE_NAMES.CONTEXT_LOST,
  ROUTE_NAMES.NOT_FOUND,
]

const TEST_ROUTE_COMPONENT = defineComponent({
  name: 'GuardRouteStub',
  render: () => null,
})

const TENANT_PROTECTED_ROUTES = routes.filter((route) =>
  route.name === ROUTE_NAMES.DASHBOARD || route.meta?.requiresTenant === true,
)

const FETCH_FREE_ROUTES = routes.filter((route) =>
  FETCH_FREE_ROUTE_NAMES.some((name) => route.name === name),
)

interface ContextFixtureOptions {
  userId?: number
  tenantCode?: string | null
  unitCode?: string | null
  mustChangePassword?: boolean
}

interface RouterHarness {
  pinia: ReturnType<typeof createPinia>
  router: Router
  session: ReturnType<typeof useSessionStore>
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

const harnesses: RouterHarness[] = []

function makeAuthContextFixture(options: ContextFixtureOptions = {}): AuthContext {
  const {
    userId = 701,
    tenantCode = 'tenant-fixture',
    unitCode = 'unit-fixture',
    mustChangePassword = false,
  } = options
  const fixture: unknown = {
    user: {
      id_usuario: userId,
      rut: null,
      must_change_password: mustChangePassword,
    },
    tenant: {
      code: tenantCode,
      context: tenantCode === null ? null : 'context-fixture',
    },
    active_organization_unit: unitCode,
    unit_membership: unitCode === null
      ? null
      : { id: 801, unit_code: unitCode, unit_name: 'Unidad de prueba' },
    scopes: [],
    permissions: [],
    assignments: [],
  }

  return validateAuthContext(fixture)
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function createHarness(useRealRouteComponents = false): RouterHarness {
  const pinia = createPinia()
  setActivePinia(pinia)
  const session = useSessionStore(pinia)
  const testRoutes: RouteRecordRaw[] = routes.map((route) => ({
    path: route.path,
    name: route.name,
    meta: route.meta,
    component: useRealRouteComponents ? route.component : TEST_ROUTE_COMPONENT,
  }))
  const router = createRouter({ history: createMemoryHistory(), routes: testRoutes })
  registerDashboardGuards(router)

  const harness = { pinia, router, session }
  harnesses.push(harness)
  return harness
}

function pathForRoute(route: RouteRecordRaw): string {
  return route.path.replace(
    /:([A-Za-z][A-Za-z0-9_]*)(?:\([^)]*\))?[?+*]?/g,
    (_segment, parameterName: string) => parameterName === 'pathMatch' ? 'unmatched' : '17',
  )
}

function pathForName(name: RouteName): string {
  const route = routes.find((candidate) => candidate.name === name)
  if (!route) throw new Error(`La ruta registrada ${name} no está disponible.`)
  return pathForRoute(route)
}

function queueLoginSuccess(
  mustChangePassword = false,
  userId = 701,
): void {
  authApiDoubles.login.mockResolvedValue({
    kind: ACCESS_ACTION_RESULT.SUCCESS,
    response: { id_usuario: userId, must_change_password: mustChangePassword },
  })
}

async function loginThroughStore(
  session: ReturnType<typeof useSessionStore>,
  tenantCode = 'tenant-fixture',
  mustChangePassword = false,
): Promise<void> {
  queueLoginSuccess(mustChangePassword)
  const result = await session.login(TEST_LOGIN, tenantCode)
  expect(result).toEqual({
    kind: ACCESS_ACTION_RESULT.SUCCESS,
    response: { id_usuario: 701, must_change_password: mustChangePassword },
  })
}

async function expectNavigationFailure(
  navigation: ReturnType<Router['push']>,
  type?: NavigationFailureType,
): Promise<void> {
  const failure = await navigation
  expect(isNavigationFailure(failure, type)).toBe(true)
}

async function prepareReadySession(harness: RouterHarness): Promise<void> {
  harness.session.captureTenant('tenant-fixture')
  authApiDoubles.getAuthContext.mockResolvedValue(makeAuthContextFixture())
  const result = await harness.session.ensureContext()
  expect(result).toEqual({
    kind: ACCESS_ACTION_RESULT.SUCCESS,
    response: makeAuthContextFixture(),
  })
}

beforeEach(() => {
  authApiDoubles.getAuthContext.mockReset()
  authApiDoubles.login.mockReset()
})

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.router.options.history.destroy()
    for (const route of harness.router.getRoutes()) {
      if (route.name !== undefined) harness.router.removeRoute(route.name)
    }
    disposePinia(harness.pinia)
  }
  setActivePinia(undefined)
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.replaceChildren()
  document.cookie = 'csrftoken=; Max-Age=0; path=/'
})

describe('registro y clasificación del guard', () => {
  it('resuelve los loaders reales al navegar entre login y recuperación con guards', async () => {
    const harness = createHarness(true)

    for (const name of [ROUTE_NAMES.LOGIN, ROUTE_NAMES.RECOVERY]) {
      const loader = harness.router.resolve({ name }).matched[0]?.components?.default
      expect(typeof loader).toBe('function')

      const failure = await harness.router.push({ name })

      expect(failure).toBeUndefined()
      expect(harness.router.currentRoute.value.name).toBe(name)
      const component = harness.router.currentRoute.value.matched[0]?.components?.default
      expect(component).toBeDefined()
      expect(component).not.toBe(loader)
      expect(typeof component).toBe('object')
      expect(component).toHaveProperty('setup')
    }
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
  })

  it('usa las 36 rutas registradas y sus metadatos reales, no una lista parcial', () => {
    const registeredNames = routes
      .flatMap((route) => route.name === undefined ? [] : [String(route.name)])
      .sort()

    expect(registeredNames).toHaveLength(37)
    expect(new Set(registeredNames).size).toBe(37)
    expect(registeredNames).toEqual([...Object.values(ROUTE_NAMES)].sort())
    expect(FETCH_FREE_ROUTES.map((route) => route.name).sort())
      .toEqual([...FETCH_FREE_ROUTE_NAMES].sort())
    expect(routes.find((route) => route.name === ROUTE_NAMES.PERSONALIZER)?.meta?.requiresTenant)
      .toBe(false)
    expect(TENANT_PROTECTED_ROUTES).toHaveLength(29)
    for (const route of TENANT_PROTECTED_ROUTES) {
      if (route.name !== ROUTE_NAMES.DASHBOARD) {
        expect(route.meta?.requiresTenant, String(route.name)).toBe(true)
      }
    }
  })

  for (const route of FETCH_FREE_ROUTES) {
    it(`${String(route.name)} permanece pública sin consultar contexto`, async () => {
      const harness = createHarness()

      await harness.router.push(pathForRoute(route))

      expect(harness.router.currentRoute.value.name).toBe(route.name)
      expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
      expect(harness.session.pendingRedirect).toBeNull()
    })
  }

  it('permite /contexto para captura inicial sin GET ni retorno intermedio', async () => {
    const harness = createHarness()

    await harness.router.push(pathForName(ROUTE_NAMES.CONTEXT))

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.CONTEXT)
    expect(harness.session.status).toBe(SESSION_STATUS.NEEDS_TENANT)
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
    expect(harness.session.pendingRedirect).toBeNull()
  })

  for (const route of TENANT_PROTECTED_ROUTES) {
    it(`${String(route.name)} con sesión anónima va a login y retiene el destino`, async () => {
      const harness = createHarness()
      harness.session.purge()
      const destination = `${pathForRoute(route)}?tab=historial&page=2`
      const expected = harness.router.resolve(destination).fullPath

      await harness.router.push(destination)

      expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
      expect(harness.session.pendingRedirect?.destination).toBe(expected)
      expect(harness.session.pendingRedirect?.attempt).toBe(1)
      expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
    })
  }

  for (const route of TENANT_PROTECTED_ROUTES) {
    it(`${String(route.name)} sin tenant va a contexto sin GET`, async () => {
      const harness = createHarness()
      const destination = `${pathForRoute(route)}?tab=historial&page=2`
      const expected = harness.router.resolve(destination).fullPath

      await harness.router.push(destination)

      expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.CONTEXT)
      expect(harness.session.pendingRedirect?.destination).toBe(expected)
      expect(harness.session.pendingRedirect?.attempt).toBe(1)
      expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
    })
  }

  it('distingue el contexto resuelto sin tenant de la sesión expirada', async () => {
    const harness = createHarness()
    harness.session.captureTenant('tenant-fixture')
    authApiDoubles.getAuthContext.mockResolvedValue(
      makeAuthContextFixture({ tenantCode: null, unitCode: null }),
    )

    await harness.router.push('/tiro/lecciones/17?tab=historial')
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.CONTEXT_LOST)
    expect(harness.session.status).toBe(SESSION_STATUS.CONTEXT_LOST)
    expect(harness.session.pendingRedirect?.destination)
      .toBe('/tiro/lecciones/17?tab=historial')

    await harness.router.push('/organizacion/unidades')

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.CONTEXT_LOST)
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('mantiene una denegación 403 del tenant como anonymous y dirige a login', async () => {
    const harness = createHarness()
    harness.session.captureTenant('tenant-fixture')
    authApiDoubles.getAuthContext.mockRejectedValue(
      new DashboardApiError('http', 403, TENANT_CONTEXT_DENIED_DETAIL),
    )

    await harness.router.push('/tiro/lecciones/17/fracciones/4?tab=resultado')

    expect(harness.session.status).toBe(SESSION_STATUS.ANONYMOUS)
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(harness.session.pendingRedirect?.destination)
      .toBe('/tiro/lecciones/17/fracciones/4?tab=resultado')
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('clasifica 401 del bootstrap como pérdida de sesión y no reintenta', async () => {
    const harness = createHarness()
    harness.session.captureTenant('tenant-fixture')
    authApiDoubles.getAuthContext.mockRejectedValue(new DashboardApiError('http', 401))

    await harness.router.push('/tiro/lecciones/17?tab=historial')

    expect(harness.session.status).toBe(SESSION_STATUS.ANONYMOUS)
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(harness.session.pendingRedirect?.destination)
      .toBe('/tiro/lecciones/17?tab=historial')
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('no confunde un 429 de contexto con expiración o denegación 403', async () => {
    const harness = createHarness()
    harness.session.captureTenant('tenant-fixture')
    authApiDoubles.getAuthContext.mockRejectedValue(new DashboardApiError('http', 429))

    await harness.router.push('/tiro/lecciones/17?tab=historial')

    expect(harness.session.status).toBe(SESSION_STATUS.FAILURE)
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.CONTEXT)
    expect(harness.session.pendingRedirect?.destination)
      .toBe('/tiro/lecciones/17?tab=historial')
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('con contexto validado pero sin unidad conserva el retorno en contexto', async () => {
    const harness = createHarness()
    harness.session.captureTenant('tenant-fixture')
    authApiDoubles.getAuthContext.mockResolvedValue(
      makeAuthContextFixture({ unitCode: null }),
    )

    await harness.router.push('/tiro/lecciones/17/fracciones/4?tab=resultado')

    expect(harness.session.status).toBe(SESSION_STATUS.READY)
    expect(harness.session.tenantCode).toBe('tenant-fixture')
    expect(harness.session.unitCode).toBe('')
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.CONTEXT)
    expect(harness.session.pendingRedirect?.destination)
      .toBe('/tiro/lecciones/17/fracciones/4?tab=resultado')
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })
})

describe('bootstrap diferido, slot de retorno y concurrencia', () => {
  for (const denial of [
    { label: '401', status: 401, detail: null },
    { label: '403 tenant-denied', status: 403, detail: TENANT_CONTEXT_DENIED_DETAIL },
  ]) {
    it(`retiene el fullPath profundo antes del GET diferido denegado (${denial.label})`, async () => {
      const harness = createHarness()
      harness.session.captureTenant('tenant-fixture')
      const response = createDeferred<AuthContext>()
      const requestStarted = createDeferred<void>()
      authApiDoubles.getAuthContext.mockImplementation(() => {
        requestStarted.resolve(undefined)
        return response.promise
      })
      const destination = '/tiro/lecciones/17/fracciones/4?tab=resultado&page=3'
      const expected = harness.router.resolve(destination).fullPath
      const navigation = harness.router.push(destination)

      await requestStarted.promise
      const retained = harness.session.pendingRedirect
      expect(retained?.destination).toBe(expected)
      expect(retained?.attempt).toBe(1)

      response.reject(new DashboardApiError('http', denial.status, denial.detail))
      await navigation

      expect(harness.session.status).toBe(SESSION_STATUS.ANONYMOUS)
      expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
      expect(harness.session.pendingRedirect).toEqual(retained)
      expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
    })
  }

  it('el bootstrap diferido con must_change_password conserva el deep return sin ciclo', async () => {
    const harness = createHarness()
    harness.session.captureTenant('tenant-fixture')
    const response = createDeferred<AuthContext>()
    const requestStarted = createDeferred<void>()
    authApiDoubles.getAuthContext.mockImplementation(() => {
      requestStarted.resolve(undefined)
      return response.promise
    })
    const destination = '/tiro/lecciones/17/fracciones/4?tab=resultado&page=3'
    const expected = harness.router.resolve(destination).fullPath
    const navigation = harness.router.push(destination)

    await requestStarted.promise
    expect(harness.session.pendingRedirect?.destination).toBe(expected)
    response.resolve(makeAuthContextFixture({ mustChangePassword: true, unitCode: null }))
    await navigation

    expect(harness.session.identity?.must_change_password).toBe(true)
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.PASSWORD_REQUIRED)
    expect(harness.session.pendingRedirect?.destination).toBe(expected)
    await harness.router.push('/recuperar')
    await harness.router.push('/password-required')
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.PASSWORD_REQUIRED)
    expect(harness.session.pendingRedirect?.destination).toBe(expected)
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('no reemplaza un pendingRedirect válido preexistente cuando el GET termina en 401', async () => {
    const harness = createHarness()
    harness.session.captureTenant('tenant-fixture')
    const original = '/tiro/ejercicios/17?tab=consumos&page=2'
    harness.session.setPendingRedirect(original, 73)
    const response = createDeferred<AuthContext>()
    const requestStarted = createDeferred<void>()
    authApiDoubles.getAuthContext.mockImplementation(() => {
      requestStarted.resolve(undefined)
      return response.promise
    })
    const navigation = harness.router.push('/tiro/lecciones/22?tab=actual')

    await requestStarted.promise
    expect(harness.session.pendingRedirect).toEqual({ destination: original, attempt: 73 })
    response.reject(new DashboardApiError('http', 401))
    await navigation

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(harness.session.pendingRedirect).toEqual({ destination: original, attempt: 73 })
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('consume el retorno registrado una vez, solo tras consolidar tenant, contexto y unidad', async () => {
    const harness = createHarness()
    const destination = '/tiro/lecciones/17/fracciones/4?tab=resultado&page=3'
    const expected = harness.router.resolve(destination).fullPath

    await harness.router.push(destination)
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.CONTEXT)
    expect(harness.session.pendingRedirect?.destination).toBe(expected)
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()

    harness.session.captureTenant('tenant-fixture')
    const withoutUnit = makeAuthContextFixture({ unitCode: null })
    const withUnit = makeAuthContextFixture()
    authApiDoubles.getAuthContext
      .mockResolvedValueOnce(withoutUnit)
      .mockResolvedValueOnce(withUnit)
    await harness.router.push('/')

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.CONTEXT)
    expect(harness.session.pendingRedirect?.destination).toBe(expected)
    const reconciliation = await harness.session.ensureContext()
    expect(reconciliation.kind).toBe(ACCESS_ACTION_RESULT.SUCCESS)
    expect(harness.session.unitCode).toBe('unit-fixture')

    const consume = vi.spyOn(harness.session, 'consumePendingRedirect')
    await harness.router.push('/')

    // Al resolver, la URL porta el tenant (portador único de la recarga).
    expect(harness.router.currentRoute.value.fullPath)
      .toBe(`${expected}&tenant=tenant-fixture`)
    expect(harness.session.pendingRedirect).toBeNull()
    expect(consume).toHaveBeenCalledTimes(1)
    await harness.router.push('/tiro/poligonos')
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.POLYGONS)
    expect(consume).toHaveBeenCalledTimes(1)
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(2)
  })

  it('no aplica el resultado de un bootstrap cuyo tenant y generación quedaron obsoletos', async () => {
    const harness = createHarness()
    await harness.router.push('/login')
    harness.session.captureTenant('tenant-old')
    const response = createDeferred<AuthContext>()
    const requestStarted = createDeferred<void>()
    authApiDoubles.getAuthContext.mockImplementation(() => {
      requestStarted.resolve(undefined)
      return response.promise
    })
    const navigation = harness.router.push('/tiro/lecciones/17?tab=historial')
    await requestStarted.promise
    expect(harness.session.pendingRedirect?.destination)
      .toBe('/tiro/lecciones/17?tab=historial')

    harness.session.captureTenant('tenant-new')
    response.resolve(makeAuthContextFixture({ tenantCode: 'tenant-old' }))
    await expectNavigationFailure(navigation, NavigationFailureType.aborted)

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(harness.session.tenantCode).toBe('tenant-new')
    expect(harness.session.context).toBeNull()
    expect(harness.session.pendingRedirect).toBeNull()
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('una navegación nueva hace obsoleto el guard anterior y no lo deja redirigirla', async () => {
    const harness = createHarness()
    await harness.router.push('/login')
    harness.session.captureTenant('tenant-fixture')
    const response = createDeferred<AuthContext>()
    const requestStarted = createDeferred<void>()
    authApiDoubles.getAuthContext.mockImplementation(() => {
      requestStarted.resolve(undefined)
      return response.promise
    })
    const staleNavigation = harness.router.push('/tiro/lecciones/17?tab=historial')
    await requestStarted.promise

    await harness.router.push('/recuperar')
    response.resolve(makeAuthContextFixture())
    await expectNavigationFailure(staleNavigation)

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.RECOVERY)
    expect(harness.session.pendingRedirect?.destination)
      .toBe('/tiro/lecciones/17?tab=historial')
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })

  it('un attempt de retorno obsoleto no redirige ni consume el slot nuevo', async () => {
    const harness = createHarness()
    await harness.router.push('/login')
    harness.session.captureTenant('tenant-fixture')
    harness.session.setPendingRedirect('/tiro/lecciones/17?tab=anterior', 91)
    const response = createDeferred<AuthContext>()
    const requestStarted = createDeferred<void>()
    authApiDoubles.getAuthContext.mockImplementation(() => {
      requestStarted.resolve(undefined)
      return response.promise
    })
    const staleNavigation = harness.router.push('/tiro/ejercicios/28?tab=actual')
    await requestStarted.promise

    harness.session.discardPendingRedirect(91)
    harness.session.setPendingRedirect('/personalizador?panel=color', 92)
    response.resolve(makeAuthContextFixture())
    await expectNavigationFailure(staleNavigation, NavigationFailureType.aborted)

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(harness.session.pendingRedirect)
      .toEqual({ destination: '/personalizador?panel=color', attempt: 92 })
    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
  })
})

describe('retorno del personalizador y destinos no seguros', () => {
  it('personalizador sin identidad va a login sin tenant, unidad ni consulta de contexto', async () => {
    const harness = createHarness()
    const destination = '/personalizador?panel=tipografia&preview=compact'
    const expected = harness.router.resolve(destination).fullPath

    await harness.router.push(destination)

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(harness.session.tenantCode).toBe('')
    expect(harness.session.unitCode).toBe('')
    expect(harness.session.pendingRedirect?.destination).toBe(expected)
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
  })

  it('identidad de login permite personalizador sin contexto ni unidad y sin GET', async () => {
    const harness = createHarness()
    await loginThroughStore(harness.session)
    harness.session.$patch({ tenantCode: '' })
    const destination = '/personalizador?panel=tipografia&preview=compact'

    await harness.router.push(destination)

    expect(harness.router.currentRoute.value.fullPath)
      .toBe(harness.router.resolve(destination).fullPath)
    expect(harness.session.identity?.id_usuario).toBe(701)
    expect(harness.session.tenantCode).toBe('')
    expect(harness.session.context).toBeNull()
    expect(harness.session.unitCode).toBe('')
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
  })

  it('redirige al retorno personalizer tras login y lo consume antes de exigir tenant/contexto', async () => {
    const harness = createHarness()
    const destination = '/personalizador?panel=colores&axis=accent'
    const expected = harness.router.resolve(destination).fullPath

    await harness.router.push(destination)
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(harness.session.pendingRedirect?.destination).toBe(expected)
    await loginThroughStore(harness.session)

    await harness.router.push('/')

    expect(harness.router.currentRoute.value.fullPath).toBe(expected)
    expect(harness.session.pendingRedirect).toBeNull()
    expect(harness.session.context).toBeNull()
    expect(harness.session.unitCode).toBe('')
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
  })

  it('password-required conserva el slot original y no entra en un ciclo de guard', async () => {
    const harness = createHarness()
    const original = '/personalizador?panel=colores&axis=accent'
    const expected = harness.router.resolve(original).fullPath

    await harness.router.push(original)
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    await loginThroughStore(harness.session, 'tenant-fixture', true)
    await harness.router.push('/tiro/lecciones/17/fracciones/4?tab=resultado')

    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.PASSWORD_REQUIRED)
    expect(harness.session.pendingRedirect?.destination).toBe(expected)
    await harness.router.push('/recuperar')
    await harness.router.push('/password-required')
    expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.PASSWORD_REQUIRED)
    expect(harness.session.pendingRedirect?.destination).toBe(expected)
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
  })

  for (const query of [
    'redirect=%2Ftiro%2Flecciones',
    'token=fixture-value',
    'secret=fixture-value',
    'password=fixture-value',
    'csrf=fixture-value',
    'session_id=fixture-value',
    'otp=fixture-value',
    'codigo=fixture-value',
  ]) {
    it(`no retiene el destino de guard con query sensible ${query.split('=')[0]}`, async () => {
      const harness = createHarness()
      const destination = `/tiro/lecciones/17?${query}`

      await harness.router.push(destination)

      expect(harness.router.currentRoute.value.name).toBe(ROUTE_NAMES.CONTEXT)
      expect(harness.session.pendingRedirect).toBeNull()
      expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
    })
  }

  const UNSAFE_PENDING_DESTINATIONS = [
    'https://external.invalid/target',
    '//external.invalid/target',
    '/\\external.invalid/target',
    '/future-route-not-registered',
    '/login',
    '/recuperar',
    '/password-required',
    '/contexto',
    '/contexto-perdido',
    '/tiro/lecciones/17?redirect=%2Flogin',
    '/tiro/lecciones/17?token=fixture-value',
  ] as const

  for (const unsafeDestination of UNSAFE_PENDING_DESTINATIONS) {
    it(`el guard consume sin abrir un destino no permitido: ${unsafeDestination}`, async () => {
      const harness = createHarness()
      await prepareReadySession(harness)
      harness.session.setPendingRedirect(unsafeDestination, 103)

      await harness.router.push('/tiro/lecciones')

      expect(harness.router.currentRoute.value.fullPath).toBe('/tiro/lecciones?tenant=tenant-fixture')
      expect(harness.session.pendingRedirect).toBeNull()
      expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
    })
  }

})
