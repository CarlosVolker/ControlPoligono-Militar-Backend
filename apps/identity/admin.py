from django.contrib import admin

from .models import Account, Assignment, Person, Position, UnitMembership


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("full_name", "document_id", "email", "is_active")
    list_filter = ("is_active",)
    search_fields = ("full_name", "document_id", "email")


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("user", "person", "tenant", "is_active")
    list_filter = ("tenant", "is_active")
    search_fields = ("user__username", "person__full_name", "tenant__code")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("account", "position", "is_primary", "is_active")
    list_filter = ("is_primary", "is_active")
    search_fields = ("account__user__username", "position__code")


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "organization_unit", "role", "scope_policy", "is_active")
    list_filter = ("is_active", "role")
    search_fields = ("code", "name")


@admin.register(UnitMembership)
class UnitMembershipAdmin(admin.ModelAdmin):
    list_display = ("account", "unit", "is_primary", "is_active")
    list_filter = ("is_primary", "is_active")
    search_fields = ("account__user__username", "unit__code")
