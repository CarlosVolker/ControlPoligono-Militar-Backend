---
spec_meta: "../spec-meta.yaml"
---

# Requisitos de frontend — Apariencia (8 ejes del Design System)

> 📖 Yo registro aquí los requisitos globales de apariencia (`R-APAR-*`): el
> personalizador completo de ocho ejes, sus catálogos y defaults **referenciados** a su
> SSOT, la semántica de aplicación de atributos, el ciclo de carga/autosave/reset/error,
> el comportamiento ante cambio de usuario, cambio de unidad y modo público, y la
> separación estricta entre la **API legacy actual** y la **API futura propuesta**. Este
> tomo operacionaliza [requirements.md](../requirements.md) §3.3 y §6 (R-PREF-*,
> R-APP-01…13) y [technical-design.md](../technical-design.md) §5–§6 sin sustituirlos.
> La autoridad de catálogos es
> [customizer-catalog.md](../design-system/customizer-catalog.md), tomado a su vez del DS
> externo; los estados `ST-*` vienen de [../experience/states.md](../experience/states.md)
> y los flujos de [../experience/flows/appearance.md](../experience/flows/appearance.md).

## Índice

1. [Estado de las dos APIs](#estado-de-las-dos-apis)
2. [Ejes, catálogos y defaults](#ejes-catálogos-y-defaults)
3. [Aplicación de atributos](#aplicación-de-atributos)
4. [Carga, autosave, reset y error](#carga-autosave-reset-y-error)
5. [Ciclo de vida: usuario, unidad y modo público](#ciclo-de-vida-usuario-unidad-y-modo-público)
6. [Panel, accesibilidad y recursos del DS](#panel-accesibilidad-y-recursos-del-ds)
7. [Prohibiciones](#prohibiciones)
8. [Trazabilidad](#trazabilidad)

---

## Estado de las dos APIs

> 🕯️ Regla de este tomo: **no afirmar capacidad futura como presente.** Las dos rutas se
> documentan separadas y ninguna se mezcla con la otra.

| API | Estado | Evidencia |
|---|---|---|
| `GET\|PUT /api/me/preferences/appearance/` (OP-PRF-001/002) — tres campos legacy `theme`, `palette`, `density` | **Existe hoy.** Permanece intacta: no se renombra, no se redirige, no se extiende. **No gobierna la apariencia visible** del producto | [exercises-preferences.md](../contracts/exercises-preferences.md) §Preferencias legacy; `technical-design.md` §5.3 |
| `GET\|PUT\|DELETE /api/me/preferences/appearance/design-system/` — ocho ejes | **Propuesta. No existe hoy**: `apipoligono/urls.py` no la registra (`backend-inventory.md` §Límites comprobados). Será implementable sólo tras spec aprobada y gate superado, bajo la excepción acotada de `front/AGENTS.md` §Límites (modelo/campos de 8 ejes, endpoint propio del usuario autenticado y su migración — nada más) | `technical-design.md` §5.1–§5.3; `front/AGENTS.md` §Límites |

- **R-APAR-001** — El cliente SHALL tratar la ruta de ocho ejes como **propuesta**:
  ningún flujo, pantalla ni requisito de este tomo asume que responde hoy. Mientras no
  exista, la persistencia por usuario de los ocho ejes **no es ejecutable** y el hueco se
  reporta al operador; SHALL NOT parchearse con almacenamiento local ni con los campos
  legacy. *Fuente: `front/AGENTS.md` §Personalizador (hueco conocido y reportado);
  R-DOM-EXC-014.*
- **R-APAR-002** — La ruta legacy SHALL conservarse operativa y separada: el cliente
  puede seguir leyéndola (FL-APP-008) pero SHALL NOT usarla para gobernar la apariencia
  visible (R-PREF-01), SHALL NOT traducir `palette` ni `density` a ejes del DS —no tienen
  correspondencia en la fuente— y SHALL NOT migrar automáticamente valores entre ambas
  rutas. Los campos legacy quedan intactos en el backend: no se borran, no se convierten
  (*requirements.md* §6, D-01 retirada).
- **R-APAR-003** — WHEN la ruta legacy responde `400`, THEN el cliente SHALL propagar los
  mensajes literales por campo tal cual: `Theme inválido`, `Palette inválida`,
  `Density inválido`, sin reinterpretar. *Fuente: R-PREF-02; contrato legacy.*
- **R-APAR-004** — La implementación futura de la ruta propuesta SHALL limitarse a lo
  diseñado en `technical-design.md` §5 (ocho campos `ds_*` en `Usuario` con defaults
  canónicos, una migración `AddField`+`AddConstraint`, y `GET`/`PUT`/`DELETE` con
  autenticación de sesión en paridad con la heredada, sin permiso nuevo ni
  `HasTenantAccess`): este tomo SHALL NOT pedir backend features fuera de ese diseño.
  *Fuente: `technical-design.md` §5.1–§5.3; `front/AGENTS.md` §Límites.*

---

## Ejes, catálogos y defaults

- **R-APAR-005** — El personalizador SHALL exponer los **ocho** ejes completos —`theme`,
  `accent`, `bg`, `font`, `radius`, `iconfam`, `ambient`, `ambcolor`— con el catálogo y
  los defaults exactos cuya SSOT es
  [customizer-catalog.md](../design-system/customizer-catalog.md) (27 acentos, 26 fondos,
  9 tipografías, 3 radios, 7 familias de iconos, 8 ambientes, 7 colores de ambiente;
  defaults `dark, mint, command, ibm-plex, square, phosphor, embers, accent`), sin
  ninguna opción adicional, renombrada u omitida. Este tomo referencia la SSOT y no
  duplica los catálogos; la variante `orbit` de descripciones antiguas **no existe** en el
  código y SHALL NOT ofrecerse. *Fuente: R-APP-01; `technical-design.md` §6.3.*
- **R-APAR-006** — WHEN se persista contra la ruta propuesta, THEN el cliente SHALL
  enviar exactamente los ocho campos, ninguno nulo y dentro del enum de su eje, y SHALL
  recibir de vuelta el objeto canónico persistido; el `PUT` no acepta campos de más.
  *Fuente: R-APP-11; `technical-design.md` §5.3.*
- **R-APAR-007** — El cliente SHALL NOT persistir apariencia en `localStorage`,
  `sessionStorage`, cookies de estado, hash de URL ni clave manual: la persistencia del
  DS original en `localStorage` es comportamiento del mockup externo y queda sustituida
  por memoria (store Pinia `appearance`) más backend. *Fuente: R-APP-10, R-DAT-05;
  `front/AGENTS.md` §Personalizador; `customizer-catalog.md` §Persistencia.*

---

## Aplicación de atributos

- **R-APAR-008** — WHEN el usuario selecciona un valor de cualquier eje, THEN el cliente
  SHALL escribir el atributo `data-*` correspondiente en `<html>` **de inmediato** (vista
  previa sin esperar al backend) y SHALL diferir la escritura al backend con autosave.
  *Fuente: R-APP-02; `technical-design.md` §6.1 (`apply()`).*
- **R-APAR-009** — La aplicación SHALL reproducir la semántica exacta de la fuente:
  `bg=neutral`, `font=play`, `radius=soft`, `iconfam=default` y `ambcolor=accent`
  **eliminan** el atributo en lugar de escribirlo; `data-accent` y `data-ambient` se
  escriben siempre, incluso en su default; el toggle de `theme` queda fuera de `apply()`
  y se resuelve con icono de la familia activa. Tabla SSOT:
  [customizer-catalog.md](../design-system/customizer-catalog.md) §Atributos y reset.
  *Fuente: R-APP-04; `technical-design.md` §6.1 (atomicidad de `apply()`).*
- **R-APAR-010** — El cliente SHALL NOT alterar los 10 tokens de radio (`square` = `0`,
  `subtle` = `2px`, `soft` = cascada `5.6px`) y SHALL NOT reescribir radios, espaciados o
  grosores de borde para simular densidad ni introducir valores que el DS no tenga: el DS
  no tiene eje de densidad. *Fuente: R-APP-04/05; `technical-design.md` §6.3;
  `requirements.md` §6.*

---

## Carga, autosave, reset y error

- **R-APAR-011** — WHEN se restaura la sesión (login nuevo o recarga), THEN el cliente
  SHALL resolver las preferencias del usuario con el `GET` de la ruta propuesta **antes**
  de quedar `ready`, y SHALL aplicar los ocho atributos a `<html>` antes del primer
  pintado de la superficie autenticada, para no pintar la apariencia de otro usuario ni
  parpadear desde defaults. *Fuente: R-APP-07; `technical-design.md` §6.2; T-08.*
- **R-APAR-012** — El autosave SHALL operar con debounce, **una sola petición en vuelo
  por principal**, conservando sólo la última instantánea pendiente (una selección nueva
  durante un `PUT` en vuelo la sustituye, no abre escritura concurrente); `PUT` y
  `DELETE` SHALL NOT ejecutarse fuera de orden respecto de sí mismos; y la marca `saved`
  (ST-06) sólo SHALL aplicarse si la respuesta pertenece a la generación o instantánea
  vigente. *Fuente: `technical-design.md` §6.5; T-07; FL-APP-002.*
- **R-APAR-013** — WHEN el usuario pulsa reset, THEN el cliente SHALL emitir `DELETE` a
  la ruta propuesta, que devuelve los ocho ejes a sus defaults canónicos en una sola
  escritura idempotente y responde sin cuerpo, sin borrar el usuario ni la sesión; la UI
  SHALL re-aplicar los atributos con la semántica de R-APAR-009. *Fuente: R-APP-12;
  `technical-design.md` §5.3; FL-APP-003.*
- **R-APAR-014** — WHEN la ruta propuesta responde `400`, THEN el cliente SHALL mostrar
  el error por campo tal como lo devuelve el backend (`{ "ds_accent": ["…"] }`,
  `non_field_errors` para conjunto incompleto o campos extra) anclándolo al eje. WHEN
  responde `403`, THEN SHALL diferenciar «sesión o CSRF inválido» de «sin permiso» por
  contexto y SHALL NOT cerrar sesión automáticamente ante un `403` de preferencias.
  *Fuente: R-APP-13; `technical-design.md` §5.3; T-09; FL-APP-004.*
- **R-APAR-015** — WHEN la lectura de preferencias falla por red, THEN el estado local
  SHALL quedar intacto y la UI en estado de error (ST-04); un error de lectura SHALL NOT
  interpretarse como «guardar los defaults». *Fuente: `technical-design.md` §6.5;
  FL-APP-004.*
- **R-APAR-016** — El panel SHALL hacer visible el estado de guardado
  (`saveState ∈ {idle, dirty, saving, saved, error}` del store `appearance`), mapeado a
  ST-00/09/05/06/04 según [../experience/states.md](../experience/states.md); ese estado
  es la fuente de verdad del rótulo, no el optimismo local. *Fuente:
  `technical-design.md` §9; R-APP-03.*

---

## Ciclo de vida: usuario, unidad y modo público

- **R-APAR-017** — WHEN el usuario cierra sesión o cambia de principal, THEN el cliente
  SHALL abortar las escrituras en vuelo, descartar las respuestas tardías (ST-08), vaciar
  la cola pendiente y restablecer los defaults de cliente; el nuevo principal SHALL
  restaurar sus propias preferencias vía R-APAR-011 antes de `ready`. Ninguna
  preferencia cruza entre usuarios. *Fuente: R-APP-06; `technical-design.md` §6.5; T-08;
  FL-APP-005.*
- **R-APAR-018** — WHEN el usuario cambia de unidad activa, THEN las preferencias SHALL
  conservarse: la pertenencia sigue siendo el mismo usuario; no se vacía la cola de
  autosave ni se re-aplican defaults por causa del cambio. *Fuente: R-APP-06;
  FL-APP-006.*
- **R-APAR-019** — WHEN la superficie es pública (login, recuperación, 404) o el usuario
  ajusta apariencia antes de tener sesión, THEN el cliente SHALL aplicar los defaults
  canónicos del DS y SHALL NOT consultar ni persistir nada para un usuario desconocido.
  *Fuente: R-PREF-03, R-APP-07; FL-APP-007.*

---

## Panel, accesibilidad y recursos del DS

- **R-APAR-020** — El panel SHALL ofrecer, por eje, los mismos selectores, muestra o
  miniatura y affordances del panel original del DS: botón de reset, toggle de tema,
  operación por teclado (flechas, `Home`, `End`, tabindex rotatorio), radiogroups con
  `aria-checked`, panel no modal cerrable con Escape y estado de guardado visible; los
  grupos extendidos los inyecta el propio DS vía `buildExtendedUI()`. *Fuente: R-APP-03;
  `technical-design.md` §6.1; `visual-contract.md` §Estados y accesibilidad.*
- **R-APAR-021** — WHEN la familia de iconos cambia, THEN SHALL remapearse la colección
  propia del producto junto a los 44 conceptos del DS de forma idempotente en cualquier
  dirección, sin inventar variantes ni sustituir ninguna familia del DS. *Fuente:
  R-APP-08; `technical-design.md` §6.4.*
- **R-APAR-022** — WHEN el usuario elige una tipografía, THEN SHALL cargarse bajo demanda
  la URL original del DS para esa familia, sin duplicar el `<link>`; WHEN elige
  `fa7-solid`, THEN el panel SHALL conservar la atribución de licencia tal como la
  incluye el DS, sin reformularla. *Fuente: R-APP-09; `technical-design.md` §6.1, §6.4.*
- **R-APAR-023** — WHEN el tema cambia, THEN el cliente SHALL anunciar el cambio para
  que los gráficos re-resuelvan su paleta (evento `darkone:themechange` de la fuente),
  reproduciendo el comportamiento del DS. *Fuente: `technical-design.md` §6.1.*

---

## Prohibiciones

1. **Sin datos ni opciones falsas:** ninguna opción del panel puede existir fuera del
   catálogo SSOT; ningún default puede provenir de otra fuente que
   [customizer-catalog.md](../design-system/customizer-catalog.md) (R-APAR-005).
2. **Sin persistencia de navegador** para apariencia: prohibidas `localStorage`,
   `sessionStorage`, cookies de estado, hash de URL y claves manuales (R-APAR-007,
   R-DAT-05).
3. **Sin mezcla de APIs:** legacy y propuesta no se combinan, no se traducen y no se
   migran entre sí (R-APAR-002).
4. **Sin capacidad futura afirmada como presente:** ningún requisito de este tomo declara
   que la ruta de ocho ejes exista ni funcione hoy (R-APAR-001).
5. **Sin densidad inventada:** no se reescriben radios, espaciados ni bordes fuera de los
   tres valores de radio del DS (R-APAR-010).
6. **Sin signup ni exportación simulados:** el personalizador no incorpora capacidades
   ajenas; las capacidades sin endpoint del inventario siguen sin flujo
   (`requirements.md` §8).

---

## Trazabilidad

| R-APAR | Padre canónico |
|---|---|
| R-APAR-001…004 | `front/AGENTS.md` §Personalizador y §Límites; R-PREF-01/02; D-01 retirada; `technical-design.md` §5 |
| R-APAR-005…007 | R-APP-01, R-APP-10/11, R-DAT-05 |
| R-APAR-008…010 | R-APP-02/04/05 |
| R-APAR-011…016 | R-APP-03/07/12/13; `technical-design.md` §6.2, §6.5, §9; T-07/08/09 |
| R-APAR-017…019 | R-APP-06/07, R-PREF-03 |
| R-APAR-020…023 | R-APP-03/08/09; `technical-design.md` §6.1, §6.4 |

> La spec está **`approved`** desde el 2026-10-02 ([spec-meta.yaml](../spec-meta.yaml)): ni la
> aprobación ni este tomo pasan gates (`verified_at: null`, ningún gate en `passed`) ni
> autorizan implementación por sí solos; la excepción acotada del backend de apariencia **ya
> se ejecutó** (verificado 2026-10-15; `front/AGENTS.md` §Límites).
