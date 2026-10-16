/**
 * Catálogo compartido de permission-codes y códigos de rol (plan
 * `docs/specs/frontend-permission-navigation.md`, F1/F2, AC-7).
 *
 * Fuente única de verdad del cliente para los códigos que usan las vistas de
 * negocio y los criterios de visibilidad de rutas/menú. Los valores son
 * literales verificados contra `RESOURCE_ACTION_TO_PERMISSION`
 * (`apps/authorization/permissions.py:36-95`) y la columna de control de
 * `docs/specs/final-frontend/backend-inventory.md`. Prohibido renombrar o
 * reinterpretar: el backend es la autoridad; el cliente sólo espeja el contrato.
 *
 * AC-6: la exactitud con `UserPermissionOverride` queda BLOCKED_BACKEND
 * (`docs/bugs/backend-debt.md` §1). Este catálogo no resuelve overrides ni
 * replica política de autorización: sólo declara códigos del contrato.
 */

export const PERMISSION_CODE = {
  // Organización (organization_unit:* / recinto:*)
  VIEW_UNIT: 'view_unit',
  CREATE_UNIT: 'create_unit',
  UPDATE_UNIT: 'update_unit',
  DELETE_UNIT: 'delete_unit',
  VIEW_RECINTO: 'view_recinto',
  MANAGE_RECINTO: 'manage_recinto',
  // Personas (user:* / position:*)
  VIEW_PERSONNEL_BASIC: 'view_personnel_basic',
  CREATE_USERS: 'create_users',
  UPDATE_USERS: 'update_users',
  DISABLE_USERS: 'disable_users',
  ASSIGN_POSITIONS: 'assign_positions',
  REVOKE_POSITIONS: 'revoke_positions',
  // Almacén (armory:read / weapon:read / calibre:manage)
  VIEW_WAREHOUSE: 'view_warehouse',
  MANAGE_CALIBRE: 'manage_calibre',
  // Tiro (range:* / shooting_session:* / shooting_fraction:* / shooting_result:*)
  CREATE_SHOOTING_LESSONS: 'create_shooting_lessons',
  UPDATE_SHOOTING_LESSONS: 'update_shooting_lessons',
  DELETE_SHOOTING_LESSONS: 'delete_shooting_lessons',
  SCORE_SHOOTERS: 'score_shooters',
  // Ejercicios y calibres (ejercicio_militar:* / consumo_*:* / calibre:read)
  VIEW_EXERCISES: 'view_exercises',
  CREATE_EXERCISES: 'create_exercises',
  UPDATE_EXERCISES: 'update_exercises',
  DELETE_EXERCISES: 'delete_exercises',
} as const

export type PermissionCode = (typeof PERMISSION_CODE)[keyof typeof PERMISSION_CODE]

/**
 * Códigos de rol documentados por contratos vigentes. Se usan SOLO donde un
 * contrato vigente declara un predicado por rol (AC-4): bitácora OP-AUT-004
 * y mutaciones de calibre (`docs/specs/final-frontend/coverage.md`:
 * OP-CAL-002/004/005/006 sólo `super_admin`). No es una whitelist global de
 * privilegios: el gating por permiso atómico nunca consulta roles.
 */
export const ROLE_CODE = {
  TENANT_ADMIN: 'tenant_admin',
  SUPER_ADMIN: 'super_admin',
  AUDITOR: 'auditor',
} as const

export type RoleCode = (typeof ROLE_CODE)[keyof typeof ROLE_CODE]

/** Predicado role-based del contrato OP-AUT-004 (`GET /auth/audit-log/`). */
export const AUDIT_ROLE_CONTRACT: readonly RoleCode[] = [
  ROLE_CODE.TENANT_ADMIN,
  ROLE_CODE.SUPER_ADMIN,
  ROLE_CODE.AUDITOR,
]

/**
 * Literales de gating existentes en el baseline que NO son permission-codes
 * del catálogo backend. Se conservan 1:1 (AC-7: mismos códigos, mismo
 * comportamiento) mientras el plan hermano o el backend resuelvan el defecto.
 * Reportado en el cierre; nunca criterio de menú/ruta.
 */
export const VIEW_GATE_LITERAL = {
  /** Literal en `ShootingView` (línea base); no aparece en `permissions.py`. */
  ORGANIZATION_UNIT_READ: 'organization_unit:read',
} as const
