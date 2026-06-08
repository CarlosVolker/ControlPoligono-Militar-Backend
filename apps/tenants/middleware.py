from apps.tenants.models import Tenant
from apps.organizations.models import OrganizationUnit


class TenantContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        tenant_code = request.headers.get("X-Tenant-Code") or request.GET.get("tenant")
        unit_code = request.headers.get("X-Org-Unit-Code") or request.GET.get("org_unit")
        request.tenant = None
        request.tenant_code = tenant_code
        request.organization_unit = None

        if tenant_code:
            request.tenant = Tenant.objects.filter(code=tenant_code, is_active=True).first()
            if request.tenant and unit_code:
                request.organization_unit = OrganizationUnit.objects.filter(
                    tenant=request.tenant,
                    code=unit_code,
                    is_active=True,
                ).first()

        response = self.get_response(request)
        return response
