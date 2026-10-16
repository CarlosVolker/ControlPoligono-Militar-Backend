---
actualizado: 2026-10-13
---

# Edición y borrado de resultados de tiro — recorrido real con A1 (2026-10-13)

> 🕯️ **Qué es y qué no.** `Lore Master`. Registro documental de un recorrido **real** de UI de
> producto contra backend real, ejecutado por el orquestador el **2026-10-13** con Playwright.
> `source-kind`: `direct_orchestrator_playwright_ui`. **No** certifica aceptación integral, **no**
> emite veredicto de producto (corresponde al orquestador) y **no** propone ni aplica arreglos: no
> se cambió código de producto, backend, schema ni datos originales. Fuente primaria **inalterada**:
> [`shooting-edit-delete-results.json`](./shooting-edit-delete-results.json).

## 1. Índice

1. [Alcance y montaje](#1-alcance-y-montaje) · 2. [Recorrido observado](#2-recorrido-observado) ·
3. [Lectura del bloqueo en el código](#3-lectura-del-bloqueo-en-el-código) ·
4. [Celdas de la matriz afectadas](#4-celdas-de-la-matriz-afectadas) · 5. [Límites](#5-límites)

---

## 1. Alcance y montaje

| Dato | Valor observado |
|---|---|
| **Actor** | **A1** (`super_admin`), login por UI real |
| **Ruta** | `/tiro/fracciones/1/resultados` |
| **Fracción** | `id 1`, `organization_unit` **1** (`GET /api/fracciones/1/` → **200**) |
| **Armas leídas** | `id 1`, `id 2`, `id 3`, las tres con `organization_unit` **12** (`GET` → **200**) |
| **Resultados originales** | `id 1` y `id 2`, ambos con `organization_unit` **5**, fracción 1, carril 1 y 2 |
| **Descartable** | `id 3`, carril **99** exclusivo, usuario 20 y arma 3 sin ocupar en esa fracción |

> 📜 El descartable **no** nació en la UI: se creó por `POST` en la **API pública** con sesión y CSRF
> reales (**201**, `organization_unit` 5), porque las opciones de captura que ofrece la UI se derivan
> de resultados **existentes** y no dejaron ninguna combinación libre (§2.5).

---

## 2. Recorrido observado

### 2.1 Lectura del detalle y prefill

`GET /api/resultados/1/` → **200** al abrir el editor. El formulario se sembró con los valores reales
de la respuesta, sin divergencias: usuario 27, arma 1, 8 aciertos, 10 disparos, carril 1.

### 2.2 Campo requerido: cero escrituras

Con `tiros_acertados` vacío, el navegador marcó el campo como inválido y el envío **no ocurrió**:
**0 requests de escritura** y aviso visible «Revisa los campos señalados antes de enviar».

### 2.3 `PUT` emitido por la UI → **400**

| | |
|---|---|
| **Request** | `PUT /api/resultados/1/` con fracción 1, usuario 27, arma 1, **9** aciertos, 10 disparos, carril 1 |
| **Respuesta** | **400**, `non_field_errors`: «La fraccion no pertenece a la unidad organizacional del recurso.» |
| **Reconciliación** | `GET` posterior **200**: el registro quedó **sin cambios** |

> 🕯️ El `PUT` se repitió **una vez**: el cierre del modal agotó el tiempo de espera del harness y
> se reconcilió por `GET` antes de continuar. **Ambos** intentos devolvieron **400**. No se presupuso
> éxito ni se repitió un `POST` incierto.

### 2.4 `PATCH` emitido por la UI → **400**

| | |
|---|---|
| **Request** | `PATCH /api/resultados/1/` con `{tiros_acertados: 9}` |
| **Respuesta** | **400**, `non_field_errors`: «La fraccion no pertenece a la unidad organizacional del recurso.» |
| **Reconciliación** | `GET` posterior **200**: el registro quedó **sin cambios** |

`PUT` y `PATCH` son filas distintas en la matriz y se observaron por separado: **ninguno se infiere
del otro**.

### 2.5 Alta descartable por UI → **400** de unicidad

`POST /api/resultados/` por UI, con usuario 26 y arma 1 (carril 99) → **400** con dos mensajes de
unicidad: el tirador ya estaba asignado a esa fracción y el arma ya estaba asignada a otro tirador
en esa fracción. **Este rechazo no acredita alta por UI**: las opciones ofrecidas se derivan de
resultados existentes y todo lo seleccionable ya estaba ocupado.

### 2.6 Preparación del descartable por API → **201**

`POST /api/resultados/` por **API pública**, sesión obtenida mediante login UI y CSRF real, con
usuario **20** y arma **3** (existentes y sin ocupar en la fracción 1) → **201**, `id_resultado` **3**,
`organization_unit` **5**. Único registro creado en toda la corrida, y luego eliminado.

### 2.7 Cancelar y confirmar el borrado por UI → **204**

| Paso | Observado |
|---|---|
| Cancelar el borrado | El registro **conservado**: `GET /api/resultados/3/` → **200** |
| Recarga de la vista | Fila identificada por el **carril 99**, exclusivo del descartable |
| Confirmar el borrado | `DELETE /api/resultados/3/` → **204**; la fila **desapareció** de la tabla |
| Confirmación | `GET /api/resultados/3/` → **404** |

### 2.8 Estado final

`id 1` e `id 2` intactos y byte-equivalentes a su línea base (**8/10** en carril 1, **7/10** en
carril 2), **2 filas** visibles y **cero** descartables restantes.

### 2.9 Mensaje de error en la UI

Ante el **400** la UI mostró un mensaje **genérico** de HTTP 400, no el `non_field_errors` concreto.
Es una observación **frontend** abierta: **no se corrigió** en este recorrido y **no** se propone
arreglo aquí.

---

## 3. Lectura del bloqueo en el código

Anclas verificadas en fuente por el orquestador vía `Dwarven-Spelunkers`, y confirmadas en esta
redacción. Registran **por qué** ocurre el rechazo; no son un diagnóstico de corrección.

| Ancla | Qué dice |
|---|---|
| [`apipoligono/serializers.py:389-403`](../../../../../apipoligono/serializers.py) | `ResultadoTiroSerializer.validate` compara `fraccion.organization_unit_id` contra el `organization_unit` del recurso; el mensaje del **400** observado se emite en `:400-401` |
| [`apipoligono/serializers.py:375`](../../../../../apipoligono/serializers.py) | `tenant` y `organization_unit` están en `read_only_fields`: el cliente no puede enviarlos |
| [`apipoligono/mixins.py:34-48`](../../../../../apipoligono/mixins.py) | `perform_create` inyecta `tenant` y `organization_unit` al guardar (`:48`), es decir **después** de la validación |

> 📜 De ahí la asimetría: en el **alta** la validación no ve la unidad, de modo que un `POST` puede
> persistir una alineación que las **actualizaciones** posteriores rechazan. El recorrido lo muestra en
> los dos extremos: el `POST` de §2.6 creó el registro con `organization_unit` 5 mientras la fracción 1
> pertenece a la unidad 1, y los `PUT`/`PATCH` de §2.3 y §2.4 sobre un registro con esa misma
> desalineación fueron rechazados.

---

## 4. Celdas de la matriz afectadas

Filas localizadas por **método + endpoint** en
[`../2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json); sólo el actor **A1**
cambia de estado, en **cinco** celdas. Denominadores **165 / 1320** conservados.

| Fila (método + path) | Actor | Estado | Motivo |
|---|---|---|---|
| `GET /resultados/{id}/` | A1 | `OBSERVED_OK` | Detalle **200** con prefill fiel (§2.1). Alcance: sólo detalle y prefill del resultado 1; **no** certifica la superficie de lectura completa |
| `PUT /resultados/{id}/` | A1 | `PARTIAL` | Rechazo documentado con **400** y dato original intacto (§2.3). `PARTIAL` por rechazo, **no** por éxito |
| `PATCH /resultados/{id}/` | A1 | `PARTIAL` | Rechazo documentado con **400** y dato original intacto (§2.4). Observado por separado del `PUT` |
| `DELETE /resultados/{id}/` | A1 | `OBSERVED_OK` | **204** por UI, fila eliminada, `GET` posterior **404** (§2.7). **Límite del montaje:** el descartable se creó por API (§2.6), no por UI |
| `POST /resultados/` | A1 | `PARTIAL` | El alta **sí se ejerció por UI** y devolvió **400** de unicidad (§2.5). `PARTIAL` por rechazo observado; **no** acredita ninguna alta por UI |

> 📜 La fila de `POST` **no** queda `NOT_EXERCISED` porque hubo método, actor y respuesta observada:
> lo que no se acreditó es la **creación**, sino todo lo contrario — un **rechazo** con dos mensajes
> de unicidad. El `PARTIAL` no se lee como «alta parcialmente lograda».

---

## 5. Límites

- La **edición sigue bloqueada**. **No** se certifica `PUT` ni `PATCH` exitosos: sólo rechazos
  documentados.
- **No** se generaliza que toda edición esté rota: es un **dataset de desarrollo concreto** con
  `fracción 1` en la unidad 1 y resultados en la unidad 5.
- El `DELETE` está acreditado **sólo con A1** y **sólo** sobre un registro preparado por API: no
  certifica otros actores ni aislamiento.
- El **contexto de navegador previo** tuvo transiciones bloqueadas; un contexto nuevo permitió
  interacciones normales. **La causa de las transiciones bloqueadas no se establece** ni se atribuye
  al producto.
- La **captura de pantalla agotó timeout**: **no** hay evidencia visual utilizable y **no** se
  atribuye causa al producto.
- La UI mostró el **400 genérico** en vez del detalle (§2.9): pendiente **frontend** observado y
  **no** corregido.
- **No** se corrieron `tests` ni `build` en esta corrida: no hubo cambios de código y no se reclama
  estado de ellos.
- **Sólo A1**. El estado global sigue **`NOT_VERIFIED` / `NO_CUMPLIDO`**; esta corrida **no** cierra
  ninguna aceptación integral.

### Trazabilidad

| Documento | Ruta |
|---|---|
| Evidencia primaria (intacta) | [`shooting-edit-delete-results.json`](./shooting-edit-delete-results.json) |
| Celdas y conteos | [`acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json) · bloque `observations.shooting_edit_delete_a1_2026_10_13` |
| Deuda backend | [`../../../../bugs/backend-debt.md`](../../../../bugs/backend-debt.md) §7.1 y §2 |
| Estado consolidado | [`estado-integral-2026-10-12.md`](../../estado-integral-2026-10-12.md) §6 (apéndice 2026-10-13) |
