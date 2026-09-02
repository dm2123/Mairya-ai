/** Database entities for P8 AI Project Planner and Code Generation Engine.
 *
 * Uses organization isolation. Does not duplicate P7 tables.
 *
 * Possible entities:
 * - project_requirements
 * - project_plans
 * - architecture_versions
 * - generation_tasks
 * - generated_files
 * - generation_versions
 * - approval_requests
 */

// These are TypeScript interfaces representing the database entities.
// The actual SQLite schema would be managed by the P5/P6 database package.

/** Project Requirement — Normalized AI project requirement. */
export interface ProjectRequirement {
  /** Unique requirement ID. */
  requirementId?: string
  /** Organization ID (for isolation). */
  organizationId?: string
  /** User who submitted the requirement. */
  requestedBy?: string
  /** Human-readable project name. */
  projectName?: string
  /** Human-readable project description. */
  projectDescription?: string
  /** Project type classification. */
  projectType?: string
  /** Target platform. */
  targetPlatform?: string
  /** Required features list. */
  requiredFeatures?: string[]
  /** Functional requirements. */
  functionalRequirements?: string
  /** Non-functional requirements. */
  nonFunctionalRequirements?: string
  /** Preferred programming language. */
  preferredLanguage?: string
  /** Preferred framework. */
  preferredFramework?: string
  /** Database requirements. */
  databaseRequirements?: string
  /** Authentication requirements. */
  authenticationRequirements?: string
  /** API requirements. */
  apiRequirements?: string
  /** UI requirements. */
  uiRequirements?: string
  /** Testing requirements. */
  testingRequirements?: string
  /** Deployment requirements. */
  deploymentRequirements?: string
  /** Constraints (budget, timeline, regulatory, etc.). */
  constraints?: string
  /** Timestamps. */
  createdAt?: Date
  updatedAt?: Date
}

/** Project Plan — Output of the AI Project Planner. */
export interface ProjectPlan {
  /** Unique plan ID. */
  planId?: string
  /** Associated requirement ID. */
  requirementId?: string
  /** Organization ID. */
  organizationId?: string
  /** Requested by user. */
  requestedBy?: string
  /** Selected language. */
  selectedLanguage?: string
  /** Selected framework. */
  selectedFramework?: string
  /** Project type. */
  projectType?: string
  /** Target platform. */
  targetPlatform?: string
  /** Architecture description. */
  architecture?: string
  /** Data models. */
  dataModels?: string
  /** API specification. */
  apiSpecification?: string
  /** Authentication configuration. */
  authentication?: string
  /** Authorization configuration. */
  authorization?: string
  /** Testing strategy. */
  testingStrategy?: string
  /** Build strategy. */
  buildStrategy?: string
  /** Deployment target. */
  deploymentTarget?: string
  /** Generation tasks. */
  generationTasks?: any[]
  /** Metadata. */
  metadata?: Record<string, unknown>
  /** Timestamps. */
  createdAt?: Date
  updatedAt?: Date
}

/** Architecture Version — A specific architecture version. */
export interface ArchitectureVersion {
  /** Unique version ID. */
  versionId?: string
  /** Project ID. */
  projectId?: string
  /** Architecture output reference. */
  architectureId?: string
  /** Technology stack. */
  technologyStack?: {
    language: string
    framework: string | null
    projectType: string
  }
  /** Architecture description. */
  architecture?: string
  /** Generated at timestamp. */
  generatedAt?: Date
  /** Generated files. */
  generatedFiles?: string[]
  /** Validation status. */
  validated?: boolean
  /** Security analysis result. */
  securityResult?: {
    safe: boolean
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  }
}

/** Generation Task — A single task in the generation plan. */
export interface GenerationTaskDB {
  /** Unique task ID. */
  taskId?: string
  /** Project ID. */
  projectId?: string
  /** Task type. */
  taskType?: string
  /** Description. */
  description?: string
  /** Dependencies (task IDs). */
  dependencies?: string[]
  /** Target files. */
  targetFiles?: string[]
  /** Language. */
  language?: string
  /** Framework. */
  framework?: string | null
  /** Status. */
  status?: 'pending' | 'planning' | 'generating' | 'generated' | 'validated' | 'failed'
  /** Retry count. */
  retryCount?: number
  /** Max retries. */
  maxRetries?: number
  /** Created at. */
  createdAt?: Date
  /** Completed at. */
  completedAt?: Date
}

/** Generated File — A file generated during code generation. */
export interface GeneratedFile {
  /** Unique file ID. */
  fileId?: string
  /** Project ID. */
  projectId?: string
  /** Generation version ID. */
  generationVersionId?: string
  /** File path. */
  filePath?: string
  /** Operation (create, update). */
  operation?: 'create' | 'update' | 'delete'
  /** Generated content. */
  content?: string
  /** Language. */
  language?: string
  /** Framework. */
  framework?: string | null
  /** Generated at timestamp. */
  generatedAt?: Date
  /** Validation status. */
  validated?: boolean
  /** Validation result. */
  validationResult?: FileValidationResult
  /** Security analysis result. */
  securityResult?: SecurityAnalysisResult
}

/** Generation Version — A specific generation version. */
export interface GenerationVersion {
  /** Unique version ID. */
  versionId?: string
  /** Project ID. */
  projectId?: string
  /** Generation job ID. */
  generationJobId?: string
  /** Version number. */
  version: number
  /** Status. */
  status: 'pending' | 'generating' | 'generated' | 'validated' | 'failed'
  /** Created at timestamp. */
  createdAt?: Date
  /** Completed at timestamp. */
  completedAt?: Date
  /** Architecture reference. */
  architectureRef?: string
  /** Files generated. */
  generatedFiles?: string[]
  /** Validation result. */
  validationResult?: FileValidationResult
  /** Security analysis result. */
  securityResult?: SecurityAnalysisResult
}

/** Approval Request — A request for human approval. */
export interface ApprovalRequestDB {
  /** Unique approval request ID. */
  approvalRequestId?: string
  /** Organization ID. */
  organizationId?: string
  /** User who requested the operation. */
  requestedBy?: string
  /** The operation being requested for approval. */
  operation?: string
  /** Description of the operation. */
  description?: string
  /** Related resource (file path, job ID, etc.). */
  resource?: string
  /** Related entity ID (job ID, project ID, etc.). */
  entityId?: string
  /** Required approval level. */
  approvalLevel?: 'founder' | 'admin' | 'manager' | 'user'
  /** Status of the approval request. */
  status?: 'pending' | 'approved' | 'rejected' | 'expired'
  /** Created at timestamp. */
  createdAt?: Date
  /** Approved at timestamp. */
  approvedAt?: Date
  /** Rejected at timestamp. */
  rejectedAt?: Date
  /** Approver user ID (if approved). */
  approvedBy?: string
  /** Rejection reason (if rejected). */
  rejectionReason?: string
  /** Expiration timestamp. */
  expiresAt?: Date
}