import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  listarPagosMedico,
  sincronizarPagosPendientes,
  obtenerKpisPagosMedico,
} from '@/lib/contable/pagos-medico'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const url = new URL(req.url)
  const medicoId = url.searchParams.get('medicoId')
  const estado = url.searchParams.get('estado')
  const page = parseInt(url.searchParams.get('page') || '0')

  const { pagos, total, pages } = await listarPagosMedico({
    medicoId: medicoId || undefined,
    estado: (estado as 'pendiente' | 'pagado') || undefined,
    page,
  })

  const kpis = await obtenerKpisPagosMedico()

  return NextResponse.json({ pagos, total, pages, kpis })
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

  const { action } = body as { action?: string }

  if (action === 'sincronizar') {
    const resultado = await sincronizarPagosPendientes()
    return NextResponse.json(resultado)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
