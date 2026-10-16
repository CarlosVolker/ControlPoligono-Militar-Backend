---
spec_meta: "../../spec-meta.yaml"
---

# Flujos — Identidad: usuarios, asignaciones, puestos y memberships

> 📜 Yo detallo aquí los diecisiete flujos de identidad. Requisitos de familia:
> [identity-authorization.md](../../requirements/identity-authorization.md); contratos:
> [organization-identity.md](../../contracts/organization-identity.md) §§3–4 y
> [auth-context.md](../../contracts/auth-context.md). Regla de autoridad: la UI puede
> ocultar acciones según el contexto, pero sólo el backend decide tenant, unidad y
> permiso efectivo; un `403` no se convierte en dato vacío.

## Índice

1. [FL-IDT-001 — Consulta de usuarios](#fl-idt-001--consulta-de-usuarios)
2. [FL-IDT-002 — Alta de usuario formal](#fl-idt-002--alta-de-usuario-formal)
3. [FL-IDT-003 — Promoción de temporal](#fl-idt-003--promoción-de-temporal)
4. [FL-IDT-004 — Alta de usuario temporal](#fl-idt-004--alta-de-usuario-temporal)
5. [FL-IDT-005 — Edición de usuario](#fl-idt-005--edición-de-usuario)
6. [FL-IDT-006 — Eliminación de usuario](#fl-idt-006--eliminación-de-usuario)
7. [FL-IDT-007 — Asignación principal](#fl-idt-007--asignación-principal)
8. [FL-IDT-008 — Desactivación de la principal](#fl-idt-008--desactivación-de-la-principal)
9. [FL-IDT-009 — Alta de asignación secundaria](#fl-idt-009--alta-de-asignación-secundaria)
10. [FL-IDT-010 — Baja de asignación](#fl-idt-010--baja-de-asignación)
11. [FL-IDT-011 — Consulta de puestos e histórico](#fl-idt-011--consulta-de-puestos-e-histórico)
12. [FL-IDT-012 — Alta y edición de puesto](#fl-idt-012--alta-y-edición-de-puesto)
13. [FL-IDT-013 — Eliminación de puesto](#fl-idt-013--eliminación-de-puesto)
14. [FL-IDT-014 — Asignación de holder](#fl-idt-014--asignación-de-holder)
15. [FL-IDT-015 — Baja de holder](#fl-idt-015--baja-de-holder)
16. [FL-IDT-016 — Alta y edición de membership](#fl-idt-016--alta-y-edición-de-membership)
17. [FL-IDT-017 — Baja de membership y primaria](#fl-idt-017--baja-de-membership-y-primaria)

---

### FL-IDT-001 — Consulta de usuarios

- **Actor / permiso:** `user:read → view_personnel_basic` (OP-USR-001/003; tenant+rama).
- **Pantalla:** listado y ficha de persona (`SCREEN/usuarios` provisional).
- **Entradas:** búsqueda/orden/selección **en cliente** sobre el array plano (R-RES-22).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre el listado | `GET /usuarios/` (OP-USR-001) | array con `id_usuario`, identidad (`rut, grado, nombre, apellido_paterno, apellido_materno, correo`), `habilitado`, `is_locked`, flags de contraseña, `primary_assignment`, `assignments` | Lista sólo personas del scope; la tabla diferencia identidad de asignaciones activas (R-DOM-ID-001); acciones visibles según `permissions` del contexto |
| 2 | Abre una ficha | `GET /usuarios/{id}/` (OP-USR-003) | objeto de usuario | Ficha con secciones de identidad, asignaciones y estado de cuenta (panel de bloqueo vía FL-PWD-004) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10. Vacío → ST-03 (F-11).

---

### FL-IDT-002 — Alta de usuario formal

- **Actor / permiso:** `user:create → create_users` (OP-USR-002; tenant+rama).
- **Pantalla:** formulario de alta de persona.
- **Precondición:** selectores alimentados por catálogos reales: roles por categoría
  (OP-AZC-002, FL-AZ-011) y unidades elegibles por persona (OP-AZC-004, FL-AZ-013;
  `technical-design.md` §8 lo asigna al alta de usuario).
- **Entradas:** `rut`*, `apellido_paterno`*, `apellido_materno`*; `grado`, `nombre`,
  `correo` opcionales; en alta además `initial_unit_code`, `initial_role_code`,
  `initial_scope_code` cuando el flujo los solicita — se consumen fuera del serializer
  ([contrato](../../contracts/organization-identity.md) §Usuarios). Campos derivados y
  flags de contraseña son sólo lectura (R-DOM-ID-002).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa identidad y contexto inicial | ninguna (formulario en ST-09 mientras edita) | — | Validación visual de requeridos; los selectores sólo ofrecen valores retornados |
| 2 | Envía | `POST /usuarios/` (OP-USR-002) | `201` con `UsuarioSerializer`; el backend garantiza assignment tirador implícito y `UnitMembership` (helpers del contrato) | ST-06; refresca listado; la ficha muestra `primary_assignment` y `assignments` devueltos |

- **Advertencia obligatoria previa:** si el RUT coincide con un temporal existente, la
  pantalla de alta **advierte antes del envío** que la creación promueve el registro y
  conserva su historial (R-DOM-ID-003, R-RUL-06) → ver FL-IDT-003.
- **Postcondición observable:** la persona existe con su asignación inicial real; nada
  se inventó en la tabla local antes del `201`.
- **Fallos:** `400` → F-01 (RUT duplicado formal → F-05 sobre `rut`). `403` → F-02.
  Red → F-06 sin fila optimista. Cancelar → F-09.

---

### FL-IDT-003 — Promoción de temporal

- **Actor / permiso:** `user:create → create_users` (OP-USR-002 sobre RUT temporal).
- **Pantalla:** formulario de alta formal con advertencia visible.
- **Precondición:** existe `Usuario(is_temporary=True)` con el mismo RUT.
- **Entradas:** las de FL-IDT-002.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Ingresa el RUT que coincide con un temporal | ninguna todavía | — | La pantalla advierte **antes** del alta que la creación promueve el temporal y conserva su historial (R-RUL-06) |
| 2 | Confirma el alta formal | `POST /usuarios/` (OP-USR-002) | `201`; `perform_create` **promueve**: actualiza el registro, limpia `is_temporary`, restablece `username` y contraseña temporal; **no duplica** | ST-06; el listado muestra un único registro promovido con su historial |

- **Dirección inequívoca:** la promoción ocurre al crear la cuenta **formal** a partir de
  un temporal existente, nunca al revés: `crear-temporal` devuelve `400` si el RUT ya
  existe como temporal o formal (R-RUL-06). El alta temporal **no** se ofrece como
  mecanismo de promoción (R-DOM-ID-003).
- **Postcondición observable:** un solo registro con el RUT, `is_temporary` limpio y los
  resultados históricos conservados.
- **Fallos:** los de FL-IDT-002.

---

### FL-IDT-004 — Alta de usuario temporal

- **Actor / permiso:** `user:create → create_users` (OP-USR-012; consumidor
  `FL/captura-tiro`).
- **Pantalla:** alta rápida dentro del flujo de captura o ficha de personas.
- **Precondición:** tirador sin cuenta formal que necesita registrar resultados
  (`requirements.md` §8, capacidad cubrible).
- **Entradas:** `rut`*; `grado`, `nombre`, apellidos opcionales;
  `organization_unit_code` opcional.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa el RUT y envía | `POST /usuarios/crear-temporal/` (OP-USR-012) | `201` con `UsuarioSerializer` | ST-06; indica de forma visible que **el temporal no inicia sesión** (R-DOM-ID-004) |

- **Postcondición observable:** el temporal queda seleccionable como tirador en la
  captura (FL-SHT-015/016) con su `id_usuario` real.
- **Fallos:** RUT existente (temporal o formal) → `400` → F-05: error del backend sin
  duplicado en la tabla (R-DOM-ID-004). `403` → F-02. Red → F-06.

---

### FL-IDT-005 — Edición de usuario

- **Actor / permiso:** `user:update → update_users` (OP-USR-004/005).
- **Entradas:** campos W del serializer (`rut`, identidad); los campos derivados y flags
  permanecen RO y no se envían (R-DOM-ID-002).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Edita y envía | `PUT` (OP-USR-004) o `PATCH` (OP-USR-005) `/usuarios/{id}/` | `200` con el usuario | ST-06; refresca ficha y listado |

- **Fallos:** `400` → F-01. `403` → F-02. `404` → F-04. Red → F-06. Cancelar → F-09.

---

### FL-IDT-006 — Eliminación de usuario

- **Actor / permiso:** `user:delete → disable_users` (OP-USR-006).
- **Precondición:** usuario cargado desde el listado/ficha.

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 destructiva que identifica a la persona (R-DOM-ID-012) | — | Modal abierto |
| 2 | Confirma | `DELETE /usuarios/{id}/` (OP-USR-006) | respuesta del backend | Refleja el resultado real; **no asume borrado físico** ni oculta el registro antes del éxito (R-DOM-ID-012) |

- **Nota de contrato:** el permission code mapeado es `disable_users`
  (`backend-inventory.md` OP-USR-006); la UI no rotula el efecto como eliminación física
  si la respuesta no la declara.
- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

---

### FL-IDT-007 — Asignación principal

- **Actor / permiso:** `user:update → update_users` (OP-USR-007 `PUT` / OP-USR-008
  `PATCH`; consumidor `FL/asignación-principal`).
- **Pantalla:** panel de asignaciones de la ficha de persona.
- **Precondición:** selectores reales: unidad desde OP-AZC-004 (FL-AZ-013), rol desde
  OP-AZC-002 (FL-AZ-011), scope desde OP-SCP-001 (FL-AZ-004).
- **Entradas:** `{unit_code, role_code, scope_code?}`.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Elige unidad, rol y scope opcional | ninguna (ST-09) | — | El selector de unidad muestra `unidad_personal_code` y `reason` si aplican (FL-AZ-013) |
| 2 | Envía | `PUT /usuarios/{id}/asignacion-principal/` (OP-USR-007) o `PATCH` (OP-USR-008) | `{detail, unit_code, role_code, scope_code}`; la principal previa queda desactivada; crea Position/Assignment y garantiza tirador y `UnitMembership` ([contrato](../../contracts/organization-identity.md) §Usuarios) | ST-06 con la respuesta efectiva; refresca usuario, memberships y puestos implicados (R-DOM-ID-005) |

- **Postcondición observable:** `primary_assignment` del usuario refleja la nueva
  combinación y la anterior aparece desactivada en `assignments`.
- **Fallos:** `400` → F-01. `403` → F-02. `404` → F-04. Red → F-06. Cancelar → F-09.

---

### FL-IDT-008 — Desactivación de la principal

- **Actor / permiso:** `user:update` (OP-USR-009; consumidor `FL/asignaciones`).
- **Entradas:** ninguna; no lleva body.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Pulsa desactivar | Confirmación ST-10 (R-DOM-ID-006) | — | Modal que advierte: si no queda otra asignación, el backend **preserva o recrea el tirador implícito** (R-RUL-12) |
| 2 | Confirma | `POST /usuarios/{id}/desactivar-asignacion-principal/` (OP-USR-009) | `{detail, desactivadas}` | ST-06 mostrando `desactivadas`; refresca asignaciones con el tirador visible si se recreó |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin cambio local.

---

### FL-IDT-009 — Alta de asignación secundaria

- **Actor / permiso:** `user:update` (OP-USR-010).
- **Precondición:** mismos selectores que FL-IDT-007.
- **Entradas:** `{unit_code, role_code, scope_code?}`.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Envía | `POST /usuarios/{id}/agregar-asignacion/` (OP-USR-010) | `201` o `200` idempotente, ambos `{detail, assignment_id}` | Trata `200` y `201` como éxito (R-DOM-ID-007); muestra `assignment_id`; refresca `assignments` |

- **Fallos:** `400` → F-01. `403` → F-02. Red → F-06.

---

### FL-IDT-010 — Baja de asignación

- **Actor / permiso:** `user:update` (OP-USR-011).
- **Precondición:** assignment visible en la ficha, identificado por `assignment_id`.
- **Entradas:** ninguna en el body; el id viaja en la ruta.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Pulsa quitar sobre la asignación | Confirmación ST-10 que identifica la asignación (R-DOM-ID-008) | — | Modal abierto |
| 2 | Confirma | `POST /usuarios/{id}/quitar-asignacion/{assignment_id}/` (OP-USR-011) | `{detail}`; cesa el assignment y **restaura tirador si era el último** | ST-06; actualiza asignaciones y advierte la restauración del tirador cuando ocurrió (R-RUL-12) |

- **Fallos:** `403` → F-02. `404` → F-04 (assignment ya inexistente → error explícito,
  sin borrado local). Red → F-06.

---

### FL-IDT-011 — Consulta de puestos e histórico

- **Actor / permiso:** `position:read` (OP-POS-001/003/009; tenant+unidad).
- **Pantalla:** puestos y holders (`SCREEN/posiciones` provisional).
- **Entradas:** búsqueda/orden en cliente (R-RES-22).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre el listado | `GET /posiciones/` (OP-POS-001) | array con FKs y códigos/nombres derivados, `current_holders_count`, `is_active`, `is_unique_holder`, timestamps | Lista que **distingue puesto de assignment y de membership** (R-DOM-ID-013) |
| 2 | Abre un puesto | `GET /posiciones/{id}/` (OP-POS-003) | objeto de puesto | Ficha con contadores y estado |
| 3 | Abre el histórico | `GET /posiciones/{id}/historico/` (OP-POS-009) | `{position_code, position_name, holders[]}` con activos e históricos | Muestra la lista devuelta, **no** una cronología inferida (R-DOM-ID-017) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10. Vacío → ST-03.

---

### FL-IDT-012 — Alta y edición de puesto

- **Actor / permiso:** `position:create` (OP-POS-002) / `position:update`
  (OP-POS-004/005).
- **Precondición:** selectores por código alimentados desde sus catálogos reales:
  unidad (FL-ORG-007), rol (OP-ROL-001), scope (OP-SCP-001), armería (OP-ARM-001),
  recinto (OP-RCT-001).
- **Entradas:** `code`*, `name`*, `organization_unit_code_write`*, `role_code_write`*;
  opcionales: códigos de armería/scope/recinto, `description`, `is_active`,
  `is_unique_holder`. `null` limpia una relación opcional **sólo** cuando el usuario lo
  elige expresamente (R-DOM-ID-014).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Elige recinto (si aplica) | ninguna | — | El formulario **explica** que el recinto sólo tiene efecto con scope `todo_recinto`; conserva el valor retornado sin afirmar ampliación de alcance con otro scope (R-DOM-ID-015) |
| 2 | Envía | `POST /posiciones/` (OP-POS-002), `PUT` (OP-POS-004) o `PATCH` (OP-POS-005) | `201`/`200` con el puesto; los códigos se resuelven dentro del tenant ([contrato](../../contracts/organization-identity.md) §Puestos) | ST-06; refresca listado y ficha |

- **Fallos:** `400` (código no resuelto en tenant) → F-01 sobre el selector. `403` →
  F-02. `404` → F-04. Red → F-06. Cancelar → F-09.

---

### FL-IDT-013 — Eliminación de puesto

- **Actor / permiso:** `position:delete` (OP-POS-006).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 que identifica el puesto y muestra `current_holders_count` | — | Modal abierto; el contrato no declara reasignación de holders: no se promete |
| 2 | Confirma | `DELETE /posiciones/{id}/` (OP-POS-006) | respuesta del backend | Refresca listado sólo tras éxito |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

---

### FL-IDT-014 — Asignación de holder

- **Actor / permiso:** `position:update` (OP-POS-007; consumidor `FL/holders`).
- **Pantalla:** ficha de puesto.
- **Precondición:** personas candidatas desde una consulta real (OP-USR-001 o
  OP-AZC-003 según el panel consumidor).
- **Entradas:** `{account_id, is_primary?, starts_at?}`.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Selecciona persona y opciones | ninguna (ST-09) | — | Si el puesto es `is_unique_holder`, la UI presenta **antes** la consecuencia: el holder previo será cesado ([contrato](../../contracts/organization-identity.md) §Puestos) |
| 2 | Envía | `POST /posiciones/{id}/asignar-holder/` (OP-POS-007) | `201` con `PositionHolderSerializer` o `200 {detail, assignment_id}` idempotente; valida la rama del puesto | Acepta ambas como éxito (R-DOM-ID-016); refresca `current_holders_count`, holders e histórico |

- **Fallos:** `400` (fuera de rama u otra validación) → F-01 literal. `403` → F-02.
  `404` → F-04. Red → F-06 sin holder local.

---

### FL-IDT-015 — Baja de holder

- **Actor / permiso:** `position:update` (OP-POS-008).
- **Entradas:** `assignment_id` en la ruta; sin body.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Pulsa quitar sobre el holder | Confirmación ST-10 (R-DOM-ID-017) | — | Modal abierto |
| 2 | Confirma | `POST /posiciones/{id}/quitar-holder/{assignment_id}/` (OP-POS-008) | `{detail}`;cesa el holder y fija `ends_at` | ST-06; refresca contador, holders e histórico |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06.

---

### FL-IDT-016 — Alta y edición de membership

- **Actor / permiso:** derivado del par `(position, action)` porque el ViewSet usa
  `resource_name='position'` (OP-MEM-*; T-06). El alta exige `assign_positions` y la
  baja `revoke_positions` como criterio observable de familia (R-RES-14).
- **Pantalla:** pertenencias orgánicas (`SCREEN/memberships` provisional).
- **Precondición:** la membership es **pertenencia orgánica**, separada de puesto y
  holder; la UI la rotula como tal (R-DOM-ID-018).
- **Entradas:** `account`* y `unit`* (FK directas); opcionales `is_primary`, `is_active`,
  `starts_at`, `ends_at`. La vista inyecta tenant: no se envía.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Alta | `POST /memberships/` (OP-MEM-002) | `201` con `id, rut, unit_code, unit_name, created_at` | ST-06; refresca listado de memberships y el contexto afectado |
| 2 | Edición | `PUT` (OP-MEM-004) o `PATCH` (OP-MEM-005) | `200` con la membership | ST-06; refresca detalle |

- **Regla de primaria:** un solo `is_primary=True` por account (regla global del
  proyecto); al modificar la primaria, refrescar el contexto afectado **antes** de
  mostrar una unidad efectiva (R-DOM-ID-019).
- **Fallos:** `400` → F-01. `403` → F-02 (denegación visible, no dato vacío). `404` →
  F-04. Red → F-06. Cancelar → F-09.

---

### FL-IDT-017 — Baja de membership y primaria

- **Actor / permiso:** derivado de `(position, action)`; la baja exige
  `revoke_positions` (R-RES-14).
- **Entradas:** `id` de la membership.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Desactiva o elimina | Confirmación ST-10 cuando afecta pertenencia primaria | — | La confirmación distingue membership de asignación funcional |
| 2 | Envía | `DELETE /memberships/{id}/` (OP-MEM-006) o `PATCH` con `is_active=false` (OP-MEM-005) | respuesta del backend | Refresca el contexto afectado; **no asume** que modifica la asignación funcional (R-DOM-ID-019) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin cambio local.

> 🕯️ Este volumen no define el orden de evaluación de permisos: es backend
> (bypass `super_admin` → override DENY → override ALLOW → `PositionPermission` →
> `RolePermission` → DENY, [authorization.md](../../contracts/authorization.md)
> §Evaluación). La matriz de UI nunca lo sustituye.
