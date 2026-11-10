/*
 * Session cookie με υπογραφή: `userId.λήξη.υπογραφή` (HMAC-SHA256 με
 * SESSION_SECRET). Χρησιμοποιείται και από το proxy, γι' αυτό μόνο Web Crypto
 * και καμία πρόσβαση στη βάση. Το αν ο χρήστης είναι ακόμα ενεργός το
 * ελέγχει το auth-server σε κάθε σελίδα και ενέργεια.
 */

export const SESSION_COOKIE = "ad_session";
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

const b64url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function sign(payload: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Λείπει το SESSION_SECRET.");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
}

export async function createSession(userId: string) {
  const exp = Date.now() + SESSION_DAYS * 86400000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${await sign(payload)}`;
}

/** Το id του χρήστη αν το cookie είναι έγκυρο και δεν έχει λήξει, αλλιώς null. */
export async function readSession(cookie: string | undefined): Promise<string | null> {
  if (!cookie || !process.env.SESSION_SECRET) return null;
  const parts = cookie.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  if (!(Number(exp) > Date.now())) return null;
  const expected = await sign(`${userId}.${exp}`);
  // Σύγκριση σταθερού χρόνου
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? userId : null;
}
