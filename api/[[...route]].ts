import { app } from '../server/app'

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
}

export default function handler(request: Request): Promise<Response> {
  return app.fetch(request)
}
