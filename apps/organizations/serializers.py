from rest_framework import serializers

from apps.organizations.models import OrganizationUnit, Recinto


class OrganizationUnitSerializer(serializers.ModelSerializer):
    parent_code = serializers.CharField(source="parent.code", read_only=True)

    class Meta:
        model = OrganizationUnit
        fields = (
            "id",
            "tenant",
            "parent",
            "parent_code",
            "code",
            "name",
            "unit_type",
            "is_active",
        )
        read_only_fields = ("tenant",)


class RecintoSerializer(serializers.ModelSerializer):
    units = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=OrganizationUnit.objects.all(),
        required=False,
    )
    unit_codes = serializers.SerializerMethodField()
    unit_count = serializers.SerializerMethodField()

    class Meta:
        model = Recinto
        fields = (
            'id', 'tenant', 'code', 'name', 'description',
            'is_active', 'units', 'unit_codes', 'unit_count',
        )
        read_only_fields = ('tenant', 'unit_codes', 'unit_count')

    def get_unit_codes(self, obj):
        return list(obj.units.values_list('code', flat=True).order_by('code'))

    def get_unit_count(self, obj):
        return obj.units.count()
