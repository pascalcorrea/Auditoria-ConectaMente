import { forwardRef } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full px-3 py-2 border border-brand-borderSoft rounded-lg bg-brand-bg text-brand-text placeholder-brand-textSecondary focus:outline-none focus:ring-2 focus:ring-brand-accent ${className || ''}`}
      {...props}
    />
  )
)

Textarea.displayName = 'Textarea'
