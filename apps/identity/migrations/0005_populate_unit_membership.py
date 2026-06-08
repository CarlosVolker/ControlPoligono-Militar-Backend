"""
Data migration: pobla UnitMembership desde Assignments activos con unidad válida.

Lógica:
  - Itera Assignments activos que tienen una unidad efectiva (via Position o legacy).
  - Por cada (account, unit) único, crea una UnitMembership.
  - El is_primary de la membresía sigue al is_primary del Assignment.
  - Si hay múltiples assignments con is_primary=True para la misma account
    (datos inconsistentes), solo el primero en orden de creación queda como primario.
"""
from django.db import migrations
from django.utils import timezone


def populate_memberships(apps, schema_editor):
    Assignment = apps.get_model('identity', 'Assignment')
    UnitMembership = apps.get_model('identity', 'UnitMembership')

    seen_primary = set()   # account_ids que ya tienen una membresía primaria

    # Primero: assignments con Position (fuente de verdad nueva)
    qs_with_position = (
        Assignment.objects
        .filter(is_active=True, position__isnull=False)
        .select_related('position__organization_unit', 'account__tenant')
        .order_by('account_id', '-is_primary', 'id')
    )
    for a in qs_with_position:
        unit = a.position.organization_unit
        if unit is None:
            continue
        account = a.account
        key = (account.id, unit.id)

        # Determinar si puede ser primario
        can_be_primary = a.is_primary and account.id not in seen_primary

        UnitMembership.objects.get_or_create(
            account=account,
            unit=unit,
            defaults={
                'tenant': account.tenant,
                'is_primary': can_be_primary,
                'is_active': True,
                'starts_at': a.starts_at,
            },
        )
        if can_be_primary:
            seen_primary.add(account.id)

    # Luego: assignments legacy (sin Position) con organization_unit
    qs_legacy = (
        Assignment.objects
        .filter(is_active=True, position__isnull=True, organization_unit__isnull=False)
        .select_related('organization_unit', 'account__tenant')
        .order_by('account_id', '-is_primary', 'id')
    )
    for a in qs_legacy:
        unit = a.organization_unit
        account = a.account
        key = (account.id, unit.id)

        can_be_primary = a.is_primary and account.id not in seen_primary

        UnitMembership.objects.get_or_create(
            account=account,
            unit=unit,
            defaults={
                'tenant': account.tenant,
                'is_primary': can_be_primary,
                'is_active': True,
                'starts_at': a.starts_at,
            },
        )
        if can_be_primary:
            seen_primary.add(account.id)


def depopulate_memberships(apps, schema_editor):
    UnitMembership = apps.get_model('identity', 'UnitMembership')
    UnitMembership.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('identity', '0004_unit_membership'),
    ]

    operations = [
        migrations.RunPython(populate_memberships, reverse_code=depopulate_memberships),
    ]
