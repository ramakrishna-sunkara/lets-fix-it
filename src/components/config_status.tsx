import { useEffect, useState } from 'react'
import { fetchHealth } from '../lib/api'
import { isSupabaseConfigured } from '../lib/supabase'

type Services = {
  gemini: boolean
  youtube: boolean
  gemmaModel: string
  fallbackModel?: string
  fastDemoMode?: boolean
  preferredModel?: string
}

export function ConfigStatus() {
  const [services, setServices] = useState<Services | null>(null)
  const [unreachable, setUnreachable] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    void fetchHealth()
      .then((health) => {
        if (!cancelled) {
          setServices(health.services)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnreachable(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (unreachable) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
        API server unreachable. Run `npm run dev` so the Hono API is available on
        port 8787.
      </div>
    )
  }

  if (!services) {
    return null
  }

  const missing: string[] = []
  if (!services.gemini) {
    missing.push('GEMINI_API_KEY (Gemma 4 diagnosis)')
  }
  if (!services.youtube) {
    missing.push('YOUTUBE_API_KEY (repair videos)')
  }
  if (!isSupabaseConfigured) {
    missing.push('VITE_SUPABASE_* (optional auth / My Repairs sync)')
  }

  if (missing.length === 0) {
    return (
      <div className="rounded-2xl border border-teal-200 bg-accent-soft/50 px-4 py-2 text-xs text-accent">
        Live services ready ·{' '}
        {services.fastDemoMode
          ? `fast demo (${services.preferredModel || services.fallbackModel || 'flash-lite'})`
          : `preferred ${services.gemmaModel}`}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
      <p className="font-medium">Integration points not fully configured</p>
      <ul className="mt-1 list-disc pl-5 text-xs">
        {missing.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs">
        Copy `.env.example` to `.env` and add keys. The UI will not invent AI or
        YouTube results.
      </p>
    </div>
  )
}
