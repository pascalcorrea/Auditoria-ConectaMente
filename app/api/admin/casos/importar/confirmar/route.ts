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

  const body = await request.json()
  const filas: FilaConfirmar[] = Array.isArray(body?.filas) ? body.filas : []

  const organizaciones = await prisma.organizacion.findMany()
  const organizacionPorNombre = new Map(organizaciones.map((o) => [o.nombre, o]))

  let creados = 0

  for (const fila of filas) {
    if (!isValidRut(fila.rut)) continue
    if (!fila.nombre?.trim() || !fila.tipoLicencia?.trim()) continue
    if (fila.prioridad !== 'normal' && fila.prioridad !== 'urgente') continue
    if (!fila.fechaEmision || isNaN(Date.parse(fila.fechaEmision))) continue

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
  }

  return NextResponse.json({ creados })
}
