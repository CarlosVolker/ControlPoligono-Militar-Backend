import { HttpRequestError, request } from './http'
import type {
  ApiConnection,
  AuthContext,
  DashboardApiErrorKind,
  Lesson,
  LessonSummary,
  Polygon,
  UserProfile,
} from '../types'

export const TENANT_CONTEXT_DENIED_DETAIL = 'No tiene acceso al tenant solicitado.'

export class DashboardApiError extends Error {
  readonly kind: DashboardApiErrorKind
  readonly status: number | null
  readonly detail: string | null
  readonly retryAfter: string | null
  readonly payload: unknown

  constructor(
    kind: DashboardApiErrorKind,
    status: number | null = null,
    detail: string | null = null,
    retryAfter: string | null = null,
    payload: unknown = undefined,
  ) {
    super(kind === 'http'
      ? 'La solicitud al servidor fue rechazada.'
      : kind === 'network'
        ? 'No se pudo conectar con el servidor.'
        : 'La respuesta del servidor no se pudo procesar.')
    this.name = 'DashboardApiError'
    this.kind = kind
    this.status = status
    this.detail = detail
    this.retryAfter = retryAfter
    this.payload = payload
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
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

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  return month >= 1 && month <= 12 && day >= 1 && day <= (monthDays[month - 1] ?? 0)
}

function requireShape(condition: unknown): asserts condition {
  if (!condition) throw new DashboardApiError('schema')
}

function validateStringArray(value: unknown): string[] {
  requireShape(isUnknownArray(value))
  const result: string[] = []

  for (const item of value) {
    requireShape(typeof item === 'string')
    result.push(item)
  }

  return result
}

function isAbortError(value: unknown): boolean {
  return isRecord(value) && value.name === 'AbortError'
}

async function getJson(path: string, connection: ApiConnection): Promise<unknown> {
  const tenantCode = typeof connection.tenantCode === 'string'
    ? connection.tenantCode.trim()
    : ''
  if (!tenantCode) throw new DashboardApiError('configuration')

  let response: Response
  try {
    response = await request(path, {
      method: 'GET',
      tenantCode,
      unitCode: connection.unitCode,
      signal: connection.signal,
    })
  } catch (error: unknown) {
    if (isAbortError(error)) throw error
    if (error instanceof HttpRequestError) {
      throw new DashboardApiError(
        error.kind,
        error.status,
        error.detail,
        error.retryAfter,
        error.payload,
      )
    }
    throw new DashboardApiError('network')
  }

  try {
    const payload: unknown = await response.json()
    return payload
  } catch {
    throw new DashboardApiError('schema')
  }
}

export function validateAuthContext(value: unknown): AuthContext {
  requireShape(isRecord(value))

  const user = value.user
  requireShape(isRecord(user))
  const userId = user.id_usuario
  const rut = user.rut
  const mustChangePassword = user.must_change_password
  requireShape(isSafeId(userId))
  requireShape(isNullableString(rut))
  requireShape(typeof mustChangePassword === 'boolean')

  const tenant = value.tenant
  requireShape(isRecord(tenant))
  const tenantCode = tenant.code
  const tenantContext = tenant.context
  requireShape(isNullableString(tenantCode))
  requireShape(isNullableString(tenantContext))

  const activeUnit = value.active_organization_unit
  requireShape(isNullableString(activeUnit))

  const rawMembership = value.unit_membership
  let unitMembership: AuthContext['unit_membership']
  if (rawMembership === null) {
    unitMembership = null
  } else {
    requireShape(isRecord(rawMembership))
    const membershipId = rawMembership.id
    const unitCode = rawMembership.unit_code
    const unitName = rawMembership.unit_name
    requireShape(isSafeId(membershipId))
    requireShape(typeof unitCode === 'string')
    requireShape(typeof unitName === 'string')
    unitMembership = {
      id: membershipId,
      unit_code: unitCode,
      unit_name: unitName,
    }
  }

  const rawAssignments = value.assignments
  requireShape(isUnknownArray(rawAssignments))
  const assignments: AuthContext['assignments'] = []
  for (const item of rawAssignments) {
    requireShape(isRecord(item))
    const role = item.role
    const scope = item.scope
    const organizationUnit = item.organization_unit
    const isPrimary = item.is_primary
    requireShape(typeof role === 'string')
    requireShape(isNullableString(scope))
    requireShape(isNullableString(organizationUnit))
    requireShape(typeof isPrimary === 'boolean')
    assignments.push({
      role,
      scope,
      organization_unit: organizationUnit,
      is_primary: isPrimary,
    })
  }

  return {
    user: {
      id_usuario: userId,
      rut,
      must_change_password: mustChangePassword,
    },
    tenant: {
      code: tenantCode,
      context: tenantContext,
    },
    active_organization_unit: activeUnit,
    unit_membership: unitMembership,
    scopes: validateStringArray(value.scopes),
    permissions: validateStringArray(value.permissions),
    assignments,
  }
}

function validateLesson(value: unknown): Lesson {
  requireShape(isRecord(value))
  const lessonId = value.id_leccion
  const polygonId = value.id_poligono
  const date = value.fecha_tiro
  const orderNumber = value.numero_orden
  const orderDate = value.fecha_orden
  const shootingType = value.tipo_tiro
  const zeroingShots = value.cant_tiros_cereo
  const lessonShots = value.cant_tiros_leccion
  const distance = value.distancia

  requireShape(isSafeId(lessonId))
  requireShape(isSafeId(polygonId))
  requireShape(isDate(date))
  requireShape(isNullableString(orderNumber))
  requireShape(orderDate === null || isDate(orderDate))
  requireShape(isNullableString(shootingType))
  requireShape(isInteger(zeroingShots))
  requireShape(isInteger(lessonShots))
  requireShape(isInteger(distance))

  return {
    id_leccion: lessonId,
    id_poligono: polygonId,
    fecha_tiro: date,
    numero_orden: orderNumber,
    fecha_orden: orderDate,
    tipo_tiro: shootingType,
    cant_tiros_cereo: zeroingShots,
    cant_tiros_leccion: lessonShots,
    distancia: distance,
    unidades_participantes_codes: validateStringArray(value.unidades_participantes_codes),
  }
}

export function validateLessons(value: unknown): Lesson[] {
  requireShape(isUnknownArray(value))
  const lessons = value.map((item) => validateLesson(item))
  const ids = new Set(lessons.map((lesson) => lesson.id_leccion))
  requireShape(ids.size === lessons.length)
  return lessons
}

function validateUserProfile(value: unknown, requestedUserId: number): UserProfile {
  requireShape(isRecord(value))
  const userId = value.id_usuario
  const rank = value.grado
  const firstName = value.nombre
  const paternalName = value.apellido_paterno
  const maternalName = value.apellido_materno

  requireShape(isSafeId(userId) && userId === requestedUserId)
  requireShape(isNullableString(rank))
  requireShape(typeof firstName === 'string')
  requireShape(typeof paternalName === 'string')
  requireShape(typeof maternalName === 'string')

  return {
    id: userId,
    grado: rank,
    nombre: firstName,
    apellidoPaterno: paternalName,
    apellidoMaterno: maternalName,
  }
}

function validatePolygons(value: unknown): Polygon[] {
  requireShape(isUnknownArray(value))
  const polygons: Polygon[] = value.map((item) => {
    requireShape(isRecord(item))
    const polygonId = item.id_poligono
    const name = item.nombre
    const city = item.ciudad
    requireShape(isSafeId(polygonId))
    requireShape(typeof name === 'string')
    requireShape(typeof city === 'string')

    return { id: polygonId, name, city }
  })

  const ids = new Set(polygons.map((polygon) => polygon.id))
  requireShape(ids.size === polygons.length)
  return polygons
}

export function validateLessonSummary(value: unknown, lessonId: number): LessonSummary {
  requireShape(isRecord(value))
  const responseLessonId = value.id_leccion
  const fractions = value.fracciones
  const shooters = value.tiradores_unicos
  const hits = value.tiros_acertados_total
  const shots = value.tiros_total

  requireShape(isSafeId(responseLessonId) && responseLessonId === lessonId)
  requireShape(isCount(fractions))
  requireShape(isCount(shooters))
  requireShape(isCount(hits))
  requireShape(isCount(shots))

  return {
    id_leccion: responseLessonId,
    fracciones: fractions,
    tiradores_unicos: shooters,
    tiros_acertados_total: hits,
    tiros_total: shots,
  }
}

export async function getAuthContext(connection: ApiConnection): Promise<AuthContext> {
  return validateAuthContext(await getJson('/auth/context/', connection))
}

export async function getLessons(connection: ApiConnection): Promise<Lesson[]> {
  return validateLessons(await getJson('/lecciones/', connection))
}

export async function getLessonSummary(
  lessonId: number,
  connection: ApiConnection,
): Promise<LessonSummary> {
  if (!isSafeId(lessonId)) throw new DashboardApiError('configuration')

  const payload = await getJson(`/lecciones/${lessonId}/resultados-resumen/`, connection)
  return validateLessonSummary(payload, lessonId)
}

export async function getUserProfile(
  userId: number,
  connection: ApiConnection,
): Promise<UserProfile> {
  if (!isSafeId(userId)) throw new DashboardApiError('configuration')

  return validateUserProfile(await getJson(`/usuarios/${userId}/`, connection), userId)
}

export async function getPolygons(connection: ApiConnection): Promise<Polygon[]> {
  return validatePolygons(await getJson('/poligonos/', connection))
}
