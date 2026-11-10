import "server-only";
import { neon } from "@neondatabase/serverless";
import { generateDemo } from "./demo/generate";
import { normalizePlate } from "./plate";

/*
 * Σύνδεση με το Neon και σχήμα της βάσης. Οι πίνακες φτιάχνονται μόνοι τους
 * στην πρώτη χρήση. Τα demo δεδομένα μπαίνουν μία φορά (σημάδι στο
 * app_meta), ώστε μετά το «άδειασμα» να μην ξαναεμφανιστούν.
 */

export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Λείπει το DATABASE_URL.");
  return neon(url);
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL UNIQUE,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('owner', 'staff')),
    password_hash text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS app_meta (key text PRIMARY KEY, value text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS customers (
    id text PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    created_at timestamptz NOT NULL DEFAULT now(),
    sms_consent boolean NOT NULL DEFAULT true,
    marketing_consent boolean NOT NULL DEFAULT false,
    notes text
  )`,
  `CREATE TABLE IF NOT EXISTS vehicles (
    id text PRIMARY KEY,
    plate text NOT NULL,
    plate_key text NOT NULL UNIQUE,
    make text NOT NULL,
    model text NOT NULL,
    year int,
    fuel text,
    engine text,
    vin text,
    owner_id text NOT NULL REFERENCES customers(id),
    km int NOT NULL DEFAULT 0,
    share_token text NOT NULL UNIQUE
  )`,
  `CREATE INDEX IF NOT EXISTS vehicles_owner ON vehicles(owner_id)`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id text PRIMARY KEY,
    customer_id text NOT NULL REFERENCES customers(id),
    vehicle_id text NOT NULL REFERENCES vehicles(id),
    service_id text NOT NULL,
    bay_id text NOT NULL,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    status text NOT NULL,
    source text NOT NULL,
    notes text,
    reminder text NOT NULL DEFAULT 'off',
    token text NOT NULL UNIQUE
  )`,
  `CREATE INDEX IF NOT EXISTS appointments_start ON appointments(start_at)`,
  `CREATE INDEX IF NOT EXISTS appointments_vehicle ON appointments(vehicle_id)`,
  `CREATE INDEX IF NOT EXISTS appointments_customer ON appointments(customer_id)`,
  `CREATE TABLE IF NOT EXISTS records (
    id text PRIMARY KEY,
    vehicle_id text NOT NULL REFERENCES vehicles(id),
    appointment_id text,
    service_id text NOT NULL,
    date timestamptz NOT NULL,
    km int NOT NULL,
    title text NOT NULL,
    description text NOT NULL DEFAULT '',
    dtcs text[],
    items jsonb NOT NULL DEFAULT '[]',
    labor double precision NOT NULL DEFAULT 0,
    technician text NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS records_vehicle ON records(vehicle_id)`,
  `CREATE TABLE IF NOT EXISTS reminders (
    id text PRIMARY KEY,
    vehicle_id text NOT NULL REFERENCES vehicles(id),
    kind text NOT NULL,
    due_date timestamptz,
    due_km int,
    last_km int,
    last_date timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS reminders_vehicle ON reminders(vehicle_id)`,
];

const DATA_TABLES = "reminders, records, appointments, vehicles, customers";

let ready: Promise<void> | null = null;

/** Μία φορά ανά εκκίνηση του server: πίνακες και (την πρώτη φορά) demo δεδομένα. */
export function ensureDb() {
  ready ??= (async () => {
    const db = sql();
    for (const q of SCHEMA) await db.query(q);
    // Μόνο ένας server βάζει τα demo: όποιος γράψει πρώτος το σημάδι
    const won = await db`INSERT INTO app_meta (key, value) VALUES ('demo', 'seeding') ON CONFLICT (key) DO NOTHING RETURNING key`;
    if (won.length) {
      try {
        await seedDemo();
      } catch (e) {
        // Να ξαναδοκιμάσει στην επόμενη εκκίνηση
        await db`DELETE FROM app_meta WHERE key = 'demo' AND value = 'seeding'`;
        throw e;
      }
    }
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

/** Τα demo δεδομένα σε γραμμές με τα ονόματα στηλών της βάσης. */
function demoRows() {
  const d = generateDemo();
  return {
    customers: d.customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email ?? null,
      created_at: c.createdAt,
      sms_consent: c.smsConsent,
      marketing_consent: c.marketingConsent,
      notes: c.notes ?? null,
    })),
    vehicles: d.vehicles.map((v) => ({
      id: v.id,
      plate: v.plate,
      plate_key: normalizePlate(v.plate),
      make: v.make,
      model: v.model,
      year: v.year ?? null,
      fuel: v.fuel ?? null,
      engine: v.engine ?? null,
      vin: v.vin ?? null,
      owner_id: v.ownerId,
      km: v.km,
      share_token: v.shareToken,
    })),
    appointments: d.appointments.map((a) => ({
      id: a.id,
      customer_id: a.customerId,
      vehicle_id: a.vehicleId,
      service_id: a.serviceId,
      bay_id: a.bayId,
      start_at: a.start,
      end_at: a.end,
      status: a.status,
      source: a.source,
      notes: a.notes ?? null,
      reminder: a.reminder,
      token: a.token,
    })),
    records: d.records.map((r) => ({
      id: r.id,
      vehicle_id: r.vehicleId,
      appointment_id: r.appointmentId ?? null,
      service_id: r.serviceId,
      date: r.date,
      km: r.km,
      title: r.title,
      description: r.description,
      dtcs: r.dtcs ?? null,
      items: r.items,
      labor: r.labor,
      technician: r.technician,
    })),
    reminders: d.reminders.map((r) => ({
      id: r.id,
      vehicle_id: r.vehicleId,
      kind: r.kind,
      due_date: r.dueDate ?? null,
      due_km: r.dueKm ?? null,
      last_km: r.lastKm ?? null,
      last_date: r.lastDate ?? null,
    })),
  };
}

/** Αδειάζει τα δεδομένα και βάζει καινούργια demo, σχετικά με σήμερα. Όλα ή τίποτα. */
export async function seedDemo() {
  const db = sql();
  const rows = demoRows();
  // Μία εντολή ανά πίνακα: οι γραμμές πάνε ως JSON και γίνονται records στη βάση
  const insert = (table: string, data: unknown[]) =>
    db.query(`INSERT INTO ${table} SELECT * FROM json_populate_recordset(NULL::${table}, $1::json)`, [JSON.stringify(data)]);
  await db.transaction([
    db.query(`TRUNCATE ${DATA_TABLES}`),
    insert("customers", rows.customers),
    insert("vehicles", rows.vehicles),
    insert("appointments", rows.appointments),
    insert("records", rows.records),
    insert("reminders", rows.reminders),
    db`INSERT INTO app_meta (key, value) VALUES ('demo', 'loaded') ON CONFLICT (key) DO UPDATE SET value = 'loaded'`,
  ]);
}

/** Σβήνει όλους τους πελάτες, οχήματα, ραντεβού και βιβλιάρια. Οι χρήστες μένουν. */
export async function clearData() {
  const db = sql();
  await db.transaction([
    db.query(`TRUNCATE ${DATA_TABLES}`),
    db`INSERT INTO app_meta (key, value) VALUES ('demo', 'cleared') ON CONFLICT (key) DO UPDATE SET value = 'cleared'`,
  ]);
}

export async function getDemoState(): Promise<"loaded" | "cleared" | "seeding" | undefined> {
  await ensureDb();
  const rows = (await sql()`SELECT value FROM app_meta WHERE key = 'demo'`) as { value: "loaded" | "cleared" | "seeding" }[];
  return rows[0]?.value;
}
