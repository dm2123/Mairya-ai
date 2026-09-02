import { GenerationTask } from './requirement-model'
import { ArchitectureOutput } from './architecture-generator'
import { TechnologyStack } from './technology-selector'

/** Code Generation Engine — Accepts generation tasks, architecture, and
 * produces structured file changes.
 *
 * Input:
 * - generation task
 * - project architecture
 * - target language
 * - framework
 * - template information
 * - relevant context
 *
 * Output contains:
 * - file path
 * - operation
 * - generated content
 * - language
 * - metadata
 *
 * Supported operations:
 * - create
 * - update
 * - delete (only when explicitly authorized by the generation workflow)
 */

/** File Change — Single generated/modified file. */
export interface FileChange {
  /** Absolute or project-relative file path. */
  filePath: string
  /** Operation: 'create', 'update', 'delete' */
  operation: 'create' | 'update' | 'delete'
  /** Generated/modified content. */
  content: string
  /** Programming language. */
  language?: string
  /** Framework, if applicable. */
  framework?: string
  /** Metadata. */
  metadata?: Record<string, unknown>
}

/** Code Generation Result — Result of running the code generation engine. */
export interface CodeGenerationResult {
  /** Unique generation ID. */
  generationId?: string
  /** Project ID. */
  projectId?: string
  /** Tasks processed. */
  tasksProcessed?: number
  /** Files generated. */
  filesGenerated: FileChange[]
  /** Errors, if any. */
  errors?: string[]
  /** Warnings, if any. */
  warnings?: string[]
  /** Completed at timestamp. */
  completedAt?: Date
}

/** CodeGenerationEngine — Generates files based on tasks and architecture. */
export class CodeGenerationEngine {
  /** Generate files for a single task. */
  generateForTask(
    task: GenerationTask,
    architecture: ArchitectureOutput,
    context?: Record<string, unknown>
  ): FileChange[] {
    const files: FileChange[] = []

    // Determine language and framework from task
    const lang = task.language || 'typescript'
    const framework = task.framework || 'nextjs'

    // Generate files based on task type
    switch (task.taskType) {
      case 'initialize':
        files.push(...this.generateInitializeFile(task, lang, framework))
        break

      case 'configuration':
        files.push(...this.generateConfigurationFile(task, lang, framework))
        break

      case 'models':
        files.push(...this.generateModelFiles(task, lang, framework))
        break

      case 'api':
        files.push(...this.generateAPIFiles(task, lang, framework))
        break

      case 'authentication':
        files.push(...this.generateAuthenticationFiles(task, lang, framework))
        break

      case 'services':
        files.push(...this.generateServiceFiles(task, lang, framework))
        break

      case 'testing':
        files.push(...this.generateTestFiles(task, lang, framework))
        break

      case 'documentation':
        files.push(...this.generateDocumentationFiles(task, lang, framework))
        break

      default:
        // Unknown task type - generate a placeholder
        files.push(this.generatePlaceholderFile(task))
        break
    }

    return files
  }

  /** Generate project initialization file. */
  private generateInitializeFile(
    task: GenerationTask,
    language: string,
    framework: string
  ): FileChange[] {
    let content: string

    if (language === 'typescript' || language === 'javascript') {
      content = '{\n  "name": "my-project",\n  "version": "0.1.0"\n}\n'
    } else if (language === 'python') {
      content = 'from fastapi import FastAPI\n\napp = FastAPI()\n'
    } else if (language === 'java') {
      content = "package com.example.demo;\n\npublic class DemoApplication {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}\n"
    } else {
      content = '# ' + language + ' project initialization\n'
    }

    return [
      {
        filePath: 'src/index.' + (language === 'java' ? 'java' : 'ts'),
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      },
    ]
  }

  /** Generate configuration file. */
  private generateConfigurationFile(
    task: GenerationTask,
    language: string,
    framework: string
  ): FileChange[] {
    let content: string

    if (language === 'typescript' || language === 'javascript') {
      content = '{\n  "projectName": "my-project",\n  "framework": "' + framework + '"\n}\n'
    } else if (language === 'python') {
      content = '#!/usr/bin/env python3\n# Configuration will be via environment variables\n'
    } else if (language === 'java') {
      content = "package com.example.demo;\n\npublic class Configuration {\n}\n"
    } else {
      content = '# Configuration file\n'
    }

    return [
      {
        filePath: 'config.' + (language === 'java' ? 'java' : 'ts'),
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      },
    ]
  }

  /** Generate model files. */
  private generateModelFiles(
    task: GenerationTask,
    language: string,
    framework: string
  ): FileChange[] {
    // Generate model files based on the architecture
    const models = ['User', 'Project', 'Profile']
    const files: FileChange[] = []

    for (const model of models) {
      if (language === 'typescript' || language === 'javascript') {
        content = `export interface ${model} {\n  id: string\n  name: string\n  createdAt: string\n}\n`
      } else if (language === 'python') {
        content = `class ${model}:\n    def __init__(self, id: string, name: string, createdAt: string = ''):\n        self.id = id\n        self.name = name\n        self.createdAt = createdAt\n`
      } else if (language === 'java') {
        content = `package com.example.${model.toLowerCase();\n\npublic class ${model} {\n    private String id;\n    private String name;\n    private String createdAt;\n\n    public ${model}() {}\n\n    public String getId() { return id; }\n    public void setId(String id) { this.id = id; }\n    public String getName() { return name; }\n    public void setName(String name) { this.name = name; }\n    public String getCreatedAt() { return createdAt; }\n    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }\n}\n`
      } else {
        content = `// ${model} model\n`
      }

      files.push({
        filePath: `src/models/${model.toLowerCase()}.${language === 'java' ? 'java' : 'ts'}`,
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId, model },
      })
    }

    return files
  }

  /** Generate API files. */
  private generateAPIFiles(
    task: GenerationTask,
    language: string,
    framework: string
  ): FileChange[] {
    const files: FileChange[] = []

    if (language === 'typescript' || language === 'javascript') {
      // FastAPI-style or Next.js API routes
      content = `import { Router } from "${framework}"\n\nconst router = Router()\n\nrouter.get("/projects", (req, res) => {\n  res.json({ message: "List of projects" })\n})\n\nrouter.post("/projects", (req, res) => {\n  res.json({ message: "Created project" })\n})\n`
      }

      files.push({
        filePath: `src/routes/${framework}.${language === 'typescript' || language === 'javascript' ? 'ts' : 'js'}`,
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    } else if (language === 'python' && framework === 'fastapi') {
      content = '''from fastapi import APIRouter\n\nrouter = APIRouter()\n\n@router.get("/projects")\ndef list_projects():...@router.post("/projects")\ndef create_project():...'''
      }

      files.push({
        filePath: 'src/api/routes.py',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    } else if (language === 'java' && framework === 'spring_boot') {
      content = "package com.example.demo.controller;\n\nimport org.springframework.web.bind.annotation.RestController;\nimport org.springframework.web.bind.annotation.RequestMapping;\n@RestController\n@RequestMapping("/api/projects")\npublic class ProjectController {\n}\n"
      }

      files.push({
        filePath: 'src/main/java/com/example/demo/controller/ProjectController.java',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    }

    return files
  }

  /** Generate authentication files. */
  private generateAuthenticationFiles(
    task: GenerationTask,
    language: string,
    framework: string
  ): FileChange[] {
    const files: FileChange[] = []

    if (language === 'typescript' || language === 'javascript') {
      content = `import { NextAuthOptions } from "next-auth"\n\nconst authOptions: NextAuthOptions = {\n  providers: [],\n}\n\nexport default authOptions\n`
      }

      files.push({
        filePath: 'src/auth/[nextauth].ts',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    } else if (language === 'python' && framework === 'fastapi') {
      content = '''from fastapi import APIRouter, Depends, HTTPException\nfrom fastapi.security import OAuth2PasswordBearer\n\nrouter = APIRouter()\n\noauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")\n\nasync def get_current_user(token: str = Depends(oauth2_scheme)):\n    ...\n\n@router.post("/token")\ndef login():...'''
      }

      files.push({
        filePath: 'src/auth.py',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    } else if (language === 'java' && framework === 'spring_boot') {
      content = "package com.example.demo.config;\n\nimport org.springframework.security.config.annotation.web.builders.HttpSecurity;\nimport org.springframework.security.config.annotation.configuration.EnableWebSecurity;\n@EnableWebSecurity\npublic class SecurityConfig {\n}\n"
      }

      files.push({
        filePath: 'src/main/java/com/example/demo/config/SecurityConfig.java',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    }

    return files
  }

  /** Generate service files. */
  private generateServiceFiles(
    task: GenerationTask,
    language: string,
    framework: string
  ): FileChange[] {
    const files: FileChange[] = []

    if (language === 'typescript' || language === 'javascript') {
      content = `import { ${task.description} } from "../models"\n\nexport class ${task.description}Service {\n  async list() {\n    ...\n  }\n}\n`
      }

      files.push({
        filePath: `src/services/${task.description}Service.${language === 'typescript' || language === 'javascript' ? 'ts' : 'js'}`,
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    } else if (language === 'python' && framework === 'fastapi') {
      content = '''from src.models import User, Project\n\nclass UserService:\n    def list_users(self):\n        ...\n\nclass ProjectService:\n    def list_projects(self):\n        ...\n'''

      files.push({
        filePath: 'src/services.py',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    } else if (language === 'java' && framework === 'spring_boot') {
      content = "package com.example.demo.service;\n\nimport org.springframework.stereotype.Service;\n@Service\npublic class UserService {\n}\n"
      }

      files.push({
        filePath: 'src/main/java/com/example/demo/service/UserService.java',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    }

    return files
  }

  /** Generate test files. */
  private generateTestFiles(
    task: GenerationTask,
    language: string,
    framework: string
  ): FileChange[] {
    const files: FileChange[] = []

    if (language === 'typescript' || language === 'javascript') {
      content = `import { describe, test, expect } from "@jest/globals"\n\ndescribe("Project Service", () => {\n  test("lists projects", () => {\n    ...\n  })\n})\n`

      files.push({
        filePath: 'src/tests/${task.taskId}.test.${language === 'typescript' ? 'ts' : 'js'}',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    } else if (language === 'python' && framework === 'fastapi') {
      content = '''from src.main import app\nimport pytest\n\ndef test_read_root():\n    client = ...\n    response = client.get("/")\n    assert response.status_code == 200\n\n@pytest.mark.skip\ndef test_create_project():...'''

      files.push({
        filePath: 'tests/test_main.py',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    } else if (language === 'java' && framework === 'spring_boot') {
      content = "package com.example.demo.service;\n\nimport org.junit.jupiter.api.Test;\nimport org.springframework.boot.test.context.SpringBootTest;\n@SpringBootTest\nclass UserServiceTest {\n    @Test\n    void contextLoads() {\n    }\n}\n"

      files.push({
        filePath: 'src/test/java/com/example/demo/service/UserServiceTest.java',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    }

    return files
  }

  /** Generate documentation files. */
  private generateDocumentationFiles(
    task: GenerationTask,
    language: string,
    framework: string
  ): FileChange[] {
    const files: FileChange[] = []

    if (language === 'typescript' || language === 'javascript') {
      content = '# Project Documentation\n\n## Setup\n```bash\nnpm install\n```\n\n## Run\n```bash\nnpm run dev\n```\n\n## Build\n```bash\nnpm run build\n```\n'

      files.push({
        filePath: 'README.md',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    } else if (language === 'python' && framework === 'fastapi') {
      content = '''# Project Documentation\n\n## Setup\n```bash\npip install -r requirements.txt\n```\n\n## Run\n```bash\nuvicorn main:app --host 0.0.0.0 --port 8000\n```\n\n## Test\n```bash\npytest\n```\n'''

      files.push({
        filePath: 'README.md',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    } else if (language === 'java' && framework === 'spring_boot') {
      content = '# Spring Boot Project Documentation\n\n## Run\n```bash\nmvn spring-boot:run\n```\n\n## Test\n```bash\nmvn test\n```\n'

      files.push({
        filePath: 'README.md',
        operation: 'create',
        content,
        language,
        framework,
        metadata: { taskId: task.taskId },
      })
    }

    return files
  }

  /** Generate a placeholder file for unknown task types. */
  private generatePlaceholderFile(task: GenerationTask): FileChange {
    return {
      filePath: `src/${task.taskId}.placeholder`,
      operation: 'create',
      content: `// Placeholder for task: ${task.description}\n// Task ID: ${task.taskId}\n`,
      language: task.language || 'unknown',
      framework: task.framework,
      metadata: { taskId: task.taskId },
    }
  }
}

/** Creates a new CodeGenerationEngine instance. */
export function createCodeGenerationEngine(): CodeGenerationEngine {
  return new CodeGenerationEngine()
}

/** Runs code generation for a generation plan. */
export async function runGeneration(
  plan: GenerationPlan,
  engine: CodeGenerationEngine,
  context?: Record<string, unknown>
): Promise<CodeGenerationResult> {
  const files: FileChange[] = []
  const errors: string[] = []
  const startTime = new Date()

  // Process each task in order
  for (const task of plan.tasks || []) {
    try {
      const generatedFiles = engine.generateForTask(task, plan.architecture!, context)
      files.push(...generatedFiles)
    } catch (err: any) {
      errors.push(`Task ${task.taskId}: ${err.message}`)
    }
  }

  const completedAt = new Date()

  return {
    generationId: plan.planId,
    projectId: plan.projectId,
    tasksProcessed: plan.tasks?.length || 0,
    filesGenerated: files,
    errors,
    warnings: errors.length > 0 ? ['See errors above'] : undefined,
    completedAt,
  }
}