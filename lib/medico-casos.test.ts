import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { prisma } from './prisma'
import { listarCasosMedico } from './medico-casos'

describe('listarCasosMedico', () => {
  const ids: { medicoId?: string; otroMedicoId?: string; organizacionId?: string; casoIds: string[] } = { casoIds: [] }

  beforeAll(async () => {
    const organizacion = await prisma.organizacion.create({
      data: { nombre: `Test Org MedicoCasos ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    ids.organizacionId = organizacion.id

    const medico = await prisma.usuario.create({
      data: {
        nombre: 'Medico Test 1',
        email: `medico-test-1-${Date.now()}@example.com`,
        passwordHash: 'irrelevant',
        rol: 'medico',
        especialidad: 'medicina_general',
      },
    })
    ids.medicoId = medico.id

    const otroMedico = await prisma.usuario.create({
      data: {
        nombre: 'Medico Test 2',
        email: `medico-test-2-${Date.now()}@example.com`,
        passwordHash: 'irrelevant',
        rol: 'medico',
        especialidad: 'medicina_general',
      },
    })
    ids.otroMedicoId = otroMedico.id

    async function crearCaso(medicoId: string, estado: 'recibido' | 'en_revision' | 'entregado') {
      const caso = await prisma.caso.create({
        data: {
          organizacionId: ids.organizacionId!,
          medicoId,
          estado,
          rutEvaluado: '12345678-5',
          nombreEvaluado: 'Evaluado Test',
          tipoLicencia: 'licencia comun',
          fechaEmisionLicencia: new Date(),
          fechaIngreso: new Date(),
          fechaLimite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          prioridad: 'normal',
        },
      })
      ids.casoIds.push(caso.id)
      return caso
    }

    await crearCaso(ids.medicoId!, 'en_revision')
    await crearCaso(ids.medicoId!, 'entregado')
    await crearCaso(ids.otroMedicoId!, 'en_revision')
  })

  afterAll(async () => {
    for (const casoId of ids.casoIds) await prisma.caso.delete({ where: { id: casoId } })
    if (ids.medicoId) await prisma.usuario.delete({ where: { id: ids.medicoId } })
    if (ids.otroMedicoId) await prisma.usuario.delete({ where: { id: ids.otroMedicoId } })
    if (ids.organizacionId) await prisma.organizacion.delete({ where: { id: ids.organizacionId } })
    await prisma.$disconnect()
  })

  it('returns all casos assigned to the given médico, ordered by fecha_limite ascending', async () => {
    const casos = await listarCasosMedico(ids.medicoId!)
    expect(casos).toHaveLength(2)
    expect(casos.every((c) => c.medicoId === ids.medicoId)).toBe(true)
    expect(casos[0].fechaLimite <= casos[1].fechaLimite).toBe(true)
  })

  it('returns an empty array for a médico with no casos assigned', async () => {
    const nuevoMedico = await prisma.usuario.create({
      data: {
        nombre: 'Medico Sin Casos',
        email: `medico-sin-casos-${Date.now()}@example.com`,
        passwordHash: 'irrelevant',
        rol: 'medico',
        especialidad: 'medicina_general',
      },
    })

    const casos = await listarCasosMedico(nuevoMedico.id)
    expect(casos).toEqual([])

    await prisma.usuario.delete({ where: { id: nuevoMedico.id } })
  })
})
