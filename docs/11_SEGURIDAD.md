# Seguridad

## Modelo de seguridad general

El sistema implementa defensa en profundidad con múltiples capas:

```
1. HTTPS (TLS) en producción
2. Autenticación por sesión Django (cookie `sessionid` HttpOnly) — mitiga XSS
3. CSRF protection (cookie `csrftoken` + header `X-CSRFToken`) — mitiga CSRF
4. CORS configurado explícitamente
5. RBAC + Scope (control de acceso a datos)
6. Multi-tenant con aislamiento completo
7. Throttling (anti-brute force)
8. Audit log (trazabilidad)
```

---

## Autenticación

### Sesiones Django en cookie HttpOnly

El sistema **no usa JWT**. La autenticación se hace con sesiones Django persistidas en la base de datos (`django.contrib.sessions.backends.db`) y expuestas al frontend como una cookie `sessionid` con atributos `HttpOnly; Secure; SameSite=Lax`. El frontend nunca toca el identificador de sesión: la cookie viaja automáticamente con `withCredentials: true` y `SessionCsrfAuthentication` la lee del lado servidor vía `AuthenticationMiddleware`.

| Cookie | HttpOnly | Propósito |
|---|---|---|
| `sessionid` | Sí | Identifica la sesión. JS no puede leerla. |
| `csrftoken` | No | Token CSRF. JS la lee para enviarla como header `X-CSRFToken`. |

```python
# control_poligono/settings.py
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=str(not DEBUG), cast=...)
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 60 * 60 * 8          # 8 horas de inactividad
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = True          # Sesión sliding
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

CSRF_COOKIE_NAME = 'csrftoken'
CSRF_COOKIE_HTTPONLY = False               # JS debe poder leerla para incluirla como header
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'
```

Clase de autenticación: `apps/identity/authentication.py → SessionCsrfAuthentication`. Hereda de `SessionAuthentication` de DRF, lee `request.user` desde la sesión y valida el header `X-CSRFToken` contra la cookie `csrftoken` en métodos no-seguros.

### Vida útil y renovación de la sesión

- **Inactividad**: 8 horas (`SESSION_COOKIE_AGE = 28800`).
- **Renovación sliding**: cada request autenticado renueva el TTL (`SESSION_SAVE_EVERY_REQUEST = True`).
- **Persistencia entre pestañas**: la sesión no expira al cerrar el navegador (`SESSION_EXPIRE_AT_BROWSER_CLOSE = False`).
- **Sin tokens de larga vida separados**: no hay access/refresh token que rotar. La "rotación" es logout + login explícito (`POST /api/logout/` → `POST /api/auth/login/`).
- **Sin tope absoluto de tiempo**: un usuario activo nunca es desconectado involuntariamente. Esto está marcado como pendiente con decisión de negocio (`M6`).

### Autenticación con RUT

El sistema usa RUT chileno como identificador de usuario (`rut` campo único en `Usuario`). El backend valida el formato antes de autenticar.

---

## Protección CSRF

Django CSRF está activo. Para el frontend:

1. Al hacer el primer request, Django devuelve la cookie `csrftoken` (no HttpOnly)
2. El frontend debe leer esa cookie e incluir `X-CSRFToken: <valor>` en requests POST/PUT/PATCH/DELETE
3. En producción, configurar `CSRF_TRUSTED_ORIGINS` con el dominio del frontend

```python
# settings.py
CSRF_TRUSTED_ORIGINS = [
    "https://app.ejemplo.mil",
]
```

---

## CORS

CORS está configurado explícitamente. Solo los orígenes en `CORS_ALLOWED_ORIGINS` pueden hacer requests cross-origin con cookies.

```python
CORS_ALLOW_CREDENTIALS = True  # Necesario para que las cookies se envíen
CORS_ALLOWED_ORIGINS = [
    "https://app.ejemplo.mil",
]
```

**Nunca usar `CORS_ALLOW_ALL_ORIGINS = True`** en producción — invalida el modelo de seguridad de cookies.

---

## Control de acceso (RBAC)

Ver [04_PERMISOS.md](04_PERMISOS.md) para detalles completos. Resumen de seguridad:

- **MASTER**: bypass total → usar solo para la cuenta de administrador del sistema. No crear cuentas MASTER adicionales.
- **Overrides DENY**: persisten incluso si el usuario cambia de rol. Requieren ser removidos explícitamente.
- **Scope**: limita los datos retornados, no solo las acciones. Un tirador no puede ver resultados de otros aunque haga un request directo por ID.

---

## Aislamiento multi-tenant

`TenantScopedQuerysetMixin` filtra **todos** los querysets por `tenant=request.tenant` antes de aplicar cualquier otra lógica. Es imposible que un usuario vea datos de otro tenant accidentalmente si todos los ViewSets heredan el mixin correctamente.

**Regla de seguridad**: al crear un nuevo ViewSet, siempre heredar `TenantScopedQuerysetMixin`. Sin este mixin, un usuario podría ver datos de otros tenants.

---

## Protección contra fuerza bruta (django-axes)

El sistema bloquea cuentas automáticamente tras demasiados intentos fallidos de login.

### Configuración

```dotenv
AXES_FAILURE_LIMIT=5       # intentos antes del bloqueo
AXES_COOLOFF_MINUTES=30    # minutos de bloqueo automático (60 en producción)
```

### Comportamiento

- Tras **5 intentos fallidos** (configurable): la cuenta queda bloqueada.
- El bloqueo actúa por **RUT + IP simultáneamente**.
- Después de `AXES_COOLOFF_MINUTES` minutos, el bloqueo se levanta automáticamente.
- Un login exitoso **resetea el contador** de intentos fallidos.

---

## Gestión de cuentas bloqueadas

### Quién puede desbloquear

| Rol | Puede desbloquear |
|---|---|
| `super_admin` | Cualquier usuario del sistema |
| `tenant_admin` | Cualquier usuario de su tenant |
| `admin_unidad` (SICE) | Usuarios dentro de su scope (unidad, descendientes o recinto) |
| Usuarios normales | No pueden desbloquear |

### Desde el frontend (recomendado)

```http
# Ver si una cuenta está bloqueada
GET /api/usuarios/{id}/estado-bloqueo/
X-Tenant-Code: ejercito-demo

# Respuesta:
{
  "rut": "12345678-9",
  "is_locked": true,
  "failures": 5,
  "failure_limit": 5,
  "last_attempt": "2026-06-04T15:30:00Z"
}
```

```http
# Desbloquear
POST /api/usuarios/{id}/desbloquear/
X-Tenant-Code: ejercito-demo
X-CSRFToken: <token>

# Respuesta:
{
  "detail": "Cuenta desbloqueada correctamente.",
  "rut": "12345678-9",
  "registros_eliminados": 1
}
```

El endpoint respeta el scope del solicitante: si el SICE intenta desbloquear un usuario fuera de su rama, recibe 404.

### El campo `is_locked` en el listado de usuarios

El serializer de `Usuario` incluye `is_locked: true/false` en la respuesta. El frontend puede usarlo para mostrar un ícono de candado en la lista de usuarios y habilitar el botón "Desbloquear".

### Desde la terminal del servidor (administrador técnico)

```bash
# Desbloquear un RUT específico
python manage.py axes_reset --username 12345678-9

# Desbloquear una IP específica
python manage.py axes_reset --ip 192.168.1.50

# Desbloquear TODO (emergencia)
python manage.py axes_reset
```

### Desde el panel admin de Django

Ir a: **Axes → Access attempts** → buscar por username (RUT) → eliminar los registros.

---

## Throttling (anti-fuerza bruta en API)

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/hour',
        'user': '2000/hour',
        'auth': '20/minute',          # login + endpoints de recuperación
        'unit_selection': '30/minute',
    }
}
```

El endpoint de login tiene throttle de 20/minuto para mitigar ataques de fuerza bruta.

---

## Audit log

Cada acceso que pasa por `HasResourcePermission` se registra en `AccessAudit`:

```python
AccessAudit
  ├── user_id_value      ← ID del usuario
  ├── tenant_code        ← tenant del request
  ├── endpoint           ← URL del endpoint
  ├── action             ← acción ejecutada (create, read, etc.)
  ├── allowed            ← True/False
  └── reason             ← razón del allow/deny
```

Accesible para administradores via `GET /api/auth/audit-log/`.

---

## Contraseñas

### Política de contraseñas

Django aplica validadores de contraseña configurados en `settings.py`:

```python
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
```

### Contraseña temporal

Usuarios nuevos reciben `DEFAULT_TEMP_PASSWORD` y `must_change_password=True`. El frontend debe forzar el cambio antes de permitir cualquier otra acción.

### Recuperación por código

El código de recuperación tiene vida útil de **5 minutos** y es de 6 dígitos. Tiene throttle implícito en el endpoint de envío.

---

## Headers de seguridad HTTP

Configurar en Nginx (ver [08_DEPLOYMENT.md](08_DEPLOYMENT.md)):

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

Django también agrega `X-Content-Type-Options` via `SecurityMiddleware`.

---

## Auditoría de cambios (django-auditlog)

El sistema registra automáticamente **cada modificación** en los modelos sensibles, incluyendo qué campos cambiaron, sus valores anteriores, quién hizo el cambio y desde qué IP.

### Modelos auditados

| Modelo | App | Por qué es sensible |
|---|---|---|
| `Role` | authorization | Cambio de nombre o estado de un rol |
| `RolePermission` | authorization | Qué puede hacer cada rol |
| `PositionPermission` | authorization | Permisos extra por puesto |
| `UserPermissionOverride` | authorization | Excepciones individuales ALLOW/DENY |
| `Position` | identity | Definición de puestos (rol, scope, recinto) |
| `Assignment` | identity | Quién ocupa qué puesto |
| `UnitMembership` | identity | Pertenencia orgánica del personal |
| `Recinto` | organizations | Qué unidades pertenecen a qué campo militar |

**NO se auditan**: lecciones de tiro, resultados, armas, polígonos — son datos operacionales con alta frecuencia de cambio y sin impacto en seguridad.

### Qué registra cada entrada

```
Timestamp:  2026-06-04 15:30:00
Actor:      99999999-9 (Carlos Volker)          ← quién hizo el cambio
IP:         192.168.1.45                         ← desde dónde
Modelo:     Role #5 (oficial_tiro)               ← qué objeto
Acción:     UPDATE                               ← qué hizo
Cambios:    { "name": ["Oficial de Tiro", "S-3"] } ← valor anterior → nuevo
```

### Cómo consultarlo

**Desde el panel admin de Django:**
Ir a: **Auditlog → Log entries** — filtrar por modelo, actor, fecha o acción.

**Desde código (ej: diagnóstico):**
```python
from auditlog.models import LogEntry
from apps.authorization.models import Role

role = Role.objects.get(code='oficial_tiro')
historial = LogEntry.objects.get_for_object(role).order_by('-timestamp')
for entry in historial:
    print(f'{entry.timestamp} — {entry.actor} — {entry.changes}')
```

### Configuración de retención

```dotenv
# .env — 0 = sin borrado automático, N = borrar registros más viejos que N días
AUDITLOG_MAX_AGE_DAYS=0
```

Para activar borrado automático en producción, agregar al cron o al deploy:
```bash
python manage.py auditlogflush --days=730   # borrar registros de más de 2 años
```

---

## Medidas de seguridad pendientes (implementar en producción)

### 🔴 Restricción de IP para `/admin/` en Nginx

Bloquear el acceso al panel de administración de Django para toda IP que no sea la del servidor o la red interna.

```nginx
location /admin/ {
    allow 127.0.0.1;
    allow 192.168.X.0/24;   # red interna del datacenter/cuartel
    deny all;
}
```

**Cuándo implementar:** antes de poner el sistema en producción en el VPS. Configurar junto con el archivo de Nginx del despliegue.

---

### 🟡 2FA (Doble Factor de Autenticación) para cuentas privilegiadas

Agregar una segunda capa de verificación para las cuentas `super_admin` y `tenant_admin`. Aunque la contraseña sea comprometida, el atacante no puede entrar sin el segundo factor.

**Opciones técnicas para Django:**
- `django-otp` + `django-two-factor-auth` — solución completa con TOTP (Google Authenticator, Authy)
- `django-allauth` con MFA — integra login social + MFA

**Consideraciones para implementar:**
- Requiere que los administradores tengan un dispositivo móvil o hardware token
- Necesita flujo de recuperación de acceso si se pierde el segundo factor
- Integrar con el frontend personalizado (no solo el admin de Django)

**Cuándo implementar:** cuando se defina el flujo de acceso del personal técnico y se establezca el protocolo de entrega de credenciales en la institución.

---

## Checklist de seguridad para producción

- [ ] `DEBUG=False`
- [ ] `SECRET_KEY` larga y aleatoria (no en el repositorio)
- [ ] `ALLOWED_HOSTS` con solo los dominios reales
- [ ] `SESSION_COOKIE_SECURE=True` (y `CSRF_COOKIE_SECURE` hereda del mismo valor)
- [ ] `CORS_ALLOWED_ORIGINS` con solo el dominio del frontend (no `*`)
- [ ] `CSRF_TRUSTED_ORIGINS` configurado
- [ ] HTTPS configurado en Nginx con certificado válido
- [ ] `HSTS` header configurado en Nginx
- [ ] Base de datos en red interna (no expuesta a internet)
- [ ] Variables de entorno en archivo protegido (no en el repo)
- [ ] Backup de BD periódico y probado
- [ ] Logs de Nginx y Gunicorn monitoreados
- [ ] `python manage.py check --deploy` sin warnings

---

## Vulnerabilidades conocidas y mitigaciones

| Riesgo | Mitigación |
|---|---|
| XSS que roba la sesión | Cookie `sessionid` HttpOnly → JS no puede leerla |
| CSRF | `SameSite=Lax` + verificación CSRF de Django (cookie `csrftoken` + header `X-CSRFToken`) |
| Fuerza bruta en login | Throttle 20/min en endpoints de auth + django-axes |
| Acceso cross-tenant | `TenantScopedQuerysetMixin` en todos los ViewSets |
| Escalada de privilegios | Pipeline de permisos con precedencia fija; MASTER solo para dev |
| Sesión sin expiración absoluta | Pendiente `M6` (ver "Pendientes con decisión de negocio") |
| Inyección SQL | ORM de Django → queries parametrizadas |
| Exposición de datos en listados | Scope automático en `get_queryset` |

---

## Auditoría de seguridad — 2026-06-07

### Correcciones aplicadas

**C1 — Reset de contraseña (un solo uso + expiración + fortaleza)**
Valida el `codigo` exacto contra `CodigoRecuperacion`, verifica expiración (<5 min), borra el código tras usarlo (un solo uso), y valida fortaleza con `validate_password()`.
Archivo: `apipoligono/utils/recuperacion_utilidades.py`

**C2 — Endpoints de recuperación (throttle + respuestas opacas)**
Las 4 vistas (`/api/recuperar/`, `/api/recuperar/crear/`, `/api/recuperar/comprobar/`, `/api/recuperar/cambiar/`) usan `AuthEndpointThrottle`. Todas responden siempre HTTP 200 con mensaje genérico — no revelan si el RUT existe o no.
Archivo: `apipoligono/views.py` (vistas de recuperación)

**C3 — Feature flags de autorización v2 con default `True`**
`AUTHZ_USE_PERMISSION_MODEL` y `AUTHZ_USE_UNIT_MEMBERSHIP` cambiaron su default a `True` en `settings.py`. El sistema opera exclusivamente en modo v2 (RolePermission + UnitMembership).
Archivo: `control_poligono/settings.py`

**C4 — `UserPermissionOverride` validación cross-tenant**
`UserPermissionOverrideViewSet` valida que el `account` del body pertenezca al mismo tenant del request antes de crear o editar un override.
Archivo: `apps/authorization/views.py`

**A1 — `RolePermission`/`PositionPermission` scoping por tenant**
`RolePermissionViewSet` y `PositionPermissionViewSet` filtran por tenant. Roles de sistema (`is_system=True`) solo pueden ser editados por super_admin.
Archivo: `apps/authorization/views.py`

**A2 — `CalibreViewSet` restringido a super_admin**
Create/update/delete del catálogo de calibres requiere ser super_admin (helper `_require_super_admin`).
Archivo: `apipoligono/views.py` (CalibreViewSet)

**A3 — `BrowsableAPIRenderer` solo en `DEBUG=True`**
En producción (`DEBUG=False`) solo `JSONRenderer` está activo. Elimina la superficie de ataque del formulario HTML de DRF.
Archivo: `control_poligono/settings.py`

**A4 — `EligibleTargetUnitsView` scope validado**
Valida que la unidad primaria del usuario target esté dentro del scope del solicitante antes de responder.
Archivo: `apipoligono/views.py` (EligibleTargetUnitsView)

**A5 — PII eliminada de logs**
Eliminados `print()` con RUT del backend de autenticación.
Archivo: `apipoligono/backends.py`

**M1 — Contraseña temporal no devuelta en respuesta JSON**
`resetear_contrasena` ya no incluye la contraseña en la respuesta.
Archivo: `apipoligono/utils/recuperacion_utilidades.py`

**M3 — Validadores de contraseña en todos los flujos**
`cambiar_contrasena` usa `validate_password()` de Django en todos los flujos de cambio.
Archivo: `apipoligono/utils/recuperacion_utilidades.py`

---

### Pendientes con decisión de negocio

**M2 — `on_delete=CASCADE` en `ResultadoTiro`**
`ResultadoTiro.id_usuario`, `ResultadoTiro.id_arma` y `ResultadoTiro.id_fraccion` usan CASCADE. Borrar un usuario, arma o fracción destruye silenciosamente registros de evaluaciones militares con valor histórico y potencialmente legal.
Opciones: soft-delete con campo `is_active`, `PROTECT` para impedir el borrado si existen resultados, o flujo de archivo previo al borrado.
Archivo: `apipoligono/models.py` (líneas 165-167)

**M5 — Serializers exponen PII amplia en listados**
`tiradores_elegibles` y `usuarios_listar` devuelven RUT, correo y assignments completos a cualquier rol con permiso `view_unit`. Se debe definir qué campos necesita realmente el frontend para cada vista antes de reducir el serializer.
Archivos: `apipoligono/views.py` (tiradores_elegibles ~línea 812, usuarios_listar ~línea 1139)

**M6 — Sesión sin tope absoluto de tiempo**
La sesión es sliding (8h de inactividad), pero un usuario activo nunca es desconectado. En entorno militar puede ser relevante un tope absoluto (ej. 12h desde el login). Requiere decidir si se necesita expiración absoluta y cuántas horas.
Archivo: `control_poligono/settings.py` (`SESSION_COOKIE_AGE`, `SESSION_EXPIRE_AT_BROWSER_CLOSE`)

**B4 — Remitente de correo hardcodeado**
El correo de recuperación de contraseña tiene un remitente hardcodeado. Requiere definir el correo institucional oficial del sistema.
Archivo: `apipoligono/utils/recuperacion_utilidades.py`

**I1 — Headers de seguridad HTTP para producción (Nginx)**
Pendientes de configurar cuando se despliegue el servidor Nginx: `SECURE_HSTS_SECONDS`, `SECURE_SSL_REDIRECT`, `SECURE_PROXY_SSL_HEADER`, `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS` en Django (además de los ya presentes en el bloque Nginx).
Documento a actualizar cuando se complete el deploy: `docs/08_DEPLOYMENT.md`
