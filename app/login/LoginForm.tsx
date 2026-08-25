'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const DEFAULT_ROUTE_BY_ROL: Record<string, string> = {
  backoffice: '/admin',
  cliente: '/cliente/casos',
  medico: '/medico',
}

function esCallbackUrlSegura(url: string): boolean {
  return /^\/(?!\/)/.test(url)
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setLoading(false)
        setError('Email o contraseña incorrectos')
        return
      }

      const callbackUrl = searchParams.get('callbackUrl')
      if (callbackUrl && esCallbackUrlSegura(callbackUrl)) {
        router.push(callbackUrl)
        return
      }

      setTimeout(() => {
        setLoading(false)
        if (session?.user?.rol) {
          const destino = DEFAULT_ROUTE_BY_ROL[session.user.rol] ?? '/login'
          router.push(destino)
        } else {
          router.push('/admin')
        }
      }, 300)
    } catch (err) {
      console.error('Login error:', err)
      setLoading(false)
      setError('Error al iniciar sesión. Intenta de nuevo.')
    }
  }

  return (
    <Card className="w-full max-w-sm px-9 py-10">
      <div className="mx-auto mb-5 flex justify-center">
        <img
          src="/logo.png"
          alt="ConectaMente"
          width={120}
          height={60}
          className="h-16 w-auto"
        />
      </div>
      <h1 className="mb-1 text-center text-lg font-semibold text-brand-text">ConectaMente Core</h1>
      <p className="mb-7 text-center text-sm text-brand-textSecondary">Plataforma de auditoría de licencias médicas</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          error={error ?? undefined}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </Card>
  )
}
