import json

from django.core.management.base import BaseCommand, CommandError

from apps.organizations.models import OrganizationUnit
from apps.tenants.models import Tenant


DEFAULT_MILITARY_TREE = [
    {
        "code": "CMD-1",
        "name": "Comando Principal",
        "unit_type": "command",
        "children": [
            {
                "code": "DIV-1",
                "name": "Primera Division",
                "unit_type": "division",
                "children": [
                    {
                        "code": "REG-1",
                        "name": "Regimiento 1",
                        "unit_type": "regiment",
                        "children": [
                            {
                                "code": "BAT-1",
                                "name": "Batallon 1",
                                "unit_type": "battalion",
                                "children": [
                                    {
                                        "code": "CIA-A",
                                        "name": "Compania A",
                                        "unit_type": "company",
                                        "children": [],
                                    }
                                ],
                            }
                        ],
                    }
                ],
            }
        ],
    }
]


class Command(BaseCommand):
    help = "Seeds tenant organization tree"

    def add_arguments(self, parser):
        parser.add_argument("--tenant-code", required=True)
        parser.add_argument("--from-json", default="")

    def handle(self, *args, **options):
        tenant_code = options["tenant_code"]
        json_path = options["from_json"]

        try:
            tenant = Tenant.objects.get(code=tenant_code)
        except Tenant.DoesNotExist as exc:
            raise CommandError(f"Tenant '{tenant_code}' does not exist") from exc

        tree_data = DEFAULT_MILITARY_TREE
        if json_path:
            try:
                with open(json_path, "r", encoding="utf-8") as file_handle:
                    tree_data = json.load(file_handle)
            except Exception as exc:
                raise CommandError(f"Unable to read json file: {exc}") from exc

        created = 0
        updated = 0

        def upsert_node(node, parent=None):
            nonlocal created, updated
            defaults = {
                "name": node["name"],
                "unit_type": node.get("unit_type", "other"),
                "parent": parent,
                "is_active": True,
            }
            obj, was_created = OrganizationUnit.objects.update_or_create(
                tenant=tenant,
                code=node["code"],
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

            for child in node.get("children", []):
                upsert_node(child, parent=obj)

        for root_node in tree_data:
            upsert_node(root_node)

        self.stdout.write(self.style.SUCCESS(f"Tenant: {tenant.code}"))
        self.stdout.write(self.style.SUCCESS(f"Organization units created: {created}"))
        self.stdout.write(self.style.SUCCESS(f"Organization units updated: {updated}"))
