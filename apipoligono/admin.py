
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (Usuario,
                     Calibre,
                     Arma,
                     PoligonoTiro,
                     LeccionTiro,
                     FraccionTiro,
                     ResultadoTiro,
                     EjercicioMilitar,
                     ConsumoMunicion,
                     ConsumoArma)



class UsuarioAdmin(UserAdmin):
    model = Usuario
    list_display = ['nombre', 'rut', 'grado', 'apellido_paterno']
    search_fields = ['rut', 'nombre', 'apellido_paterno', 'apellido_materno']
    list_filter = ['is_active', 'is_staff']

    fieldsets = (
        (None, {'fields': ('rut', 'password')}),
        ('Información Personal', {'fields': ('grado', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Fechas Importantes', {'fields': ('last_login', 'date_joined')}),
    )

# Personalizo la vista de PoligonoTiro en el panel de administración  
# Puedo hacerlo a cualquier modelo que haya creado
class PoligonoTiroAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'ciudad', 'carriles_maximos', 'distancia_maxima']
    search_fields = ['ciudad']


class CalibreAdmin(admin.ModelAdmin):
    list_display = ['code', 'nombre', 'is_active']


class EjercicioMilitarAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'fecha', 'zona', 'organization_unit', 'tenant']


class ConsumoMunicionAdmin(admin.ModelAdmin):
    list_display = ['ejercicio', 'tipo_arma', 'calibre', 'cantidad_tiros']


class ConsumoArmaAdmin(admin.ModelAdmin):
    list_display = ['consumo', 'arma', 'cantidad_tiros']


# Registrar el modelo Usuario con el UserAdmin personalizado
admin.site.register(Usuario, UsuarioAdmin)
admin.site.register(Calibre, CalibreAdmin)
admin.site.register(Arma)
admin.site.register(PoligonoTiro, PoligonoTiroAdmin)
admin.site.register(LeccionTiro)
admin.site.register(FraccionTiro)
admin.site.register(ResultadoTiro)
admin.site.register(EjercicioMilitar, EjercicioMilitarAdmin)
admin.site.register(ConsumoMunicion, ConsumoMunicionAdmin)
admin.site.register(ConsumoArma, ConsumoArmaAdmin)


# Registrar el modelo Group
#admin.site.register(Group)