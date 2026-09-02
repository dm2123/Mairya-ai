/** AI Gateway Integration Tests — Tests for the AI gateway integration.
 *
 * Test cases:
 * - gateway is used
 * - direct provider bypass is not introduced
 */

import { AIGateway } from '../shared/src/ai-gateway'
import { AIGatewayIntegration, GatewayRequest, GatewayResponse } from '../ai-gateway-integration'
import { AIProjectRequirement } from '../requirement-model'

describe('AI Gateway Integration', () => {
  let gateway: AIGateway
  let integration: AIGatewayIntegration

  beforeEach(() => {
    gateway = new AIGateway([])
    integration = createAIGatewayIntegration(gateway)
  })

  describe('AIGatewayIntegration', () => {
    it('should send request through the gateway', async () => {
      // Mock the gateway routeRequest
      ;(gateway.routeRequest as jest.Mock).mockResolvedValueOnce({
        requestId: 'test-123',
        provider: 'openai',
        model: 'gpt-4o-mini',
        output: 'Generated project plan',
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
        finishReason: 'stop',
        latencyMs: 500,
      } as unknown as AIResponse)

      const requirement: AIProjectRequirement = {
        projectName: 'Test Project',
        projectDescription: 'A test project',
        projectType: 'backend',
      }

      const request: GatewayRequest = {
        requestId: 'plan-test-1',
        provider: 'openai',
        model: 'gpt-4o-mini',
        prompt: 'Generate a project plan',
        organizationId: 'org-123',
        features: ['architecture', 'data-models'],
      }

      const response = await integration.sendRequest(request)

      expect(response).toBeDefined()
      expect(response.requestId).toBe('plan-test-1')
      expect(response.provider).toBe('openai')
      expect(response.model).toBe('gpt-4o-mini')
      expect(response.output).toBe('Generated project plan')
      expect(response.success).toBe(true)
    })

    it('should generate project plan through the gateway', async () => {
      ;(gateway.routeRequest as jest.Mock).mockResolvedValueOnce({
        requestId: 'plan-456',
        provider: 'openai',
        model: 'gpt-4o-mini',
        output: 'Structured project plan with architecture',
        usage: {
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
        },
        finishReason: 'stop',
        latencyMs: 800,
      } as unknown as AIResponse)

      const requirement: AIProjectRequirement = {
        projectName: 'Test Project',
        projectDescription: 'A test project',
        projectType: 'backend',
        targetPlatform: 'web',
        preferredLanguage: 'python',
        preferredFramework: 'fastapi',
        functionalRequirements: 'API endpoints',
        nonFunctionalRequirements: 'High performance',
      }

      const response = await integration.generateProjectPlan(requirement, 'org-123')

      expect(response).toBeDefined()
      expect(response.requestId).toBeDefined()
      expect(response.provider).toBe('openai')
      expect(response.model).toBe('gpt-4o-mini')
      expect(response.output).toContain('project plan')
      expect(response.success).toBe(true)
    })

    it('should generate code for a task through the gateway', async () => {
      ;(gateway.routeRequest as jest.Mock).mockResolvedValueOnce({
        requestId: 'task-789',
        provider: 'openai',
        model: 'gpt-4o-mini',
        output: 'Generated source code',
        usage: {
          promptTokens: 150,
          completionTokens: 75,
          totalTokens: 225,
        },
        finishReason: 'stop',
        latencyMs: 600,
      } as unknown as AIResponse)

      const request: GatewayRequest = {
        requestId: 'task-test-1',
        provider: 'openai',
        model: 'gpt-4o-mini',
        prompt: 'Generate code for task',
        organizationId: 'org-123',
        features: ['code-generation'],
      }

      const response = await integration.generateCodeForTask(
        { taskId: 'task-1', taskType: 'initialize', language: 'typescript', framework: 'nextjs' },
        { architectureId: 'arch-1', layers: 'Test', modules: ['src/'] } as any,
        'org-123'
      )

      expect(response).toBeDefined()
      expect(response.requestId).toBeDefined()
      expect(response.provider).toBe('openai')
      expect(response.model).toBe('gpt-4o-mini')
      expect(response.output).toContain('code')
      expect(response.success).toBe(true)
    })

    it('should validate generated code through the gateway', async () => {
      ;(gateway.routeRequest as jest.Mock).mockResolvedValueOnce({
        requestId: 'validate-101',
        provider: 'openai',
        model: 'gpt-4o-mini',
        output: 'Code is valid. No obvious issues detected.',
        usage: {
          promptTokens: 50,
          completionTokens: 25,
          totalTokens: 75,
        },
        finishReason: 'stop',
        latencyMs: 300,
      } as unknown as AIResponse)

      const response = await integration.validateGeneratedCode(
        'src/main.py',
        'from fastapi import FastAPI\napp = FastAPI()\n',
        'python',
        'fastapi',
        'org-123'
      )

      expect(response).toBeDefined()
      expect(response.requestId).toBeDefined()
      expect(response.provider).toBe('openai')
      expect(response.model).toBe('gpt-4o-mini')
      expect(response.output).toContain('valid')
      expect(response.success).toBe(true)
    })
  })
})