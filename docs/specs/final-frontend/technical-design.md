---
spec_meta: "./spec-meta.yaml"
---

# Technical Design — Frontend integral

## Índice

1. [Arquitectura](#1-arquitectura)
2. [Cliente HTTP](#2-cliente-http)
3. [Navegación con Vue Router](#3-navegación-con-vue-router)
4. [Tabla de rutas y guards](#4-tabla-de-rutas-y-guards)
5. [Backend: preferencias del Design System](#5-backend-preferencias-del-design-system)
6. [Personalizador del Design System en el cliente](#6-personalizador-del-design-system-en-el-cliente)
7. [Integración visual con el Design System](#7-integración-visual-con-el-design-system)
8. [Uso de los endpoints de soporte de authz](#8-uso-de-los-endpoints-de-soporte-de-authz)
9. [Estado y componentes de datos](#9-estado-y-componentes-de-datos)
10. [Métricas](#10-métricas)
11. [Seguridad](#11-seguridad)
12. [Riesgos técnicos](#12-riesgos-técnicos)
13. [Decisiones técnicas](#13-decisiones-técnicas)

Los contratos de autenticación, el inventario de endpoints y la tabla de campos por
recurso se movieron a los contratos por dominio de [`contracts/`](./backend-contracts.md)
(índice canónico: [`backend-contracts.md`](./backend-contracts.md); inventario de
operaciones: [`backend-inventory.md`](./backend-inventory.md)) para mantener este
documento por debajo del límite de longitud.

**Fuentes canónicas del diseño.** Este documento conserva la arquitectura del cliente,
el cliente HTTP, el modelo de estado y el diseño de la única extensión de backend
autorizada. El detalle de cada materia vive en su tomo canónico (D-07 en
`requirements.md` §12):

| Materia | Tomo canónico |
|---|---|
| Alcance, invariantes, decisiones | [`requirements.md`](./requirements.md) |
| Inventario de operaciones (162 `OP-*`) | [`backend-inventory.md`](./backend-inventory.md) |
| Contratos campo a campo por dominio | [`contracts/`](./backend-contracts.md) |
| Requisitos de interfaz por dominio (`R-DOM-*`) | [`requirements/`](./requirements.md#341-volúmenes-por-dominio-y-pantallas) |
| Catálogo de pantallas (36 `SCREEN-*`) y cobertura OP → SCREEN | [`experience/screens.md`](./experience/screens.md) |
| Rutas consolidadas, menú, guards, breadcrumbs | [`experience/navigation.md`](./experience/navigation.md) |
| Contrato visual y composición del DS | [`design-system/visual-contract.md`](./design-system/visual-contract.md) |
| Catálogo exacto del personalizador y semántica de atributos | [`design-system/customizer-catalog.md`](./design-system/customizer-catalog.md) |
| Páginas y capas CSS del DS por familia | [`design-system/reference-pages.md`](./design-system/reference-pages.md) |

## 1. Arquitectura

```
front/src/
├── main.ts                  punto de entrada: monta la app y registra el router
├── App.vue                  shell: <RouterView> + bloqueo de contraseña (<script setup lang="ts">)
├── router/
│   ├── index.ts             createRouter + createWebHistory + tabla de rutas
│   └── guards.ts            guards de sesión, contexto y contraseña requerida
├── api/
│   ├── http.ts              cliente fetch único: CSRF, X-Tenant-Code, credentials
│   ├── appearance.ts        cliente del personalizador DS (autosave)
│   ├── dashboard.js         (existente en JS — hecho del baseline) conserva su contrato
│   └── resources/           un módulo por recurso (21 módulos), en .ts
├── stores/                  un store Pinia por dominio, todo en memoria, en .ts
│   ├── session.ts           auth + context + unidad activa + appearance
│   ├── appearance.ts        8 ejes DS, snapshot, cola de autosave, estado de guardado
│   ├── permissions.ts       catálogos authz y matriz
│   ├── organization.ts      unidades, recintos
│   ├── armory.ts            armerías, armas, calibres
│   ├── shooting.ts          polígonos, lecciones, fracciones, resultados
│   ├── exercises.ts         ejercicios y consumos
│   └── people.ts            usuarios, puestos, membresías
├── components/
│   ├── ds/                  átomos del DS transcritos 1:1
│   └── personalizer/        panel de los 8 ejes + toggle de tema
├── views/                   una vista por pantalla
└── styles/
    ├── tokens.css           valores del DS transcritos literalmente
    ├── theme-customizer.css bloques data-* del DS, transcritos
    └── app.css              cascada de componentes
```

> 🕯️ Los archivos **propuestos** son TypeScript (`.ts`, `<script setup lang="ts">`) por
> la decisión D-08 (orden del operador del 2026-10-02). `dashboard.js` es el único
> archivo existente del árbol y se conserva como **hecho JS del baseline**: no se afirma
> migrado. La migración del resto del baseline y la instalación de tooling de tipos son
> fase de implementación y requieren orden explícita del operador.

**Decisión técnica — navegación.** `vue-router` es una dependencia **obligatoria** de
esta spec. Reemplaza la navegación por hash manual del borrador anterior. Versión
exacta requerida: **`vue-router@5.3.1`**.

| Evidencia | Valor | Fecha de consulta |
|---|---|---|
| `registry.npmjs.org/vue-router/latest` | `5.3.1` (latest) | 2026-10-01 |
| `peerDependencies` de `vue-router@5.3.1` | `vue: ^3.5.34 \|\| ^4.0.0` | 2026-10-01 |
| `vue` declarada en `front/package.json` | `3.5.43` — dentro del rango del peer | lectura local |
| peers opcionales | `vite: ^7.3.0 \|\| ^8.0.0`, `pinia: ^3.0.4 \|\| ^4.0.2` — satisfacen el manifiesto actual | lectura local |
| Documentación oficial | `router.vuejs.org/guide/`, secciones `createWebHistory` y *Navigation Guards*, versiones 4.x/5.x | consulta web |

> La **dependencia se declara en el diseño**, pero **la instalación es fase de
> implementación** y queda detrás de la aprobación de la spec y de su gate.
>
> 📜 **Actualización 2026-10-15:** la instalación quedó **ejecutada**: `vue-router 5.3.1`
> está instalado y en uso (`front/package.json`; router real en `front/src/router/`;
> verificado 2026-10-15).

Alternativas descartadas: estado de pantalla fijo en memoria + `hash` (rechazada —
rechazada explícitamente por el operador y sin deep-links reales, sin back/forward
fiable); un cliente HTTP por dominio (rechazada: duplica CSRF y tenant).

**Restricciones de stack que se mantienen.** No se introduce ninguna biblioteca de UI
nueva ni Axios. Se sigue usando `fetch`. **El lenguaje del código objetivo es
TypeScript** (D-08 en `requirements.md` §12, orden del operador del 2026-10-02): la
restricción previa «ni TypeScript» queda **derogada (superseded)**. El baseline JavaScript
en `front/src/` quedó **superado**: hoy está en **TypeScript** (38 `.vue` con `lang="ts"`,
34 `.ts`, 0 `.js`; verificado 2026-10-15), y el kit
externo del Design System sigue siendo HTML/CSS/JS como fuente de referencia.

## 2. Cliente HTTP

Contrato, derivado de `control_poligono/settings.py:156–222`,
`apps/identity/authentication.py:4–17` y `apps/tenants/middleware.py:5–25`:

```ts
// Origen del API: mismo origen bajo el proxy de Vite.
// front/vite.config.js → '/api' → http://127.0.0.1:8000
const API_ROOT = '/api'

function readCookie(name: string): string | null {
  return document.cookie.split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1] ?? null
}

interface RequestOptions {
  method?: string
  body?: unknown
  tenantCode?: string
}

async function request(
  path: string,
  { method = 'GET', body, tenantCode }: RequestOptions = {},
): Promise<Response> {
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method)
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (tenantCode) headers['X-Tenant-Code'] = tenantCode
  if (unsafe) {
    const csrf = readCookie('csrftoken')
    if (csrf) headers['X-CSRFToken'] = csrf
  }

  return fetch(`${API_ROOT}${path}`, {
    method,
    credentials: 'include',          // sessionid HttpOnly
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
```

> Ejemplo en TypeScript conforme a D-08. `front/vite.config.js` se cita como archivo
> **existente** (hecho del baseline JS), no como archivo propuesto.

Reglas duras:

1. `credentials: 'include'` en **toda** petición (`settings.py:173`).
2. `X-CSRFToken` sólo en métodos no seguros; la cookie `csrftoken` es legible por JS
   (`CSRF_COOKIE_HTTPONLY = False`, `settings.py:186`).
3. `X-Tenant-Code` obligatorio en toda petición autenticada salvo `auth/login/`,
   `logout/`, `protected/`, las dos rutas de preferencias y los cuatro endpoints de
   recuperación, ninguno de los cuales exige tenant (`views.py:1382`, `1405`, `1374`,
   `1902`, `urls.py:84`, `recuperacion_utilidades.py:45–46`). Sin el header,
   `HasTenantAccess` devuelve `403` (`apps/authorization/permissions.py:264–270`).
4. La API **no devuelve `401`** para sesión ausente: `SessionCsrfAuthentication` no
   define `authenticate_header`, así que DRF degrada `NotAuthenticated` a `403`. El
   cliente trata `403` con `detail` de "sin permiso" y el `403` de `HasTenantAccess`
   ("No tiene acceso al tenant solicitado.") como señal de contexto perdido → login.
   No hay refresh token: reintentar es inútil.
5. `403` de negocio ⇒ mostrar `detail` literal; nunca convertirlo en "sin datos".
6. `429` por throttling (`auth: 20/min`, `unit_selection: 30/min`,
   `settings.py:167–171`) ⇒ mensaje de espera, sin reintento automático.

**Anti-carrera.** Cada store registra un `generation` incremental. Al cambiar de unidad
activa, cerrar sesión o expirar la sesión, `generation` se incrementa y las respuestas
con `generation` distinto se descartan. Satisface `R-AUTH-09`.

## 3. Navegación con Vue Router

> 📜 La tabla consolidada canónica —rutas fijadas y propuestas, `name`, `meta`, menú por
> módulos, guards ampliados, breadcrumbs, navegación entre entidades y deep links— vive
> en [`experience/navigation.md`](./experience/navigation.md). Esta sección conserva sólo
> la decisión de arquitectura del enrutado; las propuestas de rutas nuevas se declaran
> únicamente en aquel tomo, sin abrir un router paralelo.

### 3.1 Creación del router

```ts
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (to, from, saved) => saved ?? { top: 0 },
})
```

- **Modo `history`, no `hash`.** `createWebHistory` es el modo requerido: la URL es
  real, admite entrada directa, y back/forward del navegador funcionan.
- `RouterView` en `App.vue` como punto de montaje; `RouterLink` en menú, botones de
  retorno y paginación; `useRoute()` para leer `params`, `query` y `meta`; `useRouter()`
  para `push`, `replace` y `back`.
- Los identificadores de recurso viajan como **parámetros de ruta**, no en el query:
  `/lecciones/:idLeccion`, `/lecciones/:idLeccion/fracciones/:idFraccion`,
  `/fracciones/:idFraccion/resultados`, `/usuarios/:idUsuario`,
  `/armas/:idArma`, `/poligonos/:idPoligono`, `/posiciones/:idPosicion`.
- Back/forward preserva la vista previa por ruta gracias a `scrollBehavior` con
  `savedPosition`, y la entrada directa a una URL profunda funciona porque el guard
  reconstruye el contexto antes de resolver la navegación.

### 3.2 Guards

| Guard | Condición | Redirección |
|---|---|---|
| `beforeEach` global | sin contexto de sesión ⇒ | `login` con `query.redirect` = destino original |
| `beforeEach` global | `must_change_password` verdadero y la ruta no es la de cambio forzado ni el login | `password-required` |
| `beforeEach` global | ruta bajo `/personalizador` sin contexto | `login` |
| `beforeEach` por ruta | `meta.requiresTenant` y `context.tenant` ausente | pantalla de contexto perdido, sin reintento |
| `beforeEnter` de rutas de detalle | el recurso no está en el `permissions` del contexto | vista de recurso, con el `detail` del backend si lo hubo |

El guard **espera** al store `session` antes de decidir: se registra la app en un estado
`booting` y se resuelve la navegación sólo cuando el contexto terminó de cargar o
falló de forma terminal. Sin ese gate, una recarga profunda en `/lecciones/42` expulsaría
al usuario al login.

## 4. Tabla de rutas y guards

| Ruta | Pantalla | `meta` |
|---|---|---|
| `/login` | Login (ref. DS `auth-signin.html`) | pública |
| `/recuperar` | Recuperación de 4 pasos (ref. `auth-password.html`) | pública |
| `/password-required` | Cambio de contraseña forzado | requiere contexto |
| `/contexto` | Selección de unidad activa y de tenant | requiere contexto |
| `/` | Dashboard de lectura | requiere contexto + tenant |
| `/personalizador` | Personalizador de los 8 ejes | requiere contexto |
| `/organizacion/unidades`, `/organizacion/unidades/:idUnidad` | Árbol y ficha de unidad | `requiresTenant` |
| `/organizacion/recintos` | Recintos | `requiresTenant` |
| `/personas`, `/personas/:idUsuario` | Listado y ficha de persona | `requiresTenant` |
| `/personas/roles`, `/personas/scopes`, `/personas/permisos` | Catálogos y matrices de authz | `requiresTenant` |
| `/almacen/armerias`, `/almacen/armas`, `/almacen/armas/:idArma`, `/almacen/calibres` | Almacén | `requiresTenant` |
| `/tiro/poligonos`, `/tiro/poligonos/:idPoligono` | Polígonos | `requiresTenant` |
| `/tiro/lecciones`, `/tiro/lecciones/:idLeccion` | Lecciones y ficha de 5 pestañas | `requiresTenant` |
| `/tiro/lecciones/:idLeccion/fracciones/:idFraccion` | Fracción | `requiresTenant` |
| `/tiro/fracciones/:idFraccion/resultados` | Captura de resultados por carril | `requiresTenant` |
| `/tiro/ejercicios` | Ejercicios militares | `requiresTenant` |
| `/tiro/consumos-municion`, `/tiro/consumos-arma` | Consumos | `requiresTenant` |
| `/auditoria` | Bitácora de auditoría | `requiresTenant` + rol en {`tenant_admin`,`super_admin`,`auditor`} |
| `/:pathMatch(.*)*` | 404 (ref. DS `pages-404-alt.html`, completa) | pública |

La navegación lateral se construye a partir de la cobertura de
`requirements.md` §3.4 y de los `permissions` del contexto (`R-RES-25`).

> 🕯️ Esta tabla conserva las rutas **fijadas** por decisiones previas (las filas
> «TD§4» que cita [`experience/screens.md`](./experience/screens.md)). La tabla
> consolidada vigente —que añade las rutas propuestas (`/contexto-perdido`,
> `/organizacion/puestos`, `/organizacion/recintos/:idRecinto`, `/personas/overrides`,
> `/tiro/ejercicios/:idEjercicio` y demás), sus `name`, el orden de declaración contra
> colisiones de prefijo y el menú completo— es la de
> [`experience/navigation.md`](./experience/navigation.md). Ninguna ruta nueva se
> propone en este documento.

## 5. Backend: preferencias del Design System

Este es el **único** cambio de backend que autoriza esta spec. Se limita al alcance de
preferencias de apariencia del usuario.

**API existente vs única extensión futura.** Conviene no confundir las dos capas:

| Capa | Estado | Qué es |
|---|---|---|
| `GET\|PUT /api/me/preferences/appearance/` (`OP-PRF-001`/`OP-PRF-002`, tres campos legacy `theme`, `palette`, `density`) | **API existente**, implementada y verificada en fuente estática (`views.py:1901–1940`) | Permanece intacta: no se renombra, no se redirige, no se extiende. Deja de gobernar la apariencia visible (§6 de `requirements.md`; trazabilidad legacy en [`experience/screens/appearance.md`](./experience/screens/appearance.md)) |
| Ruta de los ocho ejes `design-system/`, ocho campos `ds_*` y su migración (§5.1–§5.3) | **Única extensión autorizada: ya implementada y ejecutada** (verificado 2026-10-15) | Autorizada por la excepción acotada de `front/AGENTS.md` §Límites; existe: ocho campos `ds_*` (`apipoligono/models.py:152-159`), migración `0021_design_system_preferences` y rutas `apipoligono/urls.py:85-86` |

### 5.1 Modelo

Ocho campos nuevos en `apipoligono.models.Usuario`, del patrón `TextChoices`
reutilizable ya usado por el propio modelo:

| Campo | `choices` | Default canónico | Tipo |
|---|---|---|---|
| `ds_theme` | `dark`, `light` | `dark` | `CharField(max_length=16, choices=…, null=False, blank=False)` |
| `ds_accent` | 27 acentos (§5.3) | `mint` | ídem |
| `ds_bg` | 26 fondos (§5.3) | `command` | ídem |
| `ds_font` | 9 tipografías | `ibm-plex` | ídem |
| `ds_radius` | `square`, `subtle`, `soft` | `square` | ídem |
| `ds_iconfam` | 7 familias de iconos | `phosphor` | ídem |
| `ds_ambient` | 8 variantes | `embers` | ídem |
| `ds_ambcolor` | `accent` + 6 tintes | `accent` | ídem |

Reglas de diseño:

- **Ocho `CheckConstraint`**, uno por eje, validando pertenencia al `choices` de ese eje.
  La pertenencia ya la garantiza `choices`; el constraint documenta la invariante y la
  blinda ante escrituras directas.
- **Sin índice nuevo**: los campos se leen siempre por `request.user` (PK), nunca por
  búsqueda.
- **Sin modelo nuevo**: la pertenencia es la de `Usuario`, la misma que usa
  `me/preferences/appearance/`. No se toca `Account` ni `UnitMembership`.
- **`theme`, `palette` y `density` quedan intactos.** Sus preferencias se crean en
  `apipoligono/migrations/0011_*` y no se convierten, traducen ni reinterpretan. El
  cliente deja de escribir `palette` y `density` a efectos de axes visuales; sus valores
  se conservan porque puede haber datos y porque no hay orden para destruirlos.

### 5.2 Migración

Una única migración nueva con `8 × AddField` y `8 × AddConstraint` sobre `Usuario`. Su
`dependencies` se resuelve **contra la hoja real del grafo en el momento de
implementar**; el leaf observado en esta revisión es
`apipoligono/migrations/0020_ejercicio_consumo.py`, y esa observación es de lectura de
disco, no una instrucción de número. **No se edita ninguna migración anterior.**

No se escribe SQL específico de un motor, ni se documenta un procedimiento de producción
ni de conservación: el proveedor de base de datos del entorno de ejecución **no está
confirmado** (no se leyó `.env` ni se conectó a ninguna base). El diseño es ORM, con
entorno de desarrollo documentado en SQLite (`AGENTS.md`).

### 5.3 API

Ruta nueva, registrada en `apipoligono/urls.py` junto a la existente:

```
GET    /api/me/preferences/appearance/design-system/
PUT    /api/me/preferences/appearance/design-system/
DELETE /api/me/preferences/appearance/design-system/
```

| Método | Comportamiento |
|---|---|
| `GET` | `200` con el objeto de 8 ejes leído de `request.user`, siempre completo, con defaults canónicos para cualquier valor ausente |
| `PUT` | Requiere **exactamente** los 8 campos, cada uno `string` no nulo y dentro del enum de su eje. Sin campos de más. **Valida los 8 antes de escribir** y persiste en una sola llamada `update_fields` de 8 claves. Responde `200` con el objeto canónico persistido |
| `DELETE` | Restablece los 8 a sus defaults canónicos en una sola escritura, idempotente. Responde `204` sin cuerpo. No borra el usuario ni lo deja sin sesión |

- **Autenticación:** `IsAuthenticated` con la sesión y cookies CSRF ya existentes, en
  paridad con la ruta de preferencias heredada. `X-Tenant-Code` no es obligatorio: las
  preferencias son del usuario, no del tenant. **No se introduce permiso nuevo** ni se
  exige `HasTenantAccess`, igual que en la ruta heredada.
- **Errores `400` de DRF por campo** (`{ "ds_accent": ["…"] }`), con `non_field_errors`
  para el caso de conjunto incompleto o campos extra.
- **`403` con `detail`** es la respuesta real de sesión ausente o CSRF inválido, porque
  la API no expone `401`. El cliente **no** asume que un `403` en esta ruta significa
  "sin permisos": distingue por contexto y, cuando corresponde, consulta el contexto en
  lugar de cerrar sesión automáticamente.
- **Defaults legítimos:** provienen de la configuración del Design System
  (§6.3), no de datos ficticios.
- **No hay** endpoint de opciones, ni `PATCH`, ni metadatos de revisión, ni un noveno
  campo de configuración.

`GET|PUT /api/me/preferences/appearance/` permanece **intacto**: no se renombra, no se
redirige, no se extiende. El cliente puede seguir leyéndolo, pero la apariencia visible
la gobiernan los 8 ejes nuevos.

## 6. Personalizador del Design System en el cliente

Fuente única: `../../Inume Design System/assets/js/theme-customizer.js` (973 líneas),
`assets/js/app.js` (sección de tema, líneas 116–155) e `index.html` (markup del panel,
líneas 478–530). El panel del DS marca sólo 7 acentos y 4 fondos de forma estática; el
resto lo inyecta `buildExtendedUI()` en `theme-customizer.js:724–856`, invocado desde
`:865` **antes** de que se enlacen los escuchadores de los radiogrupos, de modo que el
comportamiento de grupo (clic, flechas, `Home`/`End`, tabindex rotatorio) recoge los
controles inyectados sin cambios.

### 6.1 Comportamiento a reproducir 1:1

| Capacidad | Fuente DS | Qué hace el cliente |
|---|---|---|
| Swatches de acento | `index.html:494–504` | `radiogroup` de 27 swatches con `aria-checked` |
| Tarjetas de fondo | `index.html:506–529` | `radiogroup` de 26 tarjetas con vista previa en miniatura |
| Grupos inyectados | `theme-customizer.js:724–856` | tipografía, radio, familia de iconos, ambiente y color de ambiente, con sus muestras |
| Selección | `theme-customizer.js:880–900` | clic, `ArrowRight`/`ArrowLeft`/`ArrowUp`/`ArrowDown`, `Home`, `End`, tabindex rotatorio |
| Reset | `theme-customizer.js:347`, `index.html:529` | botón "Reset to defaults" que devuelve los 8 ejes a sus defaults canónicos |
| Previsualización | `apply()` `theme-customizer.js:415–490` | el atributo `data-*` se escribe en `<html>` en el acto, sin esperar al backend |
| Toggle de tema | `app.js:116–155` | conmutador `dark`/`light` con icono propio de la familia activa |
| Atribución de iconos | `theme-customizer.js:217`, `489` | aviso de licencia visible en la UI, tal como lo incluye el DS |
| Anuncio a otras superficies | `app.js:143–147` | evento `darkone:themechange` para que los gráficos re-resuelvan su paleta |

**Presupuesto de movimiento y de ítem de licencia.** El aviso de atribución que el DS
incluye en su panel se conserva **tal cual aparece en la fuente**: esta spec no
reformula ni reescribe licencias externas, y no afirma nada sobre su vigencia o
vigencia futura.

**Atomicidad de `apply()`.** El DS escribe los atributos con una semántica concreta que
el cliente reproduce: `data-radius="soft"` es la cascada base y **se elimina** el
atributo en vez de escribirlo (`:454–457`); `data-iconfam="default"` significa atributo
ausente y **sin remapeo** de iconos (`:459–465`); `data-ambient` se escribe siempre de
forma explícita porque el eje no tiene cascada base (`:467–472`). La semántica completa
de atributo presente/ausente por eje —incluidos los valores de línea base que eliminan
el atributo en `bg`, `font` y `ambcolor`— es la tabla canónica de
[`design-system/customizer-catalog.md`](./design-system/customizer-catalog.md)
§Atributos y reset (D-07); esta sección no la reenumera. Reescribir cualquier eje sin
esa lógica sería una divergencia observable.

### 6.2 Persistencia: memoria + backend, nunca `localStorage`

El DS persiste en `localStorage` bajo la clave `darkone-custom-theme`
(`theme-customizer.js:54`, `409`; `app.js:121`, `128`, `131`). **Ese mecanismo se
sustituye y no se copia.** En el cliente:

- El estado de los 8 ejes vive en el store Pinia `appearance`, en memoria.
- La escritura diferida usa `PUT` contra la ruta de §5.3; el reset usa `DELETE`.
- El cliente **no** escribe `localStorage` de apariencia, ni `sessionStorage`, ni
  cookies de estado (`R-DAT-05`).
- Ningún otro `localStorage` del cliente se copia desde el DS.

**Restauración.** Tras un login nuevo o una recarga, `GET` de §5.3 se resuelve **antes
de que la app quede lista**, y sus ocho atributos se aplican a `<html>` antes del primer
pintado de la superficie autenticada. En el modo público (login, recuperación) no se
consulta ni se persiste nada: se aplican los defaults canónicos, de modo que nunca se
pinta la apariencia de otro usuario ni se produce un parpadeo por preferencias ajenas.

### 6.3 Catálogo exacto

La fuente canónica de los valores y defaults por eje es
[`design-system/customizer-catalog.md`](./design-system/customizer-catalog.md), que
translitera el catálogo ejecutable de `theme-customizer.js:54–81` y registra la
divergencia de la narrativa del DS (26 fondos ejecutables frente a 19 declarados). Esta
sección conserva sólo el resumen de conteos y defaults para cruce rápido; ninguna opción
se agrega ni se renombra, y la lista completa de valores no se duplica aquí (D-07).

| Eje | Default | Nº de valores |
|---|---|---:|
| `theme` | `dark` | 2 |
| `accent` | `mint` | 27 |
| `bg` | `command` | 26 |
| `font` | `ibm-plex` | 9 |
| `radius` | `square` | 3 |
| `iconfam` | `phosphor` | 7 |
| `ambient` | `embers` | 8 |
| `ambcolor` | `accent` | 7 |

El reset restablece exactamente esos ocho defaults, en una sola operación idempotente.
La variante `orbit` que aparece en descripciones antiguas del producto **no existe** en
el código: el catálogo vigente de ambientes son los ocho valores del tomo canónico, y
ninguna variante adicional está disponible en la fuente.

**Radios literales:** `square` pone los 10 tokens de radio a `0`, `subtle` a `2px` y
`soft` deja la cascada, cuyo valor efectivo es `5.6px` (`baseui.css:37–72`, bloque
`--bui-card-radius`). Los tres valores son los del Design System; **no se introduce
densidad, grosor de borde ni espaciado inventado**, porque el Design System no los
define y esta spec no puede crearlos.

### 6.4 Tipografías y familias de iconos

- Las 9 tipografías se cargan **bajo demanda** con las URLs originales del Design System
  (`theme-customizer.js:83–92`, `ensureFontLink` en `:698–708`), con deduplicación del
  `<link>` por URL. Se conservan esas URLs porque son parte de la reproducción fiel.
- La familia de iconos activa se aplica sobre **44 conceptos** mapeados
  (`ICON_MAP_ROWS`, `theme-customizer.js:235–280`): `caret-down`, `close`, `menu-user`,
  `table`, `menu`, `map`, `leaf`, `layout`, `home`, `dribbble`, `close-circle`,
  `chart-bar`, `bug`, `box`, `palette`, `arrow-right`, `arrow-down`, `user`, `sun`,
  `moon`, `search`, `hamburger`, `settings`, `logout`, `bell`, `wallet`, `users-group`,
  `pie-chart`, `lock`, `help`, `globe`, `cart`, `check-double`, `bx-user`, `bx-home`,
  `envelope`, `info-circle`, `badge-check`, `x-circle`, `user-voice`, `heart`,
  `cloud-upload`, `cloud`, `check-shield`. El mapa inverso mantiene el remapeo idempotente
  en cualquier dirección (`theme-customizer.js:313`).
- El producto **añade sus propias colecciones** de iconos junto a las del DS, siguiendo el
  mismo patrón de registro (`registerArmsCollection`, `registerLucideArmsCollection`,
  `theme-customizer.js:861–863`): los conceptos que el producto necesite y el DS no
  tenga se registran como colección propia, sin inventar variantes ni sustituir ninguna
  de las del Design System.

### 6.5 Autosave

- **Debounce** sobre la escritura, con **una sola petición en vuelo por principal**.
- Sólo se conserva **la última instantánea pendiente**: una nueva selección durante un
  `PUT` en vuelo no abre una segunda escritura concurrente, la sustituye.
- `PUT` y `DELETE` **nunca** se ejecutan fuera de orden respecto de sí mismos.
- La marca `saved` sólo se aplica si la respuesta pertenece a la **generación o
  instantánea vigente**; una respuesta tardía no puede marcar como guardado algo que ya
  se cambió.
- Un error de lectura **no** se interpreta como "guardar los defaults": una
  indisponibilidad de red deja el estado local intacto y la UI en estado de error, no
  en defaults.
- Al cerrar sesión o cambiar de principal se **abortan** las peticiones en vuelo, se
  **descartan** las respuestas tardías, se **vacía la cola** de escrituras pendientes y se
  **restablecen** los defaults de cliente. Cambiar de unidad activa **no** borra
  preferencias: la pertenencia sigue siendo el mismo usuario.

## 7. Integración visual con el Design System

Fuente única: **`../../Inume Design System/`**, accesible y verificada en esta revisión
(46 entradas). La carpeta interna homónima del repositorio está prohibida como fuente.
El contrato es **documental**: no se instala, no se importa. Los tomos canónicos del
contrato visual son
[`design-system/visual-contract.md`](./design-system/visual-contract.md) (composición de
shell, card, Base UI y auth), [`design-system/reference-pages.md`](./design-system/reference-pages.md)
(páginas y capas CSS por familia) y
[`design-system/customizer-catalog.md`](./design-system/customizer-catalog.md) (ejes del
personalizador); esta sección conserva la decisión de transcripción que los atraviesa.

**Alcance de la transcripción.** Los ejes se aplican mediante
`assets/css/theme-customizer.css`, cargado **último** en el `<head>`: bloques
`html[data-accent="…"]`, `html[data-theme][data-bg="…"]`, `html[data-radius="…"]`,
`html[data-font="…"]`, `html[data-iconfam="…"]`, `html[data-ambcolor="…"]` y
`html[data-ambient="…"]`. Para que `theme`, `accent` y `bg` se comporten como en el DS,
el cliente transcribe **los bloques de tokens completos** (los que reescriben `--bg`,
`--surface`, `--surface-2`, `--hover`, `--border`, `--border-2` y la familia espejo
`--bui-*`), no una muestra. `ambient` y `ambcolor` tiñen la capa de ambiente a través de
`--ambient-tint` y no reescriben tokens: el motor compositor vive en `assets/js/app.js` y
**no se reproduce**; los 8 valores de ambiente se aplican como atributo y tinte, que es
lo que el eje significa en la fuente.

**Tokens del shell y Base UI** — valores tomados de
`../../Inume Design System/assets/css/baseui.css:37–72` (bloque dark):

| Token | Valor |
|---|---|
| `--bui-bg` | `#191e23` |
| `--bui-surface` | `#1d2329` |
| `--bui-surface-2` | `#242b33` |
| `--bui-border` | `#272f37` |
| `--bui-card-radius` | `5.6px` |
| `--bui-card-border` | `3px double var(--bui-border)` |
| `--bui-card-shadow` | `0 3px 4px 0 rgba(0,0,0,.03)` |
| `--bui-z-modal` | `1050` |

**Páginas DS de referencia por pantalla:** `index.html` (shell y panel del personalizador);
`auth-signin.html` / `auth-password.html` (login y recuperación); `forms-basic.html`,
`forms-validation.html`, `forms-editors.html`, `forms-fileuploads.html`,
`forms-flatpicker.html` (altas y errores); `tables-basic.html`, `tables-gridjs.html`
(listados); `ui-card.html`, `ui-badge.html`, `ui-modal.html`, `ui-toasts.html`,
`ui-tabs.html`, `ui-breadcrumb.html`, `ui-pagination.html`, `ui-list-group.html`
(composición); `charts.html` (métricas); `pages-404-alt.html` (estado sin ruta, fuente
completa).

El panel original de tema del DS se integra en la gestión central de apariencia de la
app sin deformar sus componentes: conserva su anatomía, sus clases y su comportamiento,
y se sirve desde la ruta `/personalizador`.

## 8. Uso de los endpoints de soporte de authz

No son material de catálogo: cada uno tiene un consumidor concreto.

| Endpoint | Flujo que lo consume | Dónde aparece |
|---|---|---|
| `GET /api/authz/catalog/` | Fill de la matriz de permisos: roles, scopes, resources (11 códigos) y actions (8, con `label` y `description` para tooltips) | Pantalla de matriz rol → permiso y puesto → permiso |
| `GET /api/authz/role-categories/` | Agrupación de roles en 4 categorías operativas (`admin`, `mando`, `tiro`, `almacen`) | Panel de permisos por persona: checkboxes de rol agrupados |
| `GET /api/authz/personas-por-unidad/?unit_code=X&include_descendants=true` | Lista de personas con rol funcional dentro de una unidad, con sus asignaciones (excluye el `tirador` implícito) | Panel de permisos por unidad |
| `GET /api/authz/eligible-target-units/?user_id=X` | Destinos válidos para asignar un rol funcional a una persona concreta (unidad personal + hasta 2 ancestros, filtrados por la rama del solicitante) | Selector de unidad en alta de usuario y en `agregar-asignacion` |

Los catálogos de `authz/catalog` cubren **11** recursos y **8** acciones
(`views.py:1820–1850`) y son un subconjunto del mapa real de permisos: no sustituyen a
`context.permissions`, que es la lista efectiva del usuario.

## 9. Estado y componentes de datos

- Pinia en memoria. Cada store expone `status ∈ {idle, loading, ready, empty, denied, error}`.
- `empty` ≠ `error` ≠ `denied`; `denied` proviene de `403` con `detail`.
- El store `appearance` expone, además, `saveState ∈ {idle, dirty, saving, saved, error}`
  y un contador de escritura pendiente, que son la fuente de verdad del rótulo de estado
  del panel.
- Búsqueda, orden y selección se resuelven **en cliente** sobre arrays planos
  (`R-RES-22`). `REST_FRAMEWORK` no define paginación (`settings.py:156–172`), así que
  las tablas usan scroll con búsqueda client-side.
- Los estados concretos de cada pantalla (`SCREEN-*`) —carga, vacío, error, denegación,
  guardado y sus criterios observables— viven en los tomos de
  [`experience/screens/`](./experience/screens.md); este documento fija sólo el modelo
  de estados del store.

## 10. Métricas

Sólo las que el backend entrega: tiros totales y acertados, y tiradores únicos, desde
`lecciones/{id}/resultados-resumen` (sumas y `count(distinct id_usuario)` del backend); y
el desglose por fracción, tirador, unidad y arma desde `lecciones/{id}/reporte`, con el
indicador `aggregate_only` de la respuesta. El porcentaje de acierto es la única métrica
derivada: `acertados / total * 100` con un decimal, sólo si `total > 0`; con `total = 0` se
muestra `—`, nunca `0`. Nunca se extrapola el total de una lección al total de la
institución (`R-DAT-04`).

## 11. Seguridad

- Sin persistencia de credenciales ni PII en cliente (`R-DAT-05`), ni en logs, errores ni
  artefactos (`R-DAT-06`): los mensajes del backend que contienen RUT se muestran en
  pantalla pero no se registran.
- La nueva ruta de preferencias no expone PII: expone preferencias visuales del propio
  solicitante y no acepta identificadores de terceros.
- La UI no reimplementa autorización: oculta lo que el permiso no permite, pero el
  backend sigue siendo la autoridad. Ante `403` inesperado se muestra el `detail`.
- No se ejecutan acciones destructivas sin confirmación, y sólo sobre recursos que el
  backend listó en la respuesta previa.

## 12. Riesgos técnicos

| ID | Riesgo | Mitigación |
|---|---|---|
| T-01 | Listados sin paginación pueden ser pesados en tenant grande | búsqueda y render client-side; sin cambiar contrato |
| T-02 | El tenant inicial no tiene endpoint de bootstrap; se resuelve con selección manual de institución real en el login | el login y `select-unit` no lo exigen; el contexto sí. Se documenta como flujo explícito, sin código de demo |
| T-03 | Throttling en login (20/min) y selección de unidad (30/min) | deshabilitar el botón durante el vuelo y mostrar `Retry-After` |
| T-04 | B-01 puede romper `lecciones/{id}/resultados` | error explícito en esa pestaña; `resultados-resumen` y `reporte` siguen disponibles e **no** sustituyen el detalle |
| T-05 | `vue-router` **ya está instalado y en uso** (`vue-router 5.3.1`, `front/package.json`; router real en `front/src/router/`; verificado 2026-10-15) | la instalación se declaró como fase de implementación y quedó ejecutada; el diseño fija la versión exacta y sus peers verificados |
| T-06 | `memberships` comparte `resource_name` con `posiciones` | permisos derivados del par `(position, action)`, no de la pantalla |
| T-07 | Escrituras de preferencias fuera de orden si el usuario cambia rápido varios ejes | debounce, una sola escritura en vuelo, marca `saved` sólo por instantánea vigente |
| T-08 | Fuga de apariencia entre usuarios si el store sobrevive al cambio de principal | vaciado de cola, aborto de peticiones y restauración antes de `ready` |
| T-09 | Un `403` en la ruta de preferencias puede malinterpretarse como fin de sesión | la ruta no exige tenant; el cliente distingue por contexto y consulta el contexto en vez de cerrar sesión |

## 13. Decisiones técnicas

- **`vue-router@5.3.1` es dependencia obligatoria**, con `createWebHistory`. Sustituye a
  la navegación por hash manual del borrador previo (§1).
- **Sin capa Service/Repository en el cliente**: los módulos de `api/` son funciones por
  recurso; los stores orquestan estado.
- **Validación de forma en el borde**: cada módulo de `api/` valida la forma de la
  respuesta antes de entrar al store, siguiendo el patrón de `front/src/api/dashboard.js`.
- **Nada de caché persistente**: se re-consulta al volver a una pantalla mientras la
  sesión lo permita, para no mostrar datos de otra unidad.
- **Personalizador completo de 8 ejes**, no de tres: la persistencia del Design System
  original en `localStorage` se sustituye por memoria + backend.
- **Sin nuevas bibliotecas de UI**, sin Axios. **TypeScript es obligatorio en el código
  objetivo** (D-08 en `requirements.md` §12, orden del operador del 2026-10-02): SFC con
  `<script setup lang="ts">` y módulos `.ts` para router, HTTP, stores y composables
  propuestos. La restricción previa «sin TypeScript» queda **derogada (superseded)**. El
  baseline JavaScript de `front/src/` quedó **superado** (hoy en **TypeScript**; verificado
  2026-10-15); el kit
  externo del DS sigue siendo HTML/CSS/JS como referencia.
- **Comprobación de tipos (mencionada, no instalada).** Una futura comprobación de tipos
  puede diseñarse como apoyo de la verificación; esta spec **no instala ni ejecuta**
  tooling ni crea comandos para ello, y un typecheck satisfactorio **no acredita por sí
  solo** el resultado observable de usuario: los criterios de cierre siguen en
  `verification.md`.
- **Delegación en tomos canónicos (D-07).** Rutas consolidadas, menú y guards en
  `experience/navigation.md`; catálogo de pantallas y cobertura OP → SCREEN en
  `experience/screens.md`; catálogo exacto del personalizador en
  `design-system/customizer-catalog.md`; contratos campo a campo en `contracts/`. Este
  documento no los reenumera ni abre un router paralelo.
