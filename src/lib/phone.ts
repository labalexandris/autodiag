/** «+30 6944 123 456», «0030694…», «6944123456» → «6944123456». Null αν δεν είναι ελληνικό κινητό. */
export function normalizeMobile(input: string) {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("0030")) d = d.slice(4);
  else if (d.startsWith("30") && d.length === 12) d = d.slice(2);
  return /^69\d{8}$/.test(d) ? d : null;
}

/** Οποιοδήποτε ελληνικό τηλέφωνο 10 ψηφίων (για καταχώρηση από το συνεργείο). */
export function normalizePhone(input: string) {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("0030")) d = d.slice(4);
  else if (d.startsWith("30") && d.length === 12) d = d.slice(2);
  return /^[26]\d{9}$/.test(d) ? d : null;
}

/** «6944123456» → «6944 123 456» */
export function formatPhone(input: string) {
  const d = normalizePhone(input);
  if (!d) return input.trim();
  return d.startsWith("69") ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export const samePhone = (a: string, b: string) => {
  const x = normalizePhone(a) ?? a.replace(/\D/g, "");
  const y = normalizePhone(b) ?? b.replace(/\D/g, "");
  return x === y;
};
