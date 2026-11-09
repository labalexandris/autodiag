"use client";

import { normalizePlate, formatPlate } from "@/lib/plate";
import { cn } from "@/lib/format";

/**
 * Πεδίο πινακίδας που μοιάζει με πινακίδα. Μετατρέπει αυτόματα λατινικά σε
 * ελληνικά και βάζει την παύλα, ώστε ο πελάτης να γράφει όπως θέλει.
 */
export function PlateInput({
  value,
  onChange,
  invalid,
  id,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  id?: string;
  autoFocus?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-[76px] w-full max-w-[340px] items-stretch overflow-hidden rounded-[9px] bg-white shadow-[inset_0_0_0_2.5px_var(--ink)] transition-shadow focus-within:shadow-[inset_0_0_0_2.5px_var(--ink),0_0_0_5px_var(--brand-soft)]",
        invalid && "shadow-[inset_0_0_0_2.5px_var(--fuse-red)] focus-within:shadow-[inset_0_0_0_2.5px_var(--fuse-red),0_0_0_5px_#fbe3e2]",
      )}
    >
      <span className="flex w-10 shrink-0 flex-col items-center justify-end rounded-l-[9px] bg-[var(--plate-blue)] pb-2 text-white" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 100 100" className="mb-auto mt-2.5">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={Math.round((50 + Math.cos(a) * 36) * 10) / 10} cy={Math.round((50 + Math.sin(a) * 36) * 10) / 10} r={7} fill="#f7d33b" />;
          })}
        </svg>
        <span className="text-[15px] font-medium leading-none">GR</span>
      </span>
      <input
        id={id}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          const n = normalizePlate(e.target.value).slice(0, 7);
          onChange(n.length > 3 ? formatPlate(n) : n);
        }}
        placeholder="ΙΚΒ-4821"
        className="min-w-0 flex-1 bg-transparent px-4 text-center font-cond text-[40px] font-semibold uppercase tracking-[0.05em] text-ink outline-none placeholder:text-line"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode="text"
        aria-invalid={invalid}
      />
    </div>
  );
}
