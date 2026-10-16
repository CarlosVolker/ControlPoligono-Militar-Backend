---
spec_meta: "../spec-meta.yaml"
---

# Criterios de aceptación — Apariencia: legacy, 8 ejes y huecos D-02

> 📖 Volumen del conjunto de aceptación `acceptance/` (método y convenciones en [`core.md`](core.md); estado, gates y autorizaciones en [`../verification.md`](../verification.md)).
> Estado global: **NO EJECUTADO** (la comprobación M-U sigue pendiente; paridad de render en
> estados completos `NOT_VERIFIED`, T8/T9). Cubre las 2 OP legacy (`AC-OP-PRF-001/002`) y los 7
> flujos de apariencia **sin OP actual** (`AC-FL-APP-001…007`): cuatro contra la ruta
> de ocho ejes (`technical-design.md` §5.3, **hoy existente y consumida**; verificado
> 2026-10-15) y tres
> reactivos sin petición propia. Requisitos:
> [`../requirements/appearance.md`](../requirements/appearance.md); catálogos y defaults:
> [`../design-system/customizer-catalog.md`](../design-system/customizer-catalog.md);
> flujos: [`../experience/flows/appearance.md`](../experience/flows/appearance.md).

> **Advertencia de estado, no negociable.** La ruta de ocho ejes
> `GET|PUT|DELETE /api/me/preferences/appearance/design-system/` **existe y está consumida**
> (ocho campos `ds_*` en `apipoligono/models.py:152-159`, migración
> `0021_design_system_preferences` y rutas `apipoligono/urls.py:85-86`; verificado 2026-10-15);
> la excepción acotada de backend ya se ejecutó y la spec está `approved` (2026-10-02). Los
> `AC-FL-APP-001…004` son criterios de comportamiento **ejecutables bajo el plan de cierre**
> (`front/AGENTS.md` §Límites). Ninguna fila
> de este volumen parchea el hueco con almacenamiento local.

## Convenciones de familia

- **Precondición base:** sesión real activa para todo lo persistido; modo público
  (login, recuperación, 404) para defaults. Apariencia en memoria (Pinia) + backend:
  **nunca** `localStorage`, `sessionStorage`, cookies de estado, hash de URL ni clave
  manual (R-APAR-007).
- **Catálogos exactos (SSOT):** 27 acentos, 26 fondos, 9 tipografías, 3 radios,
  7 familias de iconos, 8 ambientes, 7 colores de ambiente; defaults canónicos
  `dark, mint, command, ibm-plex, square, phosphor, embers, accent`. Sin opción
  adicional, renombrada u omitida; la variante `orbit` de descripciones antiguas no
  existe y no se ofrece (R-APAR-005).
- **Separación estricta de APIs:** legacy (3 campos) y propuesta (8 ejes) no se combinan,
  no se traducen y no se migran entre sí (R-APAR-002).

## AC-OP — Preferencias legacy (tres campos, API actual existente)

| AC-ID | Método + ruta | Precondición | Acción (SCREEN · FL) | Observable (respuesta · refresco) | Fallo / vacío / denied / cancelación | DS |
|---|---|---|---|---|---|---|
| AC-OP-PRF-001 | `GET /api/me/preferences/appearance/` | Sesión viva; la ruta **no gobierna los 8 ejes** ni la apariencia visible del producto | Sin pantalla propia: cobertura como traza legacy (FL-APP-008 paso 1; `../experience/screens/appearance.md` §Trazabilidad) | Si un flujo la consulta, `{theme, palette, density}` se muestra como **configuración legacy**; `palette` y `density` no tienen eje en el DS: no se traducen, no se reinterpretan y **no aparecen como control de apariencia en ninguna pantalla**; los valores guardados de cuentas existentes no cambian por obra del cliente | `403` ⇒ no cierra sesión automáticamente: aplicar la fila 2 de AC-FL-APP-004; red ⇒ F-06 sin defaults aplicados por cuenta propia; cancelación n/a (lectura) | — (sin superficie propia) |
| AC-OP-PRF-002 | `PUT /api/me/preferences/appearance/` | Sesión viva; PUT **parcial** con choices legacy: `theme`=`nexus-light\|nexus-dark`, `palette`=`corporate-blue\|military-teal\|neutral-slate`, `density`=`comfortable\|compact` | Sin pantalla propia: traza legacy (FL-APP-008 paso 2) | `200` con el mismo objeto; la ruta no se renombra, no se redirige y no se extiende; el cliente **deja de escribir `palette`/`density` a efectos visuales**; los campos quedan intactos en el backend | Elección inválida ⇒ `400 {error}` con los literales `Theme inválido` / `Palette inválida` / `Density inválido` propagados por campo **tal cual**, sin reinterpretar (R-APAR-003); `403` ⇒ fila 2 de AC-FL-APP-004; red ⇒ F-06; cancelación n/a | — (sin superficie propia) |

## AC-FL — Ocho ejes: ruta de 8 ejes (existe, verificada 2026-10-15)

| AC-ID | Disparador / operación | Precondición | Observable esperado (ruta existente; ejecutable bajo el plan de cierre) | Fallo / distinciones | DS |
|---|---|---|---|---|---|
| AC-FL-APP-001 | `GET` ruta de 8 ejes §5.3 (FL-APP-001) — restauración antes de `ready` | Login nuevo o recarga con sesión viva; ruta **existente y consumida** (verificado 2026-10-15): criterio ejecutable bajo el plan de cierre | Las preferencias del usuario se resuelven **antes** de quedar `ready` y los ocho atributos `data-*` se aplican a `<html>` **antes del primer pintado** de la superficie autenticada: la primera pantalla ya muestra los ejes del usuario, sin parpadeo desde defaults y **sin pintar nunca la apariencia de otro usuario**; la ruta no exige `X-Tenant-Code` y responde igual en cualquier tenant del usuario; valores ausentes ⇒ defaults canónicos del objeto devuelto | Error de lectura ⇒ estado local intacto y ST-04: **nunca** se interpreta como «guardar los defaults»; `403` ⇒ AC-FL-APP-004 (no cierra sesión); red ⇒ F-06 sin defaults aplicados por cuenta propia | Panel DS `index.html:478–530`; `theme-customizer.css` |
| AC-FL-APP-002 | `PUT` ruta de 8 ejes §5.3 (FL-APP-002) — cambio de eje: preview y autosave | Apariencia restaurada (APP-001); usuario en SCREEN-PERSONALIZER con los 8 ejes y catálogos completos | Selección ⇒ el atributo `data-*` se escribe **en el acto** (preview sin esperar al backend) con la semántica exacta de la fuente: `bg=neutral`, `font=play`, `radius=soft`, `iconfam=default`, `ambcolor=accent` **eliminan** el atributo; `data-accent` y `data-ambient` se escriben siempre; el toggle de `theme` queda fuera de `apply()` y usa icono de la familia activa; los 10 tokens de radio no se alteran; autosave diferido con `PUT` de **los 8 campos exactos, ninguno nulo** (no acepta campos de más) ⇒ `200` con el objeto canónico persistido; `saveState` visible `dirty`(ST-09)→`saving`(ST-05)→`saved`(ST-06); debounce con **una sola petición en vuelo por principal**: selección nueva durante el vuelo **sustituye** la instantánea pendiente; `PUT`/`DELETE` nunca fuera de orden entre sí; `saved` sólo si la respuesta pertenece a la generación/instantánea vigente; cambiar rápido varios ejes no produce errores ni desincroniza el panel | Efectos por eje observables: `iconfam` remapea los 44 conceptos del DS + la colección propia del producto, idempotente en cualquier dirección y sin iconos rotos; `font` carga la URL original del DS bajo demanda sin duplicar `<link>`; `fa7-solid` conserva su atribución de licencia tal como la incluye el DS; `theme` anuncia el cambio (evento `darkone:themechange`) para que los gráficos re-resuelvan paleta; `400` ⇒ AC-FL-APP-004; red ⇒ `saveState=error`: el eje elegido **queda aplicado en memoria** y la cola conserva la última instantánea para reintento explícito (F-10); cambio de principal en vuelo ⇒ F-07/APP-005; cancelar n/a (autosave, sin modal dirty) | Panel DS `index.html:478–530` + `buildExtendedUI()` (`theme-customizer.js:724–856`); `forms-validation.html` para el error por campo |
| AC-FL-APP-003 | `DELETE` ruta de 8 ejes §5.3 (FL-APP-003) — reset a defaults | Usuario autenticado en SCREEN-PERSONALIZER | Botón «Reset to defaults» ⇒ `204` sin cuerpo: los ocho ejes vuelven a los defaults canónicos (`dark, mint, command, ibm-plex, square, phosphor, embers, accent`) en **una sola escritura idempotente** (ejecutarlo dos veces produce el mismo estado), sin borrar usuario ni sesión; la UI re-aplica los atributos con la semántica de presencia/ausencia; `saveState`→ST-06; una recarga posterior (APP-001) devuelve **los mismos defaults persistidos** | `403`/red ⇒ AC-FL-APP-004: sin reset local persistido de facto; el estado vuelve al último valor confirmado; `PUT`/`DELETE` en cola con orden garantizado | Botón reset del panel DS (`theme-customizer.js:347`, `index.html:529`) |
| AC-FL-APP-004 | Errores de la ruta de 8 ejes §5.3 (FL-APP-004) — reactivo | `PUT` responde `400`; o `GET`/`PUT`/`DELETE` responde `403`; o fallo de red en `GET`; o respuesta tardía | `400` ⇒ el error se muestra **por campo tal como lo devuelve el backend** (`{ "ds_accent": ["…"] }`; `non_field_errors` para conjunto incompleto o campos extra) anclado al eje correspondiente; `saveState=error`; los valores en memoria **no se revierten por iniciativa propia**; un valor fuera del catálogo se rechaza sin dejar el panel en estado inconsistente. `403` ⇒ la API no expone `401`: diferenciar «sesión/CSRF inválido» de «sin permiso» por contexto y **no cerrar sesión automáticamente**: consultar OP-AUT-002 y actuar según AC-FL-SES-006 sólo si el contexto confirma sesión perdida. Red en `GET` ⇒ estado local intacto + ST-04, nunca «guardar los defaults». Respuesta tardía ⇒ ST-08: no puede marcar `saved` sobre una instantánea ya sustituida | El panel muestra el estado de guardado real en todo caso: ningún error se traduce a defaults, a éxito ni a cierre de sesión indebido | `ui-alerts.html`, `forms-validation.html`; indicador `saveState` del panel DS |

## AC-FL — Reactivos sin petición propia (ejecutables con la implementación del cliente)

| AC-ID | Disparador | Precondición | Observable esperado | Fallo / distinciones | DS |
|---|---|---|---|---|---|
| AC-FL-APP-005 | Logout (FL-SES-005) o cambio de principal (FL-APP-005) — sin OP | Sesión viva con apariencia aplicada y (si existe) cola de autosave pendiente | Al cerrar sesión o dar sesión a otro principal: **abortar** las escrituras de apariencia en vuelo, **descartar** respuestas tardías (ST-08), **vaciar** la cola pendiente y **restablecer** los defaults de cliente; cerrar sesión y volver a entrar **no muestra la apariencia del usuario anterior**; el nuevo principal restaura sus propias preferencias vía APP-001 antes de `ready`: ninguna preferencia cruza entre usuarios | Si una respuesta tardía llega tras la purga, se ignora (ST-08 no es reparable por UI); la purga ocurre incluso si la petición de logout falla por red | `auth-signin.html` (login con defaults) |
| AC-FL-APP-006 | `select-unit` exitoso (FL-SES-004/FL-APP-006) — sin OP propia | Usuario con varias unidades que cambia de unidad activa | Las preferencias de apariencia **se conservan**: los ocho atributos de `<html>` no cambian tras el cambio de unidad; no se vacía la cola de autosave, no se re-aplican defaults ni se re-lee el backend por causa del cambio; el resto de los datos **sí** se recarga desde el nuevo contexto (F-08) | Cambio de unidad concurrente en vuelo ⇒ la respuesta vieja se descarta (ST-08) sin repintar datos de la unidad anterior; la apariencia no se ve afectada por el anti-carrera | Shell `index.html` (topbar) |
| AC-FL-APP-007 | Superficie pública o ajuste antes de sesión (FL-APP-007) — sin OP | Usuario público en login, recuperación o 404; o ajuste de apariencia antes de autenticar | Las superficies públicas se pintan con los **defaults canónicos** del DS; **ninguna petición de preferencias sale sin sesión** y nada se persiste para un usuario desconocido; un ajuste antes de sesión aplica el default canónico en memoria y no se persiste: sin `localStorage`, sin hash, sin clave manual | Tras autenticar, la apariencia del usuario resuelve vía APP-001 (ruta existente, verificada 2026-10-15); la sesión no simula persistencia | `auth-signin.html`, `auth-password.html`, `pages-404.html`; panel DS para el ajuste |

---

## Requisito de cierre — persistencia de los ocho ejes

> 🕯️ **La persistencia por usuario de los ocho ejes es requisito de cierre del frontend
> entero.** La ruta existe y la persistencia por usuario está ejecutada (ocho campos `ds_*`
> en `apipoligono/models.py:152-159`, migración `0021_design_system_preferences` y rutas
> `apipoligono/urls.py:85-86`; verificado 2026-10-15), y la cadena FL-APP-001…004 es
> ejecutable bajo el plan de cierre (R-APAR-001): el frontend integral **no puede declararse
> completo sin ella**, ni parchearse con almacenamiento local ni con los campos legacy
> (insuficientes para los 8 ejes). El alcance backend ejecutado es el permitido por
> R-APAR-004 (ocho campos `ds_*`, una migración
> `AddField`+`AddConstraint`, `GET`/`PUT`/`DELETE` en paridad con la autenticación
> heredada — nada más). Criterio pendiente: la comprobación M-U de
> AC-FL-APP-001…004 sigue **NO EJECUTADA**, y no se
> suple con ninguna verificación sustituta.

## D-02 — Capacidades sin endpoint (reservado, fuera del alcance actual)

D-02 permanece abierta y **no bloqueante** (`../experience/screens.md` §Huecos). Las
capacidades siguientes no tienen endpoint y este conjunto de aceptación las trata como
**criterio reservado de ausencia**: la comprobación observable es que **no existe**
botón, menú, pantalla ni flujo que las simule (R-DOM-EXC-014).

| Capacidad sin endpoint | Criterio reservado (observable de ausencia) |
|---|---|
| Transferencia de stock entre armerías | Ningún botón ni flujo la simula con operaciones de consumo o de arma (AC-OP-WPN-006, AC-OP-CAR-* no la prometen) |
| Exportación en servidor (CSV/PDF/XLSX) | Ningún botón «Exportar» en ninguna pantalla ni menú; `export` figura sólo en el catálogo de permisos (AC-OP-AZC-001 no lo convierte en capacidad) |
| Validación de resultados de una lección | Ninguna acción «Validar» en SCREEN-LESSON-DETAIL ni SCREEN-FRACTION-DETAIL |
| Edición de datos propios (`edit_self`) como flujo separado | Sin pantalla propia; lo cubren las operaciones contratadas existentes (AC-OP-USR-013 propio) |
| Comandantes de unidad, historial global de asignaciones, edición del catálogo de permisos | Sin menú hueco ni pantalla; el catálogo de permisos es de sólo lectura (AC-OP-PRM-001/002) |
| Signup (registro de usuarios por cuenta propia) | SCREEN-LOGIN no ofrece enlace de registro aunque el DS tenga `auth-signup.html`: la página no se usa (sin capacidad backend) |

---

> 🕯️ Ninguna fila está verificada. Los criterios de este volumen sobre la ruta de 8 ejes
> son **observables por ejecución** bajo el plan de cierre; los reactivos (APP-005/006/007)
> se comprueban contra el cliente real, con autorización de navegador y servidor
> ([`../verification.md`](../verification.md), «Requisito de autorización»).
