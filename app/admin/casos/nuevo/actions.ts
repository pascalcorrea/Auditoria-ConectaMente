'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isValidRut, normalizeRut } from '@/lib/rut'
import { calcularFechaLimite } from '@/lib/fecha-limite'
import { asignarMedico } from '@/lib/asignacion'

export type CrearCasoState = { error: string | null }

export async function crearCasoIndividual(_prevState: CrearCasoState, formData: FormData): Promise<CrearCasoState> {
  const rut = String(formData.get('rut') ?? '')
  const nombreEvaluado = String(formData.get('nombreEvaluado') ?? '').trim()
  const organizacionId = String(formData.get('organizacionId') ?? '')
  const tipoLicencia = String(formData.get('tipoLicencia') ?? '').trim()
  const fechaEmisionLicenciaRaw = String(formData.get('fechaEmisionLicencia') ?? '')
  const prioridadRaw = String(formData.get('prioridad') ?? 'normal')

  if (!isValidRut(rut)) return { error: 'RUT inválido' }
  if (!nombreEvaluado) return { error: 'Nombre requerido' }
  if (!tipoLicencia) return { error: 'Tipo de licencia requerido' }
  if (isNaN(Date.parse(fechaEmisionLicenciaRaw))) return { error: 'Fecha de emisión inválida' }

  const organizacion = await prisma.organizacion.findUnique({ where: { id: organizacionId } })
  if (!organizacion) return { error: 'Organización inválida' }

  const fechaIngreso = new Date()
  const fechaLimite = calcularFechaLimite(fechaIngreso, organizacion.plazoSlaDias)
  const medicoId = await asignarMedico()
  const prioridad = prioridadRaw === 'urgente' ? 'urgente' : 'normal'

  await prisma.caso.create({
    data: {
      organizacionId,
      medicoId,
      rutEvaluado: normalizeRut(rut),
      nombreEvaluado,
      tipoLicencia,
      fechaEmisionLicencia: new Date(fechaEmisionLicenciaRaw),
      fechaIngreso,
      fechaLimite,
      prioridad,
    },
  })

  redirect('/admin/casos')
}
