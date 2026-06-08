# Guía de Inicio Rápido

Levantá el backend en local en menos de 10 minutos.

## Requisitos previos

- Python 3.12+
- PostgreSQL 14+ (o SQLite para desarrollo sin config adicional)
- Git

## 1. Clonar y crear entorno virtual

```powershell
git clone <repo-url>
cd ControlPoligono

python -m venv .venv
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

## 2. Variables de entorno

Copiar `.env.example` a `.env` y completar los valores mínimos para desarrollo:

```dotenv
SECRET_KEY=django-insecure-dev-key-cambiame-en-produccion
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# SQLite para dev rápido (sin PostgreSQL):
DATABASE_URL=sqlite:///db.sqlite3

# PostgreSQL (recomendado):
# DATABASE_URL=postgresql://usuario:password@localhost:5432/poligono_db

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:5173

DEFAULT_TEMP_PASSWORD=User1234
```

## 3. Migrar la base de datos

```powershell
.venv\Scripts\python.exe manage.py migrate
```

## 4. Inicializar el modelo de acceso

Estos comandos son **idempotentes** — se pueden correr múltiples veces sin efectos colaterales.

```powershell
# Crear tenant, roles, scopes y RolePermissions
.venv\Scripts\python.exe manage.py init_access_model --tenant-code ejercito-demo --tenant-name "Ejército Demo"

# Crear catálogo de 34 permisos atómicos
.venv\Scripts\python.exe manage.py init_permissions

# Crear árbol organizacional de ejemplo
.venv\Scripts\python.exe manage.py seed_org_tree --tenant-code ejercito-demo

# Crear cuenta MASTER (super_admin) — el primer administrador
.venv\Scripts\python.exe manage.py crear_master --rut 99999999-9 --password Dev1234 --tenant-code ejercito-demo

# Generar puestos (Positions) estándar para cada unidad
.venv\Scripts\python.exe manage.py seed_positions --tenant-code ejercito-demo
```

## 5. (Opcional) Poblar árbol organizacional de ejemplo

```powershell
.venv\Scripts\python.exe manage.py seed_org_tree
```

## 6. Levantar el servidor

```powershell
.venv\Scripts\python.exe manage.py runserver
```

La API estará disponible en `http://localhost:8000/api/`.

## 7. Verificar que todo funciona

```powershell
# Chequeo de configuración Django
.venv\Scripts\python.exe manage.py check

# Correr la suite de tests
.venv\Scripts\python.exe manage.py test
```

## 8. Primer login

```http
POST http://localhost:8000/api/auth/login/
Content-Type: application/json
X-Tenant-Code: ejercito-demo

{
  "rut": "99999999-9",
  "password": "Dev1234"
}
```

La respuesta seteará la cookie `sessionid`. Todos los requests posteriores deben incluir `X-Tenant-Code` y usar `withCredentials: true`. Los métodos no-seguros (POST/PUT/PATCH/DELETE) también deben incluir `X-CSRFToken` con el valor de la cookie `csrftoken`.

## Diagrama de flujo inicial

```
migrate
  └─ init_access_model  (roles, scopes, permisos)
       └─ seed_org_tree  (unidades organizacionales)
            └─ crear_master  (cuenta super_admin)
                 └─ seed_positions  (puestos por unidad)
                      └─ runserver  ✓
```

## Solución de problemas comunes

| Error | Causa probable | Solución |
|---|---|---|
| `403 Forbidden` en cualquier request | Falta `X-Tenant-Code` | Agregar header `X-Tenant-Code: ejercito-demo` |
| `No active account found` en login | Usuario sin Account activo en el tenant | Correr `crear_master` o crear usuario vía admin |
| `ImproperlyConfigured: DATABASE_URL` | Falta variable de entorno | Verificar que existe `.env` y tiene `DATABASE_URL` |
| `ModuleNotFoundError` | Dependencias no instaladas | `pip install -r requirements.txt` |
| Migraciones en conflicto | Migraciones sin aplicar | `python manage.py migrate --run-syncdb` |

## Diagnóstico de permisos

Si un usuario recibe 403 inesperado, verificar sus assignments:

```powershell
.venv\Scripts\python.exe manage.py dump_user_assignments 12345678-9
```
