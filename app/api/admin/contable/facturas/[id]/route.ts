import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { marcarFacturaEstado } from '@/lib/contable/facturas'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { estado } = body as { estado?: string }
  const { id } = await params

  if (!['pendiente', 'facturada', 'pagada'].includes(estado || '')) {
    return NextResponse.json({ error: 'Invalid estado' }, { status: 400 })
  }

  const factura = await marcarFacturaEstado(id, estado as 'pendiente' | 'facturada' | 'pagada')
  return NextResponse.json({ ok: true, factura })
}
