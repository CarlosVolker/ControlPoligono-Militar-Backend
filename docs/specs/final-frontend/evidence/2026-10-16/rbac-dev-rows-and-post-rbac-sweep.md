---
actualizado: 2026-10-16
---

# Filas RBAC de desarrollo y tercer barrido de lecturas (2026-10-16)

> 🕯️ **Qué es y qué no.** Tomo de evidencia de tres hechos del **2026-10-16**: (1) la **siembra de las
> filas RBAC de desarrollo** que habilita las celdas `OP-OVR-003` y `OP-PPR-003` de A1–A2 —orden del
> operador, «siembra todo»—; (2) el **defecto estructural** que hace **imposible** el alta de overrides por
> **API**, con su traza y su localización; y (3) el **tercer barrido de lecturas** (posterior a la siembra
> RBAC), que ejercita las 7 celdas `GET` restantes y **certifica 4** (`NOT_EXERCISED` → `OBSERVED_OK`) sobre
> la matriz de aceptación [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).
> **No** emite veredicto de aceptación, **no** cambia `status_global` ni `global_conclusion` y **no** propone
> ni aplica arreglos.

## Índice

1. [Qué es](#1-qué-es) · 2. [Las dos filas RBAC](#2-las-dos-filas-rbac) · 3. [El alta de overrides por API](#3-el-alta-de-overrides-por-api-defecto-estructural) · 4. [El tercer barrido](#4-el-tercer-barrido) · 5. [La certificación resultante](#5-la-certificación-resultante) · 6. [El pendiente único](#6-el-pendiente-único) · 7. [Invariantes y límites](#7-invariantes-y-límites) · 8. [Fuentes](#8-fuentes)

---

## 1. Qué es

La matriz de aceptación tiene **1320 celdas** (165 filas `OP-*` × 8 actores). El **re-barrido
post-siembra** ([`seed-dev-content-and-post-seed-sweep.md`](./seed-dev-content-and-post-seed-sweep.md))
dejó **7 celdas sin certificar**: **4** del terreno **RBAC** (`OP-OVR-003` y `OP-PPR-003`, A1–A2) —«sin
filas propias», excluidas entonces por ser terreno auth y quedar **pendientes de decisión del
operador**— y **3** fallos de servidor (`OP-LES-009` A1/A2/A8, deuda §9).

El operador ordenó **«siembra todo»**: sembrar las **filas RBAC de desarrollo** para `OP-OVR-003` y
`OP-PPR-003` de A1–A2. Con las filas creadas, un **tercer barrido** (mismo módulo **v2**) ejercitó las **7
celdas objetivo** restantes: el listado propio de A1 y A2 ya **no** venía vacío, de modo que el `{id}` del
detalle pudo resolverse con un **identificador propio** y la lectura directa quedó observada.

> 📜 **Denominador del tercer barrido:** 7 objetivos `GET`. **Certificados:** 4 (`MATCH_ALLOW`, 2xx real).
> **Sin certificar:** 3 (`SERVER_FAILURE`, `OP-LES-009` A1/A2/A8 → 500). **0** desajustes de autorización.

---

## 2. Las dos filas RBAC

Se sembraron **dos filas**, una por cada celda objetivo del terreno RBAC. La procedencia es **distinta por
vía** y así queda consignada, con su **neutralidad** verificada y sus **marcadores de reversibilidad**.

| # | Recurso | `id` | Vía | `permission` | `allowed` | Neutralidad |
|---|---|---:|---|---|---|---|
| 1 | `PositionPermission` (`OP-PPR-003`) | **2** | **API real** (`POST` por A1 → **201**) | `view_audit_logs` (id 33) | `true` | Sobre el **puesto 4** (`admin_unidad`, **unidad 4**) **sin asignación activa** (verificado por lectura ORM 2026-10-16): la fila **no** altera los permisos efectivos de ninguna cuenta |
| 2 | `UserPermissionOverride` (`OP-OVR-003`) | **1** | **ORM de desarrollo** (única vía posible; §3) | `view_audit_logs` | `true` | Sobre la **cuenta de A1 (id 2)** (`super_admin`, bypass total): un `ALLOW` de un permiso que A1 **ya** posee; permisos efectivos **sin cambio** |

### 2.1 Procedencia honesta por vía

- La fila de **`PositionPermission`** se creó por **API real** con la sesión acreditada de **A1**; ya
  **preexistía** de una corrida previa del mismo día (id 2), por lo que la corrida de siembra no la
  duplicó (`status: EXISTENTE`, `pre_existing: true`).
- La fila de **`UserPermissionOverride`** se creó por **ORM de desarrollo** (`manage.py shell`): **no**
  hubo llamada API que la creara, porque la API la **rechaza** con un defecto **estructural** (§3). La vía
  por ORM **no** se presenta como un alta de API exitosa.

### 2.2 Neutralidad verificada

- **Override (A1):** A1 es `super_admin` con **bypass total**; el `ALLOW` individual recae sobre un permiso
  que A1 ya ejerce por bypass. La precedencia `DENY > ALLOW > rol > bypass` **no** se ve afectada: **no**
  hay `DENY` en juego. Permisos efectivos **sin cambio**.
- **`PositionPermission` (puesto 4):** el puesto **no** tiene **asignación activa** (verificado por lectura
  ORM el 2026-10-16). Una fila de permiso sobre un puesto **sin titular** no altera los permisos efectivos
  de ninguna cuenta: es una **fila neutra**.

### 2.3 Marcador y reversibilidad

- **Marcador:** `Contenido de desarrollo (seed 2026-10-16)` (en el `reason` del override; misma etiqueta de
  la siembra de contenido del mismo día).
- **Reversibilidad por marcador e id:** ambas filas se identifican por su **marcador** y por su **id fijo**
  —`PositionPermission` id **2**, `UserPermissionOverride` id **1**—. La reversibilidad es **por marcador e
  id**, no por heurística.

> 📜 **Sin tocar código.** La siembra de las dos filas **no** tocó el backend ni el serializer ni el
> endpoint: la fila del override se insertó por ORM de desarrollo precisamente porque la vía API está rota
> (§3), y el endpoint **no** se arregló (`no_code_touched: true`).

---

## 3. El alta de overrides por API: defecto estructural

El alta de `UserPermissionOverride` por **API** es **imposible**. El `POST /api/authz/overrides/` con la
sesión real de **A1** respondió **500**; el payload inválido había dado **400** previo, de modo que el
defecto **no** depende del payload: **dispara en todo** payload **válido**.

| | |
|---|---|
| **Síntoma** | `POST /api/authz/overrides/` → **500** (payload válido) |
| **Traza** | `AssertionError: Unable to create UniqueTogetherValidator for UserPermissionOverride.permission as UserPermissionOverrideSerializer has multiple fields (permission, permission_code) that map to this model field` |
| **Localización del defecto** | `UserPermissionOverrideSerializer` en `apps/authorization/serializers.py:55-75`: `permission_code` declara `source='permission'` (línea 61) y su `Meta.fields` expone **ambos** campos —`permission` y `permission_code`— (líneas 67-72), que **mapean al mismo** campo del modelo |
| **Localización del disparo** | DRF `serializers.py:1601`, durante `is_valid()` → `run_validators()` → `get_unique_together_validators()` |
| **Naturaleza** | **Defecto estructural del serializer**: la construcción de los validadores `UniqueTogether` falla por el **doble campo** (`permission`, `permission_code`) con el mismo `source`. No es una validación del payload |
| **Consecuencia** | El alta por API es **imposible con cualquier payload válido**; es la causa de que la fila del override de §2 se creara por **ORM de desarrollo** |
| **Registro de deuda** | [`docs/bugs/backend-debt.md`](../../../../bugs/backend-debt.md), entrada fechada **2026-10-16** |

> 🕯️ Esta sección **consigna** la traza y la localización del defecto; **no** propone ni aplica
> reparación, **no** modifica backend ni contratos y **no** anticipa el resultado de una corrección.

---

## 4. El tercer barrido

Ejecutado el **2026-10-16** con el **mismo módulo v2** (el único certificable), **después** de la siembra
RBAC de §2. Las sesiones son las reales de cada alias, acreditadas **por correspondencia** (login `POST
/api/auth/login/` desde la UI en **200** y contexto `GET /api/auth/context/` en **200** con el rol primario
esperado activo; `alias_matched: true`). **Sin cookies fabricadas y sin mutación alguna**: `read_only:
true`, `mutations: []`, `page_errors: []`.

Para A1 y A2, el listado propio **ya no** venía vacío: `GET /api/authz/overrides/` y `GET
/api/authz/position-permissions/` devolvieron **200** con `count: 1` en cada uno, y el `{id}` del detalle
se resolvió con un **identificador propio** (`used: "propio"`). **Cero** placeholders de sondeo
(`placeholders_used: []`).

### 4.1 Clasificación

| Clase | Condición | Celdas | Efecto |
|---|---|:---:|---|
| `MATCH_ALLOW` | `EXPECTED_ALLOW` + **200** real | **4** | `NOT_EXERCISED` → `OBSERVED_OK` |
| `SERVER_FAILURE` | respuesta **500** (fallo de servidor, no de autorización) | **3** | sin cambio |
| `mismatch` (allow↔deny) | discrepancia de autorización | **0** | — |
| `OTHER` | cualquier otra respuesta | **0** | — |

**0 desajustes** de autorización (`mismatch_deny_for_allow: 0`, `mismatch_allow_for_deny: 0`) y **0**
respuestas «otras».

### 4.2 Celdas certificadas (4)

`NOT_EXERCISED` → `OBSERVED_OK`, todas `MATCH_ALLOW` (200 real, con identificador propio).

| OP | Método + endpoint | Actores certificados | Celdas |
|---|---|---|:---:|
| `OP-OVR-003` | `GET /authz/overrides/{id}/` | A1, A2 | 2 |
| `OP-PPR-003` | `GET /authz/position-permissions/{id}/` | A1, A2 | 2 |
| | | **Total** | **4** |

### 4.3 Celdas no certificadas (3)

**Único motivo: fallo de servidor.** Respuesta **500**: fallo del endpoint, **no** de autorización. Siguen
`NOT_EXERCISED`.

| OP | Método + endpoint | Actores | Observado | Referencia |
|---|---|---|:---:|---|
| `OP-LES-009` | `GET /lecciones/{id}/resultados/` | A1, A2, A8 | 500 | §9 (500 conocido; §6) |

---

## 5. La certificación resultante

Los **4** flips se derivan **exclusivamente** del JSON del barrido; el script de certificación
(`.cache/frontend-acceptance/2026-10-16/read-sweep-certify-2026-10-16.post-rbac.cjs`) solo valida: celda en
`NOT_EXERCISED`, expectativa del probe **idéntica** a la de la matriz, `MATCH_ALLOW` con 2xx. Ante cualquier
desajuste **aborta** (`BLOCKED`, sin escribir). Cuadró: **0 desajustes**. La comparación estructural contra
la copia de reversión confirmó que **solo** cambiaron los 4 estados certificados, `cell_state_counts`, la
evidencia de **2** filas y `observations`.

| Estado | Antes | Después | Δ |
|---|---:|---:|---:|
| `OBSERVED_OK` | 651 | **655** | +4 |
| `PARTIAL` | 7 | **7** | 0 |
| `NOT_EXERCISED` | 662 | **658** | −4 |
| Total | 1320 | **1320** | — |

- **Recuento:** **651/7/662 → 655/7/658** sobre 1320, obtenido recorriendo 165 filas × 8 actores.
- **Evidencia de fila:** las **2** filas afectadas (`OP-OVR-003`, `OP-PPR-003`) reciben, al final de su
  campo `evidence` y **sin** borrar el texto previo, la frase `Actualización 2026-10-16: barrido de lecturas
  tras la siembra RBAC (filas de desarrollo) — …`.
- **Backup:** `.cache/frontend-acceptance/2026-10-16/acceptance-matrix.before-read-sweep.post-rbac.json`
  (pre-estado: **651**/7/**662**).
- **Observación:** `observations.read_sweep_post_rbac_seed_2026_10_16` añadida a la matriz.

La matriz de entrada cuadró con la expectativa derivada de **C-4**
([`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md),
§1–§4): **0 discrepancias** en las 4 celdas certificadas. Con esto, el **carril de lecturas `GET`** queda
**resuelto salvo los 3 del §9**.

---

## 6. El pendiente único

- **3 celdas `OP-LES-009`** (A1/A2/A8): **500** por `NameError: name 'primary_unit' is not defined` en
  `apipoligono/views.py:882` (el nombre disponible es `get_primary_unit`). **Crashea solo cuando hay
  resultados que renderizar**: la lección **sin** resultados → **200**; las lecciones **con** resultados →
  **500**. Deuda **§9** ([`backend-debt.md`](../../../../bugs/backend-debt.md)). **No** se propone ni aplica
  fix.

Es el **único pendiente** del carril de lecturas: las 4 celdas RBAC que antes estaban «sin filas» quedaron
**certificadas** en este tercer barrido.

### 6.1 Nota honesta — altas ejercitadas por A1: NO certificadas

Las **altas** ejercitadas por **A1** durante la siembra RBAC quedan como **observación del seed** y **NO** se
certifican en la matriz: su estado de celda **no** cambia. En concreto:

- `OP-OVR-002` (alta de override por **API**): **no concluida** por el defecto **estructural** de §3.
- `OP-PPR-002` (alta de `PositionPermission` por **API**): **201** observado (fila id 2).

Estas altas son **observación** del seed y **no** se promueven a `OBSERVED_OK` en este tomo; el tercer
barrido certifica **exclusivamente** las **lecturas** `GET` de §4.

---

## 7. Invariantes y límites

- **El `NOT_VERIFIED` persiste.** `status_global` sigue **`NOT_VERIFIED`** y `global_conclusion` sigue
  **`NO_CUMPLIDO`**, sin cambios. `expected_by_actor` intacto (794 `EXPECTED_ALLOW` / 505 `EXPECTED_DENY` /
  21 `EXPECTED_ALLOW_SCOPED`).
- **Solo se certifican lecturas.** Las **altas** ejercitadas por A1 en la siembra RBAC (`OP-OVR-002` no
  concluida, `OP-PPR-002` 201) quedan como **observación del seed** y **no** cambian su estado de celda.
- **La lectura certificada acredita concesión, no el conjunto visible.** Las 4 certificadas son lecturas
  `ALLOW` en 200; un 200 afirma permiso concedido sobre un recurso del **propio** conjunto visible, no que
  el conjunto de filas sea el correcto para el actor.
- **Celdas no certificadas.** Las **3** de `OP-LES-009` **siguen `NOT_EXERCISED`**: no se promueven ni se
  degradan.
- **Sin tocar lo ajeno al encargo.** Toda celda fuera de las 4 certificadas quedó intacta (verificado por
  comparación estructural contra el backup).
- **Sin escrituras de producto.** Solo lectura y reescritura del JSON de la matriz; sin `git add`/`commit`;
  sin servidores ni navegador. Las filas RBAC están **marcadas** y son **reversibles por marcador e id**
  (§2.3).
- **Script fuera de `evidence`.** El script de certificación **no** se copia a este directorio; vive en
  `.cache`. Las fuentes JSON del seed RBAC y del tercer barrido **sí** tienen copia durable (§8).

> 🕯️ Este documento **no** afirma completitud del producto ni emite veredicto de aceptación. No contiene
> secretos, cookies, RUT, correos, nombres de personas ni códigos de tenant o unidad: solo ids de recurso,
> alias de actor, rutas, estados HTTP y referencias de deuda. La unidad se cita como **unidad 4** y el
> puesto como **puesto 4**; la cuenta, como **cuenta de A1 (id 2)**; el entorno, como **tenant de
> desarrollo**.

---

## 8. Fuentes

| # | Fuente | Aporta |
|---|---|---|
| 1 | [`seed-rbac-2026-10-16.json`](./seed-rbac-2026-10-16.json) | Manifest de la corrida de siembra **por API** (sesiones A1/A2, resolución del permiso `view_audit_logs` id 33, `PositionPermission` **preexistente** id 2, fallo **500** del override) |
| 2 | [`seed-rbac-orm-2026-10-16.json`](./seed-rbac-orm-2026-10-16.json) | Manifest de la siembra **por ORM** (las dos filas, procedencia por vía, neutralidad, marcador, reversibilidad y la traza del §3) |
| 3 | [`read-sweep-2026-10-16.post-rbac.json`](./read-sweep-2026-10-16.post-rbac.json) | Tercer barrido (7 probes, sesiones, listas propias de A1/A2, clasificación y detalle `op/actor`) |
| 4 | [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json) | Matriz con los efectos del tercer barrido (`observations.read_sweep_post_rbac_seed_2026_10_16`, 4 flips, 2 anexos) |
| 5 | [`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md) | Origen de `expected_by_actor` (C-4, §1–§4) |
| 6 | `.cache/frontend-acceptance/2026-10-16/read-sweep-certify-2026-10-16.post-rbac.cjs` | Script ejecutado (no copiado a `evidence`): 4 flips, 2 anexos, comparación estructural PASS |

Backup previo al tercer barrido: `.cache/frontend-acceptance/2026-10-16/acceptance-matrix.before-read-sweep.post-rbac.json`
(pre-estado: 651/7/662). Re-barrido previo (referencia):
[`seed-dev-content-and-post-seed-sweep.md`](./seed-dev-content-and-post-seed-sweep.md). Plan de cierre:
[`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md).
