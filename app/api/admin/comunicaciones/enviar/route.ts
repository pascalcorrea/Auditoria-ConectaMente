import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppTemplate, sendWhatsAppText } from '@/lib/comunicaciones/whatsapp'
import { sendEmailBrevo } from '@/lib/comunicaciones/email'
import type { CanalEnvio, EstadoEnvio } from '@prisma/client'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice' || !session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const userId = session.user.id
  const body = await req.json()

  const {
    canal,
    tipo,
    casoId,
    destinatarioUsuarioId,
    destinoManual,
    asunto,
    cuerpo,
    params,
  } = body

  // Resolver destino: prioridad manual > usuario
  let destino: string | null = destinoManual

  if (!destino && destinatarioUsuarioId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: destinatarioUsuarioId },
      select: { email: true },
      // NOTE: Usuario model does not have 'telefono' field yet
      // For WhatsApp channel without destinoManual, destinoManual must be provided
    })
    if (usuario && canal === 'email') {
      destino = usuario.email
    }
  }

  if (!destino) {
    const channelMsg =
      canal === 'whatsapp'
        ? 'For WhatsApp, destinoManual (phone number) is required. Usuario model does not have telefono field yet.'
        : 'No recipient email found'
    return Response.json({ error: channelMsg }, { status: 400 })
  }

  // Enviar según canal
  let result
  if (canal === 'whatsapp') {
    if (tipo && tipo !== 'manual') {
      result = await sendWhatsAppTemplate({ to: destino, templateName: tipo, params })
    } else {
      result = await sendWhatsAppText({ to: destino, text: cuerpo })
    }
  } else if (canal === 'email') {
    result = await sendEmailBrevo({
      to: destino,
      toName: undefined,
      subject: asunto || 'ConectaMente',
      html: cuerpo || '',
    })
  } else {
    return Response.json({ error: 'Invalid channel' }, { status: 400 })
  }

  // Loguear resultado
  const logEnvio = await prisma.logEnvio.create({
    data: {
      canal: canal as CanalEnvio,
      tipo: tipo || 'manual',
      destino,
      destinatarioUsuarioId: destinatarioUsuarioId || null,
      casoId: casoId || null,
      asunto: asunto || null,
      cuerpo: cuerpo || null,
      estado: result.ok ? 'enviado' : ('fallido' as EstadoEnvio),
      error: result.error || null,
      enviadoPorId: userId,
    },
  })

  return Response.json({
    ok: result.ok,
    logId: logEnvio.id,
    error: result.error,
  })
}
