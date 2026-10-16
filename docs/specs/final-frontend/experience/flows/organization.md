---
spec_meta: "../../spec-meta.yaml"
---

# Flujos — Organización: unidades y recintos

> 📜 Yo detallo aquí los doce flujos de organización: consulta y árbol de unidades,
> alta, edición, previsualización y eliminación con migración, los dos selectores
> (lookup y asignables), y la familia completa de recintos incluida su relación M2M por
> código. Requisitos de familia: [organization.md](../../requirements/organization.md);
> contrato: [organization-identity.md](../../contracts/organization-identity.md) §§1 y 3.

## Índice

1. [FL-ORG-001 — Consulta de unidades y árbol](#fl-org-001--consulta-de-unidades-y-árbol)
2. [FL-ORG-002 — Alta de unidad](#fl-org-002--alta-de-unidad)
3. [FL-ORG-003 — Edición de unidad](#fl-org-003--edición-de-unidad)
4. [FL-ORG-004 — Previsualización de eliminación](#fl-org-004--previsualización-de-eliminación)
5. [FL-ORG-005 — Eliminación con migración](#fl-org-005--eliminación-con-migración)
6. [FL-ORG-006 — Lookup de unidades](#fl-org-006--lookup-de-unidades)
7. [FL-ORG-007 — Unidades asignables](#fl-org-007--unidades-asignables)
8. [FL-ORG-008 — Consulta de recintos](#fl-org-008--consulta-de-recintos)
9. [FL-ORG-009 — Alta y edición de recinto](#fl-org-009--alta-y-edición-de-recinto)
10. [FL-ORG-010 — Eliminación de recinto](#fl-org-010--eliminación-de-recinto)
11. [FL-ORG-011 — Agregar unidad a recinto](#fl-org-011--agregar-unidad-a-recinto)
12. [FL-ORG-012 — Quitar unidad de recinto](#fl-org-012--quitar-unidad-de-recinto)

---

### FL-ORG-001 — Consulta de unidades y árbol

- **Actor / permiso:** `organization_unit:read` (OP-UNT-001/003; TA, tenant+rama).
- **Pantalla:** árbol y ficha de unidad (`SCREEN/unidades` provisional).
- **Precondición:** contexto con tenant y unidad activa.
- **Entradas:** ninguna; la jerarquía se construye **en cliente** vía `parent` /
  `parent_code` (`requirements.md` §8, capacidad cubrible).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre el listado | `GET /organization-units/` (OP-UNT-001) | array con `id, tenant, parent_code, code, name, unit_type, is_active` | Dibuja el árbol client-side; búsqueda/orden/ selección en cliente sobre el array plano (R-RES-22, sin paginación inventada) |
| 2 | Selecciona una unidad | `GET /organization-units/{id}/` (OP-UNT-003) | objeto de unidad | Ficha con selección conservada (R-DOM-ORG-001) |

- **Reglas de representación:** sin `parent_code` → rotular raíz; con `parent_code` →
  mostrar la relación por código y nombre resuelto desde la respuesta disponible, o `—`
  si el nombre no está presente; no inferir ramas no entregadas (R-DOM-ORG-002).
- **Postcondición observable:** sólo unidades retornadas por el contrato están
  representadas; la selección navega al detalle.
- **Fallos:** `403` → F-02. Red → F-06 con reintento F-10. `200` vacío → ST-03 (F-11).

---

### FL-ORG-002 — Alta de unidad

- **Actor / permiso:** `organization_unit:create` (OP-UNT-002).
- **Pantalla:** formulario de alta sobre el árbol.
- **Precondición:** listado cargado; selector de padre alimentado por FL-ORG-007
  (R-DOM-ORG-003: no asumir que el listado visible contiene toda la rama).
- **Entradas:** `code`*, `name`*; `parent` (FK directa), `unit_type` —selector limitado a
  `command, division, regiment, battalion, company, section, squad, staff, range, other`—
  e `is_active` opcionales (R-DOM-ORG-004). Se excluyen del envío `id`, `tenant` y
  `parent_code` (R-DOM-ORG-005, R-RUL-01).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa el formulario y envía | `POST /organization-units/` (OP-UNT-002) | `201` con la unidad creada | ST-05 → ST-06; muestra la unidad devuelta; actualiza árbol y deja disponible su detalle (R-DOM-ORG-005) |

- **Reglas contractuales visibles:** el parent debe estar en la rama; crear raíz exige
  admin ([contrato](../../contracts/organization-identity.md) §Unidades, recintos y
  migración). La denegación por cualquiera de las dos reglas se muestra como llegó.
- **Postcondición observable:** la nueva unidad aparece en el árbol con los datos
  devueltos por el servidor, no con los del formulario.
- **Fallos:** `400` → F-01 (valores conservados, ST-09). `403` → F-02 sin modificar la
  representación local (R-DOM-ORG-006). Red → F-06: sin fila local optimista. Cancelar →
  F-09.

---

### FL-ORG-003 — Edición de unidad

- **Actor / permiso:** `organization_unit:update` (OP-UNT-004/005).
- **Pantalla:** ficha de unidad en modo edición.
- **Precondición:** unidad cargada desde OP-UNT-001/003.
- **Entradas:** los mismos editables del alta; `PUT` y `PATCH` son operaciones distintas
  en el inventario y el flujo usa la que corresponda al envío (completo vs parcial).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Modifica y envía | `PUT /organization-units/{id}/` (OP-UNT-004) o `PATCH` (OP-UNT-005) | `200` con la unidad actualizada | ST-06; refresca ficha y árbol |

- **Postcondición observable:** la ficha muestra el objeto devuelto.
- **Fallos:** idénticos a FL-ORG-002 más `404` → F-04.

---

### FL-ORG-004 — Previsualización de eliminación

- **Actor / permiso:** `organization_unit:delete` (OP-UNT-007).
- **Pantalla:** ficha de unidad (`FL/eliminar-unidad` provisional).
- **Precondición:** unidad seleccionada proveniente de OP-UNT-001/003.
- **Entradas:** `id` de la unidad.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Pulsa la acción destructiva | `GET /organization-units/{id}/previsualizar-eliminacion/` (OP-UNT-007) | `{unit_code, unit_name, parent_code, counts}` con los ocho contadores: `assignments, weapons, ranges, lessons, fractions, results, child_units, lessons_as_participant` | Abre ST-10 con los ocho contadores visibles (R-DOM-ORG-008); la confirmación final queda **bloqueada** hasta que la respuesta corresponda a la unidad seleccionada |

- **Postcondición observable:** confirmación abierta con `unit_code`/`unit_name`
  coincidentes con la unidad elegida y los ocho contadores reales.
- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06: la confirmación no se abre con
  contedores inventados. Sin `400`/`429` declarados; si ocurren, F-01/F-03 genéricos.

---

### FL-ORG-005 — Eliminación con migración

- **Actor / permiso:** `organization_unit:delete` (OP-UNT-008).
- **Pantalla:** confirmación abierta por FL-ORG-004.
- **Precondición:** previsualización exitosa y correspondiente.
- **Entradas:** `target_unit_code` opcional, elegido desde FL-ORG-007; la propia unidad
  no es seleccionable como destino (R-DOM-ORG-010).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Elige destino o acepta el padre | ninguna todavía | — | Si `counts.assignments > 0`, la confirmación advierte **literalmente** que el contrato sólo informa el conteo y no promete reasignar puestos; no se rotulan como migrados (R-DOM-ORG-009, R-RUL-10) |
| 2 | Confirma | `POST /organization-units/{id}/eliminar-con-migracion/` (OP-UNT-008) `{target_unit_code?}` | `200 {detail, target_unit_code, moved}`; sin target usa el padre | ST-05 → ST-06 con los tres campos; refresca unidades y todos los listados abiertos afectados (R-DOM-ORG-011) |

- **Regla de raíz:** sin `target_unit_code` y sin padre → `400` con mensaje literal
  `La unidad no tiene padre. Indica target_unit_code para migrar.`; la UI **exige destino
  explícito antes de enviar** en ese caso (R-RUL-09).
- **Postcondición observable:** la unidad deja de aparecer tras la recarga; `moved`
  muestra qué se actualizó en bloque y `assignments` queda informado como conteo, no
  como migración.
- **Fallos:** `400`/`403`/`404` → mantienen ST-10 abierta con el motivo, sin eliminar
  filas localmente (R-DOM-ORG-011; F-01/F-02/F-04). Red → F-06. Aborto por cierre de
  sesión → F-07/F-12.

---

### FL-ORG-006 — Lookup de unidades

- **Actor / permiso:** `organization_unit:read` (OP-UNT-009; todo tenant activo).
- **Pantalla:** selector dentro de flujos de asignación (`FL/selectores` provisional).
- **Precondición:** flujo consumidor abierto (p. ej. FL-IDT-007).
- **Entradas:** término de búsqueda resuelto **en cliente** sobre la respuesta.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre el selector | `GET /organization-units/lookup/` (OP-UNT-009) | `{results: OrganizationUnitSerializer[]}` — todas las unidades activas del tenant, sin filtro de rama | Presenta exclusivamente `results`; búsqueda vacía, sin coincidencias y denegada son estados distintos (R-DOM-ORG-007) |

- **Postcondición observable:** el flujo consumidor recibe el `code` seleccionado desde
  datos reales.
- **Fallos:** `403` → F-02. Red → F-06. `results` vacío → ST-03 (F-11).

---

### FL-ORG-007 — Unidades asignables

- **Actor / permiso:** usuario autenticado IA+TA (OP-UNT-010).
- **Pantalla:** selector de padre/destino/rol (`FL/selectores` provisional).
- **Precondición:** flujo consumidor abierto.
- **Entradas:** ninguna del usuario al consultar.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre el selector de unidad elegible | `GET /me/assignable-units/` (OP-UNT-010) | `{results: OrganizationUnitSerializer[]}` — rama de asignación del solicitante | Alimenta selectores de FL-ORG-002, FL-ORG-005 y FL-IDT-007/009 |

- **Caso contractual explícito:** en modo `admin_unidad` sin permitido, la respuesta
  muestra todo el tenant pero el **create valida después**
  ([contrato](../../contracts/organization-identity.md) §Unidades): la UI no interpreta
  ese listado como autorización (R-DOM-ORG-003).
- **Fallos:** `403` → F-02. Red → F-06.

---

### FL-ORG-008 — Consulta de recintos

- **Actor / permiso:** `recinto:read` (OP-RCT-001/003; TA, tenant).
- **Pantalla:** recintos y sus unidades (`SCREEN/recintos` provisional).
- **Entradas:** ninguna.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre el listado | `GET /recintos/` (OP-RCT-001) | colección por tenant ordenada por `name`, con `id, tenant, code, name, description, is_active, unit_codes, unit_count` | Lista con `—` en descripción ausente (R-DOM-ORG-012) |
| 2 | Abre un recinto | `GET /recintos/{id}/` (OP-RCT-003) | objeto de recinto | Detalle con `unit_codes` y `unit_count` para editar la relación |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10. Vacío → ST-03.

---

### FL-ORG-009 — Alta y edición de recinto

- **Actor / permiso:** `recinto:create` (OP-RCT-002) / `recinto:update` (OP-RCT-004/005).
- **Pantalla:** formulario de recinto.
- **Entradas:** `code`*, `name`*; `description`, `is_active` y la colección `units`
  (PK[]) cuando el flujo usa el CRUD; se omiten `id`, `tenant`, `unit_codes` y
  `unit_count` por sólo lectura (R-DOM-ORG-013).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa y envía | `POST /recintos/` (OP-RCT-002), `PUT` (OP-RCT-004) o `PATCH` (OP-RCT-005) | `201`/`200` con el recinto | ST-06; refresca detalle y listado para reflejar `unit_codes` y `unit_count` **retornados** (R-DOM-ORG-014) |

- **Postcondición observable:** los conteos mostrados provienen de la respuesta, no del
  formulario.
- **Fallos:** `400` → F-01. `403` → F-02. `404` → F-04 (edición). Red → F-06. Cancelar
  descarta exclusivamente cambios no enviados (F-09).

---

### FL-ORG-010 — Eliminación de recinto

- **Actor / permiso:** `recinto:delete` (OP-RCT-006).
- **Precondición:** recinto cargado desde OP-RCT-001/003.
- **Entradas:** ninguna.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 destructiva (R-RES-24) | — | Modal abierto |
| 2 | Confirma | `DELETE /recintos/{id}/` (OP-RCT-006) | respuesta del backend | ST-06 → refresca el listado **sólo tras éxito** (R-DOM-ORG-017) |

- **Regla de honestidad:** el contrato no declara migración automática de las unidades
  del recinto; la confirmación **no la promete** (R-DOM-ORG-017).
- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

---

### FL-ORG-011 — Agregar unidad a recinto

- **Actor / permiso:** `recinto:update` (OP-RCT-007; `FL/recinto-unidades` provisional).
- **Pantalla:** detalle de recinto.
- **Precondición:** recinto cargado; selector de unidad alimentado por FL-ORG-006.
- **Entradas:** `unit_code` elegido.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Elige la unidad y confirma | `POST /recintos/{id}/agregar-unidad/{unit_code}/` (OP-RCT-007) | `{detail, unit_count}`; `404` si la unidad no existe o no es accesible | ST-06 con el `unit_count` devuelto; refresca recinto y relación de la unidad (R-DOM-ORG-015) |

- **Postcondición observable:** `unit_codes` y `unit_count` actualizados desde la
  respuesta.
- **Fallos:** `404` → F-04 **sin insertar relación local** (R-DOM-ORG-015). `403` →
  F-02. Red → F-06.

---

### FL-ORG-012 — Quitar unidad de recinto

- **Actor / permiso:** `recinto:update` (OP-RCT-008).
- **Pantalla:** detalle de recinto.
- **Precondición:** relación existente visible en `unit_codes`.
- **Entradas:** `unit_code` a quitar.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Pulsa quitar sobre la relación | Confirmación que identifica recinto y código de unidad (R-DOM-ORG-016) | — | ST-10 abierta |
| 2 | Confirma | `DELETE /recintos/{id}/quitar-unidad/{unit_code}/` (OP-RCT-008) | `{detail, unit_count}`; `404` si la relación no existe | ST-06 con el `unit_count` devuelto; actualiza el detalle |

- **Regla explícita:** relación ausente → error explícito, **no** éxito idempotente
  (R-DOM-ORG-016).
- **Fallos:** `404` → F-04. `403` → F-02. Red → F-06: la relación permanece visible
  hasta respuesta exitosa.
