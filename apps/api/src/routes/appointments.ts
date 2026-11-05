import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { one, q } from '../db'
import { intakeSchema, resolveIntake, type Intake } from '../intake'
import { buildUpdate, httpError, idParams, optStr, shopId } from '../util'
import { createWorkOrder } from './workOrders'

const STATUSES = ['scheduled', 'arrived', 'done', 'no_show', 'cancelled'] as const

const apptFields = z.object({
  title: z.string().trim().min(1, 'Η περιγραφή είναι υποχρεωτική').max(300),
  notes: optStr,
  starts_at: z.string().datetime({ offset: true }),
  duration_min: z.coerce.number().int().min(5).max(24 * 60).default(60),
  status: z.enum(STATUSES).optional(),
})

export const APPT_SELECT = `
  select a.*, v.plate, v.make, v.model, c.full_name as customer_name, c.phone as customer_phone
    from appointments a
    left join vehicles v on v.id = a.vehicle_id
    left join customers c on c.id = a.customer_id`

export async function appointmentRoutes(app: FastifyInstance) {
  app.get('/appointments', async (req) => {
    const { from, to } = z
      .object({ from: z.string().datetime({ offset: true }), to: z.string().datetime({ offset: true }) })
      .parse(req.query)
    return q(`${APPT_SELECT} where a.shop_id = $1 and a.starts_at >= $2 and a.starts_at < $3 order by a.starts_at`, [
      shopId(req),
      from,
      to,
    ])
  })

  app.post('/appointments', async (req, reply) => {
    const body = apptFields.merge(intakeSchema).parse(req.body)
    const shop = shopId(req)
    const { vehicle_id, customer_id } = await resolveIntake(shop, body)
    const row = await one<{ id: string }>(
      `insert into appointments(shop_id, vehicle_id, customer_id, title, notes, starts_at, duration_min)
       values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [shop, vehicle_id, customer_id, body.title, body.notes, body.starts_at, body.duration_min],
    )
    return reply.code(201).send(await one(`${APPT_SELECT} where a.id = $1`, [row!.id]))
  })

  app.patch('/appointments/:id', async (req) => {
    const { id } = idParams.parse(req.params)
    const shop = shopId(req)
    const body = apptFields.partial().merge(intakeSchema).parse(req.body) as Record<string, any>
    // Αν άλλαξε το όχημα/πελάτης
    if (body.vehicle_id || body.plate || body.customer_id || body.full_name) {
      Object.assign(body, await resolveIntake(shop, body as Intake))
    }
    const { set, values } = buildUpdate(
      body,
      ['title', 'notes', 'starts_at', 'duration_min', 'status', 'vehicle_id', 'customer_id'],
      3,
    )
    if (!set) throw httpError(400, 'Τίποτα προς ενημέρωση')
    const row = await one(
      `update appointments set ${set}, updated_at = now() where id = $1 and shop_id = $2 returning id`,
      [id, shop, ...values],
    )
    if (!row) throw httpError(404, 'Το ραντεβού δεν βρέθηκε')
    return one(`${APPT_SELECT} where a.id = $1`, [id])
  })

  app.delete('/appointments/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params)
    const row = await one('delete from appointments where id = $1 and shop_id = $2 returning id', [id, shopId(req)])
    if (!row) throw httpError(404, 'Το ραντεβού δεν βρέθηκε')
    return reply.code(204).send()
  })

  /** Ο πελάτης ήρθε: ανοίγει κάρτα εργασίας από το ραντεβού. */
  app.post('/appointments/:id/start', async (req) => {
    const { id } = idParams.parse(req.params)
    const shop = shopId(req)
    const appt = await one<any>('select * from appointments where id = $1 and shop_id = $2', [id, shop])
    if (!appt) throw httpError(404, 'Το ραντεβού δεν βρέθηκε')
    if (appt.work_order_id) return { work_order_id: appt.work_order_id }
    if (!appt.vehicle_id) throw httpError(400, 'Το ραντεβού δεν έχει όχημα. Πρόσθεσε πινακίδα πρώτα.')
    const wo = await createWorkOrder(shop, {
      vehicle_id: appt.vehicle_id,
      customer_id: appt.customer_id,
      complaint: [appt.title, appt.notes].filter(Boolean).join('\n'),
    })
    await q(`update appointments set work_order_id = $1, status = 'arrived', updated_at = now() where id = $2`, [wo.id, id])
    return { work_order_id: wo.id }
  })
}
