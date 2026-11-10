"use client";

import Link from "next/link";
import { createContext, useContext, useState, useTransition } from "react";
import { BookOpen, CalendarClock, Check, MessageSquareText, Phone, Play, TriangleAlert, Undo2, UserX, X } from "lucide-react";
import type { AppointmentStatus, Service } from "@/lib/types";
import type { SheetItem } from "@/lib/sheet-item";
import { sourceLabel } from "@/lib/labels";
import { fmtDayLong, fmtTime } from "@/lib/format";
import { assignOwnerFromAppointment, rescheduleAppointment, updateStatus } from "@/app/admin/actions";
import { Plate } from "@/components/plate";
import { StatusBadge } from "@/components/status";
import { Sheet } from "@/components/sheet";
import { RecordDialog } from "@/components/booklet/record-form";
import { toast } from "@/components/toast";

interface Ctx {
  services: Service[];
  technicians: string[];
  /** Ώρες ανά 30′ μέσα στο ωράριο, για την αλλαγή ώρας */
  times: string[];
  /** Απόρριψη και ακύρωση: μόνο ο ιδιοκτήτης */
  canCancel: boolean;
}
const AppointmentContext = createContext<Ctx | null>(null);

/** Τα κοινά δεδομένα για όλα τα ραντεβού μιας σελίδας (μία φορά, όχι ανά κάρτα). */
export function AppointmentProvider({ children, ...value }: Ctx & { children: React.ReactNode }) {
  return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>;
}

const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const localTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Η κάρτα ενός ραντεβού ως κουμπί. Το πάτημα ανοίγει το παράθυρο με τις
 * λεπτομέρειες και το επόμενο βήμα: επιβεβαίωση, «ήρθε», ολοκλήρωση,
 * «δεν ήρθε», αλλαγή ώρας.
 */
export function AppointmentCard({
  item,
  className,
  style,
  title,
  children,
}: {
  item: SheetItem;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<"closed" | "details" | "record">("closed");
  const ctx = useContext(AppointmentContext);
  return (
    <>
      <button type="button" className={className} style={style} title={title} onClick={() => setMode("details")} aria-haspopup="dialog">
        {children}
      </button>
      {mode === "details" && <Details item={item} times={ctx?.times ?? []} canCancel={ctx?.canCancel ?? false} onClose={() => setMode("closed")} onComplete={() => setMode("record")} />}
      {mode === "record" && ctx && (
        <RecordDialog
          vehicleId={item.vehicleId}
          currentKm={item.km}
          services={ctx.services}
          technicians={ctx.technicians}
          appointmentId={item.id}
          defaultServiceId={item.serviceId}
          defaultTitle={item.serviceName}
          onClose={() => setMode("closed")}
        />
      )}
    </>
  );
}

function Details({
  item,
  times,
  canCancel,
  onClose,
  onComplete,
}: {
  item: SheetItem;
  times: string[];
  canCancel: boolean;
  onClose: () => void; onComplete: () => void }) {
  const [pending, start] = useTransition();
  const [moving, setMoving] = useState(false);
  const [date, setDate] = useState(localDate(item.start));
  const [time, setTime] = useState(localTime(item.start));
  const [error, setError] = useState<string | null>(null);
  const first = item.customerName.split(" ")[0];
  const tel = item.customerPhone.replace(/\s/g, "");

  const set = (status: AppointmentStatus, message: string) =>
    start(async () => {
      await updateStatus(item.id, status);
      toast(message);
      onClose();
    });

  const move = () =>
    start(async () => {
      setError(null);
      const r = await rescheduleAppointment(item.id, new Date(`${date}T${time}:00`).toISOString());
      if (!r.ok) return setError(r.error);
      toast(`Η ώρα άλλαξε. Στάλθηκε SMS στον/στην ${first}.`);
      onClose();
    });

  const canMove = item.status === "pending" || item.status === "confirmed";
  const timeOptions = times.includes(time) ? times : [time, ...times];

  return (
    <Sheet
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <Plate plate={item.plate} size="sm" />
          <span className="truncate">{item.vehicle}</span>
        </span>
      }
    >
      <div className="space-y-5">
        <div>
          <StatusBadge status={item.status} />
          <p className="mt-2 text-[19px] font-semibold leading-tight">{item.serviceName}</p>
          <p className="mt-1 text-[15px] text-ink-2">
            <span className="first-letter:uppercase">{fmtDayLong(item.start)}</span>,{" "}
            <span className="font-semibold text-ink tnum">
              {fmtTime(item.start)}–{fmtTime(item.end)}
            </span>
            {item.bayName && <>, {item.bayName}</>}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-line-2 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium">{item.customerName}</p>
            <p className="text-[13px] text-ink-3">
              <span className="tnum">{item.customerPhone}</span>, {sourceLabel[item.source].toLowerCase()}
            </p>
          </div>
          <a href={`tel:${tel}`} className="btn btn-outline btn-sm shrink-0">
            <Phone size={15} /> Κλήση
          </a>
        </div>

        {item.ownerMismatch && (
          <div className="flex gap-2.5 rounded-lg bg-signal-soft px-4 py-3 text-[14px] text-ink-2">
            <TriangleAlert size={18} className="mt-0.5 shrink-0 text-[#8a6700]" />
            <div>
              <p>Το ραντεβού το έκλεισε άλλος από τον ιδιοκτήτη που έχουμε στο αρχείο για αυτή την πινακίδα.</p>
              <button
                className="mt-1.5 font-medium text-brand hover:underline disabled:opacity-50"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await assignOwnerFromAppointment(item.id);
                    toast(`Ιδιοκτήτης του ${item.plate}: ${item.customerName}`);
                    onClose();
                  })
                }
              >
                Ορισμός ως νέος ιδιοκτήτης
              </button>
            </div>
          </div>
        )}

        {item.notes && (
          <p className="flex gap-2.5 text-[14px] text-ink-2">
            <MessageSquareText size={16} className="mt-0.5 shrink-0 text-ink-3" />
            {item.notes}
          </p>
        )}

        {/* Το επόμενο βήμα πρώτο και μεγάλο: πατιέται με λερωμένα χέρια */}
        <div className="grid gap-2">
          {item.status === "pending" && (
            <>
              <button className="btn btn-primary btn-lg" disabled={pending} onClick={() => set("confirmed", `Επιβεβαιώθηκε. Στάλθηκε SMS στον/στην ${first}.`)}>
                <Check size={18} /> Επιβεβαίωση
              </button>
              {canCancel && (
                <button className="btn btn-outline" disabled={pending} onClick={() => set("cancelled", "Το αίτημα απορρίφθηκε.")}>
                  <X size={16} /> Απόρριψη
                </button>
              )}
            </>
          )}
          {item.status === "confirmed" && (
            <>
              <button className="btn btn-primary btn-lg" disabled={pending} onClick={() => set("in_progress", `Το ${item.plate} μπήκε για εργασία.`)}>
                <Play size={17} /> Ήρθε, ξεκινάμε
              </button>
              <div className={canCancel ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
                <button className="btn btn-outline" disabled={pending} onClick={() => set("no_show", "Σημειώθηκε ότι δεν ήρθε.")}>
                  <UserX size={16} /> Δεν ήρθε
                </button>
                {canCancel && (
                  <button className="btn btn-outline" disabled={pending} onClick={() => set("cancelled", "Το ραντεβού ακυρώθηκε.")}>
                    <X size={16} /> Ακύρωση
                  </button>
                )}
              </div>
            </>
          )}
          {item.status === "in_progress" && (
            <>
              <button className="btn btn-primary btn-lg" disabled={pending} onClick={onComplete}>
                <Check size={18} /> Ολοκλήρωση και βιβλιάριο
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-outline" disabled={pending} onClick={() => set("done", "Ολοκληρώθηκε χωρίς εγγραφή στο βιβλιάριο.")}>
                  Χωρίς εγγραφή
                </button>
                <button className="btn btn-outline" disabled={pending} onClick={() => set("confirmed", "Γύρισε σε «επιβεβαιωμένο».")}>
                  <Undo2 size={16} /> Αναίρεση
                </button>
              </div>
            </>
          )}
          {(item.status === "done" || item.status === "no_show" || item.status === "cancelled") && (
            <button className="btn btn-outline" disabled={pending} onClick={() => set(item.status === "done" ? "in_progress" : "confirmed", "Η κατάσταση επανήλθε.")}>
              <Undo2 size={16} /> {item.status === "done" ? "Άνοιγμα ξανά" : "Επαναφορά ραντεβού"}
            </button>
          )}
        </div>

        {canMove &&
          (moving ? (
            <div className="rounded-xl border border-line-2 p-4">
              <p className="text-[14px] font-medium">Νέα ημέρα και ώρα</p>
              <div className="mt-2 grid grid-cols-[1fr_112px] gap-2">
                <input type="date" className="field tnum" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Ημέρα" />
                <select className="field tnum" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Ώρα">
                  {timeOptions.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              {error && <p className="mt-2 text-[13px] text-fuse-red">{error}</p>}
              <div className="mt-3 flex gap-2">
                <button className="btn btn-primary btn-sm" disabled={pending || !date} onClick={move}>
                  {pending ? "Αλλαγή…" : "Αλλαγή ώρας"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setMoving(false)}>
                  Άκυρο
                </button>
              </div>
            </div>
          ) : (
            <button className="inline-flex items-center gap-2 text-[14px] font-medium text-brand hover:underline" onClick={() => setMoving(true)}>
              <CalendarClock size={16} /> Αλλαγή ημέρας ή ώρας
            </button>
          ))}

        <Link href={`/admin/vehicles/${encodeURIComponent(item.plateKey)}`} className="flex items-center gap-2 border-t border-line-2 pt-4 text-[14px] font-medium text-ink-2 hover:text-brand">
          <BookOpen size={16} /> Βιβλιάριο του {item.plate}
        </Link>
      </div>
    </Sheet>
  );
}
