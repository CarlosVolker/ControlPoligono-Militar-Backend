---
actualizado: 2026-10-12
---

# Reporte de fidelidad al Design System — contraste estático y correcciones 1:1

> 🕯️ **Qué es y qué no.** `Lore Master`, 2026-10-12. Reporte de **evidencia estática** de
> fidelidad 1:1, que sirve como evidencia de AC-8. **No certifica píxeles renderizados**: no hubo
> navegador en esta verificación. Fuentes: contraste estático Dwarven-Spelunkers del 2026-10-12 y
> fixes de `Code Transmuter` verificados por el orquestador con `grep` y
> `pnpm --dir front build` exit 0.

## 1. Índice

1. [Coincidencias](#1-coincidencias) · 2. [Divergencias corregidas](#2-divergencias-corregidas-18) ·
3. [Ya alineadas](#3-divergencias-justificadas-como-ya-alineadas-4) ·
4. [Brechas restantes](#4-brechas-restantes-conocidas) · 5. [Regla y alcance](#5-regla-y-alcance)

---

## 2. Coincidencias

| Elemento | Resultado del contraste |
|---|---|
| `theme-customizer.css` | **398 / 398** bloques idénticos |
| Tokens `:root` del shell | **33 / 33** idénticos |
| Tokens Base UI | **30 / 30** idénticos |
| `.topbar` · `.sidebar` · `.btn`, con variantes | Idénticos, incluidos `focus-visible` e `invalid` |
| `.table` | `padding` uniforme, equivalente |

---

## 3. Divergencias corregidas (8)

Cada una quedó alineada **1:1** con el valor del Design System, sin interpretación.

| # | DS — fuente | Cliente — destino |
|---|---|---|
| 1 | `baseui.css:720` — `padding: 12px 16px` de `.alert` | `dashboard.css` |
| 2 | `baseui.css:721` — `margin-bottom: 16px` de `.alert` | `dashboard.css` |
| 3 | `baseui.css:722` — `border: 1px solid transparent` de `.alert` | `dashboard.css` |
| 4 | `baseui.css:737-739` — `border-color` de `-info`/`-warning`/`-danger` = `rgba(var(--bui-*-rgb),.4)` | `dashboard.css` |
| 5 | `baseui.css:290` — `.text-center` con `!important` | `dashboard.css` |
| 6 | `baseui.css:1108-1110` — `reduced-motion` a `.001ms` | `dashboard.css` |
| 7 | `baseui-forms.css:36` — `--buf-check-border` en oscuro = `rgba(255,255,255,.25)` | `design-system.css` |
| 8 | `styles.css:65,109` — `--font-mono` **y** regla para `code, pre, kbd, samp` | `design-system.css` |

Además, `--dashboard-scale: 1` declarado en `:root` del cliente, conforme a `styles.css:66`.

---

## 4. Divergencias justificadas como ya alineadas (4)

El contraste inicial las marcó como divergentes y **era incorrecto**: ya coincidían.

| Elemento | Constancia real |
|---|---|
| `min-height` de `.form-control` | Existe en el DS, `baseui-forms.css:66` |
| `.card-body` | `24px` efectivo ya presente en `dashboard.css` |
| `--input-border` en oscuro | Ya `#3a4551` |
| Alias de radius y de progreso | Mismo valor base que el DS |

---

## 5. Brechas restantes conocidas

| Brecha | Estado |
|---|---|
| `--buf-check-border` y `--buf-switch-dot` del `:root` **claro** (`baseui-forms.css:27,30`) no declarados en el cliente | **Sin impacto visual actual** y **sin consumidor en el cliente** |
| Render visual | **Comprobado por spot-check** del orquestador (2026-10-12): dos pares de superficies a 1440×900 en tema oscuro — `index.html` del DS vs dashboard del producto, y `ui-buttons.html` vs catálogo de armerías (botones, badges, tabla). Anatomía, radios, alturas y lenguaje de color coinciden; las diferencias visibles son contenido de producto, no de componentes. Capturas efímeras en `/tmp/opencode/ds-spot/`. **No** se afirma paridad renderizada de todas las superficies |
| Capturas de escritorio del mismo día | **Anteriores** a estos fixes; no sirven como evidencia del estado corregido |

---

## 6. Regla y alcance

Las adaptaciones que el cliente declara están documentadas y citadas en
`design-system.css:1-9`, `dashboard.css:14-17,368-371,500-504`: son las adaptaciones permitidas
—las que la plataforma destino no puede expresar— y están reportadas y justificadas, nunca
aplicadas en silencio.

> 🕯️ **Alcance de la afirmación.** La fidelidad 1:1 queda **restablecida a nivel de valores CSS
> estáticos**, con **spot-check renderizado** de dos pares de superficies (dashboard y
> botones/tabla) en tema oscuro. **No** se afirma paridad visual observada de todas las
> superficies ni en ambos temas. El estado global de la aceptación integral **no cambia**:
> `NOT_VERIFIED` / `NO_CUMPLIDO`.