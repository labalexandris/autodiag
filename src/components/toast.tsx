"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

type T = { id: number; text: string };

export function toast(text: string) {
  window.dispatchEvent(new CustomEvent("ad-toast", { detail: text }));
}

export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { id, text: (e as CustomEvent).detail }]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 3200);
    };
    window.addEventListener("ad-toast", on);
    return () => window.removeEventListener("ad-toast", on);
  }, []);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6"
      role="status"
      aria-live="polite"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="animate-rise flex items-center gap-2.5 rounded-lg bg-ink px-4 py-3 text-[14px] text-white shadow-lg"
        >
          <Check size={16} className="text-signal" />
          {t.text}
        </div>
      ))}
    </div>
  );
}
