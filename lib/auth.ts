import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyCredentials } from './auth-credentials'
import type { Rol } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const usuario = await verifyCredentials(credentials.email, credentials.password)
        if (!usuario) return null
        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          organizacionId: usuario.organizacionId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { rol: Rol; organizacionId: string | null }
        token.rol = u.rol
        token.organizacionId = u.organizacionId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.rol = token.rol
        session.user.organizacionId = token.organizacionId
      }
      return session
    },
  },
}
