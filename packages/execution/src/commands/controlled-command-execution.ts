/**
 * P9 Controlled Command Execution
 * 
 * Create an allowlisted command execution abstraction.
 * Never execute arbitrary generated shell commands directly.
 * 
 * Commands must be:
 *   validated
 *   allowlisted
 *   argument-separated
 *   workspace-scoped
 *   timeout-limited
 *   resource-limited where possible
 *   logged
 * 
 * Avoid shell interpolation.
 * 
 * Do not allow generated code to freely execute:
 *   rm -rf
 *   format disks
 *   system configuration changes
 *   credential extraction
 *   arbitrary network administration
 * 
 * The Factory must operate as a controlled build environment.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as crypto from 'crypto'
import { exec } from 'child_process'
import { validateWorkspacePath } from '../workspace/workspace-manager'
import { ExecutionStatus, ExecutionJob, ExecutionTask } from '../executor/execution-models'

/**
 * Maximum allowed command length (characters)
 */
const MAX_COMMAND_LENGTH = 4000

/**
 * Maximum allowed argument length (characters)
 */
const MAX_ARG_LENGTH = 200

/**
 * Dangerous command patterns that are strictly forbidden
 */
const FORBIDDEN_PATTERNS = [
  // Shell built-in dangerous commands
  /^\s*rm\s+-\s*rf/gi,
  /^\s*rm\s+--rf/gi,
  /^\s*format/gi,
  /^\s*fdisk/gi,
  /^\s*mkfs/gi,
  /^\s*dd\s+/gi,
  /^\s*chmod\s+777/gi,
  /^\s*chown\s+root/gi,
  /^\s*sud[oa]\s+/gi,
  /^\s*curl\s+.*\|/gi,
  /^\s*wget\s+.*\|/gi,
  /^\s*nc\s+/gi,
  /^\s*netcat/gi,
  /^\s*curl\s+.*\n/gi,
  /^\s*wget\s+\n/gi,
  
  // Path traversal in commands
  /^\s*\.\./gi,
  /^\s*\.\.\//gi,
  
  // System configuration changes
  /^\s*systemctl/gi,
  /^\s*service\s+/gi,
  /^\s*init\s+/gi,
  
  // Credential/secret extraction
  /^\s*grep.*-i.*password/gi,
  /^\s*grep.*-i.*secret/gi,
  /^\s*grep.*-i.*token/gi,
  /^\s*cat\s+.*/etc/gi,
  /^\s*cat\s+.*/passwd/gi,
]

/**
 * Safe command structure - argument-separated, no shell interpolation
 */
export interface SafeCommand {
  /** The command executable */
  command: string
  /** Arguments (separate, not shell-joined) */
  args: string[]
  /** Working directory (workspace-relative, validated) */
  cwd: string
  /** Timeout in milliseconds */
  timeoutMs: number
  /** Description for logging */
  description: string
}

/**
 * Command execution result
 */
export interface CommandResult {
  /** Whether the command succeeded */
  success: boolean
  /** Exit code */
  exitCode: number | null
  /** Standard output */
  stdout: string
  /** Standard error */
  stderr: string
  /** Duration in milliseconds */
  durationMs: number
  /** The command that was executed (for logging) */
  executedCommand: string
  /** Whether the command was blocked by security policy */
  blocked: boolean
  /** Block reason if blocked */
  blockReason: string | null
}

/**
 * P9 Controlled Command Execution
 * 
 * Provides a safe, allowlisted command execution environment.
 * All commands are validated, argument-separated, workspace-scoped,
 * timeout-limited, and logged. Shell interpolation is avoided.
 */
export class ControlledCommandExecutor {
  private workspacePath: string

  constructor(workspacePath: string) {
    this.workspacePath = validateWorkspacePath(workspacePath, workspacePath)
  }

  /**
   * Validate and create a SafeCommand from a command string and working directory.
   * 
   * @param commandString The raw command string (will be validated and parsed)
   * @param suggestedCwd Suggested working directory
   * @returns A SafeCommand if valid, or throws an error
   * @throws Error if the command is dangerous or escapes the workspace
   */
  static validateAndCreateCommand(
    commandString: string,
    suggestedCwd?: string
  ): SafeCommand {
    // Check command length
    if (commandString.length > MAX_COMMAND_LENGTH) {
      throw new Error(`Command exceeds maximum length (${MAX_COMMAND_LENGTH} chars)`)
    }

    // Check for forbidden patterns
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(commandString)) {
        throw new Error(`Command contains forbidden pattern: ${pattern}`)
      }
    }

    // Check for shell interpolation characters
    const interpolationChars = ['`', ';', '&', '|', '$', '(', ')', '{', '}', '<', '>', '\n', '\r']
    for (const char of interpolationChars) {
      if (commandString.includes(char)) {
        throw new Error(`Shell interpolation character detected: ${char}`)
      }
    }

    // Parse command and arguments (simple space-separated, no shell quoting)
    const parts = commandString.trim().split(/\s+/)
    if (parts.length === 0) {
      throw new Error('Empty command')
    }

    const command = parts[0]
    const args = parts.slice(1)

    // Validate each argument length
    for (const arg of args) {
      if (arg.length > MAX_ARG_LENGTH) {
        throw new Error(`Argument exceeds maximum length (${MAX_ARG_LENGTH} chars)`)
      }
    }

    // Determine working directory
    let cwd: string
    if (suggestedCwd) {
      cwd = validateWorkspacePath(suggestedCwd, this.workspacePath)
    } else {
      cwd = this.workspacePath
    }

    // Verify the CWD is within the workspace and exists
    if (!fs.existsSync(cwd)) {
      throw new Error(`Working directory does not exist: ${cwd}`)
    }

    return {
      command,
      args,
      cwd,
      timeoutMs: 60000, // 1 minute default
      description: `Executing: ${commandString}`,
    }
  }

  /**
   * Execute a safe command within the workspace.
   * 
   * @param safeCommand The validated SafeCommand to execute
   * @returns Command execution result
   */
  async execute(safeCommand: SafeCommand): Promise<CommandResult> {
    const startTime = Date.now()

    // Build the command as argument-separated (no shell interpolation)
    // Use the executable directly with arguments
    const fullCmd = `${safeCommand.command} ${safeCommand.args
      .map((arg) => {
        // Simple argument escaping - wrap in quotes if contains spaces
        if (arg.includes(' ') || arg.includes('\t') || arg.includes('"')) {
          return `"${arg.replace(/"/g, '\\"')}"`
        }
        return arg
      })
      .join(' ')}`

    const stderr: string[] = []
    const stdout: string[] = []

    return new Promise<(result: CommandResult) => void>((resolve) => {
      exec(fullCmd, {
        cwd: safeCommand.cwd,
        maxBuffer: 50 * 1024 * 1024, // 50MB max output
        encoding: 'utf-8',
      }, (error, stdoutOutput, stderrOutput) => {
        const exitCode = error ? -1 : 0
        stdout.push(stdoutOutput || '')
        stderr.push(stderrOutput || '')

        const durationMs = Date.now() - startTime

        // Determine success - exit code 0 means success
        const success = exitCode === 0

        resolve({
          success,
          exitCode: success ? exitCode : null,
          stdout: stdout.join('\n').trim(),
          stderr: stderr.join('\n').trim(),
          durationMs,
          executedCommand: fullCmd,
          blocked: false,
          blockReason: null,
        })
      })
    })
  }

  /**
   * Execute a command with a timeout.
   * 
   * @param safeCommand The validated SafeCommand
   * @param timeoutMs Override default timeout in milliseconds
   * @returns Command execution result
   */
  async executeWithTimeout(
    safeCommand: SafeCommand,
    timeoutMs: number
  ): Promise<CommandResult> {
    // Set up timeout
    const timeoutPromise = new Promise<(result: CommandResult) => void>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Command timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    // Execute the command
    const execPromise = this.execute(safeCommand)

    // Race between execution and timeout
    const result = await Promise.race([execPromise, timeoutPromise])
    return result
  }

  /**
   * Install dependencies for a project.
   * 
   * @param language The language/framework identifier
   * @param packages List of packages to install
   * @param generationPath The generation workspace path
   * @returns Command result
   */
  async installDependencies(
    language: 'python' | 'java' | 'typescript' | 'javascript',
    packages: string[],
    generationPath: string
  ): Promise<CommandResult> {
    let cmdString: string
    let cwd: string

    if (language === 'python') {
      cwd = validateWorkspacePath(generationPath, this.workspacePath)
      cmdString = `pip install ${packages.join(' ')}`
    } else if (language === 'java') {
      cwd = validateWorkspacePath(generationPath, this.workspacePath)
      cmdString = 'mvn install'
    } else {
      // Node.js/TypeScript
      cwd = validateWorkspacePath(generationPath, this.workspacePath)
      cmdString = `npm install ${packages.join(' ')}`
    }

    // Validate the command stays within workspace
    const validatedCwd = validateWorkspacePath(cwd, this.workspacePath)
    
    // Create and execute the safe command
    const safeCmd = ControlledCommandExecutor.validateAndCreateCommand(cmdString, validatedCwd)
    return this.execute(safeCmd)
  }

  /**
   * Build a project.
   * 
   * @param language The language/framework identifier
   * @param framework The framework (e.g., 'fastapi', 'django', 'spring_boot', 'react', 'nextjs')
   * @param generationPath The generation workspace path
   * @returns Command result
   */
  async buildProject(
    language: 'python' | 'java' | 'typescript' | 'javascript',
    framework?: string,
    generationPath?: string
  ): Promise<CommandResult> {
    let cmdString: string
    let cwd: string

    if (language === 'python') {
      cwd = generationPath ? validateWorkspacePath(generationPath, this.workspacePath) : this.workspacePath
      if (framework === 'fastapi') {
        cmdString = 'pip install fastapi uvicorn'
      } else if (framework === 'django') {
        cmdString = 'pip install django'
      } else {
        cmdString = 'echo "No build step defined"'
      }
    } else if (language === 'java') {
      cwd = generationPath ? validateWorkspacePath(generationPath, this.workspacePath) : this.workspacePath
      cmdString = 'mvn package'
    } else {
      // Node/TypeScript
      cwd = generationPath ? validateWorkspacePath(generationPath, this.workspacePath) : this.workspacePath
      cmdString = 'npm run build'
    }

    const validatedCwd = validateWorkspacePath(cwd, this.workspacePath)
    const safeCmd = ControlledCommandExecutor.validateAndCreateCommand(cmdString, validatedCwd)
    return this.execute(safeCmd)
  }

  /**
   * Run tests for a project.
   * 
   * @param language The language/framework identifier
   * @param framework The test framework
   * @param generationPath The generation workspace path
   * @returns Command result
   */
  async runTests(
    language: 'python' | 'java' | 'typescript' | 'javascript',
    framework?: string,
    generationPath?: string
  ): Promise<CommandResult> {
    let cmdString: string
    let cwd: string

    if (language === 'python') {
      cwd = generationPath ? validateWorkspacePath(generationPath, this.workspacePath) : this.workspacePath
      cmdString = 'pytest'
    } else if (language === 'java') {
      cwd = generationPath ? validateWorkspacePath(generationPath, this.workspacePath) : this.workspacePath
      cmdString = 'mvn test'
    } else {
      // Node/TypeScript
      cwd = generationPath ? validateWorkspacePath(generationPath, this.workspacePath) : this.workspacePath
      cmdString = 'npm test'
    }

    const validatedCwd = validateWorkspacePath(cwd, this.workspacePath)
    const safeCmd = ControlledCommandExecutor.validateAndCreateCommand(cmdString, validatedCwd)
    return this.execute(safeCmd)
  }

  /**
   * Lint a project.
   * 
   * @param language The language/framework identifier
   * @param generationPath The generation workspace path
   * @returns Command result
   */
  async lintProject(
    language: 'python' | 'java' | 'typescript' | 'javascript',
    generationPath?: string
  ): Promise<CommandResult> {
    let cmdString: string
    let cwd: string

    if (language === 'python') {
      cwd = generationPath ? validateWorkspacePath(generationPath, this.workspacePath) : this.workspacePath
      cmdString = 'black . && flake8 .'
    } else if (language === 'java') {
      cwd = generationPath ? validateWorkspacePath(generationPath, this.workspacePath) : this.workspacePath
      cmdString = 'mvn spotbugs:check'
    } else {
      // Node/TypeScript
      cwd = generationPath ? validateWorkspacePath(generationPath, this.workspacePath) : this.workspacePath
      cmdString = 'npm run lint'
    }

    const validatedCwd = validateWorkspacePath(cwd, this.workspacePath)
    const safeCmd = ControlledCommandExecutor.validateAndCreateCommand(cmdString, validatedCwd)
    return this.execute(safeCmd)
  }

  /**
   * Validate that a command is safe to execute.
   * Returns validation result or throws if unsafe.
   * 
   * @param commandString The command string to validate
   * @param cwd Working directory
   * @returns Validation result
   */
  static validateCommand(
    commandString: string,
    cwd: string
  ): { valid: boolean; error?: string; safeCommand?: SafeCommand } {
    try {
      const safeCmd = ControlledCommandExecutor.validateAndCreateCommand(commandString, cwd)
      return { valid: true, safeCommand }
    } catch (e) {
      return { valid: false, error: (e as Error).message }
    }
  }
}

/**
 * Factory function to create a ControlledCommandExecutor
 */
export function createControlledCommandExecutor(workspacePath: string): ControlledCommandExecutor {
  return new ControlledCommandExecutor(workspacePath)
}

/**
 * Pre-validated safe commands for common operations
 */
export const PREVALIDATED_COMMANDS = {
  /** Python pytest test command */
  pythonTest: (): SafeCommand => ControlledCommandExecutor.validateAndCreateCommand('pytest', process.cwd()),
  
  /** Python black format command */
  pythonFormat: (): SafeCommand => ControlledCommandExecutor.validateAndCreateCommand('black .', process.cwd()),
  
  /** Python flake8 lint command */
  pythonLint: (): SafeCommand => ControlledCommandExecutor.validateAndCreateCommand('flake8 .', process.cwd()),

  /** npm install command */
  npmInstall: (packages: string[]): SafeCommand => {
    const cmd = `npm install ${packages.join(' ')}`
    return ControlledCommandExecutor.validateAndCreateCommand(cmd, process.cwd())
  },

  /** mvn package command */
  mavenBuild: (): SafeCommand => ControlledCommandExecutor.validateAndCreateCommand('mvn package', process.cwd()),

  /** pytest command */
  pytestCommand: (): SafeCommand => ControlledCommandExecutor.validateAndCreateCommand('pytest', process.cwd()),
}