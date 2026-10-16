import type { VNode } from 'vue'
import {
  RECOVERY_STEP,
  type AccessActionResult,
  type ChangeRequiredPasswordRequest,
  type LoginRequest,
  type RecoveryChangeRequest,
  type RecoveryChangeResponse,
  type RecoveryCheckRequest,
  type RecoveryCheckResponse,
  type RecoveryCreateRequest,
  type RecoveryCreateResponse,
  type RecoveryIdentifyRequest,
  type RecoveryIdentifyResponse,
  type RecoveryStep,
} from './auth'
import type { AuthContext } from './contexto'
import type { SessionBusyState, SessionStatus } from './session'

export const ACCESS_FEEDBACK_TONE = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
} as const

export type AccessFeedbackTone =
  (typeof ACCESS_FEEDBACK_TONE)[keyof typeof ACCESS_FEEDBACK_TONE]

export interface AccessFeedback {
  message: string
  tone: AccessFeedbackTone
}

export interface AuthCardProps {
  title: string
  description?: string
}

export interface AuthCardSlots {
  default: () => VNode[]
  footer?: () => VNode[]
}

export const AUTH_FIELD_TYPE = {
  TEXT: 'text',
  PASSWORD: 'password',
  EMAIL: 'email',
} as const

export type AuthFieldType = (typeof AUTH_FIELD_TYPE)[keyof typeof AUTH_FIELD_TYPE]

export interface AuthFieldProps {
  modelValue: string
  label: string
  name: string
  type: AuthFieldType
  autocomplete?: string
  required?: boolean
  disabled?: boolean
  error?: string | null
}

export interface AuthFieldEmits {
  'update:modelValue': [value: string]
}

export interface FormFeedbackProps {
  feedback: AccessFeedback | null
  busy: boolean
  busyMessage?: string | null
}

export interface LoginFormProps {
  tenantCode: string
  busy: boolean
  feedback: AccessFeedback | null
}

export interface LoginFormEmits {
  submit: [credentials: LoginRequest]
  'update:tenantCode': [tenantCode: string]
  'open-recovery': []
}

export interface RecoveryFormProps {
  step: RecoveryStep
  busy: boolean
  feedback: AccessFeedback | null
  uncertain: boolean
}

export interface RecoveryIdentifySubmission {
  step: typeof RECOVERY_STEP.IDENTIFY
  request: RecoveryIdentifyRequest
}

export interface RecoveryCreateSubmission {
  step: typeof RECOVERY_STEP.CREATE_CODE
  request: RecoveryCreateRequest
}

export interface RecoveryCheckSubmission {
  step: typeof RECOVERY_STEP.CHECK_CODE
  request: RecoveryCheckRequest
}

export interface RecoveryChangeSubmission {
  step: typeof RECOVERY_STEP.CHANGE_PASSWORD
  request: RecoveryChangeRequest
}

export type RecoverySubmission =
  | RecoveryIdentifySubmission
  | RecoveryCreateSubmission
  | RecoveryCheckSubmission
  | RecoveryChangeSubmission

export interface RecoveryFormEmits {
  submit: [submission: RecoverySubmission]
  back: []
  restart: []
  cancel: []
}

export const RECOVERY_UNCERTAIN_OPERATION = {
  CREATE_CODE: 'create-code',
  CHANGE_PASSWORD: 'change-password',
} as const

export type RecoveryUncertainOperation =
  (typeof RECOVERY_UNCERTAIN_OPERATION)[keyof typeof RECOVERY_UNCERTAIN_OPERATION]

export interface RecoveryUncertainty {
  operation: RecoveryUncertainOperation
  attempt: number
}

export interface RecoveryFlowState {
  step: RecoveryStep
  attempt: number
  busy: boolean
  feedback: AccessFeedback | null
  uncertain: RecoveryUncertainty | null
}

export interface RecoveryActions {
  identify(request: RecoveryIdentifyRequest): Promise<AccessActionResult<RecoveryIdentifyResponse>>
  createCode(request: RecoveryCreateRequest): Promise<AccessActionResult<RecoveryCreateResponse>>
  checkCode(request: RecoveryCheckRequest): Promise<AccessActionResult<RecoveryCheckResponse>>
  changePassword(request: RecoveryChangeRequest): Promise<AccessActionResult<RecoveryChangeResponse>>
  /** Vuelve al paso anterior conservando los borradores ya escritos. */
  back(): void
  restart(): void
  cancel(): void
}

/** Contrato local del futuro flujo de recuperación; no contiene credenciales ni secretos. */
export interface RecoveryFlowContract extends RecoveryFlowState, RecoveryActions {}

export interface PasswordRequiredFormProps {
  busy: boolean
  logoutBusy: boolean
  feedback: AccessFeedback | null
  uncertain: boolean
}

export interface PasswordRequiredFormEmits {
  submit: [request: ChangeRequiredPasswordRequest]
  logout: []
}

export interface ContextSelectorProps {
  unitCodes: string[]
  activeUnitCode: string | null
  busy: boolean
  feedback: AccessFeedback | null
}

export interface ContextSelectorEmits {
  select: [organizationUnitCode: string]
}

export interface ContextViewProps {
  context: AuthContext | null
  status: SessionStatus
  tenantCode: string
  unitCodes: string[]
  activeUnitCode: string | null
  busy: SessionBusyState
  logoutBusy: boolean
  feedback: AccessFeedback | null
}

export interface ContextViewEmits {
  'capture-tenant': [tenantCode: string]
  'select-unit': [organizationUnitCode: string]
  'retry-context': []
  logout: []
}
