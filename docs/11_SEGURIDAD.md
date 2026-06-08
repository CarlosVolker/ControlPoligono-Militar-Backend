# Seguridad

## Modelo de seguridad general

El sistema implementa defensa en profundidad con múltiples capas:

```
1. HTTPS (TLS) en producción
2. Autenticación JWT en cookies HttpOnly (mitiga XSS)
3. CSRF protection (mitiga CSRF)
4. CORS configurado explícitamente
5. RBAC + Scope (control de acceso a datos)
6. Multi-tenant con aislamiento completo
7. Throttling (anti-brute force)
8. Audit log (trazabilidad)
```

---

## Autenticación

### JWT en cookies HttpOnly

Los tokens JWT se almacenan en cookies `HttpOnly; Secure; SameSite=Lax`:

- **HttpOnly**: JavaScript no puede leer la cookie → inmune a XSS que roba tokens
- **Secure**: solo se envía en HTTPS (configurar `JWT_COOKIE_SECURE=True` en prod)
- **SameSite=Lax**: mitiga CSRF — la cookie no se envía en requests cross-site de terceros

```python
# settings.py
SIMPLE_JWT = {
    'AUTH_COOKIE_SECURE': not DEBUG,      # True en producción
    'AUTH_COOKIE_HTTP_ONLY': True,         # Siempre True
    'AUTH_COOKIE_SAMESITE': 'Lax',
}
```

### Vida útil de los tokens

- **Access token**: 10 minutos — minimiza la ventana si un token es comprometido
- **Refresh token**: 7 días — balanceo entre seguridad y UX
- **Rotación**: cada refresh genera un nuevo refresh token (`ROTATE_REFRESH_TOKENS=True`)

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
        'auth': '20/minute',          # login + refresh
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
- [ ] `JWT_COOKIE_SECURE=True`
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
| XSS que roba tokens | Cookies HttpOnly → JS no puede leerlas |
| CSRF | `SameSite=Lax` + verificación CSRF de Django |
| Fuerza bruta en login | Throttle 20/min en endpoints de auth |
| Acceso cross-tenant | `TenantScopedQuerysetMixin` en todos los ViewSets |
| Escalada de privilegios | Pipeline de permisos con precedencia fija; MASTER solo para dev |
| Tokens de larga vida | Access token: 10 min; rotación de refresh |
| Inyección SQL | ORM de Django → queries parametrizadas |
| Exposición de datos en listados | Scope automático en `get_queryset` |
