import { useCallback, useEffect, useState } from 'react'
import * as customerService from '../services/customerService'
import { toMessage } from '../services/api'
import type { Customer, CustomerInput } from '../types'

/**
 * Loads every customer once and keeps the local list in step with writes,
 * so the UI updates without a second round trip to the sheet.
 */
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCustomers(await customerService.getCustomers())
    } catch (err) {
      setError(toMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const addCustomer = useCallback(async (input: CustomerInput) => {
    const created = await customerService.createCustomer(input)
    setCustomers((prev) => [created, ...prev])
    return created
  }, [])

  const editCustomer = useCallback(async (customerId: string, input: CustomerInput) => {
    const updated = await customerService.updateCustomer(customerId, input)
    setCustomers((prev) => prev.map((c) => (c.customerId === customerId ? updated : c)))
    return updated
  }, [])

  const removeCustomer = useCallback(async (customerId: string, cascade = false) => {
    const result = await customerService.deleteCustomer(customerId, cascade)
    setCustomers((prev) => prev.filter((c) => c.customerId !== customerId))
    return result
  }, [])

  return { customers, loading, error, reload, addCustomer, editCustomer, removeCustomer }
}

/** Loads a single customer by id. */
export function useCustomer(customerId: string | undefined) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!customerId) {
      setCustomer(null)
      setLoading(false)
      setError('No customer was requested.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      setCustomer(await customerService.getCustomerById(customerId))
    } catch (err) {
      setError(toMessage(err))
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { customer, setCustomer, loading, error, reload }
}
