from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from stat import S_ISREG
from urllib.parse import quote

from auditlog import get_logentry_model
from auditlog.context import auditlog_disabled
from auditlog.registry import auditlog
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import DEFAULT_DB_ALIAS, connections, router, transaction

from apps.armory.models import Armory
from apps.authorization.models import PERMISSION_CATALOG, Permission, Role, ScopePolicy
from apps.identity.management.commands.seed_positions import UNIT_POSITIONS
from apps.identity.models import Position
from apps.organizations.management.commands.seed_org_tree import DEFAULT_MILITARY_TREE
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant


TENANT_CODE = "ejercito-demo"
TENANT_NAME = "Ejército Demo"
DATABASE_ALIAS = DEFAULT_DB_ALIAS
DATABASE_FILENAME = "db.sqlite3"


@dataclass
class _PlannedRow:
    model: type
    code: str
    values: dict
    existing: object | None = None
    parent_code: str | None = None
    organization_unit_code: str | None = None


@dataclass
class _ContextPlan:
    tenant: _PlannedRow | None
    units: list[_PlannedRow] = field(default_factory=list)
    positions: list[_PlannedRow] = field(default_factory=list)
    unit_candidates: dict[str, OrganizationUnit] = field(default_factory=dict)
    snapshots: dict[tuple[type, object], tuple] = field(default_factory=dict)
    conflicts: set[tuple[str, str, str]] = field(default_factory=set)
    omitted_armories: set[str] = field(default_factory=set)
    position_content_type: ContentType | None = None
    log_entry_model: type | None = None


def _safe_conflict(plan, model, code, field_name):
    plan.conflicts.add((model._meta.model_name, str(code), str(field_name)))


def _snapshot(instance):
    return tuple(
        (model_field.attname, getattr(instance, model_field.attname))
        for model_field in instance._meta.concrete_fields
    )


def _remember(plan, instance):
    if instance is not None and instance.pk is not None:
        plan.snapshots[(instance.__class__, instance.pk)] = _snapshot(instance)


def _stable_value(value):
    if hasattr(value, "_meta"):
        return (
            value._meta.label_lower,
            value.pk,
            getattr(value, "code", None),
        )
    return value


def _plan_signature(plan):
    snapshot_signature = tuple(
        sorted(
            (
                model._meta.label_lower,
                str(pk),
                state,
            )
            for (model, pk), state in plan.snapshots.items()
        )
    )

    def row_signature(row):
        return (
            row.model._meta.label_lower,
            row.code,
            row.existing.pk if row.existing is not None else None,
            row.parent_code,
            row.organization_unit_code,
            tuple(
                sorted(
                    (name, _stable_value(value))
                    for name, value in row.values.items()
                )
            ),
        )

    return (
        snapshot_signature,
        row_signature(plan.tenant),
        tuple(row_signature(row) for row in plan.units),
        tuple(row_signature(row) for row in plan.positions),
        tuple(sorted(plan.omitted_armories)),
        tuple(sorted(plan.conflicts)),
    )


def _validate_scalar_fields(plan, model, code, values):
    for name, value in values.items():
        model_field = model._meta.get_field(name)
        if model_field.is_relation:
            if value is None and not model_field.null:
                _safe_conflict(plan, model, code, name)
            continue
        try:
            model_field.clean(value, None)
        except (ValidationError, TypeError, ValueError):
            _safe_conflict(plan, model, code, name)


def _flatten_tree(nodes, parent_code=None):
    flattened = []
    for node in nodes:
        flattened.append((node, parent_code))
        flattened.extend(_flatten_tree(node.get("children", []), node["code"]))
    return flattened


def _active_catalog_rows(plan, using, needs_armory_role):
    role_codes = {
        role_code for _, role_code, _, _ in UNIT_POSITIONS
    }
    if needs_armory_role:
        role_codes.add("encargado_almacen")
    global_roles = list(
        Role.objects.using(using)
        .filter(code__in=role_codes, tenant__isnull=True)
        .order_by("code", "pk")
    )
    roles_by_code = {}
    for role in global_roles:
        _remember(plan, role)
        roles_by_code.setdefault(role.code, []).append(role)

    role_map = {}
    for code in sorted(role_codes):
        rows = roles_by_code.get(code, [])
        if len(rows) != 1:
            _safe_conflict(plan, Role, code, "global_role")
            role_map[code] = None
        elif not rows[0].is_active:
            _safe_conflict(plan, Role, code, "is_active")
            role_map[code] = None
        else:
            role_map[code] = rows[0]

    scope_codes = {
        scope_code for _, _, scope_code, _ in UNIT_POSITIONS
    }
    if needs_armory_role:
        scope_codes.add("unidad_propia")
    scopes = list(
        ScopePolicy.objects.using(using)
        .filter(code__in=scope_codes)
        .order_by("code", "pk")
    )
    scope_map = {}
    for scope in scopes:
        _remember(plan, scope)
        scope_map.setdefault(scope.code, []).append(scope)
    for code in sorted(scope_codes):
        rows = scope_map.get(code, [])
        if len(rows) != 1:
            _safe_conflict(plan, ScopePolicy, code, "code")
            scope_map[code] = None
        else:
            scope_map[code] = rows[0]

    permission_codes = {code for code, _, _ in PERMISSION_CATALOG}
    permissions = list(
        Permission.objects.using(using)
        .filter(code__in=permission_codes)
        .order_by("code", "pk")
    )
    permission_map = {}
    for permission in permissions:
        _remember(plan, permission)
        permission_map.setdefault(permission.code, []).append(permission)
    for code in sorted(permission_codes):
        rows = permission_map.get(code, [])
        if len(rows) != 1:
            _safe_conflict(plan, Permission, code, "code")
        elif not rows[0].is_active:
            _safe_conflict(plan, Permission, code, "is_active")

    return role_map, scope_map


def _auditlog_preflight(plan, connection, using):
    try:
        log_entry_model = get_logentry_model()
    except Exception:
        _safe_conflict(plan, Position, "auditlog", "logentry_model")
        return

    plan.log_entry_model = log_entry_model
    if not auditlog.contains(Position):
        _safe_conflict(plan, Position, "auditlog", "position_signal")
    if auditlog.contains(Tenant):
        _safe_conflict(plan, Tenant, TENANT_CODE, "auditlog_out_of_scope")
    if auditlog.contains(OrganizationUnit):
        _safe_conflict(plan, OrganizationUnit, TENANT_CODE, "auditlog_out_of_scope")

    try:
        disabled = auditlog_disabled.get()
    except LookupError:
        disabled = False
    if disabled:
        _safe_conflict(plan, Position, "auditlog", "disabled_context")

    for model, operation in (
        (ContentType, "read"),
        (ContentType, "write"),
        (log_entry_model, "write"),
    ):
        selected = (
            router.db_for_read(model)
            if operation == "read"
            else router.db_for_write(model)
        )
        if (selected or DEFAULT_DB_ALIAS) != using:
            _safe_conflict(plan, model, "auditlog", "database_route")

    pk_type = log_entry_model._meta.pk.get_internal_type()
    if pk_type not in {"AutoField", "BigAutoField", "SmallAutoField"}:
        _safe_conflict(plan, log_entry_model, "auditlog", "primary_key")

    try:
        table_names = set(connection.introspection.table_names())
        if ContentType._meta.db_table not in table_names:
            _safe_conflict(plan, ContentType, "auditlog", "table")
        if log_entry_model._meta.db_table not in table_names:
            _safe_conflict(plan, log_entry_model, "auditlog", "table")
        if ContentType._meta.db_table not in table_names or log_entry_model._meta.db_table not in table_names:
            return

        content_type = ContentType.objects.using(using).filter(
            app_label=Position._meta.app_label,
            model=Position._meta.model_name,
        ).first()
        if content_type is None:
            _safe_conflict(plan, ContentType, "identity.position", "missing")
            return
        _remember(plan, content_type)

        # The installed auditlog receiver uses get_for_model(); resolve it now,
        # after proving the row exists, so that the receiver cannot create it.
        cached_content_type = ContentType.objects.get_for_model(Position)
        if (
            cached_content_type.pk != content_type.pk
            or cached_content_type.app_label != Position._meta.app_label
            or cached_content_type.model != Position._meta.model_name
        ):
            _safe_conflict(plan, ContentType, "identity.position", "cache_mismatch")
        plan.position_content_type = content_type
    except Exception:
        _safe_conflict(plan, ContentType, "auditlog", "preflight")


def _build_context_plan(using=DATABASE_ALIAS, connection=None):
    if connection is None:
        connection = connections[using]
    plan = _ContextPlan(tenant=None)
    _auditlog_preflight(plan, connection, using)

    tenant_matches = list(
        Tenant.objects.using(using).filter(code=TENANT_CODE).order_by("pk")
    )
    if len(tenant_matches) > 1:
        _safe_conflict(plan, Tenant, TENANT_CODE, "code")
    tenant_existing = tenant_matches[0] if tenant_matches else None
    _remember(plan, tenant_existing)
    tenant_values = {
        "code": TENANT_CODE,
        "name": TENANT_NAME,
        "context": "military",
        "is_active": True,
    }
    _validate_scalar_fields(plan, Tenant, TENANT_CODE, tenant_values)
    if tenant_existing is not None:
        for name, expected in (("code", TENANT_CODE), ("context", "military"), ("is_active", True)):
            if getattr(tenant_existing, name) != expected:
                _safe_conflict(plan, Tenant, TENANT_CODE, name)
        tenant_instance = tenant_existing
    else:
        tenant_instance = Tenant(**tenant_values)
    plan.tenant = _PlannedRow(
        Tenant,
        TENANT_CODE,
        tenant_values,
        existing=tenant_existing,
    )

    blueprint = _flatten_tree(DEFAULT_MILITARY_TREE)
    blueprint_codes = [node["code"] for node, _ in blueprint]
    for code, count in Counter(blueprint_codes).items():
        if count > 1:
            _safe_conflict(plan, OrganizationUnit, code, "code_collision")

    existing_units = []
    if tenant_existing is not None:
        existing_units = list(
            OrganizationUnit.objects.using(using)
            .filter(tenant_id=tenant_existing.pk)
            .select_related("parent")
            .order_by("pk")
        )
        for unit in existing_units:
            _remember(plan, unit)
    units_by_code = {unit.code: unit for unit in existing_units}

    for node, parent_code in blueprint:
        code = node["code"]
        parent = plan.unit_candidates.get(parent_code) if parent_code else None
        values = {
            "tenant": tenant_instance,
            "parent": parent,
            "code": code,
            "name": node["name"],
            "unit_type": node.get("unit_type", "other"),
            "is_active": True,
        }
        _validate_scalar_fields(plan, OrganizationUnit, code, {
            "code": code,
            "name": node["name"],
            "unit_type": node.get("unit_type", "other"),
            "is_active": True,
        })
        existing = units_by_code.get(code)
        if existing is not None:
            if existing.name != values["name"]:
                _safe_conflict(plan, OrganizationUnit, code, "name")
            if existing.unit_type != values["unit_type"]:
                _safe_conflict(plan, OrganizationUnit, code, "unit_type")
            if not existing.is_active:
                _safe_conflict(plan, OrganizationUnit, code, "is_active")
            if parent_code is None:
                if existing.parent_id is not None:
                    _safe_conflict(plan, OrganizationUnit, code, "parent")
            elif parent is None or parent.pk is None or existing.parent_id != parent.pk:
                _safe_conflict(plan, OrganizationUnit, code, "parent")
            candidate = existing
        else:
            candidate = OrganizationUnit(**values)
        plan.units.append(
            _PlannedRow(
                OrganizationUnit,
                code,
                values,
                existing=existing,
                parent_code=parent_code,
            )
        )
        plan.unit_candidates[code] = candidate

    blueprint_code_set = set(blueprint_codes)
    extra_active_units = [
        unit
        for unit in existing_units
        if unit.is_active and unit.code not in blueprint_code_set
    ]
    target_units = [plan.unit_candidates[node["code"]] for node, _ in blueprint]
    target_units.extend(extra_active_units)

    armories = []
    if tenant_existing is not None:
        armories = list(
            Armory.objects.using(using)
            .filter(tenant_id=tenant_existing.pk)
            .select_related("organization_unit")
            .order_by("pk")
        )
        for armory in armories:
            _remember(plan, armory)

    eligible_armories = []
    known_unit_ids = {unit.pk for unit in existing_units}
    for armory in armories:
        if not armory.is_active:
            plan.omitted_armories.add(armory.code)
            continue
        unit = armory.organization_unit
        if (
            armory.tenant_id != tenant_existing.pk
            or unit.tenant_id != tenant_existing.pk
            or not unit.is_active
        ):
            plan.omitted_armories.add(armory.code)
            if unit.pk not in known_unit_ids:
                _remember(plan, unit)
            continue
        eligible_armories.append(armory)
        if unit.pk not in known_unit_ids:
            _remember(plan, unit)

    role_map, scope_map = _active_catalog_rows(
        plan, using, needs_armory_role=bool(eligible_armories)
    )
    position_recipes = []
    for unit in target_units:
        for prefix, role_code, scope_code, label in UNIT_POSITIONS:
            position_recipes.append(
                (
                    f"{prefix}-{unit.code}"[:80],
                    {
                        "tenant": tenant_instance,
                        "name": f"{label} {unit.name}"[:200],
                        "organization_unit": unit,
                        "armory": None,
                        "role": role_map.get(role_code),
                        "scope_policy": scope_map.get(scope_code),
                        "recinto": None,
                        "is_active": True,
                        "is_unique_holder": role_code == "comandante_unidad",
                    },
                    unit.code,
                    role_code,
                    scope_code,
                )
            )
    for armory in eligible_armories:
        position_recipes.append(
            (
                f"ENC-{armory.code}"[:80],
                {
                    "tenant": tenant_instance,
                    "name": f"Encargado {armory.name}"[:200],
                    "organization_unit": armory.organization_unit,
                    "armory": armory,
                    "role": role_map.get("encargado_almacen"),
                    "scope_policy": scope_map.get("unidad_propia"),
                    "recinto": None,
                    "is_active": True,
                    "is_unique_holder": True,
                },
                armory.organization_unit.code,
                "encargado_almacen",
                "unidad_propia",
            )
        )

    target_position_codes = [recipe[0] for recipe in position_recipes]
    for code, count in Counter(target_position_codes).items():
        if count > 1:
            _safe_conflict(plan, Position, code, "code_collision")

    existing_positions = []
    if tenant_existing is not None and target_position_codes:
        existing_positions = list(
            Position.objects.using(using)
            .filter(tenant_id=tenant_existing.pk, code__in=set(target_position_codes))
            .order_by("pk")
        )
        for position in existing_positions:
            _remember(plan, position)
    positions_by_code = {position.code: position for position in existing_positions}

    for code, values, unit_code, role_code, scope_code in position_recipes:
        _validate_scalar_fields(
            plan,
            Position,
            code,
            {
                "code": code,
                **{
                    name: value
                    for name, value in values.items()
                    if name
                    not in {
                        "tenant",
                        "organization_unit",
                        "armory",
                        "role",
                        "scope_policy",
                        "recinto",
                    }
                },
            },
        )
        if values["role"] is None:
            _safe_conflict(plan, Role, role_code, "active_global_role")
        if values["scope_policy"] is None:
            _safe_conflict(plan, ScopePolicy, scope_code, "code")
        candidate_unit = plan.unit_candidates.get(unit_code)
        if candidate_unit is None:
            candidate_unit = next(
                (unit for unit in extra_active_units if unit.code == unit_code),
                None,
            )
        if candidate_unit is None:
            _safe_conflict(plan, Position, code, "organization_unit")
        existing = positions_by_code.get(code)
        if existing is not None:
            comparisons = {
                "name": values["name"],
                "tenant_id": tenant_existing.pk,
                "organization_unit_id": candidate_unit.pk if candidate_unit is not None else None,
                "armory_id": values["armory"].pk if values["armory"] is not None else None,
                "role_id": values["role"].pk if values["role"] is not None else None,
                "scope_policy_id": values["scope_policy"].pk if values["scope_policy"] is not None else None,
                "recinto_id": None,
                "is_active": True,
                "is_unique_holder": values["is_unique_holder"],
            }
            for name, expected in comparisons.items():
                if name == "organization_unit_id" and candidate_unit is not None and candidate_unit.pk is None:
                    _safe_conflict(plan, Position, code, name)
                elif getattr(existing, name) != expected:
                    _safe_conflict(plan, Position, code, name.removesuffix("_id"))
        plan.positions.append(
            _PlannedRow(
                Position,
                code,
                values,
                existing=existing,
                organization_unit_code=unit_code,
            )
        )

    return plan


def _format_conflicts(conflicts):
    rendered = ", ".join(
        f"{model}:{code}/{field_name}"
        for model, code, field_name in sorted(conflicts)
    )
    return f"Preflight rechazado ({len(conflicts)} conflicto(s)): {rendered}."


def _counts(plan):
    tenant_rows = [plan.tenant]
    return {
        "tenant_created": sum(row.existing is None for row in tenant_rows),
        "tenant_reused": sum(row.existing is not None for row in tenant_rows),
        "units_created": sum(row.existing is None for row in plan.units),
        "units_reused": sum(row.existing is not None for row in plan.units),
        "positions_created": sum(row.existing is None for row in plan.positions),
        "positions_reused": sum(row.existing is not None for row in plan.positions),
        "omitted_armories": len(plan.omitted_armories),
        "tenant_created_codes": [row.code for row in tenant_rows if row.existing is None],
        "tenant_reused_codes": [row.code for row in tenant_rows if row.existing is not None],
        "units_created_codes": [row.code for row in plan.units if row.existing is None],
        "units_reused_codes": [row.code for row in plan.units if row.existing is not None],
        "positions_created_codes": [row.code for row in plan.positions if row.existing is None],
        "positions_reused_codes": [row.code for row in plan.positions if row.existing is not None],
        "omitted_armory_codes": sorted(plan.omitted_armories),
    }


def _auditlog_max_pk(log_entry_model, using):
    return (
        log_entry_model.objects.using(using)
        .order_by("-pk")
        .values_list("pk", flat=True)
        .first()
    )


def _verify_audit_entries(plan, created_positions, initial_max_pk, using):
    log_entry_model = plan.log_entry_model
    queryset = log_entry_model.objects.using(using)
    if initial_max_pk is not None:
        queryset = queryset.filter(pk__gt=initial_max_pk)
    actual = list(
        queryset.values_list(
            "content_type_id",
            "object_pk",
            "object_id",
            "action",
            "actor_id",
        )
    )
    expected = [
        (
            plan.position_content_type.pk,
            str(position.pk),
            position.pk,
            log_entry_model.Action.CREATE,
            None,
        )
        for position in created_positions
    ]
    if Counter(actual) != Counter(expected):
        raise CommandError("Transacción revertida: auditlog fuera del límite esperado.")


def _assert_snapshots_unchanged(snapshots, using):
    for (model, pk), initial_state in snapshots.items():
        current = model._base_manager.using(using).get(pk=pk)
        if _snapshot(current) != initial_state:
            raise CommandError("Transacción revertida: cambió una fila preexistente.")


def _prepare_context(check=False):
    using = DATABASE_ALIAS
    try:
        with transaction.atomic(using=using, durable=True):
            plan = _build_context_plan(using=using)
            if plan.conflicts:
                raise CommandError(_format_conflicts(plan.conflicts))
            initial_counts = _counts(plan)
            if check:
                return initial_counts

            revalidated = _build_context_plan(using=using)
            if revalidated.conflicts or _plan_signature(revalidated) != _plan_signature(plan):
                conflicts = revalidated.conflicts or {
                    ("context", TENANT_CODE, "preflight_changed")
                }
                raise CommandError(_format_conflicts(conflicts))

            initial_log_pk = _auditlog_max_pk(plan.log_entry_model, using)
            tenant = plan.tenant.existing
            if tenant is None:
                tenant = Tenant.objects.using(using).create(**plan.tenant.values)

            units_by_code = {}
            for row in plan.units:
                if row.existing is not None:
                    units_by_code[row.code] = row.existing
                    continue
                values = dict(row.values)
                values["tenant"] = tenant
                values["parent"] = units_by_code.get(row.parent_code)
                unit = OrganizationUnit.objects.using(using).create(**values)
                units_by_code[row.code] = unit

            created_positions = []
            for row in plan.positions:
                if row.existing is not None:
                    continue
                values = dict(row.values)
                values["tenant"] = tenant
                values["organization_unit"] = units_by_code[row.organization_unit_code]
                position = Position.objects.using(using).create(**values)
                created_positions.append(position)

            _verify_audit_entries(plan, created_positions, initial_log_pk, using)
            _assert_snapshots_unchanged(plan.snapshots, using)

            final_plan = _build_context_plan(using=using)
            if final_plan.conflicts or any(
                row.existing is None
                for row in [final_plan.tenant, *final_plan.units, *final_plan.positions]
            ):
                raise CommandError("Transacción revertida: la comprobación final no coincide.")
        return initial_counts
    except CommandError:
        raise
    except Exception:
        raise CommandError(
            "Transacción revertida por un error de base de datos o de auditlog."
        ) from None


def _resolve_database_file(connection, base_dir):
    if connection.alias != DATABASE_ALIAS:
        raise CommandError("Destino rechazado (database_alias).")
    settings_dict = connection.settings_dict
    if (
        settings_dict.get("ENGINE") != "django.db.backends.sqlite3"
        or connection.vendor != "sqlite"
    ):
        raise CommandError("Destino rechazado (database_engine).")

    raw_name = settings_dict.get("NAME")
    if not raw_name or str(raw_name).startswith("file:") or str(raw_name) == ":memory:":
        raise CommandError("Destino rechazado (database_name).")

    try:
        project_root = Path(base_dir).resolve(strict=True)
        authorized_path = (project_root / DATABASE_FILENAME).resolve(strict=True)
        file_stat = authorized_path.stat()
        configured_path = Path(raw_name).resolve(strict=True)
        authorized_path.relative_to(project_root)
        configured_path.relative_to(project_root)
    except (OSError, RuntimeError, ValueError, TypeError):
        raise CommandError("Destino rechazado (database_path).") from None

    if not S_ISREG(file_stat.st_mode) or not authorized_path.is_file():
        raise CommandError("Destino rechazado (database_file).")
    try:
        configured_stat = configured_path.stat()
    except OSError:
        raise CommandError("Destino rechazado (database_path).") from None
    if not S_ISREG(configured_stat.st_mode) or configured_path != authorized_path:
        raise CommandError("Destino rechazado (database_mismatch).")
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
            local_params["database"] = (
                f"file:{quote(str(authorized_path), safe='/')}?mode=rw"
            )
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


class Command(BaseCommand):
    help = "Prepara únicamente las filas de contexto de desarrollo que faltan."
    requires_system_checks = []
    requires_migrations_checks = False

    def add_arguments(self, parser):
        parser.add_argument("--tenant-code", required=True, choices=(TENANT_CODE,))
        parser.add_argument("--database", required=True, choices=(DATABASE_ALIAS,))
        parser.add_argument(
            "--check",
            action="store_true",
            help="Ejecuta el preflight completo sin escribir.",
        )

    def handle(self, *args, **options):
        tenant_code = options.get("tenant_code")
        database_alias = options.get("database")
        if tenant_code != TENANT_CODE:
            raise CommandError("Argumento rechazado (tenant_code).")
        if database_alias != DATABASE_ALIAS:
            raise CommandError("Argumento rechazado (database_alias).")

        connection = connections[database_alias]
        authorized_path = _resolve_database_file(connection, settings.BASE_DIR)
        _open_sqlite_mode_rw(connection, authorized_path)
        _verify_main_database(connection, authorized_path)

        counts = _prepare_context(check=options.get("check", False))
        mode = "Preflight sin escrituras" if options.get("check") else "Contexto creado"
        self.stdout.write(
            f"{mode}: tenant creados={counts['tenant_created_codes']} "
            f"reutilizados={counts['tenant_reused_codes']}; "
            f"unidades creadas={counts['units_created_codes']} "
            f"reutilizadas={counts['units_reused_codes']}; "
            f"puestos creados={counts['positions_created_codes']} "
            f"reutilizados={counts['positions_reused_codes']}; "
            f"armerías omitidas={counts['omitted_armory_codes']}."
        )
