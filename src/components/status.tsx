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
