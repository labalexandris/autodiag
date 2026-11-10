import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getAppointments, getBays, getServices, getShop } from "@/lib/data";
import { getSearchEntries, hydrateAppointments } from "@/lib/views";
import { statusMeta } from "@/lib/labels";
import { halfHourOptions, hoursBounds, openDays } from "@/lib/hours";
import { toSheetItem } from "@/lib/sheet-item";
import { fmtDayNum, fmtDayShort, fmtMonthShort, fmtTime, cn } from "@/lib/format";
import { Plate } from "@/components/plate";
import { Fuse, StatusLegend, statusCard } from "@/components/status";
import { NewAppointment } from "@/components/admin/new-appointment";
import { AppointmentCard, AppointmentProvider } from "@/components/admin/appointment-sheet";

export const metadata = { title: "Ημερολόγιο" };
export const dynamic = "force-dynamic";

const HOUR_PX = 64;
const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function mondayOf(offsetWeeks: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const wd = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - wd + offsetWeeks * 7);
  return d;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ w?: string; new?: string; at?: string; plate?: string }> }) {
  const sp = await searchParams;
  const w = Number(sp.w ?? 0) || 0;
  const monday = mondayOf(w);
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  const [bays, services, shop, entries, items] = await Promise.all([
    getBays(),
    getServices(),
    getShop(),
    getSearchEntries(),
    getAppointments({ from: monday, to: nextMonday }).then(hydrateAppointments),
  ]);

  // Ημέρες και ώρες από το ωράριο του συνεργείου: αν ανοίξει Σάββατο, εμφανίζεται μόνο του
  const openWeekdays = openDays(shop).map((d) => d.day);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  }).filter((d) => openWeekdays.includes(d.getDay()));
  const { start: START, end: END } = hoursBounds(shop);

  const visible = items.filter((i) => i.appt.status !== "cancelled");
  const todayKey = new Date().toDateString();
  const hours = Array.from({ length: END - START }, (_, i) => START + i);
  const pending = visible.filter((v) => v.appt.status === "pending").length;
  const cols = { gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` };
  const weekQuery = w ? `w=${w}&` : "";

  const rangeLabel = days.length ? `${fmtDayNum(days[0])} ${fmtMonthShort(days[0])} – ${fmtDayNum(days[days.length - 1])} ${fmtMonthShort(days[days.length - 1])}` : "";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cond text-[32px] font-semibold leading-none sm:text-[38px]">Ημερολόγιο</h1>
          <p className="mt-2.5 text-[15px] text-ink-2">
            {visible.length} ραντεβού αυτή την εβδομάδα{pending > 0 && <>, {pending} περιμένουν επιβεβαίωση</>}.
          </p>
        </div>
        <NewAppointment
          key={`${sp.new ?? ""}|${sp.at ?? ""}|${sp.plate ?? ""}`}
          services={services}
          entries={entries}
          times={halfHourOptions(shop)}
          openWeekdays={openWeekdays}
          initial={{ open: sp.new === "1", plate: sp.plate, at: sp.at }}
        />
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

      <AppointmentProvider services={services} technicians={shop.technicians} times={halfHourOptions(shop)}>
        {/* Desktop εβδομάδα */}
        <div className="panel hidden overflow-hidden md:block">
          <div className="grid border-b border-line-2" style={cols}>
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
          <div className="grid" style={cols}>
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
                  {/* Κενές ώρες: κλικ για νέο ραντεβού εκείνη την ώρα */}
                  {hours.map((h) => (
                    <Link
                      key={h}
                      href={`?${weekQuery}new=1&at=${dateStr(d)}T${pad(h)}:00`}
                      scroll={false}
                      aria-label={`Νέο ραντεβού ${fmtDayShort(d)} ${fmtDayNum(d)} στις ${h}:00`}
                      className={cn("group absolute inset-x-0 flex items-center justify-center text-brand hover:bg-brand-soft/70", h > START && "border-t border-line-2")}
                      style={{ top: (h - START) * HOUR_PX, height: HOUR_PX }}
                    >
                      <Plus size={16} className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                    </Link>
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
                      <AppointmentCard
                        key={it.appt.id}
                        item={toSheetItem(it, bays)}
                        title={`${fmtTime(it.appt.start)} ${it.service.name}, ${it.customer.name} (${m.label})`}
                        className={cn(
                          "absolute z-[1] overflow-hidden rounded-md border px-1.5 py-1 text-left text-[12px] leading-tight transition-shadow hover:z-10 hover:shadow-[0_6px_16px_-8px_rgba(30,34,38,0.4)]",
                          statusCard[it.appt.status],
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
                        {height > 70 && <span className="mt-0.5 block truncate pl-0.5 font-cond text-[11.5px] tracking-[0.04em] text-ink-2">{it.vehicle.plate}</span>}
                      </AppointmentCard>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <p className="hidden text-[12px] text-ink-3 md:block">
          Κάθε ημέρα χωρίζεται σε στήλες ανά θέση: {bays.map((b) => b.name).join(", ")}. Κλικ σε κενή ώρα για νέο ραντεβού.
        </p>

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
                  <Link href={`?${weekQuery}new=1&at=${dateStr(d)}T${pad(START + 1)}:00`} scroll={false} className="ml-auto text-[13px] font-medium normal-case text-brand">
                    + Ραντεβού
                  </Link>
                </h2>
                {dayItems.length > 0 && (
                  <ul className="panel divide-y divide-line-2 overflow-hidden">
                    {dayItems.map((it) => (
                      <li key={it.appt.id}>
                        <AppointmentCard item={toSheetItem(it, bays)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                          <span className="w-11 text-[14px] font-semibold tnum">{fmtTime(it.appt.start)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14.5px] font-medium">{it.service.name}</span>
                            <span className="block truncate text-[12.5px] text-ink-2">{it.customer.name}</span>
                          </span>
                          <Plate plate={it.vehicle.plate} size="xs" />
                          <Fuse color={statusMeta[it.appt.status].fuse} />
                        </AppointmentCard>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </AppointmentProvider>

      <StatusLegend />
    </div>
  );
}
