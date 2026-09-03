/**
 * P9 Workspace Manager
 * 
 * Creates isolated project workspaces for execution.
 * Enforces path traversal protection, organization isolation,
 * and validates all filesystem operations stay within bounds.
 * 
 * Workspace structure:
 *   workspace/
 *     organization/
 *       project/
 *         generation/
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

import { ExecutionStatus, ExecutionJob, ExecutionTask } from '../executor/execution-models'
import { ExecutionQueue } from '../queue/execution-queue'

/**
 * Workspace root base path.
 * Should be configured via the configuration system.
 * Defaults to a temporary directory for development.
 */
const WORKSPACE_BASE = process.env.WORKSPACE_BASE || path.join(os.tmpdir(), 'mairya-ai-workspaces')

/**
 * Validate and create an isolated workspace for an execution.
 * 
 * @param organizationId Organization identifier
 * @param projectId Project identifier (optional)
 * @param generationVersionId Generation version identifier
 * @returns Workspace path object with validated paths
 * @throws Error if path is invalid or escapes workspace bounds
 */
export function createWorkspace(
  organizationId: string,
  projectId: string | null,
  generationVersionId: string | null
): {
  workspacePath: string
  organizationPath: string
  projectPath: string | null
  generationPath: string | null
  safeBase: string
} {
  // Normalize organization ID - validate it doesn't contain path separators
  const orgId = sanitizeOrganizationId(organizationId)

  // Build workspace paths
  const orgPath = path.join(WORKSPACE_BASE, orgId)
  let projectPath: string | null = null
  let generationPath: string | null = null

  if (projectId) {
    const projId = sanitizeProjectId(projectId)
    projectPath = path.join(orgPath, projId)
    generationPath = path.join(projectPath, 'generation')
  } else {
    generationPath = path.join(orgPath, 'generation')
  }

  // Ensure the base workspace directory exists
  if (!fs.existsSync(WORKSPACE_BASE)) {
    fs.mkdirSync(WORKSPACE_BASE, { recursive: true })
  }

  // Ensure organization path exists
  if (!fs.existsSync(orgPath)) {
    fs.mkdirSync(orgPath, { recursive: true })
  }

  if (projectPath) {
    // Ensure project path exists
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true })
    }
    // Ensure generation path exists
    if (!fs.existsSync(generationPath)) {
      fs.mkdirSync(generationPath, { recursive: true })
    }
  } else if (generationPath) {
    // Ensure generation path exists directly under organization
    if (!fs.existsSync(generationPath)) {
      fs.mkdirSync(generationPath, { recursive: true })
    }
  }

  // Resolve and validate all paths to prevent path traversal
  const resolvedWorkspace = fs.realpathSync(WORKSPACE_BASE)
  const resolvedOrgPath = fs.realpathSync(orgPath)
  let resolvedProjPath: string | null = null
  let resolvedGenPath: string | null = null

  if (projectPath) {
    resolvedProjPath = fs.realpathSync(projectPath)
    resolvedGenPath = fs.realpathSync(generationPath)
  }

  // Validate that all paths are within the workspace base
  // (Prevents ../ traversal and absolute path escape)
  const validatePath = (p: string, name: string): string => {
    const resolved = fs.realpathSync(p)
    if (!resolved.startsWith(resolvedWorkspace + path.sep) && resolved !== resolvedWorkspace) {
      throw new Error(`Path traversal detected in ${name}: ${p} escapes workspace base`)
    }
    return resolved
  }

  try {
    validatePath(orgPath, 'organization')
    if (projectPath) validatePath(projectPath, 'project')
    if (generationPath) validatePath(generationPath, 'generation')
  } catch (e) {
    // Clean up partial workspace on validation failure
    try { fs.rmSync(orgPath, { recursive: true, force: true }) } catch {}
    throw e
  }

  return {
    workspacePath: resolvedWorkspace,
    organizationPath: resolvedOrgPath,
    projectPath: resolvedProjPath,
    generationPath: resolvedGenPath,
    safeBase: resolvedWorkspace,
  }
}

/**
 * Sanitize organization ID - prevent path traversal characters
 */
function sanitizeOrganizationId(orgId: string): string {
  // Remove any characters that could be used for path traversal
  const sanitized = orgId.replace(/[\\/:\|\?\*"<>&]/g, '_')
  // Ensure it's not empty
  return sanitized || 'org'
}

/**
 * Sanitize project ID - prevent path traversal characters
 */
function sanitizeProjectId(projectId: string): string {
  const sanitized = projectId.replace(/[\\/:\|\?\*"<>&]/g, '_')
  return sanitized || 'project'
}

/**
 * Validate that a file path stays within the workspace.
 * Returns the normalized safe path or throws an error.
 */
export function validateWorkspacePath(
  filePath: string,
  generationPath: string
): string {
  // Normalize the path
  const normalized = path.normalize(filePath)

  // Check for absolute paths - reject them
  if (path.isAbsolute(normalized)) {
    throw new Error(`Absolute path not allowed: ${filePath}. Must be relative to workspace.`)
  }

  // Check for path traversal patterns
  if (normalized.startsWith('..') || normalized.includes('..\\') || normalized.includes('../')) {
    throw new Error(`Path traversal not allowed: ${filePath}`)
  }

  // Join with generation path and resolve
  const fullPath = path.join(generationPath, normalized)
  const resolved = path.resolve(fullPath)

  // Verify the resolved path is within the generation path
  const genResolved = fs.realpathSync(generationPath)
  if (!resolved.startsWith(genResolved + path.sep) && resolved !== genResolved) {
    throw new Error(`Path escapes workspace: ${filePath} outside of ${generationPath}`)
  }

  return resolved
}

/**
 * Write a file to the workspace safely.
 * Validates the path, then writes the content.
 * 
 * @param generationPath The generation workspace path
 * @param filePath Relative path within the generation workspace
 * @param content The file content to write
 * @param operation The operation type ('create' | 'update' | 'delete')
 * @returns The absolute path where the file was written
 * @throws Error if path is invalid or escapes workspace
 */
export function writeFileSafe(
  generationPath: string,
  filePath: string,
  content: string,
  operation: 'create' | 'update' | 'delete' = 'create'
): string {
  // Validate the path stays within workspace
  const safePath = validateWorkspacePath(filePath, generationPath)

  if (operation === 'delete') {
    // For delete operations, just validate and then delete
    if (fs.existsSync(safePath)) {
      fs.rmSync(safePath, { recursive: true, force: true })
    }
    return safePath
  }

  // Ensure the directory exists
  const dirPath = path.dirname(safePath)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  // Write the file
  fs.writeFileSync(safePath, content)

  return safePath
}

/**
 * Read a file from the workspace safely.
 * Validates the path and returns the content.
 */
export function readFileSafe(
  generationPath: string,
  filePath: string
): string {
  // Validate the path stays within workspace
  const safePath = validateWorkspacePath(filePath, generationPath)

  if (!fs.existsSync(safePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  return fs.readFileSync(safePath, 'utf-8')
}

/**
 * List files in the workspace generation directory.
 * Returns relative paths within the generation workspace.
 */
export function listGenerationFiles(generationPath: string, prefix?: string): string[] {
  const resolvedGenPath = fs.realpathSync(generationPath)
  const files: string[] = []

  function walkDir(dir: string, relPrefix: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relPath = path.join(relPrefix, entry.name).replace(/\\/g, '/')

      if (entry.isDirectory()) {
        walkDir(fullPath, relPath)
      } else if (entry.isFile()) {
        // Skip if prefix filter and file doesn't match
        if (prefix && !relPath.startsWith(prefix)) {
          continue
        }
        files.push(relPath)
      }
    }
  }

  walkDir(resolvedGenPath, '')
  return files
}

/**
 * Check if a workspace exists and is accessible for an organization.
 */
export function workspaceExists(
  organizationId: string,
  projectId: string | null
): boolean {
  const orgPath = path.join(WORKSPACE_BASE, sanitizeOrganizationId(organizationId))

  if (projectId) {
    const projPath = path.join(orgPath, sanitizeProjectId(projectId))
    return fs.existsSync(projPath)
  }

  return fs.existsSync(orgPath)
}

/**
 * Get the workspace path for an organization/project/generation combination.
 */
export function getWorkspacePath(
  organizationId: string,
  projectId: string | null,
  generationVersionId: string | null
): string {
  const result = createWorkspace(organizationId, projectId, generationVersionId)
  return result.workspacePath
}

/**
 * Clean up a workspace (call after execution completes or fails).
 * 
 * @param organizationId Organization identifier
 * @param projectId Project identifier (optional)
 * @param generationVersionId Generation version identifier (optional)
 * @param keepArtifacts Whether to keep generated artifacts
 */
export function cleanupWorkspace(
  organizationId: string,
  projectId: string | null,
  generationVersionId: string | null,
  keepArtifacts: boolean = false
): void {
  const orgPath = path.join(WORKSPACE_BASE, sanitizeOrganizationId(organizationId))

  try {
    if (projectId) {
      const projPath = path.join(orgPath, sanitizeProjectId(projectId))
      if (!keepArtifacts) {
        fs.rmSync(projPath, { recursive: true, force: true })
      } else {
        // Only clean generation subdirectory, keep project structure
        const genPath = path.join(projPath, 'generation')
        if (fs.existsSync(genPath)) {
          fs.rmSync(genPath, { recursive: true, force: true })
        }
      }
    } else {
      if (!keepArtifacts) {
        fs.rmSync(orgPath, { recursive: true, force: true })
      } else {
        // Only clean generation subdirectory
        const genPath = path.join(orgPath, 'generation')
        if (fs.existsSync(genPath)) {
          fs.rmSync(genPath, { recursive: true, force: true })
        }
      }
    }
  } catch (e) {
    // Log error but don't throw - cleanup should not fail the system
    console.error(`Workspace cleanup error: ${e}`)
  }
}

export { createWorkspace, validateWorkspacePath, writeFileSafe, readFileSafe, listGenerationFiles, workspaceExists, getWorkspacePath, cleanupWorkspace }