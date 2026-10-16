# PoligonoTiro — Backend

Backend Django REST para gestión de polígonos de tiro de Fuerzas Armadas.
Multi-tenant, RBAC con puestos (Position) y permisos atómicos, autenticación
por sesiones Django + CSRF (cookies HttpOnly).

## Docs

Ver [`docs/00_INDEX.md`](docs/00_INDEX.md) para la documentación completa.

Setup rápido: [`docs/01_QUICKSTART.md`](docs/01_QUICKSTART.md).

## Stack

- Python 3.14+
- Django 5.2.15
- DRF 3.15.2
- PostgreSQL (prod) / SQLite (dev local)

## Estructura

```text
Backend/
├── ControlPoligono/
│   ├── apipoligono/             # App principal (dominio de tiro)
│   ├── apps/
│   │   ├── tenants/             # Tenant (institución)
│   │   ├── organizations/       # OrganizationUnit (árbol)
│   │   ├── armory/              # Armory (almacén)
│   │   ├── identity/            # Person, Account, Position, Assignment, UnitMembership
│   │   └── authorization/       # Role, ScopePolicy, RolePermission, PositionPermission, Override
│   ├── control_poligono/        # settings.py, urls.py, wsgi.py
│   ├── manage.py
│   └── .env.example
├── docs/                        # Documentación
└── requirements.txt
```
