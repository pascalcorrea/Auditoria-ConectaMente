import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { casoId } = await params
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
  })

  if (!caso || caso.medicoId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const sesion = await prisma.sesion.findUnique({
      where: { casoId },
    })

    if (!sesion) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Calculate effective duration if both connections exist
    let duracionEfectiva: number | undefined
    if (sesion.medicoHoraConexion && sesion.evaluadoHoraConexion) {
      const inicio = Math.max(
        sesion.medicoHoraConexion.getTime(),
        sesion.evaluadoHoraConexion.getTime()
      )
      const fin = Math.min(
        (sesion.medicoHoraDesconexion || new Date()).getTime(),
        (sesion.evaluadoHoraDesconexion || new Date()).getTime()
      )
      duracionEfectiva = Math.max(0, Math.floor((fin - inicio) / 1000))
    }

    const updated = await prisma.sesion.update({
      where: { casoId },
      data: {
        estado: 'realizada',
        duracionEfectivaSegundos: duracionEfectiva,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('End session error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
