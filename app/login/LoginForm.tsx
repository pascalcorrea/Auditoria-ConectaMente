'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

// /medico doesn't exist yet (Fase 3) — a médico landing here would hit a
// 404, same as visiting any other not-yet-built route. Not this task's
// scope to fix; /admin and /cliente are the two portals that exist today.
const DEFAULT_ROUTE_BY_ROL: Record<string, string> = {
  backoffice: '/admin',
  cliente: '/cliente/casos',
  medico: '/medico',
}

// callbackUrl comes straight from the query string — an attacker-controlled
// value. NextAuth's own redirect() callback would normally reject a
// cross-origin target, but this form calls signIn(..., { redirect: false })
// and navigates by hand, which bypasses that check entirely. Only accept a
// same-origin path: must start with a single '/', never '//' (protocol-
// relative, e.g. //evil.com) or an absolute URL (e.g. https://evil.com).
function esCallbackUrlSegura(url: string): boolean {
  return /^\/(?!\/)/.test(url)
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

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

    // No callbackUrl means the user landed on /login directly (not bounced
    // here from a protected route) — route them to their own portal by
    // role, since /admin (the old hardcoded fallback) 404s any non-
    // backoffice user out through middleware.ts and back to /login in an
    // unbreakable loop.
    const callbackUrl = searchParams.get('callbackUrl')
    if (callbackUrl && esCallbackUrlSegura(callbackUrl)) {
      router.push(callbackUrl)
      return
    }

    const session = await getSession()
    const destino = (session?.user?.rol && DEFAULT_ROUTE_BY_ROL[session.user.rol]) ?? '/login'
    setLoading(false)
    router.push(destino)
  }

  return (
    <Card className="w-full max-w-sm px-9 py-10">
      <div className="mx-auto mb-5 flex justify-center">
        <Image
          src="/logo.svg"
          alt="ConectaMente"
          width={60}
          height={60}
          priority
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
