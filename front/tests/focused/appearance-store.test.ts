import { createPinia, disposePinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  AccessActionResult,
  DetailResponse,
  LoginRequest,
  LoginResponse,
  SelectUnitRequest,
  SelectUnitResponse,
} from '../../src/types/auth'
import type { AuthContext } from '../../src/types/contexto'
import type { ApiConnection } from '../../src/types/dashboard'
import { DesignSystemAppearanceApiError } from '../../src/api/appearance'
import { DashboardApiError } from '../../src/api/dashboard'
import {
  DEFAULT_DESIGN_SYSTEM_APPEARANCE,
  DESIGN_SYSTEM_ACCENT,
  DESIGN_SYSTEM_THEME,
  getDesignSystemAppearanceDomAttributeValues,
} from '../../src/types/appearance'
import type { DesignSystemAppearance } from '../../src/types/appearance'
import { ACCESS_ACTION_RESULT } from '../../src/types/auth'
import { useAppearanceStore } from '../../src/stores/appearance'
import { useSessionStore } from '../../src/stores/session'

const appearanceApiDoubles = vi.hoisted(() => ({
  getDesignSystemAppearance: vi.fn<
    (signal?: AbortSignal | null) => Promise<DesignSystemAppearance>
  >(),
  putDesignSystemAppearance: vi.fn<
    (appearance: DesignSystemAppearance, signal?: AbortSignal | null) => Promise<DesignSystemAppearance>
  >(),
  resetDesignSystemAppearance: vi.fn<(signal?: AbortSignal | null) => Promise<void>>(),
}))

const authApiDoubles = vi.hoisted(() => ({
  login: vi.fn<(request: LoginRequest, signal?: AbortSignal) => Promise<AccessActionResult<LoginResponse>>>(),
  logout: vi.fn<(signal?: AbortSignal) => Promise<AccessActionResult<DetailResponse>>>(),
  selectUnit: vi.fn<(
    request: SelectUnitRequest,
    connection: Pick<ApiConnection, 'tenantCode'>,
    signal?: AbortSignal,
  ) => Promise<AccessActionResult<SelectUnitResponse>>>(),
  getAuthContext: vi.fn<(connection: ApiConnection) => Promise<AuthContext>>(),
}))

vi.mock('../../src/api/appearance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/appearance')>()
  return { ...actual, ...appearanceApiDoubles }
})

vi.mock('../../src/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/auth')>()
  return { ...actual, ...authApiDoubles }
})

const TEST_PRINCIPAL_ID = 41
const TEST_TENANT_CODE = 'tenant-test-a'
const TEST_UNIT_CODE = 'unit-test-a'

interface Deferred<T> {
  promise: Promise<T>
  resolve(value: T): void
}

interface TestStores {
  session: ReturnType<typeof useSessionStore>
  appearance: ReturnType<typeof useAppearanceStore>
  dispose(): void
}

let activeContext: AuthContext
let stores: TestStores | null = null

function deferred<T>(): Deferred<T> {
  let resolvePromise!: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })

  return {
    promise,
    resolve: resolvePromise,
  }
}

function appearance(
  overrides: Partial<DesignSystemAppearance> = {},
): DesignSystemAppearance {
  return { ...DEFAULT_DESIGN_SYSTEM_APPEARANCE, ...overrides }
}

function authContext(
  id_usuario: number,
  tenantCode: string,
  unitCode: string | null,
): AuthContext {
  return {
    user: {
      id_usuario,
      rut: null,
      must_change_password: false,
    },
    tenant: {
      code: tenantCode,
      context: null,
    },
    active_organization_unit: unitCode,
    unit_membership: unitCode === null
      ? null
      : { id: 1, unit_code: unitCode, unit_name: 'Test-only unit' },
    scopes: [],
    permissions: [],
    assignments: [],
  }
}

function createStores(): TestStores {
  const pinia = createPinia()
  setActivePinia(pinia)
  const session = useSessionStore()
  const appearanceStore = useAppearanceStore()

  return {
    session,
    appearance: appearanceStore,
    dispose() {
      appearanceStore.dispose()
      disposePinia(pinia)
    },
  }
}

async function loginAs(
  session: ReturnType<typeof useSessionStore>,
  context: AuthContext,
): Promise<void> {
  activeContext = context
  const tenantCode = context.tenant.code
  if (tenantCode === null || tenantCode.trim() === '') {
    throw new Error('El fixture de autenticación requiere un tenant de prueba.')
  }

  session.captureTenant(tenantCode)
  const result = await session.login(
    { rut: 'TEST-ONLY', password: 'test-only-password' },
    tenantCode,
  )

  expect(result.kind).toBe(ACCESS_ACTION_RESULT.SUCCESS)
  expect(session.identity?.id_usuario).toBe(context.user.id_usuario)
  expect(session.context).toBeNull()
}

async function restoreAppearance(
  appearanceStore: ReturnType<typeof useAppearanceStore>,
): Promise<void> {
  expect(await appearanceStore.waitForAuthenticatedContent()).toBe(true)
}

async function settleMicrotasks(): Promise<void> {
  for (let pass = 0; pass < 8; pass += 1) await Promise.resolve()
}

async function firePendingDebounce(): Promise<void> {
  await vi.runOnlyPendingTimersAsync()
  await settleMicrotasks()
}

function expectDefaultDomAttributes(): void {
  const values = getDesignSystemAppearanceDomAttributeValues(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
  for (const [name, value] of Object.entries(values)) {
    const expectedValue: string | null = value ?? null
    expect(document.documentElement.getAttribute(name)).toBe(expectedValue)
  }
}

beforeEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
  activeContext = authContext(TEST_PRINCIPAL_ID, TEST_TENANT_CODE, null)

  appearanceApiDoubles.getDesignSystemAppearance.mockResolvedValue(
    appearance(),
  )
  appearanceApiDoubles.putDesignSystemAppearance.mockImplementation(
    async (requested) => appearance(requested),
  )
  appearanceApiDoubles.resetDesignSystemAppearance.mockResolvedValue(undefined)

  authApiDoubles.login.mockImplementation(async () => ({
    kind: ACCESS_ACTION_RESULT.SUCCESS,
    response: {
      id_usuario: activeContext.user.id_usuario,
      must_change_password: false,
    },
  }))
  authApiDoubles.logout.mockResolvedValue({
    kind: ACCESS_ACTION_RESULT.SUCCESS,
    response: { detail: 'Test-only logout response' },
  })
  authApiDoubles.selectUnit.mockImplementation(async (request, connection) => ({
    kind: ACCESS_ACTION_RESULT.SUCCESS,
    response: {
      detail: 'Test-only unit selection response',
      organization_unit_code: request.organization_unit_code,
      tenant_code: connection.tenantCode,
    },
  }))
  authApiDoubles.getAuthContext.mockImplementation(async () => activeContext)
})

afterEach(() => {
  stores?.dispose()
  stores = null
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('lifecycle y cola de apariencia por principal', () => {
  it.each([41, 52])(
    'restaura preferencias propias del principal %i antes de abrir cada barrera',
    async (principalId) => {
      const context = authContext(principalId, TEST_TENANT_CODE, null)
      const ownedAppearance = appearance({
        theme: DESIGN_SYSTEM_THEME.LIGHT,
        accent: DESIGN_SYSTEM_ACCENT.GREEN,
      })
      const restoreError = new DesignSystemAppearanceApiError(
        new Response(null, { status: 503 }),
        { detail: 'Test-only restore rejection' },
      )
      appearanceApiDoubles.getDesignSystemAppearance
        .mockRejectedValueOnce(restoreError)
        .mockResolvedValueOnce(ownedAppearance)
      stores = createStores()

      await loginAs(stores.session, context)
      expect(stores.session.context).toBeNull()
      expect(stores.session.unitCode).toBe('')
      expect(stores.appearance.isAuthenticatedContentReady).toBe(false)
      expect(stores.appearance.isTenantContentReady).toBe(false)
      expect(await stores.appearance.waitForAuthenticatedContent()).toBe(false)

      expect(stores.appearance.restoreStatus).toBe('error')
      expect(stores.appearance.restoreError).toBe(restoreError)
      expect(stores.appearance.isAuthenticatedContentReady).toBe(false)
      expect(appearanceApiDoubles.getDesignSystemAppearance).toHaveBeenCalledTimes(1)
      expect(appearanceApiDoubles.putDesignSystemAppearance).not.toHaveBeenCalled()
      expect(appearanceApiDoubles.resetDesignSystemAppearance).not.toHaveBeenCalled()

      expect(await stores.appearance.retryRestore()).toBe(true)
      expect(appearanceApiDoubles.getDesignSystemAppearance).toHaveBeenCalledTimes(2)
      expect(stores.appearance.snapshot).toEqual(ownedAppearance)
      expect(stores.appearance.persistedSnapshot).toEqual(ownedAppearance)
      expect(stores.appearance.isAuthenticatedContentReady).toBe(true)
      expect(stores.appearance.isTenantContentReady).toBe(false)
      expect(appearanceApiDoubles.putDesignSystemAppearance).not.toHaveBeenCalled()
      expect(appearanceApiDoubles.resetDesignSystemAppearance).not.toHaveBeenCalled()

      const contextResult = await stores.session.ensureContext()
      expect(contextResult.kind).toBe(ACCESS_ACTION_RESULT.SUCCESS)
      expect(stores.session.status).toBe('ready')
      expect(stores.appearance.isAuthenticatedContentReady).toBe(true)
      expect(stores.appearance.isTenantContentReady).toBe(true)
    },
  )

  it('mantiene cerrada la barrera tenant ante un DashboardApiError real de contexto', async () => {
    const { session, appearance: appearanceStore } = stores = createStores()
    await loginAs(session, authContext(TEST_PRINCIPAL_ID, TEST_TENANT_CODE, null))
    await restoreAppearance(appearanceStore)
    authApiDoubles.getAuthContext.mockRejectedValueOnce(new DashboardApiError('network'))

    const contextResult = await session.ensureContext()

    expect(contextResult.kind).toBe(ACCESS_ACTION_RESULT.UNCERTAIN)
    expect(session.failure).toMatchObject({ operation: 'context', kind: 'network' })
    expect(appearanceStore.isAuthenticatedContentReady).toBe(true)
    expect(appearanceStore.isTenantContentReady).toBe(false)
  })

  it('comparte el GET del mismo principal/generación y abre uno nuevo al cambiar de generación', async () => {
    const firstRestore = deferred<DesignSystemAppearance>()
    const nextPrincipalRestore = deferred<DesignSystemAppearance>()
    const principalA = authContext(61, 'tenant-test-a', null)
    const principalB = authContext(62, 'tenant-test-b', null)
    const ownedA = appearance({ accent: DESIGN_SYSTEM_ACCENT.BLUE })
    const ownedB = appearance({ theme: DESIGN_SYSTEM_THEME.LIGHT })
    appearanceApiDoubles.getDesignSystemAppearance
      .mockReturnValueOnce(firstRestore.promise)
      .mockReturnValueOnce(nextPrincipalRestore.promise)
    stores = createStores()

    await loginAs(stores.session, principalA)
    const restoreA = stores.appearance.waitForAuthenticatedContent()
    const principalGeneration = stores.appearance.principalGeneration

    const contextResult = await stores.session.ensureContext()
    expect(contextResult.kind).toBe(ACCESS_ACTION_RESULT.SUCCESS)
    await stores.session.ensureContext()
    expect(stores.appearance.principalGeneration).toBe(principalGeneration)
    expect(appearanceApiDoubles.getDesignSystemAppearance).toHaveBeenCalledTimes(1)

    stores.session.purge()
    expect(stores.appearance.principalUserId).toBeNull()
    expect(stores.appearance.persistedSnapshot).toBeNull()
    await loginAs(stores.session, principalB)
    const restoreB = stores.appearance.waitForAuthenticatedContent()

    expect(appearanceApiDoubles.getDesignSystemAppearance).toHaveBeenCalledTimes(2)
    expect(stores.appearance.principalGeneration).toBeGreaterThan(principalGeneration)
    const firstSignal = appearanceApiDoubles.getDesignSystemAppearance.mock.calls[0]?.[0]
    expect(firstSignal?.aborted).toBe(true)

    nextPrincipalRestore.resolve(ownedB)
    await restoreB
    firstRestore.resolve(ownedA)
    expect(await restoreA).toBe(true)

    expect(stores.appearance.principalUserId).toBe(principalB.user.id_usuario)
    expect(stores.appearance.snapshot).toEqual(ownedB)
    expect(stores.appearance.persistedSnapshot).toEqual(ownedB)
  })

  it('coalesce dos intenciones dentro del debounce en la última instantánea', async () => {
    const { session, appearance: appearanceStore } = stores = createStores()
    await loginAs(session, authContext(TEST_PRINCIPAL_ID, TEST_TENANT_CODE, null))
    await restoreAppearance(appearanceStore)
    vi.useFakeTimers()

    expect(appearanceStore.updateAxis('theme', DESIGN_SYSTEM_THEME.LIGHT)).toBe(true)
    const latest = appearance({
      theme: DESIGN_SYSTEM_THEME.LIGHT,
      accent: DESIGN_SYSTEM_ACCENT.GREEN,
    })
    expect(appearanceStore.updateAxis('accent', DESIGN_SYSTEM_ACCENT.GREEN)).toBe(true)
    expect(appearanceApiDoubles.putDesignSystemAppearance).not.toHaveBeenCalled()

    await firePendingDebounce()

    expect(appearanceApiDoubles.putDesignSystemAppearance).toHaveBeenCalledTimes(1)
    expect(appearanceApiDoubles.putDesignSystemAppearance.mock.calls[0]?.[0]).toEqual(latest)
    expect(appearanceStore.snapshot).toEqual(latest)
    expect(appearanceStore.persistedSnapshot).toEqual(latest)
    expect(appearanceStore.saved).toBe(true)
  })

  it('serializa una mutación en vuelo con la siguiente intención y mantiene snapshots coherentes', async () => {
    const { session, appearance: appearanceStore } = stores = createStores()
    await loginAs(session, authContext(TEST_PRINCIPAL_ID, TEST_TENANT_CODE, null))
    await restoreAppearance(appearanceStore)
    vi.useFakeTimers()

    const firstPut = deferred<DesignSystemAppearance>()
    const secondPut = deferred<DesignSystemAppearance>()
    const responses = [firstPut, secondPut]
    let activePuts = 0
    let maximumActivePuts = 0
    appearanceApiDoubles.putDesignSystemAppearance.mockImplementation(async () => {
      activePuts += 1
      maximumActivePuts = Math.max(maximumActivePuts, activePuts)
      const response = responses.shift()
      if (!response) throw new Error('No se preparó una respuesta PUT para esta llamada.')
      try {
        return await response.promise
      } finally {
        activePuts -= 1
      }
    })

    expect(appearanceStore.updateAxis('accent', DESIGN_SYSTEM_ACCENT.GREEN)).toBe(true)
    const firstSnapshot = appearance({ accent: DESIGN_SYSTEM_ACCENT.GREEN })
    await firePendingDebounce()
    expect(appearanceApiDoubles.putDesignSystemAppearance).toHaveBeenCalledTimes(1)
    expect(appearanceStore.inFlightKind).toBe('put')

    expect(appearanceStore.updateAxis('theme', DESIGN_SYSTEM_THEME.LIGHT)).toBe(true)
    const latestSnapshot = appearance({
      accent: DESIGN_SYSTEM_ACCENT.GREEN,
      theme: DESIGN_SYSTEM_THEME.LIGHT,
    })
    await firePendingDebounce()
    expect(appearanceApiDoubles.putDesignSystemAppearance).toHaveBeenCalledTimes(1)
    expect(appearanceStore.snapshot).toEqual(latestSnapshot)
    expect(appearanceStore.pendingMutationCount).toBe(1)

    firstPut.resolve(firstSnapshot)
    await settleMicrotasks()
    expect(appearanceStore.persistedSnapshot).toEqual(firstSnapshot)
    expect(appearanceStore.snapshot).toEqual(latestSnapshot)
    expect(appearanceStore.saved).toBe(false)

    await firePendingDebounce()
    expect(appearanceApiDoubles.putDesignSystemAppearance).toHaveBeenCalledTimes(2)
    expect(appearanceApiDoubles.putDesignSystemAppearance.mock.calls[1]?.[0])
      .toEqual(latestSnapshot)
    expect(maximumActivePuts).toBe(1)

    secondPut.resolve(latestSnapshot)
    await settleMicrotasks()
    expect(appearanceStore.persistedSnapshot).toEqual(latestSnapshot)
    expect(appearanceStore.snapshot).toEqual(latestSnapshot)
    expect(appearanceStore.pendingMutationCount).toBe(0)
    expect(appearanceStore.saved).toBe(true)
    expect(maximumActivePuts).toBe(1)
  })

  it('reconcilia un PUT rechazado sólo con GET y reenvía la intención vigente tras acción explícita', async () => {
    const { session, appearance: appearanceStore } = stores = createStores()
    await loginAs(session, authContext(TEST_PRINCIPAL_ID, TEST_TENANT_CODE, null))
    await restoreAppearance(appearanceStore)
    vi.useFakeTimers()

    const requested = appearance({ accent: DESIGN_SYSTEM_ACCENT.GREEN })
    const putError = new Error('Test-only uncertain PUT')
    appearanceApiDoubles.putDesignSystemAppearance.mockRejectedValueOnce(putError)
    expect(appearanceStore.updateAppearance(requested)).toBe(true)
    await firePendingDebounce()

    expect(appearanceStore.reconciliationRequired).toBe(true)
    expect(appearanceStore.saveError).toBe(putError)
    expect(appearanceStore.snapshot).toEqual(requested)
    expect(appearanceStore.persistedSnapshot).toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE)

    const getCount = appearanceApiDoubles.getDesignSystemAppearance.mock.calls.length
    const putCount = appearanceApiDoubles.putDesignSystemAppearance.mock.calls.length
    const deleteCount = appearanceApiDoubles.resetDesignSystemAppearance.mock.calls.length
    appearanceApiDoubles.getDesignSystemAppearance.mockResolvedValueOnce(
      DEFAULT_DESIGN_SYSTEM_APPEARANCE,
    )
    expect(await appearanceStore.reconcile()).toBe(true)

    expect(appearanceApiDoubles.getDesignSystemAppearance).toHaveBeenCalledTimes(getCount + 1)
    expect(appearanceApiDoubles.putDesignSystemAppearance).toHaveBeenCalledTimes(putCount)
    expect(appearanceApiDoubles.resetDesignSystemAppearance).toHaveBeenCalledTimes(deleteCount)
    expect(appearanceStore.canRetryPendingMutation).toBe(true)

    expect(appearanceStore.retryPendingMutation()).toBe(true)
    expect(appearanceApiDoubles.putDesignSystemAppearance).toHaveBeenCalledTimes(putCount + 1)
    expect(appearanceApiDoubles.putDesignSystemAppearance.mock.calls[putCount]?.[0])
      .toEqual(requested)
    await settleMicrotasks()

    expect(appearanceStore.persistedSnapshot).toEqual(requested)
    expect(appearanceStore.snapshot).toEqual(requested)
    expect(appearanceStore.saved).toBe(true)
  })

  it('reconcilia una respuesta PUT canónica distinta sin reenviar si GET confirma la intención', async () => {
    const { session, appearance: appearanceStore } = stores = createStores()
    await loginAs(session, authContext(TEST_PRINCIPAL_ID, TEST_TENANT_CODE, null))
    await restoreAppearance(appearanceStore)
    vi.useFakeTimers()

    const requested = appearance({ accent: DESIGN_SYSTEM_ACCENT.BLUE })
    const canonicalDifference = appearance({ theme: DESIGN_SYSTEM_THEME.LIGHT })
    appearanceApiDoubles.putDesignSystemAppearance.mockResolvedValueOnce(canonicalDifference)
    expect(appearanceStore.updateAppearance(requested)).toBe(true)
    await firePendingDebounce()

    expect(appearanceStore.reconciliationRequired).toBe(true)
    expect(appearanceStore.persistedSnapshot).toEqual(canonicalDifference)
    expect(appearanceStore.snapshot).toEqual(requested)
    const getCount = appearanceApiDoubles.getDesignSystemAppearance.mock.calls.length
    const putCount = appearanceApiDoubles.putDesignSystemAppearance.mock.calls.length
    const deleteCount = appearanceApiDoubles.resetDesignSystemAppearance.mock.calls.length
    appearanceApiDoubles.getDesignSystemAppearance.mockResolvedValueOnce(requested)

    expect(await appearanceStore.reconcile()).toBe(true)

    expect(appearanceApiDoubles.getDesignSystemAppearance).toHaveBeenCalledTimes(getCount + 1)
    expect(appearanceApiDoubles.putDesignSystemAppearance).toHaveBeenCalledTimes(putCount)
    expect(appearanceApiDoubles.resetDesignSystemAppearance).toHaveBeenCalledTimes(deleteCount)
    expect(appearanceStore.snapshot).toEqual(requested)
    expect(appearanceStore.persistedSnapshot).toEqual(requested)
    expect(appearanceStore.canRetryPendingMutation).toBe(false)
    expect(appearanceStore.retryPendingMutation()).toBe(false)
    expect(appearanceApiDoubles.putDesignSystemAppearance).toHaveBeenCalledTimes(putCount)
  })

  it('encola reset después del PUT en vuelo, sin solapar DELETE, y conserva defaults canónicos', async () => {
    const initial = appearance({ accent: DESIGN_SYSTEM_ACCENT.BLUE })
    appearanceApiDoubles.getDesignSystemAppearance.mockResolvedValueOnce(initial)
    const { session, appearance: appearanceStore } = stores = createStores()
    await loginAs(session, authContext(TEST_PRINCIPAL_ID, TEST_TENANT_CODE, null))
    await restoreAppearance(appearanceStore)
    vi.useFakeTimers()

    const putGate = deferred<DesignSystemAppearance>()
    const deleteGate = deferred<void>()
    const timeline: string[] = []
    appearanceApiDoubles.putDesignSystemAppearance.mockImplementation(async () => {
      timeline.push('put:start')
      const response = await putGate.promise
      timeline.push('put:end')
      return response
    })
    appearanceApiDoubles.resetDesignSystemAppearance.mockImplementation(async () => {
      timeline.push('delete:start')
      await deleteGate.promise
      timeline.push('delete:end')
    })

    expect(appearanceStore.updateAxis('theme', DESIGN_SYSTEM_THEME.LIGHT)).toBe(true)
    const putSnapshot = appearance({ accent: DESIGN_SYSTEM_ACCENT.BLUE, theme: DESIGN_SYSTEM_THEME.LIGHT })
    await firePendingDebounce()
    expect(appearanceApiDoubles.putDesignSystemAppearance).toHaveBeenCalledTimes(1)
    expect(appearanceStore.reset()).toBe(true)
    expect(appearanceStore.snapshot).toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
    expect(appearanceStore.pendingReset).toBe(true)
    expect(appearanceApiDoubles.resetDesignSystemAppearance).not.toHaveBeenCalled()

    putGate.resolve(putSnapshot)
    await settleMicrotasks()
    expect(timeline).toEqual(['put:start', 'put:end', 'delete:start'])
    expect(appearanceApiDoubles.resetDesignSystemAppearance).toHaveBeenCalledTimes(1)
    expect(appearanceStore.inFlightKind).toBe('delete')

    deleteGate.resolve()
    await settleMicrotasks()
    expect(timeline).toEqual(['put:start', 'put:end', 'delete:start', 'delete:end'])
    expect(appearanceStore.snapshot).toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
    expect(appearanceStore.persistedSnapshot).toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
    expect(appearanceStore.pendingMutationCount).toBe(0)
    expect(appearanceStore.saved).toBe(true)
  })

  it('reconcilia reset fallido sin reproducir DELETE automáticamente', async () => {
    const persisted = appearance({ accent: DESIGN_SYSTEM_ACCENT.BLUE })
    appearanceApiDoubles.getDesignSystemAppearance.mockResolvedValueOnce(persisted)
    const { session, appearance: appearanceStore } = stores = createStores()
    await loginAs(session, authContext(TEST_PRINCIPAL_ID, TEST_TENANT_CODE, null))
    await restoreAppearance(appearanceStore)

    const deleteError = new Error('Test-only uncertain DELETE')
    appearanceApiDoubles.resetDesignSystemAppearance.mockRejectedValueOnce(deleteError)
    expect(appearanceStore.reset()).toBe(true)
    await settleMicrotasks()

    expect(appearanceStore.snapshot).toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
    expect(appearanceStore.reconciliationRequired).toBe(true)
    expect(appearanceStore.saveError).toBe(deleteError)
    expect(appearanceApiDoubles.resetDesignSystemAppearance).toHaveBeenCalledTimes(1)
    expect(appearanceApiDoubles.putDesignSystemAppearance).not.toHaveBeenCalled()

    const getCount = appearanceApiDoubles.getDesignSystemAppearance.mock.calls.length
    appearanceApiDoubles.getDesignSystemAppearance.mockResolvedValueOnce(persisted)
    expect(await appearanceStore.reconcile()).toBe(true)

    expect(appearanceApiDoubles.getDesignSystemAppearance).toHaveBeenCalledTimes(getCount + 1)
    expect(appearanceApiDoubles.resetDesignSystemAppearance).toHaveBeenCalledTimes(1)
    expect(appearanceApiDoubles.putDesignSystemAppearance).not.toHaveBeenCalled()
    expect(appearanceStore.persistedSnapshot).toEqual(persisted)
    expect(appearanceStore.snapshot).toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
    expect(appearanceStore.canRetryPendingMutation).toBe(true)
  })

  it('conserva apariencia y cola al cambiar de unidad del mismo principal', async () => {
    const { session, appearance: appearanceStore } = stores = createStores()
    await loginAs(session, authContext(TEST_PRINCIPAL_ID, TEST_TENANT_CODE, TEST_UNIT_CODE))
    const initialContext = await session.ensureContext()
    expect(initialContext.kind).toBe(ACCESS_ACTION_RESULT.SUCCESS)
    await restoreAppearance(appearanceStore)
    vi.useFakeTimers()

    const principalGeneration = appearanceStore.principalGeneration
    const queuedAppearance = appearance({ accent: DESIGN_SYSTEM_ACCENT.GREEN })
    expect(appearanceStore.updateAppearance(queuedAppearance)).toBe(true)
    expect(appearanceStore.pendingMutationCount).toBe(1)
    activeContext = authContext(TEST_PRINCIPAL_ID, TEST_TENANT_CODE, 'unit-test-b')

    const selection = await session.selectUnit({ organization_unit_code: 'unit-test-b' })

    expect(selection.kind).toBe(ACCESS_ACTION_RESULT.SUCCESS)
    expect(session.context?.active_organization_unit).toBe('unit-test-b')
    expect(session.unitCode).toBe('unit-test-b')
    expect(appearanceStore.principalGeneration).toBe(principalGeneration)
    expect(appearanceStore.principalUserId).toBe(TEST_PRINCIPAL_ID)
    expect(appearanceStore.snapshot).toEqual(queuedAppearance)
    expect(appearanceStore.pendingMutationCount).toBe(1)
    expect(appearanceApiDoubles.getDesignSystemAppearance).toHaveBeenCalledTimes(1)

    await firePendingDebounce()
    expect(appearanceApiDoubles.putDesignSystemAppearance).toHaveBeenCalledTimes(1)
    expect(appearanceApiDoubles.putDesignSystemAppearance.mock.calls[0]?.[0])
      .toEqual(queuedAppearance)
  })

  it('purga snapshot, cola y data-* sin esperar la respuesta de logout', async () => {
    const { session, appearance: appearanceStore } = stores = createStores()
    await loginAs(session, authContext(TEST_PRINCIPAL_ID, TEST_TENANT_CODE, null))
    await restoreAppearance(appearanceStore)
    vi.useFakeTimers()

    expect(appearanceStore.updateAxis('accent', DESIGN_SYSTEM_ACCENT.GREEN)).toBe(true)
    expect(appearanceStore.pendingMutationCount).toBe(1)
    const logoutResponse = deferred<AccessActionResult<DetailResponse>>()
    authApiDoubles.logout.mockReturnValueOnce(logoutResponse.promise)

    const logout = session.logout()

    expect(session.logoutBusy).toBe(true)
    expect(appearanceStore.principalUserId).toBeNull()
    expect(appearanceStore.snapshot).toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
    expect(appearanceStore.persistedSnapshot).toBeNull()
    expect(appearanceStore.pendingMutationCount).toBe(0)
    expect(appearanceStore.mutationInFlight).toBe(false)
    expectDefaultDomAttributes()
    expect(appearanceApiDoubles.putDesignSystemAppearance).not.toHaveBeenCalled()
    expect(appearanceApiDoubles.resetDesignSystemAppearance).not.toHaveBeenCalled()

    logoutResponse.resolve({
      kind: ACCESS_ACTION_RESULT.SUCCESS,
      response: { detail: 'Test-only logout response' },
    })
    await logout
    expect(session.logoutBusy).toBe(false)
  })

  it('purga al cambiar de principal y descarta la respuesta PUT tardía del anterior', async () => {
    const principalA = authContext(81, 'tenant-test-a', null)
    const principalB = authContext(82, 'tenant-test-b', null)
    const nextPreferences = appearance({ theme: DESIGN_SYSTEM_THEME.LIGHT })
    const { session, appearance: appearanceStore } = stores = createStores()
    await loginAs(session, principalA)
    await restoreAppearance(appearanceStore)
    vi.useFakeTimers()

    const oldPut = deferred<DesignSystemAppearance>()
    appearanceApiDoubles.putDesignSystemAppearance.mockReturnValueOnce(oldPut.promise)
    expect(appearanceStore.updateAxis('accent', DESIGN_SYSTEM_ACCENT.GREEN)).toBe(true)
    await firePendingDebounce()
    expect(appearanceApiDoubles.putDesignSystemAppearance).toHaveBeenCalledTimes(1)
    const oldSignal = appearanceApiDoubles.putDesignSystemAppearance.mock.calls[0]?.[1]

    activeContext = principalB
    session.captureTenant('tenant-test-b')
    expect(appearanceStore.principalUserId).toBeNull()
    expect(appearanceStore.snapshot).toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
    expect(appearanceStore.persistedSnapshot).toBeNull()
    expect(appearanceStore.pendingMutationCount).toBe(0)
    expect(appearanceStore.mutationInFlight).toBe(false)
    expect(oldSignal?.aborted).toBe(true)
    expectDefaultDomAttributes()

    appearanceApiDoubles.getDesignSystemAppearance.mockResolvedValueOnce(nextPreferences)
    await loginAs(session, principalB)
    await restoreAppearance(appearanceStore)
    expect(appearanceStore.principalUserId).toBe(principalB.user.id_usuario)
    expect(appearanceStore.snapshot).toEqual(nextPreferences)

    oldPut.resolve(appearance({ accent: DESIGN_SYSTEM_ACCENT.GREEN }))
    await settleMicrotasks()

    expect(appearanceStore.principalUserId).toBe(principalB.user.id_usuario)
    expect(appearanceStore.snapshot).toEqual(nextPreferences)
    expect(appearanceStore.persistedSnapshot).toEqual(nextPreferences)
    expect(appearanceStore.pendingMutationCount).toBe(0)
  })
})
