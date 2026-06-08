"""Tests del modelo Position y sus actions (asignar/quitar holder, historico)."""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.identity.models import Assignment, Position
from apipoligono.tests._factories import (
    assign_position, make_position, make_role, make_scope, make_tenant,
    make_unit, make_user_account,
)


class PositionModelTests(APITestCase):
    def setUp(self):
        self.tenant = make_tenant()
        self.unit = make_unit(self.tenant)
        self.role = make_role('comandante_unidad', 'Comandante')
        self.scope = make_scope('unidad_y_descendientes')

    def test_create_position_unique_per_tenant_code(self):
        Position.objects.create(
            tenant=self.tenant, code='CMTE-X', name='Cmte X',
            organization_unit=self.unit, role=self.role, scope_policy=self.scope,
        )
        with self.assertRaises(Exception):
            Position.objects.create(
                tenant=self.tenant, code='CMTE-X', name='Otro',
                organization_unit=self.unit, role=self.role, scope_policy=self.scope,
            )


class PositionHolderTests(APITestCase):
    """Asigna y rota holders, verifica que solo quede 1 activo cuando
    is_unique_holder=True."""

    def setUp(self):
        self.tenant = make_tenant()
        self.unit = make_unit(self.tenant)
        self.role = make_role('comandante_unidad')
        self.scope = make_scope('unidad_y_descendientes')
        self.position = make_position(
            self.tenant, self.unit, self.role, self.scope,
            code='CMTE-1', is_unique_holder=True,
        )
        _, self.account_a = make_user_account(self.tenant, rut='11111111-1')
        _, self.account_b = make_user_account(self.tenant, rut='22222222-2')

    def test_assign_first_holder_creates_active_assignment(self):
        a = assign_position(self.account_a, self.position)
        self.assertTrue(a.is_active)
        self.assertEqual(a.position, self.position)

    def test_effective_role_falls_back_to_position(self):
        a = assign_position(self.account_a, self.position)
        self.assertEqual(a.effective_role.code, 'comandante_unidad')
        self.assertEqual(a.effective_scope.code, 'unidad_y_descendientes')
        self.assertEqual(a.effective_unit, self.unit)

    def test_historico_via_action_returns_active_and_inactive(self):
        from django.utils import timezone
        old = assign_position(self.account_a, self.position)
        old.is_active = False
        old.ends_at = timezone.now()
        old.save(update_fields=['is_active', 'ends_at'])
        new = assign_position(self.account_b, self.position)

        all_holders = self.position.holders.all()
        self.assertEqual(all_holders.count(), 2)
        self.assertEqual(self.position.holders.filter(is_active=True).count(), 1)
        self.assertEqual(self.position.holders.filter(is_active=True).first(), new)
