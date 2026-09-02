/** Human Approval Tests — Tests for the human approval foundation.
 *
 * Test cases:
 * - approval requires founder level
 * - approval decision recording
 * - approval validity check
 * - permission hierarchy
 */

import { ApprovalRequest, ApprovalDecision, ApprovalLevel } from '../human-approval'
import { recordApproval, isApprovalValid, requiresApproval, getApprovalLevel, canApprove } from '../human-approval'

describe('Human Approval', () => {
  describe('Approval Levels', () => {
    it('should define approval levels', () => {
      expect(ApprovalLevel.User).toBe('user')
      expect(ApprovalLevel.Manager).toBe('manager')
      expect(ApprovalLevel.Admin).toBe('admin')
      expect(ApprovalLevel.Founder).toBe('founder')
    })

    it('should check if operation requires approval', () => {
      // file.delete requires founder approval
      expect(requiresApproval('file.delete')).toBe(true)
      expect(getApprovalLevel('file.delete')).toBe(ApprovalLevel.Founder)

      // file.create does not require approval
      expect(requiresApproval('file.create')).toBe(false)
    })

    it('should check permission hierarchy', () => {
      // Founder can approve everything
      expect(canApprove(ApprovalLevel.Founder, 'file.delete')).toBe(true)
      expect(canApprove(ApprovalLevel.Founder, 'technology.change')).toBe(true)

      // Admin can approve manager-level operations
      expect(canApprove(ApprovalLevel.Admin, 'file.delete')).toBe(false) // Founder-only
      expect(canApprove(ApprovalLevel.Admin, 'architecture.change')).toBe(true) // Admin can

      // User can only approve user-level operations
      expect(canApprove(ApprovalLevel.User, 'file.create')).toBe(true) // Not required, but can
    })
  })

  describe('Approval Request', () => {
    it('should create an approval request', () => {
      const request: ApprovalRequest = {
        operation: 'file.delete',
        description: 'Delete sensitive file',
        approvalLevel: ApprovalLevel.Founder,
        status: 'pending',
        organizationId: 'org-123',
        requestedBy: 'user-1',
      }

      expect(request.operation).toBe('file.delete')
      expect(request.approvalLevel).toBe(ApprovalLevel.Founder)
      expect(request.status).toBe('pending')
    })

    it('should record an approval decision', () => {
      const result = recordApproval(
        'req-123',
        ApprovalDecision.Approved,
        'founder-1',
        undefined
      )

      expect(result.approvalRequestId).toBe('req-123')
      expect(result.decision).toBe(ApprovalDecision.Approved)
      expect(result.approvedBy).toBe('founder-1')
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('should record a rejection decision', () => {
      const result = recordApproval(
        'req-456',
        ApprovalDecision.Rejected,
        'founder-1',
        'Security concern'
      )

      expect(result.approvalRequestId).toBe('req-456')
      expect(result.decision).toBe(ApprovalDecision.Rejected)
      expect(result.approvedBy).toBe('founder-1')
      expect(result.rejectionReason).toBe('Security concern')
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('should check if approval is valid (not expired)', () => {
      const validRequest: ApprovalRequest = {
        operation: 'file.delete',
        description: 'Delete file',
        approvalLevel: ApprovalLevel.Founder,
        status: 'pending',
        organizationId: 'org-123',
        requestedBy: 'user-1',
        // No expiresAt - should be always valid
      }

      const expiredRequest: ApprovalRequest = {
        operation: 'file.delete',
        description: 'Delete file',
        approvalLevel: ApprovalLevel.Founder,
        status: 'pending',
        organizationId: 'org-123',
        requestedBy: 'user-1',
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
      }

      expect(isApprovalValid(validRequest)).toBe(true)
      expect(isApprovalValid(expiredRequest)).toBe(false)
    })
  })
})