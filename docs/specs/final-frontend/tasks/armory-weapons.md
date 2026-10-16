---
spec_meta: "../spec-meta.yaml"
---

# Tasks — Armerías, armas y calibres (T-FL-ARM, T-FL-WPN, T-FL-CAL)

> 📖 Yo registro aquí las nueve tareas del almacén. Reglas comunes conservadas del
> volumen de flujos: la UI no envía `tenant` ni unidad inyectada (R-RUL-01); las
> relaciones opcionales se escriben por código (`*_code_write`), nunca por id
> (R-RUL-02). Pasos y shapes **no se copian**: cada tarea cita su ancla `FL-*`. Índice y
> reglas: [../tasks.md](../tasks.md). Ninguna tarea está autorizada a ejecutarse.

## Bloque común de la familia

- **Dependencias comunes:** T-CORE-TYPES, T-CORE-HTTP, T-CORE-SESSION, T-CORE-ROUTER
  (`/almacen/armerias|armas[/:idArma]|calibres`), T-CORE-UI.
- **Códigos de permiso literales:** esta familia usa los literales verificados del mapa
  (`view_warehouse`, `create_warehouse_records`, `update_warehouse_records`,
  `delete_warehouse_records`, `view_exercises`, `manage_calibre`), no la etiqueta
  abreviada «warehouse» del inventario (nota de transcripción de
  [../experience/screens/armory.md](../experience/screens/armory.md)).
- **Archivos probables** (raíz `front/src/`): `api/armory.ts`, `stores/armory.ts`,
  `views/almacen/ArmoriesView.vue`, `views/almacen/WeaponsView.vue`,
  `views/almacen/WeaponDetailView.vue`, `views/almacen/CalibersView.vue`,
  `components/armory/*`. Todos con `<script setup lang="ts">`.
- **Consumo cruzado:** `api/armory.ts` (OP-ARM-001) y el catálogo de calibres
  (OP-CAL-001) son consumidos por selectores de identidad (puestos) y ejercicios
  (consumos) **sin** requerir la UI de esta familia.
- **Convención de AC:** hogar canónico único por OP.

---

## T-FL-ARM-001 — Consulta de armerías

| Campo | Valor |
|---|---|
| Objetivo | Listado con `armas_count` visible y detalle (lectura para prefill y relaciones, sin ruta de detalle propia: modal sobre el listado); `—` en descripción ausente. |
| Flujo | [FL-ARM-001](../experience/flows/armory-weapons.md#fl-arm-001--consulta-de-armerías) |
| OP (AC canónicos) | OP-ARM-001, OP-ARM-003 |
| SCREEN | [SCREEN-ARMORIES](../experience/screens/armory.md#screen-armories--armerías) — DS `tables-basic.html` + `ui-badge.html` |
| Requisitos | R-DOM-ARM-001 (campos del contrato; `—` en ausentes); R-RES-12 vía tomos citantes (`armas_count` visible). |
| Precondiciones / dependencias | Bloque común. |
| Archivos probables | `views/almacen/ArmoriesView.vue`, `api/armory.ts`. |
| Done when | La lista muestra sólo armerías del scope con sus campos; el enlace por `armas_count` lleva a armas con filtro client-side sobre la colección real. |

**Criterios.**

- **AC-OP-ARM-001:** array con `id, tenant, organization_unit, organization_unit_code,
  code, name, descripcion, is_active, armas_count`, timestamps; vacío ⇒ ST-03; `403` ⇒
  ST-07; búsqueda/orden client-side.
- **AC-OP-ARM-003:** el detalle (prefill/relaciones) muestra el objeto completo; `404` ⇒
  F-04.

---

## T-FL-ARM-002 — Alta y edición de armería

| Campo | Valor |
|---|---|
| Objetivo | Alta con `code`*, `name`* y opcionales (`descripcion`, `is_active`, `organization_unit_code_write`): si el selector de unidad no se envía, la unidad inyectada por el backend se muestra **después del éxito**; edición que excluye RO y trata el `organization_unit_code_write` vacío/`null` como `400` del campo recibido. |
| Flujo | [FL-ARM-002](../experience/flows/armory-weapons.md#fl-arm-002--alta-y-edición-de-armería) |
| OP (AC canónicos) | OP-ARM-002, OP-ARM-004, OP-ARM-005 |
| SCREEN | [SCREEN-ARMORIES](../experience/screens/armory.md#screen-armories--armerías) — editor compartido |
| Requisitos | R-DOM-ARM-002 (campos; unidad inyectada visible tras éxito); R-DOM-ARM-003 (exclusiones; error del campo recibido con ST-09 conservado). |
| Precondiciones / dependencias | T-FL-ARM-001; selector de unidad desde módulo API de organización (OP-UNT-010 vía T-FL-ORG-007, sin requerir su UI). |
| Archivos probables | `components/armory/ArmoryFormModal.vue`. |
| Done when | La armería creada/editada muestra los datos devueltos por el servidor, incluida la unidad efectiva cuando no se escribió código. |

**Criterios.**

- **AC-OP-ARM-002 / AC-OP-ARM-004 / AC-OP-ARM-005:** `201`/`200` ⇒ ST-06 y refresco de
  listado/detalle; update con `organization_unit_code_write` vacío o `null` ⇒ `400`
  anclado al campo (F-01) conservando el formulario; `403` ⇒ F-02 sin optimismo; `404`
  (edición) ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09.

---

## T-FL-ARM-003 — Eliminación de armería

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 que muestra `armas_count`; la confirmación no promete reasignación de armas (el contrato no la declara); refresco de listado, detalle y armas relacionadas sólo después del éxito. |
| Flujo | [FL-ARM-003](../experience/flows/armory-weapons.md#fl-arm-003--eliminación-de-armería) |
| OP (AC canónicos) | OP-ARM-006 |
| SCREEN | [SCREEN-ARMORIES](../experience/screens/armory.md#screen-armories--armerías) |
| Requisitos | R-DOM-ARM-004 (refresco posterior al éxito; sin promesa de reasignación); R-RES-24 vía T-CORE-UI. |
| Precondiciones / dependencias | T-FL-ARM-001. |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | El listado y las armas relacionadas reflejan la baja sólo tras respuesta exitosa. |

**Criterios.**

- **AC-OP-ARM-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06 y refresco; `403` ⇒ F-02; `404` ⇒
  F-04; red ⇒ F-06 sin borrado local.

---

## T-FL-WPN-001 — Consulta de armas

| Campo | Valor |
|---|---|
| Objetivo | Listado y ficha de armas con calibre y relaciones; `—` en calibre o relaciones ausentes; las relaciones RO se muestran como contexto. |
| Flujo | [FL-WPN-001](../experience/flows/armory-weapons.md#fl-wpn-001--consulta-de-armas) |
| OP (AC canónicos) | OP-WPN-001, OP-WPN-003 |
| SCREEN | [SCREEN-WEAPONS, SCREEN-WEAPON-DETAIL](../experience/screens/armory.md) — DS `tables-basic.html` + `ui-card.html` |
| Requisitos | R-DOM-ARM-005 (campos; `—` en ausentes). |
| Precondiciones / dependencias | Bloque común. |
| Archivos probables | `views/almacen/WeaponsView.vue`, `views/almacen/WeaponDetailView.vue`. |
| Done when | Lista y ficha muestran sólo datos devueltos; el filtro «por armería» desde SCREEN-ARMORIES es client-side sobre la colección real. |

**Criterios.**

- **AC-OP-WPN-001:** array con `id_arma`, tenant, unidad, armory y códigos/nombre,
  `calibre_code`, `tipo_arma`, `modelo_arma`, `numero_serie`; vacío ⇒ ST-03; `403` ⇒
  ST-07.
- **AC-OP-WPN-003:** la ficha expone el objeto con relaciones RO diferenciadas de los
  editables; `404` ⇒ F-04.

---

## T-FL-WPN-002 — Alta de arma

| Campo | Valor |
|---|---|
| Objetivo | Alta con `tipo_arma`* (selector limitado a los 6 valores de `TIPO_ARMA_CHOICES`), `modelo_arma`*, `numero_serie`* y `armory_code_write`/`calibre_code_write` desde selectores de códigos realmente disponibles; la unidad derivada la muestra el servidor, no la envía la UI. |
| Flujo | [FL-WPN-002](../experience/flows/armory-weapons.md#fl-wpn-002--alta-de-arma) |
| OP (AC canónicos) | OP-WPN-002 |
| SCREEN | [SCREEN-WEAPONS](../experience/screens/armory.md#screen-weapons--armas) — modal de alta |
| Requisitos | R-DOM-ARM-006 (campos y selectores reales); R-DOM-ARM-008 (unicidad `modelo_arma`+`numero_serie` visible sin deduplicar ni ocultar el arma existente); R-RES-02 vía tomos citantes (unidad derivada del armory). |
| Precondiciones / dependencias | T-FL-ARM-001 (armerías), T-FL-CAL-001 (calibres activos) — sólo módulos API. |
| Archivos probables | `components/armory/WeaponFormModal.vue`. |
| Done when | El arma creada muestra la unidad derivada por el servidor; el listado y el `armas_count` de la armería se refrescan al recargarlos. |

**Criterios.**

- **AC-OP-WPN-002:** `201` ⇒ ST-06 y refresco; `400` ⇒ F-01 con ST-09; unicidad
  modelo+serie ⇒ F-05 con error visible y el arma existente **sin** deduplicar ni
  ocultar; `403` ⇒ F-02; red ⇒ F-06; cancelar ⇒ F-09.

---

## T-FL-WPN-003 — Edición de arma

| Campo | Valor |
|---|---|
| Objetivo | Edición con relaciones por `*_code_write` —nunca sustituyendo la armería por `organization_unit`— y el `400` literal de `armory_code_write` vacío (`El arma debe pertenecer a una armoria.`) anclado al selector con formulario conservado. |
| Flujo | [FL-WPN-003](../experience/flows/armory-weapons.md#fl-wpn-003--edición-de-arma) |
| OP (AC canónicos) | OP-WPN-004, OP-WPN-005 |
| SCREEN | [SCREEN-WEAPON-DETAIL](../experience/screens/armory.md#screen-weapon-detail--ficha-de-arma) |
| Requisitos | R-DOM-ARM-007 (RO como contexto; `*_code_write`; literal de R-RUL-04). |
| Precondiciones / dependencias | T-FL-WPN-001; selectores como en T-FL-WPN-002. |
| Archivos probables | `components/armory/WeaponFormModal.vue` (prefill). |
| Done when | La ficha muestra el arma devuelta; un intento de vaciar la armería produce el error literal anclado sin pérdida de lo editado. |

**Criterios.**

- **AC-OP-WPN-004 / AC-OP-WPN-005:** `200` ⇒ ST-06 y refresco de ficha y listado;
  `armory_code_write` vacío/nulo ⇒ `400` con el literal citado anclado al selector
  (F-01); unicidad ⇒ F-05; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09.

---

## T-FL-WPN-004 — Eliminación de arma

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 que identifica modelo y serie; refresco de la armería y de los resultados que la referencien **sólo si esos recursos se vuelven a cargar**; prohibición explícita de simular transferencia o sustitución de stock (capacidad sin endpoint, D-02). |
| Flujo | [FL-WPN-004](../experience/flows/armory-weapons.md#fl-wpn-004--eliminación-de-arma) |
| OP (AC canónicos) | OP-WPN-006 |
| SCREEN | [SCREEN-WEAPON-DETAIL](../experience/screens/armory.md#screen-weapon-detail--ficha-de-arma) |
| Requisitos | R-DOM-ARM-009 (confirmación; respuesta esperada; sin simulación de stock). |
| Precondiciones / dependencias | T-FL-WPN-001. |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | La baja se refleja sólo tras éxito; ninguna UI ofrece «transferir» ni recalcula stock. |

**Criterios.**

- **AC-OP-WPN-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06; `403` ⇒ F-02; `404` ⇒ F-04;
  red ⇒ F-06 sin borrado local.

---

## T-FL-CAL-001 — Consulta de calibres (catálogo global)

| Campo | Valor |
|---|---|
| Objetivo | Catálogo global (sin tenant) de calibres como lista y como selector de código para armas y consumos; lectura sin mutación falsificada para cualquier contexto que no sea `super_admin`. |
| Flujo | [FL-CAL-001](../experience/flows/armory-weapons.md#fl-cal-001--consulta-de-calibres) |
| OP (AC canónicos) | OP-CAL-001, OP-CAL-003 |
| SCREEN | [SCREEN-CALIBERS](../experience/screens/armory.md#screen-calibers--calibres) — DS `tables-basic.html` |
| Requisitos | R-DOM-ARM-010 (campos `code`, `nombre`, `is_active`; selector de código); R-DOM-ARM-011 faceta de lectura (sin botones de mutación fuera de `super_admin`: botones ausentes, no deshabilitados con tooltip inventado). |
| Precondiciones / dependencias | Bloque común; consumidores de selector: T-FL-WPN-002/003 y T-FL-CMN-002 (sólo módulo API). |
| Archivos probables | `views/almacen/CalibersView.vue`, `api/armory.ts` (sección calibres). |
| Done when | Los selectores dependientes ofrecen sólo códigos devueltos; vacío ⇒ ST-03 en el selector sin opciones inventadas. |

**Criterios.**

- **AC-OP-CAL-001 / AC-OP-CAL-003:** array/objeto con `id_calibre, code, nombre,
  is_active`; `403` ⇒ ST-07; red ⇒ F-06/F-10; vacío ⇒ ST-03.

---

## T-FL-CAL-002 — Gestión de calibres

| Campo | Valor |
|---|---|
| Objetivo | Mutación exclusiva de `super_admin` (`manage_calibre` + bypass): alta/edición con `code`*, `nombre`*, `is_active` y baja con ST-10; tras guardar o eliminar, refresco de los selectores dependientes antes del próximo envío; referencias huérfanas mostradas como lectura sin cambiar la relación por iniciativa del cliente. |
| Flujo | [FL-CAL-002](../experience/flows/armory-weapons.md#fl-cal-002--gestión-de-calibres) |
| OP (AC canónicos) | OP-CAL-002, OP-CAL-004, OP-CAL-005, OP-CAL-006 |
| SCREEN | [SCREEN-CALIBERS](../experience/screens/armory.md#screen-calibers--calibres) |
| Requisitos | R-DOM-ARM-011 (mutación sólo `super_admin`); R-DOM-ARM-012 (refresco de selectores; referencia no seleccionable como lectura). |
| Precondiciones / dependencias | T-FL-CAL-001. |
| Archivos probables | `components/armory/CaliberFormModal.vue`. |
| Done when | Un calibre guardado o eliminado actualiza catálogo y selectores dependientes; sin `super_admin` la pantalla permanece de lectura. |

**Criterios.**

- **AC-OP-CAL-002 / AC-OP-CAL-004 / AC-OP-CAL-005:** `201`/`200` ⇒ ST-06 y refresco de
  catálogo y selectores; `400` ⇒ F-01; `403` sin `super_admin` ⇒ F-02 (denegación
  visible si el envío llegó a ocurrir); `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09.
- **AC-OP-CAL-006:** ST-10 ⇒ `DELETE`; éxito ⇒ refresco de catálogo y selectores; fallos
  sin borrado local.
