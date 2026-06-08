from django.apps import AppConfig


class OrganizationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.organizations"
    verbose_name = "Organizations"

    def ready(self):
        from auditlog.registry import auditlog
        from apps.organizations.models import Recinto

        # Recinto: cambios en qué unidades pertenecen a qué campo militar
        auditlog.register(Recinto, exclude_fields=['created_at', 'updated_at'])
