"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { changeOwnPassword } from "@/app/admin/settings/actions";
import { Sheet } from "@/components/sheet";
import { toast } from "@/components/toast";

/** Στοιχεία του συνδεδεμένου χρήστη και αλλαγή του δικού του κωδικού. */
export function Account({ name, username, roleLabel }: { name: string; username: string; roleLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-[15px] font-medium">{name}</p>
        <p className="text-[13px] text-ink-3">
          {roleLabel}, όνομα χρήστη <span className="font-medium text-ink-2">{username}</span>
        </p>
      </div>
      <button className="btn btn-outline" onClick={() => setOpen(true)}>
        <KeyRound size={15} /> Αλλαγή κωδικού
      </button>
      {open && <PasswordForm onClose={() => setOpen(false)} />}
    </div>
  );
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setError(null);
      const r = await changeOwnPassword(current, next);
      if (!r.ok) return setError(r.error);
      toast("Ο κωδικός άλλαξε");
      onClose();
    });
  };

  return (
    <Sheet
      title="Αλλαγή κωδικού"
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <span className="text-[13px] text-fuse-red">{error}</span>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? "Αποθήκευση…" : "Αποθήκευση"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Τρέχων κωδικός</span>
          <input className="field" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium">Νέος κωδικός</span>
          <input className="field" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
        </label>
      </div>
    </Sheet>
  );
}
