import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { ConfigError, runDiagnosis } from './diagnose.ts'
import { loadServerEnv } from './env.ts'
import { buildPartsSearchLinks } from './parts.ts'
import { searchYoutubeVideos } from './youtube.ts'

function loadDotEnv(): void {
  const envPath: string = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) {
    return
  }
  const content: string = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed: string = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    const eqIndex: number = trimmed.indexOf('=')
    if (eqIndex === -1) {
      continue
    }
    const key: string = trimmed.slice(0, eqIndex).trim()
    let value: string = trimmed.slice(eqIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadDotEnv()

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  }),
)

app.get('/api/health', (c) => {
  const env = loadServerEnv()
  return c.json({
    ok: true,
    services: {
      gemini: Boolean(env.geminiApiKey),
      youtube: Boolean(env.youtubeApiKey),
      gemmaModel: env.gemmaModel,
    },
  })
})

app.post('/api/diagnose', async (c) => {
  try {
    const body = await c.req.json()
    const diagnosis = await runDiagnosis(body)
    return c.json({ diagnosis })
  } catch (error: unknown) {
    if (error instanceof ConfigError) {
      return c.json({ error: error.message, code: 'MISSING_CONFIG' }, 503)
    }
    const message: string =
      error instanceof Error ? error.message : 'Diagnosis failed'
    return c.json({ error: message, code: 'DIAGNOSIS_ERROR' }, 502)
  }
})

app.post('/api/youtube-search', async (c) => {
  try {
    const body = (await c.req.json()) as { query?: string }
    const videos = await searchYoutubeVideos(body.query || '')
    return c.json({
      query: body.query,
      videos,
      empty: videos.length === 0,
      message:
        videos.length === 0
          ? 'No suitable YouTube results were found for this query.'
          : undefined,
    })
  } catch (error: unknown) {
    if (error instanceof ConfigError) {
      return c.json({ error: error.message, code: 'MISSING_CONFIG' }, 503)
    }
    const message: string =
      error instanceof Error ? error.message : 'YouTube search failed'
    return c.json({ error: message, code: 'YOUTUBE_ERROR' }, 502)
  }
})

app.post('/api/parts-search', async (c) => {
  try {
    const body = (await c.req.json()) as { queries?: string[] }
    const queries: string[] = body.queries || []
    if (queries.length === 0) {
      return c.json({
        results: [],
        message:
          'No parts search queries were provided. Complete a diagnosis first.',
      })
    }
    const results = buildPartsSearchLinks(queries)
    return c.json({
      results,
      disclaimer:
        'These are external merchant search links only. LET\'S FIX IT AI does not invent product prices, stock, or verified compatibility.',
    })
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : 'Parts search failed'
    return c.json({ error: message, code: 'PARTS_ERROR' }, 502)
  }
})

const env = loadServerEnv()
serve({ fetch: app.fetch, port: env.apiPort }, () => {
  console.log(`LET'S FIX IT API listening on http://localhost:${env.apiPort}`)
  console.log(
    `Gemma configured: ${Boolean(env.geminiApiKey)} | YouTube configured: ${Boolean(env.youtubeApiKey)}`,
  )
})
