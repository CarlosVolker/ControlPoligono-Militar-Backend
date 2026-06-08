"""Smoke test del comando crear_master y la cuenta MASTER resultante."""

from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from apps.authorization.models import Role, ScopePolicy
from apps.identity.models import Account, Position
from apipoligono.models import Usuario
from apipoligono.tests._factories import make_tenant, make_unit


class CrearMasterCommandTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant(code='ej-test', name='Ejercito Test')
        self.unit = make_unit(self.tenant, code='CDO-1', name='Comando', unit_type='command')
        # Roles y scopes minimos (el comando los requiere)
        Role.objects.update_or_create(code='super_admin', defaults={'name': 'Super Admin'})
        ScopePolicy.objects.update_or_create(code='unidad_y_descendientes', defaults={'name': 'Tree'})

    def test_crear_master_creates_user_and_position(self):
        out = StringIO()
        call_command(
            'crear_master',
            rut='99999999-9', password='Dev1234',
            tenant_code='ej-test',
            stdout=out,
        )
        # Usuario creado
        self.assertTrue(Usuario.objects.filter(rut='99999999-9').exists())
        # Position MASTER creada
        master = Position.objects.filter(tenant=self.tenant, code='MASTER').first()
        self.assertIsNotNone(master)
        self.assertEqual(master.role.code, 'super_admin')
        # Account + Assignment activos
        account = Account.objects.get(user__rut='99999999-9')
        active = account.assignments.filter(is_active=True, position=master).first()
        self.assertIsNotNone(active)
        self.assertTrue(active.is_primary)

    def test_crear_master_idempotente(self):
        out = StringIO()
        call_command('crear_master', rut='99999999-9', password='Dev1234', tenant_code='ej-test', stdout=out)
        call_command('crear_master', rut='99999999-9', password='Dev1234', tenant_code='ej-test', stdout=out)
        # Solo 1 Position MASTER
        self.assertEqual(Position.objects.filter(tenant=self.tenant, code='MASTER').count(), 1)
        # Solo 1 holder activo
        account = Account.objects.get(user__rut='99999999-9')
        self.assertEqual(
            account.assignments.filter(position__code='MASTER', is_active=True).count(),
            1,
        )
