"""
Tests de FASE 4: scope dual-path con AUTHZ_USE_UNIT_MEMBERSHIP.
Verifica que con el flag activo, los mismos resultados de scope se obtienen
leyendo desde UnitMembership en lugar de Assignment.effective_unit.
"""
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.authorization.models import Role, RolePermission, ScopePolicy, Permission
from apps.authorization.permissions import RESOURCE_ACTION_TO_PERMISSION
from apps.authorization.scope import (
    get_allowed_unit_ids,
    get_primary_unit,
    _get_allowed_unit_ids_legacy,
    _get_allowed_unit_ids_v2,
)
from apps.identity.models import Account, Assignment, Person, UnitMembership
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant
from apipoligono.models import Arma, Usuario


def _make_tenant(code='scope-v2'):
    return Tenant.objects.create(code=code, name=code, context='military')


def _make_unit(tenant, code, parent=None):
    return OrganizationUnit.objects.create(
        tenant=tenant, code=code, name=code, unit_type='company', parent=parent,
    )


def _make_user(rut):
    user = Usuario.objects.create_user(
        username=rut, password='Test1234!', rut=rut,
        nombre='T', apellido_paterno='V4',
    )
    person = Person.objects.create(document_id=rut, full_name='T V4', is_active=True)
    return user, person


def _make_account(user, person, tenant):
    return Account.objects.create(user=user, person=person, tenant=tenant, is_active=True)


def _make_scope(code):
    s, _ = ScopePolicy.objects.get_or_create(code=code, defaults={'name': code})
    return s


def _make_role_with_perm(code, resource='*', action='*'):
    role, _ = Role.objects.get_or_create(code=code, defaults={'name': code})
    if resource == '*' and action == '*':
        for perm in Permission.objects.all():
            RolePermission.objects.get_or_create(role=role, permission=perm, defaults={'allowed': True})
    else:
        perm_code = RESOURCE_ACTION_TO_PERMISSION.get((resource, action))
        if perm_code:
            perm = Permission.objects.filter(code=perm_code).first()
            if perm:
                RolePermission.objects.get_or_create(role=role, permission=perm, defaults={'allowed': True})
    return role


def _make_assignment(account, unit, role, scope, is_primary=True):
    from apps.identity.models import Position
    pos_code = f"{role.code}-{unit.code}-sv2"[:80]
    pos, _ = Position.objects.get_or_create(
        tenant=account.tenant, code=pos_code,
        defaults={'name': pos_code, 'organization_unit': unit, 'role': role, 'scope_policy': scope, 'is_active': True},
    )
    if is_primary:
        account.assignments.filter(is_active=True, is_primary=True).update(is_primary=False)
    return Assignment.objects.create(account=account, position=pos, is_primary=is_primary, is_active=True)


def _make_membership(account, unit, tenant, is_primary=True):
    return UnitMembership.objects.create(
        account=account, unit=unit, tenant=tenant,
        is_primary=is_primary, is_active=True,
    )


# ---------------------------------------------------------------------------
# Test: get_allowed_unit_ids produce el mismo resultado con ambos modos
# ---------------------------------------------------------------------------

class ScopeConsistencyTest(TestCase):
    """v1 y v2 producen el mismo resultado cuando la data está alineada."""

    def setUp(self):
        self.tenant = _make_tenant('scope-consistency')
        self.root = _make_unit(self.tenant, 'ROOT')
        self.child = _make_unit(self.tenant, 'CHILD', parent=self.root)
        self.user, self.person = _make_user('30000000-1')
        self.account = _make_account(self.user, self.person, self.tenant)
        self.role = _make_role_with_perm('r_scope_v4')
        self.scope_desc = _make_scope('unidad_y_descendientes_v4test')
        # Cambiamos el scope_code para que caiga en TREE_SCOPE_CODES:
        # Usamos uno existente
        self.scope_tree = _make_scope('unidad_y_descendientes')
        self.scope_own = _make_scope('unidad_propia')

    def test_tree_scope_legacy_vs_v2(self):
        """Con unidad_y_descendientes ambos modos devuelven raíz + hijo."""
        _make_assignment(self.account, self.root, self.role, self.scope_tree)
        _make_membership(self.account, self.root, self.tenant)

        v1 = _get_allowed_unit_ids_legacy(self.account)
        v2 = _get_allowed_unit_ids_v2(self.account)

        self.assertEqual(v1, v2)
        self.assertIn(self.root.id, v1)
        self.assertIn(self.child.id, v1)

    def test_own_scope_legacy_vs_v2(self):
        """Con unidad_propia ambos modos devuelven solo la unidad raíz."""
        _make_assignment(self.account, self.root, self.role, self.scope_own)
        _make_membership(self.account, self.root, self.tenant)

        v1 = _get_allowed_unit_ids_legacy(self.account)
        v2 = _get_allowed_unit_ids_v2(self.account)

        self.assertEqual(v1, v2)
        self.assertIn(self.root.id, v1)
        self.assertNotIn(self.child.id, v1)


# ---------------------------------------------------------------------------
# Test: get_primary_unit respeta el flag
# ---------------------------------------------------------------------------

class GetPrimaryUnitTest(TestCase):

    def setUp(self):
        self.tenant = _make_tenant('primary-unit-v4')
        self.unit_a = _make_unit(self.tenant, 'UA')
        self.unit_b = _make_unit(self.tenant, 'UB')
        self.user, self.person = _make_user('30000000-2')
        self.account = _make_account(self.user, self.person, self.tenant)
        self.role = _make_role_with_perm('punit_role')
        self.scope = _make_scope('unidad_propia_v4test')

    @override_settings(AUTHZ_USE_UNIT_MEMBERSHIP=False)
    def test_legacy_reads_from_assignment(self):
        _make_assignment(self.account, self.unit_a, self.role, self.scope)
        unit = get_primary_unit(self.account)
        self.assertEqual(unit.code, 'UA')

    @override_settings(AUTHZ_USE_UNIT_MEMBERSHIP=True)
    def test_v2_reads_from_membership(self):
        # Assignment apunta a unit_a, pero UnitMembership apunta a unit_b
        _make_assignment(self.account, self.unit_a, self.role, self.scope)
        _make_membership(self.account, self.unit_b, self.tenant)
        unit = get_primary_unit(self.account)
        self.assertEqual(unit.code, 'UB')


# ---------------------------------------------------------------------------
# Test: SelectActiveUnitView actualiza UnitMembership en modo v2
# ---------------------------------------------------------------------------

class SelectActiveUnitV2Test(TestCase):

    def setUp(self):
        self.tenant = _make_tenant('select-v4')
        self.unit_a = _make_unit(self.tenant, 'SA-A')
        self.unit_b = _make_unit(self.tenant, 'SA-B')
        self.user, self.person = _make_user('30000000-3')
        self.account = _make_account(self.user, self.person, self.tenant)
        self.role = _make_role_with_perm('select_v4_role')
        self.scope = _make_scope('unidad_propia_select_v4')
        _make_assignment(self.account, self.unit_a, self.role, self.scope, is_primary=True)
        _make_assignment(self.account, self.unit_b, self.role, self.scope, is_primary=False)
        _make_membership(self.account, self.unit_a, self.tenant, is_primary=True)
        _make_membership(self.account, self.unit_b, self.tenant, is_primary=False)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.client.credentials(HTTP_X_TENANT_CODE=self.tenant.code)

    @override_settings(AUTHZ_USE_UNIT_MEMBERSHIP=False)
    def test_legacy_updates_assignment_primary(self):
        response = self.client.post(
            '/api/auth/select-unit/',
            {'organization_unit_code': 'SA-B'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.account.refresh_from_db()
        primary = self.account.assignments.filter(
            is_primary=True
        ).select_related('position__organization_unit').first()
        self.assertEqual(primary.effective_unit.code, 'SA-B')

    @override_settings(AUTHZ_USE_UNIT_MEMBERSHIP=True)
    def test_v2_updates_membership_primary(self):
        response = self.client.post(
            '/api/auth/select-unit/',
            {'organization_unit_code': 'SA-B'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        primary_membership = self.account.unit_memberships.filter(
            is_primary=True, is_active=True
        ).select_related('unit').first()
        self.assertIsNotNone(primary_membership)
        self.assertEqual(primary_membership.unit.code, 'SA-B')


# ---------------------------------------------------------------------------
# Test: Filtrado de queryset en modo v2
# ---------------------------------------------------------------------------

class ScopeFilterV2Test(TestCase):
    """El queryset se filtra por UnitMembership en modo v2."""

    def setUp(self):
        self.tenant = _make_tenant('filter-v4')
        self.unit_a = _make_unit(self.tenant, 'FA-A')
        self.unit_b = _make_unit(self.tenant, 'FA-B')

        self.user, self.person = _make_user('30000000-4')
        self.account = _make_account(self.user, self.person, self.tenant)
        self.role = _make_role_with_perm('filter_v4_role')
        self.scope = _make_scope('unidad_propia_filter_v4')
        _make_assignment(self.account, self.unit_a, self.role, self.scope)
        _make_membership(self.account, self.unit_a, self.tenant)

        # Arma en unit_a (visible) y en unit_b (no visible)
        self.arma_a = Arma.objects.create(
            tenant=self.tenant, organization_unit=self.unit_a,
            tipo_arma='Fusil', modelo_arma='M1', numero_serie='FA-001',
        )
        self.arma_b = Arma.objects.create(
            tenant=self.tenant, organization_unit=self.unit_b,
            tipo_arma='Fusil', modelo_arma='M1', numero_serie='FB-001',
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.client.credentials(HTTP_X_TENANT_CODE=self.tenant.code)

    @override_settings(AUTHZ_USE_UNIT_MEMBERSHIP=True)
    def test_v2_queryset_only_shows_membership_unit(self):
        response = self.client.get('/api/armas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        series = [a['numero_serie'] for a in response.data]
        self.assertIn('FA-001', series)
        self.assertNotIn('FB-001', series)

    @override_settings(AUTHZ_USE_UNIT_MEMBERSHIP=False)
    def test_legacy_queryset_matches_assignment_unit(self):
        response = self.client.get('/api/armas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        series = [a['numero_serie'] for a in response.data]
        self.assertIn('FA-001', series)
        self.assertNotIn('FB-001', series)
