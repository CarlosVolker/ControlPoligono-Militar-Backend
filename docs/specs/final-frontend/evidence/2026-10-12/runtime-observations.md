---
actualizado: 2026-10-12
---

# Observaciones runtime de aceptación — cierre parcial (2026-10-12)

> 🕯️ **Qué es esta página.** `Lore Master`. Observaciones **reales** de la fase runtime (F4/F5) y
> **cierre parcial honesto**. No certifica el producto, no emite veredicto (corresponde al
> orquestador) y **no cierra** la spec. Fuentes con `source-kind` explícito: caché de trabajo
> `.cache/frontend-acceptance/2026-10-12/` y [`acceptance-matrix.json`](./acceptance-matrix.json),
> que guarda copia **durable y saneada** (`observations`) para no depender de una caché borrable.

## 1. Índice

2. [Origen de la evidencia](#2-origen-de-la-evidencia) · 3. [Alcance real](#3-alcance-real) · 4. [Observaciones por actor y método](#4-observaciones-por-actor-y-método) · 5. [Caso F7 — cambio de contraseña](#5-caso-f7--cambio-de-contraseña) · 6. [Lo que no se ejercitó](#6-lo-que-no-se-ejercitó) · 7. [Cierre](#7-cierre-parcial-honesto)

## 2. Origen de la evidencia

| `source-kind` | Significado |
|---|---|
| `direct_orchestrator_playwright_ui` | Observación **directa** del orquestador con UI Playwright local y requests reales del producto |
| `worker_handoff_reported` | **Reportado** en el handoff del worker `ses_code-transmuter-1791804695`: sin traza cruda persistida, sin hora exacta por paso |

> 🕯️ El handoff es un reporte, no una traza reconstruida: por eso sus resultados se integran
> como `PARTIAL` **reportado**, nunca como `OBSERVED_OK` certificado.

**Estado de los ejecutores:** el worker de runtime agotó 1800s + 900s y está **inactivo**; la
corrección frontend de F7/AC-8 **está terminada** (§5.2) y `Code` también está inactivo al cierre.

## 3. Alcance real

- **Denominador:** 162 OP **documentales** del manifest, coincidentes en `coverage/operations.md`
  y `backend-inventory.md`. **No es el conjunto efectivo verificado**: el contraste con
  `apipoligono/urls.py` fue *matching* del último segmento estático del path, sin lectura de
  handlers ni de método/acción por ViewSet; reportar 21 registros de router + 17 rutas explícitas
  **no prueba acciones exhaustivas**.
- **Celdas:** 162 × 8 = **1296**: **1277 `NOT_EXERCISED`** · **19 `PARTIAL`** · sin porcentajes y sin `OBSERVED_OK`.
- **Por actor:** parcial; sólo **A8** tiene observación directa reutilizable.
- **Ramas F4 tocadas:** lecturas (`GET`) y autenticación; **sin CRUD de negocio**, salvo el `POST` propio de F7 (§5).

## 4. Observaciones por actor y método

### 4.1 Observación directa del orquestador (actor A8, UI Playwright local)

| OP | Método | Estado | `source-kind` | Observación |
|---|---|---|---|---|
| `OP-AUT-001` | `POST /auth/login/` | `PARTIAL` | `direct_orchestrator_playwright_ui` | Login por UI con credencial original de A8: **200** |
| `OP-AUT-002` | `GET /auth/context/` | `PARTIAL` | `direct_orchestrator_playwright_ui` | **Dos escenarios distintos, no fusionados**: 200 con sesión activa; **403** tras el cambio de contraseña (§5) |
| `OP-USR-013` | `POST /usuarios/{id}/cambiar-contrasena/` | `PARTIAL` | `direct_orchestrator_playwright_ui` | **200** con la credencial original reaplicada (§5) |

**Corrección de origen (2026-10-12).** Las lecturas de `OP-USR-003` (ficha propia) y `OP-UNT-001`
(sondas de unidades) **no** fueron observación directa: proceden del reporte del worker, como
prueba el `source-kind` de sus fuentes. Se listan en §4.2 y **su `PARTIAL` no cambia**: lo que se
corrige es el origen, no el resultado.

### 4.2 Reportadas por el worker (8 actores, sin traza exacta)

| Alcance | Reportado | Límite |
|---|---|---|
| `OP-AUT-001` | Login **200** en los 8 alias | No certifica el resto de la ruta de autenticación |
| `OP-AUT-001` · **A3** | Primer intento **400**, posterior **200** | **Causa no establecida**: no se diagnostica ni se atribuye |
| `OP-USR-003` | Lectura de perfil propio **200** en los 8 alias | Lectura, no escritura ni aislamiento. Procede del reporte del worker (origen corregido en §4.1) |
| `OP-UNT-001` | Sonda permitida `GET /api/organization-units/` **200**; sonda denegada a `/organizacion/recintos` con contenedor de denegación y **cero** solicitudes de negocio | Fail-closed observado en esa ruta; un contenedor denegado **no** es operación CRUD |
| Menú y rutas visibles | Menú *granted* / *denied* por rol | **Un menú visible no es una operación CRUD observada** |
| Overrides | Contenedor de denegación, **cero** solicitudes de negocio | Denegación no certifica la capacidad; la deuda de overrides está registrada |
| Auditoría | Casos A1/A2 y negativos A4…A7 en segunda pasada del orquestador | **No se extrapola** al resto de rutas ni de actores |
| Logout | Reportado en primeras corridas | Una sonda posterior quedó en timeout: **no se resuelve por inferencia** |
| Denegaciones (`OP-RCT-001`, `OP-OVR-001`) | Contenedor de denegación, **cero** solicitudes de negocio | Quedan **`NOT_EXERCISED`** con puntero: registrar la denegación como operación observada sería fabricar la fila |

## 5. Caso F7 — cambio de contraseña

### 5.1 Antes de la corrección (contraste)

Actor A8 por UI de producto, sin cookies inyectadas: login original → **200**; `/cuenta` por el
menú; **misma credencial original** reaplicada (nunca una temporal); `POST` de cambio →
**200**; la aplicación **permanece en `/cuenta`**; navegación a la raíz → `GET /api/auth/context/`
→ **403**, `detail` literal «Las credenciales de autenticación no se proveyeron.» → `/login`. El
frontend **no** retiró el estado obsoleto: de ahí el `PARTIAL` de AC-8 previo.

### 5.2 Después de la corrección — observación directa (actor A8)

Contexto Playwright aislado, requests reales del producto. Fuente durable:
`observations.f7_after_fix` de [`acceptance-matrix.json`](./acceptance-matrix.json).

| Comprobación | Observado |
|---|---|
| Login con credencial original | **200** |
| «Mi cuenta» → `POST /api/usuarios/{id}/cambiar-contrasena/` reaplicando la **original** | **200** |
| Ruta inmediatamente posterior | **`/login`**, sin permanecer en `/cuenta` |
| Aviso de éxito · `detail` literal del backend | **ambos visibles** |
| Formulario de cuenta · menú protegido | **retirados** |
| Inputs de login (RUT y contraseña) | **vacíos** |
| Requests de cambio de contraseña · de login antes del reintento manual | **1** · **1** (sin autologin) |
| Re-login **manual** con la credencial original | **200**, acceso a la raíz confirmado |

Checks tras el fix: `typecheck` exit 0 · `test:focused` **12 archivos / 211 pruebas** · `build`
exit 0. Fix en `front/src/features/account/useOwnAccount.ts:195-233` y
`front/src/views/auth/LoginView.vue:23-25`.

### 5.3 Lectura acotada y resultado por criterio

El contrato actual **invalida la sesión** tras el cambio de contraseña. El valor original **se
conservó** y su login fue **200** antes y después; el hash **pudo cambiar**: **NO_MUTATION no se
afirma**. No se afirma que esto invalide todos los contratos ni todas las cuentas, ni los flujos de
contraseña forzada o de recuperación. **No** se solicita ni se autoriza arreglo de backend aquí.

| Criterio | Estado | Motivo |
|---|---|---|
| F7 / `AC-8` (spec de cuenta), **rama de sesión invalidada** | **`VERIFIED`** por el orquestador, **en este caso A8 observado** | El frontend retira el estado obsoleto, vuelve a `/login`, muestra el aviso de éxito y el `detail` literal, limpia los inputs y no reautentica solo; el re-login manual de la credencial original funciona |
| Celda `OP-USR-013` en la matriz | **`PARTIAL`** | La celda es compuesta: cubre también **otros usuarios** y el **roundtrip con contraseña temporal**, no observados |
| AC-9 (capacidad ausente en backend) | Sin cambio | La escritura de perfil propio sigue ausente y declarada; el perfil editable no se inventó |
| Roundtrip con contraseña temporal | `NOT_EXERCISED` | No se ejecutó |

> 🕯️ **`VERIFIED` es del orquestador y es acotado**: cubre la rama de sesión invalidada de este
> caso A8, **no** es certificación integral del producto. El resultado global sigue
> `NOT_VERIFIED` / `NO_CUMPLIDO`. **Ningún roundtrip temporal se afirma.**

### 5.5 Superficie de recuperación — observación inicial

Contexto anónimo aislado. Fuente durable: `observations.recovery_initial_surface` de
[`acceptance-matrix.json`](./acceptance-matrix.json). `/recuperar`, campo requerido `rut`, etiqueta
`Continuar`; **1** campo inválido tras enviar vacío; **0** requests de escritura API (`[]`);
390 × 844 **sin desbordamiento horizontal**, formulario visible.

**Límite:** sólo la superficie inicial. **No** hay entrega de código, verificación ni reseteo de
contraseña, y **no** se invocó ningún servicio de correo externo; la observación móvil cubre sólo
esta superficie anónima, **no** el shell completo ni la comparación con el Design System. La
recuperación completa queda **`NOT_EXERCISED`**.

## 6. Lo que no se ejercitó

Ninguno de estos casos está bloqueado por permiso del operador; están sin ejecutar: **ningún CRUD
de negocio** (la única escritura observada es el `POST` propio de F7); **sin aislamiento** por
actor de tenant, unidad ni preferencias A→B; **overrides con datos legítimos** (superficie
denegada; deuda en [`../../../../bugs/backend-debt.md`](../../../../bugs/backend-debt.md) §1, que
**no cuenta como PASS**); **sin recuperación completa** (§5.5); **sin actores
`must_change_password=true`**; **sin comparación total del Design System**; **sin F4 completo por
actor**, ni F7 más allá del caso A8, ni roundtrip con contraseña temporal. Los **dos diagnósticos
con cookies construidas a mano no se certifican**: su salida es diagnóstico, no evidencia.

**Gates:** `security_review` y `code_review` fueron **revocados por el operador**: **no se
hicieron** y **no están en `PASSED`**. No se invoca ningún revisor nuevo y **no son requisito
para completar esta ejecución**: la revocación fue decisión explícita del operador. Los comandos en
verde (`typecheck` exit 0, `test:focused` 12 archivos / 211 pruebas, `build` exit 0) **no son gate**.

## 7. Cierre parcial honesto

| Dimensión | Resultado |
|---|---|
| F7 / `AC-8`, rama de sesión invalidada, caso A8 | **`VERIFIED`** (orquestador, acotado) |
| Estado global · conclusión de producto | **`NOT_VERIFIED`** · **`NO_CUMPLIDO`** |
| Celdas (corte vigente) | 1320 · `PARTIAL` 19 · `NOT_EXERCISED` 1289 · `OBSERVED_OK` 12 |
| Spec de aceptación integral · spec de cuenta | **`in-progress`** ambas: AC obligatorios faltantes |

**Qué impide completar el encargo:** ejecución runtime por actor (escrituras, aislamiento,
overrides, contraseña forzada, comparación del DS), el contraste pendiente del conjunto efectivo
de backend contra los handlers, y la deuda backend registrada. **No** es un requisito volver a
autorizar auditorías. Al cierre, `Code` y el worker de runtime están **inactivos**; la corrección
F7 está **terminada** y no se anuncian barridos adicionales.


## Apéndice — reejecución A7: validación, `PUT` y logout (2026-10-12)

El orquestador corrigió el harness (`node --check` OK) y reejecutó el recorrido por Playwright
real. Fuentes: [`armory-follow-up-replay-results.json`](./armory-follow-up-replay-results.json) y
`observations.armory_follow_up_a7` de [`acceptance-matrix.json`](./acceptance-matrix.json).

| Caso | Observado |
|---|---|
| Validación de `name` vacío | Mensaje de la app y `aria-invalid` en `PATCH`; inválido nativo en `PUT`; **0** escrituras; el modal permanece abierto y cierra por UI |
| Ficha / editor | Abren y cierran por UI; los **cinco** campos del editor igualan el DTO de la respuesta real |
| `PUT` (`OP-ARM-004`/A7) | **200** con cinco claves `[code, name, descripcion, is_active, organization_unit_code_write]`, cuyos **valores** se preservan con el mapeo `organization_unit_code_write` ← `organization_unit_code`; `GET` posterior **200** compara `code/name/descripcion/is_active/organization_unit_code` con igualdad estricta |
| Logout (`OP-AUT-005`/A7) | `POST /api/logout/` **200** → `pathname` `/login` exacto; RUT y contraseña vacíos; menú del actor retirado; contexto cerrado |

Cero altas, cero bajas, sin cambios en el código del producto. Esto **no es `NO_MUTATION`**: el
`PUT` **sí se envió**, con los mismos valores de negocio.

**Límites.** Sólo A7 y una armería existente: no certifica otros actores, tenants ni unidades, ni
aislamiento de unidad. Altas, bajas y `PUT` con valores distintos siguen sin ejercitarse. El
**logout no incluye sonda autenticada posterior** para probar revocación de sesión en el servidor.
Los **timeouts históricos de navegación y logout no se borran**: el cierre de UI y el logout sí se
observaron en esta reejecución, y eso **no establece la causa** de aquellos timeouts; los ajustes
fueron al harness de comprobación, no al producto.

**Recuento.** El corte de 3 celdas `OBSERVED_OK` queda como registro histórico de su entrega; el
corte vigente es **5**. El estado global permanece **`NOT_VERIFIED`** / **`NO_CUMPLIDO`** y el
denominador de 162 OP sigue **no verificado** como conjunto efectivo. No se afirma CRUD completo
ni 100 %.


## Apéndice — CRUD completo de armerías y contraste efectivo del conjunto (2026-10-12)

Reejecución del recorrido por UI real con el actor A7. Fuentes:
[`armory-crud-complete-results.json`](./armory-crud-complete-results.json) y
`observations.armory_crud_complete_a7` de [`acceptance-matrix.json`](./acceptance-matrix.json).

| Caso | Observado |
|---|---|
| Alta `OP-ARM-002`/A7 | `POST /api/armorias/` **201**, cuerpo `[code, name, organization_unit_code_write]`, unidad CIA-A seleccionada en el formulario; el listado pasa de 1 a 2 filas |
| Baja `OP-ARM-006`/A7 | `DELETE /api/armorias/{id}/` **204** por el modal Confirmar baja; listado de vuelta a 1 fila, código temporal ausente y `GET` de ficha del id borrado **404** |
| Cierre | `POST /api/logout/` **200**, contexto controlado cerrado, **0** registros dejados, ninguno preexistente tocado |
| Contraste efectivo del conjunto | El conjunto efectivo verificado es **165 OP**, no 162: faltaban `GET`/`PUT`/`DELETE` de `/me/preferences/appearance/design-system/` (`apipoligono/urls.py:100`; `views.py:1947,1960,1963,1978`). Se añaden `OP-PRF-003`/`004`/`005` con nota explícita de estar **fuera del manifiesto original**; `coverage/operations.md` y `backend-inventory.md` **no se editaron** |

Las tres filas nuevas quedan **`NOT_EXERCISED` para los 8 actores**: el `GET` ocurre al cargar la
app, pero **no hay evidencia de aceptación persistida por actor**, así que no se marcan
`OBSERVED_OK`. El denominador pasa a `165` con `verified_effective: true`, y la nota del
denominador declara el alcance del contraste: registro de rutas y handlers citados, **no** una
ejecución por actor.

**Límites.** Sólo A7 y un registro descartable: no se certifican altas/bajas de otros actores ni
de otras familias. La creación por UI depende de las opciones de unidad que devuelve el backend.
`PUT` con valores distintos y la edición de otros campos siguen sin ejercitarse. El estado global
permanece **`NOT_VERIFIED`** / **`NO_CUMPLIDO`**: **no** se afirma CRUD completo del producto ni
100 %.

**Corte 2026-10-12 (preferencias y scope de armorerías).** A7 `PUT` de preferencias de apariencia 200
(cambio de acento Mint→Violet por radio del panel), A8 `GET` 200 con acento Mint sin afectación y
A7 `GET` 200 en sesión nueva con Violet persistido, más `DELETE` 204 por «Restablecer valores por
defecto» con vuelta a Mint: `OP-PRF-003/004/005` quedan `OBSERVED_OK` **sólo para A7** y los demás
actores `NOT_EXERCISED`; sólo varió el eje `accent`. Aparte, catálogo de armerías en el mismo tenant:
A1 `super_admin` 4 filas frente a A7 `encargado_almacen` 1 fila, con logins y logouts 200 —
**filtrado por scope de unidad**, **no** aislamiento entre tenants; se registra como observación,
**sin celdas nuevas**. Fuentes:
[`preferences-isolation-results.json`](./preferences-isolation-results.json),
[`armory-scope-isolation-results.json`](./armory-scope-isolation-results.json).

**Corte 2026-10-12 (cobertura ampliada de armerías).** Con el actor A1 (`super_admin`): alta
`POST /api/armorias/` **201** (id temporal 6, listado 4→5) y baja `DELETE /api/armorias/{id}/` **204**
(5→4, fila temporal ausente, `GET` de ficha **404**), logout **200** y cero registros dejados; con
A7, `PUT` **con valores distintos** observado: variación del nombre persistida y restaurada en la
misma corrida, con `PUT` 200 y `GET` confirmatorios. El logout de esa corrida no se completó por un
modal de editor abierto que intercepta el menú —**flujo del harness, no defecto de producto**— y el
logout de A7 sigue acreditado por corridas anteriores. Fuente:
[`armory-extended-coverage-results.json`](./armory-extended-coverage-results.json) y
`observations.armory_extended_coverage` de la matriz.

**Corte 2026-10-12 — fidelidad al Design System (evidencia de AC-8).** Contraste estático Dwarven-Spelunkers
más fixes verificados por el orquestador con `grep` y `pnpm --dir front build` exit 0: 398/398 bloques de
`theme-customizer.css` idénticos, tokens 33/33 del shell y 30/30 de Base UI, y `.topbar`/`.sidebar`/`.btn`
con variantes, `focus-visible` e `invalid` idénticos. **8 divergencias corregidas 1:1** (`.alert` padding,
margin, borde y `border-color` por variante; `.text-center` sin `!important`; `reduced-motion`; `--buf-check-border`
en oscuro; `--font-mono` y regla `code, pre, kbd, samp`; `--dashboard-scale: 1`), **4 justificadas como ya
alineadas** (el contraste inicial estaba equivocado) y **brechas restantes sin impacto visual ni consumidor**
(`--buf-check-border`/`--buf-switch-dot` del `:root` claro). La fidelidad 1:1 queda **restablecida a nivel de
valores CSS estáticos, no de píxeles renderizados**: sin navegador no se afirma paridad visual observada.
Reporte: [`ds-fidelity-comparison.md`](./ds-fidelity-comparison.md).

## Apéndice — fix de recarga de sesión (trazabilidad, 2026-10-12)

**Defecto reportado por el operador.** Un *hard reload* con sesión activa expulsaba a `/login` o a
`/contexto`.

**Causa.** Tenant e identidad vivían **sólo en memoria** (Pinia, sin persistencia por diseño). El
guard necesita `X-Tenant-Code` para `GET /api/auth/context/`, y nada portaba el tenant a través de
las recargas.

**Fix frontend** (`front/src/router/guards.ts`):

1. El `afterEach` del router escribe `?tenant=` en la barra de direcciones mediante
   `history.replaceState`, **sólo** con el historial real del navegador (`state.current` de vue-router):
   sin navegación adicional y sin almacenamiento local.
2. En rutas principal-only, ante identidad nula **con** tenant presente y **sin** ausencia acreditada, el
   guard espera `session.ensureContext()` —`GET /api/auth/context/` real con cookie— antes de expulsar a
   login. La **ausencia acreditada** (logout/purge) **no** se re-bootstrappea.
3. Login aterriza con `?tenant=`.

**Verificación.** `typecheck` limpio · **222/222 tests (14 archivos)** · `build` exit 0 · navegador real:
reload en `/almacen/armerias` y en `/cuenta` **conserva sesión y URL con tenant**; logout a `/login`
**sin** tenant y reload **sin** re-auth. Regresión cubierta por
`front/tests/focused/reload-session.test.ts` (4 casos).

**Nota de proceso.** Dos despachos a `Code Transmuter` para este fix agotaron su tiempo sin escribir
nada; lo implementó y verificó el orquestador. **Desviación declarada de su umbral de delegación.**

**Límites.** Es un fix de navegación/recarga y su regresión automatizada, **no** una certificación
integral: no revalida las celdas de la matriz, ni las brechas del Design System, ni el aislamiento de
tenant, que sigue sin ejercitarse. El estado global **no cambia**: `NOT_VERIFIED` / `NO_CUMPLIDO`.
