import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, MapPin, Navigation, Store } from 'lucide-react'
import {
  buildNearbyRepairLinks,
  type NearbyRepairLink,
} from '../lib/nearby_repairs'
import type { DiagnosisResponse } from '../lib/types'

type NearbyRepairPanelProps = {
  diagnosis: DiagnosisResponse
}

type LocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; latitude: number; longitude: number }
  | { status: 'denied'; message: string }

export function NearbyRepairPanel({ diagnosis }: NearbyRepairPanelProps) {
  const [location, setLocation] = useState<LocationState>({ status: 'idle' })

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({
        status: 'denied',
        message: 'Location is unavailable in this browser.',
      })
      return
    }
    setLocation({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          status: 'ready',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        setLocation({
          status: 'denied',
          message:
            error.code === error.PERMISSION_DENIED
              ? 'Location permission denied — search links still work city-wide.'
              : 'Could not read location — opening general nearby search.',
        })
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    )
  }, [])

  const geoPoint =
    location.status === 'ready'
      ? { latitude: location.latitude, longitude: location.longitude }
      : null

  const links: NearbyRepairLink[] = useMemo(
    () => buildNearbyRepairLinks(diagnosis, geoPoint),
    [diagnosis, geoPoint],
  )

  return (
    <section className="overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-accent-soft/80 via-paper to-paper shadow-soft">
      <div className="border-b border-accent/15 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-white">
            <Store className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Nearby help
            </p>
            <h3 className="mt-1 font-display text-xl text-charcoal">
              Repair shops & safe drop-off
            </h3>
            <p className="mt-1 text-sm text-muted">
              Professional assistance is the safer next step. These open real
              Google Maps searches near you — we do not invent shop listings.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-paper/80 px-3 py-2 text-xs text-muted">
          <Navigation className="h-3.5 w-3.5 text-accent" aria-hidden />
          {location.status === 'loading'
            ? 'Detecting your location…'
            : location.status === 'ready'
              ? 'Using your location for nearby results'
              : location.status === 'denied'
                ? location.message
                : 'Enable location for closer matches'}
        </div>
      </div>

      <ul className="space-y-3 p-4 sm:p-5">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={link.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className={`group flex items-start gap-3 rounded-2xl border px-3.5 py-3 transition hover:-translate-y-0.5 hover:shadow-soft ${
                link.accent === 'urgent'
                  ? 'border-rose-200 bg-rose-50/70 hover:border-rose-300'
                  : 'border-line bg-paper hover:border-accent/40'
              }`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  link.accent === 'urgent'
                    ? 'bg-rose-100 text-danger'
                    : 'bg-accent-soft text-accent'
                }`}
              >
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-charcoal">
                    {link.title}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted transition group-hover:text-accent" />
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {link.description}
                </span>
                <span className="mt-2 inline-flex rounded-full bg-warm-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                  Open in Maps
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
