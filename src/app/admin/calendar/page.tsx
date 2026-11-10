import { requireUser } from "@/lib/auth-server";
import { getAppointments, getBays, getServices, getShop } from "@/lib/data";
import { getSearchEntries, hydrateAppointments } from "@/lib/views";
import { dayHours, halfHourOptions, openDays } from "@/lib/hours";
import { toSheetItem } from "@/lib/sheet-item";
import { fmtDayLong, fmtMonthShort, fmtTime } from "@/lib/format";
import { StatusLegend } from "@/components/status";
import { NewAppointment } from "@/components/admin/new-appointment";
import { AppointmentProvider } from "@/components/admin/appointment-sheet";
import { MonthCalendar, type MonthDay, type MonthItem } from "@/components/admin/month-calendar";

export const metadata = { title: "Ημερολόγιο" };
export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const fmtMonthYear = (d: Date) => new Intl.DateTimeFormat("el-GR", { month: "long", year: "numeric", timeZone: "Europe/Athens" }).format(d);
const fmtRangeDate = (d: Date) => new Intl.DateTimeFormat("el-GR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Athens" }).format(d);

/** Ο μήνας από το ?m=YYYY-MM, αλλιώς ο τρέχων */
function monthFrom(m?: string) {
  const match = m?.match(/^(\d{4})-(\d{2})$/);
  const d = match ? new Date(Number(match[1]), Number(match[2]) - 1, 1) : new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; new?: string; at?: string; plate?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const first = monthFrom(sp.m);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);

  // Το πλέγμα ξεκινά Δευτέρα και τελειώνει Κυριακή
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 6) % 7));
  const gridEnd = new Date(last);
  gridEnd.setDate(gridEnd.getDate() + (6 - ((gridEnd.getDay() + 6) % 7)) + 1);

  const [bays, services, shop, entries, items] = await Promise.all([
    getBays(),
    getServices(),
    getShop(),
    getSearchEntries(),
    getAppointments({ from: gridStart, to: gridEnd }).then(hydrateAppointments),
  ]);

  const today = new Date();
  const todayKey = dateKey(today);
  const days: MonthDay[] = [];
  for (const d = new Date(gridStart); d < gridEnd; d.setDate(d.getDate() + 1)) {
    days.push({
      key: dateKey(d),
      num: d.getDate(),
      inMonth: d.getMonth() === first.getMonth(),
      isToday: dateKey(d) === todayKey,
      closed: !dayHours(shop, d.getDay()),
      label: fmtDayLong(d),
    });
  }

  const visible = items.filter((i) => i.appt.status !== "cancelled");
  const monthItems: MonthItem[] = visible.map((it) => ({
    dayKey: dateKey(new Date(it.appt.start)),
    time: fmtTime(it.appt.start),
    status: it.appt.status,
    item: toSheetItem(it, bays),
  }));

  const prev = new Date(first.getFullYear(), first.getMonth() - 1, 1);
  const next = new Date(first.getFullYear(), first.getMonth() + 1, 1);
  const isCurrent = monthKey(first) === monthKey(today);
  const monthQuery = isCurrent ? "" : `m=${monthKey(first)}&`;
  const inMonth = visible.filter((v) => new Date(v.appt.start).getMonth() === first.getMonth());
  const pending = inMonth.filter((v) => v.appt.status === "pending").length;

  return (
    <div className="space-y-6">
      <AppointmentProvider services={services} technicians={shop.technicians} times={halfHourOptions(shop)} canCancel={user.role === "owner"}>
        <MonthCalendar
          days={days}
          items={monthItems}
          todayKey={todayKey}
          initialDay={isCurrent ? todayKey : dateKey(first)}
          title={fmtMonthYear(first)}
          range={`${fmtRangeDate(first)} – ${fmtRangeDate(last)} · ${inMonth.length} ραντεβού${pending ? `, ${pending} περιμένουν επιβεβαίωση` : ""}`}
          prevHref={`?m=${monthKey(prev)}`}
          nextHref={`?m=${monthKey(next)}`}
          todayHref="/admin/calendar"
          todayMonth={fmtMonthShort(today)}
          todayNum={today.getDate()}
          monthQuery={monthQuery}
          newButton={
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
      </AppointmentProvider>
      <StatusLegend />
    </div>
  );
}
