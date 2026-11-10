import { requireUser } from "@/lib/auth-server";
import { getAppointments, getBays, getServices, getShop } from "@/lib/data";
import { getSearchEntries, hydrateAppointments } from "@/lib/views";
import { dayHours, halfHourOptions, openDays } from "@/lib/hours";
import { toSheetItem } from "@/lib/sheet-item";
import { fmtDayLong, fmtTime } from "@/lib/format";
import { StatusLegend } from "@/components/status";
import { NewAppointment } from "@/components/admin/new-appointment";
import { AppointmentProvider } from "@/components/admin/appointment-sheet";
import { MonthCalendar, type CalDay } from "@/components/admin/month-calendar";

export const metadata = { title: "Ημερολόγιο" };
export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const fmtMonthYear = (d: Date) => new Intl.DateTimeFormat("el-GR", { month: "long", year: "numeric", timeZone: "Europe/Athens" }).format(d);
const parseMonth = (s?: string) => {
  const m = s?.match(/^(\d{4})-(\d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : undefined;
};

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; new?: string; at?: string; plate?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const shop = await getShop();

  const today = new Date();
  const todayKey = dateKey(today);
  const first = parseMonth(sp.m) ?? new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);

  // Πλέγμα Δευτέρα–Κυριακή
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 6) % 7));
  const gridEnd = new Date(last);
  gridEnd.setDate(gridEnd.getDate() + (6 - ((gridEnd.getDay() + 6) % 7)) + 1);

  const [bays, services, entries, items] = await Promise.all([
    getBays(),
    getServices(),
    getSearchEntries(),
    getAppointments({ from: gridStart, to: gridEnd }).then(hydrateAppointments),
  ]);

  const byDay = new Map<string, CalDay["entries"]>();
  for (const it of items) {
    if (it.appt.status === "cancelled") continue;
    const k = dateKey(new Date(it.appt.start));
    byDay.set(k, [...(byDay.get(k) ?? []), { time: fmtTime(it.appt.start), status: it.appt.status, item: toSheetItem(it, bays) }]);
  }

  const monthQ = sp.m ? `m=${monthKey(first)}&` : "";
  const days: CalDay[] = [];
  for (const d = new Date(gridStart); d < gridEnd; d.setDate(d.getDate() + 1)) {
    const key = dateKey(d);
    const hours = dayHours(shop, d.getDay());
    days.push({
      key,
      num: d.getDate(),
      label: fmtDayLong(d),
      inMonth: d.getMonth() === first.getMonth(),
      isToday: key === todayKey,
      closed: !hours,
      newHref: `?${monthQ}new=1&at=${key}T${pad(Math.floor((hours?.open ?? 540) / 60))}:00`,
      entries: byDay.get(key) ?? [],
    });
  }

  const inMonth = days.filter((d) => d.inMonth);
  const count = inMonth.reduce((s, d) => s + d.entries.length, 0);
  const pending = inMonth.reduce((s, d) => s + d.entries.filter((e) => e.status === "pending").length, 0);
  // Στήλες κλειστών ημερών (0 = Δευτέρα), για να στενέψουν
  const closedCols = [0, 1, 2, 3, 4, 5, 6].filter((i) => !dayHours(shop, (i + 1) % 7));
  const prev = new Date(first.getFullYear(), first.getMonth() - 1, 1);
  const next = new Date(first.getFullYear(), first.getMonth() + 1, 1);

  return (
    <div className="space-y-5">
      <AppointmentProvider services={services} technicians={shop.technicians} times={halfHourOptions(shop)} canCancel={user.role === "owner"}>
        <MonthCalendar
          days={days}
          closedCols={closedCols}
          title={fmtMonthYear(first)}
          summary={
            <>
              {count} ραντεβού{pending > 0 && <>, {pending} περιμένουν επιβεβαίωση</>}. Πάτα ένα ραντεβού για λεπτομέρειες και ενέργειες.
            </>
          }
          prevHref={`?m=${monthKey(prev)}`}
          nextHref={`?m=${monthKey(next)}`}
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
      </AppointmentProvider>
      <StatusLegend />
    </div>
  );
}
