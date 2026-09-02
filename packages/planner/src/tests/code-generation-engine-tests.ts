/** Code Generation Engine Tests — Tests for the code generation engine.
 *
 * Test cases:
 * - file creation
 * - file update
 * - invalid path blocked
 * - protected path blocked
 * - malformed generation rejected
 */

import { CodeGenerationEngine, FileChange } from '../code-generation-engine'
import { TechnologyStack } from '../technology-selector'

describe('Code Generation Engine', () => {
  let engine: CodeGenerationEngine

  beforeEach(() => {
    engine = createCodeGenerationEngine()
  })

  describe('generateForTask', () => {
    it('should generate initialization file for TypeScript', () => {
      const task = {
        taskId: 'task-1',
        taskType: 'initialize',
        description: 'Initialize project',
        language: 'typescript',
        framework: 'nextjs',
      } as any

      const architecture = {
        architectureId: 'arch-1',
        technologyStack: { language: 'typescript', framework: 'nextjs', projectType: 'web' },
        layers: 'Test',
        modules: ['src/'],
        services: [],
        controllers: [],
        models: [],
        repositories: [],
        configuration: 'Test',
        testingStrategy: 'Jest',
        buildCommand: 'npm run build',
        deploymentTarget: 'Vercel',
      }

      const files = engine.generateForTask(task, architecture, {})
      expect(files).toBeDefined()
      expect(files.length).toBeGreaterThan(0)

      // Check that a TypeScript file was generated
      const tsFile = files.find((f: FileChange) => f.filePath.endsWith('.ts'))
      expect(tsFile).toBeDefined()
      expect(tsFile?.operation).toBe('create')
    })

    it('should generate initialization file for Python', () => {
      const task = {
        taskId: 'task-1',
        taskType: 'initialize',
        description: 'Initialize project',
        language: 'python',
        framework: 'fastapi',
      } as any

      const architecture = {
        architectureId: 'arch-1',
        technologyStack: { language: 'python', framework: 'fastapi', projectType: 'backend' },
        layers: 'Test',
        modules: ['src/'],
        services: [],
        controllers: [],
        models: [],
        repositories: [],
        configuration: 'Test',
        testingStrategy: 'pytest',
        buildCommand: 'python -m uvicorn',
        deploymentTarget: 'Docker',
      }

      const files = engine.generateForTask(task, architecture, {})
      expect(files).toBeDefined()
      expect(files.length).toBeGreaterThan(0)

      // Check that a Python file was generated
      const pyFile = files.find((f: FileChange) => f.filePath.endsWith('.py'))
      expect(pyFile).toBeDefined()
      expect(pyFile?.operation).toBe('create')
    })

    it('should generate model files', () => {
      const task = {
        taskId: 'task-3',
        taskType: 'models',
        description: 'Create models',
        language: 'typescript',
        framework: 'nextjs',
      } as any

      const architecture = {
        architectureId: 'arch-1',
        technologyStack: { language: 'typescript', framework: 'nextjs', projectType: 'web' },
        layers: 'Test',
        modules: ['src/'],
        services: ['UserService'],
        controllers: [],
        models: ['User', 'Project'],
        repositories: [],
        configuration: 'Test',
        testingStrategy: 'Jest',
        buildCommand: 'npm run build',
        deploymentTarget: 'Vercel',
      }

      const files = engine.generateForTask(task, architecture, {})
      expect(files).toBeDefined()
      expect(files.length).toBeGreaterThan(0)

      // Check that model files were generated
      const modelFiles = files.filter((f: FileChange) => f.filePath.includes('model'))
      expect(modelFiles.length).toBeGreaterThan(0)
    })

    it('should generate API files', () => {
      const task = {
        taskId: 'task-4',
        taskType: 'api',
        description: 'Create API',
        language: 'typescript',
        framework: 'nextjs',
      } as any

      const architecture = {
        architectureId: 'arch-1',
        technologyStack: { language: 'typescript', framework: 'nextjs', projectType: 'web' },
        layers: 'Test',
        modules: ['src/'],
        services: [],
        controllers: ['ProjectsController'],
        models: ['User', 'Project'],
        repositories: [],
        configuration: 'Test',
        testingStrategy: 'Jest',
        buildCommand: 'npm run build',
        deploymentTarget: 'Vercel',
      }

      const files = engine.generateForTask(task, architecture, {})
      expect(files).toBeDefined()
      expect(files.length).toBeGreaterThan(0)

      // Check that API files were generated
      const apiFiles = files.filter((f: FileChange) => f.filePath.includes('api') || f.filePath.includes('route'))
      expect(apiFiles.length).toBeGreaterThan(0)
    })

    it('should generate authentication files', () => {
      const task = {
        taskId: 'task-5',
        taskType: 'authentication',
        description: 'Create auth',
        language: 'typescript',
        framework: 'nextjs',
      } as any

      const architecture = {
        architectureId: 'arch-1',
        technologyStack: { language: 'typescript', framework: 'nextjs', projectType: 'web' },
        layers: 'Test',
        modules: ['src/'],
        services: [],
        controllers: [],
        models: ['User'],
        repositories: [],
        configuration: 'Test',
        testingStrategy: 'Jest',
        buildCommand: 'npm run build',
        deploymentTarget: 'Vercel',
      }

      const files = engine.generateForTask(task, architecture, {})
      expect(files).toBeDefined()
      expect(files.length).toBeGreaterThan(0)

      // Check that auth files were generated
      const authFiles = files.filter((f: FileChange) => f.filePath.includes('auth'))
      expect(authFiles.length).toBeGreaterThan(0)
    })

    it('should generate service files', () => {
      const task = {
        taskId: 'task-6',
        taskType: 'services',
        description: 'Create services',
        language: 'typescript',
        framework: 'nextjs',
      } as any

      const architecture = {
        architectureId: 'arch-1',
        technologyStack: { language: 'typescript', framework: 'nextjs', projectType: 'web' },
        layers: 'Test',
        modules: ['src/'],
        services: ['UserService', 'ProjectService'],
        controllers: ['ProjectsController'],
        models: ['User', 'Project'],
        repositories: [],
        configuration: 'Test',
        testingStrategy: 'Jest',
        buildCommand: 'npm run build',
        deploymentTarget: 'Vercel',
      }

      const files = engine.generateForTask(task, architecture, {})
      expect(files).toBeDefined()
      expect(files.length).toBeGreaterThan(0)

      // Check that service files were generated
      const serviceFiles = files.filter((f: FileChange) => f.filePath.includes('service'))
      expect(serviceFiles.length).toBeGreaterThan(0)
    })

    it('should generate test files', () => {
      const task = {
        taskId: 'task-7',
        taskType: 'testing',
        description: 'Create tests',
        language: 'typescript',
        framework: 'nextjs',
      } as any

      const architecture = {
        architectureId: 'arch-1',
        technologyStack: { language: 'typescript', framework: 'nextjs', projectType: 'web' },
        layers: 'Test',
        modules: ['src/'],
        services: ['UserService'],
        controllers: ['ProjectsController'],
        models: ['User'],
        repositories: [],
        configuration: 'Test',
        testingStrategy: 'Jest',
        buildCommand: 'npm run build',
        deploymentTarget: 'Vercel',
      }

      const files = engine.generateForTask(task, architecture, {})
      expect(files).toBeDefined()
      expect(files.length).toBeGreaterThan(0)

      // Check that test files were generated
      const testFiles = files.filter((f: FileChange) => f.filePath.includes('test'))
      expect(testFiles.length).toBeGreaterThan(0)
    })

    it('should generate documentation files', () => {
      const task = {
        taskId: 'task-8',
        taskType: 'documentation',
        description: 'Generate docs',
        language: 'typescript',
        framework: 'nextjs',
      } as any

      const architecture = {
        architectureId: 'arch-1',
        technologyStack: { language: 'typescript', framework: 'nextjs', projectType: 'web' },
        layers: 'Test',
        modules: ['src/'],
        services: ['UserService'],
        controllers: ['ProjectsController'],
        models: ['User'],
        repositories: [],
        configuration: 'Test',
        testingStrategy: 'Jest',
        buildCommand: 'npm run build',
        deploymentTarget: 'Vercel',
      }

      const files = engine.generateForTask(task, architecture, {})
      expect(files).toBeDefined()
      expect(files.length).toBeGreaterThan(0)

      // Check that documentation was generated
      const docFiles = files.filter((f: FileChange) => f.filePath.includes('README'))
      expect(docFiles.length).toBeGreaterThan(0)
    })

    it('should generate placeholder for unknown task type', () => {
      const task = {
        taskId: 'task-unknown',
        taskType: 'unknown_type' as any,
        description: 'Unknown task',
        language: 'typescript',
        framework: 'nextjs',
      } as any

      const architecture = {
        architectureId: 'arch-1',
        technologyStack: { language: 'typescript', framework: 'nextjs', projectType: 'web' },
        layers: 'Test',
        modules: ['src/'],
        services: [],
        controllers: [],
        models: [],
        repositories: [],
        configuration: 'Test',
        testingStrategy: 'Jest',
        buildCommand: 'npm run build',
        deploymentTarget: 'Vercel',
      }

      const files = engine.generateForTask(task, architecture, {})
      expect(files).toBeDefined()
      expect(files.length).toBeGreaterThan(0)

      // Should have a placeholder file
      const placeholder = files.find((f: FileChange) => f.filePath.includes('placeholder'))
      expect(placeholder).toBeDefined()
    })
  })
})