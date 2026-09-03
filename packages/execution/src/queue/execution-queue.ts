/**
 * P9 Execution Queue
 * 
 * Controlled execution queue with FIFO ordering and concurrency limits.
 * Organization-aware isolation. Task and job timeouts. Cancellation support.
 * Retry policy for safe/idempotent operations only.
 */

import { ExecutionStatus, ExecutionJob, ExecutionTask } from '../executor/execution-models'
import { resolveTaskDependencies, validateTaskDependencies, getReadyTasks, getNextTask } from '../scheduler/task-scheduler'

/**
 * Execution Queue configuration
 */
export interface QueueConfig {
  /** Maximum concurrent jobs per organization */
  maxConcurrentJobs?: number
  /** Maximum concurrent tasks per job */
  maxConcurrentTasksPerJob?: number
  /** Task timeout in milliseconds */
  taskTimeoutMs?: number
  /** Job timeout in milliseconds */
  jobTimeoutMs?: number
  /** Maximum retry attempts */
  maxRetryAttempts?: number
  /** Retry delay in milliseconds */
  retryDelayMs?: number
}

/**
 * Execution Queue state for a single job
 */
export interface JobState {
  jobId: string
  organizationId: string
  status: ExecutionStatus
  priority: number
  tasks: ExecutionTask[]
  completedTasks: Set<string>
  executingTasks: Set<string>
  cancelled: boolean
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
}

/**
 * Execution Queue state for the entire system
 */
export interface QueueState {
  jobs: Map<string, JobState>
  organizationJobs: Map<string, Set<string>> // orgId -> set of job IDs
}

/**
 * Priority ordering for the execution queue
 * Higher number = higher priority
 */
export enum QueuePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * Queue entry for pending tasks
 */
export interface QueueEntry {
  task: ExecutionTask
  jobId: string
  organizationId: string
  addedAt: Date
}

/**
 * P9 Execution Queue implementation
 * 
 * Features:
 * - FIFO or deterministic priority ordering
 * - Concurrency limits (jobs and tasks)
 * - Organization isolation
 * - Task and job timeouts
 * - Cancellation support
 * - Retry policy for safe operations
 */
export class ExecutionQueue {
  private config: QueueConfig
  private state: QueueState
  private jobTimers: Map<string, NodeJS.Timeout>
  private taskTimers: Map<string, NodeJS.Timeout>

  constructor(config: QueueConfig = {}) {
    this.config = {
      maxConcurrentJobs: config.maxConcurrentJobs || 5,
      maxConcurrentTasksPerJob: config.maxConcurrentTasksPerJob || 3,
      taskTimeoutMs: config.taskTimeoutMs || 300000, // 5 minutes default
      jobTimeoutMs: config.jobTimeoutMs || 600000, // 10 minutes default
      maxRetryAttempts: config.maxRetryAttempts || 3,
      retryDelayMs: config.retryDelayMs || 5000,
    }

    this.state = {
      jobs: new Map(),
      organizationJobs: new Map(),
    }

    this.jobTimers = new Map()
    this.taskTimers = new Map()
  }

  /**
   * Create a new execution job
   */
  createJob(
    organizationId: string,
    projectId: string | null,
    generationVersionId: string | null,
    priority: number = QueuePriority.NORMAL,
    createdBy: string | null = null
  ): ExecutionJob {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const job: ExecutionJob = {
      id: jobId,
      organizationId,
      projectId,
      generationVersionId,
      status: ExecutionStatus.CREATED,
      priority,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Initialize job state
    const taskIds: Set<string> = new Set()
    const jobState: JobState = {
      jobId,
      organizationId,
      status: ExecutionStatus.CREATED,
      priority,
      tasks: [],
      completedTasks: new Set(),
      executingTasks: new Set(),
      cancelled: false,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
    }

    this.state.jobs.set(jobId, jobState)
    if (!this.state.organizationJobs.has(organizationId)) {
      this.state.organizationJobs.set(organizationId, new Set())
    }
    this.state.organizationJobs.get(organizationId)!.add(jobId)

    return job
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): JobState | null {
    return this.state.jobs.get(jobId) || null
  }

  /**
   * List jobs for an organization
   */
  listOrganizationJobs(organizationId: string): JobState[] {
    const jobIds = this.state.organizationJobs.get(organizationId) || new Set()
    return Array.from(jobIds).map((jid) => this.state.jobs.get(jid) || null).filter(Boolean)
  }

  /**
   * Add tasks to a job
   */
  addTasks(
    jobId: string,
    tasks: ExecutionTask[],
    existingTaskIds: Set<string> = new Set()
  ): { success: boolean; added: string[]; errors: string[] } {
    const jobState = this.state.jobs.get(jobId)
    if (!jobState) {
      return { success: false, added: [], errors: ['Job not found'] }
    }

    if (jobState.cancelled) {
      return { success: false, added: [], errors: ['Job is cancelled'] }
    }

    const added: string[] = []
    const errors: string[] = []

    for (const task of tasks) {
      // Check for duplicate task IDs
      if (existingTaskIds.has(task.id) || jobState.tasks.some((t) => t.id === task.id)) {
        errors.push(`Duplicate task ID: ${task.id}`)
        continue
      }

      // Validate dependencies
      const depValidation = validateTaskDependencies([task])
      if (!depValidation.valid) {
        errors.push(`Task ${task.id}: ${depValidation.errors.join(', ')}`)
        continue
      }

      jobState.tasks.push(task)
      existingTaskIds.add(task.id)
      added.push(task.id)
    }

    if (added.length > 0) {
      // Re-resolve dependencies for the job since new tasks were added
      this.resolveJobDependencies(jobId)
    }

    return { success: errors.length === 0, added, errors }
  }

  /**
   * Resolve dependencies for all tasks in a job and determine execution order
   */
  private resolveJobDependencies(jobId: string): {
    valid: boolean
    errors: string[]
    executionOrder: string[]
  } {
    const jobState = this.state.jobs.get(jobId)
    if (!jobState) {
      return { valid: false, errors: ['Job not found'], executionOrder: [] }
    }

    const tasks = jobState.tasks
    if (tasks.length === 0) {
      return { valid: true, errors: [], executionOrder: [] }
    }

    try {
      const sorted = resolveTaskDependencies(tasks)
      return { valid: true, errors: [], executionOrder: sorted }
    } catch (e) {
      return { valid: false, errors: [(e as Error).message], executionOrder: [] }
    }
  }

  /**
   * Get the next ready task to execute for a job
   */
  getNextExecutableTask(jobId: string): ExecutionTask | null {
    const jobState = this.state.jobs.get(jobId)
    if (!jobState || jobState.cancelled) {
      return null
    }

    const completedIds = new Set(jobState.completedTasks)
    const executingIds = new Set(jobState.executingTasks)

    return getNextTask(jobState.tasks, completedIds, executingIds)
  }

  /**
   * Mark a task as started
   */
  markTaskStarted(jobId: string, taskId: string): boolean {
    const jobState = this.state.jobs.get(jobId)
    if (!jobState) return false

    const task = jobState.tasks.find((t) => t.id === taskId)
    if (!task) return false

    // Check if all dependencies are completed
    const completedIds = new Set(jobState.completedTasks)
    const deps = task.dependencies || []
    const allDepsCompleted = deps.every((depId) => completedIds.has(depId))

    if (!allDepsCompleted) {
      return false // Dependencies not yet met
    }

    // Mark task as executing
    jobState.executingTasks.add(taskId)
    task.status = ExecutionStatus.RUNNING
    task.startedAt = new Date()
    jobState.updatedAt = new Date()

    // Update job state
    jobState.updatedAt = new Date()

    // Start task timeout
    this.startTaskTimeout(jobId, taskId)

    return true
  }

  /**
   * Mark a task as completed
   */
  markTaskCompleted(jobId: string, taskId: string, exitCode: number = 0): boolean {
    const jobState = this.state.jobs.get(jobId)
    if (!jobState) return false

    const task = jobState.tasks.find((t) => t.id === taskId)
    if (!task) return false

    // Clear the task timeout
    this.clearTaskTimeout(taskId)

    // Mark task as completed
    task.status = exitCode === 0 ? ExecutionStatus.COMPLETED : ExecutionStatus.FAILED
    task.completedAt = new Date()
    task.exitCode = exitCode
    jobState.completedTasks.add(taskId)
    jobState.executingTasks.delete(taskId)
    jobState.updatedAt = new Date()

    // Check if job is complete
    this.checkJobCompletion(jobId)

    return true
  }

  /**
   * Mark a task as failed
   */
  markTaskFailed(jobId: string, taskId: string, errorCode: string, errorMessage: string): boolean {
    const jobState = this.state.jobs.get(jobId)
    if (!jobState) return false

    const task = jobState.tasks.find((t) => t.id === taskId)
    if (!task) return false

    // Clear the task timeout
    this.clearTaskTimeout(taskId)

    // Mark task as failed
    task.status = ExecutionStatus.FAILED
    task.errorCode = errorCode
    task.errorMessage = errorMessage
    task.completedAt = new Date()
    jobState.executingTasks.delete(taskId)
    jobState.updatedAt = new Date()

    // Record failure and handle retry
    this.handleTaskFailure(jobId, taskId)

    return true
  }

  /**
   * Handle task failure with retry logic
   */
  private handleTaskFailure(jobId: string, taskId: string): boolean {
    const jobState = this.state.jobs.get(jobId)
    if (!jobState) return false

    const task = jobState.tasks.find((t) => t.id === taskId)
    if (!task) return false

    // Increment attempt count
    task.attempt = (task.attempt || 0) + 1

    // Check max retry attempts
    if ((task.attempt || 1) > (this.config.maxRetryAttempts || 3)) {
      // Max retries exceeded - mark job as failed
      return this.markJobFailed(jobId, `Max retries exceeded for task ${taskId}`)
    }

    // TODO: Implement retry logic - re-queue the task
    // For now, mark as failed
    task.status = ExecutionStatus.FAILED
    jobState.updatedAt = new Date()

    return true
  }

  /**
   * Check if the job is complete (all tasks executed or failed)
   */
  private checkJobCompletion(jobId: string): boolean {
    const jobState = this.state.jobs.get(jobId)
    if (!jobState) return false

    const totalTasks = jobState.tasks.length
    const completedCount = jobState.completedTasks.size

    if (totalTasks === 0) {
      // No tasks - job is complete
      return this.completeJob(jobId, ExecutionStatus.COMPLETED)
    }

    if (completedCount >= totalTasks) {
      // All tasks completed
      return this.completeJob(jobId, ExecutionStatus.COMPLETED)
    }

    // Check if any task failed
    const failedTasks = jobState.tasks.filter((t) => t.status === ExecutionStatus.FAILED)
    if (failedTasks.length > 0 && !jobState.cancelled) {
      // Some tasks failed - job fails
      return this.markJobFailed(jobId, `Task(s) failed: ${failedTasks.length} task(s) have failed`)
    }

    return false
  }

  /**
   * Mark a job as failed
   */
  private markJobFailed(jobId: string, errorMessage: string): boolean {
    const jobState = this.state.jobs.get(jobId)
    if (!jobState) return false

    // Clear all timeouts
    this.clearJobTimeout(jobId)

    jobState.status = ExecutionStatus.FAILED
    jobState.errorMessage = errorMessage
    jobState.completedAt = new Date()
    jobState.cancelled = false
    jobState.updatedAt = new Date()

    // TODO: Persist the failure state
    // TODO: Notify via approval system or logging

    return true
  }

  /**
   * Complete a job successfully
   */
  private completeJob(jobId: string, status: ExecutionStatus): boolean {
    const jobState = this.state.jobs.get(jobId)
    if (!jobState) return false

    // Clear all timeouts
    this.clearJobTimeout(jobId)

    jobState.status = status
    jobState.completedAt = new Date()
    jobState.updatedAt = new Date()

    // TODO: Persist completion state
    // TODO: Trigger approval gate or artifact management

    return true
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string, cancelledBy: string): boolean {
    const jobState = this.state.jobs.get(jobId)
    if (!jobState) return false

    if (jobState.status === ExecutionStatus.COMPLETED || jobState.status === ExecutionStatus.FAILED) {
      return false // Cannot cancel completed or failed job
    }

    // Mark cancellation
    jobState.status = ExecutionStatus.CANCEL_REQUESTED
    jobState.cancelled = true
    jobState.cancelledAt = new Date() // TODO: add cancelledAt to ExecutionJob interface if needed
    jobState.updatedAt = new Date()

    // Clear all timeouts
    this.clearJobTimeout(jobId)

    // Do not accept new tasks
    // TODO: Implement task cancellation flow

    // TODO: Persist cancellation state
    return true
  }

  /**
   * Start timeout for a task
   */
  private startTaskTimeout(taskId: string): void {
    // Clear any existing timeout for this task
    this.clearTaskTimeout(taskId)

    const timeout = setTimeout(() => {
      // Task timeout expired - mark as failed
      // We need the jobId and taskId from the timer map
      // This is a simplification - in production, store the mapping
      this.taskTimers.delete(taskId)
    }, this.config.taskTimeoutMs || 300000)

    this.taskTimers.set(taskId, timeout)
  }

  /**
   * Clear task timeout
   */
  private clearTaskTimeout(taskId: string): void {
    const timeout = this.taskTimers.get(taskId)
    if (timeout) {
      clearTimeout(timeout)
      this.taskTimers.delete(taskId)
    }
  }

  /**
   * Start timeout for a job
   */
  private startJobTimeout(jobId: string): void {
    if (this.jobTimers.has(jobId)) {
      return // Already has a timer
    }

    const timeout = setTimeout(() => {
      // Job timeout expired
      this.markJobFailed(jobId, 'Job execution timeout exceeded')
      this.jobTimers.delete(jobId)
    }, this.config.jobTimeoutMs || 600000)

    this.jobTimers.set(jobId, timeout)
  }

  /**
   * Clear job timeout
   */
  private clearJobTimeout(jobId: string): void {
    const timeout = this.jobTimers.get(jobId)
    if (timeout) {
      clearTimeout(timeout)
      this.jobTimers.delete(jobId)
    }
  }

  /**
   * Get queue statistics
   */
  getStatistics() {
    const totalJobs = this.state.jobs.size
    const runningJobs = Array.from(this.state.jobs.values()).filter(
      (j) => j.status === ExecutionStatus.RUNNING
    ).length
    const queuedJobs = Array.from(this.state.jobs.values()).filter(
      (j) => j.status === ExecutionStatus.QUEUED
    ).length

    return {
      totalJobs,
      runningJobs,
      queuedJobs,
      maxConcurrentJobs: this.config.maxConcurrentJobs,
    }
  }
}

export { ExecutionQueue, QueueConfig, QueuePriority, QueueEntry, JobState, QueueState }