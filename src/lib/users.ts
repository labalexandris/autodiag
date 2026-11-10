import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ensureDb, sql } from "./db";

/*
 * Οι χρήστες του συνεργείου, στο Neon. Ο πίνακας φτιάχνεται μόνος του στην
 * πρώτη χρήση και, αν είναι άδειος, μπαίνουν οι δύο ιδιοκτήτες.
 */

export type Role = "owner" | "staff";

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  active: boolean;
}

export const roleLabel: Record<Role, string> = { owner: "Ιδιοκτήτης", staff: "Υπάλληλος" };

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

async function checkPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const given = await scrypt(password, Buffer.from(salt, "hex"), 64);
  const expected = Buffer.from(hash, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const db = sql;

const SEED: { username: string; name: string; role: Role; password: string }[] = [
  { username: "manolis", name: "Μανώλης Παπουτσάκης", role: "owner", password: "123" },
  { username: "dimitris", name: "Δημήτρης Κωτσάς", role: "owner", password: "123" },
];

let ready: Promise<void> | null = null;

/** Μία φορά ανά εκκίνηση του server: πίνακες (db.ts) και αρχικοί χρήστες. */
function ensureSchema() {
  ready ??= (async () => {
    await ensureDb();
    const sql = db();
    const [{ n }] = (await sql`SELECT count(*)::int AS n FROM users`) as { n: number }[];
    if (n === 0) {
      for (const u of SEED) {
        await sql`INSERT INTO users (username, name, role, password_hash)
                  VALUES (${u.username}, ${u.name}, ${u.role}, ${await hashPassword(u.password)})
                  ON CONFLICT (username) DO NOTHING`;
      }
    }
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

type Row = { id: string; username: string; name: string; role: Role; active: boolean };
const toUser = (r: Row): User => ({ id: r.id, username: r.username, name: r.name, role: r.role, active: r.active });

const UUID = /^[0-9a-f-]{36}$/i;

export async function getUser(id: string): Promise<User | undefined> {
  if (!UUID.test(id)) return undefined;
  await ensureSchema();
  const rows = (await db()`SELECT id, username, name, role, active FROM users WHERE id = ${id}`) as Row[];
  return rows[0] && toUser(rows[0]);
}

export async function listUsers(): Promise<User[]> {
  await ensureSchema();
  const rows = (await db()`SELECT id, username, name, role, active FROM users ORDER BY active DESC, role, name`) as Row[];
  return rows.map(toUser);
}

/** Ο χρήστης αν το όνομα χρήστη και ο κωδικός είναι σωστά και είναι ενεργός. */
export async function authenticate(username: string, password: string): Promise<User | undefined> {
  await ensureSchema();
  const rows = (await db()`
    SELECT id, username, name, role, active, password_hash FROM users WHERE username = ${normalizeUsername(username)}`) as (Row & {
    password_hash: string;
  })[];
  const row = rows[0];
  // Υπολογίζουμε hash και όταν δεν υπάρχει ο χρήστης, ώστε ο χρόνος να μη μαρτυρά ποια ονόματα υπάρχουν
  const ok = await checkPassword(password, row?.password_hash ?? "00:00");
  return row && ok && row.active ? toUser(row) : undefined;
}

export async function verifyPassword(id: string, password: string) {
  await ensureSchema();
  const rows = (await db()`SELECT password_hash FROM users WHERE id = ${id}`) as { password_hash: string }[];
  return !!rows[0] && (await checkPassword(password, rows[0].password_hash));
}

export const normalizeUsername = (s: string) => s.trim().toLowerCase();
export const validUsername = (s: string) => /^[a-z0-9._-]{3,30}$/.test(s);
export const MIN_PASSWORD = 3;

export class UserError extends Error {}

export async function createUser(input: { username: string; name: string; role: Role; password: string }) {
  await ensureSchema();
  try {
    await db()`INSERT INTO users (username, name, role, password_hash)
               VALUES (${input.username}, ${input.name}, ${input.role}, ${await hashPassword(input.password)})`;
  } catch (e) {
    if (String((e as { code?: string }).code) === "23505") throw new UserError("Υπάρχει ήδη χρήστης με αυτό το όνομα χρήστη.");
    throw e;
  }
}

export async function updateUser(id: string, patch: { name: string; role: Role; active: boolean; password?: string }) {
  await ensureSchema();
  const sql = db();
  const current = await getUser(id);
  if (!current) throw new UserError("Ο χρήστης δεν βρέθηκε.");

  // Πρέπει να μένει πάντα τουλάχιστον ένας ενεργός ιδιοκτήτης
  const losesOwner = current.role === "owner" && current.active && (patch.role !== "owner" || !patch.active);
  if (losesOwner) {
    const [{ n }] = (await sql`SELECT count(*)::int AS n FROM users WHERE role = 'owner' AND active AND id <> ${id}`) as { n: number }[];
    if (n === 0) throw new UserError("Πρέπει να υπάρχει τουλάχιστον ένας ενεργός ιδιοκτήτης.");
  }

  await sql`UPDATE users SET name = ${patch.name}, role = ${patch.role}, active = ${patch.active} WHERE id = ${id}`;
  if (patch.password) await setPassword(id, patch.password);
}

export async function setPassword(id: string, password: string) {
  await ensureSchema();
  await db()`UPDATE users SET password_hash = ${await hashPassword(password)} WHERE id = ${id}`;
}
