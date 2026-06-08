import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apipoligono', '0019_arma_calibre_tipo_choices'),
        ('organizations', '0001_initial'),
        ('tenants', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='EjercicioMilitar',
            fields=[
                ('id_ejercicio', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=120)),
                ('fecha', models.DateField()),
                ('zona', models.CharField(blank=True, max_length=150)),
                ('tipo_ejercicio', models.CharField(
                    blank=True,
                    choices=[
                        ('asalto',     'Asalto'),
                        ('defensa',    'Defensa'),
                        ('movimiento', 'Movimiento'),
                        ('mixto',      'Mixto'),
                        ('otro',       'Otro'),
                    ],
                    max_length=30,
                )),
                ('numero_orden', models.CharField(blank=True, max_length=15, null=True)),
                ('fecha_orden', models.DateField(blank=True, null=True)),
                ('observaciones', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='ejercicios',
                    to='tenants.tenant',
                )),
                ('organization_unit', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='ejercicios',
                    to='organizations.organizationunit',
                )),
                ('unidades_participantes', models.ManyToManyField(
                    blank=True,
                    related_name='ejercicios_donde_participa',
                    to='organizations.organizationunit',
                )),
            ],
        ),
        migrations.CreateModel(
            name='ConsumoMunicion',
            fields=[
                ('id_consumo', models.AutoField(primary_key=True, serialize=False)),
                ('tipo_arma', models.CharField(
                    choices=[
                        ('fusil',         'Fusil de Asalto / Carabina'),
                        ('subfusil',      'Subfusil'),
                        ('pistola',       'Pistola'),
                        ('francotirador', 'Fusil de Precisión / Francotirador'),
                        ('ametralladora', 'Ametralladora'),
                        ('apoyo',         'Armamento de Apoyo'),
                    ],
                    max_length=50,
                )),
                ('modelo_arma', models.CharField(blank=True, max_length=50)),
                ('cantidad_armas', models.PositiveIntegerField(blank=True, null=True)),
                ('cantidad_tiros', models.PositiveIntegerField()),
                ('es_aproximado', models.BooleanField(default=True)),
                ('observaciones', models.TextField(blank=True)),
                ('tenant', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='consumos_municion',
                    to='tenants.tenant',
                )),
                ('ejercicio', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='consumos',
                    to='apipoligono.ejerciciomilitar',
                )),
                ('calibre', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='consumos',
                    to='apipoligono.calibre',
                )),
            ],
        ),
        migrations.CreateModel(
            name='ConsumoArma',
            fields=[
                ('id_consumo_arma', models.AutoField(primary_key=True, serialize=False)),
                ('cantidad_tiros', models.PositiveIntegerField()),
                ('observaciones', models.CharField(blank=True, max_length=150)),
                ('tenant', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='consumos_arma',
                    to='tenants.tenant',
                )),
                ('consumo', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='detalle_armas',
                    to='apipoligono.consumomunicion',
                )),
                ('arma', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='consumos_ejercicio',
                    to='apipoligono.arma',
                )),
            ],
        ),
        migrations.AddConstraint(
            model_name='consumoarma',
            constraint=models.UniqueConstraint(fields=['consumo', 'arma'], name='unique_consumo_arma'),
        ),
    ]
