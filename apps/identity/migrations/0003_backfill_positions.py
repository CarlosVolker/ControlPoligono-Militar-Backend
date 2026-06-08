"""
Data migration: por cada combinacion unica de (tenant, role, scope, unit) que
aparezca en los Assignments existentes, crear una Position que represente esa
"silla" y enlazar todos los Assignments correspondientes a esa Position.

Esto preserva el historico: los Assignments quedan tal cual (solo se les
agrega position_id). Los campos legacy role/scope/unit en Assignment se
mantienen poblados para que el sistema siga funcionando durante la
transicion; se borraran en una migracion posterior (0004) cuando todo el
codigo lea via Position.
"""
from django.db import migrations


def backfill_positions(apps, schema_editor):
    Position = apps.get_model('identity', 'Position')
    Assignment = apps.get_model('identity', 'Assignment')

    cache = {}  # (tenant_id, role_id, scope_id_or_none, unit_id_or_none) -> Position

    for assignment in Assignment.objects.select_related(
        'account__tenant', 'role', 'scope_policy', 'organization_unit'
    ).filter(role__isnull=False):
        tenant = assignment.account.tenant
        role = assignment.role
        scope = assignment.scope_policy
        unit = assignment.organization_unit

        # Necesitamos una unidad para Position.organization_unit (es NOT NULL).
        # Si el assignment no tiene unidad (caso super_admin sin unit), saltamos:
        # ese tipo de asignacion se rehara como Position especial via
        # seed_positions o crear_master.
        if unit is None:
            continue

        key = (
            tenant.id,
            role.id,
            scope.id if scope else None,
            unit.id,
        )
        if key not in cache:
            scope_suffix = f"-{scope.code}" if scope else ""
            code = f"{role.code}-{unit.code}{scope_suffix}"[:80]
            name = f"{role.name} de {unit.name}"[:200]
            position, _ = Position.objects.get_or_create(
                tenant=tenant,
                code=code,
                defaults={
                    'name': name,
                    'organization_unit': unit,
                    'role': role,
                    'scope_policy': scope,
                    'description': 'Generado automaticamente desde Assignment legacy.',
                    'is_active': True,
                    'is_unique_holder': False,  # legacy permitia varios holders por unidad
                },
            )
            cache[key] = position

        assignment.position = cache[key]
        assignment.save(update_fields=['position'])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('identity', '0002_position_and_holder'),
        ('armory', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(backfill_positions, noop_reverse),
    ]
