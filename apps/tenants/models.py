from django.db import models


class Tenant(models.Model):
    """Una institucion militar (Ejercito, Armada, FACh, etc). Cada Tenant es
    un universo independiente: sus usuarios, unidades, armas, lecciones, etc.
    NO se cruzan entre tenants.

    El campo `context` queda solo por compatibilidad historica; siempre vale
    'military' en este despliegue (el modo civil fue removido).
    """

    CONTEXT_CHOICES = [
        ("military", "Military"),
    ]

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=120)
    context = models.CharField(
        max_length=20,
        choices=CONTEXT_CHOICES,
        default="military",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
