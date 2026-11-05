<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { del, patch, post } from '../lib/api'
import { APPT_STATUS, type ApptStatus, toLocalInput } from '../lib/format'
import { emptyIntake, type IntakeValue } from '../lib/intake'
import { toast, toastError } from '../lib/toast'
import VehiclePicker from './VehiclePicker.vue'

const props = defineProps<{ appointment?: Record<string, any>; defaultStart?: Date; vehicleId?: string }>()
const emit = defineEmits<{ saved: [any]; deleted: [] }>()

const DURATIONS = [
  [30, '30′'], [60, '1 ώρα'], [90, '1½ ώρα'], [120, '2 ώρες'], [180, '3 ώρες'], [240, '4 ώρες'], [480, 'Όλη μέρα'],
] as const

const a = props.appointment
const f = reactive({
  title: a?.title ?? '',
  notes: a?.notes ?? '',
  starts_at: toLocalInput(a?.starts_at ?? props.defaultStart ?? new Date()),
  duration_min: a?.duration_min ?? 60,
})
const intake = ref<IntakeValue>(emptyIntake())
const initialVehicle = a?.vehicle_id ?? props.vehicleId
const saving = ref(false)

const QUICK = ['Διάγνωση βλάβης', 'Check engine', 'Μπαταρία / μίζα / δυναμό', 'A/C', 'Φώτα', 'Service', 'Αισθητήρες παρκαρίσματος']

const intakeChanged = computed(() => intake.value.vehicle_id !== (a?.vehicle_id ?? null) || !!intake.value.plate)

async function submit() {
  saving.value = true
  try {
    const body: Record<string, any> = { ...f, starts_at: new Date(f.starts_at).toISOString() }
    if (!a || intakeChanged.value) Object.assign(body, intake.value)
    const row = a ? await patch(`/appointments/${a.id}`, body) : await post('/appointments', body)
    toast(a ? 'Το ραντεβού ενημερώθηκε' : 'Το ραντεβού καταχωρήθηκε')
    emit('saved', row)
  } catch (e) {
    toastError(e)
  } finally {
    saving.value = false
  }
}

async function setStatus(status: ApptStatus) {
  try {
    emit('saved', await patch(`/appointments/${a!.id}`, { status }))
  } catch (e) {
    toastError(e)
  }
}

async function remove() {
  if (!confirm('Διαγραφή του ραντεβού;')) return
  try {
    await del(`/appointments/${a!.id}`)
    toast('Διαγράφηκε')
    emit('deleted')
  } catch (e) {
    toastError(e)
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <VehiclePicker v-model="intake" :initial-vehicle-id="initialVehicle" />

    <div>
      <label class="label" for="af-title">Τι χρειάζεται *</label>
      <input id="af-title" v-model="f.title" class="input" required placeholder="π.χ. Δεν παίρνει μπρος" autocomplete="off" />
      <div class="mt-2 flex flex-wrap gap-1.5">
        <button
          v-for="t in QUICK"
          :key="t"
          type="button"
          class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
          @click="f.title = f.title ? f.title : t"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-5 gap-3">
      <div class="col-span-3">
        <label class="label" for="af-start">Ημέρα & ώρα</label>
        <input id="af-start" v-model="f.starts_at" class="input" type="datetime-local" step="900" required />
      </div>
      <div class="col-span-2">
        <label class="label" for="af-dur">Διάρκεια</label>
        <select id="af-dur" v-model.number="f.duration_min" class="input">
          <option v-for="[v, l] in DURATIONS" :key="v" :value="v">{{ l }}</option>
        </select>
      </div>
    </div>

    <div>
      <label class="label" for="af-notes">Σημειώσεις</label>
      <textarea id="af-notes" v-model="f.notes" class="input" rows="2" />
    </div>

    <button class="btn btn-primary w-full" :disabled="saving || !f.title.trim()">
      {{ a ? 'Αποθήκευση' : 'Καταχώρηση ραντεβού' }}
    </button>

    <div v-if="a" class="space-y-3 border-t border-slate-100 pt-4">
      <p class="label">Κατάσταση</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(s, key) in APPT_STATUS"
          :key="key"
          type="button"
          class="rounded-full px-3 py-1.5 text-sm font-semibold ring-1"
          :class="a.status === key ? 'bg-ink text-white ring-ink' : 'bg-white text-slate-600 ring-slate-300'"
          @click="setStatus(key)"
        >
          {{ s.label }}
        </button>
      </div>
      <button type="button" class="btn btn-danger w-full" @click="remove">Διαγραφή ραντεβού</button>
    </div>
  </form>
</template>
