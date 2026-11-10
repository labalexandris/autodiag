"use server";

import { revalidatePath } from "next/cache";
import { requireOwner, requireUser } from "@/lib/auth-server";
import {
  MIN_PASSWORD,
  UserError,
  createUser,
  normalizeUsername,
  setPassword,
  updateUser,
  validUsername,
  verifyPassword,
  type Role,
} from "@/lib/users";

type Result = { ok: true } | { ok: false; error: string };
const isRole = (r: string): r is Role => r === "owner" || r === "staff";
const fail = (e: unknown): Result => {
  if (e instanceof UserError) return { ok: false, error: e.message };
  throw e;
};

export async function changeOwnPassword(current: string, next: string): Promise<Result> {
  const user = await requireUser();
  if (next.length < MIN_PASSWORD) return { ok: false, error: `Ο νέος κωδικός θέλει τουλάχιστον ${MIN_PASSWORD} χαρακτήρες.` };
  if (!(await verifyPassword(user.id, current))) return { ok: false, error: "Ο τρέχων κωδικός δεν είναι σωστός." };
  await setPassword(user.id, next);
  return { ok: true };
}

export async function addUser(input: { name: string; username: string; role: string; password: string }): Promise<Result> {
  await requireOwner();
  const name = input.name.trim();
  const username = normalizeUsername(input.username);
  if (name.length < 3) return { ok: false, error: "Συμπλήρωσε το ονοματεπώνυμο." };
  if (!validUsername(username)) return { ok: false, error: "Όνομα χρήστη: 3–30 λατινικοί χαρακτήρες, αριθμοί ή . _ -" };
  if (!isRole(input.role)) return { ok: false, error: "Διάλεξε ρόλο." };
  if (input.password.length < MIN_PASSWORD) return { ok: false, error: `Ο κωδικός θέλει τουλάχιστον ${MIN_PASSWORD} χαρακτήρες.` };
  try {
    await createUser({ name, username, role: input.role, password: input.password });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function editUser(id: string, input: { name: string; role: string; active: boolean; password?: string }): Promise<Result> {
  await requireOwner();
  const name = input.name.trim();
  if (name.length < 3) return { ok: false, error: "Συμπλήρωσε το ονοματεπώνυμο." };
  if (!isRole(input.role)) return { ok: false, error: "Διάλεξε ρόλο." };
  const password = input.password || undefined;
  if (password && password.length < MIN_PASSWORD) return { ok: false, error: `Ο κωδικός θέλει τουλάχιστον ${MIN_PASSWORD} χαρακτήρες.` };
  try {
    await updateUser(id, { name, role: input.role, active: input.active, password });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}
