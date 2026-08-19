import { prisma } from './prisma'

export async function listarTodosCasos() {
  return prisma.caso.findMany({
    include: { organizacion: true, medico: true },
    orderBy: { fechaLimite: 'asc' },
  })
}

export async function obtenerCargaMedicos() {
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
