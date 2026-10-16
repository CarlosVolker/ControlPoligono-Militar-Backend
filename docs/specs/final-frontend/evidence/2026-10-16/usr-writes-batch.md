---
actualizado: 2026-10-16
---

# Lote de fichas de escritura USR (2026-10-16)

> 🕯️ **Qué es y qué no.** Registro documental del **lote de fichas de escritura** del dominio de
> identidad (`OP-USR-*`) ejecutado el **2026-10-16** sobre la matriz de aceptación
> [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json): **22 celdas**
> `POST`/`PUT`/`PATCH` que seguían **`NOT_EXERCISED`** con expectativa `EXPECTED_ALLOW` /
> `EXPECTED_ALLOW_SCOPED` (poblada desde **C-4**). A diferencia del lote de tiro+armerías, éste
> **no** cerró en una sola pasada: hicieron falta **tres corridas** —la corrida 1 y dos reintentos—
> porque dos **defectos de servidor** y un **defecto del arnés** bloquearon celdas. Resultado
> certificable: **19/22**. Este documento **no** emite veredicto de aceptación, **no** cambia
> `status_global` ni `global_conclusion` y **no** propone ni aplica arreglos.

## Índice

1. [Qué es](#1-qué-es) · 2. [Método](#2-método) · 3. [Las tres corridas](#3-las-tres-corridas) ·
4. [Resultado 19/22](#4-resultado-1922) · 5. [Bloqueos declarados y trazas de servidor](#5-bloqueos-declarados-y-trazas-de-servidor) ·
6. [Limpieza y barrido estricto](#6-limpieza-y-barrido-estricto) · 7. [Certificación y conteos](#7-certificación-y-conteos) ·
8. [Límites](#8-límites) · 9. [Fuentes](#9-fuentes)

---

## 1. Qué es

La matriz de aceptación tiene **1320 celdas** (165 filas `OP-*` × 8 actores). El **lote USR** ejercita
las fichas de **escritura** del dominio de identidad que seguían `NOT_EXERCISED` pese a tener
expectativa `ALLOW`/`SCOPED` de C-4: **alta formal de usuario**, **asignaciones** (principal y
adicionales) y **credenciales** (cambio y reseteo de contraseña).

> 📜 **Denominador del lote:** **22 celdas** de escritura `NOT_EXERCISED` esperadas `ALLOW`/`SCOPED`,
> repartidas en tres familias: **alta formal** (`OP-USR-002`, ×3 actores), **asignaciones**
> (`OP-USR-007/008/009/010/011`, ×A1/A3) y **credenciales** (`OP-USR-013/014/016`, ×A1/A2/A3).
> **Certificadas:** **19** (`NOT_EXERCISED` → `OBSERVED_OK`). **Bloqueadas:** **3** (`OP-USR-016`
> A1/A2/A3, ver §5).

Las tres corridas se ejecutaron sobre **usuarios descartables**; los efectos sobre la matriz los
aplicaron, en dos pasos, los scripts de certificación
`writes-certify-usr-2026-10-16.cjs` y `writes-certify-usr-retry-2026-10-16.cjs`, que **abortan sin
escribir** ante cualquier desajuste.

> 🕯️ **El defecto del arnés se declara, no se esconde.** El reintento 1 dejó la cadena de A3 en **404
> en todos sus pasos** por un **defecto propio del arnés** —no del backend—: la unidad destino se
> resolvió desde el listado del alias **A1**, no desde el alias destino **A3**, de modo que el
> descartable quedaba **invisible para A3**. Se corrigió en el reintento 2 (§3.2 y §3.3).

---

## 2. Método

### 2.1 Sesiones acreditadas

Cada actor se acreditó **por correspondencia**: login desde la **UI** (**200**) y
`GET /api/auth/context/` (**200**) con el **rol primario esperado** activo (`alias_matched: true`).
Cuatro actores participaron del lote a lo largo de las tres corridas: **A1** (`super_admin`), **A2**
(`tenant_admin`), **A3** (`admin_unidad`) y **A5** (`oficial_tiro`).

| Alias | Rol primario esperado | Corrida 1 | Reintento 1 | Reintento 2 |
|---|---|:---:|:---:|:---:|
| **A1** | `super_admin` | ✔ | ✔ | ✔ |
| **A2** | `tenant_admin` | ✔ | — | — |
| **A3** | `admin_unidad` | ✔ | ✔ | ✔ |
| **A5** | `oficial_tiro` | ✔ | — | — |

### 2.2 Ejercicio por llamada directa

Cada celda objetivo se ejercita con la **misma ruta y el mismo método que consume la UI**, contra la API
real, con la **cookie de sesión del actor** y su **`X-CSRFToken`** real. **Sin cookies fabricadas**: es la
llamada que la UI emite, no una sustituta.

### 2.3 Marcadores descartables

Cada usuario creado por el lote lleva un marcador con la forma **`T11<ALIAS>USR-01`** (p. ej.
`T11A1USR-01`) y **RUT sintético** válido que **no se persiste**. Los reintentos usan marcadores propios
(**`T11RT`**, **`T11R2`**). Las **credenciales se ejercitaron únicamente sobre el descartable**, nunca
sobre un alias: el camino «sobre sí mismo» de `OP-USR-013` para A4–A7 quedó **parked por diseño**
(tesorería de credenciales de los alias, declarado en el registro del lote).

---

## 3. Las tres corridas

### 3.1 Corrida 1 (22 pasos → 10 en 2xx)

Fuente: [`usr-writes-2026-10-16.json`](./usr-writes-2026-10-16.json) (schema `frontend-t11-writes-usr/v1`).

- **Sesiones:** A1, A2, A3, A5.
- **Certificado:** **10** celdas (`OP-USR-002` A1/A3/A5; `OP-USR-007/009/010` A1;
  `OP-USR-013/014` A1 y A2).
- **Hallazgos de servidor con traza** (ver §5):
  - `OP-USR-008` y `OP-USR-011` de **A1** → **500** por `_ensure_tirador_assignment` →
    `MultipleObjectsReturned`.
  - `OP-USR-016` de **A1** y **A2** → **500** por `NameError: name 'AccessAttempt' is not defined`.
- **Cadena de A3:** respondió **404 en todos sus pasos** (naturaleza de alcance del descartable en ese
  momento; **no** se afirma causa precisa desde esta corrida). `OP-USR-011` de A3 quedó **`NO_RESPONSE`**
  (sin `assignment_id`, porque `OP-USR-010` no respondió 2xx).
- **Limpieza:** 3 usuarios (`id` 45/46/47) por **`DELETE` 204 → `GET` 404**; **barrido estricto del token
  `T11A` en 8 familias → 0 coincidencias**.

### 3.2 Reintento 1 (9 pasos → 2 en 2xx)

Fuente: [`usr-writes-retry-2026-10-16.json`](./usr-writes-retry-2026-10-16.json) (schema
`frontend-t11-writes-usr-retry/v1`).

- **Sesiones:** A1, A3. **Descartables frescos** (`T11RT`), cada celda como **PRIMERA operación de su tipo**.
- **Certificado:** **2** celdas — `OP-USR-008` y `OP-USR-011` de **A1**, recuperadas en **2xx**: la
  operación como primera de su tipo **no acumula** filas tirador, de modo que el defecto
  `MultipleObjectsReturned` (§5.1) **no dispara**.
- **Cadena de A3 — defecto del arnés (declarado):** `OP-USR-007/008/009/010/013/014` → **404** y
  `OP-USR-011` → **`NO_RESPONSE`**. Causa: el arnés resolvió la **unidad destino desde el listado del
  alias A1**, no desde el alias destino **A3**; con una unidad ajena a su alcance, el descartable
  resultaba **invisible para A3** (`get_object()` → 404). **Es defecto del arnés, no del backend.**
  `OP-USR-016` A1/A2/A3 quedó **excluida** por el `NameError` (declarado en el campo `excluded` del registro).
- **Limpieza:** 3 usuarios (`id` 48/49/50) por **`DELETE` 204 → `GET` 404**; **barrido estricto del token
  `T11A|T11RT` → 0 coincidencias**.

### 3.3 Reintento 2 (7 pasos → 7 en 2xx) — corrección del arnés

Fuente: [`usr-writes-retry2-2026-10-16.json`](./usr-writes-retry2-2026-10-16.json) (schema
`frontend-t11-writes-usr-retry2/v1`).

- **Sesiones:** A1, A3. **Unidad resuelta desde A3** (`unit_resolved_from: "A3"`), corrigiendo el defecto
  de §3.2. Descartables frescos (`T11R2`); setup de visibilidad con **rol no-tirador** en la unidad
  compartida de A3; cada celda como **PRIMERA operación de su tipo**.
- **Certificado:** **7/7** celdas de la cadena de A3 en **2xx** (`OP-USR-007/008/009/010/011/013/014`),
  con el estado exacto de cada verbo (`PUT` **200** · `PATCH` **200** · `POST` 200/**201**).
- **Limpieza:** 2 usuarios (`id` 51/52) por **`DELETE` 204 → `GET` 404**; **barrido estricto del token
  `T11A|T11RT|T11R2` → 0 coincidencias**.

> 📖 **Lectura de las tres corridas.** La corrida 1 ejercita A1/A2/A5 y deja la cadena de A3 sin
> resolver; el reintento 1 recupera las dos celdas de A1 que el defecto §5.1 había tumbado y **falla la
> cadena de A3 por error del arnés**; el reintento 2 **corrige el arnés** (unidad resuelta desde el
> alias destino) y cierra la cadena de A3 completa. En total, **10 + 9 = 19** celdas distintas
> certificadas; el script del reintento registra los intentos fallidos previos de A3 en `superseded`
> (**7**), **sin borrar la traza**.

---

## 4. Resultado 19/22

`NOT_EXERCISED` → `OBSERVED_OK`. **19/22** con el **estado exacto** de cada operación.

### 4.1 Alta formal — `OP-USR-002` `POST /usuarios/` (3/3)

| Actor | Estado | Corrida |
|---|:---:|---|
| A1 | **201** | corrida 1 |
| A3 | **201** | corrida 1 |
| A5 | **201** | corrida 1 |

### 4.2 Asignaciones (10/10)

| OP | Método + endpoint | A1 | A3 |
|---|---|:---:|:---:|
| `OP-USR-007` | `PUT /usuarios/{id}/asignacion-principal/` | **200** (corrida 1) | **200** (reintento 2) |
| `OP-USR-008` | `PATCH /usuarios/{id}/asignacion-principal/` | **200** (reintento 1) | **200** (reintento 2) |
| `OP-USR-009` | `POST /usuarios/{id}/desactivar-asignacion-principal/` | **200** (corrida 1) | **200** (reintento 2) |
| `OP-USR-010` | `POST /usuarios/{id}/agregar-asignacion/` | **201** (corrida 1) | **201** (reintento 2) |
| `OP-USR-011` | `POST /usuarios/{id}/quitar-asignacion/{assignment_id}/` | **200** (reintento 1) | **200** (reintento 2) |

### 4.3 Credenciales (6/9; 3 bloqueadas)

| OP | Método + endpoint | A1 | A2 | A3 |
|---|---|:---:|:---:|:---:|
| `OP-USR-013` | `POST /usuarios/{id}/cambiar-contrasena/` | **200** (corrida 1) | **200** (corrida 1) | **200** (reintento 2) |
| `OP-USR-014` | `POST /usuarios/{id}/resetear-contrasena/` | **200** (corrida 1) | **200** (corrida 1) | **200** (reintento 2) |
| `OP-USR-016` | `POST /usuarios/{id}/desbloquear/` | ⛔ **500** | ⛔ **500** | ⛔ **404** (sin reintento) |

**Totales:** alta formal **3** · asignaciones **10** · credenciales **6** = **19** certificadas.
**Por corrida:** corrida 1 **10** · reintento 1 **2** · reintento 2 **7**. **Certificadas por actor:**
A1 **8** · A3 **7** · A2 **2** · A5 **1**.

> 📖 Las celdas ya observadas de estas filas (p. ej. `OP-USR-002` A2, `OP-USR-007/008/009/010/011` A2)
> **no** se volvieron a certificar. El script exige, celda por celda, que la expectativa sea
> `ALLOW`/`SCOPED` y que el estado previo sea `NOT_EXERCISED`.

---

## 5. Bloqueos declarados y trazas de servidor

Quedan **3 celdas bloqueadas**, todas de `OP-USR-016` (`POST /usuarios/{id}/desbloquear/`), declaradas en
el `not_certified` del registro de la corrida 1 y **en la deuda** (§7.3).

### 5.1 `_ensure_tirador_assignment` → `MultipleObjectsReturned` (disparó en la corrida 1)

- **Celda observada:** `OP-USR-008` A1 (`PATCH`) y `OP-USR-011` A1 (`POST`) → **500**.
- **Traza:** `_ensure_tirador_assignment` → `MultipleObjectsReturned`.
- **Localización:** `Assignment.objects.get_or_create(account=account, position=position, …)` en
  [`apipoligono/views.py:118`](../../../../../apipoligono/views.py); call sites en
  [`apipoligono/views.py:391`](../../../../../apipoligono/views.py) (`asignacion-principal`, `PUT`) y
  [`apipoligono/views.py:530`](../../../../../apipoligono/views.py) (`quitar-asignacion`).
- **Disparador:** la **segunda** creación de fila tirador para la **misma cuenta + posición** acumula
  filas y `get_or_create(account, position)` revienta. Se **reproduce** con `PUT` → `PATCH` de
  asignación principal (el `PUT` crea, el `PATCH` vuelve a pasar por el helper).
- **Por qué el reintento la recupera:** en descartables frescos la operación es la **primera de su tipo**
  y no acumula; por eso `OP-USR-008`/`OP-USR-011` de A1 responden **2xx** en el reintento 1.

### 5.2 `desbloquear` → `NameError: name 'AccessAttempt' is not defined` (persistente)

- **Celdas bloqueadas:** `OP-USR-016` **A1** y **A2** → **500** (observado); **A3** quedó **404** en la
  corrida 1 y **no se reintentó** (excluida por el mismo defecto, `excluded` del reintento 1).
- **Traza:** `NameError: name 'AccessAttempt' is not defined` en
  [`apipoligono/views.py:715`](../../../../../apipoligono/views.py) (método `desbloquear`).
- **Causa localizada:** el import `from axes.models import AccessAttempt` **existe** en
  [`apipoligono/views.py:684`](../../../../../apipoligono/views.py) (método `estado_bloqueo`) pero **falta**
  en `desbloquear`, que usa el nombre en `views.py:715`.
- **Efecto:** `desbloquear` no puede responder a una cuenta con intentos fallidos registrados: el
  defecto **no** es de autorización (el `500` llega con el permiso `update_users` ya concedido).

> 🕯️ **Consignado, no corregido.** Ambas trazas se registran en
> [`backend-debt.md`](../../../../bugs/backend-debt.md) **§14** y **§15**, con su localización y sus límites,
> **sin** fix propuesto ni aplicado. No se tocó código.

---

## 6. Limpieza y barrido estricto

Todas las bajas fueron **`DELETE` 204** seguidas de **`GET` 404** (el `id` ya no responde), y el barrido
estricto posterior coincidió en **0** en las tres corridas.

| Corrida | Usuarios limpiados (`id`) | `DELETE` | `GET` tras la baja | Barrido estricto |
|---|---|---|---|---|
| corrida 1 | 45, 46, 47 | 204 | 404 | token `T11A` → **0** |
| reintento 1 | 48, 49, 50 | 204 | 404 | token `T11A\|T11RT` → **0** |
| reintento 2 | 51, 52 | 204 | 404 | token `T11A\|T11RT\|T11R2` → **0** |

El barrido cubre las **8 familias** (polígonos, lecciones, fracciones, armerías, armas, ejercicios,
usuarios, unidades). En la corrida 1, la baja de los descartables de A3/A5 se hizo por **relevo de A1**
(bypass `super_admin`).

> 📜 **Residuo conocido declarado (no limpiado).** La baja de cuenta **no** elimina la fila
> `identity.Person` —patrón ya registrado en [`backend-debt.md`](../../../../bugs/backend-debt.md) §10—. El
> residuo se **declara** en el `known_residue` del registro del lote; **no** se limpia.

---

## 7. Certificación y conteos

### 7.1 Conteos

| Estado | Antes (corte previo) | Tras corrida 1 | Tras reintento | Δ total |
|---|---:|---:|---:|---:|
| `OBSERVED_OK` | 701 | 711 | **720** | +19 |
| `PARTIAL` | 7 | 7 | **7** | 0 |
| `NOT_EXERCISED` | 612 | 602 | **593** | −19 |
| Total | 1320 | 1320 | **1320** | — |

La corrida 1 movió **10** celdas (701→711 / 612→602, backup `acceptance-matrix.before-writes-usr.json`);
el reintento movió **9** (711→720 / 602→593, backup `acceptance-matrix.before-writes-usr-retry.json`).
Recuento obtenido recorriendo las **165 filas × 8 actores**, **no** por agregación de conteos declarados;
coincide con `cell_state_counts`.

### 7.2 Evidencia de fila

Las filas con al menos una celda certificada reciben al final de su campo `evidence`, **sin** borrar el
texto previo, un anexo `Actualización 2026-10-16: fichas de escritura del lote USR …`. La corrida 1 anexó
`OP-USR-002/007/009/010/013/014`; el reintento anexó `OP-USR-007/008/009/010/011/013/014`. Las pasadas
quedan registradas en `observations.writes_batch_usr_2026_10_16` y
`observations.writes_batch_usr_retry_2026_10_16`.

### 7.3 Contraste C-4

El lote **valida C-4 sobre las celdas de escritura USR**:
[`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md)
(§1–§4) es la fuente de `expected_by_actor` (`expected_source: C-4`). Las **19** celdas esperadas
`ALLOW`/`SCOPED` que se ejercitaron respondieron **2xx**, exactamente lo que C-4 predice: **0 discrepancias**.
Las **3** bloqueadas **no** son discrepancias de autorización: el permiso concedió la operación y falló el
endpoint por un defecto de servidor (§5).

- **Distribución del lote:** 19 `MATCH_2XX` · 3 bloqueadas · 7 `superseded` (intentos fallidos previos de A3).
- **Desajustes de autorización:** **0**.
- **Respuestas no-2xx de celdas `ALLOW` certificables:** **3** (`OP-USR-016` A1/A2/A3), todas por defecto de servidor documentado.

---

## 8. Límites

- **La escritura certificada acredita la concesión de la acción, no la corrección del efecto.** Un `2xx`
  sobre una escritura afirma que el permiso concedió la operación sobre el descartable; **no** valida el
  estado resultante del recurso ni cubre las condiciones de §4.3/§4.4 de C-4 (conjuntos visibles).
- **El `NOT_VERIFIED` persiste.** `status_global` sigue **`NOT_VERIFIED`** y `global_conclusion` sigue
  **`NO_CUMPLIDO`**, sin cambios; `expected_by_actor` intacto.
- **Alcance acotado a las 22 celdas.** Ninguna celda fuera del lote se tocó (verificado por comparación
  estructural contra la copia de reversión de cada paso).
- **Dos defectos de servidor y un defecto del arnés.** Los defectos de servidor (§5) son **hallazgos de
  backend** documentados en deuda; el defecto del arnés (§3.2) es **del propio lote** y quedó **corregido**
  en el reintento 2, con su traza conservada en `superseded`.
- **Scripts fuera de `evidence`.** Los scripts de certificación **no** se copian a este directorio; viven
  en `.cache`. Los documentos y los JSON del lote sí tienen copia durable (§9).
- **Sin secretos ni datos personales.** Los descartables usaron **RUT sintéticos que no se persisten** y
  marcadores; el documento cita **ids numéricos**, **rutas** y **marcadores**, no RUT, correos ni nombres.
- **Sin backend nuevo, base de datos ni navegador.** Sólo llamadas a la API real ya en marcha y
  reescritura del JSON de la matriz; **sin** `git add`/`commit`.

> 🕯️ Este documento **no** afirma completitud del producto ni emite veredicto de aceptación.

---

## 9. Fuentes

| # | Fuente | Aporta |
|---|---|---|
| 1 | [`usr-writes-2026-10-16.json`](./usr-writes-2026-10-16.json) | **Copia durable** de la corrida 1: schema, sesiones acreditadas, 22 pasos con verbo y estado, limpieza y barrido (`sha256 7b878043…`) |
| 2 | [`usr-writes-retry-2026-10-16.json`](./usr-writes-retry-2026-10-16.json) | **Copia durable** del reintento 1: USR-008/011 A1 en 2xx y la cadena de A3 en 404 por defecto del arnés (`sha256 d4fc7ee2…`) |
| 3 | [`usr-writes-retry2-2026-10-16.json`](./usr-writes-retry2-2026-10-16.json) | **Copia durable** del reintento 2: cadena de A3 completa 7/7, unidad resuelta desde A3 (`sha256 c1f61251…`) |
| 4 | [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json) | Las 22 celdas objetivo, su `expected_by_actor` (C-4) y los efectos del lote (`observations.writes_batch_usr_2026_10_16`, `…_retry_…`) |
| 5 | [`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md) | Origen de `expected_by_actor` (C-4, §1–§4) |
| 6 | [`backend-debt.md`](../../../../bugs/backend-debt.md) §14 · §15 | Trazas de servidor del lote: `_ensure_tirador_assignment` → `MultipleObjectsReturned` y `desbloquear` → `NameError: AccessAttempt` |
| 7 | `.cache/frontend-acceptance/2026-10-16/writes-certify-usr-2026-10-16.cjs` · `writes-certify-usr-retry-2026-10-16.cjs` | Scripts de certificación (no copiados a `evidence`): 10 y 9 flips, evidencia por fila, comparación estructural |
| 8 | `.cache/frontend-acceptance/2026-10-16/usr-writes-2026-10-16.run.cjs` · `usr-writes-retry-2026-10-16.run.cjs` · `usr-writes-retry2-2026-10-16.run.cjs` | Runners de las tres corridas (viven en `.cache`) |

Copias de reversión previas a cada paso:
`.cache/frontend-acceptance/2026-10-16/acceptance-matrix.before-writes-usr.json` (701/7/612, idéntico al
pre-estado) y `.cache/frontend-acceptance/2026-10-16/acceptance-matrix.before-writes-usr-retry.json`
(711/7/602, idéntico al pre-estado del reintento). Plan de cierre:
[`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md).
