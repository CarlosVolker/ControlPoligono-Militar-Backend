from django.apps import AppConfig


class AuthorizationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.authorization"
    verbose_name = "Authorization"

    def ready(self):
        from auditlog.registry import auditlog
        from apps.authorization.models import (
            Role,
            RolePermission,
            PositionPermission,
            UserPermissionOverride,
        )
        from apipoligono.models import EjercicioMilitar, ConsumoMunicion, ConsumoArma
        # Auditar cambios en roles y permisos — cualquier modificación queda registrada
        # con quién lo hizo, desde qué IP y qué campos cambiaron.
        auditlog.register(Role, exclude_fields=['created_at'])
        auditlog.register(RolePermission)
        auditlog.register(PositionPermission)
        auditlog.register(UserPermissionOverride, exclude_fields=['created_at'])
        # Auditar ejercicios en campo (registro operativo con impacto en inventario).
        auditlog.register(EjercicioMilitar)
        auditlog.register(ConsumoMunicion)
        auditlog.register(ConsumoArma)
