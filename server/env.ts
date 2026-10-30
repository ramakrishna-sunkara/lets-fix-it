export type ServerEnv = {
  geminiApiKey: string | undefined
  gemmaModel: string
  youtubeApiKey: string | undefined
  apiPort: number
}

export function loadServerEnv(): ServerEnv {
  const geminiApiKey: string | undefined =
    process.env.GEMINI_API_KEY?.trim() || undefined
  const youtubeApiKey: string | undefined =
    process.env.YOUTUBE_API_KEY?.trim() || undefined
  const gemmaModel: string =
    process.env.GEMMA_MODEL?.trim() || 'gemma-4-26b-a4b-it'
  const apiPort: number = Number(process.env.API_PORT || 8787)
  return { geminiApiKey, gemmaModel, youtubeApiKey, apiPort }
}

export function missingConfigMessage(service: string, envVar: string): string {
  return `${service} is not configured. Set ${envVar} in your .env file (see .env.example). This feature will not invent results.`
}
