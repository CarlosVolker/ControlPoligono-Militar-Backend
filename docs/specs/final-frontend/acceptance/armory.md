---
spec_meta: "../spec-meta.yaml"
---

# Criterios de aceptación — Almacén: armerías, armas y calibres

> 📖 Volumen del conjunto de aceptación `acceptance/` (método y convenciones en [`core.md`](core.md); matrices de cobertura en [`coverage.md`](coverage.md); estado, gates y autorizaciones en [`../verification.md`](../verification.md)).
> Estado global: **NO EJECUTADO**. Cubre las 18 OP de las familias `ARM`, `WPN` y `CAL`.
> Contratos citados, no copiados:
> [`../contracts/organization-identity.md`](../contracts/organization-identity.md)
> §Armerías y [`../contracts/domain-shooting.md`](../contracts/domain-shooting.md)
> §Armas y calibres.

> 🕯️ **Nota de transcripción heredada.** El manifiesto abrevia el control de
> armas/armerías como «`warehouse`»; el mapa verificado declara los códigos literales
> `view_warehouse`, `create_warehouse_records`, `update_warehouse_records`,
> `delete_warehouse_records` ([`../experience/screens/armory.md`](../experience/screens/armory.md)
> §Nota). Este volumen usa los literales verificados; la divergencia con el inventario
> ya fue reportada por su writer y no se edita aquí (fuera de write set).

## Convenciones de familia

- **Precondición base (toda fila):** sesión real activa con tenant y unidad activa;
  armerías, armas y calibres **reales** del scope (tenant+unidad donde aplique; el
  catálogo de calibres es global). Sin fixture ni registro sintético: si el dato no
  existe, el criterio queda pendiente por falta de dato real.
- **Fallos heredados:** `F-01…F-12` y `ST-*` según perfil `P-*`
  ([`../experience/states.md`](../experience/states.md)); `PUT`/`PATCH` comparten editor
  y son criterios separados.
- **Reglas visibles de familia:** la UI no envía `tenant` ni unidad inyectada; las
  relaciones opcionales se escriben por código (`*_code_write`), nunca por id; éxito de
  mutación refresca listado, detalle y relaciones **después** de la respuesta.

## AC-OP — Armerías (Armory)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-ARM-001 | `GET /api/armorias/` | `armory:read → view_warehouse`; armerías reales del scope | SCREEN-ARMORIES: abrir el listado (FL-ARM-001 paso 1) | Columnas `code, name, descripcion, is_active`, unidad derivada, timestamps y **`armas_count` visible**; `descripcion` ausente ⇒ `—`; búsqueda/orden client-side; enlace de `armas_count` ⇒ SCREEN-WEAPONS filtrado en cliente sobre la colección real; unidad derivada ⇒ SCREEN-UNIT-DETAIL | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; vacío ⇒ ST-03; cancelación n/a | `tables-basic.html`, `ui-badge.html`, `ui-placeholders.html` |
| AC-OP-ARM-002 | `POST /api/armorias/` | `armory:create → create_warehouse_records` | SCREEN-ARMORIES: modal de alta con `code`*, `name`*, `descripcion`, `is_active`, `organization_unit_code_write` opcionales (FL-ARM-002 paso 1) | `201` ⇒ ST-06; **si el selector de unidad no se envió, tras el éxito se muestra la unidad que el backend inyectó** (R-DOM-ARM-002); listado refrescado | `400` ⇒ F-01 con valores conservados; `403` ⇒ F-02; red ⇒ F-06 sin fila optimista; cancelar ⇒ F-09 | `ui-modal.html` + `forms-basic.html`/`forms-validation.html` |
| AC-OP-ARM-003 | `GET /api/armorias/{id}/` | Armería real del scope | SCREEN-ARMORIES: lectura de detalle para prefill del editor y panel de relaciones (modal sobre el listado; sin ruta de detalle propia — integración justificada del catálogo) | Objeto completo del contrato; relaciones (armas) visibles al recargarlas | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `ui-card.html` |
| AC-OP-ARM-004 | `PUT /api/armorias/{id}/` | `armory:update → update_warehouse_records`; armería cargada | Editor compartido, envío **completo** sólo de campos editables: jamás `id`, `tenant`, unidad derivada, conteo ni timestamps (FL-ARM-002 paso 2) | `200` ⇒ ST-06; listado y detalle refrescados desde la respuesta | `organization_unit_code_write` vacío/`null` en update ⇒ `400` asociado **al campo recibido** con formulario conservado (R-DOM-ARM-003, F-01); `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-validation.html` |
| AC-OP-ARM-005 | `PATCH /api/armorias/{id}/` | Ídem ARM-004 | Mismo editor, envío **parcial** (delta: sólo campos modificados; la regla del campo de unidad vacío aplica igual) | Ídem ARM-004 | Ídem ARM-004 | `ui-modal.html` + `forms-validation.html` |
| AC-OP-ARM-006 | `DELETE /api/armorias/{id}/` | `armory:delete → delete_warehouse_records`; armería cargada | ST-10 con **`armas_count` visible** ⇒ confirmar (FL-ARM-003) | Respuesta del backend ⇒ ST-06; listado, detalle y armas relacionadas se refrescan **después del éxito**; la confirmación **no promete reasignación de armas** (el contrato no la declara) | `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local; cancelar ⇒ cierra ST-10 sin petición | `ui-modal.html` |

## AC-OP — Armas (Arma)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-WPN-001 | `GET /api/armas/` | `weapon:read → view_warehouse`; armas reales del scope | SCREEN-WEAPONS: abrir el listado (FL-WPN-001 paso 1) | Columnas con `id_arma`, tipo, modelo, serie, armería (código y nombre), unidad derivada y `calibre_code`; calibre o relaciones ausentes ⇒ `—`; búsqueda/orden client-side | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; vacío ⇒ ST-03; cancelación n/a | `tables-basic.html`, `ui-badge.html` |
| AC-OP-WPN-002 | `POST /api/armas/` | `weapon:create → create_warehouse_records`; selectores reales alimentados: armerías (OP-ARM-001) y calibres **activos** (OP-CAL-001) | SCREEN-WEAPONS: modal de alta con `tipo_arma`* —selector limitado a `fusil, subfusil, pistola, francotirador, ametralladora, apoyo`—, `modelo_arma`*, `numero_serie`*; `armory_code_write`, `calibre_code_write` sólo mediante selectores de códigos realmente disponibles (FL-WPN-002) | `201` con el arma ⇒ ST-06; el arma creada muestra la **unidad derivada por el servidor** del `armory_code_write` enviado, no una enviada por la UI; listado refrescado y `armas_count` de la armería al recargarla | `400` ⇒ F-01; unicidad `modelo_arma + numero_serie` ⇒ F-05: error visible **sin deduplicar ni ocultar el arma existente** en la tabla; `403` ⇒ F-02; red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-WPN-003 | `GET /api/armas/{id}/` | Arma real del scope | SCREEN-WEAPONS ⇒ SCREEN-WEAPON-DETAIL (FL-WPN-001 paso 2) | Ficha con relaciones RO (tenant, unidad, armory y códigos/nombre, `calibre_code`) diferenciadas de los editables; ausentes `—` | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `ui-card.html`, `ui-badge.html` |
| AC-OP-WPN-004 | `PUT /api/armas/{id}/` | `weapon:update → update_warehouse_records`; arma cargada | Editor compartido, envío **completo**: las relaciones viajan por `*_code_write`, **nunca** sustituyendo la armería por `organization_unit` (FL-WPN-003) | `200` con el arma ⇒ ST-06; ficha y listado refrescados | `armory_code_write` vacío o nulo ⇒ `400` con el literal `armory_code_write: 'El arma debe pertenecer a una armoria.'` **anclado al selector** y formulario conservado (R-RUL-04 vía R-DOM-ARM-007); unicidad modelo+serie ⇒ F-05; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-validation.html` |
| AC-OP-WPN-005 | `PATCH /api/armas/{id}/` | Ídem WPN-004 | Mismo editor, envío **parcial** (delta: sólo campos modificados; la regla literal de armería vacía aplica igual) | Ídem WPN-004 | Ídem WPN-004 | `ui-modal.html` + `forms-validation.html` |
| AC-OP-WPN-006 | `DELETE /api/armas/{id}/` | `weapon:delete → delete_warehouse_records`; arma cargada | ST-10 que identifica modelo y serie ⇒ confirmar (FL-WPN-004) | Respuesta del backend ⇒ ST-06; la armería y los resultados que la referencien se refrescan **sólo si esos recursos se vuelven a cargar**; **ninguna simulación de transferencia o sustitución de stock** (capacidad sin endpoint, D-02) | `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local; cancelar ⇒ cierra ST-10 sin petición | `ui-modal.html` |

## AC-OP — Calibres (catálogo global)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-CAL-001 | `GET /api/calibres/` | `calibre:read → view_exercises`; catálogo **global** (sin tenant) | SCREEN-CALIBERS: abrir el catálogo; también alimenta selectores de armas y consumos (FL-CAL-001) | Filas `id_calibre, code, nombre, is_active` con los códigos canónicos; para cualquier contexto que no sea `super_admin` el catálogo es de **lectura sin mutación falsificada**: botones ausentes (no deshabilitados con tooltip inventado) | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; vacío ⇒ ST-03: los selectores dependientes muestran su estado vacío sin inventar opciones; cancelación n/a | `tables-basic.html`, `ui-badge.html` |
| AC-OP-CAL-002 | `POST /api/calibres/` | `calibre:manage → manage_calibre` **+ `super_admin`** real (reservado al desarrollador) | SCREEN-CALIBERS: modal de alta con `code`*, `nombre`*, `is_active` (FL-CAL-002 paso 1) | `201` con el calibre ⇒ ST-06; catálogo y **selectores dependientes refrescados antes del próximo envío** (R-DOM-ARM-012) | `400` ⇒ F-01; `403` sin `super_admin` ⇒ F-02 literal; red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-CAL-003 | `GET /api/calibres/{id}/` | Calibre real del catálogo | SCREEN-CALIBERS: lectura para prefill (FL-CAL-001) | Objeto `code, nombre, is_active` | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `ui-card.html` |
| AC-OP-CAL-004 | `PUT /api/calibres/{id}/` | `super_admin`; calibre cargado | Editor compartido, envío **completo** (FL-CAL-002) | `200` ⇒ ST-06; catálogo y selectores dependientes refrescados | `400` ⇒ F-01; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-CAL-005 | `PATCH /api/calibres/{id}/` | Ídem CAL-004 | Mismo editor, envío **parcial** (delta: p. ej. sólo `is_active`) | Ídem CAL-004 | Ídem CAL-004 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-CAL-006 | `DELETE /api/calibres/{id}/` | `super_admin`; calibre cargado | ST-10 ⇒ confirmar (FL-CAL-002 paso 2) | Respuesta ⇒ ST-06; catálogo y selectores refrescados; si una referencia existente (arma o consumo) deja de ser seleccionable, **se muestra el valor devuelto como lectura, sin cambiar la relación por iniciativa del cliente** (R-DOM-ARM-012) | `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local; cancelar ⇒ cierra ST-10 sin petición | `ui-modal.html` |

---

> 🕯️ Ninguna fila está verificada. La gestión de calibres exige una cuenta `super_admin`
> real del operador; la eliminación de armas/armerías es destructiva sobre datos reales:
> ambas requieren autorización explícita ([`../verification.md`](../verification.md), «Requisito de autorización»).
