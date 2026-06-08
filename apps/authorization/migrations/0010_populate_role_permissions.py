"""
Data migration: convierte PermissionRule existentes en RolePermission,
usando el mapa resource:action → permission_code definido en permissions.py.

Para roles con wildcard (*:*), se crean RolePermissions para TODOS los permisos
del catálogo (equivalente al bypass total).
"""
from django.db import migrations


# Mapa de equivalencias: (resource, action) → permission_code
# Los pares sin equivalencia directa se omiten (se loguea un warning).
RESOURCE_ACTION_TO_PERMISSION = {
    ('user', 'create'):               'create_users',
    ('user', 'read'):                 'view_personnel_basic',
    ('user', 'update'):               'update_users',
    ('user', 'delete'):               'disable_users',
    ('user', 'read_own'):             'view_self',
    ('organization_unit', 'read'):    'view_unit',
    ('organization_unit', 'create'):  'create_unit',
    ('organization_unit', 'update'):  'update_unit',
    ('organization_unit', 'delete'):  'delete_unit',
    ('weapon', 'read'):               'view_warehouse',
    ('weapon', 'create'):             'create_warehouse_records',
    ('weapon', 'update'):             'update_warehouse_records',
    ('weapon', 'delete'):             'delete_warehouse_records',
    ('armory', 'read'):               'view_warehouse',
    ('armory', 'create'):             'create_warehouse_records',
    ('armory', 'update'):             'update_warehouse_records',
    ('armory', 'delete'):             'delete_warehouse_records',
    ('range', 'read'):                'view_unit',
    ('range', 'create'):              'create_shooting_lessons',
    ('range', 'update'):              'update_shooting_lessons',
    ('shooting_session', 'create'):        'create_shooting_lessons',
    ('shooting_session', 'read'):          'view_unit',
    ('shooting_session', 'read_summary'):  'view_unit',
    ('shooting_session', 'update'):        'update_shooting_lessons',
    ('shooting_session', 'delete'):        'delete_shooting_lessons',
    ('shooting_fraction', 'create'):  'create_shooting_lessons',
    ('shooting_fraction', 'read'):    'view_unit',
    ('shooting_fraction', 'update'):  'update_shooting_lessons',
    ('shooting_fraction', 'delete'):  'delete_shooting_lessons',
    ('shooting_result', 'create'):    'score_shooters',
    ('shooting_result', 'read'):      'view_personnel_basic',
    ('shooting_result', 'read_own'):  'view_self',
    ('shooting_result', 'update'):    'score_shooters',
    ('shooting_result', 'delete'):    'score_shooters',
    ('shooting_result', 'read_summary'): 'view_unit',
    ('shooting_result', 'export'):    'view_personnel_full',
    ('position', 'read'):             'view_unit',
    ('position', 'create'):           'assign_positions',
    ('position', 'update'):           'assign_positions',
    ('position', 'delete'):           'revoke_positions',
}


def populate_role_permissions(apps, schema_editor):
    PermissionRule = apps.get_model('authorization', 'PermissionRule')
    Permission = apps.get_model('authorization', 'Permission')
    RolePermission = apps.get_model('authorization', 'RolePermission')

    all_perms = {p.code: p for p in Permission.objects.all()}

    for rule in PermissionRule.objects.select_related('role').filter(allowed=True):
        # Wildcard: asignar TODOS los permisos del catálogo al rol
        if rule.resource == '*' and rule.action == '*':
            for perm in all_perms.values():
                RolePermission.objects.get_or_create(
                    role=rule.role,
                    permission=perm,
                    defaults={'allowed': True},
                )
            continue

        perm_code = RESOURCE_ACTION_TO_PERMISSION.get((rule.resource, rule.action))
        if perm_code is None:
            continue

        perm = all_perms.get(perm_code)
        if perm is None:
            continue

        RolePermission.objects.get_or_create(
            role=rule.role,
            permission=perm,
            defaults={'allowed': True},
        )


def depopulate_role_permissions(apps, schema_editor):
    RolePermission = apps.get_model('authorization', 'RolePermission')
    RolePermission.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('authorization', '0009_role_position_permissions_and_override_update'),
    ]

    operations = [
        migrations.RunPython(populate_role_permissions, reverse_code=depopulate_role_permissions),
    ]
