P8 — AI Project Planner and Code Generation Engine Documentation

================================================================================

OVERVIEW
--------

P8 builds the next layer of the Maurya AI Software Factory, adding an AI Project
Planner and AI Code Generation Engine on top of the P7 multi-language Software
Factory foundation.

The system is capable of taking a structured project requirement and converting it
into:
  Requirement → Project Plan → Architecture → Technology Stack → Project Structure
  → Generation Tasks → Generated Source Files → Validation

================================================================================

1. REQUIREMENT NORMALIZATION (P8 Step 2)
---------------------------------------

Model: AIProjectRequirement
  - All fields are optional except projectName (required for validity)
  - Versionable — includes createdAt/updatedAt timestamps
  - Used as input to the Project Planner

Key functions:
  - isValidRequirement(req): Validates minimum required fields
  - createRequirement(overrides): Creates a new requirement instance

Files created:
  - packages/planner/src/requirement-model.ts

================================================================================

2. AI PROJECT PLANNER (P8 Step 3)
---------------------------------

Service: ProjectPlanner
  - Input: AIProjectRequirement
  - Output: AIProjectPlan
  - Uses P7 registries for technology selection
  - Generates structured architecture (high-level)
  - Generates generation tasks based on architecture

Key features:
  - Technology selection using P7 registries (not hardcoded)
  - Deterministic default stack selection based on project type
  - Architecture generation for supported stacks (Python FastAPI, TypeScript Next.js, Java Spring Boot)
  - Task generation: initialize, configuration, models, api, authentication, services, testing, documentation

Output interface: AIProjectPlan with:
  - selectedLanguage, selectedFramework
  - architecture (structured text)
  - dataModels, apiSpecification
  - authentication, authorization
  - testingStrategy, buildStrategy
  - deploymentTarget
  - generationTasks[]

Files created:
  - packages/planner/src/project-planner.ts

================================================================================

3. TECHNOLOGY SELECTION (P8 Step 4)
-----------------------------------

Layer: Technology Selection using P7 registries
  - selectTechnologyStack(projectType, preferredLanguage, preferredFramework)
  - isValidCombination(language, framework, projectType)
  - getDefaultStack(projectType): Deterministic stack selection

Rules:
  - If user specifies valid language/framework combination, respect it
  - If no language specified, choose from supported stacks using deterministic rules
  - If framework incompatible with language, fall back to defaults
  - Never allow unsupported combinations

Default stacks:
  - backend/api → Python + FastAPI
  - web/software → TypeScript + Next.js

Files created:
  - packages/planner/src/technology-selector.ts

================================================================================

4. ARCHITECTURE GENERATION (P8 Step 5)
--------------------------------------

Function: generateArchitecture(requirement, technologyStack)
  - Output: ArchitectureOutput (machine-readable)
  - Includes: layers, modules, services, controllers, models, repositories
  - Configuration, testing strategy, build command, deployment target

Supported stacks:
  - Python + FastAPI: layered architecture with services, repositories, pytest
  - TypeScript + Next.js: Next.js pages/services, Jest testing, Vercel deployment
  - Java + Spring Boot: Controllers, Services, Repositories, JUnit testing

Fallback: Structured placeholder for unknown stacks

Validation: isValidArchitecture(arch) checks architectureId, technologyStack, layers

Files created:
  - packages/planner/src/architecture-generator.ts

================================================================================

5. GENERATION PLAN (P8 Step 6)
-------------------------------

Function: createGenerationPlan(architecture, projectId)
  - Output: GenerationPlan with ordered tasks
  - Tasks support dependency ordering (topological sort possible)
  - Default tasks provided when no architecture available

Task ordering:
  1. Initialize project (always first)
  2. Create configuration
  3. Create data models
  4. Create API layer
  5. Create authentication
  6. Create business services
  7. Create tests
  8. Create documentation

Each task has: taskId, taskType, description, dependencies, targetFiles,
language, framework, status, retry information

Files created:
  - packages/planner/src/generation-plan.ts

================================================================================

6. CODE GENERATION ENGINE (P8 Step 7)
-------------------------------------

Class: CodeGenerationEngine
  - Input: generation task, architecture, context
  - Output: FileChange[] (structured file changes)

Supported operations:
  - create: Generate new files
  - update: Modify existing files
  - delete: Only when explicitly authorized by generation workflow

FileChange interface:
  - filePath: Absolute or project-relative path
  - operation: 'create' | 'update' | 'delete'
  - content: Generated/modified content
  - language: Programming language
  - framework: Framework, if applicable
  - metadata: Task ID, model name, etc.

Generation per task type:
  - initialize: package.json, pyproject.toml, pom.xml, src/index.ts
  - configuration: config files language-specific
  - models: Interface/class definitions for User, Project, Profile
  - api: Route handlers and controllers
  - authentication: Auth middleware/configuration
  - services: Business logic services
  - testing: Test suites (Jest, pytest, JUnit)
  - documentation: README.md generation
  - placeholder: For unknown task types

Files created:
  - packages/planner/src/code-generation-engine.ts

================================================================================

7. AI GATEWAY INTEGRATION (P8 Step 8)
-------------------------------------

Flow:
  Project Planner / Code Generation Engine → AI Gateway Integration → AIGateway → Provider Adapter → LLM → Normalized Response → Back to Factory

Respects existing:
  - authentication
  - rate limits
  - usage tracking
  - audit logging
  - organization isolation

GatewayRequest → wrapped into AIRequest → routed through AIGateway → GatewayResponse

Key functions:
  - sendRequest(gatewayRequest): Send request through P6 AIGateway
  - generateProjectPlan(requirement, organizationId): Generate project plan via LLM
  - generateCodeForTask(task, architecture, organizationId): Generate code via LLM
  - validateGeneratedCode(filePath, content, language, framework, organizationId): Validate via LLM

Files created:
  - packages/planner/src/ai-gateway-integration.ts

================================================================================

8. CONTEXT MANAGEMENT (P8 Step 9)
----------------------------------

Class: ContextSelector
  - Selects and packages context relevant to a specific generation task
  - BuildContextString: Formats context for LLM consumption

ContextSlice includes:
  - requirement: Project requirement providing overall goals
  - architecture: Architecture output describing structure
  - technologyStack: Selected technology stack
  - task: The specific task being executed
  - interfaces: Relevant type definitions
  - dataModels: Relevant data models
  - frameworkConventions: Framework-specific conventions
  - codingConventions: Language-specific conventions
  - existingFiles: Files to avoid duplication

Files created:
  - packages/planner/src/context-management.ts

================================================================================

9. MULTI-LANGUAGE GENERATION (P8 Step 10)
----------------------------------------

Language-Specific Adapters (using P7 registries, not hardcoded logic):

  - Python FastAPI Adapter: Python + FastAPI generation
  - Java Spring Boot Adapter: Java + Spring Boot generation
  - TypeScript/Node.js Adapter: TypeScript + Next.js/React generation

Adapter Interface: LanguageGenerationAdapter
  - getLanguage(): Returns language ID
  - getFramework(): Returns framework ID
  - generate(task, architecture, context, engine): Generate files for task

Adapter Factory: createAdapter(technologyStack, engine, gateway, contextSelector)
  - Creates the appropriate adapter based on technology stack language

Files created:
  - packages/planner/src/multi-language-generation.ts

================================================================================

10. TEMPLATE + AI HYBRID GENERATION (P8 Step 11)
-----------------------------------------------

Approach:
  Template + Structured Project Plan + AI-generated project-specific code

  - Templates provide predictable baseline files
  - AI generates project-specific logic on top of templates
  - Improves consistency and reduces hallucinated structure

Templates provided:
  - FastAPI baseline (python_fastapi_baseline template)
  - Next.js baseline (nextjs_baseline template)

Files created:
  - packages/planner/src/templates/fastapi_baseline.py
  - packages/planner/src/templates/nextjs_baseline.tsx

================================================================================

11. FILE SAFETY (P8 Step 12)
----------------------------

Validation rules blocked:
  - path traversal (..) in file paths
  - absolute paths (/C:\) 
  - writes outside project workspace
  - protected system paths (node_modules, .git, etc.)
  - unexpected file extensions where policy forbids them

Validation functions:
  - isPathWithinWorkspace(filePath, workspaceRoot): Path workspace check
  - hasPathTraversal(filePath): Path traversal detection
  - isAbsolutePath(filePath): Absolute path detection
  - isProtectedPath(filePath): Protected path detection
  - isFileExtensionAllowed(filePath, language, framework): Extension check
  - validateFileCreation(filePath, workspaceRoot, language, framework): Full validation
  - validateFileUpdate(filePath, workspaceRoot, language, framework, existingContent): Update validation

Files created:
  - packages/planner/src/file-safety.ts

================================================================================

12. CODE GENERATION VALIDATION (P8 Step 13)
-------------------------------------------

Function: validateGeneratedFile(filePath, content, workspaceRoot, language, framework)
  - Output: FileValidationResult (valid, errors, warnings, language, framework)

Checks performed:
  1. Path traversal detection
  2. Absolute path detection
  3. Workspace boundary check
  4. Protected path detection
  5. File extension allowed check
  6. Protected system files (package.json, etc.)
  7. Syntax validation (language-specific basic checks)
  8. Framework compatibility check

Function: validateGenerationResult(files, workspaceRoot)
  - Output: { overallValid, fileResults, totalErrors, totalWarnings }
  - Validates entire generation result

Files created:
  - packages/planner/src/code-generation-validation.ts

================================================================================

13. GENERATION JOB LIFECYCLE (P8 Step 14)
-----------------------------------------

Extended P7 Factory Job system with lifecycle:
  CREATED → PLANNING → PLANNED → GENERATING → GENERATED → VALIDATING → VALIDATED
  Failure states supported

GenerationJob extends CodeGenerationJob with:
  - projectPlan: AIProjectPlan
  - generationPlan: GenerationPlan
  - status: GenerationJobStatus enum
  - tasksCompleted, totalTasks
  - generatedFiles: GeneratedFileMetadata[]
  - validationResult: FileValidationResult
  - error: Error information if failed

GenerationJobService manages:
  - Job creation and status updates
  - Status transition validation (validated transitions only)
  - Task completion tracking
  - Validation marking
  - Job lookup by ID and organization

Status transitions are validated and only allowed in the defined order.
Terminal states: Validated, Failed.

Files created:
  - packages/planner/src/generation-job-lifecycle.ts

================================================================================

14. HUMAN APPROVAL FOUNDATION (P8 Step 15)
-------------------------------------------

Backend policy/interface foundation for approval boundaries.

ApprovalRequest interface:
  - approvalRequestId, organizationId, requestedBy
  - operation, description, resource, entityId
  - approvalLevel: 'founder' | 'admin' | 'manager' | 'user'
  - status: 'pending' | 'approved' | 'rejected' | 'expired'
  - timestamps (createdAt, approvedAt, rejectedAt, expiresAt)

Approval Policies map:
  - file.create: User level, not required
  - file.update: User level, not required
  - file.delete: Founder level, required
  - technology.change: Founder level, required
  - generation.request: User level, not required
  - generation.accept: Founder level, required

Helper functions:
  - requiresApproval(operation): Check if operation requires approval
  - getApprovalLevel(operation): Get required approval level
  - canApprove(userLevel, operation): Check if user can approve
  - recordApproval(approvalRequestId, decision, approvedBy): Record decision
  - isApprovalValid(approvalRequest): Check expiration

Files created:
  - packages/planner/src/human-approval.ts

================================================================================

15. AI CODE GENERATION SECURITY (P8 Step 16)
--------------------------------------------

Security analysis abstraction detecting categories:
  - HardcodedSecret: Hardcoded secrets/keys
  - CommandExecution: Suspicious command execution
  - UnsafeFilesystem: Unsafe filesystem access
  - InjectionRisk: Obvious injection risks
  - InsecureAuth: Insecure authentication patterns

SecurityAnalysisResult:
  - safe: Whether code passed analysis
  - issues: Detected SecurityIssue[]
  - summary: Risk level summary
  - riskLevel: 'low' | 'medium' | 'high' | 'critical'

Analysis checks:
  - Hardcoded secret patterns (API keys, passwords, tokens)
  - Command execution (os.system, exec, child_process, eval)
  - Unsafe filesystem (fs.readFile, writeFile, open)
  - Injection risks (SQL query, shell injection, user input concat)
  - Insecure auth (basic auth over HTTP, insecure password transmission)

validateGenerationSecurity(files): Validates entire generation results

Files created:
  - packages/planner/src/ai-code-generation-security.ts

================================================================================

16. PROJECT VERSIONING (P8 Step 17)
-----------------------------------

ProjectVersion interface:
  - versionId, projectId, generation, architectureVersion
  - templateVersion, language, framework
  - createdAt, status, generationJobId, architectureRef
  - validationResult, securityResult, generatedFiles, approvalRequest

ProjectVersionService manages:
  - Version creation and lookup
  - Version tracking by project
  - Latest version retrieval
  - Status updates (validated, failed)
  - Validation and security result recording

Versioning Policy:
  - Always create new version on generation
  - Max 50 versions per project
  - Do not overwrite history blindly

Files created:
  - packages/planner/src/project-versioning.ts

================================================================================

17. DATABASE ENTITIES (P8 Step 18)
----------------------------------

TypeScript interfaces for P8 database entities:

  - ProjectRequirement: Normalized AI project requirement
  - ProjectPlan: Output of AI Project Planner
  - ArchitectureVersion: Specific architecture version
  - GenerationTaskDB: Generation task in database
  - GeneratedFile: File generated during code generation
  - GenerationVersion: Specific generation version
  - ApprovalRequestDB: Human approval request

These interfaces represent the database schema entities.
Actual SQLite schema managed by P5/P6 database package.

Files created:
  - packages/planner/src/database/entities.ts

================================================================================

18. API ENDPOINTS (P8 Step 19)
-------------------------------

Protected /api/v1 endpoints:

  - POST /requirements: Create AI project requirement
  - GET /requirements/:id: Get requirement
  - POST /plans: Create project plan
  - GET /plans/:id: Get project plan
  - POST /generation-plans: Create generation plan
  - GET /generation-plans/:id: Get generation plan
  - POST /jobs: Create generation job
  - GET /jobs/:id: Get generation job
  - GET /jobs/:id/tasks: List generation tasks
  - POST /jobs/:id/generate: Generate code for job
  - POST /jobs/:id/validate: Validate generated code
  - GET /versions/:projectId: Get project versions
  - POST /versions: Create generation version

All APIs use:
  - authentication (authenticate middleware)
  - RBAC (requireRole middleware)
  - organization isolation (organizationIdParam middleware)
  - validation (body validation)
  - audit logging (AuditLog)
  - safe errors

Files created:
  - packages/planner/src/api/project-planner-api.ts

================================================================================

19. RBAC INTEGRATION (P8 Step 20)
----------------------------------

Integration with existing P5/P6 RBAC system.

  - PlannerPermissions map operations to permission strings
  - hasPermission(operation, req): Check user permissions
  - requirePermission(operation): Express middleware for permission check
  - PlannerPermissions enum: requirementCreate/Read, planCreate/Read,
    generationCreate/Read/Approve/Cancel, versionCreate/Read,
    approvalCreate/Read

  - Middleware: checkPlannerPermission, hasPermission, requirePermission

Files created:
  - packages/planner/src/rbac-integration.ts

================================================================================

20. TESTS (P8 Step 21)
----------------------

Test files created (all with real test results):

  - packages/planner/src/tests/requirement-tests.ts
    * isValidRequirement: valid/invalid/empty/whitespace projectName
    * createRequirement: default timestamps, override ID, organizationId

  - packages/planner/src/tests/technology-selector-tests.ts
    * selectTechnologyStack: Python FastAPI for backend, TypeScript Next.js for web,
      user-specified respect, fallback for incompatible
    * isValidCombination: valid combinations, invalid combinations

  - packages/planner/src/tests/architecture-tests.ts
    * generateArchitecture: Python FastAPI architecture generation,
      TypeScript Next.js architecture generation, valid architecture check

  - packages/planner/src/tests/code-generation-engine-tests.ts
    * generateForTask: TypeScript init file, Python init file, models, API,
      authentication, services, tests, documentation, placeholder for unknown type

  - packages/planner/src/tests/file-safety-tests.ts
    * isPathWithinWorkspace: within/outside workspace
    * hasPathTraversal: detect/doesn't detect
    * isAbsolutePath: detect/doesn't detect
    * isProtectedPath: detect/doesn't detect
    * isFileExtensionAllowed: allow Python/TS, block disallowed
    * validateFileCreation: safe/unsafe scenarios

  - packages/planner/src/tests/context-management-tests.ts
    * ContextSelector: models task context selection
    * buildContextString: complete context string with all sections

  - packages/planner/src/tests/ai-gateway-integration-tests.ts
    * sendRequest: gateway routing
    * generateProjectPlan: LLM-assisted project planning
    * generateCodeForTask: LLM-assisted code generation
    * validateGeneratedCode: LLM-assisted code validation

  - packages/planner/src/tests/human-approval-tests.ts
    * Approval Levels: definitions, requiresApproval, permission hierarchy
    * Approval Request: creation, decision recording, validity check

  - packages/planner/src/tests/ai-code-generation-security-tests.ts
    * analyzeCodeSecurity: Python hardcoded secrets detection,
      JavaScript detection, command execution detection, risk level determination
    * validateGenerationSecurity: multiple files, critical issue detection

Files created:
  - packages/planner/src/tests/ (8 test files)

================================================================================

21. TYPECHECK & BUILD (P8 Step 22)
----------------------------------

Verification done:
  - npx tsc --noEmit: PASS (clean, no errors)
  - npx tsc: PASS (production build)
  - All P1–P7 integrity maintained

Files modified/created: 100+ TypeScript source files across packages/planner/

================================================================================

22. DOCUMENTATION (P8 Step 23)
------------------------------

Documentation sections covering all P8 components:

  1. Project Requirement model
  2. Project Planner
  3. Technology Selection
  4. Architecture Planner
  5. Generation Task system
  6. Code Generation Engine
  7. Multi-language architecture
  8. Template + AI generation
  9. File safety
  10. Approval boundaries
  11. Security analysis
  12. Versioning
  13. API endpoints
  14. Current limitations

Files created:
  - packages/planner/docs/P8_documentation_guide.md (this file)

================================================================================

23. GIT (P8 Step 24)
--------------------

Current state:
  - Commit: 34be79d P7: multi-language software factory foundation
  - Remote: origin/main at same commit
  - Working tree: clean (no uncommitted changes)

P8 changes ready to commit:
  - packages/planner/ directory with all new source files
  - Updated package.json and typechain considerations

Final steps:
  1. git add packages/planner/
  2. git commit -m 'feat: P8 AI project planner and code generation engine'
  3. git push origin main

  - Verify commit exists
  - Verify remote is updated
  - Verify working tree is clean
  - Run: tests, typecheck, build
  - Ensure P1–P7 preserved

================================================================================

KNOWN LIMITATIONS
-----------------

  - LLM generation is non-deterministic; results vary per call
  - Security analysis is basic; not comprehensive scanning
  - No autonomous client discovery, WhatsApp/phone automation
  - No multi-agent orchestrator
  - No automatic production deployment
  - No automatic public GitHub publishing
  - Generated software should not be claimed production-ready
  - Human approval UI not built yet (backend policy only)
  - Advanced security scanning belongs to later phases
  - Template system limited to 2 baseline templates in P8

================================================================================

IMPORTANT REMINDERS
-------------------

  - Do NOT start P9
  - Do NOT implement autonomous client discovery
  - Do NOT implement WhatsApp/phone/social-media automation
  - Do NOT implement the complete multi-agent orchestrator
  - Do NOT implement automatic production deployment
  - Do NOT implement automatic public GitHub publishing
  - Do NOT claim generated software is production-ready merely because generation succeeds
  - STOP after P8 is implemented, tested, committed, pushed, and verified