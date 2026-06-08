# Autenticación: Sesiones Django + CSRF

## Modelo de seguridad

El sistema usa **sesiones Django almacenadas en la base de datos**, con dos cookies:

| Cookie | HttpOnly | Propósito |
|---|---|---|
| `sessionid` | Sí | Identifica la sesión. JS no puede leerla. |
| `csrftoken` | No | Token CSRF. JS la lee para enviarla como header `X-CSRFToken`. |

El frontend **nunca toca** el identificador de sesión. Las cookies viajan automáticamente con `withCredentials: true`.

## Clase de autenticación

`apps/identity/authentication.py` → `SessionCsrfAuthentication`

Extiende `SessionAuthentication` de DRF:
- Lee `request.user` desde la sesión Django
- Valida `X-CSRFToken` en POST/PUT/PATCH/DELETE
- Devuelve `None` (anónimo) si no hay sesión

## Configuración de sesiones (settings.py)

```python
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True          # False en DEBUG
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 60 * 60 * 8     # 8 horas de inactividad
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = True     # Sesión sliding: TTL se renueva con actividad
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

CSRF_COOKIE_NAME = 'csrftoken'
CSRF_COOKIE_HTTPONLY = False          # Debe ser False: JS necesita leerla
CSRF_COOKIE_SECURE = True             # False en DEBUG
CSRF_COOKIE_SAMESITE = 'Lax'
```

## Endpoints de autenticación

### Login

```http
POST /api/auth/login/
Content-Type: application/json
X-Tenant-Code: <tenant-code>
X-CSRFToken: <csrftoken>

{
  "rut": "12345678-9",
  "password": "MiPassword123"
}
```

**Respuesta exitosa (200):**
```json
{
  "id_usuario": 42,
  "must_change_password": false
}
```

La cookie `sessionid` queda seteada automáticamente con `HttpOnly; Secure; SameSite=Lax`. La cookie `csrftoken` también se emite via `@ensure_csrf_cookie`.

> **Nota**: la respuesta ya **no incluye `rol`** — los permisos se obtienen del endpoint `/api/auth/context/`.

### Logout

```http
POST /api/logout/
X-CSRFToken: <csrftoken>
```

Invalida la sesión en la BD y borra la cookie `sessionid`. Solo requiere estar autenticado — no hace falta `X-Tenant-Code`.

### Contexto del usuario

```http
GET /api/auth/context/
X-Tenant-Code: <tenant-code>
```

Devuelve datos completos: usuario, tenant, membresía, assignments y permisos.

```json
{
  "user": {
    "id_usuario": 42,
    "rut": "12345678-9",
    "nombre": "Juan",
    "apellido_paterno": "Pérez",
    "grado": "Teniente",
    "must_change_password": false
  },
  "tenant": { "code": "ejercito-demo", "context": "military" },
  "unit_membership": { "id": 5, "unit_code": "CO-A", "unit_name": "Compañía A" },
  "scopes": ["unidad_y_descendientes"],
  "assignments": [
    { "role": "oficial_tiro", "scope": "unidad_y_descendientes", "organization_unit": "CO-A", "is_primary": true }
  ],
  "permissions": ["view_unit", "create_shooting_lessons", "score_shooters"]
}
```

## Flujo CSRF para SPA

```
1. Frontend hace GET /api/auth/context/ (anónimo) o POST /api/auth/login/
   → Servidor setea Set-Cookie: csrftoken=<valor>  (no HttpOnly)

2. JS lee la cookie:
   const token = document.cookie.split('; ')
     .find(r => r.startsWith('csrftoken='))?.split('=')[1]

3. Frontend incluye X-CSRFToken: <token> en todos los POST/PUT/PATCH/DELETE

4. SessionCsrfAuthentication valida que el header coincide con la cookie
```

## Duración de la sesión

- **8 horas de inactividad** (`SESSION_COOKIE_AGE = 28800`)
- **Sesión sliding**: cada request autenticado renueva el TTL (`SESSION_SAVE_EVERY_REQUEST = True`)
- Un usuario activo nunca es desconectado involuntariamente
- Para forzar logout: llamar `POST /api/logout/`

## Recuperación de contraseña

Flujo de 4 pasos, todos **públicos** (sin auth, sin CSRF necesario):

```
1. POST /api/recuperar/           { "rut": "12345678-9" }
   → Verifica que el RUT existe

2. POST /api/recuperar/crear/     { "rut": "12345678-9" }
   → Código de 6 dígitos al correo. Expira en 5 min.

3. POST /api/recuperar/comprobar/ { "rut": "...", "codigo": "483920" }
   → Valida el código

4. POST /api/recuperar/cambiar/   { "rut": "...", "codigo": "...", "nueva_password": "..." }
   → Establece nueva contraseña
```

## Onboarding: primer login

Cuando un admin crea un usuario, se le asigna `DEFAULT_TEMP_PASSWORD` (`.env`) y `must_change_password = True`.

1. Usuario hace login → respuesta incluye `"must_change_password": true`
2. Frontend redirige a pantalla de cambio de contraseña obligatorio
3. `POST /api/usuarios/{id}/cambiar-contrasena/`
4. `must_change_password` pasa a `False`

## Cambio de unidad activa

```http
POST /api/auth/select-unit/
X-Tenant-Code: <tenant-code>
X-CSRFToken: <csrftoken>

{ "organization_unit_code": "CO-B" }
```

Actualiza la `UnitMembership` primaria y el `Assignment` primario del usuario.
