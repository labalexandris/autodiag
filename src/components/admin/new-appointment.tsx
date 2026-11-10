"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import type { Service } from "@/lib/types";
import type { SearchEntry } from "@/components/plate-search";
import { createPhoneBooking } from "@/app/admin/actions";
import { normalizePlate, formatPlate, isValidPlate } from "@/lib/plate";
import { normalizePhone } from "@/lib/phone";
import { Plate } from "@/components/plate";
import { Sheet } from "@/components/sheet";
import { toast } from "@/components/toast";

const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Σήμερα, ή η επόμενη ημέρα που είναι ανοιχτό το συνεργείο. */
function nextOpenDay(openWeekdays: number[]) {
  const d = new Date();
  for (let i = 0; i < 7 && !openWeekdays.includes(d.getDay()); i++) d.setDate(d.getDate() + 1);
  return dateStr(d);
}

/**
 * Ραντεβού από τηλέφωνο: πινακίδα πρώτα, και αν είναι γνωστή, τα υπόλοιπα
 * συμπληρώνονται μόνα τους. Ανοίγει και από τη διεύθυνση:
 * `?new=1`, `?new=1&plate=ΙΚΒ4821`, `?new=1&at=2026-11-12T10:00` (κλικ σε κενή ώρα).
 * Η σελίδα περνά αυτές τις παραμέτρους ως `initial` και το ξαναδημιουργεί (key)
 * όταν αλλάζουν. Δεν διαβάζονται με useSearchParams, ώστε το κουμπί να μην
 * περιμένει Suspense για να ενεργοποιηθεί.
 */
export function NewAppointment({
  services,
  entries,
  times,
  openWeekdays,
  initial,
}: {
  services: Service[];
  entries: SearchEntry[];
  times: string[];
  openWeekdays: number[];
  initial: { open: boolean; plate?: string; at?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const at = initial.at?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);

  const [open, setOpen] = useState(initial.open);
  const [plate, setPlate] = useState(initial.plate ?? "");
  const [serviceId, setServiceId] = useState(services[0].id);
  const [date, setDate] = useState(at?.[1] ?? nextOpenDay(openWeekdays));
  const [time, setTime] = useState(at?.[2] ?? times[2] ?? times[0] ?? "09:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [car, setCar] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const known = useMemo(() => entries.find((e) => normalizePlate(e.plate) === normalizePlate(plate)), [plate, entries]);
  const plateOk = isValidPlate(plate);
  const valid = plateOk && !!date && (known || (name.trim().length > 2 && normalizePhone(phone) && car.trim()));
  const closedDay = !!date && !openWeekdays.includes(new Date(`${date}T12:00:00`).getDay());
  const timeOptions = times.includes(time) ? times : [time, ...times];

  const close = () => {
    setOpen(false);
    setError(null);
    if (initial.open) {
      // Κρατά την εβδομάδα που βλέπει ο χρήστης, βγάζει μόνο τις παραμέτρους του παραθύρου
      const rest = new URLSearchParams(window.location.search);
      ["new", "plate", "at"].forEach((k) => rest.delete(k));
      router.replace(rest.size ? `${pathname}?${rest}` : pathname);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const [make, ...model] = car.trim().split(" ");
    start(async () => {
      setError(null);
      const r = await createPhoneBooking({
        plate: formatPlate(plate),
        serviceId,
        start: new Date(`${date}T${time}:00`).toISOString(),
        name: known?.owner ?? name.trim(),
        phone: known?.phone ?? phone.trim(),
        make: make ?? "",
        model: model.join(" "),
        notes: notes.trim() || undefined,
      });
      if (!r.ok) return setError(r.error);
      toast(`Το ραντεβού για το ${formatPlate(plate)} καταχωρήθηκε`);
      setPlate("");
      setNotes("");
      close();
    });
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={17} /> Νέο ραντεβού
      </button>
      {open && (
        <Sheet
          title="Νέο ραντεβού"
          onClose={close}
          onSubmit={submit}
          footer={
            <>
              <span className="text-[13px] text-ink-3">Θα σταλεί SMS επιβεβαίωσης</span>
              <button className="btn btn-primary" disabled={!valid || pending}>
                {pending ? "Αποθήκευση…" : "Καταχώρηση ραντεβού"}
              </button>
            </>
          }
        >
          <div className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">Πινακίδα</span>
              <input
                className="field font-cond text-[19px] font-semibold uppercase tracking-[0.06em]"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="ΙΚΒ-4821"
                autoComplete="off"
                autoFocus
                list="known-plates"
              />
              <datalist id="known-plates">
                {entries.map((e) => (
                  <option key={e.plate} value={e.plate}>
                    {e.owner}
                  </option>
                ))}
              </datalist>
              {known ? (
                <span className="mt-2 flex items-center gap-2.5 rounded-lg bg-brand-soft px-3 py-2 text-[14px]">
                  <Plate plate={known.plate} size="xs" />
                  <span className="min-w-0 truncate">
                    {known.vehicle}, <span className="text-ink-2">{known.owner}</span>
                  </span>
                </span>
              ) : (
                plateOk && <span className="mt-1.5 block text-[13px] text-ink-2">Νέο όχημα. Συμπλήρωσε τα στοιχεία πελάτη.</span>
              )}
            </label>

            {plateOk && !known && (
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" placeholder="Ονοματεπώνυμο" value={name} onChange={(e) => setName(e.target.value)} aria-label="Ονοματεπώνυμο" />
                <input className="field tnum" placeholder="Τηλέφωνο" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Τηλέφωνο" />
                <input className="field sm:col-span-2" placeholder="Μάρκα και μοντέλο, π.χ. Fiat Panda" value={car} onChange={(e) => setCar(e.target.value)} aria-label="Μάρκα και μοντέλο" />
              </div>
            )}

            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">Υπηρεσία</span>
              <select className="field" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMin}′)
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[14px] font-medium">Ημέρα</span>
                  <input type="date" className="field tnum" value={date} onChange={(e) => setDate(e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[14px] font-medium">Ώρα</span>
                  <select className="field tnum" value={time} onChange={(e) => setTime(e.target.value)}>
                    {timeOptions.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>
              {closedDay && <p className="mt-1.5 text-[13px] text-[#8a6700]">Αυτή την ημέρα το συνεργείο είναι κλειστό. Καταχωρείται μόνο αν το θέλεις.</p>}
              {error && <p className="mt-1.5 text-[13px] text-fuse-red">{error}</p>}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">
                Σημείωση <span className="font-normal text-ink-3">(προαιρετικό)</span>
              </span>
              <textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Τι περιγράφει ο πελάτης" />
            </label>
          </div>
        </Sheet>
      )}
    </>
  );
}
