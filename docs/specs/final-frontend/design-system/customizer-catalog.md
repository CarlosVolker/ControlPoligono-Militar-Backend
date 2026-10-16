# Catálogo exacto del personalizador

> 📜 Yo tomo el catálogo ejecutable de [`theme-customizer.js`](../../../../../../Inume%20Design%20System/assets/js/theme-customizer.js):54–81 como autoridad para valores y defaults. El almacenamiento local del mockup externo no se traslada al cliente.

## Índice

1. [Contrato de ocho ejes](#contrato-de-ocho-ejes)
2. [Catálogos](#catálogos)
3. [Atributos y reset](#atributos-y-reset)
4. [Persistencia del producto](#persistencia-del-producto)
5. [Discrepancia registrada](#discrepancia-registrada)

---

## Contrato de ocho ejes

| Eje | Atributo DS | Default lógico | Total | Fuente ejecutable |
|---|---|---|---:|---|
| `theme` | `data-theme` | `dark` | 2 | [`theme-customizer.js`](../../../../../../Inume%20Design%20System/assets/js/theme-customizer.js):400, [`DESIGN.md`](../../../../../../Inume%20Design%20System/DESIGN.md):5–14 |
| `accent` | `data-accent` | `mint` | 27 | JS:54–58,75 |
| `bg` | `data-bg` | `command` | 26 | JS:59–62,76 |
| `font` | `data-font` | `ibm-plex` | 9 | JS:63–64,77 |
| `radius` | `data-radius` | `square` | 3 | JS:65,78 |
| `iconfam` | `data-iconfam` | `phosphor` | 7 | JS:216,79 |
| `ambient` | `data-ambient` | `embers` | 8 | JS:66–67,80 |
| `ambcolor` | `data-ambcolor` | `accent` | 7 | JS:68,81 |

## Catálogos

| Eje | Valores exactos |
|---|---|
| `theme` | `dark`, `light` |
| `accent` | `violet`, `green`, `amber`, `blue`, `pink`, `teal`, `orange`, `red`, `cyan`, `lime`, `indigo`, `fuchsia`, `sky`, `rose`, `emerald`, `gold`, `olive`, `signal`, `steel`, `mint`, `copper`, `nvg`, `khaki`, `gunmetal`, `wraith`, `sentinel`, `sonar` |
| `bg` | `neutral`, `abyss`, `fern`, `ember`, `midnight`, `wine`, `slate`, `sand`, `field`, `command`, `forge`, `glacier`, `orchid`, `clay`, `blackout`, `carbon`, `obsidian`, `bunker`, `trench`, `pure`, `stone`, `zinc`, `mauve`, `sage`, `mist`, `taupe` |
| `font` | `play`, `titillium`, `exo2`, `rajdhani`, `ibm-plex`, `inter`, `manrope`, `public-sans`, `geist` |
| `radius` | `soft`, `subtle`, `square` |
| `iconfam` | `default`, `mingcute`, `solar`, `mdi`, `fa7-solid`, `phosphor`, `lucide` |
| `ambient` | `embers`, `fireflies`, `rain`, `searchlights`, `tracers`, `ricochet`, `ash`, `off` |
| `ambcolor` | `accent`, `ember`, `gold`, `lime`, `mint`, `cyan`, `violet` |

Las etiquetas, previews y accesibilidad del panel se generan desde metadatos y radiogroups ([`theme-customizer.js`](../../../../../../Inume%20Design%20System/assets/js/theme-customizer.js):143–189,716–865). No reduzco estas listas ni renombro sus valores.

## Atributos y reset

El default lógico y el baseline sin atributo no son equivalentes. Esta tabla conserva una distinción que no puede perderse:

| Eje | Regla al aplicar valor efectivo | Valor que elimina atributo |
|---|---|---|
| `theme` | `data-theme` es `dark` o `light` | No declarado por `apply()`; el toggle de tema queda fuera de esta función. |
| `accent` | Siempre escribe `data-accent`, incluso `violet` | ninguno |
| `bg` | Escribe salvo `neutral` | `neutral` |
| `font` | Escribe salvo `play` | `play` |
| `radius` | Escribe salvo `soft` | `soft` |
| `iconfam` | Escribe salvo `default` | `default` |
| `ambient` | Siempre escribe `data-ambient`, incluso `embers` | ninguno |
| `ambcolor` | Escribe salvo `accent` | `accent` |

La aplicación está localizada en [`theme-customizer.js`](../../../../../../Inume%20Design%20System/assets/js/theme-customizer.js):416–488. Reset deja el estado vacío, vuelve a aplicar defaults lógicos y después persiste el resultado en el mockup ([`theme-customizer.js`](../../../../../../Inume%20Design%20System/assets/js/theme-customizer.js):943–951). Por tanto, el reset del producto debe restablecer exactamente: `dark`, `mint`, `command`, `ibm-plex`, `square`, `phosphor`, `embers`, `accent`.

## Persistencia del producto

El mockup persiste bajo una clave de navegador y read/write/reset están implementados contra `localStorage` ([`theme-customizer.js`](../../../../../../Inume%20Design%20System/assets/js/theme-customizer.js):54,355–410). Esa conducta queda **prohibida** en el cliente: la selección se conserva en memoria y se guarda por usuario contra la API del backend, sin `localStorage`, `sessionStorage`, cookies de estado, hash ni clave manual ([`front/AGENTS.md`](../../../../front/AGENTS.md):35–44).

El endpoint y los campos de persistencia pertenecen a [`../technical-design.md`](../technical-design.md) §5 y al contrato de backend correspondiente; no los duplico. **Hoy existen y están consumidos** (ocho campos `ds_*` en `apipoligono/models.py:152-159`, migración `0021_design_system_preferences` y rutas `apipoligono/urls.py:85-86`; verificado 2026-10-15). La spec está **`approved`** desde el 2026-10-02 ([`../spec-meta.yaml`](../spec-meta.yaml):7).

## Discrepancia registrada

🕯️ El texto narrativo de [`DESIGN.md`](../../../../../../Inume%20Design%20System/DESIGN.md):255–273,342–366 declara **19** fondos y enumera sólo hasta `trench`. En cambio, el catálogo ejecutable `BGS` y el guard inline de las páginas aceptan **26**, añadiendo `pure`, `stone`, `zinc`, `mauve`, `sage`, `mist`, `taupe` ([`theme-customizer.js`](../../../../../../Inume%20Design%20System/assets/js/theme-customizer.js):59–62; [`theme-customizer.css`](../../../../../../Inume%20Design%20System/assets/css/theme-customizer.css):14–20).

Para el personalizador del producto, yo preservo los 26 valores ejecutables para no omitir opciones reales. Esta anotación no modifica el DS ni decide cuál fuente debe corregirse; deja la divergencia visible para el siguiente lector.
