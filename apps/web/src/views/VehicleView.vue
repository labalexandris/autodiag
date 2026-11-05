<script setup lang="ts">
import { CalendarPlus, Pencil, Trash2, Wrench } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppointmentForm from '../components/AppointmentForm.vue'
import ContactButtons from '../components/ContactButtons.vue'
import PageHeader from '../components/PageHeader.vue'
import PlateBadge from '../components/PlateBadge.vue'
import Sheet from '../components/Sheet.vue'
import StatusBadge from '../components/StatusBadge.vue'
import VehicleForm from '../components/VehicleForm.vue'
import { del, get } from '../lib/api'
import { date, km, money, relDay, time, vehicleName } from '../lib/format'
import { toast, toastError } from '../lib/toast'

const props = defineProps<{ id: string }>()
const router = useRouter()
const v = ref<any>(null)
const editOpen = ref(false)
const apptOpen = ref(false)

const load = async () => (v.value = await get(`/vehicles/${props.id}`))
onMounted(load)

async function remove() {
  if (!confirm(`Διαγραφή του οχήματος ${v.value.plate} ΚΑΙ όλου του ιστορικού του;`)) return
  try {
    await del(`/vehicles/${props.id}`)
    toast('Το όχημα διαγράφηκε')
    router.replace('/customers')
  } catch (e) {
    toastError(e)
  }
}

const specs = () =>
  [
    ['Καύσιμο', v.value.fuel],
    ['Κινητήρας', v.value.engine],
    ['VIN', v.value.vin],
  ].filter(([, x]) => x)
</script>

<template>
  <div v-if="v">
    <PageHeader :title="v.plate" :subtitle="vehicleName(v)" back>
      <template #actions>
        <button class="rounded-full p-2 text-slate-300 hover:bg-white/10" aria-label="Επεξεργασία" @click="editOpen = true">
          <Pencil :size="20" />
        </button>
      </template>
    </PageHeader>

    <div class="space-y-5 p-4">
      <section class="card p-4">
        <div class="flex items-center gap-3">
          <PlateBadge :plate="v.plate" size="lg" />
          <p class="font-bold">{{ vehicleName(v) }}</p>
        </div>
        <dl v-if="specs().length" class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <template v-for="[k, val] in specs()" :key="k">
            <dt class="text-slate-500">{{ k }}</dt>
            <dd class="font-medium break-all">{{ val }}</dd>
          </template>
        </dl>
        <p v-if="v.notes" class="mt-3 rounded-lg bg-amber-50 p-2.5 text-sm whitespace-pre-line text-amber-900">{{ v.notes }}</p>
        <div class="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
          <RouterLink v-if="v.customer" :to="`/customers/${v.customer.id}`" class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-slate-400 uppercase">Ιδιοκτήτης</p>
            <p class="truncate font-semibold">{{ v.customer.full_name }}</p>
          </RouterLink>
          <p v-else class="flex-1 text-sm text-slate-500">Χωρίς καταχωρημένο πελάτη</p>
          <ContactButtons :phone="v.customer?.phone" />
        </div>
      </section>

      <div class="grid grid-cols-2 gap-2">
        <RouterLink :to="{ path: '/intake', query: { vehicle: v.id } }" class="btn btn-accent"><Wrench :size="18" /> Νέα κάρτα</RouterLink>
        <button class="btn btn-ghost" @click="apptOpen = true"><CalendarPlus :size="18" /> Ραντεβού</button>
      </div>

      <section v-if="v.appointments.length">
        <h2 class="section-title">Επόμενα ραντεβού</h2>
        <div class="card divide-y divide-slate-100">
          <div v-for="a in v.appointments" :key="a.id" class="flex gap-3 px-4 py-2.5 text-sm">
            <span class="font-semibold">{{ relDay(a.starts_at) }} {{ time(a.starts_at) }}</span>
            <span class="truncate text-slate-600">{{ a.title }}</span>
          </div>
        </div>
      </section>

      <section>
        <h2 class="section-title">Ιστορικό · {{ v.work_orders.length }} επισκέψεις</h2>
        <ol class="relative space-y-3 border-l-2 border-slate-200 pl-4">
          <li v-for="w in v.work_orders" :key="w.id" class="relative">
            <span class="absolute top-4 -left-[23px] h-3 w-3 rounded-full bg-slate-300 ring-4 ring-slate-100" />
            <RouterLink :to="`/work-orders/${w.id}`" class="card block p-3">
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span class="font-semibold text-slate-700">{{ date(w.opened_at) }}</span>
                <span>#{{ w.number }}</span>
                <span>{{ km(w.odometer_km) }}</span>
                <span class="ml-auto"><StatusBadge :status="w.status" /></span>
              </div>
              <p v-if="w.complaint" class="mt-1.5 text-sm font-medium">{{ w.complaint }}</p>
              <p v-if="w.diagnosis" class="mt-0.5 text-sm text-slate-500">→ {{ w.diagnosis }}</p>
              <div class="mt-1.5 flex items-center justify-between">
                <div class="flex flex-wrap gap-1">
                  <span v-for="c in w.dtc_codes" :key="c" class="chip bg-amber-50 font-mono text-[10px] text-amber-900 ring-amber-200">{{ c }}</span>
                </div>
                <span class="text-sm font-bold">{{ money(w.total) }}</span>
              </div>
            </RouterLink>
          </li>
          <li v-if="!v.work_orders.length" class="text-sm text-slate-500">Δεν έχει έρθει ακόμα στο συνεργείο</li>
        </ol>
      </section>

      <button class="btn btn-danger w-full" @click="remove"><Trash2 :size="16" /> Διαγραφή οχήματος</button>
    </div>

    <Sheet v-model:open="editOpen" title="Στοιχεία οχήματος">
      <VehicleForm v-if="editOpen" :vehicle="v" @saved="editOpen = false; load()" />
    </Sheet>
    <Sheet v-model:open="apptOpen" title="Νέο ραντεβού">
      <AppointmentForm v-if="apptOpen" :vehicle-id="v.id" @saved="apptOpen = false; load()" />
    </Sheet>
  </div>
</template>
