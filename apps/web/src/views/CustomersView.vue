<script setup lang="ts">
import { ChevronRight, Search, UserPlus } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import CustomerForm from '../components/CustomerForm.vue'
import PageHeader from '../components/PageHeader.vue'
import PlateBadge from '../components/PlateBadge.vue'
import Sheet from '../components/Sheet.vue'
import { get } from '../lib/api'

const router = useRouter()
const term = ref('')
const items = ref<any[]>([])
const showNew = ref(false)
let timer: number | undefined

async function load() {
  items.value = await get('/customers', { q: term.value || undefined })
}
watch(term, () => {
  clearTimeout(timer)
  timer = window.setTimeout(load, 200)
}, { immediate: true })
</script>

<template>
  <div>
    <PageHeader title="Πελάτες" :subtitle="`${items.length} ${term ? 'αποτελέσματα' : 'σύνολο'}`">
      <template #actions>
        <button class="rounded-full p-2 text-brand hover:bg-white/10" aria-label="Νέος πελάτης" @click="showNew = true">
          <UserPlus :size="22" />
        </button>
      </template>
      <div class="px-3 pb-3">
        <div class="relative">
          <Search :size="18" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input
            v-model="term"
            type="search"
            class="block w-full rounded-xl border-0 bg-white py-2.5 pr-3 pl-10 text-slate-900 placeholder:text-slate-400 focus:outline-none"
            placeholder="Όνομα, τηλέφωνο, πινακίδα"
            autocomplete="off"
          />
        </div>
      </div>
    </PageHeader>
    <ul class="mx-4 my-4 divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70">
      <li v-for="c in items" :key="c.id">
        <RouterLink :to="`/customers/${c.id}`" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">{{ c.full_name }}</p>
            <p class="truncate text-sm text-slate-500">{{ c.phone || '—' }}</p>
            <div v-if="c.vehicles.length" class="mt-1.5 flex flex-wrap gap-1">
              <PlateBadge v-for="v in c.vehicles" :key="v.id" :plate="v.plate" size="sm" />
            </div>
          </div>
          <ChevronRight :size="18" class="text-slate-300" />
        </RouterLink>
      </li>
      <li v-if="!items.length" class="p-6 text-center text-sm text-slate-500">Δεν βρέθηκαν πελάτες</li>
    </ul>

    <Sheet v-model:open="showNew" title="Νέος πελάτης">
      <CustomerForm v-if="showNew" @saved="(c) => router.push(`/customers/${c.id}`)" />
    </Sheet>
  </div>
</template>
