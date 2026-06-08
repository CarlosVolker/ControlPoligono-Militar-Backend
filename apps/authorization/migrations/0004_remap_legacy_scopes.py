"""
Data migration: remapea scopes legacy (en ingles) a los del catalogo unificado
en espanol. Tras esta migracion, init_access_model --reset puede borrar los
scopes obsoletos sin romper FK protegidas.
"""

from django.db import migrations


# legacy_scope_code -> nuevo_scope_code
SCOPE_RENAMES = {
    'self_only': 'solo_propio',
    'own_unit': 'unidad_propia',
    'own_unit_descendants': 'unidad_y_descendientes',
    'aggregate_only': 'solo_agregado',
    # detail_read: se decide ahora a nivel de regla, no de scope. Mapeamos a
    # solo_propio para preservar al menos el ambito mas conservador.
    'detail_read': 'solo_propio',
    # write_limited nunca se uso en logica - mapeamos a unidad_propia para mantener
    # las FK validas (los Assignments quedaran "limitados a su unidad" por defecto).
    'write_limited': 'unidad_propia',
}


def remap_scopes(apps, schema_editor):
    ScopePolicy = apps.get_model('authorization', 'ScopePolicy')
    Assignment = apps.get_model('identity', 'Assignment')

    # 1) Asegurar destino: cada scope nuevo debe existir antes de remapear.
    for new_code in set(SCOPE_RENAMES.values()):
        ScopePolicy.objects.get_or_create(
            code=new_code, defaults={'name': new_code}
        )

    # 2) Por cada scope legacy: redirigir Assignments al nuevo y borrar el legacy.
    for legacy_code, new_code in SCOPE_RENAMES.items():
        legacy_scope = ScopePolicy.objects.filter(code=legacy_code).first()
        if not legacy_scope:
            continue
        new_scope = ScopePolicy.objects.filter(code=new_code).first()
        if not new_scope or legacy_scope.pk == new_scope.pk:
            continue
        Assignment.objects.filter(scope_policy=legacy_scope).update(scope_policy=new_scope)
        legacy_scope.delete()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('authorization', '0003_remap_legacy_roles'),
        ('identity', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(remap_scopes, noop),
    ]
