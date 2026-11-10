/*
 * Απλή προστασία του /admin με έναν κωδικό (μεταβλητή ADMIN_PASSWORD).
 * Χωρίς τη μεταβλητή το admin μένει ανοιχτό, ώστε το demo να δουλεύει τοπικά.
 * Το cookie κρατά ένα hash του κωδικού: αν αλλάξει ο κωδικός, όλες οι
 * συνδέσεις λήγουν. Όταν μπουν πολλοί χρήστες, αντικαθίσταται από κανονικό auth.
 */

export const SESSION_COOKIE = "ad_session";
export const SESSION_DAYS = 30;

export const authEnabled = () => Boolean(process.env.ADMIN_PASSWORD);

export async function sessionValue(password: string) {
  const bytes = new TextEncoder().encode(`autodiag-admin:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isValidSession(cookie: string | undefined) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return true;
  if (!cookie) return false;
  return cookie === (await sessionValue(password));
}
