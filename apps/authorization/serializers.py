from rest_framework import serializers

from apps.authorization.models import (
    Permission,
    PositionPermission,
    Role,
    RolePermission,
    ScopePolicy,
    UserPermissionOverride,
)


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ('id', 'code', 'name', 'category', 'description', 'is_active')


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ('id', 'code', 'name', 'description', 'is_active', 'is_system')


class ScopePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = ScopePolicy
        fields = ("id", "code", "name", "description")



class RolePermissionSerializer(serializers.ModelSerializer):
    role_code = serializers.CharField(source='role.code', read_only=True)
    permission_code = serializers.CharField(source='permission.code', read_only=True)
    permission_name = serializers.CharField(source='permission.name', read_only=True)
    permission_category = serializers.CharField(source='permission.category', read_only=True)

    class Meta:
        model = RolePermission
        fields = ('id', 'role', 'role_code', 'permission', 'permission_code',
                  'permission_name', 'permission_category', 'allowed')


class PositionPermissionSerializer(serializers.ModelSerializer):
    position_code = serializers.CharField(source='position.code', read_only=True)
    permission_code = serializers.CharField(source='permission.code', read_only=True)
    permission_name = serializers.CharField(source='permission.name', read_only=True)

    class Meta:
        model = PositionPermission
        fields = ('id', 'position', 'position_code', 'permission', 'permission_code',
                  'permission_name', 'allowed')


class UserPermissionOverrideSerializer(serializers.ModelSerializer):
    account_rut = serializers.CharField(source="account.user.rut", read_only=True)
    created_by_rut = serializers.CharField(
        source="created_by.user.rut", read_only=True, allow_null=True,
    )
    permission_code = serializers.SlugRelatedField(
        source='permission', slug_field='code',
        queryset=Permission.objects.all(), allow_null=True, required=False,
    )

    class Meta:
        model = UserPermissionOverride
        fields = (
            "id", "account", "account_rut",
            "permission", "permission_code",
            "resource", "action", "allowed", "reason",
            "created_by", "created_by_rut", "created_at",
        )
        read_only_fields = (
            "created_by", "created_by_rut", "account_rut", "created_at",
        )
