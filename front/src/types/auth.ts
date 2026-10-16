/** Contratos wire y resultados de operaciones de acceso F2. */

export interface LoginRequest {
  rut: string
  password: string
}

export interface LoginResponse {
  id_usuario: number
  must_change_password: boolean
}

/** El payload de un error de login sigue siendo unknown: no hay envelope acreditado. */
export type LoginErrorPayload = unknown

export interface SelectUnitRequest {
  organization_unit_code: string
}

export interface SelectUnitResponse {
  detail: string
  organization_unit_code: string
  tenant_code: string
}

export interface DetailResponse {
  detail: string
}

export interface ChangeRequiredPasswordRequest {
  new_password: string
}

export type ChangeRequiredPasswordResponse = DetailResponse

export interface ChangeRequiredPasswordValidationResponse {
  error: string | string[]
}

export interface RecoveryIdentifyRequest {
  rut: string
}

export interface RecoveryIdentifyResponse extends DetailResponse {
  correo_censurado?: string
}

export type RecoveryCreateResponse = DetailResponse

export interface RecoveryCreateRequest {
  rut: string
  correo: string
}

export interface RecoveryCheckRequest {
  rut: string
  codigo: string
}

export interface RecoveryChangeRequest {
  rut: string
  codigo: string
  nueva_contrasena: string
}

export interface RecoveryMessageResponse {
  mensaje: string
}

export type RecoveryCheckResponse = RecoveryMessageResponse
export type RecoveryChangeResponse = RecoveryMessageResponse

export interface RecoveryValidationResponse extends RecoveryMessageResponse {
  errores: string[]
}

export type RecoveryResponse =
  | RecoveryIdentifyResponse
  | DetailResponse
  | RecoveryMessageResponse
  | RecoveryValidationResponse

export const RECOVERY_STEP = {
  IDENTIFY: 1,
  CREATE_CODE: 2,
  CHECK_CODE: 3,
  CHANGE_PASSWORD: 4,
} as const

export type RecoveryStep = (typeof RECOVERY_STEP)[keyof typeof RECOVERY_STEP]

export const ACCESS_OPERATION_ERROR_KIND = {
  HTTP: 'http',
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  ABORTED: 'aborted',
  INVALID_RESPONSE: 'invalid-response',
  CONFIGURATION: 'configuration',
  IDENTITY_MISMATCH: 'identity-mismatch',
} as const

export type AccessOperationErrorKind =
  (typeof ACCESS_OPERATION_ERROR_KIND)[keyof typeof ACCESS_OPERATION_ERROR_KIND]

/** Error interno de operación; payload conserva el JSON crudo sin tipar el envelope. */
export interface AccessOperationError {
  kind: AccessOperationErrorKind
  status: number | null
  payload: unknown
  detail: string | null
  retryAfter: string | null
}

export const ACCESS_ACTION_RESULT = {
  SUCCESS: 'success',
  REJECTED: 'rejected',
  UNCERTAIN: 'uncertain',
  BLOCKED: 'blocked',
} as const

export type AccessActionResultKind =
  (typeof ACCESS_ACTION_RESULT)[keyof typeof ACCESS_ACTION_RESULT]

export const ACCESS_ACTION_BLOCK_REASON = {
  BUSY: 'busy',
  MISSING_CSRF: 'missing-csrf',
  MISSING_TENANT: 'missing-tenant',
  IDENTITY_UNAVAILABLE: 'identity-unavailable',
  INVALID_STATE: 'invalid-state',
} as const

export type AccessActionBlockReason =
  (typeof ACCESS_ACTION_BLOCK_REASON)[keyof typeof ACCESS_ACTION_BLOCK_REASON]

export interface AccessActionSuccess<TResponse> {
  kind: typeof ACCESS_ACTION_RESULT.SUCCESS
  response: TResponse
}

export interface AccessActionRejected {
  kind: typeof ACCESS_ACTION_RESULT.REJECTED
  error: AccessOperationError
}

export interface AccessActionUncertain {
  kind: typeof ACCESS_ACTION_RESULT.UNCERTAIN
  error: AccessOperationError
}

export interface AccessActionBlocked {
  kind: typeof ACCESS_ACTION_RESULT.BLOCKED
  reason: AccessActionBlockReason
}

export type AccessActionResult<TResponse> =
  | AccessActionSuccess<TResponse>
  | AccessActionRejected
  | AccessActionUncertain
  | AccessActionBlocked
