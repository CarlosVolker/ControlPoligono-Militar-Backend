# Tests

## Correr los tests

```powershell
# Todos los tests
.venv\Scripts\python.exe manage.py test

# Una suite específica
.venv\Scripts\python.exe manage.py test apipoligono.tests.test_permissions
.venv\Scripts\python.exe manage.py test apipoligono.tests.test_positions

# Verboso
.venv\Scripts\python.exe manage.py test --verbosity=2

# Parar al primer error
.venv\Scripts\python.exe manage.py test --failfast
```

## Estructura de la suite

```
apipoligono/tests/
  ├── __init__.py
  ├── _factories.py        ← helpers para crear datos de test
  ├── test_permissions.py  ← tests del sistema de permisos
  ├── test_positions.py    ← tests de Position y Assignment
  └── test_<area>.py       ← un archivo por área de funcionalidad
```

## Factories y helpers

No se usa `factory_boy`. Los helpers para crear datos están en `apipoligono/tests/_factories.py`.

Ejemplo de uso típico en un test:

```python
from apipoligono.tests._factories import (
    create_tenant,
    create_org_unit,
    create_user_with_assignment,
)

class MiTestCase(TestCase):
    def setUp(self):
        self.tenant = create_tenant(code="test-tenant")
        self.unit = create_org_unit(tenant=self.tenant, code="CO-A")
        self.user, self.account = create_user_with_assignment(
            tenant=self.tenant,
            unit=self.unit,
            role_code="oficial_tiro",
            scope_code="unidad_y_descendientes",
        )
```

## Estructura base de un test de API

```python
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apipoligono.tests._factories import create_tenant, create_user_with_assignment

class LeccionAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant = create_tenant(code="test-tenant")
        self.user, self.account = create_user_with_assignment(
            tenant=self.tenant,
            role_code="oficial_tiro",
        )
        # Autenticar usando la cookie (o forzar autenticación en el cliente)
        self.client.force_authenticate(user=self.user)
        self.client.credentials(HTTP_X_TENANT_CODE="test-tenant")

    def test_crear_leccion(self):
        url = reverse("lecciones-list")
        data = {
            "id_poligono": self.poligono.id,
            "fecha_tiro": "2026-06-15",
            "tipo_tiro": "evaluacion",
            "cant_tiros_leccion": 20,
            "distancia": 100,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, 201)

    def test_crear_leccion_sin_permiso(self):
        # Tirador no puede crear lecciones
        tirador, _ = create_user_with_assignment(
            tenant=self.tenant,
            role_code="tirador",
        )
        self.client.force_authenticate(user=tirador)
        response = self.client.post(reverse("lecciones-list"), {}, format="json")
        self.assertEqual(response.status_code, 403)
```

## Qué testear en cada área

### Permisos
- Happy path: usuario con permiso correcto → 200/201
- Sin permiso: 403
- Sin autenticación: 401
- Sin X-Tenant-Code: 403
- MASTER bypasea todo
- Override DENY bloquea aunque tenga PermissionRule

### Modelos
- Constraints únicos (duplicados → 400)
- FKs y cascade
- Properties calculadas (`effective_role`, `effective_scope`, `effective_unit`)

### Filtrado por scope
- `unidad_y_descendientes`: ve su unidad y subárbol
- `unidad_propia`: solo su unidad directa
- `solo_propio`: solo sus propios registros
- Admin global: ve todo el tenant

### Flujos de negocio
- Crear usuario → assignment tirador creado automáticamente
- Crear usuario con RUT de temporal → promoción
- Registrar resultados → constraints evitan duplicados

## Convenciones de tests

- Un archivo por área: `test_permissions.py`, `test_shooting.py`, `test_usuarios.py`
- Reusar `_factories.py` — no crear objetos de BD a mano si ya hay un helper
- Cubrir: happy path + error principal + edge case relevante
- No mockear la BD — los tests corren contra SQLite en memoria
- `setUp` crea el contexto mínimo; cada test crea lo específico que necesita
- Evitar `print()` — usar `self.fail(msg)` con contexto si el test falla por razón inesperada

## Agregar tests a una feature nueva

Cuando agregás un endpoint nuevo:

1. Crear `apipoligono/tests/test_<area>.py`
2. Agregar helpers en `_factories.py` si hacen falta
3. Testear al menos:
   - Listar con scope correcto
   - Crear con permiso + sin permiso
   - Editar y eliminar
   - Validaciones de campos obligatorios
4. Correr toda la suite antes de commitear: `python manage.py test`
