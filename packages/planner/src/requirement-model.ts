/** Requirement Normalization — Normalized AI project requirement model.
 *
 * Versionable. All fields are optional except where noted.
 * Used by the Project Planner as input.
 */
export interface AIProjectRequirement {
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
  /** Target platform (web, desktop, mobile, api, etc.). */
  targetPlatform?: string
  /** Required features list. */
  requiredFeatures?: string[]
  /** Functional requirements. */
  functionalRequirements?: string
  /** Non-functional requirements (performance, security, etc.). */
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

/** Validates that a requirement has the minimum required fields. */
export function isValidRequirement(req: AIProjectRequirement): boolean {
  return (
    req.projectName !== undefined &&
    req.projectName !== null &&
    req.projectName.toString().trim().length > 0
  )
}

/** Creates a new AIProjectRequirement instance. */
export function createRequirement(
  overrides: Partial<AIProjectRequirement>
): AIProjectRequirement {
  const now = new Date()
  return {
    requirementId: overrides.requirementId,
    organizationId: overrides.organizationId,
    requestedBy: overrides.requestedBy,
    projectName: overrides.projectName,
    projectDescription: overrides.projectDescription,
    projectType: overrides.projectType,
    targetPlatform: overrides.targetPlatform,
    requiredFeatures: overrides.requiredFeatures,
    functionalRequirements: overrides.functionalRequirements,
    nonFunctionalRequirements: overrides.nonFunctionalRequirements,
    preferredLanguage: overrides.preferredLanguage,
    preferredFramework: overrides.preferredFramework,
    databaseRequirements: overrides.databaseRequirements,
    authenticationRequirements: overrides.authenticationRequirements,
    apiRequirements: overrides.apiRequirements,
    uiRequirements: overrides.uiRequirements,
    testingRequirements: overrides.testingRequirements,
    deploymentRequirements: overrides.deploymentRequirements,
    constraints: overrides.constraints,
    createdAt: now,
    updatedAt: now,
  }
}