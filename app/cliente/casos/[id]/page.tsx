import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EstadoBadge } from '@/components/ui/StatusBadge'
import { TopHeader } from '@/components/layout/TopHeader'
import type { EstadoCaso } from '@prisma/client'

const PASOS: { estado: EstadoCaso; label: string }[] = [
  { estado: 'recibido', label: 'Recibido' },
  { estado: 'en_revision', label: 'En revisión' },
  { estado: 'informe_en_validacion', label: 'Informe en validación' },
  { estado: 'entregado', label: 'Entregado' },
]

export const dynamic = 'force-dynamic'

export default async function ClienteCasoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizacionId) notFound()

  const { id } = await params
  const caso = await prisma.caso.findUnique({
    where: { id },
    include: { organizacion: true, informe: { include: { medico: true } } },
  })

  if (!caso || caso.organizacionId !== session.user.organizacionId) notFound()

  const puedeDescargar = caso.estado === 'entregado' && Boolean(caso.informe?.archivoFirmadoUrl)
  const pasoActualIndex = PASOS.findIndex((p) => p.estado === caso.estado)

  return (
    <>
      <TopHeader title={`Caso — ${caso.nombreEvaluado}`} />
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto w-[760px] rounded-xl border border-brand-borderSoft bg-white p-9 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
          <div className="mb-7 flex items-start justify-between">
            <div>
              <div className="mb-1 text-lg font-semibold text-brand-text">
                {caso.nombreEvaluado} ({caso.rutEvaluado})
              </div>
              <div className="text-sm text-brand-textSecondary">
                {caso.tipoLicencia} · Ingresado {caso.fechaIngreso.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <EstadoBadge estado={caso.estado} />
          </div>

          <div className="mb-8 flex items-center">
            {PASOS.map((paso, i) => {
              const alcanzado = i <= pasoActualIndex
              return (
                <div key={paso.estado} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    <div
                      className={`h-1 flex-1 ${i === 0 ? 'invisible' : alcanzado ? 'bg-brand-accent' : 'bg-brand-borderSoft'}`}
                    />
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                        alcanzado ? 'bg-brand-accent' : 'bg-brand-textMuted'
                      }`}
                    >
                      {alcanzado ? '✓' : i + 1}
                    </div>
                    <div
                      className={`h-1 flex-1 ${i === PASOS.length - 1 ? 'invisible' : i < pasoActualIndex ? 'bg-brand-accent' : 'bg-brand-borderSoft'}`}
                    />
                  </div>
                  <div className={`mt-2 text-center text-[11.5px] font-medium ${alcanzado ? 'text-brand-text' : 'text-brand-textMuted'}`}>
                    {paso.label}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between border-t border-brand-borderSoft pt-6">
            {puedeDescargar ? (
              <>
                <div>
                  <div className="mb-0.5 text-sm font-semibold text-brand-text">Informe de evaluación disponible</div>
                  <div className="text-xs text-brand-textSecondary">
                    Firmado electrónicamente por {caso.informe!.medico.nombre}
                    {caso.informe!.firmaTimestamp &&
                      ` · ${caso.informe!.firmaTimestamp.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                  </div>
                </div>
                <a
                  href={`/api/cliente/casos/${caso.id}/descargar`}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-accentHover"
                >
                  ↓ Descargar informe
                </a>
              </>
            ) : (
              <p className="text-sm text-brand-textSecondary">El informe aún no está disponible para descarga.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
