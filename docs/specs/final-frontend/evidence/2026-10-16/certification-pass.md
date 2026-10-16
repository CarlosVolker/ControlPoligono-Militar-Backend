---
actualizado: 2026-10-16
---

# Pasada de certificación esperado-vs-observado (2026-10-16)

> 🕯️ **Qué es y qué no.** Registro documental de la **primera pasada de certificación** de la matriz de
> aceptación [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json): el
> contraste, celda a celda, de las **392 celdas observadas** (`OBSERVED_OK` + `PARTIAL`) contra su
> `expected_by_actor`, poblado desde **C-4** el **2026-10-16**. **No** emite veredicto de aceptación,
> **no** cambia `status_global` ni `global_conclusion` y **no** propone ni aplica arreglos. Sólo se
> certifica la clase **inequívoca**: la denegación real observada (`403`) que coincide con
> `EXPECTED_DENY`. Las demás clases se registran **sin** cambio de estado.

## Índice

1. [Qué es](#1-qué-es) · 2. [Método](#2-método) · 3. [Resultados](#3-resultados) · 4. [Límites](#4-límites) · 5. [Fuentes](#5-fuentes)

---

## 1. Qué es

La matriz de aceptación tiene **1320 celdas** (165 filas `OP-*` × 8 actores). De ellas, **392** están
**observadas** —**354** `OBSERVED_OK` y **38** `PARTIAL`— y **928** siguen `NOT_EXERCISED`. La pasada
contrasta esas **392** celdas observadas contra su expectativa por actor y **certifica una sola clase**:
aquella en la que el resultado **observado** es una **denegación real de backend** y la **expectativa**
declara `EXPECTED_DENY`. Ese contraste es el que faltaba tras poblar `expected_by_actor` desde C-4.

> 📜 **Denominador de la pasada:** 392 celdas observadas. **Certificadas:** 31 (`PARTIAL` → `OBSERVED_OK`).
> **Sin cambio:** 354 `MATCH_ALLOW`, 5 `NOT_AUTHORIZATION_FAILURE`, 2 `UNRESOLVED`.

---

## 2. Método

La expectativa de cada celda proviene de la matriz actor→permiso **C-4**
([`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md),
§1–§4), aplicada a las 1320 celdas el **2026-10-16** (bloque `observations.expected_population_2026_10_16`
de la propia matriz). El contraste clasifica cada celda observada en una de cuatro clases:

| Clase | Condición | Celdas | Efecto |
|---|---|:---:|---|
| `MATCH_ALLOW` | `OBSERVED_OK` con `EXPECTED_ALLOW` o `EXPECTED_ALLOW_SCOPED` | 354 | ninguno (sólo conteo) |
| `MATCH_DENY_CERTIFIED` | `PARTIAL` con 403 real y `EXPECTED_DENY` (lista A) | 31 | `PARTIAL` → `OBSERVED_OK` |
| `NOT_AUTHORIZATION_FAILURE` | `PARTIAL` por fallo de validación/integridad (lista B) | 5 | sigue `PARTIAL` |
| `UNRESOLVED` | `PARTIAL` por condición pendiente (lista C) | 2 | sigue `PARTIAL` |

> 🕯️ **Regla dura, verificada contra evidencia.** El script **aborta** (`BLOCKED`, sin escribir) si una
> celda `PARTIAL` no cae en A+B+C, si una celda de la lista A no tiene `EXPECTED_DENY`, si una de B no
> tiene `EXPECTED_ALLOW`, si una de C no tiene `EXPECTED_ALLOW_SCOPED`, o si aparece **cualquier**
> `OBSERVED_OK` con `EXPECTED_DENY`. La matriz de entrada cuadró: 38 `PARTIAL` = 31 (A) + 5 (B) + 2 (C),
> y **cero** `OBSERVED_OK` contra `EXPECTED_DENY`. Tras aplicar los efectos, la comparación estructural
> contra la copia de reversión confirmó que **sólo** cambiaron los 31 estados de A, `cell_state_counts`,
> 9 evidencias de fila y `observations`.

El script vive en `.cache/frontend-acceptance/2026-10-16/certification-pass-2026-10-16.cjs`; **no** se
copia a este directorio (decisión del encargo). Se referencia en [§5](#5-fuentes).

---

## 3. Resultados

### 3.1 Lista A — denegaciones certificadas (`PARTIAL` → `OBSERVED_OK`, 31)

Todas con 403 real observado y expectativa `EXPECTED_DENY`. Cada fila recibe, al final de su `evidence`,
una frase fechada del `2026-10-16`.

| OP | Método + endpoint | Actores certificados |
|---|---|---|
| `OP-ARM-001` | `GET /armorias/` | A6, A8 |
| `OP-WPN-001` | `GET /armas/` | A6, A8 |
| `OP-AUT-004` | `GET /auth/audit-log/` | A3, A4, A5, A6, A7, A8 |
| `OP-PPR-001` | `GET /authz/position-permissions/` | A3, A4, A5, A6, A7, A8 |
| `OP-RPR-001` | `GET /authz/role-permissions/` | A3, A4, A5, A6, A7, A8 |
| `OP-RCT-001` | `GET /recintos/` | A5, A6, A7, A8 |
| `OP-WPN-002` | `POST /armas/` | A4 |
| `OP-WPN-006` | `DELETE /armas/{id}/` | A3, A5 |
| `OP-EJR-006` | `DELETE /ejercicios/{id}/` | A3, A7 |

Dos familias:

- **Lectura directa** (`OP-ARM-001`, `OP-WPN-001`): la denegación proviene de la lectura directa real a
  la API con la sesión del actor; la **neutralidad de UI** de la ruta homologada se conserva **anotada**,
  sin convertirse en 403.
- **Gates `TA`/`AUDIT` y rechazos §12** (`OP-AUT-004`, `OP-PPR-001`, `OP-RPR-001`, `OP-RCT-001`,
  `OP-WPN-002`, `OP-WPN-006`, `OP-EJR-006`): 403 reales observados, incluida la asimetría de rol de A7 en
  `OP-EJR-006` (puede crear y editar ejercicios, no borrarlos).

### 3.2 Lista B — fallos no-autorización (siguen `PARTIAL`, 5)

No son discrepancias de **permiso**: el permiso estaba concedido y el endpoint falló por validación o
integridad. La referencia de deuda se registra en la **observación** de la pasada, no en la fila.

| OP | Método + endpoint | Actor | Observado | Referencia de deuda |
|---|---|---|---|---|
| `OP-CMN-002` | `POST /consumos-municion/` | A1 | 500 | [§8](../../../../bugs/backend-debt.md) |
| `OP-POS-006` | `DELETE /posiciones/{id}/` | A2 | 500 `ProtectedError` | [§11](../../../../bugs/backend-debt.md) |
| `OP-RES-002` | `POST /resultados/` | A1 | 400 (unicidad/desalineación) | [§7 / §7.1](../../../../bugs/backend-debt.md) |
| `OP-RES-004` | `PUT /resultados/{id}/` | A1 | 400 (unicidad/desalineación) | [§7 / §7.1](../../../../bugs/backend-debt.md) |
| `OP-RES-005` | `PATCH /resultados/{id}/` | A1 | 400 (unicidad/desalineación) | [§7 / §7.1](../../../../bugs/backend-debt.md) |

### 3.3 Lista C — sin resolver (siguen `PARTIAL`, 2)

Condición pendiente: la expectativa condicional no quedó cubierta en su totalidad.

| OP | Método + endpoint | Actor | Razón |
|---|---|---|---|
| `OP-UNT-002` | `POST /organization-units/` | A3 | 403 en raíz coincide con la rama «sin `parent`» de la expectativa condicional; la rama **con** `parent` queda sin ejercitar |
| `OP-USR-013` | `POST /usuarios/{id}/cambiar-contrasena/` | A8 | camino **propio** ejercitado con 200; camino **ajeno** sin ejercitar |

### 3.4 Conteos

| Estado | Antes | Después | Δ |
|---|---:|---:|---:|
| `OBSERVED_OK` | 354 | **385** | +31 |
| `PARTIAL` | 38 | **7** | −31 |
| `NOT_EXERCISED` | 928 | **928** | 0 |
| Total | 1320 | **1320** | — |

**31 celdas** cambiaron, todas de `PARTIAL` a `OBSERVED_OK`. Recuento obtenido recorriendo las 165 filas ×
8 actores, **no** por agregación de conteos declarados; coincide con `cell_state_counts`.

### 3.5 Evidencia de fila

Las **9 filas** con celdas en la lista A reciben al final de su campo `evidence`, **sin** borrar el texto
previo, la frase:

> ` Actualización 2026-10-16: contraste C-4 — denegación real observada (403) coincide con EXPECTED_DENY para <actores>; celdas certificadas (PARTIAL → OBSERVED_OK).`

con `<actores>` la lista de actores certificados de esa fila (`A3, A4, A5, A6, A7, A8` en
`OP-AUT-004`/`OP-PPR-001`/`OP-RPR-001`; `A5, A6, A7, A8` en `OP-RCT-001`; `A6, A8` en
`OP-ARM-001`/`OP-WPN-001`; `A4` en `OP-WPN-002`; `A3, A5` en `OP-WPN-006`; `A3, A7` en `OP-EJR-006`).

La pasada queda registrada en `observations.certification_pass_2026_10_16`.

---

## 4. Límites

- **La denegación certificada es un 403 real contra `EXPECTED_DENY`.** No certifica el **conjunto
  visible**, que sigue condicionado por §4.3 de C-4: un `403` acredita que el permiso niega la acción, no
  que lo que el actor **sí** ve sea el subconjunto correcto.
- **El `NOT_VERIFIED` de contenido persiste.** Esta pasada no emite veredicto de aceptación: `status_global`
  sigue **`NOT_VERIFIED`** y `global_conclusion` sigue **`NO_CUMPLIDO`**, sin cambios.
- **Clases no certificadas.** Los 5 fallos no-autorización y las 2 celdas sin resolver **siguen `PARTIAL`**:
  no se promueven ni se degradan.
- **Sin tocar lo ajeno al encargo.** `expected_by_actor`, `expected_source` y toda celda fuera de la lista
  A quedaron intactos (verificado por comparación estructural contra la copia de reversión).
- **Script fuera de `evidence`.** El script de la pasada no se copia a este directorio; vive en `.cache`.
- **Sin backend, base de datos ni escrituras de producto.** Sólo lectura y reescritura del JSON de la
  matriz; **sin** `git add`/`commit`; **sin** servidores ni navegador.

> 🕯️ Este documento **no** afirma completitud del producto ni emite veredicto de aceptación. No contiene
> secretos, cookies, RUT, correos ni nombres de personas: sólo OP, alias de actor, rutas, estados HTTP y
> referencias de deuda.

---

## 5. Fuentes

| # | Fuente | Aporta |
|---|---|---|
| 1 | [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json) | Las 392 celdas observadas, su `expected_by_actor` (C-4) y los efectos de la pasada (`observations.certification_pass_2026_10_16`) |
| 2 | [`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md) | Origen de `expected_by_actor` (C-4, §1–§4) |
| 3 | `.cache/frontend-acceptance/2026-10-16/certification-pass-2026-10-16.cjs` | Script ejecutado (no copiado a `evidence`): 392 clasificaciones, 31 flips, 9 anexos, comparación estructural |

Copia de reversión previa a la pasada: `.cache/frontend-acceptance/2026-10-16/acceptance-matrix.before-certification.json`.
Plan de cierre: [`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md).
