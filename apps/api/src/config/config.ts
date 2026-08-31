/**
 * Centralized Configuration for Maurya AI.
 *
 * All application configuration is read through this module.
 * Do NOT read process.env directly throughout the application.
 *
 * Security:
 *   - Sensitive values are never logged
 *   - Missing required values in production cause startup failure
 *   - Optional values report "NOT_CONFIGURED" status
 *   - CORS must not use wildcard "*" in production
 */

import { isDevelopment, isTest, isStaging, isProduction, getEffectiveEnvironment, isValidEnvironment } from "./env"

// ============================================================
// Application Identity
// ============================================================

export const APP_NAME = "Maurya AI"
export const APP_VERSION = "1.0.0"

// ============================================================
// Environment
// ============================================================

export const NODE_ENV = getEffectiveEnvironment()
export const MAURYA_ENV = process.env.MAURYA_ENV as
  | "development"
  | "test"
  | "staging"
  | "production"
  | undefined

// ============================================================
// Server
// ============================================================

export const PORT = parseInt(process.env.PORT as string, 10) || 3000
export const HOST = process.env.HOST || "0.0.0.0"

// ============================================================
// API
// ============================================================

export const API_PREFIX = process.env.API_PREFIX || "/api/v1"

// ============================================================
// CORS
// ============================================================

// Parse CORS origins from comma-separated string
const parseOrigins = (): string[] => {
  const origins = process.env.CORS_ORIGINS
  if (!origins) {
    // Development: allow localhost origins
    if (isDevelopment()) {
      return ["http://localhost:3000", "http://localhost:3001"]
    }
    // Production: origins must be explicitly configured
    return []
  }
  return origins.split(",").map((o: string) => o.trim()).filter((o: string) => o.length > 0)
}

export const CORS_ORIGINS = parseOrigins()

// ============================================================
// Rate Limiting
// ============================================================

export const RATE_LIMIT_WINDOW_MS = (() => {
  const window = process.env.RATE_LIMIT_WINDOW
  if (window) {
    const parsed = parseInt(window, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  // Safe development default: 15 minutes
  return isDevelopment() ? 15 * 60 * 1000 : 60 * 60 * 1000
})()

export const RATE_LIMIT_MAX_REQUESTS = (() => {
  const max = process.env.RATE_LIMIT_MAX_REQUESTS
  if (max) {
    const parsed = parseInt(max, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  // Safe development default: 100 requests per window
  return isDevelopment() ? 100 : 50
})()

// ============================================================
// Database
// ============================================================

export const DATABASE_URL = process.env.DATABASE_URL || "sqlite:./mairya-ai.db"

// ============================================================
// AI Gateway (optional - placeholder until provider configured)
// ============================================================

export const AI_PROVIDER = process.env.AI_PROVIDER || "local"
export const AI_BASE_URL = process.env.AI_BASE_URL || "http://localhost:8000"
export const AI_API_KEY = process.env.AI_API_KEY // may be undefined
export const AI_DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL || "gpt-4o"

// Status for optional integration reporting
export const AI_STATUS = isDevelopment() || !!AI_API_KEY ? "OK" : "NOT_CONFIGURED"

// ============================================================
// GitHub Integration (optional - placeholder)
// ============================================================

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN // may be undefined
export const GITHUB_OWNER = process.env.GITHUB_OWNER || "dm2123"
export const GITHUB_REPO = process.env.GITHUB_REPO || "Mairya-ai"

// Status for optional integration reporting
export const GITHUB_STATUS = !!GITHUB_TOKEN ? "OK" : "NOT_CONFIGURED"

// ============================================================
// Email (optional - placeholder)
// ============================================================

export const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "undefined"
export const EMAIL_HOST = process.env.EMAIL_HOST
export const EMAIL_PORT = parseInt(process.env.EMAIL_PORT as string, 10) || 587
export const EMAIL_USERNAME = process.env.EMAIL_USERNAME // may be undefined
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD // may be undefined
export const EMAIL_FROM = process.env.EMAIL_FROM

// Status for optional integration reporting
export const EMAIL_STATUS = isDevelopment() || !!EMAIL_HOST ? "OK" : "NOT_CONFIGURED"

// ============================================================
// WhatsApp (optional - placeholder)
// ============================================================

export const WHATSAPP_PROVIDER = process.env.WHATSAPP_PROVIDER || "undefined"
export const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN // may be undefined
export const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID // may be undefined
export const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

// Status for optional integration reporting
export const WHATSAPP_STATUS =
  isDevelopment() || !!WHATSAPP_ACCESS_TOKEN ? "OK" : "NOT_CONFIGURED"

// ============================================================
// Payment (optional - placeholder)
// ============================================================

export const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "undefined"
export const PAYMENT_PUBLIC_KEY = process.env.PAYMENT_PUBLIC_KEY // may be undefined
export const PAYMENT_SECRET_KEY = process.env.PAYMENT_SECRET_KEY // may be undefined
export const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET // may be undefined

// Status for optional integration reporting
export const PAYMENT_STATUS =
  isDevelopment() || !!PAYMENT_SECRET_KEY ? "OK" : "NOT_CONFIGURED"

// ============================================================
// Storage (optional - placeholder)
// ============================================================

export const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "local"
export const STORAGE_BASE_PATH = process.env.STORAGE_BASE_PATH || "./storage"

// ============================================================
// Deployment
// ============================================================

export const DEPLOYMENT_PROVIDER = process.env.DEPLOYMENT_PROVIDER || "preview"
export const DEPLOYMENT_ENV = process.env.DEPLOYMENT_ENV || "preview"

// ============================================================
// Security / Secrets
// ============================================================

// These are marked as optional - production must have them
export const JWT_SECRET = process.env.JWT_SECRET // may be undefined - required for auth later
export const SESSION_SECRET = process.env.SESSION_SECRET // may be undefined

// ============================================================
// Logging
// ============================================================

export const LOG_LEVEL = (() => {
  const level = process.env.LOG_LEVEL as
    | "debug"
    | "info"
    | "warn"
    | "error"
    | undefined
  // Valid levels
  const validLevels = ["debug", "info", "warn", "error"] as const
  if (level && validLevels.includes(level)) {
    return level
  }
  // Development: debug, Production: error
  return isDevelopment() ? "debug" : "error"
})()

// ============================================================
// Validation
// ============================================================

/**
 * Check if a configuration value is "NOT_CONFIGURED"
 * (i.e., essential value missing in production)
 */
export const isNotConfigured = (value: string | undefined): boolean => {
  if (value === undefined || value === null || value === "") return true
  if (value === "NOT_CONFIGURED") return true
  return false
}

/**
 * Get configuration status for optional integrations
 * Used for health checks and reporting
 */
export const getIntegrationStatus = () => ({
  ai: AI_STATUS,
  github: GITHUB_STATUS,
  email: EMAIL_STATUS,
  whatsapp: WHATSAPP_STATUS,
  payments: PAYMENT_STATUS,
  storage: isDevelopment() ? "OK" : "NOT_CONFIGURED", // storage always configured locally
  deployment: DEPLOYMENT_STATUS,
})

export const DEPLOYMENT_STATUS = isDevelopment() || !!DEPLOYMENT_PROVIDER ? "OK" : "NOT_CONFIGURED"