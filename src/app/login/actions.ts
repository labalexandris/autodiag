"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_DAYS, sessionValue } from "@/lib/auth";

export async function login(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const expected = process.env.ADMIN_PASSWORD;
  const next = String(form.get("next") ?? "");
  const target = next.startsWith("/admin") ? next : "/admin";
  if (!expected) redirect(target);

  const given = String(form.get("password") ?? "");
  // Σύγκριση των hash, ώστε ο χρόνος να μην εξαρτάται από το πόσο μοιάζουν οι κωδικοί
  if ((await sessionValue(given)) !== (await sessionValue(expected))) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Λάθος κωδικός." };
  }

  (await cookies()).set(SESSION_COOKIE, await sessionValue(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  redirect(target);
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}
