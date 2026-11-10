"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, TriangleAlert, User } from "lucide-react";
import { login } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, {});
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="mt-7 space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <p role="alert" className="flex items-start gap-2.5 rounded-lg border border-fuse-red/25 bg-fuse-red/[0.06] px-3.5 py-3 text-[14px] text-[#a3302d]">
          <TriangleAlert size={17} className="mt-px shrink-0" />
          {state.error}
        </p>
      )}
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium">Όνομα χρήστη</span>
        <span className="relative block">
          <User size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            className="field h-12 !pl-11 text-[16px]"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="π.χ. manolis"
            autoFocus
            required
            aria-invalid={!!state.error}
          />
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium">Κωδικός</span>
        <span className="relative block">
          <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            className="field h-12 !pl-11 !pr-12 text-[16px]"
            type={show ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            aria-invalid={!!state.error}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-ink-3 hover:bg-sunk hover:text-ink"
            aria-label={show ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
            aria-pressed={show}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      <button className="btn btn-primary btn-lg group mt-2 w-full" disabled={pending}>
        {pending ? (
          "Έλεγχος…"
        ) : (
          <>
            Είσοδος <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  );
}
