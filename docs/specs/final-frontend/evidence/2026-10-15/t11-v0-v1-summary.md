---
actualizado: 2026-10-15
---

# Tanda T11 — barrido V0 y módulos V1a/V1b (2026-10-15)

> 🕯️ **Qué es y qué no.** Registro documental de la **tanda T11** del plan de cierre
> [`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md), ejecutada el **2026-10-15**:
> un barrido de lectura multi-actor (**V0**) y dos módulos de escritura por UI (**V1a** y **V1b/V1b2**)
> contra backend real, con navegador instrumentado. **No** certifica aceptación integral, **no** emite
> veredicto de producto y **no** propone ni aplica arreglos: no se cambió código de producto, backend,
> schema, datos originales ni credenciales. Los ocho artefactos primarios de §7 se conservan
> **inalterados** y su copia en este directorio se verificó **idéntica byte a byte** contra
> `.cache/frontend-acceptance/2026-10-15/` (`cmp`, 8 de 8, 0 diferencias; `sha256` idéntico
> origen/copia).

## Índice

1. [Contexto](#1-contexto) · 2. [Qué se ejecutó](#2-qué-se-ejecutó) · 3. [Resultados por corrida](#3-resultados-por-corrida) ·
4. [Celdas promovidas](#4-celdas-promovidas) · 5. [Límites](#5-límites) · 6. [Hallazgo registrado](#6-hallazgo-registrado) ·
7. [Fuentes](#7-fuentes) ·
8. [Ampliación (misma fecha): V1c / V1d / V1e](#8-ampliación-misma-fecha-v1c--v1d--v1e) ·
9. [Ampliación (misma fecha): V1f / V1g + limpieza](#9-ampliación-misma-fecha-v1f--v1g--limpieza)

---

## 1. Contexto

La tanda pertenece al **carril de verificación** del plan maestro de cierre del frontend integral
(`completion-plan-2026-10-14.md`, `status: in-progress`). El corte vigente antes de esta tanda era
**330 `OBSERVED_OK` / 38 `PARTIAL` / 952 `NOT_EXERCISED`** sobre 1320 celdas (165 `OP-*` × 8 actores).
La tanda ejercita por UI tres superficies que permanecían `NOT_EXERCISED` y que **ninguna otra corrida
del 2026-10-14 había ejercitado con el actor A2**: el alta formal de persona y su panel de asignaciones,
y las relaciones de recinto (agregar/quitar unidad). Los siete endpoints de esas superficies estaban
sin celdas para **ningún** actor.

La acreditación del actor es **por correspondencia privada**: el alias `A2` corresponde al rol
`tenant_admin`, verificado por login de UI (`POST /api/auth/login/` **200**) y `GET /api/auth/context/`
**200** con rol activo `tenant_admin`. Las cookies **no** se fabricaron.

---

## 2. Qué se ejecutó

| Corrida | Tipo | Alcance | Actor |
|---|---|---|---|
| **V0** — barrido de familias | Lectura (multi-actor) | 19 familias por ruta, contexto de navegador nuevo por actor, login y logout por UI | **A1..A8** (8/8) |
| **V1a** — alta formal de persona | Escritura por UI | Alta `POST /api/usuarios/`, panel de asignaciones (desactivar principal, agregar/quitar secundaria) y selector de unidades asignables | **A2** |
| **V1b / V1b2** — relaciones de recinto | Escritura por UI | Agregar/quitar unidad de un recinto descartable propio; sonda de duplicado | **A2** |

Los módulos **V1a** y **V1b** operan **solo sobre registros descartables propios** con marcadores de
turno `T11A2USR*` / `T11A2RCT*`; las cuentas y recintos creados se dieron de baja en la misma corrida y
el barrido de residuo propio cerró en **cero**. **V1b** cerró con un error de harness en la sonda de
duplicado; la pasada diagnóstica **V1b2** la reprodujo y completó los campos. Cero cambios de RBAC,
backend, base de datos ni dependencias; solo la API real del backend en marcha, desde la UI.

---

## 3. Resultados por corrida

### 3.1 V0 — barrido de familias (lectura)

| Dato | Valor observado |
|---|---|
| Actores observados | **8/8** (`A1..A8`), cada uno con estado `observed` |
| Rutas/familias por actor | **19** (152 navegaciones de familia = 19 × 8) |
| `GET` de negocio de familias | **208 × 200** + **14 × 403** (222 en total) |
| Superficies | **130** `page_shell` + **22** `neutral_denial` |
| Bloqueos | **0** |

Los conteos de `200`/`403` corresponden a los **`GET` de negocio de las familias** y **excluyen**
las tres llamadas de autenticación por actor (`POST /api/auth/login/`, `GET /api/auth/context/`,
`POST /api/logout/`), que suman 24 respuestas `200` más (232 × 200 sobre el total de 246 llamadas).

> 🕯️ El V0 **no promueve celdas**: acredita un corte de lectura por actor (qué responde cada uno al
> navegar las 19 rutas), no la correctitud del conjunto visible ni la aceptación. Su registro vive en
> `observations.t11_v0_sweep_2026_10_15`. El `14 × 403` es una **denegación real de backend** observada
> en el barrido, no una celda promovida.

### 3.2 V1a — alta formal de persona (escritura por UI, A2)

Total de llamadas de API registradas: **70**. Secuencia de mutaciones:

| Paso | Método y ruta | Estado |
|---|---|---|
| Alta de unidad descartable | `POST /api/organization-units/` | **201** (id 38) |
| Alta formal de persona | `POST /api/usuarios/` | **201** (id 42) |
| Secundaria | `POST /api/usuarios/42/agregar-asignacion/` (`oficial_tiro`) | **201** (assignment 57) |
| Retiro de secundaria | `POST /api/usuarios/42/quitar-asignacion/57/` | **200** |
| Desactivar principal | `POST /api/usuarios/42/desactivar-asignacion-principal/` | **200** |
| Baja de cuenta | `DELETE /api/usuarios/42/` | **204** |
| Limpieza de puestos | `DELETE /api/posiciones/57,59,58/` | **204** ×3 |
| Baja de unidad | `DELETE /api/organization-units/38/` | **204** |

Verificación: `GET` de usuario **antes** **200**, **después** **404**; `GET` de unidad **después**
**404**. Residuo propio: `users_rows_with_marker` **0**, `positions_rows_with_marker` **0**; cero errores
de limpieza. Gate: `actor_role` `tenant_admin`, `used_super_admin_bypass` **false**, `created_role`
`oficial_observador` (**no privilegiado**), `secondary_role` `oficial_tiro`,
`unit_is_own_disposable` **true**, `credentials_printed_or_persisted` **false**,
`created_account_login_attempted` **false**. `page_errors`: **ninguno**.

### 3.3 V1b/V1b2 — relaciones de recinto (escritura por UI, A2)

| Intento | Llamadas de API | Resultado |
|---|---:|---|
| **V1b** (primera pasada) | 46 | Cerró con `page_errors`: `Timeout 8000ms` en `locator.click` de la sonda de duplicado; varios campos quedaron en `null` (`option_present_after_relate`, `relation_remove_body`, `relation_present_after_remove`). El alta y la baja de la relación sí ocurrieron (200/200) |
| **V1b2** (pasada diagnóstica) | 50 | Sonda de duplicado reproducida vía DOM (`duplicate_probe_click_via_dom: true`); campos completados. `page_errors`: **ninguno** |

Secuencia de V1b2: `POST /api/organization-units/` **201** (id 41), `POST /api/recintos/` **201** (id 20),
`POST /api/recintos/20/agregar-unidad/T11A2RCTMV9UJ9OJU/` **200** (cuerpo «Unidad … agregada al recinto.»,
`unit_count` **1**), `DELETE /api/recintos/20/quitar-unidad/T11A2RCTMV9UJ9OJU/` **200** (cuerpo «Unidad …
quitada del recinto.», `unit_count` **0**), `DELETE /api/recintos/20/` **204**,
`DELETE /api/organization-units/41/` **204**. Verificación: `GET` de recinto **y** de unidad **después**
**404**. Residuo propio: **0** en ambas familias. Gate: `actor_role` `tenant_admin`,
`used_super_admin_bypass` **false**, `credentials_printed_or_persisted` **false**.

Sonda de duplicado: tras agregar la relación, la opción de la unidad ya relacionada queda **excluida**
del selector (`option_present_after_relate` **0**) mientras la relación permanece presente
(`relation_present_after_add` **1**); tras quitarla, la relación pasa a **0**.

---

## 4. Celdas promovidas

Actor **A2** en las siete. Estado anterior `NOT_EXERCISED`; estado resultante `OBSERVED_OK`. Todas con
`evidence_date: "2026-10-15"` y `evidence_source_kind: "direct_orchestrator_playwright_ui"`.

| Fila (método + endpoint) | OP | Antes | Ahora | Observado |
|---|---|---|---|---|
| `POST /usuarios/` | `OP-USR-002` | `NOT_EXERCISED` | `OBSERVED_OK` | Alta formal **201** por UI; cuenta descartable propia, rol no privilegiado, credencial no persistida; baja **204** |
| `POST /usuarios/{id}/desactivar-asignacion-principal/` | `OP-USR-009` | `NOT_EXERCISED` | `OBSERVED_OK` | **200** por UI; detalle «Rol funcional removido. Mantiene rol tirador.» |
| `POST /usuarios/{id}/agregar-asignacion/` | `OP-USR-010` | `NOT_EXERCISED` | `OBSERVED_OK` | **201** por UI; secundaria `oficial_tiro` no privilegiada, retirada en la misma corrida |
| `POST /usuarios/{id}/quitar-asignacion/{assignment_id}/` | `OP-USR-011` | `NOT_EXERCISED` | `OBSERVED_OK` | **200** por UI; retiro de la secundaria de esta corrida |
| `GET /me/assignable-units/` | `OP-UNT-010` | `NOT_EXERCISED` | `OBSERVED_OK` | Selector de unidades asignables **poblado** con la unidad descartable propia (`in_assignable_units: true`) |
| `POST /recintos/{id}/agregar-unidad/{unit_code}/` | `OP-RCT-007` | `NOT_EXERCISED` | `OBSERVED_OK` | **200** por UI; `unit_count` **1**; sonda de duplicado excluye la ya relacionada (**0**) |
| `DELETE /recintos/{id}/quitar-unidad/{unit_code}/` | `OP-RCT-008` | `NOT_EXERCISED` | `OBSERVED_OK` | **200** por UI; `unit_count` **0**; lista observada **1 → 0** |

### 4.1 Conteos

| Estado | Antes de esta tanda | Después | Δ |
|---|---:|---:|---:|
| `NOT_EXERCISED` | 952 | **945** | −7 |
| `PARTIAL` | 38 | **38** | 0 |
| `OBSERVED_OK` | 330 | **337** | +7 |
| Denominador | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**7 celdas** cambiaron, todas de **A2**, todas de `NOT_EXERCISED` a `OBSERVED_OK`. Recuento obtenido
recorriendo las 165 filas × 8 actores, **no** por agregación de conteos declarados; coincide con
`cell_state_counts`.

> 🕯️ `expected_by_actor` sigue **`NOT_VERIFIED`** en las **1320** celdas y **no** cambia con esta
> tanda: un **201**, un **200** o un **204** acreditan que la operación se aceptó para el actor
> observado, no que el conjunto de visibles sea el correcto para él. El estado global permanece
> **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**.

---

## 5. Límites

- **Acreditación por correspondencia privada.** El alias `A2` se corresponde con `tenant_admin` por el
  login de UI y el `GET /api/auth/context/` 200, no por una matriz actor→permiso documentada. Un **200**
  o un **201** acreditan la aceptación de la operación, **no** que el resultado sea el esperado para el
  actor.
- **`expected_by_actor` sigue `NOT_VERIFIED`** en las 1320 celdas; esta tanda no emite veredicto de
  aceptación.
- **Alcance acotado de `OP-UNT-010`.** El listado de unidades asignables se observó en **un solo
  consumidor** de los tres declarados (el alta formal de persona) y solo respecto de la opción de la
  unidad propia; el listado **no acredita autorización** (contrato de la fila), y no se infieren los
  otros consumidores.
- **Ningún `204`/`404` acredita borrado físico en base.** Los `DELETE` **204** y los `GET` **404**
  documentan ausencia en la respuesta del servidor, no la desaparición física del registro.
- **El barrido V0 no promueve celdas.** Su `14 × 403` es una denegación real de backend observada; las
  celdas denegadas no se convierten en promoción.
- **Un solo tenant**; no hay aislamiento entre tenants y no se proveyó un segundo.
- **Backend sin tocar**: sin cambios de código, schema, RBAC, datos originales ni credenciales; sin
  acceso a producción y **sin commit ni push**. No se corrieron `tests`, `build` ni navegador más allá
  del propio recorrido, y no se reclama estado de ellos.
- **No hay cierre de aceptación integral**: el estado global sigue **`NOT_VERIFIED`** y la conclusión
  de producto **`NO_CUMPLIDO`**.

---

## 6. Hallazgo registrado

> 🕯️ **Candidato UX, no corregido en esta tanda.** Tras una relación agregada con éxito, el modal de
> «Agregar unidad al recinto» **no se cierra solo**: permanece presente (`modal_present: true`,
> `element_at_center_class: DIV.ds-modal`) e intercepta el botón del panel hasta cerrarlo a mano o
> navegar. Reproducido en **dos** corridas (`post_add_now` y `post_add_after_4s` con el modal presente;
> `post_renav` con el modal desaparecido).
>
> **Causa sospechada (según el artefacto):** `closeModal()` se invoca dentro del `onSuccess` de la
> operación y retorna temprano porque `modalBusy` sigue activo (token pendiente) —
> `OrganizationView.vue` líneas ~700-703 y ~1687-1710. **No** se corrige aquí; dueño sugerido: revisión
> UX (`Shelyn-Cleric`) / corrección `Code-Transmuter`. Se registra como candidato, **sin** atribuir
> severidad ni decidir la corrección.

---

## 7. Fuentes

Los ocho artefactos primarios, **inalterados**, en [`evidence/2026-10-15/`](./) y copiados sin cambios
desde `.cache/frontend-acceptance/2026-10-15/` (`cmp` idéntico y `sha256` idéntico origen/copia; hashes
en [`sources-manifest.json`](./sources-manifest.json)):

| # | Artefacto | Aporta |
|---|---|---|
| 1 | [`runtime-family-evidence.json`](./runtime-family-evidence.json) | Barrido V0 multi-actor: 8/8 actores, 19 rutas, 208×200 + 14×403, superficies, cero bloqueos |
| 2 | [`v0-sweep-summary.json`](./v0-sweep-summary.json) | Resumen del barrido V0 (8 actores `observed`, 19 familias cada uno) |
| 3 | [`v1a-persons-formal-a2.json`](./v1a-persons-formal-a2.json) | V1a: alta formal **201**, asignaciones **200/201/200**, baja **204**, limpieza trazable |
| 4 | [`v1b2-recinto-relations-a2.json`](./v1b2-recinto-relations-a2.json) | V1b2: agregar unidad **200** (`unit_count` 1) y quitar unidad **200** (`unit_count` 0); sonda de duplicado; observación del modal |
| 5 | [`run-module.cjs`](./run-module.cjs) | Runner genérico del harness T11 |
| 6 | [`runtime-family-sweep-v0.cjs`](./runtime-family-sweep-v0.cjs) | Script del barrido V0 |
| 7 | [`v1a-persons-formal-a2.run.cjs`](./v1a-persons-formal-a2.run.cjs) | Script del módulo V1a |
| 8 | [`v1b2-recinto-relations-a2.run.cjs`](./v1b2-recinto-relations-a2.run.cjs) | Script del módulo V1b2 |

Pasadas previas preservadas en la caché, **no copiadas** (declaradas en el manifiesto):
`runtime-family-evidence-run1.json`, `v0-sweep-summary-run1.json`,
`v1b-recinto-relations-a2.json` (primera pasada con error de harness) y
`v1b-recinto-relations-a2-run1.json`.

Celdas y conteos: [`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json)
(bloques `observations.t11_v0_sweep_2026_10_15`, `observations.t11_v1a_2026_10_15` y
`observations.t11_v1b_2026_10_15`). Plan de cierre:
[`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md).

> 🕯️ Este documento **no** afirma completitud del producto ni emite veredicto de aceptación. No
> contiene secretos, cookies, RUT, correos ni nombres de personas: sólo alias, códigos de turno,
> rutas, estados HTTP y nombres de campo.

---

## 8. Ampliación (misma fecha): V1c / V1d / V1e

> 🕯️ **Sección añadida.** Las secciones 1–7 anteriores **no se modifican**: describen la primera parte
> de la tanda T11. Esta sección es la **ampliación del 2026-10-15** (promoción n.º 2), que ejercita por
> UI tres superficies más y **promueve 12 celdas nuevas** de la matriz. Con esta ampliación el directorio
> [`evidence/2026-10-15/`](./) contiene **14** copias durables (las ocho de §7 más seis nuevas), todas
> verificadas **idénticas byte a byte** contra `.cache/frontend-acceptance/2026-10-15/` (`cmp`, 14 de 14,
> 0 diferencias; `sha256` idéntico origen/copia; hashes en [`sources-manifest.json`](./sources-manifest.json),
> lote `t11_v1c_v1e_2026_10_15`).

### 8.1 Qué se ejecutó

| Corrida | Tipo | Alcance | Actor(es) |
|---|---|---|---|
| **V1c** — puestos | Escritura por UI | CRUD completo de un puesto descartable propio: alta, ficha, `PUT`, `PATCH`, baja e histórico | **A1** |
| **V1d** — asignación principal | Escritura por UI | Cambio de la asignación principal de una cuenta descartable propia, con `PUT` y `PATCH` separados | **A2** |
| **V1e** — ejercicios | Escritura por UI | Alta, ficha, `PUT` y `PATCH` de un ejercicio descartable propio; baja por **relevo** de A1; lectura de recinto (`OP-RCT-003`) por A1 | **A7** (+ **A1** para la baja y la lectura de recinto) |

La acreditación de cada actor es **por correspondencia privada**: login de UI (`POST /api/auth/login/`
**200**) más `GET /api/auth/context/` **200** con el rol activo declarado (A1 `super_admin`, A2
`tenant_admin`, A7 `encargado_almacen`). Las cookies **no** se fabricaron. Cero cambios de RBAC, backend,
base de datos ni dependencias; sólo la API real del backend en marcha, desde la UI.

### 8.2 Resultados por corrida

**V1c — puestos (A1).** Total de llamadas de API: **52**. Secuencia: `POST /api/posiciones/` **201**
(id 60, marcador `T11A1POSMVA9YIWO`, rol del puesto **no privilegiado** `admin_unidad`, **sin holder a
propósito**), `GET /api/posiciones/60/` **200**, `PUT` **200**, `PATCH` **200**, `DELETE` **204**.
`GET` posterior **404**; residuo `positions_rows_with_marker` **0**; `gate.holder_assigned_on_purpose`
**false**; `cleanup_errors` **[]**; `page_errors` **[]**. La pestaña de histórico no emitió request
nuevo (`history_tab: "sin_request_nuevo"`), pero el histórico sí carga al abrir la ficha (`history_get`
**200**).

**V1d — asignación principal (A2).** Total de llamadas de API: **71**. `POST /api/organization-units/`
**201** (id 42) y `POST /api/usuarios/` **201** (id 43, marcador `T11A2PRAMVAA37QR`; rol primario
inicial `oficial_observador`). El modal «PUT / PATCH» del panel de asignaciones cambió el rol con
**PUT** a `admin_unidad` (**200**, detalle «Asignacion actualizada.») y luego, reflejando el cambio
anterior en los campos precargados, con **PATCH** a `comandante_unidad` (**200**). Lectura de
confirmación: `GET` **200** con `primary_role_after` `comandante_unidad`. Limpieza: usuario **204**,
cuatro puestos **204**, unidad **204**; `GET` posteriores **404**; residuo propio **0** en ambas
familias; `page_errors` **[]**.

**V1e — ejercicios (A7) con relevo de A1.** `POST /api/ejercicios/` **201** (id 18, marcador
`T11A7EJRMVAA73O0`), `GET /api/ejercicios/18/` **200**, `PUT` **200**, `PATCH` **200** (los tres por
**A7**). La ficha de A7 muestra el botón «Eliminar» **deshabilitado** con aviso de permiso y **sin
emisión de request**; la baja la ejecutó **A1** por relevo (`DELETE` **204**, `GET` posterior **404**).
Lectura de recinto por A1 (`OP-RCT-003`): fila abierta desde la lista, detalle **200**. Residuo
`exercises_rows_with_marker` **0**; `gate.a1_relay_for_delete` **true**; `used_super_admin_bypass_from_a7`
**false**; `page_errors` **[]**.

### 8.3 Celdas nuevas

Estado anterior `NOT_EXERCISED`; estado resultante `OBSERVED_OK`. Todas con `evidence_date: "2026-10-15"`
y `evidence_source_kind: "direct_orchestrator_playwright_ui"`.

| OP | Actor | Método + endpoint | Antes | Ahora |
|---|---|---|---|---|
| `OP-POS-002` | A1 | `POST /posiciones/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-POS-003` | A1 | `GET /posiciones/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-POS-004` | A1 | `PUT /posiciones/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-POS-005` | A1 | `PATCH /posiciones/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-POS-006` | A1 | `DELETE /posiciones/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-POS-009` | A1 | `GET /posiciones/{id}/historico/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-RCT-003` | A1 | `GET /recintos/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-USR-007` | A2 | `PUT /usuarios/{id}/asignacion-principal/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-USR-008` | A2 | `PATCH /usuarios/{id}/asignacion-principal/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-EJR-003` | A7 | `GET /ejercicios/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-EJR-004` | A7 | `PUT /ejercicios/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-EJR-005` | A7 | `PATCH /ejercicios/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |

#### 8.3.1 Conteos

| Estado | Antes de esta ampliación | Después | Δ |
|---|---:|---:|---:|
| `NOT_EXERCISED` | 945 | **933** | −12 |
| `PARTIAL` | 38 | **38** | 0 |
| `OBSERVED_OK` | 337 | **349** | +12 |
| Denominador | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**12 celdas** cambiaron, todas de `NOT_EXERCISED` a `OBSERVED_OK` (6 de **A1**, 2 de **A2**, 4 de **A7**).
Recuento obtenido recorriendo las 165 filas × 8 actores, **no** por agregación de conteos declarados;
coincide con `cell_state_counts`. `expected_by_actor` y el estado global **no** cambian.

### 8.4 Enriquecimiento de `OP-EJR-006` (A7, `PARTIAL` se conserva)

La celda `OP-EJR-006` de **A7** **no cambia de estado** (`PARTIAL`): se **añade** a su evidencia —sin
borrar la anterior— que el botón «Eliminar» de la ficha existe y está **deshabilitado** para A7 con aviso
de permiso («Se requiere permiso para eliminar ejercicios y consumos. El backend conserva la autoridad
final.»), **sin emisión de request**; la baja la ejecutó **A1** por **relevo** (`DELETE` **204**, `GET`
posterior **404**). Fuente: [`v1e-exercises-relay-a7-a1.json`](./v1e-exercises-relay-a7-a1.json).

### 8.5 Contraste positivo registrado

En **V1e** la UI de **A7** **sí** refleja correctamente el gating de permisos: el botón «Eliminar»
existe **deshabilitado** con aviso y **no** emite request, coherente con que A7 tiene
`create_exercises`/`update_exercises` pero no `delete_exercises`. Es un **contraste positivo** frente a
los desajustes de §12 de [`backend-debt.md`](../../../../bugs/backend-debt.md): allí la UI (A3
`admin_unidad`, A4 `comandante_unidad`) **ofrecía** la acción y el backend respondía **403**, y en el
tercer caso (A7) la UI simplemente **no ofrecía** la baja. En V1e, en cambio, la UI **comunica la
denegación por adelantado** (deshabilitado + aviso) y evita emitir la request. Se registra como
observación; **no** se corrige ni se diagnostica nada.

### 8.6 Límites

- **Acreditación por correspondencia privada.** Los alias A1/A2/A7 se corresponden con su rol por el
  login de UI y el `GET /api/auth/context/` **200**, no por una matriz actor→permiso documentada. Un
  **200**, un **201** o un **204** acreditan la aceptación de la operación, **no** que el resultado sea
  el esperado para el actor.
- **`expected_by_actor` sigue `NOT_VERIFIED`** en las 1320 celdas; esta ampliación no emite veredicto de
  aceptación. El estado global sigue **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**.
- **Ningún `204`/`404` acredita borrado físico en base.** Documentan ausencia en la respuesta del
  servidor, no la desaparición física del registro.
- **Alcance acotado.** `OP-RCT-003` se observó en **una** apertura de ficha desde la lista; `OP-USR-007/008`
  en **una** cuenta descartable propia; `OP-POS-002/003/004/005/006/009` en **un** puesto descartable
  propio sin holder; `OP-EJR-003/004/005` en **un** ejercicio descartable propio. No se infiere de otros
  actores, registros ni métodos.
- **Backend sin tocar**: sin cambios de código, schema, RBAC, datos originales ni credenciales; **sin
  commit ni push**. No se corrieron `tests` ni `build`, ni se abrió navegador más allá del propio
  recorrido, y no se reclama estado de ellos.

> 🕯️ Esta ampliación **no** afirma completitud del producto ni emite veredicto de aceptación. No
> contiene secretos, cookies, RUT, correos ni nombres de personas: sólo alias, códigos de turno, rutas,
> estados HTTP y nombres de campo.

---

## 9. Ampliación (misma fecha): V1f / V1g + limpieza

> 🕯️ **Sección añadida.** Las secciones 1–8 anteriores **no se modifican**: describen las dos primeras
> partes de la tanda T11. Esta sección es la **ampliación del 2026-10-15** (promoción n.º 3), que ejercita
> por UI dos superficies más —y una limpieza de relevo— y **promueve 5 celdas nuevas** de la matriz. Con
> esta ampliación el directorio [`evidence/2026-10-15/`](./) contiene **20** copias durables (las catorce
> de §7–§8 más seis nuevas), todas verificadas **idénticas byte a byte** contra
> `.cache/frontend-acceptance/2026-10-15/` (`cmp`, 20 de 20, 0 diferencias; `sha256` idéntico
> origen/copia; hashes en [`sources-manifest.json`](./sources-manifest.json), lote
> `t11_v1f_v1g_2026_10_15`).

### 9.1 Qué se ejecutó

| Corrida | Tipo | Alcance | Actor(es) |
|---|---|---|---|
| **V1f** — holders | Escritura por UI | Asignar y quitar holder de un puesto descartable propio con la cuenta propia, y sonda de la trampa §11 al borrar el puesto | **A1** |
| **V1g** — editor de cuenta | Escritura por UI | Edición de una cuenta descartable propia con `PUT` y `PATCH` separados, más la baja | **A3** |
| **Limpieza de relevo** | Escritura por UI | Baja de la unidad residuo de V1g (invisible en el árbol colapsado) por ficha directa | **A1** |

La acreditación de cada actor es **por correspondencia privada**: login de UI (`POST /api/auth/login/`
**200**) más `GET /api/auth/context/` **200** con el rol activo declarado (A1 `super_admin`, A3
`admin_unidad`). Las cookies **no** se fabricaron. Cero cambios de RBAC, backend, base de datos ni
dependencias; sólo la API real del backend en marcha, desde la UI.

### 9.2 Resultados por corrida

**V1f — holders (A1).** Total de llamadas de API: **72**. Puesto descartable propio (id **65**, marcador
`T11A1HLDMVABD354`, code `T11A1HLDMVABD354P`, rol de puesto `admin_unidad`, **sin holder a propósito**).
`POST /api/posiciones/` **201**, `PUT` **200**, `PATCH` **200**; `POST /api/posiciones/65/asignar-holder/`
**201** desde «Asignar holder» (selector real con **15** opciones; cuenta propia presente y elegida,
`assignment_id` **62**) y `POST /api/posiciones/65/quitar-holder/62/` **200** desde «Quitar holder» (la
fila activa **sí** ofrece «Quitar»). La baja del puesto `DELETE /api/posiciones/65/` respondió **500**
(deuda §11; ver §9.4). `GET` posterior del puesto **200**; residuo propio `positions_rows_with_marker`
**1**.

**V1g — editor de cuenta (A3).** Total de llamadas de API: **63**. Unidad descartable propia (id **43**,
marcador `T11A3USRMVABGZKI`, code `T11A3USRMVABGZKIU`) y cuenta descartable propia (id **44**, marcador
`T11A3USRMVABGZKI`, rol creado no privilegiado `oficial_observador`). `POST /api/usuarios/` **201**;
`PUT /api/usuarios/44/` **200** («Editar» con método PUT, «reemplazo completo») y `PATCH /api/usuarios/44/`
**200** (método PATCH, «campos modificados»), **confirmado por lectura** posterior (`GET` **200** con el
nombre modificado); `DELETE /api/usuarios/44/` **204** desde «Dar de baja → Confirmar baja» con `GET`
posterior **404**. Las dos posiciones laterales (**66** y **67**) se limpiaron después (`DELETE` **204**
×2). Residuo propio **0** en ambas familias; `gate.used_super_admin_bypass` **false** y
`created_account_login_attempted` **false**. `cleanup_errors`: el intento de baja de la unidad por el
enlace del árbol agotó el *timeout* de 30 s (unidad anidada invisible en el árbol colapsado).

**Limpieza de relevo (A1).** Total de llamadas de API: **15**. La unidad residuo de V1g (id **43**),
invisible en el árbol colapsado, se dio de baja por **ficha directa**: `DELETE /api/organization-units/43/`
**204** con `GET` posterior **404**, y barrido por marcador `T11A3USR` en árbol y tabla **0/0**
(`tree_links` 0, `table_rows` 0). No promueve celdas.

### 9.3 Celdas promovidas

Estado anterior `NOT_EXERCISED`; estado resultante `OBSERVED_OK`. Todas con `evidence_date: "2026-10-15"`
y `evidence_source_kind: "direct_orchestrator_playwright_ui"`.

| OP | Actor | Método + endpoint | Antes | Ahora |
|---|---|---|---|---|
| `OP-POS-007` | A1 | `POST /posiciones/{id}/asignar-holder/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-POS-008` | A1 | `POST /posiciones/{id}/quitar-holder/{assignment_id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-USR-004` | A3 | `PUT /usuarios/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-USR-005` | A3 | `PATCH /usuarios/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |
| `OP-USR-006` | A3 | `DELETE /usuarios/{id}/` | `NOT_EXERCISED` | `OBSERVED_OK` |

#### 9.3.1 Conteos

| Estado | Antes de esta ampliación | Después | Δ |
|---|---:|---:|---:|
| `NOT_EXERCISED` | 933 | **928** | −5 |
| `PARTIAL` | 38 | **38** | 0 |
| `OBSERVED_OK` | 349 | **354** | +5 |
| Denominador | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**5 celdas** cambiaron, todas de `NOT_EXERCISED` a `OBSERVED_OK` (2 de **A1**, 3 de **A3**). Recuento
obtenido recorriendo las 165 filas × 8 actores, **no** por agregación de conteos declarados; coincide con
`cell_state_counts`. `expected_by_actor` y el estado global **no** cambian.

### 9.4 Nota a la deuda §11

La corrida V1f reprodujo la trampa de [§11 de `backend-debt.md`](../../../../bugs/backend-debt.md) en un
caso nuevo: `POST asignar-holder/` **201** → `POST quitar-holder/{id}/` **200** (la fila **activa** sí
ofrece «Quitar») → `DELETE /api/posiciones/{id}/` **500**. **El retiro del holder no restaura la
borrabilidad**: el `Assignment` inactivo persiste y la FK `PROTECT` sigue bloqueando. La observación
fechada del **2026-10-15** quedó registrada en §11.1 de ese fichero. Es **registro**, sin fix; el `500` es
**dato del barrido**, no del contrato de `OP-POS-007`/`OP-POS-008`.

### 9.5 Residuo del día

- **Único residuo propio pendiente de esta tanda:** el puesto descartable id **65** (marcador
  `T11A1HLD…`), indeleble por la deuda §11. **Reportado, no reparado por base.**
- **La unidad del incidente V1g quedó cerrada.** La unidad id **43** (marcador `T11A3USR`) fue dada de
  baja por relevo de A1 (`204` + `404` + barrido **0/0**), pese a haber quedado invisible en el árbol
  colapsado.
- Residuo de las familias de V1g (cuenta y posiciones): **0**.

### 9.6 Límites

- **Acreditación por correspondencia privada.** Los alias A1/A3 se corresponden con su rol por el login
  de UI y el `GET /api/auth/context/` **200**, no por una matriz actor→permiso documentada. Un **200**,
  un **201** o un **204** acreditan la aceptación de la operación, **no** que el resultado sea el esperado
  para el actor.
- **`expected_by_actor` sigue `NOT_VERIFIED`** en las 1320 celdas; esta ampliación no emite veredicto de
  aceptación. El estado global sigue **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**.
- **Ningún `204`/`404` acredita borrado físico en base.** Documentan ausencia en la respuesta del
  servidor, no la desaparición física del registro.
- **Alcance acotado.** `OP-POS-007/008` en **un** puesto descartable propio sin holder; `OP-USR-004/005/006`
  en **una** cuenta descartable propia. No se infiere de otros actores, registros ni métodos.
- **Backend sin tocar**: sin cambios de código, schema, RBAC, datos originales ni credenciales; **sin
  commit ni push**. No se corrieron `tests` ni `build`, ni se abrió navegador más allá del propio
  recorrido, y no se reclama estado de ellos.

> 🕯️ Esta ampliación **no** afirma completitud del producto ni emite veredicto de aceptación. No
> contiene secretos, cookies, RUT, correos ni nombres de personas: sólo alias, códigos de turno, rutas,
> estados HTTP y nombres de campo.
