import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generatePDFBuffer } from '@/lib/pdf-generator'

interface FormData {
  antecedentes: string
  hallazgosClinic: string
  diagnosticos: string
  conclusiones: string
  recomendaciones?: string
  observaciones?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { casoId } = await params
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    include: { organizacion: true, sesion: true },
  })

  if (!caso || caso.medicoId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body: FormData = await request.json()

    // Generate PDF
    const pdfBuffer = await generatePDFBuffer({
      nombreEvaluado: caso.nombreEvaluado,
      rutEvaluado: caso.rutEvaluado,
      organizacion: caso.organizacion.nombre,
      fecha: new Date(),
      medico: session.user.name || session.user.email || 'Médico',
      antecedentes: body.antecedentes,
      hallazgos: body.hallazgosClinic,
      diagnosticos: body.diagnosticos,
      conclusiones: body.conclusiones,
      recomendaciones: body.recomendaciones || '',
      observaciones: body.observaciones || '',
    })

    // Store PDF URL (in real scenario, upload to S3/R2)
    const pdfUrl = `/pdfs/${casoId}-${Date.now()}.pdf`

    // Create informe record
    const informe = await prisma.informe.create({
      data: {
        casoId,
        archivoUrl: pdfUrl,
        generadoEn: new Date(),
        generadoPor: session.user.id,
        contenido: JSON.stringify(body),
      },
    })

    // Update caso estado
    await prisma.caso.update({
      where: { id: casoId },
      data: { estado: 'informe_en_validacion' },
    })

    return NextResponse.json(informe)
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
