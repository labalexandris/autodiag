<script setup lang="ts">
import { CalendarDays, Copy, LogOut, RefreshCw } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import { get, patch, post } from '../lib/api'
import { auth, loadMe, logout } from '../lib/auth'
import { toast, toastError } from '../lib/toast'

const router = useRouter()
const shop = reactive({ name: '', phone: '', address: '', vat_number: '' })
const icsUrl = ref('')
const pw = reactive({ current: '', next: '' })

async function load() {
  const s = await get('/shop')
  Object.assign(shop, { name: s.name, phone: s.phone ?? '', address: s.address ?? '', vat_number: s.vat_number ?? '' })
  icsUrl.value = s.ics_url
}
onMounted(load)

async function saveShop() {
  try {
    await patch('/shop', shop)
    await loadMe()
    toast('Αποθηκεύτηκε')
  } catch (e) {
    toastError(e)
  }
}

const webcal = () => icsUrl.value.replace(/^https?:/, 'webcal:')
async function copyIcs() {
  try {
    await navigator.clipboard.writeText(icsUrl.value)
    toast('Αντιγράφηκε')
  } catch {
    prompt('Αντίγραψε το link:', icsUrl.value)
  }
}
async function rotateIcs() {
  if (!confirm('Νέο link; Το παλιό θα σταματήσει να λειτουργεί σε όσες συσκευές το έχουν.')) return
  await post('/shop/ics-token').catch(toastError)
  await load()
}

async function changePassword() {
  try {
    await post('/auth/password', pw)
    pw.current = pw.next = ''
    toast('Ο κωδικός άλλαξε')
  } catch (e) {
    toastError(e)
  }
}

async function doLogout() {
  await logout()
  router.replace('/login')
}
</script>

<template>
  <div>
    <PageHeader title="Ρυθμίσεις" :subtitle="auth.user?.email" back="/" />
    <div class="space-y-5 p-4">
      <form class="card space-y-3 p-4" @submit.prevent="saveShop">
        <h2 class="font-bold">Στοιχεία συνεργείου</h2>
        <p class="-mt-2 text-xs text-slate-500">Εμφανίζονται στην εκτύπωση του δελτίου εργασίας.</p>
        <input v-model="shop.name" class="input" placeholder="Επωνυμία" :disabled="auth.user?.role !== 'owner'" />
        <input v-model="shop.address" class="input" placeholder="Διεύθυνση" :disabled="auth.user?.role !== 'owner'" />
        <div class="grid grid-cols-2 gap-2">
          <input v-model="shop.phone" class="input" type="tel" placeholder="Τηλέφωνο" :disabled="auth.user?.role !== 'owner'" />
          <input v-model="shop.vat_number" class="input" placeholder="ΑΦΜ" :disabled="auth.user?.role !== 'owner'" />
        </div>
        <button v-if="auth.user?.role === 'owner'" class="btn btn-primary w-full">Αποθήκευση</button>
      </form>

      <section class="card space-y-3 p-4">
        <h2 class="flex items-center gap-2 font-bold"><CalendarDays :size="18" /> Ραντεβού στο ημερολόγιο του iPhone</h2>
        <p class="text-sm text-slate-600">
          Τα ραντεβού εμφανίζονται αυτόματα στο Ημερολόγιο του κινητού (ανανεώνονται κάθε λίγα λεπτά).
        </p>
        <a :href="webcal()" class="btn btn-accent w-full">Προσθήκη στο Ημερολόγιο</a>
        <details class="text-sm text-slate-600">
          <summary class="cursor-pointer font-semibold">Χειροκίνητα / Google Calendar</summary>
          <ol class="mt-2 list-decimal space-y-1 pl-5">
            <li>iPhone: Ρυθμίσεις → Ημερολόγιο → Λογαριασμοί → Προσθήκη → Άλλο → «Προσθήκη συνδρομητικού ημερολογίου».</li>
            <li>Google: calendar.google.com → «Άλλα ημερολόγια» → + → «Από URL».</li>
          </ol>
          <div class="mt-2 flex gap-2">
            <input :value="icsUrl" readonly class="input font-mono !text-xs" @focus="($event.target as HTMLInputElement).select()" />
            <button class="btn btn-ghost shrink-0 !px-3" aria-label="Αντιγραφή" @click="copyIcs"><Copy :size="16" /></button>
          </div>
          <button class="mt-2 flex items-center gap-1 text-xs font-semibold text-rose-600" @click="rotateIcs">
            <RefreshCw :size="12" /> Δημιουργία νέου link
          </button>
        </details>
      </section>

      <form class="card space-y-3 p-4" @submit.prevent="changePassword">
        <h2 class="font-bold">Αλλαγή κωδικού</h2>
        <input v-model="pw.current" class="input" type="password" placeholder="Τρέχων κωδικός" autocomplete="current-password" required />
        <input v-model="pw.next" class="input" type="password" placeholder="Νέος κωδικός (8+ χαρακτήρες)" autocomplete="new-password" minlength="8" required />
        <button class="btn btn-ghost w-full">Αλλαγή κωδικού</button>
      </form>

      <button class="btn btn-danger w-full" @click="doLogout"><LogOut :size="16" /> Αποσύνδεση</button>
    </div>
  </div>
</template>
