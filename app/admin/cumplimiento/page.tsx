import type { EstadoCaso, PrioridadCaso } from '@/lib/types'
﻿import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { construirWhereCasos } from '@/lib/admin-casos'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { DateRangeFilterClient } from './DateRangeFilterClient'

export const dynamic = 'force-dynamic'

function daysUntilDue(fechaLimite: Date): number {
  const now = new Date()
  const diffMs = fechaLimite.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function statusColor(dias: number): string {
  if (dias < 0) return 'text-brand-danger'
  if (dias < 3) return 'text-brand-accent'
  return 'text-brand-text'
}

export default async function AdminCumplimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; estado?: string; prioridad?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const params = await searchParams
  const where = construirWhereCasos(params)

  // Filtrar solo casos no entregados usando AND
  const finalWhere = {
    AND: [
      where,
      {
        estado: {
          not: 'entregado' as EstadoCaso,
        },
      },
    ],
  }

  const casos = await prisma.caso.findMany({
    where: finalWhere,
    include: { organizacion: true, medico: true },
    orderBy: { fechaLimite: 'asc' },
  })

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Cumplimiento de plazos</h1>

      <Card className="mt-4 p-4">
        <DateRangeFilterClient />
      </Card>

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-bgSecondary">
            <tr className="text-xs uppercase tracking-wide text-brand-textSecondary">
              <th className="p-3 text-left">Evaluado</th>
              <th className="p-3 text-left">OrganizaciÃ³n</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Fecha lÃ­mite</th>
              <th className="p-3 text-right">DÃ­as</th>
            </tr>
          </thead>
          <tbody>
            {casos.length > 0 ? (
              casos.map((caso: any) => {
                const dias = daysUntilDue(caso.fechaLimite)
                return (
                  <tr key={caso.id} className="border-t border-brand-borderSoft">
                    <td className="p-3">{caso.nombreEvaluado}</td>
                    <td className="p-3">{caso.organizacion.nombre}</td>
                    <td className="p-3">{caso.estado}</td>
                    <td className="p-3">{caso.fechaLimite.toLocaleDateString('es-CL')}</td>
                    <td className={`p-3 text-right font-medium ${statusColor(dias)}`}>
                      {dias < 0 ? `VENCIDO ${Math.abs(dias)}d` : `${dias}d`}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-3 text-center text-sm text-brand-textSecondary">
                  Sin casos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
