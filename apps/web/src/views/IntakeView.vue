<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import VehiclePicker from '../components/VehiclePicker.vue'
import { post } from '../lib/api'
import { emptyIntake, intakeReady } from '../lib/intake'
import { toast, toastError } from '../lib/toast'

const route = useRoute()
const router = useRouter()
const vehicleId = typeof route.query.vehicle === 'string' ? route.query.vehicle : undefined
const intake = ref({ ...emptyIntake(), plate: typeof route.query.plate === 'string' ? route.query.plate : '' })
const complaint = ref('')
const odometer = ref('')
const busy = ref(false)

async function submit() {
  busy.value = true
  try {
    const wo = await post('/work-orders', { ...intake.value, complaint: complaint.value, odometer_km: odometer.value || null })
    toast(`Άνοιξε η κάρτα #${wo.number}`)
    router.replace(`/work-orders/${wo.id}`)
  } catch (e) {
    toastError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="Νέα είσοδος οχήματος" subtitle="Ανοίγει κάρτα εργασίας" back />
    <form class="space-y-4 p-4" @submit.prevent="submit">
      <div class="card p-4">
        <VehiclePicker v-model="intake" :initial-vehicle-id="vehicleId" :autofocus="!intake.plate" />
      </div>
      <div class="card space-y-4 p-4">
        <div>
          <label class="label" for="in-km">Χιλιόμετρα</label>
          <input id="in-km" v-model="odometer" class="input" inputmode="numeric" placeholder="π.χ. 125000" autocomplete="off" />
        </div>
        <div>
          <label class="label" for="in-complaint">Τι λέει ο πελάτης</label>
          <textarea id="in-complaint" v-model="complaint" class="input" rows="4" placeholder="π.χ. Ανάβει λαμπάκι μηχανής, τραντάζει στο ρελαντί" />
        </div>
      </div>
      <button class="btn btn-accent w-full !py-3.5 text-base" :disabled="busy || !intakeReady(intake)">Άνοιγμα κάρτας εργασίας</button>
    </form>
  </div>
</template>
