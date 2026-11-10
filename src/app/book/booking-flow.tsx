"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowLeft, ArrowRight, CalendarPlus, Check, Clock, MessageSquareText, Pencil, Phone, ShieldCheck } from "lucide-react";
import type { Service, Shop } from "@/lib/types";
import { isValidPlate, formatPlate } from "@/lib/plate";
import { normalizeMobile } from "@/lib/phone";
import { hoursSummary } from "@/lib/hours";
import { serviceColorOf } from "@/lib/labels";
import { fmtEUR, fmtDuration, fmtTime, fmtDayLong, fmtDayNum, fmtMonthShort, cn } from "@/lib/format";
import { SlotPicker, type SlotDay } from "@/components/slot-picker";
import { ServiceIcon } from "@/components/service-icon";
import { PlateInput } from "@/components/plate-input";
import { Plate } from "@/components/plate";
import { lookupPlate, submitBooking } from "./actions";

type Day = SlotDay;
type Result = Extract<Awaited<ReturnType<typeof submitBooking>>, { ok: true }>;

const steps = ["Υπηρεσία", "Όχημα", "Ημέρα και ώρα", "Στοιχεία", "Επιβεβαίωση"];
const popularMakes = ["Toyota", "Volkswagen", "Peugeot", "Opel", "Fiat", "Hyundai", "Nissan", "Skoda", "Citroën", "Suzuki", "Kia", "Renault", "Ford", "Mercedes-Benz", "BMW", "Dacia"];

const ease = [0.22, 1, 0.36, 1] as const;

/** Τα βήματα γλιστράνε προς την κατεύθυνση που πηγαίνει ο χρήστης */
const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48, filter: "blur(4px)" }),
  center: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.45, ease } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -32, filter: "blur(4px)", transition: { duration: 0.22, ease } }),
};
const list: Variants = { show: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

export function BookingFlow({
  services,
  availability,
  shop,
  preselect,
  initialPlate,
}: {
  services: Service[];
  availability: Record<string, Day[]>;
  shop: Shop;
  preselect?: string;
  /** Από το βιβλιάριο: η πινακίδα έρχεται συμπληρωμένη */
  initialPlate?: string;
}) {
  const router = useRouter();
  const initialService = services.find((s) => s.id === preselect);
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [dir, setDir] = useState(1);
  const [serviceId, setServiceId] = useState<string | undefined>(initialService?.id);
  const [plate, setPlate] = useState(initialPlate && isValidPlate(initialPlate) ? formatPlate(initialPlate) : "");
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
  const [shake, setShake] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const service = services.find((s) => s.id === serviceId);
  const days = serviceId ? availability[serviceId] : [];
  const known = lookup.plate === plate && lookup.found;

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
  };

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, result]);

  const phoneOk = !!normalizeMobile(phone);
  const canNext = [
    !!serviceId,
    isValidPlate(plate) && make.trim().length > 1,
    !!slot,
    name.trim().length > 2 && phoneOk,
    true,
  ][step];

  const next = () => {
    if (!canNext) {
      setTouched(true);
      setShake((n) => n + 1);
      return;
    }
    setTouched(false);
    go(Math.min(step + 1, steps.length - 1));
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
      if (r.ok) return setResult(r);
      setError(r.error);
      if ("slotTaken" in r) {
        // Η ώρα κλείστηκε από άλλον στο μεταξύ: φρέσκια διαθεσιμότητα και πίσω στην επιλογή ώρας
        setSlot(undefined);
        go(2);
        router.refresh();
      }
    });

  if (result)
    return (
      <MotionConfig reducedMotion="user">
        <Success result={result} plate={plate} shop={shop} serviceId={serviceId!} />
      </MotionConfig>
    );

  const heading = (text: string, sub?: React.ReactNode) => (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="flair text-[31px] font-[760] leading-[1.04] outline-none sm:text-[46px]">
        {text}
      </h1>
      {sub && <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-ink-2">{sub}</p>}
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-36 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
        <div className="min-w-0">
          <Progress step={step} />

          <AnimatePresence mode="wait" custom={dir} initial={false} onExitComplete={() => headingRef.current?.focus({ preventScroll: true })}>
            <motion.div key={step} custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" className="mt-8">
              {step === 0 && (
                <>
                  {heading("Τι χρειάζεται το αυτοκίνητο;", "Αν δεν ξέρεις τι φταίει, διάλεξε «Διάγνωση βλαβών» και θα το βρούμε μαζί.")}
                  <motion.ul variants={list} initial="hidden" animate="show" className="mt-8 grid gap-3 sm:grid-cols-2">
                    {services.map((s) => (
                      <motion.li key={s.id} variants={item}>
                        <ServiceCard
                          service={s}
                          selected={s.id === serviceId}
                          onPick={() => {
                            if (s.id !== serviceId) {
                              setServiceId(s.id);
                              setDay(firstOpenDay(s.id));
                              setSlot(undefined);
                            }
                            setTimeout(() => go(1), 260);
                          }}
                        />
                      </motion.li>
                    ))}
                  </motion.ul>
                </>
              )}

              {step === 1 && (
                <>
                  {heading("Ποια είναι η πινακίδα;", "Με την πινακίδα κρατάμε το ιστορικό του αυτοκινήτου στο ψηφιακό του βιβλιάριο.")}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, rotateX: 18 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
                    className="mt-9 [perspective:800px]"
                  >
                    <label htmlFor="plate" className="sr-only">
                      Πινακίδα
                    </label>
                    <PlateInput id="plate" value={plate} onChange={setPlate} invalid={touched && !isValidPlate(plate)} autoFocus />
                  </motion.div>
                  <AnimatePresence>
                    {touched && !isValidPlate(plate) && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-[14px] text-fuse-red">
                        Γράψε 3 γράμματα και 4 αριθμούς, π.χ. ΙΚΒ-4821.
                      </motion.p>
                    )}
                    {known && (
                      <motion.p
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 26 }}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#e5f5ea] py-1.5 pl-1.5 pr-3.5 text-[14px] font-medium text-[#15703a]"
                      >
                        <span className="grid size-6 place-items-center rounded-full bg-[#15703a] text-white">
                          <Check size={14} strokeWidth={3} />
                        </span>
                        Σε ξέρουμε! Το αυτοκίνητο είναι ήδη στο βιβλιάριό μας.
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="mt-10">
                    <p className="text-[14px] font-semibold">
                      Μάρκα {touched && make.trim().length < 2 && <span className="ml-1 font-normal text-fuse-red">· διάλεξε ή γράψε τη μάρκα</span>}
                    </p>
                    <motion.div variants={list} initial="hidden" animate="show" className="mt-3 flex flex-wrap gap-2">
                      {popularMakes.map((m) => {
                        const sel = make === m;
                        return (
                          <motion.button
                            key={m}
                            type="button"
                            variants={item}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setMake(m)}
                            aria-pressed={sel}
                            className={cn(
                              "relative rounded-full border px-3.5 py-1.5 text-[14px] font-medium transition-colors",
                              sel ? "border-ink text-white" : "border-line bg-panel text-ink-2 hover:border-ink-3 hover:text-ink",
                            )}
                          >
                            {sel && <motion.span layoutId="make-pill" className="absolute inset-0 -z-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                            <span className="relative">{m}</span>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                    <div className="mt-5 grid max-w-md gap-4 sm:grid-cols-2">
                      <Field label="Ή γράψε τη μάρκα">
                        <input className="field book-field" value={make} onChange={(e) => setMake(e.target.value)} placeholder="π.χ. Toyota" />
                      </Field>
                      <Field label="Μοντέλο" optional>
                        <input className="field book-field" value={model} onChange={(e) => setModel(e.target.value)} placeholder="π.χ. Yaris" />
                      </Field>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && service && (
                <>
                  {heading("Πότε σε βολεύει;", <>{service.name}, περίπου {fmtDuration(service.durationMin, true)}.</>)}
                  <AnimatePresence>
                    {error && (
                      <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 rounded-xl bg-[#fcecec] px-4 py-3 text-[14px] text-[#a3312e]">
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <SlotPicker
                    days={days}
                    day={day}
                    slot={slot}
                    onDay={(d) => {
                      setDay(d);
                      setSlot(undefined);
                    }}
                    onSlot={(x) => {
                      setSlot(x);
                      setError(null);
                    }}
                  />
                  {touched && !slot && <p className="mt-4 text-[14px] text-fuse-red">Διάλεξε μια ώρα για να συνεχίσεις.</p>}
                </>
              )}

              {step === 3 && (
                <>
                  {heading("Πού να σε ενημερώσουμε;", "Θα λάβεις SMS με την επιβεβαίωση και μια υπενθύμιση την προηγούμενη μέρα.")}
                  <motion.div variants={list} initial="hidden" animate="show" className="mt-8 grid max-w-md gap-5">
                    <motion.div variants={item}>
                      <Field label="Ονοματεπώνυμο" error={touched && name.trim().length < 3 ? "Συμπλήρωσε το όνομά σου" : undefined}>
                        <input className="field book-field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                      </Field>
                    </motion.div>
                    <motion.div variants={item}>
                      <Field label="Κινητό" error={touched && !phoneOk ? "Γράψε ένα κινητό 10 ψηφίων που αρχίζει από 69" : undefined}>
                        <div className="flex">
                          <span className="grid place-items-center rounded-l-xl border border-r-0 border-line bg-sunk px-3.5 text-[15px] font-medium text-ink-2 tnum">+30</span>
                          <input
                            className="field book-field rounded-l-none tnum"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            inputMode="tel"
                            autoComplete="tel-national"
                            placeholder="69XX XXX XXX"
                          />
                        </div>
                      </Field>
                    </motion.div>
                    <motion.div variants={item}>
                      <Field label="Email" optional>
                        <input className="field book-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                      </Field>
                    </motion.div>
                    <motion.div variants={item}>
                      <Field label="Τι παρατηρείς;" optional>
                        <textarea
                          className="field book-field"
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="π.χ. ανάβει η λυχνία μπαταρίας όταν ανάβω τα φώτα"
                        />
                      </Field>
                    </motion.div>
                    <motion.label variants={item} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-2 bg-panel p-3.5 text-[14px] text-ink-2">
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-[18px] accent-[var(--brand)]" />
                      <span>Θέλω υπενθύμιση με SMS για το ραντεβού. Τα στοιχεία χρησιμοποιούνται μόνο από το συνεργείο.</span>
                    </motion.label>
                  </motion.div>
                </>
              )}

              {step === 4 && service && slot && (
                <>
                  {heading("Έλεγξε και κλείσε το ραντεβού")}
                  <Ticket
                    service={service}
                    slot={slot}
                    plate={plate}
                    vehicle={`${make} ${model}`.trim()}
                    name={name}
                    phone={phone}
                    notes={notes}
                    onEdit={go}
                  />
                  {service.requiresApproval && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="mt-5 flex gap-2.5 rounded-xl bg-signal-soft px-4 py-3 text-[14px] text-ink-2"
                    >
                      <MessageSquareText size={18} className="mt-0.5 shrink-0 text-[#8a6700]" />
                      Για αυτή την εργασία το συνεργείο επιβεβαιώνει την ώρα. Θα λάβεις SMS μέσα στη μέρα.
                    </motion.p>
                  )}
                  {error && (
                    <p className="mt-4 rounded-xl bg-[#fcecec] px-4 py-3 text-[14px] text-[#a3312e]" role="alert">
                      {error}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <Summary service={service} plate={plate} slot={slot} shop={shop} />

        {/* Γραμμή ενεργειών */}
        <AnimatePresence>
          {step > 0 && (
            <motion.div
              initial={{ y: 90 }}
              animate={{ y: 0 }}
              exit={{ y: 90 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-30 border-t border-line-2 bg-panel/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
            >
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <button className="btn btn-ghost h-12 rounded-xl px-4" onClick={() => go(step - 1)}>
                  <ArrowLeft size={18} /> Πίσω
                </button>
                {step < steps.length - 1 ? (
                  <motion.button
                    key={shake}
                    animate={shake ? { x: [0, -10, 10, -6, 6, -2, 0] } : undefined}
                    transition={{ duration: 0.45 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn("btn btn-primary group h-12 min-w-40 rounded-xl text-[16px]", !canNext && "opacity-60")}
                    onClick={next}
                    aria-disabled={!canNext}
                  >
                    Συνέχεια <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="btn btn-primary group h-12 min-w-48 rounded-xl text-[16px] shadow-[0_10px_24px_-10px_var(--brand)]"
                    onClick={submit}
                    disabled={pending}
                  >
                    {pending ? (
                      <>
                        <motion.span
                          className="size-4 rounded-full border-2 border-white/40 border-t-white"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                        />
                        Κλείνει…
                      </>
                    ) : (
                      <>
                        Κλείσε το ραντεβού <Check size={18} strokeWidth={2.6} />
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/* ---------- Πρόοδος ---------- */

function Progress({ step }: { step: number }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="flair text-[15px] font-bold tnum text-brand">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={step}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="inline-block"
            >
              {String(step + 1).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
          <span className="text-ink-3"> / {String(steps.length).padStart(2, "0")}</span>
        </span>
        <span className="text-[14px] font-medium text-ink-2">{steps[step]}</span>
      </div>
      <ol className="mt-3 flex gap-1.5" aria-label="Βήματα κράτησης">
        {steps.map((label, i) => (
          <li key={label} className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-line-2" aria-current={i === step ? "step" : undefined}>
            <span className="sr-only">
              {i + 1}. {label}
            </span>
            <motion.span
              className="absolute inset-0 origin-left rounded-full bg-brand"
              initial={false}
              animate={{ scaleX: i <= step ? 1 : 0, opacity: i < step ? 0.55 : 1 }}
              transition={{ duration: 0.5, ease }}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- Κάρτα υπηρεσίας ---------- */

function ServiceCard({ service: s, selected, onPick }: { service: Service; selected: boolean; onPick: () => void }) {
  const c = serviceColorOf(s.id);
  return (
    <motion.button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      initial="rest"
      animate={selected ? "selected" : "rest"}
      whileHover="hover"
      whileTap={{ scale: 0.985 }}
      variants={{ rest: { y: 0 }, hover: { y: -3 }, selected: { y: 0 } }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="group relative isolate flex h-full w-full gap-4 overflow-hidden rounded-2xl border bg-panel p-4 text-left shadow-[0_1px_0_rgba(30,34,38,0.04)] transition-[border-color,box-shadow] duration-200 hover:shadow-[0_14px_30px_-18px_rgba(30,34,38,0.45)] sm:p-5"
      style={{ borderColor: selected ? c.fg : "var(--line-2)", boxShadow: selected ? `0 0 0 3px ${c.bg}` : undefined }}
    >
      {/* Χρωματιστό «άπλωμα» από τη γωνία του εικονιδίου */}
      <motion.span
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: `radial-gradient(120% 140% at 0% 0%, ${c.bg} 0%, transparent 55%)` }}
        variants={{ rest: { opacity: 0 }, hover: { opacity: 1 }, selected: { opacity: 1 } }}
        transition={{ duration: 0.35, ease }}
      />
      <motion.span
        className="grid size-[52px] shrink-0 place-items-center rounded-[14px]"
        style={{ background: selected ? c.fg : c.bg, color: selected ? "#fff" : c.fg }}
        variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: -8, scale: 1.06 }, selected: { rotate: 0, scale: 1 } }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        <ServiceIcon category={s.category} id={s.id} size={24} />
      </motion.span>
      <span className="min-w-0 flex-1">
        <span className="flair-soft block pr-6 text-[17px] font-[650] leading-tight">{s.name}</span>
        <span className="mt-1.5 block text-[14px] leading-snug text-ink-2">{s.description}</span>
        <span className="mt-3 flex flex-wrap gap-1.5 text-[12.5px] font-medium">
          <span className="inline-flex items-center gap-1 rounded-full bg-sunk px-2.5 py-1 text-ink-2 tnum">
            <Clock size={12.5} /> {fmtDuration(s.durationMin)}
          </span>
          {s.priceFrom !== undefined && (
            <span className="rounded-full px-2.5 py-1 tnum" style={{ background: c.bg, color: c.fg }}>
              {s.priceFrom === 0 ? "Δωρεάν τοποθέτηση" : `από ${fmtEUR(s.priceFrom)}`}
            </span>
          )}
          {s.requiresApproval && (
            <span className="inline-flex items-center gap-1 rounded-full bg-signal-soft px-2.5 py-1 text-[#7a5c00]">
              <ShieldCheck size={12.5} /> Με επιβεβαίωση
            </span>
          )}
        </span>
      </span>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 22 }}
            className="absolute right-3.5 top-3.5 grid size-6 place-items-center rounded-full text-white"
            style={{ background: c.fg }}
          >
            <Check size={14} strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ---------- Σύνοψη (desktop) ---------- */

function Summary({ service, plate, slot, shop }: { service?: Service; plate: string; slot?: string; shop: Shop }) {
  const c = service ? serviceColorOf(service.id) : undefined;
  const line = { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0 }, transition: { duration: 0.35, ease } };
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-8 space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-line-2 bg-panel">
          <motion.div className="h-1.5" animate={{ background: c?.fg ?? "var(--line-2)" }} transition={{ duration: 0.4 }} />
          <div className="p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3">Το ραντεβού σου</p>
            <ul className="mt-4 space-y-4 text-[15px]">
              <li className="min-h-6">
                <AnimatePresence mode="wait">
                  {service ? (
                    <motion.span key={service.id} {...line} className="flex items-center gap-2.5 font-semibold">
                      <span className="grid size-8 place-items-center rounded-lg" style={{ background: c!.bg, color: c!.fg }}>
                        <ServiceIcon category={service.category} id={service.id} size={17} />
                      </span>
                      {service.name}
                    </motion.span>
                  ) : (
                    <span className="text-ink-3">Υπηρεσία</span>
                  )}
                </AnimatePresence>
              </li>
              <li className="min-h-8">
                <AnimatePresence mode="wait">
                  {isValidPlate(plate) ? (
                    <motion.span key={plate} {...line} className="inline-block">
                      <Plate plate={plate} size="sm" />
                    </motion.span>
                  ) : (
                    <span className="text-ink-3">Πινακίδα</span>
                  )}
                </AnimatePresence>
              </li>
              <li className="min-h-6">
                <AnimatePresence mode="wait">
                  {slot ? (
                    <motion.span key={slot} {...line} className="block">
                      <span className="block text-[13px] text-ink-3 first-letter:uppercase">{fmtDayLong(slot)}</span>
                      <span className="flair text-[30px] font-bold leading-none tnum">{fmtTime(slot)}</span>
                    </motion.span>
                  ) : (
                    <span className="text-ink-3">Ημέρα και ώρα</span>
                  )}
                </AnimatePresence>
              </li>
            </ul>
          </div>
        </div>
        <p className="px-1 text-[13px] leading-relaxed text-ink-3">
          Προτιμάς τηλεφωνικά;{" "}
          <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="text-ink-2 underline underline-offset-2 hover:text-brand">
            {shop.phone}
          </a>
          , {hoursSummary(shop)}.
        </p>
      </div>
    </aside>
  );
}

/* ---------- Εισιτήριο επιβεβαίωσης ---------- */

function Ticket({
  service,
  slot,
  plate,
  vehicle,
  name,
  phone,
  notes,
  onEdit,
}: {
  service: Service;
  slot: string;
  plate: string;
  vehicle: string;
  name: string;
  phone: string;
  notes: string;
  onEdit: (step: number) => void;
}) {
  const c = serviceColorOf(service.id);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1.2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
      className="mt-8 max-w-xl overflow-hidden rounded-2xl border border-line-2 bg-panel shadow-[0_24px_48px_-32px_rgba(30,34,38,0.5)]"
    >
      <div className="relative flex items-center gap-4 px-5 py-5 sm:px-6" style={{ background: c.bg }}>
        <span className="grid size-12 shrink-0 place-items-center rounded-[14px] text-white" style={{ background: c.fg }}>
          <ServiceIcon category={service.category} id={service.id} size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flair-soft text-[18px] font-bold leading-tight" style={{ color: c.fg }}>
            {service.name}
          </p>
          <p className="mt-0.5 text-[14px] text-ink-2 first-letter:uppercase">{fmtDayLong(slot)}</p>
          <button onClick={() => onEdit(2)} className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
            <Pencil size={12} /> Αλλαγή ώρας
          </button>
        </div>
        <p className="flair text-[38px] font-[780] leading-none tnum" style={{ color: c.fg }}>
          {fmtTime(slot)}
        </p>
      </div>
      {/* Διάτρηση εισιτηρίου */}
      <div className="relative h-0 border-t-2 border-dashed border-line-2">
        <span className="absolute -left-3 -top-3 size-6 rounded-full bg-bg" />
        <span className="absolute -right-3 -top-3 size-6 rounded-full bg-bg" />
      </div>
      <motion.dl variants={list} initial="hidden" animate="show" className="divide-y divide-line-2">
        <TicketRow label="Όχημα" onEdit={() => onEdit(1)}>
          <span className="flex flex-wrap items-center gap-2.5">
            <Plate plate={plate} size="sm" /> <span className="font-medium">{vehicle}</span>
          </span>
        </TicketRow>
        <TicketRow label="Στοιχεία" onEdit={() => onEdit(3)}>
          <span className="font-medium">{name}</span>, <span className="tnum">{phone}</span>
        </TicketRow>
        {notes && (
          <TicketRow label="Σημείωση" onEdit={() => onEdit(3)}>
            {notes}
          </TicketRow>
        )}
      </motion.dl>
    </motion.div>
  );
}

function TicketRow({ label, children, onEdit }: { label: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <motion.div variants={item} className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <dt className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-3">{label}</dt>
        <dd className="mt-1.5 text-[15px]">{children}</dd>
      </div>
      <button onClick={onEdit} className="shrink-0 text-[14px] font-medium text-brand hover:underline">
        Αλλαγή
      </button>
    </motion.div>
  );
}

function Field({ label, optional, error, children }: { label: string; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-semibold">
        {label} {optional && <span className="font-normal text-ink-3">(προαιρετικό)</span>}
      </span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 block text-[13px] text-fuse-red">
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

/* ---------- Επιτυχία ---------- */

function Success({ result, plate, shop, serviceId }: { result: Result; plate: string; shop: Shop; serviceId: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => ref.current?.focus(), []);
  const pending = result.status === "pending";
  const c = serviceColorOf(serviceId);

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

  // Μικρά κομμάτια σε χρώματα της εργασίας και του brand που «πετάγονται» από την πινακίδα
  const bits = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + 0.3;
    const r = 120 + (i % 3) * 36;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.7, rot: (i * 47) % 360, color: [c.fg, "var(--brand)", "var(--signal)"][i % 3] };
  });

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-14 text-center sm:pt-20">
      <div className="relative mx-auto w-fit">
        {!reduce &&
          bits.map((b, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute left-1/2 top-1/2 h-2.5 w-1.5 rounded-[2px]"
              style={{ background: b.color }}
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
              animate={{ x: b.x, y: b.y, opacity: [0, 1, 0], rotate: b.rot }}
              transition={{ duration: 1.1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        <motion.div initial={{ y: 40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}>
          <Plate plate={plate} size="lg" />
        </motion.div>
        <motion.span
          className={cn(
            "absolute -right-9 -top-7 flex flex-col items-center rounded-md border-[2.5px] bg-panel/90 px-2.5 py-1 leading-none",
            pending ? "border-[#b48a0c] text-[#8a6700]" : "border-brand text-brand",
          )}
          initial={{ scale: 2.2, rotate: -24, opacity: 0 }}
          animate={{ scale: 1, rotate: -9, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 16, delay: 0.45 }}
          aria-hidden
        >
          <span className="flair text-[13px] font-extrabold tracking-[0.08em]">{pending ? "ΑΙΤΗΜΑ" : "ΚΛΕΙΣΤΗΚΕ"}</span>
          <span className="text-[11px] font-semibold tnum">
            {fmtDayNum(result.start)} {fmtMonthShort(result.start)}
          </span>
        </motion.span>
      </div>

      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.75 } } }}>
        <motion.h1 variants={item} ref={ref} tabIndex={-1} className="flair mt-12 text-[34px] font-[760] leading-[1.05] outline-none sm:text-[42px]">
          {pending ? "Λάβαμε το αίτημά σου" : "Το ραντεβού κλείστηκε"}
        </motion.h1>
        <motion.p variants={item} className="mx-auto mt-3 max-w-sm text-[16px] leading-relaxed text-ink-2">
          {result.service}, <span className="first-letter:uppercase">{fmtDayLong(result.start)}</span> στις{" "}
          <span className="font-bold text-ink tnum">{fmtTime(result.start)}</span>.{" "}
          {pending ? "Θα σου στείλουμε SMS μόλις επιβεβαιώσουμε την ώρα." : "Θα λάβεις SMS υπενθύμισης την προηγούμενη μέρα."}
        </motion.p>
        <motion.div variants={item} className="mt-9 flex flex-col justify-center gap-2.5 sm:flex-row">
          <motion.button whileTap={{ scale: 0.97 }} className="btn btn-primary h-12 rounded-xl px-5 text-[16px]" onClick={downloadIcs}>
            <CalendarPlus size={18} /> Προσθήκη στο ημερολόγιο
          </motion.button>
          <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="btn btn-outline h-12 rounded-xl px-5 text-[16px]">
            <Phone size={17} /> Κλήση στο συνεργείο
          </a>
        </motion.div>
        <motion.p variants={item} className="mt-7 text-[14px] text-ink-2">
          Άλλαξε κάτι;{" "}
          <Link href={`/r/${result.token}`} className="font-medium text-brand underline underline-offset-2">
            Αλλαγή ώρας ή ακύρωση
          </Link>
          . Ο ίδιος σύνδεσμος έρχεται και στο SMS.
        </motion.p>
      </motion.div>
    </div>
  );
}
