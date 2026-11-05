import type { FastifyRequest } from 'fastify'
import { z } from 'zod'

// Οι ελληνικές πινακίδες χρησιμοποιούν μόνο γράμματα κοινά με το λατινικό αλφάβητο.
const GR_TO_LAT: Record<string, string> = {
  Α: 'A', Β: 'B', Ε: 'E', Ζ: 'Z', Η: 'H', Ι: 'I', Κ: 'K', Μ: 'M', Ν: 'N', Ο: 'O', Ρ: 'P', Τ: 'T', Υ: 'Y', Χ: 'X',
}
const LAT_TO_GR = Object.fromEntries(Object.entries(GR_TO_LAT).map(([g, l]) => [l, g]))

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Κανονικοποίηση για αναζήτηση/μοναδικότητα: "ικβ-1234" → "IKB1234" */
export function normPlate(input: string): string {
  return stripAccents(input.toUpperCase())
    .split('')
    .map((c) => GR_TO_LAT[c] ?? c)
    .join('')
    .replace(/[^A-Z0-9]/g, '')
}

/** Μορφή εμφάνισης: "ikb1234" → "ΙΚΒ-1234" (μόνο για ελληνικού τύπου πινακίδες). */
export function formatPlate(input: string): string {
  const n = normPlate(input)
  const m = n.match(/^([A-Z]{2,3})(\d{1,4})$/)
  if (m && [...m[1]].every((c) => LAT_TO_GR[c])) {
    return `${[...m[1]].map((c) => LAT_TO_GR[c]).join('')}-${m[2]}`
  }
  return input.trim().toUpperCase()
}

/** Για αναζήτηση ονομάτων χωρίς τόνους/πεζά-κεφαλαία. Ταιριάζει με το foldSql παρακάτω. */
export function foldText(s: string) {
  return stripAccents(s.toLowerCase()).replace(/ς/g, 'σ').trim()
}
export const foldSql = (col: string) =>
  `translate(lower(coalesce(${col}, '')), 'άέήίόύώϊϋΐΰς', 'αεηιουωιυιυσ')`

export const digitsOnly = (s: string) => s.replace(/\D/g, '')

export function httpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode })
}

/** Κενά strings → null, ώστε τα προαιρετικά πεδία της φόρμας να αποθηκεύονται σωστά. */
export const optStr = z
  .string()
  .trim()
  .max(2000)
  .nullish()
  .transform((v) => (v ? v : null))

export const optInt = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v, ctx) => {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    if (!Number.isInteger(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Μη έγκυρος αριθμός' })
      return z.NEVER
    }
    return n
  })

export const uuid = z.string().uuid()
export const idParams = z.object({ id: uuid })

export function shopId(req: FastifyRequest): string {
  return req.user!.shop_id
}

/** Δημιουργεί SET clause για PATCH μόνο με τα πεδία που στάλθηκαν. */
export function buildUpdate(data: Record<string, unknown>, allowed: string[], startIndex = 1) {
  const cols: string[] = []
  const values: unknown[] = []
  for (const key of allowed) {
    if (key in data && data[key] !== undefined) {
      values.push(data[key])
      cols.push(`${key} = $${startIndex + values.length - 1}`)
    }
  }
  return { set: cols.join(', '), values }
}
