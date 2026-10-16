import { request } from '../http'
import type {
  AssignableUnitsResponse,
  OrganizationUnitDTO,
  OrganizationUnitLookupResponse,
  OrganizationUnitType,
  TemporaryPersonCreateRequest,
  TemporaryPersonCreateResponse,
  TemporaryPersonDTO,
} from '../../types/shared/domain'
import { ORGANIZATION_UNIT_TYPE } from '../../types/shared/domain'
import type { ApiConnection } from '../../types/dashboard'

const SHARED_DOMAIN_API_ERROR_KIND = {
  CONFIGURATION: 'configuration',
  INVALID_REQUEST: 'invalid-request',
  SCHEMA: 'schema',
} as const

export type SharedDomainApiErrorKind =
  (typeof SHARED_DOMAIN_API_ERROR_KIND)[keyof typeof SHARED_DOMAIN_API_ERROR_KIND]

const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
} as const

const ORGANIZATION_UNIT_FIELDS = [
  'id',
  'tenant',
  'parent',
  'parent_code',
  'code',
  'name',
  'unit_type',
  'is_active',
] as const

const ORGANIZATION_UNIT_LOOKUP_FIELDS = ['results'] as const

const TEMPORARY_PERSON_REQUEST_FIELDS = [
  'rut',
  'grado',
  'nombre',
  'apellido_paterno',
  'apellido_materno',
  'organization_unit_code',
] as const

const TEMPORARY_PERSON_FIELDS = [
  'id_usuario',
  'rut',
  'grado',
  'nombre',
  'apellido_paterno',
  'apellido_materno',
  'correo',
  'habilitado',
  'is_locked',
  'must_change_password',
  'password_changed_at',
  'primary_assignment',
  'assignments',
] as const

const TEMPORARY_PERSON_PRIMARY_ASSIGNMENT_FIELDS = [
  'unit_code',
  'role_code',
  'scope_code',
] as const

const TEMPORARY_PERSON_ASSIGNMENT_FIELDS = [
  'id',
  'role_code',
  'role_name',
  'unit_code',
  'scope_code',
  'is_primary',
] as const

export class SharedDomainApiError extends Error {
  readonly kind: SharedDomainApiErrorKind

  constructor(kind: SharedDomainApiErrorKind) {
    super(kind === SHARED_DOMAIN_API_ERROR_KIND.CONFIGURATION
      ? 'La conexión no tiene un tenant válido.'
      : kind === SHARED_DOMAIN_API_ERROR_KIND.INVALID_REQUEST
        ? 'La solicitud no coincide con el contrato de la API.'
        : 'La respuesta del servidor no coincide con el contrato de la API.')
    this.name = 'SharedDomainApiError'
    this.kind = kind
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  const allowed = new Set(allowedKeys)
  return Object.keys(value).every((key) => allowed.has(key))
}

function hasExactKeys(value: Record<string, unknown>, expectedKeys: readonly string[]): boolean {
  return Object.keys(value).length === expectedKeys.length
    && expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
}

function isSafeId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function isNullableSafeId(value: unknown): value is number | null {
  return value === null || isSafeId(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isOrganizationUnitType(value: unknown): value is OrganizationUnitType {
  return typeof value === 'string'
    && Object.values(ORGANIZATION_UNIT_TYPE).some((unitType) => unitType === value)
}

function requireShape(condition: unknown): asserts condition {
  if (!condition) {
    throw new SharedDomainApiError(SHARED_DOMAIN_API_ERROR_KIND.SCHEMA)
  }
}

function materializeOrganizationUnitParentCode(
  value: Record<string, unknown>,
): Record<string, unknown> {
  if (Object.prototype.hasOwnProperty.call(value, 'parent_code')) return value
  if (value.parent !== null) return value

  // El serializer del backend omite `parent_code` cuando la unidad es raíz
  // (`parent === null`). La ausencia es legítima sólo en ese caso: se
  // materializa `null` antes del chequeo exacto de claves. Una unidad hija sin
  // `parent_code` no se acepta ni se degrada a raíz; el tipo inválido tampoco.
  return { ...value, parent_code: null }
}

export function normalizeOrganizationUnit(value: unknown): OrganizationUnitDTO | null {
  if (!isRecord(value)) return null

  const normalized = materializeOrganizationUnitParentCode(value)

  if (!hasExactKeys(normalized, ORGANIZATION_UNIT_FIELDS)) return null

  const id = normalized.id
  const tenant = normalized.tenant
  const parent = normalized.parent
  const parentCode = normalized.parent_code
  const code = normalized.code
  const name = normalized.name
  const unitType = normalized.unit_type
  const isActive = normalized.is_active

  if (
    !isSafeId(id)
    || !isSafeId(tenant)
    || !isNullableSafeId(parent)
    || !isNullableString(parentCode)
    || typeof code !== 'string'
    || typeof name !== 'string'
    || !isOrganizationUnitType(unitType)
    || typeof isActive !== 'boolean'
  ) {
    return null
  }

  return {
    id,
    tenant,
    parent,
    parent_code: parentCode,
    code,
    name,
    unit_type: unitType,
    is_active: isActive,
  }
}

function requireRequestShape(condition: unknown): asserts condition {
  if (!condition) {
    throw new SharedDomainApiError(SHARED_DOMAIN_API_ERROR_KIND.INVALID_REQUEST)
  }
}

function validateOrganizationUnit(value: unknown): OrganizationUnitDTO {
  const unit = normalizeOrganizationUnit(value)
  requireShape(unit !== null)
  return unit
}

export function validateOrganizationUnitLookupResponse(
  value: unknown,
): OrganizationUnitLookupResponse {
  requireShape(isRecord(value) && hasExactKeys(value, ORGANIZATION_UNIT_LOOKUP_FIELDS))
  requireShape(Array.isArray(value.results))

  const results: OrganizationUnitDTO[] = value.results.map((item: unknown) =>
    validateOrganizationUnit(item))

  return { results }
}

export function validateAssignableUnitsResponse(value: unknown): AssignableUnitsResponse {
  return validateOrganizationUnitLookupResponse(value)
}

export function validateTemporaryPersonCreateRequest(
  value: unknown,
): TemporaryPersonCreateRequest {
  requireRequestShape(isRecord(value) && hasOnlyKeys(value, TEMPORARY_PERSON_REQUEST_FIELDS))

  const rut = value.rut
  const grado = value.grado
  const nombre = value.nombre
  const apellidoPaterno = value.apellido_paterno
  const apellidoMaterno = value.apellido_materno
  const organizationUnitCode = value.organization_unit_code

  requireRequestShape(typeof rut === 'string' && rut.trim().length > 0)
  requireRequestShape(grado === undefined || isNullableString(grado))
  requireRequestShape(nombre === undefined || isNullableString(nombre))
  requireRequestShape(apellidoPaterno === undefined || isNullableString(apellidoPaterno))
  requireRequestShape(apellidoMaterno === undefined || isNullableString(apellidoMaterno))
  requireRequestShape(
    organizationUnitCode === undefined || isNullableString(organizationUnitCode),
  )

  return {
    rut,
    ...(grado === undefined ? {} : { grado }),
    ...(nombre === undefined ? {} : { nombre }),
    ...(apellidoPaterno === undefined ? {} : { apellido_paterno: apellidoPaterno }),
    ...(apellidoMaterno === undefined ? {} : { apellido_materno: apellidoMaterno }),
    ...(organizationUnitCode === undefined
      ? {}
      : { organization_unit_code: organizationUnitCode }),
  }
}

function validateTemporaryPersonPrimaryAssignment(
  value: unknown,
): TemporaryPersonDTO['primary_assignment'] {
  if (value === null) return null

  requireShape(
    isRecord(value)
      && hasExactKeys(value, TEMPORARY_PERSON_PRIMARY_ASSIGNMENT_FIELDS),
  )

  const unitCode = value.unit_code
  const roleCode = value.role_code
  const scopeCode = value.scope_code

  requireShape(isNullableString(unitCode))
  requireShape(isNullableString(roleCode))
  requireShape(isNullableString(scopeCode))

  return {
    unit_code: unitCode,
    role_code: roleCode,
    scope_code: scopeCode,
  }
}

function validateTemporaryPersonAssignment(
  value: unknown,
): TemporaryPersonDTO['assignments'][number] {
  requireShape(
    isRecord(value)
      && hasExactKeys(value, TEMPORARY_PERSON_ASSIGNMENT_FIELDS),
  )

  const id = value.id
  const roleCode = value.role_code
  const roleName = value.role_name
  const unitCode = value.unit_code
  const scopeCode = value.scope_code
  const isPrimary = value.is_primary

  requireShape(isSafeId(id))
  requireShape(isNullableString(roleCode))
  requireShape(isNullableString(roleName))
  requireShape(isNullableString(unitCode))
  requireShape(isNullableString(scopeCode))
  requireShape(typeof isPrimary === 'boolean')

  return {
    id,
    role_code: roleCode,
    role_name: roleName,
    unit_code: unitCode,
    scope_code: scopeCode,
    is_primary: isPrimary,
  }
}

export function validateTemporaryPersonCreateResponse(
  value: unknown,
): TemporaryPersonCreateResponse {
  requireShape(isRecord(value) && hasExactKeys(value, TEMPORARY_PERSON_FIELDS))

  const id = value.id_usuario
  const rut = value.rut
  const grado = value.grado
  const nombre = value.nombre
  const apellidoPaterno = value.apellido_paterno
  const apellidoMaterno = value.apellido_materno
  const correo = value.correo
  const habilitado = value.habilitado
  const isLocked = value.is_locked
  const mustChangePassword = value.must_change_password
  const passwordChangedAt = value.password_changed_at
  const primaryAssignment = value.primary_assignment
  const assignments = value.assignments

  requireShape(isSafeId(id))
  requireShape(typeof rut === 'string')
  requireShape(isNullableString(grado))
  requireShape(typeof nombre === 'string')
  requireShape(typeof apellidoPaterno === 'string')
  requireShape(typeof apellidoMaterno === 'string')
  requireShape(isNullableString(correo))
  requireShape(typeof habilitado === 'boolean')
  requireShape(typeof isLocked === 'boolean')
  requireShape(typeof mustChangePassword === 'boolean')
  requireShape(isNullableString(passwordChangedAt))
  requireShape(Array.isArray(assignments))

  const validatedAssignments = assignments.map((item: unknown) =>
    validateTemporaryPersonAssignment(item))

  return {
    id_usuario: id,
    rut,
    grado,
    nombre,
    apellido_paterno: apellidoPaterno,
    apellido_materno: apellidoMaterno,
    correo,
    habilitado,
    is_locked: isLocked,
    must_change_password: mustChangePassword,
    password_changed_at: passwordChangedAt,
    primary_assignment: validateTemporaryPersonPrimaryAssignment(primaryAssignment),
    assignments: validatedAssignments,
  }
}

function requireTenantCode(connection: ApiConnection): string {
  const tenantCode = typeof connection.tenantCode === 'string'
    ? connection.tenantCode.trim()
    : ''

  if (!tenantCode) {
    throw new SharedDomainApiError(SHARED_DOMAIN_API_ERROR_KIND.CONFIGURATION)
  }

  return tenantCode
}

async function parseJsonResponse(response: Response, expectedStatus: number): Promise<unknown> {
  if (response.status !== expectedStatus) {
    throw new SharedDomainApiError(SHARED_DOMAIN_API_ERROR_KIND.SCHEMA)
  }

  try {
    const payload: unknown = await response.json()
    return payload
  } catch {
    throw new SharedDomainApiError(SHARED_DOMAIN_API_ERROR_KIND.SCHEMA)
  }
}

async function getJson(path: string, connection: ApiConnection): Promise<unknown> {
  const tenantCode = requireTenantCode(connection)
  const response = await request(path, {
    method: HTTP_METHOD.GET,
    tenantCode,
    unitCode: connection.unitCode,
    signal: connection.signal,
  })

  return parseJsonResponse(response, 200)
}

async function postJson(
  path: string,
  body: TemporaryPersonCreateRequest,
  connection: ApiConnection,
): Promise<unknown> {
  const tenantCode = requireTenantCode(connection)
  const response = await request(path, {
    method: HTTP_METHOD.POST,
    body,
    tenantCode,
    unitCode: connection.unitCode,
    signal: connection.signal,
    requireCsrf: true,
  })

  return parseJsonResponse(response, 201)
}

export async function getOrganizationUnitsLookup(
  connection: ApiConnection,
): Promise<OrganizationUnitLookupResponse> {
  return validateOrganizationUnitLookupResponse(
    await getJson('/organization-units/lookup/', connection),
  )
}

export async function getAssignableUnits(
  connection: ApiConnection,
): Promise<AssignableUnitsResponse> {
  return validateAssignableUnitsResponse(
    await getJson('/me/assignable-units/', connection),
  )
}

export async function createTemporaryPerson(
  input: TemporaryPersonCreateRequest,
  connection: ApiConnection,
): Promise<TemporaryPersonCreateResponse> {
  const body = validateTemporaryPersonCreateRequest(input)
  const payload = await postJson('/usuarios/crear-temporal/', body, connection)
  return validateTemporaryPersonCreateResponse(payload)
}
