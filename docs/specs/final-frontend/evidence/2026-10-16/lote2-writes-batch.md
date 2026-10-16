---
actualizado: 2026-10-16
---

# Lote 2 de fichas de escritura (2a + 2b) — 58/58 (2026-10-16)

> 🕯️ **Qué es y qué no.** Registro documental del **lote 2** de **fichas de escritura** ejecutado el
> **2026-10-16** sobre la matriz de aceptación
> [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json), en **dos
> corridas** — **2a** (autoservicio) y **2b** (descartables) —: **58 celdas** `POST`/`PUT`/`PATCH`/`DELETE`
> que seguían **`NOT_EXERCISED`** con expectativa `EXPECTED_ALLOW` / `EXPECTED_ALLOW_SCOPED` (poblada desde
> **C-4**), ejercitadas con la **sesión real acreditada** de cada actor. Las **58** respondieron en **2xx**
> en su estado exacto y se **certifican** (`NOT_EXERCISED` → `OBSERVED_OK`). Este documento **no** emite
> veredicto de aceptación, **no** cambia `status_global` ni `global_conclusion` y **no** propone ni aplica
> arreglos.

## Índice

1. [Qué es](#1-qué-es) · 2. [Método](#2-método) · 3. [Lote 2a — autoservicio 23/23](#3-lote-2a--autoservicio-2323) ·
4. [Lote 2b — descartables 35/35](#4-lote-2b--descartables-3535) · 5. [Pre-fase de siembra de armas](#5-pre-fase-de-siembra-de-armas) ·
6. [Limpieza y barrido estricto](#6-limpieza-y-barrido-estricto) · 7. [Dos hechos consignados sin inflarlos](#7-dos-hechos-consignados-sin-inflarlos) ·
8. [Certificación y conteos](#8-certificación-y-conteos) · 9. [Límites](#9-límites) · 10. [Fuentes](#10-fuentes)

---

## 1. Qué es

La matriz de aceptación tiene **1320 celdas** (165 filas `OP-*` × 8 actores). Tras el **lote de escritura
tiro+armerías** (46 celdas) y el **lote USR** (19 celdas) del mismo día, el carril de **escritura** quedaba
con **58 celdas** `POST`/`PUT`/`PATCH`/`DELETE` todavía `NOT_EXERCISED` pese a tener expectativa
`ALLOW`/`SCOPED` de C-4. El **lote 2** las ejercita y las certifica, **en dos corridas separadas por su
naturaleza**:

- **Lote 2a — autoservicio (23 celdas):** operaciones sobre el **propio actor** — preferencias de
  apariencia legacy, selección de la unidad activa propia y cierre de sesión. **Sin descartables**: cada
  actor opera sobre sí mismo y la limpieza es la restauración del estado previo.
- **Lote 2b — descartables (35 celdas):** operaciones de dominio sobre **registros descartables** —
  consumos-arma, membresías, recintos, unidades y puestos/holders — creados y dados de baja por el propio
  lote, con una **pre-fase de siembra de armas** para liberar parejas `(consumo, arma)`.

> 📜 **Denominador del lote:** **58 celdas** de escritura `NOT_EXERCISED` esperadas `ALLOW`/`SCOPED`
> (**23** de 2a + **35** de 2b). **Certificadas:** **58** (`NOT_EXERCISED` → `OBSERVED_OK`).
> **Sin certificar:** **0**. Ninguna celda objetivo quedó fuera, y ninguna de las dos corridas registró
> `page_errors`.

Cada corrida se ejecutó **una sola vez**, y los efectos sobre la matriz los aplicó su script de
certificación (`writes-certify-lote2a-2026-10-16.cjs` y `writes-certify-lote2b-2026-10-16.cjs`), que
**aborta sin escribir** ante cualquier desajuste.

---

## 2. Método

### 2.1 Sesiones acreditadas

Cada actor se acreditó **por correspondencia**: `POST /api/auth/login/` desde la **UI** devolvió **200**
y el `GET /api/auth/context/` devolvió **200** con el **rol primario esperado** activo
(`alias_matched: true`). El lote 2a usó los **ocho** actores; el 2b, los **cinco** con celdas objetivo
(`A1`, `A2`, `A3`, `A5`, `A7`).

| Alias | Rol primario esperado | Login UI | Contexto | 2a | 2b |
|---|---|:---:|:---:|:---:|:---:|
| **A1** | `super_admin` | 200 | 200 | ✔ | ✔ |
| **A2** | `tenant_admin` | 200 | 200 | ✔ | ✔ |
| **A3** | `admin_unidad` | 200 | 200 | ✔ | ✔ |
| **A4** | `comandante_unidad` | 200 | 200 | ✔ | — |
| **A5** | `oficial_tiro` | 200 | 200 | ✔ | ✔ |
| **A6** | `oficial_observador` | 200 | 200 | ✔ | — |
| **A7** | `encargado_almacen` | 200 | 200 | ✔ | ✔ |
| **A8** | `tirador` | 200 | 200 | ✔ | — |

### 2.2 Ejercicio por llamada directa

Cada celda objetivo se ejercita con la **misma ruta y el mismo método que consume la UI**, contra la API
real, con la **cookie de sesión del actor** y su **`X-CSRFToken`** real. **Sin cookies fabricadas**: es la
llamada que la UI emite, no una sustituta.

### 2.3 Marcadores descartables

Cada registro creado por el lote lleva un marcador con la forma **`T11<ALIAS><FAM>-02`** (p. ej.
`T11A3POS-02`), que lo identifica como **descartable** y permite el barrido y la limpieza posterior. La
pre-fase de armas usa su propio token **`T11SECDWPN-02`**. Los marcadores **no** contienen datos
personales: `<ALIAS>` es el alias del actor y `<FAM>` la familia del recurso. Los **RUT** que el arnés
necesitó para emparejar membresías (2a) y para los descartables de identidad (2b) son **sintéticos** y
**no** se persisten en la base: sólo viven en memoria durante la corrida.

---

## 3. Lote 2a — autoservicio 23/23

`NOT_EXERCISED` → `OBSERVED_OK`. **23/23** en **2xx**: `PUT` **200** · `POST` **200**.

| OP | Método + endpoint | Actores certificados | Estado |
|---|---|---|:---:|
| `OP-PRF-002` | `PUT /me/preferences/appearance/` | A1, A2, A3, A4, A5, A6, A7, A8 | 200 |
| `OP-AUT-003` | `POST /auth/select-unit/` | A1, A2, A3, A4, A5, A6, A7, A8 | 200 |
| `OP-AUT-005` | `POST /logout/` | A1, A2, A3, A4, A5, A6, A8 | 200 |

**Totales por familia:** PRF **8** · AUT-003 **8** · AUT-005 **7** = **23**.
**Totales por actor:** A1 **3** · A2 **3** · A3 **3** · A4 **3** · A5 **3** · A6 **3** · A7 **2** · A8 **3** = **23**.
**Totales por verbo:** `PUT` **8** · `POST` **15** = **23**.

- **`OP-PRF-002` — preferencias de apariencia (legacy), 8 celdas.** Cada actor hizo un **`GET`** previo de
  `/api/me/preferences/appearance/` (**200**, con las tres claves del objetivo) y un **`PUT`** con valores
  alternos válidos; la **restauración** al estado objetivo quedó **fuera de las celdas**, en la limpieza
  (§6). Endpoint *legacy*: es el de preferencias de apariencia previo a los ocho ejes `ds_*`, no el
  personalizador de 8 ejes.
- **`OP-AUT-003` — selección de unidad activa, 8 celdas.** `POST /api/auth/select-unit/` con el
  `organization_unit_code` de la **membresía primaria propia** del actor (resuelta desde
  `/api/memberships/` emparejando su RUT **sólo en memoria**). Es un **no-op funcional**: el actor
  selecciona la unidad que ya tiene activa; **200**.
- **`OP-AUT-005` — cierre de sesión, 7 celdas.** `POST /api/logout/` como **última operación del actor**.
  **A7 no tiene celda** en esta fila (su expectativa no es `ALLOW`); por eso el denominador es **7**, no 8.

> 📖 Las celdas de 2a **no** dejan residuo: no crean registros. El único efecto lateral —la preferencia
> de apariencia modificada— se revierte por completo en la limpieza (§6).

---

## 4. Lote 2b — descartables 35/35

`NOT_EXERCISED` → `OBSERVED_OK`. **35/35** en 2xx con el **estado exacto** de cada operación: `POST`
**201** · `PUT` **200** · `PATCH` **200** · `DELETE` **204** (salvo donde la propia operación responde
otro 2xx, anotado abajo).

| OP | Método + endpoint | Actores certificados | Estado |
|---|---|---|:---:|
| `OP-CAR-002` | `POST /consumos-arma/` | A1, A2, A3, A5, A7 | 201 |
| `OP-CAR-004` | `PUT /consumos-arma/{id}/` | A1, A2, A3, A5, A7 | 200 |
| `OP-CAR-005` | `PATCH /consumos-arma/{id}/` | A1, A2, A3, A5, A7 | 200 |
| `OP-CAR-006` | `DELETE /consumos-arma/{id}/` | A1, A2 | 204 |
| `OP-MEM-002` | `POST /memberships/` | A1 | 201 |
| `OP-MEM-004` | `PUT /memberships/{id}/` | A1, A3 | 200 |
| `OP-MEM-005` | `PATCH /memberships/{id}/` | A1, A3 | 200 |
| `OP-MEM-006` | `DELETE /memberships/{id}/` | A1 | 204 |
| `OP-RCT-005` | `PATCH /recintos/{id}/` | A1 | 200 |
| `OP-RCT-007` | `POST /recintos/{id}/agregar-unidad/{unit_code}/` | A1, A3 | 200 |
| `OP-RCT-008` | `DELETE /recintos/{id}/quitar-unidad/{unit_code}/` | A1, A3 | 200 |
| `OP-UNT-004` | `PUT /organization-units/{id}/` | A3 | 200 |
| `OP-UNT-005` | `PATCH /organization-units/{id}/` | A3 | 200 |
| `OP-UNT-006` | `DELETE /organization-units/{id}/` | A3 | 204 |
| `OP-UNT-008` | `POST /organization-units/{id}/eliminar-con-migracion/` | A3, A2 | 200 |
| `OP-POS-007` | `POST /posiciones/{id}/asignar-holder/` | A3 | 201 |
| `OP-POS-008` | `POST /posiciones/{id}/quitar-holder/{assignment_id}/` | A3 | 200 |

**Totales por familia:** CAR **17** · MEM **6** · RCT **5** · UNT **5** · POS **2** = **35**.
**Totales por actor:** A1 **11** · A2 **5** · A3 **13** · A5 **3** · A7 **3** = **35**.
**Totales por verbo:** `POST` **11** · `PUT` **8** · `PATCH` **9** · `DELETE` **7** = **35**.

Notas de familia:

- **CAR (17).** Las cuatro celdas de cada actor siguen la **cadena propia** alta → `PUT` → `PATCH` →
  `DELETE`. La baja (`OP-CAR-006`) sólo tiene celda para **A1** y **A2**; las filas de **A3/A5/A7** se
  limpian por **relevo de A1** (baja de sus `DELETE` fuera de celda), porque la pareja
  `(consumo, arma)` es única por `UniqueConstraint` y la cadena completa de A3/A5/A7 debía convivir sin
  colisión (§5).
- **MEM (6).** `OP-MEM-006` (baja) sólo tiene celda para **A1**; el descartable de A3 se limpia por
  relevo. La membresía de A3 se verificó **visible para A3** antes de la baja.
- **RCT (5).** Relaciones agregar/quitar unidad **sin baja del recinto dentro de las celdas**: la baja del
  recinto descartable `id` 21 va en la limpieza.
- **UNT (5).** Unidad descartable de A3: `PUT`/`PATCH`/`DELETE` (200/200/204) más la **eliminación con
  migración** (`OP-UNT-008`) ejercitada por **A3** y por **A2** (200).
- **POS (2).** Puesto descartable `id` 68 (`T11A3POS-02`) con un *holder* descartable (`id` 55): asignar
  (201) y quitar (200). La **baja del puesto** fue `204` → `GET` **404** (§7).

---

## 5. Pre-fase de siembra de armas

El barrido estricto del lote cubre **8 familias** (polígonos, lecciones, fracciones, armerías, armas,
ejercicios, usuarios, unidades); **no** incluye recintos, membresías, consumos-arma ni puestos. Para que
cada actor de CAR trabajara la pareja `(consumo, arma)` **única** que le tocaba, la corrida 2b necesitó una
**pre-fase**:

1. **Resolución de unidad** (desde A3): unidad compartida y «otra unidad» resueltas — 2a y 3a para las
   cadenas de UNT/RCT.
2. **Resolución del material de siembra:** armería y **calibre existentes** (`GET` **200**); no se crearon
   armerías ni calibres.
3. **Siembra de 2 armas descartables** marcadas **`T11SECDWPN-02`**, por **API real** (`POST`
   **201**): `id` **18** y `id` **19**.
4. **Resolución de parejas `(consumo, arma)`:** con el catálogo previo había **3** parejas disponibles y
   se pedían **5**; las 2 armas sembradas liberaron las **2** restantes. Asignación: `A1`(consumo 1,
   arma 1) · `A2`(1, 2) · `A3`(1, 3) · `A5`(1, 18) · `A7`(1, 19). `pairs_missing_for: []`.

Las **2 armas de la pre-fase** se borraron en la limpieza (§6) y **no** entran en los tokens del barrido
estricto: su residuo se verifica por **`get_after` 404**, no por barrido.

---

## 6. Limpieza y barrido estricto

### 6.1 Lote 2a

La limpieza restauró la preferencia de apariencia de los **ocho** actores (`PUT` **200** × 8) al estado
objetivo leído en el `setup`. Después, barrido **estricto** del token **`T11A|T11RT|T11R2`** sobre las
**8 familias**: **0 coincidencias** (`own_matches: 0`).

### 6.2 Lote 2b

La limpieza del lote dio de baja los descartables y **relevó** por **A1** lo que las celdas no bajaban:

| Recurso | `id` | Operación | Resultado |
|---|:---:|---|:---:|
| consumo-arma A3 | 4 | relevo A1 (`DELETE`) | 204 |
| consumo-arma A5 | 5 | relevo A1 (`DELETE`) | 204 |
| consumo-arma A7 | 6 | relevo A1 (`DELETE`) | 204 |
| membresía descartable A1 | 53 | `DELETE` → `GET` | 204 → 404 |
| membresía descartable A3 | 54 | `DELETE` → `GET` | 204 → 404 |
| *holder* descartable de A3 | 55 | `DELETE` → `GET` | 204 → 404 |
| puesto descartable A3 | 68 | `DELETE` → `GET` | 204 → 404 |
| recinto descartable | 21 | `DELETE` → `GET` | 204 → 404 |
| arma de pre-fase `T11SECDWPN-02` | 18 | `DELETE` → `GET` | 204 → 404 |
| arma de pre-fase `T11SECDWPN-02` | 19 | `DELETE` → `GET` | 204 → 404 |

Los consumos-arma de **A1** (`id` 2) y **A2** (`id` 3) los dio de baja la **propia celda** `OP-CAR-006`.

> 📜 **Barrido estricto del lote 2b:** token **`T11A|T11RT|T11R2`** sobre las **8 familias** →
> **0 coincidencias** (`own_matches: 0`). Las familias **fuera** del barrido —recintos, membresías,
> consumos-arma y puestos— quedaron cubiertas por los **`get_after` 404** de la limpieza (§6.2, tabla).
> Residuo neto del lote: **0**.

### 6.3 Regla dura, verificada contra evidencia

Ambos scripts de certificación **abortan** (`BLOCKED`, sin escribir) ante cualquier desajuste:
`batch.schema` distinto de `frontend-t11-writes-lote2a/v1` / `frontend-t11-writes-lote2b/v1`, paso
duplicado, `op` inexistente, expectativa no-`ALLOW`, celda a certificar que no está `NOT_EXERCISED`,
`MATCH_2XX` sin 2xx, o recuento posterior distinto del esperado. En las dos corridas la matriz de entrada
**cuadró** (2a: `720/7/593`; 2b: `743/7/570`) y la **comparación estructural** contra la copia de reversión
confirmó que sólo cambiaron los estados certificados, `cell_state_counts`, las evidencias de fila y
`observations`.

---

## 7. Dos hechos consignados sin inflarlos

### 7.1 La trampa §11 **no** disparó

El puesto descartable de A3 (`id` 68) se dio de baja con **`DELETE` 204 → `GET` 404**: **no** respondió el
`500` por `ProtectedError` que registra la deuda de backend
([`docs/bugs/backend-debt.md`](../../../../bugs/backend-debt.md) §11 — «Baja de puesto
(`DELETE /api/posiciones/{id}/`): `500` por `ProtectedError` y puesto indeleble», y §11.1, «El retiro del
holder no restaura la borrabilidad»). El caso **se consigna como dato observado**: sobre este puesto
descartable la baja fue **borrable**, sin activar la trampa. **No** se fuerza ninguna conclusión sobre la
deuda: el `500` de §11 sigue siendo un hecho observado por su propia vía, y este `204` es otro hecho, en
otra fila. El lote **no** modifica la deuda ni la interpreta.

### 7.2 La sospecha estática de un `403` para `CAR-002` de A3/A5 **no se confirmó**

La matriz actor→permiso predice `EXPECTED_ALLOW` para `OP-CAR-002` en **A3** y **A5**
([`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md)
§3: `POST /consumos-arma/` → `A A A D A D A D`). Durante la preparación del lote existía una **sospecha
estática** —lectura de código, **sin runtime**— de un posible **`403`** para esas dos celdas. La corrida
**desmintió** la sospecha: ambas respondieron **`201`**. La expectativa **C-4** quedó validada en runtime
para esas celdas. Se consigna **el hecho**, sin inflarlo: la sospecha era estática y no se elevó nunca a
hallazgo.

---

## 8. Certificación y conteos

### 8.1 Conteos

| Estado | Antes (2a) | Después 2a | Después 2b = final | Δ total |
|---|---:|---:|---:|---:|
| `OBSERVED_OK` | 720 | 743 | **778** | +58 |
| `PARTIAL` | 7 | 7 | **7** | 0 |
| `NOT_EXERCISED` | 593 | 570 | **535** | −58 |
| Total | 1320 | 1320 | **1320** | — |

**2a:** `720/7/593 → 743/7/570` (**23** flips). **2b:** `743/7/570 → 778/7/535` (**35** flips). **58**
celdas cambiaron en total, todas de `NOT_EXERCISED` a `OBSERVED_OK`. Recuento obtenido recorriendo las
**165 filas × 8 actores**, **no** por agregación de conteos declarados; coincide con `cell_state_counts`
en cada paso.

### 8.2 Evidencia de fila

Las filas con al menos una celda certificada reciben al final de su campo `evidence`, **sin** borrar el
texto previo, el anexo:

> ` Actualización 2026-10-16: fichas de escritura del lote lote2a (preferencias de apariencia, selección de unidad activa y cierre de sesión; llamada directa con sesión real) — PUT/POST 2xx observados en <actores>; celdas certificadas (NOT_EXERCISED → OBSERVED_OK).`

> ` Actualización 2026-10-16: fichas de escritura del lote lote2b (consumos-arma, membresías, recintos, unidades y puestos/holders; llamada directa con sesión real) — POST/PUT/PATCH/DELETE 2xx observados en <actores>; celdas certificadas (NOT_EXERCISED → OBSERVED_OK).`

**2a** anexó evidencia en **3** filas: `OP-PRF-002`, `OP-AUT-003`, `OP-AUT-005`; la pasada queda
registrada en `observations.writes_batch_lote2a_2026_10_16`. **2b** anexó evidencia en **17** filas:
`OP-CAR-002/004/005/006`, `OP-MEM-002/004/005/006`, `OP-RCT-005/007/008`, `OP-UNT-004/005/006/008` y
`OP-POS-007/008`; la pasada queda registrada en `observations.writes_batch_lote2b_2026_10_16`.

### 8.3 Contraste C-4

El lote **valida C-4 sobre las celdas de escritura**:
[`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md)
(§1–§4) es la fuente de `expected_by_actor` (`expected_source: C-4`). Las **58** celdas esperadas
`ALLOW`/`SCOPED` respondieron **2xx**: **0 discrepancias**. La validación incluye el punto sospechado de
`OP-CAR-002` (§7.2), que resultó `201`.

- **Distribución del lote:** 58 `MATCH_2XX` · 0 `not_certified`.
- **Desajustes de autorización:** **0**.
- **Respuestas no-2xx:** **0**. **`page_errors`:** **0**.

---

## 9. Límites

- **La escritura certificada acredita la concesión de la acción, no la corrección del efecto.** Un `2xx`
  afirma que el permiso concedió la operación; **no** valida que el estado resultante del recurso sea el
  correcto, ni cubre las condiciones de §4.3/§4.4 de C-4 (conjuntos visibles).
- **El `NOT_VERIFIED` persiste.** `status_global` sigue **`NOT_VERIFIED`** y `global_conclusion` sigue
  **`NO_CUMPLIDO`**, sin cambios; `expected_by_actor` intacto.
- **Alcance acotado a las 58 celdas.** Ninguna celda fuera de las 58 certificadas se tocó (verificado por
  comparación estructural contra la copia de reversión).
- **Barrido con familias acotadas.** El barrido estricto cubre 8 familias; los residuos de recintos,
  membresías, consumos-arma y puestos se verifican por `get_after` 404 de la limpieza (§6.2), no por
  barrido de token.
- **Scripts fuera de `evidence`.** Los scripts de certificación **no** se copian a este directorio; viven
  en `.cache`. El documento de evidencia sí se copia, y los JSON fuente del lote tienen **copia durable**
  (§10).
- **Sin secretos ni datos personales.** Los descartables usaron identificadores sintéticos; el documento
  cita **ids numéricos** y **marcadores**, no RUT, correos ni nombres. Los RUT sintéticos de los JSON
  fuente **no** se reproducen aquí.
- **Sin backend, base de datos ni navegador.** Sólo llamadas a la API real ya en marcha y reescritura del
  JSON de la matriz; **sin** `git add`/`commit`.

> 🕯️ Este documento **no** afirma completitud del producto ni emite veredicto de aceptación.

---

## 10. Fuentes

| # | Fuente | Aporta |
|---|---|---|
| 1 | [`lote2a-writes-2026-10-16.json`](./lote2a-writes-2026-10-16.json) | **Copia durable** de la corrida 2a: schema, sesiones acreditadas, 23 pasos con verbo y estado, `setup`, limpieza (8 restauraciones) y barrido estricto (`sha256 ea22a662…`) |
| 2 | [`lote2b-writes-2026-10-16.json`](./lote2b-writes-2026-10-16.json) | **Copia durable** de la corrida 2b: schema, sesiones, pre-fase de siembra, 35 pasos con verbo y estado, limpieza y barrido estricto (`sha256 2ad4035a…`) |
| 3 | [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json) | Las 58 celdas objetivo, su `expected_by_actor` (C-4) y los efectos del lote (`observations.writes_batch_lote2a_2026_10_16` · `observations.writes_batch_lote2b_2026_10_16`) |
| 4 | [`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md) | Origen de `expected_by_actor` (C-4, §1–§4) |
| 5 | [`docs/bugs/backend-debt.md`](../../../../bugs/backend-debt.md) | Deuda §11 (`ProtectedError` en la baja de puesto) — **no** disparada en este lote (§7.1) |
| 6 | `.cache/frontend-acceptance/2026-10-16/writes-certify-lote2a-2026-10-16.cjs` · `writes-certify-lote2b-2026-10-16.cjs` | Scripts ejecutados (no copiados a `evidence`): clasificación, flips, anexos y comparación estructural |

Copias de reversión previas a cada corrida:
`.cache/frontend-acceptance/2026-10-16/acceptance-matrix.before-writes-lote2a.json` (`sha256 124a1739…`,
idéntico al pre-estado) y `.cache/frontend-acceptance/2026-10-16/acceptance-matrix.before-writes-lote2b.json`.
Plan de cierre: [`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md).
