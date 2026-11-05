import { z } from 'zod'
import { one } from './db'
import { formatPlate, httpError, normPlate, optStr } from './util'

/**
 * Κοινή είσοδος «όχημα + πελάτης» για ραντεβού και κάρτες εργασίας.
 * Είτε δίνεται vehicle_id, είτε πινακίδα (βρίσκει υπάρχον ή δημιουργεί νέο),
 * προαιρετικά με στοιχεία νέου πελάτη.
 */
export const intakeSchema = z.object({
  vehicle_id: z.string().uuid().nullish(),
  customer_id: z.string().uuid().nullish(),
  plate: optStr,
  make: optStr,
  model: optStr,
  full_name: optStr,
  phone: optStr,
})
export type Intake = z.infer<typeof intakeSchema>

export async function resolveIntake(shopId: string, input: Intake) {
  let vehicle: { id: string; customer_id: string | null } | undefined
  let customerId = input.customer_id ?? null

  if (customerId) {
    const c = await one('select id from customers where id = $1 and shop_id = $2', [customerId, shopId])
    if (!c) throw httpError(404, 'Ο πελάτης δεν βρέθηκε')
  }

  if (input.vehicle_id) {
    vehicle = await one('select id, customer_id from vehicles where id = $1 and shop_id = $2', [input.vehicle_id, shopId])
    if (!vehicle) throw httpError(404, 'Το όχημα δεν βρέθηκε')
  } else if (input.plate) {
    const norm = normPlate(input.plate)
    if (norm.length < 2) throw httpError(400, 'Μη έγκυρη πινακίδα')
    vehicle = await one('select id, customer_id from vehicles where shop_id = $1 and plate_norm = $2', [shopId, norm])
    if (!vehicle) {
      vehicle = await one(
        `insert into vehicles(shop_id, plate, plate_norm, make, model)
         values ($1, $2, $3, $4, $5) returning id, customer_id`,
        [shopId, formatPlate(input.plate), norm, input.make, input.model],
      )
    }
  }

  if (!customerId) customerId = vehicle?.customer_id ?? null

  // Νέος πελάτης μόνο αν δεν υπάρχει ήδη ιδιοκτήτης.
  if (!customerId && input.full_name) {
    const c = await one<{ id: string }>(
      'insert into customers(shop_id, full_name, phone) values ($1, $2, $3) returning id',
      [shopId, input.full_name, input.phone],
    )
    customerId = c!.id
  }

  if (vehicle && !vehicle.customer_id && customerId) {
    await one('update vehicles set customer_id = $1, updated_at = now() where id = $2', [customerId, vehicle.id])
  }

  return { vehicle_id: vehicle?.id ?? null, customer_id: customerId }
}
