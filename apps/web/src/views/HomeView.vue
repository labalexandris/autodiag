<script setup lang="ts">
import { CalendarPlus, ChevronRight, Search, Settings, Share, User, X } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppointmentCard from '../components/AppointmentCard.vue'
import AppointmentForm from '../components/AppointmentForm.vue'
import PlateBadge from '../components/PlateBadge.vue'
import Sheet from '../components/Sheet.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { get } from '../lib/api'
import { auth } from '../lib/auth'
import { addDays, dayLong, money, startOfDay, vehicleName } from '../lib/format'

const router = useRouter()
const term = ref('')
const results = ref<{ vehicles: any[]; customers: any[] } | null>(null)
const appointments = ref<any[]>([])
const inShop = ref<any[]>([])
const stats = ref<any>(null)
const editing = ref<any>(null)
const showNew = ref(false)

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Καλημέρα' : h < 18 ? 'Καλησπέρα' : 'Καλό βράδυ'
})
const firstName = computed(() => auth.user?.name.split(' ')[0] ?? '')

// Οδηγία εγκατάστασης για iPhone (αν δεν τρέχει ήδη ως εφαρμογή)
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
const showInstall = ref(isIos && !standalone && localStorage.getItem('hideInstall') !== '1')
function hideInstall() {
  showInstall.value = false
  try {
    localStorage.setItem('hideInstall', '1')
  } catch {}
}

let timer: number | undefined
watch(term, (t) => {
  clearTimeout(timer)
  if (t.trim().length < 2) {
    results.value = null
    return
  }
  timer = window.setTimeout(async () => (results.value = await get('/search', { q: t })), 200)
})

async function load() {
  const from = startOfDay(new Date())
  const [a, w, s] = await Promise.all([
    get('/appointments', { from: from.toISOString(), to: addDays(from, 1).toISOString() }),
    get('/work-orders', { status: 'open,in_progress,ready' }),
    get('/stats'),
  ])
  appointments.value = a
  inShop.value = w
  stats.value = s
}
onMounted(load)

function onSaved() {
  editing.value = null
  showNew.value = false
  load()
}
const editOpen = computed({ get: () => !!editing.value, set: (v) => !v && (editing.value = null) })
</script>

<template>
  <div>
    <header class="bg-ink px-4 pt-safe pb-5 text-white">
      <div class="flex items-start justify-between pt-3">
        <div>
          <p class="text-sm text-slate-400 capitalize">{{ dayLong(new Date()) }}</p>
          <h1 class="text-2xl font-extrabold">{{ greeting }}{{ firstName ? `, ${firstName}` : '' }}</h1>
        </div>
        <RouterLink to="/settings" class="rounded-full p-2 text-slate-300 hover:bg-white/10" aria-label="Ρυθμίσεις">
          <Settings :size="22" />
        </RouterLink>
      </div>
      <div class="relative mt-4">
        <Search :size="20" class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
        <input
          v-model="term"
          type="search"
          class="block w-full rounded-2xl border-0 bg-white py-3.5 pr-4 pl-11 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-brand/50 focus:outline-none"
          placeholder="Πινακίδα, όνομα ή τηλέφωνο"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
        />
      </div>
    </header>

    <!-- Αποτελέσματα αναζήτησης -->
    <section v-if="results" class="space-y-2 p-4">
      <RouterLink
        v-for="v in results.vehicles"
        :key="v.id"
        :to="`/vehicles/${v.id}`"
        class="card flex items-center gap-3 p-3"
      >
        <PlateBadge :plate="v.plate" />
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold">{{ vehicleName(v) }}</p>
          <p class="truncate text-sm text-slate-500">{{ v.customer_name ?? 'Χωρίς πελάτη' }}</p>
        </div>
        <ChevronRight :size="18" class="text-slate-300" />
      </RouterLink>
      <RouterLink
        v-for="c in results.customers"
        :key="c.id"
        :to="`/customers/${c.id}`"
        class="card flex items-center gap-3 p-3"
      >
        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"><User :size="18" /></span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold">{{ c.full_name }}</p>
          <p class="truncate text-sm text-slate-500">{{ c.phone }}</p>
        </div>
        <ChevronRight :size="18" class="text-slate-300" />
      </RouterLink>
      <div v-if="!results.vehicles.length && !results.customers.length" class="card p-5 text-center">
        <p class="text-slate-500">Δεν βρέθηκε τίποτα για «{{ term }}»</p>
      </div>
      <button class="btn btn-accent w-full" @click="router.push({ path: '/intake', query: { plate: term } })">
        Νέα είσοδος με πινακίδα {{ term.toUpperCase() }}
      </button>
    </section>

    <template v-else>
      <div v-if="showInstall" class="mx-4 mt-4 flex gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <Share :size="22" class="mt-0.5 shrink-0 text-amber-700" />
        <p class="flex-1 text-sm text-amber-900">
          Για να ανοίγει σαν εφαρμογή: πάτησε <b>Κοινοποίηση</b> στο Safari και μετά
          <b>«Προσθήκη στην οθόνη αφετηρίας»</b>.
        </p>
        <button class="self-start text-amber-700" aria-label="Απόκρυψη" @click="hideInstall"><X :size="18" /></button>
      </div>

      <!-- Μετρητές -->
      <section v-if="stats" class="grid grid-cols-3 gap-2 px-4 pt-4">
        <RouterLink to="/work-orders" class="card p-3">
          <p class="text-2xl font-extrabold">{{ (stats.by_status.open ?? 0) + (stats.by_status.in_progress ?? 0) }}</p>
          <p class="text-xs font-semibold text-slate-500">Στο συνεργείο</p>
        </RouterLink>
        <RouterLink to="/work-orders" class="card p-3">
          <p class="text-2xl font-extrabold text-emerald-600">{{ stats.by_status.ready ?? 0 }}</p>
          <p class="text-xs font-semibold text-slate-500">Έτοιμα</p>
        </RouterLink>
        <div class="card p-3">
          <p class="truncate text-lg leading-8 font-extrabold">{{ money(stats.month.revenue) }}</p>
          <p class="text-xs font-semibold text-slate-500">Μήνας ({{ stats.month.delivered }})</p>
        </div>
      </section>

      <!-- Σημερινά ραντεβού -->
      <section class="px-4 pt-6">
        <div class="flex items-center justify-between">
          <h2 class="section-title">Ραντεβού σήμερα · {{ appointments.length }}</h2>
          <button class="-mt-2 flex items-center gap-1 text-sm font-semibold text-brand-dark" @click="showNew = true">
            <CalendarPlus :size="16" /> Νέο
          </button>
        </div>
        <div class="space-y-2">
          <AppointmentCard v-for="a in appointments" :key="a.id" :appointment="a" @open="editing = a" @changed="load" />
          <p v-if="!appointments.length" class="card p-5 text-center text-sm text-slate-500">Κανένα ραντεβού για σήμερα</p>
        </div>
      </section>

      <!-- Οχήματα στο συνεργείο -->
      <section class="px-4 pt-6 pb-4">
        <h2 class="section-title">Στο συνεργείο τώρα · {{ inShop.length }}</h2>
        <div class="space-y-2">
          <RouterLink v-for="w in inShop" :key="w.id" :to="`/work-orders/${w.id}`" class="card flex items-center gap-3 p-3">
            <PlateBadge :plate="w.plate" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">{{ vehicleName(w) }}</p>
              <p class="truncate text-xs text-slate-500">{{ w.complaint || w.customer_name || '—' }}</p>
            </div>
            <StatusBadge :status="w.status" />
          </RouterLink>
          <p v-if="!inShop.length" class="card p-5 text-center text-sm text-slate-500">Κανένα όχημα σε εξέλιξη</p>
        </div>
      </section>
    </template>

    <Sheet v-model:open="showNew" title="Νέο ραντεβού">
      <AppointmentForm v-if="showNew" @saved="onSaved" />
    </Sheet>
    <Sheet v-model:open="editOpen" title="Ραντεβού">
      <AppointmentForm v-if="editing" :appointment="editing" @saved="onSaved" @deleted="onSaved" />
    </Sheet>
  </div>
</template>
