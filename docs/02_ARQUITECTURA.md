# Arquitectura del Backend

## Propósito del sistema

PoligonoTiro gestiona el ciclo completo de sesiones de tiro en unidades de Fuerzas Armadas: registro de lecciones, fracciones de tiradores, resultados individuales y control de acceso por jerarquía militar.

El sistema es **multi-tenant**: una instancia sirve a múltiples instituciones militares con datos completamente aislados.

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Framework web | Django 5.2.15 |
| API REST | Django REST Framework 3.15.2 |
| Autenticación | Sesiones Django + CSRF (cookies HttpOnly) |
| Base de datos (prod) | PostgreSQL 14+ |
| Base de datos (dev) | SQLite |
| Python | 3.14+ |
| Servidor (prod) | Gunicorn + Nginx |

## Estructura de apps

```
ControlPoligono/
├── control_poligono/       ← Configuración Django (settings, urls raíz, wsgi, asgi)
├── apipoligono/            ← App principal: dominio de tiro
│   ├── models.py           ← Usuario, Arma, PoligonoTiro, LeccionTiro, FraccionTiro, ResultadoTiro
│   ├── views.py            ← Todos los ViewSets DRF + vistas de auth
│   ├── serializers.py
│   ├── urls.py             ← Router con todos los endpoints
│   ├── mixins.py           ← TenantScopedQuerysetMixin
│   └── tests/
└── apps/
    ├── tenants/            ← Tenant + TenantContextMiddleware
    ├── organizations/      ← OrganizationUnit (árbol jerárquico)
    ├── armory/             ← Armory (almacén)
    ├── identity/           ← Person, Account, Position, Assignment, UnitMembership
    │   └── authentication.py ← SessionCsrfAuthentication
    └── authorization/      ← Role, ScopePolicy, Permission, RolePermission,
                              PositionPermission, UserPermissionOverride
        ├── permissions.py  ← HasTenantAccess, HasResourcePermission
        └── scope.py        ← get_allowed_unit_ids, get_primary_unit, eligible_target_units
```

### Dependencias entre apps

```
authorization  ←── sin dependencias internas
tenants        ←── sin dependencias internas
organizations  ←── tenants
armory         ←── tenants, organizations
identity       ←── tenants, organizations, armory, authorization
apipoligono    ←── todas las anteriores
```

## Capas de la aplicación

Arquitectura en **3 capas simples**. No hay capa de Service ni Repository.

```
Request HTTP
    │
    ▼
urls.py  (routing)
    │
    ▼
views.py (ViewSets DRF)
    │  ├── Valida permisos (HasTenantAccess, HasResourcePermission)
    │  ├── Filtra queryset (TenantScopedQuerysetMixin)
    │  └── Lógica de negocio en perform_create/perform_update
    │
    ▼
serializers.py  (validación + serialización)
    │
    ▼
models.py  (ORM + constraints de BD)
    │
    ▼
PostgreSQL / SQLite
```

## Flujo completo de un request autenticado

```
1. Cliente envía request con:
   - Cookie: sessionid=<valor>      (HttpOnly, seteada por el login)
   - Header: X-Tenant-Code: ejercito-demo
   - Header: X-CSRFToken: <csrftoken>  (en POST/PUT/PATCH/DELETE)

2. Middleware stack:
   TenantContextMiddleware
   → request.tenant = Tenant(code='ejercito-demo')

3. DRF Authentication:
   SessionCsrfAuthentication
   → lee cookie sessionid → request.user = Usuario(rut='...')
   → valida CSRF en métodos no-seguros

4. DRF Permission classes:
   a. IsAuthenticated      → verifica usuario autenticado
   b. HasTenantAccess      → busca Account(user, tenant) → request.identity_account
   c. HasResourcePermission → mapea (resource, action) → permission_code
                            → evalúa RolePermission / PositionPermission

5. ViewSet.get_queryset():
   TenantScopedQuerysetMixin
   → filtra por tenant + get_allowed_unit_ids(account)

6. ViewSet action:
   → serializer.is_valid() → perform_create/update → Response
```

## Middleware configurado

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',           # CORS antes de todo
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.tenants.middleware.TenantContextMiddleware', # resuelve request.tenant
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

## Multi-tenancy: aislamiento de datos

1. `TenantContextMiddleware` → `request.tenant`
2. `HasTenantAccess` → verifica `Account` activo en ese tenant
3. `TenantScopedQuerysetMixin.get_queryset()` → filtra por `tenant=request.tenant`
4. Luego aplica filtro de scope organizacional (`get_allowed_unit_ids`)

## Throttling

| Tipo | Límite |
|---|---|
| Anónimo | 120 req/hora |
| Autenticado | 2000 req/hora |
| Login | 20 req/minuto |
| Cambio de unidad activa | 30 req/minuto |

## Lo que el sistema NO hace

- Service / Repository / Use-case pattern
- UUID como PK
- API versioning (`/api/v1/`)
- pytest (usa `manage.py test`)
- factory_boy (usa `_factories.py` propio)
- JWT — usa sesiones Django + CSRF (cookies HttpOnly); sin access/refresh tokens
- PermissionRule (eliminado — usa RolePermission)
- Modo civil
