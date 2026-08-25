import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseCasosExcel } from '@/lib/excel-import'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
  }

  // parseCasosExcel (and the xlsx library underneath it) is the one place
  // in this feature that parses arbitrary, untrusted uploaded bytes — a
  // corrupt file or a non-spreadsheet renamed to .xlsx must return a clean
  // 400, not an unhandled 500, matching how the confirm route already
  // treats malformed input.
  let filas
  try {
    const buffer = await file.arrayBuffer()
    filas = await parseCasosExcel(buffer)
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el archivo — verifica que sea un Excel/CSV válido' }, { status: 400 })
  }

  return NextResponse.json({ filas })
}
