import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from './prisma'

describe('Flujo completo: caso-a-caso', () => {
  let casoId: string
  let medicoId: string
  let clienteId: string
  let organizacionId: string

  beforeAll(async () => {
    // Setup: crear datos de prueba
    const org = await prisma.organizacion.create({
      data: {
        nombre: 'Test Org',
        tipo: 'isapre',
        plazoSlaDias: 10,
      },
    })

    const medico = await prisma.usuario.create({
      data: {
        nombre: 'Dr. Test',
        email: 'medico@test.com',
        rol: 'medico',
        especialidad: 'General',
        passwordHash: 'hash',
        activo: true,
      },
    })

    const cliente = await prisma.usuario.create({
      data: {
        nombre: 'Cliente Test',
        email: 'cliente@test.com',
        rol: 'cliente',
        organizacionId: org.id,
        passwordHash: 'hash',
        activo: true,
      },
    })

    const caso = await prisma.caso.create({
      data: {
        organizacionId: org.id,
        nombreEvaluado: 'Juan Pérez',
        rutEvaluado: '12345678-9',
        estado: 'recibido',
        tipoLicencia: 'Enfermedad',
        fechaEmisionLicencia: new Date(),
        fechaIngreso: new Date(),
        fechaLimite: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        prioridad: 'normal',
        medicoId: medico.id,
      },
    })

    casoId = caso.id
    medicoId = medico.id
    clienteId = cliente.id
    organizacionId = org.id
  })

  it('Flujo 1: Caso creado en estado recibido', async () => {
    const caso = await prisma.caso.findUnique({ where: { id: casoId } })
    expect(caso).toBeDefined()
    expect(caso?.estado).toBe('recibido')
    expect(caso?.medicoId).toBe(medicoId)
  })

  it('Flujo 2: Sesión agendada y transiciones de estado', async () => {
    const ahora = new Date()
    const sesion = await prisma.sesion.create({
      data: {
        casoId,
        fechaProgramada: new Date(ahora.getTime() + 2 * 60 * 60 * 1000),
        estado: 'agendada',
      },
    })

    expect(sesion).toBeDefined()
    expect(sesion.estado).toBe('agendada')

    const updated = await prisma.sesion.update({
      where: { id: sesion.id },
      data: {
        estado: 'realizada',
        medicoHoraConexion: ahora,
        medicoHoraDesconexion: new Date(ahora.getTime() + 30 * 60 * 1000),
        evaluadoHoraConexion: ahora,
        evaluadoHoraDesconexion: new Date(ahora.getTime() + 30 * 60 * 1000),
        duracionEfectivaSegundos: 30 * 60,
      },
    })

    expect(updated.estado).toBe('realizada')
  })

  it('Flujo 3: Informe generado y caso en validación', async () => {
    const informe = await prisma.informe.create({
      data: {
        casoId,
        archivoUrl: '/pdfs/test.pdf',
        generadoEn: new Date(),
        generadoPor: medicoId,
      },
    })

    const casoActualizado = await prisma.caso.update({
      where: { id: casoId },
      data: { estado: 'informe_en_validacion' },
    })

    expect(informe).toBeDefined()
    expect(casoActualizado.estado).toBe('informe_en_validacion')
  })

  it('Flujo 4: Informe firmado y caso entregado', async () => {
    const informe = await prisma.informe.findUnique({
      where: { casoId },
    })

    if (informe) {
      const firmado = await prisma.informe.update({
        where: { id: informe.id },
        data: {
          firmaTimestamp: new Date(),
          firmaProveedor: 'otro',
          archivoFirmadoUrl: '/pdfs/test-signed.pdf',
        },
      })

      const casoFinal = await prisma.caso.update({
        where: { id: casoId },
        data: { estado: 'entregado' },
      })

      expect(firmado.archivoFirmadoUrl).toBeDefined()
      expect(casoFinal.estado).toBe('entregado')
    }
  })

  afterAll(async () => {
    // Guard: an unset casoId would make deleteMany's `where` unfiltered and
    // wipe every row in the table — bail out if setup didn't actually run.
    if (!casoId) return

    // Cleanup — children first, FKs to Caso/Usuario/Organizacion have no cascade delete
    await prisma.informe.deleteMany({ where: { casoId } })
    await prisma.sesion.deleteMany({ where: { casoId } })
    await prisma.caso.deleteMany({ where: { id: casoId } })
    await prisma.usuario.deleteMany({ where: { id: { in: [medicoId, clienteId] } } })
    await prisma.organizacion.deleteMany({ where: { id: organizacionId } })
  })
})
