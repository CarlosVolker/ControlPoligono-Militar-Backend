---
spec_meta: "../spec-meta.yaml"
---

# Flujos de experiencia — Frontend integral

> 📖 Yo registro aquí los flujos de extremo a extremo del cliente: cada `FL-*` es una
> operación completa con actor, precondición, secuencia usuario → operación → respuesta
> real → actualización de UI, postcondición observable y cobertura de fallos. Este tomo
> es el índice canónico y el contrato común; el detalle vive en volúmenes anidados bajo
> `flows/`. La spec está **`approved`** desde el 2026-10-02; nada de lo escrito aquí autoriza implementación por sí mismo y la ejecución vigente se rige por el plan de cierre (verificado 2026-10-15).

## Índice

1. [Convenciones de lectura](#convenciones-de-lectura)
2. [Contrato común de fallos (F-*)](#contrato-común-de-fallos-f-)
3. [Volúmenes de detalle](#volúmenes-de-detalle)
4. [Consumidores provisionales del inventario](#consumidores-provisionales-del-inventario)
5. [Índice canónico de flujos (99 FL)](#índice-canónico-de-flujos-99-fl)

---

## Convenciones de lectura

- **Fuentes únicas.** Las operaciones se citan por `OP-*` de
  [backend-inventory.md](../backend-inventory.md); los payloads y respuestas por los
  [contratos](../backend-contracts.md); las reglas de UI por
  [requirements.md](../requirements.md) y los tomos `requirements/*.md`; el transporte y
  los guards por [technical-design.md](../technical-design.md). Ningún flujo copia
  payloads: los referencia.
- **Pantallas descriptivas.** Las pantallas se nombran de forma descriptiva («ficha de
  lección», «listado de unidades») y se anota el consumidor provisional `SCREEN/*` del
  inventario cuando existe. Los `SCREEN-*` definitivos los cruzará el integrador cuando
  el writer de pantallas entregue; este tomo no los asigna ni los espera.
- **Plantilla de flujo.** Cada `FL-*` declara: actor y permiso (el par
  `resource:action → permission_code` del inventario), pantalla, precondición, entradas
  (campos y selecciones con su origen real), tabla de secuencia numerada, postcondición
  observable y línea de fallos que referencia las clases `F-*` de este tomo más los
  literales específicos del flujo.
- **Estados.** Todo estado transitorio se cita por `ST-*` de
  [states.md](states.md), que es la SSOT de estados; los flujos no redefinen estados ni
  mensajes.
- **Mensajes literales.** Sólo se transcriben mensajes que un contrato ya cita
  (por ejemplo `La unidad no tiene padre. Indica target_unit_code para migrar.`). Donde
  el contrato no declara un mensaje, el flujo dice «mensaje del backend» y no lo inventa.
- **Ruta legacy vs ruta de ocho ejes.** Los flujos de apariencia distinguen en cada paso si
  la operación es una OP existente (`OP-PRF-001/002`, legacy) o la ruta de ocho ejes de
  `technical-design.md` §5.3, **hoy existente y consumida** (verificado 2026-10-15;
  `front/AGENTS.md` §Personalizador).

---

## Contrato común de fallos (F-*)

Todo flujo hereda estas doce clases. Un `FL-*` enumera las clases que le aplican y sus
deltas específicos; ninguna clase se redefine por volumen.

| ID | Disparador | Conducta obligatoria del cliente | Estado final | Fuente |
|---|---|---|---|---|
| F-01 | `400` de validación en mutación | Anclar cada mensaje al control que lo originó tal como viene; los errores no asociados a campo (`detail`, `error`, `non_field_errors`) permanecen visibles en el flujo; conservar valores introducidos; no resumir ni reescribir el mensaje | Formulario en ST-04 por campo, ST-09 conservado | `requirements.md` R-PREF-02; `requirements/organization.md` R-DOM-ORG-005 |
| F-02 | `403` de negocio con `detail` | Mostrar el `detail` literal en ST-07; no convertir en «sin datos», en cero ni en cierre de sesión; no modificar la representación local como si la operación hubiera sucedido | ST-07 | `requirements.md` R-AUTH-07; `technical-design.md` §2 reglas 4–5 |
| F-03 | `429` de throttling | Mensaje de espera; mostrar `Retry-After` si viene; sin reintento automático; botón de envío deshabilitado durante el vuelo. Declarado en login (`auth: 20/min`), selección de unidad (`unit_selection: 30/min`) y recuperación (`AuthEndpointThrottle`); en cualquier otro endpoint se aplica el mismo tratamiento si ocurre | ST-04 con espera | `technical-design.md` §2 regla 6, T-03; `requirements.md` §3.2 |
| F-04 | `404` | Error explícito con el mensaje del backend si existe; no pintar el registro ausente; ofrecer vuelta al listado y re-consulta (F-10) | ST-04 | `requirements/identity-authorization.md` R-DOM-AZ-008; `requirements/organization.md` R-DOM-ORG-015 |
| F-05 | `400` por unicidad | Anclar el error al campo o selector en conflicto (fracción+usuario, fracción+arma, carril no nulo, modelo+serie, lección+número, consumo+arma, RUT existente); no ofrecer alta duplicada; no deduplicar ni ocultar el registro existente en la tabla | ST-04 por campo | `requirements.md` R-RUL-03; `requirements/armory.md` R-DOM-ARM-008 |
| F-06 | Fallo de red o timeout sin respuesta | ST-04 explícito con acción de reintento (F-10); ninguna actualización optimista; no interpretar la ausencia de respuesta como éxito; no registrar PII del error (R-DAT-06). En lectura de apariencia, un fallo de red **no** significa «guardar los defaults» | ST-04 | `technical-design.md` §6.5; `requirements.md` R-DAT-06 |
| F-07 | Aborto por logout, cambio de principal o expiración | Abortar peticiones en vuelo; descartar respuestas tardías; vaciar colas de escritura (incluida la de apariencia); no dejar estado parcial | Purga → ST-00 | `requirements.md` R-AUTH-08, R-APP-06; `technical-design.md` §6.5 |
| F-08 | Cambio de contexto (unidad activa o tenant) | Incrementar `generation` del store; descartar toda respuesta de generación anterior (ST-08, nunca se pinta); recargar datos dependientes desde el nuevo contexto; sin caché persistente. Las preferencias de apariencia se conservan | ST-08 interno → recarga ST-01 | `requirements.md` R-AUTH-09, R-APP-06; `technical-design.md` §2 anti-carrera, §13 |
| F-09 | Cancelación y dirty state | Cancelar cierra el formulario o modal descartando **sólo** cambios no enviados y sin emitir petición; mientras el formulario está abierto, lo no enviado es visible como ST-09; ningún flujo envía en silencio al navegar | ST-00 o ST-02 previo | `requirements/exercises-consumption.md` R-DOM-EXC-004; `requirements/organization.md` R-DOM-ORG-014 |
| F-10 | Reintento explícito | Todo reintento re-consulta al backend y reentra por ST-01; nunca se resuelve desde caché; sin bucle automático en contexto perdido (R-ROUTER-07) ni tras `403` de selección de unidad (R-UNIT-02) | ST-01 | `technical-design.md` §13; `requirements.md` R-UNIT-02, R-ROUTER-07 |
| F-11 | Ausencia de datos | `200` con array vacío → ST-03, distinto de ST-04 y de ST-07; campo ausente → `—`; nunca `0` inventado ni registros sintéticos para «parecer» funcionar | ST-03 o `—` | `requirements.md` R-RES-23, R-DAT-01; `front/AGENTS.md` §Datos |
| F-12 | Sesión o contexto perdido | La API no emite `401`: un `403` de `HasTenantAccess` (`No tiene acceso al tenant solicitado.`) o sin sesión activa ⇒ purgar estado en memoria y volver a login sin reintentar; ruta `requiresTenant` sin tenant ⇒ pantalla de contexto perdido sin bucle. Se distingue de F-02: F-12 termina la sesión, F-02 la conserva | Purga → login | `requirements.md` R-AUTH-07, R-ROUTER-07; `technical-design.md` §2 regla 4 |

> 🕯️ Las clases F-* no agotan la respuesta: cada flujo anota además sus literales
> contractuales. Un error del backend nunca se traduce, se resume ni se convierte en
> otro estado.

---

## Volúmenes de detalle

| Volumen | Familias | Flujos |
|---|---|---|
| [flows/session-context.md](flows/session-context.md) | Login, bootstrap, contexto, unidad activa, logout, expiración | FL-SES-001…006 |
| [flows/recovery-password.md](flows/recovery-password.md) | Recuperación en cuatro pasos, cambio forzado, cambio propio, reseteo, bloqueo | FL-RCV-001, FL-PWD-001…005 |
| [flows/organization.md](flows/organization.md) | Unidades, previsualización y migración, recintos M2M | FL-ORG-001…012 |
| [flows/identity.md](flows/identity.md) | Usuarios, temporal y promoción, asignaciones, puestos, holders, memberships | FL-IDT-001…017 |
| [flows/authorization.md](flows/authorization.md) | Roles, catálogos, matrices RBAC, overrides, consultas operativas, auditoría | FL-AZ-001…013, FL-AUD-001 |
| [flows/armory-weapons.md](flows/armory-weapons.md) | Armerías, armas, calibres | FL-ARM-001…003, FL-WPN-001…004, FL-CAL-001…002 |
| [flows/shooting-lessons.md](flows/shooting-lessons.md) | Polígonos, lecciones y sus cinco lecturas | FL-SHT-001…012 |
| [flows/shooting-capture.md](flows/shooting-capture.md) | Fracciones, preparación de captura, resultados | FL-SHT-013…019 |
| [flows/exercises.md](flows/exercises.md) | Ejercicios, consumo de munición, consumo de arma | FL-EXC-001…003, FL-CMN-001…003, FL-CAR-001…002 |
| [flows/appearance.md](flows/appearance.md) | Personalizador de 8 ejes: carga, autosave, reset, principal, público, legacy | FL-APP-001…008 |

---

## Consumidores provisionales del inventario

El inventario asignó consumidores provisionales `FL/*`. Esta tabla los traduce a los
`FL-*` canónicos; el inventario no se modifica desde este write set.

| Consumidor provisional | Flujos canónicos |
|---|---|
| `FL/bootstrap` | FL-SES-002 |
| `FL/sesión` | FL-SES-005, FL-SES-006 |
| `FL/contexto-unidad` | FL-SES-003, FL-SES-004 |
| `FL/recuperación` | FL-RCV-001 |
| `FL/contraseña` | FL-PWD-001…003 |
| `FL/asignación-principal` | FL-IDT-007 |
| `FL/asignaciones` | FL-IDT-008…010 |
| `FL/captura-tiro` | FL-IDT-004, FL-SHT-012, FL-SHT-015…019 |
| `FL/eliminar-unidad` | FL-ORG-004, FL-ORG-005 |
| `FL/selectores` | FL-ORG-006, FL-ORG-007 |
| `FL/recinto-unidades` | FL-ORG-011, FL-ORG-012 |
| `FL/holders` | FL-IDT-014, FL-IDT-015 |
| `FL/consumo-munición` | FL-CMN-001…003, FL-CAR-001…002 |

---

## Índice canónico de flujos (99 FL)

Totales por familia: SES 6 · RCV 1 · PWD 5 · ORG 12 · IDT 17 · AZ 13 · AUD 1 · ARM 3 ·
WPN 4 · CAL 2 · SHT 19 · EXC 3 · CMN 3 · CAR 2 · APP 8. **Total: 99 flujos.**

### Sesión y contexto — [volumen](flows/session-context.md)

| FL | Flujo | Actor | OP principales |
|---|---|---|---|
| FL-SES-001 | Login y captura de institución | Usuario público | OP-AUT-001 |
| FL-SES-002 | Bootstrap y recarga profunda | Usuario autenticado / público | OP-AUT-002 |
| FL-SES-003 | Contexto inicial y selección de unidad | Usuario autenticado | OP-AUT-002, OP-AUT-003 |
| FL-SES-004 | Cambio de unidad activa | Usuario con varias unidades | OP-AUT-003, OP-AUT-002 |
| FL-SES-005 | Logout | Usuario autenticado | OP-AUT-005 |
| FL-SES-006 | Expiración y contexto perdido | Sistema / usuario | ninguna (reacción) |

### Recuperación y contraseña — [volumen](flows/recovery-password.md)

| FL | Flujo | Actor | OP principales |
|---|---|---|---|
| FL-RCV-001 | Recuperación de contraseña en cuatro pasos | Usuario público | OP-RCV-001…004 |
| FL-PWD-001 | Cambio de contraseña forzado | Usuario con `must_change_password` | OP-USR-013, OP-AUT-002 |
| FL-PWD-002 | Cambio de contraseña propio | Usuario autenticado | OP-USR-013 |
| FL-PWD-003 | Reseteo de contraseña a otro | `user:update → update_users` | OP-USR-014 |
| FL-PWD-004 | Consulta de estado de bloqueo | `user:read → view_personnel_basic` | OP-USR-015 |
| FL-PWD-005 | Desbloqueo de cuenta | `user:update → update_users` | OP-USR-016 |

### Organización — [volumen](flows/organization.md)

| FL | Flujo | Actor | OP principales |
|---|---|---|---|
| FL-ORG-001 | Consulta de unidades y árbol | `organization_unit:read` | OP-UNT-001, OP-UNT-003 |
| FL-ORG-002 | Alta de unidad | `organization_unit:create` | OP-UNT-002, OP-UNT-010 |
| FL-ORG-003 | Edición de unidad | `organization_unit:update` | OP-UNT-004/005 |
| FL-ORG-004 | Previsualización de eliminación | `organization_unit:delete` | OP-UNT-007 |
| FL-ORG-005 | Eliminación con migración | `organization_unit:delete` | OP-UNT-008, OP-UNT-010 |
| FL-ORG-006 | Lookup de unidades (selector) | `organization_unit:read` | OP-UNT-009 |
| FL-ORG-007 | Unidades asignables (selector) | Usuario autenticado (IA+TA) | OP-UNT-010 |
| FL-ORG-008 | Consulta de recintos | `recinto:read` | OP-RCT-001, OP-RCT-003 |
| FL-ORG-009 | Alta y edición de recinto | `recinto:create` / `recinto:update` | OP-RCT-002, OP-RCT-004/005 |
| FL-ORG-010 | Eliminación de recinto | `recinto:delete` | OP-RCT-006 |
| FL-ORG-011 | Agregar unidad a recinto | `recinto:update` | OP-RCT-007 |
| FL-ORG-012 | Quitar unidad de recinto | `recinto:update` | OP-RCT-008 |

### Identidad — [volumen](flows/identity.md)

| FL | Flujo | Actor | OP principales |
|---|---|---|---|
| FL-IDT-001 | Consulta de usuarios | `user:read → view_personnel_basic` | OP-USR-001, OP-USR-003 |
| FL-IDT-002 | Alta de usuario formal | `user:create → create_users` | OP-USR-002, OP-AZC-002, OP-AZC-004 |
| FL-IDT-003 | Promoción de temporal por alta formal | `user:create → create_users` | OP-USR-002 |
| FL-IDT-004 | Alta de usuario temporal | `user:create → create_users` | OP-USR-012 |
| FL-IDT-005 | Edición de usuario | `user:update → update_users` | OP-USR-004/005 |
| FL-IDT-006 | Eliminación de usuario | `user:delete → disable_users` | OP-USR-006 |
| FL-IDT-007 | Asignación principal | `user:update → update_users` | OP-USR-007/008, OP-AZC-002, OP-AZC-004 |
| FL-IDT-008 | Desactivación de asignación principal | `user:update → update_users` | OP-USR-009 |
| FL-IDT-009 | Alta de asignación secundaria | `user:update → update_users` | OP-USR-010 |
| FL-IDT-010 | Baja de asignación | `user:update → update_users` | OP-USR-011 |
| FL-IDT-011 | Consulta de puestos e histórico | `position:read` | OP-POS-001, OP-POS-003, OP-POS-009 |
| FL-IDT-012 | Alta y edición de puesto | `position:create` / `position:update` | OP-POS-002, OP-POS-004/005 |
| FL-IDT-013 | Eliminación de puesto | `position:delete` | OP-POS-006 |
| FL-IDT-014 | Asignación de holder | `position:update` | OP-POS-007 |
| FL-IDT-015 | Baja de holder | `position:update` | OP-POS-008 |
| FL-IDT-016 | Alta y edición de membership | Permiso derivado de `(position, action)` | OP-MEM-002, OP-MEM-004/005 |
| FL-IDT-017 | Baja de membership y cambio de primaria | Permiso derivado de `(position, action)` | OP-MEM-006, OP-MEM-004/005 |

### Autorización y auditoría — [volumen](flows/authorization.md)

| FL | Flujo | Actor | OP principales |
|---|---|---|---|
| FL-AZ-001 | Consulta de roles | IA+TA | OP-ROL-001, OP-ROL-003 |
| FL-AZ-002 | Alta y edición de rol | IA+TA+TAdmin | OP-ROL-002, OP-ROL-004/005 |
| FL-AZ-003 | Eliminación de rol | IA+TA+TAdmin | OP-ROL-006 |
| FL-AZ-004 | Catálogos de scopes y permisos (solo lectura) | IA+TA | OP-SCP-001/002, OP-PRM-001/002 |
| FL-AZ-005 | Gestión de RolePermission (matriz rol→permiso) | IA+TA+TAdmin; rol de sistema sólo `super_admin` | OP-RPR-001…006, OP-AZC-001 |
| FL-AZ-006 | Gestión de PositionPermission (matriz puesto→permiso) | IA+TA+TAdmin | OP-PPR-001…006, OP-AZC-001 |
| FL-AZ-007 | Alta y edición de override | IA+TA+TAdmin | OP-OVR-002, OP-OVR-004/005 |
| FL-AZ-008 | Eliminación de override | IA+TA+TAdmin | OP-OVR-006 |
| FL-AZ-009 | Consulta de overrides | IA+TA+TAdmin | OP-OVR-001, OP-OVR-003 |
| FL-AZ-010 | Fill de matriz con catálogo authz | IA+TA | OP-AZC-001 |
| FL-AZ-011 | Categorías de roles | IA+TA | OP-AZC-002 |
| FL-AZ-012 | Personas por unidad | IA+TA | OP-AZC-003 |
| FL-AZ-013 | Unidades elegibles por persona | IA+TA | OP-AZC-004 |
| FL-AUD-001 | Bitácora de auditoría | `tenant_admin`, `super_admin` o `auditor` | OP-AUT-004 |

### Armería, armas y calibres — [volumen](flows/armory-weapons.md)

| FL | Flujo | Actor | OP principales |
|---|---|---|---|
| FL-ARM-001 | Consulta de armerías | `armory:read` | OP-ARM-001, OP-ARM-003 |
| FL-ARM-002 | Alta y edición de armería | `armory:create` / `armory:update` | OP-ARM-002, OP-ARM-004/005 |
| FL-ARM-003 | Eliminación de armería | `armory:delete` | OP-ARM-006 |
| FL-WPN-001 | Consulta de armas | `weapon:read → warehouse` | OP-WPN-001, OP-WPN-003 |
| FL-WPN-002 | Alta de arma | `weapon:create → warehouse` | OP-WPN-002, OP-ARM-001, OP-CAL-001 |
| FL-WPN-003 | Edición de arma | `weapon:update → warehouse` | OP-WPN-004/005 |
| FL-WPN-004 | Eliminación de arma | `weapon:delete → warehouse` | OP-WPN-006 |
| FL-CAL-001 | Consulta de calibres (catálogo global) | `calibre:read → view_exercises` | OP-CAL-001, OP-CAL-003 |
| FL-CAL-002 | Gestión de calibres | `calibre:manage → manage_calibre` + `super_admin` | OP-CAL-002, OP-CAL-004/005/006 |

### Tiro: polígonos y lecciones — [volumen](flows/shooting-lessons.md)

| FL | Flujo | Actor | OP principales |
|---|---|---|---|
| FL-SHT-001 | Consulta de polígonos | `range:read → view_unit` | OP-RNG-001, OP-RNG-003 |
| FL-SHT-002 | Alta y edición de polígono | `range:create/update → *_shooting_lessons` | OP-RNG-002, OP-RNG-004/005 |
| FL-SHT-003 | Eliminación de polígono (restringida) | sin mapa `range:delete` declarado | OP-RNG-006 |
| FL-SHT-004 | Lecciones del polígono | `range:read → view_unit` | OP-RNG-007 |
| FL-SHT-005 | Alta de lección | `shooting_session:create` | OP-LES-002 |
| FL-SHT-006 | Edición de lección | `shooting_session:update` | OP-LES-004/005 |
| FL-SHT-007 | Eliminación de lección | `shooting_session:delete` | OP-LES-006 |
| FL-SHT-008 | Ficha de lección: fracciones y tiradores | `shooting_session:read` | OP-LES-007, OP-LES-008 |
| FL-SHT-009 | Resultados detallados de lección | `shooting_session:read` + `can_read_detail` | OP-LES-009 |
| FL-SHT-010 | Resumen de lección | `shooting_session:read_summary` | OP-LES-010 |
| FL-SHT-011 | Reporte de lección | `shooting_session:read` | OP-LES-011 |
| FL-SHT-012 | Tiradores elegibles | `shooting_session:read` | OP-LES-012 |

### Tiro: fracciones y captura — [volumen](flows/shooting-capture.md)

| FL | Flujo | Actor | OP principales |
|---|---|---|---|
| FL-SHT-013 | Alta y edición de fracción | `shooting_fraction:create/update` | OP-FRC-002, OP-FRC-004/005 |
| FL-SHT-014 | Eliminación de fracción | `shooting_fraction:delete` | OP-FRC-006 |
| FL-SHT-015 | Preparación de captura de fracción | `shooting_fraction:read` | OP-FRC-007 |
| FL-SHT-016 | Alta de resultado (captura por carril) | `shooting_result:create` | OP-RES-002 |
| FL-SHT-017 | Edición de resultado | `shooting_result:update` | OP-RES-004/005 |
| FL-SHT-018 | Eliminación de resultado | `shooting_result:delete` | OP-RES-006 |
| FL-SHT-019 | Detalle de resultados de fracción | `shooting_fraction:read` + detalle | OP-FRC-008 |

### Ejercicios y consumos — [volumen](flows/exercises.md)

| FL | Flujo | Actor | OP principales |
|---|---|---|---|
| FL-EXC-001 | Consulta de ejercicios | `ejercicio_militar:read` | OP-EJR-001, OP-EJR-003 |
| FL-EXC-002 | Alta y edición de ejercicio | `ejercicio_militar:create/update` | OP-EJR-002, OP-EJR-004/005 |
| FL-EXC-003 | Eliminación de ejercicio | `ejercicio_militar:delete` | OP-EJR-006 |
| FL-CMN-001 | Consulta de consumos de munición | `consumo_municion:read` | OP-CMN-001, OP-CMN-003 |
| FL-CMN-002 | Alta y edición de consumo de munición | `consumo_municion:create/update` | OP-CMN-002, OP-CMN-004/005 |
| FL-CMN-003 | Eliminación de consumo de munición | `consumo_municion:delete` | OP-CMN-006 |
| FL-CAR-001 | Alta y edición de consumo de arma | `consumo_arma:create/update` | OP-CAR-002, OP-CAR-004/005 |
| FL-CAR-002 | Eliminación de consumo de arma | `consumo_arma:delete` | OP-CAR-006 |

### Apariencia — [volumen](flows/appearance.md)

| FL | Flujo | Actor | OP principales |
|---|---|---|---|
| FL-APP-001 | Restauración de apariencia antes de ready | Usuario autenticado | ruta de 8 ejes §5.3 (GET) — **existe** (verificado 2026-10-15) |
| FL-APP-002 | Cambio de eje: preview y autosave | Usuario autenticado | ruta de 8 ejes §5.3 (PUT) — **existe** (verificado 2026-10-15) |
| FL-APP-003 | Reset a defaults | Usuario autenticado | ruta de 8 ejes §5.3 (DELETE) — **existe** (verificado 2026-10-15) |
| FL-APP-004 | Error de guardado o lectura de apariencia | Usuario autenticado | ruta de 8 ejes §5.3 — **existe** (verificado 2026-10-15) |
| FL-APP-005 | Logout y cambio de principal | Usuario autenticado | ninguna (purga local) |
| FL-APP-006 | Cambio de unidad activa (conserva) | Usuario autenticado | ninguna (conservación local) |
| FL-APP-007 | Modo público: defaults sin persistencia | Usuario público | ninguna |
| FL-APP-008 | Ruta legacy de tres campos (separada) | Usuario autenticado | OP-PRF-001, OP-PRF-002 |

---

> 🕯️ Un flujo sin endpoint real no entra en este registro: las capacidades sin endpoint
> del inventario (transferencia de stock, validación de resultados, exportación, edición
> de datos propios, comandantes de unidad, historial global de asignaciones, edición del
> catálogo de permisos) no tienen `FL-*` y su hueco queda registrado en
> `requirements.md` §8. Referenciar una pantalla no acredita que exista: los `SCREEN-*`
> los cruzará el integrador.
