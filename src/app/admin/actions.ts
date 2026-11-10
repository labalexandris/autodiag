"use server";

import { revalidatePath } from "next/cache";
import {
  addRecord,
  BookingError,
  createBooking,
  getAppointment,
  getShop,
  moveAppointment,
  setAppointmentStatus,
  setVehicleOwner,
  updateCustomer,
  updateVehicle,
} from "@/lib/data";
import { requireAdmin } from "@/lib/auth-server";
import { formatPhone, normalizePhone } from "@/lib/phone";
import type { AppointmentStatus, Fuel, RecordItem } from "@/lib/types";

type Result = { ok: true } | { ok: false; error: string };
const fail = (e: unknown): Result => {
  if (e instanceof BookingError) return { ok: false, error: e.message };
  throw e;
};

export async function updateStatus(id: string, status: AppointmentStatus) {
  await requireAdmin();
  await setAppointmentStatus(id, status);
  // Σε production εδώ: SMS επιβεβαίωσης + εγγραφή στο Google Calendar
  revalidatePath("/admin", "layout");
}

export async function saveRecord(input: {
  vehicleId: string;
  serviceId: string;
  /** Αν δοθεί, το ραντεβού κλείνει ως «ολοκληρώθηκε» μαζί με την εγγραφή */
  appointmentId?: string;
  km: number;
  title: string;
  description: string;
  dtcs: string[];
  items: RecordItem[];
  labor: number;
  technician: string;
}) {
  await requireAdmin();
  const shop = await getShop();
  const rec = await addRecord({
    ...input,
    dtcs: input.dtcs.length ? input.dtcs : undefined,
    date: new Date().toISOString(),
    technician: shop.technicians.includes(input.technician) ? input.technician : shop.technicians[0],
  });
  // Σε production εδώ: SMS «το όχημα είναι έτοιμο»
  revalidatePath("/admin", "layout");
  return rec.id;
}

export async function createPhoneBooking(input: {
  plate: string;
  serviceId: string;
  start: string;
  name: string;
  phone: string;
  make: string;
  model: string;
  notes?: string;
}): Promise<Result> {
  await requireAdmin();
  try {
    await createBooking({ ...input, smsConsent: true, source: "phone", confirmed: true });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function rescheduleAppointment(id: string, start: string): Promise<Result> {
  await requireAdmin();
  try {
    await moveAppointment(id, start);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Ο πελάτης που έκλεισε το ραντεβού γίνεται ιδιοκτήτης του οχήματος στο αρχείο. */
export async function assignOwnerFromAppointment(appointmentId: string) {
  await requireAdmin();
  const appt = await getAppointment(appointmentId);
  if (appt) await setVehicleOwner(appt.vehicleId, appt.customerId);
  revalidatePath("/admin", "layout");
}

export async function saveVehicle(
  id: string,
  input: { make: string; model: string; year?: number; fuel?: Fuel; engine?: string; vin?: string; km: number },
): Promise<Result> {
  await requireAdmin();
  if (input.make.trim().length < 2) return { ok: false, error: "Συμπλήρωσε τη μάρκα." };
  const thisYear = new Date().getFullYear();
  if (input.year !== undefined && (input.year < 1950 || input.year > thisYear + 1)) return { ok: false, error: "Το έτος δεν είναι σωστό." };
  await updateVehicle(id, {
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year,
    fuel: input.fuel,
    engine: input.engine?.trim() || undefined,
    vin: input.vin?.trim().toUpperCase() || undefined,
    km: Math.max(0, Math.round(input.km)),
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveCustomer(
  id: string,
  input: { name: string; phone: string; email?: string; notes?: string; smsConsent: boolean; marketingConsent: boolean },
): Promise<Result> {
  await requireAdmin();
  if (input.name.trim().length < 3) return { ok: false, error: "Συμπλήρωσε το ονοματεπώνυμο." };
  if (!normalizePhone(input.phone)) return { ok: false, error: "Το τηλέφωνο πρέπει να έχει 10 ψηφία." };
  await updateCustomer(id, {
    name: input.name.trim(),
    phone: formatPhone(input.phone),
    email: input.email?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    smsConsent: input.smsConsent,
    marketingConsent: input.marketingConsent,
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}
