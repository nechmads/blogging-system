import { Hono } from 'hono'
import type { WriterAgentEnv } from '../env'

const health = new Hono<{ Bindings: WriterAgentEnv }>()

health.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'hotmetal-writer-agent' })
})

export default health
