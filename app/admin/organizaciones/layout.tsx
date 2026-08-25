import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import AdminHeader from '../AdminHeader'

export default function OrganizacionesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader title="Organizaciones" />
      {children}
    </>
  )
}
