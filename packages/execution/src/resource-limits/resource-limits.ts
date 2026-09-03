/**
 * P9 Resource Limits Configuration
 * 
 * Execution must have safety limits. At minimum provide configurable limits for:
 *   - maximum concurrent jobs
 *   - maximum tasks/job
 *   - task timeout
 *   - job timeout
 *   - maximum output/log size
 *   - maximum generated file size
 *   - maximum workspace size where practical
 * 
 * Read configuration through the existing configuration system.
 * No hardcoded secrets.
 */
import * as fs from 'fs'
import * as path from 'path'

/**
 * Resource limits configuration interface
 */
export interface ResourceLimits {
  /** Maximum concurrent jobs per organization */
  maxConcurrentJobs: number
  /** Maximum concurrent tasks per job */
  maxConcurrentTasksPerJob: number
  /** Task timeout in milliseconds */
  taskTimeoutMs: number
  /** Job timeout in milliseconds */
  jobTimeoutMs: number
  /** Maximum output/log size in bytes */
  maxOutputSize: number
  /** Maximum generated file size in bytes */
  maxGeneratedFileSize: number
  /** Maximum workspace size in bytes where practical */
  maxWorkspaceSize: number | null
  /** Whether limits are enforced */
  enforced: boolean
}

/**
 * Default resource limits
 */
export const DEFAULT_LIMITS: ResourceLimits = {
  maxConcurrentJobs: 5,
  maxConcurrentTasksPerJob: 3,
  taskTimeoutMs: 300000, // 5 minutes
  jobTimeoutMs: 600000, // 10 minutes
  maxOutputSize: 10 * 1024 * 1024, // 10MB
  maxGeneratedFileSize: 5 * 1024 * 1024, // 5MB
  maxWorkspaceSize: 100 * 1024 * 1024, // 100MB
  enforced: true,
}

/**
 * Read resource limits from configuration.
 * 
 * In a production implementation, this would read from the
 * existing configuration system (env variables, config files, etc.).
 * 
 * @returns Resource limits configuration
 */
export function readResourceLimits(): ResourceLimits {
  // Try to read from environment variables
  const envLimits: Partial<ResourceLimits> = {
    maxConcurrentJobs: process.env.MAX_CONCURRENT_JOBS 
      ? parseInt(process.env.MAX_CONCURRENT_JOBS, 10) 
      : undefined,
    maxConcurrentTasksPerJob: process.env.MAX_CONCURRENT_TASKS_PER_JOB 
      ? parseInt(process.env.MAX_CONCURRENT_TASKS_PER_JOB, 10) 
      : undefined,
    taskTimeoutMs: process.env.TASK_TIMEOUT_MS 
      ? parseInt(process.env.TASK_TIMEOUT_MS, 10) 
      : undefined,
    jobTimeoutMs: process.env.JOB_TIMEOUT_MS 
      ? parseInt(process.env.JOB_TIMEOUT_MS, 10) 
      : undefined,
    maxOutputSize: process.env.MAX_OUTPUT_SIZE 
      ? parseInt(process.env.MAX_OUTPUT_SIZE, 10) 
      : undefined,
    maxGeneratedFileSize: process.env.MAX_GENERATED_FILE_SIZE 
      ? parseInt(process.env.MAX_GENERATED_FILE_SIZE, 10) 
      : undefined,
    maxWorkspaceSize: process.env.MAX_WORKSPACE_SIZE 
      ? parseInt(process.env.MAX_WORKSPACE_SIZE, 10) 
      : undefined,
  }

  // Apply environment overrides to defaults, respecting enforced flag
  const limits: ResourceLimits = {
    ...DEFAULT_LIMITS,
    ...envLimits,
    enforced: process.env.ENABLE_LIMITS !== 'false', // default to enforced
  }

  return limits
}

/**
 * Validate that a job configuration respects resource limits.
 * 
 * @param limits The resource limits configuration
 * @param jobConfig The job configuration to validate
 * @returns Whether the job configuration is within limits
 */
export function validateJobConfig(limits: ResourceLimits, jobConfig: {
  concurrentTasks?: number
  timeoutMs?: number
  outputSize?: number
  fileSize?: number
  workspaceSize?: number
}): boolean {
  if (limits.enforced) {
    if (jobConfig.concurrentTasks && jobConfig.concurrentTasks > limits.maxConcurrentTasksPerJob) {
      return false
    }
    if (jobConfig.timeoutMs && jobConfig.timeoutMs > limits.taskTimeoutMs) {
      return false
    }
    if (jobConfig.outputSize && jobConfig.outputSize > limits.maxOutputSize) {
      return false
    }
    if (jobConfig.fileSize && jobConfig.fileSize > limits.maxGeneratedFileSize) {
      return false
    }
    if (jobConfig.workspaceSize && limits.maxWorkspaceSize && jobConfig.workspaceSize > limits.maxWorkspaceSize) {
      return false
    }
  }

  return true
}

/**
 * Check if adding a new job would exceed concurrent job limits.
 * 
 * @param limits The resource limits configuration
 * @param currentConcurrentJobs Current number of running jobs
 * @returns Whether a new job can be started
 */
export function canStartNewJob(limits: ResourceLimits, currentConcurrentJobs: number): boolean {
  if (!limits.enforced) {
    return true // Limits not enforced
  }
  return currentConcurrentJobs < limits.maxConcurrentJobs
}

/**
 * Check if a task can be added to a job (task limit).
 * 
 * @param limits The resource limits configuration
 * @param currentTasks Current number of tasks in the job
 * @returns Whether a new task can be added
 */
export function canAddTaskToJob(limits: ResourceLimits, currentTasks: number): boolean {
  if (!limits.enforced) {
    return true // Limits not enforced
  }
  return currentTasks < limits.maxConcurrentTasksPerJob
}

export { DEFAULT_LIMITS, readResourceLimits, validateJobConfig, canStartNewJob, canAddTaskToJob }