"use server";

import { revalidatePath } from "next/cache";
import { createBooking, getService, getVehicleByPlate } from "@/lib/data";
import { isValidPlate, formatPlate } from "@/lib/plate";

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
  if (input.phone.replace(/\D/g, "").length < 10) return { ok: false as const, error: "Το κινητό πρέπει να έχει 10 ψηφία." };
  if (new Date(input.start).getTime() < Date.now()) return { ok: false as const, error: "Η ώρα αυτή πέρασε. Διάλεξε άλλη." };

  const appt = await createBooking({ ...input, plate: formatPlate(input.plate) });
  const service = await getService(appt.serviceId);
  revalidatePath("/admin", "layout");
  return { ok: true as const, id: appt.id, status: appt.status, start: appt.start, end: appt.end, service: service?.name ?? "" };
}
