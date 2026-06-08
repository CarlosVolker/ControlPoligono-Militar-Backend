from django.conf import settings

from apps.authorization.scope import get_allowed_unit_ids, get_primary_unit


class TenantScopedQuerysetMixin:
    tenant_field = "tenant"
    organization_field = "organization_unit"

    def get_tenant(self):
        return getattr(self.request, "tenant", None)

    def get_queryset(self):
        queryset = super().get_queryset()
        tenant = self.get_tenant()
        if tenant is None:
            return queryset.none()
        queryset = queryset.filter(**{self.tenant_field: tenant})

        if not hasattr(queryset.model, self.organization_field):
            return queryset

        account = getattr(self.request, "identity_account", None)
        if account is None:
            return queryset.none()

        allowed_unit_ids = get_allowed_unit_ids(account)
        if allowed_unit_ids is None:
            return queryset
        if not allowed_unit_ids:
            return queryset.none()
        return queryset.filter(**{f"{self.organization_field}__in": allowed_unit_ids})

    def perform_create(self, serializer):
        model = serializer.Meta.model
        extra = {}
        if hasattr(model, "tenant"):
            extra["tenant"] = self.get_tenant()
        if hasattr(model, self.organization_field):
            org_unit = getattr(self.request, "organization_unit", None)
            if org_unit is None:
                account = getattr(self.request, "identity_account", None)
                if account is not None:
                    # Modo v2: leer unidad desde UnitMembership primaria
                    # Modo legacy: leer unidad desde Assignment primario effective_unit
                    org_unit = get_primary_unit(account)
            extra[self.organization_field] = org_unit
        serializer.save(**extra)
