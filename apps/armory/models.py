from django.db import models


class Armory(models.Model):
    """Almacen de material de guerra. Pertenece a una unidad organizacional.
    Una unidad puede tener varios almacenes (ej: principal + secundario, o uno
    por tipo de armamento). Cada almacen tiene un encargado (modelado vía
    Position en apps.identity).

    Las armas (apipoligono.Arma) tienen FK a Armory: el "donde esta" del arma
    es el almacen, NO la unidad directamente. La unidad se deriva de armory.
    """

    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.PROTECT,
        related_name='armories',
    )
    organization_unit = models.ForeignKey(
        'organizations.OrganizationUnit',
        on_delete=models.PROTECT,
        related_name='armories',
    )
    code = models.CharField(
        max_length=50,
        help_text='Codigo corto y unico por tenant. Ej: ALM-BAT4-PRINCIPAL',
    )
    name = models.CharField(
        max_length=120,
        help_text='Nombre descriptivo. Ej: Almacen Principal Batallon 4',
    )
    descripcion = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('tenant', 'code')
        ordering = ['organization_unit', 'name']
        verbose_name_plural = 'Armorias'

    def __str__(self):
        return f"{self.name} [{self.code}]"
