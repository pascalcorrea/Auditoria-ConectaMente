import { prisma } from './prisma'
import type { Prisma, EstadoCaso, PrioridadCaso } from '@prisma/client'

export interface MedicoConCarga {
  id: string
  nombre: string
  especialidad: string | null
  casosActivos: number
}

export interface FiltrosCasos {
  desde?: string
  hasta?: string
  estado?: string
  prioridad?: string
}

export function construirWhereCasos(filtros: FiltrosCasos): Prisma.CasoWhereInput {
  const where: Prisma.CasoWhereInput = {}

  if (filtros.desde || filtros.hasta) {
    where.fechaLimite = {}
    if (filtros.desde) where.fechaLimite.gte = new Date(filtros.desde)
    if (filtros.hasta) where.fechaLimite.lte = new Date(filtros.hasta)
  }

  if (filtros.estado) where.estado = filtros.estado as EstadoCaso as EstadoCaso
  if (filtros.prioridad) where.prioridad = filtros.prioridad as PrioridadCaso as PrioridadCaso

  return where
}

export async function listarCasosFiltrados(filtros: FiltrosCasos) {
  const where = construirWhereCasos(filtros)
  return prisma.caso.findMany({
    where,
    include: { organizacion: true, medico: true },
    orderBy: { creadoEn: 'desc' },
  })
}

export async function listarTodosCasos() {
  return prisma.caso.findMany({
    include: { organizacion: true, medico: true },
    orderBy: { fechaLimite: 'asc' },
  })
}

export async function obtenerCargaMedicos(): Promise<MedicoConCarga[]> {
  const medicos = await prisma.usuario.findMany({
    where: { rol: 'medico', activo: true },
    select: { id: true, nombre: true, especialidad: true },
  })

  const cargaPorMedico = await Promise.all(
    medicos.map(async (medico) => {
      const activos = await prisma.caso.count({
        where: {
          medicoId: medico.id,
          estado: { in: ['recibido', 'en_revision', 'informe_en_validacion'] },
        },
      })
      return { ...medico, casosActivos: activos }
    })
  )

  return cargaPorMedico.sort((a, b) => a.casosActivos - b.casosActivos)
}

export async function reasignarCaso(casoId: string, nuevoMedicoId: string) {
  return prisma.caso.update({
    where: { id: casoId },
    data: { medicoId: nuevoMedicoId, estado: 'en_revision' },
  })
}
