/** Requirement Tests — Tests for the AI project requirement model.
 *
 * Test cases:
 * - valid requirement
 * - invalid requirement
 * - missing required fields
 */

import { AIProjectRequirement } from '../requirement-model'
import { isValidRequirement, createRequirement } from '../requirement-model'

describe('AI Project Requirement', () => {
  describe('isValidRequirement', () => {
    it('should return true for a valid requirement with projectName', () => {
      const req: AIProjectRequirement = {
        projectName: 'Test Project',
      }
      expect(isValidRequirement(req)).toBe(true)
    })

    it('should return false for a requirement without projectName', () => {
      const req: AIProjectRequirement = {
        projectDescription: 'A test project',
      }
      expect(isValidRequirement(req)).toBe(false)
    })

    it('should return false for a requirement with empty projectName', () => {
      const req: AIProjectRequirement = {
        projectName: '',
      }
      expect(isValidRequirement(req)).toBe(false)
    })

    it('should return false for a requirement with whitespace-only projectName', () => {
      const req: AIProjectRequirement = {
        projectName: '   ',
      }
      expect(isValidRequirement(req)).toBe(false)
    })
  })

  describe('createRequirement', () => {
    it('should create a requirement with default timestamps', () => {
      const req = createRequirement({
        projectName: 'Test Project',
        projectDescription: 'A test project',
      })

      expect(req.projectName).toBe('Test Project')
      expect(req.projectDescription).toBe('A test project')
      expect(req.createdAt).toBeInstanceOf(Date)
      expect(req.updatedAt).toBeInstanceOf(Date)
      expect(req.requirementId).toBeDefined()
    })

    it('should allow overriding requirementId', () => {
      const req = createRequirement({
        projectName: 'Test Project',
        requirementId: 'custom-id-123',
      })

      expect(req.requirementId).toBe('custom-id-123')
    })

    it('should set organizationId when provided', () => {
      const req = createRequirement({
        projectName: 'Test Project',
        organizationId: 'org-123',
      })

      expect(req.organizationId).toBe('org-123')
    })
  })
})