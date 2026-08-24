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
  await request.formData()

  const caso = await prisma.caso.findUnique({ where: { id } })
  if (!caso || caso.medicoId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // MVP: Mock PDF URL (real PDF generation in Fase 3 with proper storage)
  const archivoUrl = `https://example.com/informe-${caso.id}-mock.pdf`

  await prisma.informe.create({
    data: {
      casoId: caso.id,
      archivoUrl,
      archivoFirmadoUrl: null,
      generadoPor: session.user.id,
      firmaProveedor: 'firmaweb',
      generadoEn: new Date(),
    },
  })

  await prisma.caso.update({
    where: { id: caso.id },
    data: { estado: 'informe_en_validacion' },
  })

  return NextResponse.redirect(new URL(`/medico/casos/${id}/informe`, request.url))
}
