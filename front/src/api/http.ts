import type { AccessActionBlockReason, AccessOperationErrorKind } from '../types/auth'

const API_ROOT = '/api'
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const HTTP_REQUEST_ERROR_KIND = {
  HTTP: 'http',
  NETWORK: 'network',
} as const

type HttpRequestErrorKind =
  (typeof HTTP_REQUEST_ERROR_KIND)[keyof typeof HTTP_REQUEST_ERROR_KIND]

export interface HttpRequestOptions {
  method?: string
  body?: unknown
  tenantCode?: string
  unitCode?: string
  signal?: AbortSignal | null
  requireCsrf?: boolean
}

export class HttpRequestError extends Error {
  readonly kind: HttpRequestErrorKind
  readonly status: number | null
  readonly detail: string | null
  readonly retryAfter: string | null
  readonly payload: unknown
  readonly operationKind: AccessOperationErrorKind
  readonly blockReason: AccessActionBlockReason | null

  constructor(
    kind: HttpRequestErrorKind,
    status: number | null = null,
    detail: string | null = null,
    retryAfter: string | null = null,
    payload: unknown = undefined,
    operationKind: AccessOperationErrorKind = kind,
    blockReason: AccessActionBlockReason | null = null,
  ) {
    super(kind === HTTP_REQUEST_ERROR_KIND.HTTP
      ? 'La solicitud al servidor fue rechazada.'
      : 'No se pudo conectar con el servidor.')
    this.name = 'HttpRequestError'
    this.kind = kind
    this.status = status
    this.detail = detail
    this.retryAfter = retryAfter
    this.payload = payload
    this.operationKind = operationKind
    this.blockReason = blockReason
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isAbortError(value: unknown): boolean {
  return isRecord(value) && (value.name === 'AbortError' || value.name === 'TimeoutError')
}

function createAbortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const prefix = `${name}=`
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))

  if (!cookie) return null

  const value = cookie.slice(prefix.length)
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

async function responsePayload(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

function responseDetail(payload: unknown): string | null {
  return isRecord(payload) && typeof payload.detail === 'string' ? payload.detail : null
}

export async function request(
  path: string,
  options: HttpRequestOptions = {},
): Promise<Response> {
  if (options.signal?.aborted) throw createAbortError()

  const method = (options.method ?? 'GET').toUpperCase()
  const headers: Record<string, string> = { Accept: 'application/json' }
  const tenantCode = options.tenantCode?.trim()
  const unitCode = options.unitCode?.trim()

  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (tenantCode) headers['X-Tenant-Code'] = tenantCode
  if (unitCode) headers['X-Org-Unit-Code'] = unitCode

  if (!SAFE_METHODS.has(method)) {
    const csrfToken = readCookie('csrftoken')
    if (options.requireCsrf && !csrfToken) {
      throw new HttpRequestError(
        HTTP_REQUEST_ERROR_KIND.NETWORK,
        null,
        null,
        null,
        undefined,
        'configuration',
        'missing-csrf',
      )
    }
    if (csrfToken) headers['X-CSRFToken'] = csrfToken
  }

  const controller = new AbortController()
  const callerSignal = options.signal ?? undefined
  const forwardCallerAbort = () => controller.abort(callerSignal?.reason)
  callerSignal?.addEventListener('abort', forwardCallerAbort, { once: true })

  if (callerSignal?.aborted) {
    callerSignal.removeEventListener('abort', forwardCallerAbort)
    throw createAbortError()
  }

  let timedOut = false
  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort(new DOMException('The request timed out.', 'TimeoutError'))
  }, DEFAULT_REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    })
    // Consume a clone so the caller gets the original Response with its body readable.
    await response.clone().arrayBuffer()
    if (timedOut) throw new DOMException('The request timed out.', 'TimeoutError')
  } catch (error: unknown) {
    if (timedOut) {
      throw new HttpRequestError(
        HTTP_REQUEST_ERROR_KIND.NETWORK,
        null,
        null,
        null,
        undefined,
        'timeout',
      )
    }
    if (callerSignal?.aborted) throw createAbortError()
    if (isAbortError(error)) {
      throw error
    }
    throw new HttpRequestError(HTTP_REQUEST_ERROR_KIND.NETWORK)
  } finally {
    clearTimeout(timeoutId)
    callerSignal?.removeEventListener('abort', forwardCallerAbort)
  }

  if (!response.ok) {
    const payload = await responsePayload(response)
    throw new HttpRequestError(
      HTTP_REQUEST_ERROR_KIND.HTTP,
      response.status,
      responseDetail(payload),
      response.headers.get('Retry-After'),
      payload,
    )
  }

  return response
}
