---
spec_meta: "../spec-meta.yaml"
---

# Tasks — Ejercicios y consumos (T-FL-EXC, T-FL-CMN, T-FL-CAR)

> 📖 Yo registro aquí las ocho tareas de la cadena ejercicios → consumo de munición →
> consumo de arma. Regla de familia conservada del volumen de flujos: `ConsumoMunicion`
> y `ConsumoArma` tienen alcance **sólo tenant**, sin unidad propia: la UI no intenta
> inyectarla (R-DOM-EXC-006). Las preferencias de apariencia legacy de ese contrato
> viven en [appearance.md](appearance.md), no aquí. Pasos y shapes **no se copian**:
> cada tarea cita su ancla `FL-*`. Índice y reglas: [../tasks.md](../tasks.md). Ninguna
> tarea está autorizada a ejecutarse.

## Bloque común de la familia

- **Dependencias comunes:** T-CORE-TYPES, T-CORE-HTTP, T-CORE-SESSION, T-CORE-ROUTER
  (`/tiro/ejercicios[/:idEjercicio]`, `/tiro/consumos-municion`,
  `/tiro/consumos-arma`), T-CORE-UI.
- **Archivos probables** (raíz `front/src/`): `api/exercises.ts`,
  `stores/exercises.ts`, `views/tiro/ExercisesView.vue`,
  `views/tiro/ExerciseDetailView.vue`, `views/tiro/AmmoConsumptionView.vue`,
  `views/tiro/WeaponConsumptionView.vue`, `components/exercises/*`. Todos con
  `<script setup lang="ts">`.
- **Consumo cruzado:** los selectores de calibre y arma consumen `api/armory.ts`
  (OP-CAL-001, OP-WPN-001) y los de unidades participantes `api/organization.ts`
  (OP-UNT-009) **sin** requerir la UI de esas familias (regla del DAG).
- **Convención de AC:** hogar canónico único por OP. **Reserva declarada:** OP-CAR-001
  (listado) y OP-CAR-003 (detalle) no tienen FL de consulta propio; su hogar canónico es
  T-FL-CAR-001 (la superficie de listado donde viven el alta y la edición), conforme a
  [../experience/screens.md](../experience/screens.md) §Cobertura (SCREEN-WEAPON-CONSUMPTION).

---

## T-FL-EXC-001 — Consulta de ejercicios

| Campo | Valor |
|---|---|
| Objetivo | Listado y ficha de ejercicios con `—` en valores ausentes, búsqueda/orden client-side y enlaces a sus consumos al recargarlos. |
| Flujo | [FL-EXC-001](../experience/flows/exercises.md#fl-exc-001--consulta-de-ejercicios) |
| OP (AC canónicos) | OP-EJR-001, OP-EJR-003 |
| SCREEN | [SCREEN-EXERCISES, SCREEN-EXERCISE-DETAIL](../experience/screens/exercises.md) — DS `tables-basic.html` + `ui-card.html` |
| Requisitos | R-DOM-EXC-001 (campos del contrato; `—` en ausentes). |
| Precondiciones / dependencias | Bloque común. |
| Archivos probables | `views/tiro/ExercisesView.vue`, `views/tiro/ExerciseDetailView.vue`, `api/exercises.ts`. |
| Done when | Lista y ficha muestran sólo datos devueltos; los enlaces a consumos existen sólo cuando las relaciones están presentes. |

**Criterios.**

- **AC-OP-EJR-001:** array con `id_ejercicio`, nombre, fecha, zona, tipo,
  observaciones, participantes codes, tenant, unidad, `created_at`; vacío ⇒ ST-03;
  `403` ⇒ ST-07.
- **AC-OP-EJR-003:** la ficha muestra el objeto completo; `404` ⇒ F-04.

---

## T-FL-EXC-002 — Alta y edición de ejercicio

| Campo | Valor |
|---|---|
| Objetivo | Editor con `nombre`*, `fecha`*, opcionales documentados, `tipo_ejercicio` limitado a `asalto|defensa|movimiento|mixto|otro` y participantes por `unidades_participantes_codes_write`; sin participantes escritos se muestra la unidad efectiva retornada, **sin** participantes sintéticos; `PUT`/`PATCH` comparten editor. |
| Flujo | [FL-EXC-002](../experience/flows/exercises.md#fl-exc-002--alta-y-edición-de-ejercicio) |
| OP (AC canónicos) | OP-EJR-002, OP-EJR-004, OP-EJR-005 |
| SCREEN | [SCREEN-EXERCISES](../experience/screens/exercises.md#screen-exercises--ejercicios-militares) y ficha (editor compartido) — DS `forms-flatpicker.html` para fecha |
| Requisitos | R-DOM-EXC-002 (campos y selector de tipo limitado); R-DOM-EXC-003 (unidad efectiva; sin sintéticos); R-DOM-EXC-004 (refresco de detalle y listado; cancelar descarta sólo lo no enviado; errores junto al selector o como denegación según la forma de la respuesta). |
| Precondiciones / dependencias | Selector de unidades participantes desde T-FL-ORG-006 (API). |
| Archivos probables | `components/exercises/ExerciseFormModal.vue`. |
| Done when | El ejercicio creado/editado muestra los datos devueltos, incluida la unidad efectiva cuando no se escribieron participantes. |

**Criterios.**

- **AC-OP-EJR-002 / AC-OP-EJR-004 / AC-OP-EJR-005:** `201`/`200` ⇒ ST-06 y refresco de
  detalle y listado; `400` ⇒ F-01 con errores junto al selector o denegación según la
  respuesta; `403` ⇒ F-02; `404` (edición) ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09.

---

## T-FL-EXC-003 — Eliminación de ejercicio

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 que identifica por nombre y fecha; consumos relacionados se refrescan sólo tras éxito; sin prometer eliminación en cascada si la respuesta no la declara. |
| Flujo | [FL-EXC-003](../experience/flows/exercises.md#fl-exc-003--eliminación-de-ejercicio) |
| OP (AC canónicos) | OP-EJR-006 |
| SCREEN | [SCREEN-EXERCISES](../experience/screens/exercises.md#screen-exercises--ejercicios-militares) / [SCREEN-EXERCISE-DETAIL](../experience/screens/exercises.md#screen-exercise-detail--ficha-de-ejercicio) |
| Requisitos | R-DOM-EXC-005 (confirmación; refresco sólo tras éxito; sin promesa de cascada). |
| Precondiciones / dependencias | T-FL-EXC-001. |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | El ejercicio desaparece sólo tras éxito; ningún efecto de cascada se rotula si la respuesta no lo declara. |

**Criterios.**

- **AC-OP-EJR-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06 y refresco de consumos
  relacionados; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local.

---

## T-FL-CMN-001 — Consulta de consumos de munición

| Campo | Valor |
|---|---|
| Objetivo | Listado y detalle del primer nivel de consumo con `—` en ausentes; el recurso **no** muestra ni envía unidad propia (sólo tenant); la ficha enlaza a su ejercicio y a sus consumos de arma. |
| Flujo | [FL-CMN-001](../experience/flows/exercises.md#fl-cmn-001--consulta-de-consumos-de-munición) |
| OP (AC canónicos) | OP-CMN-001, OP-CMN-003 |
| SCREEN | [SCREEN-AMMO-CONSUMPTION](../experience/screens/exercises.md#screen-ammo-consumption--consumos-de-munición) — DS `tables-basic.html` |
| Requisitos | R-DOM-EXC-006 (campos; sin unidad propia ni inyectada); R-DOM-EXC-010 vía enlaces (sólo con ids/relaciones presentes, aplica análogamente al nivel 1). |
| Precondiciones / dependencias | Bloque común; el filtrado «por ejercicio» desde SCREEN-EXERCISE-DETAIL es client-side sobre el array plano (R-RES-22; no existe endpoint de consumos por ejercicio y no se inventa). |
| Archivos probables | `views/tiro/AmmoConsumptionView.vue`, `api/exercises.ts`. |
| Done when | La lista muestra sólo consumos devueltos; el detalle enlaza a ejercicio y nivel 2 cuando las relaciones existen. |

**Criterios.**

- **AC-OP-CMN-001:** array con `id_consumo`, ejercicio, tipo/modelo de arma,
  `calibre_code`, cantidades, `es_aproximado`, observaciones; vacío ⇒ ST-03; `403` ⇒
  ST-07; sin columna ni envío de unidad.
- **AC-OP-CMN-003:** el detalle muestra el objeto y sus enlaces reales; `404` ⇒ F-04.

---

## T-FL-CMN-002 — Alta y edición de consumo de munición

| Campo | Valor |
|---|---|
| Objetivo | Editor con `ejercicio`*, `tipo_arma`* (6 valores del dominio), `cantidad_tiros`* y opcionales (`modelo_arma`, `calibre_code_write`, `cantidad_armas`, `es_aproximado`, `observaciones`); el calibre write resuelve un calibre **activo** del catálogo y el calibre RO devuelto se muestra tal cual; el calibre **no se deduce** desde tipo o modelo: si el usuario no lo elige, queda ausente/`—`. |
| Flujo | [FL-CMN-002](../experience/flows/exercises.md#fl-cmn-002--alta-y-edición-de-consumo-de-munición) |
| OP (AC canónicos) | OP-CMN-002, OP-CMN-004, OP-CMN-005 |
| SCREEN | [SCREEN-AMMO-CONSUMPTION](../experience/screens/exercises.md#screen-ammo-consumption--consumos-de-munición) |
| Requisitos | R-DOM-EXC-007 (campos y selector de tipo limitado); R-DOM-EXC-008 (calibre activo desde catálogo; calibre RO devuelto; prohibida la deducción). |
| Precondiciones / dependencias | Selector de ejercicio desde T-FL-EXC-001 (API); selector de calibre desde T-FL-CAL-001 (API, calibres activos). |
| Archivos probables | `components/exercises/AmmoConsumptionFormModal.vue`. |
| Done when | El consumo guardado muestra el `calibre_code` RO devuelto; ningún calibre aparece sin elección del usuario. |

**Criterios.**

- **AC-OP-CMN-002 / AC-OP-CMN-004 / AC-OP-CMN-005:** `201`/`200` ⇒ ST-06 y refresco;
  `400` (incluido calibre inactivo o no resuelto) ⇒ F-01 sobre el selector; `403` ⇒
  F-02; `404` (edición) ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09.

---

## T-FL-CMN-003 — Eliminación de consumo de munición

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 que identifica ejercicio y cantidades; ejercicio y consumos asociados se refrescan sólo después del éxito; `400`/`403`/relaciones inexistentes no se convierten en ceros ni en éxito visual. |
| Flujo | [FL-CMN-003](../experience/flows/exercises.md#fl-cmn-003--eliminación-de-consumo-de-munición) |
| OP (AC canónicos) | OP-CMN-006 |
| SCREEN | [SCREEN-AMMO-CONSUMPTION](../experience/screens/exercises.md#screen-ammo-consumption--consumos-de-munición) |
| Requisitos | R-DOM-EXC-009 (confirmación; refresco sólo tras éxito; fallo nunca como ceros ni éxito visual). |
| Precondiciones / dependencias | T-FL-CMN-001. |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | El consumo desaparece sólo tras éxito; ante fallo las cifras visibles siguen siendo las del servidor. |

**Criterios.**

- **AC-OP-CMN-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06 y refresco; `403` ⇒ F-02; `404` ⇒
  F-04; red ⇒ F-06 sin borrado local ni ceros inventados.

---

## T-FL-CAR-001 — Alta y edición de consumo de arma

| Campo | Valor |
|---|---|
| Objetivo | Segundo nivel: `consumo`*, `arma`*, `cantidad_tiros`* (FKs directas) y `observaciones` opcional, con selectores poblados **sólo** desde respuestas reales de consumos accesibles (OP-CMN-001) y armas accesibles (OP-WPN-001) — nunca registros de muestra; la duplicidad consumo+arma se ancla en la relación de arma conservando el formulario. Cubre las lecturas reservadas del nivel (OP-CAR-001/003). |
| Flujo | [FL-CAR-001](../experience/flows/exercises.md#fl-car-001--alta-y-edición-de-consumo-de-arma) |
| OP (AC canónicos) | OP-CAR-002, OP-CAR-004, OP-CAR-005; **reserva:** OP-CAR-001, OP-CAR-003 |
| SCREEN | [SCREEN-WEAPON-CONSUMPTION](../experience/screens/exercises.md#screen-weapon-consumption--consumos-por-arma) — DS `tables-basic.html` |
| Requisitos | R-DOM-EXC-010 (campos mostrados; enlaces a detalle sólo con ids/relaciones presentes); R-DOM-EXC-011 (selectores desde respuestas reales); R-DOM-EXC-012 (duplicidad anclada con formulario conservado). |
| Precondiciones / dependencias | T-FL-CMN-001 (consumos accesibles, API); T-FL-WPN-001 (armas accesibles, API). |
| Archivos probables | `views/tiro/WeaponConsumptionView.vue`, `components/exercises/WeaponConsumptionFormModal.vue`. |
| Done when | La relación creada/editada muestra `id_consumo_arma` y los datos devueltos; el listado enlaza a consumo padre y arma sólo cuando los ids existen. |

**Criterios.**

- **AC-OP-CAR-001 (reserva):** `GET /consumos-arma/` ⇒ listado con `id_consumo_arma`,
  consumo, arma, `cantidad_tiros`, observaciones; vacío ⇒ ST-03; `403` ⇒ ST-07; filtrado
  «por consumo padre» client-side (nivel 2 desde SCREEN-AMMO-CONSUMPTION).
- **AC-OP-CAR-002 / AC-OP-CAR-004 / AC-OP-CAR-005:** `201`/`200` ⇒ ST-06 y refresco de
  la relación del consumo padre al recargarla; duplicidad consumo+arma ⇒ F-05 en la
  relación de arma conservando el formulario; `400` resto ⇒ F-01; `403` ⇒ F-02; `404`
  (edición) ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09.
- **AC-OP-CAR-003 (reserva):** `GET /consumos-arma/{id}/` sirve de prefill al editor;
  `404` ⇒ F-04.

---

## T-FL-CAR-002 — Eliminación de consumo de arma

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 que identifica consumo y arma; la relación del consumo padre se actualiza únicamente tras éxito; prohibido recalcular o suponer stock restante (no es dato contractual del recurso). |
| Flujo | [FL-CAR-002](../experience/flows/exercises.md#fl-car-002--eliminación-de-consumo-de-arma) |
| OP (AC canónicos) | OP-CAR-006 |
| SCREEN | [SCREEN-WEAPON-CONSUMPTION](../experience/screens/exercises.md#screen-weapon-consumption--consumos-por-arma) |
| Requisitos | R-DOM-EXC-013 (confirmación; actualización sólo tras éxito; sin stock supuesto). |
| Precondiciones / dependencias | T-FL-CAR-001. |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | La relación desaparece sólo tras éxito; ninguna cifra de «stock restante» aparece en la UI. |

**Criterios.**

- **AC-OP-CAR-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06 y actualización del consumo padre;
  `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local.

---

> 🕯️ La transferencia de stock entre armerías no existe como endpoint (D-02): ninguna
> tarea de este volumen la simula con operaciones de consumo (R-DOM-EXC-014). El hueco
> se reporta; no se parchea.
