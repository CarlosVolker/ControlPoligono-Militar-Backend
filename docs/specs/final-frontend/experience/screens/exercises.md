---
spec_meta: "../../spec-meta.yaml"
---

# Pantallas — Ejercicios militares y consumos

> 📜 Tomo de catálogo del workstream `full-frontend-screens-recovery`. Contrato enlazado: [ejercicios y consumos](../../contracts/exercises-preferences.md). Códigos de permiso transcritos del mapa verificado `apps/authorization/permissions.py:36–95`. Convenciones generales: [`../screens.md`](../screens.md).

## Índice

1. [SCREEN-EXERCISES](#screen-exercises--ejercicios-militares)
2. [SCREEN-EXERCISE-DETAIL](#screen-exercise-detail--ficha-de-ejercicio)
3. [SCREEN-AMMO-CONSUMPTION](#screen-ammo-consumption--consumos-de-munición)
4. [SCREEN-WEAPON-CONSUMPTION](#screen-weapon-consumption--consumos-por-arma)

---

### SCREEN-EXERCISES — Ejercicios militares

| Atributo | Valor |
|---|---|
| Propósito | Listar los ejercicios militares del scope y dar de alta nuevos. |
| Ruta | `/tiro/ejercicios` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Ejercicios. |
| Fuente DS | `tables-basic.html`, `ui-modal.html` + `forms-basic.html`/`forms-flatpicker.html` (fecha), `ui-badge.html` (`tipo_ejercicio`), estados estándar. |

**Datos y operaciones.** Contrato: [ejercicios y consumos](../../contracts/exercises-preferences.md#ejercicios-y-consumos).

- `OP-EJR-001` `GET /ejercicios/` — listado (tenant+unidad).
- `OP-EJR-002` `POST /ejercicios/` — alta (modal).

**Acciones y formularios.** Alta: `nombre`, `fecha` requeridos; zona, observaciones, campos opcionales de orden/fecha y unidades por `unidades_participantes_codes_write`; selector de tipo limitado a `asalto`, `defensa`, `movimiento`, `mixto`, `otro` (`R-DOM-EXC-002`). Omisión de participantes ⇒ mostrar la unidad efectiva retornada, sin participantes sintéticos (`R-DOM-EXC-003`).

**Controles de acceso.** `ejercicio_militar:read → view_exercises`; `ejercicio_militar:create → create_exercises` (mapa verificado).

**Estados y criterios observables.** `id_ejercicio`, nombre, fecha, zona, tipo, observaciones, unidades participantes, tenant, unidad y `created_at` cuando estén presentes; ausentes `—` (`R-DOM-EXC-001`); guardado/éxito refresca detalle y listado; cancelar descarta cambios no enviados (`R-DOM-EXC-004`).

**Navegación.** Fila ⇒ SCREEN-EXERCISE-DETAIL. Deep link operativo.

---

### SCREEN-EXERCISE-DETAIL — Ficha de ejercicio

| Atributo | Valor |
|---|---|
| Propósito | Ver y editar un ejercicio y navegar a sus consumos de munición y por arma relacionados. |
| Ruta | `/tiro/ejercicios/:idEjercicio` — **propuesta nueva** (extensión del patrón de detalle; `technical-design.md` §4 sólo fija `/tiro/ejercicios`). `meta.requiresTenant`. |
| Params / breadcrumbs | `idEjercicio`. Breadcrumb: Inicio › Ejercicios › {nombre o id}. |
| Fuente DS | `ui-card.html` (datos), `ui-tabs.html` o `ui-list-group.html` (consumos relacionados), `ui-modal.html` (edición, confirmación de baja), `ui-badge.html`. |

**Datos y operaciones.**

- `OP-EJR-003` `GET /ejercicios/{id}/` — carga.
- `OP-EJR-004` / `OP-EJR-005` `PUT`/`PATCH` — edición compartida (mismos campos del alta).
- `OP-EJR-006` `DELETE /ejercicios/{id}/` — eliminación: confirmación que identifica el ejercicio; consumos relacionados se refrescan sólo tras éxito; sin prometer eliminación en cascada si la respuesta no la declara (`R-DOM-EXC-005`).
- Consumos relacionados: se listan desde `OP-CMN-001` / `OP-CAR-001` con filtrado **client-side** por el ejercicio sobre el array plano retornado (`R-RES-22`; no existe endpoint de consumos por ejercicio y no se inventa).

**Acciones y formularios.** Según contrato enlazado; errores de unidades o tenant junto al selector o como denegación según la forma de la respuesta (`R-DOM-EXC-004`).

**Controles de acceso.** `ejercicio_militar:read → view_exercises`; `update → update_exercises`; `delete → delete_exercises` (mapa verificado).

**Estados y criterios observables.** Participantes por código desde la respuesta; `—` en ausentes; sin relleno sintético.

**Navegación.** Atrás ⇒ SCREEN-EXERCISES. Enlaces: consumo de munición ⇒ SCREEN-AMMO-CONSUMPTION (con el ejercicio preseleccionado por estado de navegación, no por query de recurso); unidades participantes ⇒ SCREEN-UNIT-DETAIL. Deep link operativo.

---

### SCREEN-AMMO-CONSUMPTION — Consumos de munición

| Atributo | Valor |
|---|---|
| Propósito | Administrar el primer nivel de consumo: munición por ejercicio, tipo/modelo de arma y calibre. |
| Ruta | `/tiro/consumos-municion` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Ejercicios › Consumos de munición. |
| Fuente DS | `tables-basic.html`, `ui-modal.html` + `forms-basic.html`/`forms-validation.html` (alta/edición), `ui-badge.html` (`es_aproximado`), estados estándar. |

**Datos y operaciones.** Contrato: [ejercicios y consumos](../../contracts/exercises-preferences.md#ejercicios-y-consumos) (fila ConsumoMunicion).

- `OP-CMN-001` `GET /consumos-municion/` — listado (sólo tenant; el recurso no tiene unidad propia y la UI no intenta inyectarla, `R-DOM-EXC-006`).
- `OP-CMN-002` `POST /consumos-municion/` — alta (modal).
- `OP-CMN-003` `GET /consumos-municion/{id}/` — lectura para prefill y enlace a nivel 2.
- `OP-CMN-004` / `OP-CMN-005` `PUT`/`PATCH` — edición compartida.
- `OP-CMN-006` `DELETE /consumos-municion/{id}/` — baja: guardado/confirmación, respuesta esperada y refresco del ejercicio y consumos asociados sólo tras éxito; `400`/`403`/relaciones inexistentes no se convierten en ceros ni en éxito visual (`R-DOM-EXC-009`).

**Acciones y formularios.** Alta/edición: `ejercicio`, `tipo_arma`, `cantidad_tiros` requeridos; `modelo_arma`, `calibre_code_write`, `cantidad_armas`, `es_aproximado`, observaciones opcionales; selector de tipo limitado a `fusil`, `subfusil`, `pistola`, `francotirador`, `ametralladora`, `apoyo` (`R-DOM-EXC-007`). Calibre: `calibre_code_write` de un calibre **activo** del catálogo (SCREEN-CALIBERS como fuente del selector); calibre RO mostrado tal como lo devuelve el backend; sin deducir calibre desde tipo o modelo (`R-DOM-EXC-008`).

**Controles de acceso.** `consumo_municion:read → view_exercises`; `create → create_exercises`; `update → update_exercises`; `delete → delete_exercises` (mapa verificado).

**Estados y criterios observables.** `id_consumo`, ejercicio, tipo/modelo, calibre, cantidades, aproximación y observaciones desde la respuesta (`R-DOM-EXC-006`).

**Navegación.** Atrás ⇒ menú Ejercicios. Enlaces: ejercicio ⇒ SCREEN-EXERCISE-DETAIL; calibre ⇒ SCREEN-CALIBERS; fila ⇒ sus consumos por arma en SCREEN-WEAPON-CONSUMPTION (nivel 2, filtrado client-side por el consumo). Deep link operativo.

---

### SCREEN-WEAPON-CONSUMPTION — Consumos por arma

| Atributo | Valor |
|---|---|
| Propósito | Administrar el segundo nivel de consumo: armas concretas vinculadas a un consumo de munición. |
| Ruta | `/tiro/consumos-arma` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Ejercicios › Consumos por arma. |
| Fuente DS | `tables-basic.html`, `ui-modal.html` + `forms-basic.html` (alta/edición), confirmación destructiva en `ui-modal.html`, estados estándar. |

**Datos y operaciones.** Contrato: [ejercicios y consumos](../../contracts/exercises-preferences.md#ejercicios-y-consumos) (fila ConsumoArma).

- `OP-CAR-001` `GET /consumos-arma/` — listado (sólo tenant).
- `OP-CAR-002` `POST /consumos-arma/` — alta (modal).
- `OP-CAR-003` `GET /consumos-arma/{id}/` — lectura para prefill.
- `OP-CAR-004` / `OP-CAR-005` `PUT`/`PATCH` — edición compartida.
- `OP-CAR-006` `DELETE /consumos-arma/{id}/` — baja: confirmación; relación del consumo padre actualizada sólo tras éxito; sin recalcular ni suponer stock restante (no es dato contractual, `R-DOM-EXC-013`).

**Acciones y formularios.** Alta/edición: `consumo`, `arma`, `cantidad_tiros` requeridos; observaciones opcional; selectores poblados **sólo** desde las respuestas reales de consumos y armas accesibles (`R-DOM-EXC-011`). Duplicidad consumo+arma ⇒ error en la relación de arma con formulario conservado (`R-DOM-EXC-012`).

**Controles de acceso.** `consumo_arma:read → view_exercises`; `create → create_exercises`; `update → update_exercises`; `delete → delete_exercises` (mapa verificado).

**Estados y criterios observables.** `id_consumo_arma`, consumo, arma, `cantidad_tiros`, observaciones desde la respuesta; enlaces a detalle sólo si los IDs/relaciones están presentes (`R-DOM-EXC-010`).

**Navegación.** Atrás ⇒ menú Ejercicios. Enlaces: consumo padre ⇒ SCREEN-AMMO-CONSUMPTION (modal de detalle sobre listado); arma ⇒ SCREEN-WEAPON-DETAIL; ejercicio del consumo ⇒ SCREEN-EXERCISE-DETAIL. Deep link operativo.

---

## Huecos de la familia (sin pantalla, declarados)

🕯️ Capacidades que la UI **no** simula (`R-DOM-EXC-014`; `requirements.md` §8; D-02 abierta, no bloqueante):

| Capacidad | Estado |
|---|---|
| Transferencia de stock entre armerías | Sin endpoint (`transfer_warehouse_material` es permiso sin operación pública). No hay botón ni pantalla. |
| Exportación en servidor (CSV/PDF/XLSX) | `export` es acción de catálogo de permiso, no endpoint (`OP-AZC-001` no acredita implementación). No hay botón de exportar. |
| Validación de resultados de una lección | Sin acción `validar` expuesta (`validate_scores` es permiso sin endpoint). |
| Endpoint de apariencia de 8 ejes | Diseñado en `technical-design.md` §5.3, **no implementado**; se declara en [`appearance.md`](appearance.md). |
