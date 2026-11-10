import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { canCustomerChange, CUSTOMER_CHANGE_HOURS, getAppointmentByToken, getAvailability, getService, getShop, getVehicle } from "@/lib/data";
import { fmtDayLong, fmtDuration, fmtTime } from "@/lib/format";
import { normalizePlate } from "@/lib/plate";
import { Logo } from "@/components/logo";
import { Plate } from "@/components/plate";
import { StatusBadge } from "@/components/status";
import { ManageAppointment } from "./manage";

export const metadata = { title: "Το ραντεβού μου", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Ο πελάτης βλέπει, αλλάζει ή ακυρώνει το ραντεβού του (σύνδεσμος από το SMS). */
export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const appt = await getAppointmentByToken(token);
  if (!appt) notFound();
  const [service, vehicle, shop] = await Promise.all([getService(appt.serviceId), getVehicle(appt.vehicleId), getShop()]);
  if (!service || !vehicle) notFound();

  const changeable = canCustomerChange(appt);
  const days = changeable ? await getAvailability(service.id, 14, appt.id) : [];
  const tel = shop.phone.replace(/\s/g, "");
  const over = appt.status === "done" || appt.status === "no_show" || appt.status === "cancelled";

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line-2 bg-panel">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Αρχική">
            <Logo />
          </Link>
          <a href={`tel:${tel}`} className="flex items-center gap-2 text-[14px] text-ink-2 hover:text-brand">
            <Phone size={16} /> <span className="tnum">{shop.phone}</span>
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <section>
          <p className="text-[14px] text-ink-3">Το ραντεβού σου</p>
          <h1 className="mt-1 font-cond text-[30px] font-semibold leading-tight sm:text-[36px]">
            <span className="first-letter:uppercase">{fmtDayLong(appt.start)}</span>, <span className="tnum">{fmtTime(appt.start)}</span>
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Plate plate={vehicle.plate} size="md" />
            <span className="text-[15px]">
              {service.name}, περίπου {fmtDuration(service.durationMin, true)}
            </span>
          </div>
          <StatusBadge status={appt.status} className="mt-4 text-[14px]" />
          {appt.status === "pending" && <p className="mt-1 text-[14px] text-ink-2">Το συνεργείο θα επιβεβαιώσει την ώρα και θα λάβεις SMS.</p>}
        </section>

        {changeable ? (
          <ManageAppointment token={token} current={appt.start} days={days} phone={shop.phone} needsApproval={service.requiresApproval} />
        ) : over ? (
          <div className="panel p-5">
            <p className="text-[15px]">
              {appt.status === "cancelled" ? "Το ραντεβού έχει ακυρωθεί." : appt.status === "done" ? "Η εργασία ολοκληρώθηκε." : "Το ραντεβού έχει περάσει."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/book?plate=${encodeURIComponent(normalizePlate(vehicle.plate))}`} className="btn btn-primary">
                Κλείσε νέο ραντεβού
              </Link>
              {appt.status === "done" && (
                <Link href={`/b/${vehicle.shareToken}`} className="btn btn-outline">
                  Το βιβλιάριο του αυτοκινήτου
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="panel p-5">
            <p className="text-[15px]">
              {appt.status === "in_progress"
                ? "Το αυτοκίνητο είναι ήδη στο συνεργείο."
                : `Απομένουν λιγότερες από ${CUSTOMER_CHANGE_HOURS} ώρες, οπότε η αλλαγή γίνεται μόνο τηλεφωνικά.`}
            </p>
            <a href={`tel:${tel}`} className="btn btn-primary mt-4">
              <Phone size={17} /> <span className="tnum">{shop.phone}</span>
            </a>
          </div>
        )}

        <p className="text-[12.5px] text-ink-3">
          {shop.legalName}, {shop.tagline}. Ο σύνδεσμος είναι προσωπικός. Μην τον κοινοποιείς.
        </p>
      </main>
    </div>
  );
}
