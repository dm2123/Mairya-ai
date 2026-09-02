/** Project Versioning — Projects support generation versions.
 *
 * Example:
 *   Project V1
 *   → Generation V1
 *
 * Later:
 *   Project V1
 *   → Generation V2
 *
 * Store enough metadata to identify:
 * - generation version
 * - architecture version
 * - template version
 * - language
 * - framework
 * - created timestamp
 * - status
 *
 * Do not overwrite history blindly.
 */

import { GenerationJob } from '../factory/src/code-generation-job'
import { FileValidationResult } from './code-generation-validation'
import { SecurityAnalysisResult } from './ai-code-generation-security'

/** Project Version — A specific version of a project generation. */
export interface ProjectVersion {
  /** Unique version ID. */
  versionId?: string
  /** Project ID. */
  projectId?: string
  /** Generation version number. */
  generation: number
  /** Architecture version. */
  architectureVersion?: string
  /** Template version used. */
  templateVersion?: string
  /** Language used. */
  language?: string
  /** Framework used. */
  framework?: string | null
  /** Created timestamp. */
  createdAt?: Date
  /** Status of this generation. */
  status: 'pending' | 'generating' | 'generated' | 'validated' | 'failed'
  /** Generation job ID. */
  generationJobId?: string
  /** Architecture output reference. */
  architectureRef?: string
  /** Validation result. */
  validationResult?: FileValidationResult
  /** Security analysis result. */
  securityResult?: SecurityAnalysisResult
  /** Generated files metadata. */
  generatedFiles?: Array<{
    filePath: string
    operation: 'create' | 'update'
    language: string
    framework: string | null
    generatedAt: Date
    validated: boolean
  }>
  /** Approval request, if any. */
  approvalRequest?: {
    approvalRequestId: string
    status: 'pending' | 'approved' | 'rejected'
  }
}

/** Project Version Service — Manages project generation versions. */
export class ProjectVersionService {
  private versions: Map<string, ProjectVersion> = new Map()

  /** Create a new project version. */
  createVersion(
    projectId: string,
    generation: number,
    language: string,
    framework: string | null,
    generationJobId: string,
    architectureRef: string
  ): ProjectVersion {
    const versionId = `${projectId}-v${generation}-${Date.now()}`
    const version: ProjectVersion = {
      versionId,
      projectId,
      generation,
      language,
      framework,
      createdAt: new Date(),
      status: 'pending',
      generationJobId,
      architectureRef,
    }

    this.versions.set(versionId, version)
    return version
  }

  /** Get a project version by ID. */
  getVersion(versionId: string): ProjectVersion | undefined {
    return this.versions.get(versionId)
  }

  /** Get all versions for a project. */
  getVersionsByProject(projectId: string): ProjectVersion[] {
    return Array.from(this.versions.values()).filter(
      (v) => v.projectId === projectId
    )
  }

  /** Get the latest version for a project. */
  getLatestVersion(projectId: string): ProjectVersion | undefined {
    const versions = this.getVersionsByProject(projectId)
    if (versions.length === 0) return undefined

    // Sort by generation number (highest first)
    return versions.sort((a, b) => b.generation - a.generation)[0]
  }

  /** Update a version's status and results. */
  updateVersion(
    versionId: string,
    updates: Partial<Omit<ProjectVersion, 'versionId' | 'projectId' | 'generation'>>
  ): ProjectVersion | undefined {
    const version = this.versions.get(versionId)
    if (!version) return undefined

    const updated: ProjectVersion = {
      ...version,
      ...updates,
    }

    this.versions.set(versionId, updated)
    return updated
  }

  /** Mark a version as validated. */
  markVersionValidated(
    versionId: string,
    validationResult: FileValidationResult,
    securityResult: SecurityAnalysisResult
  ): ProjectVersion | undefined {
    const version = this.versions.get(versionId)
    if (!version) return undefined

    version.status = 'validated'
    version.validationResult = validationResult
    version.securityResult = securityResult
    version.updatedAt = new Date()

    return this.versions.set(versionId, version)
  }

  /** Mark a version as failed. */
  markVersionFailed(
    versionId: string,
    error: string
  ): ProjectVersion | undefined {
    const version = this.versions.get(versionId)
    if (!version) return undefined

    version.status = 'failed'
    version.validationResult = {
      valid: false,
      errors: [error],
      warnings: [],
    }
    version.securityResult = {
      safe: false,
      issues: [],
      summary: 'Generation failed',
      riskLevel: 'critical',
    }
    version.updatedAt = new Date()

    return this.versions.set(versionId, version)
  }
}

/** Creates a new ProjectVersionService instance. */
export function createProjectVersionService(): ProjectVersionService {
  return new ProjectVersionService()
}

/** Versioning Policy — Rules for when a new generation version should be created. */
export const VersioningPolicy = {
  /** Always create a new version when generation is requested. */
  createNewVersion: true,

  /** Create a new version only if the technology stack changes. */
  // createNewVersionOnStackChange: false,

  /** Create a new version if the architecture changes significantly. */
  // createNewVersionOnArchitectureChange: false,

  /** Maximum number of versions to keep per project. */
  maxVersionsPerProject: 50,

  /** Delete oldest version when limit is exceeded. */
  // deleteOldestOnExceed: false,
}