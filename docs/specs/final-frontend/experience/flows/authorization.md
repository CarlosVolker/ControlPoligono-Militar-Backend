---
spec_meta: "../../spec-meta.yaml"
---

# Flujos — Autorización, matrices y auditoría

> 📜 Yo detallo aquí los trece flujos de RBAC y consultas operativas más la bitácora de
> auditoría. Requisitos de familia:
> [identity-authorization.md](../../requirements/identity-authorization.md); contratos:
> [authorization.md](../../contracts/authorization.md) y
> [auth-context.md](../../contracts/auth-context.md) §Auditoría. Regla de familia: un
> `403` sigue siendo denegación visible aunque la UI ya haya ocultado la acción.

## Índice

1. [FL-AZ-001 — Consulta de roles](#fl-az-001--consulta-de-roles)
2. [FL-AZ-002 — Alta y edición de rol](#fl-az-002--alta-y-edición-de-rol)
3. [FL-AZ-003 — Eliminación de rol](#fl-az-003--eliminación-de-rol)
4. [FL-AZ-004 — Catálogos de scopes y permisos](#fl-az-004--catálogos-de-scopes-y-permisos)
5. [FL-AZ-005 — Matriz rol → permiso](#fl-az-005--matriz-rol--permiso)
6. [FL-AZ-006 — Matriz puesto → permiso](#fl-az-006--matriz-puesto--permiso)
7. [FL-AZ-007 — Alta y edición de override](#fl-az-007--alta-y-edición-de-override)
8. [FL-AZ-008 — Eliminación de override](#fl-az-008--eliminación-de-override)
9. [FL-AZ-009 — Consulta de overrides](#fl-az-009--consulta-de-overrides)
10. [FL-AZ-010 — Fill de matriz con catálogo](#fl-az-010--fill-de-matriz-con-catálogo)
11. [FL-AZ-011 — Categorías de roles](#fl-az-011--categorías-de-roles)
12. [FL-AZ-012 — Personas por unidad](#fl-az-012--personas-por-unidad)
13. [FL-AZ-013 — Unidades elegibles por persona](#fl-az-013--unidades-elegibles-por-persona)
14. [FL-AUD-001 — Bitácora de auditoría](#fl-aud-001--bitácora-de-auditoría)

---

### FL-AZ-001 — Consulta de roles

- **Actor / permiso:** IA+TA; lectura abierta (OP-ROL-001/003).
- **Pantalla:** catálogo de roles (`SCREEN/authz-roles` provisional).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Abre el catálogo | `GET /authz/roles/` (OP-ROL-001) | array con `id` RO, `code`, `name`, `description`, `is_active`, `is_system` | Lista con badges de estado y de rol de sistema |
| 2 | Abre un rol | `GET /authz/roles/{id}/` (OP-ROL-003) | objeto de rol | Ficha con enlace a su matriz de permisos (FL-AZ-005) |

- **Fallos:** `403` → F-02. Red → F-06/F-10. Vacío → ST-03; vacío no significa que no
  existan roles fuera del alcance (R-DOM-AZ-007 aplica análogo).

---

### FL-AZ-002 — Alta y edición de rol

- **Actor / permiso:** IA+TA+**TAdmin** (OP-ROL-002, OP-ROL-004/005); las mutaciones
  sólo se ofrecen al contexto administrativo.
- **Entradas:** `code`*, `name`*; `description`, `is_active`, `is_system` opcionales
  (R-DOM-AZ-001).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Envía el formulario | `POST /authz/roles/` (OP-ROL-002) o `PUT`/`PATCH` (OP-ROL-004/005) | `201`/`200` con el rol | ST-06; refresca catálogo |

- **Fallos:** `400` → F-01. `403` sin TAdmin → F-02 (denegación, no ocultación
  silenciosa si el usuario llegó igual a enviar). Red → F-06. Cancelar → F-09.

---

### FL-AZ-003 — Eliminación de rol

- **Actor / permiso:** IA+TA+TAdmin (OP-ROL-006).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 que identifica el rol y muestra `is_system` | — | El contrato no declara para `Role` una restricción de sistema más allá de TAdmin (la restricción `super_admin` documentada es para `RolePermission` de rol de sistema, FL-AZ-005): la UI muestra `is_system` como advertencia informativa, sin inventar un bloqueo que el contrato no declara |
| 2 | Confirma | `DELETE /authz/roles/{id}/` (OP-ROL-006) | respuesta del backend | Refresca catálogo sólo tras éxito |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

---

### FL-AZ-004 — Catálogos de scopes y permisos

- **Actor / permiso:** IA+TA; sólo lectura (OP-SCP-001/002, OP-PRM-001/002).
- **Pantalla:** catálogos (`SCREEN/authz-roles`, `SCREEN/authz-permisos` provisionales).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Abre scopes | `GET /authz/scopes/` (OP-SCP-001), detalle OP-SCP-002 | `id, code, name, description` RO | Catálogo **sin** botones de alta/edición/eliminación (R-DOM-AZ-002) |
| 2 | Abre permisos | `GET /authz/permissions/` (OP-PRM-001), detalle OP-PRM-002 | `id, code, name, category, description, is_active` RO; sólo permisos activos | Ídem; alimenta selectores de las matrices |

- **Nota:** editar el catálogo de permisos no existe como capacidad
  (`requirements.md` §8): `PermissionViewSet` es ReadOnly y la UI no falsifica la
  mutación.
- **Fallos:** `403` → F-02. Red → F-06/F-10. Vacío → ST-03.

---

### FL-AZ-005 — Matriz rol → permiso

- **Actor / permiso:** IA+TA+TAdmin (OP-RPR-001…006); permisos de un **rol de sistema**
  sólo los muta `super_admin`.
- **Pantalla:** matriz (`SCREEN/authz-permisos` provisional), con fill desde FL-AZ-010.
- **Entradas:** `role`, `permission`, `allowed` (W*); `id, role_code, permission_code,
  permission_name, permission_category` son RO.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Marca/desmarca una celda | `POST /authz/role-permissions/` (OP-RPR-002) o `PUT`/`PATCH` (OP-RPR-004/005) con `{role, permission, allowed}` | registro con campos RO resueltos | ST-05 por celda → ST-06; refresca la fila |
| 2 | Quita una concesión | ST-10 ligera sobre la celda; `DELETE` (OP-RPR-006) | respuesta del backend | Refresca la matriz tras éxito |

- **Bloqueo visible:** celdas de rol de sistema deshabilitadas salvo contexto
  `super_admin` (R-RES-07, R-DOM-AZ-003); si aun así llega `403`, F-02 literal.
- **Fallos:** `400` → F-01. `403` → F-02. `404` → F-04. Red → F-06: la celda revierte
  al valor confirmado por el backend, nunca a un optimista.

---

### FL-AZ-006 — Matriz puesto → permiso

- **Actor / permiso:** IA+TA+TAdmin (OP-PPR-001…006); sólo posiciones del tenant.
- **Entradas:** `position`, `permission`, `allowed` (W*); `id, position_code,
  permission_code, permission_name` RO.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Elige puesto del tenant y permiso; envía | `POST /authz/position-permissions/` (OP-PPR-002), `PUT`/`PATCH` (OP-PPR-004/005), `DELETE` (OP-PPR-006) | registro con RO resueltos | ST-06; refresca la matriz tras éxito |

- **Fallos:** `400` por puesto fuera de tenant → F-01 **sin insertar fila local**
  (R-DOM-AZ-004). `403` → F-02. Red → F-06.

---

### FL-AZ-007 — Alta y edición de override

- **Actor / permiso:** IA+TA+TAdmin (OP-OVR-002, OP-OVR-004/005); el account debe
  pertenecer al tenant; `created_by` lo fija el servidor.
- **Pantalla:** overrides por persona (`SCREEN/authz-overrides` provisional).
- **Entradas:** `account`*, `allowed`*; `permission` o `permission_code` (nullable),
  `resource`, `action`, `reason` opcionales (R-DOM-AZ-005). `id, account_rut, created_by,
  created_by_rut, created_at` son RO.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Selecciona cuenta del tenant y completa | `POST /authz/overrides/` (OP-OVR-002) o `PUT`/`PATCH` (OP-OVR-004/005) | registro con `created_by` fijado por servidor | ST-06; refresca listado; `created_by` se muestra como metadato RO |

- **Semántica visible:** el override participa en la evaluación con precedencia alta
  (DENY antes que ALLOW, [contrato](../../contracts/authorization.md) §Evaluación): la
  UI lo rotula como excepción individual, no como permiso de rol.
- **Fallos:** `400` (account fuera de tenant) → F-01. `403` → F-02. Red → F-06.

---

### FL-AZ-008 — Eliminación de override

- **Actor / permiso:** IA+TA+TAdmin (OP-OVR-006).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 que identifica cuenta y permiso/recurso | — | Modal abierto |
| 2 | Confirma | `DELETE /authz/overrides/{id}/` (OP-OVR-006) | respuesta del backend | Refresca listado sólo tras éxito |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

---

### FL-AZ-009 — Consulta de overrides

- **Actor / permiso:** IA+TA+TAdmin; tenant del account (OP-OVR-001/003).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Abre el listado | `GET /authz/overrides/` (OP-OVR-001) | array con campos RO y W del contrato | Lista con búsqueda client-side (R-RES-22) |
| 2 | Abre uno | `GET /authz/overrides/{id}/` (OP-OVR-003) | objeto | Detalle |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10. Vacío → ST-03.

---

### FL-AZ-010 — Fill de matriz con catálogo

- **Actor / permiso:** IA+TA (OP-AZC-001).
- **Pantalla:** matrices de FL-AZ-005/006 (`technical-design.md` §8).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Se abre una matriz | `GET /authz/catalog/` (OP-AZC-001) | `{roles, scopes, resources, actions}` — 11 recursos y 8 acciones, con `label` y `description` en actions para tooltips | Rellena ejes de la matriz; los `label`/`description` alimentan tooltips |

- **Límites de interpretación:** el catálogo es ayuda de selección; no sustituye a
  `context.permissions` (lista efectiva del usuario) y **no** prueba que cada acción
  catalogada tenga endpoint (R-DOM-AZ-006); `export`/`read_own` figuran sin endpoint
  implementado (`requirements.md` §8).
- **Fallos:** `403` → F-02. Red → F-06: la matriz no se rellena con catálogos de
  memoria ni hardcodeados.

---

### FL-AZ-011 — Categorías de roles

- **Actor / permiso:** IA+TA (OP-AZC-002).
- **Pantalla:** panel de permisos por persona (`FL/asignaciones` provisional;
  `technical-design.md` §8: checkboxes de rol agrupados).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Se abre el panel de roles | `GET /authz/role-categories/` (OP-AZC-002) | `{categories:[{code, label, roles:[{code, name, description}]}]}` | Agrupa los checkboxes en las 4 categorías operativas (`admin`, `mando`, `tiro`, `almacen`) tal como responde el backend |

- **Fallos:** `403` → F-02. Red → F-06. Vacío → ST-03: no significa que no existan
  roles fuera del alcance (R-DOM-AZ-007).

---

### FL-AZ-012 — Personas por unidad

- **Actor / permiso:** IA+TA (OP-AZC-003).
- **Pantalla:** panel de permisos por unidad (`SCREEN/authz-personas` provisional).
- **Entradas:** `unit_code`*; `include_descendants=true` opcional.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Selecciona unidad y opcionalmente descendientes | `GET /authz/personas-por-unidad/?unit_code=…&include_descendants=…` (OP-AZC-003) | `{results:[{user, unidad_personal_code, unidad_personal_name, assignments}]}` | Lista de personas con rol funcional; **excluye el `tirador` implícito** (`technical-design.md` §8) |

- **Fallos:** `400` (falta `unit_code`) → F-01. `404` → F-04. `403` → F-02: los tres
  códigos se distinguen (R-DOM-AZ-008). Red → F-06/F-10.

---

### FL-AZ-013 — Unidades elegibles por persona

- **Actor / permiso:** IA+TA (OP-AZC-004).
- **Pantalla:** selector de unidad en alta de usuario y en `agregar-asignacion`
  (`technical-design.md` §8; alimenta FL-IDT-002/007/009).
- **Entradas:** `user_id`*.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | El flujo abre el selector | `GET /authz/eligible-target-units/?user_id=…` (OP-AZC-004) | `{results:[{id, code, name}], unidad_personal_code}`; puede devolver `reason: sin_account \| sin_unidad_personal` | Opciones = unidad personal + hasta 2 ancestros filtrados por la rama del solicitante; el `reason` se presenta como **restricción operativa**, no como lista vacía (R-DOM-AZ-009) |

- **Fallos:** `400` (falta `user_id`) → F-01. `404` → F-04. `403` → F-02. Red → F-06:
  el selector no se rellena de memoria.

---

### FL-AUD-001 — Bitácora de auditoría

- **Actor / permiso:** sólo `tenant_admin`, `super_admin` o `auditor` (OP-AUT-004);
  para cualquier otro rol, `403`.
- **Pantalla:** `/auditoria` (`SCREEN/auditoría` provisional).
- **Entradas:** `?limit=N`, default `100`, tope superior `500`; el cliente no envía un
  `limit` superior al tope.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre la bitácora | `GET /auth/audit-log/?limit=N` (OP-AUT-004) | `{count, results:[{created_at, endpoint, action, allowed, reason, organization_unit_code, user_id_value}]}` | Tabla con los siete campos por registro y `count` visible; `allowed` se muestra como badge semántico |
| 2 | Ajusta `limit` | nueva consulta con el valor elegido (≤ 500) | nueva página de resultados | Refresca la tabla; sin paginación inventada más allá del `limit` declarado |

- **Postcondición observable:** la bitácora muestra sólo eventos devueltos; vacío →
  ST-03, **sin fabricar eventos** (R-DOM-AZ-010).
- **PII:** `user_id_value` se muestra en pantalla pero no se registra en logs ni
  artefactos (R-DAT-06).
- **Fallos:** `403` (rol no declarado) → F-02, denegación visible; la entrada de menú
  sólo aparece para los tres roles (R-RES-25). Red → F-06/F-10.
