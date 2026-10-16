---
actualizado: 2026-10-16
---

# Pasada de certificación de contenido — conjuntos visibles SCOPED (2026-10-16)

> 🕯️ **Qué es y qué no.** Registro documental de la **primera pasada de certificación de *contenido***
> sobre las condiciones de conjunto visible de **C-4** (§4.3 / §4.4): la rama de **unidades** de A3/A7 y
> las **lecciones** visibles de A6/A8 se contrastaron contra el total de A1 para comprobar que son
> **subconjunto** y que el filtro por actor está activo. Es lectura **pura** de la API con sesión real.
> **No** cambia ningún estado de celda, **no** toca `cell_state_counts` (385 / 7 / 928), **no** altera
> `status_global` ni `global_conclusion`, y **no** propone ni aplica arreglos.

## Índice

1. [Qué es](#1-qué-es) · 2. [Método](#2-método) · 3. [Resultados](#3-resultados) · 4. [Límites](#4-límites) · 5. [Fuentes](#5-fuentes)

---

## 1. Qué es

La certificación esperado-vs-observado del mismo día
([`certification-pass.md`](./certification-pass.md)) cubrió la clase **inequívoca**: la denegación real
(`403`) que coincide con `EXPECTED_DENY`. Quedó fuera, por su propia regla dura, el **conjunto visible**:
las celdas `EXPECTED_ALLOW_SCOPED`, donde el permiso se concede pero *lo que el actor ve* depende de datos
(§4.3 de C-4). Esta pasada ataca exactamente esa deuda: contrasta el conjunto que cada actor **efectivamente
recibe** contra el total del actor sin filtro, sobre los recursos con condición de rama (unidades) y de
participación (lecciones).

> 📜 **Denominador de la pasada:** las condiciones de conjunto de §4.3/§4.4 — ramas de unidades de A3/A7 y
> lecciones de A6/A8 (caso tirador puro). **Certificado:** subconjunto estricto con filtro activo.
> **Sin cambios de estado:** ninguna celda se promueve ni se degrada.

---

## 2. Método

**Cinco sesiones acreditadas por correspondencia** —login por UI y lectura de contexto, con el rol
principal coincidente— antes de cualquier lectura de datos:

| Alias | Rol esperado | Login | Contexto |
|---|---|---|---|
| A1 | `super_admin` | `POST /auth/login/` → 200 | `GET /auth/context/` → 200 |
| A3 | `admin_unidad` | `POST /auth/login/` → 200 | `GET /auth/context/` → 200 |
| A7 | `encargado_almacen` | `POST /auth/login/` → 200 | `GET /auth/context/` → 200 |
| A6 | `oficial_observador` | `POST /auth/login/` → 200 | `GET /auth/context/` → 200 |
| A8 | `tirador` | `POST /auth/login/` → 200 | `GET /auth/context/` → 200 |

- **Lecturas directas con sesión real** del **mismo recurso que consume la UI** (`/api/organization-units/`,
  `/api/lecciones/`), actor por actor: se compara el conjunto de cada actor filtrado contra el **total de A1**
  y se verifica la relación de **subconjunto** más el **delta**.
- **UI *sanity* en unidades:** para A3 y A7 se navega a la vista de organización y se cuenta el nodo de árbol
  renderizado (`a.organization-view__tree-link`), confirmando que la UI refleja un conjunto acotado.
- **Participación de A8** (`OP-LES-*`, caso tirador puro): sobre las lecciones visibles de A8 se busca el RUT
  del propio A8 **en memoria** dentro del cuerpo de `/api/lecciones/{id}/usuarios/`; el RUT **no se persiste**.
- **Códigos de unidad y RUT no persistidos:** la evidencia guarda conteos, booleanos y deltas, nunca
  identificadores.
- **Sin mutaciones ni residuo:** `read_only: true`, `mutations: []`, `page_errors: []`; sin cookies fabricadas,
  sin backend reiniciado, sin escrituras de producto.

Script de la pasada: `content-cert-2026-10-16.run.cjs` (copiado a este directorio). Salida:
`content-cert-2026-10-16.json` (copiado a este directorio).

---

## 3. Resultados

### 3.1 Unidades — ramas de A3 y A7 (`EXPECTED_ALLOW_SCOPED`, §4.3)

Total de A1: **12** unidades. Ambas ramas son **subconjunto estricto** del total, con el filtro activo.

| Actor | Conjunto visible | Lectura | Subconjunto de A1 | Delta | UI (nodo de árbol) |
|---|---|:---:|:---:|:---:|:---:|
| A1 (`super_admin`) | 12 | 200 | — (total) | — | — |
| A3 (`admin_unidad`) | 1 | 200 | ✔ | 11 | 1 |
| A7 (`encargado_almacen`) | 1 | 200 | ✔ | 11 | 1 |

El **delta 11** en cada rama acredita que el dataset actual no contiene unidades ajenas dentro del conjunto
visible de A3/A7, y que la vista de organización renderiza **un** nodo por sesión —consistente con el
conjunto acotado que devuelve la API.

### 3.2 Lecciones — filtro de participación de A6/A8 (§4.3/§4.4)

Dataset actual: **1** lección. El filtro por participación está activo y se manifiesta en los dos extremos.

| Actor | Conjunto visible | Lectura | Subconjunto de A1 | Delta |
|---|---|:---:|:---:|:---:|
| A1 (`super_admin`) | 1 | 200 | — (total) | — |
| A6 (`oficial_observador`) | 0 | 200 | ✔ | 1 |
| A8 (`tirador`) | 1 | 200 | ✔ | 0 |

- **A6 ve 0:** el filtro **excluye** al no participante; el actor observa una lista vacía, no el total.
- **A8 ve 1 y participa:** sobre su única lección visible se comprobó la participación —el RUT de A8 presente
  en `/api/lecciones/{id}/usuarios/`, lectura `200`— con resultado **1 de 1** (`LES-008` visible como A1;
  `checked: 1`, `a8_present: 1`, `a8_absent_ids: []`).

Ambos conjuntos son subconjunto del total de A1, y el caso tirador puro de A8 queda confirmado: ve la
lección **porque participa en ella**, no por el total.

---

## 4. Límites

- **Dataset mínimo.** La certificación vale para el dataset **actual**: **1** lección y una rama de A3 hoy
  **sin descendientes**. Un delta de 11 en unidades y de 0/1 en lecciones describen lo que hay, no lo que
  habrá.
- **No se extrapola.** El resultado **no** se generaliza a otros actores, otros recursos ni a datasets
  futuros: sólo se certificó la condición de conjunto sobre estos dos recursos y estos cinco actores.
- **Conjuntos visibles dependientes de datos.** Aun con el subconjunto confirmado hoy, los conjuntos
  visibles **siguen dependiendo de datos futuros** (§4.3/§4.4 de C-4): alta de descendientes, nuevas
  lecciones o nuevas participaciones pueden cambiar los conteos sin cambiar el permiso.
- **Sin cambios de estado en la matriz.** Esta pasada es **solo lectura**: ninguna celda se promueve ni se
  degrada; `cell_state_counts` sigue **385 `OBSERVED_OK` / 7 `PARTIAL` / 928 `NOT_EXERCISED`** y el estado
  global sigue **`NOT_VERIFIED` / `NO_CUMPLIDO`**.
- **Sin backend, base de datos ni escrituras de producto.** Sólo lectura con sesión real; **sin**
  `git add`/`commit`.
- **Códigos de unidad y RUT ausentes de la evidencia.** Persisten conteos, booleanos y deltas; ningún
  identificador.

> 🕯️ Este documento **no** afirma completitud del producto ni emite veredicto de aceptación. No contiene
> secretos, cookies, RUT, correos ni nombres de personas: sólo alias de actor, rutas, estados HTTP y conteos.

---

## 5. Fuentes

| # | Fuente | Aporta |
|---|---|---|
| 1 | [`evidence/2026-10-16/content-cert-2026-10-16.json`](./content-cert-2026-10-16.json) | Salida de la pasada: sesiones acreditadas, conteos, subconjuntos, deltas, participación y `read_only` |
| 2 | [`evidence/2026-10-16/content-cert-2026-10-16.run.cjs`](./content-cert-2026-10-16.run.cjs) | Script ejecutado (copia byte a byte): lecturas por actor, comparación de subconjunto, *sanity* de UI y sonda de participación |
| 3 | [`coverage/actor-permission-matrix-2026-10-15.md`](../../coverage/actor-permission-matrix-2026-10-15.md) | §4.3 (`EXPECTED_ALLOW_SCOPED` — condición de rama y de participación) y §4.4 (`INDETERMINABLE_STATIC`) |

Pasada previa del mismo día (clase inequívoca `EXPECTED_DENY`): [`certification-pass.md`](./certification-pass.md).
Registro de la pasada en la matriz: `observations.content_certification_pass_2026_10_16` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).
Plan de cierre: [`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md).
