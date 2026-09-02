import express, { Request, Response, NextFunction } from 'express'
import { SQLiteDatabase, createDatabase, DatabaseEngine } from '@maurya/database'
import type { SQLiteDatabase as SQLiteDatabaseType } from '@maurya/database'

// Declare module augmentation to add user property to Request
declare module 'express' {
  interface Request {
    user?: { id: string; role: string }
  }
}

const app = express()

// Database instance
const createDb = createDatabase({ filename: process.env.DATABASE_URL || './mairya-ai.db', engine: DatabaseEngine.SQLITE })
const db = createDb as any

// Session store
const sessions = new Map<string, { userId: string; role: string; iat: number; exp: number }>()

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

// ============================================================
// Organization Routes
// ============================================================

// List organizations (Founder only)
app.get('/api/v1/organizations', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page as string) : 1
  const limit = req.query.limit ? Number(req.query.limit as string) : 20
  const orgs = db.listOrganizations({ page, limit })
  res.json({ success: true, data: orgs })
})

// Get organization (Founder only)
app.get('/api/v1/organizations/:id', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  const org = db.getOrganization(req.params.id as string)
  if (!org) {
    res.status(404).json({ success: false, error: 'organization not found' })
    return
  }
  res.json({ success: true, data: org })
})

// Create organization (Founder only)
app.post('/api/v1/organizations', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  const org = db.createOrganization({ name: req.body.name, status: req.body.status as string || 'active' })
  res.status(201).json({ success: true, data: org })
})

// Update organization (Founder only)
app.patch('/api/v1/organizations/:id', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  const org = db.updateOrganization(req.params.id as string, { name: req.body.name as string, status: req.body.status as string })
  res.json({ success: true, data: org })
})

// Client routes (Founder only)
app.get('/api/v1/clients', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page as string) : 1
  const limit = req.query.limit ? Number(req.query.limit as string) : 20
  // Resolve founder's organizationId from user record for organization scoping
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  // List clients scoped to founder's organization; never trust client-supplied organizationId
  const clients = db.listClients({ page, limit }, orgId)
  res.json({ success: true, data: clients })
})

// Create client (Founder only)
app.post('/api/v1/clients', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  // Resolve founder's organizationId from user record - never trust orgId from req.body
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  const clientData = {
    organizationId: orgId!,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    company: req.body.company,
    status: req.body.status as string || 'active'
  }
  const client = db.createClient(clientData)
  res.status(201).json({ success: true, data: client })
})

// Update client (Founder only)
app.patch('/api/v1/clients/:id', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  // Resolve founder's organizationId for access control - never trust orgId from req.body
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  const client = db.updateClient(req.params.id as string, {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    company: req.body.company,
    status: req.body.status as string
  })
  if (!client) {
    res.status(404).json({ success: false, error: 'client not found' })
    return
  }
  // Organization scoping: ensure client belongs to founder's organization
  if (client.organizationId !== orgId) {
    res.status(403).json({ success: false, error: 'client does not belong to your organization' })
    return
  }
  res.json({ success: true, data: client })
})

// Archive client (Founder only)
app.delete('/api/v1/clients/:id', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  // Resolve founder's organizationId for access control - never trust orgId from req.body
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  const client = db.archiveClient(req.params.id as string)
  if (!client) {
    res.status(404).json({ success: false, error: 'client not found' })
    return
  }
  // Organization scoping: ensure client belongs to founder's organization
  if (client.organizationId !== orgId) {
    res.status(403).json({ success: false, error: 'client does not belong to your organization' })
    return
  }
  res.json({ success: true, data: client })
})

// Lead routes (Founder only)
app.get('/api/v1/leads', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page as string) : 1
  const limit = req.query.limit ? Number(req.query.limit as string) : 20
  // Resolve founder's organizationId from user record for organization scoping
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  // List leads scoped to founder's organization; never trust lead-supplied organizationId
  const leads = db.listLeads({ page, limit }, orgId)
  res.json({ success: true, data: leads })
})

// Create lead (Founder only)
app.post('/api/v1/leads', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  // Resolve founder's organizationId from user record - never trust orgId from req.body
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  const leadData = {
    organizationId: orgId!,
    name: req.body.name,
    company: req.body.company,
    email: req.body.email,
    phone: req.body.phone,
    website: req.body.website,
    source: req.body.source,
    sourceUrl: req.body.sourceUrl,
    status: req.body.status as string || 'pending',
    score: req.body.score as number
  }
  const lead = db.createLead(leadData)
  res.status(201).json({ success: true, data: lead })
})

// Update lead (Founder only)
app.patch('/api/v1/leads/:id', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  // Resolve founder's organizationId for access control - never trust orgId from req.body
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  const lead = db.updateLead(req.params.id as string, {
    name: req.body.name,
    company: req.body.company,
    email: req.body.email,
    phone: req.body.phone,
    website: req.body.website,
    source: req.body.source,
    sourceUrl: req.body.sourceUrl,
    status: req.body.status as string,
    score: req.body.score as number
  })
  if (!lead) {
    res.status(404).json({ success: false, error: 'lead not found' })
    return
  }
  // Organization scoping: ensure lead belongs to founder's organization
  if (lead.organizationId !== orgId) {
    res.status(403).json({ success: false, error: 'lead does not belong to your organization' })
    return
  }
  res.json({ success: true, data: lead })
})

// Archive lead (Founder only)
app.delete('/api/v1/leads/:id', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  // Resolve founder's organizationId for access control - never trust orgId from req.body
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  const lead = db.archiveLead(req.params.id as string)
  if (!lead) {
    res.status(404).json({ success: false, error: 'lead not found' })
    return
  }
  // Organization scoping: ensure lead belongs to founder's organization
  if (lead.organizationId !== orgId) {
    res.status(403).json({ success: false, error: 'lead does not belong to your organization' })
    return
  }
res.json({ success: true, data: lead })
})

// Project routes (Founder only)
app.get('/api/v1/projects', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page as string) : 1
  const limit = req.query.limit ? Number(req.query.limit as string) : 20
  // Resolve founder's organizationId from user record for organization scoping
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  // List projects scoped to founder's organization; never trust project-supplied organizationId
  const projects = db.listProjects({ page, limit }, orgId)
  res.json({ success: true, data: projects })
})

// Create project (Founder only)
app.post('/api/v1/projects', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  // Resolve founder's organizationId from user record - never trust orgId from req.body
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  const projectData: { organizationId: string; clientId?: string; founderId: string; name: string; description?: string; status: string; complexity?: number } = {
    organizationId: orgId!,
    founderId: req.user!.id as string,
    name: req.body.name,
    description: req.body.description,
    status: req.body.status as string || 'pending'
  }
  if (req.body.clientId) {
    projectData.clientId = req.body.clientId as string
  }
  if (req.body.complexity !== undefined) {
    projectData.complexity = req.body.complexity as number
  }
  const project = db.createProject(projectData)
  res.status(201).json({ success: true, data: project })
})

// Update project (Founder only)
app.patch('/api/v1/projects/:id', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  // Resolve founder's organizationId for access control - never trust orgId from req.body
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  const project = db.updateProject(req.params.id as string, {
    name: req.body.name,
    description: req.body.description,
    status: req.body.status as string,
    complexity: req.body.complexity as number
  })
  if (!project) {
    res.status(404).json({ success: false, error: 'project not found' })
    return
  }
  // Organization scoping: ensure project belongs to founder's organization
  if (project.organizationId !== orgId) {
    res.status(403).json({ success: false, error: 'project does not belong to your organization' })
    return
  }
  res.json({ success: true, data: project })
})

// Archive project (Founder only)
app.delete('/api/v1/projects/:id', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  // Resolve founder's organizationId for access control - never trust orgId from req.body
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  const project = db.archiveProject(req.params.id as string)
  if (!project) {
    res.status(404).json({ success: false, error: 'project not found' })
    return
  }
  // Organization scoping: ensure project belongs to founder's organization
  if (project.organizationId !== orgId) {
    res.status(403).json({ success: false, error: 'project does not belong to your organization' })
    return
  }
  res.json({ success: true, data: project })
})

// Task routes (Founder only)
app.get('/api/v1/tasks', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page as string) : 1
  const limit = req.query.limit ? Number(req.query.limit as string) : 20
  // Resolve founder's organizationId from user record for organization scoping
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  // List tasks; founder can filter by projectId via query param
  const projectId = req.query.projectId as string || undefined
  const tasks = db.listTasks({ page, limit }, projectId)
  res.json({ success: true, data: tasks })
})

// Create task (Founder only)
app.post('/api/v1/tasks', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  // Resolve organization from founder's project chain
  const founderUser = db.getUser(req.user!.id as string)
  const orgId = founderUser?.organizationId
  // Find the founder's project to determine organization
  const projects = db.listProjects({ page: 1, limit: 1000 }, orgId)
  const founderProject = projects.data.find((p: any) => p.founderId === req.user!.id)
  const taskProjectId = founderProject?.id || undefined

  const taskData = {
    projectId: taskProjectId,
    title: req.body.title,
    description: req.body.description,
    status: req.body.status as string || 'pending',
    priority: req.body.priority as number
  }
  const task = db.createTask(taskData)
  res.status(201).json({ success: true, data: task })
})

// Update task (Founder only)
app.patch('/api/v1/tasks/:id', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  const task = db.updateTask(req.params.id as string, {
    title: req.body.title,
    description: req.body.description,
    status: req.body.status as string,
    priority: req.body.priority as number
  })
  if (!task) {
    res.status(404).json({ success: false, error: 'task not found' })
    return
  }
  res.json({ success: true, data: task })
})

// Archive task (Founder only)
app.delete('/api/v1/tasks/:id', authenticate, requireRole('founder'), (req: Request, res: Response) => {
  const task = db.archiveTask(req.params.id as string)
  if (!task) {
    res.status(404).json({ success: false, error: 'task not found' })
    return
  }
  res.json({ success: true, data: task })
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Maurya AI API v1 listening on port ${PORT}`)
})

export { app }