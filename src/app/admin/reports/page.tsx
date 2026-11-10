import Link from "next/link";
import { requireOwner } from "@/lib/auth-server";
import { getAppointments, getRecordTotalsByAppointment, getServices } from "@/lib/data";
import { statusMeta, sourceLabel } from "@/lib/labels";
import { fmtDayNum, fmtEUR, fmtMonthShort, fmtNum, cn } from "@/lib/format";
import { BarChart, type Bar } from "@/components/admin/bar-chart";
import { Fuse } from "@/components/status";
import type { Appointment, AppointmentSource } from "@/lib/types";

export const metadata = { title: "Αναφορές" };
export const dynamic = "force-dynamic";

const periods = { "30": "30 ημέρες", "90": "3 μήνες", "180": "6 μήνες" } as const;
type P = keyof typeof periods;

/* Ραντεβού χωρίς εγγραφή στο βιβλιάριο (π.χ. «χωρίς εγγραφή»): εκτίμηση από την τιμή της υπηρεσίας. */
const base: Record<string, number> = { diag: 45, immo: 110, ac: 70, starter: 180, battery: 105, lights: 40, windows: 120, service: 140 };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await requireOwner();
  const sp = (await searchParams).p;
  const p: P = sp && sp in periods ? (sp as P) : "90";
  const days = Number(p);

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - days);

  const [all, services, totals] = await Promise.all([getAppointments({ from: prevFrom, to: now }), getServices(), getRecordTotalsByAppointment(prevFrom, now)]);
  const amount = (a: Appointment) => totals.get(a.id) ?? base[a.serviceId] ?? 0;
  const cur = all.filter((a) => new Date(a.start) >= from);
  const prev = all.filter((a) => new Date(a.start) < from);

  const done = cur.filter((a) => a.status === "done");
  const prevDone = prev.filter((a) => a.status === "done");
  const revenue = done.reduce((s, a) => s + amount(a), 0);
  const prevRevenue = prevDone.reduce((s, a) => s + amount(a), 0);
  const closed = cur.filter((a) => ["done", "no_show"].includes(a.status));
  const noShow = cur.filter((a) => a.status === "no_show").length;
  const noShowRate = closed.length ? noShow / closed.length : 0;
  const avgTicket = done.length ? revenue / done.length : 0;
  const uniqueCustomers = new Set(done.map((a) => a.customerId)).size;

  // Εβδομαδιαία έσοδα
  const weeks: Bar[] = [];
  const weekCount = Math.ceil(days / 7);
  const wStart = new Date(now);
  wStart.setHours(0, 0, 0, 0);
  wStart.setDate(wStart.getDate() - ((wStart.getDay() + 6) % 7) - (weekCount - 1) * 7);
  for (let i = 0; i < weekCount; i++) {
    const s = new Date(wStart);
    s.setDate(s.getDate() + i * 7);
    const e = new Date(s);
    e.setDate(e.getDate() + 7);
    const inW = done.filter((a) => new Date(a.start) >= s && new Date(a.start) < e);
    weeks.push({
      label: `Εβδομάδα ${fmtDayNum(s)} ${fmtMonthShort(s)}`,
      sub: `${fmtDayNum(s)}/${s.getMonth() + 1}`,
      value: inW.reduce((sum, a) => sum + amount(a), 0),
      count: inW.length,
      partial: e > now,
    });
  }

  const byService = services
    .map((s) => {
      const list = done.filter((a) => a.serviceId === s.id);
      return { name: s.name, count: list.length, value: list.reduce((sum, a) => sum + amount(a), 0) };
    })
    .sort((a, b) => b.value - a.value);
  const maxService = Math.max(1, ...byService.map((s) => s.value));

  const bySource = (Object.keys(sourceLabel) as AppointmentSource[]).map((k) => ({ k, n: cur.filter((a) => a.source === k).length }));
  const maxSource = Math.max(1, ...bySource.map((s) => s.n));

  const outcomes = (["done", "no_show", "cancelled"] as const).map((s) => ({ s, n: cur.filter((a) => a.status === s).length }));
  const outcomeTotal = outcomes.reduce((x, o) => x + o.n, 0) || 1;

  const smsCount = cur.filter((a) => a.reminder === "sent").length * 2;
  const delta = prevRevenue ? (revenue - prevRevenue) / prevRevenue : 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cond text-[32px] font-semibold leading-none sm:text-[38px]">Αναφορές</h1>
          <p className="mt-2.5 text-[15px] text-ink-2">Τελευταίες {periods[p]}, σε σύγκριση με το αμέσως προηγούμενο διάστημα.</p>
        </div>
        <nav className="inline-flex rounded-lg border border-line bg-panel p-0.5" aria-label="Διάστημα">
          {(Object.keys(periods) as P[]).map((k) => (
            <Link
              key={k}
              href={`?p=${k}`}
              aria-current={k === p ? "page" : undefined}
              className={cn("rounded-md px-3 py-1.5 text-[14px]", k === p ? "bg-ink font-medium text-white" : "text-ink-2 hover:text-ink")}
            >
              {periods[k]}
            </Link>
          ))}
        </nav>
      </header>

      <section className="panel grid grid-cols-2 divide-line-2 overflow-hidden md:grid-cols-4 md:divide-x [&>*]:border-line-2 max-md:[&>*:nth-child(-n+2)]:border-b max-md:[&>*:nth-child(odd)]:border-r">
        <Stat label="Έσοδα" value={fmtEUR(revenue)} note={prevRevenue ? `${delta >= 0 ? "+" : "−"}${Math.abs(Math.round(delta * 100))}% από πριν` : undefined} tone={delta >= 0 ? "good" : "bad"} />
        <Stat label="Εργασίες" value={fmtNum(done.length)} note={`${fmtNum(prevDone.length)} το προηγούμενο διάστημα`} />
        <Stat label="Μέση απόδειξη" value={fmtEUR(avgTicket)} note={`από ${uniqueCustomers} πελάτες`} />
        <Stat label="Δεν ήρθαν" value={`${(noShowRate * 100).toFixed(1).replace(".", ",")}%`} note={`${noShow} ραντεβού`} tone={noShowRate > 0.06 ? "bad" : undefined} />
      </section>

      <section className="panel p-5 sm:p-6" aria-labelledby="rev">
        <h2 id="rev" className="text-[16px] font-semibold">Έσοδα ανά εβδομάδα</h2>
        <p className="mb-6 mt-0.5 text-[13px] text-ink-3">Από ολοκληρωμένες εργασίες</p>
        <BarChart bars={weeks} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <section className="panel p-5 sm:p-6" aria-labelledby="svc">
          <h2 id="svc" className="text-[16px] font-semibold">Ανά υπηρεσία</h2>
          <p className="mb-5 mt-0.5 text-[13px] text-ink-3">Έσοδα και πλήθος εργασιών</p>
          <ul className="space-y-3.5">
            {byService.map((s) => (
              <li key={s.name} className="group" title={`${s.name}: ${fmtEUR(s.value)} από ${s.count} εργασίες`}>
                <div className="flex items-baseline justify-between gap-3 text-[14px]">
                  <span>{s.name}</span>
                  <span className="tnum">
                    <span className="font-medium">{fmtEUR(s.value)}</span>
                    <span className="ml-2 text-[12.5px] text-ink-3">{s.count}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-line-2">
                  <div className="h-full rounded-full bg-brand transition-opacity group-hover:opacity-80" style={{ width: `${(s.value / maxService) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="panel p-5 sm:p-6" aria-labelledby="out">
            <h2 id="out" className="text-[16px] font-semibold">Έκβαση ραντεβού</h2>
            <div className="mt-4 flex h-3 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={outcomes.map((o) => `${statusMeta[o.s].label} ${o.n}`).join(", ")}>
              {outcomes.map((o) => (
                <span key={o.s} style={{ width: `${(o.n / outcomeTotal) * 100}%`, background: statusMeta[o.s].fuse }} />
              ))}
            </div>
            <ul className="mt-4 space-y-2 text-[14px]">
              {outcomes.map((o) => (
                <li key={o.s} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <Fuse color={statusMeta[o.s].fuse} />
                    {statusMeta[o.s].label}
                  </span>
                  <span className="tnum">
                    {o.n} <span className="text-ink-3">({Math.round((o.n / outcomeTotal) * 100)}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-5 sm:p-6" aria-labelledby="src">
            <h2 id="src" className="text-[16px] font-semibold">Από πού κλείστηκαν</h2>
            <ul className="mt-4 space-y-3">
              {bySource.map((s) => (
                <li key={s.k} className="grid grid-cols-[88px_1fr_40px] items-center gap-3 text-[14px]">
                  <span>{sourceLabel[s.k]}</span>
                  <span className="h-2 rounded-full bg-line-2">
                    <span className="block h-full rounded-full bg-brand" style={{ width: `${(s.n / maxSource) * 100}%` }} />
                  </span>
                  <span className="text-right tnum">{s.n}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-5 sm:p-6">
            <h2 className="text-[16px] font-semibold">SMS</h2>
            <p className="mt-2 text-[14px] text-ink-2">
              <span className="font-semibold text-ink tnum">{fmtNum(smsCount)}</span> μηνύματα επιβεβαίωσης και υπενθύμισης, περίπου{" "}
              <span className="font-semibold text-ink tnum">{fmtEUR(smsCount * 0.045, 2)}</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "good" | "bad" }) {
  return (
    <div className="px-5 py-4 sm:px-6 sm:py-5">
      <p className="text-[13px] text-ink-3">{label}</p>
      <p className="mt-1 font-cond text-[28px] font-semibold leading-none tnum sm:text-[32px]">{value}</p>
      {note && <p className={cn("mt-2 text-[12.5px]", tone === "good" ? "text-fuse-green" : tone === "bad" ? "text-fuse-red" : "text-ink-3")}>{note}</p>}
    </div>
  );
}
