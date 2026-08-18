import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { listarCasosCliente } from '@/lib/cliente-casos'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { EstadoCaso } from '@prisma/client'

const ESTADOS: { value: EstadoCaso | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'recibido', label: 'Recibido' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'informe_en_validacion', label: 'Informe en validación' },
  { value: 'entregado', label: 'Entregado' },
]

export const dynamic = 'force-dynamic'

export default async function ClienteCasosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizacionId) notFound()

  const { estado } = await searchParams
  const estadoFiltro = ESTADOS.some((e) => e.value === estado && estado !== '')
    ? (estado as EstadoCaso)
    : undefined

  const casos = await listarCasosCliente(session.user.organizacionId, estadoFiltro)

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Mis casos</h1>

      <form method="get" className="mt-4 flex max-w-xs items-end gap-4">
        <Select
          label="Estado"
          name="estado"
          defaultValue={estado ?? ''}
          options={ESTADOS.map((e) => ({ value: e.value, label: e.label }))}
        />
        <Button type="submit" variant="secondary">Filtrar</Button>
      </form>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-brand-textSecondary">
            <th className="pb-2">Evaluado</th>
            <th className="pb-2">Estado</th>
            <th className="pb-2">Prioridad</th>
            <th className="pb-2">Fecha límite</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((caso) => (
            <tr key={caso.id} className="border-t border-brand-borderSoft">
              <td className="py-2">
                <a href={`/cliente/casos/${caso.id}`} className="text-brand-accent underline">
                  {caso.nombreEvaluado} ({caso.rutEvaluado})
                </a>
              </td>
              <td className="py-2">{caso.estado}</td>
              <td className="py-2">{caso.prioridad}</td>
              <td className="py-2">{caso.fechaLimite.toLocaleDateString('es-CL')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
