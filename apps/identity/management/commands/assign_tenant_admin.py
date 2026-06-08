from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from apps.authorization.models import Role, ScopePolicy
from apps.identity.models import Account, Assignment, Person, Position
from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant


class Command(BaseCommand):
    help = "Assigns tenant admin role to a user"

    def add_arguments(self, parser):
        parser.add_argument("--tenant-code", required=True)
        parser.add_argument("--username", required=True)
        parser.add_argument("--scope", default="own_unit_descendants")

    def handle(self, *args, **options):
        tenant_code = options["tenant_code"]
        username = options["username"]
        scope_code = options["scope"]

        try:
            tenant = Tenant.objects.get(code=tenant_code)
        except Tenant.DoesNotExist as exc:
            raise CommandError(f"Tenant '{tenant_code}' not found") from exc

        User = get_user_model()
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist as exc:
            raise CommandError(f"User '{username}' not found") from exc

        role, _ = Role.objects.get_or_create(
            code="tenant_admin",
            defaults={"name": "Tenant Admin", "is_active": True},
        )
        scope, _ = ScopePolicy.objects.get_or_create(
            code=scope_code,
            defaults={"name": scope_code.replace("_", " ").title()},
        )

        person_document = getattr(user, "rut", None) or user.username
        person_name = user.get_full_name() or user.username
        person_email = getattr(user, "correo", "") or user.email or ""
        person, _ = Person.objects.get_or_create(
            document_id=person_document,
            defaults={
                "full_name": person_name,
                "email": person_email,
                "is_active": user.is_active,
            },
        )

        account, _ = Account.objects.get_or_create(
            user=user,
            defaults={
                "person": person,
                "tenant": tenant,
                "is_active": user.is_active,
            },
        )

        if account.tenant_id != tenant.id:
            raise CommandError(
                f"User '{username}' already belongs to tenant '{account.tenant.code}'. "
                "Use a different user for this tenant."
            )

        # Encontrar la unidad raíz del tenant para la posición de tenant_admin
        root_unit = OrganizationUnit.objects.filter(
            tenant=tenant, parent__isnull=True, is_active=True,
        ).first()
        if root_unit is None:
            raise CommandError(f"Tenant '{tenant_code}' no tiene unidades. Crear primero con seed_org_tree.")

        position, _ = Position.objects.get_or_create(
            tenant=tenant,
            code=f"TENANT-ADMIN-{tenant_code}",
            defaults={
                'name': f"Administrador Institucional {tenant.name}",
                'organization_unit': root_unit,
                'role': role,
                'scope_policy': scope,
                'is_active': True,
            },
        )

        account.assignments.filter(is_active=True, position__role=role).update(is_primary=False)

        assignment, created = Assignment.objects.get_or_create(
            account=account,
            position=position,
            defaults={"is_primary": True, "is_active": True},
        )

        if not created:
            assignment.is_primary = True
            assignment.is_active = True
            assignment.save(update_fields=["is_primary", "is_active"])

        self.stdout.write(self.style.SUCCESS(f"Tenant admin assigned: {user.username} -> {tenant.code}"))
