"""Tests de precedencia en HasResourcePermission:
  1. MASTER bypass (super_admin) > todo
  2. Override DENY > Role ALLOW
  3. Override ALLOW > Role DENY (sin perm)
  4. Role permission
"""

from django.test import TestCase
from unittest.mock import MagicMock

from apps.authorization.models import UserPermissionOverride
from apps.authorization.permissions import HasResourcePermission
from apipoligono.tests._factories import (
    assign_position, make_position, make_role, make_scope, make_tenant,
    make_unit, make_user_account,
)


def _fake_view(resource_name, action='list', action_perm_map=None):
    view = MagicMock()
    view.resource_name = resource_name
    view.action = action
    view.action_permission_map = action_perm_map or {}
    return view


def _fake_request(account, method='GET'):
    req = MagicMock()
    req.method = method
    req.identity_account = account
    req.user = account.user
    return req


class TestPrecedence(TestCase):
    def setUp(self):
        self.tenant = make_tenant()
        self.unit = make_unit(self.tenant)
        self.role = make_role('tirador', perms=[('shooting_result', 'read', True)])
        self.scope = make_scope('solo_propio')
        self.position = make_position(self.tenant, self.unit, self.role, self.scope)
        _, self.account = make_user_account(self.tenant)
        assign_position(self.account, self.position)
        self.perm = HasResourcePermission()

    def test_role_grants_permission(self):
        view = _fake_view('shooting_result', action='list')
        req = _fake_request(self.account)
        self.assertTrue(self.perm.has_permission(req, view))

    def test_role_denies_unmatched_resource(self):
        view = _fake_view('weapon', action='list')
        req = _fake_request(self.account)
        self.assertFalse(self.perm.has_permission(req, view))

    def test_override_allow_grants_perm_role_doesnt_have(self):
        UserPermissionOverride.objects.create(
            account=self.account, resource='weapon', action='read', allowed=True,
        )
        view = _fake_view('weapon', action='list')
        req = _fake_request(self.account)
        self.assertTrue(self.perm.has_permission(req, view))

    def test_override_deny_beats_role_allow(self):
        UserPermissionOverride.objects.create(
            account=self.account, resource='shooting_result', action='read', allowed=False,
        )
        view = _fake_view('shooting_result', action='list')
        req = _fake_request(self.account)
        self.assertFalse(self.perm.has_permission(req, view))

    def test_wildcard_override_deny(self):
        UserPermissionOverride.objects.create(
            account=self.account, resource='*', action='*', allowed=False,
        )
        view = _fake_view('shooting_result', action='list')
        req = _fake_request(self.account)
        self.assertFalse(self.perm.has_permission(req, view))


class TestMasterBypass(TestCase):
    def setUp(self):
        self.tenant = make_tenant()
        self.unit = make_unit(self.tenant)
        self.super_role = make_role('super_admin', perms=[('*', '*', True)])
        self.scope = make_scope('unidad_y_descendientes')
        self.position = make_position(
            self.tenant, self.unit, self.super_role, self.scope,
            code='MASTER',
        )
        _, self.account = make_user_account(self.tenant, rut='99999999-9')
        assign_position(self.account, self.position)
        self.perm = HasResourcePermission()

    def test_master_bypasses_deny_override(self):
        UserPermissionOverride.objects.create(
            account=self.account, resource='*', action='*', allowed=False,
        )
        view = _fake_view('weapon', action='destroy')
        req = _fake_request(self.account, method='DELETE')
        # Aunque haya DENY universal, MASTER ignora todo.
        self.assertTrue(self.perm.has_permission(req, view))

    def test_master_grants_unknown_resource(self):
        view = _fake_view('algun_recurso_nuevo', action='create')
        req = _fake_request(self.account, method='POST')
        self.assertTrue(self.perm.has_permission(req, view))
