---
spec_meta: "../../spec-meta.yaml"
---

# Matriz actor→permiso (C-4) — 165 filas OP (2026-10-15)

> 📜 Yo conservo aquí la **matriz actor→permiso** derivada para el contrato **C-4** del mapa
> focalizado [`t1-gap-map-2026-10-15.md`](./t1-gap-map-2026-10-15.md): la **expectativa por actor**,
> derivada **estáticamente** desde el permiso atómico (`(resource, action) → permission_code`), la
> semilla de rol (`DEFAULT_PERMISSIONS`), el scope de unidades y el contrato de cada vista. Es el
> insumo que la matriz de aceptación declaraba faltar (`expected_source`: *«sin matriz actor→permiso
> documentada; contrato por (resource,action) no traduce a alias»*). Autor del informe:
> `Dwarven-Spelunkers`, **2026-10-15** (`DELIVERED`), persistido **sin añadir, quitar ni reinterpretar
> afirmaciones**.

> 🕯️ **Regla dura.** La columna **Observado** de §3 es **referencia de contraste**, jamás fuente de
> la expectativa: la expectativa sale sólo del permiso, el rol, el scope y el contrato (§3 lo declara).
> Ninguna celda se clasifica desde un `NOT_EXERCISED` aislado.

> 📖 **Este documento no cambia ninguna celda.** Publicar la matriz actor→permiso **no** altera la
> matriz de aceptación: `expected_by_actor` sigue **`NOT_VERIFIED`** en las 1320 celdas hasta que un
> **consumidor** registre la traducción. Es la salida documental de `C-4`, hermana del mapa
> [`t1-gap-map-2026-10-15.md`](./t1-gap-map-2026-10-15.md), cuyo §3 lista el contrato C-4.

Bajé a la caverna de permisos y volví con el mapa completo: 165 túneles, dos sin salida (los pares ausentes del mapa). Todo abajo.

## 1. Método de traducción (la pieza que faltaba)

| Paso | Regla | Fuente |
|---|---|---|
| 1 | método HTTP → `action`: `GET→read`, `POST→create`, `PUT/PATCH→update`, `DELETE→delete` | `apps/authorization/permissions.py:26-32` |
| 2 | `action` real de la vista: `view.action` sobreescrito por `action_permission_map` si existe | `permissions.py:98-104` + `action_permission_map` de cada viewset |
| 3 | `(resource, action) → permission_code` | `permissions.py:36-95` (`RESOURCE_ACTION_TO_PERMISSION`) |
| 4 | si **no hay par en el mapa** → `HasResourcePermission` devuelve `False` | `permissions.py:279-281` |
| 5 | veredicto: bypass `super_admin` → override DENY → override ALLOW → `PositionPermission` → `RolePermission` → DENY | `permissions.py:11-12`, `:266-289` |
| 6 | codes efectivos = `RolePermission(rol efectivo)` ∪ `PositionPermission(puesto)`; `super_admin` = todo el `Permission` activo | `permissions.py:207-235`, `:111-117` |

Mapa alias→rol: `.cache/frontend-acceptance/2026-10-13/runtime-family-sweep.cjs:4-13` (A1→`super_admin` … A8→`tirador`); el mismo emparejamiento está declarado en `acceptance-matrix.json → actors`.

**Reservas que la matriz no traduce a alias (quedan declaradas, no inventadas):** `Range` y `UserPermissionOverride` sí tienen vista; las filas `OP-OVR-*`, `OP-RPR-*`, `OP-PPR-*`, `OP-AZC-*`, `OP-PRM-*`, `OP-ROL-*`, `OP-SCP-*`, `OP-AUT-00{3,4,6}`, `OP-UNT-010`, `OP-PRF-0{01…05}` y `OP-RCV-*` **no pasan por `HasResourcePermission`**: su contrato no es un `permission_code` sino una *permission class*. Se traducen a *gate*:

| Gate | Significado | Vistas |
|---|---|---|
| `gate:OPEN` | `AllowAny` | `SessionLoginView` (`views.py:1384`), `recuperacion_utilidades.py:46,63,82,105` |
| `gate:AUTH` | `IsAuthenticated` | `LogoutView:1407`, `UserPreferencesView:1904`, `DesignSystemAppearanceView:1946` |
| `gate:TENANT` | `IsAuthenticated + HasTenantAccess` | `ProtectedView:1376`, `AuthContextView:1415`, `SelectActiveUnitView:1480`, `RoleCategoriesView:1575`, `PersonasPorUnidadView:1604`, `EligibleTargetUnitsView:1689`, `AuthzCatalogView:1862`, `RoleViewSet:1767-1778` (list/retrieve), `ScopePolicyViewSet:1785`, `PermissionViewSet` (`apps/authorization/views.py:31`), `AssignableUnitsView` (`apps/organizations/views.py:264`) |
| `gate:AUDIT` | `TENANT` + `role ∈ {tenant_admin, super_admin, auditor}` | `AuditLogView:1744-1747` |
| `gate:TA` | `IsTenantAdmin` = rol `tenant_admin`/`super_admin` activo | `RoleViewSet` mutaciones, `UserPermissionOverrideViewSet:1797`, `RolePermissionViewSet:46`, `PositionPermissionViewSet:83` |

## 2. Perfil esperado por actor

Semilla: `init_access_model.py:103-231` (`DEFAULT_PERMISSIONS` + `_EXERCISES_PERMISSIONS`). Los codes efectivos de un actor son los de **su rol primario + la secundaria `tirador`** (confirmado por el propio comando de desarrollo: `_validate_assignments` exige exactamente `{rol, tirador}` con primario = rol, `provision_development_accounts.py:551-580`).

| Alias | Rol | Scope del puesto | Unidad / alcance | Codes efectivos | Contexto observado que lo corrobora |
|---|---|---|---|---|---|
| **A1** | `super_admin` | `None` (sin scope) | `get_allowed_unit_ids` → `None` = tenant completo (`GLOBAL_ROLE_CODES`, `scope.py:37`, `:100-103`) | **bypass**: todos los `Permission` activos (`permissions.py:214-215`) | `exec-plan-summary.md:396,547` — primario sin scope, secundario `tirador` |
| **A2** | `tenant_admin` | `None` | global (`None`) | `'*','*'` → todos los codes | `:426` — primario sin scope |
| **A3** | `admin_unidad` | `unidad_y_descendientes` (`ROLE_MATRIX`, `provision_development_accounts.py:47-55`) | unidad + descendientes (`TREE_SCOPE_CODES`, `scope.py:23-26`, `:162-163`) | `view_unit, create_unit, update_unit, delete_unit, view_personnel_basic, create_users, update_users, disable_users, view_warehouse, create/update_warehouse_records, assign_positions, revoke_positions, view_recinto, manage_recinto, view/create/update_exercises, view_self` (19) | `:458` |
| **A4** | `comandante_unidad` | `unidad_y_descendientes` | ídem | `view_unit, view_warehouse, view_personnel_basic, view_recinto, view_exercises, view_self` (6) | `:490` |
| **A5** | `oficial_tiro` | `unidad_y_descendientes` | ídem | `view_unit, view_warehouse, view_personnel_basic, view_personnel_full, create_users, create/update_warehouse_records, create/update/delete_shooting_lessons, score_shooters, view/create/update_exercises, view_self` (15) | `:547` |
| **A6** | `oficial_observador` | `unidad_y_descendientes` | ídem | `view_unit, view_self, view_personnel_basic, view_exercises` (**4**) | `:571` — «el contexto reportó **4** permisos efectivos»: **coincide exactamente** |
| **A7** | `encargado_almacen` | `unidad_propia` + `Position.armory` (`ROLE_MATRIX:53`, `identity/models.py:78-86`) | sólo su unidad; sin descendientes | los 7 del rol + tirador = `view_warehouse, create/update/delete_warehouse_records, view/create/update_exercises, view_unit, view_personnel_basic, view_self` (**10**) | `:627` — «**10** permisos efectivos», lista idéntica |
| **A8** | `tirador` | `solo_propio` | `solo_propio`: está en `DETAIL_SCOPE_CODES` (`scope.py:31-34`) | `view_unit, view_self, view_personnel_basic, view_exercises` (**4**) | `:67` + scope declarado |

**Modificadores de puesto/contexto:** ninguno, y esto **consta en la evidencia registrada**: `provision_development_accounts.py:536-541` **rechaza** la provisión si algún `PositionPermission` o `UserPermissionOverride` existe sobre esos puestos/cuentas (`position_permission` / `account_override`). Los aliases sólo acumulan `RolePermission` + `PositionPermission=∅` + `override=∅`.

`AUTHZ_USE_UNIT_MEMBERSHIP = True` (`control_poligono/settings.py:197`) → rige `_get_allowed_unit_ids_v2` (`scope.py:124-164`): la unidad base es la `UnitMembership` primaria y el tipo de scope sale del assignment primario.

## 3. Tabla OP → (resource, action) → permission_code → expectativa → observado

`A` = `EXPECTED_ALLOW` / `D` = `EXPECTED_DENY`; `A*` = `EXPECTED_ALLOW_SCOPED` (condición en §4); `O/P/–` = `OBSERVED_OK`/`PARTIAL`/`NOT_EXERCISED` de `acceptance-matrix.json`. Orden de columnas: `A1 A2 A3 A4 A5 A6 A7 A8`.

| OP | Ruta | (resource, action) → permission_code | Exp | Obs |
|---|---|---|---|---|
| `OP-ARM-001` | GET /armorias/ | `armory:read → view_warehouse` | `AAAAADAD` | `OOOOOPOP` |
| `OP-ARM-002` | POST /armorias/ | `armory:create → create_warehouse_records` | `AAADADAD` | `O·····O·` |
| `OP-ARM-003` | GET /armorias/{id}/ | `armory:read → view_warehouse` | `AAAAADAD` | `······O·` |
| `OP-ARM-004` | PUT /armorias/{id}/ | `armory:update → update_warehouse_records` | `AAADADAD` | `······O·` |
| `OP-ARM-005` | PATCH /armorias/{id}/ | `armory:update → update_warehouse_records` | `AAADADAD` | `······O·` |
| `OP-ARM-006` | DELETE /armorias/{id}/ | `armory:delete → delete_warehouse_records` | `AADDDDAD` | `O·····O·` |
| `OP-AUT-001` | POST /auth/login/ | `gate:OPEN` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-AUT-002` | GET /auth/context/ | `gate:TENANT` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-AUT-003` | POST /auth/select-unit/ | `gate:TENANT` | `AAAAAAAA` | `–` |
| `OP-AUT-004` | GET /auth/audit-log/ | `gate:AUDIT` | `AADDDDDD` | `OOPPPPPP` |
| `OP-AUT-005` | POST /logout/ | `gate:AUTH` | `AAAAAAAA` | `······O·` |
| `OP-AUT-006` | GET /protected/ | `gate:TENANT` | `AAAAAAAA` | `–` |
| `OP-AZC-001` | GET /authz/catalog/ | `gate:TENANT` | `AAAAAAAA` | `–` |
| `OP-AZC-002` | GET /authz/role-categories/ | `gate:TENANT` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-AZC-003` | GET /authz/personas-por-unidad/ | `gate:TENANT` | `AAAAAAAA` | `–` |
| `OP-AZC-004` | GET /authz/eligible-target-units/ | `gate:TENANT` | `AAAAAAAA` | `–` |
| `OP-CAL-001` | GET /calibres/ | `calibre:read → view_exercises` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-CAL-002` | POST /calibres/ | `calibre:manage → manage_calibre` **y** `super_admin` en vista | `AADDDDDD` | `O·······` |
| `OP-CAL-003` | GET /calibres/{id}/ | `calibre:read → view_exercises` | `AAAAAAAA` | `O·······` |
| `OP-CAL-004` | PUT /calibres/{id}/ | `calibre:manage` + `super_admin` | `AADDDDDD` | `O·······` |
| `OP-CAL-005` | PATCH /calibres/{id}/ | `calibre:manage` + `super_admin` | `AADDDDDD` | `O·······` |
| `OP-CAL-006` | DELETE /calibres/{id}/ | `calibre:delete` **SIN MAPA** → `permissions.py:279-281` | `AADDDDDD` | `O·······` |
| `OP-CAR-001` | GET /consumos-arma/ | `consumo_arma:read → view_exercises` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-CAR-002` | POST /consumos-arma/ | `consumo_arma:create → create_exercises` | `AAADADAD` | `–` |
| `OP-CAR-003` | GET /consumos-arma/{id}/ | `consumo_arma:read → view_exercises` | `AAAAAAAA` | `–` |
| `OP-CAR-004` | PUT /consumos-arma/{id}/ | `consumo_arma:update → update_exercises` | `AAADADAD` | `–` |
| `OP-CAR-005` | PATCH /consumos-arma/{id}/ | `consumo_arma:update → update_exercises` | `AAADADAD` | `–` |
| `OP-CAR-006` | DELETE /consumos-arma/{id}/ | `consumo_arma:delete → delete_exercises` | `AADDDDDD` | `–` |
| `OP-CMN-001` | GET /consumos-municion/ | `consumo_municion:read → view_exercises` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-CMN-002` | POST /consumos-municion/ | `consumo_municion:create → create_exercises` | `AAADADAD` | `P·······` |
| `OP-CMN-003` | GET /consumos-municion/{id}/ | `consumo_municion:read → view_exercises` | `AAAAAAAA` | `–` |
| `OP-CMN-004` | PUT /consumos-municion/{id}/ | `consumo_municion:update → update_exercises` | `AAADADAD` | `–` |
| `OP-CMN-005` | PATCH /consumos-municion/{id}/ | `consumo_municion:update → update_exercises` | `AAADADAD` | `–` |
| `OP-CMN-006` | DELETE /consumos-municion/{id}/ | `consumo_municion:delete → delete_exercises` | `AADDDDDD` | `–` |
| `OP-EJR-001` | GET /ejercicios/ | `ejercicio_militar:read → view_exercises` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-EJR-002` | POST /ejercicios/ | `ejercicio_militar:create → create_exercises` | `AAADADAD` | `OOO–O–O·` |
| `OP-EJR-003` | GET /ejercicios/{id}/ | `ejercicio_militar:read → view_exercises` | `AAAAAAAA` | `OOO–OOO·` |
| `OP-EJR-004` | PUT /ejercicios/{id}/ | `ejercicio_militar:update → update_exercises` | `AAADADAD` | `OOO–O–O·` |
| `OP-EJR-005` | PATCH /ejercicios/{id}/ | `ejercicio_militar:update → update_exercises` | `AAADADAD` | `OOO–O–O·` |
| `OP-EJR-006` | DELETE /ejercicios/{id}/ | `ejercicio_militar:delete → delete_exercises` | `AADDDDDD` | `OOP···P·` |
| `OP-FRC-001` | GET /fracciones/ | `shooting_fraction:read → view_unit` | `AAAAAAAA` | `–` |
| `OP-FRC-002` | POST /fracciones/ | `shooting_fraction:create → create_shooting_lessons` | `AADDADDD` | `–` |
| `OP-FRC-003` | GET /fracciones/{id}/ | `shooting_fraction:read → view_unit` | `AAAAAAAA` | `–` |
| `OP-FRC-004` | PUT /fracciones/{id}/ | `shooting_fraction:update → update_shooting_lessons` | `AADDADDD` | `–` |
| `OP-FRC-005` | PATCH /fracciones/{id}/ | `shooting_fraction:update → update_shooting_lessons` | `AADDADDD` | `–` |
| `OP-FRC-006` | DELETE /fracciones/{id}/ | `shooting_fraction:delete → delete_shooting_lessons` | `AADDADDD` | `–` |
| `OP-FRC-007` | GET /fracciones/{id}/tiradores/ | `shooting_fraction:read → view_unit` | `AAAAAAAA` | `–` |
| `OP-FRC-008` | GET /fracciones/{id}/resultados/ | `shooting_fraction:read → view_unit` | `AAAAAAAA` | `–` |
| `OP-LES-001` | GET /lecciones/ | `shooting_session:read → view_unit` | `AAAAAAA⁺` | `OOOOOOOO` |
| `OP-LES-002` | POST /lecciones/ | `shooting_session:create → create_shooting_lessons` | `AADDADDD` | `–` |
| `OP-LES-003` | GET /lecciones/{id}/ | `shooting_session:read → view_unit` | `AAAAAAA⁺` | `–` |
| `OP-LES-004` | PUT /lecciones/{id}/ | `shooting_session:update → update_shooting_lessons` | `AADDADDD` | `–` |
| `OP-LES-005` | PATCH /lecciones/{id}/ | `shooting_session:update → update_shooting_lessons` | `AADDADDD` | `–` |
| `OP-LES-006` | DELETE /lecciones/{id}/ | `shooting_session:delete → delete_shooting_lessons` | `AADDADDD` | `–` |
| `OP-LES-007` | GET /lecciones/{id}/fracciones/ | `shooting_session:read → view_unit` | `AAAAAAA⁺` | `–` |
| `OP-LES-008` | GET /lecciones/{id}/usuarios/ | `shooting_session:read → view_unit` | `AAAAAAA⁺` | `–` |
| `OP-LES-009` | GET /lecciones/{id}/resultados/ | `shooting_session:read → view_unit` | `AAAAAAA⁺` | `–` |
| `OP-LES-010` | GET /lecciones/{id}/resultados-resumen/ | `shooting_session:read_summary → view_unit` | `AAAAAAA⁺` | `–` |
| `OP-LES-011` | GET /lecciones/{id}/reporte/ | `shooting_session:read → view_unit` | `AAAAAAA⁺` | `–` |
| `OP-LES-012` | GET /lecciones/{id}/tiradores-elegibles/ | `shooting_session:read → view_unit` | `AAAAAAA⁺` | `–` |
| `OP-MEM-001` | GET /memberships/ | `position:read → view_unit` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-MEM-002` | POST /memberships/ | `position:create → assign_positions` | `AAADDDDD` | `–OO·····` |
| `OP-MEM-003` | GET /memberships/{id}/ | `position:read → view_unit` | `AAAAAAAA` | `–` |
| `OP-MEM-004` | PUT /memberships/{id}/ | `position:update → assign_positions` | `AAADDDDD` | `–O······` |
| `OP-MEM-005` | PATCH /memberships/{id}/ | `position:update → assign_positions` | `AAADDDDD` | `–O······` |
| `OP-MEM-006` | DELETE /memberships/{id}/ | `position:delete → revoke_positions` | `AAADDDDD` | `–OO·····` |
| `OP-OVR-001…006` | /authz/overrides/… | `gate:TA` | `AADDDDDD` (×6) | `–` (×6) |
| `OP-POS-001` | GET /posiciones/ | `position:read → view_unit` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-POS-002` | POST /posiciones/ | `position:create → assign_positions` | `AAADDDDD` | `OOO·····` |
| `OP-POS-003` | GET /posiciones/{id}/ | `position:read → view_unit` | `AAAAAAAA` | `OOO–OOOO` |
| `OP-POS-004` | PUT /posiciones/{id}/ | `position:update → assign_positions` | `AAADDDDD` | `OOO·····` |
| `OP-POS-005` | PATCH /posiciones/{id}/ | `position:update → assign_positions` | `AAADDDDD` | `OOO·····` |
| `OP-POS-006` | DELETE /posiciones/{id}/ | `position:delete → revoke_positions` | `AAADDDDD` | `OPO·····` |
| `OP-POS-007` | POST /posiciones/{id}/asignar-holder/ | `position:update → assign_positions` (`identity/views.py:31-35`) | `AAADDDDD` | `OO······` |
| `OP-POS-008` | POST /posiciones/{id}/quitar-holder/{id}/ | `position:update → assign_positions` | `AAADDDDD` | `OO······` |
| `OP-POS-009` | GET /posiciones/{id}/historico/ | `position:read → view_unit` | `AAAAAAAA` | `OOO–OOOO` |
| `OP-PPR-001…006` | /authz/position-permissions/… | `gate:TA` | `AADDDDDD` (×6) | `–OPPPPPP` / `–` |
| `OP-PRF-001` | GET /me/preferences/appearance/ | `gate:AUTH` | `AAAAAAAA` | `–` |
| `OP-PRF-002` | PUT /me/preferences/appearance/ | `gate:AUTH` | `AAAAAAAA` | `–` |
| `OP-PRM-001` | GET /authz/permissions/ | `gate:TENANT` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-PRM-002` | GET /authz/permissions/{id}/ | `gate:TENANT` | `AAAAAAAA` | `–OOOOOOO` |
| `OP-RCT-001` | GET /recintos/ | `recinto:read → view_recinto` | `AAAADDDD` | `OOOOPPPP` |
| `OP-RCT-002` | POST /recintos/ | `recinto:create → manage_recinto` | `AAADDDDD` | `OOO·····` |
| `OP-RCT-003` | GET /recintos/{id}/ | `recinto:read → view_recinto` | `AAAADDDD` | `OOO·····` |
| `OP-RCT-004` | PUT /recintos/{id}/ | `recinto:update → manage_recinto` | `AAADDDDD` | `OOO·····` |
| `OP-RCT-005` | PATCH /recintos/{id}/ | `recinto:update → manage_recinto` | `AAADDDDD` | `–OO·····` |
| `OP-RCT-006` | DELETE /recintos/{id}/ | `recinto:delete → manage_recinto` | `AAADDDDD` | `OOO·····` |
| `OP-RCT-007` | POST /recintos/{id}/agregar-unidad/{code}/ | `recinto:update → manage_recinto` (`organizations/views.py:204-207`) | `AAADDDDD` | `–O······` |
| `OP-RCT-008` | DELETE /recintos/{id}/quitar-unidad/{code}/ | `recinto:update → manage_recinto` | `AAADDDDD` | `–O······` |
| `OP-RCV-001…004` | /recuperar/… | `gate:OPEN` | `AAAAAAAA` (×4) | `–` (×4) |
| `OP-RES-001` | GET /resultados/ | `shooting_result:read → view_personnel_basic` | `AAAAAAA⁺` | `–` |
| `OP-RES-002` | POST /resultados/ | `shooting_result:create → score_shooters` | `AADDADDD` | `P·······` |
| `OP-RES-003` | GET /resultados/{id}/ | `shooting_result:read → view_personnel_basic` | `AAAAAAA⁺` | `O·······` |
| `OP-RES-004` | PUT /resultados/{id}/ | `shooting_result:update → score_shooters` | `AADDADDD` | `P·······` |
| `OP-RES-005` | PATCH /resultados/{id}/ | `shooting_result:update → score_shooters` | `AADDADDD` | `P·······` |
| `OP-RES-006` | DELETE /resultados/{id}/ | `shooting_result:delete → score_shooters` | `AADDADDD` | `O·······` |
| `OP-RNG-001` | GET /poligonos/ | `range:read → view_unit` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-RNG-002` | POST /poligonos/ | `range:create → create_shooting_lessons` | `AADDADDD` | `–` |
| `OP-RNG-003` | GET /poligonos/{id}/ | `range:read → view_unit` | `AAAAAAAA` | `–` |
| `OP-RNG-004` | PUT /poligonos/{id}/ | `range:update → update_shooting_lessons` | `AADDADDD` | `–` |
| `OP-RNG-005` | PATCH /poligonos/{id}/ | `range:update → update_shooting_lessons` | `AADDADDD` | `–` |
| `OP-RNG-006` | DELETE /poligonos/{id}/ | `range:delete` **SIN MAPA** | `AADDDDDD` | `–` |
| `OP-RNG-007` | GET /poligonos/{id}/lecciones/ | `range:read → view_unit` | `AAAAAAAA` | `–` |
| `OP-ROL-001` | GET /authz/roles/ | `gate:TENANT` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-ROL-002` | POST /authz/roles/ | `gate:TA` | `AADDDDDD` | `–` |
| `OP-ROL-003` | GET /authz/roles/{id}/ | `gate:TENANT` | `AAAAAAAA` | `–OOOOOOO` |
| `OP-ROL-004…006` | PUT/PATCH/DELETE /authz/roles/{id}/ | `gate:TA` | `AADDDDDD` (×3) | `–` (×3) |
| `OP-RPR-001…006` | /authz/role-permissions/… | `gate:TA` | `AADDDDDD` (×6) | `–OPPPPPP` / `–` |
| `OP-SCP-001` | GET /authz/scopes/ | `gate:TENANT` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-SCP-002` | GET /authz/scopes/{id}/ | `gate:TENANT` | `AAAAAAAA` | `–OOOOOOO` |
| `OP-UNT-001` | GET /organization-units/ | `organization_unit:read → view_unit` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-UNT-002` | POST /organization-units/ | `organization_unit:create → create_unit` **+ regla de raíz** | `AAADDDDD` (A3 condicional, §4.2) | `OOP·····` |
| `OP-UNT-003` | GET /organization-units/{id}/ | `organization_unit:read → view_unit` | `AAAAAAAA` | `OO––OO–O` |
| `OP-UNT-004` | PUT /organization-units/{id}/ | `organization_unit:update → update_unit` | `AAADDDDD` | `OO······` |
| `OP-UNT-005` | PATCH /organization-units/{id}/ | `organization_unit:update → update_unit` | `AAADDDDD` | `OO······` |
| `OP-UNT-006` | DELETE /organization-units/{id}/ | `organization_unit:delete → delete_unit` | `AAADDDDD` | `OO······` |
| `OP-UNT-007` | GET …/previsualizar-eliminacion/ | `organization_unit:delete → delete_unit` | `AAADDDDD` | `O·······` |
| `OP-UNT-008` | POST …/eliminar-con-migracion/ | `organization_unit:delete → delete_unit` | `AAADDDDD` | `O·······` |
| `OP-UNT-009` | GET /organization-units/lookup/ | `organization_unit:read → view_unit` | `AAAAAAAA` | `OOOOO–O–` |
| `OP-UNT-010` | GET /me/assignable-units/ | `gate:TENANT` | `AAAAAAAA` | `–O······` |
| `OP-USR-001` | GET /usuarios/ | `user:read → view_personnel_basic` | `AAAAAAA⁺` | `OOOOOOOO` |
| `OP-USR-002` | POST /usuarios/ | `user:create → create_users` | `AAADADDD` | `–O······` |
| `OP-USR-003` | GET /usuarios/{id}/ | `user:read → view_personnel_basic` | `AAAAAAA⁺` | `OOOOOOOO` |
| `OP-USR-004` | PUT /usuarios/{id}/ | `user:update → update_users` | `AAADDDDD` | `OOO·····` |
| `OP-USR-005` | PATCH /usuarios/{id}/ | `user:update → update_users` | `AAADDDDD` | `OOO·····` |
| `OP-USR-006` | DELETE /usuarios/{id}/ | `user:delete → disable_users` | `AAADDDDD` | `OOO·····` |
| `OP-USR-007` | PUT …/asignacion-principal/ | `user:update → update_users` | `AAADDDDD` | `–O······` |
| `OP-USR-008` | PATCH …/asignacion-principal/ | `user:update → update_users` | `AAADDDDD` | `–O······` |
| `OP-USR-009` | POST …/desactivar-asignacion-principal/ | `user:update → update_users` | `AAADDDDD` | `–O······` |
| `OP-USR-010` | POST …/agregar-asignacion/ | `user:update → update_users` | `AAADDDDD` | `–O······` |
| `OP-USR-011` | POST …/quitar-asignacion/{id}/ | `user:update → update_users` | `AAADDDDD` | `–O······` |
| `OP-USR-012` | POST /usuarios/crear-temporal/ | `user:create → create_users` | `AAADADDD` | `OOO–O···` |
| `OP-USR-013` | POST …/cambiar-contrasena/ | **propio** → `IsAuthenticated+HasTenantAccess` (`views.py:609-616`); **ajeno** → `user:update → update_users` | `AAAAAAAA` (self) / `AAADDDDD` (otro) | `·······P` (A8, POST **200** observado) |
| `OP-USR-014` | POST …/resetear-contrasena/ | `user:update → update_users` | `AAADDDDD` | `–` |
| `OP-USR-015` | GET …/estado-bloqueo/ | `user:read → view_personnel_basic` | `AAAAAAAA` | `–` |
| `OP-USR-016` | POST …/desbloquear/ | `user:update → update_users` | `AAADDDDD` | `–` |
| `OP-WPN-001` | GET /armas/ | `weapon:read → view_warehouse` | `AAAAADAD` | `OOOOOPOP` |
| `OP-WPN-002` | POST /armas/ | `weapon:create → create_warehouse_records` | `AAADADAD` | `OOOPO–O·` |
| `OP-WPN-003` | GET /armas/{id}/ | `weapon:read → view_warehouse` | `AAAAADAD` | `OOO–O–O·` |
| `OP-WPN-004` | PUT /armas/{id}/ | `weapon:update → update_warehouse_records` | `AAADADAD` | `OOO–O–O·` |
| `OP-WPN-005` | PATCH /armas/{id}/ | `weapon:update → update_warehouse_records` | `AAADADAD` | `OOO–O–O·` |
| `OP-WPN-006` | DELETE /armas/{id}/ | `weapon:delete → delete_warehouse_records` | `AADDDDAD` | `OOP–P–O·` |
| `OP-PRF-003` | GET /me/preferences/appearance/design-system/ | `gate:AUTH` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-PRF-004` | PUT /me/preferences/appearance/design-system/ | `gate:AUTH` | `AAAAAAAA` | `OOOOOOOO` |
| `OP-PRF-005` | DELETE /me/preferences/appearance/design-system/ | `gate:AUTH` | `AAAAAAAA` | `OOOOOOOO` |

`⁺` = permiso concedido pero **el conjunto visible depende de datos** → §4.3.

## 4. Vocabulario y reglas duras de derivación

### 4.1 Reglas de codificación (uniformes, comprobables fila a fila)
- `EXPECTED_ALLOW`: el actor tiene el `permission_code` por `RolePermission`, **o** es `super_admin` (bypass), **o** la vista no usa `HasResourcePermission` y su gate se cumple.
- `EXPECTED_DENY`: el `permission_code` no está en el conjunto efectivo, o el par `(resource, action)` **no existe** en `RESOURCE_ACTION_TO_PERMISSION`, o el gate (`TA`/`AUDIT`) no se cumple.
- `EXPECTED_ALLOW_SCOPED`: el permiso se concede, pero el conjunto de filas depende de `get_allowed_unit_ids()` / `DETAIL_SCOPE_CODES` / M2M → la condición exacta va en §4.3.
- `INDETERMINABLE_STATIC`: la expectativa requiere el **contenido de la base** (no el código). §4.4.

### 4.2 Condiciones intra-vista que corrigen el código puro (no son permisos; son reglas del método)
| OP | Regla en código | Efecto sobre la expectativa |
|---|---|---|
| `OP-CAL-002/004/005` | `_require_super_admin` (`views.py:1296-1300`) | A2 tiene `manage_calibre` en la semilla (`init_access_model.py:198-201`) pero la vista exige `super_admin` → **DENY** efectivo para A2 |
| `OP-UNT-002` | `perform_create` (`organizations/views.py:47-59`): `parent` vacío ⇒ sólo `tenant_admin`/`super_admin` | A3: `EXPECTED_ALLOW_SCOPED` **con `parent` dentro de su rama** (`_scoped_units_qs`), `EXPECTED_DENY` **sin `parent`** (403). Es exactamente el 403 observado |
| `OP-POS-007` | `identity/views.py:59-60`: `position.organization_unit ∈ get_allowed_unit_ids(request)` | A1/A2/A3 `ALLOW_SCOPED` (unidad del puesto dentro del alcance) |
| `OP-USR-013` | `views.py:609-616` | self: sin permiso de recurso; ajeno: `update_users` |
| `OP-RNG-006`, `OP-CAL-006` | par ausente del mapa (`permissions.py:279-281`) | DENY para todos salvo bypass `super_admin` (A1) |

### 4.3 `EXPECTED_ALLOW_SCOPED` — la condición exacta a observar
| Familia | Actor | Condición |
|---|---|---|
| Lecciones (`OP-LES-*`) | A1, A2 | sin filtro de unidad (`allowed is None` → `views.py:1266-1267` del análogo en `LeccionTiroViewSet`) |
| Lecciones | A3, A4, A5, A7 | `LeccionTiro.organization_unit ∈ _descendant_ids({CIA-A})` **o** `unidades_participantes ∩ allowed ≠ ∅` |
| Lecciones | A6, A8 | mismo filtro, pero **caso especial tirador puro**: sólo lecciones donde el M2M lo incluye o tiene `ResultadoTiro` (`views.py:775-780`) |
| Resultados (`OP-RES-001/003`) | A6, A8 | `id_usuario = request.user.pk` **y ninguna** asignación activa con rol distinto de `tirador` (`views.py:1262-1272`) |
| Resultados | A3, A4, A5, A7 | `organization_unit ∈ allowed` **o** `leccion.unidades_participantes ∩ allowed ≠ ∅` |
| Unidades/puestos/membresías | A3, A5, A6, A7 | `get_allowed_unit_ids` = descendientes de `CIA-A` (A7: sólo `CIA-A`, `unidad_propia`) |
| Detalle vs agregado | A4, A6 | `can_read_detail()` = True (`DETAIL_SCOPE_CODES` incluye `unidad_y_descendientes`, `scope.py:31-34`); A7 (`unidad_propia`) también True; A8 (`solo_propio`) True |

### 4.4 `INDETERMINABLE_STATIC` — no derivable del código, con su condición
| Caso | Por qué | Condición exacta a observar |
|---|---|---|
| «el tirador ve sólo sus lecciones» (`OP-LES-001/003` y familia, actor A8) | depende de filas M2M `unidades_participantes` y de `ResultadoTiro`, no del permiso | verificar que el listado de A8 no contiene ninguna lección en la que no sea participante M2M ni tenga resultado |
| «el tirador ve sólo sus resultados» (`OP-RES-001/003`, A8) | depende de `id_usuario` de filas | verificar que ninguna fila ajena aparece |
| Tamaño del conjunto de A3/A5/A6/A7 (`allowed = CIA-A + descendientes`) | depende del árbol `OrganizationUnit` en base | comprobar que ninguna unidad fuera de la rama es visible |
| `OP-USR-002` unidad destino de la alta formal | `eligible_target_units` + `get_allowed_unit_ids` sobre datos | el `201` de A2 se explica por rol global; falta ejercicio con `admin_unidad` |
| `OP-UNT-010` contenido (unidades asignables) | depende del árbol y del permiso permitido de la posición | `AssignableUnitsView:271+` |
| Toda fila de resultado **visible** cuando el permiso es DENY (403) | el permiso no dice nada del contenido | — |

## 5. Contraste inicial esperado vs observado

### 5.1 Coincidencias (denegaciones observadas que la matriz estática **sí** predice)
| Observado | Fuente | Expectado |
|---|---|---|
| A6, A8 `GET /armas/` → 403 | `runtime-family-evidence.json` (barrido V0, 14×403) | `EXPECTED_DENY` (sin `view_warehouse`) ✔ |
| A6, A8 `GET /armorias/` → 403 | ídem | `EXPECTED_DENY` ✔ |
| A5, A6, A7, A8 `GET /recintos/` → 403 | ídem | `EXPECTED_DENY` (sin `view_recinto`; A4 sí lo tiene y observations `200`) ✔ |
| A3–A8 `GET /auth/audit-log/` → 403 | ídem | `EXPECTED_DENY` (gate `AUDIT`) ✔ |
| A3–A8 `GET /authz/role-permissions/` y `…/position-permissions/` → 403 | `exec-plan-summary.md:462,493,549,578,635` | `EXPECTED_DENY` (`IsTenantAdmin`) ✔ |
| A3 `DELETE /armas/{id}/` → 403 (§12) | `backend-debt.md` §12 | `EXPECTED_DENY` (`admin_unidad` sin `delete_warehouse_records`) ✔ |
| A3 `DELETE /ejercicios/{id}/` → 403 (§12) | ídem | `EXPECTED_DENY` (sin `delete_exercises`) ✔ |
| A4 `POST /armas/` → 403 (§12) | ídem | `EXPECTED_DENY` (sin `create_warehouse_records`) ✔ |
| A7 `DELETE /ejercicios/{id}/` → 403 (§12) | ídem | `EXPECTED_DENY` ✔ — asimetría de rol, tal como lo describe la deuda |
| A3 `POST /organization-units/` → 403 (§12) | ídem | `EXPECTED_DENY` **sólo si `parent` vacío** (§4.2) ✔ condicionado |
| A8 `POST /usuarios/{id}/cambiar-contrasena/` → **200** | matriz `OP-USR-013` A8 `PARTIAL`, evidencia `observations.f7_after_fix` | `EXPECTED_ALLOW` por bypass de self (`views.py:609-616`) ✔ |

**Cero casos de `OBSERVED_OK` contra `EXPECTED_DENY`** en las 1320 celdas. Todos los `403` observados son los que la matriz estática predice.

### 5.2 Discrepancias (esperado `ALLOW`, observado rechazo)
Ninguna es una discrepancia de **permiso**: las cinco son rechazos de validación o de integridad en el propio endpoint, con el permiso ya concedido.

| Celda | Observado | Fuente | Por qué no es discrepancia de autorización |
|---|---|---|---|
| `OP-POS-006` A2 | `500 ProtectedError` | `exec-plan-summary.md:463`, `backend-debt.md` §11 | permiso `revoke_positions` concedido; falla la FK `PROTECT` del `Assignment` |
| `OP-RES-002/004/005` A1 | `400 non_field_errors` | `backend-debt.md` §7 / §7.1 | `score_shooters` concedido; colisión de unicidad y desalineación unidad-fracción |
| `OP-CMN-002` A1 | `500` | `backend-debt.md` §8 | `create_exercises` concedido |

### 5.3 Discrepancias de **gating de UI** (el backend se comportó como la matriz predice)
Los tres casos de `backend-debt.md` §12 — `admin_unidad` ve «Crear unidad» y recibe 403, `comandante_unidad` ve «Registrar arma» y recibe 403, `encargado_almacen` no ve «Eliminar» y recibe 403 — **no son contradicciones del contrato de permisos**: el `403` es el resultado esperado para esos tres actores. Lo que se observa es que la UI ofrece la acción en los dos primeros casos.

## 6. Límites del método

1. **El conjunto visible no es derivable del permiso.** Toda `EXPECTED_ALLOW` sobre `GET` de listados afirma permiso concedido, no el conjunto correcto de filas. Ése es el núcleo del `NOT_VERIFIED` original y sigue siéndolo aunque se publique esta matriz.
2. **Los overrides y `PositionPermission` no se pueden verificar estáticamente.** El perfil de §2 vale para las cuentas de desarrollo, y sólo porque `provision_development_accounts.py:536-541` **rechaza** la provisión si existen. Para cualquier otra cuenta, el mismo método exige consultar `UserPermissionOverride` y `PositionPermission` en base.
3. **Los gates no son `permission_code`.** 31 filas se resuelven por *permission class*, no por el catálogo atómico: no se pueden expresar como «código de permiso del actor» y son la razón por la que la matriz original decía «el contrato por (resource,action) no traduce a alias».
4. **No hay cobertura de tenant.** `expected_by_actor` no dice nada sobre `X-Tenant-Code` equivocado: `HasTenantAccess` devuelve 403 (`permissions.py:246-258`) para todos los actores por igual.
5. **Sobre `AUDIT`, `TA`, `calibre` y raíz de unidades**, el efecto denegador es una comparación de **rol**, no de código atómico; si mañana existiera el rol `auditor` (`AuditLogView:1745`) o un override que lo habilite, esta matriz no lo captura sin releer el rol.
6. **Sin runtime, esto no certifica nada.** Certificar «el tirador ve sólo sus lecciones», «A3 ve sólo su rama» o «A7 ve sólo su armería» exige GET por actor con conteo contra el árbol y las filas M2M/resultados. Aquí sólo se derivó el permiso y la **condición** a observar.
7. **Alcance de este informe:** es la matriz actor→permiso (C-4). No cierra `expected_by_actor` en la matriz de aceptación: publicar este informe no cambia ninguna celda, y las 1320 siguen `NOT_VERIFIED` hasta que un consumidor registre la traducción.

## Anomalías visibles (una línea, sin auditoría)

- `apps/authorization/permissions.py:279-281` — un par ausente del mapa produce `False` (403) en vez de una denegación explícita; eso deja `DELETE /poligonos/` y `DELETE /calibres/` como `DENY` silencioso para A2, que sí tiene `manage_calibre` en la semilla.
- `init_access_model.py:198-201` siembra `calibre:manage → manage_calibre` a `tenant_admin`, pero `views.py:1296-1300` exige `super_admin`: semilla y vista no coinciden.
- `views.py:609-616` deja `OP-USR-013` fuera de `RESOURCE_ACTION_TO_PERMISSION`: es el único `user:*` que no se traduce por `(resource, action)`.
- `ops/overrides` (`OP-OVR-*`) usa `IsTenantAdmin`, no `HasResourcePermission`: no existe `permission_code` que lo represente en el catálogo.

---

## Consumo (2026-10-16)

> 📜 La expectativa quedó **consumida**. El **2026-10-16** se poblaron `expected_by_actor` y
> `expected_source` en las **1320 celdas** (165 filas × 8 actores) de la matriz de aceptación
> [`evidence/2026-10-12/acceptance-matrix.json`](../evidence/2026-10-12/acceptance-matrix.json),
> aplicando la traducción de §1 (`A`→`EXPECTED_ALLOW`, `D`→`EXPECTED_DENY`,
> `⁺`→`EXPECTED_ALLOW_SCOPED`) y, **después**, los cinco overrides de §4.2.

- **Distribución:** **794** `EXPECTED_ALLOW` · **505** `EXPECTED_DENY` · **21** `EXPECTED_ALLOW_SCOPED`.
- **Sin cambios:** `status_by_actor`, contadores (354 / 38 / 928) y estado global (`NOT_VERIFIED` / `NO_CUMPLIDO`).
- **Pendiente:** la certificación esperado-vs-observado es paso posterior.
- **Registro del consumo:** `observations.expected_population_2026_10_16` en la matriz.
- **Certificación (2026-10-16):** primera pasada ejecutada — 392 celdas contrastadas; 31 denegaciones certificadas (`PARTIAL`→`OBSERVED_OK`); 5 fallos no-autorización; 2 sin resolver (ver `evidence/2026-10-16/certification-pass.md`).
- **Certificación de contenido (2026-10-16):** primera pasada sobre las condiciones de §4.3/§4.4 — ramas de A3/A7 en subconjunto estricto (delta 11), lecciones con filtro activo (A6 0; A8 1 con participación confirmada 1/1); ver `evidence/2026-10-16/content-certification-pass.md`.
- **Validación C-4 del barrido de lecturas (2026-10-16):** **0 discrepancias** entre expectativa y observación en las **273 celdas `GET` ejercitadas** — **145** lecturas `ALLOW`/`SCOPED` observadas en 2xx y **37** denegaciones `DENY` observadas en 403 coinciden con la expectativa derivada aquí (§1–§4); **91** celdas sin contrastar (88 «sin filas propias» de causa de contenido + 3 fallos de servidor). Conteo de la matriz **385→567 `OBSERVED_OK` / 7 `PARTIAL` / 928→746 `NOT_EXERCISED`**; ver `evidence/2026-10-16/read-sweep-2026-10-16.md` y `observations.read_sweep_2026_10_16`.
- **Validación C-4 del re-barrido post-siembra (2026-10-16):** **91** celdas `GET` objetivo contrastadas → **84 coincidencias certificadas** (`NOT_EXERCISED`→`OBSERVED_OK`, todas `ALLOW`/`SCOPED` observadas en 2xx, con identificador propio gracias a la siembra de contenido de desarrollo) y **0 discrepancias** de autorización contra la expectativa derivada aquí (§1–§4); **7** celdas sin certificar (**4** RBAC `OP-OVR-003`/`OP-PPR-003` A1–A2 «sin filas propias» — terreno auth, **pendiente de decisión del operador** — y **3** fallos de servidor `OP-LES-009` A1/A2/A8, hallazgo §9). Conteo de la matriz **567→651 `OBSERVED_OK` / 7 `PARTIAL` / 746→662 `NOT_EXERCISED`**; ver `evidence/2026-10-16/seed-dev-content-and-post-seed-sweep.md` y `observations.read_sweep_post_seed_2026_10_16`.
- **Validación C-4 del tercer barrido post-siembra RBAC (2026-10-16):** **7** celdas `GET` objetivo contrastadas → **4 coincidencias certificadas** (`NOT_EXERCISED`→`OBSERVED_OK`, todas `ALLOW` observadas en 2xx con identificador propio: `OP-OVR-003`/`OP-PPR-003` A1–A2) y **0 discrepancias** de autorización contra la expectativa derivada aquí (§1–§4); **3** celdas sin certificar (fallos de servidor `OP-LES-009` A1/A2/A8, hallazgo §9). Conteo de la matriz **651→655 `OBSERVED_OK` / 7 `PARTIAL` / 662→658 `NOT_EXERCISED`**; con esto el **carril de lecturas `GET` queda resuelto salvo los 3 del §9**; ver `evidence/2026-10-16/rbac-dev-rows-and-post-rbac-sweep.md` y `observations.read_sweep_post_rbac_seed_2026_10_16`.
- **Validación C-4 del lote de escritura tiro+armerías (2026-10-16):** **46** celdas de **escritura** `POST`/`PUT`/`PATCH`/`DELETE` objetivo contrastadas → **46 coincidencias certificadas** (`NOT_EXERCISED`→`OBSERVED_OK`, todas `ALLOW`/`SCOPED` observadas en 2xx con el **estado exacto** de cada operación: `POST` 201 / `PUT` 200 / `PATCH` 200 / `DELETE` 204) y **0 discrepancias** de autorización contra la expectativa derivada aquí (§1–§4); **0** celdas sin certificar. Conteo de la matriz **655→701 `OBSERVED_OK` / 7 `PARTIAL` / 658→612 `NOT_EXERCISED`**; ver `evidence/2026-10-16/tiro-writes-batch.md` y `observations.writes_batch_tiro_2026_10_16`.
- **Validación C-4 del lote de escritura USR (2026-10-16):** **22** celdas de **escritura** del dominio de identidad objetivo (`OP-USR-002` alta formal ×A1/A3/A5; `OP-USR-007/008/009/010/011` asignaciones ×A1/A3; `OP-USR-013/014/016` credenciales ×A1/A2/A3) → **19 coincidencias certificadas** (`NOT_EXERCISED`→`OBSERVED_OK`, todas `ALLOW`/`SCOPED` observadas en 2xx) y **0 discrepancias** de autorización contra la expectativa derivada aquí (§1–§4); **3** celdas bloqueadas (`OP-USR-016` A1/A2/A3) por **defectos de backend documentados** (`views.py:118` y `views.py:715`; deuda §14 y §15), no por denegación de permiso. En **tres corridas** (corrida 1 **10** + reintentos **2**/**7**), con el defecto del arnés del reintento 1 declarado y corregido. Conteo de la matriz **701→720 `OBSERVED_OK` / 7 `PARTIAL` / 612→593 `NOT_EXERCISED`**; ver `evidence/2026-10-16/usr-writes-batch.md` y `observations.writes_batch_usr_2026_10_16` · `observations.writes_batch_usr_retry_2026_10_16`.
- **Validación C-4 del lote de escritura lote 2a — autoservicio (2026-10-16):** **23** celdas de **escritura** objetivo sobre el propio actor (`OP-PRF-002` `PUT /me/preferences/appearance/` ×A1–A8; `OP-AUT-003` `POST /auth/select-unit/` ×A1–A8; `OP-AUT-005` `POST /logout/` ×A1–A6,A8) → **23 coincidencias certificadas** (`NOT_EXERCISED`→`OBSERVED_OK`, todas `ALLOW` observadas en 2xx: `PUT` 200 / `POST` 200) y **0 discrepancias** de autorización contra la expectativa derivada aquí (§1–§4); **0** celdas sin certificar. Conteo de la matriz **720→743 `OBSERVED_OK` / 7 `PARTIAL` / 593→570 `NOT_EXERCISED`**; ver `evidence/2026-10-16/lote2-writes-batch.md` y `observations.writes_batch_lote2a_2026_10_16`.
- **Validación C-4 del lote de escritura lote 2b — descartables (2026-10-16):** **35** celdas de **escritura** objetivo de dominio (`CAR` 17, `MEM` 6, `RCT` 5, `UNT` 5, `POS` 2) → **35 coincidencias certificadas** (`NOT_EXERCISED`→`OBSERVED_OK`, todas `ALLOW`/`SCOPED` observadas en 2xx con el **estado exacto** de cada operación: `POST` 201 / `PUT` 200 / `PATCH` 200 / `DELETE` 204) y **0 discrepancias** de autorización contra la expectativa derivada aquí (§1–§4); **0** celdas sin certificar. **`OP-CAR-002` de A3/A5** (aquí `EXPECTED_ALLOW`) validado **en runtime**: una **sospecha estática** previa de `403` **no se confirmó** — ambas respondieron **201**. Conteo de la matriz **743→778 `OBSERVED_OK` / 7 `PARTIAL` / 570→535 `NOT_EXERCISED`**; con el lote 2 (2a+2b) el total contrastado en escritura son **58 objetivos → 58 certificadas** con **0 discrepancias**; ver `evidence/2026-10-16/lote2-writes-batch.md` y `observations.writes_batch_lote2b_2026_10_16`.
- **Validación C-4 del barrido de denegaciones de escritura no-RBAC (2026-10-16):** **341 objetivos** no-RBAC con expectativa **`EXPECTED_DENY`** ejercitados con la **sesión real del actor + `X-CSRFToken`** → **329 coincidencias certificadas** por **`403` exacto** (`NOT_EXERCISED`→`OBSERVED_OK`) y **0 discrepancias** de autorización contra la expectativa derivada aquí (§1–§4); **12** celdas declaradas **no probadas** (`OP-CMN-004/005/006`, sin objetivo descartable sin ORM por el alta rota, deuda §8) que la matriz **no** toca. En **dos barridos**: **sweep 1** (identidad/organización `USR`·`RCT`·`POS`·`CAL`·`UNT`·`MEM`) **191/191** certificadas y **sweep 2** (tiro/almacén/resultados `RNG`·`RES`·`LES`·`FRC`·`CMN`·`CAR`·`ARM`·`EJR`·`WPN`) **138/150** certificadas; **0 desajustes** (ningún `2xx` donde se esperaba denegación). Conteo de la matriz **778→969→1107 `OBSERVED_OK` / 7 `PARTIAL` / 535→344→206 `NOT_EXERCISED`**; ver `evidence/2026-10-16/denials-sweeps.md` y `observations.denials_sweep1_2026_10_16` · `observations.denials_sweep2_2026_10_16`.
