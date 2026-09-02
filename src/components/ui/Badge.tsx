import type { ReactNode } from 'react'

type Tone = 'brand' | 'neutral' | 'green' | 'amber'

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-light text-brand-dark',
  neutral: 'bg-page text-muted border border-line',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
}

export function Badge({ tone = 'brand', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}
