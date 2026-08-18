import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function AdminHome() {
  const session = await getServerSession(authOptions)
  return (
    <div className="p-8">
      <h1 className="text-lg font-medium text-brand-text">Backoffice</h1>
      <p className="text-sm text-brand-textSecondary">Sesión: {session?.user?.email} ({session?.user?.rol})</p>
    </div>
  )
}
