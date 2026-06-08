"""
Crea (o actualiza) la cuenta MASTER del sistema. Es la cuenta del desarrollador
o del administrador raiz: tiene rol `super_admin` y bypass de TODOS los chequeos
de permisos (incluyendo overrides DENY).

Reservada para uso administrativo. NO debe asignarse a personal operativo.

Uso:
    python manage.py crear_master --rut 99999999-9 --password Dev1234 \\
        --tenant-code ejercito-demo
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.authorization.models import Role
from apps.identity.models import Account, Assignment, Person, Position, UnitMembership
from apps.tenants.models import Tenant


MASTER_POSITION_CODE = 'MASTER'
MASTER_POSITION_NAME = 'Cuenta MASTER del sistema (acceso total)'


class Command(BaseCommand):
    help = 'Crea o actualiza la cuenta MASTER (super_admin) del tenant.'

    def add_arguments(self, parser):
        parser.add_argument('--rut', required=True, help='RUT (sirve como username/login).')
        parser.add_argument('--password', required=True, help='Contrasena en plano (se hashea).')
        parser.add_argument('--tenant-code', required=True, help='Tenant donde queda enlazada.')
        parser.add_argument('--nombre', default='Master', help='Nombre del usuario.')
        parser.add_argument('--apellido-paterno', default='Admin', help='Apellido paterno.')
        parser.add_argument('--apellido-materno', default='', help='Apellido materno.')
        parser.add_argument('--correo', default='master@local', help='Correo del usuario.')

    def handle(self, *args, **options):
        rut = options['rut']
        password = options['password']
        tenant_code = options['tenant_code']

        tenant = Tenant.objects.filter(code=tenant_code, is_active=True).first()
        if tenant is None:
            raise CommandError(
                f"Tenant '{tenant_code}' no existe. Crealo antes con init_access_model."
            )

        super_admin_role = Role.objects.filter(code='super_admin').first()
        if super_admin_role is None:
            raise CommandError(
                "Rol 'super_admin' no existe. Corre primero: python manage.py init_access_model"
            )

        # Position MASTER del tenant. NO tiene organization_unit porque opera
        # globalmente. Para satisfacer el NOT NULL de Position.organization_unit
        # usamos cualquier unidad raiz del tenant; si no hay, error explicito.
        from apps.organizations.models import OrganizationUnit
        root_unit = OrganizationUnit.objects.filter(
            tenant=tenant, parent__isnull=True, is_active=True,
        ).first()
        if root_unit is None:
            raise CommandError(
                f"Tenant '{tenant_code}' no tiene unidades raiz. Crea al menos una unidad "
                f"organizacional antes (ej: con seed_units o via admin)."
            )

        master_position, _ = Position.objects.update_or_create(
            tenant=tenant,
            code=MASTER_POSITION_CODE,
            defaults={
                'name': MASTER_POSITION_NAME,
                'organization_unit': root_unit,
                'role': super_admin_role,
                'scope_policy': None,
                'description': 'Cuenta de administracion raiz. Bypass total de permisos.',
                'is_active': True,
                'is_unique_holder': True,
            },
        )

        User = get_user_model()
        user, created = User.objects.update_or_create(
            rut=rut,
            defaults={
                'username': rut,
                'nombre': options['nombre'],
                'apellido_paterno': options['apellido_paterno'],
                'apellido_materno': options['apellido_materno'],
                'correo': options['correo'],
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
                'must_change_password': False,
                'password': make_password(password),
            },
        )

        person, _ = Person.objects.get_or_create(
            document_id=rut,
            defaults={
                'full_name': f"{options['apellido_paterno']} {options['apellido_materno']}, {options['nombre']}".strip(),
                'email': options['correo'],
                'is_active': True,
            },
        )

        account, _ = Account.objects.get_or_create(
            user=user,
            defaults={'person': person, 'tenant': tenant, 'is_active': True},
        )

        # Si ya hay otro holder activo de MASTER, cesarlo (single MASTER policy).
        master_position.holders.filter(is_active=True).exclude(account=account).update(
            is_active=False, is_primary=False, ends_at=timezone.now(),
        )

        Assignment.objects.update_or_create(
            account=account,
            position=master_position,
            defaults={
                'is_primary': True,
                'is_active': True,
                'starts_at': timezone.now(),
                'ends_at': None,
            },
        )

        # Crear/actualizar la pertenencia orgánica del master a la unidad raíz.
        UnitMembership.objects.update_or_create(
            account=account,
            unit=root_unit,
            defaults={
                'tenant': tenant,
                'is_primary': True,
                'is_active': True,
                'starts_at': timezone.now(),
            },
        )

        verb = 'creada' if created else 'actualizada'
        self.stdout.write(self.style.SUCCESS(f'Cuenta MASTER {verb}.'))
        self.stdout.write(f'  RUT:        {rut}')
        self.stdout.write(f'  Contrasena: {password}')
        self.stdout.write(f'  Tenant:     {tenant_code}')
        self.stdout.write(f'  Posicion:   {MASTER_POSITION_CODE} (acceso total / bypass)')
        self.stdout.write(self.style.WARNING(
            '  IMPORTANTE: esta cuenta ignora overrides DENY. No la asignes a personal operativo.'
        ))
