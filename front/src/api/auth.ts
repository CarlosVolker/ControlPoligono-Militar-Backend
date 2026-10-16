import { HttpRequestError, request as httpRequest } from './http'
import type { ApiConnection } from '../types/dashboard'
import {
  ACCESS_ACTION_BLOCK_REASON,
  ACCESS_ACTION_RESULT,
  ACCESS_OPERATION_ERROR_KIND,
} from '../types/auth'
import type {
  AccessActionBlocked,
  AccessActionBlockReason,
  AccessActionRejected,
  AccessActionResult,
  AccessOperationError,
  AccessOperationErrorKind,
  ChangeRequiredPasswordRequest,
  ChangeRequiredPasswordResponse,
  DetailResponse,
  LoginRequest,
  LoginResponse,
  RecoveryChangeRequest,
  RecoveryChangeResponse,
  RecoveryCheckRequest,
  RecoveryCheckResponse,
  RecoveryCreateRequest,
  RecoveryCreateResponse,
  RecoveryIdentifyRequest,
  RecoveryIdentifyResponse,
  SelectUnitRequest,
  SelectUnitResponse,
} from '../types/auth'

export { getAuthContext, validateAuthContext } from './dashboard'

const UNCERTAIN_ERROR_KINDS = new Set<AccessOperationErrorKind>([
  ACCESS_OPERATION_ERROR_KIND.NETWORK,
  ACCESS_OPERATION_ERROR_KIND.TIMEOUT,
  ACCESS_OPERATION_ERROR_KIND.ABORTED,
  ACCESS_OPERATION_ERROR_KIND.INVALID_RESPONSE,
])

const PRIVATE_ERROR_KEYS = new Set([
  'password',
  'newpassword',
  'nuevacontrasena',
  'contrasena',
  'codigo',
  'token',
  'secret',
  'rut',
  'correo',
  'email',
  'credentials',
])

interface AuthRequestOptions {
  method: string
  body?: unknown
  tenantCode?: string
  requireCsrf?: boolean
  signal?: AbortSignal
}

class InvalidAccessResponseError extends Error {
  readonly status: number | null
  readonly payload: unknown

  constructor(status: number | null, payload: unknown) {
    super('La respuesta del servidor no cumple el contrato esperado.')
    this.name = 'InvalidAccessResponseError'
    this.status = status
    this.payload = payload
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isAbortError(value: unknown): boolean {
  return isRecord(value) && value.name === 'AbortError'
}

function hasValidId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Invalid wire response')
  return value
}

function requireString(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid wire response')
  return value
}

function validateLoginResponse(value: unknown): LoginResponse {
  const record = requireRecord(value)
  const userId = record.id_usuario
  const mustChangePassword = record.must_change_password
  if (!hasValidId(userId) || typeof mustChangePassword !== 'boolean') {
    throw new Error('Invalid wire response')
  }
  return { id_usuario: userId, must_change_password: mustChangePassword }
}

function validateSelectUnitResponse(value: unknown): SelectUnitResponse {
  const record = requireRecord(value)
  return {
    detail: requireString(record.detail),
    organization_unit_code: requireString(record.organization_unit_code),
    tenant_code: requireString(record.tenant_code),
  }
}

function validateDetailResponse(value: unknown): DetailResponse {
  const record = requireRecord(value)
  return { detail: requireString(record.detail) }
}

function validateRecoveryIdentifyResponse(value: unknown): RecoveryIdentifyResponse {
  const record = requireRecord(value)
  const detail = requireString(record.detail)
  if ('correo_censurado' in record) {
    return { detail, correo_censurado: requireString(record.correo_censurado) }
  }
  return { detail }
}

function validateRecoveryMessageResponse(value: unknown): { mensaje: string } {
  const record = requireRecord(value)
  return { mensaje: requireString(record.mensaje) }
}

async function readValidatedResponse<T>(
  response: Response,
  validate: (payload: unknown) => T,
): Promise<T> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new InvalidAccessResponseError(response.status, undefined)
  }

  if (response.status !== 200) {
    throw new InvalidAccessResponseError(response.status, payload)
  }

  try {
    return validate(payload)
  } catch {
    throw new InvalidAccessResponseError(response.status, payload)
  }
}

function toAccessOperationError(error: unknown): AccessOperationError {
  if (error instanceof HttpRequestError) {
    return {
      kind: error.operationKind,
      status: error.status,
      payload: error.payload,
      detail: error.detail,
      retryAfter: error.retryAfter,
    }
  }

  if (error instanceof InvalidAccessResponseError) {
    return {
      kind: ACCESS_OPERATION_ERROR_KIND.INVALID_RESPONSE,
      status: error.status,
      payload: error.payload,
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

function blocked(reason: AccessActionBlockReason): AccessActionBlocked {
  return { kind: ACCESS_ACTION_RESULT.BLOCKED, reason }
}

function rejected(error: AccessOperationError): AccessActionRejected {
  return { kind: ACCESS_ACTION_RESULT.REJECTED, error }
}

function configurationFailure(): AccessActionRejected {
  return rejected({
    kind: ACCESS_OPERATION_ERROR_KIND.CONFIGURATION,
    status: null,
    payload: undefined,
    detail: null,
    retryAfter: null,
  })
}

async function perform<T>(
  path: string,
  options: AuthRequestOptions,
  validate: (payload: unknown) => T,
  uncertainOnFailure: boolean,
): Promise<AccessActionResult<T>> {
  try {
    const response = await httpRequest(path, options)
    return {
      kind: ACCESS_ACTION_RESULT.SUCCESS,
      response: await readValidatedResponse(response, validate),
    }
  } catch (error: unknown) {
    if (error instanceof HttpRequestError && error.blockReason !== null) {
      return blocked(error.blockReason)
    }

    const accessError = toAccessOperationError(error)
    if (uncertainOnFailure && UNCERTAIN_ERROR_KINDS.has(accessError.kind)) {
      return { kind: ACCESS_ACTION_RESULT.UNCERTAIN, error: accessError }
    }
    return rejected(accessError)
  }
}

function tenantCodeFrom(connection: Pick<ApiConnection, 'tenantCode'>): string {
  return typeof connection.tenantCode === 'string' ? connection.tenantCode.trim() : ''
}

export function login(
  request: LoginRequest,
  signal?: AbortSignal,
): Promise<AccessActionResult<LoginResponse>> {
  return perform(
    '/auth/login/',
    { method: 'POST', body: request, signal },
    validateLoginResponse,
    true,
  )
}

export async function selectUnit(
  request: SelectUnitRequest,
  connection: Pick<ApiConnection, 'tenantCode'>,
  signal?: AbortSignal,
): Promise<AccessActionResult<SelectUnitResponse>> {
  const tenantCode = tenantCodeFrom(connection)
  if (!tenantCode) return blocked(ACCESS_ACTION_BLOCK_REASON.MISSING_TENANT)

  return perform(
    '/auth/select-unit/',
    { method: 'POST', body: request, tenantCode, requireCsrf: true, signal },
    validateSelectUnitResponse,
    true,
  )
}

export async function changeRequiredPassword(
  userId: number,
  request: ChangeRequiredPasswordRequest,
  connection: Pick<ApiConnection, 'tenantCode'>,
  signal?: AbortSignal,
): Promise<AccessActionResult<ChangeRequiredPasswordResponse>> {
  const tenantCode = tenantCodeFrom(connection)
  if (!tenantCode) return blocked(ACCESS_ACTION_BLOCK_REASON.MISSING_TENANT)
  if (!hasValidId(userId)) return configurationFailure()

  return perform(
    `/usuarios/${userId}/cambiar-contrasena/`,
    { method: 'POST', body: request, tenantCode, requireCsrf: true, signal },
    validateDetailResponse,
    true,
  )
}

export function logout(signal?: AbortSignal): Promise<AccessActionResult<DetailResponse>> {
  return perform(
    '/logout/',
    { method: 'POST', requireCsrf: true, signal },
    validateDetailResponse,
    true,
  )
}

export function recoveryIdentify(
  request: RecoveryIdentifyRequest,
  signal?: AbortSignal,
): Promise<AccessActionResult<RecoveryIdentifyResponse>> {
  return perform(
    '/recuperar/',
    { method: 'POST', body: request, signal },
    validateRecoveryIdentifyResponse,
    false,
  )
}

export function recoveryCreateCode(
  request: RecoveryCreateRequest,
  signal?: AbortSignal,
): Promise<AccessActionResult<RecoveryCreateResponse>> {
  return perform(
    '/recuperar/crear/',
    { method: 'POST', body: request, signal },
    validateDetailResponse,
    true,
  )
}

export function recoveryCheckCode(
  request: RecoveryCheckRequest,
  signal?: AbortSignal,
): Promise<AccessActionResult<RecoveryCheckResponse>> {
  return perform(
    '/recuperar/comprobar/',
    { method: 'POST', body: request, signal },
    validateRecoveryMessageResponse,
    false,
  )
}

export function recoveryChangePassword(
  request: RecoveryChangeRequest,
  signal?: AbortSignal,
): Promise<AccessActionResult<RecoveryChangeResponse>> {
  return perform(
    '/recuperar/cambiar/',
    { method: 'POST', body: request, signal },
    validateRecoveryMessageResponse,
    true,
  )
}

export function getAccessErrorMessages(error: AccessOperationError): string[] {
  const messages = new Set<string>()

  function collect(value: unknown, parentKey = ''): void {
    if (PRIVATE_ERROR_KEYS.has(parentKey.toLowerCase().replace(/_/g, ''))) return
    if (typeof value === 'string') {
      if (value.trim()) messages.add(value)
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) collect(item)
      return
    }
    if (isRecord(value)) {
      for (const [key, item] of Object.entries(value)) collect(item, key)
    }
  }

  collect(error.payload)
  return [...messages]
}
