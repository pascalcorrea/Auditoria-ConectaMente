#!/usr/bin/env tsx

import { execSync } from 'child_process'

interface CheckResult {
  name: string
  passed: boolean
  message: string
}

const results: CheckResult[] = []

function runCheck(name: string, command: string, expectedOutput?: string): boolean {
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' })
    const passed = expectedOutput ? output.includes(expectedOutput) : output.trim().length > 0
    results.push({ name, passed, message: passed ? 'OK' : 'FAILED' })
    return passed
  } catch (error) {
    results.push({ name, passed: false, message: String(error).slice(0, 100) })
    return false
  }
}

console.log('\n🔍 Pre-Deployment Checks\n')

// Code Quality
console.log('📋 Code Quality')
runCheck('Build', 'npm run build', 'built successfully')
runCheck('Tests', 'npm run test', 'passed')
runCheck('Lint', 'npm run lint')
runCheck('Security audit', 'npm audit --production', '')

// Database
console.log('\n🗄️  Database')
runCheck('Prisma schema valid', 'npx prisma validate')
runCheck('Migrations pending', 'npx prisma migrate status')

// Environment
console.log('\n⚙️  Environment')
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'DAILY_API_KEY',
  'BREVO_API_KEY',
]

let envCheckPassed = true
for (const envVar of requiredEnvVars) {
  const exists = process.env[envVar] ? true : false
  results.push({
    name: `ENV: ${envVar}`,
    passed: exists,
    message: exists ? 'configured' : 'MISSING',
  })
  if (!exists) envCheckPassed = false
}

// Git
console.log('\n📦 Git')
runCheck('Working directory clean', 'git status --porcelain')
runCheck('On main branch', 'git rev-parse --abbrev-ref HEAD', 'main')
runCheck('All commits pushed', 'git diff origin/main --quiet')

// Report
console.log('\n' + '='.repeat(50))
console.log('\n📊 Results\n')

let passCount = 0
let failCount = 0

for (const result of results) {
  const icon = result.passed ? '✅' : '❌'
  console.log(`${icon} ${result.name}: ${result.message}`)
  if (result.passed) passCount++
  else failCount++
}

console.log(`\n${passCount} passed, ${failCount} failed\n`)

if (failCount > 0) {
  console.log('❌ Fix issues before deploying to production\n')
  process.exit(1)
}

console.log('✅ Ready for production deployment\n')
