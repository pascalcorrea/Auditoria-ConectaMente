import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { prisma } from './prisma'

describe('prisma client', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('connects to the database and can create + read a Usuario', async () => {
    const usuario = await prisma.usuario.create({
      data: {
        nombre: 'Test Backoffice',
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'irrelevant-for-this-test',
        rol: 'backoffice',
      },
    })

    const found = await prisma.usuario.findUnique({ where: { id: usuario.id } })
    expect(found?.email).toBe(usuario.email)

    await prisma.usuario.delete({ where: { id: usuario.id } })
  })
})
