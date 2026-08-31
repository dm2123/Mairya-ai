import 'reflect-metadata'
import express, { Express, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { RateLimitConfig, RateLimit } from '../packages/shared/src/rate-limit'
import { ApiResponse, ApiError } from '../packages/shared/src/api-response'
import { RoleEnum, StatusEnum, ProjectState, AgentState, DeploymentState } from '../packages/shared/src/enums'
import { AuthUser, SessionData } from '../packages/shared/src/auth-types'

const app: Express = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10kb' }))

// Rate limiting foundation
const rateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
}

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
const apiPrefix = '/api/v1'

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

// Start server
let server: any
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`🚀 Maurya AI API v1 listening on port ${PORT}`)
    console.log(`📍 Health: http://localhost:${PORT}/health`)
    console.log(`📍 API: http://localhost:${PORT}${apiPrefix}/status`)
  })
}

export { app }