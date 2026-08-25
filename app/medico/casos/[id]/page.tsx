import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function MedicoCasoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) notFound()

  const { id } = await params
  const caso = await prisma.caso.findUnique({
    where: { id },
    include: { informe: true, sesion: true, organizacion: true },
  })

  if (!caso || caso.medicoId !== session.user.id) notFound()

  const puedeProceder = caso.estado === 'en_revision'

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">
        {caso.nombreEvaluado} ({caso.rutEvaluado})
      </h1>

      <Card className="mt-4 max-w-2xl">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Organización</dt>
            <dd className="text-brand-text">{caso.organizacion.nombre}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Tipo de licencia</dt>
            <dd className="text-brand-text">{caso.tipoLicencia}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Estado</dt>
            <dd className="text-brand-text">{caso.estado}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Prioridad</dt>
            <dd className="text-brand-text">{caso.prioridad}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Fecha límite</dt>
            <dd className="text-brand-text">{caso.fechaLimite.toLocaleDateString('es-CL')}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-textSecondary">Ingreso</dt>
            <dd className="text-brand-text">{caso.fechaIngreso.toLocaleDateString('es-CL')}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-2">
          {puedeProceder ? (
            <>
              <Link
                href={`/medico/casos/${caso.id}/sesion`}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition bg-brand-accent text-white hover:bg-brand-accentHover shadow-sm"
              >
                Iniciar sesión
              </Link>
              <Link
                href={`/medico/casos/${caso.id}/informe`}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition bg-white text-brand-textSecondary border border-brand-border hover:border-brand-accent hover:text-brand-accent"
              >
                Ver/generar informe
              </Link>
            </>
          ) : (
            <p className="text-sm text-brand-textSecondary">
              Solo se puede proceder cuando el caso está en revisión.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
