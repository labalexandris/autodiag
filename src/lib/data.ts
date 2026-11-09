import "server-only";
import * as db from "./mock/seed";
import type { Appointment, AppointmentStatus, Customer, ServiceRecord, Vehicle } from "./types";
import { normalizePlate } from "./plate";

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

export async function setAppointmentStatus(id: string, status: AppointmentStatus) {
  const a = db.appointments.find((x) => x.id === id);
  if (a) a.status = status;
  return a;
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
  if (!service) throw new Error("Άγνωστη υπηρεσία");

  let vehicle: Vehicle | undefined = await getVehicleByPlate(input.plate);
  let customer: Customer | undefined = vehicle ? db.customers.find((c) => c.id === vehicle!.ownerId) : undefined;

  if (!customer) {
    customer = {
      id: `c${db.customers.length + 1}`,
      name: input.name,
      phone: input.phone,
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
      year: new Date().getFullYear(),
      fuel: "Βενζίνη",
      ownerId: customer.id,
      km: 0,
      shareToken: Math.random().toString(36).slice(2, 10),
    };
    db.vehicles.push(vehicle);
  }

  const start = new Date(input.start);
  const end = new Date(start.getTime() + service.durationMin * 60000);
  const taken = new Set(
    db.appointments
      .filter((a) => a.status !== "cancelled" && a.start < end.toISOString() && a.end > start.toISOString())
      .map((a) => a.bayId),
  );
  const bay = db.bays.find((b) => !taken.has(b.id)) ?? db.bays[0];

  const appt: Appointment = {
    id: `a${db.appointments.length + 1}`,
    customerId: customer.id,
    vehicleId: vehicle.id,
    serviceId: service.id,
    bayId: bay.id,
    start: start.toISOString(),
    end: end.toISOString(),
    status: input.confirmed || !service.requiresApproval ? "confirmed" : "pending",
    source: input.source ?? "online",
    notes: input.notes,
    reminder: input.smsConsent ? "scheduled" : "off",
  };
  db.appointments.push(appt);
  return appt;
}

/** Ελεύθερες ώρες για online κράτηση (κάθε 30′, με βάση χωρητικότητα θέσεων) */
export async function getAvailability(serviceId: string, days = 14) {
  const service = db.services.find((s) => s.id === serviceId);
  if (!service) return [];
  const out: { date: string; slots: string[]; closed: boolean }[] = [];
  const now = new Date();
  for (let d = 0; d < days; d++) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + d);
    const hours = db.shop.hours.find((h) => h.day === day.getDay());
    if (!hours?.open || !hours.close) {
      out.push({ date: day.toISOString(), slots: [], closed: true });
      continue;
    }
    const [oh, om] = hours.open.split(":").map(Number);
    const [ch, cm] = hours.close.split(":").map(Number);
    const slots: string[] = [];
    for (let t = oh * 60 + om; t + service.durationMin <= ch * 60 + cm; t += 30) {
      const s = new Date(day);
      s.setMinutes(t);
      if (s.getTime() < now.getTime() + 2 * 3600000) continue;
      const e = new Date(s.getTime() + service.durationMin * 60000);
      const overlapping = db.appointments.filter(
        (a) =>
          a.status !== "cancelled" &&
          a.status !== "no_show" &&
          new Date(a.start) < e &&
          new Date(a.end) > s,
      ).length;
      if (overlapping < db.bays.length) slots.push(s.toISOString());
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
