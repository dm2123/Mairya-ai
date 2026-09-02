import { Request, Response, NextFunction } from 'express'
import { authenticate, requireRole, organizationIdParam } from '../auth/middleware'
import { AIProjectRequirement } from '../src/requirement-model'
import { AIProjectPlan } from '../src/project-planner'
import { GenerationTask } from '../src/requirement-model'
import { ArchitectureOutput } from '../src/architecture-generator'
import { TechnologyStack } from '../src/technology-selector'
import { GenerationPlan } from '../src/generation-plan'
import { CodeGenerationEngine } from '../src/code-generation-engine'
import { CodeGenerationResult } from '../src/code-generation-engine'
import { FileChange } from '../src/code-generation-engine'
import { ContextSelector, buildContextString, ContextSlice } from '../src/context-management'
import { AIGatewayIntegration, GatewayRequest, GatewayResponse } from '../src/ai-gateway-integration'
import { CodeGenerationJob, GenerationJobStatus } from '../factory/src/code-generation-job'
import { GenerationJobService, createGenerationJobService } from '../src/generation-job-lifecycle'
import { ProjectVersionService, createProjectVersionService } from '../src/project-versioning'
import { approveOperation, requiresApproval, getApprovalLevel } from '../src/human-approval'
import { analyzeCodeSecurity, validateGenerationSecurity } from '../src/ai-code-generation-security'
import { AuditLog } from '../audit/logger'

/** Project Planner API Router — Protected endpoints for project planning operations. */
export class ProjectPlannerAPI {
  private planner: any // ProjectPlanner
  private gatewayIntegration: AIGatewayIntegration
  private jobService: GenerationJobService
  private versionService: ProjectVersionService
  private auditLog: AuditLog

  constructor(
    planner: any,
    gatewayIntegration: AIGatewayIntegration,
    jobService: GenerationJobService,
    versionService: ProjectVersionService,
    auditLog: AuditLog
  ) {
    this.planner = planner
    this.gatewayIntegration = gatewayIntegration
    this.jobService = jobService
    this.versionService = versionService
    this.auditLog = auditLog
  }

  /** Routes for the project planner API. */
  get routes(): any {
    const router = require('express').Router()

    // Create AI project requirement
    router.post(
      '/requirements',
      authenticate,
      requireRole('founder'),
      async (req: Request, res: Response) => {
        try {
          const requirement: AIProjectRequirement = req.body
          if (!requirement.projectName) {
            return res.status(400).json({
              success: false,
              error: 'Project name is required',
            })
          }

          // Create the plan using the planner
          const plan = this.planner.plan(requirement)

          // Audit log
          AuditLog.log('planner_requirement_created', {
            organizationId: req.user!.organizationId,
            projectName: requirement.projectName,
            userId: req.user!.id,
            preferredLanguage: requirement.preferredLanguage,
            preferredFramework: requirement.preferredFramework,
          })

          res.json({
            success: true,
            data: { requirement, plan },
          })
        } catch (error: any) {
          res.status(500).json({
            success: false,
            error: error.message,
          })
        }
      }
    )

    // Get a requirement
    router.get(
      '/requirements/:requirementId',
      authenticate,
      requireRole('founder'),
      (req: Request, res: Response) => {
        // In a real implementation, fetch from database
        const requirementId = req.params.requirementId
        res.json({
          success: true,
          data: { requirementId },
        })
      }
    )

    // Create a project plan
    router.post(
      '/plans',
      authenticate,
      requireRole('founder'),
      async (req: Request, res: Response) => {
        try {
          const requirementId = req.body.requirementId
          // In a real implementation, fetch requirement from database
          // For now, create a plan from the body
          const requirement: AIProjectRequirement = req.body.requirement
          if (!requirement) {
            return res.status(400).json({
              success: false,
              error: 'Requirement is required',
            })
          }

          const plan = this.planner.plan(requirement)

          // Audit log
          AuditLog.log('planner_plan_created', {
            organizationId: req.user!.organizationId,
            planId: plan.planId,
            userId: req.user!.id,
            projectName: requirement.projectName,
          })

          res.json({
            success: true,
            data: { requirement, plan },
          })
        } catch (error: any) {
          res.status(500).json({
            success: false,
            error: error.message,
          })
        }
      }
    )

    // Get a project plan
    router.get(
      '/plans/:planId',
      authenticate,
      requireRole('founder'),
      (req: Request, res: Response) => {
        const planId = req.params.planId
        res.json({
          success: true,
          data: { planId },
        })
      }
    )

    // Create a generation plan
    router.post(
      '/generation-plans',
      authenticate,
      requireRole('founder'),
      async (req: Request, res: Response) => {
        try {
          const architecture = req.body.architecture
          const projectId = req.body.projectId

          if (!architecture || !projectId) {
            return res.status(400).json({
              success: false,
              error: 'Architecture and projectId are required',
            })
          }

          const plan = GenerationPlan.createGenerationPlan(architecture, projectId)

          // Audit log
          AuditLog.log('generation_plan_created', {
            organizationId: req.user!.organizationId,
            planId: plan.planId,
            userId: req.user!.id,
            projectId,
            technologyStack: architecture.technologyStack
              ? `${architecture.technologyStack.language} + ${architecture.technologyStack.framework}`
              : 'unknown',
          })

          res.json({
            success: true,
            data: plan,
          })
        } catch (error: any) {
          res.status(500).json({
            success: false,
            error: error.message,
          })
        }
      }
    )

    // Get a generation plan
    router.get(
      '/generation-plans/:planId',
      authenticate,
      requireRole('founder'),
      (req: Request, res: Response) => {
        const planId = req.params.planId
        res.json({
          success: true,
          data: { planId },
        })
      }
    )

    // Create generation job
    router.post(
      '/jobs',
      authenticate,
      requireRole('founder'),
      async (req: Request, res: Response) => {
        try {
          const planId = req.body.planId
          const projectId = req.body.projectId
          const organizationId = req.user!.organizationId
          const requestedBy = req.user!.id

          // Get the generation plan
          const job = this.jobService.createJob(
            organizationId,
            requestedBy,
            { projectId, projectType: 'backend', language: 'typescript' } as any,
            req.body.projectPlan,
            req.body.generationPlan
          )

          // Audit log
          AuditLog.log('generation_job_created', {
            organizationId,
            jobId: job.jobId,
            userId: requestedBy,
            planId,
            projectId,
          })

          res.json({
            success: true,
            data: job,
          })
        } catch (error: any) {
          res.status(500).json({
            success: false,
            error: error.message,
          })
        }
      }
    )

    // Get a generation job
    router.get(
      '/jobs/:jobId',
      authenticate,
      requireRole('founder'),
      (req: Request, res: Response) => {
        const jobId = req.params.jobId
        const job = this.jobService.getJob(jobId)
        if (!job) {
          return res.status(404).json({
            success: false,
            error: 'Generation job not found',
          })
        }
        res.json({
          success: true,
          data: job,
        })
      }
    )

    // List generation tasks for a job
    router.get(
      '/jobs/:jobId/tasks',
      authenticate,
      requireRole('founder'),
      (req: Request, res: Response) => {
        const jobId = req.params.jobId
        const job = this.jobService.getJob(jobId)
        if (!job) {
          return res.status(404).json({
            success: false,
            error: 'Generation job not found',
          })
        }
        res.json({
          success: true,
          data: { jobId, tasks: job.generationPlan?.tasks || [] },
        })
      }
    )

    // Generate code for a job
    router.post(
      '/jobs/:jobId/generate',
      authenticate,
      requireRole('founder'),
      async (req: Request, res: Response) => {
        try {
          const jobId = req.params.jobId
          const job = this.jobService.getJob(jobId)

          if (!job) {
            return res.status(404).json({
              success: false,
              error: 'Generation job not found',
            })
          }

          // Check if generation is already in progress
          if (job.status.status !== GenerationJobStatus.Planned) {
            return res.status(400).json({
              success: false,
              error: `Job is not in planning state. Current status: ${job.status.status}`,
            })
          }

          // Update status to generating
          const updatedJob = this.jobService.updateStatus(jobId, GenerationJobStatus.Generating)

          // Run code generation
          const engine = createCodeGenerationEngine()
          const contextSelector = createContextSelector()

          // Process each task
          const generationPlan = job.generationPlan!
          const allFiles: FileChange[] = []
          const taskErrors: string[] = []

          for (const task of generationPlan.tasks || []) {
            try {
              // Select context for this task
              const contextSlice = contextSelector.selectContext(
                req.body.requirement || {},
                job.architecture!,
                task,
                job.technologyStack!
              )

              // Generate files for this task
              const generatedFiles = engine.generateForTask(
                task,
                job.architecture!,
                contextSlice
              )

              allFiles.push(...generatedFiles)

              // Mark task as completed
              this.jobService.markTaskCompleted(jobId)
            } catch (err: any) {
              taskErrors.push(`Task ${task.taskId}: ${err.message}`)
            }
          }

          // Validate generated files
          const workspaceRoot = `/workspace/${projectId}`
          const securityValidation = validateGenerationSecurity(
            allFiles.map((f) => ({
              filePath: f.filePath,
              content: f.content || '',
              language: f.language || 'typescript',
              framework: f.framework,
            }))
          )

          // Update job status
          let finalStatus = GenerationJobStatus.Generated
          if (securityValidation.totalCritical > 0 || securityValidation.totalHigh > 0) {
            finalStatus = GenerationJobStatus.Validating
          }

          this.jobService.markTaskCompleted(jobId) // Final mark
          this.jobService.updateStatus(jobId, finalStatus)

          // Audit log
          AuditLog.log('generation_job_completed', {
            organizationId,
            jobId,
            userId: req.user!.id,
            filesGenerated: allFiles.length,
            taskErrors: taskErrors.length,
            criticalSecurityIssues: securityValidation.totalCritical,
            highSecurityIssues: securityValidation.totalHigh,
          })

          res.json({
            success: true,
            data: {
              job: updatedJob,
              filesGenerated: allFiles.length,
              securityValidation,
              taskErrors,
            },
          })
        } catch (error: any) {
          res.status(500).json({
            success: false,
            error: error.message,
          })
        }
      }
    )

    // Validate generated code
    router.post(
      '/jobs/:jobId/validate',
      authenticate,
      requireRole('founder'),
      async (req: Request, res: Response) => {
        try {
          const jobId = req.params.jobId
          const job = this.jobService.getJob(jobId)

          if (!job) {
            return res.status(404).json({
              success: false,
              error: 'Generation job not found',
            })
          }

          // Get generated files (in a real implementation, these would be stored)
          // For now, we'll validate based on the job's generation plan
          const workspaceRoot = `/workspace/${job.projectSpec?.projectId}`

          // Validate generated files
          const filesToValidate = (job.generationPlan?.tasks || []).map(
            (task: any) => ({
              filePath: task.targetFiles?.[0] || `src/${task.taskId}.ts`,
              content: '', // Would be the actual generated content
              language: task.language || 'typescript',
              framework: task.framework,
            })
          )

          const securityValidation = validateGenerationSecurity(filesToValidate)

          // Mark validation as complete
          this.jobService.markValidationComplete(jobId, securityValidation.fileResults[0] || {
            valid: true,
            errors: [],
            warnings: [],
          })

          // Audit log
          AuditLog.log('generation_job_validated', {
            organizationId: req.user!.organizationId,
            jobId,
            userId: req.user!.id,
            overallValid: securityValidation.overallValid,
            totalErrors: securityValidation.totalErrors,
            totalWarnings: securityValidation.totalWarnings,
          })

          res.json({
            success: true,
            data: {
              job,
              securityValidation,
            },
          })
        } catch (error: any) {
          res.status(500).json({
            success: false,
            error: error.message,
          })
        }
      }
    )

    // Get generation version
    router.get(
      '/versions/:projectId',
      authenticate,
      requireRole('founder'),
      (req: Request, res: Response) => {
        const projectId = req.params.projectId
        const versions = this.versionService.getVersionsByProject(projectId)
        res.json({
          success: true,
          data: { projectId, versions },
        })
      }
    )

    // Create a new generation version
    router.post(
      '/versions',
      authenticate,
      requireRole('founder'),
      async (req: Request, res: Response) => {
        try {
          const projectId = req.body.projectId
          const generation = req.body.generation || 1
          const language = req.body.language || 'typescript'
          const framework = req.body.framework || 'nextjs'
          const generationJobId = req.body.generationJobId
          const architectureRef = req.body.architectureRef

          const version = this.versionService.createVersion(
            projectId,
            generation,
            language,
            framework,
            generationJobId,
            architectureRef
          )

          // Audit log
          AuditLog.log('generation_version_created', {
            organizationId: req.user!.organizationId,
            versionId: version.versionId,
            userId: req.user!.id,
            projectId,
            generation,
            language,
          })

          res.json({
            success: true,
            data: version,
          })
        } catch (error: any) {
          res.status(500).json({
            success: false,
            error: error.message,
          })
        }
      }
    )

    return router
  }
}

/** Creates a new ProjectPlannerAPI instance. */
export function createProjectPlannerAPI(
  planner: any,
  gatewayIntegration: AIGatewayIntegration,
  jobService: GenerationJobService,
  versionService: ProjectVersionService,
  auditLog: AuditLog
): any {
  return new ProjectPlannerAPI(planner, gatewayIntegration, jobService, versionService, auditLog).routes
}