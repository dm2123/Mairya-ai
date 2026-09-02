/** Generation Job Lifecycle — Extends the P7 Factory Job system.
 *
 * Suggested lifecycle:
 *   CREATED
 * → PLANNING
 * → PLANNED
 * → GENERATING
 * → GENERATED
 * → VALIDATING
 * → VALIDATED
 *
 * Failure states must be supported.
 * Do not mark a project complete merely because an LLM returned text.
 */

import { CodeGenerationJob } from '../factory/src/code-generation-job'
import { GenerationTask } from '../planner/src/requirement-model'
import { CodeGenerationResult } from '../planner/src/code-generation-engine'
import { FileValidationResult } from '../planner/src/code-generation-validation'

/** Generation Job Status — Lifecycle states for a factory generation job. */
export enum GenerationJobStatus {
  Created = 'created',
  Planning = 'planning',
  Planned = 'planned',
  Generating = 'generating',
  Generated = 'generated',
  Validating = 'validating',
  Validated = 'validated',
  Failed = 'failed',
}

/** Generation Job — Extended factory job for AI code generation. */
export interface GenerationJob extends CodeGenerationJob {
  /** Associated project plan. */
  projectPlan?: any // AIProjectPlan
  /** Generation plan. */
  generationPlan?: any // GenerationPlan
  /** Current lifecycle status. */
  status: GenerationJobStatus
  /** Tasks completed count. */
  tasksCompleted?: number
  /** Total tasks count. */
  totalTasks?: number
  /** Generated files metadata. */
  generatedFiles?: GeneratedFileMetadata[]
  /** Validation result. */
  validationResult?: FileValidationResult
  /** Error information, if failed. */
  error?: {
    code: string
    message: string
    failedTask?: string
  }
}

/** Generated File Metadata — Metadata about a generated file. */
export interface GeneratedFileMetadata {
  /** File path. */
  filePath: string
  /** Operation (create, update). */
  operation: 'create' | 'update'
  /** Language. */
  language: string
  /** Framework. */
  framework: string | null
  /** Generated at timestamp. */
  generatedAt: Date
  /** Validation status. */
  validated: boolean
  /** Validation result, if validated. */
  validation?: FileValidationResult
}

/** Generation Job Service — Manages generation job lifecycle. */
export class GenerationJobService {
  private jobs: Map<string, GenerationJob> = new Map()

  /** Create a new generation job. */
  createJob(
    organizationId: string,
    requestedBy: string,
    projectSpec: any, // ProjectSpecification
    projectPlan: any, // AIProjectPlan
    generationPlan: any // GenerationPlan
  ): GenerationJob {
    const jobId = `${projectSpec.projectId}-${Date.now()}`
    const job: GenerationJob = {
      jobId,
      organizationId,
      requestedBy,
      projectSpec,
      projectPlan,
      generationPlan,
      status: GenerationJobStatus.Created,
      createdAt: new Date(),
      completedAt: null,
      tasksCompleted: 0,
      totalTasks: (generationPlan.tasks?.length || 0),
      generatedFiles: [],
      validationResult: undefined,
      error: undefined,
    }

    this.jobs.set(jobId, job)
    return job
  }

  /** Get a generation job by ID. */
  getJob(jobId: string): GenerationJob | undefined {
    return this.jobs.get(jobId)
  }

  /** Get all jobs by organization. */
  getAllJobsByOrganization(organizationId: string): GenerationJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.organizationId === organizationId
    )
  }

  /** Update job status. */
  updateStatus(
    jobId: string,
    status: GenerationJobStatus,
    failedTask?: string
  ): GenerationJob | undefined {
    const job = this.jobs.get(jobId)
    if (!job) return undefined

    // Validate status transition
    const validTransitions = this.getValidTransitions(job.status)
    if (!validTransitions.includes(status) && status !== GenerationJobStatus.Failed) {
      throw new Error(`Invalid status transition from ${job.status} to ${status}`)
    }

    job.status = status

    // Set completedAt on terminal states
    const terminalStates = [
      GenerationJobStatus.Validated,
      GenerationJobStatus.Failed,
    ]
    if (terminalStates.includes(status)) {
      job.completedAt = new Date()
    }

    // If failed, set error information
    if (status === GenerationJobStatus.Failed && failedTask) {
      job.error = {
        code: 'GENERATION_FAILED',
        message: `Generation failed at task: ${failedTask}`,
        failedTask,
      }
    }

    return job
  }

  /** Get valid status transitions for a given state. */
  private getValidTransitions(from: GenerationJobStatus): GenerationJobStatus[] {
    const transitions: Record<GenerationJobStatus, GenerationJobStatus[]> = {
      [GenerationJobStatus.Created]: [
        GenerationJobStatus.Planning,
      ],
      [GenerationJobStatus.Planning]: [
        GenerationJobStatus.Planned,
      ],
      [GenerationJobStatus.Planned]: [
        GenerationJobStatus.Generating,
      ],
      [GenerationJobStatus.Generating]: [
        GenerationJobStatus.Generated,
        GenerationJobStatus.Failed,
      ],
      [GenerationJobStatus.Generated]: [
        GenerationJobStatus.Validating,
      ],
      [GenerationJobStatus.Validating]: [
        GenerationJobStatus.Validated,
        GenerationJobStatus.Failed,
      ],
      [GenerationJobStatus.Validated]: [],
      [GenerationJobStatus.Failed]: [],
    }

    return transitions[from] || []
  }

  /** Mark a task as completed. */
  markTaskCompleted(jobId: string): GenerationJob | undefined {
    const job = this.jobs.get(jobId)
    if (!job) return undefined

    job.tasksCompleted = (job.tasksCompleted || 0) + 1

    // Auto-transition if all tasks are completed
    if (
      job.tasksCompleted >= job.totalTasks &&
      job.status === GenerationJobStatus.Generating
    ) {
      job.status = GenerationJobStatus.Generated
      job.completedAt = new Date()
    }

    return job
  }

  /** Mark generation as validated. */
  markValidationComplete(
    jobId: string,
    validationResult: FileValidationResult
  ): GenerationJob | undefined {
    const job = this.jobs.get(jobId)
    if (!job) return undefined

    job.status = GenerationJobStatus.Validated
    job.validationResult = validationResult
    job.completedAt = new Date()

    return job
  }

  /** Get all jobs with a specific status. */
  getJobsByStatus(status: GenerationJobStatus): GenerationJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === status
    )
  }
}

/** Creates a new GenerationJobService instance. */
export function createGenerationJobService(): GenerationJobService {
  return new GenerationJobService()
}

/** Transition a job to the next valid state.
 *
 * Returns the new status or throws if the transition is invalid.
 */
export function transitionJobStatus(
  currentStatus: GenerationJobStatus,
  targetStatus: GenerationJobStatus
): { valid: boolean; newStatus: GenerationJobStatus } {
  const validTransitions = {
    [GenerationJobStatus.Created]: GenerationJobStatus.Planning,
    [GenerationJobStatus.Planning]: GenerationJobStatus.Planned,
    [GenerationJobStatus.Planned]: GenerationJobStatus.Generating,
    [GenerationJobStatus.Generating]:
      GenerationJobStatus.Generated,
    [GenerationJobStatus.Generated]: GenerationJobStatus.Validating,
    [GenerationJobStatus.Validating]:
      GenerationJobStatus.Validated,
  }

  const allowed = validTransitions[currentStatus]
  if (allowed && allowed.includes(targetStatus)) {
    return { valid: true, newStatus: targetStatus }
  }

  return {
    valid: false,
    newStatus: currentStatus,
  }
}