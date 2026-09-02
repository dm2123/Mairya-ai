/** Human Approval Foundation — Backend policy/interface foundation for
 * human approval boundaries.
 *
 * P8 must establish approval boundaries.
 *
 * Before potentially destructive operations such as:
 * - deleting files
 * - changing architecture
 * - changing selected technology
 * - modifying protected configuration
 * - executing risky actions
 *
 * the system must be capable of requiring approval.
 *
 * Do not build the entire Founder Approval UI yet.
 * Create the backend policy/interface foundation.
 */

/** Approval Request — A request for human approval of an operation. */
export interface ApprovalRequest {
  /** Unique approval request ID. */
  approvalRequestId?: string
  /** Organization ID. */
  organizationId?: string
  /** User who requested the operation. */
  requestedBy?: string
  /** The operation being requested for approval. */
  operation: string
  /** Description of the operation. */
  description: string
  /** Related resource (file path, job ID, etc.). */
  resource?: string
  /** Related entity ID (job ID, project ID, etc.). */
  entityId?: string
  /** Required approval level. */
  approvalLevel: 'founder' | 'admin' | 'manager' | 'user'
  /** Status of the approval request. */
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  /** Created at timestamp. */
  createdAt?: Date
  /** Approved at timestamp. */
  approvedAt?: Date
  /** Rejected at timestamp. */
  rejectedAt?: Date
  /** Approver user ID (if approved). */
  approvedBy?: string
  /** Rejection reason (if rejected). */
  rejectionReason?: string
  /** Expiration timestamp. */
  expiresAt?: Date
}

/** Approval Decision — The result of an approval decision. */
export enum ApprovalDecision {
  Approved = 'approved',
  Rejected = 'rejected',
}

/** Approval Policy — Defines which operations require approval and at what level. */
export enum ApprovalLevel {
  Founder = 'founder',
  Admin = 'admin',
  Manager = 'manager',
  User = 'user',
}

/** Approval Policy Rules.
 *
 * Defines which operations require approval and at what level.
 * These are the backend policies - the UI can use these to build the approval interface.
 */
export const ApprovalPolicies: Record<string, { level: ApprovalLevel; required: boolean }> = {
  // File operations
  'file.create': { level: ApprovalLevel.User, required: false },
  'file.update': { level: ApprovalLevel.User, required: false },
  'file.delete': { level: ApprovalLevel.Founder, required: true },
  'file.overwrite_package_json': { level: ApprovalLevel.Founder, required: true },

  // Technology changes
  'technology.change': { level: ApprovalLevel.Founder, required: true },
  'framework.change': { level: ApprovalLevel.Founder, required: true },
  'language.change': { level: ApprovalLevel.Founder, required: true },

  // Architecture changes
  'architecture.change': { level: ApprovalLevel.Founder, required: true },
  'project_plan.change': { level: ApprovalLevel.Admin, required: true },

  // Generative AI operations
  'generation.request': { level: ApprovalLevel.User, required: false },
  'generation.validate': { level: ApprovalLevel.User, required: false },
  'generation.accept': { level: ApprovalLevel.Founder, required: true },

  // Configuration changes
  'configuration.manage': { level: ApprovalLevel.Admin, required: true },

  // Organization-level operations
  'organization.manage': { level: ApprovalLevel.Founder, required: true },
}

/** Checks if an operation requires approval. */
export function requiresApproval(operation: string): boolean {
  const policy = ApprovalPolicies[operation]
  return policy ? policy.required : false
}

/** Gets the required approval level for an operation. */
export function getApprovalLevel(operation: string): ApprovalLevel {
  const policy = ApprovalPolicies[operation]
  return policy ? policy.level : ApprovalLevel.User
}

/** Checks if a user at a given approval level can approve an operation. */
export function canApprove(
  userLevel: ApprovalLevel,
  operation: string
): boolean {
  const requiredLevel = getApprovalLevel(operation)
  // Simplified: user can approve if their level >= required level
  const levelHierarchy: Record<ApprovalLevel, number> = {
    [ApprovalLevel.User]: 1,
    [ApprovalLevel.Manager]: 2,
    [ApprovalLevel.Admin]: 3,
    [ApprovalLevel.Founder]: 4,
  }

  return levelHierarchy[userLevel] >= levelHierarchy[requiredLevel]
}

/** Record an approval decision. */
export function recordApproval(
  approvalRequestId: string,
  decision: ApprovalDecision,
  approvedBy: string,
  rejectionReason?: string
): {
  approvalRequestId: string
  decision: ApprovalDecision
  approvedBy: string
  rejectionReason?: string
  timestamp: Date
} {
  const now = new Date()
  return {
    approvalRequestId,
    decision,
    approvedBy,
    rejectionReason,
    timestamp: now,
  }
}

/** Validates that an approval request is still valid (not expired). */
export function isApprovalValid(
  approvalRequest: ApprovalRequest
): boolean {
  if (!approvalRequest.expiresAt) {
    return true // No expiration, always valid
  }

  const now = new Date()
  return now <= approvalRequest.expiresAt
}