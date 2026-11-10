import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { AppointmentStatus } from "@/lib/types";
import type { SheetItem } from "@/lib/sheet-item";
import { statusMeta } from "@/lib/labels";
import { cn } from "@/lib/format";
import { Plate } from "@/components/plate";
import { Fuse } from "@/components/status";
import { AppointmentCard } from "@/components/admin/appointment-sheet";
import { ScrollToToday } from "@/components/admin/scroll-to-today";

export interface CalEntry {
  time: string;
  status: AppointmentStatus;
  item: SheetItem;
}

/** Μία μέρα του πλέγματος με όλα της τα ραντεβού. Όλα έτοιμα από τον server (ώρα Ελλάδας). */
export interface CalDay {
  key: string;
  num: number;
  label: string;
  inMonth: boolean;
  isToday: boolean;
  closed: boolean;
  newHref: string;
  entries: CalEntry[];
}

const weekdays = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];

/**
 * Μεγάλο μηνιαίο ημερολόγιο: κάθε μέρα δείχνει όλα τα ραντεβού της (η
 * εβδομάδα ψηλώνει όσο χρειάζεται). Στο κινητό γίνεται λίστα ανά μέρα.
 */
export function MonthCalendar({
  days,
  closedCols,
  title,
  summary,
  prevHref,
  nextHref,
  todayHref,
  action,
}: {
  days: CalDay[];
  /** Ποιες στήλες (0 = Δευτέρα) είναι κλειστές μέρες, για να στενέψουν */
  closedCols: number[];
  title: string;
  summary: React.ReactNode;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  action: React.ReactNode;
}) {
  const cols = weekdays.map((_, i) => (closedCols.includes(i) ? "minmax(0,0.3fr)" : "minmax(0,1fr)")).join(" ");
  const weeks = Array.from({ length: days.length / 7 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold capitalize leading-tight">{title}</h1>
          <p className="mt-1 text-[14px] text-ink-2">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex flex-1 -space-x-px md:flex-none">
            <Link href={prevHref} className="btn btn-outline w-10 rounded-r-none px-0" aria-label="Προηγούμενος μήνας">
              <ChevronLeft size={22} strokeWidth={2.5} />
            </Link>
            <Link href={todayHref} className="btn btn-outline flex-1 rounded-none md:flex-none">
              Σήμερα
            </Link>
            <Link href={nextHref} className="btn btn-outline w-10 rounded-l-none px-0" aria-label="Επόμενος μήνας">
              <ChevronRight size={22} strokeWidth={2.5} />
            </Link>
          </div>
          {action}
        </div>
      </div>

      {/* Desktop / tablet: πλέγμα με όλα τα ραντεβού */}
      <div className="panel hidden overflow-hidden md:block">
        <div className="grid border-b border-line-2 text-[12.5px] font-semibold text-ink-2" style={{ gridTemplateColumns: cols }}>
          {weekdays.map((w, i) => (
            <div key={w} className={cn("truncate px-2.5 py-2", i < 6 && "border-r border-line-2", closedCols.includes(i) && "text-ink-3")}>
              <span className="lg:hidden">{w.slice(0, 3)}</span>
              <span className="hidden lg:inline">{w}</span>
            </div>
          ))}
        </div>
        {weeks.map((week, w) => (
          <div key={week[0].key} className={cn("grid", w > 0 && "border-t border-line-2")} style={{ gridTemplateColumns: cols }}>
            {week.map((d, i) => (
              <div
                key={d.key}
                className={cn(
                  "group flex min-h-[110px] min-w-0 flex-col gap-1 p-1.5",
                  i < 6 && "border-r border-line-2",
                  !d.inMonth && "bg-sunk/70",
                  d.closed && d.inMonth && "bg-sunk/40",
                  d.isToday && "bg-brand-soft/40",
                )}
              >
                <div className="mb-0.5 flex items-center gap-1.5 px-1">
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-[12.5px] tnum",
                      !d.inMonth && "text-ink-3",
                      d.isToday && "bg-brand font-semibold text-white",
                    )}
                  >
                    {d.num}
                  </span>
                  {d.entries.length > 0 && <span className="text-[11.5px] text-ink-3 tnum">{d.entries.length}</span>}
                  {!d.closed && (
                    <Link
                      href={d.newHref}
                      scroll={false}
                      className="ml-auto grid size-6 place-items-center rounded-md text-brand opacity-0 transition-opacity hover:bg-brand-soft focus-visible:opacity-100 group-hover:opacity-100"
                      aria-label={`Νέο ραντεβού, ${d.label}`}
                    >
                      <Plus size={15} />
                    </Link>
                  )}
                </div>
                {d.entries.map((e) => {
                  const m = statusMeta[e.status];
                  return (
                    <AppointmentCard
                      key={e.item.id}
                      item={e.item}
                      title={`${e.time} ${e.item.serviceName}\n${e.item.customerName}, ${e.item.plate}\n${e.item.bayName} · ${m.label}`}
                      className={cn(
                        "relative block w-full min-w-0 overflow-hidden rounded-md border border-line-2 bg-panel py-1 pl-2.5 pr-1.5 text-left text-[12px] leading-[1.3] hover:border-line hover:shadow-[0_2px_8px_-2px_rgba(30,34,38,0.2)]",
                        e.status === "pending" && "border-[#efd77a] bg-signal-soft",
                        (e.status === "done" || e.status === "no_show") && "bg-sunk text-ink-3",
                      )}
                    >
                      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: m.fuse }} />
                      <span className="flex min-w-0 items-center justify-between gap-1">
                        <span className="font-semibold tnum">{e.time}</span>
                        <Plate plate={e.item.plate} size="xs" className="shrink-0" />
                      </span>
                      <span className={cn("mt-0.5 block truncate font-medium", e.status === "no_show" && "line-through")}>{e.item.serviceName}</span>
                      <span className="block truncate">{e.item.customerName}</span>
                      <span className="block truncate text-ink-3">{e.item.vehicle}</span>
                    </AppointmentCard>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Κινητό: η ίδια μέρα-μέρα, σε λίστα, από τη σημερινή */}
      <div className="space-y-5 md:hidden">
        <ScrollToToday />
        {days
          .filter((d) => d.inMonth && (!d.closed || d.entries.length))
          .map((d) => (
            <section key={d.key} id={d.isToday ? "today" : undefined} className="scroll-mt-20">
              <h2 className={cn("mb-2 flex items-baseline gap-2 text-[15px] font-semibold first-letter:uppercase", d.isToday && "text-brand")}>
                {d.label}
                <span className="text-[13px] font-normal text-ink-3">{d.entries.length ? `${d.entries.length} ραντεβού` : "ελεύθερη"}</span>
                {!d.closed && (
                  <Link href={d.newHref} scroll={false} className="ml-auto text-[13px] font-medium text-brand">
                    + Ραντεβού
                  </Link>
                )}
              </h2>
              {d.entries.length > 0 && (
                <ul className="panel divide-y divide-line-2 overflow-hidden">
                  {d.entries.map((e) => (
                    <li key={e.item.id} className={cn(e.status === "pending" && "bg-signal-soft/60")}>
                      <AppointmentCard item={e.item} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                        <span className={cn("w-11 text-[14px] font-semibold tnum", (e.status === "done" || e.status === "no_show") && "text-ink-3")}>{e.time}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px] font-medium">{e.item.serviceName}</span>
                          <span className="block truncate text-[12.5px] text-ink-2">{e.item.customerName}</span>
                        </span>
                        <Plate plate={e.item.plate} size="xs" />
                        <Fuse color={statusMeta[e.status].fuse} />
                      </AppointmentCard>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
      </div>
    </div>
  );
}
