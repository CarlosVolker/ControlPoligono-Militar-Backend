# PoligonoTiro Backend — Documentación

Backend Django REST para gestión de polígonos de tiro de Fuerzas Armadas. Multi-tenant, RBAC con puestos (Position) y permisos atómicos, autenticación por sesiones Django + CSRF.

## Orden de lectura recomendado

| # | Archivo | Para qué sirve |
|---|---|---|
| 01 | [QUICKSTART](01_QUICKSTART.md) | Levantar el backend en local en 10 minutos |
| 02 | [ARQUITECTURA](02_ARQUITECTURA.md) | Apps, capas, stack y flujo de un request |
| 03 | [AUTH SESIONES](03_AUTH_SESIONES.md) | Login, cookies de sesión, CSRF, logout |
| 04 | [PERMISOS](04_PERMISOS.md) | Position, Role, Permission, Scope, Override |
| 05 | [DOMINIO](05_DOMINIO.md) | Modelos de negocio: unidades, tiro, resultados |
| 06 | [API REFERENCE](06_API_REFERENCE.md) | Lista completa de endpoints con permisos y bodies |
| 07 | [MANAGEMENT COMMANDS](07_MANAGEMENT_COMMANDS.md) | Comandos `manage.py` disponibles |
| 08 | [DEPLOYMENT](08_DEPLOYMENT.md) | Variables de entorno, Gunicorn, Nginx, PostgreSQL |
| 09 | [TESTING](09_TESTING.md) | Cómo correr y agregar tests |
| 10 | [GLOSARIO](10_GLOSARIO.md) | Términos técnicos y militares |
| 11 | [SEGURIDAD](11_SEGURIDAD.md) | Modelo de seguridad, checklist producción |
| 12 | [GUÍA FRONTEND](12_GUIA_FRONTEND.md) | Todo lo que necesita un dev frontend |
| 13 | [MIGRACIÓN AUTHZ](13_MIGRACION_AUTHZ.md) | Historial de la migración del sistema de permisos (6 fases completadas) |

## Convenciones del sistema

- **Multi-tenancy obligatoria**: cada request debe llevar `X-Tenant-Code`. Sin tenant resuelto → 403.
- **Sesiones Django**: el frontend usa `withCredentials: true` y envía `X-CSRFToken` en métodos no-seguros.
- **Permisos atómicos**: el endpoint `/api/auth/context/` devuelve `permissions` como array de `permission_codes`. Usar estos para controlar la UI.
- **Modo único: militar**. No existe modo civil.
- **Sin JWT**: el sistema usa sesiones Django, no tokens JWT.
- **Idempotencia en seed**: `init_access_model`, `init_permissions`, `seed_positions`, `crear_master` pueden correrse N veces sin efectos colaterales.

## Mantenimiento de la documentación

| Cambio | Actualizar |
|---|---|
| Endpoint nuevo | [06_API_REFERENCE](06_API_REFERENCE.md) |
| Cambio en permisos | [04_PERMISOS](04_PERMISOS.md) |
| Cambio en modelos | [05_DOMINIO](05_DOMINIO.md) |
| Variable de entorno nueva | [08_DEPLOYMENT](08_DEPLOYMENT.md) |
| Comando nuevo | [07_MANAGEMENT_COMMANDS](07_MANAGEMENT_COMMANDS.md) |
| Término nuevo | [10_GLOSARIO](10_GLOSARIO.md) |
| Permission_code nuevo | [04_PERMISOS](04_PERMISOS.md) + `PERMISSION_CATALOG` en `authorization/models.py` + `RESOURCE_ACTION_TO_PERMISSION` en `authorization/permissions.py` |
