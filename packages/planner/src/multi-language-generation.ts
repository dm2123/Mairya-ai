/** Multi-language Generation — Language-independent code generation architecture.
 *
 * Implements adapters/interfaces for supported languages using P7 registries
 * instead of hardcoding technology logic throughout the system.
 *
 * Supported languages:
 * - Python (FastAPI)
 * - Java (Spring Boot)
 * - TypeScript/JavaScript (React, Next.js, Node.js)
 */

import { TechnologyStack } from './technology-selector'
import { ArchitectureOutput } from './architecture-generator'
import { CodeGenerationEngine, FileChange } from './code-generation-engine'
import { ContextSelector, buildContextString } from './context-management'
import { AIGatewayIntegration, GatewayRequest, GatewayResponse } from './ai-gateway-integration'
import { ContextSlice } from './context-management'

/** Language Generation Adapter — Interface for language-specific code generation. */
export interface LanguageGenerationAdapter {
  /** Generate files for a task. */
  generate(
    task: any, // GenerationTask
    architecture: ArchitectureOutput,
    context: ContextSlice,
    engine: CodeGenerationEngine
  ): Promise<FileChange[]>

  /** Get the language ID. */
  getLanguage(): string

  /** Get the framework ID. */
  getFramework(): string | null
}

/** Python FastAPI Adapter */
export class PythonFastAPIAdapter {
  private readonly engine: CodeGenerationEngine
  private readonly gateway: AIGatewayIntegration
  private readonly contextSelector: ContextSelector

  constructor(
    engine: CodeGenerationEngine,
    gateway: AIGatewayIntegration,
    contextSelector: ContextSelector
  ) {
    this.engine = engine
    this.gateway = gateway
    this.contextSelector = contextSelector
  }

  /** Get the language. */
  getLanguage(): string {
    return 'python'
  }

  /** Get the framework. */
  getFramework(): string {
    return 'fastapi'
  }

  /** Generate files for a task using Python FastAPI adapter. */
  async generate(
    task: any, // GenerationTask
    architecture: ArchitectureOutput,
    context: ContextSlice,
    engine: CodeGenerationEngine
  ): Promise<FileChange[]> {
    // Build context for the LLM
    const contextString = buildContextString({
      requirement: context.requirement,
      architecture,
      technologyStack: { language: 'python', framework: 'fastapi' },
      task,
      frameworkConventions: 'FastAPI conventions: path operations, dependency injection, Pydantic models',
      codingConventions: 'PEP 8 style, 4-space indentation',
      existingFiles: context.existingFiles,
    })

    // Use the code generation engine
    return this.engine.generateForTask(task, architecture, {
      ...context,
      contextString,
    })
  }
}

/** Java Spring Boot Adapter */
export class JavaSpringBootAdapter {
  private readonly engine: CodeGenerationEngine
  private readonly gateway: AIGatewayIntegration
  private readonly contextSelector: ContextSelector

  constructor(
    engine: CodeGenerationEngine,
    gateway: AIGatewayIntegration,
    contextSelector: ContextSelector
  ) {
    this.engine = engine
    this.gateway = gateway
    this.contextSelector = contextSelector
  }

  /** Get the language. */
  getLanguage(): string {
    return 'java'
  }

  /** Get the framework. */
  getFramework(): string {
    return 'spring_boot'
  }

  /** Generate files for a task using Java Spring Boot adapter. */
  async generate(
    task: any, // GenerationTask
    architecture: ArchitectureOutput,
    context: ContextSlice,
    engine: CodeGenerationEngine
  ): Promise<FileChange[]> {
    // Build context for the LLM
    const contextString = buildContextString({
      requirement: context.requirement,
      architecture,
      technologyStack: { language: 'java', framework: 'spring_boot' },
      task,
      frameworkConventions:
        'Spring Boot conventions: @RestController, @Service, @Repository, application.yml',
      codingConventions:
        'Java conventions: camelCase, Javadoc comments, strict typing',
      existingFiles: context.existingFiles,
    })

    // Use the code generation engine
    return this.engine.generateForTask(task, architecture, {
      ...context,
      contextString,
    })
  }
}

/** TypeScript/Node.js Adapter */
export class TypeScriptNodeAdapter {
  private readonly engine: CodeGenerationEngine
  private readonly gateway: AIGatewayIntegration
  private readonly contextSelector: ContextSelector

  constructor(
    engine: CodeGenerationEngine,
    gateway: AIGatewayIntegration,
    contextSelector: ContextSelector
  ) {
    this.engine = engine
    this.gateway = gateway
    this.contextSelector = contextSelector
  }

  /** Get the language. */
  getLanguage(): string {
    return 'typescript'
  }

  /** Get the framework. */
  getFramework(): string | null {
    return 'nextjs' // Could be 'react' or null for plain Node.js
  }

  /** Generate files for a task using TypeScript/Node.js adapter. */
  async generate(
    task: any, // GenerationTask
    architecture: ArchitectureOutput,
    context: ContextSlice,
    engine: CodeGenerationEngine
  ): Promise<FileChange[]> {
    // Build context for the LLM
    const contextString = buildContextString({
      requirement: context.requirement,
      architecture,
      technologyStack: { language: 'typescript', framework: 'nextjs' },
      task,
      frameworkConventions:
        'Next.js conventions: pages/router, getServerSideProps, useEffect, API routes',
      codingConventions:
        'TypeScript strict mode, camelCase, interfaces for objects',
      existingFiles: context.existingFiles,
    })

    // Use the code generation engine
    return this.engine.generateForTask(task, architecture, {
      ...context,
      contextString,
    })
  }
}

/** Adapter Factory — Creates the appropriate language adapter based on technology stack. */
export function createAdapter(
  technologyStack: TechnologyStack,
  engine: CodeGenerationEngine,
  gateway: AIGatewayIntegration,
  contextSelector: ContextSelector
): LanguageGenerationAdapter {
  const language = technologyStack.language

  switch (language) {
    case 'python':
      return new PythonFastAPIAdapter(engine, gateway, contextSelector)
    case 'java':
      return new JavaSpringBootAdapter(engine, gateway, contextSelector)
    case 'typescript':
    case 'javascript':
      return new TypeScriptNodeAdapter(engine, gateway, contextSelector)
    default:
      // Fallback - return TypeScript/Node adapter
      return new TypeScriptNodeAdapter(engine, gateway, contextSelector)
  }
}

/** Supported language identifiers. */
export type LanguageIdentifier = 'python' | 'java' | 'typescript' | 'javascript'

/** Supported framework identifiers. */
export type FrameworkIdentifier = 'fastapi' | 'spring_boot' | 'nextjs' | 'react' | null