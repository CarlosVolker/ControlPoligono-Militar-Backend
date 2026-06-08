from django.db import models

from apps.tenants.models import Tenant


class OrganizationUnit(models.Model):
    UNIT_TYPE_CHOICES = [
        ("command", "Command"),
        ("division", "Division"),
        ("regiment", "Regiment"),
        ("battalion", "Battalion"),
        ("company", "Company"),
        ("section", "Section"),
        ("squad", "Squad"),
        ("staff", "Staff"),
        ("range", "Range"),
        ("other", "Other"),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="organization_units")
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="children",
    )
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=120)
    unit_type = models.CharField(max_length=20, choices=UNIT_TYPE_CHOICES, default="other")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("tenant", "code")
        ordering = ["tenant", "name"]

    def __str__(self):
        return f"{self.name} [{self.tenant.code}]"


class Recinto(models.Model):
    """Espacio físico que agrupa múltiples unidades militares.

    Un recinto (ej: Campo Militar Valdivia) NO es un escalón de mando —
    es un contenedor geográfico. Las unidades dentro mantienen su propia
    jerarquía de mando y no se reportan entre sí via el recinto.

    Usos:
      - Permite al SICE de un recinto administrar TODAS las unidades físicamente
        presentes sin importar su rama o jerarquía.
      - Agrupa unidades para reportes y filtros por ubicación física.

    Las unidades se agregan/quitan via la relación M2M `units`.
    """

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='recintos',
    )
    code = models.CharField(
        max_length=50,
        help_text='Código único por tenant. Ej: CMV, CMP, CMLR.',
    )
    name = models.CharField(
        max_length=200,
        help_text='Nombre del recinto. Ej: Campo Militar Valdivia.',
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    units = models.ManyToManyField(
        OrganizationUnit,
        related_name='recintos',
        blank=True,
        help_text='Unidades militares físicamente ubicadas en este recinto.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('tenant', 'code')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} [{self.tenant.code}]"
