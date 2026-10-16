---
actualizado: 2026-10-14
---

# Familia Personas — cierre del recorrido por UI (A1)

> **Alcance.** Registro documental del recorrido por UI de la familia
> **Personas** con el actor **A1** (`super_admin`) sobre backend real. El alta y la edición se
> observaron el **2026-10-13** y la baja el **2026-10-14**, las tres por clic de UI con estado HTTP
> registrado. **No** certifica aceptación integral, **no** emite veredicto de producto y **no**
> propone ni aplica arreglos: no se tocó código de producto, backend, schema, datos originales ni
> credenciales. Fuentes primarias **inalteradas** y su relación de procedencia, en
> [`sources-manifest.json`](./sources-manifest.json).

## 1. Registro

El recurso fue una persona temporal creada por el propio recorrido, con marcador de turno
`DCTMV7H9KK8TMP` e identificador **28**. No es una persona preexistente de la colección.

| Paso | Fecha | Método y ruta | Estado | Origen declarado |
|---|---|---|---|---|
| Alta | 2026-10-13 | `POST /api/usuarios/crear-temporal/` | **201** | Clic de UI |
| Reconciliación | 2026-10-13 | `GET /api/usuarios/28/` | **200** | `authenticated GET` — id y marcador coinciden; cero asignaciones |
| Edición | 2026-10-13 | `PATCH /api/usuarios/28/` | **200** | Clic de UI — campos de la petición `grado` y `nombre` |
| Reconciliación | 2026-10-13 | `GET /api/usuarios/28/` | **200** | `authenticated GET` — id y marcador editado coinciden |
| Baja | 2026-10-14 | `DELETE /api/usuarios/28/` | **204** | Clic de UI en «Confirmar baja de usuario»; evento de respuesta observado |
| Reconciliación | 2026-10-14 | `GET /api/usuarios/28/` | **404** | `authenticated GET` |
| Verificación final | 2026-10-14 | UI `/personas` | **cero** filas de coincidencia exacta del marcador | Lectura de UI |

La secuencia de la baja es trazable de extremo a extremo: el diálogo de confirmación se verificó
contra el marcador del registro antes del clic, el `204` se observó como respuesta al evento de UI, y
el `404` posterior en detalle más el cero de filas en el listado cierran el ciclo.

Tras el alta se observaron **cero asignaciones** en el registro. No se creó, editó ni desactivó ninguna
asignación.

> 🕯️ La fila `OP-USR-006` declara «no asumir borrado físico» por el efecto real `disable_users`. El
> **404** del detalle y el cero de filas en la UI acreditan que el recurso dejó de estar disponible en
> la superficie observada; **no** acreditan borrado físico en la base de datos, y el artefacto de
> origen lo declara así de forma explícita.

## 2. Qué quedó firme y qué no

Se promovieron tres celdas, todas de **A1**, todas con estado HTTP registrado:

| Fila | Método y endpoint | Antes | Ahora |
|---|---|---|---|
| `OP-USR-012` | `POST /usuarios/crear-temporal/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-USR-005` | `PATCH /usuarios/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-USR-006` | `DELETE /usuarios/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |

| No promovido | Motivo |
|---|---|
| `POST /usuarios/` (`OP-USR-002`) | El alta observada fue la de **persona temporal**, que es otra fila con otro contrato. El alta genérica no se ejercitó |
| `PUT /usuarios/{id}/` (`OP-USR-004`) | No se ejercitó y no se infiere del `PATCH` observado: son filas distintas |
| Filas de asignación (`OP-USR-007` a `OP-USR-011`) | No hubo ninguna escritura ni lectura; el registro no tenía asignaciones |
| `OP-USR-003` (`GET /usuarios/{id}/`) | **No se mueve.** Su `OBSERVED_OK` previo se sostiene en la ficha propia abierta por UI en `/cuenta`. Los `GET` de detalle del id **28** son lecturas del harness y no acreditan navegación a la ruta de detalle de UI de otra persona |
| Actores A2 a A8 | Ninguna celda de este recorrido los cubre |

## 3. Conteos

| Estado | Antes | Después | Δ |
|---|---:|---:|---:|
| `OBSERVED_OK` | 182 | **185** | +3 |
| `PARTIAL` | 23 | **23** | — |
| `NOT_EXERCISED` | 1115 | **1112** | −3 |
| Denominador | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**3 celdas** cambiaron, todas de **A1**: `NOT_EXERCISED` → `OBSERVED_OK`. Recuento obtenido
recorriendo las 165 filas × 8 actores, no por agregación de conteos declarados. Filas, actores,
`total_cells`, `expected_by_actor`, `status_global` y `global_conclusion` **sin cambio**.

## 4. Límites

- **Un solo actor**, A1: nada de esto dice cómo se comportan A2 a A8.
- **No** se acredita CRUD completo **por familia ni por actor**: faltan `PUT`, el alta genérica y
  todas las filas de asignación.
- **Backend sin tocar**: sin cambios de código, schema, datos originales ni credenciales, sin acceso
  a producción y **sin commit ni push**.
- **No** se corrieron `tests` ni `build`, y **no** se reclama estado de ellos.
- El estado global sigue **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**: un 201, un
  200 y un 204 acreditan que la escritura se aceptó, **no** que el conjunto de visibles sea el
  correcto para el actor. `expected_by_actor` sigue **`NOT_VERIFIED`** en las 1320 celdas.

## 5. Fuentes

| # | Artefacto | Origen | Relación |
|---|---|---|---|
| 1 | [`persons-prerequisite.json`](./persons-prerequisite.json) | `.cache/frontend-acceptance/2026-10-13/` | Copia **idéntica** — alta 201 y edición 200 del 13 |
| 2 | [`crud-family-matrix-persons-extract.json`](./crud-family-matrix-persons-extract.json) | `.cache/frontend-acceptance/2026-10-13/crud-family-matrix.json` | **Extracto** de la familia persons; las otras cinco familias no se copian |
| 3 | [`persons-completion.json`](./persons-completion.json) | `.cache/frontend-acceptance/2026-10-14/` | Copia **idéntica** — `delivery_status: DELIVERED`, baja 204 y 404 |
| 4 | [`sources-manifest.json`](./sources-manifest.json) | — | Relación unívoca origen/copia, con `sha256` y redacciones aplicadas |

Celdas y conteos: [`../2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json)
(bloque `observations.persons_completion_2026_10_14`). Consolidación del estado:
[`../../estado-integral-2026-10-12.md`](../../estado-integral-2026-10-12.md) §9.

> 🕯️ Los artefactos del 2026-10-13 y los del 2026-10-14 **coexisten con su fecha**: el cierre de la
> baja del 14 no reescribe el corte del 13. El extracto nº 2 conserva el estado en que la baja aún
> figuraba como pendiente, y declara en `superseded_by` qué artefacto lo cierra.

> 🕯️ Esta evidencia no contiene secretos, cookies, RUT, correos, contraseñas ni nombres de personas:
> sólo alias de actor, identificador de registro propio, marcador de turno, rutas, métodos, estados
> HTTP y nombres de campo.
