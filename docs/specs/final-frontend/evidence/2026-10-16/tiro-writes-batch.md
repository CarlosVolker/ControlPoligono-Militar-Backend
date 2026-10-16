---
actualizado: 2026-10-16
---

# Lote de fichas de escritura tiro+armerías (2026-10-16)

> 🕯️ **Qué es y qué no.** Registro documental del **lote de fichas de escritura** ejecutado el
> **2026-10-16** sobre la matriz de aceptación
> [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json): **46 celdas**
> `POST`/`PUT`/`PATCH`/`DELETE` que seguían **`NOT_EXERCISED`** con expectativa `EXPECTED_ALLOW` /
> `EXPECTED_ALLOW_SCOPED` (poblada desde **C-4**), ejercitadas con la **sesión real acreditada** de
> cada actor sobre **registros descartables**. Las **46** respondieron en **2xx** con el **estado exacto**
> de cada operación y se **certifican** (`NOT_EXERCISED` → `OBSERVED_OK`). Este documento **no** emite
> veredicto de aceptación, **no** cambia `status_global` ni `global_conclusion` y **no** propone ni
> aplica arreglos.

## Índice

1. [Qué es](#1-qué-es) · 2. [Método](#2-método) · 3. [Resultado 46/46](#3-resultado-4646) ·
4. [Limpieza y barrido estricto](#4-limpieza-y-barrido-estricto) · 5. [Certificación y conteos](#5-certificación-y-conteos) ·
6. [Límites](#6-límites) · 7. [Fuentes](#7-fuentes)

---

## 1. Qué es

La matriz de aceptación tiene **1320 celdas** (165 filas `OP-*` × 8 actores). Tras la campaña de
lecturas (barrido `GET`, siembras de contenido y RBAC), quedaba pendiente el carril de **escritura**:
las celdas `POST`/`PUT`/`PATCH`/`DELETE` que seguían `NOT_EXERCISED` pese a tener expectativa
`ALLOW`/`SCOPED` de C-4. Ejercitarlas era el paso que faltaba para que **la concesión de la escritura**
quedara observada contra la expectativa.

> 📜 **Denominador del lote:** **46 celdas** de escritura `NOT_EXERCISED` esperadas `ALLOW`/`SCOPED`.
> **Certificadas:** **46** (`NOT_EXERCISED` → `OBSERVED_OK`). **Sin certificar:** **0**. Ninguna celda
> objetivo quedó fuera.

El lote se ejecutó **una sola vez**; los efectos sobre la matriz los aplicó el script de certificación
`writes-certify-tiro-2026-10-16.cjs`, que **aborta sin escribir** ante cualquier desajuste.

---

## 2. Método

### 2.1 Sesiones acreditadas

Cada actor se acreditó **por correspondencia**: `POST /api/auth/login/` desde la **UI** devolvió **200**
y el `GET /api/auth/context/` devolvió **200** con el **rol primario esperado** activo
(`alias_matched: true`). Cuatro actores participaron del lote: **A1** (`super_admin`), **A2**
(`tenant_admin`), **A3** (`admin_unidad`) y **A5** (`oficial_tiro`).

| Alias | Rol primario esperado | Login UI | Contexto | `active_role` observado |
|---|---|:---:|:---:|---|
| **A1** | `super_admin` | 200 | 200 | `super_admin` |
| **A2** | `tenant_admin` | 200 | 200 | `tenant_admin` |
| **A3** | `admin_unidad` | 200 | 200 | `admin_unidad` |
| **A5** | `oficial_tiro` | 200 | 200 | `oficial_tiro` |

### 2.2 Ejercicio por llamada directa

Cada celda objetivo se ejercita con la **misma ruta y el mismo método que consume la UI**, contra la API
real, con la **cookie de sesión del actor** y su **`X-CSRFToken`** real. **Sin cookies fabricadas**: es la
llamada que la UI emite, no una sustituta. Cada actor opera sobre una **cadena descartable propia**
(alta → edición → baja), de modo que ninguna escritura toca datos ajenos al lote.

### 2.3 Marcadores descartables

Cada registro creado por el lote lleva un marcador con la forma **`T11<ALIAS><FAM>-01`** (p. ej.
`T11A1RNG-01`), que lo identifica como **descartable** y permite el barrido y la limpieza posterior. Los
marcadores **no** contienen datos personales: `<ALIAS>` es el alias del actor y `<FAM>` la familia del
recurso.

---

## 3. Resultado 46/46

`NOT_EXERCISED` → `OBSERVED_OK`. **46/46** con el **estado exacto** de cada operación: `POST` **201** ·
`PUT` **200** · `PATCH` **200** · `DELETE` **204**.

| OP | Método + endpoint | Actores certificados | Estado |
|---|---|---|:---:|
| `OP-RNG-002` | `POST /poligonos/` | A1, A2, A5 | 201 |
| `OP-RNG-004` | `PUT /poligonos/{id}/` | A1, A2, A5 | 200 |
| `OP-RNG-005` | `PATCH /poligonos/{id}/` | A1, A2, A5 | 200 |
| `OP-RNG-006` | `DELETE /poligonos/{id}/` | A1 | 204 |
| `OP-LES-002` | `POST /lecciones/` | A1, A2, A5 | 201 |
| `OP-LES-004` | `PUT /lecciones/{id}/` | A1, A2, A5 | 200 |
| `OP-LES-005` | `PATCH /lecciones/{id}/` | A1, A2, A5 | 200 |
| `OP-LES-006` | `DELETE /lecciones/{id}/` | A1, A2, A5 | 204 |
| `OP-FRC-002` | `POST /fracciones/` | A1, A2, A5 | 201 |
| `OP-FRC-004` | `PUT /fracciones/{id}/` | A1, A2, A5 | 200 |
| `OP-FRC-005` | `PATCH /fracciones/{id}/` | A1, A2, A5 | 200 |
| `OP-FRC-006` | `DELETE /fracciones/{id}/` | A1, A2, A5 | 204 |
| `OP-ARM-002` | `POST /armorias/` | A2, A3, A5 | 201 |
| `OP-ARM-004` | `PUT /armorias/{id}/` | A1, A2, A3, A5 | 200 |
| `OP-ARM-005` | `PATCH /armorias/{id}/` | A1, A2, A3, A5 | 200 |
| `OP-ARM-006` | `DELETE /armorias/{id}/` | A2 | 204 |

**Totales por familia:** RNG **10** · LES **12** · FRC **12** · ARM **12** = **46**.
**Totales por actor:** A1 **14** · A2 **15** · A5 **14** · A3 **3** = **46**.
**Totales por verbo:** `POST` **12** · `PUT` **13** · `PATCH` **13** · `DELETE` **8** = **46**.

> 📖 Las celdas `A2`/`A3`/`A5` de `OP-ARM-002` y las `A1`/`A2`/`A3`/`A5` de `OP-ARM-004`/`005` fueron las
> que quedaban `NOT_EXERCISED` con expectativa `ALLOW`; las ya observadas de esas filas (p. ej. `A1` y
> `A7` en `OP-ARM-002`) **no** se volvieron a certificar. El script exige, celda por celda, que la
> expectativa sea `ALLOW`/`SCOPED` y que el estado previo sea `NOT_EXERCISED`.

---

## 4. Limpieza y barrido estricto

### 4.1 Relevos de limpieza del lote (3)

La baja de los registros fuera de la celda que los creó se hizo por **relevo de A1** (bypass
`super_admin`), con `DELETE` **204**:

| Recurso | `id` | Estado |
|---|:---:|:---:|
| polígono de A2 | 4 | 204 |
| armería de A5 | 10 | 204 |
| polígono de A5 | 5 | 204 |

### 4.2 Limpieza posterior y barrido estricto

La limpieza posterior (`.cache/frontend-acceptance/2026-10-16/tiro-writes-cleanup-2026-10-16.json`) hizo
**un relevo más**: la **armería de A3 `id` 9**, residuo que el lote dejó **por omisión del relevo de A3**
(`DELETE` **204**). Después, barrido **estricto** del token **`T11A`** sobre las **8 familias**
(polígonos, lecciones, fracciones, armerías, armas, ejercicios, usuarios, unidades): **0 coincidencias**.

### 4.3 Nota de corrección honesta (token laxo → token estricto)

El conteo **previo** del propio lote usó el token **laxo `T11`** y marcó **`own_matches: 2`** (1 en
`armorias`, 1 en `usuarios`). Esos **2** eran un **falso positivo**: la subcadena `T11` aparecía dentro de
un **timestamp ISO** (`…T11:…`), no en un marcador. El marcador real es `T11<ALIAS><FAM>-01`, de modo que
el token estricto **`T11A`** es el único que discrimina. Re-corrido con el token estricto, el residuo
quedó en **0**. La traza laxa (`own_matches: 2`) y su explicación se conservan en el JSON del lote, **no**
se borran.

> 🕯️ **Regla dura, verificada contra evidencia.** El script de certificación **aborta** (`BLOCKED`, sin
> escribir) ante cualquier desajuste: `batch.schema` distinto de `frontend-t11-writes-tiro/v1`, paso
> duplicado, `op` inexistente, expectativa no-`ALLOW`, celda a certificar que no está `NOT_EXERCISED`,
> `MATCH_2XX` sin 2xx, o recuento posterior distinto del esperado. La matriz de entrada cuadró y la
> **comparación estructural** contra la copia de reversión confirmó que sólo cambiaron los **46** estados
> certificados, `cell_state_counts`, **16** evidencias de fila y `observations`.

---

## 5. Certificación y conteos

### 5.1 Conteos

| Estado | Antes | Después | Δ |
|---|---:|---:|---:|
| `OBSERVED_OK` | 655 | **701** | +46 |
| `PARTIAL` | 7 | **7** | 0 |
| `NOT_EXERCISED` | 658 | **612** | −46 |
| Total | 1320 | **1320** | — |

**46 celdas** cambiaron, todas de `NOT_EXERCISED` a `OBSERVED_OK`. Recuento obtenido recorriendo las **165
filas × 8 actores**, **no** por agregación de conteos declarados; coincide con `cell_state_counts`.

### 5.2 Evidencia de fila

Las **16 filas** con al menos una celda certificada reciben al final de su campo `evidence`, **sin** borrar
el texto previo, el anexo:

> ` Actualización 2026-10-16: fichas de escritura del lote tiro+armerías (cadena descartable; llamada directa con sesión real) — POST/PUT/PATCH/DELETE 2xx observados en <actores>; celdas certificadas (NOT_EXERCISED → OBSERVED_OK).`

Filas: `OP-ARM-002/004/005/006`, `OP-FRC-002/004/005/006`, `OP-LES-002/004/005/006`,
`OP-RNG-002/004/005/006`. La pasada queda registrada en `observations.writes_batch_tiro_2026_10_16`.

### 5.3 Contraste C-4

El lote **valida C-4 sobre las celdas de escritura**:
[`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md)
(§1–§4) es la fuente de `expected_by_actor` (`expected_source: C-4`). Las **46** celdas esperadas
`ALLOW`/`SCOPED` respondieron **2xx**, exactamente lo que C-4 predice: **0 discrepancias**.

- **Distribución del lote:** 46 `MATCH_2XX` · 0 `not_certified`.
- **Desajustes de autorización:** **0**.
- **Respuestas no-2xx:** **0**.

---

## 6. Límites

- **La escritura certificada acredita la concesión de la acción, no la corrección del efecto.** Un `2xx`
  sobre una escritura afirma que el permiso concedió la operación sobre la cadena descartable; **no**
  valida que el estado resultante del recurso sea el correcto, ni cubre las condiciones de §4.3/§4.4 de
  C-4 (conjuntos visibles).
- **El `NOT_VERIFIED` persiste.** `status_global` sigue **`NOT_VERIFIED`** y `global_conclusion` sigue
  **`NO_CUMPLIDO`**, sin cambios; `expected_by_actor` intacto.
- **Alcance acotado a las 46 celdas.** Ninguna celda fuera de las 46 certificadas se tocó (verificado por
  comparación estructural contra la copia de reversión).
- **Script fuera de `evidence`.** El script de certificación **no** se copia a este directorio; vive en
  `.cache`. El documento de evidencia sí se copia, y los JSON fuente del lote y de la limpieza tienen
  **copia durable** (§7).
- **Sin secretos ni datos personales.** Los registros descartables usaron identificadores sintéticos que
  **no** se persisten; el documento cita **ids numéricos** y **marcadores**, no RUT, correos ni nombres.
- **Sin backend, base de datos ni navegador.** Sólo llamadas a la API real ya en marcha y reescritura del
  JSON de la matriz; **sin** `git add`/`commit`.

> 🕯️ Este documento **no** afirma completitud del producto ni emite veredicto de aceptación.

---

## 7. Fuentes

| # | Fuente | Aporta |
|---|---|---|
| 1 | [`tiro-writes-2026-10-16.json`](./tiro-writes-2026-10-16.json) | **Copia durable** del lote ejecutado: schema, sesiones acreditadas, 46 pasos con verbo y estado, 3 relevos, barrido laxo del lote y resumen (`sha256 09e64325…`) |
| 2 | [`tiro-writes-cleanup-2026-10-16.json`](./tiro-writes-cleanup-2026-10-16.json) | **Copia durable** de la limpieza: relevo de la armería A3 `id` 9 (204) y barrido estricto `T11A` en 8 familias con **0** coincidencias (`sha256 4b2820c9…`) |
| 3 | [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json) | Las 46 celdas objetivo, su `expected_by_actor` (C-4) y los efectos del lote (`observations.writes_batch_tiro_2026_10_16`) |
| 4 | [`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md) | Origen de `expected_by_actor` (C-4, §1–§4) |
| 5 | `.cache/frontend-acceptance/2026-10-16/writes-certify-tiro-2026-10-16.cjs` | Script ejecutado (no copiado a `evidence`): 46 clasificaciones, 46 flips, 16 anexos, comparación estructural |
| 6 | `.cache/frontend-acceptance/2026-10-16/tiro-writes-2026-10-16.run.cjs` · `tiro-writes-cleanup-2026-10-16.run.cjs` | Runners del lote y de la limpieza (viven en `.cache`) |

Copia de reversión previa al lote: `.cache/frontend-acceptance/2026-10-16/acceptance-matrix.before-writes-tiro.json`
(`sha256 11ebbdea…`, idéntico al pre-estado). Plan de cierre:
[`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md).
