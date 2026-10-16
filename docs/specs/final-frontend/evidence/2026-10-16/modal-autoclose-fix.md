---
actualizado: 2026-10-16
---

# Corrección del auto-cierre de modales de Organización (2026-10-16)

> 🕯️ **Qué es y qué no.** Registro documental de la **corrección del defecto de auto-cierre de modales**
> de la vista de Organización del cliente, reparado el **2026-10-16**. El defecto —**el modal no se
> cerraba solo tras una mutación con éxito**— estaba **registrado en runtime el 2026-10-15**; la causa se
> confirmó en código y el arreglo es **mínimo y localizado** en
> [`front/src/views/organization/OrganizationView.vue`](../../../../../front/src/views/organization/OrganizationView.vue).
> Este documento **no** emite veredicto de aceptación ni cambia ninguna celda de la matriz; describe un
> defecto **corregido** y su verificación.

## Índice

1. [El defecto](#1-el-defecto) · 2. [Causa raíz](#2-causa-raíz) · 3. [El arreglo](#3-el-arreglo) ·
4. [Pruebas](#4-pruebas) · 5. [Delta semántico declarado](#5-delta-semántico-declarado) ·
6. [Barrido del patrón en otras vistas](#6-barrido-del-patrón-en-otras-vistas) ·
7. [Verificación](#7-verificación) · 8. [Límites](#8-límites) · 9. [Fuentes](#9-fuentes)

---

## 1. El defecto

- **Registrado el 2026-10-15** en runtime: la acción **«Agregar unidad al recinto»** dejaba el modal
  **presente tras el éxito** (`modal_present: true`), contra el comportamiento esperado de cierre
  automático. Referencia:
  [`evidence/2026-10-15/t11-v0-v1-summary.md`](../2026-10-15/t11-v0-v1-summary.md) (≈líneas 186-191).
- **Alcance real del defecto:** afectaba a **todas** las rutas de la vista que, dentro de su manejador
  `onSuccess`, llaman a `closeModal()` tras una mutación con modal — no sólo al alta de relación de
  recinto. El síntoma «el modal no se cierra solo» es la manifestación común.

---

## 2. Causa raíz

La vista usa un **sistema de tickets** (`OperationTicket`) para serializar y abortar peticiones. El
estado de «modal ocupado» se deriva de los tickets pendientes:

- `activeRequests` (Map de tickets) → `syncPendingState()` → `pendingModalTokens` → `modalBusy`
  (`OrganizationView.vue:380`, `:386-395`).
- `closeModal()` **se autobloquea** si el modal está ocupado: `if (modalBusy.value) return`
  (`OrganizationView.vue:710-711`).

El defecto estaba en `perform()` (`OrganizationView.vue:628-666`): invocaba
**`handlers.onSuccess(value, ticket)` ANTES** de liberar el ticket (que se liberaba sólo en el bloque
`finally`). Como el ticket **seguía pendiente** al entrar en `onSuccess`, `modalBusy` continuaba en
`true` y la llamada a `closeModal()` de dentro del manejador **se topaba con su propia guarda** —
**auto-bloqueo**: el modal nunca llegaba a cerrarse tras el éxito.

> 📜 **Por qué importa el orden.** El cierre automático depende de que el estado pendiente esté **ya
> liberado** cuando el manejador de éxito intenta cerrar. El bloque `finally` llegaba **después** del
> manejador, cuando ya era tarde para esa guarda.

---

## 3. El arreglo

Cambio **mínimo y localizado** en `OrganizationView.vue`, en dos piezas:

1. **Helper idempotente `releaseTicket(ticket)`** (`OrganizationView.vue:600-609`): libera el estado
   pendiente del ticket —`activeRequests.delete(ticket.key)` + `syncPendingState()`— **sólo si el ticket
   sigue vigente** (`ticketIsCurrent`, `:589-598`); si ya fue reemplazado o abortado, **no toca nada**.
2. **Liberación ANTES de los manejadores** en `perform()` (`:645-665`): cuando la petición resuelve o
   rechaza y el chequeo de staleness pasa, se libera el ticket **antes** de invocar
   `handlers.onSuccess` (`:648-649`) o `handlers.onFailure` (`:653-654`). Así, cuando `onSuccess` llama a
   `closeModal()`, `modalBusy` **ya es falso** y el modal se cierra solo.

Se **conserva** el bloque `finally` como **red de seguridad idempotente** (`:663-665`): una segunda
liberación del mismo ticket es inocua gracias a la guarda de vigencia.

```ts
// releaseTicket: idempotente; no toca un ticket ya reemplazado/abortado.
function releaseTicket(ticket: OperationTicket): void {
  if (!ticketIsCurrent(ticket)) return
  activeRequests.delete(ticket.key)
  syncPendingState()
}

// perform: liberar el ticket ANTES de los handlers; `finally` como red.
try {
  const value = await request(connectionFor(ticket))
  if (!ticketIsCurrent(ticket)) return { kind: OPERATION_RESULT.STALE }
  releaseTicket(ticket)
  handlers.onSuccess(value, ticket)
  return { kind: OPERATION_RESULT.SUCCESS, value }
} catch (error: unknown) {
  if (!ticketIsCurrent(ticket)) return { kind: OPERATION_RESULT.STALE }
  releaseTicket(ticket)
  handlers.onFailure(error, ticket)
  /* … uncertainMutation … */
} finally {
  releaseTicket(ticket)
}
```

> 🪶 **Preservado sin cambios:** el busy/spinner del `DsModal`, las guardas anti doble-submit
> (`if (… modalBusy.value) return`, `:1432`, `:1532`, `:1609`, `:1676`, `:1697`, `:1738`), la semántica de
> staleness (`ticketIsCurrent`) y `uncertainMutation`.

---

## 4. Pruebas

Prueba dirigida **nueva**: [`front/tests/focused/organization-modal-autoclose.test.ts`](../../../../../front/tests/focused/organization-modal-autoclose.test.ts)
(**3** pruebas), construida para **reproducir el defecto** (rojo) y confirmar el cierre con el arreglo
(verde). Discrimina «modal abierto» por la **presencia del diálogo** `.ds-modal[role="dialog"]` tras
esperar el teardown de la transición (200 ms), igual que la evidencia de runtime.

| # | Prueba | Cubre |
|---|---|---|
| 1 | «Agregar unidad al recinto» cierra el modal cuando el servidor confirma | El defecto registrado literal: `addUnitToRecinto` resuelve → el modal **se cierra** |
| 2 | El alta de unidad (`POST`) cierra el modal y recarga la lista | Otra ruta de `onSuccess` con `closeModal()`; además el re-fetch de la lista |
| 3 | El fallo del servidor preserva el modal abierto con el detalle y sin bloqueo de busy | El camino de **rechazo**: el modal **permanece** abierto, con el detalle, y el busy **queda liberado** |

---

## 5. Delta semántico declarado

La corrección **introduce un cambio de comportamiento declarado** por el implementador, que se registra
aquí para que no herede nadie sin saberlo:

> **Un manejador (`onSuccess`/`onFailure`) que lance una excepción ahora hace que `perform()` devuelva
> `STALE`** (antes devolvía por el camino de `onFailure`/`uncertainMutation`).

**Motivo:** al liberar el ticket **antes** de invocar el manejador, una excepción lanzada **dentro** del
manejador ya no se procesa como fallo de la operación: cae al `catch`, donde el chequeo de vigencia
`if (!ticketIsCurrent(ticket)) return STALE` la clasifica como obsoleta. **No hay camino del producto
dependiente** de esa rama: los manejadores de la vista no lanzan, y ningún flujo espera `onFailure`/
`uncertainMutation` de una excepción de manejador.

---

## 6. Barrido del patrón en otras vistas

Barrido del **mismo patrón** (liberar el ticket **después** de los manejadores, con auto-bloqueo de
`closeModal()` por `modalBusy`) en las demás vistas con modal:

| Vista | Resultado |
|---|---|
| `AuthorizationView` | **Ya liberaba antes** de los handlers → no afectada |
| `ExercisesView` | **Ya liberaba antes** de los handlers → no afectada |
| `Armory` | **Sin guarda** de auto-bloqueo → no afectada |
| `Identity` | **Sin guarda** de auto-bloqueo → no afectada |

> 📖 El defecto quedó **circunscrito a Organización**; no se detectó el patrón en ninguna otra vista.

---

## 7. Verificación

Verificación **del orquestador** (independiente del implementador), sobre el arreglo y la prueba:

| Comprobación | Comando | Resultado |
|---|---|---|
| Prueba dirigida | suite enfocada, filtro de la prueba nueva | **3/3** |
| Suite enfocada del front | `front`, suite enfocada | **259/259** |
| Typecheck | `vue-tsc --noEmit` | **exit 0** |

> 🕯️ Los comandos exactos y sus códigos de salida constan en el reporte del implementador y en la
> verificación del orquestador; aquí se registra el **resultado**, no se re-ejecuta.

---

## 8. Límites

- **No cambia la matriz ni el estado global.** Este documento describe una corrección de cliente; **no**
  toca `acceptance-matrix.json`, `status_global` (`NOT_VERIFIED`) ni `global_conclusion` (`NO_CUMPLIDO`).
- **Alcance acotado.** El cambio vive sólo en `OrganizationView.vue` y su archivo de pruebas; ninguna otra
  vista, estilo ni backend se tocó.
- **Delta declarado, no verificado end-to-end en producto.** El delta semántico del §5 se declara desde el
  código y el razonamiento del implementador; **no** se ejerció ningún flujo real dependiente de esa rama
  (no existe).
- **Sin backend, base de datos ni navegador.** Pruebas de componente y typecheck en el front; **sin**
  `git add`/`commit`.

---

## 9. Fuentes

| # | Fuente | Aporta |
|---|---|---|
| 1 | [`front/src/views/organization/OrganizationView.vue`](../../../../../front/src/views/organization/OrganizationView.vue) | Fuente del arreglo: `releaseTicket` (`:600-609`), `perform` (`:628-666`), `closeModal` (`:710-711`) |
| 2 | [`front/tests/focused/organization-modal-autoclose.test.ts`](../../../../../front/tests/focused/organization-modal-autoclose.test.ts) | Prueba dirigida (3 pruebas; rojo → verde) |
| 3 | [`evidence/2026-10-15/t11-v0-v1-summary.md`](../2026-10-15/t11-v0-v1-summary.md) | Registro del defecto en runtime (≈líneas 186-191) |
| 4 | `.cache/frontend-acceptance/2026-10-16/brief-modal-autoclose-fix.md` | Encargo de la corrección y causa confirmada por el orquestador |
