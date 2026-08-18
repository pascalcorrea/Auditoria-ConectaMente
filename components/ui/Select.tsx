import { SelectHTMLAttributes, useId } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
}

export function Select({ label, options, id, className = '', ...rest }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-xs font-medium uppercase tracking-wide text-brand-textSecondary">
        {label}
      </label>
      <select
        id={selectId}
        className={`rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none transition focus:border-brand-accent focus:bg-white focus:ring-2 focus:ring-brand-accent/20 ${className}`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
