from django.db import migrations


CIVIL_ROLE_CODES = ('dueno_organizacion', 'operador_civil')


def remove_civil_roles(apps, schema_editor):
    """Borra los Roles civiles y todos sus rastros:
    - PermissionRules asociadas (CASCADE via FK).
    - Assignments activos que apunten a esos roles → primero los desactiva,
      luego se eliminan junto con el rol (PROTECT en Assignment.role obliga a
      desactivar/borrar a mano antes de borrar el Role).

    Es seguro porque el modo civil ya no existe en el sistema.
    """
    Role = apps.get_model('authorization', 'Role')
    PermissionRule = apps.get_model('authorization', 'PermissionRule')
    Assignment = apps.get_model('identity', 'Assignment')

    civil_roles = Role.objects.filter(code__in=CIVIL_ROLE_CODES)
    civil_role_ids = list(civil_roles.values_list('id', flat=True))
    if not civil_role_ids:
        return

    Assignment.objects.filter(role_id__in=civil_role_ids).delete()
    PermissionRule.objects.filter(role_id__in=civil_role_ids).delete()
    civil_roles.delete()


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('authorization', '0004_remap_legacy_scopes'),
        ('identity', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(remove_civil_roles, noop_reverse),
    ]
