---
actualizado: 2026-10-14
---

# Recorrido CRUD complementario por UI — detalle y `PUT` (A1)

> 🕯️ **Qué es y qué no.** Registro documental del recorrido por UI del **2026-10-14** con el actor
> **A1** (`super_admin`) sobre backend real, en tres familias: unidades organizativas, armas y
> ejercicios. Acredita la **navegación de detalle en la UI** y el **método `PUT`**, que seguían sin
> cobertura observada. **No** certifica aceptación integral, **no** emite veredicto de producto y
> **no** propone ni aplica arreglos: no se tocó código de producto, backend, schema, datos originales
> ni credenciales. Fuentes primarias **inalteradas** y su procedencia, en
> [`sources-manifest.json`](./sources-manifest.json).

## 1. Origen de cada observación

La fuente distingue tres orígenes y no los fusiona. La distinción es la que sostiene la promoción de
las filas de detalle:

| Origen | Qué es | Qué acredita |
|---|---|---|
| **UI** | Clics de Playwright sobre controles reales de producto; método, ruta y estado capturados de eventos de respuesta | Que la escritura o la navegación salió de la interfaz |
| **`GET` de harness** | Lectura de sólo lectura en la página autenticada con `X-Tenant-Code`, sin escrituras por API | Que el servidor confirma el efecto; **no** que haya habido navegación de UI |
| **Prefill** | Comparación de `inputValue` del formulario de edición contra el marcador propio | Que el formulario se sembró con los valores del registro; no se infiere del `GET` de harness |

> 🕯️ Esta separación cierra una observación abierta desde el 2026-10-13: las filas de detalle
> (`OP-UNT-003`, `OP-WPN-003`, `OP-EJR-003`) estaban en `PARTIAL` porque sus lecturas de detalle eran
> del harness. Aquí la fuente registra la **apertura de la ruta de detalle por UI con estado 200**.

## 2. Registro por familia

Las tres familias usaron registros descartables creados por el propio recorrido: unidad **16**, arma
**5** y ejercicio **6**. Todos se dieron de baja al final.

### 2.1 Unidades organizativas — id 16

| Paso | Método y ruta | Estado | Origen declarado |
|---|---|---|---|
| Alta | `POST /api/organization-units/` | **201** | UI · Crear unidad → Guardar |
| Verificación previa | `GET /api/organization-units/16/` | **200** | `GET` de harness · id y marcador coinciden |
| **Detalle por UI** | Ruta `/organizacion/unidades/16` → `GET /api/organization-units/16/` | **200** | UI · enlace de la fila propia |
| Prefill | Formulario Editar | código y nombre coinciden | UI · comparación de `inputValue` |
| Edición | `PATCH /api/organization-units/16/` | **200** | UI · Guardar cambios · campo `name` |
| Verificación posterior | `GET /api/organization-units/16/` | **200** | `GET` de harness · nombre editado y código coinciden |
| Sustitución completa | `PUT /api/organization-units/16/` | **200** | UI · envío nativo del formulario (`front/src/views/organization/OrganizationView.vue:1793`) |
| Verificación posterior | `GET /api/organization-units/16/` | **200** | `GET` de harness · marcador y nombre editado coinciden |
| Baja | `DELETE /api/organization-units/16/` | **204** | UI · Eliminar unidad, con el marcador verificado en el diálogo |
| Verificación final | `GET /api/organization-units/16/` | **404** | `GET` de harness |

### 2.2 Armas — id 5

| Paso | Método y ruta | Estado | Origen declarado |
|---|---|---|---|
| Alta | `POST /api/armas/` | **201** | UI · Registrar arma |
| Verificación previa | `GET /api/armas/5/` | **200** | `GET` de harness · id y marcador coinciden |
| **Detalle por UI** | Ruta `/almacen/armas/5` → `GET /api/armas/5/` | **200** | UI · enlace de la fila propia |
| Prefill | Formulario Editar | modelo y número de serie coinciden | UI · comparación de `inputValue` |
| Sustitución completa | `PUT /api/armas/5/` | **200** | UI · Guardar con `PUT` · campo `modelo_arma` |
| Verificación posterior | `GET /api/armas/5/` | **200** | `GET` de harness · modelo editado y marcador coinciden |
| Baja | `DELETE /api/armas/5/` | **204** | UI · Confirmar baja, con modelo y serie verificados en el diálogo |
| Verificación final | `GET /api/armas/5/` | **404** | `GET` de harness |

### 2.3 Ejercicios — id 6

| Paso | Método y ruta | Estado | Origen declarado |
|---|---|---|---|
| Alta | `POST /api/ejercicios/` | **201** | UI · Crear ejercicio → Crear |
| Verificación previa | `GET /api/ejercicios/6/` | **200** | `GET` de harness · id y marcador coinciden |
| **Detalle por UI** | Ruta `/tiro/ejercicios/6` → `GET /api/ejercicios/6/` | **200** | UI · Ver ficha |
| Prefill | Formulario Editar | nombre y observaciones coinciden | UI · comparación de `inputValue` |
| Sustitución completa | `PUT /api/ejercicios/6/` | **200** | UI · Guardar completo · campo `observaciones` |
| Verificación posterior | `GET /api/ejercicios/6/` | **200** | `GET` de harness · observaciones editadas y marcador coinciden |
| Baja | `DELETE /api/ejercicios/6/` | **204** | UI · Confirmar baja, con id y marcador verificados en el diálogo |
| Verificación final | `GET /api/ejercicios/6/` | **404** | `GET` de harness |

### 2.4 Limpieza

Los tres registros propios quedaron dados de baja por UI con **204**, y los tres `GET` de detalle
posteriores devolvieron **404**: **cero** registros propios remanentes por detalle.

> 🕯️ Un **204** y un **404** de detalle acreditan que el recurso dejó de estar disponible en la
> superficie observada; **no** acreditan borrado físico en la base de datos, y así lo declara la propia
> fuente.

## 3. Celdas de la matriz afectadas

Actor **A1** en todas. Denominador, filas, actores y `total_cells` **sin cambio**.

| Fila | Antes | Ahora | Observado |
|---|---|---|---|
| `GET /organization-units/{id}/` (`OP-UNT-003`) | `PARTIAL` | `OBSERVED_OK` | Detalle por UI con **200**, con lectura de harness declarada aparte |
| `PUT /organization-units/{id}/` (`OP-UNT-004`) | `NOT_EXERCISED` | `OBSERVED_OK` | `PUT` **200** por UI y `GET` **200** confirmatorio |
| `PATCH /organization-units/{id}/` (`OP-UNT-005`) | `PARTIAL` | `OBSERVED_OK` | `PATCH` **200** por UI con estado HTTP registrado y `GET` **200** confirmatorio |
| `GET /armas/{id}/` (`OP-WPN-003`) | `PARTIAL` | `OBSERVED_OK` | Detalle por UI con **200**, con lectura de harness declarada aparte |
| `PUT /armas/{id}/` (`OP-WPN-004`) | `NOT_EXERCISED` | `OBSERVED_OK` | `PUT` **200** por UI y `GET` **200** confirmatorio |
| `GET /ejercicios/{id}/` (`OP-EJR-003`) | `PARTIAL` | `OBSERVED_OK` | Detalle por UI con **200**, con lectura de harness declarada aparte |
| `PUT /ejercicios/{id}/` (`OP-EJR-004`) | `NOT_EXERCISED` | `OBSERVED_OK` | `PUT` **200** por UI y `GET` **200** confirmatorio |

### 3.1 Celdas que **no** se movieron

| Fila | Estado conservado | Motivo |
|---|---|---|
| `POST /organization-units/`, `POST /armas/`, `POST /ejercicios/` | `OBSERVED_OK` (2026-10-13) | Los `POST` **201** de esta corrida son prerrequisitos descartables: no agregan cobertura a filas ya acreditadas |
| `PATCH /armas/{id}/`, `PATCH /ejercicios/{id}/` | `OBSERVED_OK` (2026-10-13) | No se repitieron en esta corrida |
| `DELETE` de las tres familias | `OBSERVED_OK` (2026-10-13) | Los `DELETE` **204** de esta corrida son limpieza de registros propios |
| Actores A2 a A8 | Sin cambio | Ninguna celda de esta corrida los cubre |

## 4. Conteos

| Estado | Antes | Después | Δ |
|---|---:|---:|---:|
| `OBSERVED_OK` | 185 | **192** | +7 |
| `PARTIAL` | 23 | **19** | −4 |
| `NOT_EXERCISED` | 1112 | **1109** | −3 |
| Denominador | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**7 celdas** cambiaron, todas de **A1**: **4** de `PARTIAL` a `OBSERVED_OK` y **3** de `NOT_EXERCISED`
a `OBSERVED_OK`. Recuento obtenido recorriendo las 165 filas × 8 actores, **no** por agregación de conteos declarados.

> 🕯️ `expected_by_actor` sigue **`NOT_VERIFIED`** en las **1320** celdas: un **201**, un **200** o un
> **204** acreditan que la escritura se aceptó, **no** que el conjunto de visibles sea el correcto para
> el actor. El estado global permanece **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**.

## 5. Límites

- **Un solo actor**, A1: nada de esto describe el comportamiento de A2 a A8.
- **No** se certifica CRUD completo **por familia ni por actor**.
- Un `204` con `GET` **404** **no** acredita borrado físico en la base de datos.
- **Un solo tenant**: no hay aislamiento entre tenants.
- **Backend sin tocar**: sin cambios de código, schema, datos originales ni credenciales, sin acceso a
  producción y **sin commit ni push**. Los servidores vivos de la corrida anterior **no** se
  reiniciaron.
- **No** se corrieron `tests` ni `build`, y **no** se reclama estado de ellos.
- Personas y consumo de munición **no** se ejercitaron en esta corrida.

> 📜 **Historia conservada.** El `PATCH` de compensación de organización del 2026-10-13, ejecutado por
> API pública y **sin estado HTTP consignado**, se mantiene tal cual en la fila `OP-UNT-005` y en su
> bloque de observación. No se reescribe ni se completa con un estado supuesto. Los conteos históricos
> de las tandas previas tampoco.

## 6. Fuentes

| # | Artefacto | Relación con el origen |
|---|---|---|
| 1 | [`remaining-crud-ui.json`](./remaining-crud-ui.json) | **Copia idéntica** (`cmp`, sha256 `f246fe9c…`), `delivery_status: DELIVERED` |
| 2 | [`sources-manifest.json`](./sources-manifest.json) | Relación unívoca origen/copia de todas las fuentes de este directorio |
| 3 | [`persons-summary.md`](./persons-summary.md) | Recorrido del mismo día y actor, conservado sin Alteración |

Celdas y conteos: [`../2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json)
(bloque `observations.remaining_crud_ui_2026_10_14`). Consolidación del estado:
[`../../estado-integral-2026-10-12.md`](../../estado-integral-2026-10-12.md) §10.

> 🕯️ Esta evidencia no contiene secretos, cookies, RUT, correos, contraseñas ni nombres de personas:
> sólo alias de actor, identificadores de registro propios, marcadores de turno, rutas, métodos,
> estados HTTP, nombres de campo y un ancla de código de frontend.