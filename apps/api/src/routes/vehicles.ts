import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { one, q } from '../db'
import { buildUpdate, formatPlate, httpError, idParams, normPlate, optInt, optStr, shopId } from '../util'

const vehicleBody = z.object({
  customer_id: z.string().uuid().nullish(),
  plate: z.string().trim().min(2, 'Η πινακίδα είναι υποχρεωτική').max(20),
  vin: optStr,
  make: optStr,
  model: optStr,
  year: optInt,
  engine: optStr,
  fuel: optStr,
  notes: optStr,
})

async function assertCustomer(shop: string, customerId: string | null | undefined) {
  if (!customerId) return
  const c = await one('select id from customers where id = $1 and shop_id = $2', [customerId, shop])
  if (!c) throw httpError(404, 'Ο πελάτης δεν βρέθηκε')
}

async function assertPlateFree(shop: string, norm: string, exceptId?: string) {
  const dup = await one<{ id: string }>(
    'select id from vehicles where shop_id = $1 and plate_norm = $2 and ($3::uuid is null or id <> $3::uuid)',
    [shop, norm, exceptId ?? null],
  )
  if (dup) throw Object.assign(httpError(409, 'Υπάρχει ήδη όχημα με αυτή την πινακίδα'), { existingId: dup.id })
}

export async function vehicleRoutes(app: FastifyInstance) {
  app.get('/vehicles/:id', async (req) => {
    const { id } = idParams.parse(req.params)
    const vehicle = await one(
      `select v.*, case when c.id is null then null else
              json_build_object('id', c.id, 'full_name', c.full_name, 'phone', c.phone, 'email', c.email) end as customer
         from vehicles v left join customers c on c.id = v.customer_id
        where v.id = $1 and v.shop_id = $2`,
      [id, shopId(req)],
    )
    if (!vehicle) throw httpError(404, 'Το όχημα δεν βρέθηκε')
    const work_orders = await q(
      `select w.id, w.number, w.status, w.opened_at, w.delivered_at, w.odometer_km, w.complaint, w.diagnosis, w.dtc_codes,
              (select coalesce(sum(i.quantity * i.unit_price), 0) from work_order_items i where i.work_order_id = w.id)::float8 * (1 + w.vat_rate / 100)::float8 as total
         from work_orders w where w.vehicle_id = $1 and w.shop_id = $2
        order by w.opened_at desc`,
      [id, shopId(req)],
    )
    const appointments = await q(
      `select id, title, starts_at, duration_min, status from appointments
        where vehicle_id = $1 and shop_id = $2 and starts_at >= now() - interval '1 day'
        order by starts_at limit 10`,
      [id, shopId(req)],
    )
    return { ...vehicle, work_orders, appointments }
  })

  app.post('/vehicles', async (req, reply) => {
    const b = vehicleBody.parse(req.body)
    const shop = shopId(req)
    await assertCustomer(shop, b.customer_id)
    const norm = normPlate(b.plate)
    await assertPlateFree(shop, norm)
    const row = await one(
      `insert into vehicles(shop_id, customer_id, plate, plate_norm, vin, make, model, year, engine, fuel, notes)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *`,
      [shop, b.customer_id ?? null, formatPlate(b.plate), norm, b.vin, b.make, b.model, b.year, b.engine, b.fuel, b.notes],
    )
    return reply.code(201).send(row)
  })

  app.patch('/vehicles/:id', async (req) => {
    const { id } = idParams.parse(req.params)
    const shop = shopId(req)
    const b = vehicleBody.partial().parse(req.body) as Record<string, any>
    if ('customer_id' in b) await assertCustomer(shop, b.customer_id)
    if (b.plate) {
      b.plate_norm = normPlate(b.plate)
      b.plate = formatPlate(b.plate)
      await assertPlateFree(shop, b.plate_norm, id)
    }
    if ('customer_id' in b && b.customer_id === undefined) b.customer_id = null
    const { set, values } = buildUpdate(
      b,
      ['customer_id', 'plate', 'plate_norm', 'vin', 'make', 'model', 'year', 'engine', 'fuel', 'notes'],
      3,
    )
    if (!set) throw httpError(400, 'Τίποτα προς ενημέρωση')
    const row = await one(`update vehicles set ${set}, updated_at = now() where id = $1 and shop_id = $2 returning *`, [
      id,
      shop,
      ...values,
    ])
    if (!row) throw httpError(404, 'Το όχημα δεν βρέθηκε')
    return row
  })

  app.delete('/vehicles/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params)
    const row = await one('delete from vehicles where id = $1 and shop_id = $2 returning id', [id, shopId(req)])
    if (!row) throw httpError(404, 'Το όχημα δεν βρέθηκε')
    return reply.code(204).send()
  })
}
