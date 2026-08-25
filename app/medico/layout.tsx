import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
export default function MedicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-brand-bg border-b border-brand-borderSoft p-4">
        <h1 className="text-lg font-medium text-brand-text">Portal del Médico</h1>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
