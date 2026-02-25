import { Hono } from 'hono'
import type { NotificationsEnv } from './env'

export { NotificationsService } from './service'

const app = new Hono<{ Bindings: NotificationsEnv }>()

app.get('/health', (c) => c.json({ status: 'ok', service: 'notifications' }))

export default app
