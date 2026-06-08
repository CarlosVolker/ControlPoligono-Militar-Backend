"""
Tests de FASE 3: pipeline de permisos v2 (RolePermission/PositionPermission).
Cada test corre con AUTHZ_USE_PERMISSION_MODEL=True.
El mismo conjunto de reglas de precedencia debe producir los mismos resultados
que en v1.
"""
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.authorization.models import (
    Permission,
    PositionPermission,
    Role,
    RolePermission,
    ScopePolicy,
    UserPermissionOverride,
)
from apps.authorization.permissions import (
    RESOURCE_ACTION_TO_PERMISSION,
    get_effective_permission_codes,
)
from apps.identity.models import Account, Assignment, Person, Position
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant
from apipoligono.models import Usuario


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_env():
    tenant = Tenant.objects.create(code='perm-v2', name='Perm V2', context='military')
    unit = OrganizationUnit.objects.create(
        tenant=tenant, code='UNIT-V2', name='Unidad V2', unit_type='company',
    )
    return tenant, unit


def _make_user(rut='10000000-1'):
    user = Usuario.objects.create_user(
        username=rut, password='Test1234!', rut=rut,
        nombre='Test', apellido_paterno='V2',
    )
    person = Person.objects.create(document_id=rut, full_name='Test V2', is_active=True)
    return user, person


def _make_account(user, person, tenant):
    return Account.objects.create(user=user, person=person, tenant=tenant, is_active=True)


def _make_role_with_permission(role_code, permission_code):
    role, _ = Role.objects.get_or_create(code=role_code, defaults={'name': role_code})
    perm = Permission.objects.get(code=permission_code)
    RolePermission.objects.get_or_create(role=role, permission=perm, defaults={'allowed': True})
    return role


def _make_assignment(account, unit, role, scope_code='solo_propio_v2test'):
    from apps.identity.models import Position, UnitMembership
    scope, _ = ScopePolicy.objects.get_or_create(
        code=scope_code, defaults={'name': scope_code},
    )
    pos_code = f"{role.code}-{unit.code}-v2test"[:80]
    pos, _ = Position.objects.get_or_create(
        tenant=account.tenant, code=pos_code,
        defaults={'name': pos_code, 'organization_unit': unit, 'role': role, 'scope_policy': scope, 'is_active': True},
    )
    account.assignments.filter(is_active=True, is_primary=True).update(is_primary=False)
    a = Assignment.objects.create(account=account, position=pos, is_primary=True, is_active=True)
    UnitMembership.objects.get_or_create(
        account=account, unit=unit,
        defaults={'tenant': account.tenant, 'is_primary': True, 'is_active': True},
    )
    return a


# ---------------------------------------------------------------------------
# Test: mapa resource:action → permission_code está completo
# ---------------------------------------------------------------------------

class MappingCompletenessTest(TestCase):
    """Todos los pares resource:action del sistema tienen un permission_code."""

    def test_all_permission_codes_exist_in_catalog(self):
        existing = set(Permission.objects.values_list('code', flat=True))
        for (resource, action), code in RESOURCE_ACTION_TO_PERMISSION.items():
            self.assertIn(
                code, existing,
                msg=f"permission_code '{code}' para ({resource}:{action}) no existe en el catálogo.",
            )


# ---------------------------------------------------------------------------
# Test: precedencia en v2 (con flag activado)
# ---------------------------------------------------------------------------

@override_settings(AUTHZ_USE_PERMISSION_MODEL=True)
class TestPrecedenceV2(TestCase):
    """Mismas reglas de precedencia que v1, pero usando RolePermission."""

    def setUp(self):
        self.tenant, self.unit = _make_env()
        self.user, self.person = _make_user('20000000-2')
        self.account = _make_account(self.user, self.person, self.tenant)
        # Rol con permiso view_unit
        self.role = _make_role_with_permission('view_unit_role', 'view_unit')
        _make_assignment(self.account, self.unit, self.role)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.client.credentials(HTTP_X_TENANT_CODE=self.tenant.code)

    def test_role_permission_grants_access(self):
        response = self.client.get('/api/organization-units/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_role_without_permission_denies(self):
        role_no_perm, _ = Role.objects.get_or_create(
            code='no_perm_role', defaults={'name': 'No perm'},
        )
        user2, person2 = _make_user('20000000-3')
        account2 = _make_account(user2, person2, self.tenant)
        _make_assignment(account2, self.unit, role_no_perm)
        self.client.force_authenticate(user=user2)
        response = self.client.get('/api/organization-units/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_override_deny_beats_role_permission(self):
        perm = Permission.objects.get(code='view_unit')
        UserPermissionOverride.objects.create(
            account=self.account, permission=perm,
            allowed=False, reason='test deny',
        )
        response = self.client.get('/api/organization-units/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_override_allow_grants_perm_role_doesnt_have(self):
        """Override ALLOW concede un permiso que el rol no tiene — verificado directamente."""
        from apps.authorization.permissions import _override_verdict_v2, _has_permission_v2

        # El rol solo tiene view_unit, NO tiene create_unit.
        self.assertFalse(_has_permission_v2(self.account, 'create_unit'))

        # Crear override ALLOW para create_unit
        perm = Permission.objects.get(code='create_unit')
        UserPermissionOverride.objects.create(
            account=self.account, permission=perm,
            allowed=True, reason='test allow',
        )
        # El override debe devolver True para create_unit
        verdict = _override_verdict_v2(self.account, 'create_unit')
        self.assertEqual(verdict, True)

        # Y sigue devolviendo None para un permiso sin override
        verdict_none = _override_verdict_v2(self.account, 'manage_roles')
        self.assertIsNone(verdict_none)

    def test_position_permission_grants_extra_perm(self):
        """PositionPermission da permiso adicional más allá del Role."""
        # Crear un puesto sin permiso create_unit en su rol
        role_base, _ = Role.objects.get_or_create(
            code='base_role_v2', defaults={'name': 'Base Role V2'},
        )
        scope = ScopePolicy.objects.get_or_create(
            code='desc_v2', defaults={'name': 'Desc V2'},
        )[0]
        position = Position.objects.create(
            tenant=self.tenant, code='POS-V2', name='Puesto V2',
            organization_unit=self.unit, role=role_base, scope_policy=scope,
        )
        # Crear usuario con ese puesto
        user3, person3 = _make_user('20000000-4')
        account3 = _make_account(user3, person3, self.tenant)
        Assignment.objects.create(
            account=account3, position=position,
            is_primary=True, is_active=True,
        )
        # Agregar PositionPermission directa
        perm = Permission.objects.get(code='view_unit')
        PositionPermission.objects.create(
            position=position, permission=perm, allowed=True,
        )
        self.client.force_authenticate(user=user3)
        response = self.client.get('/api/organization-units/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Test: MASTER bypass en v2
# ---------------------------------------------------------------------------

@override_settings(AUTHZ_USE_PERMISSION_MODEL=True)
class TestMasterBypassV2(TestCase):

    def setUp(self):
        self.tenant, self.unit = _make_env()
        self.tenant.code = 'master-v2'
        self.tenant.save()
        self.user, self.person = _make_user('20000000-5')
        self.account = _make_account(self.user, self.person, self.tenant)
        # Crear rol super_admin con assignment
        role_sa, _ = Role.objects.get_or_create(
            code='super_admin', defaults={'name': 'Super Admin'},
        )
        scope, _ = ScopePolicy.objects.get_or_create(
            code='solo_propio_master_v2', defaults={'name': 'Solo Propio Master V2'},
        )
        from apps.identity.models import Position, UnitMembership
        sa_pos, _ = Position.objects.get_or_create(
            tenant=self.tenant, code='MASTER-V2-BYPASS',
            defaults={'name': 'Master V2', 'organization_unit': self.unit, 'role': role_sa, 'scope_policy': scope, 'is_active': True},
        )
        Assignment.objects.create(
            account=self.account, position=sa_pos, is_primary=True, is_active=True,
        )
        UnitMembership.objects.get_or_create(
            account=self.account, unit=self.unit,
            defaults={'tenant': self.tenant, 'is_primary': True, 'is_active': True},
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.client.credentials(HTTP_X_TENANT_CODE=self.tenant.code)

    def test_master_bypasses_all_in_v2(self):
        response = self.client.get('/api/armas/')
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_master_bypasses_deny_override_in_v2(self):
        perm = Permission.objects.get(code='view_warehouse')
        UserPermissionOverride.objects.create(
            account=self.account, permission=perm,
            allowed=False, reason='test deny master v2',
        )
        response = self.client.get('/api/armas/')
        # MASTER ignora el override DENY
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# Test: get_effective_permission_codes — mismo resultado en v1 y v2
# ---------------------------------------------------------------------------

class GetEffectivePermissionCodesTest(TestCase):

    def setUp(self):
        self.tenant, self.unit = _make_env()
        self.tenant.code = 'eff-codes'
        self.tenant.save()
        self.user, self.person = _make_user('20000000-6')
        self.account = _make_account(self.user, self.person, self.tenant)
        self.role = _make_role_with_permission('eff_codes_role', 'score_shooters')
        _make_assignment(self.account, self.unit, self.role)

    def test_v2_role_permission_codes(self):
        """get_effective_permission_codes lee desde RolePermission."""
        codes = get_effective_permission_codes(self.account)
        self.assertIn('score_shooters', codes)

    @override_settings(AUTHZ_USE_PERMISSION_MODEL=True)
    def test_v2_returns_permission_codes(self):
        codes = get_effective_permission_codes(self.account)
        self.assertIn('score_shooters', codes)

    @override_settings(AUTHZ_USE_PERMISSION_MODEL=True)
    def test_auth_context_includes_permissions_array(self):
        client = APIClient()
        client.force_authenticate(user=self.user)
        client.credentials(HTTP_X_TENANT_CODE=self.tenant.code)
        response = client.get('/api/auth/context/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('permissions', response.data)
        self.assertIsInstance(response.data['permissions'], list)
        self.assertIn('score_shooters', response.data['permissions'])
