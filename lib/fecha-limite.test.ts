import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { calcularFechaLimite } from './fecha-limite'

describe('calcularFechaLimite', () => {
  it('adds plazoSlaDias days to fechaIngreso', () => {
    const fechaIngreso = new Date('2026-01-01T00:00:00.000Z')
    const resultado = calcularFechaLimite(fechaIngreso, 10)
    expect(resultado.toISOString()).toBe('2026-01-11T00:00:00.000Z')
  })

  it('handles a month rollover correctly', () => {
    const fechaIngreso = new Date('2026-01-25T00:00:00.000Z')
    const resultado = calcularFechaLimite(fechaIngreso, 10)
    expect(resultado.toISOString()).toBe('2026-02-04T00:00:00.000Z')
  })
})
