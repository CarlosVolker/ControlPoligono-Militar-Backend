from django.db import migrations, models


def force_military(apps, schema_editor):
    """Cualquier tenant con context='civil' (o cualquier otro valor) pasa a
    'military'. Es seguro porque el modo civil fue eliminado del sistema."""
    Tenant = apps.get_model('tenants', 'Tenant')
    Tenant.objects.exclude(context='military').update(context='military')


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(force_military, noop_reverse),
        migrations.AlterField(
            model_name='tenant',
            name='context',
            field=models.CharField(
                choices=[('military', 'Military')],
                default='military',
                max_length=20,
            ),
        ),
    ]
