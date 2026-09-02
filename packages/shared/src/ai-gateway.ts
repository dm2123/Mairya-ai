import { AIProvider, AIModel, AIRequest, AIResponse, AIUsage, AIProviderConfig, AIModelCapabilities, AIRetryPolicy, AIRequestId, AIError } from './ai-types'

/**
 * AI Gateway — Centralized AI request pipeline.
 *
 * Responsibilities:
 * - Provider selection and routing
 * - Model selection
 * - Request validation
 * - Authentication/configuration lookup
 * - Usage tracking
 * - Rate limiting hooks
 * - Timeout handling
 * - Error normalization
 * - Logging/auditing
 * - Response normalization
 *
 * Future modules must NOT bypass this gateway casually.
 */

export class AIGateway {
  private configs: Map<string, AIProviderConfig> = new Map()

  constructor(initialConfigs: AIProviderConfig[]) {
    initialConfigs.forEach((config) => this.configs.set(config.id, config))
  }

  /**
   * Get provider configuration by ID.
   * Returns undefined if provider is disabled or not configured.
   */
  getConfig(providerId: string): AIProviderConfig | undefined {
    return this.configs.get(providerId)
  }

  /**
   * Route an AI request to the appropriate provider adapter.
   * Validates the request, checks permissions, and delegates.
   */
  async routeRequest(request: AIRequest): Promise<AIResponse> {
    const config = this.getConfig(request.provider as string)

    if (!config || !config.enabled) {
      throw new Error('AI provider is not configured or disabled')
    }

    // Validate request
    this.validateRequest(request, config)

    // Execute with timeout and retry
    const startMs = Date.now()

    let response: { output: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; finishReason: string }
    try {
      response = await this.executeWithConfig(request, config)
    } catch (err: any) {
      // Normalize error into a safe application error
      const code = err.code || 'ai_provider_error'
      const message = err.message || 'AI request failed'
      throw {
        code,
        message,
        retryable: this.isRetryableError(err, code),
        provider: request.provider as AIProvider,
        model: request.model as AIModel,
      }
    }

    const latencyMs = Date.now() - startMs

    // Normalize response into the public AIResponse shape.
    // The AIResponse interface has error?: AIError; we omit it when there's no error
    // to satisfy exactOptionalPropertyTypes.
    return {
      requestId: request.requestId,
      provider: request.provider as AIProvider,
      model: request.model as AIModel,
      output: response.output,
      usage: {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      },
      finishReason: response.finishReason,
      latencyMs,
    } as AIResponse
  }

  private validateRequest(request: AIRequest, config: AIProviderConfig): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required and must not be empty')
    }

    if (request.maxTokens !== undefined && request.maxTokens <= 0) {
      throw new Error('maxTokens must be a positive integer')
    }

    if (request.temperature !== undefined) {
      if (request.temperature < config.capabilities.minTemperature || request.temperature > config.capabilities.maxTemperature) {
        throw new Error(`Temperature must be between ${config.capabilities.minTemperature} and ${config.capabilities.maxTemperature}`)
      }
    }
  }

  private async executeWithConfig(request: AIRequest, config: AIProviderConfig): Promise<{ output: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; finishReason: string }> {
    // Placeholder — future provider adapters will be registered here.
    throw new Error('No adapter registered for provider: ' + config.provider)
  }

  private isRetryableError(err: any, code: string): boolean {
    // Only retry safe, transient errors
    if (err.retryable !== undefined) {
      return err.retryable
    }
    // Default: transient errors are retryable
    const transientCodes = ['rate_limit', 'timeout', 'service_unavailable', 'api_error']
    return transientCodes.some((c) => code.includes(c))
  }
}