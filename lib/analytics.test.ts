import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { describe, it, expect, vi } from 'vitest'
import { prisma } from './prisma'

vi.mock('./prisma', () => ({
  prisma: {
    caso: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    usuario: {
      findMany: vi.fn(),
    },
  },
}))

describe('getAnalyticsMetrics', () => {
  it('returns metrics object with all required fields', async () => {
    const { getAnalyticsMetrics } = await import('./analytics')

    vi.mocked(prisma.caso.count).mockResolvedValueOnce(10)
    vi.mocked(prisma.caso.count).mockResolvedValueOnce(5)
    vi.mocked(prisma.caso.count).mockResolvedValueOnce(3)
    vi.mocked(prisma.caso.count).mockResolvedValueOnce(2)
    vi.mocked(prisma.usuario.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.caso.findMany).mockResolvedValueOnce([])

    const metrics = await getAnalyticsMetrics()

    expect(metrics).toHaveProperty('totalCasos')
    expect(metrics).toHaveProperty('casosCompletados')
    expect(metrics).toHaveProperty('casosEnProgreso')
    expect(metrics).toHaveProperty('casosVencidos')
    expect(metrics).toHaveProperty('tiempoPromedio')
    expect(metrics).toHaveProperty('cargaMedicos')
  })

  it('cargaMedicos has correct structure', async () => {
    const { getAnalyticsMetrics } = await import('./analytics')

    vi.mocked(prisma.caso.count).mockResolvedValueOnce(10)
    vi.mocked(prisma.caso.count).mockResolvedValueOnce(5)
    vi.mocked(prisma.caso.count).mockResolvedValueOnce(3)
    vi.mocked(prisma.caso.count).mockResolvedValueOnce(2)
    vi.mocked(prisma.usuario.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.caso.findMany).mockResolvedValueOnce([])

    const metrics = await getAnalyticsMetrics()

    expect(Array.isArray(metrics.cargaMedicos)).toBe(true)
    expect(metrics.tiempoPromedio === null || typeof metrics.tiempoPromedio === 'number').toBe(true)
  })
})
