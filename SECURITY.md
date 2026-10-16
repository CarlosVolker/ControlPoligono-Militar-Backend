# Seguridad

Este documento es el punto de entrada al modelo de seguridad del backend. La referencia operativa completa se encuentra en [`docs/11_SEGURIDAD.md`](docs/11_SEGURIDAD.md); la definición del modelo de autorización está en [`docs/04_PERMISOS.md`](docs/04_PERMISOS.md).

## Controles principales

- **Autenticación:** sesiones de Django mediante la cookie `sessionid` con `HttpOnly`. El sistema no usa JWT.
- **Protección CSRF:** Django valida la cookie `csrftoken` y el encabezado `X-CSRFToken` en solicitudes no seguras. La cookie de sesión es `HttpOnly`; la cookie CSRF debe ser legible por el frontend.
- **Autorización:** control de acceso basado en roles (RBAC) mediante `Position`, `Role`, políticas de alcance y `permission_codes` atómicos. Los permisos efectivos también pueden incluir permisos de puesto y anulaciones individuales.
- **Aislamiento multi-tenant:** cada solicitud debe indicar `X-Tenant-Code`. Los querysets se restringen por tenant y por alcance mediante `TenantScopedQuerysetMixin`.
- **Fuerza bruta:** `django-axes` bloquea temporalmente los intentos reiterados de acceso; los endpoints de autenticación también aplican límites de frecuencia.
- **Trazabilidad:** los accesos autorizados o denegados se registran en `AccessAudit`. `django-auditlog` conserva cambios sobre modelos sensibles de identidad, autorización y organización.

## Referencias canónicas

- [`docs/11_SEGURIDAD.md`](docs/11_SEGURIDAD.md): autenticación, CSRF, CORS, aislamiento multi-tenant, fuerza bruta, auditoría, despliegue seguro y pendientes conocidos.
- [`docs/04_PERMISOS.md`](docs/04_PERMISOS.md): puestos, roles, permisos atómicos, políticas de alcance, precedencia y anulaciones.

> Antes de desplegar en producción, aplica el checklist y revisa los pendientes registrados en `docs/11_SEGURIDAD.md`.
