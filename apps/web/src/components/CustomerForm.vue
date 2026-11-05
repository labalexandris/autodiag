<script setup lang="ts">
import { reactive, ref } from 'vue'
import { patch, post } from '../lib/api'
import { toast, toastError } from '../lib/toast'

const props = defineProps<{ customer?: Record<string, any> }>()
const emit = defineEmits<{ saved: [any] }>()

const f = reactive({
  full_name: props.customer?.full_name ?? '',
  phone: props.customer?.phone ?? '',
  email: props.customer?.email ?? '',
  vat_number: props.customer?.vat_number ?? '',
  notes: props.customer?.notes ?? '',
})
const saving = ref(false)

async function submit() {
  saving.value = true
  try {
    const row = props.customer ? await patch(`/customers/${props.customer.id}`, f) : await post('/customers', f)
    toast(props.customer ? 'Αποθηκεύτηκε' : 'Ο πελάτης προστέθηκε')
    emit('saved', row)
  } catch (e) {
    toastError(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit">
    <div>
      <label class="label" for="cf-name">Ονοματεπώνυμο *</label>
      <input id="cf-name" v-model="f.full_name" class="input" required autocomplete="off" />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label" for="cf-phone">Τηλέφωνο</label>
        <input id="cf-phone" v-model="f.phone" class="input" type="tel" inputmode="tel" autocomplete="off" />
      </div>
      <div>
        <label class="label" for="cf-vat">ΑΦΜ</label>
        <input id="cf-vat" v-model="f.vat_number" class="input" inputmode="numeric" autocomplete="off" />
      </div>
    </div>
    <div>
      <label class="label" for="cf-email">Email</label>
      <input id="cf-email" v-model="f.email" class="input" type="email" autocomplete="off" />
    </div>
    <div>
      <label class="label" for="cf-notes">Σημειώσεις</label>
      <textarea id="cf-notes" v-model="f.notes" class="input" rows="2" />
    </div>
    <button class="btn btn-primary w-full" :disabled="saving || !f.full_name.trim()">Αποθήκευση</button>
  </form>
</template>
