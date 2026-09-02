import { AIProjectRequirement } from './requirement-model'
import { LanguageId, FrameworkId, ProjectType } from '../factory/src/project-types'
import { FrameworkDefinitions, getFrameworksForLanguage } from '../factory/src/framework-registry'
import { LanguageDefinitions } from '../factory/src/project-types'

/** Project Plan — Output of the AI Project Planner.
 *
 * Contains the complete plan derived from a normalized requirement.
 */
export interface AIProjectPlan {
  /** Unique plan ID. */
  planId?: string
  /** Associated requirement ID. */
  requirementId?: string
  /** Organization ID. */
  organizationId?: string
  /** Requested by user. */
  requestedBy?: string
  /** Selected language. */
  selectedLanguage?: LanguageId
  /** Selected framework. */
  selectedFramework?: FrameworkId
  /** Project type. */
  projectType?: ProjectType
  /** Target platform. */
  targetPlatform?: string
  /** Architecture description. */
  architecture?: string
  /** Data models. */
  dataModels?: string
  /** API specification. */
  apiSpecification?: string
  /** Authentication configuration. */
  authentication?: string
  /** Authorization configuration. */
  authorization?: string
  /** Testing strategy. */
  testingStrategy?: string
  /** Build strategy. */
  buildStrategy?: string
  /** Deployment target. */
  deploymentTarget?: string
  /** Generation tasks. */
  generationTasks?: GenerationTask[]
  /** Metadata. */
  metadata?: Record<string, unknown>
  /** Timestamps. */
  createdAt?: Date
  updatedAt?: Date
}

/** Generation Task — A single task in the generation plan. */
export interface GenerationTask {
  /** Unique task ID. */
  taskId?: string
  /** Project ID. */
  projectId?: string
  /** Task type. */
  taskType?: string
  /** Description. */
  description?: string
  /** Dependencies (task IDs). */
  dependencies?: string[]
  /** Target files. */
  targetFiles?: string[]
  /** Language. */
  language?: LanguageId
  /** Framework. */
  framework?: FrameworkId
  /** Status. */
  status?: 'pending' | 'planning' | 'generating' | 'generated' | 'validated' | 'failed'
  /** Retry count. */
  retryCount?: number
  /** Max retries. */
  maxRetries?: number
  /** Created at. */
  createdAt?: Date
  completedAt?: Date
}

/** AI Project Planner Service.
 *
 * Takes a normalized AIProjectRequirement and produces an AIProjectPlan.
 * Uses P7 registries for technology selection.
 */
export class ProjectPlanner {
  /** Plan a project from a requirement. */
  plan(requirement: AIProjectRequirement): AIProjectPlan {
    // 1. Validate the requirement
    if (!isValidRequirement(requirement)) {
      throw new Error('Invalid AI project requirement')
    }

    // 2. Initialize plan
    const plan: AIProjectPlan = {
      planId: `${requirement.projectName}-plan-${Date.now()}`,
      requirementId: requirement.requirementId,
      organizationId: requirement.organizationId,
      requestedBy: requirement.requestedBy,
      projectType: requirement.projectType,
      targetPlatform: requirement.targetPlatform,
      selectedLanguage: requirement.preferredLanguage,
      selectedFramework: requirement.preferredFramework,
      architecture: undefined,
      dataModels: undefined,
      apiSpecification: undefined,
      authentication: undefined,
      authorization: undefined,
      testingStrategy: undefined,
      buildStrategy: undefined,
      deploymentTarget: undefined,
      generationTasks: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // 3. Technology selection using registries
    this.selectTechnology(plan, requirement)

    // 4. Architecture generation (high-level)
    this.generateArchitecture(plan, requirement)

    // 5. Generate generation tasks
    this.generateTasks(plan, requirement)

    // 6. Finalize
    plan.updatedAt = new Date()
    return plan
  }

  /** Select technology based on requirement and registries. */
  private selectTechnology(
    plan: AIProjectPlan,
    requirement: AIProjectRequirement
  ): void {
    const prefLang = requirement.preferredLanguage
    const prefFramework = requirement.preferredFramework
    const projType = requirement.projectType

    // If user specified language and framework, validate and use them
    if (prefLang && prefFramework) {
      const langDef = LanguageDefinitions[prefLang]
      if (!langDef) {
        // Unknown language - set as undefined, will use fallback
        plan.selectedLanguage = undefined
      } else {
        plan.selectedLanguage = prefLang
        // Validate framework against language
        const frameworks = getFrameworksForLanguage(prefLang)
        const matchingFramework = frameworks.find(
          (f) => f.frameworkId === prefFramework
        )
        if (matchingFramework) {
          plan.selectedFramework = prefFramework
        } else {
          // Framework not supported for this language, fall back
          this.selectDefaultTechnology(plan, projType)
        }
      }
    } else {
      // No explicit language/framework - select from supported stacks
      this.selectDefaultTechnology(plan, projType)
    }
  }

  /** Select default technology stack based on project type. */
  private selectDefaultTechnology(
    plan: AIProjectPlan,
    projType?: string
  ): void {
    // Deterministic selection using registries
    let language: LanguageId | undefined
    let framework: FrameworkId | undefined

    if (projType === 'backend' || projType === 'api') {
      // Python FastAPI stack
      language = 'python'
      framework = 'fastapi'
    } else if (projType === 'web' || projType === 'software') {
      // TypeScript Next.js stack
      language = 'typescript'
      framework = 'nextjs'
    } else {
      // Default to Python FastAPI
      language = 'python'
      framework = 'fastapi'
    }

    plan.selectedLanguage = language
    plan.selectedFramework = framework
  }

  /** Generate high-level architecture. */
  private generateArchitecture(
    plan: AIProjectPlan,
    requirement: AIProjectRequirement
  ): void {
    const lang = plan.selectedLanguage
    const fw = plan.selectedFramework

    // Generate structured architecture based on language/framework
    let arch: string | undefined

    if (lang === 'python' && fw === 'fastapi') {
      arch = [
        '--- Architecture ---',
        'Layers:',
        '  - Presentation: FastAPI routes',
        '  - Business: Services',
        '  - Data: Repository pattern',
        '',
        'Services:',
        '  - User service',
        '  - Project service',
        '  - Authentication service',
        '',
        'Routes:',
        '  - GET /',
        '  - POST /projects',
        '  - GET /projects/{id}',
        '',
        'Repository:',
        '  - User repository',
        '  - Project repository',
        '',
        'Configuration:',
        '  - Environment variables',
        '  - Dependency injection',
        '',
        'Testing:',
        '  - pytest unit tests',
        '  - Integration tests',
        '',
        'Database:',
        '  - PostgreSQL',
        '  - SQLAlchemy ORM',
        '',
      ].join('\n')
    } else if (lang === 'typescript' && fw === 'nextjs') {
      arch = [
        '--- Architecture ---',
        'Layers:',
        '  - Presentation: Next.js Pages/Components',
        '  - Business: Services',
        '  - Data: API Routes + Repository',
        '',
        'Pages:',
        '  - / (home)',
        '  - /projects [list]',
        '  - /projects/[id] [detail]',
        '',
        'API Routes:',
        '  - GET /api/projects',
        '  - POST /api/projects',
        '',
        'Services:',
        '  - User service',
        '  - Project service',
        '',
        'Testing:',
        '  - Jest unit tests',
        '  - Integration tests',
        '',
        'Database:',
        '  - PostgreSQL',
        '  - Prisma ORM',
        '',
      ].join('\n')
    } else if (lang === 'java' && fw === 'spring_boot') {
      arch = [
        '--- Architecture ---',
        'Layers:',
        '  - Presentation: REST Controllers',
        '  - Business: Services',
        '  - Data: Repositories',
        '',
        'Controllers:',
        '  - ProjectController',
        '  - UserController',
        '',
        'Services:',
        '  - UserService',
        '  - ProjectService',
        '',
        'Repositories:',
        '  - UserRepository',
        '  - ProjectRepository',
        '',
        'Configuration:',
        '  - Spring Boot application.yml',
        '  - JPA/Hibernate',
        '',
        'Testing:',
        '  - JUnit 5',
        '  - Testcontainers',
        '',
        'Database:',
        '  - PostgreSQL',
        '  - Spring Data JPA',
        '',
      ].join('\n')
    } else {
      arch = '--- Architecture ---\n[Structured architecture to be generated based on selected language/framework]'
    }

    plan.architecture = arch
  }

  /** Generate generation tasks based on architecture and plan. */
  private generateTasks(
    plan: AIProjectPlan,
    requirement: AIProjectRequirement
  ): void {
    const tasks: GenerationTask[] = []

    // Task 1: Initialize project
    tasks.push({
      taskId: `${plan.planId}-init`,
      taskType: 'initialize',
      description: 'Initialize project structure',
      targetFiles: ['package.json', 'pyproject.toml', 'pom.xml', 'src/'],
      language: plan.selectedLanguage,
      framework: plan.selectedFramework,
      status: 'pending',
    })

    // Task 2: Create configuration
    tasks.push({
      taskId: `${plan.planId}-config`,
      taskType: 'configuration',
      description: 'Create project configuration files',
      targetFiles: ['src/config/'],
      language: plan.selectedLanguage,
      framework: plan.selectedFramework,
      status: 'pending',
    })

    // Task 3: Create data models
    tasks.push({
      taskId: `${plan.planId}-models`,
      taskType: 'models',
      description: 'Create data models/entities',
      targetFiles: ['src/models/', 'src/entities/'],
      language: plan.selectedLanguage,
      framework: plan.selectedFramework,
      status: 'pending',
    })

    // Task 4: Create API layer
    tasks.push({
      taskId: `${plan.planId}-api`,
      taskType: 'api',
      description: 'Create API layer/routes',
      targetFiles: ['src/routes/', 'src/controllers/', 'src/api/'],
      language: plan.selectedLanguage,
      framework: plan.selectedFramework,
      status: 'pending',
    })

    // Task 5: Create authentication
    tasks.push({
      taskId: `${plan.planId}-auth`,
      taskType: 'authentication',
      description: 'Create authentication middleware/configure auth',
      targetFiles: ['src/middleware/', 'src/auth/'],
      language: plan.selectedLanguage,
      framework: plan.selectedFramework,
      status: 'pending',
    })

    // Task 6: Create business services
    tasks.push({
      taskId: `${plan.planId}-services`,
      taskType: 'services',
      description: 'Create business logic services',
      targetFiles: ['src/services/'],
      language: plan.selectedLanguage,
      framework: plan.selectedFramework,
      status: 'pending',
    })

    // Task 7: Create tests
    tasks.push({
      taskId: `${plan.planId}-tests`,
      taskType: 'testing',
      description: 'Create test suite',
      targetFiles: ['src/tests/', '__tests__/'],
      language: plan.selectedLanguage,
      framework: plan.selectedFramework,
      status: 'pending',
    })

    // Task 8: Create documentation
    tasks.push({
      taskId: `${plan.planId}-docs`,
      taskType: 'documentation',
      description: 'Generate project documentation',
      targetFiles: ['README.md', 'docs/'],
      language: plan.selectedLanguage,
      framework: plan.selectedFramework,
      status: 'pending',
    })

    plan.generationTasks = tasks
  }
}

/** Creates a new ProjectPlanner instance. */
export function createProjectPlanner(): ProjectPlanner {
  return new ProjectPlanner()
}