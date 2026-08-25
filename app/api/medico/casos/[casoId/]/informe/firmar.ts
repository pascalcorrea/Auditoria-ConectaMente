import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requestSignature } from '@/lib/firma-electronica'

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

  const informe = await prisma.informe.findUnique({
    where: { casoId },
  })

  if (!informe) {
    return NextResponse.json({ error: 'Informe not found' }, { status: 404 })
  }

  try {
    const signatureResp = await requestSignature({
      documentUrl: informe.archivoUrl,
      signerName: session.user.name || 'Médico',
      signerEmail: session.user.email || '',
      signerRut: session.user.id || '',
    })

    const updated = await prisma.informe.update({
      where: { id: informe.id },
      data: {
        firmaProveedor: signatureResp.provider,
        firmaTimestamp: signatureResp.signedAt,
        firmaDocumentoId: signatureResp.documentId,
        archivoFirmadoUrl: signatureResp.signatureUrl,
      },
    })

    // Update caso estado
    await prisma.caso.update({
      where: { id: casoId },
      data: { estado: 'entregado' },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Signature error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
