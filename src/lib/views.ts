import "server-only";
import * as data from "./data";
import { reminderLabel } from "./labels";
import { normalizePlate } from "./plate";
import { daysUntil, fmtDate, fmtNum, relativeDays } from "./format";
import type { SearchEntry } from "@/components/plate-search";
import type { DueItem } from "@/components/admin/due-list";

/** Έτοιμα «σχήματα» για τις σελίδες, πάνω από το data layer. */

export async function getSearchEntries(): Promise<SearchEntry[]> {
  const [vehicles, customers] = await Promise.all([data.getVehicles(), data.getCustomers()]);
  return vehicles.map((v) => {
    const c = customers.find((x) => x.id === v.ownerId)!;
    return { plate: v.plate, vehicle: `${v.make} ${v.model}`, owner: c.name, phone: c.phone };
  });
}

export async function getDueSoon(limitDays = 30): Promise<DueItem[]> {
  const [reminders, vehicles, customers] = await Promise.all([
    data.getAllReminders(),
    data.getVehicles(),
    data.getCustomers(),
  ]);
  const out: (DueItem & { sort: number })[] = [];
  for (const r of reminders) {
    const v = vehicles.find((x) => x.id === r.vehicleId)!;
    const owner = customers.find((c) => c.id === v.ownerId)!.name;
    if (r.dueDate) {
      const d = daysUntil(r.dueDate);
      if (d <= limitDays && d >= -45) {
        out.push({
          id: r.id,
          plate: v.plate,
          plateKey: normalizePlate(v.plate),
          label: reminderLabel[r.kind],
          detail: d < 0 ? `έληξε ${relativeDays(r.dueDate)}` : `λήγει ${relativeDays(r.dueDate)}, ${fmtDate(r.dueDate)}`,
          owner,
          overdue: d < 0,
          sort: d,
        });
      }
    } else if (r.dueKm) {
      const left = r.dueKm - v.km;
      if (left < 1500) {
        out.push({
          id: r.id,
          plate: v.plate,
          plateKey: normalizePlate(v.plate),
          label: reminderLabel[r.kind],
          detail: left < 0 ? `πέρασε κατά ${fmtNum(-left)} km` : `σε ~${fmtNum(left)} km`,
          owner,
          overdue: left < 0,
          sort: left / 50,
        });
      }
    }
  }
  out.sort((a, b) => a.sort - b.sort);
  return out.map((o) => ({ id: o.id, plate: o.plate, plateKey: o.plateKey, label: o.label, detail: o.detail, owner: o.owner, overdue: o.overdue }));
}

export async function hydrateAppointments(list: Awaited<ReturnType<typeof data.getAppointments>>) {
  const [vehicles, customers, services] = await Promise.all([
    data.getVehicles(),
    data.getCustomers(),
    data.getServices(),
  ]);
  return list.map((appt) => ({
    appt,
    vehicle: vehicles.find((v) => v.id === appt.vehicleId)!,
    customer: customers.find((c) => c.id === appt.customerId)!,
    service: services.find((s) => s.id === appt.serviceId)!,
  }));
}
