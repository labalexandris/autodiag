import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, CalendarPlus } from "lucide-react";
import {
  getAppointments,
  getCustomer,
  getRecordsForVehicle,
  getRemindersForVehicle,
  getServices,
  getShop,
  getVehicleByPlate,
  recordTotal,
} from "@/lib/data";
import { fmtDate, fmtEUR, fmtTime, fmtDayLong } from "@/lib/format";
import { formatPlate } from "@/lib/plate";
import { Plate } from "@/components/plate";
import { StatusBadge } from "@/components/status";
import { Odometer } from "@/components/booklet/odometer";
import { Timeline } from "@/components/booklet/timeline";
import { Upcoming } from "@/components/booklet/upcoming";
import { RecordForm } from "@/components/booklet/record-form";
import { ShareButton } from "@/components/booklet/share-button";
import { EditVehicle } from "@/components/admin/edit-vehicle";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ plate: string }> }) {
  const { plate } = await params;
  return { title: formatPlate(decodeURIComponent(plate)) };
}

export default async function VehiclePage({ params }: { params: Promise<{ plate: string }> }) {
  const { plate } = await params;
  const vehicle = await getVehicleByPlate(decodeURIComponent(plate));
  if (!vehicle) notFound();

  const [owner, records, reminders, services, appts, shop] = await Promise.all([
    getCustomer(vehicle.ownerId),
    getRecordsForVehicle(vehicle.id),
    getRemindersForVehicle(vehicle.id),
    getServices(),
    getAppointments(),
    getShop(),
  ]);
  // Οχήματα από online κράτηση έρχονται μόνο με πινακίδα και μάρκα
  const incomplete = !vehicle.year || !vehicle.fuel || vehicle.km === 0;
  const upcoming = appts.filter((a) => a.vehicleId === vehicle.id && new Date(a.end) > new Date() && !["cancelled", "done"].includes(a.status));
  const spent = records.reduce((s, r) => s + recordTotal(r), 0);

  return (
    <div className="space-y-8">
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink">
        <ArrowLeft size={16} /> Πελάτες
      </Link>

      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Plate plate={vehicle.plate} size="xl" className="self-start" />
          <div>
            <h1 className="font-cond text-[28px] font-semibold leading-tight sm:text-[32px]">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="mt-1 text-[15px] text-ink-2">
              {[vehicle.engine, vehicle.fuel, vehicle.year].filter(Boolean).join(", ")}
            </p>
            {vehicle.vin && <p className="mt-0.5 font-cond text-[13px] tracking-[0.04em] text-ink-3">VIN {vehicle.vin}</p>}
            {incomplete && <p className="mt-1.5 text-[13px] text-[#8a6700]">Λείπουν στοιχεία του οχήματος (έτος, καύσιμο ή χιλιόμετρα).</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <RecordForm vehicleId={vehicle.id} currentKm={vehicle.km} services={services} technicians={shop.technicians} />
          <Link href={`/admin/calendar?new=1&plate=${encodeURIComponent(vehicle.plate)}`} className="btn btn-outline">
            <CalendarPlus size={16} /> Ραντεβού
          </Link>
          <ShareButton token={vehicle.shareToken} />
          <EditVehicle vehicle={vehicle} incomplete={incomplete} />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="booklet" className="min-w-0 lg:order-1">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="booklet" className="text-[18px] font-semibold">Βιβλιάριο</h2>
            <p className="text-[13px] text-ink-3">
              {records.length} {records.length === 1 ? "εργασία" : "εργασίες"}, σύνολο <span className="tnum">{fmtEUR(spent)}</span>
            </p>
          </div>
          <Timeline records={records} />
        </section>

        <aside className="space-y-6 lg:order-2">
          <section className="panel p-5">
            <h2 className="text-[13px] text-ink-3">Χιλιόμετρα</h2>
            <Odometer km={vehicle.km} className="mt-2" />
            <p className="mt-2 text-[12px] text-ink-3">
              {records[0] ? `Τελευταία καταγραφή ${fmtDate(records[0].date)}` : "Χωρίς καταγραφή"}
            </p>
          </section>

          {owner && (
            <section className="panel p-5">
              <h2 className="text-[13px] text-ink-3">Ιδιοκτήτης</h2>
              <Link href={`/admin/customers/${owner.id}`} className="mt-1.5 block text-[16px] font-medium hover:text-brand">
                {owner.name}
              </Link>
              <a href={`tel:${owner.phone.replace(/\s/g, "")}`} className="mt-1 inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-brand tnum">
                <Phone size={14} /> {owner.phone}
              </a>
              {owner.notes && <p className="mt-3 rounded-lg bg-signal-soft px-3 py-2 text-[13px] text-ink-2">{owner.notes}</p>}
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="panel overflow-hidden">
              <h2 className="border-b border-line-2 px-5 py-3 text-[15px] font-semibold">Επόμενο ραντεβού</h2>
              {upcoming.slice(0, 2).map((a) => (
                <div key={a.id} className="px-5 py-3.5">
                  <p className="text-[14.5px] font-medium first-letter:uppercase">
                    {fmtDayLong(a.start)}, <span className="tnum">{fmtTime(a.start)}</span>
                  </p>
                  <p className="text-[13px] text-ink-3">{services.find((s) => s.id === a.serviceId)?.name}</p>
                  <StatusBadge status={a.status} className="mt-1.5" />
                </div>
              ))}
            </section>
          )}

          <section className="panel overflow-hidden">
            <h2 className="border-b border-line-2 px-5 py-3 text-[15px] font-semibold">Επόμενα</h2>
            <Upcoming vehicle={vehicle} reminders={reminders} />
          </section>
        </aside>
      </div>
    </div>
  );
}
