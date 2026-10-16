import { request } from '../../api/http'
import type { ApiConnection } from '../../types/dashboard'

const API_PATH = {
  ARMORIES: '/armorias/',
  WEAPONS: '/armas/',
  CALIBERS: '/calibres/',
} as const

// Copio valores y etiquetas de apipoligono/models.py::TIPO_ARMA_CHOICES.
export const TIPO_ARMA_CHOICES = [
  ['fusil', 'Fusil de Asalto / Carabina'],
  ['subfusil', 'Subfusil'],
  ['pistola', 'Pistola'],
  ['francotirador', 'Fusil de Precisión / Francotirador'],
  ['ametralladora', 'Ametralladora'],
  ['apoyo', 'Armamento de Apoyo'],
] as const

export type ArmaTypeCode = (typeof TIPO_ARMA_CHOICES)[number][0]

export interface ArmoryDTO {
  readonly id: number
  readonly tenant: number
  readonly organization_unit: number
  readonly organization_unit_code: string
  readonly code: string
  readonly name: string
  readonly descripcion: string
  readonly is_active: boolean
  readonly created_at: string
  readonly updated_at: string
  readonly armas_count: number
}

export interface WeaponDTO {
  readonly id_arma: number
  readonly tenant: number | null
  // Conservo el FK sólo como dato de lectura; derivo el código de unidad desde armory.
  readonly organization_unit: number | null
  readonly armory: number | null
  readonly armory_code: string | null
  readonly armory_name: string | null
  readonly organization_unit_code: string | null
  readonly calibre_code: string | null
  readonly tipo_arma: ArmaTypeCode
  readonly modelo_arma: string
  readonly numero_serie: string
}

export interface CalibreDTO {
  readonly id_calibre: number
  readonly code: string
  readonly nombre: string
  readonly is_active: boolean
}

export interface CreateArmoryBody {
  code: string
  name: string
  descripcion?: string
  is_active?: boolean
  organization_unit_code_write?: string | null
}

export interface ReplaceArmoryBody {
  code: string
  name: string
  descripcion: string
  is_active: boolean
  organization_unit_code_write: string
}

export interface PatchArmoryBody {
  code?: string
  name?: string
  descripcion?: string
  is_active?: boolean
  organization_unit_code_write?: string | null
}

export interface CreateWeaponBody {
  tipo_arma: ArmaTypeCode
  modelo_arma: string
  numero_serie: string
  armory_code_write?: string | null
  calibre_code_write?: string | null
}

export interface ReplaceWeaponBody {
  tipo_arma: ArmaTypeCode
  modelo_arma: string
  numero_serie: string
  armory_code_write: string
  calibre_code_write: string | null
}

export interface PatchWeaponBody {
  tipo_arma?: ArmaTypeCode
  modelo_arma?: string
  numero_serie?: string
  armory_code_write?: string | null
  calibre_code_write?: string | null
}

export interface CreateCalibreBody {
  code: string
  nombre: string
  is_active?: boolean
}

export interface ReplaceCalibreBody {
  code: string
  nombre: string
  is_active: boolean
}

export interface PatchCalibreBody {
  code?: string
  nombre?: string
  is_active?: boolean
}

interface ArmoryWriteBody {
  code?: string
  name?: string
  descripcion?: string
  is_active?: boolean
  organization_unit_code_write?: string | null
}

interface WeaponWriteBody {
  tipo_arma?: ArmaTypeCode
  modelo_arma?: string
  numero_serie?: string
  armory_code_write?: string | null
  calibre_code_write?: string | null
}

interface CalibreWriteBody {
  code?: string
  nombre?: string
  is_active?: boolean
}

type JsonValidator<T> = (value: unknown) => T
type JsonMethod = 'GET' | 'POST' | 'PUT' | 'PATCH'

export class ArmoryApiResponseError extends Error {
  readonly kind = 'schema' as const
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
    super('La respuesta del servidor no cumple el contrato de armería esperado.')
    this.name = 'ArmoryApiResponseError'
    this.status = status
    this.detail = detail
    this.payload = payload
    this.retryAfter = retryAfter
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function requireShape(condition: unknown): asserts condition {
  if (!condition) throw new Error('Respuesta fuera del contrato de armería.')
}

function hasFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every((field) => Object.prototype.hasOwnProperty.call(value, field))
}

function isPositiveId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function isNullableId(value: unknown): value is number | null {
  return value === null || isPositiveId(value)
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isDateTime(value: unknown): value is string {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value))
}

function isArmaTypeCode(value: unknown): value is ArmaTypeCode {
  return typeof value === 'string' && TIPO_ARMA_CHOICES.some(([code]) => code === value)
}

function validateArmory(value: unknown): ArmoryDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, [
    'id', 'tenant', 'organization_unit', 'organization_unit_code', 'code', 'name',
    'descripcion', 'is_active', 'created_at', 'updated_at', 'armas_count',
  ]))

  const id = value.id
  const tenant = value.tenant
  const organizationUnit = value.organization_unit
  const organizationUnitCode = value.organization_unit_code
  const code = value.code
  const name = value.name
  const description = value.descripcion
  const isActive = value.is_active
  const createdAt = value.created_at
  const updatedAt = value.updated_at
  const weaponsCount = value.armas_count

  requireShape(isPositiveId(id))
  requireShape(isPositiveId(tenant))
  requireShape(isPositiveId(organizationUnit))
  requireShape(typeof organizationUnitCode === 'string')
  requireShape(typeof code === 'string')
  requireShape(typeof name === 'string')
  requireShape(typeof description === 'string')
  requireShape(typeof isActive === 'boolean')
  requireShape(isDateTime(createdAt))
  requireShape(isDateTime(updatedAt))
  requireShape(isCount(weaponsCount))

  return {
    id,
    tenant,
    organization_unit: organizationUnit,
    organization_unit_code: organizationUnitCode,
    code,
    name,
    descripcion: description,
    is_active: isActive,
    created_at: createdAt,
    updated_at: updatedAt,
    armas_count: weaponsCount,
  }
}

function validateArmories(value: unknown): ArmoryDTO[] {
  requireShape(isUnknownArray(value))
  return value.map((item) => validateArmory(item))
}

function validateWeapon(value: unknown): WeaponDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, [
    'id_arma', 'tenant', 'organization_unit', 'armory', 'armory_code', 'armory_name',
    'organization_unit_code', 'calibre_code', 'tipo_arma', 'modelo_arma', 'numero_serie',
  ]))

  const id = value.id_arma
  const tenant = value.tenant
  const organizationUnit = value.organization_unit
  const armory = value.armory
  const armoryCode = value.armory_code
  const armoryName = value.armory_name
  const organizationUnitCode = value.organization_unit_code
  const calibreCode = value.calibre_code
  const weaponType = value.tipo_arma
  const model = value.modelo_arma
  const serialNumber = value.numero_serie

  requireShape(isPositiveId(id))
  requireShape(isNullableId(tenant))
  requireShape(isNullableId(organizationUnit))
  requireShape(isNullableId(armory))
  requireShape(isNullableString(armoryCode))
  requireShape(isNullableString(armoryName))
  requireShape(isNullableString(organizationUnitCode))
  requireShape(isNullableString(calibreCode))
  requireShape(isArmaTypeCode(weaponType))
  requireShape(typeof model === 'string')
  requireShape(typeof serialNumber === 'string')

  return {
    id_arma: id,
    tenant,
    organization_unit: organizationUnit,
    armory,
    armory_code: armoryCode,
    armory_name: armoryName,
    organization_unit_code: organizationUnitCode,
    calibre_code: calibreCode,
    tipo_arma: weaponType,
    modelo_arma: model,
    numero_serie: serialNumber,
  }
}

function validateWeapons(value: unknown): WeaponDTO[] {
  requireShape(isUnknownArray(value))
  return value.map((item) => validateWeapon(item))
}

function validateCalibre(value: unknown): CalibreDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, ['id_calibre', 'code', 'nombre', 'is_active']))

  const id = value.id_calibre
  const code = value.code
  const name = value.nombre
  const isActive = value.is_active

  requireShape(isPositiveId(id))
  requireShape(typeof code === 'string')
  requireShape(typeof name === 'string')
  requireShape(typeof isActive === 'boolean')

  return { id_calibre: id, code, nombre: name, is_active: isActive }
}

function validateCalibres(value: unknown): CalibreDTO[] {
  requireShape(isUnknownArray(value))
  return value.map((item) => validateCalibre(item))
}

function extractDetail(value: unknown): string | null {
  return isRecord(value) && typeof value.detail === 'string' ? value.detail : null
}

function responseError(response: Response, payload: unknown): ArmoryApiResponseError {
  return new ArmoryApiResponseError(
    response.status,
    extractDetail(payload),
    payload,
    response.headers.get('Retry-After'),
  )
}

async function readJsonResponse<T>(
  response: Response,
  expectedStatus: number,
  validate: JsonValidator<T>,
): Promise<T> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw responseError(response, undefined)
  }

  if (response.status !== expectedStatus) throw responseError(response, payload)

  try {
    return validate(payload)
  } catch {
    throw responseError(response, payload)
  }
}

function requireId(id: number): void {
  if (!isPositiveId(id)) throw new TypeError('El identificador debe ser un entero positivo.')
}

function requireTenant(connection: ApiConnection): string {
  const tenantCode = connection.tenantCode.trim()
  if (!tenantCode) throw new TypeError('La solicitud requiere un tenant activo.')
  return tenantCode
}

async function requestJson<T>(
  path: string,
  method: JsonMethod,
  connection: ApiConnection,
  expectedStatus: number,
  validate: JsonValidator<T>,
  body?: unknown,
): Promise<T> {
  const response = await request(path, {
    method,
    tenantCode: requireTenant(connection),
    unitCode: connection.unitCode,
    signal: connection.signal,
    ...(method === 'GET' ? {} : { body, requireCsrf: true }),
  })
  return readJsonResponse(response, expectedStatus, validate)
}

async function requestDelete(path: string, connection: ApiConnection): Promise<void> {
  const response = await request(path, {
    method: 'DELETE',
    tenantCode: requireTenant(connection),
    unitCode: connection.unitCode,
    signal: connection.signal,
    requireCsrf: true,
  })

  if (response.status !== 204) throw responseError(response, undefined)
}

function armoryWriteBody(body: CreateArmoryBody | ReplaceArmoryBody | PatchArmoryBody): ArmoryWriteBody {
  const selected: ArmoryWriteBody = {}
  if (typeof body.code === 'string') selected.code = body.code
  if (typeof body.name === 'string') selected.name = body.name
  if (typeof body.descripcion === 'string') selected.descripcion = body.descripcion
  if (typeof body.is_active === 'boolean') selected.is_active = body.is_active
  if (body.organization_unit_code_write !== undefined) {
    selected.organization_unit_code_write = body.organization_unit_code_write
  }
  return selected
}

function weaponWriteBody(body: CreateWeaponBody | ReplaceWeaponBody | PatchWeaponBody): WeaponWriteBody {
  const selected: WeaponWriteBody = {}
  if (body.tipo_arma !== undefined) selected.tipo_arma = body.tipo_arma
  if (typeof body.modelo_arma === 'string') selected.modelo_arma = body.modelo_arma
  if (typeof body.numero_serie === 'string') selected.numero_serie = body.numero_serie
  if (body.armory_code_write !== undefined) selected.armory_code_write = body.armory_code_write
  if (body.calibre_code_write !== undefined) selected.calibre_code_write = body.calibre_code_write
  return selected
}

function calibreWriteBody(body: CreateCalibreBody | ReplaceCalibreBody | PatchCalibreBody): CalibreWriteBody {
  const selected: CalibreWriteBody = {}
  if (typeof body.code === 'string') selected.code = body.code
  if (typeof body.nombre === 'string') selected.nombre = body.nombre
  if (typeof body.is_active === 'boolean') selected.is_active = body.is_active
  return selected
}

export function getArmories(connection: ApiConnection): Promise<ArmoryDTO[]> {
  return requestJson(API_PATH.ARMORIES, 'GET', connection, 200, validateArmories)
}

export async function getActiveArmories(connection: ApiConnection): Promise<ArmoryDTO[]> {
  return (await getArmories(connection)).filter((armory) => armory.is_active)
}

export function getArmory(id: number, connection: ApiConnection): Promise<ArmoryDTO> {
  requireId(id)
  return requestJson(`${API_PATH.ARMORIES}${id}/`, 'GET', connection, 200, validateArmory)
}

export function createArmory(
  body: CreateArmoryBody,
  connection: ApiConnection,
): Promise<ArmoryDTO> {
  return requestJson(API_PATH.ARMORIES, 'POST', connection, 201, validateArmory, armoryWriteBody(body))
}

export function replaceArmory(
  id: number,
  body: ReplaceArmoryBody,
  connection: ApiConnection,
): Promise<ArmoryDTO> {
  requireId(id)
  return requestJson(
    `${API_PATH.ARMORIES}${id}/`,
    'PUT',
    connection,
    200,
    validateArmory,
    armoryWriteBody(body),
  )
}

export function patchArmory(
  id: number,
  body: PatchArmoryBody,
  connection: ApiConnection,
): Promise<ArmoryDTO> {
  requireId(id)
  return requestJson(
    `${API_PATH.ARMORIES}${id}/`,
    'PATCH',
    connection,
    200,
    validateArmory,
    armoryWriteBody(body),
  )
}

export function deleteArmory(id: number, connection: ApiConnection): Promise<void> {
  requireId(id)
  return requestDelete(`${API_PATH.ARMORIES}${id}/`, connection)
}

export function getWeapons(connection: ApiConnection): Promise<WeaponDTO[]> {
  return requestJson(API_PATH.WEAPONS, 'GET', connection, 200, validateWeapons)
}

export async function getWeaponsForArmory(
  armoryCode: string,
  connection: ApiConnection,
): Promise<WeaponDTO[]> {
  if (!armoryCode.trim()) throw new TypeError('El código de armería no puede estar vacío.')
  return (await getWeapons(connection)).filter((weapon) => weapon.armory_code === armoryCode)
}

export function getWeapon(id: number, connection: ApiConnection): Promise<WeaponDTO> {
  requireId(id)
  return requestJson(`${API_PATH.WEAPONS}${id}/`, 'GET', connection, 200, validateWeapon)
}

export function createWeapon(
  body: CreateWeaponBody,
  connection: ApiConnection,
): Promise<WeaponDTO> {
  return requestJson(API_PATH.WEAPONS, 'POST', connection, 201, validateWeapon, weaponWriteBody(body))
}

export function replaceWeapon(
  id: number,
  body: ReplaceWeaponBody,
  connection: ApiConnection,
): Promise<WeaponDTO> {
  requireId(id)
  return requestJson(
    `${API_PATH.WEAPONS}${id}/`,
    'PUT',
    connection,
    200,
    validateWeapon,
    weaponWriteBody(body),
  )
}

export function patchWeapon(
  id: number,
  body: PatchWeaponBody,
  connection: ApiConnection,
): Promise<WeaponDTO> {
  requireId(id)
  return requestJson(
    `${API_PATH.WEAPONS}${id}/`,
    'PATCH',
    connection,
    200,
    validateWeapon,
    weaponWriteBody(body),
  )
}

export function deleteWeapon(id: number, connection: ApiConnection): Promise<void> {
  requireId(id)
  return requestDelete(`${API_PATH.WEAPONS}${id}/`, connection)
}

export function getCalibres(connection: ApiConnection): Promise<CalibreDTO[]> {
  return requestJson(API_PATH.CALIBERS, 'GET', connection, 200, validateCalibres)
}

export async function getActiveCalibres(connection: ApiConnection): Promise<CalibreDTO[]> {
  return (await getCalibres(connection)).filter((calibre) => calibre.is_active)
}

export function getCalibre(id: number, connection: ApiConnection): Promise<CalibreDTO> {
  requireId(id)
  return requestJson(`${API_PATH.CALIBERS}${id}/`, 'GET', connection, 200, validateCalibre)
}

export function createCalibre(
  body: CreateCalibreBody,
  connection: ApiConnection,
): Promise<CalibreDTO> {
  return requestJson(
    API_PATH.CALIBERS,
    'POST',
    connection,
    201,
    validateCalibre,
    calibreWriteBody(body),
  )
}

export function replaceCalibre(
  id: number,
  body: ReplaceCalibreBody,
  connection: ApiConnection,
): Promise<CalibreDTO> {
  requireId(id)
  return requestJson(
    `${API_PATH.CALIBERS}${id}/`,
    'PUT',
    connection,
    200,
    validateCalibre,
    calibreWriteBody(body),
  )
}

export function patchCalibre(
  id: number,
  body: PatchCalibreBody,
  connection: ApiConnection,
): Promise<CalibreDTO> {
  requireId(id)
  return requestJson(
    `${API_PATH.CALIBERS}${id}/`,
    'PATCH',
    connection,
    200,
    validateCalibre,
    calibreWriteBody(body),
  )
}

export function deleteCalibre(id: number, connection: ApiConnection): Promise<void> {
  requireId(id)
  return requestDelete(`${API_PATH.CALIBERS}${id}/`, connection)
}
