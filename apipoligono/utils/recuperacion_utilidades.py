import random
from rest_framework.decorators import permission_classes, throttle_classes
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.http import JsonResponse
from ..models import Usuario, CodigoRecuperacion
from datetime import timedelta
from django.utils.timezone import now
from rest_framework.decorators import api_view
from ..serializers import RecuperacionSerializer
from rest_framework.permissions import AllowAny
from apps.identity.throttles import AuthEndpointThrottle

# Mensaje generico: no revela si el RUT existe o no (anti-enumeracion).
MENSAJE_GENERICO = 'Si el RUT está registrado, recibirás instrucciones.'


#Genera código de longitud 6
def generar_codigo_verificador():
    return str(random.randint(100000, 999999))

# Censura el correo perteneciente al rut consultado
def censurar_codigo(correo):
    nombre, dominio = correo.split('@')
    return f"{nombre[0]}{'*' * (len(nombre) - 1)}@{'*' * (len(dominio) - 2)}{dominio[-1]}"

# Obtiene el usuario por el rut o None si no existe (sin revelar existencia)
def obtener_usuario_por_rut(rut):
    return Usuario.objects.filter(rut=rut).first()

# Envía un correo con el código de verificación
def enviar_codigo_verificador(correo, codigo):
    send_mail(
        'Código de verificación',
        f'Su código de verificación es: {codigo}',
        'carlos_volkerdev@gmail.com',
        [correo],
        fail_silently=False
    )

# Devuelve el correo censurado del rut. Responde siempre 200 con mensaje
# generico, sin revelar si el RUT existe (anti-enumeracion).
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def iniciar_recuperacion(request):
    serializer = RecuperacionSerializer(data=request.data)
    if not serializer.is_valid():
        return JsonResponse({'detail': MENSAJE_GENERICO})
    rut = serializer.validated_data['rut']
    usuario = obtener_usuario_por_rut(rut)
    if usuario is None:
        return JsonResponse({'detail': MENSAJE_GENERICO})
    correo_censurado = censurar_codigo(usuario.correo)
    return JsonResponse({'detail': MENSAJE_GENERICO, 'correo_censurado': correo_censurado})


# Crea el codigo de verificacion y lo envia al correo del usuario.
# Responde siempre 200 con mensaje generico (anti-enumeracion).
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def crea_codigo(request):
    rut = request.data.get('rut')
    correo = request.data.get('correo')
    usuario = obtener_usuario_por_rut(rut)

    # Solo si el RUT existe y el correo coincide se genera y envia el codigo.
    if usuario is not None and usuario.correo == correo:
        CodigoRecuperacion.objects.filter(usuario=usuario).delete()
        codigo = generar_codigo_verificador()
        CodigoRecuperacion.objects.create(usuario=usuario, codigo=codigo)
        enviar_codigo_verificador(usuario.correo, codigo)

    return JsonResponse({'detail': MENSAJE_GENERICO})


# Verifica si el codigo es correcto o ha expirado.
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def comprobar_codigo(request):
    rut = request.data.get('rut')
    codigo = request.data.get('codigo')
    usuario = obtener_usuario_por_rut(rut)

    codigo_obj = None
    if usuario is not None:
        codigo_obj = CodigoRecuperacion.objects.filter(
            usuario=usuario,
            codigo=codigo,
            creado_en__gte=now() - timedelta(minutes=5),
        ).first()

    if not codigo_obj:
        return JsonResponse({'mensaje': 'Código incorrecto o expirado'}, status=400)

    return JsonResponse({'mensaje': 'Código correcto'})


# Cambia la contraseña del usuario tras validar el codigo de recuperacion.
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthEndpointThrottle])
def cambiar_contrasena(request):
    rut = request.data.get('rut')
    codigo = request.data.get('codigo')
    nueva_contrasena = request.data.get('nueva_contrasena')

    usuario = obtener_usuario_por_rut(rut)

    # Mensaje de error identico para codigo invalido/inexistente/expirado y RUT
    # inexistente, para no revelar cual de las condiciones fallo.
    codigo_obj = None
    if usuario is not None:
        codigo_obj = CodigoRecuperacion.objects.filter(
            usuario=usuario,
            codigo=codigo,
            creado_en__gte=now() - timedelta(minutes=5),
        ).first()

    if not codigo_obj:
        return JsonResponse({'mensaje': 'Código incorrecto o expirado'}, status=400)

    # Valida fortaleza de la nueva contrasena con los validadores de Django.
    try:
        validate_password(nueva_contrasena, user=usuario)
    except ValidationError as exc:
        return JsonResponse({'mensaje': 'Contraseña insegura', 'errores': exc.messages}, status=400)

    usuario.password = make_password(nueva_contrasena)
    usuario.save()
    # Un solo uso: borra todos los codigos del usuario tras cambiar la contrasena.
    CodigoRecuperacion.objects.filter(usuario=usuario).delete()

    return JsonResponse({'mensaje': 'Contraseña actualizada correctamente.'})
