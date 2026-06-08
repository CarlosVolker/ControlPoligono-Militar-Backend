from django.contrib import admin

from .models import AccessAudit, Permission, Role, RolePermission, ScopePolicy


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active", "is_system")
    list_filter = ("is_active", "is_system")
    search_fields = ("name", "code")


@admin.register(ScopePolicy)
class ScopePolicyAdmin(admin.ModelAdmin):
    list_display = ("name", "code")
    search_fields = ("name", "code")


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("code", "name")


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ("role", "permission", "allowed")
    list_filter = ("allowed", "role")
    search_fields = ("role__code", "permission__code")


@admin.register(AccessAudit)
class AccessAuditAdmin(admin.ModelAdmin):
    list_display = ("created_at", "endpoint", "action", "allowed", "tenant_code", "organization_unit_code", "user_id_value")
    list_filter = ("allowed", "tenant_code", "action")
    search_fields = ("endpoint", "reason", "tenant_code", "organization_unit_code")
