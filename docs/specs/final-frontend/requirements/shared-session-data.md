---
spec_meta: "../spec-meta.yaml"
---

# Requisitos de frontend — Datos compartidos de sesión

> 📖 Yo registro aquí los requisitos globales (`R-SES-*`) del dato compartido que atraviesa
> todo el cliente: transporte HTTP, cabeceras, contexto de sesión, unidad activa,
> semántica de códigos de autenticación, anti-carrera, memoria, purga, contraseña forzada
> y guards de router. Este tomo **operacionaliza** los requisitos canónicos de
> [requirements.md](../requirements.md) §3.1/§6.2 (R-AUTH-*, R-ROUTER-*, R-UNIT-*,
> R-DAT-05/06) y el transporte de [technical-design.md](../technical-design.md) §2–§3;
> no los sustituye ni los contradice. Los estados citados (`ST-*`) se definen en
> [../experience/states.md](../experience/states.md); los flujos que consumen estos datos
> en [../experience/flows.md](../experience/flows.md).

## Índice

1. [Alcance y autoridad](#alcance-y-autoridad)
2. [Transporte y cabeceras](#transporte-y-cabeceras)
3. [Datos retornados por el contexto](#datos-retornados-por-el-contexto)
4. [Semántica de códigos de autenticación](#semántica-de-códigos-de-autenticación)
5. [Anti-carrera y memoria](#anti-carrera-y-memoria)
6. [Purga y contraseña forzada](#purga-y-contraseña-forzada)
7. [Guards de router y datos que consumen](#guards-de-router-y-datos-que-consumen)
8. [Huecos registrados](#huecos-registrados)
9. [Trazabilidad](#trazabilidad)

---

## Alcance y autoridad

Estos requisitos aplican a **toda** petición y a **toda** pantalla del cliente, sin
excepción por dominio. La autoridad sobre tenant, unidad, sesión y permiso efectivo es el
backend; el cliente no reimplementa autorización: oculta lo que el permiso no permite y
muestra la denegación cuando ocurre (R-DOM-AZ familia, `technical-design.md` §11).

- **R-SES-001** — El cliente SHALL usar un **único** cliente HTTP `fetch` con origen
  `/api` (same-origin bajo el proxy de Vite hacia `http://127.0.0.1:8000`); SHALL NOT
  introducir Axios ni clientes por dominio que dupliquen CSRF y tenant.
  *Fuente: `technical-design.md` §2, §13; `requirements.md` X-02.*
- **R-SES-002** — WHEN el cliente emite cualquier petición, THEN SHALL incluir
  `credentials: 'include'` para transportar la cookie HttpOnly `sessionid`.
  *Fuente: `technical-design.md` §2 regla 1; R-AUTH-05.*
- **R-SES-003** — WHEN el método no es seguro (todo lo que no sea `GET`, `HEAD`,
  `OPTIONS`), THEN el cliente SHALL enviar `X-CSRFToken` leído de la cookie `csrftoken`,
  que es legible por JS (`CSRF_COOKIE_HTTPONLY = False`). *Fuente: `technical-design.md`
  §2 regla 2; R-AUTH-05.*
- **R-SES-004** — WHEN la petición es autenticada, THEN el cliente SHALL enviar
  `X-Tenant-Code`, **salvo** en las rutas excluidas declaradas: `auth/login/`, `logout/`,
  `protected/`, las dos rutas de preferencias y los cuatro endpoints de recuperación.
  Sin el header, `HasTenantAccess` devuelve `403`. *Fuente: `technical-design.md` §2
  regla 3; R-AUTH-06.*
- **R-SES-005** — El código de tenant SHALL obtenerse **sólo** de la institución real
  capturada en el formulario de login (campo ya existente) o re-capturada en `/contexto`;
  el cliente SHALL NOT pedir una lista de tenants al backend, SHALL NOT inventar un
  endpoint de bootstrap y SHALL NOT hardcodear un código de demostración.
  *Fuente: R-LOGIN-01, D-03, R-AUTH-06.*
- **R-SES-006** — El cliente SHALL mantener en memoria el código de unidad activa
  devuelto por el contexto (`active_organization_unit`) o por `select-unit`
  (`organization_unit_code`). El middleware del backend lee la unidad activa desde
  `X-Org-Unit-Code` «cuando corresponda» (*contrato
  [auth-context.md](../contracts/auth-context.md) §Contexto y cabeceras*); la spec no
  inventa un inventario de endpoints que lo exijan: el mecanismo primario de cambio de
  unidad es `POST /auth/select-unit/` (OP-AUT-003, FL-SES-004).

---

## Datos retornados por el contexto

- **R-SES-007** — WHEN el contexto se resuelve (`GET /auth/context/`, OP-AUT-002), THEN
  el store de sesión SHALL consumir exactamente la forma retornada:
  `user:{id_usuario, rut?, must_change_password}`, `tenant:{code?, context?}`,
  `active_organization_unit?`, `unit_membership?`, `scopes:string[]`,
  `assignments:[{role, scope?, organization_unit?, is_primary}]` y `permissions:string[]`.
  La clave de permisos es **`permissions`**; `permission_codes` (guía frontend
  desactualizada) SHALL NOT usarse. *Fuente: contrato auth-context §Contexto;
  R-AUTH-04, X-01.*
- **R-SES-008** — El array `permissions` del contexto SHALL ser la **única** fuente de
  visibilidad de acciones y entradas de menú (junto a la presencia del dato de
  contexto); la visibilidad que otorga la UI nunca acredita autorización y un `403`
  posterior se muestra como denegación (ST-07). *Fuente: R-RES-25;
  `technical-design.md` §8 y §11.*
- **R-SES-009** — WHEN una vista necesita catálogos de selección (unidades elegibles,
  roles por categoría, personas por unidad, scopes, calibres, armerías), THEN SHALL
  poblarlos desde sus OP reales (OP-UNT-009/010, OP-AZC-001…004, OP-SCP-001, OP-CAL-001,
  OP-ARM-001) y SHALL NOT rellenarlos de memoria, hardcodeados ni de datos de otra
  unidad. *Fuente: `technical-design.md` §8, §13; R-DAT-01.*

---

## Semántica de códigos de autenticación

- **R-SES-010** — La API **no emite `401`**: `SessionCsrfAuthentication` no expone
  `authenticate_header` y DRF degrada `NotAuthenticated` a `403`. El cliente SHALL tratar
  `403` como «sin permiso o sin sesión» y SHALL diferenciar por el `detail` y el
  contexto, no por el código solo. *Fuente: R-AUTH-07; `technical-design.md` §2 regla 4.*
- **R-SES-011** — WHEN un `403` proviene de `HasTenantAccess`
  (`No tiene acceso al tenant solicitado.`) o acredita sesión ausente, THEN el cliente
  SHALL purgar el estado en memoria y volver a login **sin reintentar** (F-12); no hay
  refresh token y reintentar es inútil. WHEN el `403` es de negocio con `detail`, THEN
  SHALL mostrarlo literal (ST-07) y conservar la sesión (F-02). *Fuente: R-AUTH-07,
  `technical-design.md` §2 reglas 4–5.*
- **R-SES-012** — WHEN un `403` ocurre en una ruta de preferencias, THEN el cliente
  SHALL NOT cerrar sesión automáticamente: distingue por contexto y consulta
  OP-AUT-002 antes de decidir. *Fuente: R-APP-13; `technical-design.md` T-09.*
- **R-SES-013** — WHEN una respuesta es `429`, THEN el cliente SHALL mostrar mensaje de
  espera con `Retry-After` si viene, SHALL deshabilitar el envío durante el vuelo y
  SHALL NOT reintentar automáticamente. Throttles declarados: `auth: 20/min` (login),
  `unit_selection: 30/min` (select-unit), `AuthEndpointThrottle` (recuperación).
  *Fuente: `technical-design.md` §2 regla 6, T-03; `requirements.md` §3.2.*
- **R-SES-014** — WHEN una respuesta es `404`, THEN el cliente SHALL tratarla como error
  explícito (ST-04) con el mensaje del backend si existe, y SHALL NOT pintar el registro
  ausente ni re-crearlo localmente. *Fuente: F-04 de `../experience/flows.md`.*

---

## Anti-carrera y memoria

- **R-SES-015** — Cada store SHALL registrar un `generation` incremental; al cambiar de
  unidad activa, cerrar sesión o expirar la sesión, el `generation` SHALL incrementarse y
  toda respuesta con `generation` distinto SHALL descartarse (ST-08) sin pintar estado.
  *Fuente: `technical-design.md` §2 anti-carrera; R-AUTH-09.*
- **R-SES-016** — Todo estado de negocio, sesión, permisos y apariencia SHALL vivir sólo
  en memoria (Pinia). El cliente SHALL NOT persistir credenciales ni PII en
  `localStorage`, `sessionStorage`, cookies de estado ni rehidratación, y SHALL NOT
  mantener caché persistente de datos: al volver a una pantalla se re-consulta mientras
  la sesión lo permita, para no mostrar datos de otra unidad. *Fuente: R-DAT-05,
  `technical-design.md` §13; `front/AGENTS.md` §Stack aprobado y §Datos.*
- **R-SES-017** — WHEN un cambio de unidad activa tiene éxito, THEN el cliente SHALL
  recargar los datos dependientes de las pantallas abiertas desde el nuevo contexto;
  las preferencias de apariencia SHALL conservarse (mismo usuario). *Fuente: R-UNIT-01,
  R-APP-06; FL-SES-004.*
- **R-SES-018** — Los mensajes del backend que contienen PII (RUT u otros) SHALL
  mostrarse en pantalla cuando el contrato los devuelve, pero SHALL NOT registrarse en
  logs del cliente, artefactos ni mensajes de error persistidos. *Fuente: R-DAT-06;
  `technical-design.md` §11.*

---

## Purga y contraseña forzada

- **R-SES-019** — WHEN el usuario cierra sesión, THEN el cliente SHALL abortar primero
  las peticiones en vuelo (incluidas las escrituras de apariencia en cola), SHALL emitir
  `POST /logout/` (OP-AUT-005, sin body ni `X-Tenant-Code`), SHALL purgar **todo** el
  estado en memoria y SHALL restablecer la apariencia a defaults, incluso si la petición
  de logout falla por red. *Fuente: R-AUTH-08, R-APP-06; FL-SES-005.*
- **R-SES-020** — WHEN la sesión expira o se pierde, THEN el cliente SHALL aplicar la
  misma purga y volver a login sin reintentos (F-12), preservando el destino original
  como hace el guard (R-ROUTER-04). *Fuente: R-AUTH-07/09; FL-SES-006.*
- **R-SES-021** — WHEN `must_change_password` es verdadero (login o contexto), THEN el
  cliente SHALL enrutar al cambio forzado y SHALL bloquear toda ruta operativa salvo
  `password-required` y login hasta que el contexto refrescado muestre la bandera en
  falso. En el flujo forzado el backend no exige `old_password`; fuera de él, sí: la UI
  SHALL reflejar exactamente esa distinción. *Fuente: R-AUTH-02, R-ROUTER-05, R-RUL-07;
  FL-PWD-001/002.*

---

## Guards de router y datos que consumen

- **R-SES-022** — Los guards SHALL esperar a que el contexto de sesión termine de cargar
  o falle de forma terminal (estado `booting`) antes de decidir, para que una recarga
  profunda no expulse al usuario ni resuelva contra un contexto vacío. *Fuente:
  R-ROUTER-06; `technical-design.md` §3.2.*
- **R-SES-023** — WHEN no hay contexto de sesión, THEN el guard global SHALL llevar a
  login preservando el destino original (`query.redirect`) para volver a él tras
  autenticar; la entrada directa a una ruta de detalle SHALL funcionar tras autenticar.
  *Fuente: R-ROUTER-03/04.*
- **R-SES-024** — WHEN una ruta exige tenant (`meta.requiresTenant`) y el contexto no lo
  tiene, THEN la app SHALL mostrar el estado de contexto perdido **sin reintento en
  bucle**; y WHEN no existe ruta para la URL, THEN SHALL mostrar la pantalla 404 del
  Design System, no una vista en blanco. *Fuente: R-ROUTER-07/08.*
- **R-SES-025** — WHEN el usuario navega con back/forward o recarga una URL directa,
  THEN la app SHALL reconstruir la pantalla correspondiente mediante
  `createWebHistory`; los identificadores de recurso viajan como parámetros de ruta, no
  en el query. *Fuente: R-ROUTER-01/02/03; `technical-design.md` §3.1.*

---

## Huecos registrados

> 🕯️ Los huecos se explicitan sin workaround inventado; corresponden al orquestador y al
> operador decidir sobre ellos.

| ID | Hueco | Evidencia | Tratamiento en este tomo |
|---|---|---|---|
| G-SES-1 | Tras una **recarga profunda con sesión viva** no existe endpoint que devuelva el tenant sin cabecera: OP-AUT-002 exige `X-Tenant-Code` (TA) y el tenant sólo vive en memoria (R-DAT-05, sin persistencia). | `contracts/auth-context.md` §Contexto; `technical-design.md` §2 regla 3, §4 (ruta `/contexto` declarada para «selección de unidad activa y de tenant») | La única vía documentada es la re-captura manual de la institución en `/contexto` (FL-SES-002 paso 2b). No se inventa endpoint de bootstrap ni lista de tenants (R-AUTH-06). Se reporta al integrador |
| G-SES-2 | El contrato no declara **qué endpoints exigen `X-Org-Unit-Code`** más allá de «cuando corresponda» en el middleware. | `contracts/auth-context.md` §Contexto y cabeceras | R-SES-006 no inventa el inventario: el mecanismo primario de unidad activa es OP-AUT-003. Se reporta |
| G-SES-3 | Filtros, paginación y ordenamiento globales **no comprobados** (sin `filter_backends` ni `pagination_class` declarados en los ViewSets revisados). | `backend-inventory.md` §Límites comprobados | R-RES-22 se aplica tal cual: búsqueda/orden/selección en cliente sobre arrays planos; sin asumir capacidades no confirmadas |

---

## Trazabilidad

| R-SES | Padre canónico |
|---|---|
| R-SES-001…004 | R-AUTH-05/06; `technical-design.md` §2 |
| R-SES-005 | R-LOGIN-01, D-03 |
| R-SES-006 | R-UNIT-01; contrato auth-context |
| R-SES-007…009 | R-AUTH-04 (X-01), R-RES-25, R-DAT-01 |
| R-SES-010…012 | R-AUTH-07, R-APP-13, T-09 |
| R-SES-013…014 | `technical-design.md` §2 regla 6, T-03; F-03/F-04 |
| R-SES-015…018 | R-AUTH-09, R-DAT-05/06, R-APP-06 |
| R-SES-019…021 | R-AUTH-02/08, R-ROUTER-05, R-RUL-07 |
| R-SES-022…025 | R-ROUTER-01…08 |

> Este tomo no crea requisitos nuevos de producto: operacionaliza los canónicos con
> perspectiva de usuario observable por fase. La spec está **`approved`** desde el 2026-10-02
> ([spec-meta.yaml](../spec-meta.yaml)); esto no supera gates por sí solo (`verified_at: null`,
> ningún gate en `passed`) y la ejecución vigente se rige por el plan de cierre (verificado 2026-10-15).
