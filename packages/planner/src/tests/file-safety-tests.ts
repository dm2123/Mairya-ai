/** File Safety Tests — Tests for workspace validation.
 *
 * Test cases:
 * - path traversal blocked
 * - absolute paths blocked
 * - writes outside workspace blocked
 * - protected paths blocked
 * - allowed extensions
 */

import { isPathWithinWorkspace, hasPathTraversal, isAbsolutePath, isProtectedPath, isFileExtensionAllowed, validateFileCreation } from '../file-safety'

describe('File Safety', () => {
  const workspaceRoot = '/workspace/project'

  describe('isPathWithinWorkspace', () => {
    it('should return true for paths within workspace', () => {
      expect(isPathWithinWorkspace('/workspace/project/src/file.ts', '/workspace/project')).toBe(true)
      expect(isPathWithinWorkspace('src/file.ts', '/workspace/project')).toBe(true) // relative
    })

    it('should return false for paths outside workspace', () => {
      expect(isPathWithinWorkspace('/other/project/src/file.ts', '/workspace/project')).toBe(false)
      expect(isPathWithinWorkspace('/workspace/other/project.ts', '/workspace/project')).toBe(false)
    })
  })

  describe('hasPathTraversal', () => {
    it('should detect path traversal', () => {
      expect(hasPathTraversal('/workspace/project/src/../etc/passwd')).toBe(true)
      expect(hasPathTraversal('/workspace/project/../../etc/passwd')).toBe(true)
    })

    it('should return false for normal paths', () => {
      expect(hasPathTraversal('/workspace/project/src/file.ts')).toBe(false)
      expect(hasPathTraversal('/workspace/project/config.json')).toBe(false)
    })
  })

  describe('isAbsolutePath', () => {
    it('should detect absolute paths', () => {
      expect(isAbsolutePath('/workspace/project/src/file.ts')).toBe(true)
      expect(isAbsolutePath('C:\\workspace\\project\\src\\file.ts')).toBe(true)
    })

    it('should return false for relative paths', () => {
      expect(isAbsolutePath('src/file.ts')).toBe(false)
      expect(isAbsolutePath('file.ts')).toBe(false)
    })
  })

  describe('isProtectedPath', () => {
    it('should detect protected paths', () => {
      expect(isProtectedPath('/workspace/project/node_modules/hack.ts')).toBe(true)
      expect(isProtectedPath('/workspace/project/.git/config')).toBe(true)
    })

    it('should return false for normal paths', () => {
      expect(isProtectedPath('/workspace/project/src/file.ts')).toBe(false)
    })
  })

  describe('isFileExtensionAllowed', () => {
    it('should allow Python extensions', () => {
      expect(isFileExtensionAllowed('/workspace/project/main.py', 'python', 'fastapi')).toBe(true)
      expect(isFileExtensionAllowed('/workspace/project/requirements.txt', 'python', 'fastapi')).toBe(true)
    })

    it('should allow TypeScript extensions', () => {
      expect(isFileExtensionAllowed('/workspace/project/src/app.ts', 'typescript', 'nextjs')).toBe(true)
      expect(isFileExtensionAllowed('/workspace/project/package.json', 'typescript', 'nextjs')).toBe(true)
    })

    it('should block disallowed extensions', () => {
      expect(isFileExtensionAllowed('/workspace/project/exe.exe', 'python', 'fastapi')).toBe(false)
      expect(isFileExtensionAllowed('/workspace/project/sh', 'typescript', 'nextjs')).toBe(false)
    })
  })

  describe('validateFileCreation', () => {
    it('should validate safe file creation', () => {
      const result = validateFileCreation(
        '/workspace/project/src/file.ts',
        '/workspace/project',
        'typescript',
        'nextjs'
      )
      expect(result.safe).toBe(true)
    })

    it('should reject path traversal', () => {
      const result = validateFileCreation(
        '/workspace/project/src/../etc/passwd',
        '/workspace/project',
        'typescript',
        'nextjs'
      )
      expect(result.safe).toBe(false)
      expect(result.reason).toContain('Path traversal')
    })

    it('should reject absolute paths', () => {
      const result = validateFileCreation(
        'C:\\workspace\\project\\src\\file.ts',
        '/workspace/project',
        'typescript',
        'nextjs'
      )
      expect(result.safe).toBe(false)
      expect(result.reason).toContain('Absolute path')
    })

    it('should reject paths outside workspace', () => {
      const result = validateFileCreation(
        '/other/project/src/file.ts',
        '/workspace/project',
        'typescript',
        'nextjs'
      )
      expect(result.safe).toBe(false)
      expect(result.reason).toContain('outside workspace')
    })

    it('should reject protected paths', () => {
      const result = validateFileCreation(
        '/workspace/project/node_modules/malware.js',
        '/workspace/project',
        'typescript',
        'nextjs'
      )
      expect(result.safe).toBe(false)
      expect(result.reason).toContain('Protected')
    })

    it('should reject disallowed extensions', () => {
      const result = validateFileCreation(
        '/workspace/project/exe.exe',
        '/workspace/project',
        'python',
        'fastapi'
      )
      expect(result.safe).toBe(false)
      expect(result.reason).toContain('extension')
    })

    it('should allow valid file creation', () => {
      const result = validateFileCreation(
        '/workspace/project/src/main.ts',
        '/workspace/project',
        'typescript',
        'nextjs'
      )
      expect(result.safe).toBe(true)
    })
  })
})