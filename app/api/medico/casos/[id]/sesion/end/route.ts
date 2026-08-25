import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const sesion = await prisma.sesion.findUnique({ where: { casoId: id } })

  if (!sesion) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  await prisma.sesion.update({
    where: { casoId: id },
    data: {
      estado: 'realizada',
      duracionEfectivaSegundos: 0,
    },
  })

  return NextResponse.json({ ok: true })
}
