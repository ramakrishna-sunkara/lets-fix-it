import { NavLink, Outlet } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { useAuth } from '../context/auth_context'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/diagnose', label: 'Diagnose', end: false },
  { to: '/shopping', label: 'Shopping', end: false },
  { to: '/my-repairs', label: 'My Repairs', end: false },
]

export function Layout() {
  const { user, isConfigured, signOut } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2 text-charcoal">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-charcoal text-warm-white">
              <Wrench className="h-4 w-4" aria-hidden />
            </span>
            <span className="font-display text-lg tracking-tight sm:text-xl">
              LET&apos;S FIX IT AI
            </span>
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-muted hover:bg-line/60 hover:text-charcoal'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isConfigured && user ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-lg border border-line px-3 py-2 text-sm text-charcoal hover:bg-line/40"
              >
                Sign out
              </button>
            ) : (
              <NavLink
                to="/auth"
                className="rounded-lg bg-charcoal px-3 py-2 text-sm text-warm-white hover:bg-graphite"
              >
                Sign in
              </NavLink>
            )}
          </div>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto border-t border-line/60 px-2 py-2 md:hidden"
          aria-label="Mobile"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:bg-line/50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
