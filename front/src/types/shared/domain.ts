export const ORGANIZATION_UNIT_TYPE = {
  COMMAND: 'command',
  DIVISION: 'division',
  REGIMENT: 'regiment',
  BATTALION: 'battalion',
  COMPANY: 'company',
  SECTION: 'section',
  SQUAD: 'squad',
  STAFF: 'staff',
  RANGE: 'range',
  OTHER: 'other',
} as const

export type OrganizationUnitType =
  (typeof ORGANIZATION_UNIT_TYPE)[keyof typeof ORGANIZATION_UNIT_TYPE]

export interface OrganizationUnitDTO {
  readonly id: number
  readonly tenant: number
  parent: number | null
  readonly parent_code: string | null
  code: string
  name: string
  unit_type: OrganizationUnitType
  is_active: boolean
}

export interface OrganizationUnitLookupResponse {
  readonly results: OrganizationUnitDTO[]
}

export type AssignableUnitsResponse = OrganizationUnitLookupResponse

export interface TemporaryPersonCreateRequest {
  rut: string
  grado?: string | null
  nombre?: string | null
  apellido_paterno?: string | null
  apellido_materno?: string | null
  organization_unit_code?: string | null
}

export interface TemporaryPersonPrimaryAssignmentDTO {
  readonly unit_code: string | null
  readonly role_code: string | null
  readonly scope_code: string | null
}

export interface TemporaryPersonAssignmentDTO {
  readonly id: number
  readonly role_code: string | null
  readonly role_name: string | null
  readonly unit_code: string | null
  readonly scope_code: string | null
  readonly is_primary: boolean
}

export interface TemporaryPersonDTO {
  readonly id_usuario: number
  readonly rut: string
  readonly grado: string | null
  readonly nombre: string
  readonly apellido_paterno: string
  readonly apellido_materno: string
  readonly correo: string | null
  readonly habilitado: boolean
  readonly is_locked: boolean
  readonly must_change_password: boolean
  readonly password_changed_at: string | null
  readonly primary_assignment: TemporaryPersonPrimaryAssignmentDTO | null
  readonly assignments: TemporaryPersonAssignmentDTO[]
}

export type TemporaryPersonCreateResponse = TemporaryPersonDTO
