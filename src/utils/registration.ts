/**
 * Registration numbers are stored without separators and in upper case, so
 * "KL 10 AB 1234", "KL10-AB-1234" and "kl10ab1234" are all the same vehicle.
 */
export function normalizeRegistration(value: string): string {
  return value.replace(/[\s\-_.]/g, '').toUpperCase()
}

/**
 * Formats a stored registration for display: "KL07AB1234" -> "KL 07 AB 1234".
 * Falls back to the raw value when it doesn't match the Indian plate pattern.
 */
export function formatRegistration(value: string): string {
  const normalized = normalizeRegistration(value)
  const match = /^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/.exec(normalized)
  if (!match) return normalized
  return [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ')
}

/** Keeps digits and a leading + so phone numbers compare reliably. */
export function normalizePhone(value: string): string {
  const trimmed = value.trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  return plus + trimmed.replace(/\D/g, '')
}

/** Builds a wa.me link, assuming an Indian number when no country code is given. */
export function whatsappLink(value: string): string {
  const digits = normalizePhone(value).replace('+', '')
  const withCountry = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${withCountry}`
}

/** "12,450 km" — or an em dash when the reading is unknown. */
export function formatKm(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—'
  return `${value.toLocaleString('en-IN')} km`
}

/** "2 Mar 2026" — or an empty string when the date is missing/invalid. */
export function formatDate(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
