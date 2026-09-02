import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Alert } from '../ui/Alert'
import { formatRegistration, normalizeRegistration } from '../../utils/registration'
import { toMessage } from '../../services/api'
import { FUEL_TYPES, type FuelType, type Vehicle, type VehicleInput } from '../../types'

function emptyValues(customerId: string): VehicleInput {
  return {
    customerId,
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    fuelType: '',
    currentKm: '',
    notes: '',
  }
}

interface VehicleFormProps {
  open: boolean
  customerId: string
  /** Pass a vehicle to edit; omit to add a new one. */
  vehicle?: Vehicle | null
  onClose: () => void
  onSubmit: (input: VehicleInput) => Promise<unknown>
}

type Errors = Partial<Record<keyof VehicleInput, string>>

function validate(values: VehicleInput): Errors {
  const errors: Errors = {}
  const maxYear = new Date().getFullYear() + 1

  if (!normalizeRegistration(values.registrationNumber)) {
    errors.registrationNumber = 'Registration number is required.'
  }
  if (!values.make.trim()) errors.make = 'Make is required.'
  if (!values.model.trim()) errors.model = 'Model is required.'

  if (values.year.trim()) {
    const year = Number(values.year)
    if (!Number.isInteger(year) || year < 1900 || year > maxYear) {
      errors.year = `Enter a year between 1900 and ${maxYear}.`
    }
  }

  if (values.currentKm.trim()) {
    const km = Number(values.currentKm)
    if (Number.isNaN(km) || km < 0) errors.currentKm = 'Enter a reading of 0 or more.'
  }

  return errors
}

export function VehicleForm({ open, customerId, vehicle, onClose, onSubmit }: VehicleFormProps) {
  const [values, setValues] = useState<VehicleInput>(() => emptyValues(customerId))
  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(
      vehicle
        ? {
            customerId: vehicle.customerId || customerId,
            registrationNumber: formatRegistration(vehicle.registrationNumber),
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year === null ? '' : String(vehicle.year),
            fuelType: vehicle.fuelType,
            currentKm: vehicle.currentKm === null ? '' : String(vehicle.currentKm),
            notes: vehicle.notes,
          }
        : emptyValues(customerId),
    )
    setErrors({})
    setSubmitError(null)
    setSaving(false)
  }, [open, vehicle, customerId])

  const set =
    (field: keyof VehicleInput) =>
    (event: { target: { value: string } }) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return

    setSaving(true)
    setSubmitError(null)
    try {
      await onSubmit({ ...values, customerId })
      onClose()
    } catch (err) {
      setSubmitError(toMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const normalized = normalizeRegistration(values.registrationNumber)

  return (
    <Modal
      open={open}
      title={vehicle ? 'Edit vehicle' : 'Add vehicle'}
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="vehicle-form" loading={saving}>
            {vehicle ? 'Save changes' : 'Add vehicle'}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {submitError && <Alert>{submitError}</Alert>}

        <Input
          label="Registration number"
          required
          value={values.registrationNumber}
          onChange={set('registrationNumber')}
          error={errors.registrationNumber}
          placeholder="KL 07 AB 1234"
          autoCapitalize="characters"
          hint={normalized ? `Stored as ${normalized}` : 'Spaces and hyphens are ignored.'}
          className="font-mono uppercase"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Make"
            required
            value={values.make}
            onChange={set('make')}
            error={errors.make}
            placeholder="Maruti Suzuki"
          />
          <Input
            label="Model"
            required
            value={values.model}
            onChange={set('model')}
            error={errors.model}
            placeholder="Swift"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Year"
            type="number"
            inputMode="numeric"
            value={values.year}
            onChange={set('year')}
            error={errors.year}
            placeholder="2019"
          />
          <Select
            label="Fuel type"
            value={values.fuelType}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, fuelType: event.target.value as FuelType | '' }))
            }
          >
            <option value="">Not set</option>
            {FUEL_TYPES.map((fuel) => (
              <option key={fuel} value={fuel}>
                {fuel}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Odometer (km)"
          type="number"
          inputMode="numeric"
          value={values.currentKm}
          onChange={set('currentKm')}
          error={errors.currentKm}
          placeholder="58200"
        />

        <Textarea
          label="Notes"
          value={values.notes}
          onChange={set('notes')}
          rows={2}
          placeholder="CNG kit fitted 2019"
        />
      </form>
    </Modal>
  )
}
