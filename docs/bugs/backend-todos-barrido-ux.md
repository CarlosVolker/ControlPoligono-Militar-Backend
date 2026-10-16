# TODO — Dependencias de backend del barrido UX (2026-10-16)

> Origen: barrido UX multi-agente del 2026-10-16 (informe consolidado en `.cache/frontend-acceptance/2026-10-16/ux-sweep/CONSOLIDADO.md`; informes por superficie en la misma carpeta). Los hallazgos del front se corrigen en el cliente; **los siguientes requieren al backend o a la biblioteca del DS y quedan anotados como deuda** para la persona correspondiente. No se simulan ni se parchean en el cliente.

## 1. Backend (para la otra persona)

1. **Paginación real por endpoint.** Los listados llegan completos (DRF sin `DEFAULT_PAGINATION_CLASS`; p. ej. `EjercicioMilitarViewSet` sin `pagination_class`). Afecta armas, armerías, calibres, ejercicios, consumos, personas, puestos, roles, bitácora. El front mostrará contadores honestos («N de M cargados») mientras esto falte; «ver más» por rango exige este contrato.
2. **`id_usuario` en los DTOs de titularidad y pertenencia** (`UnitMembershipDTO`, `PositionHolderDTO` — `front/src/features/identity/api.ts:250-262, 215-226`). Sin ese identificador el cliente no puede enlazar el RUT a la ficha de la persona (hoy es texto plano).
3. **Mapeo de `ProtectedError` → 409 legible** en borrado de rol en uso (`Position.role → PROTECT`, `apps/identity/models.py:86-91`). Hoy el rechazo determinista llega como 5xx y el cliente lo clasifica como resultado incierto, vacía la pantalla y pide reconciliación.
4. **Contrato del override sin regla** (`permission:null`, `resource:''`, `action:''`): el serializer lo acepta (`apps/authorization/serializers.py:55-77`) y el registro **nunca coincide** en la evaluación (`permissions.py:147-168`) — no concede ni niega, y consume el cupo legacy (`models.py:247-251`). El cliente retirará la opción; decidir en backend si el contrato se cierra o se convierte en comodín real (`'*'`).
5. **Endpoint de «permisos efectivos de una persona»**: la pregunta central del dominio («¿qué puede hacer esta persona?») no tiene superficie porque no tiene endpoint. Requiere diseño de contrato.
6. **Lectura de la matriz rol/puesto** (`OP-RPR-*`): hoy cualquier principal con tenant puede leer `RolePermission`/`PositionPermission` y solo se protege la mutación. ¿Debe fallar cerrada como las mutaciones, o la lectura abierta es intencional?
7. **`unit_name` para todas las unidades del selector de la barra**: el contexto expone el nombre de la membresía; verificar si los demás códigos de `unitCodes` pueden llegar con nombre para rotular las opciones (hoy códigos crudos).
8. **Fechas**: confirmar si `starts_at`/`ends_at` (membresías) aceptan formatos distintos del ISO completo; el cliente solo podrá ofrecer un control de fecha más amable si el contrato lo permite.
9. **Semántica de la baja de armería**: el backend no declara qué ocurre con las armas asociadas al dar de baja una armería (¿quedan sin armería? ¿se bloquea? ¿se reasignan?). El cliente retiró el relleno «no presupone su reasignación» antes que afirmar algo que el contrato no sostiene; falta la declaración para poder informarlo al usuario.
10. **`count` de la bitácora no es un total real**: `AuditLogView` devuelve `count = len(data)`, así que el «de M» de la bitácora no es fiable como total; requiere conteo real si se quiere paginar con rango.

## 2. Biblioteca del DS (decisión de ley visual — no se toca en cliente)

1. **Anillo de foco de formularios**: `outline: 0` + borde `#4a5663` = **2,1:1** sobre superficie (WCAG 1.4.11/2.4.7 AA). Es fidelidad 1:1 con `baseui-forms.css:33-34, 81-84` («ring removed by template»), y el propio DS ya contiene un anillo base en `baseui-overlays.css:391`. Decidir: restaurar el anillo en la biblioteca o enmendar la fuente. El cliente no se desvía.
2. **Familia de badges**: el cliente portará 1:1 ambas familias del DS (`badge-success/danger` suaves y `badge-success-sm/danger-sm` sólidas) y unificará los estados de tabla en la familia sólida pequeña; si la intención de la biblioteca es otra, se ajusta en la fuente.
3. **Snap de pesos con la familia Play** (crítica del 2026-10-16): 500/600 hacen snap a 700 — comportamiento de familia; verificar en render con cada tipografía del eje.
