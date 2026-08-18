import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { Usuario } from '@prisma/client'

export async function verifyCredentials(email: string, password: string): Promise<Usuario | null> {
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario || !usuario.activo) return null

  const passwordMatches = await bcrypt.compare(password, usuario.passwordHash)
  if (!passwordMatches) return null

  return usuario
}
