import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function reasignarMedico(casoId: string, medicoId: string) {
  // middleware.ts only gates page navigation to /admin/*, not this action
  // itself — same reasoning as app/admin/casos/nuevo/actions.ts.
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') return

  if (medicoId !== '') {
    // The DB's FK constraint only guarantees medicoId points at *some*
    // Usuario row — without this check it could silently be pointed at a
    // non-médico (e.g. a backoffice or cliente account).
    const medico = await prisma.usuario.findFirst({
      where: { id: medicoId, rol: 'medico', activo: true },
      select: { id: true },
    })
    if (!medico) return
  }

  await prisma.caso.update({
    where: { id: casoId },
    data: { medicoId: medicoId === '' ? null : medicoId },
  })
  revalidatePath('/admin/asignacion')
  revalidatePath('/admin/casos')
}
