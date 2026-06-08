from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.authorization.models import Permission, Role, RolePermission, ScopePolicy
from apps.authorization.permissions import RESOURCE_ACTION_TO_PERMISSION
from apps.identity.models import Account, Person
from apps.tenants.models import Tenant


# =============================================================================
# Catalogo unificado en espanol con descripciones legibles.
# Reemplaza el set en ingles + el set duplicado de seed_military_access_matrix.
# =============================================================================

DEFAULT_ROLES = [
    (
        'super_admin',
        'Super Administrador (Dev)',
        'Cuenta de desarrollo y pruebas. Acceso total a todo, en todos los tenants. '
        'Identico a tenant_admin pero marcado como cuenta tecnica para distinguirla '
        'de las cuentas operativas reales.',
    ),
    (
        'tenant_admin',
        'Administrador Institucional',
        'Jefe de Sistemas de la institucion. Crea unidades raiz, asigna roles SICE '
        'por regimiento, audita el sistema completo del tenant.',
    ),
    (
        'admin_unidad',
        'Administrador de Unidad (SICE)',
        'Encargado de informatica de un regimiento o cuartel. Crea sub-unidades dentro '
        'de su rama del arbol, da de alta usuarios y asigna sus roles funcionales.',
    ),
    (
        'comandante_unidad',
        'Comandante de Unidad',
        'Comandante de regimiento, batallon o compania. Lee resultados detallados y '
        'resumenes de su unidad y todas las unidades subordinadas.',
    ),
    (
        'oficial_tiro',
        'Oficial de Tiro (S-3 / Range Operator)',
        'Planifica lecciones de tiro, crea fracciones, agrega tiradores, registra '
        'resultados. Unifica el rol S-3 (planificacion) y el de operador de poligono '
        '(ejecucion).',
    ),
    (
        'oficial_observador',
        'Oficial Observador (E-3)',
        'Lee resumenes y reportes consolidados de la unidad. No edita.',
    ),
    (
        'encargado_almacen',
        'Encargado de Almacen',
        'Gestiona el inventario de armamento de su unidad: alta, baja y edicion de armas.',
    ),
    (
        'tirador',
        'Tirador',
        'Rol implicito de TODO usuario. Permite ver su propio perfil y sus propios '
        'resultados de tiro. Se asigna automaticamente al crear cualquier usuario.',
    ),
]

DEFAULT_SCOPES = [
    (
        'solo_propio',
        'Solo datos propios',
        'El usuario unicamente accede a informacion que le pertenece (su perfil, '
        'sus propios resultados de tiro).',
    ),
    (
        'unidad_propia',
        'Su unidad',
        'Acceso restringido a la unidad organizacional asignada. NO incluye sub-unidades.',
    ),
    (
        'unidad_y_descendientes',
        'Su unidad y dependientes',
        'Acceso a la unidad asignada y a todas las unidades subordinadas en el arbol '
        '(companias de un batallon, batallones de un regimiento, etc.).',
    ),
    (
        'solo_agregado',
        'Solo datos agregados',
        'Solo ve metricas resumidas (totales, conteos). NO accede al detalle individual '
        'de cada resultado.',
    ),
    (
        'todo_recinto',
        'Todo el recinto',
        'Acceso a TODAS las unidades del recinto militar asignado al puesto, '
        'independientemente de su jerarquía de mando. Solo válido cuando la '
        'Position tiene un Recinto asignado.',
    ),
]

# Solo recursos REALES con viewset implementado:
#   user, organization_unit, weapon, range, shooting_session, shooting_fraction,
#   shooting_result.
# Acciones: create / read / update / delete + custom: read_summary, read_own, export.
DEFAULT_PERMISSIONS = {
    'super_admin': [('*', '*', True)],
    'tenant_admin': [('*', '*', True)],
    'admin_unidad': [
        ('user', 'create', True),
        ('user', 'read', True),
        ('user', 'update', True),
        ('user', 'delete', True),
        ('organization_unit', 'create', True),
        ('organization_unit', 'read', True),
        ('organization_unit', 'update', True),
        ('organization_unit', 'delete', True),
        ('armory', 'read', True),
        ('armory', 'create', True),
        ('armory', 'update', True),
        ('position', 'create', True),
        ('position', 'read', True),
        ('position', 'update', True),
        ('position', 'delete', True),
        ('recinto', 'read', True),
        ('recinto', 'create', True),
        ('recinto', 'update', True),
        ('recinto', 'delete', True),
    ],
    'comandante_unidad': [
        ('organization_unit', 'read', True),
        ('armory', 'read', True),
        ('weapon', 'read', True),
        ('position', 'read', True),
        ('recinto', 'read', True),
        ('shooting_result', 'read', True),
        ('shooting_result', 'read_summary', True),
        ('shooting_session', 'read', True),
    ],
    'oficial_tiro': [
        # Lectura del arbol y de usuarios para armar lecciones cruzando ramas
        # (ej. invitar al Centro Clinico Militar a una evaluacion del Batallon).
        ('organization_unit', 'read', True),
        ('user', 'read', True),
        ('user', 'create', True),  # crear tirador temporal sin Account
        ('armory', 'read', True),
        ('weapon', 'read', True),
        ('weapon', 'create', True),  # crear arma desde la modal de tiradores
        ('weapon', 'update', True),
        ('range', 'read', True),
        ('range', 'create', True),  # planificar nuevos poligonos de entrenamiento
        ('range', 'update', True),
        ('shooting_session', 'create', True),
        ('shooting_session', 'read', True),
        ('shooting_session', 'update', True),
        ('shooting_session', 'delete', True),
        ('shooting_fraction', 'create', True),
        ('shooting_fraction', 'read', True),
        ('shooting_fraction', 'update', True),
        ('shooting_fraction', 'delete', True),
        ('shooting_result', 'create', True),
        ('shooting_result', 'read', True),
        ('shooting_result', 'update', True),
        ('shooting_result', 'delete', True),
        ('shooting_result', 'export', True),
    ],
    'oficial_observador': [
        ('organization_unit', 'read', True),
        ('shooting_result', 'read_summary', True),
        ('shooting_session', 'read', True),
    ],
    'encargado_almacen': [
        # Almacenes propios
        ('armory', 'read', True),
        ('armory', 'create', True),
        ('armory', 'update', True),
        ('armory', 'delete', True),
        # Armas dentro de sus almacenes
        ('weapon', 'create', True),
        ('weapon', 'read', True),
        ('weapon', 'update', True),
        ('weapon', 'delete', True),
    ],
    'tirador': [
        ('user', 'read_own', True),
        ('shooting_result', 'read_own', True),
        # Permite listar lecciones; el queryset luego filtra para mostrar solo
        # las que el tirador es participante (M2M) o tiene un ResultadoTiro.
        ('shooting_session', 'read', True),
        ('shooting_result', 'read', True),
        ('calibre', 'read', True),
    ],
}

# Permisos de ejercicios militares (se agregan como bloque adicional al DEFAULT_PERMISSIONS).
# Se fusionan en la misma estructura para que init_access_model los procese.
_EXERCISES_PERMISSIONS = {
    'tenant_admin': [
        ('ejercicio_militar', 'read',   True),
        ('ejercicio_militar', 'create', True),
        ('ejercicio_militar', 'update', True),
        ('ejercicio_militar', 'delete', True),
        ('calibre',           'manage', True),
    ],
    'admin_unidad': [
        ('ejercicio_militar', 'read',   True),
        ('ejercicio_militar', 'create', True),
        ('ejercicio_militar', 'update', True),
        ('calibre',           'read',   True),
    ],
    'comandante_unidad': [
        ('ejercicio_militar', 'read',   True),
        ('calibre',           'read',   True),
    ],
    'oficial_tiro': [
        ('ejercicio_militar', 'read',   True),
        ('ejercicio_militar', 'create', True),
        ('ejercicio_militar', 'update', True),
        ('calibre',           'read',   True),
    ],
    'encargado_almacen': [
        ('ejercicio_militar', 'read',    True),
        ('consumo_municion',  'read',    True),
        ('consumo_municion',  'create',  True),
        ('consumo_municion',  'update',  True),
        ('consumo_arma',      'read',    True),
        ('consumo_arma',      'create',  True),
        ('consumo_arma',      'update',  True),
        ('calibre',           'read',    True),
    ],
}

for _role_code, _perms in _EXERCISES_PERMISSIONS.items():
    DEFAULT_PERMISSIONS.setdefault(_role_code, []).extend(_perms)


# Set de codigos vivos: lo usa --reset para limpiar lo que ya no esta en el catalogo.
LIVE_ROLE_CODES = {code for code, _, _ in DEFAULT_ROLES}
LIVE_SCOPE_CODES = {code for code, _, _ in DEFAULT_SCOPES}


class Command(BaseCommand):
    help = 'Inicializa el catalogo de Roles, Scopes y PermissionRules en espanol.'

    def add_arguments(self, parser):
        parser.add_argument('--tenant-code', default='default-military')
        parser.add_argument('--tenant-name', default='Default Military Tenant')
        parser.add_argument('--default-role', default='tirador')
        parser.add_argument('--default-scope', default='solo_propio')
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Borra roles/scopes/rules obsoletos (los que no estan en el catalogo).',
        )

    def handle(self, *args, **options):
        tenant, _ = Tenant.objects.get_or_create(
            code=options['tenant_code'],
            defaults={
                'name': options['tenant_name'],
                'context': 'military',  # solo se soporta despliegue militar
                'is_active': True,
            },
        )

        # 1) Upsert de roles con name y description.
        role_map = {}
        for code, name, description in DEFAULT_ROLES:
            role, _ = Role.objects.update_or_create(
                code=code,
                defaults={'name': name, 'description': description, 'is_active': True},
            )
            role_map[code] = role

        # 2) Upsert de scopes.
        scope_map = {}
        for code, name, description in DEFAULT_SCOPES:
            scope, _ = ScopePolicy.objects.update_or_create(
                code=code,
                defaults={'name': name, 'description': description},
            )
            scope_map[code] = scope

        # 3) Upsert de RolePermissions (nuevo catálogo tipado).
        all_perms = {p.code: p for p in Permission.objects.filter(is_active=True)}
        for role_code, rules in DEFAULT_PERMISSIONS.items():
            role = role_map[role_code]
            for resource, action, allowed in rules:
                if resource == '*' and action == '*':
                    for perm in all_perms.values():
                        RolePermission.objects.update_or_create(
                            role=role, permission=perm,
                            defaults={'allowed': allowed},
                        )
                else:
                    perm_code = RESOURCE_ACTION_TO_PERMISSION.get((resource, action))
                    if perm_code and perm_code in all_perms:
                        RolePermission.objects.update_or_create(
                            role=role, permission=all_perms[perm_code],
                            defaults={'allowed': allowed},
                        )

        # 4) Reset opcional: borrar roles/scopes obsoletos.
        if options['reset']:
            obsolete_roles = Role.objects.exclude(code__in=LIVE_ROLE_CODES)
            self.stdout.write(self.style.WARNING(
                f'Borrando {obsolete_roles.count()} roles obsoletos: '
                f'{list(obsolete_roles.values_list("code", flat=True))}'
            ))
            obsolete_roles.delete()

            obsolete_scopes = ScopePolicy.objects.exclude(code__in=LIVE_SCOPE_CODES)
            self.stdout.write(self.style.WARNING(
                f'Borrando {obsolete_scopes.count()} scopes obsoletos: '
                f'{list(obsolete_scopes.values_list("code", flat=True))}'
            ))
            obsolete_scopes.delete()

        # 5) Migrar usuarios legacy a Person+Account (idempotente).
        # NO se crea Assignment aqui: los assignments se crean cuando el usuario
        # recibe una unidad y un puesto concreto (via UsuarioViewSet o crear_master).
        # Crear Assignments con organization_unit=None genera datos inconsistentes.
        User = get_user_model()
        total_users = 0
        for user in User.objects.all():
            total_users += 1
            rut_value = getattr(user, 'rut', None) or user.username
            full_name = ' '.join(
                [
                    str(getattr(user, 'grado', '') or '').strip(),
                    str(getattr(user, 'apellido_paterno', '') or '').strip(),
                    str(getattr(user, 'apellido_materno', '') or '').strip(),
                    str(getattr(user, 'nombre', '') or '').strip(),
                ]
            ).strip()
            if not full_name:
                full_name = user.get_full_name() or user.username

            person, _ = Person.objects.get_or_create(
                document_id=rut_value,
                defaults={
                    'full_name': full_name,
                    'email': getattr(user, 'correo', '') or (user.email or ''),
                    'is_active': user.is_active,
                },
            )

            Account.objects.get_or_create(
                user=user,
                defaults={
                    'person': person,
                    'tenant': tenant,
                    'is_active': user.is_active,
                },
            )

        self.stdout.write(self.style.SUCCESS(f'Tenant listo: {tenant.code}'))
        self.stdout.write(self.style.SUCCESS(f'Roles: {len(DEFAULT_ROLES)}'))
        self.stdout.write(self.style.SUCCESS(f'Scopes: {len(DEFAULT_SCOPES)}'))
        self.stdout.write(self.style.SUCCESS(f'Usuarios legacy enlazados (Person+Account): {total_users}'))
