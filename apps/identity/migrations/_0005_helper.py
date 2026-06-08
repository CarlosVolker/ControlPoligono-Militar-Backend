"""Helper reutilizable de la data migration 0005.
Expuesto para que los tests puedan invocar la misma lógica sin correr la migración.
"""
from apps.identity.models import UnitMembership


def populate_from_assignments(account):
    """Crea UnitMembership para un account dado, basándose en sus Assignments activos."""
    seen_primary = False

    qs = (
        account.assignments
        .filter(is_active=True)
        .select_related('position__organization_unit')
        .order_by('-is_primary', 'id')
    )
    for a in qs:
        unit = a.effective_unit
        if unit is None:
            continue
        can_be_primary = a.is_primary and not seen_primary
        _, created = UnitMembership.objects.get_or_create(
            account=account,
            unit=unit,
            defaults={
                'tenant': account.tenant,
                'is_primary': can_be_primary,
                'is_active': True,
                'starts_at': a.starts_at,
            },
        )
        if created and can_be_primary:
            seen_primary = True
