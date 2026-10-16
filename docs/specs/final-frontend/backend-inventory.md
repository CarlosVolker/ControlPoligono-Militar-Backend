---
spec_meta: "./spec-meta.yaml"
---

# Inventario canónico del backend consumible

> 📖 Registro estático para la spec `final-frontend`. No representa una verificación de runtime ni autoriza cambios de API. El prefijo público es `/api/` (`control_poligono/urls.py:20-22`) y el router aplica barra final (`apipoligono/urls.py:39-65`).

## Contenido

- [Método y convención](#método-y-convención)
- [Manifest de operaciones](#manifest-de-operaciones)
- [Capacidades sin endpoint y transporte](#capacidades-sin-endpoint-y-transporte)
- [Límites comprobados](#límites-comprobados)

---

## Método y convención

Cada fila es exactamente una operación pública por **método HTTP + patrón**. Los identificadores `OP-*` son estables dentro de esta spec. No uso abreviaturas agrupadas como sustituto de filas: `PUT` y `PATCH` son operaciones diferentes y aparecen por separado. `SCREEN/*` y `FL/*` son consumidores provisionales, no rutas ni pantallas implementadas.

La columna **control y alcance** expresa el par `resource:action → permission_code` cuando el handler usa `HasResourcePermission`; `TA` es `HasTenantAccess`; `IA` es `IsAuthenticated`; `TAdmin` es `IsTenantAdmin`; `—` significa que el handler no declara ese control, no que sea público. Los contratos enlazados conservan el detalle de payload y respuesta; este manifest conserva la trazabilidad de operación.

### Universo contado

| Clase | Cálculo | Operaciones |
|---|---:|---:|
| Router CRUD | 19 `ModelViewSet` × 6 filas explícitas | 114 |
| Router solo lectura | 2 `ReadOnlyModelViewSet` × 2 filas explícitas | 4 |
| Acciones `@action` | 27 filas explícitas | 27 |
| Rutas explícitas de negocio | 16 OP; apariencia aporta `GET` y `PUT` | 16 |
| Ruta explícita de infraestructura | `GET /protected/` | 1 |
| **Total OP de negocio** | `114 + 4 + 27 + 16` | **161** |
| **Total OP declaradas** | `161 + 1` infraestructura | **162** |

Los 21 registros del router están en `apipoligono/urls.py:40-60`; las 17 OP de rutas explícitas, en `:66-95`. `OP-AUT-006` es infraestructura y no una operación de negocio. El transporte de API root, `HEAD`, `OPTIONS`, aliases de formato y barra final no se cuenta como OP.

---

## Manifest de operaciones

**Fuente común de router:** `apipoligono/urls.py:39-60`. Las clases, serializers y contratos de campos están enlazados en los contratos anidados. `TA` acompaña los ViewSets. Cada fila siguiente es una OP autónoma.

| OP-ID | Método + patrón | Handler | Control y alcance | Consumidor | Contrato |
|---|---|---|---|---|---|
| OP-USR-001 | `GET /usuarios/` | `UsuarioViewSet` (`views.py:182-228`) | `user:read → view_personnel_basic`; tenant+rama | SCREEN/usuarios | [identidad](contracts/organization-identity.md#usuarios-y-asignaciones) |
| OP-USR-002 | `POST /usuarios/` | `UsuarioViewSet` | `user:create → create_users`; tenant+rama | SCREEN/usuarios | idem |
| OP-USR-003 | `GET /usuarios/{id}/` | `UsuarioViewSet` | `user:read → view_personnel_basic`; tenant+rama | SCREEN/usuarios | idem |
| OP-USR-004 | `PUT /usuarios/{id}/` | `UsuarioViewSet` | `user:update → update_users`; tenant+rama | SCREEN/usuarios | idem |
| OP-USR-005 | `PATCH /usuarios/{id}/` | `UsuarioViewSet` | `user:update → update_users`; tenant+rama | SCREEN/usuarios | idem |
| OP-USR-006 | `DELETE /usuarios/{id}/` | `UsuarioViewSet` | `user:delete → disable_users`; tenant+rama | SCREEN/usuarios | idem |
| OP-WPN-001 | `GET /armas/` | `ArmaViewSet` (`views.py:730-734`) | `weapon:read → warehouse`; tenant+unidad | SCREEN/armas | [tiro](contracts/domain-shooting.md#armas-y-calibres) |
| OP-WPN-002 | `POST /armas/` | `ArmaViewSet` | `weapon:create → warehouse`; tenant+unidad | SCREEN/armas | idem |
| OP-WPN-003 | `GET /armas/{id}/` | `ArmaViewSet` | `weapon:read → warehouse`; tenant+unidad | SCREEN/armas | idem |
| OP-WPN-004 | `PUT /armas/{id}/` | `ArmaViewSet` | `weapon:update → warehouse`; tenant+unidad | SCREEN/armas | idem |
| OP-WPN-005 | `PATCH /armas/{id}/` | `ArmaViewSet` | `weapon:update → warehouse`; tenant+unidad | SCREEN/armas | idem |
| OP-WPN-006 | `DELETE /armas/{id}/` | `ArmaViewSet` | `weapon:delete → warehouse`; tenant+unidad | SCREEN/armas | idem |
| OP-RNG-001 | `GET /poligonos/` | `PoligonoTiroViewSet` (`views.py:736-750`) | `range:read → view_unit`; tenant+unidad | SCREEN/poligonos | [tiro](contracts/domain-shooting.md#polígonos-y-lecciones) |
| OP-RNG-002 | `POST /poligonos/` | `PoligonoTiroViewSet` | `range:create → create_shooting_lessons`; tenant+unidad | SCREEN/poligonos | idem |
| OP-RNG-003 | `GET /poligonos/{id}/` | `PoligonoTiroViewSet` | `range:read → view_unit`; tenant+unidad | SCREEN/poligonos | idem |
| OP-RNG-004 | `PUT /poligonos/{id}/` | `PoligonoTiroViewSet` | `range:update → update_shooting_lessons`; tenant+unidad | SCREEN/poligonos | idem |
| OP-RNG-005 | `PATCH /poligonos/{id}/` | `PoligonoTiroViewSet` | `range:update → update_shooting_lessons`; tenant+unidad | SCREEN/poligonos | idem |
| OP-RNG-006 | `DELETE /poligonos/{id}/` | `PoligonoTiroViewSet` | no hay mapa `range:delete`; tenant+unidad | SCREEN/poligonos | idem |
| OP-LES-001 | `GET /lecciones/` | `LeccionTiroViewSet` (`views.py:752-805`) | `shooting_session:read`; tenant+unidad/M2M | SCREEN/lecciones | [tiro](contracts/domain-shooting.md#polígonos-y-lecciones) |
| OP-LES-002 | `POST /lecciones/` | `LeccionTiroViewSet` | `shooting_session:create`; tenant+unidad/M2M | SCREEN/lecciones | idem |
| OP-LES-003 | `GET /lecciones/{id}/` | `LeccionTiroViewSet` | `shooting_session:read`; tenant+unidad/M2M | SCREEN/lecciones | idem |
| OP-LES-004 | `PUT /lecciones/{id}/` | `LeccionTiroViewSet` | `shooting_session:update`; tenant+unidad/M2M | SCREEN/lecciones | idem |
| OP-LES-005 | `PATCH /lecciones/{id}/` | `LeccionTiroViewSet` | `shooting_session:update`; tenant+unidad/M2M | SCREEN/lecciones | idem |
| OP-LES-006 | `DELETE /lecciones/{id}/` | `LeccionTiroViewSet` | `shooting_session:delete`; tenant+unidad/M2M | SCREEN/lecciones | idem |
| OP-FRC-001 | `GET /fracciones/` | `FraccionTiroViewSet` (`views.py:1173-1181`) | `shooting_fraction:read`; tenant+unidad | FL/captura-tiro | [tiro](contracts/domain-shooting.md#fracciones-y-resultados) |
| OP-FRC-002 | `POST /fracciones/` | `FraccionTiroViewSet` | `shooting_fraction:create`; tenant+unidad | FL/captura-tiro | idem |
| OP-FRC-003 | `GET /fracciones/{id}/` | `FraccionTiroViewSet` | `shooting_fraction:read`; tenant+unidad | FL/captura-tiro | idem |
| OP-FRC-004 | `PUT /fracciones/{id}/` | `FraccionTiroViewSet` | `shooting_fraction:update`; tenant+unidad | FL/captura-tiro | idem |
| OP-FRC-005 | `PATCH /fracciones/{id}/` | `FraccionTiroViewSet` | `shooting_fraction:update`; tenant+unidad | FL/captura-tiro | idem |
| OP-FRC-006 | `DELETE /fracciones/{id}/` | `FraccionTiroViewSet` | `shooting_fraction:delete`; tenant+unidad | FL/captura-tiro | idem |
| OP-RES-001 | `GET /resultados/` | `ResultadoTiroViewSet` (`views.py:1244-1278`) | `shooting_result:read`; tirador propio o unidad/M2M | FL/captura-tiro | [tiro](contracts/domain-shooting.md#fracciones-y-resultados) |
| OP-RES-002 | `POST /resultados/` | `ResultadoTiroViewSet` | `shooting_result:create`; tirador propio o unidad/M2M | FL/captura-tiro | idem |
| OP-RES-003 | `GET /resultados/{id}/` | `ResultadoTiroViewSet` | `shooting_result:read`; tirador propio o unidad/M2M | FL/captura-tiro | idem |
| OP-RES-004 | `PUT /resultados/{id}/` | `ResultadoTiroViewSet` | `shooting_result:update`; tirador propio o unidad/M2M | FL/captura-tiro | idem |
| OP-RES-005 | `PATCH /resultados/{id}/` | `ResultadoTiroViewSet` | `shooting_result:update`; tirador propio o unidad/M2M | FL/captura-tiro | idem |
| OP-RES-006 | `DELETE /resultados/{id}/` | `ResultadoTiroViewSet` | `shooting_result:delete`; tirador propio o unidad/M2M | FL/captura-tiro | idem |
| OP-ROL-001 | `GET /authz/roles/` | `RoleViewSet` (`views.py:1765-1775`) | IA+TA; lectura | SCREEN/authz-roles | [RBAC](contracts/authorization.md#roles-scopes-y-permisos) |
| OP-ROL-002 | `POST /authz/roles/` | `RoleViewSet` | IA+TA+TAdmin; mutación | SCREEN/authz-roles | idem |
| OP-ROL-003 | `GET /authz/roles/{id}/` | `RoleViewSet` | IA+TA; lectura | SCREEN/authz-roles | idem |
| OP-ROL-004 | `PUT /authz/roles/{id}/` | `RoleViewSet` | IA+TA+TAdmin; mutación | SCREEN/authz-roles | idem |
| OP-ROL-005 | `PATCH /authz/roles/{id}/` | `RoleViewSet` | IA+TA+TAdmin; mutación | SCREEN/authz-roles | idem |
| OP-ROL-006 | `DELETE /authz/roles/{id}/` | `RoleViewSet` | IA+TA+TAdmin; mutación | SCREEN/authz-roles | idem |
| OP-SCP-001 | `GET /authz/scopes/` | `ScopePolicyViewSet` (`views.py:1778-1783`) | IA+TA; solo lectura | SCREEN/authz-roles | [RBAC](contracts/authorization.md#roles-scopes-y-permisos) |
| OP-SCP-002 | `GET /authz/scopes/{id}/` | `ScopePolicyViewSet` | IA+TA; solo lectura | SCREEN/authz-roles | idem |
| OP-OVR-001 | `GET /authz/overrides/` | `UserPermissionOverrideViewSet` (`views.py:1788-1815`) | IA+TA+TAdmin; tenant de account | SCREEN/authz-overrides | [RBAC](contracts/authorization.md#overrides-y-evaluación) |
| OP-OVR-002 | `POST /authz/overrides/` | `UserPermissionOverrideViewSet` | IA+TA+TAdmin; tenant de account | SCREEN/authz-overrides | idem |
| OP-OVR-003 | `GET /authz/overrides/{id}/` | `UserPermissionOverrideViewSet` | IA+TA+TAdmin; tenant de account | SCREEN/authz-overrides | idem |
| OP-OVR-004 | `PUT /authz/overrides/{id}/` | `UserPermissionOverrideViewSet` | IA+TA+TAdmin; tenant de account | SCREEN/authz-overrides | idem |
| OP-OVR-005 | `PATCH /authz/overrides/{id}/` | `UserPermissionOverrideViewSet` | IA+TA+TAdmin; tenant de account | SCREEN/authz-overrides | idem |
| OP-OVR-006 | `DELETE /authz/overrides/{id}/` | `UserPermissionOverrideViewSet` | IA+TA+TAdmin; tenant de account | SCREEN/authz-overrides | idem |
| OP-UNT-001 | `GET /organization-units/` | `OrganizationUnitViewSet` (`apps/organizations/views.py:29-66`) | `organization_unit:read`; tenant+rama | SCREEN/unidades | [organización](contracts/organization-identity.md#unidades-recintos-y-migración) |
| OP-UNT-002 | `POST /organization-units/` | `OrganizationUnitViewSet` | `organization_unit:create`; tenant+rama | SCREEN/unidades | idem |
| OP-UNT-003 | `GET /organization-units/{id}/` | `OrganizationUnitViewSet` | `organization_unit:read`; tenant+rama | SCREEN/unidades | idem |
| OP-UNT-004 | `PUT /organization-units/{id}/` | `OrganizationUnitViewSet` | `organization_unit:update`; tenant+rama | SCREEN/unidades | idem |
| OP-UNT-005 | `PATCH /organization-units/{id}/` | `OrganizationUnitViewSet` | `organization_unit:update`; tenant+rama | SCREEN/unidades | idem |
| OP-UNT-006 | `DELETE /organization-units/{id}/` | `OrganizationUnitViewSet` | `organization_unit:delete`; tenant+rama | SCREEN/unidades | idem |
| OP-RCT-001 | `GET /recintos/` | `RecintoViewSet` (`apps/organizations/views.py:194-215`) | `recinto:read`; tenant | SCREEN/recintos | [organización](contracts/organization-identity.md#unidades-recintos-y-migración) |
| OP-RCT-002 | `POST /recintos/` | `RecintoViewSet` | `recinto:create`; tenant | SCREEN/recintos | idem |
| OP-RCT-003 | `GET /recintos/{id}/` | `RecintoViewSet` | `recinto:read`; tenant | SCREEN/recintos | idem |
| OP-RCT-004 | `PUT /recintos/{id}/` | `RecintoViewSet` | `recinto:update`; tenant | SCREEN/recintos | idem |
| OP-RCT-005 | `PATCH /recintos/{id}/` | `RecintoViewSet` | `recinto:update`; tenant | SCREEN/recintos | idem |
| OP-RCT-006 | `DELETE /recintos/{id}/` | `RecintoViewSet` | `recinto:delete`; tenant | SCREEN/recintos | idem |
| OP-ARM-001 | `GET /armorias/` | `ArmoryViewSet` (`apps/armory/views.py:10-16`) | `armory:read`; tenant+unidad | SCREEN/armorias | [organización](contracts/organization-identity.md#armorias) |
| OP-ARM-002 | `POST /armorias/` | `ArmoryViewSet` | `armory:create`; tenant+unidad | SCREEN/armorias | idem |
| OP-ARM-003 | `GET /armorias/{id}/` | `ArmoryViewSet` | `armory:read`; tenant+unidad | SCREEN/armorias | idem |
| OP-ARM-004 | `PUT /armorias/{id}/` | `ArmoryViewSet` | `armory:update`; tenant+unidad | SCREEN/armorias | idem |
| OP-ARM-005 | `PATCH /armorias/{id}/` | `ArmoryViewSet` | `armory:update`; tenant+unidad | SCREEN/armorias | idem |
| OP-ARM-006 | `DELETE /armorias/{id}/` | `ArmoryViewSet` | `armory:delete`; tenant+unidad | SCREEN/armorias | idem |
| OP-POS-001 | `GET /posiciones/` | `PositionViewSet` (`apps/identity/views.py:18-35`) | `position:read`; tenant+unidad | SCREEN/posiciones | [identidad](contracts/organization-identity.md#puestos-holders-y-memberships) |
| OP-POS-002 | `POST /posiciones/` | `PositionViewSet` | `position:create`; tenant+unidad | SCREEN/posiciones | idem |
| OP-POS-003 | `GET /posiciones/{id}/` | `PositionViewSet` | `position:read`; tenant+unidad | SCREEN/posiciones | idem |
| OP-POS-004 | `PUT /posiciones/{id}/` | `PositionViewSet` | `position:update`; tenant+unidad | SCREEN/posiciones | idem |
| OP-POS-005 | `PATCH /posiciones/{id}/` | `PositionViewSet` | `position:update`; tenant+unidad | SCREEN/posiciones | idem |
| OP-POS-006 | `DELETE /posiciones/{id}/` | `PositionViewSet` | `position:delete`; tenant+unidad | SCREEN/posiciones | idem |
| OP-MEM-001 | `GET /memberships/` | `UnitMembershipViewSet` (`apps/identity/views.py:124-150`) | `resource_name='position'`; tenant+unidad | SCREEN/memberships | [identidad](contracts/organization-identity.md#puestos-holders-y-memberships) |
| OP-MEM-002 | `POST /memberships/` | `UnitMembershipViewSet` | `resource_name='position'`; tenant+unidad | SCREEN/memberships | idem |
| OP-MEM-003 | `GET /memberships/{id}/` | `UnitMembershipViewSet` | `resource_name='position'`; tenant+unidad | SCREEN/memberships | idem |
| OP-MEM-004 | `PUT /memberships/{id}/` | `UnitMembershipViewSet` | `resource_name='position'`; tenant+unidad | SCREEN/memberships | idem |
| OP-MEM-005 | `PATCH /memberships/{id}/` | `UnitMembershipViewSet` | `resource_name='position'`; tenant+unidad | SCREEN/memberships | idem |
| OP-MEM-006 | `DELETE /memberships/{id}/` | `UnitMembershipViewSet` | `resource_name='position'`; tenant+unidad | SCREEN/memberships | idem |
| OP-CAL-001 | `GET /calibres/` | `CalibreViewSet` (`views.py:1280-1320`) | `calibre:read → view_exercises`; catálogo global | SCREEN/calibres | [tiro](contracts/domain-shooting.md#armas-y-calibres) |
| OP-CAL-002 | `POST /calibres/` | `CalibreViewSet` | `calibre:manage → manage_calibre` + `super_admin`; catálogo global | SCREEN/calibres | idem |
| OP-CAL-003 | `GET /calibres/{id}/` | `CalibreViewSet` | `calibre:read → view_exercises`; catálogo global | SCREEN/calibres | idem |
| OP-CAL-004 | `PUT /calibres/{id}/` | `CalibreViewSet` | `calibre:manage → manage_calibre` + `super_admin`; catálogo global | SCREEN/calibres | idem |
| OP-CAL-005 | `PATCH /calibres/{id}/` | `CalibreViewSet` | `calibre:manage → manage_calibre` + `super_admin`; catálogo global | SCREEN/calibres | idem |
| OP-CAL-006 | `DELETE /calibres/{id}/` | `CalibreViewSet` | `calibre:manage → manage_calibre` + `super_admin`; catálogo global | SCREEN/calibres | idem |
| OP-EJR-001 | `GET /ejercicios/` | `EjercicioMilitarViewSet` (`views.py:1323-1338`) | `ejercicio_militar:read`; tenant+unidad | SCREEN/ejercicios | [ejercicios](contracts/exercises-preferences.md#ejercicios-y-consumos) |
| OP-EJR-002 | `POST /ejercicios/` | `EjercicioMilitarViewSet` | `ejercicio_militar:create`; tenant+unidad | SCREEN/ejercicios | idem |
| OP-EJR-003 | `GET /ejercicios/{id}/` | `EjercicioMilitarViewSet` | `ejercicio_militar:read`; tenant+unidad | SCREEN/ejercicios | idem |
| OP-EJR-004 | `PUT /ejercicios/{id}/` | `EjercicioMilitarViewSet` | `ejercicio_militar:update`; tenant+unidad | SCREEN/ejercicios | idem |
| OP-EJR-005 | `PATCH /ejercicios/{id}/` | `EjercicioMilitarViewSet` | `ejercicio_militar:update`; tenant+unidad | SCREEN/ejercicios | idem |
| OP-EJR-006 | `DELETE /ejercicios/{id}/` | `EjercicioMilitarViewSet` | `ejercicio_militar:delete`; tenant+unidad | SCREEN/ejercicios | idem |
| OP-CMN-001 | `GET /consumos-municion/` | `ConsumoMunicionViewSet` (`views.py:1341-1355`) | `consumo_municion:read`; solo tenant | FL/consumo-munición | [ejercicios](contracts/exercises-preferences.md#ejercicios-y-consumos) |
| OP-CMN-002 | `POST /consumos-municion/` | `ConsumoMunicionViewSet` | `consumo_municion:create`; solo tenant | FL/consumo-munición | idem |
| OP-CMN-003 | `GET /consumos-municion/{id}/` | `ConsumoMunicionViewSet` | `consumo_municion:read`; solo tenant | FL/consumo-munición | idem |
| OP-CMN-004 | `PUT /consumos-municion/{id}/` | `ConsumoMunicionViewSet` | `consumo_municion:update`; solo tenant | FL/consumo-munición | idem |
| OP-CMN-005 | `PATCH /consumos-municion/{id}/` | `ConsumoMunicionViewSet` | `consumo_municion:update`; solo tenant | FL/consumo-munición | idem |
| OP-CMN-006 | `DELETE /consumos-municion/{id}/` | `ConsumoMunicionViewSet` | `consumo_municion:delete`; solo tenant | FL/consumo-munición | idem |
| OP-CAR-001 | `GET /consumos-arma/` | `ConsumoArmaViewSet` (`views.py:1357-1370`) | `consumo_arma:read`; solo tenant | FL/consumo-munición | [ejercicios](contracts/exercises-preferences.md#ejercicios-y-consumos) |
| OP-CAR-002 | `POST /consumos-arma/` | `ConsumoArmaViewSet` | `consumo_arma:create`; solo tenant | FL/consumo-munición | idem |
| OP-CAR-003 | `GET /consumos-arma/{id}/` | `ConsumoArmaViewSet` | `consumo_arma:read`; solo tenant | FL/consumo-munición | idem |
| OP-CAR-004 | `PUT /consumos-arma/{id}/` | `ConsumoArmaViewSet` | `consumo_arma:update`; solo tenant | FL/consumo-munición | idem |
| OP-CAR-005 | `PATCH /consumos-arma/{id}/` | `ConsumoArmaViewSet` | `consumo_arma:update`; solo tenant | FL/consumo-munición | idem |
| OP-CAR-006 | `DELETE /consumos-arma/{id}/` | `ConsumoArmaViewSet` | `consumo_arma:delete`; solo tenant | FL/consumo-munición | idem |
| OP-PRM-001 | `GET /authz/permissions/` | `PermissionViewSet` (`apps/authorization/views.py:24-31`) | IA+TA; permisos activos | SCREEN/authz-permisos | [RBAC](contracts/authorization.md#roles-scopes-y-permisos) |
| OP-PRM-002 | `GET /authz/permissions/{id}/` | `PermissionViewSet` | IA+TA; permisos activos | SCREEN/authz-permisos | idem |
| OP-RPR-001 | `GET /authz/role-permissions/` | `RolePermissionViewSet` (`apps/authorization/views.py:34-70`) | IA+TA+TAdmin | SCREEN/authz-permisos | [RBAC](contracts/authorization.md#roles-scopes-y-permisos) |
| OP-RPR-002 | `POST /authz/role-permissions/` | `RolePermissionViewSet` | IA+TA+TAdmin | SCREEN/authz-permisos | idem |
| OP-RPR-003 | `GET /authz/role-permissions/{id}/` | `RolePermissionViewSet` | IA+TA+TAdmin | SCREEN/authz-permisos | idem |
| OP-RPR-004 | `PUT /authz/role-permissions/{id}/` | `RolePermissionViewSet` | IA+TA+TAdmin | SCREEN/authz-permisos | idem |
| OP-RPR-005 | `PATCH /authz/role-permissions/{id}/` | `RolePermissionViewSet` | IA+TA+TAdmin | SCREEN/authz-permisos | idem |
| OP-RPR-006 | `DELETE /authz/role-permissions/{id}/` | `RolePermissionViewSet` | IA+TA+TAdmin | SCREEN/authz-permisos | idem |
| OP-PPR-001 | `GET /authz/position-permissions/` | `PositionPermissionViewSet` (`apps/authorization/views.py:73-86`) | IA+TA+TAdmin | SCREEN/authz-permisos | [RBAC](contracts/authorization.md#roles-scopes-y-permisos) |
| OP-PPR-002 | `POST /authz/position-permissions/` | `PositionPermissionViewSet` | IA+TA+TAdmin | SCREEN/authz-permisos | idem |
| OP-PPR-003 | `GET /authz/position-permissions/{id}/` | `PositionPermissionViewSet` | IA+TA+TAdmin | SCREEN/authz-permisos | idem |
| OP-PPR-004 | `PUT /authz/position-permissions/{id}/` | `PositionPermissionViewSet` | IA+TA+TAdmin | SCREEN/authz-permisos | idem |
| OP-PPR-005 | `PATCH /authz/position-permissions/{id}/` | `PositionPermissionViewSet` | IA+TA+TAdmin | SCREEN/authz-permisos | idem |
| OP-PPR-006 | `DELETE /authz/position-permissions/{id}/` | `PositionPermissionViewSet` | IA+TA+TAdmin | SCREEN/authz-permisos | idem |

### Acciones de router: una fila por método y patrón

| OP-ID | Método + patrón | Handler / permiso / alcance | Consumidor | Contrato |
|---|---|---|---|---|
| OP-USR-007 | `PUT /usuarios/{id}/asignacion-principal/` | `asignacion_principal` (`views.py:327-401`); `user:update` | FL/asignación-principal | [identidad](contracts/organization-identity.md#usuarios-y-asignaciones) |
| OP-USR-008 | `PATCH /usuarios/{id}/asignacion-principal/` | `asignacion_principal` (`views.py:327-401`); `user:update`; tenant+rama | FL/asignación-principal | idem |
| OP-USR-009 | `POST /usuarios/{id}/desactivar-asignacion-principal/` | `views.py:403-430`; `user:update` | FL/asignaciones | idem |
| OP-USR-010 | `POST /usuarios/{id}/agregar-asignacion/` | `views.py:432-501`; `user:update` | FL/asignaciones | idem |
| OP-USR-011 | `POST /usuarios/{id}/quitar-asignacion/{assignment_id}/` | `views.py:503-530`; `user:update` | FL/asignaciones | idem |
| OP-USR-012 | `POST /usuarios/crear-temporal/` | `views.py:538-604`; `user:create` | FL/captura-tiro | idem |
| OP-USR-013 | `POST /usuarios/{id}/cambiar-contrasena/` | `views.py:616-651`; propio: IA+TA; otro: `user:update` | FL/contraseña | [auth](contracts/auth-context.md#sesión-y-recuperación) |
| OP-USR-014 | `POST /usuarios/{id}/resetear-contrasena/` | `views.py:653-674`; `user:update` | FL/contraseña | idem |
| OP-USR-015 | `GET /usuarios/{id}/estado-bloqueo/` | `views.py:676-695`; `user:read` | SCREEN/usuarios | idem |
| OP-USR-016 | `POST /usuarios/{id}/desbloquear/` | `views.py:697-727`; `user:update` | SCREEN/usuarios | idem |
| OP-RNG-007 | `GET /poligonos/{id}/lecciones/` | `views.py:745-750`; `range:read` | SCREEN/poligonos | [tiro](contracts/domain-shooting.md#polígonos-y-lecciones) |
| OP-LES-007 | `GET /lecciones/{id}/fracciones/` | `views.py:807-812`; `shooting_session:read` | SCREEN/lección | [tiro](contracts/domain-shooting.md#lecturas-de-lección) |
| OP-LES-008 | `GET /lecciones/{id}/usuarios/` | `:814-830`; `shooting_session:read` | SCREEN/lección | idem |
| OP-LES-009 | `GET /lecciones/{id}/resultados/` | `:832-890`; `shooting_session:read` + `can_read_detail` | SCREEN/lección | idem |
| OP-LES-010 | `GET /lecciones/{id}/resultados-resumen/` | `:892-905`; `shooting_session:read_summary` | SCREEN/lección | idem |
| OP-LES-011 | `GET /lecciones/{id}/reporte/` | `:907-1139`; `shooting_session:read` | SCREEN/lección | idem |
| OP-LES-012 | `GET /lecciones/{id}/tiradores-elegibles/` | `:1141-1169`; `shooting_session:read` | FL/captura-tiro | idem |
| OP-FRC-007 | `GET /fracciones/{id}/tiradores/` | `views.py:1183-1197`; `shooting_fraction:read` | FL/captura-tiro | [tiro](contracts/domain-shooting.md#fracciones-y-resultados) |
| OP-FRC-008 | `GET /fracciones/{id}/resultados/` | `views.py:1199-1242`; `shooting_fraction:read` + detalle | FL/captura-tiro | idem |
| OP-UNT-007 | `GET /organization-units/{id}/previsualizar-eliminacion/` | `apps/organizations/views.py:85-99`; `organization_unit:delete` | FL/eliminar-unidad | [organización](contracts/organization-identity.md#unidades-recintos-y-migración) |
| OP-UNT-008 | `POST /organization-units/{id}/eliminar-con-migracion/` | `:101-175`; `organization_unit:delete` | FL/eliminar-unidad | idem |
| OP-UNT-009 | `GET /organization-units/lookup/` | `:177-191`; `organization_unit:read`; todo tenant activo | FL/selectores | idem |
| OP-RCT-007 | `POST /recintos/{id}/agregar-unidad/{unit_code}/` | `:217-238`; `recinto:update` | FL/recinto-unidades | idem |
| OP-RCT-008 | `DELETE /recintos/{id}/quitar-unidad/{unit_code}/` | `:240-254`; `recinto:update` | FL/recinto-unidades | idem |
| OP-POS-007 | `POST /posiciones/{id}/asignar-holder/` | `apps/identity/views.py:37-93`; `position:update` | FL/holders | [identidad](contracts/organization-identity.md#puestos-holders-y-memberships) |
| OP-POS-008 | `POST /posiciones/{id}/quitar-holder/{assignment_id}/` | `:95-110`; `position:update` | FL/holders | idem |
| OP-POS-009 | `GET /posiciones/{id}/historico/` | `:112-121`; `position:read` | SCREEN/posiciones | idem |

### Rutas explícitas

| OP-ID | Método + patrón | Handler / control / alcance | Consumidor | Contrato |
|---|---|---|---|---|
| OP-AUT-001 | `POST /auth/login/` | `SessionLoginView` (`apipoligono/views.py:1380-1401`); IA no aplica | SCREEN/login | [auth](contracts/auth-context.md#sesión-y-recuperación) |
| OP-AUT-002 | `GET /auth/context/` | `AuthContextView` (`:1412-1474`); IA+TA | FL/bootstrap | [auth](contracts/auth-context.md#contexto-y-cabeceras) |
| OP-AUT-003 | `POST /auth/select-unit/` | `SelectActiveUnitView` (`:1477-1539`); IA+TA | FL/contexto-unidad | idem |
| OP-AUT-004 | `GET /auth/audit-log/` | `AuditLogView` (`:1731-1762`); IA+TA+rol | SCREEN/auditoría | [auth](contracts/auth-context.md#auditoría) |
| OP-AUT-005 | `POST /logout/` | `LogoutView` (`:1404-1409`); IA | FL/sesión | [auth](contracts/auth-context.md#sesión-y-recuperación) |
| OP-AUT-006 | `GET /protected/` | `ProtectedView` (`:1373-1377`); IA+TA; **infraestructura, no negocio** | infraestructura; sin pantalla | [auth](contracts/auth-context.md#contexto-y-cabeceras) |
| OP-RCV-001 | `POST /recuperar/` | `iniciar_recuperacion` (`utils/recuperacion_utilidades.py:45-57`); sin sesión | FL/recuperación | [auth](contracts/auth-context.md#sesión-y-recuperación) |
| OP-RCV-002 | `POST /recuperar/crear/` | `crea_codigo` (`:62-77`); sin sesión | FL/recuperación | idem |
| OP-RCV-003 | `POST /recuperar/comprobar/` | `comprobar_codigo` (`:81-100`); sin sesión | FL/recuperación | idem |
| OP-RCV-004 | `POST /recuperar/cambiar/` | `cambiar_contrasena` (`:103-138`); sin sesión | FL/recuperación | idem |
| OP-PRF-001 | `GET /me/preferences/appearance/` | `UserPreferencesView` (`views.py:1901-1910`); IA | SCREEN/apariencia | [apariencia](contracts/exercises-preferences.md#preferencias-de-apariencia-legacy) |
| OP-PRF-002 | `PUT /me/preferences/appearance/` | `UserPreferencesView` (`views.py:1912-1940`); IA | SCREEN/apariencia | idem |
| OP-UNT-010 | `GET /me/assignable-units/` | `AssignableUnitsView` (`apps/organizations/views.py:257-292`); IA+TA | FL/selectores | [organización](contracts/organization-identity.md#unidades-recintos-y-migración) |
| OP-AZC-001 | `GET /authz/catalog/` | `AuthzCatalogView` (`apipoligono/views.py:1853-1898`); IA+TA | SCREEN/authz-permisos | [RBAC](contracts/authorization.md#catálogos-y-consultas-operativas) |
| OP-AZC-002 | `GET /authz/role-categories/` | `RoleCategoriesView` (`:1571-1595`); IA+TA | FL/asignaciones | idem |
| OP-AZC-003 | `GET /authz/personas-por-unidad/` | `PersonasPorUnidadView` (`:1598-1680`); IA+TA | SCREEN/authz-personas | idem |
| OP-AZC-004 | `GET /authz/eligible-target-units/` | `EligibleTargetUnitsView` (`:1683-1728`); IA+TA | FL/asignaciones | idem |

---

## Capacidades sin endpoint y transporte

| Elemento | Clasificación justificada | Fuente |
|---|---|---|
| `Tenant`, `Person`, `Account`, `Assignment`, `AccessAudit`, `CodigoRecuperacion` | Modelos/capacidades internas; no existe ViewSet o ruta CRUD pública localizada. `Assignment` se materializa mediante acciones de usuarios y holders. | `apps/*/models.py`; `apipoligono/models.py:262-271`; `apps/identity/views.py:37-121` |
| `export` y `read_own` | Entradas del catálogo/mapeo de autorización, no endpoint separado localizado. | `apps/authorization/permissions.py:40,68,72`; `apipoligono/views.py:1818-1835` |
| `GET /api/` (API root), `HEAD`, `OPTIONS`, sufijos `.{format}` | Infraestructura `DefaultRouter`/negociación; no son OP de negocio ni requieren pantalla, pero no se ocultan. | `apipoligono/urls.py:39,65` |

## Límites comprobados

- No hay `filter_backends`, `filterset_fields`, `search_fields`, `ordering_fields` ni `pagination_class` declarados en los ViewSets revisados. El comportamiento global no fue leído: filtros, paginación y ordenamiento globales quedan **no comprobados**.
- `range:delete` no existe en `RESOURCE_ACTION_TO_PERMISSION`; por inferencia estática, `DELETE /poligonos/{id}/` llega a `HasResourcePermission` sin `permission_code` y puede recibir `403`. No es una prueba runtime ni una corrección propuesta (`apps/authorization/permissions.py:54-57,279-281`).
- La apariencia existente expone sólo tres campos legacy; no existe endpoint de ocho ejes. El requisito futuro no se registra como operación presente (`front/AGENTS.md:35-55`).
