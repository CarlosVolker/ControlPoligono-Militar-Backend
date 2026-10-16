import type { RouteRecordRaw } from 'vue-router'
const ContextLostView = () => import('../views/ContextLostView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')
const ContextView = () => import('../views/context/ContextView.vue')
const LoginView = () => import('../views/auth/LoginView.vue')
const PasswordRequiredView = () => import('../views/auth/PasswordRequiredView.vue')
const RecoveryView = () => import('../views/auth/RecoveryView.vue')
const OrganizationView = () => import('../views/organization/OrganizationView.vue')
const IdentityView = () => import('../views/identity/IdentityView.vue')
const AuthorizationView = () => import('../views/authorization/AuthorizationView.vue')
const ArmoryView = () => import('../views/armory/ArmoryView.vue')
const ExercisesView = () => import('../views/exercises/ExercisesView.vue')
const ShootingView = () => import('../views/shooting/ShootingView.vue')
const PersonalizerView = () => import('../views/appearance/PersonalizerView.vue')
const AccountView = () => import('../views/account/AccountView.vue')
import { AUDIT_ROLE_CONTRACT, PERMISSION_CODE } from '../permissions/catalog'
import {
  visibilityClosed,
  visibilityForPermission,
  visibilityForRoleContract,
  visibilityForSession,
  visibilityForTenantRead,
  visibilityPublic,
} from './visibility'

export const ROUTE_NAMES = {
  DASHBOARD: 'dashboard',
  LOGIN: 'login',
  RECOVERY: 'recovery',
  PASSWORD_REQUIRED: 'password-required',
  CONTEXT: 'context',
  CONTEXT_LOST: 'context-lost',
  NOT_FOUND: 'not-found',
  PERSONALIZER: 'personalizador',
  ACCOUNT: 'cuenta',
  UNITS: 'unidades',
  UNIT_DETAIL: 'unidad-detalle',
  PRECINCTS: 'recintos',
  PRECINCT_DETAIL: 'recinto-detalle',
  POSITIONS: 'puestos',
  POSITION_DETAIL: 'puesto-detalle',
  MEMBERSHIPS: 'membresias',
  PEOPLE: 'personas',
  PERSON_DETAIL: 'persona-detalle',
  ROLES: 'roles',
  SCOPES: 'scopes',
  PERMISSIONS: 'permisos',
  OVERRIDES: 'overrides',
  ARMORIES: 'armerias',
  WEAPONS: 'armas',
  WEAPON_DETAIL: 'arma-detalle',
  CALIBERS: 'calibres',
  POLYGONS: 'poligonos',
  POLYGON_DETAIL: 'poligono-detalle',
  LESSONS: 'lecciones',
  LESSON_DETAIL: 'leccion-detalle',
  FRACTION_DETAIL: 'fraccion-detalle',
  RESULTS_CAPTURE: 'captura-resultados',
  EXERCISES: 'ejercicios',
  EXERCISE_DETAIL: 'ejercicio-detalle',
  MUNITION_CONSUMPTION: 'consumos-municion',
  WEAPON_CONSUMPTION: 'consumos-arma',
  AUDIT: 'auditoria',
} as const

export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES]

// Título humano de cada ruta (WCAG 2.4.2). El `Record` es exhaustivo a
// propósito: una ruta nueva sin título no compila. Formato «Grupo · Superficie».
export const ROUTE_TITLES: Record<RouteName, string> = {
  [ROUTE_NAMES.DASHBOARD]: 'Inicio',
  [ROUTE_NAMES.LOGIN]: 'Iniciar sesión',
  [ROUTE_NAMES.RECOVERY]: 'Recuperar acceso',
  [ROUTE_NAMES.PASSWORD_REQUIRED]: 'Cambio de contraseña requerido',
  [ROUTE_NAMES.CONTEXT]: 'Contexto',
  [ROUTE_NAMES.CONTEXT_LOST]: 'Contexto perdido',
  [ROUTE_NAMES.NOT_FOUND]: 'Página no encontrada',
  [ROUTE_NAMES.PERSONALIZER]: 'Personalizador de apariencia',
  [ROUTE_NAMES.ACCOUNT]: 'Mi cuenta',
  [ROUTE_NAMES.UNITS]: 'Organización · Unidades',
  [ROUTE_NAMES.UNIT_DETAIL]: 'Organización · Unidad',
  [ROUTE_NAMES.PRECINCTS]: 'Organización · Recintos',
  [ROUTE_NAMES.PRECINCT_DETAIL]: 'Organización · Recinto',
  [ROUTE_NAMES.POSITIONS]: 'Organización · Puestos',
  [ROUTE_NAMES.POSITION_DETAIL]: 'Organización · Puesto',
  [ROUTE_NAMES.MEMBERSHIPS]: 'Organización · Membresías',
  [ROUTE_NAMES.PEOPLE]: 'Personas y autorización · Personas',
  [ROUTE_NAMES.PERSON_DETAIL]: 'Personas y autorización · Persona',
  [ROUTE_NAMES.ROLES]: 'Personas y autorización · Roles',
  [ROUTE_NAMES.SCOPES]: 'Personas y autorización · Alcances',
  [ROUTE_NAMES.PERMISSIONS]: 'Personas y autorización · Permisos',
  [ROUTE_NAMES.OVERRIDES]: 'Personas y autorización · Permisos individuales',
  [ROUTE_NAMES.ARMORIES]: 'Almacén · Armerías',
  [ROUTE_NAMES.WEAPONS]: 'Almacén · Armas',
  [ROUTE_NAMES.WEAPON_DETAIL]: 'Almacén · Arma',
  [ROUTE_NAMES.CALIBERS]: 'Almacén · Calibres',
  [ROUTE_NAMES.POLYGONS]: 'Tiro · Polígonos',
  [ROUTE_NAMES.POLYGON_DETAIL]: 'Tiro · Polígono',
  [ROUTE_NAMES.LESSONS]: 'Tiro · Lecciones',
  [ROUTE_NAMES.LESSON_DETAIL]: 'Tiro · Lección',
  [ROUTE_NAMES.FRACTION_DETAIL]: 'Tiro · Fracción',
  [ROUTE_NAMES.RESULTS_CAPTURE]: 'Tiro · Captura de resultados',
  [ROUTE_NAMES.EXERCISES]: 'Ejercicios',
  [ROUTE_NAMES.EXERCISE_DETAIL]: 'Ejercicios · Detalle',
  [ROUTE_NAMES.MUNITION_CONSUMPTION]: 'Ejercicios · Consumos de munición',
  [ROUTE_NAMES.WEAPON_CONSUMPTION]: 'Ejercicios · Consumos por arma',
  [ROUTE_NAMES.AUDIT]: 'Auditoría',
}

// Criterio de visibilidad por ruta (plan frontend-permission-navigation §4):
// declarado en la propia ruta para que menú (DashboardSidebar) y superficie de
// composición (App) resuelvan con el MISMO criterio. Origen: tabla de menú de
// `docs/specs/final-frontend/experience/navigation.md:80-104` contra los
// permission-codes verificados en `apps/authorization/permissions.py:36-95` y
// la columna de control de `docs/specs/final-frontend/backend-inventory.md`.
// Las rutas de detalle comparten el criterio de lectura de su superficie lista
// (mapping verificado: position/range/shooting_session/shooting_fraction:read
// → view_unit; user:read → view_personnel_basic; weapon/armory:read →
// view_warehouse; consumo_*/calibre:read → view_exercises; ejercicio:read →
// view_exercises). Las rutas nuevas SIN criterio fundado quedan `closed`
// (fail-closed, AC-1); `/personas/overrides` es el caso IsTenantAdmin no
// documentable en cliente (límite: docs/bugs/backend-debt.md §1).
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: ROUTE_NAMES.DASHBOARD,
    component: DashboardView,
    // Menú: «sesión + tenant» (navigation.md:82). El guard vigente exige la
    // consolidación de tenant/contexto para este destino (guards.ts:80-81);
    // `requiresTenant` permanece implícito, intacto.
    meta: { visibility: visibilityForSession(true) },
  },
  {
    path: '/login',
    name: ROUTE_NAMES.LOGIN,
    component: LoginView,
    meta: { visibility: visibilityPublic() },
  },
  {
    path: '/recuperar',
    name: ROUTE_NAMES.RECOVERY,
    component: RecoveryView,
    meta: { visibility: visibilityPublic() },
  },
  {
    path: '/password-required',
    name: ROUTE_NAMES.PASSWORD_REQUIRED,
    component: PasswordRequiredView,
    meta: { visibility: visibilityPublic() },
  },
  {
    path: '/contexto',
    name: ROUTE_NAMES.CONTEXT,
    component: ContextView,
    // Control de sesión (navigation.md:101): visible con principal; resuelto
    // por el guard vigente, sin snapshot privilegiado.
    meta: { visibility: visibilityForSession() },
  },
  {
    path: '/contexto-perdido',
    name: ROUTE_NAMES.CONTEXT_LOST,
    component: ContextLostView,
    meta: { visibility: visibilityPublic() },
  },
  {
    path: '/personalizador',
    name: ROUTE_NAMES.PERSONALIZER,
    component: PersonalizerView,
    // Preferencias de la propia cuenta: IA sin tenant (navigation.md:102).
    meta: { requiresTenant: false, visibility: visibilityForSession() },
  },
  {
    path: '/cuenta',
    name: ROUTE_NAMES.ACCOUNT,
    component: AccountView,
    // Self-service del principal (plan frontend-account-self-service §4):
    // clasificación principal-only por precedente /personalizador; la rama
    // del guard (guards.ts:143-158) ya exige identidad, deriva el forzado a
    // /password-required y conserva el retorno. No exige permisos
    // administrativos ni tenant para abrir la superficie (degrada con estado
    // explícito + enlace /contexto).
    meta: { requiresTenant: false, visibility: visibilityForSession() },
  },
  {
    path: '/organizacion/unidades',
    name: ROUTE_NAMES.UNITS,
    component: OrganizationView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_UNIT) },
  },
  {
    path: '/organizacion/unidades/:idUnidad',
    name: ROUTE_NAMES.UNIT_DETAIL,
    component: OrganizationView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_UNIT) },
  },
  {
    path: '/organizacion/recintos',
    name: ROUTE_NAMES.PRECINCTS,
    component: OrganizationView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_RECINTO) },
  },
  {
    path: '/organizacion/recintos/:idRecinto',
    name: ROUTE_NAMES.PRECINCT_DETAIL,
    component: OrganizationView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_RECINTO) },
  },
  {
    path: '/organizacion/puestos',
    name: ROUTE_NAMES.POSITIONS,
    component: IdentityView,
    // position:read → view_unit (navigation.md:85, permissions.py:73).
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_UNIT) },
  },
  {
    path: '/organizacion/puestos/:idPosicion',
    name: ROUTE_NAMES.POSITION_DETAIL,
    component: IdentityView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_UNIT) },
  },
  {
    path: '/organizacion/membresias',
    name: ROUTE_NAMES.MEMBERSHIPS,
    component: IdentityView,
    // ViewSet con resource_name='position' (navigation.md:86, T-06) → view_unit.
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_UNIT) },
  },
  {
    path: '/personas',
    name: ROUTE_NAMES.PEOPLE,
    component: IdentityView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_PERSONNEL_BASIC) },
  },
  {
    path: '/personas/roles',
    name: ROUTE_NAMES.ROLES,
    component: AuthorizationView,
    // OP-ROL-001: IA+TA, lectura abierta por contrato (backend-inventory:82).
    meta: { requiresTenant: true, visibility: visibilityForTenantRead() },
  },
  {
    path: '/personas/scopes',
    name: ROUTE_NAMES.SCOPES,
    component: AuthorizationView,
    // OP-SCP-001/002: IA+TA, solo lectura (backend-inventory:88-89).
    meta: { requiresTenant: true, visibility: visibilityForTenantRead() },
  },
  {
    path: '/personas/permisos',
    name: ROUTE_NAMES.PERMISSIONS,
    component: AuthorizationView,
    // OP-PRM-001 catálogo: IA+TA (backend-inventory:150). Las pestañas de
    // matriz (OP-RPR-*, IsTenantAdmin) quedan gating interno de la vista:
    // predicado no documentable en cliente → límite registrado (navigation.md:90).
    meta: { requiresTenant: true, visibility: visibilityForTenantRead() },
  },
  {
    path: '/personas/overrides',
    name: ROUTE_NAMES.OVERRIDES,
    component: AuthorizationView,
    // OP-OVR-001…006: IA+TA+TAdmin (backend-inventory:90-95). Predicado
    // `IsTenantAdmin` no documentable en cliente + exactitud con overrides
    // BLOCKED_BACKEND (backend-debt §1) → sin criterio fundado: fail-closed
    // permanente, cero probing, contenedor neutral con limitación (§4).
    meta: { requiresTenant: true, visibility: visibilityClosed() },
  },
  {
    path: '/personas/:idUsuario',
    name: ROUTE_NAMES.PERSON_DETAIL,
    component: IdentityView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_PERSONNEL_BASIC) },
  },
  {
    path: '/almacen/armerias',
    name: ROUTE_NAMES.ARMORIES,
    component: ArmoryView,
    // armory:read → view_warehouse (permissions.py:50, navigation.md:92).
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_WAREHOUSE) },
  },
  {
    path: '/almacen/armas',
    name: ROUTE_NAMES.WEAPONS,
    component: ArmoryView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_WAREHOUSE) },
  },
  {
    path: '/almacen/armas/:idArma',
    name: ROUTE_NAMES.WEAPON_DETAIL,
    component: ArmoryView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_WAREHOUSE) },
  },
  {
    path: '/almacen/calibres',
    name: ROUTE_NAMES.CALIBERS,
    component: ArmoryView,
    // calibre:read → view_exercises (permissions.py:93, navigation.md:94).
    // La mutación calibre (super_admin) es gating de acción en ArmoryView, no
    // criterio de ruta.
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_EXERCISES) },
  },
  {
    path: '/tiro/poligonos',
    name: ROUTE_NAMES.POLYGONS,
    component: ShootingView,
    // range:read → view_unit (permissions.py:54, navigation.md:95).
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_UNIT) },
  },
  {
    path: '/tiro/poligonos/:idPoligono',
    name: ROUTE_NAMES.POLYGON_DETAIL,
    component: ShootingView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_UNIT) },
  },
  {
    path: '/tiro/lecciones',
    name: ROUTE_NAMES.LESSONS,
    component: ShootingView,
    // shooting_session:read → view_unit (permissions.py:58, navigation.md:96).
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_UNIT) },
  },
  {
    path: '/tiro/lecciones/:idLeccion',
    name: ROUTE_NAMES.LESSON_DETAIL,
    component: ShootingView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_UNIT) },
  },
  {
    path: '/tiro/lecciones/:idLeccion/fracciones/:idFraccion',
    name: ROUTE_NAMES.FRACTION_DETAIL,
    component: ShootingView,
    // shooting_fraction:read → view_unit (permissions.py:63). No es entrada de
    // menú (navigation.md:111); el criterio funda el deep-link.
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_UNIT) },
  },
  {
    path: '/tiro/fracciones/:idFraccion/resultados',
    name: ROUTE_NAMES.RESULTS_CAPTURE,
    component: ShootingView,
    // Superficie de captura sobre la fracción: el acceso a la fracción se
    // funda en shooting_fraction:read → view_unit; la escritura
    // (score_shooters) sigue siendo gating de acción en la vista (AC-7, 1:1).
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_UNIT) },
  },
  {
    path: '/tiro/ejercicios',
    name: ROUTE_NAMES.EXERCISES,
    component: ExercisesView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_EXERCISES) },
  },
  {
    path: '/tiro/ejercicios/:idEjercicio',
    name: ROUTE_NAMES.EXERCISE_DETAIL,
    component: ExercisesView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_EXERCISES) },
  },
  {
    path: '/tiro/consumos-municion',
    name: ROUTE_NAMES.MUNITION_CONSUMPTION,
    component: ExercisesView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_EXERCISES) },
  },
  {
    path: '/tiro/consumos-arma',
    name: ROUTE_NAMES.WEAPON_CONSUMPTION,
    component: ExercisesView,
    meta: { requiresTenant: true, visibility: visibilityForPermission(PERMISSION_CODE.VIEW_EXERCISES) },
  },
  {
    path: '/auditoria',
    name: ROUTE_NAMES.AUDIT,
    component: AuthorizationView,
    // Único criterio role-based documentado del cliente: OP-AUT-004
    // (tenant_admin/super_admin/auditor) sobre `assignments` validados (AC-4).
    meta: { requiresTenant: true, visibility: visibilityForRoleContract(AUDIT_ROLE_CONTRACT) },
  },
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAMES.NOT_FOUND,
    component: NotFoundView,
    meta: { visibility: visibilityPublic() },
  },
]

export default routes
