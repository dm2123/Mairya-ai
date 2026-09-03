/**
 * P9 Test Engine
 * 
 * Support:
 *   Python → pytest
 *   Java → JUnit/Maven/Gradle tests
 *   TypeScript/JavaScript → configured project test command
 * 
 * Do not assume every generated project uses the same command.
 * Use project metadata/toolchain configuration.
 * 
 * Capture:
 *   test result
 *   exit code
 *   logs
 *   failures
 *   duration
 */
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { BuildResult } from '../build/build-engine'
import { DependencyInstaller, DependencyInstallationResult } from '../dependency-install/dependency-installer'
import { ControlledCommandExecutor, CommandResult } from '../commands/controlled-command-execution'
import { ExecutionJob, ExecutionTask } from '../executor/execution-models'
import { validateWorkspacePath } from '../workspace/workspace-manager'
import { LanguageId } from '../toolchain/toolchain-executor'

/**
 * Test result from the test engine
 */
export interface TestResult {
  /** Whether any tests passed */
  success: boolean
  /** Exit code from the test runner */
  exitCode: number | null
  /** Test outcome: 'passed', 'failed', 'error', 'skipped' */
  outcome: 'passed' | 'failed' | 'error' | 'skipped'
  /** Collected logs */
  logs: string
  /** List of test failures */
  failures: string[]
  /** List of test errors */
  errors: string[]
  /** Duration in milliseconds */
  durationMs: number
  /** Total number of tests */
  totalTests: number
  /** Number of passed tests */
  passedTests: number
  /** Number of failed tests */
  failedTests: number
}

/**
 * P9 Test Engine
 * 
 * Supports testing for Python (pytest), Java (JUnit/Maven/Gradle),
 * and TypeScript/JavaScript (configured project test command).
 * Uses project metadata and toolchain configuration to determine
 * the appropriate test command.
 */
export class TestEngine {
  private dependencyInstaller: DependencyInstaller
  private commandExecutor: ControlledCommandExecutor

  constructor(workspacePath: string) {
    this.dependencyInstaller = new DependencyInstaller(workspacePath)
    this.commandExecutor = new ControlledCommandExecutor(workspacePath)
  }

  /**
   * Run tests for a generated project.
   * 
   * @param generationPath The generation workspace path
   * @param technology Detected technology (optional - will be detected if not provided)
   * @returns Test result
   */
  async runTests(
    generationPath: string,
    technology?: { technology: string; language: LanguageId }
  ): Promise<TestResult> {
    const startTime = Date.now()

    // Detect technology if not provided
    const techInfo = technology || this.detectTechnology(generationPath)
    const language = techInfo.language

    // Initialize result
    const result: TestResult = {
      success: false,
      exitCode: null,
      outcome: 'error',
      logs: '',
      failures: [],
      errors: [],
      durationMs: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
    }

    try {
      // Run tests based on language
      if (language === 'python') {
        result.logs = await this.runPythonTests(generationPath)
      } else if (language === 'java') {
        result.logs = await this.runJavaTests(generationPath)
      } else {
        // Node.js/TypeScript
        result.logs = await this.runNodeTests(generationPath)
      }

      result.durationMs = Date.now() - startTime

      // Parse the logs to determine test outcome
      this.parseTestResult(result, result.logs)

      // Set success based on whether there were failures
      result.success = result.failedTests === 0 && result.failedTests === 0
      result.outcome = result.failedTests > 0 ? 'failed' : result.outcome

    } catch (e) {
      result.durationMs = Date.now() - startTime
      result.logs = `(e as Error).message`
      result.errors = [(e as Error).message]
      result.outcome = 'error'
    }

    // Final outcome determination
    if (result.failedTests > 0) {
      result.outcome = 'failed'
    } else if (result.errors.length > 0) {
      result.outcome = 'error'
    } else {
      result.outcome = 'passed'
    }

    result.success = result.outcome === 'passed'

    return result
  }

  /**
   * Run Python tests using pytest.
   */
  private async runPythonTests(generationPath: string): Promise<string> {
    let logs = ''

    // Check for pytest configuration
    const pytestPath = path.join(generationPath, 'pytest.ini')
    const setupPyPath = path.join(generationPath, 'setup.cfg')
    const pyprojectTomlPath = path.join(generationPath, 'pyproject.toml')

    // Install pytest if not available
    try {
      const { exec } = require('child_process')
      const installCheck = exec('pytest --version', {
        cwd: generationPath,
        maxBuffer: 1024,
        encoding: 'utf-8',
        timeout: 10000,
      })
      logs += `pytest check: ${installCheck.stdout}\n`
    } catch {
      logs += 'pytest not found, would need to install\n'
    }

    // Run pytest
    try {
      const { exec } = require('child_process')
      const pytestResult = exec('pytest -v', {
        cwd: generationPath,
        maxBuffer: 50 * 1024 * 1024,
        encoding: 'utf-8',
        timeout: 120000, // 2 minutes
      })

      logs += pytestResult.stdout
    } catch (e) {
      // pytest may exit with non-zero if tests fail
      logs += `pytest execution: ${(e as Error).message}\n`
    }

    return logs
  }

  /**
   * Run Java tests using Maven or Gradle.
   */
  private async runJavaTests(generationPath: string): Promise<string> {
    let logs = ''

    // Try Maven tests first
    try {
      const { exec } = require('child_process')
      const mavenResult = exec('mvn test -q', {
        cwd: generationPath,
        maxBuffer: 50 * 1024 * 1024,
        encoding: 'utf-8',
        timeout: 180000, // 3 minutes
      })

      logs += mavenResult
    } catch (e) {
      logs += `Maven test execution: ${(e as Error).message}\n`
    }

    // Try Gradle tests
    const gradleProps = path.join(generationPath, 'gradle.properties')
    if (fs.existsSync(gradleProps)) {
      try {
        const { exec } = require('child_process')
        const gradleResult = exec('./gradlew test -q', {
          cwd: generationPath,
          maxBuffer: 50 * 1024 * 1024,
          encoding: 'utf-8',
          timeout: 180000, // 3 minutes
        })

        logs += gradleResult
      } catch (e) {
        logs += `Gradle test execution: ${(e as Error).message}\n`
      }
    }

    return logs
  }

  /**
   * Run Node.js/TypeScript tests using npm test or jest.
   */
  private async runNodeTests(generationPath: string): Promise<string> {
    let logs = ''

    // Check for package.json test script
    const packageJsonPath = path.join(generationPath, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
        const testScript = packageJson.scripts?.test

        if (testScript) {
          // Use the project's defined test script
          const { exec } = require('child_process')
          const testResult = exec(testScript, {
            cwd: generationPath,
            maxBuffer: 50 * 1024 * 1024,
            encoding: 'utf-8',
            timeout: 120000, // 2 minutes
          })

          logs += `npm test (${testScript}): ${testResult.stdout}\n`
        } else {
          // Default to jest
          const { exec } = require('child_process')
          const jestResult = exec('npx jest -v', {
            cwd: generationPath,
            maxBuffer: 1024,
            encoding: 'utf-8',
            timeout: 30000,
          })

          logs += `npx jest: ${jestResult.stdout}\n`

          // Run jest tests
          const jestRunResult = exec('npx jest', {
            cwd: generationPath,
            maxBuffer: 50 * 1024 * 1024,
            encoding: 'utf-8',
            timeout: 120000,
          })

          logs += `npx jest run: ${jestRunResult.stdout}\n`
        }
      } catch (e) {
        logs += `Test execution error: ${(e as Error).message}\n`
      }
    } else {
      // Default to jest if no package.json
      try {
        const { exec } = require('child_process')
        const jestResult = exec('npx jest', {
          cwd: generationPath,
          maxBuffer: 50 * 1024 * 1024,
          encoding: 'utf-8',
          timeout: 120000,
        })

        logs += `npx jest: ${jestResult.stdout}\n`
      } catch (e) {
        logs += `Jest execution error: ${(e as Error).message}\n`
      }
    }

    return logs
  }

  /**
   * Parse test result logs to extract test outcomes.
   */
  private parseTestResult(result: TestResult, logs: string): void {
    const lines = logs.split('\n')

    // Count test occurrences
    const testLineRegex = /(\d+)\s+(passed|failed|skipped)/gi
    let matchedTests = 0

    for (const line of lines) {
      const matches = line.match(testLineRegex)
      if (matches) {
        matchedTests += matches.length
      }
    }

    result.totalTests = matchedTests || 0

    // Extract failures
    const failureRegex = /FAILED\s+(.+)/gi
    const errorRegex = /ERROR\s+(.+)/gi

    for (const line of lines) {
      const failureMatch = line.match(failureRegex)
      if (failureMatch) {
        result.failures.push(failureMatch[1].trim())
      }

      const errorMatch = line.match(errorRegex)
      if (errorMatch) {
        result.errors.push(errorMatch[1].trim())
      }
    }

    // Count passed/failed from outcome lines
    const passedRegex = /passed\D*(\d+)/gi
    const failedRegex = /failed\D*(\d+)/gi

    let passedCount = 0
    let failedCount = 0

    for (const line of lines) {
      const passedMatch = line.match(passedRegex)
      if (passedMatch) {
        passedCount += parseInt(passedMatch[1], 10)
      }

      const failedMatch = line.match(failedRegex)
      if (failedMatch) {
        failedCount += parseInt(failedMatch[1], 10)
      }
    }

    result.passedTests = passedCount
    result.failedTests = failedCount

    // Determine outcome
    if (failedCount > 0) {
      result.outcome = 'failed'
      result.success = false
    } else if (passedCount > 0) {
      result.outcome = 'passed'
      result.success = true
    } else {
      result.outcome = 'error'
      result.success = false
    }
  }
}

/**
 * Factory function to create a TestEngine
 */
export function createTestEngine(workspacePath: string): TestEngine {
  return new TestEngine(workspacePath)
}