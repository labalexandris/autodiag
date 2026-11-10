import type { Vehicle, VehicleReminder } from "@/lib/types";
import { reminderLabel } from "@/lib/labels";
import { daysUntil, fmtDate, fmtNum, relativeDays, cn } from "@/lib/format";

/** Τι έρχεται για το όχημα: λάδια σε km, ΚΤΕΟ / A/C / μπαταρία σε ημερομηνία. */
export function Upcoming({ vehicle, reminders }: { vehicle: Vehicle; reminders: VehicleReminder[] }) {
  const sorted = [...reminders].sort((a, b) => score(a, vehicle) - score(b, vehicle));
  return (
    <ul className="divide-y divide-line-2">
      {sorted.map((r) => {
        if (r.dueKm && r.lastKm) {
          const span = r.dueKm - r.lastKm;
          const used = Math.min(1, Math.max(0, (vehicle.km - r.lastKm) / span));
          const left = r.dueKm - vehicle.km;
          const tone = left < 0 ? "var(--fuse-red)" : left < 1500 ? "var(--fuse-yellow)" : "var(--fuse-green)";
          return (
            <li key={r.id} className="px-5 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14.5px] font-medium">{reminderLabel[r.kind]}</span>
                <span className={cn("text-[13px] tnum", left < 0 ? "font-medium text-fuse-red" : "text-ink-2")}>
                  {left < 0 ? `πέρασε κατά ${fmtNum(-left)} km` : `σε ${fmtNum(left)} km`}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-2" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(used * 100)} aria-label={`${reminderLabel[r.kind]}: ${Math.round(used * 100)}%`}>
                <div className="h-full rounded-full" style={{ width: `${used * 100}%`, background: tone }} />
              </div>
              <p className="mt-1.5 text-[12px] text-ink-3 tnum">
                Τελευταία στα {fmtNum(r.lastKm)} km, επόμενη στα {fmtNum(r.dueKm)} km
              </p>
            </li>
          );
        }
        if (r.dueDate) {
          const d = daysUntil(r.dueDate);
          return (
            <li key={r.id} className="flex items-baseline justify-between gap-3 px-5 py-3.5">
              <span className="text-[14.5px] font-medium">{reminderLabel[r.kind]}</span>
              <span className="text-right">
                <span className={cn("block text-[13px] tnum", d < 0 ? "font-medium text-fuse-red" : d < 30 ? "font-medium text-[#8a6700]" : "text-ink-2")}>
                  {d < 0 ? `έληξε ${relativeDays(r.dueDate)}` : relativeDays(r.dueDate)}
                </span>
                <span className="block text-[12px] text-ink-3 tnum">{fmtDate(r.dueDate)}</span>
              </span>
            </li>
          );
        }
        return null;
      })}
    </ul>
  );
}

function score(r: VehicleReminder, v: Vehicle) {
  if (r.dueKm) return (r.dueKm - v.km) / 40;
  if (r.dueDate) return daysUntil(r.dueDate);
  return 9999;
}
