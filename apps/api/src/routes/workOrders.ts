import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { DATA_DIR, one, q } from '../db'
import { intakeSchema, resolveIntake } from '../intake'
import { buildUpdate, httpError, idParams, optInt, optStr, shopId } from '../util'

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(DATA_DIR, 'uploads'))
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const STATUSES = ['open', 'in_progress', 'ready', 'delivered'] as const

const TOTALS = `
  (select coalesce(sum(i.quantity * i.unit_price), 0) from work_order_items i where i.work_order_id = w.id)::float8 as subtotal,
  (select coalesce(sum(i.quantity * i.unit_price), 0) from work_order_items i where i.work_order_id = w.id)::float8
     * (1 + w.vat_rate / 100)::float8 as total`

const LIST_SELECT = `
  select w.id, w.number, w.status, w.opened_at, w.ready_at, w.delivered_at, w.odometer_km, w.complaint,
         w.vehicle_id, v.plate, v.make, v.model, w.customer_id, c.full_name as customer_name, c.phone as customer_phone,
         ${TOTALS}
    from work_orders w
    join vehicles v on v.id = w.vehicle_id
    left join customers c on c.id = w.customer_id`

const dtcCodes = z
  .array(z.string().trim().toUpperCase().min(2).max(12))
  .max(50)
  .transform((a) => [...new Set(a)])

const woFields = z.object({
  status: z.enum(STATUSES),
  odometer_km: optInt,
  complaint: optStr,
  diagnosis: optStr,
  dtc_codes: dtcCodes,
  internal_notes: optStr,
  vat_rate: z.coerce.number().min(0).max(100),
})

const itemBody = z.object({
  kind: z.enum(['labor', 'part']),
  description: z.string().trim().min(1, 'Η περιγραφή είναι υποχρεωτική').max(500),
  part_code: optStr,
  quantity: z.coerce.number().positive().max(100000).default(1),
  unit_price: z.coerce.number().min(0).max(1_000_000).default(0),
})

export async function createWorkOrder(
  shop: string,
  data: { vehicle_id: string; customer_id?: string | null; complaint?: string | null; odometer_km?: number | null },
) {
  // Ο αύξων αριθμός ανά συνεργείο. Σε σύγκρουση (ταυτόχρονη δημιουργία) ξαναδοκιμάζουμε.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return (await one<{ id: string; number: number }>(
        `insert into work_orders(shop_id, number, vehicle_id, customer_id, complaint, odometer_km)
         values ($1, (select coalesce(max(number), 0) + 1 from work_orders where shop_id = $1), $2, $3, $4, $5)
         returning id, number`,
        [shop, data.vehicle_id, data.customer_id ?? null, data.complaint ?? null, data.odometer_km ?? null],
      ))!
    } catch (e: any) {
      if (e?.code !== '23505' || attempt === 4) throw e
    }
  }
  throw new Error('unreachable')
}

async function getOwnedWorkOrder(shop: string, id: string) {
  const wo = await one<{ id: string; status: string }>('select id, status from work_orders where id = $1 and shop_id = $2', [
    id,
    shop,
  ])
  if (!wo) throw httpError(404, 'Η κάρτα εργασίας δεν βρέθηκε')
  return wo
}

export async function workOrderRoutes(app: FastifyInstance) {
  app.get('/work-orders', async (req) => {
    const { status } = z.object({ status: z.string().optional() }).parse(req.query)
    const statuses = status ? status.split(',').filter((s) => (STATUSES as readonly string[]).includes(s)) : []
    return q(
      `${LIST_SELECT} where w.shop_id = $1 and (cardinality($2::text[]) = 0 or w.status = any($2::text[]))
        order by case w.status when 'ready' then 0 when 'in_progress' then 1 when 'open' then 2 else 3 end,
                 w.opened_at desc
        limit 300`,
      [shopId(req), statuses],
    )
  })

  app.get('/work-orders/:id', async (req) => {
    const { id } = idParams.parse(req.params)
    const wo = await one(
      `select w.*, ${TOTALS},
              json_build_object('id', v.id, 'plate', v.plate, 'make', v.make, 'model', v.model, 'year', v.year,
                                'vin', v.vin, 'engine', v.engine, 'fuel', v.fuel) as vehicle,
              case when c.id is null then null else
                json_build_object('id', c.id, 'full_name', c.full_name, 'phone', c.phone, 'email', c.email) end as customer
         from work_orders w
         join vehicles v on v.id = w.vehicle_id
         left join customers c on c.id = w.customer_id
        where w.id = $1 and w.shop_id = $2`,
      [id, shopId(req)],
    )
    if (!wo) throw httpError(404, 'Η κάρτα εργασίας δεν βρέθηκε')
    const items = await q(
      `select id, kind, description, part_code, quantity::float8 as quantity, unit_price::float8 as unit_price, position
         from work_order_items where work_order_id = $1 order by position, created_at`,
      [id],
    )
    const attachments = await q(
      'select id, file_name, mime, size_bytes, created_at from attachments where work_order_id = $1 order by created_at',
      [id],
    )
    return { ...wo, vat_rate: Number(wo.vat_rate), items, attachments }
  })

  app.post('/work-orders', async (req, reply) => {
    const body = intakeSchema.extend({ complaint: optStr, odometer_km: optInt }).parse(req.body)
    const shop = shopId(req)
    const { vehicle_id, customer_id } = await resolveIntake(shop, body)
    if (!vehicle_id) throw httpError(400, 'Χρειάζεται πινακίδα ή όχημα')
    const wo = await createWorkOrder(shop, { vehicle_id, customer_id, complaint: body.complaint, odometer_km: body.odometer_km })
    return reply.code(201).send(wo)
  })

  app.patch('/work-orders/:id', async (req) => {
    const { id } = idParams.parse(req.params)
    const shop = shopId(req)
    const current = await getOwnedWorkOrder(shop, id)
    const b = woFields.partial().parse(req.body) as Record<string, any>
    const extra: string[] = []
    if (b.status && b.status !== current.status) {
      if (b.status === 'ready') extra.push('ready_at = coalesce(ready_at, now())')
      if (b.status === 'delivered') extra.push('delivered_at = now()', 'ready_at = coalesce(ready_at, now())')
      if (b.status === 'open' || b.status === 'in_progress') extra.push('ready_at = null', 'delivered_at = null')
    }
    const { set, values } = buildUpdate(
      b,
      ['status', 'odometer_km', 'complaint', 'diagnosis', 'dtc_codes', 'internal_notes', 'vat_rate'],
      2,
    )
    const sets = [set, ...extra].filter(Boolean).join(', ')
    if (!sets) throw httpError(400, 'Τίποτα προς ενημέρωση')
    await q(`update work_orders set ${sets}, updated_at = now() where id = $1`, [id, ...values])
    if (b.status === 'delivered') {
      await q(`update appointments set status = 'done', updated_at = now() where work_order_id = $1 and status = 'arrived'`, [id])
    }
    return one(`${LIST_SELECT} where w.id = $1`, [id])
  })

  app.delete('/work-orders/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params)
    await getOwnedWorkOrder(shopId(req), id)
    const files = await q<{ id: string }>('select id from attachments where work_order_id = $1', [id])
    await q('delete from work_orders where id = $1', [id])
    for (const f of files) fs.rm(path.join(UPLOAD_DIR, f.id), { force: true }, () => {})
    return reply.code(204).send()
  })

  // ---- Γραμμές (εργασίες / ανταλλακτικά)
  app.post('/work-orders/:id/items', async (req, reply) => {
    const { id } = idParams.parse(req.params)
    await getOwnedWorkOrder(shopId(req), id)
    const b = itemBody.parse(req.body)
    const row = await one(
      `insert into work_order_items(work_order_id, kind, description, part_code, quantity, unit_price, position)
       values ($1, $2, $3, $4, $5, $6, (select coalesce(max(position), 0) + 1 from work_order_items where work_order_id = $1))
       returning id, kind, description, part_code, quantity::float8 as quantity, unit_price::float8 as unit_price, position`,
      [id, b.kind, b.description, b.part_code, b.quantity, b.unit_price],
    )
    return reply.code(201).send(row)
  })

  app.patch('/work-order-items/:id', async (req) => {
    const { id } = idParams.parse(req.params)
    const b = itemBody.partial().parse(req.body)
    const { set, values } = buildUpdate(b, ['kind', 'description', 'part_code', 'quantity', 'unit_price'], 3)
    if (!set) throw httpError(400, 'Τίποτα προς ενημέρωση')
    const row = await one(
      `update work_order_items i set ${set}
         from work_orders w where i.id = $1 and w.id = i.work_order_id and w.shop_id = $2
       returning i.id, i.kind, i.description, i.part_code, i.quantity::float8 as quantity, i.unit_price::float8 as unit_price, i.position`,
      [id, shopId(req), ...values],
    )
    if (!row) throw httpError(404, 'Η γραμμή δεν βρέθηκε')
    return row
  })

  app.delete('/work-order-items/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params)
    const row = await one(
      `delete from work_order_items i using work_orders w
        where i.id = $1 and w.id = i.work_order_id and w.shop_id = $2 returning i.id`,
      [id, shopId(req)],
    )
    if (!row) throw httpError(404, 'Η γραμμή δεν βρέθηκε')
    return reply.code(204).send()
  })

  // ---- Φωτογραφίες
  app.post('/work-orders/:id/attachments', async (req, reply) => {
    const { id } = idParams.parse(req.params)
    await getOwnedWorkOrder(shopId(req), id)
    const file = await req.file()
    if (!file) throw httpError(400, 'Δεν στάλθηκε αρχείο')
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.mimetype)) throw httpError(400, 'Επιτρέπονται μόνο εικόνες')
    const fileId = crypto.randomUUID()
    const dest = path.join(UPLOAD_DIR, fileId)
    await pipeline(file.file, fs.createWriteStream(dest))
    if (file.file.truncated) {
      fs.rmSync(dest, { force: true })
      throw httpError(413, 'Το αρχείο είναι πολύ μεγάλο')
    }
    const size = fs.statSync(dest).size
    const row = await one(
      `insert into attachments(id, work_order_id, file_name, mime, size_bytes) values ($1, $2, $3, $4, $5)
       returning id, file_name, mime, size_bytes, created_at`,
      [fileId, id, file.filename.slice(0, 200), file.mimetype, size],
    )
    return reply.code(201).send(row)
  })

  app.get('/attachments/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params)
    const row = await one<{ mime: string }>(
      `select a.mime from attachments a join work_orders w on w.id = a.work_order_id where a.id = $1 and w.shop_id = $2`,
      [id, shopId(req)],
    )
    const file = path.join(UPLOAD_DIR, id)
    if (!row || !fs.existsSync(file)) throw httpError(404, 'Το αρχείο δεν βρέθηκε')
    reply.header('cache-control', 'private, max-age=31536000, immutable')
    return reply.type(row.mime).send(fs.createReadStream(file))
  })

  app.delete('/attachments/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params)
    const row = await one(
      `delete from attachments a using work_orders w where a.id = $1 and w.id = a.work_order_id and w.shop_id = $2 returning a.id`,
      [id, shopId(req)],
    )
    if (!row) throw httpError(404, 'Το αρχείο δεν βρέθηκε')
    fs.rmSync(path.join(UPLOAD_DIR, id), { force: true })
    return reply.code(204).send()
  })
}
