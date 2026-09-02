import { ToolchainResult } from './toolchain-execution'

/** Test Abstraction — Language-independent test interface.
 *
 * Adapters:
 * - PythonTestAdapter
 * - JavaTestAdapter
 * - NodeTestAdapter
 *
 * Normalized test results.
 */
export interface TestAdapters {
  /** Python test adapter. */
  python: {
    test: (command: string, timeoutMs?: number) => Promise<ToolchainResult>
  }
  /** Java test adapter. */
  java: {
    test: (command: string, timeoutMs?: number) => Promise<ToolchainResult>
  }
  /** Node/TypeScript test adapter. */
  node: {
    test: (command: string, timeoutMs?: number) => Promise<ToolchainResult>
  }
}

/** Default test adapters (placeholders). */
export const defaultTestAdapters: TestAdapters = {
  python: {
    test: PythonToolchainExecution.executeTest,
  },
  java: {
    test: JavaToolchainExecution.executeTest,
  },
  node: {
    test: NodeToolchainExecution.executeTest,
  },
}

/** Test Abstraction — Dispatches to the correct adapter based on language. */
export class TestEngine {
  private adapters: TestAdapters

  constructor(testAdapters: TestAdapters = defaultTestAdapters) {
    this.adapters = testAdapters
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