export const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'] as const

export type FuelType = (typeof FUEL_TYPES)[number]

export interface Customer {
  customerId: string
  name: string
  phone: string
  whatsapp: string
  address: string
  notes: string
  createdAt: string
  updatedAt: string
}

/** The editable fields of a customer. */
export interface CustomerInput {
  name: string
  phone: string
  whatsapp: string
  address: string
  notes: string
}

export interface Vehicle {
  vehicleId: string
  customerId: string
  registrationNumber: string
  make: string
  model: string
  year: number | null
  fuelType: FuelType | ''
  currentKm: number | null
  notes: string
  createdAt: string
  updatedAt: string
}

/** A vehicle returned by search, carrying its owner's details. */
export interface VehicleWithOwner extends Vehicle {
  customerName: string
  customerPhone: string
}

/** The editable fields of a vehicle. Numbers stay strings while in the form. */
export interface VehicleInput {
  customerId: string
  registrationNumber: string
  make: string
  model: string
  year: string
  fuelType: FuelType | ''
  currentKm: string
  notes: string
}

export interface SearchResults {
  query: string
  customers: Customer[]
  vehicles: VehicleWithOwner[]
}

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiFailure<T = unknown> {
  success: false
  error: string
  code?: string
  data?: T
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
