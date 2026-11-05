import { reactive } from 'vue'
import { api } from './api'

export interface User {
  id: string
  shop_id: string
  name: string
  email: string
  role: 'owner' | 'tech'
}
export interface Shop {
  id: string
  name: string
  phone: string | null
  address: string | null
  vat_number: string | null
}

export const auth = reactive({ user: null as User | null, shop: null as Shop | null, loaded: false })

export async function loadMe() {
  try {
    const r = await api<{ user: User; shop: Shop }>('/auth/me')
    auth.user = r.user
    auth.shop = r.shop
  } catch {
    auth.user = null
  }
  auth.loaded = true
}

export async function login(email: string, password: string) {
  await api('/auth/login', { method: 'POST', body: { email, password } })
  await loadMe()
}

export async function logout() {
  await api('/auth/logout', { method: 'POST', body: {} }).catch(() => {})
  auth.user = null
  auth.shop = null
  // Καθαρίζουμε τα offline δεδομένα του προηγούμενου χρήστη
  if ('caches' in window) await caches.delete('api').catch(() => {})
}
