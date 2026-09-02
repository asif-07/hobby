import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'

const CONTROL =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 ' +
  'transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:bg-page'

interface FieldShellProps {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}

function FieldShell({ id, label, required, hint, error, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, required, className = '', ...rest }: InputProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error}>
      <input
        {...rest}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${CONTROL} ${error ? 'border-red-400' : 'border-line'} ${className}`}
      />
    </FieldShell>
  )
}

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, required, className = '', rows = 3, ...rest }: TextareaProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error}>
      <textarea
        {...rest}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${CONTROL} resize-y ${error ? 'border-red-400' : 'border-line'} ${className}`}
      />
    </FieldShell>
  )
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

export function Select({ label, hint, error, required, className = '', children, ...rest }: SelectProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error}>
      <select
        {...rest}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${CONTROL} ${error ? 'border-red-400' : 'border-line'} ${className}`}
      >
        {children}
      </select>
    </FieldShell>
  )
}
