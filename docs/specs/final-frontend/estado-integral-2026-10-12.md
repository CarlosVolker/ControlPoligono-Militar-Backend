---
actualizado: 2026-10-14
---

# Frontend integral — estado y pendientes al 2026-10-12

> 🕯️ **Alcance.** Documento consolidado por orden del operador. Registra **avances comprobados**
> y **pendientes con su causa**. No emite veredictos de aceptación: el veredicto por celda y la
> conclusión de producto corresponden al orquestador. No contiene secretos, RUT, contraseñas ni
> cookies. Los punteros de evidencia son relativos a
> [`evidence/2026-10-12/`](./evidence/2026-10-12/).

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo) · 2. [Avances comprobados](#2-avances-comprobados) ·
3. [Pendientes](#3-pendientes) · 4. [Deuda backend viva](#4-deuda-backend-viva) ·
5. [Qué no se afirma](#5-qué-no-se-afirma) · 6. [Apéndice 2026-10-13](#6-apéndice-del-2026-10-13--edición-y-borrado-de-resultados-a1) ·
7. [Apéndice 2026-10-13 · segunda tanda](#7-apéndice-del-2026-10-13--sesión-de-frontend-autónomo-segunda-tanda) ·
8. [Apéndice 2026-10-13 · recorrido CRUD por familias](#8-apéndice-del-2026-10-13--recorrido-crud-por-familias-a1) ·
9. [Apéndice 2026-10-14 · cierre de Personas](#9-apéndice-del-2026-10-14--cierre-de-personas-a1) ·
10. [Apéndice 2026-10-14 · detalle de UI y `PUT`](#10-apéndice-del-2026-10-14--detalle-de-ui-y-put-a1) ·
11. [Apéndice 2026-10-14 · `PUT` de persona y catálogo de calibres](#11-apéndice-del-2026-10-14--put-de-persona-y-catálogo-de-calibres-a1) ·
12. [Apéndice 2026-10-14 · ejecución del plan maestro](#12-apéndice-del-2026-10-14--ejecución-del-plan-maestro-calidad-y-performance)

> 🕯️ §1 a §5 son el **snapshot del 2026-10-12** y se conservan como estaban. Los **conteos
> vigentes** tras el recorrido del 2026-10-13 están en [§6](#6-apéndice-del-2026-10-13--edición-y-borrado-de-resultados-a1),
> y los vigentes tras la **segunda tanda** de la misma fecha en [§7](#7-apéndice-del-2026-10-13--sesión-de-frontend-autónomo-segunda-tandas),
> los vigentes tras el **recorrido CRUD por familias** en [§8](#8-apéndice-del-2026-10-13--recorrido-crud-por-familias-a1),
> los vigentes tras el **cierre de Personas** en [§9](#9-apéndice-del-2026-10-14--cierre-de-personas-a1),
> los vigentes tras el **recorrido complementario de detalle y `PUT`** en
> [§10](#10-apéndice-del-2026-10-14--detalle-de-ui-y-put-a1), y los vigentes tras el **`PUT` de persona
> y el catálogo de calibres** en
> [§11](#11-apéndice-del-2026-10-14--put-de-persona-y-catálogo-de-calibres-a1). La ejecución del
**plan maestro** del mismo día se registra en
[§12](#12-apéndice-del-2026-10-14--ejecución-del-plan-maestro-calidad-y-performance): sus tramos de
calidad y performance **no** cambian los conteos, y su tanda de **acreditación del alias A1**
(§12.7) **sí** los mueve.

---

## 1. Resumen ejecutivo

**Estado global: `NOT_VERIFIED` · conclusión de producto: `NO_CUMPLIDO`.**

El motivo no es la ausencia de trabajo: es la **cobertura de la verificación**. De **1320 celdas**
de la matriz de aceptación, **1289 siguen `NOT_EXERCISED`**, 19 están `PARTIAL` y sólo **12**
`OBSERVED_OK`. → **Conteo del 2026-10-12; vigente tras la segunda tanda del 2026-10-13: 1126 /
20 / 174 (§7.1) y, tras el recorrido CRUD por familias, 1115 / 23 / 182 (§8.1)**. Las capacidades que sí se ejercitaron —armerías, preferencias de apariencia,
sesión y contraseña propia, navegación por permisos— se ejercitaron con **unos pocos actores** y
sobre **datasets de desarrollo**. El resto del producto (organización, personas, armas, calibres,
tiro, ejercicios, consumos, auditoría, autorización) **no tiene todavía evidencia de aceptación**,
aunque parte de sus pantallas exista y funcione en desarrollo.

A eso se suma una **deuda backend viva** de siete puntos registrados, uno de los cuales
—la captura de resultados— **impide crear el primer registro** y otro impide el uso legítimo de
overrides. Y quedan **prerrequisitos que no son del código**: recuperación sin canal de correo
utilizable, una cuenta legacy sin credencial conocida para el cambio forzado de contraseña, y el
commit de todo el trabajo, a la espera de decisión del operador.

Detalle operativo y por celda:
[`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json).

---

## 2. Avances comprobados

### 2.1 Permisos y navegación por rol

Sidebar filtrado por permisos, contenedor neutral para superficies denegadas y metadata de rutas.
`AC-6` de la spec queda bloqueado por la deuda backend §1. Spec:
[`../frontend-permission-navigation.md`](../frontend-permission-navigation.md) · evidencia de
navegación en [`runtime-observations.md`](./evidence/2026-10-12/runtime-observations.md).

### 2.2 Superficie «Mi cuenta» (`/cuenta`)

Datos reales de contexto, ficha propia **read-only** acreditada y cambio voluntario de contraseña.
**F7 verificado de forma acotada** al caso A8 de sesión invalidada: tras el cambio, la aplicación
retira el estado autenticado obsoleto y vuelve a `/login` con aviso. Spec:
[`../frontend-account-self-service.md`](../frontend-account-self-service.md) · evidencia en
[`runtime-observations.md`](./evidence/2026-10-12/runtime-observations.md) §5 y bloque `f7_after_fix`
de la matriz.

### 2.3 UX

Motivos de denegación visibles y referenciados con ARIA en vez de `title`-only, microcopy de cliente
en español neutro, retiro de la navegación legacy y personalizador traducido. móvil a 390 × 844 sin
desbordamiento. Plan: [`../../plans/frontend-ux-corrections.md`](../../plans/frontend-ux-corrections.md)
· evidencia de personalizador en
[`evidence/2026-10-12/personalizer-follow-up.json`](./evidence/2026-10-12/personalizer-follow-up.json).

### 2.4 Pruebas aisladas

**14 archivos / 222 tests** en `front/tests/focused/`, incluidos los 7 casos de CRUD de armerías y
los 4 de recarga de sesión. `typecheck` y `build` en verde. **Son pruebas aisladas: no equivalen a
flujos reales ejecutados contra el backend.**

### 2.5 Matriz de aceptación

Denominador efectivo **verificado en 165 OP** (contraste estático de `urls.py` y viewsets por
Dwarven-Spelunkers; +3 operaciones de preferencias `design-system` que no estaban en el manifiesto
original). **1320 celdas**: 12 `OBSERVED_OK`, 19 `PARTIAL`, 1289 `NOT_EXERCISED`. → **Conteo del
2026-10-12; vigente tras la segunda tanda del 2026-10-13: 174 `OBSERVED_OK`, 20 `PARTIAL`, 1126
`NOT_EXERCISED` (§7.1) y, tras el recorrido CRUD por familias, 182 `OBSERVED_OK`, 23 `PARTIAL`, 1115 `NOT_EXERCISED` (§8.1)**.
Reconciliación de
universos en [`evidence/2026-10-12/acceptance-universes.md`](./evidence/2026-10-12/acceptance-universes.md).

### 2.6 Evidencia runtime real

Todas las observaciones de este bloque son `direct_orchestrator_playwright_ui`: **UI real, backend
real, sin mocks ni cookies inyectadas**, sobre el actor A7 (encargado de almacén):

- Lecturas de armerías **200** y editor sembrado con datos iguales al DTO de la respuesta real.
- `PATCH` **200** reversible, con `GET` confirmatorio.
- `PUT` **200** con valores iguales al original y `PUT` **200** con valores **distintos**
  (variación persistida y restaurada en la misma corrida, con `GET` confirmatorios).
- Validación de campo requerido con **cero** escrituras; cierre de modales por UI.
- `POST /api/logout/` **200** con retorno a `/login` y campos de login vacíos.

Fuentes: [`live-armory-results.json`](./evidence/2026-10-12/live-armory-results.json),
[`live-armory-replay-results.json`](./evidence/2026-10-12/live-armory-replay-results.json),
[`armory-follow-up-replay-results.json`](./evidence/2026-10-12/armory-follow-up-replay-results.json) y
[`armory-extended-coverage-results.json`](./evidence/2026-10-12/armory-extended-coverage-results.json).

### 2.7 Alta y baja reales por UI

Con A7 y con A1 sobre un **registro descartable**: `POST /api/armorias/` **201**, `DELETE
/api/armorias/{id}/` **204**, con listado y `GET` de la ficha del id borrado en **404** como
confirmación, y **cero registros dejados**. Fuente:
[`armory-crud-complete-results.json`](./evidence/2026-10-12/armory-crud-complete-results.json).

### 2.8 Preferencias de apariencia por usuario, contra el backend

`PUT` **200**, persistencia verificada **entre sesiones**, aislamiento **A7→A8** (A8 no afectado por
el cambio de A7) y reset por `DELETE` **204** a los defaults del Design System. Celdas
`OP-PRF-003`/`004`/`005` del actor A7 en `OBSERVED_OK`. Fuente:
[`preferences-isolation-results.json`](./evidence/2026-10-12/preferences-isolation-results.json).

### 2.9 Scope de unidad

Mismo tenant: A1 (`super_admin`) ve **4** armerías y A7 (`encargado_almacen`) ve **1**, con logins y
logouts 200. Es **filtrado por scope de unidad**, **no** aislamiento entre tenants. Fuente:
[`armory-scope-isolation-results.json`](./evidence/2026-10-12/armory-scope-isolation-results.json).

### 2.10 Fix del defecto de recarga de sesión

Un *hard reload* con sesión activa ya **no** expulsa a `/login` ni a `/contexto`. El tenant se porta
en la URL (`?tenant=`) mediante `history.replaceState` **sólo sobre historial real**, y en rutas
principal-only el guard re-autentica con `GET /api/auth/context/` antes de expulsar; la ausencia
acreditada (logout/purge) **no** se re-bootstrappea. Regresión cubierta por
`reload-session.test.ts` y verificado en navegador real. Apéndice de
[`runtime-observations.md`](./evidence/2026-10-12/runtime-observations.md).

### 2.11 Fidelidad al Design System (valores estáticos)

Contraste estático: `theme-customizer.css` **398/398** bloques idénticos, tokens **33/33** del shell
y **30/30** de Base UI, y botones, topbar, sidebar y estados inválidos idénticos. **8 divergencias
corregidas 1:1** y **4 falsos positivos descartados** (el contraste inicial estaba equivocado).
Reporte con fuentes de ambos lados:
[`evidence/2026-10-12/ds-fidelity-comparison.md`](./evidence/2026-10-12/ds-fidelity-comparison.md).

### 2.12 Dataset de desarrollo con datos de tiro

**2 resultados** sembrados por `POST /api/resultados/` con sesión real, porque la UI de captura no
puede crear el primero (deuda §7). Dashboard poblado: 2 tiradores, 20 disparos, 15 aciertos, 75 %.
Fuente: [`shooting-seed-results.json`](./evidence/2026-10-12/shooting-seed-results.json).

### 2.13 Capturas de estado

**24 PNG + manifiesto** en `~/Desktop/capturas-frontend-2026-10-12/`, en **tema claro**, de
armerías, cuenta y personalizador en ocho anchos (320 a 1920). **Anteriores** a los fixes de CSS y al
fix de recarga: no sirven como evidencia del estado corregido.

---

## 3. Pendientes

| Pendiente | Causa | Falta |
|---|---|---|
| **Aceptación integral del resto del producto** | 1289 celdas `NOT_EXERCISED`: resto de actores y familias (organización, personas, armas, calibres, tiro, ejercicios, consumos, auditoría, autorización) | Ejecución runtime por actor; **no** es una tarea de código |
| **Recuperación completa de acceso** | Sin canal de correo utilizable en el entorno de desarrollo (deuda §3) | Prerrequisito del entorno. **No** se fabrica ni se simula |
| **Cambio forzado de contraseña** | La única cuenta con `must_change_password=true` es legacy (usuario id 3) y **no** hay credencial conocida | **Decisión del operador**: reset o provisión de una cuenta dev nueva |
| **Overrides con datos legítimos** | Deuda backend §1 | Arreglo de backend. Marcado `BLOCKED_BACKEND`; **no** cuenta como PASS |
| **Edición self-service del perfil propio** | Capacidad **ausente** en el backend | Backend. Declarada, **no** simulada |
| **Personalizador: siete ejes** | Sólo `accent` se ejercitó como escritura | Ejercicio de los otros siete ejes contra backend |
| **Captura de tiro por UI** | Deuda §7 (huevo-gallina de elegibilidad) | Arreglo de backend. **Con** el dataset ya sembrado, editar y eliminar resultados existentes por UI **queda ejercitable y aún no ejercitado** · → **2026-10-13: ejercitado; borrar funciona, editar está bloqueado (§6)** |
| **Paridad visual del DS** | Sólo contraste de valores CSS estáticos | Verificación con navegador. Las capturas de escritorio son anteriores a los fixes; su renovación está **ofrecida, no ejecutada** |
| **Aislamiento entre tenants** | Nunca se observaron dos tenants | Entorno con un segundo tenant |
| **Escrituras cruzadas A→B de negocio** | No ejercitadas | Ejecución por dos actores con contexto legítimo |
| **Roundtrip de contraseña temporal (F7)** | No completado | Ejercicio específico. **`NO_MUTATION` no se afirma** |
| **Git: commit de todo el trabajo** | Sin commit por decisión del operador | **Decisión del operador** |

---

## 4. Deuda backend viva

Consignada en [`../../bugs/backend-debt.md`](../../bugs/backend-debt.md), §1 a §7:

1. **Overrides no reflejados** en el contexto de UI.
2. **Validación del destino** en escrituras de membership, puesto y unidad.
3. **Recuperabilidad y almacenamiento** del código de recuperación.
4. **Contraseña inicial compartida** como valor por defecto.
5. **CSRF en login** sin validación explícita.
6. **Invalidación de sesión** tras cambio de contraseña (§6.1: observación runtime acotada).
7. **Captura de resultados**: no se puede crear el primer resultado (huevo-gallina de elegibilidad).

Ninguna tiene fix propuesto aplicado desde este trabajo.

---

## 5. Qué no se afirma

Este documento **no** afirma, y la evidencia disponible no permite afirmar:

- **Ni** que el producto sea 100 % funcional, **ni** que el frontend sea 100 % implementable.
- **Ni** CRUD completo por familia ni por actor: lo acreditado es CRUD de armerías con dos actores.
- **Ni** aislamiento total: hay filtrado por scope de unidad, **no** aislamiento entre tenants.
- **Ni** paridad visual completa: hay coincidencia de valores CSS estáticos, **no** de píxeles
  renderizados ni de tema claro.
- **Ni** certificación de backend: §4 registra siete deudas vigentes.
- **Ni** que las 222 pruebas aisladas equivalgan a flujos reales: son pruebas de unidad y
  componentes, no recorridos ejecutados contra el backend.
- **Ni** que el roundtrip de contraseña temporal esté probado, ni ausencia de mutación.

El estado global permanece **`NOT_VERIFIED` / `NO_CUMPLIDO`** y las specs
[`../frontend-integral-acceptance.md`](../frontend-integral-acceptance.md) y
[`../frontend-account-self-service.md`](../frontend-account-self-service.md) siguen **`in-progress`**:
quedan criterios de aceptación obligatorios sin cumplir.

---

## 6. Apéndice del 2026-10-13 — edición y borrado de resultados (A1)

> 🕯️ **Qué es.** `Lore Master`. Incorpora al estado el recorrido **real** del 2026-10-13 con actor
> **A1** (`super_admin`) sobre edición y borrado de resultados de tiro. **No** reescribe el corte del
> 2026-10-12 de §1 a §5: aquel queda como **snapshot histórico** y los conteos vigentes son los de
> §6.1. El estado global sigue **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**.
> Evidencia: `direct_orchestrator_playwright_ui`.

### 6.1 Conteos vigentes

| Estado | Corte 2026-10-12 (§1, §2.5) | Corte vigente al 2026-10-13 | Δ |
|---|---:|---:|---:|
| `NOT_EXERCISED` | 1289 | **1284** | −5 |
| `PARTIAL` | 19 | **22** | +3 |
| `OBSERVED_OK` | 12 | **14** | +2 |
| Denominador | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

Recalculado sobre las celdas reales de `acceptance-matrix.json` (`165` filas × `8` actores). Los
cinco movimientos son del actor **A1** en la familia de resultados; **ninguna otra celda se movió**.

### 6.2 Celdas que cambian

| Fila (método + endpoint) | Actor | Antes | Ahora | Observado |
|---|---|---|---|---|
| `GET /resultados/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Detalle **200** con prefill fiel; alcance acotado al resultado 1 |
| `PUT /resultados/{id}/` | A1 | `NOT_EXERCISED` | `PARTIAL` | **400** desde la UI; original intacto. Sin ediciones acreditadas |
| `PATCH /resultados/{id}/` | A1 | `NOT_EXERCISED` | `PARTIAL` | **400** desde la UI, observado **aparte** del `PUT` |
| `DELETE /resultados/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | **204** por UI, fila eliminada, `GET` **404**. Descartable creado por API |
| `POST /resultados/` | A1 | `NOT_EXERCISED` | `PARTIAL` | Alta ejercida por UI y rechazada por unicidad con **400**: **no** se acredita creación exitosa por UI |

### 6.3 Avance comprobado

- **Borrado de un resultado de tiro por la UI**: `DELETE` **204**, fila desaparecida y `GET`
  posterior **404**. **Cancelar** el borrado **conserva** el registro (`GET` **200**).
- **Datos originales intactos**: 2 resultados, **8/10** en carril 1 y **7/10** en carril 2, y
  **cero** descartables al cierre.

### 6.4 Pendientes que este recorrido abre o agrava

| Pendiente | Causa | Falta |
|---|---|---|
| **Edición de resultados bloqueada** | `PUT` y `PATCH` devuelven **400**: «La fraccion no pertenece a la unidad organizacional del recurso.» | Arreglo de backend (deuda §7.1). **No** se propone ni se aplica aquí |
| **Alta de resultados por UI** | Sin combinaciones libres en las opciones de captura (§7) | Arreglo de backend; el registro de prueba se creó por **API pública** |
| **Mensaje de error genérico** | La UI muestra HTTP **400** sin el `non_field_errors` concreto | Corrección **frontend**. **Observado, no corregido** |
| **Captura visual del 2026-10-13** | El screenshot agotó timeout | Reejecución de la captura. **No** se atribuye causa al producto |

### 6.5 Límites de este apéndice

- **Sólo A1**: no se certifica edición ni borrado para otros actores, ni aislamiento entre actores.
- **No** se generaliza que toda edición esté rota: es un **dataset de desarrollo concreto** y el
  bloqueo se observó sobre `PUT` y `PATCH` del resultado 1.
- El `PUT` se repitió **una vez** tras un timeout del cierre del modal en el harness: **ambos**
  intentos **400**.
- El contexto de navegador previo tuvo transiciones bloqueadas; un contexto nuevo permitió
  interacciones normales. **La causa no se establece** ni se atribuye al producto.
- **Sin** cambios de código de producto, backend, schema ni datos originales. **No** se corrieron
  `tests` ni `build` y **no** se reclama estado de ellos.
- **No** hay cierre de aceptación integral.

> 📜 **Fuentes.** Recorrido y lectura de código:
> [`evidence/2026-10-13/shooting-edit-delete.md`](./evidence/2026-10-13/shooting-edit-delete.md) ·
> evidencia primaria inalterada
> [`shooting-edit-delete-results.json`](./evidence/2026-10-13/shooting-edit-delete-results.json) ·
> celdas y conteos
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json)
> (bloque `observations.shooting_edit_delete_a1_2026_10_13`) · deuda backend:
> [`../../bugs/backend-debt.md`](../../bugs/backend-debt.md) §7.1.

---

## 7. Apéndice del 2026-10-13 — sesión de frontend autónomo (segunda tanda)

> 🕯️ **Qué es.** `Lore Master`. Incorpora al estado la **segunda tanda** del 2026-10-13: barrido de
> rutas con los ocho actores, personalizador de ocho ejes, dos correcciones de frontend verificadas,
> dos intentos de escritura acotados por el harness y comprobación de prerrequisitos. **No**
> reescribe §1 a §5 ni §6: quedan como **snapshots históricos**. El estado global sigue
> **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**. Evidencia:
> `direct_orchestrator_playwright_ui` y lecturas directas del worker.

### 7.1 Conteos vigentes

| Estado | Corte 2026-10-12 | Tras §6 (2026-10-13, primera tanda) | Corte vigente (§7) | Δ |
|---|---:|---:|---:|---:|
| `NOT_EXERCISED` | 1289 | 1284 | **1126** | −158 |
| `PARTIAL` | 19 | 22 | **20** | −2 |
| `OBSERVED_OK` | 12 | 14 | **174** | +160 |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**176 celdas** cambiaron: 142 `NOT_EXERCISED` → `OBSERVED_OK`, 18 `PARTIAL` → `OBSERVED_OK` y 16
`NOT_EXERCISED` → `PARTIAL`. Recuento obtenido recorriendo las filas reales de `acceptance-matrix.json`.
Sin modificación de filas `OP-*`, actores ni `total_cells`, y sin borrar evidencia previa.

> 🕯️ El salto de `OBSERVED_OK` es **de lectura**: 144 celdas del barrido y 8 del login por UI.
> **Ninguna** celda nueva acredita una escritura de negocio exitosa.

> 📜 **Deriva registrada y corregida en el puntero, no en el corte.** Las flechas de §1 y §2.5
> apuntaban a `1285 / 21 / 14` para el 2026-10-13, cifra que **no coincidía** con el recuento del
> archivo: el recorrido de las 165 filas da `1284 / 22 / 14` antes de esta segunda tanda (ambas sumas
> dan 1320 y difieren en una celda entre `NOT_EXERCISED` y `PARTIAL`). **Prevalece el archivo.** Se
> reorientaron esas dos flechas —que son punteros vivos— a §7.1; el texto del corte 2026-10-12 y el
> de §6 se conservan tal cual, sin reescribir.

### 7.2 Avances comprobados

- **Barrido de rutas**: 144 navegaciones (8 actores × 18 rutas), contexto nuevo por actor, login por
  UI real y **sólo GET de negocio**. **164 respuestas GET**, todas **200**, que colapsan en **144
  celdas** distintas. **14 denegaciones neutrales** de ruta, sin `h1` y **sin request de dominio**.
- **Lectura acreditada por los ocho actores** en unidades, posiciones, membresías, usuarios, roles,
  categorías de rol, scopes, permisos, calibres, polígonos, lecciones, ejercicios y consumos; y por
  A1..A5 y A7 en armerías y armas; por A1..A4 en recintos; por A1 y A2 en auditoría.
- **Sesión**: `POST /api/auth/login/` **200** y `GET /api/auth/context/` **200** para los **8**
  actores, lo que **supera** la evidencia reportada por el worker en esas filas.
- **Personalizador de ocho ejes**: ocho `PUT` **200** por UI, uno por eje, persistencia tras
  re-login por UI, atributos aplicados en el DOM, aislamiento A7→A8 observado y reset por `DELETE`
  **204** a los defaults del Design System. Ahora **también** hay celda de lectura `OBSERVED_OK`
  para A8.
- **Dos correcciones de frontend verificadas**: motivo concreto del backend visible en la UI en vez
  del mensaje HTTP genérico, y `position: relative` en el contenedor con scroll de armerías que
  elimina el desbordamiento del documento en **8 anchos (320 a 1920)**.
- **Comandos del orquestador**: `typecheck` **exit 0**, `test:focused` **exit 0** con **15 archivos y
  232 tests**, `build` **exit 0**.
- **Denegaciones de backend reales**: **14 `GET` con 403** en lectura directa del barrido del worker
  (`/auth/audit-log/`, `/recintos/`, `/armorias/`, `/armas/`), celdas en `PARTIAL`.
- **Datos originales restaurados**: unidad 5 y arma 1 con igualdad campo a campo contra su línea
  base; resultados de tiro 1 y 2 intactos (**8/10** y **7/10**).

### 7.3 Lo que esta tanda abre o agrava

| Pendiente | Causa | Falta |
|---|---|---|
| **Escrituras de organización y armas por UI** | En **ninguna** de las dos el harness registró el estado HTTP exacto de la escritura de UI. La compensación por API devolvió los datos a su línea base: en armas con `PATCH` **200** explícito; en organización el artefacto registra el `PATCH` de compensación **sin** consignar su estado, y sólo el `GET` final **200** | Ejercicio con captura de estado y precondiciones validadas |
| **Alta y baja** de unidades y armas | No ejercitadas | Ejercicio runtime por actor |
| **Edición de resultados** | El `PATCH` sigue en **400**: la corrección fue de **presentación** del error, no de la escritura | Arreglo de backend (deuda backend §7.1) |
| **Alta de resultados por UI** | Sin combinaciones libres en las opciones de captura (deuda backend §7) | Arreglo de backend |
| **Aislamiento entre tenants** | Un solo tenant; no se proveyó un segundo | Entorno con segundo tenant |
| **Recuperación por correo** | Loopback SMTP sin listener y sin capturador local; **no** se instaló nada | Prerrequisito del entorno |
| **Cambio forzado de contraseña** | Una sola cuenta legacy sin credencial conocida | **Decisión del operador** |
| **Escrituras cruzadas A→B de negocio** | No ejercitadas | Ejecución por dos actores |
| **Paridad visual del DS** | Capturas de estado actual en tema claro, sin comparación con navegador | Verificación con navegador |
| **Git: commit** | Sin commit por decisión del operador | **Decisión del operador** |

### 7.4 Reglas conservadoras aplicadas

| No promovido | Motivo |
|---|---|
| Las **14 denegaciones neutrales** del barrido | Sin request de dominio no hay respuesta que leer: no se convierten en `403` |
| Estados HTTP de las dos escrituras acotadas | En organización el artefacto sólo conserva `response.ok`; en armas, la persistencia del cambio verificada por lectura posterior. **Ninguno** registra el estado HTTP de la escritura de UI, así que un 200 supuesto sería inventado |
| `GET /organization-units/{id}/` y `GET /armas/{id}/` | El path del `GET` observado no queda registrado y no permite distinguir el detalle de UI de una lectura del harness: se conserva `NOT_EXERCISED` con la evidencia enlazada |
| Logout de los ocho actores | Cerrar contexto de navegador no es `POST /api/logout/` |
| `PUT` y `DELETE` de preferencias de A8 | A8 leyó; no escribió |
| Filas de `tbody` como inventario | Filas renderizadas, no recursos: organización se pinta como árbol y cuenta combina tablas |
| Superficie de UI del barrido del worker | La corrida terminó en `harness_error` sin evaluar UI; las 144 navegaciones del orquestador **no** se repiten |

### 7.5 Límites de este apéndice

- Cobertura **de sólo lectura** en el barrido: **no** acredita CRUD.
- `expected_by_actor` sigue **`NOT_VERIFIED`** en las 165 filas: se acredita que la lectura responde
  **200** con datos reales, **no** que el conjunto visible sea el correcto para el actor.
- **Un solo tenant**: los conteos por rol son observación, no veredicto de seguridad.
- Un valor alternativo por eje en el personalizador; **no** todo el catálogo.
- Las **24 capturas** en `~/Desktop/capturas-frontend-2026-10-13-actualizadas/` son **snapshots del
  estado actual**, no parejas antes-después: no acreditan fidelidad ni paridad con el Design System.
- Los errores de selector y de espera fueron **del harness**: **no** se infiere defecto de producto.
- Se trabajó sobre la copia de trabajo existente: **no** hay commit limpio de base.
- **Backend sin tocar**: sin cambios de código, schema ni credenciales, sin acceso a producción y
  **sin commit ni push**.
- **No** hay cierre de aceptación integral; las specs siguen **`in-progress`**.

> 📜 **Fuentes.** Resumen de la sesión:
> [`evidence/2026-10-13/session-summary.md`](./evidence/2026-10-13/session-summary.md) ·
> fuentes primarias inalteradas en
> [`evidence/2026-10-13/`](./evidence/2026-10-13/):
> [`family-route-sweep-orchestrator.json`](./evidence/2026-10-13/family-route-sweep-orchestrator.json) ·
> [`appearance-eight-axes-results.json`](./evidence/2026-10-13/appearance-eight-axes-results.json) ·
> [`frontend-fixes-verification.json`](./evidence/2026-10-13/frontend-fixes-verification.json) ·
> [`armory-responsive-results.json`](./evidence/2026-10-13/armory-responsive-results.json) ·
> [`organization-write-limited-results.json`](./evidence/2026-10-13/organization-write-limited-results.json) ·
> [`weapon-write-limited-results.json`](./evidence/2026-10-13/weapon-write-limited-results.json) ·
> [`prerequisite-checks.json`](./evidence/2026-10-13/prerequisite-checks.json) · celdas y conteos:
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json)
> (bloques `observations.session_2026_10_13`, `observations.family_route_sweep_2026_10_13`,
> `observations.worker_runtime_blocked_2026_10_13`, `observations.appearance_eight_axes_2026_10_13`,
> `observations.frontend_fixes_and_responsive_2026_10_13`,
> `observations.write_attempts_limited_2026_10_13`,
> `observations.prerequisites_blocked_2026_10_13`).

---

## 8. Apéndice del 2026-10-13 — recorrido CRUD por familias (A1)

> 🕯️ **Qué es.** Apéndice que incorpora al estado el recorrido **real** del 2026-10-13 con actor
> **A1** (`super_admin`) sobre cinco familias: armas, ejercicios, unidades organizativas, consumos de
> munición y el prerrequisito del consumo de arma. **No** reescribe §1 a §5, §6 ni §7: quedan como
> **snapshots históricos**, y sus conteos se conservan tal como estaban. El estado global sigue
> **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**. Toda escritura acreditada en las
> fuentes se identifica como clic de UI; ninguna se hizo por API.

### 8.1 Conteos vigentes

| Estado | Corte 2026-10-12 | Tras §6 | Tras §7 | Corte vigente (§8) | Δ |
|---|---:|---:|---:|---:|---:|
| `NOT_EXERCISED` | 1289 | 1284 | 1126 | **1115** | −11 |
| `PARTIAL` | 19 | 22 | 20 | **23** | +3 |
| `OBSERVED_OK` | 12 | 14 | 174 | **182** | +8 |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**12 celdas** cambiaron, todas de **A1**: **8** a `OBSERVED_OK` —siete desde `NOT_EXERCISED` y una
desde `PARTIAL`— y **4** a `PARTIAL` desde `NOT_EXERCISED`. Recuento obtenido recorriendo las 165
filas × 8 actores, **no** por agregación de conteos declarados. Denominador, filas, actores y
`total_cells` **sin cambio**; ninguna evidencia previa se borró.

> 🕯️ `expected_by_actor` sigue **`NOT_VERIFIED`** en las **1320** celdas: un **201**, un **200** o un
> **204** acreditan que la escritura se aceptó, **no** que el conjunto de visibles sea el correcto
> para el actor.

### 8.2 Celdas que cambian

| Fila (método + endpoint) | Actor | Antes | Ahora | Observado |
|---|---|---|---|---|
| `POST /armas/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Alta **201** por UI, `GET` **200** de verificación y baja propia **204** |
| `GET /armas/{id}/` | A1 | `NOT_EXERCISED` | `PARTIAL` | Path registrado; lecturas de verificación del harness |
| `PATCH /armas/{id}/` | A1 | `PARTIAL` | `OBSERVED_OK` | Superó el `PARTIAL` anterior: **200** de UI con estado HTTP registrado y `GET` **200** confirmatorio |
| `DELETE /armas/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Baja **204** por UI, `GET` **404**, **cero** remanentes |
| `POST /ejercicios/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Alta **201** por UI, `GET` **200** de verificación y baja propia **204** |
| `GET /ejercicios/{id}/` | A1 | `NOT_EXERCISED` | `PARTIAL` | Path registrado; lecturas de verificación del harness |
| `PATCH /ejercicios/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Edición **200** por UI sobre un campo, `GET` **200** confirmatorio |
| `DELETE /ejercicios/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Baja **204** por UI, `GET` **404**, **cero** filas hijas de consumo |
| `POST /organization-units/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Altas **201** de las unidades 13 y 15; el identificador 14 **no** se le atribuye |
| `GET /organization-units/{id}/` | A1 | `NOT_EXERCISED` | `PARTIAL` | Lectura **200** del harness y detalle de UI **sólo** en estado **404** |
| `DELETE /organization-units/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Bajas **204** de 13 y 15 con reconciliación por listado y por búsqueda en UI |
| `POST /consumos-municion/` | A1 | `NOT_EXERCISED` | `PARTIAL` | Dos intentos **500** y `GET` **200** con cero coincidencias: rechazo de servidor, nunca alta exitosa |

> 🕯️ Las filas `PUT` de las tres familias quedan `NOT_EXERCISED`, el `PATCH` de unidades conserva su
> `PARTIAL` previo y las filas de detalle, `PUT`, `PATCH` y `DELETE` de `/consumos-municion/{id}/`
> quedan `NOT_EXERCISED`: **no** hay registro con los marcadores de la corrida contra el cual operar.
> `PUT` y `PATCH` son filas distintas y ninguna se infiere de la otra.

### 8.3 Avances verificados

- **Alta, edición y baja de un arma por UI**: `POST` **201**, `PATCH` **200** con el modelo editado
  confirmado por `GET` **200** posterior, `DELETE` **204** desde la confirmación de detalle y `GET`
  **404**, con **cero** registros remanentes de esta corrida.
- **Alta, edición y baja de un ejercicio por UI**: `POST` **201** con `[CIA-A]` como unidad
  participante, `PATCH` **200** sobre un campo, `DELETE` **204** y `GET` **404**, **sin** filas hijas de
  consumo creadas en esta corrida.
- **Altas y bajas de unidades organizativas por UI**: las unidades **13** y **15** con `POST` **201** y
  `DELETE` **204**, reconciliadas por listado y por búsqueda en la UI.
- **Rechazo de servidor en el alta de munición**: dos `POST /api/consumos-municion/` **500** desde la
  UI, con `GET` **200** posterior y **cero** coincidencias de cada marcador. **Ningún** registro con
  esos marcadores llegó a crearse.
- **Reconciliación sin repetir escrituras**: el botón «Consultar estado real» leyó el estado del
  servidor en los dos casos y despejó la escritura incierta; los `GET` **no** repitieron ninguna
  escritura. Los dos `POST` son emisiones **distintas**, con marcadores y payloads distintos.
- **Trazabilidad de identificadores**: el alta de la unidad **15** se conserva **separada** del borrado
  con path `null` y estado `null` del artefacto de reintento; el identificador **14** devuelve **404**
  y **no** se le atribuye alta ni baja.

### 8.4 Lo que esta tanda abre o agrava

| Pendiente | Causa | Falta |
|---|---|---|
| **Alta de consumo de munición rechazada** | Dos `POST` por UI → **500** | Diagnóstico de backend (deuda **§8**). **Sin** causa establecida ni traza |
| **Relación de consumo de arma sin alta** | El selector del consumo requerido **no recibió ninguna opción** en el formulario de alta | Requiere un padre válido; el resto de la familia **no** se ejercitó y no se afirma que se resolvería con el alta de munición |
| **Edición de unidades no ejercitada** | El `PATCH` de unidades no se ejercitó en esta corrida | Ejercicio runtime con captura del estado HTTP de la escritura |
| **`PUT` de armas, ejercicios y unidades** | No ejercitado en ninguna de las tres familias | Ejercicio runtime por método, no por inferencia del `PATCH` |
| **Superficie de detalle de UI** | Las lecturas de detalle de armas y ejercicios son del harness; en organización la única lectura de detalle por UI ocurrió en **404** | Navegación acreditada a la ruta de detalle con estado **200** |
| **Aislamiento entre tenants** | Un solo tenant; no se proveyó un segundo | Entorno con segundo tenant |
| **Recuperación por correo** | Loopback SMTP sin listener | Prerrequisito del entorno |
| **Git: commit** | Sin commit por decisión del operador | **Decisión del operador** |

### 8.5 Reglas conservadoras aplicadas

| No promovido / No centrado | Motivo |
|---|---|
| **Causa del `500` de munición** | La respuesta **no** retuvo cuerpo ni traza: **no** se le atribuye serializer, campo ni excepción, y **no** se hereda el diagnóstico histórico de 2026-10-06, que es una observación **distinta** |
| **`PATCH` de organización** | Se conserva el `PARTIAL` previo: este recorrido **no** aporta una edición con estado HTTP registrado |
| **`PUT` en las tres familias** | Filas distintas: `PUT` no se infiere de `PATCH` ni al revés |
| **Detalle de armas y ejercicios** | Sus artefactos registran **sólo** `authenticated GET`: no hay lectura de detalle por UI que acreditar, ni siquiera en estado **404** |
| **Identificador 14** | `GET` **404** sin artefacto que lo mapee a un intento propio: **no** se le atribuye alta ni baja |
| **Alta de consumo de arma** | **No** hubo ninguna escritura: el selector quedó sólo con su marcador de posición y el envío deshabilitado |
| **Conteos de remanentes** | Se toman del `records_left_by_this_family` y del `child_consumption_rows_created` de cada artefacto; **no** se reconsultó el listado |

### 8.6 Límites de este apéndice

- **Un solo actor**, A1: ninguna celda de esta tanda acredita comportamiento de A2 a A8.
- **No** se certifica CRUD completo **por familia ni por actor**.
- Personas y PII quedaron **fuera** por política de la corrida; no hay nombres, RUT, correos ni
  cookies en la evidencia.
- §4 enumera los puntos de deuda backend **vigentes a su fecha** y queda como **snapshot**: el
  hallazgo del 2026-10-13 se registra aparte en
  [`../../bugs/backend-debt.md`](../../bugs/backend-debt.md) **§8** y no se cuenta dentro de sus §1 a §7.
- **Backend sin tocar**: sin cambios de código, schema, datos originales ni credenciales, sin acceso a
  producción y **sin commit ni push**.
- **No** se corrieron `tests` ni `build` y **no** se reclama estado de ellos.
- **No** hay cierre de aceptación integral: el estado global sigue **`NOT_VERIFIED`** y la conclusión
  de producto **`NO_CUMPLIDO`**.

> 📜 **Fuentes.** Resumen del recorrido:
> [`evidence/2026-10-13/crud-ui-families-summary.md`](./evidence/2026-10-13/crud-ui-families-summary.md)
> · fuentes primarias inalteradas en
> [`evidence/2026-10-13/`](./evidence/2026-10-13/), quince artefactos con copia verificada idéntica ·
> celdas y conteos:
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json) (bloque
> `observations.crud_ui_families_2026_10_13`) · deuda backend del **500**:
> [`../../bugs/backend-debt.md`](../../bugs/backend-debt.md) §8.

---

## 9. Apéndice del 2026-10-14 — cierre de Personas (A1)

> 🕯️ **Qué es.** Apéndice que incorpora al estado el **cierre de la familia Personas** del recorrido
> CRUD por UI: alta y edición observadas el **2026-10-13** y baja observada el **2026-10-14**, las tres
> por clic de UI con estado HTTP registrado. **No** reescribe §1 a §8: quedan como **snapshots
> históricos** y sus conteos se conservan tal como estaban. El estado global sigue **`NOT_VERIFIED`**
> y la conclusión de producto **`NO_CUMPLIDO`**. Ninguna escritura acreditada se hizo por API.

### 9.1 Conteos vigentes

| Estado | Corte 2026-10-12 | Tras §6 | Tras §7 | Tras §8 | Corte vigente (§9) | Δ |
|---|---:|---:|---:|---:|---:|---:|
| `NOT_EXERCISED` | 1289 | 1284 | 1126 | 1115 | **1112** | −3 |
| `PARTIAL` | 19 | 22 | 20 | 23 | **23** | — |
| `OBSERVED_OK` | 12 | 14 | 174 | 182 | **185** | +3 |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas | 165 OP / 1320 celdas | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**3 celdas** cambiaron, todas de **A1**: las tres de `NOT_EXERCISED` a `OBSERVED_OK`. Recuento obtenido
recorriendo las 165 filas × 8 actores, **no** por agregación de conteos declarados. Denominador, filas,
actores, `total_cells` y `expected_by_actor` **sin cambio**; ninguna evidencia previa se borró.

> 🕯️ `expected_by_actor` sigue **`NOT_VERIFIED`** en las **1320** celdas: un **201**, un **200** y un
> **204** acreditan que la escritura se aceptó, **no** que el conjunto de visibles sea el correcto
> para el actor.

### 9.2 Celdas que cambian

| Fila (método + endpoint) | Actor | Antes | Ahora | Observado |
|---|---|---|---|---|
| `POST /usuarios/crear-temporal/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Alta **201** por UI sobre el id **28**, con `GET` **200** de verificación y **cero** asignaciones |
| `PATCH /usuarios/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Edición **200** por UI con campos `grado` y `nombre`, y `GET` **200** confirmatorio |
| `DELETE /usuarios/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Baja **204** por UI desde la confirmación, `GET` **404** y **cero** filas de marcador en la UI |

> 🕯️ El alta observada es la de **persona temporal** (`OP-USR-012`), **no** el alta genérica
> `POST /usuarios/` (`OP-USR-002`), que sigue `NOT_EXERCISED`. `PUT /usuarios/{id}/` (`OP-USR-004`)
> tampoco se ejercitó y **no** se infiere del `PATCH`. `GET /usuarios/{id}/` (`OP-USR-003`) **no se
> mueve**: su `OBSERVED_OK` previo se sostiene en la ficha propia abierta por UI en `/cuenta`, y los
> `GET` de detalle del id **28** son lecturas del harness, no navegación a la ruta de detalle de UI de
> otra persona.

### 9.3 Avances verificados

- **Alta, edición y baja de una persona temporal por UI**: `POST` **201** a `/api/usuarios/crear-temporal/`,
  `PATCH` **200** con el `GET` **200** confirmatorio, y `DELETE` **204** desde el diálogo «Confirmar
  baja de usuario» con `GET` **404** posterior y **cero** filas de coincidencia exacta del marcador en
  `/personas`.
- **Trazabilidad de la baja**: la confirmación de UI se verificó contra el marcador del registro antes
  del clic, el **204** se observó como respuesta al evento de UI, y el `404` de detalle más el cero de
  filas en el listado cierran el ciclo sobre un recurso creado por la propia corrida.
- **Sin efectos colaterales de identidad**: el registro se creó y se dio de baja sin asignaciones
  asociadas; no se tocó ninguna otra persona de la colección.
- **Origen por UI declarado**: las tres escrituras son clics de UI según el campo `source` de cada
  evento en la fuente; las reconciliaciones son `GET` autenticados del harness.

### 9.4 Lo que esta tanda abre o agrava

| Pendiente | Causa | Falta |
|---|---|---|
| **Alta genérica de usuario** | La corrida creó una persona temporal; `POST /usuarios/` no se ejercitó | Ejercicio runtime sobre `OP-USR-002` |
| **`PUT /usuarios/{id}/`** | No ejercitado | Ejercicio runtime por método; no se infiere del `PATCH` |
| **Filas de asignación** (`OP-USR-007` a `OP-USR-011`) | El registro no tenía asignaciones y no hubo ninguna escritura de asignación | Recorrido propio de asignaciones y asignación principal |
| **Superficie de detalle de UI de otra persona** | Los `GET` de detalle observados son del harness; no hubo navegación a la ruta de detalle de UI | Navegación acreditada con estado **200** |
| **Actores A2 a A8** | Un solo actor en la familia | Ejercicio runtime por actor |
| **Aislamiento entre tenants** | Un solo tenant | Entorno con segundo tenant |

### 9.5 Reglas conservadoras aplicadas

| No promovido / No centrado | Motivo |
|---|---|
| **`POST /usuarios/` genérico** | Fila y contrato distintos del alta de persona temporal observada |
| **`PUT`** | Filas distintas: `PUT` no se infiere de `PATCH` ni al revés |
| **`OP-USR-003`** | No se mueve: el `OBSERVED_OK` previo se sostiene en evidencia propia y ajena a este recorrido |
| **Borrado físico** | La fila declara «no asumir borrado físico» por el efecto real `disable_users`: el **404** y el cero de filas en UI **no** acreditan borrado en base de datos |
| **Historial de la corrida** | Los artefactos del **2026-10-13** y los del **2026-10-14** coexisten con su fecha; el cierre del 14 no reescribe el corte del 13, y el extracto del 13 se conserva íntegro con `superseded_by` |
| **Setbacks de la corrida del 13** | Quedan registrados en las fuentes como incidentes de harness; **no** se convierten en conclusiones de producto ni se les atribuye defecto |

### 9.6 Límites de este apéndice

- **Un solo actor**, A1: ninguna celda de esta tanda acredita comportamiento de A2 a A8.
- **No** se certifica CRUD completo **por familia ni por actor**.
- El `DELETE` observado **no** acredita borrado físico, por el efecto real declarado de la fila.
- **Backend sin tocar**: sin cambios de código, schema, datos originales ni credenciales, sin acceso a
  producción y **sin commit ni push**.
- **No** se corrieron `tests` ni `build` y **no** se reclama estado de ellos.
- **No** hay cierre de aceptación integral: el estado global sigue **`NOT_VERIFIED`** y la conclusión
  de producto **`NO_CUMPLIDO`**.

> 📜 **Fuentes.** Resumen del recorrido:
> [`evidence/2026-10-14/persons-summary.md`](./evidence/2026-10-14/persons-summary.md) · fuentes
> primarias saneadas y su manifiesto de procedencia en
> [`evidence/2026-10-14/`](./evidence/2026-10-14/) (tres artefactos JSON y el manifiesto, con `sha256`
> y copia idéntica verificada con `cmp`) · celdas y conteos:
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json) (bloque
> `observations.persons_completion_2026_10_14`). Sin secretos, cookies, RUT, correos ni nombres de
> personas: sólo alias, identificador de registro propio, marcador de turno, rutas y estados HTTP.

---

## 10. Apéndice del 2026-10-14 — detalle de UI y `PUT` (A1)

> 🕯️ **Qué es.** Apéndice que incorpora al estado el recorrido complementario del **2026-10-14** con
> actor **A1** sobre unidades organizativas, armas y ejercicios. Acredita dos cosas que quedaban sin
> cobertura observada: la **navegación a la ruta de detalle desde la UI** y el **método `PUT`** por UI.
> **No** reescribe §1 a §9: quedan como **snapshots históricos** y sus conteos se conservan tal como
> estaban. El estado global sigue **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**.

### 10.1 Conteos vigentes

| Estado | Corte 2026-10-12 | Tras §6 | Tras §7 | Tras §8 | Tras §9 | Corte vigente (§10) | Δ |
|---|---:|---:|---:|---:|---:|---:|---:|
| `NOT_EXERCISED` | 1289 | 1284 | 1126 | 1115 | 1112 | **1109** | −3 |
| `PARTIAL` | 19 | 22 | 20 | 23 | 23 | **19** | −4 |
| `OBSERVED_OK` | 12 | 14 | 174 | 182 | 185 | **192** | +7 |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas | 165 OP / 1320 celdas | 165 OP / 1320 celdas | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**7 celdas** cambiaron, todas de **A1**: **4** de `PARTIAL` a `OBSERVED_OK` y **3** de `NOT_EXERCISED`
a `OBSERVED_OK`. Recuento obtenido recorriendo las 165 filas × 8 actores, **no** por agregación de
conteos declarados. Denominador, filas, actores, `total_cells` y `expected_by_actor` **sin cambio**;
ninguna evidencia previa se borró.

> 🕯️ `expected_by_actor` sigue **`NOT_VERIFIED`** en las **1320** celdas: un **201**, un **200** o un
> **204** acreditan que la escritura se aceptó, **no** que el conjunto de visibles sea el correcto
> para el actor.

### 10.2 Celdas que cambian

| Fila (método + endpoint) | Actor | Antes | Ahora | Observado |
|---|---|---|---|---|
| `GET /organization-units/{id}/` | A1 | `PARTIAL` | `OBSERVED_OK` | Detalle por UI con **200**: ruta `/organizacion/unidades/16` |
| `PUT /organization-units/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | `PUT` **200** por UI y `GET` **200** confirmatorio |
| `PATCH /organization-units/{id}/` | A1 | `PARTIAL` | `OBSERVED_OK` | `PATCH` **200** por UI con estado HTTP registrado y `GET` **200** confirmatorio |
| `GET /armas/{id}/` | A1 | `PARTIAL` | `OBSERVED_OK` | Detalle por UI con **200**: ruta `/almacen/armas/5` |
| `PUT /armas/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | `PUT` **200** por UI y `GET` **200** confirmatorio |
| `GET /ejercicios/{id}/` | A1 | `PARTIAL` | `OBSERVED_OK` | Detalle por UI con **200**: ruta `/tiro/ejercicios/6` |
| `PUT /ejercicios/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | `PUT` **200** por UI y `GET` **200** confirmatorio |

> 🕯️ Las tres filas de detalle pasan de `PARTIAL` a `OBSERVED_OK` por una razón concreta y ya
> pendiente desde §8: la fuente **distingue** el `GET` de navegación de UI del `GET` de verificación
> del harness, y registra la apertura de la ruta de detalle con estado **200**. El `GET` de harness por
> sí solo **no** habría superado el `PARTIAL`, y `PUT` **no** se infiere de ningún `PATCH`: el `PUT`
> se ejercitó por UI con su propio estado HTTP registrado.

### 10.3 Avances verificados

- **Detalle de UI en las tres familias**: apertura de la ruta de detalle desde la fila propia con
  **200**, para las unidades organizativas, las armas y los ejercicios.
- **`PUT` por UI en las tres familias**: **200** en cada una, con el campo modificado verificado por
  lectura posterior y el marcador de turno actualizado.
- **`PATCH` de unidades con estado HTTP registrado**: supera el `PARTIAL` que §8 conservó porque el
  artefacto del 2026-10-13 no consignaba el estado de la escritura.
- **Prefill del formulario de edición verificado**: los valores propios coinciden con los cargados en
  el formulario, por comparación de `inputValue` y **no** por inferencia desde el `GET` de harness.
- **Limpieza trazable**: los tres registros descartables —unidad **16**, arma **5**, ejercicio **6**—
  se dieron de baja por UI con **204** y sus `GET` de detalle posteriores devolvieron **404**: **cero**
  remanentes propios por detalle.

### 10.4 Lo que esta tanda abre o agrava

| Pendiente | Causa | Falta |
|---|---|---|
| **Alta de consumo de munición rechazada** | Los `POST` por UI devolvieron **500** el 2026-10-13 | Diagnóstico de backend, ya registrado en deuda **§8**. Sin cambios en esta tanda |
| **Relación de consumo de arma sin alta** | El selector requerido quedó vacío y el envío deshabilitado | Prerrequisito válido en el entorno |
| **Altas genéricas de las tres familias** | Los `POST` **201** de esta corrida fueron prerrequisitos descartables, no ejercicio de esas filas | Ejercicio runtime específico por fila |
| **Actores A2 a A8** | Un solo actor | Ejercicio runtime por actor |
| **Aislamiento entre tenants** | Un solo tenant | Entorno con segundo tenant |

### 10.5 Reglas conservadoras aplicadas

| No promovido / No centrado | Motivo |
|---|---|
| **Celdas ya en `OBSERVED_OK`** | Altas, `PATCH` de armas y ejercicios y bajas de las tres familias no se tocan: los eventos de esta corrida fueron prerrequisitos o limpieza |
| **Actores A2 a A8** | Ninguna celda de esta corrida los cubre |
| **`PUT` a partir de `PATCH`** | `PUT` se ejercitó por UI con estado HTTP propio; no hay inferencia entre métodos |
| **Detalle de UI a partir del `GET` de harness** | Sólo la navegación de UI con **200** promueve la fila; el `GET` de harness queda declarado por separado |
| **Borrado físico** | Un **204** con `GET` **404** **no** acredita borrado en base de datos, y así lo declara la fuente |
| **Historia de §8 y §9** | El `PATCH` de compensación de organización con estado `null` y los cortes previos se conservan sin reescribir |

### 10.6 Límites de este apéndice

- **Un solo actor**, A1: ninguna celda de esta tanda acredita comportamiento de A2 a A8.
- **No** se certifica CRUD completo **por familia ni por actor**.
- **Backend sin tocar**: sin cambios de código, schema, datos originales ni credenciales, sin acceso a
  producción, **sin commit ni push** y sin reinicio de los servidores vivos de la corrida anterior.
- **No** se corrieron `tests` ni `build` y **no** se reclama estado de ellos.
- **No** hay cierre de aceptación integral: el estado global sigue **`NOT_VERIFIED`** y la conclusión
  de producto **`NO_CUMPLIDO`**.

> 📜 **Fuentes.** Resumen del recorrido:
> [`evidence/2026-10-14/remaining-crud-ui-summary.md`](./evidence/2026-10-14/remaining-crud-ui-summary.md)
> · fuente primaria **idéntica** y manifiesto de procedencia en
> [`evidence/2026-10-14/`](./evidence/2026-10-14/) · celdas y conteos:
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json) (bloque
> `observations.remaining_crud_ui_2026_10_14`). El recorrido de Personas del mismo día, conservado sin
> alteración, está en [§9](#9-apéndice-del-2026-10-14--cierre-de-personas-a1). Sin secretos, cookies,
> RUT, correos ni nombres de personas.

---

## 11. Apéndice del 2026-10-14 — `PUT` de persona y catálogo de calibres (A1)

> 🕯️ **Qué es.** Apéndice que incorpora al estado el recorrido del **2026-10-14** con actor **A1** en
> dos frentes: el **método `PUT` de persona** y las **cuatro operaciones de escritura del catálogo de
> calibres**. **No** reescribe §1 a §10: quedan como **snapshots históricos** y sus conteos se
> conservan tal como estaban. El estado global sigue **`NOT_VERIFIED`** y la conclusión de producto
> **`NO_CUMPLIDO`**.

### 11.1 Conteos vigentes

| Estado | Corte 2026-10-12 | Tras §6 | Tras §7 | Tras §8 | Tras §9 | Tras §10 | Corte vigente (§11) | Δ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `NOT_EXERCISED` | 1289 | 1284 | 1126 | 1115 | 1112 | 1109 | **1103** | −6 |
| `PARTIAL` | 19 | 22 | 20 | 23 | 23 | 19 | **19** | — |
| `OBSERVED_OK` | 12 | 14 | 174 | 182 | 185 | 192 | **198** | +6 |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas | 165 OP / 1320 celdas | 165 OP / 1320 celdas | 165 OP / 1320 celdas | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**6 celdas** cambiaron, todas de **A1**, las seis de `NOT_EXERCISED` a `OBSERVED_OK`. Una séptima fila
—`GET /usuarios/{id}/`— **conservó su estado** y sólo acumula evidencia puntual. Recuento obtenido
recorriendo las 165 filas × 8 actores, **no** por agregación de conteos declarados. Denominador, filas,
actores, `total_cells` y `expected_by_actor` **sin cambio**; ninguna evidencia previa se borró.

> 🕯️ `expected_by_actor` sigue **`NOT_VERIFIED`** en las **1320** celdas: un **201**, un **200** o un
> **204** acreditan que la escritura se aceptó, **no** que el conjunto de visibles sea el correcto
> para el actor.

### 11.2 Celdas que cambian

| Fila (método + endpoint) | Actor | Antes | Ahora | Observado |
|---|---|---|---|---|
| `PUT /usuarios/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | `PUT` **200** por UI sobre un registro propio y `GET` **200** confirmatorio |
| `POST /calibres/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Alta **201** por UI de un calibre descartable e inactivo |
| `GET /calibres/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` *(acotado)* | Lectura **200** desde la UI con prefill coincidente; **sin** ruta de detalle independiente |
| `PUT /calibres/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | `PUT` **200** por UI y `GET` **200** confirmatorio |
| `PATCH /calibres/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | `PATCH` **200** por UI y `GET` **200** confirmatorio |
| `DELETE /calibres/{id}/` | A1 | `NOT_EXERCISED` | `OBSERVED_OK` | Baja **204** por UI y `GET` **404** |

> 🕯️ **Límite declarado de `GET /calibres/{id}/`.** La lectura se observó al abrir el editor
> «Editar calibre» desde la fila propia en `SCREEN-CALIBERS`; **no** hubo navegación a una ruta de
> detalle independiente, y así lo consigna la fuente. La promoción es **acotada** porque el contrato
> de la fila no exige ruta propia: su única pantalla es `SCREEN-CALIBERS`, la misma del editor y sin
> pantalla de detalle separada en el corpus, y el criterio `AC-OP-CAL-003` versa sobre la **forma de
> la respuesta** (`id_calibre`, `code`, `nombre`, `is_active`). La forma queda atestiguada: `code` y
> `nombre` por comparación de `inputValue` en la UI, `is_active` por el `GET` de harness declarado
> como tal. **No** se infiere ninguna navegación que no se observó.

### 11.3 Avances verificados

- **`PUT` de persona por UI**: **200** con el campo modificado y lectura posterior **200** que
  confirma el valor, sobre un registro descartable propio.
- **Alta de calibre por UI**: **201** de un calibre descartable e **inactivo**.
- **`PATCH` y `PUT` de calibre por UI**: **200** en ambos, cada uno con lectura posterior **200**; el
  registro permaneció inactivo.
- **Baja de calibre por UI**: **204** desde el diálogo de confirmación y **404** en la lectura de
  detalle posterior. **Ningún calibre canónico fue modificado** y **ningún arma ni consumo quedó
  vinculado** al calibre descartable.
- **Limpieza trazable**: los dos registros propios —persona **29** y calibre **7**— se dieron de baja
  por UI con **204** y sus lecturas de detalle posteriores devolvieron **404**: **cero** remanentes
  propios por detalle.
- **Alcance ampliado sin promoción**: la lectura de detalle de persona suma navegación de UI a
  `/personas/29` con **200** y prefill verificado, sobre una celda que ya estaba `OBSERVED_OK`.

### 11.4 Lo que esta tanda abre o agrava

| Pendiente | Causa | Falta |
|---|---|---|
| **Alta genérica de usuario** | El flujo formal crea una cuenta autenticable con contraseña temporal y asignación inicial de rol y unidad | Ejercicio runtime del `POST /usuarios/` con una cuenta descartable y su credencial gestionada |
| **Actores A2 a A8** | Un solo actor | Ejercicio runtime por actor |
| **Catálogo de calibres bajo `manage_calibre` sin `super_admin`** | Restricción documentada de la familia; no se ejercitó | Recorrido con un actor no `super_admin` |
| **Aislamiento entre tenants** | Un solo tenant | Entorno con segundo tenant |

### 11.5 Reglas conservadoras aplicadas

| No promovido / No centrado | Motivo |
|---|---|
| **`POST /usuarios/` genérico** | El flujo crea una cuenta autenticable: **exclusión de alcance**, no restricción de privacidad. El alta de persona temporal es otra fila y otro endpoint |
| **Detalle de calibre** | Se promueve **acotado** a la superficie del editor; no se afirma navegación a ruta de detalle independiente, porque no se observó |
| **`GET /usuarios/{id}/`** | La celda **no cambia de estado**: se le suma alcance, no una promoción |
| **Celdas ya `OBSERVED_OK`** | El alta temporal de persona y su baja son filas acreditadas; los eventos de esta corrida fueron prerrequisito y limpieza |
| **Borrado físico** | Un **204** con `GET` **404** **no** acredita borrado en base de datos |
| **Calibres canónicos y vínculos** | No se modificaron calibres canónicos ni se dejaron armas o consumos vinculados al registro descartable |

### 11.6 Límites de este apéndice

- **Un solo actor**, A1: ninguna celda de esta tanda acredita comportamiento de A2 a A8.
- **No** se certifica CRUD completo **por familia ni por actor**; el alta genérica de persona sigue
  fuera de alcance.
- **Backend sin tocar**: sin cambios de código, schema, datos originales ni credenciales, sin acceso a
  producción, **sin commit ni push** y sin reinicio de servidores.
- **No** se corrieron `tests` ni `build` y **no** se reclama estado de ellos.
- **No** hay cierre de aceptación integral: el estado global sigue **`NOT_VERIFIED`** y la conclusión
  de producto **`NO_CUMPLIDO`**.

> 📜 **Fuentes.** Resumen del recorrido:
> [`evidence/2026-10-14/persons-calibres-ui-summary.md`](./evidence/2026-10-14/persons-calibres-ui-summary.md)
> · fuente primaria **idéntica** y manifiesto de procedencia en
> [`evidence/2026-10-14/`](./evidence/2026-10-14/) · celdas y conteos:
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json) (bloque
> `observations.persons_calibres_2026_10_14`). Sin secretos, cookies, RUT, correos ni nombres de
> personas.

---

## 12. Apéndice del 2026-10-14 — ejecución del plan maestro (calidad y performance)

> 🕯️ **Qué es.** Apéndice breve que registra la ejecución del plan maestro
> [`completion-plan-2026-10-14.md`](./completion-plan-2026-10-14.md) en sus tramos de **calidad** y
> **performance**, con sus límites. **No reescribe** §1 a §11: quedan como **snapshots históricos**.
> El estado global sigue **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**.

### 12.1 Conteos: esta corrida no los mueve

| Estado | Corte vigente (§11) | Tras §12 |
|---|---:|---:|
| `OBSERVED_OK` | **198** | **198** |
| `PARTIAL` | **19** | **19** |
| `NOT_EXERCISED` | **1103** | **1103** |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas |

**Ninguna fila cambió de estado** y `expected_by_actor` sigue **`NOT_VERIFIED`** en las **1320**
celdas. Motivo: el alias de actor **A1 NO está verificado** —el propio artefacto de runtime lo
declara y `actorCellsPromoted` es `false`—, y un recorrido de ejecución **no** promueve celdas por
su cuenta. Promover aquí habría sido acreditar comportamiento por un alias no verificado.

### 12.2 Calidad — correcciones acotadas verificadas

| Tramo | Corrección | Verificación |
|---|---|---|
| Modal compartido | Foco del diálogo: `activeElement === modal` en ambas ramas, tras confirmar que el primer `Shift+Tab` sacaba el foco porque el contenedor `DIV` con `tabindex="-1"` no era ni primero ni último | Regresión que **falló antes** (salida 1) y **pasó después** (9 pruebas, salida 0; `typecheck` salida 0). Runtime posterior: foco inicial en el `DIV`; tras `Shift+Tab` y `Tab`, foco en `BUTTON` **dentro**; `Escape` cerró; **cero** escrituras de negocio observadas |
| Identidad | Reconciliación del contexto primario tras editar identidad: asignaciones propias, posiciones y holders | 18 pruebas y `typecheck` con salida 0; recorrido del orquestador con 127 pruebas en 4 archivos y `typecheck` con salida 0; re-revisión estática de seguridad: **resuelto** |

**Fidelidad al Design System, acotada y en dos capas.** Del modal se compararon por estilo calculado,
en el estado abierto **asentado**: `padding` `16px 20px`, duración `0,2 s`, `margin` `30px auto`
resuelto y sombra equivalente; el `transform` calculado observado es **`none`**. Los literales
`translateY(-30px)` de entrada y la trayectoria de la transición **no** se midieron.

> 🕯️ **Límite de calidad.** La **paridad visual total no está aprobada** por los auditores:
> `visualParity: NOT_VERIFIED`. No se midieron la trayectoria de la transición, el desplazamiento de
> entrada oculto, el movimiento reducido ni otros estados de viewport. La coincidencia observada es
> de estilos calculados en el estado asentado, **no** de paridad integral. Tampoco se afirma paridad
> total de seguridad ni de UX.

> 🕯️ **Apariencia, acreditado y pendiente.** Se conserva lo acreditado en corridas previas: los
> **ocho** ejes con un `PUT` **200** cada uno y `GET` confirmatorio, persistencia que sobrevive al
> **login** por interfaz, aislamiento entre **A7 → A8** y restablecimiento con `DELETE` **204**
> ([`evidence/2026-10-13/appearance-eight-axes-results.json`](./evidence/2026-10-13/appearance-eight-axes-results.json)
> y [§7](#7-apéndice-del-2026-10-13--sesión-de-frontend-autónomo-segunda-tandas)). **Pendiente y sin
> acreditar:** el recorrido de **todo** el catálogo de opciones de cada eje según la biblioteca del
> Design System, y la paridad de render en los estados completos. La corrida del 2026-10-14 **no**
> repite promociones ya acreditadas.

### 12.3 Performance — medición y corrección, ambas acotadas

| Dato | Valor |
|---|---|
| Baseline | Navegación de lectura en `DEV`, **2** recorridos de **7** pasos, caché caliente, sin *throttling* de CPU ni de red |
| Sesión reutilizada | **Alias A1 NO acreditado** por el propio artefacto |
| Compilación estática de partida | **15** vistas, **1** chunk, entry de **856 249 bytes** |
| Corrección | Carga diferida de las **15** vistas, preservando nombres, `meta` y rutas |
| Condición de reproducibilidad | *Lockfile*, configuración, Node y pnpm idénticos; SHA-256 del `routes.ts` normalizado igual antes y después |
| Entry | 856 249 → **153 318 bytes** (**−82,1 %**) |
| Entry + preloads | −70,3 % en bytes; −60,6 % en gzip |
| Total JS | +11 810 bytes; **gzip +22 807** |
| Chunks | 1 → **32** |
| Comprobaciones | `build` antes y después, `typecheck` y **146** pruebas en 6 archivos dirigidos, todo con salida 0. La revisión del orquestador (**127** pruebas en 4 archivos y `typecheck`, salida 0) es **anterior** a la corrección de foco del diálogo: **no** cubre los últimos cambios |

> 🕯️ **Límite de performance.** La mejora es **de la entrada, no del total**: el total gzip
> **aumenta**. Los tamaños redondeados que muestra Vite y los conteos gzip con zlib nivel 6 son
> **métodos distintos y no se mezclan**. **No** se midieron Core Web Vitals, tiempo de red real ni
> rendimiento de campo; falta el conjunto de datos representativo y falta la medición final bajo
> condiciones comparables. **No hay verificación de performance.**

### 12.4 Lo que este apéndice abre o agrava

| Pendiente | Causa | Falta |
|---|---|---|
| **Medición final de performance** | Falta el conjunto de datos representativo | Medición posterior a la optimización bajo las mismas condiciones, con su resultado anotado |
| **Revocación de escrituras propias** tras editar identidad | Sin ejercicio de escrituras en runtime | Verificación runtime del efecto de la reconciliación |
| **Paridad visual total al DS** | No aprobada por los auditores | Medición de trayectoria, desplazamiento de entrada oculto, movimiento reducido y otros estados |
| **Rol existente aceptado sin límites** | Hallazgo de seguridad de severidad **ALTA**: un usuario operativo con permisos `create`/`update` de usuarios **podría** otorgarse `super_admin` | **Dependencia de backend**: **inferencia de fuente estática** (`apipoligono/views.py:188-199` y `:269-393`; `apps/authorization/permissions.py:111-117`), **sin** reproducción ni runtime. Se reporta; **no** se corrige en cliente ni se propone arreglo de backend |
| **Catálogo completo de la apariencia y paridad de render** | Lo acreditado (ocho ejes, aislamiento, reset) ya consta; falta el resto | Recorrido de **todas** las opciones de cada eje del Design System y paridad en estados completos |
| **Mapa focalizado de capacidades** | Sigue **en progreso** | Cierre de `T1`; sus falsos positivos fueron descartados y no se implementó nada a partir de ellos |
| **Paquete de entrada del personalizador** | Import estático en `App.vue`, fuera del alcance del cambio | Fuera del alcance de esta corrida |

### 12.5 Límites de este apéndice

- **No** hay cierre de aceptación integral: el estado global sigue **`NOT_VERIFIED`** y la
  conclusión de producto **`NO_CUMPLIDO`**.
- **Ninguna fila promovida**, ningún conteo alterado, `expected_by_actor` sin cambio en las **1320**.
- **Backend sin tocar**: sin cambios de código, esquema, datos, credenciales ni dependencias, sin
  acceso a producción, **sin commit ni push** y **sin** reinicio de servidores.
- **Sin** registros sintéticos y **sin** envío del formulario de edición existente en las tandas de
  sólo lectura; la verificación del modal se hizo sobre el editor de organización abierto **sin**
  enviar. **Corrección de alcance:** la tanda de **§12.6** sí creó **una** cuenta descartable por el
  alta formal y la dio de baja con barrido en **0**; esta viñeta describe las tandas anteriores.
- Este apéndice **no** reescribe snapshots ni revocaciones históricas: los gates revocados se
  conservan tal como están y **no** se restauran.
- En esta edición **no** se ejecutaron pruebas, compilaciones, navegador ni servidor: **no** se
  afirma ningún resultado de ejecución propio.

> 📜 **Fuentes.** Resumen de la ejecución:
> [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md) ·
> fuentes primarias byte a byte idénticas y manifiesto de procedencia en
> [`evidence/2026-10-14/`](./evidence/2026-10-14/):
> [`performance-baseline.json`](./evidence/2026-10-14/performance-baseline.json),
> [`router-splitting-results.json`](./evidence/2026-10-14/router-splitting-results.json),
> [`modal-router-runtime.json`](./evidence/2026-10-14/modal-router-runtime.json) y
> [`modal-focus-fix.json`](./evidence/2026-10-14/modal-focus-fix.json) · estado por tarea:
> [`completion-plan-2026-10-14.md`](./completion-plan-2026-10-14.md) §Tareas · celdas y conteos sin
> cambio: [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json).
> Sin secretos, cookies, RUT, correos ni nombres de personas.

---

### 12.6 Verificaciones posteriores del mismo día

Segunda tanda del **2026-10-14**, con el mismo actor de rol alto y **sin promover ninguna fila**
(alias por actor **`NOT_VERIFIED`** en todas ellas). Detalle en
[`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md) §5 ter y
§5 quater.

| Verificación | Resultado observado | Límite que conserva |
|---|---|---|
| **Previsualización de eliminación con migración** (T3/AC-4) | `GET …/previsualizar-eliminacion/` **200**; los **8/8** contadores de destino presentes y coincidentes con `MIGRATION_COUNT_FIELDS`; confirmación **deshabilitada** sin destino y **habilitada** con destino válido; **cero** mutaciones | La otra mitad de `AC-4` —refrescar sólo tras éxito confirmado— **no** se ejercitó: exigía ejecutar la eliminación |
| **Apariencia** (T8), sólo lectura | La apariencia se lee del **backend** (`GET …/design-system/` **200** con las ocho claves) y **no** de almacenamiento del navegador: **cero** claves de apariencia; catálogos por eje medidos —`accent` 27, `bg` 26, `font` 9, `radius` 3, `iconfam` 7, `ambient` 8, `ambcolor` 7 y `theme` 2— coincidentes con la biblioteca externa del Design System | Actor de rol **tirador**; aislamiento entre cuentas ya acreditado el 13-oct **no** se repite; **no** se afirma paridad visual |
| **Autorización** (T5), sólo lectura | Rutas de roles, scopes, catálogo de permisos, matriz por rol y matriz por puesto con `GET` **200** y encabezado visible; `overrides` en contenedor **neutral**: enlace ausente y **sin** request — falla cerrado, **no** es `403` | Conteos del DOM en el momento de la observación; el `GET` de `overrides` **no** se observó; el bypass de `super_admin` **no** se ejerció |
| **Tiro** (T6), sólo lectura | Las **cinco** pestañas contractuales de la ficha de lección presentes; control de captura **habilitado** porque la elegibilidad devolvió **2** tiradores y **2** armas reales; **cero** mutaciones | La rama **sin** elegibles **no** se ejercitó: el conjunto de datos no la ofrece. **Sin** `403`; el único no-200 es un `500`. Ver deuda backend **§9** |
| **Alta formal y asignaciones** (T4) | `POST /api/usuarios/` **201** —distinto del alta temporal—; desactivar principal **200**; agregar secundaria **201**; quitar secundaria **200**; baja `DELETE` **204**; limpieza lateral de posiciones y unidad **204**; `GET` de la cuenta **200 → 404** y barrido propio en **0** | Con rol **no** privilegiado; **sin** leer ni persistir credenciales y **sin** iniciar sesión con la cuenta creada. **No** ejercitado: cambio y reinicio de contraseña, desbloqueo, holders y `PUT`/`PATCH` de la asignación principal. **Sin** verificación runtime del residuo de `Person` (deuda backend **§10**) |

> 🕯️ **Conteos sin cambio.** Las cinco verificaciones **no** promueven celdas: la matriz sigue con
> **198 `OBSERVED_OK`**, **19 `PARTIAL`** y **1103 `NOT_EXERCISED`** sobre **1320**, con
> `expected_by_actor` en `NOT_VERIFIED` y el estado global en `NOT_VERIFIED` / `NO_CUMPLIDO`. El plan
> maestro permanece **`in-progress`** y su bloque de cierre, **pendiente**.

---

### 12.7 Acreditación del alias A1 y bordes promovidos (apariencia, unidad y recintos)

> 🕯️ **Qué es.** Tanda posterior del **2026-10-14** y, a diferencia de §12.6, **sí promueve celdas**:
> acredita el alias **A1** por correspondencia privada y ejercita por **UI real** sus bordes
> pendientes en apariencia, eliminación de unidad con migración y recintos, sobre registros
> descartables propios. Detalle en
> [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md) §5 quinquies
> y en `observations.a1_borders_2026_10_14` de
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json).

**Acreditación del alias.** `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y
`GET /api/auth/context/` **200** con rol activo **`super_admin`** —asignación primaria sin scope y
secundaria `tirador` con scope—, correspondiente al registro privado de A1; **sin** cookies
fabricadas. `expected_by_actor` **no** cambia.

| Celda (OP) | Método y ruta | Antes → después | Observación |
|---|---|---|---|
| OP-PRF-003 | `GET /me/preferences/appearance/design-system/` | `NOT_EXERCISED` → `OBSERVED_OK` | **200** por UI con las ocho claves `ds_*` |
| OP-PRF-004 | `PUT` ídem | `NOT_EXERCISED` → `OBSERVED_OK` | **200** al cambiar el eje `accent`; `GET` confirmatorio **200** con `ds_accent=violet` |
| OP-PRF-005 | `DELETE` ídem | `NOT_EXERCISED` → `OBSERVED_OK` | **204** desde «Restablecer valores por defecto»; `GET` posterior **200** en los defaults; cuatro ejes restaurados al estado previo |
| OP-UNT-007 | `GET /organization-units/{id}/previsualizar-eliminacion/` | `NOT_EXERCISED` → `OBSERVED_OK` | **200** con **8/8** contadores de destino, todos en 0 |
| OP-UNT-008 | `POST /organization-units/{id}/eliminar-con-migracion/` | `NOT_EXERCISED` → `OBSERVED_OK` | **200**; refresco **sólo tras** la respuesta (cero previo); `GET` de ficha posterior **404** |
| OP-RCT-002 | `POST /recintos/` | `NOT_EXERCISED` → `OBSERVED_OK` | **201** (recinto descartable propio) |
| OP-RCT-004 | `PUT /recintos/{id}/` | `NOT_EXERCISED` → `OBSERVED_OK` | **200** |
| OP-RCT-006 | `DELETE /recintos/{id}/` | `NOT_EXERCISED` → `OBSERVED_OK` | **204**; `GET` de detalle posterior **404** |

| Conteo | Corte vigente (§12.6) | Tras §12.7 |
|---|---:|---:|
| `OBSERVED_OK` | 198 | **206** |
| `PARTIAL` | 19 | **19** |
| `NOT_EXERCISED` | 1103 | **1095** |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas |

> 🕯️ **Lo que la corrida no mueve y sus límites.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las
> **1320** celdas y el estado global sigue **`NOT_VERIFIED` / `NO_CUMPLIDO`**. **Ninguna otra fila se
> movió**: el recuento por recorrido de las **165 × 8** da **206 / 19 / 1095**. **No** promovidas:
> `OP-PRF-002` (contrato legacy de apariencia que la UI **no** ofrece; **0** requests) y `OP-RCT-003`
> (sólo el `404` posterior a la baja; ninguna lectura **200** de detalle por UI), ambas
> `NOT_EXERCISED`. **No** verificada la migración con contadores **> 0** (todos eran 0); el
> `204`/`404` **no** acreditan borrado físico en base. Limpieza: barrido final **0** unidades y **0**
> recintos propios. Sólo A1 y registros descartables propios; **sin** tocar RBAC, backend, base de
> datos, dependencias ni commits.

### 12.8 Acreditación del alias A2 — familias núcleo por UI (promueve 44 celdas)

> 🕯️ **Qué es.** Segunda tanda del **2026-10-14** que **sí promueve celdas**, posterior a §12.7:
> acredita el alias **A2** por correspondencia privada y ejercita por **UI real** las familias núcleo
> pendientes de A2, sobre registros descartables propios. Detalle en
> [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md) §5 sexies y
> en `observations.a2_core_families_2026_10_14` de
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json).

**Acreditación del alias.** `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y
`GET /api/auth/context/` **200** con rol activo **`tenant_admin`** —asignación primaria sin scope y
secundaria `tirador` con scope—, correspondiente al registro privado de A2; **sin** cookies
fabricadas. `expected_by_actor` **no** cambia.

| Celda (OP) | Método y ruta | Antes → después | Observación |
|---|---|---|---|
| OP-UNT-002/003/004/005/006 | `POST`/`GET`/`PUT`/`PATCH`/`DELETE` `/organization-units/` | `NOT_EXERCISED` → `OBSERVED_OK` | CRUD por UI; `GET` de detalle **200** y **404** tras la baja |
| OP-RCT-002/003/004/005/006 | `POST`/`GET`/`PUT`/`PATCH`/`DELETE` `/recintos/` | `NOT_EXERCISED` → `OBSERVED_OK` | CRUD por UI; **404** posterior a la baja |
| OP-POS-002/003/004/005/007/008/009 | puestos: `POST`/`GET`/`PUT`/`PATCH`, `asignar-holder`, `quitar-holder`, `historico` | `NOT_EXERCISED` → `OBSERVED_OK` | **201**/**200**/**201**; `quitar-holder` **200** por fallback de API |
| OP-POS-006 | `DELETE /posiciones/{id}/` | `NOT_EXERCISED` → `PARTIAL` | **500** `ProtectedError`; deuda §11 |
| OP-MEM-002/004/005/006 | `POST`/`PUT`/`PATCH`/`DELETE` `/memberships/` | `NOT_EXERCISED` → `OBSERVED_OK` | **201**/**200**/**200**/**204** |
| OP-USR-004/005/006/012 | `PUT`/`PATCH`/`DELETE` usuarios, `crear-temporal` | `NOT_EXERCISED` → `OBSERVED_OK` | **201**/**200**/**200**/**204** |
| OP-WPN-002/003/004/005/006 | `POST`/`GET`/`PUT`/`PATCH`/`DELETE` `/armas/` | `NOT_EXERCISED` → `OBSERVED_OK` | CRUD por UI |
| OP-EJR-002/003/004/005/006 | `POST`/`GET`/`PUT`/`PATCH`/`DELETE` `/ejercicios/` | `NOT_EXERCISED` → `OBSERVED_OK` | CRUD por UI |
| OP-PRF-003/004/005 | `GET`/`PUT`/`DELETE` apariencia `design-system` | `NOT_EXERCISED` → `OBSERVED_OK` | **200**/**200**/**204**; restaurada al estado previo |
| OP-ROL-003 · OP-SCP-002 · OP-PRM-002 · OP-RPR-001 · OP-PPR-001 | detalle de rol/scope/permiso y matrices rol↔permiso y puesto↔permiso | `NOT_EXERCISED` → `OBSERVED_OK` | Lectura **200**; **cero** escrituras RBAC |

| Conteo | Corte vigente (§12.7) | Tras §12.8 |
|---|---:|---:|
| `OBSERVED_OK` | 206 | **249** |
| `PARTIAL` | 19 | **20** |
| `NOT_EXERCISED` | 1095 | **1051** |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas |

> 🕯️ **Lo que la corrida no mueve y sus límites.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las
> **1320** celdas y el estado global sigue **`NOT_VERIFIED` / `NO_CUMPLIDO`**. **Ninguna otra fila se
> movió**: el recuento por recorrido de las **165 × 8** da **249 / 20 / 1051**. El `204`/`404` **no**
> acreditan borrado físico en base. `OP-POS-008` se observó por **fallback de API**, no por clic de UI.
> El barrido final **incluyó marcadores de corridas previas** y dejó **3** puestos descartables propios
> (`A2CF`, ids **48, 54 y 55**) indelebles por UI y por API. Sólo A2 y registros descartables propios;
> **sin** tocar RBAC, backend, base de datos, dependencias ni commits.

### 12.9 Acreditación del alias A3 — familias núcleo por UI (promueve 33 celdas)

> 🕯️ **Qué es.** Tercera tanda del **2026-10-14** que **sí promueve celdas**, posterior a §12.8:
> acredita el alias **A3** por correspondencia privada y ejercita por **UI real** las familias núcleo
> pendientes de A3, sobre registros descartables propios. Detalle en
> [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md) §5 septies y
> en `observations.a3_core_families_2026_10_14` de
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json).

**Acreditación del alias.** `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y
`GET /api/auth/context/` **200** con rol activo **`admin_unidad`** —asignación primaria `admin_unidad` con
scope y secundaria `tirador` con scope—, correspondiente al registro privado de A3; **sin** cookies
fabricadas. `expected_by_actor` **no** cambia.

| Celda (OP) | Método y ruta | Antes → después | Observación |
|---|---|---|---|
| OP-RCT-002/003/004/005/006 | `POST`/`GET`/`PUT`/`PATCH`/`DELETE` `/recintos/` | `NOT_EXERCISED` → `OBSERVED_OK` | CRUD por UI; **404** posterior a la baja |
| OP-POS-002/003/004/005/006/009 | puestos: `POST`/`GET`/`PUT`/`PATCH`/`DELETE` y `historico` | `NOT_EXERCISED` → `OBSERVED_OK` | Puesto **SIN** holder; baja `DELETE` **204** (contraste con el `500` de A2, deuda §11) |
| OP-MEM-002/006 | `POST`/`DELETE` `/memberships/` | `NOT_EXERCISED` → `OBSERVED_OK` | **201**/**204** |
| OP-USR-012 | `POST /usuarios/crear-temporal/` | `NOT_EXERCISED` → `OBSERVED_OK` | **201**; el registro creado **no** fue recuperable por A3 |
| OP-WPN-002/003/004/005 | `POST`/`GET`/`PUT`/`PATCH` `/armas/` | `NOT_EXERCISED` → `OBSERVED_OK` | CRUD por UI |
| OP-EJR-002/003/004/005 | `POST`/`GET`/`PUT`/`PATCH` `/ejercicios/` | `NOT_EXERCISED` → `OBSERVED_OK` | CRUD por UI |
| OP-PRF-003/004/005 | `GET`/`PUT`/`DELETE` apariencia `design-system` | `NOT_EXERCISED` → `OBSERVED_OK` | **200**/**200**/**204**; restaurada al estado previo |
| OP-ROL-003 · OP-SCP-002 · OP-PRM-002 | detalle de rol/scope/permiso | `NOT_EXERCISED` → `OBSERVED_OK` | Lectura **200** |
| OP-UNT-002 · OP-WPN-006 · OP-EJR-006 · OP-RPR-001 · OP-PPR-001 | `POST /organization-units/`, `DELETE /armas/{id}/`, `DELETE /ejercicios/{id}/`, `GET /authz/role-permissions/`, `GET /authz/position-permissions/` | `NOT_EXERCISED` → `PARTIAL` | **403** real observado; **no** certificado como resultado esperado (`expected_by_actor` sigue `NOT_VERIFIED`) |

| Conteo | Corte vigente (§12.8) | Tras §12.9 |
|---|---:|---:|
| `OBSERVED_OK` | 249 | **277** |
| `PARTIAL` | 20 | **25** |
| `NOT_EXERCISED` | 1051 | **1018** |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas |

> 🕯️ **Lo que la corrida no mueve y sus límites.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las
> **1320** celdas y el estado global sigue **`NOT_VERIFIED` / `NO_CUMPLIDO`**. **Ninguna otra fila se
> movió**: el recuento por recorrido de las **165 × 8** da **277 / 25 / 1018**. Las cinco denegaciones
> **403** quedan **`PARTIAL`**, no `OBSERVED_OK`, y **no** se certifica que sean el resultado esperado. El
> residuo de arma **14** y ejercicio **15** quedó **sin poder darse de baja por A3** (`403`); la limpieza
> con **otro actor** se completó después (§12.10) y **no** se repara por base. El usuario temporal creado
> por A3 **no** fue recuperable por A3; su baja se ejecutó después con el alias A1 (§12.10). El `204`/`404`
> **no** acreditan borrado físico en base. Sólo A3 y registros descartables propios; **sin** tocar RBAC, backend, base de datos, dependencias
> ni commits. El desajuste UI/backend (la UI ofrece acciones que el backend deniega con `403`) se registra
> como observación en [`docs/bugs/backend-debt.md`](../../bugs/backend-debt.md) §12, **sin** proponer
> arreglo ni decidir qué parte debe cambiar.

---

### 12.10 Acreditación del alias A4 y limpieza del residuo de A3 (promueve 9 celdas)

> 🕯️ **Qué es.** Cuarta tanda del **2026-10-14** que **sí promueve celdas**, posterior a §12.9: acredita
> el alias **A4** por correspondencia privada y ejercita por **UI real** las familias núcleo pendientes de
> A4; además cierra la limpieza del residuo de A3 con el alias **A1 acreditado**. Detalle en
> [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md) §5 octies y
> §5 nonies, y en `observations.a4_core_families_2026_10_14` y `observations.a3_residue_cleanup_2026_10_14`
> de [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json).

**Acreditación del alias.** `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y
`GET /api/auth/context/` **200** con rol activo **`comandante_unidad`** —asignación primaria
`comandante_unidad` con scope y secundaria `tirador` con scope—, correspondiente al registro privado de
A4; **sin** cookies fabricadas. `expected_by_actor` **no** cambia.

| Celda (OP) | Método y ruta | Antes → después | Observación |
|---|---|---|---|
| OP-PRF-003/004/005 | `GET`/`PUT`/`DELETE` apariencia `design-system` | `NOT_EXERCISED` → `OBSERVED_OK` | **200**/**200**/**204**; restaurada al estado previo |
| OP-ROL-003 · OP-SCP-002 · OP-PRM-002 | detalle de rol/scope/permiso | `NOT_EXERCISED` → `OBSERVED_OK` | Lectura **200** |
| OP-WPN-002 · OP-RPR-001 · OP-PPR-001 | `POST /armas/`, `GET /authz/role-permissions/`, `GET /authz/position-permissions/` | `NOT_EXERCISED` → `PARTIAL` | **403** real observado; **no** certificado como resultado esperado (`expected_by_actor` sigue `NOT_VERIFIED`) |

**Limpieza del residuo de A3 (no promueve celdas).** Con el alias **A1 acreditado** por correspondencia
privada se dieron de baja por UI el arma **14** (`GET` **200** → `DELETE` UI **204** → `GET` **404**), el
ejercicio **15** (`200` → `204` → `404`) y el usuario temporal **40** (`200` → `204` → `404`); barrido
final por marcador **A3CF** en **7** familias con **0** coincidencias propias. El `204`/`404` **no**
acreditan borrado físico en base y **no** se reparó por base.

| Conteo | Corte vigente (§12.9) | Tras §12.10 |
|---|---:|---:|
| `OBSERVED_OK` | 277 | **283** |
| `PARTIAL` | 25 | **28** |
| `NOT_EXERCISED` | 1018 | **1009** |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas |

> 🕯️ **Lo que la corrida no mueve y sus límites.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las
> **1320** celdas y el estado global sigue **`NOT_VERIFIED` / `NO_CUMPLIDO`**. **Ninguna otra fila se
> movió**: el recuento por recorrido de las **165 × 8** da **283 / 28 / 1009**. Las tres denegaciones
> **403** de A4 quedan **`PARTIAL`**, no `OBSERVED_OK`, y **no** se certifica que sean el resultado
> esperado. Para A4 la UI **no** ofreció el alta de unidades, recintos, puestos, membresías ni usuarios
> temporales (botones ausentes), el alta de ejercicio estaba **deshabilitada**, el calibre y el holder
> **no** se ejercitaron; **no** se forzó la API. La limpieza del residuo de A3 **no** promueve celdas. Sólo
> A4 y registros descartables propios, y la limpieza con A1; **sin** tocar RBAC, backend, base de datos,
> dependencias ni commits. El desajuste UI/backend (la UI ofrece acciones que el backend deniega con `403`)
> se amplía con un **segundo caso observado** —la UI ofrece «Registrar arma» a A4 y el backend responde
> `403`— en [`docs/bugs/backend-debt.md`](../../bugs/backend-debt.md) §12, **sin** proponer arreglo ni
> decidir qué parte debe cambiar.

### 12.11 Acreditación de los alias A5 y A6 y limpieza del residuo (promueve 33 celdas)

> 🕯️ **Qué es.** Quinta y sexta tandas del **2026-10-14** que **sí promueven celdas**, posteriores a
> §12.10: acreditan los alias **A5** y **A6** por correspondencia privada y ejercitan por **UI real** las
> familias núcleo pendientes de cada uno; además cierra la limpieza del residuo de A5 con el alias
> **A1 acreditado**. Detalle en
> [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md) §5 decies,
> §5 undecies y §5 duodecies, y en `observations.a5_core_families_2026_10_14`,
> `observations.a6_core_families_2026_10_14` y `observations.a5_a6_residue_cleanup_2026_10_14` de
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json).

**Acreditación de los alias.** A5: `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y
`GET /api/auth/context/` **200** con rol activo **`oficial_tiro`**. A6: **200**/**200** con rol activo
**`oficial_observador`** y **4** permisos efectivos (`view_unit`, `view_self`, `view_personnel_basic`,
`view_exercises`). Ambos por correspondencia privada y **sin** cookies fabricadas. `expected_by_actor`
**no** cambia.

| Celda (OP) | Método y ruta | Antes → después | Observación |
|---|---|---|---|
| OP-USR-012 | `POST /usuarios/crear-temporal/` | `NOT_EXERCISED` → `OBSERVED_OK` (A5) | **201** |
| OP-WPN-002/003/004/005 | `POST`/`GET`/`PUT`/`PATCH` de armas | `NOT_EXERCISED` → `OBSERVED_OK` (A5) | **201**/**200**/**200**/**200** |
| OP-EJR-002/003/004/005 | `POST`/`GET`/`PUT`/`PATCH` de ejercicios | `NOT_EXERCISED` → `OBSERVED_OK` (A5; `EJR-003` también A6) | **201**/**200**/**200**/**200** |
| OP-PRF-003/004/005 | `GET`/`PUT`/`DELETE` apariencia `design-system` | `NOT_EXERCISED` → `OBSERVED_OK` (A5 y A6) | **200**/**200**/**204** |
| OP-ROL-003 · OP-SCP-002 · OP-PRM-002 | detalle de rol/scope/permiso | `NOT_EXERCISED` → `OBSERVED_OK` (A5 y A6) | Lectura **200** |
| OP-UNT-003 · OP-POS-003 · OP-POS-009 | detalle de unidad, detalle e histórico de puesto | `NOT_EXERCISED` → `OBSERVED_OK` (A5 y A6) | Lectura **200** |
| OP-WPN-006 · OP-RPR-001 · OP-PPR-001 | `DELETE /armas/{id}/`, `GET /authz/role-permissions/`, `GET /authz/position-permissions/` | `NOT_EXERCISED` → `PARTIAL` (A5); `RPR-001`/`PPR-001` también `PARTIAL` (A6) | **403** real observado; **no** certificado como resultado esperado (`expected_by_actor` sigue `NOT_VERIFIED`) |

**Denegación neutral de UI (no es `403`).** Para A6, las rutas de recintos (`/organizacion/recintos`, sin
`view_recinto`) y de armas (`/almacen/armas`, sin `view_warehouse`) se resolvieron **fail-closed** en el
cliente con contenedor neutral «Acceso denegado» **sin** request de dominio. Esa denegación neutral de UI
**no** se convierte en denegación y **no** se cuenta como `403` de backend.

**Limpieza del residuo de A5 (no promueve celdas).** Con el alias **A1 acreditado** por correspondencia
privada se dieron de baja por UI el arma **15** (`GET` **200** → `DELETE` UI **204** → `GET` **404**), el
ejercicio **16** (`200` → `204` → `404`) y el usuario temporal **41** (`200` → `204` → `404`); barrido
final por marcadores **A5CF** y **A6CF** en **7** familias con **0** coincidencias propias. El `204`/`404`
**no** acreditan borrado físico en base y **no** se reparó por base.

| Conteo | Corte vigente (§12.10) | Tras §12.11 |
|---|---:|---:|
| `OBSERVED_OK` | 283 | **311** |
| `PARTIAL` | 28 | **33** |
| `NOT_EXERCISED` | 1009 | **976** |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas |

> 🕯️ **Lo que la corrida no mueve y sus límites.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las
> **1320** celdas y el estado global sigue **`NOT_VERIFIED` / `NO_CUMPLIDO`**. **Ninguna otra fila se
> movió**: el recuento por recorrido de las **165 × 8** da **311 / 33 / 976**. Las denegaciones **403** de
> A5 y A6 quedan **`PARTIAL`**, no `OBSERVED_OK`, y **no** se certifica que sean el resultado esperado.
> Para A5 y A6 la UI **no** ofreció las altas/ediciones/bajas de unidades, recintos, puestos, membresías,
> usuarios temporales, calibres, armas ni ejercicios, y el holder **no** se ejerció por el gate; **no** se
> forzó la API. La limpieza del residuo de A5 **no** promueve celdas. Sólo A5, A6 y registros descartables
> propios, y la limpieza con A1; **sin** tocar RBAC, backend, base de datos, dependencias ni commits. La
> deuda de puestos ([`docs/bugs/backend-debt.md`](../../bugs/backend-debt.md) §11) y el desajuste UI/backend
> (§12) siguen vigentes, **sin** proponer arreglo ni decidir qué parte debe cambiar.

### 12.12 Acreditación del alias A7 y limpieza de su residuo (promueve 14 celdas)

> 🕯️ **Qué es.** Séptima tanda del **2026-10-14** que **sí promueve celdas**, posterior a §12.11: acredita
> el alias **A7** por correspondencia privada y ejercita por **UI real** las familias núcleo y de almacén
> pendientes; además cierra la limpieza de su residuo con el alias **A1 acreditado**. Detalle en
> [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md) §5 terdecies y
> §5 quaterdecies, y en `observations.a7_core_families_2026_10_14` y
> `observations.a7_residue_cleanup_2026_10_14` de
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json).

**Acreditación del alias.** A7: `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y
`GET /api/auth/context/` **200** con rol activo **`encargado_almacen`** y **10** permisos efectivos
(`create_exercises`, `create_warehouse_records`, `delete_warehouse_records`, `update_exercises`,
`update_warehouse_records`, `view_exercises`, `view_personnel_basic`, `view_self`, `view_unit`,
`view_warehouse`). Por correspondencia privada y **sin** cookies fabricadas. `expected_by_actor` **no** cambia.

| Celda (OP) | Método y ruta | Antes → después | Observación |
|---|---|---|---|
| OP-POS-003 · OP-POS-009 | detalle e histórico de puesto | `NOT_EXERCISED` → `OBSERVED_OK` (A7) | Lectura **200** |
| OP-WPN-002/003/004/005/006 | `POST`/`GET`/`PUT`/`PATCH`/`DELETE` de armas | `NOT_EXERCISED` → `OBSERVED_OK` (A7) | **201**/**200**/**200**/**200**/**204** |
| OP-EJR-002 | `POST /ejercicios/` | `NOT_EXERCISED` → `OBSERVED_OK` (A7) | **201** |
| OP-ROL-003 · OP-SCP-002 · OP-PRM-002 | detalle de rol/scope/permiso | `NOT_EXERCISED` → `OBSERVED_OK` (A7) | Lectura **200** |
| OP-RPR-001 · OP-PPR-001 | `GET /authz/role-permissions/` y `GET /authz/position-permissions/` | `NOT_EXERCISED` → `PARTIAL` (A7) | **403** real observado; **no** certificado como resultado esperado (`expected_by_actor` sigue `NOT_VERIFIED`) |
| OP-EJR-006 | `DELETE /ejercicios/{id}/` | `NOT_EXERCISED` → `PARTIAL` (A7) | **403** real observado; **no** certificado como resultado esperado |

**Hallazgo de asimetría (permisos del rol).** A7 **puede crear y editar ejercicios**
(`create_exercises`/`update_exercises`) pero **no borrarlos** (sin `delete_exercises`): la UI **no** ofrece la
baja y la API responde **403**. Es asimetría de **permisos del rol**, **no** de gating de UI; se anota como
caso observado en [`docs/bugs/backend-debt.md`](../../bugs/backend-debt.md) §12, **sin** proponer arreglo ni
decidir qué parte debe cambiar.

**Denegación neutral de UI (no es `403`).** Para A7, la ruta `/organizacion/recintos` se resolvió
**fail-closed** en el cliente (contenedor neutral «Acceso denegado») **sin** request de dominio por no
incluir `view_recinto`. Esa denegación neutral de UI **no** se convierte en denegación y **no** se cuenta
como `403` de backend.

**Limpieza del residuo de A7 (no promueve celdas).** Con el alias **A1 acreditado** por correspondencia
privada se dio de baja por UI el ejercicio **17** (`GET` **200** → `DELETE` UI **204** → `GET` **404**);
barrido final por marcador **A7CF** en **8** familias con **0** coincidencias propias. El `204`/`404` **no**
acreditan borrado físico en base y **no** se reparó por base.

| Conteo | Corte vigente (§12.11) | Tras §12.12 |
|---|---:|---:|
| `OBSERVED_OK` | 311 | **322** |
| `PARTIAL` | 33 | **36** |
| `NOT_EXERCISED` | 976 | **962** |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas |

> 🕯️ **Lo que la corrida no mueve y sus límites.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las
> **1320** celdas y el estado global sigue **`NOT_VERIFIED` / `NO_CUMPLIDO`**. **Ninguna otra fila se
> movió**: el recuento por recorrido de las **165 × 8** da **322 / 36 / 962**. Las denegaciones **403** de A7
> quedan **`PARTIAL`**, no `OBSERVED_OK`, y **no** se certifica que sean el resultado esperado. Para A7 la UI
> **no** ofreció las mutaciones de unidades, puestos (incluido holder), membresías, usuarios temporales ni
> calibres, y el detalle de membresía y de calibre **no** existe como ruta; **no** se forzó la API. La
> limpieza del residuo de A7 **no** promueve celdas. Sólo A7 y registros descartables propios, y la limpieza
> con A1; **sin** tocar RBAC, backend, base de datos, dependencias ni commits. La deuda de puestos
> ([`docs/bugs/backend-debt.md`](../../bugs/backend-debt.md) §11) y el desajuste UI/backend (§12) siguen
> vigentes, **sin** proponer arreglo ni decidir qué parte debe cambiar.

---

### 12.13 Acreditación del alias A8 y cierre de la campaña por actor (promueve 10 celdas)

> 🕯️ **Qué es.** Octava tanda del **2026-10-14** que **sí promueve celdas**, posterior a §12.12: acredita el
> alias **A8** (el rol más restringido, `tirador`) por correspondencia privada y ejercita por **UI real** las
> familias núcleo pendientes; además cierra la limpieza de su residuo —sin residuo— con el alias **A1
> acreditado**, y con ella la **campaña documental** de acreditación por actor del 2026-10-14. Detalle en
> [`evidence/2026-10-14/exec-plan-summary.md`](./evidence/2026-10-14/exec-plan-summary.md) §5 quindecies, §5
> sexdecies y §5 septendecies, y en `observations.a8_core_families_2026_10_14` y
> `observations.a8_residue_cleanup_2026_10_14` de
> [`evidence/2026-10-12/acceptance-matrix.json`](./evidence/2026-10-12/acceptance-matrix.json).

**Acreditación del alias.** A8: `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y
`GET /api/auth/context/` **200** con rol activo **`tirador`** —única asignación, primaria con scope— y **4**
permisos efectivos (`view_exercises`, `view_personnel_basic`, `view_self`, `view_unit`). Por correspondencia
privada y **sin** cookies fabricadas. `expected_by_actor` **no** cambia.

| Celda (OP) | Método y ruta | Antes → después | Observación |
|---|---|---|---|
| OP-UNT-003 | `GET /organization-units/{id}/` | `NOT_EXERCISED` → `OBSERVED_OK` (A8) | Lectura **200** |
| OP-POS-003 · OP-POS-009 | detalle e histórico de puesto | `NOT_EXERCISED` → `OBSERVED_OK` (A8) | Lectura **200** |
| OP-PRF-004 · OP-PRF-005 | `PUT` y `DELETE` de apariencia propia | `NOT_EXERCISED` → `OBSERVED_OK` (A8) | `PUT` **200** y reset `DELETE` **204** |
| OP-ROL-003 · OP-SCP-002 · OP-PRM-002 | detalle de rol/scope/permiso | `NOT_EXERCISED` → `OBSERVED_OK` (A8) | Lectura **200** |
| OP-RPR-001 · OP-PPR-001 | `GET /authz/role-permissions/` y `GET /authz/position-permissions/` | `NOT_EXERCISED` → `PARTIAL` (A8) | **403** real observado; **no** certificado como resultado esperado (`expected_by_actor` sigue `NOT_VERIFIED`) |

**Denegación neutral de UI (no es `403`).** Para A8, las rutas `/organizacion/recintos` y `/almacen/armas`
se resolvieron **fail-closed** en el cliente (contenedor neutral «Acceso denegado») **sin** request de dominio
por no incluir `view_recinto` y `view_warehouse`. Esa denegación neutral de UI **no** se convierte en
denegación y **no** se cuenta como `403` de backend.

**Limpieza del residuo de A8 (no promueve celdas).** Con el alias **A1 acreditado** por correspondencia
privada se cerró el barrido por marcador **A8CF** en **8** familias con **0** coincidencias propias: A8 no
pudo crear nada —el rol más restringido no ofreció altas—, de modo que **no hubo residuo**. Un intento previo
de A8 se interrumpió por reinicio y **no** dejó artefacto; el barrido por prefijo **no** halló residuo
atribuible y **no** se inventa atribución. El `204`/`404` **no** acreditan borrado físico en base.

| Conteo | Corte vigente (§12.12) | Tras §12.13 |
|---|---:|---:|
| `OBSERVED_OK` | 322 | **330** |
| `PARTIAL` | 36 | **38** |
| `NOT_EXERCISED` | 962 | **952** |
| Denominador | 165 OP / 1320 celdas | 165 OP / 1320 celdas |

**Cierre de la campaña de aceptación por actor del 2026-10-14.** Con las **ocho** tandas de acreditación por
actor —**A1 a A8**, todas por correspondencia privada en su propia sesión— y sus limpiezas, la campaña
**documental** queda cerrada. Movió **151** celdas: **132** a `OBSERVED_OK` y **19** a `PARTIAL`, desde el
corte de partida **198 / 19 / 1103** hasta el vigente **330 / 38 / 952** sobre 1320.

| Tanda | Actor | `OBSERVED_OK` | `PARTIAL` | Celdas movidas |
|---|---|---:|---:|---:|
| §12.7 (A1) | `super_admin` | 8 | 0 | 8 |
| §12.8 (A2) | `tenant_admin` | 43 | 1 | 44 |
| §12.9 (A3) | `admin_unidad` | 28 | 5 | 33 |
| §12.10 (A4) | `comandante_unidad` | 6 | 3 | 9 |
| §12.11 (A5, A6) | `oficial_tiro`, `oficial_observador` | 28 | 5 | 33 |
| §12.12 (A7) | `encargado_almacen` | 11 | 3 | 14 |
| §12.13 (A8) | `tirador` | 8 | 2 | 10 |
| **Total** | **A1–A8** | **132** | **19** | **151** |

**Lo que queda fuera de la campaña y su causa.** La campaña acreditó por actor lo que la UI real ofrecía con
sesión legítima; lo demás queda **fuera**, con causa declarada:

| Causa | Contenido fuera de la campaña | Referencia |
|---|---|---|
| **Bloqueo de backend** | `POST /api/consumos-municion/` **500**; consumo de arma que requiere un consumo padre válido; resultados por **elegibilidad** y por **desalineación de unidad**; `GET /api/lecciones/{id}/resultados/` **500**; **overrides** no reflejados en el contexto de UI | [`docs/bugs/backend-debt.md`](../../bugs/backend-debt.md) §1, §7, §7.1, §8, §9 |
| **Decisiones del operador** | Escrituras de **RBAC**: roles, **permisos por rol** (`role-permissions`) y **permisos por puesto** (`position-permissions`). Cero escrituras RBAC en toda la campaña | — |
| **Prerrequisitos de entorno** | **Segundo tenant** (aislamiento entre tenants); **correo** (recuperación de acceso); **credenciales heredadas** | — |

> 🕯️ **Lo que la corrida no mueve y sus límites.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las
> **1320** celdas y el estado global sigue **`NOT_VERIFIED` / `NO_CUMPLIDO`**: **no** hay cierre de aceptación
> integral. **Ninguna otra fila se movió**: el recuento por recorrido de las **165 × 8** da **330 / 38 / 952**.
> Las denegaciones **403** de A8 quedan **`PARTIAL`**, no `OBSERVED_OK`, y **no** se certifica que sean el
> resultado esperado. Para A8 la UI **no** ofreció altas, ediciones ni bajas de ninguna familia, el holder
> **no** se ofreció y la mutación de calibres **no** se ofreció; el detalle de membresía y de calibre **no**
> existe como ruta; **no** se forzó la API. La limpieza del residuo de A8 **no** promueve celdas. Sólo A8 y
> registros descartables propios, y la limpieza con A1; **sin** tocar RBAC, backend, base de datos,
> dependencias ni commits. La deuda de puestos
> ([`docs/bugs/backend-debt.md`](../../bugs/backend-debt.md) §11) y el desajuste UI/backend (§12, tres casos)
> siguen vigentes, **sin** proponer arreglo ni decidir qué parte debe cambiar.
