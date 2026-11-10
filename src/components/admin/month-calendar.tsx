"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { AppointmentStatus } from "@/lib/types";
import type { SheetItem } from "@/lib/sheet-item";
import { statusMeta } from "@/lib/labels";
import { cn } from "@/lib/format";
import { Plate } from "@/components/plate";
import { Fuse } from "@/components/status";
import { AppointmentCard } from "@/components/admin/appointment-sheet";

/** Μία μέρα του πλέγματος. Όλα έρχονται έτοιμα από τον server (ώρα Ελλάδας). */
export interface MonthDay {
  /** YYYY-MM-DD */
  key: string;
  num: number;
  inMonth: boolean;
  isToday: boolean;
  closed: boolean;
  /** «Τρίτη 11 Νοεμβρίου» */
  label: string;
}

export interface MonthItem {
  dayKey: string;
  time: string;
  status: AppointmentStatus;
  item: SheetItem;
}

const weekdays = ["Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ", "Κυρ"];

export function MonthCalendar({
  days,
  items,
  todayKey,
  initialDay,
  title,
  range,
  prevHref,
  nextHref,
  todayHref,
  todayMonth,
  todayNum,
  newButton,
  monthQuery,
}: {
  days: MonthDay[];
  items: MonthItem[];
  todayKey: string;
  initialDay: string;
  title: string;
  range: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  todayMonth: string;
  todayNum: number;
  newButton: React.ReactNode;
  /** π.χ. "m=2026-11&", για να μένει ο μήνας όταν ανοίγει νέο ραντεβού */
  monthQuery: string;
}) {
  const [selected, setSelected] = useState(initialDay);
  const byDay = new Map<string, MonthItem[]>();
  for (const it of items) byDay.set(it.dayKey, [...(byDay.get(it.dayKey) ?? []), it]);
  const selectedDay = days.find((d) => d.key === selected);
  const selectedItems = byDay.get(selected) ?? [];

  return (
    <div className="space-y-5">
      {/* Κεφαλίδα */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden w-16 flex-col items-center rounded-lg border border-line bg-sunk p-0.5 md:flex">
            <span className="py-0.5 text-[11px] font-medium uppercase text-ink-3">{todayMonth}</span>
            <span className="flex w-full justify-center rounded-md border border-line bg-panel py-0.5 text-[18px] font-bold tnum">{todayNum}</span>
          </div>
          <div>
            <h1 className="text-[24px] font-semibold capitalize leading-tight">{title}</h1>
            <p className="text-[14px] text-ink-2">{range}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex flex-1 -space-x-px md:flex-none">
            <Link href={prevHref} className="btn btn-outline w-10 rounded-r-none px-0" aria-label="Προηγούμενος μήνας">
              <ChevronLeft size={19} strokeWidth={2.2} />
            </Link>
            <Link href={todayHref} onClick={() => setSelected(todayKey)} className="btn btn-outline flex-1 rounded-none md:flex-none">
              Σήμερα
            </Link>
            <Link href={nextHref} className="btn btn-outline w-10 rounded-l-none px-0" aria-label="Επόμενος μήνας">
              <ChevronRight size={19} strokeWidth={2.2} />
            </Link>
          </div>
          {newButton}
        </div>
      </div>

      {/* Πλέγμα */}
      <div className="panel overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line-2 text-center text-[12px] font-semibold text-ink-2">
          {weekdays.map((w, i) => (
            <div key={w} className={cn("py-2.5", i < 6 && "border-r border-line-2")}>
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const list = byDay.get(d.key) ?? [];
            const isSel = d.key === selected;
            return (
              <div
                key={d.key}
                onClick={() => setSelected(d.key)}
                className={cn(
                  "group relative flex min-h-14 cursor-pointer flex-col border-line-2 lg:min-h-32",
                  i % 7 !== 6 && "border-r",
                  i < days.length - 7 && "border-b",
                  !d.inMonth && "bg-sunk/70",
                  d.closed && d.inMonth && "bg-sunk/40",
                  isSel ? "bg-brand-soft/50" : "hover:bg-sunk",
                )}
              >
                <div className="flex items-center justify-end p-1.5 lg:justify-between lg:p-2">
                  <button
                    type="button"
                    className={cn(
                      "grid size-7 place-items-center rounded-full text-[12.5px] tnum",
                      !d.inMonth && "text-ink-3",
                      d.isToday && !isSel && "font-semibold text-brand",
                      isSel && (d.isToday ? "bg-brand font-semibold text-white" : "bg-ink font-semibold text-white"),
                    )}
                    aria-label={d.label}
                    aria-pressed={isSel}
                  >
                    {d.num}
                  </button>
                  {list.length > 0 && <span className="hidden text-[11.5px] text-ink-3 lg:inline">{list.length}</span>}
                </div>

                {/* Desktop: τα πρώτα ραντεβού της μέρας */}
                <div className="hidden flex-1 space-y-1 px-1.5 pb-1.5 lg:block">
                  {list.slice(0, 3).map((it) => (
                    <AppointmentCard
                      key={it.item.id}
                      item={it.item}
                      title={`${it.time} ${it.item.serviceName}, ${it.item.customerName} (${statusMeta[it.status].label})`}
                      className="flex w-full items-center gap-1.5 rounded-md border border-line-2 bg-panel px-1.5 py-1 text-left text-[11.5px] leading-tight hover:border-line hover:shadow-sm"
                    >
                      <span className="h-3.5 w-[3px] shrink-0 rounded-full" style={{ background: statusMeta[it.status].fuse }} />
                      <span className="font-medium tnum">{it.time}</span>
                      <span className="truncate text-ink-2">{it.item.serviceName}</span>
                    </AppointmentCard>
                  ))}
                  {list.length > 3 && <p className="px-1 text-[11.5px] text-ink-3">+ {list.length - 3} ακόμα</p>}
                </div>

                {/* Κινητό: κουκκίδες */}
                <div className="mt-auto flex justify-center gap-0.5 px-1 pb-1.5 lg:hidden">
                  {list.slice(0, 5).map((it) => (
                    <span key={it.item.id} className="size-1.5 rounded-full" style={{ background: statusMeta[it.status].fuse }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Τα ραντεβού της επιλεγμένης μέρας */}
      {selectedDay && (
        <section>
          <h2 className="mb-2 flex items-baseline gap-2 text-[16px] font-semibold first-letter:uppercase">
            {selectedDay.label}
            <span className="text-[13px] font-normal text-ink-3">
              {selectedItems.length ? `${selectedItems.length} ραντεβού` : selectedDay.closed ? "κλειστά" : "κανένα ραντεβού"}
            </span>
            {!selectedDay.closed && (
              <Link href={`?${monthQuery}new=1&at=${selectedDay.key}T09:00`} scroll={false} className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-brand">
                <Plus size={14} /> Ραντεβού
              </Link>
            )}
          </h2>
          {selectedItems.length > 0 && (
            <ul className="panel divide-y divide-line-2 overflow-hidden">
              {selectedItems.map((it) => (
                <li key={it.item.id}>
                  <AppointmentCard item={it.item} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunk">
                    <span className="w-11 text-[14px] font-semibold tnum">{it.time}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-medium">{it.item.serviceName}</span>
                      <span className="block truncate text-[12.5px] text-ink-2">
                        {it.item.customerName}, {it.item.bayName}
                      </span>
                    </span>
                    <Plate plate={it.item.plate} size="xs" />
                    <Fuse color={statusMeta[it.status].fuse} />
                  </AppointmentCard>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
