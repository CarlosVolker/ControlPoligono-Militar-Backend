"""
Data migration: remapea roles legacy (en ingles + duplicados del antiguo
seed_military_access_matrix) al catalogo unificado en espanol.

Tambien limpia PermissionRules sobre recursos sin viewset implementado
(armory/report/profile).
"""

from django.db import migrations


# legacy_code -> nuevo_code
ROLE_RENAMES = {
    'unit_sysadmin': 'admin_unidad',
    'unit_commander': 'comandante_unidad',
    'armory_manager': 'encargado_almacen',
    'range_operator': 'oficial_tiro',
    's3_operator': 'oficial_tiro',
    's3_operador': 'oficial_tiro',          # del seed_military_access_matrix legacy
    'e3_operador': 'oficial_observador',
    'comandante_compania': 'comandante_unidad',
    'comandante_batallon': 'comandante_unidad',
    'civil_owner': 'dueno_organizacion',
    'civil_staff': 'operador_civil',
    'shooter': 'tirador',
}

# Recursos definidos en seeds antiguos pero sin viewset implementado.
# Sus PermissionRules se borran porque nunca se evaluan en runtime.
ORPHAN_RESOURCES = ('armory', 'report', 'profile')


def remap_roles(apps, schema_editor):
    Role = apps.get_model('authorization', 'Role')
    Assignment = apps.get_model('identity', 'Assignment')
    PermissionRule = apps.get_model('authorization', 'PermissionRule')

    # 1) Asegurar destino: cada rol nuevo debe existir antes de remapear.
    #    init_access_model llenara name/description completos despues.
    for new_code in set(ROLE_RENAMES.values()):
        Role.objects.get_or_create(
            code=new_code,
            defaults={'name': new_code, 'is_active': True},
        )

    # 2) Por cada rol legacy: redirigir Assignments al nuevo, borrar rules
    #    legacy y borrar el rol mismo.
    for legacy_code, new_code in ROLE_RENAMES.items():
        legacy_role = Role.objects.filter(code=legacy_code).first()
        if not legacy_role:
            continue
        new_role = Role.objects.filter(code=new_code).first()
        if not new_role or legacy_role.pk == new_role.pk:
            continue

        Assignment.objects.filter(role=legacy_role).update(role=new_role)
        PermissionRule.objects.filter(role=legacy_role).delete()
        legacy_role.delete()

    # 3) Borrar rules sobre recursos huerfanos (armory/report/profile).
    PermissionRule.objects.filter(resource__in=ORPHAN_RESOURCES).delete()


def noop(apps, schema_editor):
    """Reversion no soportada (no podemos recuperar los nombres legacy)."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('authorization', '0002_accessaudit'),
        ('identity', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(remap_roles, noop),
    ]
