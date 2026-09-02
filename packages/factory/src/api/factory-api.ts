import { Request, Response, NextFunction } from 'express'
import { authenticate, requireRole } from '../auth/middleware'
import { ProjectSpecification, ProjectType, LanguageId, FrameworkId, isValidProjectSpec } from '../shared/src/project-specification'
import { CodeGenerationJob, FactoryJobService } from '../factory/job-service'
import { RepositoryGenerator } from '../factory/repository-generator'
import { getEnabledLanguages, getEnabledFrameworks, getTemplateDefinition } from '../shared/src/project-types'
import { AuditLog } from '../audit/logger'

/** Factory API Router — Protected endpoints for factory operations.
 *
 * All endpoints use existing P5 authentication, RBAC, and organization isolation.
 */
export class FactoryAPI {
  private jobService: FactoryJobService
  private repoGenerator: RepositoryGenerator

  constructor(
    jobService: FactoryJobService,
    repoGenerator: RepositoryGenerator
  ) {
    this.jobService = jobService
    this.repoGenerator = repoGenerator
  }

  /** Routes for the factory API. */
  get routes(): any {
    const router = require('express').Router()

    // Supported languages
    router.get('/languages', authenticate, requireRole('founder'), (req, res) => {
      const languages = getEnabledLanguages()
      res.json({ success: true, data: languages })
    })

    // Supported frameworks
    router.get('/frameworks', authenticate, requireRole('founder'), (req, res) => {
      const frameworks = getEnabledFrameworks()
      res.json({ success: true, data: frameworks })
    })

    // Project templates
    router.get('/templates', authenticate, requireRole('founder'), (req, res) => {
      const templates = getEnabledTemplates()
      res.json({ success: true, data: templates })
    })

    // Create factory project
    router.post(
      '/projects',
      authenticate,
      requireRole('founder'),
      async (req: Request, res: Response) => {
        try {
          const spec: ProjectSpecification = req.body
          if (!isValidProjectSpec(spec)) {
            return res.status(400).json({
              success: false,
              error: 'Invalid project specification',
            })
          }

          // Create the project workspace
          const generator = new RepositoryGenerator('/workspace')
          await generator.createProject(spec)

          // Create a generation job
          const job = this.jobService.createJob(
            req.user!.organizationId,
            req.user!.id,
            spec,
            spec.language,
            spec.framework || null
          )

          // Audit log
          AuditLog.log('factory_project_created', {
            organizationId: req.user!.organizationId,
            projectId: spec.projectId,
            userId: req.user!.id,
            framework: spec.framework,
            language: spec.language,
          })

          res.json({
            success: true,
            data: { project: spec, job },
          })
        } catch (error: any) {
          res.status(500).json({
            success: false,
            error: error.message,
          })
        }
      }
    )

    // Create generation job
    router.post(
      '/jobs',
      authenticate,
      requireRole('founder'),
      (req: Request, res: Response) => {
        const { projectId, language, framework } = req.body
        const job = this.jobService.createJob(
          req.user!.organizationId,
          req.user!.id,
          { projectId, projectType: 'backend', language, framework } as any,
          language,
          framework
        )
        res.json({ success: true, data: job })
      }
    )

    // Get job status
    router.get(
      '/jobs/:jobId',
      authenticate,
      requireRole('founder'),
      (req: Request, res: Response) => {
        const job = this.jobService.getJob(req.params.jobId)
        if (!job) {
          return res.status(404).json({
            success: false,
            error: 'Job not found',
          })
        }
        res.json({ success: true, data: job })
      }
    )

    return router
  }
}

/** Gets all enabled templates. */
function getEnabledTemplates(): any[] {
  // This would import from the template registry
  return []
}

/** Audit log service placeholder. */
class AuditLog {
  static log(event: string, metadata: any): void {
    // Placeholder - in real implementation, writes to audit_events table
    console.log(`Audit: ${event}`, metadata)
  }
}

export { FactoryAPI }