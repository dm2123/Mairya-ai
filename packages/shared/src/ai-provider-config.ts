import { AIProvider, AIModel, AIModelCapabilities, AIRetryPolicy } from './ai-types'

/**
 * Provider system configuration loaded from environment/configuration system.
 *
 * Critically: API keys and secrets are NEVER stored in this configuration.
 * They must come from secure environment variables or secret management systems.
 * Only configuration metadata (endpoints, defaults, capabilities) goes here.
 */
export interface AIProviderSystemConfig {
  // Provider identification
  provider: AIProvider
  providerId: string // internal identifier, not exposed externally

  // Enabled state
  enabled: boolean

  // Model configuration
  defaultModel: AIModel
  availableModels: AIModel[]

  // Endpoint and connectivity
  apiEndpoint?: string
  timeoutMs: number
  maxOutputTokens: number

  // Retry and rate limiting
  retryPolicy: AIRetryPolicy
  maxRetries: number
  retryDelayMs: number

  // Token and cost metadata (estimates only; actual cost from provider)
  estimatedCostPer1KPromptTokens: number
  estimatedCostPer1KCompletionTokens: number

  // Capabilities
  capabilities: AIModelCapabilities

  // Organization-level settings
  organizationId: string
  maxConcurrentRequests: number
  requestsPerMinute: number
  requestsPerDay: number

  // Security
  // apiKey is intentionally omitted — must come from secure config system
}

/**
 * Configuration service for AI providers.
 * Responsible for loading, validating, and providing provider configurations.
 * Never returns API keys or secrets.
 */
export class AIProviderConfiguration {
  private configs: Map<string, AIProviderSystemConfig> = new Map()

  constructor(initialConfigs: AIProviderSystemConfig[]) {
    initialConfigs.forEach((config) => this.configs.set(config.providerId, config))
  }

  getConfig(providerId: string): AIProviderSystemConfig | undefined {
    return this.configs.get(providerId)
  }

  getAllConfigs(): AIProviderSystemConfig[] {
    return Array.from(this.configs.values())
  }

  getEnabledConfigs(): AIProviderSystemConfig[] {
    return Array.from(this.configs.values()).filter((c) => c.enabled)
  }

  reload(configs: AIProviderSystemConfig[]): void {
    this.configs = new Map()
    configs.forEach((config) => this.configs.set(config.providerId, config))
  }
}