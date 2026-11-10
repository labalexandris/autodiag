"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

/**
 * Κοινό κέλυφος για τα παράθυρα του admin: sheet από κάτω στο κινητό,
 * κεντρικό παράθυρο ή πλαϊνό πάνελ στο desktop. Το βάζεις στη σελίδα μόνο
 * όσο είναι ανοιχτό: `{open && <Sheet onClose={...}>}`.
 */
export function Sheet({
  title,
  onClose,
  onSubmit,
  footer,
  children,
  variant = "center",
}: {
  title: React.ReactNode;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  variant?: "center" | "side";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  // Όσο το component υπάρχει, το παράθυρο είναι ανοιχτό. Δεν καλούμε close() στο
  // unmount: η αφαίρεση από το DOM το κλείνει, ενώ το close() στέλνει ένα
  // καθυστερημένο «close» που (με το διπλό mount του React σε dev) το έκλεινε
  // αμέσως μετά το άνοιγμα.
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  });

  const inner = (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-line-2 px-5 py-4">
        <h2 id={id} className="min-w-0 font-cond text-[21px] font-semibold">
          {title}
        </h2>
        <button type="button" className="btn btn-ghost btn-sm -mr-2 shrink-0" onClick={onClose} aria-label="Κλείσιμο">
          <X size={18} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      {footer && (
        <footer className="flex items-center justify-between gap-3 border-t border-line-2 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</footer>
      )}
    </>
  );
  const body = cn("flex h-full max-h-[94dvh] flex-col", variant === "side" && "sm:max-h-none");

  return (
    <dialog
      ref={ref}
      // Ένα «close» που έρχεται ενώ το παράθυρο είναι ανοιχτό είναι παλιό (π.χ. από το
      // διπλό mount του React σε dev) και δεν πρέπει να το κλείσει.
      onClose={() => {
        if (!ref.current?.open) onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby={id}
      className={cn(
        "m-0 mt-auto max-h-[94dvh] w-full max-w-none overflow-hidden rounded-t-2xl bg-panel p-0 text-ink backdrop:bg-ink/40",
        variant === "center" && "sm:m-auto sm:max-w-[520px] sm:rounded-2xl",
        variant === "side" && "sm:ml-auto sm:mr-0 sm:mt-0 sm:h-dvh sm:max-h-none sm:w-[480px] sm:rounded-none",
      )}
    >
      {onSubmit ? (
        <form onSubmit={onSubmit} className={body}>
          {inner}
        </form>
      ) : (
        <div className={body}>{inner}</div>
      )}
    </dialog>
  );
}
