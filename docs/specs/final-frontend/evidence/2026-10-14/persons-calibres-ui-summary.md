---
actualizado: 2026-10-14
---

# Persona temporal y catálogo de calibres — recorrido por UI (A1)

> 🕯️ **Qué es y qué no.** Registro documental del recorrido por UI del **2026-10-14** con el actor
> **A1** (`super_admin`) sobre backend real, en dos frentes: el **método `PUT` de persona** y las
> **cuatro operaciones de escritura del catálogo de calibres**. **No** certifica aceptación integral,
> **no** emite veredicto de producto y **no** propone ni aplica arreglos: no se tocó código de producto,
> backend, schema, datos originales ni credenciales. Fuentes primarias **inalteradas** y su
> procedencia, en [`sources-manifest.json`](./sources-manifest.json).

## 1. Origen de cada observación

| Origen | Qué es | Qué acredita |
|---|---|---|
| **UI** | Clics reales sobre controles de producto; método, ruta y estado capturados por Playwright | Que la escritura salió de la interfaz |
| **`GET` de harness** | Lectura autenticada de sólo lectura en la página | Que el servidor confirma el efecto; **no** que haya hubo navegación de UI |
| **Prefill** | Comparación de `inputValue` del formulario de edición | Que el formulario se sembró con los valores del registro propio |

## 2. Persona temporal — id 29

Registro descartable creado por el propio recorrido, con marcador de turno `DCT20261014PER02` y
cero asignaciones.

| Paso | Método y ruta | Estado | Origen declarado |
|---|---|---|---|
| Alta | `POST /api/usuarios/crear-temporal/` | **201** | UI · Alta temporal → Crear temporal |
| Verificación previa | `GET /api/usuarios/29/` | **200** | `GET` de harness · id y marcador coinciden, sin asignaciones |
| Detalle por UI | Ruta `/personas/29` → `GET /api/usuarios/29/` | **200** | UI · enlace de la fila propia |
| Prefill | Formulario de edición | el nombre propio coincide | UI · comparación de `inputValue` |
| Sustitución completa | `PUT /api/usuarios/29/` | **200** | UI · «Método: PUT — reemplazo completo → Guardar usuario» · campo `nombre` |
| Verificación posterior | `GET /api/usuarios/29/` | **200** | `GET` de harness · marcador editado coincide |
| Baja | `DELETE /api/usuarios/29/` | **204** | UI · Confirmar baja, con el marcador verificado en el diálogo |
| Verificación final | `GET /api/usuarios/29/` | **404** | `GET` de harness |

### 2.1 El alta genérica de persona no se ejercitó

`POST /usuarios/` (`OP-USR-002`) sigue **`NOT_EXERCISED`**, y la razón está registrada en la matriz:
el flujo formal **crea una cuenta autenticable**, con contraseña temporal y asignación inicial de rol y
unidad, lo que queda fuera del alcance de esta corrida. Es una **exclusión de alcance**, no una
restricción de privacidad ni un bloqueo. El alta de persona temporal (`OP-USR-012`) es otra fila y otro
endpoint, ya acreditada por su `POST` **201**, y no cubre esta.

## 3. Calibre descartable e inactivo — id 7

Registro propio, **inactivo**, creado para el recorrido y eliminado al final.

| Paso | Método y ruta | Estado | Origen declarado |
|---|---|---|---|
| Alta | `POST /api/calibres/` | **201** | UI · Crear calibre |
| Verificación previa | `GET /api/calibres/7/` | **200** | `GET` de harness · id, marcador e `is_active` coinciden |
| Lectura desde la UI | `GET /api/calibres/7/` | **200** | UI · apertura del editor «Editar calibre» desde la fila propia |
| Prefill | Formulario Editar calibre | `code` y `nombre` coinciden | UI · comparación de `inputValue` |
| Edición | `PATCH /api/calibres/7/` | **200** | UI · Guardar cambios con `PATCH` · campo `nombre` |
| Verificación posterior | `GET /api/calibres/7/` | **200** | `GET` de harness · marcador y nombre editado coinciden |
| Sustitución completa | `PUT /api/calibres/7/` | **200** | UI · Guardar con `PUT` · campo `nombre` |
| Verificación posterior | `GET /api/calibres/7/` | **200** | `GET` de harness · marcador y nombre editado coinciden, sigue inactivo |
| Baja | `DELETE /api/calibres/7/` | **204** | UI · «Confirmar eliminación de calibre», con el marcador verificado |
| Verificación final | `GET /api/calibres/7/` | **404** | `GET` de harness |

**Ningún calibre canónico fue modificado** y **ningún arma ni consumo quedó vinculado** al calibre
descartable: la fuente lo declara en `canonical_calibres_modified: false` y
`weapons_or_consumptions_linked: false`.

### 3.1 Límite explícito de la lectura de detalle de calibre

La lectura de `GET /calibres/{id}/` se observó **a través del editor** abierto desde la fila propia en
`SCREEN-CALIBERS` (`/almacen/calibres`). **No** se ejercitó ninguna navegación a una ruta de detalle
independiente, y así queda escrito en la fuente y en la matriz.

El límite es acotado y no se decora: la fila `OP-CAL-003` **no exige ruta propia**. Su única pantalla
declarada es `SCREEN-CALIBERS` —la misma del editor, sin pantalla de detalle separada en el corpus— y
su criterio `AC-OP-CAL-003` versa sobre la **forma de la respuesta** (`id_calibre`, `code`, `nombre`,
`is_active`), no sobre una pantalla de navegación. La forma queda atestiguada: `code` y `nombre` por
comparación de `inputValue` en la UI, e `is_active` por el `GET` de harness declarado como tal.
**No se infiere ninguna navegación que no se observó.**

## 4. Limpieza

Los dos registros propios —persona **29** y calibre **7**— se dieron de baja por UI con **204**, y sus
`GET` de detalle posteriores devolvieron **404**: **cero** remanentes propios por detalle.

> 🕯️ Un **204** y un **404** acreditan que el recurso dejó de estar disponible en la superficie
> observada; **no** acreditan borrado físico en la base de datos, y así lo declara la fuente.

## 5. Celdas de la matriz afectadas

Actor **A1** en todas. Denominador, filas, actores y `total_cells` **sin cambio**.

| Fila | Antes | Ahora | Observado |
|---|---|---|---|
| `PUT /usuarios/{id}/` (`OP-USR-004`) | `NOT_EXERCISED` | `OBSERVED_OK` | `PUT` **200** por UI y `GET` **200** confirmatorio |
| `POST /calibres/` (`OP-CAL-002`) | `NOT_EXERCISED` | `OBSERVED_OK` | Alta **201** por UI de un calibre descartable e inactivo |
| `GET /calibres/{id}/` (`OP-CAL-003`) | `NOT_EXERCISED` | `OBSERVED_OK` (acotado) | Lectura **200** desde la UI con prefill coincidente; **sin** ruta de detalle independiente |
| `PUT /calibres/{id}/` (`OP-CAL-004`) | `NOT_EXERCISED` | `OBSERVED_OK` | `PUT` **200** por UI y `GET` **200** confirmatorio |
| `PATCH /calibres/{id}/` (`OP-CAL-005`) | `NOT_EXERCISED` | `OBSERVED_OK` | `PATCH` **200** por UI y `GET` **200** confirmatorio |
| `DELETE /calibres/{id}/` (`OP-CAL-006`) | `NOT_EXERCISED` | `OBSERVED_OK` | Baja **204** por UI y `GET` **404** |

### 5.1 Evidencia añadida sin cambio de estado

| Fila | Estado | Qué se sumó |
|---|---|---|
| `GET /usuarios/{id}/` (`OP-USR-003`) | `OBSERVED_OK`, **sin cambio** | Navegación de UI a `/personas/29` con **200** y prefill verificado |

La celda ya estaba acreditada desde el 2026-10-13 por la ficha propia abierta en `/cuenta`. Lo que
suma este recorrido es **alcance**, no una promoción nueva, y el `GET` de verificación del harness
quueda declarado aparte de la navegación de UI.

### 5.2 Celdas que **no** se movieron

| Fila | Estado conservado | Motivo |
|---|---|---|
| `POST /usuarios/` (`OP-USR-002`) | `NOT_EXERCISED` | Crea una cuenta autenticable: fuera de alcance. El alta temporal es otra fila |
| `POST /usuarios/crear-temporal/` (`OP-USR-012`) | `OBSERVED_OK` (2026-10-13) | El `POST` **201** de esta corrida es prerrequisito descartable |
| `DELETE /usuarios/{id}/` (`OP-USR-006`) | `OBSERVED_OK` (2026-10-13 y §9) | El `DELETE` **204** de esta corrida es limpieza |
| Actores A2 a A8 | Sin cambio | Ninguna celda de esta corrida los cubre |

## 6. Conteos

| Estado | Antes | Después | Δ |
|---|---:|---:|---:|
| `OBSERVED_OK` | 192 | **198** | +6 |
| `PARTIAL` | 19 | **19** | — |
| `NOT_EXERCISED` | 1109 | **1103** | −6 |
| Denominador | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**6 celdas** cambiaron, todas de **A1**: las seis de `NOT_EXERCISED` a `OBSERVED_OK`. La octava fila
tocada, `OP-USR-003`, **conservó su estado** y sólo acumula evidencia puntual. Recuento obtenido
recorriendo las 165 filas × 8 actores, **no** por agregación de conteos declarados.

> 🕯️ `expected_by_actor` sigue **`NOT_VERIFIED`** en las **1320** celdas: un **201**, un **200** o un
> **204** acreditan que la escritura se aceptó, **no** que el conjunto de visibles sea el correcto para
> el actor. El estado global permanece **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**.

## 7. Límites

- **Un solo actor**, A1: nada de esto describe el comportamiento de A2 a A8.
- **Alta genérica de persona no ejercitada** por exclusión de alcance, no por bloqueo.
- **Detalle de calibre observado por el editor**, sin ruta de detalle independiente; no se infiere.
- Un `204` con `GET` **404** **no** acredita borrado físico en la base de datos.
- **Un solo tenant**: no hay aislamiento entre tenants.
- **Backend sin tocar**: sin cambios de código, schema, datos originales ni credenciales, sin acceso a
  producción y **sin commit ni push**. Los servidores vivos **no** se reiniciaron.
- **No** se corrieron `tests` ni `build`, y **no** se reclama estado de ellos.

## 8. Fuentes

| # | Artefacto | Relación con el origen |
|---|---|---|
| 1 | [`persons-calibres-ui.json`](./persons-calibres-ui.json) | **Copia idéntica** (`cmp`, sha256 `abf7d7c3…`), `delivery_status: DELIVERED` |
| 2 | [`sources-manifest.json`](./sources-manifest.json) | Relación unívoca origen/copia de todas las fuentes de este directorio |

Celdas y conteos: [`../2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json)
(bloque `observations.persons_calibres_2026_10_14`). Consolidación del estado:
[`../../estado-integral-2026-10-12.md`](../../estado-integral-2026-10-12.md) §11.

> 🕯️ Esta evidencia no contiene secretos, cookies, RUT, correos, contraseñas ni nombres de personas.
> La fuente menciona la contraseña temporal del flujo excluido como parte de su descripción, **sin
> consignar su valor**.