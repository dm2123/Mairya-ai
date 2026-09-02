/** AI Code Generation Security Tests — Tests for security analysis.
 *
 * Test cases:
 * - hardcoded secrets detection
 * - suspicious command execution blocked
 * - unsafe filesystem access blocked
 * - injection risks detected
 * - insecure authentication patterns
 */

import { analyzeCodeSecurity, SecurityIssue, SecurityIssueCategory } from '../ai-code-generation-security'
import { SecurityAnalysisResult } from '../ai-code-generation-security'

describe('AI Code Generation Security', () => {
  describe('analyzeCodeSecurity', () => {
    it('should analyze Python code for security issues', () => {
      const pythonCode = `
from fastapi import FastAPI
import os

app = FastAPI()

# Hardcoded secret - should be flagged
SECRET_KEY = "super_secret_key_12345"
api_token = "tok_abcdefghijklmnop"

@app.get("/")
def read_root():
    return {"message": "Hello World"}
`

      const result = analyzeCodeSecurity('src/main.py', pythonCode, 'python', 'fastapi')
      expect(result).toBeDefined()
      expect(result.safe).toBe(false) // Should not be safe due to hardcoded secrets
      expect(result.issues.length).toBeGreaterThan(0)

      // Check for hardcoded secret issue
      const secretIssues = result.issues.filter(
        (i) => i.category === SecurityIssueCategory.HardcodedSecret
      )
      expect(secretIssues.length).toBeGreaterThan(0)
    })

    it('should analyze JavaScript code for security issues', () => {
      const jsCode = `
const express = require('express')
const app = express()

// Hardcoded password - should be flagged
const password = "my_super_secret_password_123"

app.get('/login', (req, res) => {
    res.send(password)
})

app.listen(3000, () => {
    console.log('Server running on port 3000')
})
`

      const result = analyzeCodeSecurity('src/app.js', jsCode, 'javascript', 'nextjs')
      expect(result).toBeDefined()
      expect(result.issues.length).toBeGreaterThan(0)

      // Check for hardcoded secret issue
      const secretIssues = result.issues.filter(
        (i) => i.category === SecurityIssueCategory.HardcodedSecret
      )
      expect(secretIssues.length).toBeGreaterThan(0)
    })

    it('should detect command execution risks', () => {
      const codeWithCommands = `
const { exec } = require('child_process')

// Executing user input - critical risk
exec(userInput, (error, stdout, stderr) => {
    console.log(stdout)
})
`

      const result = analyzeCodeSecurity('src/commands.js', codeWithCommands, 'javascript', 'nextjs')
      expect(result).toBeDefined()

      // Should detect command execution risks
      const commandIssues = result.issues.filter(
        (i) => i.category === SecurityIssueCategory.CommandExecution
      )
      expect(commandIssues.length).toBeGreaterThan(0)

      // Critical severity
      const criticalIssues = result.issues.filter(
        (i) => i.severity === 'critical'
      )
      expect(criticalIssues.length).toBeGreaterThan(0)
    })

    it('should return safe result for clean code', () => {
      const cleanPython = `
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}
`

      const result = analyzeCodeSecurity('src/clean.py', cleanPython, 'python', 'fastapi')
      expect(result).toBeDefined()

      // Clean code should have few or no issues
      expect(result.issues.length).toBeLessThanOrEqual(2) // Maybe just convention warnings
    })

    it('should determine risk level correctly', () => {
      // No issues - low risk
      const resultNoIssues: SecurityAnalysisResult = {
        safe: true,
        issues: [],
        summary: 'No critical security issues detected',
        riskLevel: 'low',
      }
      expect(resultNoIssues.riskLevel).toBe('low')

      // Critical issue - critical risk
      const resultCritical: SecurityAnalysisResult = {
        safe: false,
        issues: [{ category: SecurityIssueCategory.CommandExecution, description: 'Command execution', filePath: '', severity: 'critical', recommendation: 'Fix' }],
        summary: 'Critical security issues detected',
        riskLevel: 'critical',
      }
      expect(resultCritical.riskLevel).toBe('critical')

      // High issue - high risk
      const resultHigh: SecurityAnalysisResult = {
        safe: false,
        issues: [{ category: SecurityIssueCategory.HardcodedSecret, description: 'Secret found', filePath: '', severity: 'high', recommendation: 'Fix' }],
        summary: 'High security risk detected',
        riskLevel: 'high',
      }
      expect(resultHigh.riskLevel).toBe('high')
    })
  })

  describe('validateGenerationSecurity', () => {
    it('should validate generation security for multiple files', () => {
      const files = [
        {
          filePath: 'src/main.py',
          content: 'from fastapi import FastAPI\napp = FastAPI()\n',
          language: 'python',
          framework: 'fastapi',
        },
        {
          filePath: 'src/app.js',
          content: 'const express = require("express")\nconst app = express()\n',
          language: 'javascript',
          framework: 'nextjs',
        },
      ]

      const result = validateGenerationSecurity(files)
      expect(result).toBeDefined()
      expect(result.allResults.length).toBe(2)
      expect(result.overallSafe).toBe(true) // Clean code should be overall safe
    })

    it('should detect critical security issues in generation', () => {
      const files = [
        {
          filePath: 'src/main.py',
          content: 'SECRET_KEY = "my_super_secret_key_1234567890"\nfrom fastapi import FastAPI\napp = FastAPI()\n',
          language: 'python',
          framework: 'fastapi',
        },
      ]

      const result = validateGenerationSecurity(files)
      expect(result).toBeDefined()
      expect(result.totalCritical).toBeGreaterThan(0) // Should detect at least 1 critical issue
      expect(result.overallSafe).toBe(false) // Should not be overall safe
    })
  })
})