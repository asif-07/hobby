import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Alert } from '../ui/Alert'
import { normalizePhone } from '../../utils/registration'
import { toMessage } from '../../services/api'
import type { Customer, CustomerInput } from '../../types'

const EMPTY: CustomerInput = { name: '', phone: '', whatsapp: '', address: '', notes: '' }

interface CustomerFormProps {
  open: boolean
  /** Pass a customer to edit; omit to create a new one. */
  customer?: Customer | null
  onClose: () => void
  onSubmit: (input: CustomerInput) => Promise<unknown>
}

type Errors = Partial<Record<keyof CustomerInput, string>>

function validate(values: CustomerInput): Errors {
  const errors: Errors = {}

  if (!values.name.trim()) errors.name = 'Name is required.'

  const phone = normalizePhone(values.phone).replace('+', '')
  if (!phone) errors.phone = 'Phone number is required.'
  else if (phone.length < 7) errors.phone = 'That phone number looks too short.'

  if (values.whatsapp.trim()) {
    const whatsapp = normalizePhone(values.whatsapp).replace('+', '')
    if (whatsapp.length < 7) errors.whatsapp = 'That WhatsApp number looks too short.'
  }

  return errors
}

export function CustomerForm({ open, customer, onClose, onSubmit }: CustomerFormProps) {
  const [values, setValues] = useState<CustomerInput>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Reset whenever the dialog opens, so a cancelled edit leaves nothing behind.
  useEffect(() => {
    if (!open) return
    setValues(
      customer
        ? {
            name: customer.name,
            phone: customer.phone,
            whatsapp: customer.whatsapp,
            address: customer.address,
            notes: customer.notes,
          }
        : EMPTY,
    )
    setErrors({})
    setSubmitError(null)
    setSaving(false)
  }, [open, customer])

  const set = (field: keyof CustomerInput) => (event: { target: { value: string } }) => {
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
      await onSubmit({
        name: values.name.trim(),
        phone: values.phone.trim(),
        whatsapp: values.whatsapp.trim(),
        address: values.address.trim(),
        notes: values.notes.trim(),
      })
      onClose()
    } catch (err) {
      setSubmitError(toMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={customer ? 'Edit customer' : 'Add customer'}
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" loading={saving}>
            {customer ? 'Save changes' : 'Add customer'}
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {submitError && <Alert>{submitError}</Alert>}

        <Input
          label="Name"
          required
          value={values.name}
          onChange={set('name')}
          error={errors.name}
          placeholder="Anil Kumar"
          autoComplete="name"
        />

        <Input
          label="Phone"
          required
          type="tel"
          inputMode="tel"
          value={values.phone}
          onChange={set('phone')}
          error={errors.phone}
          placeholder="9847012345"
          autoComplete="tel"
        />

        <Input
          label="WhatsApp"
          type="tel"
          inputMode="tel"
          value={values.whatsapp}
          onChange={set('whatsapp')}
          error={errors.whatsapp}
          hint="Leave blank if it is the same as the phone number."
          placeholder="9847012345"
        />

        <Textarea
          label="Address"
          value={values.address}
          onChange={set('address')}
          rows={2}
          placeholder="Kaloor, Kochi"
        />

        <Textarea
          label="Notes"
          value={values.notes}
          onChange={set('notes')}
          rows={2}
          placeholder="Prefers Saturday morning slots"
        />
      </form>
    </Modal>
  )
}
