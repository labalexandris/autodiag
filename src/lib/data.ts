import "server-only";
import { cache } from "react";
import * as config from "./config";
import { ensureDb, sql } from "./db";
import type { Appointment, AppointmentStatus, Customer, ReminderKind, ServiceRecord, Vehicle, VehicleReminder } from "./types";
import { normalizePlate } from "./plate";
import { dayHours } from "./hours";
import { formatPhone, samePhone } from "./phone";

/*
 * Το μοναδικό σημείο πρόσβασης σε δεδομένα. Οι ρυθμίσεις του συνεργείου
 * (υπηρεσίες, ωράριο, θέσεις, SMS) έρχονται από το config.ts· πελάτες,
 * οχήματα, ραντεβού, βιβλιάρια και υπενθυμίσεις από το Neon.
 */

/* ---------- Ρυθμίσεις ---------- */

export const getShop = async () => config.shop;
export const getServices = async () => config.services;
export const getBays = async () => config.bays;
export const getSmsTemplates = async () => config.smsTemplates;
export const getService = async (id: string) => config.services.find((s) => s.id === id);

/* ---------- Μετατροπές γραμμών ---------- */

type Row = Record<string, unknown>;
const isoOf = (v: unknown) => (v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString());
const optIso = (v: unknown) => (v == null ? undefined : isoOf(v));
const opt = <T,>(v: unknown) => (v == null ? undefined : (v as T));

const toCustomer = (r: Row): Customer => ({
  id: r.id as string,
  name: r.name as string,
  phone: r.phone as string,
  email: opt(r.email),
  createdAt: isoOf(r.created_at),
  smsConsent: r.sms_consent as boolean,
  marketingConsent: r.marketing_consent as boolean,
  notes: opt(r.notes),
});

const toVehicle = (r: Row): Vehicle => ({
  id: r.id as string,
  plate: r.plate as string,
  make: r.make as string,
  model: r.model as string,
  year: opt(r.year),
  fuel: opt(r.fuel),
  engine: opt(r.engine),
  vin: opt(r.vin),
  ownerId: r.owner_id as string,
  km: r.km as number,
  shareToken: r.share_token as string,
});

const toAppointment = (r: Row): Appointment => ({
  id: r.id as string,
  customerId: r.customer_id as string,
  vehicleId: r.vehicle_id as string,
  serviceId: r.service_id as string,
  bayId: r.bay_id as string,
  start: isoOf(r.start_at),
  end: isoOf(r.end_at),
  status: r.status as AppointmentStatus,
  source: r.source as Appointment["source"],
  notes: opt(r.notes),
  reminder: r.reminder as Appointment["reminder"],
  token: r.token as string,
});

const toRecord = (r: Row): ServiceRecord => ({
  id: r.id as string,
  vehicleId: r.vehicle_id as string,
  appointmentId: opt(r.appointment_id),
  serviceId: r.service_id as string,
  date: isoOf(r.date),
  km: r.km as number,
  title: r.title as string,
  description: r.description as string,
  dtcs: (r.dtcs as string[] | null)?.length ? (r.dtcs as string[]) : undefined,
  items: r.items as ServiceRecord["items"],
  labor: Number(r.labor),
  technician: r.technician as string,
});

const toReminder = (r: Row): VehicleReminder => ({
  id: r.id as string,
  vehicleId: r.vehicle_id as string,
  kind: r.kind as ReminderKind,
  dueDate: optIso(r.due_date),
  dueKm: opt(r.due_km),
  lastKm: opt(r.last_km),
  lastDate: optIso(r.last_date),
});

async function q(strings: TemplateStringsArray, ...values: unknown[]) {
  await ensureDb();
  return (await sql()(strings, ...values)) as Row[];
}

/** Νέο id για εγγραφές που φτιάχνει η εφαρμογή (τα demo έχουν c1, v1, …) */
const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
/** Token που δεν μαντεύεται, για δημόσιους συνδέσμους (βιβλιάριο, διαχείριση ραντεβού). */
const newToken = () => crypto.randomUUID().replace(/-/g, "");

/* ---------- Πελάτες και οχήματα ---------- */

/** Ανά request: πολλές σελίδες χρειάζονται όλους τους πελάτες/τα οχήματα για αναζήτηση. */
export const getCustomers = cache(async () => (await q`SELECT * FROM customers ORDER BY name`).map(toCustomer));
export async function getCustomer(id: string) {
  const [r] = await q`SELECT * FROM customers WHERE id = ${id}`;
  return r && toCustomer(r);
}

export const getVehicles = cache(async () => (await q`SELECT * FROM vehicles ORDER BY plate`).map(toVehicle));
export async function getVehicle(id: string) {
  const [r] = await q`SELECT * FROM vehicles WHERE id = ${id}`;
  return r && toVehicle(r);
}
export async function getVehicleByPlate(plate: string) {
  const [r] = await q`SELECT * FROM vehicles WHERE plate_key = ${normalizePlate(plate)}`;
  return r && toVehicle(r);
}
export async function getVehicleByToken(token: string) {
  const [r] = await q`SELECT * FROM vehicles WHERE share_token = ${token}`;
  return r && toVehicle(r);
}
export async function getVehiclesForCustomer(customerId: string) {
  return (await q`SELECT * FROM vehicles WHERE owner_id = ${customerId} ORDER BY plate`).map(toVehicle);
}

/** Επισκέψεις, έξοδα και τελευταία επίσκεψη ανά πελάτη (από το βιβλιάριο των οχημάτων του). */
export async function getCustomerStats() {
  const rows = await q`
    SELECT v.owner_id,
           count(r.id)::int AS visits,
           coalesce(sum(r.labor + coalesce((SELECT sum((i->>'qty')::float * (i->>'price')::float) FROM jsonb_array_elements(r.items) i), 0)), 0)::float AS spent,
           max(r.date) AS last_visit
    FROM vehicles v JOIN records r ON r.vehicle_id = v.id
    GROUP BY v.owner_id`;
  return new Map(rows.map((r) => [r.owner_id as string, { visits: r.visits as number, spent: r.spent as number, lastVisit: optIso(r.last_visit) }]));
}

export async function updateVehicle(id: string, patch: Partial<Pick<Vehicle, "make" | "model" | "year" | "fuel" | "engine" | "vin" | "km">>) {
  const v = await getVehicle(id);
  if (!v) return undefined;
  const n = { ...v, ...patch };
  await q`UPDATE vehicles SET make = ${n.make}, model = ${n.model}, year = ${n.year ?? null}, fuel = ${n.fuel ?? null},
          engine = ${n.engine ?? null}, vin = ${n.vin ?? null}, km = ${n.km} WHERE id = ${id}`;
  return n;
}

export async function setVehicleOwner(vehicleId: string, customerId: string) {
  await q`UPDATE vehicles SET owner_id = ${customerId} WHERE id = ${vehicleId} AND EXISTS (SELECT 1 FROM customers WHERE id = ${customerId})`;
  return getVehicle(vehicleId);
}

export async function updateCustomer(
  id: string,
  patch: Partial<Pick<Customer, "name" | "phone" | "email" | "notes" | "smsConsent" | "marketingConsent">>,
) {
  const c = await getCustomer(id);
  if (!c) return undefined;
  const n = { ...c, ...patch };
  await q`UPDATE customers SET name = ${n.name}, phone = ${n.phone}, email = ${n.email ?? null}, notes = ${n.notes ?? null},
          sms_consent = ${n.smsConsent}, marketing_consent = ${n.marketingConsent} WHERE id = ${id}`;
  return n;
}

/* ---------- Βιβλιάριο και υπενθυμίσεις ---------- */

export async function getRecordsForVehicle(vehicleId: string) {
  return (await q`SELECT * FROM records WHERE vehicle_id = ${vehicleId} ORDER BY date DESC`).map(toRecord);
}
export async function getAllRecords() {
  return (await q`SELECT * FROM records ORDER BY date`).map(toRecord);
}
/** Σύνολο (εργασία + ανταλλακτικά) ανά ραντεβού, για τις αναφορές. */
export async function getRecordTotalsByAppointment(from: Date, to: Date) {
  const rows = await q`
    SELECT appointment_id,
           sum(labor + coalesce((SELECT sum((i->>'qty')::float * (i->>'price')::float) FROM jsonb_array_elements(items) i), 0))::float AS total
    FROM records
    WHERE appointment_id IS NOT NULL AND date >= ${from.toISOString()} AND date < ${to.toISOString()}
    GROUP BY appointment_id`;
  return new Map(rows.map((r) => [r.appointment_id as string, r.total as number]));
}
export async function getRemindersForVehicle(vehicleId: string) {
  return (await q`SELECT * FROM reminders WHERE vehicle_id = ${vehicleId}`).map(toReminder);
}
export async function getAllReminders() {
  return (await q`SELECT * FROM reminders`).map(toReminder);
}

export function recordTotal(r: ServiceRecord) {
  return r.labor + r.items.reduce((sum, i) => sum + i.qty * i.price, 0);
}

export async function addRecord(input: Omit<ServiceRecord, "id">) {
  const rec: ServiceRecord = { ...input, id: newId("r") };
  const db = sql();
  await ensureDb();
  const queries = [
    db`INSERT INTO records (id, vehicle_id, appointment_id, service_id, date, km, title, description, dtcs, items, labor, technician)
       VALUES (${rec.id}, ${rec.vehicleId}, ${rec.appointmentId ?? null}, ${rec.serviceId}, ${rec.date}, ${rec.km}, ${rec.title},
               ${rec.description}, ${rec.dtcs ?? null}, ${JSON.stringify(rec.items)}::jsonb, ${rec.labor}, ${rec.technician})`,
    db`UPDATE vehicles SET km = ${input.km} WHERE id = ${input.vehicleId} AND km < ${input.km}`,
  ];
  if (input.appointmentId) queries.push(db`UPDATE appointments SET status = 'done' WHERE id = ${input.appointmentId}`);
  if (input.serviceId === "service") {
    queries.push(db`UPDATE reminders SET last_km = ${input.km}, due_km = ${input.km + 15000}, last_date = ${input.date}
                    WHERE vehicle_id = ${input.vehicleId} AND kind = 'oil'`);
  }
  await db.transaction(queries);
  return rec;
}

/* ---------- Ραντεβού ---------- */

export async function getAppointments(range?: { from: Date; to: Date }) {
  const rows = range
    ? await q`SELECT * FROM appointments WHERE start_at >= ${range.from.toISOString()} AND start_at < ${range.to.toISOString()} ORDER BY start_at`
    : await q`SELECT * FROM appointments ORDER BY start_at`;
  return rows.map(toAppointment);
}
export async function getPendingAppointments() {
  return (await q`SELECT * FROM appointments WHERE status = 'pending' ORDER BY start_at`).map(toAppointment);
}
export const getPendingCount = cache(async () => {
  const [r] = await q`SELECT count(*)::int AS n FROM appointments WHERE status = 'pending'`;
  return r.n as number;
});
export async function getAppointmentsForVehicle(vehicleId: string) {
  return (await q`SELECT * FROM appointments WHERE vehicle_id = ${vehicleId} ORDER BY start_at`).map(toAppointment);
}
export async function getAppointmentsForCustomer(customerId: string) {
  return (await q`SELECT * FROM appointments WHERE customer_id = ${customerId} ORDER BY start_at DESC`).map(toAppointment);
}
export async function getAppointment(id: string) {
  const [r] = await q`SELECT * FROM appointments WHERE id = ${id}`;
  return r && toAppointment(r);
}
export async function getAppointmentByToken(token: string) {
  const [r] = await q`SELECT * FROM appointments WHERE token = ${token}`;
  return r && toAppointment(r);
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus) {
  const [r] = await q`UPDATE appointments SET status = ${status} WHERE id = ${id} RETURNING *`;
  return r && toAppointment(r);
}

/** Σφάλμα που φτάνει ως μήνυμα στον χρήστη (π.χ. η ώρα μόλις κλείστηκε). */
export class BookingError extends Error {}

type Busy = { id: string; bayId: string; start: number; end: number };

/** Τα ραντεβού που πιάνουν θέση (όχι ακυρωμένα ή «δεν ήρθε») σε ένα διάστημα. */
async function busyBetween(from: Date, to: Date): Promise<Busy[]> {
  const rows = await q`
    SELECT id, bay_id, start_at, end_at FROM appointments
    WHERE status NOT IN ('cancelled', 'no_show') AND start_at < ${to.toISOString()} AND end_at > ${from.toISOString()}`;
  return rows.map((r) => ({ id: r.id as string, bayId: r.bay_id as string, start: new Date(isoOf(r.start_at)).getTime(), end: new Date(isoOf(r.end_at)).getTime() }));
}

/** Πρώτη ελεύθερη θέση για το διάστημα, ή undefined αν είναι όλες πιασμένες. */
function freeBay(busy: Busy[], start: Date, end: Date, opts: { excludeId?: string; prefer?: string } = {}) {
  const s = start.getTime();
  const e = end.getTime();
  const taken = new Set(busy.filter((b) => b.id !== opts.excludeId && b.start < e && b.end > s).map((b) => b.bayId));
  if (opts.prefer && !taken.has(opts.prefer)) return config.bays.find((b) => b.id === opts.prefer);
  return config.bays.find((b) => !taken.has(b.id));
}

function withinHours(start: Date, end: Date) {
  const h = dayHours(config.shop, start.getDay());
  if (!h || start.toDateString() !== end.toDateString()) return false;
  const s = start.getHours() * 60 + start.getMinutes();
  const e = end.getHours() * 60 + end.getMinutes();
  return s >= h.open && e <= h.close;
}

/** Πόσες ώρες πριν από το ραντεβού μπορεί ο πελάτης να το αλλάξει μόνος του. */
export const CUSTOMER_CHANGE_HOURS = 2;

export function canCustomerChange(a: Appointment) {
  return (a.status === "pending" || a.status === "confirmed") && new Date(a.start).getTime() - Date.now() > CUSTOMER_CHANGE_HOURS * 3600000;
}

export async function createBooking(input: {
  serviceId: string;
  start: string;
  plate: string;
  make: string;
  model: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  smsConsent: boolean;
  source?: Appointment["source"];
  confirmed?: boolean;
}): Promise<Appointment> {
  const service = config.services.find((s) => s.id === input.serviceId);
  if (!service) throw new BookingError("Άγνωστη υπηρεσία.");
  const source = input.source ?? "online";

  const start = new Date(input.start);
  if (Number.isNaN(start.getTime())) throw new BookingError("Η ώρα δεν είναι σωστή.");
  const end = new Date(start.getTime() + service.durationMin * 60000);
  if (source === "online" && !withinHours(start, end)) throw new BookingError("Η ώρα είναι εκτός ωραρίου. Διάλεξε άλλη.");
  // Ο έλεγχος γίνεται ξανά εδώ: η διαθεσιμότητα που είδε ο χρήστης μπορεί να έχει αλλάξει.
  const bay = freeBay(await busyBetween(start, end), start, end);
  if (!bay) throw new BookingError(source === "online" ? "Η ώρα αυτή μόλις κλείστηκε. Διάλεξε άλλη." : "Όλες οι θέσεις είναι πιασμένες αυτή την ώρα.");

  const db = sql();
  const queries = [];
  let vehicle = await getVehicleByPlate(input.plate);
  const owner = vehicle ? await getCustomer(vehicle.ownerId) : undefined;

  /*
   * Το ραντεβού ανήκει σε όποιον το έκλεισε, όχι απαραίτητα στον ιδιοκτήτη
   * που έχουμε στο αρχείο: το αυτοκίνητο μπορεί να άλλαξε χέρια. Ο ιδιοκτήτης
   * του οχήματος αλλάζει μόνο από το συνεργείο.
   */
  let customer: Customer | undefined = owner && samePhone(owner.phone, input.phone) ? owner : undefined;
  if (!customer) {
    const digits = input.phone.replace(/\D/g, "").slice(-10);
    const candidates = (await q`SELECT * FROM customers WHERE regexp_replace(phone, '\\D', '', 'g') LIKE ${"%" + digits}`).map(toCustomer);
    customer = candidates.find((c) => samePhone(c.phone, input.phone));
  }
  if (!customer) {
    customer = {
      id: newId("c"),
      name: input.name,
      phone: formatPhone(input.phone),
      email: input.email,
      createdAt: new Date().toISOString(),
      smsConsent: input.smsConsent,
      marketingConsent: false,
    };
    queries.push(db`INSERT INTO customers (id, name, phone, email, created_at, sms_consent, marketing_consent)
                    VALUES (${customer.id}, ${customer.name}, ${customer.phone}, ${customer.email ?? null}, ${customer.createdAt}, ${customer.smsConsent}, false)`);
  }
  if (!vehicle) {
    vehicle = { id: newId("v"), plate: input.plate, make: input.make, model: input.model, ownerId: customer.id, km: 0, shareToken: newToken() };
    queries.push(db`INSERT INTO vehicles (id, plate, plate_key, make, model, owner_id, km, share_token)
                    VALUES (${vehicle.id}, ${vehicle.plate}, ${normalizePlate(vehicle.plate)}, ${vehicle.make}, ${vehicle.model}, ${customer.id}, 0, ${vehicle.shareToken})`);
  }

  const appt: Appointment = {
    id: newId("a"),
    customerId: customer.id,
    vehicleId: vehicle.id,
    serviceId: service.id,
    bayId: bay.id,
    start: start.toISOString(),
    end: end.toISOString(),
    status: input.confirmed || !service.requiresApproval ? "confirmed" : "pending",
    source,
    notes: input.notes,
    reminder: input.smsConsent ? "scheduled" : "off",
    token: newToken(),
  };
  queries.push(db`INSERT INTO appointments (id, customer_id, vehicle_id, service_id, bay_id, start_at, end_at, status, source, notes, reminder, token)
                  VALUES (${appt.id}, ${appt.customerId}, ${appt.vehicleId}, ${appt.serviceId}, ${appt.bayId}, ${appt.start}, ${appt.end},
                          ${appt.status}, ${appt.source}, ${appt.notes ?? null}, ${appt.reminder}, ${appt.token})`);
  await db.transaction(queries);
  return appt;
}

/** Μετακίνηση ραντεβού σε νέα ώρα (ίδια διάρκεια). Κρατά την ίδια θέση αν είναι ελεύθερη. */
export async function moveAppointment(id: string, startIso: string, opts: { online?: boolean } = {}) {
  const appt = await getAppointment(id);
  if (!appt) throw new BookingError("Το ραντεβού δεν βρέθηκε.");
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) throw new BookingError("Η ώρα δεν είναι σωστή.");
  const end = new Date(start.getTime() + (new Date(appt.end).getTime() - new Date(appt.start).getTime()));
  if (opts.online && !withinHours(start, end)) throw new BookingError("Η ώρα είναι εκτός ωραρίου. Διάλεξε άλλη.");
  const bay = freeBay(await busyBetween(start, end), start, end, { excludeId: appt.id, prefer: appt.bayId });
  if (!bay) throw new BookingError(opts.online ? "Η ώρα αυτή μόλις κλείστηκε. Διάλεξε άλλη." : "Όλες οι θέσεις είναι πιασμένες αυτή την ώρα.");
  const reminder = appt.reminder === "sent" ? "scheduled" : appt.reminder;
  await q`UPDATE appointments SET start_at = ${start.toISOString()}, end_at = ${end.toISOString()}, bay_id = ${bay.id}, reminder = ${reminder} WHERE id = ${id}`;
  return { ...appt, start: start.toISOString(), end: end.toISOString(), bayId: bay.id, reminder } as Appointment;
}

/** Ελεύθερες ώρες για online κράτηση (κάθε 30′, με βάση τις ελεύθερες θέσεις) */
export async function getAvailability(serviceId: string, days = 14, excludeId?: string) {
  const service = config.services.find((s) => s.id === serviceId);
  if (!service) return [];
  const first = new Date();
  first.setHours(0, 0, 0, 0);
  const last = new Date(first);
  last.setDate(last.getDate() + days);
  const busy = await busyBetween(first, last);

  const out: { date: string; slots: string[]; closed: boolean }[] = [];
  const now = Date.now();
  for (let d = 0; d < days; d++) {
    const day = new Date(first);
    day.setDate(day.getDate() + d);
    const hours = dayHours(config.shop, day.getDay());
    if (!hours) {
      out.push({ date: day.toISOString(), slots: [], closed: true });
      continue;
    }
    const slots: string[] = [];
    for (let t = hours.open; t + service.durationMin <= hours.close; t += 30) {
      const s = new Date(day);
      s.setMinutes(t);
      if (s.getTime() < now + CUSTOMER_CHANGE_HOURS * 3600000) continue;
      const e = new Date(s.getTime() + service.durationMin * 60000);
      if (freeBay(busy, s, e, { excludeId })) slots.push(s.toISOString());
    }
    out.push({ date: day.toISOString(), slots, closed: false });
  }
  return out;
}
