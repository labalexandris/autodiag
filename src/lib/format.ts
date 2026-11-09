const tz = "Europe/Athens";

export const fmtEUR = (n: number, digits = 0) =>
  new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);

export const fmtNum = (n: number) => new Intl.NumberFormat("el-GR").format(n);
export const fmtKm = (n: number) => `${fmtNum(n)} km`;

export const fmtTime = (d: string | Date) =>
  new Intl.DateTimeFormat("el-GR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(new Date(d));

export const fmtDate = (d: string | Date) =>
  new Intl.DateTimeFormat("el-GR", { day: "numeric", month: "short", year: "numeric", timeZone: tz }).format(new Date(d));

export const fmtDayLong = (d: string | Date) =>
  new Intl.DateTimeFormat("el-GR", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(new Date(d));

export const fmtDayShort = (d: string | Date) =>
  new Intl.DateTimeFormat("el-GR", { weekday: "short", timeZone: tz }).format(new Date(d));

export const fmtDayNum = (d: string | Date) =>
  new Intl.DateTimeFormat("el-GR", { day: "numeric", timeZone: tz }).format(new Date(d));

export const fmtMonthShort = (d: string | Date) =>
  new Intl.DateTimeFormat("el-GR", { month: "short", timeZone: tz }).format(new Date(d));

export function relativeDays(d: string | Date) {
  const a = new Date(d);
  a.setHours(0, 0, 0, 0);
  const b = new Date();
  b.setHours(0, 0, 0, 0);
  const diff = Math.round((a.getTime() - b.getTime()) / 86400000);
  if (diff === 0) return "σήμερα";
  if (diff === 1) return "αύριο";
  if (diff === -1) return "χθες";
  const months = (n: number) => (n === 1 ? "1 μήνα" : `${n} μήνες`);
  const years = (n: number) => (n === 1 ? "1 χρόνο" : `${n} χρόνια`);
  if (diff > 0) return diff < 30 ? `σε ${diff} μέρες` : diff < 365 ? `σε ${months(Math.round(diff / 30))}` : `σε ${years(Math.round(diff / 365))}`;
  return -diff < 30 ? `πριν ${-diff} μέρες` : -diff < 365 ? `πριν ${months(Math.round(-diff / 30))}` : `πριν ${years(Math.round(-diff / 365))}`;
}

export const daysUntil = (d: string | Date) => {
  const a = new Date(d);
  a.setHours(0, 0, 0, 0);
  const b = new Date();
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
};

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function fmtDuration(min: number, long = false) {
  if (min < 60) return long ? `${min} λεπτά` : `${min}′`;
  const h = min / 60;
  const n = String(h).replace(".", ",");
  return `${n} ${h === 1 ? "ώρα" : "ώρες"}`;
}
