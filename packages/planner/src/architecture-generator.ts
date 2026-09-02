import { TechnologyStack } from './technology-selector'
import { AIProjectRequirement } from './requirement-model'
import { AIProjectPlan } from './project-planner'

/** Architecture Planner — Generates a structured architecture rather than
 * immediately generating code.
 *
 * Output is machine-readable and includes layers, modules, services,
 * controllers, models, repositories, configuration, and tests.
 */

export interface ArchitectureOutput {
  /** Unique architecture ID. */
  architectureId?: string
  /** Selected technology stack. */
  technologyStack?: TechnologyStack
  /** Layers description. */
  layers?: string
  /** Modules list. */
  modules?: string[]
  /** Services list. */
  services?: string[]
  /** Controllers/routes list. */
  controllers?: string[]
  /** Models/entities list. */
  models?: string[]
  /** Repositories/data access list. */
  repositories?: string[]
  /** Configuration items. */
  configuration?: string
  /** Testing strategy. */
  testingStrategy?: string
  /** Build command. */
  buildCommand?: string
  /** Deployment target. */
  deploymentTarget?: string
  /** Generated at timestamp. */
  generatedAt?: Date
}

/** Generates a structured architecture from a requirement and technology stack. */
export function generateArchitecture(
  requirement: AIProjectRequirement,
  technologyStack: TechnologyStack
): ArchitectureOutput {
  const lang = technologyStack.language
  const fw = technologyStack.framework
  const projType = technologyStack.projectType

  const architecture: ArchitectureOutput = {
    architectureId: `${requirement.projectName}-arch-${Date.now()}`,
    technologyStack,
    layers: undefined,
    modules: undefined,
    services: undefined,
    controllers: undefined,
    models: undefined,
    repositories: undefined,
    configuration: undefined,
    testingStrategy: undefined,
    buildCommand: undefined,
    deploymentTarget: undefined,
    generatedAt: new Date(),
  }

  // Generate structured architecture based on language/framework
  let layers: string | undefined
  let modules: string[] = []
  let services: string[] = []
  let controllers: string[] = []
  let models: string[] = []
  let repositories: string[] = []
  let configuration: string | undefined
  let testingStrategy: string | undefined
  let buildCommand: string | undefined
  let deploymentTarget: string | undefined

  if (lang === 'python' && fw === 'fastapi') {
    layers = [
      'Presentation Layer: FastAPI routes',
      'Business Logic Layer: Services',
      'Data Access Layer: Repositories',
      'Configuration: Environment variables',
    ].join('\n')

    modules = ['main.py', 'models.py', 'services.py', 'repositories.py', 'api/routes.py']
    services = ['UserService', 'ProjectService', 'AuthService']
    controllers = ['app.py', 'routes.py']
    models = ['User', 'Project', 'Profile']
    repositories = ['UserRepository', 'ProjectRepository']
    configuration = 'Settings via environment variables'
    testingStrategy = 'pytest'
    buildCommand = 'python -m uvicorn main:app --host 0.0.0.0 --port 8000'
    deploymentTarget = 'Docker container or cloud deployment'

  } else if (lang === 'typescript' && fw === 'nextjs') {
    layers = [
      'Presentation Layer: Next.js Pages/Components',
      'Business Logic Layer: Services',
      'Data Access Layer: API Routes + Repository',
      'Configuration: Next.js environment variables',
    ].join('\n')

    modules = [
      'src/pages/',
      'src/components/',
      'src/services/',
      'src/api/',
      'src/lib/',
    ]
    services = ['UserService', 'ProjectService', 'AuthService']
    controllers = ['src/pages/api/projects.ts', 'src/pages/api/auth.ts']
    models = ['User', 'Project', 'Profile']
    repositories = ['UserRepository', 'ProjectRepository']
    configuration = 'Next.js environment variables'
    testingStrategy = 'Jest'
    buildCommand = 'npm run build'
    deploymentTarget = 'Vercel, Netlify, or Docker'

  } else if (lang === 'java' && fw === 'spring_boot') {
    layers = [
      'Presentation Layer: REST Controllers',
      'Business Logic Layer: Services',
      'Data Access Layer: Repositories',
      'Configuration: application.yml',
    ].join('\n')

    modules = [
      'src/main/java/com/example/demo/',
      'src/main/resources/',
      'src/test/java/',
    ]
    services = ['UserService', 'ProjectService', 'AuthService']
    controllers = ['ProjectController', 'UserController']
    models = ['User', 'Project', 'Profile']
    repositories = ['UserRepository', 'ProjectRepository']
    configuration = 'Spring Boot application.yml'
    testingStrategy = 'JUnit 5'
    buildCommand = 'mvn spring-boot:run'
    deploymentTarget = 'Docker, Cloud Foundry, or Docker'

  } else {
    // Fallback architecture for unknown stacks
    layers = 'Structured architecture to be generated based on selected language/framework'
    modules = ['TBD']
    services = ['TBD']
    controllers = ['TBD']
    models = ['TBD']
    repositories = ['TBD']
    configuration = 'Configuration to be defined'
    testingStrategy = 'To be determined'
    buildCommand = 'To be determined'
    deploymentTarget = 'To be determined'
  }

  architecture.layers = layers
  architecture.modules = modules
  architecture.services = services
  architecture.controllers = controllers
  architecture.models = models
  architecture.repositories = repositories
  architecture.configuration = configuration
  architecture.testingStrategy = testingStrategy
  architecture.buildCommand = buildCommand
  architecture.deploymentTarget = deploymentTarget

  return architecture
}

/** Validates an architecture output has all required fields. */
export function isValidArchitecture(arch: ArchitectureOutput): boolean {
  return (
    arch.architectureId !== undefined &&
    arch.technologyStack !== undefined &&
    arch.layers !== undefined
  )
}