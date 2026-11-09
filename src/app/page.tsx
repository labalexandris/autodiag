import Link from "next/link";
import { Phone, Mail, Clock } from "lucide-react";
import { getServices, getShop } from "@/lib/data";
import { Logo } from "@/components/logo";
import { ServiceIcon } from "@/components/service-icon";
import { Plate } from "@/components/plate";

export default async function Home() {
  const [services, shop] = await Promise.all([getServices(), getShop()]);
  const tel = shop.phone.replace(/\s/g, "");

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line-2 bg-panel">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/admin" className="text-[14px] text-ink-2 hover:text-brand">
            Είσοδος συνεργείου
          </Link>
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

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="font-cond text-[28px] font-semibold">Εργασίες</h2>
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
                  </span>
                  <span className="self-center text-[14px] font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Κράτηση</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line-2 bg-panel">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-x-10 gap-y-3 px-4 py-8 text-[14px] text-ink-2 sm:px-6">
          <a href={`tel:${tel}`} className="flex items-center gap-2 hover:text-brand">
            <Phone size={16} className="text-ink-3" /> <span className="tnum">{shop.phone}</span>
          </a>
          <a href={`mailto:${shop.email}`} className="flex items-center gap-2 hover:text-brand">
            <Mail size={16} className="text-ink-3" /> {shop.email}
          </a>
          <span className="flex items-center gap-2">
            <Clock size={16} className="text-ink-3" /> Δευτέρα έως Παρασκευή, 8:00–17:00
          </span>
        </div>
      </footer>
    </div>
  );
}
