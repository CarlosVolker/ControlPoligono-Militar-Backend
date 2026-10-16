---
actualizado: 2026-10-16
---

# Siembra de contenido de desarrollo y barrido post-siembra (2026-10-16)

> 🕯️ **Qué es y qué no.** Registro documental de dos hechos del **2026-10-16**: la **siembra de
> contenido de desarrollo** (orden del operador) que habilita celdas `GET` que estaban «sin filas
> propias», y el **re-barrido de lecturas post-siembra** que las ejercita y **certifica 84 celdas**
> (`NOT_EXERCISED` → `OBSERVED_OK`) sobre la matriz de aceptación
> [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json). La siembra se
> hizo por **dos vías** (§2). El re-barrido es **de solo lectura** (`read_only: true`, `mutations: []`).
> **No** emite veredicto de aceptación, **no** cambia `status_global` ni `global_conclusion`, y **no**
> propone ni aplica arreglos.

## Índice

1. [Qué es](#1-qué-es) · 2. [La siembra](#2-la-siembra) · 3. [El re-barrido](#3-el-re-barrido) · 4. [La certificación resultante](#4-la-certificación-resultante) · 5. [Pendientes](#5-pendientes) · 6. [Invariantes y límites](#6-invariantes-y-límites) · 7. [Fuentes](#7-fuentes)

---

## 1. Qué es

La matriz de aceptación tiene **1320 celdas** (165 filas `OP-*` × 8 actores). El barrido de lecturas del
mismo día ([`read-sweep-2026-10-16.md`](./read-sweep-2026-10-16.md)) había dejado **91 celdas `GET` sin
certificar**, y de ellas **88** tenían una única causa: el listado propio del actor venía **200 y vacío**
(`sin_filas_propias`) — no había fila de la cual construir el `{id}` de detalle o subruta. El operador
ordenó **sembrar contenido de desarrollo donde fuera necesario** para habilitar esas celdas. Tras la
siembra, un **re-barrido** (mismo módulo **v2**) ejercitó los **91 restantes** y **certificó 84**.

> 📜 **Denominador del re-barrido:** 91 objetivos `GET`. **Certificados:** 84 (`MATCH_ALLOW`, 2xx real).
> **Sin certificar:** 7 — **4** `UNPROBEABLE` (listas RBAC propias vacías, `sin_filas_propias`) y **3**
> `SERVER_FAILURE` (`OP-LES-009` A1/A2/A8, 500, hallazgo §9).

---

## 2. La siembra

Sembrada el **2026-10-16** por orden del operador, **sobre la base de desarrollo** (tenant de desarrollo).
Marcadores del contenido sembrado (§2.3): prefijo de nombre **`DEV`** y observaciones
**`Contenido de desarrollo (seed 2026-10-16)`**. La siembra se hizo por **dos vías**, con **procedencia
honesta** distinta en cada una.

### 2.1 Vía API — sesión real de A1

Ejercitada por **API real** con la **sesión acreditada de A1** (`super_admin`) y la cabecera
`X-Org-Unit-Code` apuntando a la **unidad compartida (id 5)** (la unidad que comparten los alias
**A3–A8**). Se dio de alta —con estado **201**— cinco recursos; la **visibilidad quedó confirmada por
lectura real de cada alias** (`GET` 200 con el registro visible en su conjunto).

| Recurso | OP | `id` creado | Estado |
|---|---|---:|---:|
| Polígono | `OP-RNG-002` | **2** | 201 |
| Lección | `OP-LES-002` | **2** | 201 |
| Fracción | `OP-FRC-002` | **2** | 201 |
| Ejercicio | `OP-EJR-002` | **19** | 201 |
| Arma | `OP-WPN-002` | **17** | 201 |

Manifest: [`seed-dev-content-2026-10-16.json`](./seed-dev-content-2026-10-16.json) (`schema:
frontend-t11-seed-dev-content/v1`).

### 2.2 Vía ORM de desarrollo — única posible

Dos recursos **no** pudieron sembrarse por API: el alta de **consumo de munición** por API está
**imposible** (§5, hallazgo §8). Se sembraron por **ORM de desarrollo** (`manage.py shell`), **sin tocar
código backend, sin arreglar el endpoint**, sobre la base de desarrollo:

| Recurso | OP | `id` creado | Vía |
|---|---|---:|---|
| Consumo de munición | `OP-CMN-002` | **1** | ORM (API rota, §8) |
| Consumo de arma | `OP-CAR-002` | **1** | ORM (dependencia §8) |

El consumo de arma se dio de alta por ORM porque su prerrequisito —el consumo de munición— tampoco se pudo
crear por API. Manifest: [`seed-dev-content-orm.json`](./seed-dev-content-orm.json) (`schema:
frontend-t11-seed-dev-content-orm/v1`).

> 📜 **Procedencia honesta.** Los cinco recursos de §2.1 se crearon por la **API real** con sesión de
> producto. Los dos recursos de §2.2 se insertaron por **ORM de desarrollo**: **no** hubo llamada API que
> los creara (la API los rechaza), y así queda consignado. La vía por ORM **no** se presenta como un alta
> de API exitosa.

### 2.3 Marcadores y reversibilidad

- **Marcador de nombre:** prefijo **`DEV`**.
- **Marcador de observaciones:** `Contenido de desarrollo (seed 2026-10-16)`.

El contenido sembrado es **reversible e identificable**: cada registro lleva el prefijo de nombre `DEV` y/o
la observación `Contenido de desarrollo (seed 2026-10-16)`, y cada uno tiene **id fijo** (§2.1 y §2.2). La
reversibilidad es por **marcador e id**, no por heurística.

### 2.4 Nota honesta — altas ejercitadas por A1: NO certificadas

Las **altas** ejercitadas por **A1** durante la siembra (`OP-RNG-002`, `OP-LES-002`, `OP-FRC-002`,
`OP-EJR-002`, `OP-WPN-002`) quedan como **observación del seed** y **NO** se certifican en la matriz: su
estado de celda **no** cambia. El re-barrido certifica exclusivamente las **lecturas** `GET` de §3.

---

## 3. El re-barrido

Ejecutado el **2026-10-16** con el **mismo módulo v2** (el único certificable), **después** de la siembra.
Las 8 sesiones son las reales de cada alias, acreditadas **por correspondencia** (login `POST
/api/auth/login/` desde la UI en **200** y contexto `GET /api/auth/context/` en **200** con el rol primario
esperado activo; `alias_matched: true` en los ocho). **Sin cookies fabricadas y sin mutación alguna**:
`mutations: []`, `page_errors: []`.

| Alias | Rol primario | Login | Contexto | `active_role` |
|---|---|:---:|:---:|---|
| **A1** | `super_admin` | 200 | 200 | `super_admin` |
| **A2** | `tenant_admin` | 200 | 200 | `tenant_admin` |
| **A3** | `admin_unidad` | 200 | 200 | `admin_unidad` |
| **A4** | `comandante_unidad` | 200 | 200 | `comandante_unidad` |
| **A5** | `oficial_tiro` | 200 | 200 | `oficial_tiro` |
| **A6** | `oficial_observador` | 200 | 200 | `oficial_observador` |
| **A7** | `encargado_almacen` | 200 | 200 | `encargado_almacen` |
| **A8** | `tirador` | 200 | 200 | `tirador` |

### 3.1 Clasificación

| Clase | Condición | Celdas | Efecto |
|---|---|:---:|---|
| `MATCH_ALLOW` | `EXPECTED_ALLOW`/`SCOPED` + **2xx** real | 84 | `NOT_EXERCISED` → `OBSERVED_OK` |
| `SERVER_FAILURE` | respuesta **500** (fallo de servidor, no de autorización) | 3 | sin cambio |
| `UNPROBEABLE` | `sin_filas_propias` (listado propio 200 y vacío) | 4 | sin cambio |
| `mismatch` (allow↔deny) | discrepancia de autorización | **0** | — |
| `OTHER` | cualquier otra respuesta | **0** | — |

**0 desajustes** de autorización (`mismatch_deny_for_allow: 0`, `mismatch_allow_for_deny: 0`) y **0**
respuestas «otras». **0** placeholders de sondeo en esta pasada (`placeholders_used: []`): la siembra
permitió resolver el `{id}` con un **identificador propio** en las 84 celdas certificadas.

### 3.2 Celdas certificadas (84)

`NOT_EXERCISED` → `OBSERVED_OK`, todas `MATCH_ALLOW` (2xx). Orden de actores `A1…A8`.

| OP | Método + endpoint | Actores certificados | Celdas |
|---|---|---|:---:|
| `OP-CAR-003` | `GET /consumos-arma/{id}/` | A1, A2, A3, A4, A5, A6, A7, A8 | 8 |
| `OP-CMN-003` | `GET /consumos-municion/{id}/` | A1, A2, A3, A4, A5, A6, A7, A8 | 8 |
| `OP-EJR-003` | `GET /ejercicios/{id}/` | A4, A8 | 2 |
| `OP-FRC-003` | `GET /fracciones/{id}/` | A3, A4, A5, A6, A7, A8 | 6 |
| `OP-FRC-007` | `GET /fracciones/{id}/tiradores/` | A3, A4, A5, A6, A7, A8 | 6 |
| `OP-FRC-008` | `GET /fracciones/{id}/resultados/` | A3, A4, A5, A6, A7, A8 | 6 |
| `OP-LES-003` | `GET /lecciones/{id}/` | A3, A4, A5, A6, A7 | 5 |
| `OP-LES-007` | `GET /lecciones/{id}/fracciones/` | A3, A4, A5, A6, A7 | 5 |
| `OP-LES-008` | `GET /lecciones/{id}/usuarios/` | A3, A4, A5, A6, A7 | 5 |
| `OP-LES-009` | `GET /lecciones/{id}/resultados/` | A3, A4, A5, A6, A7 | 5 |
| `OP-LES-010` | `GET /lecciones/{id}/resultados-resumen/` | A3, A4, A5, A6, A7 | 5 |
| `OP-LES-011` | `GET /lecciones/{id}/reporte/` | A3, A4, A5, A6, A7 | 5 |
| `OP-LES-012` | `GET /lecciones/{id}/tiradores-elegibles/` | A3, A4, A5, A6, A7 | 5 |
| `OP-RNG-003` | `GET /poligonos/{id}/` | A3, A4, A5, A6, A7, A8 | 6 |
| `OP-RNG-007` | `GET /poligonos/{id}/lecciones/` | A3, A4, A5, A6, A7, A8 | 6 |
| `OP-WPN-003` | `GET /armas/{id}/` | A4 | 1 |
| | | **Total** | **84** |

> 🕯️ **Paradoja del §9 documentada, no ocultada.** `OP-LES-009` A3–A7 se **certifican** (200): leen la
> **lección sembrada (id 2)**, que **no tiene resultados** que renderizar, y por eso **no** disparan el
> fallo. Los mismos actores en `OP-LES-003/007/008/010/011/012` también certifican. En cambio A1/A2/A8 de
> `OP-LES-009` son **500** (§5) porque su lección propia **sí** tiene resultados: el fallo **solo** aparece
> cuando hay resultados que renderizar.

### 3.3 Celdas no certificadas (7)

**a) Fallos de servidor (3).** Respuesta **500**: fallo del endpoint, no de autorización. Siguen
`NOT_EXERCISED`.

| OP | Método + endpoint | Actores | Observado | Referencia |
|---|---|---|:---:|---|
| `OP-LES-009` | `GET /lecciones/{id}/resultados/` | A1, A2, A8 | 500 | §9 (500 conocido) |

**b) Listas RBAC sin filas (4).** Listado propio **200 y vacío** (`sin_filas_propias`): terreno **auth**, sin
autorización explícita del operador para sembrar filas. Siguen `NOT_EXERCISED`. Detalle por `op/actor` en el
JSON (§7).

| OP | Método + endpoint | Actores | `list` propio | Motivo |
|---|---|---|:---:|---|
| `OP-OVR-003` | `GET /authz/overrides/{id}/` | A1, A2 | 200, `count: 0` | sin overrides propios |
| `OP-PPR-003` | `GET /authz/position-permissions/{id}/` | A1, A2 | 200, `count: 0` | sin permiso-posición propio |
| | | **Total** | | **4** |

> 📜 El seed **excluyó explícitamente** `OP-OVR-003`/`OP-PPR-003` (filas RBAC): son terreno auth y quedan
> **pendientes de decisión del operador** (§5).

---

## 4. La certificación resultante

Los **84** flips se derivan **exclusivamente** del JSON del barrido; el script de certificación
(`.cache/frontend-acceptance/2026-10-16/read-sweep-certify-2026-10-16.post-seed.cjs`) solo valida: celda en
`NOT_EXERCISED`, expectativa del probe **idéntica** a la de la matriz, `MATCH_ALLOW` con 2xx. Ante cualquier
desajuste **aborta** (`BLOCKED`, sin escribir). Cuadró: **0 desajustes**. La comparación estructural contra
la copia de reversión confirmó que **solo** cambiaron los 84 estados certificados, `cell_state_counts`, la
evidencia de **16** filas y `observations`.

| Estado | Antes | Después | Δ |
|---|---:|---:|---:|
| `OBSERVED_OK` | 567 | **651** | +84 |
| `PARTIAL` | 7 | **7** | 0 |
| `NOT_EXERCISED` | 746 | **662** | −84 |
| Total | 1320 | **1320** | — |

- **Recuento:** **567/7/746 → 651/7/662** sobre 1320, obtenido recorriendo 165 filas × 8 actores.
- **Evidencia de fila:** las **16** filas afectadas reciben, al final de su campo `evidence` y **sin** borrar
  el texto previo, la frase con `Actualización 2026-10-16: barrido de lecturas post-siembra …`.
- **Backup:** `.cache/frontend-acceptance/2026-10-16/acceptance-matrix.before-read-sweep.post-seed.json`
  (pre-estado: 567/7/746).
- **Observación:** `observations.read_sweep_post_seed_2026_10_16` en la matriz.

La matriz de entrada cuadró con la expectativa derivada de **C-4**
([`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md),
§1–§4): **0 discrepancias** en las 84 celdas certificadas.

---

## 5. Pendientes

- **4 celdas RBAC sin filas** (`OP-OVR-003` A1/A2 y `OP-PPR-003` A1/A2): **pendiente de decisión del
  operador**. Es terreno auth, fuera de la orden de siembra. Siguen `NOT_EXERCISED`.
- **3 fallos de servidor** (`OP-LES-009` A1/A2/A8, 500): **hallazgo §9**.

### 5.1 Hallazgo §9 — traza capturada

`GET /api/lecciones/{id}/resultados/` responde **500** por `NameError: name 'primary_unit' is not
defined` en **`apipoligono/views.py:882`** (el nombre disponible es `get_primary_unit`). **Crashea solo
cuando hay resultados que renderizar**: la lección sin resultados → **200** (observado con la lección
sembrada, A3–A7); las lecciones con resultados → **500** (A1/A2/A8). Deuda **§9**
([`backend-debt.md`](../../../../bugs/backend-debt.md)). **No** se propone ni aplica fix.

### 5.2 Hallazgo §8 — traza capturada

`POST /api/consumos-municion/` responde **500** con `sqlite3.IntegrityError: NOT NULL constraint failed:
apipoligono_consumomunicion.calibre_id` en **`apipoligono/serializers.py:500`**: el `create()` inserta
**antes** de resolver el calibre y el FK es `NOT NULL`. El alta por API es **imposible con cualquier
payload** — causa de la vía ORM de §2.2. Deuda **§8** ([`backend-debt.md`](../../../../bugs/backend-debt.md)).
**No** se propone ni aplica fix.

---

## 6. Invariantes y límites

- **El `NOT_VERIFIED` persiste.** `status_global` sigue **`NOT_VERIFIED`** y `global_conclusion` sigue
  **`NO_CUMPLIDO`**, sin cambios. `expected_by_actor` intacto.
- **Solo se certifican lecturas.** Las **altas** ejercitadas por A1 en la siembra (`OP-RNG-002`/`LES-002`/
  `FRC-002`/`EJR-002`/`WPN-002`) quedan como **observación del seed** y **no** cambian su estado de celda.
- **La lectura certificada acredita concesión, no el conjunto visible.** Las 84 certificadas son lecturas
  `ALLOW`/`SCOPED` en 2xx; un 2xx afirma permiso concedido sobre un recurso del propio conjunto visible.
- **Celdas no certificadas.** Las **4** RBAC y los **3** §9 **siguen `NOT_EXERCISED`**: no se promueven ni
  se degradan.
- **Sin tocar lo ajeno al encargo.** Toda celda fuera de las 84 certificadas quedó intacta (verificado por
  comparación estructural contra el backup).
- **Sin escrituras de producto.** Solo lectura y reescritura del JSON de la matriz; sin `git add`/`commit`;
  sin servidores ni navegador. El contenido de desarrollo está **marcado** y es **reversible** (§2.3).
- **Script fuera de `evidence`.** El script de certificación **no** se copia a este directorio; vive en
  `.cache`. Las fuentes JSON del seed y del barrido **sí** tienen copia durable (§7).

> 🕯️ Este documento **no** afirma completitud del producto ni emite veredicto de aceptación. No contiene
> secretos, cookies, RUT, correos, nombres de personas ni códigos de tenant o unidad: solo ids de recurso,
> alias de actor, rutas, estados HTTP y referencias de deuda. La unidad se cita como **unidad compartida
> (id 5)** y el entorno como **tenant de desarrollo**.

---

## 7. Fuentes

| # | Fuente | Aporta |
|---|---|---|
| 1 | [`seed-dev-content-2026-10-16.json`](./seed-dev-content-2026-10-16.json) | Manifest de la siembra por **API** (sesiones, ids creados, verificación de visibilidad por alias) |
| 2 | [`seed-dev-content-orm.json`](./seed-dev-content-orm.json) | Manifest de la siembra por **ORM** (consumos), con la traza del §8 |
| 3 | [`read-sweep-2026-10-16.post-seed.json`](./read-sweep-2026-10-16.post-seed.json) | Barrido post-siembra (91 probes, sesiones, listas, clasificación y detalle `op/actor`) |
| 4 | [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json) | Matriz con los efectos del re-barrido (`observations.read_sweep_post_seed_2026_10_16`, 84 flips, 16 anexos) |
| 5 | [`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md) | Origen de `expected_by_actor` (C-4, §1–§4) |
| 6 | `.cache/frontend-acceptance/2026-10-16/read-sweep-certify-2026-10-16.post-seed.cjs` | Script ejecutado (no copiado a `evidence`): 84 flips, 16 anexos, comparación estructural PASS |

Backup previo al re-barrido: `.cache/frontend-acceptance/2026-10-16/acceptance-matrix.before-read-sweep.post-seed.json`.
Barrido previo (referencia): [`read-sweep-2026-10-16.md`](./read-sweep-2026-10-16.md).
Plan de cierre: [`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md).
