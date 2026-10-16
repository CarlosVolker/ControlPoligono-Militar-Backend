---
spec_meta: "../spec-meta.yaml"
---

# Tasks — Apariencia: personalizador de 8 ejes y backend gateado (T-FL-APP, T-BE-APP)

> 📜 Yo registro aquí las ocho tareas de apariencia más las seis tareas de backend de la
> excepción acotada. La API de
> ocho ejes `GET|PUT|DELETE /api/me/preferences/appearance/design-system/` fue una ruta
> **propuesta** en `technical-design.md` §5.3 y **hoy existe y está consumida** (ocho
> campos `ds_*` en `apipoligono/models.py:152-159`, migración
> `0021_design_system_preferences` y rutas `apipoligono/urls.py:85-86`; verificado
> 2026-10-15): la excepción acotada de backend ya se ejecutó. Lo que la ruta legacy
> OP-PRF-001/002 hace hoy se documenta **separado** en T-FL-APP-008: las dos APIs no se
> mezclan, no se traducen ni se migran entre sí (R-APAR-002/003). Índice y reglas:
> [../tasks.md](../tasks.md). La spec está **`approved`** desde el 2026-10-02 y la
> ejecución vigente se rige por [../completion-plan-2026-10-14.md](../completion-plan-2026-10-14.md)
> (aprobado el 2026-10-14, `in-progress`; verificado 2026-10-15). La paridad de render en
> estados completos sigue `NOT_VERIFIED` (T8/T9).

## Reglas de la familia

1. **La persistencia por usuario de los 8 ejes es obligatoria para el cierre del
   frontend entero.** Declarar el hueco (la ruta de 8 ejes ya existe y la persistencia por
   usuario está ejecutada; verificado 2026-10-15) **no** lo
   cumple: lo reporta y lo acompaña de las tareas gateadas T-BE-APP-01…06, única vía
   autorizada de cierre. Un cierre que exhiba defaults en memoria sin persistencia real
   es un cierre falso y se rechaza.
2. **D-02 no autoriza features.** Las capacidades sin endpoint del inventario
   (transferencia de stock, validación, exportación, `edit_self`, comandantes, historial
   global, edición del catálogo de permisos) no generan tarea, botón ni pantalla; la
   excepción de backend de esta familia es **sólo** la diseñada en `technical-design.md`
   §5 (R-APAR-004): ocho campos `ds_*`, una migración y un endpoint propio del usuario
   autenticado — nada más.
3. **Separación estricta.** Apariencia futura (8 ejes) y legacy PRF (`theme`, `palette`,
   `density`) son superficies separadas: `palette` y `density` **no tienen eje** en el
   DS, no se traducen ni se ofrecen como control; la ruta legacy no se renombra, no se
   redirige ni se extiende.
4. **Sin persistencia de navegador.** Prohibidas `localStorage`, `sessionStorage`,
   cookies de estado, hash de URL y claves manuales para apariencia (R-APAR-007): la
   persistencia del mockup externo del DS **no** se traslada.
5. **Catálogos y defaults: SSOT única** [../design-system/customizer-catalog.md](../design-system/customizer-catalog.md)
   (27 acentos, 26 fondos, 9 tipografías, 3 radios, 7 familias de iconos, 8 ambientes,
   7 colores de ambiente; defaults `dark, mint, command, ibm-plex, square, phosphor,
   embers, accent`; semántica de presencia/ausencia de atributo; discrepancia de los 19
   vs 26 fondos registrada a favor de los 26 ejecutables). Ninguna tarea copia ni reduce
   los catálogos.

## Bloque común de tareas T-FL-APP

- **Dependencias comunes:** T-CORE-TYPES (tipos de los 8 ejes), T-CORE-HTTP (regla
  especial: `403` en rutas de preferencias **nunca** cierra sesión automáticamente,
  R-SES-012), T-CORE-SESSION (ciclo de vida del principal), T-CORE-ROUTER
  (`/personalizador`), T-CORE-UI (capa `theme-customizer.css` transcrita).
- **Archivos probables** (raíz `front/src/`): `api/appearance.ts` (ruta propuesta),
  `api/appearance-legacy.ts` (OP-PRF), `stores/appearance.ts` (`saveState ∈ {idle,
  dirty, saving, saved, error}`), `views/personalizador/PersonalizerView.vue`,
  `components/appearance/*` (panel, radiogroups, toggle de tema),
  `composables/useThemeApply.ts`. Todos con `<script setup lang="ts">`.
- **Gates:** T-FL-APP-001…004 consumen la ruta de 8 ejes, **hoy existente y consumida**
  (verificado 2026-10-15); su ejecución se rige por el plan de cierre (spec aprobada +
  gate superado + orden explícita del operador). T-FL-APP-005/006/007 son de conducta local y no requieren el backend;
  aun así su ejecución requiere la autorización general.

---

## T-FL-APP-001 — Restauración de apariencia antes de ready

| Campo | Valor |
|---|---|
| Objetivo | Resolver las preferencias del usuario con el `GET` de la ruta propuesta **antes** de que la app quede `ready`, y escribir los ocho atributos `data-*` en `<html>` antes del primer pintado de la superficie autenticada: sin parpadeo desde defaults y sin pintar jamás la apariencia de otro usuario. |
| Flujo | [FL-APP-001](../experience/flows/appearance.md#fl-app-001--restauración-antes-de-ready) |
| OP | Ruta de 8 ejes §5.3 (`GET`) — **existe** (verificado 2026-10-15); criterio AC-FL. |
| SCREEN | Ninguna visible (ocurre durante el arranque); habilita [SCREEN-PERSONALIZER](../experience/screens/appearance.md#screen-personalizer--personalizador-de-8-ejes) y toda superficie autenticada. |
| Requisitos | R-APAR-011 (restauración antes de `ready`); R-APAR-001 (ruta de 8 ejes: ya existe y la persistencia por usuario está ejecutada, verificado 2026-10-15; sin parche de almacenamiento local); R-APAR-009 (semántica de presencia/ausencia al aplicar). |
| Precondiciones / dependencias | T-BE-APP-01…06 (gate); T-FL-SES-001/002 (sesión resuelta); T-CORE-SESSION. |
| Archivos probables | `api/appearance.ts`, `stores/appearance.ts`, gancho de arranque en `main.ts`. |
| Gates | Ejecutable contra la ruta de 8 ejes, ya implementada y consumida (verificado 2026-10-15); **sin** `localStorage` ni defaults persistidos de facto. |
| Done when | La primera superficie autenticada ya muestra los ocho ejes del usuario; una recarga posterior devuelve los mismos valores persistidos. |

**Criterios (ruta propuesta ⇒ AC-FL).**

- **AC-FL-APP-001:** el `GET` (con sesión; `X-Tenant-Code` no obligatorio en esta ruta)
  devuelve el objeto de 8 ejes con defaults canónicos para cualquier valor ausente; los
  ocho atributos se escriben en `<html>` **antes** de `ready` con la semántica de
  presencia/ausencia del catálogo SSOT; error de lectura ⇒ T-FL-APP-004 (estado local
  intacto y UI en error, **nunca** «guardar los defaults»); `403` ⇒ T-FL-APP-004 sin
  cierre de sesión; red ⇒ F-06 sin defaults aplicados por cuenta propia.

---

## T-FL-APP-002 — Cambio de eje: preview y autosave

| Campo | Valor |
|---|---|
| Objetivo | El panel `/personalizador` con la anatomía original del DS: ocho ejes con sus selectores, muestras/miniaturas, toggle de tema y botón de reset; preview inmediata (atributo escrito en el acto) y autosave diferido con debounce, una sola petición en vuelo por principal, última instantánea pendiente y marca `saved` sólo por instantánea vigente; radiogroups con teclado completo; efectos de eje (remapeo de iconos, tipografías bajo demanda, atribución de licencia, evento de tema). |
| Flujo | [FL-APP-002](../experience/flows/appearance.md#fl-app-002--cambio-de-eje-preview-y-autosave) |
| OP | Ruta de 8 ejes §5.3 (`PUT`) — **existe** (verificado 2026-10-15); criterio AC-FL. |
| SCREEN | [SCREEN-PERSONALIZER](../experience/screens/appearance.md#screen-personalizer--personalizador-de-8-ejes) — DS `index.html`:478–530 + `buildExtendedUI()` de `theme-customizer.js` |
| Requisitos | R-APAR-005 (ocho ejes con catálogos y defaults SSOT; la variante `orbit` no existe y no se ofrece); R-APAR-006 (PUT exacto de ocho campos, ninguno nulo, sin campos extra); R-APAR-007 (memoria + backend, nunca storage); R-APAR-008/009 (preview inmediata; semántica exacta: `bg=neutral`, `font=play`, `radius=soft`, `iconfam=default`, `ambcolor=accent` **eliminan** el atributo; `accent` y `ambient` se escriben siempre; toggle de tema fuera de `apply()`); R-APAR-010 (los 10 tokens de radio intactos; sin densidad inventada); R-APAR-012 (debounce, vuelo único por principal, orden PUT/DELETE, `saved` sólo por instantánea vigente); R-APAR-016 (`saveState` visible como fuente del rótulo); R-APAR-020 (selectores, reset, toggle, teclado: flechas, `Home`, `End`, tabindex rotatorio, `aria-checked`, panel no modal cerrable con Escape); R-APAR-021 (remapeo idempotente de los 44 conceptos del DS + colección propia); R-APAR-022 (tipografías bajo demanda con URL original y `<link>` deduplicado; atribución de `fa7-solid` conservada tal cual); R-APAR-023 (evento `darkone:themechange` para que los gráficos re-resuelvan paleta). |
| Precondiciones / dependencias | T-BE-APP-01…06 (gate para el autosave; la preview local no lo requiere); T-FL-APP-001 (restauración previa); T-CORE-UI (capa customizer transcrita). |
| Archivos probables | `views/personalizador/PersonalizerView.vue`, `components/appearance/AxisRadiogroup.vue`, `components/appearance/ThemeToggle.vue`, `composables/useThemeApply.ts`, `composables/useAppearanceAutosave.ts`, `stores/appearance.ts`. |
| Gates | La escritura al backend opera contra la ruta de 8 ejes, ya implementada (verificado 2026-10-15); la preview y el panel **sin** persistencia simulada. |
| Done when | El atributo aplicado es inmediato; el estado de guardado visible refleja la escritura confirmada por el backend, no el optimismo; el teclado opera los radiogroups; ninguna opción existe fuera del catálogo SSOT. |

**Criterios (ruta propuesta ⇒ AC-FL).**

- **AC-FL-APP-002:** selección ⇒ atributo `data-*` escrito en el acto con la semántica
  de presencia/ausencia del SSOT; autosave con debounce y una sola petición en vuelo por
  principal; una selección nueva durante el vuelo **sustituye** la instantánea pendiente;
  `PUT`/`DELETE` nunca fuera de orden entre sí; `saveState: dirty→saving→saved` visible;
  `saved` sólo si la respuesta pertenece a la generación/instantánea vigente; `400` ⇒
  T-FL-APP-004 por campo; `403` ⇒ T-FL-APP-004 sin cierre automático; red ⇒ F-06 con el
  eje aplicado en memoria y la última instantánea conservada para reintento explícito
  (F-10); cambio de principal en vuelo ⇒ F-07/T-FL-APP-005.

---

## T-FL-APP-003 — Reset a defaults

| Campo | Valor |
|---|---|
| Objetivo | Botón «Reset to defaults» que emite el `DELETE` de la ruta propuesta (una sola escritura idempotente, `204` sin cuerpo, sin borrar usuario ni sesión) y re-aplica los ocho defaults canónicos con su semántica de atributos. |
| Flujo | [FL-APP-003](../experience/flows/appearance.md#fl-app-003--reset-a-defaults) |
| OP | Ruta de 8 ejes §5.3 (`DELETE`) — **existe** (verificado 2026-10-15); criterio AC-FL. |
| SCREEN | [SCREEN-PERSONALIZER](../experience/screens/appearance.md#screen-personalizer--personalizador-de-8-ejes) (ref. DS `theme-customizer.js:347`, `index.html:529`) |
| Requisitos | R-APAR-013 (DELETE idempotente; defaults `dark, mint, command, ibm-plex, square, phosphor, embers, accent`; re-aplicación con semántica de R-APAR-009). |
| Precondiciones / dependencias | T-BE-APP-01…06 (gate); T-FL-APP-002 (panel). |
| Archivos probables | `components/appearance/ResetButton.vue`, `stores/appearance.ts` (acción de reset). |
| Done when | Los ocho atributos de `<html>` corresponden a los defaults y una recarga posterior (T-FL-APP-001) devuelve los mismos defaults persistidos. |

**Criterios (ruta propuesta ⇒ AC-FL).**

- **AC-FL-APP-003:** reset ⇒ `DELETE` ⇒ `204`; defaults re-aplicados y `saveState` →
  ST-06; `403`/red ⇒ T-FL-APP-004: sin reset local persistido de facto — el estado
  vuelve al último valor confirmado; cola `PUT`/`DELETE` con orden garantizado.

---

## T-FL-APP-004 — Error de guardado o lectura de apariencia

| Campo | Valor |
|---|---|
| Objetivo | Tratamiento reactivo completo de errores de la ruta propuesta: `400` por campo tal como lo devuelve el backend anclado al eje; `403` diferenciado por contexto **sin cierre automático de sesión** (consulta OP-AUT-002 antes de decidir); fallo de red en `GET` con estado local intacto y UI en error (nunca «guardar los defaults»); respuesta tardía descartada (ST-08). |
| Flujo | [FL-APP-004](../experience/flows/appearance.md#fl-app-004--error-de-guardado-o-lectura) |
| OP | Ruta de 8 ejes §5.3 — **existe** (verificado 2026-10-15); criterio AC-FL. |
| SCREEN | [SCREEN-PERSONALIZER](../experience/screens/appearance.md#screen-personalizer--personalizador-de-8-ejes) (indicador de guardado) o arranque (T-FL-APP-001). |
| Requisitos | R-APAR-014 (`400` por campo —`{ "ds_accent": ["…"] }`, `non_field_errors`—; `403` sin cierre automático); R-APAR-015 (fallo de red en lectura: estado intacto, UI en error); R-SES-012 (la API no expone `401`: distinción por contexto); T-09 de `technical-design.md` vía flujos. |
| Precondiciones / dependencias | T-FL-APP-001/002/003 (superficies que disparan); T-CORE-HTTP (clasificación), T-CORE-SESSION (consulta de contexto). |
| Archivos probables | `composables/useAppearanceErrors.ts`, `stores/appearance.ts`. |
| Done when | El panel muestra el estado de guardado real; ningún error se traduce a defaults, a éxito ni a cierre de sesión indebido. |

**Criterios (ruta propuesta ⇒ AC-FL).**

- **AC-FL-APP-004:** `400` de `PUT` ⇒ error por campo literal anclado al eje,
  `saveState=error`, valores en memoria no revertidos por iniciativa propia; `403` ⇒
  distinción «sesión/CSRF inválido» vs «sin permiso» por contexto, consulta de
  OP-AUT-002 y actuación vía T-FL-SES-006 **sólo** si el contexto confirma sesión
  perdida; red en `GET` ⇒ estado local intacto + ST-04 + reintento explícito (F-10);
  respuesta tardía ⇒ descarte ST-08 (no puede marcar `saved` algo que ya cambió).

---

## T-FL-APP-005 — Logout y cambio de principal

| Campo | Valor |
|---|---|
| Objetivo | Conducta local reactiva: abortar escrituras de apariencia en vuelo, descartar respuestas tardías, vaciar la cola pendiente y restablecer defaults de cliente; el nuevo principal restaura sus propias preferencias (T-FL-APP-001) antes de `ready` — ninguna preferencia cruza entre usuarios. |
| Flujo | [FL-APP-005](../experience/flows/appearance.md#fl-app-005--logout-y-cambio-de-principal) |
| OP | Ninguna (purga local; reacciona a T-FL-SES-005). |
| SCREEN | Ninguna (reactivo). |
| Requisitos | R-APAR-017 (aborto, descarte, vaciado, defaults; restauración del nuevo principal antes de `ready`); R-SES-019 vía sesión. |
| Precondiciones / dependencias | T-CORE-SESSION (purga), T-FL-SES-005 (disparador); **no** requiere el backend de apariencia (conducta local). |
| Archivos probables | `stores/appearance.ts` (acción de purga), `api/appearance.ts` (AbortController de la cola). |
| Done when | La sesión entrante ve defaults hasta que su propio `GET` resuelve; ninguna petición de apariencia del usuario anterior queda en vuelo ni en cola. |

**Criterios (sin OP ⇒ AC-FL).**

- **AC-FL-APP-005:** logout o cambio de principal ⇒ escrituras en vuelo abortadas,
  respuestas tardías descartadas (ST-08), cola vaciada y defaults restablecidos **sin
  petición nueva**; el nuevo principal no pinta nunca la apariencia del anterior.

---

## T-FL-APP-006 — Cambio de unidad activa (conserva)

| Campo | Valor |
|---|---|
| Objetivo | Conducta local reactiva: tras un `select-unit` exitoso las preferencias **se conservan** (mismo usuario): no se vacía la cola de autosave, no se re-aplican defaults ni se re-lee el backend por causa del cambio de unidad; el resto de datos sí se recarga (F-08). |
| Flujo | [FL-APP-006](../experience/flows/appearance.md#fl-app-006--cambio-de-unidad-activa) |
| OP | Ninguna (conservación local; reacciona a T-FL-SES-004). |
| SCREEN | Ninguna (reactivo). |
| Requisitos | R-APAR-018 (conservación); R-SES-017 vía sesión. |
| Precondiciones / dependencias | T-FL-SES-004 (disparador); T-CORE-SESSION; **no** requiere el backend de apariencia. |
| Archivos probables | `stores/appearance.ts` (exclusión del vaciado por cambio de unidad). |
| Done when | Los ocho atributos de `<html>` no cambian tras el cambio de unidad mientras el resto de datos se recarga. |

**Criterios (sin OP ⇒ AC-FL).**

- **AC-FL-APP-006:** `select-unit` exitoso ⇒ apariencia intacta (cola, instantánea y
  atributos), datos dependientes recargados desde el nuevo contexto (F-08 de
  [../experience/flows.md](../experience/flows.md)).

---

## T-FL-APP-007 — Modo público: defaults sin persistencia

| Campo | Valor |
|---|---|
| Objetivo | Superficies públicas (login, recuperación, 404) y ajustes previos a la sesión: aplicar los defaults canónicos del DS y **no consultar ni persistir nada** para un usuario desconocido — sin `localStorage`, sin hash, sin clave manual. |
| Flujo | [FL-APP-007](../experience/flows/appearance.md#fl-app-007--modo-público) |
| OP | Ninguna. |
| SCREEN | [SCREEN-LOGIN, SCREEN-RECOVERY, SCREEN-NOT-FOUND](../experience/screens/access-context.md) |
| Requisitos | R-APAR-019 (defaults públicos, sin consulta ni persistencia); R-PREF-03 vía tomos citantes. |
| Precondiciones / dependencias | T-CORE-UI (defaults aplicados); **no** requiere el backend de apariencia. |
| Archivos probables | `composables/useThemeApply.ts` (modo público), `stores/appearance.ts`. |
| Done when | Las pantallas públicas se pintan con los defaults canónicos y ninguna petición de preferencias sale sin sesión. |

**Criterios (sin OP ⇒ AC-FL).**

- **AC-FL-APP-007:** superficie pública ⇒ defaults canónicos aplicados; cero peticiones
  de preferencias; un ajuste de apariencia antes de sesión se aplica como default y no
  se persiste por ningún medio.

---

## T-FL-APP-008 — Ruta legacy de tres campos (separada)

| Campo | Valor |
|---|---|
| Objetivo | Trazabilidad operativa de la ruta legacy **existente** (OP-PRF-001/002): lectible, separada y sin gobernar la apariencia visible; el cliente deja de escribir `palette` y `density` a efectos visuales; los `400` literales (`Theme inválido`, `Palette inválida`, `Density inválido`) se propagan tal cual si un consumidor los encuentra. No hay pantalla de preferencias legacy. |
| Flujo | [FL-APP-008](../experience/flows/appearance.md#fl-app-008--ruta-legacy-de-tres-campos) |
| OP (AC canónicos) | OP-PRF-001, OP-PRF-002 |
| SCREEN | [Trazabilidad legacy](../experience/screens/appearance.md#trazabilidad-de-la-apariencia-legacy) (sin pantalla propia) |
| Requisitos | R-APAR-002 (ruta legacy intacta y separada; sin traducción de `palette`/`density`; sin migración automática); R-APAR-003 (literales de `400` propagados); R-PREF-01/02 vía tomos citantes. |
| Precondiciones / dependencias | T-CORE-HTTP (exclusión de `X-Tenant-Code` en rutas de preferencias); independiente del gate T-BE-APP. |
| Archivos probables | `api/appearance-legacy.ts` (accesores de trazabilidad). |
| Done when | Los campos legacy no se aplican a ningún atributo `data-*` de `<html>`; el personalizador de 8 ejes no ofrece `palette` ni `density`; la ruta legacy permanece intacta en el backend. |

**Criterios.**

- **AC-OP-PRF-001:** `GET /me/preferences/appearance/` ⇒ `{theme, palette, density}` se
  muestra, si un flujo la consulta, como configuración legacy que **no gobierna** la
  apariencia visible.
- **AC-OP-PRF-002:** `PUT` parcial ⇒ `200` con el mismo objeto; elección inválida ⇒
  `400 {error}` con los literales citados propagados por campo sin reinterpretar;
  `403` ⇒ la API no expone `401`: aplicar la fila 2 de T-FL-APP-004; red ⇒ F-06.

---

## Backend gateado de la excepción acotada (T-BE-APP-01…06)

> 🕯️ **Único cambio de backend que autoriza la spec** (excepción acotada de
> `front/AGENTS.md` §Límites vía [../requirements/appearance.md](../requirements/appearance.md)
> R-APAR-004): ocho campos `ds_*` en `Usuario`, una migración y el endpoint propio del
> usuario autenticado — nada más. **Gate triple:** spec aprobada (`approved_at` en
> `spec-meta.yaml`) + gate superado + orden explícita del operador; la migración se
> aplica únicamente con esa orden. No se extiende a autenticación, RBAC, permisos,
> multi-tenant, infraestructura ni despliegue. Estas tareas conservan el contenido de
> las anteriores T-30…T-35 (equivalencias en [../tasks.md](../tasks.md)); su ejecución
> corresponde a un writer de backend, no a esta spec documental. El backend ya reportado
> en marcha en `127.0.0.1:8000` se reusa: no se levanta otro, ni se reinicia o detiene.

### T-BE-APP-01 — Ocho campos `ds_*` en `Usuario` (conserva T-30)

Ocho campos `ds_theme`, `ds_accent`, `ds_bg`, `ds_font`, `ds_radius`, `ds_iconfam`,
`ds_ambient`, `ds_ambcolor` en `Usuario`, con `TextChoices` por eje, `max_length=16`,
`null=False`, `blank=False` y defaults canónicos del SSOT. **Criterio AC-BE-APP-01:**
los choices coinciden valor por valor con [../design-system/customizer-catalog.md](../design-system/customizer-catalog.md); los defaults son `dark, mint, command,
ibm-plex, square, phosphor, embers, accent`.

### T-BE-APP-02 — Ocho `CheckConstraint` de pertenencia (conserva T-31)

Ocho `CheckConstraint` de pertenencia al `choices` de cada eje; sin índice nuevo, sin
modelo nuevo, sin tocar `Account` ni `UnitMembership`. **Criterio AC-BE-APP-02:** el
modelo no gana más superficie que los ocho campos y sus constraints.

### T-BE-APP-03 — Una migración revisada (conserva T-32)

Una migración con `8 × AddField` y `8 × AddConstraint`, con dependencia resuelta contra
la hoja real del grafo en el momento de implementar; no editar migraciones anteriores.
**Criterio AC-BE-APP-03:** migración revisada y con tests; `RunPython` explícito si
algún dato lo exigiera (no previsto por el diseño).

### T-BE-APP-04 — `DesignSystemPreferencesView` (conserva T-33)

Vista con `GET`, `PUT` y `DELETE` sobre `/api/me/preferences/appearance/design-system/`,
registro en `urls.py` e `IsAuthenticated` sin permiso nuevo ni `HasTenantAccess`.
**Criterio AC-BE-APP-04:** la ruta queda registrada en el inventario de URLs y responde
a sesión propia del usuario autenticado, en paridad con la heredada.

### T-BE-APP-05 — Validación y semántica de escritura (conserva T-34)

`PUT` con validación de los ocho campos antes de escribir, una sola llamada de
persistencia de ocho claves y `400` por campo de DRF; `DELETE` idempotente en una
escritura que devuelve `204` sin cuerpo. **Criterio AC-BE-APP-05:** `PUT` no acepta
campos de más ni valores fuera de enum (`non_field_errors` para conjunto incompleto);
`DELETE` repetido no falla ni borra usuario ni sesión.

### T-BE-APP-06 — Integridad de la ruta legacy (conserva T-35)

Verificar que `theme`, `palette` y `density` quedan intactos y que
`GET|PUT /api/me/preferences/appearance/` no se altera. **Criterio AC-BE-APP-06:** la
ruta legacy responde igual antes y después del cambio; sin migración automática de
valores entre rutas.

---

> 🪶 Cierre de la familia: con T-BE-APP-01…06 completadas y verificadas por quien
> corresponda, T-FL-APP-001…004 quedan ejecutables y el requisito de
> personalización persistida por usuario queda cerrado de forma observable. Sin ellas,
> el frontend **no** está entero: el hueco se reporta en cada entrega, no se da por
> cumplido. **Actualización 2026-10-15:** la excepción acotada de backend **ya se ejecutó**
> (ocho campos `ds_*`, migración `0021_design_system_preferences` y rutas
> `apipoligono/urls.py:85-86`); la persistencia por usuario está acreditada en runtime por
> las evidencias del plan de cierre ([../evidence/2026-10-13/appearance-eight-axes-results.json](../evidence/2026-10-13/appearance-eight-axes-results.json),
> [../evidence/2026-10-14/appearance-persistence-readonly.json](../evidence/2026-10-14/appearance-persistence-readonly.json)),
> y la paridad de render en estados completos sigue `NOT_VERIFIED` (T8/T9).
