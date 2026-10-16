---
spec_meta: "./spec-meta.yaml"
---

# final-frontend — Mapa documental de la spec

> 📖 Índice canónico de la spec `spec-final-frontend-001` (estado **`approved`** desde
> el 2026-10-02, `spec-meta.yaml`:7). Este tomo dice **dónde vive cada materia, qué
> está entregado y qué está pendiente**; no duplica contenidos y no autoriza por sí
> mismo: la aprobación no supera gates (`verified_at: null`, ningún gate en `passed`),
> y la ejecución vigente se rige por
> [`completion-plan-2026-10-14.md`](./completion-plan-2026-10-14.md) (aprobado el
> 2026-10-14, `in-progress`; estado global `NOT_VERIFIED`).

## Índice

1. [Qué define esta spec](#qué-define-esta-spec)
2. [Baseline actual vs producto objetivo](#baseline-actual-vs-producto-objetivo)
3. [Orden de lectura](#orden-de-lectura)
4. [Fuentes canónicas por materia](#fuentes-canónicas-por-materia)
5. [Entregas en curso y pendientes](#entregas-en-curso-y-pendientes)
6. [Límites de lo afirmado](#límites-de-lo-afirmado)

---

## Qué define esta spec

El **frontend integral del producto final**: el cliente web completo construido sobre
**todas** las funcionalidades reales que el backend expone hoy, sin omitir ninguna
(autorizado por el operador el 2026-10-01; [`front/AGENTS.md`](../../../front/AGENTS.md)).
El universo consumible son las **162 operaciones `OP-*`** declaradas en
[`backend-inventory.md`](./backend-inventory.md) (161 de negocio + 1 de
infraestructura), materializadas en **36 pantallas `SCREEN-*`** con su cobertura
trazada en [`experience/screens.md`](./experience/screens.md).

## Baseline actual vs producto objetivo

| Materia | Estado actual (declarado en fuente; runtime no verificado) | Objetivo de esta spec |
|---|---|---|
| Cliente | Implementa en código superficies reales de todos los dominios del producto (vistas por dominio en `front/src/views/`; verificado 2026-10-15); aceptación integral `NOT_VERIFIED` ([`completion-plan-2026-10-14.md`](./completion-plan-2026-10-14.md)) | Producto final integral: las 36 pantallas del catálogo sobre los 7 dominios del menú |
| Lenguaje | **TypeScript** en `front/src/` (38 componentes `.vue` con `lang="ts"`, 34 módulos `.ts`, 0 `.js`; verificado 2026-10-15) | **TypeScript obligatorio** en el código objetivo: `<script setup lang="ts">` y módulos `.ts` propuestos (D-08, orden del operador del 2026-10-02); el kit externo del DS sigue siendo HTML/CSS/JS como referencia |
| Navegación | `vue-router 5.3.1` instalado y en uso: router real en `front/src/router/` (`routes.ts` con ~35 rutas, `guards.ts`, `visibility.ts`; verificado 2026-10-15) | `vue-router@5.3.1` con `createWebHistory` (diseño declarado e instalado; `R-ROUTER-01`, D-05, T-05; verificado 2026-10-15) |
| Apariencia | Contrato de 8 ejes existente y consumido (verificado 2026-10-15): ocho campos `ds_*` (`apipoligono/models.py:152-159`), migración `0021_design_system_preferences` y rutas propias (`apipoligono/urls.py:85-86`); persistencia por usuario acreditada en runtime, paridad de render `NOT_VERIFIED` | Personalizador de **8 ejes** del DS persistido por usuario: única extensión de backend autorizada, ya **ejecutada** (verificado 2026-10-15) ([`technical-design.md`](./technical-design.md) §5) |
| Backend | La única excepción acotada de preferencias de apariencia **ya se ejecutó** (verificado 2026-10-15): ocho campos `ds_*`, migración `0021_design_system_preferences` y rutas propias existen; nada más se tocó ([`front/AGENTS.md`](../../../front/AGENTS.md) §Límites) | Ocho campos `ds_*`, una migración y una ruta propia de preferencias; nada más |
| Datos | Sólo backend real; prohibidos fixtures, mocks y registros sintéticos (`R-DAT-01`) | Idéntico en las 36 pantallas; hueco de backend se reporta, no se simula (D-02 abierta) |

## Orden de lectura

| # | Tomo | Qué aporta |
|---:|---|---|
| 1 | [`requirements.md`](./requirements.md) | Alcance, user stories, requisitos EARS transversales (`R-AUTH-*`, `R-REC-*`, `R-UNIT-*`, `R-PREF-*`, `R-RES-*`, `R-RUL-*`, `R-DAT-*`, `R-DS-*`, `R-APP-*`, `R-ROUTER-*`, `R-LOGIN-*`), out of scope, capacidades sin endpoint, huellas de backend, discrepancias y decisiones **D-01..D-08** |
| 2 | [`technical-design.md`](./technical-design.md) | Arquitectura del cliente (Vue 3 + TypeScript + Pinia + `fetch` + Vue Router), cliente HTTP, guards, estado, métricas, seguridad, riesgos y el diseño de la única extensión de backend autorizada (§5) |
| 3 | [`backend-inventory.md`](./backend-inventory.md) | Manifest operación por operación: las 162 `OP-*` con método, patrón, handler, control y contrato |
| 4 | [`backend-contracts.md`](./backend-contracts.md) → [`contracts/`](./contracts/auth-context.md) | Índice de contratos y detalle campo a campo por dominio: auth/contexto/recuperación, tiro, organización/identidad, RBAC, ejercicios/apariencia legacy |
| 5 | [`requirements/`](./requirements/organization.md) | Requisitos de interfaz por dominio (`R-DOM-ORG-*`, `R-DOM-ID-*`, `R-DOM-AZ-*`, `R-DOM-ARM-*`, `R-DOM-SHT-*`, `R-DOM-EXC-*`); el puntero familia por familia está en `requirements.md` §3.4.1 |
| 6 | [`design-system/`](./design-system/visual-contract.md) | Contrato visual y composición del DS, catálogo exacto del personalizador (8 ejes) y mapa de páginas/capas CSS de referencia |
| 7 | [`experience/screens.md`](./experience/screens.md) + [`experience/screens/`](./experience/screens/access-context.md) | Catálogo de las 36 pantallas `SCREEN-*`, cobertura OP → SCREEN, integraciones sin pantalla propia y huecos declarados |
| 8 | [`experience/navigation.md`](./experience/navigation.md) | Tabla consolidada de rutas (fijadas + propuestas), `name`, `meta`, menú por módulos, guards, breadcrumbs, deep links y flujos de sesión. **Las propuestas de rutas nuevas sólo viven aquí** |
| 9 | [`tasks.md`](./tasks.md) y [`verification.md`](./verification.md) | Fases de implementación y criterios observables de cierre; la ejecución vigente se rige por el plan de cierre (tomo 10) |
| 10 | [`completion-plan-2026-10-14.md`](./completion-plan-2026-10-14.md) | Plan maestro hermano de cierre del producto integral: tres carriles, bloques `C0..C12`, conteo de ejecutores y auditores, dependencias de backend y gates. **Aprobado el 2026-10-14** con orden de implementación del operador; `in-progress`. Corte vigente (2026-10-16): 1107 `OBSERVED_OK` / 7 `PARTIAL` / 206 `NOT_EXERCISED` sobre 1320 celdas; estado global `NOT_VERIFIED`; conclusión de producto `NO_CUMPLIDO`; `T12` (cierre) pendiente |

## Fuentes canónicas por materia

Regla de la spec (D-07): cada materia tiene **un único tomo canónico**; los documentos
raíz conservan invariantes y decisiones transversales y delegan el detalle.

| Materia | Tomo canónico |
|---|---|
| Alcance, invariantes, decisiones, cobertura integral | [`requirements.md`](./requirements.md) |
| Arquitectura cliente, HTTP, estado, guards (decisión), backend de preferencias | [`technical-design.md`](./technical-design.md) |
| Inventario de operaciones (`OP-*`) | [`backend-inventory.md`](./backend-inventory.md) |
| Contratos campo a campo | [`contracts/`](./backend-contracts.md) (índice: `backend-contracts.md`) |
| Requisitos de interfaz por dominio (`R-DOM-*`) | [`requirements/`](./requirements/organization.md) |
| Contrato visual, composición y estados del DS | [`design-system/visual-contract.md`](./design-system/visual-contract.md) |
| Catálogo exacto del personalizador y semántica de atributos | [`design-system/customizer-catalog.md`](./design-system/customizer-catalog.md) |
| Páginas y capas CSS del DS por familia | [`design-system/reference-pages.md`](./design-system/reference-pages.md) |
| Pantallas (`SCREEN-*`) y cobertura OP → SCREEN | [`experience/screens.md`](./experience/screens.md) |
| Rutas consolidadas, menú, guards, breadcrumbs | [`experience/navigation.md`](./experience/navigation.md) |
| Tareas por fase | [`tasks.md`](./tasks.md) |
| Criterios observables y cierre | [`verification.md`](./verification.md) |
| Metadata y estado de la spec | [`spec-meta.yaml`](./spec-meta.yaml) |

## Entregas en curso y pendientes

Estado de integración al cierre de este mapa; **no se proclama cobertura final**:

| Entrega | Estado |
|---|---|
| `requirements/shared-session-data.md` (sesión y datos compartidos) | **En entrega por writer activo.** Materializado en disco; su contenido no fue leído ni verificado en esta integración. Referencia vigente mientras no se acepte: [`requirements.md`](./requirements.md) §3.1–§3.3 |
| `requirements/appearance.md` (apariencia) | **En entrega por writer activo.** Materializado en disco; su contenido no fue leído ni verificado en esta integración. Referencia vigente mientras no se acepte: [`requirements.md`](./requirements.md) §6 |
| `experience/flows.md`, `experience/flows/`, `experience/states.md` (flujos y estados transversales) | **En entrega por writer activo.** No leídos en esta integración; no se afirma su contenido ni su completitud |
| [`tasks.md`](./tasks.md) y [`verification.md`](./verification.md) | Existen y están completos respecto del alcance transversal, pero **pendientes de integración** con los catálogos nuevos: sus matrices aún no cruzan `SCREEN-*` ni `R-DOM-*` |
| Aprobación de la spec (`draft → approved`) | **Completada el 2026-10-02** (`spec-meta.yaml`:7). No supera gates por sí sola: `verified_at: null` y ningún gate en `passed`; la ejecución vigente está ordenada por el plan maestro aprobado el 2026-10-14 |

## Límites de lo afirmado

- Los tomos de diseño de esta spec no afirman runtime observado por sí mismos: la
  observación runtime consta en el plan de cierre (tomo 10) y sus fuentes de
  evidencia (corte 2026-10-16: 1107 `OBSERVED_OK` / 7 `PARTIAL` / 206 `NOT_EXERCISED`, sin
  cierre integral: `NOT_VERIFIED`), y no se escribió en base de datos
  ([`completion-plan-2026-10-14.md`](./completion-plan-2026-10-14.md) §Tareas;
  [`verification.md`](./verification.md) §1, §3).
- Las rutas son **propuestas de diseño** y su runtime no está acreditado; `vue-router`
  está instalado y en uso en el cliente (`front/src/router/`; verificado 2026-10-15;
  T-05). La comparación visual contra el DS está **pendiente de autorización**
  (`R-DS-04`, V-70).
- La ruta de preferencias de 8 ejes es la **única** extensión de backend autorizada, y ya
  existe y está consumida por el cliente (ocho campos `ds_*` en `apipoligono/models.py:152-159`,
  migración `0021_design_system_preferences` y rutas en `apipoligono/urls.py:85-86`;
  verificado 2026-10-15); la API existente es la documentada en [`backend-inventory.md`](./backend-inventory.md)
  y [`contracts/`](./backend-contracts.md) ([`technical-design.md`](./technical-design.md) §5).
- Los huecos de backend sin endpoint (D-02) se reportan, no se rellenan:
  [`requirements.md`](./requirements.md) §8.
