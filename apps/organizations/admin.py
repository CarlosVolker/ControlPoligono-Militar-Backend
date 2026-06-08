from django.contrib import admin

from .models import OrganizationUnit, Recinto


@admin.register(OrganizationUnit)
class OrganizationUnitAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "tenant", "unit_type", "parent", "is_active")
    list_filter = ("tenant", "unit_type", "is_active")
    search_fields = ("name", "code")


@admin.register(Recinto)
class RecintoAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "tenant", "unit_count", "is_active")
    list_filter = ("tenant", "is_active")
    search_fields = ("name", "code")
    filter_horizontal = ("units",)

    def unit_count(self, obj):
        return obj.units.count()
    unit_count.short_description = "Unidades"
