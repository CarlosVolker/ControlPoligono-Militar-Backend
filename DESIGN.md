# Design

> **Procedencia:** este documento es un digest derivado del sistema visual adoptado. La fuente de verdad canónica — completa, con tablas por acento, ejes del customizer, familias de iconos y gaps conocidos — vive en la biblioteca externa [`Inume Design System/DESIGN.md`](../../Inume%20Design%20System/DESIGN.md), ubicada como directorio hermano de este repositorio (`../../Inume Design System/`). El Inume Design System es el design system del producto, completo y con componentes listos; el cliente debe consultarlo como referencia visual, tokens y plantillas a reproducir en la plataforma destino —no es un paquete ni una dependencia importable, y esta vinculación es documental: no instala el kit, no lo importa y no altera el producto—. La carpeta interna de nombre homónimo que existe en el repositorio no es la fuente de este proyecto.
>
> ⚠️ Enlaces relativos al layout actual del disco: un checkout aislado del repositorio no los resuelve. Requiere la biblioteca disponible en `../../Inume Design System/`. Páginas de referencia: [`index.html`](../../Inume%20Design%20System/index.html) y [`PRODUCT.md`](../../Inume%20Design%20System/PRODUCT.md).

## Tema

Sistema **dark-first** con alternancia a light theme vía atributo `data-theme` en `<html>` (`dark` / `light`). El dark theme es el primario; el light es un modo complementario, no el estado "seguro" ni la vista previa de demo.

Defaults lógicos del sistema adoptado tras su disciplina de color: acento `mint` (`#5bc9b5`), fondo `command` (`#11161e`), radio `square`, iconos `phosphor`, ambiente `embers`.

## Color

Tokens base (dark, `:root`):

| Token | Valor | Rol |
|---|---|---|
| `--bg` | `#191e23` | Fondo de página |
| `--surface` | `#1d2329` | Sidebar, topbar, cards, dropdowns |
| `--surface-2` | `#232a31` | Capa elevada: inputs, tab-group |
| `--hover` | `#2a3139` | Estados hover |
| `--border` | `#272f37` | Bordes 1px y separadores |
| `--muted` | `#8391a2` | Texto secundario: labels, breadcrumb |
| `--text` | `#aab8c5` | Texto base: body, celdas |
| `--heading` | `#aab8c5` | h1–h6 y títulos |
| `--primary` | `#7e67fe` | Acento funcional: activo, badge, focus |
| `--success` | `#68ce7d` | Verificado / trend up |
| `--danger` | `#d75341` | Bloqueado / error |
| `--warning` | `#e7985f` | Pendiente / trend down |
| `--info` | `#45afeb` | Informativo |

Contrato de tintas semánticas (ambos temas): `--on-*` es ink near-black del mismo matiz sobre el sólido (≥5.0:1); `--*-text` es ink cuando el semántico se usa como texto sobre soft-tint (≥4.5:1; en light reescribe a dark-same-hue).

Light theme: sobrescribe solo neutros y texto (`--bg` `#f4f6f8`, `--surface` `#ffffff`, `--text` `#2d3742`, `--muted` `#5b6776` = 5.3:1); acentos y semánticos sólidos se conservan.

Capa viva: 27 acentos y 19 fondos seleccionables por el theme customizer, incluidas familias militar / inteligencia / seguridad (`nvg`, `khaki`, `gunmetal`, `wraith`, `sentinel`, `sonar`) y cinco negros profundos (`blackout`, `carbon`, `obsidian`, `bunker`, `trench`). Tablas completas de hexes y ratios en el SSOT.

## Typography

**Una sola familia sans activa a la vez.** Predeterminada estática: **Play** (caras reales 400/700, sin faux-bold — `font-synthesis-weight: none`; los pesos intermedios hacen snap a cara real). El customizer define IBM Plex Sans como default lógico y permite elegir entre nueve familias (Play, Titillium Web, Exo 2, Rajdhani, IBM Plex Sans, Inter, Manrope, Public Sans, Geist), todas respetando la curva de pesos 400–700.

Escala (tamaños fijos, sin clamp):

| Elemento | Tamaño | Peso |
|---|---|---|
| `body` | 14px | 400 |
| `h1` / page-title | 18px | 700 |
| `h3` | 24px | 700 |
| `h4` / card-title | 18px | 600 |
| KPI value | 24px | 600 |
| Tablas | 13.5px | 400 |
| Badges / eyebrows | 11px | 600–700 |

Vocabulario numérico: `font-variant-numeric: tabular-nums` en KPIs, tablas, badges y paginación — contrato declarativo para familias derivadas con dígitos proporcionales.

## Layout

Shell de tres regiones fijas:

- **Sidebar**: `position: fixed`, 250px expandido / 75px colapsado, fondo `--surface`, borde derecho 1px, z-index 60.
- **Topbar**: fija, 70px de alto, anclada al sidebar, borde inferior 1px, z-index 50.
- **Contenido**: `margin-left` según estado del sidebar; padding-top = topbar + 14px.
- Mobile: sidebar sobre overlay backdrop semi-transparente.
- 4K+: `zoom: 2` en body (no `transform: scale`, para preservar `position: fixed` contra el viewport).

Radios de la cascade base (preset `soft`): `--card-radius` 5.6px, `--r-md` 6px, `--r-sm` 4px, `--r-pill` 999px. La card lleva la firma del sistema: borde doble (`3px double var(--border)`). Sombras: `0 1px 0 rgba(0,0,0,.2)` en card; `0 14px 30px rgba(0,0,0,.45)` en capas pop.

## Components

El sistema adoptado entrega 38 páginas demo con componentes listos: shell de dashboard (sidebar + topbar + footer), auth (sign-in, sign-up, password, lock), suite de formularios (basic, validation, editors, uploads, flatpickr), tablas (basic + Grid.js), 23 charts tematizados en vivo (ApexCharts), mapas vectoriales y el UI kit completo (accordion, alerts, avatar, badge, breadcrumb, buttons, card, carousel, collapse, dropdown, list-group, modal, offcanvas, pagination, placeholders, popovers, progress, scrollspy, spinners, tabs, toasts, tooltips), más páginas 404.

Capas CSS: `styles.css` (shell), `baseui*.css` (UI kit con tokens unificados al shell), `theme-customizer.css` (capa viva, carga última), más capas de auth y errores.

## Motion

- Transiciones que sirven al estado: `.15s`–`.25s`, ease-out exponencial. Sin bounce, sin elastic.
- Fondo ambiental: motor compositor-only (solo transform/opacity), ocho variantes (`embers`, `fireflies`, `rain`, `searchlights`, `tracers`, `ricochet`, `ash`, `off`), seleccionables y teintables.
- `prefers-reduced-motion`: alternativa con `!important` en las siete ramas animadas del motor ambiental. Quedan transiciones secundarias del shell pendientes de alternativa (ver §Gaps del SSOT).

## Derivation rules

1. Consumir tokens, nunca hexes: todo color del producto sale de los tokens `--*`, jamás hardcodeado.
2. Respetar el contrato de tintas `--on-*` y `--*-text` para semánticos en ambos temas.
3. Mantener `tabular-nums` en todo componente numérico.
4. Una interacción aprendida funciona igual en todas partes: el mismo vocabulario en cada pantalla.
5. Toda extensión del sistema (componente o acento nuevo) se documenta en el SSOT antes de usarse en el producto.
