---
spec_meta: "../../spec-meta.yaml"
---

# Pantallas — Almacén: armerías, armas y calibres

> 📖 Tomo de catálogo del workstream `full-frontend-screens-recovery`. Contratos enlazados: [armerías](../../contracts/organization-identity.md#armorias), [armas y calibres](../../contracts/domain-shooting.md#armas-y-calibres). Códigos de permiso transcritos del mapa verificado `apps/authorization/permissions.py:36–95`. Convenciones generales: [`../screens.md`](../screens.md).

> 🕯️ **Nota de transcripción.** El manifiesto (`backend-inventory.md`:52–57,108–113) abrevia el control de armas/armerías como «`warehouse`» y derivados. El mapa verificado declara los códigos literales `view_warehouse`, `create_warehouse_records`, `update_warehouse_records`, `delete_warehouse_records` para los pares `weapon:*` y `armory:*`. Este catálogo usa los literales verificados y no deduce códigos desde la etiqueta abreviada. La divergencia se reporta al orquestador; no se edita el inventario (fuera de write set).

## Índice

1. [SCREEN-ARMORIES](#screen-armories--armerías)
2. [SCREEN-WEAPONS](#screen-weapons--armas)
3. [SCREEN-WEAPON-DETAIL](#screen-weapon-detail--ficha-de-arma)
4. [SCREEN-CALIBERS](#screen-calibers--calibres)

---

### SCREEN-ARMORIES — Armerías

| Atributo | Valor |
|---|---|
| Propósito | Administrar armerías (almacenes) del scope y su relación con armas y unidad. |
| Ruta | `/almacen/armerias` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Almacén › Armerías. |
| Fuente DS | `tables-basic.html` (listado con `armas_count`), `ui-modal.html` + `forms-basic.html`/`forms-validation.html` (alta/edición), `ui-badge.html` (`is_active`), confirmación destructiva en `ui-modal.html`. |

**Datos y operaciones.** Contrato: [armerías](../../contracts/organization-identity.md#armorias).

- `OP-ARM-001` `GET /armorias/` — listado.
- `OP-ARM-002` `POST /armorias/` — alta.
- `OP-ARM-003` `GET /armorias/{id}/` — lectura de detalle (prefill del editor y panel de relaciones; no se propone ruta de detalle propia: la edición y las relaciones se resuelven en modal sobre el listado, integración justificada por coherencia con `technical-design.md` §4).
- `OP-ARM-004` / `OP-ARM-005` `PUT`/`PATCH` — edición compartida.
- `OP-ARM-006` `DELETE /armorias/{id}/` — eliminación con confirmación destructiva; no promete reasignación de armas si el contrato no la declara (`R-DOM-ARM-004`).

**Acciones y formularios.** Alta: `code`, `name` requeridos; `descripcion`, `is_active`, `organization_unit_code_write` opcionales; si el selector de unidad no se envía, tras el éxito se muestra la unidad que el backend inyectó (`R-DOM-ARM-002`). Edición: sólo campos editables; jamás `id`, `tenant`, unidad derivada, conteo o timestamps; `organization_unit_code_write` vacío/`null` ⇒ error del campo recibido (`R-DOM-ARM-003`).

**Controles de acceso.** `armory:read → view_warehouse`; `armory:create → create_warehouse_records`; `armory:update → update_warehouse_records`; `armory:delete → delete_warehouse_records` (mapa verificado).

**Estados y criterios observables.** `code`, `name`, `descripcion` (`—` si ausente), `is_active`, unidad derivada, timestamps y `armas_count` visibles (`R-DOM-ARM-001`); éxito refresca listado, detalle y armas relacionadas (`R-DOM-ARM-004`).

**Navegación.** Enlaces: unidad derivada → SCREEN-UNIT-DETAIL; `armas_count` → SCREEN-WEAPONS filtrado por la armería (filtro client-side sobre la colección real, `R-RES-22`). Atrás ⇒ menú Almacén. Deep link operativo.

---

### SCREEN-WEAPONS — Armas

| Atributo | Valor |
|---|---|
| Propósito | Listar y dar de alta las armas del scope. |
| Ruta | `/almacen/armas` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Almacén › Armas. |
| Fuente DS | `tables-basic.html`, `ui-modal.html` + `forms-basic.html` (alta), `ui-badge.html` (tipo de arma), estados estándar. |

**Datos y operaciones.** Contrato: [armas y calibres](../../contracts/domain-shooting.md#armas-y-calibres).

- `OP-WPN-001` `GET /armas/` — listado (tenant+unidad).
- `OP-WPN-002` `POST /armas/` — alta.

**Acciones y formularios.** Alta: `tipo_arma`, `modelo_arma`, `numero_serie` requeridos; selector de tipo limitado a `fusil`, `subfusil`, `pistola`, `francotirador`, `ametralladora`, `apoyo`; `armory_code_write` y `calibre_code_write` sólo mediante selectores de códigos realmente disponibles (`R-DOM-ARM-006`). Rechazo de unicidad `modelo_arma`+`numero_serie` ⇒ error visible sin deduplicar u ocultar el arma existente (`R-DOM-ARM-008`).

**Controles de acceso.** `weapon:read → view_warehouse`; `weapon:create → create_warehouse_records` (mapa verificado; ver nota de transcripción).

**Estados y criterios observables.** Columnas con identificadores, tipo, modelo, serie, armería, unidad derivada y calibre; `—` para calibre o relaciones ausentes (`R-DOM-ARM-005`).

**Navegación.** Fila ⇒ SCREEN-WEAPON-DETAIL. Alta exitosa refresca listado y el `armas_count` de la armería relacionada al recargarla. Deep link operativo.

---

### SCREEN-WEAPON-DETAIL — Ficha de arma

| Atributo | Valor |
|---|---|
| Propósito | Ver, editar y eliminar un arma concreta. |
| Ruta | `/almacen/armas/:idArma` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | `idArma`. Breadcrumb: Inicio › Almacén › Armas › {modelo o id}. |
| Fuente DS | `ui-card.html` (datos), `ui-modal.html` + `forms-validation.html` (edición), `ui-badge.html`, confirmación destructiva en `ui-modal.html`. |

**Datos y operaciones.**

- `OP-WPN-003` `GET /armas/{id}/` — carga.
- `OP-WPN-004` / `OP-WPN-005` `PUT`/`PATCH` — edición compartida: conservar relaciones RO como contexto; enviar relaciones por `*_code_write`, nunca sustituir la armería por `organization_unit`; `armory_code_write` vacío/`null` ⇒ `400` asociado («El arma debe pertenecer a una armoria.», `R-RUL-04`) y formulario conservado (`R-DOM-ARM-007`).
- `OP-WPN-006` `DELETE /armas/{id}/` — eliminación: confirmación, respuesta esperada y refresco de armería/resultados que la referencien sólo si se recargan; sin simular transferencia o sustitución de stock (`R-DOM-ARM-009`; transferencia de stock es capacidad sin endpoint, D-02).

**Acciones y formularios.** Mismos campos del alta (contrato enlazado) con prefill desde la lectura.

**Controles de acceso.** `weapon:read → view_warehouse`; `weapon:update → update_warehouse_records`; `weapon:delete → delete_warehouse_records` (mapa verificado).

**Estados y criterios observables.** Datos RO (tenant, unidad, armory y códigos/nombre, `calibre_code`) diferenciados de los editables; éxito refresca ficha y listado.

**Navegación.** Atrás ⇒ SCREEN-WEAPONS. Enlaces: armería → SCREEN-ARMORIES (modal de detalle sobre listado); calibre → SCREEN-CALIBERS; unidad → SCREEN-UNIT-DETAIL. Deep link operativo.

---

### SCREEN-CALIBERS — Calibres

| Atributo | Valor |
|---|---|
| Propósito | Catálogo global de calibres: lectura para selectores de armas y consumos; mutación exclusiva de `super_admin`. |
| Ruta | `/almacen/calibres` — fijada en `technical-design.md` §4. `meta.requiresTenant` para lectura; las mutaciones no dependen del tenant (catálogo global) pero la pantalla sigue exigiendo sesión. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Almacén › Calibres. |
| Fuente DS | `tables-basic.html`, `ui-modal.html` + `forms-basic.html` (alta/edición sólo `super_admin`), `ui-badge.html` (`is_active`). |

**Datos y operaciones.** Contrato: [armas y calibres](../../contracts/domain-shooting.md#armas-y-calibres) (fila Calibre).

- `OP-CAL-001` `GET /calibres/` — listado global.
- `OP-CAL-002` `POST /calibres/` — alta (sólo `super_admin`).
- `OP-CAL-003` `GET /calibres/{id}/` — lectura (prefill).
- `OP-CAL-004` / `OP-CAL-005` `PUT`/`PATCH` — edición compartida (sólo `super_admin`).
- `OP-CAL-006` `DELETE /calibres/{id}/` — baja con confirmación destructiva (sólo `super_admin`).

**Acciones y formularios.** Alta/edición con `code`, `nombre`, `is_active` (`R-DOM-ARM-011`). Contexto no `super_admin` ⇒ catálogo como lectura, sin falsificar capacidad de mutación (botones ausentes, no deshabilitados con tooltip inventado: la restricción se declara con el estado `denied` si el backend responde `403`).

**Controles de acceso.** `calibre:read → view_exercises`; `calibre:manage → manage_calibre` + bypass/rol `super_admin` (mapa verificado; inventario `OP-CAL-002/004/005/006`).

**Estados y criterios observables.** Guardado o eliminación exitosa ⇒ refrescar selectores dependientes (armas, consumos) antes del próximo envío; referencia existente no seleccionable ⇒ valor devuelto como lectura, sin cambiar la relación por iniciativa del cliente (`R-DOM-ARM-012`).

**Navegación.** Atrás ⇒ menú Almacén. Esta pantalla es destino de selector desde armas y consumos; el retorno conserva la pantalla de origen (back del navegador o cierre de modal/selector). Deep link operativo.
