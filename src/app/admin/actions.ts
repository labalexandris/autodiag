"use server";

import { revalidatePath } from "next/cache";
import { addRecord, createBooking, setAppointmentStatus } from "@/lib/data";
import type { AppointmentStatus, RecordItem } from "@/lib/types";

export async function updateStatus(id: string, status: AppointmentStatus) {
  await setAppointmentStatus(id, status);
  // Σε production εδώ: SMS επιβεβαίωσης + εγγραφή στο Google Calendar
  revalidatePath("/admin", "layout");
}

export async function saveRecord(input: {
  vehicleId: string;
  serviceId: string;
  km: number;
  title: string;
  description: string;
  dtcs: string[];
  items: RecordItem[];
  labor: number;
}) {
  const rec = await addRecord({
    ...input,
    dtcs: input.dtcs.length ? input.dtcs : undefined,
    date: new Date().toISOString(),
    technician: "Γ. Παπουτσάκης",
  });
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
}) {
  const appt = await createBooking({ ...input, smsConsent: true, source: "phone", confirmed: true });
  revalidatePath("/admin", "layout");
  return appt.id;
}
