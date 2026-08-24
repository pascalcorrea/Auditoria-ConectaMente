import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWebhook, WebhookEvent } from '@/lib/daily'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-daily-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const body = await request.text()
  if (!validateWebhook(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const event: WebhookEvent = JSON.parse(body)

    // Extract casoId from room_name (formato: caso_<casoId>)
    const match = event.room_name.match(/^caso_(.+)$/)
    if (!match) {
      return NextResponse.json({ ok: true })
    }

    const casoId = match[1]
    const sesion = await prisma.sesion.findFirst({
      where: { casoId },
    })

    if (!sesion) {
      return NextResponse.json({ ok: true })
    }

    // Handle different event types
    switch (event.event) {
      case 'participant.joined':
        if (event.participant?.user_id?.startsWith('medico_')) {
          await prisma.sesion.update({
            where: { id: sesion.id },
            data: {
              medicoHoraConexion: new Date(),
              estado: 'en_curso',
            },
          })
        } else {
          await prisma.sesion.update({
            where: { id: sesion.id },
            data: { evaluadoHoraConexion: new Date() },
          })
        }
        break

      case 'participant.left':
        if (event.participant?.user_id?.startsWith('medico_')) {
          await prisma.sesion.update({
            where: { id: sesion.id },
            data: { medicoHoraDesconexion: new Date() },
          })
        } else {
          await prisma.sesion.update({
            where: { id: sesion.id },
            data: { evaluadoHoraDesconexion: new Date() },
          })
        }
        break

      case 'recording.finished':
        // Update with recording URL from event
        await prisma.sesion.update({
          where: { id: sesion.id },
          data: {
            estado: 'realizada',
            grabacionUrl: event.participant?.user_id || undefined,
          },
        })
        break
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}
