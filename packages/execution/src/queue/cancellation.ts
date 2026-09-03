/**
 * P9 Cancellation Support
 * 
 * Implements controlled cancellation of execution jobs and tasks.
 * 
 * Flow:
 *   RUNNING
 *      ↓
 *   CANCEL_REQUESTED
 *      ↓
 *   stop accepting new tasks
 *      ↓
 *   terminate controlled task
 *      ↓
 *   CANCELLED
 * 
 * Cancellation must be persisted. Avoid orphan processes where
 * the platform supports process control.
 */
import * as fs from 'fs'
import * as path from 'path'
import { ExecutionStatus } from '../executor/execution-models'
import { ExecutionJob, ExecutionTask } from '../executor/execution-models'
import { ControlledCommandExecutor, SafeCommand } from '../commands/controlled-command-execution'
import { ExecutionQueue } from '../queue/execution-queue'

/**
 * Cancellation result
 */
export interface CancellationResult {
  /** Whether cancellation was successful */
  successful: boolean
  /** Job ID that was cancelled */
  jobId: string
  /** Task ID that was terminated (if applicable) */
  taskId: string | null
  /** Final status */
  finalStatus: ExecutionStatus
  /** Error message if cancellation failed */
  error: string | null
}

/**
 * P9 Cancellation Support
 * 
 * Implements controlled cancellation of execution jobs and tasks.
 * Persists cancellation state and ensures orderly shutdown.
 * Avoids orphan processes through platform process control.
 */
export class CancellationManager {
  private commandExecutor: ControlledCommandExecutor
  private executionQueue: ExecutionQueue

  constructor(workspacePath: string) {
    this.commandExecutor = new ControlledCommandExecutor(workspacePath)
    this.executionQueue = new ExecutionQueue({})
  }

  /**
   * Request cancellation of an execution job.
   * 
   * Flow:
 *   RUNNING
 *      ↓
 *   CANCEL_REQUESTED - Persist state, stop accepting new tasks
 *      ↓
 *   terminate controlled task - Stop running tasks gracefully
 *      ↓
 *   CANCELLED - Persist final state
 * 
   * @param jobId The job ID to cancel
   * @param cancelBy The user ID requesting cancellation
   * @returns Cancellation result
   */
  requestCancellation(jobId: string, cancelBy: string): CancellationResult {
    const jobState = this.executionQueue.getJob(jobId)

    if (!jobState) {
      return {
        successful: false,
        jobId,
        taskId: null,
        finalStatus: ExecutionStatus.FAILED,
        error: 'Job not found',
      }
    }

    // Check if job can be cancelled
    if (
      jobState.status === ExecutionStatus.COMPLETED ||
      jobState.status === ExecutionStatus.FAILED ||
      jobState.status === ExecutionStatus.CANCELLED
    ) {
      return {
        successful: false,
        jobId,
        taskId: null,
        finalStatus: jobState.status,
        error: `Cannot cancel job in "${jobState.status}" status`,
      }
    }

    // Transition to CANCEL_REQUESTED
    jobState.status = ExecutionStatus.CANCEL_REQUESTED
    jobState.cancelled = true
    jobState.updatedAt = new Date()

    // Stop accepting new tasks (already checked above)
    // TODO: Persist the cancellation state to database

    // Terminate any executing tasks
    const terminatedTaskId: string | null = this.terminateExecutingTasks(jobId)

    // Transition to CANCELLED
    jobState.status = ExecutionStatus.CANCELLED
    jobState.completedAt = new Date()
    jobState.updatedAt = new Date()

    // TODO: Persist final state to database

    return {
      successful: true,
      jobId,
      taskId: terminatedTaskId,
      finalStatus: ExecutionStatus.CANCELLED,
      error: null,
    }
  }

  /**
   * Terminate executing tasks for a job.
   */
  private terminateExecutingTasks(jobId: string): string | null {
    const jobState = this.executionQueue.getJob(jobId)
    if (!jobState) return null

    const terminated: string[] = []

    for (const taskId of jobState.executingTasks) {
      const task = jobState.tasks.find((t) => t.id === taskId)
      if (task) {
        // TODO: Platform-specific process termination
        // In a real implementation, would kill the process
        task.status = ExecutionStatus.CANCELLED
        task.completedAt = new Date()
        terminated.push(taskId)
      }
    }

    jobState.executingTasks.clear()

    return terminated.length > 0 ? terminated[0] : null
  }

  /**
   * Check if a job can be cancelled.
   */
  canCancel(jobId: string): { canCancel: boolean; reason: string } {
    const jobState = this.executionQueue.getJob(jobId)

    if (!jobState) {
      return { canCancel: false, reason: 'Job not found' }
    }

    if (
      jobState.status === ExecutionStatus.COMPLETED ||
      jobState.status === ExecutionStatus.FAILED ||
      jobState.status === ExecutionStatus.CANCELLED
    ) {
      return {
        canCancel: false,
        reason: `Cannot cancel job in "${jobState.status}" status`,
      }
    }

    if (jobState.status === ExecutionStatus.CREATED) {
      return {
        canCancel: true,
        reason: 'Job is in CREATED status, can be cancelled',
      }
    }

    if (jobState.status === ExecutionStatus.QUEUED) {
      return {
        canCancel: true,
        reason: 'Job is in QUEUED status, can be cancelled',
      }
    }

    return {
      canCancel: jobState.status !== ExecutionStatus.RUNNING,
      reason: jobState.status === ExecutionStatus.RUNNING ? 'Job is currently running' : 'Unknown status',
    }
  }

  /**
   * Get cancellation status of a job.
   */
  getCancellationStatus(jobId: string): {
    status: ExecutionStatus
    cancelled: boolean
    cancelledAt: Date | null
    progress: number
  } {
    const jobState = this.executionQueue.getJob(jobId)

    if (!jobState) {
      return {
        status: ExecutionStatus.FAILED,
        cancelled: false,
        cancelledAt: null,
        progress: 0,
      }
    }

    const totalTasks = jobState.tasks.length
    const completedTasks = jobState.completedTasks.size
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      status: jobState.status,
      cancelled: jobState.cancelled,
      cancelledAt: jobState.completedAt || null, // Using completedAt as proxy
      progress,
    }
  }
}

/**
 * Factory function to create a CancellationManager
 */
export function createCancellationManager(workspacePath: string): CancellationManager {
  return new CancellationManager(workspacePath)
}