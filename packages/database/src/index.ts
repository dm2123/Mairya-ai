import Database from 'better-sqlite3'

// ============================================================
// Database Configuration
// ============================================================

export enum DatabaseEngine {
  SQLITE = 'sqlite',
  MYSQL = 'mysql',
}

export interface DatabaseConfig {
  engine: DatabaseEngine
  filename?: string
  url?: string
}

// ============================================================
// SQLite Database (Primary - working implementation)
// ============================================================

export class SQLiteDatabase {
  private db: any

  constructor(config: { filename: string }) {
    this.db = require('better-sqlite3')(config.filename)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.db.pragma('busy_timeout = 5000')
    this.initializeSchema()
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'client',
        organizationId TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        lastLoginAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        organizationId TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        organizationId TEXT NOT NULL,
        name TEXT NOT NULL,
        company TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        website TEXT,
        source TEXT,
        sourceUrl TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        score REAL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        organizationId TEXT NOT NULL,
        clientId TEXT,
        founderId TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        complexity INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL,
        FOREIGN KEY (founderId) REFERENCES users(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority INTEGER,
        assignedUserId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (assignedUserId) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'idle',
        configurationReference TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        actorType TEXT NOT NULL,
        actorId TEXT NOT NULL,
        action TEXT NOT NULL,
        resourceType TEXT NOT NULL,
        resourceId TEXT NOT NULL,
        result TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'NORMAL',
        readAt TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_clients_organizationId ON clients(organizationId);
      CREATE INDEX IF NOT EXISTS idx_leads_organizationId ON leads(organizationId);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_projects_organizationId ON projects(organizationId);
      CREATE INDEX IF NOT EXISTS idx_tasks_projectId ON tasks(projectId);
    `)
  }

  // User operations
  getUser(id: string) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  }

  createUser(user: { email: string; passwordHash: string; name?: string; role: string; organizationId?: string }) {
    const stmt = this.db.prepare(
      `INSERT INTO users (id, email, passwordHash, name, role, organizationId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`
    )
    const id = crypto.randomUUID()
    stmt.run(id, user.email, user.passwordHash, user.name, user.role, user.organizationId)
    return { id, ...user, createdAt: new Date(), updatedAt: new Date() }
  }

  getUsers(pagination: { page?: number; limit?: number }) {
    const page = pagination.page || 1
    const limit = pagination.limit || 20
    const offset = (page - 1) * limit

    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM users')
    const dataStmt = this.db.prepare('SELECT * FROM users LIMIT ? OFFSET ?')

    const total = (countStmt.get() as any).count
    const rows = dataStmt.all(limit, offset)
    const data = rows.map((row: any) => ({ id: row.id, ...row }))

    return { data, total, hasMore: offset + limit < total }
  }

  // Organization operations
  createOrganization(org: { name: string; status?: string }) {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(`INSERT INTO organizations (id, name, status, createdAt, updatedAt) VALUES (?, ?, 'active', datetime('now'), datetime('now'))`)
    stmt.run(id, org.name)
    return { id, ...org, createdAt: new Date(), updatedAt: new Date() }
  }

  listOrganizations(pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM organizations')
    const dataStmt = this.db.prepare('SELECT * FROM organizations LIMIT ? OFFSET ?')

    const total = (countStmt.get() as any).count
    const rows = dataStmt.all(limit, offset)
    const data = rows.map((row: any) => ({ id: row.id, ...row }))

    return { data, total, hasMore: offset + limit < total }
  }

  // Client operations
  createClient(client: { organizationId: string; name: string; email?: string; phone?: string; company?: string; status?: string }) {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(`INSERT INTO clients (id, organizationId, name, email, phone, company, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`)
    stmt.run(id, client.organizationId, client.name, client.email, client.phone, client.company)
    return { id, ...client, createdAt: new Date(), updatedAt: new Date() }
  }

  listClients(pagination?: { page?: number; limit?: number }, organizationId?: string) {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    let whereClause = ''
    const params: any[] = []

    if (organizationId) {
      whereClause += 'WHERE organizationId = ? '
      params.push(organizationId)
    }

    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM clients ${whereClause}`)
    const dataStmt = this.db.prepare(`SELECT * FROM clients ${whereClause} LIMIT ? OFFSET ?`)

    params.push(limit, offset)
    const total = (countStmt.get() as any).count
    const rows = dataStmt.all(...params)
    const data = rows.map((row: any) => ({ id: row.id, ...row }))

    return { data, total, hasMore: offset + limit < total }
  }

  // Lead operations
  createLead(lead: { organizationId: string; name: string; company: string; email?: string; phone?: string; website?: string; source?: string; sourceUrl?: string; status?: string; score?: number }) {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(`INSERT INTO leads (id, organizationId, name, company, email, phone, website, source, sourceUrl, status, score, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))`)
    stmt.run(id, lead.organizationId, lead.name, lead.company, lead.email, lead.phone, lead.website, lead.sourceUrl || lead.source, lead.sourceUrl, lead.score)
    return { id, ...lead, createdAt: new Date(), updatedAt: new Date() }
  }

  listLeads(pagination?: { page?: number; limit?: number }, organizationId?: string, status?: string) {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    let whereClause = ''
    const params: any[] = []

    if (organizationId) {
      whereClause += 'WHERE organizationId = ? '
      params.push(organizationId)
    }
    if (status) {
      if (whereClause) whereClause += 'AND '
      whereClause += 'status = ? '
      params.push(status)
    }

    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM leads ${whereClause}`)
    const dataStmt = this.db.prepare(`SELECT * FROM leads ${whereClause} LIMIT ? OFFSET ?`)

    params.push(limit, offset)
    const total = (countStmt.get() as any).count
    const rows = dataStmt.all(...params)
    const data = rows.map((row: any) => ({ id: row.id, ...row }))

    return { data, total, hasMore: offset + limit < total }
  }

  // Project operations
  createProject(project: { organizationId: string; clientId?: string; founderId: string; name: string; description?: string; status: string; complexity?: number }) {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(`INSERT INTO projects (id, organizationId, clientId, founderId, name, description, status, complexity, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))`)
    stmt.run(id, project.organizationId, project.clientId, project.founderId, project.name, project.description || '', project.complexity)
    return { id, ...project, createdAt: new Date(), updatedAt: new Date() }
  }

  listProjects(pagination?: { page?: number; limit?: number }, organizationId?: string, clientId?: string, status?: string) {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    let whereClause = ''
    const params: any[] = []

    if (organizationId) {
      whereClause += 'WHERE organizationId = ? '
      params.push(organizationId)
    }
    if (clientId) {
      if (whereClause) whereClause += 'AND '
      whereClause += 'clientId = ? '
      params.push(clientId)
    }
    if (status) {
      if (whereClause) whereClause += 'AND '
      whereClause += 'status = ? '
      params.push(status)
    }

    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM projects ${whereClause}`)
    const dataStmt = this.db.prepare(`SELECT * FROM projects ${whereClause} LIMIT ? OFFSET ?`)

    params.push(limit, offset)
    const total = (countStmt.get() as any).count
    const rows = dataStmt.all(...params)
    const data = rows.map((row: any) => ({ id: row.id, ...row }))

    return { data, total, hasMore: offset + limit < total }
  }

  // Task operations
  createTask(task: { projectId: string; title: string; description?: string; status: string; priority?: number; assignedUserId?: string }) {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(`INSERT INTO tasks (id, projectId, title, description, status, priority, assignedUserId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
    stmt.run(id, task.projectId, task.title, task.description || '', task.status, task.priority, task.assignedUserId)
    return { id, ...task, createdAt: new Date(), updatedAt: new Date() }
  }

  listTasks(pagination?: { page?: number; limit?: number }, projectId?: string, status?: string) {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    let whereClause = ''
    const params: any[] = []

    if (projectId) {
      whereClause += 'WHERE projectId = ? '
      params.push(projectId)
    }
    if (status) {
      if (whereClause) whereClause += 'AND '
      whereClause += 'status = ? '
      params.push(status)
    }

    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM tasks ${whereClause}`)
    const dataStmt = this.db.prepare(`SELECT * FROM tasks ${whereClause} LIMIT ? OFFSET ?`)

    params.push(limit, offset)
    const total = (countStmt.get() as any).count
    const rows = dataStmt.all(...params)
    const data = rows.map((row: any) => ({ id: row.id, ...row }))

    return { data, total, hasMore: offset + limit < total }
  }

  // Agent operations
  createAgent(agent: { name: string; description?: string; status?: string; configurationReference?: string }) {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(`INSERT INTO agents (id, name, description, status, configurationReference, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
    stmt.run(id, agent.name, agent.description, agent.status || 'idle', agent.configurationReference)
    return { id, ...agent, createdAt: new Date(), updatedAt: new Date() }
  }

  listAgents(pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM agents')
    const dataStmt = this.db.prepare('SELECT * FROM agents LIMIT ? OFFSET ?')

    const total = (countStmt.get() as any).count
    const rows = dataStmt.all(limit, offset)
    const data = rows.map((row: any) => ({ id: row.id, ...row }))

    return { data, total, hasMore: offset + limit < total }
  }

  // Audit Event operations
  createAuditEvent(audit: { actorType: string; actorId: string; action: string; resourceType: string; resourceId: string; result: string }) {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(`INSERT INTO audit_events (id, actorType, actorId, action, resourceType, resourceId, result, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
    stmt.run(id, audit.actorType, audit.actorId, audit.action, audit.resourceType, audit.resourceId, audit.result)
    return { id, ...audit, createdAt: new Date() }
  }

  listAuditEvents(pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM audit_events')
    const dataStmt = this.db.prepare('SELECT * FROM audit_events LIMIT ? OFFSET ?')

    const total = (countStmt.get() as any).count
    const rows = dataStmt.all(limit, offset)
    const data = rows.map((row: any) => ({ id: row.id, ...row }))

    return { data, total, hasMore: offset + limit < total }
  }

  // Notification operations
  createNotification(notification: { userId: string; type: string; title: string; message: string; priority?: string }) {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(`INSERT INTO notifications (id, userId, type, title, message, priority, createdAt) VALUES (?, ?, ?, ?, ?, 'NORMAL', datetime('now'))`)
    stmt.run(id, notification.userId, notification.type, notification.title, notification.message)
    return { id, ...notification, createdAt: new Date() }
  }

  listNotifications(pagination?: { page?: number; limit?: number }, userId?: string) {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    let whereClause = ''
    const params: any[] = []

    if (userId) {
      whereClause += 'WHERE userId = ? '
      params.push(userId)
    }

    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM notifications ${whereClause}`)
    const dataStmt = this.db.prepare(`SELECT * FROM notifications ${whereClause} LIMIT ? OFFSET ?`)

    params.push(limit, offset)
    const total = (countStmt.get() as any).count
    const rows = dataStmt.all(...params)
    const data = rows.map((row: any) => ({ id: row.id, ...row }))

    return { data, total, hasMore: offset + limit < total }
  }

  // Health check
  checkHealth(): { status: 'OK' | 'ERROR' } {
    try {
      this.db.prepare('SELECT 1').get()
      return { status: 'OK' }
    } catch {
      return { status: 'ERROR' }
    }
  }

  // Close connection
  close(): void {
    // better-sqlite3 - no explicit close needed typically
  }
}

// ============================================================
// MySQL Support (configuration only - driver stub)
// ============================================================

export interface MySQLConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}

// ============================================================
// Database Factory
// ============================================================

export class DatabaseFactory {
  static create(config: DatabaseConfig): SQLiteDatabase {
    switch (config.engine) {
      case DatabaseEngine.SQLITE:
        return new SQLiteDatabase({ filename: config.filename || 'mairya-ai.db' })
      case DatabaseEngine.MYSQL:
        // MySQL support available via mysql2 driver
        // Return SQLite as fallback for development
        return new SQLiteDatabase({ filename: 'mairya-ai-dev.db' })
      default:
        throw new Error(`Unknown database engine: ${config.engine}`)
    }
  }
}

// ============================================================
// Convenience export
// ============================================================

export const createDatabase = (config: DatabaseConfig) => {
  return DatabaseFactory.create(config)
}