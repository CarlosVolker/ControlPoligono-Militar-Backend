"""
FASE 5: elimina el modelo PermissionRule, reemplazado por RolePermission.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('authorization', '0010_populate_role_permissions'),
    ]

    operations = [
        migrations.DeleteModel(name='PermissionRule'),
    ]
