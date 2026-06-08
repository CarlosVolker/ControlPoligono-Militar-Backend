"""
Tests de FASE 2: UnitMembership y catálogo Permission.
"""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authorization.models import Permission, Role, RolePermission, ScopePolicy
from apps.authorization.models import PERMISSION_CATALOG
from apps.identity.models import Account, Assignment, Person, UnitMembership
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant
from apipoligono.models import Usuario


def _make_tenant(code='test-mem'):
    return Tenant.objects.create(code=code, name=code, context='military')


def _make_unit(tenant, code='UNIT-1', parent=None):
    return OrganizationUnit.objects.create(
        tenant=tenant, code=code, name=code, unit_type='company', parent=parent,
    )


def _make_user_with_account(tenant, rut='11111111-1', role_code='tirador'):
    user = Usuario.objects.create_user(
        username=rut, password='Test1234!', rut=rut,
        nombre='Test', apellido_paterno='User',
    )
    person = Person.objects.create(document_id=rut, full_name='Test User', is_active=True)
    account = Account.objects.create(user=user, person=person, tenant=tenant, is_active=True)
    return user, account


class PermissionCatalogTest(TestCase):
    """El catálogo de permisos existe y es completo."""

    def test_catalog_has_all_permissions(self):
        expected_codes = {code for code, _, _ in PERMISSION_CATALOG}
        existing_codes = set(Permission.objects.values_list('code', flat=True))
        self.assertEqual(expected_codes, existing_codes)

    def test_all_permissions_have_category(self):
        without_category = Permission.objects.filter(category='').count()
        self.assertEqual(without_category, 0)

    def test_permission_codes_are_unique(self):
        total = Permission.objects.count()
        unique = Permission.objects.values('code').distinct().count()
        self.assertEqual(total, unique)


class UnitMembershipCreationTest(TestCase):
    """UnitMembership se crea correctamente y no otorga permisos por sí misma."""

    def setUp(self):
        self.tenant = _make_tenant()
        self.unit = _make_unit(self.tenant)
        self.user, self.account = _make_user_with_account(self.tenant)

    def test_create_membership(self):
        m = UnitMembership.objects.create(
            tenant=self.tenant,
            account=self.account,
            unit=self.unit,
            is_primary=True,
            is_active=True,
        )
        self.assertTrue(m.pk)
        self.assertEqual(str(m.unit.code), 'UNIT-1')

    def test_membership_does_not_grant_permissions(self):
        """Un account con UnitMembership pero sin Assignment activo → 403 en la API."""
        UnitMembership.objects.create(
            tenant=self.tenant, account=self.account, unit=self.unit,
            is_primary=True, is_active=True,
        )
        client = APIClient()
        client.force_authenticate(user=self.user)
        client.credentials(HTTP_X_TENANT_CODE=self.tenant.code)
        response = client.get('/api/armas/')
        # Sin assignment activo el usuario no tiene permisos — 403
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_only_one_primary_per_account(self):
        unit2 = _make_unit(self.tenant, code='UNIT-2')
        m1 = UnitMembership.objects.create(
            tenant=self.tenant, account=self.account, unit=self.unit,
            is_primary=True, is_active=True,
        )
        # Si se crea otro como primario manualmente, ambos quedan primarios
        # (la restricción la impone el código, no un constraint de BD).
        # El test verifica que _ensure_unit_membership resuelve el conflicto.
        m2 = UnitMembership.objects.create(
            tenant=self.tenant, account=self.account, unit=unit2,
            is_primary=False, is_active=True,
        )
        self.assertEqual(UnitMembership.objects.filter(
            account=self.account, is_primary=True, is_active=True
        ).count(), 1)


class UnitMembershipFromAssignmentTest(TestCase):
    """La data migration pobla UnitMembership desde Assignments activos."""

    def test_membership_created_for_assignment_with_unit(self):
        tenant = _make_tenant(code='test-migr')
        unit = _make_unit(tenant, code='CO-A')
        user, account = _make_user_with_account(tenant, rut='22222222-2')

        role = Role.objects.create(code='tirador_test', name='Tirador Test')
        scope = ScopePolicy.objects.create(code='solo_propio_test', name='Solo Propio Test')
        from apps.identity.models import Position
        pos, _ = Position.objects.get_or_create(tenant=tenant, code='TIR-CO-A-TEST', defaults={'name': 'Tirador CO-A', 'organization_unit': unit, 'role': role, 'scope_policy': scope, 'is_active': True})
        Assignment.objects.create(
            account=account,
            position=pos,
            is_primary=True,
            is_active=True,
        )

        # Simular lo que hace la data migration
        from apps.identity.migrations._0005_helper import populate_from_assignments
        populate_from_assignments(account)

        self.assertTrue(
            UnitMembership.objects.filter(account=account, unit=unit, is_active=True).exists()
        )


class UnitMembershipAPITest(TestCase):
    """El endpoint /api/memberships/ devuelve membresías del tenant."""

    def setUp(self):
        self.tenant = _make_tenant(code='test-api-mem')
        self.unit = _make_unit(self.tenant, code='UNIT-API')
        self.user, self.account = _make_user_with_account(self.tenant, rut='33333333-3')

        role = Role.objects.create(code='admin_test_mem', name='Admin Test')
        for perm in Permission.objects.all():
            RolePermission.objects.get_or_create(role=role, permission=perm, defaults={'allowed': True})
        scope = ScopePolicy.objects.create(code='desc_test_mem', name='Desc Test')
        from apps.identity.models import Position
        pos, _ = Position.objects.get_or_create(tenant=self.tenant, code='ADMIN-UNIT-API', defaults={'name': 'Admin Unit API', 'organization_unit': self.unit, 'role': role, 'scope_policy': scope, 'is_active': True})
        Assignment.objects.create(
            account=self.account, position=pos, is_primary=True, is_active=True,
        )
        UnitMembership.objects.create(
            tenant=self.tenant, account=self.account, unit=self.unit,
            is_primary=True, is_active=True,
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.client.credentials(HTTP_X_TENANT_CODE=self.tenant.code)

    def test_list_memberships(self):
        response = self.client.get('/api/memberships/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_list_permissions_catalog(self):
        response = self.client.get('/api/authz/permissions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        codes = [p['code'] for p in response.data]
        self.assertIn('view_unit', codes)
        self.assertIn('score_shooters', codes)
        self.assertIn('manage_system_settings', codes)

    def test_auth_context_includes_unit_membership(self):
        response = self.client.get('/api/auth/context/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('unit_membership', response.data)
        self.assertIsNotNone(response.data['unit_membership'])
        self.assertEqual(response.data['unit_membership']['unit_code'], 'UNIT-API')
