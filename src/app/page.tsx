import Link from "next/link";
import { Phone, Mail, Clock, MapPin, ChevronRight } from "lucide-react";
import { getServices, getShop } from "@/lib/data";
import { hoursSummary, weekdayName } from "@/lib/hours";
import { fmtDuration, fmtEUR } from "@/lib/format";
import { Logo } from "@/components/logo";
import { ServiceIcon } from "@/components/service-icon";
import { Plate } from "@/components/plate";

// Το «σήμερα» στο ωράριο ανανεώνεται κάθε ώρα
export const revalidate = 3600;

const steps = [
  ["Διαλέγεις εργασία και ώρα", "Βλέπεις τις ελεύθερες ώρες και κλείνεις σε ένα λεπτό, χωρίς τηλέφωνο."],
  ["Λαμβάνεις SMS", "Επιβεβαίωση αμέσως και υπενθύμιση την προηγούμενη μέρα. Από το ίδιο μήνυμα αλλάζεις ή ακυρώνεις."],
  ["Η εργασία γράφεται στο βιβλιάριο", "Τι έγινε, με ποια ανταλλακτικά και σε πόσα χιλιόμετρα. Το βλέπεις όποτε θες από το κινητό."],
];

export default async function Home() {
  const [services, shop] = await Promise.all([getServices(), getShop()]);
  const tel = shop.phone.replace(/\s/g, "");
  const week = [...shop.hours].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7));
  const today = new Date().getDay();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line-2 bg-panel">
        <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo height={48} />
          <div className="flex items-center gap-5">
            <a href={`tel:${tel}`} className="hidden items-center gap-2 text-[15px] font-medium hover:text-brand sm:flex">
              <Phone size={16} className="text-ink-3" /> <span className="tnum">{shop.phone}</span>
            </a>
            <Link href="/admin" className="text-[14px] text-ink-2 hover:text-brand">
              Είσοδος συνεργείου
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-line-2 bg-panel">
          <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-20">
            <div>
              <p className="text-[15px] text-ink-2">{shop.legalName}, {shop.tagline.toLowerCase()}</p>
              <h1 className="mt-3 max-w-[16ch] font-cond text-[44px] font-semibold leading-[1.02] tracking-[-0.015em] sm:text-[56px]">
                Κλείσε ραντεβού χωρίς τηλέφωνα
              </h1>
              <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed text-ink-2">
                Διαλέγεις εργασία και ώρα, και σου στέλνουμε SMS υπενθύμιση. Κάθε εργασία γράφεται στο ψηφιακό βιβλιάριο του αυτοκινήτου σου.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/book" className="btn btn-primary btn-lg">
                  Κλείσε ραντεβού
                </Link>
                <a href={`tel:${tel}`} className="btn btn-outline btn-lg">
                  <Phone size={17} /> <span className="tnum">{shop.phone}</span>
                </a>
              </div>
              <p className="mt-5 flex items-center gap-2 text-[14px] text-ink-2">
                <Clock size={15} className="text-ink-3" /> {hoursSummary(shop)}
              </p>
            </div>

            {/* Το βιβλιάριο σε μικρογραφία: τι παίρνει ο πελάτης */}
            <div className="relative mx-auto w-full max-w-[360px]" aria-hidden>
              <div className="rotate-[1.5deg] rounded-2xl border border-line-2 bg-bg p-5 shadow-[0_24px_48px_-28px_rgba(30,34,38,0.45)]">
                <Plate plate="ΙΚΒ-4821" size="md" />
                <p className="mt-3 text-[15px] font-medium">Toyota Yaris 1.0</p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    ["12 Οκτ", "Service A/C", "84.210 km"],
                    ["3 Μαΐ", "Νέα μπαταρία", "79.880 km"],
                    ["18 Ιαν", "Λυχνία check engine", "75.420 km"],
                  ].map(([d, t, k], i) => (
                    <li key={t} className="flex items-center gap-3 rounded-lg bg-panel px-3 py-2.5" style={{ opacity: 1 - i * 0.22 }}>
                      <span className="w-12 text-[12px] text-ink-3 tnum">{d}</span>
                      <span className="flex-1 text-[14px]">{t}</span>
                      <span className="text-[12px] text-ink-3 tnum">{k}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-lg bg-signal-soft px-3 py-2 text-[13px] text-ink-2">Αλλαγή λαδιών σε ~1.200 km</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6" aria-labelledby="how">
          <h2 id="how" className="font-cond text-[28px] font-semibold">Πώς δουλεύει</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {steps.map(([title, text], i) => (
              <li key={title} className="border-t-2 border-ink pt-4">
                <span className="font-cond text-[15px] font-semibold text-brand tnum">0{i + 1}</span>
                <h3 className="mt-1 text-[17px] font-semibold leading-snug">{title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="services">
          <h2 id="services" className="font-cond text-[28px] font-semibold">Εργασίες</h2>
          <ul className="mt-6 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.id}>
                <Link href={`/book?s=${s.id}`} className="group flex gap-4 border-b border-line py-4">
                  <span className="mt-0.5 text-brand">
                    <ServiceIcon category={s.category} id={s.id} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-medium group-hover:text-brand">{s.name}</span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-ink-2">{s.description}</span>
                    <span className="mt-1.5 block text-[13px] text-ink-3 tnum">
                      {fmtDuration(s.durationMin)}
                      {s.priceFrom !== undefined && <>, {s.priceFrom === 0 ? "δωρεάν τοποθέτηση" : `από ${fmtEUR(s.priceFrom)}`}</>}
                      {s.priceFrom === undefined && ", τιμή μετά από έλεγχο"}
                    </span>
                  </span>
                  {/* Πάντα ορατό: στο κινητό δεν υπάρχει hover */}
                  <span className="flex items-center gap-0.5 self-center text-[14px] font-medium text-brand">
                    <span className="max-sm:sr-only">Κράτηση</span>
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-line-2 bg-panel" aria-labelledby="find">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2">
            <div>
              <h2 id="find" className="font-cond text-[28px] font-semibold">Πού θα μας βρεις</h2>
              <ul className="mt-5 space-y-3.5 text-[15.5px]">
                <li className="flex gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-ink-3" />
                  <span>
                    {shop.address}
                    {shop.mapsUrl && (
                      <a href={shop.mapsUrl} target="_blank" rel="noopener" className="ml-2 font-medium text-brand underline underline-offset-2">
                        Οδηγίες στον χάρτη
                      </a>
                    )}
                  </span>
                </li>
                <li>
                  <a href={`tel:${tel}`} className="flex gap-3 hover:text-brand">
                    <Phone size={18} className="mt-0.5 shrink-0 text-ink-3" /> <span className="tnum">{shop.phone}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${shop.email}`} className="flex gap-3 hover:text-brand">
                    <Mail size={18} className="mt-0.5 shrink-0 text-ink-3" /> {shop.email}
                  </a>
                </li>
              </ul>
              <Link href="/book" className="btn btn-primary btn-lg mt-7">
                Κλείσε ραντεβού
              </Link>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold">Ωράριο</h3>
              <dl className="mt-3 divide-y divide-line-2 border-y border-line-2 text-[15px]">
                {week.map((h) => (
                  <div key={h.day} className={`flex items-center justify-between py-2.5 ${h.day === today ? "font-semibold" : ""}`}>
                    <dt>
                      {weekdayName(h.day)}
                      {h.day === today && <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 text-[12px] font-medium text-brand-ink">σήμερα</span>}
                    </dt>
                    <dd className={h.open ? "tnum" : "font-normal text-ink-3"}>{h.open ? `${h.open} – ${h.close}` : "Κλειστά"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line-2">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-x-10 gap-y-2 px-4 py-6 text-[13px] text-ink-3 sm:px-6">
          <span>
            {shop.legalName}, {shop.tagline}
          </span>
          <span>{hoursSummary(shop)}</span>
        </div>
      </footer>
    </div>
  );
}
