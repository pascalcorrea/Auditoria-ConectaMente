import { authOptions } from './auth'

describe('authOptions callbacks propagate organizacionId', () => {
  it('jwt callback copies organizacionId from the user object onto the token', async () => {
    const jwtCallback = authOptions.callbacks!.jwt!
    const token = {} as Parameters<typeof jwtCallback>[0]['token']
    const user = {
      id: 'u1',
      name: 'Cliente Test',
      email: 'cliente@example.com',
      rol: 'cliente',
      organizacionId: 'org-1',
    }

    const result = await jwtCallback({ token, user } as Parameters<typeof jwtCallback>[0])

    expect(result.organizacionId).toBe('org-1')
  })

  it('jwt callback copies a null organizacionId for a medico/backoffice user', async () => {
    const jwtCallback = authOptions.callbacks!.jwt!
    const token = {} as Parameters<typeof jwtCallback>[0]['token']
    const user = {
      id: 'u2',
      name: 'Medico Test',
      email: 'medico@example.com',
      rol: 'medico',
      organizacionId: null,
    }

    const result = await jwtCallback({ token, user } as Parameters<typeof jwtCallback>[0])

    expect(result.organizacionId).toBeNull()
  })

  it('session callback exposes organizacionId from the token onto session.user', async () => {
    const sessionCallback = authOptions.callbacks!.session!
    const session = { user: {}, expires: '2099-01-01' } as Parameters<typeof sessionCallback>[0]['session']
    const token = { rol: 'cliente', organizacionId: 'org-1' } as Parameters<typeof sessionCallback>[0]['token']

    const result = await sessionCallback({ session, token } as Parameters<typeof sessionCallback>[0])

    expect(result.user.organizacionId).toBe('org-1')
  })
})
