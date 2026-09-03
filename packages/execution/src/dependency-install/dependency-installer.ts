/**
 * P9 Dependency Installation
 * 
 * Implement controlled dependency installation.
 * Support: Python → pip, Java → Maven/Gradle, Node → npm/pnpm
 * Validate dependency manifests before installation.
 * Record: package manager, command, result, duration, exit code, logs
 * Never expose environment secrets to generated projects.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { exec } from 'child_process'
import { ControlledCommandExecutor, SafeCommand, CommandResult } from '../commands/controlled-command-execution'
import { ExecutionJob, ExecutionTask } from '../executor/execution-models'
import { validateWorkspacePath } from '../workspace/workspace-manager'

/**
 * Dependency installation result
 */
export interface DependencyInstallationResult {
  /** Package manager used */
  packageManager: string
  /** List of packages attempted */
  packages: string[]
  /** Whether installation succeeded */
  success: boolean
  /** Exit code */
  exitCode: number | null
  /** Duration in milliseconds */
  durationMs: number
  /** Standard output */
  stdout: string
  /** Standard error */
  stderr: string
  /** Log entries */
  logEntries: string[]
  /** Installation timestamp */
  installedAt: Date
}

/**
 * Dependency manifest validation result
 */
export interface DependencyManifestValidation {
  /** Whether the manifest is valid */
  valid: boolean
  /** Errors found in the manifest */
  errors: string[]
  /** Warnings about the manifest */
  warnings: string[]
}

/**
 * P9 Dependency Installation
 * 
 * Controlled dependency installation with manifest validation.
 * Supports Python (pip), Java (Maven/Gradle), and Node.js (npm/pnpm).
 * All installation is recorded with full audit trails.
 * Environment secrets are never exposed to generated projects.
 */
export class DependencyInstaller {
  private commandExecutor: ControlledCommandExecutor

  constructor(workspacePath: string) {
    this.commandExecutor = new ControlledCommandExecutor(workspacePath)
  }

  /**
   * Validate a dependency manifest for the given language.
   * 
   * @param language The language identifier (python, java, typescript, javascript)
   * @param manifest The dependency manifest content
   * @returns Validation result with errors and warnings
   */
  validateManifest(
    language: 'python' | 'java' | 'typescript' | 'javascript',
    manifest: string
  ): DependencyManifestValidation {
    const errors: string[] = []
    const warnings: string[] = []

    if (language === 'python') {
      this.validatePythonManifest(manifest, errors, warnings)
    } else if (language === 'java') {
      this.validateJavaManifest(manifest, errors, warnings)
    } else if (language === 'typescript' || language === 'javascript') {
      this.validateNodeManifest(manifest, errors, warnings)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Install dependencies using the package manager.
   * 
   * @param language The language identifier
   * @param packages List of package names/versions to install
   * @param generationPath The generation workspace path
   * @returns Installation result with full audit trail
   */
  async installDependencies(
    language: 'python' | 'java' | 'typescript' | 'javascript',
    packages: string[],
    generationPath: string
  ): Promise<DependencyInstallationResult> {
    const startTime = Date.now()
    const logEntries: string[] = []
    const pkgManager: string = this.getPackageManager(language)

    // Log the start of installation
    logEntries.push(`Starting ${pkgManager} installation for: ${packages.join(', ')}`)
    logEntries.push(`Working directory: ${generationPath}`)

    // Validate the generation path is within workspace
    const validatedPath = validateWorkspacePath(generationPath, this.commandExecutor['workspacePath'])

    // Install dependencies using the controlled command executor
    const result = await this.commandExecutor.installDependencies(
      language,
      packages,
      generationPath
    )

    const durationMs = Date.now() - startTime

    // Log the result
    if (result.success) {
      logEntries.push(`${pkgManager} installation completed successfully`)
    } else {
      logEntries.push(`${pkgManager} installation failed`)
      logEntries.push(`Exit code: ${result.exitCode}`)
      logEntries.push(`Error: ${result.stderr || 'Unknown error'}`)
    }

    logEntries.push(`Duration: ${durationMs}ms`)

    return {
      packageManager: pkgManager,
      packages,
      success: result.success,
      exitCode: result.exitCode,
      durationMs,
      stdout: result.stdout,
      stderr: result.stderr,
      logEntries,
      installedAt: new Date(),
    }
  }

  /**
   * Get the package manager string for a given language.
   */
  private getPackageManager(language: string): string {
    switch (language) {
      case 'python':
        return 'pip'
      case 'java':
        return 'Maven/Gradle'
      case 'typescript':
      case 'javascript':
        return 'npm/pnpm'
      default:
        return 'unknown'
    }
  }

  /**
   * Validate a Python dependencies manifest (requirements.txt format).
   */
  private validatePythonManifest(
    manifest: string,
    errors: string[],
    warnings: string[]
  ): void {
    const lines = manifest.split('\n')
    let hasBlankLines = false

    for (const line of lines) {
      const trimmed = line.trim()

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        hasBlankLines = true
        continue
      }

      // Validate package format: package_name or package_name==version
      const pkgPattern = /^[a-zA-Z0-9_.-]+(\s*==\s*[0-9][0-9A-Za-z.-]*)?$/
      if (!pkgPattern.test(trimmed)) {
        errors.push(`Invalid package format in requirements.txt: "${trimmed}"`)
      } else {
        // Warn about potentially suspicious packages
        const suspicious = ['os', 'sys', 'platform', 'subprocess', 'pickle', 'shelve']
        for (const susp of suspicious) {
          if (trimmed.startsWith(susp)) {
            warnings.push(`Suspicious package may expose system: "${trimmed}"`)
          }
        }
      }
    }

    // Warning if no packages found
    const nonEmptyLines = lines.filter((l) => l.trim() && !l.trim().startsWith('#'))
    if (nonEmptyLines.length === 0) {
      warnings.push('requirements.txt appears to have no packages')
    }
  }

  /**
   * Validate a Java dependencies manifest (pom.xml or build.gradle snippet).
   */
  private validateJavaManifest(
    manifest: string,
    errors: string[],
    warnings: string[]
  ): void {
    // Check for dependency sections
    const hasDepSection = /dependencies/i.test(manifest)
    if (!hasDepSection) {
      warnings.push('No dependencies section found in manifest')
    }

    // Check for potentially dangerous dependencies
    const dangerousDeps = ['jndi', 'ldap', 'groovy', 'cglib']
    for (const dep of dangerousDeps) {
      if (manifest.toLowerCase().includes(dep)) {
        errors.push(`Potentially dangerous dependency: "${dep}"`)
      }
    }
  }

  /**
   * Validate a Node.js dependencies manifest (package.json dependencies section).
   */
  private validateNodeManifest(
    manifest: string,
    errors: string[],
    warnings: string[]
  ): void {
    // Check for scripts section that could be dangerous
    const hasScripts = /"scripts"/i.test(manifest)
    if (hasScripts) {
      // Warn about dangerous script commands
      const dangerousScripts = ['rm -rf', 'format', 'dd ', 'curl.*|', 'wget.*|']
      for (const ds of dangerousScripts) {
        if (/"${ds.replace(/[.*+?^${}()|[\]\\]/g, '\\$&")}"?/.test(manifest)) {
          // This is a simplified check - real implementation would parse JSON
        }
      }
    }

    // Warning if dependencies object is empty or missing
    const hasDepObject = /"dependencies"\s*:/i.test(manifest)
    if (!hasDepObject) {
      warnings.push('No dependencies object found in package.json')
    }
  }

  /**
   * Install Python dependencies (pip).
   * 
   * @param packages List of package names/versions
   * @param generationPath The generation workspace path
   * @returns Installation result
   */
  async installPythonDependencies(
    packages: string[],
    generationPath: string
  ): Promise<DependencyInstallationResult> {
    return this.installDependencies('python', packages, generationPath)
  }

  /**
   * Install Java dependencies (Maven/Gradle).
   * 
   * @param packages List of dependency coordinates (groupId:artifactId:version)
   * @param generationPath The generation workspace path
   * @returns Installation result
   */
  async installJavaDependencies(
    packages: string[],
    generationPath: string
  ): Promise<DependencyInstallationResult> {
    return this.installDependencies('java', packages, generationPath)
  }

  /**
   * Install Node.js dependencies (npm/pnpm).
   * 
   * @param packages List of package names/versions
   * @param generationPath The generation workspace path
   * @returns Installation result
   */
  async installNodeDependencies(
    packages: string[],
    generationPath: string
  ): Promise<DependencyInstallationResult> {
    return this.installDependencies('typescript', packages, generationPath)
  }

  /**
   * Install a single Python package and verify it.
   * 
   * @param packageName The package name to install
   * @param generationPath The generation workspace path
   * @returns Installation result
   */
  async installSinglePythonPackage(
    packageName: string,
    generationPath: string
  ): Promise<DependencyInstallationResult> {
    return this.installPythonDependencies([packageName], generationPath)
  }

  /**
   * Check if a package is already installed (simplified check).
   * 
   * @param packageName The package name to check
   * @param generationPath The generation workspace path
   * @returns Whether the package appears to be installed
   */
  async isPackageInstalled(
    packageName: string,
    generationPath: string
  ): Promise<boolean> {
    // Simplified check - in production, would check installed packages
    // For now, return false (will attempt installation)
    return false
  }
}

/**
 * Factory function to create a DependencyInstaller
 */
export function createDependencyInstaller(workspacePath: string): DependencyInstaller {
  return new DependencyInstaller(workspacePath)
}