import { NavLink, Outlet } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { useAuth } from '../context/auth_context'
import { useLocale } from '../context/locale_context'

export function Layout() {
  const { user, isConfigured, signOut } = useAuth()
  const { t } = useLocale()

  const navItems = [
    { to: '/', label: t.nav.home, end: true },
    { to: '/diagnose', label: t.nav.diagnose, end: false },
    { to: '/shopping', label: t.nav.shopping, end: false },
    { to: '/my-repairs', label: t.nav.myRepairs, end: false },
    { to: '/profile', label: t.nav.profile, end: false },
  ]

  return (
    <div className="min-h-screen bg-warm-white">
      <header className="md-top-app-bar sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <NavLink to="/" className="flex items-center gap-3 text-charcoal">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-on-primary">
              <Wrench className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-xl font-medium tracking-tight sm:text-[1.375rem]">
              {t.brand.name}
            </span>
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `md-nav-item ${isActive ? 'md-nav-item-active' : ''}`
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
                className="md-btn-outlined !px-4 !py-2"
              >
                {t.nav.signOut}
              </button>
            ) : (
              <NavLink to="/auth" className="md-btn-filled !px-4 !py-2">
                {t.nav.signIn}
              </NavLink>
            )}
          </div>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto border-t border-line/50 px-2 py-2 md:hidden"
          aria-label="Mobile"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `md-nav-item whitespace-nowrap ${isActive ? 'md-nav-item-active' : ''}`
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
