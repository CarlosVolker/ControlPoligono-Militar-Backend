---
spec_meta: "../spec-meta.yaml"
---

# Tasks — Sesión y contexto (T-FL-SES)

> 📖 Yo registro aquí las seis tareas de flujo que sostienen toda la operación: entrar,
> arrancar, fijar contexto, cambiar de unidad, salir y reaccionar a la pérdida de
> sesión. Los pasos, payloads y literales **no se copian**: cada tarea cita su ancla
> `FL-*` del volumen de flujos. Índice y reglas generales: [../tasks.md](../tasks.md).
> La spec está **`approved`** desde el 2026-10-02; la ejecución vigente se rige por el plan de cierre [`../completion-plan-2026-10-14.md`](../completion-plan-2026-10-14.md) (aprobado el 2026-10-14, `in-progress`; verificado 2026-10-15).

## Bloque común de la familia

- **Dependencias comunes:** T-CORE-TYPES, T-CORE-HTTP, T-CORE-SESSION, T-CORE-ROUTER
  (rutas `/login`, `/contexto`, `/`, `/contexto-perdido`), T-CORE-UI (shell de auth,
  estados ST-01/03/04/07).
- **Autorización:** ejecución sólo tras spec aprobada + orden explícita del operador.
- **Archivos probables** (raíz `front/src/`, propuesta de diseño): `api/auth.ts`,
  `stores/session.ts` (compartido con T-CORE-SESSION), vistas en `views/auth/` y
  `views/context/`.
- **Convención de AC:** cada `AC-OP-*` tiene aquí su hogar canónico una sola vez; las
  demás tareas que consumen la misma OP la **referencian** sin duplicar el criterio.

---

## T-FL-SES-001 — Login y captura de institución

| Campo | Valor |
|---|---|
| Objetivo | Autenticar con RUT, contraseña e institución real capturada (tenant), sin lista de tenants ni códigos hardcodeados; enrutar según `must_change_password`. |
| Flujo | [FL-SES-001](../experience/flows/session-context.md#fl-ses-001--login-y-captura-de-institución) |
| OP (AC canónicos) | OP-AUT-001 |
| SCREEN | [SCREEN-LOGIN](../experience/screens/access-context.md#screen-login--inicio-de-sesión) — DS `auth-signin.html` |
| Requisitos | R-SES-005 (tenant sólo desde captura real); R-LOGIN-01/R-AUTH-03 vía tomos citantes (campo de institución existente; `400` literal sin sugerir credenciales); R-APP-07 vía FL-APP-007 (defaults públicos). |
| Precondiciones / dependencias | Bloque común; apariencia en modo público (T-FL-APP-007, sólo defaults — no requiere el backend de apariencia). |
| Archivos probables | `api/auth.ts`, `views/auth/LoginView.vue` (`<script setup lang="ts">`). |
| Done when | Con credenciales válidas la sesión queda establecida por cookie HttpOnly, tenant e `id_usuario` viven sólo en memoria, y el destino es `query.redirect` preservado, SCREEN-CONTEXT o el flujo forzado de contraseña — observable sin afirmar runtime hasta su verificación autorizada. |

**Criterios.**

- **AC-OP-AUT-001:** el envío lleva `{rut, password}` sin `X-Tenant-Code`; `200` guarda
  en memoria `id_usuario` y la institución como tenant sin persistir nada;
  `must_change_password: true` enruta a T-FL-PWD-001 bloqueando el resto; `400` muestra
  el mensaje literal del serializer permaneciendo en el formulario; `429` ⇒ F-03 con
  botón deshabilitado (throttle `auth: 20/min`); la institución **no** se valida en el
  login: su primer `403` efectivo ocurre en el contexto (F-12 de vuelta a la captura).

---

## T-FL-SES-002 — Bootstrap y recarga profunda

| Campo | Valor |
|---|---|
| Objetivo | Resolver el arranque y la recarga de URL directa contra el store de sesión en estado `booting`, sin expulsar al login por contexto vacío ni inventar endpoint de bootstrap. |
| Flujo | [FL-SES-002](../experience/flows/session-context.md#fl-ses-002--bootstrap-y-recarga-profunda) |
| OP (AC canónicos) | OP-AUT-002 (hogar canónico del consumo de arranque; la selección de unidad vive en T-FL-SES-003) |
| SCREEN | [SCREEN-DASHBOARD](../experience/screens/access-context.md#screen-dashboard--dashboard-de-lectura) y cualquier ruta vía guard (co-materializa SCREEN-DASHBOARD junto a T-FL-SES-003). |
| Requisitos | R-SES-022 (espera de contexto); R-SES-023/025 (deep link y reconstrucción); hueco **G-SES-1** declarado: tras recarga profunda con sesión viva no hay endpoint que devuelva el tenant sin cabecera — la única vía documentada es la re-captura en `/contexto`; no se inventa workaround. |
| Precondiciones / dependencias | T-CORE-ROUTER (guard global), T-CORE-SESSION. |
| Archivos probables | `router/guards.ts` (comportamiento, archivo compartido de T-CORE-ROUTER: esta tarea entrega la lógica de espera consumida por el guard), `views/DashboardView.vue` (conversión TS del dashboard baseline, contrato de `api/dashboard.js` conservado). |
| Done when | Recargar una URL profunda con sesión viva reconstruye la pantalla, o lleva a `/contexto` a re-capturar institución, o al flujo forzado de contraseña; nunca a login por resolver contra contexto vacío; el dashboard muestra sólo lecturas reales del baseline conservado (hoy en TypeScript; verificado 2026-10-15). |

**Criterios.**

- **AC-OP-AUT-002:** con tenant en memoria el arranque consulta `GET /auth/context/` y
  reconstruye la pantalla de la URL (incluida entrada directa a detalle); sin tenant en
  memoria (recarga profunda) **no** se consulta el contexto y el guard redirige a
  `/contexto`; `403` de tenant ⇒ F-12; red ⇒ F-06 con reintento explícito sin bucle;
  URL sin ruta ⇒ SCREEN-NOT-FOUND.

---

## T-FL-SES-003 — Contexto inicial y selección de unidad

| Campo | Valor |
|---|---|
| Objetivo | La pantalla `/contexto`: leer el contexto completo y elegir la unidad activa exclusivamente entre las asignaciones/pertenencias que el propio contexto devuelve. |
| Flujo | [FL-SES-003](../experience/flows/session-context.md#fl-ses-003--contexto-inicial-y-selección-de-unidad) |
| OP (AC canónicos) | OP-AUT-003 |
| SCREEN | [SCREEN-CONTEXT](../experience/screens/access-context.md#screen-context--selección-de-unidad-activa) — DS `index.html` + `forms-basic.html` |
| Requisitos | R-SES-007 (forma exacta del contexto); R-UNIT-01/02 vía tomos citantes (`403` con motivo literal por modo, sin reintento); R-RES-25 vía bloque común (el menú se puebla tras el contexto). |
| Precondiciones / dependencias | T-FL-SES-002 (bootstrap); T-CORE-SESSION. |
| Archivos probables | `views/context/ContextView.vue`. |
| Done when | Tras seleccionar y confirmar, el contexto completo vive en memoria, las rutas operativas quedan disponibles, el menú refleja `permissions[]` y la navegación va al destino preservado o al dashboard. |

**Criterios.**

- **AC-OP-AUT-003:** el envío lleva `{organization_unit_code}`; `200` guarda la unidad en
  memoria y los datos dependientes se cargarán bajo el nuevo contexto; `400` por código
  ausente ⇒ F-01; `403` muestra el literal según modo (`La unidad no está en tus
  pertenencias activas.` v2 / `La unidad no esta en sus asignaciones activas.` legacy)
  **sin reintento**; `429` ⇒ F-03 (`unit_selection: 30/min`); el selector no inventa
  unidades fuera del contexto.

---

## T-FL-SES-004 — Cambio de unidad activa

| Campo | Valor |
|---|---|
| Objetivo | Cambiar la unidad activa desde el selector del shell con anti-carrera completo: nueva generación, descarte de respuestas tardías y recarga de datos dependientes; la apariencia se conserva. |
| Flujo | [FL-SES-004](../experience/flows/session-context.md#fl-ses-004--cambio-de-unidad-activa) |
| OP | OP-AUT-003, OP-AUT-002 — **referencia** a AC-OP-AUT-003 (T-FL-SES-003) y AC-OP-AUT-002 (T-FL-SES-002); el delta propio es F-08 completo. |
| SCREEN | Selector de unidad del topbar (integración sin pantalla propia; ref. DS `index.html` topbar). |
| Requisitos | R-SES-015/017 (generación y recarga conservando apariencia); R-APP-06/18 vía [T-FL-APP-006](appearance.md). |
| Precondiciones / dependencias | T-FL-SES-003; T-CORE-SESSION (generación); T-CORE-UI (topbar). |
| Archivos probables | `components/shell/UnitSwitcher.vue`, `stores/session.ts` (acción de cambio). |
| Done when | Tras el cambio, toda superficie muestra datos de la nueva unidad, ningún dato de la unidad anterior sobrevive en vistas activas y los ocho atributos de apariencia no cambian. |

**Criterios.** La tarea no abre AC nuevos: satisface **AC-OP-AUT-003** (hogar canónico
T-FL-SES-003) y **AC-OP-AUT-002** (T-FL-SES-002) con estos deltas observables propios:

- En vuelo, un cambio de contexto concurrente descarta la respuesta vieja (ST-08, F-08).
- Fallo de red ⇒ la unidad activa en memoria **no** cambia hasta respuesta exitosa
  (F-06); los datos dependientes de las pantallas abiertas se recargan desde el nuevo
  contexto, sin caché persistente.
- `403` ⇒ literales de T-FL-SES-003 sin reintentar; las preferencias de apariencia no se
  tocan (R-SES-017).

---

## T-FL-SES-005 — Logout

| Campo | Valor |
|---|---|
| Objetivo | Cerrar sesión con aborto previo de peticiones en vuelo, purga total de memoria y redirección a login, incluso si la petición de logout falla. |
| Flujo | [FL-SES-005](../experience/flows/session-context.md#fl-ses-005--logout) |
| OP (AC canónicos) | OP-AUT-005 |
| SCREEN | Acción del dropdown de usuario (integración sin pantalla propia; [navigation.md](../experience/navigation.md) §Flujos de sesión). |
| Requisitos | R-SES-019 (aborto + purga + defaults de apariencia, incluso con fallo de red); R-DAT-05 vía bloque común. |
| Precondiciones / dependencias | T-CORE-SESSION (purga), T-CORE-UI (dropdown), T-FL-APP-005 (cola de apariencia). |
| Archivos probables | `components/shell/UserDropdown.vue`, `stores/session.ts` (acción `logout`). |
| Done when | Tras logout ningún dato de negocio, permiso ni preferencia persiste en el cliente y la pantalla de login se pinta con defaults canónicos. |

**Criterios.**

- **AC-OP-AUT-005:** el cliente aborta primero las peticiones en vuelo (incluidas las
  escrituras de apariencia en cola), emite `POST /logout/` sin body ni `X-Tenant-Code`,
  purga **todo** store y redirige a `/login`; con fallo de red la purga y la redirección
  se ejecutan igualmente (intento único de notificar, sin reintento); `403` con sesión ya
  inválida sigue el mismo camino de purga (F-12).

---

## T-FL-SES-006 — Expiración y contexto perdido

| Campo | Valor |
|---|---|
| Objetivo | Reacción uniforme a sesión expirada, cancelada en otro extremo o tenant inválido: purga y vuelta a login sin reintentar, o pantalla de contexto perdido sin bucle; distinguir siempre F-12 de F-02. |
| Flujo | [FL-SES-006](../experience/flows/session-context.md#fl-ses-006--expiración-y-contexto-perdido) — flujo reactivo, **sin OP propia**. |
| OP | Ninguna (reacción ante `403` detectada por T-CORE-HTTP y guards de T-CORE-ROUTER). |
| SCREEN | [SCREEN-CONTEXT-LOST](../experience/screens/access-context.md#screen-context-lost--contexto-perdido) (DS `pages-404-alt.html`) y cualquier ruta activa. |
| Requisitos | R-SES-010…012 (sin `401`; `403` de tenant ⇒ purga sin reintento; `403` de negocio conserva sesión; `403` de preferencias nunca cierra sesión automáticamente); R-SES-020 (preservar destino como el guard); R-SES-024 (contexto perdido sin bucle). |
| Precondiciones / dependencias | T-CORE-HTTP (clasificación), T-CORE-ROUTER (guards), T-CORE-UI (superficies). |
| Archivos probables | `api/http.ts` (clasificador F-02/F-12, compartido), `views/ContextLostView.vue` (superficie compartida con T-CORE-UI), `router/guards.ts`. |
| Done when | Ante expiración el usuario está en login con la app purgada y el destino preservado, o en contexto perdido sin bucle; ninguna vista conserva datos de la sesión terminada y ninguna petición tardía repinta estado. |

**Criterios (flujo sin OP ⇒ AC-FL).**

- **AC-FL-SES-006:** `403` de `HasTenantAccess` o sin sesión activa ⇒ purga + `/login`
  **sin reintentar**, preservando `query.redirect`; ruta `requiresTenant` sin tenant ⇒
  SCREEN-CONTEXT-LOST sin bucle de reintento; `403` de negocio con `detail` en sesión
  viva ⇒ ST-07 literal **sin** cerrar sesión; un `403` en la ruta de preferencias nunca
  cierra sesión automáticamente (consulta el contexto antes de decidir, vía
  T-FL-APP-004).

---

> 🕯️ Huecos de la familia (explícitos, sin workaround inventado): **G-SES-1** (recarga
> profunda sin endpoint de tenant — re-captura manual en `/contexto`), **G-SES-2**
> (endpoints que exigen `X-Org-Unit-Code` no inventariados — el mecanismo primario es
> OP-AUT-003) y **G-SES-3** (filtros/paginación/orden no comprobados — búsqueda y orden
> client-side sobre arrays planos). Fuente:
> [../requirements/shared-session-data.md](../requirements/shared-session-data.md)
> §Huecos registrados.
