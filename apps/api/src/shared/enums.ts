export enum StatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ARCHIVED = 'archived',
}

export enum RoleEnum {
  FOUNDER = 'founder',
  MANAGER = 'manager',
  CLIENT = 'client',
  AGENT = 'agent',
}

export enum ProjectState {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

export enum AgentState {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BLOCKED = 'blocked',
}

export enum DeploymentState {
  PENDING = 'pending',
  PREVIEW = 'preview',
  PRODUCTION = 'production',
  ROLLED_BACK = 'rolled_back',
  FAILED = 'failed',
}