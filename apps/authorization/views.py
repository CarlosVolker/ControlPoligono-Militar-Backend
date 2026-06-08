from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.authorization.models import Permission, PositionPermission, RolePermission
from apps.authorization.permissions import HasTenantAccess, IsTenantAdmin
from apps.authorization.serializers import (
    PermissionSerializer,
    PositionPermissionSerializer,
    RolePermissionSerializer,
)


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """Catálogo de permisos atómicos del sistema. Solo lectura.
    El catálogo se gestiona via management command init_permissions.
    """

    queryset = Permission.objects.filter(is_active=True).order_by('category', 'code')
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess]


class RolePermissionViewSet(viewsets.ModelViewSet):
    """Permisos asignados a roles. Solo tenant_admin puede modificar."""

    queryset = RolePermission.objects.all().select_related(
        'role', 'permission',
    ).order_by('role__name', 'permission__category', 'permission__code')
    serializer_class = RolePermissionSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, IsTenantAdmin]


class PositionPermissionViewSet(viewsets.ModelViewSet):
    """Permisos adicionales asignados a puestos específicos. Solo tenant_admin."""

    queryset = PositionPermission.objects.all().select_related(
        'position', 'permission',
    ).order_by('position__code', 'permission__code')
    serializer_class = PositionPermissionSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, IsTenantAdmin]
