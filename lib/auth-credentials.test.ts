import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { verifyCredentials } from './auth-credentials'

describe('verifyCredentials', () => {
  const email = `auth-test-${Date.now()}@example.com`
  const plainPassword = 'correct-horse-battery-staple'

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(plainPassword, 10)
    await prisma.usuario.create({
      data: { nombre: 'Auth Test', email, passwordHash, rol: 'backoffice' },
    })
  })

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { email } })
    await prisma.$disconnect()
  })

  it('returns the usuario when the password is correct', async () => {
    const result = await verifyCredentials(email, plainPassword)
    expect(result?.email).toBe(email)
  })

  it('returns null when the password is wrong', async () => {
    const result = await verifyCredentials(email, 'wrong-password')
    expect(result).toBeNull()
  })

  it('returns null when the user does not exist', async () => {
    const result = await verifyCredentials('nobody@example.com', plainPassword)
    expect(result).toBeNull()
  })

  it('returns null when the usuario is inactive', async () => {
    await prisma.usuario.update({ where: { email }, data: { activo: false } })
    const result = await verifyCredentials(email, plainPassword)
    expect(result).toBeNull()
    await prisma.usuario.update({ where: { email }, data: { activo: true } })
  })
})
