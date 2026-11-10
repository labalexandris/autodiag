"use client";

import { useMemo } from "react";
import { fmtDayLong, fmtDayNum, fmtDayShort, fmtMonthShort, fmtTime, cn } from "@/lib/format";

export type SlotDay = { date: string; slots: string[]; closed: boolean };

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
      { label: "Πρωί", items: s.filter((x) => new Date(x).getHours() < 12) },
      { label: "Μεσημέρι", items: s.filter((x) => new Date(x).getHours() >= 12) },
    ].filter((g) => g.items.length);
  }, [selectedDay]);

  if (!days.some((d) => d.slots.length)) {
    return <p className="mt-6 rounded-lg bg-signal-soft px-4 py-3 text-[15px] text-ink-2">Δεν υπάρχει ελεύθερη ώρα τις επόμενες ημέρες. Πάρε μας τηλέφωνο να βρούμε μια λύση.</p>;
  }

  return (
    <>
      <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex gap-2" role="radiogroup" aria-label="Ημέρα">
          {days.map((d) => {
            const sel = d.date === day;
            const disabled = d.closed || d.slots.length === 0;
            return (
              <button
                key={d.date}
                type="button"
                role="radio"
                aria-checked={sel}
                disabled={disabled}
                onClick={() => onDay(d.date)}
                className={cn(
                  "flex w-[62px] shrink-0 flex-col items-center rounded-xl border py-2.5 transition-colors",
                  sel ? "border-brand bg-brand text-white" : "border-line-2 bg-panel hover:border-line",
                  disabled && "cursor-not-allowed border-transparent bg-transparent text-ink-3/70 hover:border-transparent",
                )}
              >
                <span className={cn("text-[12px] capitalize", sel ? "text-white/85" : "text-ink-3")}>{fmtDayShort(d.date)}</span>
                <span className="font-cond text-[22px] font-semibold leading-tight tnum">{fmtDayNum(d.date)}</span>
                <span className={cn("text-[11px]", sel ? "text-white/85" : "text-ink-3")}>{d.closed ? "κλειστά" : d.slots.length === 0 ? "πλήρες" : fmtMonthShort(d.date)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="mt-6 space-y-5">
          <p className="text-[15px] font-medium first-letter:uppercase">{fmtDayLong(selectedDay.date)}</p>
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-2 text-[13px] text-ink-3">{g.label}</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label={`Ώρες, ${g.label}`}>
                {g.items.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={slot === s}
                    onClick={() => onSlot(s)}
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
    </>
  );
}
