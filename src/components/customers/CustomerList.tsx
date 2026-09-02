import { CustomerCard } from './CustomerCard'
import type { Customer } from '../../types'

interface CustomerListProps {
  customers: Customer[]
  vehicleCounts?: Record<string, number>
  /** Shown in place of the list when there is nothing to render. */
  emptyMessage?: string
}

export function CustomerList({ customers, vehicleCounts, emptyMessage }: CustomerListProps) {
  if (!customers.length) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-muted">
        {emptyMessage ?? 'No customers yet.'}
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {customers.map((customer) => (
        <li key={customer.customerId}>
          <CustomerCard
            customer={customer}
            vehicleCount={vehicleCounts ? (vehicleCounts[customer.customerId] ?? 0) : undefined}
          />
        </li>
      ))}
    </ul>
  )
}
