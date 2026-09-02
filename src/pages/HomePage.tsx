import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { SearchBar } from '../components/ui/SearchBar'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { CustomerList } from '../components/customers/CustomerList'
import { CustomerForm } from '../components/customers/CustomerForm'
import { useCustomers } from '../hooks/useCustomers'
import { search } from '../services/customerService'
import { isConfigured, toMessage } from '../services/api'
import { formatRegistration } from '../utils/registration'
import type { SearchResults } from '../types'

const RECENT_LIMIT = 10

export function HomePage() {
  const { customers, loading, error, reload, addCustomer } = useCustomers()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  // Debounced search — the sheet is slow enough that a request per keystroke
  // would queue up behind itself.
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2 || !isConfigured()) {
      setResults(null)
      setSearchError(null)
      setSearching(false)
      return
    }

    let cancelled = false
    setSearching(true)

    const timer = window.setTimeout(() => {
      search(trimmed)
        .then((found) => {
          if (!cancelled) {
            setResults(found)
            setSearchError(null)
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setResults(null)
            setSearchError(toMessage(err))
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query])

  const recent = useMemo(() => customers.slice(0, RECENT_LIMIT), [customers])
  const showingResults = query.trim().length >= 2

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">NewTown Garage</h1>
        <p className="mt-1 text-sm text-muted">
          Find a customer by name, phone number or registration number.
        </p>

        <div className="mx-auto mt-5 max-w-2xl">
          <SearchBar
            value={query}
            onChange={setQuery}
            size="lg"
            placeholder="Search name, phone or KL 07 AB 1234"
          />
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <Button onClick={() => setFormOpen(true)}>+ Add customer</Button>
          {!loading && !error && (
            <Badge tone="neutral">
              {customers.length} {customers.length === 1 ? 'customer' : 'customers'} on file
            </Badge>
          )}
        </div>
      </section>

      {showingResults ? (
        <section className="space-y-4">
          {searching && <LoadingSpinner label="Searching…" />}
          {searchError && <Alert>{searchError}</Alert>}

          {!searching && !searchError && results && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Results for “{results.query}”
              </h2>

              {!results.customers.length && !results.vehicles.length && (
                <p className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-muted">
                  Nothing matched that search.
                </p>
              )}

              {results.customers.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-ink">Customers</h3>
                  <CustomerList customers={results.customers} />
                </div>
              )}

              {results.vehicles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-ink">Vehicles</h3>
                  <ul className="space-y-2">
                    {results.vehicles.map((vehicle) => (
                      <li key={vehicle.vehicleId}>
                        <Link
                          to={`/customers/${vehicle.customerId}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-sm transition-colors hover:border-brand/40 hover:bg-brand-light/40"
                        >
                          <span className="min-w-0">
                            <span className="block font-mono font-semibold text-ink">
                              {formatRegistration(vehicle.registrationNumber)}
                            </span>
                            <span className="block truncate text-sm text-muted">
                              {[vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                              {vehicle.customerName ? ` · ${vehicle.customerName}` : ''}
                            </span>
                          </span>
                          {vehicle.fuelType && <Badge tone="neutral">{vehicle.fuelType}</Badge>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Recent customers
            </h2>
            {customers.length > RECENT_LIMIT && (
              <Link to="/customers" className="text-sm font-medium text-brand hover:text-brand-dark">
                View all
              </Link>
            )}
          </div>

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
              customers={recent}
              emptyMessage="No customers yet — add the first one to get started."
            />
          )}
        </section>
      )}

      <CustomerForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={addCustomer}
      />
    </div>
  )
}
