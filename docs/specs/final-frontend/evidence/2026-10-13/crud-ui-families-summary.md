---
actualizado: 2026-10-14
---

# Familias CRUD por UI — recorrido real con A1 (2026-10-13)

> 🕯️ **Qué es y qué no.** Registro documental de un recorrido **real** de UI de producto contra backend
> real, ejecutado el **2026-10-13** con navegador instrumentado y el actor **A1** (`super_admin`).
> **No** certifica aceptación integral, **no** emite veredicto de producto y **no** propone ni aplica
> arreglos: no se cambió código de producto, backend, schema, datos originales ni credenciales.
> Fuentes primarias **inalteradas**: los quince artefactos JSON de §11, cuya copia en este directorio
> se verificó **idéntica byte a byte** contra `.cache/frontend-acceptance/2026-10-13/` (`cmp`, 15 de 15,
> 0 diferencias).

## Índice

1. [Alcance y política de evidencia](#1-alcance-y-política-de-evidencia) · 2. [Armas](#2-armas) ·
3. [Ejercicios](#3-ejercicios) · 4. [Unidades organizativas](#4-unidades-organizativas) ·
5. [Consumos de munición](#5-consumos-de-munición) · 6. [Consumo de arma](#6-consumo-de-arma) ·
7. [Qué queda sin acreditar](#7-qué-queda-sin-acreditar) ·
8. [Celdas de la matriz afectadas](#8-celdas-de-la-matriz-afectadas) · 9. [Conteos](#9-conteos) ·
10. [Límites](#10-límites) · 11. [Fuentes](#11-fuentes)

---

## 1. Alcance y política de evidencia

| Dato | Valor observado |
|---|---|
| **Actor** | **A1** (`super_admin`) — alias, sin nombre, RUT ni correo |
| **Tenant** | `desarrollo-poligono-local` |
| **Unidad activa** | `CIA-A` |
| **Origen de las escrituras acreditadas** | Clic de UI, según el campo `source` de cada evento en las fuentes |
| **Origen de las reconciliaciones** | `GET` con la sesión autenticada del navegador, o lectura de UI cuando el artefacto lo declara así |
| **Excluido por política** | Personas y PII · escrituras de backend · cambios de cuenta · cambios de dependencias o de servidor |
| **Marcadores de turno** | `DCTMV7…`, uno por intento, sin relación con datos de personas |

Las escrituras acreditadas en las fuentes se identifican como clics de UI. `mutation_source` **no**
aparece en los quince artefactos: sólo lo declara el de reintento, y no se generaliza a los demás.

---

## 2. Armas

Marcador `DCTMV7GRCUNARM`, registro `id_arma` **4**.

| Paso | Método y ruta | Estado | Origen declarado en el artefacto |
|---|---|---|---|
| Alta | `POST /api/armas/` | **201** | Clic de UI |
| Reconciliación | `GET /api/armas/4/` | **200** | `authenticated GET` — modelo y número de serie del marcador |
| Edición | `PATCH /api/armas/4/` | **200** | Clic de UI — `modelo_arma` → `DCTMV7GRCUNARM-MOD-EDIT` |
| Reconciliación | `GET /api/armas/4/` | **200** | `authenticated GET` — modelo editado, número de serie y relaciones iguales a la línea base de creación |
| Baja | `DELETE /api/armas/4/` | **204** | Clic de UI en la confirmación de detalle |
| Reconciliación | `GET /api/armas/4/` | **404** | `authenticated GET` |

**Registros remanentes de esta corrida: 0** (campo `records_left_by_this_family` del artefacto).
Resultado visible en UI: «El arma fue dada de baja según la respuesta del servidor». El alta devolvió además `armory_code` `ALM-CIA-A-DEV`, `calibre_code`
`5.56X45` y `organization_unit_code` `CIA-A`.

> 🕯️ `PUT` **no** se ejercitó en esta familia y no se infiere del `PATCH` observado: son filas
> distintas de la matriz (`OP-WPN-004` frente a `OP-WPN-005`).

---

## 3. Ejercicios

Marcador `DCTMV7GUDU6EXC`, registro `id_ejercicio` **5**.

| Paso | Método y ruta | Estado | Origen declarado en el artefacto |
|---|---|---|---|
| Alta | `POST /api/ejercicios/` | **201** | Clic de UI — `unidades_participantes_codes` `[CIA-A]` |
| Reconciliación | `GET /api/ejercicios/5/` | **200** | `authenticated GET` — campos esperados coinciden |
| Edición | `PATCH /api/ejercicios/5/` | **200** | Clic de UI — `observaciones` → `DCTMV7GUDU6EXC-OBS-EDIT` |
| Reconciliación | `GET /api/ejercicios/5/` | **200** | `authenticated GET` — valor editado y `[CIA-A]` confirmados |
| Baja | `DELETE /api/ejercicios/5/` | **204** | Clic de UI en la confirmación identificada |
| Reconciliación | `GET /api/ejercicios/5/` | **404** | `authenticated GET` |

**Filas hijas de consumo creadas en esta corrida: 0** (campo `child_consumption_rows_created` del
artefacto).

> 🕯️ Este ejercicio **5** fue el `ejercicio` referenciado por los dos intentos de alta de consumo de
> munición de §5: existía durante esos intentos y se borró después, en esta misma familia.

> 🕯️ `PUT` **no** se ejercitó y no se infiere del `PATCH` observado (`OP-EJR-004` frente a
> `OP-EJR-005`).

---

## 4. Unidades organizativas

Alcance acotado: **sólo** intentos descartables propios. Este recorrido **no** repite el CRUD de
unidades.

### 4.1 Unidad 13 — alta y baja

Marcador `DCTMV7GBLYEU`.

| Paso | Método y ruta | Estado | Origen declarado en el artefacto |
|---|---|---|---|
| Alta | `POST /api/organization-units/` | **201** | Clic de botón — `parent` `null`, `unit_type` `company`, `is_active` `true` |
| Reconciliación | `GET /api/organization-units/13/` | **200** | `authenticated GET` — campos esperados coinciden |
| Baja | `DELETE /api/organization-units/13/` | **204** | Clic de botón — `mutation_retried: false` |
| Reconciliación | `GET /api/organization-units/13/` | **404** | **`UI detail route GET`** — `detail_not_found: true` |
| Búsqueda | `/organizacion/unidades` | sin coincidencias | Búsqueda de UI — «No hay coincidencias para la búsqueda.» |

### 4.2 Unidad 15 — alta y recuperación de baja

Marcador `DCTMV7GIND8U`. La vinculación del alta con el identificador **15** **no** viene del
artefacto de reintento: ese artefacto deja el identificador del registro en `null`. Procede de
`crud-batch-attempt-3-recovery.json`, que identifica el recurso con el mismo marcador y ese
identificador.

| Paso | Método y ruta | Estado | Origen declarado en el artefacto |
|---|---|---|---|
| Alta | `POST /api/organization-units/` | **201** | Registrado en `crud-batch-retry-evidence.json` con el código `DCTMV7GIND8U` |
| Baja | `DELETE /api/organization-units/15/` | **204** | Clic de limpieza, observado en el listado de requests de red filtrado de Playwright |
| Reconciliación | `GET /api/organization-units/` | **200** | `authenticated GET` — **cero** coincidencias exactas del marcador |
| Búsqueda | `DCTMV7GIND8U` | sin coincidencias | Búsqueda de UI |

### 4.3 Incidente de harness, conservado sin fundir

| Artefacto | Path de borrado | Estado |
|---|---|---|
| `crud-batch-retry-evidence.json` | `/api/organization-units/null/` | `null` — `outcome: no_confirmed_response`, `uncertain_write: true` |
| `crud-batch-attempt-3-recovery.json` | `/api/organization-units/15/` | **204** |

Causa registrada en el artefacto: el identificador del registro no se capturó antes de la limpieza y
el modal de alta seguía abierto al cambiar a la vista de tabla. **Ambos registros se conservan tal
cual**: no se funden ni se descarta ninguno. Es un error de **harness**, no un defecto de producto.

### 4.4 Identificador 14 — sin atribución

`GET /api/organization-units/14/` → **404**. **Ningún artefacto lo mapea a un intento propio de esta
corrida**, así que **no se le atribuye alta ni baja**.

### 4.5 Edición de unidades — no ejercitada

El `PATCH` de unidades organizativas **no** se ejercitó en este recorrido y su `PARTIAL` anterior se
conserva. `PUT` tampoco.

---

## 5. Consumos de munición

Dos intentos, ambos con respuesta **500**. **Ningún registro con estos marcadores llegó a crearse.**

| Intento | Marcador | `POST /api/consumos-municion/` | Estado | Payload |
|---|---|---|---|---|
| 1 | `DCTMV7GWEVFMUN` | Clic de UI | **500** | Completo: `ejercicio` 5, `tipo_arma`, `modelo_arma`, `calibre_code_write`, `cantidad_armas` 1, `cantidad_tiros` 1, `es_aproximado` `false` |
| 2 | `DCTMV7GZGB4MUN2` | Clic de UI tras reconciliación del estado previo | **500** | Reducido: `ejercicio` 5, `tipo_arma`, `cantidad_tiros` 1, `es_aproximado` `false`; modelo, calibre y cantidad de armas **omitidos** |

| Reconciliación posterior | Resultado |
|---|---|
| `GET /api/consumos-municion/` → **200** | **Cero** coincidencias exactas de cada marcador: no hay registro creado **con esos marcadores**. La fuente **no** afirma la inexistencia absoluta de registros de la colección |
| Botón «Consultar estado real» (ambos casos) | Leyó el estado actual del servidor, **sin repetir ninguna escritura**; `pending_write_cleared: true` |
| Escritura repetida | **Ninguna**: los `GET` de reconciliación **no** repitieron ninguna escritura. Los dos intentos son emisiones **distintas**, con marcadores y payloads distintos, no un reintento del mismo envío |

> 🕯️ El primer intento dejó la UI bloqueada con el aviso de consultar el estado real; la respuesta
> **500 no retuvo cuerpo** (`response_body: "not retained"`). **No hay traza, no hay causa
> demostrada y no se le atribuye ningún serializer, excepción ni campo concreto.** El `ejercicio` 5
> referenciado **existía** en el momento de ambos intentos y se borró después en §3: la referencia no
> era un id inexistente.

> 🕯️ Este **500** se observa el 2026-10-13. El registro histórico
> [`td-ammo-consumption-calibre-create.md`](../../../../bugs/td-ammo-consumption-calibre-create.md)
> (2026-10-06) documenta un `500` en este mismo endpoint con una causa distinta y fechada. **Son dos
> observaciones separadas por fecha y no se fusionan**: aquí no se hereda ninguna causa. El hallazgo se
> registra en [`backend-debt.md`](../../../../bugs/backend-debt.md) §8.

---

## 6. Consumo de arma

**No hubo ninguna escritura.** El prerrequisito no existe en el entorno:

| Comprobación | Resultado |
|---|---|
| `GET` de la colección de consumos de munición | **200**, con **cero** opciones en el formulario de alta |
| Selector de consumo requerido | Sólo su marcador de posición; ningún identificador real disponible |
| Envío de la relación | **Deshabilitado** |
| `GET` de la colección de consumos de arma | **200** |
| Escritura intentada | **No** |

> 🕯️ Crear la relación exigiría inventar o sortear la dependencia. **No se fabricó** un registro
> auxiliar para habilitar el camino, y la celda de alta de esta familia **no se promovió**.

---

## 7. Qué queda sin acreditar

### 7.1 Superficie de detalle de UI

| Familia | Lecturas de detalle registradas | ¿Alguna por UI? |
|---|---|---|
| Armas | `GET /api/armas/4/` **200**, **200** y **404** | **No**: los tres son `authenticated GET` |
| Ejercicios | `GET /api/ejercicios/5/` **200**, **200** y **404** | **No**: los tres son `authenticated GET` |
| Unidades | `GET /api/organization-units/13/` **200** (`authenticated GET`) y **404** (`UI detail route GET`) | **Sí, sólo en estado 404**, tras la baja |

> 🕯️ **Corrección de trazabilidad.** Una versión anterior de las filas `OP-WPN-003` y `OP-EJR-003`
> afirmaba que «la única lectura de UI del recorrido ocurre en estado no encontrado». Los artefactos de
> armas y ejercicios **sólo registran `authenticated GET`**: no sostienen esa afirmación. Se corrigió
> para decir lo que la fuente sostiene —en esas dos familias no llegó a observarse ninguna
> navegación a la ruta de detalle de UI— y se conservó intacta la afirmación equivalente de
> organización, que **sí** tiene fuente. En las tres familias la superficie de detalle de UI **sigue
> sin acreditar**: un 404 no acredita una pantalla de detalle.

### 7.2 Método `PUT`

**No** se ejercitó en armas, ejercicios ni unidades, y **no** se infiere de ningún `PATCH`. En la
matriz son filas separadas: `OP-WPN-004`, `OP-EJR-004`, `OP-UNT-004`.

### 7.3 Edición de unidades organizativas

No ejercitada en este recorrido. El `PARTIAL` previo de `OP-UNT-005` se conserva sin superarse.

---

## 8. Celdas de la matriz afectadas

Actor **A1** en todas. Denominador, filas, actores y `total_cells` **sin cambio**.

| Fila (método + endpoint) | Antes | Ahora | Observado |
|---|---|---|---|
| `POST /armas/` (`OP-WPN-002`) | `NOT_EXERCISED` | `OBSERVED_OK` | Alta **201** por UI, `GET` **200** de verificación y baja propia **204** |
| `GET /armas/{id}/` (`OP-WPN-003`) | `NOT_EXERCISED` | `PARTIAL` | Path registrado; lecturas de verificación del harness |
| `PATCH /armas/{id}/` (`OP-WPN-005`) | `PARTIAL` | `OBSERVED_OK` | Superó el `PARTIAL` anterior: **200** de UI con estado HTTP registrado y `GET` **200** confirmatorio |
| `DELETE /armas/{id}/` (`OP-WPN-006`) | `NOT_EXERCISED` | `OBSERVED_OK` | Baja **204** por UI, `GET` **404**, **cero** remanentes |
| `POST /ejercicios/` (`OP-EJR-002`) | `NOT_EXERCISED` | `OBSERVED_OK` | Alta **201** por UI, `GET` **200** de verificación y baja propia **204** |
| `GET /ejercicios/{id}/` (`OP-EJR-003`) | `NOT_EXERCISED` | `PARTIAL` | Path registrado; lecturas de verificación del harness |
| `PATCH /ejercicios/{id}/` (`OP-EJR-005`) | `NOT_EXERCISED` | `OBSERVED_OK` | Edición **200** por UI sobre un campo, `GET` **200** confirmatorio |
| `DELETE /ejercicios/{id}/` (`OP-EJR-006`) | `NOT_EXERCISED` | `OBSERVED_OK` | Baja **204** por UI, `GET` **404**, **cero** filas hijas |
| `POST /organization-units/` (`OP-UNT-002`) | `NOT_EXERCISED` | `OBSERVED_OK` | Altas **201** de las unidades 13 y 15; el id 14 no se le atribuye |
| `GET /organization-units/{id}/` (`OP-UNT-003`) | `NOT_EXERCISED` | `PARTIAL` | Lectura **200** del harness y detalle de UI **sólo** en **404** |
| `DELETE /organization-units/{id}/` (`OP-UNT-006`) | `NOT_EXERCISED` | `OBSERVED_OK` | Bajas **204** de 13 y 15 con reconciliación por listado y búsqueda en UI |
| `POST /consumos-municion/` (`OP-CMN-002`) | `NOT_EXERCISED` | `PARTIAL` | Dos intentos **500** y `GET` **200** con cero coincidencias: rechazo de servidor, nunca alta exitosa |

### 8.1 Celdas que **no** se movieron

| Fila | Estado conservado | Motivo |
|---|---|---|
| `PUT /armas/{id}/` (`OP-WPN-004`) | `NOT_EXERCISED` | No ejercitado; no se infiere del `PATCH` |
| `PUT /ejercicios/{id}/` (`OP-EJR-004`) | `NOT_EXERCISED` | No ejercitado; no se infiere del `PATCH` |
| `PUT /organization-units/{id}/` (`OP-UNT-004`) | `NOT_EXERCISED` | Edición descartable no ejercitada |
| `PATCH /organization-units/{id}/` (`OP-UNT-005`) | `PARTIAL` | Se conserva el `PARTIAL` previo: este recorrido no aporta una edición con estado HTTP registrado |
| `GET`/`PUT`/`PATCH`/`DELETE` de `/consumos-municion/{id}/` (`OP-CMN-003` a `006`) | `NOT_EXERCISED` | No se creó ningún registro contra el cual operar |
| `POST /consumos-arma/` (`OP-CAR-002`) | `NOT_EXERCISED` | No hubo ninguna escritura: prerrequisito ausente (§6) |

---

## 9. Conteos

| Estado | Antes de esta tanda | Después | Δ |
|---|---:|---:|---:|
| `NOT_EXERCISED` | 1126 | **1115** | −11 |
| `PARTIAL` | 20 | **23** | +3 |
| `OBSERVED_OK` | 174 | **182** | +8 |
| Denominador | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**12 celdas** cambiaron, todas de **A1**: **8** a `OBSERVED_OK` —siete desde `NOT_EXERCISED` y una desde
`PARTIAL`— y **4** a `PARTIAL` desde `NOT_EXERCISED`. Recuento obtenido recorriendo las 165 filas ×
8 actores, **no** por agregación de conteos declarados.

> 🕯️ `expected_by_actor` sigue **`NOT_VERIFIED`** en las **1320** celdas: un **201**, un **200** o un
> **204** acreditan que la escritura se aceptó, no que el conjunto de visibles sea el correcto para el
> actor. El estado global permanece **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**.

---

## 10. Límites

- **Un solo actor**, A1: ninguna celda de esta tanda acredita comportamiento de A2 a A8.
- **No** se certifica CRUD completo **por familia ni por actor**.
- **Ninguna** lectura de detalle por UI acreditada en armas ni ejercicios; en organización, sólo en
  estado **404**.
- **`PUT` no ejercitado** en ninguna de las tres familias de escritura.
- **Edición de unidades no ejercitada**: su `PARTIAL` previo se conserva.
- El **500** del alta de consumo de munición se registra **sin causa**: la respuesta no retuvo cuerpo
  y no hay traza.
- El alta de **consumo de arma** sigue bloqueada por un prerrequisito ausente; no se ejercitó ninguna
  escritura de esa familia.
- **Un solo tenant**: no hay aislamiento entre tenants y no se proveyó un segundo.
- **Backend sin tocar**: sin cambios de código, schema, datos originales ni credenciales, sin acceso a
  producción y **sin commit ni push**.
- **No** se corrieron `tests`, `build` ni navegador más allá del propio recorrido, y **no** se
  reclama estado de ellos.
- **No** hay cierre de aceptación integral: el estado global sigue **`NOT_VERIFIED`** y la conclusión
  de producto **`NO_CUMPLIDO`**.

---

## 11. Fuentes

Los quince artefactos primarios, **inalterados**, en
[`evidence/2026-10-13/`](./) y copiados sin cambios desde
`.cache/frontend-acceptance/2026-10-13/`:

| # | Artefacto | Aporta |
|---|---|---|
| 1 | [`weapon-create.json`](./weapon-create.json) | `POST /api/armas/` **201** y `GET` **200** |
| 2 | [`weapon-patch.json`](./weapon-patch.json) | `PATCH /api/armas/4/` **200** y `GET` **200** |
| 3 | [`weapon-delete.json`](./weapon-delete.json) | `DELETE /api/armas/4/` **204**, `GET` **404**, **cero** remanentes |
| 4 | [`exercise-create.json`](./exercise-create.json) | `POST /api/ejercicios/` **201** y `GET` **200** |
| 5 | [`exercise-patch.json`](./exercise-patch.json) | `PATCH /api/ejercicios/5/` **200** y `GET` **200** |
| 6 | [`exercise-delete.json`](./exercise-delete.json) | `DELETE /api/ejercicios/5/` **204**, `GET` **404**, **cero** filas hijas |
| 7 | [`munition-create-attempt-1.json`](./munition-create-attempt-1.json) | `POST /api/consumos-municion/` **500**, payload completo |
| 8 | [`munition-create-attempt-2.json`](./munition-create-attempt-2.json) | `POST /api/consumos-municion/` **500**, payload reducido |
| 9 | [`munition-reconciliation-ui.json`](./munition-reconciliation-ui.json) | Reconciliación por botón de UI del intento 1, sin repetir escritura |
| 10 | [`munition-reconciliation-ui-2.json`](./munition-reconciliation-ui-2.json) | Reconciliación por botón de UI del intento 2, sin repetir escritura |
| 11 | [`weapon-consumption-prerequisite.json`](./weapon-consumption-prerequisite.json) | Selector vacío, envío deshabilitado, **cero** escrituras |
| 12 | [`organization-reconciliation.json`](./organization-reconciliation.json) | Estado final 13, 14 y 15; el 14 **sin** atribución |
| 13 | [`crud-batch-recovery.json`](./crud-batch-recovery.json) | Alta y baja de la unidad 13, incluido el detalle de UI en **404** |
| 14 | [`crud-batch-attempt-3-recovery.json`](./crud-batch-attempt-3-recovery.json) | Baja **204** de la unidad 15 e incidente de harness |
| 15 | [`crud-batch-retry-evidence.json`](./crud-batch-retry-evidence.json) | Alta **201** de la unidad 15 y borrado con path y estado `null` |

Celdas y conteos: [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json)
(bloque `observations.crud_ui_families_2026_10_13`). Consolidación del estado:
[`estado-integral-2026-10-12.md`](../../estado-integral-2026-10-12.md) §8. Deuda backend derivada del
**500**: [`backend-debt.md`](../../../../bugs/backend-debt.md) §8.

> 🕯️ Este documento **no** afirma completitud del producto ni emite veredicto de aceptación. No
> contiene secretos, cookies, RUT, correos ni nombres de personas: sólo alias, códigos de turno,
> rutas, estados HTTP y nombres de campo.