import Link from "next/link";
import { Phone } from "lucide-react";
import { getAvailability, getServices, getShop } from "@/lib/data";
import { Logo } from "@/components/logo";
import { BookingFlow } from "./booking-flow";

export const metadata = { title: "Κλείσε ραντεβού" };
export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ s?: string; plate?: string }> }) {
  const [services, shop] = await Promise.all([getServices(), getShop()]);
  const availability = Object.fromEntries(await Promise.all(services.map(async (s) => [s.id, await getAvailability(s.id, 14)] as const)));
  const { s: preselect, plate } = await searchParams;

  return (
    <div className="relative min-h-dvh bg-bg font-book">
      {/* Απαλό φως στην κορυφή */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(70%_100%_at_30%_0%,var(--brand-soft),transparent_70%)]" />
      <header className="relative border-b border-line-2/70 bg-panel/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Αρχική">
            <Logo />
          </Link>
          <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 rounded-full border border-line-2 bg-panel px-3.5 py-1.5 text-[14px] font-semibold text-ink-2 transition-colors hover:border-brand hover:text-brand">
            <Phone size={16} />
            <span className="tnum">{shop.phone}</span>
          </a>
        </div>
      </header>
      <div className="relative">
        <BookingFlow services={services} availability={availability} shop={shop} preselect={preselect} initialPlate={plate} />
      </div>
    </div>
  );
}
