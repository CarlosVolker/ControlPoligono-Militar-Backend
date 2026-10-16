from collections.abc import Mapping

from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from .models import (Usuario,
                     DSTheme,
                     DSAccent,
                     DSBg,
                     DSFont,
                     DSRadius,
                     DSIconfam,
                     DSAmbient,
                     DSAmbcolor,
                     Calibre,
                     Arma,
                     PoligonoTiro,
                     LeccionTiro,
                     FraccionTiro,
                     ResultadoTiro,
                     EjercicioMilitar,
                      ConsumoMunicion,
                      ConsumoArma)


class DesignSystemAppearanceSerializer(serializers.Serializer):
    ds_theme = serializers.ChoiceField(
        choices=DSTheme.choices, required=True, allow_null=False, allow_blank=False
    )
    ds_accent = serializers.ChoiceField(
        choices=DSAccent.choices, required=True, allow_null=False, allow_blank=False
    )
    ds_bg = serializers.ChoiceField(
        choices=DSBg.choices, required=True, allow_null=False, allow_blank=False
    )
    ds_font = serializers.ChoiceField(
        choices=DSFont.choices, required=True, allow_null=False, allow_blank=False
    )
    ds_radius = serializers.ChoiceField(
        choices=DSRadius.choices, required=True, allow_null=False, allow_blank=False
    )
    ds_iconfam = serializers.ChoiceField(
        choices=DSIconfam.choices, required=True, allow_null=False, allow_blank=False
    )
    ds_ambient = serializers.ChoiceField(
        choices=DSAmbient.choices, required=True, allow_null=False, allow_blank=False
    )
    ds_ambcolor = serializers.ChoiceField(
        choices=DSAmbcolor.choices, required=True, allow_null=False, allow_blank=False
    )

    def __init__(self, *args, **kwargs):
        kwargs['partial'] = False
        super().__init__(*args, **kwargs)

    def to_internal_value(self, data):
        if not isinstance(data, Mapping):
            return super().to_internal_value(data)

        field_names = set(self.fields)
        missing_fields = field_names.difference(data)
        non_field_errors = [
            'Unexpected field.'
            for key in data
            if key not in field_names
        ]
        errors = {}
        invalid_types = {
            field_name: ['Expected a string.']
            for field_name in field_names
            if field_name in data and data[field_name] is not None and not isinstance(data[field_name], str)
        }
        validated_input = {
            key: value
            for key, value in data.items()
            if key in field_names and key not in invalid_types
        }

        try:
            validated_data = super().to_internal_value(validated_input)
        except serializers.ValidationError as exc:
            if isinstance(exc.detail, Mapping):
                for field_name, field_errors in exc.detail.items():
                    if field_name in missing_fields:
                        non_field_errors.extend(field_errors)
                    else:
                        errors[field_name] = field_errors
            else:
                non_field_errors.extend(exc.detail)

        errors.update(invalid_types)
        if non_field_errors:
            errors[serializers.api_settings.NON_FIELD_ERRORS_KEY] = non_field_errors
        if errors:
            raise serializers.ValidationError(errors)
        return validated_data


class UsuarioSerializer(serializers.ModelSerializer):
    habilitado = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()
    primary_assignment = serializers.SerializerMethodField()
    assignments = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ('id_usuario', 'rut', 'grado', 'nombre', 'apellido_paterno',
                  'apellido_materno', 'correo', 'habilitado', 'is_locked',
                  'must_change_password', 'password_changed_at',
                  'primary_assignment', 'assignments')
        read_only_fields = ('must_change_password', 'password_changed_at',
                            'is_locked', 'primary_assignment', 'assignments')

    def get_habilitado(self, obj):
        return bool(obj.password)

    def get_is_locked(self, obj):
        """True si la cuenta está bloqueada por demasiados intentos fallidos."""
        from axes.models import AccessAttempt
        from django.conf import settings as django_settings
        limit = getattr(django_settings, 'AXES_FAILURE_LIMIT', 5)
        return AccessAttempt.objects.filter(
            username=obj.rut,
            failures_since_start__gte=limit,
        ).exists()

    def get_primary_assignment(self, obj):
        # Devuelve el assignment principal activo (codigos de unidad/rol/scope)
        # para que el frontend pueda mostrarlo y editarlo sin llamadas extra.
        account = getattr(obj, 'identity_account', None)
        if account is None:
            return None
        assignment = account.assignments.filter(
            is_active=True, is_primary=True
        ).select_related('position__role', 'position__scope_policy', 'position__organization_unit').first()
        if assignment is None:
            return None
        return {
            'unit_code': assignment.effective_unit.code if assignment.effective_unit else None,
            'role_code': assignment.effective_role.code if assignment.effective_role else None,
            'scope_code': assignment.effective_scope.code if assignment.effective_scope else None,
        }

    def get_assignments(self, obj):
        account = getattr(obj, 'identity_account', None)
        if account is None:
            return []
        return [
            {
                'id': a.id,
                'role_code': a.effective_role.code if a.effective_role else None,
                'role_name': a.effective_role.name if a.effective_role else None,
                'unit_code': a.effective_unit.code if a.effective_unit else None,
                'scope_code': a.effective_scope.code if a.effective_scope else None,
                'is_primary': a.is_primary,
            }
            for a in account.assignments.filter(is_active=True).select_related(
                'position__role', 'position__scope_policy', 'position__organization_unit',
            )
        ]

    def create(self, validated_data):
        # Asignar rut como username
        validated_data['username'] = validated_data['rut']
        # Onboarding: asignar contrasena temporal y forzar cambio en primer login.
        # El usuario nunca se crea sin contrasena; siempre nace con la temporal hasheada
        # y must_change_password=True. Asi cierra el hueco del campo "habilitado".
        validated_data['password'] = make_password(settings.DEFAULT_TEMP_PASSWORD)
        validated_data['must_change_password'] = True
        return super().create(validated_data)
    
class CalibreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calibre
        fields = ('id_calibre', 'code', 'nombre', 'is_active')


class ArmaSerializer(serializers.ModelSerializer):
    # Lectura: codes legibles del almacen y (derivada) de su unidad.
    armory_code = serializers.CharField(source='armory.code', read_only=True)
    armory_name = serializers.CharField(source='armory.name', read_only=True)
    organization_unit_code = serializers.CharField(source='armory.organization_unit.code', read_only=True)
    # Escritura: el frontend envia el code del armory; la unidad se deriva.
    armory_code_write = serializers.CharField(write_only=True, required=False, allow_null=True)
    # Calibre
    calibre_code = serializers.CharField(source='calibre.code', read_only=True, allow_null=True)
    calibre_code_write = serializers.CharField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Arma
        fields = (
            'id_arma', 'tenant', 'organization_unit',
            'armory', 'armory_code', 'armory_name', 'armory_code_write',
            'organization_unit_code',
            'calibre_code', 'calibre_code_write',
            'tipo_arma', 'modelo_arma', 'numero_serie',
        )
        read_only_fields = (
            'tenant', 'organization_unit', 'armory',
            'armory_code', 'armory_name', 'organization_unit_code',
            'calibre_code',
        )
        validators = [
            UniqueTogetherValidator(
                queryset=Arma.objects.all(),
                fields=['modelo_arma', 'numero_serie'],
                message='Ya existe un arma con ese modelo y numero de serie.',
            ),
        ]

    def _resolve_armory(self, code, tenant):
        if not code:
            return None
        from apps.armory.models import Armory
        try:
            return Armory.objects.get(tenant=tenant, code=code, is_active=True)
        except Armory.DoesNotExist:
            raise serializers.ValidationError({
                'armory_code_write': f"Armoria '{code}' no encontrada.",
            })

    def _resolve_calibre(self, code):
        if not code:
            return None
        try:
            return Calibre.objects.get(code=code, is_active=True)
        except Calibre.DoesNotExist:
            raise serializers.ValidationError({
                'calibre_code_write': f"Calibre '{code}' no encontrado.",
            })

    def create(self, validated_data):
        armory_code = validated_data.pop('armory_code_write', None)
        calibre_code = validated_data.pop('calibre_code_write', None)
        instance = super().create(validated_data)
        update_fields = []
        if armory_code:
            armory = self._resolve_armory(armory_code, instance.tenant)
            instance.armory = armory
            instance.organization_unit = armory.organization_unit
            update_fields += ['armory', 'organization_unit']
        if calibre_code is not None:
            instance.calibre = self._resolve_calibre(calibre_code)
            update_fields.append('calibre')
        if update_fields:
            instance.save(update_fields=update_fields)
        return instance

    def update(self, instance, validated_data):
        armory_code = validated_data.pop('armory_code_write', serializers.empty)
        calibre_code = validated_data.pop('calibre_code_write', serializers.empty)
        instance = super().update(instance, validated_data)
        update_fields = []
        if armory_code is not serializers.empty:
            armory = self._resolve_armory(armory_code, instance.tenant) if armory_code else None
            if armory is None:
                raise serializers.ValidationError({
                    'armory_code_write': 'El arma debe pertenecer a una armoria.',
                })
            instance.armory = armory
            instance.organization_unit = armory.organization_unit
            update_fields += ['armory', 'organization_unit']
        if calibre_code is not serializers.empty:
            instance.calibre = self._resolve_calibre(calibre_code) if calibre_code else None
            update_fields.append('calibre')
        if update_fields:
            instance.save(update_fields=update_fields)
        return instance

class PoligonoTiroSerializer(serializers.ModelSerializer):
    class Meta:
        model = PoligonoTiro
        fields = ('id_poligono', 'tenant', 'organization_unit', 'nombre', 'ciudad', 'carriles_maximos', 'distancia_maxima')
        read_only_fields = ('tenant', 'organization_unit')
        
class LeccionTiroSerializer(serializers.ModelSerializer):
    # Lectura: lista plana de codes de unidades participantes (lo que la UI muestra).
    unidades_participantes_codes = serializers.SerializerMethodField()
    # Escritura: el frontend envia un array de codes (no IDs) para no acoplar al pk.
    unidades_participantes_codes_write = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text='Lista de codes de OrganizationUnit cuyos miembros pueden ser agregados como tiradores.',
    )

    class Meta:
        model = LeccionTiro
        fields = (
            'id_leccion', 'tenant', 'organization_unit', 'id_poligono',
            'fecha_tiro', 'numero_orden', 'fecha_orden', 'tipo_tiro',
            'cant_tiros_cereo', 'cant_tiros_leccion', 'distancia',
            'unidades_participantes_codes', 'unidades_participantes_codes_write',
        )
        read_only_fields = ('tenant', 'organization_unit')

    def get_unidades_participantes_codes(self, obj):
        return list(obj.unidades_participantes.values_list('code', flat=True))

    def validate(self, attrs):
        poligono = attrs.get('id_poligono') or getattr(self.instance, 'id_poligono', None)
        tenant = attrs.get('tenant') or getattr(self.instance, 'tenant', None)

        # Solo validamos que el polígono pertenezca al mismo tenant.
        # No restringimos por organization_unit: una lección puede realizarse en
        # un polígono de otra unidad (ej. Hospital Militar disparando en el campo
        # de la BOE, o cualquier unidad usando el polígono del Campo Militar).
        if poligono and tenant and poligono.tenant_id and poligono.tenant_id != tenant.id:
            raise serializers.ValidationError('El poligono no pertenece al tenant del recurso.')
        return attrs

    def _resolve_units(self, codes, tenant):
        """Convierte una lista de codes a OrganizationUnit del tenant. Tira si no existen."""
        from apps.organizations.models import OrganizationUnit
        if not codes:
            return []
        units = list(OrganizationUnit.objects.filter(
            tenant=tenant, code__in=codes, is_active=True
        ))
        found_codes = {u.code for u in units}
        missing = set(codes) - found_codes
        if missing:
            raise serializers.ValidationError({
                'unidades_participantes_codes_write': f'Unidades no encontradas: {sorted(missing)}',
            })
        return units

    def create(self, validated_data):
        codes = validated_data.pop('unidades_participantes_codes_write', None)
        instance = super().create(validated_data)
        # Default: si no vinieron unidades, usar la del Assignment principal del creador.
        # Si tampoco hay, usa la organization_unit del propio recurso (la que inyecto el mixin).
        if codes is None:
            default_unit = instance.organization_unit
            if default_unit is not None:
                instance.unidades_participantes.add(default_unit)
        else:
            units = self._resolve_units(codes, instance.tenant)
            instance.unidades_participantes.set(units)
        return instance

    def update(self, instance, validated_data):
        codes = validated_data.pop('unidades_participantes_codes_write', None)
        instance = super().update(instance, validated_data)
        if codes is not None:
            units = self._resolve_units(codes, instance.tenant)
            instance.unidades_participantes.set(units)
        return instance
         
class FraccionTiroSerializer(serializers.ModelSerializer):
    id_leccion = serializers.PrimaryKeyRelatedField(queryset=LeccionTiro.objects.all())
    
    class Meta:
        model = FraccionTiro
        fields = ('id_fraccion', 'tenant', 'organization_unit', 'id_leccion', 'tiradores_totales', 'numero_fraccion')
        read_only_fields = ('tenant', 'organization_unit')

    def validate(self, attrs):
        leccion = attrs.get('id_leccion') or getattr(self.instance, 'id_leccion', None)
        tenant = attrs.get('tenant') or getattr(self.instance, 'tenant', None)
        organization_unit = attrs.get('organization_unit') or getattr(self.instance, 'organization_unit', None)

        if leccion and tenant and leccion.tenant_id and leccion.tenant_id != tenant.id:
            raise serializers.ValidationError('La leccion no pertenece al tenant del recurso.')
        if leccion and organization_unit and leccion.organization_unit_id and leccion.organization_unit_id != organization_unit.id:
            raise serializers.ValidationError('La leccion no pertenece a la unidad organizacional del recurso.')
        return attrs
               
class ResultadoTiroSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultadoTiro
        fields = ('id_resultado', 'tenant', 'organization_unit', 'id_fraccion', 'id_usuario', 'id_arma', 'tiros_acertados', 'total_tiros', 'numero_carril')
        read_only_fields = ('tenant', 'organization_unit')
        validators = [
            UniqueTogetherValidator(
                queryset=ResultadoTiro.objects.all(),
                fields=['id_fraccion', 'id_usuario'],
                message='Este tirador ya esta asignado a esta fraccion.',
            ),
            UniqueTogetherValidator(
                queryset=ResultadoTiro.objects.all(),
                fields=['id_fraccion', 'id_arma'],
                message='Esta arma ya esta asignada a otro tirador en esta fraccion.',
            ),
        ]

    def validate(self, attrs):
        fraccion = attrs.get('id_fraccion') or getattr(self.instance, 'id_fraccion', None)
        arma = attrs.get('id_arma') or getattr(self.instance, 'id_arma', None)
        tenant = attrs.get('tenant') or getattr(self.instance, 'tenant', None)
        organization_unit = attrs.get('organization_unit') or getattr(self.instance, 'organization_unit', None)
        numero_carril = attrs.get('numero_carril') if 'numero_carril' in attrs else getattr(self.instance, 'numero_carril', None)

        if fraccion and tenant and fraccion.tenant_id and fraccion.tenant_id != tenant.id:
            raise serializers.ValidationError('La fraccion no pertenece al tenant del recurso.')
        if arma and tenant and arma.tenant_id and arma.tenant_id != tenant.id:
            raise serializers.ValidationError('El arma no pertenece al tenant del recurso.')
        if fraccion and organization_unit and fraccion.organization_unit_id and fraccion.organization_unit_id != organization_unit.id:
            raise serializers.ValidationError('La fraccion no pertenece a la unidad organizacional del recurso.')
        if arma and organization_unit and arma.organization_unit_id and arma.organization_unit_id != organization_unit.id:
            raise serializers.ValidationError('El arma no pertenece a la unidad organizacional del recurso.')

        # Carril unico por fraccion (solo si viene definido). El UniqueConstraint
        # lo enforza a nivel BD, pero validar aqui da un error mas legible.
        if fraccion and numero_carril is not None:
            qs = ResultadoTiro.objects.filter(id_fraccion=fraccion, numero_carril=numero_carril)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'numero_carril': f'El carril {numero_carril} ya esta ocupado en esta fraccion.',
                })

        return attrs
        
class EjercicioMilitarSerializer(serializers.ModelSerializer):
    unidades_participantes_codes = serializers.SerializerMethodField()
    unidades_participantes_codes_write = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text='Lista de codes de OrganizationUnit participantes.',
    )

    class Meta:
        model = EjercicioMilitar
        fields = (
            'id_ejercicio', 'tenant', 'organization_unit',
            'nombre', 'fecha', 'zona', 'tipo_ejercicio',
            'numero_orden', 'fecha_orden', 'observaciones',
            'unidades_participantes_codes', 'unidades_participantes_codes_write',
            'created_at',
        )
        read_only_fields = ('tenant', 'organization_unit', 'created_at', 'updated_at')

    def get_unidades_participantes_codes(self, obj):
        return list(obj.unidades_participantes.values_list('code', flat=True))

    def _resolve_units(self, codes, tenant):
        from apps.organizations.models import OrganizationUnit
        if not codes:
            return []
        units = list(OrganizationUnit.objects.filter(
            tenant=tenant, code__in=codes, is_active=True
        ))
        found = {u.code for u in units}
        missing = set(codes) - found
        if missing:
            raise serializers.ValidationError({
                'unidades_participantes_codes_write': f'Unidades no encontradas: {sorted(missing)}',
            })
        return units

    def create(self, validated_data):
        codes = validated_data.pop('unidades_participantes_codes_write', None)
        instance = super().create(validated_data)
        if codes is None:
            if instance.organization_unit is not None:
                instance.unidades_participantes.add(instance.organization_unit)
        else:
            units = self._resolve_units(codes, instance.tenant)
            instance.unidades_participantes.set(units)
        return instance

    def update(self, instance, validated_data):
        codes = validated_data.pop('unidades_participantes_codes_write', None)
        instance = super().update(instance, validated_data)
        if codes is not None:
            units = self._resolve_units(codes, instance.tenant)
            instance.unidades_participantes.set(units)
        return instance


class ConsumoMunicionSerializer(serializers.ModelSerializer):
    calibre_code = serializers.CharField(source='calibre.code', read_only=True)
    calibre_code_write = serializers.CharField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = ConsumoMunicion
        fields = (
            'id_consumo', 'ejercicio', 'tipo_arma', 'modelo_arma',
            'calibre_code', 'calibre_code_write',
            'cantidad_armas', 'cantidad_tiros', 'es_aproximado', 'observaciones',
        )

    def _resolve_calibre(self, code):
        if not code:
            return None
        try:
            return Calibre.objects.get(code=code, is_active=True)
        except Calibre.DoesNotExist:
            raise serializers.ValidationError({
                'calibre_code_write': f"Calibre '{code}' no encontrado.",
            })

    def create(self, validated_data):
        calibre_code = validated_data.pop('calibre_code_write', None)
        instance = super().create(validated_data)
        if calibre_code:
            instance.calibre = self._resolve_calibre(calibre_code)
            instance.save(update_fields=['calibre'])
        return instance

    def update(self, instance, validated_data):
        calibre_code = validated_data.pop('calibre_code_write', serializers.empty)
        instance = super().update(instance, validated_data)
        if calibre_code is not serializers.empty:
            instance.calibre = self._resolve_calibre(calibre_code) if calibre_code else None
            instance.save(update_fields=['calibre'])
        return instance


class ConsumoArmaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsumoArma
        fields = ('id_consumo_arma', 'consumo', 'arma', 'cantidad_tiros', 'observaciones')


class RUTAuthTokenSerializer(serializers.Serializer):
    rut = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        rut = attrs.get('rut')
        password = attrs.get('password')

        if rut and password:
            user = authenticate(request=self.context.get('request'), rut=rut, password=password)

            if not user:
                msg = f'Unable to log in with provided credentials.'
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = 'Must include "rut" and "password".'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs
    
class RecuperacionSerializer(serializers.Serializer):
    rut = serializers.CharField(max_length=12)
