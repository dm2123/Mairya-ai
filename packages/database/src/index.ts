import Database from 'better-sqlite3'
import { BaseEntity, CreatedUpdatedFields } from '../shared/src/base-entity'
import { StatusEnum, RoleEnum, ProjectState, AgentState, DeploymentState } from '../shared/src/enums'

export interface DatabaseConfig {
  filename: string
  schema: string
}

export class DatabaseManager {
  private db: Database.Database

  constructor(config: DatabaseConfig) {
    this.db = new Database(config.filename, { verbose: console.log })
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.initializeSchema(config.schema)
  }

  private initializeSchema(schema: string) {
    this.db.exec(schema)
  }

  // User operations
  getUser(id: string): any {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  }

  createUser(user: {
    email: string
    passwordHash: string
    name?: string
    role: RoleEnum
    organizationId?: string
  }): any {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, passwordHash, name, role, organizationId, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `)
    const id = crypto.randomUUID()
    return stmt.run(id, user.email, user.passwordHash, user.name, user.role, user.organizationId)
  }

  getUsers(pagination: { page: number; limit: number }): {
    data: any[]
    total: number
  } {
    const offset = (pagination.page - 1) * pagination.limit
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM users')
    const dataStmt = this.db.prepare('SELECT * FROM users LIMIT ? OFFSET ?')
    
    const total = countStmt.get().count
    const data = dataStmt.all(pagination.limit, offset)
    
    return { data, total }
  }

  // Lead operations
  createLead(lead: {
    name: string
    company: string
    email?: string
    phone?: string
    industry?: string
    source?: string
    status?: StatusEnum
  }): any {
    const stmt = this.db.prepare(`
      INSERT INTO leads (id, name, company, email, phone, industry, source, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `)
    const id = crypto.randomUUID()
    return stmt.run(id, lead.name, lead.company, lead.email, lead.phone, lead.industry, lead.source)
  }

  getLeads(pagination: { page: number; limit: number }, organizationId?: string): {
    data: any[]
    total: number
  } {
    const whereClause = organizationId ? 'WHERE organizationId = ?' : ''
    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM leads ${whereClause}`)
    const dataStmt = this.db.prepare(`SELECT * FROM leads ${whereClause} LIMIT ? OFFSET ?`)
    
    const params = organizationId ? [organizationId] : []
    const total = countStmt.get(...params).count
    const data = dataStmt.all(...params, pagination.limit, (pagination.page - 1) * pagination.limit)
    
    return { data, total }
  }

  // Project operations
  createProject(project: {
    name: string
    description?: string
    clientId?: string
    founderId: string
    status?: ProjectState
  }): any {
    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, description, clientId, founderId, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `)
    const id = crypto.randomUUID()
    return stmt.run(id, project.name, project.description, project.clientId, project.founderId)
  }

  getProjects(pagination: { page: number; limit: number }, founderId?: string): {
    data: any[]
    total: number
  } {
    const whereClause = founderId ? 'WHERE founderId = ?' : ''
    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM projects ${whereClause}`)
    const dataStmt = this.db.prepare(`SELECT * FROM projects ${whereClause} LIMIT ? OFFSET ?`)
    
    const params = founderId ? [founderId] : []
    const total = countStmt.get(...params).count
    const data = dataStmt.all(...params, pagination.limit, (pagination.page - 1) * pagination.limit)
    
    return { data, total }
  }

  // Close database connection
  close(): void {
    this.db.close()
  }
}

// Initialize schema
export const initializeDatabase = (db: Database.Database) => {
  db.exec(`
    -- Users table
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

    -- Leads table
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      industry TEXT,
      source TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      clientId TEXT,
      founderId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (founderId) REFERENCES users(id),
      FOREIGN KEY (clientId) REFERENCES clients(id)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_projects_founder ON projects(founderId);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  `)
}