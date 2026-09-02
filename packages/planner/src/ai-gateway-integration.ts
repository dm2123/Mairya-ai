import { AIGateway } from '../shared/src/ai-gateway'
import { AIRequest, AIResponse } from '../shared/src/ai-types'
import { AIProjectRequirement } from './requirement-model'

/** AI Gateway Integration — Ensures all LLM calls from the Project Planner
 * and Code Generation Engine go through the P6 AI Gateway.
 *
 * Flow:
 *   Project Planner / Code Generation Engine
 *   ↓
 *   AI Gateway Integration (validate + route)
 *   ↓
 *   AIGateway (provider adapter)
 *   ↓
 *   LLM
 *   ↓
 *   Normalized Response
 *   ↓
 *   Back to Factory
 *
 * Respects existing:
 * - authentication
 * - rate limits
 * - usage tracking
 * - audit logging
 * - organization isolation
 */

/** GatewayRequest — Request shape for AI Gateway integration.
 *
 * Wraps a generation context into a format the P6 AIGateway can route.
 */
export interface GatewayRequest {
  /** Unique request ID. */
  requestId?: string
  /** AI provider (e.g., 'openai', 'anthropic', 'google'). */
  provider: string
  /** AI model (e.g., 'gpt-4', 'claude-3', 'gemini-pro'). */
  model: string
  /** The prompt/context to send to the LLM. */
  prompt: string
  /** Optional: maximum tokens to generate. */
  maxTokens?: number
  /** Optional: temperature (0.0 to 1.0). */
  temperature?: number
  /** Optional: top-p sampling. */
  topP?: number
  /** Organization ID for isolation. */
  organizationId?: string
  /** Requested features/context for the LLM. */
  features?: string[]
}

/** GatewayResponse — Response shape from AI Gateway integration. */
export interface GatewayResponse {
  /** Request ID. */
  requestId: string
  /** AI provider. */
  provider: string
  /** AI model. */
  model: string
  /** LLM output text. */
  output: string
  /** Token usage. */
  usage: {
    /** Prompt tokens consumed. */
    promptTokens: number
    /** Completion tokens generated. */
    completionTokens: number
    /** Total tokens. */
    totalTokens: number
  }
  /** Finish reason from the LLM. */
  finishReason: string
  /** Latency in milliseconds. */
  latencyMs: number
  /** Whether the response is complete. */
  success: boolean
}

/** AI Gateway Integration Service.
 *
 * Wraps all LLM calls through the P6 AIGateway.
 * Provides typed integration for project planning and code generation.
 */
export class AIGatewayIntegration {
  private gateway: AIGateway

  constructor(gateway: AIGateway) {
    this.gateway = gateway
  }

  /** Send a generation request through the AI Gateway.
   *
   * @param request The gateway request containing prompt and metadata
   * @returns Typed gateway response
   * @throws Error if gateway routing fails
   */
  async sendRequest(request: GatewayRequest): Promise<GatewayResponse> {
    // Build the AIRequest from the gateway request
    const aiRequest: AIRequest = {
      requestId: request.requestId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      provider: request.provider,
      model: request.model,
      prompt: request.prompt,
      maxTokens: request.maxTokens,
      temperature: request.temperature,
    }

    // Route through P6 AIGateway
    const result = await this.gateway.routeRequest(aiRequest)

    // Transform into typed response
    return {
      requestId: result.requestId,
      provider: result.provider as string,
      model: result.model as string,
      output: result.output,
      usage: {
        promptTokens: result.usage?.promptTokens || 0,
        completionTokens: result.usage?.completionTokens || 0,
        totalTokens: result.usage?.totalTokens || 0,
      },
      finishReason: result.finishReason || 'stop',
      latencyMs: result.latencyMs || 0,
      success: true,
    }
  }

  /** Generate project plan using the AI Gateway.
   *
   * Sends the requirement description to the LLM with structured context
   * to help generate or validate a project plan.
   */
  async generateProjectPlan(
    requirement: AIProjectRequirement,
    organizationId: string
  ): Promise<GatewayResponse> {
    // Construct a focused prompt for project planning
    const prompt = `Generate a structured project plan for the following requirements:

Project Name: ${requirement.projectName}
Project Description: ${requirement.projectDescription}
Project Type: ${requirement.projectType}
Target Platform: ${requirement.targetPlatform}
Required Features: ${requirement.requiredFeatures || 'None specified'}
Functional Requirements: ${requirement.functionalRequirements || 'None specified'}
Non-Functional Requirements: ${requirement.nonFunctionalRequirements || 'None specified'}
Preferred Language: ${requirement.preferredLanguage || 'Not specified'}
Preferred Framework: ${requirement.preferredFramework || 'Not specified'}
Database Requirements: ${requirement.databaseRequirements || 'Not specified'}
Authentication Requirements: ${requirement.authenticationRequirements || 'Not specified'}
API Requirements: ${requirement.apiRequirements || 'Not specified'}
UI Requirements: ${requirement.uiRequirements || 'Not specified'}
Testing Requirements: ${requirement.testingRequirements || 'Not specified'}
Deployment Requirements: ${requirement.deploymentRequirements || 'Not specified'}
Constraints: ${requirement.constraints || 'None specified'}

Please provide a comprehensive project plan covering architecture, components, APIs, data models, authentication, authorization, testing strategy, build strategy, and deployment target. Format the response in a structured, machine-readable way.`

    return this.sendRequest({
      requestId: `plan-${requirement.projectName}-${Date.now()}`,
      provider: 'openai', // Will be resolved by gateway config
      model: 'gpt-4o-mini',
      prompt,
      organizationId,
      features: [
        'architecture',
        'data-models',
        'api-specification',
        'authentication',
        'authorization',
        'testing-strategy',
        'build-strategy',
        'deployment-target',
      ],
    })
  }

  /** Generate code for a specific task using the AI Gateway.
   *
   * Sends the task definition and architecture context to the LLM
   * to generate code for that specific task.
   */
  async generateCodeForTask(
    task: any, // GenerationTask
    architecture: any, // ArchitectureOutput
    organizationId: string
  ): Promise<GatewayResponse> {
    // Construct a focused prompt for code generation
    const prompt = `Generate code for the following generation task:

Task ID: ${task.taskId}
Task Type: ${task.taskType}
Description: ${task.description}
Language: ${task.language || 'TypeScript'}
Framework: ${task.framework || 'Next.js'}
Target Files: ${task.targetFiles?.join(', ') || 'src/'}

Project Architecture:
${architecture?.layers || 'Structured architecture to be provided'}

Please generate the specific code files requested. Output should be structured as file changes with file paths and generated content. Be concise and accurate. Do not generate unrelated code.`

    return this.sendRequest({
      requestId: `task-${task.taskId}-${Date.now()}`,
      provider: 'openai',
      model: 'gpt-4o-mini',
      prompt,
      organizationId,
      features: ['code-generation', 'file-structure', 'language-specific'],
    })
  }

  /** Validate generated code using the AI Gateway.
   *
   * Sends generated code back to the LLM for basic validation,
   * checking for obvious issues, syntax correctness, and framework compatibility.
   */
  async validateGeneratedCode(
    filePath: string,
    content: string,
    language: string,
    framework: string,
    organizationId: string
  ): Promise<GatewayResponse> {
    const prompt = `Review the following generated ${language} code for the ${framework} framework.

File: ${filePath}
Language: ${language}
Framework: ${framework}

Code:
\`\`\`${language}
${content}
\`\`\`

Check for:
1. Syntax correctness
2. Framework compatibility
3. Obvious security issues (hardcoded secrets, command execution, etc.)
4. Proper imports and exports
5. Code quality and conventions

Provide a brief validation report. If the code is valid, state "VALID". If there are issues, list them briefly. Be concise.`

    return this.sendRequest({
      requestId: `validate-${filePath}-${Date.now()}`,
      provider: 'openai',
      model: 'gpt-4o-mini',
      prompt,
      organizationId,
      features: ['code-validation', 'syntax-check', 'security-scan'],
    })
  }
}

/** Creates an AI Gateway Integration service with a configured gateway. */
export function createAIGatewayIntegration(
  gateway: AIGateway
): AIGatewayIntegration {
  return new AIGatewayIntegration(gateway)
}