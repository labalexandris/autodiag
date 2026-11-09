// GSM 03.38 βασικό σύνολο (περιλαμβάνει και ορισμένα κεφαλαία ελληνικά)
const GSM =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXT = "^{}\\[~]|€";

export function smsInfo(text: string) {
  let gsm = true;
  let len = 0;
  for (const ch of text) {
    if (GSM.includes(ch)) len += 1;
    else if (GSM_EXT.includes(ch)) len += 2;
    else {
      gsm = false;
      break;
    }
  }
  if (!gsm) len = [...text].length;
  const single = gsm ? 160 : 70;
  const multi = gsm ? 153 : 67;
  const segments = len === 0 ? 0 : len <= single ? 1 : Math.ceil(len / multi);
  return { encoding: gsm ? ("GSM-7" as const) : ("Unicode" as const), length: len, segments, perSegment: segments > 1 ? multi : single };
}

const map: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "ks", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "x", ψ: "ps", ω: "o",
};

export function toGreeklish(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ου/g, "ou")
    .replace(/Ου/g, "Ou")
    .replace(/ΟΥ/g, "OU")
    .replace(/[α-ωςΑ-Ω]/g, (c) => {
      const lower = c.toLowerCase();
      const t = map[lower] ?? c;
      return c === lower ? t : t.charAt(0).toUpperCase() + t.slice(1);
    })
    .replace(/€/g, "EUR");
}
