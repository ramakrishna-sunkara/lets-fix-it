import type {
  DiagnosisResponse,
  PartsSearchResult,
  YoutubeVideoResult,
} from './types'

export type ApiError = {
  error: string
  code?: string
}

const LOCAL_API_HINT: string =
  'API server unreachable. Run `npm run dev` so Vite (:5173) and the Hono API (:8787) are both available.'

const PROD_API_HINT: string =
  'API unreachable on this deployment. In Vercel: add GEMINI_API_KEY / YOUTUBE_API_KEY, and disable Deployment Protection (Authentication) for Production so /api is publicly reachable.'

function isLocalBrowserHost(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  const host: string = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

function apiUnreachableMessage(): string {
  return isLocalBrowserHost() ? LOCAL_API_HINT : PROD_API_HINT
}

async function parseJson<T>(response: Response): Promise<T> {
  const contentType: string = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    if (
      response.status === 401 ||
      response.status === 403 ||
      response.redirected ||
      contentType.includes('text/html')
    ) {
      throw new Error(apiUnreachableMessage())
    }
    throw new Error(
      `API returned non-JSON (${response.status}). ${apiUnreachableMessage()}`,
    )
  }
  const data: unknown = await response.json()
  if (!response.ok) {
    const err = data as ApiError
    throw new Error(err.error || `Request failed (${response.status})`)
  }
  return data as T
}

async function requestJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(input, init)
  } catch {
    throw new Error(apiUnreachableMessage())
  }
  return parseJson<T>(response)
}

export async function fetchHealth(): Promise<{
  ok: boolean
  services: {
    gemini: boolean
    youtube: boolean
    gemmaModel: string
    fallbackModel?: string
    fastDemoMode?: boolean
    preferredModel?: string
  }
}> {
  return requestJson('/api/health')
}

export async function diagnoseProblem(payload: {
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    imageBase64?: string
    imageMimeType?: string
  }>
  productSummary?: Record<string, string>
  diagnosticStage?: string
  locale?: string
}): Promise<DiagnosisResponse> {
  const data = await requestJson<{ diagnosis: DiagnosisResponse }>(
    '/api/diagnose',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  return data.diagnosis
}

export async function searchYoutube(query: string): Promise<{
  videos: YoutubeVideoResult[]
  empty: boolean
  message?: string
}> {
  return requestJson('/api/youtube-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
}

export async function searchParts(queries: string[]): Promise<{
  results: PartsSearchResult[]
  disclaimer?: string
  message?: string
}> {
  return requestJson('/api/parts-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queries }),
  })
}

export function splitDataUrl(dataUrl: string): {
  mimeType: string
  base64: string
} | null {
  const match: RegExpMatchArray | null = dataUrl.match(
    /^data:([^;]+);base64,(.+)$/,
  )
  if (!match) {
    return null
  }
  return { mimeType: match[1], base64: match[2] }
}
