import { AIProvider, AIModel, AIModelCapabilities, AIRetryPolicy, AIRequestId, AIError } from '../shared/src/ai-types'
import { AIProviderSystemConfig } from '../shared/src/ai-provider-config'
import { BaseEntity, PaginationParams, PaginationResult } from '../shared/src/base-entity'

/**
 * Project Specification — Normalized description of a software project to be generated.
 *
 * This specification is validated before execution and serves as the single source
 * of truth for the factory generation job. It is organization-scoped and
 * never trusts arbitrary client-supplied execution commands.
 */
export interface ProjectSpecification {
  // Core identification
  projectId: string
  organizationId: string
  requestedBy: string // userId who requested the project

  // Project type and language
  projectType: ProjectType
  language: LanguageId
  framework: FrameworkId | null
  targetPlatform: TargetPlatform

  // Technology configuration
  database?: DatabaseConfig
  authRequirement?: AuthRequirement
  apiRequirement?: APIRequirement
  frontendRequirement?: FrontendRequirement
  testingRequirement?: TestingRequirement

  // Constraints and metadata
  projectConstraints: ProjectConstraints
  metadata: Record<string, unknown>

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

/** Project types supported by the factory. */
export enum ProjectType {
  WEB = 'web',
  BACKEND = 'backend',
  SOFTWARE = 'software',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
}

/** Target platforms for the generated project. */
export enum TargetPlatform {
  WEB = 'web',
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  SERVER = 'server',
  CLOUD = 'cloud',
}

/** Supported languages in the factory. */
export type LanguageId = 'python' | 'java' | 'typescript' | 'javascript'

/** Supported frameworks per language. */
export type FrameworkId =
  | 'fastapi'
  | 'django'
  | 'spring_boot'
  | 'react'
  | 'nextjs'
  | 'node_api'
  | null

/** Database configuration for the generated project. */
export interface DatabaseConfig {
  type: 'sqlite' | 'postgres' | 'mysql'
  name: string
}

/** Authentication requirement. */
export enum AuthRequirement {
  NONE = 'none',
  SESSION = 'session',
  JWT = 'jwt',
  OAUTH2 = 'oauth2',
}

/** API requirement. */
export enum APIRequirement {
  NONE = 'none',
  REST = 'rest',
  GRAPHQL = 'graphql',
}

/** Frontend requirement. */
export enum FrontendRequirement {
  NONE = 'none',
  REACT = 'react',
  NEXT_JS = 'next_js',
  VANILLA = 'vanilla',
}

/** Testing requirement. */
export enum TestingRequirement {
  NONE = 'none',
  PYTEST = 'pytest',
  JUNIT = 'junit',
  NONE_specified = 'none-specified',
}

/** Constraints on the project generation. */
export interface ProjectConstraints {
  maxOutputTokens?: number
  temperature?: number
  disallowedFrameworks: FrameworkId[]
  disallowedDependencies: string[]
}

/** Validates that the project specification is well-formed. */
export function isValidProjectSpec(spec: ProjectSpecification): boolean {
  if (!spec.organizationId) return false
  if (!spec.projectId) return false
  if (!Object.values(ProjectType).includes(spec.projectType)) return false
  if (!Object.values(LanguageId).includes(spec.language)) return false
  if (!Object.values(TargetPlatform).includes(spec.targetPlatform)) return false
  if (spec.framework && !isValidFramework(spec.framework, spec.language)) return false
  return true
}

function isValidFramework(framework: FrameworkId, language: LanguageId): boolean {
  const valid: Record<LanguageId, FrameworkId[]> = {
    python: ['fastapi', 'django'],
    java: ['spring_boot'],
    typescript: ['react', 'nextjs', 'node_api'],
    javascript: ['react', 'nextjs', 'node_api'],
  }
  return valid[language].includes(framework)
}