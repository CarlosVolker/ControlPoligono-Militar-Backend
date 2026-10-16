# Product

## Register

product

## Platform

web

## Users

El usuario primario es el instructor / oficial de tiro: el personal militar que conduce las sesiones de tiro en el polígono. Su trabajo diario es ejecutar lecciones y fracciones de tiro y registrar los resultados de sus tiradores. Usa el sistema en contexto operativo — el polígono o la oficina de la unidad —, donde la captura de datos debe ser rápida, clara y resistente al error.

La audiencia secundaria son tres puestos que operan sobre los mismos datos desde responsabilidades propias: el administrador de unidad, que gestiona personal orgánico, puestos, membresías y permisos; el encargado de armería, que controla armas, armerías y consumo de munición; y el tirador, que consulta sus propias lecciones y resultados.

## Product Purpose

PoligonoTiro es el sistema de gestión integral de la instrucción de tiro militar: unidades orgánicas, personal y puestos, armas y armerías, lecciones y fracciones de tiro, y resultados de tiro, con multi-tenancy obligatorio por institución.

El éxito significa que una institución reemplaza por completo el papel y las planillas de cálculo en la gestión de sus polígonos. Lo que antes vivía en libros de actas y hojas de cálculo se convierte en registro digital dentro del sistema, sin pasos paralelos fuera de él.

## Positioning

El sistema de gestión de tiro militar con RBAC por puestos militares y multi-tenancy con aislamiento por institución. Cada pantalla refuerza dos ideas: los datos pertenecen al puesto que los produce y a la institución que los posee.

## Brand Personality

Tres palabras: institucional, precisa, confiable.

Institucional en el tono: una herramienta de instituciones armadas, con seriedad operativa y sin informalidad ni decoración. Precisa por instrumentación: la captura y la lectura de datos son el centro de cada pantalla, y cada control responde con claridad. Confiable en la operación: el usuario debe sentir que el registro está bajo control y que el sistema sirve a la cadena de mando.

Voz: como un manual de operaciones bien editado — directo, sin adornos de marketing, sin florituras.

El sistema visual adoptado ya está definido y completo: el Inume Design System es el design system completo del producto, con todos los componentes listos para construir el frontend. Vive como **biblioteca externa**, en el directorio hermano `../../Inume Design System/` (no dentro de este repositorio), y se consulta como referencia visual, tokens y plantillas: sus contratos están en [`DESIGN.md`](../../Inume%20Design%20System/DESIGN.md) y [`PRODUCT.md`](../../Inume%20Design%20System/PRODUCT.md), y sus páginas de componentes en [`index.html`](../../Inume%20Design%20System/index.html) y las familias `ui-*.html`, `forms-*.html`, `auth-*.html`. El cliente reproduce esos valores 1:1 en la plataforma destino; no es una dependencia importable. Los enlaces son relativos al layout actual del disco.

## Anti-references

- Gamificación consumer: confetti, rachas, ilustraciones amigables, tono de app de fitness. El producto registra instrucción militar; no entretiene.
- Cosplay táctico exagerado: calaveras decorativas, camuflaje ornamental, neón hacker y cualquier parafernalia que reste seriedad institucional.

## Design Principles

1. El puesto manda sobre los datos. Cada registro pertenece al puesto militar que lo produce; las pantallas hacen visible la cadena de mando y el alcance de cada rol, nunca los ocultan.

2. La institución primero. Ningún dato existe fuera de su institución: el aislamiento por tenant es la norma de la que deriva todo lo demás, no una funcionalidad agregada.

3. Cero papel. Cada proceso que existió en libros y planillas debe poder completarse entero dentro del sistema; si un paso todavía requiere papel, el proceso no está terminado.

4. Captura operativa. El sistema es un instrumento de trabajo diario en el polígono y la oficina: la captura es rápida, densa sin ruido y resistente al error, no una vitrina.

5. Derivar, no reinventar. Las decisiones visuales y de componentes ya están tomadas y documentadas en el design system adoptado; el producto consume ese sistema y lo extiende con criterio, en lugar de re-discutirlo.

## Accessibility & Inclusion

Compromiso WCAG 2.1 Level AA, alineado con el design system adoptado: contraste mínimo de 4.5:1 para texto de cuerpo, focus visible en todo control interactivo y alternativas de movimiento reducido para toda animación.
