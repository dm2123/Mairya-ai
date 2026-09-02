import { LanguageDefinition } from './project-types'

/**
 * Python Toolchain Abstraction
 *
 * Provides a controlled,registry-based abstraction for Python toolchain operations.
 * Commands are sourced from the registry, NOT from arbitrary user input.
 */

export class PythonToolchain {
  /** Python runtime command */
  static getRuntime(): string {
    return 'python3'
  }

  /** Python package installation command */
  static getInstallCommand(packages: string[]): string {
    if (packages.length === 0) return ''
    if (packages.length === 1) return `pip install ${packages[0]}`
    return `pip install ${packages.join(' ')}`
  }

  /** Python project initialization (FastAPI) */
  static getFastAPIInit(): string {
    return 'pip install fastapi uvicorn'
  }

  /** Python project initialization (Django) */
  static getDjangoInit(): string {
    return 'pip install django'
  }

  /** Python test command (pytest) */
  static getTestCommand(): string {
    return 'pytest'
  }

  /** Python lint/format command (black + flake8) */
  static getLintCommand(): string {
    return 'black . && flake8 .'
  }

  /** Python build command (for FastAPI) */
  static getBuildCommand(): string {
    return 'echo "FastAPI has no explicit build step"'
  }

  /** Get the pytest command with optional markers */
  static getTestCommandWithMarkers(markers: string[] = []): string {
    if (markers.length > 0) return `pytest -m ${markers.join(' or ')}`
    return 'pytest'
  }

  /** Check if a Python version is supported */
  static isVersionSupported(version: string): boolean {
    // Python 3.10+ is supported; earlier versions are not
    const major = parseInt(version.split('.')[0])
    return major >= 3 && major <= 312
  }
}

/** Python toolchain registry entry. */
export const PythonToolchainDef: LanguageDefinition = {
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

/** Java toolchain abstraction. */
export class JavaToolchain {
  /** Java runtime command */
  static getRuntime(): string {
    return 'java'
  }

  /** Java compilation command (Maven) */
  static getCompileCommandMaven(): string {
    return 'mvn compile'
  }

  /** Java compilation command (Gradle) */
  static getCompileCommandGradle(): string {
    return 'gradle compileJava'
  }

  /** Java test command (JUnit) */
  static getTestCommandJUnit(): string {
    return 'mvn test'
  }

  /** Java lint command (SpotBugs) */
  static getLintCommand(): string {
    return 'mvn spotbugs:check'
  }

  /** Java build command (Maven) */
  static getBuildCommandMaven(): string {
    return 'mvn package'
  }

  /** Java build command (Gradle) */
  static getBuildCommandGradle(): string {
    return 'gradle build'
  }

  /** Check if JDK is available (version check placeholder) */
  static isJDKAvailable(version: string): boolean {
    // Placeholder - actual check would query the system
    return true
  }
}

/** Java toolchain registry entry. */
export const JavaToolchainDef: LanguageDefinition = {
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

/** TypeScript/JavaScript toolchain abstraction. */
export class TypeScriptJavaScriptToolchain {
  /** Node.js runtime command */
  static getRuntime(): string {
    return 'node'
  }

  /** npm install command */
  static getInstallCommand(packages: string[]): string {
    if (packages.length === 0) return ''
    if (packages.length === 1) return `npm install ${packages[0]}`
    return `npm install ${packages.join(' ')}`
  }

  /** npm init command */
  static getInitCommand(): string {
    return 'npm init -y'
  }

  /** npm install specific frameworks */
  static getReactSetup(): string {
    return 'npm install react react-dom'
  }

  /** Next.js setup */
  static getNextJSSetup(): string {
    return 'npx create-next-app@14 .'
  }

  /** npm test command (jest) */
  static getTestCommand(): string {
    return 'npm test'
  }

  /** npm lint command (eslint + prettier) */
  static getLintCommand(): string {
    return 'npm run lint'
  }

  /** npm build command */
  static getBuildCommand(): string {
    return 'npm run build'
  }

  /** Get Node.js version compatibility */
  static isVersionSupported(version: string): boolean {
    // Node 18+ is supported
    const major = parseInt(version.split('.')[0])
    return major >= 18
  }
}

/** TypeScript/JavaScript toolchain registry entry. */
export const TypeScriptJavaScriptToolchainDef: LanguageDefinition = {
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

/** JavaScript toolchain registry entry (same structure, shared). */
export const JavaScriptToolchainDef: LanguageDefinition = {
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
}