from django.db import migrations
from apps.authorization.models import PERMISSION_CATALOG


def populate_catalog(apps, schema_editor):
    Permission = apps.get_model('authorization', 'Permission')
    for code, name, category in PERMISSION_CATALOG:
        Permission.objects.get_or_create(
            code=code,
            defaults={'name': name, 'category': category, 'is_active': True},
        )


def depopulate_catalog(apps, schema_editor):
    Permission = apps.get_model('authorization', 'Permission')
    codes = [code for code, _, _ in PERMISSION_CATALOG]
    Permission.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('authorization', '0007_permission_model_and_role_tenant'),
    ]

    operations = [
        migrations.RunPython(populate_catalog, reverse_code=depopulate_catalog),
    ]
