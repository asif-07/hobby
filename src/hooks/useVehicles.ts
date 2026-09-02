import { useCallback, useEffect, useState } from 'react'
import * as vehicleService from '../services/vehicleService'
import { toMessage } from '../services/api'
import type { Vehicle, VehicleInput } from '../types'

/** Loads one customer's vehicles and keeps the list in step with writes. */
export function useVehicles(customerId: string | undefined) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!customerId) {
      setVehicles([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setVehicles(await vehicleService.getVehiclesByCustomerId(customerId))
    } catch (err) {
      setError(toMessage(err))
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    void reload()
  }, [reload])

  const addVehicle = useCallback(async (input: VehicleInput) => {
    const created = await vehicleService.createVehicle(input)
    setVehicles((prev) => [...prev, created])
    return created
  }, [])

  const editVehicle = useCallback(async (vehicleId: string, input: VehicleInput) => {
    const updated = await vehicleService.updateVehicle(vehicleId, input)
    setVehicles((prev) => prev.map((v) => (v.vehicleId === vehicleId ? updated : v)))
    return updated
  }, [])

  const removeVehicle = useCallback(async (vehicleId: string) => {
    await vehicleService.deleteVehicle(vehicleId)
    setVehicles((prev) => prev.filter((v) => v.vehicleId !== vehicleId))
  }, [])

  return { vehicles, loading, error, reload, addVehicle, editVehicle, removeVehicle }
}

/**
 * Loads every vehicle once, for screens that only need per-customer counts.
 * Failures are swallowed into an empty map — the count is a nice-to-have and
 * should never block the customer list from rendering.
 */
export function useVehicleCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    vehicleService
      .getVehicles()
      .then((vehicles) => {
        if (cancelled) return
        const next: Record<string, number> = {}
        vehicles.forEach((v) => {
          next[v.customerId] = (next[v.customerId] ?? 0) + 1
        })
        setCounts(next)
      })
      .catch(() => {
        if (!cancelled) setCounts({})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { counts, loading }
}
