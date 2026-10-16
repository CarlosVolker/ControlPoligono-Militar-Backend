---
actualizado: 2026-10-16
---

# Barrido de lecturas ALLOW/DENY (2026-10-16)

> 🕯️ **Qué es y qué no.** Registro documental del **barrido de lecturas pendientes** sobre la matriz de
> aceptación [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json): el
> ejercicio directo, **de solo lectura**, de las **273 celdas `GET` que seguían `NOT_EXERCISED`** tras la
> primera pasada de certificación, con la **sesión real acreditada** de cada actor. Cada celda se clasifica
> contra su `expected_by_actor` (poblado desde **C-4** el **2026-10-16**): las lecturas `ALLOW`/`SCOPED`
> observadas en **2xx** y las denegaciones `DENY` observadas en **403** se **certifican**. **No** emite
> veredicto de aceptación, **no** cambia `status_global` ni `global_conclusion` y **no** propone ni aplica
> arreglos.

## Índice

1. [Qué es](#1-qué-es) · 2. [Método](#2-método) · 3. [Resultados](#3-resultados) · 4. [Contraste C-4 esperado-vs-observado](#4-contraste-c-4-esperado-vs-observado) · 5. [Límites](#5-límites) · 6. [Fuentes](#6-fuentes)

---

## 1. Qué es

La matriz de aceptación tiene **1320 celdas** (165 filas `OP-*` × 8 actores). Tras la primera pasada de
certificación (contraste de las 392 celdas ya observadas) y el consumo de C-4, el barrido cierra el hueco
de **lectura**: las **273 celdas de método `GET`** que seguían **`NOT_EXERCISED`** con expectativa
`EXPECTED_ALLOW`, `EXPECTED_ALLOW_SCOPED` o `EXPECTED_DENY`. Ejercitarlas era el paso que faltaba para que
la denegación o la concesión **de lectura** quedara observada contra la expectativa.

> 📜 **Denominador del barrido:** 273 celdas `GET` `NOT_EXERCISED`. **Certificadas:** 182
> (`NOT_EXERCISED` → `OBSERVED_OK`): **145** lecturas `ALLOW`/`SCOPED` en 2xx (**Barrido 1**) y **37**
> denegaciones `DENY` en 403 (**Barrido 2**). **Sin certificar:** 91 (**88** «sin filas propias» +
> **3** fallos de servidor).

El barrido se ejecutó en **dos pasadas**: una **v1** (descartada, ver §2.4) y una **v2** (la que se
certifica). Los artefactos de ambas se conservan.

---

## 2. Método

### 2.1 Sesiones acreditadas

Las 8 sesiones son las reales de cada alias, acreditadas **por correspondencia**: el `POST /api/auth/login/`
desde la **UI** devolvió **200** y el `GET /api/auth/context/` devolvió **200** con el **rol primario
esperado** activo. Cada `context_read.active_role` coincide con el rol del alias; `alias_matched: true` en
los ocho.

| Alias | Rol primario esperado | Login UI | Contexto | `active_role` observado |
|---|---|:---:|:---:|---|
| **A1** | `super_admin` | 200 | 200 | `super_admin` |
| **A2** | `tenant_admin` | 200 | 200 | `tenant_admin` |
| **A3** | `admin_unidad` | 200 | 200 | `admin_unidad` |
| **A4** | `comandante_unidad` | 200 | 200 | `comandante_unidad` |
| **A5** | `oficial_tiro` | 200 | 200 | `oficial_tiro` |
| **A6** | `oficial_observador` | 200 | 200 | `oficial_observador` |
| **A7** | `encargado_almacen` | 200 | 200 | `encargado_almacen` |
| **A8** | `tirador` | 200 | 200 | `tirador` |

### 2.2 Ejercicio por lectura directa

Cada celda objetivo se ejercita con la misma ruta y el mismo método que consume la UI, contra la API real,
con la cookie de sesión del actor. **Sin cookies fabricadas y sin mutación alguna** (`read_only: true`,
`mutations: []`). Se aplica un `list_diagnostics` previo por actor (conteo de las colecciones propias) para
resolver el **identificador** que cada celda `{id}` necesita:

- **Celda `ALLOW`/`SCOPED` con `{id}`:** sólo se usa un **identificador del propio conjunto visible** del
  actor. Si el actor **no tiene filas propias**, la celda **no es ejercitable** y se declara (`sin_filas_propias`).
- **Celda `DENY` con `{id}`:** se usa un identificador propio; en su defecto, **reserva del primer id de
  A1**; y si tampoco existe, un **placeholder `1`** (registrado como tal). La denegación es **de clase** —
  el `403` no depende de que el id exista.

### 2.3 Clasificación

| Clase | Condición | Celdas | Efecto |
|---|---|:---:|---|
| `MATCH_ALLOW` | `EXPECTED_ALLOW`/`SCOPED` + **2xx** real | 145 | `NOT_EXERCISED` → `OBSERVED_OK` |
| `MATCH_DENY` | `EXPECTED_DENY` + **403** real | 37 | `NOT_EXERCISED` → `OBSERVED_OK` |
| `SERVER_FAILURE` | respuesta **500** (fallo de servidor, no de autorización) | 3 | sin cambio |
| `UNPROBEABLE` | `sin_filas_propias` (listado propio 200 y vacío) | 88 | sin cambio |
| `OTHER` | cualquier otra respuesta | **0** | — |

> 🕯️ **Regla dura, verificada contra evidencia.** El script de certificación **aborta** (`BLOCKED`, sin
> escribir) ante cualquier desajuste: `sweep.schema` distinto de `/v2`, celda a certificar que no está
> `NOT_EXERCISED`, `MATCH_ALLOW` sin 2xx o con expectativa no-`ALLOW`, `MATCH_DENY` sin 403 o con expectativa
> no-`DENY`, **drift** entre la expectativa del barrido y la de la matriz, o celda duplicada. La matriz de
> entrada cuadró: **0 desajustes de autorización**, **0 respuestas «otras»**. Tras aplicar los efectos, la
> comparación estructural contra la copia de reversión confirmó que **sólo** cambiaron los **182** estados
> certificados, `cell_state_counts`, **40** evidencias de fila y `observations`.

### 2.4 Nota de corrección honesta (v1 → v2)

La **pasada v1** quedó **descartada para certificar** por **contaminación de claves de id**: resolvía los
identificadores con una cadena genérica que mezclaba claves entre recursos (p. ej. un `id_leccion` usado
como id de fracción), de modo que una lectura podía responder 2xx sobre el recurso equivocado. La **v2**
usa **claves por recurso confirmadas contra serializers/modelos**, y es la única certificable (el script
exige `schema: frontend-t11-read-sweep/v2`). **La v1 y su JSON se conservan** como registro histórico —
**no se borran** (`.cache/frontend-acceptance/2026-10-16/read-sweep-2026-10-16.json`, `schema: …/v1`).

---

## 3. Resultados

### 3.1 Celdas certificadas (182)

`NOT_EXERCISED` → `OBSERVED_OK`. Orden de actores `A1…A8`. `✓` = `MATCH_ALLOW` (2xx), `✗` = `MATCH_DENY` (403).

| OP | Método + endpoint | `ALLOW` certificadas (2xx) | `DENY` certificadas (403) |
|---|---|---|---|
| `OP-ARM-003` | `GET /armorias/{id}/` | A1, A2, A3, A4, A5 (5) | A6, A8 (2) |
| `OP-AUT-006` | `GET /protected/` | A1–A8 (8) | — |
| `OP-AZC-001` | `GET /authz/catalog/` | A1–A8 (8) | — |
| `OP-AZC-003` | `GET /authz/personas-por-unidad/` | A1–A8 (8) | — |
| `OP-AZC-004` | `GET /authz/eligible-target-units/` | A1–A8 (8) | — |
| `OP-CAL-003` | `GET /calibres/{id}/` | A2, A3, A4, A5, A6, A7, A8 (7) | — |
| `OP-FRC-001` | `GET /fracciones/` | A1–A8 (8) | — |
| `OP-FRC-003` | `GET /fracciones/{id}/` | A1, A2 (2) | — |
| `OP-FRC-007` | `GET /fracciones/{id}/tiradores/` | A1, A2 (2) | — |
| `OP-FRC-008` | `GET /fracciones/{id}/resultados/` | A1, A2 (2) | — |
| `OP-LES-003` | `GET /lecciones/{id}/` | A1, A2, A8 (3) | — |
| `OP-LES-007` | `GET /lecciones/{id}/fracciones/` | A1, A2, A8 (3) | — |
| `OP-LES-008` | `GET /lecciones/{id}/usuarios/` | A1, A2, A8 (3) | — |
| `OP-LES-010` | `GET /lecciones/{id}/resultados-resumen/` | A1, A2, A8 (3) | — |
| `OP-LES-011` | `GET /lecciones/{id}/reporte/` | A1, A2, A8 (3) | — |
| `OP-LES-012` | `GET /lecciones/{id}/tiradores-elegibles/` | A1, A2, A8 (3) | — |
| `OP-MEM-003` | `GET /memberships/{id}/` | A1–A8 (8) | — |
| `OP-OVR-001` | `GET /authz/overrides/` | A1, A2 (2) | A3, A4, A5, A6, A7, A8 (6) |
| `OP-OVR-003` | `GET /authz/overrides/{id}/` | — | A3, A4, A5, A6, A7, A8 (6) ← *placeholder* |
| `OP-POS-003` | `GET /posiciones/{id}/` | A4 (1) | — |
| `OP-POS-009` | `GET /posiciones/{id}/historico/` | A4 (1) | — |
| `OP-PPR-001` | `GET /authz/position-permissions/` | A1 (1) | — |
| `OP-PPR-003` | `GET /authz/position-permissions/{id}/` | — | A3, A4, A5, A6, A7, A8 (6) ← *placeholder* |
| `OP-PRF-001` | `GET /me/preferences/appearance/` | A1–A8 (8) | — |
| `OP-PRM-002` | `GET /authz/permissions/{id}/` | A1 (1) | — |
| `OP-RCT-003` | `GET /recintos/{id}/` | A4 (1) | A5, A6, A7, A8 (4) |
| `OP-RES-001` | `GET /resultados/` | A1–A8 (8) | — |
| `OP-RES-003` | `GET /resultados/{id}/` | A2, A3, A4, A5, A6, A7, A8 (7) | — |
| `OP-RNG-003` | `GET /poligonos/{id}/` | A1, A2 (2) | — |
| `OP-RNG-007` | `GET /poligonos/{id}/lecciones/` | A1, A2 (2) | — |
| `OP-ROL-003` | `GET /authz/roles/{id}/` | A1 (1) | — |
| `OP-RPR-001` | `GET /authz/role-permissions/` | A1 (1) | — |
| `OP-RPR-003` | `GET /authz/role-permissions/{id}/` | A1, A2 (2) | A3, A4, A5, A6, A7, A8 (6) |
| `OP-SCP-002` | `GET /authz/scopes/{id}/` | A1 (1) | — |
| `OP-UNT-003` | `GET /organization-units/{id}/` | A3, A4, A7 (3) | — |
| `OP-UNT-007` | `GET …/previsualizar-eliminacion/` | A2, A3 (2) | A4, A5, A6, A7, A8 (5) |
| `OP-UNT-009` | `GET /organization-units/lookup/` | A6, A8 (2) | — |
| `OP-UNT-010` | `GET /me/assignable-units/` | A1, A3, A4, A5, A6, A7, A8 (7) | — |
| `OP-USR-015` | `GET …/estado-bloqueo/` | A1–A8 (8) | — |
| `OP-WPN-003` | `GET /armas/{id}/` | — | A6, A8 (2) |

**Totales:** 145 `MATCH_ALLOW` + 37 `MATCH_DENY` = **182**. Las **6** denegaciones de `OP-OVR-003` y
`OP-PPR-003` (A3–A8) usaron **placeholder de sondeo** (§2.2): esos dos OP **no tienen filas propias ni
reserva** de id, y la denegación observada es **de clase**.

### 3.2 Fallos de servidor — NO certificados (3)

Respuesta **500**: fallo del endpoint, no de autorización. Siguen `NOT_EXERCISED`.

| OP | Método + endpoint | Actores | Observado | Referencia de deuda |
|---|---|---|:---:|---|
| `OP-LES-009` | `GET /lecciones/{id}/resultados/` | A1, A2, A8 | 500 | [§9](../../../../bugs/backend-debt.md) (500 conocido) |

### 3.3 Celdas «sin filas propias» — NO certificadas (88)

Listado propio **200 y vacío** (`sin_filas_propias`): la causa es **de contenido/datos**, no de autorización
—no hay fila que leer para construir el `{id}` de detalle o subruta. Siguen `NOT_EXERCISED`. Detalle por
`op/actor` en el JSON (§6).

| Familia | OP | Actores | Celdas | Causa |
|---|---|---|---:|:---:|
| Lecciones | `OP-LES-003/007/008/009/010/011/012` | A3, A4, A5, A6, A7 | 35 | sin lecciones en su alcance |
| Fracciones | `OP-FRC-003/007/008` | A3, A4, A5, A6, A7, A8 | 18 | sin fracciones propias |
| Polígonos | `OP-RNG-003/007` | A3, A4, A5, A6, A7, A8 | 12 | sin polígonos en su alcance |
| Consumos de arma | `OP-CAR-003` | A1–A8 | 8 | sin consumos |
| Consumos de munición | `OP-CMN-003` | A1–A8 | 8 | sin consumos |
| Ejercicios | `OP-EJR-003` | A4, A8 | 2 | sin ejercicios propios |
| Overrides / posición-permisos | `OP-OVR-003`, `OP-PPR-003` | A1, A2 | 4 | listas globales vacías |
| Armas | `OP-WPN-003` | A4 | 1 | sin arma propia |
| | | **Total** | **88** | |

> 📜 Las celdas `A3–A7` de lecciones y `A3–A8` de polígonos, fracciones, consumos y ejercicios **no** se
> ejercitaron porque el `list` propio del actor vino **vacío** (200, `count: 0`): no es una denegación ni un
> error de autorización, y por eso **no** se certifican.

### 3.4 Conteos

| Estado | Antes | Después | Δ |
|---|---:|---:|---:|
| `OBSERVED_OK` | 385 | **567** | +182 |
| `PARTIAL` | 7 | **7** | 0 |
| `NOT_EXERCISED` | 928 | **746** | −182 |
| Total | 1320 | **1320** | — |

**182 celdas** cambiaron, todas de `NOT_EXERCISED` a `OBSERVED_OK`. Recuento obtenido recorriendo las 165
filas × 8 actores, **no** por agregación de conteos declarados; coincide con `cell_state_counts`.

### 3.5 Evidencia de fila

Las **40 filas** con al menos una celda certificada reciben al final de su campo `evidence`, **sin** borrar
el texto previo, la frase:

> ` Actualización 2026-10-16: barrido de lecturas (solo lectura, sesión real del actor) — lectura directa observada en <actores>; celdas certificadas (NOT_EXERCISED → OBSERVED_OK).`

La pasada queda registrada en `observations.read_sweep_2026_10_16`.

---

## 4. Contraste C-4 esperado-vs-observado

El barrido **cierra la validación de C-4 sobre las celdas de lectura**:
[`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md)
(§1–§4) es la fuente de `expected_by_actor` (`expected_source: C-4`).

> 🕯️ **Resultado:** **0 discrepancias** entre expectativa y observación en las **273 celdas ejercitadas**.
> Las **145** lecturas `ALLOW`/`SCOPED` respondieron **2xx** y las **37** `DENY` respondieron **403**,
> exactamente lo que C-4 predice. Las **91** restantes no se contrastan: **88** no son ejercitables por
> contenido (§3.3) y **3** son fallo de servidor (§3.2), ajeno a autorización.

- **Distribución de las 273:** 145 `MATCH_ALLOW` · 37 `MATCH_DENY` · 88 `UNPROBEABLE` · 3 `SERVER_FAILURE`.
- **Desajustes de autorización:** **0** (`mismatch_deny_for_allow: 0`, `mismatch_allow_for_deny: 0`).
- **Respuestas «otras»:** **0** (`other: 0`).

---

## 5. Límites

- **La lectura certificada acredita la concesión o la denegación, no el conjunto visible.** Un `2xx` sobre
  un listado afirma permiso concedido, no que las filas sean el subconjunto correcto (núcleo de §4.3 de
  C-4); un `403` acredita que el permiso niega la acción, no que lo que el actor **sí** ve sea correcto.
- **La denegación con placeholder es de clase.** En `OP-OVR-003` y `OP-PPR-003` (A3–A8) no existe fila ni
  reserva: el `403` se observa con un id `1` de sondeo y **no** valida la existencia de la fila.
- **El `NOT_VERIFIED` persiste.** `status_global` sigue **`NOT_VERIFIED`** y `global_conclusion` sigue
  **`NO_CUMPLIDO`**, sin cambios; `expected_by_actor` intacto.
- **Celdas no certificadas.** Las **88** «sin filas propias» y los **3** fallos de servidor **siguen
  `NOT_EXERCISED`**: no se promueven ni se degradan.
- **Sin tocar lo ajeno al encargo.** Toda celda fuera de las 182 certificadas quedó intacta (verificado por
  comparación estructural contra la copia de reversión).
- **Script fuera de `evidence`.** El script de la pasada **no** se copia a este directorio; vive en
  `.cache`. El documento de evidencia sí se copia, y el JSON fuente del barrido tiene copia durable (§6).
- **Sin backend, base de datos ni escrituras de producto.** Sólo lectura y reescritura del JSON de la
  matriz; **sin** `git add`/`commit`; **sin** servidores ni navegador.

> 🕯️ Este documento **no** afirma completitud del producto ni emite veredicto de aceptación. No contiene
> secretos, cookies, RUT, correos ni nombres de personas: sólo OP, alias de actor, rutas, estados HTTP y
> referencias de deuda.

---

## 6. Fuentes

| # | Fuente | Aporta |
|---|---|---|
| 1 | [`read-sweep-2026-10-16.v2.json`](./read-sweep-2026-10-16.v2.json) | Copia durable del barrido ejecutado (pasada corregida v2): 273 probes, sesiones, diagnóstico de listas, clasificación y detalle `op/actor` |
| 2 | [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json) | Las 273 celdas `GET` objetivo, su `expected_by_actor` (C-4) y los efectos del barrido (`observations.read_sweep_2026_10_16`) |
| 3 | [`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md) | Origen de `expected_by_actor` (C-4, §1–§4) |
| 4 | `.cache/frontend-acceptance/2026-10-16/read-sweep-certify-2026-10-16.cjs` | Script ejecutado (no copiado a `evidence`): 273 clasificaciones, 182 flips, 40 anexos, comparación estructural |
| 5 | `.cache/frontend-acceptance/2026-10-16/read-sweep-2026-10-16.json` | Pasada **v1** descartada (contaminación de claves de id); se conserva como registro histórico |

Copia de reversión previa al barrido: `.cache/frontend-acceptance/2026-10-16/acceptance-matrix.before-read-sweep.json`.
Plan de cierre: [`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md).
