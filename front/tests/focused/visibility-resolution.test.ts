import { describe, expect, it } from 'vitest'
import { validateAuthContext } from '../../src/api/dashboard'
import type { AuthContext, AuthContextAssignment } from '../../src/types/contexto'
import {
  AUDIT_ROLE_CONTRACT,
  PERMISSION_CODE,
  ROLE_CODE,
  VIEW_GATE_LITERAL,
} from '../../src/permissions/catalog'
import {
  buildVisibilitySnapshot,
  canViewSurface,
  isPrivilegedVisibility,
  ROUTE_VISIBILITY_KIND,
  visibilityClosed,
  visibilityForPermission,
  visibilityForRoleContract,
  visibilityForSession,
  visibilityForTenantRead,
  visibilityOfMeta,
  visibilityPublic,
} from '../../src/router/visibility'
import { routes, ROUTE_NAMES } from '../../src/router/routes'
import { SESSION_STATUS } from '../../src/types/session'

function makeContextFixture(options: {
  permissions?: readonly string[]
  assignments?: readonly AuthContextAssignment[]
  userId?: number
  tenantCode?: string | null
  unitCode?: string | null
  mustChangePassword?: boolean
} = {}): AuthContext {
  const tenantCode = options.tenantCode === undefined ? 'tenant-fixture' : options.tenantCode
  const unitCode = options.unitCode === undefined ? 'unit-fixture' : options.unitCode
  const raw: unknown = {
    user: {
      id_usuario: options.userId ?? 701,
      rut: null,
      must_change_password: options.mustChangePassword ?? false,
    },
    tenant: { code: tenantCode, context: tenantCode === null ? null : 'context-fixture' },
    active_organization_unit: unitCode,
    unit_membership: unitCode === null ? null : { id: 801, unit_code: unitCode, unit_name: 'Unidad de prueba' },
    scopes: [],
    permissions: [...(options.permissions ?? [])],
    assignments: [...(options.assignments ?? [])],
  }
  return validateAuthContext(raw)
}

function makeAssignment(role: string, isPrimary = true): AuthContextAssignment {
  return { role, scope: 'unidad_propia', organization_unit: 'unit-fixture', is_primary: isPrimary }
}

function readySnapshot(context: AuthContext, principalId = 701, tenantCode = 'tenant-fixture') {
  return buildVisibilitySnapshot({
    status: SESSION_STATUS.READY,
    context,
    principalId,
    tenantCode,
    logoutBusy: false,
  })
}

describe('catálogo compartido (F1/F5, AC-7)', () => {
  it('los códigos del catálogo son literales del contrato backend, sin duplicados', () => {
    const values = Object.values(PERMISSION_CODE)
    expect(new Set(values).size).toBe(values.length)
    expect(values).toContain('view_unit')
    expect(values).toContain('view_recinto')
    expect(values).toContain('view_personnel_basic')
    expect(values).toContain('view_warehouse')
    expect(values).toContain('view_exercises')
    expect(values).toContain('manage_calibre')
    expect(VIEW_GATE_LITERAL.ORGANIZATION_UNIT_READ).toBe('organization_unit:read')
    expect(ROLE_CODE).toEqual({
      TENANT_ADMIN: 'tenant_admin',
      SUPER_ADMIN: 'super_admin',
      AUDITOR: 'auditor',
    })
    expect([...AUDIT_ROLE_CONTRACT]).toEqual(['tenant_admin', 'super_admin', 'auditor'])
  })

  it('cada ruta declara su visibilidad; las privilegiadas mantienen requiresTenant vigente', () => {
    for (const route of routes) {
      expect(route.meta?.visibility, String(route.name)).toBeDefined()
      const visibility = route.meta?.visibility
      if (visibility && isPrivilegedVisibility(visibility)) {
        expect(route.meta?.requiresTenant, String(route.name)).toBe(true)
      }
    }
    // Criterios localizados en F1 contra navigation.md:80-104.
    expect(routes.find((route) => route.name === ROUTE_NAMES.UNITS)?.meta?.visibility)
      .toEqual({ kind: 'permission', code: PERMISSION_CODE.VIEW_UNIT })
    expect(routes.find((route) => route.name === ROUTE_NAMES.CALIBERS)?.meta?.visibility)
      .toEqual({ kind: 'permission', code: PERMISSION_CODE.VIEW_EXERCISES })
    expect(routes.find((route) => route.name === ROUTE_NAMES.ARMORIES)?.meta?.visibility)
      .toEqual({ kind: 'permission', code: PERMISSION_CODE.VIEW_WAREHOUSE })
    expect(routes.find((route) => route.name === ROUTE_NAMES.ROLES)?.meta?.visibility)
      .toEqual({ kind: 'tenantRead' })
    expect(routes.find((route) => route.name === ROUTE_NAMES.OVERRIDES)?.meta?.visibility)
      .toEqual({ kind: 'closed' })
    expect(routes.find((route) => route.name === ROUTE_NAMES.AUDIT)?.meta?.visibility)
      .toEqual({ kind: 'roleContract', roles: AUDIT_ROLE_CONTRACT })
    expect(routes.find((route) => route.name === ROUTE_NAMES.DASHBOARD)?.meta?.visibility)
      .toEqual({ kind: 'session', requiresActiveTenant: true })
  })
})

describe('snapshot de visibilidad (AC-3)', () => {
  it('READY con contexto validado y principal coherente es snapshot vigente', () => {
    const snapshot = readySnapshot(makeContextFixture())
    expect(snapshot.valid).toBe(true)
    expect(snapshot.authenticated).toBe(true)
    expect(snapshot.activeTenant).toBe(true)
  })

  for (const status of [
    SESSION_STATUS.BOOTING,
    SESSION_STATUS.NEEDS_TENANT,
    SESSION_STATUS.FAILURE,
    SESSION_STATUS.CONTEXT_LOST,
    SESSION_STATUS.ANONYMOUS,
  ] as const) {
    it(`estado ${status} resuelve unknown/stale: privilegiado cerrado`, () => {
      const snapshot = buildVisibilitySnapshot({
        status,
        context: status === SESSION_STATUS.CONTEXT_LOST || status === SESSION_STATUS.ANONYMOUS
          ? null
          : makeContextFixture({ permissions: ['view_unit'] }),
        principalId: status === SESSION_STATUS.ANONYMOUS ? null : 701,
        tenantCode: 'tenant-fixture',
        logoutBusy: false,
      })
      expect(snapshot.valid).toBe(false)
      expect(canViewSurface(visibilityForPermission(PERMISSION_CODE.VIEW_UNIT), snapshot)).toBe(false)
      expect(canViewSurface(visibilityForTenantRead(), snapshot)).toBe(false)
      expect(canViewSurface(visibilityForRoleContract(AUDIT_ROLE_CONTRACT), snapshot)).toBe(false)
    })
  }

  it('la generación avanzada invalida el snapshot: principal/contexto discordantes cierran', () => {
    const context = makeContextFixture({ permissions: ['view_unit'] })
    // Contexto de un principal anterior (generación avanzada sin purga total).
    const stale = buildVisibilitySnapshot({
      status: SESSION_STATUS.READY,
      context,
      principalId: 999,
      tenantCode: 'tenant-fixture',
      logoutBusy: false,
    })
    expect(stale.valid).toBe(false)
    expect(canViewSurface(visibilityForPermission(PERMISSION_CODE.VIEW_UNIT), stale)).toBe(false)

    const loggingOut = buildVisibilitySnapshot({
      status: SESSION_STATUS.READY,
      context,
      principalId: 701,
      tenantCode: 'tenant-fixture',
      logoutBusy: true,
    })
    expect(loggingOut.valid).toBe(false)

    const forcedPassword = readySnapshot(
      makeContextFixture({ permissions: ['view_unit'], mustChangePassword: true }),
    )
    expect(forcedPassword.valid).toBe(false)
  })

  it('tenant del contexto vacío o identificador nulo: cerrado (fail-closed)', () => {
    const noTenant = buildVisibilitySnapshot({
      status: SESSION_STATUS.READY,
      context: makeContextFixture({ permissions: ['view_unit'], tenantCode: null }),
      principalId: 701,
      tenantCode: 'tenant-fixture',
      logoutBusy: false,
    })
    expect(noTenant.valid).toBe(false)
    expect(
      buildVisibilitySnapshot({
        status: SESSION_STATUS.READY,
        context: makeContextFixture({ permissions: ['view_unit'] }),
        principalId: null,
        tenantCode: 'tenant-fixture',
        logoutBusy: false,
      }).valid,
    ).toBe(false)
  })
})

describe('criterio por ruta compartido (AC-1, AC-4)', () => {
  it('clase (a): permiso atómico acreditado abre; ausente cierra sin request', () => {
    const granted = readySnapshot(makeContextFixture({ permissions: ['view_unit'] }))
    expect(canViewSurface(visibilityForPermission(PERMISSION_CODE.VIEW_UNIT), granted)).toBe(true)
    expect(canViewSurface(visibilityForPermission(PERMISSION_CODE.VIEW_RECINTO), granted)).toBe(false)
  })

  it('clase (b): lectura IA+TA abierta con snapshot vigente, sin exigir códigos ni roles', () => {
    const snapshot = readySnapshot(makeContextFixture({
      permissions: [],
      assignments: [makeAssignment('tirador')],
    }))
    expect(canViewSurface(visibilityForTenantRead(), snapshot)).toBe(true)
  })

  it('clase (c): sólo el contrato OP-AUT-004 evalúa roles sobre assignments validados', () => {
    const visibility = visibilityForRoleContract(AUDIT_ROLE_CONTRACT)
    for (const role of ['tenant_admin', 'super_admin', 'auditor']) {
      const snapshot = readySnapshot(makeContextFixture({ assignments: [makeAssignment(role)] }))
      expect(canViewSurface(visibility, snapshot), role).toBe(true)
    }
    const custom = readySnapshot(makeContextFixture({ assignments: [makeAssignment('tirador')] }))
    expect(canViewSurface(visibility, custom)).toBe(false)
  })

  it('AC-4: rol custom no se deniega donde el criterio es atómico y el snapshot lo acredita', () => {
    const snapshot = readySnapshot(makeContextFixture({
      permissions: ['view_unit', 'view_exercises'],
      assignments: [makeAssignment('instructor_tiro_custom')],
    }))
    expect(canViewSurface(visibilityForPermission(PERMISSION_CODE.VIEW_UNIT), snapshot)).toBe(true)
    expect(canViewSurface(visibilityForPermission(PERMISSION_CODE.VIEW_EXERCISES), snapshot)).toBe(true)
  })

  it('sin criterio fundado: cerrado permanente aunque el snapshot acredite todo', () => {
    const snapshot = readySnapshot(makeContextFixture({
      permissions: Object.values(PERMISSION_CODE),
      assignments: [makeAssignment('super_admin')],
    }))
    expect(canViewSurface(visibilityClosed(), snapshot)).toBe(false)
    expect(isPrivilegedVisibility(visibilityClosed())).toBe(true)
  })

  it('ruta sin visibilidad declarada colapsa a closed (fail-closed por defecto)', () => {
    const snapshot = readySnapshot(makeContextFixture({ permissions: ['view_unit'] }))
    const collapsed = visibilityOfMeta({})
    expect(collapsed.kind).toBe(ROUTE_VISIBILITY_KIND.CLOSED)
    expect(canViewSurface(collapsed, snapshot)).toBe(false)
    expect(canViewSurface(visibilityOfMeta(undefined), snapshot)).toBe(false)
  })

  it('clase (d): dashboard sesión+tenant; contexto/personalizador sesión; público siempre', () => {
    const principalOnly = buildVisibilitySnapshot({
      status: SESSION_STATUS.BOOTING,
      context: null,
      principalId: 701,
      tenantCode: '',
      logoutBusy: false,
    })
    expect(canViewSurface(visibilityForSession(), principalOnly)).toBe(true)
    expect(canViewSurface(visibilityForSession(true), principalOnly)).toBe(false)

    const captured = buildVisibilitySnapshot({
      status: SESSION_STATUS.NEEDS_TENANT,
      context: null,
      principalId: null,
      tenantCode: 'tenant-fixture',
      logoutBusy: false,
    })
    expect(canViewSurface(visibilityForSession(), captured)).toBe(false)
    expect(canViewSurface(visibilityForSession(true), captured)).toBe(false)
    expect(canViewSurface(visibilityPublic(), captured)).toBe(true)
    expect(isPrivilegedVisibility(visibilityForSession(true))).toBe(false)
    expect(isPrivilegedVisibility(visibilityPublic())).toBe(false)
  })
})
