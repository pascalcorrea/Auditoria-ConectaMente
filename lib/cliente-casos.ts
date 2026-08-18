import { prisma } from './prisma'
import type { Caso, EstadoCaso } from '@prisma/client'

export async function listarCasosCliente(organizacionId: string, estado?: EstadoCaso): Promise<Caso[]> {
  return prisma.caso.findMany({
    where: {
      organizacionId,
      ...(estado ? { estado } : {}),
    },
    orderBy: { fechaLimite: 'asc' },
  })
}
