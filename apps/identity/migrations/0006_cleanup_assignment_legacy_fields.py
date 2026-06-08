"""
FASE 5: elimina los campos legacy de Assignment y hace position NOT NULL.

Guard: falla si hay Assignments activos sin position para evitar pérdida de datos.
"""
from django.db import migrations, models
import django.db.models.deletion


def guard_no_orphan_assignments(apps, schema_editor):
    Assignment = apps.get_model('identity', 'Assignment')
    orphans = Assignment.objects.filter(position__isnull=True, is_active=True).count()
    if orphans > 0:
        raise Exception(
            f'FASE 5 bloqueada: hay {orphans} Assignments activos sin Position. '
            'Correr init_access_model y crear_master primero.'
        )
    # También desactivar los inactivos sin position para que la migración no falle
    Assignment.objects.filter(position__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('identity', '0005_populate_unit_membership'),
    ]

    operations = [
        migrations.RunPython(guard_no_orphan_assignments, migrations.RunPython.noop),

        migrations.RemoveField(model_name='assignment', name='role'),
        migrations.RemoveField(model_name='assignment', name='scope_policy'),
        migrations.RemoveField(model_name='assignment', name='organization_unit'),

        migrations.AlterField(
            model_name='assignment',
            name='position',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='holders',
                to='identity.position',
            ),
        ),
    ]
