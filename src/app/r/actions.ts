"use server";

import { revalidatePath } from "next/cache";
import { BookingError, canCustomerChange, getAppointmentByToken, getService, moveAppointment, setAppointmentStatus } from "@/lib/data";

type Result = { ok: true } | { ok: false; error: string };

const tooLate = "Το ραντεβού είναι πολύ κοντά για αλλαγή από εδώ. Πάρε μας τηλέφωνο.";

export async function cancelByToken(token: string): Promise<Result> {
  const appt = await getAppointmentByToken(token);
  if (!appt) return { ok: false, error: "Το ραντεβού δεν βρέθηκε." };
  if (!canCustomerChange(appt)) return { ok: false, error: tooLate };
  await setAppointmentStatus(appt.id, "cancelled");
  revalidatePath("/admin", "layout");
  revalidatePath(`/r/${token}`);
  return { ok: true };
}

export async function rescheduleByToken(token: string, start: string): Promise<Result> {
  const appt = await getAppointmentByToken(token);
  if (!appt) return { ok: false, error: "Το ραντεβού δεν βρέθηκε." };
  if (!canCustomerChange(appt)) return { ok: false, error: tooLate };
  if (new Date(start).getTime() < Date.now()) return { ok: false, error: "Η ώρα αυτή πέρασε. Διάλεξε άλλη." };
  try {
    await moveAppointment(appt.id, start, { online: true });
  } catch (e) {
    if (e instanceof BookingError) return { ok: false, error: e.message };
    throw e;
  }
  // Εργασίες που θέλουν έγκριση ξαναπερνούν από το συνεργείο με τη νέα ώρα
  const service = await getService(appt.serviceId);
  if (service?.requiresApproval) await setAppointmentStatus(appt.id, "pending");
  revalidatePath("/admin", "layout");
  revalidatePath(`/r/${token}`);
  return { ok: true };
}
