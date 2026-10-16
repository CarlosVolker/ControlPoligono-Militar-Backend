# Instrucciones para agentes

Este proyecto sigue las reglas globales definidas en `~/.config/opencode/AGENTS.md` salvo que se indique lo contrario.

## Regla dura — El Design System es la LEY VISUAL del proyecto

> **No negociable.** Esta regla prevalece sobre cualquier otra consideración de UI/UX, ergonomía, performance o criterio técnico del agente. Su incumplimiento invalida la entrega, sin excepción.

El **Inume Design System** es la **LEY VISUAL** del proyecto. Cubre componentes, colores, tipografía, espaciado, radios, estados, motion y composición.

**Fuente elegida: biblioteca externa.** La fuente de componentes, plantillas y tokens es la biblioteca **Inume Design System** ubicada fuera de este repositorio, en el directorio hermano `../../Inume Design System/`. Es un kit HTML/CSS/JS de referencia: el cliente lo consulta como **referencia visual, tokens y plantillas a reproducir** en la plataforma destino. No es un paquete ni una dependencia importable. Esta vinculación es **documental**: no instala el kit, no lo importa y no altera el producto. La carpeta interna de nombre homónimo que existe en el repositorio no es la fuente de este proyecto.

1. **Identidad visual obligatoria.** Todo artefacto de UX/UI — frontend actual o cualquier superficie futura (web, mobile, escritorio, email, impresión) — debe ser **VISUALMENTE IDÉNTICO** a los componentes del Design System. "Idénticamente visual" significa que los valores del CSS/HTML del DS son el spec literal: cada `padding`, `border`, `color`, `height`, `shadow`, estado `hover` y anatomía se traduce **1:1** a la plataforma destino (valor CSS → valor de la plataforma destino, sin reinterpretación).
2. **Lo que no es idéntico, está mal hecho.** Cualquier entrega de UI que no replique con fidelidad el componente del DS está **MAL HECHA** y **NO será aceptada por el operador**, sin importar el resto de sus méritos.
3. **Prohibido interpretar o simplificar.** Interpretar, simplificar, "inspirarse" o reimplementar a partir de resúmenes, capturas o memoria está **PROHIBIDO**. La única adaptación permitida es la que la plataforma destino no puede expresar; toda adaptación debe **reportarse y justificarse explícitamente** en el entregable, jamás sustituirse en silencio.
4. **Verificación contra el DS.** Toda entrega de UI se valida comparando contra las páginas del Design System:
   - [`../../Inume Design System/index.html`](../../Inume%20Design%20System/index.html) — dashboard.
   - [`../../Inume Design System/ui-*.html`](../../Inume%20Design%20System/ui-buttons.html), [`forms-*.html`](../../Inume%20Design%20System/forms-basic.html), [`auth-*.html`](../../Inume%20Design%20System/auth-signin.html) — componentes por categoría (los enlaces muestran una página representativa de cada familia; el resto se consulta por nombre dentro de la biblioteca).
   - [`../../Inume Design System/DESIGN.md`](../../Inume%20Design%20System/DESIGN.md) — contrato y tokens del DS.
   - [`../../Inume Design System/PRODUCT.md`](../../Inume%20Design%20System/PRODUCT.md) — definición de producto del propio sistema visual.
   - [`../../Inume Design System/assets/css/`](../../Inume%20Design%20System/assets/css/) — fuente de valores (variables CSS, reglas, estados).

   > ⚠️ Estos enlaces son relativos al layout actual del disco (biblioteca como directorio hermano de este repo). Un checkout aislado del repositorio no resuelve los enlaces: hay que tener la biblioteca disponible en esa ubicación.

Esta regla es **transversal al proyecto**. El frontend la implementa como contrato de implementación; cualquier otra superficie de UI, presente o futura, hereda la misma obligatoriedad.

## Reglas locales del backend

Backend Django REST para gestión de polígonos de tiro de Fuerzas Armadas.
Multi-tenant, RBAC con puestos (Position) y permisos atómicos, autenticación
por sesiones Django con cookies HttpOnly.

### Stack

- Django 5.2.15 + DRF 3.15.2
- Sesiones Django + CSRF (cookies HttpOnly)
- PostgreSQL (prod) / SQLite (dev local)
- Python 3.14+
- Windows (dev) / Linux (prod, Gunicorn + Nginx)

### Estructura del repo

```text
ControlPoligono/                 ← repo root
├── manage.py
├── requirements.txt
├── .env / .env.example
├── docs/                        ← documentación viva — ver docs/00_INDEX.md
├── front/                       ← cliente Vue 3 + Vue Router + Pinia + TypeScript + CSS vanilla: frontend integral implementado en código (superficies de todos los dominios del producto; verificado 2026-10-15; aceptación integral NOT_VERIFIED) — ver front/AGENTS.md
├── control_poligono/            ← Django config (settings.py, urls.py, wsgi.py, asgi.py)
├── apipoligono/                 ← app principal (dominio de tiro)
│   ├── models.py                ← Usuario, Arma, PoligonoTiro, LeccionTiro, FraccionTiro, ResultadoTiro
│   ├── views.py                 ← ViewSets DRF + vistas de auth
│   ├── serializers.py
│   ├── urls.py                  ← router con TODOS los endpoints
│   ├── mixins.py                ← TenantScopedQuerysetMixin
│   └── tests/                   ← paquete de tests
└── apps/
    ├── tenants/                 ← Tenant + TenantContextMiddleware
    ├── organizations/           ← OrganizationUnit (árbol jerárquico)
    ├── armory/                  ← Armory (almacén)
    ├── identity/                ← Person, Account, Position, Assignment, UnitMembership
    │   └── authentication.py    ← SessionCsrfAuthentication
    └── authorization/           ← Role, ScopePolicy, Permission, RolePermission,
        │                          PositionPermission, UserPermissionOverride
        ├── permissions.py       ← HasTenantAccess, HasResourcePermission
        └── scope.py             ← get_allowed_unit_ids, get_primary_unit, eligible_target_units
```

### Comandos clave (Windows / PowerShell)

```powershell
# Setup inicial (orden obligatorio)
.venv\Scripts\python.exe manage.py migrate
.venv\Scripts\python.exe manage.py init_access_model --tenant-code ejercito-demo --tenant-name "Ejército Demo"
.venv\Scripts\python.exe manage.py init_permissions
.venv\Scripts\python.exe manage.py seed_org_tree --tenant-code ejercito-demo
.venv\Scripts\python.exe manage.py crear_master --rut 99999999-9 --password Dev1234 --tenant-code ejercito-demo
.venv\Scripts\python.exe manage.py seed_positions --tenant-code ejercito-demo

# Dev
.venv\Scripts\python.exe manage.py runserver
.venv\Scripts\python.exe manage.py check
.venv\Scripts\python.exe manage.py test
.venv\Scripts\python.exe manage.py test apipoligono.tests.test_permissions

# Diagnóstico
.venv\Scripts\python.exe manage.py dump_user_assignments <RUT>
```

### Arquitectura — qué SÍ y qué NO

#### SÍ (lo que el código hace hoy)

- **Capas**: `urls.py` → `views.py` (DRF ViewSets) → `serializers.py` → `models.py`. **Sin** capa de Service ni Repository — no inventes una.
- **Auth**: Sesiones Django + CSRF. `SessionCsrfAuthentication` lee la sesión desde cookie `sessionid` HttpOnly. El frontend envía `X-CSRFToken` en POST/PUT/PATCH/DELETE. NO hay JWT.
- **Multi-tenant obligatorio**: cada request lleva header `X-Tenant-Code`. Sin él, `HasTenantAccess` devuelve 403.
- **Scope automático**: `TenantScopedQuerysetMixin` filtra por tenant + `get_allowed_unit_ids(account)`. Usarlo siempre.
- **Permisos por Permission atómico**: `HasResourcePermission` mapea `(resource, action)` → `permission_code` y evalúa contra `RolePermission` / `PositionPermission`.
- **UnitMembership**: la pertenencia orgánica a una unidad es distinta del puesto funcional. Todo usuario tiene una `UnitMembership` primaria.

#### NO (no agregues, no asumas que existe)

- Service / Repository / Use-case pattern.
- UUID como PK (se usa `AutoField` clásico).
- API versioning (`/api/v1/` no existe).
- `pytest` (se usa `manage.py test` con `unittest`).
- `factory_boy` (los tests usan helpers en `apipoligono/tests/_factories.py`).
- Modo civil (eliminado; solo militar).
- `PermissionRule` (eliminado en FASE 5 — reemplazado por `RolePermission`).
- Campos legacy en `Assignment` (`role`, `scope_policy`, `organization_unit` — eliminados en FASE 5).
- Campo `rol` en `Usuario` (`admin/limitado/tirador` — eliminado en FASE 6).

### Modelo de permisos — resumen

Detalle completo en [`docs/04_PERMISOS.md`](docs/04_PERMISOS.md). Consultarlo antes de tocar permission classes.

1. **Position** = puesto estable (combina Role + ScopePolicy + OrganizationUnit + opcional Armory).
2. **Assignment** = persona ocupando una Position. `position` es NOT NULL. Histórico via `is_active=False`.
3. **UnitMembership** = pertenencia orgánica a una unidad (separada del puesto funcional).
4. **Role + RolePermission** = qué `permission_codes` puede ejecutar cada rol.
5. **PositionPermission** = permisos extra para un puesto específico (sobre los del rol).
6. **ScopePolicy** = alcance de datos: `solo_propio`, `unidad_propia`, `unidad_y_descendientes`, `solo_agregado`.
7. **UserPermissionOverride** = override individual ALLOW/DENY por account.
8. **MASTER** (`super_admin`) = bypass total. Reservado para el desarrollador.

#### Helpers a reusar (NO duplicar lógica)

| Helper | Ubicación | Para qué |
|---|---|---|
| `get_allowed_unit_ids(account)` | `apps/authorization/scope.py` | Set de unidades visibles. `None` = admin global. |
| `get_primary_unit(account)` | mismo | Unidad principal del account según UnitMembership. |
| `get_effective_permission_codes(account)` | `apps/authorization/permissions.py` | Set de permission_codes activos del usuario. |
| `TIPO_ARMA_CHOICES` | `apipoligono/models.py` | Choices canónicas para `Arma.tipo_arma` y `ConsumoMunicion.tipo_arma`. Reusar, no duplicar. |
| `Calibre` | `apipoligono/models.py` | Catálogo global de calibres. FK desde `Arma` y `ConsumoMunicion`. Códigos canónicos: `5.56X45`, `7.62X51`, `9X19`, `8.6X70`, `12.7X99`, `84MM`. |
| `_descendant_ids(root_ids)` | `scope.py` | Walk recursivo del árbol. |
| `eligible_target_units(unit, max_levels=2)` | mismo | Unidades elegibles para asignar roles. |
| `Assignment.effective_role/scope/unit` | `apps/identity/models.py` | Accede a los valores via Position. |
| `TenantScopedQuerysetMixin` | `apipoligono/mixins.py` | Filtra queryset por tenant + scope. Heredarlo siempre. |
| `_find_or_create_position(tenant, unit, role, scope)` | `apipoligono/views.py` | Encuentra o crea Position ad-hoc. |
| `_ensure_tirador_assignment(account, unit)` | `apipoligono/views.py` | Garantiza el assignment tirador implícito. |
| `_ensure_unit_membership(account, unit, tenant)` | `apipoligono/views.py` | Garantiza la membresía orgánica. |

### Gotchas

- **`request.tenant` puede ser None** si falta `X-Tenant-Code`. Las permission classes lo chequean primero.
- **Todo Assignment requiere `position`**: `Assignment.position` es NOT NULL. Usar `_find_or_create_position()` o `assign_position()` de factories. Nunca crear Assignments directamente sin position.
- **Un solo `is_primary=True` por account**: el primario determina el scope y la unidad activa.
- **Tirador implícito**: cada usuario creado recibe automáticamente un Assignment con rol `tirador`. Persiste aunque se quite el rol funcional.
- **`UnitMembership` siempre al asignar unidad**: `_ensure_unit_membership()` es idempotente — llamarlo siempre que se crea/actualiza una unidad principal del usuario.
- **`Arma.organization_unit`** es campo legacy — la fuente de verdad es `Arma.armory.organization_unit`.
- **`Position.recinto` solo actúa con `scope=todo_recinto`**: si el scope es otro (`unidad_y_descendientes`, etc.), el campo recinto es ignorado completamente en el cálculo de scope.

### Convenciones de código

- **Naming**: `snake_case` módulos/funciones/variables, `PascalCase` clases, `UPPER_SNAKE_CASE` constantes.
- **Apps singular**: `armory`, `identity`, `authorization`, `tenants`, `organizations`.
- **URLs plural y español**: `/api/usuarios/`, `/api/posiciones/`, `/api/armorias/`, `/api/lecciones/`.
- **Comentarios mínimos**: solo cuando el "por qué" no es obvio.
- **Tests**: en `apipoligono/tests/`. Reusar `_factories.py` para data setup. Cada feature trae tests.
- **Migraciones**: `makemigrations` → revisar → hacer commit. Data migrations con `RunPython` explícito.

### Si vas a hacer X, mira Y primero

| Hacer | Mirar primero |
|---|---|
| Endpoint nuevo | `docs/06_API_REFERENCE.md`, `apipoligono/urls.py`, viewsets vecinos |
| Tocar permisos | `docs/04_PERMISOS.md`, `apps/authorization/permissions.py`, `scope.py` |
| Agregar permission_code nuevo | `apps/authorization/models.py` (PERMISSION_CATALOG), `apps/authorization/permissions.py` (RESOURCE_ACTION_TO_PERMISSION) |
| Crear migración data | `apps/authorization/migrations/0008_populate_permission_catalog.py` como template |
| Filtrar queryset por tenant | usar `TenantScopedQuerysetMixin`, NO reinventar |
| Auditoría / debug 403 | `python manage.py dump_user_assignments <RUT>` |
| Agregar modelo | seguir el patrón de `apps/armory/models.py` |
| Cambiar settings | `docs/08_DEPLOYMENT.md` |

### Workflow estándar cuando agregas algo

1. Modificar `models.py` → `makemigrations` → revisar la migración generada.
2. `serializers.py` para exponerlo en la API.
3. `views.py` con viewset + `resource_name` + mapear acciones en `RESOURCE_ACTION_TO_PERMISSION`.
4. `urls.py` con `router.register(...)`.
5. Agregar `RolePermission` al seed en `init_access_model.py` (DEFAULT_PERMISSIONS).
6. Tests en `apipoligono/tests/test_<area>.py`.
7. Actualizar `docs/06_API_REFERENCE.md`.
8. `manage.py check` + `manage.py test` antes de hacer commit.

### Reuso obligatorio

Antes de escribir código nuevo, buscar:

- Helpers en `apps/authorization/scope.py` y `apps/authorization/permissions.py`.
- Mixins en `apipoligono/mixins.py`.
- Patrones de viewset en `apps/armory/views.py` y `apps/identity/views.py`.
- Factories en `apipoligono/tests/_factories.py` para tests.

### Documentación completa

Ver `docs/` para documentación detallada:

- [`docs/02_ARQUITECTURA.md`](docs/02_ARQUITECTURA.md) — estructura y flujo de requests
- [`docs/03_AUTH_SESIONES.md`](docs/03_AUTH_SESIONES.md) — autenticación: sesiones Django, CSRF, login/logout
- [`docs/04_PERMISOS.md`](docs/04_PERMISOS.md) — modelo de permisos completo
- [`docs/06_API_REFERENCE.md`](docs/06_API_REFERENCE.md) — todos los endpoints
- [`docs/07_MANAGEMENT_COMMANDS.md`](docs/07_MANAGEMENT_COMMANDS.md) — comandos manage.py
- [`docs/08_DEPLOYMENT.md`](docs/08_DEPLOYMENT.md) — producción y variables de entorno
- [`docs/11_SEGURIDAD.md`](docs/11_SEGURIDAD.md) — modelo de seguridad
- [`docs/12_GUIA_FRONTEND.md`](docs/12_GUIA_FRONTEND.md) — guía para el desarrollador frontend

## Cliente — stack y ruta actuales

El cliente vive en **`front/`** (carpeta activa y única). Su **destino vigente es el frontend integral del producto final**, construido sobre todas las funcionalidades reales que el backend expone, sin omitir ninguna. El operador amplió este alcance el **2026-10-01**: el límite anterior «únicamente dashboard de lectura» queda derogado, y con él la exclusión de administración, alta/edición de datos y flujos de captura.

> **Estado actual ≠ alcance.** A 2026-10-15 el cliente implementa en código las superficies reales de todos los dominios del producto; el «sólo dashboard de lectura» es hecho histórico, superado. La **aceptación integral sigue `NOT_VERIFIED`**: lo construido no equivale a producto acreditado, y el estado no es una cota del producto.

Stack aprobado: **Vue 3** (Composition API con `<script setup lang="ts">`, **TypeScript**), **Vue Router** (obligatorio, por orden del operador), **Pinia** para estado en memoria, **CSS vanilla** — sin frameworks de estilos, preprocesadores ni librerías de componentes. **TypeScript por orden explícita del operador del 2026-10-02**: la regla previa «JavaScript, no TypeScript» queda **derogada (superseded)** y el registro canónico de la decisión es D-08 en [`docs/specs/final-frontend/requirements.md`](docs/specs/final-frontend/requirements.md) §12. El código actual del cliente está en **TypeScript** (`front/src/`: 38 componentes `.vue` con `lang="ts"`, 34 módulos `.ts`, 0 archivos `.js`; verificado 2026-10-15); el «baseline JavaScript» es hecho histórico, superado. El kit externo del Inume Design System sigue siendo HTML/CSS/JS como fuente de referencia: hecho, no objetivo de conversión. Datos **sólo del backend real**, sin fixtures, mocks ni datos de ejemplo, y **sin registros sintéticos que simulen funcionalidad**; placeholder `—` cuando el dato no exista. La ausencia de una API o un defecto del backend **se reporta**, no se oculta. La fidelidad 1:1 al Inume Design System se mantiene íntegra. Instrucciones completas en [`front/AGENTS.md`](front/AGENTS.md).

> 📖 **Personalizador de apariencia (requisito, con contrato implementado).** El operador ordenó ofrecer una opción de personalización y **persistirla por usuario**: los **8 ejes** del DS — `theme` (dark/light) más los siete ejes del theme customizer (`accent`, `bg`, `font`, `radius`, `iconfam`, `ambient`, `ambcolor`) — con **todas** sus opciones reales, **reset** a los defaults del DS, catálogos tomados **1:1** de la biblioteca externa, y persistencia **contra la API del backend, nunca en `localStorage`**. El hueco de los 8 ejes quedó cerrado (verificado 2026-10-15): el backend expone ocho campos `ds_*` con `choices` y CheckConstraints (`apipoligono/models.py:152-159`), la migración `apipoligono/migrations/0021_design_system_preferences.py` y rutas propias (`apipoligono/urls.py:85-86`: `me/preferences/appearance/` y `me/preferences/appearance/design-system/`), consumidas por el cliente (`front/src/views/appearance/PersonalizerView.vue`, `front/src/stores/appearance.ts`, `front/src/api/appearance.ts`). La persistencia por usuario está acreditada en runtime por las evidencias del plan de cierre (`docs/specs/final-frontend/evidence/2026-10-13/appearance-eight-axes-results.json`, `docs/specs/final-frontend/evidence/2026-10-14/appearance-persistence-readonly.json`); la **paridad de render en estados completos sigue `NOT_VERIFIED`** ([`docs/specs/final-frontend/completion-plan-2026-10-14.md`](docs/specs/final-frontend/completion-plan-2026-10-14.md), T8/T9).

> 🕯️ **Excepción acotada a la prohibición de tocar el backend.** Sólo para el diseño e implementación de la persistencia por usuario de la apariencia, y **únicamente tras spec aprobada y gate superado**: (1) modelo o campos de preferencias para los 8 ejes por usuario, (2) endpoint propio del usuario autenticado de preferencias, y (3) la migración que eso necesite, revisada y con tests. **No** se extiende a autenticación, RBAC, permisos, multi-tenant, infraestructura ni despliegue, ni a ampliar otras funcionalidades. El backend ya reportado en marcha en `127.0.0.1:8000` (estado **no verificado** en esta sincronización) se **reusa**: no se levanta otro, ni se reinicia o detiene. El contrato detallado está en [`front/AGENTS.md`](front/AGENTS.md).

> Ampliar el alcance del cliente **no** autoriza por sí mismo a ejecutar `pnpm dev`, navegador, herramientas de verificación, base de datos ni tests: siguen requiriendo orden explícita del operador.

> No existe un cliente alternativo en el proyecto. Cualquier carpeta de cliente previa que aparezca en disco no está aprobada, no debe usarse y su eliminación corresponde al operador.

## Mapa documental

- [`front/AGENTS.md`](front/AGENTS.md): reglas del cliente (stack aprobado incluido Vue Router obligatorio, alcance vigente del producto final integral y estado actual del cliente a 2026-10-15, personalizador de apariencia de 8 ejes persistido por usuario, fuente visual del DS).
- [`docs/00_INDEX.md`](docs/00_INDEX.md): entrada a la documentación viva y a los documentos numerados existentes.
- `docs/specs/`: especificaciones activas; las cerradas se conservan en `docs/specs/archive/`.
- `docs/decisions/`: registros de decisiones de arquitectura (ADR).
- `docs/bugs/`: investigación y seguimiento documental de defectos.
- `docs/research/`: investigación técnica vinculada al proyecto.
- Biblioteca visual externa (fuera del repo): [`../../Inume Design System/`](../../Inume%20Design%20System/index.html) — fuente de componentes, plantillas y tokens; su contrato de tokens vive en [`../../Inume Design System/DESIGN.md`](../../Inume%20Design%20System/DESIGN.md) y su digest local en [`DESIGN.md`](DESIGN.md).

## Idioma

La documentación del proyecto se escribe en español neutro. El repositorio es privado y no está orientado a publicación como proyecto de código abierto.

El ciclo global de desarrollo guiado por especificaciones (SDD) se consulta bajo demanda en `~/.config/opencode/docs/sdd.md`. Esta referencia no sustituye las reglas locales ni autoriza por sí sola cambios de implementación.
