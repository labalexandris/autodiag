import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, MessageSquare, Check, Minus } from "lucide-react";
import {
  getAppointmentsForCustomer,
  getCustomer,
  getRecordsForVehicle,
  getServices,
  getVehicles,
  getVehiclesForCustomer,
  recordTotal,
} from "@/lib/data";
import { fmtDate, fmtEUR, fmtNum, fmtTime, relativeDays } from "@/lib/format";
import { normalizePlate } from "@/lib/plate";
import { sourceLabel } from "@/lib/labels";
import { Plate } from "@/components/plate";
import { StatusBadge } from "@/components/status";
import { EditCustomer } from "@/components/admin/edit-customer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const c = await getCustomer((await params).id);
  return { title: c?.name ?? "Πελάτης" };
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const [vehicles, appts, services, allVehicles] = await Promise.all([getVehiclesForCustomer(id), getAppointmentsForCustomer(id), getServices(), getVehicles()]);
  const recordsByVehicle = await Promise.all(vehicles.map((v) => getRecordsForVehicle(v.id)));
  const allRecords = recordsByVehicle.flat();
  const spent = allRecords.reduce((s, r) => s + recordTotal(r), 0);
  const noShows = appts.filter((a) => a.status === "no_show").length;

  return (
    <div className="space-y-8">
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink">
        <ArrowLeft size={16} /> Πελάτες
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-cond text-[32px] font-semibold leading-none sm:text-[38px]">{customer.name}</h1>
          <p className="mt-2.5 text-[15px] text-ink-2">
            Πελάτης από {fmtDate(customer.createdAt)}. {allRecords.length} εργασίες, σύνολο <span className="tnum">{fmtEUR(spent)}</span>
            {noShows > 0 && <span className="text-fuse-red">, {noShows} {noShows === 1 ? "ραντεβού που δεν ήρθε" : "ραντεβού που δεν ήρθε"}</span>}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${customer.phone.replace(/\s/g, "")}`} className="btn btn-primary">
            <Phone size={16} /> Κλήση
          </a>
          <a href={`sms:${customer.phone.replace(/\s/g, "")}`} className="btn btn-outline">
            <MessageSquare size={16} /> SMS
          </a>
          <EditCustomer customer={customer} />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="veh">
            <h2 id="veh" className="mb-3 text-[18px] font-semibold">Οχήματα</h2>
            {vehicles.length === 0 && <p className="panel px-5 py-4 text-[14px] text-ink-2">Δεν έχει όχημα στο όνομά του. Έχει κλείσει ραντεβού για όχημα άλλου ιδιοκτήτη.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {vehicles.map((v, i) => {
                const last = recordsByVehicle[i][0];
                return (
                  <Link key={v.id} href={`/admin/vehicles/${normalizePlate(v.plate)}`} className="panel group block p-5 transition-[border-color] hover:border-line">
                    <Plate plate={v.plate} size="md" />
                    <p className="mt-3 text-[16px] font-medium group-hover:text-brand">
                      {v.make} {v.model}
                    </p>
                    <p className="text-[13px] text-ink-3">
                      {[v.year, v.fuel, `${fmtNum(v.km)} km`].filter(Boolean).join(", ")}
                    </p>
                    <p className="mt-3 border-t border-line-2 pt-3 text-[13px] text-ink-2">
                      {last ? (
                        <>
                          Τελευταία: {last.title.toLowerCase()}, {relativeDays(last.date)}
                        </>
                      ) : (
                        "Δεν έχει εργασίες ακόμα"
                      )}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="hist">
            <h2 id="hist" className="mb-3 text-[18px] font-semibold">Ραντεβού</h2>
            <div className="panel overflow-hidden">
              <ul className="divide-y divide-line-2">
                {appts.slice(0, 12).map((a) => {
                  const v = allVehicles.find((x) => x.id === a.vehicleId);
                  return (
                    <li key={a.id} className="grid grid-cols-[88px_1fr_auto] items-center gap-4 px-5 py-3">
                      <span className="text-[14px] tnum">
                        <span className="block font-medium">{fmtDate(a.start)}</span>
                        <span className="text-ink-3">{fmtTime(a.start)}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14.5px]">{services.find((s) => s.id === a.serviceId)?.name}</span>
                        <span className="block truncate text-[13px] text-ink-3">
                          {v?.make} {v?.model}, {sourceLabel[a.source].toLowerCase()}
                        </span>
                      </span>
                      <StatusBadge status={a.status} />
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="panel p-5">
            <h2 className="text-[15px] font-semibold">Επικοινωνία</h2>
            <dl className="mt-3 space-y-2.5 text-[14px]">
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="text-ink-3" />
                <dd className="tnum">{customer.phone}</dd>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={15} className="text-ink-3" />
                <dd className={customer.email ? "" : "text-ink-3"}>{customer.email ?? "Χωρίς email"}</dd>
              </div>
            </dl>
            {customer.notes && <p className="mt-4 rounded-lg bg-signal-soft px-3 py-2 text-[13px] text-ink-2">{customer.notes}</p>}
          </section>
          <section className="panel p-5">
            <h2 className="text-[15px] font-semibold">Συγκαταθέσεις</h2>
            <ul className="mt-3 space-y-2 text-[14px]">
              <Consent ok={customer.smsConsent}>SMS για ραντεβού</Consent>
              <Consent ok={customer.marketingConsent}>Προσφορές και υπενθυμίσεις service</Consent>
            </ul>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-3">Καταγράφεται για GDPR. Ο πελάτης μπορεί να τις ανακαλέσει απαντώντας STOP.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Consent({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className={`grid size-5 place-items-center rounded-full ${ok ? "bg-fuse-green/15 text-fuse-green" : "bg-line-2 text-ink-3"}`}>
        {ok ? <Check size={12} strokeWidth={3} /> : <Minus size={12} strokeWidth={3} />}
      </span>
      <span className={ok ? "" : "text-ink-3"}>{children}</span>
    </li>
  );
}
