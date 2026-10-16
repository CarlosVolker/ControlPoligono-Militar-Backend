/**
 * Shapes del dashboard de lectura (fase base, plan `frontend-build-base` §5#1).
 *
 * Fuentes: validadores y mapeos reales de `src/api/dashboard.js`
 * (`validateLessons`, `validateLessonSummary`, `validateUserProfile`,
 * `validatePolygons`) y el estado vivo de `src/stores/dashboard.js`.
 *
 * Modelan la SALIDA validada del borde. El JSON crudo del `fetch` sigue siendo
 * `unknown` hasta `api/dashboard.ts` (paso 3, TD§13): forma inválida →
 * `DashboardApiError('schema')`, sin pintado parcial ni ceros falsos.
 *
 * Convención: los shapes leídos crudos del backend conservan snake_case
 * (contrato wire validado tal cual); los shapes MAPEADOS por los validadores
 * actuales (`UserProfile`, `Polygon`) conservan el renaming real del JS.
 */

/** Fecha calendario validada por `isDate`: formato estricto `YYYY-MM-DD` (alias documental, no estructural). */
export type IsoDate = string

/** Kind del error de borde, espejo de `DashboardApiError.kind` en el JS actual. */
export const DASHBOARD_API_ERROR_KIND = {
  HTTP: 'http',
  SCHEMA: 'schema',
  NETWORK: 'network',
  CONFIGURATION: 'configuration',
} as const

export type DashboardApiErrorKind =
  (typeof DASHBOARD_API_ERROR_KIND)[keyof typeof DASHBOARD_API_ERROR_KIND]

/** Estado global del dashboard (store `status`). Terminales reales del JS actual. */
export const DASHBOARD_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  EMPTY: 'empty',
  ERROR: 'error',
  SESSION_REQUIRED: 'session-required',
  PASSWORD_REQUIRED: 'password-required',
  CONTEXT_DENIED: 'context-denied',
} as const

export type DashboardStatus =
  (typeof DASHBOARD_STATUS)[keyof typeof DASHBOARD_STATUS]

/** Estado por área de lectura (store `lessonsStatus`/`summaryStatus`/`profileStatus`/`polygonsStatus`). */
export const AREA_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  EMPTY: 'empty',
  DENIED: 'denied',
  ERROR: 'error',
} as const

export type AreaStatus = (typeof AREA_STATUS)[keyof typeof AREA_STATUS]

/** Terminal de la resolución de contexto que desbloquea el guard del dashboard. */
export const CONTEXT_RESOLUTION_STATUS = {
  BOOTING: 'booting',
  READY: 'ready',
  FAILURE: 'failure',
} as const

export type ContextResolutionStatus =
  (typeof CONTEXT_RESOLUTION_STATUS)[keyof typeof CONTEXT_RESOLUTION_STATUS]

/**
 * Conexión efectiva para lecturas GET del dashboard (parámetro `connection` del
 * JS actual). `tenantCode` se envía como `X-Tenant-Code` (TD§2); `unitCode` se
 * envía como `X-Org-Unit-Code` cuando está configurado. `signal` propaga el
 * `AbortController` anti-carrera.
 */
export interface ApiConnection {
  tenantCode: string
  unitCode: string
  signal?: AbortSignal | null
}

/**
 * Lección validada (`GET /api/lecciones/`). Enteros seguros; `id_leccion` y
 * `id_poligono` estrictamente positivos (predicado `isSafeId`).
 * `cant_tiros_*`/`distancia`: enteros seguros sin cota de signo declarada por el
 * validador actual — no se inventa una cota que el contrato no impone.
 */
export interface Lesson {
  id_leccion: number
  id_poligono: number
  fecha_tiro: IsoDate
  numero_orden: string | null
  fecha_orden: IsoDate | null
  tipo_tiro: string | null
  cant_tiros_cereo: number
  cant_tiros_leccion: number
  distancia: number
  unidades_participantes_codes: string[]
}

/**
 * Resumen de lección validado (`GET /api/lecciones/{id}/resultados-resumen/`).
 * Enteros seguros `>= 0` (predicado explícito del JS actual). `tiradores_unicos === 0`
 * es el terminal `empty` del área de resumen, no un error.
 */
export interface LessonSummary {
  id_leccion: number
  fracciones: number
  tiradores_unicos: number
  tiros_acertados_total: number
  tiros_total: number
}

/**
 * Perfil de usuario MAPEADO por `validateUserProfile` (keys camelCase reales del
 * JS actual). Se verifica `id_usuario === requestedUserId` en el borde.
 */
export interface UserProfile {
  id: number
  grado: string | null
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
}

/** Polígono MAPEADO por `validatePolygons` (`id_poligono→id`, `nombre→name`, `ciudad→city`). */
export interface Polygon {
  id: number
  name: string
  city: string
}

/**
 * Índice equivalente al computed `polygonsById` del store: clave `String(id)`.
 * Los componentes actuales (`ActiveLesson`, `LessonList`) aceptan claves
 * `string | number` y variantes `nombre`/`nombre_poligono`/`name` opcionales;
 * este tipo les es asignable sin reescribirlos.
 */
export type PolygonLookup = Record<string, Polygon | undefined>
