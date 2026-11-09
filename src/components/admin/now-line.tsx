"use client";

import { useEffect, useState } from "react";

/** Κίτρινη γραμμή «τώρα» στον πίνακα ημέρας. Υπολογίζεται μόνο στον client. */
export function NowLine({ start, end, offsetPx }: { start: number; end: number; offsetPx: number }) {
  const [pct, setPct] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const m = (d.getHours() - start) * 60 + d.getMinutes();
      const span = (end - start) * 60;
      setPct(m < 0 || m > span ? null : (m / span) * 100);
    };
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [start, end]);

  if (pct === null) return null;
  return (
    <div
      className="pointer-events-none absolute bottom-0 top-0 z-10"
      style={{ left: `calc(${offsetPx}px + (100% - ${offsetPx}px) * ${pct / 100})` }}
      aria-hidden
    >
      <span className="absolute -left-[5px] top-[22px] size-[10px] rounded-full bg-signal ring-2 ring-panel" />
      <span className="absolute bottom-0 top-[27px] -left-px w-[2px] bg-signal" />
    </div>
  );
}
