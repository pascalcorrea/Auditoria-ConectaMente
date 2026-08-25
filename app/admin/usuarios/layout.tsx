import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import AdminHeader from '../AdminHeader'

export default function UsuariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader title="Usuarios" />
      {children}
    </>
  )
}
