import fcntl
import json
import os
import re
import secrets
import stat
import subprocess
import uuid
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import quote

from auditlog import get_logentry_model
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import connections, transaction
from django.db.models import Q
from django.utils import timezone

from apps.armory.models import Armory
from apps.authorization.models import (
    PositionPermission,
    Role,
    ScopePolicy,
    UserPermissionOverride,
)
from apps.identity.management.commands.init_access_model import DEFAULT_ROLES
from apps.identity.models import Account, Assignment, Person, Position, UnitMembership
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant

DATABASE_ALIAS = "default"
DATABASE_FILENAME = "db.sqlite3"
TENANT_CODE = "desarrollo-poligono-local"
UNIT_CODE = "CIA-A"
ARMORY_CODE = "ALM-CIA-A-DEV"
NAMESPACE = "development-role-accounts"
USERNAME_PREFIX = "devrole_accounts_"
POSITION_PREFIX = "DEVROLE-ACCOUNTS-"
PRIVATE_DIRECTORY = Path(".cache") / NAMESPACE
CREDENTIALS_FILENAME = "credentials.json"
CREDENTIALS_VERSION = 1

ROLE_MATRIX = (
    ("super_admin", None, None),
    ("tenant_admin", None, None),
    ("admin_unidad", "unidad_y_descendientes", None),
    ("comandante_unidad", "unidad_y_descendientes", None),
    ("oficial_tiro", "unidad_y_descendientes", None),
    ("oficial_observador", "unidad_y_descendientes", None),
    ("encargado_almacen", "unidad_propia", ARMORY_CODE),
    ("tirador", "solo_propio", None),
)
SUPPORTED_ROLE_CODES = tuple(row[0] for row in ROLE_MATRIX)
CATALOG_ROLE_CODES = frozenset(code for code, _name, _description in DEFAULT_ROLES)
RUT_BASES = tuple(str(number) for number in range(99001001, 99001009))
MAX_CREDENTIAL_BYTES = 8192


def _rut_for_base(base):
    total = sum(int(digit) * weight for digit, weight in zip(reversed(base), (2, 3, 4, 5, 6, 7) * 2))
    remainder = 11 - total % 11
    verifier = "0" if remainder == 11 else "K" if remainder == 10 else str(remainder)
    return f"{base}-{verifier}"


def _expected_identity(role, index):
    return {
        "role": role,
        "username": f"{USERNAME_PREFIX}{role}",
        "rut": _rut_for_base(RUT_BASES[index]),
        "nombre": "Cuenta ficticia",
        "apellido_paterno": f"Desarrollo {role}",
        "apellido_materno": "Inume",
        "full_name": f"Cuenta ficticia de desarrollo: {role}",
    }


def _resolve_database_file(connection, base_dir):
    if connection.alias != DATABASE_ALIAS:
        raise CommandError("Destino rechazado (database_alias).")
    settings_dict = connection.settings_dict
    if settings_dict.get("ENGINE") != "django.db.backends.sqlite3" or connection.vendor != "sqlite":
        raise CommandError("Destino rechazado (database_engine).")

    raw_name = settings_dict.get("NAME")
    if not raw_name or str(raw_name).startswith("file:") or str(raw_name) == ":memory:":
        raise CommandError("Destino rechazado (database_name).")

    try:
        project_root = Path(base_dir).resolve(strict=True)
        expected_path = project_root / DATABASE_FILENAME
        if expected_path.is_symlink():
            raise ValueError
        authorized_path = expected_path.resolve(strict=True)
        configured_path = Path(raw_name)
        if not configured_path.is_absolute():
            configured_path = project_root / configured_path
        if configured_path.is_symlink():
            raise ValueError
        configured_path = configured_path.resolve(strict=True)
        file_stat = authorized_path.stat()
        authorized_path.relative_to(project_root)
        configured_path.relative_to(project_root)
    except OSError, RuntimeError, ValueError, TypeError:
        raise CommandError("Destino rechazado (database_path).") from None

    if not stat.S_ISREG(file_stat.st_mode) or not authorized_path.is_file() or configured_path != authorized_path:
        raise CommandError("Destino rechazado (database_mismatch).")
    configured_stat = configured_path.stat()
    if not stat.S_ISREG(configured_stat.st_mode):
        raise CommandError("Destino rechazado (database_file).")
    return authorized_path


def _open_sqlite_mode_rw(connection, authorized_path):
    if connection.connection is not None or connection.in_atomic_block:
        raise CommandError("Destino rechazado (connection_already_open).")
    try:
        connection.get_connection_params()
        if any(command.strip() for command in connection.init_commands):
            raise CommandError("Destino rechazado (sqlite_init_command).")
        original_get_new_connection = connection.get_new_connection
        had_instance_override = "get_new_connection" in connection.__dict__
        previous_instance_override = connection.__dict__.get("get_new_connection")

        def get_new_connection(params):
            local_params = dict(params)
            local_params["database"] = f"file:{quote(str(authorized_path), safe='/')}?mode=rw"
            local_params["uri"] = True
            return original_get_new_connection(local_params)

        connection.get_new_connection = get_new_connection
        try:
            connection.ensure_connection()
        finally:
            if had_instance_override:
                connection.get_new_connection = previous_instance_override
            else:
                del connection.get_new_connection
    except CommandError:
        raise
    except Exception:
        raise CommandError("Destino rechazado (sqlite_open).") from None


def _verify_main_database(connection, authorized_path):
    try:
        with connection.cursor() as cursor:
            cursor.execute("PRAGMA database_list")
            main_database = next(
                (row[2] for row in cursor.fetchall() if row[1] == "main"),
                "",
            )
        if not main_database or Path(main_database).resolve(strict=True) != authorized_path:
            raise CommandError("Destino rechazado (sqlite_main_database).")
    except CommandError:
        raise
    except Exception:
        raise CommandError("Destino rechazado (sqlite_main_database).") from None


def _assert_git_ignored(base_dir):
    relative_path = (PRIVATE_DIRECTORY / CREDENTIALS_FILENAME).as_posix()
    try:
        result = subprocess.run(
            ["git", "check-ignore", "--quiet", "--no-index", "--", relative_path],
            cwd=base_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
            timeout=5,
        )
    except OSError, subprocess.SubprocessError:
        raise CommandError("Archivo privado rechazado (git_ignore_unavailable).") from None
    if result.returncode != 0:
        raise CommandError("Archivo privado rechazado (git_ignore_missing).")


def _check_directory(path, *, expected_mode=None):
    try:
        info = path.lstat()
    except OSError:
        raise CommandError("Directorio privado rechazado.") from None
    if (
        not stat.S_ISDIR(info.st_mode)
        or stat.S_ISLNK(info.st_mode)
        or info.st_uid != os.getuid()
        or (stat.S_IMODE(info.st_mode) != expected_mode if expected_mode is not None else bool(info.st_mode & 0o022))
    ):
        raise CommandError("Directorio privado rechazado.")
    return info


def _private_paths(base_dir, *, create):
    root = Path(base_dir).resolve(strict=True)
    cache = root / ".cache"
    private_dir = root / PRIVATE_DIRECTORY

    for path in (cache, private_dir):
        try:
            path.lstat()
        except FileNotFoundError:
            if not create:
                return private_dir, private_dir / CREDENTIALS_FILENAME, False
            try:
                path.mkdir(mode=0o700, exist_ok=True)
            except OSError:
                raise CommandError("No se pudo crear el directorio privado.") from None
        except OSError:
            raise CommandError("Directorio privado rechazado.") from None

        _check_directory(path, expected_mode=0o700 if path == private_dir else None)

    return private_dir, private_dir / CREDENTIALS_FILENAME, True


@contextmanager
def _private_directory_lock(private_dir):
    try:
        descriptor = os.open(private_dir, os.O_RDONLY | getattr(os, "O_DIRECTORY", 0) | getattr(os, "O_NOFOLLOW", 0))
        fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError, BlockingIOError:
        if "descriptor" in locals():
            os.close(descriptor)
        raise CommandError("Provisión rechazada (lock_busy_or_unavailable).") from None
    try:
        yield
    finally:
        fcntl.flock(descriptor, fcntl.LOCK_UN)
        os.close(descriptor)


def _reject_duplicate_json_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError
        result[key] = value
    return result


def _read_credentials(path):
    try:
        info = path.lstat()
    except FileNotFoundError:
        return None
    except OSError:
        raise CommandError("Archivo privado rechazado (credentials_unreadable).") from None

    if (
        not stat.S_ISREG(info.st_mode)
        or stat.S_ISLNK(info.st_mode)
        or info.st_uid != os.getuid()
        or info.st_nlink != 1
        or stat.S_IMODE(info.st_mode) != 0o600
        or info.st_size > MAX_CREDENTIAL_BYTES
    ):
        raise CommandError("Archivo privado rechazado (credentials_permissions_or_type).")
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle, object_pairs_hook=_reject_duplicate_json_keys)
    except OSError, UnicodeError, json.JSONDecodeError, ValueError:
        raise CommandError("Archivo privado rechazado (credentials_invalid).") from None


def _new_credentials(identities, users_by_role):
    entries = []
    for identity in identities:
        user = users_by_role.get(identity["role"])
        if user is None:
            User = get_user_model()
            user = User(
                username=identity["username"],
                rut=identity["rut"],
                nombre=identity["nombre"],
                apellido_paterno=identity["apellido_paterno"],
                apellido_materno=identity["apellido_materno"],
                email="",
                correo="",
            )
        for _attempt in range(8):
            password = secrets.token_urlsafe(32)
            try:
                validate_password(password, user=user)
            except ValidationError:
                continue
            entries.append({"role": identity["role"], "rut": identity["rut"], "password": password})
            break
        else:
            raise CommandError("No se pudieron generar credenciales válidas.")

    return {
        "version": CREDENTIALS_VERSION,
        "namespace": NAMESPACE,
        "bundle_id": uuid.uuid4().hex,
        "context": {"tenant": TENANT_CODE, "unit": UNIT_CODE, "armory": ARMORY_CODE},
        "accounts": entries,
    }


def _validate_credentials(credentials, identities, users_by_role):
    if not isinstance(credentials, dict) or set(credentials) != {
        "version",
        "namespace",
        "bundle_id",
        "context",
        "accounts",
    }:
        raise CommandError("Archivo privado rechazado (credentials_schema).")
    if (
        credentials["version"] != CREDENTIALS_VERSION
        or credentials["namespace"] != NAMESPACE
        or not isinstance(credentials["bundle_id"], str)
        or not re.fullmatch(r"[0-9a-f]{32}", credentials["bundle_id"])
        or credentials["context"] != {"tenant": TENANT_CODE, "unit": UNIT_CODE, "armory": ARMORY_CODE}
        or not isinstance(credentials["accounts"], list)
        or len(credentials["accounts"]) != len(identities)
    ):
        raise CommandError("Archivo privado rechazado (credentials_context).")

    expected = {identity["role"]: identity for identity in identities}
    seen = set()
    passwords = {}
    for entry in credentials["accounts"]:
        if not isinstance(entry, dict) or set(entry) != {"role", "rut", "password"}:
            raise CommandError("Archivo privado rechazado (credentials_entry).")
        role = entry["role"]
        identity = expected.get(role)
        password = entry["password"]
        if (
            identity is None
            or role in seen
            or entry["rut"] != identity["rut"]
            or not isinstance(password, str)
            or not 20 <= len(password) <= 256
        ):
            raise CommandError("Archivo privado rechazado (credentials_entry).")
        user = users_by_role.get(role)
        try:
            validate_password(password, user=user or _unsaved_user(identity))
        except ValidationError:
            raise CommandError("Archivo privado rechazado (password_invalid).") from None
        if user is not None and not user.check_password(password):
            raise CommandError("Archivo privado rechazado (password_mismatch).")
        seen.add(role)
        passwords[role] = password
    if seen != set(expected):
        raise CommandError("Archivo privado rechazado (credentials_incomplete).")
    return passwords


def _unsaved_user(identity):
    User = get_user_model()
    return User(
        username=identity["username"],
        rut=identity["rut"],
        nombre=identity["nombre"],
        apellido_paterno=identity["apellido_paterno"],
        apellido_materno=identity["apellido_materno"],
        email="",
        correo="",
    )


def _persist_credentials(path, credentials):
    payload = (json.dumps(credentials, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
    descriptor = None
    created = False
    try:
        descriptor = os.open(
            path,
            os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0),
            0o600,
        )
        created = True
        os.fchmod(descriptor, 0o600)
        remaining = memoryview(payload)
        while remaining:
            written = os.write(descriptor, remaining)
            if written <= 0:
                raise OSError
            remaining = remaining[written:]
        os.fsync(descriptor)
        os.close(descriptor)
        descriptor = None
        directory_fd = os.open(path.parent, os.O_RDONLY | getattr(os, "O_DIRECTORY", 0))
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    except OSError:
        if descriptor is not None:
            os.close(descriptor)
        if created:
            try:
                path.unlink()
            except OSError:
                pass
        raise CommandError("No se pudieron persistir las credenciales privadas.") from None


def _build_state(using):
    if not settings.DEBUG:
        raise CommandError("Destino rechazado (debug_required).")

    tenant = Tenant.objects.using(using).filter(code=TENANT_CODE).first()
    if tenant is None or not tenant.is_active or tenant.context != "military":
        raise CommandError("Contexto rechazado (tenant).")
    unit = OrganizationUnit.objects.using(using).filter(tenant=tenant, code=UNIT_CODE).first()
    if unit is None or not unit.is_active:
        raise CommandError("Contexto rechazado (unit).")
    armory = Armory.objects.using(using).filter(tenant=tenant, code=ARMORY_CODE).first()
    if armory is None or not armory.is_active or armory.organization_unit_id != unit.pk:
        raise CommandError("Contexto rechazado (armory).")

    active_roles = list(
        Role.objects.using(using)
        .filter(is_active=True)
        .filter(Q(tenant__isnull=True) | Q(tenant=tenant))
        .order_by("pk")
    )
    if (
        len(active_roles) != len(SUPPORTED_ROLE_CODES)
        or any(role.tenant_id is not None for role in active_roles)
        or {role.code for role in active_roles} != set(SUPPORTED_ROLE_CODES)
        or CATALOG_ROLE_CODES != set(SUPPORTED_ROLE_CODES)
    ):
        raise CommandError("Catálogo rechazado (active_roles_changed).")
    roles = {role.code: role for role in active_roles}

    scope_codes = {scope for _role, scope, _armory in ROLE_MATRIX if scope is not None}
    scopes = {scope.code: scope for scope in ScopePolicy.objects.using(using).filter(code__in=scope_codes)}
    if set(scopes) != scope_codes:
        raise CommandError("Catálogo rechazado (scope_missing).")

    identities = [_expected_identity(role, index) for index, (role, _scope, _armory) in enumerate(ROLE_MATRIX)]
    names_by_role = {identity["role"]: identity for identity in identities}
    ruts = {identity["rut"] for identity in identities}

    User = get_user_model()
    reserved_users = list(User.objects.using(using).filter(Q(username__startswith=USERNAME_PREFIX) | Q(rut__in=ruts)))
    users = {}
    for user in reserved_users:
        identity = next(
            (row for row in identities if row["username"] == user.username or row["rut"] == user.rut),
            None,
        )
        if identity is None or user.username != identity["username"] or user.rut != identity["rut"]:
            raise CommandError("Colisión rechazada (reserved_user).")
        role = identity["role"]
        if role in users:
            raise CommandError("Colisión rechazada (duplicate_user).")
        users[role] = user

    reserved_people = list(Person.objects.using(using).filter(document_id__in=ruts))
    people = {}
    for person in reserved_people:
        identity = next((row for row in identities if row["rut"] == person.document_id), None)
        if identity is None or identity["role"] in people:
            raise CommandError("Colisión rechazada (reserved_person).")
        people[identity["role"]] = person

    all_positions = list(Position.objects.using(using).filter(code__startswith=POSITION_PREFIX))
    position_codes = {
        role: f"{POSITION_PREFIX}{role.upper().replace('_', '-')}" for role, _scope, _armory in ROLE_MATRIX
    }
    positions = {}
    for position in all_positions:
        role = next((code for code, value in position_codes.items() if value == position.code), None)
        if role is None or position.tenant_id != tenant.pk or role in positions:
            raise CommandError("Colisión rechazada (reserved_position).")
        positions[role] = position

    accounts = {}
    for role, identity in names_by_role.items():
        user = users.get(role)
        person = people.get(role)
        by_user = list(Account.objects.using(using).filter(user=user)) if user is not None else []
        by_person = list(Account.objects.using(using).filter(person=person)) if person is not None else []
        if len(by_user) > 1 or len(by_person) > 1:
            raise CommandError("Colisión rechazada (account_link).")
        candidates = {account.pk: account for account in (*by_user, *by_person)}
        if len(candidates) > 1:
            raise CommandError("Colisión rechazada (account_link).")
        account = next(iter(candidates.values()), None)
        if account is not None and (
            user is None
            or person is None
            or account.user_id != user.pk
            or account.person_id != person.pk
            or account.tenant_id != tenant.pk
            or not account.is_active
        ):
            raise CommandError("Colisión rechazada (account_mismatch).")
        accounts[role] = account

        if user is not None and (
            user.is_active is not True
            or user.is_temporary is not False
            or user.must_change_password is not False
            or user.is_staff is not False
            or user.is_superuser is not False
            or user.nombre != identity["nombre"]
            or user.apellido_paterno != identity["apellido_paterno"]
            or user.apellido_materno != identity["apellido_materno"]
            or user.email not in (None, "")
            or user.correo not in (None, "")
        ):
            raise CommandError("Colisión rechazada (user_mismatch).")
        if person is not None and (
            person.full_name != identity["full_name"] or person.email not in (None, "") or not person.is_active
        ):
            raise CommandError("Colisión rechazada (person_mismatch).")

    for role, scope_code, armory_code in ROLE_MATRIX:
        position = positions.get(role)
        if position is None:
            continue
        expected_armory = armory if armory_code else None
        expected_scope = scopes.get(scope_code) if scope_code else None
        if (
            position.name != f"Development role account: {role}"
            or position.organization_unit_id != unit.pk
            or position.role_id != roles[role].pk
            or position.scope_policy_id != (expected_scope.pk if expected_scope else None)
            or position.armory_id != (expected_armory.pk if expected_armory else None)
            or not position.is_active
            or position.is_unique_holder != (role != "tirador")
        ):
            raise CommandError("Colisión rechazada (position_mismatch).")

    account_ids = [account.pk for account in accounts.values() if account is not None]
    position_ids = [position.pk for position in positions.values()]
    if account_ids and UserPermissionOverride.objects.using(using).filter(account_id__in=account_ids).exists():
        raise CommandError("Colisión rechazada (account_override).")
    if position_ids and PositionPermission.objects.using(using).filter(position_id__in=position_ids).exists():
        raise CommandError("Colisión rechazada (position_permission).")

    _validate_assignments(using, accounts, positions)
    _validate_memberships(using, accounts, tenant, unit)

    return {
        "tenant": tenant,
        "unit": unit,
        "armory": armory,
        "roles": roles,
        "scopes": scopes,
        "identities": identities,
        "users": users,
        "people": people,
        "accounts": accounts,
        "positions": positions,
    }


def _validate_assignments(using, accounts, positions):
    account_ids = {account.pk: role for role, account in accounts.items() if account is not None}
    position_ids = {position.pk: role for role, position in positions.items()}
    if position_ids:
        assignments = list(
            Assignment.objects.using(using)
            .filter(position_id__in=position_ids)
            .select_related("account", "position__role")
        )
        for assignment in assignments:
            role = position_ids[assignment.position_id]
            expected_account = accounts.get(role)
            if role == "tirador":
                if assignment.account_id not in account_ids:
                    raise CommandError("Colisión rechazada (position_holder).")
            elif expected_account is None or assignment.account_id != expected_account.pk:
                raise CommandError("Colisión rechazada (position_holder).")

    for role, account in accounts.items():
        if account is None:
            continue
        expected_roles = {role} if role == "tirador" else {role, "tirador"}
        assignments = list(Assignment.objects.using(using).filter(account=account).select_related("position__role"))
        seen_roles = set()
        for assignment in assignments:
            position_role = next(
                (
                    position_role
                    for position_role, position in positions.items()
                    if position.pk == assignment.position_id
                ),
                None,
            )
            if position_role is None or position_role not in expected_roles:
                raise CommandError("Colisión rechazada (account_assignment).")
            if not assignment.is_active:
                raise CommandError("Colisión rechazada (inactive_assignment).")
            if position_role in seen_roles or assignment.is_primary != (position_role == role):
                raise CommandError("Colisión rechazada (assignment_primary).")
            seen_roles.add(position_role)
        if not seen_roles.issubset(expected_roles):
            raise CommandError("Colisión rechazada (assignment_role).")


def _validate_memberships(using, accounts, tenant, unit):
    for account in accounts.values():
        if account is None:
            continue
        memberships = list(UnitMembership.objects.using(using).filter(account=account))
        seen_primary = 0
        for membership in memberships:
            if (
                membership.tenant_id != tenant.pk
                or membership.unit_id != unit.pk
                or not membership.is_active
                or not membership.is_primary
            ):
                raise CommandError("Colisión rechazada (unit_membership).")
            seen_primary += 1
        if seen_primary > 1:
            raise CommandError("Colisión rechazada (unit_membership_primary).")


def _validate_credentials_against_state(credentials, state, credentials_path):
    identities = state["identities"]
    rows_exist = bool(state["users"] or state["people"] or any(state["accounts"].values()) or state["positions"])
    if credentials is None:
        if rows_exist:
            raise CommandError("Provisión rechazada (credentials_missing_for_reserved_records).")
        return None
    passwords = _validate_credentials(credentials, identities, state["users"])
    return passwords


def _state_signature(state, using):
    assignment_rows = list(
        Assignment.objects.using(using)
        .filter(
            Q(account_id__in=[a.pk for a in state["accounts"].values() if a])
            | Q(position_id__in=[p.pk for p in state["positions"].values()])
        )
        .order_by("pk")
        .values_list("pk", "account_id", "position_id", "is_primary", "is_active", "starts_at", "ends_at")
    )
    membership_rows = list(
        UnitMembership.objects.using(using)
        .filter(account_id__in=[a.pk for a in state["accounts"].values() if a])
        .order_by("pk")
        .values_list("pk", "account_id", "tenant_id", "unit_id", "is_primary", "is_active", "starts_at", "ends_at")
    )
    return (
        tuple((role, obj.pk if obj else None) for role, obj in state["users"].items()),
        tuple((role, obj.pk if obj else None) for role, obj in state["people"].items()),
        tuple((role, obj.pk if obj else None) for role, obj in state["accounts"].items()),
        tuple((role, obj.pk if obj else None) for role, obj in state["positions"].items()),
        tuple(assignment_rows),
        tuple(membership_rows),
    )


def _create_missing(state, passwords, using):
    tenant = state["tenant"]
    unit = state["unit"]
    armory = state["armory"]
    now = timezone.now()

    for role, scope_code, armory_code in ROLE_MATRIX:
        if role in state["positions"]:
            continue
        Position.objects.using(using).create(
            tenant=tenant,
            code=f"{POSITION_PREFIX}{role.upper().replace('_', '-')}",
            name=f"Development role account: {role}",
            organization_unit=unit,
            armory=armory if armory_code else None,
            role=state["roles"][role],
            scope_policy=state["scopes"].get(scope_code) if scope_code else None,
            description=f"Reserved for local {NAMESPACE} provisioning.",
            is_active=True,
            is_unique_holder=role != "tirador",
        )
    positions = {
        position.code.removeprefix(POSITION_PREFIX).lower().replace("-", "_"): position
        for position in Position.objects.using(using).filter(
            tenant=tenant,
            code__startswith=POSITION_PREFIX,
        )
    }

    for identity in state["identities"]:
        role = identity["role"]
        user = state["users"].get(role)
        if user is None:
            User = get_user_model()
            user = User(
                username=identity["username"],
                rut=identity["rut"],
                nombre=identity["nombre"],
                apellido_paterno=identity["apellido_paterno"],
                apellido_materno=identity["apellido_materno"],
                email="",
                correo="",
                is_active=True,
                is_staff=False,
                is_superuser=False,
                must_change_password=False,
                is_temporary=False,
            )
            user.set_password(passwords[role])
            user.save(using=using, force_insert=True)
            state["users"][role] = user

        person = state["people"].get(role)
        if person is None:
            person = Person.objects.using(using).create(
                document_id=identity["rut"],
                full_name=identity["full_name"],
                email="",
                is_active=True,
            )
            state["people"][role] = person

        account = state["accounts"].get(role)
        if account is None:
            account = Account.objects.using(using).create(
                user=user,
                person=person,
                tenant=tenant,
                is_active=True,
            )
            state["accounts"][role] = account

    for role, account in state["accounts"].items():
        primary_position = positions[role]
        tirador_position = positions["tirador"]
        expected_positions = [(primary_position, True)]
        if role != "tirador":
            expected_positions.append((tirador_position, False))
        for position, is_primary in expected_positions:
            exists = (
                Assignment.objects.using(using)
                .filter(
                    account=account,
                    position=position,
                    is_active=True,
                    is_primary=is_primary,
                )
                .exists()
            )
            if not exists:
                Assignment.objects.using(using).create(
                    account=account,
                    position=position,
                    is_primary=is_primary,
                    is_active=True,
                    starts_at=now,
                )
        membership_exists = (
            UnitMembership.objects.using(using)
            .filter(
                account=account,
                tenant=tenant,
                unit=unit,
                is_primary=True,
                is_active=True,
            )
            .exists()
        )
        if not membership_exists:
            UnitMembership.objects.using(using).create(
                tenant=tenant,
                account=account,
                unit=unit,
                is_primary=True,
                is_active=True,
                starts_at=now,
            )


def _assert_complete(state, passwords, using):
    if (
        len(state["users"]) != len(ROLE_MATRIX)
        or len(state["people"]) != len(ROLE_MATRIX)
        or len(state["positions"]) != len(ROLE_MATRIX)
        or any(state["accounts"].get(role) is None for role, _scope, _armory in ROLE_MATRIX)
    ):
        raise CommandError("Transacción revertida (incomplete_records).")

    expected_assignment_count = 0
    for role, _scope, _armory in ROLE_MATRIX:
        account = state["accounts"][role]
        user = state["users"][role]
        if not user.check_password(passwords[role]):
            raise CommandError("Transacción revertida (password_hash_mismatch).")
        expected_count = 1 if role == "tirador" else 2
        expected_assignment_count += expected_count
        assignments = list(
            Assignment.objects.using(using).filter(account=account, is_active=True).select_related("position__role")
        )
        if len(assignments) != expected_count:
            raise CommandError("Transacción revertida (assignment_count).")
        primary = [assignment for assignment in assignments if assignment.is_primary]
        if len(primary) != 1 or primary[0].position_id != state["positions"][role].pk:
            raise CommandError("Transacción revertida (assignment_primary).")
        role_codes = {assignment.position.role.code for assignment in assignments}
        expected_roles = {role} if role == "tirador" else {role, "tirador"}
        if role_codes != expected_roles:
            raise CommandError("Transacción revertida (assignment_roles).")

        memberships = list(UnitMembership.objects.using(using).filter(account=account, is_active=True, is_primary=True))
        if (
            len(memberships) != 1
            or memberships[0].tenant_id != state["tenant"].pk
            or memberships[0].unit_id != state["unit"].pk
        ):
            raise CommandError("Transacción revertida (membership_primary).")

    if (
        Assignment.objects.using(using)
        .filter(
            position_id__in=[position.pk for position in state["positions"].values()],
            is_active=True,
        )
        .count()
        != expected_assignment_count
    ):
        raise CommandError("Transacción revertida (position_holder_count).")
    if UnitMembership.objects.using(using).filter(
        account_id__in=[account.pk for account in state["accounts"].values()],
        is_active=True,
    ).count() != len(ROLE_MATRIX):
        raise CommandError("Transacción revertida (membership_count).")


def _auditlog_start_pk(using):
    log_model = get_logentry_model()
    return log_model.objects.using(using).order_by("-pk").values_list("pk", flat=True).first()


def _verify_audit_entries(initial_pk, expected_count, passwords, using):
    log_model = get_logentry_model()
    entries = log_model.objects.using(using).all()
    if initial_pk is not None:
        entries = entries.filter(pk__gt=initial_pk)
    entries = list(entries.order_by("pk"))
    allowed_models = {"Position", "Assignment", "UnitMembership"}
    if len(entries) != expected_count:
        raise CommandError("Transacción revertida (auditlog_count).")
    for entry in entries:
        if entry.content_type.model_class().__name__ not in allowed_models or entry.action != log_model.Action.CREATE:
            raise CommandError("Transacción revertida (auditlog_unexpected_event).")
        changes = entry.changes_dict
        if any("password" in str(key).lower() or "token" in str(key).lower() for key in changes):
            raise CommandError("Transacción revertida (auditlog_sensitive_field).")
        serialized = json.dumps(changes, ensure_ascii=False)
        if any(password in serialized for password in passwords.values()):
            raise CommandError("Transacción revertida (auditlog_secret).")


class Command(BaseCommand):
    help = "Provisiona únicamente las cuentas ficticias locales reservadas para desarrollo."
    requires_system_checks = []
    requires_migrations_checks = False

    def add_arguments(self, parser):
        parser.add_argument("--database", required=True, choices=(DATABASE_ALIAS,))
        parser.add_argument("--tenant-code", required=True, choices=(TENANT_CODE,))
        parser.add_argument("--check", action="store_true", help="Ejecuta el preflight sin escrituras.")

    def handle(self, *args, **options):
        if options.get("database") != DATABASE_ALIAS or options.get("tenant_code") != TENANT_CODE:
            raise CommandError("Argumento rechazado (target).")
        if not settings.DEBUG:
            raise CommandError("Destino rechazado (debug_required).")

        using = DATABASE_ALIAS
        connection = connections[using]
        base_dir = settings.BASE_DIR
        authorized_path = _resolve_database_file(connection, base_dir)
        _open_sqlite_mode_rw(connection, authorized_path)
        try:
            _verify_main_database(connection, authorized_path)
            state = _build_state(using)
            private_dir, credentials_path, present = _private_paths(
                base_dir,
                create=False,
            )
            _assert_git_ignored(base_dir)
            credentials = _read_credentials(credentials_path) if present else None
            _validate_credentials_against_state(credentials, state, credentials_path)
            if options.get("check"):
                self.stdout.write("Preflight sin escrituras: tenant, contexto, catálogo y reservas compatibles.")
                return

            if not present:
                private_dir, credentials_path, _present = _private_paths(base_dir, create=True)
            with _private_directory_lock(private_dir):
                state = _build_state(using)
                credentials = _read_credentials(credentials_path)
                _validate_credentials_against_state(credentials, state, credentials_path)
                if credentials is None:
                    credentials = _new_credentials(state["identities"], state["users"])
                    _persist_credentials(credentials_path, credentials)

                before = _state_signature(state, using)
                initial_audit_pk = _auditlog_start_pk(using)
                try:
                    with transaction.atomic(using=using, durable=True):
                        revalidated = _build_state(using)
                        revalidated_passwords = _validate_credentials_against_state(
                            credentials,
                            revalidated,
                            credentials_path,
                        )
                        if _state_signature(revalidated, using) != before:
                            raise CommandError("Provisión revertida (preflight_changed).")
                        _create_missing(revalidated, revalidated_passwords, using)
                        final_state = _build_state(using)
                        _validate_credentials_against_state(credentials, final_state, credentials_path)
                        _assert_complete(final_state, revalidated_passwords, using)
                        expected_audits = (
                            len(final_state["positions"])
                            - len(state["positions"])
                            + 15
                            - _active_assignment_count(state, using)
                            + 8
                            - _active_membership_count(state, using)
                        )
                        _verify_audit_entries(initial_audit_pk, expected_audits, revalidated_passwords, using)
                except CommandError:
                    raise
                except Exception:
                    raise CommandError("Provisión revertida por un error de base de datos o auditlog.") from None

            created_accounts = 8 - sum(account is not None for account in state["accounts"].values())
            created_positions = 8 - len(state["positions"])
            self.stdout.write(
                f"Provisión local terminada: cuentas nuevas={created_accounts}; puestos nuevos={created_positions}; "
                "credenciales privadas reutilizables persistidas."
            )
        finally:
            connection.close()


def _active_assignment_count(state, using):
    account_ids = [account.pk for account in state["accounts"].values() if account]
    if not account_ids:
        return 0
    return Assignment.objects.using(using).filter(account_id__in=account_ids, is_active=True).count()


def _active_membership_count(state, using):
    account_ids = [account.pk for account in state["accounts"].values() if account]
    if not account_ids:
        return 0
    return UnitMembership.objects.using(using).filter(account_id__in=account_ids, is_active=True).count()
