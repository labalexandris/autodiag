"use server";

import { revalidatePath } from "next/cache";
import { BookingError, createBooking, getService, getVehicleByPlate } from "@/lib/data";
import { isValidPlate, formatPlate } from "@/lib/plate";
import { normalizeMobile } from "@/lib/phone";

/** Μόνο μάρκα/μοντέλο, για προσυμπλήρωση. Ποτέ στοιχεία ιδιοκτήτη σε δημόσια σελίδα. */
export async function lookupPlate(plate: string) {
  if (!isValidPlate(plate)) return null;
  const v = await getVehicleByPlate(plate);
  return v ? { make: v.make, model: v.model } : null;
}

export async function submitBooking(input: {
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
}) {
  if (!isValidPlate(input.plate)) return { ok: false as const, error: "Η πινακίδα δεν είναι σωστή." };
  const phone = normalizeMobile(input.phone);
  if (!phone) return { ok: false as const, error: "Γράψε ένα κινητό 10 ψηφίων που αρχίζει από 69." };
  if (input.name.trim().length < 3) return { ok: false as const, error: "Συμπλήρωσε το όνομά σου." };
  if (new Date(input.start).getTime() < Date.now()) return { ok: false as const, error: "Η ώρα αυτή πέρασε. Διάλεξε άλλη." };

  try {
    const appt = await createBooking({ ...input, phone, plate: formatPlate(input.plate), source: "online" });
    const service = await getService(appt.serviceId);
    revalidatePath("/admin", "layout");
    return { ok: true as const, id: appt.id, token: appt.token, status: appt.status, start: appt.start, end: appt.end, service: service?.name ?? "" };
  } catch (e) {
    if (e instanceof BookingError) return { ok: false as const, error: e.message, slotTaken: true };
    throw e;
  }
}
