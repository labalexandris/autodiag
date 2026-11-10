import { getBays, getServices, getShop, getSmsTemplates } from "@/lib/data";
import { fmtEUR } from "@/lib/format";
import { SmsTemplates } from "@/components/admin/sms-templates";
import { CalendarConnect } from "@/components/admin/calendar-connect";

export const metadata = { title: "Ρυθμίσεις" };

const dayNames = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];

export default async function SettingsPage() {
  const [shop, services, bays, templates] = await Promise.all([getShop(), getServices(), getBays(), getSmsTemplates()]);
  const hours = [...shop.hours].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7));

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-cond text-[32px] font-semibold leading-none sm:text-[38px]">Ρυθμίσεις</h1>
        <p className="mt-2.5 text-[15px] text-ink-2">Ημερολόγιο, μηνύματα και ό,τι βλέπει ο πελάτης όταν κλείνει ραντεβού.</p>
      </header>

      <Section id="calendar" title="Ημερολόγιο κινητού" desc="Τα ραντεβού εμφανίζονται στο ημερολόγιο του τηλεφώνου σου.">
        <div className="panel p-5">
          <CalendarConnect />
        </div>
      </Section>

      <Section id="sms" title="Μηνύματα SMS" desc="Στέλνονται αυτόματα. Ο αποστολέας εμφανίζεται ως AUTODIAG.">
        <div className="panel overflow-hidden">
          <SmsTemplates initial={templates} />
        </div>
      </Section>

      <Section title="Υπηρεσίες για online κράτηση" desc="Η διάρκεια καθορίζει τις διαθέσιμες ώρες. Όσες θέλουν έγκριση μπαίνουν στα «Αιτήματα online».">
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="text-[13px] text-ink-3">
              <tr className="border-b border-line-2">
                <th className="px-5 py-2.5 font-normal">Υπηρεσία</th>
                <th className="px-3 py-2.5 font-normal">Διάρκεια</th>
                <th className="px-3 py-2.5 font-normal">Τιμή από</th>
                <th className="px-5 py-2.5 font-normal">Επιβεβαίωση</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-3 py-3 tnum">{s.durationMin}′</td>
                  <td className="px-3 py-3 tnum">{s.priceFrom === 0 ? "Δωρεάν τοποθέτηση" : s.priceFrom ? fmtEUR(s.priceFrom) : <span className="text-ink-3">Μετά από έλεγχο</span>}</td>
                  <td className="px-5 py-3">{s.requiresApproval ? <span className="text-[#8a6700]">Χειροκίνητη</span> : <span className="text-ink-2">Αυτόματη</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-10 lg:grid-cols-2">
        <Section title="Ωράριο">
          <div className="panel divide-y divide-line-2">
            {hours.map((h) => (
              <div key={h.day} className="flex items-center justify-between px-5 py-2.5 text-[14px]">
                <span>{dayNames[h.day]}</span>
                <span className={h.open ? "tnum" : "text-ink-3"}>{h.open ? `${h.open} – ${h.close}` : "Κλειστά"}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Θέσεις εργασίας" desc="Πόσα αυτοκίνητα δουλεύονται ταυτόχρονα.">
          <div className="panel divide-y divide-line-2">
            {bays.map((b, i) => (
              <div key={b.id} className="flex items-center justify-between px-5 py-2.5 text-[14px]">
                <span>{b.name}</span>
                <span className="text-ink-3">{i === 2 ? "Διαγνωστικά, A/C" : "Όλες οι εργασίες"}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ id, title, desc, children }: { id?: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-3">
      <div>
        <h2 className="text-[18px] font-semibold">{title}</h2>
        {desc && <p className="mt-0.5 max-w-[70ch] text-[14px] text-ink-2">{desc}</p>}
      </div>
      {children}
    </section>
  );
}
