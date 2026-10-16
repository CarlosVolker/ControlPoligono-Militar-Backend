/**
 * Contrato de contexto de autenticación — OP-AUT-002, `GET /api/auth/context/`.
 *
 * Fuentes: `docs/specs/final-frontend/contracts/auth-context.md` (respuesta exacta)
 * y el predicado real de borde en `src/api/dashboard.js` (`validateAuthContext`).
 *
 * Reconciliación contrato ↔ JS actual: la spec declara `rut?`, `tenant.code?`,
 * `tenant.context?`, `active_organization_unit?` y `unit_membership?` como
 * opcionales; el validador actual exige la PRESENCIA de cada clave (valor `null`
 * admitido, clave ausente → `DashboardApiError('schema')`). Estos tipos modelan
 * la SALIDA validada del borde, no la respuesta cruda del backend: la entrada
 * cruda sigue siendo `unknown` hasta la validación tipada del paso 3
 * (`api/dashboard.ts`, TD§13). Prohibido casteos sobre datos sin validar.
 *
 * Los campos conservan snake_case porque es el shape wire que el validador
 * acepta tal cual; no se renombra en el borde de lectura de contexto.
 */

/** Usuario del contexto. `rut` nullable por diseño del backend (R-SES). */
export interface AuthContextUser {
  id_usuario: number
  rut: string | null
  must_change_password: boolean
}

/** Tenant resuelto por middleware desde `X-Tenant-Code` (TD§2). */
export interface AuthContextTenant {
  code: string | null
  context: string | null
}

/** Pertenencia del usuario a la unidad activa. `id` y `unit_*` no nullables según el predicado actual. */
export interface AuthContextUnitMembership {
  id: number
  unit_code: string
  unit_name: string
}

/** Asignación rol↔scope↔unidad. Un `is_primary === true` marca la asignación primaria. */
export interface AuthContextAssignment {
  role: string
  scope: string | null
  organization_unit: string | null
  is_primary: boolean
}

/**
 * Salida validada de `GET /api/auth/context/` (OP-AUT-002).
 *
 * Compatibilidad de lectura: `DashboardTopbar.vue`, `ContextCard.vue` y
 * `DashboardSidebar.vue` declaran interfaces locales más anchas/defensivas;
 * este tipo les es asignable sin tocar los componentes.
 * `active_organization_unit`: string | null según el predicado actual
 * (`isNullableString`); los componentes ya toleran también número u objeto.
 */
export interface AuthContext {
  user: AuthContextUser
  tenant: AuthContextTenant
  active_organization_unit: string | null
  unit_membership: AuthContextUnitMembership | null
  scopes: string[]
  permissions: string[]
  assignments: AuthContextAssignment[]
}
