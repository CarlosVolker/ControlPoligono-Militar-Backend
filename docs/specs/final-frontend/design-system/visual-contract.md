# Contrato visual del Inume Design System

> 📖 Yo registro aquí el contrato visual para el frontend integral. La autoridad no es este tomo: es la biblioteca externa [Inume Design System](../../../../../../Inume%20Design%20System/), disponible en el layout local declarado. Este documento no acredita implementación ni fidelidad visual observada.

## Índice

1. [Autoridad y límites](#autoridad-y-límites)
2. [Composición obligatoria](#composición-obligatoria)
3. [Tokens y anatomía](#tokens-y-anatomía)
4. [Estados y accesibilidad](#estados-y-accesibilidad)
5. [Traslado al cliente](#traslado-al-cliente)

---

## Autoridad y límites

| Orden | Fuente | Uso que queda registrado |
|---:|---|---|
| 1 | [CSS del DS](../../../../../../Inume%20Design%20System/assets/css/) | Valores literales de tokens, geometría, estados y cascade. |
| 2 | [Páginas del DS](../../../../../../Inume%20Design%20System/index.html) | Anatomía y variantes concretas; el índice dirige a cada familia. |
| 3 | [DESIGN.md del DS](../../../../../../Inume%20Design%20System/DESIGN.md) | Explicación de tokens, layout, estados y criterios documentados. |
| 4 | [PRODUCT.md del DS](../../../../../../Inume%20Design%20System/PRODUCT.md) | Propósito del sistema como referencia reusable, no como producto final. |

La regla local exige reproducir 1:1 componentes, colores, tipografía, espaciado, radios, estados, motion y composición ([`AGENTS.md`](../../../../AGENTS.md):5–25; [`front/AGENTS.md`](../../../../front/AGENTS.md):61–73). La biblioteca es referencia documental, no paquete importable; la carpeta interna homónima queda excluida.

No convierto un ejemplo del DS en funcionalidad del producto. El inventario de rutas y contratos del backend pertenece a [`../backend-contracts.md`](../backend-contracts.md); la asignación futura pantalla↔capacidad queda fuera de este write set.

---

## Composición obligatoria

Para superficies con shell, yo preservo las tres regiones declaradas: sidebar fija de `250px` (colapsada `75px`), topbar fija de `70px`, y `main.page-content` con `margin-left` de sidebar y `padding: 24px 12px 60px`, incluido `padding-top: calc(var(--topbar-h) + 14px)` ([`DESIGN.md`](../../../../../../Inume%20Design%20System/DESIGN.md):191–253; [`styles.css`](../../../../../../Inume%20Design%20System/assets/css/styles.css):40–57,127–135).

| Elemento | Anatomía que se conserva | Referencia primaria |
|---|---|---|
| Shell | `aside.sidebar`, `header.topbar`, `main.page-content`, navegación activa y backdrop móvil | [`index.html`](../../../../../../Inume%20Design%20System/index.html), [`styles.css`](../../../../../../Inume%20Design%20System/assets/css/styles.css) |
| Card | `--card-radius: 5.6px`, `--card-border: 3px double var(--border)`, sombra de card | [`DESIGN.md`](../../../../../../Inume%20Design%20System/DESIGN.md):239–253 |
| Base UI | Capas `baseui.css`, `baseui-content.css`, `baseui-forms.css`, `baseui-tables.css`, `baseui-overlays.css`, `baseui-apex.css` según familia | [`assets/css/`](../../../../../../Inume%20Design%20System/assets/css/) |
| Auth | Shell propio `authentication-bg` sobre `main.account-pages` y card `auth-card`; capa `auth.css` | [`auth-signin.html`](../../../../../../Inume%20Design%20System/auth-signin.html):12–14,22–66 |
| Error — SCREEN-NOT-FOUND | Shell del dashboard (`aside.sidebar`, `header.topbar`, `main.page-content`, `assets/js/app.js`) y anatomía `error-container` → `error-row` → `error-col error-col-xl5` → `card error-card` → `error-body-alt` → `error-pad` → `error-inner`, con `h1.error-code.fs-60`, `h2.error-title.fs-22`, `p.error-text`, `a.error-btn.error-btn-danger` y `footer.footer`; capas `styles.css`, `errors.css` | [`pages-404-alt.html`](../../../../../../Inume%20Design%20System/pages-404-alt.html):12–14,27–221 |

> 📖 **Fuente definitiva de SCREEN-NOT-FOUND:** [`pages-404-alt.html`](../../../../../../Inume%20Design%20System/pages-404-alt.html) **completa**, por decisión explícita del operador del **2026-10-04** — «404-alt completo (Recommended)». No es una composición mixta: se toma esa página entera, con su shell y su anatomía, y no se le pide nada de la otra variante.
>
> [`pages-404.html`](../../../../../../Inume%20Design%20System/pages-404.html) sigue **disponible** en el catálogo de [reference-pages.md](reference-pages.md), pero **no** es fuente de esta pantalla: enlaza `assets/img/404.svg`, ausente en el layout local de la biblioteca. Esa ilustración **no** se sustituye por un dibujo aproximado, un sustituto ni un híbrido. Su shell `authentication-bg` tampoco se mezcla con el de `pages-404-alt.html`; cada superficie toma el suyo y no hereda el de la otra.

La composición se traslada a Vue 3 con `<script setup lang="ts">`, TypeScript y CSS vanilla, sin framework visual ni librería UI (orden vigente del operador, 2026-10-02, que deroga el mandato JavaScript anterior de [`front/AGENTS.md`](../../../../front/AGENTS.md):16–23). Eso define la plataforma, no autoriza reinterpretar selectores, valores o anatomía.

## Tokens y anatomía

La capa base declara `--bg`, `--surface`, `--surface-2`, `--hover`, `--border`, `--border-2`, `--muted`, `--text`, `--heading`, `--primary`, tokens semánticos e inks, layout, radio, sombra y tipografía ([`styles.css`](../../../../../../Inume%20Design%20System/assets/css/styles.css):4–67). Dark es el tema primario y light sobreescribe neutros y texto mediante `data-theme="light"` ([`DESIGN.md`](../../../../../../Inume%20Design%20System/DESIGN.md):5–14,52–70).

| Área | Contrato literal localizado |
|---|---|
| Tipografía | Body: `14px`, `400`, `1.5`; token `--font`; código con `--font-mono`; `font-synthesis-weight: none` ([`styles.css`](../../../../../../Inume%20Design%20System/assets/css/styles.css):59–65,92–110). |
| Jerarquía | `h1`/`.page-title`, `h3`, cards, KPI, tablas, badges y tabs están tabulados en [`DESIGN.md`](../../../../../../Inume%20Design%20System/DESIGN.md):124–151. |
| Color semántico | `--success`, `--danger`, `--warning`, `--info`, sus `--on-*` y `--*-text` se localizan en [`styles.css`](../../../../../../Inume%20Design%20System/assets/css/styles.css):17–38,80–86. |
| Variación viva | El customizer carga último y sus selectores `html[data-*]` gobiernan los overrides ([`theme-customizer.css`](../../../../../../Inume%20Design%20System/assets/css/theme-customizer.css):1–30). El catálogo completo vive en [customizer-catalog.md](customizer-catalog.md). |

## Estados y accesibilidad

Todo estado de reposo, hover, focus-visible, active, selected, disabled, error, éxito, carga o responsive se toma de su página y capa CSS de familia; no se deduce desde nombres. El DS documenta skip-link, `main#main`, `aria-current`, controles de icono etiquetados, patrones `role="menu"` y `role="tablist"`, modal con focus trap y `prefers-reduced-motion` para el motor ambiental ([`DESIGN.md`](../../../../../../Inume%20Design%20System/DESIGN.md):1–3; [`PRODUCT.md`](../../../../../../Inume%20Design%20System/PRODUCT.md):71–88).

El personalizador usa radiogroups con `aria-checked`, roving `tabindex`, flechas, `Home` y `End`; su panel es no modal y se cierra con Escape ([`theme-customizer.js`](../../../../../../Inume%20Design%20System/assets/js/theme-customizer.js):867–941). Es comportamiento de referencia, no evidencia de que el cliente lo haya reproducido.

## Traslado al cliente

1. Yo tomo la página y sus capas CSS de la familia concreta antes de construir una superficie.
2. Reproduzco valores y estructura 1:1 en CSS vanilla y componentes Vue; no importo la biblioteca externa.
3. Si una capacidad de Vue o CSS no puede expresar literalmente un rasgo, documento la adaptación y su justificación antes de sustituirlo. No hay adaptaciones declaradas en esta spec.
4. La apariencia elegida se mantiene en memoria del cliente y se persiste por usuario contra la API prevista; nunca en `localStorage`, `sessionStorage` ni cookies de estado ([`front/AGENTS.md`](../../../../front/AGENTS.md):35–55). El contrato de API no se duplica aquí.

🕯️ No he ejecutado navegador, servidor, tests ni comparación visual. La fidelidad final exige verificación observable posterior; este contrato sólo preserva las fuentes y los valores para esa tarea.
