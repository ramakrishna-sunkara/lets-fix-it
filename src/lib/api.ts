import type {
  DiagnosisResponse,
  PartsSearchResult,
  YoutubeVideoResult,
} from './types'

export type ApiError = {
  error: string
  code?: string
}

async function parseJson<T>(response: Response): Promise<T> {
  const data: unknown = await response.json()
  if (!response.ok) {
    const err = data as ApiError
    throw new Error(err.error || `Request failed (${response.status})`)
  }
  return data as T
}

export async function fetchHealth(): Promise<{
  ok: boolean
  services: { gemini: boolean; youtube: boolean; gemmaModel: string }
}> {
  const response = await fetch('/api/health')
  return parseJson(response)
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
}): Promise<DiagnosisResponse> {
  const response = await fetch('/api/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await parseJson<{ diagnosis: DiagnosisResponse }>(response)
  return data.diagnosis
}

export async function searchYoutube(query: string): Promise<{
  videos: YoutubeVideoResult[]
  empty: boolean
  message?: string
}> {
  const response = await fetch('/api/youtube-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  return parseJson(response)
}

export async function searchParts(queries: string[]): Promise<{
  results: PartsSearchResult[]
  disclaimer?: string
  message?: string
}> {
  const response = await fetch('/api/parts-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queries }),
  })
  return parseJson(response)
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
