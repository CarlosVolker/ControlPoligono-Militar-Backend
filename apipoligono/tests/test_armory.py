"""Tests del modelo Armory y la FK desde Arma."""

from django.db import IntegrityError
from django.test import TestCase

from apps.armory.models import Armory
from apipoligono.models import Arma
from apipoligono.tests._factories import make_armory, make_tenant, make_unit


class ArmoryModelTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant()
        self.unit = make_unit(self.tenant)

    def test_create_armory(self):
        armory = make_armory(self.tenant, self.unit)
        self.assertEqual(armory.organization_unit, self.unit)
        self.assertEqual(armory.tenant, self.tenant)

    def test_armory_code_unique_per_tenant(self):
        Armory.objects.create(
            tenant=self.tenant, organization_unit=self.unit,
            code='ALM-1', name='X',
        )
        with self.assertRaises(IntegrityError):
            Armory.objects.create(
                tenant=self.tenant, organization_unit=self.unit,
                code='ALM-1', name='Y',
            )


class ArmaArmoryFKTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant()
        self.unit = make_unit(self.tenant)
        self.armory = make_armory(self.tenant, self.unit)

    def test_arma_can_be_linked_to_armory(self):
        arma = Arma.objects.create(
            tenant=self.tenant,
            armory=self.armory,
            organization_unit=self.unit,
            tipo_arma='Fusil', modelo_arma='SIG-510', numero_serie='001',
        )
        self.assertEqual(arma.armory, self.armory)
        self.assertEqual(self.armory.armas.count(), 1)
