---
status: in-progress
risk: [permissions, auth]
updated: 2026-10-12
---

# Visibilidad y navegación por permisos compartidos (frontend)

> 🕯️ **Persistencia mecánica (`Lore Master`, 2026-10-12, TIER FAST).** Cuerpo transcrito del
> `plan_payload` final de `Cunning-Bard` (ítem 1, workstream `frontend-completion-plans`).
> Única normalización aplicada: localizadores de documentación convertidos a rutas relativas
> a este archivo (§1, §2, §5.4, §5.5) y las fases F1…F6 de §5.5 tabuladas con AC, ejecutor y
> dependencia. Sin cambio de alcance, sin tareas, objetivos, decisiones ni gates añadidos.
> **No autoriza implementar.** Los localizadores `front/src/…` son anclas de código con
> prefijo de raíz del repositorio. Los localizadores `~/.config/opencode/agents/…` son
> configuración global del operador, fuera del alcance de escritura de esta persistencia.
> Specs hermanas: [`frontend-account-self-service.md`](./frontend-account-self-service.md),
> plan UX: [`../plans/frontend-ux-corrections.md`](../plans/frontend-ux-corrections.md),
> aceptación: [`frontend-integral-acceptance.md`](./frontend-integral-acceptance.md).

## Índice

1. [Problema y por qué](#1-problema-y-por-qué) · 2. [Fuera de alcance](#2-fuera-de-alcance) ·
3. [Criterios de aceptación](#3-criterios-de-aceptación-ears) · 4. [Diseño](#4-diseño) ·
5. [Tareas — plan operativo](#5-tareas--plan-operativo-8-secciones) ·
6. [Verificación](#6-verificación) · 7. [Notas/decisiones](#7-notasdecisiones)

---

## 1. Problema y por qué

El cliente no aplica criterios de visibilidad por permiso: `front/src/router/routes.ts:58-268`
sólo declara `meta.requiresTenant`; `front/src/components/DashboardSidebar.vue:38-235,308-326`
renderiza `NAVIGATION_GROUPS` estático a todo principal; el gating de acciones vive en
constantes `PERMISSION` duplicadas por vista (`IdentityView.vue:153-162`,
`ShootingView.vue:72-80`, `ExercisesView.vue:101-106`, `OrganizationView.vue:118-125`).
[`final-frontend/experience/navigation.md:76-128`](./final-frontend/experience/navigation.md)
es evidencia de diseño (tabla menú→permiso contra
[`../../apps/authorization/permissions.py:36-95`](../../apps/authorization/permissions.py)),
pero su «intento permitido» para rutas role-gated (`:124`) **no autoriza** abrir superficies
sin criterio en este workstream: un intento no anticipable no se usa para afirmar cumplimiento
nuevo; perpetuaría la navegación no filtrada que el operador pidió resolver. Sin criterio
compartido fail-closed, los ítems de cuenta, UX y aceptación construyen sobre visibilidad
divergente. **Riesgo técnico:** hard triggers #3 (roles/permisos/autorización) y #2
(autenticación/sesiones, por tocar navegación con estado de sesión). **Flags:**
`permissions`, `auth`. **Revisor:** `Dhampir Slayer` (por flag; distinto del ejecutor).
**Tipo de trabajo:** feature frontend multi-fase (visibilidad/navegación).

## 2. Fuera de alcance

Backend (incluida deuda §1 de overrides: sólo se referencia,
[`../bugs/backend-debt.md`](../bugs/backend-debt.md)); `.env`/schema/migraciones/settings/
permisos DB/roles/endpoints/server/config; resolución local de overrides o política espejo de
autorización; inventar endpoints o criterios sin fundamento de contrato; whitelists de
privilegio por string de rol más allá del único contrato role-based documentado (OP-AUT-004);
requests de probing para comprobar permisos; rutas nuevas (la ruta de cuenta es spec hermana);
microcopy/idioma/DS (spec hermana); matriz de aceptación (spec hermana); dependencias nuevas
(incluidas librerías de testing: ver §5.5 F6, cuyo prerrequisito de skills del ejecutor quedó
satisfecho el 2026-10-12); reescritura del cliente;
edición de documentación (corresponde a `Lore Master`).

## 3. Criterios de aceptación (EARS)

- **AC-1** — WHEN el snapshot vigente carece del permiso que exige un criterio fundado, o la
  ruta no tiene criterio fundado, THEN el sistema no renderiza su entrada de menú y no emite
  request alguna para comprobar permisos.
- **AC-2** — WHEN un deep-link denegado se recibe, THEN el sistema presenta un contenedor de
  estado neutral con el motivo de denegación/limitación existente, **sin montar la vista
  protegida ni invocar sus loaders/mutaciones**, conservando la URL, sin redirect a login y
  sin bucles («ruta denegada alcanzada» = sólo contenedor neutral, nunca vista protegida
  ejecutada).
- **AC-3** — WHEN el snapshot es unknown/stale (booting, generación avanzada, contexto fallido),
  THEN toda visibilidad privilegiada se resuelve cerrada hasta existir snapshot válido de la
  generación vigente.
- **AC-4** — WHEN un contrato vigente documenta criterio por rol específico (OP-AUT-004:
  `tenant_admin`/`super_admin`/`auditor`), THEN el predicado se evalúa sobre los `assignments`
  del contexto validado y sólo para ese contrato; los roles custom no se deniegan por
  desconocidos donde el criterio es de permisos atómicos y el snapshot los acredita.
- **AC-5** — WHEN un 403 posterior llega sobre una superficie permitida, THEN el backend
  conserva la autoridad: se pinta su `detail` literal (ST-07) y un 403 de negocio no cierra
  la sesión.
- **AC-6** — WHEN overrides alteran la autorización real del servidor, THEN la visibilidad
  cliente puede divergir; el criterio «visibilidad exacta con overrides» queda
  **BLOCKED_BACKEND** por [`../bugs/backend-debt.md`](../bugs/backend-debt.md) §1, sin
  resolución local ni política espejo.
- **AC-7** — WHEN se adopta el catálogo compartido, THEN las vistas conservan su gating actual
  (mismos códigos, mismo comportamiento) consumiendo una única fuente.
- **AC-8** — WHEN la implementación cierra, THEN existen tests focales que cubren permitido/
  denegado/unknown/stale/role-based-contract/sin-bucles/return-preservado (ejecución sujeta a
  la autorización del operador).

## 4. Diseño

Fuente única de criterios fundados: catálogo compartido de permission-codes + criterio por
ruta en 4 clases: (a) permiso atómico presente en `permissions` del snapshot validado; (b)
principal autenticado con tenant activo para lecturas abiertas por contrato (IA+TA:
OP-ROL-001, OP-SCP-001/002, OP-PRM-001); (c) criterio role-based **sólo** donde el contrato
vigente documenta el predicado (OP-AUT-004), sobre `assignments` validados, nunca como
whitelist global de privilegios; (d) sesión/principal (dashboard, contexto, personalizador,
auth, 404). Ruta sin criterio fundado (p. ej. superficies `IsTenantAdmin` cuyo predicado no
es documentable en cliente, como overrides/matrices): fail-closed y limitación registrada, no
simulada. Resolución del deep-link denegado siguiendo el precedente de presentación existente
(`App.vue:484` sustituye el contenido tenant por `PersonalizerView` cuando
`appearanceBarrierActive`, `App.vue:77-79`): la superficie de composición presenta un
contenedor de estado neutral (patrón ST-07, motivo de denegación/limitación existente) en
lugar del `RouterView` protegido; el guard no redirige ni habilita el montaje. El writer puede
elegir un mecanismo equivalente mientras salvaguarden los invariantes: sin montaje protegido,
sin loaders/mutaciones, URL/deeplink conservado, sin bucles, sin probing. Visibilidad cerrada
= no-render (no disabled). Trade-offs: (a) ocultar vs deshabilitar → ocultar
([`final-frontend/experience/navigation.md:108`](./final-frontend/experience/navigation.md)
como evidencia); (b) intento-permitido de la spec vieja vs fail-closed → fail-closed (el
intento sin criterio es probing disfrazado); (c) contenedor neutral en composición vs ruta 403
propia → composición (no expande la base de rutas). Sin código aquí.

## 5. Tareas — plan operativo (8 secciones)

**5.1 Objetivo** — Que menú, rutas/guards y acciones consuman los mismos criterios de
visibilidad fundados sobre el snapshot existente (`front/src/types/contexto.ts:56-64`),
fail-closed, con denegación explícita y el backend como única autoridad.

**5.2 Scope** — Catálogo compartido y criterio por ruta; meta de visibilidad tipada;
resolución fail-closed en guard/superficie de composición; filtrado del sidebar; migración
mecánica de constantes `PERMISSION` duplicadas; tests focales (sujetos a autorización de
ejecución).

**5.3 Fuera de scope** — §2 de esta spec (fuente única; no se duplica).

**5.4 Archivos probables** — `front/src/router/routes.ts` (meta); `front/src/router/guards.ts`
(resolución, aditiva); nuevos `front/src/router/visibility.ts` y
`front/src/permissions/catalog.ts` (nombres los decide el writer; un solo SSOT);
`front/src/App.vue` (presentación del contenedor neutral, precedente barrera);
`front/src/components/DashboardSidebar.vue` (filtrado);
`front/src/views/identity/IdentityView.vue`, `front/src/views/shooting/ShootingView.vue`,
`front/src/views/exercises/ExercisesView.vue`, `front/src/views/organization/OrganizationView.vue`
(constantes → catálogo); `front/src/views/armory/ArmoryView.vue` y
`front/src/views/authorization/AuthorizationView.vue` (sólo si el mapa localizado de F1
encuentra gating que unificar); `front/src/types/` (RouteMeta); `front/tests/focused/`
(nuevos, patrón `guards-return.test.ts`).

**5.5 Pasos / fases** —

| Fase | Contenido | Depende | Ejecutor | AC que ampara |
|---|---|---|---|---|
| F1 | Contratos y mapa localizado: lectura de contratos vigentes ([`final-frontend/experience/navigation.md:80-104`](./final-frontend/experience/navigation.md) como evidencia, columna de control de [`final-frontend/backend-inventory.md`](./final-frontend/backend-inventory.md), gating de las vistas de negocio) → catálogo compartido y mapa ruta→criterio en las 4 clases. Celda sin fundamento de contrato → fail-closed + limitación registrada; no se inventa. Es lectura de contratos y mapa localizado de implementación, **no** auditoría de calidad. | — | `Code Transmuter` | AC-1, AC-4 |
| F2 | Criterio + meta: helper tipado compartido; meta de visibilidad por ruta; paths, nombres y `requiresTenant` vigentes intactos. | F1 | `Code Transmuter` | AC-1, AC-7 |
| F3 | Guard/composición fail-closed: etapa aditiva tras la consolidación existente; snapshot válido + criterio fundado → permite; denegado/unknown/stale/sin-criterio → contenedor neutral sin montar la vista protegida ni sus loaders. Se conservan intactos: `pendingRedirect`/return seguro (`guards.ts:31-61,85-104`), anti-carrera por generación (`:205-231`), singleflight de `ensureContext`, 403 negocio ≠ logout (`session.ts:349-352`), G-SES-1. | F2 | `Code Transmuter` | AC-2, AC-3, AC-5 |
| F4 | Menú: filtrado del sidebar con el mismo helper; grupo sin ítems visibles no se renderiza; `booting`/snapshot inválido → menú privilegiado cerrado; sin entradas huecas ni capacidades sin endpoint (D-02). | F2 | `Code Transmuter` | AC-1, AC-3 |
| F5 | Vistas: constantes locales → catálogo compartido, comportamiento 1:1; títulos/desactivaciones se conservan (su lenguaje accesible es de la spec UX hermana). | F2 | `Code Transmuter` | AC-7 |
| F6 | Tests/checks: vitest focal con la matriz de AC-1…AC-5 + `pnpm typecheck`. **Prerrequisito de skills de testing: satisfecho** por orden del operador (2026-10-12), que añadió `vitest` y `vue-testing-best-practices` a la allowlist de `Code Transmuter` conservando `deny '*'` (`~/.config/opencode/agents/Code-Transmuter.md:47-82`); F6 deja de estar **BLOCKED (prerrequisito)** y ninguna otra fase dependía de él. Lo que la configuración no resuelve es la ejecución: la suite focal y `pnpm typecheck` siguen exigiendo la autorización de ejecución del operador, y mientras no corran con salida real no hay evidencia de AC-8. El ejecutor no cambia configuración ni se sustituye por otro writer. | F3, F4 | `Code Transmuter` | AC-8 |

**5.6 Riesgos** — Deuda §1: divergencia con overrides → AC-6 BLOCKED_BACKEND (mitiga ST-07
literal del servidor). Regresión de guard: maquinaria sensible → cambio aditivo +
`guards-return` preservado. Flashing de menú en booting → estado único cerrado. Criterio
role-based limitado a OP-AUT-004: si se extendiera como whitelist violaría AC-4. Write set
compartido con specs hermanas → writer secuencial (orden 1→2→3). Prerrequisito de skills de
testing → resuelto por orden del operador (2026-10-12); queda la autorización de ejecución de
la suite, declarada honestamente (configuración no equivale a evidencia).

**5.7 Verificaciones** — Por fase: F1/F5 → diff/lectura de contratos. F2-F4 → diff +
`pnpm typecheck`. F6 → suite focal nueva + existente con salida real, sólo con autorización de
ejecución (una autorización, no confirmación por paso). Gates por evidencia: `tests`;
`security_review` (`Dhampir Slayer`, post-implementación); `code_review` (`Hellknight
Inspector` base + `Codex-Of-Botched-Runes` complementario para salida de IA, y
`inume-css-html-anti-patterns` si se revisa markup; nunca Codex aislado); `documentation`
(`Lore Master`). Entrega ≠ verificación: writer cierra `DELIVERED|BLOCKED|FAILED`; el veredicto
es del orquestador. Ningún revisor se invoca en este plan.

**5.8 Handoff para Code Transmuter** — Implementar F1→F5 en orden; F6 sujeto a autorización de
ejecución (el prerrequisito de skills quedó satisfecho por la orden del operador del 2026-10-12).
Skills allowed (allowlist vigente): `vue`, `vue-best-practices`,
`vue-router-best-practices`, `typescript`, `pinia`, `inume-css-html-anti-patterns` (siempre en
templates/CSS), `vitest`, `vue-testing-best-practices` (suite focal de F6), `pnpm` (ejecución de
comandos). Límites duros: backend
intocable; cero dependencias nuevas; no alterar paths/nombres/`requiresTenant`; cero probing;
fail-closed sin snapshot válido o sin criterio fundado; deep-link denegado = contenedor
neutral sin montar vista protegida ni loaders/mutaciones; 403 negocio ≠ logout; `detail`
literal; no resolver overrides; preservar `pendingRedirect`/return/deeplinks/anti-carrera.
Cerrar `DELIVERED|BLOCKED|FAILED` con rutas tocadas y salida real de los checks autorizados.

## 6. Verificación

Gates y evidencia en §5.7 (fuente única). Cierre mínimo: `pnpm typecheck` + suite focal
existente y nueva con salida real si está autorizada; diff completo legible por el
orquestador. Sin ejecución autorizada: `NOT_VERIFIED` con la confirmación mínima que falta.

> 🕯️ **Evidencia de implementación (2026-10-12).** Fases iniciales entregadas por
> `Code Transmuter` en la sesión `ses_code-transmuter-1791804695` y **leídas** por el
> orquestador: `front/src/router/visibility.ts:151-205` (clases de criterio),
> `front/src/App.vue:537-552`, `front/src/components/DashboardSidebar.vue:275-286,348`.
> Comandos ejecutados por el orquestador con salida real: `pnpm typecheck` y
> `pnpm test:focused` — exit 0, 9 archivos, 187 tests.
>
> **Lo que esto NO cierra.** El `security_review` previsto en §5.7 de la spec de
> aceptación **no tiene dictamen**: la revisión fue revocada explícitamente por el operador
> antes de ejecutarse. No se marca `security_review passed` por silencio ni por el verde de
> los tests. No hay verificación runtime completa por actor ni evidencia de las fases
> posteriores de esta spec. Estado: `in-progress`, sin cierre de gates.
>
> **Evidencia runtime limitada (2026-10-12).** Navegación y menú quedaron observados para el
> actor A8: sonda permitida `GET /api/organization-units/` → **200** con superficie montada sin
> texto de denegación, y sonda denegada a `/organizacion/recintos` → contenedor de denegación
> **con cero solicitudes de negocio** (fail-closed observado en esa ruta). Un menú o un
> contenedor denegado **no es una operación CRUD observada** y no cuenta como tal. Los
> resultados multi-actor de menú granted/denied son **reportados** por el worker, sin traza
> exacta, y no acreditan visibilidad exhaustiva por rol. Detalle y límites:
> [`final-frontend/evidence/2026-10-12/runtime-observations.md`](./final-frontend/evidence/2026-10-12/runtime-observations.md).
> **Nada de esto es un 100 % funcional ni una certificación visual**: el resultado global sigue
> `NOT_VERIFIED` / `NO_CUMPLIDO`.

## 7. Notas/decisiones

- [`final-frontend/experience/navigation.md:76-128`](./final-frontend/experience/navigation.md)
  se referencia como evidencia de diseño; donde dice «intento permitido» (`:124`), esta spec
  resuelve fail-closed: la spec vieja no es permiso para abrir superficies sin criterio
  fundado ni para afirmar cumplimiento nuevo.
- Decisiones técnicas propuestas (la aprobación del plan las ratifica; no son bloqueadores
  artificiales): contenedor neutral en superficie de composición; 4 clases de criterio;
  fail-closed por default; menú cerrado en booting.
- La aprobación de alcance antigua (spec `final-frontend-001`, 2026-10-02) no aprobó esta spec;
  aprobada y con ejecución ordenada por el operador el 2026-10-12 (primera fase despachada);
  en general aprobar no equivale a ejecutar, y esta vez hubo orden explícita de ejecución.
- 🕯️ **Continuidad (2026-10-12).** El despacho inicial agotó su tiempo de ejecución; la sesión
  se identificó todavía activa, se interrumpió y se pidió handoff de sólo lectura en la
  **misma** sesión. Los cambios quedaron conservados y comprobados por el orquestador
  (lectura de los archivos + `pnpm typecheck`/`pnpm test:focused` exit 0). A partir de ahí el
  mismo escritor continúa con los planes 2→3 secuencialmente; **no existe handoff** de esas
  fases en el momento de esta nota, y esta spec no anticipa su resultado.