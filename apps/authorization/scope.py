"""
Resolución de scope (alcance) y unidades permitidas para un Account.

Soporta dos modos controlados por AUTHZ_USE_UNIT_MEMBERSHIP:

  False (default, legacy):
    La unidad base viene de Assignment.effective_unit. El scope viene de
    Assignment.effective_scope. Pipeline original.

  True (FASE 4+):
    La unidad base viene de UnitMembership primaria. El tipo de scope
    (árbol vs solo unidad) sigue viniendo del Assignment primario.
    UnitMembership modela dónde PERTENECE el usuario orgánicamente.
    Assignment modela qué ROL tiene y con qué alcance.
"""
from django.conf import settings

from apps.identity.models import Assignment
from apps.organizations.models import OrganizationUnit


# Códigos de scope que significan "esta unidad + sus descendientes".
TREE_SCOPE_CODES = {
    "own_unit_descendants", "aggregate_only",        # legacy
    "unidad_y_descendientes", "solo_agregado",       # actuales
}

RECINTO_SCOPE_CODE = "todo_recinto"

# Códigos de scope que dan acceso al detalle individual.
DETAIL_SCOPE_CODES = {
    "detail_read", "own_unit", "own_unit_descendants", "self_only",  # legacy
    "solo_propio", "unidad_propia", "unidad_y_descendientes",        # actuales
}

# Códigos de rol con acceso global (sin filtrar por unidad).
GLOBAL_ROLE_CODES = ("tenant_admin", "super_admin")


def _descendant_ids(root_ids):
    """Walk descendente de OrganizationUnit, retorna set de ids incluyendo raíces."""
    all_ids = set(root_ids)
    pending = set(root_ids)
    while pending:
        children = OrganizationUnit.objects.filter(
            parent_id__in=pending
        ).values_list("id", flat=True)
        child_set = set(children) - all_ids
        if not child_set:
            break
        all_ids.update(child_set)
        pending = child_set
    return all_ids


def eligible_target_units(person_unit, max_levels=2):
    """Unidad personal + hasta `max_levels` ancestros. Para asignar roles funcionales."""
    if person_unit is None:
        return []
    result = [person_unit]
    current = person_unit
    for _ in range(max_levels):
        if current.parent_id is None:
            break
        current = current.parent
        if current is None or not current.is_active:
            break
        result.append(current)
    return result


def _assignments_qs(account):
    """Assignments activos con relations precargadas."""
    return Assignment.objects.filter(
        account=account, is_active=True
    ).select_related(
        "position__role", "position__scope_policy", "position__organization_unit",
    )


def is_global_admin(account):
    """True si el account tiene al menos un Assignment activo con rol global."""
    if account is None:
        return False
    for a in _assignments_qs(account):
        role = a.effective_role
        if role and role.code in GLOBAL_ROLE_CODES:
            return True
    return False


# ---------------------------------------------------------------------------
# get_allowed_unit_ids — dual-path
# ---------------------------------------------------------------------------

def _get_allowed_unit_ids_legacy(account):
    """Modo legacy: la unidad base viene del Assignment efectivo."""
    assignments = list(_assignments_qs(account))

    for a in assignments:
        role = a.effective_role
        if role and role.code in GLOBAL_ROLE_CODES:
            return None

    own_units = set()
    descendant_units = set()
    for a in assignments:
        unit = a.effective_unit
        if unit is None:
            continue
        scope = a.effective_scope
        scope_code = scope.code if scope else "unidad_propia"
        if scope_code in TREE_SCOPE_CODES:
            descendant_units.add(unit.id)
        else:
            own_units.add(unit.id)

    allowed = set(own_units)
    if descendant_units:
        allowed.update(_descendant_ids(descendant_units))
    return allowed


def _get_allowed_unit_ids_v2(account):
    """Modo v2: la unidad base viene de UnitMembership primaria.
    El tipo de scope sigue viniendo del Assignment primario.

    Caso especial todo_recinto: si el puesto tiene un Recinto asignado,
    devuelve todas las unidades del recinto (independiente del árbol jerárquico).
    """
    # Admin global: sin restricción de unidad.
    if is_global_admin(account):
        return None

    from apps.identity.models import UnitMembership
    primary_membership = (
        UnitMembership.objects.filter(account=account, is_primary=True, is_active=True)
        .select_related('unit')
        .first()
    )
    if primary_membership is None:
        return set()

    unit = primary_membership.unit

    primary_assignment = (
        Assignment.objects.filter(account=account, is_primary=True, is_active=True)
        .select_related('position__scope_policy', 'position__recinto')
        .first()
    )
    scope = primary_assignment.effective_scope if primary_assignment else None
    scope_code = scope.code if scope else "unidad_propia"

    # Caso especial: scope por recinto completo
    if scope_code == RECINTO_SCOPE_CODE:
        position = primary_assignment.position if primary_assignment else None
        if position and position.recinto_id:
            return set(position.recinto.units.values_list('id', flat=True))
        # Si el scope es todo_recinto pero no hay recinto asignado, solo la unidad propia
        return {unit.id}

    if scope_code in TREE_SCOPE_CODES:
        return _descendant_ids({unit.id})
    return {unit.id}


def get_allowed_unit_ids(account):
    """Set de OrganizationUnit ids visibles para el account según sus membresías y scopes.

    - None:    acceso global (admin sin restricción por unidad).
    - set vacío: sin acceso.
    - set ids: unidades permitidas.

    El path depende del feature flag AUTHZ_USE_UNIT_MEMBERSHIP.
    """
    if account is None:
        return set()

    if getattr(settings, 'AUTHZ_USE_UNIT_MEMBERSHIP', False):
        return _get_allowed_unit_ids_v2(account)
    return _get_allowed_unit_ids_legacy(account)


def get_scope_codes(account):
    """Set de codes de scope activos del account (via Position o legacy)."""
    if account is None:
        return set()
    codes = set()
    for a in _assignments_qs(account):
        scope = a.effective_scope
        if scope:
            codes.add(scope.code)
    return codes


def can_read_detail(account):
    """True si el account puede leer detalle individual (no solo agregados)."""
    if account is None:
        return False
    if is_global_admin(account):
        return True
    return bool(get_scope_codes(account).intersection(DETAIL_SCOPE_CODES))


# ---------------------------------------------------------------------------
# get_primary_unit — helper para derivar la unidad contextual del account
# ---------------------------------------------------------------------------

def get_primary_unit(account):
    """Devuelve la unidad principal del account según el modo activo.

    Modo v2: lee UnitMembership primaria.
    Modo legacy: lee el effective_unit del Assignment primario.
    """
    if account is None:
        return None

    if getattr(settings, 'AUTHZ_USE_UNIT_MEMBERSHIP', False):
        from apps.identity.models import UnitMembership
        membership = (
            UnitMembership.objects.filter(account=account, is_primary=True, is_active=True)
            .select_related('unit')
            .first()
        )
        return membership.unit if membership else None

    assignment = (
        Assignment.objects.filter(account=account, is_primary=True, is_active=True)
        .select_related('position__organization_unit')
        .first()
    )
    return assignment.effective_unit if assignment else None
