export enum AIModel {
  GPT_4O = 'gpt-4o',
  GPT_4 = 'gpt-4',
  GPT_3_5 = 'gpt-3.5-turbo',
  CLAUDE_3 = 'claude-3',
  GEMINI_1_5 = 'gemini-1.5-flash',
}

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  LOCAL = 'local',
}

// Provider configuration metadata (no secrets stored directly)
export interface AIProviderConfig {
  id: string
  name: string
  provider: AIProvider
  enabled: boolean
  defaultModel: AIModel
  capabilities: AIModelCapabilities
  contextWindow: number
  maxOutputTokens: number
  timeoutMs: number
  retryPolicy: AIRetryPolicy
  metadata: Record<string, unknown>
}

// Per-model capabilities
export interface AIModelCapabilities {
  supportsSystemPrompt: boolean
  supportsToolUse: boolean
  supportsStreaming: boolean
  supportsVision: boolean
  maxOutputTokens: number
  maxTemperature: number
  minTemperature: number
}

// Retry policy for safe retries only
export enum AIRetryPolicy {
  NONE = 'none',
  TRANSIENT_ERRORS = 'transient_errors',
  ALL_SAFE = 'all_safe',
}

// Unique request tracking
export interface AIRequestId {
  id: string
  organizationId: string
  userId: string
  timestamp: Date
  provider: AIProvider
  model: AIModel
}

// Normalized AI error (never leaks secrets)
export interface AIError {
  code: string
  message: string
  retryable: boolean
  provider: AIProvider
  model: AIModel
}

// Extended AI request with organization and request tracking
export interface AIRequest {
  requestId: AIRequestId
  model: AIModel
  provider: AIProvider
  prompt: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  metadata?: Record<string, unknown>
}

// Normalized AI response from any provider
export interface AIResponse {
  requestId: AIRequestId
  provider: AIProvider
  model: AIModel
  output: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: string
  latencyMs: number
  error?: AIError
}

// Extended usage tracking with organization context
export interface AIUsage {
  userId: string
  organizationId: string
  projectId?: string
  agentId?: string
  model: AIModel
  provider: AIProvider
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
  timestamp: Date
  requestId: AIRequestId
  success: boolean
}