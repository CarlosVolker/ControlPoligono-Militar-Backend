---
spec_meta: "./spec-meta.yaml"
---

# Matriz de trazabilidad — Frontend integral

> 📖 Yo conservo aquí el índice, el método y el resumen de la matriz de trazabilidad de la spec `final-frontend` (workstream `frontend-trace-matrix-resume`, registro del 2026-10-02). Esta matriz enlaza las **162 OP** del inventario con requisitos, pantallas, flujos, tareas y criterios de aceptación. Representa **cobertura documental**: no afirma implementación, ni runtime, ni instalación de dependencias. La spec está **`approved`** desde el 2026-10-02 (`spec-meta.yaml`:7); la aprobación no supera gates por sí sola (`verified_at: null`, ningún gate en `passed`) y la ejecución vigente se rige por [`completion-plan-2026-10-14.md`](completion-plan-2026-10-14.md) (aprobado el 2026-10-14, `in-progress`; verificado 2026-10-15).

## Índice

1. [Método y fuentes](#método-y-fuentes)
2. [Convenciones de IDs compartidas](#convenciones-de-ids-compartidas)
3. [Particiones de la matriz](#particiones-de-la-matriz)
4. [Resumen de conteos](#resumen-de-conteos)
5. [Clasificación y reservas](#clasificación-y-reservas)
6. [Estado de los punteros T-*/AC-*](#estado-de-los-punteros-t-ac)
7. [Observaciones y faltantes reportados](#observaciones-y-faltantes-reportados)

---

## Método y fuentes

Cada cruce se **deriva de los volúmenes desarrollados**, no del parecido de nombres:

| Entrada | Rol en la matriz |
|---|---|
| [backend-inventory.md](backend-inventory.md) | Universo canónico: 162 OP (161 de negocio + `OP-AUT-006` de infraestructura), método + patrón por fila. Ninguna OP de esta matriz existe fuera de ese manifest. |
| [backend-contracts.md](backend-contracts.md) y [contracts/](contracts/) | Anclas de payload por OP; la matriz las enlaza y **no las duplica**. |
| [experience/screens.md](experience/screens.md) y [experience/screens/](experience/screens/) | IDs canónicos `SCREEN-*` (36) y la tabla «Cobertura OP → SCREEN»; las integraciones sin pantalla propia se resuelven a SCREEN y FL canónicos, nunca a aliases `SCREEN/*`. |
| [experience/flows.md](experience/flows.md) y [experience/flows/](experience/flows/) | IDs canónicos `FL-*` (99) con sus OP principales; la columna FL sólo registra flujos **desarrollados** en esos volúmenes. |
| [experience/states.md](experience/states.md) | Perfiles `P-*` y deltas por OP que citan requisitos; fuente de varias citas R-* por OP. |
| [experience/navigation.md](experience/navigation.md) | Fuentes puntuales de rutas, guards, menú y deep links (p. ej. `OP-FRC-003` en entrada directa a captura). |
| [requirements/](requirements/) | Los 140 requisitos anidados: 92 `R-DOM-*`, 25 `R-SES-*`, 23 `R-APAR-*`. Los requisitos transversales de la raíz no se reenumeran aquí. |
| [design-system/](design-system/) | Fuentes visuales y catálogo del personalizador; la matriz las referencia para `T-CORE-UI` y la familia `FL-APP-*`. |

Reglas de derivación que apliqué:

- **Una fila por OP individual** (método + ruta); sin rangos CRUD como sustituto de filas. `PUT` y `PATCH` comparten editor en pantalla (convención de `screens.md`) pero **cada uno conserva su fila y su criterio**.
- **Requisitos por OP**: cito el `R-DOM-*`/`R-SES-*`/`R-APAR-*` cuyo texto o *Fuente* menciona la OP, o los deltas de `states.md`. Toda fila hereda además `R-SES-001…018` (transporte, cabeceras, semántica de códigos, memoria) y el contrato `F-*`/`ST-*`; esa herencia **no** se repite por fila. Cuando ningún requisito cita la OP individual, lo declaro como cobertura de familia con su fuente puntual, en vez de inventar una cita.
- **Ausencias honestas**: si ningún FL desarrollado consume una OP como principal, la columna FL lleva `—` y la observación correspondiente (§Observaciones). No invento cruces.
- **TypeScript es el metaobjetivo** (orden del operador del 2026-10-02: «TS, no JS», recogida en [experience/navigation.md](experience/navigation.md):7 y [experience/screens.md](experience/screens.md):27); el baseline en JavaScript quedó **superado** como estado: `front/src/` está en **TypeScript** (38 `.vue` con `lang="ts"`, 34 `.ts`, 0 `.js`; verificado 2026-10-15). Esta matriz no contiene código y no migra nada.

## Convenciones de IDs compartidas

Esquema acordado en el contrato de producción (único autorizado; no invento otro):

| Convención | Forma | Ejemplo | Dueño del artefacto |
|---|---|---|---|
| Tarea por flujo canónico | `T-<FL-ID>` | `T-FL-SES-001` | Writer de tareas (paralelo); esta matriz persiste el **puntero** |
| Criterio por OP | `AC-<OP-ID>` | `AC-OP-USR-001` | Writer de aceptación (paralelo); puntero |
| Criterio de flujo sin OP ni propuesta | `AC-<FL-ID>` | `AC-FL-SES-006` | Ídem |
| Tareas de infraestructura común | `T-CORE-TYPES`, `T-CORE-HTTP`, `T-CORE-SESSION`, `T-CORE-ROUTER`, `T-CORE-UI` | — | Writer de tareas |
| Criterios de infraestructura | `AC-CORE-*` (nombres correspondientes: `AC-CORE-TYPES`, `AC-CORE-HTTP`, `AC-CORE-SESSION`, `AC-CORE-ROUTER`, `AC-CORE-UI`) | — | Writer de aceptación |

> 🕯️ Los IDs `T-*`/`AC-*` son **convenciones acordadas en producción**, no artefactos entregados: los volúmenes `tasks.md`/`verification.md` y sus subcarpetas pertenecen a otros writers y no fueron leídos ni se afirman. Ver §Estado de los punteros.

## Particiones de la matriz

Anidado propio; cada partición por debajo de 700 líneas:

| Partición | Contenido | Filas |
|---|---|---:|
| [coverage/operations.md](coverage/operations.md) | Matriz maestra: una fila por cada OP individual con requisito(s), SCREEN/integración, FL, tarea, criterio y clasificación/reserva | 162 |
| [coverage/requirements.md](coverage/requirements.md) | Tabla global de los 140 `R-DOM-*`/`R-SES-*`/`R-APAR-*` a tarea/AC o exclusión justificada | 140 |
| [coverage/screens.md](coverage/screens.md) | Cruce de las 36 pantallas canónicas: OP consumidas, FL que las materializan, tareas y fuente DS | 36 |
| [coverage/flows.md](coverage/flows.md) | Cruce de los 99 flujos canónicos: OP principales, SCREEN, tarea y criterio | 99 |

## Resumen de conteos

| Universo | Total | Verificación |
|---|---:|---|
| OP (161 negocio + 1 infraestructura) | 162 | Igual al manifest de `backend-inventory.md` §Universo contado: 118 router (114 CRUD + 4 sólo lectura) + 27 acciones + 17 rutas explícitas |
| Requisitos anidados | 140 | 92 `R-DOM` (ORG 17 + ID 19 + AZ 10 + SHT 20 + ARM 12 + EXC 14) + 25 `R-SES` + 23 `R-APAR` |
| Pantallas canónicas | 36 | `screens.md` §Pantallas canónicas |
| Flujos canónicos | 99 | `flows.md` §Índice canónico (SES 6 · RCV 1 · PWD 5 · ORG 12 · IDT 17 · AZ 13 · AUD 1 · ARM 3 · WPN 4 · CAL 2 · SHT 19 · EXC 3 · CMN 3 · CAR 2 · APP 8) |
| Estados `ST-*` / perfiles `P-*` | 11 / 9 | `states.md`; citados por referencia, no reenumerados |

Ninguna OP inventada: toda fila de [coverage/operations.md](coverage/operations.md) existe en el manifest. Ninguna capacidad actual omitida: las 161 OP de negocio tienen SCREEN canónico o integración resuelta, y `OP-AUT-006` queda clasificada como infraestructura.

## Clasificación y reservas

Clasificaciones usadas en la columna final de la matriz maestra, sin fingir funcionalidad donde no la hay:

| Clasificación | Alcance | Fuente |
|---|---|---|
| **Infraestructura** | `OP-AUT-006` (`GET /protected/`): sin pantalla, sin estado de UI, no es operación de negocio | `backend-inventory.md` manifest; `states.md` perfil `P-INFRA` |
| **Legacy** | `OP-PRF-001/002`: ruta de tres campos que existe hoy y **no gobierna** la apariencia visible; la ruta de 8 ejes es **separada** del legacy y ya existe (ocho campos `ds_*` en `apipoligono/models.py:152-159`, migración `0021_design_system_preferences` y rutas `apipoligono/urls.py:85-86`; verificado 2026-10-15) | `requirements/appearance.md` §Estado de las dos APIs; `flows.md` FL-APP-008 |
| **Operación restringida** | `OP-RNG-006` (sin mapa `range:delete`: no se ofrece como disponible), mutaciones `IsTenantAdmin` (roles, overrides, matrices RBAC), `OP-CAL-002/004/005/006` (sólo `super_admin`), `OP-AUT-004` (sólo `tenant_admin`/`super_admin`/`auditor`), rol de sistema en `OP-RPR-*` (sólo `super_admin`) | `backend-inventory.md`; `states.md` §Mapa; `requirements/identity-authorization.md` R-DOM-AZ-001/003; `requirements/armory.md` R-DOM-ARM-011 |
| **Reserva B-01** | `OP-LES-009`: hipótesis estática de fallo (`primary_unit()` fuera de ámbito); la UI trata el fallo como error explícito y el resumen/reporte **no** sustituyen el detalle | `states.md` delta crítico; `requirements/shooting.md` R-DOM-SHT-010; `flows/shooting-lessons.md` §FL-SHT-009 |
| **Reservas G-SES** | `G-SES-1` (recarga profunda con sesión viva: el tenant sólo vive en memoria; única vía documentada = re-captura en `/contexto`, anotada en `OP-AUT-002`), `G-SES-2` (endpoints que exigen `X-Org-Unit-Code` no declarados; anotada en `R-SES-006`), `G-SES-3` (filtros/paginación/ordenamiento globales no comprobados; transversal, anotada en el método) | `requirements/shared-session-data.md` §Huecos registrados |
| **Reserva D-02** | Capacidades sin endpoint (transferencia de stock, validación de resultados, export en servidor, `edit_self`, comandantes de unidad, historial global de asignaciones, edición del catálogo de permisos): **no generan fila OP, pantalla ni botón**; se reportan como hueco. `R-DOM-EXC-014` prohíbe simularlas | `backend-inventory.md` §Capacidades sin endpoint; `requirements/exercises-consumption.md` R-DOM-EXC-014; `screens.md` §Huecos |
| **Propuesta (no OP)** | Ruta de apariencia de 8 ejes `GET\|PUT\|DELETE /me/preferences/appearance/design-system/`: **no es OP** del catálogo; hoy **existe y está registrada** (`apipoligono/urls.py:86`, migración `0021_design_system_preferences`; verificado 2026-10-15). Afecta a `FL-APP-001…004` y a los `R-APAR-*` que la consumen | `requirements/appearance.md` R-APAR-001/004; `states.md` §Ruta propuesta; `flows.md` §Apariencia |

## Estado de los punteros T-*/AC-*

> 🪶 Registro de integridad: en el momento de esta escritura, otros dos writers producen en paralelo los volúmenes de tareas y de aceptación, con write sets disjuntos al mío. Por tanto:
>
> - Todo `T-FL-*`, `T-CORE-*`, `AC-OP-*`, `AC-FL-*` y `AC-CORE-*` citado en estas matrices es un **puntero por convención acordada**, no una confirmación de que el artefacto destino exista o esté entregado.
> - No leí `tasks.md`, `verification.md` ni las subcarpetas `tasks/`/`acceptance/`; no afirmo su contenido ni su estado.
> - Cuando los handoffs finales de esos writers cierren, el integrador podrá verificar la correspondencia puntero → artefacto; esta matriz ya deja los IDs exactos que deben coincidir.

## Observaciones y faltantes reportados

Faltantes ajenos que **reporto y no autoreparo** (regla de expansión del contrato):

1. **11 OP de negocio sin FL desarrollado que las consuma como principales**: `OP-LES-001`, `OP-LES-003`, `OP-FRC-001`, `OP-FRC-003`, `OP-RES-001`, `OP-RES-003`, `OP-CAR-001`, `OP-CAR-003`, `OP-MEM-001`, `OP-MEM-003` (lecturas de listado/detalle cuya consumidora es la pantalla canónica) y `OP-UNT-006` (DELETE CRUD de unidad: el flujo destructivo canónico pasa por `OP-UNT-007/008`, FL-ORG-004/005). Verificado por búsqueda directa en `experience/flows/`: esas OP no aparecen en ningún volumen de flujos. Su aceptación queda anclada a su propio `AC-OP-*` y a la pantalla consumidora; **no existe puntero de tarea bajo la convención autorizada** (sólo hay `T-FL-*` y `T-CORE-*`), y no invento un esquema `T-SCREEN-*`. Lo reporto al integrador.
2. **`OP-AUT-006`** no requiere tarea de flujo: su único cruce vivo es la exclusión de cabecera `X-Tenant-Code` declarada en `R-SES-004` (`T-CORE-HTTP`).
3. **G-SES-3** (filtros/paginación/ordenamiento globales no comprobados) es transversal a todas las OP de lectura: las pantallas resuelven búsqueda/orden en cliente sobre arrays planos; ninguna fila de esta matriz afirma capacidad de filtrado del backend.
4. El módulo baseline `front/src/api/dashboard.js` conserva su contrato y sus operaciones **no se re-derivan** en el catálogo de pantallas ([experience/screens/access-context.md](experience/screens/access-context.md) §SCREEN-DASHBOARD); por tanto SCREEN-DASHBOARD cruza por fuente puntual, no por enumeración de OP propias.
