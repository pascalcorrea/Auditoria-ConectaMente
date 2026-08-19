'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { EstadoCaso } from '@prisma/client'

export async function cambiarEstadoCaso(casoId: string, estado: EstadoCaso) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') return

  // Validar que estado sea válido enum
  const estadosValidos: EstadoCaso[] = ['recibido', 'en_revision', 'informe_en_validacion', 'entregado']
  if (!estadosValidos.includes(estado)) return

  await prisma.caso.update({
    where: { id: casoId },
    data: { estado },
  })

  revalidatePath('/admin/casos')
  revalidatePath('/admin/cumplimiento')  // porque cumplimiento también lista casos
}
