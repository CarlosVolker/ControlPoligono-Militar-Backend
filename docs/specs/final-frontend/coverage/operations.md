---
spec_meta: "../../spec-meta.yaml"
---

# Matriz maestra de operaciones — 162 filas individuales

> 📜 Yo conservo aquí la fila por OP: método + ruta individuales del manifest de [backend-inventory.md](../backend-inventory.md), sin rangos CRUD como sustituto. Columnas: requisitos específicos citados (la herencia transversal `R-SES-001…018` + contrato `F-*`/`ST-*` aplica a toda fila y no se repite), SCREEN canónico o integración resuelta (nunca aliases `SCREEN/*` ni `FL/*` como destino final), FL **desarrollados** en [experience/flows/](../experience/flows/) que la consumen como OP principal, puntero de tarea y de criterio por convención (§Convenciones en [coverage.md](../coverage.md)), y clasificación/reserva. `—` en FL significa ausencia verificada, no olvido: ver [coverage.md](../coverage.md) §Observaciones. Las OP marcadas «familia» no tienen un requisito anidado que las cite individualmente; se cubren por el preámbulo de familia del volumen citado (fuente puntual, no invención).

## Usuarios y credenciales — OP-USR (16)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-USR-001 | `GET /usuarios/` | R-DOM-ID-001 | SCREEN-USERS | FL-IDT-001 | T-FL-IDT-001 | AC-OP-USR-001 | — |
| OP-USR-002 | `POST /usuarios/` | R-DOM-ID-002, R-DOM-ID-003 | SCREEN-USERS | FL-IDT-002, FL-IDT-003 | T-FL-IDT-002, T-FL-IDT-003 | AC-OP-USR-002 | — |
| OP-USR-003 | `GET /usuarios/{id}/` | R-DOM-ID-001 | SCREEN-USER-DETAIL | FL-IDT-001 | T-FL-IDT-001 | AC-OP-USR-003 | — |
| OP-USR-004 | `PUT /usuarios/{id}/` | R-DOM-ID-002 | SCREEN-USER-DETAIL (editor compartido con 005) | FL-IDT-005 | T-FL-IDT-005 | AC-OP-USR-004 | — |
| OP-USR-005 | `PATCH /usuarios/{id}/` | R-DOM-ID-002 | SCREEN-USER-DETAIL (editor compartido con 004) | FL-IDT-005 | T-FL-IDT-005 | AC-OP-USR-005 | — |
| OP-USR-006 | `DELETE /usuarios/{id}/` | R-DOM-ID-012 | SCREEN-USER-DETAIL | FL-IDT-006 | T-FL-IDT-006 | AC-OP-USR-006 | Efecto real `disable_users`: no asumir borrado físico |
| OP-USR-007 | `PUT /usuarios/{id}/asignacion-principal/` | R-DOM-ID-005 | SCREEN-USER-DETAIL — modal asignación principal | FL-IDT-007 | T-FL-IDT-007 | AC-OP-USR-007 | — |
| OP-USR-008 | `PATCH /usuarios/{id}/asignacion-principal/` | R-DOM-ID-005 | SCREEN-USER-DETAIL — modal asignación principal | FL-IDT-007 | T-FL-IDT-007 | AC-OP-USR-008 | — |
| OP-USR-009 | `POST /usuarios/{id}/desactivar-asignacion-principal/` | R-DOM-ID-006 | SCREEN-USER-DETAIL — panel asignaciones | FL-IDT-008 | T-FL-IDT-008 | AC-OP-USR-009 | — |
| OP-USR-010 | `POST /usuarios/{id}/agregar-asignacion/` | R-DOM-ID-007 | SCREEN-USER-DETAIL — panel asignaciones | FL-IDT-009 | T-FL-IDT-009 | AC-OP-USR-010 | — |
| OP-USR-011 | `POST /usuarios/{id}/quitar-asignacion/{assignment_id}/` | R-DOM-ID-008 | SCREEN-USER-DETAIL — panel asignaciones | FL-IDT-010 | T-FL-IDT-010 | AC-OP-USR-011 | — |
| OP-USR-012 | `POST /usuarios/crear-temporal/` | R-DOM-ID-004 | SCREEN-USERS (alta temporal; integrada en captura: screens.md §Integraciones) | FL-IDT-004 | T-FL-IDT-004 | AC-OP-USR-012 | Rotular «no inicia sesión» |
| OP-USR-013 | `POST /usuarios/{id}/cambiar-contrasena/` | R-DOM-ID-009, R-SES-021 | SCREEN-PASSWORD-FORCED (propio forzado) + SCREEN-USER-DETAIL (otro) | FL-PWD-001, FL-PWD-002 | T-FL-PWD-001, T-FL-PWD-002 | AC-OP-USR-013 | — |
| OP-USR-014 | `POST /usuarios/{id}/resetear-contrasena/` | R-DOM-ID-010 | SCREEN-USER-DETAIL — panel credenciales | FL-PWD-003 | T-FL-PWD-003 | AC-OP-USR-014 | Afecta credenciales: ST-10 obligatoria |
| OP-USR-015 | `GET /usuarios/{id}/estado-bloqueo/` | R-DOM-ID-011 | SCREEN-USER-DETAIL — panel bloqueo | FL-PWD-004 | T-FL-PWD-004 | AC-OP-USR-015 | — |
| OP-USR-016 | `POST /usuarios/{id}/desbloquear/` | R-DOM-ID-011 | SCREEN-USER-DETAIL — panel bloqueo | FL-PWD-005 | T-FL-PWD-005 | AC-OP-USR-016 | Afecta acceso: ST-10 obligatoria |

## Armas — OP-WPN (6)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-WPN-001 | `GET /armas/` | R-DOM-ARM-005 | SCREEN-WEAPONS | FL-WPN-001 | T-FL-WPN-001 | AC-OP-WPN-001 | — |
| OP-WPN-002 | `POST /armas/` | R-DOM-ARM-006, R-DOM-ARM-008 | SCREEN-WEAPONS | FL-WPN-002 | T-FL-WPN-002 | AC-OP-WPN-002 | — |
| OP-WPN-003 | `GET /armas/{id}/` | R-DOM-ARM-005 | SCREEN-WEAPON-DETAIL | FL-WPN-001 | T-FL-WPN-001 | AC-OP-WPN-003 | — |
| OP-WPN-004 | `PUT /armas/{id}/` | R-DOM-ARM-007, R-DOM-ARM-008 | SCREEN-WEAPON-DETAIL (editor compartido con 005) | FL-WPN-003 | T-FL-WPN-003 | AC-OP-WPN-004 | — |
| OP-WPN-005 | `PATCH /armas/{id}/` | R-DOM-ARM-007, R-DOM-ARM-008 | SCREEN-WEAPON-DETAIL (editor compartido con 004) | FL-WPN-003 | T-FL-WPN-003 | AC-OP-WPN-005 | — |
| OP-WPN-006 | `DELETE /armas/{id}/` | R-DOM-ARM-009 | SCREEN-WEAPON-DETAIL | FL-WPN-004 | T-FL-WPN-004 | AC-OP-WPN-006 | Reserva D-02: transferencia de stock sin endpoint, no se simula (R-DOM-EXC-014) |

## Polígonos — OP-RNG (7)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-RNG-001 | `GET /poligonos/` | R-DOM-SHT-001 | SCREEN-RANGES | FL-SHT-001 | T-FL-SHT-001 | AC-OP-RNG-001 | — |
| OP-RNG-002 | `POST /poligonos/` | R-DOM-SHT-002 | SCREEN-RANGES | FL-SHT-002 | T-FL-SHT-002 | AC-OP-RNG-002 | — |
| OP-RNG-003 | `GET /poligonos/{id}/` | R-DOM-SHT-001 | SCREEN-RANGE-DETAIL | FL-SHT-001 | T-FL-SHT-001 | AC-OP-RNG-003 | — |
| OP-RNG-004 | `PUT /poligonos/{id}/` | R-DOM-SHT-002 | SCREEN-RANGE-DETAIL (editor compartido con 005) | FL-SHT-002 | T-FL-SHT-002 | AC-OP-RNG-004 | — |
| OP-RNG-005 | `PATCH /poligonos/{id}/` | R-DOM-SHT-002 | SCREEN-RANGE-DETAIL (editor compartido con 004) | FL-SHT-002 | T-FL-SHT-002 | AC-OP-RNG-005 | — |
| OP-RNG-006 | `DELETE /poligonos/{id}/` | R-DOM-SHT-003 | SCREEN-RANGE-DETAIL — no ofrecida como disponible | FL-SHT-003 | T-FL-SHT-003 | AC-OP-RNG-006 | **Operación restringida**: sin mapa `range:delete`; si deniega → ST-07 sin ocultar el registro |
| OP-RNG-007 | `GET /poligonos/{id}/lecciones/` | R-DOM-SHT-004 | SCREEN-RANGE-DETAIL — lecciones anidadas | FL-SHT-004 | T-FL-SHT-004 | AC-OP-RNG-007 | — |

## Lecciones — OP-LES (12)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-LES-001 | `GET /lecciones/` | R-DOM-SHT-005 | SCREEN-LESSONS | — (ningún FL la desarrolla como principal; reportado) | — | AC-OP-LES-001 | Tirador puro: rotular alcance restringido (states.md) |
| OP-LES-002 | `POST /lecciones/` | R-DOM-SHT-006, R-DOM-SHT-007 | SCREEN-LESSONS | FL-SHT-005 | T-FL-SHT-005 | AC-OP-LES-002 | — |
| OP-LES-003 | `GET /lecciones/{id}/` | R-DOM-SHT-005 | SCREEN-LESSON-DETAIL | — (ningún FL la desarrolla como principal; reportado) | — | AC-OP-LES-003 | — |
| OP-LES-004 | `PUT /lecciones/{id}/` | R-DOM-SHT-006 | SCREEN-LESSON-DETAIL (editor compartido con 005) | FL-SHT-006 | T-FL-SHT-006 | AC-OP-LES-004 | — |
| OP-LES-005 | `PATCH /lecciones/{id}/` | R-DOM-SHT-006 | SCREEN-LESSON-DETAIL (editor compartido con 004) | FL-SHT-006 | T-FL-SHT-006 | AC-OP-LES-005 | — |
| OP-LES-006 | `DELETE /lecciones/{id}/` | R-DOM-SHT-008 | SCREEN-LESSON-DETAIL | FL-SHT-007 | T-FL-SHT-007 | AC-OP-LES-006 | — |
| OP-LES-007 | `GET /lecciones/{id}/fracciones/` | R-DOM-SHT-009 | SCREEN-LESSON-DETAIL — pestaña fracciones | FL-SHT-008 | T-FL-SHT-008 | AC-OP-LES-007 | — |
| OP-LES-008 | `GET /lecciones/{id}/usuarios/` | R-DOM-SHT-009 | SCREEN-LESSON-DETAIL — pestaña tiradores | FL-SHT-008 | T-FL-SHT-008 | AC-OP-LES-008 | — |
| OP-LES-009 | `GET /lecciones/{id}/resultados/` | R-DOM-SHT-010 | SCREEN-LESSON-DETAIL — pestaña resultados | FL-SHT-009 | T-FL-SHT-009 | AC-OP-LES-009 | **Reserva B-01**: hipótesis estática; fallo → ST-04 explícito; resumen/reporte no sustituyen el detalle |
| OP-LES-010 | `GET /lecciones/{id}/resultados-resumen/` | R-DOM-SHT-011 | SCREEN-LESSON-DETAIL — pestaña resumen | FL-SHT-010 | T-FL-SHT-010 | AC-OP-LES-010 | — |
| OP-LES-011 | `GET /lecciones/{id}/reporte/` | R-DOM-SHT-012 | SCREEN-LESSON-DETAIL — pestaña reporte | FL-SHT-011 | T-FL-SHT-011 | AC-OP-LES-011 | — |
| OP-LES-012 | `GET /lecciones/{id}/tiradores-elegibles/` | R-DOM-SHT-013 | SCREEN-LESSON-DETAIL — selector de participantes | FL-SHT-012 | T-FL-SHT-012 | AC-OP-LES-012 | No convertirse en alta de usuario |

## Fracciones — OP-FRC (8)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-FRC-001 | `GET /fracciones/` | familia — [requirements/shooting.md](../requirements/shooting.md) §Alcance | Integrada en SCREEN-LESSON-DETAIL (colección visible proviene de OP-LES-007; screens.md §Cobertura) | — (ningún FL la desarrolla como principal; reportado) | — | AC-OP-FRC-001 | — |
| OP-FRC-002 | `POST /fracciones/` | R-DOM-SHT-014 | SCREEN-LESSON-DETAIL — modales pestaña fracciones | FL-SHT-013 | T-FL-SHT-013 | AC-OP-FRC-002 | — |
| OP-FRC-003 | `GET /fracciones/{id}/` | familia — shooting.md §Alcance; fuente puntual: [navigation.md](../experience/navigation.md) §Deep links | SCREEN-FRACTION-DETAIL + resolución de contexto en SCREEN-RESULTS-CAPTURE (entrada directa) | — (ningún FL la desarrolla como principal; reportado) | — | AC-OP-FRC-003 | — |
| OP-FRC-004 | `PUT /fracciones/{id}/` | R-DOM-SHT-014 | SCREEN-LESSON-DETAIL — modales pestaña fracciones | FL-SHT-013 | T-FL-SHT-013 | AC-OP-FRC-004 | — |
| OP-FRC-005 | `PATCH /fracciones/{id}/` | R-DOM-SHT-014 | SCREEN-LESSON-DETAIL — modales pestaña fracciones | FL-SHT-013 | T-FL-SHT-013 | AC-OP-FRC-005 | — |
| OP-FRC-006 | `DELETE /fracciones/{id}/` | R-DOM-SHT-015 | SCREEN-LESSON-DETAIL — modales pestaña fracciones | FL-SHT-014 | T-FL-SHT-014 | AC-OP-FRC-006 | — |
| OP-FRC-007 | `GET /fracciones/{id}/tiradores/` | R-DOM-SHT-016 | SCREEN-FRACTION-DETAIL y SCREEN-RESULTS-CAPTURE (selectores reales) | FL-SHT-015 | T-FL-SHT-015 | AC-OP-FRC-007 | — |
| OP-FRC-008 | `GET /fracciones/{id}/resultados/` | R-DOM-SHT-019 | SCREEN-FRACTION-DETAIL (detalle gated `can_read_detail`) | FL-SHT-019 | T-FL-SHT-019 | AC-OP-FRC-008 | `403` → captura y detalle separados |

## Resultados — OP-RES (6)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-RES-001 | `GET /resultados/` | familia — [requirements/shooting.md](../requirements/shooting.md) §Alcance | SCREEN-RESULTS-CAPTURE | — (ningún FL la desarrolla como principal; reportado) | — | AC-OP-RES-001 | — |
| OP-RES-002 | `POST /resultados/` | R-DOM-SHT-017, R-DOM-SHT-018 | SCREEN-RESULTS-CAPTURE | FL-SHT-016 | T-FL-SHT-016 | AC-OP-RES-002 | Reserva D-02: validación de resultados sin endpoint, no se simula |
| OP-RES-003 | `GET /resultados/{id}/` | familia — shooting.md §Alcance | SCREEN-RESULTS-CAPTURE | — (ningún FL la desarrolla como principal; reportado) | — | AC-OP-RES-003 | — |
| OP-RES-004 | `PUT /resultados/{id}/` | R-DOM-SHT-017, R-DOM-SHT-018 | SCREEN-RESULTS-CAPTURE (editor compartido con 005) | FL-SHT-017 | T-FL-SHT-017 | AC-OP-RES-004 | — |
| OP-RES-005 | `PATCH /resultados/{id}/` | R-DOM-SHT-017, R-DOM-SHT-018 | SCREEN-RESULTS-CAPTURE (editor compartido con 004) | FL-SHT-017 | T-FL-SHT-017 | AC-OP-RES-005 | — |
| OP-RES-006 | `DELETE /resultados/{id}/` | R-DOM-SHT-020 | SCREEN-RESULTS-CAPTURE | FL-SHT-018 | T-FL-SHT-018 | AC-OP-RES-006 | Sin recálculo local de métricas |

## Roles — OP-ROL (6) · Scopes — OP-SCP (2)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-ROL-001 | `GET /authz/roles/` | R-DOM-AZ-001 | SCREEN-ROLES | FL-AZ-001 | T-FL-AZ-001 | AC-OP-ROL-001 | — |
| OP-ROL-002 | `POST /authz/roles/` | R-DOM-AZ-001 | SCREEN-ROLES | FL-AZ-002 | T-FL-AZ-002 | AC-OP-ROL-002 | Operación restringida: mutación sólo `IsTenantAdmin` |
| OP-ROL-003 | `GET /authz/roles/{id}/` | R-DOM-AZ-001 | SCREEN-ROLES | FL-AZ-001 | T-FL-AZ-001 | AC-OP-ROL-003 | — |
| OP-ROL-004 | `PUT /authz/roles/{id}/` | R-DOM-AZ-001 | SCREEN-ROLES (editor compartido con 005) | FL-AZ-002 | T-FL-AZ-002 | AC-OP-ROL-004 | Operación restringida: `IsTenantAdmin` |
| OP-ROL-005 | `PATCH /authz/roles/{id}/` | R-DOM-AZ-001 | SCREEN-ROLES (editor compartido con 004) | FL-AZ-002 | T-FL-AZ-002 | AC-OP-ROL-005 | Operación restringida: `IsTenantAdmin` |
| OP-ROL-006 | `DELETE /authz/roles/{id}/` | R-DOM-AZ-001 | SCREEN-ROLES | FL-AZ-003 | T-FL-AZ-003 | AC-OP-ROL-006 | Operación restringida: `IsTenantAdmin`; `is_system` como advertencia informativa |
| OP-SCP-001 | `GET /authz/scopes/` | R-DOM-AZ-002 | SCREEN-SCOPES | FL-AZ-004 | T-FL-AZ-004 | AC-OP-SCP-001 | Catálogo sólo lectura: prohibido renderizar escritura |
| OP-SCP-002 | `GET /authz/scopes/{id}/` | R-DOM-AZ-002 | SCREEN-SCOPES | FL-AZ-004 | T-FL-AZ-004 | AC-OP-SCP-002 | Ídem |

## Overrides — OP-OVR (6) · Permisos — OP-PRM (2)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-OVR-001 | `GET /authz/overrides/` | R-DOM-AZ-005 (familia overrides) | SCREEN-OVERRIDES | FL-AZ-009 | T-FL-AZ-009 | AC-OP-OVR-001 | Operación restringida: `IsTenantAdmin` |
| OP-OVR-002 | `POST /authz/overrides/` | R-DOM-AZ-005 | SCREEN-OVERRIDES | FL-AZ-007 | T-FL-AZ-007 | AC-OP-OVR-002 | `IsTenantAdmin`; `created_by` fijado por servidor (RO en UI) |
| OP-OVR-003 | `GET /authz/overrides/{id}/` | R-DOM-AZ-005 (familia overrides) | SCREEN-OVERRIDES | FL-AZ-009 | T-FL-AZ-009 | AC-OP-OVR-003 | `IsTenantAdmin` |
| OP-OVR-004 | `PUT /authz/overrides/{id}/` | R-DOM-AZ-005 | SCREEN-OVERRIDES (editor compartido con 005) | FL-AZ-007 | T-FL-AZ-007 | AC-OP-OVR-004 | `IsTenantAdmin`; `created_by` RO |
| OP-OVR-005 | `PATCH /authz/overrides/{id}/` | R-DOM-AZ-005 | SCREEN-OVERRIDES (editor compartido con 004) | FL-AZ-007 | T-FL-AZ-007 | AC-OP-OVR-005 | Ídem |
| OP-OVR-006 | `DELETE /authz/overrides/{id}/` | R-DOM-AZ-005 (familia overrides) | SCREEN-OVERRIDES | FL-AZ-008 | T-FL-AZ-008 | AC-OP-OVR-006 | `IsTenantAdmin` |
| OP-PRM-001 | `GET /authz/permissions/` | R-DOM-AZ-002 | SCREEN-PERMISSIONS — pestaña catálogo | FL-AZ-004 | T-FL-AZ-004 | AC-OP-PRM-001 | Sólo lectura; reserva D-02: editar el catálogo no existe como capacidad |
| OP-PRM-002 | `GET /authz/permissions/{id}/` | R-DOM-AZ-002 | SCREEN-PERMISSIONS — pestaña catálogo | FL-AZ-004 | T-FL-AZ-004 | AC-OP-PRM-002 | Ídem |

## RolePermission — OP-RPR (6) · PositionPermission — OP-PPR (6)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-RPR-001 | `GET /authz/role-permissions/` | R-DOM-AZ-003 | SCREEN-PERMISSIONS — matriz rol→permiso | FL-AZ-005 | T-FL-AZ-005 | AC-OP-RPR-001 | Operación restringida: `IsTenantAdmin` |
| OP-RPR-002 | `POST /authz/role-permissions/` | R-DOM-AZ-003 | SCREEN-PERMISSIONS — matriz rol→permiso | FL-AZ-005 | T-FL-AZ-005 | AC-OP-RPR-002 | `IsTenantAdmin`; rol de sistema sólo `super_admin` |
| OP-RPR-003 | `GET /authz/role-permissions/{id}/` | R-DOM-AZ-003 | SCREEN-PERMISSIONS — matriz rol→permiso | FL-AZ-005 | T-FL-AZ-005 | AC-OP-RPR-003 | `IsTenantAdmin` |
| OP-RPR-004 | `PUT /authz/role-permissions/{id}/` | R-DOM-AZ-003 | SCREEN-PERMISSIONS — matriz rol→permiso | FL-AZ-005 | T-FL-AZ-005 | AC-OP-RPR-004 | `IsTenantAdmin`; rol de sistema sólo `super_admin` |
| OP-RPR-005 | `PATCH /authz/role-permissions/{id}/` | R-DOM-AZ-003 | SCREEN-PERMISSIONS — matriz rol→permiso | FL-AZ-005 | T-FL-AZ-005 | AC-OP-RPR-005 | Ídem |
| OP-RPR-006 | `DELETE /authz/role-permissions/{id}/` | R-DOM-AZ-003 | SCREEN-PERMISSIONS — matriz rol→permiso | FL-AZ-005 | T-FL-AZ-005 | AC-OP-RPR-006 | Ídem |
| OP-PPR-001 | `GET /authz/position-permissions/` | R-DOM-AZ-004 | SCREEN-PERMISSIONS — matriz puesto→permiso | FL-AZ-006 | T-FL-AZ-006 | AC-OP-PPR-001 | Operación restringida: `IsTenantAdmin` |
| OP-PPR-002 | `POST /authz/position-permissions/` | R-DOM-AZ-004 | SCREEN-PERMISSIONS — matriz puesto→permiso | FL-AZ-006 | T-FL-AZ-006 | AC-OP-PPR-002 | `IsTenantAdmin`; puesto fuera de tenant → `400` sin fila local |
| OP-PPR-003 | `GET /authz/position-permissions/{id}/` | R-DOM-AZ-004 | SCREEN-PERMISSIONS — matriz puesto→permiso | FL-AZ-006 | T-FL-AZ-006 | AC-OP-PPR-003 | `IsTenantAdmin` |
| OP-PPR-004 | `PUT /authz/position-permissions/{id}/` | R-DOM-AZ-004 | SCREEN-PERMISSIONS — matriz puesto→permiso | FL-AZ-006 | T-FL-AZ-006 | AC-OP-PPR-004 | `IsTenantAdmin` |
| OP-PPR-005 | `PATCH /authz/position-permissions/{id}/` | R-DOM-AZ-004 | SCREEN-PERMISSIONS — matriz puesto→permiso | FL-AZ-006 | T-FL-AZ-006 | AC-OP-PPR-005 | `IsTenantAdmin` |
| OP-PPR-006 | `DELETE /authz/position-permissions/{id}/` | R-DOM-AZ-004 | SCREEN-PERMISSIONS — matriz puesto→permiso | FL-AZ-006 | T-FL-AZ-006 | AC-OP-PPR-006 | `IsTenantAdmin` |

## Unidades — OP-UNT (10)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-UNT-001 | `GET /organization-units/` | R-DOM-ORG-001, R-DOM-ORG-002 | SCREEN-UNITS | FL-ORG-001 | T-FL-ORG-001 | AC-OP-UNT-001 | — |
| OP-UNT-002 | `POST /organization-units/` | R-DOM-ORG-004, R-DOM-ORG-005 | SCREEN-UNITS | FL-ORG-002 | T-FL-ORG-002 | AC-OP-UNT-002 | — |
| OP-UNT-003 | `GET /organization-units/{id}/` | R-DOM-ORG-001, R-DOM-ORG-002 | SCREEN-UNIT-DETAIL | FL-ORG-001 | T-FL-ORG-001 | AC-OP-UNT-003 | — |
| OP-UNT-004 | `PUT /organization-units/{id}/` | R-DOM-ORG-005 | SCREEN-UNIT-DETAIL (editor compartido con 005) | FL-ORG-003 | T-FL-ORG-003 | AC-OP-UNT-004 | — |
| OP-UNT-005 | `PATCH /organization-units/{id}/` | R-DOM-ORG-005 | SCREEN-UNIT-DETAIL (editor compartido con 004) | FL-ORG-003 | T-FL-ORG-003 | AC-OP-UNT-005 | — |
| OP-UNT-006 | `DELETE /organization-units/{id}/` | familia — [requirements/organization.md](../requirements/organization.md) §Unidades + R-DOM-ORG-006 | SCREEN-UNIT-DETAIL | — (flujo destructivo canónico vía OP-UNT-007/008: FL-ORG-004/005; reportado) | — | AC-OP-UNT-006 | — |
| OP-UNT-007 | `GET /organization-units/{id}/previsualizar-eliminacion/` | R-DOM-ORG-008 | SCREEN-UNIT-DETAIL — eliminar con migración, paso 1 | FL-ORG-004 | T-FL-ORG-004 | AC-OP-UNT-007 | — |
| OP-UNT-008 | `POST /organization-units/{id}/eliminar-con-migracion/` | R-DOM-ORG-009, R-DOM-ORG-010, R-DOM-ORG-011 | SCREEN-UNIT-DETAIL — eliminar con migración, paso 2 | FL-ORG-005 | T-FL-ORG-005 | AC-OP-UNT-008 | Afecta acceso: ST-10; `assignments` informado, no reasignado |
| OP-UNT-009 | `GET /organization-units/lookup/` | R-DOM-ORG-007 | Sin pantalla propia: selector integrado en formularios de asignación (SCREEN-USER-DETAIL, SCREEN-USERS; screens.md §Integraciones) | FL-ORG-006 | T-FL-ORG-006 | AC-OP-UNT-009 | — |
| OP-UNT-010 | `GET /me/assignable-units/` | R-DOM-ORG-003 | Sin pantalla propia: selector de unidades elegibles integrado en SCREEN-USERS (alta), SCREEN-USER-DETAIL (asignaciones) y SCREEN-UNIT-DETAIL (destino de migración) | FL-ORG-002, FL-ORG-005, FL-ORG-007 | T-FL-ORG-002, T-FL-ORG-005, T-FL-ORG-007 | AC-OP-UNT-010 | El listado no acredita autorización (states.md) |

## Recintos — OP-RCT (8)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-RCT-001 | `GET /recintos/` | R-DOM-ORG-012 | SCREEN-PRECINCTS | FL-ORG-008 | T-FL-ORG-008 | AC-OP-RCT-001 | — |
| OP-RCT-002 | `POST /recintos/` | R-DOM-ORG-013 | SCREEN-PRECINCTS | FL-ORG-009 | T-FL-ORG-009 | AC-OP-RCT-002 | — |
| OP-RCT-003 | `GET /recintos/{id}/` | R-DOM-ORG-012 | SCREEN-PRECINCT-DETAIL (+ prefill del editor del listado) | FL-ORG-008 | T-FL-ORG-008 | AC-OP-RCT-003 | — |
| OP-RCT-004 | `PUT /recintos/{id}/` | R-DOM-ORG-013, R-DOM-ORG-014 | SCREEN-PRECINCTS (editor compartido con 005) | FL-ORG-009 | T-FL-ORG-009 | AC-OP-RCT-004 | — |
| OP-RCT-005 | `PATCH /recintos/{id}/` | R-DOM-ORG-013, R-DOM-ORG-014 | SCREEN-PRECINCTS (editor compartido con 004) | FL-ORG-009 | T-FL-ORG-009 | AC-OP-RCT-005 | — |
| OP-RCT-006 | `DELETE /recintos/{id}/` | R-DOM-ORG-017 | SCREEN-PRECINCTS | FL-ORG-010 | T-FL-ORG-010 | AC-OP-RCT-006 | Sin promesa de migración de unidades |
| OP-RCT-007 | `POST /recintos/{id}/agregar-unidad/{unit_code}/` | R-DOM-ORG-015 | SCREEN-PRECINCT-DETAIL — panel de relaciones | FL-ORG-011 | T-FL-ORG-011 | AC-OP-RCT-007 | — |
| OP-RCT-008 | `DELETE /recintos/{id}/quitar-unidad/{unit_code}/` | R-DOM-ORG-016 | SCREEN-PRECINCT-DETAIL — panel de relaciones | FL-ORG-012 | T-FL-ORG-012 | AC-OP-RCT-008 | Relación ausente → error explícito, no éxito idempotente |

## Armerías — OP-ARM (6) · Posiciones — OP-POS (9)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-ARM-001 | `GET /armorias/` | R-DOM-ARM-001 | SCREEN-ARMORIES | FL-ARM-001, FL-WPN-002 (selector) | T-FL-ARM-001, T-FL-WPN-002 | AC-OP-ARM-001 | — |
| OP-ARM-002 | `POST /armorias/` | R-DOM-ARM-002 | SCREEN-ARMORIES | FL-ARM-002 | T-FL-ARM-002 | AC-OP-ARM-002 | — |
| OP-ARM-003 | `GET /armorias/{id}/` | R-DOM-ARM-001 | SCREEN-ARMORIES — lectura de detalle para prefill/relaciones (sin ruta de detalle propia; screens.md §Cobertura) | FL-ARM-001 | T-FL-ARM-001 | AC-OP-ARM-003 | — |
| OP-ARM-004 | `PUT /armorias/{id}/` | R-DOM-ARM-003, R-DOM-ARM-004 | SCREEN-ARMORIES (editor compartido con 005) | FL-ARM-002 | T-FL-ARM-002 | AC-OP-ARM-004 | — |
| OP-ARM-005 | `PATCH /armorias/{id}/` | R-DOM-ARM-003, R-DOM-ARM-004 | SCREEN-ARMORIES (editor compartido con 004) | FL-ARM-002 | T-FL-ARM-002 | AC-OP-ARM-005 | — |
| OP-ARM-006 | `DELETE /armorias/{id}/` | R-DOM-ARM-004 | SCREEN-ARMORIES | FL-ARM-003 | T-FL-ARM-003 | AC-OP-ARM-006 | Sin promesa de reasignación de armas |
| OP-POS-001 | `GET /posiciones/` | R-DOM-ID-013 | SCREEN-POSITIONS | FL-IDT-011 | T-FL-IDT-011 | AC-OP-POS-001 | — |
| OP-POS-002 | `POST /posiciones/` | R-DOM-ID-014, R-DOM-ID-015 | SCREEN-POSITIONS | FL-IDT-012 | T-FL-IDT-012 | AC-OP-POS-002 | — |
| OP-POS-003 | `GET /posiciones/{id}/` | R-DOM-ID-013 | SCREEN-POSITION-DETAIL | FL-IDT-011 | T-FL-IDT-011 | AC-OP-POS-003 | — |
| OP-POS-004 | `PUT /posiciones/{id}/` | R-DOM-ID-014, R-DOM-ID-015 | SCREEN-POSITIONS (editor compartido con 005; edición también desde la ficha) | FL-IDT-012 | T-FL-IDT-012 | AC-OP-POS-004 | `recinto` sólo actúa con scope `todo_recinto` |
| OP-POS-005 | `PATCH /posiciones/{id}/` | R-DOM-ID-014, R-DOM-ID-015 | SCREEN-POSITIONS (editor compartido con 004) | FL-IDT-012 | T-FL-IDT-012 | AC-OP-POS-005 | Ídem |
| OP-POS-006 | `DELETE /posiciones/{id}/` | familia — [requirements/identity-authorization.md](../requirements/identity-authorization.md) §Límites (confirmación cuando afecta acceso) | SCREEN-POSITIONS | FL-IDT-013 | T-FL-IDT-013 | AC-OP-POS-006 | — |
| OP-POS-007 | `POST /posiciones/{id}/asignar-holder/` | R-DOM-ID-016 | SCREEN-POSITION-DETAIL — panel holders | FL-IDT-014 | T-FL-IDT-014 | AC-OP-POS-007 | — |
| OP-POS-008 | `POST /posiciones/{id}/quitar-holder/{assignment_id}/` | R-DOM-ID-017 | SCREEN-POSITION-DETAIL — panel holders | FL-IDT-015 | T-FL-IDT-015 | AC-OP-POS-008 | Afecta acceso: ST-10 |
| OP-POS-009 | `GET /posiciones/{id}/historico/` | R-DOM-ID-017 | SCREEN-POSITION-DETAIL — pestaña histórico | FL-IDT-011 | T-FL-IDT-011 | AC-OP-POS-009 | Sin cronología inferida |

## Memberships — OP-MEM (6) · Calibres — OP-CAL (6)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-MEM-001 | `GET /memberships/` | R-DOM-ID-018 | SCREEN-MEMBERSHIPS | — (ningún FL la desarrolla como principal; reportado) | — | AC-OP-MEM-001 | Permiso derivado de `(position, action)` |
| OP-MEM-002 | `POST /memberships/` | R-DOM-ID-018 | SCREEN-MEMBERSHIPS | FL-IDT-016 | T-FL-IDT-016 | AC-OP-MEM-002 | Alta exige `assign_positions` |
| OP-MEM-003 | `GET /memberships/{id}/` | R-DOM-ID-018 | SCREEN-MEMBERSHIPS | — (ningún FL la desarrolla como principal; reportado) | — | AC-OP-MEM-003 | Permiso derivado de `(position, action)` |
| OP-MEM-004 | `PUT /memberships/{id}/` | R-DOM-ID-018, R-DOM-ID-019 | SCREEN-MEMBERSHIPS (editor compartido con 005) | FL-IDT-016, FL-IDT-017 | T-FL-IDT-016, T-FL-IDT-017 | AC-OP-MEM-004 | Cambio de primaria refresca contexto antes de mostrar unidad efectiva |
| OP-MEM-005 | `PATCH /memberships/{id}/` | R-DOM-ID-018, R-DOM-ID-019 | SCREEN-MEMBERSHIPS (editor compartido con 004) | FL-IDT-016, FL-IDT-017 | T-FL-IDT-016, T-FL-IDT-017 | AC-OP-MEM-005 | Ídem |
| OP-MEM-006 | `DELETE /memberships/{id}/` | R-DOM-ID-019 | SCREEN-MEMBERSHIPS | FL-IDT-017 | T-FL-IDT-017 | AC-OP-MEM-006 | Baja exige `revoke_positions`; no asumir efecto sobre asignación funcional |
| OP-CAL-001 | `GET /calibres/` | R-DOM-ARM-010 | SCREEN-CALIBERS | FL-CAL-001, FL-WPN-002 (selector) | T-FL-CAL-001, T-FL-WPN-002 | AC-OP-CAL-001 | Catálogo global |
| OP-CAL-002 | `POST /calibres/` | R-DOM-ARM-011, R-DOM-ARM-012 | SCREEN-CALIBERS | FL-CAL-002 | T-FL-CAL-002 | AC-OP-CAL-002 | Operación restringida: `manage_calibre` + `super_admin` |
| OP-CAL-003 | `GET /calibres/{id}/` | R-DOM-ARM-010 | SCREEN-CALIBERS | FL-CAL-001 | T-FL-CAL-001 | AC-OP-CAL-003 | Catálogo global |
| OP-CAL-004 | `PUT /calibres/{id}/` | R-DOM-ARM-011, R-DOM-ARM-012 | SCREEN-CALIBERS (editor compartido con 005) | FL-CAL-002 | T-FL-CAL-002 | AC-OP-CAL-004 | `manage_calibre` + `super_admin` |
| OP-CAL-005 | `PATCH /calibres/{id}/` | R-DOM-ARM-011, R-DOM-ARM-012 | SCREEN-CALIBERS (editor compartido con 004) | FL-CAL-002 | T-FL-CAL-002 | AC-OP-CAL-005 | Ídem |
| OP-CAL-006 | `DELETE /calibres/{id}/` | R-DOM-ARM-011, R-DOM-ARM-012 | SCREEN-CALIBERS | FL-CAL-002 | T-FL-CAL-002 | AC-OP-CAL-006 | Ídem; refresco de selectores dependientes |

## Ejercicios — OP-EJR (6) · Consumos de munición — OP-CMN (6) · Consumos de arma — OP-CAR (6)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-EJR-001 | `GET /ejercicios/` | R-DOM-EXC-001 | SCREEN-EXERCISES | FL-EXC-001 | T-FL-EXC-001 | AC-OP-EJR-001 | — |
| OP-EJR-002 | `POST /ejercicios/` | R-DOM-EXC-002, R-DOM-EXC-003, R-DOM-EXC-004 | SCREEN-EXERCISES | FL-EXC-002 | T-FL-EXC-002 | AC-OP-EJR-002 | — |
| OP-EJR-003 | `GET /ejercicios/{id}/` | R-DOM-EXC-001 | SCREEN-EXERCISE-DETAIL | FL-EXC-001 | T-FL-EXC-001 | AC-OP-EJR-003 | — |
| OP-EJR-004 | `PUT /ejercicios/{id}/` | R-DOM-EXC-002, R-DOM-EXC-004 | SCREEN-EXERCISE-DETAIL (editor compartido con 005) | FL-EXC-002 | T-FL-EXC-002 | AC-OP-EJR-004 | — |
| OP-EJR-005 | `PATCH /ejercicios/{id}/` | R-DOM-EXC-002, R-DOM-EXC-004 | SCREEN-EXERCISE-DETAIL (editor compartido con 004) | FL-EXC-002 | T-FL-EXC-002 | AC-OP-EJR-005 | — |
| OP-EJR-006 | `DELETE /ejercicios/{id}/` | R-DOM-EXC-005 | SCREEN-EXERCISE-DETAIL | FL-EXC-003 | T-FL-EXC-003 | AC-OP-EJR-006 | Sin promesa de cascada |
| OP-CMN-001 | `GET /consumos-municion/` | R-DOM-EXC-006 | SCREEN-AMMO-CONSUMPTION | FL-CMN-001 | T-FL-CMN-001 | AC-OP-CMN-001 | Sólo tenant: sin unidad inyectada |
| OP-CMN-002 | `POST /consumos-municion/` | R-DOM-EXC-007, R-DOM-EXC-008, R-DOM-EXC-009 | SCREEN-AMMO-CONSUMPTION | FL-CMN-002 | T-FL-CMN-002 | AC-OP-CMN-002 | — |
| OP-CMN-003 | `GET /consumos-municion/{id}/` | R-DOM-EXC-006 | SCREEN-AMMO-CONSUMPTION | FL-CMN-001 | T-FL-CMN-001 | AC-OP-CMN-003 | Sólo tenant |
| OP-CMN-004 | `PUT /consumos-municion/{id}/` | R-DOM-EXC-007, R-DOM-EXC-008, R-DOM-EXC-009 | SCREEN-AMMO-CONSUMPTION (editor compartido con 005) | FL-CMN-002 | T-FL-CMN-002 | AC-OP-CMN-004 | — |
| OP-CMN-005 | `PATCH /consumos-municion/{id}/` | R-DOM-EXC-007, R-DOM-EXC-008, R-DOM-EXC-009 | SCREEN-AMMO-CONSUMPTION (editor compartido con 004) | FL-CMN-002 | T-FL-CMN-002 | AC-OP-CMN-005 | — |
| OP-CMN-006 | `DELETE /consumos-municion/{id}/` | R-DOM-EXC-009 | SCREEN-AMMO-CONSUMPTION | FL-CMN-003 | T-FL-CMN-003 | AC-OP-CMN-006 | Sin conversión de fallo en ceros |
| OP-CAR-001 | `GET /consumos-arma/` | R-DOM-EXC-010 | SCREEN-WEAPON-CONSUMPTION | — (ningún FL la desarrolla como principal; reportado) | — | AC-OP-CAR-001 | — |
| OP-CAR-002 | `POST /consumos-arma/` | R-DOM-EXC-011, R-DOM-EXC-012 | SCREEN-WEAPON-CONSUMPTION | FL-CAR-001 | T-FL-CAR-001 | AC-OP-CAR-002 | — |
| OP-CAR-003 | `GET /consumos-arma/{id}/` | R-DOM-EXC-010 | SCREEN-WEAPON-CONSUMPTION | — (ningún FL la desarrolla como principal; reportado) | — | AC-OP-CAR-003 | — |
| OP-CAR-004 | `PUT /consumos-arma/{id}/` | R-DOM-EXC-011, R-DOM-EXC-012 | SCREEN-WEAPON-CONSUMPTION (editor compartido con 005) | FL-CAR-001 | T-FL-CAR-001 | AC-OP-CAR-004 | — |
| OP-CAR-005 | `PATCH /consumos-arma/{id}/` | R-DOM-EXC-011, R-DOM-EXC-012 | SCREEN-WEAPON-CONSUMPTION (editor compartido con 004) | FL-CAR-001 | T-FL-CAR-001 | AC-OP-CAR-005 | — |
| OP-CAR-006 | `DELETE /consumos-arma/{id}/` | R-DOM-EXC-013 | SCREEN-WEAPON-CONSUMPTION | FL-CAR-002 | T-FL-CAR-002 | AC-OP-CAR-006 | Sin stock restante supuesto |

## Auth y sesión — OP-AUT (6) · Recuperación — OP-RCV (4)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-AUT-001 | `POST /auth/login/` | R-SES-005, R-SES-013 | SCREEN-LOGIN | FL-SES-001 | T-FL-SES-001, T-CORE-HTTP | AC-OP-AUT-001 | Excluida de `X-Tenant-Code` (R-SES-004) |
| OP-AUT-002 | `GET /auth/context/` | R-SES-007, R-SES-022 | Sin pantalla propia: bootstrap de app y guards; lo materializan SCREEN-CONTEXT y SCREEN-DASHBOARD (screens.md §Integraciones) | FL-SES-002, FL-SES-003, FL-SES-004, FL-PWD-001 | T-FL-SES-002, T-FL-SES-003, T-FL-SES-004, T-FL-PWD-001, T-CORE-SESSION, T-CORE-ROUTER | AC-OP-AUT-002 | **Reserva G-SES-1**: recarga profunda con sesión viva exige re-captura de tenant en `/contexto` |
| OP-AUT-003 | `POST /auth/select-unit/` | R-SES-006, R-SES-013, R-SES-017 | SCREEN-CONTEXT | FL-SES-003, FL-SES-004 | T-FL-SES-003, T-FL-SES-004 | AC-OP-AUT-003 | Éxito ⇒ anti-carrera F-08 completo |
| OP-AUT-004 | `GET /auth/audit-log/` | R-DOM-AZ-010 | SCREEN-AUDIT | FL-AUD-001 | T-FL-AUD-001 | AC-OP-AUT-004 | Operación restringida: sólo `tenant_admin`/`super_admin`/`auditor`; PII no registrada (R-SES-018) |
| OP-AUT-005 | `POST /logout/` | R-SES-019 | Sin pantalla propia: acción de topbar/menú con purga (navigation.md §Menú; screens.md §Integraciones) | FL-SES-005 | T-FL-SES-005, T-CORE-SESSION | AC-OP-AUT-005 | Excluida de `X-Tenant-Code` (R-SES-004) |
| OP-AUT-006 | `GET /protected/` | R-SES-004 (exclusión declarada de cabecera) | **Sin pantalla** (declaración explícita del inventario) | — | T-CORE-HTTP | AC-OP-AUT-006 | **Infraestructura**: no es operación de negocio; sin estado de UI (P-INFRA) |
| OP-RCV-001 | `POST /recuperar/` | R-SES-013; R-REC-01/02 (citados por [screens/access-context.md](../experience/screens/access-context.md) §RECOVERY) | SCREEN-RECOVERY — paso 1 | FL-RCV-001 | T-FL-RCV-001 | AC-OP-RCV-001 | Excluida de `X-Tenant-Code`; respuesta genérica anti-enumeración |
| OP-RCV-002 | `POST /recuperar/crear/` | ídem | SCREEN-RECOVERY — paso 2 | FL-RCV-001 | T-FL-RCV-001 | AC-OP-RCV-002 | Ídem |
| OP-RCV-003 | `POST /recuperar/comprobar/` | ídem | SCREEN-RECOVERY — paso 3 | FL-RCV-001 | T-FL-RCV-001 | AC-OP-RCV-003 | Código expira a los 5 minutos |
| OP-RCV-004 | `POST /recuperar/cambiar/` | ídem | SCREEN-RECOVERY — paso 4 | FL-RCV-001 | T-FL-RCV-001 | AC-OP-RCV-004 | `400` permanece en el paso con `mensaje`/`errores[]` literales |

## Preferencias y catálogos operativos — OP-PRF (2) · OP-AZC (4)

| OP | Método + ruta | Requisito(s) | SCREEN / integración | FL desarrollados | Tarea | Criterio | Clasificación / reserva |
|---|---|---|---|---|---|---|---|
| OP-PRF-001 | `GET /me/preferences/appearance/` | R-APAR-002 | SCREEN-PERSONALIZER — trazada como legado | FL-APP-008 | T-FL-APP-008 | AC-OP-PRF-001 | **Legacy**: no gobierna los 8 ejes; la ruta de 8 ejes es separada del legacy y ya existe (migración `0021_design_system_preferences`, rutas `apipoligono/urls.py:85-86`; verificado 2026-10-15) (R-APAR-001); excluida de `X-Tenant-Code` (R-SES-004) |
| OP-PRF-002 | `PUT /me/preferences/appearance/` | R-APAR-002, R-APAR-003 | SCREEN-PERSONALIZER — trazada como legado | FL-APP-008 | T-FL-APP-008 | AC-OP-PRF-002 | Ídem; literales `Theme inválido`/`Palette inválida`/`Density inválido` |
| OP-AZC-001 | `GET /authz/catalog/` | R-DOM-AZ-006 | SCREEN-PERMISSIONS — fill de matrices y tooltips | FL-AZ-005, FL-AZ-006, FL-AZ-010 | T-FL-AZ-005, T-FL-AZ-006, T-FL-AZ-010 | AC-OP-AZC-001 | Acción catalogada ≠ endpoint expuesto |
| OP-AZC-002 | `GET /authz/role-categories/` | R-DOM-AZ-007 | Sin pantalla propia: roles agrupados en los modales de asignación de SCREEN-USER-DETAIL y alta de SCREEN-USERS (screens.md §Cobertura) | FL-AZ-011, FL-IDT-002, FL-IDT-007 | T-FL-AZ-011, T-FL-IDT-002, T-FL-IDT-007 | AC-OP-AZC-002 | Vacío no significa roles fuera de alcance |
| OP-AZC-003 | `GET /authz/personas-por-unidad/` | R-DOM-AZ-008 | SCREEN-PERMISSIONS — pestaña personas por unidad | FL-AZ-012 | T-FL-AZ-012 | AC-OP-AZC-003 | Excluye tirador implícito |
| OP-AZC-004 | `GET /authz/eligible-target-units/` | R-DOM-AZ-009 | Sin pantalla propia: selector de unidad elegible integrado en SCREEN-USERS y SCREEN-USER-DETAIL (screens.md §Cobertura) | FL-AZ-013, FL-IDT-002, FL-IDT-007 | T-FL-AZ-013, T-FL-IDT-002, T-FL-IDT-007 | AC-OP-AZC-004 | `reason: sin_account \| sin_unidad_personal` como restricción, no lista vacía |

---

## Verificación de conteo

🕯️ Filas por familia: USR 16 · WPN 6 · RNG 7 · LES 12 · FRC 8 · RES 6 · ROL 6 · SCP 2 · OVR 6 · PRM 2 · RPR 6 · PPR 6 · UNT 10 · RCT 8 · ARM 6 · POS 9 · MEM 6 · CAL 6 · EJR 6 · CMN 6 · CAR 6 · AUT 6 · RCV 4 · PRF 2 · AZC 4. **Total: 162 filas = 162 OP del manifest** (161 de negocio + `OP-AUT-006` de infraestructura). Ninguna OP inventada; ninguna capacidad actual omitida; las capacidades sin endpoint (D-02) no generan fila porque no son OP.
