from django.db import models


# ---------------------------------------------------------------------------
# Catálogo de permisos atómicos del sistema
# ---------------------------------------------------------------------------

PERMISSION_CATALOG = [
    # (code, name, category)
    # Información personal
    ('view_self',                  'Ver propio perfil',                  'personal'),
    ('edit_self',                  'Editar información personal',         'personal'),
    # Personal
    ('view_personnel_basic',       'Ver personal (básico)',               'personnel'),
    ('view_personnel_full',        'Ver personal (completo)',             'personnel'),
    ('manage_personnel',           'Gestionar personal',                  'personnel'),
    # Puestos
    ('assign_positions',           'Asignar puestos',                    'positions'),
    ('revoke_positions',           'Revocar puestos',                    'positions'),
    # Unidades
    ('view_unit',                  'Ver unidad',                         'units'),
    ('view_unit_hierarchy',        'Ver jerarquía de unidades',          'units'),
    ('create_unit',                'Crear unidad',                       'units'),
    ('update_unit',                'Modificar unidad',                   'units'),
    ('delete_unit',                'Eliminar unidad',                    'units'),
    # Comandancias
    ('assign_commanders',          'Designar comandantes',               'commanders'),
    ('revoke_commanders',          'Revocar comandantes',                'commanders'),
    # Usuarios
    ('create_users',               'Crear usuarios',                     'users'),
    ('update_users',               'Modificar usuarios',                 'users'),
    ('disable_users',              'Desactivar usuarios',                'users'),
    # Lecciones de tiro
    ('create_shooting_lessons',    'Crear lecciones de tiro',            'shooting'),
    ('update_shooting_lessons',    'Modificar lecciones de tiro',        'shooting'),
    ('delete_shooting_lessons',    'Eliminar lecciones de tiro',         'shooting'),
    ('assign_shooters',            'Asignar tiradores',                  'shooting'),
    ('remove_shooters',            'Retirar tiradores',                  'shooting'),
    ('score_shooters',             'Registrar resultados de tiro',       'shooting'),
    ('validate_scores',            'Validar resultados',                 'shooting'),
    # Almacenes
    ('view_warehouse',             'Ver inventario de almacén',          'warehouse'),
    ('create_warehouse_records',   'Registrar material en almacén',      'warehouse'),
    ('update_warehouse_records',   'Modificar registros de almacén',     'warehouse'),
    ('delete_warehouse_records',   'Eliminar registros de almacén',      'warehouse'),
    ('transfer_warehouse_material','Transferir material entre almacenes','warehouse'),
    ('inventory_warehouse',        'Inventariar almacén',               'warehouse'),
    # Administración
    ('manage_roles',               'Administrar roles',                  'admin'),
    ('manage_permissions',         'Administrar permisos',               'admin'),
    ('view_audit_logs',            'Ver registros de auditoría',         'admin'),
    ('manage_system_settings',     'Configuración del sistema',          'admin'),
    # Recintos militares
    ('view_recinto',               'Ver recintos militares',             'recinto'),
    ('manage_recinto',             'Crear y gestionar recintos',         'recinto'),
    # Ejercicios militares en campo
    ('view_exercises',             'Ver ejercicios militares en campo',  'exercises'),
    ('create_exercises',           'Crear ejercicios militares',         'exercises'),
    ('update_exercises',           'Editar ejercicios militares',        'exercises'),
    ('delete_exercises',           'Eliminar ejercicios militares',      'exercises'),
    ('manage_calibre',             'Gestionar catálogo de calibres',     'exercises'),
]


class Permission(models.Model):
    """Permiso atómico del sistema. El catálogo se gestiona via init_permissions."""

    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['category', 'code']

    def __str__(self):
        return self.code


class Role(models.Model):
    """Rol funcional o técnico del sistema.

    tenant=None  → rol global del sistema (super_admin, tenant_admin, etc.)
                   Los roles globales son compartidos por todos los tenants.
    tenant=X     → rol específico de esa institución (futuro: roles custom).
    is_system    → rol creado por el sistema, no editable desde la UI.
    """

    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='roles',
        null=True,
        blank=True,
        help_text='None = rol global del sistema. Poblado = rol específico del tenant.',
    )
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_system = models.BooleanField(
        default=False,
        help_text='Rol creado por el sistema. No editable desde la UI.',
    )

    class Meta:
        ordering = ['name']
        constraints = [
            # Roles globales: code único sin tenant
            models.UniqueConstraint(
                fields=['code'],
                condition=models.Q(tenant__isnull=True),
                name='unique_role_code_global',
            ),
            # Roles de tenant: code único por tenant
            models.UniqueConstraint(
                fields=['tenant', 'code'],
                condition=models.Q(tenant__isnull=False),
                name='unique_role_code_per_tenant',
            ),
        ]

    def __str__(self):
        return self.name


class ScopePolicy(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name



class RolePermission(models.Model):
    """Liga un Role con un Permission atómico. Reemplaza PermissionRule en FASE 3+.

    Permite consultas tipadas: "¿tiene este role el permiso 'score_shooters'?"
    en vez de "¿tiene el par resource='shooting_result', action='create'?".
    """

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='role_permissions',
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='role_permissions',
    )
    allowed = models.BooleanField(default=True)

    class Meta:
        unique_together = ('role', 'permission')
        ordering = ['role', 'permission']

    def __str__(self):
        verdict = 'ALLOW' if self.allowed else 'DENY'
        return f"[{verdict}] {self.role.code} → {self.permission.code}"


class PositionPermission(models.Model):
    """Permisos adicionales otorgados por un Puesto específico.

    Independiente del Role del puesto. Permite que dos puestos con el mismo
    rol tengan permisos distintos según el contexto operacional.

    Ejemplo: 'oficial_tiro' en la Brigada tiene validate_scores,
    pero el mismo rol en una compañía no.
    """

    position = models.ForeignKey(
        'identity.Position',
        on_delete=models.CASCADE,
        related_name='position_permissions',
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='position_permissions',
    )
    allowed = models.BooleanField(default=True)

    class Meta:
        unique_together = ('position', 'permission')
        ordering = ['position', 'permission']

    def __str__(self):
        verdict = 'ALLOW' if self.allowed else 'DENY'
        return f"[{verdict}] {self.position.code} → {self.permission.code}"


class UserPermissionOverride(models.Model):
    """Sobreescritura individual de permisos para un Account.

    Permite casos puntuales sin tener que crear roles nuevos. Ej: "este
    encargado de almacen tambien puede ver lecciones de la Brigada".

    Precedencia (de mayor a menor) en HasResourcePermission:
      1. Override allowed=False (DENY) -> niega aunque el rol conceda.
      2. Override allowed=True (ALLOW) -> concede aunque el rol no tenga.
      3. Permisos via Role (PermissionRule).
      4. Wildcard '*:*' de roles globales.
      5. MASTER bypass (super_admin).
    """

    account = models.ForeignKey(
        'identity.Account',
        on_delete=models.CASCADE,
        related_name='permission_overrides',
    )
    # FASE 3+: override tipado por Permission atómico (nuevo, nullable durante transición)
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='overrides',
        null=True,
        blank=True,
        help_text='Permiso atómico al que aplica este override. Si está vacío se usa resource:action legacy.',
    )
    # Legacy: se mantiene durante la transición a Permission
    resource = models.CharField(max_length=80, blank=True, help_text='Ej: weapon, shooting_session, *')
    action = models.CharField(max_length=30, blank=True, help_text='Ej: read, create, update, delete, *')
    allowed = models.BooleanField(
        help_text='True=concede, False=niega. DENY tiene precedencia sobre ALLOW.',
    )
    reason = models.TextField(blank=True, help_text='Por que se aplico este override (auditoria).')
    created_by = models.ForeignKey(
        'identity.Account',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_overrides',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['account', 'resource', 'action']
        constraints = [
            # Override legacy: único por (account, resource, action)
            models.UniqueConstraint(
                fields=['account', 'resource', 'action'],
                condition=models.Q(permission__isnull=True),
                name='unique_override_legacy',
            ),
            # Override nuevo: único por (account, permission)
            models.UniqueConstraint(
                fields=['account', 'permission'],
                condition=models.Q(permission__isnull=False),
                name='unique_override_permission',
            ),
        ]

    def __str__(self):
        verdict = 'ALLOW' if self.allowed else 'DENY'
        if self.permission_id:
            return f"override[{verdict}] account={self.account_id} perm={self.permission.code}"
        return f"override[{verdict}] account={self.account_id} {self.resource}:{self.action}"


class AccessAudit(models.Model):
    user_id_value = models.BigIntegerField(null=True, blank=True)
    tenant_code = models.CharField(max_length=50, null=True, blank=True)
    organization_unit_code = models.CharField(max_length=50, null=True, blank=True)
    endpoint = models.CharField(max_length=200)
    action = models.CharField(max_length=50)
    allowed = models.BooleanField(default=False)
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.endpoint} ({'allow' if self.allowed else 'deny'})"
