import type { Shop } from "./types";

/*
 * Το ωράριο ορίζεται μόνο στο shop.hours. Ό,τι δείχνει ώρες ή ημέρες
 * (πίνακας ημέρας, ημερολόγιο, κράτηση, αρχική) το διαβάζει από εδώ.
 */

const dayNames = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};
const mondayFirst = (day: number) => (day + 6) % 7;
const short = (hhmm: string) => hhmm.replace(/^0/, "");

export function openDays(shop: Shop) {
  return shop.hours
    .filter((h) => h.open && h.close)
    .sort((a, b) => mondayFirst(a.day) - mondayFirst(b.day)) as { day: number; open: string; close: string }[];
}

/** Ώρες λειτουργίας μιας ημέρας σε λεπτά από τα μεσάνυχτα, ή null αν είναι κλειστά. */
export function dayHours(shop: Shop, weekday: number) {
  const h = shop.hours.find((x) => x.day === weekday);
  return h?.open && h.close ? { open: toMin(h.open), close: toMin(h.close) } : null;
}

/** Η πιο νωρίς και η πιο αργά ώρα της εβδομάδας, σε ακέραιες ώρες, για τους άξονες. */
export function hoursBounds(shop: Shop) {
  const days = openDays(shop);
  if (days.length === 0) return { start: 8, end: 17 };
  return {
    start: Math.floor(Math.min(...days.map((d) => toMin(d.open))) / 60),
    end: Math.ceil(Math.max(...days.map((d) => toMin(d.close))) / 60),
  };
}

/** Ώρες ανά 30′ για φόρμες, π.χ. ["08:00", "08:30", ...] */
export function halfHourOptions(shop: Shop) {
  const { start, end } = hoursBounds(shop);
  const out: string[] = [];
  for (let t = start * 60; t < end * 60; t += 30) out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${t % 60 ? "30" : "00"}`);
  return out;
}

/** «Δευτέρα έως Παρασκευή 8:00–17:00, Σάββατο 9:00–14:00» */
export function hoursSummary(shop: Shop) {
  const days = openDays(shop);
  const groups: { from: number; to: number; open: string; close: string }[] = [];
  for (const d of days) {
    const last = groups[groups.length - 1];
    if (last && last.open === d.open && last.close === d.close && mondayFirst(d.day) === mondayFirst(last.to) + 1) last.to = d.day;
    else groups.push({ from: d.day, to: d.day, open: d.open, close: d.close });
  }
  if (groups.length === 0) return "Κατόπιν ραντεβού";
  return groups
    .map((g) => {
      const span = mondayFirst(g.to) - mondayFirst(g.from);
      const label = span === 0 ? dayNames[g.from] : span === 1 ? `${dayNames[g.from]} και ${dayNames[g.to]}` : `${dayNames[g.from]} έως ${dayNames[g.to]}`;
      return `${label} ${short(g.open)}–${short(g.close)}`;
    })
    .join(", ");
}

export const weekdayName = (day: number) => dayNames[day];
