/**
 * Δημιουργεί το πρώτο συνεργείο + λογαριασμό ιδιοκτήτη και (προαιρετικά) δοκιμαστικά δεδομένα.
 *
 *   npm run seed                      → demo λογαριασμός + δείγμα δεδομένων
 *   SEED_EMAIL=.. SEED_PASSWORD=.. SEED_DEMO=0 npm run seed   → πραγματικός λογαριασμός, χωρίς δείγματα
 *
 * Demo στοιχεία σύνδεσης (μόνο για τοπική δοκιμή): demo@autodiag.local / autodiag-demo
 */
import { closeDb, initDb, migrate, one, q } from './db'
import { hashPassword } from './auth'
import { formatPlate, normPlate } from './util'
import { createWorkOrder } from './routes/workOrders'

const EMAIL = (process.env.SEED_EMAIL ?? 'demo@autodiag.local').toLowerCase()
const PASSWORD = process.env.SEED_PASSWORD ?? 'autodiag-demo'
const SHOP = process.env.SEED_SHOP ?? 'AutoDiag'
const DEMO = process.env.SEED_DEMO !== '0'

await initDb()
await migrate()

const existing = await one('select id from users where email = $1', [EMAIL])
if (existing) {
  console.log(`[seed] ο χρήστης ${EMAIL} υπάρχει ήδη — τίποτα να γίνει.`)
  await closeDb()
  process.exit(0)
}

const shop = (await one<{ id: string }>(
  `insert into shops(name, phone, address) values ($1, $2, $3) returning id`,
  [SHOP, '210 0000000', 'Αγία Παρασκευή'],
))!
await q('insert into users(shop_id, email, name, password_hash) values ($1, $2, $3, $4)', [
  shop.id,
  EMAIL,
  process.env.SEED_NAME ?? 'Ιδιοκτήτης',
  await hashPassword(PASSWORD),
])
console.log(`[seed] συνεργείο "${SHOP}" και χρήστης ${EMAIL} δημιουργήθηκαν.`)

if (DEMO) {
  const people = [
    { name: 'Γιώργος Παπαδόπουλος', phone: '6944 123456', cars: [['ΙΚΒ-4521', 'Toyota', 'Yaris', 2017, 'Βενζίνη']] },
    { name: 'Μαρία Κωνσταντίνου', phone: '6977 654321', cars: [['ΖΗΡ-1180', 'VW', 'Golf 7', 2015, 'Diesel']] },
    {
      name: 'Νίκος Αλεξίου',
      phone: '6932 111222',
      cars: [
        ['ΙΜΤ-7733', 'Peugeot', '208', 2019, 'Βενζίνη'],
        ['ΥΧΕ-9021', 'Fiat', 'Doblo', 2012, 'Diesel'],
      ],
    },
    { name: 'Ελένη Δημητρίου', phone: '6986 909090', cars: [['ΙΑΗ-3304', 'Hyundai', 'i20', 2020, 'Υγραέριο']] },
    { name: 'Κώστας Μαυρίδης', phone: '6945 777888', cars: [['ΖΚΝ-5566', 'BMW', '320d E90', 2010, 'Diesel']] },
  ] as const

  const vehicleIds: string[] = []
  const customerIds: string[] = []
  for (const p of people) {
    const c = (await one<{ id: string }>(
      'insert into customers(shop_id, full_name, phone) values ($1, $2, $3) returning id',
      [shop.id, p.name, p.phone],
    ))!
    for (const [plate, make, model, year, fuel] of p.cars) {
      const v = (await one<{ id: string }>(
        `insert into vehicles(shop_id, customer_id, plate, plate_norm, make, model, year, fuel)
         values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
        [shop.id, c.id, formatPlate(plate), normPlate(plate), make, model, year, fuel],
      ))!
      vehicleIds.push(v.id)
      customerIds.push(c.id)
    }
  }

  const today = new Date()
  const at = (dayOffset: number, h: number, m = 0) => {
    const d = new Date(today)
    d.setDate(d.getDate() + dayOffset)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }
  const appts: [number, number, number, string, number][] = [
    [0, 9, 0, 'Διάγνωση: λαμπάκι check engine', 60],
    [0, 11, 30, 'Μίζα δεν γυρίζει καλά', 90],
    [0, 15, 0, 'Έλεγχος μπαταρίας & δυναμό', 45],
    [1, 10, 0, 'A/C δεν κρυώνει', 120],
    [2, 9, 30, 'Τοποθέτηση κάμερας οπισθοπορείας', 180],
  ]
  for (const [i, [d, h, m, title, dur]] of appts.entries()) {
    await q(
      `insert into appointments(shop_id, vehicle_id, customer_id, title, starts_at, duration_min) values ($1, $2, $3, $4, $5, $6)`,
      [shop.id, vehicleIds[i], customerIds[i], title, at(d, h, m), dur],
    )
  }

  // Ιστορικό: μια παραδομένη και μια ανοιχτή κάρτα
  const done = await createWorkOrder(shop.id, {
    vehicle_id: vehicleIds[5],
    customer_id: customerIds[5],
    complaint: 'Ανάβει λαμπάκι προθέρμανσης, δύσκολη εκκίνηση το πρωί',
    odometer_km: 248300,
  })
  await q(
    `update work_orders set status = 'delivered', diagnosis = 'Καμένα 2 προθερμαντήρια, ρελέ ΟΚ',
            dtc_codes = '{P0671,P0673}', opened_at = now() - interval '20 days',
            ready_at = now() - interval '19 days', delivered_at = now() - interval '19 days' where id = $1`,
    [done.id],
  )
  for (const [kind, desc, code, qty, price] of [
    ['labor', 'Διάγνωση με διαγνωστικό', null, 1, 30],
    ['part', 'Προθερμαντήριο Bosch', '0250403009', 2, 28.5],
    ['labor', 'Αντικατάσταση προθερμαντήρων', null, 1.5, 40],
  ] as const) {
    await q(
      `insert into work_order_items(work_order_id, kind, description, part_code, quantity, unit_price) values ($1, $2, $3, $4, $5, $6)`,
      [done.id, kind, desc, code, qty, price],
    )
  }

  const open = await createWorkOrder(shop.id, {
    vehicle_id: vehicleIds[2],
    customer_id: customerIds[2],
    complaint: 'Δεν ανάβουν τα φώτα πορείας αριστερά',
    odometer_km: 61200,
  })
  await q(`update work_orders set status = 'in_progress' where id = $1`, [open.id])
  await q(
    `insert into work_order_items(work_order_id, kind, description, quantity, unit_price) values ($1, 'labor', 'Έλεγχος καλωδίωσης', 1, 25)`,
    [open.id],
  )
  console.log('[seed] δείγμα δεδομένων προστέθηκε.')
}

await closeDb()
