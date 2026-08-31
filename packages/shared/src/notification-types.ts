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
  DEPLOYMENT_READY = 'deployment_ready',
  MAINTENANCE_TICKET = 'maintenance_ticket',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  recipientId: string
  recipientType: 'user' | 'organization' | 'client'
  relatedId?: string // id of related resource (lead, proposal, project, etc.)
  relatedType?: string
  read: boolean
  createdAt: Date
}