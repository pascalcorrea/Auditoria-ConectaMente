import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyCredentials } from './auth-credentials'
import { prisma } from './prisma'
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
      } else if (token.organizacionId === undefined && token.sub) {
        // Backfill for JWTs issued before organizacionId existed on the
        // token schema. `jwt()` only runs the `if (user)` branch above at
        // sign-in — an already-issued token otherwise keeps whatever it
        // was encoded with (NextAuth's default session.maxAge is 30 days),
        // so without this fallback an already-logged-in cliente would 404
        // every /cliente/* page (and 403 the download endpoint) until they
        // manually re-authenticate. `=== undefined` (not falsy) is
        // deliberate: a `null` organizacionId is legitimate for
        // medico/backoffice and must not trigger a lookup on every request.
        const usuario = await prisma.usuario.findUnique({ where: { id: token.sub } })
        if (usuario) {
          token.rol = usuario.rol
          token.organizacionId = usuario.organizacionId
        } else {
          // token.sub doesn't resolve to any Usuario (deleted/never
          // existed). Without this, organizacionId would stay `undefined`
          // forever and this branch would re-query the DB on every single
          // request for the rest of the token's lifetime (up to 30 days).
          // Setting it to null marks the lookup as "done, nothing found" —
          // matches the legitimate no-org shape, and route-level guards
          // (`!session.user.organizacionId`) still correctly deny access.
          token.organizacionId = null
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // NextAuth's JWT strategy sets token.sub = user.id automatically on
        // sign-in — session.user.id was declared in types/next-auth.d.ts but
        // never actually assigned anywhere, so it was always undefined. This
        // broke every route (like the cliente download endpoint) that reads
        // session.user.id, for every user, regardless of role.
        session.user.id = token.sub
        session.user.rol = token.rol
        session.user.organizacionId = token.organizacionId
      }
      return session
    },
  },
}
