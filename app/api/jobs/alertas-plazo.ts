import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enviarEmail, generarEmailAlertaPlazo } from '@/lib/notificaciones'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ahora = new Date()
    const trasDias = new Date()
    trasDias.setDate(trasDias.getDate() + 3)

    const casosPorVencer = await prisma.caso.findMany({
      where: {
        estado: { not: 'entregado' },
        fechaLimite: {
          gte: ahora,
          lte: trasDias,
        },
      },
      include: { organizacion: true, medico: true },
    })

    let emailsEnviados = 0

    for (const caso of casosPorVencer) {
      const diasRestantes = Math.ceil(
        (caso.fechaLimite.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (caso.medico?.email) {
        const emailParams = generarEmailAlertaPlazo(
          caso.nombreEvaluado,
          diasRestantes,
          caso.organizacion.nombre
        )
        const sent = await enviarEmail({
          ...emailParams,
          to: caso.medico.email,
        })
        if (sent) emailsEnviados++
      }

      const backoffices = await prisma.usuario.findMany({
        where: { rol: 'backoffice' },
      })

      for (const backoffice of backoffices) {
        if (backoffice.email) {
          const emailParams = generarEmailAlertaPlazo(
            caso.nombreEvaluado,
            diasRestantes,
            caso.organizacion.nombre
          )
          const sent = await enviarEmail({
            ...emailParams,
            to: backoffice.email,
          })
          if (sent) emailsEnviados++
        }
      }
    }

    return NextResponse.json({
      ok: true,
      casosEncontrados: casosPorVencer.length,
      emailsEnviados,
    })
  } catch (error) {
    console.error('Alert job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
