# front/ — Cliente (producto final integral)

> Carpeta activa y única del cliente. **Fuente de verdad de la ruta:** este archivo.

Este proyecto sigue las reglas globales definidas en `~/.config/opencode/AGENTS.md` y las reglas locales del backend en [`../AGENTS.md`](../AGENTS.md) —en particular la **Regla dura del Design System**— salvo que se indique lo contrario.

## Qué es

El cliente web del sistema: **el frontend integral del producto final**, construido sobre **todas las funcionalidades reales que el backend expone hoy**. El alcance ya no está cerrado al dashboard de lectura.

- **Destino vigente (autorizado por el operador el 2026-10-01):** producto final completo. Se revisa el backend de forma exhaustiva y **no se omite ninguna funcionalidad real** por considerarla fuera de alcance —incluidas administración, alta/edición de datos y flujos de captura, que antes estaban excluidos.
- **Estado actual (2026-10-15):** el cliente implementa en código las superficies reales de todos los dominios del producto (vistas en `front/src/views/`, features y cliente API por dominio en `front/src/features/`); el «únicamente dashboard de lectura» es hecho histórico, superado. La **aceptación integral sigue `NOT_VERIFIED`**: lo construido no equivale a producto acreditado ([`../docs/specs/final-frontend/completion-plan-2026-10-14.md`](../docs/specs/final-frontend/completion-plan-2026-10-14.md)).
- **Orden de construcción:** lo que el backend real expone, en el estado en que lo expone. No se anticipan endpoints inexistentes ni se pueblan huecos con datos inventados.
- **Identidad visual:** Inume Design System literal, tal como se declara en [`../AGENTS.md`](../AGENTS.md). La fidelidad 1:1 no se relaja por ampliar el alcance.

## Stack aprobado

- **Vue 3** con Composition API y `<script setup lang="ts">` — **TypeScript obligatorio** en el código objetivo, por orden explícita del operador del 2026-10-02. La regla previa «JavaScript, no TypeScript» queda **derogada (superseded)**; el registro canónico de la decisión es D-08 en [`../docs/specs/final-frontend/requirements.md`](../docs/specs/final-frontend/requirements.md) §12. Los futuros módulos de router, HTTP, stores y composables se escriben en `.ts` cuando sean realmente propuestos. **Hecho verificado (2026-10-15):** `front/src/` está en **TypeScript** —38 componentes `.vue` con `lang="ts"`, 34 módulos `.ts`, 0 archivos `.js`—; el «baseline JavaScript» es hecho histórico, superado. El kit externo del Design System sigue siendo HTML/CSS/JS como fuente de referencia y no se sustituye por tipos ni se importa.
- **Vue Router** — **obligatorio**, por orden explícita del operador. El cliente navega con el router: no se resuelve la navegación con estado manual en Pinia, `window.location` ni enrutado improvisado por componentes.
- **Pinia** para el estado, **en memoria**: sin persistencia (nada de `localStorage`, `sessionStorage`, cookies de estado ni rehidratación).
- **CSS vanilla**. Sin frameworks de estilos, sin preprocesadores, sin librerías de componentes UI.

> 📖 **Estado del stack, no del alcance.** El router figura aquí como requisito del operador y su instalación está verificada (2026-10-15): `front/package.json` declara `vue 3.5.43`, `vue-router 5.3.1`, `pinia 4.0.3` y, en dev, `typescript 5.9.3`, `vue-tsc`, `vitest 5.0.3` y `vite 8.3.1`, con scripts `dev`, `build`, `typecheck` y `test:focused`; el router es real en `front/src/router/` (`routes.ts`, `guards.ts`, `visibility.ts`). El stack aprobado vigente es **Vue 3 + TypeScript** (D-08), **Pinia** en memoria, **CSS vanilla** y sin librerías de componentes; el resto queda **sin cambios**. La adopción de TypeScript **no autoriza por sí sola** instalar dependencias, tooling ni comandos: sigue rigiendo [Límites](#límites).

## Datos

- Los datos provienen **exclusivamente del backend real**, por API. Prohibido en el cliente: fixtures, mocks, datos de demo, cifras inventadas y cualquier fallback o dato simulado cuando la API no responde.
- **Prohibido fabricar datos para simular funcionalidad.** No se crean registros sintéticos, ni en la base de datos ni en el cliente, para que una pantalla "parezca" funcionar. Si una funcionalidad no tiene datos, el backend no la expone o la API falla, eso **se reporta al operador**: no se oculta ni se rellena.
- No está autorizado modificar una base de datos de producción, ni aplicar migraciones nuevas por iniciativa propia. La migración de preferencias a la que se refiere la excepción de [Límites](#límites) no es una excepción a esta regla: requiere spec aprobada, no iniciativa propia.
- Nada de cuentas, tenants, unidades ni permisos de ejemplo: **el backend es la autoridad** sobre tenant, contexto y autorización.
- El cliente **no persiste datos** de negocio ni resultados de permisos.
- Cuando un dato no exista, la interfaz muestra el placeholder `—` (falta real), nunca un `0` falso ni un valor inventado.
- Endpoints de referencia: `GET /api/auth/context/` y los endpoints de lectura de lecciones y summary por lección. Ante cualquier duda de permisos o alcance, consultar [`../docs/06_API_REFERENCE.md`](../docs/06_API_REFERENCE.md) y [`../docs/12_GUIA_FRONTEND.md`](../docs/12_GUIA_FRONTEND.md).

## Personalizador de apariencia — requisito por usuario

Orden explícita del operador: el cliente debe **ofrecer una opción de personalización y persistirla por usuario**. Ese contrato está implementado en código (verificado 2026-10-15) y su persistencia por usuario está acreditada en runtime por las evidencias del plan de cierre; la **paridad de render en estados completos sigue `NOT_VERIFIED`** (T8/T9).

- **Los 8 ejes reales del DS, completos.** El personalizador expone **todas** las opciones que el Inume Design System declara, no un subconjunto: el eje `theme` (dark/light) más los **siete ejes del theme customizer** — `accent`, `bg`, `font`, `radius`, `iconfam`, `ambient`, `ambcolor`. Sus catálogos de valores son los del DS y se transliteran **1:1**, sin recorte, sin muestreo y sin nomenclatura propia.
- **Fuente de verdad: el DS externo.** Los catálogos se leen de la biblioteca, no se inventan ni se reescriben. Reproducir un valor que el DS no expone, o con otro nombre, es el mismo defecto que romper la fidelidad 1:1 del resto de la UI.
- **Reset.** El personalizador ofrece restablecer la apariencia a los defaults del DS. Es parte del requisito, no un extra.
- **Persistencia por usuario en el backend, no en el navegador.** El valor elegido se guarda **por usuario** contra la API del backend real. **Prohibido** persistir la personalización en `localStorage`, `sessionStorage` o cookies de estado del navegador, aunque el prototipo del DS lo haga: ese `localStorage` es comportamiento del mockup externo, no una autorización para el cliente. La página debe mostrar el valor persistido, no el estado de un navegador.
- **Sin propuesta de hash ni clave manual.** No se inventa un esquema de codificación de preferencias en la URL, un hash de apariencia propio, ni una clave de `localStorage` derivada a mano.
- **Hueco cerrado (2026-10-15).** El modelo de preferencias cubre ya los 8 ejes: `apipoligono/models.py:152-159` expone **ocho campos `ds_*`** con `choices` y CheckConstraints, con la migración `apipoligono/migrations/0021_design_system_preferences.py` y las rutas `me/preferences/appearance/` y `me/preferences/appearance/design-system/` (`apipoligono/urls.py:85-86`), consumidas por el cliente (`front/src/views/appearance/PersonalizerView.vue`, `front/src/stores/appearance.ts`, `front/src/api/appearance.ts`). La persistencia por usuario está acreditada en runtime por las evidencias del plan de cierre (`../docs/specs/final-frontend/evidence/2026-10-13/appearance-eight-axes-results.json`, `../docs/specs/final-frontend/evidence/2026-10-14/appearance-persistence-readonly.json`); la paridad de render en estados completos sigue `NOT_VERIFIED` (T8/T9, [`../docs/specs/final-frontend/completion-plan-2026-10-14.md`](../docs/specs/final-frontend/completion-plan-2026-10-14.md)).

## Límites

- **No se modifica el backend** de forma automática. Un cambio requerido en el backend se reporta; no se aplica por iniciativa propia desde el cliente.
- 🕯️ **Única excepción a esa prohibición, y es acotada.** La prohibición se levanta **únicamente** para el diseño y la implementación del requisito de personalización por usuario, y sólo **después** de que exista **spec aprobada y gate superado**. Ese trabajo puede abarcar, y sólo esto:
  1. el modelo o los campos de preferencias que sostengan los **8 ejes** del DS por usuario;
  2. el **endpoint propio del usuario autenticado** de preferencias de apariencia (lectura y escritura);
  3. la **migración** que ese modelo o endpoint necesite, revisada y con tests.

  **La excepción no se extiende** a nada más. No autoriza tocar autenticación, RBAC, permisos atómicos, modelo de permisos, multi-tenant, infraestructura, despliegue, ni ninguna otra funcionalidad del backend; no autoriza levantar un segundo servidor, ni reiniciar o detener el backend ya reportado en marcha en `127.0.0.1:8000` (estado reportado por el operador, **no verificado** en esta sincronización) — ese proceso se **reusa**; no autoriza ampliar el alcance del cliente más allá de lo ya autorizado; y no autoriza por sí sola `pnpm dev`, navegador, base de datos ni tests, que siguen requiriendo orden explícita. Cualquier necesidad que exceda los tres puntos anteriores se **reporta**, no se ejecuta.
- Si el backend no expone una API que el producto final necesita, o expone un defecto, **se reporta**: no se resuelve con mocks, con un atajo en el cliente ni ocultando el hueco.
- La ampliación de alcance al producto final integral **no** otorga autorización de ejecución: no incluye permisos para `pnpm dev`, navegador, herramientas de verificación, base de datos ni tests. Cada una requiere orden explícita del operador.
- No se afirma que el frontend integral esté **acreditado** ni que su runtime funcione más allá de lo observado y registrado; la aceptación integral sigue `NOT_VERIFIED`.
- No se agregan dependencias, tooling ni comandos sin orden del operador.
- Comandos del cliente: `pnpm dev` es el único comando de desarrollo previsto; se ejecuta **sólo con orden explícita del operador** y nunca como parte automática de una entrega.

## Design System — autoridad visual

El **Inume Design System** es la LEY VISUAL, tal como se declara en [`../AGENTS.md`](../AGENTS.md). Fuentes exactas, relativas a **esta** carpeta:

- [`../../../Inume Design System/index.html`](../../../Inume%20Design%20System/index.html) — catálogo índice.
- [`../../../Inume Design System/DESIGN.md`](../../../Inume%20Design%20System/DESIGN.md) — SSOT de tokens, anatomía y estados.
- [`../../../Inume Design System/PRODUCT.md`](../../../Inume%20Design%20System/PRODUCT.md) — contrato de producto del DS.
- [`../../../Inume Design System/ui-*.html`](../../../Inume%20Design%20System/ui-buttons.html), [`forms-*.html`](../../../Inume%20Design%20System/forms-basic.html), [`auth-*.html`](../../../Inume%20Design%20System/auth-signin.html) — componentes por familia.
- [`../../../Inume Design System/assets/css/`](../../../Inume%20Design%20System/assets/css/) — fuente de valores.

Los valores del CSS del DS se reproducen **1:1**: interpretar, simplificar o "inspirarse" está prohibido; toda adaptación debe reportarse y justificarse. La carpeta interna homónima que existe en el repositorio **no** es la fuente.

> ⚠️ Enlaces relativos al layout actual del disco. Un checkout aislado del repositorio no los resuelve.
