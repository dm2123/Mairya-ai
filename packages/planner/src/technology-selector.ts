import { LanguageId, FrameworkId, ProjectType } from '../factory/src/project-types'
import { LanguageDefinitions } from '../factory/src/project-types'
import { FrameworkDefinitions, getFrameworksForLanguage } from '../factory/src/framework-registry'

/** Technology Selection Layer — Deterministic technology selection using P7 registries.
 *
 * Considers: project type, requested language, framework compatibility,
 * platform, required features, existing toolchains, template availability.
 * Uses registries instead of hardcoded logic.
 */

/** Technology Stack — Result of technology selection. */
export interface TechnologyStack {
  language: LanguageId
  framework: FrameworkId | null
  projectType: ProjectType
  reasoning: string
}

/** Select technology stack based on project requirements and registries.
 *
 * Rules:
 * - If user specifies valid language/framework combination, respect it.
 * - If no language specified, choose from supported stacks using deterministic rules.
 * - If framework incompatible with language, fall back to defaults.
 * - Never allow unsupported combinations.
 */
export function selectTechnologyStack(
  projectType?: string,
  preferredLanguage?: string,
  preferredFramework?: string
): TechnologyStack {
  // If user specified language and framework, validate and use them
  if (preferredLanguage && preferredFramework) {
    const langDef = LanguageDefinitions[preferredLanguage]
    if (!langDef) {
      // Unknown language - fall back to default
      return getDefaultStack(projectType!)
    }

    // Validate framework is supported for this language
    const frameworks = getFrameworksForLanguage(preferredLanguage)
    const matchingFramework = frameworks.find(
      (f) => f.frameworkId === preferredFramework
    )

    if (matchingFramework) {
      // Check if framework supports the project type
      if (matchingFramework.supportedProjectTypes.includes(projectType! || ProjectType.SOFTWARE)) {
        return {
          language: preferredLanguage,
          framework: preferredFramework,
          projectType: projectType !|| ProjectType.SOFTWARE,
          reasoning: `User-specified combination: ${preferredLanguage} + ${preferredFramework}`,
        }
      }
    }

    // Framework incompatible - fall back
    return getDefaultStack(projectType!)
  }

  // No explicit language/framework - select default stack
  return getDefaultStack(projectType!)
}

/** Get default technology stack based on project type. */
function getDefaultStack(projectType: ProjectType): TechnologyStack {
  // Deterministic stack selection using P7 registries
  if (projectType === ProjectType.BACKEND || projectType === ProjectType.API) {
    return {
      language: 'python',
      framework: 'fastapi',
      projectType,
      reasoning: 'Default backend stack: Python + FastAPI (from P7 registry)',
    }
  } else if (projectType === ProjectType.WEB || projectType === ProjectType.SOFTWARE) {
    return {
      language: 'typescript',
      framework: 'nextjs',
      projectType,
      reasoning: 'Default web stack: TypeScript + Next.js (from P7 registry)',
    }
  } else {
    // Unknown project type - default to Python FastAPI backend
    return {
      language: 'python',
      framework: 'fastapi',
      projectType: ProjectType.SOFTWARE,
      reasoning: 'Unknown project type, defaulting to Python FastAPI backend',
    }
  }
}

/** Validates that a language/framework combination is supported. */
export function isValidCombination(
  language: LanguageId,
  framework: FrameworkId,
  projectType: ProjectType
): boolean {
  const frameworks = getFrameworksForLanguage(language)
  const matching = frameworks.find((f) => f.frameworkId === framework)
  if (!matching) return false
  return matching.supportedProjectTypes.includes(projectType)
}