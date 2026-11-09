import Link from "next/link";
import { Phone } from "lucide-react";
import { getAvailability, getServices, getShop } from "@/lib/data";
import { Logo } from "@/components/logo";
import { BookingFlow } from "./booking-flow";

export const metadata = { title: "Κλείσε ραντεβού" };
export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const [services, shop] = await Promise.all([getServices(), getShop()]);
  const availability = Object.fromEntries(await Promise.all(services.map(async (s) => [s.id, await getAvailability(s.id, 14)] as const)));
  const preselect = (await searchParams).s;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line-2 bg-panel">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Αρχική">
            <Logo />
          </Link>
          <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-[14px] font-medium text-ink-2 hover:text-brand">
            <Phone size={16} />
            <span className="tnum">{shop.phone}</span>
          </a>
        </div>
      </header>
      <BookingFlow services={services} availability={availability} shop={shop} preselect={preselect} />
    </div>
  );
}
