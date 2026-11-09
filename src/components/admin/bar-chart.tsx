"use client";

import { useState } from "react";
import { fmtEUR } from "@/lib/format";

export interface Bar {
  label: string;
  sub: string;
  value: number;
  count: number;
}

/** Κάθετες μπάρες, μία σειρά, με tooltip στο hover/focus και πίνακα για προσβασιμότητα. */
export function BarChart({ bars, height = 220 }: { bars: Bar[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...bars.map((b) => b.value));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const avg = bars.reduce((s, b) => s + b.value, 0) / Math.max(1, bars.length);

  return (
    <div>
      <div className="relative flex gap-3" style={{ height }}>
        <div className="relative w-12 shrink-0 text-[11.5px] text-ink-3 tnum" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}>
              {t >= 1000 ? `${t / 1000}k` : t}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {ticks.map((t) => (
            <span key={t} className="absolute inset-x-0 h-px bg-line-2" style={{ bottom: `${(t / top) * 100}%` }} aria-hidden />
          ))}
          <span
            className="absolute inset-x-0 border-t border-dashed border-ink-3/60"
            style={{ bottom: `${(avg / top) * 100}%` }}
            aria-hidden
          >
            <span className="absolute -top-[18px] right-0 bg-panel pl-1 text-[11.5px] text-ink-3">μ.ό. {fmtEUR(avg)}</span>
          </span>
          <div className="absolute inset-0 flex items-end gap-[2px]" role="img" aria-label="Έσοδα ανά εβδομάδα">
            {bars.map((b, i) => (
              <button
                key={i}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${b.label}: ${fmtEUR(b.value)}, ${b.count} εργασίες`}
              >
                <span
                  className="w-full max-w-[28px] rounded-t-[4px] transition-colors"
                  style={{
                    height: `${(b.value / top) * 100}%`,
                    background: hover === null || hover === i ? "var(--brand)" : "color-mix(in srgb, var(--brand) 35%, white)",
                  }}
                />
              </button>
            ))}
          </div>
          {hover !== null && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-[12.5px] text-white shadow-lg"
              style={{
                left: `${((hover + 0.5) / bars.length) * 100}%`,
                bottom: `calc(${(bars[hover].value / top) * 100}% + 8px)`,
              }}
            >
              <span className="block whitespace-nowrap text-white/70">{bars[hover].label}</span>
              <span className="block whitespace-nowrap text-[14px] font-semibold tnum">{fmtEUR(bars[hover].value)}</span>
              <span className="block whitespace-nowrap text-white/70 tnum">{bars[hover].count} εργασίες</span>
            </div>
          )}
        </div>
      </div>
      <div className="ml-[60px] mt-2 flex gap-[2px] text-[11.5px] text-ink-3" aria-hidden>
        {bars.map((b, i) => (
          <span key={i} className="flex-1 truncate text-center tnum">
            {i % Math.ceil(bars.length / 7) === 0 ? b.sub : ""}
          </span>
        ))}
      </div>
      <details className="mt-4 text-[13px]">
        <summary className="cursor-pointer text-ink-3 hover:text-ink">Προβολή ως πίνακας</summary>
        <table className="mt-2 w-full max-w-md text-left tnum">
          <thead className="text-ink-3">
            <tr>
              <th className="py-1 font-normal">Εβδομάδα</th>
              <th className="py-1 text-right font-normal">Εργασίες</th>
              <th className="py-1 text-right font-normal">Έσοδα</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((b, i) => (
              <tr key={i} className="border-t border-line-2">
                <td className="py-1">{b.label}</td>
                <td className="py-1 text-right">{b.count}</td>
                <td className="py-1 text-right">{fmtEUR(b.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function niceStep(max: number) {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}
