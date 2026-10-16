---
spec_meta: "../spec-meta.yaml"
---

# Criterios de aceptación — Autorización: RBAC, matrices, overrides y catálogos

> 📖 Volumen del conjunto de aceptación `acceptance/` (método y convenciones en [`core.md`](core.md); matrices de cobertura en [`coverage.md`](coverage.md); estado, gates y autorizaciones en [`../verification.md`](../verification.md)).
> Estado global: **NO EJECUTADO**. Cubre las 32 OP de las familias `ROL`, `SCP`, `PRM`,
> `RPR`, `PPR`, `OVR` y `AZC`. La bitácora (`OP-AUT-004`, FL-AUD-001) vive en
> [`session-access.md`](session-access.md) por pertenecer a la familia `AUT`. Contratos
> citados, no copiados: [`../contracts/authorization.md`](../contracts/authorization.md).
> Estos recursos se rigen por clases `IsAuthenticated`/`HasTenantAccess`/`IsTenantAdmin`,
> no por el mapa `resource:action → permission_code`: no se inventa ningún código.

## Convenciones de familia

- **Precondición base (toda fila):** sesión real activa con tenant; lectura abierta a
  IA+TA; mutación sólo con contexto administrativo real (`IsTenantAdmin`) o, donde se
  declara, `super_admin`. Roles, permisos, puestos y cuentas son datos reales del
  tenant; si el dato necesario no existe, el criterio queda pendiente por falta de dato
  real (sin fixtures).
- **Fallos heredados:** `F-01…F-12` y `ST-*` según perfil `P-*`
  ([`../experience/states.md`](../experience/states.md)); la columna de fallos registra
  sólo deltas. Un `403` sigue siendo denegación visible aunque la UI ya hubiera ocultado
  la acción (la visibilidad nunca acredita autorización).
- **Orden de evaluación efectivo (backend, no UI):** bypass `super_admin` → override
  DENY → override ALLOW → `PositionPermission` → `RolePermission` → DENY
  ([`../contracts/authorization.md`](../contracts/authorization.md) §Evaluación). La
  matriz de UI nunca lo sustituye.
- **Catálogos de sólo lectura:** scopes y permissions no renderizan escritura
  (R-DOM-AZ-002); editar el catálogo de permisos no existe como capacidad (D-02,
  reservado en [`appearance.md`](appearance.md) §D-02).

## AC-OP — Roles

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-ROL-001 | `GET /api/authz/roles/` | IA+TA (lectura abierta) | SCREEN-ROLES: abrir el catálogo (FL-AZ-001 paso 1) | Filas con `id` RO, `code`, `name`, `description`, `is_active`, `is_system`; badges de estado y de rol de sistema | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; vacío ⇒ ST-03 (vacío **no** significa que no existan roles fuera del alcance, R-DOM-AZ-007 análogo); cancelación n/a | `tables-basic.html`, `ui-badge.html` |
| AC-OP-ROL-002 | `POST /api/authz/roles/` | IA+TA+TAdmin real; las mutaciones sólo se ofrecen al contexto administrativo | SCREEN-ROLES: modal de alta con `code`*, `name`*, `description`, `is_active`, `is_system` opcionales (FL-AZ-002) | `201` con el rol ⇒ ST-06; catálogo refrescado; los selectores de rol dependientes (asignaciones, puestos) reflejan el alta al recargarse | `400` ⇒ F-01 con valores conservados; `403` sin TAdmin ⇒ ST-07 denegación visible (no ocultación silenciosa si el envío llegó a producirse); red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-basic.html`/`forms-validation.html` |
| AC-OP-ROL-003 | `GET /api/authz/roles/{id}/` | Rol real existente | SCREEN-ROLES: abrir un rol (FL-AZ-001 paso 2) | Ficha con el objeto del contrato y enlace a su matriz de permisos (SCREEN-PERMISSIONS) | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `ui-card.html` |
| AC-OP-ROL-004 | `PUT /api/authz/roles/{id}/` | IA+TA+TAdmin; rol cargado | Editor compartido, envío **completo** (FL-AZ-002) | `200` con el rol ⇒ ST-06; catálogo refrescado desde la respuesta | `400` ⇒ F-01; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-ROL-005 | `PATCH /api/authz/roles/{id}/` | Ídem ROL-004 | Mismo editor, envío **parcial** (delta: sólo campos modificados) | Ídem ROL-004 | Ídem ROL-004 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-ROL-006 | `DELETE /api/authz/roles/{id}/` | IA+TA+TAdmin; rol cargado | ST-10 que identifica el rol y muestra `is_system` ⇒ confirmar (FL-AZ-003) | Respuesta del backend ⇒ ST-06; catálogo refrescado sólo tras éxito; `is_system` se muestra como **advertencia informativa**: el contrato no declara para `Role` un bloqueo de sistema más allá de TAdmin (la restricción `super_admin` documentada es para RolePermission de rol de sistema), y la UI no inventa ese bloqueo | `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local; cancelar ⇒ cierra ST-10 sin petición | `ui-modal.html` |

## AC-OP — Catálogos de sólo lectura (scopes, permissions)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-SCP-001 | `GET /api/authz/scopes/` | IA+TA | SCREEN-SCOPES: abrir el catálogo (FL-AZ-004 paso 1) | Filas `id, code, name, description` tal como devuelve el contrato; ausentes `—`; **ningún botón de alta/edición/eliminación renderizado** (R-DOM-AZ-002) | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; vacío ⇒ ST-03; cancelación n/a | `tables-basic.html` o `ui-list-group.html` + `ui-card.html` |
| AC-OP-SCP-002 | `GET /api/authz/scopes/{id}/` | IA+TA; scope real | SCREEN-SCOPES: abrir detalle (FL-AZ-004) | Objeto RO; la pantalla no ofrece escritura | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `ui-card.html` |
| AC-OP-PRM-001 | `GET /api/authz/permissions/` | IA+TA | SCREEN-PERMISSIONS pestaña catálogo (FL-AZ-004 paso 2) | Sólo permisos **activos**; campos `id, code, name, category, description, is_active` RO; alimenta los selectores de las matrices; sin edición del catálogo (capacidad inexistente, D-02) | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; vacío ⇒ ST-03; cancelación n/a | `tables-basic.html`/`tables-gridjs.html`, `ui-badge.html` |
| AC-OP-PRM-002 | `GET /api/authz/permissions/{id}/` | IA+TA; permiso activo real | SCREEN-PERMISSIONS: detalle de permiso (FL-AZ-004) | Objeto RO con categoría y descripción; sin escritura renderizada | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `ui-card.html` |

## AC-OP — Matriz rol → permiso (RolePermission)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-RPR-001 | `GET /api/authz/role-permissions/` | IA+TA+TAdmin; matriz con ejes rellenados desde OP-AZC-001 | SCREEN-PERMISSIONS pestaña matriz rol (FL-AZ-005) | Filas con RO `id, role_code, permission_code, permission_name, permission_category` resueltos; celdas `allowed` reflejan el estado confirmado por el backend | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; matriz vacía ⇒ ST-03 (vacío ≠ sin permisos del usuario: es el estado del recurso consultado); cancelación n/a | `tables-basic.html`/`tables-gridjs.html`, `ui-badge.html` |
| AC-OP-RPR-002 | `POST /api/authz/role-permissions/` | IA+TA+TAdmin; rol y permiso reales del catálogo; celdas de **rol de sistema deshabilitadas salvo contexto `super_admin`** (bloqueo visible, R-RES-20 vía states) | SCREEN-PERMISSIONS: marcar celda/concesión con `{role, permission, allowed}` (FL-AZ-005 paso 1) | Registro creado con los campos RO resueltos ⇒ ST-05 por celda → ST-06; la fila se refresca desde la respuesta | `400` ⇒ F-01; `403` (rol de sistema sin `super_admin`, o sin TAdmin) ⇒ F-02 literal; red ⇒ F-06: **la celda revierte al valor confirmado por el backend, nunca a un optimista**; cancelar ⇒ sin petición | `ui-modal.html` + `forms-basic.html`, `ui-tooltips.html` |
| AC-OP-RPR-003 | `GET /api/authz/role-permissions/{id}/` | IA+TA+TAdmin; fila real | Lectura de fila para prefill del editor | Objeto con RO resueltos | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `tables-basic.html` |
| AC-OP-RPR-004 | `PUT /api/authz/role-permissions/{id}/` | Ídem RPR-002 | Editor de fila compartido, envío **completo** con confirmación cuando `allowed` cambia (FL-AZ-005) | `200` ⇒ ST-06; fila y matriz refrescadas desde la respuesta | Ídem RPR-002 (reversión al valor confirmado ante fallo) | `ui-modal.html` + `forms-basic.html` |
| AC-OP-RPR-005 | `PATCH /api/authz/role-permissions/{id}/` | Ídem RPR-004 | Mismo editor, envío **parcial** (delta: sólo `allowed` u otro campo modificado) | Ídem RPR-004 | Ídem RPR-004 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-RPR-006 | `DELETE /api/authz/role-permissions/{id}/` | IA+TA+TAdmin; concesión existente; restricción de rol de sistema (`super_admin`) igual que en la escritura | ST-10 ligera sobre la celda/fila ⇒ confirmar (FL-AZ-005 paso 2) | Respuesta del backend ⇒ ST-06; la matriz se refresca tras éxito | `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local; cancelar ⇒ cierra ST-10 sin petición | `ui-modal.html` |

## AC-OP — Matriz puesto → permiso (PositionPermission)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-PPR-001 | `GET /api/authz/position-permissions/` | IA+TA+TAdmin; sólo posiciones del tenant | SCREEN-PERMISSIONS pestaña matriz puesto (FL-AZ-006) | Filas con RO `id, position_code, permission_code, permission_name`; celdas `allowed` desde el backend | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; vacío ⇒ ST-03; cancelación n/a | `tables-basic.html`/`tables-gridjs.html` |
| AC-OP-PPR-002 | `POST /api/authz/position-permissions/` | IA+TA+TAdmin; puesto del tenant y permiso reales | Elegir puesto y permiso; enviar `{position, permission, allowed}` (FL-AZ-006) | Registro con RO resueltos ⇒ ST-06; matriz refrescada tras éxito | `400` por puesto fuera de tenant ⇒ F-01 **sin insertar fila local** (R-DOM-AZ-004); `403` ⇒ F-02; red ⇒ F-06 con reversión al valor confirmado; cancelar ⇒ sin petición | `ui-modal.html` + `forms-basic.html` |
| AC-OP-PPR-003 | `GET /api/authz/position-permissions/{id}/` | IA+TA+TAdmin; fila real | Lectura para prefill | Objeto con RO resueltos | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `tables-basic.html` |
| AC-OP-PPR-004 | `PUT /api/authz/position-permissions/{id}/` | Ídem PPR-002 | Editor de fila, envío **completo** (FL-AZ-006) | `200` ⇒ ST-06; matriz refrescada | Ídem PPR-002 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-PPR-005 | `PATCH /api/authz/position-permissions/{id}/` | Ídem PPR-004 | Mismo editor, envío **parcial** (delta) | Ídem PPR-004 | Ídem PPR-004 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-PPR-006 | `DELETE /api/authz/position-permissions/{id}/` | IA+TA+TAdmin; concesión existente | ST-10 sobre la celda/fila ⇒ confirmar (FL-AZ-006) | Respuesta ⇒ ST-06; matriz refrescada tras éxito | `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local; cancelar ⇒ cierra ST-10 | `ui-modal.html` |

## AC-OP — Overrides por persona (UserPermissionOverride)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-OVR-001 | `GET /api/authz/overrides/` | IA+TA+TAdmin; cuentas del tenant | SCREEN-OVERRIDES: abrir el listado (FL-AZ-009 paso 1) | Filas con campos RO (`id, account_rut, created_by, created_by_rut, created_at`) y W del contrato; efecto ALLOW/DENY con badge semántico; búsqueda client-side | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; vacío ⇒ ST-03; cancelación n/a | `tables-basic.html`, `ui-badge.html` |
| AC-OP-OVR-002 | `POST /api/authz/overrides/` | IA+TA+TAdmin; account real del tenant | Modal con `account`*, `allowed`*; `permission`/`permission_code` nullable, `resource`, `action`, `reason` opcionales; selector de cuenta restringido a cuentas del tenant (FL-AZ-007) | Registro con `created_by` **fijado por el servidor**, mostrado como metadato RO ⇒ ST-06; listado refrescado; la fila se rotula como **excepción individual** (precedencia alta: DENY antes que ALLOW en la evaluación efectiva), no como permiso de rol | `400` (account fuera de tenant) ⇒ F-01; `403` ⇒ F-02; red ⇒ F-06 sin fila local; cancelar ⇒ F-09 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-OVR-003 | `GET /api/authz/overrides/{id}/` | IA+TA+TAdmin; override real | SCREEN-OVERRIDES: abrir uno (FL-AZ-009 paso 2); lectura para prefill | Objeto completo con RO | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `ui-card.html` |
| AC-OP-OVR-004 | `PUT /api/authz/overrides/{id}/` | Ídem OVR-002 | Editor compartido, envío **completo**; `created_by` y sus metadatos permanecen RO (FL-AZ-007) | `200` ⇒ ST-06; listado refrescado desde la respuesta | Ídem OVR-002 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-OVR-005 | `PATCH /api/authz/overrides/{id}/` | Ídem OVR-004 | Mismo editor, envío **parcial** (delta: p. ej. sólo `allowed` o sólo `reason`) | Ídem OVR-004 | Ídem OVR-004 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-OVR-006 | `DELETE /api/authz/overrides/{id}/` | IA+TA+TAdmin; override existente | ST-10 que identifica cuenta y permiso/recurso ⇒ confirmar (FL-AZ-008) | Respuesta ⇒ ST-06; listado refrescado sólo tras éxito | `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local; cancelar ⇒ cierra ST-10 sin petición | `ui-modal.html` |

## AC-OP — Catálogos y consultas operativas (AZC)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-AZC-001 | `GET /api/authz/catalog/` | IA+TA; pantallas de matriz abiertas | SCREEN-PERMISSIONS: fill de matrices y tooltips al abrir una matriz (FL-AZ-010) | `{roles, scopes, resources, actions}` rellena los ejes de las matrices; `label`/`description` de actions alimentan tooltips; el catálogo es **ayuda de selección**: no sustituye a `context.permissions` y **no** prueba que cada acción catalogada tenga endpoint (`export`/`read_own` figuran sin endpoint implementado: no generan botón, D-02) | `403` ⇒ ST-07; red ⇒ F-06: la matriz **no se rellena con catálogos de memoria ni hardcodeados**; cancelación n/a | `tables-gridjs.html`, `ui-tooltips.html` |
| AC-OP-AZC-002 | `GET /api/authz/role-categories/` | IA+TA; modal de asignación abierto | Selectores de rol agrupados en los modales de asignación de SCREEN-USER-DETAIL (FL-AZ-011; integrado, sin pantalla propia) | `{categories:[{code, label, roles:[{code, name, description}]}]}`: los checkboxes se agrupan en las categorías operativas **tal como responde el backend** (4 categorías: `admin`, `mando`, `tiro`, `almacen`) | `403` ⇒ ST-07; red ⇒ F-06; vacío ⇒ ST-03: **no** significa que no existan roles fuera del alcance (R-DOM-AZ-007); cancelar ⇒ cierra el modal sin petición | `forms-basic.html` (checkboxes), `ui-badge.html` |
| AC-OP-AZC-003 | `GET /api/authz/personas-por-unidad/` | IA+TA; unidad real del tenant | SCREEN-PERMISSIONS pestaña personas por unidad con `unit_code`* e `include_descendants=true` opcional (FL-AZ-012) | `{results:[{user, unidad_personal_code, unidad_personal_name, assignments}]}`: personas con rol funcional; el `tirador` implícito queda **excluido** (delta de states); enlaces a ficha sólo cuando la respuesta trae el id | `400` (falta `unit_code`) ⇒ F-01; `404` ⇒ F-04; `403` ⇒ ST-07: **los tres códigos se distinguen** (R-DOM-AZ-008); red ⇒ ST-04 + F-10; vacío ⇒ ST-03; cancelación n/a | `tables-basic.html`, `ui-card.html` |
| AC-OP-AZC-004 | `GET /api/authz/eligible-target-units/` | IA+TA; `user_id` real de la persona destinataria | Selector de unidad en alta de usuario y en agregar/cambiar asignación (SCREEN-USERS, SCREEN-USER-DETAIL; FL-AZ-013) | `{results:[{id, code, name}], unidad_personal_code}`: opciones = unidad personal + hasta 2 ancestros filtrados por la rama del solicitante; `reason: sin_account \| sin_unidad_personal` se presenta como **restricción operativa visible**, no como lista vacía | `400` (falta `user_id`) ⇒ F-01; `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ F-06: el selector no se rellena de memoria; cancelar ⇒ cierra el selector sin petición | `ui-dropdown.html`, `forms-basic.html` |

---

> 🕯️ Ninguna fila está verificada. Las mutaciones de esta familia alteran el acceso real
> de personas reales: su comprobación M-U requiere autorización explícita del operador y
> objetivo decidido por él; ninguna denegación se «prueba» contra cuentas en uso sin
> orden aparte ([`../verification.md`](../verification.md), «Requisito de autorización»).
