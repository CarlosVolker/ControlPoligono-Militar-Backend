"""
DEPRECADO: este comando duplicaba el catalogo de roles del antiguo
init_access_model en espanol. El catalogo unico vive ahora en
`apps.identity.management.commands.init_access_model` con todos los roles
(en espanol) + descripciones legibles.

Si necesitas re-seedear, usa:

    python manage.py init_access_model --tenant-code <code> --reset
"""

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'DEPRECADO. Usa init_access_model en su lugar.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING(
            'seed_military_access_matrix esta deprecado.\n'
            'El catalogo unico vive en init_access_model.\n'
            '\n'
            'Ejecuta:\n'
            '    python manage.py init_access_model --tenant-code <code> --reset\n'
        ))
