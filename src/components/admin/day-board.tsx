import { Check } from "lucide-react";
import type { Appointment, Bay, Customer, Service, Vehicle } from "@/lib/types";
import { statusMeta } from "@/lib/labels";
import { toSheetItem } from "@/lib/sheet-item";
import { fmtTime, cn } from "@/lib/format";
import { Plate } from "@/components/plate";
import { Fuse, statusCard } from "@/components/status";
import { AppointmentCard } from "./appointment-sheet";
import { NowLine } from "./now-line";

export interface BoardItem {
  appt: Appointment;
  vehicle: Vehicle;
  customer: Customer;
  service: Service;
}

const LABEL_PX = 112;

/**
 * Πίνακας ημέρας: γραμμή ανά θέση εργασίας, οριζόντιος άξονας ώρας.
 * `start` / `end` είναι οι ώρες του ωραρίου (από το shop.hours).
 */
export function DayBoard({ bays, items, start, end }: { bays: Bay[]; items: BoardItem[]; start: number; end: number }) {
  const span = (end - start) * 60;
  const hours = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const fromStart = (iso: string) => {
    const d = new Date(iso);
    return (d.getHours() - start) * 60 + d.getMinutes();
  };

  return (
    <>
      {/* Desktop / tablet */}
      <div className="panel hidden overflow-x-auto md:block">
        <div className="relative min-w-[960px]">
          <div className="grid border-b border-line-2 text-[12px] text-ink-3" style={{ gridTemplateColumns: `${LABEL_PX}px 1fr` }}>
            <div />
            <div className="relative h-8">
              {hours.map((h) => (
                <span key={h} className="absolute top-2 -translate-x-1/2 tnum" style={{ left: `${((h - start) * 60 * 100) / span}%` }}>
                  {h === start || h === end ? "" : `${String(h).padStart(2, "0")}:00`}
                </span>
              ))}
            </div>
          </div>
          {bays.map((bay, i) => (
            <div key={bay.id} className={cn("grid", i > 0 && "border-t border-line-2")} style={{ gridTemplateColumns: `${LABEL_PX}px 1fr` }}>
              <div className="flex items-center px-4 text-[14px] font-medium text-ink-2">{bay.name}</div>
              <div className="relative h-[92px]">
                {hours.slice(1, -1).map((h) => (
                  <span key={h} className="absolute inset-y-0 w-px bg-line-2" style={{ left: `${((h - start) * 60 * 100) / span}%` }} />
                ))}
                {items
                  .filter((it) => it.appt.bayId === bay.id)
                  .map((it) => {
                    const l = Math.max(0, fromStart(it.appt.start));
                    const w = Math.min(span - l, fromStart(it.appt.end) - l);
                    if (w <= 0) return null;
                    const m = statusMeta[it.appt.status];
                    const digits = it.vehicle.plate.replace(/\D/g, "");
                    return (
                      <AppointmentCard
                        key={it.appt.id}
                        item={toSheetItem(it, bays)}
                        className={cn(
                          "@container absolute inset-y-2 overflow-hidden rounded-lg border text-left transition-shadow hover:z-[5] hover:shadow-[0_6px_16px_-8px_rgba(30,34,38,0.35)]",
                          statusCard[it.appt.status],
                        )}
                        style={{ left: `calc(${(l * 100) / span}% + 2px)`, width: `calc(${(w * 100) / span}% - 4px)` }}
                        title={`${fmtTime(it.appt.start)}–${fmtTime(it.appt.end)}, ${it.service.name}, ${it.customer.name} (${m.label})`}
                      >
                        <span className="absolute inset-y-0 left-0 w-[4px]" style={{ background: m.fuse }} />
                        {/*
                          Το περιεχόμενο προσαρμόζεται στο πλάτος της κάρτας (container queries):
                          στενή = ώρα + τα 4 νούμερα, μεσαία = πινακίδα + εργασία, φαρδιά = όλα.
                        */}
                        <span className="flex h-full flex-col justify-between py-2 pl-2.5 pr-0.5 @[88px]:pr-1.5 @[136px]:pr-2.5">
                          <span className="flex items-center gap-2">
                            <span className="hidden @[88px]:inline-flex">
                              <Plate plate={it.vehicle.plate} size="xs" />
                            </span>
                            <span className="font-cond text-[13.5px] font-semibold leading-none @[88px]:hidden">{digits}</span>
                            <span className="hidden truncate text-[12px] text-ink-2 tnum @[136px]:inline">{fmtTime(it.appt.start)}</span>
                            {it.appt.status === "done" && <Check size={14} strokeWidth={2.6} className="ml-auto hidden shrink-0 text-fuse-green @[136px]:block" aria-hidden />}
                          </span>
                          <span className="hidden truncate text-[13px] font-medium leading-tight @[88px]:block">{it.service.name}</span>
                          <span className="hidden truncate text-[12px] text-ink-2 @[136px]:block">{it.customer.name}</span>
                          <span className="text-[11.5px] leading-none text-ink-2 tnum @[136px]:hidden">{fmtTime(it.appt.start)}</span>
                        </span>
                      </AppointmentCard>
                    );
                  })}
              </div>
            </div>
          ))}
          <NowLine start={start} end={end} offsetPx={LABEL_PX} />
        </div>
      </div>

      {/* Mobile: λίστα με τη σειρά της ώρας */}
      <ol className="panel divide-y divide-line-2 overflow-hidden md:hidden">
        {items.length === 0 && <li className="p-5 text-[15px] text-ink-2">Δεν υπάρχουν ραντεβού σήμερα.</li>}
        {items.map((it) => {
          const m = statusMeta[it.appt.status];
          return (
            <li key={it.appt.id} className={cn(it.appt.status === "in_progress" && "bg-[#fdf1e8]")}>
              <AppointmentCard item={toSheetItem(it, bays)} className="flex w-full items-start gap-3 px-4 py-3.5 text-left">
                <span className={cn("w-12 pt-0.5 text-[15px] font-semibold tnum", it.appt.status === "done" && "text-ink-3")}>{fmtTime(it.appt.start)}</span>
                <span className="min-w-0 flex-1">
                  <Plate plate={it.vehicle.plate} size="sm" />
                  <span className="mt-1.5 block truncate text-[15px] font-medium">{it.service.name}</span>
                  <span className="block truncate text-[13px] text-ink-2">
                    {it.customer.name}, {it.vehicle.make} {it.vehicle.model}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1 pt-0.5 text-[12px] text-ink-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Fuse color={m.fuse} /> {m.label}
                  </span>
                  <span className="text-ink-3">{bays.find((b) => b.id === it.appt.bayId)?.name}</span>
                </span>
              </AppointmentCard>
            </li>
          );
        })}
      </ol>
    </>
  );
}
