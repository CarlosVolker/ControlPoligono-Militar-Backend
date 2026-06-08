# PoligonoTiro — Backend

Backend Django REST para gestión de polígonos de tiro de Fuerzas Armadas.
Multi-tenant, RBAC con puestos (Position) y permisos atómicos, autenticación
por sesiones Django con cookies HttpOnly.

## Stack

- Django 5.2.15 + DRF 3.15.2
- Sesiones Django + CSRF (HttpOnly cookies)
- PostgreSQL (prod) / SQLite (dev local)
- Python 3.14+
- Windows (dev) / Linux (prod, Gunicorn + Nginx)

## Estructura del repo

```text
ControlPoligono/                 ← repo root
├── manage.py
├── requirements.txt
├── .env / .env.example
├── docs/                        ← documentación viva — ver docs/00_INDEX.md
├── control_poligono/            ← Django config (settings.py, urls.py, wsgi.py, asgi.py)
├── apipoligono/                 ← app principal (dominio de tiro)
│   ├── models.py                ← Usuario, Arma, PoligonoTiro, LeccionTiro, FraccionTiro, ResultadoTiro
│   ├── views.py                 ← ViewSets DRF + vistas de auth
│   ├── serializers.py
│   ├── urls.py                  ← router con TODOS los endpoints
│   ├── mixins.py                ← TenantScopedQuerysetMixin
│   └── tests/                   ← paquete de tests
└── apps/
    ├── tenants/                 ← Tenant + TenantContextMiddleware
    ├── organizations/           ← OrganizationUnit (árbol jerárquico)
    ├── armory/                  ← Armory (almacén)
    ├── identity/                ← Person, Account, Position, Assignment, UnitMembership
    │   └── authentication.py   ← SessionCsrfAuthentication
    └── authorization/           ← Role, ScopePolicy, Permission, RolePermission,
        │                          PositionPermission, UserPermissionOverride
        ├── permissions.py       ← HasTenantAccess, HasResourcePermission
        └── scope.py             ← get_allowed_unit_ids, get_primary_unit, eligible_target_units
```

## Comandos clave (Windows / PowerShell)

```powershell
# Setup inicial (orden obligatorio)
.venv\Scripts\python.exe manage.py migrate
.venv\Scripts\python.exe manage.py init_access_model --tenant-code ejercito-demo --tenant-name "Ejército Demo"
.venv\Scripts\python.exe manage.py init_permissions
.venv\Scripts\python.exe manage.py seed_org_tree --tenant-code ejercito-demo
.venv\Scripts\python.exe manage.py crear_master --rut 99999999-9 --password Dev1234 --tenant-code ejercito-demo
.venv\Scripts\python.exe manage.py seed_positions --tenant-code ejercito-demo

# Dev
.venv\Scripts\python.exe manage.py runserver
.venv\Scripts\python.exe manage.py check
.venv\Scripts\python.exe manage.py test
.venv\Scripts\python.exe manage.py test apipoligono.tests.test_permissions

# Diagnóstico
.venv\Scripts\python.exe manage.py dump_user_assignments <RUT>
```

## Arquitectura — qué SÍ y qué NO

### SÍ (lo que el código hace hoy)
- **Capas**: `urls.py` → `views.py` (DRF ViewSets) → `serializers.py` → `models.py`. **Sin** capa de Service ni Repository — no inventes una.
- **Auth**: Sesiones Django + CSRF. `SessionCsrfAuthentication` lee la sesión desde cookie `sessionid` HttpOnly. El frontend envía `X-CSRFToken` en POST/PUT/PATCH/DELETE. NO hay JWT.
- **Multi-tenant obligatorio**: cada request lleva header `X-Tenant-Code`. Sin él, `HasTenantAccess` devuelve 403.
- **Scope automático**: `TenantScopedQuerysetMixin` filtra por tenant + `get_allowed_unit_ids(account)`. Usarlo siempre.
- **Permisos por Permission atómico**: `HasResourcePermission` mapea `(resource, action)` → `permission_code` y evalúa contra `RolePermission` / `PositionPermission`.
- **UnitMembership**: la pertenencia orgánica a una unidad es distinta del puesto funcional. Todo usuario tiene una `UnitMembership` primaria.

### NO (no agregues, no asumas que existe)
- Service / Repository / Use-case pattern.
- UUID como PK (se usa `AutoField` clásico).
- API versioning (`/api/v1/` no existe).
- `pytest` (se usa `manage.py test` con `unittest`).
- `factory_boy` (los tests usan helpers en `apipoligono/tests/_factories.py`).
- Modo civil (eliminado; solo militar).
- `PermissionRule` (eliminado en FASE 5 — reemplazado por `RolePermission`).
- Campos legacy en `Assignment` (`role`, `scope_policy`, `organization_unit` — eliminados en FASE 5).
- Campo `rol` en `Usuario` (`admin/limitado/tirador` — eliminado en FASE 6).

## Modelo de permisos — resumen

Detalle completo en [docs/04_PERMISOS.md](docs/04_PERMISOS.md). Consultarlo antes de tocar permission classes.

1. **Position** = puesto estable (combina Role + ScopePolicy + OrganizationUnit + opcional Armory).
2. **Assignment** = persona ocupando una Position. `position` es NOT NULL. Histórico via `is_active=False`.
3. **UnitMembership** = pertenencia orgánica a una unidad (separada del puesto funcional).
4. **Role + RolePermission** = qué `permission_codes` puede ejecutar cada rol.
5. **PositionPermission** = permisos extra para un puesto específico (sobre los del rol).
6. **ScopePolicy** = alcance de datos: `solo_propio`, `unidad_propia`, `unidad_y_descendientes`, `solo_agregado`.
7. **UserPermissionOverride** = override individual ALLOW/DENY por account.
8. **MASTER** (`super_admin`) = bypass total. Reservado para el desarrollador.

### Helpers a reusar (NO duplicar lógica)

| Helper | Ubicación | Para qué |
|---|---|---|
| `get_allowed_unit_ids(account)` | `apps/authorization/scope.py` | Set de unidades visibles. `None` = admin global. |
| `get_primary_unit(account)` | mismo | Unidad principal del account según UnitMembership. |
| `get_effective_permission_codes(account)` | `apps/authorization/permissions.py` | Set de permission_codes activos del usuario. |
| `TIPO_ARMA_CHOICES` | `apipoligono/models.py` | Choices canónicas para `Arma.tipo_arma` y `ConsumoMunicion.tipo_arma`. Reusar, no duplicar. |
| `Calibre` | `apipoligono/models.py` | Catálogo global de calibres. FK desde `Arma` y `ConsumoMunicion`. Códigos canónicos: `5.56X45`, `7.62X51`, `9X19`, `8.6X70`, `12.7X99`, `84MM`. |
| `_descendant_ids(root_ids)` | `scope.py` | Walk recursivo del árbol. |
| `eligible_target_units(unit, max_levels=2)` | mismo | Unidades elegibles para asignar roles. |
| `Assignment.effective_role/scope/unit` | `apps/identity/models.py` | Accede a los valores via Position. |
| `TenantScopedQuerysetMixin` | `apipoligono/mixins.py` | Filtra queryset por tenant + scope. Heredarlo siempre. |
| `_find_or_create_position(tenant, unit, role, scope)` | `apipoligono/views.py` | Encuentra o crea Position ad-hoc. |
| `_ensure_tirador_assignment(account, unit)` | `apipoligono/views.py` | Garantiza el assignment tirador implícito. |
| `_ensure_unit_membership(account, unit, tenant)` | `apipoligono/views.py` | Garantiza la membresía orgánica. |

## Gotchas

- **`request.tenant` puede ser None** si falta `X-Tenant-Code`. Las permission classes lo chequean primero.
- **Todo Assignment requiere `position`**: `Assignment.position` es NOT NULL. Usar `_find_or_create_position()` o `assign_position()` de factories. Nunca crear Assignments directamente sin position.
- **Un solo `is_primary=True` por account**: el primario determina el scope y la unidad activa.
- **Tirador implícito**: cada usuario creado recibe automáticamente un Assignment con rol `tirador`. Persiste aunque se quite el rol funcional.
- **`UnitMembership` siempre al asignar unidad**: `_ensure_unit_membership()` es idempotente — llamarlo siempre que se crea/actualiza una unidad principal del usuario.
- **`Arma.organization_unit`** es campo legacy — la fuente de verdad es `Arma.armory.organization_unit`.
- **`Position.recinto` solo actúa con `scope=todo_recinto`**: si el scope es otro (`unidad_y_descendientes`, etc.), el campo recinto es ignorado completamente en el cálculo de scope.

## Convenciones de código

- **Naming**: `snake_case` módulos/funciones/variables, `PascalCase` clases, `UPPER_SNAKE_CASE` constantes.
- **Apps singular**: `armory`, `identity`, `authorization`, `tenants`, `organizations`.
- **URLs plural y español**: `/api/usuarios/`, `/api/posiciones/`, `/api/armorias/`, `/api/lecciones/`.
- **Comentarios mínimos**: solo cuando el "por qué" no es obvio.
- **Tests**: en `apipoligono/tests/`. Reusar `_factories.py` para data setup. Cada feature trae tests.
- **Migraciones**: `makemigrations` → revisar → commitear. Data migrations con `RunPython` explícito.

## Si vas a hacer X, mirá Y primero

| Hacer | Mirar primero |
|---|---|
| Endpoint nuevo | `docs/06_API_REFERENCE.md`, `apipoligono/urls.py`, viewsets vecinos |
| Tocar permisos | `docs/04_PERMISOS.md`, `apps/authorization/permissions.py`, `scope.py` |
| Agregar permission_code nuevo | `apps/authorization/models.py` (PERMISSION_CATALOG), `apps/authorization/permissions.py` (RESOURCE_ACTION_TO_PERMISSION) |
| Crear migración data | `apps/authorization/migrations/0008_populate_permission_catalog.py` como template |
| Filtrar queryset por tenant | usar `TenantScopedQuerysetMixin`, NO reinventar |
| Auditoría / debug 403 | `python manage.py dump_user_assignments <RUT>` |
| Agregar modelo | seguir el patrón de `apps/armory/models.py` |
| Cambiar settings | `docs/08_DEPLOYMENT.md` |

## Workflow estándar cuando agregás algo

1. Modificar `models.py` → `makemigrations` → revisar la migración generada.
2. `serializers.py` para exponerlo en la API.
3. `views.py` con viewset + `resource_name` + mapear acciones en `RESOURCE_ACTION_TO_PERMISSION`.
4. `urls.py` con `router.register(...)`.
5. Agregar `RolePermission` al seed en `init_access_model.py` (DEFAULT_PERMISSIONS).
6. Tests en `apipoligono/tests/test_<area>.py`.
7. Actualizar `docs/06_API_REFERENCE.md`.
8. `manage.py check` + `manage.py test` antes de commit.

## Reuso obligatorio

Antes de escribir código nuevo, buscar:

- Helpers en `apps/authorization/scope.py` y `apps/authorization/permissions.py`.
- Mixins en `apipoligono/mixins.py`.
- Patrones de viewset en `apps/armory/views.py` y `apps/identity/views.py`.
- Factories en `apipoligono/tests/_factories.py` para tests.

## Documentación completa

Ver `docs/` para documentación detallada:
- [docs/02_ARQUITECTURA.md](docs/02_ARQUITECTURA.md) — estructura y flujo de requests
- [docs/03_AUTH_SESIONES.md](docs/03_AUTH_SESIONES.md) — autenticación: sesiones Django, CSRF, login/logout
- [docs/04_PERMISOS.md](docs/04_PERMISOS.md) — modelo de permisos completo
- [docs/06_API_REFERENCE.md](docs/06_API_REFERENCE.md) — todos los endpoints
- [docs/07_MANAGEMENT_COMMANDS.md](docs/07_MANAGEMENT_COMMANDS.md) — comandos manage.py
- [docs/08_DEPLOYMENT.md](docs/08_DEPLOYMENT.md) — producción y variables de entorno
- [docs/11_SEGURIDAD.md](docs/11_SEGURIDAD.md) — modelo de seguridad
- [docs/12_GUIA_FRONTEND.md](docs/12_GUIA_FRONTEND.md) — guía para el desarrollador frontend
