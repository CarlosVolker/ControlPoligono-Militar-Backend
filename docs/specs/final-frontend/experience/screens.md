---
spec_meta: "../spec-meta.yaml"
---

# Catálogo de pantallas — Frontend integral

> 📖 Tomo índice del workstream `full-frontend-screens-recovery` (spec `final-frontend`, estado `approved` desde el 2026-10-02). Este catálogo **propone** pantallas y rutas para el producto final y no acredita implementación ni runtime verificado (`technical-design.md` §1, T-05; `front/AGENTS.md`:57); `vue-router` está instalado y en uso en el cliente (`front/src/router/`; verificado 2026-10-15). Los IDs `SCREEN-*` definidos aquí son **canónicos** para el cruce posterior con los `FL-*` del stream de flujos/estados (otro writer). Las operaciones `OP-*` citadas existen en [`backend-inventory.md`](../backend-inventory.md); los shapes de datos viven en [`contracts/`](../backend-contracts.md) y no se copian aquí.

## Índice

1. [Convenciones del catálogo](#convenciones-del-catálogo)
2. [Pantallas canónicas](#pantallas-canónicas)
3. [Cobertura OP → SCREEN](#cobertura-op--screen)
4. [Integraciones sin pantalla propia](#integraciones-sin-pantalla-propia)
5. [Huecos y límites declarados](#huecos-y-límites-declarados)

---

## Convenciones del catálogo

- **ID canónico.** Cada pantalla tiene un `SCREEN-*` único y estable dentro de esta spec. El detalle completo (propósito, ruta, params, breadcrumbs, fuente DS, datos/OP, acciones, controles, estados, navegación) vive en los tomos anidados de [`screens/`](screens/); este índice no los resume de forma que haya que adivinar pantallas CRUD.
- **Estado de ruta.** `TD§4` = ruta fijada en la tabla de `technical-design.md` §4. **Propuesta** = ruta nueva de este catálogo, claramente marcada como tal en su ficha; sigue la convención de módulos de TD§4 pero no está fijada por decisiones previas. Ninguna está instalada ni probada.
- **PUT/PATCH comparten editor.** Cuando ambas operaciones existen sobre un recurso, un único formulario editor las cubre y **ambas** quedan trazadas en la matriz; no se cuenta como hueco.
- **Controles de acceso declarativos.** Los códigos de permiso citados están transcritos del mapa verificado `apps/authorization/permissions.py:36–95` o del contrato correspondiente (clases IA/TA/TAdmin). La UI anticipa visibilidad con `context.permissions`; la autoridad efectiva es siempre el backend y un `403` es denegación visible, nunca dato vacío. No se deducen códigos desde etiquetas amplias del inventario (ver divergencia `warehouse` en [`screens/armory.md`](screens/armory.md)).
- **Datos reales.** Toda pantalla consume exclusivamente operaciones del inventario; ausente = `—`, vacío = estado vacío, error = error explícito; nunca `0` falso ni fixtures (`R-RES-23`, `R-DAT-01`).
- **DS literal.** La fuente visual de cada pantalla es la página exacta de la biblioteca externa citada en su ficha ([`design-system/reference-pages.md`](../design-system/reference-pages.md)); reproducir 1:1, sin interpretar (`R-DS-01`).
- **TS, no JS.** El stack del cliente es Vue 3 + TypeScript por orden vigente del operador (2026-10-02), que deroga el mandato JavaScript anterior (`front/AGENTS.md`:18; sincronizado el 2026-10-15); este catálogo sigue sin contener sintaxis de tipos: describe pantallas, no código.
- **Sin menús huecos.** No existe pantalla de signup (el backend no expone la capacidad), ni botones de export, transferencia de stock o validación de resultados (D-02, [`screens/exercises.md`](screens/exercises.md) §Huecos).

## Pantallas canónicas

36 pantallas. Ruta «propuesta» ≠ instalada; ver convenciones.

| SCREEN-ID | Pantalla | Ruta | Estado ruta | Tomo |
|---|---|---|---|---|
| SCREEN-LOGIN | Inicio de sesión | `/login` | TD§4 | [access-context.md](screens/access-context.md) |
| SCREEN-RECOVERY | Recuperación de contraseña (4 pasos) | `/recuperar` | TD§4 | [access-context.md](screens/access-context.md) |
| SCREEN-PASSWORD-FORCED | Cambio de contraseña forzado | `/password-required` | TD§4 | [access-context.md](screens/access-context.md) |
| SCREEN-CONTEXT | Selección de unidad activa | `/contexto` | TD§4 | [access-context.md](screens/access-context.md) |
| SCREEN-DASHBOARD | Dashboard de lectura | `/` | TD§4 | [access-context.md](screens/access-context.md) |
| SCREEN-CONTEXT-LOST | Contexto perdido | `/contexto-perdido` | Propuesta | [access-context.md](screens/access-context.md) |
| SCREEN-NOT-FOUND | 404 | `/:pathMatch(.*)*` | TD§4 | [access-context.md](screens/access-context.md) |
| SCREEN-PERSONALIZER | Personalizador de 8 ejes | `/personalizador` | TD§4 | [appearance.md](screens/appearance.md) |
| SCREEN-USERS | Listado de usuarios | `/personas` | TD§4 | [identity.md](screens/identity.md) |
| SCREEN-USER-DETAIL | Ficha de usuario (asignaciones, credenciales, bloqueo) | `/personas/:idUsuario` | TD§4 | [identity.md](screens/identity.md) |
| SCREEN-POSITIONS | Puestos | `/organizacion/puestos` | Propuesta | [identity.md](screens/identity.md) |
| SCREEN-POSITION-DETAIL | Ficha de puesto (holders, histórico) | `/organizacion/puestos/:idPosicion` | Propuesta | [identity.md](screens/identity.md) |
| SCREEN-MEMBERSHIPS | Pertenencias orgánicas | `/organizacion/membresias` | Propuesta | [identity.md](screens/identity.md) |
| SCREEN-UNITS | Árbol de unidades | `/organizacion/unidades` | TD§4 | [organization.md](screens/organization.md) |
| SCREEN-UNIT-DETAIL | Ficha de unidad (eliminar con migración) | `/organizacion/unidades/:idUnidad` | TD§4 | [organization.md](screens/organization.md) |
| SCREEN-PRECINCTS | Recintos | `/organizacion/recintos` | TD§4 | [organization.md](screens/organization.md) |
| SCREEN-PRECINCT-DETAIL | Ficha de recinto (relación con unidades) | `/organizacion/recintos/:idRecinto` | Propuesta | [organization.md](screens/organization.md) |
| SCREEN-ROLES | Roles | `/personas/roles` | TD§4 | [authorization.md](screens/authorization.md) |
| SCREEN-SCOPES | Scopes (sólo lectura) | `/personas/scopes` | TD§4 | [authorization.md](screens/authorization.md) |
| SCREEN-PERMISSIONS | Permisos y matrices (rol, puesto, personas por unidad) | `/personas/permisos` | TD§4 | [authorization.md](screens/authorization.md) |
| SCREEN-OVERRIDES | Overrides por persona | `/personas/overrides` | Propuesta | [authorization.md](screens/authorization.md) |
| SCREEN-AUDIT | Bitácora de auditoría | `/auditoria` | TD§4 | [authorization.md](screens/authorization.md) |
| SCREEN-ARMORIES | Armerías | `/almacen/armerias` | TD§4 | [armory.md](screens/armory.md) |
| SCREEN-WEAPONS | Armas | `/almacen/armas` | TD§4 | [armory.md](screens/armory.md) |
| SCREEN-WEAPON-DETAIL | Ficha de arma | `/almacen/armas/:idArma` | TD§4 | [armory.md](screens/armory.md) |
| SCREEN-CALIBERS | Calibres (global; mutación `super_admin`) | `/almacen/calibres` | TD§4 | [armory.md](screens/armory.md) |
| SCREEN-RANGES | Polígonos | `/tiro/poligonos` | TD§4 | [shooting.md](screens/shooting.md) |
| SCREEN-RANGE-DETAIL | Ficha de polígono (lecciones anidadas) | `/tiro/poligonos/:idPoligono` | TD§4 | [shooting.md](screens/shooting.md) |
| SCREEN-LESSONS | Lecciones | `/tiro/lecciones` | TD§4 | [shooting.md](screens/shooting.md) |
| SCREEN-LESSON-DETAIL | Ficha de lección (5 pestañas + gestión de fracciones) | `/tiro/lecciones/:idLeccion` | TD§4 | [shooting.md](screens/shooting.md) |
| SCREEN-FRACTION-DETAIL | Ficha de fracción (tiradores, resultados) | `/tiro/lecciones/:idLeccion/fracciones/:idFraccion` | TD§4 | [shooting.md](screens/shooting.md) |
| SCREEN-RESULTS-CAPTURE | Captura de resultados por carril | `/tiro/fracciones/:idFraccion/resultados` | TD§4 | [shooting.md](screens/shooting.md) |
| SCREEN-EXERCISES | Ejercicios militares | `/tiro/ejercicios` | TD§4 | [exercises.md](screens/exercises.md) |
| SCREEN-EXERCISE-DETAIL | Ficha de ejercicio | `/tiro/ejercicios/:idEjercicio` | Propuesta | [exercises.md](screens/exercises.md) |
| SCREEN-AMMO-CONSUMPTION | Consumos de munición (nivel 1) | `/tiro/consumos-municion` | TD§4 | [exercises.md](screens/exercises.md) |
| SCREEN-WEAPON-CONSUMPTION | Consumos por arma (nivel 2) | `/tiro/consumos-arma` | TD§4 | [exercises.md](screens/exercises.md) |

## Cobertura OP → SCREEN

Universo: **162 OP declaradas = 161 de negocio + `OP-AUT-006` de infraestructura** ([`backend-inventory.md`](../backend-inventory.md) §Universo contado). Cada OP de negocio tiene pantalla asignada o integración justificada. Los rangos abreviados listan IDs individuales del inventario; PUT/PATCH comparten editor (convenciones).

| OP (explícitas) | Destino |
|---|---|
| OP-USR-001, OP-USR-002, OP-USR-012 | SCREEN-USERS (alta formal, alta temporal, listado) |
| OP-USR-003, OP-USR-004, OP-USR-005, OP-USR-006 | SCREEN-USER-DETAIL (004/005 comparten editor) |
| OP-USR-007, OP-USR-008 | SCREEN-USER-DETAIL — modal asignación principal (comparten modal) |
| OP-USR-009, OP-USR-010, OP-USR-011 | SCREEN-USER-DETAIL — panel asignaciones |
| OP-USR-013 | SCREEN-PASSWORD-FORCED (propio forzado) + SCREEN-USER-DETAIL (otro) |
| OP-USR-014, OP-USR-015, OP-USR-016 | SCREEN-USER-DETAIL — panel credenciales/bloqueo |
| OP-WPN-001, OP-WPN-002 | SCREEN-WEAPONS |
| OP-WPN-003, OP-WPN-004, OP-WPN-005, OP-WPN-006 | SCREEN-WEAPON-DETAIL (004/005 comparten editor) |
| OP-RNG-001, OP-RNG-002 | SCREEN-RANGES |
| OP-RNG-003, OP-RNG-004, OP-RNG-005, OP-RNG-006, OP-RNG-007 | SCREEN-RANGE-DETAIL (006 sin mapa `range:delete`: no se ofrece como disponible, [shooting.md](screens/shooting.md)) |
| OP-LES-001, OP-LES-002 | SCREEN-LESSONS |
| OP-LES-003, OP-LES-004, OP-LES-005, OP-LES-006 | SCREEN-LESSON-DETAIL (004/005 comparten editor) |
| OP-LES-007, OP-LES-008, OP-LES-009, OP-LES-010, OP-LES-011 | SCREEN-LESSON-DETAIL — pestañas fracciones/tiradores/resultados/resumen/reporte |
| OP-LES-012 | SCREEN-LESSON-DETAIL — selector de participantes |
| OP-FRC-001 | Integrado en SCREEN-LESSON-DETAIL (gestión de fracciones); la colección visible proviene de OP-LES-007 |
| OP-FRC-002, OP-FRC-004, OP-FRC-005, OP-FRC-006 | SCREEN-LESSON-DETAIL — modales de la pestaña fracciones |
| OP-FRC-003 | SCREEN-FRACTION-DETAIL (+ resolución de contexto en SCREEN-RESULTS-CAPTURE) |
| OP-FRC-007 | SCREEN-FRACTION-DETAIL y SCREEN-RESULTS-CAPTURE (selectores reales de captura) |
| OP-FRC-008 | SCREEN-FRACTION-DETAIL (resultados detallados, gated `can_read_detail`) |
| OP-RES-001, OP-RES-002, OP-RES-003, OP-RES-004, OP-RES-005, OP-RES-006 | SCREEN-RESULTS-CAPTURE (004/005 comparten editor) |
| OP-ROL-001, OP-ROL-002, OP-ROL-003, OP-ROL-004, OP-ROL-005, OP-ROL-006 | SCREEN-ROLES (004/005 comparten editor) |
| OP-SCP-001, OP-SCP-002 | SCREEN-SCOPES |
| OP-OVR-001, OP-OVR-002, OP-OVR-003, OP-OVR-004, OP-OVR-005, OP-OVR-006 | SCREEN-OVERRIDES (004/005 comparten editor) |
| OP-PRM-001, OP-PRM-002 | SCREEN-PERMISSIONS — pestaña catálogo |
| OP-RPR-001, OP-RPR-002, OP-RPR-003, OP-RPR-004, OP-RPR-005, OP-RPR-006 | SCREEN-PERMISSIONS — pestaña matriz rol→permiso |
| OP-PPR-001, OP-PPR-002, OP-PPR-003, OP-PPR-004, OP-PPR-005, OP-PPR-006 | SCREEN-PERMISSIONS — pestaña matriz puesto→permiso |
| OP-UNT-001, OP-UNT-002 | SCREEN-UNITS |
| OP-UNT-003, OP-UNT-004, OP-UNT-005, OP-UNT-006 | SCREEN-UNIT-DETAIL (004/005 comparten editor) |
| OP-UNT-007, OP-UNT-008 | SCREEN-UNIT-DETAIL — flujo eliminar con migración (2 pasos) |
| OP-UNT-009 | FL/selectores — integrado: lookup compartido entre pantallas, sin pantalla propia |
| OP-UNT-010 | FL/selectores — integrado: selector de unidades elegibles (alta de usuario, asignaciones, destino de migración) |
| OP-RCT-001, OP-RCT-002, OP-RCT-004, OP-RCT-005, OP-RCT-006 | SCREEN-PRECINCTS (004/005 comparten editor) |
| OP-RCT-003 | SCREEN-PRECINCT-DETAIL (+ prefill del editor del listado) |
| OP-RCT-007, OP-RCT-008 | SCREEN-PRECINCT-DETAIL — panel de relaciones |
| OP-ARM-001, OP-ARM-002, OP-ARM-004, OP-ARM-005, OP-ARM-006 | SCREEN-ARMORIES (004/005 comparten editor) |
| OP-ARM-003 | SCREEN-ARMORIES — lectura de detalle para prefill/relaciones (integración justificada: sin ruta de detalle en TD§4) |
| OP-POS-001, OP-POS-002, OP-POS-004, OP-POS-005, OP-POS-006 | SCREEN-POSITIONS (004/005 comparten editor; edición también desde la ficha) |
| OP-POS-003 | SCREEN-POSITION-DETAIL |
| OP-POS-007, OP-POS-008 | SCREEN-POSITION-DETAIL — panel holders (FL/holders integrado) |
| OP-POS-009 | SCREEN-POSITION-DETAIL — pestaña histórico |
| OP-MEM-001, OP-MEM-002, OP-MEM-003, OP-MEM-004, OP-MEM-005, OP-MEM-006 | SCREEN-MEMBERSHIPS (004/005 comparten editor) |
| OP-CAL-001, OP-CAL-002, OP-CAL-003, OP-CAL-004, OP-CAL-005, OP-CAL-006 | SCREEN-CALIBERS (004/005 comparten editor) |
| OP-EJR-001, OP-EJR-002 | SCREEN-EXERCISES |
| OP-EJR-003, OP-EJR-004, OP-EJR-005, OP-EJR-006 | SCREEN-EXERCISE-DETAIL (004/005 comparten editor) |
| OP-CMN-001, OP-CMN-002, OP-CMN-003, OP-CMN-004, OP-CMN-005, OP-CMN-006 | SCREEN-AMMO-CONSUMPTION (004/005 comparten editor) |
| OP-CAR-001, OP-CAR-002, OP-CAR-003, OP-CAR-004, OP-CAR-005, OP-CAR-006 | SCREEN-WEAPON-CONSUMPTION (004/005 comparten editor) |
| OP-AUT-001 | SCREEN-LOGIN |
| OP-AUT-002 | FL/bootstrap — integrado en arranque de app y guards; lo materializan SCREEN-CONTEXT y SCREEN-DASHBOARD |
| OP-AUT-003 | SCREEN-CONTEXT |
| OP-AUT-004 | SCREEN-AUDIT |
| OP-AUT-005 | FL/sesión — integrado: acción de topbar/menú, sin pantalla propia ([navigation.md](navigation.md)) |
| OP-AUT-006 | **Infraestructura, sin pantalla** (declaración explícita del inventario) |
| OP-RCV-001, OP-RCV-002, OP-RCV-003, OP-RCV-004 | SCREEN-RECOVERY — pasos 1 a 4 |
| OP-PRF-001, OP-PRF-002 | SCREEN-PERSONALIZER — **trazados como legado**: no gobiernan los 8 ejes ([appearance.md](screens/appearance.md)) |
| OP-AZC-001 | SCREEN-PERMISSIONS — fill de matrices y tooltips |
| OP-AZC-002 | FL/asignaciones — integrado: roles agrupados en los modales de asignación de SCREEN-USER-DETAIL |
| OP-AZC-003 | SCREEN-PERMISSIONS — pestaña personas por unidad |
| OP-AZC-004 | FL/selectores — integrado: selector de unidad elegible en alta de usuario y asignaciones (SCREEN-USERS, SCREEN-USER-DETAIL) |

**Verificación de conteo.** 161 OP de negocio: todas tienen SCREEN o integración justificada en la tabla. `OP-AUT-006` queda excluida como infraestructura. No se requieren 161 pantallas: los flujos sobre un mismo recurso se integran en su ficha (asignaciones, holders, eliminación con migración, relaciones de recinto, captura).

## Integraciones sin pantalla propia

| FL del inventario | Justificación de integración |
|---|---|
| FL/bootstrap (OP-AUT-002) | El contexto se consume al arrancar la app y en los guards; su resultado visible está en SCREEN-CONTEXT/SCREEN-DASHBOARD. Una «pantalla de bootstrap» no existiría: es estado `booting` del guard (`technical-design.md` §3.2, `R-ROUTER-06`). |
| FL/sesión (OP-AUT-005) | Cerrar sesión es una acción de topbar/menú con purga de estado y abortos en vuelo (`R-AUTH-08`); no es una superficie con datos. Ver [`navigation.md`](navigation.md). |
| FL/selectores (OP-UNT-009, OP-UNT-010, OP-AZC-004) | Son componentes selectores compartidos por formularios (unidad padre, destino de migración, unidad de asignación). Cada selector vive dentro de la pantalla consumidora declarada en la matriz. |
| FL/asignación-principal, FL/asignaciones (OP-USR-007…011, OP-AZC-002) | Modales y paneles de SCREEN-USER-DETAIL: todas las operaciones actúan sobre el mismo recurso y sus respuestas refrescan la misma ficha. |
| FL/contraseña (OP-USR-013, OP-USR-014) | SCREEN-PASSWORD-FORCED (propio forzado) y panel de credenciales de SCREEN-USER-DETAIL (otro). |
| FL/eliminar-unidad (OP-UNT-007, OP-UNT-008) | Flujo de dos pasos dentro de SCREEN-UNIT-DETAIL (previsualización bloqueante + confirmación con destino). |
| FL/recinto-unidades (OP-RCT-007, OP-RCT-008) | Panel de relaciones de SCREEN-PRECINCT-DETAIL. |
| FL/holders (OP-POS-007, OP-POS-008) | Panel de holders de SCREEN-POSITION-DETAIL. |
| FL/captura-tiro (OP-USR-012, OP-LES-012, OP-FRC-*, OP-RES-*) | Materializado en SCREEN-RESULTS-CAPTURE + pestaña fracciones de SCREEN-LESSON-DETAIL + alta temporal en SCREEN-USERS. |
| FL/consumo-munición (OP-CMN-*, OP-CAR-*) | SCREEN-AMMO-CONSUMPTION (nivel 1) y SCREEN-WEAPON-CONSUMPTION (nivel 2), enlazadas entre sí. |
| FL/contexto-unidad (OP-AUT-003) | SCREEN-CONTEXT. |
| FL/recuperación (OP-RCV-*) | SCREEN-RECOVERY (pasos 1–4). |

## Huecos y límites declarados

- 🕯️ **Apariencia de 8 ejes.** La ruta `GET|PUT|DELETE /api/me/preferences/appearance/design-system/` está **implementada y consumida** (verificado 2026-10-15; `technical-design.md` §5.3): ocho campos `ds_*`, migración `0021_design_system_preferences` y rutas propias existen en el backend, con persistencia por usuario acreditada en runtime por las evidencias del plan de cierre y paridad de render aún `NOT_VERIFIED`. Fue el único cambio de backend autorizado y ejecutado; nada más se tocó (`front/AGENTS.md` §Límites). `OP-PRF-001/002` quedan trazados como legado que no gobierna los 8 ejes.
- **D-02 abierta, no bloqueante.** Capacidades sin endpoint (transferencia de stock, validación de resultados, export en servidor, `edit_self`, comandantes de unidad, historial global de asignaciones, edición del catálogo de permisos) **no generan pantallas ni botones**; se reportan como hueco (`requirements.md` §8; [`screens/exercises.md`](screens/exercises.md) §Huecos).
- **`range:delete` sin mapa.** `OP-RNG-006` no ofrece acción destructiva disponible por defecto (`R-DOM-SHT-003`).
- **B-01 (hipótesis estática).** La pestaña resultados de SCREEN-LESSON-DETAIL trata un posible fallo como error explícito; resumen y reporte no sustituyen el detalle (`requirements.md` §9, T-04).
- **Ninguna cifra de este catálogo afirma runtime.** Filtros, paginación y ordenamiento globales no comprobados (`backend-inventory.md` §Límites): las pantallas resuelven búsqueda/orden en cliente sobre arrays planos (`R-RES-22`).
