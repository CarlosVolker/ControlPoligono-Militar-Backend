---
spec_meta: "../../spec-meta.yaml"
---

# Pantallas — Autorización: RBAC, matrices, overrides y auditoría

> 📜 Tomo de catálogo del workstream `full-frontend-screens-recovery`. Contratos enlazados: [RBAC y catálogos](../../contracts/authorization.md), [auth y auditoría](../../contracts/auth-context.md). Estos recursos se rigen por clases `IsAuthenticated`/`HasTenantAccess`/`IsTenantAdmin`, no por el mapa `resource:action → permission_code`; no se inventa ningún código de permiso para ellos. Convenciones generales: [`../screens.md`](../screens.md).

## Índice

1. [SCREEN-ROLES](#screen-roles--roles)
2. [SCREEN-SCOPES](#screen-scopes--scopes)
3. [SCREEN-PERMISSIONS](#screen-permissions--permisos-y-matrices)
4. [SCREEN-OVERRIDES](#screen-overrides--overrides-por-persona)
5. [SCREEN-AUDIT](#screen-audit--bitácora-de-auditoría)

---

### SCREEN-ROLES — Roles

| Atributo | Valor |
|---|---|
| Propósito | Catálogo de roles del sistema de acceso y su administración (alta/edición/baja) para el contexto administrativo. |
| Ruta | `/personas/roles` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Autorización › Roles. |
| Fuente DS | `tables-basic.html` (listado), `ui-modal.html` + `forms-basic.html`/`forms-validation.html` (alta/edición), `ui-badge.html` (`is_active`, `is_system`), confirmación destructiva en `ui-modal.html`. |

**Datos y operaciones.** Contrato: [roles, scopes y permisos](../../contracts/authorization.md#roles-scopes-y-permisos).

- `OP-ROL-001` `GET /authz/roles/` — listado (lectura abierta a autenticados con tenant).
- `OP-ROL-002` `POST /authz/roles/` — alta (sólo contexto administrativo).
- `OP-ROL-003` `GET /authz/roles/{id}/` — lectura de detalle para prefill.
- `OP-ROL-004` / `OP-ROL-005` `PUT`/`PATCH` — edición compartida.
- `OP-ROL-006` `DELETE /authz/roles/{id}/` — baja con confirmación destructiva.

**Acciones y formularios.** Alta/edición: `code`, `name` requeridos; `description`, `is_active`, `is_system` opcionales escribibles según contrato; `id` sólo lectura (`R-DOM-AZ-001`). Las mutaciones sólo se ofrecen al contexto administrativo; un `403` sigue siendo denegación.

**Controles de acceso.** Lectura IA+TA; mutación IA+TA+`IsTenantAdmin` (inventario). La UI anticipa visibilidad por contexto; la autoridad es el backend.

**Estados y criterios observables.** Roles de sistema identificados con badge; catálogo vacío ≠ error; guardado hasta respuesta; éxito refresca listado y selectores dependientes (p. ej. selectores de rol de asignaciones, vía catálogo).

**Navegación.** Atrás ⇒ menú Autorización. Enlaces: rol → sus permisos en la matriz de SCREEN-PERMISSIONS (deep link con el rol preseleccionado por param de ruta si la matriz lo admite). Desde SCREEN-POSITION-DETAIL se enlaza al rol del puesto.

---

### SCREEN-SCOPES — Scopes

| Atributo | Valor |
|---|---|
| Propósito | Catálogo de sólo lectura de políticas de alcance (`solo_propio`, `unidad_propia`, `unidad_y_descendientes`, `solo_agregado`, `todo_recinto`, según devuelva el backend). |
| Ruta | `/personas/scopes` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Autorización › Scopes. |
| Fuente DS | `tables-basic.html` o `ui-list-group.html` + `ui-card.html`; sin botones de escritura (`R-RES-08`). |

**Datos y operaciones.** Contrato: [roles, scopes y permisos](../../contracts/authorization.md#roles-scopes-y-permisos) (fila ScopePolicy).

- `OP-SCP-001` `GET /authz/scopes/` — listado.
- `OP-SCP-002` `GET /authz/scopes/{id}/` — detalle (lectura).

**Acciones y formularios.** Ninguna de escritura: `ReadOnlyModelViewSet`; la pantalla no renderiza alta, edición ni eliminación (`R-DOM-AZ-002`, `R-RES-08`).

**Controles de acceso.** IA+TA, sólo lectura (inventario).

**Estados y criterios observables.** Campos `id`, `code`, `name`, `description` como los devuelve el contrato; ausentes `—`.

**Navegación.** Atrás ⇒ menú Autorización. Enlace desde selectores de scope (puestos/asignaciones) para explicar el alcance elegido.

---

### SCREEN-PERMISSIONS — Permisos y matrices

| Atributo | Valor |
|---|---|
| Propósito | Consultar el catálogo de permisos atómicos y administrar las matrices rol→permiso y puesto→permiso; consultar personas por unidad. |
| Ruta | `/personas/permisos` — fijada en `technical-design.md` §4. `meta.requiresTenant`. Pestañas internas (no sub-rutas): catálogo, matriz rol, matriz puesto, personas por unidad. |
| Params / breadcrumbs | Sin params obligatorios; se admite query de presentación para la pestaña activa sin violar `R-ROUTER-02` (los identificadores de recurso no viajan por query). Breadcrumb: Inicio › Autorización › Permisos. |
| Fuente DS | `ui-tabs.html` (pestañas), `tables-basic.html`/`tables-gridjs.html` (matrices y catálogo), `ui-modal.html` + `forms-basic.html` (alta/edición de filas de matriz), `ui-tooltips.html` (descripciones de acción del catálogo), `ui-badge.html` (categorías, `allowed`). |

**Datos y operaciones.** Contratos: [roles, scopes y permisos](../../contracts/authorization.md#roles-scopes-y-permisos), [catálogos y consultas](../../contracts/authorization.md#catálogos-y-consultas-operativas).

- Pestaña catálogo: `OP-PRM-001` `GET /authz/permissions/`, `OP-PRM-002` `GET /authz/permissions/{id}/` — sólo permisos activos, sólo lectura (`R-DOM-AZ-002`, `R-RES-19`; editar el catálogo no existe como capacidad, `requirements.md` §8/D-02).
- Fill transversal: `OP-AZC-001` `GET /authz/catalog/` — `{roles, scopes, resources, actions}` para poblar selectores y tooltips de las matrices (`technical-design.md` §8; `R-DOM-AZ-006`: una acción catalogada no implica endpoint expuesto).
- Pestaña matriz rol→permiso: `OP-RPR-001`…`OP-RPR-006` (`GET/POST/GET{id}/PUT/PATCH/DELETE /authz/role-permissions/`); `PUT`/`PATCH` comparten editor de fila. Campos: `role`, `permission`, `allowed` escribibles; códigos/nombre/categoría sólo lectura (`R-DOM-AZ-003`). Rol de sistema bloqueado salvo contexto `super_admin` (`R-RES-20`).
- Pestaña matriz puesto→permiso: `OP-PPR-001`…`OP-PPR-006` (`/authz/position-permissions/`); sólo posiciones del tenant; refresco de matriz tras éxito; errores de tenant sin insertar fila local (`R-DOM-AZ-004`).
- Pestaña personas por unidad: `OP-AZC-003` `GET /authz/personas-por-unidad/?unit_code=…&include_descendants=…` — `unit_code` requerido, `include_descendants` opcional; resultados con `user`, unidad personal y assignments; distinguir `400`/`404`/`403` (`R-DOM-AZ-008`). Panel de permisos por unidad (`technical-design.md` §8).

**Acciones y formularios.** Alta/edición/baja de filas de matriz con confirmación cuando `allowed` cambia o se elimina; selectores poblados desde `OP-AZC-001` y catálogos reales (roles, permisos activos, posiciones del tenant).

**Controles de acceso.** Catálogo de permisos: IA+TA sólo lectura. Matrices (`OP-RPR-*`, `OP-PPR-*`): IA+TA+`IsTenantAdmin` (inventario). Personas por unidad: IA+TA. Todo `403` es denegación visible.

**Estados y criterios observables.** Matriz vacía ≠ sin permisos del usuario: es el estado del recurso consultado; guardado hasta respuesta; éxito refresca la pestaña activa; tooltips con `label`/`description` del catálogo.

**Navegación.** Atrás ⇒ menú Autorización. Enlaces: rol → SCREEN-ROLES; puesto → SCREEN-POSITION-DETAIL; persona → SCREEN-USER-DETAIL; unidad → SCREEN-UNIT-DETAIL. Deep link a `/personas/permisos` con pestaña por defecto (catálogo).

---

### SCREEN-OVERRIDES — Overrides por persona

| Atributo | Valor |
|---|---|
| Propósito | Administrar `UserPermissionOverride`: ALLOW/DENY individuales por cuenta, con permiso atómico o por par recurso/acción. |
| Ruta | `/personas/overrides` — **propuesta nueva** (no figura en `technical-design.md` §4; la capacidad existe, `R-RES-09`, y necesita superficie propia). `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Autorización › Overrides. |
| Fuente DS | `tables-basic.html`, `ui-modal.html` + `forms-basic.html` (alta/edición), `ui-badge.html` (ALLOW/DENY), confirmación destructiva en `ui-modal.html`. |

**Datos y operaciones.** Contrato: [overrides y evaluación](../../contracts/authorization.md#overrides-y-evaluación).

- `OP-OVR-001` `GET /authz/overrides/` — listado (cuentas del tenant).
- `OP-OVR-002` `POST /authz/overrides/` — alta.
- `OP-OVR-003` `GET /authz/overrides/{id}/` — lectura para prefill.
- `OP-OVR-004` / `OP-OVR-005` `PUT`/`PATCH` — edición compartida.
- `OP-OVR-006` `DELETE /authz/overrides/{id}/` — baja con confirmación destructiva.

**Acciones y formularios.** Alta/edición: `account` y `allowed` requeridos; `permission`/`permission_code` nullable, `resource`, `action`, `reason` opcionales; `account_rut`, `created_by`, `created_by_rut`, `created_at` sólo lectura — `created_by` lo fija el servidor (`R-DOM-AZ-005`). Selector de cuenta restringido a cuentas del tenant (contrato).

**Controles de acceso.** IA+TA+`IsTenantAdmin` en todo el CRUD (inventario).

**Estados y criterios observables.** La fila muestra el efecto (ALLOW/DENY) con badge semántico; éxito refresca listado; error de tenant/permiso visible sin fila local. La UI recuerda que el orden de evaluación efectivo es bypass `super_admin`, override DENY, override ALLOW, permiso de puesto, permiso de rol, DENY (`technical-design.md`/contrato): el override no es la única capa.

**Navegación.** Atrás ⇒ menú Autorización. Enlace por cuenta → SCREEN-USER-DETAIL. Deep link operativo.

---

### SCREEN-AUDIT — Bitácora de auditoría

| Atributo | Valor |
|---|---|
| Propósito | Consultar las decisiones de acceso registradas por el backend (`AccessAudit`). |
| Ruta | `/auditoria` — fijada en `technical-design.md` §4. `meta.requiresTenant` + rol en {`tenant_admin`, `super_admin`, `auditor`}. |
| Params / breadcrumbs | Sin params; `limit` se controla en la pantalla (no es param de ruta). Breadcrumb: Inicio › Auditoría. |
| Fuente DS | `tables-basic.html` (registros), `ui-badge.html` (`allowed` sí/no), `ui-pagination.html` sólo como referencia visual de corte — la carga es por `limit`, sin paginación inventada; estados estándar. |

**Datos y operaciones.** Contrato: [auditoría](../../contracts/auth-context.md#auditoría).

- `OP-AUT-004` `GET /auth/audit-log/?limit=N` — default `100`, tope superior `500`; respuesta `{count, results:[{created_at, endpoint, action, allowed, reason, organization_unit_code, user_id_value}]}`.

**Acciones y formularios.** Control de `limit` (≤500) y re-consulta; sin escritura: la bitácora es inmutable desde el cliente.

**Controles de acceso.** IA+TA+rol: `403` salvo `tenant_admin`, `super_admin` o `auditor` (contrato; inventario). La entrada de menú sólo aparece para esos roles ([`../navigation.md`](../navigation.md)); un `403` directo es denegación visible, no pantalla vacía (`R-DOM-AZ-010`).

**Estados y criterios observables.** `count` y campos por registro tal como responden; vacío ⇒ estado vacío sin fabricar eventos (`R-DOM-AZ-010`); `reason` literal del backend.

**Navegación.** Atrás ⇒ menú. Enlaces por `organization_unit_code` → SCREEN-UNIT-DETAIL y por `user_id_value` → SCREEN-USER-DETAIL cuando el dato permita resolverlos; si no, texto plano. Deep link operativo para los roles permitidos.
