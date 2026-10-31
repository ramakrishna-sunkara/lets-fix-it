export type ServerEnv = {
  geminiApiKey: string | undefined
  gemmaModel: string
  fallbackModel: string
  youtubeApiKey: string | undefined
  apiPort: number
  isFastDemoMode: boolean
  gemmaTimeoutMs: number
  maxOutputTokens: number
}

export function loadServerEnv(): ServerEnv {
  const geminiApiKey: string | undefined =
    process.env.GEMINI_API_KEY?.trim() || undefined
  const youtubeApiKey: string | undefined =
    process.env.YOUTUBE_API_KEY?.trim() || undefined
  const gemmaModel: string =
    process.env.GEMMA_MODEL?.trim() || 'gemma-4-26b-a4b-it'
  const fallbackModel: string =
    process.env.GEMINI_FALLBACK_MODEL?.trim() || 'gemini-3.5-flash-lite'
  const apiPort: number = Number(process.env.API_PORT || 8787)
  const isFastDemoMode: boolean =
    (process.env.FAST_DEMO_MODE || 'true').trim().toLowerCase() !== 'false'
  const gemmaTimeoutMs: number = Number(
    process.env.GEMMA_TIMEOUT_MS || (isFastDemoMode ? 8000 : 20000),
  )
  const maxOutputTokens: number = Number(
    process.env.DIAGNOSIS_MAX_OUTPUT_TOKENS || (isFastDemoMode ? 2048 : 4096),
  )
  return {
    geminiApiKey,
    gemmaModel,
    fallbackModel,
    youtubeApiKey,
    apiPort,
    isFastDemoMode,
    gemmaTimeoutMs,
    maxOutputTokens,
  }
}

export function missingConfigMessage(service: string, envVar: string): string {
  return `${service} is not configured. Set ${envVar} in your .env file (see .env.example). This feature will not invent results.`
}

export function resolveApiVersion(model: string): string {
  const override: string | undefined = process.env.GEMINI_API_VERSION?.trim()
  if (override) {
    return override
  }
  // Gemma currently works more reliably on v1; Gemini models on v1beta.
  return model.toLowerCase().includes('gemma') ? 'v1' : 'v1beta'
}
