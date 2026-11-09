import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { getRecordsForVehicle, getRemindersForVehicle, getShop, getVehicleByToken } from "@/lib/data";
import { Logo } from "@/components/logo";
import { Plate } from "@/components/plate";
import { Odometer } from "@/components/booklet/odometer";
import { Timeline } from "@/components/booklet/timeline";
import { Upcoming } from "@/components/booklet/upcoming";

export const metadata = { title: "Βιβλιάριο οχήματος", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Το βιβλιάριο όπως το βλέπει ο πελάτης (σύνδεσμος από SMS ή QR). */
export default async function PublicBooklet({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const vehicle = await getVehicleByToken(token);
  if (!vehicle) notFound();
  const [records, reminders, shop] = await Promise.all([getRecordsForVehicle(vehicle.id), getRemindersForVehicle(vehicle.id), getShop()]);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line-2 bg-panel">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-[14px] text-ink-2 hover:text-brand">
            <Phone size={16} /> <span className="tnum">{shop.phone}</span>
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        <section className="flex flex-col items-start gap-5">
          <p className="text-[14px] text-ink-3">Ψηφιακό βιβλιάριο</p>
          <Plate plate={vehicle.plate} size="xl" />
          <div>
            <h1 className="font-cond text-[30px] font-semibold leading-tight">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="mt-1 text-[15px] text-ink-2">{[vehicle.engine, vehicle.fuel, vehicle.year].filter(Boolean).join(", ")}</p>
          </div>
          <Odometer km={vehicle.km} />
        </section>

        <section className="panel overflow-hidden">
          <h2 className="flex items-center justify-between border-b border-line-2 px-5 py-3 text-[15px] font-semibold">
            Επόμενα
            <Link href="/book" className="text-[14px] font-medium text-brand hover:underline">
              Κλείσε ραντεβού
            </Link>
          </h2>
          <Upcoming vehicle={vehicle} reminders={reminders} />
        </section>

        <section>
          <h2 className="mb-4 text-[18px] font-semibold">Ιστορικό εργασιών</h2>
          <Timeline records={records} />
        </section>

        <p className="text-center text-[12.5px] text-ink-3">
          {shop.legalName}, {shop.tagline}. Ο σύνδεσμος είναι προσωπικός. Μην τον κοινοποιείς.
        </p>
      </main>
    </div>
  );
}
