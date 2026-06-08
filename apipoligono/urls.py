from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (UsuarioViewSet,
                    ArmaViewSet,
                    PoligonoTiroViewSet,
                    LeccionTiroViewSet,
                    FraccionTiroViewSet,
                    ResultadoTiroViewSet,
                    CalibreViewSet,
                    EjercicioMilitarViewSet,
                    ConsumoMunicionViewSet,
                    ConsumoArmaViewSet,
                    SessionLoginView,
                    LogoutView,
                    AuthContextView,
                    SelectActiveUnitView,
                    AuditLogView,
                    RoleViewSet,
                    ScopePolicyViewSet,
                    UserPermissionOverrideViewSet,
                    ProtectedView,
                    UserPreferencesView,
                    AuthzCatalogView,
                    RoleCategoriesView,
                    PersonasPorUnidadView,
                    EligibleTargetUnitsView,
                    iniciar_recuperacion,
                    crea_codigo,
                    comprobar_codigo,
                    cambiar_contrasena
                    )
from apps.authorization.views import PermissionViewSet, PositionPermissionViewSet, RolePermissionViewSet
from apps.identity.views import PositionViewSet, UnitMembershipViewSet
from apps.organizations.views import AssignableUnitsView, OrganizationUnitViewSet, RecintoViewSet
from apps.armory.views import ArmoryViewSet


# Crear un router para los ViewSets
router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'armas', ArmaViewSet)
router.register(r'poligonos', PoligonoTiroViewSet)
router.register(r'lecciones', LeccionTiroViewSet)
router.register(r'fracciones', FraccionTiroViewSet)
router.register(r'resultados', ResultadoTiroViewSet)
router.register(r'authz/roles', RoleViewSet)
router.register(r'authz/scopes', ScopePolicyViewSet)
router.register(r'authz/overrides', UserPermissionOverrideViewSet, basename='permission-override')
router.register(r'organization-units', OrganizationUnitViewSet, basename='organization-unit')
router.register(r'recintos', RecintoViewSet, basename='recinto')
router.register(r'armorias', ArmoryViewSet, basename='armory')
router.register(r'posiciones', PositionViewSet, basename='position')
router.register(r'memberships', UnitMembershipViewSet, basename='unit-membership')
router.register(r'calibres', CalibreViewSet, basename='calibre')
router.register(r'ejercicios', EjercicioMilitarViewSet, basename='ejercicio')
router.register(r'consumos-municion', ConsumoMunicionViewSet, basename='consumo-municion')
router.register(r'consumos-arma', ConsumoArmaViewSet, basename='consumo-arma')
router.register(r'authz/permissions', PermissionViewSet, basename='permission')
router.register(r'authz/role-permissions', RolePermissionViewSet, basename='role-permission')
router.register(r'authz/position-permissions', PositionPermissionViewSet, basename='position-permission')


# URLs de la aplicación apipoligono
urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', SessionLoginView.as_view(), name='session_login'),
    path('auth/context/', AuthContextView.as_view(), name='auth_context'),
    path('auth/select-unit/', SelectActiveUnitView.as_view(), name='auth_select_unit'),
    path('auth/audit-log/', AuditLogView.as_view(), name='auth_audit_log'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('protected/', ProtectedView.as_view(), name='protected'),
    
    # URLs para recuperación de contraseña
    #Primera solicitud solo con el rut
    path('recuperar/', iniciar_recuperacion, name='iniciar_recuperacion'),
    # Segunda solicitud con el rut y el correo
    path('recuperar/crear/', crea_codigo, name='crea_codigo'),
    # Segunda solicitud con el rut y el correo
    path('recuperar/comprobar/', comprobar_codigo, name='comprobar_codigo'),
    # Tercera solicitud con el digito verificador y la nueva contraseña
    path('recuperar/cambiar/', cambiar_contrasena, name='cambiar_contrasena'),

    # Preferencias de usuario
    path('me/preferences/appearance/', UserPreferencesView.as_view(), name='user_preferences'),

    # Unidades a las que el usuario actual puede asignar a otros (su rama)
    path('me/assignable-units/', AssignableUnitsView.as_view(), name='assignable_units'),

    # Catalogo completo de roles, scopes, rules, recursos y acciones (para UI)
    path('authz/catalog/', AuthzCatalogView.as_view(), name='authz_catalog'),

    # Vista operativa de permisos por persona (Permissions dashboard)
    path('authz/role-categories/', RoleCategoriesView.as_view(), name='authz_role_categories'),
    path('authz/personas-por-unidad/', PersonasPorUnidadView.as_view(), name='authz_personas_por_unidad'),
    path('authz/eligible-target-units/', EligibleTargetUnitsView.as_view(), name='authz_eligible_target_units'),
]
