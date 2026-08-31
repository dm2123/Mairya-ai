export enum NotificationType {
  LEAD_DISCOVERED = 'lead_discovered',
  RESEARCH_COMPLETED = 'research_completed',
  PROPOSAL_DRAFT = 'proposal_draft',
  PROPOSAL_APPROVED = 'proposal_approved',
  PROPOSAL_SENT = 'proposal_sent',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  QA_FAILED = 'qa_failed',
  SECURITY_ALERT = 'security_alert',
  MAINTENANCE_TICKET = 'maintenance_ticket',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum AuditEventType {
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  LEAD_CREATE = 'lead_create',
  LEAD_UPDATE = 'lead_update',
  LEAD_DELETE = 'lead_delete',
  PROJECT_CREATE = 'project_create',
  PROJECT_UPDATE = 'project_update',
  PROJECT_DELETE = 'project_delete',
  PROPOSAL_CREATE = 'proposal_create',
  PROPOSAL_APPROVE = 'proposal_approve',
  PROPOSAL_SEND = 'proposal_send',
  PAYMENT_CREATE = 'payment_create',
  PAYMENT_UPDATE = 'payment_update',
  DEPLOYMENT_CREATE = 'deployment_create',
  MAINTENANCE_CREATE = 'maintenance_create',
}

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  recipientId: string
  recipientType: 'user' | 'organization' | 'client'
  relatedId?: string
  relatedType?: string
  read: boolean
  createdAt: Date
}