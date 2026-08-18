import type { Rol } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      rol?: Rol
      organizacionId?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    rol?: Rol
    organizacionId?: string | null
  }
}
