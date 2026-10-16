---
spec_meta: "../../spec-meta.yaml"
---

# Flujos — Ejercicios y consumos

> 📜 Yo detallo aquí los ocho flujos de la cadena ejercicios → consumo de munición →
> consumo de arma. Requisitos: [exercises-consumption.md](../../requirements/exercises-consumption.md);
> contrato: [exercises-preferences.md](../../contracts/exercises-preferences.md) §1.
> Regla de familia: `ConsumoMunicion` y `ConsumoArma` tienen alcance **sólo tenant**,
> sin unidad propia: la UI no intenta inyectarla (R-DOM-EXC-006). Las preferencias de
> apariencia legacy de ese contrato viven en [appearance.md](appearance.md), no aquí.

## Índice

1. [FL-EXC-001 — Consulta de ejercicios](#fl-exc-001--consulta-de-ejercicios)
2. [FL-EXC-002 — Alta y edición de ejercicio](#fl-exc-002--alta-y-edición-de-ejercicio)
3. [FL-EXC-003 — Eliminación de ejercicio](#fl-exc-003--eliminación-de-ejercicio)
4. [FL-CMN-001 — Consulta de consumos de munición](#fl-cmn-001--consulta-de-consumos-de-munición)
5. [FL-CMN-002 — Alta y edición de consumo de munición](#fl-cmn-002--alta-y-edición-de-consumo-de-munición)
6. [FL-CMN-003 — Eliminación de consumo de munición](#fl-cmn-003--eliminación-de-consumo-de-munición)
7. [FL-CAR-001 — Alta y edición de consumo de arma](#fl-car-001--alta-y-edición-de-consumo-de-arma)
8. [FL-CAR-002 — Eliminación de consumo de arma](#fl-car-002--eliminación-de-consumo-de-arma)

---

### FL-EXC-001 — Consulta de ejercicios

- **Actor / permiso:** `ejercicio_militar:read` (OP-EJR-001/003; tenant+unidad).
- **Pantalla:** ejercicios militares (`SCREEN/ejercicios` provisional).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Abre el listado | `GET /ejercicios/` (OP-EJR-001) | array con `id_ejercicio`, nombre, fecha, zona, tipo, observaciones, participantes codes, tenant, unidad, `created_at` | Lista con `—` en valores ausentes (R-DOM-EXC-001); búsqueda/orden en cliente (R-RES-22) |
| 2 | Abre un ejercicio | `GET /ejercicios/{id}/` (OP-EJR-003) | objeto completo | Ficha con enlaces a sus consumos al recargarlos (FL-CMN-001, FL-CAR-001) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10. Vacío → ST-03.

---

### FL-EXC-002 — Alta y edición de ejercicio

- **Actor / permiso:** `ejercicio_militar:create` (OP-EJR-002) /
  `ejercicio_militar:update` (OP-EJR-004/005).
- **Precondición:** selector de unidades participantes desde FL-ORG-006.
- **Entradas:** `nombre`*, `fecha`*; `zona`, `tipo_ejercicio` —limitado a `asalto,
  defensa, movimiento, mixto, otro`—, campos opcionales de orden/fecha, `observaciones`,
  `unidades_participantes_codes_write` (R-DOM-EXC-002).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa y envía | `POST /ejercicios/` (OP-EJR-002) o `PUT`/`PATCH` (OP-EJR-004/005) | `201`/`200` con el ejercicio | ST-06; refresca detalle y listado (R-DOM-EXC-004) |
| 2 | — (alta sin participantes) | ninguna adicional | sin lista, el backend usa la unidad inyectada por el mixin | Muestra la unidad efectiva retornada; **no rellena participantes sintéticos** (R-DOM-EXC-003) |

- **Fallos:** `400` → F-01; los errores de unidades o tenant se muestran junto al
  selector o como denegación según la forma de la respuesta (R-DOM-EXC-004). `403` →
  F-02. `404` → F-04. Red → F-06. Cancelar → F-09: descarta cambios no enviados
  (R-DOM-EXC-004).

---

### FL-EXC-003 — Eliminación de ejercicio

- **Actor / permiso:** `ejercicio_militar:delete` (OP-EJR-006).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 que identifica el ejercicio por nombre y fecha (R-DOM-EXC-005) | — | Modal abierto; no se promete eliminación en cascada si la respuesta no la declara |
| 2 | Confirma | `DELETE /ejercicios/{id}/` (OP-EJR-006) | respuesta del backend | Refresca consumos relacionados **sólo tras éxito** (R-DOM-EXC-005) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

---

### FL-CMN-001 — Consulta de consumos de munición

- **Actor / permiso:** `consumo_municion:read` (OP-CMN-001/003; **sólo tenant**).
- **Pantalla:** consumos por ejercicio (`FL/consumo-munición` provisional).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Abre el listado (o el de un ejercicio) | `GET /consumos-municion/` (OP-CMN-001) | array con `id_consumo`, ejercicio, tipo/modelo de arma, `calibre_code`, cantidades, `es_aproximado`, observaciones | Lista con `—` en ausentes; **no** muestra ni envía unidad propia (R-DOM-EXC-006) |
| 2 | Abre un consumo | `GET /consumos-municion/{id}/` (OP-CMN-003) | objeto | Detalle con enlace a su ejercicio y a sus consumos de arma (FL-CAR-001) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10. Vacío → ST-03.

---

### FL-CMN-002 — Alta y edición de consumo de munición

- **Actor / permiso:** `consumo_municion:create` (OP-CMN-002) /
  `consumo_municion:update` (OP-CMN-004/005).
- **Precondición:** selector de ejercicio desde OP-EJR-001; selector de calibre desde
  OP-CAL-001 (calibres activos).
- **Entradas:** `ejercicio`*, `tipo_arma`* —selector limitado a `fusil, subfusil,
  pistola, francotirador, ametralladora, apoyo`—, `cantidad_tiros`*; opcionales
  `modelo_arma`, `calibre_code_write`, `cantidad_armas`, `es_aproximado`,
  `observaciones` (R-DOM-EXC-007).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa y envía | `POST /consumos-municion/` (OP-CMN-002) o `PUT`/`PATCH` (OP-CMN-004/005) | `201`/`200`; el calibre write resuelve un calibre **activo** ([contrato](../../contracts/exercises-preferences.md) §1) | ST-06; muestra el `calibre_code` RO devuelto |

- **Regla explícita:** el calibre **no se deduce** desde tipo o modelo de arma
  (R-DOM-EXC-008): si el usuario no lo elige, el campo queda ausente/`—`.
- **Fallos:** `400` (incluido calibre inactivo/no resuelto) → F-01 sobre el selector.
  `403` → F-02. `404` → F-04. Red → F-06. Cancelar → F-09.

---

### FL-CMN-003 — Eliminación de consumo de munición

- **Actor / permiso:** `consumo_municion:delete` (OP-CMN-006).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 que identifica ejercicio y cantidades (R-DOM-EXC-009) | — | Modal abierto |
| 2 | Confirma | `DELETE /consumos-municion/{id}/` (OP-CMN-006) | respuesta del backend | Refresca el ejercicio y consumos asociados **sólo después del éxito**; `400`/`403`/relaciones inexistentes no se convierten en ceros ni en éxito visual (R-DOM-EXC-009) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

---

### FL-CAR-001 — Alta y edición de consumo de arma

- **Actor / permiso:** `consumo_arma:create` (OP-CAR-002) / `consumo_arma:update`
  (OP-CAR-004/005; sólo tenant).
- **Precondición:** selectores desde respuestas reales: consumos accesibles
  (OP-CMN-001) y armas accesibles (OP-WPN-001); nunca registros de muestra
  (R-DOM-EXC-011).
- **Entradas:** `consumo`*, `arma`*, `cantidad_tiros`* (FKs directas), `observaciones`
  opcional.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa y envía | `POST /consumos-arma/` (OP-CAR-002) o `PUT`/`PATCH` (OP-CAR-004/005) | `201`/`200` con `id_consumo_arma`; unicidad consumo+arma | ST-06; refresca la relación del consumo padre al recargarla |

- **Fallos:** duplicidad consumo+arma → F-05 en la relación de arma, conservando el
  formulario para corrección (R-DOM-EXC-012). `400` resto → F-01. `403` → F-02. `404` →
  F-04. Red → F-06. Cancelar → F-09.

---

### FL-CAR-002 — Eliminación de consumo de arma

- **Actor / permiso:** `consumo_arma:delete` (OP-CAR-006).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 que identifica consumo y arma | — | Modal abierto |
| 2 | Confirma | `DELETE /consumos-arma/{id}/` (OP-CAR-006) | respuesta del backend | Actualiza la relación de su consumo padre **únicamente tras éxito**; no recalcula ni supone stock restante porque no es dato contractual del recurso (R-DOM-EXC-013) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

> 🕯️ La transferencia de stock entre armerías no existe como endpoint
> (`requirements.md` §8, D-02): ningún flujo de este volumen la simula con operaciones
> de consumo (R-DOM-EXC-014).
