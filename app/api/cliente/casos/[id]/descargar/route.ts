import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'cliente' || !session.user.organizacionId || !session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const caso = await prisma.caso.findUnique({
    where: { id },
    include: { informe: true },
  })

  const informe = caso?.informe

  if (
    !caso ||
    caso.organizacionId !== session.user.organizacionId ||
    caso.estado !== 'entregado' ||
    !informe?.archivoFirmadoUrl
  ) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  await prisma.logDescarga.create({
    data: {
      informeId: informe.id,
      usuarioId: session.user.id,
    },
  })

  return NextResponse.redirect(informe.archivoFirmadoUrl)
}
