import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAppointments, getBays, getServices } from "@/lib/data";
import { getSearchEntries, hydrateAppointments } from "@/lib/views";
import { statusMeta } from "@/lib/labels";
import { fmtDayNum, fmtDayShort, fmtMonthShort, fmtTime, cn } from "@/lib/format";
import { normalizePlate } from "@/lib/plate";
import { Plate } from "@/components/plate";
import { Fuse } from "@/components/status";
import { NewAppointment } from "@/components/admin/new-appointment";

export const metadata = { title: "Ημερολόγιο" };
export const dynamic = "force-dynamic";

const START = 8;
const END = 17;
const HOUR_PX = 64;

function mondayOf(offsetWeeks: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const wd = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - wd + offsetWeeks * 7);
  return d;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const w = Number((await searchParams).w ?? 0) || 0;
  const monday = mondayOf(w);
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
  const saturday = new Date(monday);
  saturday.setDate(saturday.getDate() + 5);

  const [bays, services, entries, items] = await Promise.all([
    getBays(),
    getServices(),
    getSearchEntries(),
    getAppointments({ from: monday, to: saturday }).then(hydrateAppointments),
  ]);
  const visible = items.filter((i) => i.appt.status !== "cancelled");
  const todayKey = new Date().toDateString();
  const hours = Array.from({ length: END - START }, (_, i) => START + i);
  const pending = visible.filter((v) => v.appt.status === "pending").length;

  const rangeLabel = `${fmtDayNum(days[0])} ${fmtMonthShort(days[0])} – ${fmtDayNum(days[4])} ${fmtMonthShort(days[4])}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cond text-[32px] font-semibold leading-none sm:text-[38px]">Ημερολόγιο</h1>
          <p className="mt-2.5 text-[15px] text-ink-2">
            {visible.length} ραντεβού αυτή την εβδομάδα{pending > 0 && <>, {pending} περιμένουν επιβεβαίωση</>}.
          </p>
        </div>
        <Suspense>
          <NewAppointment services={services} entries={entries} />
        </Suspense>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link href={`?w=${w - 1}`} className="btn btn-outline btn-sm w-9 px-0" aria-label="Προηγούμενη εβδομάδα">
            <ChevronLeft size={17} />
          </Link>
          <Link href={`?w=${w + 1}`} className="btn btn-outline btn-sm w-9 px-0" aria-label="Επόμενη εβδομάδα">
            <ChevronRight size={17} />
          </Link>
          {w !== 0 && (
            <Link href="?w=0" className="btn btn-ghost btn-sm">
              Σήμερα
            </Link>
          )}
          <span className="ml-2 text-[16px] font-medium tnum">{rangeLabel}</span>
        </div>
        <Link href="/admin/settings#calendar" className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink">
          <span className="size-2 rounded-full bg-fuse-green" />
          Συγχρονίζεται με Google Calendar
        </Link>
      </div>

      {/* Desktop εβδομάδα */}
      <div className="panel hidden overflow-hidden md:block">
        <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-line-2">
          <div />
          {days.map((d) => {
            const isToday = d.toDateString() === todayKey;
            return (
              <div key={d.toISOString()} className="flex items-baseline gap-2 border-l border-line-2 px-3 py-2.5">
                <span className={cn("text-[13px] capitalize", isToday ? "font-medium text-brand" : "text-ink-3")}>{fmtDayShort(d)}</span>
                <span
                  className={cn(
                    "font-cond text-[20px] font-semibold tnum",
                    isToday && "grid size-8 place-items-center rounded-full bg-brand text-[17px] text-white",
                  )}
                >
                  {fmtDayNum(d)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[56px_repeat(5,1fr)]">
          <div className="relative" style={{ height: (END - START) * HOUR_PX }}>
            {hours.map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-[12px] text-ink-3 tnum" style={{ top: (h - START) * HOUR_PX }}>
                {h === START ? "" : `${h}:00`}
              </span>
            ))}
          </div>
          {days.map((d) => {
            const dayItems = visible.filter((i) => new Date(i.appt.start).toDateString() === d.toDateString());
            const isToday = d.toDateString() === todayKey;
            return (
              <div key={d.toISOString()} className={cn("relative border-l border-line-2", isToday && "bg-brand-soft/35")} style={{ height: (END - START) * HOUR_PX }}>
                {hours.slice(1).map((h) => (
                  <span key={h} className="absolute inset-x-0 h-px bg-line-2" style={{ top: (h - START) * HOUR_PX }} />
                ))}
                {dayItems.map((it) => {
                  const s = new Date(it.appt.start);
                  const e = new Date(it.appt.end);
                  const top = ((s.getHours() - START) * 60 + s.getMinutes()) * (HOUR_PX / 60);
                  const height = Math.max(26, ((e.getTime() - s.getTime()) / 60000) * (HOUR_PX / 60) - 3);
                  const lane = Math.max(0, bays.findIndex((b) => b.id === it.appt.bayId));
                  const m = statusMeta[it.appt.status];
                  const short = height < 50;
                  return (
                    <Link
                      key={it.appt.id}
                      href={`/admin/vehicles/${normalizePlate(it.vehicle.plate)}`}
                      title={`${fmtTime(it.appt.start)} ${it.service.name}, ${it.customer.name} (${m.label})`}
                      className={cn(
                        "absolute overflow-hidden rounded-md border bg-panel px-1.5 py-1 text-[12px] leading-tight transition-shadow hover:z-10 hover:shadow-[0_6px_16px_-8px_rgba(30,34,38,0.4)]",
                        it.appt.status === "pending" ? "border-dashed border-fuse-yellow bg-signal-soft" : "border-line",
                        it.appt.status === "done" && "opacity-55",
                      )}
                      style={{
                        top: top + 1,
                        height,
                        left: `calc(${(lane * 100) / bays.length}% + 2px)`,
                        width: `calc(${100 / bays.length}% - 4px)`,
                      }}
                    >
                      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: m.fuse }} />
                      <span className="block truncate pl-0.5 font-medium tnum">{fmtTime(it.appt.start)}</span>
                      {!short && <span className="block truncate pl-0.5 text-ink-2">{it.service.name}</span>}
                      {height > 70 && <span className="mt-0.5 block truncate pl-0.5 font-cond text-[11.5px] tracking-[0.04em] text-ink-3">{it.vehicle.plate}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <p className="hidden text-[12px] text-ink-3 md:block">Κάθε ημέρα χωρίζεται σε στήλες ανά θέση: {bays.map((b) => b.name).join(", ")}.</p>

      {/* Mobile: λίστα ανά ημέρα */}
      <div className="space-y-5 md:hidden">
        {days.map((d) => {
          const dayItems = visible.filter((i) => new Date(i.appt.start).toDateString() === d.toDateString());
          const isToday = d.toDateString() === todayKey;
          return (
            <section key={d.toISOString()}>
              <h2 className={cn("mb-2 flex items-baseline gap-2 text-[15px] font-semibold capitalize", isToday && "text-brand")}>
                {fmtDayShort(d)} {fmtDayNum(d)}
                <span className="text-[13px] font-normal normal-case text-ink-3">{dayItems.length ? `${dayItems.length} ραντεβού` : "ελεύθερη"}</span>
              </h2>
              {dayItems.length > 0 && (
                <ul className="panel divide-y divide-line-2">
                  {dayItems.map((it) => (
                    <li key={it.appt.id}>
                      <Link href={`/admin/vehicles/${normalizePlate(it.vehicle.plate)}`} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-11 text-[14px] font-semibold tnum">{fmtTime(it.appt.start)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px] font-medium">{it.service.name}</span>
                          <span className="block truncate text-[12.5px] text-ink-3">{it.customer.name}</span>
                        </span>
                        <Plate plate={it.vehicle.plate} size="xs" />
                        <Fuse color={statusMeta[it.appt.status].fuse} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-2">
        {(["pending", "confirmed", "in_progress", "done", "no_show"] as const).map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <Fuse color={statusMeta[s].fuse} /> {statusMeta[s].label}
          </li>
        ))}
      </ul>
    </div>
  );
}
