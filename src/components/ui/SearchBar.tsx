interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** 'lg' is the hero search on the home page. */
  size?: 'md' | 'lg'
  autoFocus?: boolean
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  size = 'md',
  autoFocus = false,
}: SearchBarProps) {
  const large = size === 'lg'

  return (
    <div className="relative">
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted ${
          large ? 'h-5 w-5 sm:left-4' : 'h-4 w-4'
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <circle cx="9" cy="9" r="6" />
        <path d="M13.5 13.5L17 17" strokeLinecap="round" />
      </svg>

      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={[
          'w-full rounded-xl border border-line bg-white text-ink placeholder:text-muted/70',
          'shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40',
          large ? 'py-3.5 pl-10 pr-10 text-base sm:pl-12' : 'py-2 pl-9 pr-9 text-sm',
        ].join(' ')}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:bg-page hover:text-ink ${
            large ? 'right-3' : 'right-2'
          }`}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
