import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatKm, formatRegistration } from '../../utils/registration'
import type { Vehicle } from '../../types'

interface VehicleCardProps {
  vehicle: Vehicle
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
}

export function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps) {
  const title = [vehicle.make, vehicle.model].filter(Boolean).join(' ')

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-base font-semibold tracking-wide text-ink">
            {formatRegistration(vehicle.registrationNumber)}
          </p>
          <p className="mt-0.5 truncate text-sm text-muted">
            {title}
            {vehicle.year ? ` · ${vehicle.year}` : ''}
          </p>
        </div>
        {vehicle.fuelType && <Badge tone="neutral">{vehicle.fuelType}</Badge>}
      </div>

      <dl className="mb-3 mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-muted">Odometer</dt>
          <dd className="font-medium text-ink">{formatKm(vehicle.currentKm)}</dd>
        </div>
      </dl>

      {vehicle.notes && (
        <p className="mt-3 rounded-lg bg-page px-3 py-2 text-sm text-muted">{vehicle.notes}</p>
      )}

      <div className="mt-auto flex justify-end gap-2 border-t border-line pt-3">
        <Button size="sm" variant="secondary" onClick={() => onEdit(vehicle)}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(vehicle)}>
          Delete
        </Button>
      </div>
    </div>
  )
}
