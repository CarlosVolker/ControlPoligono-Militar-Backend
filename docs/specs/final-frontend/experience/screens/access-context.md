---
spec_meta: "../../spec-meta.yaml"
---

# Pantallas — Acceso, sesión y contexto

> 📖 Tomo de catálogo del workstream `full-frontend-screens-recovery` (spec **`approved`** desde el 2026-10-02). Registro estático: las rutas son de diseño; `vue-router` está instalado y en uso (`front/src/router/`; verificado 2026-10-15) y el runtime sigue sin acreditarse (`technical-design.md` §1, T-05). Los IDs `SCREEN-*` de este archivo son canónicos; los contratos de datos no se copian aquí, se enlazan.

## Índice

1. [SCREEN-LOGIN](#screen-login--inicio-de-sesión)
2. [SCREEN-RECOVERY](#screen-recovery--recuperación-de-contraseña)
3. [SCREEN-PASSWORD-FORCED](#screen-password-forced--cambio-de-contraseña-forzado)
4. [SCREEN-CONTEXT](#screen-context--selección-de-unidad-activa)
5. [SCREEN-DASHBOARD](#screen-dashboard--dashboard-de-lectura)
6. [SCREEN-CONTEXT-LOST](#screen-context-lost--contexto-perdido)
7. [SCREEN-NOT-FOUND](#screen-not-found--404)

Convenciones generales del catálogo: [`../screens.md`](../screens.md). Navegación, menú y guards: [`../navigation.md`](../navigation.md).

---

### SCREEN-LOGIN — Inicio de sesión

| Atributo | Valor |
|---|---|
| Propósito | Autenticar con RUT y contraseña, capturar la institución real (tenant) y entrar al flujo de contexto. |
| Ruta | `/login` — fijada en `technical-design.md` §4. Pública. |
| Params / breadcrumbs | Sin params. Sin breadcrumbs (shell de autenticación, sin sidebar). |
| Fuente DS | `auth-signin.html` (card auth, labels, controles, checkbox, enlace auxiliar, submit); capas `auth.css`, `styles.css` ([`reference-pages.md`](../../design-system/reference-pages.md) §2). |

**Datos y operaciones.**

- `OP-AUT-001` `POST /auth/login/` — envío de credenciales; respuesta `{id_usuario, must_change_password}` ([contrato](../../contracts/auth-context.md#sesión-y-recuperación)).
- El campo de institución (tenant) del formulario real cumple `R-LOGIN-01`/D-03: no se pide lista de tenants al backend ni se hardcodea código de demostración. El valor alimenta el header `X-Tenant-Code` de las peticiones posteriores (`R-AUTH-06`).

**Acciones y formularios.** Campos `rut`, `password` e institución (los dos primeros según contrato enlazado). Enlace auxiliar a SCREEN-RECOVERY. Sin registro de usuarios: el DS tiene `auth-signup.html`, pero el backend no expone capacidad de signup; la página no se usa y no se ofrece menú hueco (`requirements.md` §7–8).

**Controles de acceso.** Ruta pública; la operación no exige sesión previa ni tenant (`technical-design.md` §2, regla 3).

**Estados y criterios observables.** `400` ⇒ mensaje literal del backend, sin sugerir credenciales (`R-AUTH-03`); `429` por throttle `auth: 20/min` ⇒ mensaje de espera y botón deshabilitado, sin reintento automático (`technical-design.md` §2 regla 6, T-03); botón en estado guardando durante el vuelo. Éxito con `must_change_password: true` ⇒ SCREEN-PASSWORD-FORCED (`R-AUTH-02`); si es `false` ⇒ SCREEN-CONTEXT (`R-AUTH-01`).

**Navegación.** Destino preservado: si el guard redirigió aquí con `query.redirect`, el éxito vuelve a ese destino (`R-ROUTER-04`). Deep link: entrada directa permitida (pública).

---

### SCREEN-RECOVERY — Recuperación de contraseña

| Atributo | Valor |
|---|---|
| Propósito | Recuperar o establecer contraseña en cuatro pasos secuenciales sin sesión. |
| Ruta | `/recuperar` — fijada en `technical-design.md` §4. Pública. |
| Params / breadcrumbs | Sin params; el paso activo es estado en memoria, no va en la URL. Sin breadcrumbs. |
| Fuente DS | `auth-password.html` (card auth); validación de `forms-validation.html`; estados de `ui-alerts.html`, `ui-spinners.html`. |

**Datos y operaciones.** Los cuatro pasos en orden (`R-REC-01`), con shapes exactos en el [contrato](../../contracts/auth-context.md#sesión-y-recuperación):

1. `OP-RCV-001` `POST /recuperar/` — `{rut}`.
2. `OP-RCV-002` `POST /recuperar/crear/` — `{rut, correo}`.
3. `OP-RCV-003` `POST /recuperar/comprobar/` — `{rut, codigo}`.
4. `OP-RCV-004` `POST /recuperar/cambiar/` — `{rut, codigo, nueva_contrasena}`.

**Acciones y formularios.** Un formulario por paso; avanzar sólo tras `200` del paso actual. El campo del paso 4 es `nueva_contrasena` (no dígito verificador; discrepancia X-03 resuelta a favor del código).

**Controles de acceso.** Pública, sin sesión ni tenant; throttle `AuthEndpointThrottle` declarado en el contrato.

**Estados y criterios observables.** Fallo de paso ⇒ permanecer en el paso y mostrar el mensaje del backend (`R-REC-02`); los pasos 1 y 2 nunca revelan si el RUT existe (respuesta genérica anti-enumeración) y la UI no infiere existencia; `400` del paso 4 muestra `mensaje` y `errores[]` por campo; código expira a los cinco minutos (contrato). Éxito del paso 4 ⇒ enlace a SCREEN-LOGIN.

**Navegación.** Atrás del navegador entre pasos: el estado es en memoria; volver a `/recuperar` reinicia en el paso 1 (sin persistencia, `R-DAT-05`). Enlace manual a SCREEN-LOGIN.

---

### SCREEN-PASSWORD-FORCED — Cambio de contraseña forzado

| Atributo | Valor |
|---|---|
| Propósito | Bloquear toda operación hasta cambiar la contraseña cuando `must_change_password` es verdadero. |
| Ruta | `/password-required` — fijada en `technical-design.md` §4. Requiere contexto. |
| Params / breadcrumbs | Sin params; el destinatario es el usuario de la sesión (`id_usuario` de `OP-AUT-001`/contexto). Sin breadcrumbs operativos. |
| Fuente DS | Card auth de `auth-signin.html` con validación de `forms-validation.html`; errores por campo de `forms-basic.html`. |

**Datos y operaciones.**

- `OP-USR-013` `POST /usuarios/{id}/cambiar-contrasena/` en modo propio forzado: `new_password` requerido; `old_password` **no** se exige bajo `must_change_password` (`R-RUL-07`; [contrato](../../contracts/auth-context.md#auditoría-y-contraseña-de-usuario)).

**Acciones y formularios.** Formulario de contraseña nueva con confirmación local; sin opción de omitir. `400 {error}` se muestra literal y permanece en el flujo (`R-DOM-ID-009`).

**Controles de acceso.** IA+TA para el cambio propio (contrato). El guard global bloquea toda ruta operativa salvo esta y el login mientras el flag sea verdadero (`R-ROUTER-05`).

**Estados y criterios observables.** Guardando hasta respuesta; éxito ⇒ recargar contexto (`OP-AUT-002`) y navegar a SCREEN-CONTEXT o al `query.redirect` preservado; el flag `must_change_password` desaparece del contexto recargado.

**Navegación.** No ofrece salida lateral: el guard devuelve a esta pantalla. Cerrar sesión disponible (FL/sesión, ver [`../navigation.md`](../navigation.md)).

---

### SCREEN-CONTEXT — Selección de unidad activa

| Atributo | Valor |
|---|---|
| Propósito | Mostrar el contexto de sesión y elegir la unidad activa con la que se opera (rama del usuario). |
| Ruta | `/contexto` — fijada en `technical-design.md` §4. Requiere contexto. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Contexto. |
| Fuente DS | Shell de `index.html` (sidebar/topbar); selección con `forms-basic.html` (select), cards de `ui-card.html`, estados de `ui-spinners.html` y `ui-alerts.html`. |

**Datos y operaciones.**

- `OP-AUT-002` `GET /auth/context/` — lectura del contexto: usuario, tenant, unidad activa, `assignments`, `scopes`, `permissions` ([contrato](../../contracts/auth-context.md#contexto-y-cabeceras)). Se consume en el bootstrap de la app (FL/bootstrap) y esta pantalla lo materializa.
- `OP-AUT-003` `POST /auth/select-unit/` — `{organization_unit_code}`; cambio de unidad activa (`R-UNIT-01`).

**Acciones y formularios.** Selector de unidad poblado **sólo** con las pertenencias/asignaciones activas del contexto; confirmar cambia la unidad y recarga contexto y datos dependientes (`R-UNIT-01`). Sin formulario de alta: no se crean unidades desde aquí.

**Controles de acceso.** IA+TA (contrato). La unidad válida la decide el backend: `403` con motivo literal («La unidad no está en tus pertenencias activas.» / «La unidad no esta en sus asignaciones activas.») sin reintento (`R-UNIT-02`).

**Estados y criterios observables.** Carga del contexto visible; `429` por throttle `unit_selection: 30/min` ⇒ espera sin reintento automático; éxito ⇒ navegación a SCREEN-DASHBOARD y purga de datos de la unidad anterior (anti-carrera por `generation`, `R-AUTH-09`, `technical-design.md` §2).

**Navegación.** Deep link permitido con sesión. Atrás: al dashboard. El cambio de unidad activa **conserva** preferencias de apariencia (`R-APP-06`).

---

### SCREEN-DASHBOARD — Dashboard de lectura

| Atributo | Valor |
|---|---|
| Propósito | Punto de entrada autenticado: estado del contexto y lecturas del dashboard existente. |
| Ruta | `/` — fijada en `technical-design.md` §4. Requiere contexto + tenant. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio. |
| Fuente DS | `index.html` (shell completo: sidebar fija 250px/75px colapsada, topbar 70px, `main.page-content`); cards y KPI de `ui-card.html`; métricas de `charts.html` ([`visual-contract.md`](../../design-system/visual-contract.md) §2). |

**Datos y operaciones.**

- `OP-AUT-002` — contexto visible (usuario, tenant, unidad activa, permisos).
- El módulo existente `front/src/api/dashboard.js` conserva su contrato (`technical-design.md` §1); las operaciones que consume no se re-derivan en este catálogo.

**Acciones y formularios.** Lectura y navegación: entradas al personalizador (SCREEN-PERSONALIZER), al selector de unidad (SCREEN-CONTEXT) y al menú por módulos ([`../navigation.md`](../navigation.md)). Sin acciones de mutación propias.

**Controles de acceso.** IA+TA vía contexto; cada tarjeta/enlace respeta la visibilidad por `permissions` del contexto, sin reimplementar autorización (`technical-design.md` §11).

**Estados y criterios observables.** Métricas sólo derivadas matemáticamente de datos reales (`R-DAT-02`); cifra siempre rotulada con su lección/fecha, nunca como total institucional (`R-DAT-04`); valor ausente `—`, conjunto vacío con estado vacío, error explícito con reintento (`R-RES-23`); nunca `0` inventado.

**Navegación.** Deep link: recargar `/` reconstruye sesión y contexto antes de resolver (`R-ROUTER-03`, `R-ROUTER-06`). Back/forward con `scrollBehavior` y posición previa (`technical-design.md` §3.1).

---

### SCREEN-CONTEXT-LOST — Contexto perdido

| Atributo | Valor |
|---|---|
| Propósito | Estado explícito cuando una ruta exige tenant y el contexto no lo tiene, sin reintento en bucle. |
| Ruta | `/contexto-perdido` — **propuesta nueva** de este catálogo (no figura en `technical-design.md` §4); materializa el requisito `R-ROUTER-07` y el guard de `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Sin breadcrumbs operativos. |
| Fuente DS | `pages-404-alt.html` (estado con CTA) y `ui-alerts.html` (aviso semántico). |

**Datos y operaciones.** Ninguna OP propia: no consulta ni reintenta el backend. Muestra el `detail` del backend si lo hubo (p. ej. `403` de `HasTenantAccess`: «No tiene acceso al tenant solicitado.», `technical-design.md` §2 regla 4).

**Acciones y formularios.** Dos salidas: volver a SCREEN-LOGIN o cerrar sesión (FL/sesión). Sin botón de reintento automático.

**Controles de acceso.** Accesible con o sin sesión; no exige tenant (es la respuesta a su ausencia).

**Estados y criterios observables.** `403` de contexto perdido ⇒ esta pantalla y limpieza de estado en memoria (`R-AUTH-07`); sin bucles de redirección (`R-ROUTER-07`).

**Navegación.** Sólo el guard entra aquí; el back del navegador no debe devolver a la ruta que falló sin contexto (salida por login).

---

### SCREEN-NOT-FOUND — 404

| Atributo | Valor |
|---|---|
| Propósito | Respuesta visible a URLs sin ruta, en lugar de una vista en blanco. |
| Ruta | `/:pathMatch(.*)*` — fijada en `technical-design.md` §4. Pública. |
| Params / breadcrumbs | Catch-all; sin breadcrumbs. |
| Fuente DS | `pages-404-alt.html` **completa** (variante única, decisión del operador 2026-10-04): shell del dashboard — `aside.sidebar`, `header.topbar`, `main.page-content`, `assets/js/app.js` — y anatomía `error-container` → `error-row` → `error-col error-col-xl5` → `card error-card` → `error-body-alt` → `error-pad` → `error-inner`, con `h1.error-code.fs-60`, `h2.error-title.fs-22`, `p.error-text`, `a.error-btn.error-btn-danger` y `footer.footer`; capas `styles.css`, `errors.css`. Contrato literal en [`visual-contract.md`](../../design-system/visual-contract.md) §2. `pages-404.html` **no** es fuente de esta pantalla: enlaza `assets/img/404.svg`, ausente en el layout local, y su shell `authentication-bg` no se mezcla con el de esta. |

**Datos y operaciones.** Ninguna: no consulta el backend.

**Acciones y formularios.** CTA a SCREEN-LOGIN (sin sesión) o a SCREEN-DASHBOARD (con sesión).

**Controles de acceso.** Pública (`R-ROUTER-08`).

**Estados y criterios observables.** Cualquier URL desconocida renderiza esta pantalla, nunca blanco (`R-ROUTER-08`).

**Navegación.** Deep link fallido aterriza aquí; el back funciona normalmente.
