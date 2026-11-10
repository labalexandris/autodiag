import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CalendarDays, Gauge, MapPin, Phone } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-server";
import { shop } from "@/lib/config";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Είσοδος συνεργείου", robots: { index: false } };
export const dynamic = "force-dynamic";

const features = [
  { icon: CalendarDays, text: "Ραντεβού online, όλο το 24ωρο" },
  { icon: Gauge, text: "Το πρόγραμμα της ημέρας ανά θέση" },
  { icon: BookOpen, text: "Ψηφιακό βιβλιάριο για κάθε πινακίδα" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next ?? "/admin";
  if (await getCurrentUser().catch(() => undefined)) redirect(next.startsWith("/admin") ? next : "/admin");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Οθόνη παλμογράφου: στο κινητό μπάντα στην κορυφή, στο desktop το αριστερό μισό */}
      <aside className="scope relative isolate flex flex-col justify-between overflow-hidden bg-ink px-6 pb-24 pt-8 text-white sm:px-10 sm:pb-28 lg:px-14 lg:py-14">
        <Trace />
        <div className="relative">
          <p className="font-cond text-[13px] font-medium uppercase tracking-[0.18em] text-signal">{shop.tagline}</p>
          <h2 className="mt-3 max-w-[16ch] font-cond text-[30px] font-semibold leading-[1.05] sm:text-[38px] lg:text-[52px]">
            Το συνεργείο σας, σε μία οθόνη.
          </h2>
          <ul className="mt-10 hidden space-y-3.5 lg:block">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-[16px] text-white/85">
              <span className="grid size-9 place-items-center rounded-lg bg-white/10 text-signal ring-1 ring-white/10">
                <Icon size={18} />
              </span>
              {text}
            </li>
          ))}
          </ul>
        </div>
        <div className="relative mt-10 hidden flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/55 lg:flex">
          <span className="flex items-center gap-1.5">
            <MapPin size={14} /> {shop.legalName}, {shop.address}
          </span>
          <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-white">
            <Phone size={14} /> <span className="tnum">{shop.phone}</span>
          </a>
        </div>
      </aside>

      <main className="flex items-start justify-center bg-panel px-5 py-8 sm:items-center sm:px-10 sm:py-14">
        <div className="w-full max-w-[400px]">
          <Link href="/" aria-label="Αρχική" className="inline-block">
            <Logo height={56} />
          </Link>
          <h1 className="mt-8 font-cond text-[32px] font-semibold leading-tight">Καλώς ήρθες</h1>
          <p className="mt-1.5 text-[15px] text-ink-2">Μπες με το όνομα χρήστη και τον κωδικό σου.</p>
          <LoginForm next={next} />
          <div className="mt-8 space-y-2 border-t border-line pt-5 text-[13.5px] text-ink-3">
            <p>Ξέχασες τον κωδικό; Ζήτα από έναν ιδιοκτήτη να σου βάλει νέο από τις Ρυθμίσεις.</p>
            <p>
              Ήρθες για ραντεβού;{" "}
              <Link href="/book" className="font-medium text-brand underline-offset-2 hover:underline">
                Κλείσε εδώ
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Κυματομορφή που «τρέχει» πάνω στο πλέγμα, σαν στο διαγνωστικό. */
function Trace() {
  // Παλμοί σαν σήμα αισθητήρα: επίπεδο, απότομη άνοδος, ταλάντωση, πίσω στη βάση
  const d =
    "M0 160 H90 L104 160 L112 70 L122 230 L132 120 L142 180 L152 150 L162 165 H300 L314 160 L322 70 L332 230 L342 120 L352 180 L362 150 L372 165 H510 L524 160 L532 70 L542 230 L552 120 L562 180 L572 150 L582 165 H720 L734 160 L742 70 L752 230 L762 120 L772 180 L782 150 L792 165 H930 L944 160 L952 70 L962 230 L972 120 L982 180 L992 150 L1002 165 H1260";
  return (
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[34%] w-full opacity-90 lg:bottom-[11%] lg:h-[26%]" viewBox="0 0 840 300" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="fade" x1="0" x2="1">
          <stop offset="0" stopColor="var(--signal)" stopOpacity="0" />
          <stop offset="0.25" stopColor="var(--signal)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--signal)" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <g className="trace-run">
        <path d={d} fill="none" stroke="var(--signal)" strokeWidth="6" opacity="0.35" filter="url(#glow)" vectorEffect="non-scaling-stroke" />
        <path d={d} fill="none" stroke="url(#fade)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
