# Correcciones UX — lenguaje de usuario, denegación accesible, navegación única, estados coherentes

**id:** `frontend-ux-corrections` · **tier:** CONTAINED (plan explícito, sin spec) · **risk:** `[]` · **updated:** 2026-10-12

> 🕯️ **Estado de ejecución (2026-10-12):** implementación **entregada**; plan **no
> cerrado** — véase la nota de entrega al inicio de este documento y el artefacto
> [`../specs/final-frontend/evidence/2026-10-12/account-ux-delivery.md`](../specs/final-frontend/evidence/2026-10-12/account-ux-delivery.md).

> 🕯️ **Persistencia mecánica (`Lore Master`, 2026-10-12, TIER FAST).** Cuerpo transcrito del
> `plan_payload` final de `Cunning-Bard` (ítem 3, workstream `frontend-completion-plans`).
> Único cambio: localizadores de documentación convertidos a rutas relativas a este archivo
> (`../specs/final-frontend/…`) y enlaces a los planes hermanos. Sin spec, sin frontmatter, sin
> metadata paralela y sin normalización de contenido. **No autoriza implementar.**
>-Planes hermanos: [`../specs/frontend-permission-navigation.md`](../specs/frontend-permission-navigation.md)
> (ítem 1, orden previo obligatorio), [`../specs/frontend-account-self-service.md`](../specs/frontend-account-self-service.md)
> (ítem 2, entrega previa a F7), [`../specs/frontend-integral-acceptance.md`](../specs/frontend-integral-acceptance.md)
> (ítem 4, consume los anchors resultantes). Deuda backend sólo como referencia:
> [`../bugs/backend-debt.md`](../bugs/backend-debt.md).

> 🕯️ **Aprobación y orden de ejecución (2026-10-12).** El operador aprobó este plan y ordenó
> ejecutar los cuatro planes persistidos. Este plan se ejecutó **secuencialmente**, después
> de los ítems 1 y 2 (orden 1→2→3 obligatorio por write set compartido), en la misma sesión
> de `Code Transmuter`.

> 🕯️ **Entrega de implementación (2026-10-12).** El plan **entrega implementación**; no
> cierra funcionalmente ni el objetivo global. Observado por lectura del orquestador:
> denegación accesible con motivo visible y `aria-describedby`, sin patrón `title`-only
> (`front/src/views/exercises/ExercisesView.vue:205-215,1887-1888,1931,2001-2003,2024,2037`;
> `front/src/views/shooting/ShootingView.vue:348,1788,1826,1867,1888`), gating intacto ·
> microcopy de cliente en español neutro con el `detail` literal del backend **intocable** ·
> `404` en español (`front/src/views/NotFoundView.vue:34-43`) · navegación única: emit
> `navigate`/`legacySection`, estado `activeSection` y la prop del shell **retirados**, con
> `RouterLink` como única fuente y cierre móvil conservado (`front/src/App.vue:537-552`;
> `front/src/components/DashboardSidebar.vue:275-286,348`) · barrera de apariencia con
> mensajes, retry y salidas, **sin bypass ni defaults**
> (`front/src/views/appearance/PersonalizerView.vue:332-389`) · móviles/teclado comparados
> **por lectura** contra el DS externo, **sin certificación WCAG ni pixel-perfect** · test
> `front/tests/focused/denial-navigation.test.ts`.
>
> **Comprobaciones:** `pnpm typecheck` exit 0 · `pnpm test:focused` exit 0, **12 archivos /
> 211 pruebas** (conjunto transversal vigente; **no** se suma a las 187 del plan 1) ·
> `pnpm build` exit 0 con build generado.
>
> **Seguimiento F3 (2026-10-12).** Completados los headings, acciones y labels accesibles
> del Personalizador en español; nombres y valores de las opciones del catálogo conservados.
> El orquestador comprobó la vista, Enter/Escape y el panel en 390×844 sin desbordamiento
> horizontal, esperando la transición de apertura; sin escrituras de preferencias. Typecheck
> y 211 pruebas pasan. Adaptación lingüística prevista en §2, sin cambios de estilos ni
> anatomía. [Evidencia acotada](../specs/final-frontend/evidence/2026-10-12/personalizer-follow-up.json).
>
> **Sin gates de revisor** (el operador revocó nuevas auditorías) y **sin cierre**: este
> registro es de entrega de implementación, no de cierre funcional.
>
> 🕯️ **Evidencia runtime limitada (2026-10-12).** Limitada a navegación, menú y `/cuenta`;
> **no es 100 % funcional ni certificación visual**. Actor A8: menú con «Mi cuenta»/«Mi ficha»/
> `Personalizador`, `/cuenta` accesible, ficha propia 200, sonda permitida 200 y sonda denegada
> sin solicitudes de negocio. Multi-actor, **reportado** por el worker sin traza exacta.
> Navegación única, denegación accesible, microcopy, barrera y temática móvil/teclado se
> evaluaron **por lectura**, no por observación en runtime. Resultado global:
> `NOT_VERIFIED` / `NO_CUMPLIDO`. Detalle:
> [`../specs/final-frontend/evidence/2026-10-12/runtime-observations.md`](../specs/final-frontend/evidence/2026-10-12/runtime-observations.md).

## 1. Objetivo

Que la interfaz hable al usuario y no al desarrollador: motivos de denegación visibles y
accesibles por teclado (no `title`-only con códigos de permiso), microcopy de cliente en
español neutro sin alterar la fidelidad visual ni la anatomía HTML del DS, una sola navegación
por clic desde `/contexto`, estados (validación/feedback/errores/loading/empty/denied)
coherentes con el vocabulario ST-00…ST-10, discovery de la cuenta, UX compatible de la barrera
de apariencia (mensajes/retry/salidas; nunca bypass ni defaults) y móviles/teclado fundados en
el Inume DS externo — sin certificar WCAG ni pixel-perfect por código.

## 2. Scope

- **Denegación accesible:** sustituir el patrón `title`-only con código de permiso
  (`ExercisesView.vue:1869,1912-1913,1984,1990,2004,2014`; `permissionHint` en `:title` de
  `ShootingView.vue:332-337,1763,1800,1840,1860,1877,1882,1892,1938,1951,1958`) por motivo
  visible junto al control + `aria-describedby`, en lenguaje de usuario; **sin alterar la
  lógica de gating** (unificada por la spec hermana 1). El `detail` literal de un 403 del
  backend permanece literal (ST-07,
  [`../specs/final-frontend/experience/states.md`](../specs/final-frontend/experience/states.md)).
- **Microcopy de cliente → español neutro:** jerga de API/OP/contrato en superficies de usuario
  (`IdentityView.vue:2519,2526,2531,2535,2543,2548,2557,2565-2571,2593-2598,2610,2621,2628,2636,2641,2649`;
  `ExercisesView.vue:1858,1953,1981,2001,2006,2021`); la información contractual necesaria
  (p. ej. la elección real PUT vs PATCH, que cambia la request) se reformula sin mentir ni
  omitir.
- **Textos en inglés:** la existencia de strings ingleses en el DS externo
  (`pages-404-alt.html`, `ui-collapse.html`, `tables-gridjs.html`, `auth-signup.html`,
  `assets/js/theme-customizer.js`) **no es por sí misma norma obligatoria de idioma**. Los
  strings cliente-generados (incluidos los CTA de `NotFoundView.vue:9-23`) y los labels
  derivados del DS se traducen al español **preservando anatomía HTML y valores CSS 1:1**, con
  la adaptación reportada y justificada (norma vigente en `front/AGENTS.md`: «toda adaptación
  debe reportarse y justificarse»). F1 verifica que no exista prohibición expresa/local de
  traducir texto (AGENTS del repo, `front/AGENTS.md`, `DESIGN.md`/`PRODUCT.md` del DS
  externo); **sólo si la encuentra**, los strings afectados se marcan como decisión y no se
  traducen por iniciativa.
- **Navegación única desde `/contexto`:** retirar el mecanismo legacy de secciones (emit
  `navigate`/`legacySection` de `DashboardSidebar.vue:282-292`, arbitraje `App.vue:386-393`,
  estado `activeSection` de `App.vue:56,101-103` y prop atravesada en
  `components/shell/AppShell.vue`/`AppSidebar.vue`/`types/shell.ts`), dejando `RouterLink` como
  única fuente y **conservando** el emit `close` (cierre del sidebar móvil). Hoy ambas vías
  están mutuamente suprimidas (`DashboardSidebar.vue:286-291`): el retiro elimina el conflicto
  latente sin cambiar comportamiento observable de las rutas que funcionan; el guard no se
  toca.
- **Barrera de apariencia — sólo UX compatible:** en la superficie de error de
  restauración/reconciliación (`PersonalizerView.vue:286-339`, montada por `App.vue:484` vía
  `appearanceBarrierActive`, `App.vue:77-79`): mensajes claros en lenguaje de usuario, retry
  prominente y salidas alternativas visibles (cerrar sesión, ir a `/contexto`); **sin bypasear
  la barrera ni aplicar defaults ante fallo** (R-APAR-015,
  [`../specs/final-frontend/requirements/appearance.md:134-137`](../specs/final-frontend/requirements/appearance.md)).
  El acoplamiento «fallo de restauración bloquea todo contenido tenant» queda registrado; su
  cambio de política está **fuera de scope** (el operador lo inicia por separado si lo desea).
- **Discovery de Cuenta:** con el ítem 2 entregado, etiqueta/orden/estado de «Mi cuenta» en el
  topbar; sin él, sólo se pulen las entradas existentes («Mi ficha», «Personalizador») y se
  declara la dependencia.
- **Estados coherentes:** validación/feedback/error/loading/empty/denied contra ST-00…ST-10 y
  las páginas DS (`ui-alerts`, `ui-spinners`, `ui-placeholders`, `forms-validation`,
  `ui-toasts`); empty ≠ error ≠ denied; `—` ante falta real.
- **Móviles/teclado según DS externo** (`../../../Inume Design System/` desde `front/`; la
  carpeta interna homónima **no** es la fuente): lectura contra la anatomía del shell (sidebar
  250/75px, topbar 70px, backdrop móvil, dropdown, `aria-current`, focus-visible, skip-link
  `AppShell.vue:57`); correcciones puntuales fundadas en página DS; **no se certifica WCAG ni
  pixel-perfect por código**. Los assets CDN (`front/index.html:8-11`, Google Fonts e iconify)
  son referencias visibles: no se afirma comportamiento remoto/intranet ni se convierten en
  proyecto de assets locales sin pedido.

## 3. Out of scope

Backend; política de `appearanceBarrierActive`/R-APAR-015 (bypass, defaults, cambio de
requerimiento — se registra, no se decide); lógica de visibilidad por permisos (ítem 1: este
plan sólo hace legible/accesible el motivo, no cambia quién ve qué); ruta/superficie de cuenta
(ítem 2); localización de assets/CDN; reescritura de vistas; dependencias nuevas; matriz de
aceptación (ítem 4); `/impeccable` (opt-in ausente); certificación WCAG/pixel-perfect;
navegador (no autorizado); alterar el `detail` literal de los 403 del backend.

## 4. Archivos probables

`front/src/views/exercises/ExercisesView.vue` y `views/shooting/ShootingView.vue` (denegación
accesible + microcopy); `front/src/views/identity/IdentityView.vue`,
`views/organization/OrganizationView.vue`, `views/authorization/AuthorizationView.vue`,
`views/armory/ArmoryView.vue` (microcopy según matriz F1); `front/src/views/NotFoundView.vue`;
`front/src/views/appearance/PersonalizerView.vue`; `front/src/components/DashboardSidebar.vue` +
`front/src/App.vue` (+ `components/shell/AppShell.vue`, `components/shell/AppSidebar.vue`,
`types/shell.ts`) para el retiro legacy; `front/src/components/DashboardTopbar.vue`
(discovery, tras ítem 2); `front/src/styles/` (ajustes DS-fundados que exijan las correcciones).

## 5. Pasos / fases

- F1 Matriz de origen por string (dep: —). Clasificar cada string candidato: cliente-generado
  (traducible), `detail` de backend (intocable, ST-07), derivado del DS (traducible preservando
  estructura/CSS 1:1 con adaptación reportada/justificada). Verificar ausencia de prohibición
  expresa de traducir en la norma local; si existe → flag de decisión para los strings
  afectados. Lectura de contratos/norma, **no** auditoría de calidad.
- F2 Denegación accesible (dep: F1; secuencial tras ítem 1 en los mismos archivos). Patrón
  visible + aria en Exercises/Shooting y donde la matriz lo encuentre; gating intacto.
- F3 Microcopy de usuario en español (dep: F1). Reescritura de strings de cliente y traducción
  de labels DS-derivados con adaptación reportada; anatomía/valores sin alteración.
- F4 Navegación única (dep: F1; secuencial tras ítem 1 en sidebar/App). Retiro del legacy
  conservando el emit `close` móvil y el activo por ruta (ya route-based,
  `DashboardSidebar.vue:271-280`); el test `guards-return` existente debe seguir siendo válido
  (re-ejecución sólo con autorización).
- F5 Barrera: UX sin política (dep: F1). Mensajes/retry/salidas en la superficie de error;
  registro del acoplamiento; cero bypass/defaults.
- F6 Móviles/teclado según DS (dep: F1). Lectura contra el DS externo y correcciones fundadas;
  lo no verificable por lectura → lista observada, no logro afirmado.
- F7 Discovery de Cuenta (dep: ítem 2 entregado). Label/orden/estado de «Mi cuenta»; sin ítem
  2, pulir lo existente y declarar la dependencia.

## 6. Riesgos

- Traducir texto DS cuando exista prohibición expresa → F1 lo verifica antes; prohibición =
  flag de decisión, no permiso unilateral.
- Reescribir por error un `detail` del backend rompería ST-07 → la matriz separa orígenes antes
  de tocar nada.
- El retiro del legacy puede afectar el cierre móvil o el resaltado → se conservan el emit
  `close` y el activo por ruta; comportamiento observable sin cambio en rutas que funcionan.
- Barrera: cualquier «arreglo» con bypass/defaults viola R-APAR-015 → scope limitado a
  mensajes/retry/salidas; la política es decisión separada del operador, fuera de scope.
- Sin navegador: móvil/teclado se corrige por lectura+DS; lo no verificable por lectura se
  lista como observado (no se clama certificación).
- Write set compartido con ítems 1-2 → orden secuencial 1→2→3; el ítem 4 consume los anchors
  resultantes.

## 7. Verificaciones

Escalera: F1 → matriz como artefacto de lectura (string→origen→acción, con `archivo:línea` de
ambos lados para lo DS-derivado). F2-F5, F7 → diff contra la matriz + `pnpm typecheck`; F4 →
`pnpm test:focused` sólo si toca lógica y con autorización de ejecución (una autorización, no
confirmación por paso). F6 → comparación por lectura contra páginas del DS externo (anclas de
ambos lados); sin claim de pixel/WCAG. Sin navegador ni servidor. Cierre:
`DELIVERED|BLOCKED|FAILED` + rutas tocadas + matriz de strings con las adaptaciones reportadas;
veredicto del orquestador. Revisión post-implementación sólo si flag/evidencia lo justifica:
`Hellknight Inspector` base + `Codex-Of-Botched-Runes` complementario +
`inume-css-html-anti-patterns` si se revisa markup; nunca Codex aislado; no se invoca en este
plan.

## 8. Handoff para Code Transmuter

Implementar F1→F7 (F7 condicional al ítem 2). Skills allowed (allowlist vigente): `vue`,
`vue-best-practices`, `vue-router-best-practices` (F4), `typescript`, `pinia`,
`inume-css-html-anti-patterns` (siempre en markup/CSS: catálogo FORBID/CONDITIONAL/MEASURE/
PREFERENCE), `vitest`, `vue-testing-best-practices` (sólo si F4 exigiera tests; habilitados por
orden del operador del 2026-10-12, de modo que el prerrequisito operativo ya no aplica y no se
cambia config por iniciativa), `pnpm` (comandos). Fuente visual: **sólo** el DS externo
(`../../../Inume Design System/` desde `front/`). Límites duros: no tocar política de la
barrera (nunca bypass/defaults); `detail` de backend permanece literal; no alterar gating (sólo
su presentación); anatomía HTML y valores CSS 1:1 (la traducción cambia texto, no estructura ni
valores); toda adaptación reportada y justificada en la entrega; cero dependencias; sin
`/impeccable`; sin navegador. CONTAINED: **no hay spec**; `Lore Master` persiste sólo este
plan.
