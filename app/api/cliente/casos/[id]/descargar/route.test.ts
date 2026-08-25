import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET } from './route'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

const mockedGetServerSession = getServerSession as unknown as ReturnType<typeof vi.fn>

describe('GET /api/cliente/casos/[id]/descargar', () => {
  const ids: { organizacionId?: string; otraOrganizacionId?: string; medicoId?: string; clienteId?: string } = {}

  beforeAll(async () => {
    const organizacion = await prisma.organizacion.create({
      data: { nombre: `Test Org Descarga ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    ids.organizacionId = organizacion.id

    const otraOrganizacion = await prisma.organizacion.create({
      data: { nombre: `Test Otra Org Descarga ${Date.now()}`, tipo: 'empresa', plazoSlaDias: 10 },
    })
    ids.otraOrganizacionId = otraOrganizacion.id

    const medico = await prisma.usuario.create({
      data: {
        nombre: 'Medico Test Descarga',
        email: `medico-descarga-${Date.now()}@example.com`,
        passwordHash: 'irrelevant-for-this-test',
        rol: 'medico',
      },
    })
    ids.medicoId = medico.id

    const cliente = await prisma.usuario.create({
      data: {
        nombre: 'Cliente Test Descarga',
        email: `cliente-descarga-${Date.now()}@example.com`,
        passwordHash: 'irrelevant-for-this-test',
        rol: 'cliente',
        organizacionId: ids.organizacionId,
      },
    })
    ids.clienteId = cliente.id
  })

  afterAll(async () => {
    if (ids.organizacionId) {
      await prisma.usuario.deleteMany({ where: { organizacionId: ids.organizacionId } })
      await prisma.organizacion.delete({ where: { id: ids.organizacionId } })
    }
    if (ids.otraOrganizacionId) {
      await prisma.usuario.deleteMany({ where: { organizacionId: ids.otraOrganizacionId } })
      await prisma.organizacion.delete({ where: { id: ids.otraOrganizacionId } })
    }
    if (ids.medicoId && !ids.organizacionId) await prisma.usuario.delete({ where: { id: ids.medicoId } })
    await prisma.$disconnect()
  })

  async function crearCasoConInforme(organizacionId: string, estado: 'entregado' | 'recibido') {
    const caso = await prisma.caso.create({
      data: {
        organizacionId,
        medicoId: ids.medicoId,
        estado,
        rutEvaluado: '12345678-5',
        nombreEvaluado: 'Evaluado Descarga Test',
        tipoLicencia: 'licencia comun',
        fechaEmisionLicencia: new Date(),
        fechaIngreso: new Date(),
        fechaLimite: new Date(),
        prioridad: 'normal',
      },
    })

    await prisma.informe.create({
      data: {
        casoId: caso.id,
        archivoUrl: 'https://example.com/borrador.pdf',
        archivoFirmadoUrl: 'https://example.com/firmado.pdf',
        generadoPor: ids.medicoId!,
        firmaProveedor: 'firmaweb',
      },
    })

    return caso
  }

  async function limpiarCaso(casoId: string) {
    await prisma.logDescarga.deleteMany({ where: { informe: { casoId } } })
    await prisma.informe.deleteMany({ where: { casoId } })
    await prisma.caso.delete({ where: { id: casoId } })
  }

  it('redirects to archivoFirmadoUrl and creates a LogDescarga row for the owning organización, entregado caso', async () => {
    const caso = await crearCasoConInforme(ids.organizacionId!, 'entregado')

    mockedGetServerSession.mockResolvedValue({
      user: { id: ids.clienteId, rol: 'cliente', organizacionId: ids.organizacionId },
    })

    const request = new NextRequest(`http://localhost/api/cliente/casos/${caso.id}/descargar`)
    const response = await GET(request, { params: Promise.resolve({ id: caso.id }) })

    expect(response.status).toBeGreaterThanOrEqual(300)
    expect(response.status).toBeLessThan(400)
    expect(response.headers.get('location')).toBe('https://example.com/firmado.pdf')

    const informe = await prisma.informe.findUnique({ where: { casoId: caso.id } })
    const descargas = await prisma.logDescarga.findMany({ where: { informeId: informe!.id } })
    expect(descargas).toHaveLength(1)
    expect(descargas[0].usuarioId).toBe(ids.clienteId)

    await limpiarCaso(caso.id)
  })

  it('returns 404 for a caso belonging to a different organización', async () => {
    const caso = await crearCasoConInforme(ids.otraOrganizacionId!, 'entregado')

    mockedGetServerSession.mockResolvedValue({
      user: { id: 'cliente-test-id', rol: 'cliente', organizacionId: ids.organizacionId },
    })

    const request = new NextRequest(`http://localhost/api/cliente/casos/${caso.id}/descargar`)
    const response = await GET(request, { params: Promise.resolve({ id: caso.id }) })

    expect(response.status).toBe(404)

    await limpiarCaso(caso.id)
  })

  it('returns 404 without creating a LogDescarga when the caso is not entregado yet', async () => {
    const caso = await crearCasoConInforme(ids.organizacionId!, 'recibido')

    mockedGetServerSession.mockResolvedValue({
      user: { id: 'cliente-test-id', rol: 'cliente', organizacionId: ids.organizacionId },
    })

    const request = new NextRequest(`http://localhost/api/cliente/casos/${caso.id}/descargar`)
    const response = await GET(request, { params: Promise.resolve({ id: caso.id }) })

    expect(response.status).toBe(404)

    const informe = await prisma.informe.findUnique({ where: { casoId: caso.id } })
    const descargas = await prisma.logDescarga.findMany({ where: { informeId: informe!.id } })
    expect(descargas).toHaveLength(0)

    await limpiarCaso(caso.id)
  })

  it('returns 403 when there is no session', async () => {
    mockedGetServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/cliente/casos/some-id/descargar')
    const response = await GET(request, { params: Promise.resolve({ id: 'some-id' }) })

    expect(response.status).toBe(403)
  })

  it('returns 403 for a valid session with the wrong rol', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'backoffice-test-id', rol: 'backoffice', organizacionId: null },
    })

    const request = new NextRequest('http://localhost/api/cliente/casos/some-id/descargar')
    const response = await GET(request, { params: Promise.resolve({ id: 'some-id' }) })

    expect(response.status).toBe(403)
  })
})
