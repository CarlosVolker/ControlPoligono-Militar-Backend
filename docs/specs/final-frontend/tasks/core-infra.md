---
spec_meta: "../spec-meta.yaml"
---

# Tasks — Infraestructura común (T-CORE)

> 📜 Yo registro aquí las cinco tareas de infraestructura TypeScript que preceden a todo
> dominio: tipos, cliente HTTP, store de sesión, router y UI compartida del Design System.
> Índice, reglas generales, DAG y equivalencias con las tareas anteriores viven en
> [../tasks.md](../tasks.md). La spec está **`approved`** desde el 2026-10-02; la ejecución
> vigente se rige por el plan de cierre (aprobado el 2026-10-14, `in-progress`; verificado
> 2026-10-15). No he ejecutado navegador, servidor ni tests: todo criterio es observable
> **por definición**, no verificado.

## Bloque común (aplica a las cinco tareas)

- **Autorización.** Ejecución sólo tras `approved_at` en `spec-meta.yaml` + orden
  explícita del operador. Documentar o aprobar un plan **no** completa ninguna tarea.
- **Stack.** Vue 3 con `<script setup lang="ts">`, TypeScript, Pinia, Vue Router, CSS
  vanilla; DS externo reproducido 1:1. Sin frameworks de estilos ni librerías de
  componentes. Sin mocks, fixtures ni datos sintéticos.
- **Tooling.** No se instala ni se fija versión de toolchain en estos tomos: el
  compilador/comprobación de tipos requiere aprobación explícita previa a la
  implementación (regla preservada de las tareas anteriores, §Regla 3). La única
  dependencia autorizada es `vue-router@5.3.1` (T-CORE-ROUTER).
- **Rutas probables.** Relativas a `front/src/`; son propuesta de diseño, no contrato:
  el transporte y la estructura pertenecen a `technical-design.md` (en sincronización
  por otro writer; se cita a través de los tomos estables que lo referencian).
- **Estados y fallos.** `ST-*` y perfiles `P-*` de
  [../experience/states.md](../experience/states.md); clases `F-*` de
  [../experience/flows.md](../experience/flows.md). Este tomo no los redefine.

---

## T-CORE-TYPES — Fundación TypeScript y tipos de contrato

| Campo | Valor |
|---|---|
| Objetivo | Fundar el cliente TypeScript: convención `<script setup lang="ts">` en todo componente nuevo y tipos de request/response por dominio, transcritos de los contratos, sin inventar campos. |
| Cobertura | Tipos de las 162 OP de [../backend-inventory.md](../backend-inventory.md) agrupados por dominio de [../contracts/](../backend-contracts.md); tipos de contexto (R-SES-007) y de los 8 ejes de apariencia (catálogo de [../design-system/customizer-catalog.md](../design-system/customizer-catalog.md)). |
| Requisitos | R-SES-007 (forma exacta del contexto, clave `permissions`); R-DAT-01/07 vía tomos citantes; límites de tipo declarados sin pedir framework ni tooling nuevo. |
| Precondiciones / dependencias | Ninguna dentro del cliente; es la raíz del DAG. |
| Archivos probables | `types/api.ts` (o `types/<dominio>.ts` por familia), `types/appearance.ts`; conversión del baseline `api/dashboard.js`, `stores/dashboard.js`, `main.js`, `App.vue` y componentes existentes. |
| Gates | La toolchain de TypeScript (compilador, comprobación de tipos) **no** queda autorizada por esta tarea: requiere aprobación explícita del operador; no se inventan versiones. |
| Done when | Los módulos de tipos compartidos existen y cada familia los consume; ningún shape tiene campos ausentes del contrato; el baseline JS queda convertido en el código (observable), sin afirmar migración antes de hacerla. |

**Criterios.**

- **AC-CORE-TYPES-01:** todo archivo `.vue` nuevo declara `<script setup lang="ts">`;
  ningún shape de contrato se tipa como `any` ni se rellena desde memoria.
- **AC-CORE-TYPES-02:** cada dominio tiene tipos de request/response citando su archivo
  de contrato (`contracts/*.md`); los campos RO/W*/W? reflejan exactamente el contrato.
- **AC-CORE-TYPES-03:** estos tomos no instalan dependencias ni fijan versiones de
  toolchain; las únicas versiones vigentes son las ya presentes en `front/package.json`
  (`vue 3.5.43`, `pinia 4.0.3`, `vite 8.3.1`) más `vue-router@5.3.1` autorizada en
  T-CORE-ROUTER.
- **AC-CORE-TYPES-04 (baseline como hecho):** `front/src` **está en TypeScript** (38 `.vue`
  con `lang="ts"`, 34 `.ts`, 0 `.js`; verificado 2026-10-15); la conversión es trabajo de esta
  lane y su resultado es observable en el código, no se declara por documentación.

> 🕯️ El tipo del estado de los stores (`status ∈ {idle, loading, ready, empty, denied,
> error}` y `saveState` de apariencia) se tipa aquí según la correspondencia de
> [../experience/states.md](../experience/states.md) §Correspondencia con stores.

---

## T-CORE-HTTP — Cliente HTTP único (absorbe T-10 anterior)

| Campo | Valor |
|---|---|
| Objetivo | Un único cliente `fetch` para toda la API: cabeceras, semántica de códigos, throttling, errores de red y gancho anti-carrera por `generation`. |
| Cobertura | Todas las OP; exclusiones de `X-Tenant-Code` según R-SES-004: `auth/login/`, `logout/`, `protected/`, las dos rutas de preferencias y los cuatro endpoints de recuperación. |
| Requisitos | R-SES-001…004 (cliente único, `credentials: 'include'`, `X-CSRFToken` desde cookie `csrftoken` en métodos no seguros, `X-Tenant-Code`); R-SES-010…014 (sin `401`: `403` diferenciado por `detail`/contexto — F-02 vs F-12; `429` con `Retry-After` y sin reintento automático; `404` como error explícito); R-SES-018 (PII visible en pantalla pero nunca en logs del cliente). |
| Precondiciones / dependencias | T-CORE-TYPES. |
| Archivos probables | `api/http.ts`. |
| Gates | Ninguno específico; los throttles declarados (`auth: 20/min`, `unit_selection: 30/min`, `AuthEndpointThrottle`) se tratan tal como los citan los contratos, sin configurarlos en el cliente. |
| Done when | Todo módulo `api/<dominio>.ts` consume este único cliente (observable en el código); no existe Axios ni segundo cliente; una respuesta tardía de generación anterior se descarta sin pintar (ST-08). |

**Criterios.**

- **AC-CORE-HTTP-01:** cada petición no segura lleva `X-CSRFToken` leído de la cookie
  `csrftoken`; cada petición autenticada fuera de la lista de exclusión lleva
  `X-Tenant-Code` desde el tenant en memoria (nunca persistido, nunca hardcodeado).
- **AC-CORE-HTTP-02:** un `403` con `detail` de negocio conserva la sesión y expone el
  literal (F-02/ST-07); un `403` de `HasTenantAccess`
  (`No tiene acceso al tenant solicitado.`) o sin sesión activa dispara purga y vuelta a
  login sin reintento (F-12). La distinción es por `detail` y contexto de ruta, no por
  código solo.
- **AC-CORE-HTTP-03:** un `429` muestra espera con `Retry-After` si viene, deshabilita el
  envío durante el vuelo y no reintenta automáticamente (F-03).
- **AC-CORE-HTTP-04:** fallo de red/timeout sin respuesta ⇒ ST-04 con acción de reintento
  explícito (F-06/F-10); ninguna ausencia de respuesta se interpreta como éxito ni como
  «guardar defaults».
- **AC-CORE-HTTP-05:** el cliente expone el `generation` del store emisor y descarta toda
  respuesta cuya generación no sea la vigente (ST-08, nunca pintado).
- **AC-CORE-HTTP-06:** ningún mensaje de error del cliente registra RUT u otra PII en
  logs, artefactos ni estado persistido (R-SES-018).

---

## T-CORE-SESSION — Store de sesión, permisos y anti-carrera (absorbe T-11, T-12, T-22, T-60)

| Campo | Valor |
|---|---|
| Objetivo | El store Pinia de sesión como fuente única de contexto: usuario, tenant, unidad activa, scopes, asignaciones y `permissions[]`; purga, generación y sonda de sesión. |
| Cobertura | OP-AUT-002 (consumo de contexto), OP-AUT-006 (sonda `GET /protected/`, infraestructura sin pantalla); reglas de catálogo para selectores de todas las familias (R-SES-009). |
| Requisitos | R-SES-005…009 (tenant sólo desde captura real; unidad activa en memoria; forma exacta del contexto con clave `permissions` —nunca `permission_codes`—; `permissions[]` única fuente de visibilidad; catálogos sólo desde OP reales); R-SES-015…018 (generación incremental, memoria solamente, recarga tras cambio de unidad conservando apariencia, PII no registrada); R-SES-019/020 (purga total en logout y expiración, incluso si la petición falla). |
| Precondiciones / dependencias | T-CORE-HTTP. |
| Archivos probables | `stores/session.ts`, `stores/permissions.ts` (o un único store con sección de permisos), conversión de `stores/dashboard.js` del baseline. |
| Gates | Ninguno específico. |
| Done when | Los flujos de sesión (T-FL-SES-*) y los guards (T-CORE-ROUTER) resuelven contra este store; tras logout/expiración ningún dato de negocio, permiso ni preferencia sobrevive en memoria (observable vía FL-SES-005/006). |

**Criterios.**

- **AC-CORE-SESSION-01:** el store consume exactamente la forma de R-SES-007; la clave de
  permisos es `permissions`; ningún campo se añade desde memoria ni desde guías
  desactualizadas.
- **AC-CORE-SESSION-02:** todo estado vive sólo en memoria: sin `localStorage`,
  `sessionStorage`, cookies de estado ni rehidratación; al volver a una pantalla se
  re-consulta, no se sirve caché persistente (R-SES-016).
- **AC-CORE-SESSION-03:** cada cambio de unidad activa, logout o expiración incrementa
  `generation`; las respuestas de generación anterior se descartan (ST-08) y los datos
  dependientes se recargan desde el nuevo contexto; las preferencias de apariencia se
  conservan en el cambio de unidad (R-SES-015/017).
- **AC-CORE-SESSION-04 (AC-OP-AUT-006, hogar canónico):** la sonda `GET /protected/` se
  usa sólo como comprobación de sesión viva; no tiene pantalla ni estado de UI
  (P-INFRA de states.md).
- **AC-CORE-SESSION-05:** la purga de logout aborta peticiones en vuelo (incluida la cola
  de apariencia), vacía todo store y restablece defaults de apariencia, incluso si
  `POST /logout/` falla por red (R-SES-019; F-07).
- **AC-CORE-SESSION-06:** ningún selector de ningún dominio se puebla desde este store
  con datos hardcodeados: los catálogos salen de sus OP reales (R-SES-009), y este store
  sólo expone lo que el contexto devolvió.

---

## T-CORE-ROUTER — Vue Router, tabla de rutas y guards (absorbe T-19, T-19b, T-20, T-21)

| Campo | Valor |
|---|---|
| Objetivo | Instalar `vue-router@5.3.1` (única dependencia autorizada por la spec, preservado de la regla 3 anterior) y registrar la tabla consolidada de rutas con sus guards, modo history y params de recurso. |
| Cobertura | Las 36 rutas de [../experience/navigation.md](../experience/navigation.md) §Tabla consolidada (filas TD§4 y propuestas, con su `meta`); SCREEN-NOT-FOUND y SCREEN-CONTEXT-LOST como superficies de guard; colisión de prefijos `/personas/*` resuelta por orden de declaración. |
| Requisitos | R-SES-021 (bloqueo por `must_change_password` salvo `password-required` y login); R-SES-022 (espera al estado `booting` del store antes de decidir); R-SES-023 (login con `query.redirect` y entrada directa a detalle); R-SES-024 (`requiresTenant` sin tenant ⇒ contexto perdido sin bucle; URL sin ruta ⇒ 404 del DS, nunca blanco); R-SES-025 (back/forward y recarga directa reconstruidos; IDs por param, nunca por query). |
| Precondiciones / dependencias | T-CORE-SESSION (los guards resuelven contra el store). |
| Archivos probables | `router/index.ts`, `router/routes.ts`, `router/guards.ts`, `App.vue` (con `RouterView`). |
| Gates | La instalación de `vue-router@5.3.1` es fase de implementación con spec aprobada; ninguna otra dependencia queda autorizada por esta tarea. |
| Done when | Deep links y back/forward reconstruyen la pantalla tras autenticar; ninguna ruta operativa se resuelve contra contexto vacío; 404 y contexto perdido tienen superficie visible (observable vía T-FL-SES-002/006). |

**Criterios.**

- **AC-CORE-ROUTER-01:** `createRouter` + `createWebHistory`; `RouterLink` en menú,
  retornos y enlaces entre entidades; `useRoute()`/`useRouter()` en vistas de detalle;
  sin navegación por hash manual ni `window.location`.
- **AC-CORE-ROUTER-02:** la tabla registra las 36 rutas con `name` y `meta` de
  navigation.md; los literales `/personas/roles|scopes|permisos|overrides` se declaran
  antes que `/personas/:idUsuario`.
- **AC-CORE-ROUTER-03:** el guard global espera al store de sesión (`booting`) antes de
  decidir; sin contexto ⇒ `login` preservando `query.redirect`; jamás se expulsa al
  login por resolver contra contexto vacío en recarga profunda.
- **AC-CORE-ROUTER-04:** `must_change_password` verdadero bloquea toda ruta operativa
  salvo `password-required` y `login`, hasta que el contexto refrescado muestre la
  bandera en falso.
- **AC-CORE-ROUTER-05:** ruta `requiresTenant` sin tenant ⇒ `/contexto-perdido` sin
  reintento en bucle; URL sin ruta ⇒ SCREEN-NOT-FOUND (`pages-404.html` del DS).
- **AC-CORE-ROUTER-06:** `beforeEnter` de `/auditoria` y `/personas/overrides` permite el
  intento (la autoridad es el backend): un `403` pinta el estado `denied` con el
  `detail` literal, no una página en blanco ni un bloqueo inventado en cliente.
- **AC-CORE-ROUTER-07:** `scrollBehavior` con `savedPosition`; los identificadores de
  recurso viajan exclusivamente como params de ruta.
- **AC-CORE-ROUTER-08 (propiedad compartida):** `router/routes.ts` y `App.vue` son
  archivos compartidos de esta lane: las familias entregan sus vistas en las rutas ya
  declaradas y **no** editan la tabla (write sets disjuntos, [../tasks.md](../tasks.md)
  §DAG).

---

## T-CORE-UI — Shell, tokens y componentes compartidos del DS (absorbe T-61, T-140…T-144)

| Campo | Valor |
|---|---|
| Objetivo | Transcribir **literalmente** el Inume Design System externo al cliente: tokens, bloques de personalización, shell y componentes compartidos, más las superficies comunes (404, contexto perdido) y el menú por permisos. |
| Cobertura | Tokens y anatomía de [../design-system/visual-contract.md](../design-system/visual-contract.md); familias de páginas de [../design-system/reference-pages.md](../design-system/reference-pages.md); bloques `data-*` de `theme-customizer.css` (27 `data-accent`, 26 `data-bg` × 2 temas, 3 `data-radius`, `data-iconfam`, `data-font`, `data-ambcolor`); menú de [../experience/navigation.md](../experience/navigation.md) §Menú. |
| Requisitos | R-DS-01/02/05 vía visual-contract (reproducción 1:1 con referencia archivo:línea de origen); R-RES-23 (`—` en ausente, vacío/error/denegado distintos) y R-RES-24 (confirmación destructiva con mensaje literal del backend) vía tomos citantes; R-SES-008 (visibilidad sólo por `permissions[]` del contexto); R-DAT-05/06 (sin persistencia de credenciales ni PII). |
| Precondiciones / dependencias | T-CORE-TYPES; T-CORE-SESSION (menú condicionado por permisos); T-CORE-ROUTER (shell con `RouterView`). |
| Archivos probables | `styles/tokens.css`, `styles/theme-customizer.css`, `styles/baseui-*.css` (por familia), `components/shell/AppShell.vue`, `components/shell/SideMenu.vue`, `components/shell/Topbar.vue`, `components/ui/*.vue` (card, stat-grid, tabla, tabs, modal, toast, badge, breadcrumb, spinner, placeholder, alert, confirmación destructiva), `views/NotFoundView.vue`, `views/ContextLostView.vue`, conversión de los componentes del baseline (`DashboardSidebar.vue`, `DashboardTopbar.vue`, `MetricGrid.vue`, `StateMessage.vue`, etc.). |
| Gates | La comparación visual contra el DS **no está autorizada** por esta spec (T-146 anterior): su criterio observable pertenece a `verification.md` (V-70), entregable de otro writer — enlace previsto, no afirmo su salida. |
| Done when | Cada valor de token, bloque `data-*` y anatomía de componente coincide 1:1 con el archivo y línea citados del DS externo; el menú no tiene entradas huecas; los estados comunes existen como componentes compartidos que todas las familias consumen. |

**Criterios.**

- **AC-CORE-UI-01:** `styles/tokens.css` transcribe los tokens del DS con referencia
  archivo:línea a `../../Inume Design System/assets/css/`; ningún valor se reinterpreta,
  redondea ni renombra.
- **AC-CORE-UI-02:** los bloques de personalización se transcriben completos: 27
  `data-accent`, 26 `data-bg` × 2 temas, 3 presets `data-radius`, `data-iconfam`,
  `data-font` y `data-ambcolor`; la capa de personalizador carga última.
- **AC-CORE-UI-03:** el shell preserva las tres regiones: sidebar fija 250px (colapsada
  75px), topbar 70px y `main.page-content` con su padding declarado, incluido backdrop
  móvil, dropdown de usuario y `aria-current` en la entrada activa.
- **AC-CORE-UI-04:** el menú renderiza sólo entradas con permiso efectivo en
  `context.permissions` y dato de contexto presente; sin entradas huecas (nada de
  «Exportar», «Transferir stock», «Validar resultados» ni «Registro»: capacidades sin
  endpoint, D-02); ocultar no exime: un `403` posterior es denegación visible.
- **AC-CORE-UI-05:** existen los componentes compartidos de estado: ST-01 (spinner),
  ST-03 (placeholder vacío), ST-04 (alert de error con reintento explícito), ST-07
  (denegación con `detail` literal) y `—` para campo ausente; vacío ≠ error ≠ denegación
  en toda superficie que los consuma.
- **AC-CORE-UI-06:** toda acción destructiva usa el modal de confirmación ST-10 y
  muestra después el mensaje exacto del backend; ninguna se ejecuta sin confirmación.
- **AC-CORE-UI-07:** SCREEN-NOT-FOUND reproduce `pages-404.html` y SCREEN-CONTEXT-LOST
  reproduce `pages-404-alt.html` + alert semántico; el shell de auth
  (`authentication-bg`) existe para las pantallas públicas.
- **AC-CORE-UI-08:** ninguna superficie compartida persiste credenciales ni PII, ni
  escribe en `localStorage`/`sessionStorage`/cookies de estado.

---

> 🕯️ Límite de este tomo: la infraestructura habilita a las familias, no las sustituye.
> Un T-CORE completado no completa ningún T-FL; y consumir el catálogo API de otro
> dominio (p. ej. un selector de polígonos dentro de tiro) **no** requiere tener la UI de
> ese otro dominio: sólo su módulo `api/<dominio>.ts` tipado (regla del DAG en
> [../tasks.md](../tasks.md)).
