import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import type { Rol } from '@prisma/client'

const ROLE_PREFIXES: Array<{ prefix: string; role: Rol }> = [
  { prefix: '/cliente', role: 'cliente' },
  { prefix: '/medico', role: 'medico' },
  { prefix: '/admin', role: 'backoffice' },
]

export function getRequiredRole(pathname: string): Rol | null {
  const match = ROLE_PREFIXES.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return match?.role ?? null
}
