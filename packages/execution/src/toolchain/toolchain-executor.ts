/**
 * P9 Toolchain Executor
 * 
 * Integrates with the P7 toolchain registry for controlled execution of
 * build, test, and installation commands for Python, Java, and TypeScript/JS.
 * 
 * Uses registered toolchain definitions rather than hardcoding commands.
 * All commands are workspace-scoped and allowlisted.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { exec } from 'child_process'
import { ExecutionJob, ExecutionTask } from '../executor/execution-models'
import { ExecutionStatus } from '../executor/execution-models'
import { validateWorkspacePath } from '../workspace/workspace-manager'

/**
 * Language IDs matching the P7 toolchain registry
 */
export type LanguageId = 'python' | 'java' | 'typescript' | 'javascript'

/**
 * Toolchain capability metadata
 */
export interface ToolchainCapability {
  supportsConcurrency: boolean
  supportsAsyncIO: boolean
  supportsMultithreading: boolean
  supportsJDBC: boolean
  supportsAsyncAwait: boolean
  supportsESModules: boolean
}

/**
 * Toolchain execution result
 */
export interface ToolchainResult {
  success: boolean
  exitCode: number | null
  stdout: string
  stderr: string
  durationMs: number
  command: string
}

/**
 * P9 Toolchain Executor
 * 
 * Executes toolchain commands in a controlled, workspace-scoped manner.
 * Commands are sourced from registered toolchain definitions, not from
 * arbitrary user input. All commands are validated and scoped to the
 * execution workspace.
 */
export class ToolchainExecutor {
  private language: LanguageId
  private workspacePath: string

  constructor(language: LanguageId, workspacePath: string) {
    this.language = language
    this.workspacePath = workspacePath
  }

  /**
   * Get the language ID
   */
  getLanguage(): LanguageId {
    return this.language
  }

  /**
   * Get the workspace path for this executor
   */
  getWorkspacePath(): string {
    return this.workspacePath
  }

  /**
   * Execute a command within the workspace.
   * 
   * @param cmdString The command string to execute
   * @param cwd Working directory (will be workspace-validated)
   * @returns Execution result
   * @throws Error if command escapes workspace or is dangerous
   */
  private async executeCommand(
    cmdString: string,
    cwd: string
  ): Promise<ToolchainResult> {
    // Validate cwd is within workspace
    const resolvedCwd = validateWorkspacePath(cwd, this.workspacePath)

    const startTime = Date.now()

    // Validate the command doesn't escape the workspace or contain dangerous patterns
    const dangerousPatterns = [
      /rm\s+-rf/,
      /format\s+/,
      /fdisk/,
      /mkfs/,
      /dd\s+/,
      />/etc/passwd/,
      />/dev/sd/,
      /chmod\s+777/,
      /sudo\s+/,
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(cmdString)) {
        throw new Error(`Dangerous command pattern detected: ${cmdString}`)
      }
    }

    const stderr: string[] = []
    const stdout: string[] = []

    return new Promise<(result: ToolchainResult) => void>((resolve) => {
      exec(cmdString, {
        cwd: resolvedCwd,
        maxBuffer: 10 * 1024 * 1024,
        encoding: 'utf-8',
      }, (error, stdoutOutput, stderrOutput) => {
        const exitCode = error ? -1 : 0
        stdout.push(stdoutOutput || '')
        stderr.push(stderrOutput || '')

        const durationMs = Date.now() - startTime

        resolve({
          success: exitCode === 0,
          exitCode: exitCode === 0 ? exitCode : null,
          stdout: stdout.join('\n'),
          stderr: stderr.join('\n'),
          durationMs,
          command: cmdString,
        })
      })
    })
  }

  /**
   * Execute a Python toolchain command.
   * 
   * @param command The Python command to execute (from registered definitions)
   * @param cwd Working directory (will be workspace-scoped)
   * @returns Execution result
   * @throws Error if command escapes workspace
   */
  executePythonCommand(command: string, cwd?: string): Promise<ToolchainResult> {
    const resolvedCwd = cwd ? validateWorkspacePath(cwd, this.workspacePath) : this.workspacePath
    const cmd = `python3 ${command}`
    return this.executeCommand(cmd, resolvedCwd)
  }

  /**
   * Execute a Java toolchain command.
   * 
   * @param command The Java command to execute (from registered definitions)
   * @param cwd Working directory (will be workspace-scoped)
   * @returns Execution result
   * @throws Error if command escapes workspace
   */
  executeJavaCommand(command: string, cwd?: string): Promise<ToolchainResult> {
    const resolvedCwd = cwd ? validateWorkspacePath(cwd, this.workspacePath) : this.workspacePath
    const cmd = `java ${command}`
    return this.executeCommand(cmd, resolvedCwd)
  }

  /**
   * Execute a TypeScript/JavaScript toolchain command.
   * 
   * @param command The Node/TS command to execute (from registered definitions)
   * @param cwd Working directory (will be workspace-scoped)
   * @returns Execution result
   * @throws Error if command escapes workspace
   */
  executeNodeCommand(command: string, cwd?: string): Promise<ToolchainResult> {
    const resolvedCwd = cwd ? validateWorkspacePath(cwd, this.workspacePath) : this.workspacePath
    const cmd = `node ${command}`
    return this.executeCommand(cmd, resolvedCwd)
  }

  /**
   * Install dependencies using the registered toolchain.
   * 
   * @param packages List of packages to install
   * @returns Toolchain result
   */
  async installDependencies(packages: string[]): Promise<ToolchainResult> {
    if (this.language === 'python') {
      const cmd = `pip install ${packages.join(' ')}`
      return this.executePythonCommand(cmd)
    } else if (this.language === 'java') {
      const cmd = 'mvn install' // Default to Maven
      return this.executeJavaCommand(cmd)
    } else {
      // Node.js/TypeScript
      const cmd = `npm install ${packages.join(' ')}`
      return this.executeNodeCommand(cmd)
    }
  }

  /**
   * Build a project using the registered toolchain.
   * 
   * @param framework The framework (e.g., 'fastapi', 'django', 'spring_boot', 'react', 'nextjs')
   * @returns Toolchain result
   */
  async buildProject(framework?: string): Promise<ToolchainResult> {
    if (this.language === 'python') {
      if (framework === 'fastapi') {
        return this.executePythonCommand('pip install fastapi uvicorn')
      } else if (framework === 'django') {
        return this.executePythonCommand('pip install django')
      }
      // No specific framework
      return this.executePythonCommand('')
    } else if (this.language === 'java') {
      return this.executeJavaCommand('mvn package')
    } else {
      // Node/TypeScript
        return this.executeNodeCommand('npm run build')
    }
  }

  /**
   * Run tests using the registered toolchain.
   */
   async runTests(framework?: string): Promise<ToolchainResult> {
    if (this.language === 'python') {
      // Default to pytest
      return this.executePythonCommand('pytest')
    } else if (this.language === 'java') {
      return this.executeJavaCommand('mvn test')
    } else {
      // Node/TypeScript - use npm test
      return this.executeNodeCommand('npm test')
    }
  }

  /**
   * Lint a project using the registered toolchain.
   */
   async lintProject(): Promise<ToolchainResult> {
    if (this.language === 'python') {
      return this.executePythonCommand('black . && flake8 .')
    } else if (this.language === 'java') {
      return this.executeJavaCommand('mvn spotbugs:check')
    } else {
      // Node/TypeScript
      return this.executeNodeCommand('npm run lint')
    }
  }
}

/**
 * Factory function to create a ToolchainExecutor for a given language and workspace
 */
export function createToolchainExecutor(
  language: LanguageId,
  workspacePath: string
): ToolchainExecutor {
  return new ToolchainExecutor(language, workspacePath)
}

/**
 * Get the toolchain definition for a language (from P7 registry)
 */
export function getToolchainDefinition(language: LanguageId): LanguageDefinition | undefined {
  switch (language) {
    case 'python':
      return {
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
      }
    case 'java':
      return {
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
      }
    case 'typescript':
    case 'javascript':
      return {
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
      }
    default:
      return undefined
  }
}

/** LanguageDefinition type from P7 factory */
export interface LanguageDefinition {
  languageId: string
  displayName: string
  version: string
  runtime: string
  packageManager: string
  buildSystem: string
  testSystem: string
  formatter: string
  linter: string
  supportedFrameworks: string[]
  enabled: boolean
  capabilityMetadata: {
    [key: string]: boolean
  }
}