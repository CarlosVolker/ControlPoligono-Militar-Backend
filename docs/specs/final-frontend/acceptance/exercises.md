---
spec_meta: "../spec-meta.yaml"
---

# Criterios de aceptación — Ejercicios y consumos

> 📖 Volumen del conjunto de aceptación `acceptance/` (método y convenciones en [`core.md`](core.md); matrices de cobertura en [`coverage.md`](coverage.md); estado, gates y autorizaciones en [`../verification.md`](../verification.md)).
> Estado global: **NO EJECUTADO**. Cubre las 18 OP de las familias `EJR`, `CMN` y `CAR`.
> Contrato citado, no copiado:
> [`../contracts/exercises-preferences.md`](../contracts/exercises-preferences.md) §1.
> Regla de familia: `ConsumoMunicion` y `ConsumoArma` tienen alcance **sólo tenant**, sin
> unidad propia: la UI no intenta inyectarla.

## Convenciones de familia

- **Precondición base (toda fila):** sesión real activa con tenant; ejercicios y consumos
  **reales** del scope. Sin fixtures ni registros de muestra: los selectores se pueblan
  sólo desde respuestas reales (OP-EJR-001, OP-CMN-001, OP-WPN-001, OP-CAL-001); si el
  dato no existe, el criterio queda pendiente por falta de dato real.
- **Fallos heredados:** `F-01…F-12` y `ST-*` según perfil `P-*`
  ([`../experience/states.md`](../experience/states.md)); `PUT`/`PATCH` comparten editor
  y son criterios separados.
- **Dos niveles contractuales:** munición (nivel 1) y arma (nivel 2) se administran en
  pantallas enlazadas; el filtrado «por ejercicio» o «por consumo padre» es
  **client-side** sobre la colección realmente retornada (no existe endpoint de consumos
  por ejercicio y no se inventa).

## AC-OP — Ejercicios militares

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-EJR-001 | `GET /api/ejercicios/` | `ejercicio_militar:read → view_exercises`; ejercicios reales del scope (tenant+unidad) | SCREEN-EXERCISES: abrir el listado (FL-EXC-001 paso 1) | Columnas `id_ejercicio`, nombre, fecha, zona, tipo, observaciones, unidades participantes, tenant, unidad y `created_at` cuando estén presentes; ausentes ⇒ `—`; búsqueda/orden client-side | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; vacío ⇒ ST-03; cancelación n/a | `tables-basic.html`, `ui-badge.html`, `ui-placeholders.html` |
| AC-OP-EJR-002 | `POST /api/ejercicios/` | `ejercicio_militar:create → create_exercises`; selector de unidades participantes real (OP-UNT-009) | SCREEN-EXERCISES: modal de alta con `nombre`*, `fecha`*, `zona`, `tipo_ejercicio` —selector limitado a `asalto, defensa, movimiento, mixto, otro`—, campos opcionales de orden/fecha, `observaciones`, `unidades_participantes_codes_write` (FL-EXC-002) | `201` con el ejercicio ⇒ ST-06; detalle y listado refrescados; **omisión de participantes**: se muestra la unidad efectiva retornada, **sin participantes sintéticos** (R-DOM-EXC-003) | `400` ⇒ F-01 con valores conservados; errores de unidades o tenant junto al selector o como denegación según la forma de la respuesta; `403` ⇒ F-02; red ⇒ F-06 sin fila optimista; cancelar ⇒ F-09 descarta lo no enviado | `ui-modal.html` + `forms-basic.html`/`forms-flatpicker.html` |
| AC-OP-EJR-003 | `GET /api/ejercicios/{id}/` | Ejercicio real del scope | SCREEN-EXERCISES ⇒ SCREEN-EXERCISE-DETAIL (FL-EXC-001 paso 2) | Ficha con participantes por código desde la respuesta y `—` en ausentes; consumos relacionados listados desde OP-CMN-001/OP-CAR-001 con **filtrado client-side por el ejercicio** (sin endpoint propio inventado) | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `ui-card.html`, `ui-tabs.html`/`ui-list-group.html` |
| AC-OP-EJR-004 | `PUT /api/ejercicios/{id}/` | `ejercicio_militar:update → update_exercises`; ejercicio cargado | Editor compartido, envío **completo** con los campos del alta (FL-EXC-002) | `200` ⇒ ST-06; detalle y listado refrescados desde la respuesta | `400` ⇒ F-01; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-EJR-005 | `PATCH /api/ejercicios/{id}/` | Ídem EJR-004 | Mismo editor, envío **parcial** (delta: sólo campos modificados) | Ídem EJR-004 | Ídem EJR-004 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-EJR-006 | `DELETE /api/ejercicios/{id}/` | `ejercicio_militar:delete → delete_exercises`; ejercicio cargado | ST-10 que identifica el ejercicio por nombre y fecha ⇒ confirmar (FL-EXC-003) | Respuesta del backend ⇒ ST-06; consumos relacionados se refrescan **sólo tras éxito**; la confirmación **no promete eliminación en cascada** si la respuesta no la declara | `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local; cancelar ⇒ cierra ST-10 sin petición | `ui-modal.html` |

## AC-OP — Consumo de munición (nivel 1)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-CMN-001 | `GET /api/consumos-municion/` | `consumo_municion:read → view_exercises`; alcance **sólo tenant** | SCREEN-AMMO-CONSUMPTION: abrir el listado (FL-CMN-001 paso 1) | Columnas `id_consumo`, ejercicio, tipo/modelo de arma, `calibre_code`, cantidades, `es_aproximado`, observaciones; ausentes `—`; la UI **no muestra ni envía unidad propia** (el recurso no la tiene) | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; vacío ⇒ ST-03; cancelación n/a | `tables-basic.html`, `ui-badge.html` |
| AC-OP-CMN-002 | `POST /api/consumos-municion/` | `consumo_municion:create → create_exercises`; selectores reales: ejercicio (OP-EJR-001), calibre **activo** (OP-CAL-001) | SCREEN-AMMO-CONSUMPTION: modal con `ejercicio`*, `tipo_arma`* —selector limitado a `fusil, subfusil, pistola, francotirador, ametralladora, apoyo`—, `cantidad_tiros`*, `modelo_arma`, `calibre_code_write`, `cantidad_armas`, `es_aproximado`, `observaciones` (FL-CMN-002) | `201` ⇒ ST-06; se muestra el `calibre_code` RO devuelto (el write resuelve un calibre activo); **el calibre no se deduce de tipo o modelo**: si el usuario no lo elige, el campo queda ausente/`—` | `400` (incluido calibre inactivo/no resuelto) ⇒ F-01 anclado al selector con valores conservados; `403` ⇒ F-02; red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-basic.html`/`forms-validation.html` |
| AC-OP-CMN-003 | `GET /api/consumos-municion/{id}/` | Consumo real del tenant | SCREEN-AMMO-CONSUMPTION: lectura para prefill y enlace a nivel 2 (FL-CMN-001 paso 2) | Objeto del contrato con enlace a su ejercicio y a sus consumos de arma (filtrado client-side por el consumo) | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `ui-card.html` |
| AC-OP-CMN-004 | `PUT /api/consumos-municion/{id}/` | `consumo_municion:update → update_exercises`; consumo cargado | Editor compartido, envío **completo** (FL-CMN-002) | `200` ⇒ ST-06; calibre RO refrescado desde la respuesta | `400` ⇒ F-01 por campo (calibre write igual que en el alta); `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-validation.html` |
| AC-OP-CMN-005 | `PATCH /api/consumos-municion/{id}/` | Ídem CMN-004 | Mismo editor, envío **parcial** (delta: p. ej. sólo `cantidad_tiros` o `es_aproximado`) | Ídem CMN-004 | Ídem CMN-004 | `ui-modal.html` + `forms-validation.html` |
| AC-OP-CMN-006 | `DELETE /api/consumos-municion/{id}/` | `consumo_municion:delete → delete_exercises`; consumo cargado | ST-10 que identifica ejercicio y cantidades ⇒ confirmar (FL-CMN-003) | Respuesta del backend ⇒ ST-06; ejercicio y consumos asociados se refrescan **sólo después del éxito** | `400`/`403`/relaciones inexistentes ⇒ **no se convierten en ceros ni en éxito visual** (ST-04/ST-07 según el caso); `404` ⇒ F-04; red ⇒ F-06 sin borrado local; cancelar ⇒ cierra ST-10 sin petición | `ui-modal.html` |

## AC-OP — Consumo por arma (nivel 2)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-CAR-001 | `GET /api/consumos-arma/` | `consumo_arma:read → view_exercises`; alcance sólo tenant | SCREEN-WEAPON-CONSUMPTION: abrir el listado (FL del P-READ-LIST) | Columnas `id_consumo_arma`, consumo, arma, `cantidad_tiros`, observaciones desde la respuesta; **enlaces a detalle sólo si los IDs/relaciones están presentes** (si no, texto plano, nunca enlace roto ni inventado) | `403` ⇒ ST-07; red ⇒ ST-04 + F-10; vacío ⇒ ST-03; cancelación n/a | `tables-basic.html` |
| AC-OP-CAR-002 | `POST /api/consumos-arma/` | `consumo_arma:create → create_exercises`; selectores poblados **sólo desde respuestas reales**: consumos accesibles (OP-CMN-001) y armas accesibles (OP-WPN-001); nunca registros de muestra | SCREEN-WEAPON-CONSUMPTION: modal con `consumo`*, `arma`*, `cantidad_tiros`* (FKs directas), `observaciones` (FL-CAR-001) | `201` con `id_consumo_arma` ⇒ ST-06; la relación del consumo padre se refresca al recargarla | Duplicidad consumo+arma ⇒ F-05 en la **relación de arma**, conservando el formulario para corrección; `400` resto ⇒ F-01; `403` ⇒ F-02; red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-CAR-003 | `GET /api/consumos-arma/{id}/` | Consumo de arma real | SCREEN-WEAPON-CONSUMPTION: lectura para prefill | Objeto del contrato | `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ ST-04 + F-10; cancelación n/a | `ui-card.html` |
| AC-OP-CAR-004 | `PUT /api/consumos-arma/{id}/` | `consumo_arma:update → update_exercises`; consumo cargado | Editor compartido, envío **completo** (FL-CAR-001) | `200` ⇒ ST-06; relación refrescada desde la respuesta | Unicidad consumo+arma ⇒ F-05; `400` ⇒ F-01; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-CAR-005 | `PATCH /api/consumos-arma/{id}/` | Ídem CAR-004 | Mismo editor, envío **parcial** (delta: p. ej. sólo `cantidad_tiros` u `observaciones`) | Ídem CAR-004 | Ídem CAR-004 | `ui-modal.html` + `forms-basic.html` |
| AC-OP-CAR-006 | `DELETE /api/consumos-arma/{id}/` | `consumo_arma:delete → delete_exercises`; consumo cargado | ST-10 que identifica consumo y arma ⇒ confirmar (FL-CAR-002) | Respuesta del backend ⇒ ST-06; la relación del consumo padre se actualiza **únicamente tras éxito**; **no se recalcula ni supone stock restante** (no es dato contractual del recurso) | `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local; cancelar ⇒ cierra ST-10 sin petición | `ui-modal.html` |

---

> 🕯️ Ninguna fila está verificada. La transferencia de stock entre armerías **no tiene
> endpoint** (D-02): ningún criterio de este volumen la simula con operaciones de
> consumo; el hueco se registra en [`appearance.md`](appearance.md) §D-02 y en
> [`../verification.md`](../verification.md), «Criterio de cierre».
