---
spec_meta: "../../spec-meta.yaml"
---

# Pantallas — Identidad: usuarios, puestos y pertenencias

> 📖 Tomo de catálogo del workstream `full-frontend-screens-recovery`. Los shapes de request/response no se copian: se enlazan al [contrato de organización e identidad](../../contracts/organization-identity.md) y al [contrato de auth](../../contracts/auth-context.md). Los códigos de permiso citados están transcritos del mapa verificado `apps/authorization/permissions.py:36–95`. Convenciones generales: [`../screens.md`](../screens.md).

## Índice

1. [SCREEN-USERS](#screen-users--listado-de-usuarios)
2. [SCREEN-USER-DETAIL](#screen-user-detail--ficha-de-usuario)
3. [SCREEN-POSITIONS](#screen-positions--puestos)
4. [SCREEN-POSITION-DETAIL](#screen-position-detail--ficha-de-puesto)
5. [SCREEN-MEMBERSHIPS](#screen-memberships--pertenencias-orgánicas)

---

### SCREEN-USERS — Listado de usuarios

| Atributo | Valor |
|---|---|
| Propósito | Listar las personas del scope, dar de alta usuarios formales y temporales y entrar a la ficha. |
| Ruta | `/personas` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Personas. |
| Fuente DS | `tables-basic.html` (listado) con búsqueda y orden client-side; alta en `ui-modal.html` + `forms-basic.html`/`forms-validation.html`; estados en `ui-badge.html` (habilitado/bloqueado/temporal), `ui-spinners.html`, `ui-placeholders.html`, `ui-alerts.html`; acciones en `ui-buttons.html`. |

**Datos y operaciones.**

- `OP-USR-001` `GET /usuarios/` — listado del scope (tenant+rama) ([contrato](../../contracts/organization-identity.md#usuarios-y-asignaciones)).
- `OP-USR-002` `POST /usuarios/` — alta formal (modal).
- `OP-USR-012` `POST /usuarios/crear-temporal/` — alta temporal (modal distinto); el temporal no inicia sesión (`R-DOM-ID-004`).
- `OP-AZC-004` `GET /authz/eligible-target-units/?user_id=…` — FL/selectores: destinos válidos en el selector de unidad del alta y de asignaciones (`technical-design.md` §8; `R-DOM-AZ-009`: `reason: sin_account|sin_unidad_personal` se presenta como restricción operativa, no como lista vacía).

**Acciones y formularios.** Alta formal: `rut`, `apellido_paterno`, `apellido_materno` requeridos; `grado`, `nombre`, `correo` opcionales; campos iniciales `initial_unit_code`, `initial_role_code`, `initial_scope_code` sólo cuando el flujo los solicite (`R-DOM-ID-002`). Advertencia previa cuando el RUT coincide con un temporal existente: la creación formal **promueve** el temporal y conserva su historial (`R-RUL-06`, `R-DOM-ID-003`); el alta temporal jamás se ofrece como mecanismo de promoción. Alta temporal: `rut` requerido, opcionales documentados y `organization_unit_code` cuando corresponda; RUT existente ⇒ error del backend sin duplicar fila local (`R-DOM-ID-004`). Búsqueda, orden y selección sobre el array plano retornado, sin paginación inventada (`R-RES-22`).

**Controles de acceso.** `user:read → view_personnel_basic`; `user:create → create_users` (mapa verificado). La visibilidad de botones se anticipa con `context.permissions`; un `403` sigue siendo denegación visible (`requirements/identity-authorization.md` §Límites).

**Estados y criterios observables.** `idle/loading/ready/empty/denied/error` (`technical-design.md` §9); vacío ≠ error ≠ denegado; filas muestran identidad diferenciada de asignaciones activas (`R-DOM-ID-001`); ausentes `—` (`R-RES-23`); éxito de alta refresca el listado (`R-DOM-ID-012` aplica a la eliminación desde la ficha).

**Navegación.** Fila ⇒ SCREEN-USER-DETAIL (conservando selección/scroll, `R-DOM-ORG-001` como patrón análogo). Deep link a `/personas` reconstruye contexto por guard (`R-ROUTER-03/06`).

---

### SCREEN-USER-DETAIL — Ficha de usuario

| Atributo | Valor |
|---|---|
| Propósito | Ver y administrar una persona: identidad, asignaciones (principal y secundarias), credenciales y bloqueo. Integra los flujos FL/asignación-principal, FL/asignaciones y FL/contraseña — no requieren pantallas propias (integración justificada: todas operan sobre el mismo recurso y sus respuestas refrescan esta ficha). |
| Ruta | `/personas/:idUsuario` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | `idUsuario` (parámetro de ruta, no query, `R-ROUTER-02`). Breadcrumb: Inicio › Personas › {identidad o id}. |
| Fuente DS | `ui-card.html` + `ui-list-group.html` (secciones identidad/asignaciones), `ui-tabs.html` (pestañas), `ui-badge.html` (flags), editores en `ui-modal.html` + `forms-basic.html`/`forms-validation.html`, confirmaciones destructivas en `ui-modal.html`, feedback en `ui-toasts.html`/`ui-alerts.html`. |

**Datos y operaciones.** Contrato: [usuarios y asignaciones](../../contracts/organization-identity.md#usuarios-y-asignaciones) y [auditoría y contraseña](../../contracts/auth-context.md#auditoría-y-contraseña-de-usuario).

- `OP-USR-003` `GET /usuarios/{id}/` — carga de ficha.
- `OP-USR-004` / `OP-USR-005` `PUT`/`PATCH /usuarios/{id}/` — edición: **comparten el mismo formulario editor**; ambas OP quedan cubiertas por él (convención PUT/PATCH de [`../screens.md`](../screens.md)).
- `OP-USR-006` `DELETE /usuarios/{id}/` — eliminación con confirmación destructiva; no se asume borrado físico ni se oculta el registro antes del éxito (`R-DOM-ID-012`).
- `OP-USR-007` / `OP-USR-008` `PUT`/`PATCH /usuarios/{id}/asignacion-principal/` — modal «asignación principal»: ambos métodos comparten el modal y ambos quedan cubiertos (`R-DOM-ID-005`).
- `OP-USR-009` `POST …/desactivar-asignacion-principal/` — confirmación + aviso de tirador preservado/recreado (`R-DOM-ID-006`, `R-RUL-12`).
- `OP-USR-010` `POST …/agregar-asignacion/` — modal de asignación secundaria; `200` idempotente y `201` son éxito (`R-DOM-ID-007`).
- `OP-USR-011` `POST …/quitar-asignacion/{assignment_id}/` — confirmación por asignación; aviso de restauración de tirador si era la última (`R-DOM-ID-008`).
- `OP-USR-013` `POST …/cambiar-contrasena/` (sobre otro) — requiere `old_password` salvo flag forzado (`R-DOM-ID-009`, `R-RUL-07`).
- `OP-USR-014` `POST …/resetear-contrasena/` — confirmación; refresca flags; bloqueado sobre la propia cuenta con `400` visible (`R-DOM-ID-010`, `R-RUL-08`).
- `OP-USR-015` `GET …/estado-bloqueo/` — panel de bloqueo: `rut`, `is_locked`, fallos, límite, último intento; sin inventar fecha ausente (`R-DOM-ID-011`).
- `OP-USR-016` `POST …/desbloquear/` — confirmación y refresco del estado (`R-DOM-ID-011`).
- `OP-AZC-002` `GET /authz/role-categories/` — FL/asignaciones: roles agrupados en categorías (`admin`, `mando`, `tiro`, `almacen`) para los selectores de rol de los modales de asignación (`technical-design.md` §8; `R-DOM-AZ-007`).
- `OP-AZC-004` — selector de unidad elegible en agregar/cambiar asignación (FL/selectores; `R-DOM-AZ-009`).

**Acciones y formularios.** Cada modal envía sólo los campos que el contrato declara escribibles; `tenant`/unidad inyectados nunca se envían (`R-RUL-01`); relaciones por código (`R-RUL-02`). Éxito ⇒ refresco de ficha, listado y relaciones afectadas (memberships/puestos implicados, `R-DOM-ID-005`); cancelar no emite petición (`requirements/identity-authorization.md` §Límites).

**Controles de acceso.** Lectura `user:read → view_personnel_basic`; mutaciones `user:update → update_users`; eliminación `user:delete → disable_users`; `OP-USR-013` sobre otro usa `update_users` (mapa verificado; contrato). `403` literal, nunca dato vacío.

**Estados y criterios observables.** Flags de contraseña y `primary_assignment`/`assignments` diferenciados (`R-DOM-ID-001`); advertencia de tirador implícito en cada baja total (`R-RUL-12`); guardado hasta respuesta en toda mutación; errores por campo anclados al control.

**Navegación.** Atrás ⇒ SCREEN-USERS. Enlaces entre entidades: asignación → SCREEN-POSITION-DETAIL y SCREEN-UNIT-DETAIL (por unidad); membresías relacionadas → SCREEN-MEMBERSHIPS filtrado por la persona. Deep link a `/personas/{id}` funciona tras autenticar (`R-ROUTER-03`).

---

### SCREEN-POSITIONS — Puestos

| Atributo | Valor |
|---|---|
| Propósito | Listar y administrar puestos (Position): catálogo de puestos del scope con su estado y contador de holders. |
| Ruta | `/organizacion/puestos` — **propuesta nueva** de este catálogo (no figura en `technical-design.md` §4; sigue su convención de módulos). `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Organización › Puestos. |
| Fuente DS | `tables-basic.html` (listado), `ui-modal.html` + `forms-basic.html` (alta/edición), `ui-badge.html` (activo/inactivo, holder único), `ui-spinners.html`/`ui-placeholders.html`/`ui-alerts.html` (estados). |

**Datos y operaciones.** Contrato: [puestos, holders y memberships](../../contracts/organization-identity.md#puestos-holders-y-memberships).

- `OP-POS-001` `GET /posiciones/` — listado.
- `OP-POS-002` `POST /posiciones/` — alta (modal).
- `OP-POS-004` / `OP-POS-005` `PUT`/`PATCH` — edición compartida desde la fila o la ficha.
- `OP-POS-006` `DELETE /posiciones/{id}/` — eliminación con confirmación destructiva.

**Acciones y formularios.** Alta/edición: `code`, `name`, `organization_unit_code_write`, `role_code_write` requeridos; opcionales de armería, scope, recinto, `description`, `is_active`, `is_unique_holder`; `null` limpia opcionales sólo por elección expresa (`R-DOM-ID-014`). El selector de recinto explica que sólo tiene efecto con scope `todo_recinto` (`R-DOM-ID-015`; `AGENTS.md` §Gotchas). Selectores de unidad/rol/armería/recinto poblados con datos reales del contrato, no con listas fijas.

**Controles de acceso.** `position:read → view_unit`; `position:create/update → assign_positions`; `position:delete → revoke_positions` (mapa verificado).

**Estados y criterios observables.** Columnas con códigos/nombres derivados, `current_holders_count`, estado y timestamps (`R-DOM-ID-013`); distinción visual puesto ≠ assignment ≠ membership; `—` en ausentes.

**Navegación.** Fila ⇒ SCREEN-POSITION-DETAIL. Alta/edición exitosa refresca listado. Deep link con contexto reconstruido.

---

### SCREEN-POSITION-DETAIL — Ficha de puesto

| Atributo | Valor |
|---|---|
| Propósito | Ver un puesto, asignar/quitar holders y consultar su histórico. Integra FL/holders: las dos acciones viven en esta ficha porque operan sobre el mismo recurso (integración justificada). |
| Ruta | `/organizacion/puestos/:idPosicion` — **propuesta nueva** (extensión del patrón de detalle de `technical-design.md` §4). `meta.requiresTenant`. |
| Params / breadcrumbs | `idPosicion`. Breadcrumb: Inicio › Organización › Puestos › {code o nombre}. |
| Fuente DS | `ui-card.html` + `ui-tabs.html` (pestañas holders/histórico/datos), `ui-list-group.html` (holders), `ui-modal.html` (asignar holder, confirmaciones), `ui-badge.html`, `ui-avatar.html` sólo si el dato existe en la respuesta. |

**Datos y operaciones.**

- `OP-POS-003` `GET /posiciones/{id}/` — carga de ficha.
- `OP-POS-007` `POST /posiciones/{id}/asignar-holder/` — modal: `account_id` y opcionales `is_primary`, `starts_at`; presenta la consecuencia de puesto único (cesa el previo); acepta `201` y `200` idempotente (`R-DOM-ID-016`).
- `OP-POS-008` `POST /posiciones/{id}/quitar-holder/{assignment_id}/` — confirmación; al éxito refresca contador, holders e histórico (`R-DOM-ID-017`).
- `OP-POS-009` `GET /posiciones/{id}/historico/` — histórico con activos e históricos **devueltos**, sin cronología inferida (`R-DOM-ID-017`).
- `OP-POS-004` / `OP-POS-005` — edición del puesto desde la ficha (mismo editor que SCREEN-POSITIONS).

**Acciones y formularios.** Asignar holder: selector de cuenta poblado con personas reales del tenant (p. ej. vía `OP-AZC-003` personas por unidad, si el flujo lo requiere); confirmación de cese en puesto de holder único antes de enviar.

**Controles de acceso.** `position:read → view_unit`; `position:update → assign_positions` (holders incluido, según inventario `OP-POS-007/008`).

**Estados y criterios observables.** `current_holders_count` coherente con la lista tras cada operación; histórico sin inventar fechas; denegación visible.

**Navegación.** Atrás ⇒ SCREEN-POSITIONS. Enlaces: holder → SCREEN-USER-DETAIL; unidad → SCREEN-UNIT-DETAIL; rol → SCREEN-ROLES. Deep link operativo tras autenticar.

---

### SCREEN-MEMBERSHIPS — Pertenencias orgánicas

| Atributo | Valor |
|---|---|
| Propósito | Administrar UnitMembership: la pertenencia orgánica a una unidad, separada del puesto funcional y del assignment. |
| Ruta | `/organizacion/membresias` — **propuesta nueva** (no figura en `technical-design.md` §4). `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Organización › Membresías. |
| Fuente DS | `tables-basic.html`, `ui-modal.html` + `forms-basic.html` (alta/edición), `ui-badge.html` (primaria/activa), estados estándar de la familia. |

**Datos y operaciones.** Contrato: [puestos, holders y memberships](../../contracts/organization-identity.md#puestos-holders-y-memberships) (fila UnitMembership).

- `OP-MEM-001` `GET /memberships/` — listado.
- `OP-MEM-002` `POST /memberships/` — alta: `account`, `unit` requeridos; `is_primary`, `is_active`, `starts_at`, `ends_at` opcionales; el tenant lo inyecta la vista (`R-DOM-ID-018`).
- `OP-MEM-004` / `OP-MEM-005` `PUT`/`PATCH` — edición compartida.
- `OP-MEM-006` `DELETE /memberships/{id}/` — baja con confirmación destructiva.
- `OP-MEM-003` `GET /memberships/{id}/` — lectura para prefill de edición.

**Acciones y formularios.** Alta/edición identifican la membresía como pertenencia orgánica (no puesto/holder, `R-DOM-ID-018`). Cambiar la primaria o desactivar/eliminar ⇒ refrescar el contexto afectado **antes** de mostrar unidad efectiva; no se asume que modifica la asignación funcional (`R-DOM-ID-019`).

**Controles de acceso.** El ViewSet usa `resource_name='position'` (inventario): los códigos efectivos son los del par `(position, action)` — `view_unit`, `assign_positions`, `revoke_positions` (mapa verificado; riesgo T-06: los permisos se derivan del par, no de la pantalla).

**Estados y criterios observables.** Un solo `is_primary=True` por account (regla del dominio, `AGENTS.md` §Gotchas): la UI muestra el conflicto si el backend lo devuelve, sin resolverlo localmente; éxito refresca ficha de usuario relacionada.

**Navegación.** Enlaces: `rut` → SCREEN-USER-DETAIL; `unit_code` → SCREEN-UNIT-DETAIL. Atrás ⇒ menú Organización. Deep link con contexto reconstruido.
