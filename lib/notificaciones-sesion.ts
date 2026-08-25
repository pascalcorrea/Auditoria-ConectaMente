import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { EstadoSesion } from '@prisma/client'
import { enviarEmail, generarEmailSesionRealizadaMedico } from './notificaciones'
import { prisma } from './prisma'

export async function notificarCambioEstadoSesion(
  sesionId: string,
  estadoAnterior: EstadoSesion,
  estadoNuevo: EstadoSesion
): Promise<number> {
  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    include: {
      caso: {
        include: {
          medico: true,
        },
      },
    },
  })

  if (!sesion) return 0

  let emailsEnviados = 0
  const caso = sesion.caso

  // Notificar cuando sesion se completa
  if (estadoNuevo === 'realizada' && estadoAnterior !== 'realizada') {
    if (caso.medico?.email && sesion.duracionEfectivaSegundos) {
      const duracionMinutos = Math.floor(sesion.duracionEfectivaSegundos / 60)
      const emailParams = generarEmailSesionRealizadaMedico(
        caso.nombreEvaluado,
        duracionMinutos
      )
      const sent = await enviarEmail({
        ...emailParams,
        to: caso.medico.email,
      })
      if (sent) emailsEnviados++
    }
  }

  return emailsEnviados
}
