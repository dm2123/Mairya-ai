/**
 * P9 Artifact Management
 * 
 * After successful execution, record generated artifacts.
 * 
 * Examples:
 *   - source (generated source code)
 *   - build (build outputs/artifacts)
 *   - test-report (test execution results)
 *   - logs (execution logs)
 *   - metadata (execution metadata)
 * 
 * Store metadata and safe references.
 * Do not expose arbitrary filesystem paths.
 */
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { ExecutionJob, ExecutionTask } from '../executor/execution-models'
import { ExecutionStatus } from '../executor/execution-models'
import { executeJob } from '../queue/execution-queue'

/**
 * Artifact type
 */
export enum ArtifactType {
  SOURCE = 'source',
  BUILD = 'build',
  TEST_REPORT = 'test-report',
  LOGS = 'logs',
  METADATA = 'metadata',
  CONFIGURATION = 'configuration',
}

/**
 * Artifact metadata
 */
export interface ArtifactMetadata {
  /** Artifact type */
  type: ArtifactType
  /** Artifact name */
  name: string
  /** Description */
  description: string | null
  /** Checksum (SHA256) */
  checksum: string
  /** Size in bytes */
  size: number
  /** Creation timestamp */
  createdAt: Date
  /** Whether the artifact is encrypted */
  encrypted: boolean
}

/**
 * Artifact record
 */
export interface Artifact {
  /** Unique artifact ID */
  id: string
  /** Associated execution job ID */
  executionJobId: string
  /** Associated execution task ID (optional) */
  executionTaskId: string | null
  /** Storage path reference (relative, not absolute) */
  pathReference: string
  /** Artifact metadata */
  metadata: ArtifactMetadata
  /** Whether the artifact is accessible */
  accessible: boolean
  /** Creation timestamp */
  createdAt: Date
}

/**
 * P9 Artifact Management
 * 
 * After successful execution, record generated artifacts with metadata
 * and safe references. Artifacts are stored with relative path references
 * to prevent arbitrary filesystem path exposure.
 */
export class ArtifactManager {
  private workspaceBase: string

  constructor(workspaceBase: string) {
    this.workspaceBase = workspaceBase
  }

  /**
   * Record a generated artifact.
   * 
   * @param executionJobId The execution job ID
   * @param executionTaskId The execution task ID (optional)
   * @param type The artifact type
   * @param name The artifact name
   * @param description The artifact description (optional)
   * @param relativePath The relative path from the workspace base
   * @returns The artifact record
   * @throws Error if the path escapes the workspace
   */
  recordArtifact(
    executionJobId: string,
    executionTaskId: string | null,
    type: ArtifactType,
    name: string,
    description: string | null,
    relativePath: string
  ): Artifact {
    // Validate the relative path stays within workspace
    const fullPath = path.join(this.workspaceBase, relativePath)
    const resolvedPath = path.resolve(fullPath)
    const resolvedBase = path.resolve(this.workspaceBase)

    if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
      throw new Error(`Artifact path escapes workspace: ${relativePath}`)
    }

    // Calculate checksum if file exists
    let checksum = ''
    const fullFilePath = path.resolve(fullPath)
    if (fs.existsSync(fullFilePath)) {
      const content = fs.readFileSync(fullFilePath)
      checksum = crypto.createHash('sha256').update(content).digest('hex')
    }

    // Determine size
    const size = fs.existsSync(fullFilePath) ? fs.statSync(fullFilePath).size : 0

    const artifact: Artifact = {
      id: crypto.randomUUID(),
      executionJobId,
      executionTaskId,
      pathReference: relativePath,
      metadata: {
        type,
        name,
        description,
        checksum,
        size,
        createdAt: new Date(),
        encrypted: false,
      },
      accessible: fs.existsSync(fullFilePath),
      createdAt: new Date(),
    }

    // TODO: Persist artifact to database
    // TODO: Store metadata in database table

    return artifact
  }

  /**
   * Get an artifact by ID.
   * 
   * @param artifactId The artifact ID
   * @returns The artifact record or null
   */
  getArtifact(artifactId: string): Artifact | null {
    // TODO: Retrieve artifact from database
    // For now, return null (implementation-dependent)
    return null
  }

  /**
   * Get artifacts for an execution job.
   * 
   * @param executionJobId The execution job ID
   * @returns Array of artifact records
   */
  getArtifactsForJob(executionJobId: string): Artifact[] {
    // TODO: Retrieve artifacts from database for this job
    // For now, return empty array
    return []
  }

  /**
   * Get artifacts for an execution task.
   * 
   * @param executionTaskId The execution task ID
   * @returns Array of artifact records
   */
  getArtifactsForTask(executionTaskId: string): Artifact[] {
    // TODO: Retrieve artifacts from database for this task
    // For now, return empty array
    return []
  }

  /**
   * List artifacts by type for an execution job.
   * 
   * @param executionJobId The execution job ID
   * @param type The artifact type filter
   * @returns Array of artifact records matching the type
   */
  listArtifactsByType(executionJobId: string, type: ArtifactType): Artifact[] {
    // TODO: Retrieve artifacts from database filtered by type
    // For now, return empty array
    return []
  }

  /**
   * Validate that an artifact path is safe (within workspace).
   * 
   * @param relativePath The relative path to validate
   * @returns Whether the path is safe
   */
  isPathSafe(relativePath: string): boolean {
    try {
      const fullPath = path.join(this.workspaceBase, relativePath)
      const resolvedPath = path.resolve(fullPath)
      const resolvedBase = path.resolve(this.workspaceBase)

      return resolvedPath.startsWith(resolvedBase + path.sep) || resolvedPath === resolvedBase
    } catch {
      return false
    }
  }

  /**
   * Clean up artifacts for a cancelled or failed job.
   * 
   * @param executionJobId The execution job ID
   * @param keepArtifacts Whether to keep artifacts (default: false)
   * @returns Whether cleanup was successful
   */
  cleanupJobArtifacts(executionJobId: string, keepArtifacts: boolean = false): boolean {
    // TODO: Retrieve artifacts for this job from database
    // TODO: Delete physical files if !keepArtifacts
    // TODO: Remove artifact records from database

    // For now, return true (implementation-dependent)
    return true
  }
}

/**
 * Factory function to create an ArtifactManager
 */
export function createArtifactManager(workspaceBase: string): ArtifactManager {
  return new ArtifactManager(workspaceBase)
}