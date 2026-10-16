---
spec_meta: "./spec-meta.yaml"
---

# Verification — Frontend integral

> 📖 Yo registro aquí **cómo se verificará** el frontend integral: los criterios de
> aceptación observables `AC-*`, uno por flujo canónico más los transversales, con su
> precondición, acción, resultado observable, datos del backend real, fallos y fuente del
> Design System. [spec-meta.yaml](spec-meta.yaml) registra `status: approved` con
> `approved_at: 2026-10-02` por su carril de gobernanza, en paralelo a esta tarea;
> `verified_at` permanece null, ningún gate está en `passed` y esa aprobación no autoriza
> implementación por sí sola (spec-meta.yaml:63-72). El plan de
> implementación tiene como ruta canónica prevista
> [implementation-plan.md](implementation-plan.md), en persistencia por su propio carril
> (no leído ni verificado aquí). **Ningún escenario de este tomo se ha ejecutado.**

## Índice

1. [Alcance de la verificación](#alcance-de-la-verificación)
2. [Gates de calidad](#gates-de-calidad)
3. [Requisito de autorización](#requisito-de-autorización)
4. [Convenciones de los criterios AC-*](#convenciones-de-los-criterios-ac-)
5. [AC por flujo (99)](#ac-por-flujo-99)
6. [AC transversales y de integración (32)](#ac-transversales-y-de-integración-32)
7. [Equivalencia con la lista anterior (V-*)](#equivalencia-con-la-lista-anterior-v-)
8. [Pruebas automatizadas admitidas por el gate `tests`](#pruebas-automatizadas-admitidas-por-el-gate-tests)
9. [Cobertura documental (verificable sin ejecutar nada)](#cobertura-documental-verificable-sin-ejecutar-nada)
10. [Riesgos de verificación](#riesgos-de-verificación)
11. [Criterio de cierre](#criterio-de-cierre)

---

## 1. Alcance de la verificación

Este tomo define **cómo se verificará** el frontend integral. No registra ninguna
verificación ejecutada: ninguna prueba, build, lint, navegador, instalación, migración ni
escritura en base de datos se ha ejecutado en la elaboración de esta spec.

Dos clases de evidencia, mantenidas distintas:

| Clase | Qué prueba | Estado |
|---|---|---|
| **Evidencia observable de usuario** | el operador ve la pantalla real con sus datos reales | **la que decide** si el objetivo se cumplió |
| **Pruebas automatizadas** | tests de regresión sobre comportamiento ya existente | insuficiente por sí sola |

Una suite en verde, un build o un lint **no** prueban que una pantalla exista, muestre el
dato correcto ni respete el Design System; no se toman en cuenta —ni de forma auxiliar—
para decidir si el objetivo de usuario funciona. El criterio de cierre es el resultado
observable.

## 2. Gates de calidad

| Gate | Estado en metadata | Alcance de esta spec |
|---|---|---|
| `tests` | `required` — **no pasado** | regresión sobre cliente HTTP, validación de forma, reglas de sesión, autosave de apariencia y guards de navegación |
| `security_review` | `required` — **no pasado** | flags `auth`, `permissions`, `sensitive-data` |
| `code_review` | `required` — **no pasado** | mantenibilidad del cliente (incluye el tooling de tipos de D-08 cuando se ejecute) |
| `documentation` | `required` — **no pasado** | coherencia spec ↔ código ↔ `front/AGENTS.md` |

Los `tests` no cubren auditoría de infraestructura, hardening de producción, despliegue ni
rendimiento: fuera del foco declarado. **Ningún gate está en `passed`** y este tomo los
preserva como previstos-no-superados.

## 3. Requisito de autorización

**Nada de lo siguiente está autorizado.** Cada punto requiere orden explícita del
operador, por separado:

- `pnpm dev` o cualquier servidor de desarrollo.
- Navegador, MCP de navegador o captura de pantalla.
- Cuentas, tenants, unidades o permisos de prueba.
- `manage.py test`, lint o build; instalación de dependencias (incluido `vue-router`) y
  tooling de tipos/migración TS (T-26).
- **Escritura sobre la base de datos real**, en cualquier forma. Esto incluye **aplicar la
  migración** de preferencias del Design System: requiere orden explícita aparte. No se
  ejecutarán acciones destructivas (borrar, desactivar, eliminar con migración, cambiar
  contraseña de otro, desbloquear) contra datos reales sólo para «revisar».
- Modificación de `.env` o de la configuración de CORS/CSRF.

Los `AC-*` son **escenarios propuestos, no ejecutados**. No se usan fixtures ni datos de
ejemplo (prohibidos por el contrato de datos), y la verificación real usará sólo datos del
backend que el operador autorice, sin exponer datos reales privados en artefactos. Que la
app final ofrezca acciones existentes sobre recursos del usuario real es un **requisito
funcional**, no un permiso de verificación.

## 4. Convenciones de los criterios AC-*

- **Nombramiento.** `AC-<familia>-<número>` refleja 1:1 los 99 `FL-*` canónicos de
  [flows.md](experience/flows.md) (mismo sufijo numérico); las familias transversales son
  `INT` (integraciones justificadas), `TRA` (transporte), `RES` (reglas de presentación),
  `DAT` (datos y privacidad), `DS` (Design System), `NAV` (navegación) y `BCK` (backend de
  preferencias). Total: **131 AC** = 99 + 32.
- **Estado.** Todos los AC están `NOT_VERIFIED` por falta de autorización (§3), no por
  fallo de diseño. Ninguno se da por cumplido hoy.
- **Datos reales.** Precondición y acción usan el backend real en `127.0.0.1:8000`
  (**reportado por el operador y no verificado** por esta spec) con cuentas/tenants/unidades
  que el operador autorice; sin fixtures, sin mocks ni registros sintéticos.
- **Fallos.** Citados por las clases `F-01…F-12` de
  [flows.md](experience/flows.md) §Contrato común; cada AC anota además sus literales
  contractuales propios.
- **DS fuente.** Página exacta de la biblioteca externa catalogada en
  [reference-pages.md](design-system/reference-pages.md); una referencia DS demuestra un
  patrón disponible, no una pantalla implementada.
- **Stack del cliente.** TypeScript por orden explícita del operador del 2026-10-02 (D-08,
  registrado en `requirements.md` §12, citado vía `AGENTS.md`; `requirements.md` no fue
  re-leído en esta tarea). El baseline JavaScript quedó **superado** (verificado 2026-10-15):
  `front/src/` está en **TypeScript** (38 `.vue` con `lang="ts"`, 34 `.ts`, 0 `.js`); el kit
  externo del DS sigue siendo HTML/CSS/JS como fuente de referencia (hecho, no objetivo de
  conversión).
- **Trazabilidad.** Cada AC refleja 1:1 su FL canónico de
  [flows.md](experience/flows.md) y sus OP del manifest de
  [backend-inventory.md](backend-inventory.md); la lista de tareas que lo materializa está
  en [tasks.md](tasks.md). Nota de concurrencia: la matriz de cobertura de 162 filas que
  esta instancia escribió en `coverage.md` fue sustituida por el índice del workstream
  paralelo `frontend-trace-matrix-resume` (su matriz vive en `coverage/operations.md`, con
  la convención `AC-OP-*`/`T-FL-*`, distinta de la de este tomo); la reconciliación de
  ambos sistemas de IDs corresponde al lane integrador del orquestador y se reporta sin
  resolver.

## 5. AC por flujo (99)

### Sesión y contexto — [volumen](experience/flows/session-context.md)

| AC | FL · OP | Precondición (datos reales) | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-SES-001 | FL-SES-001 · OP-AUT-001 | RUT y contraseña reales de cuenta autorizada; institución (tenant) real; sin sesión | Enviar el login en `/login` con los tres campos | Sesión por cookie establecida; `id_usuario` y tenant sólo en memoria; con `must_change_password: true` entra al flujo forzado; si es `false`, al flujo de contexto preservando `query.redirect` | `400` literal del backend sin sugerir credenciales (F-01); `429` `auth: 20/min` → espera con envío deshabilitado (F-03); red → F-06 | `auth-signin.html` |
| AC-SES-002 | FL-SES-002 · OP-AUT-002 | Sesión viva con cookie; tenant en memoria (navegación SPA) | Abrir o recargar cualquier URL, incluida una de detalle | Estado `booting` y guards esperan al contexto; la pantalla de la URL queda reconstruida; jamás expulsión al login por resolver contra contexto vacío | `403` de tenant → F-12 (purga + login sin reintento); red → F-06 con reintento explícito; recarga profunda **sin** tenant → `/contexto` (G-SES-1, hueco abierto: no resuelto) | `index.html` (shell) |
| AC-SES-003 | FL-SES-003 · OP-AUT-002, OP-AUT-003 | Usuario autenticado sin unidad activa resuelta | Ir a `/contexto` y seleccionar unidad tomada sólo de `assignments`/`unit_membership` del contexto | Contexto completo en memoria (usuario, tenant, unidad, scopes, `permissions[]`); menú poblado por permisos reales; navegación al destino preservado o al dashboard | `400` código ausente → F-01; `403` literales por modo («La unidad no está en tus pertenencias activas.» / «La unidad no esta en sus asignaciones activas.») sin reintento; `429` `unit_selection: 30/min` → F-03 | `forms-basic.html`, `ui-card.html` |
| AC-SES-004 | FL-SES-004 · OP-AUT-003, OP-AUT-002 | Usuario real con ≥2 unidades activas y pantallas abiertas con datos | Cambiar la unidad activa desde el topbar o `/contexto` | Toda superficie muestra datos de la nueva unidad; ningún dato de la unidad anterior sobrevive en vistas activas (respuesta tardía descartada: nada cambia, ST-08); la apariencia se conserva | `403` literales sin reintentar; red → la unidad en memoria no cambia hasta respuesta exitosa; concurrencia → F-08 | `index.html` (topbar) |
| AC-SES-005 | FL-SES-005 · OP-AUT-005 | Sesión viva con peticiones en vuelo y cola de apariencia pendiente | Pulsar «Cerrar sesión» en el dropdown de usuario | Aborto de peticiones en vuelo; purga de **todo** el estado en memoria; apariencia restablecida a defaults; redirección a `/login`; al volver a abrir, ningún dato previo accesible | Fallo de red en el logout → purga y redirección igualmente (intento único, sin reintento); sesión ya inválida → mismo camino de purga (F-12) | `ui-dropdown.html` |
| AC-SES-006 | FL-SES-006 · reacción (ninguna OP) | Sesión expirada, cancelada en otro extremo o tenant inválido, en ruta activa | Ejecutar cualquier operación | La API no emite `401`: `403` de tenant/sesión → purga y `/login` **sin bucle de reintento**; ruta `requiresTenant` sin tenant → SCREEN-CONTEXT-LOST sin bucle; `403` de negocio con `detail` **conserva** la sesión y muestra el literal (F-02 ≠ F-12) | Diferenciación por `detail` y contexto, nunca por código solo | `pages-404-alt.html`, `ui-alerts.html` |

### Recuperación y contraseña — [volumen](experience/flows/recovery-password.md)

| AC | FL · OP | Precondición (datos reales) | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-RCV-001 | FL-RCV-001 · OP-RCV-001…004 | Sin sesión; RUT real con correo registrado; código real recibido (expira a los 5 minutos) | Recorrer los cuatro pasos de `/recuperar` con los bodies exactos `{rut}`, `{rut, correo}`, `{rut, codigo}`, `{rut, codigo, nueva_contrasena}` | `200` por paso avanza; `correo_censurado` mostrado tal cual si viene; paso 4 exitoso cierra el asistente, redirige a login y consume el código; el siguiente login funciona con la contraseña nueva | Pasos 1–2: respuesta genérica siempre; prohibido inferir existencia de RUT; `400` en pasos 3–4 permanece **en el paso** con `mensaje`/`errores[]` literales; `429` → F-03; red → F-06 sin avance | `auth-password.html` |
| AC-PWD-001 | FL-PWD-001 · OP-USR-013, OP-AUT-002 | Cuenta real con `must_change_password: true` | Intentar cualquier ruta y cambiar la contraseña en `/password-required` (sin `old_password`) | Toda ruta operativa bloqueada salvo el cambio forzado y login; éxito refresca el contexto y la bandera queda en falso; el siguiente login ya no fuerza el cambio | `400 {error}` literal, permanece en el flujo; flujo bloqueante: sin cancelación posible | `auth-signin.html` (card), `forms-validation.html` |
| AC-PWD-002 | FL-PWD-002 · OP-USR-013 | Cuenta propia con bandera en falso | Cambiar la contraseña propia desde la acción de cuenta | El formulario exige `old_password` exactamente cuando la bandera es falsa y lo omite cuando es verdadera (regla del backend, no propia); éxito con `detail` visible | `400 {error}` literal; red → F-06 | `ui-modal.html`, `forms-validation.html` |
| AC-PWD-003 | FL-PWD-003 · OP-USR-014 | Usuario objetivo real cargado en su ficha (no la propia cuenta) | Resetear contraseña con confirmación ST-10 | Objetivo queda con `must_change_password` true y `password_changed_at` nulo; flags actualizados en la ficha; la UI bloquea de antemano el intento sobre la propia cuenta | Reset propio → `400` conservado; `403` → F-02; red → modal cerrado sin flags locales cambiados | `ui-modal.html` |
| AC-PWD-004 | FL-PWD-004 · OP-USR-015 | Usuario real cargado | Abrir el panel de estado de cuenta | Los cinco campos reales (`rut`, `is_locked`, fallos, límite, último intento); `last_attempt` ausente → `—`, sin fecha inventada | `403` → F-02; `404` → F-04; red → F-06/F-10 | `ui-card.html`, `ui-badge.html` |
| AC-PWD-005 | FL-PWD-005 · OP-USR-016 | Cuenta real bloqueada con estado consultado | Desbloquear con confirmación ST-10 | Estado posterior real visible por re-consulta de OP-USR-015; `registros_eliminados?` mostrado si viene | `403` → F-02; `404` → F-04; red → sin cambio local de `is_locked` | `ui-modal.html` |

### Organización — [volumen](experience/flows/organization.md)

| AC | FL · OP | Precondición (datos reales) | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-ORG-001 | FL-ORG-001 · OP-UNT-001, OP-UNT-003 | Contexto con tenant y unidad activa | Abrir `/organizacion/unidades` y seleccionar una unidad | Sólo unidades retornadas representadas; árbol client-side vía `parent_code`; raíz rotulada; relación padre por código y nombre resuelto desde la respuesta o `—`; selección conservada al abrir la ficha | `403` → F-02; red → F-06/F-10; `200` vacío → ST-03 (F-11) | `ui-list-group.html` / `tables-basic.html` |
| AC-ORG-002 | FL-ORG-002 · OP-UNT-002, OP-UNT-010 | Usuario autorizado; selector de padre alimentado por unidades asignables reales | Crear unidad con los 10 `unit_type` reales, excluyendo `id`/`tenant`/`parent_code` del envío | La nueva unidad aparece en el árbol con los datos **devueltos por el servidor**, no los del formulario; su detalle queda disponible | `400` → F-01 con valores conservados (ST-09); `403` → F-02 sin modificar la representación local; red → F-06 sin fila optimista; cancelar → F-09 | `ui-modal.html`, `forms-basic.html` |
| AC-ORG-003 | FL-ORG-003 · OP-UNT-004, OP-UNT-005 | Unidad real cargada | Editar y enviar (PUT completo o PATCH parcial según envío) | La ficha muestra el objeto devuelto; árbol refrescado | `400` → F-01; `404` → F-04; cancelar → F-09 sin petición | `forms-validation.html` |
| AC-ORG-004 | FL-ORG-004 · OP-UNT-007 | Unidad real seleccionada | Pulsar la acción destructiva | ST-10 abierta con los **ocho contadores reales** (`assignments, weapons, ranges, lessons, fractions, results, child_units, lessons_as_participant`); confirmación final bloqueada hasta que `unit_code`/`unit_name` correspondan a la unidad elegida | `403` → F-02; `404` → F-04; red → la confirmación no se abre con contadores inventados | `ui-modal.html`, `ui-alerts.html` |
| AC-ORG-005 | FL-ORG-005 · OP-UNT-008, OP-UNT-010 | Previsualización exitosa y correspondiente; para raíz sin padre, destino explícito real elegido | Confirmar la eliminación con migración | `detail`, `target_unit_code` y `moved` visibles; los conteos migrados coinciden con la previsualización; `assignments` aparece sólo como **informe** con advertencia literal (no rotulado como migrado; nota estática B-02); la unidad deja de aparecer tras recarga | Raíz sin destino → `400` literal «La unidad no tiene padre. Indica target_unit_code para migrar.» y la UI exige destino antes de enviar; `400/403/404` mantienen ST-10 abierta con el motivo y sin eliminar filas locales | `ui-modal.html`, `ui-alerts.html` |
| AC-ORG-006 | FL-ORG-006 · OP-UNT-009 | Flujo consumidor abierto (p. ej. asignación) | Abrir el selector de unidades (lookup) | Exclusivamente `results`: todas las unidades activas del tenant sin filtro de rama; búsqueda vacía, sin coincidencias y denegada son estados distintos | `403` → F-02; red → F-06; `results` vacío → ST-03 | `forms-basic.html` (select) |
| AC-ORG-007 | FL-ORG-007 · OP-UNT-010 | Flujo consumidor abierto (alta de unidad, destino de migración, asignaciones) | Abrir el selector de unidades asignables | Rama de asignación real del solicitante; el listado **no acredita autorización** (caso `admin_unidad`: create valida después) | `403` → F-02; red → F-06 | `forms-basic.html` |
| AC-ORG-008 | FL-ORG-008 · OP-RCT-001, OP-RCT-003 | Contexto activo | Abrir `/organizacion/recintos` y un recinto | Columnas del contrato con `—` en descripción ausente; detalle con `unit_codes` y `unit_count` para editar la relación | `403` → F-02; `404` → F-04; vacío → ST-03 | `tables-basic.html` |
| AC-ORG-009 | FL-ORG-009 · OP-RCT-002, OP-RCT-004, OP-RCT-005 | — | Crear/editar recinto omitiendo los campos RO (`id`, `tenant`, `unit_codes`, `unit_count`) | Los conteos mostrados provienen de la respuesta, no del formulario; detalle y listado refrescados; cancelar descarta sólo cambios no enviados | `400` → F-01; `404` → F-04; red → F-06 | `ui-modal.html`, `forms-basic.html` |
| AC-ORG-010 | FL-ORG-010 · OP-RCT-006 | Recinto real cargado | Eliminar con confirmación ST-10 | Listado refrescado **sólo tras éxito**; la confirmación no promete migración automática de las unidades del recinto (el contrato no la declara) | `403` → F-02; `404` → F-04; red → sin borrado local | `ui-modal.html` |
| AC-ORG-011 | FL-ORG-011 · OP-RCT-007 | Detalle de recinto; unidad real desde lookup | Agregar unidad por código | `unit_count` devuelto visible; ambas relaciones refrescadas | Unidad inexistente/inaccesible → `404` **sin insertar relación local** (F-04); `403` → F-02 | `ui-modal.html`, `ui-list-group.html` |
| AC-ORG-012 | FL-ORG-012 · OP-RCT-008 | Relación existente visible en `unit_codes` | Quitar unidad con confirmación que identifica recinto y código | `unit_count` devuelto visible; detalle actualizado | Relación ausente → error explícito, **no** éxito idempotente; red → la relación permanece visible hasta respuesta exitosa | `ui-modal.html` |

### Identidad — [volumen](experience/flows/identity.md)

| AC | FL · OP | Precondición (datos reales) | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-IDT-001 | FL-IDT-001 · OP-USR-001, OP-USR-003 | Contexto activo | Abrir `/personas` y una ficha | Sólo personas del scope del usuario; identidad diferenciada de asignaciones activas; flags y `primary_assignment` visibles; búsqueda client-side | `403` → F-02; `404` → F-04; vacío → ST-03; red → F-06/F-10 | `tables-basic.html`, `ui-card.html` |
| AC-IDT-002 | FL-IDT-002 · OP-USR-002, OP-AZC-002, OP-AZC-004 | Selectores reales: roles por categoría y unidades elegibles | Crear usuario formal con los requeridos reales e `initial_*` cuando el flujo los solicite | La persona existe con su asignación inicial real; nada pintado en la tabla antes del `201`; campos derivados y flags RO | RUT duplicado formal → F-05 sobre `rut`; usuario sin permiso de alta → `403` visible del backend (F-02); red → F-06 sin fila optimista; cancelar → F-09 | `ui-modal.html`, `forms-validation.html` |
| AC-IDT-003 | FL-IDT-003 · OP-USR-002 | Usuario **temporal** real existente con el mismo RUT | Alta formal con advertencia previa visible | Advertencia antes del envío: la creación promueve y conserva historial; un único registro promovido con `is_temporary` limpio y sus resultados históricos conservados | Dirección inequívoca: la promoción nunca ocurre vía alta temporal (RUT existente allí → `400`); resto de fallos como AC-IDT-002 | `ui-alerts.html`, `ui-modal.html` |
| AC-IDT-004 | FL-IDT-004 · OP-USR-012 | Tirador real sin cuenta formal (desde captura o personas) | Crear temporal con RUT real y nombre/apellidos por separado | Rótulo visible «no inicia sesión»; el temporal queda seleccionable en la captura con su `id_usuario` real tras re-consulta | RUT existente (temporal o formal) → `400` del backend sin duplicar fila (F-05); `403` → F-02; red → F-06 | `ui-modal.html`, `forms-basic.html` |
| AC-IDT-005 | FL-IDT-005 · OP-USR-004, OP-USR-005 | Usuario real cargado | Editar campos escribibles (derivados y flags no se envían) | Ficha y listado con el usuario devuelto | `400` → F-01; `404` → F-04; cancelar → F-09 | `forms-validation.html` |
| AC-IDT-006 | FL-IDT-006 · OP-USR-006 | Usuario real cargado | Eliminar con confirmación ST-10 que identifica a la persona | El resultado real reflejado; no se asume borrado físico (permiso `disable_users`) ni se oculta el registro antes del éxito | `403` → F-02; `404` → F-04; red → sin borrado local | `ui-modal.html` |
| AC-IDT-007 | FL-IDT-007 · OP-USR-007, OP-USR-008 (+AZC-002/004, SCP-001) | Selectores reales de unidad, rol y scope | Establecer la asignación principal con `{unit_code, role_code, scope_code?}` | La respuesta efectiva manda sobre el formulario: `primary_assignment` actualizado y la principal previa desactivada en `assignments`; usuario, memberships y puestos implicados refrescados | `400` → F-01; `403` → F-02; `404` → F-04; cancelar → F-09 | `ui-modal.html` |
| AC-IDT-008 | FL-IDT-008 · OP-USR-009 | Asignación principal activa visible | Desactivar con ST-10 y aviso de tirador | `desactivadas` mostrado; si no queda otra asignación, el tirador implícito preservado/recreado es visible con su advertencia | `403` → F-02; `404` → F-04; red → sin cambio local | `ui-modal.html`, `ui-alerts.html` |
| AC-IDT-009 | FL-IDT-009 · OP-USR-010 | Mismos selectores reales que la principal | Agregar asignación secundaria | `201` y `200` idempotente tratados como éxito con `assignment_id` visible; `assignments` refrescado | `400` → F-01; `403` → F-02; red → F-06 | `ui-modal.html` |
| AC-IDT-010 | FL-IDT-010 · OP-USR-011 | Asignación secundaria identificada en la ficha | Quitar con ST-10 | Asignaciones actualizadas; advertencia de restauración del tirador cuando era la última | `404` (assignment ya inexistente) → error explícito sin borrado local; `403` → F-02 | `ui-modal.html` |
| AC-IDT-011 | FL-IDT-011 · OP-POS-001, OP-POS-003, OP-POS-009 | Contexto activo | Abrir `/organizacion/puestos`, un puesto y su histórico | Puesto ≠ assignment ≠ membership distinguidos; `current_holders_count` y estado visibles; histórico con activos **e históricos devueltos**, sin cronología inferida | `403` → F-02; `404` → F-04; vacío → ST-03 | `tables-basic.html`, `ui-tabs.html` |
| AC-IDT-012 | FL-IDT-012 · OP-POS-002, OP-POS-004, OP-POS-005 | Selectores por código reales (unidad, rol, scope, armería, recinto) | Crear/editar puesto; elegir recinto | Explicación visible de que el recinto sólo tiene efecto con scope `todo_recinto`; `null` limpia opcionales sólo por elección expresa del usuario | `400` (código no resuelto en tenant) → F-01 sobre el selector; `404` → F-04; cancelar → F-09 | `ui-modal.html`, `forms-basic.html` |
| AC-IDT-013 | FL-IDT-013 · OP-POS-006 | Puesto real con contador de holders visible | Eliminar con ST-10 | Listado refrescado sólo tras éxito; la confirmación no promete reasignación de holders (el contrato no la declara) | `403` → F-02; `404` → F-04; red → sin borrado local | `ui-modal.html` |
| AC-IDT-014 | FL-IDT-014 · OP-POS-007 | Personas candidatas reales del tenant | Asignar holder (`account_id`, `is_primary?`, `starts_at?`); en puesto único, observar la consecuencia presentada **antes** | `201` y `200` idempotente aceptados como éxito; `current_holders_count`, holders e histórico refrescados | `400` (fuera de rama u otra validación) → literal F-01; `403` → F-02; red → sin holder local | `ui-modal.html` |
| AC-IDT-015 | FL-IDT-015 · OP-POS-008 | Holder visible en el puesto | Quitar holder con ST-10 | Contador, holders e histórico refrescados tras éxito | `403` → F-02; `404` → F-04; red → F-06 | `ui-modal.html` |
| AC-IDT-016 | FL-IDT-016 · OP-MEM-002, OP-MEM-004, OP-MEM-005 | `account` y `unit` reales por FK directas | Crear/editar membership | La pertenencia se rotula como orgánica (separada de puesto/holder); al modificar la primaria, el contexto afectado se refresca **antes** de mostrar unidad efectiva; conflicto de primaria mostrado desde el backend sin resolución local | `400` → F-01; `403` → denegación visible, nunca dato vacío; `404` → F-04; cancelar → F-09 | `tables-basic.html`, `ui-modal.html` |
| AC-IDT-017 | FL-IDT-017 · OP-MEM-006 (+004/005 con `is_active=false`) | Membership real cargada | Desactivar o eliminar con ST-10 cuando afecta a la primaria | Contexto afectado refrescado; la confirmación distingue membership de asignación funcional y **no asume** que la modifica | `403` → F-02; `404` → F-04; red → sin cambio local | `ui-modal.html` |

### Autorización y auditoría — [volumen](experience/flows/authorization.md)

| AC | FL · OP | Precondición (datos reales) | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-AZ-001 | FL-AZ-001 · OP-ROL-001, OP-ROL-003 | Sesión IA+TA | Abrir `/personas/roles` y un rol | `code`, `name`, descripción, `is_active`, `is_system` con badges; enlace a su matriz de permisos | `403` → F-02; vacío → ST-03 (no significa que no existan roles fuera del alcance); red → F-06/F-10 | `tables-basic.html`, `ui-badge.html` |
| AC-AZ-002 | FL-AZ-002 · OP-ROL-002, OP-ROL-004, OP-ROL-005 | Contexto administrativo real (TAdmin) y otro sin él | Crear/editar rol desde ambos contextos | Mutaciones ofrecidas sólo al contexto administrativo; catálogo refrescado tras éxito; sin TAdmin, denegación visible | `400` → F-01; `403` → F-02 (denegación, no ocultación silenciosa); cancelar → F-09 | `ui-modal.html`, `forms-basic.html` |
| AC-AZ-003 | FL-AZ-003 · OP-ROL-006 | Rol real cargado | Eliminar con ST-10 que muestra `is_system` | Catálogo refrescado sólo tras éxito; `is_system` como advertencia informativa, sin inventar un bloqueo que el contrato no declara (la restricción `super_admin` documentada es para RolePermission) | `403` → F-02; `404` → F-04; red → sin borrado local | `ui-modal.html` |
| AC-AZ-004 | FL-AZ-004 · OP-SCP-001/002, OP-PRM-001/002 | Sesión IA+TA | Abrir scopes y el catálogo de permisos | Catálogos de sólo lectura **sin botones** de alta/edición/eliminación; sólo permisos activos; alimentan selectores de matrices y puestos | `403` → F-02; vacío → ST-03; cualquier escritura renderizada = defecto | `ui-list-group.html`, `tables-basic.html` |
| AC-AZ-005 | FL-AZ-005 · OP-RPR-001…006, OP-AZC-001 | Contexto TAdmin; rol de sistema y rol normal reales | Marcar/desmarcar celdas de la matriz rol→permiso y quitar una concesión | ST-05 por celda → ST-06 con la fila refrescada; celdas de rol de sistema deshabilitadas salvo contexto `super_admin` | Red → la celda revierte al valor **confirmado** por el backend, nunca a un optimista; `400` → F-01; `403` → F-02 literal | `tables-basic.html`, `ui-badge.html` |
| AC-AZ-006 | FL-AZ-006 · OP-PPR-001…006 | Contexto TAdmin; posiciones reales del tenant | Gestionar la matriz puesto→permiso | Matriz refrescada tras éxito con los campos RO resueltos | Puesto fuera de tenant → `400` **sin insertar fila local** (F-01); `403` → F-02; red → F-06 | `tables-basic.html` |
| AC-AZ-007 | FL-AZ-007 · OP-OVR-002, OP-OVR-004, OP-OVR-005 | Cuenta real del tenant | Crear/editar override (`account`, `allowed` + opcionales) | `created_by` fijado por servidor mostrado como metadato RO; el override rotulado como excepción individual (precedencia DENY antes que ALLOW), no como permiso de rol | `400` (cuenta fuera de tenant) → F-01; `403` → F-02; red → F-06 | `ui-modal.html`, `ui-badge.html` |
| AC-AZ-008 | FL-AZ-008 · OP-OVR-006 | Override real visible | Eliminar con ST-10 que identifica cuenta y permiso/recurso | Listado refrescado sólo tras éxito | `403` → F-02; `404` → F-04; red → sin borrado local | `ui-modal.html` |
| AC-AZ-009 | FL-AZ-009 · OP-OVR-001, OP-OVR-003 | Contexto TAdmin | Abrir `/personas/overrides` y un override | Filas con efecto ALLOW/DENY en badge semántico; búsqueda client-side | `403` → F-02; `404` → F-04; vacío → ST-03 | `tables-basic.html` |
| AC-AZ-010 | FL-AZ-010 · OP-AZC-001 | Matriz de permisos abierta | Observar el fill de ejes y tooltips | Ejes y tooltips poblados desde el catálogo real (`label`/`description`); el catálogo **no** sustituye a `context.permissions` ni acredita endpoint por acción catalogada (`export`/`read_own` sin endpoint) | `403` → F-02; red → la matriz no se rellena con catálogos de memoria ni hardcodeados | `ui-tooltips.html` |
| AC-AZ-011 | FL-AZ-011 · OP-AZC-002 | Modal de asignación abierto | Observar la agrupación de roles | Checkboxes agrupados en las categorías operativas tal como responde el backend | `403` → F-02; vacío → ST-03: no significa roles fuera de alcance; red → F-06 | `ui-modal.html` |
| AC-AZ-012 | FL-AZ-012 · OP-AZC-003 | Unidad real del tenant | Consultar personas por unidad con y sin `include_descendants` | Personas con su rol funcional, **excluyendo el tirador implícito**; `user`, unidad personal y assignments retornados | `400` (falta `unit_code`) → F-01; `404` → F-04; `403` → F-02: los tres códigos distinguidos | `tables-basic.html` |
| AC-AZ-013 | FL-AZ-013 · OP-AZC-004 | `user_id` real del flujo consumidor | Abrir el selector de unidades elegibles por persona | Unidad personal + hasta 2 ancestros filtrados por la rama del solicitante; `reason: sin_account|sin_unidad_personal` presentado como **restricción operativa**, no como lista vacía | `400` (falta `user_id`) → F-01; `404` → F-04; `403` → F-02; red → selector no poblado de memoria | `forms-basic.html` |
| AC-AUD-001 | FL-AUD-001 · OP-AUT-004 | Cuenta real con rol `tenant_admin`, `super_admin` o `auditor`; y otra sin él | Abrir `/auditoria` y ajustar `limit` (≤500) | `count` visible y los siete campos por registro; `allowed` como badge semántico; `reason` literal del backend; entrada de menú sólo para los tres roles | Rol no declarado → `403` como denegación visible (F-02); vacío → ST-03 **sin fabricar eventos**; `user_id_value` en pantalla pero nunca en logs ni artefactos | `tables-basic.html`, `ui-badge.html` |

### Armería, armas y calibres — [volumen](experience/flows/armory-weapons.md)

| AC | FL · OP | Precondición (datos reales) | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-ARM-001 | FL-ARM-001 · OP-ARM-001, OP-ARM-003 | Contexto activo | Abrir `/almacen/armerias` y sus relaciones | Campos del contrato con `armas_count` visible y `—` en descripción ausente; detalle/relaciones en modal sobre el listado (integración justificada) | `403` → F-02; `404` → F-04; vacío → ST-03; red → F-06/F-10 | `tables-basic.html` |
| AC-ARM-002 | FL-ARM-002 · OP-ARM-002, OP-ARM-004, OP-ARM-005 | — | Crear armería sin elegir unidad; editar | Alta sin código de unidad: la unidad **inyectada por el backend** visible después del éxito; en update, `organization_unit_code_write` vacío/`null` → `400` asociado al campo con formulario conservado | `400` → F-01 (ST-09 conservado); `403` → F-02; red → sin optimismo; cancelar → F-09 | `ui-modal.html`, `forms-validation.html` |
| AC-ARM-003 | FL-ARM-003 · OP-ARM-006 | Armería real con `armas_count` visible | Eliminar con ST-10 | Listado, detalle y armas relacionadas refrescados **después del éxito**; la confirmación no promete reasignación de armas | `403` → F-02; `404` → F-04; red → sin borrado local | `ui-modal.html` |
| AC-WPN-001 | FL-WPN-001 · OP-WPN-001, OP-WPN-003 | Contexto activo | Abrir `/almacen/armas` y un arma | Identificadores, tipo, modelo, serie, armería, unidad derivada y calibre; `—` en calibre o relaciones ausentes; relaciones RO como contexto en la ficha | `403` → F-02; `404` → F-04; vacío → ST-03 | `tables-basic.html`, `ui-card.html` |
| AC-WPN-002 | FL-WPN-002 · OP-WPN-002 (+ARM-001, CAL-001) | Selectores reales de armerías y calibres activos | Crear arma con los 6 tipos reales y códigos disponibles | La unidad derivada del almacén visible (no enviada por la UI); nada pintado antes del `201` | Unicidad `modelo_arma`+`numero_serie` → F-05 sin deduplicar ni ocultar el arma existente; `400` → F-01; `403` → F-02 | `ui-modal.html`, `forms-basic.html` |
| AC-WPN-003 | FL-WPN-003 · OP-WPN-004, OP-WPN-005 | Arma real cargada | Editar enviando relaciones por `*_code_write`, nunca sustituyendo armería por `organization_unit` | Ficha y listado refrescados con el arma devuelta | `armory_code_write` vacío/`null` → `400` con el literal «El arma debe pertenecer a una armoria.» anclado al selector y formulario conservado; unicidad → F-05; `404` → F-04 | `forms-validation.html` |
| AC-WPN-004 | FL-WPN-004 · OP-WPN-006 | Arma real cargada | Eliminar con ST-10 que identifica modelo y serie | Armería y resultados que la referencien refrescados **sólo si esos recursos se vuelven a cargar**; ninguna transferencia o sustitución de stock simulada (capacidad sin endpoint, D-02) | `403` → F-02; `404` → F-04; red → sin borrado local | `ui-modal.html` |
| AC-CAL-001 | FL-CAL-001 · OP-CAL-001, OP-CAL-003 | Cualquier contexto autenticado | Abrir `/almacen/calibres` y los selectores de armas/consumos | Catálogo **global** (`code`, `nombre`, `is_active`) alimentando selectores con códigos reales; sin `super_admin`, lectura sin capacidad de mutación falsificada (botones ausentes, no deshabilitados con tooltip inventado) | `403` → F-02; vacío → ST-03: selectores dependientes en estado vacío sin opciones inventadas | `tables-basic.html` |
| AC-CAL-002 | FL-CAL-002 · OP-CAL-002, OP-CAL-004, OP-CAL-005, OP-CAL-006 | Contexto `super_admin` real (MASTER) | Crear/editar/eliminar calibre | Catálogo y selectores dependientes refrescados **antes del próximo envío**; referencia existente que deja de ser seleccionable mostrada como lectura, sin cambiar la relación por iniciativa del cliente | Sin `super_admin` → F-02; `400` → F-01; `404` → F-04; cancelar → F-09 | `ui-modal.html` |

### Tiro: polígonos y lecciones — [volumen](experience/flows/shooting-lessons.md)

| AC | FL · OP | Precondición (datos reales) | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-SHT-001 | FL-SHT-001 · OP-RNG-001, OP-RNG-003 | Contexto activo | Abrir `/tiro/poligonos` y un polígono | Campos del contrato; identificador conservado para navegar a sus lecciones | `403` → F-02; `404` → F-04; vacío → ST-03 | `tables-basic.html`, `ui-card.html` |
| AC-SHT-002 | FL-SHT-002 · OP-RNG-002, OP-RNG-004, OP-RNG-005 | — | Crear/editar polígono (tenant/unidad nunca se envían) | Listado/ficha refrescados; errores del backend asociados al formulario | `400` → F-01; `403` → F-02; `404` → F-04; cancelar → F-09 | `ui-modal.html`, `forms-validation.html` |
| AC-SHT-003 | FL-SHT-003 · OP-RNG-006 | Polígono real cargado | Buscar la acción destructiva | **No se muestra como disponible por defecto** (sin mapa `range:delete`); si una solicitud llegara a emitirse y denegarse, denegación literal visible **sin ocultar el registro** | `403` esperado → F-02 con el registro visible; red → F-06 | `ui-alerts.html` |
| AC-SHT-004 | FL-SHT-004 · OP-RNG-007 | Ficha de polígono abierta | Abrir «lecciones del polígono» | Exclusivamente el arreglo devuelto (mismo tenant), seleccionable hacia la ficha de lección | `403` → F-02; `404` → F-04; vacío → ST-03 | `ui-list-group.html` |
| AC-SHT-005 | FL-SHT-005 · OP-LES-002 | Polígono real y unidades participantes desde selector real | Crear lección con y sin participantes | Alta sin participantes: la unidad **efectiva devuelta** visible tras crear; no se afirma que no existen participantes | `400` (incluido polígono fuera de tenant) → F-01; `403` → F-02; red → F-06; cancelar → F-09 | `ui-modal.html`, `forms-flatpicker.html` |
| AC-SHT-006 | FL-SHT-006 · OP-LES-004, OP-LES-005 | Lección real cargada | Editar y enviar | Ficha y pestañas refrescadas al recargarlas | `400` → F-01; `404` → F-04; cancelar → F-09 | `forms-validation.html` |
| AC-SHT-007 | FL-SHT-007 · OP-LES-006 | Lección real cargada | Eliminar con ST-10 que identifica lección y fecha | Polígonos, fracciones y reportes relacionados refrescados **sólo tras éxito**; error contractual visible si las relaciones impiden la operación | `400` por relaciones → literal F-01; `403` → F-02; red → sin borrado local | `ui-modal.html` |
| AC-SHT-008 | FL-SHT-008 · OP-LES-007, OP-LES-008 | Ficha de lección abierta; cuenta de tirador puro real para observar la rotulación | Abrir las pestañas fracciones y tiradores | Carga independiente por pestaña; fracciones **sin mezclar resultados**; tiradores con resultado; vacío ≠ error por pestaña; alcance restringido rotulado como tal, no como lista completa | El fallo de una pestaña no invalida las demás (F-06/F-10 por pestaña); `403` → F-02; vacío → ST-03 | `ui-tabs.html`, `tables-basic.html` |
| AC-SHT-009 | FL-SHT-009 · OP-LES-009 | Cuentas reales con y sin `can_read_detail`; lección con resultados reales | Abrir la pestaña resultados | Con permiso: filas con identidad, unidad, arma, carril y tiros. Sin permiso: `403 {detail}` → «sin permiso de detalle» (ST-07) ofreciendo los agregados disponibles, **sin sustituir detalle por resumen**; vacío con permiso → ST-03 («sin resultados»), distinto de ST-07 | Si la hipótesis estática B-01 se materializa: fallo tratado como ST-04 explícito, **no** sustituido por resumen/reporte; red/`5xx` → F-06 | `tables-basic.html`, `ui-alerts.html` |
| AC-SHT-010 | FL-SHT-010 · OP-LES-010 | Lección real con resultados | Abrir la pestaña resumen | Las cuatro cifras (`fracciones`, `tiradores_unicos`, acertados, total) rotuladas con lección y fecha, **nunca como total institucional**; porcentaje de acierto con un decimal sólo si `total > 0`; con `total = 0` → `—`, nunca `0` | `403` → F-02; `404` → F-04; red → F-06/F-10 | `ui-card.html`, `charts.html` |
| AC-SHT-011 | FL-SHT-011 · OP-LES-011 | Lecciones reales con `aggregate_only` en ambos valores | Abrir la pestaña reporte | `aggregate_only: true` → se muestran `resumen`, `por_fraccion` y `por_unidad` y **no se solicitan ni representan** `por_tirador`, `por_arma`, `por_arma_unidad`; `false` → exclusivamente los desgloses recibidos | `403` → F-02; `404` → F-04; red → F-06/F-10 | `charts.html`, `ui-tabs.html` |
| AC-SHT-012 | FL-SHT-012 · OP-LES-012 | Flujo permitido de participantes abierto | Abrir el selector de tiradores elegibles | Únicamente usuarios retornados (unidades participantes y descendientes); el selector **no se convierte en alta de usuario** (temporal vía AC-IDT-004) | `403` → F-02; `404` → F-04; `results` vacío → ST-03 sin opciones inventadas | `forms-basic.html` |

### Tiro: fracciones y captura — [volumen](experience/flows/shooting-capture.md)

| AC | FL · OP | Precondición (datos reales) | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-SHT-013 | FL-SHT-013 · OP-FRC-002, OP-FRC-004, OP-FRC-005 | Lección real cargada del mismo tenant/unidad | Crear/editar fracción desde la pestaña (`id_leccion` FK directa, `tiradores_totales`, `numero_fraccion`) | Pestaña de fracciones refrescada tras éxito | Duplicidad lección+número → F-05 anclado en `numero_fraccion`; `400` resto → F-01; `404` → F-04; cancelar → F-09 | `ui-modal.html`, `forms-validation.html` |
| AC-SHT-014 | FL-SHT-014 · OP-FRC-006 | Fracción real visible | Eliminar con ST-10 que identifica lección y `numero_fraccion` | Lección refrescada; **no se eliminan resultados locales antes de la respuesta exitosa** | `403` → F-02; `404` → F-04; red → sin borrado local | `ui-modal.html` |
| AC-SHT-015 | FL-SHT-015 · OP-FRC-007 | Fracción real seleccionada o entrada directa por deep link (contexto resuelto por OP-FRC-003 antes de pintar selectores) | Abrir la captura de resultados | Selectores de tirador y arma alimentados **sólo** por los arrays `usuarios`/`armas` retornados; array vacío → ST-03 en ese selector sin opciones inventadas; el enlace a alta temporal re-consulta tras éxito | `403` → F-02; `404` → F-04; red → F-06/F-10 sin selectores de memoria | `forms-basic.html`, `ui-placeholders.html` |
| AC-SHT-016 | FL-SHT-016 · OP-RES-002 | Selectores poblados por OP-FRC-007 | Capturar resultado por carril (FKs directas: `id_fraccion`, `id_usuario`, `id_arma`, tiros; `numero_carril` opcional) | La fila capturada queda visible sólo desde la respuesta o la re-consulta; ninguna fila pintada antes del `201` | Las tres unicidades (fracción+usuario, fracción+arma, carril no nulo duplicado) → F-05 asociado al selector o carril, **sin ofrecer el resultado como capturado**; `400` resto → F-01; red → sin optimismo; cambio de unidad en vuelo → F-08 | `forms-validation.html`, `tables-basic.html` |
| AC-SHT-017 | FL-SHT-017 · OP-RES-004, OP-RES-005 | Resultado real existente | Editar y enviar | Fila refrescada desde la respuesta | Unicidades → F-05; `400` → F-01; `404` → F-04; red → F-06 | `forms-validation.html` |
| AC-SHT-018 | FL-SHT-018 · OP-RES-006 | Resultado real existente | Eliminar con ST-10 que identifica tirador, arma y carril | Fracción, resumen y reporte refrescados **al volver a consultarlos**; ningún recálculo local de métricas como sustituto de la respuesta | `403` → F-02; `404` → F-04; red → sin borrado local | `ui-modal.html` |
| AC-SHT-019 | FL-SHT-019 · OP-FRC-008 | Cuentas reales con y sin permiso de detalle; fracción con resultados | Abrir el detalle de resultados de la fracción | Pares resultado/usuario/arma visibles con permiso; sin él, `403` mantiene **captura y detalle separados** indicando falta de autorización para ver detalle (ST-07, no ST-03) | `404` → F-04; red → F-06/F-10; vacío con permiso → ST-03 | `tables-basic.html`, `ui-alerts.html` |

### Ejercicios y consumos — [volumen](experience/flows/exercises.md)

| AC | FL · OP | Precondición (datos reales) | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-EXC-001 | FL-EXC-001 · OP-EJR-001, OP-EJR-003 | Contexto activo | Abrir `/tiro/ejercicios` y un ejercicio | Campos del contrato con `—` en ausentes; enlaces a consumos al recargarlos; búsqueda/orden client-side | `403` → F-02; `404` → F-04; vacío → ST-03 | `tables-basic.html`, `ui-card.html` |
| AC-EXC-002 | FL-EXC-002 · OP-EJR-002, OP-EJR-004, OP-EJR-005 | Unidades participantes desde selector real | Crear/editar ejercicio con los 5 tipos reales, con y sin participantes | Alta sin participantes: unidad efectiva retornada visible, **sin participantes sintéticos**; cancelar descarta cambios no enviados | `400` → F-01; errores de unidades/tenant junto al selector o como denegación según la forma de la respuesta; `404` → F-04 | `ui-modal.html`, `forms-flatpicker.html` |
| AC-EXC-003 | FL-EXC-003 · OP-EJR-006 | Ejercicio real cargado | Eliminar con ST-10 que identifica nombre y fecha | Consumos relacionados refrescados **sólo tras éxito**; sin promesa de eliminación en cascada si la respuesta no la declara | `403` → F-02; `404` → F-04; red → sin borrado local | `ui-modal.html` |
| AC-CMN-001 | FL-CMN-001 · OP-CMN-001, OP-CMN-003 | Contexto activo | Abrir `/tiro/consumos-municion` y un consumo | Campos del contrato; **no muestra ni envía unidad propia** (recurso sólo tenant); enlace a su ejercicio y a sus consumos de arma | `403` → F-02; `404` → F-04; vacío → ST-03 | `tables-basic.html` |
| AC-CMN-002 | FL-CMN-002 · OP-CMN-002, OP-CMN-004, OP-CMN-005 | Ejercicio real; calibres activos del catálogo real | Crear/editar consumo con los 6 tipos reales | El calibre RO devuelto visible; el calibre **no se deduce** de tipo o modelo: si no se elige, queda ausente/`—` | `400` (calibre inactivo/no resuelto) → F-01 sobre el selector; `403` → F-02; cancelar → F-09 | `ui-modal.html`, `forms-basic.html` |
| AC-CMN-003 | FL-CMN-003 · OP-CMN-006 | Consumo real cargado | Eliminar con ST-10 que identifica ejercicio y cantidades | Ejercicio y consumos asociados refrescados **sólo después del éxito**; `400`/`403`/relaciones inexistentes no se convierten en ceros ni en éxito visual | F-01/F-02/F-04 según respuesta; red → sin borrado local | `ui-modal.html` |
| AC-CAR-001 | FL-CAR-001 · OP-CAR-002, OP-CAR-004, OP-CAR-005 | Selectores reales de consumos accesibles y armas accesibles (nunca registros de muestra) | Crear/editar consumo de arma (FKs directas `consumo`, `arma`, `cantidad_tiros`) | Relación del consumo padre refrescada al recargarla | Duplicidad consumo+arma → F-05 en la relación de arma conservando el formulario; `400` resto → F-01; `404` → F-04 | `ui-modal.html`, `forms-basic.html` |
| AC-CAR-002 | FL-CAR-002 · OP-CAR-006 | Consumo de arma real | Eliminar con ST-10 que identifica consumo y arma | Relación del consumo padre actualizada **únicamente tras éxito**; sin recalcular ni suponer stock restante (no es dato contractual) | `403` → F-02; `404` → F-04; red → sin borrado local | `ui-modal.html` |

### Apariencia — [volumen](experience/flows/appearance.md)

> 🕯️ AC-APP-001…004 operan contra la ruta de ocho ejes, **hoy existente y consumida** (ocho
> campos `ds_*`, migración `0021_design_system_preferences` y rutas `apipoligono/urls.py:85-86`;
> verificado 2026-10-15): la reserva «no son ejecutables hasta que la Fase 3 exista tras spec
> aprobada + gate» quedó **superada** al ejecutarse la excepción acotada. AC-APP-008 opera
> contra la ruta legacy **existente**. AC-APP-005…007 son conducta de cliente sin
> dependencia de la ruta para su parte observable pública/reactiva, pero su
> restauración por usuario sí la requiere.

| AC | FL · OP | Precondición (datos reales) | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-APP-001 | FL-APP-001 · ruta de 8 ejes (GET) — **existe**, verificado 2026-10-15 | Sesión autenticada real con preferencias guardadas en esa cuenta | Login nuevo y recarga profunda | Los ocho ejes **de esa cuenta** resueltos antes de `ready`; atributos `data-*` en `<html>` antes del primer pintado autenticado; sin parpadeo desde defaults ni apariencia ajena; tras recargar, los ocho vuelven con los valores guardados | Error de lectura → estado local intacto y ST-04, **nunca** «guardar los defaults»; `403` → no cierra sesión (AC-APP-004); ruta hoy existente, verificada 2026-10-15 | panel de `index.html`:478–530 |
| AC-APP-002 | FL-APP-002 · ruta propuesta (PUT) | Apariencia restaurada; panel con los ocho ejes del catálogo completo (27 acentos, 26 fondos, 9 tipografías, 3 radios, 7 familias de iconos, 8 ambientes, 7 colores de ambiente) | Cambiar cada eje por clic y por teclado (flechas, `Home`, `End`, tabindex rotatorio); cambiar varios ejes rápido | Preview inmediata sin esperar al backend con la semántica exacta de la fuente (`bg=neutral`, `font=play`, `radius=soft`, `iconfam=default`, `ambcolor=accent` **eliminan** el atributo; `data-accent`/`data-ambient` siempre escritos; sin alterar los 10 tokens de radio); `saveState` visible; una sola escritura en vuelo por principal con la última instantánea pendiente; `saved` sólo por instantánea vigente; 44 conceptos de icono remapeados sin iconos rotos; tipografía bajo demanda sin duplicar `<link>`; atribución de `fa7-solid` literal; anuncio de cambio de tema | `400` → error por campo anclado al eje; `403` → sin cierre automático de sesión; red → `saveState=error` con el eje aplicado en memoria y reintento explícito; respuesta tardía → descartada (ST-08), no marca `saved` | `theme-customizer.css`, panel del DS |
| AC-APP-003 | FL-APP-003 · ruta propuesta (DELETE) | Apariencia guardada distinta de defaults | Pulsar «Reset to defaults» (una vez y dos veces seguidas) | Los ocho ejes vuelven a los defaults canónicos (`dark, mint, command, ibm-plex, square, phosphor, embers, accent`) y se re-aplican con su semántica de presencia/ausencia; idempotente; una recarga posterior devuelve los mismos defaults persistidos; no borra usuario ni sesión | `403`/red → sin reset local persistido de facto; el estado vuelve al último valor confirmado; `PUT`/`DELETE` en cola → orden garantizado | panel del DS (ref. `theme-customizer.js`:347) |
| AC-APP-004 | FL-APP-004 · ruta propuesta | — | Provocar `400`, `403` y fallo de red en lectura y escritura (escenarios propuestos, no ejecutados hoy) | `400`: errores por campo tal como los devuelve el backend (`{ "ds_accent": ["…"] }`, `non_field_errors`) anclados al eje, valores en memoria no revertidos por iniciativa propia; `403`: diferenciación por contexto de «sesión/CSRF inválido» vs «sin permiso», **sin cerrar sesión automáticamente** (consulta OP-AUT-002 antes de decidir); red en GET: estado intacto y ST-04, nunca «guardar los defaults» | Valor fuera de catálogo rechazado con error en el eje correspondiente sin dejar el panel inconsistente | `ui-alerts.html`, `forms-validation.html` |
| AC-APP-005 | FL-APP-005 · reacción (ninguna OP) | Dos cuentas reales distintas con apariencias guardadas distintas | Cerrar sesión o dar sesión al otro principal con escrituras de apariencia en cola | Escrituras abortadas, respuestas tardías descartadas, cola vaciada y defaults restablecidos; el nuevo principal restaura **sus propias** preferencias antes de `ready`; ninguna preferencia cruza entre usuarios | — | — |
| AC-APP-006 | FL-APP-006 · reacción (ninguna OP) | Usuario real con apariencia guardada y ≥2 unidades activas | Cambiar de unidad activa | Los ocho atributos de `<html>` **no cambian**; la cola de autosave no se vacía ni se re-aplican defaults; el resto de los datos sí se recarga (F-08) | — | — |
| AC-APP-007 | FL-APP-007 · ninguna OP | Sin sesión | Visitar login, recuperación y 404; ajustar apariencia antes de tener sesión | Las superficies públicas se pintan con los defaults canónicos; **ninguna petición de preferencias sale** sin sesión y nada se persiste para un usuario desconocido (sin `localStorage`, sin hash, sin clave manual) | — | `auth-signin.html` |
| AC-APP-008 | FL-APP-008 · OP-PRF-001, OP-PRF-002 (**legacy existente**) | Cuenta real con valores legacy guardados (`theme`, `palette`, `density`) | Observar el producto y, si un flujo la consulta, la ruta legacy | `palette` y `density` **no aparecen como control de apariencia en ninguna pantalla**; la ruta legacy no gobierna la apariencia visible; si se escribe, los `400` literales (`Theme inválido`, `Palette inválida`, `Density inválido`) se propagan tal cual | Mezclar, traducir o migrar entre la ruta legacy y la propuesta = defecto; `403` → conducta de AC-APP-004 fila 2 | — |

## 6. AC transversales y de integración (32)

### Integraciones justificadas (lecturas y CRUD sin FL propio)

| AC | Alcance · OP | Precondición | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-INT-01 | Lecturas de pantalla sin FL propio · OP-LES-001/003, OP-FRC-001/003, OP-RES-001/003, OP-MEM-001/003, OP-CAR-001/003 | Contexto activo; datos reales existentes | Abrir los listados y las fichas/prefills que estas lecturas sostienen (incluido deep link a captura) | Sólo datos devueltos por el backend real, con ST-01/02/03/04/07 y `—` en ausentes; el deep link `/tiro/fracciones/:id/resultados` resuelve el contexto de la fracción **antes** de pintar selectores | `404` → F-04; `403` → F-02; vacío → ST-03 ≠ error ≠ denegación | `tables-basic.html` / `ui-card.html` de cada familia |
| AC-INT-02 | CRUD sin FL canónico · OP-UNT-006 | Unidad real cargada | Si el DELETE simple se expone, confirmarlo con ST-10 | Refresco sólo tras éxito; el flujo de eliminación con migración (AC-ORG-004/005) permanece como vía canónica visible | `403` → F-02; red → sin borrado local | `ui-modal.html` |
| AC-INT-03 | Infraestructura · OP-AUT-006 | Sesión viva y ausente | Observar el uso de la sonda `GET /api/protected/` | Alimenta sólo guards/bootstrap; **no pinta pantalla ni estado de negocio** (perfil P-INFRA) | — | — |

### Transporte y semántica HTTP

| AC | Alcance · OP | Precondición | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-TRA-01 | Transporte · las 162 OP | Sesión real autorizada por el operador | Inspeccionar el panel de red con autorización explícita | `credentials: 'include'` en toda petición; `X-CSRFToken` sólo en métodos no seguros; `X-Tenant-Code` presente salvo las exclusiones declaradas (login, logout, protected, dos rutas de preferencias, cuatro de recuperación); sin inventario supuesto de `X-Org-Unit-Code` (G-SES-2 abierto: el mecanismo primario de unidad es OP-AUT-003) | Petición autenticada sin el header de tenant → `403` de `HasTenantAccess` visible | — |
| AC-TRA-02 | `429` · login, select-unit, recuperación | Throttling declarado activo (`auth: 20/min`, `unit_selection: 30/min`, `AuthEndpointThrottle`) | Exceder la tasa declarada | Mensaje de espera con `Retry-After` si viene; botón de envío deshabilitado durante el vuelo; **sin reintento automático** | — | `ui-alerts.html` |
| AC-TRA-03 | `403`/`404` · todas las OP | — | Observar un `403` de negocio, un `403` de tenant/sesión y un `404` | Negocio: `detail` literal conservando la sesión (ST-07); tenant/sesión: purga y login sin reintentar (F-12); `404`: error explícito con el mensaje del backend si existe, sin pintar el registro ausente | La API **no emite `401`**: una comprobación que espere `401` daría falso negativo | `ui-alerts.html` |

### Reglas de presentación

| AC | Alcance · OP | Precondición | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-RES-01 | Presentación · todas las lecturas | Recursos reales con campos ausentes y conjuntos vacíos | Observar fichas y listados | `—` por campo ausente; ST-03 (vacío) distinto de ST-04 (error) y ST-07 (denegación); ningún `0` inventado ni registro sintético para «parecer» funcionar | — | `ui-placeholders.html` |
| AC-RES-02 | Búsqueda/orden · todos los listados | G-SES-3 abierto (filtros/paginación globales no comprobados) | Buscar, ordenar y seleccionar en cualquier listado | Todo ocurre **en cliente** sobre el array plano realmente retornado; sin paginación inventada ni query params de filtro supuestos del backend | — | `tables-basic.html` |
| AC-RES-03 | Destructivas · todos los DELETE y acciones ST-10 (OP-USR-009/011/014/016, OP-UNT-008, OP-RCT-008, OP-POS-008) | Recursos reales | Intentar toda acción destructiva y de credenciales/acceso | ST-10 obligatoria antes; tras confirmar, el mensaje **exacto** del backend; nada se ejecuta sin confirmación | Fallo tras confirmar → ST-10 permanece abierta con el motivo donde la familia lo declara | `ui-modal.html` |
| AC-RES-04 | Menú y capacidades ausentes · shell | `permissions` reales del contexto; D-02 abierta | Observar el menú por módulos | Grupos organización/personas/autorización/almacén/tiro/ejercicios/auditoria; entradas condicionadas por permiso + dato de contexto; **no existen** «Exportar», «Transferir stock», «Validar resultados» ni «Registro» (signup); el hueco se reporta, no se simula | Entrada oculta no exime: URL directa la resuelven guard y backend con denegación visible | `index.html` (sidebar) |

### Datos y privacidad

| AC | Alcance · OP | Precondición | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-DAT-01 | Almacenamiento · transversal | App operada con sesión y apariencia | Inspeccionar el almacenamiento del navegador | No hay `localStorage`, `sessionStorage` ni cookies de estado escritas por la app; todo el estado vive sólo en memoria (Pinia); sin caché persistente de datos | — | — |
| AC-DAT-02 | PII · transversal | Mensajes del backend con RUT u otra PII | Revisar pantallas, errores y registros del cliente | La PII se muestra en pantalla donde el contrato la devuelve, pero **no** se registra en logs del cliente, artefactos ni mensajes de error persistidos | — | — |
| AC-DAT-03 | Métricas · dashboard y reportes | Datos reales del backend | Observar toda cifra visible | Ninguna cifra proviene de un origen distinto al backend; sólo derivaciones matemáticas declaradas (porcentaje de acierto); `aggregate_only` respetado | — | `charts.html` |
| AC-DAT-04 | Rotulación · resúmenes de lección | Lección real con resultados | Observar las métricas del resumen | Toda métrica visible rotulada con su lección y fecha, nunca como total institucional | — | `ui-card.html` |
| AC-DAT-05 | Choices · todos los formularios | Backend real | Comparar selectores con los choices del backend | Los choices mostrados coinciden con los del backend y ninguno es inventado; códigos y literales de contrato se muestran como valores reales | — | `forms-basic.html` |

### Design System

| AC | Alcance · OP | Precondición | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-DS-01 | Comparación 1:1 · las 36 SCREEN | Biblioteca externa disponible en el directorio hermano; **autorización explícita del operador requerida** | Comparar cada pantalla contra su página exacta del DS | Sin diferencias de padding, borde, color, radio, sombra, estado `hover` ni anatomía; toda adaptación que la plataforma no pueda expresar queda documentada y justificada (hoy: ninguna declarada) | Pendiente de autorización: no es bloqueo permanente | página exacta por ficha ([reference-pages.md](design-system/reference-pages.md)) |
| AC-DS-02 | Shell · superficies con shell | — | Observar el shell autenticado y los shells de auth/error | Sidebar fija 250px (colapsada 75px), topbar 70px, `main.page-content` con los paddings declarados; auth y error con su shell propio; `aria-current` en la entrada activa; backdrop móvil | — | `index.html`, `styles.css`:40–57,127–135; `auth-signin.html`; `pages-404.html` |
| AC-DS-03 | Estados · transversal | Superficies operadas | Provocar los once estados ST-00…ST-10 | Cada estado renderiza con la referencia visual de su familia (spinners, placeholders, alerts, modal, toasts, badge, progress); ST-08 no es pintado nunca | — | `ui-spinners.html`, `ui-placeholders.html`, `ui-alerts.html`, `ui-modal.html`, `ui-toasts.html` |

### Navegación

| AC | Alcance · OP | Precondición | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-NAV-01 | Deep links · rutas de detalle | Sesión autenticada | Entrar directo por URL a cualquier ficha (`/personas/:id`, `/tiro/lecciones/:id`, etc.) | Abre esa pantalla, no la raíz; breadcrumbs y retorno al listado padre operativos | Recurso inexistente/denegado → la pantalla pinta su estado error/denied con el mensaje del backend; breadcrumb y retorno siguen operativos | `ui-breadcrumb.html` |
| AC-NAV-02 | Back/forward · `createWebHistory` | Historial navegado real | Usar atrás/adelante del navegador y recargar | Vuelve a la pantalla visitada con su contexto; posición de scroll preservada (`savedPosition`); al reentrar se re-consulta sin caché persistente; la selección/scroll del listado se conserva como estado de presentación en memoria | — | — |
| AC-NAV-03 | `query.redirect` · guards | URL protegida sin sesión | Autenticar desde esa URL | El usuario aterriza en la pantalla que intentaba abrir, no en el dashboard | — | — |
| AC-NAV-04 | `must_change_password` · guards | Cuenta real con bandera verdadera | Intentar cualquier navegación | Todo intento lleva al cambio forzado hasta que el contexto refrescado muestre la bandera en falso | — | — |
| AC-NAV-05 | Recarga profunda y contexto perdido · guards | G-SES-1 **abierto** (conducta propuesta, no resuelta por redacción) | Recargar una ruta de detalle con sesión viva y sin tenant en memoria; y navegar a ruta `requiresTenant` sin tenant | No hay expulsión al login contra contexto vacío: re-captura de institución en `/contexto`; sin tenant → SCREEN-CONTEXT-LOST **sin bucle de reintento** ni botón de reintento automático | — | `pages-404-alt.html` |
| AC-NAV-06 | 404 · catch-all | — | Visitar una URL sin ruta declarada | SCREEN-NOT-FOUND del DS, nunca vista en blanco; CTA según haya sesión o no | — | `pages-404.html` |
| AC-NAV-07 | Menú y permisos · shell | Usuario real sin permiso para un recurso | Observar el menú e intentar la URL directa | La entrada no autorizada no aparece; entrar por URL directa **no concede acceso**: guard/backend resuelven con denegación visible (`detail` literal), no pantalla en blanco | — | — |

### Backend de preferencias (Fase 3 — futura; pendientes de autorización)

> 🕯️ AC-BCK-01…07 requieren **aplicar la migración**, lo que exige orden explícita del
> operador. Hasta entonces son `NOT_VERIFIED` por falta de autorización, no por fallo de
> diseño.

| AC | Alcance · OP | Precondición | Acción | Resultado observable | Fallos | DS fuente |
|---|---|---|---|---|---|---|
| AC-BCK-01 | Persistencia por cuenta · ruta propuesta | Migración aplicada con orden explícita; cuenta real | Cambiar un eje; leer desde otra sesión de la misma cuenta | El valor queda persistido en la cuenta y se lee igual desde otra sesión de esa misma cuenta | — | — |
| AC-BCK-02 | `PUT` atómico · ruta propuesta | — | `PUT` con un valor fuera del enum de un eje | Se rechaza con el error en ese campo y **no escribe ninguno de los otros siete** | — | — |
| AC-BCK-03 | Conjunto exacto · ruta propuesta | — | `PUT` con campos de menos o de más | Se rechaza sin escribir nada (`non_field_errors`) | — | — |
| AC-BCK-04 | `DELETE` idempotente · ruta propuesta | — | Ejecutar el reset dos veces seguidas | Devuelve los ocho ejes a sus defaults; `204` sin cuerpo; mismo resultado ambas veces | — | — |
| AC-BCK-05 | Sin tenant · ruta propuesta | Cuenta con más de un tenant | Consultar la ruta en cualquier tenant del usuario | La ruta no exige `X-Tenant-Code` y responde igual en cualquier tenant del usuario | — | — |
| AC-BCK-06 | Ruta legacy intacta · OP-PRF-001/002 | Valores legacy guardados antes del cambio | Comparar respuestas antes/después del cambio de Fase 3 | `GET|PUT /api/me/preferences/appearance/` sigue respondiendo igual que antes | — | — |
| AC-BCK-07 | Campos legacy intactos · `theme`/`palette`/`density` | Cuentas existentes reales | Inspeccionar los valores guardados tras la migración | No cambian por la migración ni por el uso del cliente | — | — |

## 7. Equivalencia con la lista anterior (V-*)

Los **71 ID `V-*` anteriores se conservan** en esta tabla; ninguno desaparece. Los
criterios se re-expresaron como `AC-*` con precondición/acción/resultado/fallos/DS fuente;
donde un `V-*` cubría varios escenarios, mapea a varios `AC-*`.

| V-* anterior | AC-* vigente | V-* anterior | AC-* vigente |
|---|---|---|---|
| V-01 | AC-SES-001, AC-SES-003 | V-50 | AC-SHT-005 |
| V-02 | AC-SES-001 (fila de fallos) | V-51 | AC-SHT-016 |
| V-03 | AC-PWD-001, AC-NAV-04 | V-52 | AC-SHT-016 |
| V-04 | AC-PWD-001 | V-53 | AC-SHT-016 |
| V-05 | AC-SES-005 | V-54 | AC-SHT-011 |
| V-06 | AC-SES-004 | V-55 | AC-SHT-009 |
| V-07 | AC-SES-006 | V-56 | AC-SHT-010, AC-RES-01 |
| V-10 | AC-RCV-001 | V-57 | AC-SHT-008 |
| V-11 | AC-RCV-001 (campos del paso 4) | V-60 | AC-DAT-01 |
| V-12 | AC-RCV-001 (anti-enumeración) | V-61 | AC-DAT-02 |
| V-20 | AC-ORG-004 | V-62 | AC-DAT-04 |
| V-21 | AC-ORG-005 | V-63 | AC-DAT-03 |
| V-22 | AC-ORG-005 | V-64 | AC-DAT-05 |
| V-23 | AC-ORG-011, AC-ORG-012 | V-70 | AC-DS-01 |
| V-24 | AC-ORG-006 | V-74 | AC-APP-002 |
| V-30 | AC-IDT-001 | V-75 | AC-APP-002 |
| V-31 | AC-IDT-008, AC-IDT-010 | V-76 | AC-APP-001 |
| V-32 | AC-IDT-003 | V-77 | AC-APP-005, AC-BCK-01 |
| V-33 | AC-IDT-004 | V-78 | AC-APP-003, AC-BCK-04 |
| V-34 | AC-IDT-004 | V-79 | AC-APP-002 |
| V-35 | AC-PWD-002 | V-80 | AC-APP-002 |
| V-36 | AC-PWD-003 | V-81 | AC-APP-002 |
| V-37 | AC-PWD-004, AC-PWD-005 | V-82 | AC-APP-002 |
| V-38 | AC-IDT-011 | V-83 | AC-DAT-01, AC-APP-002 |
| V-39 | AC-IDT-002 (fila de fallos) | V-84 | AC-APP-005 |
| V-40 | AC-WPN-002 | V-85 | AC-APP-006 |
| V-41 | AC-WPN-003 | V-86 | AC-APP-007 |
| V-42 | AC-CAL-001, AC-CAL-002 | V-87 | AC-APP-004, AC-BCK-02 |
| — | — | V-88 | AC-APP-008 |
| V-90 | AC-NAV-01 | V-94 | AC-NAV-05 |
| V-91 | AC-NAV-02 | V-95 | AC-NAV-06 |
| V-92 | AC-NAV-03 | V-96 | AC-NAV-07 |
| V-93 | AC-NAV-04 | V-A1…V-A7 | AC-BCK-01…07 (1:1 en orden) |

> Los `V-R*` (riesgos) conservan sus ID en §10 sin renumeración.

## 8. Pruebas automatizadas admitidas por el gate `tests`

Se proponen sólo tras autorización. Ninguna existe hoy. El diseño de pruebas de núcleo
(auth, permisos y contratos de sesión) es **required** por los hard triggers activos
(`auth`, `permissions`, `sensitive-data`). **Ninguna suite acredita por sí sola un AC de
usuario** (§1); su lenguaje y tooling siguen el stack aprobado (D-08) cuando se autoricen.

| Suite | Objetivo |
|---|---|
| Cliente HTTP | `X-CSRFToken` sólo en no seguros; `X-Tenant-Code` presente con exclusiones; `credentials: 'include'`; `403` de contexto perdido ⇒ logout |
| Anti-carrera | respuestas con `generation` obsoleta se descartan |
| Validación de forma | `auth/context` valida `permissions` y rechaza `permission_codes` |
| Enums de apariencia | rechazo de valores fuera de los enums backend, en la ruta legacy y en la de los ocho ejes |
| Catálogo del personalizador | los ocho ejes validan contra el catálogo exacto; ningún valor inventado pasa |
| Autosave de apariencia | una sola escritura en vuelo; una respuesta tardía no marca `saved` sobre una instantánea ya sustituida |
| Purga de preferencias | al cerrar sesión se vacía la cola y se descartan respuestas en vuelo |
| Router | entrada directa a ruta de detalle, back/forward y redirección con `query.redirect` |
| Guards | el guard espera al contexto y bloquea por `must_change_password` |
| Semántica de la ruta de preferencias | un `403` no dispara cierre de sesión automático |
| Recuperación | los cuatro pasos envían `{ rut }`, `{ rut, correo }`, `{ rut, codigo }`, `{ rut, codigo, nueva_contrasena }` |
| Reglas de presentación | `—` para ausente; vacío ≠ error ≠ denegado |
| Unicidad de resultados | el cliente no ofrece alta duplicada ya rechazada por el backend |

## 9. Cobertura documental (verificable sin ejecutar nada)

Registro conservado de la revisión estática anterior (evidencia de lecturas de código y
fuentes ya realizadas; no es runtime ni se re-ejecutó en esta tarea):

| Ítem | Localizador | Estado |
|---|---|---|
| 21 registros de router, incluido `memberships` | `apipoligono/urls.py:40–60` | Covered |
| 16 rutas manuales | `apipoligono/urls.py:66–95` | Covered |
| 26 decoradores `@action` | `apipoligono/views.py`, `apps/*/views.py` | Covered |
| Acciones de `usuarios` (9) | `apipoligono/views.py:327–727` | Covered |
| Acciones de `lecciones` (6) | `apipoligono/views.py:807–1169` | Covered |
| Acciones de `fracciones` (2) | `apipoligono/views.py:1183–1242` | Covered |
| Acciones de `organization-units` (3) | `apps/organizations/views.py:85–191` | Covered |
| Acciones de `recintos` (2) | `apps/organizations/views.py:217–254` | Covered |
| Acciones de `posiciones` (3) | `apps/identity/views.py:37–121` | Covered |
| Campos completos por recurso (21) | `backend-contracts.md` (índice) y [contracts/](contracts/) | Covered |
| Mapa `(resource, action) → permission_code` | `apps/authorization/permissions.py:37–104` | Covered |
| Forma de `auth/context` | `apipoligono/views.py:1456–1474` | Covered |
| Contrato de recuperación | `apipoligono/utils/recuperacion_utilidades.py:45–138` | Covered |
| Enums de apariencia | `apipoligono/views.py:1912–1939`, `apipoligono/models.py:20–36` | Covered |
| Reglas de escritura por código | `apipoligono/serializers.py`, `apps/*/serializers.py` | Covered |
| Ausencia de paginación | `control_poligono/settings.py:156–172` | Covered |
| Ejes y defaults del Design System | `../../Inume Design System/DESIGN.md:265–273`, `assets/js/theme-customizer.js:74–80` | Covered |
| Catálogo de los ocho ejes (27/26/9/3/7/8/7) | `theme-customizer.js:55–66`, `:216`, `DESIGN.md:265–273` | Covered |
| Familias de iconos (7) y 44 conceptos | `theme-customizer.js:216–231`, `:235–280`, `:313` | Covered |
| Markup del panel del personalizador | `index.html:478–530` | Covered |
| Inyección de los controles extendidos | `theme-customizer.js:724–856`, invocación en `:865` | Covered |
| Semántica de `apply()` por eje | `theme-customizer.js:415–490`, `:454–472` | Covered |
| URLs de tipografías bajo demanda | `theme-customizer.js:83–92`, `:698–708` | Covered |
| Persistencia en `localStorage` del DS (sustituida) | `theme-customizer.js:54`, `:409`; `app.js:121–131` | Covered |
| Versión de `vue-router` y peers | `registry.npmjs.org/vue-router/latest` (2026-10-01), `router.vuejs.org/guide/` | Covered |
| Preferencias legacy de apariencia | `apipoligono/models.py:20–36`, `views.py:1901–1940`, migración `0011_*` | Covered |
| Leaf de migraciones observado | `apipoligono/migrations/0020_ejercicio_consumo.py` | Covered, a reconfirmar al implementar |
| Valores de tokens Base UI | `../../Inume Design System/assets/css/baseui.css:37–72` | Covered |
| Biblioteca DS accesible (46 entradas) | lectura directa del directorio | Covered |
| Sospecha de `NameError` (B-01) | `apipoligono/views.py:880` vs `:954` | Riesgo abierto, sin runtime |
| Proveedor de base de datos del entorno | no leído: sin `.env` ni conexión | No verificado |
| Correspondencia `palette`/`density` → ejes DS | **retirada**: no se traduce ni se reinterpretan | Decisión cerrada D-01 |
| Origen del tenant inicial | selección manual de institución real en el login | Decisión cerrada D-03 |
| Stack del cliente TypeScript | orden del operador 2026-10-02; registro canónico D-08 en `requirements.md` §12 (citado vía `AGENTS.md`; no re-leído aquí) | Decisión cerrada D-08; baseline JS conservado, migración T-26 sin ejecutar |

## 10. Riesgos de verificación

| ID | Riesgo |
|---|---|
| V-R01 | Un test en verde puede ocultar una pantalla ausente o un dato no mostrado |
| V-R02 | Sin cuenta de prueba autorizada, ninguna escritura puede ejercitarse; el criterio observable de escritura queda `NOT_VERIFIED` |
| V-R03 | La comparación visual DS requiere autorización del operador (AC-DS-01, antes V-70) |
| V-R04 | B-01 puede impedir verificar el detalle de resultados por lección; al no haberse ejecutado el servidor, sigue siendo **hipótesis** |
| V-R05 | Un throttling activo durante la revisión produce falsos negativos de permisos |
| V-R06 | Si el login no captura la institución real, el primer `GET /api/auth/context/` va sin tenant y `HasTenantAccess` devuelve `403`; mitigado con la selección manual de D-03, pero sigue siendo un paso que hay que observar |
| V-R07 | La API no devuelve `401`; una comprobación de tests que espere `401` daría falso negativo |
| V-R08 | **Superado 2026-10-15:** `vue-router 5.3.1` está instalado y en uso (`front/package.json`; router real en `front/src/router/`); se conserva el registro histórico «no está instalado: hasta que T-19 se ejecute y se apruebe…», y la verificabilidad de rutas y deep-links sigue sujeta a la aceptación en curso |
| V-R09 | La migración de preferencias no aplicada deja los ocho ejes sin persistir; la UI caería en un error de contrato visible, no en un fallo silencioso |
| V-R10 | Un `403` de la ruta de preferencias malinterpretado cerraría la sesión del usuario sin motivo |
| V-R11 | El baseline es JavaScript y el stack aprobado es TypeScript (D-08): cualquier tarea o verificación que declare el cliente «migrado» sin orden explícita y tooling operativo (T-26) produciría un registro falso; hasta entonces, la convivencia de código JS existente y código nuevo en TS es hecho esperado y debe registrarse como tal. **Superado 2026-10-15:** el cliente está en **TypeScript** (`front/src/`: 38 `.vue` con `lang="ts"`, 34 `.ts`, 0 `.js`); el registro histórico se conserva y el riesgo de registro falso deja de aplicar como estado vigente |

## 11. Criterio de cierre

La spec podrá pasar a `done` sólo cuando:

1. Los **131 criterios `AC-*`** aplicables estén verificados por el operador como resultado
   observable, o marcados `NOT_VERIFIED` con motivo (autorización pendiente, hueco abierto
   o ruta propuesta no implementada).
2. Los cuatro quality gates estén en `passed` o con excepción documentada.
3. `AGENTS.md`, `front/AGENTS.md` y esta spec sigan siendo coherentes con el código.
4. D-02, la única decisión de producto aún abierta, esté resuelta o aceptada explícitamente
   (T-00).
5. El operador apruebe el cierre y se actualicen `status` y `verified_at` en
   `spec-meta.yaml`.

Hasta entonces `verified_at` permanece null y ningún gate se declara pasado —el estado ya
figura `approved` desde 2026-10-02 por su carril de gobernanza; la transición a `done` no
la autorizan estos tomos—, y **no se afirma que el frontend integral esté implementado ni
que el runtime funcione**.

> 🕯️ Un tomo sin verdad es un hechizo roto: estos criterios existen para que la
> verificación la decida la pantalla real con datos reales, no la documentación que la
> describe.
