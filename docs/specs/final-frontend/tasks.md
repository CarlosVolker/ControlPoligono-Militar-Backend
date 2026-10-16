---
spec_meta: "./spec-meta.yaml"
---

# Tasks — Frontend integral (índice canónico)

> 📖 Yo, Lore Master, sustituyo aquí las tareas genéricas anteriores por tareas completas
> y trazables del frontend entero: **99 tareas `T-FL-*`** (una por cada flujo canónico de
> [experience/flows.md](experience/flows.md)), **5 tareas `T-CORE-*`** de infraestructura
> TypeScript y **6 tareas gateadas `T-BE-APP-*`** del backend de apariencia (excepción
> acotada). Las decisiones y contenidos útiles de las tareas anteriores se conservan
> mediante la [tabla de equivalencias](#equivalencias-tareas-anteriores--nuevas); nada se
> borra de forma invisible. Este índice y sus volúmenes anidados bajo `tasks/` son
> documentación de la spec (**`approved`** desde el 2026-10-02): ninguna tarea se completa
> por crear documentación o aprobar un plan, y la ejecución vigente se rige por
> [completion-plan-2026-10-14.md](completion-plan-2026-10-14.md) (aprobado el 2026-10-14,
> `in-progress`; verificado 2026-10-15).

## Índice

1. [Baseline vs objetivo](#baseline-vs-objetivo)
2. [Reglas generales de la lista](#reglas-generales-de-la-lista)
3. [Convenciones de ID](#convenciones-de-id)
4. [Dependencias generales: DAG, propiedad de archivos y fan-out](#dependencias-generales-dag-propiedad-de-archivos-y-fan-out)
5. [Volúmenes de tareas por familia](#volúmenes-de-tareas-por-familia)
6. [Equivalencias: tareas anteriores → nuevas](#equivalencias-tareas-anteriores--nuevas)
7. [Cobertura OP → tarea (162)](#cobertura-op--tarea-162)
8. [Cobertura de requisitos R-DOM / R-SES / R-APAR (140)](#cobertura-de-requisitos-r-dom--r-ses--r-apar-140)
9. [Cobertura SCREEN → tarea (36)](#cobertura-screen--tarea-36)
10. [Reservas, huecos y gates declarados](#reservas-huecos-y-gates-declarados)
11. [Enlaces a entregables de otros writers](#enlaces-a-entregables-de-otros-writers)

---

## Baseline vs objetivo

**Baseline observado (hecho, sólo lectura, en esta sincronización).** `front/` contiene
hoy un **dashboard parcial de lectura** en Vue 3 + Pinia con código **JavaScript**:
`front/src/` suma 14 archivos (`api/dashboard.js`, `stores/dashboard.js`, `main.js`,
`App.vue`, 8 componentes, `styles/dashboard.css`); `front/package.json` declara
`vue 3.5.43`, `pinia 4.0.3`, `vite 8.3.1`, `@vitejs/plugin-vue 6.0.9` — **sin
vue-router y sin TypeScript**. El dashboard actual es parcial y **no comprobado** (no se
ejecutó navegador ni servidor en esta tarea). El baseline JS existente es un **hecho**,
no código TS migrado: la conversión es trabajo de las tareas, no un estado que se pueda
afirmar.

> 🕯️ **Superado 2026-10-15.** El bloque anterior es el snapshot histórico de esa
> sincronización. A hoy, `front/src/` está en **TypeScript** (38 `.vue` con `lang="ts"`,
> 34 `.ts`, 0 `.js`) y `vue-router 5.3.1` está instalado y en uso (`front/src/router/`);
> el «dashboard parcial de lectura» es hecho histórico, superado (verificado 2026-10-15).

**Objetivo (destino vigente del producto).** Frontend integral sobre **todas** las
funcionalidades reales que el backend expone — 162 OP de
[backend-inventory.md](backend-inventory.md), 99 FL de
[experience/flows.md](experience/flows.md), 36 SCREEN de
[experience/screens.md](experience/screens.md) — con stack aprobado: **TypeScript, no
JavaScript** (orden vigente del operador, 2026-10-02), Vue 3 `<script setup lang="ts">`,
Vue Router (obligatorio), Pinia en memoria, CSS vanilla y fidelidad 1:1 al Inume Design
System externo. Datos sólo del backend real; la personalización de apariencia de **8
ejes persistida por usuario contra la API** es obligatoria para el cierre entero (gate
[RV-01](#reservas-huecos-y-gates-declarados)).

La distancia entre ambos estados es exactamente el trabajo de estas 110 tareas; ninguna
está completada hoy.

---

## Reglas generales de la lista

Las reglas 1–6 de las tareas anteriores se conservan (R1–R6) y se amplían (R7–R12):

1. **R1 — Sin autorización no hay ejecución.** Ninguna tarea se ejecuta sin `approved_at`
   en [spec-meta.yaml](spec-meta.yaml) y orden explícita del operador. Documentar,
   aprobar un plan o crear este archivo **no** completa ninguna tarea: los `done when`
   son observables en el producto, nunca en la documentación.
2. **R2 — Backend: sólo la excepción acotada.** Únicamente `T-BE-APP-01…06`
   ([tasks/appearance.md](tasks/appearance.md)) tocan backend, schema o base de datos, y
   sólo dentro del alcance de preferencias de 8 ejes (ocho campos `ds_*`, una migración,
   un endpoint propio del usuario autenticado — nada más). Gate triple: spec aprobada +
   gate superado + orden explícita; la migración se aplica únicamente con esa orden. El
   backend en marcha en `127.0.0.1:8000` se reusa: no se levanta otro, ni se reinicia o
   detiene. Ninguna otra tarea modifica el backend.
3. **R3 — Dependencias y tooling.** `vue-router@5.3.1` es la única dependencia que esta
   spec autoriza a añadir, y sólo en `T-CORE-ROUTER`. Ninguna tarea introduce otra
   biblioteca ni Axios. La toolchain de TypeScript (compilador y comprobación de tipos)
   **no** queda autorizada por estos tomos: requiere aprobación explícita previa a la
   implementación; no se instalan ni se inventan versiones.
4. **R4 — Cero datos falsos.** Ninguna tarea introduce mocks, fixtures, datos de ejemplo
   ni registros sintéticos que simulen funcionalidad.
5. **R5 — Literales reales en UI.** Los códigos, choices y literales de contrato del
   backend **sí** se muestran en la UI: son valores reales, no datos ficticios
   (R-DAT-07 vía tomos citantes). Los mensajes del backend nunca se traducen, resumen ni
   convierten en otro estado.
6. **R6 — Huecos ajenos: reportar y detener.** Si una tarea descubre un hueco de backend
   ajeno a preferencias (D-02), se reporta y se detiene: no se rellena en cliente. Las
   capacidades sin endpoint no autorizan features, botones ni pantallas.
7. **R7 — Memoria solamente.** Todo estado vive en memoria (Pinia): prohibidos
   `localStorage`, `sessionStorage`, cookies de estado, hash y rehidratación para
   negocio, sesión, permisos o apariencia (R-SES-016, R-APAR-007); sin caché persistente
   de datos; PII visible en pantalla pero nunca en logs ni artefactos del cliente
   (R-SES-018).
8. **R8 — DS literal 1:1.** El Inume Design System externo es la ley visual: cada valor
   se transcribe con referencia archivo:línea de origen; la única adaptación permitida es
   la que la plataforma no puede expresar, y se reporta y justifica explícitamente,
   jamás en silencio. La comparación visual contra el DS **no está autorizada** por
   estos tomos (ver §Reservas).
9. **R9 — Ausencia, vacío, error y denegación son cuatro cosas.** Campo ausente ⇒ `—`;
   `200` con array vacío ⇒ ST-03, distinto de ST-04 (error) y de ST-07 (denegación);
   nunca `0` inventado. Sin paginación, filtros ni orden de backend inventados
   (G-SES-3): búsqueda/orden/selección client-side sobre arrays planos.
10. **R10 — Autoridad del backend.** La UI anticipa visibilidad sólo con
    `context.permissions` y la presencia del dato; ninguna entrada de menú ni botón
    acredita autorización; un `403` es denegación visible (F-02/ST-07) o fin de sesión
    (F-12) según `detail` y contexto — jamás dato vacío. El cliente no reimplementa el
    orden de evaluación de permisos.
11. **R11 — No duplicar la fuente.** Ninguna tarea copia pasos de flujo ni shapes de
    payload: citan su ancla `FL-*` y su contrato. Un solo hogar canónico por `AC-OP-*`;
    las demás tareas referencian.
12. **R12 — Honestidad de estado.** Ninguna entrega afirma runtime, tests, autorizaciones
    ni verificaciones no ocurridas. La verificación observable pertenece a
    [verification.md](verification.md) (entregable de otro writer; enlace previsto).

---

## Convenciones de ID

| Familia de ID | Regla | Ejemplo |
|---|---|---|
| `T-FL-<FAM>-NNN` | Una tarea por flujo canónico; misma numeración que su `FL-*` (1:1, 99 tareas) | `FL-SES-001` → `T-FL-SES-001` |
| `T-CORE-*` | Infraestructura TypeScript previa a los dominios: `TYPES`, `HTTP`, `SESSION`, `ROUTER`, `UI` (5 tareas) | `T-CORE-HTTP` |
| `T-BE-APP-NN` | Backend gateado de la excepción acotada de apariencia (6 tareas; conservan T-30…T-35 anteriores) | `T-BE-APP-04` |
| `AC-OP-<ID>` | Criterio de aceptación por operación real del inventario; **hogar canónico único** por OP (162 cubiertas); otras tareas la referencian sin duplicar | `AC-OP-AUT-001` en `T-FL-SES-001` |
| `AC-FL-<ID>` | Criterio de flujos **sin OP o con ruta propuesta**: `AC-FL-SES-006` y `AC-FL-APP-001…007` (8 criterios) | `AC-FL-APP-002` |
| `AC-CORE-<TASK>-NN` | Criterios de infraestructura (32 en [tasks/core-infra.md](tasks/core-infra.md)) | `AC-CORE-HTTP-02` |
| `AC-BE-APP-NN` | Criterios del backend gateado (6) | `AC-BE-APP-05` |
| Reserva de OP | OP sin flujo propio adscrita a la tarea más próxima con nota explícita en la tarea y en §Reservas | `OP-LES-001` → `T-FL-SHT-005` |

`PUT`/`PATCH` sobre el mismo recurso comparten editor y **ambas** OP quedan trazadas
(convención de [experience/screens.md](experience/screens.md)); no se cuenta como hueco.

---

## Dependencias generales: DAG, propiedad de archivos y fan-out

### Niveles del DAG

```text
Nivel 0  T-CORE-TYPES ──────────────────────────────┐ (tipos de contrato de los 5 dominios + apariencia)
Nivel 1  T-CORE-HTTP ← TYPES                        │
Nivel 2  T-CORE-SESSION ← HTTP                      │
Nivel 3  T-CORE-ROUTER ← SESSION;  T-CORE-UI ← TYPES+SESSION(+ROUTER)
Nivel 4  Familias de dominio en paralelo (cada ← lane core):
         sesión · recuperación+identidad · organización · autorización · almacén+ejercicios · tiro
Nivel 5  Apariencia FE (T-FL-APP-001…004) ← T-BE-APP-01…06 (gate: spec aprobada + orden)
         T-FL-APP-005/006/007/008 no requieren el gate (conducta local / ruta legacy existente)
```

Regla de consumo cruzado: **depender del catálogo API de otro dominio no requiere
completar la UI de ese dominio.** Los selectores consumen el módulo `api/<dominio>.ts`
(firmas sobre los tipos de T-CORE-TYPES); si el módulo de otra lane aún no existe, el
orquestador ordena la dependencia a nivel de módulo (arista DAG api-only) — nunca se
inventa un catálogo local, hardcodeado ni un cliente duplicado.

### Propiedad de archivos (write sets disjuntos por lane)

| Lane (writer) | Archivos propios (probables, raíz `front/src/`) |
|---|---|
| **L0 — core (secuencial, único)** | `types/*`, `api/http.ts`, `stores/session.ts` (+permisos), `router/*`, `App.vue`, `main.ts`, `styles/*`, `components/ui/*`, `components/shell/*`, `views/NotFoundView.vue`, `views/ContextLostView.vue` |
| **L1 — sesión y contexto** | `api/auth.ts`, `api/dashboard.ts`, `views/auth/LoginView.vue`, `views/context/*`, `views/DashboardView.vue`, `components/context/*` |
| **L2 — organización** | `api/organization.ts`, `stores/organization.ts`, `views/organizacion/{Units,UnitDetail,Precincts,PrecinctDetail}View.vue`, `components/organization/*` |
| **L3 — identidad + recuperación/contraseña** | `api/identity.ts`, `stores/identity.ts`, `views/personas/*`, `views/organizacion/{Positions,PositionDetail,Memberships}View.vue`, `views/auth/{Recovery,PasswordRequired}View.vue`, `components/identity/*` |
| **L4 — autorización y auditoría** | `api/authorization.ts`, `stores/authorization.ts`, `views/autorizacion/*`, `views/auditoria/*`, `components/authorization/*` |
| **L5 — almacén + ejercicios** | `api/armory.ts`, `stores/armory.ts`, `views/almacen/*`, `api/exercises.ts`, `stores/exercises.ts`, `views/tiro/{Exercises,ExerciseDetail,AmmoConsumption,WeaponConsumption}View.vue`, `components/armory/*`, `components/exercises/*` |
| **L6 — tiro (lecciones + captura)** | `api/shooting.ts`, `stores/shooting.ts`, `views/tiro/{Ranges,RangeDetail,Lessons,LessonDetail,FractionDetail,ResultsCapture}View.vue`, `components/shooting/*` |
| **LA — apariencia (secuencial, tras gate)** | `api/appearance.ts`, `api/appearance-legacy.ts`, `stores/appearance.ts`, `views/personalizador/*`, `components/appearance/*`, `composables/useTheme*` — el gancho de arranque en `main.ts` es handoff secuencial L0↔LA (archivo compartido: un solo writer a la vez) |

L3 agrupa identidad y recuperación/contraseña porque comparten
`views/personas/UserDetailView.vue` (paneles de asignaciones y credenciales): archivos
compartidos ⇒ un writer secuencial, nunca dos lanes sobre el mismo archivo. L5 agrupa
almacén y ejercicios por los selectores de calibre/arma de los consumos. Las rutas de
`views/tiro/` se partitionan por archivo entre L5 y L6 sin solape.

### Fan-out 2–6

Con L0 completada (o con sus interfaces publicadas), hasta **6 lanes de dominio en
paralelo** con write sets disjuntos por archivo; apariencia entra como lane secuencial
adicional sólo tras el gate de backend; este `tasks.md` y los archivos compartidos los
integra **un solo writer secuencial**. Cualquier solape sobrevenido se reencuadra como
fase secuencial de integración, no se negocia entre lanes.

---

## Volúmenes de tareas por familia

110 tareas: 5 `T-CORE` + 99 `T-FL` + 6 `T-BE-APP`.

| Volumen | Tareas | Familias FL | OP con hogar canónico |
|---|---|---|---|
| [tasks/core-infra.md](tasks/core-infra.md) | 5 T-CORE | — (infraestructura) | OP-AUT-006 (infra) |
| [tasks/session-context.md](tasks/session-context.md) | 6 | SES | AUT-001/002/003/005 |
| [tasks/recovery-password.md](tasks/recovery-password.md) | 6 | RCV, PWD | RCV-001…004, USR-013…016 |
| [tasks/organization.md](tasks/organization.md) | 12 | ORG | UNT-001…010, RCT-001…008 |
| [tasks/identity.md](tasks/identity.md) | 17 | IDT | USR-001…012, POS-001…009, MEM-001…006 |
| [tasks/authorization.md](tasks/authorization.md) | 14 | AZ, AUD | ROL, SCP, PRM, RPR, PPR, OVR, AZC-001…004, AUT-004 |
| [tasks/armory-weapons.md](tasks/armory-weapons.md) | 9 | ARM, WPN, CAL | ARM-001…006, WPN-001…006, CAL-001…006 |
| [tasks/shooting-lessons.md](tasks/shooting-lessons.md) | 12 | SHT-001…012 | RNG-001…007, LES-001…012 |
| [tasks/shooting-capture.md](tasks/shooting-capture.md) | 7 | SHT-013…019 | FRC-001…008, RES-001…006 |
| [tasks/exercises.md](tasks/exercises.md) | 8 | EXC, CMN, CAR | EJR-001…006, CMN-001…006, CAR-001…006 |
| [tasks/appearance.md](tasks/appearance.md) | 8 T-FL + 6 T-BE | APP | PRF-001/002 (+ ruta propuesta, no OP) |

Cada volumen abre con un **bloque común** (dependencias, archivos probables, reservas de
familia) y cada tarea declara: objetivo, flujo citado, OP con AC canónicos, SCREEN,
requisitos, precondiciones/dependencias específicas, archivos probables `.ts`/`.vue` con
`lang="ts"`, gates propios, criterios `AC-*` y `done when` observable.

---

## Equivalencias: tareas anteriores → nuevas

Las 75 tareas anteriores (T-00…T-146, con T-19b y los bloques T-30…T-35, T-40…T-51) se
sustituyen conservando su contenido útil. La historia no se borra: esta tabla es el
registro de la sustitución.

| ID anterior | Contenido conservado | Destino nuevo |
|---|---|---|
| T-00 | Decisión D-02 sobre capacidades sin endpoint | **No es tarea:** reserva [RV-02](#reservas-huecos-y-gates-declarados) (decisión del operador; no bloqueante) |
| T-10 | Cliente `fetch` con cabeceras, `403`/`429`/red | T-CORE-HTTP |
| T-11 | Store de sesión: login, contexto, logout, expiración, purga | T-CORE-SESSION |
| T-12 | Anti-carrera por `generation` | T-CORE-SESSION + T-CORE-HTTP (AC-CORE-SESSION-03, AC-CORE-HTTP-05) |
| T-14 | Vista de login con institución + selector de unidad y sus dos `403` | T-FL-SES-001 + T-FL-SES-003 |
| T-15 | Cambio forzado bloqueante | T-FL-PWD-001 |
| T-16 | Wizard de recuperación de 4 pasos con campos reales | T-FL-RCV-001 |
| T-19 | `vue-router@5.3.1` dependencia exacta + tabla de rutas | T-CORE-ROUTER (R3) |
| T-19b | `App.vue` con `RouterView`; `RouterLink`/`useRoute` | T-CORE-ROUTER |
| T-20 | Guards: espera de contexto, redirect, bloqueo, contexto perdido, 404 | T-CORE-ROUTER |
| T-21 | Params `idLeccion`, `idFraccion`, `idUsuario`, `idArma`, `idPoligono`, `idPosicion`; entrada directa y back/forward | T-CORE-ROUTER + vistas de detalle de cada familia |
| T-22 | Sonda `GET /api/protected/` (no pantalla) | T-CORE-SESSION (AC-CORE-SESSION-04 / AC-OP-AUT-006) |
| T-23 | Pantalla de auditoría con `limit` ≤ 500 y aviso de truncamiento | T-FL-AUD-001 |
| T-30…T-35 | Backend de preferencias: campos `ds_*`, constraints, migración, vista, validación, integridad legacy | T-BE-APP-01…06 (gate triple, R2) |
| T-40 | `api/appearance.ts` + validación contra catálogo | T-FL-APP-001/002 (catálogo SSOT: customizer-catalog.md) |
| T-41 | `stores/appearance.ts` con `saving`/`saved`/`error`, sin storage | T-FL-APP-002 |
| T-42 | Panel de 8 ejes con anatomía DS | T-FL-APP-002 |
| T-43 | Radiogroup: teclado y tabindex rotatorio | T-FL-APP-002 |
| T-44 | `apply()`: semántica de presencia/ausencia de atributo | T-FL-APP-002 |
| T-45 | Autosave: debounce, vuelo único, instantánea, orden PUT/DELETE | T-FL-APP-002 |
| T-46 | Aborto/descarte/vaciado en logout y cambio de principal; unidad conserva | T-FL-APP-005 + T-FL-APP-006 |
| T-47 | Restauración antes de ready; defaults públicos sin persistir | T-FL-APP-001 + T-FL-APP-007 |
| T-48 | Tipografías bajo demanda con `<link>` deduplicado | T-FL-APP-002 |
| T-49 | Remapeo idempotente de 44 conceptos entre 7 familias | T-FL-APP-002 |
| T-50 | Atribución de licencia `fa7-solid` conservada | T-FL-APP-002 |
| T-51 | `403` de preferencias sin cierre automático de sesión | T-FL-APP-004 |
| T-60 | Store de permisos desde contexto + catálogos authz | T-CORE-SESSION (+ T-FL-AZ-010/011) |
| T-61 | Menú lateral por dominios condicionado por permiso | T-CORE-UI |
| T-70 | Listado de unidades con árbol client-side | T-FL-ORG-001 |
| T-71 | Alta/edición de unidad con 10 `unit_type`; raíz sólo admin | T-FL-ORG-002/003 |
| T-72 | Previsualización de eliminación con 8 contadores | T-FL-ORG-004 |
| T-73 | Eliminación con migración y destino explícito | T-FL-ORG-005 |
| T-74 | Recintos: CRUD + `agregar-unidad`/`quitar-unidad` | T-FL-ORG-008…012 |
| T-75 | Selectores sobre `lookup` y `assignable-units` | T-FL-ORG-006/007 |
| T-80 | Listado de personas con estados `—`/vacío/error/denied | T-FL-IDT-001 |
| T-81 | Ficha de persona con asignaciones y rol implícito | T-FL-IDT-001 (+ panel de bloqueo T-FL-PWD-004) |
| T-82 | Acciones de asignación: principal, desactivar, agregar, quitar | T-FL-IDT-007…010 |
| T-83 | Alta formal con campos iniciales y advertencia de promoción | T-FL-IDT-002/003 |
| T-84 | Tirador temporal con campos reales | T-FL-IDT-004 |
| T-85 | Cambio y reseteo de contraseña con reglas self/otro | T-FL-PWD-001/002/003 |
| T-86 | Bloqueo y desbloqueo de cuenta | T-FL-PWD-004/005 |
| T-87 | Puestos: CRUD por códigos, holders, histórico | T-FL-IDT-011…015 |
| T-88 | Memberships con permisos derivados `(position, action)` | T-FL-IDT-016/017 |
| T-89 | Roles: lectura abierta, escritura TAdmin | T-FL-AZ-001…003 |
| T-90 | Scopes y catálogo de permisos en lectura | T-FL-AZ-004 |
| T-91 | Matrices rol/puesto y overrides; bloqueo de roles de sistema | T-FL-AZ-005…009 |
| T-92 | Panel personas por unidad + selector de destino | T-FL-AZ-012/013 |
| T-100 | Armerías con `armas_count` y regla de unidad | T-FL-ARM-001…003 |
| T-101 | Armas con `*_code_write`, choices y unicidad de serie | T-FL-WPN-001…004 |
| T-102 | Calibres con mutación `super_admin` | T-FL-CAL-001/002 |
| T-110 | Polígonos con lecciones anidadas | T-FL-SHT-001…004 |
| T-111 | Lecciones: alta/edición con participantes y valor efectivo | T-FL-SHT-005/006 |
| T-112 | Pestaña de fracciones | T-FL-SHT-008 + T-FL-SHT-013 |
| T-113 | Pestaña de tiradores | T-FL-SHT-008 |
| T-114 | Captura por carril con tres unicidades | T-FL-SHT-015/016 |
| T-115 | Detalle de resultados: `403` de scope ≠ «sin resultados»; B-01 | T-FL-SHT-009/019 |
| T-116 | Resumen y reporte con `aggregate_only` | T-FL-SHT-010/011 |
| T-117 | Fracciones: `tiradores` y detalle de `resultados` | T-FL-SHT-019 (+ T-FL-SHT-015) |
| T-118 | `tiradores-elegibles` como selector | T-FL-SHT-012 |
| T-119 | Rotulación de alcance restringido del tirador | T-FL-SHT-005/008 (referenciado en SHT-001/009) |
| T-130 | Ejercicios con 5 unidades participantes y tipo real | T-FL-EXC-001…003 |
| T-131 | Consumos de munición con calibre por código | T-FL-CMN-001…003 |
| T-132 | Consumos de arma enlazados | T-FL-CAR-001/002 |
| T-140 | Tokens del DS transcritos literalmente con archivo:línea | T-CORE-UI |
| T-141 | Bloques `data-accent` (27), `data-bg`×tema (26×2), radius, iconfam, font, ambcolor | T-CORE-UI |
| T-142 | Componentes: card, stat-grid, tabla, tabs, modal, toast, badge, estados | T-CORE-UI |
| T-143 | Estados `—`/vacío/error/denied en listados y fichas | T-CORE-UI (componentes) + cada familia (aplicación) |
| T-144 | Confirmaciones destructivas con mensaje literal | T-CORE-UI (ST-10) + familias destructoras |
| T-145 | Ausencia de persistencia de credenciales y PII | T-CORE-SESSION + T-CORE-HTTP (R7) |
| T-146 | Comparación visual contra el DS — no autorizada | **No es tarea:** gate [RV-08](#reservas-huecos-y-gates-declarados) (criterio V-70 en verification.md, otro writer) |

---

## Cobertura OP → tarea (162)

Hogar canónico de cada `AC-OP-*`. Universo: 161 OP de negocio + `OP-AUT-006` de
infraestructura ([backend-inventory.md](backend-inventory.md) §Universo contado). Verificado por
diferencia de conjuntos contra el inventario en esta sincronización: **162/162, sin
faltantes**. Las OP marcadas con † son reservas declaradas (sin FL propio).

| OP | Tarea con AC canónico | Volumen |
|---|---|---|
| OP-AUT-001 | T-FL-SES-001 | session-context |
| OP-AUT-002 | T-FL-SES-002 | session-context |
| OP-AUT-003 | T-FL-SES-003 (referenciado en SES-004) | session-context |
| OP-AUT-004 | T-FL-AUD-001 | authorization |
| OP-AUT-005 | T-FL-SES-005 | session-context |
| OP-AUT-006 | T-CORE-SESSION † (infraestructura, sin pantalla) | core-infra |
| OP-RCV-001…004 | T-FL-RCV-001 | recovery-password |
| OP-USR-001, OP-USR-003 | T-FL-IDT-001 | identity |
| OP-USR-002 | T-FL-IDT-002 (faceta promoción: T-FL-IDT-003) | identity |
| OP-USR-004/005 | T-FL-IDT-005 | identity |
| OP-USR-006 | T-FL-IDT-006 | identity |
| OP-USR-007/008 | T-FL-IDT-007 | identity |
| OP-USR-009 | T-FL-IDT-008 | identity |
| OP-USR-010 | T-FL-IDT-009 | identity |
| OP-USR-011 | T-FL-IDT-010 | identity |
| OP-USR-012 | T-FL-IDT-004 | identity |
| OP-USR-013 | T-FL-PWD-001 (modo propio voluntario: T-FL-PWD-002) | recovery-password |
| OP-USR-014 | T-FL-PWD-003 | recovery-password |
| OP-USR-015 | T-FL-PWD-004 | recovery-password |
| OP-USR-016 | T-FL-PWD-005 | recovery-password |
| OP-UNT-001, OP-UNT-003 | T-FL-ORG-001 | organization |
| OP-UNT-002 | T-FL-ORG-002 | organization |
| OP-UNT-004/005 | T-FL-ORG-003 | organization |
| OP-UNT-006 | T-FL-ORG-005 † (flujo canónico: 007/008) | organization |
| OP-UNT-007 | T-FL-ORG-004 | organization |
| OP-UNT-008 | T-FL-ORG-005 | organization |
| OP-UNT-009 | T-FL-ORG-006 | organization |
| OP-UNT-010 | T-FL-ORG-007 | organization |
| OP-RCT-001, OP-RCT-003 | T-FL-ORG-008 | organization |
| OP-RCT-002/004/005 | T-FL-ORG-009 | organization |
| OP-RCT-006 | T-FL-ORG-010 | organization |
| OP-RCT-007 | T-FL-ORG-011 | organization |
| OP-RCT-008 | T-FL-ORG-012 | organization |
| OP-POS-001/003/009 | T-FL-IDT-011 | identity |
| OP-POS-002/004/005 | T-FL-IDT-012 | identity |
| OP-POS-006 | T-FL-IDT-013 | identity |
| OP-POS-007 | T-FL-IDT-014 | identity |
| OP-POS-008 | T-FL-IDT-015 | identity |
| OP-MEM-001†, OP-MEM-002, OP-MEM-003†, OP-MEM-004/005 | T-FL-IDT-016 | identity |
| OP-MEM-006 | T-FL-IDT-017 (referencia MEM-004/005) | identity |
| OP-ARM-001/003 | T-FL-ARM-001 | armory-weapons |
| OP-ARM-002/004/005 | T-FL-ARM-002 | armory-weapons |
| OP-ARM-006 | T-FL-ARM-003 | armory-weapons |
| OP-WPN-001/003 | T-FL-WPN-001 | armory-weapons |
| OP-WPN-002 | T-FL-WPN-002 | armory-weapons |
| OP-WPN-004/005 | T-FL-WPN-003 | armory-weapons |
| OP-WPN-006 | T-FL-WPN-004 | armory-weapons |
| OP-CAL-001/003 | T-FL-CAL-001 | armory-weapons |
| OP-CAL-002/004/005/006 | T-FL-CAL-002 | armory-weapons |
| OP-RNG-001/003 | T-FL-SHT-001 | shooting-lessons |
| OP-RNG-002/004/005 | T-FL-SHT-002 | shooting-lessons |
| OP-RNG-006 | T-FL-SHT-003 (restringida: sin mapa `range:delete`) | shooting-lessons |
| OP-RNG-007 | T-FL-SHT-004 | shooting-lessons |
| OP-LES-001†, OP-LES-002 | T-FL-SHT-005 | shooting-lessons |
| OP-LES-003† | T-FL-SHT-008 | shooting-lessons |
| OP-LES-004/005 | T-FL-SHT-006 | shooting-lessons |
| OP-LES-006 | T-FL-SHT-007 | shooting-lessons |
| OP-LES-007/008 | T-FL-SHT-008 | shooting-lessons |
| OP-LES-009 | T-FL-SHT-009 (riesgo B-01) | shooting-lessons |
| OP-LES-010 | T-FL-SHT-010 | shooting-lessons |
| OP-LES-011 | T-FL-SHT-011 | shooting-lessons |
| OP-LES-012 | T-FL-SHT-012 | shooting-lessons |
| OP-FRC-001†, OP-FRC-002/004/005 | T-FL-SHT-013 | shooting-capture |
| OP-FRC-003† | T-FL-SHT-015 (compartido con ficha en SHT-019) | shooting-capture |
| OP-FRC-006 | T-FL-SHT-014 | shooting-capture |
| OP-FRC-007 | T-FL-SHT-015 | shooting-capture |
| OP-FRC-008 | T-FL-SHT-019 | shooting-capture |
| OP-RES-001†, OP-RES-002 | T-FL-SHT-016 | shooting-capture |
| OP-RES-003†, OP-RES-004/005 | T-FL-SHT-017 | shooting-capture |
| OP-RES-006 | T-FL-SHT-018 | shooting-capture |
| OP-ROL-001/003 | T-FL-AZ-001 | authorization |
| OP-ROL-002/004/005 | T-FL-AZ-002 | authorization |
| OP-ROL-006 | T-FL-AZ-003 | authorization |
| OP-SCP-001/002, OP-PRM-001/002 | T-FL-AZ-004 | authorization |
| OP-RPR-001…006 | T-FL-AZ-005 | authorization |
| OP-PPR-001…006 | T-FL-AZ-006 | authorization |
| OP-OVR-002/004/005 | T-FL-AZ-007 | authorization |
| OP-OVR-006 | T-FL-AZ-008 | authorization |
| OP-OVR-001/003 | T-FL-AZ-009 | authorization |
| OP-AZC-001 | T-FL-AZ-010 | authorization |
| OP-AZC-002 | T-FL-AZ-011 | authorization |
| OP-AZC-003 | T-FL-AZ-012 | authorization |
| OP-AZC-004 | T-FL-AZ-013 | authorization |
| OP-EJR-001/003 | T-FL-EXC-001 | exercises |
| OP-EJR-002/004/005 | T-FL-EXC-002 | exercises |
| OP-EJR-006 | T-FL-EXC-003 | exercises |
| OP-CMN-001/003 | T-FL-CMN-001 | exercises |
| OP-CMN-002/004/005 | T-FL-CMN-002 | exercises |
| OP-CMN-006 | T-FL-CMN-003 | exercises |
| OP-CAR-001†, OP-CAR-002, OP-CAR-003†, OP-CAR-004/005 | T-FL-CAR-001 | exercises |
| OP-CAR-006 | T-FL-CAR-002 | exercises |
| OP-PRF-001/002 | T-FL-APP-008 (legacy, separada de los 8 ejes) | appearance |
| Ruta propuesta 8 ejes (no OP) | T-FL-APP-001…004 vía AC-FL + T-BE-APP-01…06 | appearance |

---

## Cobertura de requisitos R-DOM / R-SES / R-APAR (140)

92 `R-DOM-*` + 25 `R-SES-*` + 23 `R-APAR-*` de los tomos entregados de
[requirements/](requirements/). Cobertura completa; el hogar es la tarea donde el
requisito es criterio observable (otras tareas lo referencian).

### R-DOM-ORG (17) → [tasks/organization.md](tasks/organization.md)

| Requisito | Tarea |
|---|---|
| R-DOM-ORG-001/002 | T-FL-ORG-001 |
| R-DOM-ORG-003 | T-FL-ORG-007 (+ ORG-002/005 consumidores) |
| R-DOM-ORG-004/005/006 | T-FL-ORG-002 (+ ORG-003 en edición) |
| R-DOM-ORG-007 | T-FL-ORG-006 |
| R-DOM-ORG-008 | T-FL-ORG-004 |
| R-DOM-ORG-009/010/011 | T-FL-ORG-005 |
| R-DOM-ORG-012 | T-FL-ORG-008 |
| R-DOM-ORG-013/014 | T-FL-ORG-009 |
| R-DOM-ORG-015 | T-FL-ORG-011 |
| R-DOM-ORG-016 | T-FL-ORG-012 |
| R-DOM-ORG-017 | T-FL-ORG-010 |

### R-DOM-ID (19) → [tasks/identity.md](tasks/identity.md) y [tasks/recovery-password.md](tasks/recovery-password.md)

| Requisito | Tarea |
|---|---|
| R-DOM-ID-001 | T-FL-IDT-001 |
| R-DOM-ID-002 | T-FL-IDT-002 (+ IDT-005) |
| R-DOM-ID-003 | T-FL-IDT-002/003 |
| R-DOM-ID-004 | T-FL-IDT-004 (referenciado en T-FL-SHT-015) |
| R-DOM-ID-005 | T-FL-IDT-007 |
| R-DOM-ID-006 | T-FL-IDT-008 |
| R-DOM-ID-007 | T-FL-IDT-009 |
| R-DOM-ID-008 | T-FL-IDT-010 |
| R-DOM-ID-009 | T-FL-PWD-001/002 |
| R-DOM-ID-010 | T-FL-PWD-003 |
| R-DOM-ID-011 | T-FL-PWD-004/005 |
| R-DOM-ID-012 | T-FL-IDT-006 |
| R-DOM-ID-013 | T-FL-IDT-011 |
| R-DOM-ID-014/015 | T-FL-IDT-012 |
| R-DOM-ID-016 | T-FL-IDT-014 |
| R-DOM-ID-017 | T-FL-IDT-015 (+ histórico en IDT-011) |
| R-DOM-ID-018 | T-FL-IDT-016 |
| R-DOM-ID-019 | T-FL-IDT-016/017 |

### R-DOM-AZ (10) → [tasks/authorization.md](tasks/authorization.md)

| Requisito | Tarea |
|---|---|
| R-DOM-AZ-001 | T-FL-AZ-002 (+ AZ-001 lectura, AZ-003 baja) |
| R-DOM-AZ-002 | T-FL-AZ-004 |
| R-DOM-AZ-003 | T-FL-AZ-005 |
| R-DOM-AZ-004 | T-FL-AZ-006 |
| R-DOM-AZ-005 | T-FL-AZ-007 (+ AZ-009 lectura) |
| R-DOM-AZ-006 | T-FL-AZ-010 |
| R-DOM-AZ-007 | T-FL-AZ-011 (+ análogo en AZ-001) |
| R-DOM-AZ-008 | T-FL-AZ-012 |
| R-DOM-AZ-009 | T-FL-AZ-013 |
| R-DOM-AZ-010 | T-FL-AUD-001 |

### R-DOM-ARM (12) → [tasks/armory-weapons.md](tasks/armory-weapons.md)

| Requisito | Tarea |
|---|---|
| R-DOM-ARM-001 | T-FL-ARM-001 |
| R-DOM-ARM-002/003 | T-FL-ARM-002 |
| R-DOM-ARM-004 | T-FL-ARM-003 (+ ARM-002) |
| R-DOM-ARM-005 | T-FL-WPN-001 |
| R-DOM-ARM-006 | T-FL-WPN-002 |
| R-DOM-ARM-007 | T-FL-WPN-003 |
| R-DOM-ARM-008 | T-FL-WPN-002 (+ WPN-003) |
| R-DOM-ARM-009 | T-FL-WPN-004 |
| R-DOM-ARM-010 | T-FL-CAL-001 |
| R-DOM-ARM-011 | T-FL-CAL-002 (+ lectura sin mutación en CAL-001) |
| R-DOM-ARM-012 | T-FL-CAL-002 |

### R-DOM-SHT (20) → [tasks/shooting-lessons.md](tasks/shooting-lessons.md) y [tasks/shooting-capture.md](tasks/shooting-capture.md)

| Requisito | Tarea |
|---|---|
| R-DOM-SHT-001 | T-FL-SHT-001 |
| R-DOM-SHT-002 | T-FL-SHT-002 |
| R-DOM-SHT-003 | T-FL-SHT-003 |
| R-DOM-SHT-004 | T-FL-SHT-004 |
| R-DOM-SHT-005 | T-FL-SHT-005 (+ rotulación en SHT-001/008/009) |
| R-DOM-SHT-006/007 | T-FL-SHT-005 (+ SHT-006 edición) |
| R-DOM-SHT-008 | T-FL-SHT-007 |
| R-DOM-SHT-009 | T-FL-SHT-008 |
| R-DOM-SHT-010 | T-FL-SHT-009 |
| R-DOM-SHT-011 | T-FL-SHT-010 |
| R-DOM-SHT-012 | T-FL-SHT-011 |
| R-DOM-SHT-013 | T-FL-SHT-012 |
| R-DOM-SHT-014 | T-FL-SHT-013 |
| R-DOM-SHT-015 | T-FL-SHT-014 |
| R-DOM-SHT-016 | T-FL-SHT-015 |
| R-DOM-SHT-017/018 | T-FL-SHT-016 (+ SHT-017 edición) |
| R-DOM-SHT-019 | T-FL-SHT-019 |
| R-DOM-SHT-020 | T-FL-SHT-018 |

### R-DOM-EXC (14) → [tasks/exercises.md](tasks/exercises.md)

| Requisito | Tarea |
|---|---|
| R-DOM-EXC-001 | T-FL-EXC-001 |
| R-DOM-EXC-002/003/004 | T-FL-EXC-002 |
| R-DOM-EXC-005 | T-FL-EXC-003 |
| R-DOM-EXC-006 | T-FL-CMN-001 |
| R-DOM-EXC-007/008 | T-FL-CMN-002 |
| R-DOM-EXC-009 | T-FL-CMN-003 (+ CMN-002) |
| R-DOM-EXC-010/011/012 | T-FL-CAR-001 |
| R-DOM-EXC-013 | T-FL-CAR-002 |
| R-DOM-EXC-014 | Reservas RV-01/RV-02 + regla de familia en shooting-capture y exercises (hueco se reporta, no se simula) |

### R-SES (25) → [tasks/core-infra.md](tasks/core-infra.md) y [tasks/session-context.md](tasks/session-context.md)

| Requisito | Tarea |
|---|---|
| R-SES-001…004 | T-CORE-HTTP |
| R-SES-005 | T-FL-SES-001 (+ re-captura en T-FL-SES-003) |
| R-SES-006 | T-CORE-SESSION (+ T-FL-SES-004) |
| R-SES-007 | T-CORE-SESSION |
| R-SES-008 | T-CORE-UI (menú) + T-CORE-SESSION (fuente) |
| R-SES-009 | T-CORE-SESSION (regla común de selectores; aplica a toda familia con selector) |
| R-SES-010/011 | T-CORE-HTTP (+ T-FL-SES-006) |
| R-SES-012 | T-CORE-HTTP (+ T-FL-APP-004) |
| R-SES-013/014 | T-CORE-HTTP |
| R-SES-015/016 | T-CORE-SESSION |
| R-SES-017 | T-FL-SES-004 (+ T-FL-APP-006) |
| R-SES-018 | T-CORE-SESSION (+ T-FL-AUD-001) |
| R-SES-019 | T-FL-SES-005 (+ purga en T-CORE-SESSION; cola de apariencia en T-FL-APP-005) |
| R-SES-020 | T-FL-SES-006 |
| R-SES-021 | T-FL-PWD-001 (+ guard en T-CORE-ROUTER) |
| R-SES-022 | T-CORE-ROUTER (+ T-FL-SES-002) |
| R-SES-023/024/025 | T-CORE-ROUTER |

### R-APAR (23) → [tasks/appearance.md](tasks/appearance.md)

| Requisito | Tarea |
|---|---|
| R-APAR-001 | T-FL-APP-001 (+ gate T-BE-APP) |
| R-APAR-002/003 | T-FL-APP-008 |
| R-APAR-004 | T-BE-APP-01…06 (límite del diseño §5) |
| R-APAR-005/006 | T-FL-APP-002 (+ validación en T-BE-APP-05) |
| R-APAR-007 | T-FL-APP-002 (+ T-CORE-SESSION, R7) |
| R-APAR-008/009/010 | T-FL-APP-002 |
| R-APAR-011 | T-FL-APP-001 |
| R-APAR-012 | T-FL-APP-002 |
| R-APAR-013 | T-FL-APP-003 |
| R-APAR-014/015 | T-FL-APP-004 |
| R-APAR-016 | T-FL-APP-002 (+ APP-004) |
| R-APAR-017 | T-FL-APP-005 |
| R-APAR-018 | T-FL-APP-006 |
| R-APAR-019 | T-FL-APP-007 |
| R-APAR-020/021/022/023 | T-FL-APP-002 |

---

## Cobertura SCREEN → tarea (36)

Las 36 pantallas canónicas de [experience/screens.md](experience/screens.md). Cobertura
por tarea de flujo o común; reservas explícitas donde no hay FL dedicado.

| SCREEN | Tarea(s) |
|---|---|
| SCREEN-LOGIN | T-FL-SES-001 |
| SCREEN-RECOVERY | T-FL-RCV-001 |
| SCREEN-PASSWORD-FORCED | T-FL-PWD-001 |
| SCREEN-CONTEXT | T-FL-SES-003 (+ selector de topbar T-FL-SES-004) |
| SCREEN-DASHBOARD | **Reserva:** T-FL-SES-002/003 (materializan el contexto) + T-CORE-UI (shell); conversión TS del baseline en L1 — sin FL dedicado declarado |
| SCREEN-CONTEXT-LOST | T-CORE-ROUTER + T-FL-SES-006 |
| SCREEN-NOT-FOUND | T-CORE-ROUTER + T-CORE-UI |
| SCREEN-PERSONALIZER | T-FL-APP-002 (panel; APP-001/003/004 ciclo completo) |
| SCREEN-USERS | T-FL-IDT-001/002/003/004 |
| SCREEN-USER-DETAIL | T-FL-IDT-005…010 + T-FL-PWD-002…005 |
| SCREEN-POSITIONS | T-FL-IDT-011/012/013 |
| SCREEN-POSITION-DETAIL | T-FL-IDT-011/014/015 |
| SCREEN-MEMBERSHIPS | T-FL-IDT-016/017 |
| SCREEN-UNITS | T-FL-ORG-001/002 |
| SCREEN-UNIT-DETAIL | T-FL-ORG-003/004/005 |
| SCREEN-PRECINCTS | T-FL-ORG-008/009/010 |
| SCREEN-PRECINCT-DETAIL | T-FL-ORG-008/011/012 |
| SCREEN-ROLES | T-FL-AZ-001/002/003 |
| SCREEN-SCOPES | T-FL-AZ-004 |
| SCREEN-PERMISSIONS | T-FL-AZ-004/005/006/010/012 |
| SCREEN-OVERRIDES | T-FL-AZ-007/008/009 |
| SCREEN-AUDIT | T-FL-AUD-001 |
| SCREEN-ARMORIES | T-FL-ARM-001/002/003 |
| SCREEN-WEAPONS | T-FL-WPN-001/002 |
| SCREEN-WEAPON-DETAIL | T-FL-WPN-003/004 |
| SCREEN-CALIBERS | T-FL-CAL-001/002 |
| SCREEN-RANGES | T-FL-SHT-001/002 |
| SCREEN-RANGE-DETAIL | T-FL-SHT-002/003/004 |
| SCREEN-LESSONS | T-FL-SHT-005 (reserva OP-LES-001) |
| SCREEN-LESSON-DETAIL | T-FL-SHT-006…013 (ficha y cinco pestañas; gestión de fracciones en SHT-013/014) |
| SCREEN-FRACTION-DETAIL | T-FL-SHT-013/015/019 (reserva OP-FRC-003) |
| SCREEN-RESULTS-CAPTURE | T-FL-SHT-015/016/017/018 (+ alta temporal T-FL-IDT-004) |
| SCREEN-EXERCISES | T-FL-EXC-001/002 |
| SCREEN-EXERCISE-DETAIL | T-FL-EXC-002/003 |
| SCREEN-AMMO-CONSUMPTION | T-FL-CMN-001/002/003 |
| SCREEN-WEAPON-CONSUMPTION | T-FL-CAR-001/002 (reservas OP-CAR-001/003) |

---

## Reservas, huecos y gates declarados

| ID | Reserva / hueco / gate | Tratamiento |
|---|---|---|
| **RV-01** | **Backend de apariencia de 8 ejes (gate obligatorio de cierre).** La ruta **existe y la persistencia por usuario está ejecutada** (ocho campos `ds_*` en `apipoligono/models.py:152-159`, migración `0021_design_system_preferences` y rutas `apipoligono/urls.py:85-86`; verificado 2026-10-15). Declarar el hueco **no cumple** el requisito: el cierre del frontend entero exige T-BE-APP-01…06 completadas y T-FL-APP-001…004 operando contra la ruta real. Sin parche de almacenamiento local (R-APAR-001/007). | Tareas gateadas en [tasks/appearance.md](tasks/appearance.md); gate triple (R2); ruta existente y persistencia ejecutada (verificado 2026-10-15) |
| **RV-02** | **D-02 abierta, no bloqueante** (conserva T-00 anterior): capacidades sin endpoint — transferencia de stock, validación de resultados, exportación, `edit_self`, comandantes de unidad, historial global de asignaciones, edición del catálogo de permisos — **no generan tareas, botones ni pantallas** y no autorizan features. Decisión del operador. | Sin tareas; reporte en cada entrega; prohibición R6 |
| **RV-03** | **G-SES-1/2/3** ([requirements/shared-session-data.md](requirements/shared-session-data.md) §Huecos): recarga profunda sin endpoint de tenant (re-captura manual en `/contexto`); endpoints que exigen `X-Org-Unit-Code` no inventariados (mecanismo primario: OP-AUT-003); filtros/paginación/orden globales no comprobados (client-side sobre arrays planos). | Explícitos en [tasks/session-context.md](tasks/session-context.md) y R9; sin workaround inventado |
| **RV-04** | **OP-RNG-006 restringida:** sin mapa `range:delete`; la acción destructiva no se ofrece disponible por defecto (inferencia estática, no prueba runtime). | T-FL-SHT-003 con gate propio |
| **RV-05** | **B-01 (hipótesis estática):** OP-LES-009 podría fallar por `primary_unit()` fuera de ámbito; un fallo se trata como ST-04 explícito, **sin** sustituir detalle por resumen/reporte. | T-FL-SHT-009 |
| **RV-06** | **Divergencia `warehouse`:** el inventario abrevia el control de armas/armerías; el mapa verificado declara los literales `view_warehouse`, `create/update/delete_warehouse_records`. Las tareas usan los literales verificados; el inventario no se edita (fuera de write set). | Nota en [tasks/armory-weapons.md](tasks/armory-weapons.md) |
| **RV-07** | **Discrepancia 19 vs 26 fondos** del DS: se preservan los 26 valores ejecutables del catálogo SSOT; la divergencia queda visible, no se decide aquí cuál fuente corrige. | [design-system/customizer-catalog.md](design-system/customizer-catalog.md) §Discrepancia; T-CORE-UI y T-FL-APP-002 |
| **RV-08** | **Comparación visual contra el DS no autorizada** (conserva T-146 anterior): su criterio observable vive en [verification.md](verification.md) V-70 — entregable de otro writer, enlace previsto. | Gate; ninguna tarea la ejecuta |
| **RV-09** | **Reservas de OP adscritas** († en la matriz): OP-AUT-006 → T-CORE-SESSION; OP-UNT-006 → T-FL-ORG-005; OP-MEM-001/003 → T-FL-IDT-016; OP-LES-001 → T-FL-SHT-005; OP-LES-003 → T-FL-SHT-008; OP-FRC-001 → T-FL-SHT-013; OP-FRC-003 → T-FL-SHT-015; OP-RES-001 → T-FL-SHT-016; OP-RES-003 → T-FL-SHT-017; OP-CAR-001/003 → T-FL-CAR-001. | Nota explícita en cada tarea y en la matriz OP |

---

## Enlaces a entregables de otros writers

Previstos y declarados; **no afirmo su salida como verificada** (en sincronización por
sus writers competentes en esta recuperación):

- [requirements.md](requirements.md) (raíz, R-AUTH/R-ROUTER/R-UNIT/R-RES/R-RUL/R-DAT/R-APP/R-PREF/R-LOGIN/R-REC/R-DS y decisiones D-*) — citado a través de los tomos estables que lo referencian; no leído en esta sincronización.
- [technical-design.md](technical-design.md) (transporte §2, guards §3, rutas §4, backend de apariencia §5, personalizador §6, stores §9, métrica §10, menú §11, sin caché §13) — idem.
- [verification.md](verification.md) (criterios observables V-*, incluido V-70 de comparación visual) — idem.
- [index.md](index.md) y [spec-meta.yaml](spec-meta.yaml) (estado `approved` desde el 2026-10-02, `approved_at`; verificado 2026-10-15) — idem; la autoridad de estado es `spec-meta.yaml`.
- `front/AGENTS.md` y `AGENTS.md` (reglas locales y excepción acotada) — citados vía los tomos de requirements/appearance y experience; no leídos en esta sincronización.

> 🕯️ Un tomo sin verdad es un hechizo roto. Método de comprobación de este índice: los
> conjuntos 99 T-FL ↔ 99 FL canónicos y 162 AC-OP ↔ 162 OP del inventario se verificaron
> por diferencia de conjuntos (sin faltantes ni sobrantes) en esta sincronización; los
> 140 requisitos R-DOM/R-SES/R-APAR y las 36 SCREEN se enumeraron uno a uno desde sus
> tomos fuente. Lo que no se verificó —runtime, tests, autorizaciones, salida ajena—
> está declarado como no verificado, no insinuado como hecho.
