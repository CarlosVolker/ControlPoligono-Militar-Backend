from rest_framework import serializers

from apps.identity.models import Assignment, Position, UnitMembership


class PositionSerializer(serializers.ModelSerializer):
    organization_unit_code = serializers.CharField(source='organization_unit.code', read_only=True)
    organization_unit_name = serializers.CharField(source='organization_unit.name', read_only=True)
    armory_code = serializers.CharField(source='armory.code', read_only=True, allow_null=True)
    role_code = serializers.CharField(source='role.code', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    scope_code = serializers.CharField(source='scope_policy.code', read_only=True, allow_null=True)
    recinto_code = serializers.CharField(source='recinto.code', read_only=True, allow_null=True)
    recinto_name = serializers.CharField(source='recinto.name', read_only=True, allow_null=True)

    # Writes con codes (no ids) para no acoplar al pk.
    organization_unit_code_write = serializers.CharField(write_only=True)
    armory_code_write = serializers.CharField(write_only=True, required=False, allow_null=True)
    role_code_write = serializers.CharField(write_only=True)
    scope_code_write = serializers.CharField(write_only=True, required=False, allow_null=True)
    recinto_code_write = serializers.CharField(write_only=True, required=False, allow_null=True)

    current_holders_count = serializers.SerializerMethodField()

    class Meta:
        model = Position
        fields = (
            'id', 'tenant', 'code', 'name',
            'organization_unit', 'organization_unit_code', 'organization_unit_name', 'organization_unit_code_write',
            'armory', 'armory_code', 'armory_code_write',
            'role', 'role_code', 'role_name', 'role_code_write',
            'scope_policy', 'scope_code', 'scope_code_write',
            'recinto', 'recinto_code', 'recinto_name', 'recinto_code_write',
            'description', 'is_active', 'is_unique_holder',
            'current_holders_count',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'tenant', 'organization_unit', 'armory', 'role', 'scope_policy', 'recinto',
            'organization_unit_code', 'organization_unit_name', 'armory_code',
            'role_code', 'role_name', 'scope_code', 'recinto_code', 'recinto_name',
            'current_holders_count', 'created_at', 'updated_at',
        )

    def get_current_holders_count(self, obj):
        return obj.holders.filter(is_active=True).count()

    def _resolve(self, tenant, unit_code, armory_code, role_code, scope_code, recinto_code=None):
        from apps.organizations.models import OrganizationUnit, Recinto
        from apps.armory.models import Armory
        from apps.authorization.models import Role, ScopePolicy

        unit = OrganizationUnit.objects.filter(tenant=tenant, code=unit_code, is_active=True).first()
        if unit is None:
            raise serializers.ValidationError({'organization_unit_code_write': f"Unidad '{unit_code}' no encontrada."})

        armory = None
        if armory_code:
            armory = Armory.objects.filter(tenant=tenant, code=armory_code, is_active=True).first()
            if armory is None:
                raise serializers.ValidationError({'armory_code_write': f"Armoria '{armory_code}' no encontrada."})

        role = Role.objects.filter(code=role_code).first()
        if role is None:
            raise serializers.ValidationError({'role_code_write': f"Rol '{role_code}' no existe."})

        scope = None
        if scope_code:
            scope = ScopePolicy.objects.filter(code=scope_code).first()
            if scope is None:
                raise serializers.ValidationError({'scope_code_write': f"Scope '{scope_code}' no existe."})

        recinto = None
        if recinto_code:
            recinto = Recinto.objects.filter(tenant=tenant, code=recinto_code, is_active=True).first()
            if recinto is None:
                raise serializers.ValidationError({'recinto_code_write': f"Recinto '{recinto_code}' no encontrado."})

        return unit, armory, role, scope, recinto

    def create(self, validated_data):
        tenant = validated_data['tenant']
        unit_code = validated_data.pop('organization_unit_code_write')
        armory_code = validated_data.pop('armory_code_write', None)
        role_code = validated_data.pop('role_code_write')
        scope_code = validated_data.pop('scope_code_write', None)
        recinto_code = validated_data.pop('recinto_code_write', None)
        unit, armory, role, scope, recinto = self._resolve(
            tenant, unit_code, armory_code, role_code, scope_code, recinto_code,
        )
        validated_data.update({
            'organization_unit': unit,
            'armory': armory,
            'role': role,
            'scope_policy': scope,
            'recinto': recinto,
        })
        return super().create(validated_data)

    def update(self, instance, validated_data):
        unit_code = validated_data.pop('organization_unit_code_write', None)
        armory_code = validated_data.pop('armory_code_write', serializers.empty)
        role_code = validated_data.pop('role_code_write', None)
        scope_code = validated_data.pop('scope_code_write', serializers.empty)
        recinto_code = validated_data.pop('recinto_code_write', serializers.empty)

        if unit_code:
            from apps.organizations.models import OrganizationUnit
            unit = OrganizationUnit.objects.filter(tenant=instance.tenant, code=unit_code, is_active=True).first()
            if unit is None:
                raise serializers.ValidationError({'organization_unit_code_write': f"Unidad '{unit_code}' no encontrada."})
            instance.organization_unit = unit
        if armory_code is not serializers.empty:
            from apps.armory.models import Armory
            if armory_code:
                armory = Armory.objects.filter(tenant=instance.tenant, code=armory_code, is_active=True).first()
                if armory is None:
                    raise serializers.ValidationError({'armory_code_write': f"Armoria '{armory_code}' no encontrada."})
                instance.armory = armory
            else:
                instance.armory = None
        if role_code:
            from apps.authorization.models import Role
            role = Role.objects.filter(code=role_code).first()
            if role is None:
                raise serializers.ValidationError({'role_code_write': f"Rol '{role_code}' no existe."})
            instance.role = role
        if scope_code is not serializers.empty:
            from apps.authorization.models import ScopePolicy
            if scope_code:
                scope = ScopePolicy.objects.filter(code=scope_code).first()
                if scope is None:
                    raise serializers.ValidationError({'scope_code_write': f"Scope '{scope_code}' no existe."})
                instance.scope_policy = scope
            else:
                instance.scope_policy = None
        if recinto_code is not serializers.empty:
            from apps.organizations.models import Recinto
            if recinto_code:
                recinto = Recinto.objects.filter(tenant=instance.tenant, code=recinto_code, is_active=True).first()
                if recinto is None:
                    raise serializers.ValidationError({'recinto_code_write': f"Recinto '{recinto_code}' no encontrado."})
                instance.recinto = recinto
            else:
                instance.recinto = None
        return super().update(instance, validated_data)


class PositionHolderSerializer(serializers.ModelSerializer):
    """Resumen de un Assignment (holder) de una Position."""

    rut = serializers.CharField(source='account.user.rut', read_only=True)
    nombre = serializers.SerializerMethodField()
    grado = serializers.CharField(source='account.user.grado', read_only=True)

    class Meta:
        model = Assignment
        fields = (
            'id', 'account', 'rut', 'nombre', 'grado',
            'is_primary', 'is_active', 'starts_at', 'ends_at', 'created_at',
        )
        read_only_fields = fields

    def get_nombre(self, obj):
        u = obj.account.user
        return f"{u.apellido_paterno or ''} {u.apellido_materno or ''}, {u.nombre or ''}".strip()


class UnitMembershipSerializer(serializers.ModelSerializer):
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    rut = serializers.CharField(source='account.user.rut', read_only=True)

    class Meta:
        model = UnitMembership
        fields = (
            'id', 'account', 'rut', 'unit', 'unit_code', 'unit_name',
            'is_primary', 'is_active', 'starts_at', 'ends_at', 'created_at',
        )
        read_only_fields = ('rut', 'unit_code', 'unit_name', 'created_at')
