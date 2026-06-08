from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apipoligono.mixins import TenantScopedQuerysetMixin
from apps.authorization.permissions import HasResourcePermission, HasTenantAccess
from apps.authorization.scope import get_allowed_unit_ids
from apps.identity.models import Account, Assignment, Position, UnitMembership
from apps.identity.serializers import (
    PositionHolderSerializer,
    PositionSerializer,
    UnitMembershipSerializer,
)


class PositionViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    """CRUD de Positions (puestos). Scopeado por tenant + rama del usuario.

    Las acciones `asignar_holder`, `quitar_holder` e `historico` gestionan a
    quien ocupa el puesto sin tocar el puesto en si.
    """

    queryset = Position.objects.all().select_related(
        'organization_unit', 'role', 'scope_policy', 'armory', 'tenant',
    )
    serializer_class = PositionSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'position'
    action_permission_map = {
        'asignar_holder': 'update',
        'quitar_holder': 'update',
        'historico': 'read',
    }

    @action(detail=True, methods=['post'], url_path='asignar-holder')
    def asignar_holder(self, request, pk=None):
        """Asigna una persona como holder activo de este puesto.

        Payload: {account_id: int, is_primary?: bool, starts_at?: ISO datetime}

        Si la Position es is_unique_holder=True y ya hay un holder activo,
        ese holder se desactiva (ends_at=now). Despues se crea el nuevo
        Assignment activo, replicando role/scope/unit en los campos legacy
        para que el codigo viejo siga funcionando durante la transicion.
        """
        position = self.get_object()
        account_id = request.data.get('account_id')
        if not account_id:
            return Response({'detail': 'account_id es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        account = Account.objects.filter(pk=account_id, tenant=request.tenant).first()
        if account is None:
            return Response({'detail': 'Cuenta no existe en este tenant.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validar scope: la unidad del puesto debe estar en la rama del solicitante.
        requester = getattr(request, 'identity_account', None)
        allowed = get_allowed_unit_ids(requester)
        if allowed is not None and position.organization_unit_id not in allowed:
            return Response({'detail': 'La unidad del puesto esta fuera de tu rama.'}, status=status.HTTP_403_FORBIDDEN)

        # Si el puesto es unico, desactivar holders previos.
        if position.is_unique_holder:
            position.holders.filter(is_active=True).update(
                is_active=False, ends_at=timezone.now(),
            )

        # Idempotencia: si la misma persona ya esta activa, no duplicar.
        existing = position.holders.filter(account=account, is_active=True).first()
        if existing:
            return Response(
                {'detail': 'Esta persona ya es holder activo de este puesto.', 'assignment_id': existing.id},
                status=status.HTTP_200_OK,
            )

        is_primary = bool(request.data.get('is_primary', False))
        if is_primary:
            account.assignments.filter(is_primary=True).update(is_primary=False)

        starts_at = request.data.get('starts_at') or timezone.now()

        assignment = Assignment.objects.create(
            account=account,
            position=position,
            is_primary=is_primary,
            is_active=True,
            starts_at=starts_at,
        )
        return Response(
            PositionHolderSerializer(assignment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=['post'],
        url_path=r'quitar-holder/(?P<assignment_id>\d+)',
    )
    def quitar_holder(self, request, pk=None, assignment_id=None):
        """Cesa un holder de este puesto: pone is_active=False y ends_at=now()."""
        position = self.get_object()
        assignment = position.holders.filter(pk=assignment_id, is_active=True).first()
        if assignment is None:
            return Response({'detail': 'Holder no encontrado o ya cesado.'}, status=status.HTTP_404_NOT_FOUND)
        assignment.is_active = False
        assignment.is_primary = False
        assignment.ends_at = timezone.now()
        assignment.save(update_fields=['is_active', 'is_primary', 'ends_at'])
        return Response({'detail': 'Holder cesado.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='historico')
    def historico(self, request, pk=None):
        """Devuelve todos los holders de este puesto (activos + historicos)."""
        position = self.get_object()
        holders = position.holders.all().select_related('account__user').order_by('-starts_at', '-created_at')
        return Response({
            'position_code': position.code,
            'position_name': position.name,
            'holders': PositionHolderSerializer(holders, many=True).data,
        })


class UnitMembershipViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    """Pertenencias orgánicas de usuarios a unidades.

    Distinto de Assignment (puesto funcional).
    Modela "esta persona pertenece orgánicamente a esta unidad".
    GET es de solo lectura para usuarios con view_unit.
    POST/DELETE requieren assign_positions / revoke_positions.
    """

    queryset = UnitMembership.objects.all().select_related(
        'account__user', 'unit', 'tenant',
    )
    serializer_class = UnitMembershipSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'position'
    organization_field = 'unit'
    action_permission_map = {
        'list': 'read',
        'retrieve': 'read',
        'create': 'create',
        'update': 'update',
        'partial_update': 'update',
        'destroy': 'delete',
    }

    def perform_create(self, serializer):
        serializer.save(tenant=self.get_tenant())
