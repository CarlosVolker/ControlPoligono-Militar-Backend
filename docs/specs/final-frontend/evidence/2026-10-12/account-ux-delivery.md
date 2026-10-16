---
actualizado: 2026-10-12
---

# Entrega plan 2 (`/cuenta`) y plan 3 (correcciones UX) — trazabilidad y evidencia

> 🕯️ **Alcance.** `Lore Master`, 2026-10-12. Persistencia de trazabilidad (F6 documental) y de la
> evidencia de entrega observada de
> [`../../../frontend-account-self-service.md`](../../../frontend-account-self-service.md) y
> [`../../../../plans/frontend-ux-corrections.md`](../../../../plans/frontend-ux-corrections.md).
> No es auditoría, informe de revisor ni cierre funcional: **no se declara aceptación runtime**.
> Productos: identificadores legítimos, filas de acceso y evidencia ya comprobada por el
> orquestador (lectura y ejecución de comandos).

## 1. Índice

1. [Índice](#1-índice) · 2. [Decisión de identificadores](#2-decisión-de-identificadores) · 3. [`SCREEN-ACCOUNT-001`](#3-screen-account-001) · 4. [Fila de acceso](#4-fila-de-acceso) · 5. [Entrega plan 2](#5-entrega-plan-2--self-service-de-cuenta) · 6. [Entrega plan 3](#6-entrega-plan-3--correcciones-ux) · 7. [Comprobaciones](#7-comprobaciones) · 8. [Límites](#8-límites-de-lo-declarado)

---

## 2. Decisión de identificadores

Decisión del orquestador (2026-10-12): se asigna **`SCREEN-ACCOUNT-001`** a la nueva
superficie `/cuenta`, con los criterios **AC-1…AC-9** ya escritos en
[`frontend-account-self-service.md`](../../../frontend-account-self-service.md) §3 — **sin
renumerar** ni migrar los AC históricos del corpus `final-frontend/`.

> La numeración `AC-1…9` es **local a la spec de cuenta** y convive con los `AC-<familia>-<nnn>`
> de `final-frontend/verification.md` y los `AC-OP-*`/`AC-FL-*`/`AC-CORE-*` de
> `final-frontend/acceptance/coverage.md`: no se fusionan ni se reescriben, y cada AC se cita
> con el prefijo de su spec de origen.

---

## 3. `SCREEN-ACCOUNT-001`

| Campo | Valor |
|---|---|
| ID de pantalla | `SCREEN-ACCOUNT-001` (nuevo, independiente del catálogo de 36) |
| Ruta | `/cuenta` |
| Componente | `AccountView` (`front/src/views/account/AccountView.vue`) |
| Clasificación | **principal-only** — visible para todo principal autenticado, `requiresTenant:false`; no exige permisos |
| Criterios | `frontend-account-self-service.md` AC-1…AC-9 (§3) |
| Origen | Decisión del orquestador 2026-10-12; este documento **no** modifica `experience/screens.md` |
| Estado de verificación | `NOT_EXERCISED` (F7/AC-8 pendientes de observar el contrato) |

**Anclas de código observadas** (lectura por el orquestador, 2026-10-12):

| Ancla | Qué sostiene |
|---|---|
| `front/src/router/routes.ts:132-136` | Registro de `/cuenta` → `ROUTE_NAMES.ACCOUNT` → `AccountView`, con la clasificación principal-only documentada en el propio registro |
| `front/src/components/DashboardTopbar.vue:221-233` | Entrada «Mi cuenta» del desplegable de perfil, primer ítem, visible con principal autenticado |
| `front/src/features/account/useOwnAccount.ts:80-344` | Composable: identidad de sesión, contexto consolidado, lecturas propias por permiso y cambio de contraseña contra el contrato |
| `front/src/views/account/AccountView.vue` | Vista: datos de contexto, ficha acreditada, limitaciones declaradas, cambio de contraseña y limpieza de credenciales |

> Las líneas citadas son **puntos de entrada verificables**, no un inventario completo de la
> implementación. F2 puede ampliar anclas sin replantear esta entrada.

---

## 4. Fila de acceso

| Actor | Origen | Etiqueta | Destino | Condición | Fuentes |
|---|---|---|---|---|---|
| Principal autenticado | `DashboardTopbar.vue`, desplegable de perfil | **Mi cuenta** | `/cuenta` (`ROUTE_NAMES.ACCOUNT`) | `principalUserId !== null`; sin requisito de permisos ni de tenant | `front/src/components/DashboardTopbar.vue:221-233` · `front/src/router/routes.ts:132-136` · AC-6 de la spec de cuenta |

Convivencia: **«Mi ficha» conserva destino y visibilidad actuales**; la entrada nueva no la sustituye ni le cambia la condición. No hay segunda ruta de acceso a esta superficie.

---

## 5. Entrega plan 2 — self-service de cuenta

| Entrega | Observado |
|---|---|
| Ruta + guard | `/cuenta` con `requiresTenant:false`; la rama existente de identidad, contraseña forzada y retorno se reutiliza, sin bases nuevas |
| Composable | `useOwnAccount.ts`: estado efímero, control anti-carrera, lecturas propias condicionadas por permiso y cambio de contraseña contra el contrato |
| Vista | `AccountView.vue`: datos de contexto reales, ficha acreditada, limitaciones declaradas, cambio de contraseña y limpieza de credenciales |
| Topbar | «Mi cuenta» primero; «Mi ficha» preservada |
| Tests | `front/tests/focused/account-navigation.test.ts`, `account-surface.test.ts` |

**Lo que queda explícitamente pendiente:**

- **F7 / AC-8: `NOT_EXERCISED`.** No se observó la respuesta del contrato en el dataset
  objetivo dentro de un bloque autorizado; no hay evidencia de ese cierre.
- **AC-9 / capacidad ausente en backend:** la escritura de perfil propio no existe como
  capacidad del backend y **no se ocultó ni se simuló**: queda como limitación visible. El
  perfil propio editable **no se inventó** ni se afirmó. Sin secretos ni RUT real aquí.

---

## 6. Entrega plan 3 — correcciones UX

| Fase | Observado |
|---|---|
| F2 denegación accesible | Motivos visibles en lenguaje de usuario junto al control, referenciados con `aria-describedby`; **sin patrón `title`-only**. Gating intacto. `front/src/views/exercises/ExercisesView.vue:205-215,1887-1888,1931,2001-2003,2024,2037` · `front/src/views/shooting/ShootingView.vue:348,1788,1826,1867,1888` |
| F3 microcopy | Microcopy de cliente en español neutro en las superficies tocadas; el `detail` literal de un 403 del backend permanece **intocable** (ST-07) |
| F3 (parcial) `404` | `front/src/views/NotFoundView.vue:34-43` — título, texto y CTA en español (`Página no encontrada`, `Ir al inicio de sesión`, `Volver al inicio`) |
| F4 navegación única | Emit `navigate` / `legacySection`, estado `activeSection` y la prop atravesada por el shell **retirados**: `RouterLink` queda como única fuente y se conserva el cierre del sidebar móvil. `front/src/App.vue:537-552` · `front/src/components/DashboardSidebar.vue:275-286,348` |
| F5 barrera de apariencia | Mensajes, **retry** y salidas (`Revisar el contexto`, `Cerrar sesión`) en restauración/reconciliación. `front/src/views/appearance/PersonalizerView.vue:332-389`. **Sin bypass ni defaults ante fallo** (R-APAR-015 intacto) |
| F6 móviles/teclado | Comparado **por lectura** contra el Design System externo. **No se certifica WCAG ni pixel-perfect** |
| Tests | `front/tests/focused/denial-navigation.test.ts` |

**Reserva de traducción (señalada por el escritor, no resuelta aquí).** Quedan strings en
inglés residuales **fuera de los tramos alterados** por este plan (asociados al
personalizador/customizer). Este documento **no** afirma que exista o no prohibición normativa
de traducción —esa comprobación no se hizo en este encargo— ni **resuelve** un eventual
cambio en el Design System, que es la ley visual del proyecto y queda fuera de este encargo.

---

## 7. Comprobaciones

**Comandos ejecutados por el orquestador** desde `front/`, con salida real:

| Comando | Resultado |
|---|---|
| `pnpm typecheck` | exit 0 |
| `pnpm test:focused` | exit 0 — **12 archivos, 211 pruebas** |
| `pnpm build` | exit 0 — build generado |

> El conteo de **211 pruebas sobre 12 archivos es el conjunto transversal vigente** de
> `tests/focused/`. **No se suma** a las 187 del plan 1: es el mismo conjunto, no una suite independiente.

**Estado de servicios (observado, no es evidencia de flujo por actor):** frontend en
`localhost:5175` responde `200`; backend responde `403` en `auth/context` sin sesión, como se
esperaba. Los servicios estaban activos y autorizados para runtime. **Esto no demuestra el
flujo de API por actor**: el ejercicio autenticado por actor no se ha observado.

---

## 8. Límites de lo declarado

- **Ningún gate de revisor pasó.** No hay dictamen de seguridad, revisión de código ni de
  CSS/HTML: el operador revocó nuevas auditorías y ordenó ejecución inmediata. Los comandos
  en verde **no** equivalen a gate superado.
- **Ninguna aceptación runtime de `/cuenta`.** F7/AC-8 siguen `NOT_EXERCISED`.
- **Sin cierre** de ninguno de los dos planes, sin estado `done`, sin métrica de completitud.
- **No se modificó** `experience/screens.md`, `experience/navigation.md` ni el corpus histórico
  de criterios: `SCREEN-ACCOUNT-001` es entrada de trazabilidad nueva e independiente.
- La aceptación integral sigue en curso; su F2 no está construida y no se inventa evidencia
  runtime para ella.