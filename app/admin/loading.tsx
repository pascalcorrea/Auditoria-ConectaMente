import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import BreathingLoader from '@/components/ui/BreathingLoader'

export default function AdminLoading() {
  return <BreathingLoader />
}
