import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DesignSystemAppearanceApiError,
  getDesignSystemAppearance,
  putDesignSystemAppearance,
  resetDesignSystemAppearance,
} from '../../src/api/appearance'
import {
  DEFAULT_DESIGN_SYSTEM_APPEARANCE,
  DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO,
  DESIGN_SYSTEM_ACCENT_OPTIONS,
  DESIGN_SYSTEM_AMBCOLOR_OPTIONS,
  DESIGN_SYSTEM_AMBIENT_OPTIONS,
  DESIGN_SYSTEM_APPEARANCE_OPTIONS,
  DESIGN_SYSTEM_BG_OPTIONS,
  DESIGN_SYSTEM_FONT_OPTIONS,
  DESIGN_SYSTEM_ICON_FAMILY_OPTIONS,
  DESIGN_SYSTEM_RADIUS_OPTIONS,
  DESIGN_SYSTEM_THEME_OPTIONS,
  fromDesignSystemAppearanceDto,
  isDesignSystemAccent,
  isDesignSystemAmbcolor,
  isDesignSystemAmbient,
  isDesignSystemAppearance,
  isDesignSystemAppearanceDto,
  isDesignSystemBg,
  isDesignSystemFont,
  isDesignSystemIconFamily,
  isDesignSystemRadius,
  isDesignSystemTheme,
  toDesignSystemAppearanceDto,
  type DesignSystemAppearanceOption,
} from '../../src/types/appearance'

const APPEARANCE_API_PATH = '/api/me/preferences/appearance/design-system/'
const TEST_CSRF_TOKEN = 'test-csrf-token'

const APPEARANCE_AXIS_CATALOGS = [
  { axis: 'theme', options: DESIGN_SYSTEM_THEME_OPTIONS, isValid: isDesignSystemTheme },
  { axis: 'accent', options: DESIGN_SYSTEM_ACCENT_OPTIONS, isValid: isDesignSystemAccent },
  { axis: 'bg', options: DESIGN_SYSTEM_BG_OPTIONS, isValid: isDesignSystemBg },
  { axis: 'font', options: DESIGN_SYSTEM_FONT_OPTIONS, isValid: isDesignSystemFont },
  { axis: 'radius', options: DESIGN_SYSTEM_RADIUS_OPTIONS, isValid: isDesignSystemRadius },
  { axis: 'iconfam', options: DESIGN_SYSTEM_ICON_FAMILY_OPTIONS, isValid: isDesignSystemIconFamily },
  { axis: 'ambient', options: DESIGN_SYSTEM_AMBIENT_OPTIONS, isValid: isDesignSystemAmbient },
  { axis: 'ambcolor', options: DESIGN_SYSTEM_AMBCOLOR_OPTIONS, isValid: isDesignSystemAmbcolor },
] as const

const INVALID_OPTION_VALUES: readonly unknown[] = [
  null,
  undefined,
  7,
  false,
  {},
  [],
  'not-a-canonical-option',
]

interface CapturedFetchCall {
  input: RequestInfo | URL
  init: RequestInit | undefined
}

function stubFetch(response: Response): CapturedFetchCall[] {
  const calls: CapturedFetchCall[] = []
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      calls.push({ input, init })
      return response
    },
  )

  vi.stubGlobal('fetch', fetchMock)
  return calls
}

function expectSingleFetch(
  calls: readonly CapturedFetchCall[],
  expectedMethod: 'GET' | 'PUT' | 'DELETE',
  expectedCsrfToken: string | null,
): CapturedFetchCall {
  expect(calls).toHaveLength(1)

  const call = calls[0]
  if (call === undefined) throw new Error('La solicitud fetch esperada no fue registrada.')

  expect(call.input).toBe(APPEARANCE_API_PATH)
  expect(call.init?.method).toBe(expectedMethod)

  const headers = new Headers(call.init?.headers)
  expect(headers.get('X-CSRFToken')).toBe(expectedCsrfToken)
  expect(headers.has('X-Tenant-Code')).toBe(false)
  expect(headers.has('X-Org-Unit-Code')).toBe(false)

  return call
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function defaultValue(options: readonly DesignSystemAppearanceOption<string>[]): string | undefined {
  return options.find((option) => option.isDefault === true)?.value
}

beforeEach(() => {
  document.cookie = `csrftoken=${TEST_CSRF_TOKEN}; path=/`
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.cookie = 'csrftoken=; Max-Age=0; path=/'
})

describe('contrato de tipos y catálogos de apariencia', () => {
  it('conserva los ocho catálogos canónicos completos', () => {
    expect(DESIGN_SYSTEM_APPEARANCE_OPTIONS.theme).toHaveLength(2)
    expect(DESIGN_SYSTEM_APPEARANCE_OPTIONS.accent).toHaveLength(27)
    expect(DESIGN_SYSTEM_APPEARANCE_OPTIONS.bg).toHaveLength(26)
    expect(DESIGN_SYSTEM_APPEARANCE_OPTIONS.font).toHaveLength(9)
    expect(DESIGN_SYSTEM_APPEARANCE_OPTIONS.radius).toHaveLength(3)
    expect(DESIGN_SYSTEM_APPEARANCE_OPTIONS.iconfam).toHaveLength(7)
    expect(DESIGN_SYSTEM_APPEARANCE_OPTIONS.ambient).toHaveLength(8)
    expect(DESIGN_SYSTEM_APPEARANCE_OPTIONS.ambcolor).toHaveLength(7)

    for (const { axis, options, isValid } of APPEARANCE_AXIS_CATALOGS) {
      expect(options.length).toBeGreaterThan(0)
      for (const option of options) {
        expect(isValid(option.value), `${axis}=${option.value}`).toBe(true)
      }
    }
  })

  it('acepta los defaults declarados por los catálogos y mapea el DTO de ocho campos', () => {
    expect(isDesignSystemAppearance(DEFAULT_DESIGN_SYSTEM_APPEARANCE)).toBe(true)
    expect(isDesignSystemAppearanceDto(DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO)).toBe(true)

    for (const { axis, options } of APPEARANCE_AXIS_CATALOGS) {
      const catalogDefault = defaultValue(options)
      expect(catalogDefault, `default del eje ${axis}`).toBeDefined()
      expect(DEFAULT_DESIGN_SYSTEM_APPEARANCE[axis]).toBe(catalogDefault)
    }

    expect(toDesignSystemAppearanceDto(DEFAULT_DESIGN_SYSTEM_APPEARANCE))
      .toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO)
    expect(fromDesignSystemAppearanceDto(DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO))
      .toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
  })

  it('rechaza valores de eje nulos, no string o fuera del catálogo', () => {
    for (const { axis, isValid } of APPEARANCE_AXIS_CATALOGS) {
      for (const value of INVALID_OPTION_VALUES) {
        expect(isValid(value), `${axis} debe rechazar ${String(value)}`).toBe(false)
      }
    }
  })

  it('requiere objetos completos, no nulos y con exactamente los campos wire', () => {
    const missingAppearanceField: Record<string, unknown> = {
      ...DEFAULT_DESIGN_SYSTEM_APPEARANCE,
    }
    delete missingAppearanceField.ambcolor

    const missingDtoField: Record<string, unknown> = {
      ...DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO,
    }
    delete missingDtoField.ds_ambcolor

    const invalidAppearanceValues: readonly unknown[] = [
      null,
      [],
      7,
      missingAppearanceField,
      { ...DEFAULT_DESIGN_SYSTEM_APPEARANCE, extra: 'test-only-invalid-field' },
      { ...DEFAULT_DESIGN_SYSTEM_APPEARANCE, theme: null },
      { ...DEFAULT_DESIGN_SYSTEM_APPEARANCE, accent: 7 },
      { ...DEFAULT_DESIGN_SYSTEM_APPEARANCE, bg: 'not-a-canonical-option' },
    ]
    const invalidDtoValues: readonly unknown[] = [
      null,
      [],
      7,
      missingDtoField,
      { ...DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO, extra: 'test-only-invalid-field' },
      { ...DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO, ds_theme: null },
      { ...DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO, ds_accent: 7 },
      { ...DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO, ds_bg: 'not-a-canonical-option' },
    ]

    for (const value of invalidAppearanceValues) {
      expect(isDesignSystemAppearance(value)).toBe(false)
    }
    for (const value of invalidDtoValues) {
      expect(isDesignSystemAppearanceDto(value)).toBe(false)
    }
  })
})

describe('transporte HTTP del contrato de apariencia', () => {
  it('GET valida el payload desconocido y traduce el DTO completo', async () => {
    const calls = stubFetch(jsonResponse(DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO))

    await expect(getDesignSystemAppearance()).resolves.toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE)

    expectSingleFetch(calls, 'GET', null)
  })

  it('GET rechaza respuestas incompletas o con valores fuera del contrato', async () => {
    const payload: unknown = {
      ...DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO,
      ds_accent: null,
    }
    const calls = stubFetch(jsonResponse(payload))

    await expect(getDesignSystemAppearance()).rejects.toMatchObject({
      name: 'DesignSystemAppearanceApiError',
      kind: 'schema',
      status: 200,
    })
    expectSingleFetch(calls, 'GET', null)
  })

  it('GET exige el estado contractual 200 aunque el payload sea válido', async () => {
    const calls = stubFetch(jsonResponse(DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO, 201))

    await expect(getDesignSystemAppearance()).rejects.toMatchObject({
      name: 'DesignSystemAppearanceApiError',
      kind: 'schema',
      status: 201,
    })
    expectSingleFetch(calls, 'GET', null)
  })

  it('PUT envía una instantánea wire exacta de ocho strings y valida la respuesta', async () => {
    const calls = stubFetch(jsonResponse(DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO))

    await expect(putDesignSystemAppearance(DEFAULT_DESIGN_SYSTEM_APPEARANCE))
      .resolves.toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE)

    const call = expectSingleFetch(calls, 'PUT', TEST_CSRF_TOKEN)
    const headers = new Headers(call.init?.headers)
    expect(headers.get('Content-Type')).toBe('application/json')

    const body = call.init?.body
    expect(typeof body).toBe('string')
    if (typeof body !== 'string') throw new Error('PUT no envió el DTO JSON esperado.')

    const payload: unknown = JSON.parse(body)
    expect(payload).toEqual(DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO)
    expect(isDesignSystemAppearanceDto(payload)).toBe(true)
    if (!isDesignSystemAppearanceDto(payload)) {
      throw new Error('PUT no serializó los ocho campos wire canónicos.')
    }
    expect(Object.keys(payload)).toHaveLength(8)
  })

  it('PUT rechaza una respuesta wire inválida en vez de normalizarla', async () => {
    const payload: unknown = {
      ...DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO,
      ds_font: 7,
    }
    const calls = stubFetch(jsonResponse(payload))

    await expect(putDesignSystemAppearance(DEFAULT_DESIGN_SYSTEM_APPEARANCE))
      .rejects.toMatchObject({
        name: 'DesignSystemAppearanceApiError',
        kind: 'schema',
        status: 200,
      })
    expectSingleFetch(calls, 'PUT', TEST_CSRF_TOKEN)
  })

  it('PUT exige el estado contractual 200 aunque el payload sea válido', async () => {
    const calls = stubFetch(jsonResponse(DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO, 201))

    await expect(putDesignSystemAppearance(DEFAULT_DESIGN_SYSTEM_APPEARANCE))
      .rejects.toMatchObject({
        name: 'DesignSystemAppearanceApiError',
        kind: 'schema',
        status: 201,
      })
    expectSingleFetch(calls, 'PUT', TEST_CSRF_TOKEN)
  })

  it('DELETE requiere 204 y no parsea el body vacío', async () => {
    const response = new Response(null, { status: 204 })
    const jsonSpy = vi.spyOn(response, 'json')
    const calls = stubFetch(response)

    await expect(resetDesignSystemAppearance()).resolves.toBeUndefined()

    expectSingleFetch(calls, 'DELETE', TEST_CSRF_TOKEN)
    expect(jsonSpy).not.toHaveBeenCalled()
  })

  it('DELETE rechaza cualquier estado distinto de 204 sin leer JSON', async () => {
    const response = new Response(null, { status: 200 })
    const jsonSpy = vi.spyOn(response, 'json')
    const calls = stubFetch(response)

    await expect(resetDesignSystemAppearance()).rejects.toBeInstanceOf(
      DesignSystemAppearanceApiError,
    )
    expectSingleFetch(calls, 'DELETE', TEST_CSRF_TOKEN)
    expect(jsonSpy).not.toHaveBeenCalled()
  })
})
