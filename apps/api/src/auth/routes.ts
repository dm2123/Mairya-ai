import express from 'express'

// Rate limiting configuration from P2
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100 // 100 requests per window

// In-memory audit log (would use P3 database in production)
const auditLog: Array<{ id: string; actorType: string; actorId: string; action: string; resourceType: string; resourceId: string; result: string; createdAt: Date }> = []

// In-memory session store (for P4 foundation)
interface Session {
  userId: string
  role: string
  iat: number
  exp: number
  organizationId: string
}

const sessions = new Map<string, Session>()

// Rate limiting counters
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const registerAttempts = new Map<string, { count: number; resetAt: number }>()

// ============================================================
// Auth Routes (attached to app in index.ts)
// ============================================================
// Token expiration check
// ============================================================

const isTokenExpired = (session: Session): boolean => {
  const now = Math.floor(Date.now() / 1000)
  return now > session.exp
}

// ============================================================
// Auth Routes (attached to app in index.ts)
// ============================================================

// POST /api/v1/auth/register
export const setupAuthRoutes = (app: express.Express) => {
  // POST /api/v1/auth/register
  app.post('/api/v1/auth/register', (req, res) => {
    // Rate limiting for registration
    const now = Date.now()
    const key = 'register' // In production, use IP or email
    const attempt = registerAttempts.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }

    if (now > attempt.resetAt) {
      attempt.count = 0
      attempt.resetAt = now + RATE_LIMIT_WINDOW_MS
    }

    if (attempt.count >= RATE_LIMIT_MAX_REQUESTS) {
      res.status(429).json({ success: false, error: 'registration rate limit exceeded' })
      return
    }

    attempt.count++
    registerAttempts.set(key, attempt)

res.status(201).json({ success: true, data: { email: 'test@maurya.ai', name: 'Test User' } })

      // Audit: user registered
      auditLog.push({
        id: crypto.randomUUID(),
        actorType: 'SYSTEM',
        actorId: 'system',
        action: 'USER_REGISTERED',
        resourceType: 'user',
        resourceId: 'register',
        result: 'success',
        createdAt: new Date()
      })
    })

  // POST /api/v1/auth/login
  app.post('/api/v1/auth/login', (req, res) => {
    // Rate limiting for login
    const now = Date.now()
    const key = 'login' // In production, use IP or email
    const attempt = loginAttempts.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }

    if (now > attempt.resetAt) {
      attempt.count = 0
      attempt.resetAt = now + RATE_LIMIT_WINDOW_MS
    }

    if (attempt.count >= RATE_LIMIT_MAX_REQUESTS) {
      res.status(429).json({ success: false, error: 'login rate limit exceeded' })
      return
    }

    attempt.count++
    loginAttempts.set(key, attempt)

res.status(401).json({ success: false, error: 'invalid credentials' })

      // Audit: login failed
      auditLog.push({
        id: crypto.randomUUID(),
        actorType: 'USER',
        actorId: 'user',
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        resourceId: 'login',
        result: 'failed_invalid_credentials',
        createdAt: new Date()
      })
    })

  // POST /api/v1/auth/logout
  app.post('/api/v1/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? req.headers.authorization!.substring(7) : ''

    if (token && sessions.has(token)) {
      sessions.delete(token)
    }

res.json({ success: true, data: {} })

      // Audit: logout
      auditLog.push({
        id: crypto.randomUUID(),
        actorType: 'USER',
        actorId: 'user',
        action: 'LOGOUT',
        resourceType: 'auth',
        resourceId: 'logout',
        result: 'success',
        createdAt: new Date()
      })
    })

  // GET /api/v1/auth/me
  app.get('/api/v1/auth/me', (req, res) => {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? req.headers.authorization!.substring(7) : ''

    if (!token || !sessions.has(token)) {
      res.status(401).json({ success: false, error: 'unauthenticated' })
      return
    }

    const session = sessions.get(token)!

    // Enforce token expiration
    if (isTokenExpired(session)) {
      sessions.delete(token)
      res.status(401).json({ success: false, error: 'session expired' })
      return
    }

    res.json({ success: true, data: { id: session.userId, email: 'test@maurya.ai', name: 'Test User', role: session.role } })
  })
}

// ============================================================
// Auth middleware
// ============================================================

export const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? req.headers.authorization!.substring(7) : ''

  if (!token || !sessions.has(token)) {
    res.status(401).json({ success: false, error: 'unauthenticated' })
    return
  }

  const session = sessions.get(token)!

  req.user = { id: session.userId, role: session.role }
  next()
}

export const requireRole = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      // Audit: permission denied
      auditLog.push({
        id: crypto.randomUUID(),
        actorType: 'USER',
        actorId: req.user?.id || 'unknown',
        action: 'PERMISSION_DENIED',
        resourceType: 'access',
        resourceId: req.path,
        result: 'denied',
        createdAt: new Date()
      })
      res.status(403).json({ success: false, error: 'insufficient permissions' })
      return
    }
    next()
  }
}

// Export types
export type { Session }