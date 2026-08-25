import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { TopHeader } from '@/components/layout/TopHeader'
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
    <>
      <TopHeader title="Nuevo caso" />
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto w-[680px] rounded-xl border border-brand-borderSoft bg-white p-9 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
          <NuevoCasoForm organizaciones={organizaciones} />
        </div>
      </div>
    </>
  )
}
