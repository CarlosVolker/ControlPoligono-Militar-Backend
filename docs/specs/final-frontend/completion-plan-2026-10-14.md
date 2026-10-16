---
status: in-progress
risk: [auth, permissions, sensitive-data, performance]
updated: 2026-10-14
---

# completion-plan-2026-10-14 — Plan maestro de cierre del frontend integral

> Plan maestro hermano de la spec vigente [`final-frontend`](./index.md). Un solo archivo, sin
> variantes ni sidecars. Persiste **planificación** y su **estado de ejecución**: la columna
> `Estado de ejecución` de §Tareas registra qué se completó y qué queda pendiente.
>
> **Aprobado el 2026-10-14**, con `status: in-progress`: el operador aprobó el plan y emitió la
> orden de implementación en la misma frase explícita («Ejecuta el plan de inicio a fin»). Eso
> **habilita** la ejecución; no cierra el trabajo. **Ninguna tarea del plan está en `done`**: el
> cierre es de `T12` y sigue pendiente.
>
> El detalle de lo ejecutado, con fuentes exactas, está en
> [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md).
>
> 🕯️ **La aceptación integral no se promueve.** Este documento no altera la matriz de aceptación:
> el **conteo vigente** (corte 2026-10-16) es **1107 `OBSERVED_OK` / 7 `PARTIAL` / 206 `NOT_EXERCISED`** sobre
> 1320 celdas, `expected_by_actor` quedó **poblado desde C-4** (**794 `EXPECTED_ALLOW` / 505 `EXPECTED_DENY` /
> 21 `EXPECTED_ALLOW_SCOPED`**) y el estado global sigue **`NOT_VERIFIED`** con conclusión de producto
> **`NO_CUMPLIDO`**.
>
> 📜 **Nota de actualización.** El corte **histórico** de esta cabecera —**198 `OBSERVED_OK` / 19 `PARTIAL` /
> 1103 `NOT_EXERCISED`**— describía el estado previo a las tandas de acreditación por alias del 2026-10-14 y
> se **conserva** como registro; las tandas posteriores (A1, A2, A3, A4, A5, A6, A7 y A8, con sus limpiezas)
> elevaron el conteo al corte vigente indicado arriba. Con las **ocho** tandas del **2026-10-14** queda
> **cerrada la campaña documental** de acreditación por actor (§5 septendecies de
> [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md)): **no** hay
> cierre de aceptación integral. `expected_by_actor` **no** cambió.
>
> - **2026-10-15 — Tanda T11 (V0/V1a/V1b).** Ejecutada el **2026-10-15**: barrido **V0** multi-actor
>   (8/8 actores, 19 rutas) y módulos **V1a** (alta formal de persona y asignaciones) y **V1b/V1b2**
>   (relaciones de recinto) por UI con el alias **A2** acreditado. **7** celdas de **A2** promovidas
>   (`OP-USR-002/009/010/011`, `OP-UNT-010`, `OP-RCT-007/008`). Conteo resultante **337 `OBSERVED_OK` /
>   38 `PARTIAL` / 945 `NOT_EXERCISED`** sobre 1320; `expected_by_actor` y estado global **sin
>   cambios**. Fuentes en [`evidence/2026-10-15/`](./evidence/2026-10-15/).
>
> - **2026-10-15 — Promoción n.º 2 (T11, V1c/V1d/V1e).** Ejecutada el **2026-10-15**: puestos por UI
>   con el alias **A1** acreditado (CRUD completo), asignación principal por UI con el alias **A2**
>   (`PUT` y `PATCH` separados) y ejercicios por UI con el alias **A7** (con baja por **relevo** de A1 y
>   lectura de recinto `OP-RCT-003` de A1). **12** celdas nuevas promovidas de `NOT_EXERCISED` a
>   `OBSERVED_OK`: `OP-POS-002/003/004/005/006/009` (A1), `OP-USR-007/008` (A2), `OP-EJR-003/004/005`
>   (A7) y `OP-RCT-003` (A1); además se **enriquece sin cambiar de estado** la celda `OP-EJR-006` de A7
>   (`PARTIAL` se conserva). Conteo resultante **349 `OBSERVED_OK` / 38 `PARTIAL` / 933 `NOT_EXERCISED`**
>   sobre 1320; `expected_by_actor` y estado global **sin cambios**. Fuentes en
>   [`evidence/2026-10-15/`](./evidence/2026-10-15/).
>
> - **2026-10-15 — Promoción n.º 3 (T11, V1f/V1g).** Ejecutada el **2026-10-15**: holders por UI con el
>   alias **A1** acreditado (asignar y quitar holder sobre un puesto descartable propio, con sonda de la
>   trampa §11) y editor de cuenta por UI con el alias **A3** acreditado (`PUT` y `PATCH` separados más la
>   baja), con la limpieza de relevo de A1 sobre la unidad residuo de V1g. **5** celdas nuevas promovidas
>   de `NOT_EXERCISED` a `OBSERVED_OK`: `OP-POS-007/008` (A1) y `OP-USR-004/005/006` (A3). Conteo
>   resultante **354 `OBSERVED_OK` / 38 `PARTIAL` / 928 `NOT_EXERCISED`** sobre 1320; `expected_by_actor`
>   y estado global **sin cambios**. Deuda §11 actualizada (observación fechada del 2026-10-15, §11.1).
>   Fuentes en [`evidence/2026-10-15/`](./evidence/2026-10-15/).
>
> - **2026-10-15 — C-4 (matriz actor→permiso).** Derivada estáticamente y persistida en [`coverage/actor-permission-matrix-2026-10-15.md`](./coverage/actor-permission-matrix-2026-10-15.md): método de traducción `OP`→`(resource, action)`→`permission_code`, perfiles esperados A1–A8, expectativa por celda y contraste inicial (cero `OBSERVED_OK` contra `EXPECTED_DENY`). El documento **no cambia celdas**: `expected_by_actor` sigue `NOT_VERIFIED` hasta su consumo.
>
> - **2026-10-16 — C-4 consumida.** `expected_by_actor` poblado en las 1320 celdas desde [`coverage/actor-permission-matrix-2026-10-15.md`](./coverage/actor-permission-matrix-2026-10-15.md); distribución **794 `EXPECTED_ALLOW` · 505 `EXPECTED_DENY` · 21 `EXPECTED_ALLOW_SCOPED`**; estados y contadores intactos; la certificación esperado-vs-observado queda como paso posterior.
>
> - **2026-10-16 — Certificación esperado-vs-observado (primera pasada).** 392 celdas contrastadas contra `expected_by_actor` (C-4); **31 denegaciones certificadas** (`PARTIAL`→`OBSERVED_OK`), 5 fallos no-autorización y 2 sin resolver permanecen `PARTIAL`; conteo **385 / 7 / 928**; fuentes en `evidence/2026-10-16/`.
>
> - **2026-10-16 — Certificación de contenido (primera pasada).** Solo lectura: conjuntos visibles SCOPED contrastados (unidades A3/A7 en subconjunto estricto, delta 11; lecciones A6→0 / A8→1 con participación confirmada); sin cambios de estado ni contadores; fuentes en `evidence/2026-10-16/`.
>
> - **2026-10-16 — Barrido de lecturas (Barrido 1+2, pasada v2).** Ejecutada el **2026-10-16**: **273** celdas `GET` `NOT_EXERCISED` ejercitadas por lectura directa con la sesión real de cada actor (8/8 acreditadas por correspondencia: login UI + contexto 200 con rol primario). **182** celdas certificadas (`NOT_EXERCISED`→`OBSERVED_OK`): **145** lecturas `ALLOW`/`SCOPED` en 2xx (Barrido 1) y **37** denegaciones `DENY` en 403 (Barrido 2, 12 de ellas con placeholder de sondeo); **0** desajustes de autorización. **91** sin certificar: **88** «sin filas propias» (listado propio 200 y vacío, causa de contenido/datos) + **3** fallos de servidor (`OP-LES-009` A1/A2/A8, 500, deuda `backend-debt.md` §9). Conteo resultante **567 `OBSERVED_OK` / 7 `PARTIAL` / 746 `NOT_EXERCISED`** sobre 1320; `expected_by_actor` y estado global **sin cambios**. Valida **C-4** en las 273 celdas ejercitadas (**0** discrepancias). Fuentes en [`evidence/2026-10-16/`](./evidence/2026-10-16/).
>
> - **2026-10-16 — Siembra de contenido de desarrollo y re-barrido de lecturas.** Ejecutada el **2026-10-16** por orden del operador (sembrar contenido de desarrollo donde sea necesario): **5** recursos sembrados por **API real** (sesión de **A1** + `X-Org-Unit-Code`, unidad compartida id 5) — polígono **2**, lección **2**, fracción **2**, ejercicio **19**, arma **17**, visibilidad confirmada por lectura de cada alias — y **2** por **ORM de desarrollo** (consumo de munición **1**, consumo de arma **1**), porque el alta por API de consumo de munición está **rota** (deuda §8); contenido marcado (`DEV` / `Contenido de desarrollo (seed 2026-10-16)`), reversible por marcador e id. Re-barrido **v2** post-siembra: **91** celdas `GET` objetivo, **84** certificadas (`NOT_EXERCISED`→`OBSERVED_OK`, todas `MATCH_ALLOW` en 2xx), **0** desajustes de autorización, **4** `UNPROBEABLE` (RBAC `OP-OVR-003`/`OP-PPR-003` A1–A2 sin filas — pendiente de decisión del operador) y **3** fallos de servidor (`OP-LES-009` A1/A2/A8, 500, deuda §9; crashea solo con resultados que renderizar — la lección sembrada sin resultados da 200). Conteo resultante **651 `OBSERVED_OK` / 7 `PARTIAL` / 662 `NOT_EXERCISED`** sobre 1320 (antes 567/7/746); `expected_by_actor` y estado global **sin cambios**. Las altas ejercitadas por A1 durante la siembra (`OP-RNG-002`/`LES-002`/`FRC-002`/`EJR-002`/`WPN-002`) quedan como observación del seed y **no** se certifican. Fuentes en [`evidence/2026-10-16/`](./evidence/2026-10-16/).
>
> - **2026-10-16 — Siembra RBAC de desarrollo y tercer barrido de lecturas.** Ejecutada el **2026-10-16** por orden del operador («siembra todo»): **2** filas RBAC de desarrollo para habilitar las celdas `OP-OVR-003` y `OP-PPR-003` de A1–A2 — `PositionPermission` **id 2** por **API real** (`POST` por A1, **201**; sobre el puesto 4, `admin_unidad` **sin asignación activa** → fila neutra) y `UserPermissionOverride` **id 1** por **ORM de desarrollo** (única vía: el alta por API responde **500**), permiso `view_audit_logs`, `allowed` `true`, marcador `Contenido de desarrollo (seed 2026-10-16)`, reversible por marcador e id. **Hallazgo del alta de overrides:** `POST /api/authz/overrides/` → **500** `AssertionError` de DRF por **doble campo** (`permission`, `permission_code`) con el mismo `source` en `UserPermissionOverrideSerializer` (`apps/authorization/serializers.py:55-75`); el defecto es **estructural** y dispara en **todo** payload válido (deuda registrada en [`backend-debt.md`](../../bugs/backend-debt.md), 2026-10-16). Tercer barrido **v2** post-siembra RBAC: **7** celdas `GET` objetivo, **4** certificadas (`NOT_EXERCISED`→`OBSERVED_OK`, todas `MATCH_ALLOW` en 2xx con identificador propio: `OP-OVR-003`/`OP-PPR-003` A1–A2), **0** desajustes de autorización y **3** fallos de servidor (`OP-LES-009` A1/A2/A8, 500, deuda §9). Conteo resultante **655 `OBSERVED_OK` / 7 `PARTIAL` / 658 `NOT_EXERCISED`** sobre 1320 (antes 651/7/662); `expected_by_actor` y estado global **sin cambios**. Las altas ejercitadas por A1 (`OP-OVR-002` no concluida por el defecto estructural; `OP-PPR-002` **201**) quedan como observación del seed y **no** se certifican. Con esto el carril de lecturas `GET` queda resuelto salvo los **3** del §9. Fuentes en [`evidence/2026-10-16/`](./evidence/2026-10-16/).
>
> - **2026-10-16 — Corrección del auto-cierre de modales de Organización.** Ejecutada el **2026-10-16**: corregido el defecto registrado en runtime el **2026-10-15** («Agregar unidad al recinto» no se cerraba solo tras el éxito). Causa confirmada en código: en [`front/src/views/organization/OrganizationView.vue`](../../../front/src/views/organization/OrganizationView.vue), `perform()` invocaba `handlers.onSuccess` **antes** de liberar el ticket, de modo que `modalBusy` seguía en `true` y `closeModal()` **se autobloqueaba** con su guarda anti doble-submit. Arreglo mínimo y localizado: helper idempotente `releaseTicket(ticket)` y liberación **antes** de los handlers en `perform()`, con el `finally` como red. Prueba dirigida nueva `front/tests/focused/organization-modal-autoclose.test.ts` (**3** pruebas, rojo → verde); verificado por el orquestador: dirigida **3/3**, suite enfocada **259/259**, `vue-tsc --noEmit` **exit 0**. Delta semántico declarado: un manejador que lance excepción ahora devuelve `STALE` (antes `onFailure`/`uncertainMutation`), **sin camino del producto dependiente**. Barrido del patrón en otras vistas (Authorization/Exercises ya liberaban antes; Armory/Identity sin guarda): ninguna afectada. **No** cambia la matriz ni el estado global. Fuentes en [`evidence/2026-10-16/modal-autoclose-fix.md`](./evidence/2026-10-16/modal-autoclose-fix.md).
>
> - **2026-10-16 — Lote de fichas de escritura tiro+armerías (655→701).** Ejecutada el **2026-10-16** por orden del operador: **46** celdas de **escritura** `NOT_EXERCISED` con expectativa `ALLOW`/`SCOPED` (C-4) ejercitadas por **llamada directa con la sesión real de cada actor + `X-CSRFToken`** (la misma llamada que emite la UI) sobre **cadenas descartables** con marcador `T11<ALIAS><FAM>-01` — tiro (RNG/LES/FRC) y armerías (ARM): `OP-RNG-002/004/005` (A1,A2,A5) + `OP-RNG-006` (A1); `OP-LES-002/004/005/006` (A1,A2,A5); `OP-FRC-002/004/005/006` (A1,A2,A5); `OP-ARM-002` (A2,A3,A5) + `OP-ARM-004/005` (A1,A2,A3,A5) + `OP-ARM-006` (A2). Resultado **46/46** con **estado exacto** (`POST` **201** / `PUT` **200** / `PATCH` **200** / `DELETE` **204**); **3** relevos de limpieza de A1 (polígono A2 `id` 4, armería A5 `id` 10, polígono A5 `id` 5, todos **204**) y, en la limpieza posterior, el relevo de la **armería A3 `id` 9** (**204**) —residuo que el lote dejó por omisión del relevo de A3— más **barrido estricto del token `T11A` en 8 familias → 0 coincidencias** (el conteo previo con token laxo `T11` marcaba un **falso positivo**: subcadena de un timestamp ISO `…T11:…`; corregido y re-corrido). Conteo resultante **701 `OBSERVED_OK` / 7 `PARTIAL` / 612 `NOT_EXERCISED`** sobre 1320 (antes 655/7/658); `expected_by_actor` y estado global **sin cambios**. Valida **C-4** en las 46 celdas (**0** discrepancias). Fuentes en [`evidence/2026-10-16/tiro-writes-batch.md`](./evidence/2026-10-16/tiro-writes-batch.md).
>
> - **2026-10-16 — Lote de fichas de escritura USR (701→720).** Ejecutada el **2026-10-16**: **22** celdas de **escritura** `NOT_EXERCISED` del dominio de identidad con expectativa `ALLOW`/`SCOPED` (C-4) — alta formal (`OP-USR-002` ×A1/A3/A5), asignaciones (`OP-USR-007/008/009/010/011` ×A1/A3) y credenciales (`OP-USR-013/014/016` ×A1/A2/A3) — ejercitadas por **llamada directa con la sesión real de cada actor + `X-CSRFToken`** sobre **usuarios descartables** (marcadores `T11<ALIAS>USR-01`, `T11RT`, `T11R2`; RUT sintéticos no persistidos; credenciales sólo sobre el descartable). Hicieron falta **tres corridas**: la corrida 1 (**10** en 2xx) + dos reintentos (**2** + **7**) = **19 celdas certificadas** (`NOT_EXERCISED`→`OBSERVED_OK`; `POST` **201**/`PUT` **200**/`PATCH` **200**), con limpieza por A1 (`DELETE` **204** → `GET` **404**) y **barrido estricto → 0** en cada una. **3 celdas bloqueadas** (`OP-USR-016` desbloquear A1/A2/A3): dos por **defectos de servidor documentados** (`_ensure_tirador_assignment` → `MultipleObjectsReturned`, `views.py:118`; y `NameError: name 'AccessAttempt' is not defined`, `views.py:715` — deuda §14 y §15) y la tercera por la cadena de A3 del reintento 1, que cayó en **404 por un defecto del arnés** propio del lote (unidad resuelta desde A1 y no desde el alias destino A3), **declarado y corregido** en el reintento 2 (cadena de A3 7/7 con la unidad resuelta desde A3). Conteo resultante **720 `OBSERVED_OK` / 7 `PARTIAL` / 593 `NOT_EXERCISED`** sobre 1320 (antes 701/7/612); `expected_by_actor` y estado global **sin cambios**. Valida **C-4** en las 19 celdas ejercitadas (**0** discrepancias). Residuo conocido de `identity.Person` (deuda §10) declarado, no limpiado. Fuentes en [`evidence/2026-10-16/usr-writes-batch.md`](./evidence/2026-10-16/usr-writes-batch.md).
>
> - **2026-10-16 — Lote 2 de fichas de escritura, 2a + 2b (720→778).** Ejecutada el **2026-10-16** por orden del operador, en **dos corridas**: **2a** — autoservicio (**23** celdas) — y **2b** — descartables (**35** celdas) —, **58 celdas** de **escritura** `NOT_EXERCISED` con expectativa `ALLOW`/`SCOPED` (C-4) ejercitadas por **llamada directa con la sesión real de cada actor + `X-CSRFToken`**. **2a:** `OP-PRF-002` ×8 (`PUT` de preferencias de apariencia legacy + **8** restauraciones **200**), `OP-AUT-003` ×8 (`POST` de selección de unidad activa propia, no-op funcional, **200**) y `OP-AUT-005` ×7 (`POST` de cierre de sesión como última operación del actor, **200**; A7 sin celda). **2b:** `CAR` **17** (altas ×A1/A2/A3/A5/A7 → `PUT` → `PATCH`; bajas propias A1/A2 y relevos de A1 para A3/A5/A7, **204**), `MEM` **6**, `RCT` **5**, `UNT` **5**, `POS` **2**, con una **pre-fase de siembra** de **2** armas descartables (`T11SECDWPN-02`, ids 18/19) para liberar las parejas `(consumo, arma)` de A5/A7 (sembradas por API y borradas al final, **204 → 404**). Resultado **58/58** con **estado exacto** (`POST` 201 / `PUT` 200 / `PATCH` 200 / `DELETE` 204) y **barrido estricto `T11A|T11RT|T11R2` en 8 familias → 0**; las familias fuera del barrido (recintos/membresías/consumos-arma/puestos) quedaron cubiertas por los **`get_after` 404** de la limpieza. Conteo resultante **778 `OBSERVED_OK` / 7 `PARTIAL` / 535 `NOT_EXERCISED`** sobre 1320 (antes 720/7/593); `expected_by_actor` y estado global **sin cambios**. Valida **C-4** en las 58 celdas (**0** discrepancias). **Consignado sin inflarlo:** la **trampa §11 NO disparó** — el puesto descartable `id` 68 se dio de baja **204 → 404** sin el `500` `ProtectedError` de la deuda — y la **sospecha estática** de un `403` para `OP-CAR-002` de A3/A5 **no se confirmó** en runtime (**201**). Fuentes en [`evidence/2026-10-16/lote2-writes-batch.md`](./evidence/2026-10-16/lote2-writes-batch.md).
>
> - **2026-10-16 — Barrido de denegaciones de escritura no-RBAC (778→969→1107).** Ejecutada el **2026-10-16**: el **barrido de denegaciones** ejercita las celdas `POST`/`PUT`/`PATCH`/`DELETE` que seguían `NOT_EXERCISED` con expectativa **`EXPECTED_DENY`** (C-4) — **fuera** las familias RBAC (`OP-OVR-*`, `OP-PPR-*`, `OP-RPR-*`, `OP-ROL-*`). Cada celda se probó con la **sesión real del actor + `X-CSRFToken`**; **solo el `403` exacto certifica**. **Sweep 1** (identidad/organización: `USR`·`RCT`·`POS`·`CAL`·`UNT`·`MEM`): **191/191** certificadas, conteo **778→969 `OBSERVED_OK` / 7 `PARTIAL` / 535→344 `NOT_EXERCISED`**. **Sweep 2** (tiro/almacén/resultados: `RNG`·`RES`·`LES`·`FRC`·`CMN`·`CAR`·`ARM`·`EJR`·`WPN`): **138/150** certificadas y **12 declaradas no probadas** (`OP-CMN-004/005/006`, sin objetivo descartable sin ORM por el alta rota, deuda §8) que la matriz **no** toca; conteo **969→1107 `OBSERVED_OK` / 7 `PARTIAL` / 344→206 `NOT_EXERCISED`**. Total **341 objetivos no-RBAC → 329 certificadas por `403` exacto** y **12 declaradas**, con **0 desajustes** y **0 discrepancias** contra C-4; `expected_by_actor` y estado global **sin cambios**. Fuentes en [`evidence/2026-10-16/denials-sweeps.md`](./evidence/2026-10-16/denials-sweeps.md).

## Índice

1. [Problema y por qué](#problema-y-por-qué)
2. [Baseline de partida](#baseline-de-partida)
3. [Fuera de alcance](#fuera-de-alcance)
4. [Criterios de aceptación (EARS)](#criterios-de-aceptación-ears)
5. [Diseño](#diseño)
6. [Tareas](#tareas)
7. [Verificación](#verificación)
8. [Notas y decisiones](#notas-y-decisiones)

---

## Problema y por qué

El objetivo vigente es el **producto final integral**: el cliente Vue 3 + TypeScript + Vue Router +
Pinia + CSS vanilla, con fidelidad **1:1** al Design System externo, consumiendo **sólo** datos del
backend real y sin ninguna capacidad ficticia. La matriz de aceptación está lejos de ese objetivo y
el trabajo restante excede con mucho lo que cabe en una corrida. Falta un plan maestro que ordene
el trabajo en **tres carriles** secuenciados por dependencias reales, con conteo explícito de
ejecutores y auditores, y que separe con precisión lo que es **implementación faltante** de lo que
es sólo **verificación faltante**.

El plan **no** se limita a clasificar la matriz: propone cerrar el frontend restante hasta que sea
**implementable y verificable**. Lo que una dependencia externa impida —hoy, en su mayoría, la
aceptación integral— se declara como dependencia abierta, no como éxito ni como tarea cerrada.

- **Riesgo técnico:** inflar alcance con capacidades sin respaldo de backend; comprar progreso
  aparente con escrituras ficticias; bloquear todo el plan por una familia de pruebas bloqueada;
  sobreescribir resultados de auditoría previos; degradar la fidelidad al DS por optimizaciones.
- **Revisor:** distinto de los ejecutores; los roles de auditoría son Hellknight (calidad),
  Shelyn (UX/UI) y Dhampir (seguridad), con Hasted (performance) sólo de forma condicional.
- **Tipo de trabajo:** planificación de feature (no corrección).

## Baseline de partida

Corte verificado en [`estado-integral-2026-10-12.md`](./estado-integral-2026-10-12.md) §11.1
(2026-10-14), denominador **165 `OP-*` × 8 actores = 1320 celdas**:

| Estado | Celdas | Lectura |
|---|---:|---|
| `OBSERVED_OK` | **198** | Operación y actor acreditados por evidencia propia |
| `PARTIAL` | **19** | Ejercicio incompleto o acotado a parte de la fila |
| `NOT_EXERCISED` | **1103** | Combinación de operación y actor **no acreditada** |

Sobre esta cobertura hay dos precisiones que este plan no deja pasar:

- La cobertura es **acotada por operación y por actor**, no agregada ni uniforme: una misma operación
  puede estar acreditada para un actor y no para otro, y lo acreditado suele ser un recorte
  (alta, edición, baja o lectura) de una fila de varias. **Este documento no afirma qué actor
  predomina** en el conjunto.
- `NOT_EXERCISED` significa que esa combinación de operación y actor no fue acreditada. **No** afirma
  ausencia absoluta de evidencia runtime en el sistema: filas `PARTIAL`, lecturas de verificación y
  recorridos de apoyo existen y no se contradicen aquí.

Límites declarados que el plan conserva: `expected_by_actor` sigue `NOT_VERIFIED` en las 1320
celdas — un `201`, `200` o `204` acredita que la escritura se aceptó, **no** que el conjunto de
visibles sea el correcto para el actor; el estado global sigue `NOT_VERIFIED` y la conclusión de
producto `NO_CUMPLIDO`. Ninguna cifra de este plan se infiere de conteos agregados: provienen de
recorrer filas reales de la matriz.

## Fuera de alcance

Queda explícitamente fuera, y no se toca sin orden nueva del operador:

- **Backend**: código, esquema, migraciones, base de datos, caché y dependencias. Sólo se **reportan**
  los huecos. Si un bloque exige backend, se propone **encargo separado**; no se autoriza por
  inferencia. Las dependencias de API externas que este plan declara **no introducen contratos
  nuevos**: son requisitos previos o bloqueos, no propuestas de diseño.
- **Restaurar revisiones de auditoría revocadas.** No se reactiva ningún gate anterior por el
  silencio del operador: esta propuesta es **nueva** y está pendiente de aprobación.
- **Auditoría ejecutada**: este documento no ejecuta auditorías, sólo las planifica.
- **Marcar specs como `done`**: la spec padre no se cierra mientras quede obligatorio pendiente,
  backend bloqueado o prerrequisito sin resolver.
- **Arranque de plan en esta sesión**: los servidores y el navegador ya están autorizados por el
  operador para trabajo autónomo en conversación, pero **este plan no arranca nada**.
- `Portal-Wardens`, `Kobold-Scholar` y `Blight-Inquisitor` no se amplían salvo cambio de API o
  esquema externo autorizado, o petición explícita del operador. `Dhampir-Slayer` es el dueño de la
  revisión de seguridad; no delega seguridad en `Hellknight-Inspector`.

## Criterios de aceptación (EARS)

- **AC-1.** Cuando el operador apruebe el plan, el sistema lo registra como aprobado y **no** emite
  por sí mismo ninguna orden de implementación: el operador, autoridad final, emite esa orden por
  separado, y ninguna tarea de implementación queda habilitada antes de esa orden.
- **AC-2.** Cuando el bloque de capacidades reciba el mapa focalizado, el sistema clasifica cada
  brecha en `IMPLEMENTACIÓN FALTANTE`, `DEFECTO DEMOSTRADO`, `VERIFICACIÓN FALTANTE`,
  `DEPENDENCIA DE BACKEND`, `PRERREQUISITO/AUTORIZACIÓN` o `RESTRICCIÓN DE CONTRATO`, y ninguna
  clasificación se emite a partir de un `NOT_EXERCISED` aislado.
- **AC-3.** Cuando un consumidor anotado cambie de principal, de contexto o de sesión, el sistema no
  puebla ni repuebla datos privados de otro contexto, y una escritura de resultado incierto no se
  repite en lectura.
- **AC-4.** Cuando se previsualice una eliminación con **ocho contadores de destino**, el sistema
  exige los ocho y refresca la vista **sólo** tras éxito confirmado.
- **AC-5.** Cuando se cree una cuenta con el flujo formal de alta, el sistema la crea con sus
  asignaciones iniciales y su credencial gestionada; y cuando se edite la identidad, el sistema
  reconcilia el contexto primario tras la escritura y **no** introduce ninguna modificación de
  autenticación en el backend.
- **AC-6.** Cuando se evalúe autorización, el sistema contrasta el actor esperado contra permisos y
  scope fundamentados, expone denegación semántica real y no ofrece ni permite modificar el perfil de
  la cuenta propia cuando el backend lo declara de sólo lectura.
- **AC-7.** Cuando se persiste la apariencia, el sistema guarda los **ocho ejes** con **todas** sus
  opciones reales, sus valores por defecto y el restablecimiento, contra la API y nunca contra
  `localStorage`, con aislamiento entre cuentas y fidelidad renderizada al DS.
- **AC-8.** Cuando se cambie una entidad de tiro, almacén o ejercicios con éxito confirmado, el
  sistema invalida los consumidores de datos reales dependientes, y si el alta o la edición está
  bloqueada por backend, **no** siembra API para aparentar interfaz.
- **AC-9.** Cuando exista un hallazgo de calidad, interfaz o seguridad **reproducible**, el sistema lo
  registra con alcance y riesgo de regresión, le asigna un dueño y **no** trata el tamaño de un
  archivo como defecto por sí solo.
- **AC-10.** Cuando el carril de performance tenga un baseline reproducible aceptado como parte de
  este plan, el sistema mide con él; y cuando exista un problema medido, el sistema optimiza y
  vuelve a medir **bajo las mismas condiciones**, sin declarar verificación de performance a partir
  de una compilación.
- **AC-11.** Cuando se acepte un flujo, el sistema contrasta **positivo legítimo**, `PUT` y `PATCH`
  por separado, y **permitido frente a denegado**, sin fabricar escrituras de API ni cookies.
- **AC-12.** Cuando cierre el plan, el sistema conserva historia, conteos, anclas, expectativas y
  evidencia de limpieza, y no declara exactitud falsa por agregar conteos declarados.

## Diseño

- **Decisión:** tres carriles —**capacidades**, **calidad/performance** y **aceptación**— en trece
  bloques `C0..C12`, ordenados por dependencia real, no por familia de archivos. **Alternativas:**
  una lista plana de tareas atómicas. **Razón:** con 1103 de 1320 celdas sin acreditar, el cuello de
  botella a ordenar es la evidencia y la dependencia, no el archivo donde cae cada línea.
- **Decisión:** conservar los scripts y el proceso existentes, sin arquitectura nueva y **sin
  dependencias nuevas** salvo las que este plan justifique por escrito. **Alternativas:** introducir
  una capa de datos o una librería de estado. **Razón:** el alcance es cierre de producto, no
  rediseño.
- **Decisión:** el bloque `C1` prohíbe toda implementación motivada sólo por un `NOT_EXERCISED`.
  **Razón:** un código sin consumidor ancla clasificado no es trabajo, es ruido con riesgo de
  regresión.
- **Decisión:** el baseline y la medición de performance se producen **dentro de este plan**, y la
  optimización es condicional a un problema medido. **Razón:** sin medición propia, cualquier
  umbral sería inventado, y cualquier presupuesto derivado de ella no se sostiene.
- **Trade-off aceptado:** la cobertura de aceptación crecerá más lento que la implementación,
  porque un actor sin segundo tenant o sin listener SMTP no se ejercita por invención. Se acepta
  `NOT_VERIFIED` parcial antes que evidencia fabricada.

### Carriles y bloqueos

| Carril | Bloques | Puede empezar |
|---|---|---|
| Preparación y capacidades | `C0`, `C1`, `C2`, `C3`, `C4`, `C5`, `C6`, `C7`, `C8` | Tras `C0` |
| Calidad y performance | `C9`, `C10` | `C9` tras `C1`; `C10` con baseline propio |
| Aceptación y cierre | `C11`, `C12` | `C11` por familia, en cuanto su paquete esté listo; `C12` al final |

Un bloque de una familia que resulte bloqueado **no detiene** los bloques independientes de otras
familias; se registra como dependencia abierta. En particular, el `500` de munición **no** detiene el
tramo de almacén y ejercicios: sólo detiene el alta de consumos.

### Conteo explícito de roles

| Rol | Cantidad | Nota |
|---|---:|---|
| `Code-Transmuter` | **1 por defecto**, +1 opcional | Sobre archivos disjuntos del anterior |
| `Dwarven-Spelunkers` | 1 | Mapa focalizado de brechas (`C1`) |
| `Lore-Master` | 1 | Persistencia documental |
| `QA-Goblin` | 1 | Diseño de pruebas; **diseña, no implementa y no audita** |
| `Hellknight-Inspector` | 1 | Auditoría de calidad |
| `Shelyn-Cleric` | 1 | Auditoría de interfaz y experiencia de uso |
| `Dhampir-Slayer` | 1 | Auditoría de seguridad: autenticación, RBAC, scope y datos sensibles |
| `Hasted-Halfling` | **1 condicional** | Sólo ante un hallazgo concreto de performance o una medición que justifique especialista |
| `Cunning-Bard` | 1, ya usado | Planificación; no cuenta como ejecutor |

**Límite de escritura.** Como máximo **2 escritores en total al mismo tiempo**, sean del rol que
sean: `1 Code-Transmuter` + `1 Lore-Master`, o `2 Code-Transmuter` sobre archivos disjuntos. **No**
existe la combinación de `Lore-Master` más 2 de código.

**Concurrencia.** Como máximo **1 ejecutor de mutaciones de runtime en un entorno compartido**. Dos
lecturas independientes sí pueden ir en paralelo con corte congelado.

**Totales en ejecución, sin `Cunning-Bard`:** **7** roles base —`Code-Transmuter`, `Dwarven`,
`Lore-Master`, `QA-Goblin` y los tres auditores base—; **8** al activar `Hasted-Halfling` **o** el
segundo `Code-Transmuter`, por separado; **9** al activar ambos a la vez.

No se asigna un auditor por familia: el mismo especialista es reutilizable entre familias.

### Especialistas y habilidades

| Rol | Habilidades base | Habilidades adicionales |
|---|---|---|
| `Code-Transmuter` | `typescript`, `vue-best-practices`, `inume-css-html-anti-patterns` | dominio aplicable a la familia que ejecuta |
| `QA-Goblin` | `Goblin-War-Plans` | — |
| `Hellknight-Inspector` | `Hellknight-Inspectors-Verdict-Codex` | `Codex-Of-Botched-Runes` (código generado o asistido por IA) |
| `Shelyn-Cleric` | `Shelyn-Clerics-Canticle-Of-Forms`, `inume-css-html-anti-patterns` | `Codex-Of-Hollow-Facades` (interfaz generada o asistida por IA) |
| `Dhampir-Slayer` | `Dhampir-Slayers-Grimoire-Of-Wards` | `Codex-Of-Forbidden-Glyphs` |
| `Hasted-Halfling` | `Hasted-Halflings-Swiftstride-Ledger` | `Codex-Of-Leaden-Pages` |

El análisis de código generado o asistido por IA **no es opcional** en ninguna de las cuatro
familias de auditoría listadas. En trabajo de interfaz, `inume-css-html-anti-patterns` es la
habilidad de referencia además del contrato visual del DS.

### Ciclo de trabajo de los hallazgos

Los auditores trabajan en **sólo lectura**. `Code-Transmuter` implementa los hallazgos que les
correspondan dentro de su bloque, `Hellknight` o el lector que toque revisa la corrección y el
cierre lo declara el orquestador. **Ningún auditor escribe código**, y ningún ejecutor incorpora
un hallazgo sin que ese hallazgo tenga dueño asignado.

### Dependencias declaradas

| Dependencia | Estado | Alcance del bloqueo |
|---|---|---|
| `POST /consumos-municion/` devuelve **500** sin causa identificada ni traza | Externa, sin resolver | El alta de munición y las comprobaciones que necesitan un consumo creado. La relación de consumo de arma **requiere un consumo de munición padre válido**; el selector quedó sin opciones. Resolver el alta de munición **no demuestra por sí solo** que la familia hija quede completa |
| Elegibilidad y unidad al capturar resultados | Externa | El tramo de captura |
| Overrides y deudas del registro de autenticación | Externa; **no se afirma vigencia estática por inferencia** | El tramo correspondiente de identidad y acceso |
| SMTP sin listener; credenciales de cuentas heredadas forzadas sin credencial conocida; segundo tenant | Requieren **provisión**, no invención | Los flujos que dependen de cada uno |
| Reinicio de contraseña | **Es una capacidad, no un prerrequisito general**: bloquea sólo el flujo de reinicio, no el resto de la cuenta | Sólo ese flujo |
| APIs propuestas de complete-promotion | **No se asume que existan**; gate externo | `C11` y `C12` |

Candidatos de performance confirmados como archivos reales, pendientes de diagnóstico focalizado
antes de cualquier uso: `front/src/router/routes.ts` (imports síncronos de vistas, 343 líneas) y
`front/src/features/exercises/api.ts` (filtro sobre colección completa, 822 líneas; filtros en
`front/src/features/exercises/api.ts:680` y `:760`). **Son candidatos, no diagnósticos.**

## Tareas

Cada tarea declara el AC que satisface y quién la ejecuta. Ninguna es ejecutable antes del gate de
`C0`.

Las dependencias de implementación son **las del mapa y los contratos** (`C1`) y, donde el tramo
toca lo compartido, `C2`. Los bloques de familia **no** se encadenan entre sí por orden artificial:
cada uno declara sus propios prerrequisitos reales.

| # | Tarea | → AC | Ejecutor | Depende | Estado de ejecución | Alcance completado / pendiente |
|---|---|---|---|---|---|---|
| T0 | Aprobar el plan y registrar la aprobación; el operador emite por separado la orden de implementación y autoriza los bloques sensibles; resolver la situación de los gates de revisión previos revocados y declarar las dependencias de backend externas | AC-1 | Operador → `Lore-Master` | — | **Completada** | Aprobación y orden de implementación emitidas por el operador el 2026-10-14, en la misma frase explícita. Los gates de revisión revocados **no** se restauran: la orden nueva aprobó revisiones propuestas y la revocación histórica se conserva sin reescribir |
| T1 | Mapa focalizado: método `OP` → consumidor ancla → `SCREEN`/AC, con clasificación de brecha y actor esperado fundamentado en permisos y scope (nunca alias de rol ni HTTP observado); cerrar los contratos que el mapa destape | AC-2 | `Dwarven-Spelunkers` + `QA-Goblin` | T0 | **En progreso** | Mapa acotado producido; **no** se declara cerrado ni agotado. Produjo falsos positivos —alta temporal y validadores del dashboard, relación de consumo de nivel 2, lookup sin consumidor— que se descartaron antes de implementar. Auditorías posteriores acotadas confirmaron que los *wrappers* compartidos **sí** se consumen: **no** se implementó funcionalidad a partir de esos falsos positivos. **Mapa completo producido (2026-10-15)** y persistido en [`coverage/t1-gap-map-2026-10-15.md`](./coverage/t1-gap-map-2026-10-15.md): 49 filas de consumidor ancla sobre las 164 OP de la matriz (161 de negocio + las 3 de los 8 ejes), con clasificación AC-2 y actor esperado fundamentado — **cero `IMPLEMENTACIÓN FALTANTE`**. Contratos por cerrar del mapa: C-1 (cobertura/contrato de la ruta de 8 ejes), C-2 y C-3 (`500` sin contrato declarado), C-4 (matriz actor→permiso para `expected_by_actor`). T1 **permanece en progreso**: no se declara cerrada ni agotada. |
| T2 | Compartidos: transporte, tickets, purga, guards, reconciliación y capa de modal — **sólo** brechas demostradas, con dueño único antes de paralelizar | AC-3 | `Code-Transmuter` (1) | T1 | **Parcial** | **Completado:** corrección del foco del diálogo compartido (`activeElement === modal` en ambas ramas) tras confirmar que el primer `Shift+Tab` sacaba el foco porque el contenedor `DIV` con `tabindex="-1"` no era ni primero ni último. Regresión que **falló antes** (salida 1) y **pasó después**: 9 pruebas dirigidas con salida 0 y `typecheck` con salida 0. Runtime posterior: foco inicial en el `DIV` del diálogo; tras `Shift+Tab` y tras `Tab`, foco en `BUTTON` **dentro**; `Escape` cerró; **cero** escrituras de negocio observadas. **Pendiente:** el resto del alcance de T2 no tiene verificación registrada |
| T3 | Organización: recintos, vínculos, lookup, asignables, previsualización de eliminación y migración; conservar el CRUD ya acreditado | AC-4 | `Code-Transmuter` (1) | T1, T2 sólo donde toque lo compartido | **Parcial** | Implementaciones localizadas registradas. **Verificado en lectura (confirmado):** la previsualización de eliminación con los **ocho** contadores de destino quedó observada en runtime read-only —8/8 contadores con las etiquetas de `MIGRATION_COUNT_FIELDS`, destino exigido antes de confirmar (`Confirmar eliminación` deshabilitado sin destino y habilitado tras elegir uno válido), `GET` de previsualización **200** y **0** mutaciones de negocio; el refresco sólo tras éxito confirmado quedó **NO ejercitado** porque la eliminación no se ejecutó. Fuente: [`evidence/2026-10-14/organization-deletion-preview.json`](./evidence/2026-10-14/organization-deletion-preview.json) (§5 ter.1). **Acreditado por UI (2026-10-14, alias A1):** la eliminación con migración quedó **ejercitada**, no sólo leída: `GET …/previsualizar-eliminacion/` **200** con **8/8** contadores y `POST …/eliminar-con-migracion/` **200**, que **cierra la mitad que faltaba de AC-4** —el refresco se observó **sólo tras** la respuesta del `POST` (cero refresco previo) y el `GET` de ficha posterior dio **404**—; además, alta `POST /api/recintos/` **201**, edición `PUT /api/recintos/{id}/` **200** y baja `DELETE /api/recintos/{id}/` **204** con `GET` de detalle posterior **404**. Fuente: [`evidence/2026-10-14/a1-borders-ui.json`](./evidence/2026-10-14/a1-borders-ui.json) (§5 quinquies). **Promueve 5 celdas de A1** (`OP-UNT-007/008` y `OP-RCT-002/004/006`), todas `NOT_EXERCISED` → `OBSERVED_OK`. **Ejercitado por UI (2026-10-14, alias A2):** CRUD completo de recintos —alta `POST /api/recintos/` **201**, detalle `GET /api/recintos/{id}/` **200**, edición `PUT` **200** y `PATCH` **200**, baja `DELETE` **204** con `GET` posterior **404**— y de unidades —`POST /api/organization-units/` **201**, `GET` **200**, `PUT` **200**, `PATCH` **200** y `DELETE` **204** con `GET` **404**—. Fuente: [`evidence/2026-10-14/a2-core-families-ui.json`](./evidence/2026-10-14/a2-core-families-ui.json) (§5 sexies). **Promueve 10 celdas de A2** (`OP-UNT-002/003/004/005/006` y `OP-RCT-002/003/004/005/006`). **Ejercitado por UI (2026-10-14, alias A3, §5 septies):** CRUD de recintos —alta `POST /api/recintos/` **201**, detalle `GET /api/recintos/{id}/` **200**, edición `PUT` **200** y `PATCH` **200**, baja `DELETE` **204** con `GET` posterior **404**—; **denegación observada:** `POST /api/organization-units/` **403** (`PARTIAL`, no certificado como resultado esperado). Fuente: [`evidence/2026-10-14/a3-core-families-ui.json`](./evidence/2026-10-14/a3-core-families-ui.json). **Promueve 5 celdas de A3** (`OP-RCT-002/003/004/005/006`) a `OBSERVED_OK` y **1** (`OP-UNT-002`) a `PARTIAL`. **Pendiente:** el resto del alcance de T3 queda sin verificar **A4 (2026-10-14, alias A4 acreditado, §5 octies):** la UI **no** ofreció el alta de unidad ni la de recinto para A4 (botones ausentes del DOM) y **no** se forzó la API: **ninguna** celda de T3 promovida por A4. **A5/A6 (2026-10-14, §5 decies y §5 undecies):** para A5 y A6 la UI **no** ofreció las altas/ediciones/bajas de unidades ni de recintos y **no** se forzó la API; A6 resolvió la ruta de recintos **fail-closed** en el cliente (contenedor neutral «Acceso denegado», sin request), lo que **no** es un `403` de backend. **Ninguna** celda de T3 promovida por A5 ni por A6. **Limpieza (§5 duodecies):** el residuo de A5 —arma **15**, ejercicio **16** y usuario temporal **41**— se dio de baja por UI con el alias A1 (GET 200 → DELETE UI 204 → GET 404). **A7 (2026-10-14, alias A7 acreditado, §5 terdecies):** la UI **no** ofreció las mutaciones de unidades ni de recintos para A7 y la ruta `/organizacion/recintos` se resolvió **fail-closed** en el cliente (contenedor neutral «Acceso denegado», sin request) por no incluir `view_recinto`, lo que **no** es un `403` de backend; **ninguna** celda de T3 promovida por A7. **A8 (2026-10-14, alias A8 acreditado, §5 quindecies):** A8 ejercitó el detalle de unidad `GET /api/organization-units/{id}/` **200** (promueve `OP-UNT-003`); la UI **no** ofreció para A8 las altas/ediciones/bajas de unidades ni de recintos (el rol más restringido no ofrece altas) y la ruta `/organizacion/recintos` quedó **fail-closed** en el cliente (contenedor neutral «Acceso denegado», sin request) por no incluir `view_recinto`, lo que **no** es un `403` de backend; **no** se forzó la API. Fuente: [`evidence/2026-10-14/a8-core-families-ui.json`](./evidence/2026-10-14/a8-core-families-ui.json). Estado conservado: **Parcial**, sin `done`. |
| T4 | Identidad y acceso: alta formal de cuenta con `POST /usuarios/`, **distinta** del alta temporal, con sus asignaciones iniciales y su credencial gestionada; principal y secundarias, puestos, holders, histórico y memberships; cuenta, sesión, cambio de credencial, desbloqueo y reinicio de contraseña como capacidad propia; **con gate sensible**; catálogos reales y reconciliación de contexto primario tras escritura; el flujo no se retira del producto aunque antes estuviera excluido; **sin** modificar autenticación en el backend | AC-5 | `Code-Transmuter` (1) | T1; T2 sólo donde toque lo compartido. Unidades y catálogos reales disponibles; no exige terminar toda T3 | **Parcial** | **Completado:** reconciliación del contexto primario tras editar identidad —asignaciones propias, posiciones y holders— en `front/src/views/identity/IdentityView.vue`, con prueba dirigida `identity-context-reconcile`: **18** pruebas con salida 0 y `typecheck` con salida 0; el orquestador corroboró **127** pruebas en 4 archivos con salida 0 y `typecheck` con salida 0, con revisión de cambios y pruebas; la re-revisión estática de seguridad da el hallazgo **resuelto**. **Ejercitado por UI (2026-10-14):** alta **formal** de cuenta con `POST /api/usuarios/` **201** —**distinta** del alta temporal—, desactivación de la asignación principal **200**, alta de secundaria **201**, baja de secundaria **200**, baja de cuenta `DELETE /api/usuarios/{id}/` **204** con `GET` **200 → 404** y limpieza trazable (tres `DELETE /api/posiciones/{id}/` **204** y `DELETE /api/organization-units/{id}/` **204**), con barrido de residuo propio en **0**; rol administrativo **existente** sin bypass `super_admin`, roles de la cuenta creada **no privilegiados** (`oficial_observador` principal, `oficial_tiro` secundaria), **sin** credencial persistida y **sin** login con la cuenta creada. Fuente: [`evidence/2026-10-14/persons-formal-create-ui.json`](./evidence/2026-10-14/persons-formal-create-ui.json) (§5 quater). **Pendiente:** cambio y reinicio de contraseña, desbloqueo de cuenta, holders, la variante `PUT`/`PATCH` de la asignación principal y la membership por formulario propio; el resto del alcance de T4 sigue sin verificar. **Límite:** la revocación de escrituras propias **no** está verificada en runtime; el alias sigue `NOT_VERIFIED` y **no** se promueve ninguna fila. **Tanda posterior (2026-10-14, alias A2, §5 sexies):** alta temporal `POST /api/usuarios/crear-temporal/` **201**, `PUT` **200**, `PATCH` **200** y baja `DELETE` **204**; membresía `POST /api/memberships/` **201**, `PUT` **200**, `PATCH` **200** y `DELETE` **204**; puestos `POST /api/posiciones/` **201**, detalle `GET` **200**, histórico `GET .../historico/` **200**, `PUT` **200**, `PATCH` **200**, `asignar-holder` **201** y `quitar-holder` **200** (por fallback de API); `DELETE /api/posiciones/{id}/` **500** (`ProtectedError`), registrado `PARTIAL` en deuda §11. Fuente: [`evidence/2026-10-14/a2-core-families-ui.json`](./evidence/2026-10-14/a2-core-families-ui.json). **Promueve 16 celdas de A2** (`OP-USR-004/005/006/012`, `OP-MEM-002/004/005/006` y `OP-POS-002/003/004/005/007/008/009`) y **1** a `PARTIAL` (`OP-POS-006`). **Ejercitado por UI (2026-10-14, alias A3, §5 septies):** puestos `POST /api/posiciones/` **201** (SIN holder), detalle `GET` **200**, histórico `GET .../historico/` **200**, `PUT` **200**, `PATCH` **200** y baja `DELETE` **204** (contraste directo con el `500` de A2 en el mismo endpoint, deuda §11); membresía `POST /api/memberships/` **201** y `DELETE` **204**; alta temporal `POST /api/usuarios/crear-temporal/` **201** (el registro creado **no** fue recuperable por A3). Fuente: [`evidence/2026-10-14/a3-core-families-ui.json`](./evidence/2026-10-14/a3-core-families-ui.json). **Promueve 9 celdas de A3** (`OP-POS-002/003/004/005/006/009`, `OP-MEM-002/006` y `OP-USR-012`) **A4 (2026-10-14, alias A4 acreditado, §5 octies):** la UI **no** ofreció el alta de puesto, membresía ni usuario temporal para A4 (botones ausentes del DOM) y el holder **no** se ejerció por el gate; **no** se forzó la API: **ninguna** celda de T4 promovida por A4. **Limpieza del residuo A3 (§5 nonies):** con el alias A1 acreditado se dio de baja por UI el usuario temporal **40** (GET 200 → DELETE UI 204 → GET 404) —el mismo que A3 no pudo recuperar—; el 204/404 no acreditan borrado físico en base. **A5/A6 (2026-10-14, §5 decies y §5 undecies):** A5 ejercitó el alta temporal `POST /api/usuarios/crear-temporal/` **201** (promueve `OP-USR-012`); A5 y A6 ejercitaron el detalle de puesto `GET /api/posiciones/{id}/` **200** y el histórico `GET .../historico/` **200** (promueven `OP-POS-003` y `OP-POS-009`); la UI **no** ofreció para A5 ni A6 las altas/ediciones/bajas de puestos, membresías ni usuarios temporales y el holder **no** se ejerció por el gate; **no** se forzó la API. **Limpieza (§5 duodecies):** el usuario temporal **41** (residuo de A5) se dio de baja por UI con el alias A1 (GET 200 → DELETE UI 204 → GET 404). **A7 (2026-10-14, §5 terdecies):** A7 ejercitó el detalle de puesto `GET /api/posiciones/{id}/` **200** y el histórico `GET .../historico/` **200** (promueven `OP-POS-003` y `OP-POS-009`); la UI **no** ofreció para A7 las altas/ediciones/bajas de puestos, membresías ni usuarios temporales y el holder **no** se ofreció por el gate; **no** se forzó la API. Fuente: [`evidence/2026-10-14/a7-core-families-ui.json`](./evidence/2026-10-14/a7-core-families-ui.json). **A8 (2026-10-14, §5 quindecies):** A8 ejercitó el detalle de puesto `GET /api/posiciones/{id}/` **200** y el histórico `GET .../historico/` **200** (promueven `OP-POS-003` y `OP-POS-009`); la UI **no** ofreció para A8 las altas/ediciones/bajas de puestos, membresías ni usuarios temporales (el rol más restringido no ofrece altas) y el holder **no** se ofreció por el gate; **no** se forzó la API. Fuente: [`evidence/2026-10-14/a8-core-families-ui.json`](./evidence/2026-10-14/a8-core-families-ui.json). Estado conservado: **Parcial**, sin `done`. |
| T5 | Autorización: `Role`, `RolePermission`, `PositionPermission`, catálogo, categorías, elegibilidad, bitácora, scopes de sólo lectura y overrides, con la dependencia externa declarada | AC-6 | `Code-Transmuter` (1) | T1; T2 sólo donde toque lo compartido. Puestos y catálogos reales disponibles, sin exigir cerrar toda T4 | **Parcial** | **Lectura hecha:** superficies de autorización observadas en runtime read-only con el rol **`tenant_admin`** (sin usar el bypass `super_admin`) —`GET` **200** de roles, categorías de rol, scopes, permisos, permisos por rol y permisos por puesto; una pestaña de personas por unidad sin consulta enviada; y overrides **fail-closed** con contenedor neutral sin petición y sin `403`. El alias y `expected_by_actor` siguen `NOT_VERIFIED`; **no** se promueve ninguna fila. Fuente: [`evidence/2026-10-14/authorization-surfaces-readonly.json`](./evidence/2026-10-14/authorization-surfaces-readonly.json) (§5 ter.3). **Pendiente:** el resto del alcance de T5 sigue sin ejecutar. Se declara **dependencia de seguridad de backend**: hallazgo de severidad **ALTA** sobre la **aceptación de un rol existente sin límites**, por el que un usuario operativo con permisos `create`/`update` de usuarios **podría** otorgarse a sí mismo `super_admin`. Es **inferencia de fuente estática** sobre `apipoligono/views.py:188-199` y `:269-393`, más `apps/authorization/permissions.py:111-117`: **no** hay reproducción ni verificación runtime. Se reporta y **no** se corrige aquí — no se propone arreglo de backend ni cambio de cliente. **Lectura y detalle por UI (2026-10-14, alias A2, §5 sexies):** detalle de rol `GET /api/authz/roles/{id}/` **200**, detalle de scope `GET /api/authz/scopes/{id}/` **200**, detalle de permiso `GET /api/authz/permissions/{id}/` **200**, y matrices `GET /api/authz/role-permissions/` **200** y `GET /api/authz/position-permissions/` **200**. Fuente: [`evidence/2026-10-14/a2-core-families-ui.json`](./evidence/2026-10-14/a2-core-families-ui.json). **Promueve 5 celdas de A2** (`OP-ROL-003`, `OP-SCP-002`, `OP-PRM-002`, `OP-RPR-001` y `OP-PPR-001`); **cero** escrituras RBAC. **Lectura y detalle por UI (2026-10-14, alias A3, §5 septies):** detalle de rol `GET /api/authz/roles/{id}/` **200**, detalle de scope `GET /api/authz/scopes/{id}/` **200** y detalle de permiso `GET /api/authz/permissions/{id}/` **200**; **denegación observada:** `GET /api/authz/role-permissions/` **403** y `GET /api/authz/position-permissions/` **403** (`PARTIAL`, no certificado como resultado esperado). Fuente: [`evidence/2026-10-14/a3-core-families-ui.json`](./evidence/2026-10-14/a3-core-families-ui.json). **Promueve 3 celdas de A3** (`OP-ROL-003`, `OP-SCP-002`, `OP-PRM-002`) a `OBSERVED_OK` y **2** (`OP-RPR-001`, `OP-PPR-001`) a `PARTIAL`. **Pendiente:** el resto del alcance de T5 sigue sin ejecutar **A4 (2026-10-14, alias A4 acreditado, §5 octies):** detalle de rol `GET /api/authz/roles/{id}/` **200**, detalle de scope `GET /api/authz/scopes/{id}/` **200** y detalle de permiso `GET /api/authz/permissions/{id}/` **200**; **denegación observada:** `GET /api/authz/role-permissions/` **403** y `GET /api/authz/position-permissions/` **403** (`PARTIAL`, no certificado como resultado esperado). Fuente: [`evidence/2026-10-14/a4-core-families-ui.json`](./evidence/2026-10-14/a4-core-families-ui.json). **Promueve 3 celdas de A4** (`OP-ROL-003`, `OP-SCP-002`, `OP-PRM-002`) a `OBSERVED_OK` y **2** (`OP-RPR-001`, `OP-PPR-001`) a `PARTIAL`; **cero** escrituras RBAC. **A5/A6 (2026-10-14, §5 decies y §5 undecies):** detalle de rol `GET /api/authz/roles/{id}/` **200**, detalle de scope `GET /api/authz/scopes/{id}/` **200** y detalle de permiso `GET /api/authz/permissions/{id}/` **200** para A5 y A6 (promueven `OP-ROL-003`, `OP-SCP-002` y `OP-PRM-002`); **denegación observada:** `GET /api/authz/role-permissions/` **403** y `GET /api/authz/position-permissions/` **403** para A5 y A6 (`PARTIAL`, no certificado como resultado esperado). Fuente: [`evidence/2026-10-14/a5-core-families-ui.json`](./evidence/2026-10-14/a5-core-families-ui.json) y [`evidence/2026-10-14/a6-core-families-ui.json`](./evidence/2026-10-14/a6-core-families-ui.json). **cero** escrituras RBAC. **A7 (2026-10-14, §5 terdecies):** detalle de rol `GET /api/authz/roles/{id}/` **200**, detalle de scope `GET /api/authz/scopes/{id}/` **200** y detalle de permiso `GET /api/authz/permissions/{id}/` **200** para A7 (promueven `OP-ROL-003`, `OP-SCP-002` y `OP-PRM-002`); **denegación observada:** `GET /api/authz/role-permissions/` **403** y `GET /api/authz/position-permissions/` **403** (`PARTIAL`, no certificado como resultado esperado). Fuente: [`evidence/2026-10-14/a7-core-families-ui.json`](./evidence/2026-10-14/a7-core-families-ui.json); **cero** escrituras RBAC. **A8 (2026-10-14, §5 quindecies):** detalle de rol `GET /api/authz/roles/{id}/` **200**, detalle de scope `GET /api/authz/scopes/{id}/` **200** y detalle de permiso `GET /api/authz/permissions/{id}/` **200** para A8 (promueven `OP-ROL-003`, `OP-SCP-002` y `OP-PRM-002`); **denegación observada:** `GET /api/authz/role-permissions/` **403** y `GET /api/authz/position-permissions/` **403** (`PARTIAL`, no certificado como resultado esperado). Fuente: [`evidence/2026-10-14/a8-core-families-ui.json`](./evidence/2026-10-14/a8-core-families-ui.json); **cero** escrituras RBAC. Estado conservado: **Parcial**, sin `done`. |
| T6 | Tiro: polígonos, lecciones de cinco pestañas, participantes, fracciones, captura, resultados individual frente a resumen y reporte; ausencia de elegibles real sin inventar; invalidación de consumidores tras cambio exitoso; alta y edición de resultados bloqueadas por backend se separan, sin sembrar API para aparentar interfaz | AC-8 | `Code-Transmuter` (1) | T1; T2 sólo donde toque lo compartido. Contexto de permisos real disponible; no exige cerrar toda T5 | **Parcial** | Implementaciones localizadas registradas. **Verificación tiro hecha:** lectura read-only de superficies de tiro con sesión aislada —**5** pestañas contractuales presentes en la ficha de lección, `GET` con sus estados y control de captura **HABILITADO** con elegibles reales **2/2**; **0** mutaciones de negocio. Fuente: [`evidence/2026-10-14/shooting-surfaces-readonly.json`](./evidence/2026-10-14/shooting-surfaces-readonly.json) (§5 ter.4). La rama «sin elegibles» quedó **NO ejercitada** y **no** se inventa. Registra un único `GET` **500** de backend (`/api/lecciones/1/resultados/`), consignado como deuda en [`docs/bugs/backend-debt.md`](../../bugs/backend-debt.md) §9. **Pendiente:** el alta y la edición de resultados por interfaz siguen sin verificación runtime, y el consumo de resultados arrastra ese `500`. No hay siembra de API registrada para aparentar interfaz |
| T7 | Almacén y ejercicios: consumos, relaciones y comportamiento pendiente; **no** repetir el CRUD ya acreditado | AC-8 | `Code-Transmuter` (1) | T1; T2 sólo donde toque lo compartido. Ejercicio real y consumo de munición padre para las relaciones que los requieren. **Tramo de almacén independiente**: el `500` no bloquea el resto de la familia ni exige cerrar T6 | **Parcial** | Tramo de almacén y ejercicios con avance local registrado. **Pendiente:** el `500` de `POST /consumos-municion/` sigue **sin resolver** y bloquea el alta de munición y las relaciones que requieren un consumo padre válido; resolverlo **no** demuestra por sí solo que la familia hija quede completa |
| T8 | Apariencia y cuenta: los ocho ejes con todas sus opciones, valores por defecto, restablecimiento, restauración, cola y aislamiento entre cuentas, con fidelidad renderizada al DS; persistencia contra la API y no contra `localStorage`; lectura de cuenta según backend, sin ofrecer edición del perfil propio si el backend lo declara de sólo lectura; la excepción histórica de apariencia no autoriza cambios nuevos | AC-6, AC-7 | `Code-Transmuter` (1) | T1, T2 sólo donde toque lo compartido | **Parcial** | **Acreditado** en corridas previas y **conservado**: los ocho ejes persisten con **ocho** `PUT` **200** —una operación por eje— con `GET` confirmatorio, la persistencia sobrevive al **login** por interfaz y el aislamiento se verificó entre **A7 → A8**; el restablecimiento devolvió `DELETE` **204**. Fuentes: [`evidence/2026-10-13/appearance-eight-axes-results.json`](./evidence/2026-10-13/appearance-eight-axes-results.json) y [`estado-integral-2026-10-12.md`](./estado-integral-2026-10-12.md) §7. **Verificado en lectura:** la apariencia se lee del backend (`GET /api/me/preferences/appearance/design-system/` **200** con las **ocho** claves `ds_*` reflejadas en los atributos `data-*` de `<html>`), **cero** claves de apariencia en `localStorage`/`sessionStorage` (sólo caché de Iconify y `csrftoken` de sesión) y catálogo de opciones por eje **medido en runtime**: **accent 27 · bg 26 · font 9 · radius 3 · iconfam 7 · ambient 8 · ambcolor 7 · theme 2**, coincidente con la biblioteca externa del Design System (`theme-customizer.js`) y con `types/appearance.ts`; **0** PUT/PATCH/DELETE y el aislamiento entre cuentas ya acreditado el 2026-10-13 **no** repetido. Fuente: [`evidence/2026-10-14/appearance-persistence-readonly.json`](./evidence/2026-10-14/appearance-persistence-readonly.json) (§5 ter.2). **Pendiente y no acreditado:** paridad de render en los **estados completos** —validación, movimiento reducido y variantes—; la nueva orden **no repite** promociones ya acreditadas. **Acreditado por UI (2026-10-14, alias A1):** `GET /api/me/preferences/appearance/design-system/` **200**, `PUT` **200** al cambiar el eje `accent` con `GET` confirmatorio **200**, y `DELETE` **204** desde «Restablecer valores por defecto» con `GET` posterior **200** en los defaults; los cuatro ejes que derivaron se restauraron al estado previo. Fuente: [`evidence/2026-10-14/a1-borders-ui.json`](./evidence/2026-10-14/a1-borders-ui.json) (§5 quinquies). **Promueve 3 celdas de A1** (`OP-PRF-003/004/005`); el contrato legacy `OP-PRF-002` **no** lo ofrece la UI y sigue `NOT_EXERCISED`. El paquete de entrada del personalizador quedó **fuera de alcance** en el trabajo de performance, por un import estático en `App.vue` |
| T9 | Calidad, interfaz y seguridad: contratos de validación, respuesta y error; ciclo de vida; concurrencia; tipado inseguro; duplicación y deriva; código muerto; responsabilidad; formularios, foco, teclado, estados y fidelidad 1:1 al DS. No instruir dividir vistas automáticamente: **el tamaño no es un defecto**. Los hallazgos reproducibles se registran con alcance, regresión y dueño; seguridad —autenticación, RBAC, scope y datos sensibles— es de `Dhampir-Slayer` | AC-9 | `QA-Goblin` (diseño) · `Hellknight`, `Shelyn` y `Dhampir` (sólo lectura) | T1 | **Parcial** | Auditorías posteriores **acotadas** ejecutadas; la revisión amplia anterior quedó **invalidada** y no se usa como veredicto. Correcciones acotadas de foco del diálogo y de reconciliación de contexto, ambas verificadas dentro de su alcance. **Pendiente:** la paridad visual total al Design System **no** está aprobada por los auditores (`visualParity: NOT_VERIFIED`): lo observado es coincidencia de estilos calculados del modal en el estado abierto asentado —`padding` `16px 20px`, transición `200 ms`, `margin` `30px auto`, sombra `0 14px 30px rgba(0,0,0,.45)`—, sin medir trayectoria, desplazamiento de entrada oculto ni movimiento reducido. **No** se afirma paridad total de seguridad ni de UX |
| T10 | Performance: construir y registrar el baseline dentro del plan —entrada y navegación con bytes, chunks y tiempo hasta contenido útil; listado real con búsqueda y orden; ficha; pestañas de lección y consumos con solicitudes, bytes y CPU de cliente; navegación repetida de apariencia con limpieza de memoria y estabilidad—. Los presupuestos se derivan del baseline y de una propuesta técnica, y **no** se fija un umbral inventado. Sin conjunto de datos representativo, se declara el límite y no se fabrica volumen de producto. La optimización es condicional a un problema medido, con comparación antes y después bajo las mismas condiciones y sin regresión de DS, seguridad ni función | AC-10 | `Code-Transmuter` (medición; optimización sólo tras diagnóstico) · `Hasted-Halfling` (condicional) | T1 y comportamiento correcto del flujo medido; T8 sólo para el recorrido de apariencia | **Parcial** | **Completado:** baseline de navegación en modo `DEV`, 2 recorridos de 7 pasos, caché caliente y sin *throttling* de CPU ni de red; la sesión reutilizada quedó con **alias A1 NO acreditado**, y el conjunto de datos no es representativo. Corrección de la entrada por carga diferida de **15** vistas preservando nombres, `meta` y rutas, con condición de reproducibilidad registrada: *lockfile*, configuración, Node y pnpm idénticos y SHA-256 del `routes.ts` normalizado igual antes y después. Entry 856 249 → 153 318 bytes (**−82,1 %**); entry + preloads −70,3 % en bytes y −60,6 % en gzip; total JS +11 810 bytes y +22 807 en gzip; chunks 1 → 32. `build` antes y después y `typecheck` con salida 0, más **146** pruebas dirigidas en 6 archivos con salida 0 por el ejecutor de la división de rutas. Revisión del orquestador sobre ese cambio: **127** pruebas en 4 archivos con salida 0 y `typecheck` con salida 0 —corrida **anterior** a la corrección de foco del diálogo, de modo que **no** cubre los últimos cambios y **no** se afirma que los cubra. **Pendiente:** falta el conjunto de datos representativo y falta la medición final de performance bajo condiciones comparables. **Límites:** sin Core Web Vitals, sin tiempo de red real observado y sin performance de campo; los tamaños redondeados que muestra Vite y los conteos gzip con zlib nivel 6 son **métodos distintos y no se mezclan**; el total gzip **aumenta** y la mejora es de la entrada. En esta edición **no** se ejecutaron pruebas ni compilaciones nuevas |
| T11 | Aceptación por flujos y actores: positivo legítimo, `PUT` y `PATCH` por separado, permitido frente a denegado contra actor esperado fundamentado, scope de unidad, A→B, entre tenants cuando exista segundo tenant, sesión y credenciales, apariencia y render del DS. Mutación por interfaz real, sin escrituras de API ni cookies fabricadas; el recorrido de `GET` no sustituye el detalle de interfaz. Se persiste estado por celda con historia y cuenta adicional, y los universos no son todos iguales. `QA-Goblin` diseña, el ejecutor implementa, el lector audita sin escribir | AC-11 | `QA-Goblin` (diseña) → ejecutor (implementa) → lector (audita) | T1 y el paquete de la familia lista, **sin esperar a los demás** | **Parcial** | Recorrido runtime de **tres** rutas —*dashboard*, organización y almacén de armerías— con encabezado visible y `GET` **200** de dominio, **cero** errores de chunk, de consola y de página en el periodo observado; los collectors fueron **sólo observadores**, y ningún conteo fuera de ellos se infiere. **No** promovió filas **en esa corrida** (el alias **A1** no estaba acreditado **entonces** y `actorCellsPromoted` es `false`). **Acreditación posterior (2026-10-14):** el alias **A1** quedó **acreditado por correspondencia privada** —login por UI **200** y `GET /api/auth/context/` **200** con rol activo `super_admin`— y su corrida **sí promueve 8 celdas** (`OP-PRF-003/004/005`, `OP-UNT-007/008` y `OP-RCT-002/004/006`); `expected_by_actor` sigue `NOT_VERIFIED` y el estado global sigue `NOT_VERIFIED`. Fuente: [`evidence/2026-10-14/a1-borders-ui.json`](./evidence/2026-10-14/a1-borders-ui.json) (§5 quinquies). Sin cuenta nueva, sin registro sintético y sin envío del formulario de edición existente. **Acreditación del alias A2 (2026-10-14, §5 sexies):** el alias **A2** quedó **acreditado por correspondencia privada** —login por UI **200** y `GET /api/auth/context/` **200** con rol activo `tenant_admin`— y su corrida **promueve 44 celdas** de A2 (**43** a `OBSERVED_OK` y **1**, `OP-POS-006`, a `PARTIAL`); `expected_by_actor` sigue `NOT_VERIFIED` y el estado global sigue `NOT_VERIFIED`. Fuente: [`evidence/2026-10-14/a2-core-families-ui.json`](./evidence/2026-10-14/a2-core-families-ui.json). **Acreditación del alias A3 (2026-10-14, §5 septies):** el alias **A3** quedó **acreditado por correspondencia privada** —login por UI **200** y `GET /api/auth/context/` **200** con rol activo `admin_unidad`— y su corrida **promueve 33 celdas** de A3 (**28** a `OBSERVED_OK` y **5** a `PARTIAL` por denegación real de backend observada); `expected_by_actor` sigue `NOT_VERIFIED` y el estado global sigue `NOT_VERIFIED`. Fuente: [`evidence/2026-10-14/a3-core-families-ui.json`](./evidence/2026-10-14/a3-core-families-ui.json). **Acreditación del alias A4 (2026-10-14, §5 octies):** el alias **A4** quedó **acreditado por correspondencia privada** —login por UI **200** y `GET /api/auth/context/` **200** con rol activo `comandante_unidad`— y su corrida **promueve 9 celdas** de A4 (**6** a `OBSERVED_OK` y **3** a `PARTIAL` por denegación real de backend observada); `expected_by_actor` sigue `NOT_VERIFIED` y el estado global sigue `NOT_VERIFIED`. Fuente: [`evidence/2026-10-14/a4-core-families-ui.json`](./evidence/2026-10-14/a4-core-families-ui.json). **Limpieza del residuo de A3 (2026-10-14, §5 nonies):** con el alias **A1 acreditado** se dieron de baja por UI el arma **14**, el ejercicio **15** y el usuario temporal **40** (GET 200 → DELETE UI 204 → GET 404) y el barrido por marcador A3CF en 7 familias dio **0** coincidencias propias; **no** promueve celdas y el 204/404 **no** acreditan borrado físico en base. **Acreditación del alias A5 (2026-10-14, §5 decies):** el alias **A5** quedó **acreditado por correspondencia privada** —login por UI **200** y `GET /api/auth/context/` **200** con rol activo `oficial_tiro`— y su corrida **promueve 21 celdas** de A5 (**18** a `OBSERVED_OK` y **3** a `PARTIAL` por denegación real de backend observada); `expected_by_actor` sigue `NOT_VERIFIED` y el estado global sigue `NOT_VERIFIED`. Fuente: [`evidence/2026-10-14/a5-core-families-ui.json`](./evidence/2026-10-14/a5-core-families-ui.json). **Acreditación del alias A6 (2026-10-14, §5 undecies):** el alias **A6** quedó **acreditado por correspondencia privada** —login por UI **200** y `GET /api/auth/context/` **200** con rol activo `oficial_observador`— y su corrida **promueve 12 celdas** de A6 (**10** a `OBSERVED_OK` y **2** a `PARTIAL` por denegación real de backend observada); `expected_by_actor` sigue `NOT_VERIFIED` y el estado global sigue `NOT_VERIFIED`. Fuente: [`evidence/2026-10-14/a6-core-families-ui.json`](./evidence/2026-10-14/a6-core-families-ui.json). **Limpieza del residuo de A5 y A6 (2026-10-14, §5 duodecies):** con el alias **A1 acreditado** se dieron de baja por UI el arma **15**, el ejercicio **16** y el usuario temporal **41** (GET 200 → DELETE UI 204 → GET 404) y el barrido por marcadores A5CF y A6CF en 7 familias dio **0** coincidencias propias; **no** promueve celdas y el 204/404 **no** acreditan borrado físico en base. **Acreditación del alias A7 (2026-10-14, §5 terdecies):** el alias **A7** quedó **acreditado por correspondencia privada** —login por UI **200** y `GET /api/auth/context/` **200** con rol activo `encargado_almacen`— y su corrida **promueve 14 celdas** de A7 (**11** a `OBSERVED_OK` y **3** a `PARTIAL` por denegación real de backend observada); `expected_by_actor` sigue `NOT_VERIFIED` y el estado global sigue `NOT_VERIFIED`. Fuente: [`evidence/2026-10-14/a7-core-families-ui.json`](./evidence/2026-10-14/a7-core-families-ui.json). **Limpieza del residuo de A7 (2026-10-14, §5 quaterdecies):** con el alias **A1 acreditado** se dio de baja por UI el ejercicio **17** (GET 200 → DELETE UI 204 → GET 404) y el barrido por marcador A7CF en 8 familias dio **0** coincidencias propias; **no** promueve celdas y el 204/404 **no** acreditan borrado físico en base. **Acreditación del alias A8 (2026-10-14, §5 quindecies):** el alias **A8** quedó **acreditado por correspondencia privada** —login por UI **200** y `GET /api/auth/context/` **200** con rol activo `tirador`— y su corrida **promueve 10 celdas** de A8 (**8** a `OBSERVED_OK` y **2** a `PARTIAL` por denegación real de backend observada); `expected_by_actor` sigue `NOT_VERIFIED` y el estado global sigue `NOT_VERIFIED`. Fuente: [`evidence/2026-10-14/a8-core-families-ui.json`](./evidence/2026-10-14/a8-core-families-ui.json). **Limpieza del residuo de A8 (2026-10-14, §5 sexdecies):** con el alias **A1 acreditado**, A8 no pudo crear nada (el rol más restringido no ofreció altas) y el barrido por marcador A8CF en 8 familias dio **0** coincidencias propias; **no** promueve celdas y el 204/404 **no** acreditan borrado físico en base. Con las **ocho** tandas del **2026-10-14** (A1 a A8) queda **cerrada la campaña documental** de acreditación por actor (§5 septendecies de [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md)), **no** la aceptación integral. Estado conservado: **Parcial**, sin `done`. |
| T12 | Cierre: historia en `Lore-Master`, conteos sobre las 1320 celdas, anclas, expectativas, evidencia y limpieza; conclusión del orquestador. Si queda obligatorio pendiente, backend bloqueado o prerrequisito, la spec padre **no** se marca `done` y el resultado se registra `NOT_VERIFIED` / `NO_CUMPLIDO`. **No** queda bloqueado por `Hasted-Halfling` inactivo: el baseline de `C10` se produce igual y la optimización no ejecutada se registra como tal | AC-12 | `Lore-Master` + orquestador | T9, T10 y los paquetes de `T11` entregados | **Pendiente** | Este documento y el resumen de ejecución quedaron persistidos; el **cierre no ocurrió**. Al no cerrar el plan, **no** se modifica el estado de la spec padre, que sigue como estaba |

La medición inicial de T10 no exige un diagnóstico previo: sirve para obtenerlo. La intervención
de `Hasted-Halfling` se activa cuando un problema concreto o la evidencia medida justifique al
especialista. La falta de un dataset representativo limita la conclusión, no se oculta con datos
ficticios.

El mapa de T1 es lectura y trazabilidad, no una auditoría de permisos de `Dwarven-Spelunkers`.
La revisión de seguridad de las expectativas por actor corresponde a `Dhampir-Slayer`, dentro
del gate nuevo propuesto. Los hallazgos no autorizan cambios de backend.

### Conjuntos de escritura tentativos

Ámbito exclusivo del cliente, sin solapamiento entre archivos. Rutas comprobadas en el árbol actual;
cada encargo fija su propio alcance antes de empezar y no lo amplía por iniciativa propia.

| Bloque | Ámbito tentativo |
|---|---|
| T2 | `front/src/api/`, `front/src/router/`, `front/src/stores/session.ts` y capa compartida de modal |
| T3, T4 | `front/src/views/organization/`, `front/src/views/identity/`, `front/src/features/organization/`, `front/src/features/identity/` |
| T5 | `front/src/views/authorization/`, `front/src/features/authorization/`, `front/src/permissions/` |
| T6 | `front/src/views/shooting/`, `front/src/features/shooting/` |
| T7 | `front/src/views/armory/`, `front/src/views/exercises/`, `front/src/features/armory/`, `front/src/features/exercises/` |
| T8 | `front/src/views/appearance/PersonalizerView.vue`, `front/src/features/appearance/preview-assets.ts`, `front/src/views/account/AccountView.vue`, `front/src/features/account/useOwnAccount.ts`, `front/src/stores/appearance.ts`, `front/src/api/appearance.ts` |
| T9, T10 | **Con escritura acotada acordada por encargo**: `Code-Transmuter` implementa los hallazgos y las optimizaciones dentro del tramo del bloque, nunca por iniciativa del auditor y nunca fuera del alcance acordado |

El backend **no** está incluido en ningún conjunto de escritura.

## Verificación

Lista de comprobaciones **previstas para el plan**, con el orden en que se verifican. Esta sección
**no** registra resultados: el resultado de cada tarea está en la columna `Estado de ejecución` de
§Tareas, y las fuentes de lo ejecutado están en
[`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md). Ninguna
comprobación se declara ejecutada por el mero hecho de estar escrita aquí.

| AC | Comprobación |
|---|---|
| AC-1 | Registro de aprobación del plan y orden de implementación emitida **por separado** por el operador, con fecha y bloques autorizados |
| AC-2 | Tabla de brechas con una fila por consumidor ancla, su clasificación y su actor esperado con la referencia de permiso y scope que lo fundamenta |
| AC-3 | Revisión de cambios acotada al tramo y prueba dirigida de reconciliación; sin reimplementación automática de lo que ya funciona |
| AC-4 | Prueba dirigida de la previsualización con los ocho contadores de destino exigidos; refresco observado sólo tras éxito |
| AC-5 | Recorrido por interfaz del alta formal de cuenta con sus asignaciones y credencial gestionada, más verificación de que la reconciliación del contexto principal ocurre tras la escritura |
| AC-6 | Contraste permitido y denegado por actor contra el actor esperado fundamentado, con inspección de la ausencia de datos ajenos y de la no exposición de edición del perfil propio en sólo lectura |
| AC-7 | Inspección de red que muestre persistencia de los ocho ejes contra la API y ausencia de escritura de apariencia en `localStorage`; comparación renderizada contra las páginas del DS externo |
| AC-8 | Revisión de invalidación tras cambio exitoso y constancia de que no existe siembra de API donde el backend bloquea |
| AC-9 | Hallazgos con pasos de reproducción, alcance, riesgo de regresión y dueño; verificación de fidelidad al DS en la interfaz real |
| AC-10 | Baseline registrado con sus condiciones; medición posterior a la optimización **bajo las mismas condiciones**, con el resultado anotado. Una compilación correcta **no** se acepta como verificación de performance |
| AC-11 | Estado persistido por celda con historia y resultado, sin extrapolación de actores; **todos** los AC obligatorios con resultado, incluidos los no cumplidos |
| AC-12 | Historia en `Lore-Master`, recuento de las 1320 celdas y estado global explícito |

Reglas de ejecución de la verificación, heredadas del proyecto:

- **Pruebas frontend**: el proyecto usa **Vitest 5.0.3** con el conjunto dirigido
  `front/tests/focused` y el script `test:focused` (`front/package.json:10`). No es `unittest` de
  Django, que es el del backend y no aplica aquí.
- Prueba dirigida existente por paquete en lugar de suite global.
- Sin dobles en aceptación: las pruebas de aceptación hablan con la API real. Los dobles de
  `unittest` quedan permitidos por el proyecto donde corresponda.
- Regresión de lo compartido ampliada sólo si existe riesgo real.
- `typecheck` y compilación según impacto y autorización.

## Notas y decisiones

- **Estado de aprobación y de ejecución:** el operador **aprobó el plan** y **emitió la orden de
  implementación** el **2026-10-14**, en la misma frase explícita. El archivo pasa de `draft` a
  `in-progress`. AC-1 queda satisfecho **en su registro**: la aprobación y la orden constan y están
  fechadas, y el plan no emite por sí mismo órdenes de ejecución.
- **Alcance de esta edición:** este documento persistió **planificación y estado de ejecución**, no
  una conclusión. El detalle ejecutado, con fuentes exactas y límites, está en
  [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md).
- **Gates revocados:** la orden nueva aprobó **revisiones propuestas**. La revocación histórica de
  revisiones previas **se conserva tal como está** y no se reescribe el pasado; en particular, la
  revisión amplia de calidad anterior queda **invalidada** y no se usa como veredicto — sólo se usan
  las auditorías posteriores acotadas.
- **Corrección sobre el pasado conservado:** §Fuera de alcance declaraba que este plan no arrancaba
  nada y que no existía orden de implementación. Esa frase describe el estado **anterior** a la
  orden del 2026-10-14 y **no se reescribe**: el registro de que entonces no había orden se
  mantiene, y la orden posterior queda registrada aquí.
- **Desviaciones:** ninguna respecto de lo aprobado. La sección §Tareas cambió **sólo** añadiendo las
  columnas `Estado de ejecución` y `Alcance completado / pendiente`; el texto de cada tarea y sus
  dependencias se conservan sin alterar.
- **Límites declarados:**
  - La matriz sigue con **1103 combinaciones de operación y actor sin acreditar**: **ninguna fila
    nueva** se acreditó en esta corrida y **ninguna fila se promovió**. Los conteos siguen
    **198 `OBSERVED_OK` / 19 `PARTIAL` / 1103 `NOT_EXERCISED`** sobre 1320 celdas.
  - **Actualización (misma fecha, tanda posterior):** la corrida de **acreditación del alias A1**
    (§5 quinquies de [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md))
    **sí promovió 8 celdas** de A1; los conteos vigentes quedan en
    **206 `OBSERVED_OK` / 19 `PARTIAL` / 1095 `NOT_EXERCISED`** sobre 1320, con `expected_by_actor`
    aún `NOT_VERIFIED`. La viñeta anterior describe el corte previo y se conserva.
  - **Actualización (misma fecha, segunda tanda posterior):** la corrida de **acreditación del alias
    A2** (§5 sexies de [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md))
    **promovió 44 celdas** de A2 —**43** a `OBSERVED_OK` y **1** (`OP-POS-006`) a `PARTIAL`—; los
    conteos de **ese corte** quedaron en **249 `OBSERVED_OK` / 20 `PARTIAL` / 1051 `NOT_EXERCISED`** sobre 1320,
    con `expected_by_actor` aún `NOT_VERIFIED`. La viñeta anterior describe el corte previo y se conserva.
  - **Actualización (misma fecha, tandas posteriores):** las corridas de acreditación de los alias
    **A3, A4, A5, A6, A7 y A8** —con sus limpiezas— y las corridas de **limpieza del residuo** movieron la
    matriz hasta el **conteo vigente: 330 `OBSERVED_OK` / 38 `PARTIAL` / 952 `NOT_EXERCISED`** sobre 1320,
    con `expected_by_actor` **aún `NOT_VERIFIED`**. Los cortes históricos citados arriba
    —**198 / 19 / 1103**, **206 / 19 / 1095** y **249 / 20 / 1051**— se conservan como registro y **no** se
    reescriben. Con las **ocho** tandas de acreditación por actor del **2026-10-14** (A1 a A8) queda
    **cerrada la campaña documental** de acreditación por actor (§5 septendecies de
    [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md)); **no** hay
    cierre de aceptación integral.
  - `expected_by_actor` permanece `NOT_VERIFIED` en las **1320** celdas.
  - El alias de actor **A1 no está verificado**; no se acredita comportamiento por actor y **no**
    se atribuyen roles por alias de rol.
  - `T1` **no** se declara cerrada: sigue en progreso, y sus falsos positivos fueron descartados
    antes de implementar.
  - La **paridad visual total** al Design System **no** está aprobada; lo observado es coincidencia
    de estilos calculados del modal en el estado abierto asentado.
  - La **revocación de escrituras propias** en la reconciliación de contexto **no** está verificada
    en runtime.
  - La mejora de performance es **de la entrada, no del total**: el total gzip **aumenta**. Faltan el
    conjunto de datos representativo y la medición final de performance bajo condiciones
    comparables; sin ellas **no** hay verificación de performance.
  - Las dependencias externas listadas **no** se resuelven aquí ni se inventan; el `500` de
    `POST /consumos-municion/` sigue abierto.
  - El hallazgo de seguridad de severidad **ALTA** —aceptación de un rol existente sin límites, por
    el que un usuario operativo con permisos `create`/`update` de usuarios **podría** otorgarse
    `super_admin`— se registra como **dependencia de seguridad de backend**. Es **inferencia de
    fuente estática** (`apipoligono/views.py:188-199` y `:269-393`;
    `apps/authorization/permissions.py:111-117`), **sin** reproducción ni verificación runtime. **No**
    se afirma un rol de sólo lectura. Se reporta y **no** se corrige en cliente ni se propone arreglo
    de backend.
  - Los candidatos de performance citados como rutas existen en el código leído; en esta corrida
    uno de ellos —`front/src/router/routes.ts`— sí fue objeto de corrección **medida**, no de
    diagnóstico previo.
  - En esta corrida **no** hubo cambios de backend, de base de datos, de credenciales, de
    dependencias, de commits ni de reinicio de servidores; **no** se escribieron registros sintéticos
    ni se crearon cuentas. Servidores y navegador estaban autorizados por el operador, pero **este
    encargo de documentación no los ejecuta**.
- **Dependencias salientes:** [`requirements.md`](./requirements.md),
  [`technical-design.md`](./technical-design.md), [`tasks.md`](./tasks.md),
  [`verification.md`](./verification.md),
  [`estado-integral-2026-10-12.md`](./estado-integral-2026-10-12.md) §12 y la biblioteca visual
  externa, cuya ruta desde este archivo es
  [`../../../../../Inume Design System/`](../../../../../Inume%20Design%20System/) — es el mismo
  directorio hermano al que apunta la raíz del repositorio en su
  [`AGENTS.md`](../../../AGENTS.md) §Regla dura. Ese enlace **no** está roto: se comprobó el **2026-10-14**
  que desde `docs/specs/final-frontend/` cinco niveles arriba llevan a la biblioteca, y allí existe.
  La comprobación se limita a confirmar la **existencia del destino** desde el sistema de archivos;
  la biblioteca es fuente visual **externa** al repositorio y su contenido no se reevalúa aquí. El
  estado de la spec padre **no** se modifica con este documento.
