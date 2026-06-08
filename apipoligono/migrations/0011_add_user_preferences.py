from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apipoligono', '0010_arma_organization_unit_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='theme',
            field=models.CharField(
                choices=[('nexus-light', 'Nexus Light'), ('nexus-dark', 'Nexus Dark')],
                default='nexus-light',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='usuario',
            name='palette',
            field=models.CharField(
                choices=[
                    ('corporate-blue', 'Corporate Blue'),
                    ('military-teal', 'Military Teal'),
                    ('neutral-slate', 'Neutral Slate'),
                ],
                default='corporate-blue',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='usuario',
            name='density',
            field=models.CharField(
                choices=[('comfortable', 'Comfortable'), ('compact', 'Compact')],
                default='comfortable',
                max_length=20,
            ),
        ),
    ]
