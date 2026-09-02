/** Context Management — Provides controlled generation context for each
 * generation task.
 *
 * Provides only relevant context to each generation task.
 * Does not blindly send the entire repository to the model.
 *
 * Possible context:
 * - project specification
 * - architecture
 * - task definition
 * - related interfaces
 * - data models
 * - coding conventions
 * - framework conventions
 */

import { AIProjectRequirement } from './requirement-model'
import { ArchitectureOutput } from './architecture-generator'
import { TechnologyStack } from './technology-selector'
import { GenerationTask } from './requirement-model'

/** ContextSlice — A focused subset of context for a specific generation task. */
export interface ContextSlice {
  /** Project requirement providing overall goals. */
  requirement?: AIProjectRequirement
  /** Architecture output describing structure. */
  architecture?: ArchitectureOutput
  /** Technology stack in use. */
  technologyStack?: TechnologyStack
  /** The specific task being executed. */
  task?: GenerationTask
  /** Related interfaces or type definitions. */
  interfaces?: string
  /** Data models relevant to the task. */
  dataModels?: string
  /** Framework conventions and patterns. */
  frameworkConventions?: string
  /** Coding conventions and style guidelines. */
  codingConventions?: string
  /** Existing files to avoid duplication. */
  existingFiles?: string[]
}

/** Selects and packages context relevant to a specific generation task.
 *
 * Ensures the LLM receives only what it needs for the current task,
 * improving efficiency and reducing hallucinations.
 */
export class ContextSelector {
  /** Select context for a generation task. */
  selectContext(
    requirement: AIProjectRequirement,
    architecture: ArchitectureOutput,
    task: GenerationTask,
    technologyStack: TechnologyStack,
    existingFiles: string[] = []
  ): ContextSlice {
    // Build a focused context slice based on task type
    const slice: ContextSlice = {
      requirement,
      architecture,
      technologyStack,
      task,
      interfaces: this.getRelevantInterfaces(task),
      dataModels: this.getRelevantDataModels(task),
      frameworkConventions: this.getFrameworkConventions(technologyStack),
      codingConventions: this.getCodingConventions(technologyStack),
      existingFiles,
    }

    return slice
  }

  /** Gets relevant interfaces for the task. */
  private getRelevantInterfaces(task: GenerationTask): string {
    const taskType = task.taskType
    switch (taskType) {
      case 'models':
        return 'User, Project, Profile interfaces'
      case 'api':
        return 'API route handlers, request/response types'
      case 'authentication':
        return 'Auth options, session strategies, middleware'
      case 'services':
        return 'Business service interfaces'
      case 'testing':
        return 'Test interfaces, mock types'
      default:
        return 'General type definitions'
    }
  }

  /** Gets relevant data models for the task. */
  private getRelevantDataModels(task: GenerationTask): string {
    const taskType = task.taskType
    switch (taskType) {
      case 'models':
        return 'User, Project, Profile - core data models'
      case 'api':
        return 'Project, User - API request/response types'
      case 'services':
        return 'UserService, ProjectService - business services'
      case 'authentication':
        return 'Auth configuration, session management'
      default:
        return 'Core project data models'
    }
  }

  /** Gets framework conventions for the technology stack. */
  private getFrameworkConventions(
    techStack: TechnologyStack
  ): string {
    const lang = techStack.language
    const fw = techStack.framework

    if (lang === 'python' && fw === 'fastapi') {
      return 'FastAPI conventions: path operations, dependency injection, Pydantic models'
    } else if (lang === 'typescript' && fw === 'nextjs') {
      return 'Next.js conventions: pages/router, getServerSideProps, useEffect, API routes'
    } else if (lang === 'java' && fw === 'spring_boot') {
      return 'Spring Boot conventions: @RestController, @Service, @Repository, application.yml'
    }

    return 'General best practices'
  }

  /** Gets coding conventions for the technology stack. */
  private getCodingConventions(techStack: TechnologyStack): string {
    const lang = techStack.language

    if (lang === 'python') {
      return 'PEP 8 style, 4-space indentation, type hints where beneficial'
    } else if (lang === 'typescript') {
      return 'TypeScript strict mode, camelCase, interfaces for objects'
    } else if (lang === 'java') {
      return 'JavaCode conventions, camelCase, Javadoc comments'
    }

    return 'General best practices'
  }
}

/** Creates a new ContextSelector instance. */
export function createContextSelector(): ContextSelector {
  return new ContextSelector()
}

/** Builds a context string from a ContextSlice suitable for sending to an LLM.
 *
 * Formats the context in a concise, machine-readable way.
 */
export function buildContextString(slice: ContextSlice): string {
  const parts: string[] = []

  if (slice.requirement) {
    parts.push(`--- Project Requirement ---`)
    parts.push(`Name: ${slice.requirement.projectName}`)
    parts.push(`Description: ${slice.requirement.projectDescription}`)
    parts.push(`Type: ${slice.requirement.projectType}`)
    parts.push(`Language: ${slice.requirement.preferredLanguage || 'Not specified'}`)
    parts.push(`Framework: ${slice.requirement.preferredFramework || 'Not specified'}`)
    parts.push('')
  }

  if (slice.architecture) {
    parts.push(`--- Architecture ---`)
    parts.push(slice.architecture.layers || 'No architecture description')
    parts.push('')
  }

  if (slice.technologyStack) {
    parts.push(`--- Technology Stack ---`)
    parts.push(`Language: ${techStack.technologyStack.language}`)
    parts.push(`Framework: ${techStack.technologyStack.framework}`)
    parts.push('')
  }

  if (slice.task) {
    parts.push(`--- Task ---`)
    parts.push(`ID: ${slice.task.taskId}`)
    parts.push(`Type: ${slice.task.taskType}`)
    parts.push(`Description: ${slice.task.description}`)
    parts.push(`Language: ${slice.task.language || 'Not specified'}`)
    parts.push(`Framework: ${slice.task.framework || 'Not specified'}`)
    parts.push(`Target Files: ${slice.task.targetFiles?.join(', ') || 'None'}`)
    parts.push('')
  }

  if (slice.interfaces) {
    parts.push(`--- Relevant Interfaces ---`)
    parts.push(slice.interfaces)
    parts.push('')
  }

  if (slice.dataModels) {
    parts.push(`--- Data Models ---`)
    parts.push(slice.dataModels)
    parts.push('')
  }

  if (slice.frameworkConventions) {
    parts.push(`--- Framework Conventions ---`)
    parts.push(slice.frameworkConventions)
    parts.push('')
  }

  if (slice.codingConventions) {
    parts.push(`--- Coding Conventions ---`)
    parts.push(slice.codingConventions)
    parts.push('')
  }

  if (slice.existingFiles && slice.existingFiles.length > 0) {
    parts.push(`--- Existing Files (avoid duplication) ---`)
    parts.push(slice.existingFiles.join(', '))
    parts.push('')
  }

  return parts.join('\n')
}