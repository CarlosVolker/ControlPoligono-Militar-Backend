"""Helpers para tests: construyen el set mínimo de datos para que un escenario
tenga sentido (tenant + unit + roles + account + assignment + memberships).
Crean RolePermission y UnitMembership junto con cada objeto, por lo que los
tests funcionan correctamente con el sistema de permisos actual."""

from apps.armory.models import Armory
from apps.authorization.models import (
    Permission,
    Role,
    RolePermission,
    ScopePolicy,
)
from apps.identity.models import Account, Assignment, Person, Position, UnitMembership
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant
from apipoligono.models import Usuario

# Mapa de equivalencias resource:action → permission_code (importado del módulo real)
from apps.authorization.permissions import RESOURCE_ACTION_TO_PERMISSION


def make_tenant(code='test', name='Test Tenant'):
    return Tenant.objects.create(code=code, name=name, context='military')


def make_unit(tenant, code='UNIT-1', name='Unidad 1', parent=None, unit_type='battalion'):
    return OrganizationUnit.objects.create(
        tenant=tenant, code=code, name=name, parent=parent,
        unit_type=unit_type, is_active=True,
    )


def make_armory(tenant, unit, code=None, name=None):
    return Armory.objects.create(
        tenant=tenant,
        organization_unit=unit,
        code=code or f"ALM-{unit.code}",
        name=name or f"Almacen {unit.name}",
        is_active=True,
    )


def make_role(code='tirador', name=None, perms=None):
    """Crea o reusa un Role con sus RolePermissions.

    `perms` es una lista de tuplas (resource, action, allowed).
    Usa el mapa RESOURCE_ACTION_TO_PERMISSION para crear RolePermissions tipadas.
    """
    role, _ = Role.objects.update_or_create(
        code=code, defaults={'name': name or code.title(), 'is_active': True},
    )
    if perms:
        for resource, action, allowed in perms:
            if resource == '*' and action == '*':
                for perm in Permission.objects.filter(is_active=True):
                    RolePermission.objects.get_or_create(
                        role=role, permission=perm,
                        defaults={'allowed': allowed},
                    )
            else:
                perm_code = RESOURCE_ACTION_TO_PERMISSION.get((resource, action))
                if perm_code:
                    perm_obj = Permission.objects.filter(code=perm_code).first()
                    if perm_obj:
                        RolePermission.objects.get_or_create(
                            role=role, permission=perm_obj,
                            defaults={'allowed': allowed},
                        )
    return role


def make_scope(code='solo_propio', name=None):
    scope, _ = ScopePolicy.objects.update_or_create(
        code=code, defaults={'name': name or code},
    )
    return scope


def make_position(tenant, unit, role, scope=None, code=None, name=None, **kwargs):
    return Position.objects.create(
        tenant=tenant,
        organization_unit=unit,
        role=role,
        scope_policy=scope,
        code=code or f"{role.code}-{unit.code}",
        name=name or f"{role.name} {unit.name}",
        is_active=True,
        **kwargs,
    )


def make_user_account(tenant, rut='12345678-9', password='pass1234', nombre='User'):
    """Crea Usuario + Person + Account ligados al tenant. Sin assignment."""
    user = Usuario.objects.create_user(
        username=rut, password=password, rut=rut,
        nombre=nombre, apellido_paterno='Test', apellido_materno='',
    )
    person = Person.objects.create(document_id=rut, full_name=f'Test {nombre}', is_active=True)
    account = Account.objects.create(user=user, person=person, tenant=tenant, is_active=True)
    return user, account


def assign_position(account, position, is_primary=True):
    """Crea un Assignment activo enlazando account ↔ position.
    También crea UnitMembership para que el scope v2 funcione correctamente.
    """
    if is_primary:
        account.assignments.filter(is_active=True, is_primary=True).update(is_primary=False)

    assignment = Assignment.objects.create(
        account=account,
        position=position,
        is_primary=is_primary,
        is_active=True,
    )

    # Crear UnitMembership para que el modo v2 (AUTHZ_USE_UNIT_MEMBERSHIP=True) funcione.
    if position.organization_unit:
        if is_primary:
            UnitMembership.objects.filter(
                account=account, is_active=True, is_primary=True,
            ).update(is_primary=False)

        UnitMembership.objects.get_or_create(
            account=account,
            unit=position.organization_unit,
            defaults={
                'tenant': account.tenant,
                'is_primary': is_primary,
                'is_active': True,
            },
        )

    return assignment
