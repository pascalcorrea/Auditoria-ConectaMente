import { prisma } from './prisma'

export async function listarCasosMedico(medicoId: string): Promise<any[]> {
  return prisma.caso.findMany({
    where: { medicoId },
    orderBy: { fechaLimite: 'asc' },
  })
}
