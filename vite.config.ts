import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { spawn, type ChildProcess } from 'node:child_process'
import { createConnection } from 'node:net'
import { resolve } from 'node:path'
import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'

const API_PORT: number = Number(process.env.API_PORT || 8787)
const API_TARGET: string = `http://127.0.0.1:${API_PORT}`

function isApiListening(port: number): Promise<boolean> {
  return new Promise((resolveListening) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.destroy()
      resolveListening(true)
    })
    socket.once('error', () => {
      resolveListening(false)
    })
  })
}

async function waitForApi(port: number, timeoutMs: number): Promise<boolean> {
  const startedAt: number = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (await isApiListening(port)) {
      return true
    }
    await new Promise<void>((resolveWait) => {
      setTimeout(resolveWait, 200)
    })
  }
  return false
}

function ensureLocalApiPlugin(): Plugin {
  let apiProcess: ChildProcess | null = null
  let ownsProcess: boolean = false

  const stopOwnedApi = (): void => {
    if (!ownsProcess || !apiProcess || apiProcess.killed) {
      return
    }
    apiProcess.kill('SIGTERM')
    apiProcess = null
    ownsProcess = false
  }

  const startApiIfNeeded = async (label: string): Promise<void> => {
    if (await isApiListening(API_PORT)) {
      console.log(`[api] already listening on ${API_PORT} (${label})`)
      return
    }
    const tsxCli: string = resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs')
    apiProcess = spawn(
      process.execPath,
      [tsxCli, 'watch', 'server/index.ts'],
      {
        cwd: process.cwd(),
        env: process.env,
        stdio: ['ignore', 'inherit', 'inherit'],
      },
    )
    ownsProcess = true
    apiProcess.on('exit', (code, signal) => {
      if (ownsProcess) {
        console.error(
          `[api] exited unexpectedly (code=${code ?? 'null'} signal=${signal ?? 'null'})`,
        )
      }
      apiProcess = null
      ownsProcess = false
    })
    const isReady: boolean = await waitForApi(API_PORT, 20000)
    if (!isReady) {
      console.error(
        `[api] failed to start on port ${API_PORT}. Chat will not work until the Hono API is up.`,
      )
      return
    }
    console.log(`[api] ready on ${API_TARGET} (${label})`)
  }

  const attachShutdown = (server: ViteDevServer | PreviewServer): void => {
    const httpServer = server.httpServer
    if (!httpServer) {
      return
    }
    httpServer.once('close', stopOwnedApi)
  }

  return {
    name: 'ensure-local-api',
    async configureServer(server) {
      await startApiIfNeeded('vite dev')
      attachShutdown(server)
    },
    async configurePreviewServer(server) {
      await startApiIfNeeded('vite preview')
      attachShutdown(server)
    },
  }
}

const apiProxy = {
  '/api': {
    target: API_TARGET,
    changeOrigin: true,
  },
} as const

export default defineConfig({
  plugins: [react(), tailwindcss(), ensureLocalApiPlugin()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: { ...apiProxy },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    proxy: { ...apiProxy },
  },
})
