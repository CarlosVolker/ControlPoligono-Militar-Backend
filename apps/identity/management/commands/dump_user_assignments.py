from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.authorization.models import RolePermission
from apps.identity.models import Account, Assignment


class Command(BaseCommand):
    help = (
        'Diagnóstico: muestra Assignments, roles, scope, unidad y permisos efectivos '
        'de un usuario dado su RUT. Sirve para entender por qué recibe 403.'
    )

    def add_arguments(self, parser):
        parser.add_argument('rut', help='RUT del usuario a inspeccionar (ej: 12345678-9)')

    def handle(self, *args, **options):
        rut = options['rut']
        User = get_user_model()
        user = User.objects.filter(rut=rut).first()
        if user is None:
            self.stdout.write(self.style.ERROR(f'No existe usuario con RUT {rut}'))
            return

        self.stdout.write(self.style.SUCCESS(
            f'Usuario: {user.rut} ({user.apellido_paterno}, {user.nombre}) - '
            f'is_active={user.is_active} is_temporary={getattr(user, "is_temporary", False)}'
        ))

        accounts = Account.objects.filter(user=user).select_related('tenant', 'person')
        if not accounts.exists():
            self.stdout.write(self.style.WARNING('Sin Accounts.'))
            return

        for account in accounts:
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS(
                f'Account #{account.id} en tenant "{account.tenant.code}" (active={account.is_active})'
            ))

            assignments = Assignment.objects.filter(account=account).select_related(
                'position__role', 'position__scope_policy', 'position__organization_unit',
            )
            if not assignments.exists():
                self.stdout.write('  Sin Assignments.')
                continue

            for a in assignments:
                role = a.effective_role
                scope = a.effective_scope
                unit = a.effective_unit
                marker = '*' if a.is_primary else ' '
                state = 'activo' if a.is_active else 'inactivo'
                self.stdout.write(
                    f'  [{marker}{state}] pos={a.position.code:30s} '
                    f'role={role.code if role else "?":25s} '
                    f'scope={scope.code if scope else "?":25s} '
                    f'unit={unit.code if unit else "?"}'
                )

            # Permisos efectivos vía RolePermission
            active_role_ids = {
                a.effective_role.id
                for a in assignments.filter(is_active=True)
                if a.effective_role
            }
            if active_role_ids:
                perms = RolePermission.objects.filter(
                    role_id__in=active_role_ids, allowed=True
                ).select_related('role', 'permission').order_by('role__code', 'permission__category', 'permission__code')
                self.stdout.write('')
                self.stdout.write('  Permisos efectivos (por role → permission_code):')
                for p in perms:
                    self.stdout.write(f'    {p.role.code:25s}  [{p.permission.category}] {p.permission.code}')
