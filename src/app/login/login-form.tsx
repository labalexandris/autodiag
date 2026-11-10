"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, {});
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium">Όνομα χρήστη</span>
        <input
          className="field"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          required
          aria-invalid={!!state.error}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium">Κωδικός</span>
        <span className="relative block">
          <input
            className="field !pr-11"
            type={show ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            aria-invalid={!!state.error}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-ink-3 hover:text-ink"
            aria-label={show ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
            aria-pressed={show}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
      </label>
      {state.error && (
        <p role="alert" className="text-[13px] text-fuse-red">
          {state.error}
        </p>
      )}
      <button className="btn btn-primary btn-lg w-full" disabled={pending}>
        {pending ? "Έλεγχος…" : "Είσοδος"}
      </button>
    </form>
  );
}
