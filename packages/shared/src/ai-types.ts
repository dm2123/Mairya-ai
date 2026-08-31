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

export interface AIRequest {
  model: AIModel
  provider: AIProvider
  prompt: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface AIResponse {
  text: string
  model: AIModel
  provider: AIProvider
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: string
}

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
}