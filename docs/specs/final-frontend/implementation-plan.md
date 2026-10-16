---
plan_id: frontend-build-base
spec_id: spec-final-frontend-001
created_by: Cunning-Bard
persisted_by: Lore-Master
created_at: "2026-10-01"
updated_at: "2026-10-02"
payload_revision: p3
review_gate: VALIDATED
review_gate_revision: r2
spec_meta: ./spec-meta.yaml
---

# Plan — frontend-build-base: Fase base TypeScript del frontend

> **Nota de persistencia (`Lore Master`, `p3`, 2026-10-02).** Cuerpo técnico copiado literal del `plan_payload_revised` de `Cunning Bard` (ciclo `BARD_CORRECTION_1` del gate `prg-frontend-build-base`): las 8 secciones canónicas en su orden original, con sus subsecciones `### Cambios r1`, sin validaciones agregadas ni reempaquetado narrativo. Este cuerpo **sustituye** al `p2` en el slot operativo: `p2` no se conserva completo y su registro vive en `## Historial de revisiones`. `§9 Dependencias` y `§10 Referencia a spec` son derivaciones de la persistencia (`docs/plan-persistence.md > Estructura obligatoria`), ajustadas al estado real del gate. Las citas del payload a TD§2/TD§13, R-AUTH-09, R-ROUTER-03/06/08, OP-AUT-002, R-SES-004…025, G-SES-1, `front/src/App.vue` y visual-contract §Composición refieren a los volúmenes de la spec y al código del cliente; esta persistencia no los releyó ni los valida. Persistencia mecánica `TIER: FAST`: este archivo no aprueba la spec y no autoriza implementación. El gate `plan-review` **sí** está despachado y cerrado: veredicto `VALIDATED` en `r2` con `implementation_authorized: no` (ver `## Plan Review Gate`). Esta revisión `p3` **acota el arranque** (fase base) **sin reducir** el alcance integral aprobado de `full-frontend-plan` `p1`; `p1` no se reconstruye y se preserva literal más abajo como documento histórico. `vue-router@5.3.1` se transcribe literal sin corregir: la versión sigue bajo verificación del investigador; la disposición corresponde al autor.

---

## 1. Objetivo
Base TS ejecutable en front/: toolchain de tipos, vue-router, cliente HTTP tipado y stores tipados que preservan el comportamiento real actual (dashboard de lectura) con shell DS 1:1. Primera fase de construcción bajo full-frontend-plan p1 (spec aprobada 2026-10-02; el alcance integral sigue aprobado, no se reduce). La restricción «sin TypeScript» de p1 queda derogada por D-08 (front/AGENTS.md §Stack); este plan no reconstruye p1.

Sin cambios en r1.

## 2. Scope
- front/ únicamente. Dos writers Code Transmuter con write sets disjuntos (A y B); integración única por A tras DELIVERED de B.
- A: deps autorizadas (typescript, vue-tsc, @types/node devDeps; vue-router@5.3.1 dep) + lock + tsconfig strict + scripts typecheck/build (bajo la autorización vigente) + index.html (entry main.ts) + main.ts + types + api/http.ts + api/dashboard.ts + stores/dashboard.ts + router/ + views/ + App.vue.
- B: components/shell (AppShell, AppSidebar, AppTopbar) + componentes existentes migrados a Vue TS (incluido ConnectionForm, captura manual de tenant actual) + styles (tokens.css y capas necesarias) 1:1 desde el kit externo + solo assets locales necesarios.
- Rutas: `/` (dashboard real) y catch-all con estado visible no-blanco (R-ROUTER-08). Sin login, sin CRUD, sin rutas de fases futuras.
- Menú del sidebar: solo capacidad actual (dashboard); nada que simule funcionalidad no implementada; permisos leídos del contexto real (OP-AUT-002).
- Contratos preservados al tipar: cookies sesión/CSRF/tenant (TD§2 reglas 1–6), generation anti-carrera (R-AUTH-09), purga/reload existentes en stores, contrato actual de api/dashboard.js.

Sin cambios en r1 (la mención de ConnectionForm en B es aclaratoria; el delta vive en §3/§5).

## 3. Out of scope
- Planificación o ejecución F3–F10; completar coverage/tasks/acceptance de la spec para construir esta base.
- Pantallas de acceso (login, recuperación, forzado, contexto, contexto-perdido = F2), auth nueva, RBAC/CRUD, personalizador 8 ejes y API de apariencia (obligatorio para el cierre integral futuro; no se implementa ahora; no se completa F10 sin esa persistencia).
- Rutas o pantallas de recaptura de tenant (`/contexto` o similar): la captura manual existente —ConnectionForm del dashboard actual (App.vue:355-360) y query `?tenant=` (App.vue:293)— se preserva como única vía; sin storage, sin tenant hardcodeado, sin login inexistente (G-SES-1, shared-session-data.md:188).
- Backend: cero cambios, cero reinicio/arranque/parada del proceso en 127.0.0.1:8000, cero DB/migraciones, cero endpoints nuevos (new-api excluido de esta fase).
- localStorage/sessionStorage/cookies de estado, fixtures/mocks/datos sintéticos, frameworks de estilos/preprocesadores/librerías UI, dependencias no autorizadas.
- Escritura de docs/specs/plan en disco, git operativo, sesiones anteriores, navegador/MCP fuera de la comprobación autorizada, delegación a otros agentes.

### Cambios r1
- Bullet nuevo: sin ruta `/contexto` ni recaptura de tenant fuera de los mecanismos manuales existentes (ConnectionForm App.vue:355-360, `?tenant=` App.vue:293); evidencia G-SES-1 shared-session-data.md:188 [D-seguridad-1].

## 4. Archivos probables
- Writer A (único writer de): front/package.json, front/pnpm-lock.yaml, front/tsconfig.json, front/index.html, front/src/main.ts (reemplaza main.js), front/src/App.vue, front/src/types/*.ts (contexto OP-AUT-002, shapes del dashboard actual, interfaces de shell), front/src/api/http.ts, front/src/api/dashboard.ts, front/src/stores/dashboard.ts, front/src/router/{index,routes,guards}.ts, front/src/views/{DashboardView,NotFoundView}.vue.
- Writer B (único writer de): front/src/components/shell/{AppShell,AppSidebar,AppTopbar}.vue, front/src/components/* existentes migrados (incluido ConnectionForm.vue), front/src/styles/{tokens.css,app.css,capas DS necesarias}, front/src/assets/ (solo lo necesario).
- Lectura sin escritura: kit externo ../../Inume Design System/ (index.html, assets/css/styles.css, DESIGN.md) vía front/AGENTS.md §Design System; main.js, api/dashboard.js y stores/dashboard.js actuales como fuente de comportamiento real. Las interfaces de componentes las define A en types/ y B las implementa leyéndolas; sin carpetas compartidas nuevas.

Sin cambios en r1 (ConnectionForm ya estaba cubierto como componente existente migrado).

## 5. Pasos
1. (A) Toolchain y tipos puente: deps autorizadas + pnpm install; tsconfig strict; scripts typecheck/build; index.html → main.ts; main.ts con orden de instalación fijo: createApp → Pinia → router/guard (los stores están activos antes de que cualquier guard resuelva); types mínimos: contexto OP-AUT-002, shapes del dashboard actual, AppShellProps/Emits. Hito: interfaces publicadas para B.
2. (B, tras el hito 1; paralelo a 3–4) Shell y componentes DS 1:1: AppShell (sidebar fija 250px/75px colapsada, topbar 70px, main.page-content con paddings de visual-contract §Composición), sidebar con menú de capacidad actual, topbar; componentes dashboard existentes (ConnectionForm, StateMessage y el resto) a `<script setup lang="ts">` sin cambio de comportamiento; tokens.css y capas con valores literales del kit externo (body 14px/400/1.5, font-synthesis-weight:none, dark primario); assets locales mínimos. Cierra con DELIVERED.
3. (A, paralelo) Transporte y datos tipados: http.ts con TD§2 reglas 1–6 como contrato (credentials:'include', X-CSRFToken solo en métodos no seguros desde cookie csrftoken, X-Tenant-Code con sus excepciones, 403 de negocio vs 403 de contexto perdido diferenciados por `detail` literal —sin normalizar ni traducir ese literal—, 429 sin reintento automático, AbortController). Precedencia: si el JS actual diverge de TD§2/R-SES en transporte, prevalece el contrato y la divergencia se reporta (a Lore Master vía orquestador), nunca se copia en silencio; el JS actual gobierna solo el comportamiento del dashboard. api/dashboard.ts con validación de forma en el borde (TD§13) y contrato JS conservado: forma inválida → error explícito, sin pintado parcial ni ceros falsos. stores/dashboard.ts como setup store solo-memoria con generation/reload/purga semánticamente idénticos al JS actual, con invariantes: el incremento de generation descarta respuestas en vuelo de la generation anterior; la purga vacía datos sin rehidratación; la reentrada a `/` reconsulta el contexto vigente.
4. (A) Router: createRouter + createWebHistory(import.meta.env.BASE_URL), scrollBehavior saved ?? {top:0}; rutas `/` y catch-all; guard booting que espera la resolución terminal de OP-AUT-002 antes de resolver la navegación (R-ROUTER-03/06), con terminales explícitos: `ready` (contexto resuelto) o `failure` (estado de error visible); error de red, 403, 429, 5xx o cancelación terminan la espera y la navegación se resuelve una sola vez; nunca pantalla en blanco. La recarga real sin memoria no reconstruye el tenant: Pinia es solo memoria y F2 no existe, por lo que una recarga sin tenant ni `?tenant=` termina en terminal visible con la ConnectionForm manual existente como única captura; la navegación client-side con memoria conserva el contexto y reconsulta. El fallo no redirige a rutas inexistentes ni inventa login.
5. (A, único integrador; tras DELIVERED de B) Integración: App.vue = AppShell + RouterView; DashboardView.vue (coordinador dashboard migrado) compone los componentes de B —incluida la ConnectionForm con su captura manual actual— + el store tipado; retirar main.js y archivos JS sustituidos; ningún otro writer toca App/main.
6. Comprobaciones autorizadas (tras integración): vue-tsc + vite build (apoyo, no prueban resultado de usuario); pnpm dev + navegador local: comparación shell/dashboard contra páginas DS, lecturas reales del dashboard contra 127.0.0.1:8000 reutilizado, escenarios 1–8 de §7 (incluida recarga sin tenant y URL desconocida → 404); sin fixtures y sin escritura en DB. Lo no comprobable → NOT_VERIFIED explícito; no alegar producto integral.

### Cambios r1
- #1: Pinia antes de router/guard [D-escenarios-criticos-2].
- #3: precedencia del contrato sobre el JS en transporte con reporte [D-seguridad-2]; invariante detail literal del 403 [D-seguridad-4]; invariantes generation/purga/reentrada y forma inválida [D-escenarios-criticos-3, D-escenarios-criticos-4].
- #4: terminales ready/failure, red/403/429/5xx/cancelación terminan la espera, navegación única, nunca blanco [D-escenarios-criticos-2]; eliminada la promesa «recarga profunda reconstruye contexto» (G-SES-1 shared-session-data.md:188), sustituida por terminal visible + ConnectionForm manual preservada (App.vue:355-360) y `?tenant=` (App.vue:293) [D-seguridad-1].
- #5/#6: integración compone la ConnectionForm preservada; comprobaciones citan los escenarios 1–8 de §7 [D-seguridad-1, D-escenarios-criticos-5].

## 6. Riesgos
1. Divergencia documental TD§1 vs orden de fase sobre api/dashboard.js: se migra bajo orden explícita; reportar a Lore Master, no editar docs.
2. Zona sensible (auth transport): tipar cookies/CSRF/tenant sin runtime verificado; un header o credentials mal tipado rompe lecturas reales. Mitigación: reglas TD§2 como contrato que prevalece sobre el JS actual + navegador autorizado; la divergencia JS↔TD§2/R-SES se reporta, nunca se copia en silencio; gate de seguridad acotado GET-only: la rama CSRF de mutaciones queda NOT_VERIFIED (no hay CRUD en scope).
3. generation/purga/reload existen en el JS actual (hecho declarado por el orquestador, no releído aquí): su semántica debe sobrevivir a la migración con los invariantes de §5#3; sus disparadores (logout/cambio de unidad) no tienen UI alcanzable en esta fase — conservar la lógica sin cablear UI falsa; descarte/purga quedan NOT_VERIFIED en runtime con riesgo declarado, sin inventar disparadores ni mocks.
4. Guard booting y recarga: Pinia es solo memoria y F2 no existe, por lo que la recarga real no puede reconstruir el tenant perdido (G-SES-1 shared-session-data.md:188); riesgo de pantalla blanca o login inventado si no se respetan los terminales de §5#4. Mitigación: terminales ready/failure explícitos, estado visible sin tenant, ConnectionForm manual preservada (App.vue:355-360; `?tenant=` App.vue:293); la navegación client-side con memoria es el escenario distinto que conserva contexto.
5. Writers paralelos: B consume los tipos del hito 1; todo cambio de interfaz lo edita solo A vía orquestador; desfase si A ajusta tipos tras publicarlos.
6. Fidelidad DS 1:1 no observable sin navegador; la carpeta interna homónima no es fuente; copiar solo assets locales necesarios, no el kit completo.

### Cambios r1
- #2: precedencia del contrato sobre el JS en transporte; gate GET-only con CSRF NOT_VERIFIED [D-seguridad-2, D-seguridad-3].
- #3: invariantes de §5#3 y NOT_VERIFIED con riesgo sin inventar disparadores [D-escenarios-criticos-3].
- #4: sustituido «la recarga profunda debe reconstruir contexto» por terminal visible sin tenant; evidencia G-SES-1 shared-session-data.md:188, auth-context.md:26, plan §3 excluye F2 [D-seguridad-1, D-escenarios-criticos-2].

## 7. Verificaciones
- Inspección/diff (siempre, por writer): cero localStorage/sessionStorage, cero fixtures/mocks, cero deps no autorizadas, headers/credentials literales TD§2, write sets disjuntos respetados, menú sin entradas huecas, valores CSS confrontados al kit externo, cero logs de cuerpos o mensajes con PII (R-SES-018), predicado 403 con detail literal intacto (sin normalizar/traducir).
- vue-tsc + vite build: autorizados tras integración; apoyo, nunca prueba del resultado de usuario.
- pnpm dev + navegador local (autorizados tras integración), escenarios con resultado esperado:
  1. Primera carga de `/` tras resolución del contexto: datos reales, sin pintado parcial ni ceros falsos (ausente = `—`).
  2. Reentrada a `/` con memoria (navegación client-side): conserva el contexto y reconsulta el dashboard, sin datos cacheados.
  3. Forma inválida en respuesta real: error explícito visible, sin pintado parcial ni ceros; fakes prohibidos (§3): si no es observable sin ellos, NOT_VERIFIED con motivo.
  4. Terminales del guard booting: `ready` pinta dashboard; `failure` pinta estado de error visible; error de red, 403, 429, 5xx o cancelación terminan la espera y la navegación se resuelve una sola vez; nunca pantalla en blanco; sin inventar mocks para observar lo no alcanzable.
  5. Recarga real sin tenant: terminal visible con la ConnectionForm manual preservada como única captura (y `?tenant=` si viene en la URL); sin hardcode, sin storage, sin login; resultado: estado sin tenant visible, nunca blanco.
  6. URL desconocida: pinta el 404 del DS sin fetch del dashboard; back/forward y scrollBehavior (saved ?? {top:0}) observados.
  7. Lecturas contra 127.0.0.1:8000: cookies de sesión y X-Tenant-Code observados en GET; la rama CSRF de mutaciones (X-CSRFToken) queda NOT_VERIFIED — no hay mutaciones en scope; no se crean mutaciones ni tests para observarla.
  8. generation/purga/reload: inspección estática de los invariantes de §5#3; disparadores sin UI alcanzable (logout/cambio de unidad) → NOT_VERIFIED en runtime con riesgo.
- Sin tests automatizados en esta fase (tooling de tests no autorizado). UI o datos no comprobables → NOT_VERIFIED con motivo. Cierre por writer: DELIVERED|BLOCKED|FAILED + rutas tocadas.

### Cambios r1
- Al diff se añaden: invariante de logs sin PII [D-seguridad-5] y detail literal del 403 [D-seguridad-4].
- Lista de escenarios 1–8 con resultado esperado [D-escenarios-criticos-2, -3, -4, -5; D-seguridad-1; D-seguridad-3].
- Eliminada la «recarga profunda de `/`» como reconstrucción; sustituida por el escenario 5 [D-seguridad-1].

## 8. Handoff para Code Transmuter (×2)
- CT-A (writer + único integrador): pasos 1, 3, 4, 5, 6. Único writer de package/config/lock/index.html/main/App/router/types/api/stores/views. Skills: typescript, vue, vue-best-practices, vue-router-best-practices, pinia — con TypeScript efectivo (D-08 deroga la adaptación «JS, no TS» del handoff de p1). Transporte: TD§2 reglas 1–6 / R-SES como contrato que prevalece sobre el JS actual; la divergencia se reporta, nunca se copia en silencio. Preservar transporte auth real y generation/purga con los invariantes de §5#3; sin reconstrucción de tenant en recarga sin memoria (terminal visible + ConnectionForm manual preservada, §5#4); sin rutas/CRUD/login inventados; integrar solo tras DELIVERED de CT-B.
- CT-B (writer): paso 2. Único writer de components/styles/assets. Implementa las interfaces de types de A sin editarlas (cambio de interfaz → solicitar vía orquestador). Migra los componentes existentes (incluida ConnectionForm) sin cambio de comportamiento; DS 1:1 literal desde el kit externo (front/AGENTS.md §Design System); adaptación imposible → reportar y justificar explícitamente, nunca en silencio; sin menús que simulen capacidades.
- Ambos: cero backend/DB/reinicio/docs/git; cero logs de cuerpos o mensajes con PII (R-SES-018); hueco o decisión crítica faltante → detenerse y reportar con fuente, no inventar shape; lo no comprobable → NOT_VERIFIED con motivo, nunca observado con fakes/mocks; gates de este plan: solo seguridad (transporte auth actual, GET-only) y QA (carga dashboard/guard/anti-carrera); la persistencia del plan la encadena el orquestador vía Lore Master.

### Cambios r1
- CT-A: precedencia del contrato de transporte y reporte de divergencias [D-seguridad-2]; sin reconstrucción de tenant en recarga sin memoria y ConnectionForm preservada [D-seguridad-1].
- Ambos: cero logs con PII [D-seguridad-5]; NOT_VERIFIED sin fakes [D-escenarios-criticos-3, D-escenarios-criticos-4].

## 9. Dependencias (derivación de la persistencia)

Derivadas de §5 Pasos y de las notas del orquestador (workstream `frontend-build-base`, spec `spec-final-frontend-001`). Una línea por dependencia.

- Paso 2 (B) ← hito del paso 1 (tipos/interfaces publicados por A); corre en paralelo a los pasos 3–4.
- Paso 5 (integración, A) ← `DELIVERED` de B (paso 2) y pasos 3–4 completos; A es el único integrador.
- Paso 6 (comprobaciones autorizadas) ← paso 5 (integración cerrada).
- Spec `spec-final-frontend-001` aprobada (2026-10-02 según payload §1; el estado lo gobierna `./spec-meta.yaml`) + orden del operador de construcción.
- `full-frontend-plan` `p1` (preservado literal en este archivo): alcance integral aprobado, no reducido por `p2` ni por `p3`; F3–F10 permanecen bajo su hoja de ruta.
- D-08 (TypeScript efectivo): `front/AGENTS.md` §Stack; deroga la restricción «sin TypeScript» de `p1`.
- Kit externo `../../Inume Design System/`: fuente visual 1:1 (lectura sin escritura; la carpeta interna homónima no es fuente).
- Backend reportado en marcha en `127.0.0.1:8000`: se reutiliza; no arrancar, reiniciar ni detener (estado reportado, no verificado en esta persistencia).
- Dependencias autorizadas: `typescript`, `vue-tsc`, `@types/node` (devDeps); `vue-router@5.3.1` (dep; versión literal del payload, bajo verificación del investigador — no corregida aquí).
- Documentos citados por el payload como fuente de comportamiento (no releídos en esta persistencia): TD§2 reglas 1–6, TD§13, R-AUTH-09, R-ROUTER-03/06/08, OP-AUT-002, visual-contract §Composición.
- Evidencia de procedencia del cuerpo `p2`: `HANDOFF` DELIVERED de `Cunning Bard` en `/tmp/opencode/frontend-build-base-plan.jsonl` (ruta efímera, citada como procedencia, no como fuente durable).
- Evidencia de procedencia del cuerpo `p3`: `plan_payload_revised` de `Cunning Bard` en el ciclo `BARD_CORRECTION_1` del gate `prg-frontend-build-base` (disposición de las nueve directivas). ElArbitraje y el veredicto que lo justifican están en `## Plan Review Gate`; el registro del cambio de cuerpo, en `## Historial de revisiones`.

## 10. Referencia a spec (derivación de la persistencia)

- **Spec asociada:** `spec-final-frontend-001` — *Frontend integral del producto final sobre el backend existente* (type: `full`).
- **Metadata (fuente única de verdad del estado):** [`./spec-meta.yaml`](./spec-meta.yaml). El estado del plan se deriva de esa metadata; este archivo no lo duplica. El payload §1 declara la spec aprobada el 2026-10-02 por orden del operador.
- **Volúmenes de la spec (modelo híbrido):** [`./index.md`](./index.md) como entrada; volúmenes en `docs/specs/final-frontend/` (requirements, technical-design, verification, tasks, inventario/contratos de backend, experience, design system).
- **Regla de lifecycle:** este plan no autoriza implementación por sí mismo ni por superar el gate; la orden explícita del operador sigue siendo necesaria. El gate `plan-review` (`prg-frontend-build-base`) está cerrado con veredicto `VALIDATED` en `r2` sobre el cuerpo `p3`, con `implementation_authorized: no`; el detalle del ciclo está en `## Plan Review Gate`. El estado de la spec lo gobierna `./spec-meta.yaml`, que esta escritura no modifica.

---

> **Revisión histórica `p1` — preservada literal, no operativa.** Lo que sigue es la primera versión del plan (`full-frontend-plan`, persistida 2026-10-01, nunca revisada por el gate), intacta. El cuerpo vigente es `p3` (arriba). El alcance integral aprobado sigue vigente como hoja de ruta del producto final; este bloque `p1` es documento histórico y no es la fuente de la fase base.

# 🎭 Plan operativo — Frontend integral del producto final (`full-frontend-plan`, p1)

> Reconstrucción durable desde artefactos de la spec `spec-final-frontend-001` (`docs/specs/final-frontend/`, estado **draft**). Reemplaza al payload no persistido; no es recuperación literal de él. Un único payload secuencial, sin fan-out: todas las fases consumen el mismo ancla — el inventario canónico de **162 OP** (`backend-inventory.md`). La spec draft **no autoriza implementación**; cada acto exige orden explícita del operador.

> **Nota de persistencia (`Lore Master`, `p1`, 2026-10-01).** Cuerpo técnico copiado literal del `plan_payload` de `Cunning Bard`, sin validaciones agregadas. Mapeo desde las 8 secciones del payload a las 9 de `docs/plan-persistence.md`: §1→§1, §2→§2, §3→§3, §4 *Archivos probables*→subsección de §2, §5→§5, §6 *Riesgos*→§7, §7 *Verificaciones*→§6, §8→§8; §4 *Dependencias* y §9 *Referencia a spec* son derivaciones de la persistencia. Las citas internas del payload a «sección 4»/«§4» refieren a *Archivos probables* (aquí bajo §2). Persistencia mecánica `TIER: FAST`: este archivo no aprueba la spec, no autoriza implementación y no declara veredicto de gate.

---

## 1. Objetivo

Implementar el frontend integral del producto final en `front/` (Vue 3 Composition API `<script setup>` en **JavaScript**, Pinia **en memoria**, Vue Router `createWebHistory`, **CSS vanilla**, Inume Design System literal 1:1), consumiendo las **161 OP de negocio** del inventario canónico a través de las **36 pantallas SCREEN-*** y los **92 R-DOM**, con la persistencia de apariencia de **8 ejes** como **única extensión de backend** — ejecutable solo tras spec aprobada, gate superado y orden explícita.

## 2. Scope

- **Secuencia única F0→F10**, estrictamente ordenada; cada fase cierra con estado de entrega antes de abrir la siguiente. Sin workstreams paralelos.
- **Infraestructura compartida primero**: sesión (cookie HttpOnly + CSRF), contexto (tenant vía `X-Tenant-Code` desde captura manual en login — D-03; unidad activa vía `X-Org-Unit-Code`), anti-carrera por `generation` (R-AUTH-09), purga total en logout (R-AUTH-08), cliente HTTP único, router + guards + shell/navbar DS.
- **Módulos de dominio**: organización (unidades/recintos/preview-migración), identidad (temporal/promoción/asignaciones/puestos/holders/membresías), autorización (RBAC/permisos/scopes/overrides/consultas/auditoría), armería (armerías/armas/calibres), tiro (polígonos/lecciones/fracciones/elegibles/captura/resultados/dashboard/reportes), ejercicios (consumos en 2 niveles).
- **Apariencia 8 ejes**: fase F9 separada, única excepción de backend (`front/AGENTS.md` §Límites), con separación explícita entre API existente (OP-PRF-001/002 legacy) y propuesta futura (endpoint `design-system/` diseñado en TD§5.3, **no implementado** — referencia indirecta, TD no leído por writer activo).
- **read_scope estable** para fases de implementación y gates futuros: los artefactos durables leídos (`spec-meta.yaml`, `backend-inventory.md`, `backend-contracts.md`, `contracts/*.md` ×5, `requirements/*.md` ×5, `design-system/*.md` ×3, `experience/screens.md`, `experience/navigation.md`, `experience/screens/*.md` entregados) **más** las entregas futuras de los writers activos cuando estén disponibles: `experience/flows.md`, `experience/states.md`, `experience/screens/appearance.md`, `requirements.md`, `technical-design.md` (en particular §4 rutas, §5 preferencias, §8 endpoints de soporte). La integración final de la spec cruzará esas entregas; los gate reviewers verifican seguridad/API/DB/escenarios desde la spec integrada. No se autorizan auditorías ampliadas fuera de este read_scope.
- **Ancla de baseline** (citada, no porcentual): `front/src/main.js:1-6` sin router; `front/package.json:9-16` sin `vue-router`.

### Archivos probables (sección 4 del payload)

**Existentes — anclas verificadas (lectura):**
- `front/src/main.js` — montaje actual sin router; punto de anclaje de `router` y bootstrap.
- `front/package.json` — dependencias actuales; entrada de `vue-router@5.3.1` solo con orden (D-05).

**Existentes — evidencia indirecta (no leídos; cita de terceros):**
- `front/src/App.vue`, `front/src/styles/dashboard.css` (imports en `main.js:3-4`).
- `front/src/api/dashboard.js` (`screens/access-context.md:132`: conserva su contrato; SCREEN-DASHBOARD lo integra bajo el shell).

**Módulos futuros probables** (write sets referenciados por módulo; el naming final lo fija `Code Transmuter` según convenciones del repo):
- `front/src/router/` — tabla de rutas de `navigation.md:35-72` (36 rutas + catch-all; literales `/personas/roles|scopes|permisos|overrides` declarados **antes** que `/personas/:idUsuario`) + guards (`navigation.md:113-128`) + `scrollBehavior`.
- `front/src/stores/` — `session` (estados `booting/ready/failed`, `must_change_password`, `permissions/scopes/assignments`), `context` (tenant, unidad activa, `generation` anti-carrera), `appearance` (F9: 8 ejes en memoria + cola de persistencia).
- `front/src/api/http.js` — cliente compartido: cookies de sesión, `X-CSRFToken` en mutaciones, `X-Tenant-Code`/`X-Org-Unit-Code` desde stores, `AbortController`, descarte por `generation`, normalización `400` (errores por campo), `403` (negocio con `detail` literal vs contexto perdido), `429` (`Retry-After`, sin reintento automático), error de red explícito. Cero datos de respaldo inventados.
- `front/src/api/<dominio>.js` — un módulo por dominio (organización, identidad, autorización, almacén, tiro, ejercicios, auth, preferencias).
- `front/src/composables/` — máquina de estados de listado (`idle/loading/ready/empty/denied/error`), formularios con errores anclados, selectores compartidos (lookup `OP-UNT-009`, elegibles `OP-UNT-010`/`OP-AZC-004`, roles por categoría `OP-AZC-002`).
- `front/src/components/shell/` — sidebar fija 250px (colapsada 75px), topbar 70px, `main.page-content`, menú por módulos con visibilidad por `context.permissions` y `aria-current`, backdrop móvil, dropdown de usuario (unidad activa, personalizador, contraseña, cerrar sesión), breadcrumbs (`ui-breadcrumb.html`).
- `front/src/components/common/` — tabla DS (`tables-basic.html`), modal (`ui-modal.html` con focus trap), formularios (`forms-basic/validation`), badges, alerts, spinners, placeholders, toasts, tabs — reproducidos 1:1 desde las páginas citadas en cada ficha de pantalla.
- `front/src/views/<dominio>/` — las 36 pantallas SCREEN-* (vistas delgadas como superficie de composición; lógica en stores/composables, componentes por sección).
- `front/src/styles/` — tokens y capas del DS reproducidos 1:1 en CSS vanilla: equivalentes de `styles.css`, `baseui.css`, `baseui-content.css`, `baseui-forms.css`, `baseui-tables.css`, `baseui-overlays.css`, `auth.css`, `errors.css`, `theme-customizer.css` (capa final, selectores `html[data-*]`). Fuente: biblioteca externa `../../Inume Design System/` (referencia documental, no paquete importable; la carpeta interna homónima **no** es fuente).
- **Solo F9 y solo con autorización** (backend): `apipoligono/models.py` (campos `ds_*` en `Usuario`, D-06), `apipoligono/serializers.py`, `apipoligono/views.py`, `apipoligono/urls.py` (subrecurso `me/preferences/appearance/design-system/`), `apipoligono/migrations/` (ORM, revisada, con tests; B-04: sin SQL por motor).

## 3. Out of scope

Protege el Branch Scope Guard — lo que no está aquí no se toca:

- **Backend**, salvo la extensión de apariencia de F9, y solo con spec aprobada + gate superado + orden explícita. No se extiende a autenticación, RBAC, multi-tenant, infraestructura ni despliegue.
- **El proceso backend reportado en `127.0.0.1:8000`**: se reusa; no se arranca, reinicia ni detiene (estado reportado, no verificado).
- **Ejecución sin orden específica por acto**: `pnpm dev`, navegador, tests, build, instalación de dependencias (`vue-router@5.3.1` incluido), migraciones, escritura en BD.
- **Capacidades sin endpoint** (D-02 abierta, no bloqueante): signup, exportación en servidor, transferencia de stock, validación de resultados, `edit_self`, comandantes de unidad, historial global de asignaciones, edición del catálogo de permisos — **sin botones, sin pantallas, sin simulación**; se reportan como hueco (`screens.md:157-163`, `screens/exercises.md:122-131`).
- **`OP-RNG-006`** (`DELETE /poligonos/{id}/`) como acción destructiva disponible por defecto: `range:delete` sin mapa (`backend-inventory.md:232`); denegación visible si llega a solicitarse (R-DOM-SHT-003).
- **`localStorage`/`sessionStorage`/cookies de estado** para cualquier dato ( Pinia es solo memoria; apariencia persiste contra backend).
- **TypeScript, frameworks de estilos, preprocesadores, librerías de componentes UI, tooling o comandos nuevos** sin orden.
- **Fixtures, mocks, datos de demo, registros sintéticos, `0` falsos**: ausente = `—`, vacío = estado vacío, error = error explícito.
- **Escribir o editar** `flows.md`, `states.md`, `appearance.md`, `requirements.md`, `technical-design.md` ni documento alguno (writers activos; documentación es de `Lore Master`).
- **Resolver B-01 en backend** (`primary_unit()` en `views.py:880`, hipótesis estática no comprobada): se trata como posible error visible en la pestaña resultados; ningún cambio de esta spec lo toca.
- **Inventar shapes ante decisión crítica faltante**: se señala con fuente y se detiene, no se supone.

## 4. Dependencias

Derivadas de §5 Pasos y de las notas del orquestador (workstream `full-frontend-plan`, spec `spec-final-frontend-001`). Una línea por dependencia.

**Entre fases (secuencia única F0→F10):**

- `F0` ← ninguna fase; prerequisito duro de F1–F10 (spec `approved` por orden explícita del operador, write sets de writers activos integrados en la spec, autorizaciones específicas por acto, backend en `127.0.0.1:8000` constatado o declarado no verificado y reutilizado).
- `F1` ← `F0`.
- `F2` ← `F1`.
- `F3` ← `F2`.
- `F4` ← `F3` (selectores de unidad elegible).
- `F5` ← `F4` (selectores de rol/puesto/persona).
- `F6` ← `F3` (selector de unidad).
- `F7` ← `F6` (enlaces a arma/calibre y selectores de captura).
- `F8` ← `F6` (selectores de arma/calibre activo) y `F3` (unidades participantes).
- `F9` ← `F1` (panel en topbar, memoria) y `F2` (contexto autenticado); ejecución **solo** con spec aprobada + gate superado + orden explícita.
- `F10` ← `F2`–`F8`, y `F9` o su hueco declarado (no bloqueante).

**Externas:**

- Spec `spec-final-frontend-001` en estado `draft` (`./spec-meta.yaml`): no autoriza implementación; F0 es gate duro.
- Entregas de writers activos: `experience/flows.md`, `experience/states.md`, `experience/screens/appearance.md`, `requirements.md`, `technical-design.md` — precondición de F0, consumidas por la integración final de la spec; este plan no las duplica.
- Ancla canónica compartida por todas las fases: inventario de **162 OP** en `backend-inventory.md`, con `backend-contracts.md` y `contracts/*.md`.
- Fichas de pantalla y navegación: `experience/screens.md`, `experience/navigation.md`, `experience/screens/*.md` entregados.
- Biblioteca externa Inume Design System (`../../Inume Design System/`): fuente visual 1:1, referencia documental (no paquete importable).
- Backend en ejecución reportado en `127.0.0.1:8000` (estado reportado, no verificado): se reutiliza; no arrancar, reiniciar ni detener.
- `vue-router@5.3.1`: dependencia no instalada; su instalación requiere orden explícita (D-05).
- Evidencia de reconstrucción del payload: `/tmp/opencode/frontend-plan-durable.jsonl` (transcripción de sesión; ruta efímera, citada como procedencia, no como fuente durable).

## 5. Pasos

Tres actos: preparar el escenario (F0–F2), ejecutar el repertorio de dominio (F3–F8), cerrar con los 8 ejes y el telón (F9–F10). Ninguna fase fuera de guion.

### Acto I — Preparar

**F0 — Precondiciones (gate, sin código).**
- Cobertura: ninguna OP; habilita todo el plan.
- Dependencias: ninguna. Es prerequisito duro de F1–F10.
- Pasos: (1) transición de `spec-final-frontend-001` a `approved` por orden explícita del operador (`spec-meta.yaml:63-64`); (2) integración de los write sets activos entregados (`flows.md`, `states.md`, `screens/appearance.md`, `requirements.md`, `technical-design.md`) en la spec final — este plan los consume como precondición, no los duplica; (3) autorizaciones específicas por acto: instalación de `vue-router@5.3.1`, `pnpm dev`/navegador para verificación observable, tests; (4) constatar —o declarar no verificado— el backend reportado en `127.0.0.1:8000`; reutilizarlo.
- Finalización observable: orden del operador registrada; documentos de writers integrados; autorizaciones por acto definidas. Sin esto, **no existe fase de código**.

**F1 — Infraestructura compartida (la columna del payload único).**
- Cobertura: `OP-AUT-002` (FL/bootstrap), `OP-AUT-005` (FL/sesión), `OP-AUT-006` (declarada infraestructura, sin pantalla ni consumo); reglas R-AUTH-06…09, R-ROUTER-01…08, R-APP-06, R-RES-22/23, R-DAT-01…05 (citadas indirectamente vía `navigation.md`/`screens.md` — `requirements.md` no leído).
- Dependencias: F0.
- Pasos: (1) instalar `vue-router@5.3.1` con orden y montar `createRouter`+`createWebHistory`, `RouterView` en `App.vue` (D-05 deroga hash manual); (2) reproducir capas base del DS 1:1 (tokens, shell, tipografía 14px/400/1.5, `font-synthesis-weight: none`) según `visual-contract.md` §§2–3; (3) construir `http.js` con el contrato de la sección 4; (4) store `session` con estado `booting` que gatea guards hasta resolución terminal de `OP-AUT-002` (R-ROUTER-06: deep link a `/tiro/lecciones/42` no expulsa a login); (5) store `context` con `generation` anti-carrera y purga dependiente en cambio de unidad/logout/expiración; (6) tabla de rutas completa con `meta` (`pública`, `requiresTenant`, roles de auditoría) y literales antes que params; (7) guards: global (sesión→`login` con `query.redirect`; `must_change_password`→`password-required`; `/personalizador` sin contexto→`login`), por ruta (`requiresTenant` sin tenant→`contexto-perdido` sin bucle), `beforeEnter` de detalle (recurso fuera de `permissions`→estado `denied` con `detail`), `/auditoria` y `/personas/overrides` como intento permitido con `403` pintado; (8) shell DS completo + menú por módulos sin entradas huecas; (9) componentes comunes de estado (loading/vacío/error/denied) y tabla/modal/form base.
- Finalización observable: **estática** — diff sin `localStorage`, sin TS, sin datos inventados; tabla de rutas y guards coinciden con `navigation.md`; **observable (con autorización)** — recarga profunda reconstruye sesión antes de resolver; logout aborta en vuelo, purga y navega a `/login` sin rehidratación.

**F2 — Acceso, sesión y contexto (7 pantallas).**
- Cobertura: SCREEN-LOGIN, SCREEN-RECOVERY, SCREEN-PASSWORD-FORCED, SCREEN-CONTEXT, SCREEN-DASHBOARD, SCREEN-CONTEXT-LOST, SCREEN-NOT-FOUND. OP-AUT-001/002/003, OP-RCV-001…004, OP-USR-013 (modo propio forzado; compartido con F4). FL/bootstrap, FL/sesión, FL/contexto-unidad, FL/recuperación, FL/contraseña (parcial).
- Dependencias: F1.
- Pasos según `screens/access-context.md` (fichas completas, no duplicadas aquí): login con institución real (D-03: sin lista de tenants ni código hardcodeado; alimenta `X-Tenant-Code`); recuperación en 4 pasos secuenciales en memoria (pasos 1–2 anti-enumeración; paso 4 campo `nueva_contrasena` con `errores[]`; expiración 5 min; salir→login); forzado sin `old_password` bajo flag y recarga de contexto al éxito; selección de unidad solo desde pertenencias/asignaciones activas del contexto (`403` con motivo literal, sin reintento); contexto-perdido sin reintento automático; 404 catch-all con CTA según sesión; migrar el dashboard existente bajo shell/router **conservando el contrato de `front/src/api/dashboard.js`** (métricas solo derivadas de datos reales, cifra rotulada por lección/fecha, `—` nunca `0` falso).
- Finalización observable: criterios §Estados de cada ficha del volumen; **con navegador autorizado**: flujo login→contexto→dashboard con tenant real y `query.redirect` respetado.

### Acto II — Repertorio de dominio

**F3 — Organización (4 pantallas).**
- Cobertura: SCREEN-UNITS, SCREEN-UNIT-DETAIL, SCREEN-PRECINCTS, SCREEN-PRECINCT-DETAIL. OP-UNT-001…010, OP-RCT-001…008 (18 OP). R-DOM-ORG-001…017. FL/eliminar-unidad, FL/recinto-unidades, FL/selectores (base compartida).
- Dependencias: F2.
- Pasos: árbol client-side desde `parent_code` sin inferir ramas; alta/edición con escribibles/RO del contrato excluyendo `id/tenant/parent_code`; **eliminación con migración en 2 pasos bloqueantes** (preview de 8 contadores con confirmación bloqueada hasta correspondencia; confirmación con advertencia **literal** de que `assignments` solo se informa —no se reasigna—; destino desde elegibles; sin padre→destino obligatorio; nunca la propia unidad); recintos CRUD + panel de relaciones por `unit_code` con `unit_count` devuelto y relación ausente como error explícito; selectores compartidos (lookup con vacío/sin-coincidencias/denegado como estados distintos; elegibles) que reusan F4–F5.
- Finalización observable: `screens/organization.md` §Estados por pantalla; R-DOM-ORG-008…011 recorridos en el flujo de 2 pasos.

**F4 — Identidad (5 pantallas).**
- Cobertura: SCREEN-USERS, SCREEN-USER-DETAIL, SCREEN-POSITIONS, SCREEN-POSITION-DETAIL, SCREEN-MEMBERSHIPS. OP-USR-001…016, OP-POS-001…009, OP-MEM-001…006, OP-AZC-002, OP-AZC-004 (33 OP; OP-USR-012 compartido con F7, OP-USR-013 con F2). R-DOM-ID-001…019. FL/asignación-principal, FL/asignaciones, FL/contraseña (modo otro), FL/holders.
- Dependencias: F3 (selectores de unidad elegible).
- Pasos: listado con búsqueda/orden client-side sobre el array real (sin paginación inventada); alta formal con advertencia de **promoción de temporal** por RUT coincidente (el alta temporal jamás se ofrece como promoción); alta temporal que no inicia sesión y no duplica fila local ante error; ficha con edición compartida PUT/PATCH, eliminación con confirmación destructiva, modal de asignación principal (007/008), desactivación con aviso de tirador preservado/recreado, agregar (200 idempotente y 201 son éxito), quitar con aviso de restauración, cambio/reset de contraseña con bloqueo propio (`400` visible), estado de bloqueo/desbloqueo sin inventar fecha ausente; puestos con `*_code_write` y nota recinto↔`todo_recinto`; ficha de puesto con consecuencia de holder único, histórico **devuelto** sin cronología inferida; membresías como pertenencia orgánica ≠ puesto/assignment, con refresco de contexto antes de mostrar unidad efectiva y permisos derivados del par `resource_name='position'` (T-06).
- Finalización observable: `screens/identity.md` §Estados; R-DOM-ID-005…011 en modales de credenciales/asignaciones.

**F5 — Autorización (5 pantallas).**
- Cobertura: SCREEN-ROLES, SCREEN-SCOPES, SCREEN-PERMISSIONS, SCREEN-OVERRIDES, SCREEN-AUDIT. OP-ROL-001…006, OP-SCP-001…002, OP-PRM-001…002, OP-RPR-001…006, OP-PPR-001…006, OP-OVR-001…006, OP-AZC-001, OP-AZC-003, OP-AUT-004 (36 OP). R-DOM-AZ-001…010.
- Dependencias: F4 (selectores de rol/puesto/persona).
- Pasos: roles con mutación solo en contexto administrativo y badge `is_system`; scopes y permisos **solo lectura** (sin botones de escritura); permisos con 4 pestañas internas (catálogo con tooltips desde `OP-AZC-001` — acción catalogada ≠ endpoint expuesto; matriz rol→permiso con rol de sistema bloqueado salvo `super_admin`; matriz puesto→permiso solo posiciones del tenant; personas por unidad con `include_descendants` y `400/404/403` distintos); overrides con `account`/`allowed` requeridos, `created_by` RO y recordatorio del orden de evaluación efectivo; auditoría con `limit ≤ 500`, sin paginación inventada, `403` como denegación visible por rol y `reason` literal.
- Finalización observable: `screens/authorization.md` §Estados; R-DOM-AZ-006…010.

**F6 — Armería (4 pantallas).**
- Cobertura: SCREEN-ARMORIES, SCREEN-WEAPONS, SCREEN-WEAPON-DETAIL, SCREEN-CALIBERS. OP-ARM-001…006, OP-WPN-001…006, OP-CAL-001…006 (18 OP). R-DOM-ARM-001…012.
- Dependencias: F3 (selector de unidad).
- Pasos: armerías con unidad inyectada visible tras éxito y edición que jamás envía `id/tenant/unidad derivada/conteo/timestamps`; armas con `tipo_arma` limitado a los 6 valores del dominio y selectores `armory_code_write`/`calibre_code_write` desde códigos reales; unicidad `modelo+serie` como error visible sin deduplicar; ficha de arma con `400` de armería vacía anclado al campo y eliminación **sin simular transferencia de stock**; calibres como catálogo global con mutación exclusiva `super_admin` (botones ausentes en otro contexto, sin tooltip falsificado) y refresco de selectores dependientes. Usar los códigos de permiso **literales verificados** (`view_warehouse`, `create_warehouse_records`, …), no la etiqueta abreviada del inventario (nota de transcripción, `screens/armory.md:9`).
- Finalización observable: `screens/armory.md` §Estados; R-DOM-ARM-007/008/011.

**F7 — Tiro (6 pantallas).**
- Cobertura: SCREEN-RANGES, SCREEN-RANGE-DETAIL, SCREEN-LESSONS, SCREEN-LESSON-DETAIL, SCREEN-FRACTION-DETAIL, SCREEN-RESULTS-CAPTURE. OP-RNG-001…007, OP-LES-001…012, OP-FRC-001…008, OP-RES-001…006 (33 OP) + OP-USR-012 en flujo de captura. R-DOM-SHT-001…020. FL/captura-tiro.
- Dependencias: F6 (enlaces a arma/calibre y selectores de captura).
- Pasos: polígonos **sin acción destructiva por defecto** (OP-RNG-006, `range:delete` sin mapa); ficha de polígono con lecciones de `OP-RNG-007`; lecciones con participantes por `*_codes_write` y unidad efectiva devuelta cuando se omiten; **ficha de lección con 5 pestañas de carga independiente** (fracciones con CRUD integrado en modales —duplicidad lección+número anclada a `numero_fraccion`—; tiradores con vacío≠error; resultados donde `403` = «sin permiso de detalle» con oferta de agregadas **sin sustituir detalle por resumen** y B-01 tratado como posible error explícito; resumen rotulado por lección/fecha nunca institucional; reporte con `aggregate_only: true` ⇒ no solicitar ni representar desgloses personales/de arma; única métrica derivada `acertados/total*100` con un decimal y `—` si `total=0`); participantes vía `OP-LES-012` sin convertirlo en alta; ficha de fracción con `OP-FRC-008` gated por `can_read_detail`; **captura** con selectores exclusivamente desde los arrays `usuarios`/`armas` de `OP-FRC-007`, FKs directas, duplicidades ancladas al selector/carril, alta temporal en flujo y deep link que resuelve contexto con `OP-FRC-003` antes de pintar.
- Finalización observable: `screens/shooting.md` §Estados; R-DOM-SHT-010/012/016…018; alcance restringido de tirador rotulado.

**F8 — Ejercicios y consumos (4 pantallas).**
- Cobertura: SCREEN-EXERCISES, SCREEN-EXERCISE-DETAIL, SCREEN-AMMO-CONSUMPTION, SCREEN-WEAPON-CONSUMPTION. OP-EJR-001…006, OP-CMN-001…006, OP-CAR-001…006 (18 OP). R-DOM-EXC-001…014. FL/consumo-munición.
- Dependencias: F6 (selectores de arma/calibre activo), F3 (unidades participantes).
- Pasos: ejercicios con `tipo_ejercicio` limitado a 5 valores y participantes reales; ficha con consumos relacionados por **filtrado client-side** sobre el array retornado (no existe endpoint de consumos por ejercicio; no se inventa) y baja sin prometer cascada; consumos de munición (nivel 1) sin inyectar unidad desde la UI, `calibre_code_write` solo desde calibre activo del catálogo y sin deducir calibre de tipo/modelo; consumos por arma (nivel 2) con selectores desde respuestas reales, duplicidad consumo+arma anclada y **sin recalcular stock** (no es dato contractual). Huecos D-02 sin botón: export, transferencia, validación (R-DOM-EXC-014).
- Finalización observable: `screens/exercises.md` §Estados + §Huecos; recorrido nivel 1 → nivel 2 enlazado.

### Acto III — Cerrar

**F9 — Apariencia 8 ejes (única extensión de backend).**
- Cobertura: SCREEN-PERSONALIZER (36/36). OP-PRF-001/002 **legacy trazado que no gobierna los 8 ejes**; endpoint futuro `GET|PUT|DELETE /api/me/preferences/appearance/design-system/` — diseñado (TD§5.3, referencia indirecta), **no implementado**; flag `new-api` activo (`spec-meta.yaml:81-83`). Precondición entregable: `screens/appearance.md` (writer activo — **no leído aquí**).
- Dependencias: F1 (panel en topbar, memoria) y F2 (contexto autenticado); ejecución **solo** con spec aprobada + gate superado + orden explícita (excepción acotada de `front/AGENTS.md` §Límites).
- Pasos backend (solo autorizados): campos `ds_*` en `Usuario` (D-06: `palette`/`density` quedan intactos y sin uso visual — D-01 retirada); migración ORM revisada con tests (B-04: sin SQL por motor); endpoint propio del usuario autenticado (lectura/escritura); `manage.py check` + tests dirigidos con orden; workflow estándar del backend AGENTS.md.
- Pasos frontend: panel con los catálogos **exactos** de `customizer-catalog.md` (theme 2, accent 27, bg 26 —preservando los 26 ejecutables pese a la discrepancia con los 19 narrativos de DESIGN.md—, font 9, radius 3, iconfam 7, ambient 8, ambcolor 7), transliterados 1:1 sin recorte ni nomenclatura propia; radiogroups con `aria-checked`, roving `tabindex`, flechas/`Home`/`End`, panel no modal con cierre `Escape`; reglas de eliminación de atributo por eje (`neutral/play/soft/default/accent` eliminan atributo; `accent`/`ambient` siempre escriben); **reset** a defaults lógicos `dark/mint/command/ibm-plex/square/phosphor/embers/accent`; persistencia en memoria + backend por usuario (autosave con cola), **cero `localStorage`**; cambio de unidad conserva apariencia (R-APP-06); logout purga la cola.
- Separación explícita: uso de API existente (legacy PRF, sin efecto visual sobre los 8 ejes) ≠ propuesta futura (endpoint `design-system/`). Si la autorización de backend no llega, SCREEN-PERSONALIZER declara el hueco sin persistencia alternativa — no bloquea capacidades ajenas.
- Finalización observable: volumen `appearance.md` una vez entregado + `customizer-catalog.md` §Persistencia; con navegador autorizado, valor persistido verificado al recargar y en segunda sesión del mismo usuario contra backend real.

**F10 — Integración y cierre observable.**
- Cobertura: matriz completa OP→SCREEN (`screens.md:73-138`) — 161 OP de negocio con pantalla o integración justificada; `OP-AUT-006` declarada infraestructura. Mapa de enlaces entre entidades (`navigation.md:130-157`), breadcrumbs canónicos, re-consulta sin caché persistente.
- Dependencias: F2–F8; F9 o su hueco declarado (no bloqueante).
- Pasos: auditoría por ID (sin reproducir catálogos) de cada OP contra su consumidor en la matriz; `RouterLink` completos solo donde el identificador existe en la respuesta (si no, texto plano); enlaces entre entidades según mapa; cadena de breadcrumbs `Inicio › {Módulo} › {Listado} › {Recurso}` con etiqueta resuelta desde respuesta; verificación observable por pantalla (estados carga/vacío/error/denied/guardado) **solo con navegador autorizado**; comparación visual contra páginas DS externas citadas en cada ficha; informe de huecos (D-02, B-01 hipótesis, `range:delete`, 8 ejes si F9 sin autorización, discrepancia 26/19 bg); tests del quality gate (`spec-meta.yaml:20`) con orden explícita.
- Finalización observable: cobertura 161/161 trazada o hueco declarado con fuente; cada pantalla pinta sus estados sin datos falsos; fidelidad DS verificada u observación pendiente declarada — nunca afirmada sin evidencia.

## 6. Criterios de aceptación / verificación

Postura honesta: **tests, build y lint no son prueba del resultado de usuario**; los criterios de pantalla/flujo son observables con navegador o evidencia del operador, cuando se autoricen. Escalera proporcional por fase (`docs/proportionalidad.md > Escalera de verificación`, referenciada, no replicada):

| Nivel | Cuándo | Aplicación |
|---|---|---|
| Inspección/diff | Siempre, cada fase | Contraste estático contra contratos (`contracts/*.md`), fichas (`experience/screens/*.md`), `navigation.md` y `customizer-catalog.md`; ausencia de `localStorage`, TS, datos inventados, botones huecos. |
| Test dirigido | Solo con orden explícita | Quality gate `tests: required` (`spec-meta.yaml:20,70-71`): cliente HTTP (CSRF/headers/abort/generation), guards (booting, redirect, requiresTenant), validación de forma, anti-carrera, autosave de apariencia, migración F9. |
| Lint/typecheck | N/A | Sin TS por mandato; sin lint declarado en `package.json` — añadirlo requiere orden. |
| Build parcial | Solo con orden | `vite build` no declarado como script; su creación es cambio de tooling sujeto a autorización. |
| Observable navegador / evidencia de usuario | Solo con orden | Criterios §Estados de cada ficha SCREEN-*; flujos F2 (login→contexto), F3 (migración 2 pasos), F7 (captura con selectores reales), F9 (persistencia entre sesiones); comparación 1:1 contra páginas DS externas. |

Verificación de cobertura (F10, estática, siempre disponible): auditoría por ID de las 161 OP de negocio contra la matriz `screens.md:73-138`, de los 92 R-DOM contra su fase, y de las 36 SCREEN contra su volumen. Ninguna cifra de progreso se afirma sin fuente; el estado baseline se cita (`main.js:1-6`, `package.json:9-16`), jamás como porcentaje.

## 7. Riesgos / bloqueos

1. **Spec `draft`** (`spec-meta.yaml:7`): nada de este plan autoriza implementación; F0 es gate duro. La aprobación exige orden explícita del operador.
2. **Writers activos**: `flows.md`, `states.md`, `appearance.md`, `requirements.md`, `technical-design.md` en progreso. Las reglas citadas indirectamente (R-AUTH/R-ROUTER/R-RES/R-DAT/TD§§) pueden refinarse en la integración final; este plan las consume como precondición y **no** declara haberlas leído de primera mano.
3. **Reconstrucción, no recuperación literal**: el payload anterior no persistido pudo contener decisiones no documentadas; si el gate detecta divergencia, la fuente de verdad es la spec integrada, no la memoria de este plan.
4. **Endpoint 8 ejes inexistente**: la persistencia real de apariencia depende de F9 backend (única excepción, `new-api` flag). Sin autorización, hueco declarado; sin parche cliente ni storage local.
5. **B-01** (`primary_unit()` fuera de ámbito en `OP-LES-009`, hipótesis estática no comprobada en runtime): la pestaña resultados lo trata como error explícito; no se corrige backend sin autorización ni se bloquea la pantalla por reflejo.
6. **B-04** (motor de BD no confirmado): migración de F9 solo ORM, sin SQL por motor ni procedimiento de producción.
7. **D-02 abierta**: capacidades sin endpoint no generan UI; riesgo de expectativa no cumplida si el operador las supone — se reportan.
8. **`range:delete` sin mapa**: `OP-RNG-006` puede recibir `403`; la UI no ofrece la acción por defecto (inferencia estática, no prueba runtime).
9. **Filtros/paginación/orden globales no comprobados** (`backend-inventory.md:231`): todo filtrado es client-side sobre arrays retornados; prohibido inventar query params de filtro.
10. **Sin tooling de tests/build/lint declarado** (`package.json:6-8` solo `dev`): el quality gate `tests: required` exigirá tooling que **requiere orden del operador**; riesgo de bloqueo en el cierre de la spec, no en la planificación.
11. **Fidelidad DS 1:1 no observable aún**: la comparación visual exige navegador + autorización; discrepancia registrada 26 vs 19 fondos — se preservan los 26 ejecutables.
12. **Runtime backend reportado, no verificado**: cualquier comprobación contra `127.0.0.1:8000` reutiliza el proceso; nunca arrancar/reiniciar/detener.
13. **Zonas sensibles** (risk flags `auth`, `permissions`, `sensitive-data`): F1/F2/F4/F5 tocan sesión, CSRF, credenciales y RBAC — los errores deben ser literales y visibles; anti-carrera y purga son requisitos de seguridad, no cosmética.
14. **Colisión de rutas `/personas/*`**: literales antes que `:idUsuario` en la declaración del router; conducta estándar no verificada en runtime hasta F10.

> **Nota del orquestador (recepción, 2026-10-01):** el payload fue recibido con reservas de contrato/scope para corrección focalizada antes del gate. Se persiste como `p1`; la spec sigue en `draft`, sin aprobar y sin ejecución.

## 8. Handoff para Code Transmuter

- **Qué implementar**: las fases F1→F10 en orden estricto, desde el plan persistido (`PLAN_PATH` que entregará `Lore Master` — leerlo de disco; no aceptar el plan re-pegado en chat). F0 pertenece al orquestador/operador, no a ti.
- **Skills a cargar si el orquestador las indica**: `vue`, `vue-best-practices`, `vue-router-best-practices`, `pinia` — con la adaptación obligatoria: **JavaScript, no TypeScript** (`front/AGENTS.md:18` prevalece sobre la preferencia TS de la skill); Composition API `<script setup>`; vistas delgadas como superficie de composición; estado en composables/stores; setup stores de Pinia sin persistencia.
- **Límites de scope**: solo los módulos probables de §4 dentro de `front/`; backend únicamente en F9 con autorización explícita; nada de §3 Out of scope; cada fase cierra con `DELIVERED | BLOCKED | FAILED` + rutas tocadas antes de abrir la siguiente.
- **Reglas de datos**: backend real como única fuente; `—` para ausentes; vacío≠error≠denegado; `403` literal; `429` sin reintento; cero fixtures/mocks/`0` falsos; `generation` anti-carrera en cambio de unidad/logout/expiración.
- **Reglas visuales**: DS literal 1:1 desde la biblioteca externa (páginas y capas citadas en cada ficha); adaptar solo lo que la plataforma no pueda expresar, reportándolo y justificándolo explícitamente; nunca en silencio.
- **Verificación mínima al cerrar cada fase**: inspección/diff contra contrato y ficha; los niveles superiores (tests, build, navegador) **solo con orden explícita del operador** — y nunca presentados como prueba del resultado de usuario.
- **Ante hueco o decisión crítica faltante**: detener la fase, reportar con fuente (OP/R-DOM/SCREEN/contrato), no inventar shape ni simular capacidad.
- **Documentación**: no escribes `.md` ni specs; si el cierre de fase exige actualización documental (p. ej. `docs/12_GUIA_FRONTEND.md`), se señala en el handoff para que el orquestador delegue a `Lore Master`.

🪕 *Telón. El guion está completo: 11 fases, 36 pantallas, 161 operaciones de negocio trazadas, 92 requisitos de dominio asignados y un solo hueco de backend declarado sin disfraces. Que `Lore Master` lo materialice como `p1`; el veredicto, como siempre, no es mío.*

## 9. Referencia a spec

- **Spec asociada:** `spec-final-frontend-001` — *Frontend integral del producto final sobre el backend existente* (type: `full`).
- **Metadata (fuente única de verdad del estado):** [`./spec-meta.yaml`](./spec-meta.yaml) — estado, gates de calidad, revisiones especializadas, riesgo, decisiones (D-01…D-06), huellas de backend (B-01…B-04) y trazabilidad. El estado del plan se deriva de esta metadata; este archivo no lo duplica.
- **Volúmenes de la spec (modelo híbrido):** [`./index.md`](./index.md) como entrada; [`./requirements.md`](./requirements.md), [`./technical-design.md`](./technical-design.md), [`./verification.md`](./verification.md), [`./tasks.md`](./tasks.md); inventario y contratos de backend ([`./backend-inventory.md`](./backend-inventory.md), [`./backend-contracts.md`](./backend-contracts.md), `./contracts/`); experiencia (`./experience/`); design system (`./design-system/`); requerimientos por dominio (`./requirements/`).
- **Regla de lifecycle:** la spec en `draft` no autoriza implementación; la transición a `approved` exige orden explícita del operador (`spec-meta.yaml:63-64`).

---

## Historial de revisiones

### p3 — 2026-10-02 — cuerpo revisado por el gate `prg-frontend-build-base` (`BARD_CORRECTION_1`, `Lore Master`)

- **Motivo:** `PLAN_REVIEW_DISPOSITION` de `Cunning Bard` sobre `p2`/`r1` (nueve directivas, todas `accept`), arbitrada por el orquestador con veredicto `VALIDATED`. El `plan_payload_revised` sustituye el cuerpo `p2` en el slot operativo; `p2` no se conserva completo y su registro es esta misma entrada, mientras el bloque histórico `p1` sigue literal.
- **Delta breve (r1):** cuerpo transcrito literal del payload, con sus subsecciones `### Cambios r1` por sección. §3 gana la exclusión de ruta o pantalla de recaptura de tenant (`/contexto`) y fija ConnectionForm (`App.vue:355-360`) y `?tenant=` (`App.vue:293`) como única captura [D-seguridad-1]. §5 fija orden createApp → Pinia → router/guard, terminales `ready`/`failure` del guard, precedencia del contrato TD§2 sobre el JS actual con reporte de divergencia, invariantes de `generation`/purga/reentrada, forma inválida sin pintado parcial, `detail` literal del 403 y cero logs con PII [D-seguridad-1…-5, D-escenarios-criticos-2…-4]. §6 reescribe los riesgos 2–4 con esas mismas mitigaciones. §7 pasa a ocho escenarios con resultado esperado y deja la rama CSRF de mutaciones y los disparadores de purga como `NOT_VERIFIED` [D-seguridad-3, D-escenarios-criticos-5]. §8 propaga precedencia de contrato, ConnectionForm preservada, cero logs con PII y `NOT_VERIFIED` sin fakes. §1, §2 y §4 sin cambios de fondo, con la nota explícita del payload en cada una.
- **Derivaciones y punteros:** `§9` y `§10` ajustadas al estado real del gate (`p3`, `VALIDATED`, `r2`); la regla de lifecycle de `§10` deja de afirmar que el gate «no está despachado», porque ya no es cierto. Puntero interno de la nota del bloque histórico `p1` corregido de `p2` a `p3`. Sin cambio en `spec-meta.yaml`, en código ni en ningún otro documento.
- **Gate:** cierre `r2` escrito como escritura 3 de 4 (cuerpo `p3` + disposiciones + arbitraje + veredicto). `status` no se toca; `implementation_authorized: no`. La orden humana de ejecución existe por separado y este gate no la sustituye.
- **Procedencia del payload `p3`:** la primera llamada de retorno del resultado de `Cunning Bard` devolvió cero texto; el contenido se recuperó **exclusivamente** del transporte del resultado ya calculado en la misma sesión del autor — sin nueva revisión, sin re-despacho de reviewers y sin herramientas de auditoría. No es un segundo ciclo de corrección: `BARD_CORRECTION_2` no ocurrió.

### p2 — 2026-10-02 — cuerpo `frontend-build-base` (persistencia mecánica `TIER: FAST`, `Lore Master`)

- **Motivo:** el operador aprobó el alcance integral y ordenó la construcción; `Cunning Bard` entregó (HANDOFF `DELIVERED`, evidencia en `/tmp/opencode/frontend-build-base-plan.jsonl` — ruta efímera, citada como procedencia) un plan corto de fase base que **acota el arranque sin reducir** el alcance integral aprobado de `full-frontend-plan` `p1`. `p1` no se reconstruye: se preserva literal en este archivo como documento histórico.
- **Delta breve:** cuerpo vigente nuevo = 8 secciones canónicas del `plan_payload` en su orden literal (base TypeScript en `front/`: toolchain de tipos, vue-router, cliente HTTP tipado, stores tipados, shell DS 1:1, rutas `/` + catch-all; dos writers `Code Transmuter` A/B con write sets disjuntos y A como único integrador) + derivaciones de persistencia `§9 Dependencias` y `§10 Referencia a spec`. Frontmatter: `plan_id` `full-frontend-plan` → `frontend-build-base`; `payload_revision` `p1` → `p2`; `updated_at` → `2026-10-02`; `created_at` intacto. La restricción «sin TypeScript» de `p1` queda derogada por D-08.
- **Gate:** no despachado al cierre de esta escritura — sin checkpoint, sin veredicto, sin claves `review_gate`/`review_gate_revision`. `vue-router@5.3.1` transcrito literal sin corregir (bajo verificación del investigador; la disposición corresponde al autor).

### p1 — 2026-10-01 — cuerpo inicial `full-frontend-plan` (persistencia mecánica `TIER: FAST`, `Lore Master`)

- **Motivo:** persistencia inicial del plan reconstruido por `Cunning Bard` (frontend integral, fases F0–F10; procedencia `/tmp/opencode/frontend-plan-durable.jsonl`, citada en el propio bloque `p1`). Recibido con reservas de contrato/scope para corrección focalizada antes del gate (nota del orquestador, 2026-10-01, dentro del bloque `p1`).
- **Delta breve:** primera versión del cuerpo. Nunca revisada por el gate: ninguna ronda fue despachada antes de `p2`. Bloque preservado literal; hechos y documentos entregados no se reconstruyen.

---

## Plan Review Gate

### Ciclo `prg-frontend-build-base` — 2026-10-02 — veredicto `VALIDATED` (cerrado en `r2`)

> **Checkpoint durable prelaunch (`Lore Master`, 2026-10-02).** Escritura 1 de 4 del presupuesto del gate. Es ledger, no cuerpo: `payload_revision` sigue en `p2`, el bloque histórico `p1` se preserva literal y `## Historial de revisiones` no se toca. La selección queda congelada antes del primer despacho; este bloque no emite veredicto ni directivas y no autoriza implementación.

| Campo | Valor |
|---|---|
| `gate_id` | `prg-frontend-build-base` |
| `PLAN_PATH` | `docs/specs/final-frontend/implementation-plan.md` |
| `payload_revision` | `p2` |
| `review_gate_revision` | `r1` |
| Estado del gate | `REVIEWING` |
| Ejes diferidos | `none` |
| Ejes sin verificar | `none` |
| Revisión inicial | `r1` |
| Revisión final | pendiente — no emitida |
| `updated_at` | 2026-10-02 |

**Selección congelada** (por evidencia citable; `|A| = 2`):

| Reviewer | Eje | Evidencia que dispara el eje |
|---|---|---|
| `Dhampir-Slayer` | Seguridad y secretos — prioridad `1`, eje crítico | `implementation-plan.md:23` y `:27` (preservar al tipar cookies de sesión/CSRF/tenant, generation anti-carrera y purga/reload de stores); `:44` (paso 3: `http.ts` con TD§2 reglas 1–6 — `credentials:'include'`, `X-CSRFToken` solo en métodos no seguros leído de la cookie, `X-Tenant-Code` con sus excepciones, 403 de negocio con `detail` literal frente a 403 de contexto perdido, 429 sin reintento automático, `AbortController`); `:45` (paso 4) y `:51` (riesgo 2: zona sensible de transporte auth). |
| `QA-Goblin` | Tests de flujos críticos — prioridad `4` | `implementation-plan.md:44` (paso 3: store con `generation`/`reload`/purga idénticos al JS actual) y `:45` (paso 4: guard `booting` y recarga profunda de `/` bajo R-ROUTER-03/06); `:52` (riesgo 3: la semántica anti-carrera debe sobrevivir a la migración) y `:53` (riesgo 4: el guard `booting` no debe dejar pantalla en blanco); más el gate duro declarado por el propio plan en `§8` (`:66`): «QA (carga dashboard/guard/anti-carrera)». |

**Lote local del gate:** 2 reviewers (cap ≤ 4), dentro del rango `2-6` universal de `docs/delegation-rules.md > Matriz canónica de concurrencia`. Ningún otro reviewer se lanza; la selección no se amplía, sustituye ni recalcula durante el resto del gate.

**Invocaciones lógicas previstas** — ronda única, sin retry, sin segunda invocación:

| # | Reviewer | Eje | Packet previsto |
|---|---|---|---|
| 1 | `Dhampir-Slayer` | seguridad | `gate_id: prg-frontend-build-base`; `payload_revision: p2`; `review_gate_revision: r1`; `review_mode: plan`; `max_directives: 5`; `required_output: PLAN_REVIEW_REPORT` |
| 2 | `QA-Goblin` | tests de flujos críticos | los mismos campos, con `axis` propio del reviewer |

**`read_scope` común a ambos packets** (declarado por el gate; transcrito aquí, no releído en esta escritura):

- `docs/specs/final-frontend/implementation-plan.md:18-89` — cuerpo vigente `p2`; **excluye** el bloque histórico `p1` (`:93-329`).
- `docs/specs/final-frontend/technical-design.md` §§2 y 13.
- `docs/specs/final-frontend/contracts/auth-context.md`.
- `docs/specs/final-frontend/requirements/shared-session-data.md`.

**Fronteras de eje:** cada reviewer evalúa exclusivamente su eje. Queda como `out_of_axis` del otro el eje del compañero, y fuera de alcance toda API o endpoint nuevo, todo schema o migración, toda decisión de arquitectura ausente, toda afirmación de performance medible y todo alcance de UX o accesibilidad. `out_of_axis_observations` nunca se promueve a directiva dentro de este gate.

---

**Feedback `r1` (`Lore Master`, 2026-10-02) — evento `FEEDBACK_PERSISTED`.** Escritura 2 de 4 del presupuesto del gate. Es ledger de feedback: `payload_revision` **se replica en `p2`** (no hay cuerpo revisado en `r1`) y `review_gate_revision` **se replica en `r1`**. El checkpoint anterior, el bloque histórico `p1` y `## Historial de revisiones` quedan literales. **Sin veredicto** y sin avanzar `review_gate_revision`.

| Campo | Valor |
|---|---|
| `gate_id` | `prg-frontend-build-base` |
| `payload_revision` | `p2` — replicado, sin incremento |
| `review_gate_revision` | `r1` — replicado |
| Estado del gate | `REVIEWING` |
| Reportes recibidos | 2 de 2 — `Dhampir-Slayer` (seguridad), `QA-Goblin` (escenarios críticos); ambos `DELIVERED` sobre `p2`/`r1`, ambos `stance: partial` |
| Ejes diferidos | `none` |
| Ejes sin verificar | `none` |
| Revisión inicial | `r1` |
| Revisión final | pendiente — no emitida |

**Eco de revisión de los reportes (`_in`).** Los dos `PLAN_REVIEW_REPORT` declaran, cada uno en su campo `_in`, la revisión que leyeron:

| Reviewer | `payload_revision_in` | `review_gate_revision_in` | `stance` |
|---|---|---|---|
| `Dhampir-Slayer` | `p2` | `r1` | `partial` |
| `QA-Goblin` | `p2` | `r1` | `partial` |

Es eco de la revisión de entrada, no una revisión nueva: los valores no cambian.

**Forma de los reportes.** Ambos llegaron como texto plano del orquestador y quedan aquí resumidos, sin transcribir. Registrarlos **no constituye una auditoría nueva** del plan.

**Normalización de severidad.** Los reviewers etiquetan en su propio vocabulario (`alta`/`media`/`baja`, `high`/`medium`). Se normalizan al vocabulario del gate (`blocking`/`material`/`minor`) por el **efecto del reclamo**, conservando la etiqueta original: contradicción de bootstrap que impide ejecutar → `blocking`; exigencia de criterios o contrato material → `material`; invariante menor explícito → `minor`. Es una normalización de vocabulario, no una auditoría adicional ni una recalificación de fondo.

**Limitaciones preservadas.** Los `unverified` de ambos reportes se conservan tal cual: lo relativo a **runtime** y a **código fuera del `read_scope`** del gate sigue sin verificar. Ninguna de las directivas siguientes afirma runtime comprobado, y estas limitaciones **no** son resultados de usuario. Los dos `out_of_axis_observations` no se promovieron a directiva.

#### Directivas válidas

Las nueve superan los tres ejes de filtrado (dominio, scope, evidencia). `Disposición` y `Arbitraje` van `pendiente`: el Bard aún no emite `PLAN_REVIEW_DISPOSITION` y el arbitraje de cierre no ha ocurrido.

| ID | Eje | Severidad | Reclamo | Evidencia | Disposición | Arbitraje |
|---|---|---|---|---|---|---|
| `D-seguridad-1` | seguridad (fusionada) | `blocking` (original: alta) | `§5#4`/`§6#4`/`§7` — no prometer reconstrucción de tenant perdido en recarga sin fuente autorizada: distinguir navegación client-side con memoria de recarga real sin tenant, con terminal visible y nada de hardcode, storage o login inexistente | G-SES-1 `shared-session-data.md:188`; R-SES-004/005 `shared-session-data.md:49-58`, R-SES-016 `:124-129`, R-SES-022 `:162-165`; `auth-context.md:26`; plan `§3` excluye F2 | pendiente | pendiente |
| `D-seguridad-2` | seguridad | `material` (original: media) | `§5#3`, `§6#2` — TD§2 reglas 1–6 y R-SES-002..005 son contrato del transporte; el JS actual es fuente de comportamiento y toda divergencia se reporta, no se resuelve por criterio propio | `technical-design.md:159-176`; `shared-session-data.md:42-58`; plan `§4` y `§6` | pendiente | pendiente |
| `D-seguridad-3` | seguridad | `material` (original: alta) | `§5#6`, `§7` — con superficie GET-only se pueden observar cookies y tenant, pero no la rama CSRF de las mutaciones: esa queda `NOT_VERIFIED` | plan `§2` (sin CRUD ni login); `technical-design.md:162-163`; R-SES-003 `shared-session-data.md:45-48` | pendiente | pendiente |
| `D-seguridad-4` | seguridad | `minor` (original: baja) | `§5#3` — el predicado de 403 usa `detail` literal, sin normalización ni traducción | `technical-design.md:169-174`; R-SES-010/011 `shared-session-data.md:94-103` | pendiente | pendiente |
| `D-seguridad-5` | seguridad | `minor` (original: baja) | `§7` — sin logs de cuerpos ni de mensajes con PII | R-SES-018 `shared-session-data.md:134-137` | pendiente | pendiente |
| `D-escenarios-criticos-2` | escenarios | `material` (original: high) | `§5#1`/`§6#4`/`§7` — Pinia antes de router/guard; terminal `ready`/`failure` definido; cancelación, red, 403, 429 y 5xx terminan la espera y la navegación ocurre una sola vez; nunca pantalla blanca | `technical-design.md:226-229`; plan `§5`; R-SES-010/011 `shared-session-data.md:94-103` | pendiente | pendiente |
| `D-escenarios-criticos-3` | escenarios | `material` (original: high) | `§5#3`/`§6#3`/`§7` — generation/purga/reload con invariantes; la reentrada consulta el contexto vigente; el descarte no alcanzable sin UI faltante se declara `NOT_VERIFIED` sin inventar disparadores | `technical-design.md:178-180`; R-SES-015/016/019 `shared-session-data.md:120-147`; plan `§6#3` | pendiente | pendiente |
| `D-escenarios-criticos-4` | escenarios | `material` (original: medium) | `§5#3`/`§6#3`/`§7` — primera carga tras contexto, reentrada que reconsulta y forma inválida que muestra error sin datos parciales ni ceros; lo no observable sin fakes se declara `NOT_VERIFIED` | `technical-design.md:605-606,164-168`; R-SES-007 `shared-session-data.md:71-78`, R-SES-014 `:112-114` | pendiente | pendiente |
| `D-escenarios-criticos-5` | escenarios | `material` (original: medium) | `§5#6`, `§7` — URL desconocida muestra 404 DS sin cargar el dashboard; back/forward y scroll quedan con observación | R-SES-024/025 `shared-session-data.md:170-177`; plan `§2` y `§5#4` | pendiente | pendiente |

**Deduplicación aplicada.** `D-escenarios-criticos-1` (eje de QA-Goblin) se fusionó dentro de `D-seguridad-1`: mismo reclamo G-SES-1 sobre la recarga y el tenant. Conserva el `id` del eje de prioridad más alta (seguridad) y **ambas** fuentes:

| Directiva fusionada | `sources` |
|---|---|
| `D-seguridad-1` | `Dhampir-Slayer` (reclamo propio de seguridad) + `QA-Goblin` (`D-escenarios-criticos-1`, escenarios) |

#### Directivas descartadas

| ID | Eje fallido | Motivo |
|---|---|---|
| `none` | — | Los diez reclamos recibidos superan dominio, scope y evidencia; ninguno se descartó. |

#### Reviewers

| Reviewer | Eje | Stance | Directivas |
|---|---|---|---:|
| `Dhampir-Slayer` | seguridad y secretos | `partial` | 5 — `D-seguridad-1` … `D-seguridad-5` |
| `QA-Goblin` | tests de flujos críticos | `partial` | 4 propias (`D-escenarios-criticos-2` … `-5`) + 1 fusionada (`D-escenarios-criticos-1` → `D-seguridad-1`) |

> `stance: partial` es la evaluación del reviewer sobre el plan completo dentro de su eje; **no** es una disposición ni un veredicto. Cada directiva válida queda a la espera de `PLAN_REVIEW_DISPOSITION` del Bard y del arbitraje de cierre.

---

**Cuerpo `p3` + cierre `r2` (`Lore Master`, 2026-10-02) — evento terminal.** Escritura 3 de 4 del presupuesto del gate. Materializa el `plan_payload_revised` de `BARD_CORRECTION_1` (`payload_revision` `p2` → `p3`) y cierra el ciclo con las disposiciones y el veredicto ya arbitrados por el orquestador. El checkpoint, el eco de revisión, el feedback `r1`, las tablas de directivas con `pendiente` y el bloque histórico `p1` quedan literales: este bloque se añade debajo, no los sustituye.

| Campo | Valor |
|---|---|
| `gate_id` | `prg-frontend-build-base` |
| `PLAN_PATH` | `docs/specs/final-frontend/implementation-plan.md` |
| `payload_revision` | `p3` — incrementado: hubo cuerpo revisado |
| `review_gate_revision` | `r2` |
| Estado del gate | `VALIDATED` |
| Ronda | 1 de 1; 2 de 2 reportes recibidos (`Dhampir-Slayer` `partial`, `QA-Goblin` `partial`); sin re-despacho, sin segunda ronda, sin retry |
| Disposición | `PLAN_REVIEW_DISPOSITION` de `Cunning Bard` sobre `p2`/`r1`: 9 `accept`, 0 `partial`, 0 `reject`, 0 `unresolved` |
| Arbitraje | Contratos, scope, evidencia y coherencia. Sin auditoría de dominio nueva |
| Ejes diferidos | `none` |
| Ejes sin verificar | `none` |
| Revisión inicial | `r1` · **Revisión final:** `r2` |
| `BARD_CORRECTION_2` | No ocurrió; el ciclo se cierra en `r2` |
| Limitaciones heredadas | Runtime y código fuera del `read_scope` siguen sin verificar (`unverified` de los dos reportes); no son resultados de usuario |
| `updated_at` | 2026-10-02 |

**Recuperación de transporte registrada.** La primera llamada de retorno del resultado de `Cunning Bard` devolvió cero texto. El cuerpo `p3` se recuperó exclusivamente del transporte del resultado ya calculado en la misma sesión del autor, sin nueva revisión, sin re-despacho de reviewers y sin herramientas de auditoría. Se registra como procedencia, no como un segundo ciclo Bard: el gate sigue consumiendo esta única escritura 3 de 4.

#### Directivas válidas — disposición `r2`

Reclamo y evidencia de cada directiva quedan literales en la tabla de feedback `r1` de este ciclo; aquí solo se registra la disposición, el arbitraje y el delta que la materializó en el cuerpo `p3`. Las nueve se dispositionan `accept`: no existe pseudoestado diferido.

| ID | Eje | Severidad | Disposición | Arbitraje | Delta en el cuerpo `p3` |
|---|---|---|---|---|---|
| `D-seguridad-1` | seguridad (fusionada) | `blocking` | `accept` | resolved — contrato, scope y evidencia coherentes | §3 excluye `/contexto`; §5#4 y §6#4: terminal visible sin tenant en recarga real, ConnectionForm (`App.vue:355-360`) y `?tenant=` (`App.vue:293`) como única captura; §5#6 y §7 escenario 5 |
| `D-seguridad-2` | seguridad | `material` | `accept` | resolved | §5#3 y §6#2: TD§2 reglas 1–6 / R-SES como contrato que prevalece sobre el JS actual, divergencia reportada y nunca copiada en silencio; §8 CT-A |
| `D-seguridad-3` | seguridad | `material` | `accept` | resolved | §6#2 y §7 escenario 7: gate de seguridad GET-only; rama CSRF de mutaciones `NOT_VERIFIED`, sin mutaciones creadas para observarla |
| `D-seguridad-4` | seguridad | `minor` | `accept` | resolved | §5#3 y §7: predicado de 403 con `detail` literal, sin normalizar ni traducir |
| `D-seguridad-5` | seguridad | `minor` | `accept` | resolved | §5#3, §7 y §8: cero logs de cuerpos o mensajes con PII (R-SES-018) |
| `D-escenarios-criticos-2` | escenarios | `material` | `accept` | resolved | §5#1 y #4, §6#4: Pinia antes de router/guard; terminales `ready`/`failure`; red/403/429/5xx/cancelación terminan la espera; navegación una sola vez; nunca blanco |
| `D-escenarios-criticos-3` | escenarios | `material` | `accept` | resolved | §5#3, §6#3, §7 escenario 8: invariantes de `generation`/purga/reentrada; descarte no alcanzable declarado `NOT_VERIFIED` sin inventar disparadores ni mocks |
| `D-escenarios-criticos-4` | escenarios | `material` | `accept` | resolved | §5#3 y §7 escenarios 1–3: primera carga real, reentrada que reconsulta, forma inválida con error explícito sin pintado parcial ni ceros falsos; `NOT_VERIFIED` sin fakes |
| `D-escenarios-criticos-5` | escenarios | `material` | `accept` | resolved | §5#6 y §7 escenario 6: URL desconocida → 404 del DS sin fetch del dashboard; back/forward y `scrollBehavior` observados |

#### Directivas descartadas

| ID | Eje fallido | Motivo |
|---|---|---|
| `none` | — | Sin descartes nuevos en `r2`: los diez reclamos válidos (nueve más la fusionada) resolvieron por contrato, scope, evidencia y coherencia. |

#### Reviewers

| Reviewer | Eje | Stance | Disposición de sus directivas |
|---|---|---|---|
| `Dhampir-Slayer` | seguridad y secretos | `partial` | 5 de 5 `accept` |
| `QA-Goblin` | tests de flujos críticos | `partial` | 4 propias `accept` + 1 fusionada (`D-escenarios-criticos-1` → `D-seguridad-1`) `accept` |

`stance: partial` sigue siendo la evaluación del reviewer sobre el plan completo dentro de su eje; no es una disposición ni un veredicto.

#### Veredicto

```text
PLAN_REVIEW_VERDICT
gate_id: prg-frontend-build-base
plan_path: docs/specs/final-frontend/implementation-plan.md
payload_revision_final: p3
review_gate_revision_final: r2
verdict: VALIDATED
reviewers: Dhampir-Slayer:seguridad:partial | QA-Goblin:escenarios críticos:partial
directives_total: 9
accepted: 9
partial: 0
rejected_with_evidence: 0
unresolved: 0
discarded: 0
deferred_axes: none
unverified_axes: none
operator_decision_required: none
implementation_authorized: no
```

> **`VALIDATED` no autoriza implementación.** El ciclo `prg-frontend-build-base` queda terminal en `r2`: no procede tercera corrección ni segunda ronda dentro de este `gate_id`. La autorización de ejecución del operador existe por separado y este veredicto no la emite ni la sustituye. `status` del plan no se toca y `./spec-meta.yaml` no se modifica en esta escritura.
