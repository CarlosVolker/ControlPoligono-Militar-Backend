---
spec_meta: "../../spec-meta.yaml"
---

# Pantallas — Organización: unidades y recintos

> 📖 Tomo de catálogo del workstream `full-frontend-screens-recovery`. Contratos enlazados: [organización e identidad](../../contracts/organization-identity.md). Códigos de permiso transcritos del mapa verificado `apps/authorization/permissions.py:36–95`. Convenciones generales: [`../screens.md`](../screens.md).

## Índice

1. [SCREEN-UNITS](#screen-units--árbol-de-unidades)
2. [SCREEN-UNIT-DETAIL](#screen-unit-detail--ficha-de-unidad)
3. [SCREEN-PRECINCTS](#screen-precincts--recintos)
4. [SCREEN-PRECINCT-DETAIL](#screen-precinct-detail--ficha-de-recinto)

---

### SCREEN-UNITS — Árbol de unidades

| Atributo | Valor |
|---|---|
| Propósito | Presentar la jerarquía de unidades organizacionales del scope y dar de alta unidades. |
| Ruta | `/organizacion/unidades` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Organización › Unidades. |
| Fuente DS | `ui-list-group.html` / `ui-accordion.html` (árbol por expansión de `parent_code`), `tables-basic.html` como vista alternativa plana, `ui-modal.html` + `forms-basic.html` (alta), `ui-badge.html` (tipo de unidad, estado). |

**Datos y operaciones.** Contrato: [unidades, recintos y migración](../../contracts/organization-identity.md#unidades-recintos-y-migración).

- `OP-UNT-001` `GET /organization-units/` — colección del scope; el árbol se construye client-side con `parent`/`parent_code` (`requirements.md` §8: jerarquía resuelta en cliente).
- `OP-UNT-002` `POST /organization-units/` — alta (modal).
- `OP-UNT-009` `GET /organization-units/lookup/` — FL/selectores: lookup de unidades activas del tenant para selectores de otras pantallas (integración justificada: componente selector compartido, sin pantalla propia; `R-DOM-ORG-007`: vacío, sin coincidencias y denegado son estados distintos).

**Acciones y formularios.** Alta: `code`, `name` requeridos; `parent`, `unit_type`, `is_active` editables; selector de tipo limitado a `command`, `division`, `regiment`, `battalion`, `company`, `section`, `squad`, `staff`, `range`, `other` (`R-DOM-ORG-004`). El envío excluye `id`, `tenant`, `parent_code` (`R-DOM-ORG-005`). Selector de padre desde la consulta de elegibles, sin asumir que el listado visible contiene toda la rama (`R-DOM-ORG-003`, vía `OP-UNT-010` cuando el flujo lo exija).

**Controles de acceso.** `organization_unit:read → view_unit`; `organization_unit:create → create_unit` (mapa verificado). Raíz requiere admin (contrato). Denegación por tenant/rama/permiso es explícita y no modifica la representación local (`R-DOM-ORG-006`).

**Estados y criterios observables.** Unidad sin `parent_code` rotulada como raíz; con él, relación por código y nombre resuelto desde la respuesta disponible o `—` (`R-DOM-ORG-002`); sin inferir ramas no entregadas; selección conservada al abrir detalle (`R-DOM-ORG-001`); éxito de alta muestra la unidad devuelta y actualiza el árbol (`R-DOM-ORG-005`).

**Navegación.** Nodo ⇒ SCREEN-UNIT-DETAIL. Deep link al árbol con contexto reconstruido.

---

### SCREEN-UNIT-DETAIL — Ficha de unidad

| Atributo | Valor |
|---|---|
| Propósito | Ver y editar una unidad, y ejecutar su eliminación con previsualización y migración. Integra FL/eliminar-unidad: previsualización y confirmación son pasos de un mismo flujo sobre este recurso (integración justificada). |
| Ruta | `/organizacion/unidades/:idUnidad` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | `idUnidad`. Breadcrumb: Inicio › Organización › Unidades › {name o code} (cadena completa de ancestros si la respuesta los provee; si no, sólo el nivel disponible). |
| Fuente DS | `ui-card.html` (datos), `ui-list-group.html` (relaciones), `ui-modal.html` (edición, previsualización de eliminación, confirmación con destino), `ui-alerts.html` (advertencia de assignments no reasignados), `ui-toasts.html`. |

**Datos y operaciones.**

- `OP-UNT-003` `GET /organization-units/{id}/` — carga.
- `OP-UNT-004` / `OP-UNT-005` `PUT`/`PATCH` — edición compartida (mismo formulario del alta, prefillado).
- `OP-UNT-006` `DELETE /organization-units/{id}/` — eliminación simple por CRUD (poco usada: el flujo declarado de eliminación es el de migración; si se expone, confirmación destructiva igual).
- `OP-UNT-007` `GET …/previsualizar-eliminacion/` — paso 1 obligatorio: ocho contadores `assignments`, `weapons`, `ranges`, `lessons`, `fractions`, `results`, `child_units`, `lessons_as_participant` (`R-DOM-ORG-008`).
- `OP-UNT-008` `POST …/eliminar-con-migracion/` — paso 2: body `{target_unit_code?}`; respuesta `{detail, target_unit_code, moved}`.
- `OP-UNT-010` `GET /me/assignable-units/` — FL/selectores: unidades elegibles para el selector de destino de migración (integración justificada: selector, no pantalla; `R-DOM-ORG-003`, `R-DOM-ORG-010`).

**Acciones y formularios.** Eliminar con migración en dos pasos bloqueantes: (1) previsualización — la confirmación final permanece bloqueada hasta que la respuesta corresponda a la unidad seleccionada (`R-DOM-ORG-008`); (2) confirmación — advertencia **literal** de que el contrato sólo informa el conteo de `assignments` y no promete reasignar puestos (`R-DOM-ORG-009`, `R-RUL-10`); destino `target_unit_code` desde elegibles o ausente sólo si el usuario acepta que el backend use el padre; sin padre ⇒ destino explícito obligatorio antes de enviar; la propia unidad no es destino válido (`R-DOM-ORG-010`, `R-RUL-09`: `400` «La unidad no tiene padre. Indica target_unit_code para migrar.»).

**Controles de acceso.** `organization_unit:read → view_unit`; `organization_unit:update → update_unit`; `organization_unit:delete → delete_unit` (mapa verificado; cubre `OP-UNT-006/007/008`).

**Estados y criterios observables.** Éxito de `eliminar-con-migracion` ⇒ mostrar `detail`, `target_unit_code`, `moved` y refrescar unidades y listados abiertos afectados; `400/403/404` ⇒ confirmación abierta con el motivo y sin eliminar filas locales (`R-DOM-ORG-011`). Edición: valores conservados ante `400` con validación del backend visible (`R-DOM-ORG-005`).

**Navegación.** Atrás ⇒ SCREEN-UNITS. Enlaces: padre e hijas → SCREEN-UNIT-DETAIL; recintos que la contienen → SCREEN-PRECINCT-DETAIL; tras eliminación exitosa ⇒ retorno al árbol. Deep link operativo.

---

### SCREEN-PRECINCTS — Recintos

| Atributo | Valor |
|---|---|
| Propósito | Listar recintos del tenant y administrarlos por CRUD. |
| Ruta | `/organizacion/recintos` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Organización › Recintos. |
| Fuente DS | `tables-basic.html`, `ui-modal.html` + `forms-basic.html` (alta/edición), `ui-badge.html` (`is_active`, `unit_count`), estados estándar. |

**Datos y operaciones.** Contrato: [unidades, recintos y migración](../../contracts/organization-identity.md#unidades-recintos-y-migración) (filas Recinto).

- `OP-RCT-001` `GET /recintos/` — listado por tenant, orden name.
- `OP-RCT-002` `POST /recintos/` — alta.
- `OP-RCT-004` / `OP-RCT-005` `PUT`/`PATCH` — edición compartida.
- `OP-RCT-006` `DELETE /recintos/{id}/` — eliminación: confirmación destructiva, refresco sólo tras éxito; el contrato no declara migración automática de sus unidades y la UI no la promete (`R-DOM-ORG-017`).
- `OP-RCT-003` `GET /recintos/{id}/` — lectura de detalle (prefill y ficha).

**Acciones y formularios.** Alta/edición: `code`, `name` requeridos; `description`, `is_active` y colección `units` (PK[]) opcionales según flujo CRUD; `id`, `tenant`, `unit_codes`, `unit_count` son sólo lectura y se omiten del envío (`R-DOM-ORG-013`).

**Controles de acceso.** `recinto:read → view_recinto`; `recinto:create/update/delete → manage_recinto` (mapa verificado).

**Estados y criterios observables.** Columnas `code`, `name`, `description`, `is_active`, `unit_codes`, `unit_count` del contrato (`R-DOM-ORG-012`); guardado correcto refresca detalle y listado (`R-DOM-ORG-014`); cancelar descarta sólo cambios no enviados.

**Navegación.** Fila ⇒ SCREEN-PRECINCT-DETAIL. Deep link con contexto reconstruido.

---

### SCREEN-PRECINCT-DETAIL — Ficha de recinto

| Atributo | Valor |
|---|---|
| Propósito | Ver un recinto y administrar su relación con unidades. Integra FL/recinto-unidades: agregar/quitar unidad operan sobre este recurso y refrescan su panel (integración justificada). |
| Ruta | `/organizacion/recintos/:idRecinto` — **propuesta nueva** (extensión del patrón de detalle; `technical-design.md` §4 sólo fija `/organizacion/recintos`). `meta.requiresTenant`. |
| Params / breadcrumbs | `idRecinto`. Breadcrumb: Inicio › Organización › Recintos › {name o code}. |
| Fuente DS | `ui-card.html` (datos), `ui-list-group.html` (unidades relacionadas), `ui-modal.html` (agregar unidad, confirmación de quitar), `ui-toasts.html`. |

**Datos y operaciones.**

- `OP-RCT-003` `GET /recintos/{id}/` — carga.
- `OP-RCT-007` `POST /recintos/{id}/agregar-unidad/{unit_code}/` — agregar por código: selector de unidad desde datos reales (lookup `OP-UNT-009`); mostrar el `unit_count` devuelto y refrescar ambas relaciones; `404`/denegación sin insertar relación local (`R-DOM-ORG-015`).
- `OP-RCT-008` `DELETE /recintos/{id}/quitar-unidad/{unit_code}/` — confirmación que identifica recinto y código; al éxito mostrar `unit_count` devuelto; relación ausente es error explícito, no éxito idempotente (`R-DOM-ORG-016`).
- `OP-RCT-004` / `OP-RCT-005` — edición del recinto desde la ficha (mismo editor que el listado).

**Acciones y formularios.** Según contrato enlazado; sin promesa de cascadas ni de efectos sobre `Position.recinto` más allá de lo declarado (el campo recinto de un puesto sólo actúa con scope `todo_recinto`, `AGENTS.md` §Gotchas — se muestra como nota informativa donde aplique).

**Controles de acceso.** `recinto:read → view_recinto`; `recinto:update → manage_recinto` cubre `OP-RCT-007/008` (inventario: `recinto:update`) (mapa verificado).

**Estados y criterios observables.** `unit_codes` y `unit_count` siempre desde la respuesta, nunca contados localmente; vacío ≠ error ≠ denegado.

**Navegación.** Atrás ⇒ SCREEN-PRECINCTS. Enlace por unidad ⇒ SCREEN-UNIT-DETAIL. Deep link operativo.
