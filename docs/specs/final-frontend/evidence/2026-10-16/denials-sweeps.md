---
actualizado: 2026-10-16
---

# Barrido de denegaciones de escritura no-RBAC (sweep 1 + sweep 2) — 329 certificadas (2026-10-16)

> 🕯️ **Qué es y qué no.** Registro documental del **barrido de denegaciones de escritura** ejecutado el
> **2026-10-16** sobre la matriz de aceptación
> [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json): las celdas
> `POST`/`PUT`/`PATCH`/`DELETE` que seguían **`NOT_EXERCISED`** con expectativa **`EXPECTED_DENY`** (poblada
> desde **C-4**), **excluidas** las familias RBAC. Cada celda se probó con la **sesión real acreditada** de
> cada actor; **solo el `403` exacto certificó**. En **dos barridos** — **sweep 1** (identidad/organización)
> y **sweep 2** (tiro/almacén/resultados) — se recorrieron **341 objetivos** no-RBAC: **329 certificadas**
> (`NOT_EXERCISED` → `OBSERVED_OK`) y **12 declaradas no probadas**. Este documento **no** emite veredicto de
> aceptación, **no** cambia `status_global` ni `global_conclusion` y **no** propone ni aplica arreglos.

## Índice

1. [Qué es](#1-qué-es) · 2. [Método](#2-método) · 3. [Sweep 1 — identidad/organización 191/191](#3-sweep-1--identidadorganización-191191) ·
4. [Sweep 2 — tiro/almacén/resultados 138/150](#4-sweep-2--tiroalmacénresultados-138150) ·
5. [Las 12 celdas declaradas no probadas](#5-las-12-celdas-declaradas-no-probadas) · 6. [Incidente §11 y su refinamiento](#6-incidente-11-y-su-refinamiento) ·
7. [Limpiezas y barridos estrictos](#7-limpiezas-y-barridos-estrictos) · 8. [Certificación y conteos](#8-certificación-y-conteos) ·
9. [Límites](#9-límites) · 10. [Fuentes](#10-fuentes)

---

## 1. Qué es

La matriz de aceptación tiene **1320 celdas** (165 filas `OP-*` × 8 actores). Tras los lotes de **escritura**
del mismo día ([`tiro-writes-batch.md`](./tiro-writes-batch.md), [`usr-writes-batch.md`](./usr-writes-batch.md)
y [`lote2-writes-batch.md`](./lote2-writes-batch.md), que certificaron las celdas con expectativa
`ALLOW`/`SCOPED`), quedaba el **carril de denegaciones** de escritura: celdas `POST`/`PUT`/`PATCH`/`DELETE`
todavía `NOT_EXERCISED` cuya expectativa, derivada en **C-4**
([`coverage/actor-permission-matrix-2026-10-15.md`](../coverage/actor-permission-matrix-2026-10-15.md) §1–§4),
es **`EXPECTED_DENY`**. El barrido de denegaciones las ejercita y **solo certifica el `403` exacto**.

> 📜 **Alcance.** Solo se barren las celdas `EXPECTED_DENY` **no-RBAC**; quedan **fuera** las familias de
> autz RBAC (`OP-OVR-*`, `OP-PPR-*`, `OP-RPR-*`, `OP-ROL-*`), cuyo gate no se traduce a un `permission_code`
> (§4 de C-4). Ninguna celda con expectativa `ALLOW`/`SCOPED` entra en este barrido: éstas ya se cubrieron en
> los lotes de escritura del día.

> 📖 **Denominador y resultado.** **341 objetivos** no-RBAC (**191** de sweep 1 + **150** de sweep 2) →
> **329 certificadas** por `403` exacto (**191** + **138**) y **12 declaradas no probadas**. **0 desajustes**
> (ningún `2xx` donde se esperaba denegación) y **0 discrepancias** contra C-4 en las celdas ejercitadas.

---

## 2. Método

### 2.1 Sesiones acreditadas

Cada actor se acreditó **por correspondencia**: `POST /api/auth/login/` desde la **UI** devolvió **200** y el
`GET /api/auth/context/` devolvió **200** con el **rol primario esperado** activo. El **token CSRF** se leyó
de la cookie `csrftoken` de cada contexto y se envió como **`X-CSRFToken`** real. No hay cookies fabricadas:
es la misma llamada que emite la UI.

### 2.2 Forma del intento

| Caso | Forma del intento |
|---|---|
| `POST` de colección | Intento **directo** (la creación en sí misma es la celda denegada) |
| `PUT` / `PATCH` / `DELETE` y `POST` con `{id}` | Intento sobre **descartables de A1** con marcador `T11<ALIAS><FAM>D-02`, en la **misma familia y unidad** |

**Objetivos delicados protegidos:** `CAL` usa un **calibre descartable**; `RES` usa una **cadena descartable
propia** (polígono → lección → fracción → resultado) con usuario descartable; `CAR` usa una **pre-siembra de 3
armas** `T11SECDWPN-02` (borradas en la limpieza) cuando faltaban parejas `(consumo, arma)`. **Nunca** se
apunta a contenido certificado.

### 2.3 Regla dura de certificación

| Veredicto | Condición | Efecto |
|---|---|---|
| `MATCH_DENY` | **`403` exacto**, expectativa `EXPECTED_DENY`, celda `NOT_EXERCISED` | **Certifica** (`NOT_EXERCISED` → `OBSERVED_OK`) |
| `MISMATCH_ALLOW` | respuesta `2xx` donde se esperaba denegación | **No certifica**; la fila creada/mutada entra a la limpieza |
| `OTHER` | `404`/`401`/`500` | **No certifica** |
| `NO_RESPONSE` | celda **no probada** (sin objetivo posible) | **No certifica**; queda declarada |

Los efectos sobre la matriz los aplicaron los scripts de certificación
(`writes-certify-denials1-2026-10-16.cjs` y `writes-certify-denials2-2026-10-16.cjs`), que **abortan sin
escribir** ante cualquier desajuste (schema, recuentos de entrada/salida, expectativa no-deny, `MATCH_DENY`
sin `403`, duplicados, cobertura, o comparación estructural contra la copia previa). Los flips se derivan
**exclusivamente** del JSON del barrido; la matriz solo valida.

---

## 3. Sweep 1 — identidad/organización 191/191

Familias: **`USR` · `RCT` · `POS` · `CAL` · `UNT` · `MEM`**. Resultado **191/191** `MATCH_DENY` en `403`
exacto; **0** `MISMATCH_ALLOW`, **0** `OTHER`, **0** `NO_RESPONSE`. Cobertura del barrido **191/191**
(`coverage_ok: true`), **0** `page_errors`. Marcadores descartables planificados: **32**.

| Familia | Objetivos | Certificadas |
|---|:---:|:---:|
| `USR` | 58 | 58 |
| `RCT` | 30 | 30 |
| `POS` | 30 | 30 |
| `CAL` | 28 | 28 |
| `UNT` | 25 | 25 |
| `MEM` | 20 | 20 |
| **Total** | **191** | **191** |

**Distribución por actor** (celdas certificadas): A2 **4** · A3 **4** · A4 **37** · A5 **35** · A6 **37** ·
A7 **37** · A8 **37**.

**Distribución por verbo:** `POST` **80** · `PUT` **37** · `PATCH` **37** · `DELETE` **37**.

**Prueba de contenido protegido.** `CAL` se probó sobre **calibres descartables** (`T11A<ALIAS>CALD-02`) y
`MEM` sobre la **cuenta del usuario descartable** (`UnitMembership` no tiene campo de texto con marcador, por
eso el marcador vive en la cuenta). `POS` se probó con **puestos descartables con holder** (§6).

---

## 4. Sweep 2 — tiro/almacén/resultados 138/150

Familias: **`RNG` · `RES` · `LES` · `FRC` · `CMN` · `CAR` · `ARM` · `EJR` · `WPN`**. De **150** objetivos,
**138** `MATCH_DENY` en `403` exacto y **12** declaradas `NO_RESPONSE` (§5); **0** `MISMATCH_ALLOW`, **0**
`OTHER`. Cobertura del barrido **150/150** (`coverage_ok: true`), **0** `page_errors`. Marcadores descartables
planificados: **40**; no probables declarados: **12**.

| Familia | Objetivos | Certificadas | Declaradas |
|---|:---:|:---:|:---:|
| `RNG` | 22 | 22 | 0 |
| `RES` | 20 | 20 | 0 |
| `LES` | 20 | 20 | 0 |
| `FRC` | 20 | 20 | 0 |
| `CAR` | 15 | 15 | 0 |
| `CMN` | 15 | 3 | 12 |
| `ARM` | 14 | 14 | 0 |
| `EJR` | 13 | 13 | 0 |
| `WPN` | 11 | 11 | 0 |
| **Total** | **150** | **138** | **12** |

**Distribución por actor** (celdas certificadas): A2 **1** · A3 **18** · A4 **32** · A5 **4** · A6 **33** ·
A7 **17** · A8 **33**.

**Distribución por verbo:** `POST` **34** · `PUT` **32** · `PATCH` **32** · `DELETE` **40**.

**Prueba de contenido protegido.** `RES` se probó con una **cadena descartable propia** en lugar de apuntar a
resultados certificados; `CAR` sembró **armas descartables** (`T11SECDWPN-02`) para liberar las parejas
`(consumo, arma)` faltantes. El **consumo de munición sembrado** (id 1) **no** se tocó en ningún intento.

---

## 5. Las 12 celdas declaradas no probadas

Las **12** celdas `NO_RESPONSE` son todas de la familia **`CMN`** (consumo de munición): **no** se probaron
porque **no hubo objetivo descartable posible sin ORM**. El alta por API de consumo de munición está **rota**
(`POST /api/consumos-municion/` → **500**, deuda
[`backend-debt.md`](../../../bugs/backend-debt.md) §8 y §8.1), de modo que el barrido no pudo materializar un
registro descartable contra el cual emitir `PUT`/`PATCH`/`DELETE`. **Jamás** se apuntó al consumo sembrado.

| OP | Verbo | Actores no probados | Motivo |
|---|---|---|---|
| `OP-CMN-004` | `PUT` | A4, A6, A8 | Sin objetivo descartable sin ORM (alta por API rota, §8) |
| `OP-CMN-005` | `PATCH` | A4, A6, A8 | Sin objetivo descartable sin ORM (alta por API rota, §8) |
| `OP-CMN-006` | `DELETE` | A3, A4, A5, A6, A7, A8 | Sin objetivo descartable sin ORM (alta por API rota, §8) |

> 📖 Nótese que **`OP-CMN-002`** (`POST` de colección) **sí** se probó y certificó para **A4/A6/A8** — es
> `POST` directo, que no necesita objetivo previo —; las 12 no probadas son exactamente las de `{id}`
> (`PUT`/`PATCH`/`DELETE`) de esa familia. La matriz **no** se tocó para estas 12 celdas: siguen
> `NOT_EXERCISED`.

---

## 6. Incidente §11 y su refinamiento

Durante la **limpieza** del sweep 1, los **5 puestos descartables** (ids **69–73**, marcadores
`T11A4POSD-02` … `T11A8POSD-02`) respondieron `DELETE /api/posiciones/{id}/` → **`500` `ProtectedError`** al
intentarse la baja con las filas `Assignment` de sus holders aún presentes (deuda §11). Este es un **incidente
de limpieza**, no de certificación: el barrido de denegaciones ya había cerrado (las celdas `POS` certificaron
en `403`), y el `500` aparece **después**, al retirar los descartables.

| Paso | Observado |
|---|---|
| Baja del puesto con las filas `Assignment` presentes (ids 69–73) | `DELETE` → **500** `ProtectedError` por `Assignment.position` |
| Baja de los usuarios holder | **204**, cascada: sus `Assignment` desaparecen |
| Baja de los puestos ya libres | **5 filas borradas**, **0 restantes** — por **ORM de desarrollo** (§7.1) |

> 📜 **Registro de la limpieza ORM.** Los 5 puestos se dieron de baja por **ORM de desarrollo**
> (`manage.py shell`), **única vía directa** tras el cascade de los holders: `delete_result`
> `(5, {'identity.Position': 5})`, `before_count` 5 → `after_count` 0. Declarado en
> [`denials-sweep1-cleanup.json`](./denials-sweep1-cleanup.json) (`method`, `no_code_touched: true`).

### 6.1 El residuo preexistente `id 65` (conservado a propósito)

El barrido estricto de limpieza cerró con **`own_matches 6`**: los **5** puestos recién descartados (ids
69–73, ya resueltos) **más** el residuo **preexistente** `id 65` (marcador `T11A1HLDMVABD354P`), que se
**conservó a propósito** como **artefacto de reproducción de §11**. Su `Assignment 62` (inactivo, account 20)
**sigue vivo** y bloquea su baja. No es un descartable de este barrido.

### 6.2 Refinamiento de §11 observado hoy

La observación del día **acota** §11 con un contraste dentro del mismo lote:

- **El bloqueo es el `ProtectedError` por `Assignment.position`.** Basta **una** fila `Assignment` —aun
  **inactiva**— para impedir la baja del puesto.
- **Si la cuenta/usuario asociado se elimina en cascada, la baja del puesto procede.** Contraste observado:
  el puesto descartable **`id 68`** del lote 2b se dio de baja **`204` → `GET` `404`** (sus filas `Assignment`
  desaparecieron), mientras que los puestos **69–73** respondieron **`500`** con las filas presentes.
- **El residuo `65` sobrevive por su `Assignment 62`**, que ninguna baja eliminó.

> 🕯️ Esta subsección **consigna** lo observado; **no** propone ni aplica reparación y **no** altera el
> registro previo de §11 ni §11.1. El detalle fechado vive en
> [`backend-debt.md`](../../../bugs/backend-debt.md) §11.2.

---

## 7. Limpiezas y barridos estrictos

### 7.1 Sweep 1

- **Limpieza:** **37** entradas; **5** con `delete_status` no-`2xx` — los puestos `POS_A4…POS_A8`
  (ids 69–73) → **500** `ProtectedError` (§6), resueltos por **ORM de desarrollo** (5 filas borradas, 0
  restantes).
- **Barrido estricto** (`token` `T11A|T11RT|T11R2`, 13 familias): **`own_matches 6`** — 5 en `posiciones`
  (los descartables del sweep, ya resueltos; su marcador sobrevive en el barrido porque éste leyó el estado
  previo a la baja ORM) **+** el residuo preexistente `id 65`. **0** `marker_matches` en las otras 12
  familias.

### 7.2 Sweep 2

- **Limpieza:** **43** entradas; **0** con `delete_status` no-`2xx`.
- **Barrido estricto** (`token` `T11A|T11RT|T11R2`, 11 familias): **`own_matches 0`**. **0** `marker_matches`
  en todas las familias.

> 📜 En ambos barridos ninguna limpieza dejó residuo del propio sweep por una **denegación**; el único
> residuo (sweep 1) fue el `500` de §11, resuelto por ORM y declarado. Las familias fuera del barrido
> estricto quedan cubiertas por los `get_after` de la limpieza.

---

## 8. Certificación y conteos

| Barrido | Objetivos | Certificadas | Declaradas | Conteo de la matriz |
|---|:---:|:---:|:---:|---|
| **Sweep 1** (identidad/organización) | 191 | 191 | 0 | `778` → `969` `OBSERVED_OK` / `7` `PARTIAL` / `535` → `344` `NOT_EXERCISED` |
| **Sweep 2** (tiro/almacén/resultados) | 150 | 138 | 12 | `969` → `1107` `OBSERVED_OK` / `7` `PARTIAL` / `344` → `206` `NOT_EXERCISED` |
| **Total** | **341** | **329** | **12** | **1107 / 7 / 206** sobre 1320 |

- **Scripts de certificación:** `writes-certify-denials1-2026-10-16.cjs` (PASS: **191** flips, `778/7/535` →
  `969/7/344`, backup `.before-denials-sweep1.json`, observación `denials_sweep1_2026_10_16`) y
  `writes-certify-denials2-2026-10-16.cjs` (PASS: **138** flips, **12** no certificadas, `969/7/344` →
  `1107/7/206`, backup `.before-denials-sweep2.json`, observación `denials_sweep2_2026_10_16`).
- **`expected_by_actor`** y **estado global** (`NOT_VERIFIED` / `NO_CUMPLIDO`): **sin cambios**.
- **`PARTIAL`** permanece en **7** en todo el barrido.

---

## 9. Límites

- **Un actor, una corrida por sweep.** El barrido se ejecutó **una sola vez** por sweep; no se repitió ni se
  reprodujo en otra fecha.
- **Solo `403` certifica.** Un `2xx` se habría registrado como `MISMATCH_ALLOW` (denegación no observada) y
  **no** habría certificado; en esta corrida **no hubo ninguno**.
- **Las 12 `CMN` no se probaron.** Su no-certificación es una **limitación declarada** por el alta rota (§8),
  no un fallo del barrido; la matriz las conserva en `NOT_EXERCISED`.
- **No se apuntó a contenido certificado.** El barrido nunca mutó contenido acreditado: los objetivos fueron
  descartables con marcador, o descartables propios de la familia.
- **Los efectos fueron aplicados por los scripts de certificación**, no por edición manual de la matriz, y
  ambos validaron la comparación estructural contra su copia previa antes de escribir.

---

## 10. Fuentes

| # | Fuente | Qué aporta |
|---|---|---|
| 1 | [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json) | Matriz de aceptación; observaciones `denials_sweep1_2026_10_16` y `denials_sweep2_2026_10_16` |
| 2 | [`denials-sweep1-2026-10-16.json`](./denials-sweep1-2026-10-16.json) | Barrido sweep 1 (191 `MATCH_DENY`, `coverage_ok`, `sweep_strict`) |
| 3 | [`denials-sweep2-2026-10-16.json`](./denials-sweep2-2026-10-16.json) | Barrido sweep 2 (138 `MATCH_DENY`, 12 `NO_RESPONSE`) |
| 4 | [`denials-sweep1-cleanup.json`](./denials-sweep1-cleanup.json) | Limpieza ORM de los 5 puestos (ids 69–73) y residuo `id 65` |
| 5 | [`coverage/actor-permission-matrix-2026-10-15.md`](../coverage/actor-permission-matrix-2026-10-15.md) | Contrato **C-4** (§1–§4): expectativa por celda |
| 6 | [`backend-debt.md`](../../../bugs/backend-debt.md) | Deuda §8/§8.1 (alta de CMN rota) y §11/§11.1/§11.2 (baja de puesto) |
| 7 | `.cache/frontend-acceptance/2026-10-16/writes-certify-denials1-2026-10-16.cjs` · `writes-certify-denials2-2026-10-16.cjs` | Scripts de certificación (abortan sin escribir ante desajuste) |
