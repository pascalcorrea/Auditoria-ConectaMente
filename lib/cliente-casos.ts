import type { EstadoCaso, PrioridadCaso } from '@/lib/types'
import { prisma } from './prisma'

export async function listarCasosCliente(organizacionId: string, estado?: EstadoCaso): Promise<any[]> {
  return prisma.caso.findMany({
    where: {
      organizacionId,
      ...(estado ? { estado } : {}),
    },
    orderBy: { fechaLimite: 'asc' },
  })
}
