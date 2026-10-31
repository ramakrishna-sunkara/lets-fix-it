import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth_context'
import { useLocale } from '../context/locale_context'
import { SUPPORTED_LOCALES, type Locale } from '../lib/i18n'

export function ProfilePage() {
  const { t, locale, setLocale } = useLocale()
  const {
    isConfigured,
    user,
    profile,
    updateProfile,
    signOut,
  } = useAuth()
  const [displayName, setDisplayName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState<boolean>(false)

  useEffect(() => {
    setDisplayName(profile?.display_name || '')
    setPhone(profile?.phone || '')
  }, [profile])

  const onProfileSubmit = async (event: FormEvent): Promise<void> => {
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
    setMessage(t.profile.saved)
  }

  const onLanguageChange = (next: Locale): void => {
    setLocale(next)
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="font-display text-3xl text-charcoal">{t.profile.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.profile.subtitle}</p>
      </div>

      <section className="rounded-3xl border border-line bg-paper p-5 shadow-soft">
        <h2 className="text-sm font-medium text-charcoal">
          {t.profile.language}
        </h2>
        <p className="mt-1 text-xs text-muted">{t.profile.languageHint}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {SUPPORTED_LOCALES.map((item) => {
            const isActive: boolean = item.id === locale
            const label: string =
              item.id === 'en' ? t.profile.english : t.profile.telugu
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onLanguageChange(item.id)}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  isActive
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-warm-white text-charcoal hover:border-accent/40'
                }`}
                aria-pressed={isActive}
              >
                <span className="block text-sm font-medium">{label}</span>
                <span className="mt-0.5 block text-xs opacity-80">
                  {item.nativeLabel}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {!isConfigured ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
          {t.profile.notConfigured}
        </p>
      ) : null}

      {isConfigured && !user ? (
        <section className="rounded-3xl border border-line bg-paper p-5 shadow-soft">
          <p className="text-sm text-muted">{t.profile.guestNote}</p>
          <p className="mt-3 text-sm text-muted">
            <Link to="/auth" className="text-accent underline">
              {t.profile.signInCta}
            </Link>{' '}
            {t.profile.signInHint}
          </p>
        </section>
      ) : null}

      {isConfigured && user ? (
        <section className="space-y-4 rounded-3xl border border-line bg-paper p-5 shadow-soft">
          <div>
            <h2 className="text-sm font-medium text-charcoal">
              {t.profile.account}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t.profile.email}: {user.email}
            </p>
          </div>
          <form
            onSubmit={(event) => void onProfileSubmit(event)}
            className="space-y-3"
          >
            <label className="block text-sm">
              {t.profile.displayName}
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              {t.profile.phone}
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                placeholder="+91..."
              />
            </label>
            <p className="text-xs text-muted">{t.profile.phoneHint}</p>
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-xl bg-charcoal px-4 py-2 text-sm text-warm-white disabled:opacity-50"
            >
              {t.profile.save}
            </button>
          </form>
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-sm text-muted underline"
          >
            {t.nav.signOut}
          </button>
          {message ? <p className="text-sm text-accent">{message}</p> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </section>
      ) : null}
    </div>
  )
}
