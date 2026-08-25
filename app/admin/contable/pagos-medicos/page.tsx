import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { obtenerKpisPagosMedico } from '@/lib/contable/pagos-medico'
import PagosMedicosPageClient from './PagosMedicosPageClient'

export const dynamic = 'force-dynamic'

export default async function PagosMedicosPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const [medicos, kpis] = await Promise.all([
    prisma.usuario.findMany({
      where: { rol: 'medico' },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
    obtenerKpisPagosMedico(),
  ])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-brand-borderSoft bg-white p-5 shadow-sm">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">
            Pendiente
          </div>
          <div className="text-2xl font-semibold text-brand-text">
            ${(kpis.pendienteClp / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="rounded-xl border border-brand-borderSoft bg-white p-5 shadow-sm">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">
            Pagado este mes
          </div>
          <div className="text-2xl font-semibold text-brand-accent">
            ${(kpis.pagadoEstesMesClp / 1000).toFixed(0)}K
          </div>
        </div>
      </div>

      {/* Tabla */}
      <PagosMedicosPageClient medicos={medicos} />
    </div>
  )
}
