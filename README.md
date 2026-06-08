# PoligonoTiro — Backend

Backend Django REST para gestión de polígonos de tiro de Fuerzas Armadas.
Multi-tenant, RBAC con puestos (Position) y permisos individuales, autenticación
JWT en cookies HttpOnly.

## Docs

Ver [`docs/00_INDEX.md`](docs/00_INDEX.md) para la documentación completa.

Setup rápido: [`docs/01_QUICKSTART.md`](docs/01_QUICKSTART.md).

## Stack

- Python 3.12+
- Django 5.1.3
- DRF 3.15.2
- djangorestframework-simplejwt 5.3.1
- PostgreSQL (prod) / SQLite (dev)

## Estructura

```text
Backend/
├── ControlPoligono/
│   ├── apipoligono/             # App principal (dominio de tiro)
│   ├── apps/
│   │   ├── tenants/             # Tenant (institución)
│   │   ├── organizations/       # OrganizationUnit (árbol)
│   │   ├── armory/              # Armory (almacén)
│   │   ├── identity/            # Person, Account, Position, Assignment
│   │   └── authorization/       # Role, ScopePolicy, PermissionRule, Override
│   ├── control_poligono/        # settings.py, urls.py, wsgi.py
│   ├── manage.py
│   └── .env.example
├── docs/                        # Documentación
└── requirements.txt
```
