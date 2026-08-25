import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export async function verifyCredentials(email: string, password: string): Promise<any | null> {
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario || !usuario.activo) return null

  const passwordMatches = await bcrypt.compare(password, usuario.passwordHash)
  if (!passwordMatches) return null

  return usuario
}
