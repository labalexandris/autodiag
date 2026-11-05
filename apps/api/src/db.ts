import fs from 'node:fs'
import path from 'node:path'

/**
 * Λεπτό στρώμα πάνω από Postgres.
 * - Με DATABASE_URL → κανονικός Postgres server (pg Pool).
 * - Χωρίς → PGlite (ενσωματωμένος Postgres, αρχεία στο ./.data/pglite) για εύκολο development.
 */
type Row = Record<string, any>
type QueryFn = <T extends Row = Row>(sql: string, params?: unknown[]) => Promise<T[]>
type ExecFn = (sql: string) => Promise<void>

let queryImpl: QueryFn | null = null
let execImpl: ExecFn | null = null
let closeImpl: (() => Promise<void>) | null = null

export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? './.data')

export async function initDb() {
  if (queryImpl) return
  const url = process.env.DATABASE_URL
  if (url) {
    const pg = (await import('pg')).default
    const pool = new pg.Pool({ connectionString: url })
    queryImpl = async (sql, params) => (await pool.query(sql, params as any[])).rows
    execImpl = async (sql) => { await pool.query(sql) }
    closeImpl = () => pool.end()
  } else {
    const { PGlite } = await import('@electric-sql/pglite')
    const dir = path.join(DATA_DIR, 'pglite')
    fs.mkdirSync(dir, { recursive: true })
    const db = new PGlite(dir)
    await db.waitReady
    queryImpl = async (sql, params) => (await db.query(sql, params as any[])).rows as any
    execImpl = async (sql) => { await db.exec(sql) }
    closeImpl = () => db.close()
  }
}

export const q: QueryFn = (sql, params) => {
  if (!queryImpl) throw new Error('DB not initialised')
  return queryImpl(sql, params)
}

export async function one<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T | undefined> {
  return (await q<T>(sql, params))[0]
}

export async function exec(sql: string) {
  if (!execImpl) throw new Error('DB not initialised')
  return execImpl(sql)
}

export async function closeDb() {
  await closeImpl?.()
  queryImpl = execImpl = closeImpl = null
}

/** Εφαρμόζει όσα αρχεία του /migrations δεν έχουν τρέξει ακόμα, με αλφαβητική σειρά. */
export async function migrate() {
  await exec(`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`)
  const dir = path.resolve(import.meta.dirname, '../migrations')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
  const done = new Set((await q<{ name: string }>('select name from schema_migrations')).map((r) => r.name))
  for (const f of files) {
    if (done.has(f)) continue
    const sql = fs.readFileSync(path.join(dir, f), 'utf8')
    await exec(`begin;\n${sql}\ninsert into schema_migrations(name) values ('${f.replace(/'/g, "''")}');\ncommit;`)
    console.log(`[migrate] applied ${f}`)
  }
}
