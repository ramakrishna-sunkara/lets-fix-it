import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth_context'
import { supabase, type RepairSessionRow } from '../lib/supabase'

export function MyRepairsPage() {
  const { user, isConfigured, isLoading } = useAuth()
  const [sessions, setSessions] = useState<RepairSessionRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !supabase) {
      return
    }
    let cancelled = false
    void supabase
      .from('repair_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) {
          return
        }
        if (fetchError) {
          setError(fetchError.message)
          return
        }
        setSessions((data as RepairSessionRow[]) || [])
      })
    return () => {
      cancelled = true
    }
  }, [user])

  if (isLoading) {
    return <p className="text-sm text-muted">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">My Repairs</h1>
        <p className="mt-1 text-sm text-muted">
          Saved diagnostic sessions for signed-in users when Supabase Auth is
          configured.
        </p>
      </div>

      {!isConfigured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-warning">
          Supabase is not configured (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
          Chat still works without saved cloud sessions. See README for setup.
        </div>
      ) : null}

      {isConfigured && !user ? (
        <p className="text-sm text-muted">
          <Link to="/auth" className="text-accent underline">
            Sign in
          </Link>{' '}
          to sync private repair sessions across devices.
        </p>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <ul className="space-y-3">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="rounded-2xl border border-line bg-paper p-4 shadow-soft"
          >
            <p className="font-medium text-charcoal">{session.title}</p>
            <p className="mt-1 text-xs text-muted">
              {session.category || 'Uncategorized'} · {session.status} ·{' '}
              {new Date(session.updated_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>

      {user && sessions.length === 0 && !error ? (
        <p className="text-sm text-muted">
          No saved cloud sessions yet. Complete a diagnosis while signed in to
          store one.
        </p>
      ) : null}
    </div>
  )
}
