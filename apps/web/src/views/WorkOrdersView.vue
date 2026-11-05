<script setup lang="ts">
import { ref, watch } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import PlateBadge from '../components/PlateBadge.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { get } from '../lib/api'
import { money, relDay, vehicleName } from '../lib/format'

const FILTERS = [
  { key: 'active', label: 'Ενεργές', status: 'open,in_progress,ready' },
  { key: 'ready', label: 'Έτοιμα', status: 'ready' },
  { key: 'delivered', label: 'Παραδόθηκαν', status: 'delivered' },
  { key: 'all', label: 'Όλες', status: '' },
]
const filter = ref(sessionStorage.getItem('woFilter') ?? 'active')
const items = ref<any[]>([])
const loading = ref(true)

watch(
  filter,
  async (f) => {
    sessionStorage.setItem('woFilter', f)
    loading.value = true
    try {
      items.value = await get('/work-orders', { status: FILTERS.find((x) => x.key === f)?.status || undefined })
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <PageHeader title="Κάρτες εργασίας">
      <div class="flex gap-1.5 overflow-x-auto px-3 pb-3">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          class="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold"
          :class="filter === f.key ? 'bg-brand text-ink' : 'bg-white/10 text-slate-200'"
          @click="filter = f.key"
        >
          {{ f.label }}
        </button>
      </div>
    </PageHeader>
    <section class="space-y-2 p-4">
      <RouterLink v-for="w in items" :key="w.id" :to="`/work-orders/${w.id}`" class="card block p-3">
        <div class="flex items-center gap-2">
          <PlateBadge :plate="w.plate" />
          <span class="text-xs font-semibold text-slate-400">#{{ w.number }}</span>
          <span class="ml-auto"><StatusBadge :status="w.status" /></span>
        </div>
        <p class="mt-2 truncate font-semibold">{{ vehicleName(w) }} <span class="font-normal text-slate-500">· {{ w.customer_name ?? '—' }}</span></p>
        <p v-if="w.complaint" class="line-clamp-2 text-sm text-slate-500">{{ w.complaint }}</p>
        <div class="mt-2 flex justify-between text-xs text-slate-400">
          <span>{{ relDay(w.opened_at) }}</span>
          <span class="font-bold text-slate-700">{{ money(w.total) }}</span>
        </div>
      </RouterLink>
      <p v-if="!items.length && !loading" class="card p-6 text-center text-sm text-slate-500">Καμία κάρτα εργασίας</p>
    </section>
  </div>
</template>
