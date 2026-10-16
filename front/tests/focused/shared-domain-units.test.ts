import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SharedDomainApiError,
  getAssignableUnits,
  getOrganizationUnitsLookup,
  normalizeOrganizationUnit,
  validateAssignableUnitsResponse,
  validateOrganizationUnitLookupResponse,
} from '../../src/api/shared/domain'
import type { ApiConnection } from '../../src/types/dashboard'

const CONNECTION: ApiConnection = { tenantCode: 'ejercito-demo', unitCode: '' }

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
    id: 27,
    tenant: 1,
    parent: null,
    code: 'CMD-1',
    name: 'Comando',
    unit_type: 'command',
    is_active: true,
  }
}

function rootWithNullParentCode(): Record<string, unknown> {
  return { ...rootWireRecord(), parent_code: null }
}

function childWireRecord(): Record<string, unknown> {
  return {
    id: 28,
    tenant: 1,
    parent: 27,
    parent_code: 'CMD-1',
    code: 'CMD-1-A',
    name: 'Compañía A',
    unit_type: 'company',
    is_active: true,
  }
}

beforeEach(() => {
  document.cookie = 'csrftoken=test-csrf-token; path=/'
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.cookie = 'csrftoken=; Max-Age=0; path=/'
})

describe('shared domain: raíz sin parent_code en lookup/assignable', () => {
  it('materializa parent_code null cuando la clave falta y parent es null', () => {
    const unit = normalizeOrganizationUnit(rootWireRecord())

    expect(unit).not.toBeNull()
    expect(unit?.parent).toBeNull()
    expect(unit?.parent_code).toBeNull()
    expect(Object.prototype.hasOwnProperty.call(unit, 'parent_code')).toBe(true)
  })

  it('acepta parent_code null presente en raíz', () => {
    const unit = normalizeOrganizationUnit(rootWithNullParentCode())
    expect(unit?.parent_code).toBeNull()
  })

  it('preserva parent_code string en unidad hija', () => {
    const unit = normalizeOrganizationUnit(childWireRecord())
    expect(unit?.parent).toBe(27)
    expect(unit?.parent_code).toBe('CMD-1')
  })

  it('normaliza la raíz en la respuesta lookup compartida', () => {
    const lookup = validateOrganizationUnitLookupResponse({ results: [rootWireRecord()] })

    expect(lookup.results).toHaveLength(1)
    expect(lookup.results[0]?.parent_code).toBeNull()
  })

  it('normaliza la raíz en la respuesta assignable compartida', () => {
    const assignable = validateAssignableUnitsResponse({ results: [rootWireRecord()] })

    expect(assignable.results[0]?.parent_code).toBeNull()
  })

  it('normaliza la raíz consumida por getOrganizationUnitsLookup y getAssignableUnits', async () => {
    stubFetch({ results: [rootWireRecord()] })
    const lookup = await getOrganizationUnitsLookup(CONNECTION)
    expect(lookup.results[0]?.parent_code).toBeNull()

    stubFetch({ results: [rootWireRecord()] })
    const assignable = await getAssignableUnits(CONNECTION)
    expect(assignable.results[0]?.parent_code).toBeNull()
  })

  it('rechaza parent_code ausente cuando parent no es null', () => {
    const orphan = { ...childWireRecord() }
    delete orphan.parent_code
    stubFetch({ results: [orphan] })

    expect(() => normalizeOrganizationUnit(orphan)).not.toThrow()
    expect(normalizeOrganizationUnit(orphan)).toBeNull()
    expect(() => validateOrganizationUnitLookupResponse({ results: [orphan] })).toThrow(
      SharedDomainApiError,
    )
  })

  it('rechaza parent_code de tipo inválido', () => {
    expect(normalizeOrganizationUnit({ ...childWireRecord(), parent_code: 5 })).toBeNull()
    expect(() => validateAssignableUnitsResponse({ results: [{ ...rootWireRecord(), parent_code: 5 }] }))
      .toThrow(SharedDomainApiError)
  })

  it('rechaza parent de tipo inválido', () => {
    expect(normalizeOrganizationUnit({ ...rootWireRecord(), parent: 'CMD-1' })).toBeNull()
    expect(() => validateOrganizationUnitLookupResponse({
      results: [{ ...rootWireRecord(), parent: 'CMD-1' }],
    })).toThrow(SharedDomainApiError)
  })

  it('rechaza un campo requerido ausente', () => {
    const missingName = { ...rootWireRecord() }
    delete missingName.name
    expect(normalizeOrganizationUnit(missingName)).toBeNull()
    expect(() => validateAssignableUnitsResponse({ results: [missingName] }))
      .toThrow(SharedDomainApiError)
  })

  it('no afloja las claves exactas ante una clave desconocida', () => {
    expect(normalizeOrganizationUnit({ ...rootWireRecord(), extra: 'x' })).toBeNull()
  })
})
