"""
seed_positions: crea puestos estandar (Positions) por cada unidad y armoria
del tenant indicado. Idempotente: usa update_or_create por (tenant, code).

Puestos creados por unidad activa:
  - CMTE-{unit.code}         Comandante (role=comandante_unidad)
  - S-3-{unit.code}          Oficial de Tiro (role=oficial_tiro)
  - E-3-{unit.code}          Oficial Observador (role=oficial_observador)
  - SICE-{unit.code}         Administrador SICE (role=admin_unidad)

Puestos creados por cada armoria activa:
  - ENC-{armory.code}        Encargado de Almacen (role=encargado_almacen)
"""
from django.core.management.base import BaseCommand

from apps.armory.models import Armory
from apps.authorization.models import Role, ScopePolicy
from apps.identity.models import Position
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant


UNIT_POSITIONS = [
    ('CMTE', 'comandante_unidad', 'unidad_y_descendientes', 'Comandante'),
    ('S-3', 'oficial_tiro', 'unidad_y_descendientes', 'Oficial de Tiro (S-3)'),
    ('E-3', 'oficial_observador', 'unidad_y_descendientes', 'Oficial Observador (E-3)'),
    ('SICE', 'admin_unidad', 'unidad_y_descendientes', 'Administrador SICE'),
]


class Command(BaseCommand):
    help = 'Crea puestos estandar (Positions) por unidad y armoria.'

    def add_arguments(self, parser):
        parser.add_argument('--tenant-code', required=True)

    def handle(self, *args, **options):
        tenant_code = options['tenant_code']
        tenant = Tenant.objects.filter(code=tenant_code).first()
        if tenant is None:
            self.stderr.write(self.style.ERROR(f"Tenant '{tenant_code}' no encontrado."))
            return

        roles = {r.code: r for r in Role.objects.all()}
        scopes = {s.code: s for s in ScopePolicy.objects.all()}

        created = 0
        skipped = 0

        # Puestos por unidad.
        for unit in OrganizationUnit.objects.filter(tenant=tenant, is_active=True):
            for prefix, role_code, scope_code, label in UNIT_POSITIONS:
                role = roles.get(role_code)
                if role is None:
                    self.stdout.write(self.style.WARNING(f"  Role '{role_code}' no existe, salto."))
                    continue
                code = f"{prefix}-{unit.code}"[:80]
                _, was_created = Position.objects.update_or_create(
                    tenant=tenant,
                    code=code,
                    defaults={
                        'name': f"{label} {unit.name}"[:200],
                        'organization_unit': unit,
                        'role': role,
                        'scope_policy': scopes.get(scope_code),
                        'is_active': True,
                        'is_unique_holder': role_code == 'comandante_unidad',
                    },
                )
                if was_created:
                    created += 1
                else:
                    skipped += 1

        # Puestos de almacen.
        encargado_role = roles.get('encargado_almacen')
        if encargado_role is None:
            self.stdout.write(self.style.WARNING("Role 'encargado_almacen' no existe, salto puestos de armoria."))
        else:
            for armory in Armory.objects.filter(tenant=tenant, is_active=True).select_related('organization_unit'):
                code = f"ENC-{armory.code}"[:80]
                _, was_created = Position.objects.update_or_create(
                    tenant=tenant,
                    code=code,
                    defaults={
                        'name': f"Encargado {armory.name}"[:200],
                        'organization_unit': armory.organization_unit,
                        'armory': armory,
                        'role': encargado_role,
                        'scope_policy': scopes.get('unidad_propia'),
                        'is_active': True,
                        'is_unique_holder': True,
                    },
                )
                if was_created:
                    created += 1
                else:
                    skipped += 1

        self.stdout.write(self.style.SUCCESS(f"Puestos creados: {created}. Existentes (sin cambios estructurales): {skipped}."))
