import { handle } from 'hono/vercel'
import app from './app'

const handler = handle(app)

export default handler
