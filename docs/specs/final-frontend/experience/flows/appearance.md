---
spec_meta: "../../spec-meta.yaml"
---

# Flujos — Apariencia: personalizador de 8 ejes

> 📜 Yo detallo aquí los ocho flujos de apariencia. La API de
> ocho ejes `GET|PUT|DELETE /api/me/preferences/appearance/design-system/` fue una ruta
> **propuesta** en [technical-design.md](../../technical-design.md) §5.3 y **hoy existe y
> está consumida** (ocho campos `ds_*` en `apipoligono/models.py:152-159`, migración
> `0021_design_system_preferences` y rutas `apipoligono/urls.py:85-86`; verificado
> 2026-10-15): los flujos que la consumen son ejecutables bajo el plan de cierre. Lo que la
> ruta legacy `OP-PRF-001/002` hace hoy se documenta
> **separado** en FL-APP-008. Requisitos: [appearance.md](../../requirements/appearance.md);
> catálogos y defaults: [customizer-catalog.md](../../design-system/customizer-catalog.md).

## Índice

1. [FL-APP-001 — Restauración antes de ready](#fl-app-001--restauración-antes-de-ready)
2. [FL-APP-002 — Cambio de eje: preview y autosave](#fl-app-002--cambio-de-eje-preview-y-autosave)
3. [FL-APP-003 — Reset a defaults](#fl-app-003--reset-a-defaults)
4. [FL-APP-004 — Error de guardado o lectura](#fl-app-004--error-de-guardado-o-lectura)
5. [FL-APP-005 — Logout y cambio de principal](#fl-app-005--logout-y-cambio-de-principal)
6. [FL-APP-006 — Cambio de unidad activa](#fl-app-006--cambio-de-unidad-activa)
7. [FL-APP-007 — Modo público](#fl-app-007--modo-público)
8. [FL-APP-008 — Ruta legacy de tres campos](#fl-app-008--ruta-legacy-de-tres-campos)

---

### FL-APP-001 — Restauración antes de ready

- **Actor:** usuario autenticado (login nuevo o recarga).
- **Pantalla:** ninguna visible: ocurre durante el arranque, antes del primer pintado de
  la superficie autenticada.
- **Precondición:** sesión resuelta (FL-SES-001/002).
- **Dependencia de backend:** ruta de 8 ejes §5.3 (`GET`) — **existe** (verificado
  2026-10-15); la restauración por usuario es ejecutable bajo el plan de cierre
  (`front/AGENTS.md` §Personalizador), sin parche de almacenamiento local.

| # | Paso | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | La app arranca autenticada | `GET /me/preferences/appearance/design-system/` (propuesta §5.3) con sesión; `X-Tenant-Code` no obligatorio en esta ruta (§5.3) | `200` con el objeto completo de 8 ejes, defaults canónicos para cualquier valor ausente | **Antes** de quedar `ready`: escribe los ocho atributos `data-*` en `<html>` con la semántica de presencia/ausencia de [customizer-catalog.md](../../design-system/customizer-catalog.md) §Atributos y reset (R-APP-07, `technical-design.md` §6.2) |
| 2 | — (respuesta resuelta) | ninguna | — | La app pasa a `ready`; nunca se pinta la apariencia de otro usuario (T-08) |

- **Postcondición observable:** la primera superficie autenticada ya muestra los ocho
  ejes del usuario; no hay parpadeo desde defaults a preferencias.
- **Fallos:** error de lectura → FL-APP-004: estado local intacto y UI en error,
  **nunca** «guardar los defaults» (`technical-design.md` §6.5). `403` → FL-APP-004 (no
  cierra sesión). Red → F-06 sin defaults aplicados por cuenta propia.

---

### FL-APP-002 — Cambio de eje: preview y autosave

- **Actor:** usuario autenticado.
- **Pantalla:** `/personalizador` (ref. DS: panel de `index.html:478–530` con grupos
  inyectados por `buildExtendedUI()`; `technical-design.md` §6.1).
- **Precondición:** apariencia restaurada (FL-APP-001).
- **Entradas:** selección en cualquiera de los 8 ejes — `theme, accent, bg, font, radius,
  iconfam, ambient, ambcolor` — con catálogos y defaults 1:1 del DS
  ([customizer-catalog.md](../../design-system/customizer-catalog.md)); operación por
  clic, flechas, `Home`, `End` y tabindex rotatorio (R-APP-03).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Selecciona un valor | ninguna (todavía) | — | Escribe **en el acto** el atributo `data-*` en `<html>` (preview sin esperar al backend, R-APP-02), con la semántica exacta de la fuente: `bg=neutral`, `font=play`, `radius=soft`, `iconfam=default`, `ambcolor=accent` **eliminan** el atributo; `accent` y `ambient` se escriben siempre; sin alterar los 10 tokens de radio (R-APP-04) |
| 2 | — (efectos del eje) | ninguna | — | `iconfam` remapea los 44 conceptos del DS + la colección propia, idempotente en cualquier dirección (R-APP-08); `font` carga bajo demanda la URL original del DS sin duplicar `<link>`, y `fa7-solid` conserva su atribución de licencia (R-APP-09); `theme` conmuta con icono de la familia activa y anuncia el cambio para que los gráficos re-resuelvan paleta (evento `darkone:themechange`, `technical-design.md` §6.1) |
| 3 | — (autosave diferido) | `PUT /me/preferences/appearance/design-system/` (propuesta §5.3) con los **8 campos exactos**, ninguno nulo (R-APP-11) | `200` con el objeto canónico persistido | `saveState`: `dirty` (ST-09) → `saving` (ST-05) → `saved` (ST-06) visible en el panel (R-APP-03); debounce con **una sola petición en vuelo por principal**; una selección nueva durante el vuelo **sustituye** la instantánea pendiente; `PUT`/`DELETE` nunca fuera de orden entre sí; la marca `saved` sólo aplica si la respuesta pertenece a la generación/instantánea vigente (`technical-design.md` §6.5, T-07) |

- **Postcondición observable:** el atributo aplicado es inmediato; el estado de guardado
  del panel refleja la escritura confirmada por el backend, no el optimismo.
- **Fallos:** `400` → FL-APP-004 por campo. `403` → FL-APP-004 sin cierre automático de
  sesión (T-09). Red → F-06: `saveState=error`, el eje elegido **queda aplicado en
  memoria** y la cola conserva la última instantánea para reintento explícito (F-10);
  cambio de principal en vuelo → F-07/FL-APP-005.

---

### FL-APP-003 — Reset a defaults

- **Actor:** usuario autenticado.
- **Pantalla:** `/personalizador`, botón «Reset to defaults» (ref. DS
  `theme-customizer.js:347`, `index.html:529`).
- **Entradas:** ninguna; es una acción.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Pulsa reset | `DELETE /me/preferences/appearance/design-system/` (propuesta §5.3) | `204` sin cuerpo; restablece los 8 ejes a defaults en una sola escritura **idempotente**; no borra el usuario ni la sesión (R-APP-12) | Devuelve los ocho ejes a los defaults canónicos — `dark, mint, command, ibm-plex, square, phosphor, embers, accent` ([customizer-catalog.md](../../design-system/customizer-catalog.md) §Atributos y reset) — y re-aplica los atributos con su semántica de presencia/ausencia; `saveState` → ST-06 |

- **Postcondición observable:** los ocho atributos de `<html>` corresponden a los
  defaults; una recarga posterior (FL-APP-001) devuelve los mismos defaults persistidos.
- **Fallos:** `403`/red → FL-APP-004: sin reset local persistido de facto; el estado
  vuelve al último valor confirmado. `PUT`/`DELETE` en cola: orden garantizado
  (`technical-design.md` §6.5).

---

### FL-APP-004 — Error de guardado o lectura

- **Actor:** usuario autenticado.
- **Pantalla:** `/personalizador` (indicador de estado de guardado) o arranque
  (FL-APP-001).
- **Entradas:** ninguna; es reactivo a la ruta propuesta §5.3.

| # | Disparador | Respuesta real | Conducta obligatoria |
|---:|---|---|---|
| 1 | `PUT` responde `400` | errores por campo de DRF (`{ "ds_accent": ["…"] }`) y `non_field_errors` para conjunto incompleto o campos extra (§5.3) | Mostrar el error **por campo tal como lo devuelve el backend** (R-APP-13); anclar al eje correspondiente; `saveState=error`; los valores en memoria no se revierten por iniciativa propia |
| 2 | `GET`/`PUT`/`DELETE` responde `403` | la API no expone `401`: el `403` puede ser sesión/CSRF inválido **o** sin permiso (§5.3) | Diferenciar por contexto; **no cerrar sesión automáticamente** ante un `403` de preferencias (R-APP-13, T-09): en su lugar consultar el contexto (OP-AUT-002) y actuar según FL-SES-006 sólo si el contexto confirma sesión perdida |
| 3 | Fallo de red en `GET` | sin respuesta | El estado local queda intacto y la UI en estado de error; **no** se interpreta como «guardar los defaults» (`technical-design.md` §6.5); reintento explícito F-10 |
| 4 | Respuesta tardía tras cambio de eje | respuesta de generación anterior | Se descarta (ST-08): no puede marcar `saved` algo que ya cambió (`technical-design.md` §6.5) |

- **Postcondición observable:** el panel muestra el estado de guardado real; ningún
  error se traduce a defaults, a éxito ni a cierre de sesión indebido.

---

### FL-APP-005 — Logout y cambio de principal

- **Actor:** usuario autenticado que cierra sesión (FL-SES-005) o da sesión a otro
  principal.
- **Entradas:** ninguna; es reactivo.

| # | Disparador | Conducta obligatoria (sin petición nueva) |
|---:|---|---|
| 1 | Logout o cambio de principal | **Abortar** las escrituras de apariencia en vuelo; **descartar** respuestas tardías; **vaciar** la cola de escrituras pendientes; **restablecer** los defaults de cliente (R-APP-06, `technical-design.md` §6.5) |
| 2 | Nuevo principal autenticado | Restauración completa vía FL-APP-001 antes de `ready`: nunca se pinta la apariencia del usuario anterior (T-08) |

- **Postcondición observable:** la sesión entrante ve defaults hasta que su propio
  `GET` resuelve; ninguna preferencia cruza entre usuarios.

---

### FL-APP-006 — Cambio de unidad activa

- **Actor:** usuario que cambia de unidad (FL-SES-004).
- **Entradas:** ninguna; es reactivo.

| # | Disparador | Conducta obligatoria |
|---:|---|---|
| 1 | `select-unit` exitoso | Las preferencias de apariencia **se conservan**: la pertenencia sigue siendo el mismo usuario (R-APP-06). No se vacía la cola de autosave, no se re-aplican defaults, no se re-lee el backend por causa del cambio de unidad |

- **Postcondición observable:** los ocho atributos de `<html>` no cambian tras el cambio
  de unidad; el resto de datos sí se recarga (F-08).

---

### FL-APP-007 — Modo público

- **Actor:** usuario público (login, recuperación, 404).
- **Entradas:** ninguna.

| # | Disparador | Conducta obligatoria |
|---:|---|---|
| 1 | Superficie pública sin sesión | Aplicar los **defaults canónicos** del DS; **no consultar ni persistir nada** para un usuario desconocido (R-PREF-03, R-APP-07, `technical-design.md` §6.2) |
| 2 | Ajuste de apariencia antes de sesión | Se aplica el default canónico y no se persiste (R-PREF-03): sin `localStorage`, sin hash, sin clave manual (`front/AGENTS.md` §Personalizador) |

- **Postcondición observable:** las pantallas públicas se pintan con los defaults
  canónicos y ninguna petición de preferencias sale sin sesión.

---

### FL-APP-008 — Ruta legacy de tres campos

- **Actor:** usuario autenticado.
- **Estado:** **API actual existente** (OP-PRF-001/002); separada de la ruta propuesta de
  8 ejes. La ruta legacy permanece intacta: no se renombra, no se redirige, no se
  extiende (`technical-design.md` §5.3).
- **Entradas (PUT parcial):** `theme` = `nexus-light|nexus-dark`; `palette` =
  `corporate-blue|military-teal|neutral-slate`; `density` = `comfortable|compact`.
  Defaults de modelo: `nexus-light`, `corporate-blue`, `comfortable`
  ([contrato](../../contracts/exercises-preferences.md) §Preferencias legacy).

| # | Paso | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Lectura (si un flujo la consulta) | `GET /me/preferences/appearance/` (OP-PRF-001) | `{theme, palette, density}` | Se muestra como configuración legacy; **no gobierna la apariencia visible** del producto (`requirements.md` §6) |
| 2 | Escritura legacy | `PUT /me/preferences/appearance/` (OP-PRF-002) parcial | `200` con el mismo objeto; elección inválida → `400 {error}` con mensajes literales `Theme inválido`, `Palette inválida`, `Density inválido` (R-PREF-02) | Propaga el mensaje por campo tal cual, sin reinterpretar |

- **Separación obligatoria:** `palette` y `density` **no tienen eje** en el DS: no se
  traducen, no se reinterpretan y no se ofrecen como control del personalizador
  (`requirements.md` §6, D-01 retirada). El cliente deja de escribir `palette` y
  `density` a efectos visuales; los campos quedan intactos en el backend. Ningún flujo
  mezcla la ruta legacy con la propuesta; no hay migración automática entre ambas.
- **Fallos:** `400` → literales citados, F-01. `403` → la API no expone `401`: aplicar
  FL-APP-004 fila 2. Red → F-06.

> 🕯️ El modelo de ocho campos existe (ocho campos `ds_*` en `apipoligono/models.py:152-159`,
> migración `0021_design_system_preferences` y rutas `apipoligono/urls.py:85-86`; verificado
> 2026-10-15): FL-APP-001/002/003/004 describen el comportamiento contratado contra la ruta
> de 8 ejes y su persistencia por usuario es ejecutable bajo el plan de cierre; el hueco no
> se parchea con almacenamiento local
> (`front/AGENTS.md` §Personalizador).
