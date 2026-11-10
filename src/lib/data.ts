import "server-only";
import * as db from "./mock/seed";
import type { Appointment, AppointmentStatus, Customer, ServiceRecord, Vehicle } from "./types";
import { normalizePlate } from "./plate";
import { dayHours } from "./hours";
import { formatPhone, samePhone } from "./phone";

/*
 * Το μοναδικό σημείο πρόσβασης σε δεδομένα. Σήμερα διαβάζει από τα mock
 * (in-memory). Με τη μετάβαση στο Neon αλλάζει μόνο αυτό το αρχείο: ίδιες
 * υπογραφές, queries αντί για arrays.
 */

export const getShop = async () => db.shop;
export const getServices = async () => db.services;
export const getBays = async () => db.bays;
export const getSmsTemplates = async () => db.smsTemplates;

export const getService = async (id: string) => db.services.find((s) => s.id === id);

export async function getCustomers() {
  return db.customers;
}
export async function getCustomer(id: string) {
  return db.customers.find((c) => c.id === id);
}

export async function getVehicles() {
  return db.vehicles;
}
export async function getVehicle(id: string) {
  return db.vehicles.find((v) => v.id === id);
}
export async function getVehicleByPlate(plate: string) {
  const p = normalizePlate(plate);
  return db.vehicles.find((v) => normalizePlate(v.plate) === p);
}
export async function getVehicleByToken(token: string) {
  return db.vehicles.find((v) => v.shareToken === token);
}
export async function getVehiclesForCustomer(customerId: string) {
  return db.vehicles.filter((v) => v.ownerId === customerId);
}

export async function getRecordsForVehicle(vehicleId: string) {
  return db.records
    .filter((r) => r.vehicleId === vehicleId)
    .sort((a, b) => b.date.localeCompare(a.date));
}
export async function getAllRecords() {
  return db.records;
}
export async function getRemindersForVehicle(vehicleId: string) {
  return db.reminders.filter((r) => r.vehicleId === vehicleId);
}
export async function getAllReminders() {
  return db.reminders;
}

export async function getAppointments(range?: { from: Date; to: Date }) {
  const list = range
    ? db.appointments.filter((a) => {
        const t = new Date(a.start).getTime();
        return t >= range.from.getTime() && t < range.to.getTime();
      })
    : db.appointments;
  return [...list].sort((a, b) => a.start.localeCompare(b.start));
}
export async function getAppointmentsForCustomer(customerId: string) {
  return db.appointments
    .filter((a) => a.customerId === customerId)
    .sort((a, b) => b.start.localeCompare(a.start));
}
export async function getAppointment(id: string) {
  return db.appointments.find((a) => a.id === id);
}
export async function getAppointmentByToken(token: string) {
  return db.appointments.find((a) => a.token === token);
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus) {
  const a = db.appointments.find((x) => x.id === id);
  if (a) a.status = status;
  return a;
}

/** Σφάλμα που φτάνει ως μήνυμα στον χρήστη (π.χ. η ώρα μόλις κλείστηκε). */
export class BookingError extends Error {}

/** Token που δεν μαντεύεται, για δημόσιους συνδέσμους (βιβλιάριο, διαχείριση ραντεβού). */
const newToken = () => crypto.randomUUID().replace(/-/g, "");

const freesSlot = (s: AppointmentStatus) => s === "cancelled" || s === "no_show";

/** Πρώτη ελεύθερη θέση για το διάστημα, ή undefined αν είναι όλες πιασμένες. */
function freeBay(start: Date, end: Date, opts: { excludeId?: string; prefer?: string } = {}) {
  const taken = new Set(
    db.appointments
      .filter((a) => a.id !== opts.excludeId && !freesSlot(a.status) && new Date(a.start) < end && new Date(a.end) > start)
      .map((a) => a.bayId),
  );
  if (opts.prefer && !taken.has(opts.prefer)) return db.bays.find((b) => b.id === opts.prefer);
  return db.bays.find((b) => !taken.has(b.id));
}

function withinHours(start: Date, end: Date) {
  const h = dayHours(db.shop, start.getDay());
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
  const service = db.services.find((s) => s.id === input.serviceId);
  if (!service) throw new BookingError("Άγνωστη υπηρεσία.");
  const source = input.source ?? "online";

  const start = new Date(input.start);
  if (Number.isNaN(start.getTime())) throw new BookingError("Η ώρα δεν είναι σωστή.");
  const end = new Date(start.getTime() + service.durationMin * 60000);
  if (source === "online" && !withinHours(start, end)) throw new BookingError("Η ώρα είναι εκτός ωραρίου. Διάλεξε άλλη.");
  // Ο έλεγχος γίνεται ξανά εδώ: η διαθεσιμότητα που είδε ο χρήστης μπορεί να έχει αλλάξει.
  const bay = freeBay(start, end);
  if (!bay) throw new BookingError(source === "online" ? "Η ώρα αυτή μόλις κλείστηκε. Διάλεξε άλλη." : "Όλες οι θέσεις είναι πιασμένες αυτή την ώρα.");

  let vehicle: Vehicle | undefined = await getVehicleByPlate(input.plate);
  const owner = vehicle ? db.customers.find((c) => c.id === vehicle!.ownerId) : undefined;

  /*
   * Το ραντεβού ανήκει σε όποιον το έκλεισε, όχι απαραίτητα στον ιδιοκτήτη
   * που έχουμε στο αρχείο: το αυτοκίνητο μπορεί να άλλαξε χέρια. Ο ιδιοκτήτης
   * του οχήματος αλλάζει μόνο από το συνεργείο.
   */
  let customer: Customer | undefined =
    owner && samePhone(owner.phone, input.phone) ? owner : db.customers.find((c) => samePhone(c.phone, input.phone));

  if (!customer) {
    customer = {
      id: `c${db.customers.length + 1}`,
      name: input.name,
      phone: formatPhone(input.phone),
      email: input.email,
      createdAt: new Date().toISOString(),
      smsConsent: input.smsConsent,
      marketingConsent: false,
    };
    db.customers.push(customer);
  }
  if (!vehicle) {
    vehicle = {
      id: `v${db.vehicles.length + 1}`,
      plate: input.plate,
      make: input.make,
      model: input.model,
      ownerId: customer.id,
      km: 0,
      shareToken: newToken(),
    };
    db.vehicles.push(vehicle);
  }

  const appt: Appointment = {
    id: `a${db.appointments.length + 1}`,
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
  db.appointments.push(appt);
  return appt;
}

/** Μετακίνηση ραντεβού σε νέα ώρα (ίδια διάρκεια). Κρατά την ίδια θέση αν είναι ελεύθερη. */
export async function moveAppointment(id: string, startIso: string, opts: { online?: boolean } = {}) {
  const appt = db.appointments.find((a) => a.id === id);
  if (!appt) throw new BookingError("Το ραντεβού δεν βρέθηκε.");
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) throw new BookingError("Η ώρα δεν είναι σωστή.");
  const end = new Date(start.getTime() + (new Date(appt.end).getTime() - new Date(appt.start).getTime()));
  if (opts.online && !withinHours(start, end)) throw new BookingError("Η ώρα είναι εκτός ωραρίου. Διάλεξε άλλη.");
  const bay = freeBay(start, end, { excludeId: appt.id, prefer: appt.bayId });
  if (!bay) throw new BookingError(opts.online ? "Η ώρα αυτή μόλις κλείστηκε. Διάλεξε άλλη." : "Όλες οι θέσεις είναι πιασμένες αυτή την ώρα.");
  appt.start = start.toISOString();
  appt.end = end.toISOString();
  appt.bayId = bay.id;
  if (appt.reminder === "sent") appt.reminder = "scheduled";
  return appt;
}

export async function updateVehicle(id: string, patch: Partial<Pick<Vehicle, "make" | "model" | "year" | "fuel" | "engine" | "vin" | "km">>) {
  const v = db.vehicles.find((x) => x.id === id);
  if (v) Object.assign(v, patch);
  return v;
}

export async function setVehicleOwner(vehicleId: string, customerId: string) {
  const v = db.vehicles.find((x) => x.id === vehicleId);
  if (v && db.customers.some((c) => c.id === customerId)) v.ownerId = customerId;
  return v;
}

export async function updateCustomer(
  id: string,
  patch: Partial<Pick<Customer, "name" | "phone" | "email" | "notes" | "smsConsent" | "marketingConsent">>,
) {
  const c = db.customers.find((x) => x.id === id);
  if (c) Object.assign(c, patch);
  return c;
}

/** Ελεύθερες ώρες για online κράτηση (κάθε 30′, με βάση τις ελεύθερες θέσεις) */
export async function getAvailability(serviceId: string, days = 14, excludeId?: string) {
  const service = db.services.find((s) => s.id === serviceId);
  if (!service) return [];
  const out: { date: string; slots: string[]; closed: boolean }[] = [];
  const now = new Date();
  for (let d = 0; d < days; d++) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + d);
    const hours = dayHours(db.shop, day.getDay());
    if (!hours) {
      out.push({ date: day.toISOString(), slots: [], closed: true });
      continue;
    }
    const slots: string[] = [];
    for (let t = hours.open; t + service.durationMin <= hours.close; t += 30) {
      const s = new Date(day);
      s.setMinutes(t);
      if (s.getTime() < now.getTime() + CUSTOMER_CHANGE_HOURS * 3600000) continue;
      const e = new Date(s.getTime() + service.durationMin * 60000);
      if (freeBay(s, e, { excludeId })) slots.push(s.toISOString());
    }
    out.push({ date: day.toISOString(), slots, closed: false });
  }
  return out;
}

export function recordTotal(r: ServiceRecord) {
  return r.labor + r.items.reduce((sum, i) => sum + i.qty * i.price, 0);
}

export async function addRecord(input: Omit<ServiceRecord, "id">) {
  const rec: ServiceRecord = { ...input, id: `r${db.records.length + 1}` };
  db.records.push(rec);
  const v = db.vehicles.find((x) => x.id === input.vehicleId);
  if (v && input.km > v.km) v.km = input.km;
  if (input.appointmentId) {
    const appt = db.appointments.find((x) => x.id === input.appointmentId);
    if (appt) appt.status = "done";
  }
  if (input.serviceId === "service") {
    const oil = db.reminders.find((r) => r.vehicleId === input.vehicleId && r.kind === "oil");
    if (oil) {
      oil.lastKm = input.km;
      oil.dueKm = input.km + 15000;
      oil.lastDate = input.date;
    }
  }
  return rec;
}
