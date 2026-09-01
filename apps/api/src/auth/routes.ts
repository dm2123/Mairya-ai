import express from 'express'

// In-memory session store (for P4 foundation)
interface Session {
  userId: string
  role: string
  iat: number
  exp: number
}

const sessions = new Map<string, Session>()

// ============================================================
// Auth Routes (attached to app in index.ts)
// ============================================================

// POST /api/v1/auth/register
export const setupAuthRoutes = (app: express.Express) => {
  // POST /api/v1/auth/register
  app.post('/api/v1/auth/register', (req, res) => {
    res.status(201).json({ success: true, data: { email: 'test@maurya.ai', name: 'Test User' } })
  })

  // POST /api/v1/auth/login
  app.post('/api/v1/auth/login', (req, res) => {
    res.status(401).json({ success: false, error: 'invalid credentials' })
  })

  // POST /api/v1/auth/logout
  app.post('/api/v1/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? req.headers.authorization!.substring(7) : ''

    if (token && sessions.has(token)) {
      sessions.delete(token)
    }

    res.json({ success: true, data: {} })
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
      res.status(403).json({ success: false, error: 'insufficient permissions' })
      return
    }
    next()
  }
}

// Export types
export type { Session }