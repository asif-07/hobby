import type { ReactNode } from 'react'

type Tone = 'error' | 'warning' | 'info'

const TONES: Record<Tone, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-brand/20 bg-brand-light text-brand-dark',
}

interface AlertProps {
  tone?: Tone
  title?: string
  children: ReactNode
  /** Rendered on the right, e.g. a "Try again" button. */
  action?: ReactNode
}

export function Alert({ tone = 'error', title, children, action }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${TONES[tone]}`}
    >
      <div>
        {title && <p className="font-medium">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
