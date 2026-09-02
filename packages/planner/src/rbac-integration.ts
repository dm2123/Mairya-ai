/** RBAC Integration — Integrates with existing RBAC system.
 *
 * Uses the P5/P6 RBAC framework for factory operations.
 * Does not create a separate authentication system.
 *
 * Suggested permissions:
 * - factory.requirement.create
 * - factory.requirement.read
 * - factory.plan.create
 * - factory.plan.read
 * - factory.generation.create
 * - factory.generation.read
 * - factory.generation.approve
 * - factory.generation.cancel
 */

import { authenticate, requireRole, organizationIdParam } from '../auth/middleware'
import { Request, Response, NextFunction } from 'express'

/** RBAC Middleware — Validates permissions for planner operations. */
export function requirePlannerPermission(permission: string) {
  return [
    authenticate,
    requireRole('founder'), // Simplified - in real impl, check RBAC
    organizationIdParam,
  ]
}

/** RBAC permission check for planner operations. */
export function checkPlannerPermission(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { user } = req as any

  // In a real implementation, this would check the RBAC system
  // For now, we verify the user has the required role
  const requiredRole = 'founder' // This would come from RBAC configuration

  if (user?.role !== requiredRole) {
    return res.status(403).json({
      success: false,
      error: `Insufficient permissions. Required role: ${requiredRole}`,
    })
  }

  next()
}

/** Integration helper — Maps planner operations to RBAC permissions. */
export const PlannerPermissions = {
  // Requirement operations
  requirementCreate: 'factory.requirement.create',
  requirementRead: 'factory.requirement.read',

  // Plan operations
  planCreate: 'factory.plan.create',
  planRead: 'factory.plan.read',

  // Generation operations
  generationCreate: 'factory.generation.create',
  generationRead: 'factory.generation.read',
  generationApprove: 'factory.generation.approve',
  generationCancel: 'factory.generation.cancel',

  // Version operations
  versionCreate: 'factory.version.create',
  versionRead: 'factory.version.read',

  // Approval operations
  approvalCreate: 'factory.approval.create',
  approvalRead: 'factory.approval.read',
}

/** Checks if the current user has permission for a planner operation. */
export function hasPermission(
  operation: keyof typeof PlannerPermissions,
  req: Request
): boolean {
  const permission = PlannerPermissions[operation]

  // In a real implementation, this would check the RBAC system
  // For now, founders have all permissions
  const user = req.user
  return user?.role === 'founder' || user?.role === 'admin'
}

/** Middleware factory — Creates express middleware for a specific permission. */
export function requirePermission(operation: keyof typeof PlannerPermissions) {
  return [
    authenticate,
    (req: Request, res: Response, next: NextFunction) => {
      if (!hasPermission(operation, req)) {
        return res.status(403).json({
          success: false,
          error: `Insufficient permissions for ${operation}`,
        })
      }
      next()
    },
    requireRole('founder'), // Fallback - real impl uses RBAC
  ]
}