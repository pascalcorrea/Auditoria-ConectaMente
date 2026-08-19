import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { obtenerOCrearSesion } from '@/lib/medico-sesion'
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

  const sesion = await obtenerOCrearSesion(id)

  if (!sesion.dailyRoomUrl) notFound()

  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="bg-brand-bg border-b border-brand-borderSoft p-4">
        <h1 className="text-sm font-medium text-brand-text">{caso.nombreEvaluado}</h1>
      </header>

      <DailyVideoRoom
        dailyRoomUrl={sesion.dailyRoomUrl}
        userName={`medico_${session.user.id}`}
        casoId={id}
        medicoId={session.user.id}
      />
    </div>
  )
}
