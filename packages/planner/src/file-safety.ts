/** File Safety — Workspace validation for generated files.
 *
 * Blocks:
 * - path traversal (..)
 * - absolute paths
 * - writes outside project workspace
 * - protected system paths
 * - unexpected file extensions where policy forbids them
 *
 * Do not allow generated code to modify Maurya AI core source unless explicitly authorized.
 */

/** Validates that a file path is within the allowed workspace. */
export function isPathWithinWorkspace(filePath: string, workspaceRoot: string): boolean {
  // Normalize both paths
  const normalizedPath = normalizePath(filePath)
  const normalizedRoot = normalizePath(workspaceRoot)

  // Check if the path starts with the workspace root
  return normalizedPath.startsWith(normalizedRoot)
}

/** Normalizes a path - makes it consistent for comparison. */
function normalizePath(path: string): string {
  // Replace backslashes with forward slashes for consistency
  let normalized = path.replace(/\\/g, '/')

  // Remove leading slash if present (for relative comparison)
  if (normalized.startsWith('/')) {
    normalized = normalized.slice(1)
  }

  // Collapse multiple slashes
  normalized = normalized.replace(/\/+/g, '/')

  return normalized
}

/** Checks for path traversal patterns. */
export function hasPathTraversal(filePath: string): boolean {
  // Check for .. in the path
  const normalized = normalizePath(filePath)
  return normalized.includes('/..') || normalized.startsWith('..')
}

/** Checks if the path is an absolute path. */
export function isAbsolutePath(filePath: string): boolean {
  return filePath.startsWith('/') || filePath.startsWith('\\') || filePath.match(/^[A-Za-z]:\\/i) !== null
}

/** Checks if the path writes to a protected system directory. */
export function isProtectedPath(filePath: string): boolean {
  const protectedPrefixes = [
    'node_modules',
    '.git',
    'package',
    'system32',
    'windows',
    '/etc',
    '/usr',
    '/var',
    '/proc',
    '/sys',
  ]

  const normalized = normalizePath(filePath).toLowerCase()

  return protectedPrefixes.some((prefix) => normalized.includes(prefix.toLowerCase()))
}

/** Checks if the file extension is allowed for the given language/framework. */
export function isFileExtensionAllowed(
  filePath: string,
  language: string,
  framework: string | null
): boolean {
  const extension = getFileExtension(filePath)

  // Language-specific extension rules
  const allowedExtensions: Record<string, string[]> = {
    python: ['.py', '.txt', '.md', '.cfg', '.ini'],
    typescript: ['.ts', '.js', '.json', '.md', '.txt'],
    javascript: ['.js', '.json', '.md', '.txt'],
    java: ['.java', '.xml', '.properties', '.gradle', '.md'],
  }

  const extensions = allowedExtensions[language] || allowedTypes

  // Check if extension is in the allowed list
  if (extensions.includes(extension)) {
    return true
  }

  // Additional check: if framework is specified, may have additional rules
  if (framework) {
    // For FastAPI, allow .py files
    if (framework === 'fastapi' && language === 'python') {
      return extension === '.py'
    }
    // For Next.js, allow .ts, .js, .json, .md
    if (framework === 'nextjs' && (language === 'typescript' || language === 'javascript')) {
      return ['.ts', '.js', '.json', '.md', '.txt'].includes(extension)
    }
  }

  // Default: extension not explicitly allowed
  return false
}

/** Gets the file extension from a file path. */
function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.([^.]+)$/)
  return match ? `.${match[1]}` : ''
}

/** Safe file creation - validates before "creating" a file.
 *
 * In a real implementation, this would use fs operations with validation.
 * For now, it validates and returns whether the operation would be safe.
 */
export function validateFileCreation(
  filePath: string,
  workspaceRoot: string,
  language: string,
  framework: string | null
): {
  safe: boolean
  reason?: string
} {
  // 1. Check for path traversal
  if (hasPathTraversal(filePath)) {
    return { safe: false, reason: 'Path traversal detected: ../ in file path' }
  }

  // 2. Check for absolute paths
  if (isAbsolutePath(filePath)) {
    return { safe: false, reason: 'Absolute path detected: cannot write to absolute path' }
  }

  // 3. Check if path is within workspace
  if (!isPathWithinWorkspace(filePath, workspaceRoot)) {
    return { safe: false, reason: 'File path outside workspace detected' }
  }

  // 4. Check for protected paths
  if (isProtectedPath(filePath)) {
    return { safe: false, reason: 'Protected system path detected' }
  }

  // 5. Check file extension is allowed
  if (!isFileExtensionAllowed(filePath, language, framework)) {
    return {
      safe: false,
      reason: `File extension not allowed for ${language} + ${framework || 'no framework'}`,
    }
  }

  // 6. Check for protected system files
  const basename = filePath.split('/').pop()
  if (basename === 'package.json' || basename === 'package-lock.json') {
    return {
      safe: false,
      reason: 'Cannot overwrite package.json or package-lock.json',
    }
  }

  return { safe: true }
}

/** Safe file update - validates before updating a file. */
export function validateFileUpdate(
  filePath: string,
  workspaceRoot: string,
  language: string,
  framework: string | null,
  existingContent?: string
): {
  safe: boolean
  reason?: string
} {
  // Same validation as creation, plus check if file exists
  const creationValidation = validateFileCreation(filePath, workspaceRoot, language, framework)
  if (!creationValidation.safe) {
    return creationValidation
  }

  // Additional: check that we're not trying to replace a critical file
  // with incompatible content (basic check)
  if (existingContent) {
    // In a real implementation, we'd verify compatibility
    // For now, just ensure the path is still valid
  }

  return { safe: true }
}