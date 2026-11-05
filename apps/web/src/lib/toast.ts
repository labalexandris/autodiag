import { reactive } from 'vue'

export interface Toast {
  id: number
  text: string
  kind: 'ok' | 'error'
}
export const toasts = reactive<Toast[]>([])
let seq = 0

export function toast(text: string, kind: Toast['kind'] = 'ok') {
  const id = ++seq
  toasts.push({ id, text, kind })
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id)
    if (i >= 0) toasts.splice(i, 1)
  }, kind === 'error' ? 4500 : 2200)
}

export const toastError = (e: unknown) => toast(e instanceof Error ? e.message : 'Κάτι πήγε στραβά', 'error')
