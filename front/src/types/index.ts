/**
 * Barrel de tipos compartidos (hito 1, plan `frontend-build-base` §5#1).
 * A: transporte/datos/router (pasos 3–4). B: shell/componentes (paso 2).
 * Importar por módulo específico o desde aquí; el contenido se define en
 * contexto.ts / dashboard.ts / shell.ts.
 */
export * from './auth'
export * from './session'
export * from './access-ui'
export * from './contexto'
export * from './dashboard'
export * from './shell'
