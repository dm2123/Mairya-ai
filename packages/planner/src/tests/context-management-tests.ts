/** Context Management Tests — Tests for context selection and building.
 *
 * Test cases:
 * - context slice selection
 * - context string building
 * - relevant interfaces for task
 * - relevant data models for task
 * - framework conventions
 * - coding conventions
 */

import { ContextSelector, buildContextString, ContextSlice } from '../context-management'
import { AIProjectRequirement } from '../requirement-model'
import { ArchitectureOutput } from '../architecture-generator'
import { TechnologyStack } from '../technology-selector'
import { GenerationTask } from '../requirement-model'

describe('Context Management', () => {
  let selector: ContextSelector

  beforeEach(() => {
    selector = createContextSelector()
  })

  describe('ContextSelector', () => {
    it('should select context for models task', () => {
      const requirement: AIProjectRequirement = {
        projectName: 'Test Project',
        projectDescription: 'A test project',
        projectType: 'backend',
        targetPlatform: 'web',
        preferredLanguage: 'python',
        preferredFramework: 'fastapi',
      }

      const architecture: ArchitectureOutput = {
        architectureId: 'arch-1',
        technologyStack: { language: 'python', framework: 'fastapi', projectType: 'backend' },
        layers: 'Layers: Python FastAPI',
        modules: ['main.py', 'models.py'],
        services: ['UserService'],
        controllers: ['routes.py'],
        models: ['User', 'Project'],
        repositories: ['UserRepository'],
        configuration: 'env vars',
        testingStrategy: 'pytest',
        buildCommand: 'python -m uvicorn',
        deploymentTarget: 'Docker',
      }

      const task: GenerationTask = {
        taskId: 'task-3',
        taskType: 'models',
        description: 'Create models',
        language: 'python',
        framework: 'fastapi',
        status: 'pending',
        dependencies: [],
        targetFiles: ['src/models/*.py'],
      }

      const slice: ContextSlice = selector.selectContext(
        requirement,
        architecture,
        task,
        { language: 'python', framework: 'fastapi', projectType: 'backend' },
        ['src/index.py']
      )

      expect(slice.requirement).toBeDefined()
      expect(slice.architecture).toBeDefined()
      expect(slice.technologyStack).toBeDefined()
      expect(slice.task).toBeDefined()
      expect(slice.interfaces).toBeDefined()
      expect(slice.dataModels).toBeDefined()
      expect(slice.frameworkConventions).toBeDefined()
      expect(slice.codingConventions).toBeDefined()
      expect(slice.existingFiles).toEqual(['src/index.py'])
    })

    it('should build context string', () => {
      const slice: ContextSlice = {
        requirement: {
          projectName: 'Test Project',
          projectDescription: 'A test project',
          projectType: 'backend',
          targetPlatform: 'web',
          preferredLanguage: 'typescript',
          preferredFramework: 'nextjs',
        },
        architecture: {
          architectureId: 'arch-1',
          technologyStack: { language: 'typescript', framework: 'nextjs', projectType: 'web' },
          layers: 'Layers: Next.js',
          modules: ['src/'],
          services: ['UserService'],
          controllers: ['Pages'],
          models: ['User'],
          repositories: [],
          configuration: 'env vars',
          testingStrategy: 'Jest',
          buildCommand: 'npm run build',
          deploymentTarget: 'Vercel',
        },
        technologyStack: { language: 'typescript', framework: 'nextjs', projectType: 'web' },
        task: {
          taskId: 'task-4',
          taskType: 'api',
          description: 'Create API',
          language: 'typescript',
          framework: 'nextjs',
          status: 'pending',
          dependencies: [],
          targetFiles: ['src/api/projects.ts'],
        },
        interfaces: 'API route handlers, request/response types',
        dataModels: 'Project, User - API request/response types',
        frameworkConventions: 'Next.js conventions: pages/router, getServerSideProps',
        codingConventions: 'TypeScript strict mode, camelCase',
        existingFiles: ['src/index.ts'],
      }

      const contextString = buildContextString(slice)
      expect(contextString).toBeDefined()
      expect(contextString!.length).toBeGreaterThan(0)
      expect(contextString).toContain('Project Requirement')
      expect(contextString).toContain('Architecture')
      expect(contextString).toContain('Technology Stack')
      expect(contextString).toContain('Task')
      expect(contextString).toContain('Relevant Interfaces')
      expect(contextString).toContain('Data Models')
      expect(contextString).toContain('Framework Conventions')
      expect(contextString).toContain('Coding Conventions')
      expect(contextString).toContain('Existing Files')
    })
  })
})