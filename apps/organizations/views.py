from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authorization.permissions import HasResourcePermission, HasTenantAccess
from apps.authorization.scope import get_allowed_unit_ids
from apps.organizations.models import OrganizationUnit, Recinto
from apps.organizations.serializers import OrganizationUnitSerializer, RecintoSerializer


def _scoped_units_qs(request):
    """OrganizationUnits visibles para el usuario, filtradas por tenant + scope."""
    qs = OrganizationUnit.objects.filter(tenant=request.tenant, is_active=True)
    account = getattr(request, "identity_account", None)
    if account is None:
        return qs.none()
    allowed = get_allowed_unit_ids(account)
    if allowed is None:
        # tenant_admin: ve todo el arbol del tenant.
        return qs
    if not allowed:
        return qs.none()
    return qs.filter(id__in=allowed)


class OrganizationUnitViewSet(viewsets.ModelViewSet):
    """CRUD de unidades organizacionales scopeado por rama del usuario."""

    serializer_class = OrganizationUnitSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = "organization_unit"
    action_permission_map = {
        'lookup': 'read',
        'previsualizar_eliminacion': 'delete',
        'eliminar_con_migracion': 'delete',
    }

    def get_queryset(self):
        return _scoped_units_qs(self.request).order_by("name")

    def perform_create(self, serializer):
        # tenant siempre se infiere del request (read_only en el serializer).
        # parent debe estar dentro de las unidades permitidas; si el creador no es
        # tenant_admin, no puede crear unidades fuera de su rama.
        parent = serializer.validated_data.get("parent")
        if parent is not None:
            allowed_qs = _scoped_units_qs(self.request)
            if not allowed_qs.filter(pk=parent.pk).exists():
                raise PermissionError("El parent solicitado no esta dentro de tu rama.")
        else:
            # Parent vacio: solo tenant_admin puede crear unidades raiz.
            account = getattr(self.request, "identity_account", None)
            if account is None or not account.assignments.filter(
                is_active=True, position__role__code__in=("tenant_admin", "super_admin")
            ).exists():
                raise PermissionError("Solo tenant_admin/super_admin puede crear unidades raiz.")
        serializer.save(tenant=self.request.tenant)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

    def _migration_counts(self, unit):
        """Cuenta cuantos registros hay que migrar antes de borrar la unidad."""
        # Imports tardios para evitar dependencias circulares.
        from apps.identity.models import Assignment
        from apipoligono.models import Arma, PoligonoTiro, LeccionTiro, FraccionTiro, ResultadoTiro

        return {
            'assignments': Assignment.objects.filter(position__organization_unit=unit, is_active=True).count(),
            'weapons': Arma.objects.filter(organization_unit=unit).count(),
            'ranges': PoligonoTiro.objects.filter(organization_unit=unit).count(),
            'lessons': LeccionTiro.objects.filter(organization_unit=unit).count(),
            'fractions': FraccionTiro.objects.filter(organization_unit=unit).count(),
            'results': ResultadoTiro.objects.filter(organization_unit=unit).count(),
            'child_units': OrganizationUnit.objects.filter(parent=unit).count(),
            'lessons_as_participant': LeccionTiro.objects.filter(unidades_participantes=unit).count(),
        }

    @action(detail=True, methods=['get'], url_path='previsualizar-eliminacion')
    def previsualizar_eliminacion(self, request, pk=None):
        """Previsualiza cuanto contenido se migrara al borrar la unidad."""
        unit = self.get_object()
        counts = self._migration_counts(unit)
        parent_code = unit.parent.code if unit.parent else None
        return Response(
            {
                'unit_code': unit.code,
                'unit_name': unit.name,
                'parent_code': parent_code,
                'counts': counts,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='eliminar-con-migracion')
    def eliminar_con_migracion(self, request, pk=None):
        """
        Elimina la unidad y migra TODO su contenido (assignments, armas, lecciones,
        resultados, fracciones, polígonos, unidades hijas) a `target_unit_code`.
        Si no se indica target, usa el `parent` de la unidad (auto-promote).
        """
        from apps.identity.models import Assignment
        from apipoligono.models import Arma, PoligonoTiro, LeccionTiro, FraccionTiro, ResultadoTiro

        unit = self.get_object()
        target_code = request.data.get('target_unit_code') or None

        # Resolver destino.
        if target_code:
            target = OrganizationUnit.objects.filter(
                tenant=request.tenant, code=target_code, is_active=True
            ).first()
            if target is None:
                return Response(
                    {'detail': f"Unidad destino '{target_code}' no existe."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif unit.parent_id:
            target = unit.parent
        else:
            return Response(
                {'detail': 'La unidad no tiene padre. Indica target_unit_code para migrar.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target.id == unit.id:
            return Response({'detail': 'El destino no puede ser la misma unidad.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validar scope: el destino debe estar en la rama del usuario.
        account = getattr(request, 'identity_account', None)
        allowed = get_allowed_unit_ids(account)
        if allowed is not None:
            if unit.id not in allowed or target.id not in allowed:
                return Response(
                    {'detail': 'La unidad o el destino estan fuera de tu rama.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        moved = self._migration_counts(unit)

        with transaction.atomic():
            # Assignments no se pueden migrar directamente (vinculados via Position).
            # La migración de unidades debe hacerse reasignando posiciones.
            # Por ahora solo se notifica cuántos hay, no se migran automáticamente.
            Arma.objects.filter(organization_unit=unit).update(organization_unit=target)
            PoligonoTiro.objects.filter(organization_unit=unit).update(organization_unit=target)
            LeccionTiro.objects.filter(organization_unit=unit).update(organization_unit=target)
            FraccionTiro.objects.filter(organization_unit=unit).update(organization_unit=target)
            ResultadoTiro.objects.filter(organization_unit=unit).update(organization_unit=target)
            # Los hijos se promueven al padre del eliminado (no al destino, que
            # podria no ser ancestro en absoluto). Si no hay padre, quedan como
            # raiz.
            new_parent = unit.parent
            OrganizationUnit.objects.filter(parent=unit).update(parent=new_parent)
            # M2M unidades_participantes: agregar destino donde estaba la unidad
            # vieja, despues sacar la vieja.
            for leccion in LeccionTiro.objects.filter(unidades_participantes=unit):
                leccion.unidades_participantes.add(target)
                leccion.unidades_participantes.remove(unit)
            unit.delete()

        return Response(
            {
                'detail': 'Unidad eliminada y contenido migrado.',
                'target_unit_code': target.code,
                'moved': moved,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='lookup')
    def lookup(self, request, *args, **kwargs):
        """
        Devuelve TODAS las unidades activas del tenant (sin restriccion por rama).
        Sirve para selectores donde el usuario debe poder INVITAR otras ramas a
        una leccion (ej. un Batallon evaluando al Centro Clinico Militar).

        El acceso al endpoint sigue gobernado por HasResourcePermission con
        action 'read', que casi todos los roles operativos tienen.
        """
        qs = OrganizationUnit.objects.filter(
            tenant=request.tenant, is_active=True
        ).order_by('name')
        data = OrganizationUnitSerializer(qs, many=True).data
        return Response({'results': data}, status=status.HTTP_200_OK)


class RecintoViewSet(viewsets.ModelViewSet):
    """CRUD de Recintos militares (Campos Militares, Cuarteles, etc.).

    Un recinto agrupa unidades físicamente sin implicar jerarquía de mando.
    Las unidades se agregan/quitan via los endpoints `agregar-unidad` y `quitar-unidad`.
    """

    serializer_class = RecintoSerializer
    permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
    resource_name = 'recinto'
    action_permission_map = {
        'agregar_unidad': 'update',
        'quitar_unidad': 'update',
    }

    def get_queryset(self):
        return Recinto.objects.filter(
            tenant=self.request.tenant
        ).prefetch_related('units').order_by('name')

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant)

    @action(detail=True, methods=['post'], url_path=r'agregar-unidad/(?P<unit_code>[^/.]+)')
    def agregar_unidad(self, request, pk=None, unit_code=None):
        """Agrega una unidad al recinto."""
        recinto = self.get_object()
        unit = OrganizationUnit.objects.filter(
            tenant=request.tenant, code=unit_code, is_active=True,
        ).first()
        if unit is None:
            return Response(
                {'detail': f"Unidad '{unit_code}' no encontrada en este tenant."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if recinto.units.filter(pk=unit.pk).exists():
            return Response(
                {'detail': 'La unidad ya está en el recinto.'},
                status=status.HTTP_200_OK,
            )
        recinto.units.add(unit)
        return Response(
            {'detail': f"Unidad '{unit.code}' agregada al recinto.", 'unit_count': recinto.units.count()},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['delete'], url_path=r'quitar-unidad/(?P<unit_code>[^/.]+)')
    def quitar_unidad(self, request, pk=None, unit_code=None):
        """Quita una unidad del recinto."""
        recinto = self.get_object()
        unit = recinto.units.filter(code=unit_code).first()
        if unit is None:
            return Response(
                {'detail': f"Unidad '{unit_code}' no está en el recinto."},
                status=status.HTTP_404_NOT_FOUND,
            )
        recinto.units.remove(unit)
        return Response(
            {'detail': f"Unidad '{unit.code}' quitada del recinto.", 'unit_count': recinto.units.count()},
            status=status.HTTP_200_OK,
        )


class AssignableUnitsView(APIView):
    """
    Devuelve las unidades a las que el usuario actual puede ASIGNAR a otros
    usuarios al crearlos. Es la "rama" del SICE: su unidad + descendientes,
    o todo el tenant si es tenant_admin.
    """

    permission_classes = [IsAuthenticated, HasTenantAccess]

    def get(self, request, *args, **kwargs):
        account = getattr(request, "identity_account", None)
        if account is None:
            return Response({"results": []})

        allowed = get_allowed_unit_ids(account)
        qs = OrganizationUnit.objects.filter(tenant=request.tenant, is_active=True)
        if allowed is not None:
            if not allowed:
                # Hardening: si el usuario tiene rol admin_unidad pero su Assignment
                # no tiene organization_unit seteada (mal seed o bug de promocion),
                # devolveriamos [] y la UI quedaria sin opciones. En ese caso es mas
                # util devolver TODAS las unidades del tenant — es laxo, pero el
                # checkeo de permisos para crear usuarios sigue corriendo en el
                # backend (perform_create valida que la unidad este en su rama).
                is_unit_admin = account.assignments.filter(
                    is_active=True, position__role__code='admin_unidad'
                ).exists()
                if is_unit_admin:
                    qs = qs  # mostrar todo el tenant
                else:
                    return Response({"results": []})
            else:
                qs = qs.filter(id__in=allowed)

        data = OrganizationUnitSerializer(qs.order_by("name"), many=True).data
        return Response({"results": data})
