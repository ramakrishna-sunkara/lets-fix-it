import type { DiagnosisResponse } from './types'

export type NearbyRepairLink = {
  id: string
  title: string
  description: string
  query: string
  mapsUrl: string
  accent: 'urgent' | 'normal'
}

type GeoPoint = {
  latitude: number
  longitude: number
}

function buildMapsUrl(query: string, location: GeoPoint | null): string {
  const encoded: string = encodeURIComponent(query)
  if (location) {
    return `https://www.google.com/maps/search/?api=1&query=${encoded}&query_place_id=&center=${location.latitude},${location.longitude}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`
}

function productLabel(diagnosis: DiagnosisResponse): string {
  const summary = diagnosis.product_summary || {}
  const parts: string[] = [summary.brand, summary.model, summary.category]
    .filter(Boolean)
    .map(String)
  return parts.join(' ') || 'electronics'
}

export function buildNearbyRepairLinks(
  diagnosis: DiagnosisResponse,
  location: GeoPoint | null,
): NearbyRepairLink[] {
  const label: string = productLabel(diagnosis)
  const lower: string = label.toLowerCase()
  const isSpeakerOrBattery: boolean =
    /speaker|battery|lithium|jbl|bose|sony/i.test(lower) ||
    diagnosis.safety_warnings.some((warning) =>
      /swell|warm|lithium|battery/i.test(warning),
    )
  const isPhone: boolean = /phone|iphone|samsung|pixel|screen/i.test(lower)
  const isCarKey: boolean = /remote|key|fob|car/i.test(lower)

  const links: NearbyRepairLink[] = []

  if (isSpeakerOrBattery) {
    links.push({
      id: 'electronics-repair',
      title: 'Electronics repair near you',
      description: `Find shops that service ${label} safely.`,
      query: `${label} electronics repair shop near me`,
      mapsUrl: buildMapsUrl(`${label} electronics repair near me`, location),
      accent: 'urgent',
    })
    links.push({
      id: 'battery-disposal',
      title: 'Battery drop-off / recycling',
      description: 'Safe disposal if the battery is swollen or damaged.',
      query: 'lithium battery recycling drop off near me',
      mapsUrl: buildMapsUrl(
        'lithium ion battery recycling drop off near me',
        location,
      ),
      accent: 'urgent',
    })
  } else if (isPhone) {
    links.push({
      id: 'phone-repair',
      title: 'Phone repair near you',
      description: `Screen and device repair for ${label}.`,
      query: `${label} phone repair near me`,
      mapsUrl: buildMapsUrl(`${label} phone repair near me`, location),
      accent: 'normal',
    })
  } else if (isCarKey) {
    links.push({
      id: 'auto-locksmith',
      title: 'Automotive locksmith',
      description: 'Key fob / remote specialists near you.',
      query: 'automotive locksmith car key fob repair near me',
      mapsUrl: buildMapsUrl(
        'automotive locksmith car key fob near me',
        location,
      ),
      accent: 'normal',
    })
  } else {
    links.push({
      id: 'general-repair',
      title: 'Repair shops near you',
      description: `Local help for ${label}.`,
      query: `${label} repair shop near me`,
      mapsUrl: buildMapsUrl(`${label} repair near me`, location),
      accent: 'normal',
    })
  }

  links.push({
    id: 'authorized-service',
    title: 'Brand / authorized service',
    description: 'Search official service centers when available.',
    query: `${label} authorized service center near me`,
    mapsUrl: buildMapsUrl(
      `${label} authorized service center near me`,
      location,
    ),
    accent: 'normal',
  })

  return links
}

export function shouldShowNearbyRepairs(
  diagnosis: DiagnosisResponse | null,
): boolean {
  if (!diagnosis) {
    return false
  }
  if (diagnosis.requires_professional_help) {
    return true
  }
  return diagnosis.safety_warnings.some((warning) =>
    /professional|swollen|swell|warm|lithium|do not|stop using|seek/i.test(
      warning,
    ),
  )
}
