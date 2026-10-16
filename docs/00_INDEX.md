# PoligonoTiro Backend — Documentación

Backend Django REST para gestión de polígonos de tiro de Fuerzas Armadas. Multi-tenant, RBAC con puestos (Position) y permisos atómicos, autenticación por sesiones Django + CSRF.

## Orden de lectura recomendado

| # | Archivo | Para qué sirve |
|---|---|---|
| 01 | [QUICKSTART](01_QUICKSTART.md) | Levantar el backend en local en 10 minutos |
| 02 | [ARQUITECTURA](02_ARQUITECTURA.md) | Apps, capas, stack y flujo de un request |
| 03 | [AUTH SESIONES](03_AUTH_SESIONES.md) | Login, cookies de sesión, CSRF, logout |
| 04 | [PERMISOS](04_PERMISOS.md) | Position, Role, Permission, Scope, Override |
| 05 | [DOMINIO](05_DOMINIO.md) | Modelos de negocio: unidades, tiro, resultados |
| 06 | [API REFERENCE](06_API_REFERENCE.md) | Lista completa de endpoints con permisos y bodies |
| 07 | [MANAGEMENT COMMANDS](07_MANAGEMENT_COMMANDS.md) | Comandos `manage.py` disponibles |
| 08 | [DEPLOYMENT](08_DEPLOYMENT.md) | Variables de entorno, Gunicorn, Nginx, PostgreSQL |
| 09 | [TESTING](09_TESTING.md) | Cómo correr y agregar tests |
| 10 | [GLOSARIO](10_GLOSARIO.md) | Términos técnicos y militares |
| 11 | [SEGURIDAD](11_SEGURIDAD.md) | Modelo de seguridad, checklist producción |
| 12 | [GUÍA FRONTEND](12_GUIA_FRONTEND.md) | Todo lo que necesita un dev frontend |
| 13 | [MIGRACIÓN AUTHZ](13_MIGRACION_AUTHZ.md) | Historial de la migración del sistema de permisos (6 fases completadas) |

## Cliente — stack y ruta actuales

El cliente vive en [`../front/`](../front/) (carpeta activa y única). Su **destino vigente es el frontend integral del producto final**: todas las funcionalidades reales que el backend expone, sin omitir ninguna. Alcance ampliado por el operador el **2026-10-01**; el límite anterior «únicamente dashboard de lectura», con su exclusión de administración, alta/edición de datos y flujos de captura, queda derogado.

> **Estado actual ≠ alcance:** a 2026-10-15 el cliente implementa en código las superficies reales de todos los dominios del producto; el «sólo dashboard de lectura» es hecho histórico, superado. La **aceptación integral sigue `NOT_VERIFIED`**: lo construido no equivale a producto acreditado, y el estado no es la cota del producto.

Stack aprobado: **Vue 3** (Composition API con `<script setup lang="ts">`, **TypeScript** por orden explícita del operador del 2026-10-02 — la regla previa «JavaScript» queda derogada; decisión canónica D-08 en [`specs/final-frontend/requirements.md`](specs/final-frontend/requirements.md) §12) + **Vue Router** (obligatorio, por orden del operador) + **Pinia** (estado en memoria) + **CSS vanilla**. El código actual del cliente está en TypeScript (`front/src/`: 38 componentes `.vue` con `lang="ts"`, 34 módulos `.ts`, 0 `.js`; verificado 2026-10-15); el «baseline JavaScript» es hecho histórico, superado; el kit externo del DS sigue siendo HTML/CSS/JS como referencia. Datos sólo del backend real; nada de fixtures, mocks, demos ni cifras inventadas, y **sin registros sintéticos que simulen funcionalidad**; placeholder `—` cuando el dato no exista. Si falta una API o el backend expone un defecto, **se reporta**. Reglas del cliente: [`../front/AGENTS.md`](../front/AGENTS.md).

> 📖 **Personalizador de apariencia (requisito, con contrato implementado).** El operador ordenó ofrecer una opción de personalización y **persistirla por usuario**: los **8 ejes** del DS — `theme` (dark/light) más los siete del theme customizer (`accent`, `bg`, `font`, `radius`, `iconfam`, `ambient`, `ambcolor`) — con todas sus opciones reales, **reset**, catálogos **1:1** desde la biblioteca externa, y persistencia **contra la API del backend, nunca en `localStorage`**. El hueco de los 8 ejes quedó cerrado (verificado 2026-10-15): ocho campos `ds_*` en `apipoligono/models.py:152-159`, migración `0021_design_system_preferences` y rutas propias (`apipoligono/urls.py:85-86`), consumidas por el cliente; persistencia por usuario acreditada en runtime por las evidencias del plan de cierre, con paridad de render aún `NOT_VERIFIED` (T8/T9).

> 🕯️ **Excepción acotada a la prohibición de tocar el backend.** Sólo para el diseño e implementación de esa persistencia por usuario, y **únicamente tras spec aprobada y gate superado**: modelo o campos de preferencias para los 8 ejes, endpoint propio del usuario autenticado, y la migración necesaria con revisión y tests. **No** alcanza autenticación, RBAC, permisos, multi-tenant, infraestructura, despliegue ni ampliar otras funcionalidades. El backend ya reportado en marcha en `127.0.0.1:8000` (estado **no verificado** aquí) se **reusa**: no se levanta otro, ni se reinicia o detiene.

> La ampliación de alcance **no** autoriza por sí misma `pnpm dev`, navegador, herramientas de verificación, base de datos ni tests: siguen requiriendo orden explícita del operador.

> 📜 **Especificación del frontend integral.** La documentación que define el frontend del producto final —36 pantallas sobre las 162 operaciones del backend, con sus contratos, requisitos por dominio, design system y navegación— vive en [`specs/final-frontend/index.md`](specs/final-frontend/index.md) (spec `spec-final-frontend-001`, estado `approved` desde el 2026-10-02; la aprobación no supera gates: `verified_at: null` y ningún gate en `passed`; ejecución vigente por [`specs/final-frontend/completion-plan-2026-10-14.md`](specs/final-frontend/completion-plan-2026-10-14.md), aprobado el 2026-10-14 e `in-progress`).

> No hay cliente alternativo aprobado en el proyecto. Cualquier carpeta de cliente previa que aparezca en disco no se usa y su eliminación corresponde al operador.

## Fuente visual externa — Inume Design System

El **Inume Design System** es la LEY VISUAL del proyecto y vive **fuera de este repositorio**, como carpeta hermana del proyecto, en [`../../../Inume%20Design%20System/`](../../../Inume%20Design%20System/). Es material de referencia en HTML/CSS/JS: **no** es un paquete ni una dependencia y no se importa ni se enlaza desde el código. Sus valores se consultan y se reproducen 1:1 en la plataforma destino al implementar.

| Documento / página | Para qué sirve |
|---|---|
| [`index.html`](../../../Inume%20Design%20System/index.html) | Catálogo índice de componentes y plantillas del kit |
| [`DESIGN.md`](../../../Inume%20Design%20System/DESIGN.md) | SSOT de tokens, anatomía y estados |
| [`PRODUCT.md`](../../../Inume%20Design%20System/PRODUCT.md) | Contrato de producto del design system |
| [`ui-buttons.html`](../../../Inume%20Design%20System/ui-buttons.html) · [`ui-card.html`](../../../Inume%20Design%20System/ui-card.html) | Ejemplos de componentes base |
| [`forms-basic.html`](../../../Inume%20Design%20System/forms-basic.html) · [`tables-basic.html`](../../../Inume%20Design%20System/tables-basic.html) · [`charts.html`](../../../Inume%20Design%20System/charts.html) | Ejemplos de plantillas |

> ⚠️ Existe una carpeta interna homónima dentro del repositorio que **no** es la fuente aprobada. No usarla para tokens, componentes ni decisiones visuales. Los destinos válidos son los `../../../Inume%20Design%20System/` listados arriba.

## Convenciones del sistema

- **Multi-tenancy obligatoria**: cada request debe llevar `X-Tenant-Code`. Sin tenant resuelto → 403.
- **Sesiones Django**: el frontend usa `withCredentials: true` y envía `X-CSRFToken` en métodos no-seguros.
- **Permisos atómicos**: el endpoint `/api/auth/context/` devuelve `permissions` como array de `permission_codes`. Usar estos para controlar la UI.
- **Modo único: militar**. No existe modo civil.
- **Sin JWT**: el sistema usa sesiones Django, no tokens JWT.
- **Idempotencia en seed**: `init_access_model`, `init_permissions`, `seed_positions`, `crear_master` pueden correrse N veces sin efectos colaterales.

## Mantenimiento de la documentación

| Cambio | Actualizar |
|---|---|
| Endpoint nuevo | [06_API_REFERENCE](06_API_REFERENCE.md) |
| Cambio en permisos | [04_PERMISOS](04_PERMISOS.md) |
| Cambio en modelos | [05_DOMINIO](05_DOMINIO.md) |
| Variable de entorno nueva | [08_DEPLOYMENT](08_DEPLOYMENT.md) |
| Comando nuevo | [07_MANAGEMENT_COMMANDS](07_MANAGEMENT_COMMANDS.md) |
| Término nuevo | [10_GLOSARIO](10_GLOSARIO.md) |
| Permission_code nuevo | [04_PERMISOS](04_PERMISOS.md) + `PERMISSION_CATALOG` en `authorization/models.py` + `RESOURCE_ACTION_TO_PERMISSION` en `authorization/permissions.py` |
| UI nueva o token visual nuevo | Catálogo externo del DS: [`index.html`](../../../Inume%20Design%20System/index.html) y [`DESIGN.md`](../../../Inume%20Design%20System/DESIGN.md) (consultar, nunca editar el kit) |
