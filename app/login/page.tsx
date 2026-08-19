import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Acceso — ConectaMente Core' }
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div
      style={{ background: 'linear-gradient(135deg, #EDF0F5 0%, #E8EEF6 50%, #EAF2ED 100%)' }}
      className="flex min-h-screen items-center justify-center p-4"
    >
      <Suspense fallback={<div className="text-center">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
