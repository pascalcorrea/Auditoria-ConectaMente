import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
export function calcularFechaLimite(fechaIngreso: Date, plazoSlaDias: number): Date {
  const resultado = new Date(fechaIngreso)
  resultado.setDate(resultado.getDate() + plazoSlaDias)
  return resultado
}
