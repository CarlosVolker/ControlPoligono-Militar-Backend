from django.conf import settings
from django.db import models

from apps.authorization.models import Role, ScopePolicy
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant


class Person(models.Model):
    """Persona fisica (no necesariamente con cuenta). Identificada por
    document_id (RUT en Chile). Una persona puede tener cuentas en distintos
    tenants (FFAA distintas) sin duplicarse aqui."""

    full_name = models.CharField(max_length=120)
    document_id = models.CharField(max_length=30, unique=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name


class Account(models.Model):
    """Cuenta de una Person en un Tenant. Liga el User de Django (auth) con
    la Person (datos personales) y el Tenant (institucion). Un usuario solo
    puede tener UNA cuenta por tenant."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="identity_account")
    person = models.ForeignKey(Person, on_delete=models.PROTECT, related_name="accounts")
    tenant = models.ForeignKey(Tenant, on_delete=models.PROTECT, related_name="accounts")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("person", "tenant")
        ordering = ["tenant", "person"]

    def __str__(self):
        return f"{self.user} @ {self.tenant.code}"


class Position(models.Model):
    """Un PUESTO en la organizacion. Es una entidad estable que persiste
    independientemente de quien lo ocupe. Ejemplos:

      - "Comandante 4to Batallon Telecomunicaciones"
      - "Encargado Almacen Principal Compania A"
      - "Oficial S-3 Brigada Aerea"

    Las personas ROTAN por los puestos. Cuando un comandante deja el cargo y
    asume otro, el puesto sigue existiendo y se le asigna un nuevo holder via
    Assignment.

    El puesto fija el rol funcional, el scope, la unidad organizacional y
    opcionalmente la armoria (para puestos como encargado de almacen). Esos
    valores ya no viven en Assignment.
    """

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="positions")
    code = models.CharField(
        max_length=80,
        help_text="Codigo unico por tenant. Ej: CMTE-BAT4, ENC-ALM-CIA-A.",
    )
    name = models.CharField(
        max_length=200,
        help_text="Nombre descriptivo. Ej: Comandante 4to Batallon Telecomunicaciones.",
    )
    organization_unit = models.ForeignKey(
        OrganizationUnit,
        on_delete=models.PROTECT,
        related_name="positions",
        help_text="Unidad sobre la que opera este puesto.",
    )
    armory = models.ForeignKey(
        "armory.Armory",
        on_delete=models.PROTECT,
        related_name="positions",
        null=True,
        blank=True,
        help_text="Solo aplica para puestos de almacen (ej: encargado de armoria X).",
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name="positions",
        help_text="Rol funcional del puesto: define los permisos base.",
    )
    scope_policy = models.ForeignKey(
        ScopePolicy,
        on_delete=models.PROTECT,
        related_name="positions",
        null=True,
        blank=True,
        help_text="Politica de alcance: a que datos accede quien ocupa este puesto.",
    )
    recinto = models.ForeignKey(
        'organizations.Recinto',
        on_delete=models.PROTECT,
        related_name='positions',
        null=True,
        blank=True,
        help_text=(
            'Solo para puestos con scope todo_recinto (ej: SICE de Campo Militar). '
            'El scope cubrirá todas las unidades del recinto.'
        ),
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_unique_holder = models.BooleanField(
        default=True,
        help_text="Si True, solo 1 persona puede ocupar este puesto a la vez.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("tenant", "code")
        ordering = ["organization_unit", "code"]

    def __str__(self):
        return f"{self.name} [{self.code}]"


class Assignment(models.Model):
    """Una persona OCUPA un puesto (Position) desde una fecha.

    Permite historial: cuando un comandante cesa, se pone is_active=False y
    ends_at=now(). El siguiente crea un nuevo Assignment sobre la misma Position.

    `is_primary`: el puesto principal del usuario. Solo uno activo puede ser primario.
    """

    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="assignments")
    position = models.ForeignKey(
        Position,
        on_delete=models.PROTECT,
        related_name="holders",
    )
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ["account", "position"]

    @property
    def effective_role(self):
        return self.position.role

    @property
    def effective_scope(self):
        return self.position.scope_policy

    @property
    def effective_unit(self):
        return self.position.organization_unit

    def __str__(self):
        return f"{self.account_id}: {self.position.code}"


class UnitMembership(models.Model):
    """Pertenencia orgánica de un Account a una OrganizationUnit.

    DISTINTO de Assignment (que modela "ocupa un puesto funcional").
    UnitMembership modela "pertenece orgánicamente a esta unidad".

    Un tirador pertenece a su compañía aunque no tenga puesto formal.
    Un integrante del SICE puede pertenecer a la JAL pero administrar
    el Campo Militar Valdivia entero a través de su puesto (Position).

    Esta pertenencia:
      - Determina en qué listas de personal aparece el usuario.
      - Define la unidad base para el cálculo de scope.
      - NO otorga permisos por sí misma.
    """

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='unit_memberships',
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='unit_memberships',
    )
    unit = models.ForeignKey(
        OrganizationUnit,
        on_delete=models.PROTECT,
        related_name='members',
    )
    is_primary = models.BooleanField(
        default=True,
        help_text='Unidad principal del usuario. Solo una debe ser primaria por account.',
    )
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['account', '-is_primary', '-starts_at']
        indexes = [
            models.Index(fields=['tenant', 'unit', 'is_active']),
            models.Index(fields=['account', 'is_active']),
        ]

    def __str__(self):
        return f"{self.account} → {self.unit.code}"
