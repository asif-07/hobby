import { apiGet, apiPost } from './api'
import type { Customer, CustomerInput, SearchResults } from '../types'

export function getCustomers(): Promise<Customer[]> {
  return apiGet<Customer[]>('getCustomers')
}

export function getCustomerById(customerId: string): Promise<Customer> {
  return apiGet<Customer>('getCustomerById', { customerId })
}

export function createCustomer(input: CustomerInput): Promise<Customer> {
  return apiPost<Customer>('createCustomer', input)
}

export function updateCustomer(customerId: string, input: CustomerInput): Promise<Customer> {
  return apiPost<Customer>('updateCustomer', { customerId, ...input })
}

/**
 * Deletes a customer. Without `cascade` the server refuses when the customer
 * still has vehicles, raising an ApiError with code 'HAS_VEHICLES' so the UI
 * can confirm first.
 */
export function deleteCustomer(customerId: string, cascade = false): Promise<{ customerId: string; deletedVehicles: number }> {
  return apiPost('deleteCustomer', { customerId, cascade })
}

export function search(query: string): Promise<SearchResults> {
  return apiGet<SearchResults>('search', { q: query })
}
