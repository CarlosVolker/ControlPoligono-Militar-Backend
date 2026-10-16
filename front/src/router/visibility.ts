/**
 * Criterios compartidos de visibilidad por ruta (plan
 * `docs/specs/frontend-permission-navigation.md`, F2/F3/F4).
 *
 * SSOT del criterio: el mismo `RouteVisibility` declarado en `routes.ts`
 * alimenta el filtro del sidebar (F4) y la resolución fail-closed del
 * deep-link denegado en la superficie de composición (F3, App.vue). Menú y
 * rutas comparten el criterio real, no dos implementaciones.
 *
 * Cuatro clases de criterio (§4 de la spec):
 *  (a) `permission`  — permiso atómico presente en `permissions` del snapshot.
 *  (b) `tenantRead`  — principal autenticado con tenant activo para lecturas
 *                      abiertas por contrato (IA+TA: OP-ROL-001, OP-SCP-001/002,
 *                      OP-PRM-001).
 *  (c) `roleContract` — predicado por rol SÓLO donde el contrato vigente lo
 *                      documenta (OP-AUT-004: tenant_admin/super_admin/auditor),
 *                      evaluado sobre `assignments` validados. Nunca whitelist
 *                      global de privilegios (AC-4).
 *  (d) `session`     — sesión/principal (dashboard, contexto, personalizador);
 *                      `public` cubre auth/404/contexto-perdido resueltos por
 *                      el guard existente.
 *
 * `closed` — ruta sin criterio fundado (superficies `IsTenantAdmin` cuyo
 * predicado no es documentable en cliente: overrides; límite registrado en
 * `docs/bugs/backend-debt.md` §1): fail-closed permanente, cero requests de
 * probing, limitación presentada, nunca simulada (AC-1, §4).
 *
 * Fail-closed (AC-1/AC-3): sin snapshot válido de la generación vigente
 * (booting, generación avanzada, contexto fallido) TODA visibilidad
 * privilegiada se resuelve cerrada. La visibilidad cerrada es no-render,
 * nunca disabled, y nunca emite request para averiguar permisos.
 */
import type { AuthContext } from '../types/contexto'
import type { SessionStatus } from '../types/session'
import { SESSION_STATUS } from '../types/session'
import type { PermissionCode, RoleCode } from '../permissions/catalog'

declare module 'vue-router' {
  interface RouteMeta {
    requiresTenant?: boolean
    visibility?: RouteVisibility
  }
}

export const ROUTE_VISIBILITY_KIND = {
  SESSION: 'session',
  PUBLIC: 'public',
  PERMISSION: 'permission',
  TENANT_READ: 'tenantRead',
  ROLE_CONTRACT: 'roleContract',
  CLOSED: 'closed',
} as const

export type RouteVisibilityKind = (typeof ROUTE_VISIBILITY_KIND)[keyof typeof ROUTE_VISIBILITY_KIND]

/** Clase (d): principal autenticado; dashboard exige además tenant capturado. */
export interface SessionVisibility {
  kind: typeof ROUTE_VISIBILITY_KIND.SESSION
  requiresActiveTenant?: boolean
}

/** Superficies públicas resueltas por el guard existente (auth, 404, contexto-perdido). */
export interface PublicVisibility {
  kind: typeof ROUTE_VISIBILITY_KIND.PUBLIC
}

/** Clase (a): permiso atómico del snapshot validado. */
export interface PermissionVisibility {
  kind: typeof ROUTE_VISIBILITY_KIND.PERMISSION
  code: PermissionCode
}

/** Clase (b): lectura abierta por contrato a principal autenticado con tenant activo. */
export interface TenantReadVisibility {
  kind: typeof ROUTE_VISIBILITY_KIND.TENANT_READ
}

/** Clase (c): contrato role-based documentado (único caso vigente: OP-AUT-004). */
export interface RoleContractVisibility {
  kind: typeof ROUTE_VISIBILITY_KIND.ROLE_CONTRACT
  roles: readonly RoleCode[]
}

/** Sin criterio fundado: fail-closed permanente + limitación registrada. */
export interface ClosedVisibility {
  kind: typeof ROUTE_VISIBILITY_KIND.CLOSED
}

export type RouteVisibility =
  | SessionVisibility
  | PublicVisibility
  | PermissionVisibility
  | TenantReadVisibility
  | RoleContractVisibility
  | ClosedVisibility

export function visibilityForPermission(code: PermissionCode): PermissionVisibility {
  return { kind: ROUTE_VISIBILITY_KIND.PERMISSION, code }
}

export function visibilityForTenantRead(): TenantReadVisibility {
  return { kind: ROUTE_VISIBILITY_KIND.TENANT_READ }
}

export function visibilityForRoleContract(roles: readonly RoleCode[]): RoleContractVisibility {
  return { kind: ROUTE_VISIBILITY_KIND.ROLE_CONTRACT, roles }
}

export function visibilityForSession(requiresActiveTenant = false): SessionVisibility {
  return { kind: ROUTE_VISIBILITY_KIND.SESSION, requiresActiveTenant }
}

export function visibilityPublic(): PublicVisibility {
  return { kind: ROUTE_VISIBILITY_KIND.PUBLIC }
}

export function visibilityClosed(): ClosedVisibility {
  return { kind: ROUTE_VISIBILITY_KIND.CLOSED }
}

/**
 * Instantáneos de resolución. Se construye SIEMPRE desde el estado vigente del
 * SessionStore (a `App.vue`/`DashboardSidebar.vue`); nunca desde un snapshot
 * copiado. Estructural: nada de dependencias de store aquí (testable en puro).
 */
export interface VisibilitySnapshot {
  /** Principal autenticado acreditado (identity vigente del store). */
  authenticated: boolean
  /** Tenant capturado no vacío (entrada del flujo de contexto). */
  activeTenant: boolean
  /**
   * Snapshot válido de la generación vigente (AC-3): READY, contexto
   * validado, principal coherente, sin must_change pendiente, sin logout
   * en vuelo y tenant del contexto no vacío. Cualquier otro estado
   * (booting, needs-tenant, failure, context-lost, generación avanzada)
   * es unknown/stale: visibilidad privilegiada cerrada.
   */
  valid: boolean
  permissions: readonly string[]
  roles: readonly string[]
}

export interface VisibilitySnapshotInput {
  status: SessionStatus
  context: AuthContext | null
  principalId: number | null
  tenantCode: string
  logoutBusy: boolean
}

export function buildVisibilitySnapshot(input: VisibilitySnapshotInput): VisibilitySnapshot {
  const context: AuthContext | null = input.context
  const contextTenant = context?.tenant.code?.trim() ?? ''
  const valid = input.status === SESSION_STATUS.READY
    && input.logoutBusy === false
    && context !== null
    && input.principalId !== null
    && context.user.id_usuario === input.principalId
    && context.user.must_change_password === false
    && contextTenant !== ''

  return {
    authenticated: input.principalId !== null,
    activeTenant: input.tenantCode.trim() !== '',
    valid,
    permissions: valid && context !== null ? context.permissions : [],
    roles: valid && context !== null ? context.assignments.map((assignment) => assignment.role) : [],
  }
}

/** Criterio declarado o, ausente el declaration, fail-closed (AC-1: ruta sin criterio fundado). */
export function visibilityOfMeta(meta: RouteMetaLike | undefined): RouteVisibility {
  const declared = meta?.visibility
  return declared ?? { kind: ROUTE_VISIBILITY_KIND.CLOSED }
}

interface RouteMetaLike {
  visibility?: RouteVisibility
}

/**
 * Resolución del criterio compartido. `undefined`/no-declarado se trata como
 * `closed` vía `visibilityOfMeta`; aquí la visibilidad cerrada = no-render
 * (nunca disabled). Las clases (d)/públicas se resuelven con hechos de sesión
 * (no snapshot privilegiado); el guard existente es su gate de montaje.
 */
export function canViewSurface(visibility: RouteVisibility, snapshot: VisibilitySnapshot): boolean {
  switch (visibility.kind) {
    case ROUTE_VISIBILITY_KIND.PUBLIC:
      return true
    case ROUTE_VISIBILITY_KIND.SESSION:
      return snapshot.authenticated
        && (visibility.requiresActiveTenant !== true || snapshot.activeTenant)
    case ROUTE_VISIBILITY_KIND.PERMISSION:
      return snapshot.valid && snapshot.permissions.includes(visibility.code)
    case ROUTE_VISIBILITY_KIND.TENANT_READ:
      return snapshot.valid
    case ROUTE_VISIBILITY_KIND.ROLE_CONTRACT:
      return snapshot.valid
        && snapshot.roles.some((role) => visibility.roles.includes(role as RoleCode))
    case ROUTE_VISIBILITY_KIND.CLOSED:
      return false
    default:
      return false
  }
}

/**
 * Superficie privilegiada: sólo estas clases se interceptan en la superficie
 * de composición con el contenedor neutral (AC-2). `session`/`public` las
 * resuelve la maquinaria de sesión ya vigente (guard) sin montaje protegido
 * adicional.
 */
export function isPrivilegedVisibility(visibility: RouteVisibility): boolean {
  switch (visibility.kind) {
    case ROUTE_VISIBILITY_KIND.PERMISSION:
    case ROUTE_VISIBILITY_KIND.TENANT_READ:
    case ROUTE_VISIBILITY_KIND.ROLE_CONTRACT:
    case ROUTE_VISIBILITY_KIND.CLOSED:
      return true
    default:
      return false
  }
}
