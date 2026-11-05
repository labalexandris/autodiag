import type { FastifyInstance } from 'fastify'
import { one, q } from '../db'

/**
 * Συνδρομητικό ημερολόγιο (webcal). Ο ιδιοκτήτης το προσθέτει μία φορά στο iPhone
 * και βλέπει τα ραντεβού του συνεργείου μέσα στην εφαρμογή Ημερολόγιο.
 * Προστατεύεται μόνο από το μυστικό token στο URL.
 */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** Γραμμές ICS μέχρι 75 bytes (RFC 5545), διπλωμένες με CRLF + κενό. */
function fold(line: string) {
  const out: string[] = []
  let cur = ''
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > 73) {
      out.push(cur)
      cur = ' '
    }
    cur += ch
  }
  out.push(cur)
  return out.join('\r\n')
}

export async function icsRoutes(app: FastifyInstance) {
  app.get('/ics/:token', async (req, reply) => {
    const token = String((req.params as any).token).replace(/\.ics$/, '')
    const shop = await one<{ id: string; name: string }>('select id, name from shops where ics_token = $1', [token])
    if (!shop) return reply.code(404).send('Not found')
    const rows = await q<any>(
      `select a.id, a.title, a.notes, a.starts_at, a.duration_min, a.status, a.updated_at,
              v.plate, v.make, v.model, c.full_name, c.phone
         from appointments a
         left join vehicles v on v.id = a.vehicle_id
         left join customers c on c.id = a.customer_id
        where a.shop_id = $1 and a.status <> 'cancelled'
          and a.starts_at > now() - interval '60 days' and a.starts_at < now() + interval '365 days'
        order by a.starts_at`,
      [shop.id],
    )
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AutoDiag//Workshop//EL',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${esc(shop.name)} – Ραντεβού`,
      'X-WR-TIMEZONE:Europe/Athens',
      'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
      'X-PUBLISHED-TTL:PT15M',
    ]
    for (const r of rows) {
      const start = new Date(r.starts_at)
      const end = new Date(start.getTime() + r.duration_min * 60_000)
      const vehicle = [r.plate, r.make, r.model].filter(Boolean).join(' ')
      const summary = [vehicle || null, r.title].filter(Boolean).join(' · ')
      const desc = [r.full_name && `Πελάτης: ${r.full_name}`, r.phone && `Τηλ: ${r.phone}`, r.notes].filter(Boolean).join('\n')
      lines.push(
        'BEGIN:VEVENT',
        `UID:${r.id}@autodiag`,
        `DTSTAMP:${stamp(new Date(r.updated_at))}`,
        `DTSTART:${stamp(start)}`,
        `DTEND:${stamp(end)}`,
        `SUMMARY:${esc(summary)}`,
        ...(desc ? [`DESCRIPTION:${esc(desc)}`] : []),
        `STATUS:${r.status === 'no_show' ? 'CANCELLED' : 'CONFIRMED'}`,
        'END:VEVENT',
      )
    }
    lines.push('END:VCALENDAR')
    reply.header('content-type', 'text/calendar; charset=utf-8')
    reply.header('cache-control', 'no-cache')
    return lines.map(fold).join('\r\n') + '\r\n'
  })
}
