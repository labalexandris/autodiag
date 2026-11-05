const moneyFmt = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' })
export const money = (n: number | string | null | undefined) => moneyFmt.format(Number(n ?? 0))

export const time = (d: string | Date) =>
  new Date(d).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', hour12: false })

export const date = (d: string | Date) =>
  new Date(d).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' })

export const dayLong = (d: Date) => d.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })

export const km = (n: number | null | undefined) => (n == null ? '—' : `${n.toLocaleString('el-GR')} km`)

export function relDay(d: string | Date) {
  const x = startOfDay(new Date(d)).getTime()
  const t = startOfDay(new Date()).getTime()
  const diff = Math.round((x - t) / 86400000)
  if (diff === 0) return 'Σήμερα'
  if (diff === 1) return 'Αύριο'
  if (diff === -1) return 'Χθες'
  return date(d)
}

export function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
export function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
/** Δευτέρα της εβδομάδας */
export function startOfWeek(d: Date) {
  const x = startOfDay(d)
  const day = (x.getDay() + 6) % 7
  return addDays(x, -day)
}
export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()

/** Date → τιμή για <input type="datetime-local"> */
export function toLocalInput(d: Date | string) {
  const x = new Date(d)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`
}

export const WO_STATUS = {
  open: { label: 'Ανοιχτή', cls: 'bg-slate-100 text-slate-700 ring-slate-300' },
  in_progress: { label: 'Σε εξέλιξη', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  ready: { label: 'Έτοιμο', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  delivered: { label: 'Παραδόθηκε', cls: 'bg-zinc-100 text-zinc-500 ring-zinc-200' },
} as const
export type WoStatus = keyof typeof WO_STATUS

export const APPT_STATUS = {
  scheduled: { label: 'Προγραμματισμένο', cls: 'bg-slate-100 text-slate-700' },
  arrived: { label: 'Ήρθε', cls: 'bg-blue-50 text-blue-700' },
  done: { label: 'Ολοκληρώθηκε', cls: 'bg-emerald-50 text-emerald-700' },
  no_show: { label: 'Δεν ήρθε', cls: 'bg-rose-50 text-rose-700' },
  cancelled: { label: 'Ακυρώθηκε', cls: 'bg-zinc-100 text-zinc-500 line-through' },
} as const
export type ApptStatus = keyof typeof APPT_STATUS

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
export function viberHref(phone: string) {
  let p = phone.replace(/\D/g, '')
  if (p.length === 10) p = '30' + p // ελληνικό κινητό χωρίς κωδικό χώρας
  return `viber://chat?number=%2B${p}`
}

export const vehicleName = (v: { make?: string | null; model?: string | null; year?: number | null }) =>
  [v.make, v.model, v.year].filter(Boolean).join(' ') || 'Όχημα'
