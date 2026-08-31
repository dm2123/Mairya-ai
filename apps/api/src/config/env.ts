/**
 * Environment detection and precedence for Maurya AI.
 *
 * Precedence rule (highest to lowest):
 *  1. NODE_ENV  (overrides all)
 *  2. MAURYA_ENV (overrides default development)
 *  3. Default: "development"
 *
 * Supported values:
 *   - "development" — development mode with defaults
 *   - "test" — test mode
 *   - "staging" — staging/preview mode
 *   - "production" — production mode with strict validation
 */

export type Environment = "development" | "test" | "staging" | "production"

const env: Environment = (() => {
  // 1. NODE_ENV takes highest precedence
  const nodeEnv = process.env.NODE_ENV as Environment | undefined
  if (nodeEnv && ["development", "test", "staging", "production"].includes(nodeEnv)) {
    return nodeEnv
  }

  // 2. MAURYA_ENV as fallback
  const mauryaEnv = process.env.MAURYA_ENV as Environment | undefined
  if (mauryaEnv && ["development", "test", "staging", "production"].includes(mauryaEnv)) {
    return mauryaEnv
  }

  // 3. Default to development
  return "development"
})()

export { env }

export const isDevelopment = () => env === "development"
export const isTest = () => env === "test"
export const isStaging = () => env === "staging"
export const isProduction = () => env === "production"

/**
 * Get the effective environment, respecting both NODE_ENV and MAURYA_ENV.
 * This is the primary function consumers should use.
 */
export const getEffectiveEnvironment = (): Environment => env

/**
 * Check if an environment value is valid.
 */
export const isValidEnvironment = (value: string): value is Environment => {
  return ["development", "test", "staging", "production"].includes(value)
}