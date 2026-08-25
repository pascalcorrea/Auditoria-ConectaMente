import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import { InputHTMLAttributes, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...rest }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wide text-brand-textSecondary">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        className={`rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none transition focus:border-brand-accent focus:bg-white focus:ring-2 focus:ring-brand-accent/20 ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-brand-danger">{error}</span>}
    </div>
  )
}
