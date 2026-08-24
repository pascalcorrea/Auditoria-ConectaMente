import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const version = process.env.npm_package_version || '0.1.0'
    const env = process.env.NODE_ENV || 'development'

    const health = {
      status: 'ok' as const,
      version,
      environment: env,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      integrations: {
        daily: process.env.DAILY_API_KEY ? 'configured' : 'missing',
        brevo: process.env.BREVO_API_KEY ? 'configured' : 'missing',
        firma: process.env.FIRMA_PROVIDER || 'mock',
      },
    }

    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      health.status = 'degraded'
    }

    return NextResponse.json(health, {
      status: health.status === 'ok' ? 200 : 503,
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
