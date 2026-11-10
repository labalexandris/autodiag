import { statusMeta } from "@/lib/labels";
import type { AppointmentStatus } from "@/lib/types";
import { cn } from "@/lib/format";

/** Μικρή «ασφάλεια» στο χρώμα της κατάστασης */
export function Fuse({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 10 14" width="10" height="14" className={cn("shrink-0", className)} aria-hidden>
      <rect x="0.5" y="0.5" width="9" height="7.5" rx="2" fill={color} />
      <rect x="1.8" y="7" width="2" height="6.5" rx="0.6" fill={color} opacity="0.75" />
      <rect x="6.2" y="7" width="2" height="6.5" rx="0.6" fill={color} opacity="0.75" />
    </svg>
  );
}

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const m = statusMeta[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2", className)}>
      <Fuse color={m.fuse} />
      {m.label}
    </span>
  );
}

/**
 * Το φόντο και το περίγραμμα μιας κάρτας ραντεβού ανά κατάσταση. Η κατάσταση
 * δεν φαίνεται μόνο από το χρώμα: το «προς έγκριση» έχει διακεκομμένο
 * περίγραμμα και το «ολοκληρώθηκε» ένα ✓.
 */
export const statusCard: Record<AppointmentStatus, string> = {
  pending: "border-dashed border-[#c99a12] bg-signal-soft",
  confirmed: "border-line bg-panel",
  in_progress: "border-fuse-orange/60 bg-[#fdf1e8]",
  done: "border-fuse-green/35 bg-[#eef7f1]",
  no_show: "border-fuse-red/35 bg-[#fcecec]",
  cancelled: "border-line-2 bg-sunk",
};

export function StatusLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-2", className)} aria-label="Υπόμνημα καταστάσεων">
      {(["pending", "confirmed", "in_progress", "done", "no_show"] as const).map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <Fuse color={statusMeta[s].fuse} /> {statusMeta[s].label}
        </li>
      ))}
    </ul>
  );
}
