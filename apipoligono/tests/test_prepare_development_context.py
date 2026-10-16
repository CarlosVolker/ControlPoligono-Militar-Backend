import re
import tempfile
from pathlib import Path
from unittest import mock

from auditlog.models import LogEntryManager
from django.core.management.base import CommandError
from django.db import connections
from django.db.backends.sqlite3.base import DatabaseWrapper
from django.test import TransactionTestCase
from django.test.utils import CaptureQueriesContext

from apps.armory.models import Armory
from apps.authorization.management.commands.init_access_model import (
    DEFAULT_ROLES,
    DEFAULT_SCOPES,
)
from apps.authorization.models import PERMISSION_CATALOG, Permission, Role, ScopePolicy
from apps.identity.models import Position
from apps.organizations.management.commands.prepare_development_context import (
    DATABASE_FILENAME,
    TENANT_CODE,
    _open_sqlite_mode_rw,
    _prepare_context,
    _resolve_database_file,
    _verify_main_database,
)
from apps.organizations.management.commands.seed_org_tree import DEFAULT_MILITARY_TREE
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant
from apipoligono.tests._factories import make_armory, make_tenant, make_unit


class PrepareDevelopmentContextTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        for code, name, description in DEFAULT_ROLES:
            Role.objects.update_or_create(
                code=code,
                tenant=None,
                defaults={
                    "name": name,
                    "description": description,
                    "is_active": True,
                },
            )
        for code, name, description in DEFAULT_SCOPES:
            ScopePolicy.objects.update_or_create(
                code=code,
                defaults={"name": name, "description": description},
            )
        for code, name, category in PERMISSION_CATALOG:
            Permission.objects.update_or_create(
                code=code,
                defaults={"name": name, "category": category, "is_active": True},
            )

    def _capture(self, callback):
        with CaptureQueriesContext(connections["default"]) as captured:
            result = callback()
        statements = [entry["sql"].strip() for entry in captured.captured_queries]
        dml = [
            statement
            for statement in statements
            if re.match(r"^(INSERT|UPDATE|DELETE|REPLACE)\b", statement, re.I)
        ]
        return result, dml

    def _create_blueprint(self, tenant):
        created = {}

        def add(nodes, parent=None):
            for node in nodes:
                unit = make_unit(
                    tenant,
                    code=node["code"],
                    name=node["name"],
                    parent=parent,
                    unit_type=node.get("unit_type", "other"),
                )
                created[node["code"]] = unit
                add(node.get("children", []), unit)

        add(DEFAULT_MILITARY_TREE)
        return created

    def test_check_builds_complete_plan_without_dml(self):
        counts, dml = self._capture(lambda: _prepare_context(check=True))

        self.assertEqual(dml, [])
        self.assertEqual(counts["tenant_created"], 1)
        self.assertEqual(counts["units_created"], 5)
        self.assertEqual(counts["positions_created"], 20)
        self.assertFalse(Tenant.objects.filter(code=TENANT_CODE).exists())
        self.assertEqual(OrganizationUnit.objects.count(), 0)
        self.assertEqual(Position.objects.count(), 0)

    def test_creates_only_context_and_one_create_audit_per_new_position(self):
        from auditlog import get_logentry_model

        log_entry = get_logentry_model()
        initial_log_pk = log_entry.objects.order_by("-pk").values_list("pk", flat=True).first()
        counts, dml = self._capture(_prepare_context)

        self.assertEqual(counts["tenant_created"], 1)
        self.assertEqual(counts["units_created"], 5)
        self.assertEqual(counts["positions_created"], 20)
        self.assertTrue(
            all(statement.lstrip().upper().startswith("INSERT") for statement in dml)
        )
        for table in (
            '"apps_tenants_tenant"',
            '"apps_organizations_organizationunit"',
            '"apps_identity_position"',
            '"auditlog_logentry"',
        ):
            self.assertTrue(any(table in statement for statement in dml), table)
        self.assertEqual(len(dml), 1 + 5 + 20 + 20)

        tenant = Tenant.objects.get(code=TENANT_CODE)
        self.assertEqual(tenant.name, "Ejército Demo")
        self.assertEqual(tenant.context, "military")
        self.assertTrue(tenant.is_active)
        self.assertEqual(OrganizationUnit.objects.filter(tenant=tenant).count(), 5)
        self.assertEqual(Position.objects.filter(tenant=tenant).count(), 20)

        from django.contrib.contenttypes.models import ContentType

        position_type = ContentType.objects.get_for_model(Position)
        entries_query = log_entry.objects.all()
        if initial_log_pk is not None:
            entries_query = entries_query.filter(pk__gt=initial_log_pk)
        entries = list(entries_query.order_by("pk"))
        self.assertEqual(len(entries), 20)
        self.assertTrue(
            all(
                entry.content_type_id == position_type.pk
                and entry.action == log_entry.Action.CREATE
                and entry.actor_id is None
                for entry in entries
            )
        )

    def test_preserves_existing_rows_and_second_pass_has_no_dml(self):
        tenant = make_tenant(code=TENANT_CODE, name="Nombre conservado")
        units = self._create_blueprint(tenant)
        role = Role.objects.get(code="comandante_unidad", tenant__isnull=True)
        scope = ScopePolicy.objects.get(code="unidad_y_descendientes")
        position = Position.objects.create(
            tenant=tenant,
            code="CMTE-CMD-1",
            name="Comandante Comando Principal",
            organization_unit=units["CMD-1"],
            role=role,
            scope_policy=scope,
            description="Descripción preexistente",
            is_active=True,
            is_unique_holder=True,
        )
        original_position_state = (
            position.pk,
            position.created_at,
            position.updated_at,
            position.description,
        )
        original_tenant_state = (tenant.pk, tenant.created_at, tenant.name)

        first_counts, _ = self._capture(_prepare_context)
        self.assertEqual(first_counts["tenant_reused"], 1)
        self.assertEqual(first_counts["units_reused"], 5)
        self.assertEqual(first_counts["positions_reused"], 1)
        self.assertEqual(first_counts["positions_created"], 19)

        tenant.refresh_from_db()
        position.refresh_from_db()
        self.assertEqual(
            (tenant.pk, tenant.created_at, tenant.name),
            original_tenant_state,
        )
        self.assertEqual(
            (
                position.pk,
                position.created_at,
                position.updated_at,
                position.description,
            ),
            original_position_state,
        )

        second_counts, second_dml = self._capture(_prepare_context)
        self.assertEqual(second_dml, [])
        self.assertEqual(second_counts["tenant_created"], 0)
        self.assertEqual(second_counts["units_created"], 0)
        self.assertEqual(second_counts["positions_created"], 0)
        self.assertEqual(second_counts["positions_reused"], 20)

    def test_additional_units_and_eligible_armories_are_scoped(self):
        tenant = make_tenant(code=TENANT_CODE)
        _prepare_context()
        active_unit = make_unit(tenant, code="SUP-1", name="Unidad adicional")
        inactive_unit = OrganizationUnit.objects.create(
            tenant=tenant,
            code="SUP-INACTIVA",
            name="Unidad inactiva",
            unit_type="section",
            is_active=False,
        )
        valid_armory = make_armory(
            tenant,
            active_unit,
            code="ALM-SUP-1",
            name="Almacén adicional",
        )
        inactive_armory = Armory.objects.create(
            tenant=tenant,
            organization_unit=active_unit,
            code="ALM-INACTIVA",
            name="Almacén inactivo",
            is_active=False,
        )
        other_tenant = make_tenant(code="otro-tenant")
        other_unit = make_unit(other_tenant, code="OTRA-1", name="Unidad externa")
        invalid_armory = Armory.objects.create(
            tenant=tenant,
            organization_unit=other_unit,
            code="ALM-UNIDAD-EXTERNA",
            name="Almacén con unidad externa",
            is_active=True,
        )

        counts, _ = self._capture(_prepare_context)

        self.assertEqual(counts["positions_created"], 5)
        self.assertEqual(counts["omitted_armories"], 2)
        self.assertTrue(Position.objects.filter(tenant=tenant, code="ENC-ALM-SUP-1").exists())
        self.assertFalse(
            Position.objects.filter(tenant=tenant, code=f"ENC-{inactive_armory.code}").exists()
        )
        self.assertFalse(
            Position.objects.filter(tenant=tenant, code=f"ENC-{invalid_armory.code}").exists()
        )
        self.assertEqual(Position.objects.filter(tenant=tenant, organization_unit=active_unit).count(), 5)
        self.assertEqual(Position.objects.filter(tenant=tenant, organization_unit=inactive_unit).count(), 0)
        self.assertEqual(valid_armory.tenant_id, tenant.pk)

    def test_missing_catalog_entry_rejects_before_any_insert(self):
        Permission.objects.filter(code="view_unit").delete()

        with CaptureQueriesContext(connections["default"]) as captured:
            with self.assertRaises(CommandError) as error:
                _prepare_context()

        self.assertIn("permission:view_unit/code", str(error.exception))
        dml = [
            query["sql"]
            for query in captured.captured_queries
            if re.match(r"^\s*(INSERT|UPDATE|DELETE|REPLACE)\b", query["sql"], re.I)
        ]
        self.assertEqual(dml, [])
        self.assertFalse(Tenant.objects.filter(code=TENANT_CODE).exists())
        self.assertEqual(OrganizationUnit.objects.count(), 0)
        self.assertEqual(Position.objects.count(), 0)

    def test_inactive_role_and_missing_scope_reject_without_writes(self):
        Role.objects.filter(code="comandante_unidad", tenant__isnull=True).update(
            is_active=False
        )
        with self.assertRaises(CommandError) as role_error:
            _prepare_context()
        self.assertIn("role:comandante_unidad/is_active", str(role_error.exception))
        self.assertFalse(Tenant.objects.filter(code=TENANT_CODE).exists())

        Role.objects.filter(code="comandante_unidad", tenant__isnull=True).update(
            is_active=True
        )
        ScopePolicy.objects.filter(code="unidad_y_descendientes").delete()
        with self.assertRaises(CommandError) as scope_error:
            _prepare_context()
        self.assertIn(
            "scopepolicy:unidad_y_descendientes/code",
            str(scope_error.exception),
        )
        self.assertFalse(Tenant.objects.filter(code=TENANT_CODE).exists())

    def test_inactive_permission_rejects_before_any_insert(self):
        Permission.objects.filter(code="view_unit").update(is_active=False)

        with self.assertRaises(CommandError) as error:
            _prepare_context()

        self.assertIn("permission:view_unit/is_active", str(error.exception))
        self.assertFalse(Tenant.objects.filter(code=TENANT_CODE).exists())
        self.assertEqual(OrganizationUnit.objects.count(), 0)
        self.assertEqual(Position.objects.count(), 0)

    def test_late_position_conflict_rejects_all_planned_inserts(self):
        tenant = make_tenant(code=TENANT_CODE)
        _prepare_context()
        extra_unit = make_unit(tenant, code="SUP-2", name="Unidad adicional")
        wrong_role = Role.objects.get(code="tirador", tenant__isnull=True)
        scope = ScopePolicy.objects.get(code="unidad_y_descendientes")
        Position.objects.create(
            tenant=tenant,
            code="SICE-SUP-2",
            name="Administrador SICE Unidad adicional",
            organization_unit=extra_unit,
            role=wrong_role,
            scope_policy=scope,
            is_active=True,
            is_unique_holder=False,
        )
        before = (
            Tenant.objects.count(),
            OrganizationUnit.objects.count(),
            Position.objects.count(),
        )

        with CaptureQueriesContext(connections["default"]) as captured:
            with self.assertRaises(CommandError) as error:
                _prepare_context()

        self.assertIn("position:SICE-SUP-2/role", str(error.exception))
        self.assertEqual(
            (
                Tenant.objects.count(),
                OrganizationUnit.objects.count(),
                Position.objects.count(),
            ),
            before,
        )
        dml = [
            query["sql"]
            for query in captured.captured_queries
            if re.match(r"^\s*(INSERT|UPDATE|DELETE|REPLACE)\b", query["sql"], re.I)
        ]
        self.assertEqual(dml, [])

    def test_auditlog_failure_rolls_back_context_and_log_entries(self):
        from auditlog import get_logentry_model

        log_entry = get_logentry_model()
        original_logs = log_entry.objects.count()
        with mock.patch.object(LogEntryManager, "create", side_effect=RuntimeError):
            with self.assertRaises(CommandError):
                _prepare_context()

        self.assertEqual(Tenant.objects.filter(code=TENANT_CODE).count(), 0)
        self.assertEqual(OrganizationUnit.objects.count(), 0)
        self.assertEqual(Position.objects.count(), 0)
        self.assertEqual(log_entry.objects.count(), original_logs)


class DevelopmentContextDatabaseGuardTests(TransactionTestCase):
    def _sqlite_connection(self, path, alias="default"):
        settings_dict = connections["default"].settings_dict.copy()
        settings_dict["ENGINE"] = "django.db.backends.sqlite3"
        settings_dict["NAME"] = str(path)
        settings_dict["OPTIONS"] = {}
        return DatabaseWrapper(settings_dict, alias=alias)

    def test_missing_authorized_file_is_rejected_without_creating_it(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            database_path = root / DATABASE_FILENAME
            connection = self._sqlite_connection(database_path)
            try:
                with self.assertRaises(CommandError):
                    _resolve_database_file(connection, root)
                with self.assertRaises(CommandError):
                    _open_sqlite_mode_rw(connection, database_path)
                self.assertFalse(database_path.exists())
            finally:
                connection.close()

    def test_existing_sqlite_file_opens_mode_rw_and_main_matches(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            database_path = root / DATABASE_FILENAME
            database_path.touch()
            connection = self._sqlite_connection(database_path)
            try:
                authorized = _resolve_database_file(connection, root)
                _open_sqlite_mode_rw(connection, authorized)
                _verify_main_database(connection, authorized)
                self.assertTrue(connection.is_usable())
            finally:
                connection.close()

    def test_rejects_foreign_alias_engine_and_database_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            authorized = root / DATABASE_FILENAME
            authorized.touch()
            other = root / "other.sqlite3"
            other.touch()

            foreign_alias = self._sqlite_connection(authorized, alias="reporting")
            wrong_engine = self._sqlite_connection(authorized)
            wrong_engine.settings_dict["ENGINE"] = "django.db.backends.postgresql"
            wrong_path = self._sqlite_connection(other)
            try:
                with self.assertRaises(CommandError):
                    _resolve_database_file(foreign_alias, root)
                with self.assertRaises(CommandError):
                    _resolve_database_file(wrong_engine, root)
                with self.assertRaises(CommandError):
                    _resolve_database_file(wrong_path, root)
            finally:
                foreign_alias.close()
                wrong_engine.close()
                wrong_path.close()
