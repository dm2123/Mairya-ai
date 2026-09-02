import { LanguageId, FrameworkId, ProjectType } from './project-types'

/**
 * Template Registry — Versionable template abstraction for project generation.
 *
 * Templates define the file structure, configuration, and dependencies
 * for a given language/framework/project type combination.
 *
 * Templates must be versionable and should NOT be hardcoded into the core
 * generator. New templates can be added by extending the registry.
 */
export interface TemplateDefinition {
  templateId: string
  language: LanguageId
  framework: FrameworkId | null
  projectType: ProjectType
  version: string
  fileStructure: Record<string, string[]> // path -> list of content lines
  configuration?: Record<string, unknown>
  dependencies?: string[]
  testStructure?: Record<string, string[]>
  enabled: boolean
}

/** Template registry — Holds all available templates.
 *
 * Templates are versioned and can be extended by adding new entries
 * without modifying the core generator logic.
 */
export const TemplateDefinitions: Record<string, TemplateDefinition> = {
  // Python FastAPI baseline template
  'python_fastapi_baseline': {
    templateId: 'python_fastapi_baseline',
    language: 'python',
    framework: 'fastapi',
    projectType: 'backend',
    version: '1.0.0',
    fileStructure: {
      'main.py': ['from fastapi import FastAPI', 'app = FastAPI()', '@app.get("/")', 'def read_root():', '    return {"message": "Hello World"}'],
      'requirements.txt': ['fastapi', 'uvicorn'],
      'README.md': ['# FastAPI Project', '', '## Setup', '```bash', 'pip install -r requirements.txt', '```'],
    ],
    dependencies: ['fastapi', 'uvicorn'],
    enabled: true,
  },

  // Python Django baseline template
  'python_django_baseline': {
    templateId: 'python_django_baseline',
    language: 'python',
    framework: 'django',
    projectType: 'web',
    version: '1.0.0',
    fileStructure: {
      'manage.py': ['# Django management script'],
      'README.md': ['# Django Project', '', '## Setup', '```bash', 'python manage.py migrate', '```'],
    ],
    dependencies: ['django'],
    enabled: true,
  },

  // Java Spring Boot baseline template
  'java_springboot_baseline': {
    templateId: 'java_springboot_baseline',
    language: 'java',
    framework: 'spring_boot',
    projectType: 'backend',
    version: '1.0.0',
    fileStructure: {
      'src/main/java/com/example/demo/DemoApplication.java': [
        'package com.example.demo;',
        '',
        "import org.springframework.boot.SpringApplication;",
        "import org.springframework.web.bind.annotation.RestController;",
        "import org.springframework.web.bind.annotation.GetMapping;",
        '',
        "@RestController",
        "class DemoApplication {",
        "    @GetMapping(\"/\")",
        "    public String hello() {",
        "        return \"Hello World\";",
        "    }",
        "}",
      ],
      'pom.xml': '<project><modelVersion>4.0.0</modelVersion><groupId>com.example</groupId><artifactId>demo</artifactId><version>1.0.0</version></project>',
      'README.md': ['# Spring Boot Project', '', '## Setup', '```bash', 'mvn spring-boot:run', '```'],
    ],
    dependencies: ['spring-boot-starter-web'],
    enabled: true,
  },

  // React TypeScript template
  'react_typescript_baseline': {
    templateId: 'react_typescript_baseline',
    language: 'typescript',
    framework: 'react',
    projectType: 'web',
    version: '1.0.0',
    fileStructure: {
      'src/App.tsx': ['import React from "react"', 'import "./App.css"', 'function App() {', '  return <div>Hello World</div>', '}', 'export default App;'],
      'src/index.tsx': ['import React from "react"', 'import ReactDOM from "react-dom"', 'import "./index.css"', 'ReactDOM.render(<App />, document.getElementById("root"))'],
      'package.json': ['{', '  "name": "my-react-app"', '  "version": "0.1.0"', '  "scripts": {', '    "start": "react-scripts start"', '    "build": "react-scripts build"', '    "test": "react-scripts test"', '  }', '}'],
      'package-lock.json': ['# npm lockfile'],
    ],
    dependencies: ['react', 'react-dom'],
    testStructure: {
      'src/__tests__/App.test.tsx': ['import React from "react"', 'import { render } from "@testing-library/react"', 'test("renders learn page", () => {', '  const { asByRole } = render(<App />)', '  expect(await asByRole("button").toHaveTextContent("Hello World"))', '})'],
    },
    dependencies: ['react', 'react-dom'],
    enabled: true,
  },
}

/** Gets a template definition by ID. */
export function getTemplateDefinition(templateId: string): TemplateDefinition | undefined {
  return TemplateDefinitions[templateId]
}

/** Validates that a template exists and is enabled. */
export function isTemplateEnabled(templateId: string): boolean {
  const def = TemplateDefinitions[templateId]
  return def ? def.enabled : false
}

/** Gets all enabled templates. */
export function getEnabledTemplates(): TemplateDefinition[] {
  return Object.values(TemplateDefinitions).filter((t) => t.enabled)
}

/** Gets templates for a specific language. */
export function getTemplatesForLanguage(language: LanguageId): TemplateDefinition[] {
  return Object.values(TemplateDefinitions).filter((t) => t.language === language)
}

/** Gets templates for a specific framework. */
export function getTemplatesForFramework(frameworkId: FrameworkId): TemplateDefinition[] {
  return Object.values(TemplateDefinitions).filter((t) => t.framework === frameworkId)
}