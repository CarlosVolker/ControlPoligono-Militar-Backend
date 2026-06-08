from django.contrib import admin

from .models import Armory


@admin.register(Armory)
class ArmoryAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "tenant", "organization_unit", "is_active")
    list_filter = ("tenant", "is_active")
    search_fields = ("name", "code")
