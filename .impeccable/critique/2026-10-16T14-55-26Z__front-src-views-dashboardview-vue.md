---
target: audita este dashboard para facilidad de uso, datos utiles y estetica
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/run/media/gianluca/Gian SSD 1T/Proyectos Desarrollo/Poligono backend/ControlPoligono-Militar-Backend/front/src/views/DashboardView.vue"
target_fingerprint: "sha256:f0e04fe31a6f6c6cf9d30c1d08ae529d0c32090aab3daf9320e2f75efa284138"
target_path: /run/media/gianluca/Gian SSD 1T/Proyectos Desarrollo/Poligono backend/ControlPoligono-Militar-Backend/front/src/views/DashboardView.vue
timestamp: 2026-10-16T14-55-26Z
slug: front-src-views-dashboardview-vue
---
# Critique — Dashboard «Control operativo» (frontend PoligonoTiro)

**Method: dual-agent (A: Shelyn-Cleric · B: Code-Transmuter/detector v0.1.14).** Assessment A (revisión de diseño) y Assessment B (evidencia mecánica) corrieron aisladas en sesiones independientes; A terminó antes de que los hallazgos del detector entraran a la síntesis. Overlay de navegador: **omitido deliberadamente** (carril del operador; sin autorización) — señal de fallback declarada, sin overlays fingidos.

**Alcance evaluado:** la superficie del dashboard — `DashboardView.vue` y sus componentes (`ActiveLesson`, `MetricGrid`, `AccuracyProgress`, `LessonList`, `StateMessage`, `DashboardTopbar`, `UnitSwitcher`) + `styles/dashboard.css`. Estado posterior a los arreglos del día (proporción `—` sin riel, aviso que nombra la lección, distancia con unidad, tipografía alineada).

**Evidencia mecánica (B):** escaneo determinista `EXIT=0 / []` sobre los 7 archivos; prueba de humo confirma que el binario detecta (archivo sucio → exit 2); sin config de supresión; semántica de errores verificada (target inaccesible → exit 1 + warning). Salvedades declaradas: los `.vue` se escanean en modo regex (no CSS-aware) y el CSS real del dashboard vive fuera del set canónico (indicio suplementario: limpio). Es un piso, no una prueba de calidad.

## Design Health Score — Heurísticas de Nielsen

| # | Heurística | Puntaje | Hallazgo clave |
|---|---|:---:|---|
| 1 | Visibilidad del estado del sistema | 2 | El encabezado se contradice («Unidad activa —» junto al selector «CIA-A»); sin frescura de las cifras |
| 2 | Correspondencia con el mundo real | 2 | Sustantivos del dominio ✓, pero frases desde el sistema: «consultados desde el backend», «Datos devueltos por el contexto consultado» |
| 3 | Control y libertad | 3 | Escapes y reintentos explícitos; faltan reconsulta en estado sano y deselección |
| 4 | Consistencia y estándar | 3 | Un solo sistema de tarjetas/alertas; tres formas de decir «sin datos»; dos mecanismos para el estado de fila |
| 5 | Prevención de errores | 3 | Nunca pinta datos de unidad inelegible; cooldown tras 429 |
| 6 | Reconocer antes que recordar | 3 | Todo etiquetado; el bloque de KPI no repite a qué lección pertenece |
| 7 | Flexibilidad y eficiencia | 2 | Sin atajos, orden visible, conteo, filtro ni acciones en lote |
| 8 | Diseño estético y minimalista | 2 | Limpio pero no mínimo: subtítulos de fontanería, iconos saturados sin significado; tres ceros dominan la página en el caso capturado |
| 9 | Reconocer, diagnosticar y recuperar errores | 3 | Mensajes concretos sin códigos; algunos culpan a «la conexión local»; ninguno indica paso siguiente |
| 10 | Ayuda y documentación | 0 | No existe ninguna superficie de ayuda en el producto |
| **Total** | | **23/40 (57,5 %)** | **Aceptable — mejoras significativas antes de la satisfacción plena** |

## Veredicto de especificidad de diseño

**Sustancia específica; composición intercambiable.** El vocabulario es de este producto y de ningún otro (Fracciones, Tiradores únicos, Disparos/Aciertos registrados, Membresía orgánica, Número de orden, estados propios del ciclo de lección). La estructura, en cambio, es la pila por defecto del kit (título→sección→tarjetas→tabla→details→pie) — fidelidad al DS, no carácter. Oportunidad desaprovechada: la «foto operativa de la lección» como columna vertebral; el DS ya reserva el slot de miniatura de tendencia (`.stat-spark`) que el endpoint actual (solo cuatro totales) no puede alimentar — **carencia de datos que se reporta, no se rellena**.

**Deterministic scan:** limpio en alcance, sin falsos positivos; fuera de alcance, `Geist Mono` en Autorización (real, no tocar) y catálogos de fuentes del DS (ruido léxico). **Visual overlays:** no disponibles (fallback declarado).

## Overall Impression

Buen instrumento, contado en el orden equivocado. Todo lo difícil está bien hecho (estados, honestidad del dato, accesibilidad de base); lo que falla es la jerarquía de la información y el gobierno de la unidad activa. La oportunidad mayor: que el oficial entienda en tres segundos qué está viendo y qué puede hacer con ello.

## What's Working

1. **Disciplina de estado y honestidad del dato** — cada rama con mensaje, tono y región viva correctos (`StateMessage.vue:21`); placeholder `—` sistemático; la interfaz no inventa ceros.
2. **Fidelidad real al DS** — anatomía de alertas, tarjeta de KPI y firma del sistema (borde doble) verificadas contra la biblioteca real.
3. **Infraestructura de accesibilidad poco común** — salto al contenido, `focus-visible` en todos los interactivos, tabla con `caption` y región etiquetada, `aria-busy`, Escape que devuelve el foco, `prefers-reduced-motion` que mata la animación infinita.

## Priority Issues

**[P1] La unidad activa tiene tres fuentes y ninguna manda**
- Ubicación: `DashboardTopbar.vue:49`, `stores/session.ts:343-347`, `App.vue:149`, `DashboardView.vue:255-261`.
- Impacto: el chip dice «—» donde el dato existe (incumple la regla del placeholder); y cambiar de unidad purga el tablero a IDLE con el formulario de contexto oculto y sin botón a la vista — un control rutinario borra la pantalla.
- Fix: una sola autoridad para la unidad mostrada; tras `selectUnit` exitoso, recargar el tablero de la unidad nueva (reabriendo el formulario solo si de verdad hace falta). → `/impeccable harden`

**[P1] El estado vacío explica tarde y la ruta profunda solo existe cuando no hay nada que ver**
- Ubicación: `MetricGrid.vue:73`, `DashboardView.vue:488-499 y 107-113`.
- Impacto: cifras→proporción→explicación; los tres ceros se leen como medición antes de la frase que los desmiente. Y «Ver lección en Tiro» aparece precisamente en el estado vacío: cuando hay datos, no hay camino a la profundidad.
- Fix: aviso de estado por encima del bloque de cifras; acción «Ver lección en Tiro» permanente en la tarjeta de la lección seleccionada. → `/impeccable clarify`

**[P1] El único selector de lección no dice cómo ordena, cuántas hay, ni permite buscar**
- Ubicación: `LessonList.vue:141-179`, `stores/dashboard.ts:30-42`, `api/dashboard.ts:248-254`.
- Impacto: control que gobierna toda la superficie sin controles: orden fijo no declarado, sin conteo, sin filtro ni búsqueda; con muchas lecciones, navegar es a ciegas. La fila no es clicable (solo el botón «#N», 44×36).
- Fix: declarar el orden y el total, filtro por fecha/tipo y paginación cuando el conteo lo pida (DS ya tiene `ui-pagination.html`); fila clicable. → `/impeccable layout` (paginación/filtro: depende de backend/ diseño → reportar)

**[P2] Ninguna cifra dice de cuándo es; el estado sano no ofrece reconsulta**
- Ubicación: `DashboardView.vue:436-441, 482-500`; `MetricGrid.vue:72-87`; `AccuracyProgress.vue:72-93`.
- Impacto: sin frescura ni referencia (la serie no existe en el endpoint — se reporta); «Reconsultar» solo vive en avisos de error.
- Fix: declarar frescura con el dato ya presente + control de reconsulta en el estado sano; `.stat-spark` cuando el backend entregue serie. → `/impeccable shape`

**[P2] Donde el color es la señal, el sistema no garantiza contraste**
- Ubicación: `dashboard.css:674-678, 1697-1701` vs DS `baseui-forms.css:545-549`; `dashboard.css:752-759, 992-1002` vs `theme-customizer.css:72, 293-316`.
- Impacto: foco de formularios a 2,12:1 (literal del DS → se reporta a la biblioteca, no se corrige aquí); acento como tinta de 12–13,5px bajo 4,5:1 en 16 de 27 acentos (el default mint pasa).
- Fix: completar el contrato de tintas del DS en el cliente donde el acento pinta texto; reportar el eje de foco a la biblioteca. → `/impeccable audit`

## Persona Red Flags

**Alex (power user):** sin un solo atajo de teclado para la interacción principal; tabla sin orden/filtro; formulario de contexto que no se reabre cuando falta. Abandono probable en la segunda visita.

**Sam (lector de pantalla):** foco casi invisible en formularios (2,12:1); `aria-selected` sobre `<tr>` inválido en tabla plana y duplicando el `aria-pressed` del botón; cuando el resumen termina de cargar, nada lo anuncia.

**Suboficial instructor (persona del dominio):** de pie y con guantes — a 320–360px las cuatro tarjetas caen a una columna (tres pantallas de desplazamiento); chip de contexto oculto bajo 991px; toque de fila 44×36, en el mínimo.

## Minor Observations

- `data-active` calculado en la etiqueta del grupo activo sin ningún CSS que lo consuma — el grupo del que estás dentro no se distingue.
- `.stat-caption` declarada sin consumidor y sin twin en el DS — regla inventada y muerta.
- `.dashboard-grid` sin consumidor en la superficie.
- Tres formas de decir «no hay datos» («—», «Sin tiros registrados», «Sin resultados registrados») con vocabularios que se pisan.
- Los dos subtítulos son fontanería, no ayuda.
- Con la familia Play (carga 400/700), los pesos 500/600 declarados hacen snap a 700 — la jerarquía de tres niveles se colapsa; la familia elegida cambia la jerarquía (verificable en navegador).
- Fuera de alcance: el pie del 404 dice «2026 © Inume Design System» y el del tablero «© 2026 PoligonoTiro» — dos marcas.

## Questions to Consider

1. Si el oficial solo pudiera leer **una** cifra al entrar, ¿cuál sería? Hoy la superficie contesta «cuatro, y tres son cero».
2. ¿Y si «Ver lección en Tiro» viviera siempre en la tarjeta de la lección seleccionada?
3. «Lecciones y resultados consultados desde el backend»: ¿está escrita para el oficial o para el acta de entrega?
