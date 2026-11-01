import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth_context'
import { useLocale } from '../context/locale_context'

type Mode = 'signin' | 'signup' | 'reset'

export function AuthPage() {
  const { t } = useLocale()
  const { isConfigured, user, signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState<boolean>(false)

  useEffect(() => {
    setMessage(null)
    setError(null)
  }, [mode])

  const onAuthSubmit = async (event: FormEvent): Promise<void> => {
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
          setMessage(t.auth.signedIn)
        }
      } else if (mode === 'signup') {
        const err = await signUp(email, password)
        if (err) {
          setError(err)
        } else {
          setMessage(t.auth.checkEmail)
        }
      } else if (mode === 'reset') {
        const err = await resetPassword(email)
        if (err) {
          setError(err)
        } else {
          setMessage(t.auth.recoverySent)
        }
      }
    } finally {
      setIsBusy(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="md-card mx-auto max-w-lg p-6">
        <h1 className="text-3xl font-normal tracking-tight">
          {t.auth.notConfiguredTitle}
        </h1>
        <p className="mt-3 text-sm text-muted">{t.auth.notConfiguredBody}</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/profile" replace />
  }

  const title: string =
    mode === 'signup'
      ? t.auth.createAccount
      : mode === 'reset'
        ? t.auth.resetPassword
        : t.auth.signIn

  return (
    <div className="md-card mx-auto max-w-lg p-6">
      <h1 className="text-3xl font-normal tracking-tight">{title}</h1>
      <form
        onSubmit={(event) => void onAuthSubmit(event)}
        className="mt-4 space-y-3"
      >
        <label className="block text-sm font-medium">
          {t.auth.email}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="md-field mt-1"
          />
        </label>
        {mode !== 'reset' ? (
          <label className="block text-sm font-medium">
            {t.auth.password}
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="md-field mt-1"
            />
          </label>
        ) : null}
        <button
          type="submit"
          disabled={isBusy}
          className="md-btn-filled w-full disabled:opacity-38"
        >
          {isBusy ? t.auth.pleaseWait : t.auth.continue}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {mode !== 'signin' ? (
          <button
            type="button"
            className="md-btn-text"
            onClick={() => setMode('signin')}
          >
            {t.auth.signIn}
          </button>
        ) : null}
        {mode !== 'signup' ? (
          <button
            type="button"
            className="md-btn-text"
            onClick={() => setMode('signup')}
          >
            {t.auth.register}
          </button>
        ) : null}
        {mode !== 'reset' ? (
          <button
            type="button"
            className="md-btn-text"
            onClick={() => setMode('reset')}
          >
            {t.auth.forgotPassword}
          </button>
        ) : null}
      </div>
      {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  )
}
