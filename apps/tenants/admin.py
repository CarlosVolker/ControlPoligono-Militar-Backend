from django.contrib import admin

from .models import Tenant


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "context", "is_active")
    list_filter = ("context", "is_active")
    search_fields = ("name", "code")
