<script setup lang="ts">
import { ChevronRight, Mail, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ContactButtons from '../components/ContactButtons.vue'
import CustomerForm from '../components/CustomerForm.vue'
import PageHeader from '../components/PageHeader.vue'
import PlateBadge from '../components/PlateBadge.vue'
import Sheet from '../components/Sheet.vue'
import StatusBadge from '../components/StatusBadge.vue'
import VehicleForm from '../components/VehicleForm.vue'
import { del, get } from '../lib/api'
import { money, relDay, vehicleName } from '../lib/format'
import { toast, toastError } from '../lib/toast'

const props = defineProps<{ id: string }>()
const router = useRouter()
const c = ref<any>(null)
const editOpen = ref(false)
const vehicleOpen = ref(false)

const load = async () => (c.value = await get(`/customers/${props.id}`))
onMounted(load)

async function remove() {
  if (!confirm(`Διαγραφή του πελάτη ${c.value.full_name}; Τα οχήματα και το ιστορικό τους παραμένουν.`)) return
  try {
    await del(`/customers/${props.id}`)
    toast('Ο πελάτης διαγράφηκε')
    router.replace('/customers')
  } catch (e) {
    toastError(e)
  }
}
</script>

<template>
  <div v-if="c">
    <PageHeader :title="c.full_name" :subtitle="c.phone ?? undefined" back>
      <template #actions>
        <button class="rounded-full p-2 text-slate-300 hover:bg-white/10" aria-label="Επεξεργασία" @click="editOpen = true">
          <Pencil :size="20" />
        </button>
      </template>
    </PageHeader>

    <div class="space-y-5 p-4">
      <section class="card space-y-3 p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0 text-sm">
            <p v-if="c.phone" class="font-semibold">{{ c.phone }}</p>
            <a v-if="c.email" :href="`mailto:${c.email}`" class="flex items-center gap-1 text-slate-500"><Mail :size="14" /> {{ c.email }}</a>
            <p v-if="c.vat_number" class="text-slate-500">ΑΦΜ {{ c.vat_number }}</p>
          </div>
          <ContactButtons :phone="c.phone" />
        </div>
        <p v-if="c.notes" class="rounded-lg bg-amber-50 p-2.5 text-sm whitespace-pre-line text-amber-900">{{ c.notes }}</p>
      </section>

      <section>
        <div class="flex items-center justify-between">
          <h2 class="section-title">Οχήματα</h2>
          <button class="-mt-2 flex items-center gap-1 text-sm font-semibold text-brand-dark" @click="vehicleOpen = true">
            <Plus :size="16" /> Προσθήκη
          </button>
        </div>
        <div class="space-y-2">
          <RouterLink v-for="v in c.vehicles" :key="v.id" :to="`/vehicles/${v.id}`" class="card flex items-center gap-3 p-3">
            <PlateBadge :plate="v.plate" />
            <span class="flex-1 truncate font-semibold">{{ vehicleName(v) }}</span>
            <ChevronRight :size="18" class="text-slate-300" />
          </RouterLink>
          <p v-if="!c.vehicles.length" class="card p-4 text-center text-sm text-slate-500">Κανένα όχημα</p>
        </div>
      </section>

      <section>
        <h2 class="section-title">Ιστορικό εργασιών</h2>
        <div class="space-y-2">
          <RouterLink v-for="w in c.work_orders" :key="w.id" :to="`/work-orders/${w.id}`" class="card block p-3">
            <div class="flex items-center gap-2">
              <PlateBadge :plate="w.plate" size="sm" />
              <span class="text-xs text-slate-400">#{{ w.number }} · {{ relDay(w.opened_at) }}</span>
              <span class="ml-auto"><StatusBadge :status="w.status" /></span>
            </div>
            <div class="mt-1.5 flex justify-between gap-2 text-sm">
              <span class="truncate text-slate-600">{{ w.complaint || '—' }}</span>
              <span class="font-semibold">{{ money(w.total) }}</span>
            </div>
          </RouterLink>
          <p v-if="!c.work_orders.length" class="card p-4 text-center text-sm text-slate-500">Καμία εργασία ακόμα</p>
        </div>
      </section>

      <button class="btn btn-danger w-full" @click="remove"><Trash2 :size="16" /> Διαγραφή πελάτη</button>
    </div>

    <Sheet v-model:open="editOpen" title="Στοιχεία πελάτη">
      <CustomerForm v-if="editOpen" :customer="c" @saved="editOpen = false; load()" />
    </Sheet>
    <Sheet v-model:open="vehicleOpen" title="Νέο όχημα">
      <VehicleForm v-if="vehicleOpen" :customer-id="c.id" @saved="vehicleOpen = false; load()" />
    </Sheet>
  </div>
</template>
