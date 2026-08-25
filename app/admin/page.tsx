import { prisma } from '@/lib/prisma'
import AdminHeader from './AdminHeader'
import { ESTADOS_ACTIVOS } from '@/lib/asignacion'

export const dynamic = 'force-dynamic'

const ENLACES = [
  { href: '/admin/casos', title: 'Casos', desc: 'Ver y filtrar todos los casos' },
  { href: '/admin/casos/nuevo', title: 'Nuevo caso', desc: 'Ingreso individual' },
  { href: '/admin/casos/importar', title: 'Importar casos', desc: 'Carga masiva por Excel/CSV' },
  { href: '/admin/asignacion', title: 'Asignación', desc: 'Carga por médico y reasignación' },
] as const

export default async function AdminHome() {
  const [totalCasos, casosActivos, casosUrgentes, casosEntregados] = await Promise.all([
    prisma.caso.count(),
    prisma.caso.count({ where: { estado: { in: [...ESTADOS_ACTIVOS] } } }),
    prisma.caso.count({ where: { prioridad: 'urgente', estado: { in: [...ESTADOS_ACTIVOS] } } }),
    prisma.caso.count({ where: { estado: 'entregado' } }),
  ])

  const kpis = [
    { label: 'Total de casos', value: totalCasos, color: 'text-brand-text' },
    { label: 'Casos activos', value: casosActivos, color: 'text-brand-neutral' },
    { label: 'Urgentes activos', value: casosUrgentes, color: 'text-brand-danger' },
    { label: 'Entregados', value: casosEntregados, color: 'text-brand-accent' },
  ]

  return (
    <>
      <AdminHeader title="Panel Principal" />
      <div className="flex-1 overflow-auto p-8">
        <div className="mb-1 text-xl font-semibold text-brand-text">Hola, equipo ConectaMente</div>
        <div className="mb-7 text-sm text-brand-textSecondary">Resumen de actividad de auditoría de licencias médicas</div>

        <div className="mb-8 flex gap-4">
          {kpis.map((k: any) => (
            <div
              key={k.label}
              className="min-w-[160px] flex-1 rounded-xl border border-brand-borderSoft bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]"
            >
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-brand-textSecondary">{k.label}</div>
              <div className={`text-2xl font-semibold ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-brand-textMuted">Accesos rápidos</div>
        <div className="grid grid-cols-4 gap-4">
          {ENLACES.map((enlace: any) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="rounded-xl border border-brand-borderSoft bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] transition hover:border-brand-accent"
            >
              <div className="mb-3.5 h-8 w-8 rounded-lg bg-brand-accentSoft" />
              <div className="mb-1 text-sm font-semibold text-brand-text">{enlace.title}</div>
              <div className="text-xs text-brand-textSecondary">{enlace.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
