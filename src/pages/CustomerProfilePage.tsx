import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CustomerForm } from '../components/customers/CustomerForm'
import { VehicleCard } from '../components/vehicles/VehicleCard'
import { VehicleForm } from '../components/vehicles/VehicleForm'
import { useCustomer } from '../hooks/useCustomers'
import { useVehicles } from '../hooks/useVehicles'
import { deleteCustomer, updateCustomer } from '../services/customerService'
import { toMessage } from '../services/api'
import { formatDate, formatRegistration, whatsappLink } from '../utils/registration'
import type { CustomerInput, Vehicle } from '../types'

export function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { customer, setCustomer, loading, error, reload } = useCustomer(id)
  const vehicles = useVehicles(id)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [vehicleFormOpen, setVehicleFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState(false)

  const handleEditCustomer = async (input: CustomerInput) => {
    if (!customer) return
    const updated = await updateCustomer(customer.customerId, input)
    setCustomer(updated)
  }

  const handleDeleteCustomer = async () => {
    if (!customer) return
    setDeleting(true)
    setDeleteError(null)
    try {
      // The server refuses a delete that would orphan vehicles unless we opt
      // in, and the dialog has already said how many will go with it.
      await deleteCustomer(customer.customerId, vehicles.vehicles.length > 0)
      navigate('/customers', { replace: true })
    } catch (err) {
      setDeleteError(toMessage(err))
      setDeleting(false)
    }
  }

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return
    setDeletingVehicle(true)
    try {
      await vehicles.removeVehicle(vehicleToDelete.vehicleId)
      setVehicleToDelete(null)
    } catch {
      // The list reload surfaces the real state; keep the dialog open.
      await vehicles.reload()
    } finally {
      setDeletingVehicle(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading customer…" />

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Alert
          action={
            <Button size="sm" variant="secondary" onClick={() => void reload()}>
              Try again
            </Button>
          }
        >
          {error ?? 'Customer not found.'}
        </Alert>
        <Link to="/customers" className="text-sm font-medium text-brand hover:text-brand-dark">
          ← Back to customers
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/customers" className="inline-flex text-sm font-medium text-brand hover:text-brand-dark">
        ← Back to customers
      </Link>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-ink">{customer.name}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {customer.customerId}
              {customer.createdAt && ` · added ${formatDate(customer.createdAt)}`}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Phone</dt>
              <dd className="mt-0.5 text-sm text-ink">
                <a href={`tel:${customer.phone}`} className="hover:text-brand">
                  {customer.phone}
                </a>
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">WhatsApp</dt>
              <dd className="mt-0.5 text-sm text-ink">
                {customer.whatsapp ? (
                  <a
                    href={whatsappLink(customer.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline"
                  >
                    {customer.whatsapp}
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Address</dt>
              <dd className="mt-0.5 text-sm text-ink">
                {customer.address || <span className="text-muted">—</span>}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Notes</dt>
              <dd className="mt-0.5 whitespace-pre-line text-sm text-ink">
                {customer.notes || <span className="text-muted">—</span>}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Vehicles
            {!vehicles.loading && (
              <Badge tone={vehicles.vehicles.length ? 'brand' : 'neutral'}>
                {vehicles.vehicles.length}
              </Badge>
            )}
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setEditingVehicle(null)
              setVehicleFormOpen(true)
            }}
          >
            + Add vehicle
          </Button>
        </div>

        {vehicles.loading && <LoadingSpinner label="Loading vehicles…" />}

        {vehicles.error && (
          <Alert
            action={
              <Button size="sm" variant="secondary" onClick={() => void vehicles.reload()}>
                Try again
              </Button>
            }
          >
            {vehicles.error}
          </Alert>
        )}

        {!vehicles.loading && !vehicles.error && (
          vehicles.vehicles.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {vehicles.vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.vehicleId}
                  vehicle={vehicle}
                  onEdit={(target) => {
                    setEditingVehicle(target)
                    setVehicleFormOpen(true)
                  }}
                  onDelete={setVehicleToDelete}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-muted">
              No vehicles on file for this customer yet.
            </p>
          )
        )}
      </section>

      <CustomerForm
        open={editOpen}
        customer={customer}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditCustomer}
      />

      <VehicleForm
        open={vehicleFormOpen}
        customerId={customer.customerId}
        vehicle={editingVehicle}
        onClose={() => {
          setVehicleFormOpen(false)
          setEditingVehicle(null)
        }}
        onSubmit={(input) =>
          editingVehicle
            ? vehicles.editVehicle(editingVehicle.vehicleId, input)
            : vehicles.addVehicle(input)
        }
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete customer"
        message={`Delete ${customer.name}? This cannot be undone.`}
        warning={
          deleteError ??
          (vehicles.vehicles.length
            ? `This will also delete ${vehicles.vehicles.length} ${
                vehicles.vehicles.length === 1 ? 'vehicle' : 'vehicles'
              } on file for this customer.`
            : undefined)
        }
        loading={deleting}
        onConfirm={() => void handleDeleteCustomer()}
        onCancel={() => {
          setDeleteOpen(false)
          setDeleteError(null)
        }}
      />

      <ConfirmDialog
        open={vehicleToDelete !== null}
        title="Delete vehicle"
        message={
          vehicleToDelete
            ? `Delete ${formatRegistration(vehicleToDelete.registrationNumber)}? This cannot be undone.`
            : ''
        }
        loading={deletingVehicle}
        onConfirm={() => void handleDeleteVehicle()}
        onCancel={() => setVehicleToDelete(null)}
      />
    </div>
  )
}
