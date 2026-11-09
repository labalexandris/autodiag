import Link from "next/link";
import type { Appointment, Bay, Customer, Service, Vehicle } from "@/lib/types";
import { statusMeta } from "@/lib/labels";
import { fmtTime, cn } from "@/lib/format";
import { normalizePlate } from "@/lib/plate";
import { Plate } from "@/components/plate";
import { Fuse } from "@/components/status";
import { NowLine } from "./now-line";

export interface BoardItem {
  appt: Appointment;
  vehicle: Vehicle;
  customer: Customer;
  service: Service;
}

const START = 8;
const END = 17;
const SPAN = (END - START) * 60;

function minutesFromStart(iso: string) {
  const d = new Date(iso);
  return (d.getHours() - START) * 60 + d.getMinutes();
}

/** Πίνακας ημέρας: γραμμή ανά θέση εργασίας, οριζόντιος άξονας ώρας. */
export function DayBoard({ bays, items }: { bays: Bay[]; items: BoardItem[] }) {
  const hours = Array.from({ length: END - START + 1 }, (_, i) => START + i);
  return (
    <>
      {/* Desktop / tablet */}
      <div className="panel hidden overflow-hidden md:block">
        <div className="relative">
          <div className="grid grid-cols-[112px_1fr] border-b border-line-2 text-[12px] text-ink-3">
            <div />
            <div className="relative h-8">
              {hours.map((h) => (
                <span
                  key={h}
                  className="absolute top-2 -translate-x-1/2 tnum"
                  style={{ left: `${((h - START) * 60 * 100) / SPAN}%` }}
                >
                  {h === START || h === END ? "" : `${String(h).padStart(2, "0")}:00`}
                </span>
              ))}
            </div>
          </div>
          {bays.map((bay, i) => (
            <div key={bay.id} className={cn("grid grid-cols-[112px_1fr]", i > 0 && "border-t border-line-2")}>
              <div className="flex items-center px-4 text-[14px] font-medium text-ink-2">{bay.name}</div>
              <div className="relative h-[92px]">
                {hours.slice(1, -1).map((h) => (
                  <span
                    key={h}
                    className="absolute inset-y-0 w-px bg-line-2"
                    style={{ left: `${((h - START) * 60 * 100) / SPAN}%` }}
                  />
                ))}
                {items
                  .filter((it) => it.appt.bayId === bay.id)
                  .map((it) => {
                    const l = Math.max(0, minutesFromStart(it.appt.start));
                    const w = Math.min(SPAN - l, minutesFromStart(it.appt.end) - l);
                    const m = statusMeta[it.appt.status];
                    return (
                      <Link
                        key={it.appt.id}
                        href={`/admin/vehicles/${normalizePlate(it.vehicle.plate)}`}
                        className={cn(
                          "group absolute inset-y-2 flex flex-col justify-between overflow-hidden rounded-lg border bg-panel px-2.5 py-2 transition-[border-color,box-shadow] hover:shadow-[0_6px_16px_-8px_rgba(30,34,38,0.35)]",
                          it.appt.status === "done" ? "border-line-2 opacity-60 hover:opacity-100" : "border-line",
                          it.appt.status === "in_progress" && "border-fuse-orange/50 bg-[#fdf1e8]",
                        )}
                        style={{ left: `calc(${(l * 100) / SPAN}% + 2px)`, width: `calc(${(w * 100) / SPAN}% - 4px)` }}
                        title={`${fmtTime(it.appt.start)}–${fmtTime(it.appt.end)}, ${it.service.name}, ${it.customer.name}`}
                      >
                        <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: m.fuse }} />
                        <span className="flex items-center gap-2">
                          <Plate plate={it.vehicle.plate} size="xs" />
                          <span className="truncate text-[12px] text-ink-3 tnum">{fmtTime(it.appt.start)}</span>
                        </span>
                        <span className="truncate text-[13px] font-medium leading-tight">{it.service.name}</span>
                        <span className="truncate text-[12px] text-ink-3">{it.customer.name}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
          <NowLine start={START} end={END} offsetPx={112} />
        </div>
      </div>

      {/* Mobile: λίστα με τη σειρά της ώρας */}
      <ol className="panel divide-y divide-line-2 md:hidden">
        {items.length === 0 && <li className="p-5 text-[15px] text-ink-2">Δεν υπάρχουν ραντεβού σήμερα.</li>}
        {items.map((it) => {
          const m = statusMeta[it.appt.status];
          return (
            <li key={it.appt.id}>
              <Link
                href={`/admin/vehicles/${normalizePlate(it.vehicle.plate)}`}
                className={cn("flex items-start gap-3 px-4 py-3.5", it.appt.status === "done" && "opacity-55")}
              >
                <span className="w-12 pt-0.5 text-[15px] font-semibold tnum">{fmtTime(it.appt.start)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <Plate plate={it.vehicle.plate} size="sm" />
                  </span>
                  <span className="mt-1.5 block truncate text-[15px] font-medium">{it.service.name}</span>
                  <span className="block truncate text-[13px] text-ink-3">
                    {it.customer.name}, {it.vehicle.make} {it.vehicle.model}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1 pt-1 text-[12px] text-ink-3">
                  <Fuse color={m.fuse} />
                  <span>{bayShort(it.appt.bayId)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}

const bayShort = (id: string) => ({ b1: "Θ1", b2: "Θ2", b3: "Διαγν." })[id] ?? id;
