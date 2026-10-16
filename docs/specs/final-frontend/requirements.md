---
spec_meta: "./spec-meta.yaml"
---

# Requirements — Frontend integral del producto final

## 1. Propósito y alcance

Esta spec define el **frontend integral** del producto final: el cliente web completo,
construido sobre **todas** las funcionalidades que el backend existente expone hoy.
El punto de partida del cliente fue un dashboard de lectura (`front/src/App.vue`,
`front/AGENTS.md:10–13`); esta spec amplía el alcance a producto final sin cambiar la
autoridad visual. El stack aprobado **sí fue modificado por orden explícita del operador
del 2026-10-02**: TypeScript sustituye a JavaScript como lenguaje del código objetivo
(D-08 en §12); el resto del stack —Vue 3, Vue Router, Pinia, CSS vanilla— no cambia.
**Actualización 2026-10-15:** el dashboard de lectura y el baseline JavaScript son hechos
históricos, superados — `front/src/` está en **TypeScript** (38 `.vue` con `lang="ts"`,
34 `.ts`, 0 `.js`) y `vue-router 5.3.1` está instalado y en uso; el kit externo del DS
sigue siendo HTML/CSS/JS como referencia.

**Fuentes canónicas.** El código actual manda sobre los ejemplos de las guías:
`apipoligono/urls.py`, `apipoligono/views.py`, `apipoligono/serializers.py`,
`apipoligono/models.py`, `apps/*/views.py`, `apps/*/serializers.py`, `apps/*/models.py`,
`apps/authorization/permissions.py`, `apps/authorization/scope.py`,
`apipoligono/mixins.py`, `control_poligono/settings.py`. Cuando `docs/06_API_REFERENCE.md`
o `docs/12_GUIA_FRONTEND.md` contradicen al código, el código gana y la discrepancia se
registra en §11.

**Fuente visual.** La autoridad visual es la biblioteca **externa** del Design System,
ubicada en `../../Inume Design System/` respecto de la raíz de este repositorio.
Ruta **verificada y accesible**: la lectura directa del directorio devuelve 46 entradas
(`index.html`, `DESIGN.md`, `PRODUCT.md`, `assets/`, `auth-*.html`, `charts.html`,
`forms-*.html`, `maps-vector.html`, `pages-404*.html`, `serve.sh`, `tables-*.html`,
`ui-*.html`). **No existe bloqueo de fuente visual.** La carpeta interna homónima del
repositorio sigue prohibida como fuente (`AGENTS.md:11`, `front/AGENTS.md:24`).

**Fuente del personalizador.** La lógica de los ocho ejes y el markup de su panel están
leídos y citados de `../../Inume Design System/assets/js/theme-customizer.js`
(973 líneas), `assets/js/app.js` (sección de tema, `:116–155`) e `index.html`
(panel, `:478–530`; el markup estático cubre sólo 7 acentos y 4 fondos, y el resto lo
inyecta `buildExtendedUI()` en `theme-customizer.js:724–856`, invocado en `:865`).

**Fuente de la versión de enrutado.** `registry.npmjs.org/vue-router/latest` y la
documentación oficial `router.vuejs.org/guide/`, consultadas el 2026-10-01; el manifiesto
local `front/package.json` se leyó del disco. Detalle en `technical-design.md` §1.

**No se afirma ningún total deducido de rutas.** Cualquier cifra de "n rutas" que mezcle
métodos HTTP, patrones de URL y registros de router no se usa. La cobertura se expresa
como inventario explícito de registros de router, rutas manuales y decoradores `@action`.

**Mapa de lectura.** El índice completo de la spec —fuentes canónicas por materia, orden
de lectura, baseline actual frente al producto objetivo y entregas pendientes— vive en
[`index.md`](./index.md). Este documento es la fuente de verdad del alcance, los
requisitos transversales, las invariantes, las decisiones y la cobertura integral; el
detalle por dominio se delega en los volúmenes que §3.4.1 indexa.

## 2. User stories

| ID | Historia | Rol |
|---|---|---|
| US-01 | Como usuario autenticado, quiero iniciar sesión con RUT y contraseña para entrar al sistema. | Todos |
| US-02 | Como usuario con `must_change_password`, quiero ser forzado a cambiar mi contraseña antes de operar, para que la temporal nunca se use en producción. | Todos |
| US-03 | Como usuario con varias unidades, quiero cambiar mi unidad activa para operar dentro de mi rama. | Mando / oficial |
| US-04 | Como `tenant_admin`/`super_admin`, quiero administrar personas, roles, puestos, unidades y permisos para mantener la organización. | Administración |
| US-05 | Como oficial de tiro, quiero crear polígonos, lecciones, fracciones y registrar resultados por tirador y carril, para llevar el control de una sesión de tiro. | Oficial de tiro |
| US-06 | Como oficial de tiro, quiero registrar tiradores temporales y promoverlos a cuentas formales, para no perder resultados históricos. | Oficial de tiro |
| US-07 | Como encargado de almacén, quiero administrar armerías, armas y consumos para controlar el material. | Almacén |
| US-08 | Como supervisor operativo, quiero consultar el resumen y el reporte agregado de una lección sin ver detalle individual, para supervisar sin invadir privacidad. | Supervisor (scope sin detalle) |
| US-09 | Como `auditor` o administrador, quiero consultar la bitácora de auditoría para revisar decisiones de acceso. | Auditoría |
| US-10 | Como tirador, quiero ver mis propios resultados y cambiar mi contraseña, sin intrusive para otros. | Tirador |
| US-11 | Como usuario, quiero recuperar o establecer mi contraseña en cuatro pasos, para reentrar si la olvido. | Todos |
| US-12 | Como usuario, quiero ajustar los ocho ejes del personalizador del Design System —tema, acento, fondo, tipografía, radio, iconos, ambiente y color de ambiente— y que se guarden en mi cuenta, para trabajar con la apariencia que necesito. | Todos |
| US-13 | Como usuario, quiero navegar por la aplicación con rutas reales, entrar directamente a una pantalla y usar atrás/adelante, para no perderme en el flujo. | Todos |

## 3. Requisitos EARS

### 3.1 Autenticación, sesión y contexto

- **R-AUTH-01** — WHEN el usuario envía RUT y contraseña válidos a `POST /api/auth/login/`,
  THEN el cliente SHALL obtener sesión por cookie HttpOnly (`sessionid`) y SHALL navegar
  al flujo de contexto. *Fuente: `apipoligono/views.py:1386–1401`. La respuesta expone
  exactamente dos claves: `id_usuario` (entero) y `must_change_password` (booleano).*
- **R-AUTH-02** — WHEN el login responde `must_change_password: true`, THEN el cliente
  SHALL enrutar al flujo de cambio de contraseña y SHALL bloquear el resto de la
  funcionalidad hasta completarlo. *Fuente: `views.py:1397–1399`, `models.py:39`.*
- **R-AUTH-03** — WHEN el login responde `400`, THEN el cliente SHALL mostrar el mensaje
  del backend y SHALL NOT inventar ni sugerir credenciales. *Fuente:
  `RUTAuthTokenSerializer.validate`, `serializers.py:441–456`.*
- **R-AUTH-04** — WHEN el cliente autenticado carga el contexto, THEN SHALL consumir
  `GET /api/auth/context/` y SHALL leer el array `permissions`. *Fuente:
  `views.py:1456–1474` (clave `permissions`, `views.py:1471`). `docs/12_GUIA_FRONTEND.md`
  dice `permission_codes` y está desactualizado: ver X-01 en §11.*
- **R-AUTH-05** — WHEN el cliente ejecuta un método no seguro, THEN SHALL enviar
  `X-CSRFToken` leyendo la cookie `csrftoken` y SHALL usar `credentials: 'include'` en
  toda petición. *Fuente: `control_poligono/settings.py:183–191`
  (`CSRF_COOKIE_HTTPONLY = False`), `apps/identity/authentication.py:4–17`.*
- **R-AUTH-06** — WHEN existe sesión autenticada, THEN el cliente SHALL enviar
  `X-Tenant-Code`. *Fuente: `apps/tenants/middleware.py:10`; sin el header
  `request.tenant` queda `None` y `HasTenantAccess` devuelve `403`
  (`apps/authorization/permissions.py:264–270`). El tenant inicial es una decisión
  pendiente declarada en §12 (D-05): el backend **no** expone ningún endpoint que liste
  tenants para un usuario anónimo, y el cliente SHALL NOT inventar uno ni hardcodear un
  código de demo.*
- **R-AUTH-07** — WHEN una respuesta indica sesión no autenticada, THEN el cliente SHALL
  limpiar el estado en memoria y SHALL volver al login sin reintentar. *Fuente: la API
  DRF responde **`403`**, no `401`, cuando no hay sesión — `SessionCsrfAuthentication`
  no expone `authenticate_header`, por lo que DRF degrada `NotAuthenticated` a `403`
  (`apps/identity/authentication.py:1–17`). El cliente SHALL tratar `403` como "sin
  permiso o sin sesión" y diferenciar por la presencia de `detail`; no se puede
  distinguir por código solo.*
- **R-AUTH-08** — WHEN el usuario cierra sesión (`POST /api/logout/`), THEN el cliente
  SHALL abortar las peticiones en vuelo y SHALL purgar todo el estado en memoria.
  *Fuente: `views.py:1404–1409`.*
- **R-AUTH-09** — WHEN la sesión expira, se cancela o se cambia de unidad activa, THEN el
  cliente SHALL descartar respuestas tardías de peticiones anteriores.

### 3.2 Recuperación de contraseña (cuatro pasos)

Los cuatro endpoints son `@api_view(['POST'])` con `AllowAny` y `AuthEndpointThrottle`
(`apipoligono/utils/recuperacion_utilidades.py:45–138`).

- **R-REC-01** — El cliente SHALL exponer cuatro pasos en orden:
  1. `POST /api/recuperar/` — entrada `{ rut }`. Respuesta `200` con
     `{ detail }` y, si el RUT existe, además `correo_censurado`.
  2. `POST /api/recuperar/crear/` — entrada `{ rut, correo }`. Respuesta `200` con
     `{ detail }` siempre, exista o no el RUT (anti-enumeración).
  3. `POST /api/recuperar/comprobar/` — entrada `{ rut, codigo }`. Respuesta `200`
     `{ mensaje }` o `400` `{ mensaje }` si el código es incorrecto o expiró (5 minutos).
  4. `POST /api/recuperar/cambiar/` — entrada `{ rut, codigo, nueva_contrasena }`.
     Respuesta `200` `{ mensaje }` o `400` `{ mensaje, errores[] }`.

  **Fuente: `recuperacion_utilidades.py:48–138`.** El campo del paso 4 es
  `nueva_contrasena`, **no** «dígito verificador»; el código de verificación es
  `codigo` en los pasos 3 y 4.
- **R-REC-02** — WHEN un paso falla, THEN el cliente SHALL permanecer en ese paso y SHALL
  mostrar el mensaje del backend. Los pasos 1 y 2 nunca revelan si el RUT existe
  (`MENSAJE_GENERICO`, `recuperacion_utilidades.py:17`), por lo que la UI SHALL NOT
  inferir existencia a partir de ellos.

### 3.3 Unidad activa, preferencias y autoridad visual

- **R-UNIT-01** — WHEN el usuario selecciona otra unidad, THEN el cliente SHALL llamar
  `POST /api/auth/select-unit/` con `{ organization_unit_code }` y SHALL recargar
  contexto y datos dependientes. *Fuente: `views.py:1481–1539`.*
- **R-UNIT-02** — WHEN `select-unit` responde `403`, THEN el cliente SHALL mostrar el
  motivo (`La unidad no está en tus pertenencias activas.` o
  `La unidad no esta en sus asignaciones activas.`) y SHALL NOT reintentar. *Fuente:
  `views.py:1499–1503` (modo v2, `AUTHZ_USE_UNIT_MEMBERSHIP=True`,
  `settings.py:197`) y `views.py:1523–1527` (fallback legacy).*
- **R-PREF-01** — La apariencia visible la gobiernan los **ocho** ejes del Design System
  mediante la ruta de §6.1. WHEN el usuario cambia un eje, THEN el cliente SHALL
  aplicarlo de inmediato y persistirlo con autosave. La ruta legacy
  `PUT /api/me/preferences/appearance/` se conserva pero deja de gobernar la apariencia.
  *Fuente: `views.py:1901–1940`; catálogos en `design-system/customizer-catalog.md`.*
- **R-PREF-02** — WHEN el backend devuelve `400`, THEN el cliente SHALL propagar el
  mensaje por campo tal cual, sin reinterpretar. Para la ruta legacy, los mensajes
  literales son `Theme inválido`, `Palette inválida` y `Density inválido`.
  *Fuente: `views.py:1920`, `1926`, `1932`.*
- **R-PREF-03** — WHEN el usuario ajusta apariencia antes de tener sesión, THEN el cliente
  SHALL aplicar los defaults canónicos del Design System y SHALL NOT persistir nada
  para un usuario desconocido.

### 3.4 Cobertura funcional por recurso

Cada fila es un requisito de cobertura: la pantalla existe, usa el contrato real y no
asume capacidades no confirmadas. El detalle campo a campo de cada recurso vive en los
contratos por dominio indexados en [`backend-contracts.md`](./backend-contracts.md); la
trazabilidad operación por operación (`OP-*`) vive en
[`backend-inventory.md`](./backend-inventory.md).

| ID | Recurso | Contrato real | Pantalla / flujo | Criterio observable |
|---|---|---|---|---|
| R-RES-01 | `usuarios` | ModelViewSet + 9 `@action` | Listado con filtros client-side; ficha por persona | La tabla lista sólo personas del scope; acciones visibles según `permissions` |
| R-RES-02 | `armas` | ModelViewSet; escritura por `armory_code_write` / `calibre_code_write` | Almacén de armas | Crear arma con código de armería deriva `organization_unit` |
| R-RES-03 | `poligonos` | ModelViewSet + `lecciones` | Polígonos con lecciones anidadas | Ver lecciones de un polígono |
| R-RES-04 | `lecciones` | ModelViewSet + 6 `@action` | Ficha de lección con 5 pestañas | Fracciones, usuarios, resultados, resumen y reporte cargan por pestaña |
| R-RES-05 | `fracciones` | ModelViewSet + `tiradores` / `resultados` | Fracciones de la lección | Tiradores y armas de una fracción |
| R-RES-06 | `resultados` | ModelViewSet; reglas de unicidad | Captura de resultados por carril | Errores de unicidad visibles y por campo |
| R-RES-07 | `authz/roles` | ModelViewSet; lectura abierto, escritura `IsTenantAdmin` | Catálogo de roles | Roles de sistema bloqueados en sus permisos salvo `super_admin` |
| R-RES-08 | `authz/scopes` | ReadOnlyModelViewSet | Catálogo de scopes | Sin botón de escritura |
| R-RES-09 | `authz/overrides` | ModelViewSet `IsTenantAdmin` | Overrides por persona | Sólo cuentas del tenant |
| R-RES-10 | `organization-units` | ModelViewSet + `lookup` / `previsualizar-eliminacion` / `eliminar-con-migracion` | Árbol de unidades | Previsualización muestra los 8 contadores antes de eliminar |
| R-RES-11 | `recintos` | ModelViewSet + `agregar-unidad` / `quitar-unidad` | Recintos y sus unidades | Agregar/quitar unidad por código |
| R-RES-12 | `armorias` | ModelViewSet (`armory`) | Almacenes | `armas_count` visible |
| R-RES-13 | `posiciones` | ModelViewSet + `asignar-holder` / `quitar-holder` / `historico` | Puestos y holders | Historial muestra activos e históricos |
| R-RES-14 | `memberships` | ModelViewSet con `resource_name = position` | Pertenencias orgánicas | Alta exige `assign_positions`; baja exige `revoke_positions` |
| R-RES-15 | `calibres` | ModelViewSet; escritura sólo `super_admin` | Catálogo global de calibres | Edición bloqueada sin `super_admin` |
| R-RES-16 | `ejercicios` | ModelViewSet | Ejercicios militares con participantes | Unidades por código |
| R-RES-17 | `consumos-municion` | ModelViewSet | Consumos por ejercicio | Calibre por código |
| R-RES-18 | `consumos-arma` | ModelViewSet | Consumos de arma | Enlace consumo ↔ arma |
| R-RES-19 | `authz/permissions` | ReadOnlyModelViewSet | Matriz de permisos | Sólo lectura |
| R-RES-20 | `authz/role-permissions` | ModelViewSet `IsTenantAdmin` | Matriz rol → permiso | Rol de sistema sólo `super_admin` |
| R-RES-21 | `authz/position-permissions` | ModelViewSet `IsTenantAdmin` | Matriz puesto → permiso | Filtrado por tenant |

- **R-RES-22** — WHEN el usuario consulta listados, THEN el cliente SHALL resolver
  búsqueda, orden y selección sobre el array plano devuelto. *Fuente:
  `REST_FRAMEWORK` en `settings.py:156–172` no define paginación por defecto y los
  `DefaultRouter` no añaden paginación.*
- **R-RES-23** — WHEN un valor no existe, THEN la celda SHALL mostrar `—`; WHEN el
  conjunto está vacío, THEN la vista SHALL mostrar estado vacío; WHEN hay error, THEN
  SHALL mostrar error explícito. Nunca `0` inventado.
- **R-RES-24** — WHEN la acción es destructiva, THEN el cliente SHALL pedir confirmación
  y SHALL mostrar el mensaje exacto del backend.
- **R-RES-25** — WHEN el usuario navega, THEN el menú SHALL agrupar por dominios
  (organización, personas, autorización, almacén, tiro, ejercicios, auditoría) y cada
  entrada SHALL estar condicionada por el permiso del recurso y la presencia del dato
  de contexto. La estructura del menú es deducible del alcance completo de §3.4 y no
  requiere una decisión adicional del operador. *Fuente: cobertura completa en §3.4;
  tabla canónica del menú en `experience/navigation.md`.*

### 3.4.1 Volúmenes por dominio y pantallas

Los requisitos de interfaz de cada familia (`R-DOM-*`, con su detalle campo a campo) y
sus pantallas viven en volúmenes anidados; esta tabla es el puntero y no duplica sus
contenidos.

| Familia de dominio | Volumen de requisitos | Volumen de pantallas |
|---|---|---|
| Organización (unidades, recintos) | [`requirements/organization.md`](./requirements/organization.md) | [`experience/screens/organization.md`](./experience/screens/organization.md) |
| Identidad y autorización (usuarios, puestos, membresías, RBAC, overrides, auditoría) | [`requirements/identity-authorization.md`](./requirements/identity-authorization.md) | [`experience/screens/identity.md`](./experience/screens/identity.md), [`experience/screens/authorization.md`](./experience/screens/authorization.md) |
| Armería, armas y calibres | [`requirements/armory.md`](./requirements/armory.md) | [`experience/screens/armory.md`](./experience/screens/armory.md) |
| Tiro (polígonos, lecciones, fracciones, resultados) | [`requirements/shooting.md`](./requirements/shooting.md) | [`experience/screens/shooting.md`](./experience/screens/shooting.md) |
| Ejercicios y consumos | [`requirements/exercises-consumption.md`](./requirements/exercises-consumption.md) | [`experience/screens/exercises.md`](./experience/screens/exercises.md) |
| Sesión y datos compartidos (auth, contexto, recuperación) | [`requirements/shared-session-data.md`](./requirements/shared-session-data.md) — **en entrega por writer activo**; su contenido no está verificado en esta integración. Referencia vigente mientras tanto: §3.1–§3.3 de este documento | [`experience/screens/access-context.md`](./experience/screens/access-context.md) |
| Apariencia (personalizador de 8 ejes) | [`requirements/appearance.md`](./requirements/appearance.md) — **en entrega por writer activo**; su contenido no está verificado en esta integración. Referencia vigente mientras tanto: §6 de este documento | [`experience/screens/appearance.md`](./experience/screens/appearance.md) |

- La asignación canónica de las **162 `OP-*`** del inventario a las **36 pantallas
  `SCREEN-*`** vive en [`experience/screens.md`](./experience/screens.md) §Cobertura
  OP → SCREEN.
- Las rutas consolidadas (fijadas + propuestas), el menú, los guards ampliados, los
  breadcrumbs y los flujos de sesión en navegación viven en
  [`experience/navigation.md`](./experience/navigation.md). Las propuestas de rutas
  nuevas **sólo** viven allí; ningún otro volumen abre un router paralelo (D-07).
- Los flujos y estados transversales de experiencia están **en entrega por writer
  activo** (`experience/flows.md`, `experience/flows/`, `experience/states.md`); esta
  integración no los lee ni afirma su contenido.

### 3.5 Reglas de negocio que la UI debe respetar

- **R-RUL-01** — Ningún recurso envía `tenant` ni `organization_unit` en escritura: el
  cliente los recibe por `read_only` y los inyecta el servidor
  (`apipoligono/mixins.py:34–48`).
- **R-RUL-02** — Las relaciones opcionales se escriben **por código**
  (`*_code_write`), nunca por id, salvo `Position`, `UnitMembership`, `ConsumoArma` y
  `FraccionTiro.id_leccion`, cuyos campos son la FK directa.
- **R-RUL-03** — WHEN un resultado ya existe para `(id_fraccion, id_usuario)`,
  `(id_fraccion, id_arma)` o `(id_fraccion, numero_carril)`, THEN el backend devuelve
  error y el cliente SHALL mostrarlo asociado al campo, sin ofrecer alta duplicada.
  *Fuente: `ResultadoTiroSerializer`, `serializers.py:292–330`; constraints en
  `models.py:176–194`.*
- **R-RUL-04** — WHEN la actualización de un arma envía `armory_code_write` vacío o
  `null`, el backend responde `400` con `armory_code_write: 'El arma debe pertenecer a
  una armoria.'`. *Fuente: `serializers.py:172–180`.*
- **R-RUL-05** — WHEN se crea una lección sin `unidades_participantes_codes_write`, el
  backend usa la unidad inyectada por el mixin; la UI SHALL mostrar ese valor efectivo
  tras crear. *Fuente: `serializers.py:246–258`.*
- **R-RUL-06** — WHEN se crea un usuario **formal** cuyo RUT coincide con un
  `Usuario(is_temporary=True)` existente, `perform_create` **promueve** el temporal: lo
  actualiza, limpia `is_temporary`, restablece `username` y contraseña temporal, y NO
  duplica. La UI SHALL advertirlo **antes** del alta formal.
  *La dirección es inequívoca: la promoción ocurre al crear la cuenta FORMAL a partir
  de un TEMPORAL existente, no al revés. `crear-temporal` devuelve `400` si el RUT ya
  existe como temporal o formal (`views.py:554–559`), por lo que el alta de un temporal
  jamás promueve a formal. Fuente: `views.py:230–257`, `models.py:42–48`.*
- **R-RUL-07** — WHEN un usuario cambia su propia contraseña sin `must_change_password`,
  el backend exige `old_password`; en flujo forzado no lo exige. La UI SHALL reflejar
  exactamente esa distinción. *Fuente: `views.py:626–634`.*
- **R-RUL-08** — WHEN se resetea la contraseña de otro, el usuario queda con
  `must_change_password = true` y `password_changed_at = null`; el reseteo sobre uno
  mismo devuelve `400`. *Fuente: `views.py:653–674`.*
- **R-RUL-09** — WHEN se elimina una unidad sin `target_unit_code`, el destino es su
  padre; si no tiene padre, es `400` con `La unidad no tiene padre. Indica
  target_unit_code para migrar.`. La UI SHALL exigir destino explícito en ese caso.
  *Fuente: `apps/organizations/views.py:112–133`.*
- **R-RUL-10** — WHEN se elimina una unidad, los `Assignment` **no** se migran: el
  conteo se informa en `moved.assignments` y el resto sí se actualiza en bloque. La UI
  SHALL mostrarlo y no prometer migración de puestos. *Fuente:
  `apps/organizations/views.py:145–175`.*
- **R-RUL-11** — WHEN se consulta detalle de resultados por lección o por fracción, el
  backend escribe en `AccessAudit` y puede responder `403` con
  `Su alcance no permite ver resultados detallados.`. La UI SHALL diferenciar
  "sin permiso de detalle" de "sin resultados". *Fuente: `views.py:834–855`,
  `1201–1222`.*
- **R-RUL-12** — WHEN se desactivan o quitan asignaciones hasta dejar cero, el backend
  recrea el rol implícito `tirador`; la UI SHALL advertirlo. *Fuente: `views.py:418–425`,
  `526–528`.*
- **R-RUL-13** — WHEN un tirador puro consulta lecciones o resultados, el backend limita
  a lecciones donde su unidad participa o donde tiene resultado propio, y a sus propios
  resultados. La UI SHALL rotular el alcance como restringido, no como lista completa.
  *Fuente: `views.py:784–797`, `1263–1270`.*

## 4. Requisitos de datos

- **R-DAT-01** — El cliente SHALL obtener todos sus datos del backend real. Prohibidos
  fixtures, mocks, seeds, demos, KPI sintéticos y fallbacks simulados.
- **R-DAT-02** — Las métricas SHALL derivarse matemáticamente de los datos reales
  entregados por el backend, nunca estimadas.
- **R-DAT-03** — WHEN la respuesta de `lecciones/{id}/reporte` trae
  `aggregate_only: true`, THEN la UI SHALL mostrar `resumen`, `por_fraccion` y
  `por_unidad`, y SHALL NOT intentar `por_tirador` ni `por_arma`. **`aggregate_only` es
  un indicador de la respuesta de reporte, no un rol ni un permiso**: lo emite
  `can_read_detail(account) == false` (`views.py:1050–1065`, helper en
  `apps/authorization/scope.py:196–202`).
- **R-DAT-04** — Ninguna vista SHALL presentar la métrica de una lección como total de la
  institución. Cada cifra SHALL rotularse con su lección y fecha.
- **R-DAT-05** — El cliente SHALL NOT persistir credenciales ni PII en cliente
  (`localStorage`, `sessionStorage`, cookies de estado o rehidratación).
  *Fuente: `front/AGENTS.md:21–22`.*
- **R-DAT-06** — El cliente SHALL NOT incluir PII real (RUT, nombres, correos) en
  artefactos, capturas, logs o mensajes de error persistidos.
- **R-DAT-07** — WHEN una respuesta incluye códigos, choices o literales de contrato del
  backend (por ejemplo `TIPO_ARMA_CHOICES`, `UNIT_TYPE_CHOICES`, `tipo_tiro`,
  `scope_code`, `role_code`, `allowed`), THEN el cliente MAY mostrarlos literalmente:
  son valores contractuales del backend, no datos ficticios. Esta cláusula delimita lo
  permitido de lo prohibido en R-DAT-01.

## 5. Requisitos visuales — Inume Design System

- **R-DS-01** — Toda superficie de UI SHALL traducir 1:1 los valores CSS del Design
  System externo (padding, border, color, height, shadow, estados `hover`, anatomía),
  sin reinterpretar. Reproducir el CSS pertinente localmente es la forma esperada de
  cumplir; no se importa el paquete externo.
  *Fuente: `AGENTS.md:5–21`, `front/AGENTS.md:26–30`.*
- **R-DS-02** — WHEN un componente se implementa, THEN la referencia DS es explícita y
  citable por nombre de archivo dentro de `../../Inume Design System/`:
  `index.html`, `auth-signin.html`, `auth-password.html`, `forms-basic.html`,
  `forms-validation.html`, `tables-basic.html`, `tables-gridjs.html`, `ui-card.html`,
  `ui-badge.html`, `ui-modal.html`, `ui-toasts.html`, `ui-tabs.html`, `charts.html` y
  `assets/css/`. Los 46 archivos de la biblioteca fueron enumerados en esta revisión.
- **R-DS-03** — La carpeta interna `Inume Design System/` del repositorio SHALL NOT
  usarse como fuente. La fuente es la biblioteca externa `../../Inume Design System/`.
  *Fuente: `AGENTS.md:11`, `front/AGENTS.md:24`.*
- **R-DS-04** — La comparación visual contra el DS SHALL quedar registrada como
  **pendiente de autorización**, con criterio final observable en
  `verification.md` §4.7 (V-70). Pendiente no significa «siempre pendiente»: se cierra
  con orden explícita del operador.
- **R-DS-05** — WHEN se transpose CSS del DS, THEN los valores SHALL copiarse de
  `../../Inume Design System/assets/css/` y de `DESIGN.md`, nunca de la copia interna
  ni de memoria. *Fuente: `AGENTS.md:16–18` (interpretar está prohibido).*

## 6. Personalizador completo del Design System, persistido por usuario

El backend persiste hoy **tres** dimensiones legacy (`apipoligono/models.py:20–36`):

| Dimensión backend | Valores reales | Tipo | Fuente |
|---|---|---|---|
| `theme` | `nexus-light`, `nexus-dark` | CharField(20) | `models.py:20–23`, validado en `views.py:1917` |
| `palette` | `corporate-blue`, `military-teal`, `neutral-slate` | CharField(20) | `models.py:24–28`, validado en `views.py:1923` |
| `density` | `comfortable`, `compact` | CharField(20) | `models.py:29–32`, validado en `views.py:1929` |

**Ninguna de las tres gobierna la apariencia visible del producto.** El Design System
expone **ocho** ejes —`data-theme`, `data-accent`, `data-bg`, `data-font`, `data-radius`,
`data-iconfam`, `data-ambient`, `data-ambcolor`— y el operador ordenó que **todas** las
opciones del personalizador se persistan por usuario. `palette` y `density` no tienen
correspondencia en la fuente: no se traducen, no se reinterpretan y no se ofrecen como
control. El Design System **no tiene eje de densidad**; `data-radius` gobierna esquinas.

Los campos legacy quedan **intactos y sin uso visual**: no se borran, no se migran, no
se convierten. El cliente deja de escribir `palette` y `density`, y la ruta heredada
`GET|PUT /api/me/preferences/appearance/` permanece sin tocar.

- **R-APP-01** — El cliente SHALL exponer un personalizador con los **ocho** ejes del
  Design System, con el catálogo y los defaults exactos de
  [`design-system/customizer-catalog.md`](./design-system/customizer-catalog.md)
  (resumen de conteos y reset en `technical-design.md` §6.3), y sin ninguna opción
  adicional, renombrada u omitida.
- **R-APP-02** — WHEN el usuario selecciona un valor de cualquier eje, THEN el cliente
  SHALL escribir el atributo `data-*` correspondiente en `<html>` de inmediato (vista
  previa sin esperar al backend) y SHALL diferir la escritura al backend con
  autosave (`technical-design.md` §6.5).
- **R-APP-03** — El panel SHALL ofrecer, por eje, los mismos selectores, muestra o
  miniatura y affordances del panel original del Design System, incluidos el botón de
  reset a defaults, el toggle de tema, la operación por teclado (flechas, `Home`, `End`,
  tabindex rotatorio) y el estado de guardado visible.
  *Fuente: `theme-customizer.js:724–856`, `:880–900`, `app.js:116–155`.*
- **R-APP-04** — WHEN un eje tiene una cascada base en la fuente (los ejes y valores
  enumerados en la tabla canónica de
  [`design-system/customizer-catalog.md`](./design-system/customizer-catalog.md)
  §Atributos y reset —entre ellos `radius = soft` e `iconfam = default`), THEN el
  cliente SHALL reproducir la semántica exacta de la fuente —atributo ausente en lugar
  de atributo escrito— y SHALL NOT alterar el valor de los 10 tokens de radio.
  *Fuente: `theme-customizer.js:454–465`; tabla canónica por eje en
  `design-system/customizer-catalog.md`.*
- **R-APP-05** — El cliente SHALL NOT reescribir radios, espaciados o grosores de borde
  para simular densidad, ni introducir valores que el Design System no tenga.
  *Fuente: `AGENTS.md:16` — reinterpretar está prohibido.*
- **R-APP-06** — WHEN el usuario cierra sesión o cambia de principal, THEN el cliente
  SHALL abortar las escrituras en vuelo, descartar las respuestas tardías, vaciar la cola
  pendiente y restablecer los defaults. WHEN el usuario cambia de unidad activa, THEN
  las preferencias SHALL conservarse. *Fuente: `requirements.md` R-AUTH-08, R-AUTH-09.*
- **R-APP-07** — WHEN se restaura la sesión (login nuevo o recarga), THEN el cliente
  SHALL resolver las preferencias del usuario **antes** de quedar listo, para no pintar
  la apariencia de otro. En modo público el cliente SHALL aplicar los defaults sin
  consultar ni persistir nada.
- **R-APP-08** — WHEN la familia de iconos cambia, THEN SHALL remapearse la colección
  propia del producto junto a los 44 conceptos del Design System, de forma idempotente
  en cualquier dirección. *Fuente: `theme-customizer.js:235–280`, `:313`.*
- **R-APP-09** — WHEN el usuario elige una tipografía, THEN SHALL cargarse bajo demanda
  la URL original del Design System para esa familia, sin duplicar el `<link>`. WHEN el
  usuario elige la familia `fa7-solid`, THEN el panel SHALL conservar la atribución de
  licencia tal como la incluye el Design System. *Fuente:
  `theme-customizer.js:83–92`, `:698–708`, `:217`.*

### 6.1 Contrato de preferencias por usuario

Ruta nueva, documentada en `technical-design.md` §5.3:
`/api/me/preferences/appearance/design-system/` con `GET`, `PUT` y `DELETE`.

- **R-APP-10** — WHEN el cliente autenticado inicia sesión o recarga, THEN SHALL leer
  los ocho ejes con `GET` y SHALL NOT escribir preferencias de apariencia en
  `localStorage`, `sessionStorage` ni cookies. La persistencia del Design System original
  en `localStorage` queda sustituida por memoria más backend. *Fuente:
  `theme-customizer.js:54`, `:409`; `R-DAT-05`.*
- **R-APP-11** — WHEN el cliente persiste, THEN SHALL enviar exactamente los ocho campos,
  ninguno nulo y dentro del enum de su eje, y SHALL recibir de vuelta el objeto canónico
  persistido.
- **R-APP-12** — WHEN el usuario restablece, THEN el cliente SHALL emitir `DELETE`, que
  devuelve los ocho ejes a sus defaults en una sola escritura idempotente y responde sin
  cuerpo, sin borrar el usuario ni la sesión.
- **R-APP-13** — WHEN la API responde `400`, THEN el cliente SHALL mostrar el error por
  campo tal como lo devuelve el backend. WHEN responde `403`, THEN el cliente SHALL
  diferenciar "sesión o CSRF inválido" de "sin permiso" por contexto y SHALL NOT cerrar
  sesión automáticamente ante un `403` de preferencias.

## 6.2 Navegación con Vue Router

- **R-ROUTER-01** — El cliente SHALL usar **`vue-router@5.3.1`** como dependencia
  obligatoria, creada con `createRouter` y `createWebHistory`. La navegación por hash
  manual del borrador anterior queda derogada.
  *Fuente: `registry.npmjs.org/vue-router/latest` = `5.3.1` (2026-10-01), peer
  `vue ^3.5.34 || ^4.0.0` compatível con la `vue@3.5.43` declarada; peers opcionales
  `vite ^7.3.0 || ^8.0.0` y `pinia ^3.0.4 || ^4.0.2` satisfacen el manifiesto actual.*
- **R-ROUTER-02** — Las pantallas SHALL declararse como rutas con `RouterView` como punto
  de montaje, `RouterLink` para navegación y `useRoute` / `useRouter` para leer
  parámetros y navegar. Los identificadores de recurso SHALL viajar como parámetros de
  ruta, no en el query.
- **R-ROUTER-03** — WHEN el usuario recarga una URL directa o usa back/forward, THEN la
  app SHALL reconstruir la pantalla correspondiente, no sólo la raíz. La entrada directa
  a una ruta de detalle SHALL funcionar tras autenticar.
- **R-ROUTER-04** — WHEN no hay contexto de sesión, THEN el guard global SHALL llevar al
  login y preservar el destino original para volver a él tras autenticar.
- **R-ROUTER-05** — WHEN el usuario tiene `must_change_password`, THEN el guard SHALL
  bloquear toda ruta operativa salvo el cambio forzado y el login.
- **R-ROUTER-06** — Los guards SHALL esperar a que el contexto de sesión termine de
  cargar antes de decidir, para que una recarga profunda no expulse al usuario ni resuelva
  contra un contexto vacío.
- **R-ROUTER-07** — WHEN una ruta exige tenant y el contexto no lo tiene, THEN la app
  SHALL mostrar el estado de contexto perdido sin reintento en bucle.
- **R-ROUTER-08** — WHEN no existe ruta para la URL solicitada, THEN la app SHALL
  mostrar la pantalla 404 del Design System, no una vista en blanco.

## 6.3 Bootstrap de contexto en el login

- **R-LOGIN-01** — WHEN el usuario inicia sesión, THEN el cliente SHALL capturar la
  institución real (**tenant**) que corresponde a la cuenta, como parte del propio flujo
  de login junto a la selección de unidad, sin inventar un endpoint de bootstrap, sin
  pedir una lista de tenants al backend y sin hardcodear un código de demostración.
  *Decisión del orquestador: reutilizar el campo de institución ya existente en el
  formulario de login real.*

## 7. Out of Scope

- Modificar backend, schema, migraciones o base de datos **salvo** el alcance de
  preferencias de apariencia declarado en §6 y `technical-design.md` §5: ocho campos en
  `Usuario`, una migración y una ruta de preferencias. Cualquier otro cambio de backend
  queda fuera.
- Crear endpoints, permisos, roles o tenants nuevos, salvo esa ruta de preferencias.
- Instalar o descargar `vue-router` u otra dependencia: es fase de implementación, no
  de diseño. La spec declara la versión requerida, no la instala.
- Persistencia de apariencia en el navegador, mocks, datos de demostración y registros
  sintéticos.
- Exportación en servidor, transferencia de stock, validación de resultados, edición de
  datos propios, comandantes de unidad e historial global de asignaciones: **no existen
  como endpoints** (ver §8).
- Respaldos, snapshots, despliegue y medidas de conservación de producción.
- Pruebas de escritura sobre base de datos real, ejecución de la app, navegador, lint,
  build, typecheck o tests: requieren orden explícita del operador. Lo mismo aplica a la
  migración JS → TS del baseline y a la instalación de tooling de tipos (D-08).
- `AGENTS.md`, `front/AGENTS.md` y cualquier documento fuera de esta carpeta.

## 8. Capacidades mencionadas sin endpoint

| Capacidad | ¿Cubrible con endpoints existentes? | Decisión |
|---|---|---|
| Jerarquía de unidades | Sí, client-side vía `parent` / `parent_code` | Se implementa en cliente |
| Tiradores sin cuenta formal | Sí, vía `ResultadoTiro` + `usuarios/crear-temporal` | Se implementa |
| Transferencia de stock entre armerías | **No** — no hay acción de movimiento; `transfer_warehouse_material` es permiso sin endpoint | D-02 |
| Validar resultados de una lección | **No** — no hay acción `validar`; `validate_scores` es permiso sin endpoint | D-02 |
| Exportación en servidor (CSV/PDF/XLSX) | **No** — `export` es acción de permiso y no hay endpoint | D-02 |
| Editar los propios datos | **No** — no hay acción `edit_self` expuesta | D-02 |
| Comandantes de unidad | **No** — no hay endpoint | D-02 |
| Historial global de asignaciones | Parcial — sólo `posiciones/{id}/historico` por puesto | D-02 |
| Editar el catálogo de permisos | **No** — `PermissionViewSet` es ReadOnly | D-02 |

## 9. Huellas de backend con impacto en la UI

Se documentan como hechos observados, sin modificar el backend.

| ID | Hecho | Impacto en la UI |
|---|---|---|
| B-01 | `apipoligono/views.py:880` invoca `primary_unit(usuario)`, función definida **dentro** de `reporte` en `views.py:954`. En `resultados` no existe tal definición en el ámbito local. | **Sospecha de `NameError`, no comprobada en runtime** (no se ejecutó el servidor por autorización). Si se confirma, `lecciones/{id}/resultados` fallaría. La UI trata el fallo como error explícito y **no** sustituye el detalle solicitado por un resumen: son dos pantallas independientes. `resultados-resumen` y `reporte` no dependen de ese símbolo. |
| B-02 | **Retirado.** La ruta `../../Inume Design System/` resuelve correctamente desde la raíz del repositorio y su contenido fue leído en esta revisión (46 entradas). | Ninguno. No se pide ruta al operador. |
| B-03 | `CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS` por defecto incluyen `localhost:5173`, mientras `front/vite.config.js` fija `port: 5175`. | **Escenario no verificado y no bloqueante**: con el proxy de Vite configurado (`/api → http://127.0.0.1:8000`) las peticiones son same-origin y CORS/CSRF no aplican. Sólo sería cross-origin si el cliente se sirviera en otro origen. No se modifica `.env` ni configuración; queda como observación condicionada al modo de despliegue. |
| B-04 | El proveedor de base de datos del entorno de ejecución **no está confirmado**: no se leyó `.env` ni se abrió ninguna conexión en esta revisión. | El diseño de migración es ORM y no depende del motor. No se redacta SQL específico ni procedimiento de producción. |

## 10. Bloqueos de alcance

| ID | Bloqueo | Impacto | Tratamiento |
|---|---|---|---|
| L-01 | Aprobación de la spec: `status` era `draft` — **cumplido el 2026-10-02** (`status: approved`, `spec-meta.yaml`:7) | Ninguna tarea era ejecutable sin la aprobación | La ejecución vigente se rige por [`completion-plan-2026-10-14.md`](completion-plan-2026-10-14.md) (aprobado el 2026-10-14, `in-progress`; verificado 2026-10-15) |
| L-02 | Autorización de ejecución (servidor, navegador, tests, base de datos) | Ningún criterio observable es verificable hoy | Ver `verification.md` §3 |

No hay bloqueos técnicos que impidan construir el producto una vez aprobada la spec.

## 11. Discrepancias detectadas contra la documentación existente

| ID | Documento | Afirmación | Código real |
|---|---|---|---|
| X-01 | `docs/12_GUIA_FRONTEND.md:14` | el contexto retorna `permission_codes` | `apipoligono/views.py:1471` retorna `permissions` |
| X-02 | `docs/12_GUIA_FRONTEND.md` (ejemplos) | recomienda Axios con `VITE_API_URL` | `front/package.json` no incluye axios; el cliente usa `fetch` con `/api` por proxy Vite |
| X-03 | `docs/12_GUIA_FRONTEND.md` (recuperación) | el paso final usa dígito verificador | `recuperacion_utilidades.py:107–110` usa `{ rut, codigo, nueva_contrasena }` |

Las tres se resuelven a favor del código. La corrección de esas guías está fuera del
`IN_SCOPE` de esta spec y se reporta al orquestador.

## 12. Decisiones

| ID | Decisión | Estado | Fundamento |
|---|---|---|---|
| D-01 | Correspondencia `palette` y `density` a ejes del Design System | **Retirada** | El operador ordenó persistir las ocho opciones del personalizador del Design System. `palette` y `density` no tienen eje en la fuente, no se traducen, no se reinterpretan y sus campos quedan intactos y sin uso visual. Reemplazada por el diseño de §6 y `technical-design.md` §5–6 |
| D-02 | Amplitud de backend para las capacidades de §8 | **Abierta, sin cambio** | Cambio de backend ajeno a preferencias; fuera de alcance explícito |
| D-03 | Tenant inicial del cliente | **Resuelta** | Selección manual de la institución real como parte del login (`R-LOGIN-01`). No se inventa endpoint, no se pide lista de tenants al backend, no se hardcodea código de demostración |
| D-04 | Uso de los 4 endpoints de soporte de authz en pantallas concretas | **Resuelta** | Mapeados en `technical-design.md` §8 |
| D-05 | Mecanismo de navegación | **Resuelta** | `vue-router@5.3.1` con `createWebHistory` es obligatorio (`R-ROUTER-01`..`R-ROUTER-08`). El hash manual queda derogado |
| D-06 | Persistencia de la apariencia del Design System | **Resuelta** | Ocho campos en `Usuario` y una ruta de preferencias propias; la persistencia en `localStorage` del DS se sustituye por memoria más backend (§6, `R-APP-10`..`R-APP-13`) |
| D-07 | Fuentes canónicas de los volúmenes de la spec | **Resuelta** | Cada materia tiene un único tomo canónico y los documentos raíz delegan en él: catálogo de ejes y semántica de atributos del personalizador → `design-system/customizer-catalog.md`; rutas consolidadas, menú, guards y breadcrumbs → `experience/navigation.md`; catálogo de pantallas y cobertura OP → SCREEN → `experience/screens.md`; contratos campo a campo → `contracts/` vía `backend-contracts.md`; inventario de operaciones → `backend-inventory.md`. Las propuestas de rutas nuevas sólo viven en `navigation.md`; ningún otro volumen abre un router paralelo |
| D-08 | Lenguaje del código objetivo del cliente | **Resuelta** | Orden explícita del operador del **2026-10-02**: «se tiene que usar TS, no JS». **TypeScript es obligatorio** para el código objetivo: SFC con `<script setup lang="ts">` y módulos `.ts` para router, HTTP, stores y composables cuando sean realmente propuestos. Las reglas previas «JavaScript, no TypeScript» (`AGENTS.md` §Cliente, `front/AGENTS.md` §Stack, `technical-design.md` §1 y §13) quedan **derogadas (superseded)** y ya fueron sincronizadas. **Hechos conservados:** el kit externo del Design System sigue siendo HTML/CSS/JS como fuente de referencia y no se sustituye por tipos ni se importa. El baseline de `front/src/` quedó **superado** como estado: hoy está en **TypeScript** (38 `.vue` con `lang="ts"`, 34 `.ts`, 0 `.js`; verificado 2026-10-15) y la migración de facto se ejecutó (§7). Una futura comprobación de tipos puede diseñarse como apoyo de verificación, pero un typecheck satisfactorio **no acredita por sí solo** el resultado observable de usuario (`verification.md` permanece como fuente de criterios) |

> Sólo **D-02** permanece abierta, y no bloquea la construcción del alcance declarado.