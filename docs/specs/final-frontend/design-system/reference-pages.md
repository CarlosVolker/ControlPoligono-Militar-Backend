# Referencias de páginas y familias del Design System

> 🪶 Yo catalogo referencias locales para construir y revisar superficies futuras. Una página del DS demuestra un patrón visual disponible; no crea una capacidad del producto ni confirma que exista una pantalla implementada.

## Índice

1. [Uso de este mapa](#uso-de-este-mapa)
2. [Familias de superficie](#familias-de-superficie)
3. [Capas CSS](#capas-css)
4. [Estados a observar después](#estados-a-observar-después)

---

## Uso de este mapa

Las rutas son relativas a este documento y requieren el directorio hermano externo declarado. Antes de componer una superficie, yo abro su página y las capas CSS enlazadas en su `<head>`; por ejemplo, formularios incluye `baseui.css`, `baseui-content.css` y `baseui-forms.css` ([`forms-basic.html`](../../../../../../Inume%20Design%20System/forms-basic.html):12–16). Los datos de demo que viven en esas páginas no se copian al producto.

## Familias de superficie

| Necesidad visual futura | Referencias locales concretas | Estados/patrones que la fuente permite localizar |
|---|---|---|
| Shell, dashboard, navegación y búsqueda | [`index.html`](../../../../../../Inume%20Design%20System/index.html), [`styles.css`](../../../../../../Inume%20Design%20System/assets/css/styles.css) | Sidebar/topbar fijas, colapso, móvil, menú activo, dropdown, toggle de tema, breadcrumbs y cards. |
| Autenticación | [`auth-signin.html`](../../../../../../Inume%20Design%20System/auth-signin.html), [`auth-signup.html`](../../../../../../Inume%20Design%20System/auth-signup.html), [`auth-password.html`](../../../../../../Inume%20Design%20System/auth-password.html), [`auth-lock-screen.html`](../../../../../../Inume%20Design%20System/auth-lock-screen.html) | Card auth, labels, controles, checkbox, enlace auxiliar, submit y personalizador. |
| Listados y tablas | [`tables-basic.html`](../../../../../../Inume%20Design%20System/tables-basic.html), [`tables-gridjs.html`](../../../../../../Inume%20Design%20System/tables-gridjs.html), [`ui-pagination.html`](../../../../../../Inume%20Design%20System/ui-pagination.html) | Cabeceras, celdas, filas, hover, paginación, estado activo y disabled. |
| Formularios y captura | [`forms-basic.html`](../../../../../../Inume%20Design%20System/forms-basic.html), [`forms-validation.html`](../../../../../../Inume%20Design%20System/forms-validation.html), [`forms-fileuploads.html`](../../../../../../Inume%20Design%20System/forms-fileuploads.html), [`forms-flatpicker.html`](../../../../../../Inume%20Design%20System/forms-flatpicker.html), [`forms-editors.html`](../../../../../../Inume%20Design%20System/forms-editors.html) | Inputs, selects, checks/radios, validación, upload, selector de fecha y editor. |
| Detalle, agrupación y acciones | [`ui-card.html`](../../../../../../Inume%20Design%20System/ui-card.html), [`ui-list-group.html`](../../../../../../Inume%20Design%20System/ui-list-group.html), [`ui-buttons.html`](../../../../../../Inume%20Design%20System/ui-buttons.html), [`ui-badge.html`](../../../../../../Inume%20Design%20System/ui-badge.html) | Card, lista, botones, tamaños/variantes, badges y estados semánticos. |
| Reportes y visualización | [`charts.html`](../../../../../../Inume%20Design%20System/charts.html), [`maps-vector.html`](../../../../../../Inume%20Design%20System/maps-vector.html), [`ui-progress.html`](../../../../../../Inume%20Design%20System/ui-progress.html) | Charts, mapas, labels y progreso; la referencia visual no introduce métricas ni datos. |
| Error, aviso, carga y vacío | [`pages-404.html`](../../../../../../Inume%20Design%20System/pages-404.html), [`pages-404-alt.html`](../../../../../../Inume%20Design%20System/pages-404-alt.html), [`ui-alerts.html`](../../../../../../Inume%20Design%20System/ui-alerts.html), [`ui-placeholders.html`](../../../../../../Inume%20Design%20System/ui-placeholders.html), [`ui-spinners.html`](../../../../../../Inume%20Design%20System/ui-spinners.html) | Error 404, CTA, alerts semánticos, placeholder y spinner. |
| Overlay y feedback transitorio | [`ui-modal.html`](../../../../../../Inume%20Design%20System/ui-modal.html), [`ui-offcanvas.html`](../../../../../../Inume%20Design%20System/ui-offcanvas.html), [`ui-toasts.html`](../../../../../../Inume%20Design%20System/ui-toasts.html), [`ui-popovers.html`](../../../../../../Inume%20Design%20System/ui-popovers.html), [`ui-tooltips.html`](../../../../../../Inume%20Design%20System/ui-tooltips.html) | Modal, offcanvas, toast, popover y tooltip; sus roles y cierre se toman de fuente. |
| Navegación secundaria | [`ui-tabs.html`](../../../../../../Inume%20Design%20System/ui-tabs.html), [`ui-accordion.html`](../../../../../../Inume%20Design%20System/ui-accordion.html), [`ui-collapse.html`](../../../../../../Inume%20Design%20System/ui-collapse.html), [`ui-dropdown.html`](../../../../../../Inume%20Design%20System/ui-dropdown.html), [`ui-breadcrumb.html`](../../../../../../Inume%20Design%20System/ui-breadcrumb.html), [`ui-scrollspy.html`](../../../../../../Inume%20Design%20System/ui-scrollspy.html) | Tab activa, disclosure, expansión/colapso, menú, ruta y seguimiento. |
| Complementos de contenido | [`ui-avatar.html`](../../../../../../Inume%20Design%20System/ui-avatar.html), [`ui-carousel.html`](../../../../../../Inume%20Design%20System/ui-carousel.html) | Avatar y carousel; no se asume su necesidad funcional. |

## Capas CSS

| Capa | Familia que gobierna |
|---|---|
| [`styles.css`](../../../../../../Inume%20Design%20System/assets/css/styles.css) | Tokens, shell, navegación, layout y base tipográfica. |
| [`baseui.css`](../../../../../../Inume%20Design%20System/assets/css/baseui.css) | Fundamentos Base UI compartidos. |
| [`baseui-content.css`](../../../../../../Inume%20Design%20System/assets/css/baseui-content.css) | Contenido, botones, cards, tabs, alerts y componentes de contenido. |
| [`baseui-forms.css`](../../../../../../Inume%20Design%20System/assets/css/baseui-forms.css) | Formularios, validación, editor, upload y Flatpickr. |
| [`baseui-tables.css`](../../../../../../Inume%20Design%20System/assets/css/baseui-tables.css) | Tablas y Grid.js. |
| [`baseui-overlays.css`](../../../../../../Inume%20Design%20System/assets/css/baseui-overlays.css) | Modal, offcanvas, toast, popover y tooltip. |
| [`baseui-apex.css`](../../../../../../Inume%20Design%20System/assets/css/baseui-apex.css) | ApexCharts. |
| [`auth.css`](../../../../../../Inume%20Design%20System/assets/css/auth.css) / [`errors.css`](../../../../../../Inume%20Design%20System/assets/css/errors.css) | Auth y errores. |
| [`theme-customizer.css`](../../../../../../Inume%20Design%20System/assets/css/theme-customizer.css) | Capa final de personalización por atributos. |

## Estados a observar después

Cuando exista una matriz de pantallas y autorización de verificación, se observa el resultado real contra la referencia de familia: reposo, hover, focus-visible, active/selected, disabled, validación/error, carga, vacío, responsive, tema `dark`/`light` y cada combinación de apariencia aplicable. Para customizer, el catálogo y reset exactos están en [customizer-catalog.md](customizer-catalog.md).

🕯️ No he iniciado navegador ni ejecutado una auditoría UI/UX. Este tomo sólo deja localizables las fuentes que una verificación visual posterior debe contrastar.
