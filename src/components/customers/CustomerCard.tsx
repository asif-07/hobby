import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { whatsappLink } from '../../utils/registration'
import type { Customer } from '../../types'

interface CustomerCardProps {
  customer: Customer
  /** Number of vehicles on file; omit while the count is still loading. */
  vehicleCount?: number
}

export function CustomerCard({ customer, vehicleCount }: CustomerCardProps) {
  const initials = customer.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <Link
      to={`/customers/${customer.customerId}`}
      className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-sm transition-colors hover:border-brand/40 hover:bg-brand-light/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand-dark">
        {initials || '?'}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{customer.name}</span>
        <span className="block truncate text-sm text-muted">
          {customer.phone}
          {customer.address && <span className="hidden sm:inline"> · {customer.address}</span>}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {customer.whatsapp && (
          <span
            role="link"
            tabIndex={0}
            aria-label={`Open WhatsApp chat with ${customer.name}`}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              window.open(whatsappLink(customer.whatsapp), '_blank', 'noopener')
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              event.stopPropagation()
              window.open(whatsappLink(customer.whatsapp), '_blank', 'noopener')
            }}
            className="hidden rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 sm:inline-flex"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 20zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1s-.6.8-.7.9-.3.2-.5.1a6.5 6.5 0 01-3.2-2.8c-.2-.4.2-.4.6-1.2l-.1-.4-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 00-.7.3c-.3.3-.9.9-.9 2.1s.9 2.5 1 2.6a9.6 9.6 0 003.7 3.3c1.8.7 1.8.5 2.2.5s1.4-.6 1.6-1.1.2-1 .1-1.1z" />
            </svg>
          </span>
        )}

        {vehicleCount !== undefined && (
          <Badge tone={vehicleCount ? 'brand' : 'neutral'}>
            {vehicleCount} {vehicleCount === 1 ? 'vehicle' : 'vehicles'}
          </Badge>
        )}

        <svg viewBox="0 0 20 20" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  )
}
