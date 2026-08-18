import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { NuevoCasoForm } from './NuevoCasoForm'

// See app/admin/casos/page.tsx for why this is needed — without it, Next
// prerenders the organización list at build time and it never updates.
export const dynamic = 'force-dynamic'

export default async function NuevoCasoPage() {
  const organizaciones = await prisma.organizacion.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  })

  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Nuevo caso</h1>
      <Card className="mt-4 max-w-md">
        <NuevoCasoForm organizaciones={organizaciones} />
      </Card>
    </div>
  )
}
