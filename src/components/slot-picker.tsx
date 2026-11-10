"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sun, Sunset } from "lucide-react";
import { fmtDayLong, fmtDayNum, fmtDayShort, fmtMonthShort, fmtTime, cn } from "@/lib/format";

export type SlotDay = { date: string; slots: string[]; closed: boolean };

const ease = [0.22, 1, 0.36, 1] as const;

/** Επιλογή ημέρας και ώρας από τη διαθεσιμότητα. Το χρησιμοποιούν η κράτηση και η αλλαγή ραντεβού. */
export function SlotPicker({
  days,
  day,
  slot,
  onDay,
  onSlot,
}: {
  days: SlotDay[];
  day?: string;
  slot?: string;
  onDay: (date: string) => void;
  onSlot: (slot: string) => void;
}) {
  const selectedDay = days.find((d) => d.date === day);
  const groups = useMemo(() => {
    const s = selectedDay?.slots ?? [];
    return [
      { label: "Πρωί", icon: Sun, items: s.filter((x) => new Date(x).getHours() < 12) },
      { label: "Μεσημέρι", icon: Sunset, items: s.filter((x) => new Date(x).getHours() >= 12) },
    ].filter((g) => g.items.length);
  }, [selectedDay]);

  if (!days.some((d) => d.slots.length)) {
    return <p className="mt-6 rounded-xl bg-signal-soft px-4 py-3 text-[15px] text-ink-2">Δεν υπάρχει ελεύθερη ώρα τις επόμενες ημέρες. Πάρε μας τηλέφωνο να βρούμε μια λύση.</p>;
  }

  return (
    <>
      <div className="-mx-4 mt-8 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <div className="flex gap-2" role="radiogroup" aria-label="Ημέρα">
          {days.map((d, i) => {
            const sel = d.date === day;
            const disabled = d.closed || d.slots.length === 0;
            return (
              <motion.button
                key={d.date}
                type="button"
                role="radio"
                aria-checked={sel}
                disabled={disabled}
                onClick={() => onDay(d.date)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.025, duration: 0.35, ease }}
                whileTap={disabled ? undefined : { scale: 0.94 }}
                className={cn(
                  "relative flex w-[66px] shrink-0 flex-col items-center rounded-2xl border py-3 transition-colors",
                  sel ? "border-brand text-white" : "border-line-2 bg-panel hover:border-ink-3",
                  disabled && "cursor-not-allowed border-dashed border-line-2 bg-transparent text-ink-3/60 hover:border-line-2",
                )}
              >
                {sel && (
                  <motion.span
                    layoutId="slot-day"
                    className="absolute inset-0 rounded-[15px] bg-brand shadow-[0_10px_20px_-10px_var(--brand)]"
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  />
                )}
                <span className={cn("relative text-[12px] font-medium capitalize", sel ? "text-white/85" : "text-ink-3")}>{fmtDayShort(d.date)}</span>
                <span className="relative text-[24px] font-bold leading-tight tnum [font-variation-settings:'FLAR'_100]">{fmtDayNum(d.date)}</span>
                <span className={cn("relative text-[11px]", sel ? "text-white/85" : "text-ink-3")}>
                  {d.closed ? "κλειστά" : d.slots.length === 0 ? "πλήρες" : fmtMonthShort(d.date)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {selectedDay && (
          <motion.div
            key={selectedDay.date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease }}
            className="mt-6 space-y-6"
          >
            <p className="text-[16px] font-semibold first-letter:uppercase">{fmtDayLong(selectedDay.date)}</p>
            {groups.map((g, gi) => (
              <div key={g.label}>
                <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-medium text-ink-3">
                  <g.icon size={14} /> {g.label}
                </p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label={`Ώρες, ${g.label}`}>
                  {g.items.map((s, i) => {
                    const sel = slot === s;
                    return (
                      <motion.button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={sel}
                        onClick={() => onSlot(s)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: gi * 0.1 + i * 0.02, duration: 0.25, ease }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.94 }}
                        className={cn(
                          "relative h-12 rounded-xl border text-[16px] font-semibold tnum transition-colors",
                          sel ? "border-brand text-white" : "border-line-2 bg-panel hover:border-brand hover:text-brand",
                        )}
                      >
                        {sel && (
                          <motion.span
                            layoutId="slot-time"
                            className="absolute inset-0 rounded-[11px] bg-brand shadow-[0_10px_20px_-10px_var(--brand)]"
                            transition={{ type: "spring", stiffness: 480, damping: 34 }}
                          />
                        )}
                        <span className="relative">{fmtTime(s)}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
