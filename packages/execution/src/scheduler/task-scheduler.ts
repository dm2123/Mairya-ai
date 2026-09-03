/**
 * P9 Execution Task Scheduler
 * 
 * Resolves and orders P8 generation tasks by dependencies.
 * Detects circular dependencies, missing dependencies, and invalid task IDs.
 * Fails safely with structured errors.
 */

import { ExecutionStatus } from '../executor/execution-models'

/**
 * Dependency resolver for execution tasks.
 * Takes an array of execution tasks and returns a topologically sorted order.
 * 
 * @param tasks Array of ExecutionTask objects
 * @returns Sorted task IDs in execution order, or throws on error
 */
export function resolveTaskDependencies(tasks: ExecutionTask[]): string[] {
  // Build adjacency map: taskId -> dependency taskIds
  const taskMap = new Map<string, ExecutionTask>()
  for (const task of tasks) {
    taskMap.set(task.id, task)
  }

  // Result order and visited set for cycle detection
  const sorted: string[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const errors: string[] = []

  /**
   * DFS-based topological sort with cycle detection
   * @param taskId The task ID to process
   */
  function process(taskId: string): boolean {
    // If already fully processed, success (no cycle involving this path)
    if (visited.has(taskId)) {
      return true
    }

    // If currently being visited, we found a cycle
    if (visiting.has(taskId)) {
      errors.push(`Circular dependency detected involving task: ${taskId}`)
      return false
    }

    const task = taskMap.get(taskId)
    if (!task) {
      errors.push(`Missing dependency: task ${taskId} not found`)
      return false
    }

    // Mark as currently being visited
    visiting.add(taskId)

    // Process all dependencies first
    const deps = task.dependencies || []
    for (const depId of deps) {
      // Check if dependency task exists
      if (!taskMap.has(depId)) {
        errors.push(`Missing dependency: task ${depId} referenced by ${taskId} not found`)
        visiting.delete(taskId)
        return false
      }
      // Recursively process the dependency
      if (!process(depId)) {
        visiting.delete(taskId)
        return false
      }
    }

    // Mark as fully processed
    visiting.delete(taskId)
    visited.add(taskId)
    sorted.push(taskId)

    return true
  }

  // Process all tasks to detect any issues and build the order
  for (const taskId of taskMap.keys()) {
    if (!visited.has(taskId)) {
      if (!process(taskId)) {
        // Error already added in process()
        return []
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Dependency resolution failed: ${errors.join('; ')}`)
  }

  return sorted
}

/**
 * Validate that all task dependencies are valid.
 * Checks for:
 * - Missing dependency references
 * - Circular dependencies
 * - Self-referencing dependencies
 * 
 * @param tasks Array of ExecutionTask objects
 * @returns Validation result with errors if any
 */
export function validateTaskDependencies(tasks: ExecutionTask[]): {
  valid: boolean
  errors: string[]
  sortedOrder: string[]
} {
  const errors: string[] = []
  const taskMap = new Map<string, ExecutionTask>()

  for (const task of tasks) {
    taskMap.set(task.id, task)
  }

  // Check for self-referencing dependencies
  for (const task of tasks) {
    if (task.dependencies && task.dependencies.includes(task.id)) {
      errors.push(`Self-referencing dependency: task ${task.id} depends on itself`)
    }
  }

  // Try to resolve dependencies
  let sorted: string[]
  try {
    sorted = resolveTaskDependencies(tasks)
  } catch (e) {
    errors.push((e as Error).message)
    return { valid: false, errors, sortedOrder: [] }
  }

  return {
    valid: errors.length === 0,
    errors,
    sortedOrder: sorted,
  }
}

/**
 * Get ready-to-execute tasks given completed task IDs.
 * A task is ready if all its dependencies are in the completed set.
 * 
 * @param tasks All execution tasks
 * @param completedIds Set of task IDs that have completed
 * @returns Tasks that are ready to execute
 */
export function getReadyTasks(
  tasks: ExecutionTask[],
  completedIds: Set<string>
): ExecutionTask[] {
  const ready: ExecutionTask[] = []

  for (const task of tasks) {
    const deps = task.dependencies || []
    // A task is ready if all its dependencies are completed
    const allDepsCompleted = deps.every((depId) => completedIds.has(depId))

    if (allDepsCompleted) {
      ready.push(task)
    }
  }

  return ready
}

/**
 * Get the next task to execute based on dependency order.
 * Returns the first ready task in topological order, or null if none are ready.
 * 
 * @param tasks All execution tasks
 * @param completedIds Set of completed task IDs
 * @param executedIds Set of currently executing task IDs
 * @returns Next executable task or null
 */
export function getNextTask(
  tasks: ExecutionTask[],
  completedIds: Set<string>,
  executedIds: Set<string>
): ExecutionTask | null {
  const ready = getReadyTasks(tasks, completedIds)

  // Filter out tasks that are already executing
  const available = ready.filter((task) => !executedIds.has(task.id))

  if (available.length === 0) {
    return null
  }

  // Sort by priority (higher priority first) and then by creation order
  // For now, return the first available task
  return available[0]
}

export { resolveTaskDependencies, validateTaskDependencies, getReadyTasks, getNextTask }