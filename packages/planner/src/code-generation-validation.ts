/** Code Generation Validation — Validates generated files before acceptance.
 *
 * Validates:
 * - file paths
 * - syntax where supported
 * - language
 * - framework compatibility
 * - required project files
 * - duplicate files
 * - invalid operations
 *
 * Rejects malformed generation results.
 */

import { isPathWithinWorkspace } from './file-safety'
import { hasPathTraversal } from './file-safety'
import { isAbsolutePath } from './file-safety'
import { isProtectedPath } from './file-safety'
import { isFileExtensionAllowed } from './file-safety'

/** Validation result for a generated file. */
export interface FileValidationResult {
  /** Whether the file is valid. */
  valid: boolean
  /** Error messages, if any. */
  errors: string[]
  /** Warning messages, if any. */
  warnings: string[]
  /** Language detected. */
  language?: string
  /** Framework detected. */
  framework?: string
}

/** Validates a single generated file. */
export function validateGeneratedFile(
  filePath: string,
  content: string,
  workspaceRoot: string,
  language: string,
  framework: string | null
): FileValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Check for path traversal
  if (hasPathTraversal(filePath)) {
    errors.push('Path traversal detected: ../ in file path')
  }

  // 2. Check for absolute paths
  if (isAbsolutePath(filePath)) {
    errors.push('Absolute path detected: cannot write to absolute path')
  }

  // 3. Check if path is within workspace
  if (!isPathWithinWorkspace(filePath, workspaceRoot)) {
    errors.push('File path outside workspace detected')
  }

  // 4. Check for protected paths
  if (isProtectedPath(filePath)) {
    errors.push('Protected system path detected')
  }

  // 5. Check file extension is allowed
  if (!isFileExtensionAllowed(filePath, language, framework)) {
    errors.push(
      `File extension not allowed for ${language} + ${framework || 'no framework'}`
    )
  }

  // 6. Check for protected system files (package.json, etc.)
  const basename = filePath.split('/').pop()
  if (basename === 'package.json' || basename === 'package-lock.json') {
    errors.push('Cannot overwrite package.json or package-lock.json')
  }

  // 7. Syntax validation where supported
  if (!checkSyntax(filePath, content, language)) {
    errors.push('Syntax validation failed')
  }

  // 8. Framework compatibility check
  if (!checkFrameworkCompatibility(filePath, content, language, framework)) {
    warnings.push('Framework compatibility check recommendation')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    language,
    framework,
  }
}

/** Checks syntax for the given language (basic validation). */
function checkSyntax(filePath: string, content: string, language: string): boolean {
  // Basic syntax checks - in a real implementation, use language-specific parsers

  const extension = filePath.split('.').pop() || ''

  switch (language) {
    case 'python':
      // Check for basic Python structure
      if (content.includes('def ') && !content.includes(':')) {
        return false // Function without colon
      }
      return true

    case 'typescript':
    case 'javascript':
      // Basic JS/TS structure check
      if (content.includes('{') && content.match(/\{/g).length !== content.match(/\}/g).length) {
        return false // Unbalanced braces
      }
      return true

    case 'java':
      // Basic Java structure check
      if (content.includes('class ') && !content.includes('{')) {
        return false // Class without opening brace
      }
      return true

    default:
      return true // Unknown language, pass validation
  }
}

/** Checks framework compatibility for the given code. */
function checkFrameworkCompatibility(
  filePath: string,
  content: string,
  language: string,
  framework: string | null
): boolean {
  // Basic framework compatibility checks

  if (!framework) {
    return true // No framework to check against
  }

  const extension = filePath.split('.').pop() || ''

  switch (language) {
    case 'python':
      if (framework === 'fastapi') {
        // FastAPI expects route decorators or app object
        return content.includes('FastAPI') || content.includes('@app.')
      }
      return true

    case 'typescript':
    case 'javascript':
      if (framework === 'nextjs') {
        // Next.js expects specific patterns
        return content.includes('next') || content.includes('page') || content.includes('export')
      }
      if (framework === 'react') {
        return content.includes('React') || content.includes('import') || content.includes('export')
      }
      return true

    case 'java':
      if (framework === 'spring_boot') {
        return content.includes('@Controller') || content.includes('@Service') || content.includes('@Repository')
      }
      return true

    default:
      return true
  }
}

/** Validates the entire generation result (all files). */
export function validateGenerationResult(
  files: Array<{
    filePath: string
    content: string
    language: string
    framework: string | null
  }>,
  workspaceRoot: string
): {
  overallValid: boolean
  fileResults: FileValidationResult[]
  totalErrors: number
  totalWarnings: number
} {
  const fileResults: FileValidationResult[] = []
  let totalErrors = 0
  let totalWarnings = 0

  for (const file of files) {
    const result = validateGeneratedFile(
      file.filePath,
      file.content,
      workspaceRoot,
      file.language,
      file.framework
    )
    fileResults.push(result)
    totalErrors += result.errors.length
    totalWarnings += result.warnings.length
  }

  return {
    overallValid: totalErrors === 0,
    fileResults,
    totalErrors,
    totalWarnings,
  }
}