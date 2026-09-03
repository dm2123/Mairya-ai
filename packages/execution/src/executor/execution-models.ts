export enum ExecutionStatus {
  CREATED = 'created',
  QUEUED = 'queued',
  PREPARING = 'preparing',
  RUNNING = 'running',
  BUILDING = 'building',
  TESTING = 'testing',
  SECURITY_CHECK = 'security_check',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCEL_REQUESTED = 'cancel_requested',
  CANCELLED = 'cancelled',
}

export interface ExecutionJob {
  id: string
  organizationId: string
  projectId: string | null
  generationVersionId: string | null
  status: ExecutionStatus
  priority: number
  createdBy: string | null
  startedAt: Date | null
  completedAt: Date | null
  failedAt: Date | null
  cancelledAt: Date | null
  progress: number
  errorCode: string | null
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ExecutionTask {
  id: string
  executionJobId: string
  generationTaskId: string | null
  status: ExecutionStatus
  attempt: number
  maxAttempts: number
  dependencies: string[]
  startedAt: Date | null
  completedAt: Date | null
  exitCode: number | null
  errorCode: string | null
  errorMessage: string | null
}