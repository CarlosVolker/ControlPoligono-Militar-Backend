from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.authorization.models import AccessAudit
from apps.identity.models import UnitMembership
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant
from apipoligono.models import Arma, FraccionTiro, LeccionTiro, PoligonoTiro, ResultadoTiro, Usuario
from apipoligono.tests._factories import (
    assign_position, make_position, make_role, make_scope,
    make_unit, make_user_account,
)


class TenantSessionAuthTests(APITestCase):
    def setUp(self):
        self.tenant_a = Tenant.objects.create(code="tenant-a", name="Tenant A", context="military")
        self.tenant_b = Tenant.objects.create(code="tenant-b", name="Tenant B", context="military")

        self.user, self.account = make_user_account(
            self.tenant_a, rut="11111111-1", nombre="Admin",
        )
        unit = make_unit(self.tenant_a, code="UNIT-A")
        role = make_role("tenant_admin_test", perms=[("*", "*", True)])
        scope = make_scope("self_only_test")
        pos = make_position(self.tenant_a, unit, role, scope, code="POS-A")
        assign_position(self.account, pos)

    def test_login_requires_tenant_header(self):
        response = self.client.post(
            reverse("session_login"),
            {"rut": "11111111-1", "password": "pass1234"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        protected = self.client.get(reverse("protected"))
        self.assertEqual(protected.status_code, status.HTTP_403_FORBIDDEN)

    def test_protected_access_with_valid_tenant(self):
        login = self.client.post(
            reverse("session_login"),
            {"rut": "11111111-1", "password": "pass1234"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        response = self.client.get(reverse("protected"), HTTP_X_TENANT_CODE="tenant-a")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_protected_access_denied_for_other_tenant(self):
        login = self.client.post(
            reverse("session_login"),
            {"rut": "11111111-1", "password": "pass1234"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        response = self.client.get(reverse("protected"), HTTP_X_TENANT_CODE="tenant-b")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ScopeFilterTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(code="tenant-scope", name="Tenant Scope", context="military")
        self.unit_root = make_unit(self.tenant, code="REG-1", name="Regimiento 1", unit_type="regiment")
        self.unit_child = make_unit(self.tenant, code="BAT-1", name="Batallon 1", parent=self.unit_root, unit_type="battalion")
        self.unit_other = make_unit(self.tenant, code="REG-2", name="Regimiento 2", unit_type="regiment")

        self.user, self.account = make_user_account(self.tenant, rut="22222222-2", nombre="Operador")
        self.role = make_role("range_operator_test", perms=[("weapon", "read", True)])
        self.scope_own = make_scope("own_unit")
        self.scope_desc = make_scope("own_unit_descendants")

        self.arma_root = Arma.objects.create(tenant=self.tenant, organization_unit=self.unit_root, tipo_arma="Fusil", modelo_arma="M1", numero_serie="ROOT-001")
        self.arma_child = Arma.objects.create(tenant=self.tenant, organization_unit=self.unit_child, tipo_arma="Fusil", modelo_arma="M1", numero_serie="CHILD-001")
        self.arma_other = Arma.objects.create(tenant=self.tenant, organization_unit=self.unit_other, tipo_arma="Fusil", modelo_arma="M1", numero_serie="OTHER-001")

        login = self.client.post(reverse("session_login"), {"rut": "22222222-2", "password": "pass1234"}, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_own_unit_scope_only_lists_own_unit(self):
        pos = make_position(self.tenant, self.unit_root, self.role, self.scope_own, code="POS-OWN-SCOPE")
        assign_position(self.account, pos)
        response = self.client.get(reverse("arma-list"), HTTP_X_TENANT_CODE="tenant-scope")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned = {item["numero_serie"] for item in response.data}
        self.assertEqual(returned, {"ROOT-001"})

    def test_descendants_scope_lists_child_units(self):
        pos = make_position(self.tenant, self.unit_root, self.role, self.scope_desc, code="POS-DESC-SCOPE")
        assign_position(self.account, pos)
        response = self.client.get(reverse("arma-list"), HTTP_X_TENANT_CODE="tenant-scope")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned = {item["numero_serie"] for item in response.data}
        self.assertEqual(returned, {"ROOT-001", "CHILD-001"})


class AggregateOnlyScopeTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(code="tenant-agg", name="Tenant Agg", context="military")
        self.unit = make_unit(self.tenant, code="REG-AGG", name="Regimiento Agg", unit_type="regiment")

        self.user, account = make_user_account(self.tenant, rut="33333333-3", nombre="Agregado")

        role = make_role("comandante_compania_test", perms=[
            ("shooting_result", "read_summary", True),
            ("shooting_result", "read", True),
            ("shooting_fraction", "read", True),
            ("shooting_session", "read_summary", True),
        ])
        scope = make_scope("aggregate_only")
        pos = make_position(self.tenant, self.unit, role, scope, code="POS-AGG")
        assign_position(account, pos)

        self.poligono = PoligonoTiro.objects.create(tenant=self.tenant, organization_unit=self.unit, nombre="Poligono A", ciudad="Santiago", carriles_maximos=10, distancia_maxima=300)
        self.leccion = LeccionTiro.objects.create(tenant=self.tenant, organization_unit=self.unit, id_poligono=self.poligono, fecha_tiro="2026-01-10", cant_tiros_cereo=5, cant_tiros_leccion=20, distancia=100)
        self.fraccion = FraccionTiro.objects.create(tenant=self.tenant, organization_unit=self.unit, id_leccion=self.leccion, tiradores_totales=1, numero_fraccion=1)
        arma = Arma.objects.create(tenant=self.tenant, organization_unit=self.unit, tipo_arma="Fusil", modelo_arma="M2", numero_serie="AGG-001")
        ResultadoTiro.objects.create(tenant=self.tenant, organization_unit=self.unit, id_fraccion=self.fraccion, id_usuario=self.user, id_arma=arma, tiros_acertados=15, total_tiros=20, numero_carril=1)

        login = self.client.post(reverse("session_login"), {"rut": "33333333-3", "password": "pass1234"}, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_aggregate_only_denies_detailed_results(self):
        response = self.client.get(reverse("fracciontiro-resultados", kwargs={"pk": self.fraccion.id_fraccion}), HTTP_X_TENANT_CODE="tenant-agg")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(AccessAudit.objects.filter(endpoint='fraccion_resultados_detalle', allowed=False).exists())

    def test_aggregate_only_allows_summary_results(self):
        response = self.client.get(reverse("lecciontiro-resultados-resumen", kwargs={"pk": self.leccion.id_leccion}), HTTP_X_TENANT_CODE="tenant-agg")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["tiradores_unicos"], 1)
        self.assertEqual(response.data["tiros_acertados_total"], 15)

    def test_auth_context_returns_scopes(self):
        response = self.client.get(reverse("auth_context"), HTTP_X_TENANT_CODE="tenant-agg")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("aggregate_only", response.data["scopes"])


class ActiveUnitSelectionTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(code="tenant-unit", name="Tenant Unit", context="military")
        self.unit_a = make_unit(self.tenant, code="CIA-A", name="Compania A", unit_type="company")
        self.unit_b = make_unit(self.tenant, code="CIA-B", name="Compania B", unit_type="company")

        self.user, self.account = make_user_account(self.tenant, rut="44444444-4", nombre="Unidad")
        role = make_role("s3_unit_test", perms=[("*", "*", True)])
        scope = make_scope("own_unit_descendants")
        pos_a = make_position(self.tenant, self.unit_a, role, scope, code="POS-CIA-A")
        pos_b = make_position(self.tenant, self.unit_b, role, scope, code="POS-CIA-B")
        assign_position(self.account, pos_a, is_primary=True)
        assign_position(self.account, pos_b, is_primary=False)

        login = self.client.post(reverse("session_login"), {"rut": "44444444-4", "password": "pass1234"}, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_select_active_unit_updates_primary_assignment(self):
        response = self.client.post(
            reverse("auth_select_unit"),
            {"organization_unit_code": "CIA-B"},
            format="json",
            HTTP_X_TENANT_CODE="tenant-unit",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        primary = self.account.assignments.filter(
            is_primary=True
        ).select_related('position__organization_unit').first()
        self.assertIsNotNone(primary)
        self.assertEqual(primary.effective_unit.code, "CIA-B")


class AuditLogAccessTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(code="tenant-audit", name="Tenant Audit", context="military")
        self.unit = make_unit(self.tenant, code="AUD-1", name="Unidad Audit", unit_type="company")

        self.user, self.account = make_user_account(self.tenant, rut="55555555-5", nombre="Audit")
        role = make_role("auditor", perms=[("*", "*", True)])
        scope = make_scope("detail_read_audit")
        pos = make_position(self.tenant, self.unit, role, scope, code="POS-AUD")
        assign_position(self.account, pos)

        AccessAudit.objects.create(user_id_value=self.user.pk, tenant_code=self.tenant.code, organization_unit_code=self.unit.code, endpoint="dummy", action="read", allowed=True, reason="test")

        login = self.client.post(reverse("session_login"), {"rut": "55555555-5", "password": "pass1234"}, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_auditor_can_read_audit_log(self):
        response = self.client.get(reverse("auth_audit_log"), HTTP_X_TENANT_CODE="tenant-audit")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)


class PermissionRuleEnforcementTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(code="tenant-perm", name="Tenant Perm", context="military")
        self.unit = make_unit(self.tenant, code="PERM-1", name="Unidad Perm", unit_type="company")

        self.user, self.account = make_user_account(self.tenant, rut="66666666-6", nombre="Perm")
        role = make_role("weapon_reader_test", perms=[("weapon", "read", True)])
        scope = make_scope("own_unit_perm")
        pos = make_position(self.tenant, self.unit, role, scope, code="POS-PERM")
        assign_position(self.account, pos)

        self.arma = Arma.objects.create(tenant=self.tenant, organization_unit=self.unit, tipo_arma="Fusil", modelo_arma="M4", numero_serie="PERM-001")

        login = self.client.post(reverse("session_login"), {"rut": "66666666-6", "password": "pass1234"}, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_create_denied_without_create_permission(self):
        response = self.client.post(reverse("arma-list"), {"tipo_arma": "Fusil", "modelo_arma": "M5", "numero_serie": "PERM-002"}, format="json", HTTP_X_TENANT_CODE="tenant-perm", HTTP_X_ORG_UNIT_CODE="PERM-1")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_denied_without_update_permission(self):
        response = self.client.patch(reverse("arma-detail", kwargs={"pk": self.arma.id_arma}), {"modelo_arma": "M4-UPDATED"}, format="json", HTTP_X_TENANT_CODE="tenant-perm")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_denied_without_delete_permission(self):
        response = self.client.delete(reverse("arma-detail", kwargs={"pk": self.arma.id_arma}), HTTP_X_TENANT_CODE="tenant-perm")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
