import { prisma } from './prisma'

describe('Fase 1 models', () => {
  const ids: {
    organizacionId?: string
    medicoId?: string
    clienteId?: string
    casoId?: string
    informeId?: string
  } = {}

  afterAll(async () => {
    if (ids.casoId) {
      await prisma.logDescarga.deleteMany({ where: { informeId: ids.informeId } })
      await prisma.informe.deleteMany({ where: { casoId: ids.casoId } })
      await prisma.sesion.deleteMany({ where: { casoId: ids.casoId } })
      await prisma.caso.delete({ where: { id: ids.casoId } })
    }
    if (ids.medicoId) await prisma.usuario.delete({ where: { id: ids.medicoId } })
    if (ids.clienteId) await prisma.usuario.delete({ where: { id: ids.clienteId } })
    if (ids.organizacionId) await prisma.organizacion.delete({ where: { id: ids.organizacionId } })
    await prisma.$disconnect()
  })

  it('creates and links Organizacion, Usuario (medico/cliente), Caso, Sesion, Informe, and LogDescarga', async () => {
    const organizacion = await prisma.organizacion.create({
      data: {
        nombre: `Test Org ${Date.now()}`,
        tipo: 'isapre',
        plazoSlaDias: 10,
      },
    })
    ids.organizacionId = organizacion.id

    const medico = await prisma.usuario.create({
      data: {
        nombre: 'Test Medico',
        email: `test-medico-${Date.now()}@example.com`,
        passwordHash: 'irrelevant-for-this-test',
        rol: 'medico',
        especialidad: 'psiquiatria',
      },
    })
    ids.medicoId = medico.id

    const cliente = await prisma.usuario.create({
      data: {
        nombre: 'Test Cliente',
        email: `test-cliente-${Date.now()}@example.com`,
        passwordHash: 'irrelevant-for-this-test',
        rol: 'cliente',
        organizacionId: organizacion.id,
      },
    })
    ids.clienteId = cliente.id

    const caso = await prisma.caso.create({
      data: {
        organizacionId: organizacion.id,
        medicoId: medico.id,
        estado: 'recibido',
        tipoLicencia: 'licencia comun',
        fechaIngreso: new Date(),
        fechaLimite: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        prioridad: 'normal',
      },
    })
    ids.casoId = caso.id

    const sesion = await prisma.sesion.create({
      data: {
        casoId: caso.id,
        fechaProgramada: new Date(),
        estado: 'agendada',
      },
    })

    const informe = await prisma.informe.create({
      data: {
        casoId: caso.id,
        archivoUrl: 'https://example.com/informe.pdf',
        generadoPor: medico.id,
        firmaProveedor: 'firmaweb',
      },
    })
    ids.informeId = informe.id

    const logDescarga = await prisma.logDescarga.create({
      data: {
        informeId: informe.id,
        usuarioId: cliente.id,
      },
    })

    const found = await prisma.caso.findUnique({
      where: { id: caso.id },
      include: { organizacion: true, medico: true, sesion: true, informe: true },
    })

    expect(found?.organizacion.id).toBe(organizacion.id)
    expect(found?.medico?.id).toBe(medico.id)
    expect(found?.sesion?.id).toBe(sesion.id)
    expect(found?.informe?.id).toBe(informe.id)
    expect(logDescarga.informeId).toBe(informe.id)
    expect(logDescarga.usuarioId).toBe(cliente.id)
  })

  it('rejects creating a Caso with a nonexistent organizacionId', async () => {
    await expect(
      prisma.caso.create({
        data: {
          organizacionId: 'does-not-exist',
          estado: 'recibido',
          tipoLicencia: 'licencia comun',
          fechaIngreso: new Date(),
          fechaLimite: new Date(),
          prioridad: 'normal',
        },
      })
    ).rejects.toThrow()
  })
})
