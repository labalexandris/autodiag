<script setup lang="ts">
import { Car, Search, X } from 'lucide-vue-next'
import { onMounted, ref, watch } from 'vue'
import { get } from '../lib/api'
import { vehicleName } from '../lib/format'
import { emptyIntake, type IntakeValue } from '../lib/intake'
import PlateBadge from './PlateBadge.vue'

/**
 * Επιλογή υπάρχοντος οχήματος με αναζήτηση, ή καταχώρηση νέου (πινακίδα + προαιρετικά πελάτης).
 * Το αποτέλεσμα είναι ένα αντικείμενο "intake" που καταλαβαίνει το API.
 */

interface Hit {
  id: string
  plate: string
  make: string | null
  model: string | null
  year: number | null
  customer_name: string | null
  customer_phone: string | null
}

const value = defineModel<IntakeValue>({ required: true })
const props = defineProps<{ initialVehicleId?: string; autofocus?: boolean }>()

const hits = ref<Hit[]>([])
const selected = ref<Hit | null>(null)
const searching = ref(false)
const inputEl = ref<HTMLInputElement>()
let timer: number | undefined
let seq = 0

watch(
  () => value.value.plate,
  (t) => {
    if (selected.value) return
    clearTimeout(timer)
    if (t.trim().length < 2) {
      hits.value = []
      return
    }
    timer = window.setTimeout(async () => {
      const my = ++seq
      searching.value = true
      try {
        const r = await get<{ vehicles: Hit[] }>('/search', { q: t })
        if (my === seq) hits.value = r.vehicles
      } finally {
        if (my === seq) searching.value = false
      }
    }, 200)
  },
)

function pick(h: Hit) {
  selected.value = h
  hits.value = []
  value.value = { ...emptyIntake(), vehicle_id: h.id, plate: h.plate }
}
function clear() {
  selected.value = null
  value.value = emptyIntake()
  setTimeout(() => inputEl.value?.focus())
}

onMounted(async () => {
  if (props.initialVehicleId) {
    const v = await get(`/vehicles/${props.initialVehicleId}`)
    pick({ ...v, customer_name: v.customer?.full_name ?? null, customer_phone: v.customer?.phone ?? null })
  } else if (props.autofocus) {
    inputEl.value?.focus()
  }
})
</script>

<template>
  <div>
    <!-- Επιλεγμένο όχημα -->
    <div v-if="selected" class="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <PlateBadge :plate="selected.plate" />
      <div class="min-w-0 flex-1">
        <p class="truncate font-semibold">{{ vehicleName(selected) }}</p>
        <p class="truncate text-sm text-slate-500">{{ selected.customer_name ?? 'Χωρίς πελάτη' }}</p>
      </div>
      <button type="button" class="rounded-full p-1.5 text-slate-400 hover:bg-slate-200" aria-label="Αλλαγή οχήματος" @click="clear">
        <X :size="20" />
      </button>
    </div>

    <template v-else>
      <label class="label" for="vp-plate">Πινακίδα</label>
      <div class="relative">
        <Search :size="18" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
        <input
          id="vp-plate"
          ref="inputEl"
          v-model="value.plate"
          class="input !pl-9 font-mono text-lg font-bold tracking-wider uppercase"
          placeholder="π.χ. ΙΚΒ-1234"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
        />
      </div>

      <ul v-if="hits.length" class="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl ring-1 ring-slate-200">
        <li v-for="h in hits" :key="h.id">
          <button type="button" class="flex w-full items-center gap-3 bg-white p-3 text-left hover:bg-slate-50" @click="pick(h)">
            <PlateBadge :plate="h.plate" size="sm" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold">{{ vehicleName(h) }}</span>
              <span class="block truncate text-xs text-slate-500">{{ h.customer_name ?? 'Χωρίς πελάτη' }}</span>
            </span>
          </button>
        </li>
      </ul>

      <!-- Νέο όχημα -->
      <div v-if="value.plate.trim().length >= 2 && !searching" class="mt-3 rounded-xl border border-dashed border-amber-400 bg-amber-50/60 p-3">
        <p class="mb-3 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
          <Car :size="16" />
          {{ hits.length ? 'Ή καταχώρησε νέο όχημα' : 'Νέο όχημα — συμπλήρωσε στοιχεία' }}
        </p>
        <div class="grid grid-cols-2 gap-2">
          <input v-model="value.make" class="input" placeholder="Μάρκα" autocomplete="off" />
          <input v-model="value.model" class="input" placeholder="Μοντέλο" autocomplete="off" />
          <input v-model="value.full_name" class="input col-span-2" placeholder="Ονοματεπώνυμο πελάτη" autocomplete="off" />
          <input v-model="value.phone" class="input col-span-2" type="tel" inputmode="tel" placeholder="Κινητό" autocomplete="off" />
        </div>
      </div>
    </template>
  </div>
</template>
