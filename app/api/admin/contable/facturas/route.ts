import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  listarFacturas,
  generarFactura,
  obtenerKpisFacturas,
} from '@/lib/contable/facturas'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const url = new URL(req.url)
  const organizacionId = url.searchParams.get('organizacionId')
  const estado = url.searchParams.get('estado')
  const page = parseInt(url.searchParams.get('page') || '0')

  const { facturas, total, pages } = await listarFacturas({
    organizacionId: organizacionId || undefined,
    estado: (estado as 'pendiente' | 'facturada' | 'pagada') || undefined,
    page,
  })

  const kpis = await obtenerKpisFacturas()

  return NextResponse.json({ facturas, total, pages, kpis })
}

export async function POST(req: NextRequest) {
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

  const { organizacionId, periodoInicio, periodoFin } = body as {
    organizacionId?: string
    periodoInicio?: string
    periodoFin?: string
  }

  if (!organizacionId || !periodoInicio || !periodoFin) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const result = await generarFactura({
    organizacionId,
    periodoInicio: new Date(periodoInicio),
    periodoFin: new Date(periodoFin),
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ ok: true, factura: result.factura })
}
