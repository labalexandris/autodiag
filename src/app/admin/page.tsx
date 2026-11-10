import Link from "next/link";
import { CalendarCheck2, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth-server";
import { getAppointments, getBays, getServices, getShop } from "@/lib/data";
import { getDueSoon, getSearchEntries, hydrateAppointments } from "@/lib/views";
import { halfHourOptions, hoursBounds } from "@/lib/hours";
import { fmtDayLong, fmtTime } from "@/lib/format";
import { PlateSearch } from "@/components/plate-search";
import { StatusLegend } from "@/components/status";
import { DayBoard } from "@/components/admin/day-board";
import { AppointmentProvider } from "@/components/admin/appointment-sheet";
import { Approvals } from "@/components/admin/approvals";
import { DueList } from "@/components/admin/due-list";

export const metadata = { title: "Σήμερα" };
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await requireUser();
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);

  const [bays, services, shop, today, all, entries, due] = await Promise.all([
    getBays(),
    getServices(),
    getShop(),
    getAppointments({ from, to }).then(hydrateAppointments),
    getAppointments().then(hydrateAppointments),
    getSearchEntries(),
    getDueSoon(),
  ]);
  const { start, end } = hoursBounds(shop);

  const active = today.filter((t) => t.appt.status !== "cancelled");
  const pending = all.filter((t) => t.appt.status === "pending");
  const inProgress = active.filter((t) => t.appt.status === "in_progress");
  const next = active.find((t) => t.appt.status === "confirmed");
  const left = active.filter((t) => ["confirmed", "in_progress"].includes(t.appt.status)).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-cond text-[32px] font-semibold leading-none tracking-[-0.01em] first-letter:uppercase sm:text-[38px]">
              {fmtDayLong(new Date())}
            </h1>
            <p className="mt-2.5 text-[15px] text-ink-2">
              {active.length} ραντεβού σήμερα
              {inProgress.length > 0 && <>, {inProgress.length} σε εξέλιξη</>}
              {next ? (
                <>
                  . Επόμενο στις <span className="font-semibold text-ink tnum">{fmtTime(next.appt.start)}</span>, {next.service.name.toLowerCase()} για το {next.vehicle.make} {next.vehicle.model}.
                </>
              ) : left === 0 ? (
                ". Τελείωσαν τα ραντεβού της ημέρας."
              ) : (
                "."
              )}
            </p>
          </div>
          <Link href="/admin/calendar?new=1" className="btn btn-primary max-lg:hidden">
            <Plus size={17} /> Νέο ραντεβού
          </Link>
        </div>
        <PlateSearch entries={entries} />
      </header>

      <section aria-labelledby="board" className="space-y-3">
        <h2 id="board" className="sr-only">Πρόγραμμα ημέρας</h2>
        <AppointmentProvider services={services} technicians={shop.technicians} times={halfHourOptions(shop)} canCancel={user.role === "owner"}>
          <DayBoard bays={bays} items={active} start={start} end={end} />
        </AppointmentProvider>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <StatusLegend />
          <p className="text-[13px] text-ink-3">Πάτα ένα ραντεβού για το επόμενο βήμα.</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="panel overflow-hidden" aria-labelledby="pending">
          <header className="flex items-center justify-between border-b border-line-2 px-5 py-3.5">
            <h2 id="pending" className="flex items-center gap-2 text-[16px] font-semibold">
              Αιτήματα online
              {pending.length > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1.5 text-[12px] tnum">{pending.length}</span>
              )}
            </h2>
            <span className="text-[13px] text-ink-3">Περιμένουν επιβεβαίωση</span>
          </header>
          <Approvals
            canReject={user.role === "owner"}
            items={pending.slice(0, 5).map((p) => ({
              id: p.appt.id,
              start: p.appt.start,
              plate: p.vehicle.plate,
              vehicle: `${p.vehicle.make} ${p.vehicle.model}`,
              customer: p.customer.name,
              service: p.service.name,
              notes: p.appt.notes,
              ownerMismatch: p.appt.customerId !== p.vehicle.ownerId,
            }))}
          />
          {pending.length > 5 && (
            <Link href="/admin/calendar" className="block border-t border-line-2 px-5 py-3 text-[14px] font-medium text-brand hover:underline">
              Και άλλα {pending.length - 5} στο ημερολόγιο
            </Link>
          )}
        </section>

        <section className="panel overflow-hidden" aria-labelledby="due">
          <header className="flex items-center justify-between border-b border-line-2 px-5 py-3.5">
            <h2 id="due" className="text-[16px] font-semibold">Λήξεις και service</h2>
            <span className="flex items-center gap-1.5 text-[13px] text-ink-3">
              <CalendarCheck2 size={14} /> 30 ημέρες
            </span>
          </header>
          <DueList items={due.slice(0, 7)} />
        </section>
      </div>
    </div>
  );
}
