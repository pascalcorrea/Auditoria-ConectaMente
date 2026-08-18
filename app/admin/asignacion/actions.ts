'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function reasignarMedico(casoId: string, medicoId: string) {
  await prisma.caso.update({
    where: { id: casoId },
    data: { medicoId: medicoId === '' ? null : medicoId },
  })
  revalidatePath('/admin/asignacion')
}
