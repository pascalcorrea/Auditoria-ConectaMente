import { prisma } from './prisma'
import type { Caso } from '@prisma/client'

export async function listarCasosMedico(medicoId: string): Promise<Caso[]> {
  return prisma.caso.findMany({
    where: { medicoId },
    orderBy: { fechaLimite: 'asc' },
  })
}
