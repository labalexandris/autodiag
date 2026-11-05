<script setup lang="ts">
import { ArrowRight, Wrench } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { post } from '../lib/api'
import { APPT_STATUS, time, vehicleName, type ApptStatus } from '../lib/format'
import { toastError } from '../lib/toast'
import ContactButtons from './ContactButtons.vue'
import PlateBadge from './PlateBadge.vue'

const props = defineProps<{ appointment: Record<string, any> }>()
defineEmits<{ open: []; changed: [] }>()
const router = useRouter()
const busy = ref(false)

async function start() {
  busy.value = true
  try {
    const r = await post(`/appointments/${props.appointment.id}/start`)
    router.push(`/work-orders/${r.work_order_id}`)
  } catch (e) {
    toastError(e)
  } finally {
    busy.value = false
  }
}
const st = (s: string) => APPT_STATUS[s as ApptStatus]
</script>

<template>
  <div
    class="card flex cursor-pointer gap-3 p-3"
    :class="{ 'opacity-60': ['cancelled', 'no_show', 'done'].includes(appointment.status) }"
    @click="$emit('open')"
  >
    <div class="w-12 shrink-0 text-center">
      <p class="text-base font-extrabold">{{ time(appointment.starts_at) }}</p>
      <p class="text-[11px] text-slate-400">{{ appointment.duration_min }}′</p>
    </div>
    <div class="min-w-0 flex-1 border-l border-slate-100 pl-3">
      <div class="flex flex-wrap items-center gap-2">
        <PlateBadge v-if="appointment.plate" :plate="appointment.plate" size="sm" />
        <span v-if="appointment.status !== 'scheduled'" class="rounded px-1.5 py-0.5 text-[11px] font-semibold" :class="st(appointment.status).cls">
          {{ st(appointment.status).label }}
        </span>
      </div>
      <p class="mt-1 font-semibold">{{ appointment.title }}</p>
      <p class="truncate text-sm text-slate-500">
        {{ [appointment.customer_name, appointment.plate ? vehicleName(appointment) : null].filter(Boolean).join(' · ') || '—' }}
      </p>
      <div class="mt-2 flex items-center gap-2" @click.stop>
        <ContactButtons :phone="appointment.customer_phone" />
        <RouterLink
          v-if="appointment.work_order_id"
          :to="`/work-orders/${appointment.work_order_id}`"
          class="btn btn-ghost ml-auto !px-3 !py-2 text-sm"
        >
          Κάρτα <ArrowRight :size="16" />
        </RouterLink>
        <button
          v-else-if="appointment.vehicle_id && appointment.status === 'scheduled'"
          class="btn btn-accent ml-auto !px-3 !py-2 text-sm"
          :disabled="busy"
          @click="start"
        >
          <Wrench :size="16" /> Ήρθε — άνοιξε κάρτα
        </button>
      </div>
    </div>
  </div>
</template>
