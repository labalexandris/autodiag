"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { normalizePlate } from "@/lib/plate";
import { Plate } from "./plate";
import { cn } from "@/lib/format";

export interface SearchEntry {
  plate: string;
  vehicle: string;
  owner: string;
  phone: string;
}

/**
 * Αναζήτηση με πινακίδα, όνομα ή τηλέφωνο. Δέχεται λατινικούς χαρακτήρες
 * (ikb4821 → ΙΚΒ-4821), γιατί έτσι πληκτρολογούν οι περισσότεροι στο κινητό.
 * Συντόμευση: «/» από οπουδήποτε.
 */
export function PlateSearch({ entries, autoFocus, onNavigate }: { entries: SearchEntry[]; autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(t.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const raw = q.trim();
    if (!raw) return [];
    const np = normalizePlate(raw);
    const digits = raw.replace(/\D/g, "");
    const lower = raw.toLowerCase();
    return entries
      .filter(
        (e) =>
          (np.length >= 2 && normalizePlate(e.plate).includes(np)) ||
          e.owner.toLowerCase().includes(lower) ||
          (digits.length >= 3 && e.phone.replace(/\D/g, "").includes(digits)),
      )
      .slice(0, 6);
  }, [q, entries]);

  const go = (plate: string) => {
    router.push(`/admin/vehicles/${encodeURIComponent(normalizePlate(plate))}`);
    setOpen(false);
    setQ("");
    onNavigate?.();
  };

  return (
    <div className="relative">
      <label className="group flex h-14 items-center gap-3 rounded-xl border border-line bg-panel pl-4 pr-3 transition-shadow focus-within:border-brand focus-within:shadow-[0_0_0_4px_var(--brand-soft)]">
        <Search size={20} className="text-ink-3" />
        <span className="sr-only">Αναζήτηση οχήματος ή πελάτη</span>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              go(results[active].plate);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Πινακίδα, όνομα ή τηλέφωνο"
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-ink-3"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="plate-results"
        />
        <kbd className="hidden rounded border border-line px-1.5 text-[12px] text-ink-3 sm:block">/</kbd>
      </label>

      {open && q.trim() && (
        <div
          id="plate-results"
          role="listbox"
          className="animate-rise absolute inset-x-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-line-2 bg-panel shadow-[0_12px_32px_-12px_rgba(30,34,38,0.28)]"
        >
          {results.length === 0 ? (
            <p className="px-4 py-4 text-[14px] text-ink-2">
              Δεν βρέθηκε όχημα για «{q}». Δοκίμασε μόνο τα νούμερα της πινακίδας.
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.plate}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r.plate)}
                onMouseEnter={() => setActive(i)}
                className={cn("flex w-full items-center gap-4 px-4 py-3 text-left", i === active && "bg-sunk")}
              >
                <Plate plate={r.plate} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{r.vehicle}</span>
                  <span className="block truncate text-[13px] text-ink-3">
                    {r.owner}, {r.phone}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
