import { createApp, nextTick, defineComponent, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoot from '../../src/App.vue'
import { routes } from '../../src/router/routes'
import { registerDashboardGuards } from '../../src/router/guards'
import { useSessionStore } from '../../src/stores/session'
import { SESSION_STATUS, type SessionState } from '../../src/types/session'
import {
  ACCESS_ACTION_RESULT,
  ACCESS_OPERATION_ERROR_KIND,
  type AccessActionResult,
  type LoginResponse,
  type SelectUnitResponse,
} from '../../src/types/auth'
import type { AuthContext, AuthContextAssignment } from '../../src/types/contexto'
import { validateAuthContext } from '../../src/api/dashboard'
import type { ApiConnection } from '../../src/types/dashboard'
import { DEFAULT_DESIGN_SYSTEM_APPEARANCE } from '../../src/types/appearance'

const authApiDoubles = vi.hoisted(() => ({
  getAuthContext: vi.fn<(connection: ApiConnection) => Promise<AuthContext>>(),
  login: vi.fn<(
    request: unknown,
    signal?: AbortSignal,
  ) => Promise<AccessActionResult<LoginResponse>>>(),
  selectUnit: vi.fn<(
    request: unknown,
    connection: unknown,
    signal?: AbortSignal,
  ) => Promise<AccessActionResult<SelectUnitResponse>>>(),
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
  getDesignSystemAppearance: vi.fn<() => Promise<unknown>>(),
  putDesignSystemAppearance: vi.fn<() => Promise<unknown>>(),
  resetDesignSystemAppearance: vi.fn<() => Promise<unknown>>(),
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

const renderCounts = new Map<string, number>()

function makeTrackedStub(routeName: string) {
  return defineComponent({
    name: `DeniedSurfaceStub:${routeName}`,
    setup() {
      renderCounts.set(routeName, (renderCounts.get(routeName) ?? 0) + 1)
      return () => `STUB:${routeName}`
    },
  })
}

function makeContextFixture(options: {
  permissions?: readonly string[]
  assignments?: readonly AuthContextAssignment[]
} = {}): AuthContext {
  const raw: unknown = {
    user: { id_usuario: 701, rut: null, must_change_password: false },
    tenant: { code: 'tenant-fixture', context: 'context-fixture' },
    active_organization_unit: 'unit-fixture',
    unit_membership: { id: 801, unit_code: 'unit-fixture', unit_name: 'Unidad de prueba' },
    scopes: [],
    permissions: [...(options.permissions ?? [])],
    assignments: [...(options.assignments ?? [])],
  }
  return validateAuthContext(raw)
}

interface Harness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
  session: ReturnType<typeof useSessionStore>
  text(): string
  mountCount(routeName: string): number
}

const harnesses: Harness[] = []

async function flushMicrotasks(): Promise<void> {
  for (let index = 0; index < 12; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function createAppHarness(
  path: string,
  overrides: Partial<SessionState> = {},
): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)

  const testRoutes: RouteRecordRaw[] = routes.map((route) => ({
    path: route.path,
    name: route.name,
    meta: route.meta,
    component: makeTrackedStub(String(route.name)),
  }))
  const router = createRouter({ history: createMemoryHistory(), routes: testRoutes })
  registerDashboardGuards(router)

  const session = useSessionStore(pinia)
  session.$patch({
    status: SESSION_STATUS.READY,
    tenantCode: 'tenant-fixture',
    unitCode: 'unit-fixture',
    identity: { id_usuario: 701, must_change_password: false, source: 'context' },
    context: makeContextFixture(),
    ...overrides,
  } as Partial<SessionState>)

  await router.push(path)
  await router.isReady()

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(AppRoot)
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await flushMicrotasks()

  const harness: Harness = {
    pinia,
    router,
    app,
    host,
    session,
    text: () => host.textContent ?? '',
    mountCount: (routeName: string) => renderCounts.get(routeName) ?? 0,
  }
  harnesses.push(harness)
  return harness
}

beforeEach(() => {
  renderCounts.clear()
  authApiDoubles.getAuthContext.mockReset()
  authApiDoubles.login.mockReset()
  authApiDoubles.selectUnit.mockReset()
  appearanceApiDoubles.getDesignSystemAppearance.mockReset()
  appearanceApiDoubles.putDesignSystemAppearance.mockReset()
  appearanceApiDoubles.resetDesignSystemAppearance.mockReset()
  appearanceApiDoubles.getDesignSystemAppearance.mockResolvedValue(
    structuredClone(DEFAULT_DESIGN_SYSTEM_APPEARANCE),
  )
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

describe('deep-link denegado: contenedor neutral sin montaje protegido (F3, AC-2)', () => {
  it('permiso ausente en snapshot vigente: URL conservada, vista no montada, motivo literal, cero requests', async () => {
    const harness = await createAppHarness('/organizacion/unidades')

    expect(harness.router.currentRoute.value.fullPath).toBe('/organizacion/unidades?tenant=tenant-fixture')
    expect(harness.mountCount('unidades')).toBe(0)
    expect(harness.text()).not.toContain('STUB:unidades')
    expect(harness.text()).toContain('Acceso denegado')
    expect(harness.text()).toContain('view_unit')
    expect(harness.text()).toContain('El backend conserva la autoridad final.')
    // Cero probing: la denegación no dispara ningún GET de contexto.
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
    // Denegación en cliente ≠ logout: la sesión vigente se conserva intacta.
    expect(harness.session.status).toBe(SESSION_STATUS.READY)
    expect(harness.session.identity?.id_usuario).toBe(701)
    expect(harness.session.pendingRedirect).toBeNull()
  })

  it('permiso acreditado en snapshot vigente: la vista se monta sin contenedor', async () => {
    const harness = await createAppHarness('/organizacion/unidades', {
      context: makeContextFixture({ permissions: ['view_unit'] }),
    })

    expect(harness.mountCount('unidades')).toBeGreaterThan(0)
    expect(harness.text()).toContain('STUB:unidades')
    expect(harness.text()).not.toContain('Acceso denegado')
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
  })

  it('superficie sin criterio fundado (overrides): cerrada incluso con todos los códigos y super_admin', async () => {
    const harness = await createAppHarness('/personas/overrides', {
      context: makeContextFixture({
        permissions: ['view_unit', 'view_exercises', 'manage_calibre', 'view_warehouse'],
        assignments: [{
          role: 'super_admin', scope: null, organization_unit: 'unit-fixture', is_primary: true,
        }],
      }),
    })

    expect(harness.router.currentRoute.value.fullPath).toBe('/personas/overrides?tenant=tenant-fixture')
    expect(harness.mountCount('overrides')).toBe(0)
    expect(harness.text()).toContain('no es verificable en el cliente')
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
    expect(harness.session.status).toBe(SESSION_STATUS.READY)
  })

  it('criterio role-based OP-AUT-004: rol custom deniega la bitácora sin montarla; auditor la abre', async () => {
    const denied = await createAppHarness('/auditoria', {
      context: makeContextFixture({
        assignments: [{
          role: 'tirador', scope: 'solo_propio', organization_unit: 'unit-fixture', is_primary: true,
        }],
      }),
    })
    expect(denied.mountCount('auditoria')).toBe(0)
    expect(denied.text()).toContain('Acceso denegado')
    expect(denied.text()).toContain('tenant_admin, super_admin, auditor')
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()

    const granted = await createAppHarness('/auditoria', {
      context: makeContextFixture({
        assignments: [{
          role: 'auditor', scope: 'todo_el_tenant', organization_unit: 'unit-fixture', is_primary: true,
        }],
      }),
    })
    expect(granted.mountCount('auditoria')).toBeGreaterThan(0)
    expect(granted.text()).not.toContain('Acceso denegado')
  })

  it('stale/unknown tras la negación: el contenido protegido deja de estar montado (fail-closed AC-3)', async () => {
    const harness = await createAppHarness('/organizacion/unidades', {
      context: makeContextFixture({ permissions: ['view_unit'] }),
    })
    expect(harness.mountCount('unidades')).toBeGreaterThan(0)

    // Avance de generación (recaptura de tenant): el store purga el contexto.
    harness.session.captureTenant('otro-tenant')
    await flushMicrotasks()

    expect(harness.text()).not.toContain('STUB:unidades')
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
  })

  it('sin bucles: re-navegar el deep-link denegado conserva la misma URL sin redirects ni requests', async () => {
    const harness = await createAppHarness('/organizacion/unidades')

    await harness.router.push('/organizacion/unidades')
    await harness.router.push({ name: 'unidades' })
    await flushMicrotasks()

    expect(harness.router.currentRoute.value.fullPath).toBe('/organizacion/unidades?tenant=tenant-fixture')
    expect(harness.text()).toContain('Acceso denegado')
    expect(harness.mountCount('unidades')).toBe(0)
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()
    expect(harness.session.pendingRedirect).toBeNull()
    expect(harness.session.status).toBe(SESSION_STATUS.READY)
  })

  it('menú y ruta comparten el criterio en la misma superficie: link y montaje se filtran juntos', async () => {
    const denied = await createAppHarness('/organizacion/unidades')
    expect(denied.host.querySelector('a[href="/organizacion/unidades"]')).toBeNull()

    const granted = await createAppHarness('/', {
      context: makeContextFixture({ permissions: ['view_unit'] }),
    })
    expect(granted.host.querySelector('a[href="/organizacion/unidades"]')).not.toBeNull()
  })

  it('superficies de sesión/control no se interceptan: dashboard, contexto, personalizador y 404 montan', async () => {
    const dashboard = await createAppHarness('/')
    expect(dashboard.mountCount('dashboard')).toBeGreaterThan(0)
    expect(dashboard.text()).not.toContain('Acceso denegado')

    const context = await createAppHarness('/contexto')
    expect(context.mountCount('context')).toBeGreaterThan(0)

    const personalizer = await createAppHarness('/personalizador')
    expect(personalizer.mountCount('personalizador')).toBeGreaterThan(0)

    const notFound = await createAppHarness('/ruta-inexistente')
    expect(notFound.mountCount('not-found')).toBeGreaterThan(0)
  })

  it('el retorno pendiente sobrevive: deep-link denegado presenta contenedor en su URL tras consolidar', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const testRoutes: RouteRecordRaw[] = routes.map((route) => ({
      path: route.path,
      name: route.name,
      meta: route.meta,
      component: makeTrackedStub(String(route.name)),
    }))
    const router = createRouter({ history: createMemoryHistory(), routes: testRoutes })
    registerDashboardGuards(router)
    const session = useSessionStore(pinia)
    session.purge()

    await router.push('/tiro/lecciones/17?tab=historial')
    expect(router.currentRoute.value.name).toBe('login')
    expect(session.pendingRedirect?.destination).toBe('/tiro/lecciones/17?tab=historial')

    // Sin permiso acreditado tras login: el guard consume el retorno hacia la
    // URL original y la superficie de composición presenta el contenedor.
    authApiDoubles.login.mockResolvedValue({
      kind: ACCESS_ACTION_RESULT.SUCCESS,
      response: { id_usuario: 701, must_change_password: false },
    })
    authApiDoubles.getAuthContext.mockResolvedValue(makeContextFixture())
    await session.login({ rut: 'test-only-identity', password: 'test-only-credential' }, 'tenant-fixture')
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(AppRoot)
    app.use(pinia)
    app.use(router)
    app.mount(host)
    await flushMicrotasks()
    await router.push('/')
    await flushMicrotasks()

    expect(router.currentRoute.value.fullPath).toBe('/tiro/lecciones/17?tab=historial&tenant=tenant-fixture')
    expect(session.pendingRedirect).toBeNull()
    expect(renderCounts.get('leccion-detalle') ?? 0).toBe(0)
    expect(host.textContent ?? '').toContain('Acceso denegado')
    const harness: Harness = {
      pinia, router, app, host, session,
      text: () => host.textContent ?? '',
      mountCount: (name: string) => renderCounts.get(name) ?? 0,
    }
    harnesses.push(harness)
  })

  it('el retorno permitido atraviesa el filtro y monta la vista destino', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const testRoutes: RouteRecordRaw[] = routes.map((route) => ({
      path: route.path,
      name: route.name,
      meta: route.meta,
      component: makeTrackedStub(String(route.name)),
    }))
    const router = createRouter({ history: createMemoryHistory(), routes: testRoutes })
    registerDashboardGuards(router)
    const session = useSessionStore(pinia)
    session.purge()

    await router.push('/tiro/lecciones/17?tab=historial')
    authApiDoubles.login.mockResolvedValue({
      kind: ACCESS_ACTION_RESULT.SUCCESS,
      response: { id_usuario: 701, must_change_password: false },
    })
    authApiDoubles.getAuthContext.mockResolvedValue(
      makeContextFixture({ permissions: ['view_unit'] }),
    )
    await session.login({ rut: 'test-only-identity', password: 'test-only-credential' }, 'tenant-fixture')
    await router.push('/')
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(AppRoot)
    app.use(pinia)
    app.use(router)
    app.mount(host)
    await flushMicrotasks()

    expect(router.currentRoute.value.fullPath).toBe('/tiro/lecciones/17?tab=historial&tenant=tenant-fixture')
    expect(renderCounts.get('leccion-detalle') ?? 0).toBeGreaterThan(0)
    const harness: Harness = {
      pinia, router, app, host, session,
      text: () => host.textContent ?? '',
      mountCount: (name: string) => renderCounts.get(name) ?? 0,
    }
    harnesses.push(harness)
    expect(harness.text()).not.toContain('Acceso denegado')
  })
})

describe('403 de negocio sobre superficie permitida: autoridad del backend, sin logout (AC-5)', () => {
  it('un 403 de negocio preserva el detail literal y no purga la sesión', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const session = useSessionStore(pinia)
    session.$patch({
      status: SESSION_STATUS.READY,
      tenantCode: 'tenant-fixture',
      unitCode: 'unit-fixture',
      identity: { id_usuario: 701, must_change_password: false, source: 'context' },
      context: makeContextFixture({ permissions: ['view_unit'] }),
    } as Partial<SessionState>)
    authApiDoubles.getAuthContext.mockResolvedValue(
      makeContextFixture({ permissions: ['view_unit'] }) as AuthContext,
    )
    authApiDoubles.selectUnit.mockResolvedValue({
      kind: ACCESS_ACTION_RESULT.REJECTED,
      error: {
        kind: ACCESS_OPERATION_ERROR_KIND.HTTP,
        status: 403,
        payload: undefined,
        detail: 'Negación de negocio focalizada',
        retryAfter: null,
      },
    })

    const result = await session.selectUnit({ organization_unit_code: 'otra-unidad' })

    expect(result.kind).toBe(ACCESS_ACTION_RESULT.REJECTED)
    expect(session.status).not.toBe(SESSION_STATUS.ANONYMOUS)
    expect(session.identity?.id_usuario).toBe(701)
    expect(session.failure?.detail).toBe('Negación de negocio focalizada')
  })
})
