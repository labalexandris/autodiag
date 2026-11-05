import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { one, q } from '../db'
import { buildUpdate, digitsOnly, foldSql, foldText, httpError, idParams, normPlate, optStr, shopId } from '../util'

const customerBody = z.object({
  full_name: z.string().trim().min(1, 'Το ονοματεπώνυμο είναι υποχρεωτικό').max(200),
  phone: optStr,
  email: optStr,
  vat_number: optStr,
  notes: optStr,
})

const VEHICLES_JSON = `coalesce((
  select json_agg(json_build_object('id', v.id, 'plate', v.plate, 'make', v.make, 'model', v.model) order by v.plate)
    from vehicles v where v.customer_id = c.id), '[]'::json) as vehicles`

export async function customerRoutes(app: FastifyInstance) {
  app.get('/customers', async (req) => {
    const { q: term = '' } = z.object({ q: z.string().optional() }).parse(req.query)
    const t = term.trim()
    if (!t) {
      return q(`select c.*, ${VEHICLES_JSON} from customers c where c.shop_id = $1 order by c.full_name limit 500`, [
        shopId(req),
      ])
    }
    return q(
      `select c.*, ${VEHICLES_JSON} from customers c
        where c.shop_id = $1 and (
              ${foldSql('c.full_name')} like '%' || $2 || '%'
           or ($3 <> '' and regexp_replace(coalesce(c.phone, ''), '\\D', '', 'g') like '%' || $3 || '%')
           or ($4 <> '' and exists (select 1 from vehicles v where v.customer_id = c.id and v.plate_norm like '%' || $4 || '%')))
        order by c.full_name limit 100`,
      [shopId(req), foldText(t), digitsOnly(t), normPlate(t)],
    )
  })

  app.get('/customers/:id', async (req) => {
    const { id } = idParams.parse(req.params)
    const customer = await one(`select c.*, ${VEHICLES_JSON} from customers c where c.id = $1 and c.shop_id = $2`, [
      id,
      shopId(req),
    ])
    if (!customer) throw httpError(404, 'Ο πελάτης δεν βρέθηκε')
    const work_orders = await q(
      `select w.id, w.number, w.status, w.opened_at, w.complaint, v.plate, v.make, v.model,
              (select coalesce(sum(i.quantity * i.unit_price), 0) from work_order_items i where i.work_order_id = w.id)::float8 * (1 + w.vat_rate / 100)::float8 as total
         from work_orders w join vehicles v on v.id = w.vehicle_id
        where w.customer_id = $1 and w.shop_id = $2
        order by w.opened_at desc limit 50`,
      [id, shopId(req)],
    )
    return { ...customer, work_orders }
  })

  app.post('/customers', async (req, reply) => {
    const b = customerBody.parse(req.body)
    const row = await one(
      `insert into customers(shop_id, full_name, phone, email, vat_number, notes)
       values ($1, $2, $3, $4, $5, $6) returning *`,
      [shopId(req), b.full_name, b.phone, b.email, b.vat_number, b.notes],
    )
    return reply.code(201).send(row)
  })

  app.patch('/customers/:id', async (req) => {
    const { id } = idParams.parse(req.params)
    const b = customerBody.partial().parse(req.body)
    const { set, values } = buildUpdate(b, ['full_name', 'phone', 'email', 'vat_number', 'notes'], 3)
    if (!set) throw httpError(400, 'Τίποτα προς ενημέρωση')
    const row = await one(
      `update customers set ${set}, updated_at = now() where id = $1 and shop_id = $2 returning *`,
      [id, shopId(req), ...values],
    )
    if (!row) throw httpError(404, 'Ο πελάτης δεν βρέθηκε')
    return row
  })

  app.delete('/customers/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params)
    const row = await one('delete from customers where id = $1 and shop_id = $2 returning id', [id, shopId(req)])
    if (!row) throw httpError(404, 'Ο πελάτης δεν βρέθηκε')
    return reply.code(204).send()
  })
}
