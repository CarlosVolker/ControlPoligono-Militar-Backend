import { request } from '../../api/http'
import { getLessonSummary } from '../../api/dashboard'
import type { ApiConnection } from '../../types/dashboard'

const REQUEST_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const

const SHOOTING_TYPE = {
  EVALUATION: 'evaluacion',
  TRAINING: 'entrenamiento',
} as const

const SHOOTING_API_ERROR_KIND = {
  CONFIGURATION: 'configuration',
  SCHEMA: 'schema',
} as const

export type ShootingType = (typeof SHOOTING_TYPE)[keyof typeof SHOOTING_TYPE]
export type ShootingApiErrorKind =
  (typeof SHOOTING_API_ERROR_KIND)[keyof typeof SHOOTING_API_ERROR_KIND]

type JsonRequestMethod = Exclude<
  (typeof REQUEST_METHOD)[keyof typeof REQUEST_METHOD],
  typeof REQUEST_METHOD.DELETE
>

export interface ShootingApiErrorOptions {
  payload?: unknown
}

export class ShootingApiError extends Error {
  readonly kind: ShootingApiErrorKind
  readonly payload: unknown

  constructor(kind: ShootingApiErrorKind, options: ShootingApiErrorOptions = {}) {
    super(kind === SHOOTING_API_ERROR_KIND.CONFIGURATION
      ? 'Falta el contexto de tenant para consultar tiro.'
      : 'La respuesta de tiro no coincide con el contrato del servidor.')
    this.name = 'ShootingApiError'
    this.kind = kind
    this.payload = options.payload
  }
}

export interface ShootingPolygonDto {
  readonly id_poligono: number
  readonly tenant: number | null
  readonly organization_unit: number | null
  readonly nombre: string
  readonly ciudad: string
  readonly carriles_maximos: number
  readonly distancia_maxima: number
}

export interface ShootingPolygonWrite {
  readonly nombre: string
  readonly ciudad: string
  readonly carriles_maximos: number
  readonly distancia_maxima: number
}

export interface ShootingLessonDto {
  readonly id_leccion: number
  readonly tenant: number | null
  readonly organization_unit: number | null
  readonly id_poligono: number
  readonly fecha_tiro: string
  readonly numero_orden: string | null
  readonly fecha_orden: string | null
  readonly tipo_tiro: string | null
  readonly cant_tiros_cereo: number
  readonly cant_tiros_leccion: number
  readonly distancia: number
  readonly unidades_participantes_codes: readonly string[]
}

export interface ShootingLessonWrite {
  readonly id_poligono: number
  readonly fecha_tiro: string
  readonly numero_orden?: string | null
  readonly fecha_orden?: string | null
  readonly tipo_tiro?: ShootingType | null
  readonly cant_tiros_cereo: number
  readonly cant_tiros_leccion: number
  readonly distancia: number
  readonly unidades_participantes_codes_write?: readonly string[]
}

export interface ShootingFractionDto {
  readonly id_fraccion: number
  readonly tenant: number | null
  readonly organization_unit: number | null
  readonly id_leccion: number
  readonly tiradores_totales: number
  readonly numero_fraccion: number
}

export interface ShootingFractionWrite {
  readonly id_leccion: number
  readonly tiradores_totales: number
  readonly numero_fraccion: number
}

export interface ShootingAssignmentDto {
  readonly id: number
  readonly role_code: string | null
  readonly role_name: string | null
  readonly unit_code: string | null
  readonly scope_code: string | null
  readonly is_primary: boolean
}

export interface ShootingPrimaryAssignmentDto {
  readonly unit_code: string | null
  readonly role_code: string | null
  readonly scope_code: string | null
}

export interface ShootingUserDto {
  readonly id_usuario: number
  readonly rut: string
  readonly grado: string | null
  readonly nombre: string
  readonly apellido_paterno: string
  readonly apellido_materno: string
  readonly correo: string | null
  readonly habilitado: boolean
  readonly is_locked: boolean
  readonly must_change_password: boolean
  readonly password_changed_at: string | null
  readonly primary_assignment: ShootingPrimaryAssignmentDto | null
  readonly assignments: readonly ShootingAssignmentDto[]
}

export interface ShootingWeaponDto {
  readonly id_arma: number
  readonly tenant: number | null
  readonly organization_unit: number | null
  readonly armory: number | null
  readonly armory_code: string | null
  readonly armory_name: string | null
  readonly organization_unit_code: string | null
  readonly calibre_code: string | null
  readonly tipo_arma: string
  readonly modelo_arma: string
  readonly numero_serie: string
}

export interface ShootingResultDto {
  readonly id_resultado: number
  readonly tenant: number | null
  readonly organization_unit: number | null
  readonly id_fraccion: number
  readonly id_usuario: number
  readonly id_arma: number
  readonly tiros_acertados: number
  readonly total_tiros: number
  readonly numero_carril: number | null
}

export interface ShootingResultWrite {
  readonly id_fraccion: number
  readonly id_usuario: number
  readonly id_arma: number
  readonly tiros_acertados: number
  readonly total_tiros: number
  readonly numero_carril?: number | null
}

export interface FractionCaptureOptionsDto {
  readonly usuarios: readonly ShootingUserDto[]
  readonly armas: readonly ShootingWeaponDto[]
}

export interface ShootingFractionResultDto {
  readonly resultado: ShootingResultDto
  readonly usuario: ShootingUserDto
  readonly arma: ShootingWeaponDto
}

export interface LessonDetailedResultDto {
  readonly RUT: string
  readonly Grado: string | null
  readonly Apellido_paterno: string
  readonly Apellido_materno: string
  readonly Nombre: string
  readonly Unidad: string
  readonly 'Tipo Arma': string
  readonly 'Modelo de Arma': string
  readonly 'Número de Serie': string
  readonly Carril: number | null
  readonly 'Tiros Acertados': number
  readonly 'Total Tiros': number
}

export interface LessonReportLessonDto {
  readonly id_leccion: number
  readonly fecha_tiro: string
  readonly tipo_tiro: string | null
  readonly distancia: number
  readonly cant_tiros_leccion: number
}

export interface LessonReportSummaryDto {
  readonly total_tiradores: number
  readonly total_disparos: number
  readonly total_acertados: number
  readonly porcentaje_promedio: number
  readonly fracciones_count: number
  readonly armas_count: number
  readonly unidades_count: number
}

export interface LessonReportFractionDto {
  readonly id_fraccion: number
  readonly numero_fraccion: number
  readonly tiradores: number
  readonly tiros_acertados: number
  readonly tiros_total: number
  readonly porcentaje: number
}

export interface LessonReportShooterDto {
  readonly id_usuario: number
  readonly rut: string
  readonly grado: string
  readonly nombre: string
  readonly unit_code: string
  readonly unit_name: string
  readonly tiros_acertados: number
  readonly tiros_total: number
  readonly fracciones_count: number
  readonly porcentaje: number
}

export interface LessonReportUnitDto {
  readonly unit_code: string
  readonly unit_name: string
  readonly tiradores: number
  readonly tiros_acertados: number
  readonly tiros_total: number
  readonly porcentaje: number
}

export interface LessonReportWeaponDto {
  readonly id_arma: number
  readonly tipo: string
  readonly modelo: string
  readonly serie: string
  readonly unit_code: string | null
  readonly unit_name: string
  readonly tiradores: number
  readonly tiros_acertados: number
  readonly tiros_total: number
  readonly porcentaje: number
}

export interface LessonReportWeaponUnitWeaponDto {
  readonly id_arma: number
  readonly tipo: string
  readonly modelo: string
  readonly serie: string
  readonly tiradores: number
  readonly tiros_acertados: number
  readonly tiros_total: number
  readonly porcentaje: number
}

export interface LessonReportWeaponUnitDto {
  readonly unit_code: string | null
  readonly unit_name: string
  readonly armas: readonly LessonReportWeaponUnitWeaponDto[]
  readonly tiros_acertados: number
  readonly tiros_total: number
  readonly porcentaje: number
}

interface LessonReportBaseDto {
  readonly leccion: LessonReportLessonDto
  readonly resumen: LessonReportSummaryDto
  readonly por_fraccion: readonly LessonReportFractionDto[]
  readonly por_tirador: readonly LessonReportShooterDto[]
  readonly por_unidad: readonly LessonReportUnitDto[]
  readonly por_arma: readonly LessonReportWeaponDto[]
  readonly por_arma_unidad: readonly LessonReportWeaponUnitDto[]
}

export interface LessonReportWithoutAggregateFlagDto extends LessonReportBaseDto {
  readonly aggregate_only?: never
}

export interface AggregateOnlyLessonReportDto extends LessonReportBaseDto {
  readonly aggregate_only: true
}

export interface DetailedLessonReportDto extends LessonReportBaseDto {
  readonly aggregate_only: false
}

export type LessonReportDto =
  | LessonReportWithoutAggregateFlagDto
  | AggregateOnlyLessonReportDto
  | DetailedLessonReportDto

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isSafeId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function isNullableId(value: unknown): value is number | null {
  return value === null || isSafeId(value)
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  return month >= 1 && month <= 12 && day >= 1 && day <= (monthDays[month - 1] ?? 0)
}

function requireShape(condition: unknown): asserts condition {
  if (!condition) throw new ShootingApiError(SHOOTING_API_ERROR_KIND.SCHEMA)
}

function requireExactKeys(
  value: unknown,
  keys: readonly string[],
): asserts value is Record<string, unknown> {
  requireShape(isRecord(value))
  const actualKeys = Object.keys(value)
  requireShape(
    actualKeys.length === keys.length
      && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key)),
  )
}

function validateArray<T>(value: unknown, validateItem: (item: unknown) => T): readonly T[] {
  requireShape(isUnknownArray(value))
  return value.map(validateItem)
}

function validateStringArray(value: unknown): readonly string[] {
  return validateArray(value, (item) => {
    requireShape(typeof item === 'string')
    return item
  })
}

function validatePolygon(value: unknown): ShootingPolygonDto {
  requireExactKeys(value, [
    'id_poligono', 'tenant', 'organization_unit', 'nombre', 'ciudad',
    'carriles_maximos', 'distancia_maxima',
  ])
  requireShape(isSafeId(value.id_poligono))
  requireShape(isNullableId(value.tenant))
  requireShape(isNullableId(value.organization_unit))
  requireShape(typeof value.nombre === 'string')
  requireShape(typeof value.ciudad === 'string')
  requireShape(isInteger(value.carriles_maximos))
  requireShape(isInteger(value.distancia_maxima))

  return {
    id_poligono: value.id_poligono,
    tenant: value.tenant,
    organization_unit: value.organization_unit,
    nombre: value.nombre,
    ciudad: value.ciudad,
    carriles_maximos: value.carriles_maximos,
    distancia_maxima: value.distancia_maxima,
  }
}

function validateLesson(value: unknown): ShootingLessonDto {
  requireExactKeys(value, [
    'id_leccion', 'tenant', 'organization_unit', 'id_poligono', 'fecha_tiro',
    'numero_orden', 'fecha_orden', 'tipo_tiro', 'cant_tiros_cereo',
    'cant_tiros_leccion', 'distancia', 'unidades_participantes_codes',
  ])
  requireShape(isSafeId(value.id_leccion))
  requireShape(isNullableId(value.tenant))
  requireShape(isNullableId(value.organization_unit))
  requireShape(isSafeId(value.id_poligono))
  requireShape(isDate(value.fecha_tiro))
  requireShape(isNullableString(value.numero_orden))
  requireShape(value.fecha_orden === null || isDate(value.fecha_orden))
  requireShape(isNullableString(value.tipo_tiro))
  requireShape(isInteger(value.cant_tiros_cereo))
  requireShape(isInteger(value.cant_tiros_leccion))
  requireShape(isInteger(value.distancia))

  return {
    id_leccion: value.id_leccion,
    tenant: value.tenant,
    organization_unit: value.organization_unit,
    id_poligono: value.id_poligono,
    fecha_tiro: value.fecha_tiro,
    numero_orden: value.numero_orden,
    fecha_orden: value.fecha_orden,
    tipo_tiro: value.tipo_tiro,
    cant_tiros_cereo: value.cant_tiros_cereo,
    cant_tiros_leccion: value.cant_tiros_leccion,
    distancia: value.distancia,
    unidades_participantes_codes: validateStringArray(value.unidades_participantes_codes),
  }
}

function validateFraction(value: unknown): ShootingFractionDto {
  requireExactKeys(value, [
    'id_fraccion', 'tenant', 'organization_unit', 'id_leccion',
    'tiradores_totales', 'numero_fraccion',
  ])
  requireShape(isSafeId(value.id_fraccion))
  requireShape(isNullableId(value.tenant))
  requireShape(isNullableId(value.organization_unit))
  requireShape(isSafeId(value.id_leccion))
  requireShape(isInteger(value.tiradores_totales))
  requireShape(isInteger(value.numero_fraccion))

  return {
    id_fraccion: value.id_fraccion,
    tenant: value.tenant,
    organization_unit: value.organization_unit,
    id_leccion: value.id_leccion,
    tiradores_totales: value.tiradores_totales,
    numero_fraccion: value.numero_fraccion,
  }
}

function validateAssignment(value: unknown): ShootingAssignmentDto {
  requireExactKeys(value, [
    'id', 'role_code', 'role_name', 'unit_code', 'scope_code', 'is_primary',
  ])
  requireShape(isSafeId(value.id))
  requireShape(isNullableString(value.role_code))
  requireShape(isNullableString(value.role_name))
  requireShape(isNullableString(value.unit_code))
  requireShape(isNullableString(value.scope_code))
  requireShape(typeof value.is_primary === 'boolean')

  return {
    id: value.id,
    role_code: value.role_code,
    role_name: value.role_name,
    unit_code: value.unit_code,
    scope_code: value.scope_code,
    is_primary: value.is_primary,
  }
}

function validatePrimaryAssignment(value: unknown): ShootingPrimaryAssignmentDto | null {
  if (value === null) return null

  requireExactKeys(value, ['unit_code', 'role_code', 'scope_code'])
  requireShape(isNullableString(value.unit_code))
  requireShape(isNullableString(value.role_code))
  requireShape(isNullableString(value.scope_code))

  return {
    unit_code: value.unit_code,
    role_code: value.role_code,
    scope_code: value.scope_code,
  }
}

function validateUser(value: unknown): ShootingUserDto {
  requireExactKeys(value, [
    'id_usuario', 'rut', 'grado', 'nombre', 'apellido_paterno',
    'apellido_materno', 'correo', 'habilitado', 'is_locked',
    'must_change_password', 'password_changed_at', 'primary_assignment', 'assignments',
  ])
  requireShape(isSafeId(value.id_usuario))
  requireShape(typeof value.rut === 'string')
  requireShape(isNullableString(value.grado))
  requireShape(typeof value.nombre === 'string')
  requireShape(typeof value.apellido_paterno === 'string')
  requireShape(typeof value.apellido_materno === 'string')
  requireShape(isNullableString(value.correo))
  requireShape(typeof value.habilitado === 'boolean')
  requireShape(typeof value.is_locked === 'boolean')
  requireShape(typeof value.must_change_password === 'boolean')
  requireShape(isNullableString(value.password_changed_at))

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
    primary_assignment: validatePrimaryAssignment(value.primary_assignment),
    assignments: validateArray(value.assignments, validateAssignment),
  }
}

function validateWeapon(value: unknown): ShootingWeaponDto {
  requireExactKeys(value, [
    'id_arma', 'tenant', 'organization_unit', 'armory', 'armory_code',
    'armory_name', 'organization_unit_code', 'calibre_code', 'tipo_arma',
    'modelo_arma', 'numero_serie',
  ])
  requireShape(isSafeId(value.id_arma))
  requireShape(isNullableId(value.tenant))
  requireShape(isNullableId(value.organization_unit))
  requireShape(isNullableId(value.armory))
  requireShape(isNullableString(value.armory_code))
  requireShape(isNullableString(value.armory_name))
  requireShape(isNullableString(value.organization_unit_code))
  requireShape(isNullableString(value.calibre_code))
  requireShape(typeof value.tipo_arma === 'string')
  requireShape(typeof value.modelo_arma === 'string')
  requireShape(typeof value.numero_serie === 'string')

  return {
    id_arma: value.id_arma,
    tenant: value.tenant,
    organization_unit: value.organization_unit,
    armory: value.armory,
    armory_code: value.armory_code,
    armory_name: value.armory_name,
    organization_unit_code: value.organization_unit_code,
    calibre_code: value.calibre_code,
    tipo_arma: value.tipo_arma,
    modelo_arma: value.modelo_arma,
    numero_serie: value.numero_serie,
  }
}

function validateResult(value: unknown): ShootingResultDto {
  requireExactKeys(value, [
    'id_resultado', 'tenant', 'organization_unit', 'id_fraccion', 'id_usuario',
    'id_arma', 'tiros_acertados', 'total_tiros', 'numero_carril',
  ])
  requireShape(isSafeId(value.id_resultado))
  requireShape(isNullableId(value.tenant))
  requireShape(isNullableId(value.organization_unit))
  requireShape(isSafeId(value.id_fraccion))
  requireShape(isSafeId(value.id_usuario))
  requireShape(isSafeId(value.id_arma))
  requireShape(isInteger(value.tiros_acertados))
  requireShape(isInteger(value.total_tiros))
  requireShape(value.numero_carril === null || isInteger(value.numero_carril))

  return {
    id_resultado: value.id_resultado,
    tenant: value.tenant,
    organization_unit: value.organization_unit,
    id_fraccion: value.id_fraccion,
    id_usuario: value.id_usuario,
    id_arma: value.id_arma,
    tiros_acertados: value.tiros_acertados,
    total_tiros: value.total_tiros,
    numero_carril: value.numero_carril,
  }
}

function validateLessonResultDetail(value: unknown): LessonDetailedResultDto {
  requireExactKeys(value, [
    'RUT', 'Grado', 'Apellido_paterno', 'Apellido_materno', 'Nombre', 'Unidad',
    'Tipo Arma', 'Modelo de Arma', 'Número de Serie', 'Carril',
    'Tiros Acertados', 'Total Tiros',
  ])
  requireShape(typeof value.RUT === 'string')
  requireShape(isNullableString(value.Grado))
  requireShape(typeof value.Apellido_paterno === 'string')
  requireShape(typeof value.Apellido_materno === 'string')
  requireShape(typeof value.Nombre === 'string')
  requireShape(typeof value.Unidad === 'string')
  requireShape(typeof value['Tipo Arma'] === 'string')
  requireShape(typeof value['Modelo de Arma'] === 'string')
  requireShape(typeof value['Número de Serie'] === 'string')
  requireShape(value.Carril === null || isInteger(value.Carril))
  requireShape(isInteger(value['Tiros Acertados']))
  requireShape(isInteger(value['Total Tiros']))

  return {
    RUT: value.RUT,
    Grado: value.Grado,
    Apellido_paterno: value.Apellido_paterno,
    Apellido_materno: value.Apellido_materno,
    Nombre: value.Nombre,
    Unidad: value.Unidad,
    'Tipo Arma': value['Tipo Arma'],
    'Modelo de Arma': value['Modelo de Arma'],
    'Número de Serie': value['Número de Serie'],
    Carril: value.Carril,
    'Tiros Acertados': value['Tiros Acertados'],
    'Total Tiros': value['Total Tiros'],
  }
}

function validateReportLesson(value: unknown): LessonReportLessonDto {
  requireExactKeys(value, [
    'id_leccion', 'fecha_tiro', 'tipo_tiro', 'distancia', 'cant_tiros_leccion',
  ])
  requireShape(isSafeId(value.id_leccion))
  requireShape(isDate(value.fecha_tiro))
  requireShape(isNullableString(value.tipo_tiro))
  requireShape(isInteger(value.distancia))
  requireShape(isInteger(value.cant_tiros_leccion))

  return {
    id_leccion: value.id_leccion,
    fecha_tiro: value.fecha_tiro,
    tipo_tiro: value.tipo_tiro,
    distancia: value.distancia,
    cant_tiros_leccion: value.cant_tiros_leccion,
  }
}

function validateReportSummary(value: unknown): LessonReportSummaryDto {
  requireExactKeys(value, [
    'total_tiradores', 'total_disparos', 'total_acertados', 'porcentaje_promedio',
    'fracciones_count', 'armas_count', 'unidades_count',
  ])
  requireShape(isInteger(value.total_tiradores))
  requireShape(isInteger(value.total_disparos))
  requireShape(isInteger(value.total_acertados))
  requireShape(isFiniteNumber(value.porcentaje_promedio))
  requireShape(isInteger(value.fracciones_count))
  requireShape(isInteger(value.armas_count))
  requireShape(isInteger(value.unidades_count))

  return {
    total_tiradores: value.total_tiradores,
    total_disparos: value.total_disparos,
    total_acertados: value.total_acertados,
    porcentaje_promedio: value.porcentaje_promedio,
    fracciones_count: value.fracciones_count,
    armas_count: value.armas_count,
    unidades_count: value.unidades_count,
  }
}

function validateReportFraction(value: unknown): LessonReportFractionDto {
  requireExactKeys(value, [
    'id_fraccion', 'numero_fraccion', 'tiradores', 'tiros_acertados',
    'tiros_total', 'porcentaje',
  ])
  requireShape(isSafeId(value.id_fraccion))
  requireShape(isInteger(value.numero_fraccion))
  requireShape(isInteger(value.tiradores))
  requireShape(isInteger(value.tiros_acertados))
  requireShape(isInteger(value.tiros_total))
  requireShape(isFiniteNumber(value.porcentaje))

  return {
    id_fraccion: value.id_fraccion,
    numero_fraccion: value.numero_fraccion,
    tiradores: value.tiradores,
    tiros_acertados: value.tiros_acertados,
    tiros_total: value.tiros_total,
    porcentaje: value.porcentaje,
  }
}

function validateReportShooter(value: unknown): LessonReportShooterDto {
  requireExactKeys(value, [
    'id_usuario', 'rut', 'grado', 'nombre', 'unit_code', 'unit_name',
    'tiros_acertados', 'tiros_total', 'fracciones_count', 'porcentaje',
  ])
  requireShape(isSafeId(value.id_usuario))
  requireShape(typeof value.rut === 'string')
  requireShape(typeof value.grado === 'string')
  requireShape(typeof value.nombre === 'string')
  requireShape(typeof value.unit_code === 'string')
  requireShape(typeof value.unit_name === 'string')
  requireShape(isInteger(value.tiros_acertados))
  requireShape(isInteger(value.tiros_total))
  requireShape(isInteger(value.fracciones_count))
  requireShape(isFiniteNumber(value.porcentaje))

  return {
    id_usuario: value.id_usuario,
    rut: value.rut,
    grado: value.grado,
    nombre: value.nombre,
    unit_code: value.unit_code,
    unit_name: value.unit_name,
    tiros_acertados: value.tiros_acertados,
    tiros_total: value.tiros_total,
    fracciones_count: value.fracciones_count,
    porcentaje: value.porcentaje,
  }
}

function validateReportUnit(value: unknown): LessonReportUnitDto {
  requireExactKeys(value, [
    'unit_code', 'unit_name', 'tiradores', 'tiros_acertados', 'tiros_total', 'porcentaje',
  ])
  requireShape(typeof value.unit_code === 'string')
  requireShape(typeof value.unit_name === 'string')
  requireShape(isInteger(value.tiradores))
  requireShape(isInteger(value.tiros_acertados))
  requireShape(isInteger(value.tiros_total))
  requireShape(isFiniteNumber(value.porcentaje))

  return {
    unit_code: value.unit_code,
    unit_name: value.unit_name,
    tiradores: value.tiradores,
    tiros_acertados: value.tiros_acertados,
    tiros_total: value.tiros_total,
    porcentaje: value.porcentaje,
  }
}

function validateReportWeapon(value: unknown): LessonReportWeaponDto {
  requireExactKeys(value, [
    'id_arma', 'tipo', 'modelo', 'serie', 'unit_code', 'unit_name', 'tiradores',
    'tiros_acertados', 'tiros_total', 'porcentaje',
  ])
  requireShape(isSafeId(value.id_arma))
  requireShape(typeof value.tipo === 'string')
  requireShape(typeof value.modelo === 'string')
  requireShape(typeof value.serie === 'string')
  requireShape(isNullableString(value.unit_code))
  requireShape(typeof value.unit_name === 'string')
  requireShape(isInteger(value.tiradores))
  requireShape(isInteger(value.tiros_acertados))
  requireShape(isInteger(value.tiros_total))
  requireShape(isFiniteNumber(value.porcentaje))

  return {
    id_arma: value.id_arma,
    tipo: value.tipo,
    modelo: value.modelo,
    serie: value.serie,
    unit_code: value.unit_code,
    unit_name: value.unit_name,
    tiradores: value.tiradores,
    tiros_acertados: value.tiros_acertados,
    tiros_total: value.tiros_total,
    porcentaje: value.porcentaje,
  }
}

function validateReportWeaponUnitWeapon(value: unknown): LessonReportWeaponUnitWeaponDto {
  requireExactKeys(value, [
    'id_arma', 'tipo', 'modelo', 'serie', 'tiradores', 'tiros_acertados',
    'tiros_total', 'porcentaje',
  ])
  requireShape(isSafeId(value.id_arma))
  requireShape(typeof value.tipo === 'string')
  requireShape(typeof value.modelo === 'string')
  requireShape(typeof value.serie === 'string')
  requireShape(isInteger(value.tiradores))
  requireShape(isInteger(value.tiros_acertados))
  requireShape(isInteger(value.tiros_total))
  requireShape(isFiniteNumber(value.porcentaje))

  return {
    id_arma: value.id_arma,
    tipo: value.tipo,
    modelo: value.modelo,
    serie: value.serie,
    tiradores: value.tiradores,
    tiros_acertados: value.tiros_acertados,
    tiros_total: value.tiros_total,
    porcentaje: value.porcentaje,
  }
}

function validateReportWeaponUnit(value: unknown): LessonReportWeaponUnitDto {
  requireExactKeys(value, [
    'unit_code', 'unit_name', 'armas', 'tiros_acertados', 'tiros_total', 'porcentaje',
  ])
  requireShape(isNullableString(value.unit_code))
  requireShape(typeof value.unit_name === 'string')
  requireShape(isInteger(value.tiros_acertados))
  requireShape(isInteger(value.tiros_total))
  requireShape(isFiniteNumber(value.porcentaje))

  return {
    unit_code: value.unit_code,
    unit_name: value.unit_name,
    armas: validateArray(value.armas, validateReportWeaponUnitWeapon),
    tiros_acertados: value.tiros_acertados,
    tiros_total: value.tiros_total,
    porcentaje: value.porcentaje,
  }
}

function validateLessonReport(value: unknown): LessonReportDto {
  requireShape(isRecord(value))
  const hasAggregateFlag = Object.prototype.hasOwnProperty.call(value, 'aggregate_only')
  const commonKeys = [
    'leccion', 'resumen', 'por_fraccion', 'por_tirador', 'por_unidad',
    'por_arma', 'por_arma_unidad',
  ]
  requireExactKeys(value, hasAggregateFlag ? [...commonKeys, 'aggregate_only'] : commonKeys)

  const leccion = validateReportLesson(value.leccion)
  const resumen = validateReportSummary(value.resumen)
  const porFraccion = validateArray(value.por_fraccion, validateReportFraction)
  const porTirador = validateArray(value.por_tirador, validateReportShooter)
  const porUnidad = validateArray(value.por_unidad, validateReportUnit)
  const porArma = validateArray(value.por_arma, validateReportWeapon)
  const porArmaUnidad = validateArray(value.por_arma_unidad, validateReportWeaponUnit)
  const base: LessonReportBaseDto = {
    leccion,
    resumen,
    por_fraccion: porFraccion,
    por_tirador: porTirador,
    por_unidad: porUnidad,
    por_arma: porArma,
    por_arma_unidad: porArmaUnidad,
  }

  if (!hasAggregateFlag) {
    requireShape(
      porFraccion.length === 0
        && porTirador.length === 0
        && porUnidad.length === 0
        && porArma.length === 0
        && porArmaUnidad.length === 0,
    )
    return base
  }

  requireShape(typeof value.aggregate_only === 'boolean')
  if (value.aggregate_only) {
    requireShape(porTirador.length === 0 && porArma.length === 0 && porArmaUnidad.length === 0)
    return { ...base, aggregate_only: true }
  }

  return { ...base, aggregate_only: false }
}

function requestConnection(connection: ApiConnection) {
  const tenantCode = connection.tenantCode.trim()
  if (!tenantCode) throw new ShootingApiError(SHOOTING_API_ERROR_KIND.CONFIGURATION)

  return {
    tenantCode,
    unitCode: connection.unitCode,
    signal: connection.signal,
  }
}

function requireId(id: number): string {
  if (!isSafeId(id)) throw new ShootingApiError(SHOOTING_API_ERROR_KIND.CONFIGURATION)
  return String(id)
}

async function requestJson<T>(
  path: string,
  method: JsonRequestMethod,
  connection: ApiConnection,
  validate: (payload: unknown) => T,
  body?: object,
): Promise<T> {
  const response = await request(path, {
    ...requestConnection(connection),
    method,
    body,
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ShootingApiError(SHOOTING_API_ERROR_KIND.SCHEMA)
  }

  try {
    return validate(payload)
  } catch (error: unknown) {
    if (error instanceof ShootingApiError && error.kind === SHOOTING_API_ERROR_KIND.SCHEMA) {
      throw new ShootingApiError(SHOOTING_API_ERROR_KIND.SCHEMA, { payload })
    }
    throw error
  }
}

async function requestDelete(path: string, connection: ApiConnection): Promise<void> {
  await request(path, {
    ...requestConnection(connection),
    method: REQUEST_METHOD.DELETE,
  })
}

export { getLessonSummary }

export function getShootingPolygons(
  connection: ApiConnection,
): Promise<readonly ShootingPolygonDto[]> {
  return requestJson('/poligonos/', REQUEST_METHOD.GET, connection,
    (payload) => validateArray(payload, validatePolygon))
}

export function getShootingPolygon(
  polygonId: number,
  connection: ApiConnection,
): Promise<ShootingPolygonDto> {
  return requestJson(`/poligonos/${requireId(polygonId)}/`, REQUEST_METHOD.GET,
    connection, validatePolygon)
}

export function createShootingPolygon(
  body: ShootingPolygonWrite,
  connection: ApiConnection,
): Promise<ShootingPolygonDto> {
  return requestJson('/poligonos/', REQUEST_METHOD.POST, connection,
    validatePolygon, body)
}

export function updateShootingPolygon(
  polygonId: number,
  body: ShootingPolygonWrite,
  connection: ApiConnection,
): Promise<ShootingPolygonDto> {
  return requestJson(`/poligonos/${requireId(polygonId)}/`, REQUEST_METHOD.PUT,
    connection, validatePolygon, body)
}

export function patchShootingPolygon(
  polygonId: number,
  body: Partial<ShootingPolygonWrite>,
  connection: ApiConnection,
): Promise<ShootingPolygonDto> {
  return requestJson(`/poligonos/${requireId(polygonId)}/`, REQUEST_METHOD.PATCH,
    connection, validatePolygon, body)
}

// RNG-006 remains a real DELETE request; exporting it does not grant UI availability.
export function deleteShootingPolygon(
  polygonId: number,
  connection: ApiConnection,
): Promise<void> {
  return requestDelete(`/poligonos/${requireId(polygonId)}/`, connection)
}

export function getPolygonLessons(
  polygonId: number,
  connection: ApiConnection,
): Promise<readonly ShootingLessonDto[]> {
  return requestJson(`/poligonos/${requireId(polygonId)}/lecciones/`,
    REQUEST_METHOD.GET, connection, (payload) => validateArray(payload, validateLesson))
}

export function getShootingLessons(
  connection: ApiConnection,
): Promise<readonly ShootingLessonDto[]> {
  return requestJson('/lecciones/', REQUEST_METHOD.GET, connection,
    (payload) => validateArray(payload, validateLesson))
}

export function createShootingLesson(
  body: ShootingLessonWrite,
  connection: ApiConnection,
): Promise<ShootingLessonDto> {
  return requestJson('/lecciones/', REQUEST_METHOD.POST, connection,
    validateLesson, body)
}

export function getShootingLesson(
  lessonId: number,
  connection: ApiConnection,
): Promise<ShootingLessonDto> {
  return requestJson(`/lecciones/${requireId(lessonId)}/`, REQUEST_METHOD.GET,
    connection, validateLesson)
}

export function updateShootingLesson(
  lessonId: number,
  body: ShootingLessonWrite,
  connection: ApiConnection,
): Promise<ShootingLessonDto> {
  return requestJson(`/lecciones/${requireId(lessonId)}/`, REQUEST_METHOD.PUT,
    connection, validateLesson, body)
}

export function patchShootingLesson(
  lessonId: number,
  body: Partial<ShootingLessonWrite>,
  connection: ApiConnection,
): Promise<ShootingLessonDto> {
  return requestJson(`/lecciones/${requireId(lessonId)}/`, REQUEST_METHOD.PATCH,
    connection, validateLesson, body)
}

export function deleteShootingLesson(
  lessonId: number,
  connection: ApiConnection,
): Promise<void> {
  return requestDelete(`/lecciones/${requireId(lessonId)}/`, connection)
}

export function getLessonFractions(
  lessonId: number,
  connection: ApiConnection,
): Promise<readonly ShootingFractionDto[]> {
  return requestJson(`/lecciones/${requireId(lessonId)}/fracciones/`,
    REQUEST_METHOD.GET, connection, (payload) => validateArray(payload, validateFraction))
}

export function getLessonShooters(
  lessonId: number,
  connection: ApiConnection,
): Promise<readonly ShootingUserDto[]> {
  return requestJson(`/lecciones/${requireId(lessonId)}/usuarios/`,
    REQUEST_METHOD.GET, connection, (payload) => validateArray(payload, validateUser))
}

export function getLessonDetailedResults(
  lessonId: number,
  connection: ApiConnection,
): Promise<readonly LessonDetailedResultDto[]> {
  return requestJson(`/lecciones/${requireId(lessonId)}/resultados/`,
    REQUEST_METHOD.GET, connection,
    (payload) => validateArray(payload, validateLessonResultDetail))
}

export function getLessonReport(
  lessonId: number,
  connection: ApiConnection,
): Promise<LessonReportDto> {
  return requestJson(`/lecciones/${requireId(lessonId)}/reporte/`,
    REQUEST_METHOD.GET, connection, validateLessonReport)
}

export function getEligibleShooters(
  lessonId: number,
  connection: ApiConnection,
): Promise<readonly ShootingUserDto[]> {
  return requestJson(`/lecciones/${requireId(lessonId)}/tiradores-elegibles/`,
    REQUEST_METHOD.GET, connection, (payload) => {
      requireExactKeys(payload, ['results'])
      return validateArray(payload.results, validateUser)
    })
}

export function getShootingFractions(
  connection: ApiConnection,
): Promise<readonly ShootingFractionDto[]> {
  return requestJson('/fracciones/', REQUEST_METHOD.GET, connection,
    (payload) => validateArray(payload, validateFraction))
}

export function createShootingFraction(
  body: ShootingFractionWrite,
  connection: ApiConnection,
): Promise<ShootingFractionDto> {
  return requestJson('/fracciones/', REQUEST_METHOD.POST, connection,
    validateFraction, body)
}

export function getShootingFraction(
  fractionId: number,
  connection: ApiConnection,
): Promise<ShootingFractionDto> {
  return requestJson(`/fracciones/${requireId(fractionId)}/`, REQUEST_METHOD.GET,
    connection, validateFraction)
}

export function updateShootingFraction(
  fractionId: number,
  body: ShootingFractionWrite,
  connection: ApiConnection,
): Promise<ShootingFractionDto> {
  return requestJson(`/fracciones/${requireId(fractionId)}/`, REQUEST_METHOD.PUT,
    connection, validateFraction, body)
}

export function patchShootingFraction(
  fractionId: number,
  body: Partial<ShootingFractionWrite>,
  connection: ApiConnection,
): Promise<ShootingFractionDto> {
  return requestJson(`/fracciones/${requireId(fractionId)}/`, REQUEST_METHOD.PATCH,
    connection, validateFraction, body)
}

export function deleteShootingFraction(
  fractionId: number,
  connection: ApiConnection,
): Promise<void> {
  return requestDelete(`/fracciones/${requireId(fractionId)}/`, connection)
}

export function getFractionCaptureOptions(
  fractionId: number,
  connection: ApiConnection,
): Promise<FractionCaptureOptionsDto> {
  return requestJson(`/fracciones/${requireId(fractionId)}/tiradores/`,
    REQUEST_METHOD.GET, connection, (payload) => {
      requireExactKeys(payload, ['usuarios', 'armas'])
      return {
        usuarios: validateArray(payload.usuarios, validateUser),
        armas: validateArray(payload.armas, validateWeapon),
      }
    })
}

export function getFractionResultDetails(
  fractionId: number,
  connection: ApiConnection,
): Promise<readonly ShootingFractionResultDto[]> {
  return requestJson(`/fracciones/${requireId(fractionId)}/resultados/`,
    REQUEST_METHOD.GET, connection, (payload) => validateArray(payload, (item) => {
      requireExactKeys(item, ['resultado', 'usuario', 'arma'])
      return {
        resultado: validateResult(item.resultado),
        usuario: validateUser(item.usuario),
        arma: validateWeapon(item.arma),
      }
    }))
}

export function getShootingResults(
  connection: ApiConnection,
): Promise<readonly ShootingResultDto[]> {
  return requestJson('/resultados/', REQUEST_METHOD.GET, connection,
    (payload) => validateArray(payload, validateResult))
}

export function createShootingResult(
  body: ShootingResultWrite,
  connection: ApiConnection,
): Promise<ShootingResultDto> {
  return requestJson('/resultados/', REQUEST_METHOD.POST, connection,
    validateResult, body)
}

export function getShootingResult(
  resultId: number,
  connection: ApiConnection,
): Promise<ShootingResultDto> {
  return requestJson(`/resultados/${requireId(resultId)}/`, REQUEST_METHOD.GET,
    connection, validateResult)
}

export function updateShootingResult(
  resultId: number,
  body: ShootingResultWrite,
  connection: ApiConnection,
): Promise<ShootingResultDto> {
  return requestJson(`/resultados/${requireId(resultId)}/`, REQUEST_METHOD.PUT,
    connection, validateResult, body)
}

export function patchShootingResult(
  resultId: number,
  body: Partial<ShootingResultWrite>,
  connection: ApiConnection,
): Promise<ShootingResultDto> {
  return requestJson(`/resultados/${requireId(resultId)}/`, REQUEST_METHOD.PATCH,
    connection, validateResult, body)
}

export function deleteShootingResult(
  resultId: number,
  connection: ApiConnection,
): Promise<void> {
  return requestDelete(`/resultados/${requireId(resultId)}/`, connection)
}
