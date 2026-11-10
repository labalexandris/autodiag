import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, readSession } from "./auth";
import { getUser, type User } from "./users";

/** Ο συνδεδεμένος χρήστης, αν το cookie είναι έγκυρο και ο χρήστης ενεργός. Μία ανάγνωση ανά request. */
export const getCurrentUser = cache(async (): Promise<User | undefined> => {
  const id = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!id) return undefined;
  const user = await getUser(id);
  return user?.active ? user : undefined;
});

/** Για σελίδες και ενέργειες του admin: το proxy ελέγχει μόνο την υπογραφή, αυτό και τη βάση. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Μόνο για ιδιοκτήτες. Ο υπάλληλος γυρίζει στην αρχική του admin. */
export async function requireOwner(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/admin");
  return user;
}
