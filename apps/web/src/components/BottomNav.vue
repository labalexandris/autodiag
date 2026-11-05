<script setup lang="ts">
import { CalendarDays, Home, Plus, Users, Wrench } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

const route = useRoute()
const tabs = [
  { to: '/', label: 'Σήμερα', icon: Home, match: ['home'] },
  { to: '/calendar', label: 'Ραντεβού', icon: CalendarDays, match: ['calendar'] },
  { to: '/work-orders', label: 'Εργασίες', icon: Wrench, match: ['work-orders', 'work-order'] },
  { to: '/customers', label: 'Πελάτες', icon: Users, match: ['customers', 'customer', 'vehicle'] },
]
const active = (m: string[]) => m.includes(String(route.name))
</script>

<template>
  <nav class="no-print fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-safe">
    <div class="mx-auto grid max-w-2xl grid-cols-5 items-end">
      <RouterLink
        v-for="t in tabs.slice(0, 2)"
        :key="t.to"
        :to="t.to"
        class="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold"
        :class="active(t.match) ? 'text-ink' : 'text-slate-400'"
      >
        <component :is="t.icon" :size="24" :stroke-width="active(t.match) ? 2.4 : 1.8" />
        {{ t.label }}
      </RouterLink>
      <div class="flex justify-center">
        <RouterLink
          to="/intake"
          class="-mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-ink shadow-lg ring-4 ring-white active:scale-95"
          aria-label="Νέα είσοδος οχήματος"
        >
          <Plus :size="30" :stroke-width="2.6" />
        </RouterLink>
      </div>
      <RouterLink
        v-for="t in tabs.slice(2)"
        :key="t.to"
        :to="t.to"
        class="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold"
        :class="active(t.match) ? 'text-ink' : 'text-slate-400'"
      >
        <component :is="t.icon" :size="24" :stroke-width="active(t.match) ? 2.4 : 1.8" />
        {{ t.label }}
      </RouterLink>
    </div>
  </nav>
</template>
