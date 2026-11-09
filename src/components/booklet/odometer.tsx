import { cn } from "@/lib/format";

/** Χιλιόμετρα σαν μηχανικός μετρητής. */
export function Odometer({ km, className }: { km: number; className?: string }) {
  const digits = String(Math.max(0, Math.round(km))).padStart(6, "0").split("");
  return (
    <span className={cn("inline-flex items-center gap-2", className)} aria-label={`${km} χιλιόμετρα`}>
      <span className="inline-flex overflow-hidden rounded-[5px] bg-ink p-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" aria-hidden>
        {digits.map((d, i) => (
          <span
            key={i}
            className={cn(
              "grid h-7 w-[19px] place-items-center font-cond text-[18px] font-semibold tnum",
              i > 0 && "border-l border-white/10",
              "bg-gradient-to-b from-[#2b3036] via-[#1e2226] to-[#2b3036] text-white",
            )}
          >
            {d}
          </span>
        ))}
      </span>
      <span className="text-[13px] text-ink-3" aria-hidden>
        km
      </span>
    </span>
  );
}
