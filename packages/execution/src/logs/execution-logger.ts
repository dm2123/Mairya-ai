/**
 * P9 Execution Logging
 * 
 * Persist execution logs with structured events.
 * Support levels: INFO, WARN, ERROR, BUILD, TEST, SECURITY, SYSTEM
 * 
 * Log entries include:
 *   - job ID
 *   - task ID
 *   - timestamp
 *   - event type
 *   - safe message
 *   - exit code where applicable
 * 
 * Never log: passwords, JWTs, API keys, provider secrets, database credentials
 */
import * as fs from 'fs'
import * as path from 'path'
import { ExecutionJob, ExecutionTask } from '../executor/execution-models'
import { ExecutionStatus } from '../executor/execution-models'

/**
 * Log event levels
 */
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  BUILD = 'build',
  TEST = 'test',
  SECURITY = 'security',
  SYSTEM = 'system',
}

/**
 * Log event structure
 */
export interface LogEvent {
  /** Unique log entry ID */
  id: string
  /** Associated execution job ID */
  executionJobId: string
  /** Associated execution task ID (optional) */
  executionTaskId: string | null
  /** Event type/level */
  level: LogLevel
  /** Message (safe - no secrets) */
  message: string
  /** Exit code where applicable */
  exitCode: number | null
  /** Additional data (structured) */
  data?: Record<string, unknown>
  /** Timestamp */
  timestamp: Date
}

/**
 * P9 Execution Logging
 * 
 * Provides persistent execution logging with structured events.
 * Logs are stored in the database and can be queried by job ID,
 * task ID, level, and timestamp.
 * 
 * Log levels: INFO, WARN, ERROR, BUILD, TEST, SECURITY, SYSTEM
 * 
 * What is never logged: passwords, JWTs, API keys, provider secrets,
 * database credentials, or any sensitive environment data.
 */
export class ExecutionLogger {
  private db: any

  constructor(db: any) {
    this.db = db
    this.initializeSchema()
  }

  /**
   * Initialize the execution logs table schema.
   */
  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS execution_logs (
        id TEXT PRIMARY KEY,
        execution_job_id TEXT NOT NULL,
        execution_task_id TEXT,
        level TEXT NOT NULL DEFAULT 'info',
        message TEXT NOT NULL,
        exit_code INTEGER,
        created_at TEXT NOT NULL,
        FOREIGN KEY (execution_job_id) REFERENCES execution_jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (execution_task_id) REFERENCES execution_tasks(id) ON DELETE SET NULL
      )
    `)

    // Create indexes for common query patterns
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_execution_jobs_id ON execution_jobs(id)
      CREATE INDEX IF NOT EXISTS idx_execution_logs_job_id ON execution_logs(execution_job_id)
      CREATE INDEX IF NOT EXISTS idx_execution_logs_task_id ON execution_logs(execution_task_id)
      CREATE INDEX IF NOT EXISTS idx_execution_logs_level ON execution_logs(level)
      CREATE INDEX IF NOT EXISTS idx_execution_logs_timestamp ON execution_logs(created_at)
    `)
  }

  /**
   * Log an informational event.
   */
  logInfo(executionJobId: string, message: string, executionTaskId?: string): string {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(
      `INSERT INTO execution_logs (id, execution_job_id, execution_task_id, level, message, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    const taskId = executionTaskId || null
    stmt.run(id, executionJobId, taskId, LogLevel.INFO, message)
    return id
  }

  /**
   * Log a warning event.
   */
  logWarning(executionJobId: string, message: string, executionTaskId?: string): string {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(
      `INSERT INTO execution_logs (id, execution_job_id, execution_task_id, level, message, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    stmt.run(id, executionJobId, executionTaskId || null, LogLevel.WARN, message)
    return id
  }

  /**
   * Log an error event.
   */
  logError(executionJobId: string, message: string, executionTaskId?: string, exitCode?: number): string {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(
      `INSERT INTO execution_logs (id, execution_job_id, execution_task_id, level, message, exit_code, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    stmt.run(id, executionJobId, executionTaskId || null, LogLevel.ERROR, message, exitCode)
    return id
  }

  /**
   * Log a build event.
   */
  logBuild(executionJobId: string, message: string, executionTaskId?: string): string {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(
      `INSERT INTO execution_logs (id, execution_job_id, execution_task_id, level, message, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    stmt.run(id, executionJobId, executionTaskId || null, LogLevel.BUILD, message)
    return id
  }

  /**
   * Log a test event.
   */
  logTest(executionJobId: string, message: string, executionTaskId?: string): string {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(
      `INSERT INTO execution_logs (id, execution_job_id, execution_task_id, level, message, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    stmt.run(id, executionJobId, executionTaskId || null, LogLevel.TEST, message)
    return id
  }

  /**
   * Log a security event.
   */
  logSecurity(executionJobId: string, message: string, executionTaskId?: string): string {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(
      `INSERT INTO execution_logs (id, execution_job_id, execution_task_id, level, message, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    stmt.run(id, executionJobId, executionTaskId || null, LogLevel.SECURITY, message)
    return id
  }

  /**
   * Log a system event.
   */
  logSystem(executionJobId: string, message: string, executionTaskId?: string): string {
    const id = crypto.randomUUID()
    const stmt = this.db.prepare(
      `INSERT INTO execution_logs (id, execution_job_id, execution_task_id, level, message, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    stmt.run(id, executionJobId, executionTaskId || null, LogLevel.SYSTEM, message)
    return id
  }

  /**
   * Get logs for an execution job.
   */
  getLogs(executionJobId: string, pagination?: { page?: number; limit?: number }): {
    data: LogEvent[]
    total: number
    hasMore: boolean
  } {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM execution_logs WHERE execution_job_id = ?`)
    const dataStmt = this.db.prepare(`SELECT * FROM execution_logs WHERE execution_job_id = ? LIMIT ? OFFSET ?`)

    const total = (countStmt.get(executionJobId) as any).count
    const rows = dataStmt.all(executionJobId, limit, offset).map((row: any) => ({
      id: row.id,
      executionJobId: row.execution_job_id,
      executionTaskId: row.execution_task_id,
      level: row.level as LogLevel,
      message: row.message,
      exitCode: row.exit_code,
      timestamp: new Date(row.created_at),
    }))

    return {
      data: rows,
      total,
      hasMore: offset + limit < total,
    }
  }

  /**
   * Get logs for an execution task.
   */
  getTaskLogs(executionTaskId: string, pagination?: { page?: number; limit?: number }): {
    data: LogEvent[]
    total: number
    hasMore: boolean
  } {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM execution_logs WHERE execution_task_id = ?`)
    const dataStmt = this.db.prepare(`SELECT * FROM execution_logs WHERE execution_task_id = ? LIMIT ? OFFSET ?`)

    const total = (countStmt.get(executionTaskId) as any).count
    const rows = dataStmt.all(executionTaskId, limit, offset).map((row: any) => ({
      id: row.id,
      executionJobId: row.execution_job_id,
      executionTaskId: row.execution_task_id,
      level: row.level as LogLevel,
      message: row.message,
      exitCode: row.exit_code,
      timestamp: new Date(row.created_at),
    }))

    return {
      data: rows,
      total,
      hasMore: offset + limit < total,
    }
  }

  /**
   * Get logs filtered by level.
   */
  getLogsByLevel(executionJobId: string, level: LogLevel, pagination?: { page?: number; limit?: number }): {
    data: LogEvent[]
    total: number
    hasMore: boolean
  } {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM execution_logs WHERE execution_job_id = ? AND level = ?`)
    const dataStmt = this.db.prepare(`SELECT * FROM execution_logs WHERE execution_job_id = ? AND level = ? LIMIT ? OFFSET ?`)

    const total = (countStmt.get(executionJobId, level) as any).count
    const rows = dataStmt.all(executionJobId, level, limit, offset).map((row: any) => ({
      id: row.id,
      executionJobId: row.execution_job_id,
      executionTaskId: row.execution_task_id,
      level: row.level as LogLevel,
      message: row.message,
      exitCode: row.exit_code,
      timestamp: new Date(row.created_at),
    }))

    return {
      data: rows,
      total,
      hasMore: offset + limit < total,
    }
  }
}

/**
 * Factory function to create an ExecutionLogger
 */
export function createExecutionLogger(db: any): ExecutionLogger {
  return new ExecutionLogger(db)
}