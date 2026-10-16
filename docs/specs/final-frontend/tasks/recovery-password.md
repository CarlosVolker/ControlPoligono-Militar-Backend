---
spec_meta: "../spec-meta.yaml"
---

# Tasks — Recuperación y contraseña (T-FL-RCV, T-FL-PWD)

> 📖 Yo registro aquí la recuperación pública en cuatro pasos y los cinco flujos de
> credenciales: cambio forzado, cambio propio, reseteo a otro, consulta de bloqueo y
> desbloqueo. Pasos y shapes **no se copian**: cada tarea cita su ancla `FL-*`. Índice y
> reglas: [../tasks.md](../tasks.md). Ninguna tarea está autorizada a ejecutarse.

## Bloque común de la familia

- **Dependencias comunes:** T-CORE-TYPES, T-CORE-HTTP, T-CORE-SESSION, T-CORE-ROUTER
  (`/recuperar`, `/password-required`, `/personas/:idUsuario`), T-CORE-UI (card auth,
  validación, ST-10 para acciones que afectan credenciales).
- **Archivos probables** (raíz `front/src/`): `api/auth.ts` (recuperación),
  `api/identity.ts` (credenciales de usuario), `views/auth/RecoveryView.vue`,
  `views/auth/PasswordRequiredView.vue`, modales/paneles en
  `views/personas/UserDetailView.vue` (compartida con la familia identidad).
- **Convención de AC:** hogar canónico único por OP; referencias sin duplicación.

---

## T-FL-RCV-001 — Recuperación de contraseña en cuatro pasos

| Campo | Valor |
|---|---|
| Objetivo | Asistente público de cuatro pasos con los campos reales del contrato (`{rut}`, `{rut, correo}`, `{rut, codigo}`, `{rut, codigo, nueva_contrasena}`), respuesta genérica anti-enumeración en los pasos 1–2 y permanencia en el paso fallido. |
| Flujo | [FL-RCV-001](../experience/flows/recovery-password.md#fl-rcv-001--recuperación-en-cuatro-pasos) |
| OP (AC canónicos) | OP-RCV-001, OP-RCV-002, OP-RCV-003, OP-RCV-004 |
| SCREEN | [SCREEN-RECOVERY](../experience/screens/access-context.md#screen-recovery--recuperación-de-contraseña) — DS `auth-password.html` + `forms-validation.html` |
| Requisitos | R-REC-01/02 vía tomos citantes (cuatro pasos; prohibido inferir existencia de RUT en pasos 1–2; `400` permanece en el paso con `mensaje`/`errores[]` literales); el campo del paso 4 es `nueva_contrasena` (discrepancia X-03 resuelta a favor del código); código expira a los 5 minutos y se consume con el cambio. |
| Precondiciones / dependencias | Bloque común; los cuatro endpoints no exigen `X-Tenant-Code` (exclusión de T-CORE-HTTP). |
| Archivos probables | `views/auth/RecoveryView.vue` (paso activo en memoria, no en URL ni storage). |
| Done when | El usuario completa los cuatro pasos y puede iniciar sesión, o el asistente queda detenido en el paso fallido con el mensaje literal del backend; volver a `/recuperar` reinicia en el paso 1. |

**Criterios.**

- **AC-OP-RCV-001:** `200 {detail}` (más `correo_censurado` si viene) se muestra tal
  cual; la UI no deriva existencia del RUT de la forma de la respuesta.
- **AC-OP-RCV-002:** `200 {detail}` siempre, exista o no el RUT; avanza al paso 3 con el
  mensaje genérico, sin revelar existencia.
- **AC-OP-RCV-003:** `200 {mensaje}` avanza al paso 4; `400 {mensaje}` (código
  incorrecto o expirado) **permanece en el paso 3** con el literal.
- **AC-OP-RCV-004:** `200 {mensaje}` cierra el asistente y redirige a login (código
  consumido); `400 {mensaje, errores[]}` permanece en el paso 4 con los literales por
  campo. `429` en cualquier paso ⇒ F-03 (`AuthEndpointThrottle`); red ⇒ F-06 sin
  avanzar; cancelar descarta el progreso sin petición (F-09).

---

## T-FL-PWD-001 — Cambio de contraseña forzado

| Campo | Valor |
|---|---|
| Objetivo | Flujo bloqueante cuando `must_change_password` es verdadero: sólo `new_password` (el backend no exige `old_password`), sin salida lateral salvo logout, y desbloqueo de rutas tras refrescar el contexto. |
| Flujo | [FL-PWD-001](../experience/flows/recovery-password.md#fl-pwd-001--cambio-forzado) |
| OP (AC canónicos) | OP-USR-013 (hogar canónico; el modo propio voluntario lo referencia desde T-FL-PWD-002) |
| SCREEN | [SCREEN-PASSWORD-FORCED](../experience/screens/access-context.md#screen-password-forced--cambio-de-contraseña-forzado) — DS card auth + `forms-validation.html` |
| Requisitos | R-SES-021 (bloqueo global salvo `password-required` y login; distinción exacta de `old_password`); R-AUTH-02/R-ROUTER-05 vía tomos citantes; R-DOM-ID-009 (`400 {error}` literal, permanecer en el flujo). |
| Precondiciones / dependencias | T-FL-SES-001/002 (la bandera llega del login o del contexto); T-CORE-ROUTER (guard de bloqueo). |
| Archivos probables | `views/auth/PasswordRequiredView.vue`. |
| Done when | Tras el cambio exitoso y el contexto refrescado con la bandera en falso, las rutas operativas se desbloquean y el usuario continúa al destino preservado; mientras la bandera sea verdadera no hay cancelación ni salida lateral. |

**Criterios.**

- **AC-OP-USR-013:** el envío propio forzado lleva sólo `{new_password}`; `200` ⇒
  refresco de `GET /auth/context/` y desbloqueo si la bandera pasó a falso; `400 {error}`
  se muestra literal permaneciendo en el flujo; `403` ⇒ F-12 (sesión propia inválida);
  `429` ⇒ F-03 genérico; el formulario **no** ofrece `old_password` en modo forzado y
  **sí** lo exige en modo propio voluntario (T-FL-PWD-002): la UI refleja la regla del
  backend, no una propia.

---

## T-FL-PWD-002 — Cambio de contraseña propio

| Campo | Valor |
|---|---|
| Objetivo | Cambio voluntario desde la acción de cuenta del shell, con `old_password` requerido exactamente cuando la bandera es falsa. |
| Flujo | [FL-PWD-002](../experience/flows/recovery-password.md#fl-pwd-002--cambio-propio) |
| OP | OP-USR-013 — **referencia** a AC-OP-USR-013 (T-FL-PWD-001), delta: envío `{new_password, old_password}`. |
| SCREEN | Acción de cuenta del shell / [SCREEN-USER-DETAIL](../experience/screens/identity.md#screen-user-detail--ficha-de-usuario) (descriptiva). |
| Requisitos | R-DOM-ID-009; R-RUL-07 vía tomos citantes. |
| Precondiciones / dependencias | T-FL-PWD-001 (mismo endpoint, modo distinto); T-CORE-UI (dropdown/modal). |
| Archivos probables | `components/shell/ChangePasswordModal.vue`. |
| Done when | La contraseña queda actualizada con ST-06 y el `detail` del backend; el formulario se limpia; la exigencia de `old_password` coincide exactamente con la bandera del contexto. |

**Criterios.** Delta observable sobre AC-OP-USR-013: envío con ambos campos; `200` ⇒
ST-06 con `detail` y formulario limpio; `400 {error}` literal conservando valores
(ST-09); red ⇒ F-06; `403` ⇒ F-12.

---

## T-FL-PWD-003 — Reseteo de contraseña a otro

| Campo | Valor |
|---|---|
| Objetivo | Reseteo con confirmación destructiva desde la ficha de usuario, bloqueo frontal del intento sobre la propia cuenta y refresco de flags tras la respuesta. |
| Flujo | [FL-PWD-003](../experience/flows/recovery-password.md#fl-pwd-003--reseteo-a-otro) |
| OP (AC canónicos) | OP-USR-014 |
| SCREEN | [SCREEN-USER-DETAIL](../experience/screens/identity.md#screen-user-detail--ficha-de-usuario) — panel de credenciales |
| Requisitos | R-DOM-ID-010 (confirmación que identifica a la persona; bloqueo sobre la propia cuenta; `400` conservado si la defensa frontal fallara); R-RUL-08 vía tomos citantes (el objetivo queda con `must_change_password = true` y `password_changed_at = null`). |
| Precondiciones / dependencias | T-FL-IDT-001 (usuario cargado desde OP-USR-001/003); T-CORE-UI (ST-10). |
| Archivos probables | `views/personas/UserDetailView.vue` (panel de credenciales, compartido con familia identidad). |
| Done when | La ficha del objetivo muestra los indicadores de contraseña actualizados desde la respuesta; en su próximo login entrará por cambio forzado; ningún flag cambia localmente antes del `200`. |

**Criterios.**

- **AC-OP-USR-014:** sin body; `200 {detail}` ⇒ ST-06 y refresco de flags del usuario;
  reset propio ⇒ `400` literal (la UI además lo bloquea de antemano); `403` ⇒ F-02;
  red ⇒ F-06 con el modal cerrado y sin cambios locales.

---

## T-FL-PWD-004 — Consulta de estado de bloqueo

| Campo | Valor |
|---|---|
| Objetivo | Panel de estado de cuenta con los cinco campos reales del contrato y `—` en `last_attempt` ausente, sin fecha inventada. |
| Flujo | [FL-PWD-004](../experience/flows/recovery-password.md#fl-pwd-004--consulta-de-bloqueo) |
| OP (AC canónicos) | OP-USR-015 |
| SCREEN | [SCREEN-USER-DETAIL](../experience/screens/identity.md#screen-user-detail--ficha-de-usuario) — panel de bloqueo |
| Requisitos | R-DOM-ID-011 (consulta: `rut`, `is_locked`, `failures`, `failure_limit`, `last_attempt?`; sin inventar fecha ausente). |
| Precondiciones / dependencias | T-FL-IDT-001 (ficha cargada). |
| Archivos probables | `components/identity/LockStatusPanel.vue`. |
| Done when | El panel refleja el estado real de bloqueo devuelto por el backend, con `—` donde el campo falta. |

**Criterios.**

- **AC-OP-USR-015:** `GET` sin body ⇒ los cinco campos visibles tal como responden;
  `last_attempt` ausente ⇒ `—`; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 con reintento
  explícito (F-10).

---

## T-FL-PWD-005 — Desbloqueo de cuenta

| Campo | Valor |
|---|---|
| Objetivo | Desbloquear con confirmación ST-10 y refrescar el estado re-consultando OP-USR-015, mostrando el resultado posterior real. |
| Flujo | [FL-PWD-005](../experience/flows/recovery-password.md#fl-pwd-005--desbloqueo) |
| OP (AC canónicos) | OP-USR-016 |
| SCREEN | [SCREEN-USER-DETAIL](../experience/screens/identity.md#screen-user-detail--ficha-de-usuario) — sobre el panel de T-FL-PWD-004 |
| Requisitos | R-DOM-ID-011 (desbloqueo con confirmación y refresco). |
| Precondiciones / dependencias | T-FL-PWD-004 (estado consultado). |
| Archivos probables | `components/identity/LockStatusPanel.vue` (acción de desbloqueo). |
| Done when | El panel muestra el estado posterior real devuelto por la re-consulta; sin cambio local de `is_locked` antes de la respuesta. |

**Criterios.**

- **AC-OP-USR-016:** sin body; `{detail, rut?, registros_eliminados?}` ⇒ ST-06 y
  re-consulta de OP-USR-015; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin cambio local.

---

> 🕯️ Regla de familia preservada: las acciones que afectan credenciales o acceso
> (reseteo, desbloqueo) entran siempre por ST-10 (prohibición 5 de
> [../experience/states.md](../experience/states.md)); el cambio de contraseña
> (forzado o propio) no destruye datos y no lleva ST-10 (delta P-AUTH del mapa OP).
