import express, { Express, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import type { RateLimitConfig } from './shared/rate-limit'
import type { ApiResponse, ApiError } from './shared/api-response'
import type { 
  RoleEnum, StatusEnum, ProjectState, AgentState, DeploymentState 
} from './shared/enums'
import type { AuthUser, SessionData } from './shared/auth-types'

import { 
  isDevelopment, isTest, isStaging, isProduction,
  NODE_ENV, PORT, HOST, API_PREFIX,
  CORS_ORIGINS, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS,
  DATABASE_URL, AI_PROVIDER, AI_BASE_URL, AI_API_KEY, AI_DEFAULT_MODEL, AI_STATUS,
  GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_STATUS,
  EMAIL_PROVIDER, EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_FROM, EMAIL_STATUS,
  WHATSAPP_PROVIDER, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN, WHATSAPP_STATUS,
  PAYMENT_PROVIDER, PAYMENT_PUBLIC_KEY, PAYMENT_SECRET_KEY, PAYMENT_WEBHOOK_SECRET, PAYMENT_STATUS,
  STORAGE_PROVIDER, STORAGE_BASE_PATH,
  DEPLOYMENT_PROVIDER, DEPLOYMENT_ENV,
  JWT_SECRET, SESSION_SECRET,
  LOG_LEVEL,
  getIntegrationStatus
} from './config'

const app: Express = express()
const PORT_VALUE = PORT
const HOST_VALUE = HOST
const API_PREFIX_VALUE = API_PREFIX

// Middleware
app.use(helmet())
app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10kb' }))

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    }
  })
})

// API v1 route prefix
const apiPrefix = API_PREFIX_VALUE || '/api/v1'

// Basic auth status route
app.get(`${apiPrefix}/status`, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      apiVersion: 'v1',
      status: 'operational',
      timestamp: new Date().toISOString()
    }
  })
})

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    meta: {}
  })
})

// Start server when run directly
let server: any
if (require.main === module) {
  app.listen(PORT_VALUE, () => {
    console.log(`🚀 Maurya AI API v1 listening on port ${PORT_VALUE}`)
    console.log(`📍 Health: http://localhost:${PORT_VALUE}/health`)
    console.log(`📍 API: http://localhost:${PORT_VALUE}${API_PREFIX_VALUE}/status`)
    const status = getIntegrationStatus()
    console.log(`📊 Integration status: ${JSON.stringify(status)}`)
  })
}

export { app }