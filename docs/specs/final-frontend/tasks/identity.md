---
spec_meta: "../spec-meta.yaml"
---

# Tasks — Identidad: usuarios, asignaciones, puestos y memberships (T-FL-IDT)

> 📖 Yo registro aquí las diecisiete tareas de identidad. La regla de autoridad del
> volumen de flujos se conserva: la UI puede ocultar acciones según el contexto, pero
> sólo el backend decide tenant, unidad y permiso efectivo; un `403` no se convierte en
> dato vacío. Pasos y shapes **no se copian**: cada tarea cita su ancla `FL-*`. Índice y
> reglas: [../tasks.md](../tasks.md). Ninguna tarea está autorizada a ejecutarse.

## Bloque común de la familia

- **Dependencias comunes:** T-CORE-TYPES, T-CORE-HTTP, T-CORE-SESSION, T-CORE-ROUTER
  (`/personas[/:idUsuario]`, `/organizacion/puestos[/:idPosicion]`,
  `/organizacion/membresias`), T-CORE-UI.
- **Dependencias cruzadas de catálogo (no de UI):** los selectores de rol por categoría
  y de unidades elegibles consumen los módulos `api/authorization.ts` de
  [authorization.md](authorization.md) (T-FL-AZ-011/013); el selector de scopes consume
  T-FL-AZ-004; el de armería/recinto consume `api/armory.ts` y `api/organization.ts`.
  **Consumir el catálogo API de otro dominio no requiere completar la UI de ese
  dominio** (regla del DAG).
- **Archivos probables** (raíz `front/src/`): `api/identity.ts`, `stores/identity.ts`,
  `views/personas/UsersView.vue`, `views/personas/UserDetailView.vue`,
  `views/organizacion/PositionsView.vue`, `views/organizacion/PositionDetailView.vue`,
  `views/organizacion/MembershipsView.vue`, `components/identity/*`. Todos con
  `<script setup lang="ts">`.
- **Convención de AC:** hogar canónico único por OP. **Reservas declaradas:**
  OP-MEM-001/003 (lecturas de listado y detalle de memberships) no tienen FL propio; su
  hogar canónico es T-FL-IDT-016 (superficie del listado donde vive el alta/edición).
  Las OP de credenciales y bloqueo (OP-USR-013…016) viven en
  [recovery-password.md](recovery-password.md) sobre SCREEN-USER-DETAIL.

---

## T-FL-IDT-001 — Consulta de usuarios

| Campo | Valor |
|---|---|
| Objetivo | Listado de personas del scope con identidad diferenciada de asignaciones activas, búsqueda/orden/selección client-side y ficha con secciones de identidad, asignaciones y estado de cuenta. |
| Flujo | [FL-IDT-001](../experience/flows/identity.md#fl-idt-001--consulta-de-usuarios) |
| OP (AC canónicos) | OP-USR-001, OP-USR-003 |
| SCREEN | [SCREEN-USERS, SCREEN-USER-DETAIL](../experience/screens/identity.md) — DS `tables-basic.html` + `ui-card.html`/`ui-list-group.html`/`ui-tabs.html` |
| Requisitos | R-DOM-ID-001 (campos de respuesta; identidad ≠ asignaciones); R-RES-23 vía bloque común (`—`, vacío/error/denied); acciones visibles según `permissions` del contexto. |
| Precondiciones / dependencias | Bloque común; la ficha incluye el panel de bloqueo de T-FL-PWD-004. |
| Archivos probables | `api/identity.ts`, `stores/identity.ts`, `views/personas/UsersView.vue`, `views/personas/UserDetailView.vue`. |
| Done when | La tabla muestra sólo personas del scope con los campos del contrato; la ficha conserva el `idUsuario` por param de ruta y sirve de base a los paneles de asignaciones y credenciales. |

**Criterios.**

- **AC-OP-USR-001:** `GET /usuarios/` ⇒ array con `id_usuario`, identidad, `habilitado`,
  `is_locked`, flags de contraseña, `primary_assignment`, `assignments`; `200` vacío ⇒
  ST-03 (F-11); `403` ⇒ ST-07 literal; búsqueda/orden client-side sin paginación
  inventada.
- **AC-OP-USR-003:** la ficha muestra el objeto devuelto; campo ausente ⇒ `—`; `404` ⇒
  F-04; red ⇒ F-06/F-10.

---

## T-FL-IDT-002 — Alta de usuario formal

| Campo | Valor |
|---|---|
| Objetivo | Alta con identidad requerida (`rut`, `apellido_paterno`, `apellido_materno`), opcionales documentados y campos iniciales `initial_unit_code`/`initial_role_code`/`initial_scope_code` fuera del serializer; selectores poblados por catálogos reales; advertencia previa de promoción si el RUT coincide con un temporal. |
| Flujo | [FL-IDT-002](../experience/flows/identity.md#fl-idt-002--alta-de-usuario-formal) |
| OP (AC canónicos) | OP-USR-002 (la faceta de promoción vive en T-FL-IDT-003) |
| SCREEN | [SCREEN-USERS](../experience/screens/identity.md#screen-users--listado-de-usuarios) — modal de alta |
| Requisitos | R-DOM-ID-002 (campos W y RO; iniciales sólo en alta); R-DOM-ID-003 (advertencia previa de promoción; el alta temporal no se ofrece como promoción); R-RUL-06 vía flujo. |
| Precondiciones / dependencias | T-FL-IDT-001; catálogos: T-FL-AZ-011 (roles por categoría, OP-AZC-002) y T-FL-AZ-013 (unidades elegibles, OP-AZC-004) — sólo sus módulos API. |
| Archivos probables | `components/identity/UserFormModal.vue`. |
| Done when | La persona existe con su asignación inicial real devuelta por el `201`; la ficha muestra `primary_assignment` y `assignments` del servidor; nada se pintó en la tabla local antes de la respuesta. |

**Criterios.**

- **AC-OP-USR-002:** `201` con `UsuarioSerializer` (el backend garantiza tirador
  implícito y `UnitMembership`) ⇒ ST-06 y refresco de listado; `400` ⇒ F-01 con ST-09
  conservado; RUT duplicado formal ⇒ F-05 anclado en `rut` sin duplicado en la tabla;
  `403` ⇒ F-02; red ⇒ F-06 sin fila optimista; cancelar ⇒ F-09.

---

## T-FL-IDT-003 — Promoción de temporal por alta formal

| Campo | Valor |
|---|---|
| Objetivo | Cuando el RUT del alta formal coincide con un temporal existente: advertencia **antes** del envío y reconocimiento del `201` que promueve (un solo registro, `is_temporary` limpio, historial conservado), nunca duplicado. |
| Flujo | [FL-IDT-003](../experience/flows/identity.md#fl-idt-003--promoción-de-temporal) |
| OP | OP-USR-002 — **referencia** a AC-OP-USR-002 (T-FL-IDT-002), faceta de promoción. |
| SCREEN | [SCREEN-USERS](../experience/screens/identity.md#screen-users--listado-de-usuarios) — formulario de alta con advertencia visible |
| Requisitos | R-DOM-ID-003; R-RUL-06 vía flujo (dirección inequívoca: la promoción ocurre al crear la cuenta formal; `crear-temporal` con RUT existente es `400`). |
| Precondiciones / dependencias | T-FL-IDT-002 (mismo formulario). |
| Archivos probables | `components/identity/UserFormModal.vue` (aviso de promoción). |
| Done when | El listado muestra un único registro promovido con su historial; la advertencia fue visible antes del envío. |

**Criterios.** Delta observable sobre AC-OP-USR-002: ante RUT temporal coincidente, la
pantalla advierte antes del alta que la creación promueve y conserva historial; el
`201` no produce una segunda fila; el alta temporal **no** se ofrece como mecanismo de
promoción.

---

## T-FL-IDT-004 — Alta de usuario temporal

| Campo | Valor |
|---|---|
| Objetivo | Alta rápida (`rut`* y opcionales documentados, `organization_unit_code` opcional) con rotulación visible de que el temporal **no inicia sesión**; el nuevo `id_usuario` queda seleccionable en la captura de tiro. |
| Flujo | [FL-IDT-004](../experience/flows/identity.md#fl-idt-004--alta-de-usuario-temporal) |
| OP (AC canónicos) | OP-USR-012 |
| SCREEN | [SCREEN-USERS](../experience/screens/identity.md#screen-users--listado-de-usuarios) y alta rápida dentro de [SCREEN-RESULTS-CAPTURE](../experience/screens/shooting.md#screen-results-capture--captura-de-resultados) (consumidor `FL/captura-tiro`) |
| Requisitos | R-DOM-ID-004 (campos; rotulación «no inicia sesión»; RUT existente ⇒ error del backend sin duplicar fila). |
| Precondiciones / dependencias | T-FL-IDT-001; consumidor desde T-FL-SHT-015 (captura). |
| Archivos probables | `components/identity/TemporaryUserModal.vue`. |
| Done when | El temporal queda seleccionable como tirador en la captura con su `id_usuario` real; la rotulación de no-sesión es visible. |

**Criterios.**

- **AC-OP-USR-012:** `201` con `UsuarioSerializer` ⇒ ST-06 con indicación «el temporal
  no inicia sesión»; RUT existente (temporal o formal) ⇒ `400` ⇒ F-05 sin duplicado en
  la tabla; `403` ⇒ F-02; red ⇒ F-06.

---

## T-FL-IDT-005 — Edición de usuario

| Campo | Valor |
|---|---|
| Objetivo | Edición de los campos W del serializer con derivados y flags RO no enviados; `PUT`/`PATCH` comparten editor. |
| Flujo | [FL-IDT-005](../experience/flows/identity.md#fl-idt-005--edición-de-usuario) |
| OP (AC canónicos) | OP-USR-004, OP-USR-005 |
| SCREEN | [SCREEN-USER-DETAIL](../experience/screens/identity.md#screen-user-detail--ficha-de-usuario) |
| Requisitos | R-DOM-ID-002 (mismas reglas de campos sobre la ficha). |
| Precondiciones / dependencias | T-FL-IDT-001. |
| Archivos probables | `components/identity/UserFormModal.vue` (prefill). |
| Done when | La ficha y el listado muestran el objeto devuelto tras el envío. |

**Criterios.**

- **AC-OP-USR-004 / AC-OP-USR-005:** `200` ⇒ ST-06 y refresco; `400` ⇒ F-01 conservando
  valores; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09.

---

## T-FL-IDT-006 — Eliminación de usuario

| Campo | Valor |
|---|---|
| Objetivo | Acción destructiva con ST-10 identificadora que refleja el resultado real sin asumir borrado físico (el permission code mapeado es `disable_users`) ni ocultar el registro antes del éxito. |
| Flujo | [FL-IDT-006](../experience/flows/identity.md#fl-idt-006--eliminación-de-usuario) |
| OP (AC canónicos) | OP-USR-006 |
| SCREEN | [SCREEN-USER-DETAIL](../experience/screens/identity.md#screen-user-detail--ficha-de-usuario) |
| Requisitos | R-DOM-ID-012 (confirmación; respuesta esperada; resultado real sin suposición de borrado físico). |
| Precondiciones / dependencias | T-FL-IDT-001; T-CORE-UI (ST-10). |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | La UI refleja exactamente lo que la respuesta declara; la rotulación no promete eliminación física si la respuesta no la declara. |

**Criterios.**

- **AC-OP-USR-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06 y refresco con el efecto real;
  `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local.

---

## T-FL-IDT-007 — Asignación principal

| Campo | Valor |
|---|---|
| Objetivo | Modal de asignación principal con selectores reales (unidad desde OP-AZC-004 con `unidad_personal_code`/`reason` si aplican, rol desde OP-AZC-002, scope desde OP-SCP-001) y refresco de usuario, memberships y puestos implicados tras la respuesta efectiva. |
| Flujo | [FL-IDT-007](../experience/flows/identity.md#fl-idt-007--asignación-principal) |
| OP (AC canónicos) | OP-USR-007, OP-USR-008 |
| SCREEN | [SCREEN-USER-DETAIL](../experience/screens/identity.md#screen-user-detail--ficha-de-usuario) — panel de asignaciones |
| Requisitos | R-DOM-ID-005 (`{unit_code, role_code, scope_code?}`; la respuesta efectiva manda sobre el formulario; refresco amplio). |
| Precondiciones / dependencias | T-FL-IDT-001; catálogos T-FL-AZ-011/013 y T-FL-AZ-004 (sólo API). |
| Archivos probables | `components/identity/PrimaryAssignmentModal.vue`. |
| Done when | `primary_assignment` refleja la nueva combinación y la anterior aparece desactivada en `assignments`; la Position/Assignment creada y las garantías de tirador/membership se ven en los datos refrescados del servidor. |

**Criterios.**

- **AC-OP-USR-007 / AC-OP-USR-008:** `PUT`/`PATCH` con `{unit_code, role_code,
  scope_code?}` ⇒ `{detail, unit_code, role_code, scope_code}` efectivo y ST-06; `400` ⇒
  F-01; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09.

---

## T-FL-IDT-008 — Desactivación de asignación principal

| Campo | Valor |
|---|---|
| Objetivo | Desactivación con ST-10 que advierte la preservación/recreación del tirador implícito cuando no queda otra asignación, y muestra `desactivadas` desde la respuesta. |
| Flujo | [FL-IDT-008](../experience/flows/identity.md#fl-idt-008--desactivación-de-la-principal) |
| OP (AC canónicos) | OP-USR-009 |
| SCREEN | [SCREEN-USER-DETAIL](../experience/screens/identity.md#screen-user-detail--ficha-de-usuario) |
| Requisitos | R-DOM-ID-006 (confirmación; informe de `desactivadas`; advertencia de tirador); R-RUL-12 vía flujo. |
| Precondiciones / dependencias | T-FL-IDT-007 (panel de asignaciones). |
| Archivos probables | `components/identity/AssignmentsPanel.vue`. |
| Done when | Las asignaciones refrescadas muestran el tirador visible si se recreó; `desactivadas` coincide con la respuesta. |

**Criterios.**

- **AC-OP-USR-009:** sin body ⇒ `{detail, desactivadas}` y ST-06; `403` ⇒ F-02; `404` ⇒
  F-04; red ⇒ F-06 sin cambio local.

---

## T-FL-IDT-009 — Alta de asignación secundaria

| Campo | Valor |
|---|---|
| Objetivo | Agregar asignación con los mismos selectores que la principal, tratando `200` idempotente y `201` como éxito y mostrando `assignment_id`. |
| Flujo | [FL-IDT-009](../experience/flows/identity.md#fl-idt-009--alta-de-asignación-secundaria) |
| OP (AC canónicos) | OP-USR-010 |
| SCREEN | [SCREEN-USER-DETAIL](../experience/screens/identity.md#screen-user-detail--ficha-de-usuario) |
| Requisitos | R-DOM-ID-007 (doble código de éxito; `assignment_id` visible). |
| Precondiciones / dependencias | T-FL-IDT-007 (selectores compartidos). |
| Archivos probables | `components/identity/AddAssignmentModal.vue`. |
| Done when | `assignments` se refresca con la nueva asignación y su `assignment_id`. |

**Criterios.**

- **AC-OP-USR-010:** `{unit_code, role_code, scope_code?}` ⇒ `201` o `200` idempotente
  (ambos éxito) con `{detail, assignment_id}`; `400` ⇒ F-01; `403` ⇒ F-02; red ⇒ F-06.

---

## T-FL-IDT-010 — Baja de asignación

| Campo | Valor |
|---|---|
| Objetivo | Quitar asignación por `assignment_id` en la ruta, con ST-10 identificadora y advertencia de restauración del tirador si era la última. |
| Flujo | [FL-IDT-010](../experience/flows/identity.md#fl-idt-010--baja-de-asignación) |
| OP (AC canónicos) | OP-USR-011 |
| SCREEN | [SCREEN-USER-DETAIL](../experience/screens/identity.md#screen-user-detail--ficha-de-usuario) |
| Requisitos | R-DOM-ID-008 (confirmación; actualización; advertencia de restauración); R-RUL-12 vía flujo. |
| Precondiciones / dependencias | T-FL-IDT-009 (asignación visible con su id). |
| Archivos probables | `components/identity/AssignmentsPanel.vue`. |
| Done when | Las asignaciones se actualizan desde la respuesta y la restauración del tirador, cuando ocurrió, es visible. |

**Criterios.**

- **AC-OP-USR-011:** sin body; `{detail}` ⇒ ST-06; `403` ⇒ F-02; `404` (assignment ya
  inexistente) ⇒ F-04 explícito sin borrado local; red ⇒ F-06.

---

## T-FL-IDT-011 — Consulta de puestos e histórico

| Campo | Valor |
|---|---|
| Objetivo | Listado y ficha de puestos que **distingue puesto de assignment y de membership**, con contadores, estado y el histórico devuelto (activos e históricos), sin cronología inferida. |
| Flujo | [FL-IDT-011](../experience/flows/identity.md#fl-idt-011--consulta-de-puestos-e-histórico) |
| OP (AC canónicos) | OP-POS-001, OP-POS-003, OP-POS-009 |
| SCREEN | [SCREEN-POSITIONS, SCREEN-POSITION-DETAIL](../experience/screens/identity.md) — DS `tables-basic.html` + `ui-tabs.html`/`ui-list-group.html` |
| Requisitos | R-DOM-ID-013 (campos y distinción conceptual); R-DOM-ID-017 faceta de histórico (lista devuelta, no inferida). |
| Precondiciones / dependencias | Bloque común. |
| Archivos probables | `views/organizacion/PositionsView.vue`, `views/organizacion/PositionDetailView.vue`. |
| Done when | La ficha muestra contadores y estado coherentes con la lista; el histórico presenta exactamente los holders devueltos. |

**Criterios.**

- **AC-OP-POS-001:** array con FKs y códigos/nombres derivados,
  `current_holders_count`, `is_active`, `is_unique_holder`, timestamps; búsqueda/orden
  client-side; vacío ⇒ ST-03; `403` ⇒ ST-07.
- **AC-OP-POS-003:** la ficha muestra el objeto devuelto; ausentes ⇒ `—`; `404` ⇒ F-04.
- **AC-OP-POS-009:** `{position_code, position_name, holders[]}` con activos e
  históricos **devueltos**; sin cronología inferida ni fechas inventadas.

---

## T-FL-IDT-012 — Alta y edición de puesto

| Campo | Valor |
|---|---|
| Objetivo | Editor por códigos (`code`*, `name`*, `organization_unit_code_write`*, `role_code_write`* y opcionales de armería/scope/recinto, `description`, `is_active`, `is_unique_holder`) con selectores de catálogos reales, explicación visible del recinto (sólo actúa con scope `todo_recinto`) y `null` que limpia opcionales sólo por elección expresa. |
| Flujo | [FL-IDT-012](../experience/flows/identity.md#fl-idt-012--alta-y-edición-de-puesto) |
| OP (AC canónicos) | OP-POS-002, OP-POS-004, OP-POS-005 |
| SCREEN | [SCREEN-POSITIONS](../experience/screens/identity.md#screen-positions--puestos) (editor compartido con la ficha) |
| Requisitos | R-DOM-ID-014 (campos y limpieza expresa); R-DOM-ID-015 (recinto explicado; sin afirmar ampliación de alcance con otro scope). |
| Precondiciones / dependencias | Selectores: T-FL-ORG-007 (unidad), T-FL-AZ-001 (roles), T-FL-AZ-004 (scopes), T-FL-ARM-001 (armerías), T-FL-ORG-008 (recintos) — sólo sus módulos API. |
| Archivos probables | `components/identity/PositionFormModal.vue`. |
| Done when | El puesto creado/editado muestra los códigos resueltos dentro del tenant por el servidor; la nota de recinto es visible junto a su selector. |

**Criterios.**

- **AC-OP-POS-002 / AC-OP-POS-004 / AC-OP-POS-005:** `201`/`200` ⇒ ST-06 y refresco de
  listado y ficha; `400` (código no resuelto en tenant) ⇒ F-01 sobre el selector;
  `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09.

---

## T-FL-IDT-013 — Eliminación de puesto

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 que identifica el puesto y muestra `current_holders_count`; sin prometer reasignación de holders (el contrato no la declara). |
| Flujo | [FL-IDT-013](../experience/flows/identity.md#fl-idt-013--eliminación-de-puesto) |
| OP (AC canónicos) | OP-POS-006 |
| SCREEN | [SCREEN-POSITIONS](../experience/screens/identity.md#screen-positions--puestos) |
| Requisitos | R-RES-24 vía T-CORE-UI; honestidad contractual del flujo. |
| Precondiciones / dependencias | T-FL-IDT-011. |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | El listado se refresca sólo tras éxito; la confirmación no prometió efectos no declarados. |

**Criterios.**

- **AC-OP-POS-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06 y refresco; `403` ⇒ F-02; `404` ⇒
  F-04; red ⇒ F-06 sin borrado local.

---

## T-FL-IDT-014 — Asignación de holder

| Campo | Valor |
|---|---|
| Objetivo | Asignar holder (`{account_id, is_primary?, starts_at?}`) con consecuencia visible **antes** cuando el puesto es `is_unique_holder` (cese del previo) y aceptación de `201` y `200` idempotente como éxito. |
| Flujo | [FL-IDT-014](../experience/flows/identity.md#fl-idt-014--asignación-de-holder) |
| OP (AC canónicos) | OP-POS-007 |
| SCREEN | [SCREEN-POSITION-DETAIL](../experience/screens/identity.md#screen-position-detail--ficha-de-puesto) — panel holders |
| Requisitos | R-DOM-ID-016 (opcionales; consecuencia de puesto único; doble éxito). |
| Precondiciones / dependencias | T-FL-IDT-011; personas candidatas desde consulta real (OP-USR-001 u OP-AZC-003 según el panel consumidor — sólo API). |
| Archivos probables | `components/identity/HolderAssignModal.vue`. |
| Done when | `current_holders_count`, lista de holders e histórico se refrescan desde las respuestas; el cese del holder previo en puesto único fue anunciado antes del envío. |

**Criterios.**

- **AC-OP-POS-007:** `201` con `PositionHolderSerializer` o `200 {detail,
  assignment_id}` (ambos éxito); `400` (fuera de rama u otra validación) ⇒ F-01 literal;
  `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin holder local.

---

## T-FL-IDT-015 — Baja de holder

| Campo | Valor |
|---|---|
| Objetivo | Quitar holder por `assignment_id` en la ruta con ST-10, y refresco de contador, holders e histórico tras la respuesta. |
| Flujo | [FL-IDT-015](../experience/flows/identity.md#fl-idt-015--baja-de-holder) |
| OP (AC canónicos) | OP-POS-008 |
| SCREEN | [SCREEN-POSITION-DETAIL](../experience/screens/identity.md#screen-position-detail--ficha-de-puesto) |
| Requisitos | R-DOM-ID-017 (confirmación; refresco de contador, holders e histórico). |
| Precondiciones / dependencias | T-FL-IDT-014 (holder visible). |
| Archivos probables | `components/identity/HoldersPanel.vue`. |
| Done when | El contador es coherente con la lista refrescada; el holder cesado aparece en el histórico con `ends_at` fijado por el servidor. |

**Criterios.**

- **AC-OP-POS-008:** sin body ⇒ `{detail}` y ST-06 con refresco triple; `403` ⇒ F-02;
  `404` ⇒ F-04; red ⇒ F-06.

---

## T-FL-IDT-016 — Alta y edición de membership

| Campo | Valor |
|---|---|
| Objetivo | Administrar la pertenencia orgánica (`account`*, `unit`* FK directas; `is_primary`, `is_active`, `starts_at`, `ends_at` opcionales; tenant inyectado por la vista, no enviado) rotulada como **distinta** de puesto y holder; cubre las lecturas del listado y detalle (reserva). |
| Flujo | [FL-IDT-016](../experience/flows/identity.md#fl-idt-016--alta-y-edición-de-membership) |
| OP (AC canónicos) | OP-MEM-002, OP-MEM-004, OP-MEM-005; **reserva:** OP-MEM-001, OP-MEM-003 |
| SCREEN | [SCREEN-MEMBERSHIPS](../experience/screens/identity.md#screen-memberships--pertenencias-orgánicas) |
| Requisitos | R-DOM-ID-018 (campos; rotulación de pertenencia orgánica); R-DOM-ID-019 faceta de primaria (refrescar el contexto afectado **antes** de mostrar unidad efectiva); R-RES-14 vía flujo (permisos derivados del par `(position, action)`: alta exige `assign_positions` — criterio observable de familia). |
| Precondiciones / dependencias | Bloque común; selectores de cuenta y unidad desde datos reales. |
| Archivos probables | `views/organizacion/MembershipsView.vue`, `components/identity/MembershipFormModal.vue`. |
| Done when | El listado y la edición muestran los campos devueltos (`id, rut, unit_code, unit_name, created_at`); la rotulación distingue membership de assignment; un cambio de primaria refresca el contexto antes de pintar unidad efectiva. |

**Criterios.**

- **AC-OP-MEM-001 (reserva):** `GET /memberships/` alimenta el listado con búsqueda/orden
  client-side; vacío ⇒ ST-03; `403` ⇒ ST-07 (denegación visible, no dato vacío).
- **AC-OP-MEM-002:** `201` con `{id, rut, unit_code, unit_name, created_at}` ⇒ ST-06 y
  refresco del listado y del contexto afectado; `400` ⇒ F-01; `403` ⇒ F-02; red ⇒ F-06;
  cancelar ⇒ F-09.
- **AC-OP-MEM-003 (reserva):** `GET /memberships/{id}/` sirve de prefill al editor;
  `404` ⇒ F-04.
- **AC-OP-MEM-004 / AC-OP-MEM-005:** `200` ⇒ ST-06 y refresco de detalle; un solo
  `is_primary=True` por account: el conflicto lo resuelve el backend y la UI lo muestra,
  sin resolverlo localmente.

---

## T-FL-IDT-017 — Baja de membership y cambio de primaria

| Campo | Valor |
|---|---|
| Objetivo | Desactivar (`PATCH is_active=false`) o eliminar (`DELETE`) con ST-10 cuando afecta la primaria, distinguiendo membership de asignación funcional y sin asumir efectos sobre ésta. |
| Flujo | [FL-IDT-017](../experience/flows/identity.md#fl-idt-017--baja-de-membership-y-primaria) |
| OP | OP-MEM-006 (AC canónico aquí); OP-MEM-004/005 — **referencia** a T-FL-IDT-016. |
| SCREEN | [SCREEN-MEMBERSHIPS](../experience/screens/identity.md#screen-memberships--pertenencias-orgánicas) |
| Requisitos | R-DOM-ID-019 (refresco del contexto afectado; sin asumir modificación de la asignación funcional); R-RES-14 vía flujo (baja exige `revoke_positions`). |
| Precondiciones / dependencias | T-FL-IDT-016. |
| Archivos probables | `components/identity/MembershipsPanel.vue`. |
| Done when | El contexto afectado se refresca y la UI no rotula ningún cambio sobre la asignación funcional que la respuesta no declare. |

**Criterios.**

- **AC-OP-MEM-006:** ST-10 ⇒ `DELETE /memberships/{id}/`; éxito ⇒ ST-06 y refresco del
  contexto; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin cambio local.

---

> 🕯️ Reserva de familia: el orden de evaluación de permisos (bypass `super_admin` →
> override DENY → override ALLOW → `PositionPermission` → `RolePermission` → DENY) es
> backend; ninguna matriz ni panel de estas tareas lo reimplementa o sustituye
> ([../contracts/authorization.md](../contracts/authorization.md) §Evaluación).
