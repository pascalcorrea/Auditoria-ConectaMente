export function calcularFechaLimite(fechaIngreso: Date, plazoSlaDias: number): Date {
  const resultado = new Date(fechaIngreso)
  resultado.setDate(resultado.getDate() + plazoSlaDias)
  return resultado
}
