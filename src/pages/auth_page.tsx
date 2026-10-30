import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/auth_context'

type Mode = 'signin' | 'signup' | 'reset' | 'profile'

export function AuthPage() {
  const {
    isConfigured,
    user,
    profile,
    signIn,
    signUp,
    resetPassword,
    updateProfile,
    signOut,
  } = useAuth()
  const [mode, setMode] = useState<Mode>(user ? 'profile' : 'signin')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')

  useEffect(() => {
    if (user) {
      setMode('profile')
    }
    setDisplayName(profile?.display_name || '')
    setPhone(profile?.phone || '')
  }, [user, profile])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState<boolean>(false)

  const onAuthSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsBusy(true)
    setError(null)
    setMessage(null)
    try {
      if (mode === 'signin') {
        const err = await signIn(email, password)
        if (err) {
          setError(err)
        } else {
          setMessage('Signed in.')
          setMode('profile')
        }
      } else if (mode === 'signup') {
        const err = await signUp(email, password)
        if (err) {
          setError(err)
        } else {
          setMessage(
            'Check your email to verify your account if confirmation is enabled.',
          )
        }
      } else if (mode === 'reset') {
        const err = await resetPassword(email)
        if (err) {
          setError(err)
        } else {
          setMessage('Password recovery email sent (if the account exists).')
        }
      }
    } finally {
      setIsBusy(false)
    }
  }

  const onProfileSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsBusy(true)
    setError(null)
    setMessage(null)
    const err = await updateProfile({
      display_name: displayName,
      phone,
    })
    setIsBusy(false)
    if (err) {
      setError(err)
      return
    }
    setMessage('Profile updated.')
  }

  if (!isConfigured) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-line bg-paper p-6 shadow-soft">
        <h1 className="font-display text-3xl">Authentication</h1>
        <p className="mt-3 text-sm text-muted">
          Supabase Auth is not configured. Set `VITE_SUPABASE_URL` and
          `VITE_SUPABASE_ANON_KEY`, apply `supabase/migrations`, then reload.
          Guest diagnosis still works without auth.
        </p>
      </div>
    )
  }

  if (user || mode === 'profile') {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-line bg-paper p-6 shadow-soft">
        <h1 className="font-display text-3xl">Your profile</h1>
        <p className="text-sm text-muted">{user?.email}</p>
        <form onSubmit={(event) => void onProfileSubmit(event)} className="space-y-3">
          <label className="block text-sm">
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              placeholder="+1..."
            />
          </label>
          <p className="text-xs text-muted">
            Phone is stored privately on your profile. Verification is not
            required for this POC.
          </p>
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-xl bg-charcoal px-4 py-2 text-sm text-warm-white"
          >
            Save profile
          </button>
        </form>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm text-muted underline"
        >
          Sign out
        </button>
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-line bg-paper p-6 shadow-soft">
      <h1 className="font-display text-3xl">
        {mode === 'signup'
          ? 'Create account'
          : mode === 'reset'
            ? 'Reset password'
            : 'Sign in'}
      </h1>
      <form onSubmit={(event) => void onAuthSubmit(event)} className="mt-4 space-y-3">
        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
          />
        </label>
        {mode !== 'reset' ? (
          <label className="block text-sm">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            />
          </label>
        ) : null}
        <button
          type="submit"
          disabled={isBusy}
          className="w-full rounded-xl bg-charcoal py-2.5 text-sm text-warm-white"
        >
          {isBusy ? 'Please wait…' : 'Continue'}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {mode !== 'signin' ? (
          <button type="button" className="text-accent underline" onClick={() => setMode('signin')}>
            Sign in
          </button>
        ) : null}
        {mode !== 'signup' ? (
          <button type="button" className="text-accent underline" onClick={() => setMode('signup')}>
            Register
          </button>
        ) : null}
        {mode !== 'reset' ? (
          <button type="button" className="text-accent underline" onClick={() => setMode('reset')}>
            Forgot password
          </button>
        ) : null}
      </div>
      {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  )
}
