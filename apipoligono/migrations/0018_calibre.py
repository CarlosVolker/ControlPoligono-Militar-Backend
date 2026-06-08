from django.db import migrations, models


CALIBRES_SEMILLA = [
    ('5.56X45',  '5.56×45mm NATO'),
    ('7.62X51',  '7.62×51mm NATO'),
    ('9X19',     '9×19mm Parabellum'),
    ('8.6X70',   '.338 Lapua Magnum'),
    ('12.7X99',  '.50 BMG (12.7×99mm NATO)'),
    ('84MM',     '84mm'),
]


def sembrar_calibres(apps, schema_editor):
    Calibre = apps.get_model('apipoligono', 'Calibre')
    for code, nombre in CALIBRES_SEMILLA:
        Calibre.objects.get_or_create(code=code, defaults={'nombre': nombre, 'is_active': True})


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('apipoligono', '0017_remove_legacy_user_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Calibre',
            fields=[
                ('id_calibre', models.AutoField(primary_key=True, serialize=False)),
                ('code', models.CharField(max_length=20, unique=True)),
                ('nombre', models.CharField(max_length=60)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ['code'],
            },
        ),
        migrations.RunPython(sembrar_calibres, noop_reverse),
    ]
