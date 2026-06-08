from rest_framework import serializers

from apps.armory.models import Armory


class ArmorySerializer(serializers.ModelSerializer):
    organization_unit_code = serializers.CharField(
        source='organization_unit.code', read_only=True,
    )
    organization_unit_code_write = serializers.CharField(
        write_only=True, required=False, allow_null=True,
    )
    armas_count = serializers.IntegerField(source='armas.count', read_only=True)

    class Meta:
        model = Armory
        fields = (
            'id', 'tenant', 'organization_unit', 'organization_unit_code',
            'organization_unit_code_write', 'code', 'name', 'descripcion',
            'is_active', 'created_at', 'updated_at', 'armas_count',
        )
        read_only_fields = (
            'tenant', 'organization_unit', 'organization_unit_code',
            'armas_count', 'created_at', 'updated_at',
        )

    def _resolve_unit(self, code, tenant):
        if not code:
            return None
        from apps.organizations.models import OrganizationUnit
        try:
            return OrganizationUnit.objects.get(tenant=tenant, code=code, is_active=True)
        except OrganizationUnit.DoesNotExist:
            raise serializers.ValidationError({
                'organization_unit_code_write': f"Unidad '{code}' no encontrada.",
            })

    def create(self, validated_data):
        code = validated_data.pop('organization_unit_code_write', None)
        instance = super().create(validated_data)
        if code:
            unit = self._resolve_unit(code, instance.tenant)
            instance.organization_unit = unit
            instance.save(update_fields=['organization_unit'])
        return instance

    def update(self, instance, validated_data):
        code = validated_data.pop('organization_unit_code_write', serializers.empty)
        instance = super().update(instance, validated_data)
        if code is not serializers.empty:
            unit = self._resolve_unit(code, instance.tenant) if code else None
            if unit is None:
                # Mantener organization_unit obligatorio: no permitir None.
                raise serializers.ValidationError({
                    'organization_unit_code_write': 'No puede vaciarse; la armoria debe pertenecer a una unidad.',
                })
            instance.organization_unit = unit
            instance.save(update_fields=['organization_unit'])
        return instance
