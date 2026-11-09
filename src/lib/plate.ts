// Λατινικά → ελληνικά γράμματα που μοιάζουν (οι πινακίδες χρησιμοποιούν μόνο αυτά)
const latinToGreek: Record<string, string> = {
  A: "Α", B: "Β", E: "Ε", Z: "Ζ", H: "Η", I: "Ι", K: "Κ", M: "Μ",
  N: "Ν", O: "Ο", P: "Ρ", T: "Τ", Y: "Υ", X: "Χ",
};

/** «ikb 4821», «IKB-4821», «ΙΚΒ4821» → «ΙΚΒ4821» */
export function normalizePlate(input: string) {
  return input
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-ZΑ-Ω0-9]/g, "")
    .replace(/[A-Z]/g, (c) => latinToGreek[c] ?? c);
}

/** Μορφοποίηση για εμφάνιση: «ΙΚΒ4821» → «ΙΚΒ-4821» */
export function formatPlate(input: string) {
  const n = normalizePlate(input);
  const m = n.match(/^([Α-Ω]{1,3})(\d{1,4})$/);
  return m ? `${m[1]}-${m[2]}` : n;
}

export function isValidPlate(input: string) {
  return /^[ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ]{3}\d{4}$/.test(normalizePlate(input));
}
