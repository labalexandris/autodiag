"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { Service } from "@/lib/types";
import type { SearchEntry } from "@/components/plate-search";
import { createPhoneBooking } from "@/app/admin/actions";
import { normalizePlate, formatPlate, isValidPlate } from "@/lib/plate";
import { Plate } from "@/components/plate";
import { toast } from "@/components/toast";
import { cn } from "@/lib/format";

function todayStr() {
  const d = new Date();
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Ραντεβού από τηλέφωνο: πινακίδα πρώτα, και αν είναι γνωστή, τα υπόλοιπα συμπληρώνονται μόνα τους. */
export function NewAppointment({ services, entries }: { services: Service[]; entries: SearchEntry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(params.get("new") === "1");
  const [plate, setPlate] = useState(params.get("plate") ?? "");
  const [serviceId, setServiceId] = useState(services[0].id);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("09:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [car, setCar] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  const known = useMemo(() => entries.find((e) => normalizePlate(e.plate) === normalizePlate(plate)), [plate, entries]);
  const plateOk = isValidPlate(plate);
  const valid = plateOk && (known || (name.trim() && phone.replace(/\D/g, "").length >= 10 && car.trim()));

  const close = () => {
    setOpen(false);
    if (params.get("new")) router.replace(pathname);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const [make, ...model] = car.trim().split(" ");
    start(async () => {
      await createPhoneBooking({
        plate: formatPlate(plate),
        serviceId,
        start: new Date(`${date}T${time}:00`).toISOString(),
        name: known?.owner ?? name.trim(),
        phone: known?.phone ?? phone.trim(),
        make: make ?? "",
        model: model.join(" "),
        notes: notes.trim() || undefined,
      });
      toast(`Το ραντεβού για το ${formatPlate(plate)} καταχωρήθηκε`);
      close();
      setPlate("");
      setNotes("");
    });
  };

  const times = Array.from({ length: 17 }, (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={17} /> Νέο ραντεβού
      </button>
      <dialog
        ref={dialog}
        onClose={close}
        onClick={(e) => e.target === dialog.current && close()}
        className="m-0 mt-auto max-h-[94dvh] w-full max-w-none overflow-hidden rounded-t-2xl bg-panel p-0 text-ink backdrop:bg-ink/40 sm:m-auto sm:max-w-[520px] sm:rounded-2xl"
        aria-labelledby="na-title"
      >
        <form onSubmit={submit} className="flex max-h-[94dvh] flex-col">
          <header className="flex items-center justify-between border-b border-line-2 px-5 py-4">
            <h2 id="na-title" className="font-cond text-[21px] font-semibold">Νέο ραντεβού</h2>
            <button type="button" className="btn btn-ghost btn-sm -mr-2" onClick={close} aria-label="Κλείσιμο">
              <X size={18} />
            </button>
          </header>
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
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
                <input className="field tnum" placeholder="Κινητό" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Κινητό" />
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

            <div className="grid grid-cols-[1fr_120px] gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-medium">Ημέρα</span>
                <input type="date" className="field tnum" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-medium">Ώρα</span>
                <select className="field tnum" value={time} onChange={(e) => setTime(e.target.value)}>
                  {times.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">Σημείωση <span className="font-normal text-ink-3">(προαιρετικό)</span></span>
              <textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Τι περιγράφει ο πελάτης" />
            </label>
          </div>
          <footer className="flex items-center justify-between gap-3 border-t border-line-2 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <span className={cn("text-[13px] text-ink-3")}>Θα σταλεί SMS επιβεβαίωσης</span>
            <button className="btn btn-primary" disabled={!valid || pending}>
              {pending ? "Αποθήκευση…" : "Καταχώρηση ραντεβού"}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
