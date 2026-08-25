import { prisma } from './prisma'
import { asignarMedico } from './asignacion'

describe('asignarMedico', () => {
  const ids: { organizacionId?: string; medicoIds: string[]; casoIds: string[] } = { medicoIds: [], casoIds: [] }
  let preexistingMedicoIds: string[] = []

  beforeEach(async () => {
    // This project's local dev database is shared across worktrees/sessions
    // (not reset per test run), so médicos seeded in an earlier phase
    // (e.g. medico1@conectamente.cl) are always present. Temporarily
    // deactivate every pre-existing médico so asignarMedico() only ever
    // sees the médicos each test creates for itself — restored in afterEach.
    const preexisting = await prisma.usuario.findMany({
      where: { rol: 'medico', activo: true },
      select: { id: true },
    })
    preexistingMedicoIds = preexisting.map((m: any) => m.id)
    if (preexistingMedicoIds.length > 0) {
      await prisma.usuario.updateMany({
        where: { id: { in: preexistingMedicoIds } },
        data: { activo: false },
      })
    }
  })

  afterEach(async () => {
    try {
      if (ids.casoIds.length > 0) {
        await prisma.caso.deleteMany({ where: { id: { in: ids.casoIds } } })
      }
      if (ids.medicoIds.length > 0) {
        await prisma.usuario.deleteMany({ where: { id: { in: ids.medicoIds } } })
      }
      if (ids.organizacionId) {
        await prisma.organizacion.delete({ where: { id: ids.organizacionId } })
      }
    } finally {
      // Always restore pre-existing médicos to active, even if a delete
      // above throws — otherwise a mid-teardown failure would leave the
      // shared dev database's real médicos deactivated for every other
      // worktree/session, the exact pollution this test isolation exists
      // to prevent.
      ids.casoIds = []
      ids.medicoIds = []
      ids.organizacionId = undefined

      if (preexistingMedicoIds.length > 0) {
        await prisma.usuario.updateMany({
          where: { id: { in: preexistingMedicoIds } },
          data: { activo: true },
        })
      }
      preexistingMedicoIds = []
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
