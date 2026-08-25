import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enviarEmail, generarEmailInformeEntregado } from '@/lib/notificaciones'

export async function POST(request: NextRequest) {
  try {
    const { casoId } = await request.json()

    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      include: { organizacion: true, informe: true },
    })

    if (!caso || !caso.informe) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let emailsEnviados = 0

    if (caso.organizacion?.contactEmail) {
      const emailParams = generarEmailInformeEntregado(
        caso.nombreEvaluado,
        caso.organizacion.nombre,
        caso.informe.archivoFirmadoUrl || caso.informe.archivoUrl
      )
      const sent = await enviarEmail({
        ...emailParams,
        to: caso.organizacion.contactEmail,
      })
      if (sent) emailsEnviados++
    }

    return NextResponse.json({
      ok: true,
      emailsEnviados,
    })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
