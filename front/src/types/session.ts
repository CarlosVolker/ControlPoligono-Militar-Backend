import type { AuthContext } from './contexto'
import type {
  AccessActionResult,
  AccessOperationErrorKind,
  ChangeRequiredPasswordRequest,
  ChangeRequiredPasswordResponse,
  DetailResponse,
  LoginRequest,
  LoginResponse,
  SelectUnitRequest,
  SelectUnitResponse,
} from './auth'

/** READY describe sesión/contexto validado, no el estado de datos del dashboard. */
export const SESSION_STATUS = {
  NEEDS_TENANT: 'needs-tenant',
  BOOTING: 'booting',
  READY: 'ready',
  ANONYMOUS: 'anonymous',
  FAILURE: 'failure',
  CONTEXT_LOST: 'context-lost',
} as const

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS]

export const SESSION_IDENTITY_SOURCE = {
  LOGIN: 'login',
  CONTEXT: 'context',
} as const

export type SessionIdentitySource =
  (typeof SESSION_IDENTITY_SOURCE)[keyof typeof SESSION_IDENTITY_SOURCE]

export interface SessionIdentity {
  id_usuario: number
  must_change_password: boolean
  source: SessionIdentitySource
}

export const SESSION_OPERATION = {
  LOGIN: 'login',
  CONTEXT: 'context',
  SELECT_UNIT: 'select-unit',
  CHANGE_REQUIRED_PASSWORD: 'change-required-password',
  LOGOUT: 'logout',
} as const

export type SessionOperation = (typeof SESSION_OPERATION)[keyof typeof SESSION_OPERATION]

export interface SessionFailure {
  operation: SessionOperation
  kind: AccessOperationErrorKind
  status: number | null
  detail: string | null
  retryAfter: string | null
}

export interface SessionBusyState {
  login: boolean
  context: boolean
  selectUnit: boolean
  changeRequiredPassword: boolean
}

export const SESSION_MUTATION = {
  SELECT_UNIT: 'select-unit',
  CHANGE_REQUIRED_PASSWORD: 'change-required-password',
} as const

export type SessionMutation = (typeof SESSION_MUTATION)[keyof typeof SESSION_MUTATION]

export interface UncertainSessionMutation {
  operation: SessionMutation
  generation: number
}

export const SESSION_LOGOUT_SERVER_RESULT = {
  NOT_ATTEMPTED: 'not-attempted',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  UNCERTAIN: 'uncertain',
} as const

export type SessionLogoutServerResult =
  (typeof SESSION_LOGOUT_SERVER_RESULT)[keyof typeof SESSION_LOGOUT_SERVER_RESULT]

/** El estado local registra la purga por separado del resultado del servidor. */
export interface SessionLogoutOutcome {
  localPurged: true
  server: SessionLogoutServerResult
}

/** Destino ya validado por el guard y retenido solo para este intento. */
export interface PendingRedirect {
  destination: string
  attempt: number
}

export interface SessionState {
  status: SessionStatus
  context: AuthContext | null
  tenantCode: string
  unitCode: string
  identity: SessionIdentity | null
  busy: SessionBusyState
  logoutBusy: boolean
  logoutOutcome: SessionLogoutOutcome | null
  uncertainMutation: UncertainSessionMutation | null
  generation: number
  pendingRedirect: PendingRedirect | null
  failure: SessionFailure | null
}

/** Contrato para la fase de implementación; no declara ni implementa un store runtime. */
export interface SessionActions {
  /** Señal opcional del caller para cancelar este intento de login. */
  login(
    credentials: LoginRequest,
    tenantCode: string,
    signal?: AbortSignal,
  ): Promise<AccessActionResult<LoginResponse>>
  captureTenant(tenantCode: string): void
  ensureContext(): Promise<AccessActionResult<AuthContext>>
  selectUnit(request: SelectUnitRequest): Promise<AccessActionResult<SelectUnitResponse>>
  changeRequiredPassword(
    request: ChangeRequiredPasswordRequest,
  ): Promise<AccessActionResult<ChangeRequiredPasswordResponse>>
  logout(): Promise<AccessActionResult<DetailResponse>>
  purge(): void
  setPendingRedirect(destination: string, attempt: number): void
  consumePendingRedirect(attempt: number): string | null
  discardPendingRedirect(attempt: number): void
}

/** Forma pública esperada del futuro useSessionStore(). */
export interface SessionStoreContract extends SessionState, SessionActions {}
