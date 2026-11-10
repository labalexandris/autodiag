"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { clearAllData, resetDemoData } from "@/app/admin/settings/actions";
import { Sheet } from "@/components/sheet";
import { toast } from "@/components/toast";

/** Demo δεδομένα: ανανέωση (σχετικά με σήμερα) ή άδειασμα για πραγματική χρήση. Μόνο ιδιοκτήτες. */
export function DemoData({ state }: { state?: string }) {
  const [open, setOpen] = useState<"reset" | "clear" | null>(null);
  return (
    <div className="space-y-4">
      <p className="text-[14px] text-ink-2">
        {state === "cleared"
          ? "Η εφαρμογή έχει μόνο πραγματικά δεδομένα."
          : "Η εφαρμογή έχει ψεύτικους πελάτες, ραντεβού και βιβλιάρια για δοκιμές και παρουσίαση."}
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-outline" onClick={() => setOpen("reset")}>
          <RefreshCw size={15} /> Νέα demo δεδομένα
        </button>
        {state !== "cleared" && (
          <button className="btn btn-outline text-fuse-red" onClick={() => setOpen("clear")}>
            <Trash2 size={15} /> Άδειασμα για πραγματική χρήση
          </button>
        )}
      </div>
      {open === "reset" && <ResetDialog onClose={() => setOpen(null)} />}
      {open === "clear" && <ClearDialog onClose={() => setOpen(null)} />}
    </div>
  );
}

function ResetDialog({ onClose }: { onClose: () => void }) {
  const [pending, start] = useTransition();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      await resetDemoData();
      toast("Νέα demo δεδομένα, με σημερινό πρόγραμμα");
      onClose();
    });
  };
  return (
    <Sheet
      title="Νέα demo δεδομένα"
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Άκυρο
          </button>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? "Δημιουργία…" : "Δημιουργία"}
          </button>
        </>
      }
    >
      <p className="text-[15px] text-ink-2">
        Όλοι οι πελάτες, τα οχήματα, τα ραντεβού και τα βιβλιάρια <strong className="text-ink">σβήνονται</strong> και φτιάχνονται καινούργια ψεύτικα, με
        ιστορικό ενός χρόνου και πρόγραμμα από σήμερα. Οι χρήστες δεν αλλάζουν.
      </p>
    </Sheet>
  );
}

function ClearDialog({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setError(null);
      const r = await clearAllData(text);
      if (!r.ok) return setError(r.error);
      toast("Τα δεδομένα σβήστηκαν. Η εφαρμογή είναι έτοιμη για πραγματική χρήση.");
      onClose();
    });
  };
  return (
    <Sheet
      title="Άδειασμα για πραγματική χρήση"
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <span className="text-[13px] text-fuse-red">{error}</span>
          <button className="btn btn-primary bg-fuse-red hover:bg-fuse-red" disabled={pending}>
            {pending ? "Διαγραφή…" : "Διαγραφή όλων"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[15px] text-ink-2">
          Σβήνονται <strong className="text-ink">όλοι</strong> οι πελάτες, τα οχήματα, τα ραντεβού και τα βιβλιάρια, και δεν ξαναγυρίζουν. Οι χρήστες μένουν. Κάντε το
          μία φορά, όταν ξεκινήσετε να τη χρησιμοποιείτε με πραγματικούς πελάτες.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">
            Γράψε <span className="font-cond tracking-wide">ΔΙΑΓΡΑΦΗ</span> για επιβεβαίωση
          </span>
          <input className="field" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" required />
        </label>
      </div>
    </Sheet>
  );
}
