---
spec_meta: "../../spec-meta.yaml"
---

# Flujos — Armerías, armas y calibres

> 📜 Yo detallo aquí los nueve flujos del almacén: armerías, armas y el catálogo global
> de calibres. Requisitos de familia: [armory.md](../../requirements/armory.md);
> contratos: [organization-identity.md](../../contracts/organization-identity.md)
> §Armerías y [domain-shooting.md](../../contracts/domain-shooting.md) §Armas y calibres.
> Regla común: la UI no envía `tenant` ni unidad inyectada (R-RUL-01); las relaciones
> opcionales se escriben por código (`*_code_write`), nunca por id (R-RUL-02).

## Índice

1. [FL-ARM-001 — Consulta de armerías](#fl-arm-001--consulta-de-armerías)
2. [FL-ARM-002 — Alta y edición de armería](#fl-arm-002--alta-y-edición-de-armería)
3. [FL-ARM-003 — Eliminación de armería](#fl-arm-003--eliminación-de-armería)
4. [FL-WPN-001 — Consulta de armas](#fl-wpn-001--consulta-de-armas)
5. [FL-WPN-002 — Alta de arma](#fl-wpn-002--alta-de-arma)
6. [FL-WPN-003 — Edición de arma](#fl-wpn-003--edición-de-arma)
7. [FL-WPN-004 — Eliminación de arma](#fl-wpn-004--eliminación-de-arma)
8. [FL-CAL-001 — Consulta de calibres](#fl-cal-001--consulta-de-calibres)
9. [FL-CAL-002 — Gestión de calibres](#fl-cal-002--gestión-de-calibres)

---

### FL-ARM-001 — Consulta de armerías

- **Actor / permiso:** `armory:read` (OP-ARM-001/003; tenant+unidad).
- **Pantalla:** almacenes (`SCREEN/armorias` provisional).
- **Entradas:** búsqueda/orden en cliente (R-RES-22).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Abre el listado | `GET /armorias/` (OP-ARM-001) | array con `id, tenant, organization_unit, organization_unit_code, code, name, descripcion, is_active, armas_count`, timestamps | Lista con `armas_count` visible (R-RES-12); `descripcion` ausente → `—` (R-DOM-ARM-001) |
| 2 | Abre una armería | `GET /armorias/{id}/` (OP-ARM-003) | objeto completo | Detalle con armas relacionadas al recargarlas (FL-WPN-001) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10. Vacío → ST-03.

---

### FL-ARM-002 — Alta y edición de armería

- **Actor / permiso:** `armory:create` (OP-ARM-002) / `armory:update` (OP-ARM-004/005).
- **Entradas:** `code`*, `name`*; `descripcion`, `is_active`,
  `organization_unit_code_write` opcionales (R-DOM-ARM-002). Se excluyen `id`, `tenant`,
  unidad derivada, conteo y timestamps (R-DOM-ARM-003).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Alta sin elegir unidad | `POST /armorias/` (OP-ARM-002) | `201`; la unidad se **inyecta al crear** si no se escribió código ([contrato](../../contracts/organization-identity.md) §Armerías) | ST-06; muestra **después del éxito** la unidad que el backend inyectó (R-DOM-ARM-002) |
| 2 | Edición | `PUT` (OP-ARM-004) o `PATCH` (OP-ARM-005) | `200`; el campo write resuelve una unidad activa del tenant | ST-06; refresca listado y detalle |

- **Regla de update:** `organization_unit_code_write` vacío o `null` en update → `400`
  asociado al campo recibido (R-DOM-ARM-003); la UI conserva el formulario (ST-09) y
  ancla el error (F-01).
- **Fallos:** `400` → F-01. `403` → F-02. `404` → F-04. Red → F-06 sin optimismo.
  Cancelar → F-09.

---

### FL-ARM-003 — Eliminación de armería

- **Actor / permiso:** `armory:delete` (OP-ARM-006).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 con `armas_count` visible | — | El contrato no declara reasignación de armas: la confirmación no la promete (R-DOM-ARM-004) |
| 2 | Confirma | `DELETE /armorias/{id}/` (OP-ARM-006) | respuesta del backend | Refresca listado, detalle y armas relacionadas **después del éxito** (R-DOM-ARM-004) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

---

### FL-WPN-001 — Consulta de armas

- **Actor / permiso:** `weapon:read → warehouse` (OP-WPN-001/003; tenant+unidad).
- **Pantalla:** almacén de armas (`SCREEN/armas` provisional).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Abre el listado | `GET /armas/` (OP-WPN-001) | array con `id_arma`, tenant, unidad, armory y códigos/nombre, `calibre_code`, `tipo_arma`, `modelo_arma`, `numero_serie` | Lista con calibre y relaciones; ausentes → `—` (R-DOM-ARM-005) |
| 2 | Abre un arma | `GET /armas/{id}/` (OP-WPN-003) | objeto de arma | Ficha con relaciones RO como contexto |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10. Vacío → ST-03.

---

### FL-WPN-002 — Alta de arma

- **Actor / permiso:** `weapon:create → warehouse` (OP-WPN-002).
- **Precondición:** selectores reales alimentados: armerías desde OP-ARM-001, calibres
  activos desde OP-CAL-001 (R-DOM-ARM-006: sólo códigos realmente disponibles).
- **Entradas:** `tipo_arma`* —selector limitado a `fusil, subfusil, pistola,
  francotirador, ametralladora, apoyo`—, `modelo_arma`*, `numero_serie`*;
  `armory_code_write`, `calibre_code_write` opcionales.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa y envía | `POST /armas/` (OP-WPN-002) | `201` con el arma; `organization_unit` se deriva del `armory_code_write` enviado (R-RES-02) | ST-06; refresca listado y el detalle de la armería al recargarla |

- **Postcondición observable:** el arma creada muestra la unidad derivada por el
  servidor, no una enviada por la UI.
- **Fallos:** `400` → F-01. Unicidad `modelo_arma + numero_serie` → F-05: error visible
  sin deduplicar ni ocultar el arma existente (R-DOM-ARM-008). `403` → F-02. Red → F-06.
  Cancelar → F-09.

---

### FL-WPN-003 — Edición de arma

- **Actor / permiso:** `weapon:update → warehouse` (OP-WPN-004/005).
- **Entradas:** campos W del serializer; las relaciones viajan por `*_code_write`,
  **nunca** sustituyendo la armería por `organization_unit` (R-DOM-ARM-007).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Edita y envía | `PUT` (OP-WPN-004) o `PATCH` (OP-WPN-005) `/armas/{id}/` | `200` con el arma | ST-06; refresca ficha y listado |

- **Regla literal:** `armory_code_write` vacío o nulo en update → `400` con
  `armory_code_write: 'El arma debe pertenecer a una armoria.'` (R-RUL-04): error anclado
  al selector y formulario conservado (R-DOM-ARM-007).
- **Fallos:** `400` → F-01. Unicidad modelo+serie → F-05. `403` → F-02. `404` → F-04.
  Red → F-06. Cancelar → F-09.

---

### FL-WPN-004 — Eliminación de arma

- **Actor / permiso:** `weapon:delete → warehouse` (OP-WPN-006).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 que identifica modelo y serie | — | Modal abierto |
| 2 | Confirma | `DELETE /armas/{id}/` (OP-WPN-006) | respuesta del backend | Refresca la armería y los resultados que la referencien **sólo si esos recursos se vuelven a cargar** (R-DOM-ARM-009) |

- **Prohibición explícita:** no simular transferencia ni sustitución de stock
  (R-DOM-ARM-009); la transferencia entre armerías no existe como endpoint
  (`requirements.md` §8, D-02).
- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

---

### FL-CAL-001 — Consulta de calibres

- **Actor / permiso:** `calibre:read → view_exercises` (OP-CAL-001/003; catálogo
  **global**, sin tenant).
- **Pantalla:** catálogo de calibres (`SCREEN/calibres` provisional) y selectores de
  armas/consumos.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Abre el catálogo o un selector | `GET /calibres/` (OP-CAL-001), detalle OP-CAL-003 | array con `id_calibre, code, nombre, is_active` | Lista/selector con los códigos canónicos (R-DOM-ARM-010) |

- **Lectura sin mutación falsa:** para cualquier contexto que no sea `super_admin`, el
  catálogo es de lectura y la UI no falsifica capacidad de mutación (R-DOM-ARM-011).
- **Fallos:** `403` → F-02. Red → F-06/F-10. Vacío → ST-03: los selectores dependientes
  muestran su estado vacío sin inventar opciones.

---

### FL-CAL-002 — Gestión de calibres

- **Actor / permiso:** `calibre:manage → manage_calibre` **+ `super_admin`**
  (OP-CAL-002, OP-CAL-004/005/006); reservado al desarrollador
  (`AGENTS.md` §Modelo de permisos).
- **Entradas:** `code`*, `nombre`*, `is_active` opcional.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Alta/edición | `POST /calibres/` (OP-CAL-002), `PUT`/`PATCH` (OP-CAL-004/005) | `201`/`200` con el calibre | ST-06; refresca catálogo **y los selectores dependientes antes del próximo envío** (R-DOM-ARM-012) |
| 2 | Eliminación | ST-10 → `DELETE /calibres/{id}/` (OP-CAL-006) | respuesta del backend | Refresca catálogo y selectores |

- **Referencias huérfanas:** si una referencia existente (arma o consumo) deja de ser
  seleccionable, se muestra el valor devuelto **como lectura**, sin cambiar la relación
  por iniciativa del cliente (R-DOM-ARM-012).
- **Fallos:** `400` → F-01. `403` sin `super_admin` → F-02. `404` → F-04. Red → F-06.
  Cancelar → F-09.
