import { LanguageId, FrameworkId, ProjectType } from './project-types'

/** Framework Registry — Extensible registry of supported frameworks.
 *
 * Each framework defines its language, supported project types,
 * initialization/build/test strategies, and enabled state.
 */
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

/** Language-specific framework definitions. */
export const FrameworkDefinitions: Record<FrameworkId, {
  language: LanguageId
  displayName: string
  version: string
  supportedProjectTypes: ProjectType[]
  initStrategy: string
  buildStrategy: string
  testStrategy: string
  enabled: boolean
}> = {
  fastapi: {
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

/** Gets a framework definition by ID. */
export function getFrameworkDefinition(frameworkId: FrameworkId): {
  language: LanguageId
  displayName: string
  version: string
  supportedProjectTypes: ProjectType[]
  initStrategy: string
  buildStrategy: string
  testStrategy: string
  enabled: boolean
} | undefined {
  return FrameworkDefinitions[frameworkId]
}

/** Validates that a framework supports a given project type. */
export function isFrameworkSupportedForProjectType(
  frameworkId: FrameworkId,
  projectType: ProjectType
): boolean {
  const def = FrameworkDefinitions[frameworkId]
  if (!def) return false
  return def.supportedProjectTypes.includes(projectType)
}

/** Gets all enabled frameworks. */
export function getEnabledFrameworks(): Array<{
  frameworkId: FrameworkId
  language: LanguageId
  displayName: string
  version: string
  supportedProjectTypes: ProjectType[]
  initStrategy: string
  buildStrategy: string
  testStrategy: string
  enabled: boolean
}> {
  return Object.values(FrameworkDefinitions).filter((f) => f.enabled)
}

/** Gets all frameworks for a specific language. */
export function getFrameworksForLanguage(language: LanguageId): Array<{
  frameworkId: FrameworkId
  language: LanguageId
  displayName: string
  version: string
  supportedProjectTypes: ProjectType[]
  initStrategy: string
  buildStrategy: string
  testStrategy: string
  enabled: boolean
}> {
  return Object.values(FrameworkDefinitions).filter(
    (f) => f.language === language
  )
}