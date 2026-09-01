import express, { Request, Response, NextFunction } from 'express'

// Declare module augmentation to add user property to Request
declare module 'express' {
  interface Request {
    user?: { id: string; role: string }
  }
}

const app = express()

// Session store
const sessions = new Map()

// ============================================================
// Auth Routes
// ============================================================

// Attach auth routes via middleware
import { setupAuthRoutes } from './auth/routes'
setupAuthRoutes(app)

// ============================================================
// Auth middleware
// ============================================================

const authenticate = (req: Request, res: Response, next: NextFunction) => {
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

const requireRole = (...roles: string[]): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'insufficient permissions' })
      return
    }
    next()
  }
}

// Protected route example
app.get('/api/v1/profile', authenticate, requireRole('client'), (req: Request, res: Response) => {
  res.json({ success: true, data: { message: 'profile accessible' } })
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Maurya AI API v1 listening on port ${PORT}`)
})

export { app }