import django.db.models.deletion
from django.db import migrations, models


MAPEO_MODELO_CALIBRE = {
    # 5.56X45
    'GALIL': '5.56X45', 'ACE 22': '5.56X45', 'ACE 23': '5.56X45',
    'ACE22': '5.56X45', 'ACE23': '5.56X45', 'GALIL ACE': '5.56X45',
    'SIG 540': '5.56X45', 'SIG SG 540': '5.56X45', 'SG540': '5.56X45',
    'SIG 543': '5.56X45', 'SIG SG 543': '5.56X45', 'SG543': '5.56X45',
    'ARAD': '5.56X45', 'IWI ARAD': '5.56X45',
    'FAD': '5.56X45',
    # 7.62X51
    'SIG 542': '7.62X51', 'SIG SG 542': '7.62X51', 'SG542': '7.62X51',
    'MARS': '7.62X51', 'MARS-H': '7.62X51', 'LMT': '7.62X51',
    'SSG 3000': '7.62X51', 'SSG3000': '7.62X51', 'SIG SSG': '7.62X51',
    'MAG': '7.62X51', 'FN MAG': '7.62X51',
    # 9X19
    'FAMAE SAF': '9X19', 'SAF': '9X19',
    'GLOCK': '9X19', 'GLOCK 17': '9X19', 'GLOCK 19': '9X19',
    'G17': '9X19', 'G19': '9X19',
    'CZ': '9X19',
    'FAMAE TORNADO': '9X19', 'TORNADO': '9X19', 'F1811': '9X19',
    # 8.6X70
    'APR338': '8.6X70', 'APR 338': '8.6X70', 'B&T APR': '8.6X70',
    'HECATE': '8.6X70', 'MINI HECATE': '8.6X70', 'PGM338': '8.6X70', 'PGM 338': '8.6X70',
    # 12.7X99
    'BARRETT': '12.7X99', 'M82': '12.7X99', 'M82A1': '12.7X99',
    'M2': '12.7X99', 'BROWNING M2': '12.7X99', 'BROWNING': '12.7X99',
    # FN MINIMI: NO mapear — tiene variantes 5.56 y 7.62, requiere revisión manual
    # 84MM
    'AT4': '84MM', 'CARL GUSTAF': '84MM', 'CARL GUSTAV': '84MM',
}


def backfill_calibre_arma(apps, schema_editor):
    Arma = apps.get_model('apipoligono', 'Arma')
    Calibre = apps.get_model('apipoligono', 'Calibre')

    calibre_cache = {c.code: c for c in Calibre.objects.all()}
    sin_mapeo = []

    for arma in Arma.objects.filter(calibre__isnull=True).only('id_arma', 'modelo_arma', 'numero_serie'):
        modelo_norm = (arma.modelo_arma or '').upper().strip()
        calibre_code = MAPEO_MODELO_CALIBRE.get(modelo_norm)
        if calibre_code and calibre_code in calibre_cache:
            arma.calibre = calibre_cache[calibre_code]
            arma.save(update_fields=['calibre'])
        else:
            sin_mapeo.append(arma.numero_serie or f'id={arma.id_arma}')

    if sin_mapeo:
        print(
            f'\n[WARNING] backfill_calibre_arma: {len(sin_mapeo)} arma(s) sin calibre '
            f'asignado (requieren revisión manual): {sin_mapeo}'
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('apipoligono', '0018_calibre'),
    ]

    operations = [
        migrations.AddField(
            model_name='arma',
            name='calibre',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='armas',
                to='apipoligono.calibre',
            ),
        ),
        migrations.AlterField(
            model_name='arma',
            name='tipo_arma',
            field=models.CharField(
                max_length=50,
                choices=[
                    ('fusil',         'Fusil de Asalto / Carabina'),
                    ('subfusil',      'Subfusil'),
                    ('pistola',       'Pistola'),
                    ('francotirador', 'Fusil de Precisión / Francotirador'),
                    ('ametralladora', 'Ametralladora'),
                    ('apoyo',         'Armamento de Apoyo'),
                ],
            ),
        ),
        migrations.RunPython(backfill_calibre_arma, noop_reverse),
    ]
