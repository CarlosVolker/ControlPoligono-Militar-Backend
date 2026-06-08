from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.armory.models import Armory
from apps.armory.serializers import ArmorySerializer
from apps.authorization.permissions import HasResourcePermission, HasTenantAccess
from apipoligono.mixins import TenantScopedQuerysetMixin


class ArmoryViewSet(TenantScopedQuerysetMixin, viewsets.ModelViewSet):
    """CRUD de Armorias. Scopeado por tenant + rama del usuario (via el mixin).
    Permission resource: 'armory'."""
    queryset = Armory.objects.all().select_related('organization_unit', 'tenant')
    serializer_class = ArmorySerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'armory'
