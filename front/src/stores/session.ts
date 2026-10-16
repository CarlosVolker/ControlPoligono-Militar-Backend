import { reactive, toRefs } from 'vue'
import { defineStore } from 'pinia'
import {
  changeRequiredPassword as postRequiredPassword,
  getAuthContext,
  login as postLogin,
  logout as postLogout,
  selectUnit as postSelectUnit,
  validateAuthContext,
} from '../api/auth'
import { DashboardApiError, TENANT_CONTEXT_DENIED_DETAIL } from '../api/dashboard'
import {
  ACCESS_ACTION_BLOCK_REASON,
  ACCESS_ACTION_RESULT,
  ACCESS_OPERATION_ERROR_KIND,
  type AccessActionBlockReason,
  type AccessActionResult,
  type AccessOperationError,
  type AccessOperationErrorKind,
  type ChangeRequiredPasswordRequest,
  type ChangeRequiredPasswordResponse,
  type DetailResponse,
  type LoginRequest,
  type LoginResponse,
  type SelectUnitRequest,
  type SelectUnitResponse,
} from '../types/auth'
import type { ApiConnection, AuthContext } from '../types'
import {
  SESSION_LOGOUT_SERVER_RESULT,
  SESSION_MUTATION,
  SESSION_OPERATION,
  SESSION_STATUS,
  type SessionActions,
  type SessionBusyState,
  type SessionFailure,
  type SessionOperation,
  type SessionState,
  type SessionStatus,
} from '../types/session'

const SELECT_UNIT_BUSINESS_DENIALS = new Set([
  'La unidad no está en tus pertenencias activas.',
  'La unidad no esta en sus asignaciones activas.',
])

const UNCERTAIN_ERROR_KINDS = new Set<AccessOperationErrorKind>([
  ACCESS_OPERATION_ERROR_KIND.NETWORK,
  ACCESS_OPERATION_ERROR_KIND.TIMEOUT,
  ACCESS_OPERATION_ERROR_KIND.ABORTED,
  ACCESS_OPERATION_ERROR_KIND.INVALID_RESPONSE,
])

function initialTenantCode(): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('tenant')?.trim() ?? ''
}

function emptyBusyState(): SessionBusyState {
  return {
    login: false,
    context: false,
    selectUnit: false,
    changeRequiredPassword: false,
  }
}

function isAbortError(value: unknown): boolean {
  return value instanceof Error && value.name === 'AbortError'
}

function isTimeoutError(value: unknown): boolean {
  return value instanceof Error && value.name === 'TimeoutError'
}

function blocked<T>(reason: AccessActionBlockReason): AccessActionResult<T> {
  return { kind: ACCESS_ACTION_RESULT.BLOCKED, reason }
}

function rejected<T>(error: AccessOperationError): AccessActionResult<T> {
  return { kind: ACCESS_ACTION_RESULT.REJECTED, error }
}

function uncertain<T>(error: AccessOperationError): AccessActionResult<T> {
  return { kind: ACCESS_ACTION_RESULT.UNCERTAIN, error }
}

function errorFromDashboard(error: unknown): AccessOperationError {
  if (error instanceof DashboardApiError) {
    const kind = error.status !== null
      ? ACCESS_OPERATION_ERROR_KIND.HTTP
      : error.kind === 'network'
        ? ACCESS_OPERATION_ERROR_KIND.NETWORK
        : error.kind === 'schema'
          ? ACCESS_OPERATION_ERROR_KIND.INVALID_RESPONSE
          : ACCESS_OPERATION_ERROR_KIND.CONFIGURATION

    return {
      kind,
      status: error.status,
      payload: error.payload,
      detail: error.detail,
      retryAfter: error.retryAfter,
    }
  }

  if (isTimeoutError(error)) {
    return {
      kind: ACCESS_OPERATION_ERROR_KIND.TIMEOUT,
      status: null,
      payload: undefined,
      detail: null,
      retryAfter: null,
    }
  }

  if (isAbortError(error)) {
    return {
      kind: ACCESS_OPERATION_ERROR_KIND.ABORTED,
      status: null,
      payload: undefined,
      detail: null,
      retryAfter: null,
    }
  }

  return {
    kind: ACCESS_OPERATION_ERROR_KIND.CONFIGURATION,
    status: null,
    payload: undefined,
    detail: null,
    retryAfter: null,
  }
}

function isErrorResult<T>(
  result: AccessActionResult<T>,
): result is Extract<AccessActionResult<T>, { kind: 'rejected' | 'uncertain' }> {
  return result.kind === ACCESS_ACTION_RESULT.REJECTED
    || result.kind === ACCESS_ACTION_RESULT.UNCERTAIN
}

function errorResult<T>(error: AccessOperationError): AccessActionResult<T> {
  return UNCERTAIN_ERROR_KINDS.has(error.kind) ? uncertain(error) : rejected(error)
}

export const useSessionStore = defineStore('session', () => {
  const state = reactive<SessionState>({
    status: SESSION_STATUS.NEEDS_TENANT,
    context: null,
    tenantCode: initialTenantCode(),
    unitCode: '',
    identity: null,
    busy: emptyBusyState(),
    logoutBusy: false,
    logoutOutcome: null,
    uncertainMutation: null,
    generation: 0,
    pendingRedirect: null,
    failure: null,
  })

  const operationVersions: Record<SessionOperation, number> = {
    [SESSION_OPERATION.LOGIN]: 0,
    [SESSION_OPERATION.CONTEXT]: 0,
    [SESSION_OPERATION.SELECT_UNIT]: 0,
    [SESSION_OPERATION.CHANGE_REQUIRED_PASSWORD]: 0,
    [SESSION_OPERATION.LOGOUT]: 0,
  }
  const controllers = new Map<SessionOperation, AbortController>()

  let contextFlight: {
    generation: number
    tenantCode: string
    controller: AbortController
    promise: Promise<AccessActionResult<AuthContext>>
  } | null = null
  let passwordChangeAwaitingContext = false
  let logoutOwner = 0
  let logoutFlight: Promise<AccessActionResult<DetailResponse>> | null = null

  function nextOperation(operation: SessionOperation): number {
    operationVersions[operation] += 1
    return operationVersions[operation]
  }

  function isOperationCurrent(
    operation: SessionOperation,
    operationVersion: number,
    generation: number,
    controller?: AbortController,
  ): boolean {
    return state.generation === generation
      && operationVersions[operation] === operationVersion
      && (controller === undefined
        || (controllers.get(operation) === controller && !controller.signal.aborted))
  }

  function busyKey(operation: SessionOperation): keyof SessionBusyState | null {
    if (operation === SESSION_OPERATION.LOGIN) return 'login'
    if (operation === SESSION_OPERATION.CONTEXT) return 'context'
    if (operation === SESSION_OPERATION.SELECT_UNIT) return 'selectUnit'
    if (operation === SESSION_OPERATION.CHANGE_REQUIRED_PASSWORD) return 'changeRequiredPassword'
    return null
  }

  function advanceGeneration(
    preserveBusyOperation?: SessionOperation,
    preserveController?: AbortController,
  ): void {
    state.generation += 1
    for (const controller of controllers.values()) {
      if (controller !== preserveController) controller.abort()
    }
    controllers.clear()
    if (preserveBusyOperation && preserveController) {
      controllers.set(preserveBusyOperation, preserveController)
    }
    if (contextFlight?.controller !== preserveController) {
      contextFlight = null
    } else if (contextFlight) {
      contextFlight.generation = state.generation
    }

    for (const operation of Object.values(SESSION_OPERATION)) {
      if (preserveController && operation === preserveBusyOperation) continue
      operationVersions[operation] += 1
    }

    state.busy = emptyBusyState()
    const preservedBusyKey = preserveBusyOperation ? busyKey(preserveBusyOperation) : null
    if (preservedBusyKey) state.busy[preservedBusyKey] = true
  }

  function startOperation(operation: SessionOperation): {
    generation: number
    operationVersion: number
    controller: AbortController
  } {
    const controller = new AbortController()
    const operationVersion = nextOperation(operation)
    const generation = state.generation
    controllers.set(operation, controller)
    const key = busyKey(operation)
    if (key) state.busy[key] = true
    return { generation, operationVersion, controller }
  }

  function clearOperation(
    operation: SessionOperation,
    operationVersion: number,
    generation: number,
    controller: AbortController,
  ): void {
    if (!isOperationCurrent(operation, operationVersion, generation, controller)) return
    if (controllers.get(operation) === controller) controllers.delete(operation)
    const key = busyKey(operation)
    if (key) state.busy[key] = false
  }

  function toFailure(operation: SessionOperation, error: AccessOperationError): SessionFailure {
    return {
      operation,
      kind: error.kind,
      status: error.status,
      detail: error.detail,
      retryAfter: error.retryAfter,
    }
  }

  function setFailure(
    operation: SessionOperation,
    error: AccessOperationError,
    status: SessionStatus = SESSION_STATUS.FAILURE,
  ): void {
    state.failure = toFailure(operation, error)
    state.status = status
  }

  function localOperationError(
    kind: AccessOperationErrorKind,
    detail: string,
  ): AccessOperationError {
    return { kind, status: null, payload: undefined, detail, retryAfter: null }
  }

  function invalidateIdentityAndAdvanceGeneration(): void {
    state.identity = null
    advanceGeneration()
  }

  function clearAuthState(options: {
    status: SessionStatus
    clearTenant: boolean
    clearRedirect: boolean
    clearLogoutOutcome: boolean
  }): void {
    state.identity = null
    state.context = null
    state.unitCode = ''
    if (options.clearTenant) state.tenantCode = ''
    if (options.clearRedirect) state.pendingRedirect = null
    state.failure = null
    state.uncertainMutation = null
    if (options.clearLogoutOutcome) state.logoutOutcome = null
    state.status = options.status
    passwordChangeAwaitingContext = false
  }

  function purgeToAnonymous(clearRedirect = false): void {
    invalidateIdentityAndAdvanceGeneration()
    clearAuthState({
      status: SESSION_STATUS.ANONYMOUS,
      clearTenant: true,
      clearRedirect,
      clearLogoutOutcome: true,
    })
  }

  function beginContextLost(): void {
    invalidateIdentityAndAdvanceGeneration()
    clearAuthState({
      status: SESSION_STATUS.CONTEXT_LOST,
      clearTenant: false,
      clearRedirect: false,
      clearLogoutOutcome: true,
    })
  }

  function beginCoherenceFailure(detail: string): AccessOperationError {
    invalidateIdentityAndAdvanceGeneration()
    clearAuthState({
      status: SESSION_STATUS.FAILURE,
      clearTenant: false,
      clearRedirect: true,
      clearLogoutOutcome: true,
    })
    const error = localOperationError(ACCESS_OPERATION_ERROR_KIND.IDENTITY_MISMATCH, detail)
    setFailure(SESSION_OPERATION.CONTEXT, error)
    return error
  }

  function resolvedUnitCode(context: AuthContext): string {
    return context.active_organization_unit?.trim()
      || context.unit_membership?.unit_code.trim()
      || ''
  }

  function isExpiredOrTenantDenied(error: AccessOperationError): boolean {
    return error.status === 401
      || (error.status === 403 && error.detail === TENANT_CONTEXT_DENIED_DETAIL)
  }

  function hasAnyMutationBusy(): boolean {
    return state.busy.selectUnit || state.busy.changeRequiredPassword
  }

  function reconcileErrorStatus(operation: SessionOperation, error: AccessOperationError): void {
    if (isExpiredOrTenantDenied(error)) {
      purgeToAnonymous()
      return
    }
    setFailure(operation, error)
  }

  function reconcileContextErrorStatus(error: AccessOperationError): void {
    if (error.status === 401 || error.status === 403) {
      purgeToAnonymous()
      return
    }
    setFailure(SESSION_OPERATION.CONTEXT, error)
  }

  function markSelectUnitUncertain(error: AccessOperationError): void {
    advanceGeneration()
    state.uncertainMutation = {
      operation: SESSION_MUTATION.SELECT_UNIT,
      generation: state.generation,
    }
    setFailure(SESSION_OPERATION.SELECT_UNIT, error)
  }

  function captureTenant(tenantCode: string): void {
    if (state.logoutBusy) return

    const previousTenant = state.tenantCode.trim()
    const nextTenant = tenantCode.trim()
    if (nextTenant === state.tenantCode) {
      if (!nextTenant) state.status = SESSION_STATUS.NEEDS_TENANT
      return
    }

    invalidateIdentityAndAdvanceGeneration()
    state.tenantCode = nextTenant
    clearAuthState({
      status: SESSION_STATUS.NEEDS_TENANT,
      clearTenant: false,
      clearRedirect: Boolean(previousTenant) && previousTenant !== nextTenant,
      clearLogoutOutcome: true,
    })
  }

  async function login(
    credentials: LoginRequest,
    tenantCode: string,
    callerSignal?: AbortSignal,
  ): Promise<AccessActionResult<LoginResponse>> {
    if (callerSignal?.aborted) return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
    if (state.logoutBusy || state.busy.login || hasAnyMutationBusy() || state.busy.context) {
      return blocked(ACCESS_ACTION_BLOCK_REASON.BUSY)
    }

    const capturedTenant = tenantCode.trim()
    if (!capturedTenant) return blocked(ACCESS_ACTION_BLOCK_REASON.MISSING_TENANT)

    const previousTenant = state.tenantCode.trim()
    const previousIdentityId = state.identity?.id_usuario ?? null
    invalidateIdentityAndAdvanceGeneration()
    state.tenantCode = capturedTenant
    clearAuthState({
      status: SESSION_STATUS.BOOTING,
      clearTenant: false,
      clearRedirect: Boolean(previousTenant) && previousTenant !== capturedTenant,
      clearLogoutOutcome: true,
    })
    state.status = SESSION_STATUS.BOOTING

    const operation = SESSION_OPERATION.LOGIN
    const { generation, operationVersion, controller } = startOperation(operation)
    const cancelLogin = (): void => {
      if (!isOperationCurrent(operation, operationVersion, generation, controller)) return
      invalidateIdentityAndAdvanceGeneration()
      clearAuthState({
        status: SESSION_STATUS.ANONYMOUS,
        clearTenant: false,
        clearRedirect: false,
        clearLogoutOutcome: true,
      })
    }
    callerSignal?.addEventListener('abort', cancelLogin, { once: true })

    try {
      if (callerSignal?.aborted) {
        cancelLogin()
        return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
      }

      const result = await postLogin(credentials, controller.signal)
      if (!isOperationCurrent(operation, operationVersion, generation, controller)) {
        return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
      }

      if (result.kind === ACCESS_ACTION_RESULT.SUCCESS) {
        if (previousIdentityId !== null && previousIdentityId !== result.response.id_usuario) {
          state.pendingRedirect = null
        }
        state.identity = {
          id_usuario: result.response.id_usuario,
          must_change_password: result.response.must_change_password,
          source: 'login',
        }
        state.context = null
        state.unitCode = ''
        state.failure = null
        state.uncertainMutation = null
        state.status = result.response.must_change_password
          ? SESSION_STATUS.READY
          : SESSION_STATUS.BOOTING
        return result
      }

      if (isErrorResult(result)) {
        reconcileErrorStatus(operation, result.error)
      }
      return result
    } catch (error: unknown) {
      if (!isOperationCurrent(operation, operationVersion, generation, controller)) {
        return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
      }
      const accessError = errorFromDashboard(error)
      reconcileErrorStatus(operation, accessError)
      return errorResult(accessError)
    } finally {
      callerSignal?.removeEventListener('abort', cancelLogin)
      clearOperation(operation, operationVersion, generation, controller)
    }
  }

  async function ensureContext(): Promise<AccessActionResult<AuthContext>> {
    if (state.logoutBusy) return blocked(ACCESS_ACTION_BLOCK_REASON.BUSY)

    const tenantCode = state.tenantCode.trim()
    if (!tenantCode) {
      state.status = SESSION_STATUS.NEEDS_TENANT
      return blocked(ACCESS_ACTION_BLOCK_REASON.MISSING_TENANT)
    }

    if (
      contextFlight
      && contextFlight.generation === state.generation
      && contextFlight.tenantCode === tenantCode
    ) return contextFlight.promise

    const operation = SESSION_OPERATION.CONTEXT
    const started = startOperation(operation)
    let generation = started.generation
    const operationVersion = started.operationVersion
    const { controller } = started
    state.status = SESSION_STATUS.BOOTING
    state.failure = null

    let promise: Promise<AccessActionResult<AuthContext>>
    promise = (async (): Promise<AccessActionResult<AuthContext>> => {
      try {
        const received = await getAuthContext({
          tenantCode,
          unitCode: '',
          signal: controller.signal,
        } satisfies ApiConnection)
        if (!isOperationCurrent(operation, operationVersion, generation, controller)) {
          return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
        }

        let context: AuthContext
        try {
          context = validateAuthContext(received)
        } catch (error: unknown) {
          const validationError = errorFromDashboard(error)
          setFailure(operation, validationError)
          return rejected(validationError)
        }

        const resolvedTenant = context.tenant.code?.trim() ?? ''
        if (!resolvedTenant) {
          beginContextLost()
          const contextError = localOperationError(
            ACCESS_OPERATION_ERROR_KIND.IDENTITY_MISMATCH,
            'El contexto confirmado no contiene una institución activa.',
          )
          state.failure = toFailure(operation, contextError)
          return rejected(contextError)
        }

        if (resolvedTenant !== tenantCode) {
          const coherenceError = beginCoherenceFailure(
            'El tenant del contexto no coincide con la institución capturada.',
          )
          return rejected(coherenceError)
        }

        if (state.identity && state.identity.id_usuario !== context.user.id_usuario) {
          const coherenceError = beginCoherenceFailure(
            'La identidad del contexto no coincide con la identidad de acceso.',
          )
          return rejected(coherenceError)
        }

        if (
          state.identity?.must_change_password === true
          && context.user.must_change_password === false
          && !passwordChangeAwaitingContext
        ) {
          const coherenceError = beginCoherenceFailure(
            'El contexto no confirma un cambio de contraseña autorizado en esta sesión.',
          )
          return rejected(coherenceError)
        }

        const nextUnitCode = resolvedUnitCode(context)
        const mutationNeedsReconciliation = state.uncertainMutation?.operation
          === SESSION_MUTATION.SELECT_UNIT
        if (
          nextUnitCode !== state.unitCode
          || mutationNeedsReconciliation
          || context.user.must_change_password
        ) {
          advanceGeneration(operation, controller)
          generation = state.generation
        }

        state.context = context
        state.tenantCode = tenantCode
        state.unitCode = nextUnitCode
        state.identity = {
          id_usuario: context.user.id_usuario,
          must_change_password: context.user.must_change_password,
          source: 'context',
        }
        state.uncertainMutation = null
        state.failure = null
        state.status = SESSION_STATUS.READY

        if (context.user.must_change_password === false) {
          passwordChangeAwaitingContext = false
        }

        return { kind: ACCESS_ACTION_RESULT.SUCCESS, response: context }
      } catch (error: unknown) {
        if (!isOperationCurrent(operation, operationVersion, generation, controller)) {
          return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
        }
        const accessError = errorFromDashboard(error)
        reconcileContextErrorStatus(accessError)
        return errorResult(accessError)
      } finally {
        clearOperation(operation, operationVersion, generation, controller)
        if (contextFlight?.controller === controller) contextFlight = null
      }
    })()

    contextFlight = { generation, tenantCode, controller, promise }
    return promise
  }

  async function selectUnit(
    request: SelectUnitRequest,
  ): Promise<AccessActionResult<SelectUnitResponse>> {
    if (
      state.logoutBusy
      || state.busy.selectUnit
      || state.busy.context
      || state.busy.changeRequiredPassword
    ) return blocked(ACCESS_ACTION_BLOCK_REASON.BUSY)
    if (!state.tenantCode.trim()) return blocked(ACCESS_ACTION_BLOCK_REASON.MISSING_TENANT)
    if (!state.context || !state.identity || state.status !== SESSION_STATUS.READY) {
      return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
    }
    if (state.identity.must_change_password) {
      return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
    }
    if (state.uncertainMutation) return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)

    const tenantCode = state.tenantCode.trim()
    const operation = SESSION_OPERATION.SELECT_UNIT
    let { generation, operationVersion, controller } = startOperation(operation)

    try {
      const result = await postSelectUnit(request, { tenantCode }, controller.signal)
      if (!isOperationCurrent(operation, operationVersion, generation, controller)) {
        return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
      }

      if (result.kind !== ACCESS_ACTION_RESULT.SUCCESS) {
        if (!isErrorResult(result)) return result

        const error = result.error
        if (error.status === 401 || (error.status === 403 && error.detail === TENANT_CONTEXT_DENIED_DETAIL)) {
          purgeToAnonymous()
          return result
        }

        if (
          result.kind === ACCESS_ACTION_RESULT.UNCERTAIN
          || UNCERTAIN_ERROR_KINDS.has(error.kind)
        ) {
          markSelectUnitUncertain(error)
          return result
        }

        if (error.status === 403 && !SELECT_UNIT_BUSINESS_DENIALS.has(error.detail ?? '')) {
          await ensureContext()
          if (!isOperationCurrent(operation, operationVersion, generation)) return result
        }

        state.failure = toFailure(operation, error)
        return result
      }

      const responseTenant = result.response.tenant_code.trim()
      const nextUnitCode = result.response.organization_unit_code.trim()
      if (responseTenant !== tenantCode || !nextUnitCode) {
        advanceGeneration()
        state.context = null
        state.unitCode = ''
        state.pendingRedirect = null
        state.uncertainMutation = {
          operation: SESSION_MUTATION.SELECT_UNIT,
          generation: state.generation,
        }
        const mismatch = localOperationError(
          ACCESS_OPERATION_ERROR_KIND.IDENTITY_MISMATCH,
          'La respuesta de selección no coincide con la institución capturada.',
        )
        setFailure(operation, mismatch)
        return rejected(mismatch)
      }

      advanceGeneration(operation)
      generation = state.generation
      operationVersion = nextOperation(operation)
      controller = new AbortController()
      controllers.set(operation, controller)
      state.context = null
      state.unitCode = nextUnitCode
      state.uncertainMutation = null
      state.failure = null
      state.status = SESSION_STATUS.BOOTING

      await ensureContext()
      return result
    } catch (error: unknown) {
      if (!isOperationCurrent(operation, operationVersion, generation, controller)) {
        return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
      }
      const accessError = errorFromDashboard(error)
      if (UNCERTAIN_ERROR_KINDS.has(accessError.kind)) {
        markSelectUnitUncertain(accessError)
      } else {
        reconcileErrorStatus(operation, accessError)
      }
      return errorResult(accessError)
    } finally {
      clearOperation(operation, operationVersion, generation, controller)
    }
  }

  async function changeRequiredPassword(
    request: ChangeRequiredPasswordRequest,
  ): Promise<AccessActionResult<ChangeRequiredPasswordResponse>> {
    if (
      state.logoutBusy
      || state.busy.changeRequiredPassword
      || state.busy.selectUnit
      || state.busy.context
    ) return blocked(ACCESS_ACTION_BLOCK_REASON.BUSY)
    if (!state.tenantCode.trim()) return blocked(ACCESS_ACTION_BLOCK_REASON.MISSING_TENANT)
    if (!state.identity) return blocked(ACCESS_ACTION_BLOCK_REASON.IDENTITY_UNAVAILABLE)
    if (!state.identity.must_change_password || state.uncertainMutation || passwordChangeAwaitingContext) {
      return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
    }

    const userId = state.identity.id_usuario
    const tenantCode = state.tenantCode.trim()
    const operation = SESSION_OPERATION.CHANGE_REQUIRED_PASSWORD
    const { generation, operationVersion, controller } = startOperation(operation)

    try {
      const result = await postRequiredPassword(
        userId,
        request,
        { tenantCode },
        controller.signal,
      )
      if (!isOperationCurrent(operation, operationVersion, generation, controller)) {
        return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
      }

      if (result.kind === ACCESS_ACTION_RESULT.SUCCESS) {
        passwordChangeAwaitingContext = true
        state.failure = null
        return result
      }

      if (isErrorResult(result)) {
        if (result.kind === ACCESS_ACTION_RESULT.UNCERTAIN || UNCERTAIN_ERROR_KINDS.has(result.error.kind)) {
          passwordChangeAwaitingContext = true
          state.uncertainMutation = {
            operation: SESSION_MUTATION.CHANGE_REQUIRED_PASSWORD,
            generation,
          }
          setFailure(operation, result.error)
          return result
        }

        if (
          result.error.status === 401
          || (result.error.status === 403 && result.error.detail === TENANT_CONTEXT_DENIED_DETAIL)
        ) {
          purgeToAnonymous()
          return result
        }

        if (result.error.status === 403) {
          await ensureContext()
          if (!isOperationCurrent(operation, operationVersion, generation)) return result
        }

        state.failure = toFailure(operation, result.error)
      }
      return result
    } catch (error: unknown) {
      if (!isOperationCurrent(operation, operationVersion, generation, controller)) {
        return blocked(ACCESS_ACTION_BLOCK_REASON.INVALID_STATE)
      }
      const accessError = errorFromDashboard(error)
      if (UNCERTAIN_ERROR_KINDS.has(accessError.kind)) {
        passwordChangeAwaitingContext = true
        state.uncertainMutation = {
          operation: SESSION_MUTATION.CHANGE_REQUIRED_PASSWORD,
          generation,
        }
      }
      reconcileErrorStatus(operation, accessError)
      return errorResult(accessError)
    } finally {
      clearOperation(operation, operationVersion, generation, controller)
    }
  }

  function setPendingRedirect(destination: string, attempt: number): void {
    if (!destination || !Number.isSafeInteger(attempt) || attempt < 1) return
    if (state.pendingRedirect && state.pendingRedirect.attempt !== attempt) return
    state.pendingRedirect = { destination, attempt }
  }

  function consumePendingRedirect(attempt: number): string | null {
    if (!state.pendingRedirect || state.pendingRedirect.attempt !== attempt) return null
    const destination = state.pendingRedirect.destination
    state.pendingRedirect = null
    return destination
  }

  function discardPendingRedirect(attempt: number): void {
    if (state.pendingRedirect?.attempt === attempt) state.pendingRedirect = null
  }

  function purge(): void {
    purgeToAnonymous(true)
  }

  async function logout(): Promise<AccessActionResult<DetailResponse>> {
    if (logoutFlight) return logoutFlight
    if (state.logoutBusy) return blocked(ACCESS_ACTION_BLOCK_REASON.BUSY)

    state.logoutBusy = true
    const owner = ++logoutOwner
    invalidateIdentityAndAdvanceGeneration()
    const closingGeneration = state.generation
    clearAuthState({
      status: SESSION_STATUS.ANONYMOUS,
      clearTenant: true,
      clearRedirect: true,
      clearLogoutOutcome: false,
    })
    state.logoutOutcome = {
      localPurged: true,
      server: SESSION_LOGOUT_SERVER_RESULT.NOT_ATTEMPTED,
    }

    const controller = new AbortController()
    let promise: Promise<AccessActionResult<DetailResponse>> | null = null
    promise = (async (): Promise<AccessActionResult<DetailResponse>> => {
      let result: AccessActionResult<DetailResponse>
      try {
        result = await postLogout(controller.signal)
      } catch (error: unknown) {
        result = errorResult(errorFromDashboard(error))
      } finally {
        if (logoutOwner === owner) {
          if (state.generation === closingGeneration) {
            state.context = null
            state.tenantCode = ''
            state.unitCode = ''
            state.identity = null
            state.failure = null
            state.uncertainMutation = null
            state.pendingRedirect = null
            state.busy = emptyBusyState()
            state.status = SESSION_STATUS.ANONYMOUS
            passwordChangeAwaitingContext = false
          }
          state.logoutBusy = false
          if (logoutFlight === promise) logoutFlight = null
        }
      }

      if (logoutOwner === owner && state.generation === closingGeneration) {
        const server = result.kind === ACCESS_ACTION_RESULT.SUCCESS
          ? SESSION_LOGOUT_SERVER_RESULT.CONFIRMED
          : result.kind === ACCESS_ACTION_RESULT.REJECTED
            ? SESSION_LOGOUT_SERVER_RESULT.REJECTED
            : result.kind === ACCESS_ACTION_RESULT.UNCERTAIN
              ? SESSION_LOGOUT_SERVER_RESULT.UNCERTAIN
              : SESSION_LOGOUT_SERVER_RESULT.NOT_ATTEMPTED
        state.logoutOutcome = { localPurged: true, server }
      }
      return result
    })()

    logoutFlight = promise
    return promise
  }

  const actions: SessionActions = {
    login,
    captureTenant,
    ensureContext,
    selectUnit,
    changeRequiredPassword,
    logout,
    purge,
    setPendingRedirect,
    consumePendingRedirect,
    discardPendingRedirect,
  }

  return { ...toRefs(state), ...actions }
})
