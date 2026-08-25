#!/usr/bin/env tsx

const STAGING_URL = process.env.STAGING_URL || 'https://staging.conectamente.cl'

interface HealthResponse {
  status: string
  version: string
  environment: string
  integrations: {
    daily: string
    brevo: string
    firma: string
  }
}

async function checkHealth(): Promise<boolean> {
  try {
    console.log(`\n🏥 Health Check: ${STAGING_URL}\n`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(`${STAGING_URL}/api/health`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      console.error(`❌ HTTP ${res.status}`)
      return false
    }

    const health = (await res.json()) as HealthResponse

    console.log(`Status:      ${health.status}`)
    console.log(`Version:     ${health.version}`)
    console.log(`Environment: ${health.environment}`)
    console.log(`\nIntegrations:`)
    console.log(`  Daily.co:    ${health.integrations.daily}`)
    console.log(`  Brevo:       ${health.integrations.brevo}`)
    console.log(`  FirmaWeb:    ${health.integrations.firma}`)

    const healthy = health.status === 'ok'
    console.log(`\n${healthy ? '✅ Staging OK' : '⚠️  Staging Degraded'}\n`)

    return healthy
  } catch (error) {
    console.error(
      `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    return false
  }
}

async function smokeTests(): Promise<boolean> {
  console.log('🧪 Running Smoke Tests\n')

  const tests = [
    {
      name: 'API Health',
      url: '/api/health',
      expectedStatus: 200,
    },
  ]

  let passed = 0
  for (const test of tests) {
    try {
      const res = await fetch(`${STAGING_URL}${test.url}`)
      if (res.status === test.expectedStatus) {
        console.log(`✅ ${test.name}`)
        passed++
      } else {
        console.log(`❌ ${test.name} (HTTP ${res.status})`)
      }
    } catch (error) {
      console.log(`❌ ${test.name} (${error})`)
    }
  }

  console.log(`\n${passed}/${tests.length} tests passed\n`)
  return passed === tests.length
}

async function main() {
  const healthy = await checkHealth()
  const smokeOk = await smokeTests()

  if (!healthy || !smokeOk) {
    process.exit(1)
  }

  console.log('🚀 Staging ready for testing\n')
}

main().catch(console.error)
