from django.apps import AppConfig


class IdentityConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.identity"
    verbose_name = "Identity"

    def ready(self):
        from auditlog.registry import auditlog
        from apps.identity.models import Position, Assignment, UnitMembership

        # Position: cualquier cambio en un puesto (rol, scope, unidad, recinto)
        auditlog.register(Position, exclude_fields=['created_at', 'updated_at'])

        # Assignment: quién ocupa qué puesto — cambios críticos de acceso
        auditlog.register(Assignment, exclude_fields=['created_at'])

        # UnitMembership: pertenencia orgánica — cambios de unidad del personal
        auditlog.register(UnitMembership, exclude_fields=['created_at'])
