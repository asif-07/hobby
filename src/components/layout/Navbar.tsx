import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/customers', label: 'Customers', end: false },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path
                d="M3 16.5v-3l1.8-4.2A2 2 0 016.6 8h10.8a2 2 0 011.8 1.3L21 13.5v3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M3 16.5h3M18 16.5h3M4.5 12.2h15" strokeLinecap="round" />
              <circle cx="7.5" cy="16.5" r="1.7" />
              <circle cx="16.5" cy="16.5" r="1.7" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-ink sm:text-base">NewTown Garage</span>
            <span className="hidden text-xs text-muted sm:block">Customer &amp; vehicle records</span>
          </span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-light text-brand-dark' : 'text-muted hover:bg-page hover:text-ink',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
