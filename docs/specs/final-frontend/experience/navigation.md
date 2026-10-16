---
spec_meta: "../spec-meta.yaml"
---

# Navegación — Frontend integral

> 📜 Tomo de navegación del workstream `full-frontend-screens-recovery` (spec `final-frontend`, estado `approved` desde el 2026-10-02). Define menú, rutas, guards y reglas de desplazamiento entre las pantallas canónicas de [`screens.md`](screens.md). Todo es **diseño propuesto** frente a runtime no acreditado: `vue-router@5.3.1` es dependencia obligatoria declarada (`R-ROUTER-01`, D-05), ya instalada y en uso (`front/src/router/`; verificado 2026-10-15); su comportamiento de runtime se rige por lo acreditado en el plan de cierre (`completion-plan-2026-10-14.md`; aceptación integral `NOT_VERIFIED`; `technical-design.md` §1, T-05). Contrato de stack: TypeScript, no JavaScript (orden vigente del operador, 2026-10-02, que deroga el mandato anterior de `front/AGENTS.md`:18).

## Índice

1. [Principios](#principios)
2. [Tabla consolidada de rutas](#tabla-consolidada-de-rutas)
3. [Menú por módulos](#menú-por-módulos)
4. [Guards de navegación](#guards-de-navegación)
5. [Navegación entre entidades](#navegación-entre-entidades)
6. [Breadcrumbs](#breadcrumbs)
7. [Atrás, back/forward y re-consulta](#atrás-backforward-y-re-consulta)
8. [Deep links y entrada directa](#deep-links-y-entrada-directa)
9. [Flujos de sesión en la navegación](#flujos-de-sesión-en-la-navegación)

---

## Principios

- **Modo history.** `createRouter` + `createWebHistory`; la URL es real, admite entrada directa y back/forward del navegador (`R-ROUTER-01`, `technical-design.md` §3.1). La navegación por hash manual queda derogada (D-05).
- **Montaje.** `RouterView` en `App.vue`; `RouterLink` para menú, retornos y enlaces entre entidades; `useRoute()`/`useRouter()` para params y navegación programática (`R-ROUTER-02`).
- **IDs por parámetro de ruta, nunca por query.** Los identificadores de recurso viajan como params (`/personas/:idUsuario`); el query queda reservado a estados de presentación no esenciales (p. ej. `query.redirect` del guard, `R-ROUTER-04`).
- **Sin capa intermedia de navegación.** El router no resuelve navegación con estado manual de Pinia ni `window.location` (`front/AGENTS.md`:19).
- **Autoridad del backend.** El menú y los guards sólo anticipan visibilidad con `context.permissions`; ninguna entrada de menú acredita autorización y un `403` es denegación visible (`technical-design.md` §11).

## Tabla consolidada de rutas

Fuentes: `technical-design.md` §4 (filas TD§4) y propuestas nuevas de [`screens.md`](screens.md) (filas «Propuesta»). `meta` alimenta los guards.

| Ruta | `name` propuesto | SCREEN-ID | `meta` |
|---|---|---|---|
| `/login` | `login` | SCREEN-LOGIN | pública |
| `/recuperar` | `recuperar` | SCREEN-RECOVERY | pública |
| `/password-required` | `password-required` | SCREEN-PASSWORD-FORCED | requiere contexto |
| `/contexto` | `contexto` | SCREEN-CONTEXT | requiere contexto |
| `/` | `dashboard` | SCREEN-DASHBOARD | requiere contexto + tenant |
| `/personalizador` | `personalizador` | SCREEN-PERSONALIZER | requiere contexto |
| `/contexto-perdido` | `contexto-perdido` | SCREEN-CONTEXT-LOST | Propuesta; sin tenant |
| `/organizacion/unidades` | `unidades` | SCREEN-UNITS | `requiresTenant` |
| `/organizacion/unidades/:idUnidad` | `unidad-detalle` | SCREEN-UNIT-DETAIL | `requiresTenant` |
| `/organizacion/recintos` | `recintos` | SCREEN-PRECINCTS | `requiresTenant` |
| `/organizacion/recintos/:idRecinto` | `recinto-detalle` | SCREEN-PRECINCT-DETAIL | Propuesta; `requiresTenant` |
| `/organizacion/puestos` | `puestos` | SCREEN-POSITIONS | Propuesta; `requiresTenant` |
| `/organizacion/puestos/:idPosicion` | `puesto-detalle` | SCREEN-POSITION-DETAIL | Propuesta; `requiresTenant` |
| `/organizacion/membresias` | `membresias` | SCREEN-MEMBERSHIPS | Propuesta; `requiresTenant` |
| `/personas` | `personas` | SCREEN-USERS | `requiresTenant` |
| `/personas/:idUsuario` | `persona-detalle` | SCREEN-USER-DETAIL | `requiresTenant` |
| `/personas/roles` | `roles` | SCREEN-ROLES | `requiresTenant` |
| `/personas/scopes` | `scopes` | SCREEN-SCOPES | `requiresTenant` |
| `/personas/permisos` | `permisos` | SCREEN-PERMISSIONS | `requiresTenant` |
| `/personas/overrides` | `overrides` | SCREEN-OVERRIDES | Propuesta; `requiresTenant` + contexto administrativo |
| `/almacen/armerias` | `armerias` | SCREEN-ARMORIES | `requiresTenant` |
| `/almacen/armas` | `armas` | SCREEN-WEAPONS | `requiresTenant` |
| `/almacen/armas/:idArma` | `arma-detalle` | SCREEN-WEAPON-DETAIL | `requiresTenant` |
| `/almacen/calibres` | `calibres` | SCREEN-CALIBERS | `requiresTenant` (lectura); mutación sólo `super_admin` |
| `/tiro/poligonos` | `poligonos` | SCREEN-RANGES | `requiresTenant` |
| `/tiro/poligonos/:idPoligono` | `poligono-detalle` | SCREEN-RANGE-DETAIL | `requiresTenant` |
| `/tiro/lecciones` | `lecciones` | SCREEN-LESSONS | `requiresTenant` |
| `/tiro/lecciones/:idLeccion` | `leccion-detalle` | SCREEN-LESSON-DETAIL | `requiresTenant` |
| `/tiro/lecciones/:idLeccion/fracciones/:idFraccion` | `fraccion-detalle` | SCREEN-FRACTION-DETAIL | `requiresTenant` |
| `/tiro/fracciones/:idFraccion/resultados` | `captura-resultados` | SCREEN-RESULTS-CAPTURE | `requiresTenant` |
| `/tiro/ejercicios` | `ejercicios` | SCREEN-EXERCISES | `requiresTenant` |
| `/tiro/ejercicios/:idEjercicio` | `ejercicio-detalle` | SCREEN-EXERCISE-DETAIL | Propuesta; `requiresTenant` |
| `/tiro/consumos-municion` | `consumos-municion` | SCREEN-AMMO-CONSUMPTION | `requiresTenant` |
| `/tiro/consumos-arma` | `consumos-arma` | SCREEN-WEAPON-CONSUMPTION | `requiresTenant` |
| `/auditoria` | `auditoria` | SCREEN-AUDIT | `requiresTenant` + rol en {`tenant_admin`, `super_admin`, `auditor`} |
| `/:pathMatch(.*)*` | `no-encontrado` | SCREEN-NOT-FOUND | pública (`R-ROUTER-08`) |

Colisión de prefijos: `/personas/roles`, `/personas/scopes`, `/personas/permisos` y `/personas/overrides` se declaran **antes** que `/personas/:idUsuario` en la tabla de rutas para que el param dinámico no capture los literales (orden de declaración del router; conducta estándar de coincidencia de rutas, no se afirma runtime).

## Menú por módulos

Agrupación exigida por `R-RES-25`: organización, personas, autorización, almacén, tiro, ejercicios, auditoría. Cada entrada está condicionada por (a) el permiso efectivo del recurso en `context.permissions` y (b) la presencia del dato de contexto (tenant/unidad activa cuando la ruta lo exige). La columna «visibilidad» usa códigos verificados en `apps/authorization/permissions.py:36–95` o las clases del inventario; **no se deducen códigos de etiquetas amplias**.

| Grupo | Entrada | Ruta | Visibilidad anticipada por el menú |
|---|---|---|---|
| — | Dashboard | `/` | sesión + tenant |
| Organización | Unidades | `/organizacion/unidades` | `view_unit` |
| Organización | Recintos | `/organizacion/recintos` | `view_recinto` |
| Organización | Puestos | `/organizacion/puestos` | `view_unit` (`position:read`) |
| Organización | Membresías | `/organizacion/membresias` | `view_unit` (el ViewSet usa `resource_name='position'`, T-06) |
| Personas | Usuarios | `/personas` | `view_personnel_basic` |
| Autorización | Roles | `/personas/roles` | IA+TA (lectura abierta; mutación sólo contexto administrativo) |
| Autorización | Scopes | `/personas/scopes` | IA+TA |
| Autorización | Permisos y matrices | `/personas/permisos` | IA+TA (catálogo); pestañas de matriz exigen contexto administrativo (`IsTenantAdmin`) |
| Autorización | Overrides | `/personas/overrides` | contexto administrativo (`IsTenantAdmin`) |
| Almacén | Armerías | `/almacen/armerias` | `view_warehouse` |
| Almacén | Armas | `/almacen/armas` | `view_warehouse` |
| Almacén | Calibres | `/almacen/calibres` | `view_exercises` (`calibre:read`) |
| Tiro | Polígonos | `/tiro/poligonos` | `view_unit` (`range:read`) |
| Tiro | Lecciones | `/tiro/lecciones` | `view_unit` (`shooting_session:read`) |
| Ejercicios | Ejercicios | `/tiro/ejercicios` | `view_exercises` |
| Ejercicios | Consumos de munición | `/tiro/consumos-municion` | `view_exercises` |
| Ejercicios | Consumos por arma | `/tiro/consumos-arma` | `view_exercises` |
| Auditoría | Bitácora | `/auditoria` | rol en {`tenant_admin`, `super_admin`, `auditor`} (contrato OP-AUT-004) |
| Contexto (topbar/usuario) | Unidad activa | `/contexto` | sesión (siempre visible con más de una unidad o para revisarla) |
| Contexto (topbar/usuario) | Personalizador | `/personalizador` | sesión (IA; la ruta de preferencias no exige tenant) |
| Contexto (topbar/usuario) | Cambiar contraseña | acción sobre SCREEN-USER-DETAIL o flujo propio forzado | sesión |
| Contexto (topbar/usuario) | Cerrar sesión | FL/sesión (OP-AUT-005) | sesión |

Reglas del menú:

- Entradas ausentes por permiso **no se renderizan**; si el usuario navega directo por URL, el guard/`beforeEnter` resuelve (ver abajo). Ocultar no exime: el backend decide.
- Sin entradas huecas: no hay «Exportar», «Transferir stock», «Validar resultados» ni «Registro» (signup) — capacidades sin endpoint, D-02 ([`screens.md`](screens.md) §Huecos).
- Anatomía DS del shell: sidebar fija 250px (colapsada 75px), topbar 70px, menú activo con `aria-current`, backdrop móvil, dropdown de usuario ([`visual-contract.md`](../design-system/visual-contract.md) §2; `index.html`).
- Captura de resultados y fracciones **no** son entradas de menú: se alcanza por navegación contextual desde la lección/fracción (ver [entre entidades](#navegación-entre-entidades)).

## Guards de navegación

Tabla de `technical-design.md` §3.2, ampliada con el `beforeEnter` de rutas administrativas:

| Guard | Condición | Resolución |
|---|---|---|
| `beforeEach` global | sin contexto de sesión | `login` con `query.redirect` = destino original (`R-ROUTER-04`) |
| `beforeEach` global | `must_change_password` verdadero y la ruta no es `password-required` ni `login` | `password-required` (`R-ROUTER-05`) |
| `beforeEach` global | ruta bajo `/personalizador` sin contexto | `login` (`technical-design.md` §3.2) |
| `beforeEach` por ruta | `meta.requiresTenant` y `context.tenant` ausente | `contexto-perdido`, sin reintento en bucle (`R-ROUTER-07`) |
| `beforeEnter` de rutas de detalle | el recurso no está en los `permissions` del contexto | vista de recurso con el `detail` del backend si lo hubo (`technical-design.md` §3.2); la pantalla renderiza su estado `denied`, no una página en blanco |
| `beforeEnter` de `/auditoria` y `/personas/overrides` | rol/`IsTenantAdmin` no anticipable con certeza en cliente | se permite el intento: la autoridad es el backend; un `403` pinta el estado `denied` con el `detail` literal |

**Espera de contexto.** El guard espera al store `session` antes de decidir: la app arranca en estado `booting` y la navegación se resuelve sólo cuando `OP-AUT-002` terminó o falló de forma terminal (`R-ROUTER-06`). Sin ese gate, una recarga profunda en `/tiro/lecciones/42` expulsaría al login.

**Anti-carrera.** Al cambiar de unidad activa, cerrar sesión o expirar, el `generation` de los stores se incrementa y las respuestas tardías se descartan (`R-AUTH-09`, `technical-design.md` §2); la navegación resultante nunca pinta datos de la unidad anterior.

## Navegación entre entidades

Mapa de enlaces propuestos (todos con `RouterLink`; sólo se enlaza cuando el identificador existe en la respuesta — si no, texto plano, nunca enlace roto ni inventado):

| Origen | Destino | Clave del enlace |
|---|---|---|
| SCREEN-LESSON-DETAIL | SCREEN-RANGE-DETAIL | `id_poligono` de la lección |
| SCREEN-LESSON-DETAIL (pestaña fracciones) | SCREEN-FRACTION-DETAIL | `idLeccion` + `id_fraccion` |
| SCREEN-FRACTION-DETAIL | SCREEN-RESULTS-CAPTURE | `idFraccion` |
| SCREEN-FRACTION-DETAIL / SCREEN-LESSON-DETAIL (resultados) | SCREEN-USER-DETAIL, SCREEN-WEAPON-DETAIL | `id_usuario`, `id_arma` de la fila (si el permiso de lectura los hace accesibles; un `403` subsiguiente es denegación visible) |
| SCREEN-RESULTS-CAPTURE | SCREEN-FRACTION-DETAIL | retorno tras captura/baja |
| SCREEN-RANGE-DETAIL (lecciones) | SCREEN-LESSON-DETAIL | `id_leccion` |
| SCREEN-USER-DETAIL (asignaciones/membresías) | SCREEN-UNIT-DETAIL, SCREEN-POSITION-DETAIL, SCREEN-ROLES | `unit_code`, posición, `role_code` |
| SCREEN-POSITION-DETAIL | SCREEN-USER-DETAIL, SCREEN-UNIT-DETAIL, SCREEN-ROLES | holder, unidad, rol |
| SCREEN-UNIT-DETAIL | SCREEN-UNIT-DETAIL (padre/hijas), SCREEN-PRECINCT-DETAIL | `parent_code`, recintos que la contienen |
| SCREEN-PRECINCT-DETAIL | SCREEN-UNIT-DETAIL | `unit_codes` |
| SCREEN-WEAPON-DETAIL | SCREEN-ARMORIES, SCREEN-CALIBERS, SCREEN-UNIT-DETAIL | armería, `calibre_code`, unidad |
| SCREEN-ARMORIES | SCREEN-WEAPONS (filtrado client-side), SCREEN-UNIT-DETAIL | `armas_count`, unidad derivada |
| SCREEN-EXERCISE-DETAIL | SCREEN-AMMO-CONSUMPTION, SCREEN-UNIT-DETAIL | consumos (filtro client-side por ejercicio), unidades participantes |
| SCREEN-AMMO-CONSUMPTION | SCREEN-EXERCISE-DETAIL, SCREEN-CALIBERS, SCREEN-WEAPON-CONSUMPTION (nivel 2) | `ejercicio`, `calibre_code`, consumo |
| SCREEN-WEAPON-CONSUMPTION | SCREEN-AMMO-CONSUMPTION, SCREEN-WEAPON-DETAIL | consumo padre, `arma` |
| SCREEN-PERMISSIONS / SCREEN-AUDIT / SCREEN-OVERRIDES | SCREEN-ROLES, SCREEN-POSITION-DETAIL, SCREEN-USER-DETAIL, SCREEN-UNIT-DETAIL | códigos/IDs de la fila cuando la respuesta los trae |
| SCREEN-DASHBOARD | cualquier módulo del menú | entradas del menú |

Reglas transversales:

- El filtrado «por entidad padre» en listados planos es **client-side** sobre la colección realmente retornada (`R-RES-22`); no se inventan query params de filtro del backend (los filtros globales no están comprobados, `backend-inventory.md` §Límites).
- Ningún enlace promete datos que la respuesta no trae: si el ID no está, no hay enlace.

## Breadcrumbs

- Referencia DS: `ui-breadcrumb.html` ([`reference-pages.md`](../design-system/reference-pages.md) §2).
- Cadena canónica: `Inicio › {Módulo} › {Listado} › {Recurso}`; el módulo y el listado son `RouterLink`; el último nivel es texto.
- Etiqueta del recurso: el nombre/código **resuelto desde la respuesta disponible**; si el nombre no está presente, se usa el identificador; nunca se inventa un título (`R-DOM-ORG-002` como patrón).
- Rutas anidadas de tiro conservan la jerarquía real: `Inicio › Tiro › Lecciones › {lección} › Fracción {numero_fraccion} › Resultados` (los niveles intermedios se resuelven con las lecturas ya cargadas por los guards/pantallas; si un nivel no se puede resolver, se omite el enlace y queda texto).
- Las pantallas de auth (login, recuperación, forzado, 404, contexto perdido) no llevan breadcrumbs: usan su propio shell (`visual-contract.md` §2).

## Atrás, back/forward y re-consulta

- **Botón de retorno** en toda ficha: `RouterLink` al listado padre (no depende del historial); el back del navegador funciona además por `createWebHistory`.
- **Posición de scroll**: `scrollBehavior` con `savedPosition` preserva la vista previa por ruta (`technical-design.md` §3.1).
- **Re-consulta al volver**: sin caché persistente — al reentrar a una pantalla se vuelve a consultar mientras la sesión lo permita, para no mostrar datos de otra unidad activa (`technical-design.md` §13). La selección/scroll del listado se conserva como estado de presentación en memoria durante la sesión (`R-DOM-ORG-001`).
- **Éxito de mutación**: refresca detalle, listado y relaciones afectadas antes de habilitar la navegación de retorno (`requirements/identity-authorization.md` §Límites).

## Deep links y entrada directa

- Toda ruta de detalle es directamente entrable tras autenticar: el guard reconstruye sesión y contexto antes de resolver (`R-ROUTER-03`, `R-ROUTER-06`); `query.redirect` devuelve al destino original post-login (`R-ROUTER-04`).
- `/tiro/fracciones/:idFraccion/resultados` sin pasar por la lección: la pantalla resuelve el contexto de la fracción con `OP-FRC-003` antes de pintar selectores ([`screens/shooting.md`](screens/shooting.md)).
- URL sin ruta ⇒ SCREEN-NOT-FOUND (`R-ROUTER-08`), nunca vista en blanco.
- Ruta con `requiresTenant` sin tenant en contexto ⇒ SCREEN-CONTEXT-LOST, sin bucle (`R-ROUTER-07`).
- Recurso inexistente/denegado en detalle ⇒ la pantalla pinta su estado `error`/`denied` con el mensaje del backend; el breadcrumb y el retorno al listado siguen operativos.

## Flujos de sesión en la navegación

- **Cerrar sesión (FL/sesión, OP-AUT-005).** Acción del dropdown de usuario: aborta peticiones en vuelo, purga todo el estado en memoria (incluida la cola de apariencia, `R-APP-06`) y navega a `login`; sin reintento ni rehidratación (`R-AUTH-08`).
- **Sesión ausente/expirada.** La API responde `403` (no `401`): el cliente limpia estado y vuelve a `login` sin reintentar (`R-AUTH-07`); diferencia por contexto el `403` de negocio (`detail` literal en pantalla) del de contexto perdido (SCREEN-CONTEXT-LOST) — `technical-design.md` §2 reglas 4–5.
- **Throttling `429`.** Mensaje de espera con `Retry-After` cuando exista; sin reintento automático (`technical-design.md` §2 regla 6, T-03).
- **Cambio de unidad activa.** Desde SCREEN-CONTEXT o el selector de topbar: recarga contexto y datos dependientes (`R-UNIT-01`); `403` de `select-unit` muestra el motivo literal sin reintentar (`R-UNIT-02`); las preferencias de apariencia se conservan (`R-APP-06`).

🕯️ Este tomo no instala dependencias, no arranca router ni afirma comportamiento observado: es el contrato de navegación propuesto para la fase de implementación, cuyas condiciones —spec aprobada y orden explícita del operador— están cumplidas (spec `approved` el 2026-10-02; ejecución ordenada por el plan de cierre el 2026-10-14) (`spec-meta.yaml`:63–64; `front/AGENTS.md`:56).
