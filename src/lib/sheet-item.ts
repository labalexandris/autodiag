import type { Appointment, AppointmentSource, AppointmentStatus, Bay, Customer, Service, Vehicle } from "./types";
import { normalizePlate } from "./plate";

/** Ό,τι χρειάζεται το παράθυρο ενός ραντεβού, σε μορφή που περνάει στον client. */
export interface SheetItem {
  id: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  start: string;
  end: string;
  notes?: string;
  bayName: string;
  plate: string;
  plateKey: string;
  vehicleId: string;
  vehicle: string;
  km: number;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  /** Το ραντεβού το έκλεισε άλλος από τον ιδιοκτήτη που έχουμε στο αρχείο */
  ownerMismatch: boolean;
}

export function toSheetItem(
  it: { appt: Appointment; vehicle: Vehicle; customer: Customer; service: Service },
  bays: Bay[],
): SheetItem {
  return {
    id: it.appt.id,
    status: it.appt.status,
    source: it.appt.source,
    start: it.appt.start,
    end: it.appt.end,
    notes: it.appt.notes,
    bayName: bays.find((b) => b.id === it.appt.bayId)?.name ?? "",
    plate: it.vehicle.plate,
    plateKey: normalizePlate(it.vehicle.plate),
    vehicleId: it.vehicle.id,
    vehicle: `${it.vehicle.make} ${it.vehicle.model}`.trim(),
    km: it.vehicle.km,
    customerName: it.customer.name,
    customerPhone: it.customer.phone,
    serviceId: it.service.id,
    serviceName: it.service.name,
    ownerMismatch: it.appt.customerId !== it.vehicle.ownerId,
  };
}
