import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, isValidSession } from "./auth";

/** Για server actions του admin: το proxy προστατεύει τις σελίδες, αυτό τις ενέργειες. */
export async function requireAdmin() {
  const store = await cookies();
  if (!(await isValidSession(store.get(SESSION_COOKIE)?.value))) throw new Error("Χρειάζεται σύνδεση.");
}
