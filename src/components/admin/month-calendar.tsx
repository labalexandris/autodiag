import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/format";

/**
 * Μία μέρα του μήνα, ως σύνοψη: πόσα ραντεβού, πόσο γεμάτες οι θέσεις,
 * πόσα περιμένουν έγκριση. Όλα υπολογίζονται στον server (ώρα Ελλάδας).
 */
export interface MonthDay {
  key: string;
  num: number;
  href: string;
  label: string;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  closed: boolean;
  count: number;
  pending: number;
  noShow: number;
  /** 0–1: κλεισμένα λεπτά / διαθέσιμα λεπτά σε όλες τις θέσεις */
  load: number;
  freeMin: number;
}

const weekdays = ["Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ", "Κυρ"];

const loadColor = (d: MonthDay) =>
  d.isPast ? "var(--fuse-grey)" : d.load >= 0.9 ? "var(--fuse-red)" : d.load >= 0.65 ? "var(--fuse-orange)" : "var(--fuse-green)";

function freeLabel(d: MonthDay) {
  if (d.isPast) return d.noShow ? `${d.noShow} δεν ήρθαν` : "";
  if (d.freeMin < 60) return "Γεμάτη";
  const h = Math.floor(d.freeMin / 30) / 2;
  return `${String(h).replace(".", ",")} ώρ. ελεύθερες`;
}

export function MonthCalendar({
  days,
  title,
  summary,
  prevHref,
  nextHref,
  todayHref,
  action,
}: {
  days: MonthDay[];
  title: string;
  summary: React.ReactNode;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  action: React.ReactNode;
}) {
  return (
    <section className="space-y-4" aria-label="Μήνας">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold capitalize leading-tight">{title}</h1>
          <p className="mt-1 text-[14px] text-ink-2">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex flex-1 -space-x-px md:flex-none">
            <Link href={prevHref} scroll={false} className="btn btn-outline w-10 rounded-r-none px-0" aria-label="Προηγούμενος μήνας">
              <ChevronLeft size={22} strokeWidth={2.5} />
            </Link>
            <Link href={todayHref} scroll={false} className="btn btn-outline flex-1 rounded-none md:flex-none">
              Σήμερα
            </Link>
            <Link href={nextHref} scroll={false} className="btn btn-outline w-10 rounded-l-none px-0" aria-label="Επόμενος μήνας">
              <ChevronRight size={22} strokeWidth={2.5} />
            </Link>
          </div>
          {action}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line-2 text-center text-[12px] font-semibold text-ink-2">
          {weekdays.map((w, i) => (
            <div key={w} className={cn("py-2", i < 6 && "border-r border-line-2")}>
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => (
            <Link
              key={d.key}
              href={d.href}
              scroll={false}
              aria-label={`${d.label}: ${d.closed && !d.count ? "κλειστά" : `${d.count} ραντεβού`}${d.pending ? `, ${d.pending} προς έγκριση` : ""}`}
              aria-current={d.isSelected ? "date" : undefined}
              className={cn(
                "relative flex min-h-[68px] flex-col gap-1 border-line-2 p-1.5 transition-colors sm:min-h-[84px] sm:p-2",
                i % 7 !== 6 && "border-r",
                i < days.length - 7 && "border-b",
                !d.inMonth && "bg-sunk/80",
                d.isSelected ? "z-[1] bg-brand-soft/60 outline outline-2 -outline-offset-2 outline-brand" : "hover:bg-sunk",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-[12.5px] tnum sm:size-7 sm:text-[13px]",
                    !d.inMonth && "text-ink-3",
                    d.isToday && "bg-brand font-semibold text-white",
                    d.isSelected && !d.isToday && "font-semibold",
                  )}
                >
                  {d.num}
                </span>
                {d.pending > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1 text-[11px] font-semibold text-ink tnum" title={`${d.pending} προς έγκριση`}>
                    {d.pending}
                  </span>
                )}
              </div>

              {d.closed && !d.count ? (
                <span className="mt-auto hidden text-[11.5px] text-ink-3 sm:block">Κλειστά</span>
              ) : (
                <div className="mt-auto space-y-1">
                  {d.count > 0 && (
                    <p className={cn("text-[12px] leading-none tnum sm:text-[13px]", d.isPast ? "text-ink-3" : "font-medium")}>
                      {d.count}
                      <span className="hidden sm:inline"> ραντεβού</span>
                    </p>
                  )}
                  <div className="h-1.5 overflow-hidden rounded-full bg-line-2" title={`${Math.round(d.load * 100)}% πληρότητα`}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round(d.load * 100))}%`, background: loadColor(d) }} />
                  </div>
                  <p className="hidden truncate text-[11.5px] leading-none text-ink-3 lg:block">{freeLabel(d) || " "}</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-ink-3">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-5 rounded-full bg-fuse-green" /> Ελεύθερη
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-5 rounded-full bg-fuse-orange" /> Σχεδόν γεμάτη
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-5 rounded-full bg-fuse-red" /> Γεμάτη
        </span>
        <span className="flex items-center gap-1.5">
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-signal px-1 text-[10px] font-semibold text-ink">2</span> Προς έγκριση
        </span>
      </div>
    </section>
  );
}
