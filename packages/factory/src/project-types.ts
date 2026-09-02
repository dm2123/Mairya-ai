import { LanguageId, FrameworkId, ProjectType, TargetPlatform, ProjectSpecification, isValidProjectSpec } from './project-specification'

/**
 * Project Type Registry — Extensible registry of supported project types.
 *
 * P7 supports these project types. Later phases can add more.
 */
export enum SupportedProjectType {
  WEB = 'web',
  BACKEND = 'backend',
  SOFTWARE = 'software',
  MOBILE FOUNDATION = 'mobile_foundation',
  DESKTOP FOUNDATION = 'desktop_foundation',
}

/** Language registry entry. */
export interface LanguageDefinition {
  languageId: LanguageId
  displayName: string
  version: string
  runtime: string
  packageManager: string
  buildSystem: string
  testSystem: string
  formatter: string
  linter: string
  supportedFrameworks: FrameworkId[]
  enabled: boolean
  capabilityMetadata: Record<string, unknown>
}

/** Framework registry entry. */
export interface FrameworkDefinition {
  frameworkId: FrameworkId
  language: LanguageId
  displayName: string
  version: string
  supportedProjectTypes: ProjectType[]
  initStrategy: string
  buildStrategy: string
  testStrategy: string
  enabled: boolean
}

/** Language definitions — First-class support for P7. */
export const LanguageDefinitions: Record<LanguageId, LanguageDefinition> = {
  python: {
    languageId: 'python',
    displayName: 'Python',
    version: '3.12',
    runtime: 'python3',
    packageManager: 'pip',
    buildSystem: 'pip install -r requirements.txt',
    testSystem: 'pytest',
    formatter: 'black',
    linter: 'flake8',
    supportedFrameworks: ['fastapi', 'django'],
    enabled: true,
    capabilityMetadata: {
      supportsConcurrency: true,
      supportsAsyncIO: true,
    },
  },
  java: {
    languageId: 'java',
    displayName: 'Java',
    version: '21',
    runtime: 'java',
    packageManager: 'Maven/Gradle',
    buildSystem: 'Maven or Gradle',
    testSystem: 'JUnit',
    formatter: 'Google Java Format',
    linter: 'SpotBugs',
    supportedFrameworks: ['spring_boot'],
    enabled: true,
    capabilityMetadata: {
      supportsMultithreading: true,
      supportsJDBC: true,
    },
  },
  typescript: {
    languageId: 'typescript',
    displayName: 'TypeScript',
    version: '5.4',
    runtime: 'node',
    packageManager: 'npm/pnpm',
    buildSystem: 'ts-node or tsc',
    testSystem: 'jest',
    formatter: 'prettier',
    linter: 'eslint',
    supportedFrameworks: ['react', 'nextjs', 'node_api'],
    enabled: true,
    capabilityMetadata: {
      supportsAsyncAwait: true,
      supportsESModules: true,
    },
  },
  javascript: {
    languageId: 'javascript',
    displayName: 'JavaScript',
    version: 'latest',
    runtime: 'node',
    packageManager: 'npm/pnpm',
    buildSystem: 'node',
    testSystem: 'jest',
    formatter: 'prettier',
    linter: 'eslint',
    supportedFrameworks: ['react', 'nextjs', 'node_api'],
    enabled: true,
    capabilityMetadata: {
      supportsAsyncAwait: true,
      supportsESModules: true,
    },
  },
}

/** Framework definitions — Initial framework support. */
export const FrameworkDefinitions: Record<FrameworkId, FrameworkDefinition> = {
  fastapi: {
    frameworkId: 'fastapi',
    language: 'python',
    displayName: 'FastAPI',
    version: '0.104.0',
    supportedProjectTypes: [ProjectType.BACKEND, ProjectType.WEB],
    initStrategy: 'pip install fastapi uvicorn',
    buildStrategy: 'uvicorn main:app --host 0.0.0.0 --port 8000',
    testStrategy: 'pytest',
    enabled: true,
  },
  django: {
    frameworkId: 'django',
    language: 'python',
    displayName: 'Django',
    version: '5.1',
    supportedProjectTypes: [ProjectType.WEB, ProjectType.SOFTWARE],
    initStrategy: 'pip install django',
    buildStrategy: 'python manage.py runserver',
    testStrategy: 'pytest',
    enabled: true,
  },
  spring_boot: {
    frameworkId: 'spring_boot',
    language: 'java',
    displayName: 'Spring Boot',
    version: '3.2',
    supportedProjectTypes: [ProjectType.BACKEND, ProjectType.WEB],
    initStrategy: 'mvn archetype:generate -Dspring-boot-starter-web',
    buildStrategy: 'mvn spring-boot:run',
    testStrategy: 'JUnit',
    enabled: true,
  },
  react: {
    frameworkId: 'react',
    language: 'typescript',
    displayName: 'React',
    version: '18.3',
    supportedProjectTypes: [ProjectType.WEB, ProjectType.SOFTWARE],
    initStrategy: 'npx create-react-app my-app',
    buildStrategy: 'npm run build',
    testStrategy: 'jest',
    enabled: true,
  },
  nextjs: {
    frameworkId: 'nextjs',
    language: 'typescript',
    displayName: 'Next.js',
    version: '14.2',
    supportedProjectTypes: [ProjectType.WEB, ProjectType.SOFTWARE],
    initStrategy: 'npx create-next-app my-app',
    buildStrategy: 'npm run build',
    testStrategy: 'jest',
    enabled: true,
  },
  node_api: {
    frameworkId: 'node_api',
    language: 'javascript',
    displayName: 'Node.js API',
    version: 'latest',
    supportedProjectTypes: [ProjectType.BACKEND],
    initStrategy: 'npm init -y && npm express',
    buildStrategy: 'node src/index.js',
    testStrategy: 'jest',
    enabled: true,
  },
}

/** Target platform definitions. */
export const TargetPlatformDefinitions: Record<TargetPlatform, string> = {
  web: 'Web application or static website',
  desktop: 'Desktop application',
  mobile: 'Mobile application',
  server: 'Server-side application',
  cloud: 'Cloud-deployed application',
}

/** Supported project types mapping. */
export const SupportedProjectTypes: SupportedProjectType[] = [
  SupportedProjectType.WEB,
  SupportedProjectType.BACKEND,
  SupportedProjectType.SOFTWARE,
  SupportedProjectType.MOBILE FOUNDATION,
  SupportedProjectType.DESKTOP FOUNDATION,
]

/** Validates that a project type is supported. */
export function isSupportedProjectType(type: string): type is SupportedProjectType {
  return SupportedProjectTypes.includes(type as SupportedProjectType)
}

/** Gets the language definition for a language ID. */
export function getLanguageDefinition(languageId: LanguageId): LanguageDefinition {
  const def = LanguageDefinitions[languageId]
  if (!def) {
    throw new Error(`Unsupported language: ${languageId}`)
  }
  return def
}

/** Gets the framework definition for a framework ID. */
export function getFrameworkDefinition(frameworkId: FrameworkId): FrameworkDefinition {
  const def = FrameworkDefinitions[frameworkId]
  if (!def) {
    throw new Error(`Unsupported framework: ${frameworkId}`)
  }
  return def
}

/** Gets all enabled language definitions. */
export function getEnabledLanguages(): LanguageDefinition[] {
  return Object.values(LanguageDefinitions).filter((l) => l.enabled)
}

/** Gets all enabled framework definitions. */
export function getEnabledFrameworks(): FrameworkDefinition[] {
  return Object.values(FrameworkDefinitions).filter((f) => f.enabled)
}