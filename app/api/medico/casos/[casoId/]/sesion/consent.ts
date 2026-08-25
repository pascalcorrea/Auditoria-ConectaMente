import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
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
    const sesion = await prisma.sesion.update({
      where: { casoId },
      data: {
        consentimientoTimestamp: new Date(),
        estado: 'en_curso',
      },
    })

    return NextResponse.json(sesion)
  } catch (error) {
    console.error('Consent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
