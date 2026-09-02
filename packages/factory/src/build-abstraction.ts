import { ToolchainResult } from './toolchain-execution'

/** Build Abstraction — Language-independent build interface.
 *
 * Adapters:
 * - PythonBuildAdapter
 * - JavaBuildAdapter
 * - NodeBuildAdapter
 *
 * Return normalized results via ToolchainResult.
 */
export interface BuildAdapters {
  /** Python build adapter. */
  python: {
    build: (command: string, timeoutMs?: number) => Promise<ToolchainResult>
    test: (command: string, timeoutMs?: number) => Promise<ToolchainResult>
  }
  /** Java build adapter. */
  java: {
    build: (command: string, timeoutMs?: number) => Promise<ToolchainResult>
    test: (command: string, timeoutMs?: number) => Promise<ToolchainResult>
  }
  /** Node/TypeScript build adapter. */
  node: {
    build: (command: string, timeoutMs?: number) => Promise<ToolchainResult>
    test: (command: string, timeoutMs?: number) => Promise<ToolchainResult>
  }
}

/** Default build adapters (placeholders - real impl spawns processes). */
export const defaultBuildAdapters: BuildAdapters = {
  python: {
    build: PythonToolchainExecution.executeBuild,
    test: PythonToolchainExecution.executeTest,
  },
  java: {
    build: JavaToolchainExecution.executeBuild,
    test: JavaToolchainExecution.executeTest,
  },
  node: {
    build: NodeToolchainExecution.executeBuild,
    test: NodeToolchainExecution.executeTest,
  },
}

/** Build engine that dispatches to the correct adapter based on language. */
export class BuildEngine {
  private adapters: BuildAdapters

  constructor(adapters: BuildAdapters = defaultBuildAdapters) {
    this.adapters = adapters
  }

  /** Build a project using the appropriate adapter for the language. */
  async build(language: string, command: string, timeoutMs?: number): Promise<ToolchainResult> {
    const adapter = this.getAdapter(language)
    if (!adapter) {
      throw new Error(`No build adapter for language: ${language}`)
    }
    return await adapter.build(command, timeoutMs)
  }

  /** Test a project using the appropriate adapter for the language. */
  async test(language: string, command: string, timeoutMs?: number): Promise<ToolchainResult> {
    const adapter = this.getAdapter(language)
    if (!adapter) {
      throw new Error(`No test adapter for language: ${language}`)
    }
    return await adapter.test(command, timeoutMs)
  }

  /** Gets the adapter for a given language. */
  private getAdapter(language: string): {
    build: (command: string, timeoutMs?: number) => Promise<ToolchainResult>
    test: (command: string, timeoutMs?: number) => Promise<ToolchainResult>
  } | undefined {
    const lower = language.toLowerCase()
    if (lower.includes('python')) return this.adapters.python
    if (lower.includes('java')) return this.adapters.java
    if (lower.includes('node') || lower.includes('typescript') || lower.includes('javascript'))
      return this.adapters.node
    return undefined
  }
}