import { request } from './http'
import {
  fromDesignSystemAppearanceDto,
  isDesignSystemAppearance,
  isDesignSystemAppearanceDto,
  toDesignSystemAppearanceDto,
} from '../types/appearance'
import type {
  DesignSystemAppearance,
  DesignSystemAppearanceDto,
} from '../types/appearance'

const DESIGN_SYSTEM_APPEARANCE_PATH = '/me/preferences/appearance/design-system/'

const DESIGN_SYSTEM_APPEARANCE_API_ERROR_KIND = {
  SCHEMA: 'schema',
} as const

type DesignSystemAppearanceApiErrorKind =
  (typeof DESIGN_SYSTEM_APPEARANCE_API_ERROR_KIND)[keyof typeof DESIGN_SYSTEM_APPEARANCE_API_ERROR_KIND]

export class DesignSystemAppearanceApiError extends Error {
  readonly kind: DesignSystemAppearanceApiErrorKind
  readonly status: number
  readonly detail: string | null
  readonly retryAfter: string | null
  readonly payload: unknown

  constructor(response: Response, payload: unknown) {
    super('La respuesta del servidor no cumple el contrato de apariencia.')
    this.name = 'DesignSystemAppearanceApiError'
    this.kind = DESIGN_SYSTEM_APPEARANCE_API_ERROR_KIND.SCHEMA
    this.status = response.status
    this.detail = readDetail(payload)
    this.retryAfter = response.headers.get('Retry-After')
    this.payload = payload
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function readDetail(payload: unknown): string | null {
  return isRecord(payload) && typeof payload.detail === 'string' ? payload.detail : null
}

async function readDesignSystemAppearance(response: Response): Promise<DesignSystemAppearance> {
  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    throw new DesignSystemAppearanceApiError(response, undefined)
  }

  if (response.status !== 200 || !isDesignSystemAppearanceDto(payload)) {
    throw new DesignSystemAppearanceApiError(response, payload)
  }

  return fromDesignSystemAppearanceDto(payload)
}

export async function getDesignSystemAppearance(
  signal?: AbortSignal | null,
): Promise<DesignSystemAppearance> {
  const response = await request(DESIGN_SYSTEM_APPEARANCE_PATH, {
    method: 'GET',
    signal,
  })

  return readDesignSystemAppearance(response)
}

export async function putDesignSystemAppearance(
  appearance: DesignSystemAppearance,
  signal?: AbortSignal | null,
): Promise<DesignSystemAppearance> {
  if (!isDesignSystemAppearance(appearance)) {
    throw new TypeError('La apariencia debe contener exactamente los ocho ejes válidos.')
  }

  const snapshot: DesignSystemAppearanceDto = toDesignSystemAppearanceDto(appearance)
  if (!isDesignSystemAppearanceDto(snapshot)) {
    throw new TypeError('La apariencia serializada no cumple el contrato de ocho ejes.')
  }

  const response = await request(DESIGN_SYSTEM_APPEARANCE_PATH, {
    method: 'PUT',
    body: snapshot,
    requireCsrf: true,
    signal,
  })

  return readDesignSystemAppearance(response)
}

export async function resetDesignSystemAppearance(
  signal?: AbortSignal | null,
): Promise<void> {
  const response = await request(DESIGN_SYSTEM_APPEARANCE_PATH, {
    method: 'DELETE',
    requireCsrf: true,
    signal,
  })

  if (response.status !== 204) {
    throw new DesignSystemAppearanceApiError(response, undefined)
  }
}
