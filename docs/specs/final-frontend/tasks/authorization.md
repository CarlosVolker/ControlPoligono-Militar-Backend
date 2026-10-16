---
spec_meta: "../spec-meta.yaml"
---

# Tasks — Autorización, matrices y auditoría (T-FL-AZ, T-FL-AUD)

> 📜 Yo registro aquí las trece tareas de RBAC y consultas operativas más la bitácora de
> auditoría. Regla de familia conservada del volumen de flujos: un `403` sigue siendo
> denegación visible aunque la UI ya haya ocultado la acción; la matriz de UI nunca
> sustituye la evaluación efectiva del backend. Pasos y shapes **no se copian**: cada
> tarea cita su ancla `FL-*`. Índice y reglas: [../tasks.md](../tasks.md). Ninguna
> tarea está autorizada a ejecutarse.

## Bloque común de la familia

- **Dependencias comunes:** T-CORE-TYPES, T-CORE-HTTP, T-CORE-SESSION, T-CORE-ROUTER
  (`/personas/roles|scopes|permisos|overrides` —declarados antes que
  `/personas/:idUsuario`— y `/auditoria`), T-CORE-UI (tabs, tablas, tooltips, badges).
- **Clases de acceso:** estos recursos se rigen por `IsAuthenticated`/`HasTenantAccess`/
  `IsTenantAdmin`, no por el mapa `resource:action → permission_code`; ninguna tarea
  inventa códigos de permiso para ellos.
- **Archivos probables** (raíz `front/src/`): `api/authorization.ts`,
  `stores/authorization.ts`, `views/autorizacion/RolesView.vue`,
  `views/autorizacion/ScopesView.vue`, `views/autorizacion/PermissionsView.vue`,
  `views/autorizacion/OverridesView.vue`, `views/auditoria/AuditView.vue`,
  `components/authorization/*` (matrices, selectores de catálogo). Todos con
  `<script setup lang="ts">`.
- **Consumo cruzado:** los módulos `api/authorization.ts` de catálogos (OP-AZC-001…004,
  OP-SCP-001, OP-ROL-001) son consumidos por selectores de las familias identidad y
  organización **sin** requerir la UI de esta familia (regla del DAG).
- **Convención de AC:** hogar canónico único por OP.

---

## T-FL-AZ-001 — Consulta de roles

| Campo | Valor |
|---|---|
| Objetivo | Catálogo de roles con badges de estado y de rol de sistema, lectura abierta IA+TA y enlace desde la ficha a su matriz de permisos. |
| Flujo | [FL-AZ-001](../experience/flows/authorization.md#fl-az-001--consulta-de-roles) |
| OP (AC canónicos) | OP-ROL-001, OP-ROL-003 |
| SCREEN | [SCREEN-ROLES](../experience/screens/authorization.md#screen-roles--roles) — DS `tables-basic.html` + `ui-badge.html` |
| Requisitos | R-DOM-AZ-001 faceta de lectura (`code`, `name`, `description`, `is_active`, `is_system`); vacío ⇒ ST-03, sin significar que no existan roles fuera del alcance (R-DOM-AZ-007 análogo). |
| Precondiciones / dependencias | Bloque común. |
| Archivos probables | `views/autorizacion/RolesView.vue`, `api/authorization.ts`. |
| Done when | El catálogo muestra sólo roles devueltos con sus badges; el módulo API sirve de selector de roles a T-FL-IDT-012. |

**Criterios.**

- **AC-OP-ROL-001:** `GET /authz/roles/` ⇒ array con `id` RO, `code`, `name`,
  `description`, `is_active`, `is_system`; `403` ⇒ ST-07; red ⇒ F-06/F-10; vacío ⇒
  ST-03.
- **AC-OP-ROL-003:** la ficha muestra el objeto devuelto y enlaza a la matriz
  rol→permiso (T-FL-AZ-005).

---

## T-FL-AZ-002 — Alta y edición de rol

| Campo | Valor |
|---|---|
| Objetivo | Mutaciones de rol (`code`*, `name`*; `description`, `is_active`, `is_system` opcionales) ofrecidas sólo al contexto administrativo (IA+TA+TAdmin); un `403` por envío sin TAdmin es denegación visible, no ocultación silenciosa. |
| Flujo | [FL-AZ-002](../experience/flows/authorization.md#fl-az-002--alta-y-edición-de-rol) |
| OP (AC canónicos) | OP-ROL-002, OP-ROL-004, OP-ROL-005 |
| SCREEN | [SCREEN-ROLES](../experience/screens/authorization.md#screen-roles--roles) |
| Requisitos | R-DOM-AZ-001 (campos y ofrecimiento restringido al contexto administrativo). |
| Precondiciones / dependencias | T-FL-AZ-001. |
| Archivos probables | `components/authorization/RoleFormModal.vue`. |
| Done when | El catálogo se refresca con el rol devuelto; el éxito refresca además los selectores de rol dependientes al recargarlos. |

**Criterios.**

- **AC-OP-ROL-002 / AC-OP-ROL-004 / AC-OP-ROL-005:** `201`/`200` ⇒ ST-06 y refresco;
  `400` ⇒ F-01; `403` sin TAdmin ⇒ F-02 literal (denegación, no ocultación si el envío
  llegó a ocurrir); red ⇒ F-06; cancelar ⇒ F-09.

---

## T-FL-AZ-003 — Eliminación de rol

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 que identifica el rol y muestra `is_system` como **advertencia informativa**: el contrato no declara para `Role` una restricción de sistema más allá de TAdmin (la restricción `super_admin` documentada es para RolePermission, T-FL-AZ-005); no se inventa un bloqueo que el contrato no declara. |
| Flujo | [FL-AZ-003](../experience/flows/authorization.md#fl-az-003--eliminación-de-rol) |
| OP (AC canónicos) | OP-ROL-006 |
| SCREEN | [SCREEN-ROLES](../experience/screens/authorization.md#screen-roles--roles) |
| Requisitos | R-DOM-AZ-001 faceta de baja; honestidad contractual del flujo. |
| Precondiciones / dependencias | T-FL-AZ-001. |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | El catálogo se refresca sólo tras éxito; la advertencia de `is_system` no afirma un bloqueo no declarado. |

**Criterios.**

- **AC-OP-ROL-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06 y refresco; `403` ⇒ F-02; `404` ⇒
  F-04; red ⇒ F-06 sin borrado local.

---

## T-FL-AZ-004 — Catálogos de scopes y permisos (solo lectura)

| Campo | Valor |
|---|---|
| Objetivo | Catálogos RO de ScopePolicy y Permission (sólo permisos activos) **sin** botones de alta/edición/eliminación; el módulo API alimenta los selectores de scope de las matrices y de asignaciones/puestos. |
| Flujo | [FL-AZ-004](../experience/flows/authorization.md#fl-az-004--catálogos-de-scopes-y-permisos) |
| OP (AC canónicos) | OP-SCP-001, OP-SCP-002, OP-PRM-001, OP-PRM-002 |
| SCREEN | [SCREEN-SCOPES](../experience/screens/authorization.md#screen-scopes--scopes) y pestaña catálogo de [SCREEN-PERMISSIONS](../experience/screens/authorization.md#screen-permissions--permisos-y-matrices) |
| Requisitos | R-DOM-AZ-002 (catálogos RO; prohibido renderizar escritura); R-RES-08/19 vía tomos citantes; editar el catálogo de permisos no existe como capacidad (D-02): la UI no falsifica la mutación. |
| Precondiciones / dependencias | Bloque común. |
| Archivos probables | `views/autorizacion/ScopesView.vue`, pestaña catálogo en `views/autorizacion/PermissionsView.vue`. |
| Done when | Ambas superficies son estrictamente de lectura; el selector de scope de T-FL-IDT-007/012 consume este módulo API. |

**Criterios.**

- **AC-OP-SCP-001 / AC-OP-SCP-002:** `id, code, name, description` RO; sin escritura
  renderizada; vacío ⇒ ST-03.
- **AC-OP-PRM-001 / AC-OP-PRM-002:** `id, code, name, category, description, is_active`
  RO, sólo permisos activos; alimenta selectores de las matrices (T-FL-AZ-005/006).

---

## T-FL-AZ-005 — Gestión de RolePermission (matriz rol→permiso)

| Campo | Valor |
|---|---|
| Objetivo | Matriz con celdas `{role, permission, allowed}` (campos RO resueltos por el servidor), bloqueo visible de celdas de rol de sistema salvo contexto `super_admin` y reversión de la celda al valor confirmado ante fallo (nunca a un optimista). |
| Flujo | [FL-AZ-005](../experience/flows/authorization.md#fl-az-005--matriz-rol--permiso) |
| OP (AC canónicos) | OP-RPR-001, OP-RPR-002, OP-RPR-003, OP-RPR-004, OP-RPR-005, OP-RPR-006 |
| SCREEN | [SCREEN-PERMISSIONS](../experience/screens/authorization.md#screen-permissions--permisos-y-matrices) — pestaña matriz rol, con fill de T-FL-AZ-010 |
| Requisitos | R-DOM-AZ-003 (campos W/RO; bloqueo de sistema salvo `super_admin`); R-RES-07/20 vía tomos citantes. |
| Precondiciones / dependencias | T-FL-AZ-001 (roles), T-FL-AZ-004 (permisos), T-FL-AZ-010 (fill de ejes). |
| Archivos probables | `components/authorization/RolePermissionMatrix.vue`. |
| Done when | Cada celda refleja el registro del servidor; una celda de rol de sistema está deshabilitada fuera de contexto `super_admin`; ante fallo la celda revierte al valor confirmado por el backend. |

**Criterios.**

- **AC-OP-RPR-001 / AC-OP-RPR-003:** lecturas de matriz y fila con campos RO
  (`role_code`, `permission_code`, `permission_name`, `permission_category`); `403` ⇒
  ST-07.
- **AC-OP-RPR-002 / AC-OP-RPR-004 / AC-OP-RPR-005:** marcar/desmarcar ⇒ ST-05 por celda
  → ST-06 y refresco de fila; `400` ⇒ F-01; `403` (rol de sistema sin `super_admin`) ⇒
  F-02 literal; red ⇒ F-06 con reversión al valor confirmado.
- **AC-OP-RPR-006:** quitar concesión con ST-10 ligera sobre la celda; refresco de
  matriz sólo tras éxito; misma restricción de sistema.

---

## T-FL-AZ-006 — Gestión de PositionPermission (matriz puesto→permiso)

| Campo | Valor |
|---|---|
| Objetivo | Matriz de posiciones del tenant `{position, permission, allowed}` con RO resueltos; `400` por puesto fuera de tenant no inserta fila local. |
| Flujo | [FL-AZ-006](../experience/flows/authorization.md#fl-az-006--matriz-puesto--permiso) |
| OP (AC canónicos) | OP-PPR-001, OP-PPR-002, OP-PPR-003, OP-PPR-004, OP-PPR-005, OP-PPR-006 |
| SCREEN | [SCREEN-PERMISSIONS](../experience/screens/authorization.md#screen-permissions--permisos-y-matrices) — pestaña matriz puesto |
| Requisitos | R-DOM-AZ-004 (posición del tenant; refresco tras éxito; error sin fila local). |
| Precondiciones / dependencias | T-FL-AZ-004 (permisos), T-FL-AZ-010 (fill), posiciones desde el módulo API de identidad (OP-POS-001, sin requerir su UI). |
| Archivos probables | `components/authorization/PositionPermissionMatrix.vue`. |
| Done when | La matriz muestra sólo posiciones del tenant devueltas; tras cada mutación exitosa se refresca. |

**Criterios.**

- **AC-OP-PPR-001 / AC-OP-PPR-003:** lecturas con RO (`position_code`,
  `permission_code`, `permission_name`); `403` ⇒ ST-07.
- **AC-OP-PPR-002 / AC-OP-PPR-004 / AC-OP-PPR-005:** `201`/`200` ⇒ ST-06 y refresco;
  `400` (puesto fuera de tenant) ⇒ F-01 **sin** fila local; red ⇒ F-06.
- **AC-OP-PPR-006:** `DELETE` con ST-10 ligera; refresco sólo tras éxito.

---

## T-FL-AZ-007 — Alta y edición de override

| Campo | Valor |
|---|---|
| Objetivo | Overrides por cuenta (`account`*, `allowed`*; `permission`/`permission_code` nullable, `resource`, `action`, `reason` opcionales) con `created_by` fijado por servidor mostrado como metadato RO y rotulación de excepción individual (precedencia DENY sobre ALLOW en la evaluación del backend). |
| Flujo | [FL-AZ-007](../experience/flows/authorization.md#fl-az-007--alta-y-edición-de-override) |
| OP (AC canónicos) | OP-OVR-002, OP-OVR-004, OP-OVR-005 |
| SCREEN | [SCREEN-OVERRIDES](../experience/screens/authorization.md#screen-overrides--overrides-por-persona) |
| Requisitos | R-DOM-AZ-005 (campos; RO de `created_by` y metadatos); cuenta restringida al tenant. |
| Precondiciones / dependencias | T-FL-AZ-009 (listado), selector de cuenta desde datos reales del tenant. |
| Archivos probables | `components/authorization/OverrideFormModal.vue`. |
| Done when | La fila muestra el efecto ALLOW/DENY con badge semántico y `created_by` como metadato RO del servidor; la UI recuerda que el override no es la única capa de evaluación. |

**Criterios.**

- **AC-OP-OVR-002 / AC-OP-OVR-004 / AC-OP-OVR-005:** `201`/`200` ⇒ ST-06 y refresco del
  listado; `400` (account fuera de tenant) ⇒ F-01; `403` ⇒ F-02; red ⇒ F-06 sin fila
  local.

---

## T-FL-AZ-008 — Eliminación de override

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 que identifica cuenta y permiso/recurso; refresco sólo tras éxito. |
| Flujo | [FL-AZ-008](../experience/flows/authorization.md#fl-az-008--eliminación-de-override) |
| OP (AC canónicos) | OP-OVR-006 |
| SCREEN | [SCREEN-OVERRIDES](../experience/screens/authorization.md#screen-overrides--overrides-por-persona) |
| Requisitos | R-RES-24 vía T-CORE-UI. |
| Precondiciones / dependencias | T-FL-AZ-009. |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | El listado se refresca sólo tras la respuesta exitosa. |

**Criterios.**

- **AC-OP-OVR-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06; `403` ⇒ F-02; `404` ⇒ F-04;
  red ⇒ F-06 sin borrado local.

---

## T-FL-AZ-009 — Consulta de overrides

| Campo | Valor |
|---|---|
| Objetivo | Listado y detalle de overrides del tenant con búsqueda client-side. |
| Flujo | [FL-AZ-009](../experience/flows/authorization.md#fl-az-009--consulta-de-overrides) |
| OP (AC canónicos) | OP-OVR-001, OP-OVR-003 |
| SCREEN | [SCREEN-OVERRIDES](../experience/screens/authorization.md#screen-overrides--overrides-por-persona) |
| Requisitos | R-DOM-AZ-005 faceta de lectura; R-RES-22 vía bloque común. |
| Precondiciones / dependencias | Bloque común. |
| Archivos probables | `views/autorizacion/OverridesView.vue`. |
| Done when | La lista muestra los campos RO y W del contrato; vacío=ST-03, denegación=ST-07. |

**Criterios.**

- **AC-OP-OVR-001 / AC-OP-OVR-003:** array/objeto con los campos del contrato; `403` ⇒
  ST-07; `404` ⇒ F-04; red ⇒ F-06/F-10; vacío ⇒ ST-03.

---

## T-FL-AZ-010 — Fill de matriz con catálogo authz

| Campo | Valor |
|---|---|
| Objetivo | `GET /authz/catalog/` rellena los ejes de las matrices (11 recursos, 8 acciones) con `label`/`description` en tooltips; el catálogo es ayuda de selección: no sustituye a `context.permissions` ni prueba que cada acción catalogada tenga endpoint. |
| Flujo | [FL-AZ-010](../experience/flows/authorization.md#fl-az-010--fill-de-matriz-con-catálogo) |
| OP (AC canónicos) | OP-AZC-001 |
| SCREEN | [SCREEN-PERMISSIONS](../experience/screens/authorization.md#screen-permissions--permisos-y-matrices) — fill transversal de matrices |
| Requisitos | R-DOM-AZ-006 (ayuda de selección; acción catalogada ≠ endpoint: `export`/`read_own` figuran sin endpoint implementado). |
| Precondiciones / dependencias | T-FL-AZ-005/006 (matrices consumidoras). |
| Archivos probables | `components/authorization/MatrixFill.ts` (lógica de ejes), tooltips DS `ui-tooltips.html`. |
| Done when | Las matrices se pueblan exclusivamente desde la respuesta; ante fallo de red no se rellenan con catálogos de memoria ni hardcodeados. |

**Criterios.**

- **AC-OP-AZC-001:** `{roles, scopes, resources, actions}` puebla ejes y tooltips;
  `403` ⇒ F-02; red ⇒ F-06 sin relleno local; ningún botón de `export`/`read_own` se
  deriva del catálogo (D-02).

---

## T-FL-AZ-011 — Categorías de roles

| Campo | Valor |
|---|---|
| Objetivo | `GET /authz/role-categories/` agrupa los checkboxes de rol en las 4 categorías operativas (`admin`, `mando`, `tiro`, `almacen`) tal como responde el backend; alimenta los modales de asignación de identidad. |
| Flujo | [FL-AZ-011](../experience/flows/authorization.md#fl-az-011--categorías-de-roles) |
| OP (AC canónicos) | OP-AZC-002 |
| SCREEN | Integración en [SCREEN-USER-DETAIL](../experience/screens/identity.md#screen-user-detail--ficha-de-usuario) (modales de asignación; `FL/asignaciones` del inventario) |
| Requisitos | R-DOM-AZ-007 (categorías y roles tal como responden; vacío no significa roles fuera de alcance). |
| Precondiciones / dependencias | Consumidor: T-FL-IDT-002/007/009 (sólo módulo API). |
| Archivos probables | `api/authorization.ts` (acceso a catálogo), `components/authorization/RoleCategoryCheckboxes.vue`. |
| Done when | Los selectores de rol de los modales de asignación muestran exactamente las categorías y roles devueltos. |

**Criterios.**

- **AC-OP-AZC-002:** `{categories:[{code, label, roles:[{code, name, description}]}]}`;
  `403` ⇒ F-02; red ⇒ F-06; vacío ⇒ ST-03 sin afirmar inexistencia de roles.

---

## T-FL-AZ-012 — Personas por unidad

| Campo | Valor |
|---|---|
| Objetivo | Panel de permisos por unidad con `unit_code`* e `include_descendants` opcional; resultados con rol funcional **excluyendo el tirador implícito**; `400`/`404`/`403` distinguidos. |
| Flujo | [FL-AZ-012](../experience/flows/authorization.md#fl-az-012--personas-por-unidad) |
| OP (AC canónicos) | OP-AZC-003 |
| SCREEN | [SCREEN-PERMISSIONS](../experience/screens/authorization.md#screen-permissions--permisos-y-matrices) — pestaña personas por unidad |
| Requisitos | R-DOM-AZ-008 (parámetros; los tres códigos de error se distinguen). |
| Precondiciones / dependencias | T-FL-AZ-004/010; selector de unidad desde módulo API de organización. |
| Archivos probables | `components/authorization/UnitPersonnelPanel.vue`. |
| Done when | La lista muestra personas con su rol funcional y unidad personal; el tirador implícito no figura; los tres errores tienen superficie distinta. |

**Criterios.**

- **AC-OP-AZC-003:** `{results:[{user, unidad_personal_code, unidad_personal_name,
  assignments}]}`; `400` (falta `unit_code`) ⇒ F-01; `404` ⇒ F-04; `403` ⇒ F-02 — los
  tres distinguibles; red ⇒ F-06/F-10.

---

## T-FL-AZ-013 — Unidades elegibles por persona

| Campo | Valor |
|---|---|
| Objetivo | Selector de unidad para alta de usuario y asignaciones: unidad personal + hasta 2 ancestros filtrados por la rama del solicitante; `reason: sin_account | sin_unidad_personal` se presenta como **restricción operativa**, no como lista vacía. |
| Flujo | [FL-AZ-013](../experience/flows/authorization.md#fl-az-013--unidades-elegibles-por-persona) |
| OP (AC canónicos) | OP-AZC-004 |
| SCREEN | Integración en [SCREEN-USERS y SCREEN-USER-DETAIL](../experience/screens/identity.md) (`FL/selectores`) |
| Requisitos | R-DOM-AZ-009 (`user_id`*; `reason` como restricción). |
| Precondiciones / dependencias | Consumidores: T-FL-IDT-002/007/009 (sólo módulo API). |
| Archivos probables | `components/authorization/EligibleUnitSelect.vue`. |
| Done when | Los selectores consumidores muestran las opciones reales y, cuando aplica, la restricción operativa rotulada; nunca opciones de memoria. |

**Criterios.**

- **AC-OP-AZC-004:** `{results:[{id, code, name}], unidad_personal_code}` más `reason`
  cuando viene; `400` (falta `user_id`) ⇒ F-01; `404` ⇒ F-04; `403` ⇒ F-02; red ⇒ F-06
  sin relleno de memoria.

---

## T-FL-AUD-001 — Bitácora de auditoría

| Campo | Valor |
|---|---|
| Objetivo | Tabla de auditoría con los siete campos por registro y `count` visible, `limit` acotado (default 100, tope 500, el cliente nunca envía más), badge semántico en `allowed` y entrada de menú sólo para los tres roles declarados. |
| Flujo | [FL-AUD-001](../experience/flows/authorization.md#fl-aud-001--bitácora-de-auditoría) |
| OP (AC canónicos) | OP-AUT-004 |
| SCREEN | [SCREEN-AUDIT](../experience/screens/authorization.md#screen-audit--bitácora-de-auditoría) — DS `tables-basic.html` + `ui-badge.html` |
| Requisitos | R-DOM-AZ-010 (`limit` ≤ 500; `count`; sin fabricar eventos en vacío; disponibilidad por rol; `403` visible); R-SES-018 (PII: `user_id_value` visible en pantalla pero no registrado en logs ni artefactos); R-RES-09 vía tomos citantes (aviso de truncamiento por `limit`). |
| Precondiciones / dependencias | T-CORE-ROUTER (`beforeEnter` permisivo con intento: la autoridad es el backend), T-CORE-UI (menú condicionado). |
| Archivos probables | `views/auditoria/AuditView.vue`. |
| Done when | La bitácora muestra sólo eventos devueltos con `count`; vacío ⇒ ST-03 sin eventos fabricados; un rol no declarado ve denegación visible. |

**Criterios.**

- **AC-OP-AUT-004:** `?limit=N` (≤ 500) ⇒ `{count, results:[{created_at, endpoint,
  action, allowed, reason, organization_unit_code, user_id_value}]}`; `allowed` como
  badge semántico; `403` (rol no declarado) ⇒ ST-07 con `detail` literal y entrada de
  menú ausente para otros roles; red ⇒ F-06/F-10; sin paginación inventada más allá del
  `limit` declarado.
