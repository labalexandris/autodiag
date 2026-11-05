<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError, patch, post } from '../lib/api'
import { toast, toastError } from '../lib/toast'

const props = defineProps<{ vehicle?: Record<string, any>; customerId?: string }>()
const emit = defineEmits<{ saved: [any] }>()
const router = useRouter()

const f = reactive({
  plate: props.vehicle?.plate ?? '',
  make: props.vehicle?.make ?? '',
  model: props.vehicle?.model ?? '',
  year: props.vehicle?.year ?? '',
  fuel: props.vehicle?.fuel ?? '',
  engine: props.vehicle?.engine ?? '',
  vin: props.vehicle?.vin ?? '',
  notes: props.vehicle?.notes ?? '',
})
const saving = ref(false)
const FUELS = ['Βενζίνη', 'Diesel', 'Υγραέριο', 'Φυσικό αέριο', 'Υβριδικό', 'Ηλεκτρικό']

async function submit() {
  saving.value = true
  try {
    const body = { ...f, ...(props.customerId ? { customer_id: props.customerId } : {}) }
    const row = props.vehicle ? await patch(`/vehicles/${props.vehicle.id}`, body) : await post('/vehicles', body)
    toast(props.vehicle ? 'Αποθηκεύτηκε' : 'Το όχημα προστέθηκε')
    emit('saved', row)
  } catch (e) {
    if (e instanceof ApiError && e.status === 409 && e.data?.existingId) {
      if (confirm(`${e.message}. Άνοιγμα του υπάρχοντος οχήματος;`)) router.push(`/vehicles/${e.data.existingId}`)
      return
    }
    toastError(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit">
    <div>
      <label class="label" for="vf-plate">Πινακίδα *</label>
      <input
        id="vf-plate"
        v-model="f.plate"
        class="input font-mono text-lg font-bold tracking-wider uppercase"
        required
        autocapitalize="characters"
        autocomplete="off"
        spellcheck="false"
      />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label" for="vf-make">Μάρκα</label>
        <input id="vf-make" v-model="f.make" class="input" autocomplete="off" />
      </div>
      <div>
        <label class="label" for="vf-model">Μοντέλο</label>
        <input id="vf-model" v-model="f.model" class="input" autocomplete="off" />
      </div>
      <div>
        <label class="label" for="vf-year">Έτος</label>
        <input id="vf-year" v-model="f.year" class="input" inputmode="numeric" maxlength="4" autocomplete="off" />
      </div>
      <div>
        <label class="label" for="vf-fuel">Καύσιμο</label>
        <select id="vf-fuel" v-model="f.fuel" class="input">
          <option value="">—</option>
          <option v-for="x in FUELS" :key="x">{{ x }}</option>
        </select>
      </div>
      <div class="col-span-2">
        <label class="label" for="vf-engine">Κινητήρας</label>
        <input id="vf-engine" v-model="f.engine" class="input" placeholder="π.χ. 1.6 TDI CAYC" autocomplete="off" />
      </div>
      <div class="col-span-2">
        <label class="label" for="vf-vin">Αριθμός πλαισίου (VIN)</label>
        <input id="vf-vin" v-model="f.vin" class="input font-mono uppercase" maxlength="17" autocomplete="off" spellcheck="false" />
      </div>
    </div>
    <div>
      <label class="label" for="vf-notes">Σημειώσεις</label>
      <textarea id="vf-notes" v-model="f.notes" class="input" rows="2" />
    </div>
    <button class="btn btn-primary w-full" :disabled="saving || f.plate.trim().length < 2">Αποθήκευση</button>
  </form>
</template>
