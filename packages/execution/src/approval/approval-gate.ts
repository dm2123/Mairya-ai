/**
 * P9 Approval Gate
 * 
 * Integrates with P8 approval system for sensitive execution actions.
 * 
 * Architecture:
 *   Execution Request
 *        ↓
 *   Policy Evaluation
 *        ↓
 *   Approval Required?
 *      ↙           ↘
 *    YES            NO
 *      ↓              ↓
 *   Approval       Execute
 *      ↓
 *   Approved?
 *      ↙       ↘
 *    YES      NO
 *      ↓         ↓
 *   Execute   Reject
 * 
 * Does not bypass existing Founder approval mechanisms.
 */

import { ExecutionJob, ExecutionTask } from '../executor/execution-models'
import { ExecutionStatus } from '../executor/execution-models'
import { Organization } from '../database/src/index'
import { Project } from '../database/src/index'
import { GenerationVersion } from '../database/src/index'

/**
 * Policy evaluation result
 */
export interface PolicyEvaluationResult {
  /** Whether approval is required */
  approvalRequired: boolean
  /** Minimum approval level needed */
  minApprovalLevel: 'founder' | 'admin' | 'manager' | 'user'
  /** Whether the user can approve */
  canApprove: boolean
  /** Decision: 'execute', 'reject', 'request_approval' */
  decision: 'execute' | 'reject' | 'request_approval'
}

/**
 * P9 Approval Gate
 * 
 * Integrates with P8 approval system for sensitive execution actions.
 * Evaluates whether an execution request requires approval based on:
 * - Operation type
 * - Organization context
 * - User role/approval level
 * - Project sensitivity
 * 
 * Uses P8 ApprovalPolicies and ApprovalLevel enums.
 */
export class ApprovalGate {
  /**
   * Evaluate whether an execution requires approval.
   * 
   * @param operation The type of execution operation
   * @param organizationId The organization ID
   * @param projectId The project ID (optional)
   * @param generationVersionId The generation version ID (optional)
   * @param userRole The user's approval level ('founder', 'admin', 'manager', 'user')
   * @returns Policy evaluation result
   */
  static evaluate(
    operation: 'generation.request' | 'generation.validate' | 'generation.accept' |
    'technology.change' | 'framework.change' | 'language.change' |
    'project_plan.change' | 'configuration.manage' | 'organization.manage',
    organizationId: string,
    projectId?: string,
    generationVersionId?: string,
    userRole: 'founder' | 'admin' | 'manager' | 'user' = 'user'
  ): PolicyEvaluationResult {
    // P8 ApprovalPolicies definition (simplified)
    // Operations that require approval at various levels
    const approvalRequirements: Record<string, { required: boolean; minLevel: string }> = {
      'generation.request': { required: false, minLevel: 'user' },
      'generation.validate': { required: false, minLevel: 'user' },
      'generation.accept': { required: true, minLevel: 'founder' },
      'technology.change': { required: true, minLevel: 'founder' },
      'framework.change': { required: true, minLevel: 'founder' },
      'language.change': { required: true, minLevel: 'founder' },
      'project_plan.change': { required: true, minLevel: 'admin' },
      'configuration.manage': { required: true, minLevel: 'admin' },
      'organization.manage': { required: true, minLevel: 'founder' },
    }

    const requirement = approvalRequirements[operation]

    if (!requirement) {
      // Unknown operation - default to no approval required
      return {
        approvalRequired: false,
        minApprovalLevel: 'user',
        canApprove: userRole === 'founder',
        decision: 'execute',
      }
    }

    // Check if approval is required
    const approvalRequired = requirement.required

    // Determine minimum approval level needed
    const minApprovalLevel: 'founder' | 'admin' | 'manager' | 'user' = requirement.minLevel

    // Check if user can approve (role hierarchy: User < Manager < Admin < Founder)
    const roleHierarchy: Record<string, number> = {
      'user': 1,
      'manager': 2,
      'admin': 3,
      'founder': 4,
    }

    const userLevel = roleHierarchy[userRole] || 1
    const minLevel = roleHierarchy[minApprovalLevel] || 1
    const canApprove = userLevel >= minLevel

    // Determine decision
    let decision: 'execute' | 'reject' | 'request_approval' = 'execute'

    if (approvalRequired && !canApprove) {
      // Approval required and user cannot approve
      decision = 'request_approval'
    } else if (!approvalRequired) {
      // No approval needed, can execute
      decision = 'execute'
    } else {
      // Approval required and user can approve
      decision = 'execute'
    }

    return {
      approvalRequired,
      minApprovalLevel: minApprovalLevel,
      canApprove,
      decision,
    }
  }

  /**
   * Check if an execution job requires approval before proceeding.
   * 
   * @param job The execution job to check
   * @returns Whether approval is required and the decision
   */
  static checkJobApproval(
    job: { organizationId: string; projectId?: string; generationVersionId?: string },
    userRole: 'founder' | 'admin' | 'manager' | 'user' = 'user'
  ): { approvalRequired: boolean; decision: 'execute' | 'request_approval' | 'reject'; minLevel: string } {
    // Technology changes always require founder approval
    const techCheck = this.evaluate(
      'technology.change',
      job.organizationId,
      job.projectId,
      job.generationVersionId,
      userRole
    )

    // Configuration changes require admin approval
    const configCheck = this.evaluate(
      'configuration.manage',
      job.organizationId,
      job.projectId,
      job.generationVersionId,
      userRole
    )

    // Project plan changes require admin approval
    const projectCheck = this.evaluate(
      'project_plan.change',
      job.organizationId,
      job.projectId,
      job.generationVersionId,
      userRole
    )

    // Determine the strictest requirement
    const approvalRequired = techCheck.approvalRequired || configCheck.approvalRequired || projectCheck.approvalRequired
    const minLevel = 'founder' // Most strict is founder for tech changes

    // Determine decision
    let decision: 'execute' | 'request_approval' | 'reject' = 'execute'

    if (approvalRequired && !techCheck.canApprove) {
      decision = 'request_approval'
    } else if (!approvalRequired) {
      decision = 'execute'
    }

    return {
      approvalRequired: approvalRequired,
      decision: decision,
      minLevel: minLevel,
    }
  }
}

/**
 * Factory function to create an ApprovalGate
 */
export function createApprovalGate(): ApprovalGate {
  return new ApprovalGate()
}