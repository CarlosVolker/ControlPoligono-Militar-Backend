import json
import re
import secrets
import stat
import tempfile
from io import StringIO
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from auditlog import get_logentry_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import connections
from django.test import TransactionTestCase, override_settings
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from apipoligono.models import Usuario
from apipoligono.tests._factories import make_user_account
from apps.armory.models import Armory
from apps.authorization.models import (
    PERMISSION_CATALOG,
    Permission,
    PositionPermission,
    Role,
    RolePermission,
    ScopePolicy,
    UserPermissionOverride,
)
from apps.identity.management.commands import provision_development_accounts as provision
from apps.identity.management.commands.init_access_model import DEFAULT_ROLES
from apps.identity.models import Account, Assignment, Person, Position, UnitMembership
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant


class ProvisionDevelopmentAccountsTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.temp_dir.name)
        self.database_file = self.base_dir / provision.DATABASE_FILENAME
        self.database_file.touch()

        for code, name, description in DEFAULT_ROLES:
            Role.objects.update_or_create(
                code=code,
                tenant=None,
                defaults={"name": name, "description": description, "is_active": True},
            )
        for code in ("solo_propio", "unidad_propia", "unidad_y_descendientes"):
            ScopePolicy.objects.update_or_create(code=code, defaults={"name": code})
        for code, name, category in PERMISSION_CATALOG:
            Permission.objects.update_or_create(
                code=code,
                defaults={"name": name, "category": category, "is_active": True},
            )

        self.tenant = Tenant.objects.create(
            code=provision.TENANT_CODE,
            name="Tenant ficticio de desarrollo",
            context="military",
            is_active=True,
        )
        self.unit = OrganizationUnit.objects.create(
            tenant=self.tenant,
            code=provision.UNIT_CODE,
            name="Unidad ficticia de desarrollo",
            unit_type="company",
            is_active=True,
        )
        self.armory = Armory.objects.create(
            tenant=self.tenant,
            organization_unit=self.unit,
            code=provision.ARMORY_CODE,
            name="Armería ficticia de desarrollo",
            is_active=True,
        )

    def tearDown(self):
        self.temp_dir.cleanup()

    def _run(self, *, check=False, output=None):
        output = output or StringIO()
        with (
            override_settings(BASE_DIR=self.base_dir, DEBUG=True),
            mock.patch.object(provision, "_resolve_database_file", return_value=self.database_file),
            mock.patch.object(provision, "_open_sqlite_mode_rw"),
            mock.patch.object(provision, "_verify_main_database"),
            mock.patch.object(provision, "_assert_git_ignored"),
        ):
            call_command(
                "provision_development_accounts",
                database=provision.DATABASE_ALIAS,
                tenant_code=provision.TENANT_CODE,
                check=check,
                stdout=output,
            )
        return output.getvalue()

    def _capture_dml(self, callback):
        with CaptureQueriesContext(connections["default"]) as captured:
            callback()
        statements = [entry["sql"].strip() for entry in captured.captured_queries]
        return [
            statement for statement in statements if re.match(r"^(INSERT|UPDATE|DELETE|REPLACE)\b", statement, re.I)
        ]

    def _credentials_path(self):
        return self.base_dir / provision.PRIVATE_DIRECTORY / provision.CREDENTIALS_FILENAME

    def _grant_fixture_permissions(self):
        grants = {
            "tenant_admin": "manage_system_settings",
            "admin_unidad": "create_users",
            "comandante_unidad": "view_unit",
            "oficial_tiro": "score_shooters",
            "oficial_observador": "view_audit_logs",
            "encargado_almacen": "inventory_warehouse",
            "tirador": "view_self",
        }
        for role_code, permission_code in grants.items():
            RolePermission.objects.create(
                role=Role.objects.get(code=role_code, tenant__isnull=True),
                permission=Permission.objects.get(code=permission_code),
                allowed=True,
            )

    def _provision(self):
        self._run()
        return json.loads(self._credentials_path().read_text(encoding="utf-8"))

    def test_check_has_no_dml_or_runtime_filesystem_writes(self):
        output = StringIO()
        dml = self._capture_dml(lambda: self._run(check=True, output=output))

        self.assertEqual(dml, [])
        self.assertFalse((self.base_dir / ".cache").exists())
        self.assertFalse(self._credentials_path().exists())
        self.assertEqual(Tenant.objects.filter(code=provision.TENANT_CODE).count(), 1)
        self.assertIn("Preflight sin escrituras", output.getvalue())

    def test_lock_contention_aborts_without_mutating_rows_or_credentials(self):
        with override_settings(BASE_DIR=self.base_dir, DEBUG=True):
            state = provision._build_state("default")
            private_dir, credentials_path, _present = provision._private_paths(
                self.base_dir,
                create=True,
            )
            credentials = provision._new_credentials(state["identities"], state["users"])
            provision._persist_credentials(credentials_path, credentials)

        credential_bytes = credentials_path.read_bytes()

        def snapshot():
            return (
                tuple(Usuario.objects.order_by("pk").values_list("pk", "username", "rut", "password")),
                tuple(Person.objects.order_by("pk").values_list("pk", "document_id", "full_name")),
                tuple(Account.objects.order_by("pk").values_list("pk", "user_id", "person_id", "tenant_id")),
                tuple(Position.objects.order_by("pk").values_list("pk", "code", "updated_at")),
                tuple(Assignment.objects.order_by("pk").values_list("pk", "account_id", "position_id", "is_primary")),
                tuple(UnitMembership.objects.order_by("pk").values_list("pk", "account_id", "tenant_id", "unit_id")),
                tuple(get_logentry_model().objects.order_by("pk").values_list("pk", "object_pk", "action")),
            )

        before_rows = snapshot()
        output = StringIO()

        def second_provision():
            with self.assertRaisesRegex(CommandError, "lock_busy_or_unavailable") as raised:
                self._run(output=output)
            if any(entry["password"] in str(raised.exception) for entry in credentials["accounts"]):
                self.fail("A credential appeared in the lock error.")

        with provision._private_directory_lock(private_dir):
            dml = self._capture_dml(second_provision)

        if dml:
            self.fail("The contending provision emitted database writes.")
        if snapshot() != before_rows:
            self.fail("The contending provision changed database rows.")
        if credentials_path.read_bytes() != credential_bytes:
            self.fail("The contending provision changed the credential file.")
        if output.getvalue() or any(entry["password"] in output.getvalue() for entry in credentials["accounts"]):
            self.fail("The contending provision emitted output.")

    def test_first_run_creates_reserved_records_and_repeat_is_byte_stable(self):
        dml = self._capture_dml(self._run)
        credentials_path = self._credentials_path()
        credentials_bytes = credentials_path.read_bytes()
        credentials = json.loads(credentials_bytes)

        self.assertEqual(len(dml), 8 + 8 + 8 + 8 + 15 + 8 + 31)
        self.assertEqual(Usuario.objects.filter(username__startswith=provision.USERNAME_PREFIX).count(), 8)
        self.assertEqual(
            Person.objects.filter(document_id__in=[entry["rut"] for entry in credentials["accounts"]]).count(), 8
        )
        self.assertEqual(Account.objects.filter(tenant=self.tenant).count(), 8)
        positions = Position.objects.filter(tenant=self.tenant, code__startswith=provision.POSITION_PREFIX)
        self.assertEqual(positions.count(), 8)
        self.assertEqual(Assignment.objects.filter(account__tenant=self.tenant, is_active=True).count(), 15)
        self.assertEqual(UnitMembership.objects.filter(tenant=self.tenant, is_active=True).count(), 8)
        self.assertEqual(PositionPermission.objects.filter(position__in=positions).count(), 0)
        self.assertEqual(UserPermissionOverride.objects.filter(account__tenant=self.tenant).count(), 0)
        self.assertEqual(stat.S_IMODE(credentials_path.parent.stat().st_mode), 0o700)
        self.assertEqual(stat.S_IMODE(credentials_path.stat().st_mode), 0o600)
        self.assertEqual(credentials["namespace"], provision.NAMESPACE)
        self.assertEqual(
            credentials["context"],
            {
                "tenant": provision.TENANT_CODE,
                "unit": provision.UNIT_CODE,
                "armory": provision.ARMORY_CODE,
            },
        )

        created_users = list(Usuario.objects.filter(username__startswith=provision.USERNAME_PREFIX))
        expected_passwords = {entry["role"]: entry["password"] for entry in credentials["accounts"]}
        self.assertEqual(len(created_users), 8)
        for role, _scope, _armory in provision.ROLE_MATRIX:
            identity = provision._expected_identity(role, provision.SUPPORTED_ROLE_CODES.index(role))
            user = Usuario.objects.get(username=identity["username"])
            account = Account.objects.get(user=user)
            person = account.person
            self.assertEqual(user.rut, identity["rut"])
            self.assertTrue(user.check_password(expected_passwords[role]))
            self.assertTrue(user.is_active)
            self.assertFalse(user.is_temporary)
            self.assertFalse(user.must_change_password)
            self.assertFalse(user.is_staff)
            self.assertFalse(user.is_superuser)
            self.assertEqual(user.email or "", "")
            self.assertEqual(user.correo or "", "")
            self.assertEqual(person.email or "", "")
            self.assertEqual(person.full_name, identity["full_name"])

            assignments = list(account.assignments.filter(is_active=True).select_related("position__role"))
            expected_roles = {role} if role == "tirador" else {role, "tirador"}
            self.assertEqual(len(assignments), len(expected_roles))
            self.assertEqual({row.position.role.code for row in assignments}, expected_roles)
            self.assertEqual(sum(row.is_primary for row in assignments), 1)
            primary = next(row for row in assignments if row.is_primary)
            self.assertEqual(primary.position.role.code, role)
            expected_scope = next(scope for matrix_role, scope, _armory in provision.ROLE_MATRIX if matrix_role == role)
            self.assertEqual(
                primary.position.scope_policy.code if primary.position.scope_policy else None,
                expected_scope,
            )
            expected_armory = self.armory.pk if role == "encargado_almacen" else None
            self.assertEqual(primary.position.armory_id, expected_armory)
            membership = account.unit_memberships.get(is_active=True, is_primary=True)
            self.assertEqual(membership.tenant_id, self.tenant.pk)
            self.assertEqual(membership.unit_id, self.unit.pk)
            self.assertEqual(account.unit_memberships.filter(is_active=True).count(), 1)

        log_model = get_logentry_model()
        self.assertEqual(log_model.objects.count(), 39)
        audit_entries = list(log_model.objects.all())
        for entry in audit_entries:
            self.assertIn(entry.content_type.model, {"role", "position", "assignment", "unitmembership"})
            self.assertEqual(entry.action, log_model.Action.CREATE)
            changes = entry.changes_dict
            self.assertFalse(any("password" in str(key).lower() or "token" in str(key).lower() for key in changes))
            serialized = json.dumps(changes, ensure_ascii=False)
            self.assertFalse(any(password in serialized for password in expected_passwords.values()))

        states = {user.username: (user.pk, user.password, user.date_joined) for user in created_users}
        position_states = {row.code: (row.pk, row.created_at, row.updated_at) for row in positions}
        assignment_states = list(
            Assignment.objects.filter(account__tenant=self.tenant)
            .order_by("pk")
            .values_list("pk", "created_at", "starts_at", "is_active", "is_primary")
        )
        membership_states = list(
            UnitMembership.objects.filter(tenant=self.tenant)
            .order_by("pk")
            .values_list("pk", "created_at", "starts_at", "is_active", "is_primary")
        )
        dml = self._capture_dml(self._run)

        self.assertEqual(dml, [])
        self.assertEqual(credentials_path.read_bytes(), credentials_bytes)
        self.assertEqual(
            {
                user.username: (user.pk, user.password, user.date_joined)
                for user in Usuario.objects.filter(username__startswith=provision.USERNAME_PREFIX)
            },
            states,
        )
        self.assertEqual(
            {
                row.code: (row.pk, row.created_at, row.updated_at)
                for row in Position.objects.filter(tenant=self.tenant, code__startswith=provision.POSITION_PREFIX)
            },
            position_states,
        )
        self.assertEqual(
            list(
                Assignment.objects.filter(account__tenant=self.tenant)
                .order_by("pk")
                .values_list("pk", "created_at", "starts_at", "is_active", "is_primary")
            ),
            assignment_states,
        )
        self.assertEqual(
            list(
                UnitMembership.objects.filter(tenant=self.tenant)
                .order_by("pk")
                .values_list("pk", "created_at", "starts_at", "is_active", "is_primary")
            ),
            membership_states,
        )
        self.assertEqual(log_model.objects.count(), 39)

    def test_login_context_permissions_and_independent_sessions_for_all_roles(self):
        self._grant_fixture_permissions()
        credentials = self._provision()
        records = {entry["role"]: entry for entry in credentials["accounts"]}
        clients = {}

        for role, scope_code, _armory in provision.ROLE_MATRIX:
            client = APIClient(enforce_csrf_checks=True)
            login = client.post(
                "/api/auth/login/",
                {"rut": records[role]["rut"], "password": records[role]["password"]},
                format="json",
            )
            if login.status_code != 200 or login.data.get("must_change_password") is not False:
                raise AssertionError("Ordinary login did not return the expected account state.")
            if "sessionid" not in client.cookies or "csrftoken" not in client.cookies:
                raise AssertionError("Login did not issue ordinary session and CSRF cookies.")
            clients[role] = client

            context = client.get(
                "/api/auth/context/",
                HTTP_X_TENANT_CODE=provision.TENANT_CODE,
                HTTP_X_ORG_UNIT_CODE=provision.UNIT_CODE,
            )
            if context.status_code != 200:
                raise AssertionError("Authenticated context request failed.")
            data = context.data
            self.assertEqual(data["user"]["rut"], records[role]["rut"])
            self.assertFalse(data["user"]["must_change_password"])
            self.assertEqual(data["tenant"], {"code": provision.TENANT_CODE, "context": "military"})
            self.assertEqual(data["active_organization_unit"], provision.UNIT_CODE)
            self.assertEqual(data["unit_membership"]["unit_code"], provision.UNIT_CODE)
            assignments = data["assignments"]
            expected_roles = {role} if role == "tirador" else {role, "tirador"}
            self.assertEqual({row["role"] for row in assignments}, expected_roles)
            primary = [row for row in assignments if row["is_primary"]]
            self.assertEqual(len(primary), 1)
            self.assertEqual(primary[0]["role"], role)
            self.assertEqual(primary[0]["scope"], scope_code)
            self.assertEqual(primary[0]["organization_unit"], provision.UNIT_CODE)
            expected_scopes = {scope_code} if scope_code else set()
            if role != "tirador":
                expected_scopes.add("solo_propio")
            self.assertEqual(set(data["scopes"]), expected_scopes)

            if role == "super_admin":
                expected_permissions = set(Permission.objects.filter(is_active=True).values_list("code", flat=True))
            else:
                role_codes = expected_roles
                expected_permissions = set(
                    RolePermission.objects.filter(
                        role__code__in=role_codes,
                        role__tenant__isnull=True,
                        permission__is_active=True,
                        allowed=True,
                    ).values_list("permission__code", flat=True)
                )
            self.assertEqual(set(data["permissions"]), expected_permissions)

        first = clients["tenant_admin"]
        second = APIClient(enforce_csrf_checks=True)
        admin_credentials = records["tenant_admin"]
        second_login = second.post(
            "/api/auth/login/",
            {"rut": admin_credentials["rut"], "password": admin_credentials["password"]},
            format="json",
        )
        if second_login.status_code != 200 or "sessionid" not in second.cookies:
            raise AssertionError("Second independent login failed.")
        if first.cookies["sessionid"].value == second.cookies["sessionid"].value:
            raise AssertionError("Independent login clients reused one session.")

        no_csrf_logout = first.post("/api/logout/", {}, format="json")
        self.assertEqual(no_csrf_logout.status_code, 403)
        wrong_tenant = first.get("/api/auth/context/", HTTP_X_TENANT_CODE="other-tenant")
        self.assertEqual(wrong_tenant.status_code, 403)
        csrf_token = first.cookies["csrftoken"].value
        logout = first.post("/api/logout/", {}, format="json", HTTP_X_CSRFTOKEN=csrf_token)
        if logout.status_code != 200:
            raise AssertionError("CSRF-protected logout failed.")
        independent_context = second.get(
            "/api/auth/context/",
            HTTP_X_TENANT_CODE=provision.TENANT_CODE,
            HTTP_X_ORG_UNIT_CODE=provision.UNIT_CODE,
        )
        self.assertEqual(independent_context.status_code, 200)

        for enabled in (False, True):
            with override_settings(AUTHZ_USE_UNIT_MEMBERSHIP=enabled):
                from apps.authorization.scope import get_allowed_unit_ids

                for role, _scope, _armory in provision.ROLE_MATRIX:
                    account = Account.objects.get(user__username=f"{provision.USERNAME_PREFIX}{role}")
                    allowed = get_allowed_unit_ids(account)
                    if role in {"super_admin", "tenant_admin"}:
                        self.assertIsNone(allowed)
                    else:
                        self.assertEqual(allowed, {self.unit.pk})

    def test_reserved_user_collision_aborts_without_creating_credentials(self):
        identity = provision._expected_identity("super_admin", 0)
        Usuario.objects.create_user(
            username="unrelated-existing-user",
            password=secrets.token_urlsafe(32),
            rut=identity["rut"],
            nombre="No adoptar",
            apellido_paterno="Ajeno",
            apellido_materno="",
        )

        with self.assertRaises(CommandError):
            self._run()

        self.assertFalse((self.base_dir / ".cache").exists())
        self.assertEqual(Usuario.objects.count(), 1)
        self.assertEqual(Person.objects.count(), 0)

    def test_tenant_custom_active_role_rejects_preflight(self):
        Role.objects.create(
            tenant=self.tenant,
            code="custom_role",
            name="Rol ajeno",
            is_active=True,
        )

        with self.assertRaises(CommandError):
            self._run(check=True)

        self.assertFalse((self.base_dir / ".cache").exists())
        self.assertFalse(Usuario.objects.exists())

    def test_divergent_reserved_position_and_foreign_holder_are_not_adopted(self):
        role = Role.objects.get(code="oficial_tiro", tenant__isnull=True)
        scope = ScopePolicy.objects.get(code="unidad_y_descendientes")
        position = Position.objects.create(
            tenant=self.tenant,
            code=f"{provision.POSITION_PREFIX}OFICIAL-TIRO",
            name="Puesto ajeno",
            organization_unit=self.unit,
            role=role,
            scope_policy=scope,
            is_active=True,
            is_unique_holder=True,
        )

        with self.assertRaises(CommandError):
            self._run()

        self.assertEqual(Position.objects.get(pk=position.pk).name, "Puesto ajeno")
        self.assertFalse(self._credentials_path().exists())

    def test_foreign_holder_on_reserved_position_aborts_without_changes(self):
        role = Role.objects.get(code="tirador", tenant__isnull=True)
        scope = ScopePolicy.objects.get(code="solo_propio")
        position = Position.objects.create(
            tenant=self.tenant,
            code=f"{provision.POSITION_PREFIX}TIRADOR",
            name="Development role account: tirador",
            organization_unit=self.unit,
            role=role,
            scope_policy=scope,
            is_active=True,
            is_unique_holder=False,
        )
        _user, account = make_user_account(
            self.tenant,
            rut="12345678-5",
            password=secrets.token_urlsafe(32),
            nombre="Cuenta ajena",
        )
        Assignment.objects.create(account=account, position=position, is_primary=True, is_active=True)

        with self.assertRaises(CommandError):
            self._run()

        self.assertEqual(Assignment.objects.filter(position=position, account=account).count(), 1)
        self.assertFalse(self._credentials_path().exists())
        self.assertEqual(Usuario.objects.count(), 1)

    def test_missing_or_inconsistent_credential_file_never_rotates_existing_passwords(self):
        credentials = self._provision()
        user = Usuario.objects.get(username=f"{provision.USERNAME_PREFIX}tirador")
        old_hash = user.password
        self._credentials_path().unlink()

        with self.assertRaises(CommandError):
            self._run()

        user.refresh_from_db()
        self.assertEqual(user.password, old_hash)
        self.assertFalse(self._credentials_path().exists())

        self._persist_test_credentials(credentials)
        credentials_path = self._credentials_path()
        credentials_path.chmod(0o644)
        with self.assertRaises(CommandError):
            self._run()
        self.assertEqual(stat.S_IMODE(credentials_path.stat().st_mode), 0o644)

        credentials_path.chmod(0o600)
        inconsistent = json.loads(credentials_path.read_text(encoding="utf-8"))
        inconsistent["accounts"][-1]["password"] = secrets.token_urlsafe(32)
        credentials_path.write_text(json.dumps(inconsistent), encoding="utf-8")
        credentials_path.chmod(0o600)
        with self.assertRaises(CommandError):
            self._run()
        user.refresh_from_db()
        self.assertEqual(user.password, old_hash)

    def _persist_test_credentials(self, credentials):
        private_dir = self._credentials_path().parent
        private_dir.mkdir(parents=True, mode=0o700, exist_ok=True)
        private_dir.chmod(0o700)
        provision._persist_credentials(self._credentials_path(), credentials)

    def test_credentials_write_failure_creates_no_database_rows(self):
        with (
            override_settings(BASE_DIR=self.base_dir, DEBUG=True),
            mock.patch.object(provision, "_resolve_database_file", return_value=self.database_file),
            mock.patch.object(provision, "_open_sqlite_mode_rw"),
            mock.patch.object(provision, "_verify_main_database"),
            mock.patch.object(provision, "_assert_git_ignored"),
            mock.patch.object(provision, "_persist_credentials", side_effect=CommandError("private-write-failed")),
        ):
            with self.assertRaises(CommandError):
                call_command(
                    "provision_development_accounts",
                    database=provision.DATABASE_ALIAS,
                    tenant_code=provision.TENANT_CODE,
                    stdout=StringIO(),
                )

        self.assertFalse(Usuario.objects.exists())
        self.assertFalse(Person.objects.exists())
        self.assertFalse(Position.objects.filter(code__startswith=provision.POSITION_PREFIX).exists())
        self.assertFalse(self._credentials_path().exists())

    def test_database_failure_rolls_back_rows_and_keeps_complete_credentials_for_retry(self):
        with (
            override_settings(BASE_DIR=self.base_dir, DEBUG=True),
            mock.patch.object(provision, "_resolve_database_file", return_value=self.database_file),
            mock.patch.object(provision, "_open_sqlite_mode_rw"),
            mock.patch.object(provision, "_verify_main_database"),
            mock.patch.object(provision, "_assert_git_ignored"),
            mock.patch.object(provision, "_verify_audit_entries", side_effect=CommandError("audit-check-failed")),
        ):
            with self.assertRaises(CommandError):
                call_command(
                    "provision_development_accounts",
                    database=provision.DATABASE_ALIAS,
                    tenant_code=provision.TENANT_CODE,
                    stdout=StringIO(),
                )

        credentials_bytes = self._credentials_path().read_bytes()
        self.assertEqual(Usuario.objects.count(), 0)
        self.assertEqual(Person.objects.count(), 0)
        self.assertEqual(Account.objects.count(), 0)
        self.assertFalse(Position.objects.filter(code__startswith=provision.POSITION_PREFIX).exists())
        self.assertEqual(get_logentry_model().objects.count(), 8)

        self._run()
        self.assertEqual(self._credentials_path().read_bytes(), credentials_bytes)
        self.assertEqual(Usuario.objects.filter(username__startswith=provision.USERNAME_PREFIX).count(), 8)

    def test_debug_and_database_path_guards(self):
        with (
            override_settings(BASE_DIR=self.base_dir, DEBUG=False),
            mock.patch.object(provision, "_resolve_database_file") as resolve,
        ):
            with self.assertRaises(CommandError):
                call_command(
                    "provision_development_accounts",
                    database=provision.DATABASE_ALIAS,
                    tenant_code=provision.TENANT_CODE,
                    stdout=StringIO(),
                )
        resolve.assert_not_called()

        target = SimpleNamespace(
            alias="default",
            vendor="sqlite",
            settings_dict={"ENGINE": "django.db.backends.sqlite3", "NAME": str(self.database_file)},
        )
        self.assertEqual(provision._resolve_database_file(target, self.base_dir), self.database_file)
        target.settings_dict["NAME"] = ":memory:"
        with self.assertRaises(CommandError):
            provision._resolve_database_file(target, self.base_dir)

        target.settings_dict["NAME"] = str(self.database_file)
        outside = self.base_dir / "outside.sqlite3"
        outside.touch()
        self.database_file.unlink()
        self.database_file.symlink_to(outside)
        with self.assertRaises(CommandError):
            provision._resolve_database_file(target, self.base_dir)

    def test_rut_values_have_modulo_eleven_verifiers(self):
        for role, _scope, _armory in provision.ROLE_MATRIX:
            index = provision.SUPPORTED_ROLE_CODES.index(role)
            rut = provision._expected_identity(role, index)["rut"]
            base, check_digit = rut.split("-")
            total = sum(int(digit) * weight for digit, weight in zip(reversed(base), (2, 3, 4, 5, 6, 7) * 2))
            remainder = 11 - total % 11
            expected = "0" if remainder == 11 else "K" if remainder == 10 else str(remainder)
            self.assertEqual(check_digit, expected)
