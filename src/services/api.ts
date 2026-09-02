import type { ApiResponse } from '../types'

const BASE_URL = (import.meta.env.VITE_APPS_SCRIPT_URL ?? '').trim()

/**
 * True once VITE_APPS_SCRIPT_URL points at a deployed web app. The /exec check
 * catches the two URLs people paste by mistake: the script editor URL, and the
 * /dev URL, which only works while signed in as the script owner.
 */
export function isConfigured(): boolean {
  return /^https?:\/\//.test(BASE_URL) && BASE_URL.includes('/exec')
}

/** An error carrying the server's error code and any extra payload. */
export class ApiError extends Error {
  code: string
  data: unknown

  constructor(message: string, code = 'ERROR', data: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
  }
}

const NOT_CONFIGURED =
  'The Google Sheets backend is not connected yet. Copy .env.example to .env.local and ' +
  'set VITE_APPS_SCRIPT_URL to your Apps Script web app URL, then restart the dev server.'

function assertConfigured(): void {
  if (!isConfigured()) throw new ApiError(NOT_CONFIGURED, 'NOT_CONFIGURED')
}

/** Unwraps the { success, data } envelope, turning failures into ApiError. */
async function unwrap<T>(response: Response): Promise<T> {
  const text = await response.text()

  if (!response.ok) {
    throw new ApiError(
      `The server responded with ${response.status}. Check that the web app is deployed with access set to "Anyone".`,
      'HTTP_' + response.status,
    )
  }

  let parsed: ApiResponse<T>
  try {
    parsed = JSON.parse(text) as ApiResponse<T>
  } catch {
    // Apps Script returns an HTML error page when the deployment is
    // misconfigured or the script threw before reaching our handler.
    throw new ApiError(
      'The server did not return JSON. This usually means the web app is not deployed with access set to "Anyone".',
      'BAD_RESPONSE',
    )
  }

  if (!parsed.success) {
    throw new ApiError(parsed.error || 'Request failed.', parsed.code, parsed.data)
  }
  return parsed.data
}

/** Reads go through GET with the action as a query parameter. */
export async function apiGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  assertConfigured()

  const url = new URL(BASE_URL)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))

  let response: Response
  try {
    response = await fetch(url.toString(), { method: 'GET', redirect: 'follow' })
  } catch {
    throw new ApiError('Could not reach the server. Check your internet connection.', 'NETWORK')
  }
  return unwrap<T>(response)
}

/**
 * Writes go through POST. The content type is deliberately text/plain: it keeps
 * the request "simple" under CORS so the browser skips the preflight, which
 * Apps Script cannot answer. The body is still JSON.
 */
export async function apiPost<T>(action: string, payload: unknown): Promise<T> {
  assertConfigured()

  let response: Response
  try {
    response = await fetch(BASE_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }),
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your internet connection.', 'NETWORK')
  }
  return unwrap<T>(response)
}

/** Turns anything thrown into a message worth showing a user. */
export function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
