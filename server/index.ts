import { serve } from '@hono/node-server'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { app } from './app'
import { loadServerEnv } from './env'

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

const env = loadServerEnv()
serve({ fetch: app.fetch, port: env.apiPort }, () => {
  console.log(`LET'S FIX IT API listening on http://localhost:${env.apiPort}`)
  console.log(
    `Gemma configured: ${Boolean(env.geminiApiKey)} | YouTube configured: ${Boolean(env.youtubeApiKey)} | fastDemo=${env.isFastDemoMode}`,
  )
})
