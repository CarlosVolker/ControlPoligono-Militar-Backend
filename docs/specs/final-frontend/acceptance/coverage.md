---
spec_meta: "../spec-meta.yaml"
---

# Cobertura del conjunto de aceptación — tablas de punteros

> 📖 Volumen del conjunto de aceptación `acceptance/` (método y convenciones en [`core.md`](core.md); estado, gates y autorizaciones en [`../verification.md`](../verification.md)).
> Estado global: **NO EJECUTADO**. Este archivo **no copia catálogos**: cada fila es un
> puntero a los IDs canónicos de sus fuentes durables — OP de
> [`../backend-inventory.md`](../backend-inventory.md), FL de
> [`../experience/flows.md`](../experience/flows.md), SCREEN de
> [`../experience/screens.md`](../experience/screens.md), R de
> [`../requirements/`](../requirements/shared-session-data.md) — hacia los criterios
> `AC-*` de los volúmenes hermanos. Cobertura contada, no afirmada de memoria: los
> totales de cada tabla se verifican contra el universo de su fuente.

## Universos y equivalencias contadas

| Universo | Fuente | Total | Criterios que lo cubren |
|---|---|---:|---|
| Operaciones `OP-*` | `../backend-inventory.md` §Manifest | **162** (161 de negocio + `OP-AUT-006` infra) | Un `AC-OP-<OP-ID>` por operación, biunívoco por construcción de ID: 162 AC-OP. `OP-AUT-006` ⇒ criterio de infraestructura sin UI |
| Flujos `FL-*` | `../experience/flows.md` §Índice canónico | **99** | Tabla FL → AC de este archivo: cada FL tiene escenario AC-OP y/o AC-FL |
| Pantallas `SCREEN-*` | `../experience/screens.md` §Pantallas canónicas | **36** | Tabla SCREEN → AC de este archivo: cada SCREEN tiene criterios que se materializan en ella |
| Requisitos `R-DOM-*`, `R-SES-*`, `R-APAR-*` | `../requirements/*.md` | **140** (92 DOM + 25 SES + 23 APAR) | Tabla R → AC de este archivo: 138 trazados, 2 reservados con definición (`R-APAR-004`, `R-DOM-EXC-014` — ver filas) |
| Estados `ST-*` y perfiles `P-*` | `../experience/states.md` | 11 ST, 9 P | Heredados por cada AC vía el perfil de su OP; sin criterios propios (son la gramática de los observables) |

**Conteo AC-OP por familia (suma = 162 ≡ manifiesto):** USR 16 · WPN 6 · RNG 7 · LES 12 ·
FRC 8 · RES 6 · ROL 6 · SCP 2 · PRM 2 · RPR 6 · PPR 6 · OVR 6 · UNT 10 · RCT 8 · ARM 6 ·
POS 9 · MEM 6 · CAL 6 · EJR 6 · CMN 6 · CAR 6 · AUT 6 · RCV 4 · PRF 2 · AZC 4.
Además: **8 AC-FL** (SES-006, APP-001…007) y **5 AC-CORE** (TYPES, HTTP, SESSION, ROUTER,
UI). Total del conjunto: **175 criterios**.

> Los `AC-*` son observaciones, no tareas. El stream de tareas (otro writer) usa
> `T-<FL-ID>` por cada uno de los 99 FL y `T-CORE-*` para el núcleo: el cruce
> AC ↔ T lo hace el integrador; este archivo no lee ni copia `tasks.md`.

---

## Tabla FL → AC (99 flujos)

| FL | Escenario(s) AC que lo cubren |
|---|---|
| FL-SES-001 | AC-OP-AUT-001 (+ AC-OP-AUT-002 en el paso 2b) |
| FL-SES-002 | AC-OP-AUT-002, AC-CORE-ROUTER, AC-CORE-SESSION |
| FL-SES-003 | AC-OP-AUT-002, AC-OP-AUT-003 |
| FL-SES-004 | AC-OP-AUT-003, AC-OP-AUT-002, AC-CORE-SESSION, AC-FL-APP-006 |
| FL-SES-005 | AC-OP-AUT-005, AC-CORE-SESSION, AC-FL-APP-005 |
| FL-SES-006 | AC-FL-SES-006, AC-CORE-SESSION, AC-CORE-ROUTER |
| FL-RCV-001 | AC-OP-RCV-001, AC-OP-RCV-002, AC-OP-RCV-003, AC-OP-RCV-004 |
| FL-PWD-001 | AC-OP-USR-013 (forzado), AC-OP-AUT-002 (refresco de bandera), AC-CORE-SESSION |
| FL-PWD-002 | AC-OP-USR-013 (propio normal) |
| FL-PWD-003 | AC-OP-USR-014 |
| FL-PWD-004 | AC-OP-USR-015 |
| FL-PWD-005 | AC-OP-USR-016 |
| FL-ORG-001 | AC-OP-UNT-001, AC-OP-UNT-003 |
| FL-ORG-002 | AC-OP-UNT-002, AC-OP-UNT-010 |
| FL-ORG-003 | AC-OP-UNT-004, AC-OP-UNT-005 |
| FL-ORG-004 | AC-OP-UNT-007 |
| FL-ORG-005 | AC-OP-UNT-008, AC-OP-UNT-010 |
| FL-ORG-006 | AC-OP-UNT-009 |
| FL-ORG-007 | AC-OP-UNT-010 |
| FL-ORG-008 | AC-OP-RCT-001, AC-OP-RCT-003 |
| FL-ORG-009 | AC-OP-RCT-002, AC-OP-RCT-004, AC-OP-RCT-005 |
| FL-ORG-010 | AC-OP-RCT-006 |
| FL-ORG-011 | AC-OP-RCT-007 |
| FL-ORG-012 | AC-OP-RCT-008 |
| FL-IDT-001 | AC-OP-USR-001, AC-OP-USR-003 |
| FL-IDT-002 | AC-OP-USR-002, AC-OP-AZC-002, AC-OP-AZC-004 |
| FL-IDT-003 | AC-OP-USR-002 (promoción con advertencia previa) |
| FL-IDT-004 | AC-OP-USR-012 |
| FL-IDT-005 | AC-OP-USR-004, AC-OP-USR-005 |
| FL-IDT-006 | AC-OP-USR-006 |
| FL-IDT-007 | AC-OP-USR-007, AC-OP-USR-008, AC-OP-AZC-002, AC-OP-AZC-004, AC-OP-SCP-001 |
| FL-IDT-008 | AC-OP-USR-009 |
| FL-IDT-009 | AC-OP-USR-010 |
| FL-IDT-010 | AC-OP-USR-011 |
| FL-IDT-011 | AC-OP-POS-001, AC-OP-POS-003, AC-OP-POS-009 |
| FL-IDT-012 | AC-OP-POS-002, AC-OP-POS-004, AC-OP-POS-005 |
| FL-IDT-013 | AC-OP-POS-006 |
| FL-IDT-014 | AC-OP-POS-007 |
| FL-IDT-015 | AC-OP-POS-008 |
| FL-IDT-016 | AC-OP-MEM-002, AC-OP-MEM-004, AC-OP-MEM-005, AC-OP-MEM-003 |
| FL-IDT-017 | AC-OP-MEM-006, AC-OP-MEM-005 |
| FL-AZ-001 | AC-OP-ROL-001, AC-OP-ROL-003 |
| FL-AZ-002 | AC-OP-ROL-002, AC-OP-ROL-004, AC-OP-ROL-005 |
| FL-AZ-003 | AC-OP-ROL-006 |
| FL-AZ-004 | AC-OP-SCP-001, AC-OP-SCP-002, AC-OP-PRM-001, AC-OP-PRM-002 |
| FL-AZ-005 | AC-OP-RPR-001…006 (uno por OP), AC-OP-AZC-001 |
| FL-AZ-006 | AC-OP-PPR-001…006 (uno por OP), AC-OP-AZC-001 |
| FL-AZ-007 | AC-OP-OVR-002, AC-OP-OVR-004, AC-OP-OVR-005 |
| FL-AZ-008 | AC-OP-OVR-006 |
| FL-AZ-009 | AC-OP-OVR-001, AC-OP-OVR-003 |
| FL-AZ-010 | AC-OP-AZC-001 |
| FL-AZ-011 | AC-OP-AZC-002 |
| FL-AZ-012 | AC-OP-AZC-003 |
| FL-AZ-013 | AC-OP-AZC-004 |
| FL-AUD-001 | AC-OP-AUT-004 |
| FL-ARM-001 | AC-OP-ARM-001, AC-OP-ARM-003 |
| FL-ARM-002 | AC-OP-ARM-002, AC-OP-ARM-004, AC-OP-ARM-005 |
| FL-ARM-003 | AC-OP-ARM-006 |
| FL-WPN-001 | AC-OP-WPN-001, AC-OP-WPN-003 |
| FL-WPN-002 | AC-OP-WPN-002, AC-OP-ARM-001 (selector), AC-OP-CAL-001 (selector) |
| FL-WPN-003 | AC-OP-WPN-004, AC-OP-WPN-005 |
| FL-WPN-004 | AC-OP-WPN-006 |
| FL-CAL-001 | AC-OP-CAL-001, AC-OP-CAL-003 |
| FL-CAL-002 | AC-OP-CAL-002, AC-OP-CAL-004, AC-OP-CAL-005, AC-OP-CAL-006 |
| FL-SHT-001 | AC-OP-RNG-001, AC-OP-RNG-003 |
| FL-SHT-002 | AC-OP-RNG-002, AC-OP-RNG-004, AC-OP-RNG-005 |
| FL-SHT-003 | AC-OP-RNG-006 (restringida: sin acción disponible por defecto) |
| FL-SHT-004 | AC-OP-RNG-007 |
| FL-SHT-005 | AC-OP-LES-002 |
| FL-SHT-006 | AC-OP-LES-004, AC-OP-LES-005 |
| FL-SHT-007 | AC-OP-LES-006 |
| FL-SHT-008 | AC-OP-LES-007, AC-OP-LES-008 |
| FL-SHT-009 | AC-OP-LES-009 |
| FL-SHT-010 | AC-OP-LES-010 |
| FL-SHT-011 | AC-OP-LES-011 |
| FL-SHT-012 | AC-OP-LES-012 |
| FL-SHT-013 | AC-OP-FRC-002, AC-OP-FRC-004, AC-OP-FRC-005 |
| FL-SHT-014 | AC-OP-FRC-006 |
| FL-SHT-015 | AC-OP-FRC-007 (+ AC-OP-USR-012 en el paso 3) |
| FL-SHT-016 | AC-OP-RES-002 |
| FL-SHT-017 | AC-OP-RES-004, AC-OP-RES-005 |
| FL-SHT-018 | AC-OP-RES-006 |
| FL-SHT-019 | AC-OP-FRC-008 |
| FL-EXC-001 | AC-OP-EJR-001, AC-OP-EJR-003 |
| FL-EXC-002 | AC-OP-EJR-002, AC-OP-EJR-004, AC-OP-EJR-005 |
| FL-EXC-003 | AC-OP-EJR-006 |
| FL-CMN-001 | AC-OP-CMN-001, AC-OP-CMN-003 |
| FL-CMN-002 | AC-OP-CMN-002, AC-OP-CMN-004, AC-OP-CMN-005 |
| FL-CMN-003 | AC-OP-CMN-006 |
| FL-CAR-001 | AC-OP-CAR-002, AC-OP-CAR-004, AC-OP-CAR-005 |
| FL-CAR-002 | AC-OP-CAR-006 |
| FL-APP-001 | AC-FL-APP-001 (futuro: ruta propuesta) |
| FL-APP-002 | AC-FL-APP-002 (futuro: ruta propuesta) |
| FL-APP-003 | AC-FL-APP-003 (futuro: ruta propuesta) |
| FL-APP-004 | AC-FL-APP-004 (futuro: ruta propuesta) |
| FL-APP-005 | AC-FL-APP-005 |
| FL-APP-006 | AC-FL-APP-006 |
| FL-APP-007 | AC-FL-APP-007 |
| FL-APP-008 | AC-OP-PRF-001, AC-OP-PRF-002 (legacy, separado de los 8 ejes) |

---

## Tabla SCREEN → AC (36 pantallas)

| SCREEN | AC que se materializan en ella |
|---|---|
| SCREEN-LOGIN | AC-OP-AUT-001, AC-FL-APP-007, AC-CORE-ROUTER, AC-CORE-UI |
| SCREEN-RECOVERY | AC-OP-RCV-001, AC-OP-RCV-002, AC-OP-RCV-003, AC-OP-RCV-004, AC-FL-APP-007, AC-CORE-UI |
| SCREEN-PASSWORD-FORCED | AC-OP-USR-013 (forzado), AC-OP-AUT-002 (refresco), AC-CORE-SESSION, AC-CORE-ROUTER |
| SCREEN-CONTEXT | AC-OP-AUT-002, AC-OP-AUT-003, AC-CORE-UI |
| SCREEN-DASHBOARD | AC-OP-AUT-002, AC-CORE-UI, AC-CORE-ROUTER |
| SCREEN-CONTEXT-LOST | AC-FL-SES-006, AC-CORE-ROUTER, AC-CORE-UI |
| SCREEN-NOT-FOUND | AC-CORE-ROUTER, AC-CORE-UI |
| SCREEN-PERSONALIZER | AC-FL-APP-001…004 (futuro), AC-FL-APP-005…007, AC-OP-PRF-001/002 (traza legacy), AC-CORE-UI |
| SCREEN-USERS | AC-OP-USR-001, AC-OP-USR-002, AC-OP-USR-012, AC-OP-AZC-004, AC-CORE-UI |
| SCREEN-USER-DETAIL | AC-OP-USR-003…011, AC-OP-USR-013 (otro), AC-OP-USR-014, AC-OP-USR-015, AC-OP-USR-016, AC-OP-AZC-002, AC-OP-AZC-004, AC-CORE-UI |
| SCREEN-POSITIONS | AC-OP-POS-001, AC-OP-POS-002, AC-OP-POS-004, AC-OP-POS-005, AC-OP-POS-006, AC-CORE-UI |
| SCREEN-POSITION-DETAIL | AC-OP-POS-003, AC-OP-POS-004/005 (edición desde ficha), AC-OP-POS-007, AC-OP-POS-008, AC-OP-POS-009, AC-CORE-UI |
| SCREEN-MEMBERSHIPS | AC-OP-MEM-001…006, AC-CORE-UI |
| SCREEN-UNITS | AC-OP-UNT-001, AC-OP-UNT-002, AC-OP-UNT-009 (selector), AC-CORE-UI |
| SCREEN-UNIT-DETAIL | AC-OP-UNT-003, AC-OP-UNT-004, AC-OP-UNT-005, AC-OP-UNT-006, AC-OP-UNT-007, AC-OP-UNT-008, AC-OP-UNT-010 (selector), AC-CORE-UI |
| SCREEN-PRECINCTS | AC-OP-RCT-001, AC-OP-RCT-002, AC-OP-RCT-004, AC-OP-RCT-005, AC-OP-RCT-006, AC-CORE-UI |
| SCREEN-PRECINCT-DETAIL | AC-OP-RCT-003, AC-OP-RCT-004/005 (edición desde ficha), AC-OP-RCT-007, AC-OP-RCT-008, AC-OP-UNT-009 (selector), AC-CORE-UI |
| SCREEN-ROLES | AC-OP-ROL-001…006, AC-CORE-UI |
| SCREEN-SCOPES | AC-OP-SCP-001, AC-OP-SCP-002, AC-CORE-UI |
| SCREEN-PERMISSIONS | AC-OP-PRM-001, AC-OP-PRM-002, AC-OP-RPR-001…006, AC-OP-PPR-001…006, AC-OP-AZC-001, AC-OP-AZC-003, AC-CORE-UI |
| SCREEN-OVERRIDES | AC-OP-OVR-001…006, AC-CORE-UI |
| SCREEN-AUDIT | AC-OP-AUT-004, AC-CORE-UI |
| SCREEN-ARMORIES | AC-OP-ARM-001…006, AC-CORE-UI |
| SCREEN-WEAPONS | AC-OP-WPN-001, AC-OP-WPN-002, AC-CORE-UI |
| SCREEN-WEAPON-DETAIL | AC-OP-WPN-003, AC-OP-WPN-004, AC-OP-WPN-005, AC-OP-WPN-006, AC-CORE-UI |
| SCREEN-CALIBERS | AC-OP-CAL-001…006, AC-CORE-UI |
| SCREEN-RANGES | AC-OP-RNG-001, AC-OP-RNG-002, AC-CORE-UI |
| SCREEN-RANGE-DETAIL | AC-OP-RNG-003, AC-OP-RNG-004, AC-OP-RNG-005, AC-OP-RNG-006 (ausencia de acción), AC-OP-RNG-007, AC-CORE-UI |
| SCREEN-LESSONS | AC-OP-LES-001, AC-OP-LES-002, AC-CORE-UI |
| SCREEN-LESSON-DETAIL | AC-OP-LES-003…012, AC-OP-FRC-001, AC-OP-FRC-002, AC-OP-FRC-004, AC-OP-FRC-005, AC-OP-FRC-006, AC-CORE-UI |
| SCREEN-FRACTION-DETAIL | AC-OP-FRC-003, AC-OP-FRC-004/005 (edición), AC-OP-FRC-006, AC-OP-FRC-007, AC-OP-FRC-008, AC-CORE-UI |
| SCREEN-RESULTS-CAPTURE | AC-OP-RES-001…006, AC-OP-FRC-003 (contexto deep link), AC-OP-FRC-007, AC-OP-USR-012 (alta temporal en captura), AC-CORE-UI |
| SCREEN-EXERCISES | AC-OP-EJR-001, AC-OP-EJR-002, AC-CORE-UI |
| SCREEN-EXERCISE-DETAIL | AC-OP-EJR-003, AC-OP-EJR-004, AC-OP-EJR-005, AC-OP-EJR-006, AC-CORE-UI |
| SCREEN-AMMO-CONSUMPTION | AC-OP-CMN-001…006, AC-CORE-UI |
| SCREEN-WEAPON-CONSUMPTION | AC-OP-CAR-001…006, AC-CORE-UI |

Sin superficie: `OP-AUT-005` (acción de shell), `OP-AUT-006` (infra), `OP-UNT-009/010` y
`OP-AZC-002/004` (selectores integrados), `OP-PRF-001/002` (traza legacy) — todos con
criterio AC propio o integrado en la pantalla consumidora declarada arriba
(equivalente a `../experience/screens.md` §Integraciones sin pantalla propia).

---

## Tabla R → AC (140 requisitos estables)

Leyenda: **trazado** = al menos un AC observable lo cubre; **reservado** = criterio de
ausencia o restricción futura definida explícitamente, sin comprobación ejecutable hoy.

### R-DOM-ORG (17) — [`../requirements/organization.md`](../requirements/organization.md)

| R | AC | Estado |
|---|---|---|
| R-DOM-ORG-001 | AC-OP-UNT-001, AC-OP-UNT-003 | trazado |
| R-DOM-ORG-002 | AC-OP-UNT-001, AC-OP-UNT-003 | trazado |
| R-DOM-ORG-003 | AC-OP-UNT-002, AC-OP-UNT-010 | trazado |
| R-DOM-ORG-004 | AC-OP-UNT-002 | trazado |
| R-DOM-ORG-005 | AC-OP-UNT-002, AC-OP-UNT-004, AC-OP-UNT-005 | trazado |
| R-DOM-ORG-006 | AC-OP-UNT-002, AC-OP-UNT-004 (denegación sin cambio local) | trazado |
| R-DOM-ORG-007 | AC-OP-UNT-009 | trazado |
| R-DOM-ORG-008 | AC-OP-UNT-007 | trazado |
| R-DOM-ORG-009 | AC-OP-UNT-008 | trazado |
| R-DOM-ORG-010 | AC-OP-UNT-008 | trazado |
| R-DOM-ORG-011 | AC-OP-UNT-008 | trazado |
| R-DOM-ORG-012 | AC-OP-RCT-001, AC-OP-RCT-003 | trazado |
| R-DOM-ORG-013 | AC-OP-RCT-002, AC-OP-RCT-004, AC-OP-RCT-005 | trazado |
| R-DOM-ORG-014 | AC-OP-RCT-002, AC-OP-RCT-004, AC-OP-RCT-005 | trazado |
| R-DOM-ORG-015 | AC-OP-RCT-007 | trazado |
| R-DOM-ORG-016 | AC-OP-RCT-008 | trazado |
| R-DOM-ORG-017 | AC-OP-RCT-006 | trazado |

### R-DOM-ID (19) — [`../requirements/identity-authorization.md`](../requirements/identity-authorization.md)

| R | AC | Estado |
|---|---|---|
| R-DOM-ID-001 | AC-OP-USR-001, AC-OP-USR-003 | trazado |
| R-DOM-ID-002 | AC-OP-USR-002, AC-OP-USR-004, AC-OP-USR-005 | trazado |
| R-DOM-ID-003 | AC-OP-USR-002, AC-OP-USR-012 | trazado |
| R-DOM-ID-004 | AC-OP-USR-012 | trazado |
| R-DOM-ID-005 | AC-OP-USR-007, AC-OP-USR-008 | trazado |
| R-DOM-ID-006 | AC-OP-USR-009 | trazado |
| R-DOM-ID-007 | AC-OP-USR-010 | trazado |
| R-DOM-ID-008 | AC-OP-USR-011 | trazado |
| R-DOM-ID-009 | AC-OP-USR-013 | trazado |
| R-DOM-ID-010 | AC-OP-USR-014 | trazado |
| R-DOM-ID-011 | AC-OP-USR-015, AC-OP-USR-016 | trazado |
| R-DOM-ID-012 | AC-OP-USR-006 | trazado |
| R-DOM-ID-013 | AC-OP-POS-001, AC-OP-POS-003, AC-OP-POS-006 | trazado |
| R-DOM-ID-014 | AC-OP-POS-002, AC-OP-POS-004, AC-OP-POS-005 | trazado |
| R-DOM-ID-015 | AC-OP-POS-002 | trazado |
| R-DOM-ID-016 | AC-OP-POS-007 | trazado |
| R-DOM-ID-017 | AC-OP-POS-008, AC-OP-POS-009 | trazado |
| R-DOM-ID-018 | AC-OP-MEM-001, AC-OP-MEM-002, AC-OP-MEM-003, AC-OP-MEM-006 | trazado |
| R-DOM-ID-019 | AC-OP-MEM-004, AC-OP-MEM-005, AC-OP-MEM-006 | trazado |

### R-DOM-AZ (10) — [`../requirements/identity-authorization.md`](../requirements/identity-authorization.md)

| R | AC | Estado |
|---|---|---|
| R-DOM-AZ-001 | AC-OP-ROL-001…006 | trazado |
| R-DOM-AZ-002 | AC-OP-SCP-001, AC-OP-SCP-002, AC-OP-PRM-001, AC-OP-PRM-002 | trazado |
| R-DOM-AZ-003 | AC-OP-RPR-001…006 | trazado |
| R-DOM-AZ-004 | AC-OP-PPR-001…006 | trazado |
| R-DOM-AZ-005 | AC-OP-OVR-001…006 | trazado |
| R-DOM-AZ-006 | AC-OP-AZC-001 | trazado |
| R-DOM-AZ-007 | AC-OP-AZC-002 | trazado |
| R-DOM-AZ-008 | AC-OP-AZC-003 | trazado |
| R-DOM-AZ-009 | AC-OP-AZC-004 | trazado |
| R-DOM-AZ-010 | AC-OP-AUT-004 | trazado |

### R-DOM-ARM (12) — [`../requirements/armory.md`](../requirements/armory.md)

| R | AC | Estado |
|---|---|---|
| R-DOM-ARM-001 | AC-OP-ARM-001, AC-OP-ARM-003 | trazado |
| R-DOM-ARM-002 | AC-OP-ARM-002 | trazado |
| R-DOM-ARM-003 | AC-OP-ARM-004, AC-OP-ARM-005 | trazado |
| R-DOM-ARM-004 | AC-OP-ARM-002, AC-OP-ARM-004, AC-OP-ARM-006 | trazado |
| R-DOM-ARM-005 | AC-OP-WPN-001, AC-OP-WPN-003 | trazado |
| R-DOM-ARM-006 | AC-OP-WPN-002 | trazado |
| R-DOM-ARM-007 | AC-OP-WPN-004, AC-OP-WPN-005 | trazado |
| R-DOM-ARM-008 | AC-OP-WPN-002, AC-OP-WPN-004 | trazado |
| R-DOM-ARM-009 | AC-OP-WPN-006 | trazado |
| R-DOM-ARM-010 | AC-OP-CAL-001, AC-OP-CAL-003 | trazado |
| R-DOM-ARM-011 | AC-OP-CAL-001, AC-OP-CAL-002, AC-OP-CAL-004, AC-OP-CAL-005, AC-OP-CAL-006 | trazado |
| R-DOM-ARM-012 | AC-OP-CAL-002, AC-OP-CAL-004, AC-OP-CAL-005, AC-OP-CAL-006 | trazado |

### R-DOM-SHT (20) — [`../requirements/shooting.md`](../requirements/shooting.md)

| R | AC | Estado |
|---|---|---|
| R-DOM-SHT-001 | AC-OP-RNG-001, AC-OP-RNG-003 | trazado |
| R-DOM-SHT-002 | AC-OP-RNG-002, AC-OP-RNG-004, AC-OP-RNG-005 | trazado |
| R-DOM-SHT-003 | AC-OP-RNG-006 | trazado |
| R-DOM-SHT-004 | AC-OP-RNG-007 | trazado |
| R-DOM-SHT-005 | AC-OP-LES-001, AC-OP-LES-003 | trazado |
| R-DOM-SHT-006 | AC-OP-LES-002, AC-OP-LES-004, AC-OP-LES-005 | trazado |
| R-DOM-SHT-007 | AC-OP-LES-002 | trazado |
| R-DOM-SHT-008 | AC-OP-LES-006 | trazado |
| R-DOM-SHT-009 | AC-OP-LES-007, AC-OP-LES-008 | trazado |
| R-DOM-SHT-010 | AC-OP-LES-009 | trazado |
| R-DOM-SHT-011 | AC-OP-LES-010 | trazado |
| R-DOM-SHT-012 | AC-OP-LES-011 | trazado |
| R-DOM-SHT-013 | AC-OP-LES-012 | trazado |
| R-DOM-SHT-014 | AC-OP-FRC-002, AC-OP-FRC-004, AC-OP-FRC-005 | trazado |
| R-DOM-SHT-015 | AC-OP-FRC-006 | trazado |
| R-DOM-SHT-016 | AC-OP-FRC-007 | trazado |
| R-DOM-SHT-017 | AC-OP-RES-002, AC-OP-RES-004, AC-OP-RES-005 | trazado |
| R-DOM-SHT-018 | AC-OP-RES-002, AC-OP-RES-004, AC-OP-RES-005 | trazado |
| R-DOM-SHT-019 | AC-OP-FRC-008 | trazado |
| R-DOM-SHT-020 | AC-OP-RES-006 | trazado |

### R-DOM-EXC (14) — [`../requirements/exercises-consumption.md`](../requirements/exercises-consumption.md)

| R | AC | Estado |
|---|---|---|
| R-DOM-EXC-001 | AC-OP-EJR-001, AC-OP-EJR-003 | trazado |
| R-DOM-EXC-002 | AC-OP-EJR-002, AC-OP-EJR-004, AC-OP-EJR-005 | trazado |
| R-DOM-EXC-003 | AC-OP-EJR-002 | trazado |
| R-DOM-EXC-004 | AC-OP-EJR-004, AC-OP-EJR-005 (refresco y cancelación) | trazado |
| R-DOM-EXC-005 | AC-OP-EJR-006 | trazado |
| R-DOM-EXC-006 | AC-OP-CMN-001, AC-OP-CMN-003 | trazado |
| R-DOM-EXC-007 | AC-OP-CMN-002, AC-OP-CMN-004, AC-OP-CMN-005 | trazado |
| R-DOM-EXC-008 | AC-OP-CMN-002, AC-OP-CMN-004, AC-OP-CMN-005 | trazado |
| R-DOM-EXC-009 | AC-OP-CMN-006 | trazado |
| R-DOM-EXC-010 | AC-OP-CAR-001, AC-OP-CAR-003 | trazado |
| R-DOM-EXC-011 | AC-OP-CAR-002, AC-OP-CAR-004, AC-OP-CAR-005 | trazado |
| R-DOM-EXC-012 | AC-OP-CAR-002, AC-OP-CAR-004, AC-OP-CAR-005 | trazado |
| R-DOM-EXC-013 | AC-OP-CAR-006 | trazado |
| R-DOM-EXC-014 | `acceptance/appearance.md` §D-02 (criterio reservado de ausencia) + AC-OP-WPN-006 (sin stock simulado) + AC-FL-APP-001 (hueco de apariencia reportado, no parcheado) | reservado (definido) |

### R-SES (25) — [`../requirements/shared-session-data.md`](../requirements/shared-session-data.md)

| R | AC | Estado |
|---|---|---|
| R-SES-001 | AC-CORE-HTTP | trazado |
| R-SES-002 | AC-CORE-HTTP | trazado |
| R-SES-003 | AC-CORE-HTTP | trazado |
| R-SES-004 | AC-CORE-HTTP, AC-OP-AUT-001 (rutas excluidas) | trazado |
| R-SES-005 | AC-OP-AUT-001, AC-CORE-HTTP | trazado |
| R-SES-006 | AC-OP-AUT-003, AC-CORE-SESSION | trazado |
| R-SES-007 | AC-OP-AUT-002, AC-CORE-SESSION | trazado |
| R-SES-008 | AC-OP-AUT-002, AC-CORE-SESSION, AC-CORE-UI (menú) | trazado |
| R-SES-009 | AC-CORE-SESSION + AC de selectores (UNT-009/010, AZC-001…004, SCP-001, CAL-001, ARM-001, LES-012, FRC-007) | trazado |
| R-SES-010 | AC-FL-SES-006, AC-CORE-HTTP | trazado |
| R-SES-011 | AC-FL-SES-006, AC-CORE-HTTP | trazado |
| R-SES-012 | AC-FL-APP-004, AC-OP-PRF-001, AC-OP-PRF-002, AC-CORE-HTTP | trazado |
| R-SES-013 | AC-CORE-HTTP, AC-OP-AUT-001, AC-OP-AUT-003, AC-OP-RCV-001…004 | trazado |
| R-SES-014 | AC-CORE-HTTP | trazado |
| R-SES-015 | AC-CORE-HTTP, AC-OP-AUT-003 (F-08) | trazado |
| R-SES-016 | AC-CORE-SESSION | trazado |
| R-SES-017 | AC-OP-AUT-003, AC-FL-APP-006 | trazado |
| R-SES-018 | AC-CORE-SESSION, AC-OP-AUT-004 | trazado |
| R-SES-019 | AC-OP-AUT-005, AC-FL-APP-005, AC-CORE-SESSION | trazado |
| R-SES-020 | AC-FL-SES-006, AC-CORE-SESSION | trazado |
| R-SES-021 | AC-OP-USR-013, AC-CORE-SESSION, AC-CORE-ROUTER | trazado |
| R-SES-022 | AC-CORE-ROUTER, AC-OP-AUT-002 | trazado |
| R-SES-023 | AC-CORE-ROUTER | trazado |
| R-SES-024 | AC-CORE-ROUTER, AC-FL-SES-006 | trazado |
| R-SES-025 | AC-CORE-ROUTER | trazado |

### R-APAR (23) — [`../requirements/appearance.md`](../requirements/appearance.md)

| R | AC | Estado |
|---|---|---|
| R-APAR-001 | AC-FL-APP-001 (estado no ejecutable) + `acceptance/appearance.md` §Requisito de cierre | trazado |
| R-APAR-002 | AC-OP-PRF-001, AC-OP-PRF-002 | trazado |
| R-APAR-003 | AC-OP-PRF-002 | trazado |
| R-APAR-004 | `acceptance/appearance.md` §Requisito de cierre: restricción al diseño de `technical-design.md` §5 para la implementación futura del backend; sin observable de UI propio | reservado (definido) |
| R-APAR-005 | AC-FL-APP-002 | trazado |
| R-APAR-006 | AC-FL-APP-002, AC-FL-APP-004 | trazado |
| R-APAR-007 | AC-FL-APP-007, AC-CORE-SESSION | trazado |
| R-APAR-008 | AC-FL-APP-002 | trazado |
| R-APAR-009 | AC-FL-APP-002 | trazado |
| R-APAR-010 | AC-FL-APP-002 | trazado |
| R-APAR-011 | AC-FL-APP-001 | trazado |
| R-APAR-012 | AC-FL-APP-002 | trazado |
| R-APAR-013 | AC-FL-APP-003 | trazado |
| R-APAR-014 | AC-FL-APP-004 | trazado |
| R-APAR-015 | AC-FL-APP-001, AC-FL-APP-004 | trazado |
| R-APAR-016 | AC-FL-APP-002 (saveState visible) | trazado |
| R-APAR-017 | AC-FL-APP-005 | trazado |
| R-APAR-018 | AC-FL-APP-006 | trazado |
| R-APAR-019 | AC-FL-APP-007 | trazado |
| R-APAR-020 | AC-FL-APP-002, AC-CORE-UI (panel y teclado) | trazado |
| R-APAR-021 | AC-FL-APP-002 | trazado |
| R-APAR-022 | AC-FL-APP-002 | trazado |
| R-APAR-023 | AC-FL-APP-002 | trazado |

**Conteo R:** ORG 17 + ID 19 + AZ 10 + ARM 12 + SHT 20 + EXC 14 = 92 DOM; SES 25;
APAR 23. **Total 140**: 138 trazados + 2 reservados con definición explícita
(R-APAR-004, R-DOM-EXC-014). Los requisitos canónicos de la raíz (`R-AUTH-*`, `R-RUL-*`,
`R-RES-*`, `R-DAT-*`, `R-APP-*`, `R-PREF-*`, `R-UNIT-*`, `R-ROUTER-*`, `R-REC-*`,
`R-DS-*`, `R-LOGIN-*`) no forman parte del universo estable de 140 de este corte: se
conservan trazados a través de los V-* retenidos y la tabla de equivalencias siguiente,
y de las citas de los volúmenes anidados que los operacionalizan.

---

## Equivalencia V-* → AC-* (71 IDs anteriores, retenidos)

La lista anterior de criterios observables (`V-01…V-96`, `V-A1…V-A7` de la versión previa
de `../verification.md`) **no se elimina**: cada V-* queda retenido mediante su
equivalencia con los criterios de este corpus. Donde un V-* cubría varios escenarios,
mapea a varios AC. (La versión vigente de `../verification.md`, escrita por otro carril,
contiene su propia tabla V-* → su esquema inline; la unificación de ambas tablas es
decisión del integrador — ver la nota de integración al pie.)

| V-* anterior | AC-* de este corpus | V-* anterior | AC-* de este corpus |
|---|---|---|---|
| V-01 | AC-OP-AUT-001, AC-OP-AUT-002 | V-50 | AC-OP-LES-002 |
| V-02 | AC-OP-AUT-001 (fila de fallos) | V-51 | AC-OP-RES-002 |
| V-03 | AC-OP-AUT-001, AC-OP-AUT-002, AC-CORE-SESSION, AC-OP-USR-013 | V-52 | AC-OP-RES-002 |
| V-04 | AC-OP-USR-013 | V-53 | AC-OP-RES-002 |
| V-05 | AC-OP-AUT-005, AC-CORE-SESSION | V-54 | AC-OP-LES-011 |
| V-06 | AC-OP-AUT-003, AC-CORE-SESSION | V-55 | AC-OP-LES-009, AC-OP-FRC-008 |
| V-07 | AC-FL-SES-006 | V-56 | AC-OP-LES-009, AC-OP-LES-010 |
| V-10 | AC-OP-RCV-001…004 | V-57 | AC-OP-LES-001, AC-OP-LES-003 |
| V-11 | AC-OP-RCV-004 | V-60 | AC-CORE-SESSION, AC-FL-APP-007 |
| V-12 | AC-OP-RCV-001, AC-OP-RCV-002 | V-61 | AC-CORE-SESSION, AC-OP-AUT-004 |
| V-20 | AC-OP-UNT-007 | V-62 | AC-OP-LES-010, AC-OP-LES-011 |
| V-21 | AC-OP-UNT-008 | V-63 | AC-CORE-HTTP, AC-CORE-UI |
| V-22 | AC-OP-UNT-008 | V-64 | AC-CORE-UI + AC de selectores (R-SES-009) |
| V-23 | AC-OP-RCT-007, AC-OP-RCT-008 | V-70 | AC-CORE-UI |
| V-24 | AC-OP-UNT-009 | V-74 | AC-FL-APP-002 |
| V-30 | AC-OP-USR-001 | V-75 | AC-FL-APP-002 |
| V-31 | AC-OP-USR-009, AC-OP-USR-011 | V-76 | AC-FL-APP-001 |
| V-32 | AC-OP-USR-002 | V-77 | AC-FL-APP-001, AC-FL-APP-005 |
| V-33 | AC-OP-USR-012 | V-78 | AC-FL-APP-003 |
| V-34 | AC-OP-USR-002, AC-OP-USR-012 | V-79 | AC-FL-APP-002, AC-FL-APP-004 |
| V-35 | AC-OP-USR-013 | V-80 | AC-FL-APP-002 |
| V-36 | AC-OP-USR-014 | V-81 | AC-FL-APP-002, AC-CORE-UI |
| V-37 | AC-OP-USR-015, AC-OP-USR-016 | V-82 | AC-FL-APP-002 |
| V-38 | AC-OP-POS-009 | V-83 | AC-FL-APP-007, AC-CORE-SESSION |
| V-39 | AC-OP-USR-002 (fila de fallos) | V-84 | AC-FL-APP-005 |
| V-40 | AC-OP-WPN-002 | V-85 | AC-FL-APP-006 |
| V-41 | AC-OP-WPN-004, AC-OP-WPN-005 | V-86 | AC-FL-APP-007 |
| V-42 | AC-OP-CAL-001, AC-OP-CAL-002, AC-OP-CAL-004…006 | V-87 | AC-FL-APP-004 |
| — | — | V-88 | AC-OP-PRF-001, AC-OP-PRF-002 |
| V-90 | AC-CORE-ROUTER | V-94 | AC-CORE-ROUTER |
| V-91 | AC-CORE-ROUTER | V-95 | AC-CORE-ROUTER |
| V-92 | AC-CORE-ROUTER | V-96 | AC-CORE-ROUTER, AC-CORE-UI |
| V-93 | AC-CORE-ROUTER, AC-CORE-SESSION | V-A1 | AC-FL-APP-001, AC-FL-APP-002 |
| — | — | V-A2 | AC-FL-APP-003 |
| — | — | V-A3 | AC-FL-APP-004 |
| — | — | V-A4 | AC-FL-APP-004 |
| — | — | V-A5 | AC-FL-APP-001, AC-CORE-HTTP |
| — | — | V-A6 | AC-OP-PRF-001, AC-OP-PRF-002 |
| — | — | V-A7 | AC-OP-PRF-001 |

Los riesgos `V-R01…V-R10` de la versión anterior permanecen en `../verification.md` con
sus IDs; este corpus no los renumera ni los duplica.

---

## Nota de integración — dos arquitecturas de aceptación en vuelo (2026-10-02)

> 🕯️ Registro factual para el siguiente lector; este volumen no negocia con otros
> carriles ni corrige su contenido, sólo deja constancia del estado del archivo.

1. Este corpus `acceptance/` (175 criterios: 162 `AC-OP-*` biunívocos con el manifiesto,
   8 `AC-FL-*`, 5 `AC-CORE-*`) fue escrito por el carril de reanudación de traza del
   workstream `frontend-trace-acceptance-resume`, cuyo contrato asignaba a este writer
   `verification.md` y `acceptance/*.md`.
2. Durante la misma ventana, **otro carril paralelo** reescribió `../verification.md`
   (mtime 2026-10-02 08:49) con un esquema distinto: 131 `AC-<familia>-<nnn>` inline
   (99 por flujo + 32 transversales INT/TRA/RES/DAT/DS/NAV/BCK), referenciando un
   `../coverage.md` raíz (creado a las 08:42) y `../tasks.md` (en vuelo, 09:04).
3. En consecuencia coexisten **dos arquitecturas de aceptación**: la inline por FL de
   `../verification.md` + `../coverage.md` raíz, y la anidada por OP de este
   `acceptance/`. Este carril **detuvo su mano sobre `../verification.md`** al descubrir
   la escritura ajena en vuelo (regla de concurrencia: overlap real ⇒ detenerse y
   reportar; no modificar contenido ajeno en vuelo). La unificación —qué esquema prevalece
   como índice canónico y cómo se cruzan ambas tablas V-*— es decisión del orquestador
   como fase secuencial de integración.
4. Comprobación documental ejecutada por este carril sobre **su propio** corpus (M-D,
   2026-10-02): 162/162 AC-OP ≡ manifiesto (doble diferencia vacía), 99/99 FL con
   escenario, 36/36 SCREEN con escenario, 140/140 R trazados o reservados, 71/71 V-*
   retenidos, todos los archivos < 700 líneas. El contenido del otro carril **no fue
   auditado**.

---

> 🕯️ Ninguna cobertura de esta página afirma verificación ejecutada: acredita que cada
> ID de las fuentes durables tiene criterio de aceptación asignado o reserva definida.
> La comprobación de usuario sigue pendiente de autorización
> ([`../verification.md`](../verification.md), «Requisito de autorización»).
