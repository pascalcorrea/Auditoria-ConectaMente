import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DailyVideoRoom } from '@/components/DailyVideoRoom'

export const dynamic = 'force-dynamic'

export default async function MedicoCasoSesionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) notFound()

  const { id } = await params
  const caso = await prisma.caso.findUnique({
    where: { id },
  })

  if (!caso || caso.medicoId !== session.user.id) notFound()

  const sesion = await prisma.sesion.findFirst({
    where: { casoId: id },
  })

  if (!sesion) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-brand-bg">
        <div className="max-w-sm rounded-lg border border-brand-borderSoft bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-base font-semibold text-brand-text">Sesión no agendada</h2>
          <p className="text-sm text-brand-textSecondary">
            La sesión aún no ha sido agendada. Contacta a backoffice para coordinar la cita.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="bg-brand-bg border-b border-brand-borderSoft p-4">
        <h1 className="text-sm font-medium text-brand-text">{caso.nombreEvaluado}</h1>
      </header>

      <DailyVideoRoom casoId={id} />
    </div>
  )
}
