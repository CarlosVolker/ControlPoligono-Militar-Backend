import { request } from '../../api/http'
import type { ApiConnection } from '../../types/dashboard'
import { TIPO_ARMA_CHOICES, type ArmaTypeCode } from '../armory/api'

const API_PATH = {
  EXERCISES: '/ejercicios/',
  MUNITION_CONSUMPTIONS: '/consumos-municion/',
  WEAPON_CONSUMPTIONS: '/consumos-arma/',
} as const

const EXERCISE_TYPE_CODES = {
  ASSAULT: 'asalto',
  DEFENSE: 'defensa',
  MOVEMENT: 'movimiento',
  MIXED: 'mixto',
  OTHER: 'otro',
  UNSPECIFIED: '',
} as const

export type ExerciseTypeCode = (typeof EXERCISE_TYPE_CODES)[keyof typeof EXERCISE_TYPE_CODES]

export const TIPO_EJERCICIO_CHOICES = [
  [EXERCISE_TYPE_CODES.ASSAULT, 'Asalto'],
  [EXERCISE_TYPE_CODES.DEFENSE, 'Defensa'],
  [EXERCISE_TYPE_CODES.MOVEMENT, 'Movimiento'],
  [EXERCISE_TYPE_CODES.MIXED, 'Mixto'],
  [EXERCISE_TYPE_CODES.OTHER, 'Otro'],
] as const

export interface ExerciseDTO {
  readonly id_ejercicio: number
  readonly tenant: number | null
  readonly organization_unit: number | null
  readonly nombre: string
  readonly fecha: string
  readonly zona: string
  readonly tipo_ejercicio: ExerciseTypeCode
  readonly numero_orden: string | null
  readonly fecha_orden: string | null
  readonly observaciones: string
  readonly unidades_participantes_codes: readonly string[]
  readonly created_at: string
}

interface ExerciseOptionalWriteFields {
  zona?: string
  tipo_ejercicio?: ExerciseTypeCode
  numero_orden?: string | null
  fecha_orden?: string | null
  observaciones?: string
  unidades_participantes_codes_write?: string[]
}

export interface CreateExerciseBody extends ExerciseOptionalWriteFields {
  nombre: string
  fecha: string
}

export interface ReplaceExerciseBody extends CreateExerciseBody {}

export interface PatchExerciseBody extends ExerciseOptionalWriteFields {
  nombre?: string
  fecha?: string
}

interface ExerciseWritePayload {
  nombre?: string
  fecha?: string
  zona?: string
  tipo_ejercicio?: ExerciseTypeCode
  numero_orden?: string | null
  fecha_orden?: string | null
  observaciones?: string
  unidades_participantes_codes_write?: string[]
}

export interface MunitionConsumptionDTO {
  readonly id_consumo: number
  readonly ejercicio: number
  readonly tipo_arma: ArmaTypeCode
  readonly modelo_arma: string
  readonly calibre_code: string
  readonly cantidad_armas: number | null
  readonly cantidad_tiros: number
  readonly es_aproximado: boolean
  readonly observaciones: string
}

interface MunitionConsumptionOptionalWriteFields {
  modelo_arma?: string
  calibre_code_write?: string | null
  cantidad_armas?: number | null
  es_aproximado?: boolean
  observaciones?: string
}

export interface CreateMunitionConsumptionBody extends MunitionConsumptionOptionalWriteFields {
  ejercicio: number
  tipo_arma: ArmaTypeCode
  cantidad_tiros: number
}

export interface ReplaceMunitionConsumptionBody extends CreateMunitionConsumptionBody {}

export interface PatchMunitionConsumptionBody extends MunitionConsumptionOptionalWriteFields {
  ejercicio?: number
  tipo_arma?: ArmaTypeCode
  cantidad_tiros?: number
}

interface MunitionConsumptionWritePayload {
  ejercicio?: number
  tipo_arma?: ArmaTypeCode
  modelo_arma?: string
  calibre_code_write?: string | null
  cantidad_armas?: number | null
  cantidad_tiros?: number
  es_aproximado?: boolean
  observaciones?: string
}

export interface WeaponConsumptionDTO {
  readonly id_consumo_arma: number
  readonly consumo: number
  readonly arma: number
  readonly cantidad_tiros: number
  readonly observaciones: string
}

interface WeaponConsumptionOptionalWriteFields {
  observaciones?: string
}

export interface CreateWeaponConsumptionBody extends WeaponConsumptionOptionalWriteFields {
  consumo: number
  arma: number
  cantidad_tiros: number
}

export interface ReplaceWeaponConsumptionBody extends CreateWeaponConsumptionBody {}

export interface PatchWeaponConsumptionBody extends WeaponConsumptionOptionalWriteFields {
  consumo?: number
  arma?: number
  cantidad_tiros?: number
}

interface WeaponConsumptionWritePayload {
  consumo?: number
  arma?: number
  cantidad_tiros?: number
  observaciones?: string
}

type JsonValidator<T> = (value: unknown) => T
type JsonMethod = 'GET' | 'POST' | 'PUT' | 'PATCH'

export class ExercisesApiResponseError extends Error {
  readonly kind = 'schema' as const
  readonly status: number
  readonly detail: string | null
  readonly payload: unknown
  readonly retryAfter: string | null

  constructor(status: number, detail: string | null, payload: unknown, retryAfter: string | null) {
    super('La respuesta del servidor no cumple el contrato de ejercicios y consumos.')
    this.name = 'ExercisesApiResponseError'
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
  if (!condition) throw new Error('Respuesta fuera del contrato de ejercicios y consumos.')
}

function hasFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every((field) => Object.prototype.hasOwnProperty.call(value, field))
}

function isPositiveId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isNullableId(value: unknown): value is number | null {
  return value === null || isPositiveId(value)
}

function isNullableCount(value: unknown): value is number | null {
  return value === null || isNonNegativeInteger(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

function isDateTime(value: unknown): value is string {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value))
}

function isExerciseTypeCode(value: unknown): value is ExerciseTypeCode {
  return typeof value === 'string'
    && Object.values(EXERCISE_TYPE_CODES).some((code) => code === value)
}

function isArmaTypeCode(value: unknown): value is ArmaTypeCode {
  return typeof value === 'string' && TIPO_ARMA_CHOICES.some(([code]) => code === value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function validateExercise(value: unknown): ExerciseDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, [
    'id_ejercicio', 'tenant', 'organization_unit', 'nombre', 'fecha', 'zona',
    'tipo_ejercicio', 'numero_orden', 'fecha_orden', 'observaciones',
    'unidades_participantes_codes', 'created_at',
  ]))

  const id = value.id_ejercicio
  const tenant = value.tenant
  const organizationUnit = value.organization_unit
  const name = value.nombre
  const date = value.fecha
  const zone = value.zona
  const exerciseType = value.tipo_ejercicio
  const orderNumber = value.numero_orden
  const orderDate = value.fecha_orden
  const observations = value.observaciones
  const participantCodes = value.unidades_participantes_codes
  const createdAt = value.created_at

  requireShape(isPositiveId(id))
  requireShape(isNullableId(tenant))
  requireShape(isNullableId(organizationUnit))
  requireShape(typeof name === 'string')
  requireShape(isCalendarDate(date))
  requireShape(typeof zone === 'string')
  requireShape(isExerciseTypeCode(exerciseType))
  requireShape(isNullableString(orderNumber))
  requireShape(orderDate === null || isCalendarDate(orderDate))
  requireShape(typeof observations === 'string')
  requireShape(isStringArray(participantCodes))
  requireShape(isDateTime(createdAt))

  return {
    id_ejercicio: id,
    tenant,
    organization_unit: organizationUnit,
    nombre: name,
    fecha: date,
    zona: zone,
    tipo_ejercicio: exerciseType,
    numero_orden: orderNumber,
    fecha_orden: orderDate,
    observaciones: observations,
    unidades_participantes_codes: participantCodes,
    created_at: createdAt,
  }
}

function validateExercises(value: unknown): ExerciseDTO[] {
  requireShape(isUnknownArray(value))
  return value.map((item) => validateExercise(item))
}

function validateMunitionConsumption(value: unknown): MunitionConsumptionDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, [
    'id_consumo', 'ejercicio', 'tipo_arma', 'modelo_arma', 'calibre_code',
    'cantidad_armas', 'cantidad_tiros', 'es_aproximado', 'observaciones',
  ]))

  const id = value.id_consumo
  const exerciseId = value.ejercicio
  const weaponType = value.tipo_arma
  const weaponModel = value.modelo_arma
  const calibreCode = value.calibre_code
  const weaponCount = value.cantidad_armas
  const shotCount = value.cantidad_tiros
  const approximate = value.es_aproximado
  const observations = value.observaciones

  requireShape(isPositiveId(id))
  requireShape(isPositiveId(exerciseId))
  requireShape(isArmaTypeCode(weaponType))
  requireShape(typeof weaponModel === 'string')
  requireShape(typeof calibreCode === 'string')
  requireShape(isNullableCount(weaponCount))
  requireShape(isNonNegativeInteger(shotCount))
  requireShape(typeof approximate === 'boolean')
  requireShape(typeof observations === 'string')

  return {
    id_consumo: id,
    ejercicio: exerciseId,
    tipo_arma: weaponType,
    modelo_arma: weaponModel,
    calibre_code: calibreCode,
    cantidad_armas: weaponCount,
    cantidad_tiros: shotCount,
    es_aproximado: approximate,
    observaciones: observations,
  }
}

function validateMunitionConsumptions(value: unknown): MunitionConsumptionDTO[] {
  requireShape(isUnknownArray(value))
  return value.map((item) => validateMunitionConsumption(item))
}

function validateWeaponConsumption(value: unknown): WeaponConsumptionDTO {
  requireShape(isRecord(value))
  requireShape(hasFields(value, [
    'id_consumo_arma', 'consumo', 'arma', 'cantidad_tiros', 'observaciones',
  ]))

  const id = value.id_consumo_arma
  const munitionConsumptionId = value.consumo
  const weaponId = value.arma
  const shotCount = value.cantidad_tiros
  const observations = value.observaciones

  requireShape(isPositiveId(id))
  requireShape(isPositiveId(munitionConsumptionId))
  requireShape(isPositiveId(weaponId))
  requireShape(isNonNegativeInteger(shotCount))
  requireShape(typeof observations === 'string')

  return {
    id_consumo_arma: id,
    consumo: munitionConsumptionId,
    arma: weaponId,
    cantidad_tiros: shotCount,
    observaciones: observations,
  }
}

function validateWeaponConsumptions(value: unknown): WeaponConsumptionDTO[] {
  requireShape(isUnknownArray(value))
  return value.map((item) => validateWeaponConsumption(item))
}

function extractDetail(value: unknown): string | null {
  return isRecord(value) && typeof value.detail === 'string' ? value.detail : null
}

function responseError(response: Response, payload: unknown): ExercisesApiResponseError {
  return new ExercisesApiResponseError(
    response.status,
    extractDetail(payload),
    payload,
    response.headers.get('Retry-After'),
  )
}

async function responsePayload(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

async function readJsonResponse<T>(
  response: Response,
  expectedStatus: number,
  validate: JsonValidator<T>,
): Promise<T> {
  const payload = await responsePayload(response)
  if (response.status !== expectedStatus) throw responseError(response, payload)

  try {
    return validate(payload)
  } catch {
    throw responseError(response, payload)
  }
}

function requireId(id: unknown): asserts id is number {
  if (!isPositiveId(id)) throw new TypeError('El identificador debe ser un entero positivo.')
}

function requireTenant(connection: ApiConnection): string {
  const tenantCode = connection.tenantCode.trim()
  if (!tenantCode) throw new TypeError('La solicitud requiere un tenant activo.')
  return tenantCode
}

function requireNonEmptyText(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${field} debe contener texto.`)
  }
}

function requireText(value: unknown, field: string): void {
  if (typeof value !== 'string') throw new TypeError(`${field} debe ser texto.`)
}

function requireCalendarDate(value: unknown, field: string): asserts value is string {
  if (!isCalendarDate(value)) throw new TypeError(`${field} debe ser una fecha válida YYYY-MM-DD.`)
}

function requireExerciseTypeCode(value: unknown): asserts value is ExerciseTypeCode {
  if (!isExerciseTypeCode(value)) throw new TypeError('tipo_ejercicio no pertenece al catálogo del backend.')
}

function requireArmaTypeCode(value: unknown): asserts value is ArmaTypeCode {
  if (!isArmaTypeCode(value)) throw new TypeError('tipo_arma no pertenece al catálogo de armería.')
}

function requireCount(value: unknown, field: string): asserts value is number {
  if (!isNonNegativeInteger(value)) throw new TypeError(`${field} debe ser un entero no negativo.`)
}

function requireNullableCount(value: unknown, field: string): asserts value is number | null {
  if (!isNullableCount(value)) throw new TypeError(`${field} debe ser un entero no negativo o null.`)
}

function requireExerciseWriteBody(
  body: CreateExerciseBody | ReplaceExerciseBody | PatchExerciseBody,
  method: Exclude<JsonMethod, 'GET'>,
): void {
  if (method !== 'PATCH' || body.nombre !== undefined) {
    if (body.nombre !== undefined) requireNonEmptyText(body.nombre, 'nombre')
    else if (method !== 'PATCH') requireNonEmptyText(body.nombre, 'nombre')
  }
  if (method !== 'PATCH' || body.fecha !== undefined) {
    if (body.fecha !== undefined) requireCalendarDate(body.fecha, 'fecha')
    else if (method !== 'PATCH') requireCalendarDate(body.fecha, 'fecha')
  }
  if (body.zona !== undefined) requireText(body.zona, 'zona')
  if (body.tipo_ejercicio !== undefined) requireExerciseTypeCode(body.tipo_ejercicio)
  if (body.numero_orden !== undefined && body.numero_orden !== null) {
    requireText(body.numero_orden, 'numero_orden')
  }
  if (body.fecha_orden !== undefined && body.fecha_orden !== null) {
    requireCalendarDate(body.fecha_orden, 'fecha_orden')
  }
  if (body.observaciones !== undefined) requireText(body.observaciones, 'observaciones')
  if (body.unidades_participantes_codes_write !== undefined) {
    for (const code of body.unidades_participantes_codes_write) {
      requireNonEmptyText(code, 'unidades_participantes_codes_write')
    }
  }
}

function exerciseWritePayload(
  body: CreateExerciseBody | ReplaceExerciseBody | PatchExerciseBody,
  method: Exclude<JsonMethod, 'GET'>,
): ExerciseWritePayload {
  requireExerciseWriteBody(body, method)
  const selected: ExerciseWritePayload = {}
  if (body.nombre !== undefined) selected.nombre = body.nombre
  if (body.fecha !== undefined) selected.fecha = body.fecha
  if (body.zona !== undefined) selected.zona = body.zona
  if (body.tipo_ejercicio !== undefined) selected.tipo_ejercicio = body.tipo_ejercicio
  if (body.numero_orden !== undefined) selected.numero_orden = body.numero_orden
  if (body.fecha_orden !== undefined) selected.fecha_orden = body.fecha_orden
  if (body.observaciones !== undefined) selected.observaciones = body.observaciones
  if (body.unidades_participantes_codes_write !== undefined) {
    selected.unidades_participantes_codes_write = body.unidades_participantes_codes_write
  }
  return selected
}

function requireMunitionConsumptionWriteBody(
  body: CreateMunitionConsumptionBody | ReplaceMunitionConsumptionBody | PatchMunitionConsumptionBody,
  method: Exclude<JsonMethod, 'GET'>,
): void {
  if (body.ejercicio !== undefined) requireId(body.ejercicio)
  else if (method !== 'PATCH') requireId(body.ejercicio)
  if (body.tipo_arma !== undefined) requireArmaTypeCode(body.tipo_arma)
  else if (method !== 'PATCH') requireArmaTypeCode(body.tipo_arma)
  if (body.cantidad_tiros !== undefined) requireCount(body.cantidad_tiros, 'cantidad_tiros')
  else if (method !== 'PATCH') requireCount(body.cantidad_tiros, 'cantidad_tiros')
  if (body.modelo_arma !== undefined) requireText(body.modelo_arma, 'modelo_arma')
  if (body.calibre_code_write !== undefined && body.calibre_code_write !== null) {
    requireNonEmptyText(body.calibre_code_write, 'calibre_code_write')
  }
  if (body.cantidad_armas !== undefined) requireNullableCount(body.cantidad_armas, 'cantidad_armas')
  if (body.es_aproximado !== undefined && typeof body.es_aproximado !== 'boolean') {
    throw new TypeError('es_aproximado debe ser boolean.')
  }
  if (body.observaciones !== undefined) requireText(body.observaciones, 'observaciones')
}

function munitionConsumptionWritePayload(
  body: CreateMunitionConsumptionBody | ReplaceMunitionConsumptionBody | PatchMunitionConsumptionBody,
  method: Exclude<JsonMethod, 'GET'>,
): MunitionConsumptionWritePayload {
  requireMunitionConsumptionWriteBody(body, method)
  const selected: MunitionConsumptionWritePayload = {}
  if (body.ejercicio !== undefined) selected.ejercicio = body.ejercicio
  if (body.tipo_arma !== undefined) selected.tipo_arma = body.tipo_arma
  if (body.modelo_arma !== undefined) selected.modelo_arma = body.modelo_arma
  if (body.calibre_code_write !== undefined) selected.calibre_code_write = body.calibre_code_write
  if (body.cantidad_armas !== undefined) selected.cantidad_armas = body.cantidad_armas
  if (body.cantidad_tiros !== undefined) selected.cantidad_tiros = body.cantidad_tiros
  if (body.es_aproximado !== undefined) selected.es_aproximado = body.es_aproximado
  if (body.observaciones !== undefined) selected.observaciones = body.observaciones
  return selected
}

function requireWeaponConsumptionWriteBody(
  body: CreateWeaponConsumptionBody | ReplaceWeaponConsumptionBody | PatchWeaponConsumptionBody,
  method: Exclude<JsonMethod, 'GET'>,
): void {
  if (body.consumo !== undefined) requireId(body.consumo)
  else if (method !== 'PATCH') requireId(body.consumo)
  if (body.arma !== undefined) requireId(body.arma)
  else if (method !== 'PATCH') requireId(body.arma)
  if (body.cantidad_tiros !== undefined) requireCount(body.cantidad_tiros, 'cantidad_tiros')
  else if (method !== 'PATCH') requireCount(body.cantidad_tiros, 'cantidad_tiros')
  if (body.observaciones !== undefined) requireText(body.observaciones, 'observaciones')
}

function weaponConsumptionWritePayload(
  body: CreateWeaponConsumptionBody | ReplaceWeaponConsumptionBody | PatchWeaponConsumptionBody,
  method: Exclude<JsonMethod, 'GET'>,
): WeaponConsumptionWritePayload {
  requireWeaponConsumptionWriteBody(body, method)
  const selected: WeaponConsumptionWritePayload = {}
  if (body.consumo !== undefined) selected.consumo = body.consumo
  if (body.arma !== undefined) selected.arma = body.arma
  if (body.cantidad_tiros !== undefined) selected.cantidad_tiros = body.cantidad_tiros
  if (body.observaciones !== undefined) selected.observaciones = body.observaciones
  return selected
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

  if (response.status === 204) return
  throw responseError(response, await responsePayload(response))
}

function detailPath(collectionPath: string, id: number): string {
  requireId(id)
  return `${collectionPath}${id}/`
}

export function getExercises(connection: ApiConnection): Promise<ExerciseDTO[]> {
  return requestJson(API_PATH.EXERCISES, 'GET', connection, 200, validateExercises)
}

export function getExercise(id: number, connection: ApiConnection): Promise<ExerciseDTO> {
  return requestJson(
    detailPath(API_PATH.EXERCISES, id),
    'GET',
    connection,
    200,
    validateExercise,
  )
}

export function createExercise(
  body: CreateExerciseBody,
  connection: ApiConnection,
): Promise<ExerciseDTO> {
  return requestJson(
    API_PATH.EXERCISES,
    'POST',
    connection,
    201,
    validateExercise,
    exerciseWritePayload(body, 'POST'),
  )
}

export function replaceExercise(
  id: number,
  body: ReplaceExerciseBody,
  connection: ApiConnection,
): Promise<ExerciseDTO> {
  return requestJson(
    detailPath(API_PATH.EXERCISES, id),
    'PUT',
    connection,
    200,
    validateExercise,
    exerciseWritePayload(body, 'PUT'),
  )
}

export function patchExercise(
  id: number,
  body: PatchExerciseBody,
  connection: ApiConnection,
): Promise<ExerciseDTO> {
  return requestJson(
    detailPath(API_PATH.EXERCISES, id),
    'PATCH',
    connection,
    200,
    validateExercise,
    exerciseWritePayload(body, 'PATCH'),
  )
}

export function deleteExercise(id: number, connection: ApiConnection): Promise<void> {
  return requestDelete(detailPath(API_PATH.EXERCISES, id), connection)
}

export function getMunitionConsumptions(connection: ApiConnection): Promise<MunitionConsumptionDTO[]> {
  return requestJson(
    API_PATH.MUNITION_CONSUMPTIONS,
    'GET',
    connection,
    200,
    validateMunitionConsumptions,
  )
}

export async function getMunitionConsumptionsForExercise(
  exerciseId: number,
  connection: ApiConnection,
): Promise<MunitionConsumptionDTO[]> {
  requireId(exerciseId)
  return (await getMunitionConsumptions(connection))
    .filter((consumption) => consumption.ejercicio === exerciseId)
}

export function getMunitionConsumption(
  id: number,
  connection: ApiConnection,
): Promise<MunitionConsumptionDTO> {
  return requestJson(
    detailPath(API_PATH.MUNITION_CONSUMPTIONS, id),
    'GET',
    connection,
    200,
    validateMunitionConsumption,
  )
}

export function createMunitionConsumption(
  body: CreateMunitionConsumptionBody,
  connection: ApiConnection,
): Promise<MunitionConsumptionDTO> {
  return requestJson(
    API_PATH.MUNITION_CONSUMPTIONS,
    'POST',
    connection,
    201,
    validateMunitionConsumption,
    munitionConsumptionWritePayload(body, 'POST'),
  )
}

export function replaceMunitionConsumption(
  id: number,
  body: ReplaceMunitionConsumptionBody,
  connection: ApiConnection,
): Promise<MunitionConsumptionDTO> {
  return requestJson(
    detailPath(API_PATH.MUNITION_CONSUMPTIONS, id),
    'PUT',
    connection,
    200,
    validateMunitionConsumption,
    munitionConsumptionWritePayload(body, 'PUT'),
  )
}

export function patchMunitionConsumption(
  id: number,
  body: PatchMunitionConsumptionBody,
  connection: ApiConnection,
): Promise<MunitionConsumptionDTO> {
  return requestJson(
    detailPath(API_PATH.MUNITION_CONSUMPTIONS, id),
    'PATCH',
    connection,
    200,
    validateMunitionConsumption,
    munitionConsumptionWritePayload(body, 'PATCH'),
  )
}

export function deleteMunitionConsumption(id: number, connection: ApiConnection): Promise<void> {
  return requestDelete(detailPath(API_PATH.MUNITION_CONSUMPTIONS, id), connection)
}

export function getWeaponConsumptions(connection: ApiConnection): Promise<WeaponConsumptionDTO[]> {
  return requestJson(
    API_PATH.WEAPON_CONSUMPTIONS,
    'GET',
    connection,
    200,
    validateWeaponConsumptions,
  )
}

export async function getWeaponConsumptionsForMunitionConsumption(
  munitionConsumptionId: number,
  connection: ApiConnection,
): Promise<WeaponConsumptionDTO[]> {
  requireId(munitionConsumptionId)
  return (await getWeaponConsumptions(connection))
    .filter((consumption) => consumption.consumo === munitionConsumptionId)
}

export function getWeaponConsumption(
  id: number,
  connection: ApiConnection,
): Promise<WeaponConsumptionDTO> {
  return requestJson(
    detailPath(API_PATH.WEAPON_CONSUMPTIONS, id),
    'GET',
    connection,
    200,
    validateWeaponConsumption,
  )
}

export function createWeaponConsumption(
  body: CreateWeaponConsumptionBody,
  connection: ApiConnection,
): Promise<WeaponConsumptionDTO> {
  return requestJson(
    API_PATH.WEAPON_CONSUMPTIONS,
    'POST',
    connection,
    201,
    validateWeaponConsumption,
    weaponConsumptionWritePayload(body, 'POST'),
  )
}

export function replaceWeaponConsumption(
  id: number,
  body: ReplaceWeaponConsumptionBody,
  connection: ApiConnection,
): Promise<WeaponConsumptionDTO> {
  return requestJson(
    detailPath(API_PATH.WEAPON_CONSUMPTIONS, id),
    'PUT',
    connection,
    200,
    validateWeaponConsumption,
    weaponConsumptionWritePayload(body, 'PUT'),
  )
}

export function patchWeaponConsumption(
  id: number,
  body: PatchWeaponConsumptionBody,
  connection: ApiConnection,
): Promise<WeaponConsumptionDTO> {
  return requestJson(
    detailPath(API_PATH.WEAPON_CONSUMPTIONS, id),
    'PATCH',
    connection,
    200,
    validateWeaponConsumption,
    weaponConsumptionWritePayload(body, 'PATCH'),
  )
}

export function deleteWeaponConsumption(id: number, connection: ApiConnection): Promise<void> {
  return requestDelete(detailPath(API_PATH.WEAPON_CONSUMPTIONS, id), connection)
}
