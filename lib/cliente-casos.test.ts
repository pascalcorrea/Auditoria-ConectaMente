import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { prisma } from './prisma'
import { listarCasosCliente } from './cliente-casos'

describe('listarCasosCliente', () => {
  const ids: { orgAId?: string; orgBId?: string; casoIds: string[] } = { casoIds: [] }

  beforeAll(async () => {
    const orgA = await prisma.organizacion.create({
      data: { nombre: `Test Org A ClienteCasos ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    ids.orgAId = orgA.id

    const orgB = await prisma.organizacion.create({
      data: { nombre: `Test Org B ClienteCasos ${Date.now()}`, tipo: 'isapre', plazoSlaDias: 10 },
    })
    ids.orgBId = orgB.id

    async function crearCaso(organizacionId: string, estado: 'recibido' | 'entregado') {
      const caso = await prisma.caso.create({
        data: {
          organizacionId,
          estado,
          rutEvaluado: '12345678-5',
          nombreEvaluado: 'Evaluado Test',
          tipoLicencia: 'licencia comun',
          fechaEmisionLicencia: new Date(),
          fechaIngreso: new Date(),
          fechaLimite: new Date(),
          prioridad: 'normal',
        },
      })
      ids.casoIds.push(caso.id)
      return caso
    }

    await crearCaso(orgA.id, 'recibido')
    await crearCaso(orgA.id, 'entregado')
    await crearCaso(orgB.id, 'recibido')
  })

  afterAll(async () => {
    for (const casoId of ids.casoIds) await prisma.caso.delete({ where: { id: casoId } })
    if (ids.orgAId) await prisma.organizacion.delete({ where: { id: ids.orgAId } })
    if (ids.orgBId) await prisma.organizacion.delete({ where: { id: ids.orgBId } })
    await prisma.$disconnect()
  })

  it('only returns casos belonging to the given organización', async () => {
    const casos = await listarCasosCliente(ids.orgAId!)
    expect(casos).toHaveLength(2)
    expect(casos.every((c) => c.organizacionId === ids.orgAId)).toBe(true)
  })

  it('filters by estado when provided', async () => {
    const casos = await listarCasosCliente(ids.orgAId!, 'entregado')
    expect(casos).toHaveLength(1)
    expect(casos[0].estado).toBe('entregado')
  })

  it('returns an empty array for an organización with no casos', async () => {
    const organizacionVacia = await prisma.organizacion.create({
      data: { nombre: `Test Org Vacia ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })

    const casos = await listarCasosCliente(organizacionVacia.id)
    expect(casos).toEqual([])

    await prisma.organizacion.delete({ where: { id: organizacionVacia.id } })
  })
})
