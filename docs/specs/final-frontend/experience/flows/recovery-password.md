---
spec_meta: "../../spec-meta.yaml"
---

# Flujos — Recuperación y contraseña

> 📜 Yo detallo aquí la recuperación pública en cuatro pasos y los cinco flujos de
> credenciales del usuario autenticado: cambio forzado, cambio propio, reseteo a otro,
> consulta de bloqueo y desbloqueo. Los cuatro endpoints de recuperación son `AllowAny`
> con `AuthEndpointThrottle` (`requirements.md` §3.2); las clases `F-*` vienen de
> [../flows.md](../flows.md).

## Índice

1. [FL-RCV-001 — Recuperación en cuatro pasos](#fl-rcv-001--recuperación-en-cuatro-pasos)
2. [FL-PWD-001 — Cambio forzado](#fl-pwd-001--cambio-forzado)
3. [FL-PWD-002 — Cambio propio](#fl-pwd-002--cambio-propio)
4. [FL-PWD-003 — Reseteo a otro](#fl-pwd-003--reseteo-a-otro)
5. [FL-PWD-004 — Consulta de bloqueo](#fl-pwd-004--consulta-de-bloqueo)
6. [FL-PWD-005 — Desbloqueo](#fl-pwd-005--desbloqueo)

---

### FL-RCV-001 — Recuperación en cuatro pasos

- **Actor:** usuario público sin sesión (`FL/recuperación` provisional).
- **Pantalla:** `/recuperar` — asistente de cuatro pasos (ref. DS `auth-password.html`).
- **Precondición:** sin sesión; los cuatro endpoints no exigen `X-Tenant-Code`
  (`technical-design.md` §2 regla 3). El código de recuperación expira a los **cinco
  minutos** y se elimina tras un cambio exitoso
  ([contrato auth](../../contracts/auth-context.md) §Sesión y recuperación).
- **Entradas por paso:** las declaradas en el contrato; el campo del paso 4 es
  `nueva_contrasena`, **no** «dígito verificador» (X-03 de `requirements.md` §11).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Ingresa su RUT | `POST /recuperar/` (OP-RCV-001) `{rut}` | `200 {detail}`; puede añadir `correo_censurado` | Muestra el `detail` genérico; si viene `correo_censurado`, lo muestra tal cual. **No** infiere existencia del RUT: pasos 1 y 2 responden genérico siempre (R-REC-02, `MENSAJE_GENERICO`) |
| 2 | Ingresa su correo | `POST /recuperar/crear/` (OP-RCV-002) `{rut, correo}` | `200 {detail}` siempre, exista o no el RUT (anti-enumeración) | Avanza al paso 3 con el mensaje genérico; sin revelar existencia |
| 3 | Ingresa el código recibido | `POST /recuperar/comprobar/` (OP-RCV-003) `{rut, codigo}` | `200 {mensaje}` o `400 {mensaje}` (código incorrecto o expirado a los 5 min) | `200` → avanza al paso 4; `400` → permanece **en el paso 3** con el `mensaje` literal (R-REC-02) |
| 4 | Ingresa la nueva contraseña | `POST /recuperar/cambiar/` (OP-RCV-004) `{rut, codigo, nueva_contrasena}` | `200 {mensaje}` o `400 {mensaje, errores[]}` | `200` → cierra el asistente y redirige a login; el código queda consumido. `400` → permanece en el paso 4 con `mensaje` y `errores[]` literales |

- **Postcondición observable:** contraseña cambiada y el usuario puede iniciar sesión
  (FL-SES-001); o el asistente detenido en el paso fallido con el mensaje del backend.
- **Fallos:** `429` → F-03 (`AuthEndpointThrottle`). Red → F-06, el paso no avanza.
  Cancelar en cualquier paso descarta el progreso sin petición (F-09). `403`: no declarado
  en endpoints públicos; si ocurriera, F-12 no aplica (no hay sesión) y se muestra el
  `detail` literal. Pasos 1–2: prohibido derivar existencia de RUT de la forma de la
  respuesta (R-REC-02).

---

### FL-PWD-001 — Cambio forzado

- **Actor:** usuario autenticado con `must_change_password: true` (US-02).
- **Pantalla:** `/password-required` (bloqueo global del guard, R-ROUTER-05).
- **Precondición:** el login (FL-SES-001) o el contexto (OP-AUT-002) devolvieron la
  bandera en verdadero; toda ruta operativa está bloqueada salvo ésta y login.
- **Entradas:** `new_password` (requerido). En flujo forzado el backend **no** exige
  `old_password` (R-RUL-07).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Ingresa la nueva contraseña y envía | `POST /usuarios/{id_usuario}/cambiar-contrasena/` (OP-USR-013) `{new_password}`; control propio IA+TA | `200`; `400 {error}` por validación | ST-05 durante el vuelo |
| 2 | — (tras éxito) | `GET /auth/context/` (OP-AUT-002) para refrescar la bandera | `must_change_password` actualizado | Si es `false`, el guard desbloquea las rutas y continúa al destino preservado |

- **Postcondición observable:** la bandera queda en falso en el contexto refrescado y el
  usuario opera con normalidad; la contraseña temporal nunca queda usable en producción
  (US-02).
- **Fallos:** `400` → F-01 con el `error` literal, permanecer en el flujo
  (R-DOM-ID-009). `429` → F-03 genérico. Red → F-06. `403` → F-12 (sesión propia
  inválida). No hay cancelación posible: el flujo es bloqueante (R-AUTH-02).

---

### FL-PWD-002 — Cambio propio

- **Actor:** usuario autenticado **sin** `must_change_password`.
- **Pantalla:** acción de cuenta del shell (descriptiva).
- **Precondición:** sesión viva; la bandera en falso obliga a demostrar la contraseña
  actual (R-RUL-07).
- **Entradas:** `new_password` (requerido) y `old_password` (requerido en este caso).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa ambos campos y envía | `POST /usuarios/{id_usuario}/cambiar-contrasena/` (OP-USR-013) `{new_password, old_password}` | `200`; `400 {error}` | ST-05 → ST-06 con el `detail` del backend; el formulario se limpia |

- **Postcondición observable:** contraseña actualizada; el formulario exige
  `old_password` exactamente cuando la bandera es falsa, y lo omite cuando es verdadera
  (R-RUL-07): la UI refleja esa distinción, no una regla propia.
- **Fallos:** `400` → F-01, `error` literal, permanecer. Red → F-06. `403` → F-12.

---

### FL-PWD-003 — Reseteo a otro

- **Actor:** quien posea `user:update → update_users` (OP-USR-014).
- **Pantalla:** ficha de usuario (`SCREEN/usuarios` provisional).
- **Precondición:** usuario objetivo cargado desde OP-USR-001/003; el objetivo **no** es
  la propia cuenta.
- **Entradas:** ninguna; OP-USR-014 no lleva body.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Pulsa «Resetear contraseña» | Confirmación destructiva ST-10 que identifica a la persona (R-DOM-ID-010); la UI **bloquea de antemano** el intento sobre la propia cuenta | — | Modal abierto |
| 2 | Confirma | `POST /usuarios/{id}/resetear-contrasena/` (OP-USR-014) | `200 {detail}`; el objetivo queda con `must_change_password = true` y `password_changed_at = null` (R-RUL-08); reset propio → `400` | ST-06 con el `detail`; refresca los flags del usuario en su ficha |

- **Postcondición observable:** la ficha del objetivo muestra los indicadores de
  contraseña actualizados; en su próximo login entrará por FL-PWD-001.
- **Fallos:** `400` (incluido reset propio si la defensa frontal fallara) → F-01 con
  mensaje literal. `403` → F-02. Red → F-06: el modal permanece cerrado sin cambiar
  flags locales.

---

### FL-PWD-004 — Consulta de bloqueo

- **Actor:** quien posea `user:read → view_personnel_basic` (OP-USR-015).
- **Pantalla:** ficha de usuario (`SCREEN/usuarios` provisional).
- **Precondición:** usuario cargado.
- **Entradas:** ninguna.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre el panel de estado de cuenta | `GET /usuarios/{id}/estado-bloqueo/` (OP-USR-015) | `{rut, is_locked, failures, failure_limit, last_attempt?}` | Muestra los cinco campos; `last_attempt` ausente → `—`, sin fecha inventada (R-DOM-ID-011) |

- **Postcondición observable:** el panel refleja el estado real de bloqueo.
- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 con reintento (F-10).

---

### FL-PWD-005 — Desbloqueo

- **Actor:** quien posea `user:update → update_users` (OP-USR-016).
- **Pantalla:** ficha de usuario, sobre el panel de FL-PWD-004.
- **Precondición:** estado de bloqueo consultado.
- **Entradas:** ninguna; OP-USR-016 no lleva body.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Pulsa «Desbloquear» | Confirmación ST-10 (R-DOM-ID-011) | — | Modal abierto |
| 2 | Confirma | `POST /usuarios/{id}/desbloquear/` (OP-USR-016) | `{detail, rut?, registros_eliminados?}` | ST-06; refresca el estado re-consultando OP-USR-015 |

- **Postcondición observable:** el panel de bloqueo muestra el estado posterior real
  devuelto por la re-consulta.
- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06: sin cambio local de `is_locked`.
