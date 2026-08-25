import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { listarTodosCasos, obtenerCargaMedicos, reasignarCaso } from '@/lib/admin-casos'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

export const dynamic = 'force-dynamic'

async function handleReasignar(formData: FormData) {
  'use server'

  const casoId = formData.get('casoId') as string
  const medicoId = formData.get('medicoId') as string

  if (!casoId || !medicoId) return

  await reasignarCaso(casoId, medicoId)
}

export default async function AdminAsignacionPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.rol !== 'backoffice') notFound()

  const todos = await listarTodosCasos()
  const medicos = await obtenerCargaMedicos()

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Asignación de casos</h1>

      <Card className="mt-4 p-4">
        <h2 className="text-sm font-medium text-brand-text mb-4">Carga de médicos</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-brand-textSecondary">
              <th className="pb-2 text-left">Médico</th>
              <th className="pb-2 text-left">Especialidad</th>
              <th className="pb-2 text-right">Casos activos</th>
            </tr>
          </thead>
          <tbody>
            {medicos.map((m: typeof medicos[0]) => (
              <tr key={m.id} className="border-t border-brand-borderSoft">
                <td className="py-2">{m.nombre}</td>
                <td className="py-2">{m.especialidad || '—'}</td>
                <td className="py-2 text-right">{m.casosActivos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-6 p-4">
        <h2 className="text-sm font-medium text-brand-text mb-4">Reasignar caso</h2>
        <form action={handleReasignar} className="space-y-4">
          <Select
            name="casoId"
            label="Caso"
            options={todos
              .filter((c: typeof todos[0]) => c.estado !== 'entregado')
              .map((c: typeof todos[0]) => ({ value: c.id, label: `${c.nombreEvaluado} (${c.organizacion.nombre})` }))}
            required
          />
          <Select
            name="medicoId"
            label="Asignar a"
            options={medicos.map((m) => ({ value: m.id, label: `${m.nombre} (${m.casosActivos} casos)` }))}
            required
          />
          <Button type="submit">Reasignar</Button>
        </form>
      </Card>
    </div>
  )
}
