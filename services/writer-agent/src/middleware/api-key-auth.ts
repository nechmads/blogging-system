import type { Context, Next } from 'hono'
import type { WriterAgentEnv } from '../env'

const encoder = new TextEncoder()

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = encoder.encode(a)
  const bufB = encoder.encode(b)
  if (bufA.byteLength !== bufB.byteLength) {
    crypto.subtle.timingSafeEqual(bufA, bufA)
    return false
  }
  return crypto.subtle.timingSafeEqual(bufA, bufB)
}

export async function writerApiKeyAuth(c: Context<{ Bindings: WriterAgentEnv }>, next: Next) {
  const apiKey = c.req.header('X-API-Key')
  const expected = c.env.WRITER_API_KEY

  if (!expected) {
    console.error('WRITER_API_KEY environment variable is not configured')
    return c.json({ error: 'Internal server error' }, 500)
  }

  if (!apiKey || !timingSafeEqual(apiKey, expected)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return next()
}
