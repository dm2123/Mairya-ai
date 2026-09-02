/** AI Code Generation Security — Security analysis abstraction for generated code.
 *
 * Capable of detecting categories such as:
 * - hardcoded secrets
 * - suspicious command execution
 * - unsafe filesystem access
 * - obvious injection risks
 * - insecure authentication patterns
 *
 * Does not claim comprehensive security scanning.
 * Advanced security scanning belongs to later phases.
 */

import { FileValidationResult } from './code-generation-validation'

/** Security Issue — A detected security issue in generated code. */
export interface SecurityIssue {
  /** Category of the issue. */
  category: SecurityIssueCategory
  /** Description of the issue. */
  description: string
  /** File path where issue was found. */
  filePath: string
  /** Line number or location (if available). */
  location?: string
  /** Severity level. */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Recommendation for fix. */
  recommendation?: string
}

/** Security Issue Categories. */
export enum SecurityIssueCategory {
  HardcodedSecret = 'hardcoded_secret',
  CommandExecution = 'command_execution',
  UnsafeFilesystem = 'unsafe_filesystem',
  InjectionRisk = 'injection_risk',
  InsecureAuth = 'insecure_auth',
  InformationDisclosure = 'information_disclosure',
  Other = 'other',
}

/** Security Analysis Result. */
export interface SecurityAnalysisResult {
  /** Whether the code passed security analysis. */
  safe: boolean
  /** Detected security issues. */
  issues: SecurityIssue[]
  /** Summary message. */
  summary: string
  /** Overall risk level. */
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

/** Performs basic security analysis on generated code.
 *
 * Checks for obvious security risks. Does not claim comprehensive scanning.
 */
export function analyzeCodeSecurity(
  filePath: string,
  content: string,
  language: string,
  framework: string | null
): SecurityAnalysisResult {
  const issues: SecurityIssue[] = []

  // 1. Check for hardcoded secrets
  const secretIssues = checkForHardcodedSecrets(content, language)
  issues.push(...secretIssues)

  // 2. Check for suspicious command execution
  const commandIssues = checkForCommandExecution(content, language)
  issues.push(...commandIssues)

  // 3. Check for unsafe filesystem access
  const filesystemIssues = checkForUnsafeFilesystem(content, language)
  issues.push(...filesystemIssues)

  // 4. Check for injection risks
  const injectionIssues = checkForInjectionRisks(content, language)
  issues.push(...injectionIssues)

  // 5. Check for insecure authentication patterns
  const authIssues = checkForInsecureAuth(content, language, framework)
  issues.push(...authIssues)

  // Determine risk level
  const riskLevel = determineRiskLevel(issues)

  const summary = riskLevel === 'critical'
    ? 'Critical security issues detected'
    : riskLevel === 'high'
      ? 'High security risk detected'
      : riskLevel === 'medium'
        ? 'Medium security risk detected'
        : 'No critical security issues detected'

  return {
    safe: issues.length === 0 || issues.every((i) => i.severity !== 'critical' && i.severity !== 'high'),
    issues,
    summary,
    riskLevel,
  }
}

/** Checks for hardcoded secrets in code. */
function checkForHardcodedSecrets(
  content: string,
  language: string
): SecurityIssue[] {
  const issues: SecurityIssue[] = []

  const lowerContent = content.toLowerCase()

  // Check for common secret patterns
  const secretPatterns = [
    { pattern: /api[key_]?\s*=\s*['"][^'"]{8,}['"]/, description: 'Potential API key assignment' },
    { pattern: /password\s*=\s*['"][^'"]{4,}['"]/, description: 'Potential password assignment' },
    { pattern: /secret\s*=\s*['"][^'"]{4,}['"]/, description: 'Potential secret assignment' },
    { pattern: /token\s*=\s*['"][^'"]{10,}['"]/, description: 'Potential token assignment' },
    { pattern: /['"][A-Za-z0-9]{32,}['"]/, description: 'Long alphanumeric string (possible key/secret)' },
  ]

  for (const { pattern, description } of secretPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      issues.push({
        category: SecurityIssueCategory.HardcodedSecret,
        description,
        filePath: '',
        severity: 'high',
        recommendation: 'Move secret to environment variables or secret manager',
      })
    }
  }

  // Language-specific checks
  if (language === 'python') {
    // Python-specific: environment variable access patterns
    if (lowerContent.includes('os.environ') && lowerContent.includes('=')) {
      // Could be fine, but flag if value is hardcoded
    }
  } else if (language === 'javascript' || language === 'typescript') {
    // JS/TS-specific: process.env patterns
    if (lowerContent.includes('process.env')) {
      // Could be fine, flag for review
    }
  }

  return issues
}

/** Checks for suspicious command execution. */
function checkForCommandExecution(
  content: string,
  language: string
): SecurityIssue[] {
  const issues: SecurityIssue[] = []

  const lowerContent = content.toLowerCase()

  // Patterns that suggest command execution
  const commandPatterns = [
    { pattern: /os\.(system|popen|exec|spawn)\(/i, description: 'OS command execution' },
    { pattern: /child_process/.i, description: 'Node.js child_process usage' },
    { pattern: /subprocess\.(Popen|call|run)\(/i, description: 'Python subprocess usage' },
    { pattern: /eval\(/, description: 'Code evaluation' },
    { pattern: /exec\(/, description: 'Command execution' },
  ]

  for (const { pattern, description } of commandPatterns) {
    if (pattern.test(content)) {
      issues.push({
        category: SecurityIssueCategory.CommandExecution,
        description,
        filePath: '',
        severity: 'critical',
        recommendation: 'Avoid dynamic command execution; use static alternatives',
      })
    }
  }

  return issues
}

/** Checks for unsafe filesystem access. */
function checkForUnsafeFilesystem(
  content: string,
  language: string
): SecurityIssue[] {
  const issues: SecurityIssue[] = []

  const lowerContent = content.toLowerCase()

  // Patterns that suggest unsafe filesystem access
  const filesystemPatterns = [
    { pattern: /fs\.(readFile|writeFile|sync)\s*\(/i, description: 'Node.js filesystem operations' },
    { pattern: /open\(/, description: 'File open operation' },
    { pattern: /os\.open\(/i, description: 'OS file open' },
    { pattern: /FileSystem\./, description: 'FileSystem API usage' },
  ]

  for (const { pattern, description } of filesystemPatterns) {
    if (pattern.test(content)) {
      issues.push({
        category: SecurityIssueCategory.UnsafeFilesystem,
        description,
        filePath: '',
        severity: 'high',
        recommendation: 'Validate file paths and user input before filesystem operations',
      })
    }
  }

  return issues
}

/** Checks for injection risks. */
function checkForInjectionRisks(
  content: string,
  language: string
): SecurityIssue[] {
  const issues: SecurityIssue[] = []

  const lowerContent = content.toLowerCase()

  // Patterns that suggest injection risks
  const injectionPatterns = [
    { pattern: /\.query\s*\(/i, description: 'Potential SQL injection' },
    { pattern: /\.execute\s*\(/i, description: 'Potential SQL execution' },
    { pattern: /\\$\([^)]*\)/,
      description: 'Potential shell injection (command substitution)' },
    { pattern: /concat.*\+.*user/i,
      description: 'Potential string concatenation with user input' },
  ]

  for (const { pattern, description } of injectionPatterns) {
    if (pattern.test(content)) {
      issues.push({
        category: SecurityIssueCategory.InjectionRisk,
        description,
        filePath: '',
        severity: 'high',
        recommendation: 'Use parameterized queries or input validation',
      })
    }
  }

  return issues
}

/** Checks for insecure authentication patterns. */
function checkForInsecureAuth(
  content: string,
  language: string,
  framework: string | null
): SecurityIssue[] {
  const issues: SecurityIssue[] = []

  const lowerContent = content.toLowerCase()

  // Check for insecure auth patterns
  if (lowerContent.includes('http.basic') || lowerContent.includes('basic auth')) {
    issues.push({
      category: SecurityIssueCategory.InsecureAuth,
      description: 'Basic authentication over HTTP (not HTTPS)',
      filePath: '',
      severity: 'critical',
      recommendation: 'Use HTTPS with token-based authentication (e.g., JWT)',
    })
  }

  if (lowerContent.includes('password.') && lowerContent.includes('send')) {
    issues.push({
      category: SecurityIssueCategory.InsecureAuth,
      description: 'Potential insecure password transmission',
      filePath: '',
      severity: 'critical',
      recommendation: 'Use TLS/SSL for all password transmissions',
    })
  }

  // Framework-specific checks
  if (framework === 'fastapi' && lowerContent.includes('oauth2')) {
    // OAuth2 is good, but check for proper implementation
  }

  if (framework === 'spring_boot' && lowerContent.includes('insecure')) {
    issues.push({
      category: SecurityIssueCategory.InsecureAuth,
      description: 'Insecurity flag in Spring Boot configuration',
      filePath: '',
      severity: 'high',
      recommendation: 'Review security configuration',
    })
  }

  return issues
}

/** Determines the overall risk level from detected issues. */
function determineRiskLevel(issues: SecurityIssue[]): 'low' | 'medium' | 'high' | 'critical' {
  if (issues.length === 0) {
    return 'low'
  }

  const criticalCount = issues.filter((i) => i.severity === 'critical').length
  const highCount = issues.filter((i) => i.severity === 'high').length

  if (criticalCount > 0) {
    return 'critical'
  }
  if (highCount > 0) {
    return 'high'
  }
  if (issues.length >= 3) {
    return 'medium'
  }
  return 'low'
}

/** Validates a generation result for security issues. */
export function validateGenerationSecurity(
  files: Array<{
    filePath: string
    content: string
    language: string
    framework: string | null
  }>
): {
  overallSafe: boolean
  allResults: SecurityAnalysisResult[]
  totalCritical: number
  totalHigh: number
} {
  const allResults: SecurityAnalysisResult[] = []
  let totalCritical = 0
  let totalHigh = 0

  for (const file of files) {
    const result = analyzeCodeSecurity(
      file.filePath,
      file.content,
      file.language,
      file.framework
    )
    allResults.push(result)

    if (result.riskLevel === 'critical') {
      totalCritical++
    }
    if (result.riskLevel === 'high') {
      totalHigh++
    }
  }

  const overallSafe = totalCritical === 0 && totalHigh === 0

  return {
    overallSafe,
    allResults,
    totalCritical,
    totalHigh,
  }
}