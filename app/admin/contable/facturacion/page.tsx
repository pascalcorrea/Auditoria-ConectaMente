import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { obtenerKpisFacturas } from '@/lib/contable/facturas'
import FacturacionPageClient from './FacturacionPageClient'

export const dynamic = 'force-dynamic'

export default async function FacturacionPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const [organizaciones, kpis] = await Promise.all([
    prisma.organizacion.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
    obtenerKpisFacturas(),
  ])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
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
            Facturado este mes
          </div>
          <div className="text-2xl font-semibold text-brand-accent">
            ${(kpis.facturadasEstesMesClp / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="rounded-xl border border-brand-borderSoft bg-white p-5 shadow-sm">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">
            Facturas pendientes
          </div>
          <div className="text-2xl font-semibold text-brand-danger">{kpis.cantidadPendiente}</div>
        </div>
      </div>

      {/* Generador + tabla */}
      <FacturacionPageClient organizaciones={organizaciones} />
    </div>
  )
}
