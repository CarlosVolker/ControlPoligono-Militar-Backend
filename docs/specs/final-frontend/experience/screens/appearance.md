---
spec_meta: "../../spec-meta.yaml"
---

# Pantallas — Apariencia (personalizador del Design System)

> 📜 Tomo de catálogo del workstream `full-frontend-screens-recovery`. Los requisitos normativos de apariencia (`R-APP-*`, `R-PREF-*`) viven en `requirements.md` §3.3 y §6 y en el tomo de requisitos compartidos/apariencia de otro writer; este archivo sólo define la pantalla y su trazabilidad de operaciones. Convenciones generales: [`../screens.md`](../screens.md).

## Índice

1. [SCREEN-PERSONALIZER](#screen-personalizer--personalizador-de-8-ejes)
2. [Trazabilidad de la apariencia legacy](#trazabilidad-de-la-apariencia-legacy)

---

### SCREEN-PERSONALIZER — Personalizador de 8 ejes

| Atributo | Valor |
|---|---|
| Propósito | Exponer los ocho ejes del personalizador del Design System —`theme`, `accent`, `bg`, `font`, `radius`, `iconfam`, `ambient`, `ambcolor`— con vista previa inmediata, reset a defaults y persistencia por usuario contra la API del backend. |
| Ruta | `/personalizador` — fijada en `technical-design.md` §4. Requiere contexto. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Personalizador. |
| Fuente DS | Panel original del DS: `index.html`:478–530 (markup) + `buildExtendedUI()` de `theme-customizer.js`:724–856 para los grupos inyectados; capa `theme-customizer.css` cargada última; radiogroups con `aria-checked`, roving tabindex, flechas, `Home`/`End`, panel no modal cerrable con Escape ([`visual-contract.md`](../../design-system/visual-contract.md) §4). El panel conserva su anatomía, clases y comportamiento sin deformar (`technical-design.md` §7). |

**Datos y operaciones.**

- **Ruta de 8 ejes (diseñada, NO implementada):** `GET`/`PUT`/`DELETE /api/me/preferences/appearance/design-system/` según `technical-design.md` §5.3 — lectura de los ocho campos `ds_*`, escritura exacta de los ocho, reset idempotente. **Hueco declarado:** el backend vigente no expone esta ruta; su construcción es la única excepción de backend autorizada y exige spec aprobada y gate superado (`front/AGENTS.md` §Límites). Mientras no exista, la persistencia de los ejes sin campo **no se simula** con `localStorage`, hash ni clave manual (`front/AGENTS.md`:42–44; `R-APP-10`).
- `OP-PRF-001` / `OP-PRF-002` — ver [trazabilidad legacy](#trazabilidad-de-la-apariencia-legacy) más abajo.
- Catálogos exactos por eje (27 acentos, 26 fondos, 9 tipografías, 3 radios, 7 familias de iconos, 8 ambientes, 7 colores de ambiente) y defaults de reset (`dark`, `mint`, `command`, `ibm-plex`, `square`, `phosphor`, `embers`, `accent`): [`customizer-catalog.md`](../../design-system/customizer-catalog.md). No se copian aquí ni se reducen.

**Acciones y formularios.**

- Selección por eje con vista previa inmediata: el atributo `data-*` se escribe en `<html>` en el acto, sin esperar al backend (`R-APP-02`), respetando la semántica de atributo ausente de la fuente (`radius=soft`, `iconfam=default`, etc.; `R-APP-04`, `customizer-catalog.md` §3).
- Toggle de tema `dark`/`light` con icono de la familia activa (`R-APP-03`).
- Botón de reset a defaults del DS (`R-APP-03`; `DELETE` de §5.3, `R-APP-12`).
- Autosave diferido con debounce, una sola escritura en vuelo, última instantánea pendiente y marca `saved` sólo por instantánea vigente (`technical-design.md` §6.5).
- Aviso de atribución de licencia de `fa7-solid` tal como lo incluye el DS (`R-APP-09`).
- Tipografías bajo demanda con las URL originales del DS y `<link>` deduplicado (`R-APP-09`).

**Controles de acceso.** Ruta de preferencias: IA (sesión propia), sin tenant obligatorio y sin permiso nuevo (`technical-design.md` §5.3). La pantalla exige contexto sólo para saber quién persiste; en modo público (login/recuperación) no se consulta ni persiste nada y se aplican defaults canónicos (`R-APP-07`, `R-PREF-03`).

**Estados y criterios observables.** `saveState ∈ {idle, dirty, saving, saved, error}` visible en el panel (`technical-design.md` §9); `400` ⇒ error por campo literal (`R-APP-13`); `403` en esta ruta ⇒ distinguir «sesión/CSRF inválido» de «sin permiso» por contexto, sin cerrar sesión automáticamente (`R-APP-13`, T-09); error de lectura de red ⇒ estado de error con valores locales intactos, nunca «guardar los defaults» (§6.5); al cerrar sesión o cambiar de principal ⇒ abortar escrituras en vuelo, vaciar cola y restablecer defaults (`R-APP-06`); restauración de sesión resuelve preferencias **antes** de `ready` para no pintar apariencia ajena (`R-APP-07`, T-08); la familia de iconos remapea los 44 conceptos del DS más la colección propia, idempotente en ambas direcciones (`R-APP-08`).

**Navegación.** Entrada desde el menú de contexto y desde el toggle de tema del topbar ([`../navigation.md`](../navigation.md)). Deep link permitido con sesión; sin sesión el guard lleva a SCREEN-LOGIN preservando `/personalizador` como destino (`technical-design.md` §3.2). Cambiar de unidad activa no borra preferencias (`R-APP-06`).

---

## Trazabilidad de la apariencia legacy

🕯️ Registro factual, sin reabrir la decisión D-01 (retirada):

| OP | Estado en este catálogo |
|---|---|
| `OP-PRF-001` `GET /me/preferences/appearance/` | **Legado.** Permanece intacto y legible; expone `{theme, palette, density}` ([contrato](../../contracts/exercises-preferences.md#preferencias-de-apariencia-legacy)). **No gobierna los 8 ejes** ni la apariencia visible del producto (`requirements.md` §6). |
| `OP-PRF-002` `PUT /me/preferences/appearance/` | **Legado.** El cliente deja de escribir `palette` y `density` a efectos visuales; la ruta no se renombra, redirige ni extiende (`technical-design.md` §5.3). Sus `400` literales (`Theme inválido`, `Palette inválida`, `Density inválido`) quedan documentados en `R-PREF-02` por si un consumidor los encuentra. |

Los tres campos legacy del modelo (`theme`, `palette`, `density`) no tienen correspondencia con los ejes del DS: no se traducen, no se reinterpretan y no se ofrecen como control (`requirements.md` §6). La cobertura de `OP-PRF-001/002` en el catálogo es esta traza: no existe pantalla de preferencias legacy.
