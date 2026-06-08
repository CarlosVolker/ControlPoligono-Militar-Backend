from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apipoligono', '0012_user_password_flags'),
        ('organizations', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='lecciontiro',
            name='unidades_participantes',
            field=models.ManyToManyField(
                blank=True,
                related_name='lecciones_donde_participa',
                to='organizations.organizationunit',
            ),
        ),
    ]
