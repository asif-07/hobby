import { useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { SearchBar } from '../components/ui/SearchBar'
import { Alert } from '../components/ui/Alert'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { CustomerList } from '../components/customers/CustomerList'
import { CustomerForm } from '../components/customers/CustomerForm'
import { useCustomers } from '../hooks/useCustomers'
import { useVehicleCounts } from '../hooks/useVehicles'
import { normalizePhone } from '../utils/registration'

export function CustomersPage() {
  const { customers, loading, error, reload, addCustomer } = useCustomers()
  const { counts } = useVehicleCounts()

  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  // The full list is already in memory, so filtering here beats a round trip.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers

    const digits = q.replace(/\D/g, '')
    return customers.filter((customer) => {
      if (customer.name.toLowerCase().includes(q)) return true
      if (customer.address.toLowerCase().includes(q)) return true
      if (digits && normalizePhone(customer.phone).includes(digits)) return true
      if (digits && customer.whatsapp && normalizePhone(customer.whatsapp).includes(digits)) return true
      return false
    })
  }, [customers, query])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Customers</h1>
          <p className="text-sm text-muted">
            {loading ? 'Loading…' : `${customers.length} on file`}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>+ Add customer</Button>
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="Filter by name, phone or address" />

      {loading && <LoadingSpinner label="Loading customers…" />}

      {error && (
        <Alert
          action={
            <Button size="sm" variant="secondary" onClick={() => void reload()}>
              Try again
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <CustomerList
          customers={filtered}
          vehicleCounts={counts}
          emptyMessage={
            query.trim()
              ? `No customer matches “${query.trim()}”.`
              : 'No customers yet — add the first one to get started.'
          }
        />
      )}

      <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={addCustomer} />
    </div>
  )
}
