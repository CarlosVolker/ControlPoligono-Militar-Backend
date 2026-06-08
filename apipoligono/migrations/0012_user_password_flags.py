from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apipoligono', '0011_add_user_preferences'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='must_change_password',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='usuario',
            name='password_changed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
