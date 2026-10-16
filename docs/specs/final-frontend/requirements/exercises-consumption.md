---
spec_meta: "../spec-meta.yaml"
---

# Requisitos de frontend — Ejercicios y consumos

## Alcance

Este tomo cubre EjercicioMilitar, ConsumoMunicion y ConsumoArma. La fuente de contrato es [exercises-preferences.md](../contracts/exercises-preferences.md) §§1–2; las preferencias de apariencia legacy y el requisito de ocho ejes pertenecen a otra partición y no se implementan ni duplican aquí. Los recursos se obtienen del backend real; carga, vacío, error, guardado, éxito, `403` y confirmación destructiva quedan visibles.

---

## Ejercicios militares

- **R-DOM-EXC-001** — WHEN se lista o abre un ejercicio, THEN el cliente SHALL mostrar `id_ejercicio`, nombre, fecha, zona, tipo, observaciones, unidades participantes, tenant, unidad y `created_at` cuando estén presentes; SHALL mostrar `—` para valores ausentes. *Fuente: `contracts/exercises-preferences.md:11`.*
- **R-DOM-EXC-002** — WHEN se crea o edita un ejercicio, THEN SHALL requerir `nombre` y `fecha`; SHALL permitir zona, observaciones, los campos opcionales de orden/fecha y unidades mediante `unidades_participantes_codes_write`. El selector de tipo SHALL limitarse a `asalto`, `defensa`, `movimiento`, `mixto` y `otro`. *Fuente: `contracts/exercises-preferences.md:11`.*
- **R-DOM-EXC-003** — WHEN se omiten unidades participantes al crear, THEN SHALL mostrar la unidad efectiva retornada y SHALL NOT rellenar participantes sintéticos. *Fuente: `contracts/exercises-preferences.md:11`.*
- **R-DOM-EXC-004** — WHEN un ejercicio se guarda, THEN SHALL refrescar su detalle y el listado; WHEN se cancela, THEN SHALL descartar cambios no enviados. Los errores de unidades o tenant se muestran junto al selector o como denegación, según la forma de la respuesta.
- **R-DOM-EXC-005** — WHEN se elimina un ejercicio por el CRUD expuesto, THEN SHALL requerir confirmación que identifique el ejercicio y SHALL refrescar consumos relacionados sólo tras éxito. El cliente SHALL NOT prometer eliminación en cascada si la respuesta no la declara.

## Consumo de munición

- **R-DOM-EXC-006** — WHEN se lista o abre un consumo de munición, THEN SHALL mostrar `id_consumo`, ejercicio, tipo/modelo de arma, calibre, cantidades, aproximación y observaciones retornados. El recurso no tiene unidad propia: SHALL NOT intentar inyectarla desde la UI. *Fuente: `contracts/exercises-preferences.md:12`.*
- **R-DOM-EXC-007** — WHEN se crea o edita un consumo de munición, THEN SHALL requerir `ejercicio`, `tipo_arma` y `cantidad_tiros`; SHALL permitir `modelo_arma`, `calibre_code_write`, `cantidad_armas`, `es_aproximado` y observaciones. El selector de tipo SHALL usar sólo `fusil`, `subfusil`, `pistola`, `francotirador`, `ametralladora` y `apoyo`. *Fuente: `contracts/exercises-preferences.md:12,15`.*
- **R-DOM-EXC-008** — WHEN se selecciona calibre, THEN SHALL enviar `calibre_code_write` de un calibre activo retornado por el catálogo; SHALL mostrar el calibre de sólo lectura que el backend devuelva. No SHALL deducir calibre desde tipo o modelo de arma. *Fuente: `contracts/exercises-preferences.md:12`.*
- **R-DOM-EXC-009** — WHEN se guarda o elimina un consumo de munición, THEN SHALL mostrar guardado/confirmación, esperar respuesta y refrescar el ejercicio y consumos asociados sólo después de éxito; `400`, `403` y relaciones inexistentes no se convierten en ceros ni en éxito visual.

## Consumo por arma

- **R-DOM-EXC-010** — WHEN se lista o abre un consumo de arma, THEN SHALL mostrar `id_consumo_arma`, consumo, arma, `cantidad_tiros` y observaciones retornados, manteniendo enlaces a detalle sólo si los IDs/relaciones están presentes. *Fuente: `contracts/exercises-preferences.md:13`.*
- **R-DOM-EXC-011** — WHEN se crea o edita un consumo de arma, THEN SHALL requerir `consumo`, `arma` y `cantidad_tiros`, y SHALL permitir observaciones. Los selectores SHALL provenir de las respuestas reales de consumos y armas accesibles; no de registros de muestra. *Fuente: `contracts/exercises-preferences.md:13`.*
- **R-DOM-EXC-012** — WHEN el backend rechaza duplicidad de consumo+arma, THEN SHALL mostrar el error en la relación de arma y SHALL conservar el formulario para corrección. *Fuente: `contracts/exercises-preferences.md:13`.*
- **R-DOM-EXC-013** — WHEN se elimina un consumo de arma, THEN SHALL pedir confirmación y actualizar la relación de su consumo padre únicamente tras éxito; SHALL no recalcular o suponer stock restante porque no es un dato contractual de este recurso.

## Restricciones y criterio observable

- **R-DOM-EXC-014** — WHEN una capacidad solicitada requiere transferencia de stock, exportación, validación de resultados o un endpoint de apariencia de ocho ejes, THEN el cliente SHALL reportar el hueco y SHALL NOT simularla con datos, storage local ni una operación diferente. *Fuente: `requirements.md:424–444`; `contracts/exercises-preferences.md:17–24`.*

La familia queda especificada cuando un ejercicio real puede vincularse a consumos de munición y, separadamente, a armas concretas mediante los dos niveles contractuales; cada error, denegación o ausencia permanece observable. No se ejecutó el producto.
