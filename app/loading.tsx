import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { LoadingScreen } from '@/components/LoadingScreen'

export default function Loading() {
  return <LoadingScreen />
}
