import { ArchitectureOutput } from './architecture-generator'
import { AIProjectPlan } from './project-planner'
import { GenerationTask } from './requirement-model'

/** Generation Plan — Converts architecture into generation tasks.
 *
 * Each task has ID, type, description, dependencies, target files,
 * language, framework, status, and retry information.
 *
 * Tasks support dependency ordering.
 */

export interface GenerationPlan {
  /** Unique plan ID. */
  planId?: string
  /** Project ID. */
  projectId?: string
  /** Technology stack. */
  technologyStack?: any
  /** Architecture output. */
  architecture?: ArchitectureOutput
  /** Generation tasks ordered by dependency. */
  tasks?: GenerationTask[]
  /** Total task count. */
  totalTasks?: number
  /** Completed task count. */
  completedTasks?: number
  /** Created at. */
  createdAt?: Date
  /** Updated at. */
  updatedAt?: Date
}

/** Creates a generation plan from architecture and project ID. */
export function createGenerationPlan(
  architecture: ArchitectureOutput,
  projectId: string
): GenerationPlan {
  const plan: GenerationPlan = {
    planId: `${projectId}-genplan-${Date.now()}`,
    projectId,
    technologyStack: architecture.technologyStack,
    architecture,
    tasks: [],
    totalTasks: 0,
    completedTasks: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Convert architecture into ordered generation tasks
  const taskList = architecture
    ? generateTasksFromArchitecture(architecture)
    : defaultTasks(architecture)

  plan.tasks = taskList
  plan.totalTasks = taskList.length
  plan.updatedAt = new Date()

  return plan
}

/** Generates ordered generation tasks from architecture. */
function generateTasksFromArchitecture(
  architecture: ArchitectureOutput
): GenerationTask[] {
  const tasks: GenerationTask[] = []

  if (!architecture?.modules) return tasks

  // Task ordering respects dependencies implicitly:
  // 1. Initialize project (always first)
  // 2. Create configuration
  // 3. Create data models
  // 4. Create API layer
  // 5. Create authentication
  // 6. Create business services
  // 7. Create tests
  // 8. Create documentation

  tasks.push({
    taskId: 'task-1',
    taskType: 'initialize',
    description: 'Initialize project structure',
    dependencies: [],
    targetFiles: architecture.modules.slice(0, 3),
    technologyStack: architecture.technologyStack,
    status: 'pending',
  })

  tasks.push({
    taskId: 'task-2',
    taskType: 'configuration',
    description: 'Create configuration files',
    dependencies: ['task-1'],
    targetFiles: ['config/', 'package.json', 'pyproject.toml'],
    technologyStack: architecture.technologyStack,
    status: 'pending',
  })

  tasks.push({
    taskId: 'task-3',
    taskType: 'models',
    description: 'Create data models and entities',
    dependencies: ['task-2'],
    targetFiles: architecture.models?.map((m) => `src/models/${m}.ts`) || ['src/models/*.ts'],
    technologyStack: architecture.technologyStack,
    status: 'pending',
  })

  tasks.push({
    taskId: 'task-4',
    taskType: 'api',
    description: 'Create API layer and routes',
    dependencies: ['task-3'],
    targetFiles: architecture.controllers?.map((c) => `src/controllers/${c}.ts`) || ['src/controllers/*.ts'],
    technologyStack: architecture.technologyStack,
    status: 'pending',
  })

  tasks.push({
    taskId: 'task-5',
    taskType: 'authentication',
    description: 'Create authentication middleware and configure auth',
    dependencies: ['task-4'],
    targetFiles: ['src/middleware/auth.ts', 'src/config/auth.ts'],
    technologyStack: architecture.technologyStack,
    status: 'pending',
  })

  tasks.push({
    taskId: 'task-6',
    taskType: 'services',
    description: 'Create business logic services',
    dependencies: ['task-5'],
    targetFiles: architecture.services?.map((s) => `src/services/${s}.ts`) || ['src/services/*.ts'],
    technologyStack: architecture.technologyStack,
    status: 'pending',
  })

  tasks.push({
    taskId: 'task-7',
    taskType: 'testing',
    description: 'Create test suite',
    dependencies: ['task-6'],
    targetFiles: ['src/tests/', '__tests__/'],
    technologyStack: architecture.technologyStack,
    status: 'pending',
  })

  tasks.push({
    taskId: 'task-8',
    taskType: 'documentation',
    description: 'Generate project documentation',
    dependencies: ['task-7'],
    targetFiles: ['README.md', 'docs/'],
    technologyStack: architecture.technologyStack,
    status: 'pending',
  })

  return tasks
}

/** Default generation tasks when no architecture is available. */
function defaultTasks(
  architecture?: ArchitectureOutput
): GenerationTask[] {
  return [
    {
      taskId: 'task-1',
      taskType: 'initialize',
      description: 'Initialize project structure',
      dependencies: [],
      targetFiles: ['src/'],
      status: 'pending',
    },
    {
      taskId: 'task-2',
      taskType: 'configuration',
      description: 'Create configuration files',
      dependencies: ['task-1'],
      targetFiles: ['config/', 'package.json'],
      status: 'pending',
    },
    {
      taskId: 'task-3',
      taskType: 'models',
      description: 'Create data models',
      dependencies: ['task-2'],
      targetFiles: ['src/models/*.ts'],
      status: 'pending',
    },
    {
      taskId: 'task-4',
      taskType: 'api',
      description: 'Create API layer',
      dependencies: ['task-3'],
      targetFiles: ['src/controllers/*.ts'],
      status: 'pending',
    },
    {
      taskId: 'task-5',
      taskType: 'authentication',
      description: 'Configure authentication',
      dependencies: ['task-4'],
      targetFiles: ['src/middleware/auth.ts'],
      status: 'pending',
    },
    {
      taskId: 'task-6',
      taskType: 'services',
      description: 'Create business services',
      dependencies: ['task-5'],
      targetFiles: ['src/services/*.ts'],
      status: 'pending',
    },
    {
      taskId: 'task-7',
      taskType: 'testing',
      description: 'Create tests',
      dependencies: ['task-6'],
      targetFiles: ['src/tests/*.ts'],
      status: 'pending',
    },
    {
      taskId: 'task-8',
      taskType: 'documentation',
      description: 'Generate documentation',
      dependencies: ['task-7'],
      targetFiles: ['README.md'],
      status: 'pending',
    },
  ]
}

/** Orders tasks by dependency (topological sort).
 * Ensures tasks are executed in correct order.
 */
export function orderTasksByDependency(
  tasks: GenerationTask[]
): GenerationTask[] {
  // Simple implementation - tasks are already ordered by dependencies
  // In a full implementation, do topological sort
  const ordered: GenerationTask[] = [...tasks]

  // Ensure no task has itself as a dependency
  for (const task of ordered) {
    task.dependencies = task.dependencies?.filter(
      (dep) => dep !== task.taskId
    )
  }

  return ordered
}

/** Validates that a generation plan has tasks. */
export function isValidGenerationPlan(plan: GenerationPlan): boolean {
  return (
    plan.planId !== undefined &&
    plan.tasks !== undefined &&
    plan.totalTasks > 0
  )
}