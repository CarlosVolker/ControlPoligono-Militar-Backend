---
spec_meta: "../spec-meta.yaml"
---

# Requisitos de frontend — Organización

## Alcance, evidencia y convención

Este tomo cubre unidades organizacionales y recintos. El contrato de datos y acciones es [organization-identity.md](../contracts/organization-identity.md) §§1 y 3; la autoridad de tenant, permisos y alcance sigue siendo el backend. La interfaz sólo anticipa visibilidad mediante el contexto ya cargado: una acción visible nunca acredita autorización y una respuesta `403` se conserva como denegación.

En cada listado, la carga muestra el patrón visual de `ui-spinners.html`; un conjunto vacío se diferencia de un error y los valores ausentes se representan con `—`, sin fabricar ceros. Crear, editar o eliminar muestra estado de guardado, deshabilita el reenvío concurrente y, al éxito, refresca el recurso afectado y las vistas que muestran sus relaciones. Los errores por campo se anclan al control correspondiente; los errores no asociados permanecen visibles en el flujo que los originó. Referencias visuales: [reference-pages.md](../design-system/reference-pages.md) §§2–4.

---

## Unidades organizacionales

### Datos y selector de jerarquía

- **R-DOM-ORG-001** — WHEN se abre el listado de unidades, THEN el cliente SHALL obtener y presentar sólo las unidades retornadas por el contrato, con `code`, `name`, `unit_type`, estado y relación `parent_code`; SHALL conservar la selección al abrir su detalle. *Fuente: `contracts/organization-identity.md:11`; alcance aplicado por servidor en `:17`.*
- **R-DOM-ORG-002** — WHEN una unidad no tiene `parent_code`, THEN el cliente SHALL rotularla como raíz; WHEN lo tiene, SHALL mostrar la relación por código y nombre resuelto desde la respuesta disponible, o `—` si el nombre no está presente. No SHALL inferir ramas no entregadas.
- **R-DOM-ORG-003** — WHEN un formulario necesita elegir unidad padre, destino de migración o unidad relacionada, THEN SHALL usar el resultado de la consulta de unidades elegibles y SHALL enviar el identificador que el contrato pide; SHALL NOT asumir que el listado visible contiene toda la rama. *Fuente: OP-UNT-010, `contracts/organization-identity.md:17`.*

### Alta y edición

- **R-DOM-ORG-004** — WHEN un usuario autorizado inicia el alta, THEN SHALL presentar `code` y `name` como obligatorios, y `parent`, `unit_type` e `is_active` como editables según el contrato. El selector de tipo SHALL limitarse a `command`, `division`, `regiment`, `battalion`, `company`, `section`, `squad`, `staff`, `range` y `other`. *Fuente: `contracts/organization-identity.md:11`.*
- **R-DOM-ORG-005** — WHEN se envía un alta o edición, THEN SHALL excluir `id`, `tenant` y `parent_code`; SHALL mantener los valores introducidos ante `400` y mostrar la validación del backend. WHEN el alta o edición tiene éxito, THEN SHALL mostrar la unidad devuelta, actualizar el árbol/listado y dejar disponible su detalle.
- **R-DOM-ORG-006** — WHEN el backend deniega creación, edición o lectura por tenant, rama o permiso, THEN el cliente SHALL mostrar una denegación explícita y SHALL NOT modificar la representación local como si la operación hubiera sucedido. *Fuente: `contracts/organization-identity.md:11,17`.*

### Lookup y eliminación con migración

- **R-DOM-ORG-007** — WHEN el operador busca una unidad para una operación de asignación, THEN el cliente SHALL usar el lookup documentado y SHALL presentar exclusivamente `results` retornados; la búsqueda vacía, sin coincidencias y denegada son estados distintos. *Fuente: OP-UNT-009, `contracts/organization-identity.md:14`.*
- **R-DOM-ORG-008** — WHEN el usuario solicita eliminar una unidad, THEN el cliente SHALL requerir primero la previsualización y mostrar sus ocho contadores: `assignments`, `weapons`, `ranges`, `lessons`, `fractions`, `results`, `child_units` y `lessons_as_participant`. SHALL bloquear la confirmación final hasta que esa respuesta corresponda a la unidad seleccionada. *Fuente: OP-UNT-007, `contracts/organization-identity.md:12`.*
- **R-DOM-ORG-009** — WHEN la previsualización informa `assignments`, THEN la confirmación SHALL advertir literalmente que el contrato sólo informa ese conteo y no promete reasignar puestos; la UI SHALL NOT rotularlos como migrados. *Fuente: OP-UNT-008, `contracts/organization-identity.md:13`.*
- **R-DOM-ORG-010** — WHEN se confirma la eliminación, THEN SHALL permitir seleccionar `target_unit_code` desde unidades elegibles o dejarlo ausente sólo cuando el usuario acepta que el backend use el padre. WHEN no existe padre, SHALL exigir destino explícito antes de enviar; SHALL impedir seleccionar la propia unidad como destino. *Fuente: `requirements.md:R-RUL-09`; OP-UNT-008, `contracts/organization-identity.md:13`.*
- **R-DOM-ORG-011** — WHEN `eliminar-con-migracion` responde éxito, THEN SHALL mostrar `detail`, `target_unit_code` y `moved`, refrescar unidades y todos los listados abiertos afectados; WHEN responde `400`, `403` o `404`, THEN SHALL mantener abierta la confirmación con el motivo y sin eliminar filas localmente. *Fuente: OP-UNT-008, `contracts/organization-identity.md:13`.*

---

## Recintos

- **R-DOM-ORG-012** — WHEN se abre el listado de recintos, THEN el cliente SHALL mostrar `code`, `name`, `description`, `is_active`, `unit_codes` y `unit_count` del contrato, conservando detalle para editar la relación. *Fuente: `contracts/organization-identity.md:15`.*
- **R-DOM-ORG-013** — WHEN se crea o edita un recinto, THEN SHALL requerir `code` y `name`; SHALL permitir `description`, `is_active` y la colección `units` por PK cuando el flujo use el CRUD; SHALL omitir `id`, `tenant`, `unit_codes` y `unit_count` por ser sólo lectura. *Fuente: `contracts/organization-identity.md:15`.*
- **R-DOM-ORG-014** — WHEN se guarda un recinto correctamente, THEN SHALL refrescar su detalle y el listado para reflejar `unit_codes` y `unit_count` retornados; cancelar SHALL descartar exclusivamente cambios no enviados.
- **R-DOM-ORG-015** — WHEN el usuario agrega una unidad desde el detalle de un recinto, THEN SHALL elegir y enviar `unit_code`, mostrar el `unit_count` devuelto y refrescar ambas relaciones. WHEN la unidad no existe o no es accesible, THEN SHALL mostrar el `404` o denegación recibido, sin insertar una relación local. *Fuente: OP-RCT-007, `contracts/organization-identity.md:16`.*
- **R-DOM-ORG-016** — WHEN el usuario quita una unidad, THEN SHALL pedir confirmación que identifique recinto y código de unidad; al éxito SHALL mostrar el `unit_count` devuelto y actualizar el detalle. SHALL tratar relación ausente como error explícito, no como éxito idempotente. *Fuente: OP-RCT-008, `contracts/organization-identity.md:16`.*
- **R-DOM-ORG-017** — WHEN se solicita eliminar un recinto por CRUD, THEN SHALL pedir confirmación destructiva, esperar confirmación del backend y refrescar el listado sólo tras éxito. El contrato no declara migración automática de sus unidades: la UI SHALL NOT prometerla.

## Criterio observable de la familia

La familia queda especificada cuando una persona autorizada puede localizar una unidad o recinto real, ver sus relaciones devueltas, crear/editar sólo los campos permitidos y completar la eliminación con previsualización o confirmación según corresponda; cualquier dato no disponible, denegación o validación permanece visible sin simulación. No se ejecutó producto para comprobarlo.
