import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth-server";
import { getAppointments, getBays, getServices, getShop } from "@/lib/data";
import { getSearchEntries, hydrateAppointments } from "@/lib/views";
import { dayHours, halfHourOptions, hoursBounds, openDays } from "@/lib/hours";
import { fmtDayLong } from "@/lib/format";
import { StatusLegend } from "@/components/status";
import { NewAppointment } from "@/components/admin/new-appointment";
import { AppointmentProvider } from "@/components/admin/appointment-sheet";
import { DayBoard } from "@/components/admin/day-board";
import { MonthCalendar, type MonthDay } from "@/components/admin/month-calendar";

export const metadata = { title: "Ημερολόγιο" };
export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const fmtMonthYear = (d: Date) => new Intl.DateTimeFormat("el-GR", { month: "long", year: "numeric", timeZone: "Europe/Athens" }).format(d);
const parseDay = (s?: string) => {
  const m = s?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined;
};
const parseMonth = (s?: string) => {
  const m = s?.match(/^(\d{4})-(\d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : undefined;
};

/** Μετρήσιμα ραντεβού: τα ακυρωμένα δεν φαίνονται, τα «δεν ήρθε» δεν πιάνουν θέση */
const occupies = (s: string) => s !== "cancelled" && s !== "no_show";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; d?: string; new?: string; at?: string; plate?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const shop = await getShop();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateKey(today);

  // Ο μήνας από το ?m, αλλιώς από την επιλεγμένη μέρα, αλλιώς ο τρέχων
  const pickedDay = parseDay(sp.d);
  const first = parseMonth(sp.m) ?? (pickedDay ? new Date(pickedDay.getFullYear(), pickedDay.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1));
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const inThisMonth = (d: Date) => d.getFullYear() === first.getFullYear() && d.getMonth() === first.getMonth();

  // Επιλεγμένη μέρα: από το ?d, αλλιώς σήμερα (αν είναι αυτός ο μήνας), αλλιώς η πρώτη εργάσιμη
  let selected = pickedDay;
  if (!selected) {
    if (inThisMonth(today)) selected = today;
    else {
      selected = new Date(first);
      while (!dayHours(shop, selected.getDay()) && selected < last) selected.setDate(selected.getDate() + 1);
    }
  }
  const selectedKey = dateKey(selected);

  // Πλέγμα Δευτέρα–Κυριακή
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 6) % 7));
  const gridEnd = new Date(last);
  gridEnd.setDate(gridEnd.getDate() + (6 - ((gridEnd.getDay() + 6) % 7)) + 1);
  // Αν η επιλεγμένη μέρα είναι έξω από το πλέγμα (π.χ. ?d άλλου μήνα), φέρνουμε και αυτήν
  const from = selected < gridStart ? selected : gridStart;
  const toEnd = new Date(selected);
  toEnd.setDate(toEnd.getDate() + 1);
  const to = toEnd > gridEnd ? toEnd : gridEnd;

  const [bays, services, entries, items] = await Promise.all([
    getBays(),
    getServices(),
    getSearchEntries(),
    getAppointments({ from, to }).then(hydrateAppointments),
  ]);

  const visible = items.filter((i) => i.appt.status !== "cancelled");
  const byDay = new Map<string, typeof visible>();
  for (const it of visible) {
    const k = dateKey(new Date(it.appt.start));
    byDay.set(k, [...(byDay.get(k) ?? []), it]);
  }

  const q = (params: Record<string, string>) => "?" + new URLSearchParams(params).toString();
  const days: MonthDay[] = [];
  for (const d = new Date(gridStart); d < gridEnd; d.setDate(d.getDate() + 1)) {
    const key = dateKey(d);
    const list = byDay.get(key) ?? [];
    const hours = dayHours(shop, d.getDay());
    const capacity = hours ? (hours.close - hours.open) * bays.length : 0;
    const booked = list.filter((i) => occupies(i.appt.status)).reduce((s, i) => s + (new Date(i.appt.end).getTime() - new Date(i.appt.start).getTime()) / 60000, 0);
    days.push({
      key,
      num: d.getDate(),
      href: q({ m: monthKey(d), d: key }),
      label: fmtDayLong(d),
      inMonth: inThisMonth(d),
      isToday: key === todayKey,
      isPast: d < today,
      isSelected: key === selectedKey,
      closed: !hours,
      count: list.length,
      pending: list.filter((i) => i.appt.status === "pending").length,
      noShow: list.filter((i) => i.appt.status === "no_show").length,
      load: capacity ? Math.min(1, booked / capacity) : 0,
      freeMin: Math.max(0, capacity - booked),
    });
  }

  const monthDays = days.filter((d) => d.inMonth);
  const monthCount = monthDays.reduce((s, d) => s + d.count, 0);
  const monthPending = monthDays.reduce((s, d) => s + d.pending, 0);

  // Η επιλεγμένη μέρα
  const dayItems = byDay.get(selectedKey) ?? [];
  const dayInfo = days.find((d) => d.key === selectedKey);
  const selHours = dayHours(shop, selected.getDay());
  const step = (dir: 1 | -1) => {
    const d = new Date(selected);
    do d.setDate(d.getDate() + dir);
    while (!dayHours(shop, d.getDay()));
    return q({ m: monthKey(d), d: dateKey(d) });
  };
  const keep = { m: monthKey(first), d: selectedKey };
  const prev = new Date(first.getFullYear(), first.getMonth() - 1, 1);
  const next = new Date(first.getFullYear(), first.getMonth() + 1, 1);
  const { start, end } = hoursBounds(shop);

  return (
    <div className="space-y-8">
      <MonthCalendar
        days={days}
        title={fmtMonthYear(first)}
        summary={
          <>
            {monthCount} ραντεβού
            {monthPending > 0 && <>, {monthPending} περιμένουν επιβεβαίωση</>}. Πάτα μια μέρα για το πρόγραμμά της.
          </>
        }
        prevHref={q({ m: monthKey(prev) })}
        nextHref={q({ m: monthKey(next) })}
        todayHref="/admin/calendar"
        action={
          <NewAppointment
            key={`${sp.new ?? ""}|${sp.at ?? ""}|${sp.plate ?? ""}`}
            services={services}
            entries={entries}
            times={halfHourOptions(shop)}
            openWeekdays={openDays(shop).map((d) => d.day)}
            initial={{ open: sp.new === "1", plate: sp.plate, at: sp.at }}
          />
        }
      />

      <section aria-labelledby="day" className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1">
            <Link href={step(-1)} scroll={false} className="btn btn-ghost btn-sm w-9 px-0" aria-label="Προηγούμενη εργάσιμη">
              <ChevronLeft size={22} strokeWidth={2.5} />
            </Link>
            <Link href={step(1)} scroll={false} className="btn btn-ghost btn-sm w-9 px-0" aria-label="Επόμενη εργάσιμη">
              <ChevronRight size={22} strokeWidth={2.5} />
            </Link>
          </div>
          <h2 id="day" className="text-[19px] font-semibold first-letter:uppercase">
            {fmtDayLong(selected)}
            {selectedKey === todayKey && <span className="ml-2 align-middle text-[13px] font-medium text-brand">σήμερα</span>}
          </h2>
          <p className="text-[14px] text-ink-2">
            {!selHours && !dayItems.length ? (
              "Κλειστά"
            ) : (
              <>
                {dayItems.length} ραντεβού
                {dayInfo && dayInfo.pending > 0 && <>, {dayInfo.pending} προς έγκριση</>}
                {dayInfo && selHours && <>, {Math.round(dayInfo.load * 100)}% πληρότητα</>}
              </>
            )}
          </p>
          {selHours && (
            <Link
              href={q({ ...keep, new: "1", at: `${selectedKey}T${pad(Math.floor(selHours.open / 60))}:00` })}
              scroll={false}
              className="ml-auto inline-flex items-center gap-1 text-[14px] font-medium text-brand hover:underline"
            >
              <Plus size={15} /> Ραντεβού αυτή τη μέρα
            </Link>
          )}
        </div>

        <AppointmentProvider services={services} technicians={shop.technicians} times={halfHourOptions(shop)} canCancel={user.role === "owner"}>
          <DayBoard
            bays={bays}
            items={dayItems}
            start={start}
            end={end}
            showNow={selectedKey === todayKey}
            emptyText={selHours ? "Κανένα ραντεβού αυτή τη μέρα." : "Κλειστά."}
          />
        </AppointmentProvider>
        <StatusLegend />
      </section>
    </div>
  );
}
