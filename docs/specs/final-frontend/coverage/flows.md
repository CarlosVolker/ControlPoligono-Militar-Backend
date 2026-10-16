---
spec_meta: "../../spec-meta.yaml"
---

# Cruce de flujos — 99 FL canónicos

> 📖 Yo conservo aquí el cruce de los 99 flujos canónicos de [experience/flows.md](../experience/flows.md) con sus OP principales (transcritas del índice canónico desarrollado en los volúmenes [`flows/`](../experience/flows/)), las pantallas donde se materializan, la tarea `T-FL-*` por convención y el criterio de aceptación. Regla del contrato: cada FL canónico tiene tarea `T-<FL-ID>`; cada OP criterio `AC-<OP-ID>`; los flujos **sin OP ni propuesta** reciben `AC-<FL-ID>`. Ningún alias `FL/*` del inventario es destino final: la traducción de consumidores provisionales a FL canónicos es la de [flows.md](../experience/flows.md) §Consumidores provisionales. Los `T-*`/`AC-*` son punteros por convención acordada ([coverage.md](../coverage.md) §Estado de los punteros).

## Sesión y contexto (6) · Recuperación y contraseña (6)

| FL | Flujo | OP principales | SCREEN(s) | Tarea | Criterio | Reserva |
|---|---|---|---|---|---|---|
| FL-SES-001 | Login y captura de institución | OP-AUT-001 | SCREEN-LOGIN | T-FL-SES-001 | AC-OP-AUT-001 | — |
| FL-SES-002 | Bootstrap y recarga profunda | OP-AUT-002 | Sin pantalla propia: guards/arranque; materializan SCREEN-CONTEXT y SCREEN-DASHBOARD | T-FL-SES-002 | AC-OP-AUT-002 | G-SES-1: recarga profunda con sesión viva exige re-captura de tenant |
| FL-SES-003 | Contexto inicial y selección de unidad | OP-AUT-002, OP-AUT-003 | SCREEN-CONTEXT | T-FL-SES-003 | AC-OP-AUT-002, AC-OP-AUT-003 | — |
| FL-SES-004 | Cambio de unidad activa | OP-AUT-003, OP-AUT-002 | SCREEN-CONTEXT (y selector de topbar; navigation.md §Menú) | T-FL-SES-004 | AC-OP-AUT-003, AC-OP-AUT-002 | Anti-carrera F-08 completo |
| FL-SES-005 | Logout | OP-AUT-005 | Sin pantalla propia: acción de topbar con purga (navigation.md §Menú) | T-FL-SES-005 | AC-OP-AUT-005 | — |
| FL-SES-006 | Expiración y contexto perdido | ninguna (reacción) | SCREEN-CONTEXT-LOST, SCREEN-LOGIN | T-FL-SES-006 | **AC-FL-SES-006** (sin OP) | F-12: purga sin reintento |
| FL-RCV-001 | Recuperación en cuatro pasos | OP-RCV-001…004 | SCREEN-RECOVERY | T-FL-RCV-001 | AC-OP-RCV-001…004 | Anti-enumeración; código expira a los 5 min |
| FL-PWD-001 | Cambio de contraseña forzado | OP-USR-013, OP-AUT-002 | SCREEN-PASSWORD-FORCED | T-FL-PWD-001 | AC-OP-USR-013, AC-OP-AUT-002 | Sin `old_password` bajo `must_change_password` |
| FL-PWD-002 | Cambio de contraseña propio | OP-USR-013 | SCREEN-USER-DETAIL — panel credenciales (navigation.md §Menú) | T-FL-PWD-002 | AC-OP-USR-013 | — |
| FL-PWD-003 | Reseteo de contraseña a otro | OP-USR-014 | SCREEN-USER-DETAIL — panel credenciales | T-FL-PWD-003 | AC-OP-USR-014 | ST-10 obligatoria |
| FL-PWD-004 | Consulta de estado de bloqueo | OP-USR-015 | SCREEN-USER-DETAIL — panel bloqueo | T-FL-PWD-004 | AC-OP-USR-015 | — |
| FL-PWD-005 | Desbloqueo de cuenta | OP-USR-016 | SCREEN-USER-DETAIL — panel bloqueo | T-FL-PWD-005 | AC-OP-USR-016 | ST-10 obligatoria |

## Organización (12)

| FL | Flujo | OP principales | SCREEN(s) | Tarea | Criterio | Reserva |
|---|---|---|---|---|---|---|
| FL-ORG-001 | Consulta de unidades y árbol | OP-UNT-001, OP-UNT-003 | SCREEN-UNITS, SCREEN-UNIT-DETAIL | T-FL-ORG-001 | AC-OP-UNT-001, AC-OP-UNT-003 | — |
| FL-ORG-002 | Alta de unidad | OP-UNT-002, OP-UNT-010 | SCREEN-UNITS | T-FL-ORG-002 | AC-OP-UNT-002, AC-OP-UNT-010 | — |
| FL-ORG-003 | Edición de unidad | OP-UNT-004, OP-UNT-005 | SCREEN-UNIT-DETAIL (editor) | T-FL-ORG-003 | AC-OP-UNT-004, AC-OP-UNT-005 | — |
| FL-ORG-004 | Previsualización de eliminación | OP-UNT-007 | SCREEN-UNIT-DETAIL — paso 1 | T-FL-ORG-004 | AC-OP-UNT-007 | — |
| FL-ORG-005 | Eliminación con migración | OP-UNT-008, OP-UNT-010 | SCREEN-UNIT-DETAIL — paso 2 | T-FL-ORG-005 | AC-OP-UNT-008, AC-OP-UNT-010 | `assignments` informado, no reasignado |
| FL-ORG-006 | Lookup de unidades (selector) | OP-UNT-009 | Integrado: SCREEN-USER-DETAIL, SCREEN-USERS (sin pantalla propia) | T-FL-ORG-006 | AC-OP-UNT-009 | — |
| FL-ORG-007 | Unidades asignables (selector) | OP-UNT-010 | Integrado: SCREEN-USERS, SCREEN-USER-DETAIL, SCREEN-UNIT-DETAIL | T-FL-ORG-007 | AC-OP-UNT-010 | Listado no acredita autorización |
| FL-ORG-008 | Consulta de recintos | OP-RCT-001, OP-RCT-003 | SCREEN-PRECINCTS, SCREEN-PRECINCT-DETAIL | T-FL-ORG-008 | AC-OP-RCT-001, AC-OP-RCT-003 | — |
| FL-ORG-009 | Alta y edición de recinto | OP-RCT-002, OP-RCT-004, OP-RCT-005 | SCREEN-PRECINCTS | T-FL-ORG-009 | AC-OP-RCT-002, AC-OP-RCT-004, AC-OP-RCT-005 | — |
| FL-ORG-010 | Eliminación de recinto | OP-RCT-006 | SCREEN-PRECINCTS | T-FL-ORG-010 | AC-OP-RCT-006 | Sin migración prometida |
| FL-ORG-011 | Agregar unidad a recinto | OP-RCT-007 | SCREEN-PRECINCT-DETAIL — panel relaciones | T-FL-ORG-011 | AC-OP-RCT-007 | — |
| FL-ORG-012 | Quitar unidad de recinto | OP-RCT-008 | SCREEN-PRECINCT-DETAIL — panel relaciones | T-FL-ORG-012 | AC-OP-RCT-008 | ST-10; relación ausente = error explícito |

## Identidad (17)

| FL | Flujo | OP principales | SCREEN(s) | Tarea | Criterio | Reserva |
|---|---|---|---|---|---|---|
| FL-IDT-001 | Consulta de usuarios | OP-USR-001, OP-USR-003 | SCREEN-USERS, SCREEN-USER-DETAIL | T-FL-IDT-001 | AC-OP-USR-001, AC-OP-USR-003 | — |
| FL-IDT-002 | Alta de usuario formal | OP-USR-002, OP-AZC-002, OP-AZC-004 | SCREEN-USERS | T-FL-IDT-002 | AC-OP-USR-002, AC-OP-AZC-002, AC-OP-AZC-004 | — |
| FL-IDT-003 | Promoción de temporal por alta formal | OP-USR-002 | SCREEN-USERS | T-FL-IDT-003 | AC-OP-USR-002 | F-05 no aplica: RUT coincidente promueve |
| FL-IDT-004 | Alta de usuario temporal | OP-USR-012 | SCREEN-USERS | T-FL-IDT-004 | AC-OP-USR-012 | Rotular «no inicia sesión» |
| FL-IDT-005 | Edición de usuario | OP-USR-004, OP-USR-005 | SCREEN-USER-DETAIL | T-FL-IDT-005 | AC-OP-USR-004, AC-OP-USR-005 | — |
| FL-IDT-006 | Eliminación de usuario | OP-USR-006 | SCREEN-USER-DETAIL | T-FL-IDT-006 | AC-OP-USR-006 | Efecto `disable_users` |
| FL-IDT-007 | Asignación principal | OP-USR-007, OP-USR-008, OP-AZC-002, OP-AZC-004 | SCREEN-USER-DETAIL — modal | T-FL-IDT-007 | AC-OP-USR-007, AC-OP-USR-008, AC-OP-AZC-002, AC-OP-AZC-004 | Respuesta efectiva manda |
| FL-IDT-008 | Desactivación de asignación principal | OP-USR-009 | SCREEN-USER-DETAIL — panel asignaciones | T-FL-IDT-008 | AC-OP-USR-009 | Tirador implícito preservado/recreado |
| FL-IDT-009 | Alta de asignación secundaria | OP-USR-010 | SCREEN-USER-DETAIL — panel asignaciones | T-FL-IDT-009 | AC-OP-USR-010 | `201` y `200` idempotente = éxito |
| FL-IDT-010 | Baja de asignación | OP-USR-011 | SCREEN-USER-DETAIL — panel asignaciones | T-FL-IDT-010 | AC-OP-USR-011 | Restauración de tirador si era la última |
| FL-IDT-011 | Consulta de puestos e histórico | OP-POS-001, OP-POS-003, OP-POS-009 | SCREEN-POSITIONS, SCREEN-POSITION-DETAIL | T-FL-IDT-011 | AC-OP-POS-001, AC-OP-POS-003, AC-OP-POS-009 | — |
| FL-IDT-012 | Alta y edición de puesto | OP-POS-002, OP-POS-004, OP-POS-005 | SCREEN-POSITIONS | T-FL-IDT-012 | AC-OP-POS-002, AC-OP-POS-004, AC-OP-POS-005 | `recinto` sólo con `todo_recinto` |
| FL-IDT-013 | Eliminación de puesto | OP-POS-006 | SCREEN-POSITIONS | T-FL-IDT-013 | AC-OP-POS-006 | — |
| FL-IDT-014 | Asignación de holder | OP-POS-007 | SCREEN-POSITION-DETAIL — panel holders | T-FL-IDT-014 | AC-OP-POS-007 | Puesto único: consecuencia visible |
| FL-IDT-015 | Baja de holder | OP-POS-008 | SCREEN-POSITION-DETAIL — panel holders | T-FL-IDT-015 | AC-OP-POS-008 | ST-10 obligatoria |
| FL-IDT-016 | Alta y edición de membership | OP-MEM-002, OP-MEM-004, OP-MEM-005 | SCREEN-MEMBERSHIPS | T-FL-IDT-016 | AC-OP-MEM-002, AC-OP-MEM-004, AC-OP-MEM-005 | Permiso derivado de `(position, action)` |
| FL-IDT-017 | Baja de membership y cambio de primaria | OP-MEM-006, OP-MEM-004, OP-MEM-005 | SCREEN-MEMBERSHIPS | T-FL-IDT-017 | AC-OP-MEM-006, AC-OP-MEM-004, AC-OP-MEM-005 | Contexto refrescado antes de unidad efectiva |

## Autorización y auditoría (14)

| FL | Flujo | OP principales | SCREEN(s) | Tarea | Criterio | Reserva |
|---|---|---|---|---|---|---|
| FL-AZ-001 | Consulta de roles | OP-ROL-001, OP-ROL-003 | SCREEN-ROLES | T-FL-AZ-001 | AC-OP-ROL-001, AC-OP-ROL-003 | — |
| FL-AZ-002 | Alta y edición de rol | OP-ROL-002, OP-ROL-004, OP-ROL-005 | SCREEN-ROLES | T-FL-AZ-002 | AC-OP-ROL-002, AC-OP-ROL-004, AC-OP-ROL-005 | Sólo `IsTenantAdmin` |
| FL-AZ-003 | Eliminación de rol | OP-ROL-006 | SCREEN-ROLES | T-FL-AZ-003 | AC-OP-ROL-006 | `IsTenantAdmin`; `is_system` informativo |
| FL-AZ-004 | Catálogos de scopes y permisos | OP-SCP-001, OP-SCP-002, OP-PRM-001, OP-PRM-002 | SCREEN-SCOPES, SCREEN-PERMISSIONS (pestaña catálogo) | T-FL-AZ-004 | AC-OP-SCP-001, AC-OP-SCP-002, AC-OP-PRM-001, AC-OP-PRM-002 | Sólo lectura |
| FL-AZ-005 | Gestión de RolePermission | OP-RPR-001…006, OP-AZC-001 | SCREEN-PERMISSIONS — matriz rol→permiso | T-FL-AZ-005 | AC-OP-RPR-001…006, AC-OP-AZC-001 | Rol de sistema sólo `super_admin` |
| FL-AZ-006 | Gestión de PositionPermission | OP-PPR-001…006, OP-AZC-001 | SCREEN-PERMISSIONS — matriz puesto→permiso | T-FL-AZ-006 | AC-OP-PPR-001…006, AC-OP-AZC-001 | Sólo `IsTenantAdmin` |
| FL-AZ-007 | Alta y edición de override | OP-OVR-002, OP-OVR-004, OP-OVR-005 | SCREEN-OVERRIDES | T-FL-AZ-007 | AC-OP-OVR-002, AC-OP-OVR-004, AC-OP-OVR-005 | `created_by` RO |
| FL-AZ-008 | Eliminación de override | OP-OVR-006 | SCREEN-OVERRIDES | T-FL-AZ-008 | AC-OP-OVR-006 | — |
| FL-AZ-009 | Consulta de overrides | OP-OVR-001, OP-OVR-003 | SCREEN-OVERRIDES | T-FL-AZ-009 | AC-OP-OVR-001, AC-OP-OVR-003 | — |
| FL-AZ-010 | Fill de matriz con catálogo authz | OP-AZC-001 | SCREEN-PERMISSIONS | T-FL-AZ-010 | AC-OP-AZC-001 | No sustituye `context.permissions` |
| FL-AZ-011 | Categorías de roles | OP-AZC-002 | Integrado: modales de asignación de SCREEN-USER-DETAIL y alta de SCREEN-USERS | T-FL-AZ-011 | AC-OP-AZC-002 | Vacío ≠ roles fuera de alcance |
| FL-AZ-012 | Personas por unidad | OP-AZC-003 | SCREEN-PERMISSIONS — pestaña personas por unidad | T-FL-AZ-012 | AC-OP-AZC-003 | Excluye tirador implícito |
| FL-AZ-013 | Unidades elegibles por persona | OP-AZC-004 | Integrado: selector en SCREEN-USERS y SCREEN-USER-DETAIL | T-FL-AZ-013 | AC-OP-AZC-004 | `reason` como restricción, no lista vacía |
| FL-AUD-001 | Bitácora de auditoría | OP-AUT-004 | SCREEN-AUDIT | T-FL-AUD-001 | AC-OP-AUT-004 | Restringida a `tenant_admin`/`super_admin`/`auditor` |

## Armería, armas y calibres (9)

| FL | Flujo | OP principales | SCREEN(s) | Tarea | Criterio | Reserva |
|---|---|---|---|---|---|---|
| FL-ARM-001 | Consulta de armerías | OP-ARM-001, OP-ARM-003 | SCREEN-ARMORIES | T-FL-ARM-001 | AC-OP-ARM-001, AC-OP-ARM-003 | — |
| FL-ARM-002 | Alta y edición de armería | OP-ARM-002, OP-ARM-004, OP-ARM-005 | SCREEN-ARMORIES | T-FL-ARM-002 | AC-OP-ARM-002, AC-OP-ARM-004, AC-OP-ARM-005 | — |
| FL-ARM-003 | Eliminación de armería | OP-ARM-006 | SCREEN-ARMORIES | T-FL-ARM-003 | AC-OP-ARM-006 | Sin reasignación prometida |
| FL-WPN-001 | Consulta de armas | OP-WPN-001, OP-WPN-003 | SCREEN-WEAPONS, SCREEN-WEAPON-DETAIL | T-FL-WPN-001 | AC-OP-WPN-001, AC-OP-WPN-003 | — |
| FL-WPN-002 | Alta de arma | OP-WPN-002, OP-ARM-001, OP-CAL-001 | SCREEN-WEAPONS | T-FL-WPN-002 | AC-OP-WPN-002, AC-OP-ARM-001, AC-OP-CAL-001 | Selectores reales obligatorios |
| FL-WPN-003 | Edición de arma | OP-WPN-004, OP-WPN-005 | SCREEN-WEAPON-DETAIL | T-FL-WPN-003 | AC-OP-WPN-004, AC-OP-WPN-005 | — |
| FL-WPN-004 | Eliminación de arma | OP-WPN-006 | SCREEN-WEAPON-DETAIL | T-FL-WPN-004 | AC-OP-WPN-006 | D-02: transferencia de stock no se simula |
| FL-CAL-001 | Consulta de calibres | OP-CAL-001, OP-CAL-003 | SCREEN-CALIBERS | T-FL-CAL-001 | AC-OP-CAL-001, AC-OP-CAL-003 | Catálogo global |
| FL-CAL-002 | Gestión de calibres | OP-CAL-002, OP-CAL-004, OP-CAL-005, OP-CAL-006 | SCREEN-CALIBERS | T-FL-CAL-002 | AC-OP-CAL-002, AC-OP-CAL-004…006 | Sólo `manage_calibre` + `super_admin` |

## Tiro: polígonos y lecciones (12) · fracciones y captura (7)

| FL | Flujo | OP principales | SCREEN(s) | Tarea | Criterio | Reserva |
|---|---|---|---|---|---|---|
| FL-SHT-001 | Consulta de polígonos | OP-RNG-001, OP-RNG-003 | SCREEN-RANGES, SCREEN-RANGE-DETAIL | T-FL-SHT-001 | AC-OP-RNG-001, AC-OP-RNG-003 | — |
| FL-SHT-002 | Alta y edición de polígono | OP-RNG-002, OP-RNG-004, OP-RNG-005 | SCREEN-RANGES, SCREEN-RANGE-DETAIL | T-FL-SHT-002 | AC-OP-RNG-002, AC-OP-RNG-004, AC-OP-RNG-005 | — |
| FL-SHT-003 | Eliminación de polígono (restringida) | OP-RNG-006 | SCREEN-RANGE-DETAIL | T-FL-SHT-003 | AC-OP-RNG-006 | Sin mapa `range:delete`: no ofrecida como disponible |
| FL-SHT-004 | Lecciones del polígono | OP-RNG-007 | SCREEN-RANGE-DETAIL | T-FL-SHT-004 | AC-OP-RNG-007 | — |
| FL-SHT-005 | Alta de lección | OP-LES-002 | SCREEN-LESSONS | T-FL-SHT-005 | AC-OP-LES-002 | Sin participantes → unidad efectiva devuelta |
| FL-SHT-006 | Edición de lección | OP-LES-004, OP-LES-005 | SCREEN-LESSON-DETAIL | T-FL-SHT-006 | AC-OP-LES-004, AC-OP-LES-005 | — |
| FL-SHT-007 | Eliminación de lección | OP-LES-006 | SCREEN-LESSON-DETAIL | T-FL-SHT-007 | AC-OP-LES-006 | Refresco sólo tras éxito |
| FL-SHT-008 | Ficha: fracciones y tiradores | OP-LES-007, OP-LES-008 | SCREEN-LESSON-DETAIL — pestañas | T-FL-SHT-008 | AC-OP-LES-007, AC-OP-LES-008 | — |
| FL-SHT-009 | Resultados detallados de lección | OP-LES-009 | SCREEN-LESSON-DETAIL — pestaña resultados | T-FL-SHT-009 | AC-OP-LES-009 | **B-01**: fallo como ST-04 explícito; resumen/reporte no sustituyen detalle |
| FL-SHT-010 | Resumen de lección | OP-LES-010 | SCREEN-LESSON-DETAIL — pestaña resumen | T-FL-SHT-010 | AC-OP-LES-010 | — |
| FL-SHT-011 | Reporte de lección | OP-LES-011 | SCREEN-LESSON-DETAIL — pestaña reporte | T-FL-SHT-011 | AC-OP-LES-011 | `aggregate_only` respeta desgloses |
| FL-SHT-012 | Tiradores elegibles | OP-LES-012 | SCREEN-LESSON-DETAIL — selector participantes | T-FL-SHT-012 | AC-OP-LES-012 | No se convierte en alta de usuario |
| FL-SHT-013 | Alta y edición de fracción | OP-FRC-002, OP-FRC-004, OP-FRC-005 | SCREEN-LESSON-DETAIL — modales pestaña fracciones | T-FL-SHT-013 | AC-OP-FRC-002, AC-OP-FRC-004, AC-OP-FRC-005 | — |
| FL-SHT-014 | Eliminación de fracción | OP-FRC-006 | SCREEN-LESSON-DETAIL | T-FL-SHT-014 | AC-OP-FRC-006 | Sin borrado local de resultados antes del éxito |
| FL-SHT-015 | Preparación de captura de fracción | OP-FRC-007 | SCREEN-RESULTS-CAPTURE, SCREEN-FRACTION-DETAIL | T-FL-SHT-015 | AC-OP-FRC-007 | Selectores reales; vacío = ST-03 |
| FL-SHT-016 | Alta de resultado (captura por carril) | OP-RES-002 | SCREEN-RESULTS-CAPTURE | T-FL-SHT-016 | AC-OP-RES-002 | D-02: validación de resultados no se simula |
| FL-SHT-017 | Edición de resultado | OP-RES-004, OP-RES-005 | SCREEN-RESULTS-CAPTURE | T-FL-SHT-017 | AC-OP-RES-004, AC-OP-RES-005 | — |
| FL-SHT-018 | Eliminación de resultado | OP-RES-006 | SCREEN-RESULTS-CAPTURE | T-FL-SHT-018 | AC-OP-RES-006 | Sin recálculo local de métricas |
| FL-SHT-019 | Detalle de resultados de fracción | OP-FRC-008 | SCREEN-FRACTION-DETAIL | T-FL-SHT-019 | AC-OP-FRC-008 | `403` separa captura y detalle |

## Ejercicios y consumos (8)

| FL | Flujo | OP principales | SCREEN(s) | Tarea | Criterio | Reserva |
|---|---|---|---|---|---|---|
| FL-EXC-001 | Consulta de ejercicios | OP-EJR-001, OP-EJR-003 | SCREEN-EXERCISES, SCREEN-EXERCISE-DETAIL | T-FL-EXC-001 | AC-OP-EJR-001, AC-OP-EJR-003 | — |
| FL-EXC-002 | Alta y edición de ejercicio | OP-EJR-002, OP-EJR-004, OP-EJR-005 | SCREEN-EXERCISES, SCREEN-EXERCISE-DETAIL | T-FL-EXC-002 | AC-OP-EJR-002, AC-OP-EJR-004, AC-OP-EJR-005 | — |
| FL-EXC-003 | Eliminación de ejercicio | OP-EJR-006 | SCREEN-EXERCISE-DETAIL | T-FL-EXC-003 | AC-OP-EJR-006 | Sin cascada prometida |
| FL-CMN-001 | Consulta de consumos de munición | OP-CMN-001, OP-CMN-003 | SCREEN-AMMO-CONSUMPTION | T-FL-CMN-001 | AC-OP-CMN-001, AC-OP-CMN-003 | Sólo tenant |
| FL-CMN-002 | Alta y edición de consumo de munición | OP-CMN-002, OP-CMN-004, OP-CMN-005 | SCREEN-AMMO-CONSUMPTION | T-FL-CMN-002 | AC-OP-CMN-002, AC-OP-CMN-004, AC-OP-CMN-005 | Calibre de catálogo activo |
| FL-CMN-003 | Eliminación de consumo de munición | OP-CMN-006 | SCREEN-AMMO-CONSUMPTION | T-FL-CMN-003 | AC-OP-CMN-006 | Sin ceros falsos |
| FL-CAR-001 | Alta y edición de consumo de arma | OP-CAR-002, OP-CAR-004, OP-CAR-005 | SCREEN-WEAPON-CONSUMPTION | T-FL-CAR-001 | AC-OP-CAR-002, AC-OP-CAR-004, AC-OP-CAR-005 | — |
| FL-CAR-002 | Eliminación de consumo de arma | OP-CAR-006 | SCREEN-WEAPON-CONSUMPTION | T-FL-CAR-002 | AC-OP-CAR-006 | Sin stock supuesto |

## Apariencia (8)

| FL | Flujo | OP principales | SCREEN(s) | Tarea | Criterio | Reserva |
|---|---|---|---|---|---|---|
| FL-APP-001 | Restauración de apariencia antes de ready | ruta de 8 ejes §5.3 (GET) — **existe** (verificado 2026-10-15) | SCREEN-PERSONALIZER (+ arranque autenticado) | T-FL-APP-001 | **AC-FL-APP-001** (sin OP) | Ejecutada: spec `approved` (2026-10-02) y excepción acotada ejecutada (verificado 2026-10-15) |
| FL-APP-002 | Cambio de eje: preview y autosave | ruta de 8 ejes §5.3 (PUT) — **existe** (verificado 2026-10-15) | SCREEN-PERSONALIZER | T-FL-APP-002 | **AC-FL-APP-002** (sin OP) | Ídem |
| FL-APP-003 | Reset a defaults | ruta de 8 ejes §5.3 (DELETE) — **existe** (verificado 2026-10-15) | SCREEN-PERSONALIZER | T-FL-APP-003 | **AC-FL-APP-003** (sin OP) | Ídem |
| FL-APP-004 | Error de guardado o lectura | ruta de 8 ejes §5.3 — **existe** (verificado 2026-10-15) | SCREEN-PERSONALIZER | T-FL-APP-004 | **AC-FL-APP-004** (sin OP) | Ídem; `403` no cierra sesión (R-SES-012) |
| FL-APP-005 | Logout y cambio de principal | ninguna (purga local) | Sin pantalla: comportamiento de stores ante FL-SES-005 (navigation.md §Sesión) | T-FL-APP-005 | **AC-FL-APP-005** (sin OP) | — |
| FL-APP-006 | Cambio de unidad activa (conserva) | ninguna (conservación local) | SCREEN-CONTEXT (conservación ante FL-SES-004) | T-FL-APP-006 | **AC-FL-APP-006** (sin OP) | — |
| FL-APP-007 | Modo público: defaults sin persistencia | ninguna | Superficies públicas: SCREEN-LOGIN, SCREEN-RECOVERY, SCREEN-NOT-FOUND | T-FL-APP-007 | **AC-FL-APP-007** (sin OP) | — |
| FL-APP-008 | Ruta legacy de tres campos (separada) | OP-PRF-001, OP-PRF-002 | SCREEN-PERSONALIZER — trazada como legado | T-FL-APP-008 | AC-OP-PRF-001, AC-OP-PRF-002 | Legacy: no gobierna los 8 ejes; sin traducción ni migración (R-APAR-002) |

---

## Verificación de conteo

🕯️ Filas por familia: SES 6 · RCV 1 · PWD 5 · ORG 12 · IDT 17 · AZ 13 · AUD 1 · ARM 3 · WPN 4 · CAL 2 · SHT 19 · EXC 3 · CMN 3 · CAR 2 · APP 8 = **99 FL** canónicos de [experience/flows.md](../experience/flows.md) §Índice canónico. Los 8 flujos sin OP (FL-SES-006, FL-APP-001…007) reciben criterio `AC-FL-*` por convención; los 91 restantes citan los `AC-OP-*` de sus OP principales. Las elipsis expanden a IDs individuales de [coverage/operations.md](operations.md). Los `T-*`/`AC-*` son punteros, no artefactos entregados.
