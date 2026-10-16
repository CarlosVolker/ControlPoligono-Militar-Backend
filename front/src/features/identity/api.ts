import { request } from '../../api/http'
import type { ApiConnection } from '../../types/dashboard'

export { HttpRequestError } from '../../api/http'
export type {
  AuthorizationCatalogRoleDto,
  AuthorizationCatalogScopeDto,
  RoleCategoryDto,
} from '../authorization/api'

const IDENTITY_API_PATH = {
  USERS: '/usuarios/',
  POSITIONS: '/posiciones/',
  MEMBERSHIPS: '/memberships/',
} as const

const IDENTITY_API_ERROR_KIND = {
  SCHEMA: 'schema',
  CONFIGURATION: 'configuration',
} as const

type IdentityApiErrorKind =
  (typeof IDENTITY_API_ERROR_KIND)[keyof typeof IDENTITY_API_ERROR_KIND]

const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const

type JsonMethod = Exclude<(typeof HTTP_METHOD)[keyof typeof HTTP_METHOD], 'DELETE'>
type JsonValidator<T> = (value: unknown, status: number) => T
type ValueValidator = (value: unknown) => boolean

export class IdentityApiError extends Error {
  readonly kind: IdentityApiErrorKind
  readonly status: number | null
  readonly detail: string | null
  readonly payload: unknown
  readonly retryAfter: string | null

  constructor(
    kind: IdentityApiErrorKind,
    status: number | null = null,
    payload: unknown = undefined,
    retryAfter: string | null = null,
  ) {
    super(kind === IDENTITY_API_ERROR_KIND.SCHEMA
      ? 'La respuesta del servidor no cumple el contrato de identidad esperado.'
      : 'La solicitud requiere un contexto válido.')
    this.name = 'IdentityApiError'
    this.kind = kind
    this.status = status
    this.payload = payload
    this.retryAfter = retryAfter
    this.detail = responseDetail(payload)
  }
}

export interface UserPrimaryAssignmentDTO {
  unit_code: string | null
  role_code: string | null
  scope_code: string | null
}

export interface UserAssignmentDTO {
  id: number
  role_code: string | null
  role_name: string | null
  unit_code: string | null
  scope_code: string | null
  is_primary: boolean
}

/** Full current UsuarioSerializer response; it does not expose is_temporary. */
export interface IdentityUserDTO {
  id_usuario: number
  rut: string
  grado: string | null
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  correo: string | null
  habilitado: boolean
  is_locked: boolean
  must_change_password: boolean
  password_changed_at: string | null
  primary_assignment: UserPrimaryAssignmentDTO | null
  assignments: UserAssignmentDTO[]
}

export interface CreateUserRequest {
  rut: string
  grado?: string | null
  nombre?: string
  apellido_paterno: string
  apellido_materno: string
  correo?: string | null
  initial_unit_code?: string | null
  initial_role_code?: string | null
  initial_scope_code?: string | null
}

export interface ReplaceUserRequest {
  rut: string
  grado: string | null
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  correo: string | null
}

export interface PatchUserRequest {
  rut?: string
  grado?: string | null
  nombre?: string
  apellido_paterno?: string
  apellido_materno?: string
  correo?: string | null
}

export interface PrimaryAssignmentRequest {
  unit_code: string
  role_code: string
  scope_code?: string | null
}

/** The current backend handler requires unit_code and role_code for PATCH too. */
export type PatchPrimaryAssignmentRequest = PrimaryAssignmentRequest

export interface PrimaryAssignmentResponseDTO {
  detail: string
  unit_code: string
  role_code: string
  scope_code: string | null
}

export interface DeactivatePrimaryAssignmentResponseDTO {
  detail: string
  desactivadas: number
}

export interface AddAssignmentResponseDTO {
  detail: string
  assignment_id: number
}

export interface PositionDTO {
  id: number
  tenant: number
  code: string
  name: string
  organization_unit: number
  organization_unit_code: string
  organization_unit_name: string
  armory: number | null
  armory_code: string | null
  role: number
  role_code: string
  role_name: string
  scope_policy: number | null
  scope_code: string | null
  recinto: number | null
  recinto_code: string | null
  recinto_name: string | null
  description: string
  is_active: boolean
  is_unique_holder: boolean
  current_holders_count: number
  created_at: string
  updated_at: string
}

export interface CreatePositionRequest {
  code: string
  name: string
  organization_unit_code_write: string
  role_code_write: string
  armory_code_write?: string | null
  scope_code_write?: string | null
  recinto_code_write?: string | null
  description?: string
  is_active?: boolean
  is_unique_holder?: boolean
}

export interface ReplacePositionRequest {
  code: string
  name: string
  organization_unit_code_write: string
  role_code_write: string
  armory_code_write: string | null
  scope_code_write: string | null
  recinto_code_write: string | null
  description: string
  is_active: boolean
  is_unique_holder: boolean
}

export interface PatchPositionRequest {
  code?: string
  name?: string
  organization_unit_code_write?: string
  role_code_write?: string
  armory_code_write?: string | null
  scope_code_write?: string | null
  recinto_code_write?: string | null
  description?: string
  is_active?: boolean
  is_unique_holder?: boolean
}

export interface PositionHolderDTO {
  id: number
  account: number
  rut: string
  nombre: string
  grado: string | null
  is_primary: boolean
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string | null
}

export interface AssignPositionHolderRequest {
  /** Account.pk, not Usuario.id_usuario. */
  account_id: number
  is_primary?: boolean
  starts_at?: string | null
}

export interface PositionHolderIdempotentResponseDTO {
  detail: string
  assignment_id: number
}

export type AssignPositionHolderResponseDTO =
  | PositionHolderDTO
  | PositionHolderIdempotentResponseDTO

export interface PositionHolderHistoryDTO {
  position_code: string
  position_name: string
  holders: PositionHolderDTO[]
}

export interface UnitMembershipDTO {
  id: number
  account: number
  rut: string
  unit: number
  unit_code: string
  unit_name: string
  is_primary: boolean
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export interface CreateUnitMembershipRequest {
  /** Account.pk, not Usuario.id_usuario. */
  account: number
  /** OrganizationUnit.pk, not its code or Position.pk. */
  unit: number
  is_primary?: boolean
  is_active?: boolean
  starts_at?: string | null
  ends_at?: string | null
}

export interface ReplaceUnitMembershipRequest {
  account: number
  unit: number
  is_primary: boolean
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

export interface PatchUnitMembershipRequest {
  account?: number
  unit?: number
  is_primary?: boolean
  is_active?: boolean
  starts_at?: string | null
  ends_at?: string | null
}

export interface DetailResponseDTO {
  detail: string
}

export interface UserLockStatusDTO {
  rut: string
  is_locked: boolean
  failures: number
  failure_limit: number
  last_attempt?: string | null
}

export interface UnlockUserResponseDTO {
  detail: string
  rut?: string
  registros_eliminados?: number
}

export interface ChangeOwnPasswordRequest {
  old_password: string
  new_password: string
}

export interface ChangeOtherUserPasswordRequest {
  new_password: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function hasFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every((field) => hasOwn(value, field))
}

function isPositiveId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value)
}

function isNullableId(value: unknown): value is number | null {
  return value === null || isPositiveId(value)
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isNullableDateTime(value: unknown): value is string | null {
  return value === null || (
    isString(value)
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value))
  )
}

function requireShape(condition: unknown): asserts condition {
  if (!condition) throw new IdentityApiError(IDENTITY_API_ERROR_KIND.SCHEMA)
}

function requireInput(condition: unknown): asserts condition {
  if (!condition) throw new IdentityApiError(IDENTITY_API_ERROR_KIND.CONFIGURATION)
}

function responseDetail(value: unknown): string | null {
  return isRecord(value) && isString(value.detail) ? value.detail : null
}

function responseError(response: Response, payload: unknown): IdentityApiError {
  return new IdentityApiError(
    IDENTITY_API_ERROR_KIND.SCHEMA,
    response.status,
    payload,
    response.headers.get('Retry-After'),
  )
}

function validatePrimaryAssignment(value: unknown): UserPrimaryAssignmentDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, ['unit_code', 'role_code', 'scope_code']))
  requireShape(isNullableString(value.unit_code))
  requireShape(isNullableString(value.role_code))
  requireShape(isNullableString(value.scope_code))
  return {
    unit_code: value.unit_code,
    role_code: value.role_code,
    scope_code: value.scope_code,
  }
}

function validateUserAssignment(value: unknown): UserAssignmentDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, [
    'id', 'role_code', 'role_name', 'unit_code', 'scope_code', 'is_primary',
  ]))
  requireShape(isPositiveId(value.id))
  requireShape(isNullableString(value.role_code))
  requireShape(isNullableString(value.role_name))
  requireShape(isNullableString(value.unit_code))
  requireShape(isNullableString(value.scope_code))
  requireShape(isBoolean(value.is_primary))
  return {
    id: value.id,
    role_code: value.role_code,
    role_name: value.role_name,
    unit_code: value.unit_code,
    scope_code: value.scope_code,
    is_primary: value.is_primary,
  }
}

function validateUser(value: unknown): IdentityUserDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, [
    'id_usuario', 'rut', 'grado', 'nombre', 'apellido_paterno', 'apellido_materno',
    'correo', 'habilitado', 'is_locked', 'must_change_password', 'password_changed_at',
    'primary_assignment', 'assignments',
  ]))
  requireShape(isPositiveId(value.id_usuario))
  requireShape(isString(value.rut))
  requireShape(isNullableString(value.grado))
  requireShape(isString(value.nombre))
  requireShape(isString(value.apellido_paterno))
  requireShape(isString(value.apellido_materno))
  requireShape(isNullableString(value.correo))
  requireShape(isBoolean(value.habilitado))
  requireShape(isBoolean(value.is_locked))
  requireShape(isBoolean(value.must_change_password))
  requireShape(isNullableDateTime(value.password_changed_at))
  requireShape(value.primary_assignment === null || isRecord(value.primary_assignment))
  const assignments = value.assignments
  requireShape(isUnknownArray(assignments))
  return {
    id_usuario: value.id_usuario,
    rut: value.rut,
    grado: value.grado,
    nombre: value.nombre,
    apellido_paterno: value.apellido_paterno,
    apellido_materno: value.apellido_materno,
    correo: value.correo,
    habilitado: value.habilitado,
    is_locked: value.is_locked,
    must_change_password: value.must_change_password,
    password_changed_at: value.password_changed_at,
    primary_assignment: value.primary_assignment === null
      ? null
      : validatePrimaryAssignment(value.primary_assignment),
    assignments: assignments.map((item) => validateUserAssignment(item)),
  }
}

function validateUsers(value: unknown): IdentityUserDTO[] {
  requireShape(isUnknownArray(value))
  return value.map((item) => validateUser(item))
}

function validatePosition(value: unknown): PositionDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, [
    'id', 'tenant', 'code', 'name', 'organization_unit', 'organization_unit_code',
    'organization_unit_name', 'armory', 'armory_code', 'role', 'role_code', 'role_name',
    'scope_policy', 'scope_code', 'recinto', 'recinto_code', 'recinto_name', 'description',
    'is_active', 'is_unique_holder', 'current_holders_count', 'created_at', 'updated_at',
  ]))
  requireShape(isPositiveId(value.id))
  requireShape(isPositiveId(value.tenant))
  requireShape(isString(value.code))
  requireShape(isString(value.name))
  requireShape(isPositiveId(value.organization_unit))
  requireShape(isString(value.organization_unit_code))
  requireShape(isString(value.organization_unit_name))
  requireShape(isNullableId(value.armory))
  requireShape(isNullableString(value.armory_code))
  requireShape(isPositiveId(value.role))
  requireShape(isString(value.role_code))
  requireShape(isString(value.role_name))
  requireShape(isNullableId(value.scope_policy))
  requireShape(isNullableString(value.scope_code))
  requireShape(isNullableId(value.recinto))
  requireShape(isNullableString(value.recinto_code))
  requireShape(isNullableString(value.recinto_name))
  requireShape(isString(value.description))
  requireShape(isBoolean(value.is_active))
  requireShape(isBoolean(value.is_unique_holder))
  requireShape(isCount(value.current_holders_count))
  requireShape(isString(value.created_at))
  requireShape(isString(value.updated_at))
  return {
    id: value.id,
    tenant: value.tenant,
    code: value.code,
    name: value.name,
    organization_unit: value.organization_unit,
    organization_unit_code: value.organization_unit_code,
    organization_unit_name: value.organization_unit_name,
    armory: value.armory,
    armory_code: value.armory_code,
    role: value.role,
    role_code: value.role_code,
    role_name: value.role_name,
    scope_policy: value.scope_policy,
    scope_code: value.scope_code,
    recinto: value.recinto,
    recinto_code: value.recinto_code,
    recinto_name: value.recinto_name,
    description: value.description,
    is_active: value.is_active,
    is_unique_holder: value.is_unique_holder,
    current_holders_count: value.current_holders_count,
    created_at: value.created_at,
    updated_at: value.updated_at,
  }
}

function validatePositions(value: unknown): PositionDTO[] {
  requireShape(isUnknownArray(value))
  return value.map((item) => validatePosition(item))
}

function validatePositionHolder(value: unknown): PositionHolderDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, [
    'id', 'account', 'rut', 'nombre', 'grado', 'is_primary', 'is_active',
    'starts_at', 'ends_at', 'created_at',
  ]))
  requireShape(isPositiveId(value.id))
  requireShape(isPositiveId(value.account))
  requireShape(isString(value.rut))
  requireShape(isString(value.nombre))
  requireShape(isNullableString(value.grado))
  requireShape(isBoolean(value.is_primary))
  requireShape(isBoolean(value.is_active))
  requireShape(isNullableDateTime(value.starts_at))
  requireShape(isNullableDateTime(value.ends_at))
  requireShape(isNullableDateTime(value.created_at))
  return {
    id: value.id,
    account: value.account,
    rut: value.rut,
    nombre: value.nombre,
    grado: value.grado,
    is_primary: value.is_primary,
    is_active: value.is_active,
    starts_at: value.starts_at,
    ends_at: value.ends_at,
    created_at: value.created_at,
  }
}

function validatePositionHolderAction(value: unknown): PositionHolderIdempotentResponseDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, ['detail', 'assignment_id']))
  requireShape(isString(value.detail))
  requireShape(isPositiveId(value.assignment_id))
  return { detail: value.detail, assignment_id: value.assignment_id }
}

function validatePositionHolderHistory(value: unknown): PositionHolderHistoryDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, ['position_code', 'position_name', 'holders']))
  requireShape(isString(value.position_code))
  requireShape(isString(value.position_name))
  requireShape(isUnknownArray(value.holders))
  return {
    position_code: value.position_code,
    position_name: value.position_name,
    holders: value.holders.map((holder) => validatePositionHolder(holder)),
  }
}

function validateUnitMembership(value: unknown): UnitMembershipDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, [
    'id', 'account', 'rut', 'unit', 'unit_code', 'unit_name', 'is_primary',
    'is_active', 'starts_at', 'ends_at', 'created_at',
  ]))
  requireShape(isPositiveId(value.id))
  requireShape(isPositiveId(value.account))
  requireShape(isString(value.rut))
  requireShape(isPositiveId(value.unit))
  requireShape(isString(value.unit_code))
  requireShape(isString(value.unit_name))
  requireShape(isBoolean(value.is_primary))
  requireShape(isBoolean(value.is_active))
  requireShape(isNullableDateTime(value.starts_at))
  requireShape(isNullableDateTime(value.ends_at))
  requireShape(isString(value.created_at))
  return {
    id: value.id,
    account: value.account,
    rut: value.rut,
    unit: value.unit,
    unit_code: value.unit_code,
    unit_name: value.unit_name,
    is_primary: value.is_primary,
    is_active: value.is_active,
    starts_at: value.starts_at,
    ends_at: value.ends_at,
    created_at: value.created_at,
  }
}

function validateMemberships(value: unknown): UnitMembershipDTO[] {
  requireShape(isUnknownArray(value))
  return value.map((item) => validateUnitMembership(item))
}

function validateDetail(value: unknown): DetailResponseDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, ['detail']))
  requireShape(isString(value.detail))
  return { detail: value.detail }
}

function validatePrimaryAssignmentResponse(value: unknown): PrimaryAssignmentResponseDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, ['detail', 'unit_code', 'role_code', 'scope_code']))
  requireShape(isString(value.detail))
  requireShape(isString(value.unit_code))
  requireShape(isString(value.role_code))
  requireShape(isNullableString(value.scope_code))
  return {
    detail: value.detail,
    unit_code: value.unit_code,
    role_code: value.role_code,
    scope_code: value.scope_code,
  }
}

function validateDeactivatedPrimary(value: unknown): DeactivatePrimaryAssignmentResponseDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, ['detail', 'desactivadas']))
  requireShape(isString(value.detail))
  requireShape(isCount(value.desactivadas))
  return { detail: value.detail, desactivadas: value.desactivadas }
}

function validateAddedAssignment(value: unknown): AddAssignmentResponseDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, ['detail', 'assignment_id']))
  requireShape(isString(value.detail))
  requireShape(isPositiveId(value.assignment_id))
  return { detail: value.detail, assignment_id: value.assignment_id }
}

function validateUserLockStatus(value: unknown): UserLockStatusDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, ['rut', 'is_locked', 'failures', 'failure_limit']))
  requireShape(isString(value.rut))
  requireShape(isBoolean(value.is_locked))
  requireShape(isCount(value.failures))
  requireShape(isCount(value.failure_limit))
  if (hasOwn(value, 'last_attempt')) {
    requireShape(isNullableDateTime(value.last_attempt))
    return {
      rut: value.rut,
      is_locked: value.is_locked,
      failures: value.failures,
      failure_limit: value.failure_limit,
      last_attempt: value.last_attempt,
    }
  }
  return {
    rut: value.rut,
    is_locked: value.is_locked,
    failures: value.failures,
    failure_limit: value.failure_limit,
  }
}

function validateUnlockResponse(value: unknown): UnlockUserResponseDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, ['detail']))
  requireShape(isString(value.detail))
  const response: UnlockUserResponseDTO = { detail: value.detail }
  if (hasOwn(value, 'rut')) {
    requireShape(isString(value.rut))
    response.rut = value.rut
  }
  if (hasOwn(value, 'registros_eliminados')) {
    requireShape(isCount(value.registros_eliminados))
    response.registros_eliminados = value.registros_eliminados
  }
  return response
}

async function readJsonPayload(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

async function readJsonResponse<T>(
  response: Response,
  expectedStatuses: readonly number[],
  validate: JsonValidator<T>,
): Promise<T> {
  const payload = await readJsonPayload(response)
  if (!expectedStatuses.includes(response.status)) throw responseError(response, payload)
  try {
    return validate(payload, response.status)
  } catch {
    throw responseError(response, payload)
  }
}

function requireConnection(connection: ApiConnection): string {
  requireInput(isRecord(connection))
  requireInput(isString(connection.tenantCode) && connection.tenantCode.trim().length > 0)
  requireInput(isString(connection.unitCode))
  return connection.tenantCode.trim()
}

function requireId(id: number): void {
  requireInput(isPositiveId(id))
}

function itemPath(collection: string, id: number): string {
  requireId(id)
  return `${collection}${id}/`
}

function projectRequestBody(
  value: unknown,
  validators: Record<string, ValueValidator>,
  requiredFields: readonly string[],
): Record<string, unknown> {
  requireInput(isRecord(value))
  const source = value
  const projected: Record<string, unknown> = {}
  for (const field of requiredFields) requireInput(hasOwn(source, field))
  for (const [field, validate] of Object.entries(validators)) {
    if (!hasOwn(source, field)) continue
    const fieldValue = source[field]
    requireInput(validate(fieldValue))
    projected[field] = fieldValue
  }
  return projected
}

const USER_WRITE_VALIDATORS: Record<string, ValueValidator> = {
  rut: isString,
  grado: isNullableString,
  nombre: isString,
  apellido_paterno: isString,
  apellido_materno: isString,
  correo: isNullableString,
}

const USER_CREATE_VALIDATORS: Record<string, ValueValidator> = {
  ...USER_WRITE_VALIDATORS,
  initial_unit_code: isNullableString,
  initial_role_code: isNullableString,
  initial_scope_code: isNullableString,
}

const POSITION_WRITE_VALIDATORS: Record<string, ValueValidator> = {
  code: isString,
  name: isString,
  organization_unit_code_write: isString,
  role_code_write: isString,
  armory_code_write: isNullableString,
  scope_code_write: isNullableString,
  recinto_code_write: isNullableString,
  description: isString,
  is_active: isBoolean,
  is_unique_holder: isBoolean,
}

const MEMBERSHIP_WRITE_VALIDATORS: Record<string, ValueValidator> = {
  account: isPositiveId,
  unit: isPositiveId,
  is_primary: isBoolean,
  is_active: isBoolean,
  starts_at: isNullableDateTime,
  ends_at: isNullableDateTime,
}

async function requestJson<T>(
  path: string,
  method: JsonMethod,
  connection: ApiConnection,
  expectedStatuses: readonly number[],
  validate: JsonValidator<T>,
  body?: unknown,
): Promise<T> {
  const tenantCode = requireConnection(connection)
  const response = await request(path, {
    method,
    tenantCode,
    unitCode: connection.unitCode,
    signal: connection.signal,
    ...(method === HTTP_METHOD.GET ? {} : { body, requireCsrf: true }),
  })
  return readJsonResponse(response, expectedStatuses, validate)
}

async function requestDelete(path: string, connection: ApiConnection): Promise<void> {
  const response = await request(path, {
    method: HTTP_METHOD.DELETE,
    tenantCode: requireConnection(connection),
    unitCode: connection.unitCode,
    signal: connection.signal,
    requireCsrf: true,
  })
  if (response.status === 204) return
  throw responseError(response, await readJsonPayload(response))
}

function userWriteBody(value: unknown, requiredFields: readonly string[]): Record<string, unknown> {
  return projectRequestBody(value, USER_WRITE_VALIDATORS, requiredFields)
}

function userCreateBody(value: unknown): Record<string, unknown> {
  return projectRequestBody(value, USER_CREATE_VALIDATORS, [
    'rut', 'apellido_paterno', 'apellido_materno',
  ])
}

function positionWriteBody(value: unknown, requiredFields: readonly string[]): Record<string, unknown> {
  return projectRequestBody(value, POSITION_WRITE_VALIDATORS, requiredFields)
}

function membershipWriteBody(value: unknown, requiredFields: readonly string[]): Record<string, unknown> {
  return projectRequestBody(value, MEMBERSHIP_WRITE_VALIDATORS, requiredFields)
}

function userPath(idUsuario: number): string {
  return itemPath(IDENTITY_API_PATH.USERS, idUsuario)
}

function positionPath(idPosition: number): string {
  return itemPath(IDENTITY_API_PATH.POSITIONS, idPosition)
}

function membershipPath(idMembership: number): string {
  return itemPath(IDENTITY_API_PATH.MEMBERSHIPS, idMembership)
}

export function getUsers(connection: ApiConnection): Promise<IdentityUserDTO[]> {
  return requestJson(
    IDENTITY_API_PATH.USERS,
    HTTP_METHOD.GET,
    connection,
    [200],
    (value) => validateUsers(value),
  )
}

export function getUser(idUsuario: number, connection: ApiConnection): Promise<IdentityUserDTO> {
  return requestJson(userPath(idUsuario), HTTP_METHOD.GET, connection, [200], validateUser)
}

/** POST /usuarios/ also promotes a matching temporary user on the server. */
export function createUser(
  body: CreateUserRequest,
  connection: ApiConnection,
): Promise<IdentityUserDTO> {
  return requestJson(
    IDENTITY_API_PATH.USERS,
    HTTP_METHOD.POST,
    connection,
    [201],
    validateUser,
    userCreateBody(body),
  )
}

export function replaceUser(
  idUsuario: number,
  body: ReplaceUserRequest,
  connection: ApiConnection,
): Promise<IdentityUserDTO> {
  return requestJson(
    userPath(idUsuario),
    HTTP_METHOD.PUT,
    connection,
    [200],
    validateUser,
    userWriteBody(body, [
      'rut', 'grado', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo',
    ]),
  )
}

export function patchUser(
  idUsuario: number,
  body: PatchUserRequest,
  connection: ApiConnection,
): Promise<IdentityUserDTO> {
  return requestJson(
    userPath(idUsuario),
    HTTP_METHOD.PATCH,
    connection,
    [200],
    validateUser,
    userWriteBody(body, []),
  )
}

export function deleteUser(idUsuario: number, connection: ApiConnection): Promise<void> {
  return requestDelete(userPath(idUsuario), connection)
}

export function replacePrimaryAssignment(
  idUsuario: number,
  body: PrimaryAssignmentRequest,
  connection: ApiConnection,
): Promise<PrimaryAssignmentResponseDTO> {
  requireId(idUsuario)
  const requestBody = projectRequestBody(body, {
    unit_code: isString,
    role_code: isString,
    scope_code: isNullableString,
  }, ['unit_code', 'role_code'])
  return requestJson(
    `${userPath(idUsuario)}asignacion-principal/`,
    HTTP_METHOD.PUT,
    connection,
    [200],
    validatePrimaryAssignmentResponse,
    requestBody,
  )
}

export function patchPrimaryAssignment(
  idUsuario: number,
  body: PatchPrimaryAssignmentRequest,
  connection: ApiConnection,
): Promise<PrimaryAssignmentResponseDTO> {
  requireId(idUsuario)
  const requestBody = projectRequestBody(body, {
    unit_code: isString,
    role_code: isString,
    scope_code: isNullableString,
  }, ['unit_code', 'role_code'])
  return requestJson(
    `${userPath(idUsuario)}asignacion-principal/`,
    HTTP_METHOD.PATCH,
    connection,
    [200],
    validatePrimaryAssignmentResponse,
    requestBody,
  )
}

export function deactivatePrimaryAssignment(
  idUsuario: number,
  connection: ApiConnection,
): Promise<DeactivatePrimaryAssignmentResponseDTO> {
  requireId(idUsuario)
  return requestJson(
    `${userPath(idUsuario)}desactivar-asignacion-principal/`,
    HTTP_METHOD.POST,
    connection,
    [200],
    (value) => validateDeactivatedPrimary(value),
  )
}

export function addSecondaryAssignment(
  idUsuario: number,
  body: PrimaryAssignmentRequest,
  connection: ApiConnection,
): Promise<AddAssignmentResponseDTO> {
  requireId(idUsuario)
  const requestBody = projectRequestBody(body, {
    unit_code: isString,
    role_code: isString,
    scope_code: isNullableString,
  }, ['unit_code', 'role_code'])
  return requestJson(
    `${userPath(idUsuario)}agregar-asignacion/`,
    HTTP_METHOD.POST,
    connection,
    [200, 201],
    validateAddedAssignment,
    requestBody,
  )
}

export function removeUserAssignment(
  idUsuario: number,
  idAssignment: number,
  connection: ApiConnection,
): Promise<DetailResponseDTO> {
  requireId(idUsuario)
  requireId(idAssignment)
  return requestJson(
    `${userPath(idUsuario)}quitar-asignacion/${idAssignment}/`,
    HTTP_METHOD.POST,
    connection,
    [200],
    validateDetail,
  )
}

export function getPositions(connection: ApiConnection): Promise<PositionDTO[]> {
  return requestJson(
    IDENTITY_API_PATH.POSITIONS,
    HTTP_METHOD.GET,
    connection,
    [200],
    (value) => validatePositions(value),
  )
}

export function getPosition(idPosition: number, connection: ApiConnection): Promise<PositionDTO> {
  return requestJson(positionPath(idPosition), HTTP_METHOD.GET, connection, [200], validatePosition)
}

export function createPosition(
  body: CreatePositionRequest,
  connection: ApiConnection,
): Promise<PositionDTO> {
  return requestJson(
    IDENTITY_API_PATH.POSITIONS,
    HTTP_METHOD.POST,
    connection,
    [201],
    validatePosition,
    positionWriteBody(body, ['code', 'name', 'organization_unit_code_write', 'role_code_write']),
  )
}

export function replacePosition(
  idPosition: number,
  body: ReplacePositionRequest,
  connection: ApiConnection,
): Promise<PositionDTO> {
  return requestJson(
    positionPath(idPosition),
    HTTP_METHOD.PUT,
    connection,
    [200],
    validatePosition,
    positionWriteBody(body, [
      'code', 'name', 'organization_unit_code_write', 'role_code_write',
      'armory_code_write', 'scope_code_write', 'recinto_code_write', 'description',
      'is_active', 'is_unique_holder',
    ]),
  )
}

export function patchPosition(
  idPosition: number,
  body: PatchPositionRequest,
  connection: ApiConnection,
): Promise<PositionDTO> {
  return requestJson(
    positionPath(idPosition),
    HTTP_METHOD.PATCH,
    connection,
    [200],
    validatePosition,
    positionWriteBody(body, []),
  )
}

export function deletePosition(idPosition: number, connection: ApiConnection): Promise<void> {
  return requestDelete(positionPath(idPosition), connection)
}

export function assignPositionHolder(
  idPosition: number,
  body: AssignPositionHolderRequest,
  connection: ApiConnection,
): Promise<AssignPositionHolderResponseDTO> {
  requireId(idPosition)
  const requestBody = projectRequestBody(body, {
    account_id: isPositiveId,
    is_primary: isBoolean,
    starts_at: isNullableDateTime,
  }, ['account_id'])
  return requestJson(
    `${positionPath(idPosition)}asignar-holder/`,
    HTTP_METHOD.POST,
    connection,
    [200, 201],
    (value, status) => status === 201
      ? validatePositionHolder(value)
      : validatePositionHolderAction(value),
    requestBody,
  )
}

export function removePositionHolder(
  idPosition: number,
  idAssignment: number,
  connection: ApiConnection,
): Promise<DetailResponseDTO> {
  requireId(idPosition)
  requireId(idAssignment)
  return requestJson(
    `${positionPath(idPosition)}quitar-holder/${idAssignment}/`,
    HTTP_METHOD.POST,
    connection,
    [200],
    validateDetail,
  )
}

export function getPositionHolderHistory(
  idPosition: number,
  connection: ApiConnection,
): Promise<PositionHolderHistoryDTO> {
  return requestJson(
    `${positionPath(idPosition)}historico/`,
    HTTP_METHOD.GET,
    connection,
    [200],
    validatePositionHolderHistory,
  )
}

export function getMemberships(connection: ApiConnection): Promise<UnitMembershipDTO[]> {
  return requestJson(
    IDENTITY_API_PATH.MEMBERSHIPS,
    HTTP_METHOD.GET,
    connection,
    [200],
    (value) => validateMemberships(value),
  )
}

export function getMembership(
  idMembership: number,
  connection: ApiConnection,
): Promise<UnitMembershipDTO> {
  return requestJson(membershipPath(idMembership), HTTP_METHOD.GET, connection, [200], validateUnitMembership)
}

export function createMembership(
  body: CreateUnitMembershipRequest,
  connection: ApiConnection,
): Promise<UnitMembershipDTO> {
  return requestJson(
    IDENTITY_API_PATH.MEMBERSHIPS,
    HTTP_METHOD.POST,
    connection,
    [201],
    validateUnitMembership,
    membershipWriteBody(body, ['account', 'unit']),
  )
}

export function replaceMembership(
  idMembership: number,
  body: ReplaceUnitMembershipRequest,
  connection: ApiConnection,
): Promise<UnitMembershipDTO> {
  return requestJson(
    membershipPath(idMembership),
    HTTP_METHOD.PUT,
    connection,
    [200],
    validateUnitMembership,
    membershipWriteBody(body, [
      'account', 'unit', 'is_primary', 'is_active', 'starts_at', 'ends_at',
    ]),
  )
}

export function patchMembership(
  idMembership: number,
  body: PatchUnitMembershipRequest,
  connection: ApiConnection,
): Promise<UnitMembershipDTO> {
  return requestJson(
    membershipPath(idMembership),
    HTTP_METHOD.PATCH,
    connection,
    [200],
    validateUnitMembership,
    membershipWriteBody(body, []),
  )
}

export function deleteMembership(idMembership: number, connection: ApiConnection): Promise<void> {
  return requestDelete(membershipPath(idMembership), connection)
}

async function postPasswordChange(
  idUsuario: number,
  body: Record<string, unknown>,
  connection: ApiConnection,
): Promise<DetailResponseDTO> {
  return requestJson(
    `${userPath(idUsuario)}cambiar-contrasena/`,
    HTTP_METHOD.POST,
    connection,
    [200],
    validateDetail,
    body,
  )
}

/** idUsuario is the caller-supplied Usuario.id_usuario, never an Account.pk. */
export function changeOwnPassword(
  idUsuario: number,
  body: ChangeOwnPasswordRequest,
  connection: ApiConnection,
): Promise<DetailResponseDTO> {
  requireId(idUsuario)
  const requestBody = projectRequestBody(body, {
    old_password: isString,
    new_password: isString,
  }, ['old_password', 'new_password'])
  return postPasswordChange(idUsuario, requestBody, connection)
}

export function changeOtherUserPassword(
  idUsuario: number,
  body: ChangeOtherUserPasswordRequest,
  connection: ApiConnection,
): Promise<DetailResponseDTO> {
  requireId(idUsuario)
  const requestBody = projectRequestBody(body, { new_password: isString }, ['new_password'])
  return postPasswordChange(idUsuario, requestBody, connection)
}

export function resetUserPassword(
  idUsuario: number,
  connection: ApiConnection,
): Promise<DetailResponseDTO> {
  requireId(idUsuario)
  return requestJson(
    `${userPath(idUsuario)}resetear-contrasena/`,
    HTTP_METHOD.POST,
    connection,
    [200],
    validateDetail,
  )
}

export function getUserLockStatus(
  idUsuario: number,
  connection: ApiConnection,
): Promise<UserLockStatusDTO> {
  return requestJson(
    `${userPath(idUsuario)}estado-bloqueo/`,
    HTTP_METHOD.GET,
    connection,
    [200],
    validateUserLockStatus,
  )
}

export function unlockUser(
  idUsuario: number,
  connection: ApiConnection,
): Promise<UnlockUserResponseDTO> {
  return requestJson(
    `${userPath(idUsuario)}desbloquear/`,
    HTTP_METHOD.POST,
    connection,
    [200],
    validateUnlockResponse,
  )
}
