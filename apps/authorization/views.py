from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from apps.authorization.models import Permission, PositionPermission, RolePermission
from apps.authorization.permissions import HasTenantAccess, IsTenantAdmin
from apps.authorization.serializers import (
    PermissionSerializer,
    PositionPermissionSerializer,
    RolePermissionSerializer,
)


def _is_super_admin(request):
    """True si el solicitante tiene un assignment activo con rol super_admin."""
    account = getattr(request, 'identity_account', None)
    if account is None:
        return False
    return account.assignments.filter(
        position__role__code='super_admin', is_active=True,
    ).exists()


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """Catálogo de permisos atómicos del sistema. Solo lectura.
    El catálogo se gestiona via management command init_permissions.
    """

    queryset = Permission.objects.filter(is_active=True).order_by('category', 'code')
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess]


class RolePermissionViewSet(viewsets.ModelViewSet):
    """Permisos asignados a roles. Solo tenant_admin puede modificar.

    Solo se ven los RolePermission de roles del tenant del request o de roles
    de sistema (tenant nulo, globales). Los roles de sistema solo los puede
    modificar super_admin.
    """

    queryset = RolePermission.objects.all().select_related(
        'role', 'permission',
    ).order_by('role__name', 'permission__category', 'permission__code')
    serializer_class = RolePermissionSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, IsTenantAdmin]

    def get_queryset(self):
        from django.db.models import Q
        return super().get_queryset().filter(
            Q(role__tenant=self.request.tenant) | Q(role__tenant__isnull=True),
        )

    def _check_system_role(self, role):
        if role is not None and getattr(role, 'is_system', False) and not _is_super_admin(self.request):
            raise PermissionDenied('Solo super_admin puede modificar roles de sistema.')

    def perform_create(self, serializer):
        self._check_system_role(serializer.validated_data.get('role'))
        serializer.save()

    def perform_update(self, serializer):
        # Bloquea tanto el rol actual como uno nuevo en el body.
        self._check_system_role(serializer.instance.role)
        self._check_system_role(serializer.validated_data.get('role'))
        serializer.save()

    def perform_destroy(self, instance):
        self._check_system_role(instance.role)
        instance.delete()


class PositionPermissionViewSet(viewsets.ModelViewSet):
    """Permisos adicionales asignados a puestos específicos. Solo tenant_admin.

    Filtrado por el tenant del request.
    """

    queryset = PositionPermission.objects.all().select_related(
        'position', 'permission',
    ).order_by('position__code', 'permission__code')
    serializer_class = PositionPermissionSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, IsTenantAdmin]

    def get_queryset(self):
        return super().get_queryset().filter(position__tenant=self.request.tenant)
