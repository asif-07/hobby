import type { ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Alert } from '../ui/Alert'
import { isConfigured } from '../../services/api'

/**
 * Nothing in the app works without the Apps Script URL, so when it is missing
 * the setup notice replaces the page rather than sitting above a screen full
 * of duplicate "could not load" errors.
 */
function SetupNotice() {
  return (
    <Alert tone="warning" title="Backend not connected">
      <p>
        Copy <code className="rounded bg-white/70 px-1">.env.example</code> to{' '}
        <code className="rounded bg-white/70 px-1">.env.local</code>, set{' '}
        <code className="rounded bg-white/70 px-1">VITE_APPS_SCRIPT_URL</code> to your Apps Script
        web app URL, then restart the dev server.
      </p>
      <p className="mt-1">
        GOOGLE_SHEETS_SETUP.md walks through creating the sheet and deploying the script.
      </p>
    </Alert>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {isConfigured() ? children : <SetupNotice />}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-center text-xs text-muted sm:px-6">
        NewTown Garage · records stored in Google Sheets
      </footer>
    </div>
  )
}
