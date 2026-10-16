---
spec_meta: "../../spec-meta.yaml"
---

# Flujos — Sesión y contexto

> 📜 Yo detallo aquí los seis flujos que sostienen toda la operación: entrar, arrancar,
> fijar contexto, cambiar de unidad, salir y reaccionar a la pérdida de sesión. Las
> clases de fallo `F-*` se definen en [../flows.md](../flows.md); los estados `ST-*` en
> [../states.md](../states.md); el transporte (cabeceras, CSRF, anti-carrera) en
> [../../technical-design.md](../../technical-design.md) §2 y en
> [../../requirements/shared-session-data.md](../../requirements/shared-session-data.md).

## Índice

1. [FL-SES-001 — Login y captura de institución](#fl-ses-001--login-y-captura-de-institución)
2. [FL-SES-002 — Bootstrap y recarga profunda](#fl-ses-002--bootstrap-y-recarga-profunda)
3. [FL-SES-003 — Contexto inicial y selección de unidad](#fl-ses-003--contexto-inicial-y-selección-de-unidad)
4. [FL-SES-004 — Cambio de unidad activa](#fl-ses-004--cambio-de-unidad-activa)
5. [FL-SES-005 — Logout](#fl-ses-005--logout)
6. [FL-SES-006 — Expiración y contexto perdido](#fl-ses-006--expiración-y-contexto-perdido)

---

### FL-SES-001 — Login y captura de institución

- **Actor:** usuario público (sin sesión).
- **Pantalla:** login (`SCREEN/login` provisional; ref. visual DS `auth-signin.html`).
- **Precondición:** sin sesión activa; apariencia en defaults canónicos de modo público
  (FL-APP-007); throttle de auth declarado en `20/min`.
- **Entradas:** RUT, contraseña e **institución** (código de tenant). El campo de
  institución reutiliza el ya existente en el formulario de login real
  (`requirements.md` R-LOGIN-01, D-03): el backend **no** expone lista de tenants y el
  cliente no hardcodea códigos de demo.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa RUT, contraseña e institución y envía | `POST /auth/login/` (OP-AUT-001) con body `{rut, password}`; el endpoint está excluido de `X-Tenant-Code` (`technical-design.md` §2 regla 3); botón deshabilitado durante el vuelo (T-03) | `200 {id_usuario, must_change_password}`; crea sesión por cookie HttpOnly; no devuelve token | Guarda en memoria `id_usuario` y el código de institución como tenant; no persiste nada en storage (R-DAT-05) |
| 2a | — (respuesta con `must_change_password: true`) | ninguna petición adicional | — | Enruta a FL-PWD-001 y bloquea el resto de la funcionalidad (R-AUTH-02, R-ROUTER-05) |
| 2b | — (respuesta con `must_change_password: false`) | continúa en FL-SES-002/003 con `GET /auth/context/` portando `X-Tenant-Code` = institución capturada | ver FL-SES-003 | Navega al destino preservado en `query.redirect` (R-ROUTER-04) o al flujo de contexto |

- **Postcondición observable:** sesión por cookie establecida; tenant y `id_usuario` en
  memoria; o bien el flujo forzado de contraseña iniciado y bloqueante.
- **Validación de institución:** el contrato de OP-AUT-001 declara sólo `{rut, password}`
  ([contrato auth](../../contracts/auth-context.md) §Sesión y recuperación): la
  institución **no se valida en el login**. La primera validación efectiva ocurre en
  `GET /auth/context/`; si el código no corresponde, el `403` de `HasTenantAccess`
  dispara F-12 y el usuario vuelve a la captura. No se inventa validación previa.
- **Fallos:** `400` → mensaje del backend literal (`RUTAuthTokenSerializer.validate`),
  permanecer en el formulario, sin sugerir credenciales (R-AUTH-03; F-01 sin anclaje por
  campo declarado). `429` → F-03. Red → F-06. `403` → F-12. Cancelar limpia el
  formulario sin petición (F-09). `404`/conflicto: no declarados en este endpoint.

---

### FL-SES-002 — Bootstrap y recarga profunda

- **Actor:** usuario autenticado con cookie viva, o usuario público.
- **Pantalla:** cualquier ruta (guard global); referencia de ruta en
  `technical-design.md` §4.
- **Precondición:** la app arranca o el navegador recarga una URL directa; el store de
  sesión está vacío porque Pinia vive sólo en memoria (R-DAT-05).
- **Entradas:** URL solicitada; cookie `sessionid` HttpOnly si existe; tenant en memoria
  sólo si no hubo recarga.

| # | Paso | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | El usuario abre o recarga una URL | ninguna todavía: la app entra en estado `booting` y los guards **esperan** al store de sesión antes de decidir (R-ROUTER-06, `technical-design.md` §3.2) | — | ST-01 de arranque; ninguna pantalla operativa se resuelve contra contexto vacío |
| 2a | — (navegación SPA sin recarga: tenant presente en memoria) | `GET /auth/context/` (OP-AUT-002) con `X-Tenant-Code` | `200` con el objeto de contexto completo (R-SES-007) | Reconstruye la pantalla de la URL, incluida entrada directa a detalle (R-ROUTER-03) |
| 2b | — (recarga profunda: tenant ausente de memoria) | el contexto **no puede consultarse**: OP-AUT-002 exige `X-Tenant-Code` (TA) y el tenant no se persiste | — | El guard redirige a `/contexto`, cuya función declarada es «selección de unidad activa y de tenant» (`technical-design.md` §4): el usuario re-captura la institución (FL-SES-003) |
| 3 | — (contexto con `must_change_password: true`) | ninguna | — | Toda ruta operativa queda bloqueada salvo `password-required` y login (R-ROUTER-05 → FL-PWD-001) |
| 4 | — (URL sin ruta declarada) | ninguna | — | Pantalla 404 del DS (`pages-404.html`), nunca vista en blanco (R-ROUTER-08) |

- **Postcondición observable:** la pantalla correspondiente a la URL queda reconstruida,
  o el usuario está en `/contexto` re-capturando institución, o en el flujo forzado de
  contraseña; jamás es expulsado al login por resolver contra un contexto vacío.
- **Hueco registrado G-SES-1:** tras una recarga profunda con sesión viva no existe
  endpoint que devuelva el tenant sin cabecera; la única vía documentada es la
  re-captura manual en `/contexto`. No se inventa un endpoint de bootstrap ni se pide
  lista de tenants (R-AUTH-06). Se reporta al integrador sin workaround adicional.
- **Fallos:** `403` en el contexto → F-12. Red → F-06 con reintento explícito (F-10),
  sin bucle. Ruta `requiresTenant` sin tenant → pantalla de contexto perdido sin
  reintento en bucle (R-ROUTER-07).

---

### FL-SES-003 — Contexto inicial y selección de unidad

- **Actor:** usuario autenticado sin unidad activa resuelta, o tras FL-SES-001/002.
- **Pantalla:** `/contexto` — selección de unidad activa y de tenant
  (`FL/contexto-unidad` provisional).
- **Precondición:** sesión viva; tenant en memoria o re-capturado en esta pantalla.
- **Entradas:** código de institución (si falta); selección de unidad tomada
  **exclusivamente** de las asignaciones y pertenencias que el propio contexto devuelve
  (`assignments[]`, `unit_membership?`): no existe endpoint de lista de unidades para
  este paso y no se inventa.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Llega a `/contexto` | `GET /auth/context/` (OP-AUT-002) con `X-Tenant-Code` | `{user:{id_usuario,rut?,must_change_password}, tenant:{code?,context?}, active_organization_unit?, unit_membership?, scopes[], assignments[{role,scope?,organization_unit?,is_primary}], permissions[]}` | Alimenta el store de sesión (R-SES-007); si `active_organization_unit` ya viene, se muestra como unidad vigente |
| 2 | Selecciona su unidad activa | `POST /auth/select-unit/` (OP-AUT-003) con `{organization_unit_code}`; throttle `unit_selection: 30/min` | `200 {detail, organization_unit_code, tenant_code}` | Guarda la unidad en memoria; los datos dependientes se cargarán ya bajo el nuevo contexto |
| 3 | Confirma | `GET /auth/context/` de nuevo si la pantalla necesita el estado consolidado | objeto de contexto actualizado | Navega al destino preservado (`query.redirect`) o al dashboard |

- **Postcondición observable:** contexto completo en memoria (usuario, tenant, unidad
  activa, scopes, asignaciones, `permissions[]`); las rutas operativas quedan disponibles
  y el menú se puebla según permisos (R-RES-25).
- **Fallos:** `400` por código ausente → F-01. `403` → motivo literal según modo:
  `La unidad no está en tus pertenencias activas.` (v2, `AUTHZ_USE_UNIT_MEMBERSHIP=True`)
  o `La unidad no esta en sus asignaciones activas.` (fallback legacy); **sin reintento**
  (R-UNIT-02; F-02). `429` → F-03 (`30/min`). Red → F-06. `403` de tenant → F-12.

---

### FL-SES-004 — Cambio de unidad activa

- **Actor:** usuario con más de una pertenencia/asignación activa (US-03).
- **Pantalla:** selector de unidad del shell (descriptiva; ref. DS `index.html` topbar).
- **Precondición:** contexto cargado; unidad activa vigente.
- **Entradas:** nueva unidad elegida entre las devueltas por el contexto.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre el selector y elige otra unidad | `POST /auth/select-unit/` (OP-AUT-003) `{organization_unit_code}` | `200 {detail, organization_unit_code, tenant_code}` | Actualiza la unidad en memoria |
| 2 | — (reacción automática) | `GET /auth/context/` (OP-AUT-002) | contexto actualizado | **F-08:** incrementa `generation` de los stores; descarta respuestas tardías (ST-08); recarga los datos dependientes de las pantallas abiertas desde el nuevo contexto; sin caché persistente (`technical-design.md` §13) |
| 3 | — (apariencia) | ninguna | — | Las preferencias de los 8 ejes **se conservan**: sigue siendo el mismo usuario (R-APP-06, FL-APP-006) |

- **Postcondición observable:** toda superficie muestra datos de la nueva unidad; ningún
  dato de la unidad anterior sobrevive en vistas activas; la apariencia no cambia.
- **Fallos:** `403` → literales de FL-SES-003, sin reintentar (R-UNIT-02). `429` → F-03.
  Red → F-06: la unidad activa en memoria no cambia hasta respuesta exitosa. En vuelo,
  un cambio de contexto concurrente descarta la respuesta vieja (F-08).

---

### FL-SES-005 — Logout

- **Actor:** usuario autenticado.
- **Pantalla:** acción de logout del shell (descriptiva; icono `logout` del mapa DS).
- **Precondición:** sesión viva.
- **Entradas:** ninguna; OP-AUT-005 no lleva body.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Pulsa logout | El cliente **aborta primero las peticiones en vuelo** (F-07), incluidas las escrituras de apariencia en cola | — | ST-01 transitorio de cierre |
| 2 | — | `POST /logout/` (OP-AUT-005), excluido de `X-Tenant-Code` (`technical-design.md` §2 regla 3) | `200 {detail}`; cierra la sesión servidor | — |
| 3 | — | Purga local obligatoria (R-AUTH-08): vaciar **todo** store en memoria, descartar respuestas tardías, restablecer apariencia a defaults (R-APP-06) | — | Redirige a `/login` |

- **Postcondición observable:** ningún dato de negocio, permiso ni preferencia persiste
  en el cliente; la pantalla de login se pinta con defaults canónicos.
- **Fallo de red en el paso 2:** la purga local y la redirección se ejecutan igualmente;
  el intento de notificar al backend es único y sin reintento (no hay mecanismo de
  refresh ni de reintento declarado). Se registra como decisión de cliente, no como
  comportamiento del backend.
- **Fallos:** F-07 (aborto), F-08 no aplica (no hay contexto siguiente). `403` con
  sesión ya inválida → mismo camino de purga (F-12).

---

### FL-SES-006 — Expiración y contexto perdido

- **Actor:** sistema (detección) y usuario (reacción visible).
- **Pantalla:** cualquier ruta activa cuando ocurre.
- **Precondición:** sesión expirada, cancelada en otro extremo, o tenant inválido.
- **Entradas:** ninguna; es un flujo reactivo.

| # | Disparador | Detección | Reacción obligatoria |
|---:|---|---|---|
| 1 | Sesión ausente o expirada | La API **no emite `401`**: `SessionCsrfAuthentication` degrada `NotAuthenticated` a `403` (R-AUTH-07, `technical-design.md` §2 regla 4). El `403` de tenant llega como `No tiene acceso al tenant solicitado.` | F-12: purgar estado en memoria, abortar en vuelo (F-07), volver a `/login` **sin reintentar**; preservar el destino en `query.redirect` como hace el guard (R-ROUTER-04) |
| 2 | Ruta `requiresTenant` sin tenant en contexto | Guard global (`technical-design.md` §3.2) | Pantalla de contexto perdido, sin bucle de reintento (R-ROUTER-07) |
| 3 | `403` de negocio con `detail` en una operación | Respuesta con sesión viva | **No** es expiración: F-02, la sesión se conserva y el `detail` se muestra literal |

- **Postcondición observable:** el usuario está en login con la app purgada, o en la
  pantalla de contexto perdido; ninguna vista conserva datos de la sesión terminada y
  ninguna petición tardía repinta estado (ST-08).
- **Distinción obligatoria:** `403` no es distinguible por código solo entre «sin
  permiso» y «sin sesión» (R-AUTH-07): el cliente diferencia por el `detail` y el
  contexto de la ruta (regla 4 de `technical-design.md` §2). Un `403` en la ruta de
  preferencias **nunca** cierra sesión automáticamente (T-09, FL-APP-004).
