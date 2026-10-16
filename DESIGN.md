---
name: PoligonoTiro
description: Sistema visual del puesto de mando — instrumentos precisos, jerarquía visible, cero ornamento.
colors:
  primary: "#7e67fe"
  violeta-de-mando-hondo: "color-mix(in srgb, #7e67fe 84%, #000)"
  violeta-de-mando-tenue: "rgba(126, 103, 254, .15)"
  menta-de-guarnicion: "#5bc9b5"
  grafito-de-guardia: "#191e23"
  pizarra-de-puesto: "#1d2329"
  pizarra-de-instrumento: "#232a31"
  grafito-de-relevo: "#2a3139"
  filete-de-guardia: "#272f37"
  filete-de-junta: "#2e3741"
  gris-de-registro: "#8391a2"
  acero-de-lectura: "#aab8c5"
  acero-de-menu: "#afb9cf"
  verde-de-verificacion: "#68ce7d"
  rojo-de-bloqueo: "#d75341"
  ambar-de-pendiente: "#e7985f"
  azul-de-parte: "#45afeb"
  tinte-verde-de-verificacion: "rgba(104, 206, 125, .15)"
  tinte-rojo-de-bloqueo: "rgba(215, 83, 65, .15)"
  tinte-ambar-de-pendiente: "rgba(231, 152, 95, .15)"
  tinte-azul-de-parte: "rgba(69, 175, 235, .15)"
  tinta-sobre-primario: "#fff"
  tinta-sobre-exito: "#012209"
  tinta-sobre-bloqueo: "#180000"
  tinta-sobre-pendiente: "#2f1100"
  tinta-sobre-parte: "#000a1e"
typography:
  display:
    fontFamily: '"Play", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "60px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: '"Play", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: '"Play", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: '"Play", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: '"Play", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: ".55px"
  data:
    fontFamily: '"Play", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontFeature: "tabular-nums"
rounded:
  card: "5.6px"
  md: "6px"
  sm: "4px"
  lg: "8px"
  search: "20px"
  pill: "999px"
  square: "0px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "24": "24px"
  "36": "36px"
  "72": "72px"
components:
  button-base:
    textColor: "{colors.acero-de-lectura}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "8px 24px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.tinta-sobre-primario}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "8px 24px"
  button-primary-hover:
    backgroundColor: "{colors.violeta-de-mando-hondo}"
  card:
    backgroundColor: "{colors.pizarra-de-puesto}"
    textColor: "{colors.acero-de-lectura}"
    rounded: "{rounded.card}"
    padding: "24px"
  stat-card:
    backgroundColor: "{colors.pizarra-de-puesto}"
    textColor: "{colors.acero-de-lectura}"
    rounded: "{rounded.card}"
    padding: "20px 24px"
  input:
    backgroundColor: "{colors.pizarra-de-puesto}"
    textColor: "{colors.acero-de-lectura}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "8px 24px"
    height: "39px"
  select:
    backgroundColor: "{colors.pizarra-de-puesto}"
    textColor: "{colors.acero-de-lectura}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "8px 72px 8px 24px"
  nav-link:
    textColor: "{colors.acero-de-menu}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 15px"
  badge-sm:
    backgroundColor: "{colors.verde-de-verificacion}"
    textColor: "{colors.tinta-sobre-exito}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  alert-info:
    backgroundColor: "{colors.tinte-azul-de-parte}"
    textColor: "{colors.azul-de-parte}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  modal-content:
    backgroundColor: "{colors.pizarra-de-puesto}"
    textColor: "{colors.acero-de-lectura}"
    rounded: "{rounded.lg}"
    padding: "24px"
    width: "500px"
---

# Design System: PoligonoTiro

## Overview

**Creative North Star: "El Puesto de Mando"**

El puesto de mando es una sala de operaciones: instrumentos precisos sobre una mesa de trabajo, jerarquía visible de un vistazo y cero ornamento. Nada en pantalla existe para decorar. Cada filete de 1px, cada cifra y cada sombra ocupan el lugar que les asigna su función, y el usuario puede nombrar esa función sin dudar. El sistema es **dark-first**: el tema oscuro es el estado primario del instrumento y el claro es un modo complementario, no el estado «seguro» ni la vista previa de demo.

La densidad sigue la voz de un manual de operaciones bien editado: directa, sin adornos de marketing. El cuerpo es de 14px y el ritmo de bloque es de 24px; la jerarquía se construye con tamaño y peso, casi nunca con color. Los cuatro conteos del resumen, la tabla de lecciones y la proporción de aciertos son el centro de la pantalla, porque el trabajo diario es registrar y leer datos, no navegar. Cuando un dato no existe, la interfaz muestra `—`: nunca un `0` falso, nunca un valor inventado que simule una funcionalidad ausente.

La personalidad —institucional, precisa, confiable— se sostiene en tres gestos: el acento es escaso y funcional, la profundidad se resuelve con filetes antes que con sombras, y ninguna superficie imita una app de consumo. Quedan confirmados como rechazo dos mundos completos: la gamificación consumer (confeti, rachas, ilustraciones amigables, tono de app de fitness) y el cosplay táctico exagerado (calaveras decorativas, camuflaje ornamental, neón hacker y cualquier parafernalia que reste seriedad institucional).

> 📖 **Procedencia del SSOT.** Este documento es el contrato visual del producto; los valores canónicos —tablas por acento, ejes completos del customizer, familias de iconos y gaps conocidos— viven en la biblioteca externa [`../../Inume Design System/DESIGN.md`](../../Inume%20Design%20System/DESIGN.md), como directorio hermano del repositorio. Esa biblioteca es un kit HTML/CSS/JS de referencia: **no** es un paquete ni una dependencia importable, y la vinculación es **documental** —no se instala, no se importa y no altera el producto—. La carpeta interna homónima que existe en el repositorio **no** es la fuente de este proyecto. Los enlaces son relativos al layout actual del disco: un checkout aislado no los resuelve.

**Key Characteristics:**
- Dark-first con alternancia por el atributo `data-theme` en `<html>` (`dark` / `light`); los acentos y semánticos sólidos se conservan en ambos temas y el claro solo reescribe neutros y texto.
- Una sola familia sans activa por vez: **Play** de forma estática por defecto; el eje `font` ofrece nueve familias, todas con la misma curva de pesos 400–700.
- Superficies planas en reposo: la profundidad llega por filetes de 1px y por el **borde doble de 3px** de la card; la sombra se reserva a lo que flota de verdad.
- Cifras en `tabular-nums`: los números del registro no se mueven entre filas ni al actualizarse.
- Densidad de instrumento: cuerpo de 14px, ritmo de 24px, sidebar de 250px/75px y topbar de 70px.
- Ocho ejes de personalización por usuario —`theme`, `accent`, `bg`, `font`, `radius`, `iconfam`, `ambient`, `ambcolor`—, persistidos contra la API del backend y nunca en el navegador.

## Colors

Paleta de instrumento sobre grafito: un acento violeta normativo, un cuarteto semántico de verificación/bloqueo/pendiente/parte con su contrato de tintas, y neutros fríos de sala de operaciones, sin un solo color decorativo.

### Primary

- **Violeta de Mando** (#7e67fe): el acento normativo del `:root`, activo en el estado por defecto del instrumento. Pinta el estado activo de la navegación, los badges, el anillo de foco (`0 0 0 2px var(--surface), 0 0 0 4px rgba(var(--primary-rgb), 1)`), la barra de progreso, la fila seleccionada de tabla (`--primary-soft`) y la selección de texto (`::selection`). Su rareza es deliberada: marca lo que está vivo, no decora.
- **Menta de Guarnición** (#5bc9b5): el **default lógico del producto**, declarado `isDefault` en el eje `accent` del personalizador. Es el mismo rol que el violeta —el acento vivo— con otro matiz, y por eso comparte su anatomía y su tinta.
- **Tinta sobre primario** (#fff): la tinta que se apoya sobre el sólido primario. Es **por acento**: el `:root` la fija en blanco y cada `data-accent` la reescribe al near-black de su propio matiz (violeta → `#0b002c`; menta → `#0a2620`), siguiendo el contrato medido del acento: el blanco solo donde supera 4.5:1 (oliva 4.54, gunmetal 5.01, wraith 4.67, sentinel 4.83) y near-black en todo el resto.

> El eje de acento es una **capa viva de 27 opciones**, de `violet` a `sonar`, seleccionables por el personalizador e implementadas como `html[data-accent="…"]` que reescriben `--primary`, `--primary-soft`, `--primary-rgb` y su tinta. Incluye familias militar, de inteligencia y de seguridad —`nvg`, `khaki`, `gunmetal`, `wraith`, `sentinel`, `sonar`— además de las voces estándar. Todas las tablas de hexes y sus ratios medidos viven en el SSOT; aquí manda una sola verdad: el acento es dato de usuario, y ninguna pantalla puede asumir cuál está activo.

### Secondary

Los cuatro semánticos de estado. Cada uno declara su tinte suave, su tinta sobre sólido y —en el tema claro— su variante de texto legible.

- **Verde de Verificación** (#68ce7d): lo verificado y el trend positivo. Tinte suave `rgba(104, 206, 125, .15)`; tinta sobre sólido **Tinta sobre Éxito** (#012209).
- **Rojo de Bloqueo** (#d75341): lo bloqueado y el error. Tinte suave `rgba(215, 83, 65, .15)`; tinta sobre sólido **Tinta sobre Bloqueo** (#180000). Cuando el rojo se usa como texto sobre su tinte, manda `--danger-text`, que en oscuro sube a `#ea7b69` y en claro baja a `#b83526`.
- **Ámbar de Pendiente** (#e7985f): lo pendiente y el trend negativo. Tinte suave `rgba(231, 152, 95, .15)`; tinta sobre sólido **Tinta sobre Pendiente** (#2f1100).
- **Azul de Parte** (#45afeb): lo informativo y la nota de estado. Tinte suave `rgba(69, 175, 235, .15)`; tinta sobre sólido **Tinta sobre Parte** (#000a1e).

### Neutral

- **Grafito de Guardia** (#191e23): fondo de página. El plano de la mesa.
- **Pizarra de Puesto** (#1d2329): sidebar, topbar, cards y desplegables. La superficie de trabajo.
- **Pizarra de Instrumento** (#232a31): la capa elevada por encima de la pizarra —inputs, tab-group, el botón de usuario—. Un escalón tonal, no una sombra.
- **Grafito de Relevo** (#2a3139): estado `hover` de ítems de menú, iconos, filas y desplegables. El «relevo» de un control que el puntero toca.
- **Filete de Guardia** (#272f37): bordes de 1px y separadores. Es el instrumento de profundidad más usado del sistema.
- **Filete de Junta** (#2e3741): segundo filete, más claro, para el borde del control de salto (`skip-link`) y las juntas que deben leerse sobre un borde ya existente.
- **Gris de Registro** (#8391a2): texto secundario —labels, subtítulos, breadcrumb, metadatos de sección, texto de relleno—.
- **Acero de Lectura** (#aab8c5): texto base de cuerpo, celdas de tabla y encabezados. `--heading` comparte este valor: en este sistema, títulos y cuerpo se distinguen por peso y tamaño, no por color.
- **Acero de Menú** (#afb9cf): el acero de los rótulos de navegación, el pie del shell, los botones de icono y los enlaces de tabla. Un escalón más claro que el texto base, propio de la periferia.

El tema claro no inventa paleta: sobrescribe solo los neutros y el texto —fondo `#f4f6f8`, superficie `#ffffff`, texto `#2d3742`, muted `#5b6776`— y conserva intactos los acentos y los semánticos sólidos. La capa de fondos del personalizador añade **26 opciones de fondo** (25 tintes con nombre más el neutral por ausencia de atributo), entre ellas cinco negros profundos (`blackout`, `carbon`, `obsidian`, `bunker`, `trench`) y siete bases tomadas del preset shadcn (`pure`, `stone`, `zinc`, `mauve`, `sage`, `mist`, `taupe`), transliteradas con sus tokens OKLCH y renombradas.

**La Regla del Contrato de Tintas.** Ningún semántico se usa sin su tinta. Sobre el sólido, manda `--on-*` (near-black del mismo matiz, ≥5.0:1); como texto sobre el tinte suave, manda `--*-text` (≥4.5:1, reescrito a same-hue oscurecido en el tema claro). Un semántico con la tinta equivocada no es un matiz distinto: es un control ilegible.

**La Regla del Hex Prohibido.** Todo color nuevo sale de los tokens `--*`; ningún componente nuevo escribe un hex propio. El CSS conserva hoy un puñado de literales legítimos —las capas portadas del DS (familias `--bui-*`, `--tbl-*`, `--buf-*`), el acero de menú `#afb9cf`, el blanco de la tinta y el rojo del botón de error— y se consumen donde están, sin propagarse a componentes nuevos.

## Typography

**Display Font:** Play (con system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)
**Body Font:** Play — la misma familia; el sistema usa una sola sans activa por vez
**Label/Mono Font:** Geist Mono (solo `code`, `pre`, `kbd` y `samp`)

**Character:** Una sola familia sans sostiene todo el registro, con caras reales de 400 y 700 y `font-synthesis-weight: none`: los pesos intermedios hacen snap a cara real en lugar de simularse, así que la jerarquía se lee en el peso declarado y no en un bold falso. El eje `font` permite cambiar de familia entre nueve opciones —Play, Titillium Web, Exo 2, Rajdhani, IBM Plex Sans, Inter, Manrope, Public Sans y Geist—, todas con la misma curva 400–700, de modo que ninguna pantalla depende de una familia concreta para sostener su jerarquía. Los tamaños son fijos, sin `clamp`.

### Hierarchy

- **Display** (700, 60px, 1.1): reservado a la cifra de error de las páginas de estado (`404`), donde el número es el mensaje. No se usa como titular de página.
- **Headline** (700, 24px, 1.2): el encabezado de sección de mayor rango (`h3`), por encima de cualquier card.
- **Title** (600, 18px, 1.5): títulos de página (`page-title`) y títulos de card. Es el rango que ordena el trabajo diario.
- **Body** (400, 14px, 1.5): cuerpo, celdas, labels de campo, ítems de menú. Es el tamaño con el que se captura.
- **Label** (600, 11px, `.55px`, mayúsculas): rótulos de grupo del sidebar, eyebrows y badges. Se lee como etiqueta, nunca como frase.
- **Data** (400, 13.5px, `tabular-nums`): cifras de tabla y conteos, con los dígitos fijados a ancho constante. Los valores KPI suben a 24px/600 y las cifras de estado a 16px/600, siempre con el mismo vocabulario numérico.

**La Regla de los Números Fijos.** Todo componente numérico —KPI, celda de tabla, badge, paginación, contador de aciertos— declara `font-variant-numeric: tabular-nums`. Es un contrato declarativo, no un detalle tipográfico: garantiza que las cifras de dos filas se lean en columna aunque la familia activa traiga dígitos proporcionales.

**La Regla de la Cara Real.** Un peso que la familia no entrega como cara real no se simula. `font-synthesis-weight: none` es una decisión de sistema, no un reset: cualquier familia nueva del eje `font` debe traer sus caras 400–700 o la jerarquía no se sostiene.

## Layout

El shell se compone de tres regiones, y solo una se mueve.

- **Sidebar**: `position: fixed`; 250px expandido y 75px colapsado (`--sidebar-w` / `--sidebar-collapsed-w`), fondo `--surface`, filete derecho de 1px, `z-index: 60`. Aloja la marca en la altura de la topbar, el `nav` con scroll propio y, anclado al fondo por `margin-top: auto`, el control de colapso —única salida del modo achicado, jamás oculto—.
- **Topbar**: `position: fixed`, 70px de alto (`--topbar-h`), anclada al sidebar por `left`, filete inferior de 1px, `z-index: 50`. Contiene el bloque de contexto en dos columnas y las acciones a la derecha.
- **Contenido**: `.dashboard-frame` carga el offset horizontal (`margin-left`) y `.page-content` el vertical (`padding: 24px 12px 60px`, con `padding-top` = topbar + 14px). El offset vive en el frame, no en el contenido, por la estructura del shell.

El ritmo de bloque es de **24px** —separación entre cards, secciones y rejillas— con **16px** dentro de los grupos y **18px 24px** en la cabecera de card. La densidad es de instrumento: la rejilla de métricas es de cuatro columnas y la fila de detalles de la lección activa de cinco, ambas colapsando por breakpoints antes que por scroll horizontal. La tabla siempre vive dentro de un contenedor con scroll (`overflow-x: auto`), nunca empuja el layout.

En **móvil (≤767px)** el sidebar es un drawer off-canvas que se desliza con `transform: translateX(-100%)` sobre un backdrop negro al 50%; la topbar pasa a ancho completo, la hamburguesa vuelve a mostrarse y los objetivos táctiles suben a 44px, con los campos de formulario a 16px para evitar el zoom automático de iOS. En **4K (≥3200px × 1600px)** no se usa `transform: scale` sino `zoom: 2` sobre el `body`, precisamente para preservar el comportamiento de `position: fixed` contra el viewport.

**La Regla del Puesto Fijo.** Los instrumentos no se desplazan: sidebar y topbar son fijos y solo el contenido scrollea. Ningún patrón nuevo puede introducir una barra o un panel que empuje al shell fuera del viewport en lugar de flotar sobre él.

## Elevation & Depth

El sistema es **plano en reposo** y construye profundidad con tres recursos ordenados por frecuencia: el filete de 1px (`--border`), el escalón tonal (`--surface-2` sobre `--surface` sobre `--bg`) y, solo cuando algo se despega del plano, la sombra. No hay sombras ambientales decorativas: una card en reposo se apoya en su borde doble y en un filete de 1px, no en un halo.

### Shadow Vocabulary

- **Filete bajo la card** (`box-shadow: 0 1px 0 rgba(0, 0, 0, .2)`): el subrayado de la superficie de trabajo, apenas un apoyo. En tema claro se sustituye por `0 1px 2px rgba(0, 0, 0, .04)`.
- **Card portada del DS** (`box-shadow: 0 3px 4px 0 rgba(0, 0, 0, .03)`): el peso de la card heredada de la capa `--bui-*`; misma función, casi invisible.
- **Capa pop** (`box-shadow: 0 14px 30px rgba(0, 0, 0, .45), 0 0 0 1px rgba(255, 255, 255, .02)`): desplegables, panel del personalizador, la modal y el `skip-link`. Una sola sombra para todo lo que flota por encima de la pizarra, con su filete interior de 1px.
- **Card de autenticación** (`box-shadow: 0 5px 10px rgba(30, 32, 37, .12)`): la única superficie con sombra propia, porque la pantalla de acceso es la única que no vive sobre el shell.
- **Card de error** (`box-shadow: 0 3px 4px rgba(0, 0, 0, .03)`): el mismo apoyo tenue en las páginas de estado.
- **Botón flotante del personalizador** (`0 6px 18px rgba(0,0,0,.35), 0 0 0 1px color-mix(in srgb, var(--primary) 12%, transparent), 0 0 14px color-mix(in srgb, var(--primary) 22%, transparent)`): la excepción declarada del sistema, un halo del acento vivo que solo existe en este control de personalización.

**La Regla de la Sombra para lo que Flota.** Las superficies en reposo son planas. La sombra es la respuesta a «esto está por encima del plano» —desplegable, modal, panel, aviso de salto— no un adorno del reposo. Si un elemento necesita parecer importante sin flotar, se le sube el filete o el escalón tonal, no la sombra.

## Shapes

El vocabulario de forma es sobrio y de radio corto. La cascada base usa `--card-radius: 5.6px` para cards, campos y controles medianos, `--r-md: 6px` para ítems de navegación y desplegables, `--r-sm: 4px` para badges y controles pequeños, `--r-pill: 999px` para lo que es círculo o píldora —avatares, botones de icono, la píldora de progreso—, `--r-search: 20px` para el campo de búsqueda y `--bui-radius-lg: 8px` para el contenido de la modal y los botones grandes. El eje `radius` ofrece tres presets: `soft` (el de la cascada, por ausencia de atributo), `subtle` (2px) y `square` (0px), que es el **default lógico del producto** y anula de una vez card, pill, md, sm y search.

La firma formal del sistema no es el radio: es el **borde doble de 3px** de la card (`border: 3px double var(--border)`), la única superficie que se dibuja con dos filetes. El panel del personalizador hereda gesto con un filete doble de 3px en su borde izquierdo. Todo lo demás —separadores, cabeceras, celdas— usa el filete simple de 1px, y los campos sustituyen el borde por un trazo de 1px en `--input-border` que en el tema oscuro se reescribe a `#3a4551`.

Las formas recurrentes son geométricas y contenidas: el círculo para avatares y botones de icono, el cuadrado de esquina corta para el KPI y los badges, y ninguna forma decorativa. No hay clipping con `clip-path` salvo el rectángulo recortado del `skip-link` cuando está oculto, ni degradados: el sistema no usa gradientes en superficies.

**La Regla del Filete Doble.** El borde doble de 3px pertenece a la card. Es su firma y no se traslada a otras superficies: una segunda superficie con borde doble deja de distinguir la unidad de trabajo. Los grupos y secciones se separan con filete de 1px o con aire.

## Components

### Buttons

- **Shape:** radio de card (5.6px), borde de 1px transparente por defecto. Existente en tres tamaños: base `8px 24px`, grande `10px 42px` (8px de radio) y chico `5.568px 18px` (4px de radio).
- **Primary:** fondo y borde `rgba(var(--primary-rgb), 1)`, tinta `var(--primary-ink)` (blanca en `:root`, near-black por acento). Es el único botón que usa el acento sólido.
- **Hover / Focus:** el `hover` oscurece el acento un 84% con `color-mix(in srgb, var(--primary) 84%, #000)` sobre fondo y borde. El foco es un doble anillo duro —`0 0 0 2px var(--surface), 0 0 0 4px rgba(var(--primary-rgb), 1)`— que se separa del fondo en lugar de difuminarse. La transición es de `.15s ease-in-out` sobre color, fondo, borde y sombra.
- **Active / Disabled:** al presionar, el botón baja 1px (`transform: translateY(1px)`); deshabilitado, baja a `opacity: .65` y pierde los eventos de puntero.
- **Secondary / Ghost / Tertiary:** el secundario y los `outline-*` existen como variantes heredadas del DS (`--bui-secondary-rgb`, `--bui-primary-rgb`), y el `outline-danger` usa `--danger-text` como color con borde `currentColor`. Ninguna de ellas introduce un color nuevo: todas se resuelven dentro de la paleta declarada.

### Badges

- **Style:** dos familias con propósitos distintos. El badge **soft** (`badge-soft-*`) usa el tinte del semántico al 18% sobre fondo transparente y el texto en su variante legible (`--success-text`, `--warning-text`, `--danger-text`); en el tema oscuro el soft primario sube a `#b2a4fe`. El badge **sólido chico** (`badge-success-sm`, `badge-danger-sm`) es una pastilla de `2px 8px`, 11px/700, radio `--r-sm`, con la tinta `--on-*` sobre el sólido.
- **State:** el sólido chico es el de los estados de tabla —verificado, bloqueado— y no lleva borde; el soft es el de las etiquetas de contexto y lleva borde transparente. Los badges no son interactivos: no tienen estado `hover`.

### Cards / Containers

- **Corner Style:** radio de card, 5.6px (0px con el preset `square`).
- **Background:** `--surface` sobre el fondo `--bg`; la cabecera (`card-head`) se separa con un filete inferior de 1px y conserva los radios superiores.
- **Shadow Strategy:** filete inferior `0 1px 0 rgba(0, 0, 0, .2)` (ver Elevation & Depth). La card no flota.
- **Border:** **borde doble de 3px** en `--border` —la firma del sistema—.
- **Internal Padding:** `24px` en el cuerpo, `18px 24px` en la cabecera; el KPI baja a `20px 24px` y en móvil a `14px 12px`. El modificador `no-pad` deja el cuerpo a 0 cuando la card contiene una tabla que trae su propio relleno.

### Inputs / Fields

- **Style:** trazo de 1px en `--input-border` (`#d8dfe7` en la cascada, `#3a4551` en tema oscuro), fondo `--surface`, radio de card, relleno `8px 24px` y altura mínima de 39px (`calc(1.5em + 1rem + 2px)`).
- **Focus:** el borde cambia a `--input-focus` (`#b0b0bb`, `#4a5663` en oscuro) con `outline: 0` y **sin** anillo de sombra —el foco del campo es un cambio de trazo, no un halo—. La transición es `.15s ease-in-out`.
- **Select:** mismo trazo y fondo, con chevron SVG embebido a `right 24px center` y relleno `8px 72px 8px 24px` para despejar el icono.
- **Error / Disabled:** el campo inválido pinta el trazo en `--danger`/`--buf-invalid`, añade el icono de error a la derecha y su mensaje (`.invalid-feedback`, 12.25px en `--danger-text`) queda visible por presencia en el DOM. Deshabilitado, el campo baja al fondo `--bg` y conserva `opacity: 1` —no se apaga el texto—.

### Navigation

El sidebar es la carta de navegación del puesto: grupos en mayúsculas de 11px/600 con `letter-spacing: .55px` en `--muted` (el grupo activo sube a `--heading`), y dentro, ítems de 15px/400 en **Acero de Menú** con radio de 6px, relleno `10px 15px` y separación de 2px. El ítem activo y el `hover` comparten fondo `--hover` y texto blanco; solo el activo sube a 500 de peso. Los grupos de más de un ítem son plegables, y **todos parten cerrados**: la elección del usuario se respeta y no hay autoexpansión por ruta activa. En el modo colapsado los rótulos se ocultan y los ítems se centran. La visibilidad se resuelve por permisos: una entrada cerrada **no se renderiza** —nunca se muestra deshabilitada— y un grupo sin ítems visibles no existe.

### Overlays

La modal (`DsModal`) flota sobre un backdrop `#dee2e6` al 50% (en claro, `rgba(93, 113, 134, .75)`), con el contenido en radio de 8px, sombra de capa pop y ancho máximo de 500px. Su diálogo entra bajando 30px con una transición de `.2s ease-out`, con una duración declarada de 200ms. El panel del personalizador entra desde la derecha con `translateX(calc(100% + 24px))` a `.28s cubic-bezier(.22,1,.36,1)`. Ambos atrapan el foco, cierran con `Escape` y devuelven el foco a su origen.

### Signature Components

- **KPI Card:** card con borde doble que contiene, a la izquierda, rótulo en `--muted` (14px) y valor en 24px/600 `tabular-nums` con `margin-top: 12px`; a la derecha, un bloque de icono de 56px con radio de card y fondo del semántico al 12–25% (`stat-icon--primary/success/info/warning`) con el icono a 32px. En móvil el icono baja a 36px y el valor a 21px.
- **Proportion Bar:** la barra de aciertos de 12px de alto con radio de card, riel en `--surface-2` y relleno en el acento, con transición de ancho `.6s ease` y `role="progressbar"` con `aria-valuenow`/`aria-valuetext`. Es una barra de píxel grueso y esquina cortada, no un indicador ornamental.
- **State Message:** alerta de geometría `12px 16px` con radio de card, fondo del semántico al 15% y filete del mismo al 40%, con título 14px/600 heredando el color y descripción a 13px. Cuando trae acción, la acción es un botón primario alineado a la derecha (en móvil, la fila pasa a columna).

**La Regla de las Cuatro Tarjetas.** El resumen conserva sus cuatro conteos —fracciones, tiradores únicos, disparos y aciertos—. La proporción de aciertos es otra lectura y vive en su propia card: no sustituye a ninguno de los cuatro, ni los cuatro se comprimen para hacerle sitio.

## Do's and Don'ts

### Do:

- **Do** consumir los tokens `--*` para todo color nuevo; los literales heredados de las capas portadas del DS no se propagan a componentes nuevos.
- **Do** mantener el borde doble de 3px en la card y el filete simple de 1px en todo lo demás.
- **Do** declarar `font-variant-numeric: tabular-nums` en cualquier cifra que se lea en columna.
- **Do** respetar el contrato de tintas: `--on-*` sobre el sólido, `--*-text` como texto sobre el tinte suave, en ambos temas.
- **Do** mostrar `—` cuando un dato no existe, y nombrar el estado —`loading`, `empty`, `denied`, `error`— sin inventar la cifra que falta.
- **Do** reproducir los valores del Inume Design System 1:1: sus hexes, radios, sombras y estados se traducen literalmente a la plataforma destino.
- **Do** dejar que el sidebar fijo y la topbar fija aguanten la estructura; el contenido se desplaza bajo ellos.
- **Do** respetar `prefers-reduced-motion`: el sistema ya neutraliza transiciones y animaciones con `!important` en las siete ramas del motor ambiental.

### Don't:

- **Don't** interpretar, simplificar ni «inspirarse» en el Design System. Toda desviación se reporta y se justifica; nunca se sustituye en silencio.
- **Don't** usar la sombra como decoración de superficies en reposo: es solo la respuesta de lo que flota.
- **Don't** repartir el acento por la pantalla. El primario marca estado —activo, foco, selección, progreso—, no énfasis decorativo.
- **Don't** persistir la apariencia en `localStorage`, `sessionStorage` ni cookies de estado: la preferencia del usuario se guarda contra la API del backend, y el `localStorage` del prototipo externo no es una autorización.
- **Don't** dibujar entradas de navegación vacías o deshabilitadas por permisos: la visibilidad cerrada es no-render.
- **Don't** introducir gradientes de superficie ni `clip-path` decorativo; el sistema se construye con filetes, escalones tonales y sombras de flotación.
- **Don't** llevar la interfaz hacia la gamificación consumer (confeti, rachas, ilustraciones amigables) ni hacia el cosplay táctico (calaveras decorativas, camuflaje ornamental, neón hacker).
