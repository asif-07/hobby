interface LoadingSpinnerProps {
  /** Shown under the spinner. Apps Script cold starts take a few seconds. */
  label?: string
  className?: string
}

export function LoadingSpinner({ label = 'Loading…', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`} role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}
