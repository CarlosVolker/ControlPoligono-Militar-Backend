import { request } from '../../api/http'
import type { ApiConnection } from '../../types/dashboard'
import type { OrganizationUnitDTO } from '../../types/shared/domain'
import { normalizeOrganizationUnit } from '../../api/shared/domain'

const ORGANIZATION_API_PATH = {
  UNITS: '/organization-units/',
  UNIT_LOOKUP: '/organization-units/lookup/',
  ASSIGNABLE_UNITS: '/me/assignable-units/',
  PRECINCTS: '/recintos/',
} as const

const REQUEST_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const

const ORGANIZATION_API_ERROR_KIND = {
  SCHEMA: 'schema',
} as const

const MIGRATION_COUNT_FIELDS = [
  'assignments',
  'weapons',
  'ranges',
  'lessons',
  'fractions',
  'results',
  'child_units',
  'lessons_as_participant',
] as const

type RequestMethod = (typeof REQUEST_METHOD)[keyof typeof REQUEST_METHOD]
type OrganizationUnitWriteType = OrganizationUnitDTO['unit_type']

export type OrganizationUnitRecord = Readonly<OrganizationUnitDTO>

export interface CreateOrganizationUnitBody {
  readonly code: string
  readonly name: string
  readonly parent?: number | null
  readonly unit_type?: OrganizationUnitWriteType
  readonly is_active?: boolean
}

export interface ReplaceOrganizationUnitBody {
  readonly code: string
  readonly name: string
  readonly parent: number | null
  readonly unit_type: OrganizationUnitWriteType
  readonly is_active: boolean
}

export type PatchOrganizationUnitBody = Partial<CreateOrganizationUnitBody>

export interface OrganizationUnitMigrationCountsDTO {
  readonly assignments: number
  readonly weapons: number
  readonly ranges: number
  readonly lessons: number
  readonly fractions: number
  readonly results: number
  readonly child_units: number
  readonly lessons_as_participant: number
}

export interface OrganizationUnitDeletionPreviewDTO {
  readonly unit_code: string
  readonly unit_name: string
  readonly parent_code: string | null
  readonly counts: OrganizationUnitMigrationCountsDTO
}

export interface DeleteOrganizationUnitWithMigrationBody {
  readonly target_unit_code?: string
}

export interface DeleteOrganizationUnitWithMigrationResponseDTO {
  readonly detail: string
  readonly target_unit_code: string
  readonly moved: OrganizationUnitMigrationCountsDTO
}

export interface OrganizationUnitLookupResponseDTO {
  readonly results: readonly OrganizationUnitRecord[]
}

export type AssignableOrganizationUnitsResponseDTO = OrganizationUnitLookupResponseDTO

export interface RecintoDTO {
  readonly id: number
  readonly tenant: number
  readonly code: string
  readonly name: string
  readonly description: string
  readonly is_active: boolean
  readonly units: readonly number[]
  readonly unit_codes: readonly string[]
  readonly unit_count: number
}

export interface CreateRecintoBody {
  readonly code: string
  readonly name: string
  readonly description?: string
  readonly is_active?: boolean
  readonly units?: readonly number[]
}

export type ReplaceRecintoBody = CreateRecintoBody
export type PatchRecintoBody = Partial<CreateRecintoBody>

export interface RecintoUnitRelationResponseDTO {
  readonly detail: string
  readonly unit_count: number
}

export interface AddUnitToRecintoResponseDTO {
  readonly detail: string
  readonly unit_count?: number
}

export class OrganizationApiResponseError extends Error {
  readonly kind = ORGANIZATION_API_ERROR_KIND.SCHEMA
  readonly status: number
  readonly detail: string | null
  readonly payload: unknown
  readonly retryAfter: string | null

  constructor(
    status: number,
    detail: string | null,
    payload: unknown,
    retryAfter: string | null,
  ) {
    super('La respuesta de organización no coincide con el contrato del servidor.')
    this.name = 'OrganizationApiResponseError'
    this.status = status
    this.detail = detail
    this.payload = payload
    this.retryAfter = retryAfter
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every((field) => Object.prototype.hasOwnProperty.call(value, field))
}

function isSafeId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === 'string')
}

function isPositiveIdArray(value: unknown): value is readonly number[] {
  return Array.isArray(value) && value.every((item: unknown) => isSafeId(item))
}

function normalizeOrganizationUnitArray(value: unknown): OrganizationUnitDTO[] | null {
  if (!Array.isArray(value)) return null
  const units: OrganizationUnitDTO[] = []
  for (const item of value) {
    const unit = normalizeOrganizationUnit(item)
    if (unit === null) return null
    units.push(unit)
  }
  return units
}

function isMigrationCounts(value: unknown): value is OrganizationUnitMigrationCountsDTO {
  return isRecord(value)
    && hasFields(value, MIGRATION_COUNT_FIELDS)
    && MIGRATION_COUNT_FIELDS.every((field) => isCount(value[field]))
}

function isUnitDeletionPreview(value: unknown): value is OrganizationUnitDeletionPreviewDTO {
  return isRecord(value)
    && hasFields(value, ['unit_code', 'unit_name', 'parent_code', 'counts'])
    && typeof value.unit_code === 'string'
    && typeof value.unit_name === 'string'
    && isNullableString(value.parent_code)
    && isMigrationCounts(value.counts)
}

function isUnitMigrationResponse(
  value: unknown,
): value is DeleteOrganizationUnitWithMigrationResponseDTO {
  return isRecord(value)
    && hasFields(value, ['detail', 'target_unit_code', 'moved'])
    && typeof value.detail === 'string'
    && typeof value.target_unit_code === 'string'
    && isMigrationCounts(value.moved)
}

function normalizeOrganizationUnitLookupResponse(
  value: unknown,
): OrganizationUnitLookupResponseDTO | null {
  if (!isRecord(value) || !hasFields(value, ['results'])) return null
  const results = normalizeOrganizationUnitArray(value.results)
  if (results === null) return null
  return { results }
}

function isRecinto(value: unknown): value is RecintoDTO {
  return isRecord(value)
    && hasFields(value, [
      'id', 'tenant', 'code', 'name', 'description', 'is_active', 'units', 'unit_codes', 'unit_count',
    ])
    && isSafeId(value.id)
    && isSafeId(value.tenant)
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && typeof value.is_active === 'boolean'
    && isPositiveIdArray(value.units)
    && isStringArray(value.unit_codes)
    && isCount(value.unit_count)
}

function isRecintoArray(value: unknown): value is RecintoDTO[] {
  return Array.isArray(value) && value.every((item: unknown) => isRecinto(item))
}

function isRecintoUnitRelationResponse(
  value: unknown,
): value is RecintoUnitRelationResponseDTO {
  return isRecord(value)
    && hasFields(value, ['detail', 'unit_count'])
    && typeof value.detail === 'string'
    && isCount(value.unit_count)
}

function isAddUnitToRecintoResponse(value: unknown): value is AddUnitToRecintoResponseDTO {
  return isRecord(value)
    && hasFields(value, ['detail'])
    && typeof value.detail === 'string'
    && (!Object.prototype.hasOwnProperty.call(value, 'unit_count') || isCount(value.unit_count))
}

function requireId(id: number): string {
  if (!isSafeId(id)) throw new TypeError('El identificador debe ser un entero positivo.')
  return String(id)
}

function requirePathCode(code: string): string {
  if (!code.trim()) throw new TypeError('El código de unidad no puede estar vacío.')
  return encodeURIComponent(code)
}

function requireTenant(connection: ApiConnection): string {
  const tenantCode = connection.tenantCode.trim()
  if (!tenantCode) throw new TypeError('La solicitud requiere un tenant activo.')
  return tenantCode
}

function responseDetail(payload: unknown): string | null {
  return isRecord(payload) && typeof payload.detail === 'string' ? payload.detail : null
}

function responseError(response: Response, payload: unknown): OrganizationApiResponseError {
  return new OrganizationApiResponseError(
    response.status,
    responseDetail(payload),
    payload,
    response.headers.get('Retry-After'),
  )
}

async function readUnknownPayload(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

async function requestForOrganization(
  path: string,
  method: RequestMethod,
  connection: ApiConnection,
  body?: object,
): Promise<Response> {
  return request(path, {
    method,
    tenantCode: requireTenant(connection),
    unitCode: connection.unitCode,
    signal: connection.signal,
    ...(body === undefined ? {} : { body }),
    ...(method === REQUEST_METHOD.GET ? {} : { requireCsrf: true }),
  })
}

async function requestJson<T>(
  path: string,
  method: RequestMethod,
  connection: ApiConnection,
  expectedStatus: number,
  validate: (payload: unknown) => T,
  body?: object,
): Promise<T> {
  const response = await requestForOrganization(path, method, connection, body)
  const payload = await readUnknownPayload(response)

  if (payload === undefined) throw responseError(response, payload)
  if (response.status !== expectedStatus) throw responseError(response, payload)

  try {
    return validate(payload)
  } catch {
    throw responseError(response, payload)
  }
}

async function request204(path: string, connection: ApiConnection): Promise<void> {
  const response = await requestForOrganization(path, REQUEST_METHOD.DELETE, connection)
  if (response.status !== 204) {
    throw responseError(response, await readUnknownPayload(response))
  }
}

function organizationUnitWriteBody(
  body: CreateOrganizationUnitBody | ReplaceOrganizationUnitBody | PatchOrganizationUnitBody,
): Record<string, unknown> {
  const selected: Record<string, unknown> = {}
  if (body.code !== undefined) selected.code = body.code
  if (body.name !== undefined) selected.name = body.name
  if (body.parent !== undefined) selected.parent = body.parent
  if (body.unit_type !== undefined) selected.unit_type = body.unit_type
  if (body.is_active !== undefined) selected.is_active = body.is_active
  return selected
}

function recintoWriteBody(
  body: CreateRecintoBody | ReplaceRecintoBody | PatchRecintoBody,
): Record<string, unknown> {
  const selected: Record<string, unknown> = {}
  if (body.code !== undefined) selected.code = body.code
  if (body.name !== undefined) selected.name = body.name
  if (body.description !== undefined) selected.description = body.description
  if (body.is_active !== undefined) selected.is_active = body.is_active
  if (body.units !== undefined) selected.units = body.units
  return selected
}

function migrationWriteBody(body: DeleteOrganizationUnitWithMigrationBody): Record<string, unknown> {
  if (body.target_unit_code === undefined) return {}
  if (!body.target_unit_code.trim()) {
    throw new TypeError('El código de unidad destino no puede estar vacío.')
  }
  return { target_unit_code: body.target_unit_code }
}

export function getOrganizationUnits(
  connection: ApiConnection,
): Promise<readonly OrganizationUnitRecord[]> {
  return requestJson(
    ORGANIZATION_API_PATH.UNITS,
    REQUEST_METHOD.GET,
    connection,
    200,
    (payload) => {
      const units = normalizeOrganizationUnitArray(payload)
      if (units === null) throw new Error('Respuesta fuera del contrato.')
      return units
    },
  )
}

export function getOrganizationUnit(
  id: number,
  connection: ApiConnection,
): Promise<OrganizationUnitRecord> {
  return requestJson(
    `${ORGANIZATION_API_PATH.UNITS}${requireId(id)}/`,
    REQUEST_METHOD.GET,
    connection,
    200,
    (payload) => {
      const unit = normalizeOrganizationUnit(payload)
      if (unit === null) throw new Error('Respuesta fuera del contrato.')
      return unit
    },
  )
}

export function createOrganizationUnit(
  body: CreateOrganizationUnitBody,
  connection: ApiConnection,
): Promise<OrganizationUnitRecord> {
  return requestJson(
    ORGANIZATION_API_PATH.UNITS,
    REQUEST_METHOD.POST,
    connection,
    201,
    (payload) => {
      const unit = normalizeOrganizationUnit(payload)
      if (unit === null) throw new Error('Respuesta fuera del contrato.')
      return unit
    },
    organizationUnitWriteBody(body),
  )
}

export function replaceOrganizationUnit(
  id: number,
  body: ReplaceOrganizationUnitBody,
  connection: ApiConnection,
): Promise<OrganizationUnitRecord> {
  return requestJson(
    `${ORGANIZATION_API_PATH.UNITS}${requireId(id)}/`,
    REQUEST_METHOD.PUT,
    connection,
    200,
    (payload) => {
      const unit = normalizeOrganizationUnit(payload)
      if (unit === null) throw new Error('Respuesta fuera del contrato.')
      return unit
    },
    organizationUnitWriteBody(body),
  )
}

export function patchOrganizationUnit(
  id: number,
  body: PatchOrganizationUnitBody,
  connection: ApiConnection,
): Promise<OrganizationUnitRecord> {
  return requestJson(
    `${ORGANIZATION_API_PATH.UNITS}${requireId(id)}/`,
    REQUEST_METHOD.PATCH,
    connection,
    200,
    (payload) => {
      const unit = normalizeOrganizationUnit(payload)
      if (unit === null) throw new Error('Respuesta fuera del contrato.')
      return unit
    },
    organizationUnitWriteBody(body),
  )
}

export function deleteOrganizationUnit(id: number, connection: ApiConnection): Promise<void> {
  return request204(`${ORGANIZATION_API_PATH.UNITS}${requireId(id)}/`, connection)
}

export function previewOrganizationUnitDeletion(
  id: number,
  connection: ApiConnection,
): Promise<OrganizationUnitDeletionPreviewDTO> {
  return requestJson(
    `${ORGANIZATION_API_PATH.UNITS}${requireId(id)}/previsualizar-eliminacion/`,
    REQUEST_METHOD.GET,
    connection,
    200,
    (payload) => {
      if (!isUnitDeletionPreview(payload)) throw new Error('Respuesta fuera del contrato.')
      return payload
    },
  )
}

export function deleteOrganizationUnitWithMigration(
  id: number,
  body: DeleteOrganizationUnitWithMigrationBody,
  connection: ApiConnection,
): Promise<DeleteOrganizationUnitWithMigrationResponseDTO> {
  return requestJson(
    `${ORGANIZATION_API_PATH.UNITS}${requireId(id)}/eliminar-con-migracion/`,
    REQUEST_METHOD.POST,
    connection,
    200,
    (payload) => {
      if (!isUnitMigrationResponse(payload)) throw new Error('Respuesta fuera del contrato.')
      return payload
    },
    migrationWriteBody(body),
  )
}

export function lookupOrganizationUnits(
  connection: ApiConnection,
): Promise<OrganizationUnitLookupResponseDTO> {
  return requestJson(
    ORGANIZATION_API_PATH.UNIT_LOOKUP,
    REQUEST_METHOD.GET,
    connection,
    200,
    (payload) => {
      const lookup = normalizeOrganizationUnitLookupResponse(payload)
      if (lookup === null) throw new Error('Respuesta fuera del contrato.')
      return lookup
    },
  )
}

export function getAssignableOrganizationUnits(
  connection: ApiConnection,
): Promise<AssignableOrganizationUnitsResponseDTO> {
  return requestJson(
    ORGANIZATION_API_PATH.ASSIGNABLE_UNITS,
    REQUEST_METHOD.GET,
    connection,
    200,
    (payload) => {
      const lookup = normalizeOrganizationUnitLookupResponse(payload)
      if (lookup === null) throw new Error('Respuesta fuera del contrato.')
      return lookup
    },
  )
}

export function getRecintos(connection: ApiConnection): Promise<readonly RecintoDTO[]> {
  return requestJson(
    ORGANIZATION_API_PATH.PRECINCTS,
    REQUEST_METHOD.GET,
    connection,
    200,
    (payload) => {
      if (!isRecintoArray(payload)) throw new Error('Respuesta fuera del contrato.')
      return payload
    },
  )
}

export function getRecinto(id: number, connection: ApiConnection): Promise<RecintoDTO> {
  return requestJson(
    `${ORGANIZATION_API_PATH.PRECINCTS}${requireId(id)}/`,
    REQUEST_METHOD.GET,
    connection,
    200,
    (payload) => {
      if (!isRecinto(payload)) throw new Error('Respuesta fuera del contrato.')
      return payload
    },
  )
}

export function createRecinto(
  body: CreateRecintoBody,
  connection: ApiConnection,
): Promise<RecintoDTO> {
  return requestJson(
    ORGANIZATION_API_PATH.PRECINCTS,
    REQUEST_METHOD.POST,
    connection,
    201,
    (payload) => {
      if (!isRecinto(payload)) throw new Error('Respuesta fuera del contrato.')
      return payload
    },
    recintoWriteBody(body),
  )
}

export function replaceRecinto(
  id: number,
  body: ReplaceRecintoBody,
  connection: ApiConnection,
): Promise<RecintoDTO> {
  return requestJson(
    `${ORGANIZATION_API_PATH.PRECINCTS}${requireId(id)}/`,
    REQUEST_METHOD.PUT,
    connection,
    200,
    (payload) => {
      if (!isRecinto(payload)) throw new Error('Respuesta fuera del contrato.')
      return payload
    },
    recintoWriteBody(body),
  )
}

export function patchRecinto(
  id: number,
  body: PatchRecintoBody,
  connection: ApiConnection,
): Promise<RecintoDTO> {
  return requestJson(
    `${ORGANIZATION_API_PATH.PRECINCTS}${requireId(id)}/`,
    REQUEST_METHOD.PATCH,
    connection,
    200,
    (payload) => {
      if (!isRecinto(payload)) throw new Error('Respuesta fuera del contrato.')
      return payload
    },
    recintoWriteBody(body),
  )
}

export function deleteRecinto(id: number, connection: ApiConnection): Promise<void> {
  return request204(`${ORGANIZATION_API_PATH.PRECINCTS}${requireId(id)}/`, connection)
}

export function addUnitToRecinto(
  id: number,
  unitCode: string,
  connection: ApiConnection,
): Promise<AddUnitToRecintoResponseDTO> {
  return requestJson(
    `${ORGANIZATION_API_PATH.PRECINCTS}${requireId(id)}/agregar-unidad/${requirePathCode(unitCode)}/`,
    REQUEST_METHOD.POST,
    connection,
    200,
    (payload) => {
      if (!isAddUnitToRecintoResponse(payload)) throw new Error('Respuesta fuera del contrato.')
      return payload
    },
  )
}

export function removeUnitFromRecinto(
  id: number,
  unitCode: string,
  connection: ApiConnection,
): Promise<RecintoUnitRelationResponseDTO> {
  return requestJson(
    `${ORGANIZATION_API_PATH.PRECINCTS}${requireId(id)}/quitar-unidad/${requirePathCode(unitCode)}/`,
    REQUEST_METHOD.DELETE,
    connection,
    200,
    (payload) => {
      if (!isRecintoUnitRelationResponse(payload)) throw new Error('Respuesta fuera del contrato.')
      return payload
    },
  )
}
