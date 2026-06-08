"""Tests de seguridad para el flujo de recuperación de contraseña (C1, C2, M3)."""

from datetime import timedelta

from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils.timezone import now
from rest_framework.test import APIClient

from apipoligono.models import CodigoRecuperacion, Usuario


@override_settings(
    REST_FRAMEWORK={
        'DEFAULT_THROTTLE_CLASSES': [],
        'DEFAULT_THROTTLE_RATES': {},
        'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'apps.identity.authentication.SessionCsrfAuthentication',
        ],
    }
)
class CambiarContrasenaSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = Usuario.objects.create_user(
            username='11111111-1', password='Vieja1234', rut='11111111-1',
            nombre='Ana', apellido_paterno='Test', apellido_materno='',
            correo='ana@example.com',
        )

    def _set_codigo(self, codigo, minutos_atras=0):
        obj = CodigoRecuperacion.objects.create(usuario=self.user, codigo=codigo)
        if minutos_atras:
            CodigoRecuperacion.objects.filter(pk=obj.pk).update(
                creado_en=now() - timedelta(minutes=minutos_atras),
            )
        return obj

    def test_cambio_rechaza_codigo_incorrecto(self):
        # C1: con un código distinto al emitido, no debe cambiar la contraseña.
        self._set_codigo('123456')
        resp = self.client.post(reverse('cambiar_contrasena'), {
            'rut': '11111111-1', 'codigo': '000000', 'nueva_contrasena': 'NuevaSegura99',
        }, format='json')
        self.assertEqual(resp.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Vieja1234'))

    def test_cambio_rechaza_codigo_expirado(self):
        # C1: código correcto pero emitido hace más de 5 minutos.
        self._set_codigo('123456', minutos_atras=6)
        resp = self.client.post(reverse('cambiar_contrasena'), {
            'rut': '11111111-1', 'codigo': '123456', 'nueva_contrasena': 'NuevaSegura99',
        }, format='json')
        self.assertEqual(resp.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Vieja1234'))

    def test_cambio_exitoso_borra_codigo(self):
        # C1: código válido cambia la contraseña y se consume (un solo uso).
        self._set_codigo('123456')
        resp = self.client.post(reverse('cambiar_contrasena'), {
            'rut': '11111111-1', 'codigo': '123456', 'nueva_contrasena': 'NuevaSegura99',
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NuevaSegura99'))
        self.assertFalse(CodigoRecuperacion.objects.filter(usuario=self.user).exists())

    def test_cambio_rechaza_contrasena_debil(self):
        # M3: validate_password rechaza contraseñas inseguras.
        self._set_codigo('123456')
        resp = self.client.post(reverse('cambiar_contrasena'), {
            'rut': '11111111-1', 'codigo': '123456', 'nueva_contrasena': '123',
        }, format='json')
        self.assertEqual(resp.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Vieja1234'))

    def test_iniciar_recuperacion_rut_inexistente_responde_generico(self):
        # C2: no se revela si el RUT existe.
        resp = self.client.post(reverse('iniciar_recuperacion'), {
            'rut': '99999999-9',
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('detail', resp.json())
        self.assertNotIn('correo_censurado', resp.json())
