import { request } from '../../api/http'
import type { ApiConnection } from '../../types/dashboard'

export { HttpRequestError } from '../../api/http'

/**
 * Contratos locales de F5. Los campos de respuesta siguen los serializers de
 * `apps/authorization/serializers.py:13-75` y las vistas de
 * `apipoligono/views.py:1547-1898`; las rutas están registradas en
 * `apipoligono/urls.py:46-60,69,90-95`.
 * ScopePolicy y Permission sólo exponen lectura. La autoridad de permisos y
 * sus precedencias permanecen en el backend.
 */

export const AUTHORIZATION_API_ERROR_KIND = {
  SCHEMA: 'schema',
  CONFIGURATION: 'configuration',
} as const

export type AuthorizationApiErrorKind =
  (typeof AUTHORIZATION_API_ERROR_KIND)[keyof typeof AUTHORIZATION_API_ERROR_KIND]

export class AuthorizationApiError extends Error {
  readonly kind: AuthorizationApiErrorKind
  readonly status: number | null
  readonly detail: null = null
  readonly retryAfter: null = null
  readonly payload: unknown = undefined

  constructor(kind: AuthorizationApiErrorKind, status: number | null = null) {
    super(kind === AUTHORIZATION_API_ERROR_KIND.SCHEMA
      ? 'La respuesta del servidor no cumple el contrato esperado.'
      : 'La solicitud requiere un contexto válido.')
    this.name = 'AuthorizationApiError'
    this.kind = kind
    this.status = status
  }
}

/** RoleSerializer: los seis campos son de respuesta; los DTO de escritura van aparte. */
export interface RoleDto {
  id: number
  code: string
  name: string
  description: string
  is_active: boolean
  is_system: boolean
}

export interface RoleWriteRequest {
  code: string
  name: string
  description?: string
  is_active?: boolean
  is_system?: boolean
}

export type CreateRoleRequest = RoleWriteRequest
export type ReplaceRoleRequest = RoleWriteRequest
export type PatchRoleRequest = Partial<RoleWriteRequest>

/** ScopePolicySerializer es de sólo lectura. */
export interface ScopePolicyDto {
  id: number
  code: string
  name: string
  description: string
}

/** PermissionSerializer es de sólo lectura y la vista sólo devuelve activos. */
export interface PermissionDto {
  id: number
  code: string
  name: string
  category: string
  description: string
  is_active: boolean
}

/** RolePermissionSerializer: claves resueltas por el servidor son sólo lectura. */
export interface RolePermissionDto {
  id: number
  role: number
  role_code: string
  permission: number
  permission_code: string
  permission_name: string
  permission_category: string
  allowed: boolean
}

export interface RolePermissionWriteRequest {
  role: number
  permission: number
  allowed: boolean
}

export type CreateRolePermissionRequest = RolePermissionWriteRequest
export type ReplaceRolePermissionRequest = RolePermissionWriteRequest
export type PatchRolePermissionRequest = Partial<RolePermissionWriteRequest>

/** PositionPermissionSerializer: códigos y nombre resueltos son sólo lectura. */
export interface PositionPermissionDto {
  id: number
  position: number
  position_code: string
  permission: number
  permission_code: string
  permission_name: string
  allowed: boolean
}

export interface PositionPermissionWriteRequest {
  position: number
  permission: number
  allowed: boolean
}

export type CreatePositionPermissionRequest = PositionPermissionWriteRequest
export type ReplacePositionPermissionRequest = PositionPermissionWriteRequest
export type PatchPositionPermissionRequest = Partial<PositionPermissionWriteRequest>

/** UserPermissionOverrideSerializer: metadatos de auditoría son de sólo lectura. */
export interface UserPermissionOverrideDto {
  id: number
  account: number
  account_rut: string
  permission: number | null
  permission_code: string | null
  resource: string
  action: string
  allowed: boolean
  reason: string
  created_by: number | null
  created_by_rut: string | null
  created_at: string
}

export interface UserPermissionOverrideWriteRequest {
  account: number
  allowed: boolean
  permission?: number | null
  permission_code?: string | null
  resource?: string
  action?: string
  reason?: string
}

export type CreateUserPermissionOverrideRequest = UserPermissionOverrideWriteRequest
export type ReplaceUserPermissionOverrideRequest = UserPermissionOverrideWriteRequest
export type PatchUserPermissionOverrideRequest = Partial<UserPermissionOverrideWriteRequest>

export interface AuthorizationCatalogRoleDto {
  id: number
  code: string
  name: string
  description: string
  is_active: boolean
}

export interface AuthorizationCatalogScopeDto {
  id: number
  code: string
  name: string
  description: string
}

export interface AuthorizationCatalogResourceDto {
  code: string
  label: string
}

export interface AuthorizationCatalogActionDto {
  code: string
  label: string
  description: string
}

export interface AuthorizationCatalogDto {
  roles: AuthorizationCatalogRoleDto[]
  scopes: AuthorizationCatalogScopeDto[]
  resources: AuthorizationCatalogResourceDto[]
  actions: AuthorizationCatalogActionDto[]
}

export interface RoleCategoryRoleDto {
  code: string
  name: string
  description: string
}

export interface RoleCategoryDto {
  code: string
  label: string
  roles: RoleCategoryRoleDto[]
}

export interface RoleCategoriesDto {
  categories: RoleCategoryDto[]
}

export interface UnitPersonnelUserDto {
  id_usuario: number
  rut: string
  grado: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string
}

export interface UnitPersonnelAssignmentDto {
  id: number
  role_code: string | null
  role_name: string | null
  unit_code: string | null
  unit_name: string | null
  scope_code: string | null
  is_primary: boolean
}

export interface UnitPersonnelDto {
  user: UnitPersonnelUserDto
  unidad_personal_code: string | null
  unidad_personal_name: string | null
  assignments: UnitPersonnelAssignmentDto[]
}

export interface UnitPersonnelResponseDto {
  results: UnitPersonnelDto[]
}

export interface EligibleTargetUnitDto {
  id: number
  code: string
  name: string
}

export const ELIGIBLE_TARGET_UNIT_REASON = {
  NO_ACCOUNT: 'sin_account',
  NO_PERSONAL_UNIT: 'sin_unidad_personal',
} as const

export type EligibleTargetUnitReason =
  (typeof ELIGIBLE_TARGET_UNIT_REASON)[keyof typeof ELIGIBLE_TARGET_UNIT_REASON]

export interface EligibleTargetUnitsAvailableDto {
  results: EligibleTargetUnitDto[]
  unidad_personal_code: string
}

export interface EligibleTargetUnitsRestrictedDto {
  results: []
  reason: EligibleTargetUnitReason
}

export type EligibleTargetUnitsResponseDto =
  | EligibleTargetUnitsAvailableDto
  | EligibleTargetUnitsRestrictedDto

export interface AuditLogEntryDto {
  created_at: string
  endpoint: string
  action: string
  allowed: boolean
  reason: string
  organization_unit_code: string | null
  user_id_value: number | null
}

export interface AuditLogResponseDto {
  count: number
  results: AuditLogEntryDto[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value)
  return actualKeys.length === keys.length
    && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
}

function isSafeId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value)
}

function isCount(value: unknown): value is number {
  return isInteger(value) && value >= 0
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isNullableInteger(value: unknown): value is number | null {
  return value === null || isInteger(value)
}

function requireShape(condition: unknown): asserts condition {
  if (!condition) throw new AuthorizationApiError(AUTHORIZATION_API_ERROR_KIND.SCHEMA)
}

function requireConnection(connection: ApiConnection): string {
  if (typeof connection.tenantCode !== 'string' || !connection.tenantCode.trim()) {
    throw new AuthorizationApiError(AUTHORIZATION_API_ERROR_KIND.CONFIGURATION)
  }
  return connection.tenantCode.trim()
}

function validateArray<T>(value: unknown, validate: (item: unknown) => T): T[] {
  requireShape(isUnknownArray(value))
  return value.map((item) => validate(item))
}

function validateRole(value: unknown): RoleDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['id', 'code', 'name', 'description', 'is_active', 'is_system']))
  const { id, code, name, description, is_active, is_system } = value
  requireShape(isSafeId(id))
  requireShape(typeof code === 'string')
  requireShape(typeof name === 'string')
  requireShape(typeof description === 'string')
  requireShape(typeof is_active === 'boolean')
  requireShape(typeof is_system === 'boolean')
  return { id, code, name, description, is_active, is_system }
}

function validateScopePolicy(value: unknown): ScopePolicyDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['id', 'code', 'name', 'description']))
  const { id, code, name, description } = value
  requireShape(isSafeId(id))
  requireShape(typeof code === 'string')
  requireShape(typeof name === 'string')
  requireShape(typeof description === 'string')
  return { id, code, name, description }
}

function validatePermission(value: unknown): PermissionDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['id', 'code', 'name', 'category', 'description', 'is_active']))
  const { id, code, name, category, description, is_active } = value
  requireShape(isSafeId(id))
  requireShape(typeof code === 'string')
  requireShape(typeof name === 'string')
  requireShape(typeof category === 'string')
  requireShape(typeof description === 'string')
  requireShape(typeof is_active === 'boolean' && is_active)
  return { id, code, name, category, description, is_active }
}

function validateRolePermission(value: unknown): RolePermissionDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, [
    'id', 'role', 'role_code', 'permission', 'permission_code',
    'permission_name', 'permission_category', 'allowed',
  ]))
  const {
    id,
    role,
    role_code,
    permission,
    permission_code,
    permission_name,
    permission_category,
    allowed,
  } = value
  requireShape(isSafeId(id))
  requireShape(isSafeId(role))
  requireShape(typeof role_code === 'string')
  requireShape(isSafeId(permission))
  requireShape(typeof permission_code === 'string')
  requireShape(typeof permission_name === 'string')
  requireShape(typeof permission_category === 'string')
  requireShape(typeof allowed === 'boolean')
  return {
    id,
    role,
    role_code,
    permission,
    permission_code,
    permission_name,
    permission_category,
    allowed,
  }
}

function validatePositionPermission(value: unknown): PositionPermissionDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, [
    'id', 'position', 'position_code', 'permission', 'permission_code', 'permission_name', 'allowed',
  ]))
  const { id, position, position_code, permission, permission_code, permission_name, allowed } = value
  requireShape(isSafeId(id))
  requireShape(isSafeId(position))
  requireShape(typeof position_code === 'string')
  requireShape(isSafeId(permission))
  requireShape(typeof permission_code === 'string')
  requireShape(typeof permission_name === 'string')
  requireShape(typeof allowed === 'boolean')
  return { id, position, position_code, permission, permission_code, permission_name, allowed }
}

function validateUserPermissionOverride(value: unknown): UserPermissionOverrideDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, [
    'id', 'account', 'account_rut', 'permission', 'permission_code', 'resource', 'action',
    'allowed', 'reason', 'created_by', 'created_by_rut', 'created_at',
  ]))
  const {
    id,
    account,
    account_rut,
    permission,
    permission_code,
    resource,
    action,
    allowed,
    reason,
    created_by,
    created_by_rut,
    created_at,
  } = value
  requireShape(isSafeId(id))
  requireShape(isSafeId(account))
  requireShape(typeof account_rut === 'string')
  requireShape(permission === null || isSafeId(permission))
  requireShape(isNullableString(permission_code))
  requireShape(typeof resource === 'string')
  requireShape(typeof action === 'string')
  requireShape(typeof allowed === 'boolean')
  requireShape(typeof reason === 'string')
  requireShape(created_by === null || isSafeId(created_by))
  requireShape(isNullableString(created_by_rut))
  requireShape(typeof created_at === 'string')
  return {
    id,
    account,
    account_rut,
    permission,
    permission_code,
    resource,
    action,
    allowed,
    reason,
    created_by,
    created_by_rut,
    created_at,
  }
}

function validateAuthorizationCatalogRole(value: unknown): AuthorizationCatalogRoleDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['id', 'code', 'name', 'description', 'is_active']))
  const { id, code, name, description, is_active } = value
  requireShape(isSafeId(id))
  requireShape(typeof code === 'string')
  requireShape(typeof name === 'string')
  requireShape(typeof description === 'string')
  requireShape(typeof is_active === 'boolean')
  return { id, code, name, description, is_active }
}

function validateAuthorizationCatalogScope(value: unknown): AuthorizationCatalogScopeDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['id', 'code', 'name', 'description']))
  const { id, code, name, description } = value
  requireShape(isSafeId(id))
  requireShape(typeof code === 'string')
  requireShape(typeof name === 'string')
  requireShape(typeof description === 'string')
  return { id, code, name, description }
}

function validateAuthorizationCatalogResource(value: unknown): AuthorizationCatalogResourceDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['code', 'label']))
  const { code, label } = value
  requireShape(typeof code === 'string')
  requireShape(typeof label === 'string')
  return { code, label }
}

function validateAuthorizationCatalogAction(value: unknown): AuthorizationCatalogActionDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['code', 'label', 'description']))
  const { code, label, description } = value
  requireShape(typeof code === 'string')
  requireShape(typeof label === 'string')
  requireShape(typeof description === 'string')
  return { code, label, description }
}

function validateAuthorizationCatalog(value: unknown): AuthorizationCatalogDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['roles', 'scopes', 'resources', 'actions']))
  return {
    roles: validateArray(value.roles, validateAuthorizationCatalogRole),
    scopes: validateArray(value.scopes, validateAuthorizationCatalogScope),
    resources: validateArray(value.resources, validateAuthorizationCatalogResource),
    actions: validateArray(value.actions, validateAuthorizationCatalogAction),
  }
}

function validateRoleCategoryRole(value: unknown): RoleCategoryRoleDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['code', 'name', 'description']))
  const { code, name, description } = value
  requireShape(typeof code === 'string')
  requireShape(typeof name === 'string')
  requireShape(typeof description === 'string')
  return { code, name, description }
}

function validateRoleCategory(value: unknown): RoleCategoryDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['code', 'label', 'roles']))
  const { code, label, roles } = value
  requireShape(typeof code === 'string')
  requireShape(typeof label === 'string')
  return { code, label, roles: validateArray(roles, validateRoleCategoryRole) }
}

function validateRoleCategories(value: unknown): RoleCategoriesDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['categories']))
  return { categories: validateArray(value.categories, validateRoleCategory) }
}

function validateUnitPersonnelUser(value: unknown): UnitPersonnelUserDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, [
    'id_usuario', 'rut', 'grado', 'nombre', 'apellido_paterno', 'apellido_materno',
  ]))
  const { id_usuario, rut, grado, nombre, apellido_paterno, apellido_materno } = value
  requireShape(isSafeId(id_usuario))
  requireShape(typeof rut === 'string')
  requireShape(typeof grado === 'string')
  requireShape(typeof nombre === 'string')
  requireShape(typeof apellido_paterno === 'string')
  requireShape(typeof apellido_materno === 'string')
  return { id_usuario, rut, grado, nombre, apellido_paterno, apellido_materno }
}

function validateUnitPersonnelAssignment(value: unknown): UnitPersonnelAssignmentDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, [
    'id', 'role_code', 'role_name', 'unit_code', 'unit_name', 'scope_code', 'is_primary',
  ]))
  const { id, role_code, role_name, unit_code, unit_name, scope_code, is_primary } = value
  requireShape(isSafeId(id))
  requireShape(isNullableString(role_code))
  requireShape(isNullableString(role_name))
  requireShape(isNullableString(unit_code))
  requireShape(isNullableString(unit_name))
  requireShape(isNullableString(scope_code))
  requireShape(typeof is_primary === 'boolean')
  return { id, role_code, role_name, unit_code, unit_name, scope_code, is_primary }
}

function validateUnitPersonnel(value: unknown): UnitPersonnelDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, [
    'user', 'unidad_personal_code', 'unidad_personal_name', 'assignments',
  ]))
  requireShape(isNullableString(value.unidad_personal_code))
  requireShape(isNullableString(value.unidad_personal_name))
  return {
    user: validateUnitPersonnelUser(value.user),
    unidad_personal_code: value.unidad_personal_code,
    unidad_personal_name: value.unidad_personal_name,
    assignments: validateArray(value.assignments, validateUnitPersonnelAssignment),
  }
}

function validateUnitPersonnelResponse(value: unknown): UnitPersonnelResponseDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['results']))
  return { results: validateArray(value.results, validateUnitPersonnel) }
}

function validateEligibleTargetUnit(value: unknown): EligibleTargetUnitDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['id', 'code', 'name']))
  const { id, code, name } = value
  requireShape(isSafeId(id))
  requireShape(typeof code === 'string')
  requireShape(typeof name === 'string')
  return { id, code, name }
}

function validateEligibleTargetUnits(value: unknown): EligibleTargetUnitsResponseDto {
  requireShape(isRecord(value))
  const results = value.results
  requireShape(isUnknownArray(results))

  if (Object.prototype.hasOwnProperty.call(value, 'reason')) {
    requireShape(hasExactKeys(value, ['results', 'reason']))
    requireShape(results.length === 0)
    const reason = value.reason
    requireShape(reason === ELIGIBLE_TARGET_UNIT_REASON.NO_ACCOUNT
      || reason === ELIGIBLE_TARGET_UNIT_REASON.NO_PERSONAL_UNIT)
    return { results: [], reason }
  }

  requireShape(hasExactKeys(value, ['results', 'unidad_personal_code']))
  const unitCode = value.unidad_personal_code
  requireShape(typeof unitCode === 'string')
  return {
    results: results.map((item) => validateEligibleTargetUnit(item)),
    unidad_personal_code: unitCode,
  }
}

function validateAuditLogEntry(value: unknown): AuditLogEntryDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, [
    'created_at', 'endpoint', 'action', 'allowed', 'reason',
    'organization_unit_code', 'user_id_value',
  ]))
  const {
    created_at,
    endpoint,
    action,
    allowed,
    reason,
    organization_unit_code,
    user_id_value,
  } = value
  requireShape(typeof created_at === 'string')
  requireShape(typeof endpoint === 'string')
  requireShape(typeof action === 'string')
  requireShape(typeof allowed === 'boolean')
  requireShape(typeof reason === 'string')
  requireShape(isNullableString(organization_unit_code))
  requireShape(isNullableInteger(user_id_value))
  return {
    created_at,
    endpoint,
    action,
    allowed,
    reason,
    organization_unit_code,
    user_id_value,
  }
}

function validateAuditLog(value: unknown): AuditLogResponseDto {
  requireShape(isRecord(value))
  requireShape(hasExactKeys(value, ['count', 'results']))
  requireShape(isCount(value.count))
  return {
    count: value.count,
    results: validateArray(value.results, validateAuditLogEntry),
  }
}

async function getJson<T>(
  path: string,
  connection: ApiConnection,
  validate: (value: unknown) => T,
): Promise<T> {
  const tenantCode = requireConnection(connection)
  const response = await request(path, {
    method: 'GET',
    tenantCode,
    unitCode: connection.unitCode,
    signal: connection.signal,
  })

  if (response.status !== 200) {
    throw new AuthorizationApiError(AUTHORIZATION_API_ERROR_KIND.SCHEMA, response.status)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new AuthorizationApiError(AUTHORIZATION_API_ERROR_KIND.SCHEMA, response.status)
  }
  return validate(payload)
}

async function sendJson<T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH',
  body: unknown,
  expectedStatus: number,
  connection: ApiConnection,
  validate: (value: unknown) => T,
): Promise<T> {
  const tenantCode = requireConnection(connection)
  const response = await request(path, {
    method,
    body,
    tenantCode,
    unitCode: connection.unitCode,
    signal: connection.signal,
    requireCsrf: true,
  })

  if (response.status !== expectedStatus) {
    throw new AuthorizationApiError(AUTHORIZATION_API_ERROR_KIND.SCHEMA, response.status)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new AuthorizationApiError(AUTHORIZATION_API_ERROR_KIND.SCHEMA, response.status)
  }
  return validate(payload)
}

async function delete204(path: string, connection: ApiConnection): Promise<void> {
  const tenantCode = requireConnection(connection)
  const response = await request(path, {
    method: 'DELETE',
    tenantCode,
    unitCode: connection.unitCode,
    signal: connection.signal,
    requireCsrf: true,
  })
  if (response.status !== 204) {
    throw new AuthorizationApiError(AUTHORIZATION_API_ERROR_KIND.SCHEMA, response.status)
  }
}

function requireSafeId(id: number): void {
  if (!isSafeId(id)) {
    throw new AuthorizationApiError(AUTHORIZATION_API_ERROR_KIND.CONFIGURATION)
  }
}

function itemPath(collection: string, id: number): string {
  requireSafeId(id)
  return `${collection}${id}/`
}

export function listRoles(connection: ApiConnection): Promise<RoleDto[]> {
  return getJson('/authz/roles/', connection, (value) => validateArray(value, validateRole))
}

export function getRole(id: number, connection: ApiConnection): Promise<RoleDto> {
  return getJson(itemPath('/authz/roles/', id), connection, validateRole)
}

export function createRole(
  body: CreateRoleRequest,
  connection: ApiConnection,
): Promise<RoleDto> {
  return sendJson('/authz/roles/', 'POST', body, 201, connection, validateRole)
}

export function replaceRole(
  id: number,
  body: ReplaceRoleRequest,
  connection: ApiConnection,
): Promise<RoleDto> {
  return sendJson(itemPath('/authz/roles/', id), 'PUT', body, 200, connection, validateRole)
}

export function patchRole(
  id: number,
  body: PatchRoleRequest,
  connection: ApiConnection,
): Promise<RoleDto> {
  return sendJson(itemPath('/authz/roles/', id), 'PATCH', body, 200, connection, validateRole)
}

export function deleteRole(id: number, connection: ApiConnection): Promise<void> {
  return delete204(itemPath('/authz/roles/', id), connection)
}

export function listScopes(connection: ApiConnection): Promise<ScopePolicyDto[]> {
  return getJson('/authz/scopes/', connection, (value) => validateArray(value, validateScopePolicy))
}

export function getScope(id: number, connection: ApiConnection): Promise<ScopePolicyDto> {
  return getJson(itemPath('/authz/scopes/', id), connection, validateScopePolicy)
}

export function listPermissions(connection: ApiConnection): Promise<PermissionDto[]> {
  return getJson('/authz/permissions/', connection, (value) => validateArray(value, validatePermission))
}

export function getPermission(id: number, connection: ApiConnection): Promise<PermissionDto> {
  return getJson(itemPath('/authz/permissions/', id), connection, validatePermission)
}

export function listRolePermissions(connection: ApiConnection): Promise<RolePermissionDto[]> {
  return getJson('/authz/role-permissions/', connection, (value) => validateArray(value, validateRolePermission))
}

export function getRolePermission(id: number, connection: ApiConnection): Promise<RolePermissionDto> {
  return getJson(itemPath('/authz/role-permissions/', id), connection, validateRolePermission)
}

export function createRolePermission(
  body: CreateRolePermissionRequest,
  connection: ApiConnection,
): Promise<RolePermissionDto> {
  return sendJson('/authz/role-permissions/', 'POST', body, 201, connection, validateRolePermission)
}

export function replaceRolePermission(
  id: number,
  body: ReplaceRolePermissionRequest,
  connection: ApiConnection,
): Promise<RolePermissionDto> {
  return sendJson(itemPath('/authz/role-permissions/', id), 'PUT', body, 200, connection, validateRolePermission)
}

export function patchRolePermission(
  id: number,
  body: PatchRolePermissionRequest,
  connection: ApiConnection,
): Promise<RolePermissionDto> {
  return sendJson(itemPath('/authz/role-permissions/', id), 'PATCH', body, 200, connection, validateRolePermission)
}

export function deleteRolePermission(id: number, connection: ApiConnection): Promise<void> {
  return delete204(itemPath('/authz/role-permissions/', id), connection)
}

export function listPositionPermissions(connection: ApiConnection): Promise<PositionPermissionDto[]> {
  return getJson('/authz/position-permissions/', connection, (value) => validateArray(value, validatePositionPermission))
}

export function getPositionPermission(id: number, connection: ApiConnection): Promise<PositionPermissionDto> {
  return getJson(itemPath('/authz/position-permissions/', id), connection, validatePositionPermission)
}

export function createPositionPermission(
  body: CreatePositionPermissionRequest,
  connection: ApiConnection,
): Promise<PositionPermissionDto> {
  return sendJson('/authz/position-permissions/', 'POST', body, 201, connection, validatePositionPermission)
}

export function replacePositionPermission(
  id: number,
  body: ReplacePositionPermissionRequest,
  connection: ApiConnection,
): Promise<PositionPermissionDto> {
  return sendJson(itemPath('/authz/position-permissions/', id), 'PUT', body, 200, connection, validatePositionPermission)
}

export function patchPositionPermission(
  id: number,
  body: PatchPositionPermissionRequest,
  connection: ApiConnection,
): Promise<PositionPermissionDto> {
  return sendJson(itemPath('/authz/position-permissions/', id), 'PATCH', body, 200, connection, validatePositionPermission)
}

export function deletePositionPermission(id: number, connection: ApiConnection): Promise<void> {
  return delete204(itemPath('/authz/position-permissions/', id), connection)
}

export function listOverrides(connection: ApiConnection): Promise<UserPermissionOverrideDto[]> {
  return getJson('/authz/overrides/', connection, (value) => validateArray(value, validateUserPermissionOverride))
}

export function getOverride(id: number, connection: ApiConnection): Promise<UserPermissionOverrideDto> {
  return getJson(itemPath('/authz/overrides/', id), connection, validateUserPermissionOverride)
}

export function createOverride(
  body: CreateUserPermissionOverrideRequest,
  connection: ApiConnection,
): Promise<UserPermissionOverrideDto> {
  return sendJson('/authz/overrides/', 'POST', body, 201, connection, validateUserPermissionOverride)
}

export function replaceOverride(
  id: number,
  body: ReplaceUserPermissionOverrideRequest,
  connection: ApiConnection,
): Promise<UserPermissionOverrideDto> {
  return sendJson(itemPath('/authz/overrides/', id), 'PUT', body, 200, connection, validateUserPermissionOverride)
}

export function patchOverride(
  id: number,
  body: PatchUserPermissionOverrideRequest,
  connection: ApiConnection,
): Promise<UserPermissionOverrideDto> {
  return sendJson(itemPath('/authz/overrides/', id), 'PATCH', body, 200, connection, validateUserPermissionOverride)
}

export function deleteOverride(id: number, connection: ApiConnection): Promise<void> {
  return delete204(itemPath('/authz/overrides/', id), connection)
}

export function getAuthorizationCatalog(connection: ApiConnection): Promise<AuthorizationCatalogDto> {
  return getJson('/authz/catalog/', connection, validateAuthorizationCatalog)
}

export function getRoleCategories(connection: ApiConnection): Promise<RoleCategoriesDto> {
  return getJson('/authz/role-categories/', connection, validateRoleCategories)
}

export function getPeopleByUnit(
  unitCode: string,
  connection: ApiConnection,
  includeDescendants = false,
): Promise<UnitPersonnelResponseDto> {
  if (typeof unitCode !== 'string' || !unitCode.trim()) {
    throw new AuthorizationApiError(AUTHORIZATION_API_ERROR_KIND.CONFIGURATION)
  }
  if (typeof includeDescendants !== 'boolean') {
    throw new AuthorizationApiError(AUTHORIZATION_API_ERROR_KIND.CONFIGURATION)
  }
  const query = new URLSearchParams({ unit_code: unitCode })
  if (includeDescendants === true) query.set('include_descendants', 'true')
  return getJson(`/authz/personas-por-unidad/?${query.toString()}`, connection, validateUnitPersonnelResponse)
}

export function getEligibleTargetUnits(
  userId: number,
  connection: ApiConnection,
): Promise<EligibleTargetUnitsResponseDto> {
  requireSafeId(userId)
  const query = new URLSearchParams({ user_id: String(userId) })
  return getJson(`/authz/eligible-target-units/?${query.toString()}`, connection, validateEligibleTargetUnits)
}

export function getAuditLog(
  connection: ApiConnection,
  limit = 100,
): Promise<AuditLogResponseDto> {
  if (!isCount(limit)) {
    throw new AuthorizationApiError(AUTHORIZATION_API_ERROR_KIND.CONFIGURATION)
  }
  const boundedLimit = Math.min(limit, 500)
  const query = new URLSearchParams({ limit: String(boundedLimit) })
  return getJson(`/auth/audit-log/?${query.toString()}`, connection, validateAuditLog)
}
