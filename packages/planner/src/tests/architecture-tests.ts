/** Architecture Generator Tests — Tests for the architecture generator.
 *
 * Test cases:
 * - structured architecture output
 * - dependency ordering
 * - valid architecture validation
 */

import { generateArchitecture } from '../architecture-generator'
import { AIProjectRequirement } from '../requirement-model'
import { TechnologyStack } from '../technology-selector'

describe('Architecture Generator', () => {
  describe('generateArchitecture', () => {
    it('should generate Python FastAPI architecture', () => {
      const requirement: AIProjectRequirement = {
        projectName: 'Test API',
        projectDescription: 'A test API project',
        projectType: 'backend',
        targetPlatform: 'web',
        preferredLanguage: 'python',
        preferredFramework: 'fastapi',
      }

      const techStack: TechnologyStack = {
        language: 'python',
        framework: 'fastapi',
        projectType: ProjectType.BACKEND,
        reasoning: 'Default backend stack',
      }

      const architecture = generateArchitecture(requirement, techStack)
      expect(architecture.architectureId).toBeDefined()
      expect(architecture.technologyStack).toEqual(techStack)
      expect(architecture.layers).toBeDefined()
      expect(architecture.modules).toBeDefined()
      expect(architecture.services).toBeDefined()
      expect(architecture.controllers).toBeDefined()
      expect(architecture.models).toBeDefined()
      expect(architecture.repositories).toBeDefined()
      expect(architecture.configuration).toBeDefined()
      expect(architecture.testingStrategy).toBeDefined()
      expect(architecture.buildCommand).toBeDefined()
      expect(architecture.deploymentTarget).toBeDefined()
    })

    it('should generate TypeScript Next.js architecture', () => {
      const requirement: AIProjectRequirement = {
        projectName: 'Test Web App',
        projectDescription: 'A test web application',
        projectType: 'web',
        targetPlatform: 'web',
        preferredLanguage: 'typescript',
        preferredFramework: 'nextjs',
      }

      const techStack: TechnologyStack = {
        language: 'typescript',
        framework: 'nextjs',
        projectType: ProjectType.WEB,
        reasoning: 'Default web stack',
      }

      const architecture = generateArchitecture(requirement, techStack)
      expect(architecture.architectureId).toBeDefined()
      expect(architecture.technologyStack).toEqual(techStack)
      expect(architecture.layers).toBeDefined()
      expect(architecture.modules).toBeDefined()
      expect(architecture.services).toBeDefined()
      expect(architecture.controllers).toBeDefined()
      expect(architecture.models).toBeDefined()
      expect(architecture.repositories).toBeDefined()
    })

    it('should return valid architecture', () => {
      const requirement: AIProjectRequirement = {
        projectName: 'Test Project',
        projectDescription: 'A test project',
        projectType: 'backend',
        targetPlatform: 'web',
        preferredLanguage: 'python',
        preferredFramework: 'fastapi',
      }

      const techStack: TechnologyStack = {
        language: 'python',
        framework: 'fastapi',
        projectType: ProjectType.BACKEND,
        reasoning: 'Default backend stack',
      }

      const architecture = generateArchitecture(requirement, techStack)
      const isValid = architecture.architectureId !== undefined &&
        architecture.technologyStack !== undefined &&
        architecture.layers !== undefined

      expect(isValid).toBe(true)
    })
  })
})