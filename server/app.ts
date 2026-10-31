import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ConfigError, runDiagnosis } from './diagnose'
import { loadServerEnv } from './env'
import { buildPartsSearchLinks } from './parts'
import { searchYoutubeVideos } from './youtube'

function resolveCorsOrigin(origin: string): string {
  if (!origin) {
    return '*'
  }
  if (
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.netlify.app')
  ) {
    return origin
  }
  const allowed: string[] = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((value: string) => value.trim())
    .filter(Boolean)
  if (allowed.includes(origin)) {
    return origin
  }
  return origin
}

export const app = new Hono()

app.use(
  '*',
  cors({
    origin: resolveCorsOrigin,
  }),
)

app.onError((error, c) => {
  console.error('[api]', error)
  return c.json(
    {
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    500,
  )
})

app.notFound((c) => {
  return c.json(
    {
      error: `No route matched ${c.req.method} ${c.req.path}`,
      code: 'NOT_FOUND',
    },
    404,
  )
})


app.get('/api/health', (c) => {
  const env = loadServerEnv()
  return c.json({
    ok: true,
    services: {
      gemini: Boolean(env.geminiApiKey),
      youtube: Boolean(env.youtubeApiKey),
      gemmaModel: env.gemmaModel,
      fallbackModel: env.fallbackModel,
      fastDemoMode: env.isFastDemoMode,
      preferredModel: env.isFastDemoMode ? env.fallbackModel : env.gemmaModel,
    },
  })
})

app.post('/api/diagnose', async (c) => {
  try {
    const body = await c.req.json()
    const result = await runDiagnosis(body)
    return c.json({
      diagnosis: result.diagnosis,
      modelUsed: result.modelUsed,
    })
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
          ? 'No suitable YouTube results were found for this repair query.'
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
        "These are external merchant search links only. LET'S FIX IT AI does not invent product prices, stock, or verified compatibility.",
    })
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : 'Parts search failed'
    return c.json({ error: message, code: 'PARTS_ERROR' }, 502)
  }
})

export default app
