---
plan_id: final-frontend-remaining-execution
spec_id: spec-final-frontend-001
created_by: Cunning-Bard
persisted_by: Lore-Master
created_at: "2026-10-04"
updated_at: "2026-10-04"
payload_revision: p2
review_gate: VALIDATED
review_gate_revision: r2
spec_meta: ./spec-meta.yaml
---

# Plan — final-frontend-remaining-execution: ejecución restante F3–F10

> **Nota de persistencia (`Lore Master`, cuerpo `p1`, 2026-10-04).** **Cuerpo del plan:** §1–§8 son la transcripción **literal** del `plan_payload` que `Cunning-Bard` entregó en su `HANDOFF` DELIVERED (sesión `ses_ef6d3eb84ffexF0rCqbEnhwCir`): las 8 secciones canónicas en su orden original, con sus listas, tablas, sub-puntos y checkpoints tal como los escribió el autor. No hay reempaquetado, ni reinterpretación, ni correcciones técnicas, ni renombrado de IDs, ni cambios de aprobaciones. `§9 Dependencias` y `§10 Referencia a spec` son las **únicas** derivaciones, exigidas por `docs/plan-persistence.md > Estructura obligatoria del archivo Markdown`. **Gate no despachado:** el gate `plan-review` de este `plan_id` **no ha sido activado**: no existe sección `## Plan Review Gate` y el frontmatter **no** declara `review_gate`. `review_gate_revision: r1` queda **predeclarado** por el preflight porque el primer ciclo del gate es `r1`; el **checkpoint prelaunch** (escritura posterior e independiente) escribirá `review_gate: REVIEWING` replicando `r1` y `payload_revision: p1` sin alterarlos. Registrar `REVIEWING` ahora sería una aserción falsa de ledger. **Autorización:** este archivo **no** autoriza implementación. La orden humana vigente del operador («ya termina el trabajo», con la autorización de DBdev para la extensión de apariencia especificada) se registra en `§9` y `§10` como **hecho separado y atribuible al operador**, citado por el preflight; **no** es un veredicto del gate, no abre el estado `DRAFT_PERSISTED` y no sustituye la `PLAN_REVIEW_VERDICT` que emitirá el orquestador con `implementation_authorized: no` literal. La spec refuerza lo mismo de forma independiente: la aprobación de alcance no equivale a autorización de implementación (`./spec-meta.yaml:63-71`). **Planes hermanos intactos:** este archivo **no** modifica [`./implementation-plan.md`](./implementation-plan.md) (plan base `frontend-build-base`, `p3`/`VALIDATED`/`r2`) ni [`./implementation-plan-access.md`](./implementation-plan-access.md) (F2 `frontend-access-session-f2`, `p2`/`VALIDATED`/`r2`); sus `## Plan Review Gate` y `## Historial de revisiones` les pertenecen y no se replican aquí. **Ruta declarada por el preflight:** `implementation-plan-remaining.md` en lugar del nombre por defecto `implementation-plan.md` de la SSOT, porque ese nombre —y `implementation-plan-access.md`— ya están ocupados; es el mismo precedente ya aplicado al plan F2 de esta spec. Son tres `plan_id` distintos, tres workstreams y contadores `payload_revision` independientes: **no** es una revisión de los planes anteriores y no habilita la cláusula «actualizar el mismo archivo» de la SSOT. Por eso no hay bloque de diff: `p1` es el primer cuerpo de este `plan_id`. **Convención de formato:** sin tabla de contenidos, por coherencia con los dos planes hermanos de esta spec, que tampoco la llevan, y porque el cuerpo es transcripción literal. **Estado de la spec:** no se duplica aquí; vive en [`./spec-meta.yaml`](./spec-meta.yaml), referenciado por `spec_meta` y leído read-only.

---

## 1. 🎭 Objetivo

Ordeno la ejecución restante F3–F10 para entregar las 36 pantallas, 99 flujos y personalizador 8 ejes aprobados, con operaciones reales y DS literal; no colección rutas/shells. Conservo base p3r2 y F2 p2r2 VALIDATED, no reabro planes ni uso fragmento histórico como plan vigente. S=docs/specs/final-frontend; P=front/src; DS=../../Inume Design System/.

## 2. Scope

- Parto S/spec-meta.yaml:7,13,63-71 y orden operador. Autorización DB dev exclusivamente apariencia; gate no otorga orden ejecución.
- Reutilizo 7 rutas, transporte, SessionStore, dashboard, formularios F2; no reconstruir contratos.
- Seis owners disjuntos A foundation/F3/integración, B F4, C F5, D F6+F8, E F7, F F9.
- Operaciones específicas/relaciones/selectores/5 tabs/estados/restricciones aprobadas, no deducir métodos/respuestas de rótulo CRUD.
- Conservo OP-UNT-006 acceptance/organization 37 y canónica UNT007/008 38-39; memberships GET colección/detalle POST PUT PATCH DELETE acceptance identity 74-79 y apps/identity/views 140-146.
- 162 OP disposición individual; 3 métodos apariencia trazados aparte.
- Shared H0 sólo seams consumidos por 2+ dominios identificados, resto owner local.
- F10 Lore secuencial cobertura/estado doc/evidencias.

**Cambios r1:** API 1/2 contratos aprobados no reduzco operaciones por omisión refresumida; correctness 5 H0 no catálogos indiscriminados.

## 3. Out of scope

- No reimplementar base/auth/F2, SessionStore sin incompatibilidad acreditada, frameworks/deps nuevos, config/infra/procesos.
- Backend fuera apariencia excluido: auth/RBAC/multitenant/otras APIs/B01; no legacy changes.
- No placeholders, TODOs funcionales, links dead, success simulado, responses fake, demos, storage, cuentas T ni datos ficticios de app o DB dev.
- TEST aislado: helpers unitarios/_factories existentes sólo TEST autorizado, no poblar app ni acreditar observables.
- No D02 inventado, no ocultar controles, restricciones scopes read/delete polígono map faltante.
- Esta delegación plan only no implementa/writes/commands/browser/MCP/web/nested; MirrorShard no amplia permisos.

**Cambios r1:** correctness 5 delimita TEST sin fixtures producto.

## 4. 📜 Archivos probables

Seis owners disjuntos; paths new propuestas, cada handoff writer un archivo.

| Owner | Write set exclusivo | Motivo |
|---|---|---|
| A/shared | P/api/shared/*.ts; P/types/shared/*.ts; P/components/shared/*.vue; nuevos P/components/ds/*.vue, conservar AuthCard/AuthField/FormFeedback | Seams 2+ consumidores/primitivas DS, no CRUD genérico/todos catálogos |
| A/puentes | P/api/dashboard.ts; P/types/dashboard.ts; P/types/shell.ts | Mantener proyecciones/contratos shell |
| A/F3 | P/features/organization/**; P/views/organization/** | Organización operaciones específicas |
| B/F4 | P/features/identity/**; P/views/identity/** | Identidad/membership/credenciales/form contraseña propia |
| C/F5 | P/features/authorization/**; P/views/authorization/** | RBAC consultas/auditoría |
| D/F6+F8 | P/features/armory/**; P/features/exercises/**; P/views/{armory,exercises}/** | Almacén/ejercicios/consumos |
| E/F7 | P/features/shooting/**; P/views/shooting/** | Tiro/captura/resultados |
| F/F9 | P/api/appearance.ts; P/types/appearance.ts; P/stores/appearance.ts; P/components/personalizer/**; P/views/appearance/**; P/styles/theme-customizer.css | Catálogo/panel/feedback restauración/cola; PersonalizerView.vue/AppearanceFeedback.vue propuestos dentro |
| F/backend | apipoligono/{models,serializers,views,urls}.py: sólo apariencia; una migración nueva; apipoligono/tests/test_design_system_preferences.py | 8 campos/endpoint/tests, no históricas |
| A/integración | P/App.vue; P/main.ts; P/router/{routes,guards}.ts; P/components/shell/*.vue; P/components/{DashboardSidebar,DashboardTopbar}.vue; P/styles/dashboard.css/capas DS comunes nuevas | Composición rutas/nav/barreras/lifecycle/entradas reales |

Tests focales en directorio owner módulo, integration router A; ninguna familia modifica otra/shared/shell/router/backend ajeno; F única excepción backend apariencia. ContextSelector P/components/context/ContextSelector.vue existente contrato F2 no cambio, ContextView 3-9 ancla.

**Cambios r1:** correctness 2/3/4 owner feedback/entradas; 5 shared mínimo/tests locales.

## 5. 🎵 Pasos / fases

1. **Entrada:** Lore persiste nuevo payload, orquestador arbitra 9 dispositions, no repetir reviews base F2 ni pedir scope confirmado.
2. **Foundation mínima A:**
   - Fuente DS ejecutable por familia, no digests sustituye.
   - Shared export con 2+ dominios antes crear: H0 unidades lookup/asignables organización+identidad; OPUSR012/TemporaryPersonForm identidad+captura; otros seams únicamente consumidores concretos.
   - Resto catalog/API local owner publica tipos/API/validators temprano antes forms/views, no esperar cierre dominio, no duplicar lector.
   - Reutilizar getLessons/getLessonSummary/getPolygons/getUserProfile/getAuthContext; wire completo factores sólo lectura validada firmas/proyecciones intactas sin duplicate GET (P/api/dashboard 256-295).
   - unknown JSON/errors validación runtime/interfaces planas const type/no any casts confianza, cuerpos escribibles sólo.
   - Respuesta por endpoint/OP: 204 contrato no lee JSON; DELETE JSON validado, RCT008 detail/unit_count no perdido.
   - Ticket principal/contexto autorizado/recurso/operación/intento/generation; then/catch/finally todo ingredientes vigentes para datos/form/error/busy/nav.
   - Conservo borrador/error en mismo intento autorizado con fallo confirmado; secretos clean on success/cancel close; purga PII/borradores/errors privados síncrona en logout/expiry/principal/contexto o recurso invalidado. Invalida antes abortar, no late populate.
   - Tabla/tabs/selector presentan y emiten; modal close focus; TemporaryPersonForm emite datos, no fetch/autoridad permisos.
   - H0 exports validators props/emits consumidores mínimos entregados, inspection y tests sólo harness autorizado; si falta bloqueo comprobación, no H0 "probado", no impedir local independiente; shared congelado fanout.
3. **Fanout disjunto 6, trash 0 por seam**; tipos API→estado/composables→forms acciones→views; DONE_WHEN post integración, no claim funcional por handoff.

| Paquete | Cobertura/fuentes | Implementación/resultado observable |
|---|---|---|
| A/F3 | 4 SCREEN FLORG001-012; S/contracts/organization-identity 7-17; screens/organization; tasks/organization; acceptance/organization | Árbol/fichas altas lecturas PUT PATCH lookup asignables recintos; UNT006 AC separado, no atajo: preview UNT007 8 contadores→POST UNT008 destino elegible, raíz obligatoria/warning assignments no reasignados; RCT008 validar detail/unit_count refresco respuesta, no endpoint/migración inventados |
| B/F4 | 5 SCREEN FLIDT001-017 FLPWD002-005; contracts organization-identity/auth-context; screens identity; tasks identity/recovery-password; acceptance identity | Formal/temporal promoción; principal PUT PATCH/baja/secundarias; puestos holder único histórico; membership GET list/detail POST PUT PATCH DELETE ACMEM001-006/apps identity views 140-146; refrescar contexto o propio antes unidad, no confundir Assignment; password propia/otros/reset lock unlock sin forzado F2; form conservar purga por ticket |
| C/F5 | 5 SCREEN FLAZ001-013 FLAUD001; contract authorization/screens authorization/tasks authorization/acceptance authorization/session access 32 | Roles/scopes read/permisos 4 tabs/matrices overrides/AZC001-004/audit limit ≤500; rol sistema/403 literal, sin permisos efectivos autoridad local; reconciliación tras mutación propia |
| D/F6+F8 | 8 SCREEN 17 FL ARM/WPN/CAL/EXC/CMN/CAR; contracts organization-identity/domain-shooting/exercises-preferences; screens armory/exercises; tasks armory-weapons/exercises; acceptance armory/exercises | Operaciones contratadas armería/armas/calibres/ejercicios/consumos; calibres mutables sólo super_admin acreditado; armería obligatoria update; participantes códigos/calibres activos/FK consumo arma; unicidad cantidades relaciones reales, no stock transfer cascada imaginados |
| E/F7 | 6 SCREEN FLSHT001-019; domain-shooting 14-42/screens shooting/tasks shooting-lessons/shooting-capture/acceptance shooting | CRUD permitidos/delete polígono restricción; 5 tabs independientes elegibles participantes; FRC003 captura usuarios armas FRC007/temporal shared; unicidades/cero→—/aggregate_only sin desglose privado, no error denegado cambiado agregados |
| F/F9 | 1 SCREEN FLAPP001-008; technical design 279-355/397-481; screens appearance/catalog/tasks appearance 247-301/acceptance appearance 38-60 | 8 ds choices defaults exactos constraints GET PUT DELETE legacy preservado; 2/27/26/9/3/7/8/7 opciones preview reset attrs absent keyboard fonts 44 conceptos atribución; one flight último pending/saved vigente; unidad conserva cola/principal purga; error retry restauración SCREEN PERSONALIZER |

4. **F9 DB/API independiente:**
   - predecessor real 8 AddField+8 AddConstraint, nueva migración sin índice estable/data improvised.
   - GET200 complete PUT200 8 strings enums validación antes write DELETE204 idempotente; IsAuthenticated CSRF existing no T perm new.
   - Acreditar dev autorizado, no real/prod, revisión backup privado restaurable, servicio no restart.
   - Rollback new migration only, detener writes retirar consumer predecessor, pérdida requiere explicit decision/respaldo, no autonomous drop/legacy destruction.
   - Django unittest_factories only TEST autorizado, no business fixtures app.
5. **Integración única A tras 6 y F9:**
   - 29 rutas navigation 35-74 antes catchall, literales roles/scopes/permisos/overrides antes personas:id.
   - Sin meta F2 encargo limitado, no prohibición restante; meta.requiresTenant canónico único, no fields requiresAuth/adminOnly inventados; F2 nombres/clasificación contratos conservar.
   - permission[]/ctx real eligibility, no invent roles; IsTenantAdmin no anticipable→request backend 403 literal navigation 124, no autoridad frontend.
   - Pending redirect writer todo destino protegido registrado no control interceptado; original preservar login forzado contexto; validate write/consume interno registrado no catch/control/redirect nested/query sensible; consumer único por attempt no ciclos self redirect.
   - T manual/single flight/public sin T GET 0/no autowatch bootstrap/terminales F2; new route eligible continúa hacia ella, no dashboard incondicional.
   - Purga invalidación síncrona módulos/context mutation explicit; Session authority intacto; pref preparación additional barrier.
   - Priority p público control/terminal session→restore appearance valid principal→op content; pref no T/U prereq own.
   - Durante GET no paint op; error SCREEN PERSONALIZER (PersonalizerView/AppearanceFeedback F) sin SCREEN extra, no ready/saved/defaults POST/writes if restore failed; local own valid state preserve, retry explicit por intento; session terminal purga/precedes no loop.
   - Success apply 8 attrs antes auth content, destino no pending valid; público defaults 0 prefs requests.

   Entradas obligatorias:

| Entrada | Archivo/cableado | Ruta/observable |
|---|---|---|
| LOGIN | LoginView/routes/clasificación pública conservada | /login visible anon/expired, acceso directo o guard, sin POST logout previo; form login real con account autorizado no cred fake |
| Personalizador | A DashboardTopbar actor-context-menu/AppTopbar→F views appearance PersonalizerView | RouterLink /personalizador en menú usuario, distinto rotulados slider contexto; 8 axes preview persist reset real |
| Contraseña propia | A user menu→B features identity form/views identity acción | /personas/:id Usuario real principal ACUSR013 form propia normal old_password salvo flag forced POST cambiar-contrasena; no depender user:update/lectura admin; no new SCREEN/forzado F2; 200/400 real cleanup |
| Contexto | A toggle-context/ContextSelector composition visible ShellApp | Cada operativa route slider abre/cierra actual route contexto ARIA controls/expanded; contexto o route completa; no booleans in panel/no personalizer |

   - Resumen/active por derouter; Lecciones/tiro/lecciones; avatar acciones DS identidad no sintético foto.
   - RouterLink/real IDs, código PK sólo real response; reentry params back forward vigente, no late paint.
6. **F10:**
   - 7+4+5+5+8+6+1=36 SCREEN/8+12+21+14+17+19+8=99 FL, no route count como entrega.
   - cada owner SCREEN FL OP AC observable/impedimento, no inherit F2 verified.
   - 162 OP+11 no FL principal IDs conservar UNT006/MEM updates; Lore discrepancias documentos approved sin rewrite en vez implementación.
   - AUT006 no caller/PRF001002 legacy/RNG006 restricted/IDs dual conservados spec meta 198-213.
   - NO job cumplido por falta data/tests/residuales.

**Cambios r1:** SEC ticket purga; API methods response; QA deep return meta/barrera entradas/h0 mínimo gate tests.

## 6. Riesgos

- Protected routes access PII menú≠permission business 403≠session expired; max 1 explicit ctx clarifier con T sin recursive/replay.
- Mutabort o≠ausencia effect server; ticket lost discard/case uncertain no conservar PII invalidado, read explicit reconcile, no replay.
- Generation business/principal appearance separados unit purge private context data appearance cola queda; logout/principal both purge.
- GSES1/2/3 T manual reload/U scope unaccredited/remote query paginate unknown; params canonical collection real client search sort.
- B01 LESS009 static error visible, no servers fix/no aggregate fallback.
- API refs omit methods Units Memberships≠runtime evidence≠remove ACs.
- DB dev≠production/synthetic app records/nondesigned destruction.
- Front package 6-21 not runner/lint: tool harness+invocation+permission needed; blocked tests/gate no install/pretend passed.
- Auth observables requiere principal T UnitIDs real existing ya actions authorized no secrets artifact; no invent data.
- Pref barrera no oculta session terminal/unlock default/no new SCREEN.
- DS runtime correctness not by read static, source canonical approved prevails.

**Cambios r1:** SEC retention uncertainty; API contract omissions; QA pref barrier/test dependency.

## 7. Verificaciones

SSOT proporcionalidad 214-232, no suites globales routine.

- N1 H0/packets inspect ownership consumers API props-shapes RW methods responses DS no simulation storage PII logs base F2 conserved.
- N3 formal required spec meta 19-23/77-78: tests dirigidos validators/transport/ticket finally busy/form purga/reconcile/methods responses/deep return meta/terminal precedence pref cola/principal, owner local reuse old cover no fake passes.
- Frontend tests requires available authorized harness/invocation; no runner lint credited package; missing availability permission explicit block, manual/build cannot replace, no new deps scripts config unilateral.
- TEST isolated unit helpers not fake app API, Django unittest_factories existing TEST DB authorized enums 8 fields atomicity constraints GET PUT DELETE legacy rollback, no populate DB dev/no global apps.
- N4/5 integrated pnpm --dir front typecheck/build autorapplies not by file, lint not assumed.
- N2 observables apart tools permission/auth prereq real DS/backend ops/refrescos/restricciones 5 tabs error/vacío/relations.
- UNT006 separado UNT preview migrate; MEM001-006 method; RCT008 detail/count, no failed endpoint success fake.
- LOGIN visible anon expired sin POST logout; menu/personalizador clear; own password real id errors 200/400; sliders panel visible actual route; Resumen actual/Lecciones actual navigation.
- Deep dest preserved login forzado contexto/write consume valid current/once/self route/query invalid/catch control/no loops; no forzado recovery rerun except coverage/regression.
- Appearance error retry existing SCREEN content block/defaults not persist/session precedence/resume pending after restore.
- Form err conserve authorized confirmed failure/secrets clean close/success/PII purge on principal context resource invalidate/late completion no repopulate/uncertain muta no replay.
- Sin account/data/permission tool needed record AC gate blocked, not typecheck as proof/new records.

**Cambios r1:** SEC purga form tests; API method cases; QA navigation barrier harness preciso.

## 8. 🪕 Handoff para Code Transmuter

H0 mínimo A→fanout 6 disjoint F3-9→A integración→gates observables→Lore F10.

- Una ruta escrita por handoff exports consumers DONE_WHEN owner permanent; locals API early shared A only.
- Load typescript/vue-best-practices/vue-router-best-practices/pinia/inume-css-html-anti-patterns/Mirror-Shard; script setup TS/emits/stores memory/DS literal, skill no license ex actions.
- Endpoints own canonical method payload responses UNT simple v migrate/MEM PUT PATCH/RCT DELETE JSON, no fake CRUD authority.
- Ticket complete conditional conserve/secret clean/private purge async/old finally discard; no mutation replay.
- Deep routes pending once/meta/session→pref→content/base F2 preserved.
- LOGIN public accessible/personalizer distinct/own password/slider context visible, no controls hidden/fake IDs.
- Closure inspect focal+tests directed formal available authorized harness+type build+observable real independent; if harness missing BLOCKED tests not install/passes false/no suites routine.
- _factories unit inputs TEST only not app data; only ask real prereq not rescope.
- Lore coverage/discrepancias/evidencia persistence F10 sequential, no new IDs/catalog copy/scope cut/old plans rewrite.
- No Bard writes implementation/verdict; orquestador disposes writer DELIVERED/BLOCKED/FAILED localizadores.

**Cambios r1:** 9 directivas contratos/lifecycle/routing barrier/mínimo foundation/test harness.

## 9. Dependencias (derivación de la persistencia)

Derivadas de §5 Pasos / fases y de las notas del preflight (workstream `final-frontend-remaining-execution`, spec `spec-final-frontend-001`). Una línea por dependencia; no son afirmaciones verificadas por esta persistencia.

- Paso 2 (foundation mínima, A) ← plan base `p3` y F2 `p2` ya persistidos: el seam compartido se apoya en transporte, `SessionStore`, dashboard y formularios F2 existentes, que A **no** reconstruye.
- Paso 2 → **Checkpoint H0** ← exports, validadores y props/emits efectivamente entregados. Es la precondición dura del paso 3: `shared` queda congelado durante el fan-out y todo cambio vuelve a A **vía orquestador**.
- Paso 3 (fan-out A/B/C/D/E/F) ← H0. Los seis paquetes son disjuntos por `§4`; dentro de cada uno el orden interno es tipos/API → estado/composables → formularios/acciones → vistas. Los catálogos publicados por A no serializan módulos autónomos.
- Paquete F/F9 (frontend) y **Checkpoint DB/API de F9** (paso 4) ← prerequisite común: la revisión de diseño de los ocho campos ya está entregada y aceptada por `Kobold-Scholar` y figura en `S/technical-design.md §5.1–§5.2` (`./spec-meta.yaml:79-81`); el paso 4 es **independiente** de los paquetes A–E y puede avanzar en paralelo con ellos.
- Paso 4 ← `kobold_scholar: required` (dominio, obligatorio: modelo de datos y migración de los ocho campos) y autorización humana de DBdev, registrada en `§9` más abajo y acotada a la extensión de apariencia especificada.
- Paso 4 ← **respaldo restaurable privado fuera de los artefactos del proyecto**, revisado **antes** de aplicar; destino exclusivamente dev, sin datos reales ni producción. La migración es **nueva y única**: 8 `AddField` + 8 `AddConstraint`, sin índices, sin modelo nuevo, sin data migration improvisada, sin tocar migraciones históricas.
- Paso 4 → rollback identificado hacia el predecessor real: detener escrituras de apariencia, retirar su consumo y revertir **sólo** la migración nueva. Revertir **pierde** `ds_*`; conservarlos o restaurarlos exige respaldo y decisión explícita — nunca rollback automático ni destrucción de `legacy`.
- Paso 5 (integración única, A) ← `DELIVERED` de los seis paquetes **y** checkpoint F9. A es el único owner de `App.vue`, `main.ts`, router, shell, `DashboardSidebar`/`DashboardTopbar` y capas DS comunes (`§4`).
- Paso 5 ← 29 rutas restantes desde `S/experience/navigation.md:35-74`; los nombres de F2 **no** se reescriben para igualarlos al documento (divergencia declarada, nobug a corregir).
- Paso 5 ←SessionStore conserva autoridad y API; la preparación de apariencia es barrera **adicional de presentación**, no reescritura de su `ready`. Público usa defaults y **cero** requests de preferencias.
- Paso 6 (F10, Lore Master, secuencial) ← cruce SCREEN/FL/OP/AC que **cada** paquete debe entregar a Lore. Los ocho flujos conservados no adquieren verificación por herencia y «ruta registrada» no cuenta como función completada.
- Paso 6 ← reconciliación de 162/162 OP con disposición explícita e inclusión de las 11 OP sin FL principal vía su SCREEN y AC propios (`S/coverage.md:106`).
- Paso 6 ← **lane de integración secuencial** para reconciliar los dos sistemas de IDs de trazabilidad vigentes sobre el mismo write set (`T-FL-*`/`T-CORE-*`/`AC-OP-*`/`AC-FL-*`/`AC-CORE-*` frente a `T-00…T-147`/`AC-<familia>-NN`); equivalencias en `coverage/operations.md` (162 filas) y requisito de reconciliación declarado en `./spec-meta.yaml:198-213`. Lore conserva equivalencias **sin borrar historia**.
- Spec `spec-final-frontend-001` aprobada y **no verificada** (lectura read-only de [`./spec-meta.yaml`](./spec-meta.yaml): `status: approved` `:7`, `approved_at: "2026-10-02"` `:13`, `verified_at: null` `:14`; riesgo `high` con flags `auth`, `permissions`, `sensitive-data`, `schema`, `database`, `migration`, `new-api` `:33-42`). El estado **no** se replica ni se modifica aquí.
- **Orden vigente del operador** («ya termina el trabajo»), con autorización de DBdev para la extensión de apariencia especificada y autorización previa de ejecución y fan-out: transcrita del preflight como **hecho separado y atribuible al operador**. No es un veredicto del gate, no modifica `payload_revision`, no abre `DRAFT_PERSISTED` y no sustituye la `PLAN_REVIEW_VERDICT` con `implementation_authorized: no`. La separación planificación-ejecución permanece dura: `PLAN_PATH` es el único puntero que debe circular hacia `Code Transmuter`.
- **Gate no despachado.** `review_gate_revision: r1` está **predeclarado** por el preflight (primer ciclo); `review_gate` está **ausente** a propósito, porque la máquina de estados sitúa este archivo en `DRAFT_PERSISTED` y la entrada a `REVIEWING` la escribe el **checkpoint prelaunch** (escritura posterior, independiente). El checkpoint replicará `payload_revision: p1` y `review_gate_revision: r1` sin alterarlos. El payload anticipa cuatro ejes de revisión para ese gate; su roster, filtrado y veredicto **no** se anticipan aquí.
- Planes hermanos **intactos**: base [`./implementation-plan.md`](./implementation-plan.md) (`plan_id: frontend-build-base`, `payload_revision: p3`, `review_gate: VALIDATED`, `review_gate_revision: r2`) y F2 [`./implementation-plan-access.md`](./implementation-plan-access.md) (`plan_id: frontend-access-session-f2`, `payload_revision: p2`, `review_gate: VALIDATED`, `review_gate_revision: r2`). Ambos leídos read-only para confirmar estado; ninguno modificado. El fragmento histórico `full-frontend-plan` `p1` que vive dentro de `implementation-plan.md` **no** se trata como cuerpo vigente ni se reabre.
- Citas del cuerpo **no** releídas en esta persistencia: `S/spec-meta.yaml:7,13,63-71,198-213` (sí leídos), y todo lo demás que el payload referencia sin cita de línea — `S/contracts/*.md`, `S/experience/**`, `S/design-system/customizer-catalog.md`, `S/tasks/*.md`, `S/acceptance/*.md`, `S/technical-design.md:279-355,397-481`, `S/coverage.md:106`, `P/router/routes.ts:20-55`, `P/api/http.ts:99-190`, `P/stores/session.ts:879-892`, `P/api/dashboard.ts:256-295`, `P/router/guards.ts:95,190`, `front/package.json:7-21`, `apipoligono/**`, y el kit externo `../../Inume Design System/`. Toda afirmación del cuerpo sobre esos archivos es **transcripción del autor**, no verificación de esta persistencia.
- Procedencia del cuerpo `p1`: `HANDOFF` DELIVERED de `Cunning-Bard` en la sesión `ses_ef6d3eb84ffexF0rCqbEnhwCir` (referencia de sesión, no fuente durable).

## 10. Referencia a spec (derivación de la persistencia)

- **Spec asociada:** `spec-final-frontend-001` — *Frontend integral del producto final sobre el backend existente* (type: `full`).
- **Metadata (fuente única de verdad del estado):** [`./spec-meta.yaml`](./spec-meta.yaml), referenciada por `spec_meta` en el frontmatter. Lectura **read-only** para esta persistencia: `status: approved` (`:7`), `approved_at: "2026-10-02"` (`:13`), `verified_at: null` (`:14`), `quality_gates` con `tests`/`security_review`/`code_review`/`documentation` en `required` (`:19-23`) y `specialist_reviews` con `portal_warden`/`kobold_scholar`/`qa_goblin` en `required` (`:25-31`). El estado **no** se replica aquí y este archivo **no** modifica esa metadata.
- **Volúmenes de la spec (modelo híbrido):** [`./index.md`](./index.md) como entrada; volúmenes en `docs/specs/final-frontend/` (`requirements.md`, `technical-design.md`, `verification.md`, `tasks.md`, `coverage.md`, `backend-inventory.md`, `backend-contracts.md`, `implementation-plan.md`, `implementation-plan-access.md`, y carpetas `contracts/`, `acceptance/`, `coverage/`, `design-system/`, `experience/`, `requirements/`, `tasks/`). Estructura verificada por listado read-only de la carpeta.
- **Divergencia de ruta respecto del nombre por defecto de la SSOT:** `docs/plan-persistence.md` resuelve `docs/specs/<spec-id>/implementation-plan.md` cuando existe spec. Aquí el preflight declaró `implementation-plan-remaining.md` porque ese nombre ya está ocupado por el plan base `frontend-build-base` y `implementation-plan-access.md` por F2 `frontend-access-session-f2`; ninguno puede sobrescribirse ni mezclarse. Precedente idéntico ya registrado por el plan F2 de esta spec. Son tres `plan_id` distintos, tres workstreams y tres contadores `payload_revision` independientes; **no** es una revisión de los planes anteriores y no habilita la cláusula «actualizar el mismo archivo» de la SSOT. Por eso no existe bloque de diff: `p1` es el primer cuerpo de este `plan_id`.
- **Plan base (referencia, no dependencia de revisión):** [`./implementation-plan.md`](./implementation-plan.md) — `payload_revision: p3`, `review_gate: VALIDATED`, `review_gate_revision: r2`. Su `## Plan Review Gate` y su `## Historial de revisiones` le pertenecen y no se replican aquí.
- **Plan F2 (referencia, no dependencia de revisión):** [`./implementation-plan-access.md`](./implementation-plan-access.md) — `payload_revision: p2`, `review_gate: VALIDATED`, `review_gate_revision: r2`. Misma separación de ledger.
- **Estado de revisión de este plan:** el gate `prg-final-frontend-remaining-execution` **no ha sido despachado**. Este archivo está en `DRAFT_PERSISTED`. Frontmatter vigente: `payload_revision: p1`, `review_gate_revision: r1` (predeclarado), `review_gate` **ausente**. No existe sección `## Plan Review Gate`: **0 de 4** escrituras del gate usadas. El checkpoint prelaunch será la escritura 1 de 4 y escribirá `review_gate: REVIEWING` con `review_gate_revision: r1` y `payload_revision: p1` replicados. La sección se añadirá entonces, **append-only**, bajo `Lore Master` como writer único y secuencial sobre este mismo archivo.
- **Regla de lifecycle:** este archivo no autoriza implementación, ni por existir, ni por la orden humana registrada en `§9`, ni por superar ningún gate. `PLAN_PATH` es el único puntero que debe circular hacia `Code Transmuter`; la orden explícita del operador sigue siendo necesaria para delegar implementación. La spec lo confirma de forma independiente: la aprobación de alcance y la orden de ejecución «ni la aprobación ni esa orden superan gates automáticamente» y «no se concede autorización de implementación» (`./spec-meta.yaml:63-71`). Ningún veredicto del gate delegará a un agente ejecutor: todos llevan `implementation_authorized: no` literal e inmutable.
- **Trazabilidad en dos sistemas de IDs:** vigente y pendiente de reconciliación por lane de integración secuencial del orquestador (`./spec-meta.yaml:198-213`). `§5` paso 6 y `§9` la heredan sin resolverla; esta persistencia no renombra ni borra IDs.
- **Cierre aún no Persistido:** F3–F10 no están implementados al escribir este archivo. `§5` paso 6 (F10) y la reconciliación de 162 OP siguen abiertos. Persistencia cerrada como `DELIVERED` documental, no como `VERIFIED` ni como producto completo.

### Reconciliación de lectoría tras `p2` (append-only)

Añadida por la escritura 3 de 4 del gate `prg-final-frontend-remaining-execution`. **No reescribe** ninguna viñeta anterior de `§9` ni de `§10`: las declara superadas y fija dónde vive ahora cada hecho.

| Afirmación literal previa | Fecha en que era verdadera | Estado vigente tras la escritura 3 de 4 |
|---|---|---|
| «el gate `prg-final-frontend-remaining-execution` **no ha sido despachado**» (`§9`) | `2026-10-04`, persistencia `p1` | **Superada.** Gate despachado, ronda cerrada, veredicto `VALIDATED` en `## Plan Review Gate`. |
| «`review_gate_revision: r1` está predeclarado … el **checkpoint prelaunch** (escritura posterior, independiente) escribirá `review_gate: REVIEWING`» (`§9`) | `2026-10-04`, persistencia `p1` | **Superada y cumplida.** Escritura 1 de 4 escribió `REVIEWING`/`r1`/`p1`; escritura 2 de 4 el feedback; escritura 3 de 4 `p2`/`r2`/`VALIDATED`. |
| «Este archivo está en `DRAFT_PERSISTED`», «`review_gate` **ausente**», «**0 de 4** escrituras», «No existe sección `## Plan Review Gate`» (`§10`) | `2026-10-04`, persistencia `p1` | **Superada.** Frontmatter `payload_revision: p2`, `review_gate: VALIDATED`, `review_gate_revision: r2`; sección existente; **3 de 4** escrituras usadas. |
| «El checkpoint prelaunch será la escritura 1 de 4 … La sección se añadirá entonces, **append-only**» (`§10`) | `2026-10-04`, persistencia `p1` | **Superada y cumplida.** La sección se añadió en la escritura 1 y sigue append-only: tres bloques, un ciclo. |
| «F3–F10 no están implementados al escribir este archivo» (`§10`) | `2026-10-04`, persistencia `p1` | **Sigue siendo cierta.** El gate plan-only no implementa nada; `VALIDATED` no es `VERIFIED`. |
| «La spec está `approved` y **no verificada** (`verified_at: null`)» (`§9`, `§10`) | `2026-10-04`, lectura read-only | **Sigue siendo cierta.** El gate no replica ni mueve el estado de [`./spec-meta.yaml`](./spec-meta.yaml). |

**Reubicación de anclas de línea del cuerpo `p1`.** Los bloques de `§9`, `§10` y el digest `r1` de `## Plan Review Gate` citan líneas del cuerpo `p1` que ya no existen como tales. El cuerpo vigente es `p2`; ninguna cita se reescribe en el sitio, se reubican aquí:

| Ancla `p1` citada | Contenido | Ancla `p2` vigente |
|---|---|---|
| `§5:70` | `DELETE 204` sin lectura JSON (checkpoint H0) | `§5:78` — respuesta por endpoint/OP; 204 sólo donde el contrato no devuelve cuerpo, `RCT-008` conserva `detail`/`unit_count` |
| `§5:79` | paquete `A/F3`, eliminación simple de unidad | `§5:87` — fila `A/F3`; UNT-006 AC separado, preview UNT-007 → POST UNT-008 |
| `§5:80` | paquete `B/F4`; formularios conservados ante error | `§5:88` — fila `B/F4`; conservación y purga por ticket en `§5:80` |
| `§5:82` | checkpoint H0 | `§5:82` — H0 con inspección y tests sólo bajo harness autorizado |
| `§5:86-88` | checkpoint DB/API de F9 y rollback | `§5:94-99` — bloque F9 DB/API; rollback en `§5:98` |
| `§5:89` | 29 rutas restantes | `§5:101` — registro de las 29 rutas antes del catch-all |
| `§5:90` | guard/layout/destinos; `guards.ts:95,190` | `§5:102-106` — `meta.requiresTenant`, elegibilidad, redirect `pending`, single-flight |
| `§5:91` | cableo de invalidación y reconciliación | `§5:106` — purga e invalidación síncrona, SessionStore con autoridad intacta |
| `§5` (conteo 36) | cierre F10 | `§5:123` — 36 SCREEN / 99 FL |
| `§4` (tabla de write sets) | propiedad por owner | `§4:48-67` |
| `§7` / `§8` | verificaciones y handoff | `§7:147-164` / `§8:166-181` |
| `§5` (paquetes en prosa con fuentes OP/AC) | paquetes A–F | `§5:87-92` (tabla de fan-out), con las fuentes OP/AC por paquete en la propia fila |

> 📜 La lista de fuentes citadas por el cuerpo y **no** releídas en esta persistencia (`§9`) permanece válida como advertencia de lectura: las rutas y los rangos de la spec y del source son **transcripción del autor**, no verificación de `Lore Master`. `p2` **acorta** esa cita en varios puntos —por ejemplo, `P/api/dashboard 256-295` y `front/package.json 6-21`—, lo que **no** equivale a verificación: sigue siendo texto del autor, y la advertencia de lectura se mantiene.

## Historial de revisiones

### p1 — 2026-10-04 — cuerpo inicial `final-frontend-remaining-execution` (persistencia mecánica `TIER: FAST`, `Lore Master`)

- Procedencia: `plan_payload` del `HANDOFF` DELIVERED de `Cunning-Bard` (sesión `ses_ef6d3eb84ffexF0rCqbEnhwCir`), 8 secciones canónicas transcritas **literal** y en orden original, con sus listas, tablas anidadas, sub-puntos de foundation y checkpoints tal como los escribió el autor.
- Cambio material respecto del payload: **ninguno** en el cuerpo. Lo único añadido son `§9 Dependencias` y `§10 Referencia a spec`, derivaciones exigidas por `docs/plan-persistence.md > Estructura obligatoria del archivo Markdown`, más esta nota de persistencia y esta entrada de historial.
- `payload_revision: p1` (cuerpo inicial). `review_gate_revision: r1` **predeclarado** por el preflight; `review_gate` **no** se escribe: el gate no está despachado y registrar `REVIEWING` sin checkpoint sería una aserción falsa de ledger. El estado de la spec no se declara aquí: vive en [`./spec-meta.yaml`](./spec-meta.yaml).
- Sin diff de cuerpo: `p1` es la primera versión de este `plan_id`; no hay revisión previa que conservar.
- No se crean `implementation-plan.rev-2.md`, sidecars, mirrors ni variantes. Este archivo **no** modifica los planes base ni F2: sus ledgers e historiales quedan intactos.
- Cerrado como `DELIVERED` (persistencia documental), no como `VERIFIED`. F3–F10 siguen sin implementar, la reconciliación de 162 OP sigue abierta y el producto integral sigue sin cerrar. Este archivo no autoriza implementación.

### p2 — 2026-10-04 — cuerpo revisado por el gate `prg-final-frontend-remaining-execution` (`Lore Master`, escritura 3 de 4)

- Procedencia: `plan_payload_revised` del `PLAN_REVIEW_DISPOSITION` de `Cunning-Bard` (`payload_revision_in: p1` → `payload_revision_out: p2`), arbitrado por el orquestador sobre las nueve directivas válidas del digest `r1`. Sesión de referencia del artefacto: `ses_ef6b58b1fffeBhcUxay9pNXSRb+`. La materialización la ejecuta `Lore Master` como **único** writer de este `PLAN_PATH`; el Bard **no** escribe el archivo.
- `§1`–`§8` se **reemplazan** por el cuerpo revisado, transcrito literal y en orden canónico: 8 secciones, la tabla de write sets de `§4`, el fan-out de 6 paquetes de `§5.3`, el bloque F9 de `§5.4`, el bloque de integración de `§5.5` con su tabla de **entradas obligatorias**, F10 en `§5.6`, y una línea `**Cambios r1:**` al cierre de `§2`, `§3`, `§4`, `§5`, `§6`, `§7` y `§8` que declara, sección por sección, qué delta del gate lo produjo.
- Delta material del cuerpo: **nueve directivas incorporadas** — `D-security-auth-roles-pii-1` (conservación de borrador/error ligada al intento autorizado y purga síncrona de PII, `§5:80`), `D-api-contracts-1` parcial (UNT-006/007/008 como camino contratado, sin endpoint inventado, `§5:87`), `D-api-contracts-2` (memberships con GET colección/detalle y POST/PUT/PATCH/DELETE, `§2:30` y `§5:88`), `D-api-contracts-3` (204 sólo donde el contrato no devuelve cuerpo y `RCT-008` conserva `detail`/`unit_count`, `§5:78`), `D-correctness-1` (redirect `pending` a todo destino protegido registrado, `§5:104`), `D-correctness-2` (`meta.requiresTenant` canónico, `§5:102`), `D-correctness-3` (error y reintento de apariencia en la superficie contratada, `§5:108` y `§5:116`), `D-correctness-4` (tabla de entradas obligatorias LOGIN/Personalizador/Contraseña propia/Contexto, `§5:113-118`) y `D-correctness-5` (H0 limitado a seams de 2+ dominios y tests con harness autorizado, `§5:74`, `§7:153`, `§8:176`).
- Cambio de identificadores: **ninguno**. No se renombran SCREEN/FL/OP/AC, no se inventan IDs y no se altera la reconciliación de 162 OP ni la de los dos sistemas de IDs de `S/spec-meta.yaml:198-213`.
- `§9 Dependencias` y `§10 Referencia a spec` **no se reescriben**: son derivaciones de la persistencia y se conservan literales. Sus referencias de línea al cuerpo `p1` quedan **superadas** por la tabla de reubicación del bloque de gate de esta misma escritura (3 de 4).
- `payload_revision` se incrementa `p1 → p2` **porque el Bard entregó cuerpo revisado con delta**. `review_gate_revision` avanza `r1 → r2`. `review_gate` pasa a `VALIDATED`. `updated_at` no cambia: la fecha de esta revisión es la misma que la de la persistencia inicial (`2026-10-04`). `created_at` y la entrada `### p1` quedan literales.
- `status` de la spec **no** se toca. [`./spec-meta.yaml`](./spec-meta.yaml) sigue siendo la fuente única de su estado: `status: approved`, `verified_at: null`. Este gate no aprueba ni cierra la spec.
- Planes hermanos **intactos**: [`./implementation-plan.md`](./implementation-plan.md) (`p3`/`VALIDATED`/`r2`) y [`./implementation-plan-access.md`](./implementation-plan-access.md) (`p2`/`VALIDATED`/`r2`) no se leen para escribir ni se modifican. `F3`–`F10` no se reimplementan, no se re-verifican y no heredan `VALIDATED` de ningún plan previo.
- No se crean `implementation-plan.rev-2.md`, sidecars, mirrors ni variantes. Sin secrets, sin código, sin backend, sin base de datos, sin shell, sin navegador y sin subagentes.
- Cerrado como `DELIVERED` documental. `VALIDATED` **no** es `VERIFIED`: F3–F10 siguen sin implementar y la reconciliación de 162 OP sigue abierta. El veredicto lleva `implementation_authorized: no` literal.

---

## Plan Review Gate

### Ciclo `prg-final-frontend-remaining-execution` — 2026-10-04 — checkpoint prelaunch (`REVIEWING`, sin veredicto)

> 🕯️ **Alcance de esta escritura (1 de 4).** Checkpoint durable prelaunch de entrada a `REVIEWING`, escrito por `Lore Master` como writer único y secuencial de este `PLAN_PATH`, por delegación explícita del orquestador. Es la **primera** de las cuatro escrituras que el gate autoriza sobre este archivo. No es cuerpo del plan: **no** incrementa `payload_revision` (replica `p1`), **no** se replica en `## Historial de revisiones`, **no** toca `§1`–`§10`, **no** mueve el `status` de la spec, **no** abre ni modifica spec, ADR, bug ni plan hermano, y **no** declara veredicto. Los reviewers **no** fueron despachados por esta escritura.

| Campo | Valor |
|---|---|
| `gate_id` | `prg-final-frontend-remaining-execution` |
| `PLAN_PATH` | `docs/specs/final-frontend/implementation-plan-remaining.md` |
| `plan_id` | `final-frontend-remaining-execution` |
| `spec_id` | `spec-final-frontend-001` |
| `payload_revision` | `p1` (cuerpo vigente; replicado, **no** incrementado) |
| `review_gate_revision` | `r1` (único valor posible en la entrada; replicado) |
| Estado del gate | `REVIEWING` |
| Escrituras del gate usadas | **1 de 4** |
| Fecha del checkpoint | `2026-10-04` |
| `review_mode` | `plan` (read-only; sin barrido de repo ni auditoría de código) |
| `max_directives` | `5` por reviewer |
| `required_output` | `PLAN_REVIEW_REPORT` |
| `round_policy` | ronda única, sin retry, sin segunda invocación |
| **Ejes diferidos** | `none` (sin exclusión explícita del operador) |
| **Ejes sin verificar** | `none` (aún sin ronda) |
| Revisión inicial | `r1` |
| Revisión final | `r1` (en curso; el veredicto se persiste en la escritura 2/4) |

#### Selección congelada

Cuatro ejes con evidencia citable, uno por reviewer, dentro del cap local del gate (≤ 4). **Congelada antes del primer despacho**: no se amplía, sustituye ni recalcula durante el resto del gate; un hallazgo posterior se anota como observación y nunca abre un despacho adicional.

| # | Reviewer | Eje de dominio | Evidencia citable que dispara el eje (en este plan) |
|---:|---|---|---|
| 1 | `Dhampir-Slayer` | Seguridad y secretos — permisos, PII y superficie de autorización | `§5` pasos B (identidad) y C (autorización) y fase de integración; `§6` riesgos; contrato de permisos y PII citado en la evidencia del preflight: pantallas de **identidad** `:54-74` y de **autorización** `:79-118` (roles y overrides), más el tramo `technical-design.md:338-347`. |
| 2 | `Kobold-Scholar` | Datos y migraciones — esquema y rollback de apariencia | `§5` checkpoint F9 (base de datos/API) y su rollback; diseño técnico de los ocho campos `technical-design.md:279-320`; tareas de apariencia `:260-279`. |
| 3 | `Portal-Warden` | Contrato de API — endpoints, payloads y serialización | `§5` checkpoint H0 y los paquetes CRUD; diseño técnico de la superficie de apariencia `technical-design.md:322-355`. |
| 4 | `QA-Goblin` | Tests de flujos críticos — cobertura y correctitud de integración | `§5`–`§7` pasos, riesgos y verificaciones; cobertura de 36 pantallas / 99 flujos y rutas protegidas; guards de ciclo de vida y source en `P/router/guards.ts:95,190`. |

#### Invocaciones lógicas previstas

Cuatro, en una sola ronda paralela. `Lore Master` **no** despacha: registra lo que el orquestador dará a cada reviewer. Cada packet se ecoa con `plan_path` y los contadores del frontmatter; el reviewer verifica ambos al abrirlo y reporta la discrepancia en `unverified`.

**1 · `Dhampir-Slayer` — eje seguridad, permisos y PII**

```text
PLAN_REVIEW_PACKET
gate_id: prg-final-frontend-remaining-execution
plan_path: docs/specs/final-frontend/implementation-plan-remaining.md
payload_revision: p1
review_gate_revision: r1
review_mode: plan
axis: security_auth_roles_PII
axis_evidence: §5 pasos B/C e integración + §6; identidad :54-74; autorización :79-118
read_scope: PLAN_PATH; contracts/auth-context.md; contracts/authorization.md;
  contracts/organization-identity.md; technical-design.md:338-347; fragmentos exactos
  de guard y de sesión pública sólo para contrastar contratos
out_of_axis: correctitud de DB y de API de otros ejes
max_directives: 5
required_output: PLAN_REVIEW_REPORT
round_policy: ronda única, sin retry, sin segunda invocación
```

**2 · `Kobold-Scholar` — eje datos y apariencia**

```text
PLAN_REVIEW_PACKET
gate_id: prg-final-frontend-remaining-execution
plan_path: docs/specs/final-frontend/implementation-plan-remaining.md
payload_revision: p1
review_gate_revision: r1
review_mode: plan
axis: DB_appearance
axis_evidence: §5 checkpoint F9 y rollback; technical-design.md:279-320; tasks apariencia :260-279
read_scope: PLAN_PATH; technical-design; tareas de apariencia; modelo de Usuario (choices de
  campos); grafo de migraciones actual; settings ENGINE, y sólo settings ENGINE públicos
  para compatibilidad Django/SQLite
out_of_axis: seguridad, API y UI
max_directives: 5
required_output: PLAN_REVIEW_REPORT
round_policy: ronda única, sin retry, sin segunda invocación
```

**3 · `Portal-Warden` — eje contrato de API**

```text
PLAN_REVIEW_PACKET
gate_id: prg-final-frontend-remaining-execution
plan_path: docs/specs/final-frontend/implementation-plan-remaining.md
payload_revision: p1
review_gate_revision: r1
review_mode: plan
axis: API_contracts
axis_evidence: §5 H0 y paquetes CRUD; technical-design.md:322-355
read_scope: PLAN_PATH; contracts/*.md únicamente lo citado por el plan; newappearance;
  API reference pertinente; pattern de serialización y wire desconocido ya existente
out_of_axis: DB, auditoría de seguridad y UX
max_directives: 5
required_output: PLAN_REVIEW_REPORT
round_policy: ronda única, sin retry, sin segunda invocación
```

**4 · `QA-Goblin` — eje correctitud e integración**

```text
PLAN_REVIEW_PACKET
gate_id: prg-final-frontend-remaining-execution
plan_path: docs/specs/final-frontend/implementation-plan-remaining.md
payload_revision: p1
review_gate_revision: r1
review_mode: plan
axis: correctness_integration
axis_evidence: §5–§7 lifecycle; cobertura 36/99; rutas protegidas; guards de source :95,190
read_scope: PLAN_PATH; acceptance; core; shooting; appearance; experience; navigation;
  source de rutas públicas y guards de App — sólo las ramas citadas por el plan
out_of_axis: seguridad, DB y revisión de API
max_directives: 5
required_output: PLAN_REVIEW_REPORT
round_policy: ronda única, sin retry, sin segunda invocación
```

#### Nota de alcance del ledger

- Solo existen bloques de **identificación, selección congelada e invocaciones previstas**. No hay directivas, ni `Directivas válidas`, ni `Directivas descartadas`, ni tabla de `Reviewers`, ni `Veredicto`: la ronda aún no corre y la escritura 2 de 4 es la que materializa feedback, dispositions y veredicto.
- Los planes hermanos **no** pertenecen a este gate: [`./implementation-plan.md`](./implementation-plan.md) (`p3` / `VALIDATED` / `r2`) y [`./implementation-plan-access.md`](./implementation-plan-access.md) (`p2` / `VALIDATED` / `r2`) quedan intactos y con sus ledgers separados.
- `implementation_authorized: no`. Este checkpoint **no** autoriza implementación en ninguna forma. La orden humana de ejecución ya registrada en `§9` es un hecho **anterior y separado** de este gate, existente con independencia de él; este checkpoint no la crea, no la amplía y no la sustituye.
- **Reconciliación de lectoría (append-only, sin reescribir lo previo).** La nota de persistencia del encabezado, la viñeta «Gate no despachado» de `§9` y el estado de revisión de `§10` afirman, con la fecha de la persistencia `p1`, que **no** existe sección `## Plan Review Gate`, que `review_gate` está ausente y que hay `0 de 4` escrituras usadas. Esas tres afirmaciones eran **verdaderas el 2026-10-04 al cierre de la persistencia `p1`** y se conservan literales porque el ledger es append-only. Desde este checkpoint quedan **superadas**: el gate está en `REVIEWING`, la sección existe y las escrituras usadas son `1 de 4`. Prevalece esta subsección como estado vigente del gate; `§1`–`§8` (cuerpo `p1`) y la entrada `### p1` del historial no cambian.

> 🕯️ **Alcance de esta escritura (2 de 4).** Feedback `r1` y digest consolidado, escritos por `Lore Master` como writer único y secuencial de este `PLAN_PATH`, por delegación explícita del orquestador. Es la **segunda** de las cuatro escrituras que el gate autoriza. No es cuerpo del plan: **no** incrementa `payload_revision` (replica `p1`), **no** avanza `review_gate_revision` (replica `r1`), **no** se replica en `## Historial de revisiones`, **no** toca `§1`–`§10` ni la entrada `### p1`, **no** mueve el `status` de la spec, **no** abre ni modifica spec, ADR, bug ni plan hermano, y **no** declara veredicto: este gate sigue abierto. Los cuatro reviewers **no** fueron re-despachados, no hubo reintento, no hubo contra-auditoría y no se generó ningún reviewer adicional.

#### Identidad del ciclo y estado tras la ronda

| Campo | Valor |
|---|---|
| `gate_id` | `prg-final-frontend-remaining-execution` |
| `PLAN_PATH` | `docs/specs/final-frontend/implementation-plan-remaining.md` |
| `plan_id` | `final-frontend-remaining-execution` |
| `spec_id` | `spec-final-frontend-001` |
| `payload_revision` | `p1` (cuerpo vigente; replicado, **no** incrementado) |
| `review_gate_revision` | `r1` (replicado; **no** avanzado a `r2`) |
| Estado del gate (máquina de estados) | `REVIEWING` → **`FEEDBACK_PERSISTED`** |
| `review_gate` en frontmatter | `REVIEWING` — **sin cambio**: `FEEDBACK_PERSISTED` es estado **no terminal** de la máquina y no pertenece al enum cerrado de `review_gate` (`REVIEWING \| VALIDATED \| REJECTED \| BLOCKED \| OPERATOR_REQUIRED`), así que se registra en este ledger y el frontmatter conserva su valor literal |
| Escrituras del gate usadas | **2 de 4** |
| Fecha de la escritura | `2026-10-04` |
| Ronda | ronda única, **cerrada**: 4 de 4 reviewers entregaron `PLAN_REVIEW_REPORT`; **cero** redispatch, **cero** retry, **cero** reemplazo |
| Reportes válidos | **4** |
| Directivas válidas | **9** (1 `security_auth_roles_PII` + 3 `API_contracts` + 5 `correctness_integration`) |
| Directivas descartadas | **0** |
| Directivas duplicadas / fusionadas | **0** |
| **Ejes diferidos** | `none` (sin exclusión explícita del operador) |
| **Ejes sin verificar** | `none` (ningún eje quedó terminal: los cuatro entregaron reporte) |
| Revisión inicial | `r1` |
| Revisión final | `r1` (en curso: el digest va al Bard y el veredicto se persiste en la escritura 3/4) |

> 📜 **Reconciliación de lectoría (append-only).** La escritura 1 anticipó por escrito que «el veredicto se persiste en la escritura 2/4». Con nueve directivas válidas esa anticipación **queda superada**: la escritura 2/4 materializa el feedback de `r1` **sin** veredicto, y el veredicto corresponde a la escritura 3/4. El texto de la escritura 1 se conserva literal y no se reescribe.

#### Selección congelada (vigente, no reescrita)

La selección no se amplía, sustituye ni recalcula: sigue siendo la del bloque homónimo de la escritura 1 — `Dhampir-Slayer` (seguridad, permisos y PII), `Kobold-Scholar` (datos y migraciones de apariencia), `Portal-Warden` (contrato de API) y `QA-Goblin` (correctitud e integración), cuatro ejes con evidencia citable, uno por reviewer. Estado declarado en esta escritura:

| Campo | Valor |
|---|---|
| **Ejes diferidos** | `none` |
| **Ejes sin verificar** | `none` |
| `payload_revision` | `p1` |
| Revisión inicial | `r1` |
| Revisión final | `r1` (en curso) |

#### Directivas válidas

Nueve, todas con los tres ejes de filtrado superados (**dominio**, **scope**, **evidencia**). En esta escritura las columnas de **Disposición** y **Arbitraje** quedan `pendiente`: son el producto del `PLAN_REVIEW_DISPOSITION` del Bard y del arbitraje del orquestador, no de esta persistencia.

| ID | Eje | Severidad | Reclamo | Evidencia | Disposición | Arbitraje |
|---|---|---|---|---|---|---|
| `D-security-auth-roles-pii-1` | `security_auth_roles_PII` | material | «formularios conservados ante error» no está ligado a un principal, contexto ni recurso concretos. | plan `§5:80,91`; `contracts/organization-identity.md:27`; `contracts/auth-context.md:35` | pendiente | pendiente |
| `D-api-contracts-1` | `API_contracts` | material | La eliminación simple de `OrganizationUnit` aparece en el plan sin contrato documentado. | `docs/06_API_REFERENCE.md:173-178`; `contracts/organization-identity.md:12-13` | pendiente | pendiente |
| `D-api-contracts-2` | `API_contracts` | material | El CRUD de memberships promete updates que el contrato no cubre. | `docs/06_API_REFERENCE.md:235-241`; `contracts/organization-identity.md:44` | pendiente | pendiente |
| `D-api-contracts-3` | `API_contracts` | material | «DELETE 204 sin lectura JSON» contradice la operación de quitar Unidad de Recinto. | `docs/06_API_REFERENCE.md:214-215`; `contracts/organization-identity.md:15-16`; `OPRCT008` | pendiente | pendiente |
| `D-correctness-1` | `correctness_integration` | material | El redirect `pending` está cableado hacia el writer de dashboard y sólo hacia él, y se pierde el deep link hacia una ruta nueva. | `P/router/guards.ts:100,190`; `§5` fase de integración | pendiente | pendiente |
| `D-correctness-2` | `correctness_integration` | material | El comentario del encargo F2 «sin metadatos» choca con el contrato de las 29 rutas con metadatos. | `P/router/guards.ts:8-9`; `P/router/routes.ts:20-56`; `S/experience/navigation.md:122-124` | pendiente | pendiente |
| `D-correctness-3` | `correctness_integration` | material | El fallo de apariencias no tiene superficie asignada ni prioridad designada. | plan `§5` conteo 36; `P/router/guards.ts:107-140` (terminales de routing) | pendiente | pendiente |
| `D-correctness-4` | `correctness_integration` | material | El personalizador y el cambio de contraseña del login no tienen punto de entrada acreditado. | `§5` integración; `S/experience/navigation.md:42,102,103` | pendiente | pendiente |
| `D-correctness-5` | `correctness_integration` | material | Los tests del gate mínimo se escriben sin runner vigente y H0 abarca todos los catálogos. | `front/package.json:6-10`; plan `§7`, `§8` | pendiente | pendiente |

#### Directivas descartadas

`none`. Las nueve directivas del digest superaron los tres ejes de filtrado; **cero** descartes por dominio, **cero** por scope, **cero** por evidencia, y **cero** duplicados que exijan fusión por el mecanismo de deduplicación.

#### Reviewers

| Reviewer | Eje | Stance | Directivas |
|---|---|---|---:|
| `Dhampir-Slayer` | `security_auth_roles_PII` | partial | 1 |
| `Kobold-Scholar` | `DB_appearance` | accept | 0 |
| `Portal-Warden` | `API_contracts` | partial | 3 |
| `QA-Goblin` | `correctness_integration` | partial | 5 |

- **`Dhampir-Slayer` — `partial`.** Una sola directiva, anclada en el texto del plan: la conservación de formularios y su error no están atados a principal, contexto ni recurso, y la purga de PII y secretos necesita un disparador síncrono declarado. Cobertura con reserva: ver «Reserva de cobertura del eje de seguridad» más abajo.
- **`Kobold-Scholar` — `accept`.** **Cero** directivas. Ancla el diseño ya cerrado de los ocho campos con sus `choices`/`defaults` exactos, las ocho `constraints`, la conservación de `legacy`, el grafo de migraciones **intacto** hasta `0020` y el rollback identificado del plan `§5:86-88`. **No** observó migración aplicada, respaldo ni runtime de base de datos.
- **`Portal-Warden` — `partial`.** Tres directivas de contrato (borrado simple, updates de memberships, `204` general) que el plan no puede sostener con el API reference citable. Las tres piden cambios concretos anclados, no reformuleos de estilo.
- **`QA-Goblin` — `partial`.** Cinco directivas de correctitud e integración (guards y deep link, `meta` de rutas, barrera de apariencias, los cuatro síntomas, gate mínimo de tests), ancladas en el plan y en el source que el propio plan cita.

> 🕯️ **Los cuatro reportes son `review_mode: plan`.** Todos leyeron el texto del plan; ninguno afirma runtime, base de datos, ejecución observada ni cobertura de código. Ninguna de las nueve directivas es una aserción de comportamiento observado.

#### Digest consolidado `r1` (material `PLAN_REVIEW_DIGEST`)

🪶 Este es el **único** material que el Bard recibe. Por diseño del gate **no contiene identidad de reviewer** —ni `reviewer`, ni `stance`, ni `stance_rationale`—: obliga a discutir evidencia, no autoridad. La trazabilidad nominal de los cuatro reportes vive en la tabla siguiente y en el audit trail del orquestador.

```text
PLAN_REVIEW_DIGEST
gate_id: prg-final-frontend-remaining-execution
plan_path: docs/specs/final-frontend/implementation-plan-remaining.md
payload_revision: p1
review_gate_revision: r1
directives:
- id: D-security-auth-roles-pii-1
  axis: security_auth_roles_PII
  target: §5 paquete B/F4 y fase de integración
  claim: "formularios conservados ante error" no está ligado a principal, contexto ni recurso concretos
  evidence: plan §5:80,91; contracts/organization-identity.md:27; contracts/auth-context.md:35
  severity: material
  requested_change: conservar el formulario y su error sólo para el mismo intento autorizado (principal/contexto/recurso), limpiar secretos de éxito y de cierre, y purgar PII y errores privados de forma síncrona en logout, cambio de principal o contexto invalidado, sin que una completitud tardía repueble lo purgado
- id: D-api-contracts-1
  axis: API_contracts
  target: §5 paquete A/F3, línea 79
  claim: la eliminación simple de OrganizationUnit aparece en el plan sin contrato documentado
  evidence: docs/06_API_REFERENCE.md:173-178; contracts/organization-identity.md:12-13
  severity: material
  requested_change: retirar la eliminación simple del paquete y usar la operación documentada de eliminación con migración y destino elegible; sin endpoint nuevo
- id: D-api-contracts-2
  axis: API_contracts
  target: §5 paquete B/F4, línea 80
  claim: el CRUD de memberships promete updates que el contrato no cubre
  evidence: docs/06_API_REFERENCE.md:235-241; contracts/organization-identity.md:44
  severity: material
  requested_change: limitar a GET/POST/DELETE, salvo contrato aprobado y citable para PUT/PATCH
- id: D-api-contracts-3
  axis: API_contracts
  target: §5 checkpoint H0, línea 70
  claim: "DELETE 204 sin lectura JSON" contradice la operación de quitar Unidad de Recinto
  evidence: docs/06_API_REFERENCE.md:214-215; contracts/organization-identity.md:15-16; OPRCT008
  severity: material
  requested_change: reservar 204 sin cuerpo para el endpoint específico y preservar el detail/unit_count en JSON que exige OPRCT008
- id: D-correctness-1
  axis: correctness_integration
  target: §5 guard y fase de integración, línea 90
  claim: el redirect pending está cableado hacia el writer de dashboard y sólo hacia él, y se pierde el deep link hacia una ruta nueva
  evidence: P/router/guards.ts:100,190; §5 fase de integración
  severity: material
  requested_change: writer para todo destino protegido interceptado original y validadores registrados, con un único consumidor final y sin bucles
- id: D-correctness-2
  axis: correctness_integration
  target: §4 write set de A/integración y §5 paso 5, línea 89
  claim: el comentario del encargo F2 "sin metadatos" choca con el contrato de las 29 rutas con metadatos
  evidence: P/router/guards.ts:8-9; P/router/routes.ts:20-56; S/experience/navigation.md:122-124
  severity: material
  requested_change: explicitar que la restricción fuera de scope del encargo F2 no es prohibición global del resto, y usar los campos meta canónicos para las rutas restantes antes del catch-all, sin reescribir F2 ni inventar campos extra
- id: D-correctness-3
  axis: correctness_integration
  target: §5 barrera de apariencia y §5 paso 6 (F10)
  claim: el fallo de apariencias no tiene superficie asignada ni prioridad designada
  evidence: plan §5 conteo 36; P/router/guards.ts:107-140 (terminales de routing)
  severity: material
  requested_change: asignar error y reintento en la superficie contratada ya existente (idealmente el personalizador de pantalla) y respetar que las sesiones terminales siempre preceden, sin falso desbloqueo ni bucle de carga
- id: D-correctness-4
  axis: correctness_integration
  target: §5 paso 5 (cuatro síntomas) y §7 observables
  claim: el personalizador y el cambio de contraseña del login no tienen punto de entrada acreditado
  evidence: §5 integración; S/experience/navigation.md:42,102,103
  severity: material
  requested_change: archivo o símbolo más route más observable por cada uno: login visible con sesión anónima o expirada sin hacer POST logout para llegar a login; personalizador como entrada del menú de usuario; contraseña propia en la acción contratada, sin identidad fabricada; el slider de contexto abre el contexto visible de la route actual y no un click vacío; y el acceso al personalizador distinguible de forma inequívoca
- id: D-correctness-5
  axis: correctness_integration
  target: §5 checkpoint H0 y §7/§8
  claim: los tests del gate mínimo se escriben sin runner vigente y H0 abarca todos los catálogos
  evidence: front/package.json:6-10; plan §7, §8
  severity: material
  requested_change: reducir H0 a los seams de dos dominios más los módulos de resto con owner local; alinear los tests con el harness autorizado, con evidencia de gates y sin eliminar los tests formales que exige la spec; bloqueo real, sin instalar unilateralmente, si no hay harness o permisos
required_output: PLAN_REVIEW_DISPOSITION
```

#### Trazabilidad nominal de los cuatro reportes

Esta tabla **sí** identifica autores: es ledger, no digest. Conserva el `stance` declarado por cada uno sin reinterpretarlo.

| Reporte | Eje | Stance | Contadores leídos | Directivas | Anclas declaradas |
|---|---|---|---|---:|---|
| `Dhampir-Slayer` | `security_auth_roles_PII` | `partial` | `payload_revision_in: p1`; `review_gate_revision_in: r1` | 1 | plan `§5:80,91`; `contracts/organization-identity.md:27`; `contracts/auth-context.md:35` |
| `Kobold-Scholar` | `DB_appearance` | `accept` | no reproducidos en el resumen de la delegación | 0 | ocho campos con `choices`/`defaults`; ocho `constraints`; `legacy` conservado; grafo de migraciones intacto hasta `0020`; rollback del plan `§5:86-88` |
| `Portal-Warden` | `API_contracts` | `partial` | alias `payload_revision: p1`; `review_gate_revision: r1` | 3 | `docs/06_API_REFERENCE.md:173-178,214-215,235-241`; `contracts/organization-identity.md:12-13,15-16,44`; `OPRCT008` |
| `QA-Goblin` | `correctness_integration` | `partial` | alias `payload_revision: p1`; `review_gate_revision: r1` | 5 | `P/router/guards.ts:8-9,100,107-140,190`; `P/router/routes.ts:20-56`; `front/package.json:6-10`; `S/experience/navigation.md:42,102,103,122-124` |

#### Normalización contractual de los reportes

Aplicable al gate `prg-final-frontend-remaining-execution`, sin alterar `stance` ni evidencia de ningún reporte.

| Reporte | Qué ocurrió | Tratamiento del orquestador | Efecto en el ledger |
|---|---|---|---|
| `Portal-Warden` | Reportó `payload_revision: p1` y `review_gate_revision: r1` como campos sin sufijo `_in`. | Tratados como `payload_revision_in` / `review_gate_revision_in`. Ambos valores coinciden con el frontmatter y con el checkpoint durable. | Eco verificado; **ninguna** revisión inventada, **ningún** desfase. |
| `QA-Goblin` | Mismo alias, mismos valores `p1` / `r1`, checkpoint confirmado. | Idéntico tratamiento. | Eco verificado; **ninguna** revisión inventada. |
| `Dhampir-Slayer` | Reportó `payload_revision_in: p1` y `review_gate_revision_in: r1` con la forma nominal del contrato. | Eco nominal del packet. | Verificado. |
| `Kobold-Scholar` | El resumen de la delegación **no reproduce** sus contadores leídos. | Esta escritura **no** los inventa ni los corrige: el cuerpo sigue anclado en `p1` por el frontmatter y el checkpoint durable. | No se abre `unverified_axes`: el eje entregó reporte y el orquestador confirma el estado `FEEDBACK_PERSISTED`. |
| `Portal-Warden` | Usó `severity: ALTA` en sus tres directivas. | Traducido a la severidad canónica **`material`** del digest: las tres piden cambios concretos anclados en contrato citable, no reformuleos de estilo. | Valor original conservado abajo; `stance` y evidencia **intactas**. |
| `QA-Goblin` | Usó `severity: high` / `medium`, sin desglose por directiva en el resumen de la delegación. | Traducido a **`material`** por la misma razón. La asignación por directiva **no se reparte ni se inventa**. | Valor original conservado abajo; `stance` y evidencia **intactas**. |
| `Dhampir-Slayer` | `severity: material` literal. | Sin traducción. | `material`. |
| `Kobold-Scholar` | Sin directivas. | No aplica severidad. | — |

| Valor `severity` original | Clasificación canónica registrada en el digest | Motivo de la traducción |
|---|---|---|
| `material` (literal de `Dhampir-Slayer`) | `material` | Sin traducción. |
| `ALTA` (`Portal-Warden`, 3 directivas) | `material` | Reclamo con cambio concreto exigido y evidencia citable; no es estilo. |
| `high` / `medium` (`QA-Goblin`, 5 directivas) | `material` | Reclamo con cambio concreto exigido y anclaje en el plan o en el source citado; no es estilo. |

#### Reserva de cobertura del eje de seguridad

- El reporte `Dhampir-Slayer` declara haber cargado **únicamente su skill base**, pese a que la solicitud del eje era amplia. Se registra exactamente eso: **incumplimiento del stack de skills solicitado**. No se afirma que las skills complementarias se hayan cargado, ni se da por hecho qué cubrían.
- La revisión de ese eje se **acepta con reserva**: el alcance del gate era el texto del plan (`review_mode: plan`, read-only) y la evidencia entregada sí cubre el **source del plan** y la **base del eje**. **No** se auditó código ni el stack de skills, y esta escritura no pretende lo contrario.
- Consecuencia registrada: la única directiva de seguridad se persiste íntegra y sigue el ciclo normal, pero la cobertura de este eje **no** equivale a una auditoría de implementación. Cualquier necesidad de ese tipo pertenece a un workstream futuro, no a este gate.
- No se generó ningún reviewer adicional, ni reintento, ni contra-auditoría para suplir la reserva.

#### Nota de alcance del ledger (escritura 2)

- Esta escritura **no declara veredicto**: el gate está en `FEEDBACK_PERSISTED`, no terminal. Los veredictos `VALIDATED`, `REJECTED`, `BLOCKED` y `OPERATOR_REQUIRED` se persisten en la escritura 3/4 (o 4/4 según el camino de cierre), y ese bloque todavía no existe.
- `implementation_authorized: no` se mantiene **literal** en este gate, sin excepción y sin autorización de ninguna forma. El digest de arriba **no** autoriza implementación: es material de disposición para `Cunning-Bard`, no una orden de ejecutar. La orden humana registrada en `§9` es un hecho **anterior y separado** de este gate; esta escritura no la crea, no la amplía y no la sustituye.
- `payload_revision` sigue en `p1`: sin cuerpo revisado del Bard no hay delta que materializar, y el `## Historial de revisiones` permanece con su única entrada `### p1`.
- No se replicaron los hallazgos ya cubiertos por los planes base o F2, ni se reescribió su ledger: [`./implementation-plan.md`](./implementation-plan.md) (`p3` / `VALIDATED` / `r2`) y [`./implementation-plan-access.md`](./implementation-plan-access.md) (`p2` / `VALIDATED` / `r2`) quedan intactos y con sus secciones separadas.
- Cero secretos: el digest no contiene credenciales, cabeceras de autenticación ni datos personales. Las referencias se conservan como `archivo:línea` y los endpoints se citan por su ruta lógica documentada.
- Write set de esta escritura: **sólo** este `PLAN_PATH`. No se tocó `spec-meta.yaml`, `docs/decisions/`, `opencode.json`, plugins, dependencias, permisos, modelos, base de datos, navegador ni subagentes.

> 🕯️ **Alcance de esta escritura (3 de 4).** Cuerpo revisado `p2` + disposiciones + arbitraje + veredicto, escritos por `Lore Master` como writer único y secuencial de este `PLAN_PATH`, por delegación explícita del orquestador. Es la **tercera** de las cuatro escrituras que el gate autoriza y la **última** de este ciclo: el veredicto es terminal en `r2`. **Sí** materializa cuerpo —el `plan_payload_revised` del Bard—, y por eso incrementa `payload_revision` (`p1 → p2`) y `review_gate_revision` (`r1 → r2`). No mueve el `status` de la spec, no abre ni modifica spec, ADR, bug ni plan hermano, y no re-despacha reviewers.

> 📜 **Reconciliación de lectoría (append-only).** El encabezado de este ciclo —«checkpoint prelaunch (`REVIEWING`, sin veredicto)»— lo congeló la escritura 1 de 4 y **no se reescribe**: el ledger es append-only y ese texto era exacto en su fecha. El estado **vigente** del ciclo es el de esta escritura: `review_gate: VALIDATED`, `payload_revision_final: p2`, `review_gate_revision_final: r2`, `3 de 4` escrituras, veredicto terminal en el bloque `#### Veredicto` de más abajo. Quien lea sólo el encabezado está leyendo la foto del checkpoint, no el estado del gate.

#### Identidad del ciclo y estado al cierre

| Campo | Valor |
|---|---|
| `gate_id` | `prg-final-frontend-remaining-execution` |
| `PLAN_PATH` | `docs/specs/final-frontend/implementation-plan-remaining.md` |
| `plan_id` | `final-frontend-remaining-execution` |
| `spec_id` | `spec-final-frontend-001` |
| `payload_revision` | `p1` → **`p2`** (cuerpo revisado materializado en `§1`–`§8`) |
| `review_gate_revision` | `r1` → **`r2`** |
| Estado del gate (máquina de estados) | `REVIEWING` → `FEEDBACK_PERSISTED` → **`VALIDATED`** (terminal) |
| `review_gate` en frontmatter | `VALIDATED` |
| Escrituras del gate usadas | **3 de 4** (cuarta disponible, **no** necesaria: `VALIDATED` en `r2` no habilita `BARD_CORRECTION_2`) |
| Fecha de la escritura | `2026-10-04` |
| Ronda | ronda única, **cerrada**; **cero** redispatch, **cero** retry, **cero** reviewer adicional |
| `PLAN_REVIEW_DISPOSITION` recibido | 9 de 9 directivas válidas dispositionadas; `payload_revision_out: p2`; `unresolved: none` |
| Reportes / directivas / descartes | 4 reviewers · 9 directivas válidas · 0 descartadas |

#### Selección congelada (vigente, no reescrita)

La selección **no** se amplía, sustituye ni recalcula respecto de los bloques de las escrituras 1 y 2: `Dhampir-Slayer` (seguridad, permisos y PII), `Kobold-Scholar` (datos y migraciones de apariencia), `Portal-Warden` (contrato de API) y `QA-Goblin` (correctitud e integración). Cuatro ejes con evidencia citable, uno por reviewer, dentro del cap local del gate (≤ 4).

| Campo | Valor |
|---|---|
| **Ejes diferidos** | `none` (sin exclusión explícita del operador) |
| **Ejes sin verificar** | `none` (los cuatroaxes entregaron reporte; ninguno quedó terminal) |
| `payload_revision` | `p2` |
| Revisión inicial | `r1` |
| Revisión final | **`r2`** |

#### Directivas válidas

Nueve, con los tres ejes de filtrado superados (dominio, scope, evidencia). Las columnas **Disposición** y **Arbitraje** que quedaron `pendiente` en la escritura 2 de 4 se resuelven aquí con el `PLAN_REVIEW_DISPOSITION` del Bard y el arbitraje del orquestador. **Ninguna directiva queda `deferred`**: no existe ese pseudoestado; `deferred_axes` es `none` y sólo por exclusión explícita del operador, que no se produjo.

| ID | Eje | Severidad | Reclamo | Evidencia | Disposición | Arbitraje |
|---|---|---|---|---|---|---|
| `D-security-auth-roles-pii-1` | `security_auth_roles_PII` | material | «formularios conservados ante error» no está ligado a un principal, contexto ni recurso concretos. | plan `§5:80,91`; `contracts/organization-identity.md:27`; `contracts/auth-context.md:35` | `accept` | `resolved` |
| `D-api-contracts-1` | `API_contracts` | material | La eliminación simple de `OrganizationUnit` aparece en el plan sin contrato documentado. | `docs/06_API_REFERENCE.md:173-178`; `contracts/organization-identity.md:12-13` | `partial` | `resolved` |
| `D-api-contracts-2` | `API_contracts` | material | El CRUD de memberships promete updates que el contrato no cubre. | `docs/06_API_REFERENCE.md:235-241`; `contracts/organization-identity.md:44` | `accept` | `resolved` |
| `D-api-contracts-3` | `API_contracts` | material | «DELETE 204 sin lectura JSON» contradice la operación de quitar Unidad de Recinto. | `docs/06_API_REFERENCE.md:214-215`; `contracts/organization-identity.md:15-16`; `OPRCT008` | `accept` | `resolved` |
| `D-correctness-1` | `correctness_integration` | material | El redirect `pending` está cableado hacia el writer de dashboard y sólo hacia él, y se pierde el deep link hacia una ruta nueva. | `P/router/guards.ts:100,190`; `§5` fase de integración | `accept` | `resolved` |
| `D-correctness-2` | `correctness_integration` | material | El comentario del encargo F2 «sin metadatos» choca con el contrato de las 29 rutas con metadatos. | `P/router/guards.ts:8-9`; `P/router/routes.ts:20-56`; `S/experience/navigation.md:122-124` | `accept` | `resolved` |
| `D-correctness-3` | `correctness_integration` | material | El fallo de apariencias no tiene superficie asignada ni prioridad designada. | plan `§5` conteo 36; `P/router/guards.ts:107-140` (terminales de routing) | `accept` | `resolved` |
| `D-correctness-4` | `correctness_integration` | material | El personalizador y el cambio de contraseña del login no tienen punto de entrada acreditado. | `§5` integración; `S/experience/navigation.md:42,102,103` | `accept` | `resolved` |
| `D-correctness-5` | `correctness_integration` | material | Los tests del gate mínimo se escriben sin runner vigente y H0 abarca todos los catálogos. | `front/package.json:6-10`; plan `§7`, `§8` | `accept` | `resolved` |

**Totales:** 9 válidas · **8 `accept`** · **1 `partial`** · **0 `reject`** · **0 `unresolved`** · **0 descartadas**.

#### Registro de deltas por directiva (cuerpo `p2`)

Cada fila dice **qué cambió en el cuerpo** y **dónde vive ahora**. Es la trazabilidad entre el `plan_delta` declarado y el texto efectivamente persistido; no reinterpreta ni amplía ninguna disposición.

| ID | `plan_delta` materializado | Ancla en `p2` |
|---|---|---|
| `D-security-auth-roles-pii-1` | La conservación de borrador/error se ata al **mismo intento autorizado** con fallo confirmado; secretos limpiados en éxito y en cierre; purga de PII, borradores y errores privados **síncrona** en `logout`/expiración/cambio de principal/contexto o recurso invalidado; invalidación antes de abortar y sin repoblar por completitud tardía. | `§5:80`; riesgos en `§6:134`; verificación en `§7:161` |
| `D-api-contracts-1` | **Parcial**: se conserva la operación contratada (UNT-006 como AC separado, preview UNT-007 con ocho contadores → POST UNT-008 con destino elegible, raíz obligatoria, advertencia de assignments no reasignados) y se **retira la lectura de «eliminación simple» como camino equivalente**, sin endpoint ni migración inventados. Lo no incorporado: eliminar la operación del paquete por completo. | `§5:87`; `§2:30`; verificación en `§7:157` |
| `D-api-contracts-2` | Memberships con GET de colección y de detalle y POST/PUT/PATCH/DELETE, apoyados en el inventario de AC y en el method mapping real del viewset, no en la síntesis del API reference. | `§2:30`; `§5:88`; `§7:157` |
| `D-api-contracts-3` | Respuesta **por endpoint y por OP**: 204 sin lectura JSON donde el contrato no devuelve cuerpo; DELETE con JSON validado y `OPRCT-008` conserva `detail`/`unit_count` sin perderlos. | `§5:78`; `§5:87`; `§7:157` |
| `D-correctness-1` | El redirect `pending` escribe **todo destino protegido registrado**, no sólo el writer de dashboard; se preserva el destino original y el login forzado con contexto; un único consumidor final por intento, sin ciclos ni self-redirect, sin interceptar controles internos ni queries sensibles. | `§5:104`; `§5:105`; `§7:159` |
| `D-correctness-2` | La restricción de metadatos de F2 se declara **acotada a aquel encargo**, no prohibición global; las rutas restantes usan `meta.requiresTenant` canónico y único, sin inventar `requiresAuth` ni `adminOnly`, sin reescribir nombres ni clasificación de F2. | `§5:102`; `§4:65`; `§8:174` |
| `D-correctness-3` | El fallo de apariencia recibe **superficie contratada** (SCREEN `PERSONALIZER`, `PersonalizerView`/`AppearanceFeedback` de F) y **prioridad** (público → control → terminal de sesión → restore de apariencia con principal válido → contenido de operación), sin SCREEN extra, sin escritura si el restore falla y sin loop de carga. | `§5:107`; `§5:108`; `§5:109`; `§6:142`; `§7:160` |
| `D-correctness-4` | Se incorpora la tabla de **entradas obligatorias** con archivo o símbolo, ruta y observable por cada entrada: `LOGIN`, personalizador, contraseña propia y contexto. | `§5:111-118`; `§4:65`; `§7:158`; `§8:175` |
| `D-correctness-5` | H0 se reduce a los seams consumidos por **2+ dominios**; el resto de catálogos pasa a owner local que publica tipos, API y validadores temprano. Los tests se alinean con el **harness autorizado**: si no existe o no está disponible, el bloqueo es explícito y no se instala nada por iniciativa propia. | `§5:74`; `§5:75`; `§2:32`; `§3:42`; `§7:153`; `§8:176`; `§8:177` |

#### Arbitraje del orquestador sobre las nueve directivas

Cuatro ejes de arbitraje —**contratos**, **scope**, **evidencia** y **coherencia**— y nada más. El orquestador **no** suplanta la apreciación técnica del especialista: cuando el conflicto se resolvía con evidencia citable de contrato o de source, lo resolvió; cuando habría exigido juicio técnico, no habría arbitrado y habría pedido decisión del operador.

| ID | Ejes de arbitraje aplicados | Resultado |
|---|---|---|
| `D-security-auth-roles-pii-1` | Contrato ✔ (disposición bien formada) · Scope ✔ (c lifecycle del scope fijado, no trabajo nuevo) · Evidencia ✔ (el delta existe en `p2`) · Coherencia ✔ (no contradice `§3` ni F2) | **`accept` + delta presente → `resolved`** |
| `D-api-contracts-1` | Contrato ✔ · Scope ✔ · Evidencia ✔ con **contraste directo del orquestador** en `apps/organizations/views.py:29-39` · Coherencia ✔ | **`partial` con evidencia y delta coherente → `resolved`** |
| `D-api-contracts-2` | Contrato ✔ · Scope ✔ · Evidencia ✔ con **contraste directo del orquestador** en `apps/identity/views.py:140-146` · Coherencia ✔ | **`accept` + delta presente → `resolved`** |
| `D-api-contracts-3` | Contrato ✔ · Scope ✔ · Evidencia ✔ (`OPRCT008` y el inventario de AC) · Coherencia ✔ (el `204` deixa de ser regla global) | **`accept` + delta presente → `resolved`** |
| `D-correctness-1` a `D-correctness-5` | Contrato ✔ · Scope ✔ · Evidencia ✔ (cada una anclada en el plan o en el source que el propio plan cita) · Coherencia ✔ (los cinco deltas conviven sin contradecirse) | **`accept` + delta presente → `resolved`** (×5) |

**Sobre el `partial` de `D-api-contracts-1`.** La directiva pedía retirar del paquete la eliminación simple de `OrganizationUnit`. El Bard la dispositiona `partial` y conserva la operación contratada: el API reference (`docs/06_API_REFERENCE.md:173-178`) **resume** y omite, mientras que el contrato aprobado y el inventario de AC sí labladuran, y el contraste directo del orquestador en `apps/organizations/views.py:29-39` muestra un `ModelViewSet` cuyo `action_permission_map` declara `lookup`, `previsualizar_eliminacion` y `eliminar_con_migracion` —es decir, el camino de **migración con destino elegible** es el que tiene mapa de permisos declarado, y laomisión del API reference **no** equivale a ausencia de contrato. El `partial` no es entonces una claudicación ante la evidencia: es la disposición que concilia la omisión documental con el contrato aprobado. Queda registrado que el **fichero de API reference sigue resumiendo la operación** y que esa divergencia documental **no se corrige en este gate** (queda fuera de su write set): es discrepancia de documento aprobado, no cambio de implementación.

**Sobre `D-api-contracts-2`.** Although el API reference (`docs/06_API_REFERENCE.md:235-241`) no expone `PUT`/`PATCH` para memberships, el contraste directo del orquestador en `apps/identity/views.py:140-146` lee el `action_permission_map` del viewset de `UnitMembership` con `list`, `retrieve`, `create`, `update`, `partial_update` y `destroy` mapeados a `read`/`create`/`update`/`delete`. Es decir: los métodos **existen y están mapeados**; la omisión es del resumen del API reference. La directiva se acepta sobre esa evidencia y el plan incorpora el método, alineado con el inventario de AC (`acceptance/identity.md:74-79`).

#### Directivas descartadas

`none`. Las nueve directivas del digest superaron los tres ejes de filtrado; **cero** descartes por dominio, **cero** por scope, **cero** por evidencia y **cero** duplicados que exijan fusión por el mecanismo de deduplicación. Ningún `out_of_axis_observation` se promovió a directiva.

#### Reviewers

| Reviewer | Eje | Stance | Directivas |
|---|---|---|---:|
| `Dhampir-Slayer` | `security_auth_roles_PII` | partial | 1 |
| `Kobold-Scholar` | `DB_appearance` | accept | 0 |
| `Portal-Warden` | `API_contracts` | partial | 3 |
| `QA-Goblin` | `correctness_integration` | partial | 5 |

- **`Dhampir-Slayer` — `partial`.** Su única directiva se dispositiona `accept` y su delta está en `§5:80`. El **stance** del reporte se conserva **literal** y no se recalcula por el resultado de la disposición: `stance` mide el plan dentro del eje; `disposition` mide la directiva.
- **`Kobold-Scholar` — `accept`.** Cero directivas. Su cobertura se apoya en el diseño ya cerrado de los ocho campos con sus `choices`/`defaults`, las ocho `constraints`, la conservación de `legacy`, el grafo de migraciones intacto y el rollback del plan, hoy en `§5:94-99`. **No** observó migración aplicada, respaldo ni runtime de base de datos; ese límite se conserva.
- **`Portal-Warden` — `partial`.** Sus tres directivas quedan `partial`, `accept`, `accept`; las tres se resuelven con el contraste de source que el orquestador registries arriba. Su `stance` sigue `partial`.
- **`QA-Goblin` — `partial`.** Sus cinco directivas quedan las cinco `accept`, con delta en el cuerpo. Su `stance` sigue `partial`.

> 🕯️ **Reserva del eje de seguridad: se conserva, no se corrige.** El reporte `Dhampir-Slayer` declaró haber cargado **únicamente su skill base**. Esa limitación de cobertura queda **literal** en el bloque «Reserva de cobertura del eje de seguridad» de la escritura 2 de 4 y **esta escritura no finge la carga que no ocurrió ni modifica el reporte original**. Se registra además, por declaración del orquestador, que la revisión de seguridad del **plan base** está cubierta fuera de este gate; lo que este gate cubre es el **texto de este plan**. Consecuencia intacta: la cobertura de este eje **no equivale a una auditoría de implementación**, y la única directiva de seguridad siguió su ciclo normal.

#### Veredicto

`PLAN_REVIEW_VERDICT` **literal** tal como lo emitió el orquestador. `Lore Master` lo transcribe: no lo deriva, no lo corrige, no lo reinterpreta.

```text
PLAN_REVIEW_VERDICT
gate_id: prg-final-frontend-remaining-execution
plan_path: docs/specs/final-frontend/implementation-plan-remaining.md
payload_revision_final: p2
review_gate_revision_final: r2
verdict: VALIDATED
reviewers: Dhampir-Slayer:security_auth_roles_PII:partial; Kobold-Scholar:DB_appearance:accept; Portal-Warden:API_contracts:partial; QA-Goblin:correctness_integration:partial
directives_total: 9
accepted: 8
partial: 1
rejected_with_evidence: 0
unresolved: 0
discarded: 0
deferred_axes: none
unverified_axes: none
operator_decision_required: none
implementation_authorized: no
```

#### Condiciones de cierre de esta escritura

- **`implementation_authorized: no`.** Literal e inmutable. `VALIDATED` significa que el plan está listo para revisión del operador; **no** es una orden de ejecutar, no delega a ningún agente ejecutor, no publica marcador de «listo para implementar» y no escala a fase de implementación. La **orden humana de ejecución ya existente** («ya termina el trabajo», con autorización de DBdev acotada a la extensión de apariencia) es un hecho **anterior y separado** de este gate, declarado por el operador y recogido en `§9`; este veredicto no la crea, no la amplía, no la sustituye y **no se le pide reconfirmación**. `PLAN_PATH` es el único puntero que debe circular hacia `Code Transmuter`.
- **Ejes críticos cubiertos.** `VALIDATED` exige cero `unresolved`, cero `blocking` abierto y los ejes críticos cubiertos. Aquí: cero `unresolved`, cero directivas `blocking` (las nueve eran `material`), y los cuatro ejes del roster con reporte y sin diferir.
- **Cuarta escritura no consumida.** El presupuesto era de cuatro y se usan **3 de 4**. `VALIDATED` en `r2` **no** habilita `BARD_CORRECTION_2`: con cero `unresolved` no hay nada que corregir. La cuarta escritura queda **disponible y sin usar**; reabrir la revisión exigiría un `plan_payload` materialmente distinto, un **workstream nuevo** y un `gate_id` nuevo, no un tercer ciclo dentro de este `gate_id`.
- **Interpretación de ejecución de `D-correctness-4` (obligación, no delta de cuerpo).** `LOGIN` visible se interpreta como **entrada de UI clicable en el menú, alcanzable desde un estado sin identidad acreditada, anónimo o expirada**, y no como la mera existencia técnica de la URL `/login`. Es una **obligación de ejecución** del scope público ya fijado en el plan; **no** es un autologout, **no** añade `SCREEN`, **no** reescribe el guard de F2 y **no** introduce un `POST logout` previo para llegar a `LOGIN` (`§5:115`, `§7:158`).
- **Planes hermanos y spec intactos.** [`./implementation-plan.md`](./implementation-plan.md) (`p3`/`VALIDATED`/`r2`) y [`./implementation-plan-access.md`](./implementation-plan-access.md) (`p2`/`VALIDATED`/`r2`) no se modificaron ni se releyeron para escribir; sus ledgers siguen siendo suyos. [`./spec-meta.yaml`](./spec-meta.yaml) conserva `status: approved` y `verified_at: null`; este gate no replica ni mueve su estado, no abre spec, ADR ni bug, y no toca `docs/decisions/`, `opencode.json`, plugins, dependencias ni permisos.
- **Sin redispatch.** Ningún reviewer fue re-invocado, no hubo segunda ronda, no hubo contra-auditoría y no se generó reviewer adicional. El arbitraje se hizo **sobre** los cuatro reportes persistidos, nunca en su lugar.
- **Cero secretos.** No hay credenciales, cabeceras de autenticación, cookies ni datos personales en este bloque; las referencias se conservan como `archivo:línea` y los endpoints se citan por su ruta lógica documentada. Dominios y rutas públicas no se redactan.
- **Write set cerrado.** **Sólo** este `PLAN_PATH`. Sin código, sin backend, sin base de datos, sin shell de escritura, sin navegador, sin MCP, sin web, sin tests, sin servicios, sin modelos, sin permisos, sin dependencias y sin subagentes. La única lectura fuera del archivo fue **read-only** de `apps/identity/views.py:136-150` y `apps/organizations/views.py:25-42` para **no estampar en el ledger una cita no verificada**; no se modificó código.
