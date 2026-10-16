import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  OrganizationApiResponseError,
  createOrganizationUnit,
  getAssignableOrganizationUnits,
  getOrganizationUnit,
  getOrganizationUnits,
  lookupOrganizationUnits,
} from '../../src/features/organization/api'
import type { ApiConnection } from '../../src/types/dashboard'

const CONNECTION: ApiConnection = { tenantCode: 'ejercito-demo', unitCode: '' }
const TEST_CSRF_TOKEN = 'test-csrf-token'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stubFetch(payload: unknown, status = 200): void {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(payload, status)))
}

function rootWireRecord(): Record<string, unknown> {
  return {
    id: 7,
    tenant: 1,
    parent: null,
    code: 'CMD-1',
    name: 'Comando',
    unit_type: 'command',
    is_active: true,
  }
}

function childWireRecord(): Record<string, unknown> {
  return {
    id: 8,
    tenant: 1,
    parent: 7,
    parent_code: 'CMD-1',
    code: 'CMD-1-A',
    name: 'Compañía A',
    unit_type: 'company',
    is_active: true,
  }
}

beforeEach(() => {
  document.cookie = `csrftoken=${TEST_CSRF_TOKEN}; path=/`
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.cookie = 'csrftoken=; Max-Age=0; path=/'
})

describe('wire de organization-units con raíces sin parent_code', () => {
  it('normaliza la ausencia de parent_code en raíz a null explícito', async () => {
    stubFetch([rootWireRecord()])

    const units = await getOrganizationUnits(CONNECTION)
    const unit = units[0]

    expect(units).toHaveLength(1)
    expect(unit?.parent).toBeNull()
    expect(unit?.parent_code).toBeNull()
    expect(Object.prototype.hasOwnProperty.call(unit, 'parent_code')).toBe(true)
  })

  it('normaliza parent_code null presente en raíz', async () => {
    stubFetch([{ ...rootWireRecord(), parent_code: null }])

    const units = await getOrganizationUnits(CONNECTION)

    expect(units[0]?.parent_code).toBeNull()
  })

  it('preserva parent_code string en unidad hija', async () => {
    stubFetch([childWireRecord()])

    const units = await getOrganizationUnits(CONNECTION)

    expect(units[0]?.parent).toBe(7)
    expect(units[0]?.parent_code).toBe('CMD-1')
  })

  it('normaliza la raíz en el detalle GET', async () => {
    stubFetch(rootWireRecord())

    const unit = await getOrganizationUnit(7, CONNECTION)

    expect(unit.parent_code).toBeNull()
    expect(Object.prototype.hasOwnProperty.call(unit, 'parent_code')).toBe(true)
  })

  it('normaliza la raíz en la respuesta POST 201 de creación', async () => {
    stubFetch(rootWireRecord(), 201)

    const unit = await createOrganizationUnit({ code: 'CMD-1', name: 'Comando' }, CONNECTION)

    expect(unit.id).toBe(7)
    expect(unit.parent_code).toBeNull()
    expect(Object.prototype.hasOwnProperty.call(unit, 'parent_code')).toBe(true)
  })

  it('normaliza la raíz en lookup y en assignable', async () => {
    stubFetch({ results: [rootWireRecord()] })
    const lookup = await lookupOrganizationUnits(CONNECTION)
    expect(lookup.results[0]?.parent_code).toBeNull()

    stubFetch({ results: [rootWireRecord()] })
    const assignable = await getAssignableOrganizationUnits(CONNECTION)
    expect(assignable.results[0]?.parent_code).toBeNull()
  })

  it('rechaza parent_code ausente cuando parent no es null', async () => {
    const orphan = { ...childWireRecord() }
    delete orphan.parent_code
    stubFetch([orphan])

    await expect(getOrganizationUnits(CONNECTION)).rejects.toBeInstanceOf(
      OrganizationApiResponseError,
    )
  })

  it('rechaza parent_code de tipo inválido', async () => {
    stubFetch([{ ...childWireRecord(), parent_code: 5 }])

    await expect(getOrganizationUnits(CONNECTION)).rejects.toBeInstanceOf(
      OrganizationApiResponseError,
    )
  })

  it('rechaza parent de tipo inválido', async () => {
    stubFetch([{ ...rootWireRecord(), parent: 'CMD-1' }])

    await expect(getOrganizationUnits(CONNECTION)).rejects.toBeInstanceOf(
      OrganizationApiResponseError,
    )
  })

  it('rechaza un campo requerido ausente', async () => {
    const missingName = { ...rootWireRecord() }
    delete missingName.name
    stubFetch([missingName])

    await expect(getOrganizationUnits(CONNECTION)).rejects.toBeInstanceOf(
      OrganizationApiResponseError,
    )
  })

  it('no convierte una entrada inválida en raíz válida', async () => {
    const invalid = { ...rootWireRecord() }
    delete invalid.unit_type
    stubFetch([rootWireRecord(), invalid])

    await expect(getOrganizationUnits(CONNECTION)).rejects.toBeInstanceOf(
      OrganizationApiResponseError,
    )
  })
})
