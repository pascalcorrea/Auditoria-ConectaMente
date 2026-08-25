import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateToken, createRoom, getRoom } from '@/lib/daily'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { casoId } = await params
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
  })

  if (!caso) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify access
  if (session.user.rol === 'medico' && caso.medicoId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (session.user.rol === 'cliente' && caso.organizacionId !== session.user.organizacionId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const roomName = `caso_${casoId}`
    let room = await getRoom(roomName)
    if (!room) {
      room = await createRoom(roomName)
    }

    const token = generateToken(
      roomName,
      session.user.name || session.user.email || 'user',
      session.user.rol === 'medico' ? 'medico' : 'evaluado'
    )

    return NextResponse.json({ token, roomUrl: room.url })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
