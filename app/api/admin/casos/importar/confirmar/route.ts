import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidRut, normalizeRut } from '@/lib/rut'
import { calcularFechaLimite } from '@/lib/fecha-limite'
import { asignarMedico } from '@/lib/asignacion'

type FilaConfirmar = {
  rut: string
  nombre: string
  organizacion: string
  tipoLicencia: string
  fechaEmision: string
  prioridad: string
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const filas: unknown[] = Array.isArray((body as { filas?: unknown })?.filas) ? (body as { filas: unknown[] }).filas : []

  const organizaciones = await prisma.organizacion.findMany()
  const organizacionPorNombre = new Map(organizaciones.map((o) => [o.nombre, o]))

  let creados = 0

  for (const filaRaw of filas) {
    // Each row is processed independently and wrapped in its own try/catch:
    // this endpoint receives arbitrary client JSON (not necessarily the
    // shape the preview step produced), so a malformed row (wrong types,
    // missing fields) must be skipped like any other invalid row rather
    // than throwing and aborting the whole batch mid-way.
    try {
      const fila = filaRaw as FilaConfirmar

      if (typeof fila?.rut !== 'string' || !isValidRut(fila.rut)) continue
      if (typeof fila.nombre !== 'string' || !fila.nombre.trim()) continue
      if (typeof fila.tipoLicencia !== 'string' || !fila.tipoLicencia.trim()) continue
      if (fila.prioridad !== 'normal' && fila.prioridad !== 'urgente') continue
      if (typeof fila.fechaEmision !== 'string' || isNaN(Date.parse(fila.fechaEmision))) continue

      const organizacion = organizacionPorNombre.get(fila.organizacion)
      if (!organizacion) continue

      const fechaIngreso = new Date()
      const fechaLimite = calcularFechaLimite(fechaIngreso, organizacion.plazoSlaDias)
      const medicoId = await asignarMedico()

      await prisma.caso.create({
        data: {
          organizacionId: organizacion.id,
          medicoId,
          rutEvaluado: normalizeRut(fila.rut),
          nombreEvaluado: fila.nombre.trim(),
          tipoLicencia: fila.tipoLicencia.trim(),
          fechaEmisionLicencia: new Date(fila.fechaEmision),
          fechaIngreso,
          fechaLimite,
          prioridad: fila.prioridad,
        },
      })
      creados++
    } catch {
      // Malformed row (wrong types) or a transient error creating this
      // specific Caso — skip it and keep processing the rest of the batch.
      continue
    }
  }

  return NextResponse.json({ creados })
}
