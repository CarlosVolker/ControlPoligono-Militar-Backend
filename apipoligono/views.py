from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from rest_framework.throttling import UserRateThrottle
from .models import (Usuario, Arma, PoligonoTiro, LeccionTiro, FraccionTiro, ResultadoTiro,
                     Calibre, EjercicioMilitar, ConsumoMunicion, ConsumoArma)
from .serializers import (UsuarioSerializer, ArmaSerializer, PoligonoTiroSerializer,
                           LeccionTiroSerializer, FraccionTiroSerializer, ResultadoTiroSerializer,
                           RUTAuthTokenSerializer, CalibreSerializer, EjercicioMilitarSerializer,
                           ConsumoMunicionSerializer, ConsumoArmaSerializer,
                           DesignSystemAppearanceSerializer)
from .utils.recuperacion_utilidades import iniciar_recuperacion, crea_codigo, cambiar_contrasena, comprobar_codigo
from apps.authorization.permissions import (
    HasResourcePermission,
    HasTenantAccess,
    IsTenantAdmin,
    get_effective_permission_codes,
)
from apps.authorization.models import Role, ScopePolicy, UserPermissionOverride
from apps.authorization.serializers import (
    RoleSerializer,
    ScopePolicySerializer,
    UserPermissionOverrideSerializer,
)
from .mixins import TenantScopedQuerysetMixin
from django.contrib.auth import login as auth_login, logout as auth_logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from apps.authorization.scope import (
    can_read_detail,
    eligible_target_units,
    get_allowed_unit_ids,
    get_primary_unit,
    get_scope_codes,
    _descendant_ids,
)
from apps.authorization.models import AccessAudit
from apps.identity.models import Account, Assignment, Person, UnitMembership
from apps.identity.throttles import AuthEndpointThrottle, UnitSelectionThrottle
from apps.organizations.models import OrganizationUnit


def _ancestor_of_type(unit, unit_type):
    """Sube por la cadena de parents buscando una unidad del tipo dado.
    Devuelve la propia si ella misma es del tipo. None si no hay coincidencia."""
    current = unit
    while current is not None:
        if current.unit_type == unit_type:
            return current
        current = current.parent
    return None



def _is_global_admin(account):
    """True si el account tiene rol tenant_admin o super_admin activo."""
    if account is None:
        return False
    return account.assignments.filter(
        is_active=True,
        position__role__code__in=('tenant_admin', 'super_admin'),
    ).exists()


def _validate_target_unit_for_role(target_user, role_code, target_unit, requester_account):
    """
    Para roles funcionales (cualquier rol distinto de 'tirador'), la unidad
    asignada debe estar dentro de los niveles permitidos para el target user:
    su unidad personal (primary assignment) + hasta 2 ancestros.

    Excepcion: tenant_admin/super_admin pueden asignar cualquier unidad del
    tenant (para resolver casos puntuales).

    Devuelve (ok: bool, msg: str). msg es '' si ok=True.
    """
    if role_code == 'tirador':
        return True, ''
    if _is_global_admin(requester_account):
        return True, ''
    target_account = getattr(target_user, 'identity_account', None)
    if target_account is None:
        return False, 'El usuario no tiene Account.'
    primary_unit = get_primary_unit(target_account)
    if not primary_unit:
        return False, 'El usuario no tiene unidad personal asignada. Asigna primero una unidad principal.'
    eligible = eligible_target_units(primary_unit, max_levels=2)
    eligible_ids = {u.id for u in eligible}
    if target_unit.id not in eligible_ids:
        codes = ', '.join(u.code for u in eligible)
        return False, f"Esta unidad no es elegible para roles funcionales de este usuario. Elegibles: {codes}."
    return True, ''


def _ensure_tirador_assignment(account, unit):
    """
    Premisa "todos son tiradores": cada usuario tiene siempre un Assignment
    activo con rol 'tirador' + scope 'solo_propio' en su unidad. Idempotente.
    Encuentra o crea la Position de tirador para la unidad.
    """
    if account is None or unit is None:
        return
    tirador_role = Role.objects.filter(code='tirador').first()
    if tirador_role is None:
        return
    solo_propio_scope = ScopePolicy.objects.filter(code='solo_propio').first()
    position = _find_or_create_position(account.tenant, unit, tirador_role, solo_propio_scope)

    # Idempotente: si ya existe un assignment activo para esta position, no duplicar.
    Assignment.objects.get_or_create(
        account=account,
        position=position,
        defaults={'is_primary': False, 'is_active': True},
    )


def _find_or_create_position(tenant, unit, role, scope=None):
    """Devuelve la Position para (tenant, unit, role), creándola si no existe.

    Primero busca una existente. Si no hay, crea una posición ad-hoc.
    Esto permite que `asignacion_principal` y similares funcionen sin requerir
    que el administrador haya corrido seed_positions previamente.
    """
    from apps.identity.models import Position
    pos = Position.objects.filter(
        tenant=tenant,
        organization_unit=unit,
        role=role,
        is_active=True,
    ).first()
    if pos:
        return pos
    return Position.objects.create(
        tenant=tenant,
        code=f"{role.code}-{unit.code}"[:80],
        name=f"{role.name} {unit.name}"[:200],
        organization_unit=unit,
        role=role,
        scope_policy=scope,
        is_active=True,
    )


def _ensure_unit_membership(account, unit, tenant, is_primary=True):
    """
    Garantiza que el account tiene una UnitMembership activa en la unidad.
    Idempotente. Si ya existe, no crea duplicados.
    Si is_primary=True y no hay otra membresía primaria activa, la marca como primaria.
    """
    if account is None or unit is None or tenant is None:
        return

    existing = UnitMembership.objects.filter(account=account, unit=unit, is_active=True).first()
    if existing:
        if is_primary and not existing.is_primary:
            UnitMembership.objects.filter(account=account, is_active=True, is_primary=True).update(is_primary=False)
            existing.is_primary = True
            existing.save(update_fields=['is_primary'])
        return

    if is_primary:
        UnitMembership.objects.filter(account=account, is_active=True, is_primary=True).update(is_primary=False)

    UnitMembership.objects.create(
        account=account,
        unit=unit,
        tenant=tenant,
        is_primary=is_primary,
        is_active=True,
    )


# ModelViewSet para cada modelo

#Usuario
class UsuarioViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    tenant_field = 'identity_account__tenant'
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'user'
    action_permission_map = {
        'cambiar_contrasena': 'update',
        'asignacion_principal': 'update',
        'desactivar_asignacion_principal': 'update',
        'resetear_contrasena': 'update',
        'crear_temporal': 'create',
        'agregar_asignacion': 'update',
        'quitar_asignacion': 'update',
        'desbloquear': 'update',
        'estado_bloqueo': 'read',
    }
    
    def get_queryset(self):
        # Filtrado por rama: tenant_admin ve todos los usuarios del tenant.
        # unit_sysadmin u otros con scope acotado solo ven usuarios cuyas
        # asignaciones caen en su rama del arbol organizacional.
        qs = super().get_queryset()
        account = getattr(self.request, 'identity_account', None)
        if account is None:
            return qs.none()
        allowed = get_allowed_unit_ids(account)
        if allowed is None:
            return qs  # tenant_admin
        if not allowed:
            # Sin unidades permitidas: solo se ve a si mismo.
            return qs.filter(pk=self.request.user.pk)
        return qs.filter(
            identity_account__assignments__position__organization_unit__in=allowed,
            identity_account__assignments__is_active=True,
        ).distinct()

    def get_object(self):
        # Permitir que un usuario autenticado acceda a su propio recurso aunque
        # el filtrado por scope (TenantScopedQuerysetMixin) lo excluya. Esto se
        # usa especialmente en el flujo de "force change password": el usuario
        # autenticado debe poder cambiar SU propia contrasena sin importar su rol.
        if self.action == 'cambiar_contrasena':
            pk = self.kwargs.get(self.lookup_field or 'pk')
            if pk is not None and str(pk) == str(self.request.user.pk):
                return Usuario.objects.get(pk=pk)
        return super().get_object()

    def perform_create(self, serializer):
        # Crea el Usuario (con password temporal asignado por el serializer).
        # SIEMPRE crea Person + Account ligados al tenant actual, asi el usuario
        # aparece en el listado scopeado por tenant. El Assignment es opcional:
        # se crea si vienen initial_unit_code + initial_role_code.
        #
        # PROMOCION DE TIRADOR TEMPORAL: si ya existe un Usuario(is_temporary=True)
        # con el mismo RUT, lo "promovemos" en vez de crear duplicado: se actualizan
        # sus campos con los datos formales y se desmarca la bandera. Esto preserva
        # los ResultadoTiro historicos que el oficial de tiro habia registrado bajo
        # ese RUT antes de que el admin creara la cuenta formal.
        rut = serializer.validated_data.get('rut')
        existing_temp = Usuario.objects.filter(rut=rut, is_temporary=True).first() if rut else None
        if existing_temp is not None:
            for field in ('grado', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo'):
                value = serializer.validated_data.get(field)
                if value is not None:
                    setattr(existing_temp, field, value)
            existing_temp.is_temporary = False
            existing_temp.is_active = True
            existing_temp.username = rut
            existing_temp.password = make_password(settings.DEFAULT_TEMP_PASSWORD)
            existing_temp.must_change_password = True
            existing_temp.save()
            user = existing_temp
            serializer.instance = user
        else:
            user = serializer.save()

        creator_account = getattr(self.request, 'identity_account', None)
        if creator_account is None:
            return

        is_admin = creator_account.assignments.filter(
            is_active=True, position__role__code__in=('tenant_admin', 'super_admin')
        ).exists()

        unit_code = self.request.data.get('initial_unit_code') or None
        role_code = self.request.data.get('initial_role_code') or None
        scope_code = self.request.data.get('initial_scope_code') or None

        # Si NO es admin, exigir asignacion explicita (unidad + rol) dentro de
        # la rama del creador. tenant_admin puede crear usuarios "sueltos" y
        # asignarlos despues por separado.
        if not is_admin and (not unit_code or not role_code):
            raise PermissionError(
                'Debes indicar initial_unit_code y initial_role_code al crear un usuario.'
            )

        unit = role = scope = None
        if unit_code:
            allowed = get_allowed_unit_ids(creator_account)
            unit = OrganizationUnit.objects.filter(
                tenant=self.request.tenant, code=unit_code, is_active=True
            ).first()
            if unit is None:
                raise PermissionError('La unidad indicada no existe en este tenant.')
            if allowed is not None and unit.id not in allowed:
                raise PermissionError('La unidad indicada esta fuera de tu rama.')
        if role_code:
            role = Role.objects.filter(code=role_code).first()
            if role is None:
                raise PermissionError(f'Rol "{role_code}" no existe.')
        if scope_code:
            scope = ScopePolicy.objects.filter(code=scope_code).first()

        person, _ = Person.objects.get_or_create(
            document_id=user.rut,
            defaults={
                'full_name': f"{user.apellido_paterno} {user.apellido_materno}, {user.nombre}".strip(),
                'email': user.correo or '',
                'is_active': True,
            },
        )
        account, _ = Account.objects.get_or_create(
            user=user,
            defaults={'person': person, 'tenant': self.request.tenant, 'is_active': True},
        )

        if unit and role:
            position = _find_or_create_position(self.request.tenant, unit, role, scope)
            Assignment.objects.create(
                account=account,
                position=position,
                is_primary=True,
                is_active=True,
            )

        # Premisa "todos son tiradores": siempre crear el Assignment de tirador
        # en la unidad asignada (si hay una). Es idempotente.
        if unit:
            _ensure_tirador_assignment(account, unit)

        # Crear pertenencia orgánica a la unidad asignada.
        if unit:
            _ensure_unit_membership(account, unit, self.request.tenant)

    @action(detail=True, methods=['put', 'patch'], url_path='asignacion-principal')
    def asignacion_principal(self, request, pk=None):
        """
        Crea o actualiza el assignment primary del usuario (unit + role + scope).
        Valida que la unidad este dentro de la rama del solicitante.
        """
        user = self.get_object()
        creator_account = getattr(request, 'identity_account', None)
        if creator_account is None:
            return Response({'detail': 'Sin contexto de identidad.'}, status=status.HTTP_403_FORBIDDEN)

        unit_code = request.data.get('unit_code')
        role_code = request.data.get('role_code')
        scope_code = request.data.get('scope_code')

        if not unit_code or not role_code:
            return Response(
                {'detail': 'unit_code y role_code son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        unit = OrganizationUnit.objects.filter(
            tenant=request.tenant, code=unit_code, is_active=True
        ).first()
        if unit is None:
            return Response({'detail': 'Unidad no existe.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed = get_allowed_unit_ids(creator_account)
        if allowed is not None and unit.id not in allowed:
            return Response({'detail': 'La unidad esta fuera de tu rama.'}, status=status.HTTP_403_FORBIDDEN)

        role = Role.objects.filter(code=role_code).first()
        if role is None:
            return Response({'detail': f'Rol "{role_code}" no existe.'}, status=status.HTTP_400_BAD_REQUEST)

        scope = ScopePolicy.objects.filter(code=scope_code).first() if scope_code else None

        # Asegurar que el usuario tenga Account+Person.
        person, _ = Person.objects.get_or_create(
            document_id=user.rut,
            defaults={
                'full_name': f"{user.apellido_paterno} {user.apellido_materno}, {user.nombre}".strip(),
                'email': user.correo or '',
                'is_active': True,
            },
        )
        account, _ = Account.objects.get_or_create(
            user=user,
            defaults={'person': person, 'tenant': request.tenant, 'is_active': True},
        )

        # Limpiar primary anterior y crear nuevo.
        account.assignments.filter(is_primary=True).update(is_primary=False, is_active=False)
        position = _find_or_create_position(request.tenant, unit, role, scope)
        Assignment.objects.create(
            account=account,
            position=position,
            is_primary=True,
            is_active=True,
        )

        # Garantiza el rol implicito de tirador tambien en la unidad nueva.
        _ensure_tirador_assignment(account, unit)
        # Actualiza la pertenencia orgánica a la nueva unidad principal.
        _ensure_unit_membership(account, unit, request.tenant, is_primary=True)

        return Response(
            {
                'detail': 'Asignacion actualizada.',
                'unit_code': unit.code,
                'role_code': role.code,
                'scope_code': scope.code if scope else None,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='desactivar-asignacion-principal')
    def desactivar_asignacion_principal(self, request, pk=None):
        """
        Quita el rol funcional principal del usuario, dejando solo el rol
        implicito de 'tirador'. NO borra la asignacion: la marca is_active=False.
        """
        user = self.get_object()
        account = getattr(user, 'identity_account', None)
        if account is None:
            return Response({'detail': 'El usuario no tiene Account.'}, status=status.HTTP_400_BAD_REQUEST)

        primaries = account.assignments.filter(is_primary=True, is_active=True)
        count = primaries.count()
        primaries.update(is_active=False, is_primary=False)

        # Garantiza que quede al menos el tirador implicito.
        last_unit = None
        any_assignment = account.assignments.filter(is_active=True).select_related(
            'position__organization_unit'
        ).first()
        last_unit = any_assignment.effective_unit if any_assignment else None
        if last_unit is not None:
            _ensure_tirador_assignment(account, last_unit)

        return Response(
            {'detail': 'Rol funcional removido. Mantiene rol tirador.', 'desactivadas': count},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='agregar-asignacion')
    def agregar_asignacion(self, request, pk=None):
        """
        Agrega un Assignment adicional al usuario (NO primary). Permite que una
        persona tenga varios roles (ej: oficial_tiro + comandante_unidad).
        """
        user = self.get_object()
        creator_account = getattr(request, 'identity_account', None)
        if creator_account is None:
            return Response({'detail': 'Sin contexto de identidad.'}, status=status.HTTP_403_FORBIDDEN)

        unit_code = request.data.get('unit_code')
        role_code = request.data.get('role_code')
        scope_code = request.data.get('scope_code')
        if not unit_code or not role_code:
            return Response({'detail': 'unit_code y role_code son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

        unit = OrganizationUnit.objects.filter(tenant=request.tenant, code=unit_code, is_active=True).first()
        if unit is None:
            return Response({'detail': 'Unidad no existe.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed = get_allowed_unit_ids(creator_account)
        if allowed is not None and unit.id not in allowed:
            return Response({'detail': 'La unidad esta fuera de tu rama.'}, status=status.HTTP_403_FORBIDDEN)

        role = Role.objects.filter(code=role_code).first()
        if role is None:
            return Response({'detail': f'Rol "{role_code}" no existe.'}, status=status.HTTP_400_BAD_REQUEST)
        scope = ScopePolicy.objects.filter(code=scope_code).first() if scope_code else None

        # Validar "hasta 2 niveles arriba" para roles no-tirador.
        ok, msg = _validate_target_unit_for_role(user, role.code, unit, creator_account)
        if not ok:
            return Response({'detail': msg}, status=status.HTTP_400_BAD_REQUEST)

        # Asegurar Account.
        person, _ = Person.objects.get_or_create(
            document_id=user.rut,
            defaults={
                'full_name': f"{user.apellido_paterno} {user.apellido_materno}, {user.nombre}".strip(),
                'email': user.correo or '',
                'is_active': True,
            },
        )
        account, _ = Account.objects.get_or_create(
            user=user,
            defaults={'person': person, 'tenant': request.tenant, 'is_active': True},
        )

        # Idempotencia: si ya existe esa combinacion activa, no duplicar.
        position = _find_or_create_position(request.tenant, unit, role, scope)
        existing = account.assignments.filter(
            position=position, is_active=True
        ).first()
        if existing:
            return Response(
                {'detail': 'Ya tiene esa asignacion activa.', 'assignment_id': existing.id},
                status=status.HTTP_200_OK,
            )

        assignment = Assignment.objects.create(
            account=account,
            position=position,
            is_primary=False,
            is_active=True,
        )
        return Response(
            {'detail': 'Asignacion agregada.', 'assignment_id': assignment.id},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path=r'quitar-asignacion/(?P<assignment_id>\d+)')
    def quitar_asignacion(self, request, pk=None, assignment_id=None):
        """
        Desactiva un Assignment especifico del usuario. Protege el rol implicito
        de tirador: si quedaria sin ningun assignment activo, lo recrea.
        """
        user = self.get_object()
        account = getattr(user, 'identity_account', None)
        if account is None:
            return Response({'detail': 'El usuario no tiene Account.'}, status=status.HTTP_400_BAD_REQUEST)

        assignment = account.assignments.filter(pk=assignment_id, is_active=True).select_related(
            'position__role', 'position__organization_unit'
        ).first()
        if assignment is None:
            return Response({'detail': 'Asignacion no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        unit = assignment.effective_unit
        assignment.is_active = False
        assignment.is_primary = False
        assignment.save(update_fields=['is_active', 'is_primary'])

        # Si era el ultimo, restaurar el tirador implicito en su unidad.
        remaining = account.assignments.filter(is_active=True).exists()
        if not remaining and unit is not None:
            _ensure_tirador_assignment(account, unit)

        return Response({'detail': 'Asignacion quitada.'}, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except PermissionError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=False, methods=['post'], url_path='crear-temporal')
    def crear_temporal(self, request):
        """
        Crea un Usuario "temporal" (is_temporary=True) sin Account ni Assignment,
        para registrar resultados de tiro de personal cuya cuenta formal aun no
        existe. El oficial de tiro lo usa desde la modal de tiradores. Cuando el
        admin cree formalmente al usuario con el mismo RUT, perform_create lo
        promueve (link a Account+Assignment, deja de ser temporal).

        Payload: { rut, grado, nombre, apellido_paterno, apellido_materno,
                   organization_unit_code (opcional, para sugerir su unidad) }
        """
        rut = (request.data.get('rut') or '').strip()
        if not rut:
            return Response({'rut': 'RUT requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        existing = Usuario.objects.filter(rut=rut).first()
        if existing is not None:
            return Response(
                {'rut': f'Ya existe un usuario con RUT {rut} (temporal o formal).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        unit_code = request.data.get('organization_unit_code')
        unit = None
        if unit_code:
            unit = OrganizationUnit.objects.filter(
                tenant=request.tenant, code=unit_code, is_active=True
            ).first()
            if unit is None:
                return Response(
                    {'organization_unit_code': f"Unidad '{unit_code}' no encontrada."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user = Usuario.objects.create(
            username=rut,
            rut=rut,
            grado=request.data.get('grado') or '',
            nombre=request.data.get('nombre') or '',
            apellido_paterno=request.data.get('apellido_paterno') or '',
            apellido_materno=request.data.get('apellido_materno') or '',
            is_temporary=True,
            is_active=False,  # No puede loguearse mientras es temporal.
            password='',  # Sin contrasena utilizable.
        )
        # Crear Account+Person para que aparezca en queries scopeadas por tenant
        # (sin Assignment activo, no puede entrar al sistema). Esto es lo que
        # permite que `tiradores_elegibles` lo encuentre.
        person, _ = Person.objects.get_or_create(
            document_id=rut,
            defaults={
                'full_name': f"{user.apellido_paterno} {user.apellido_materno}, {user.nombre}".strip(),
                'is_active': False,
            },
        )
        account, _ = Account.objects.get_or_create(
            user=user,
            defaults={'person': person, 'tenant': request.tenant, 'is_active': False},
        )
        if unit is not None:
            # Assignment "fantasma" SOLO para que el filtro por unidad lo incluya
            # como elegible. is_active=True para que el query lo capture; pero el
            # Account.is_active=False y user.is_active=False bloquean el login.
            _ensure_tirador_assignment(account, unit)

        return Response(UsuarioSerializer(user).data, status=status.HTTP_201_CREATED)

    def get_permissions(self):
        # Self-service: el usuario puede cambiar su propia contrasena sin necesitar
        # el resource permission "user:update". HasTenantAccess sigue exigido para
        # que el llamado venga de una sesion del tenant.
        if self.action == 'cambiar_contrasena':
            pk = self.kwargs.get(self.lookup_field or 'pk')
            if pk is not None and self.request.user.is_authenticated and str(pk) == str(self.request.user.pk):
                return [perm() for perm in (IsAuthenticated, HasTenantAccess)]
        return super().get_permissions()

    @action(detail=True, methods=['post'], url_path='cambiar-contrasena')
    def cambiar_contrasena(self, request, pk=None):
        user = self.get_object()
        old_password = request.data.get('old_password', None)
        new_password = request.data.get('new_password')
        is_self = str(user.pk) == str(request.user.pk)

        if not new_password:
            return Response({'error': 'La nueva contraseña es requerida'}, status=status.HTTP_400_BAD_REQUEST)

        # Si es self y NO esta en flujo de must_change, exigir old_password.
        # Si esta en must_change (login forzado tras temporal), permite sin old_password
        # porque la sesion ya valido la temporal.
        if is_self and not user.must_change_password:
            if not old_password:
                return Response({'error': 'Contraseña actual es requerida'}, status=status.HTTP_400_BAD_REQUEST)
            if not user.check_password(old_password):
                return Response({'error': 'Contraseña actual incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

        # Valida fortaleza con los AUTH_PASSWORD_VALIDATORS del proyecto.
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response({'error': exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.password = make_password(new_password)
        user.password_changed_at = timezone.now()
        if is_self:
            # Self cambio: limpia el flag de cambio obligatorio.
            user.must_change_password = False
        else:
            # Admin reseteando para otro: vuelve a quedar como temporal.
            user.must_change_password = True
        user.save(update_fields=['password', 'password_changed_at', 'must_change_password'])

        return Response({'detail': 'Contraseña actualizada correctamente'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='resetear-contrasena')
    def resetear_contrasena(self, request, pk=None):
        """
        Resetea la contrasena del usuario al valor temporal del settings y marca
        must_change_password=True. Solo admins (tenant_admin/super_admin) o el SICE
        de la rama del usuario pueden hacerlo. Reusa el filtrado de get_queryset
        que ya restringe por rama.
        """
        user = self.get_object()
        if str(user.pk) == str(request.user.pk):
            return Response(
                {'error': 'No puedes resetear tu propia contrasena. Usa cambiar contrasena.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.password = make_password(settings.DEFAULT_TEMP_PASSWORD)
        user.must_change_password = True
        user.password_changed_at = None
        user.save(update_fields=['password', 'must_change_password', 'password_changed_at'])
        return Response(
            {'detail': 'Contraseña reseteada. El usuario deberá cambiarla en su próximo inicio de sesión.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], url_path='estado-bloqueo')
    def estado_bloqueo(self, request, pk=None):
        """
        Devuelve si la cuenta del usuario está bloqueada por intentos fallidos.
        El solicitante solo puede consultar usuarios dentro de su scope.
        """
        from axes.models import AccessAttempt
        user = self.get_object()
        failure_limit = getattr(settings, 'AXES_FAILURE_LIMIT', 5)
        attempts = AccessAttempt.objects.filter(username=user.rut)
        total_failures = sum(a.failures_since_start for a in attempts)
        is_locked = total_failures >= failure_limit
        last_attempt = attempts.order_by('-attempt_time').first()
        return Response({
            'rut': user.rut,
            'is_locked': is_locked,
            'failures': total_failures,
            'failure_limit': failure_limit,
            'last_attempt': last_attempt.attempt_time if last_attempt else None,
        })

    @action(detail=True, methods=['post'], url_path='desbloquear')
    def desbloquear(self, request, pk=None):
        """
        Desbloquea la cuenta de un usuario bloqueada por intentos fallidos.

        Permisos:
          - tenant_admin / super_admin: puede desbloquear cualquier usuario del tenant.
          - admin_unidad (SICE): puede desbloquear usuarios dentro de su scope
            (su unidad, sus descendientes o su recinto).

        El filtrado de scope ya está garantizado por get_queryset() —
        si el solicitante no tiene acceso al usuario, get_object() devuelve 404.
        """
        from axes.utils import reset as axes_reset
        user = self.get_object()

        if not AccessAttempt.objects.filter(username=user.rut).exists():
            return Response(
                {'detail': 'La cuenta no tiene intentos fallidos registrados.'},
                status=status.HTTP_200_OK,
            )

        count = axes_reset(username=user.rut)
        return Response(
            {
                'detail': f'Cuenta desbloqueada correctamente.',
                'rut': user.rut,
                'registros_eliminados': count,
            },
            status=status.HTTP_200_OK,
        )


class ArmaViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Arma.objects.all()
    serializer_class = ArmaSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'weapon'
 
class PoligonoTiroViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = PoligonoTiro.objects.all()
    serializer_class = PoligonoTiroSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'range'
    action_permission_map = {
        'lecciones': 'read',
    }
 
    @action(detail=True, methods=['get'])
    def lecciones(self, request, pk=None):
        poligono = self.get_object()
        lecciones = LeccionTiro.objects.filter(id_poligono=poligono, tenant=request.tenant)
        serializer = LeccionTiroSerializer(lecciones, many=True)
        return Response(serializer.data)

class LeccionTiroViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = LeccionTiro.objects.all()
    serializer_class = LeccionTiroSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'shooting_session'
    action_permission_map = {
        'fracciones': 'read',
        'usuarios_listar': 'read',
        'resultados': 'read',
        'resultados_resumen': 'read_summary',
        'reporte': 'read',
        'tiradores_elegibles': 'read',
    }

    def get_queryset(self):
        # El mixin filtra por organization_unit (FK) ∈ allowed_unit_ids. Pero una
        # leccion tambien es "visible" para los miembros de cualquier unidad
        # listada en unidades_participantes (M2M) — eso permite que un tirador
        # invitado de OTRA rama pueda ver la leccion en la que participa.
        #
        # CASO ESPECIAL: si el usuario es "tirador puro" (no tiene ningun otro
        # rol funcional activo), restringimos a las lecciones donde el M2M
        # incluye su unidad O donde tiene un ResultadoTiro propio. Esto evita
        # que vea lecciones de su unidad en las que no participa.
        base = super().get_queryset()
        account = getattr(self.request, 'identity_account', None)
        if account is None:
            return base
        allowed = get_allowed_unit_ids(account)
        if allowed is None:
            return base  # admin global, ya ve todo

        is_tirador_only = not account.assignments.filter(
            is_active=True
        ).exclude(position__role__code='tirador').exists()

        if is_tirador_only:
            # Tirador puro: solo lecciones donde es invitado (M2M) o tiene un
            # resultado propio. Ignoramos el filtro del mixin por organization_unit
            # porque "ser miembro de la unidad" no implica "haber participado".
            return LeccionTiro.objects.filter(
                tenant=self.request.tenant,
            ).filter(
                Q(unidades_participantes__in=allowed)
                | Q(fracciontiro__resultadotiro__id_usuario_id=self.request.user.pk)
            ).distinct()

        if not allowed:
            return base  # mixin ya restringio a none
        m2m_qs = LeccionTiro.objects.filter(
            tenant=self.request.tenant,
            unidades_participantes__in=allowed,
        )
        return (base | m2m_qs).distinct()

    @action(detail=True, methods=['get'])
    def fracciones(self, request, pk=None):
        leccion = self.get_object()
        fracciones = FraccionTiro.objects.filter(id_leccion=leccion, tenant=request.tenant)
        serializer = FraccionTiroSerializer(fracciones, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='usuarios')
    def usuarios_listar(self, request, pk=None):
        #Obtener leccion
        leccion = self.get_object()
        
        # Obtener todas las fracciones asociadas a la leccion
        fracciones = FraccionTiro.objects.filter(id_leccion=leccion, tenant=request.tenant)
        
        # Obtener los tiradores/usuarios en esas fracciones
        resultados = ResultadoTiro.objects.filter(id_fraccion__in=fracciones, tenant=request.tenant)
        usuarios = Usuario.objects.filter(id_usuario__in=resultados.values('id_usuario'))
        
        # Serializar los usuarios
        serializer = UsuarioSerializer(usuarios, many=True)
        
        # Retorna la lista de usuarios
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'], url_path='resultados')
    def resultados(self, request, pk=None):
        account = getattr(request, 'identity_account', None)
        if account is None or not can_read_detail(account):
            AccessAudit.objects.create(
                user_id_value=request.user.pk if request.user.is_authenticated else None,
                tenant_code=request.tenant.code if getattr(request, 'tenant', None) else None,
                organization_unit_code=request.organization_unit.code if getattr(request, 'organization_unit', None) else None,
                endpoint='leccion_resultados_detalle',
                action='read_detail',
                allowed=False,
                reason='scope_denied',
            )
            return Response({'detail': 'Su alcance no permite ver resultados detallados.'}, status=status.HTTP_403_FORBIDDEN)

        AccessAudit.objects.create(
            user_id_value=request.user.pk,
            tenant_code=request.tenant.code if getattr(request, 'tenant', None) else None,
            organization_unit_code=request.organization_unit.code if getattr(request, 'organization_unit', None) else None,
            endpoint='leccion_resultados_detalle',
            action='read_detail',
            allowed=True,
            reason='scope_allowed',
        )

        #Obtener leccion
        leccion = self.get_object()
        
        # Obtener todas las fracciones asociadas a la leccion
        fracciones = FraccionTiro.objects.filter(id_leccion=leccion, tenant=request.tenant)
        
        # Filtrar los resultados de tiro asociados a las fracciones
        resultados = ResultadoTiro.objects.filter(id_fraccion__in=fracciones, tenant=request.tenant)
        
        # Realizar los JOINs con los usuario, Arma y FraccionTiro
        data = []
        for resultado in resultados:
            usuario = Usuario.objects.get(id_usuario=resultado.id_usuario.id_usuario)
            arma = Arma.objects.get(id_arma=resultado.id_arma.id_arma, tenant=request.tenant)
            fraccion = FraccionTiro.objects.get(id_fraccion=resultado.id_fraccion.id_fraccion, tenant=request.tenant)
            
            # Diccionario de datos
            data.append({
                'RUT': usuario.rut,
                'Grado': usuario.grado,
                'Apellido_paterno': usuario.apellido_paterno,
                'Apellido_materno': usuario.apellido_materno,
                'Nombre': usuario.nombre,
                'Unidad': primary_unit(usuario)[1],
                'Tipo Arma': arma.tipo_arma,
                'Modelo de Arma': arma.modelo_arma,
                'Número de Serie': arma.numero_serie,
                'Carril': resultado.numero_carril,
                'Tiros Acertados': resultado.tiros_acertados,
                'Total Tiros': resultado.total_tiros,
            })
            
        # Retornar la lista de resultados
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='resultados-resumen')
    def resultados_resumen(self, request, pk=None):
        leccion = self.get_object()
        fracciones = FraccionTiro.objects.filter(id_leccion=leccion, tenant=request.tenant)
        resultados = ResultadoTiro.objects.filter(id_fraccion__in=fracciones, tenant=request.tenant)

        data = {
            'id_leccion': leccion.id_leccion,
            'fracciones': fracciones.count(),
            'tiradores_unicos': resultados.values('id_usuario').distinct().count(),
            'tiros_acertados_total': sum(item.tiros_acertados for item in resultados),
            'tiros_total': sum(item.total_tiros for item in resultados),
        }
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='reporte')
    def reporte(self, request, pk=None):
        """
        Reporte agregado completo de la leccion:
          - resumen: totales generales
          - por_fraccion: una fila por fraccion con totales y % acierto
          - por_tirador: una fila por tirador (suma a traves de todas las
            fracciones donde participo)
          - por_unidad: agrupado por la unidad principal del tirador
          - por_arma: una fila por fusil con quien lo uso y % acierto
          - por_arma_unidad: armas agrupadas por su unidad propietaria
        Los aggregate-only solo reciben resumen + por_fraccion + por_unidad.
        """
        account = getattr(request, 'identity_account', None)
        leccion = self.get_object()
        fracciones = list(FraccionTiro.objects.filter(id_leccion=leccion, tenant=request.tenant))
        fracciones_by_id = {f.id_fraccion: f for f in fracciones}
        resultados = list(
            ResultadoTiro.objects.filter(
                id_fraccion__in=fracciones, tenant=request.tenant
            ).select_related('id_usuario', 'id_arma', 'id_arma__organization_unit')
        )

        leccion_data = {
            'id_leccion': leccion.id_leccion,
            'fecha_tiro': leccion.fecha_tiro,
            'tipo_tiro': leccion.tipo_tiro,
            'distancia': leccion.distancia,
            'cant_tiros_leccion': leccion.cant_tiros_leccion,
        }

        if not resultados:
            return Response({
                'leccion': leccion_data,
                'resumen': {
                    'total_tiradores': 0, 'total_disparos': 0, 'total_acertados': 0,
                    'porcentaje_promedio': 0, 'fracciones_count': len(fracciones),
                    'armas_count': 0, 'unidades_count': 0,
                },
                'por_fraccion': [], 'por_tirador': [], 'por_unidad': [],
                'por_arma': [], 'por_arma_unidad': [],
            })

        def pct(ac, tot):
            return round(ac * 100 / tot, 1) if tot else 0

        # Helper: unidad principal de un usuario (codigo+nombre).
        def primary_unit(usuario):
            account = getattr(usuario, 'identity_account', None)
            if not account:
                return ('(sin unidad)', '(sin unidad)')
            primary = account.assignments.filter(
                is_active=True, is_primary=True
            ).select_related('position__organization_unit').first()
            unit = primary.effective_unit if primary else None
            if unit:
                return (unit.code, unit.name)
            return ('(sin unidad)', '(sin unidad)')

        # Resumen
        total_acertados = sum(r.tiros_acertados for r in resultados)
        total_disparos = sum(r.total_tiros for r in resultados)
        total_tiradores = len({r.id_usuario_id for r in resultados})

        # Por fraccion
        por_fraccion = []
        for f in fracciones:
            fr = [r for r in resultados if r.id_fraccion_id == f.id_fraccion]
            ac = sum(r.tiros_acertados for r in fr)
            tot = sum(r.total_tiros for r in fr)
            por_fraccion.append({
                'id_fraccion': f.id_fraccion,
                'numero_fraccion': f.numero_fraccion,
                'tiradores': len({r.id_usuario_id for r in fr}),
                'tiros_acertados': ac,
                'tiros_total': tot,
                'porcentaje': pct(ac, tot),
            })

        # Cache de unidades primarias (evita repetir la query por cada resultado).
        unit_cache = {}
        def cached_unit(usuario):
            key = usuario.id_usuario
            if key not in unit_cache:
                unit_cache[key] = primary_unit(usuario)
            return unit_cache[key]

        # Por tirador
        por_tirador_map = {}
        for r in resultados:
            key = r.id_usuario_id
            if key not in por_tirador_map:
                u = r.id_usuario
                unit_code, unit_name = cached_unit(u)
                por_tirador_map[key] = {
                    'id_usuario': u.id_usuario,
                    'rut': u.rut,
                    'grado': u.grado or '',
                    'nombre': f"{u.apellido_paterno or ''} {u.apellido_materno or ''}, {u.nombre or ''}".strip(),
                    'unit_code': unit_code,
                    'unit_name': unit_name,
                    'tiros_acertados': 0,
                    'tiros_total': 0,
                    'fracciones_set': set(),
                }
            por_tirador_map[key]['tiros_acertados'] += r.tiros_acertados
            por_tirador_map[key]['tiros_total'] += r.total_tiros
            por_tirador_map[key]['fracciones_set'].add(r.id_fraccion_id)
        por_tirador = sorted([
            {
                'id_usuario': v['id_usuario'], 'rut': v['rut'], 'grado': v['grado'],
                'nombre': v['nombre'], 'unit_code': v['unit_code'], 'unit_name': v['unit_name'],
                'tiros_acertados': v['tiros_acertados'], 'tiros_total': v['tiros_total'],
                'fracciones_count': len(v['fracciones_set']),
                'porcentaje': pct(v['tiros_acertados'], v['tiros_total']),
            }
            for v in por_tirador_map.values()
        ], key=lambda x: -x['porcentaje'])

        # Por unidad (agrupado por unidad principal del tirador)
        por_unidad_map = {}
        for r in resultados:
            unit_code, unit_name = cached_unit(r.id_usuario)
            if unit_code not in por_unidad_map:
                por_unidad_map[unit_code] = {
                    'unit_code': unit_code, 'unit_name': unit_name,
                    'tiradores_set': set(),
                    'tiros_acertados': 0, 'tiros_total': 0,
                }
            por_unidad_map[unit_code]['tiradores_set'].add(r.id_usuario_id)
            por_unidad_map[unit_code]['tiros_acertados'] += r.tiros_acertados
            por_unidad_map[unit_code]['tiros_total'] += r.total_tiros
        por_unidad = sorted([
            {
                'unit_code': v['unit_code'], 'unit_name': v['unit_name'],
                'tiradores': len(v['tiradores_set']),
                'tiros_acertados': v['tiros_acertados'], 'tiros_total': v['tiros_total'],
                'porcentaje': pct(v['tiros_acertados'], v['tiros_total']),
            }
            for v in por_unidad_map.values()
        ], key=lambda x: -x['porcentaje'])

        # Si el usuario es aggregate_only, devolver solo lo agregado.
        if account is not None and not can_read_detail(account):
            return Response({
                'leccion': leccion_data,
                'resumen': {
                    'total_tiradores': total_tiradores,
                    'total_disparos': total_disparos,
                    'total_acertados': total_acertados,
                    'porcentaje_promedio': pct(total_acertados, total_disparos),
                    'fracciones_count': len(fracciones),
                    'armas_count': 0, 'unidades_count': len(por_unidad),
                },
                'por_fraccion': por_fraccion,
                'por_unidad': por_unidad,
                'por_tirador': [], 'por_arma': [], 'por_arma_unidad': [],
                'aggregate_only': True,
            })

        # Por arma
        por_arma_map = {}
        for r in resultados:
            a = r.id_arma
            if a.id_arma not in por_arma_map:
                arma_unit_code = a.organization_unit.code if a.organization_unit else None
                arma_unit_name = a.organization_unit.name if a.organization_unit else '(sin unidad)'
                por_arma_map[a.id_arma] = {
                    'id_arma': a.id_arma,
                    'tipo': a.tipo_arma, 'modelo': a.modelo_arma, 'serie': a.numero_serie,
                    'unit_code': arma_unit_code, 'unit_name': arma_unit_name,
                    'tiradores_set': set(),
                    'tiros_acertados': 0, 'tiros_total': 0,
                }
            por_arma_map[a.id_arma]['tiradores_set'].add(r.id_usuario_id)
            por_arma_map[a.id_arma]['tiros_acertados'] += r.tiros_acertados
            por_arma_map[a.id_arma]['tiros_total'] += r.total_tiros
        por_arma = sorted([
            {
                'id_arma': v['id_arma'], 'tipo': v['tipo'], 'modelo': v['modelo'], 'serie': v['serie'],
                'unit_code': v['unit_code'], 'unit_name': v['unit_name'],
                'tiradores': len(v['tiradores_set']),
                'tiros_acertados': v['tiros_acertados'], 'tiros_total': v['tiros_total'],
                'porcentaje': pct(v['tiros_acertados'], v['tiros_total']),
            }
            for v in por_arma_map.values()
        ], key=lambda x: -x['porcentaje'])

        # Por arma × unidad (agrupar las armas por su unidad propietaria)
        por_arma_unidad_map = {}
        for arma in por_arma:
            key = arma['unit_code'] or '(sin unidad)'
            if key not in por_arma_unidad_map:
                por_arma_unidad_map[key] = {
                    'unit_code': arma['unit_code'],
                    'unit_name': arma['unit_name'],
                    'armas': [],
                    'tiros_acertados': 0,
                    'tiros_total': 0,
                }
            por_arma_unidad_map[key]['armas'].append({
                'id_arma': arma['id_arma'], 'tipo': arma['tipo'],
                'modelo': arma['modelo'], 'serie': arma['serie'],
                'tiradores': arma['tiradores'],
                'tiros_acertados': arma['tiros_acertados'],
                'tiros_total': arma['tiros_total'],
                'porcentaje': arma['porcentaje'],
            })
            por_arma_unidad_map[key]['tiros_acertados'] += arma['tiros_acertados']
            por_arma_unidad_map[key]['tiros_total'] += arma['tiros_total']
        por_arma_unidad = []
        for v in por_arma_unidad_map.values():
            v['porcentaje'] = pct(v['tiros_acertados'], v['tiros_total'])
            por_arma_unidad.append(v)

        return Response({
            'leccion': leccion_data,
            'resumen': {
                'total_tiradores': total_tiradores,
                'total_disparos': total_disparos,
                'total_acertados': total_acertados,
                'porcentaje_promedio': pct(total_acertados, total_disparos),
                'fracciones_count': len(fracciones),
                'armas_count': len(por_arma),
                'unidades_count': len(por_unidad),
            },
            'por_fraccion': por_fraccion,
            'por_tirador': por_tirador,
            'por_unidad': por_unidad,
            'por_arma': por_arma,
            'por_arma_unidad': por_arma_unidad,
            'aggregate_only': False,
        })

    @action(detail=True, methods=['get'], url_path='tiradores-elegibles')
    def tiradores_elegibles(self, request, pk=None):
        """
        Devuelve los Usuario que pueden ser agregados como tiradores a esta leccion:
        miembros (via Account+Assignment activo) de las unidades_participantes.
        Si la leccion no tiene unidades_participantes configuradas, devuelve los
        miembros de la organization_unit del propio recurso.
        """
        leccion = self.get_object()
        root_ids = list(leccion.unidades_participantes.values_list('id', flat=True))
        if not root_ids and leccion.organization_unit_id:
            root_ids = [leccion.organization_unit_id]

        if not root_ids:
            return Response({'results': []}, status=status.HTTP_200_OK)

        # Expandir con descendientes: si el oficial selecciono "Compania X", los
        # miembros de Pelotones bajo X tambien son elegibles. Asi se evita tener
        # que tildar cada Peloton en el form de la leccion.
        expanded_ids = _descendant_ids(root_ids)

        usuarios = Usuario.objects.filter(
            identity_account__tenant=request.tenant,
            identity_account__assignments__is_active=True,
            identity_account__assignments__position__organization_unit_id__in=expanded_ids,
        ).distinct().order_by('apellido_paterno', 'nombre')

        data = UsuarioSerializer(usuarios, many=True).data
        return Response({'results': data}, status=status.HTTP_200_OK)
    
    
    
class FraccionTiroViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = FraccionTiro.objects.all()
    serializer_class = FraccionTiroSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'shooting_fraction'
    action_permission_map = {
        'tiradores': 'read',
        'resultados': 'read',
    }
    
    @action(detail=True, methods=['get'])
    def tiradores(self, request, pk=None):
        fraccion = self.get_object()
        resultados = ResultadoTiro.objects.filter(id_fraccion=fraccion, tenant=request.tenant)
        usuarios = Usuario.objects.filter(id_usuario__in=resultados.values('id_usuario'))
        armas = Arma.objects.filter(id_arma__in=resultados.values('id_arma'), tenant=request.tenant)
        
        usuarios_serializer = UsuarioSerializer(usuarios, many=True)
        armas_serializer = ArmaSerializer(armas, many=True)
        
        response_data = {
            'usuarios': usuarios_serializer.data,
            'armas': armas_serializer.data
        }
        return Response(response_data)
    
    @action(detail=True, methods=['get'])
    def resultados(self, request, pk=None):
        account = getattr(request, 'identity_account', None)
        if account is None or not can_read_detail(account):
            AccessAudit.objects.create(
                user_id_value=request.user.pk if request.user.is_authenticated else None,
                tenant_code=request.tenant.code if getattr(request, 'tenant', None) else None,
                organization_unit_code=request.organization_unit.code if getattr(request, 'organization_unit', None) else None,
                endpoint='fraccion_resultados_detalle',
                action='read_detail',
                allowed=False,
                reason='scope_denied',
            )
            return Response({'detail': 'Su alcance no permite ver resultados detallados.'}, status=status.HTTP_403_FORBIDDEN)

        AccessAudit.objects.create(
            user_id_value=request.user.pk,
            tenant_code=request.tenant.code if getattr(request, 'tenant', None) else None,
            organization_unit_code=request.organization_unit.code if getattr(request, 'organization_unit', None) else None,
            endpoint='fraccion_resultados_detalle',
            action='read_detail',
            allowed=True,
            reason='scope_allowed',
        )

        fraccion = self.get_object()
        resultados = ResultadoTiro.objects.filter(id_fraccion=fraccion, tenant=request.tenant)
        response_data = []
        
        for resultado in resultados:
            usuario = resultado.id_usuario
            arma = resultado.id_arma
            resultado_data = ResultadoTiroSerializer(resultado).data
            usuario_data = UsuarioSerializer(usuario).data
            arma_data = ArmaSerializer(arma).data
            
            response_data.append({
                'resultado' : resultado_data,
                'usuario': usuario_data,
                'arma': arma_data
            })
            
            
        return Response(response_data)
   
class ResultadoTiroViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = ResultadoTiro.objects.all()
    serializer_class = ResultadoTiroSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'shooting_result'

    def get_queryset(self):
        # Mismo razonamiento que LeccionTiroViewSet: el resultado es visible si
        # su organization_unit (FK) cae en el scope del usuario, O si la leccion
        # padre tiene en su M2M unidades_participantes alguna unidad del scope.
        # CASO ESPECIAL: tirador puro solo ve sus propios resultados.
        base = super().get_queryset()
        account = getattr(self.request, 'identity_account', None)
        if account is None:
            return base
        allowed = get_allowed_unit_ids(account)
        if allowed is None:
            return base

        is_tirador_only = not account.assignments.filter(
            is_active=True
        ).exclude(position__role__code='tirador').exists()
        if is_tirador_only:
            return ResultadoTiro.objects.filter(
                tenant=self.request.tenant,
                id_usuario_id=self.request.user.pk,
            )

        if not allowed:
            return base
        m2m_qs = ResultadoTiro.objects.filter(
            tenant=self.request.tenant,
            id_fraccion__id_leccion__unidades_participantes__in=allowed,
        )
        return (base | m2m_qs).distinct()
    
class CalibreViewSet(viewsets.ModelViewSet):
    """Catálogo global de calibres. Sin filtro por tenant (es referencia compartida)."""
    queryset = Calibre.objects.all()
    serializer_class = CalibreSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'calibre'
    action_permission_map = {
        'list':           'read',
        'retrieve':       'read',
        'create':         'manage',
        'update':         'manage',
        'partial_update': 'manage',
        'destroy':        'manage',
    }

    def _require_super_admin(self, request):
        """El catalogo de calibres es global: solo super_admin puede modificarlo.
        Lanza PermissionDenied (403) si el solicitante no es super_admin."""
        from rest_framework.exceptions import PermissionDenied
        account = getattr(request, 'identity_account', None)
        is_super = account is not None and account.assignments.filter(
            position__role__code='super_admin', is_active=True,
        ).exists()
        if not is_super:
            raise PermissionDenied('Solo super_admin puede gestionar el catálogo global de calibres.')

    def create(self, request, *args, **kwargs):
        self._require_super_admin(request)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._require_super_admin(request)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._require_super_admin(request)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._require_super_admin(request)
        return super().destroy(request, *args, **kwargs)


class EjercicioMilitarViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = EjercicioMilitar.objects.all().select_related(
        'organization_unit', 'tenant'
    ).prefetch_related('unidades_participantes', 'consumos')
    serializer_class = EjercicioMilitarSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'ejercicio_militar'
    action_permission_map = {
        'list':           'read',
        'retrieve':       'read',
        'create':         'create',
        'update':         'update',
        'partial_update': 'update',
        'destroy':        'delete',
    }
    # perform_create heredado del mixin: inyecta tenant + organization_unit automáticamente.


class ConsumoMunicionViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = ConsumoMunicion.objects.all().select_related('ejercicio', 'calibre')
    serializer_class = ConsumoMunicionSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'consumo_municion'
    action_permission_map = {
        'list':           'read',
        'retrieve':       'read',
        'create':         'create',
        'update':         'update',
        'partial_update': 'update',
        'destroy':        'delete',
    }
    # ConsumoMunicion no tiene organization_unit: el mixin inyecta solo tenant.


class ConsumoArmaViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = ConsumoArma.objects.all().select_related('consumo', 'arma')
    serializer_class = ConsumoArmaSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'consumo_arma'
    action_permission_map = {
        'list':           'read',
        'retrieve':       'read',
        'create':         'create',
        'update':         'update',
        'partial_update': 'update',
        'destroy':        'delete',
    }
    # ConsumoArma no tiene organization_unit: el mixin inyecta solo tenant.


class ProtectedView(APIView):
    permission_classes = [IsAuthenticated, HasTenantAccess]
    
    def get(self, request, *args, **kwargs):
        return Response({'Detalle: Esta es una vista protegida'})
    

@method_decorator(ensure_csrf_cookie, name='dispatch')
class SessionLoginView(APIView):
    permission_classes = ()
    authentication_classes = ()
    throttle_classes = [AuthEndpointThrottle]

    def post(self, request, *args, **kwargs):
        serializer = RUTAuthTokenSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Crea la sesión Django y la vincula a request.user.
        # Se indica el backend explícitamente porque hay más de uno en AUTHENTICATION_BACKENDS.
        auth_login(request, user, backend='apipoligono.backends.RUTAuthBackend')

        return Response(
            {
                'id_usuario': user.pk,
                'must_change_password': bool(getattr(user, 'must_change_password', False)),
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        auth_logout(request)
        return Response({'detail': 'Desconectado satisfactoriamente.'}, status=status.HTTP_200_OK)


class AuthContextView(APIView):
    permission_classes = [IsAuthenticated, HasTenantAccess]

    def get(self, request, *args, **kwargs):
        account = getattr(request, 'identity_account', None)
        scopes = sorted(list(get_scope_codes(account))) if account else []
        assignments = []
        permissions = []
        if account:
            rows = list(account.assignments.filter(is_active=True).select_related(
                'position__role', 'position__scope_policy', 'position__organization_unit',
            ))
            for row in rows:
                eff_role = row.effective_role
                eff_scope = row.effective_scope
                eff_unit = row.effective_unit
                if eff_role is None:
                    continue
                assignments.append(
                    {
                        'role': eff_role.code,
                        'scope': eff_scope.code if eff_scope else None,
                        'organization_unit': eff_unit.code if eff_unit else None,
                        'is_primary': row.is_primary,
                    }
                )

            # Permisos efectivos del usuario: array de permission_codes.
            perm_codes = get_effective_permission_codes(account)
            permissions = sorted(perm_codes)

        # Pertenencia orgánica primaria del usuario.
        unit_membership = None
        if account:
            primary_membership = account.unit_memberships.filter(
                is_primary=True, is_active=True
            ).select_related('unit').first()
            if primary_membership:
                unit_membership = {
                    'id': primary_membership.id,
                    'unit_code': primary_membership.unit.code,
                    'unit_name': primary_membership.unit.name,
                }

        return Response(
            {
                'user': {
                    'id_usuario': request.user.pk,
                    'rut': getattr(request.user, 'rut', None),
                    'must_change_password': bool(getattr(request.user, 'must_change_password', False)),
                },
                'tenant': {
                    'code': request.tenant.code if getattr(request, 'tenant', None) else None,
                    'context': request.tenant.context if getattr(request, 'tenant', None) else None,
                },
                'active_organization_unit': request.organization_unit.code if getattr(request, 'organization_unit', None) else None,
                'unit_membership': unit_membership,
                'scopes': scopes,
                'assignments': assignments,
                'permissions': permissions,
            },
            status=status.HTTP_200_OK,
        )


class SelectActiveUnitView(APIView):
    permission_classes = [IsAuthenticated, HasTenantAccess]
    throttle_classes = [UnitSelectionThrottle]

    def post(self, request, *args, **kwargs):
        unit_code = request.data.get('organization_unit_code')
        if not unit_code:
            return Response({'detail': 'organization_unit_code es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        account = getattr(request, 'identity_account', None)
        if account is None:
            return Response({'detail': 'Cuenta de identidad no encontrada.'}, status=status.HTTP_403_FORBIDDEN)

        use_v2 = getattr(settings, 'AUTHZ_USE_UNIT_MEMBERSHIP', False)

        if use_v2:
            # Modo v2: cambiar UnitMembership primaria
            membership = account.unit_memberships.filter(
                is_active=True,
                unit__code=unit_code,
                unit__tenant=account.tenant,
            ).select_related('unit').first()
            if membership is None:
                return Response(
                    {'detail': 'La unidad no está en tus pertenencias activas.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            account.unit_memberships.filter(is_active=True).update(is_primary=False)
            membership.is_primary = True
            membership.save(update_fields=['is_primary'])

            # Compatibilidad: también actualizar Assignment primario si hay uno para esa unidad
            matching_assignment = account.assignments.filter(
                is_active=True,
                position__organization_unit__code=unit_code,
            ).first()
            if matching_assignment:
                account.assignments.filter(is_active=True).update(is_primary=False)
                matching_assignment.is_primary = True
                matching_assignment.save(update_fields=['is_primary'])
        else:
            # Fallback: cambiar Assignment primario por unidad de la Position
            assignment = account.assignments.filter(
                is_active=True,
                position__organization_unit__code=unit_code,
            ).first()
            if assignment is None:
                return Response(
                    {'detail': 'La unidad no esta en sus asignaciones activas.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            account.assignments.filter(is_active=True).update(is_primary=False)
            assignment.is_primary = True
            assignment.save(update_fields=['is_primary'])

        return Response(
            {
                'detail': 'Unidad activa actualizada.',
                'organization_unit_code': unit_code,
                'tenant_code': account.tenant.code,
            },
            status=status.HTTP_200_OK,
        )


# =============================================================================
# Catalogo de roles agrupados por categoria operativa (uso militar exclusivo).
# Hardcoded para mantener simple. El frontend lo usa para renderizar checkboxes
# en el panel de permisos por persona.
# =============================================================================
ROLE_CATEGORIES = [
    {
        'code': 'admin',
        'label': 'Administracion',
        'roles': ['tenant_admin', 'super_admin', 'admin_unidad'],
    },
    {
        'code': 'mando',
        'label': 'Mando',
        'roles': ['comandante_unidad'],
    },
    {
        'code': 'tiro',
        'label': 'Tiro',
        'roles': ['oficial_tiro', 'oficial_observador'],
    },
    {
        'code': 'almacen',
        'label': 'Almacen',
        'roles': ['encargado_almacen'],
    },
]


class RoleCategoriesView(APIView):
    """Devuelve roles del catalogo agrupados por categoria operativa."""
    permission_classes = [IsAuthenticated, HasTenantAccess]

    def get(self, request, *args, **kwargs):
        roles_by_code = {r.code: r for r in Role.objects.filter(is_active=True)}

        categories_out = []
        for cat in ROLE_CATEGORIES:
            cat_roles = []
            for role_code in cat['roles']:
                if role_code in roles_by_code:
                    role = roles_by_code[role_code]
                    cat_roles.append({
                        'code': role.code,
                        'name': role.name,
                        'description': role.description or '',
                    })
            if cat_roles:
                categories_out.append({
                    'code': cat['code'],
                    'label': cat['label'],
                    'roles': cat_roles,
                })
        return Response({'categories': categories_out})


class PersonasPorUnidadView(APIView):
    """Devuelve usuarios con al menos un Assignment activo cuyo rol no es
    'tirador', filtrados por la unidad solicitada (y opcionalmente sus
    descendientes). Solo expone unidades dentro del scope del solicitante."""
    permission_classes = [IsAuthenticated, HasTenantAccess]

    def get(self, request, *args, **kwargs):
        unit_code = request.query_params.get('unit_code')
        include_desc = request.query_params.get('include_descendants') == 'true'
        if not unit_code:
            return Response({'detail': 'unit_code es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        unit = OrganizationUnit.objects.filter(
            tenant=request.tenant, code=unit_code, is_active=True
        ).first()
        if unit is None:
            return Response({'detail': 'Unidad no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        # Validar scope del solicitante.
        requester = getattr(request, 'identity_account', None)
        allowed = get_allowed_unit_ids(requester)
        if allowed is not None and unit.id not in allowed:
            return Response({'detail': 'Unidad fuera de tu rama.'}, status=status.HTTP_403_FORBIDDEN)

        # Recolectar las unidades a buscar.
        if include_desc:
            unit_ids = _descendant_ids([unit.id])
        else:
            unit_ids = {unit.id}

        # Encontrar accounts con presencia activa en esas unidades.
        # Modo v2: via UnitMembership. Modo legacy: via Assignment.organization_unit.
        use_v2 = getattr(settings, 'AUTHZ_USE_UNIT_MEMBERSHIP', False)
        if use_v2:
            relevant_account_ids = UnitMembership.objects.filter(
                unit_id__in=unit_ids,
                is_active=True,
            ).values_list('account_id', flat=True).distinct()
        else:
            relevant_account_ids = Assignment.objects.filter(
                position__organization_unit_id__in=unit_ids,
                is_active=True,
            ).exclude(position__role__code='tirador').values_list('account_id', flat=True).distinct()

        accounts = Account.objects.filter(
            tenant=request.tenant,
            id__in=relevant_account_ids,
        ).select_related('user').order_by('user__apellido_paterno', 'user__nombre')

        results = []
        for account in accounts:
            user = account.user
            assignments = list(account.assignments.filter(is_active=True).select_related(
                'position__role', 'position__scope_policy', 'position__organization_unit',
            ))
            primary = next((a for a in assignments if a.is_primary), None)
            primary_unit = primary.effective_unit if primary else None
            results.append({
                'user': {
                    'id_usuario': user.id_usuario,
                    'rut': user.rut,
                    'grado': user.grado or '',
                    'nombre': user.nombre or '',
                    'apellido_paterno': user.apellido_paterno or '',
                    'apellido_materno': user.apellido_materno or '',
                },
                'unidad_personal_code': primary_unit.code if primary_unit else None,
                'unidad_personal_name': primary_unit.name if primary_unit else None,
                'assignments': [
                    {
                        'id': a.id,
                        'role_code': a.effective_role.code if a.effective_role else None,
                        'role_name': a.effective_role.name if a.effective_role else None,
                        'unit_code': a.effective_unit.code if a.effective_unit else None,
                        'unit_name': a.effective_unit.name if a.effective_unit else None,
                        'scope_code': a.effective_scope.code if a.effective_scope else None,
                        'is_primary': a.is_primary,
                    }
                    for a in assignments
                    if a.effective_role and a.effective_role.code != 'tirador'
                ],
            })
        return Response({'results': results})


class EligibleTargetUnitsView(APIView):
    """Para un usuario dado, devuelve las unidades a las que se le pueden
    asignar roles funcionales: su unidad personal + hasta 2 ancestros, todo
    filtrado por el scope del solicitante."""
    permission_classes = [IsAuthenticated, HasTenantAccess]

    def get(self, request, *args, **kwargs):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        user = Usuario.objects.filter(pk=user_id).first()
        if user is None:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        target_account = getattr(user, 'identity_account', None)
        if target_account is None:
            return Response({'results': [], 'reason': 'sin_account'})

        primary_unit = get_primary_unit(target_account)
        if not primary_unit:
            return Response({'results': [], 'reason': 'sin_unidad_personal'})

        # El usuario target debe estar dentro del scope del solicitante: su
        # unidad primaria tiene que pertenecer a las unidades permitidas.
        requester = getattr(request, 'identity_account', None)
        allowed = get_allowed_unit_ids(requester)
        if allowed is not None and primary_unit.id not in allowed:
            return Response(
                {'detail': 'El usuario objetivo no está dentro de su rama.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        eligible = eligible_target_units(primary_unit, max_levels=2)

        # Filtrar por scope del solicitante.
        if allowed is not None:
            eligible = [u for u in eligible if u.id in allowed]

        return Response({
            'results': [
                {'id': u.id, 'code': u.code, 'name': u.name}
                for u in eligible
            ],
            'unidad_personal_code': primary_unit.code,
        })


class AuditLogView(APIView):
    permission_classes = [IsAuthenticated, HasTenantAccess]
    throttle_classes = [UserRateThrottle]

    def get(self, request, *args, **kwargs):
        account = getattr(request, 'identity_account', None)
        if account is None:
            return Response({'detail': 'Cuenta de identidad no encontrada.'}, status=status.HTTP_403_FORBIDDEN)

        assignments = account.assignments.filter(is_active=True).select_related('position__role')
        role_codes = {item.effective_role.code for item in assignments if item.effective_role}
        if not role_codes.intersection({'tenant_admin', 'super_admin', 'auditor'}):
            return Response({'detail': 'No tiene permisos para consultar auditoria.'}, status=status.HTTP_403_FORBIDDEN)

        limit = int(request.query_params.get('limit', 100))
        if limit > 500:
            limit = 500

        entries = AccessAudit.objects.filter(tenant_code=request.tenant.code).order_by('-created_at')[:limit]
        data = [
            {
                'created_at': row.created_at,
                'endpoint': row.endpoint,
                'action': row.action,
                'allowed': row.allowed,
                'reason': row.reason,
                'organization_unit_code': row.organization_unit_code,
                'user_id_value': row.user_id_value,
            }
            for row in entries
        ]
        return Response({'count': len(data), 'results': data}, status=status.HTTP_200_OK)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

    def get_permissions(self):
        # Cualquier usuario autenticado del tenant puede LEER el catalogo de roles
        # (lo necesita el admin_unidad para asignar roles al crear usuarios). Pero
        # crear/editar/borrar roles sigue siendo tenant_admin.
        if self.action in ('list', 'retrieve'):
            return [perm() for perm in (IsAuthenticated, HasTenantAccess)]
        return [perm() for perm in (IsAuthenticated, HasTenantAccess, IsTenantAdmin)]


class ScopePolicyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ScopePolicy.objects.all()
    serializer_class = ScopePolicySerializer
    # Read-only: cualquier autenticado del tenant ve los scopes (el form de
    # asignacion los necesita para mostrar opciones).
    permission_classes = [IsAuthenticated, HasTenantAccess]




class UserPermissionOverrideViewSet(viewsets.ModelViewSet):
    """CRUD de UserPermissionOverride. Solo tenant_admin/super_admin.

    Filtra por tenant del request: solo se ven overrides de cuentas del
    mismo tenant.
    """
    serializer_class = UserPermissionOverrideSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, IsTenantAdmin]

    def get_queryset(self):
        return UserPermissionOverride.objects.filter(
            account__tenant=self.request.tenant,
        ).select_related('account__user', 'created_by__user')

    def _validate_account_tenant(self, serializer):
        account = serializer.validated_data.get('account')
        if account is not None and account.tenant_id != getattr(self.request.tenant, 'id', None):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'account': 'La cuenta no pertenece al tenant del request.'})

    def perform_create(self, serializer):
        self._validate_account_tenant(serializer)
        # created_by = el solicitante
        serializer.save(created_by=getattr(self.request, 'identity_account', None))

    def perform_update(self, serializer):
        self._validate_account_tenant(serializer)
        serializer.save()


# Catalogo documentado de acciones (clave: action_code -> {label, description}).
# Lo expone /authz/catalog/ y lo consume el frontend para mostrar tooltips.
AUTHZ_ACTION_CATALOG = {
    'read': {'label': 'Leer', 'description': 'Listar y consultar registros.'},
    'create': {'label': 'Crear', 'description': 'Crear nuevos registros.'},
    'update': {'label': 'Editar', 'description': 'Modificar registros existentes.'},
    'delete': {'label': 'Eliminar', 'description': 'Borrar registros.'},
    'read_summary': {
        'label': 'Leer resumen',
        'description': 'Solo metricas agregadas (totales, conteos). NO acceso al detalle individual.',
    },
    'read_own': {
        'label': 'Leer propios',
        'description': 'Solo registros que pertenecen al usuario actual.',
    },
    'export': {'label': 'Exportar', 'description': 'Exportar a CSV / PDF / Excel.'},
    '*': {'label': 'Cualquier accion', 'description': 'Acceso total a todas las acciones del recurso.'},
}

# Recursos documentados (con viewset implementado).
AUTHZ_RESOURCE_CATALOG = {
    'user': 'Usuarios',
    'organization_unit': 'Unidades organizacionales',
    'weapon': 'Armas',
    'armory': 'Armerías',
    'range': 'Polígonos de tiro',
    'shooting_session': 'Lecciones de tiro',
    'shooting_fraction': 'Fracciones de tiro',
    'shooting_result': 'Resultados de tiro',
    'position': 'Puestos',
    'recinto': 'Recintos militares',
    '*': 'Todos los recursos',
}


class AuthzCatalogView(APIView):
    """
    Devuelve el catalogo completo (roles + scopes + rules + recursos + acciones)
    en una sola llamada. Lo consume la UI de /authz para renderizar la matriz
    visual y tooltips sin hacer multiples requests.
    """

    permission_classes = [IsAuthenticated, HasTenantAccess]

    def get(self, request, *args, **kwargs):
        roles = [
            {
                'id': r.id,
                'code': r.code,
                'name': r.name,
                'description': r.description,
                'is_active': r.is_active,
            }
            for r in Role.objects.all().order_by('name')
        ]
        scopes = [
            {
                'id': s.id,
                'code': s.code,
                'name': s.name,
                'description': s.description,
            }
            for s in ScopePolicy.objects.all().order_by('name')
        ]
        resources = [
            {'code': code, 'label': label}
            for code, label in AUTHZ_RESOURCE_CATALOG.items()
        ]
        actions = [
            {'code': code, **info}
            for code, info in AUTHZ_ACTION_CATALOG.items()
        ]
        return Response(
            {
                'roles': roles,
                'scopes': scopes,
                'resources': resources,
                'actions': actions,
            },
            status=status.HTTP_200_OK,
        )


class UserPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'theme': user.theme,
            'palette': user.palette,
            'density': user.density,
        })

    def put(self, request):
        user = request.user
        data = request.data

        if 'theme' in data:
            if data['theme'] in ['nexus-light', 'nexus-dark']:
                user.theme = data['theme']
            else:
                return Response({'error': 'Theme inválido'}, status=status.HTTP_400_BAD_REQUEST)

        if 'palette' in data:
            if data['palette'] in ['corporate-blue', 'military-teal', 'neutral-slate']:
                user.palette = data['palette']
            else:
                return Response({'error': 'Palette inválida'}, status=status.HTTP_400_BAD_REQUEST)

        if 'density' in data:
            if data['density'] in ['comfortable', 'compact']:
                user.density = data['density']
            else:
                return Response({'error': 'Density inválido'}, status=status.HTTP_400_BAD_REQUEST)

        user.save()

        return Response({
            'theme': user.theme,
            'palette': user.palette,
            'density': user.density,
        })


class DesignSystemAppearanceView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put', 'delete']

    appearance_fields = (
        'ds_theme',
        'ds_accent',
        'ds_bg',
        'ds_font',
        'ds_radius',
        'ds_iconfam',
        'ds_ambient',
        'ds_ambcolor',
    )

    def get(self, request):
        return Response(DesignSystemAppearanceSerializer(request.user).data)

    def put(self, request):
        serializer = DesignSystemAppearanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        with transaction.atomic():
            for field_name in self.appearance_fields:
                setattr(user, field_name, serializer.validated_data[field_name])
            user.save(update_fields=self.appearance_fields)

        return Response(
            DesignSystemAppearanceSerializer(user).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        user = request.user
        defaults = {
            field_name: user._meta.get_field(field_name).get_default()
            for field_name in self.appearance_fields
        }

        with transaction.atomic():
            for field_name, value in defaults.items():
                setattr(user, field_name, value)
            user.save(update_fields=self.appearance_fields)

        return Response(status=status.HTTP_204_NO_CONTENT)
        
