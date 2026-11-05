import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { one, q } from './db'
import { httpError } from './util'

export interface SessionUser {
  id: string
  shop_id: string
  name: string
  email: string
  role: 'owner' | 'tech'
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionUser
  }
}

const COOKIE = 'sid'
const SESSION_DAYS = 90
const secureCookies = (process.env.PUBLIC_URL ?? '').startsWith('https://')

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies[COOKIE]
  if (!token) return reply.code(401).send({ error: 'Απαιτείται σύνδεση' })
  const user = await one<SessionUser>(
    `select u.id, u.shop_id, u.name, u.email, u.role
       from sessions s join users u on u.id = s.user_id
      where s.token = $1 and s.expires_at > now()`,
    [token],
  )
  if (!user) return reply.code(401).send({ error: 'Η σύνδεση έληξε' })
  req.user = user
}

const loginBody = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) })

// Απλό όριο προσπαθειών ανά IP (in-memory, αρκεί για ένα instance).
const attempts = new Map<string, { n: number; until: number }>()
function tooManyAttempts(ip: string) {
  const a = attempts.get(ip)
  return !!a && a.n >= 8 && a.until > Date.now()
}
function recordFailure(ip: string) {
  const a = attempts.get(ip)
  const fresh = !a || a.until < Date.now()
  attempts.set(ip, { n: fresh ? 1 : a!.n + 1, until: Date.now() + 15 * 60_000 })
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (req, reply) => {
    if (tooManyAttempts(req.ip)) throw httpError(429, 'Πολλές αποτυχημένες προσπάθειες. Δοκίμασε ξανά σε λίγο.')
    const { email, password } = loginBody.parse(req.body)
    const user = await one<{ id: string; password_hash: string }>(
      'select id, password_hash from users where email = $1',
      [email],
    )
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      recordFailure(req.ip)
      throw httpError(401, 'Λάθος email ή κωδικός')
    }
    attempts.delete(req.ip)
    const token = crypto.randomBytes(32).toString('base64url')
    await q(`insert into sessions(token, user_id, expires_at) values ($1, $2, now() + interval '${SESSION_DAYS} days')`, [
      token,
      user.id,
    ])
    await q('delete from sessions where expires_at < now()')
    reply.setCookie(COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
      maxAge: SESSION_DAYS * 86400,
    })
    return { ok: true }
  })

  app.post('/logout', async (req, reply) => {
    const token = req.cookies[COOKIE]
    if (token) await q('delete from sessions where token = $1', [token])
    reply.clearCookie(COOKIE, { path: '/' })
    return { ok: true }
  })

  app.get('/me', { preHandler: requireAuth }, async (req) => {
    const shop = await one('select id, name, phone, address, vat_number from shops where id = $1', [req.user!.shop_id])
    return { user: req.user, shop }
  })

  app.post('/password', { preHandler: requireAuth }, async (req) => {
    const body = z
      .object({ current: z.string().min(1), next: z.string().min(8, 'Τουλάχιστον 8 χαρακτήρες') })
      .parse(req.body)
    const row = await one<{ password_hash: string }>('select password_hash from users where id = $1', [req.user!.id])
    if (!row || !(await bcrypt.compare(body.current, row.password_hash))) throw httpError(400, 'Λάθος τρέχων κωδικός')
    await q('update users set password_hash = $1 where id = $2', [await bcrypt.hash(body.next, 10), req.user!.id])
    await q('delete from sessions where user_id = $1 and token <> $2', [req.user!.id, req.cookies[COOKIE]])
    return { ok: true }
  })
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10)
