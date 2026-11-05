<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import AppointmentCard from '../components/AppointmentCard.vue'
import AppointmentForm from '../components/AppointmentForm.vue'
import PageHeader from '../components/PageHeader.vue'
import Sheet from '../components/Sheet.vue'
import { get } from '../lib/api'
import { addDays, dayLong, sameDay, startOfDay, startOfWeek } from '../lib/format'

const selected = ref(startOfDay(new Date()))
const weekStart = computed(() => startOfWeek(selected.value))
const days = computed(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart.value, i)))
const items = ref<any[]>([])
const loading = ref(false)
const editing = ref<any>(null)
const showNew = ref(false)

async function load() {
  loading.value = true
  try {
    items.value = await get('/appointments', {
      from: weekStart.value.toISOString(),
      to: addDays(weekStart.value, 7).toISOString(),
    })
  } finally {
    loading.value = false
  }
}
watch(weekStart, load, { immediate: true })

const dayItems = computed(() => items.value.filter((a) => sameDay(new Date(a.starts_at), selected.value)))
const countFor = (d: Date) => items.value.filter((a) => a.status !== 'cancelled' && sameDay(new Date(a.starts_at), d)).length

const defaultStart = computed(() => {
  const d = new Date(selected.value)
  const now = new Date()
  if (sameDay(d, now) && now.getHours() >= 8) d.setHours(now.getHours() + 1, 0)
  else d.setHours(9, 0)
  return d
})

const shiftWeek = (n: number) => (selected.value = addDays(selected.value, 7 * n))
const today = () => (selected.value = startOfDay(new Date()))
const weekday = (d: Date) => d.toLocaleDateString('el-GR', { weekday: 'short' }).replace('.', '')
const monthLabel = computed(() => weekStart.value.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' }))

function onSaved() {
  editing.value = null
  showNew.value = false
  load()
}
const editOpen = computed({ get: () => !!editing.value, set: (v) => !v && (editing.value = null) })
</script>

<template>
  <div>
    <PageHeader title="Ραντεβού" :subtitle="monthLabel">
      <template #actions>
        <button class="rounded-full px-3 py-1 text-sm font-semibold text-brand hover:bg-white/10" @click="today">Σήμερα</button>
      </template>
      <div class="flex items-center gap-1 px-2 pb-3">
        <button class="rounded-full p-1.5 text-slate-300 hover:bg-white/10" aria-label="Προηγούμενη εβδομάδα" @click="shiftWeek(-1)">
          <ChevronLeft :size="20" />
        </button>
        <div class="grid flex-1 grid-cols-7 gap-1">
          <button
            v-for="d in days"
            :key="d.toISOString()"
            class="flex flex-col items-center rounded-xl py-1.5"
            :class="sameDay(d, selected) ? 'bg-brand text-ink' : 'text-slate-200 hover:bg-white/10'"
            @click="selected = d"
          >
            <span class="text-[11px] font-semibold uppercase opacity-80">{{ weekday(d) }}</span>
            <span class="text-lg leading-tight font-bold" :class="{ underline: sameDay(d, new Date()) && !sameDay(d, selected) }">
              {{ d.getDate() }}
            </span>
            <span class="flex h-1.5 gap-0.5">
              <span v-for="n in Math.min(countFor(d), 4)" :key="n" class="h-1 w-1 rounded-full" :class="sameDay(d, selected) ? 'bg-ink' : 'bg-brand'" />
            </span>
          </button>
        </div>
        <button class="rounded-full p-1.5 text-slate-300 hover:bg-white/10" aria-label="Επόμενη εβδομάδα" @click="shiftWeek(1)">
          <ChevronRight :size="20" />
        </button>
      </div>
    </PageHeader>

    <section class="p-4">
      <h2 class="section-title capitalize">{{ dayLong(selected) }}</h2>
      <div class="space-y-2">
        <AppointmentCard v-for="a in dayItems" :key="a.id" :appointment="a" @open="editing = a" @changed="load" />
        <div v-if="!dayItems.length && !loading" class="card p-6 text-center">
          <p class="text-sm text-slate-500">Ελεύθερη μέρα</p>
        </div>
      </div>
      <button class="btn btn-primary mt-4 w-full" @click="showNew = true"><Plus :size="18" /> Νέο ραντεβού</button>
    </section>

    <Sheet v-model:open="showNew" title="Νέο ραντεβού">
      <AppointmentForm v-if="showNew" :default-start="defaultStart" @saved="onSaved" />
    </Sheet>
    <Sheet v-model:open="editOpen" title="Ραντεβού">
      <AppointmentForm v-if="editing" :key="editing.id" :appointment="editing" @saved="onSaved" @deleted="onSaved" />
    </Sheet>
  </div>
</template>
