import { ProjectSpecification } from './project-specification'
import { LanguageDefinition } from './project-types'

/** Code Generation Job Model — Tracks the lifecycle of a factory generation job.

 * Conceptual lifecycle:
  * Factory Request
  * Job Created
  * Planning
  * Generating
  * Building
  * Testing
  * Completed/Failed

 * Stores essential metadata without secrets.
 */
export interface CodeGenerationJob {
  /** Unique job ID. */
  jobId: string
  /** Organization the job belongs to. */
  organizationId: string
  /** User who requested the job. */
  requestedBy: string
  /** Associated project specification. */
  projectSpec: ProjectSpecification
  /** Programming language. */
  language: LanguageDefinition['languageId']
  /** Framework, if any. */
  framework: string | null
  /** Current status of the job. */
  status: 'planning' | 'generating' | 'building' | 'testing' | 'completed' | 'failed'
  /** Creation timestamp. */
  createdAt: Date
  /** Completion timestamp (null if still running). */
  completedAt: Date | null
  /** Error state, if the job failed. */
  error?: {
    code: string
    message: string
  }
  /** Result metadata (artifacts, build output, etc.). */
  resultMetadata?: Record<string, unknown>
}

/** Job status transitions (validated at the API layer). */
export const JobStatusTransitions: Record<string, string[]> = {
  planning: ['generating'],
  generating: ['building'],
  building: ['testing'],
  testing: ['completed', 'failed'],
}

/** Validates a status transition. */
export function isValidStatusTransition(
  from: string,
  to: string
): boolean {
  return JobStatusTransitions[from]?.includes(to) ?? false
}

/** Creates a new generation job. */
export function createJob(
  organizationId: string,
  requestedBy: string,
  projectSpec: ProjectSpecification,
  language: LanguageDefinition['languageId'],
  framework: string | null
): CodeGenerationJob {
  const jobId = `${spec.projectId}-${Date.now()}`
  return {
    jobId,
    organizationId,
    requestedBy,
    projectSpec,
    language,
    framework,
    status: 'planning',
    createdAt: new Date(),
    completedAt: null,
  }
}

/** Factory job service — Manages job lifecycle. */
export class FactoryJobService {
  private jobs: Map<string, CodeGenerationJob> = new Map()

  createJob(
    organizationId: string,
    requestedBy: string,
    projectSpec: ProjectSpecification,
    language: LanguageDefinition['languageId'],
    framework: string | null
  ): CodeGenerationJob {
  const job = createJob(organizationId, requestedBy, projectSpec, language, framework)
  this.jobs.set(job.jobId, job)
  return job
  }

  getJob(jobId: string): CodeGenerationJob | undefined {
    return this.jobs.get(jobId)
  }

  getAllJobsByOrganization(organizationId: string): CodeGenerationJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.organizationId === organizationId
    )
  }

  updateJobStatus(
    jobId: string,
    status: 'planning' | 'generating' | 'building' | 'testing' | 'completed' | 'failed'
  ): CodeGenerationJob | undefined {
    const job = this.jobs.get(jobId)
    if (!job) return undefined
    if (!isValidStatusTransition(job.status, status)) {
      throw new Error(`Invalid status transition from ${job.status} to ${status}`)
    }
    job.status = status
    if (status === 'completed' || status === 'failed') {
      job.completedAt = new Date()
    }
    return job
  }
}