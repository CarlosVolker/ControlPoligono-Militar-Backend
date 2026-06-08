from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apipoligono', '0013_leccion_unidades_participantes'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='is_temporary',
            field=models.BooleanField(default=False),
        ),
    ]
