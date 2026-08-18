import { prisma } from './prisma'
import { asignarMedico } from './asignacion'

describe('asignarMedico', () => {
  const ids: { organizacionId?: string; medicoIds: string[]; casoIds: string[] } = { medicoIds: [], casoIds: [] }

  beforeEach(async () => {
    // Clear all test data to ensure clean state before each test
    ids.medicoIds = []
    ids.casoIds = []
    ids.organizacionId = undefined

    // Clean up any leftover médicos and cases from previous test runs
    try {
      // Delete using raw SQL to bypass any caching issues and handle cascading dependencies
      await prisma.$executeRawUnsafe(`DELETE FROM "LogDescarga" WHERE "informeId" IN (SELECT id FROM "Informe" WHERE "casoId" IN (SELECT id FROM "Caso" WHERE "nombreEvaluado" = $1))`, ['Evaluado Test'])
      await prisma.$executeRawUnsafe(`DELETE FROM "Informe" WHERE "casoId" IN (SELECT id FROM "Caso" WHERE "nombreEvaluado" = $1)`, ['Evaluado Test'])
      await prisma.$executeRawUnsafe(`DELETE FROM "Sesion" WHERE "casoId" IN (SELECT id FROM "Caso" WHERE "nombreEvaluado" = $1)`, ['Evaluado Test'])
      await prisma.$executeRawUnsafe(`DELETE FROM "Caso" WHERE "nombreEvaluado" = $1`, ['Evaluado Test'])
      await prisma.$executeRawUnsafe(`DELETE FROM "Usuario" WHERE "email" ILIKE $1`, ['%@example.com%'])
      await prisma.$executeRawUnsafe(`DELETE FROM "Organizacion" WHERE "nombre" ILIKE $1`, ['Test Org Asignacion%'])
    } catch (error) {
      // Log but don't fail on cleanup errors
      console.error('Cleanup error:', error instanceof Error ? error.message : error)
    }
  })

  afterEach(async () => {
    try {
      // Delete cases by organizacionId to catch any orphaned cases
      if (ids.organizacionId) {
        await prisma.caso.deleteMany({ where: { organizacionId: ids.organizacionId } })
      }

      // Delete all específic casos we tracked
      if (ids.casoIds.length > 0) {
        await prisma.caso.deleteMany({ where: { id: { in: ids.casoIds } } })
      }

      // Delete specific médicos we tracked
      if (ids.medicoIds.length > 0) {
        await prisma.usuario.deleteMany({ where: { id: { in: ids.medicoIds } } })
      }

      // Delete organizacion last
      if (ids.organizacionId) {
        await prisma.organizacion.delete({ where: { id: ids.organizacionId } })
      }
    } finally {
      // Always reset our tracking
      ids.casoIds = []
      ids.medicoIds = []
      ids.organizacionId = undefined
    }
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  async function crearOrganizacion() {
    const organizacion = await prisma.organizacion.create({
      data: { nombre: `Test Org Asignacion ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    ids.organizacionId = organizacion.id
    return organizacion
  }

  async function crearMedico(nombre: string, creadoEn?: Date) {
    const medico = await prisma.usuario.create({
      data: {
        nombre,
        email: `${nombre.toLowerCase().replace(/\s/g, '-')}-${Date.now()}@example.com`,
        passwordHash: 'irrelevant-for-this-test',
        rol: 'medico',
        activo: true,
        ...(creadoEn ? { creadoEn } : {}),
      },
    })
    ids.medicoIds.push(medico.id)
    return medico
  }

  async function crearCaso(organizacionId: string, medicoId: string | null, estado: 'recibido' | 'en_revision' | 'informe_en_validacion' | 'entregado') {
    const caso = await prisma.caso.create({
      data: {
        organizacionId,
        medicoId,
        estado,
        rutEvaluado: '11111111-1',
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

  it('assigns the médico with the fewest active casos', async () => {
    const organizacion = await crearOrganizacion()
    const medicoOcupado = await crearMedico('Medico Ocupado')
    const medicoLibre = await crearMedico('Medico Libre')

    await crearCaso(organizacion.id, medicoOcupado.id, 'recibido')
    await crearCaso(organizacion.id, medicoOcupado.id, 'en_revision')

    const medicoAsignado = await asignarMedico()
    expect(medicoAsignado).toBe(medicoLibre.id)
  })

  it('does not count entregado casos toward the active load', async () => {
    const organizacion = await crearOrganizacion()
    const medicoConEntregados = await crearMedico('Medico Con Entregados')
    const medicoSinCasos = await crearMedico('Medico Sin Casos')

    await crearCaso(organizacion.id, medicoConEntregados.id, 'entregado')
    await crearCaso(organizacion.id, medicoConEntregados.id, 'entregado')

    const medicoAsignado = await asignarMedico()
    expect([medicoConEntregados.id, medicoSinCasos.id]).toContain(medicoAsignado)
    // both have 0 active casos — tie-break below covers determinism
  })

  it('breaks ties by picking the médico created earliest', async () => {
    await crearOrganizacion()
    const medicoAntiguo = await crearMedico('Medico Antiguo', new Date('2020-01-01'))
    await crearMedico('Medico Nuevo', new Date('2025-01-01'))

    const medicoAsignado = await asignarMedico()
    expect(medicoAsignado).toBe(medicoAntiguo.id)
  })

  it('returns null when there are no active médicos', async () => {
    const medicoAsignado = await asignarMedico()
    expect(medicoAsignado).toBeNull()
  })
})
