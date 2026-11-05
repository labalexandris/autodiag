import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { one, q } from '../db'
import { buildUpdate, digitsOnly, foldSql, foldText, httpError, normPlate, optStr, shopId } from '../util'

export async function miscRoutes(app: FastifyInstance) {
  /** Καθολική αναζήτηση: πινακίδα, όνομα, τηλέφωνο. */
  app.get('/search', async (req) => {
    const { q: term = '' } = z.object({ q: z.string().optional() }).parse(req.query)
    const t = term.trim()
    if (t.length < 2) return { vehicles: [], customers: [] }
    const shop = shopId(req)
    const plate = normPlate(t)
    const digits = digitsOnly(t)
    const name = foldText(t)
    const vehicles = await q(
      `select v.id, v.plate, v.make, v.model, v.year, v.customer_id, c.full_name as customer_name, c.phone as customer_phone
         from vehicles v left join customers c on c.id = v.customer_id
        where v.shop_id = $1 and (
              ($2 <> '' and v.plate_norm like '%' || $2 || '%')
           or ($3 <> '' and length($3) >= 3 and regexp_replace(coalesce(c.phone, ''), '\\D', '', 'g') like '%' || $3 || '%')
           or ${foldSql('c.full_name')} like '%' || $4 || '%'
           or ${foldSql("v.make || ' ' || coalesce(v.model, '')")} like '%' || $4 || '%'
           or upper(coalesce(v.vin, '')) like '%' || upper($5) || '%')
        order by (v.plate_norm like $2 || '%') desc, v.plate
        limit 20`,
      [shop, plate, digits, name, t],
    )
    const customers = await q(
      `select c.id, c.full_name, c.phone from customers c
        where c.shop_id = $1 and (
              ${foldSql('c.full_name')} like '%' || $2 || '%'
           or ($3 <> '' and length($3) >= 3 and regexp_replace(coalesce(c.phone, ''), '\\D', '', 'g') like '%' || $3 || '%'))
        order by c.full_name limit 10`,
      [shop, name, digits],
    )
    return { vehicles, customers }
  })

  /** Σύνοψη για την αρχική οθόνη. */
  app.get('/stats', async (req) => {
    const shop = shopId(req)
    const counts = await q<{ status: string; n: number }>(
      `select status, count(*)::int as n from work_orders where shop_id = $1 and status <> 'delivered' group by status`,
      [shop],
    )
    const month = await one<{ revenue: number; delivered: number }>(
      `select coalesce(sum((select coalesce(sum(i.quantity * i.unit_price), 0) from work_order_items i where i.work_order_id = w.id)
                     * (1 + w.vat_rate / 100)), 0)::float8 as revenue,
              count(*)::int as delivered
         from work_orders w
        where w.shop_id = $1 and w.status = 'delivered' and w.delivered_at >= date_trunc('month', now())`,
      [shop],
    )
    const totals = await one<{ customers: number; vehicles: number }>(
      `select (select count(*) from customers where shop_id = $1)::int as customers,
              (select count(*) from vehicles where shop_id = $1)::int as vehicles`,
      [shop],
    )
    return {
      by_status: Object.fromEntries(counts.map((c) => [c.status, c.n])),
      month,
      totals,
    }
  })

  app.get('/shop', async (req) => {
    const shop = await one<any>('select id, name, phone, address, vat_number, ics_token from shops where id = $1', [shopId(req)])
    const base = process.env.PUBLIC_URL?.replace(/\/$/, '') ?? `${req.protocol}://${req.host}`
    return { ...shop, ics_url: `${base}/api/ics/${shop.ics_token}.ics` }
  })

  app.patch('/shop', async (req) => {
    if (req.user!.role !== 'owner') throw httpError(403, 'Μόνο ο ιδιοκτήτης μπορεί να αλλάξει τα στοιχεία')
    const b = z
      .object({ name: z.string().trim().min(1).max(200), phone: optStr, address: optStr, vat_number: optStr })
      .partial()
      .parse(req.body)
    const { set, values } = buildUpdate(b, ['name', 'phone', 'address', 'vat_number'], 2)
    if (!set) throw httpError(400, 'Τίποτα προς ενημέρωση')
    return one(`update shops set ${set} where id = $1 returning id, name, phone, address, vat_number`, [shopId(req), ...values])
  })

  /** Νέο μυστικό link ημερολογίου (αν διέρρευσε το παλιό). */
  app.post('/shop/ics-token', async (req) => {
    await q(`update shops set ics_token = replace(gen_random_uuid()::text, '-', '') where id = $1`, [shopId(req)])
    return { ok: true }
  })
}
