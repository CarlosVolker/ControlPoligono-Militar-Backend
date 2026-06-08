"""
Crea o actualiza el catálogo de Permission desde PERMISSION_CATALOG.
Idempotente: puede correrse múltiples veces sin efectos colaterales.

Uso:
    python manage.py init_permissions
    python manage.py init_permissions --dry-run
"""
from django.core.management.base import BaseCommand

from apps.authorization.models import PERMISSION_CATALOG, Permission


class Command(BaseCommand):
    help = 'Inicializa o actualiza el catálogo de permisos atómicos del sistema.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué se crearía sin crear nada.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        created = 0
        updated = 0

        for code, name, category in PERMISSION_CATALOG:
            if dry_run:
                exists = Permission.objects.filter(code=code).exists()
                status = 'existente' if exists else 'NUEVO'
                self.stdout.write(f'  [{status}] {code} ({category})')
                if not exists:
                    created += 1
                continue

            _, was_created = Permission.objects.update_or_create(
                code=code,
                defaults={'name': name, 'category': category, 'is_active': True},
            )
            if was_created:
                created += 1
            else:
                updated += 1

        if dry_run:
            self.stdout.write(self.style.WARNING(f'Dry-run: {created} permisos nuevos se crearían.'))
            return

        self.stdout.write(self.style.SUCCESS(
            f'Catálogo listo: {created} creados, {updated} actualizados. '
            f'Total: {Permission.objects.count()} permisos.'
        ))
