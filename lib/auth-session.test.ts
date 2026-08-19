import { authOptions } from './auth'
import { prisma } from './prisma'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

describe('authOptions callbacks propagate session.user.id', () => {
  it('session callback sets session.user.id from token.sub', async () => {
    const sessionCallback = authOptions.callbacks!.session!
    const session = { user: {}, expires: '2099-01-01' } as Parameters<typeof sessionCallback>[0]['session']
    const token = { sub: 'u1', rol: 'cliente', organizacionId: 'org-1' } as Parameters<typeof sessionCallback>[0]['token']

    const result = await sessionCallback({ session, token } as Parameters<typeof sessionCallback>[0])

    expect(result.user.id).toBe('u1')
  })
})

describe('authOptions jwt callback backfills organizacionId for pre-existing tokens', () => {
  let usuarioId: string

  beforeAll(async () => {
    const usuario = await prisma.usuario.create({
      data: {
        nombre: 'Backfill Test',
        email: `backfill-test-${Date.now()}@example.com`,
        passwordHash: 'irrelevant-for-this-test',
        rol: 'cliente',
        organizacionId: null,
      },
    })
    usuarioId = usuario.id
  })

  afterAll(async () => {
    try {
      await prisma.usuario.delete({ where: { id: usuarioId } })
    } catch (e) {
      // Cleanup if test changes — ignore cascade errors
    }
    await prisma.$disconnect()
  })

  it('looks up organizacionId/rol by token.sub when organizacionId is undefined (no user object, i.e. not sign-in)', async () => {
    const jwtCallback = authOptions.callbacks!.jwt!
    const token = { sub: usuarioId, rol: 'cliente' } as Parameters<typeof jwtCallback>[0]['token']

    const result = await jwtCallback({ token, user: undefined } as unknown as Parameters<typeof jwtCallback>[0])

    expect(result.organizacionId).toBeNull()
    expect(result.rol).toBe('cliente')
  })

  it('does not re-query when organizacionId is already null (legitimate, not missing)', async () => {
    const jwtCallback = authOptions.callbacks!.jwt!
    const spy = vi.spyOn(prisma.usuario, 'findUnique')
    const token = {
      sub: usuarioId,
      rol: 'backoffice',
      organizacionId: null,
    } as Parameters<typeof jwtCallback>[0]['token']

    const result = await jwtCallback({ token, user: undefined } as unknown as Parameters<typeof jwtCallback>[0])

    expect(result.organizacionId).toBeNull()
    expect(result.rol).toBe('backoffice')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('sets organizacionId to null (not left undefined) when token.sub matches no Usuario, so the lookup does not repeat on every subsequent request', async () => {
    const jwtCallback = authOptions.callbacks!.jwt!
    const token = {
      sub: 'does-not-exist-in-the-db',
      rol: 'cliente',
    } as Parameters<typeof jwtCallback>[0]['token']

    const result = await jwtCallback({ token, user: undefined } as unknown as Parameters<typeof jwtCallback>[0])

    expect(result.organizacionId).toBeNull()

    const spy = vi.spyOn(prisma.usuario, 'findUnique')
    await jwtCallback({ token: result, user: undefined } as unknown as Parameters<typeof jwtCallback>[0])
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
