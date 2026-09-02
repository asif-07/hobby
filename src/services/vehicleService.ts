import { apiGet, apiPost } from './api'
import { normalizeRegistration } from '../utils/registration'
import type { Vehicle, VehicleInput } from '../types'

/** Converts the string-typed form values into the payload the API expects. */
function toPayload(input: VehicleInput) {
  return {
    customerId: input.customerId,
    registrationNumber: normalizeRegistration(input.registrationNumber),
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year.trim(),
    fuelType: input.fuelType,
    currentKm: input.currentKm.trim(),
    notes: input.notes.trim(),
  }
}

export function getVehicles(): Promise<Vehicle[]> {
  return apiGet<Vehicle[]>('getVehicles')
}

export function getVehicleById(vehicleId: string): Promise<Vehicle> {
  return apiGet<Vehicle>('getVehicleById', { vehicleId })
}

export function getVehiclesByCustomerId(customerId: string): Promise<Vehicle[]> {
  return apiGet<Vehicle[]>('getVehiclesByCustomerId', { customerId })
}

export function createVehicle(input: VehicleInput): Promise<Vehicle> {
  return apiPost<Vehicle>('createVehicle', toPayload(input))
}

export function updateVehicle(vehicleId: string, input: VehicleInput): Promise<Vehicle> {
  return apiPost<Vehicle>('updateVehicle', { vehicleId, ...toPayload(input) })
}

export function deleteVehicle(vehicleId: string): Promise<{ vehicleId: string }> {
  return apiPost('deleteVehicle', { vehicleId })
}
