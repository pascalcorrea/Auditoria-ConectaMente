import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ENLACES = [
  { href: '/admin/casos', label: 'Casos' },
  { href: '/admin/casos/nuevo', label: 'Nuevo caso' },
  { href: '/admin/casos/importar', label: 'Importar casos (Excel)' },
  { href: '/admin/asignacion', label: 'Asignación' },
] as const

export default async function AdminHome() {
  const session = await getServerSession(authOptions)
  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Backoffice</h1>
      <p className="text-sm text-brand-textSecondary">Sesión: {session?.user?.email} ({session?.user?.rol})</p>
      <ul className="mt-6 flex flex-col gap-2">
        {ENLACES.map((enlace) => (
          <li key={enlace.href}>
            <a href={enlace.href} className="text-sm text-brand-accent underline">
              {enlace.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
