"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_DAYS, createSession } from "@/lib/auth";
import { authenticate } from "@/lib/users";

export async function login(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const next = String(form.get("next") ?? "");
  const target = next.startsWith("/admin") ? next : "/admin";
  if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
    return { error: "Η σύνδεση δεν έχει ρυθμιστεί στον server (DATABASE_URL, SESSION_SECRET)." };
  }

  const user = await authenticate(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
  if (!user) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Λάθος όνομα χρήστη ή κωδικός." };
  }

  (await cookies()).set(SESSION_COOKIE, await createSession(user.id), {
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
  redirect("/login");
}
