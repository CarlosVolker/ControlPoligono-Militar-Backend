---
spec_meta: "../spec-meta.yaml"
---

# Criterios de aceptación — Sesión, acceso y recuperación

> 📖 Volumen del conjunto de aceptación `acceptance/` (método y convenciones en [`core.md`](core.md); matrices de cobertura en [`coverage.md`](coverage.md); estado, gates y autorizaciones en [`../verification.md`](../verification.md)).
> Estado global: **NO EJECUTADO**. Cubre las 10 OP de las familias `AUT` y `RCV`
> (`AC-OP-AUT-001…006`, `AC-OP-RCV-001…004`) y el flujo reactivo sin OP actual
> `AC-FL-SES-006`. `AC-OP-AUT-006` es **infraestructura, no UI**: no tiene pantalla,
> menú ni estado (perfil `P-INFRA` de [`../experience/states.md`](../experience/states.md)).

## Convenciones de familia

- **Precondición base:** la que cada fila declare (público sin sesión, sesión viva,
  tenant real capturado en el login, bandera `must_change_password`, rol declarado).
  Los datos son los reales del entorno en uso; si el dato necesario no existe, el
  criterio queda pendiente por falta de dato real: fixtures, mocks y registros
  sintéticos están prohibidos. Los ejemplos de credenciales son placeholders genéricos
  (`<RUT>`, `<CONTRASENA>`), nunca PII.
- **Fallos heredados:** cada fila hereda las clases `F-01…F-12`
  ([`../experience/flows.md`](../experience/flows.md)) y los estados `ST-*` según el
  perfil `P-*` de su OP ([`../experience/states.md`](../experience/states.md)); la
  columna de fallos registra sólo deltas específicos.
- **Sin afirmación de runtime del backend:** toda «respuesta citada» proviene de los
  contratos durables ([`../contracts/auth-context.md`](../contracts/auth-context.md));
  el criterio expresa lo que el usuario observará cuando la comprobación se autorice.
- Ninguna fila abrevia un rango: `PUT` y `PATCH` serían criterios separados si
  existieran en esta familia (no existen: login/logout/contexto/select-unit/audit son
  operaciones únicas).

## AC-OP — Autenticación y contexto

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-AUT-001 | `POST /api/auth/login/` | Usuario público sin sesión; cuenta real existente en una institución real; throttle `auth: 20/min` declarado | SCREEN-LOGIN: completar `<RUT>`, `<CONTRASENA>` e institución (campo real, D-03; sin lista de tenants ni código hardcodeado) y enviar (FL-SES-001 paso 1) | `200 {id_usuario, must_change_password}` (contrato §Sesión): sesión por cookie HttpOnly, sin token visible ni guardado; `id_usuario` e institución quedan sólo en memoria; flag `false` ⇒ SCREEN-CONTEXT o destino de `query.redirect`; flag `true` ⇒ SCREEN-PASSWORD-FORCED bloqueante | `400` ⇒ mensaje literal del serializer en el formulario, sin sugerir credenciales (ST-04, F-01 sin anclaje declarado); `429` ⇒ F-03 con botón deshabilitado; red ⇒ F-06; cancelar limpia sin petición (F-09); institución inválida no se valida aquí: el `403` posterior del contexto dispara F-12 | `auth-signin.html` + `auth.css` |
| AC-OP-AUT-002 | `GET /api/auth/context/` | Sesión viva; tenant en memoria (navegación SPA) o re-capturado en `/contexto` (recarga profunda, hueco G-SES-1) | Bootstrap/guards (FL-SES-002), materializado en SCREEN-CONTEXT y SCREEN-DASHBOARD; la app espera en `booting` antes de resolver ruta | El store consume la forma exacta del contrato: `user{id_usuario, rut?, must_change_password}`, `tenant`, `active_organization_unit?`, `unit_membership?`, `scopes[]`, `assignments[{role, scope?, organization_unit?, is_primary}]`, `permissions[]` — clave `permissions`, nunca `permission_codes`; menú y acciones visibles sólo desde `permissions[]`; recarga profunda sin tenant ⇒ `/contexto` (re-captura manual), sin endpoint de bootstrap inventado | `403` de tenant (`No tiene acceso al tenant solicitado.`) ⇒ F-12: purga + login sin reintento; red ⇒ F-06 con reintento explícito (F-10), sin bucle; contexto no es «vacío visible»: sin él no se resuelve ninguna ruta operativa | `index.html` (shell) |
| AC-OP-AUT-003 | `POST /api/auth/select-unit/` | Usuario con varias pertenencias/asignaciones activas reales devueltas por el contexto; throttle `unit_selection: 30/min` | SCREEN-CONTEXT o selector de topbar: elegir otra unidad y confirmar (FL-SES-003/004) | `200 {detail, organization_unit_code, tenant_code}`: la unidad queda en memoria; todas las pantallas abiertas se recargan con datos de la nueva unidad; ningún dato de la unidad anterior sobrevive (F-08: `generation` incrementado, respuestas tardías ST-08 descartadas); la apariencia se conserva (AC-FL-APP-006) | `400` código ausente ⇒ F-01; `403` ⇒ literal por modo —`La unidad no está en tus pertenencias activas.` (v2) o `La unidad no esta en sus asignaciones activas.` (legacy)— sin reintento (F-02); `429` ⇒ F-03; red ⇒ F-06: la unidad activa en memoria no cambia hasta respuesta exitosa; cancelación n/a (selección, no formulario dirty) | `index.html` (topbar), `forms-basic.html` (select) |
| AC-OP-AUT-004 | `GET /api/auth/audit-log/` | Rol real `tenant_admin`, `super_admin` o `auditor`; bitácora con eventos reales del uso del entorno | SCREEN-AUDIT: abrir la bitácora y ajustar `limit` (FL-AUD-001) | `{count, results[]}` con los siete campos por registro (`created_at, endpoint, action, allowed, reason, organization_unit_code, user_id_value`); `allowed` como badge semántico; `count` visible; control de `limit` con default 100 y tope 500 (el cliente no envía más); `reason` literal del backend; vacío ⇒ ST-03 sin fabricar eventos; `user_id_value` se muestra pero no se registra en logs/artefactos del cliente (R-SES-018) | `403` para rol no declarado ⇒ ST-07 denegación visible (la entrada de menú sólo aparece para los tres roles); red ⇒ F-06/F-10; cancelación n/a (lectura); la bitácora es inmutable desde el cliente: ninguna escritura | `tables-basic.html`, `ui-badge.html` |
| AC-OP-AUT-005 | `POST /api/logout/` | Sesión viva, con datos cargados y (si existe) cola de apariencia pendiente | Dropdown de usuario ⇒ «Cerrar sesión» (FL-SES-005); acción de shell, sin pantalla propia | El cliente aborta primero las peticiones en vuelo (incluidas escrituras de apariencia en cola, F-07); petición sin body ni `X-Tenant-Code`; `200 {detail}`; purga de **todo** el estado en memoria; apariencia restablecida a defaults canónicos; redirect a `/login` pintado con defaults de modo público | Fallo de red en el logout ⇒ la purga y la redirección se ejecutan igualmente (decisión de cliente: intento único, sin reintento); `403` con sesión ya inválida ⇒ mismo camino de purga (F-12); tras logout, back del navegador no repinta datos (ST-08 ante respuestas tardías); cancelación n/a | `ui-dropdown.html`; login con `auth-signin.html` |
| AC-OP-AUT-006 | `GET /api/protected/` — **INFRA, no UI** | Sesión viva o ausente (prueba de sanidad IA+TA del backend) | **Ninguna acción de usuario en la app**: sin pantalla, sin menú, sin estado (P-INFRA); el cliente no consume esta ruta en ningún flujo | Criterio de infraestructura: la ruta existe como sanity check del backend con respuesta contratada `{"Detalle: Esta es una vista protegida"}` (contrato §Contexto y cabeceras, `apipoligono/views.py:1373-1377` — cita documental, sin afirmar runtime). Observable de producto: **ninguna UI la llama**; cualquier llamada del cliente a `/api/protected/` es un defecto verificable por inspección (M-D) | No aplica vacío/denied/cancelación de UI: no es operación de negocio ni tiene superficie; la comprobación directa por HTTP requiere autorización específica del operador | — (sin fuente DS: no hay superficie) |

## AC-OP — Recuperación (cuatro pasos públicos)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-RCV-001 | `POST /api/recuperar/` | Usuario público sin sesión; RUT real de cuenta con correo (placeholder `<RUT>`); throttle `AuthEndpointThrottle` | SCREEN-RECOVERY paso 1: ingresar RUT y enviar (FL-RCV-001) | `200 {detail}` genérico; si la respuesta añade `correo_censurado`, se muestra tal cual; avanza al paso 2; la forma de la respuesta **no revela** si el RUT existe (anti-enumeración: la UI no infiere existencia) | `429` ⇒ F-03; red ⇒ F-06 (el paso no avanza); cancelar descarta el progreso sin petición (F-09); volver a `/recuperar` reinicia en paso 1 (el paso es estado en memoria, no va en la URL) | `auth-password.html` |
| AC-OP-RCV-002 | `POST /api/recuperar/crear/` | Paso 1 completado; correo real de la cuenta | SCREEN-RECOVERY paso 2: ingresar correo y enviar (FL-RCV-001) | `200 {detail}` **siempre genérico**, exista o no el RUT; avanza al paso 3; ninguna revelación de existencia | Ídem RCV-001 (`429` F-03, red F-06, cancelar F-09) | `auth-password.html` |
| AC-OP-RCV-003 | `POST /api/recuperar/comprobar/` | Paso 2 completado; código real recibido, vigente (expira a los 5 minutos, contrato) | SCREEN-RECOVERY paso 3: ingresar código y enviar (FL-RCV-001) | `200 {mensaje}` ⇒ avanza al paso 4 | `400 {mensaje}` (código incorrecto o expirado) ⇒ **permanece en el paso 3** con el `mensaje` literal anclado (F-01); `429` F-03; red F-06 sin avanzar; cancelar F-09 | `auth-password.html`, `forms-validation.html` |
| AC-OP-RCV-004 | `POST /api/recuperar/cambiar/` | Paso 3 aprobado; el campo es `nueva_contrasena`, **no** «dígito verificador» (discrepancia X-03 resuelta a favor del código) | SCREEN-RECOVERY paso 4: ingresar nueva contraseña y enviar (FL-RCV-001) | `200 {mensaje}` ⇒ cierra el asistente y redirige a SCREEN-LOGIN; el código queda consumido (un segundo intento con el mismo código falla); el siguiente login con la nueva contraseña entra por FL-SES-001 | `400 {mensaje, errores[]}` ⇒ permanece en el paso 4 con `mensaje` y `errores[]` literales anclados por campo (F-01); `429` F-03; red F-06; cancelar F-09 | `auth-password.html`, `forms-validation.html` |

## AC-FL — Flujo reactivo sin OP actual

| AC-ID | Disparador | Precondición | Observable (reacción obligatoria) | Fallo / distinctiones | DS |
|---|---|---|---|---|---|
| AC-FL-SES-006 | Expiración de sesión, sesión cancelada en otro extremo, tenant inválido o ruta `requiresTenant` sin tenant (FL-SES-006; ninguna OP: es reactivo) | Sesión previamente viva con pantallas cargadas, o URL directa con `meta.requiresTenant` sin contexto | La API **no emite `401`**: ante `403` de `HasTenantAccess` (`No tiene acceso al tenant solicitado.`) o sin sesión activa ⇒ purgar estado en memoria, abortar en vuelo (F-07) y volver a `/login` **sin reintentar**, preservando el destino en `query.redirect`; ante ruta `requiresTenant` sin tenant ⇒ SCREEN-CONTEXT-LOST sin bucle de reintento (sin botón de reintento automático; salidas: login o cerrar sesión); ninguna vista conserva datos de la sesión terminada y ninguna petición tardía repinta estado (ST-08) | Distinción obligatoria: `403` de negocio con `detail` y sesión viva **no** es expiración ⇒ F-02 (ST-07 literal, la sesión se conserva); `403` en ruta de preferencias **nunca** cierra sesión automáticamente (R-SES-012 ⇒ AC-FL-APP-004); la diferenciación es por `detail` y contexto de ruta, no por código | `pages-404-alt.html`, `ui-alerts.html` (SCREEN-CONTEXT-LOST) |

---

> 🕯️ Ninguna fila está verificada. La comprobación de usuario (M-U) de esta familia
> exige credenciales reales y autorización explícita del operador
> ([`../verification.md`](../verification.md), «Requisito de autorización»): no se crean cuentas de prueba ni se
> fuerza el bloqueo/expiración sobre datos reales sin orden aparte.
