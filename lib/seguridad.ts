import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import type { Rol } from '@prisma/client'

export type PermisosEndpoint = {
  [key in Rol]?: boolean
}

export const PERMISOS: Record<string, PermisosEndpoint> = {
  '/api/medico/casos': {
    medico: true,
  },
  '/api/medico/casos/[id]/sesion/token': {
    medico: true,
    cliente: true,
  },
  '/api/medico/casos/[id]/informe/generar': {
    medico: true,
  },
  '/api/medico/casos/[id]/informe/firmar': {
    medico: true,
  },
  '/api/admin/casos': {
    backoffice: true,
  },
  '/api/admin/usuarios': {
    backoffice: true,
  },
  '/api/admin/organizaciones': {
    backoffice: true,
  },
  '/api/webhooks/daily': {
    // Public webhook
  },
  '/api/jobs/alertas-plazo': {
    // Cron job - requires secret
  },
}

export async function validarPermiso(ruta: string, rolRequerido?: Rol | Rol[]): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.rol) return false

  const roles = Array.isArray(rolRequerido) ? rolRequerido : [rolRequerido]
  return roles.includes(session.user.rol as Rol)
}

export function sanitizarDatos(obj: any): any {
  if (!obj) return obj
  
  const sensibles = ['passwordHash', 'token', 'secret', 'key']
  const copia = { ...obj }

  for (const key of sensibles) {
    if (key in copia) {
      copia[key] = '***'
    }
  }

  return copia
}

export function validarAccesoACaso(
  usuarioId: string,
  rolUsuario: Rol,
  casoOwnerId?: string,
  casoOrganizacionId?: string,
  usuarioOrganizacionId?: string
): boolean {
  if (rolUsuario === 'backoffice') return true

  if (rolUsuario === 'medico' && casoOwnerId === usuarioId) return true

  if (rolUsuario === 'cliente' && usuarioOrganizacionId === casoOrganizacionId) return true

  return false
}

export function validarAccesoAUsuario(
  usuarioId: string,
  rolUsuario: Rol,
  targetUserId?: string,
  targetUserOrgId?: string,
  usuarioOrgId?: string
): boolean {
  if (rolUsuario === 'backoffice') return true

  if (usuarioId === targetUserId) return true

  if (rolUsuario === 'cliente' && usuarioOrgId === targetUserOrgId) return true

  return false
}
