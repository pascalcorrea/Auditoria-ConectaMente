#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'

interface IntegrationCheck {
  name: string
  required: boolean
  envVars: string[]
  endpoint?: string
}

const checks: IntegrationCheck[] = [
  {
    name: 'Daily.co - Video Sesiones',
    required: true,
    envVars: ['DAILY_API_KEY'],
    endpoint: 'https://api.daily.co/v1/rooms',
  },
  {
    name: 'Brevo - Email',
    required: false,
    envVars: ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL'],
    endpoint: 'https://api.brevo.com/v3/smtp/email',
  },
  {
    name: 'FirmaWeb - Firma Electrónica',
    required: false,
    envVars: ['FIRMA_API_KEY', 'FIRMA_API_URL'],
    endpoint: process.env.FIRMA_API_URL,
  },
  {
    name: 'Database',
    required: true,
    envVars: ['DATABASE_URL'],
  },
  {
    name: 'NextAuth',
    required: true,
    envVars: ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
  },
  {
    name: 'Jobs (Cron)',
    required: false,
    envVars: ['CRON_SECRET', 'INTERNAL_SECRET'],
  },
]

function checkIntegration(check: IntegrationCheck): {
  status: 'ok' | 'warning' | 'error'
  message: string
} {
  const missing = check.envVars.filter((v) => !process.env[v])

  if (missing.length === 0) {
    return { status: 'ok', message: `✅ Configurado (${check.envVars.join(', ')})` }
  }

  if (check.required) {
    return {
      status: 'error',
      message: `❌ FALTA configurar: ${missing.join(', ')}`,
    }
  }

  return {
    status: 'warning',
    message: `⚠️  Opcional - falta: ${missing.join(', ')}`,
  }
}

async function validateEndpoint(check: IntegrationCheck): Promise<boolean> {
  if (!check.endpoint || !process.env.DAILY_API_KEY) return true

  try {
    const response = await fetch(check.endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
    })
    return response.ok || response.status < 500
  } catch {
    return false
  }
}

async function main() {
  console.log('\n🔍 Validando integraciones de Fase 8\n')

  let errorCount = 0
  let warningCount = 0

  for (const check of checks) {
    const result = checkIntegration(check)
    console.log(`${check.name}`)
    console.log(`  ${result.message}`)

    if (result.status === 'error') errorCount++
    if (result.status === 'warning') warningCount++
  }

  console.log('\n' + '='.repeat(50))

  if (errorCount > 0) {
    console.log(`\n❌ ${errorCount} error(es) crítico(s)`)
    console.log('Configura las variables en .env antes de deployer')
    process.exit(1)
  }

  if (warningCount > 0) {
    console.log(`\n⚠️  ${warningCount} advertencia(s)`)
    console.log('Las integraciones opcionales están deshabilitadas')
  }

  console.log('\n✅ Validación completada correctamente\n')
}

main().catch(console.error)
