"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium">Κωδικός</span>
        <input className="field" type="password" name="password" autoComplete="current-password" autoFocus required aria-invalid={!!state.error} />
        {state.error && <span className="mt-1.5 block text-[13px] text-fuse-red">{state.error}</span>}
      </label>
      <button className="btn btn-primary btn-lg w-full" disabled={pending}>
        {pending ? "Έλεγχος…" : "Είσοδος"}
      </button>
    </form>
  );
}
