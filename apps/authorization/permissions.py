"""
Permission classes para DRF.

`HasResourcePermission` evalúa permisos usando RolePermission / PositionPermission
(catálogo tipado). Pipeline:

  1. MASTER bypass (super_admin → ALLOW todo)
  2. Override DENY  → DENY
  3. Override ALLOW → ALLOW
  4. PositionPermission directa del puesto → ALLOW
  5. RolePermission del rol del puesto → ALLOW
  6. Sin match → DENY
"""
from django.conf import settings
from rest_framework.permissions import BasePermission

from apps.authorization.models import (
    Permission,
    PositionPermission,
    RolePermission,
    UserPermissionOverride,
)
from apps.identity.models import Account


HTTP_METHOD_TO_ACTION = {
    "GET":    "read",
    "POST":   "create",
    "PUT":    "update",
    "PATCH":  "update",
    "DELETE": "delete",
}

# Mapa resource:action → permission_code (fuente de verdad para el mapping).
# Exportado para usarse en la data migration y en tests.
RESOURCE_ACTION_TO_PERMISSION = {
    ('user', 'create'):               'create_users',
    ('user', 'read'):                 'view_personnel_basic',
    ('user', 'update'):               'update_users',
    ('user', 'delete'):               'disable_users',
    ('user', 'read_own'):             'view_self',
    ('organization_unit', 'read'):    'view_unit',
    ('organization_unit', 'create'):  'create_unit',
    ('organization_unit', 'update'):  'update_unit',
    ('organization_unit', 'delete'):  'delete_unit',
    ('weapon', 'read'):               'view_warehouse',
    ('weapon', 'create'):             'create_warehouse_records',
    ('weapon', 'update'):             'update_warehouse_records',
    ('weapon', 'delete'):             'delete_warehouse_records',
    ('armory', 'read'):               'view_warehouse',
    ('armory', 'create'):             'create_warehouse_records',
    ('armory', 'update'):             'update_warehouse_records',
    ('armory', 'delete'):             'delete_warehouse_records',
    ('range', 'read'):                'view_unit',
    ('range', 'create'):              'create_shooting_lessons',
    ('range', 'update'):              'update_shooting_lessons',
    ('shooting_session', 'create'):        'create_shooting_lessons',
    ('shooting_session', 'read'):          'view_unit',
    ('shooting_session', 'read_summary'):  'view_unit',
    ('shooting_session', 'update'):        'update_shooting_lessons',
    ('shooting_session', 'delete'):        'delete_shooting_lessons',
    ('shooting_fraction', 'create'):  'create_shooting_lessons',
    ('shooting_fraction', 'read'):    'view_unit',
    ('shooting_fraction', 'update'):  'update_shooting_lessons',
    ('shooting_fraction', 'delete'):  'delete_shooting_lessons',
    ('shooting_result', 'create'):    'score_shooters',
    ('shooting_result', 'read'):      'view_personnel_basic',
    ('shooting_result', 'read_own'):  'view_self',
    ('shooting_result', 'update'):    'score_shooters',
    ('shooting_result', 'delete'):    'score_shooters',
    ('shooting_result', 'read_summary'): 'view_unit',
    ('shooting_result', 'export'):    'view_personnel_full',
    ('position', 'read'):             'view_unit',
    ('position', 'create'):           'assign_positions',
    ('position', 'update'):           'assign_positions',
    ('position', 'delete'):           'revoke_positions',
    ('recinto', 'read'):              'view_recinto',
    ('recinto', 'create'):            'manage_recinto',
    ('recinto', 'update'):            'manage_recinto',
    ('recinto', 'delete'):            'manage_recinto',
    ('ejercicio_militar', 'read'):    'view_exercises',
    ('ejercicio_militar', 'create'):  'create_exercises',
    ('ejercicio_militar', 'update'):  'update_exercises',
    ('ejercicio_militar', 'delete'):  'delete_exercises',
    ('consumo_municion',  'read'):    'view_exercises',
    ('consumo_municion',  'create'):  'create_exercises',
    ('consumo_municion',  'update'):  'update_exercises',
    ('consumo_municion',  'delete'):  'delete_exercises',
    ('consumo_arma',      'read'):    'view_exercises',
    ('consumo_arma',      'create'):  'create_exercises',
    ('consumo_arma',      'update'):  'update_exercises',
    ('consumo_arma',      'delete'):  'delete_exercises',
    ('calibre',           'read'):    'view_exercises',
    ('calibre',           'manage'):  'manage_calibre',
}


def _resolve_action(view, request):
    """Determina el `action` que el request está ejecutando."""
    action = HTTP_METHOD_TO_ACTION.get(request.method, request.method.lower())
    if hasattr(view, "action") and view.action:
        overrides = getattr(view, "action_permission_map", {})
        action = overrides.get(view.action, action)
    return action


# ---------------------------------------------------------------------------
# MASTER bypass — igual en v1 y v2
# ---------------------------------------------------------------------------

def _has_master_bypass(account):
    """True si el account es super_admin. MASTER ignora todo: overrides, roles."""
    if account is None:
        return False
    return account.assignments.filter(
        is_active=True, position__role__code='super_admin',
    ).exists()


# ---------------------------------------------------------------------------
# Pipeline v2 (nuevo, RolePermission / PositionPermission)
# ---------------------------------------------------------------------------

def _override_verdict_v2(account, permission_code):
    """DENY=False, ALLOW=True, sin override=None. Modo v2.

    Busca overrides por FK a Permission (nuevo) y por legacy resource:action.
    """
    if account is None:
        return None

    # Override tipado por Permission FK
    deny = UserPermissionOverride.objects.filter(
        account=account, allowed=False, permission__code=permission_code,
    ).exists()
    if deny:
        return False
    allow = UserPermissionOverride.objects.filter(
        account=account, allowed=True, permission__code=permission_code,
    ).exists()
    if allow:
        return True

    # Fallback: override legacy resource:action (durante transición)
    # Busca si algún par (resource, action) que mapee a este permission_code
    # tiene un override activo.
    legacy_pairs = [
        (res, act)
        for (res, act), code in RESOURCE_ACTION_TO_PERMISSION.items()
        if code == permission_code
    ]
    if legacy_pairs:
        resources = list({r for r, _ in legacy_pairs})
        actions = list({a for _, a in legacy_pairs})
        deny_legacy = UserPermissionOverride.objects.filter(
            account=account, allowed=False, permission__isnull=True,
            resource__in=resources + ['*'],
            action__in=actions + ['*'],
        ).exists()
        if deny_legacy:
            return False
        allow_legacy = UserPermissionOverride.objects.filter(
            account=account, allowed=True, permission__isnull=True,
            resource__in=resources + ['*'],
            action__in=actions + ['*'],
        ).exists()
        if allow_legacy:
            return True

    return None


def _has_permission_v2(account, permission_code):
    """True si el account tiene el permission_code via RolePermission o PositionPermission."""
    if account is None:
        return False

    assignments = account.assignments.filter(is_active=True).select_related(
        'position__role', 'position',
    )

    for assignment in assignments:
        # 1. PositionPermission directa (permisos extra del puesto específico)
        if assignment.position_id:
            pos_has = PositionPermission.objects.filter(
                position=assignment.position,
                permission__code=permission_code,
                allowed=True,
            ).exists()
            if pos_has:
                return True

        # 2. RolePermission del role efectivo del assignment
        eff_role = assignment.effective_role
        if eff_role:
            role_has = RolePermission.objects.filter(
                role=eff_role,
                permission__code=permission_code,
                allowed=True,
            ).exists()
            if role_has:
                return True

    return False


def get_effective_permission_codes(account):
    """Retorna el set de permission_codes que el account tiene activos.
    Usado por AuthContextView para emitir el array `permissions` al frontend.
    """
    if account is None:
        return set()

    if _has_master_bypass(account):
        return set(Permission.objects.filter(is_active=True).values_list('code', flat=True))

    assignments = account.assignments.filter(is_active=True).select_related(
        'position__role', 'position',
    )
    codes = set()
    for a in assignments:
        if a.position_id:
            codes.update(
                PositionPermission.objects.filter(
                    position=a.position, allowed=True,
                ).values_list('permission__code', flat=True)
            )
        eff_role = a.effective_role
        if eff_role:
            codes.update(
                RolePermission.objects.filter(
                    role=eff_role, allowed=True,
                ).values_list('permission__code', flat=True)
            )
    return codes


# ---------------------------------------------------------------------------
# Clases de permiso DRF
# ---------------------------------------------------------------------------

class HasTenantAccess(BasePermission):
    """El user debe tener una Account activa en el tenant del request."""
    message = "No tiene acceso al tenant solicitado."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return False
        account = Account.objects.filter(
            user=request.user, tenant=tenant, is_active=True,
        ).first()
        if account is None:
            return False
        request.identity_account = account
        return True


class HasResourcePermission(BasePermission):
    """Valida (resource, action) con la precedencia documentada arriba."""

    message = "No tiene permisos para ejecutar esta accion."

    def has_permission(self, request, view):
        account = getattr(request, "identity_account", None)
        if account is None:
            return False

        if _has_master_bypass(account):
            return True

        resource = getattr(view, "resource_name", None)
        if not resource:
            return True
        action = _resolve_action(view, request)

        permission_code = RESOURCE_ACTION_TO_PERMISSION.get((resource, action))
        if permission_code is None:
            return False

        verdict = _override_verdict_v2(account, permission_code)
        if verdict is False:
            return False
        if verdict is True:
            return True

        return _has_permission_v2(account, permission_code)


class IsTenantAdmin(BasePermission):
    """Solo tenant_admin o super_admin."""
    message = "Solo tenant_admin puede gestionar esta accion."

    def has_permission(self, request, view):
        account = getattr(request, "identity_account", None)
        if account is None:
            return False
        return account.assignments.filter(
            is_active=True,
            position__role__code__in=('tenant_admin', 'super_admin'),
        ).exists()
