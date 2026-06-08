from rest_framework.authentication import SessionAuthentication


class SessionCsrfAuthentication(SessionAuthentication):
    """
    Autenticación basada en sesión Django con validación CSRF.

    Extiende SessionAuthentication de DRF, que:
    - Lee request.user desde la sesión (via AuthenticationMiddleware)
    - Valida el token CSRF en métodos no-seguros (POST/PUT/PATCH/DELETE)
    - Devuelve None (anónimo) si no hay sesión activa, sin lanzar excepción

    El frontend debe:
    - Enviar las cookies con cada request (withCredentials: true / credentials: 'include')
    - Incluir el header X-CSRFToken con el valor de la cookie csrftoken en métodos no-seguros
    """
    pass
