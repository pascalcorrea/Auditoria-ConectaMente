import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { prisma } from './prisma'

describe('Caso evaluado fields (Fase 2a)', () => {
  let organizacionId: string
  let casoId: string

  beforeAll(async () => {
    const organizacion = await prisma.organizacion.create({
      data: { nombre: `Test Org Fase2a ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    organizacionId = organizacion.id
  })

  afterAll(async () => {
    if (casoId) await prisma.caso.delete({ where: { id: casoId } })
    await prisma.organizacion.delete({ where: { id: organizacionId } })
    await prisma.$disconnect()
  })

  it('stores rutEvaluado, nombreEvaluado, and fechaEmisionLicencia on Caso', async () => {
    const caso = await prisma.caso.create({
      data: {
        organizacionId,
        rutEvaluado: '12345678-5',
        nombreEvaluado: 'Juan Pérez',
        tipoLicencia: 'licencia comun',
        fechaEmisionLicencia: new Date('2026-01-15'),
        fechaIngreso: new Date(),
        fechaLimite: new Date(),
        prioridad: 'normal',
      },
    })
    casoId = caso.id

    const found = await prisma.caso.findUnique({ where: { id: caso.id } })
    expect(found?.rutEvaluado).toBe('12345678-5')
    expect(found?.nombreEvaluado).toBe('Juan Pérez')
    expect(found?.fechaEmisionLicencia?.toISOString()).toBe(new Date('2026-01-15').toISOString())
  })
})
