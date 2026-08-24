import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createDailyRoom, getDailyRoomUrl } from '@/lib/daily'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.rol !== 'medico' || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: casoId } = await params

    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      include: { sesion: true },
    })

    if (!caso || caso.medicoId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!caso.sesion) {
      return NextResponse.json({ error: 'Session not scheduled' }, { status: 400 })
    }

    let roomUrl = caso.sesion.dailyRoomUrl
    if (!roomUrl) {
      roomUrl = await createDailyRoom(casoId)
      await prisma.sesion.update({
        where: { id: caso.sesion.id },
        data: { dailyRoomUrl: roomUrl },
      })
    } else {
      const currentUrl = await getDailyRoomUrl(casoId)
      if (!currentUrl) {
        roomUrl = await createDailyRoom(casoId)
        await prisma.sesion.update({
          where: { id: caso.sesion.id },
          data: { dailyRoomUrl: roomUrl },
        })
      }
    }

    const token = Buffer.from(
      JSON.stringify({
        sub: session.user.id,
        name: session.user.name,
        email: session.user.email,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString('base64')

    return NextResponse.json({ token, roomUrl })
  } catch (error) {
    console.error('Token error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
