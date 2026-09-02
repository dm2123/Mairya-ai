/** Technology Selector Tests — Tests for the technology selection layer.
 *
 * Test cases:
 * - Python/FastAPI selection
 * - Java/Spring Boot selection
 * - TypeScript/Next.js selection
 * - unsupported combination
 * - deterministic fallback
 */

import { selectTechnologyStack, isValidCombination } from '../technology-selector'
import { ProjectType, LanguageId, FrameworkId } from '../factory/src/project-types'

describe('Technology Selector', () => {
  describe('selectTechnologyStack', () => {
    it('should select Python FastAPI for backend project type', () => {
      const result = selectTechnologyStack(ProjectType.BACKEND)
      expect(result.language).toBe('python')
      expect(result.framework).toBe('fastapi')
    })

    it('should select TypeScript Next.js for web project type', () => {
      const result = selectTechnologyStack(ProjectType.WEB)
      expect(result.language).toBe('typescript')
      expect(result.framework).toBe('nextjs')
    })

    it('should respect user-specified language and framework', () => {
      const result = selectTechnologyStack(
        ProjectType.SOFTWARE,
        'python',
        'fastapi'
      )
      expect(result.language).toBe('python')
      expect(result.framework).toBe('fastapi')
    })

    it('should fall back when specified framework is incompatible', () => {
      // Specifying Java framework for Python project type should fall back
      const result = selectTechnologyStack(ProjectType.WEB, 'python', 'spring_boot')
      expect(result.language).toBe('python')
      // spring_boot is not in Python's supported frameworks, so it should fall back
      expect(result.framework).not.toBe('spring_boot')
    })

    it('should fall back when specified language is unknown', () => {
      const result = selectTechnologyStack(ProjectType.BACKEND, 'unknown_language', 'fastapi')
      expect(result.language).not.toBe('unknown_language')
      expect(result.framework).not.toBe('fastapi')
    })
  })

  describe('isValidCombination', () => {
    it('should return true for valid Python + FastAPI + backend combination', () => {
      const result = isValidCombination(
        'python',
        'fastapi' as FrameworkId,
        ProjectType.BACKEND
      )
      expect(result).toBe(true)
    })

    it('should return true for valid TypeScript + Next.js + web combination', () => {
      const result = isValidCombination(
        'typescript' as LanguageId,
        'nextjs' as FrameworkId,
        ProjectType.WEB
      )
      expect(result).toBe(true)
    })

    it('should return false for invalid combination', () => {
      const result = isValidCombination(
        'python',
        'spring_boot' as FrameworkId,
        ProjectType.WEB
      )
      expect(result).toBe(false)
    })
  })
})