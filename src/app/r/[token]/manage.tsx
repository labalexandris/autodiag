"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Phone, X } from "lucide-react";
import { SlotPicker, type SlotDay } from "@/components/slot-picker";
import { toast } from "@/components/toast";
import { cancelByToken, rescheduleByToken } from "../actions";

/** Οι ενέργειες του πελάτη πάνω στο ραντεβού του: αλλαγή ώρας ή ακύρωση. */
export function ManageAppointment({
  token,
  current,
  days,
  phone,
  needsApproval,
}: {
  token: string;
  current: string;
  days: SlotDay[];
  phone: string;
  needsApproval: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "move" | "cancel">("idle");
  const [day, setDay] = useState<string | undefined>(days.find((d) => d.slots.length)?.date);
  const [slot, setSlot] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => ReturnType<typeof cancelByToken>, done: string) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) {
        setError(r.error);
        router.refresh();
        return;
      }
      toast(done);
      setMode("idle");
      setSlot(undefined);
      router.refresh();
    });

  if (mode === "move") {
    return (
      <section className="panel p-5">
        <h2 className="text-[17px] font-semibold">Διάλεξε νέα ώρα</h2>
        {needsApproval && <p className="mt-1 text-[14px] text-ink-2">Για αυτή την εργασία το συνεργείο θα επιβεβαιώσει ξανά τη νέα ώρα.</p>}
        <SlotPicker
          days={days}
          day={day}
          slot={slot}
          onDay={(d) => {
            setDay(d);
            setSlot(undefined);
          }}
          onSlot={setSlot}
        />
        {error && <p className="mt-4 rounded-lg bg-[#fcecec] px-4 py-3 text-[14px] text-[#a3312e]" role="alert">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn btn-primary btn-lg" disabled={!slot || slot === current || pending} onClick={() => run(() => rescheduleByToken(token, slot!), "Η ώρα άλλαξε")}>
            {pending ? "Αλλαγή…" : "Αλλαγή ώρας"}
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => setMode("idle")}>
            Πίσω
          </button>
        </div>
      </section>
    );
  }

  if (mode === "cancel") {
    return (
      <section className="panel p-5">
        <h2 className="text-[17px] font-semibold">Να ακυρωθεί το ραντεβού;</h2>
        <p className="mt-1 text-[14px] text-ink-2">Η ώρα θα δοθεί σε άλλον. Αν θες απλώς άλλη ώρα, προτίμησε την αλλαγή.</p>
        {error && <p className="mt-4 rounded-lg bg-[#fcecec] px-4 py-3 text-[14px] text-[#a3312e]" role="alert">{error}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn btn-lg bg-fuse-red text-white hover:bg-[#b93a36]" disabled={pending} onClick={() => run(() => cancelByToken(token), "Το ραντεβού ακυρώθηκε")}>
            {pending ? "Ακύρωση…" : "Ναι, ακύρωση"}
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => setMode("idle")}>
            Όχι, το κρατάω
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <button className="btn btn-primary btn-lg" onClick={() => setMode("move")}>
        <CalendarClock size={18} /> Αλλαγή ώρας
      </button>
      <button className="btn btn-outline btn-lg" onClick={() => setMode("cancel")}>
        <X size={17} /> Ακύρωση ραντεβού
      </button>
      <a href={`tel:${phone.replace(/\s/g, "")}`} className="btn btn-ghost btn-lg">
        <Phone size={17} /> Κλήση
      </a>
    </div>
  );
}
