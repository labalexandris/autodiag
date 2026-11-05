import { auth } from './auth'

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message)
  }
}

type Opts = { method?: string; body?: unknown; form?: FormData; query?: Record<string, string | undefined> }

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  let url = '/api' + path
  if (opts.query) {
    const qs = new URLSearchParams(Object.entries(opts.query).filter(([, v]) => v !== undefined) as [string, string][])
    if ([...qs].length) url += '?' + qs
  }
  const hasBody = opts.body !== undefined
  let res: Response
  try {
    res = await fetch(url, {
      method: opts.method ?? (hasBody || opts.form ? 'POST' : 'GET'),
      headers: hasBody ? { 'content-type': 'application/json' } : undefined,
      body: opts.form ?? (hasBody ? JSON.stringify(opts.body) : undefined),
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError(0, 'Δεν υπάρχει σύνδεση στο διαδίκτυο')
  }
  if (res.status === 401 && !path.startsWith('/auth/')) {
    auth.user = null
    const { router } = await import('../router')
    router.replace({ name: 'login', query: { next: router.currentRoute.value.fullPath } })
    throw new ApiError(401, 'Απαιτείται σύνδεση')
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Σφάλμα (${res.status})`, data)
  return data as T
}

export const get = <T = any>(path: string, query?: Opts['query']) => api<T>(path, { query })
export const post = <T = any>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body: body ?? {} })
export const patch = <T = any>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body })
export const del = (path: string) => api(path, { method: 'DELETE' })
