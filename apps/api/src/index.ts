import fs from 'node:fs'
import path from 'node:path'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { ZodError } from 'zod'
import { initDb, migrate } from './db'
import { authRoutes, requireAuth } from './auth'
import { customerRoutes } from './routes/customers'
import { vehicleRoutes } from './routes/vehicles'
import { appointmentRoutes } from './routes/appointments'
import { workOrderRoutes } from './routes/workOrders'
import { miscRoutes } from './routes/misc'
import { icsRoutes } from './routes/ics'

await initDb()
await migrate()

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
  trustProxy: true,
  bodyLimit: 1024 * 1024,
})

await app.register(cookie)
await app.register(multipart, { limits: { fileSize: 15 * 1024 * 1024, files: 1 } })

app.setErrorHandler((err: any, req, reply) => {
  if (err instanceof ZodError) {
    const first = err.issues[0]
    return reply.code(400).send({ error: first?.message ?? 'Μη έγκυρα δεδομένα', issues: err.issues })
  }
  const status = err.statusCode ?? 500
  if (status < 500) return reply.code(status).send({ error: err.message, ...(err.existingId ? { existingId: err.existingId } : {}) })
  req.log.error(err)
  return reply.code(500).send({ error: 'Σφάλμα διακομιστή' })
})

await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(icsRoutes, { prefix: '/api' })
await app.register(
  async (api) => {
    api.addHook('preHandler', requireAuth)
    await api.register(customerRoutes)
    await api.register(vehicleRoutes)
    await api.register(appointmentRoutes)
    await api.register(workOrderRoutes)
    await api.register(miscRoutes)
  },
  { prefix: '/api' },
)
app.get('/api/health', async () => ({ ok: true }))

// Σε production το ίδιο process σερβίρει και το build του web app.
const webDist = path.resolve(import.meta.dirname, '../../web/dist')
if (fs.existsSync(path.join(webDist, 'index.html'))) {
  await app.register(fastifyStatic, { root: webDist, wildcard: false })
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/') || req.method !== 'GET') return reply.code(404).send({ error: 'Not found' })
    return reply.type('text/html').sendFile('index.html')
  })
  app.log.info(`serving web app from ${webDist}`)
}

const port = Number(process.env.PORT ?? 3000)
await app.listen({ port, host: process.env.HOST ?? '0.0.0.0' })
