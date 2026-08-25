import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import type { EstadoCaso, PrioridadCaso } from '@/lib/types'
import { prisma } from './prisma'

export async function listarCasosCliente(organizacionId: string, estado?: EstadoCaso): Promise<Caso[]> {
  return prisma.caso.findMany({
    where: {
      organizacionId,
      ...(estado ? { estado } : {}),
    },
    orderBy: { fechaLimite: 'asc' },
  })
}
