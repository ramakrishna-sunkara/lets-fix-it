import { getRequestListener } from '@hono/node-server'
import app from './app'

// Vercel Node invokes (IncomingMessage, ServerResponse). hono/vercel's handle()
// only accepts Web Request and hangs in this runtime.
const handler = getRequestListener(app.fetch)

export default handler
