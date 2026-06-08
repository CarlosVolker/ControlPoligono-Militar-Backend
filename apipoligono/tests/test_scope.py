"""Tests de helpers en apps.authorization.scope:
  - get_allowed_unit_ids (admin → None; tirador → solo su unidad; con
    unidad_y_descendientes → su unidad + descendientes)
  - eligible_target_units (propia + hasta N ancestros)
  - _descendant_ids (walk recursivo)
"""

from django.test import TestCase

from apps.authorization.scope import (
    _descendant_ids, eligible_target_units, get_allowed_unit_ids,
)
from apipoligono.tests._factories import (
    assign_position, make_position, make_role, make_scope, make_tenant,
    make_unit, make_user_account,
)


class DescendantTreeTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant()
        self.root = make_unit(self.tenant, code='CDO', name='Comando')
        self.bat1 = make_unit(self.tenant, code='BAT-1', name='Bat 1', parent=self.root)
        self.cia_a = make_unit(self.tenant, code='CIA-A', name='Cia A', parent=self.bat1)
        self.pel_1 = make_unit(self.tenant, code='PEL-1', name='Pel 1', parent=self.cia_a)
        self.bat2 = make_unit(self.tenant, code='BAT-2', name='Bat 2', parent=self.root)

    def test_descendant_ids_from_root(self):
        ids = _descendant_ids([self.root.id])
        self.assertIn(self.root.id, ids)
        self.assertIn(self.bat1.id, ids)
        self.assertIn(self.cia_a.id, ids)
        self.assertIn(self.pel_1.id, ids)
        self.assertIn(self.bat2.id, ids)

    def test_descendant_ids_from_leaf(self):
        ids = _descendant_ids([self.pel_1.id])
        self.assertEqual(ids, {self.pel_1.id})

    def test_eligible_target_units_2_levels_up(self):
        eligible = eligible_target_units(self.pel_1, max_levels=2)
        codes = [u.code for u in eligible]
        # PEL-1 + CIA-A + BAT-1 (no llega a CDO)
        self.assertEqual(codes, ['PEL-1', 'CIA-A', 'BAT-1'])


class AllowedUnitIdsTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant()
        self.bat = make_unit(self.tenant, code='BAT-1')
        self.cia = make_unit(self.tenant, code='CIA-A', parent=self.bat)

    def test_admin_returns_none(self):
        admin_role = make_role('super_admin', perms=[('*', '*', True)])
        scope = make_scope('unidad_y_descendientes')
        pos = make_position(self.tenant, self.bat, admin_role, scope, code='MASTER')
        _, account = make_user_account(self.tenant)
        assign_position(account, pos)
        self.assertIsNone(get_allowed_unit_ids(account))

    def test_tirador_only_own_unit(self):
        role = make_role('tirador')
        scope = make_scope('solo_propio')
        pos = make_position(self.tenant, self.cia, role, scope, code='TIR-CIA')
        _, account = make_user_account(self.tenant)
        assign_position(account, pos)
        allowed = get_allowed_unit_ids(account)
        self.assertEqual(allowed, {self.cia.id})

    def test_descendant_scope_includes_children(self):
        role = make_role('comandante_unidad')
        scope = make_scope('unidad_y_descendientes')
        pos = make_position(self.tenant, self.bat, role, scope, code='CMTE-BAT')
        _, account = make_user_account(self.tenant)
        assign_position(account, pos)
        allowed = get_allowed_unit_ids(account)
        self.assertIn(self.bat.id, allowed)
        self.assertIn(self.cia.id, allowed)
