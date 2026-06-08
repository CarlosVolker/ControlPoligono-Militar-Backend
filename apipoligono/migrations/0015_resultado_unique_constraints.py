from django.db import migrations, models


def dedupe_resultados(apps, schema_editor):
    """
    Antes de aplicar las UniqueConstraints, eliminar duplicados existentes que
    impedirian la creacion del indice. Estrategia: por cada (fraccion, usuario),
    (fraccion, arma) y (fraccion, carril) dejar el de mayor id_resultado y borrar
    el resto. Es seguro porque mas adelante el sistema impide duplicados; estos
    solo pueden existir como bug pre-constraint.
    """
    ResultadoTiro = apps.get_model('apipoligono', 'ResultadoTiro')

    def _dedupe(group_fields):
        # Agrupa y deja solo el id_resultado mas alto por grupo.
        seen = {}
        ids_to_delete = []
        # Iterar ordenado para que el ultimo (mayor id) sobrescriba.
        for r in ResultadoTiro.objects.order_by('id_resultado').iterator():
            key = tuple(getattr(r, f) for f in group_fields)
            if any(k is None for k in key):
                continue  # respeta condition=numero_carril is not null
            if key in seen:
                ids_to_delete.append(seen[key])
            seen[key] = r.id_resultado
        if ids_to_delete:
            ResultadoTiro.objects.filter(id_resultado__in=ids_to_delete).delete()

    _dedupe(['id_fraccion_id', 'id_usuario_id'])
    _dedupe(['id_fraccion_id', 'id_arma_id'])
    _dedupe(['id_fraccion_id', 'numero_carril'])


def noop_reverse(apps, schema_editor):
    # No se puede deshacer un dedupe; quitar las constraints es suficiente para
    # revertir.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('apipoligono', '0014_usuario_is_temporary'),
    ]

    operations = [
        migrations.RunPython(dedupe_resultados, noop_reverse),
        migrations.AddConstraint(
            model_name='resultadotiro',
            constraint=models.UniqueConstraint(
                fields=['id_fraccion', 'id_usuario'],
                name='unique_fraccion_usuario',
            ),
        ),
        migrations.AddConstraint(
            model_name='resultadotiro',
            constraint=models.UniqueConstraint(
                fields=['id_fraccion', 'id_arma'],
                name='unique_fraccion_arma',
            ),
        ),
        migrations.AddConstraint(
            model_name='resultadotiro',
            constraint=models.UniqueConstraint(
                fields=['id_fraccion', 'numero_carril'],
                name='unique_fraccion_carril',
                condition=models.Q(numero_carril__isnull=False),
            ),
        ),
    ]
