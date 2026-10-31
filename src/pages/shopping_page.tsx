import { useState, type FormEvent } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { useLocale } from '../context/locale_context'
import { searchParts } from '../lib/api'
import type { PartsSearchResult } from '../lib/types'

export function ShoppingPage() {
  const { t } = useLocale()
  const [query, setQuery] = useState<string>('')
  const [results, setResults] = useState<PartsSearchResult[]>([])
  const [disclaimer, setDisclaimer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault()
    if (!query.trim()) {
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await searchParts([query.trim()])
      setResults(response.results)
      setDisclaimer(response.disclaimer || null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">
          {t.shopping.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t.shopping.subtitle}</p>
      </div>

      <form
        onSubmit={(event) => void onSubmit(event)}
        className="flex flex-col gap-3 rounded-3xl border border-line bg-paper p-4 shadow-soft sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.shopping.placeholder}
            className="w-full rounded-xl border border-line bg-warm-white py-2.5 pl-10 pr-3 text-sm outline-none ring-accent focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="rounded-xl bg-charcoal px-4 py-2.5 text-sm text-warm-white disabled:opacity-50"
        >
          {isLoading ? t.shopping.searching : t.shopping.findLinks}
        </button>
      </form>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {disclaimer ? <p className="text-xs text-muted">{disclaimer}</p> : null}

      <ul className="grid gap-3 sm:grid-cols-2">
        {results.map((result) => (
          <li
            key={`${result.merchant}-${result.url}`}
            className="rounded-2xl border border-line bg-paper p-4 shadow-soft"
          >
            <p className="text-sm font-semibold">{result.title}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">
              {result.merchant}
            </p>
            <p className="mt-2 text-xs text-warning">{result.note}</p>
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-accent underline"
            >
              Open merchant search <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </li>
        ))}
      </ul>

      {results.length === 0 && !error ? (
        <p className="text-sm text-muted">
          Try a specific part query, or complete a diagnosis to generate
          contextual links automatically.
        </p>
      ) : null}
    </div>
  )
}
