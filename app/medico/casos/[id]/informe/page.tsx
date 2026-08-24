import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { BotonFirmar } from '@/components/BotonFirmar'

export const dynamic = 'force-dynamic'

export default async function MedicoCasoInformePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'medico' || !session.user?.id) notFound()

  const { id } = await params
  const caso = await prisma.caso.findUnique({
    where: { id },
    include: { informe: true },
  })

  if (!caso || caso.medicoId !== session.user.id) notFound()

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Informe: {caso.nombreEvaluado}</h1>

      <Card className="mt-4 max-w-2xl p-6">
        {caso.informe ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-brand-textSecondary">
                Generado en: {caso.informe.generadoEn.toLocaleString('es-CL')}
              </p>
              {caso.informe.firmaTimestamp && (
                <p className="text-sm text-brand-textSecondary">
                  Firmado en: {caso.informe.firmaTimestamp.toLocaleString('es-CL')}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href={caso.informe.archivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition bg-white text-brand-textSecondary border border-brand-border hover:border-brand-accent hover:text-brand-accent"
              >
                Descargar PDF
              </Link>

              {caso.informe.archivoFirmadoUrl && (
                <Link
                  href={caso.informe.archivoFirmadoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition bg-white text-brand-textSecondary border border-brand-border hover:border-brand-accent hover:text-brand-accent"
                >
                  Descargar Firmado
                </Link>
              )}

              {!caso.informe.archivoFirmadoUrl && (
                <BotonFirmar casoId={id} />
              )}
            </div>
          </div>
        ) : (
          <form action={`/api/medico/casos/${id}/informe/generar`} method="POST">
            <p className="text-sm text-brand-textSecondary mb-4">Genera el informe de evaluación:</p>
            <Textarea
              name="contenido"
              placeholder="Contenido del informe..."
              rows={10}
              required
              className="mb-4"
            />
            <Button type="submit">Generar informe PDF</Button>
          </form>
        )}
      </Card>
    </div>
  )
}
