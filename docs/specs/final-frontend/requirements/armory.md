---
spec_meta: "../spec-meta.yaml"
---

# Requisitos de frontend — Armería, armas y calibres

## Convención operativa

La familia depende de [organization-identity.md](../contracts/organization-identity.md) §2 y [domain-shooting.md](../contracts/domain-shooting.md) §1. Los datos se leen del backend real, por tenant y alcance de unidad donde el recurso lo aplique; la UI no envía `tenant` ni unidad inyectada. Carga, vacío, error, guardado, éxito y denegación son visibles y no alteran el estado local hasta recibir respuesta.

---

## Armerías

- **R-DOM-ARM-001** — WHEN se abre el listado o detalle de armerías, THEN SHALL mostrar `code`, `name`, `descripcion`, `is_active`, unidad derivada, timestamps y `armas_count`; ausencia de descripción se muestra como `—`. *Fuente: `contracts/organization-identity.md:21`.*
- **R-DOM-ARM-002** — WHEN se crea una armería, THEN SHALL requerir `code` y `name`; SHALL permitir descripción, estado y `organization_unit_code_write`. WHEN el selector de unidad no se envía, THEN SHALL mostrar después de éxito la unidad que el backend inyectó. *Fuente: `contracts/organization-identity.md:21`.*
- **R-DOM-ARM-003** — WHEN se edita una armería, THEN SHALL enviar sólo campos editables y SHALL impedir enviar `id`, `tenant`, unidad derivada, conteo o timestamps. Un valor vacío o `null` para `organization_unit_code_write` se asocia al error del campo recibido. *Fuente: `contracts/organization-identity.md:21`.*
- **R-DOM-ARM-004** — WHEN una armería se guarda o elimina por la operación CRUD disponible, THEN SHALL refrescar listado, detalle y armas relacionadas después de éxito; eliminación exige confirmación destructiva y no promete reasignación de armas si el contrato no la declara.

## Armas

- **R-DOM-ARM-005** — WHEN se lista o abre un arma, THEN SHALL mostrar sus identificadores, tipo, modelo, serie, armería, unidad derivada, calibre y campos de sólo lectura devueltos; SHALL usar `—` para calibre o relaciones ausentes. *Fuente: `contracts/domain-shooting.md:11`.*
- **R-DOM-ARM-006** — WHEN se crea un arma, THEN SHALL requerir `tipo_arma`, `modelo_arma` y `numero_serie`; el selector de tipo SHALL limitarse a `fusil`, `subfusil`, `pistola`, `francotirador`, `ametralladora` y `apoyo`. SHALL permitir `armory_code_write` y `calibre_code_write` sólo mediante selectores de códigos realmente disponibles. *Fuente: `contracts/domain-shooting.md:11`.*
- **R-DOM-ARM-007** — WHEN se edita un arma, THEN SHALL conservar las relaciones RO como contexto y enviar relaciones por `*_code_write`, nunca sustituyendo la armería por `organization_unit`. WHEN `armory_code_write` es vacío o nulo, THEN SHALL mostrar el `400` asociado y conservar el formulario. *Fuente: `requirements.md:R-RUL-04`; `contracts/domain-shooting.md:11`.*
- **R-DOM-ARM-008** — WHEN el backend rechaza la combinación `modelo_arma` + `numero_serie`, THEN SHALL mostrar el error de unicidad sin deduplicar u ocultar el arma existente en la tabla. *Fuente: `contracts/domain-shooting.md:11`.*
- **R-DOM-ARM-009** — WHEN se elimina un arma mediante la operación expuesta, THEN SHALL requerir confirmación, esperar respuesta y refrescar armería y resultados que la referencien sólo si esos recursos se vuelven a cargar; SHALL NOT simular transferencia o sustitución de stock.

## Calibres

- **R-DOM-ARM-010** — WHEN se consulta el catálogo global, THEN SHALL mostrar `code`, `nombre` e `is_active`, y usarlo como selector de código para armas y consumos. *Fuente: `contracts/domain-shooting.md:12`.*
- **R-DOM-ARM-011** — WHEN el contexto es `super_admin`, THEN SHALL permitir alta/edición/eliminación con `code`, `nombre` e `is_active`; para cualquier otro contexto SHALL dejar el catálogo como lectura sin falsificar la capacidad de mutación. *Fuente: `contracts/domain-shooting.md:12`.*
- **R-DOM-ARM-012** — WHEN un calibre se guarda o elimina, THEN SHALL refrescar los selectores dependientes antes del próximo envío; si una referencia existente deja de ser seleccionable, SHALL mostrar el valor devuelto como lectura, sin cambiar la relación por iniciativa del cliente.

## Criterio observable de la familia

Se puede administrar una armería, asociar armas mediante su código de armería y seleccionar calibres reales devueltos por el backend; errores de relación, unicidad, tenant o permisos permanecen explícitos. No se verificó este comportamiento en runtime.
