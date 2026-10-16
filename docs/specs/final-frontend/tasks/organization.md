---
spec_meta: "../spec-meta.yaml"
---

# Tasks — Organización: unidades y recintos (T-FL-ORG)

> 📜 Yo registro aquí las doce tareas de organización: consulta y árbol, alta, edición,
> previsualización y eliminación con migración, los dos selectores y la familia completa
> de recintos con su relación M2M por código. Pasos, payloads y literales **no se
> copian**: cada tarea cita su ancla `FL-*`. Índice y reglas:
> [../tasks.md](../tasks.md). Ninguna tarea está autorizada a ejecutarse.

## Bloque común de la familia

- **Dependencias comunes:** T-CORE-TYPES, T-CORE-HTTP, T-CORE-SESSION, T-CORE-ROUTER
  (`/organizacion/unidades[/:idUnidad]`, `/organizacion/recintos[/:idRecinto]`),
  T-CORE-UI (tabla/árbol, modal, ST-10, estados).
- **Archivos probables** (raíz `front/src/`): `api/organization.ts`,
  `stores/organization.ts`, `views/organizacion/UnitsView.vue`,
  `views/organizacion/UnitDetailView.vue`, `views/organizacion/PrecinctsView.vue`,
  `views/organizacion/PrecinctDetailView.vue`, `components/organization/*` (árbol,
  selectores). Todos con `<script setup lang="ts">`.
- **Regla de envío común:** la UI nunca envía `id`, `tenant` ni campos derivados
  (R-RUL-01 vía flujos); las relaciones viajan por el identificador que cada contrato
  pide.
- **Convención de AC:** hogar canónico único por OP. **Reserva declarada:** OP-UNT-006
  (`DELETE` simple de unidad) no tiene FL propio; su hogar canónico es T-FL-ORG-005 con
  la misma ST-10 (el flujo destructivo declarado es el de migración).

---

## T-FL-ORG-001 — Consulta de unidades y árbol

| Campo | Valor |
|---|---|
| Objetivo | Dibujar la jerarquía **client-side** vía `parent`/`parent_code` sobre el array plano retornado, con búsqueda/orden/selección en cliente y navegación a la ficha conservando selección. |
| Flujo | [FL-ORG-001](../experience/flows/organization.md#fl-org-001--consulta-de-unidades-y-árbol) |
| OP (AC canónicos) | OP-UNT-001, OP-UNT-003 |
| SCREEN | [SCREEN-UNITS, SCREEN-UNIT-DETAIL](../experience/screens/organization.md) — DS `ui-list-group.html`/`ui-accordion.html` + `tables-basic.html` |
| Requisitos | R-DOM-ORG-001 (sólo unidades retornadas; selección conservada); R-DOM-ORG-002 (raíz rotulada; relación por código y nombre resuelto desde la respuesta disponible o `—`; sin inferir ramas no entregadas); R-RES-22 vía bloque común (sin paginación inventada). |
| Precondiciones / dependencias | Bloque común. |
| Archivos probables | `api/organization.ts`, `stores/organization.ts`, `views/organizacion/UnitsView.vue`, `components/organization/UnitTree.vue`. |
| Done when | Sólo unidades del contrato están representadas; la selección navega al detalle y se conserva al volver; vacío=ST-03, denegación=ST-07, error de red=ST-04 con reintento explícito. |

**Criterios.**

- **AC-OP-UNT-001:** el árbol se construye en cliente sobre la respuesta de
  `GET /organization-units/`; `200` vacío ⇒ ST-03 (F-11), distinto de ST-04 y ST-07;
  `403` ⇒ ST-07 con `detail` literal (F-02); sin paginación ni filtro de backend
  inventado (G-SES-3).
- **AC-OP-UNT-003:** la ficha muestra el objeto devuelto por
  `GET /organization-units/{id}/`; campo ausente ⇒ `—`; `404` ⇒ F-04 con vuelta al
  listado.

---

## T-FL-ORG-002 — Alta de unidad

| Campo | Valor |
|---|---|
| Objetivo | Alta con `code`*, `name`*, `parent`, `unit_type` (10 valores reales) e `is_active`, excluyendo `id`/`tenant`/`parent_code` del envío; el árbol muestra la unidad **devuelta**, no la del formulario. |
| Flujo | [FL-ORG-002](../experience/flows/organization.md#fl-org-002--alta-de-unidad) |
| OP (AC canónicos) | OP-UNT-002 |
| SCREEN | [SCREEN-UNITS](../experience/screens/organization.md#screen-units--árbol-de-unidades) — modal DS `ui-modal.html` + `forms-basic.html` |
| Requisitos | R-DOM-ORG-003 (selector de padre desde elegibles, sin asumir que el listado visible contiene toda la rama); R-DOM-ORG-004 (campos y 10 `unit_type`); R-DOM-ORG-005 (exclusiones del envío; valores conservados ante `400`; éxito muestra la unidad devuelta); R-DOM-ORG-006 (denegación sin modificar la representación local). Reglas contractuales visibles: parent en rama; raíz sólo admin. |
| Precondiciones / dependencias | T-FL-ORG-001 (listado), T-FL-ORG-007 (selector de padre). |
| Archivos probables | `components/organization/UnitFormModal.vue`. |
| Done when | La nueva unidad aparece en el árbol con los datos del servidor y su detalle queda disponible; ninguna fila local se pintó antes del `201`. |

**Criterios.**

- **AC-OP-UNT-002:** `201` ⇒ ST-06 y refresco de árbol con la unidad devuelta; `400` ⇒
  F-01 con valores conservados (ST-09); `403` (rama o raíz sin admin) ⇒ F-02 literal sin
  cambiar el árbol local; red ⇒ F-06 sin fila optimista; cancelar ⇒ F-09 sin petición.

---

## T-FL-ORG-003 — Edición de unidad

| Campo | Valor |
|---|---|
| Objetivo | Edición desde la ficha con los mismos editables del alta; `PUT` (completo) y `PATCH` (parcial) comparten un único editor y ambos quedan trazados. |
| Flujo | [FL-ORG-003](../experience/flows/organization.md#fl-org-003--edición-de-unidad) |
| OP (AC canónicos) | OP-UNT-004, OP-UNT-005 |
| SCREEN | [SCREEN-UNIT-DETAIL](../experience/screens/organization.md#screen-unit-detail--ficha-de-unidad) en modo edición |
| Requisitos | R-DOM-ORG-005/006 (mismas reglas del alta sobre la ficha). |
| Precondiciones / dependencias | T-FL-ORG-001 (unidad cargada desde OP-UNT-001/003). |
| Archivos probables | `components/organization/UnitFormModal.vue` (prefill), `views/organizacion/UnitDetailView.vue`. |
| Done when | La ficha muestra el objeto devuelto tras el envío; el árbol se refresca con la relación actualizada. |

**Criterios.**

- **AC-OP-UNT-004 / AC-OP-UNT-005:** `200` ⇒ ST-06 y refresco de ficha y árbol; `400` ⇒
  F-01 conservando valores; `403` ⇒ F-02 sin cambio local; `404` ⇒ F-04; cancelar ⇒
  F-09. El editor envía completo (`PUT`) o parcial (`PATCH`) según la interacción, nunca
  campos RO.

---

## T-FL-ORG-004 — Previsualización de eliminación

| Campo | Valor |
|---|---|
| Objetivo | Paso 1 bloqueante del flujo destructivo: `GET` de previsualización con los **ocho contadores** visibles y confirmación final bloqueada hasta que la respuesta corresponda a la unidad seleccionada. |
| Flujo | [FL-ORG-004](../experience/flows/organization.md#fl-org-004--previsualización-de-eliminación) |
| OP (AC canónicos) | OP-UNT-007 |
| SCREEN | [SCREEN-UNIT-DETAIL](../experience/screens/organization.md#screen-unit-detail--ficha-de-unidad) — modal de previsualización (DS `ui-modal.html` + `ui-alerts.html`) |
| Requisitos | R-DOM-ORG-008 (ocho contadores: `assignments, weapons, ranges, lessons, fractions, results, child_units, lessons_as_participant`; bloqueo hasta correspondencia). |
| Precondiciones / dependencias | T-FL-ORG-001/003 (unidad seleccionada). |
| Archivos probables | `components/organization/DeletePreviewModal.vue`. |
| Done when | La confirmación abierta muestra `unit_code`/`unit_name` coincidentes con la unidad elegida y los ocho contadores reales; sin respuesta no hay confirmación. |

**Criterios.**

- **AC-OP-UNT-007:** `{unit_code, unit_name, parent_code, counts}` se pinta completo;
  red ⇒ F-06: la confirmación **no** se abre con contadores inventados; `403` ⇒ F-02;
  `404` ⇒ F-04; `400`/`429` no declarados: si ocurren, F-01/F-03 genéricos.

---

## T-FL-ORG-005 — Eliminación con migración

| Campo | Valor |
|---|---|
| Objetivo | Paso 2: confirmación con destino explícito cuando no hay padre, advertencia **literal** de que `assignments` se informa pero no se reasigna, y refresco de todos los listados afectados sólo tras éxito. Cubre además el `DELETE` simple reservado (OP-UNT-006). |
| Flujo | [FL-ORG-005](../experience/flows/organization.md#fl-org-005--eliminación-con-migración) |
| OP (AC canónicos) | OP-UNT-008; **reserva:** OP-UNT-006 |
| SCREEN | [SCREEN-UNIT-DETAIL](../experience/screens/organization.md#screen-unit-detail--ficha-de-unidad) — confirmación con destino |
| Requisitos | R-DOM-ORG-009 (advertencia literal de conteo-no-reasignación); R-DOM-ORG-010 (destino desde elegibles; propia unidad no seleccionable; sin padre ⇒ destino explícito obligatorio antes de enviar); R-DOM-ORG-011 (éxito muestra `detail`, `target_unit_code`, `moved` y refresca; `400/403/404` mantienen ST-10 abierta sin eliminar filas locales); R-RUL-09 vía flujo (mensaje literal `La unidad no tiene padre. Indica target_unit_code para migrar.`). |
| Precondiciones / dependencias | T-FL-ORG-004 (previsualización exitosa y correspondiente), T-FL-ORG-007 (selector de destino). |
| Archivos probables | `components/organization/DeleteMigrateModal.vue`. |
| Done when | La unidad deja de aparecer tras la recarga; `moved` muestra qué se actualizó en bloque; `assignments` queda informado como conteo, nunca rotulado como migración. |

**Criterios.**

- **AC-OP-UNT-008:** `{target_unit_code?}` ausente usa el padre; raíz sin padre y sin
  destino ⇒ la UI exige destino **antes** de enviar; `200` ⇒ ST-06 con los tres campos y
  refresco de unidades y listados abiertos afectados; `400/403/404` mantienen ST-10
  abierta con el motivo y sin borrado local; red ⇒ F-06; aborto de sesión ⇒ F-07/F-12.
- **AC-OP-UNT-006 (reserva):** si el `DELETE` simple del CRUD se expone en la ficha,
  exige la misma ST-10 y no oculta el registro antes del éxito; el flujo destructivo
  canónico sigue siendo OP-UNT-007/008 (delta de states.md).

---

## T-FL-ORG-006 — Lookup de unidades (selector)

| Campo | Valor |
|---|---|
| Objetivo | Selector compartido sobre `GET /organization-units/lookup/`: presenta exclusivamente `results`, con búsqueda resuelta en cliente y tres estados distintos (vacía, sin coincidencias, denegada). |
| Flujo | [FL-ORG-006](../experience/flows/organization.md#fl-org-006--lookup-de-unidades) |
| OP (AC canónicos) | OP-UNT-009 |
| SCREEN | Integración sin pantalla propia ([screens.md](../experience/screens.md) §Integraciones) — consumidores: T-FL-ORG-011/012 y formularios que lo requieran. |
| Requisitos | R-DOM-ORG-007 (sólo `results`; los tres estados distintos). |
| Precondiciones / dependencias | T-CORE-UI (componente selector compartido). |
| Archivos probables | `components/organization/UnitLookupSelect.vue`. |
| Done when | El flujo consumidor recibe el `code` seleccionado desde datos reales; `results` vacío ⇒ ST-03 sin opciones inventadas. |

**Criterios.**

- **AC-OP-UNT-009:** `{results: OrganizationUnitSerializer[]}` (todas las unidades
  activas del tenant, sin filtro de rama) es la única fuente del selector; `403` ⇒ F-02
  como estado «denegada» propio; red ⇒ F-06.

---

## T-FL-ORG-007 — Unidades asignables (selector)

| Campo | Valor |
|---|---|
| Objetivo | Selector de unidades elegibles (rama del solicitante) para padre, destino de migración y asignaciones; el listado **no** se interpreta como autorización. |
| Flujo | [FL-ORG-007](../experience/flows/organization.md#fl-org-007--unidades-asignables) |
| OP (AC canónicos) | OP-UNT-010 |
| SCREEN | Integración sin pantalla propia — consumidores: T-FL-ORG-002, T-FL-ORG-005, T-FL-IDT-007/009. |
| Requisitos | R-DOM-ORG-003 (no asumir rama completa desde el listado visible); caso contractual explícito: en modo `admin_unidad` sin permitido la respuesta muestra todo el tenant pero el create valida después — la UI no lo lee como autorización. |
| Precondiciones / dependencias | T-CORE-SESSION (contexto del solicitante). |
| Archivos probables | `components/organization/AssignableUnitSelect.vue`. |
| Done when | Los selectores consumidores se pueblan sólo con esta respuesta; una denegación posterior del create se muestra como llegó (F-02). |

**Criterios.**

- **AC-OP-UNT-010:** `{results: OrganizationUnitSerializer[]}` alimenta padre/destino/
  rol; `403` ⇒ F-02; red ⇒ F-06 sin relleno de memoria.

---

## T-FL-ORG-008 — Consulta de recintos

| Campo | Valor |
|---|---|
| Objetivo | Listado de recintos por tenant ordenado por `name` con `unit_codes`/`unit_count` del contrato, y ficha como base del panel de relaciones. |
| Flujo | [FL-ORG-008](../experience/flows/organization.md#fl-org-008--consulta-de-recintos) |
| OP (AC canónicos) | OP-RCT-001, OP-RCT-003 |
| SCREEN | [SCREEN-PRECINCTS, SCREEN-PRECINCT-DETAIL](../experience/screens/organization.md) — DS `tables-basic.html` + `ui-card.html` |
| Requisitos | R-DOM-ORG-012 (campos del contrato; `—` en descripción ausente; detalle conservado para editar la relación). |
| Precondiciones / dependencias | Bloque común. |
| Archivos probables | `views/organizacion/PrecinctsView.vue`, `views/organizacion/PrecinctDetailView.vue`. |
| Done when | La lista y el detalle muestran sólo datos del contrato; vacío=ST-03, denegación=ST-07, error=ST-04 con reintento. |

**Criterios.**

- **AC-OP-RCT-001:** colección con `id, tenant, code, name, description, is_active,
  unit_codes, unit_count`; descripción ausente ⇒ `—`; sin conteo local de unidades.
- **AC-OP-RCT-003:** el detalle expone `unit_codes` y `unit_count` para el panel de
  relaciones (T-FL-ORG-011/012); `404` ⇒ F-04.

---

## T-FL-ORG-009 — Alta y edición de recinto

| Campo | Valor |
|---|---|
| Objetivo | CRUD de recinto con `code`*, `name`*, `description`, `is_active` y colección `units` (PK[]); `id`, `tenant`, `unit_codes` y `unit_count` son sólo lectura y se omiten del envío; los conteos mostrados provienen de la respuesta. |
| Flujo | [FL-ORG-009](../experience/flows/organization.md#fl-org-009--alta-y-edición-de-recinto) |
| OP (AC canónicos) | OP-RCT-002, OP-RCT-004, OP-RCT-005 |
| SCREEN | [SCREEN-PRECINCTS](../experience/screens/organization.md#screen-precincts--recintos) (editor compartido listado/ficha) |
| Requisitos | R-DOM-ORG-013 (campos W y exclusiones RO); R-DOM-ORG-014 (éxito refresca detalle y listado con los valores **retornados**; cancelar descarta sólo lo no enviado). |
| Precondiciones / dependencias | T-FL-ORG-008. |
| Archivos probables | `components/organization/PrecinctFormModal.vue`. |
| Done when | Tras el éxito, `unit_codes` y `unit_count` visibles son los devueltos por el servidor, nunca los del formulario ni contados en cliente. |

**Criterios.**

- **AC-OP-RCT-002 / AC-OP-RCT-004 / AC-OP-RCT-005:** `201`/`200` ⇒ ST-06 y refresco de
  detalle y listado; `400` ⇒ F-01 con ST-09 conservado; `403` ⇒ F-02; `404` (edición) ⇒
  F-04; red ⇒ F-06; cancelar ⇒ F-09. `PUT`/`PATCH` comparten editor (convención de
  screens.md).

---

## T-FL-ORG-010 — Eliminación de recinto

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 y refresco sólo tras éxito; la confirmación **no promete** migración automática de unidades porque el contrato no la declara. |
| Flujo | [FL-ORG-010](../experience/flows/organization.md#fl-org-010--eliminación-de-recinto) |
| OP (AC canónicos) | OP-RCT-006 |
| SCREEN | [SCREEN-PRECINCTS](../experience/screens/organization.md#screen-precincts--recintos) |
| Requisitos | R-DOM-ORG-017 (confirmación, respuesta esperada, refresco sólo tras éxito, sin promesa de migración); R-RES-24 vía T-CORE-UI. |
| Precondiciones / dependencias | T-FL-ORG-008 (recinto cargado). |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | El recinto desaparece del listado sólo tras respuesta exitosa; ante fallo nada se borra localmente. |

**Criterios.**

- **AC-OP-RCT-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06 y refresco; `403` ⇒ F-02; `404` ⇒
  F-04; red ⇒ F-06 sin borrado local.

---

## T-FL-ORG-011 — Agregar unidad a recinto

| Campo | Valor |
|---|---|
| Objetivo | Panel de relaciones: agregar por `unit_code` con selector alimentado por T-FL-ORG-006; el `unit_count` mostrado es el devuelto y un `404` no inserta relación local. |
| Flujo | [FL-ORG-011](../experience/flows/organization.md#fl-org-011--agregar-unidad-a-recinto) |
| OP (AC canónicos) | OP-RCT-007 |
| SCREEN | [SCREEN-PRECINCT-DETAIL](../experience/screens/organization.md#screen-precinct-detail--ficha-de-recinto) — panel de relaciones |
| Requisitos | R-DOM-ORG-015 (enviar `unit_code`; mostrar `unit_count` devuelto; refrescar ambas relaciones; `404`/denegación sin relación local). |
| Precondiciones / dependencias | T-FL-ORG-008 (detalle), T-FL-ORG-006 (selector). |
| Archivos probables | `components/organization/PrecinctUnitPanel.vue`. |
| Done when | `unit_codes` y `unit_count` quedan actualizados desde la respuesta en ambas vistas (recinto y unidad). |

**Criterios.**

- **AC-OP-RCT-007:** `POST /recintos/{id}/agregar-unidad/{unit_code}/` ⇒ `{detail,
  unit_count}` y ST-06; `404` (unidad inexistente o inaccesible) ⇒ F-04 **sin** relación
  local; `403` ⇒ F-02; red ⇒ F-06.

---

## T-FL-ORG-012 — Quitar unidad de recinto

| Campo | Valor |
|---|---|
| Objetivo | Quitar relación con confirmación que identifica recinto y código; relación ausente es error explícito, **no** éxito idempotente. |
| Flujo | [FL-ORG-012](../experience/flows/organization.md#fl-org-012--quitar-unidad-de-recinto) |
| OP (AC canónicos) | OP-RCT-008 |
| SCREEN | [SCREEN-PRECINCT-DETAIL](../experience/screens/organization.md#screen-precinct-detail--ficha-de-recinto) |
| Requisitos | R-DOM-ORG-016 (confirmación identificadora; `unit_count` devuelto; ausencia = error explícito). |
| Precondiciones / dependencias | T-FL-ORG-011 (relación visible en `unit_codes`). |
| Archivos probables | `components/organization/PrecinctUnitPanel.vue`. |
| Done when | La relación desaparece del detalle sólo tras éxito; ante relación ausente el usuario ve el error del backend, no un falso éxito. |

**Criterios.**

- **AC-OP-RCT-008:** ST-10 ⇒ `DELETE …/quitar-unidad/{unit_code}/` ⇒ `{detail,
  unit_count}` y ST-06; `404` (relación inexistente) ⇒ F-04 explícito; `403` ⇒ F-02;
  red ⇒ F-06 con la relación visible hasta respuesta exitosa.
