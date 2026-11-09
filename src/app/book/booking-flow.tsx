"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, Check, CalendarPlus, Clock, MessageSquareText, Phone } from "lucide-react";
import type { Service, Shop } from "@/lib/types";
import { isValidPlate } from "@/lib/plate";
import { fmtEUR, fmtDuration, fmtTime, fmtDayLong, fmtDayShort, fmtDayNum, fmtMonthShort, cn } from "@/lib/format";
import { ServiceIcon } from "@/components/service-icon";
import { PlateInput } from "@/components/plate-input";
import { Plate } from "@/components/plate";
import { lookupPlate, submitBooking } from "./actions";

type Day = { date: string; slots: string[]; closed: boolean };
type Result = Extract<Awaited<ReturnType<typeof submitBooking>>, { ok: true }>;

const steps = ["Υπηρεσία", "Όχημα", "Ημέρα και ώρα", "Στοιχεία", "Επιβεβαίωση"];

export function BookingFlow({
  services,
  availability,
  shop,
  preselect,
}: {
  services: Service[];
  availability: Record<string, Day[]>;
  shop: Shop;
  preselect?: string;
}) {
  const initialService = services.find((s) => s.id === preselect);
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [serviceId, setServiceId] = useState<string | undefined>(initialService?.id);
  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [lookup, setLookup] = useState<{ plate: string; found: boolean }>({ plate: "", found: false });
  const firstOpenDay = (id?: string) => (id ? availability[id].find((d) => d.slots.length)?.date : undefined);
  const [day, setDay] = useState<string | undefined>(firstOpenDay(initialService?.id));
  const [slot, setSlot] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(true);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const service = services.find((s) => s.id === serviceId);
  const days = serviceId ? availability[serviceId] : [];
  const selectedDay = days.find((d) => d.date === day);

  const known = lookup.plate === plate && lookup.found;

  // Αναζήτηση πινακίδας για προσυμπλήρωση
  useEffect(() => {
    if (!isValidPlate(plate)) return;
    let live = true;
    lookupPlate(plate).then((r) => {
      if (!live) return;
      setLookup({ plate, found: !!r });
      if (r) {
        setMake(r.make);
        setModel(r.model);
      }
    });
    return () => {
      live = false;
    };
  }, [plate]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, result]);

  const phoneOk = phone.replace(/\D/g, "").length === 10;
  const canNext = [
    !!serviceId,
    isValidPlate(plate) && make.trim().length > 1,
    !!slot,
    name.trim().split(" ").length >= 1 && name.trim().length > 2 && phoneOk,
    true,
  ][step];

  const next = () => {
    if (!canNext) {
      setTouched(true);
      return;
    }
    setTouched(false);
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const submit = () =>
    start(async () => {
      setError(null);
      const r = await submitBooking({
        serviceId: serviceId!,
        start: slot!,
        plate,
        make: make.trim(),
        model: model.trim(),
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        smsConsent: consent,
      });
      if (r.ok) setResult(r);
      else setError(r.error);
    });

  const slotGroups = useMemo(() => {
    const s = selectedDay?.slots ?? [];
    return [
      { label: "Πρωί", items: s.filter((x) => new Date(x).getHours() < 12) },
      { label: "Μεσημέρι", items: s.filter((x) => new Date(x).getHours() >= 12) },
    ].filter((g) => g.items.length);
  }, [selectedDay]);

  if (result) return <Success result={result} plate={plate} shop={shop} />;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-32 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        {/* Βήματα */}
        <ol className="mb-8 flex items-center gap-1.5" aria-label="Βήματα κράτησης">
          {steps.map((label, i) => (
            <li key={label} className="flex flex-1 flex-col gap-1.5">
              <span className={cn("h-1 rounded-full transition-colors", i <= step ? "bg-brand" : "bg-line")} />
              <span className={cn("hidden text-[12px] sm:block", i === step ? "font-medium text-ink" : "text-ink-3")}>
                {i + 1}. {label}
              </span>
            </li>
          ))}
        </ol>
        <p className="mb-1 text-[13px] text-ink-3 sm:hidden">
          Βήμα {step + 1} από {steps.length}
        </p>

        <div key={step} className="animate-rise">
          {step === 0 && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="font-cond text-[30px] font-semibold leading-tight outline-none sm:text-[36px]">
                Τι χρειάζεται το αυτοκίνητο;
              </h1>
              <p className="mt-1.5 text-[15px] text-ink-2">Αν δεν ξέρεις τι φταίει, διάλεξε «Διάγνωση βλαβών» και θα το βρούμε.</p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {services.map((s) => {
                  const sel = s.id === serviceId;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => {
                          if (s.id !== serviceId) {
                            setServiceId(s.id);
                            setDay(firstOpenDay(s.id));
                            setSlot(undefined);
                          }
                          setTimeout(() => setStep(1), 140);
                        }}
                        aria-pressed={sel}
                        className={cn(
                          "flex h-full w-full gap-3.5 rounded-xl border bg-panel p-4 text-left transition-[border-color,box-shadow]",
                          sel ? "border-brand shadow-[0_0_0_3px_var(--brand-soft)]" : "border-line-2 hover:border-line",
                        )}
                      >
                        <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", sel ? "bg-brand text-white" : "bg-brand-soft text-brand")}>
                          <ServiceIcon category={s.category} id={s.id} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[16px] font-medium leading-tight">{s.name}</span>
                          <span className="mt-1 block text-[13.5px] leading-snug text-ink-2">{s.description}</span>
                          <span className="mt-2 flex gap-3 text-[13px] text-ink-3">
                            <span className="inline-flex items-center gap-1 tnum">
                              <Clock size={13} /> {fmtDuration(s.durationMin)}
                            </span>
                            {s.priceFrom !== undefined && (
                              <span className="tnum">{s.priceFrom === 0 ? "Δωρεάν τοποθέτηση" : `από ${fmtEUR(s.priceFrom)}`}</span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {step === 1 && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="font-cond text-[30px] font-semibold leading-tight outline-none sm:text-[36px]">
                Ποια είναι η πινακίδα;
              </h1>
              <p className="mt-1.5 text-[15px] text-ink-2">Με την πινακίδα κρατάμε το ιστορικό του αυτοκινήτου στο ψηφιακό του βιβλιάριο.</p>
              <div className="mt-7">
                <label htmlFor="plate" className="sr-only">
                  Πινακίδα
                </label>
                <PlateInput id="plate" value={plate} onChange={setPlate} invalid={touched && !isValidPlate(plate)} autoFocus />
                {touched && !isValidPlate(plate) && <p className="mt-2 text-[14px] text-fuse-red">Γράψε 3 γράμματα και 4 αριθμούς, π.χ. ΙΚΒ-4821.</p>}
                {known && (
                  <p className="animate-rise mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2 text-[14px] text-brand-ink">
                    <Check size={16} /> Το αυτοκίνητο υπάρχει ήδη στο βιβλιάριό μας.
                  </p>
                )}
              </div>
              <div className="mt-7 grid max-w-md gap-4 sm:grid-cols-2">
                <Field label="Μάρκα" error={touched && make.trim().length < 2 ? "Συμπλήρωσε τη μάρκα" : undefined}>
                  <input className="field" value={make} onChange={(e) => setMake(e.target.value)} placeholder="π.χ. Toyota" list="makes" />
                  <datalist id="makes">
                    {["Toyota", "Volkswagen", "Peugeot", "Opel", "Fiat", "Hyundai", "Nissan", "Skoda", "Citroën", "Suzuki", "Kia", "Renault", "Mercedes-Benz", "BMW", "Ford", "Mazda", "Seat", "Dacia", "Honda", "Audi"].map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Μοντέλο" optional>
                  <input className="field" value={model} onChange={(e) => setModel(e.target.value)} placeholder="π.χ. Yaris" />
                </Field>
              </div>
            </>
          )}

          {step === 2 && service && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="font-cond text-[30px] font-semibold leading-tight outline-none sm:text-[36px]">
                Πότε σε βολεύει;
              </h1>
              <p className="mt-1.5 text-[15px] text-ink-2">
                {service.name}, περίπου {fmtDuration(service.durationMin, true)}.
              </p>
              <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                <div className="flex gap-2" role="radiogroup" aria-label="Ημέρα">
                  {days.map((d) => {
                    const sel = d.date === day;
                    const disabled = d.closed || d.slots.length === 0;
                    return (
                      <button
                        key={d.date}
                        role="radio"
                        aria-checked={sel}
                        disabled={disabled}
                        onClick={() => {
                          setDay(d.date);
                          setSlot(undefined);
                        }}
                        className={cn(
                          "flex w-[62px] shrink-0 flex-col items-center rounded-xl border py-2.5 transition-colors",
                          sel ? "border-brand bg-brand text-white" : "border-line-2 bg-panel hover:border-line",
                          disabled && "cursor-not-allowed border-transparent bg-transparent text-ink-3/60 hover:border-transparent",
                        )}
                      >
                        <span className={cn("text-[12px] capitalize", sel ? "text-white/80" : "text-ink-3")}>{fmtDayShort(d.date)}</span>
                        <span className="font-cond text-[22px] font-semibold leading-tight tnum">{fmtDayNum(d.date)}</span>
                        <span className={cn("text-[11px]", sel ? "text-white/80" : "text-ink-3")}>{d.closed ? "κλειστά" : d.slots.length === 0 ? "πλήρες" : fmtMonthShort(d.date)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDay && (
                <div className="mt-6 space-y-5">
                  <p className="text-[15px] font-medium first-letter:uppercase">{fmtDayLong(selectedDay.date)}</p>
                  {slotGroups.map((g) => (
                    <div key={g.label}>
                      <p className="mb-2 text-[13px] text-ink-3">{g.label}</p>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label={`Ώρες, ${g.label}`}>
                        {g.items.map((s) => (
                          <button
                            key={s}
                            role="radio"
                            aria-checked={slot === s}
                            onClick={() => setSlot(s)}
                            className={cn(
                              "h-11 rounded-lg border text-[15px] font-medium tnum transition-colors",
                              slot === s ? "border-brand bg-brand text-white" : "border-line-2 bg-panel hover:border-brand hover:text-brand",
                            )}
                          >
                            {fmtTime(s)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {touched && !slot && <p className="mt-4 text-[14px] text-fuse-red">Διάλεξε μια ώρα για να συνεχίσεις.</p>}
            </>
          )}

          {step === 3 && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="font-cond text-[30px] font-semibold leading-tight outline-none sm:text-[36px]">
                Πού να σε ενημερώσουμε;
              </h1>
              <p className="mt-1.5 text-[15px] text-ink-2">Θα λάβεις SMS με την επιβεβαίωση και μια υπενθύμιση την προηγούμενη μέρα.</p>
              <div className="mt-6 grid max-w-md gap-4">
                <Field label="Ονοματεπώνυμο" error={touched && name.trim().length < 3 ? "Συμπλήρωσε το όνομά σου" : undefined}>
                  <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </Field>
                <Field label="Κινητό" error={touched && !phoneOk ? "Το κινητό πρέπει να έχει 10 ψηφία" : undefined}>
                  <div className="flex">
                    <span className="grid place-items-center rounded-l-lg border border-r-0 border-line bg-sunk px-3 text-[15px] text-ink-2 tnum">+30</span>
                    <input className="field rounded-l-none tnum" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel-national" placeholder="69XX XXX XXX" />
                  </div>
                </Field>
                <Field label="Email" optional>
                  <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </Field>
                <Field label="Τι παρατηρείς;" optional>
                  <textarea className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="π.χ. ανάβει η λυχνία μπαταρίας όταν ανάβω τα φώτα" />
                </Field>
                <label className="flex items-start gap-3 text-[14px] text-ink-2">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-[18px] accent-[var(--brand)]" />
                  <span>Θέλω υπενθύμιση με SMS για το ραντεβού. Τα στοιχεία χρησιμοποιούνται μόνο από το συνεργείο.</span>
                </label>
              </div>
            </>
          )}

          {step === 4 && service && slot && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="font-cond text-[30px] font-semibold leading-tight outline-none sm:text-[36px]">
                Έλεγξε και κλείσε το ραντεβού
              </h1>
              <dl className="panel mt-6 divide-y divide-line-2">
                <Row label="Υπηρεσία" onEdit={() => setStep(0)}>
                  {service.name}
                </Row>
                <Row label="Όχημα" onEdit={() => setStep(1)}>
                  <span className="flex flex-wrap items-center gap-2.5">
                    <Plate plate={plate} size="sm" /> {make} {model}
                  </span>
                </Row>
                <Row label="Ημέρα και ώρα" onEdit={() => setStep(2)}>
                  <span className="first-letter:uppercase">{fmtDayLong(slot)}</span>, <span className="tnum">{fmtTime(slot)}</span>
                </Row>
                <Row label="Στοιχεία" onEdit={() => setStep(3)}>
                  {name}, <span className="tnum">{phone}</span>
                </Row>
                {notes && (
                  <Row label="Σημείωση" onEdit={() => setStep(3)}>
                    {notes}
                  </Row>
                )}
              </dl>
              {service.requiresApproval && (
                <p className="mt-4 flex gap-2.5 rounded-lg bg-signal-soft px-4 py-3 text-[14px] text-ink-2">
                  <MessageSquareText size={18} className="mt-0.5 shrink-0 text-[#9a7400]" />
                  Για αυτή την εργασία το συνεργείο επιβεβαιώνει την ώρα. Θα λάβεις SMS μέσα στη μέρα.
                </p>
              )}
              {error && <p className="mt-4 rounded-lg bg-[#fcecec] px-4 py-3 text-[14px] text-[#a3312e]">{error}</p>}
            </>
          )}
        </div>
      </div>

      {/* Σύνοψη (desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-8 space-y-4">
          <div className="panel p-5">
            <p className="text-[13px] text-ink-3">Το ραντεβού σου</p>
            <ul className="mt-3 space-y-3 text-[14px]">
              <li className={service ? "" : "text-ink-3"}>{service?.name ?? "Υπηρεσία"}</li>
              <li>{isValidPlate(plate) ? <Plate plate={plate} size="sm" /> : <span className="text-ink-3">Πινακίδα</span>}</li>
              <li className={slot ? "" : "text-ink-3"}>
                {slot ? (
                  <>
                    <span className="first-letter:uppercase">{fmtDayLong(slot)}</span>, <span className="font-semibold tnum">{fmtTime(slot)}</span>
                  </>
                ) : (
                  "Ημέρα και ώρα"
                )}
              </li>
            </ul>
          </div>
          <p className="px-1 text-[13px] leading-relaxed text-ink-3">
            Προτιμάς τηλεφωνικά;{" "}
            <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="text-ink-2 underline underline-offset-2 hover:text-brand">
              {shop.phone}
            </a>
            , Δευτέρα με Παρασκευή 8:00–17:00.
          </p>
        </div>
      </aside>

      {/* Γραμμή ενεργειών */}
      {step > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line-2 bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={17} /> Πίσω
            </button>
            {step < steps.length - 1 ? (
              <button className="btn btn-primary btn-lg min-w-36" onClick={next} aria-disabled={!canNext}>
                Συνέχεια
              </button>
            ) : (
              <button className="btn btn-primary btn-lg min-w-44" onClick={submit} disabled={pending}>
                {pending ? "Κλείνει…" : "Κλείσε το ραντεβού"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, optional, error, children }: { label: string; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium">
        {label} {optional && <span className="font-normal text-ink-3">(προαιρετικό)</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-[13px] text-fuse-red">{error}</span>}
    </label>
  );
}

function Row({ label, children, onEdit }: { label: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <dt className="text-[13px] text-ink-3">{label}</dt>
        <dd className="mt-0.5 text-[15px]">{children}</dd>
      </div>
      <button onClick={onEdit} className="shrink-0 text-[14px] font-medium text-brand hover:underline">
        Αλλαγή
      </button>
    </div>
  );
}

function Success({ result, plate, shop }: { result: Result; plate: string; shop: Shop }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const pending = result.status === "pending";

  const downloadIcs = () => {
    const f = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AutoDiag//Booking//EL",
      "BEGIN:VEVENT",
      `UID:${result.id}@autodiag.gr`,
      `DTSTAMP:${f(new Date().toISOString())}`,
      `DTSTART:${f(result.start)}`,
      `DTEND:${f(result.end)}`,
      `SUMMARY:AutoDiag: ${result.service} (${plate})`,
      `DESCRIPTION:Τηλέφωνο συνεργείου ${shop.phone}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "autodiag-rantevou.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-12 text-center sm:pt-16">
      <div className="relative mx-auto w-fit">
        <Plate plate={plate} size="lg" />
        <span
          className={cn(
            "animate-stamp absolute -right-8 -top-6 flex flex-col items-center rounded-md border-[2.5px] bg-panel/85 px-2.5 py-1 font-cond leading-none",
            pending ? "border-[#b48a0c] text-[#9a7400]" : "border-brand text-brand",
          )}
          style={{ animationDelay: "150ms" }}
          aria-hidden
        >
          <span className="text-[13px] font-bold tracking-[0.08em]">{pending ? "ΑΙΤΗΜΑ" : "ΚΛΕΙΣΤΗΚΕ"}</span>
          <span className="text-[11px] tnum">{fmtDayNum(result.start)} {fmtMonthShort(result.start)}</span>
        </span>
      </div>
      <h1 ref={ref} tabIndex={-1} className="mt-10 font-cond text-[30px] font-semibold leading-tight outline-none sm:text-[34px]">
        {pending ? "Λάβαμε το αίτημά σου" : "Το ραντεβού κλείστηκε"}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-[15.5px] text-ink-2">
        {result.service}, <span className="first-letter:uppercase">{fmtDayLong(result.start)}</span> στις <span className="font-semibold text-ink tnum">{fmtTime(result.start)}</span>.{" "}
        {pending ? "Θα σου στείλουμε SMS μόλις επιβεβαιώσουμε την ώρα." : "Θα λάβεις SMS υπενθύμισης την προηγούμενη μέρα."}
      </p>
      <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
        <button className="btn btn-primary btn-lg" onClick={downloadIcs}>
          <CalendarPlus size={18} /> Προσθήκη στο ημερολόγιο
        </button>
        <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="btn btn-outline btn-lg">
          <Phone size={17} /> Κλήση στο συνεργείο
        </a>
      </div>
    </div>
  );
}
